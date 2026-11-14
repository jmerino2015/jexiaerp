import {
  PrismaClient,
  PartnerDocType,
  ProductUnitCode,
  IgvType,
  KardexType,
  SalesDocType,
  SalesStatus,
  SunatStatus,
  PurchaseStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
  AccountCategory,
  JournalOrigin,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando poblamiento contable y tributario para Jexia ERP...");

  // Limpiar tablas contables y operativas
  await prisma.journalEntryLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.accountPlan.deleteMany();
  await prisma.salesDocumentItem.deleteMany();
  await prisma.salesDocument.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.kardexMovement.deleteMany();
  await prisma.productStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.documentSeries.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // 1. Empresa Principal
  const company = await prisma.company.create({
    data: {
      ruc: "20608945123",
      businessName: "JEXIA TECH SOLUTIONS S.A.C.",
      tradeName: "Jexia ERP Perú",
      fiscalAddress: "Av. Rivera Navarrete 501, Piso 14, San Isidro, Lima",
      department: "Lima",
      province: "Lima",
      district: "San Isidro",
      phone: "+51 1 719-8400",
      email: "contacto@jexia.pe",
      currency: "PEN",
      ubigeo: "150131",
      solUser: "MODDATOS",
      solPass: "moddatos",
      bnAccount: "00-068-123456", // Cuenta Banco de la Nación para Detracciones SPOT
    },
  });

  // 2. Administrador
  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: "admin@jexia.pe",
      fullName: "Carlos Mendoza (Administrador)",
      passwordHash: "jexia2025secure",
      role: UserRole.ADMIN,
    },
  });

  // 3. Almacén Central
  const warehouse = await prisma.warehouse.create({
    data: {
      companyId: company.id,
      code: "ALM01",
      name: "Almacén Central Lima",
      address: "Av. Argentina 2840, Cercado de Lima",
      isDefault: true,
    },
  });

  // 4. Series Oficiales SUNAT
  await prisma.documentSeries.createMany({
    data: [
      {
        companyId: company.id,
        docType: SalesDocType.FACTURA,
        series: "F001",
        currentNumber: 12,
        description: "Facturación Electrónica General",
      },
      {
        companyId: company.id,
        docType: SalesDocType.BOLETA,
        series: "B001",
        currentNumber: 28,
        description: "Boletas de Venta Mostrador",
      },
      {
        companyId: company.id,
        docType: SalesDocType.COTIZACION,
        series: "COT1",
        currentNumber: 15,
        description: "Cotizaciones Comerciales",
      },
      {
        companyId: company.id,
        docType: SalesDocType.NOTA_CREDITO,
        series: "FC01",
        currentNumber: 1,
        description: "Notas de Crédito Factura Electrónica",
      },
    ],
  });

  // 5. Poblar Plan Contable General Empresarial (PCGE 2019 SUNAT)
  const pcgeAccounts = [
    { code: "1011", name: "Caja Central Operativa", element: 1, category: AccountCategory.ACTIVO },
    { code: "1041", name: "Cuentas Corrientes Operativas (BCP)", element: 1, category: AccountCategory.ACTIVO },
    { code: "1212", name: "Emitidas en Cartera (Facturas y Boletas)", element: 1, category: AccountCategory.ACTIVO },
    { code: "20111", name: "Mercaderías Manufacturadas - Costo", element: 2, category: AccountCategory.ACTIVO },
    { code: "40111", name: "IGV - Cuenta Propia (18%)", element: 4, category: AccountCategory.PASIVO },
    { code: "4212", name: "Emitidas (Facturas Proveedores)", element: 4, category: AccountCategory.PASIVO },
    { code: "6011", name: "Mercaderías (Compras por Naturaleza)", element: 6, category: AccountCategory.GASTOS_NATURALEZA },
    { code: "6111", name: "Variación de Existencias - Mercaderías", element: 6, category: AccountCategory.GASTOS_NATURALEZA },
    { code: "69121", name: "Costo de Ventas - Mercaderías Locales", element: 6, category: AccountCategory.GASTOS_NATURALEZA },
    { code: "70121", name: "Venta Local de Mercaderías", element: 7, category: AccountCategory.INGRESOS },
    { code: "70321", name: "Prestación de Servicios Locales", element: 7, category: AccountCategory.INGRESOS },
  ];

  for (const acc of pcgeAccounts) {
    await prisma.accountPlan.create({
      data: { ...acc, companyId: company.id },
    });
  }
  console.log(`✅ Plan de Cuentas PCGE inicializado (${pcgeAccounts.length} cuentas clave).`);

  // 6. Proveedores
  const provDeltron = await prisma.partner.create({
    data: {
      companyId: company.id,
      docType: PartnerDocType.RUC,
      docNumber: "20512830141",
      legalName: "DELTRON TECNOLOGIAS S.A.",
      tradeName: "Grupo Deltron",
      address: "Av. Manuel Bandeira 241, San Martín de Porres, Lima",
      email: "contacto@deltron.com.pe",
      phone: "+51 1 418-4000",
      isSupplier: true,
      isCustomer: false,
    },
  });

  const provHiraoka = await prisma.partner.create({
    data: {
      companyId: company.id,
      docType: PartnerDocType.RUC,
      docNumber: "20100070970",
      legalName: "IMPORTACIONES HIRAOKA S.A.C.",
      tradeName: "Hiraoka",
      address: "Av. Abancay 594, Lima",
      email: "ventas@hiraoka.com.pe",
      isSupplier: true,
      isCustomer: false,
    },
  });

  // 7. Clientes
  const cliConstructora = await prisma.partner.create({
    data: {
      companyId: company.id,
      docType: PartnerDocType.RUC,
      docNumber: "20601234567",
      legalName: "CONSTRUCTORA E INMOBILIARIA LOS ANDES S.A.C.",
      tradeName: "Los Andes Constructora",
      address: "Calle Los Cedros 320, San Borja, Lima",
      email: "facturacion@losandes.pe",
      isCustomer: true,
      isSupplier: false,
    },
  });

  const cliPersona = await prisma.partner.create({
    data: {
      companyId: company.id,
      docType: PartnerDocType.DNI,
      docNumber: "45892301",
      legalName: "JUAN CARLOS PAREDES VEGA",
      tradeName: "Paredes Servicios",
      address: "Jr. Ayacucho 412, Magdalena del Mar, Lima",
      email: "jcparedes@gmail.com",
      isCustomer: true,
      isSupplier: false,
    },
  });

  // 8. Productos
  const pDemo = await prisma.product.create({
    data: {
      companyId: company.id,
      sku: "POLO-ROJ-L",
      name: "POLO VERANO COLOR ROJO TALLA L",
      unitCode: ProductUnitCode.NIU,
      avgCost: 22.0,
      lastCost: 22.0,
      salePrice: 45.0,
      minStock: 15,
      category: "Textil y Confecciones",
      stocks: {
        create: {
          warehouseId: warehouse.id,
          quantity: 150,
        },
      },
    },
  });

  await prisma.kardexMovement.create({
    data: {
      companyId: company.id,
      productId: pDemo.id,
      warehouseId: warehouse.id,
      movementType: KardexType.INICIAL,
      documentType: "INICIAL",
      documentNumber: "INV-INICIAL-POLO-ROJO",
      quantity: 150,
      unitCost: 22.0,
      totalCost: 3300.0,
      balanceQty: 150,
      balanceUnitCost: 22.0,
      balanceTotal: 3300.0,
      notes: "Stock inicial demo: POLO VERANO COLOR ROJO TALLA L",
    },
  });

  const p1 = await prisma.product.create({
    data: {
      companyId: company.id,
      sku: "PROD-LAP01",
      name: "Laptop Lenovo ThinkPad E14 Gen 5",
      unitCode: ProductUnitCode.NIU,
      avgCost: 3200.0,
      lastCost: 3200.0,
      salePrice: 4150.0,
      minStock: 4,
      category: "Cómputo",
      stocks: {
        create: {
          warehouseId: warehouse.id,
          quantity: 12,
        },
      },
    },
  });

  await prisma.kardexMovement.create({
    data: {
      companyId: company.id,
      productId: p1.id,
      warehouseId: warehouse.id,
      movementType: KardexType.INICIAL,
      documentType: "INICIAL",
      documentNumber: "INV-INICIAL-2025",
      quantity: 12,
      unitCost: 3200.0,
      totalCost: 38400.0,
      balanceQty: 12,
      balanceUnitCost: 3200.0,
      balanceTotal: 38400.0,
      notes: "Stock inicial",
    },
  });

  // 9. Factura Electrónica Demo con XML UBL 2.1 y Detracción SPOT
  const saleDoc = await prisma.salesDocument.create({
    data: {
      companyId: company.id,
      warehouseId: warehouse.id,
      customerId: cliConstructora.id,
      userId: adminUser.id,
      docType: SalesDocType.FACTURA,
      sunatCode: "01",
      series: "F001",
      number: 12,
      fullNumber: "F001-000012",
      issueDate: new Date(),
      subtotalGravado: 8300.0,
      igvAmount: 1494.0,
      totalAmount: 9794.0,
      status: SalesStatus.EMITIDO,
      sunatStatus: SunatStatus.ACEPTADO,
      sunatResponseCode: "0",
      sunatDescription: "La Factura número F001-000012 ha sido aceptada por SUNAT",
      sunatCdrHash: "4nS8q/jXkYVvXGgT+p2O=",
      detractionApplied: false,
      paymentMethod: PaymentMethod.TRANSFERENCIA,
      paymentStatus: PaymentStatus.PAGADO,
      items: {
        create: [
          {
            productId: p1.id,
            sku: p1.sku,
            name: p1.name,
            quantity: 2,
            unitCost: 3200.0,
            unitPrice: 4150.0,
            subtotal: 8300.0,
            igvAmount: 1494.0,
            totalAmount: 9794.0,
          },
        ],
      },
    },
  });

  // 10. Asiento Contable Automático de la Venta (Libro Diario 5.1 SUNAT)
  await prisma.journalEntry.create({
    data: {
      companyId: company.id,
      entryNumber: 1,
      period: "2025-11",
      date: new Date(),
      glosa: `Por la venta según Factura Electrónica ${saleDoc.fullNumber} a ${cliConstructora.legalName}`,
      originType: JournalOrigin.VENTA,
      originId: saleDoc.id,
      totalDebit: 9794.0,
      totalCredit: 9794.0,
      isBalanced: true,
      lines: {
        create: [
          {
            accountCode: "1212",
            accountName: "Emitidas en Cartera",
            debit: 9794.0,
            credit: 0.0,
            docReference: saleDoc.fullNumber,
            partnerName: cliConstructora.legalName,
          },
          {
            accountCode: "40111",
            accountName: "IGV - Cuenta Propia (18%)",
            debit: 0.0,
            credit: 1494.0,
            docReference: saleDoc.fullNumber,
            partnerName: cliConstructora.legalName,
          },
          {
            accountCode: "70121",
            accountName: "Venta Local de Mercaderías",
            debit: 0.0,
            credit: 8300.0,
            docReference: saleDoc.fullNumber,
            partnerName: cliConstructora.legalName,
          },
        ],
      },
    },
  });

  // Asiento Contable Automático de Costo de Ventas
  const costoTotalVenta = 2 * 3200.0; // 6400.0
  await prisma.journalEntry.create({
    data: {
      companyId: company.id,
      entryNumber: 2,
      period: "2025-11",
      date: new Date(),
      glosa: `Por el costo de ventas de Factura Electrónica ${saleDoc.fullNumber}`,
      originType: JournalOrigin.COSTO_VENTAS,
      originId: saleDoc.id,
      totalDebit: costoTotalVenta,
      totalCredit: costoTotalVenta,
      isBalanced: true,
      lines: {
        create: [
          {
            accountCode: "69121",
            accountName: "Costo de Ventas - Mercaderías Locales",
            debit: costoTotalVenta,
            credit: 0.0,
            docReference: saleDoc.fullNumber,
          },
          {
            accountCode: "20111",
            accountName: "Mercaderías Manufacturadas - Costo",
            debit: 0.0,
            credit: costoTotalVenta,
            docReference: saleDoc.fullNumber,
          },
        ],
      },
    },
  });

  console.log("🎉 Seed Contable y Facturación SUNAT completado con éxito!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
