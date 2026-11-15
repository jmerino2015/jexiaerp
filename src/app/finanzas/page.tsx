import prisma from "@/lib/prisma";
import { FinanceManager } from "@/components/finance/FinanceManager";
import { SalesDocType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function FinanzasPage() {
  const [salesDocs, purchaseOrders, paymentRecords] = await Promise.all([
    // Cuentas por Cobrar (Facturas, Boletas, etc. excluyendo cotizaciones)
    prisma.salesDocument.findMany({
      where: {
        docType: { not: SalesDocType.COTIZACION },
      },
      include: {
        customer: true,
        schedules: {
          orderBy: { installmentNumber: "asc" },
        },
      },
      orderBy: { issueDate: "desc" },
    }),

    // Cuentas por Pagar (Órdenes de Compra)
    prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        schedules: {
          orderBy: { installmentNumber: "asc" },
        },
      },
      orderBy: { issueDate: "desc" },
    }),

    // Transacciones de Tesorería (Cobros y Pagos)
    prisma.paymentRecord.findMany({
      include: {
        partner: true,
        salesDocument: true,
        purchaseOrder: true,
      },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  // Estructurar CXC
  const receivablesData = salesDocs.map((doc) => {
    const balance =
      doc.balanceAmount > 0
        ? doc.balanceAmount
        : Math.max(0, doc.totalAmount - doc.paidAmount);

    return {
      id: doc.id,
      fullNumber: doc.fullNumber,
      docType: doc.docType,
      issueDate: doc.issueDate.toISOString(),
      dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
      totalAmount: doc.totalAmount,
      paidAmount: doc.paidAmount,
      balanceAmount: balance,
      paymentStatus: doc.paymentStatus,
      paymentCondition: doc.paymentCondition || "CONTADO",
      customer: {
        id: doc.customer.id,
        docNumber: doc.customer.docNumber,
        legalName: doc.customer.legalName,
      },
      schedules: doc.schedules.map((s) => ({
        id: s.id,
        installmentNumber: s.installmentNumber,
        dueDate: s.dueDate.toISOString(),
        amount: s.amount,
        paidAmount: s.paidAmount,
        balance: s.balance,
        status: s.status,
      })),
    };
  });

  // Estructurar CXP
  const payablesData = purchaseOrders.map((po) => {
    const balance =
      po.balanceAmount > 0
        ? po.balanceAmount
        : Math.max(0, po.total - po.paidAmount);

    return {
      id: po.id,
      fullNumber: po.fullNumber,
      supplierInvoice: po.supplierInvoice,
      issueDate: po.issueDate.toISOString(),
      dueDate: po.dueDate ? po.dueDate.toISOString() : null,
      total: po.total,
      paidAmount: po.paidAmount,
      balanceAmount: balance,
      paymentStatus: po.paymentStatus,
      paymentCondition: po.paymentCondition || "CONTADO",
      supplier: {
        id: po.supplier.id,
        docNumber: po.supplier.docNumber,
        legalName: po.supplier.legalName,
      },
      schedules: po.schedules.map((s) => ({
        id: s.id,
        installmentNumber: s.installmentNumber,
        dueDate: s.dueDate.toISOString(),
        amount: s.amount,
        paidAmount: s.paidAmount,
        balance: s.balance,
        status: s.status,
      })),
    };
  });

  // Estructurar Transacciones
  const transactionsData = paymentRecords.map((t) => ({
    id: t.id,
    paymentType: t.paymentType as "COBRO_VENTA" | "PAGO_COMPRA",
    amount: t.amount,
    paymentDate: t.paymentDate.toISOString(),
    paymentMethod: t.paymentMethod,
    bankName: t.bankName,
    operationNumber: t.operationNumber,
    notes: t.notes,
    journalEntryId: t.journalEntryId,
    partner: {
      legalName: t.partner.legalName,
      docNumber: t.partner.docNumber,
    },
    salesDocument: t.salesDocument
      ? {
          fullNumber: t.salesDocument.fullNumber,
          docType: t.salesDocument.docType,
        }
      : null,
    purchaseOrder: t.purchaseOrder
      ? {
          fullNumber: t.purchaseOrder.fullNumber,
          supplierInvoice: t.purchaseOrder.supplierInvoice,
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Control de Cobranzas y Cuentas por Cobrar / Pagar
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Conciliación bancaria de facturas a crédito, gestión de morosidad, pagos a proveedores y asientos contables automáticos (PCGE 1212 y 4212).
        </p>
      </div>

      <FinanceManager
        receivables={receivablesData}
        payables={payablesData}
        transactions={transactionsData}
      />
    </div>
  );
}
