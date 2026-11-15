import { createStockTransfer } from "../src/app/actions/transfers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creando transferencia demo y emitiendo GRE T001...");

  const [almCentral, almGamarra, polo] = await Promise.all([
    prisma.warehouse.findFirst({ where: { code: "ALM01" } }),
    prisma.warehouse.findFirst({ where: { code: "ALM02" } }),
    prisma.product.findFirst({ where: { sku: "POLO-ROJ-L" } }),
  ]);

  if (!almCentral || !almGamarra || !polo) {
    throw new Error("No se encontraron los almacenes o el polo.");
  }

  const res = await createStockTransfer({
    fromWarehouseId: almCentral.id,
    toWarehouseId: almGamarra.id,
    transferReason: "04",
    transferReasonDesc: "Traslado entre establecimientos de la misma empresa",
    transportMode: "02",
    originAddress: almCentral.address || "Av. Rivera Navarrete 501, San Isidro, Lima",
    destAddress: almGamarra.address || "Jr. Gamarra 840, La Victoria, Lima",
    driverName: "Carlos Alberto Sánchez",
    driverDocNumber: "42109845",
    driverLicense: "Q42109845",
    vehiclePlate: "B7X-912",
    totalWeight: 25.5,
    packagesCount: 2,
    notes: "Abastecimiento de tienda retail para campaña de verano: 25 Polos Rojos Talla L",
    items: [
      {
        productId: polo.id,
        quantity: 25,
      },
    ],
  });

  console.log("Resultado de la Transferencia:", JSON.stringify(res, null, 2));
}

main().finally(() => prisma.$disconnect());
