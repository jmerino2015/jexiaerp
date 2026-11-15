import { PrismaClient, PaymentMethod, PaymentStatus, PaymentType, SalesDocType, SalesStatus, SunatStatus, PartnerDocType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Configurando datos demostrativos de Cuentas por Cobrar y Pagar (Cobranzas y Pagos)...");

  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No se encontró la empresa.");

  const warehouse = await prisma.warehouse.findFirst({ where: { isDefault: true } }) || await prisma.warehouse.findFirst();
  if (!warehouse) throw new Error("No se encontró almacén.");

  // 1. Obtener o crear clientes corporativos con líneas de crédito
  const clienteCredito = await prisma.partner.upsert({
    where: {
      companyId_docNumber: {
        companyId: company.id,
        docNumber: "20556677881",
      },
    },
    update: { isCustomer: true },
    create: {
      companyId: company.id,
      docType: PartnerDocType.RUC,
      docNumber: "20556677881",
      legalName: "CORPORACIÓN TEXTIL DEL SUR S.A.C.",
      tradeName: "CORPOTEX SUR",
      address: "Av. Los Rosales 450, San Isidro, Lima",
      department: "Lima",
      province: "Lima",
      district: "San Isidro",
      email: "finanzas@corpotexsur.pe",
      phone: "01-4458920",
      isCustomer: true,
      isSupplier: false,
    },
  });

  const clienteMoroso = await prisma.partner.upsert({
    where: {
      companyId_docNumber: {
        companyId: company.id,
        docNumber: "20601234567",
      },
    },
    update: { isCustomer: true },
    create: {
      companyId: company.id,
      docType: PartnerDocType.RUC,
      docNumber: "20601234567",
      legalName: "DISTRIBUIDORA COMERCIAL ANDINA S.A.C.",
      tradeName: "DISCOMAN",
      address: "Av. Grau 1280, La Victoria, Lima",
      department: "Lima",
      province: "Lima",
      district: "La Victoria",
      email: "cobranzas@discoman.pe",
      phone: "01-3245678",
      isCustomer: true,
      isSupplier: false,
    },
  });

  // 2. Obtener o crear proveedor de insumos textiles
  const proveedorTela = await prisma.partner.upsert({
    where: {
      companyId_docNumber: {
        companyId: company.id,
        docNumber: "20100123891",
      },
    },
    update: { isSupplier: true },
    create: {
      companyId: company.id,
      docType: PartnerDocType.RUC,
      docNumber: "20100123891",
      legalName: "TEXTILES CAMONES S.A.",
      tradeName: "CAMONES TEXTIL",
      address: "Av. Separadora Industrial 2050, Ate, Lima",
      department: "Lima",
      province: "Lima",
      district: "Ate",
      email: "ventas@camones.com.pe",
      phone: "01-6147800",
      isCustomer: false,
      isSupplier: true,
    },
  });

  const polo = await prisma.product.findFirst({ where: { sku: "POLO-ROJ-L" } });

  // 3. Crear Factura a Crédito 30 días: F001-000020
  // Total: S/ 1,320.00 (60 Polos a S/ 22.00)
  // Amortizado: S/ 660.00 (50%), Saldo pendiente: S/ 660.00 (Vence en 15 días)
  const now = new Date();
  const issueDateFact1 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // emitida hace 15 días
  const dueDateFact1 = new Date(issueDateFact1.getTime() + 30 * 24 * 60 * 60 * 1000); // vence en 15 días más

  const fact1 = await prisma.salesDocument.upsert({
    where: {
      companyId_fullNumber: {
        companyId: company.id,
        fullNumber: "F001-000020",
      },
    },
    update: {
      paymentStatus: PaymentStatus.PARCIAL,
      paymentMethod: PaymentMethod.CREDITO,
      paymentCondition: "CREDITO_30",
      paidAmount: 660.0,
      balanceAmount: 660.0,
      creditDueDate: dueDateFact1,
    },
    create: {
      companyId: company.id,
      warehouseId: warehouse.id,
      customerId: clienteCredito.id,
      docType: SalesDocType.FACTURA,
      sunatCode: "01",
      series: "F001",
      number: 20,
      fullNumber: "F001-000020",
      issueDate: issueDateFact1,
      dueDate: dueDateFact1,
      creditDueDate: dueDateFact1,
      currency: "PEN",
      subtotalGravado: 1118.64,
      subtotalExonerado: 0.0,
      subtotalInafecto: 0.0,
      igvAmount: 201.36,
      totalAmount: 1320.0,
      status: SalesStatus.EMITIDO,
      sunatStatus: SunatStatus.ACEPTADO,
      sunatCdrHash: "4f7a9d2c1e8b3a0f9b6e",
      paymentMethod: PaymentMethod.CREDITO,
      paymentStatus: PaymentStatus.PARCIAL,
      paymentCondition: "CREDITO_30",
      paidAmount: 660.0,
      balanceAmount: 660.0,
      notes: "Venta al por mayor a 30 días de 60 unidades POLO VERANO COLOR ROJO TALLA L",
    },
  });

  // Cuotas de la Factura F001-000020 (2 cuotas de S/ 660)
  // Cuota 1: Venció ayer (Pagada)
  const cuota1DueDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const cuota1 = await prisma.paymentSchedule.upsert({
    where: { id: "sched-fact20-c1" },
    update: {
      paidAmount: 660.0,
      balance: 0.0,
      status: PaymentStatus.PAGADO,
    },
    create: {
      id: "sched-fact20-c1",
      companyId: company.id,
      salesDocumentId: fact1.id,
      installmentNumber: 1,
      dueDate: cuota1DueDate,
      amount: 660.0,
      paidAmount: 660.0,
      balance: 0.0,
      status: PaymentStatus.PAGADO,
      notes: "Cuota 1 (50%) a 15 días - Pagada",
    },
  });

  // Cuota 2: Vence en 15 días (Pendiente)
  const cuota2 = await prisma.paymentSchedule.upsert({
    where: { id: "sched-fact20-c2" },
    update: {
      paidAmount: 0.0,
      balance: 660.0,
      status: PaymentStatus.PENDIENTE,
    },
    create: {
      id: "sched-fact20-c2",
      companyId: company.id,
      salesDocumentId: fact1.id,
      installmentNumber: 2,
      dueDate: dueDateFact1,
      amount: 660.0,
      paidAmount: 0.0,
      balance: 660.0,
      status: PaymentStatus.PENDIENTE,
      notes: "Cuota 2 (50%) saldo final a 30 días",
    },
  });

  // Registro del cobro recibido para la Cuota 1
  await prisma.paymentRecord.upsert({
    where: { id: "pay-rec-fact20-01" },
    update: {},
    create: {
      id: "pay-rec-fact20-01",
      companyId: company.id,
      paymentType: PaymentType.COBRO_VENTA,
      salesDocumentId: fact1.id,
      paymentScheduleId: cuota1.id,
      partnerId: clienteCredito.id,
      amount: 660.0,
      paymentDate: cuota1DueDate,
      paymentMethod: PaymentMethod.TRANSFERENCIA,
      bankName: "BCP Soles Cta Cte 191-884210-0-15",
      operationNumber: "OP-BCP-9921448",
      notes: "Abono 50% por transferencia bancaria BCP",
    },
  });

  // 4. Crear Factura a Crédito 15 días VENCIDA: F001-000021 (Morosidad)
  // Total: S/ 880.00 (40 Polos a S/ 22.00)
  // Venció hace 7 días, Saldo 100% PENDIENTE
  const issueDateFact2 = new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000);
  const dueDateFact2 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const fact2 = await prisma.salesDocument.upsert({
    where: {
      companyId_fullNumber: {
        companyId: company.id,
        fullNumber: "F001-000021",
      },
    },
    update: {
      paymentStatus: PaymentStatus.PENDIENTE,
      paymentMethod: PaymentMethod.CREDITO,
      paymentCondition: "CREDITO_15",
      paidAmount: 0.0,
      balanceAmount: 880.0,
      creditDueDate: dueDateFact2,
    },
    create: {
      companyId: company.id,
      warehouseId: warehouse.id,
      customerId: clienteMoroso.id,
      docType: SalesDocType.FACTURA,
      sunatCode: "01",
      series: "F001",
      number: 21,
      fullNumber: "F001-000021",
      issueDate: issueDateFact2,
      dueDate: dueDateFact2,
      creditDueDate: dueDateFact2,
      currency: "PEN",
      subtotalGravado: 745.76,
      subtotalExonerado: 0.0,
      subtotalInafecto: 0.0,
      igvAmount: 134.24,
      totalAmount: 880.0,
      status: SalesStatus.EMITIDO,
      sunatStatus: SunatStatus.ACEPTADO,
      sunatCdrHash: "1a8b9c4d5e6f7a8b9c0d",
      paymentMethod: PaymentMethod.CREDITO,
      paymentStatus: PaymentStatus.PENDIENTE,
      paymentCondition: "CREDITO_15",
      paidAmount: 0.0,
      balanceAmount: 880.0,
      notes: "Crédito 15 días - Factura vencida pendiente de cobro",
    },
  });

  await prisma.paymentSchedule.upsert({
    where: { id: "sched-fact21-c1" },
    update: {
      paidAmount: 0.0,
      balance: 880.0,
      status: PaymentStatus.PENDIENTE,
    },
    create: {
      id: "sched-fact21-c1",
      companyId: company.id,
      salesDocumentId: fact2.id,
      installmentNumber: 1,
      dueDate: dueDateFact2,
      amount: 880.0,
      paidAmount: 0.0,
      balance: 880.0,
      status: PaymentStatus.PENDIENTE,
      notes: "Cuota única a 15 días vencida",
    },
  });

  // 5. Crear Cuenta por Pagar a Proveedor: OC01-000005 / Factura F001-7891
  // Total: S/ 4,500.00 (Insumos textiles de confección)
  // Amortizado: S/ 1,500.00 (Anticipo 33%), Saldo por pagar: S/ 3,000.00 (Vence en 20 días)
  const dueDateOC = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
  const oc1 = await prisma.purchaseOrder.upsert({
    where: {
      companyId_fullNumber: {
        companyId: company.id,
        fullNumber: "OC01-000005",
      },
    },
    update: {
      paymentStatus: PaymentStatus.PARCIAL,
      paymentCondition: "CREDITO_45",
      paidAmount: 1500.0,
      balanceAmount: 3000.0,
      dueDate: dueDateOC,
      supplierInvoice: "F001-7891",
    },
    create: {
      companyId: company.id,
      warehouseId: warehouse.id,
      supplierId: proveedorTela.id,
      series: "OC01",
      number: 5,
      fullNumber: "OC01-000005",
      issueDate: now,
      expectedDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      dueDate: dueDateOC,
      supplierInvoice: "F001-7891",
      subtotal: 3813.56,
      igv: 686.44,
      total: 4500.0,
      paymentStatus: PaymentStatus.PARCIAL,
      paymentCondition: "CREDITO_45",
      paidAmount: 1500.0,
      balanceAmount: 3000.0,
      notes: "Compra de rollo de algodón pima peinado para producción de polos verano",
    },
  });

  // Registro de pago a proveedor (Anticipo S/ 1,500)
  await prisma.paymentRecord.upsert({
    where: { id: "pay-rec-oc05-01" },
    update: {},
    create: {
      id: "pay-rec-oc05-01",
      companyId: company.id,
      paymentType: PaymentType.PAGO_COMPRA,
      purchaseOrderId: oc1.id,
      partnerId: proveedorTela.id,
      amount: 1500.0,
      paymentDate: now,
      paymentMethod: PaymentMethod.TRANSFERENCIA,
      bankName: "BBVA Soles Cta Cte 0011-0175-0100028491",
      operationNumber: "OP-BBVA-4481029",
      notes: "Pago anticipo inicial a proveedor por transferencia BBVA",
    },
  });

  // 6. Actualizar documentos antiguos para que tengan balanceAmount coherente
  const existingSales = await prisma.salesDocument.findMany({
    where: { balanceAmount: 0, paidAmount: 0, paymentStatus: PaymentStatus.PAGADO },
  });
  for (const s of existingSales) {
    await prisma.salesDocument.update({
      where: { id: s.id },
      data: {
        paidAmount: s.totalAmount,
        balanceAmount: 0.0,
      },
    });
  }

  const existingPurchases = await prisma.purchaseOrder.findMany({
    where: { balanceAmount: 0, paidAmount: 0 },
  });
  for (const p of existingPurchases) {
    await prisma.purchaseOrder.update({
      where: { id: p.id },
      data: {
        paidAmount: p.total,
        balanceAmount: 0.0,
        paymentStatus: PaymentStatus.PAGADO,
      },
    });
  }

  console.log("¡Datos demostrativos de Cobranzas y Pagos creados exitosamente!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
