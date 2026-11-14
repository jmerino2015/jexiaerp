"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { IgvType, KardexType, ProductUnitCode } from "@prisma/client";

export async function createProduct(formData: {
  sku: string;
  name: string;
  description?: string;
  unitCode: ProductUnitCode;
  igvType: IgvType;
  avgCost: number;
  salePrice: number;
  minStock: number;
  isService: boolean;
  category?: string;
  initialStock?: number;
}) {
  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No hay empresa registrada en el sistema.");

    const warehouse = await prisma.warehouse.findFirst({
      where: { companyId: company.id, isDefault: true },
    }) || await prisma.warehouse.findFirst({
      where: { companyId: company.id },
    });

    if (!warehouse) throw new Error("No hay almacén disponible.");

    const initialStock = Number(formData.initialStock || 0);
    const avgCost = Number(formData.avgCost || 0);
    const salePrice = Number(formData.salePrice || 0);
    const minStock = Number(formData.minStock || 0);

    // Transacción ACID: Crea producto, stock y movimiento de Kardex si tiene stock inicial
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          companyId: company.id,
          sku: formData.sku.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description?.trim(),
          unitCode: formData.unitCode,
          igvType: formData.igvType,
          avgCost: avgCost,
          lastCost: avgCost,
          salePrice: salePrice,
          minStock: minStock,
          isService: formData.isService,
          category: formData.category?.trim() || "General",
        },
      });

      if (!formData.isService) {
        await tx.productStock.create({
          data: {
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: initialStock,
          },
        });

        if (initialStock > 0) {
          const totalVal = initialStock * avgCost;
          await tx.kardexMovement.create({
            data: {
              companyId: company.id,
              productId: product.id,
              warehouseId: warehouse.id,
              movementType: KardexType.INICIAL,
              documentType: "INICIAL",
              documentNumber: "INV-INICIAL",
              quantity: initialStock,
              unitCost: avgCost,
              totalCost: totalVal,
              balanceQty: initialStock,
              balanceUnitCost: avgCost,
              balanceTotal: totalVal,
              notes: "Stock inicial al registrar producto",
            },
          });
        }
      }

      return product;
    });

    revalidatePath("/inventario");
    revalidatePath("/inicio");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return { success: false, error: error.message || "Error al crear el producto" };
  }
}

export async function createInventoryAdjustment(formData: {
  productId: string;
  adjustmentType: "AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO";
  quantity: number;
  reason: string;
}) {
  try {
    const qty = Math.abs(Number(formData.quantity));
    if (qty <= 0) throw new Error("La cantidad debe ser mayor a cero.");

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: formData.productId },
        include: {
          stocks: true,
          company: true,
        },
      });

      if (!product) throw new Error("Producto no encontrado.");

      const warehouse = await tx.warehouse.findFirst({
        where: { companyId: product.companyId, isDefault: true },
      }) || await tx.warehouse.findFirst({
        where: { companyId: product.companyId },
      });

      if (!warehouse) throw new Error("Almacén no encontrado.");

      const stockRecord = await tx.productStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
      });

      const currentStock = stockRecord?.quantity || 0;
      let newStock = currentStock;
      const isPositive = formData.adjustmentType === "AJUSTE_POSITIVO";

      if (isPositive) {
        newStock = currentStock + qty;
      } else {
        if (currentStock < qty) {
          throw new Error(`Stock insuficiente. Stock actual: ${currentStock}, ajuste requerido: -${qty}`);
        }
        newStock = currentStock - qty;
      }

      await tx.productStock.upsert({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
        update: { quantity: newStock },
        create: {
          productId: product.id,
          warehouseId: warehouse.id,
          quantity: newStock,
        },
      });

      const unitCost = product.avgCost;
      const totalCost = qty * unitCost;

      await tx.kardexMovement.create({
        data: {
          companyId: product.companyId,
          productId: product.id,
          warehouseId: warehouse.id,
          movementType: isPositive ? KardexType.AJUSTE_POSITIVO : KardexType.AJUSTE_NEGATIVO,
          documentType: "AJUSTE",
          documentNumber: `AJ-${Date.now().toString().slice(-6)}`,
          quantity: isPositive ? qty : -qty,
          unitCost: unitCost,
          totalCost: isPositive ? totalCost : -totalCost,
          balanceQty: newStock,
          balanceUnitCost: unitCost,
          balanceTotal: newStock * unitCost,
          notes: formData.reason || "Ajuste manual de inventario",
        },
      });

      return { newStock };
    });

    revalidatePath("/inventario");
    revalidatePath("/inicio");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error adjusting inventory:", error);
    return { success: false, error: error.message || "Error al ajustar el inventario" };
  }
}
