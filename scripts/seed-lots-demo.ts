import { PrismaClient, TrackingType, LotStatus, KardexType, ProductUnitCode } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Poblando productos y lotes con trazabilidad y vencimientos...");

  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No hay empresa.");

  const [almCentral, almGamarra] = await Promise.all([
    prisma.warehouse.findFirst({ where: { code: "ALM01" } }),
    prisma.warehouse.findFirst({ where: { code: "ALM02" } }),
  ]);

  if (!almCentral || !almGamarra) throw new Error("No hay almacenes.");

  // 1. Configurar POLO VERANO COLOR ROJO TALLA L con lote de confección
  const polo = await prisma.product.findFirst({
    where: { sku: "POLO-ROJ-L" },
  });

  if (polo) {
    await prisma.product.update({
      where: { id: polo.id },
      data: {
        trackingType: TrackingType.LOT,
        hasExpiryDate: false,
        alertDays: 0,
      },
    });

    // Lote en Almacén Central Lima (125 unidades)
    await prisma.productLot.upsert({
      where: {
        companyId_productId_warehouseId_lotNumber: {
          companyId: company.id,
          productId: polo.id,
          warehouseId: almCentral.id,
          lotNumber: "LOT-2026-POL-01",
        },
      },
      update: {
        currentQty: 125,
        status: LotStatus.DISPONIBLE,
      },
      create: {
        companyId: company.id,
        productId: polo.id,
        warehouseId: almCentral.id,
        lotNumber: "LOT-2026-POL-01",
        manufactureDate: new Date("2026-01-10"),
        initialQty: 150,
        currentQty: 125,
        status: LotStatus.DISPONIBLE,
        notes: "Partida de confección 100% algodón pima rojo",
      },
    });

    // Lote en Almacén Tienda Gamarra (45 unidades)
    await prisma.productLot.upsert({
      where: {
        companyId_productId_warehouseId_lotNumber: {
          companyId: company.id,
          productId: polo.id,
          warehouseId: almGamarra.id,
          lotNumber: "LOT-2026-POL-02",
        },
      },
      update: {
        currentQty: 45,
        status: LotStatus.DISPONIBLE,
      },
      create: {
        companyId: company.id,
        productId: polo.id,
        warehouseId: almGamarra.id,
        lotNumber: "LOT-2026-POL-02",
        manufactureDate: new Date("2026-02-01"),
        initialQty: 45,
        currentQty: 45,
        status: LotStatus.DISPONIBLE,
        notes: "Lote recibido por transferencia TR-2026-00002",
      },
    });
  }

  // 2. Producto de Demostración con Vencimiento: CAFÉ ORGÁNICO CUSCO 500G
  const cafe = await prisma.product.upsert({
    where: {
      companyId_sku: {
        companyId: company.id,
        sku: "ALIM-CAF-500",
      },
    },
    update: {
      trackingType: TrackingType.LOT,
      hasExpiryDate: true,
      alertDays: 45,
      avgCost: 18.0,
      salePrice: 38.0,
      minStock: 10,
    },
    create: {
      companyId: company.id,
      sku: "ALIM-CAF-500",
      name: "CAFÉ ORGÁNICO CUSCO GOURMET 500G",
      category: "Alimentos y Bebidas",
      brand: "Alturas de Quillabamba",
      unitCode: ProductUnitCode.NIU,
      avgCost: 18.0,
      lastCost: 18.0,
      salePrice: 38.0,
      minStock: 10,
      trackingType: TrackingType.LOT,
      hasExpiryDate: true,
      alertDays: 45,
      isEcommerce: true,
      stocks: {
        create: {
          warehouseId: almCentral.id,
          quantity: 80,
        },
      },
    },
  });

  // Movimiento Kardex Café
  const existingKardexCafe = await prisma.kardexMovement.findFirst({
    where: { productId: cafe.id, documentNumber: "INV-INICIAL-CAFE" },
  });

  if (!existingKardexCafe) {
    await prisma.kardexMovement.create({
      data: {
        companyId: company.id,
        productId: cafe.id,
        warehouseId: almCentral.id,
        movementType: KardexType.INICIAL,
        documentType: "INICIAL",
        documentNumber: "INV-INICIAL-CAFE",
        quantity: 80,
        unitCost: 18.0,
        totalCost: 1440.0,
        balanceQty: 80,
        balanceUnitCost: 18.0,
        balanceTotal: 1440.0,
        notes: "Stock inicial café con control de lotes",
      },
    });
  }

  // Lotes del Café: 1 Disponible, 1 Por Vencer, 1 Vencido
  const now = new Date();

  // Lote A: Disponible (vence en 7 meses)
  const expDateA = new Date();
  expDateA.setMonth(now.getMonth() + 7);
  await prisma.productLot.upsert({
    where: {
      companyId_productId_warehouseId_lotNumber: {
        companyId: company.id,
        productId: cafe.id,
        warehouseId: almCentral.id,
        lotNumber: "LOT-CAF-2026-A",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      productId: cafe.id,
      warehouseId: almCentral.id,
      lotNumber: "LOT-CAF-2026-A",
      manufactureDate: new Date("2026-01-15"),
      expirationDate: expDateA,
      initialQty: 50,
      currentQty: 50,
      status: LotStatus.DISPONIBLE,
      notes: "Tueste medio artesanal en grano",
    },
  });

  // Lote B: Por Vencer (vence en 20 días - Alerta Ámbar)
  const expDateB = new Date();
  expDateB.setDate(now.getDate() + 20);
  await prisma.productLot.upsert({
    where: {
      companyId_productId_warehouseId_lotNumber: {
        companyId: company.id,
        productId: cafe.id,
        warehouseId: almCentral.id,
        lotNumber: "LOT-CAF-2026-B",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      productId: cafe.id,
      warehouseId: almCentral.id,
      lotNumber: "LOT-CAF-2026-B",
      manufactureDate: new Date("2025-05-10"),
      expirationDate: expDateB,
      initialQty: 25,
      currentQty: 25,
      status: LotStatus.POR_VENCER,
      notes: "Prioridad FEFO para promociones y salida rápida",
    },
  });

  // Lote C: Vencido (venció hace 10 días - Alerta Roja)
  const expDateC = new Date();
  expDateC.setDate(now.getDate() - 10);
  await prisma.productLot.upsert({
    where: {
      companyId_productId_warehouseId_lotNumber: {
        companyId: company.id,
        productId: cafe.id,
        warehouseId: almCentral.id,
        lotNumber: "LOT-CAF-2025-V",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      productId: cafe.id,
      warehouseId: almCentral.id,
      lotNumber: "LOT-CAF-2025-V",
      manufactureDate: new Date("2025-01-05"),
      expirationDate: expDateC,
      initialQty: 5,
      currentQty: 5,
      status: LotStatus.VENCIDO,
      notes: "Lote caducado retenido para merma o baja contable",
    },
  });

  console.log("✅ Lotes y vencimientos inicializados con éxito.");
}

main().finally(() => prisma.$disconnect());
