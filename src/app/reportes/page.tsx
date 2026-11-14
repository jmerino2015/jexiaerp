import prisma from "@/lib/prisma";
import { formatPEN } from "@/lib/utils";
import { BarChart3, TrendingUp, Receipt, ShoppingCart, Calculator, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const [salesSum, purchasesSum, salesCount, salesDocs] = await Promise.all([
    prisma.salesDocument.aggregate({
      where: { status: "EMITIDO", docType: { in: ["FACTURA", "BOLETA"] } },
      _sum: { subtotalGravado: true, igvAmount: true, totalAmount: true },
    }),
    prisma.purchaseOrder.aggregate({
      where: { status: { in: ["EMITIDA", "COMPLETADA", "RECIBIDA_PARCIAL"] } },
      _sum: { subtotal: true, igv: true, total: true },
    }),
    prisma.salesDocument.count({
      where: { status: "EMITIDO", docType: { in: ["FACTURA", "BOLETA"] } },
    }),
    prisma.salesDocument.findMany({
      where: { status: "EMITIDO", docType: { in: ["FACTURA", "BOLETA"] } },
      include: { customer: true, items: true },
      take: 10,
      orderBy: { issueDate: "desc" },
    }),
  ]);

  const totalVentas = salesSum._sum.totalAmount || 0;
  const debitoFiscalIgv = salesSum._sum.igvAmount || 0;
  const totalCompras = purchasesSum._sum.total || 0;
  const creditoFiscalIgv = purchasesSum._sum.igv || 0;
  const igvPorPagar = Math.max(0, debitoFiscalIgv - creditoFiscalIgv);
  const margenEstimado = totalVentas > 0 ? ((totalVentas - totalCompras) / totalVentas) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reportes Gerenciales y Tributarios
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Liquidación estimada de IGV (SUNAT), análisis de rentabilidad y exportación contable.
          </p>
        </div>
      </div>

      {/* 3 Métricas de Liquidación Tributaria */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Débito Fiscal (IGV Ventas)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {formatPEN(debitoFiscalIgv)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Impuesto recaudado por facturación</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Crédito Fiscal (IGV Compras)
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {formatPEN(creditoFiscalIgv)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Impuesto deducible por adquisiciones</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              IGV Estimado a Pagar (SUNAT)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F4C81] mt-2 font-mono">
            {formatPEN(igvPorPagar)}
          </p>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">Saldo neto del periodo</p>
        </div>
      </div>

      {/* Resumen de Margen Operativo */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-2">
          Análisis Financiero de Márgenes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase">Ventas Brutas Totales</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{formatPEN(totalVentas)}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase">Compras Totales</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{formatPEN(totalCompras)}</p>
          </div>
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <span className="text-xs text-emerald-800 font-semibold uppercase">Margen Comercial Bruto</span>
            <p className="text-xl font-bold text-emerald-700 mt-1">
              {margenEstimado.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
