import prisma from "@/lib/prisma";
import { AccountingManager } from "@/components/accounting/AccountingManager";

export const dynamic = "force-dynamic";

export default async function ContabilidadPage() {
  const currentPeriod = "2025-11";

  const [entries, accounts] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { period: currentPeriod },
      include: {
        lines: {
          orderBy: { debit: "desc" },
        },
      },
      orderBy: { entryNumber: "desc" },
    }),
    prisma.accountPlan.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const entriesData = entries.map((e) => ({
    id: e.id,
    entryNumber: e.entryNumber,
    period: e.period,
    date: e.date.toISOString(),
    glosa: e.glosa,
    originType: e.originType,
    totalDebit: e.totalDebit,
    totalCredit: e.totalCredit,
    isBalanced: e.isBalanced,
    lines: e.lines.map((l) => ({
      id: l.id,
      accountCode: l.accountCode,
      accountName: l.accountName,
      debit: l.debit,
      credit: l.credit,
      docReference: l.docReference,
      partnerName: l.partnerName,
    })),
  }));

  const accountsData = accounts.map((a) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    element: a.element,
    category: a.category,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Contabilidad Peruana y Normativas SUNAT (PCGE 2019)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Libro Diario con generación de asientos automáticos, SIRE RVIE/RCE, PLE 5.1 y Balance de Comprobación.
        </p>
      </div>

      <AccountingManager
        entries={entriesData}
        accounts={accountsData}
        currentPeriod={currentPeriod}
      />
    </div>
  );
}
