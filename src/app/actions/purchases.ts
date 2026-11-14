"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { KardexType, PurchaseStatus } from "@prisma/client";

interface PurchaseItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export async function createPurchaseOrder(formData: {
  supplierId: string;
  notes?: string;
  items: PurchaseItemInput[];
}) {
  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No hay empresa registrada.");

    const warehouse = await prisma.warehouse.findFirst({
      where: { companyId: company.id, isDefault: true },
    }) || await prisma.warehouse.findFirst({
      where: { companyId: company.id },
    });

    if (!warehouse) throw new Error("No hay almacén asignado.");

    if (!formData.items || formData.items.length === 0) {
      throw new Error("Debe agregar al menos un producto a la orden de compra.");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Obtener el último número de orden de compra
      const lastPO = await tx.purchaseOrder.findFirst({
        where: { companyId: company.id },
        orderBy: { number: "desc" },
      });

      const nextNumber = (lastPO?.number || 0) + 1;
      const fullNumber = `OC01-${String(nextNumber).padStart(6, "0")}`;

      let subtotal = 0;
      const orderItems = formData.items.map((item) => {
        const qty = Number(item.quantity);
        const cost = Number(item.unitCost);
        const itemSubtotal = qty * cost;
        const itemIgv = itemSubtotal * 0.18;
        const itemTotal = itemSubtotal + itemIgv;
        subtotal += itemSubtotal;

        return {
          productId: item.productId,
          quantity: qty,
          receivedQty: 0,
          unitCost: cost,
          subtotal: itemSubtotal,
          igv: itemIgv,
          total: itemTotal,
        };
      });

      const igv = subtotal * 0.18;
      const total = subtotal + igv;

      const po = await tx.purchaseOrder.create({
        data: {
          companyId: company.id,
          warehouseId: warehouse.id,
          supplierId: formData.supplierId,
          series: "OC01",
          number: nextNumber,
          fullNumber: fullNumber,
          status: PurchaseStatus.EMITIDA,
          subtotal: subtotal,
          igv: igv,
          total: total,
          notes: formData.notes?.trim() || "Orden de compra regular",
          items: {
            create: orderItems,
          },
        },
      });

      return po;
    });

    revalidatePath("/compras");
    revalidatePath("/inicio");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error creating purchase order:", error);
    return { success: false, error: error.message || "Error al emitir orden de compra" };
  }
}

/**
 * RECEPCIÓN TRANSACCIONAL DE MERCADERÍA CON FACTURA DEL PROVEEDOR
 * - Transacción ACID
 * - Incrementa ProductStock
 * - Recalcula automáticamente el Costo Promedio Ponderado
 * - Registra movimiento oficial en KardexMovement (ENTRADA_COMPRA)
 * - Actualiza estado de PurchaseOrder a COMPLETADA
 */
export async function receivePurchaseOrder(orderId: string, supplierInvoice: string) {
  try {
    if (!supplierInvoice || supplierInvoice.trim().length === 0) {
      throw new Error("Debe ingresar el número de factura o guía de remisión del proveedor (ej: F001-8930).");
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          supplier: true,
        },
      });

      if (!order) throw new Error("Orden de compra no encontrada.");
      if (order.status === PurchaseStatus.COMPLETADA) {
        throw new Error("Esta orden de compra ya fue recepcionada en su totalidad.");
      }

      // Procesar cada ítem de la orden de compra
      for (const item of order.items) {
        // Solo para productos físicos (no servicios intangibles)
        if (!item.product.isService) {
          // Obtener stock actual
          const currentStockRecord = await tx.productStock.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: order.warehouseId,
              },
            },
          });

          const currentStockQty = currentStockRecord?.quantity || 0;
          const currentAvgCost = item.product.avgCost;

          const purchasedQty = item.quantity;
          const purchasedUnitCost = item.unitCost;

          // Fórmula de Costo Promedio Ponderado:
          // Nuevo Costo = ((Stock Actual * Costo Actual) + (Cant Comprada * Precio Compra)) / (Stock Actual + Cant Comprada)
          const newStockQty = currentStockQty + purchasedQty;
          let newAvgCost = purchasedUnitCost;

          if (newStockQty > 0) {
            const currentTotalValuation = currentStockQty * currentAvgCost;
            const newPurchaseValuation = purchasedQty * purchasedUnitCost;
            newAvgCost = (currentTotalValuation + newPurchaseValuation) / newStockQty;
          }

          // 1. Actualizar stock físico en el almacén
          await tx.productStock.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: order.warehouseId,
              },
            },
            update: { quantity: newStockQty },
            create: {
              productId: item.productId,
              warehouseId: order.warehouseId,
              quantity: newStockQty,
            },
          });

          // 2. Actualizar costo promedio y último costo en el maestro de productos
          await tx.product.update({
            where: { id: item.productId },
            data: {
              avgCost: Math.round(newAvgCost * 100) / 100,
              lastCost: purchasedUnitCost,
            },
          });

          // 3. Registrar entrada oficial en KardexMovement
          const totalCostMovement = purchasedQty * purchasedUnitCost;
          const newBalanceTotal = newStockQty * newAvgCost;

          await tx.kardexMovement.create({
            data: {
              companyId: order.companyId,
              productId: item.productId,
              warehouseId: order.warehouseId,
              movementType: KardexType.ENTRADA_COMPRA,
              documentType: "OC",
              documentNumber: `${order.fullNumber} / ${supplierInvoice.trim()}`,
              quantity: purchasedQty,
              unitCost: purchasedUnitCost,
              totalCost: totalCostMovement,
              balanceQty: newStockQty,
              balanceUnitCost: Math.round(newAvgCost * 100) / 100,
              balanceTotal: Math.round(newBalanceTotal * 100) / 100,
              notes: `Recepción de mercadería de ${order.supplier.legalName}. Factura Prov: ${supplierInvoice.trim()}`,
            },
          });

          // 4. Actualizar cantidad recibida en el ítem de la orden
          await tx.purchaseOrderItem.update({
            where: { id: item.id },
            data: { receivedQty: item.quantity },
          });
        }
      }

      // Marcar orden como completada
      const updatedOrder = await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: PurchaseStatus.COMPLETADA,
          supplierInvoice: supplierInvoice.trim(),
          receivedAt: new Date(),
        },
      });

      return updatedOrder;
    });

    revalidatePath("/compras");
    revalidatePath("/inventario");
    revalidatePath("/inicio");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error receiving purchase order:", error);
    return { success: false, error: error.message || "Error al procesar la recepción" };
  }
}
