"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  EcommerceOrderStatus,
  KardexType,
  PartnerDocType,
  PaymentMethod,
  PaymentStatus,
  SalesDocType,
  SalesStatus,
  SunatStatus,
  JournalOrigin,
} from "@prisma/client";
import { UblBuilder } from "@/lib/ubl-builder";

interface CheckoutItem {
  productId: string;
  quantity: number;
}

export async function processEcommerceCheckout(formData: {
  customerName: string;
  customerDocType: "DNI" | "RUC";
  customerDocNumber: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: "DELIVERY" | "PICKUP";
  deliveryAddress?: string;
  deliveryCity?: string;
  shippingCost: number;
  paymentMethod: "YAPE_PLIN" | "TARJETA" | "TRANSFERENCIA";
  invoiceType: "BOLETA" | "FACTURA";
  items: CheckoutItem[];
}) {
  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No hay empresa registrada en el sistema.");

    const warehouse =
      (await prisma.warehouse.findFirst({
        where: { companyId: company.id, isDefault: true },
      })) ||
      (await prisma.warehouse.findFirst({
        where: { companyId: company.id },
      }));

    if (!warehouse) throw new Error("No hay almacén asignado.");

    if (!formData.items || formData.items.length === 0) {
      throw new Error("El carrito de compras está vacío.");
    }

    // Transacción ACID integral: Checkout, Creación de Cliente, Venta SUNAT, Kardex y Contabilidad
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener o crear al cliente
      let customer = await tx.partner.findFirst({
        where: {
          companyId: company.id,
          docNumber: formData.customerDocNumber.trim(),
        },
      });

      if (!customer) {
        customer = await tx.partner.create({
          data: {
            companyId: company.id,
            docType: formData.customerDocType === "RUC" ? PartnerDocType.RUC : PartnerDocType.DNI,
            docNumber: formData.customerDocNumber.trim(),
            legalName: formData.customerName.trim().toUpperCase(),
            address: formData.deliveryAddress?.trim() || "Lima, Perú",
            phone: formData.customerPhone.trim(),
            email: formData.customerEmail.trim(),
            isCustomer: true,
            isSupplier: false,
          },
        });
      }

      // 2. Correlativo de orden e-commerce
      const lastEco = await tx.ecommerceOrder.findFirst({
        where: { companyId: company.id },
        orderBy: { createdAt: "desc" },
      });
      const nextEcoNumber = `ECO-2025-${String((lastEco ? parseInt(lastEco.orderNumber.split("-")[2] || "0") : 0) + 1).padStart(4, "0")}`;

      // 3. Procesar productos y verificar stock
      let subtotalGravado = 0;
      const orderItems = [];
      const salesItems = [];
      const ublItems = [];
      let totalCostoVenta = 0;

      for (const item of formData.items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!prod) throw new Error(`Producto ${item.productId} no encontrado.`);

        const qty = Number(item.quantity);
        const price = prod.salePrice;

        // Descontar existencias físicas si es un bien
        if (!prod.isService) {
          const stockRecord = await tx.productStock.findUnique({
            where: {
              productId_warehouseId: {
                productId: prod.id,
                warehouseId: warehouse.id,
              },
            },
          });
          const curStock = stockRecord?.quantity || 0;
          if (curStock < qty) {
            throw new Error(`Stock insuficiente para "${prod.name}". Stock actual: ${curStock}, pedido: ${qty}`);
          }

          const newStock = curStock - qty;
          await tx.productStock.update({
            where: {
              productId_warehouseId: {
                productId: prod.id,
                warehouseId: warehouse.id,
              },
            },
            data: { quantity: newStock },
          });

          const movTotalCost = qty * prod.avgCost;
          totalCostoVenta += movTotalCost;

          // Registrar movimiento en Kardex
          await tx.kardexMovement.create({
            data: {
              companyId: company.id,
              productId: prod.id,
              warehouseId: warehouse.id,
              movementType: KardexType.SALIDA_VENTA,
              documentType: formData.invoiceType === "FACTURA" ? "01" : "03",
              documentNumber: nextEcoNumber,
              quantity: -qty,
              unitCost: prod.avgCost,
              totalCost: -movTotalCost,
              balanceQty: newStock,
              balanceUnitCost: prod.avgCost,
              balanceTotal: newStock * prod.avgCost,
              notes: `Venta Retail E-commerce Pedido ${nextEcoNumber} - ${formData.customerName}`,
            },
          });
        }

        const itemSubtotal = (price / 1.18) * qty; // Base imponible
        const itemIgv = price * qty - itemSubtotal;
        const itemTotal = price * qty;
        subtotalGravado += itemSubtotal;

        orderItems.push({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: qty,
          unitPrice: price,
          total: itemTotal,
        });

        salesItems.push({
          productId: prod.id,
          sku: prod.sku,
          name: prod.name,
          quantity: qty,
          unitCost: prod.avgCost,
          unitPrice: price,
          igvType: prod.igvType,
          subtotal: itemSubtotal,
          igvAmount: itemIgv,
          totalAmount: itemTotal,
        });

        ublItems.push({
          sku: prod.sku,
          name: prod.name,
          unitCode: prod.unitCode,
          quantity: qty,
          unitPrice: price,
          subtotal: itemSubtotal,
          igvAmount: itemIgv,
          totalAmount: itemTotal,
        });
      }

      const shippingCost = Number(formData.shippingCost || 0);
      const igvAmount = subtotalGravado * 0.18;
      const totalAmount = subtotalGravado + igvAmount + shippingCost;

      // 4. Emisión atómica del Comprobante Electrónico SUNAT
      const docTypeEnum = formData.invoiceType === "FACTURA" ? SalesDocType.FACTURA : SalesDocType.BOLETA;
      const sunatCode = formData.invoiceType === "FACTURA" ? "01" : "03";
      const seriesTarget = formData.invoiceType === "FACTURA" ? "F001" : "B001";

      let docSeries = await tx.documentSeries.findUnique({
        where: {
          companyId_docType_series: {
            companyId: company.id,
            docType: docTypeEnum,
            series: seriesTarget,
          },
        },
      });

      if (!docSeries) {
        docSeries = await tx.documentSeries.create({
          data: {
            companyId: company.id,
            docType: docTypeEnum,
            series: seriesTarget,
            currentNumber: 0,
            description: `Serie para ${formData.invoiceType}`,
          },
        });
      }

      const nextNumber = docSeries.currentNumber + 1;
      const fullDocNumber = `${seriesTarget}-${String(nextNumber).padStart(6, "0")}`;

      await tx.documentSeries.update({
        where: { id: docSeries.id },
        data: { currentNumber: nextNumber },
      });

      // UBL 2.1 y CDR
      const ublRes = UblBuilder.buildInvoiceXml({
        company: {
          ruc: company.ruc,
          businessName: company.businessName,
          tradeName: company.tradeName || "",
          address: company.fiscalAddress,
          ubigeo: company.ubigeo || "150131",
          department: company.department || "Lima",
          province: company.province || "Lima",
          district: company.district || "San Isidro",
        },
        customer: {
          docType: customer.docType as any,
          docNumber: customer.docNumber,
          legalName: customer.legalName,
          address: customer.address || "",
        },
        docType: sunatCode as any,
        series: seriesTarget,
        number: nextNumber,
        issueDate: new Date(),
        currency: "PEN",
        subtotalGravado: subtotalGravado,
        igvAmount: igvAmount,
        totalAmount: totalAmount,
        items: ublItems,
      });

      const cdrXml = UblBuilder.buildCdrXml(company.ruc, sunatCode, fullDocNumber, ublRes.hash);

      const salesDoc = await tx.salesDocument.create({
        data: {
          companyId: company.id,
          warehouseId: warehouse.id,
          customerId: customer.id,
          docType: docTypeEnum,
          sunatCode: sunatCode,
          series: seriesTarget,
          number: nextNumber,
          fullNumber: fullDocNumber,
          issueDate: new Date(),
          currency: "PEN",
          subtotalGravado: subtotalGravado,
          igvAmount: igvAmount,
          totalAmount: totalAmount,
          status: SalesStatus.EMITIDO,
          sunatStatus: SunatStatus.ACEPTADO,
          sunatResponseCode: "0",
          sunatDescription: `El comprobante electrónico ${fullDocNumber} ha sido aceptado por SUNAT.`,
          sunatCdrHash: ublRes.hash,
          xmlContent: ublRes.xml,
          cdrXmlContent: cdrXml,
          paymentMethod:
            formData.paymentMethod === "TARJETA"
              ? PaymentMethod.TARJETA
              : formData.paymentMethod === "YAPE_PLIN"
              ? PaymentMethod.YAPE_PLIN
              : PaymentMethod.TRANSFERENCIA,
          paymentStatus: PaymentStatus.PAGADO,
          notes: `Venta Retail E-commerce Web Orden ${nextEcoNumber}`,
          items: {
            create: salesItems,
          },
        },
      });

      // 5. Crear Orden E-commerce
      const ecoOrder = await tx.ecommerceOrder.create({
        data: {
          companyId: company.id,
          orderNumber: nextEcoNumber,
          customerName: formData.customerName.trim(),
          customerDocType: formData.customerDocType,
          customerDocNumber: formData.customerDocNumber.trim(),
          customerEmail: formData.customerEmail.trim(),
          customerPhone: formData.customerPhone.trim(),
          deliveryMethod: formData.deliveryMethod,
          deliveryAddress: formData.deliveryAddress?.trim() || null,
          deliveryCity: formData.deliveryCity || "Lima",
          shippingCost: shippingCost,
          paymentMethod: formData.paymentMethod,
          paymentStatus: "PAGADO",
          orderStatus: EcommerceOrderStatus.PAGADO_PREPARANDO,
          subtotal: subtotalGravado,
          igv: igvAmount,
          total: totalAmount,
          salesDocumentId: salesDoc.id,
          salesDocumentNumber: fullDocNumber,
          trackingNotes: `Pedido pagado con ${formData.paymentMethod}. Preparando despacho en Almacén Central Lima.`,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      });

      // 6. Asiento Contable Automático en Libro Diario (PCGE)
      const now = new Date();
      const periodStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const lastEntry = await tx.journalEntry.findFirst({
        where: { companyId: company.id, period: periodStr },
        orderBy: { entryNumber: "desc" },
      });
      const entryNum = (lastEntry?.entryNumber || 0) + 1;

      // Asiento Venta E-commerce: Debe 1041 (Bancos) / Haber 40111 (IGV) / Haber 70121 (Venta)
      await tx.journalEntry.create({
        data: {
          companyId: company.id,
          entryNumber: entryNum,
          period: periodStr,
          date: now,
          glosa: `Venta Retail E-commerce ${nextEcoNumber} con ${salesDoc.fullNumber} a ${customer.legalName}`,
          originType: JournalOrigin.VENTA,
          originId: salesDoc.id,
          totalDebit: totalAmount,
          totalCredit: totalAmount,
          isBalanced: true,
          lines: {
            create: [
              {
                accountCode: "1041",
                accountName: "Cuentas Corrientes BCP (Pasarela Online)",
                debit: totalAmount,
                credit: 0.0,
                docReference: fullDocNumber,
                partnerName: customer.legalName,
              },
              {
                accountCode: "40111",
                accountName: "IGV - Cuenta Propia (18%)",
                debit: 0.0,
                credit: igvAmount,
                docReference: fullDocNumber,
                partnerName: customer.legalName,
              },
              {
                accountCode: "70121",
                accountName: "Venta Local de Mercaderías Retail",
                debit: 0.0,
                credit: subtotalGravado + shippingCost,
                docReference: fullDocNumber,
                partnerName: customer.legalName,
              },
            ],
          },
        },
      });

      // Asiento Costo de Ventas
      if (totalCostoVenta > 0) {
        await tx.journalEntry.create({
          data: {
            companyId: company.id,
            entryNumber: entryNum + 1,
            period: periodStr,
            date: now,
            glosa: `Costo de ventas E-commerce ${nextEcoNumber}`,
            originType: JournalOrigin.COSTO_VENTAS,
            originId: salesDoc.id,
            totalDebit: totalCostoVenta,
            totalCredit: totalCostoVenta,
            isBalanced: true,
            lines: {
              create: [
                {
                  accountCode: "69121",
                  accountName: "Costo de Ventas - Mercaderías Locales",
                  debit: totalCostoVenta,
                  credit: 0.0,
                  docReference: fullDocNumber,
                },
                {
                  accountCode: "20111",
                  accountName: "Mercaderías Manufacturadas - Costo",
                  debit: 0.0,
                  credit: totalCostoVenta,
                  docReference: fullDocNumber,
                },
              ],
            },
          },
        });
      }

      return {
        order: ecoOrder,
        salesDoc: salesDoc,
      };
    });

    revalidatePath("/ecommerce");
    revalidatePath("/ventas");
    revalidatePath("/inventario");
    revalidatePath("/contabilidad");
    revalidatePath("/inicio");

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error in ecommerce checkout:", error);
    return { success: false, error: error.message || "Error al procesar el pedido online." };
  }
}

export async function updateEcommerceOrderStatus(
  orderId: string,
  newStatus: "PAGADO_PREPARANDO" | "EN_RUTA_DELIVERY" | "ENTREGADO" | "CANCELADO",
  trackingNotes?: string
) {
  try {
    const updated = await prisma.ecommerceOrder.update({
      where: { id: orderId },
      data: {
        orderStatus: newStatus as EcommerceOrderStatus,
        trackingNotes: trackingNotes?.trim() || null,
      },
    });

    revalidatePath("/ecommerce");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
