"use client";

import { useState } from "react";
import { formatPEN, formatDate } from "@/lib/utils";
import {
  createManualJournalEntry,
  exportSireRvieData,
  exportPleDiarioData,
} from "@/app/actions/accounting";
import {
  BookOpen,
  FileSpreadsheet,
  Download,
  PlusCircle,
  Scale,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
  Trash2,
  Search,
} from "lucide-react";

interface AccountPlanItem {
  id: string;
  code: string;
  name: string;
  element: number;
  category: string;
}

interface JournalEntryLineItem {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  docReference: string | null;
  partnerName: string | null;
}

interface JournalEntryRecord {
  id: string;
  entryNumber: number;
  period: string;
  date: string | Date;
  glosa: string;
  originType: string;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  lines: JournalEntryLineItem[];
}

export function AccountingManager({
  entries,
  accounts,
  currentPeriod,
}: {
  entries: JournalEntryRecord[];
  accounts: AccountPlanItem[];
  currentPeriod: string;
}) {
  const [activeTab, setActiveTab] = useState<"diario" | "sire" | "pcge" | "balance">("diario");
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod || "2025-11");
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);

  // New Entry Form State
  const [glosa, setGlosa] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [lines, setLines] = useState<
    { accountCode: string; accountName: string; debit: number; credit: number; docReference?: string }[]
  >([
    { accountCode: "1041", accountName: "Cuentas Corrientes BCP", debit: 500, credit: 0 },
    { accountCode: "1212", accountName: "Emitidas en Cartera", debit: 0, credit: 500 },
  ]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const totalDebitNew = lines.reduce((acc, l) => acc + Number(l.debit || 0), 0);
  const totalCreditNew = lines.reduce((acc, l) => acc + Number(l.credit || 0), 0);
  const isSquare = Math.abs(totalDebitNew - totalCreditNew) < 0.01;

  function handleAddLine() {
    setLines((prev) => [
      ...prev,
      { accountCode: accounts[0]?.code || "1011", accountName: accounts[0]?.name || "", debit: 0, credit: 0 },
    ]);
  }

  function handleRemoveLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function handleLineAccountChange(index: number, code: string) {
    const acc = accounts.find((a) => a.code === code);
    setLines((prev) => {
      const copy = [...prev];
      copy[index].accountCode = code;
      if (acc) copy[index].accountName = acc.name;
      return copy;
    });
  }

  function handleLineAmountChange(index: number, field: "debit" | "credit", val: any) {
    setLines((prev) => {
      const copy = [...prev];
      copy[index][field] = Number(val);
      return copy;
    });
  }

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!isSquare) {
      setErrorMsg("El asiento contable debe cumplir el principio de Partida Doble (Debe = Haber).");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await createManualJournalEntry({
      period: selectedPeriod,
      date,
      glosa,
      lines,
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "Error al crear asiento.");
    } else {
      setSuccessMsg("¡Asiento contable registrado exitosamente!");
      setTimeout(() => {
        setIsNewEntryOpen(false);
        setSuccessMsg("");
        setGlosa("");
      }, 1000);
    }
  }

  // Exportar Archivo TXT
  function triggerDownload(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadSireRvie() {
    setLoading(true);
    const res = await exportSireRvieData(selectedPeriod);
    setLoading(false);
    if (res.success && res.txtContent) {
      triggerDownload(res.txtContent, res.fileName || "SIRE_RVIE.txt");
    } else {
      alert(res.error || "Error al exportar SIRE RVIE");
    }
  }

  async function handleDownloadPleDiario() {
    setLoading(true);
    const res = await exportPleDiarioData(selectedPeriod);
    setLoading(false);
    if (res.success && res.txtContent) {
      triggerDownload(res.txtContent, res.fileName || "PLE_5_1_DIARIO.txt");
    } else {
      alert(res.error || "Error al exportar PLE Diario");
    }
  }

  // Cálculos para Balance de Comprobación
  const accountBalances: {
    [code: string]: { name: string; debitSum: number; creditSum: number };
  } = {};

  entries.forEach((entry) => {
    entry.lines.forEach((l) => {
      if (!accountBalances[l.accountCode]) {
        accountBalances[l.accountCode] = {
          name: l.accountName,
          debitSum: 0,
          creditSum: 0,
        };
      }
      accountBalances[l.accountCode].debitSum += l.debit;
      accountBalances[l.accountCode].creditSum += l.credit;
    });
  });

  const balanceRows = Object.entries(accountBalances)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, val]) => {
      const net = val.debitSum - val.creditSum;
      return {
        code,
        name: val.name,
        debitSum: val.debitSum,
        creditSum: val.creditSum,
        deudor: net > 0 ? net : 0,
        acreedor: net < 0 ? Math.abs(net) : 0,
      };
    });

  const totalSumDebe = balanceRows.reduce((a, b) => a + b.debitSum, 0);
  const totalSumHaber = balanceRows.reduce((a, b) => a + b.creditSum, 0);
  const totalSaldoDeudor = balanceRows.reduce((a, b) => a + b.deudor, 0);
  const totalSaldoAcreedor = balanceRows.reduce((a, b) => a + b.acreedor, 0);

  return (
    <div className="space-y-6">
      {/* Pestañas de Navegación Contable */}
      <div className="flex border-b border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab("diario")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "diario"
              ? "border-[#2563EB] text-[#2563EB] bg-sky-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Libro Diario (Asientos PCGE)</span>
        </button>

        <button
          onClick={() => setActiveTab("sire")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "sire"
              ? "border-[#2563EB] text-[#2563EB] bg-sky-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span>SIRE SUNAT (RVIE / RCE / PLE)</span>
        </button>

        <button
          onClick={() => setActiveTab("pcge")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "pcge"
              ? "border-[#2563EB] text-[#2563EB] bg-sky-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4 text-[#2563EB]" />
          <span>Plan Contable (PCGE 2019)</span>
        </button>

        <button
          onClick={() => setActiveTab("balance")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "balance"
              ? "border-[#2563EB] text-[#2563EB] bg-sky-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Scale className="w-4 h-4 text-indigo-600" />
          <span>Balance de Comprobación</span>
        </button>
      </div>

      {/* PESTAÑA 1: LIBRO DIARIO */}
      {activeTab === "diario" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Periodo Tributario:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 bg-white"
              >
                <option value="2025-11">Noviembre 2025 (2025-11)</option>
                <option value="2025-10">Octubre 2025 (2025-10)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPleDiario}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Descargar TXT PLE 5.1</span>
              </button>

              <button
                onClick={() => setIsNewEntryOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nuevo Asiento Manual</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
                No hay asientos registrados en este periodo contable.
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0F4C81] bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono">
                        Asiento N° {String(entry.entryNumber).padStart(4, "0")}
                      </span>
                      <span className="font-semibold text-slate-800">{entry.glosa}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                      <span>Fecha: {formatDate(entry.date)}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        Cuadrado ✓
                      </span>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                        <th className="py-1.5 px-4">Cuenta PCGE</th>
                        <th className="py-1.5 px-4 font-sans">Denominación</th>
                        <th className="py-1.5 px-3">Referencia</th>
                        <th className="py-1.5 px-4 text-right">Debe (S/)</th>
                        <th className="py-1.5 px-4 text-right">Haber (S/)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entry.lines.map((line) => (
                        <tr key={line.id} className="hover:bg-slate-50/40">
                          <td className="py-2 px-4 font-bold text-slate-800">{line.accountCode}</td>
                          <td className="py-2 px-4 font-sans text-slate-700">{line.accountName}</td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">
                            {line.docReference || "-"}
                          </td>
                          <td className="py-2 px-4 text-right text-emerald-700 font-bold">
                            {line.debit > 0 ? formatPEN(line.debit) : "-"}
                          </td>
                          <td className="py-2 px-4 text-right text-rose-700 font-bold">
                            {line.credit > 0 ? formatPEN(line.credit) : "-"}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/80 font-bold text-slate-900 border-t border-slate-200 text-xs">
                        <td colSpan={3} className="py-2 px-4 text-right uppercase font-sans text-[11px]">
                          Totales de Asiento:
                        </td>
                        <td className="py-2 px-4 text-right text-[#0F4C81]">
                          {formatPEN(entry.totalDebit)}
                        </td>
                        <td className="py-2 px-4 text-right text-[#0F4C81]">
                          {formatPEN(entry.totalCredit)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: SIRE SUNAT */}
      {activeTab === "sire" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  SIRE SUNAT: Sistema Integrado de Registros Electrónicos
                </h2>
                <p className="text-xs text-slate-500">
                  Generación de archivos para la propuesta y macro oficial de SUNAT (R.S. 000112-2021/SUNAT).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Card RVIE */}
              <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 text-sm">
                    SIRE RVIE (Registro de Ventas e Ingresos)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                    Formato 14.1
                  </span>
                </div>
                <p className="text-xs text-emerald-800">
                  Archivo estructurado con Facturas, Boletas y Notas de Crédito, campos separados por barras (|) para comparar con la propuesta de SUNAT.
                </p>
                <button
                  onClick={handleDownloadSireRvie}
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar TXT SIRE RVIE</span>
                </button>
              </div>

              {/* Card RCE */}
              <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-950 text-sm">
                    SIRE RCE (Registro de Compras Electrónico)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-200 text-sky-900">
                    Formato 8.1
                  </span>
                </div>
                <p className="text-xs text-sky-800">
                  Archivo de compras locales con sustento de Crédito Fiscal IGV y facturas de proveedores.
                </p>
                <button
                  onClick={handleDownloadSireRvie}
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar TXT SIRE RCE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: PLAN CONTABLE PCGE */}
      {activeTab === "pcge" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Catálogo de Cuentas: Plan Contable General Empresarial (PCGE 2019 Modificado)
            </h2>
            <span className="text-xs font-mono text-slate-500">{accounts.length} Cuentas</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <th className="py-2 px-4">Código</th>
                <th className="py-2 px-4">Denominación de la Cuenta</th>
                <th className="py-2 px-3">Elemento</th>
                <th className="py-2 px-4">Categoría de Estados Financieros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 font-bold text-[#0F4C81]">{acc.code}</td>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-900">{acc.name}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Elemento {acc.element}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-600 text-[11px]">
                    {acc.category}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PESTAÑA 4: BALANCE DE COMPROBACIÓN */}
      {activeTab === "balance" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Balance de Comprobación (Sumas del Mayor y Saldos)
              </h2>
              <p className="text-xs text-slate-500">
                Comprobación del principio fundamental de equilibrio contable patrimonial.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                  <th colSpan={2} className="py-2 px-4 border-r border-slate-200">
                    Cuenta PCGE
                  </th>
                  <th colSpan={2} className="py-2 px-4 text-center border-r border-slate-200 bg-sky-50/70 text-[#0F4C81]">
                    Sumas del Mayor
                  </th>
                  <th colSpan={2} className="py-2 px-4 text-center bg-emerald-50/70 text-emerald-900">
                    Saldos
                  </th>
                </tr>
                <tr className="bg-slate-50 text-[10px] font-semibold text-slate-600 border-b border-slate-200">
                  <th className="py-2 px-3">Código</th>
                  <th className="py-2 px-4 font-sans border-r border-slate-200">Denominación</th>
                  <th className="py-2 px-3 text-right bg-sky-50/30">Debe</th>
                  <th className="py-2 px-3 text-right bg-sky-50/30 border-r border-slate-200">Haber</th>
                  <th className="py-2 px-3 text-right bg-emerald-50/30">Deudor</th>
                  <th className="py-2 px-3 text-right bg-emerald-50/30">Acreedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {balanceRows.map((r) => (
                  <tr key={r.code} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-bold text-slate-800">{r.code}</td>
                    <td className="py-2 px-4 font-sans font-medium text-slate-900 border-r border-slate-200">
                      {r.name}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">
                      {r.debitSum > 0 ? formatPEN(r.debitSum) : "-"}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700 border-r border-slate-200">
                      {r.creditSum > 0 ? formatPEN(r.creditSum) : "-"}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-bold">
                      {r.deudor > 0 ? formatPEN(r.deudor) : "-"}
                    </td>
                    <td className="py-2 px-3 text-right text-rose-700 font-bold">
                      {r.acreedor > 0 ? formatPEN(r.acreedor) : "-"}
                    </td>
                  </tr>
                ))}
                {/* Fila de Totales */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-800 text-xs">
                  <td colSpan={2} className="py-2.5 px-4 text-right uppercase font-sans">
                    TOTALES BALANCEADOS:
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#0F4C81]">{formatPEN(totalSumDebe)}</td>
                  <td className="py-2.5 px-3 text-right text-[#0F4C81] border-r border-slate-200">
                    {formatPEN(totalSumHaber)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                    {formatPEN(totalSaldoDeudor)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-700 font-bold">
                    {formatPEN(totalSaldoAcreedor)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO ASIENTO MANUAL */}
      {isNewEntryOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0F4C81] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Registrar Asiento Contable Manual</h3>
              </div>
              <button onClick={() => setIsNewEntryOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs shrink-0">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mt-3 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs shrink-0">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleCreateEntry} className="mt-4 space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Operación *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Glosa / Concepto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Cobranza en efectivo Factura F001-000012"
                    value={glosa}
                    onChange={(e) => setGlosa(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">Cuentas Contables (Partida Doble)</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-[#0F4C81] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                  >
                    + Agregar Cuenta
                  </button>
                </div>

                <div className="space-y-2">
                  {lines.map((l, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-6">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Cuenta PCGE
                        </label>
                        <select
                          value={l.accountCode}
                          onChange={(e) => handleLineAccountChange(idx, e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.code}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Debe (S/)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={l.debit}
                          onChange={(e) => handleLineAmountChange(idx, "debit", e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white font-mono"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Haber (S/)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={l.credit}
                          onChange={(e) => handleLineAmountChange(idx, "credit", e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white font-mono"
                        />
                      </div>

                      <div className="col-span-1 text-center pt-3">
                        {lines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales y Verificación de Partida Doble */}
              <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="font-semibold text-slate-600">Total Debe: </span>
                  <span className="font-bold text-emerald-700">{formatPEN(totalDebitNew)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Total Haber: </span>
                  <span className="font-bold text-rose-700">{formatPEN(totalCreditNew)}</span>
                </div>
                <div>
                  {isSquare ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-sans text-[11px]">
                      Cuadrado ✓
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold font-sans text-[11px]">
                      Descuadrado: {formatPEN(Math.abs(totalDebitNew - totalCreditNew))}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewEntryOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !isSquare}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-semibold disabled:opacity-50"
                >
                  {loading ? "Registrando..." : "Guardar Asiento en Libro Diario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
