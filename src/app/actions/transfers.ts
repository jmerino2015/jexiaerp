"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { KardexType, SalesDocType, SunatStatus, TransferStatus } from "@prisma/client";
import { buildGreUblXml } from "@/lib/ubl-gre-builder";

export interface CreateTransferInput {
  fromWarehouseId: string;
  toWarehouseId: string;
  transferReason?: string;
  transferReasonDesc?: string;
  transportMode?: string;
  originAddress: string;
  destAddress: string;
  driverName?: string;
  driverDocNumber?: string;
  driverLicense?: string;
  vehiclePlate?: string;
  carrierRuc?: string;
  carrierName?: string;
  totalWeight?: number;
  packagesCount?: number;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export async function createStockTransfer(input: CreateTransferInput) {
  try {
    if (input.fromWarehouseId === input.toWarehouseId) {
      return { success: false, error: "El almacén de origen y destino no pueden ser el mismo." };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Debe seleccionar al menos un producto para transferir." };
    }

    const company = await prisma.company.findFirst();
    if (!company) {
      return { success: false, error: "No hay empresa configurada en el sistema." };
    }

    const [fromWh, toWh] = await Promise.all([
      prisma.warehouse.findUnique({ where: { id: input.fromWarehouseId } }),
      prisma.warehouse.findUnique({ where: { id: input.toWarehouseId } }),
    ]);

    if (!fromWh || !toWh) {
      return { success: false, error: "Almacén de origen o destino no encontrado." };
    }

    // Ejecución transaccional ACID
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener o crear serie de Guía de Remisión (T001)
      let seriesRecord = await tx.documentSeries.findUnique({
        where: {
          companyId_docType_series: {
            companyId: company.id,
            docType: SalesDocType.GUIA_REMISION,
            series: "T001",
          },
        },
      });

      if (!seriesRecord) {
        seriesRecord = await tx.documentSeries.create({
          data: {
            companyId: company.id,
            docType: SalesDocType.GUIA_REMISION,
            series: "T001",
            currentNumber: 0,
            description: "Guía de Remisión Electrónica Remitente (GRE)",
          },
        });
      }

      const nextNumber = seriesRecord.currentNumber + 1;
      const greFullNumber = `T001-${String(nextNumber).padStart(6, "0")}`;
      const transferNumber = `TR-${new Date().getFullYear()}-${String(nextNumber).padStart(5, "0")}`;

      // Actualizar correlativo de la serie
      await tx.documentSeries.update({
        where: { id: seriesRecord.id },
        data: { currentNumber: nextNumber },
      });

      // 2. Validar stock disponible y preparar datos de items
      const itemsData: {
        productId: string;
        sku: string;
        name: string;
        unitCode: string;
        quantity: number;
        unitCost: number;
        totalCost: number;
      }[] = [];

      for (const item of input.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Producto no encontrado.`);
        }

        const originStock = await tx.productStock.findUnique({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: fromWh.id,
            },
          },
        });

        const currentQty = originStock?.quantity || 0;
        if (currentQty < item.quantity) {
          throw new Error(
            `Stock insuficiente para "${product.name}" en ${fromWh.name}. Disponible: ${currentQty}, Solicitado: ${item.quantity}`
          );
        }

        const unitCost = product.avgCost;
        const totalCost = unitCost * item.quantity;

        itemsData.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          unitCode: product.unitCode,
          quantity: item.quantity,
          unitCost,
          totalCost,
        });
      }

      // 3. Generar XML UBL 2.1 de Guía de Remisión y Hash CDR
      const greData = {
        company: {
          ruc: company.ruc,
          businessName: company.businessName,
          tradeName: company.tradeName || undefined,
          fiscalAddress: company.fiscalAddress,
          ubigeo: company.ubigeo || "150131",
        },
        greSeries: "T001",
        greNumber: nextNumber,
        greFullNumber,
        issueDate: new Date(),
        transferReason: input.transferReason || "04",
        transferReasonDesc:
          input.transferReasonDesc || "Traslado entre establecimientos de la misma empresa",
        transportMode: input.transportMode || "02",
        originAddress: input.originAddress || fromWh.address || "Av. Rivera Navarrete 501, San Isidro",
        originUbigeo: "150101",
        destAddress: input.destAddress || toWh.address || "Jr. Gamarra 840, La Victoria",
        destUbigeo: "150101",
        driverDocType: "DNI",
        driverDocNumber: input.driverDocNumber || "45892147",
        driverName: input.driverName || "Juan Carlos Pérez",
        driverLicense: input.driverLicense || "Q45892147",
        vehiclePlate: input.vehiclePlate || "B7X-912",
        carrierRuc: input.carrierRuc,
        carrierName: input.carrierName,
        totalWeight: input.totalWeight || 15.0,
        packagesCount: input.packagesCount || itemsData.length,
        items: itemsData.map((it) => ({
          id: it.productId,
          sku: it.sku,
          name: it.name,
          unitCode: it.unitCode,
          quantity: it.quantity,
        })),
      };

      const { cdrHash } = buildGreUblXml(greData);

      // 4. Crear registro de StockTransfer
      const transfer = await tx.stockTransfer.create({
        data: {
          companyId: company.id,
          transferNumber,
          fromWarehouseId: fromWh.id,
          toWarehouseId: toWh.id,
          status: TransferStatus.COMPLETADA,
          greSeries: "T001",
          greNumber: nextNumber,
          greFullNumber,
          sunatStatus: SunatStatus.ACEPTADO,
          sunatCdrHash: cdrHash,
          transferReason: input.transferReason || "04",
          transferReasonDesc:
            input.transferReasonDesc || "Traslado entre establecimientos de la misma empresa",
          transportMode: input.transportMode || "02",
          originAddress: greData.originAddress,
          originUbigeo: "150101",
          destAddress: greData.destAddress,
          destUbigeo: "150101",
          driverDocNumber: greData.driverDocNumber,
          driverName: greData.driverName,
          driverLicense: greData.driverLicense,
          vehiclePlate: greData.vehiclePlate,
          carrierRuc: input.carrierRuc,
          carrierName: input.carrierName,
          totalWeight: greData.totalWeight,
          packagesCount: greData.packagesCount,
          notes: input.notes,
          items: {
            create: itemsData.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitCost: it.unitCost,
              totalCost: it.totalCost,
            })),
          },
        },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 5. Aplicar movimientos en Kardex y actualizar stock en ambos almacenes
      for (const it of itemsData) {
        // Descontar del origen
        const originStock = await tx.productStock.findUniqueOrThrow({
          where: {
            productId_warehouseId: {
              productId: it.productId,
              warehouseId: fromWh.id,
            },
          },
        });

        const newOriginQty = originStock.quantity - it.quantity;
        await tx.productStock.update({
          where: { id: originStock.id },
          data: { quantity: newOriginQty },
        });

        // Registrar salida en Kardex (Origen)
        await tx.kardexMovement.create({
          data: {
            companyId: company.id,
            productId: it.productId,
            warehouseId: fromWh.id,
            movementType: KardexType.TRANSFERENCIA_SALIDA,
            documentType: "09", // Guía de Remisión Remitente
            documentNumber: greFullNumber,
            quantity: it.quantity,
            unitCost: it.unitCost,
            totalCost: it.totalCost,
            balanceQty: newOriginQty,
            balanceUnitCost: it.unitCost,
            balanceTotal: newOriginQty * it.unitCost,
            notes: `Salida por Transferencia ${transferNumber} hacia ${toWh.name} (GRE: ${greFullNumber})`,
          },
        });

        // Incrementar en destino
        const destStock = await tx.productStock.findUnique({
          where: {
            productId_warehouseId: {
              productId: it.productId,
              warehouseId: toWh.id,
            },
          },
        });

        const currentDestQty = destStock?.quantity || 0;
        const newDestQty = currentDestQty + it.quantity;

        if (destStock) {
          await tx.productStock.update({
            where: { id: destStock.id },
            data: { quantity: newDestQty },
          });
        } else {
          await tx.productStock.create({
            data: {
              productId: it.productId,
              warehouseId: toWh.id,
              quantity: newDestQty,
            },
          });
        }

        // Registrar entrada en Kardex (Destino)
        await tx.kardexMovement.create({
          data: {
            companyId: company.id,
            productId: it.productId,
            warehouseId: toWh.id,
            movementType: KardexType.TRANSFERENCIA_ENTRADA,
            documentType: "09", // Guía de Remisión Remitente
            documentNumber: greFullNumber,
            quantity: it.quantity,
            unitCost: it.unitCost,
            totalCost: it.totalCost,
            balanceQty: newDestQty,
            balanceUnitCost: it.unitCost,
            balanceTotal: newDestQty * it.unitCost,
            notes: `Entrada por Transferencia ${transferNumber} desde ${fromWh.name} (GRE: ${greFullNumber})`,
          },
        });
      }

      return transfer;
    });

    try {
      revalidatePath("/inventario");
      revalidatePath("/inicio");
    } catch {}

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error en createStockTransfer:", error);
    return { success: false, error: error.message || "Error al procesar transferencia interna." };
  }
}
