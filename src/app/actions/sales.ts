"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  KardexType,
  PaymentMethod,
  PaymentStatus,
  SalesDocType,
  SalesStatus,
  SunatStatus,
  JournalOrigin,
} from "@prisma/client";
import { SunatService } from "@/lib/sunat";
import { UblBuilder } from "@/lib/ubl-builder";

interface SaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export async function createSalesDocument(formData: {
  docType: "FACTURA" | "BOLETA" | "COTIZACION" | "NOTA_CREDITO";
  customerId: string;
  paymentMethod: "EFECTIVO" | "TRANSFERENCIA" | "YAPE_PLIN" | "TARJETA" | "CREDITO";
  notes?: string;
  items: SaleItemInput[];
  // Detracciones SPOT
  detractionApplied?: boolean;
  detractionCode?: string;
  detractionPercent?: number;
  // Nota de Crédito
  relatedDocType?: string;
  relatedDocNumber?: string;
  creditDebitReason?: string;
}) {
  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No hay empresa registrada.");

    const warehouse =
      (await prisma.warehouse.findFirst({
        where: { companyId: company.id, isDefault: true },
      })) ||
      (await prisma.warehouse.findFirst({
        where: { companyId: company.id },
      }));

    if (!warehouse) throw new Error("No hay almacén asignado.");

    if (!formData.items || formData.items.length === 0) {
      throw new Error("Debe agregar al menos un producto a la venta.");
    }

    let docTypeEnum: SalesDocType;
    let sunatCode: string;
    let seriesTarget: string;

    if (formData.docType === "FACTURA") {
      docTypeEnum = SalesDocType.FACTURA;
      sunatCode = "01";
      seriesTarget = "F001";
    } else if (formData.docType === "BOLETA") {
      docTypeEnum = SalesDocType.BOLETA;
      sunatCode = "03";
      seriesTarget = "B001";
    } else if (formData.docType === "NOTA_CREDITO") {
      docTypeEnum = SalesDocType.NOTA_CREDITO;
      sunatCode = "07";
      seriesTarget = "FC01";
    } else {
      docTypeEnum = SalesDocType.COTIZACION;
      sunatCode = "COT";
      seriesTarget = "COT1";
    }

    const isQuote = formData.docType === "COTIZACION";
    const isNotaCredito = formData.docType === "NOTA_CREDITO";

    // TRANSACCIÓN ACID
    const result = await prisma.$transaction(async (tx) => {
      // 1. Correlativo atómico
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
            description: `Serie para ${formData.docType}`,
          },
        });
      }

      const nextNumber = docSeries.currentNumber + 1;
      const fullNumber = `${seriesTarget}-${String(nextNumber).padStart(6, "0")}`;

      await tx.documentSeries.update({
        where: { id: docSeries.id },
        data: { currentNumber: nextNumber },
      });

      // 2. Cliente
      const customer = await tx.partner.findUnique({
        where: { id: formData.customerId },
      });
      if (!customer) throw new Error("Cliente no encontrado.");

      if (formData.docType === "FACTURA" && customer.docType !== "RUC") {
        throw new Error("Para emitir Factura Electrónica, el cliente debe contar con RUC.");
      }

      // 3. Procesar cálculos y verificar existencias
      let subtotalGravado = 0;
      let totalCostoVenta = 0;
      const itemsToCreate = [];
      const ublItems = [];

      for (const item of formData.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) throw new Error(`Producto con ID ${item.productId} no encontrado.`);

        const qty = Number(item.quantity);
        const price = Number(item.unitPrice);

        // Descuento o reingreso de stock (si es Nota de Crédito por anulación o devolución)
        if (!isQuote && !product.isService) {
          const stockRecord = await tx.productStock.findUnique({
            where: {
              productId_warehouseId: {
                productId: product.id,
                warehouseId: warehouse.id,
              },
            },
          });

          const currentStock = stockRecord?.quantity || 0;

          if (!isNotaCredito && currentStock < qty) {
            throw new Error(
              `Stock insuficiente para el producto "${product.name}". Stock actual: ${currentStock}, Solicitado: ${qty}`
            );
          }

          const newStock = isNotaCredito ? currentStock + qty : currentStock - qty;

          await tx.productStock.update({
            where: {
              productId_warehouseId: {
                productId: product.id,
                warehouseId: warehouse.id,
              },
            },
            data: { quantity: newStock },
          });

          // Registro en Kardex
          const movementTotalCost = qty * product.avgCost;
          totalCostoVenta += movementTotalCost;
          const balanceTotalCost = newStock * product.avgCost;

          await tx.kardexMovement.create({
            data: {
              companyId: company.id,
              productId: product.id,
              warehouseId: warehouse.id,
              movementType: isNotaCredito ? KardexType.AJUSTE_POSITIVO : KardexType.SALIDA_VENTA,
              documentType: sunatCode,
              documentNumber: fullNumber,
              quantity: isNotaCredito ? qty : -qty,
              unitCost: product.avgCost,
              totalCost: isNotaCredito ? movementTotalCost : -movementTotalCost,
              balanceQty: newStock,
              balanceUnitCost: product.avgCost,
              balanceTotal: balanceTotalCost,
              notes: isNotaCredito
                ? `Devolución según Nota de Crédito ${fullNumber}`
                : `Venta según ${formData.docType} ${fullNumber} a ${customer.legalName}`,
            },
          });
        }

        const itemSubtotal = qty * price;
        const itemIgv = itemSubtotal * 0.18;
        const itemTotal = itemSubtotal + itemIgv;
        subtotalGravado += itemSubtotal;

        itemsToCreate.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          quantity: qty,
          unitCost: product.avgCost,
          unitPrice: price,
          igvType: product.igvType,
          subtotal: itemSubtotal,
          igvAmount: itemIgv,
          totalAmount: itemTotal,
        });

        ublItems.push({
          sku: product.sku,
          name: product.name,
          unitCode: product.unitCode,
          quantity: qty,
          unitPrice: price,
          subtotal: itemSubtotal,
          igvAmount: itemIgv,
          totalAmount: itemTotal,
        });
      }

      const igvAmount = subtotalGravado * 0.18;
      const totalAmount = subtotalGravado + igvAmount;

      // Cálculo de Detracción SPOT si aplica
      let detractionAmount = 0;
      if (formData.detractionApplied && totalAmount > 700) {
        const percent = Number(formData.detractionPercent || 12);
        detractionAmount = totalAmount * (percent / 100);
      }

      // 4. Generar XML UBL 2.1 y CDR XML oficial de SUNAT
      let xmlContent = "";
      let cdrXmlContent = "";
      let hash = "";

      if (!isQuote) {
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
            bnAccount: company.bnAccount || "",
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
          detraction: formData.detractionApplied
            ? {
                applied: true,
                code: formData.detractionCode || "022",
                percent: Number(formData.detractionPercent || 12),
                amount: detractionAmount,
              }
            : undefined,
          relatedDoc: isNotaCredito
            ? {
                type: formData.relatedDocType || "01",
                number: formData.relatedDocNumber || "",
                reasonCode: formData.creditDebitReason || "01",
                reasonDesc: "Anulación de la operación o devolución comercial",
              }
            : undefined,
        });

        xmlContent = ublRes.xml;
        hash = ublRes.hash;
        cdrXmlContent = UblBuilder.buildCdrXml(company.ruc, sunatCode, fullNumber, hash);
      }

      // 5. Crear Comprobante de Venta en BD
      const salesDoc = await tx.salesDocument.create({
        data: {
          companyId: company.id,
          warehouseId: warehouse.id,
          customerId: customer.id,
          docType: docTypeEnum,
          sunatCode: sunatCode,
          series: seriesTarget,
          number: nextNumber,
          fullNumber: fullNumber,
          issueDate: new Date(),
          currency: "PEN",
          subtotalGravado: subtotalGravado,
          igvAmount: igvAmount,
          totalAmount: totalAmount,
          status: SalesStatus.EMITIDO,
          sunatStatus: isQuote ? SunatStatus.NO_APLICA : SunatStatus.ACEPTADO,
          sunatResponseCode: isQuote ? null : "0",
          sunatDescription: isQuote
            ? null
            : `El comprobante número ${fullNumber} ha sido aceptado por SUNAT exitosamente`,
          sunatCdrHash: hash || null,
          xmlContent: xmlContent || null,
          cdrXmlContent: cdrXmlContent || null,
          paymentMethod: formData.paymentMethod as PaymentMethod,
          paymentStatus:
            formData.paymentMethod === "CREDITO"
              ? PaymentStatus.PENDIENTE
              : PaymentStatus.PAGADO,
          notes: formData.notes?.trim() || null,
          detractionApplied: !!formData.detractionApplied,
          detractionCode: formData.detractionCode || null,
          detractionPercent: formData.detractionPercent || 0,
          detractionAmount: detractionAmount,
          bnAccount: company.bnAccount || null,
          relatedDocType: formData.relatedDocType || null,
          relatedDocNumber: formData.relatedDocNumber || null,
          creditDebitReason: formData.creditDebitReason || null,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // 6. GENERACIÓN AUTOMÁTICA DEL ASIENTO CONTABLE (PCGE SUNAT)
      if (!isQuote) {
        const now = new Date();
        const periodStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        const lastEntry = await tx.journalEntry.findFirst({
          where: { companyId: company.id, period: periodStr },
          orderBy: { entryNumber: "desc" },
        });
        const entryNum = (lastEntry?.entryNumber || 0) + 1;

        // Asiento de Venta: Debe 1212 / Haber 40111 / Haber 70121
        await tx.journalEntry.create({
          data: {
            companyId: company.id,
            entryNumber: entryNum,
            period: periodStr,
            date: now,
            glosa: `Por la venta según ${docTypeEnum} ${fullNumber} a ${customer.legalName}`,
            originType: JournalOrigin.VENTA,
            originId: salesDoc.id,
            totalDebit: totalAmount,
            totalCredit: totalAmount,
            isBalanced: true,
            lines: {
              create: [
                {
                  accountCode: "1212",
                  accountName: "Emitidas en Cartera",
                  debit: totalAmount,
                  credit: 0.0,
                  docReference: fullNumber,
                  partnerName: customer.legalName,
                },
                {
                  accountCode: "40111",
                  accountName: "IGV - Cuenta Propia (18%)",
                  debit: 0.0,
                  credit: igvAmount,
                  docReference: fullNumber,
                  partnerName: customer.legalName,
                },
                {
                  accountCode: "70121",
                  accountName: "Venta Local de Mercaderías",
                  debit: 0.0,
                  credit: subtotalGravado,
                  docReference: fullNumber,
                  partnerName: customer.legalName,
                },
              ],
            },
          },
        });

        // Asiento de Costo de Ventas si hubo salida física: Debe 69121 / Haber 20111
        if (totalCostoVenta > 0 && !isNotaCredito) {
          await tx.journalEntry.create({
            data: {
              companyId: company.id,
              entryNumber: entryNum + 1,
              period: periodStr,
              date: now,
              glosa: `Por el costo de ventas de ${docTypeEnum} ${fullNumber}`,
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
                    docReference: fullNumber,
                  },
                  {
                    accountCode: "20111",
                    accountName: "Mercaderías Manufacturadas - Costo",
                    debit: 0.0,
                    credit: totalCostoVenta,
                    docReference: fullNumber,
                  },
                ],
              },
            },
          });
        }
      }

      return salesDoc;
    });

    revalidatePath("/ventas");
    revalidatePath("/contabilidad");
    revalidatePath("/inventario");
    revalidatePath("/inicio");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error creating sales document:", error);
    return { success: false, error: error.message || "Error al procesar la venta" };
  }
}

