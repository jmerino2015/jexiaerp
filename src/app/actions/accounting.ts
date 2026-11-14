"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { JournalOrigin } from "@prisma/client";
import { SirePleService, SireSaleLine, SirePurchaseLine, PleJournalLine } from "@/lib/sire-ple";

export async function createManualJournalEntry(data: {
  period: string; // "2025-11"
  date: string;
  glosa: string;
  lines: {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    docReference?: string;
  }[];
}) {
  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No hay empresa registrada.");

    if (!data.lines || data.lines.length < 2) {
      throw new Error("Un asiento contable requiere al menos 2 líneas.");
    }

    const totalDebit = data.lines.reduce((acc, l) => acc + Number(l.debit || 0), 0);
    const totalCredit = data.lines.reduce((acc, l) => acc + Number(l.credit || 0), 0);

    // Validación de Partida Doble (Principio Contable Fundamental)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `El asiento está descuadrado: Total Debe (S/ ${totalDebit.toFixed(2)}) != Total Haber (S/ ${totalCredit.toFixed(2)}).`
      );
    }

    const lastEntry = await prisma.journalEntry.findFirst({
      where: { companyId: company.id, period: data.period },
      orderBy: { entryNumber: "desc" },
    });

    const nextEntryNumber = (lastEntry?.entryNumber || 0) + 1;

    const entry = await prisma.journalEntry.create({
      data: {
        companyId: company.id,
        entryNumber: nextEntryNumber,
        period: data.period,
        date: new Date(data.date),
        glosa: data.glosa.trim(),
        originType: JournalOrigin.MANUAL,
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        isBalanced: true,
        lines: {
          create: data.lines.map((l) => ({
            accountCode: l.accountCode.trim(),
            accountName: l.accountName.trim(),
            debit: Number(l.debit || 0),
            credit: Number(l.credit || 0),
            docReference: l.docReference?.trim() || null,
          })),
        },
      },
    });

    revalidatePath("/contabilidad");
    return { success: true, data: entry };
  } catch (error: any) {
    console.error("Error creating journal entry:", error);
    return { success: false, error: error.message || "Error al registrar asiento contable." };
  }
}

export async function exportSireRvieData(period: string) {
  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No hay empresa registrada.");

    const sales = await prisma.salesDocument.findMany({
      where: {
        companyId: company.id,
        status: "EMITIDO",
        docType: { in: ["FACTURA", "BOLETA", "NOTA_CREDITO"] },
      },
      include: { customer: true },
      orderBy: { issueDate: "asc" },
    });

    const sireLines: SireSaleLine[] = sales.map((s) => {
      const d = new Date(s.issueDate);
      const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      const periodSire = period.replace("-", "") + "00";

      return {
        companyRuc: company.ruc,
        companyName: company.businessName,
        periodo: periodSire,
        issueDate: dateStr,
        docType: s.sunatCode,
        series: s.series,
        number: s.number,
        customerDocType: s.customer.docType === "RUC" ? "6" : "1",
        customerDocNumber: s.customer.docNumber,
        customerName: s.customer.legalName,
        baseGravada: s.subtotalGravado,
        igv: s.igvAmount,
        total: s.totalAmount,
        moneda: s.currency,
      };
    });

    const txtContent = SirePleService.generateSireRvieTxt(sireLines);
    const fileName = `LE${company.ruc}${period.replace("-", "")}00140400021112.txt`;

    return { success: true, txtContent, fileName, count: sales.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function exportPleDiarioData(period: string) {
  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No hay empresa.");

    const entries = await prisma.journalEntry.findMany({
      where: { companyId: company.id, period: period },
      include: { lines: true },
      orderBy: { entryNumber: "asc" },
    });

    const pleLines: PleJournalLine[] = [];
    entries.forEach((e) => {
      const d = new Date(e.date);
      const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      const periodPle = period.replace("-", "") + "00";

      e.lines.forEach((l, idx) => {
        pleLines.push({
          periodo: periodPle,
          entryNumber: e.entryNumber,
          asientoCorrelativo: `M${e.entryNumber}_${idx + 1}`,
          accountCode: l.accountCode,
          fechaOperacion: dateStr,
          glosa: e.glosa,
          debe: l.debit,
          haber: l.credit,
          docReference: l.docReference || "",
        });
      });
    });

    const txtContent = SirePleService.generatePleDiarioTxt(pleLines);
    const fileName = `LE${company.ruc}${period.replace("-", "")}00050100001111.txt`;

    return { success: true, txtContent, fileName, count: entries.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
