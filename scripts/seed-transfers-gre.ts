import { PrismaClient, SalesDocType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Configurando almacenes múltiples y serie de Guía de Remisión GRE (T001)...");

  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No hay empresa registrada.");

  // 1. Asegurar Almacenes
  const almCentral = await prisma.warehouse.upsert({
    where: {
      companyId_code: {
        companyId: company.id,
        code: "ALM01",
      },
    },
    update: {
      name: "Almacén Central Lima",
      address: "Av. Rivera Navarrete 501, San Isidro, Lima",
      isDefault: true,
    },
    create: {
      companyId: company.id,
      code: "ALM01",
      name: "Almacén Central Lima",
      address: "Av. Rivera Navarrete 501, San Isidro, Lima",
      isDefault: true,
    },
  });

  const almGamarra = await prisma.warehouse.upsert({
    where: {
      companyId_code: {
        companyId: company.id,
        code: "ALM02",
      },
    },
    update: {
      name: "Almacén Tienda Gamarra",
      address: "Jr. Gamarra 840, Galería Industrial, La Victoria, Lima",
      isDefault: false,
    },
    create: {
      companyId: company.id,
      code: "ALM02",
      name: "Almacén Tienda Gamarra",
      address: "Jr. Gamarra 840, Galería Industrial, La Victoria, Lima",
      isDefault: false,
    },
  });

  const almMiraflores = await prisma.warehouse.upsert({
    where: {
      companyId_code: {
        companyId: company.id,
        code: "ALM03",
      },
    },
    update: {
      name: "Almacén Sucursal Miraflores",
      address: "Av. Larco 743, Miraflores, Lima",
      isDefault: false,
    },
    create: {
      companyId: company.id,
      code: "ALM03",
      name: "Almacén Sucursal Miraflores",
      address: "Av. Larco 743, Miraflores, Lima",
      isDefault: false,
    },
  });

  // 2. Serie Documental para Guía de Remisión Remitente (T001)
  await prisma.documentSeries.upsert({
    where: {
      companyId_docType_series: {
        companyId: company.id,
        docType: SalesDocType.GUIA_REMISION,
        series: "T001",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      docType: SalesDocType.GUIA_REMISION,
      series: "T001",
      currentNumber: 1,
      description: "Guía de Remisión Electrónica Remitente (GRE)",
    },
  });

  // 3. Crear stock inicial en Almacén Gamarra y Miraflores si no tienen
  const polo = await prisma.product.findFirst({
    where: { sku: "POLO-ROJ-L" },
  });

  if (polo) {
    await prisma.productStock.upsert({
      where: {
        productId_warehouseId: {
          productId: polo.id,
          warehouseId: almGamarra.id,
        },
      },
      update: {},
      create: {
        productId: polo.id,
        warehouseId: almGamarra.id,
        quantity: 20,
      },
    });

    await prisma.productStock.upsert({
      where: {
        productId_warehouseId: {
          productId: polo.id,
          warehouseId: almMiraflores.id,
        },
      },
      update: {},
      create: {
        productId: polo.id,
        warehouseId: almMiraflores.id,
        quantity: 15,
      },
    });
  }

  console.log("✅ Almacenes configurados:");
  console.log(`- ${almCentral.name} (${almCentral.code})`);
  console.log(`- ${almGamarra.name} (${almGamarra.code})`);
  console.log(`- ${almMiraflores.name} (${almMiraflores.code})`);
  console.log("✅ Serie GRE T001 registrada con éxito.");
}

main().finally(() => prisma.$disconnect());