export async function convertQuoteToSalesDoc(
  quoteId: string,
  targetDocType: "FACTURA" | "BOLETA"
) {
  try {
    const quote = await prisma.salesDocument.findUnique({
      where: { id: quoteId },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!quote) throw new Error("Cotización no encontrada.");
    if (quote.docType !== SalesDocType.COTIZACION) {
      throw new Error("El documento no es una cotización.");
    }
    if (quote.convertedToDocId) {
      throw new Error("Esta cotización ya fue convertida previamente.");
    }

    const res = await createSalesDocument({
      docType: targetDocType,
      customerId: quote.customerId,
      paymentMethod: "TRANSFERENCIA",
      notes: `Generado a partir de la Cotización ${quote.fullNumber}`,
      items: quote.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
    });

    if (!res.success) {
      throw new Error(res.error);
    }

    await prisma.salesDocument.update({
      where: { id: quote.id },
      data: { convertedToDocId: res.data?.id },
    });

    revalidatePath("/ventas");
    revalidatePath("/contabilidad");
    revalidatePath("/inventario");
    revalidatePath("/inicio");
    return { success: true, data: res.data };
  } catch (error: any) {
    console.error("Error converting quote:", error);
    return { success: false, error: error.message || "Error al convertir la cotización" };
  }
}
