"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { LotStatus, KardexType } from "@prisma/client";

export interface CreateLotInput {
  productId: string;
  warehouseId: string;
  lotNumber: string;
  manufactureDate?: string | Date;
  expirationDate?: string | Date;
  initialQty: number;
  notes?: string;
}

export async function createProductLot(input: CreateLotInput) {
  try {
    const company = await prisma.company.findFirst();
    if (!company) return { success: false, error: "No hay empresa registrada." };

    const product = await prisma.product.findUnique({
      where: { id: input.productId },
    });
    if (!product) return { success: false, error: "Producto no encontrado." };

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: input.warehouseId },
    });
    if (!warehouse) return { success: false, error: "Almacén no encontrado." };

    const initialQty = Number(input.initialQty || 0);

    // Calcular estado según fecha de vencimiento
    let status: LotStatus = LotStatus.DISPONIBLE;
    const now = new Date();

    if (input.expirationDate) {
      const expDate = new Date(input.expirationDate);
      const alertLimit = new Date();
      alertLimit.setDate(now.getDate() + (product.alertDays || 30));

      if (expDate <= now) {
        status = LotStatus.VENCIDO;
      } else if (expDate <= alertLimit) {
        status = LotStatus.POR_VENCER;
      }
    }

    if (initialQty === 0) {
      status = LotStatus.AGOTADO;
    }

    const result = await prisma.$transaction(async (tx) => {
      const lot = await tx.productLot.create({
        data: {
          companyId: company.id,
          productId: product.id,
          warehouseId: warehouse.id,
          lotNumber: input.lotNumber.trim().toUpperCase(),
          manufactureDate: input.manufactureDate ? new Date(input.manufactureDate) : null,
          expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
          initialQty,
          currentQty: initialQty,
          status,
          notes: input.notes?.trim(),
        },
      });

      // Si tiene cantidad inicial, ingresarla a Kardex y ProductStock
      if (initialQty > 0) {
        const existingStock = await tx.productStock.findUnique({
          where: {
            productId_warehouseId: {
              productId: product.id,
              warehouseId: warehouse.id,
            },
          },
        });

        const currentWhQty = existingStock?.quantity || 0;
        const newWhQty = currentWhQty + initialQty;

        if (existingStock) {
          await tx.productStock.update({
            where: { id: existingStock.id },
            data: { quantity: newWhQty },
          });
        } else {
          await tx.productStock.create({
            data: {
              productId: product.id,
              warehouseId: warehouse.id,
              quantity: newWhQty,
            },
          });
        }

        await tx.kardexMovement.create({
          data: {
            companyId: company.id,
            productId: product.id,
            warehouseId: warehouse.id,
            movementType: KardexType.INICIAL,
            documentType: "LOTE",
            documentNumber: `LOTE-${lot.lotNumber}`,
            quantity: initialQty,
            unitCost: product.avgCost,
            totalCost: initialQty * product.avgCost,
            balanceQty: newWhQty,
            balanceUnitCost: product.avgCost,
            balanceTotal: newWhQty * product.avgCost,
            lotId: lot.id,
            lotNumber: lot.lotNumber,
            notes: `Apertura de lote ${lot.lotNumber} en ${warehouse.name}`,
          },
        });
      }

      return lot;
    });

    try {
      revalidatePath("/inventario");
      revalidatePath("/inicio");
    } catch {}

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error creating lot:", error);
    return { success: false, error: error.message || "Error al crear el lote." };
  }
}
