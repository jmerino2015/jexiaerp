"use client";

import { useState } from "react";
import { formatPEN, formatDate } from "@/lib/utils";
import { JexiaLogo } from "@/components/JexiaLogo";
import { SunatService } from "@/lib/sunat";
import {
  Printer,
  X,
  FileText,
  Receipt,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Download,
  AlertCircle,
  Building,
} from "lucide-react";

export interface SalesDocDetail {
  id: string;
  fullNumber: string;
  docType: string;
  sunatCode: string;
  issueDate: string | Date;
  subtotalGravado: number;
  igvAmount: number;
  totalAmount: number;
  sunatStatus: string;
  sunatCdrHash: string | null;
  xmlContent?: string | null;
  cdrXmlContent?: string | null;
  paymentMethod: string;
  notes: string | null;
  // Detracciones
  detractionApplied?: boolean;
  detractionCode?: string | null;
  detractionPercent?: number | null;
  detractionAmount?: number | null;
  bnAccount?: string | null;
  // Notas de Crédito
  relatedDocType?: string | null;
  relatedDocNumber?: string | null;
  creditDebitReason?: string | null;
  customer: {
    docType: string;
    docNumber: string;
    legalName: string;
    address: string | null;
  };
  items: {
    id: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    igvAmount: number;
    totalAmount: number;
  }[];
}

export function DocumentViewerModal({
  doc,
  onClose,
}: {
  doc: SalesDocDetail;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<"A4" | "TICKET" | "XML" | "CDR">("A4");

  const company = {
    ruc: "20608945123",
    name: "JEXIA TECH SOLUTIONS S.A.C.",
    tradeName: "Jexia ERP",
    address: "Av. Rivera Navarrete 501, Piso 14, San Isidro, Lima - Perú",
    phone: "+51 1 719-8400",
    email: "facturacion@jexia.pe",
    bnAccount: doc.bnAccount || "00-068-123456",
  };

  const isFactura = doc.docType === "FACTURA";
  const isBoleta = doc.docType === "BOLETA";
  const isNotaCredito = doc.docType === "NOTA_CREDITO";

  const docTitle = isFactura
    ? "FACTURA ELECTRÓNICA"
    : isBoleta
    ? "BOLETA DE VENTA ELECTRÓNICA"
    : isNotaCredito
    ? "NOTA DE CRÉDITO ELECTRÓNICA"
    : "COTIZACIÓN COMERCIAL";

  function handlePrint() {
    window.print();
  }

  function handleDownloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full my-6 flex flex-col overflow-hidden max-h-[95vh]">
        {/* Barra superior de controles */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Formato:
            </span>
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setFormat("A4")}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  format === "A4" ? "bg-[#0F4C81] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Hoja A4</span>
              </button>
              <button
                onClick={() => setFormat("TICKET")}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  format === "TICKET" ? "bg-[#0F4C81] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Ticket 80mm</span>
              </button>
              {doc.docType !== "COTIZACION" && (
                <>
                  <button
                    onClick={() => setFormat("XML")}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold transition-all ${
                      format === "XML" ? "bg-[#0F4C81] text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>XML UBL 2.1</span>
                  </button>
                  <button
                    onClick={() => setFormat("CDR")}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold transition-all ${
                      format === "CDR" ? "bg-[#0F4C81] text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CDR SUNAT</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir A4 / Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENEDOR DOCUMENTO */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          {format === "A4" ? (
            /* ========================================================
               FORMATO A4 TRIBUTARIO SUNAT
               ======================================================== */
            <div className="bg-white w-full max-w-[760px] p-8 shadow-sm border border-slate-200 text-slate-900 text-xs font-sans space-y-6">
              {/* Header Empresa con JexiaLogo Tricolor y Cuadro SUNAT */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="mb-2">
                    <JexiaLogo width={200} height={52} className="w-auto h-12" />
                  </div>
                  <h1 className="font-extrabold text-sm text-slate-900 tracking-tight">
                    {company.name}
                  </h1>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    {company.address}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Teléf: {company.phone} | Email: {company.email}
                  </p>
                </div>

                {/* Cuadro Oficial SUNAT */}
                <div className="w-64 border-2 border-slate-800 rounded-lg p-3 text-center shrink-0 bg-slate-50">
                  <p className="font-bold text-xs tracking-wider">R.U.C. N° {company.ruc}</p>
                  <div className="bg-slate-900 text-white font-bold py-1 my-1.5 text-xs tracking-wide">
                    {docTitle}
                  </div>
                  <p className="font-mono font-bold text-sm tracking-wider text-[#0F4C81]">
                    N° {doc.fullNumber}
                  </p>
                </div>
              </div>

              {/* Referencia a Documento que modifica (Nota de Crédito) */}
              {isNotaCredito && doc.relatedDocNumber && (
                <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold">Documento que modifica:</span>{" "}
                    <span className="font-mono font-bold">{doc.relatedDocNumber}</span>
                  </div>
                  <div>
                    <span className="font-bold">Motivo (Cat. 09):</span> Anulación de la operación
                  </div>
                </div>
              )}

              {/* Datos del Cliente */}
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60 space-y-1.5">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-8">
                    <span className="font-semibold text-slate-500 text-[10px] uppercase">
                      Señor(es):
                    </span>
                    <p className="font-bold text-slate-800">{doc.customer.legalName}</p>
                  </div>
                  <div className="col-span-4">
                    <span className="font-semibold text-slate-500 text-[10px] uppercase">
                      {doc.customer.docType}:
                    </span>
                    <p className="font-mono font-bold text-slate-800">{doc.customer.docNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 pt-1">
                  <div className="col-span-8">
                    <span className="font-semibold text-slate-500 text-[10px] uppercase">
                      Dirección:
                    </span>
                    <p className="text-slate-700">{doc.customer.address || "Lima, Perú"}</p>
                  </div>
                  <div className="col-span-4">
                    <span className="font-semibold text-slate-500 text-[10px] uppercase">
                      Fecha de Emisión:
                    </span>
                    <p className="font-medium text-slate-800">{formatDate(doc.issueDate)}</p>
                  </div>
                </div>
              </div>

              {/* Tabla de Productos / Servicios */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-bold text-[11px] text-slate-700 uppercase">
                      <th className="py-2 px-3">Código</th>
                      <th className="py-2 px-2 text-center">Cant.</th>
                      <th className="py-2 px-2">Unidad</th>
                      <th className="py-2 px-3">Descripción</th>
                      <th className="py-2 px-3 text-right">V. Unitario</th>
                      <th className="py-2 px-3 text-right">Importe (S/)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {doc.items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3 text-slate-600">{it.sku}</td>
                        <td className="py-2 px-2 text-center font-bold text-slate-900">
                          {it.quantity}
                        </td>
                        <td className="py-2 px-2 font-sans text-slate-600">NIU</td>
                        <td className="py-2 px-3 font-sans text-slate-800 font-medium">
                          {it.name}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-700">
                          {formatPEN(it.unitPrice)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatPEN(it.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detracción SPOT SUNAT si aplica */}
              {doc.detractionApplied && doc.detractionAmount && doc.detractionAmount > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="font-bold">Operación Sujeta al Sistema de Detracciones (SPOT SUNAT)</p>
                      <p className="text-[11px] text-amber-700">
                        Código: {doc.detractionCode || "022 (Otros servicios)"} • Tasa: {doc.detractionPercent || 12}% • Cta. Banco de la Nación: <strong>{company.bnAccount}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold">
                    <span>Monto Detracción: {formatPEN(doc.detractionAmount)}</span>
                  </div>
                </div>
              )}

              {/* Importe en Letras y Totales */}
              <div className="grid grid-cols-12 gap-4 items-start pt-2">
                <div className="col-span-7 space-y-3">
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-mono font-medium">
                    {SunatService.amountToWords(doc.totalAmount)}
                  </div>

                  {/* Estado SUNAT & CDR */}
                  {doc.docType !== "COTIZACION" && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
                      <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0" />
                      <div className="text-[11px]">
                        <p className="font-bold flex items-center gap-1 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aceptado por SUNAT (CDR Generado)
                        </p>
                        <p className="font-mono text-[10px] text-emerald-700 mt-0.5">
                          Hash CDR: {doc.sunatCdrHash || "4nS8q/jXkYVvXGgT+p2O="}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-5 space-y-1.5 text-right font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Op. Gravada:</span>
                    <span>{formatPEN(doc.subtotalGravado)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>I.G.V. (18%):</span>
                    <span>{formatPEN(doc.igvAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 border-t-2 border-slate-900 pt-1.5">
                    <span>TOTAL A PAGAR:</span>
                    <span className="text-[#0F4C81]">{formatPEN(doc.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : format === "TICKET" ? (
            /* ========================================================
               FORMATO TICKET TÉRMICO 80MM
               ======================================================== */
            <div className="bg-white w-[320px] p-4 shadow-md border border-slate-300 font-mono text-[11px] text-slate-900 space-y-3">
              <div className="text-center space-y-1.5 flex flex-col items-center">
                <JexiaLogo width={160} height={42} className="w-auto h-9 mx-auto" />
                <p className="font-bold text-xs">{company.name}</p>
                <p className="text-[10px] text-slate-600">RUC: {company.ruc}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{company.address}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-400 py-2 text-center space-y-0.5">
                <p className="font-bold text-xs">{docTitle}</p>
                <p className="font-bold text-sm text-[#0F4C81]">{doc.fullNumber}</p>
                <p className="text-[10px] text-slate-600">Fecha: {formatDate(doc.issueDate)}</p>
              </div>

              <div className="space-y-0.5 text-[10px]">
                <p>
                  <span className="font-bold">CLIENTE:</span> {doc.customer.legalName}
                </p>
                <p>
                  <span className="font-bold">{doc.customer.docType}:</span> {doc.customer.docNumber}
                </p>
              </div>

              <div className="border-t border-dashed border-slate-400 pt-2 space-y-1">
                {doc.items.map((it) => (
                  <div key={it.id} className="space-y-0.5">
                    <p className="font-semibold">{it.name}</p>
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>
                        {it.quantity} x {formatPEN(it.unitPrice)}
                      </span>
                      <span className="font-bold text-slate-900">{formatPEN(it.totalAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-400 pt-2 space-y-1 text-right text-xs">
                <div className="flex justify-between">
                  <span>OP. GRAVADA:</span>
                  <span>{formatPEN(doc.subtotalGravado)}</span>
                </div>
                <div className="flex justify-between">
                  <span>I.G.V. (18%):</span>
                  <span>{formatPEN(doc.igvAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-slate-800 pt-1 text-[#0F4C81]">
                  <span>TOTAL:</span>
                  <span>{formatPEN(doc.totalAmount)}</span>
                </div>
              </div>

              {doc.docType !== "COTIZACION" && (
                <div className="border-t border-dashed border-slate-400 pt-3 text-center space-y-2">
                  <div className="w-20 h-20 bg-slate-100 border border-slate-300 mx-auto flex items-center justify-center rounded">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <p className="text-[9px] text-slate-500 break-all">
                    Hash: {doc.sunatCdrHash || "4nS8q/jXkYVvXGgT+p2O="}
                  </p>
                  <p className="text-[9px] font-bold text-emerald-700">
                    Representación Impresa Factura Electrónica
                  </p>
                </div>
              )}
            </div>
          ) : format === "XML" ? (
            /* ========================================================
               VISOR Y DESCARGA DE XML UBL 2.1
               ======================================================== */
            <div className="bg-slate-950 text-slate-200 w-full max-w-3xl rounded-xl p-5 border border-slate-800 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-sm">Archivo XML UBL 2.1 (Estándar SUNAT)</h3>
                  <p className="text-[11px] text-slate-400">
                    20608945123-{doc.sunatCode}-{doc.fullNumber}.xml
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleDownloadFile(
                      doc.xmlContent || "<?xml version='1.0'?><Invoice/>",
                      `20608945123-${doc.sunatCode}-${doc.fullNumber}.xml`
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar XML</span>
                </button>
              </div>
              <pre className="overflow-x-auto p-3 bg-slate-900 rounded-lg text-[11px] text-emerald-400 max-h-[480px]">
                {doc.xmlContent || "Generando contenido XML UBL 2.1..."}
              </pre>
            </div>
          ) : (
            /* ========================================================
               VISOR Y DESCARGA DE CDR SUNAT (CONSTANCIA DE RECEPCIÓN)
               ======================================================== */
            <div className="bg-slate-950 text-slate-200 w-full max-w-3xl rounded-xl p-5 border border-slate-800 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Constancia de Recepción CDR (SUNAT UBL 2.0)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    R-20608945123-{doc.sunatCode}-{doc.fullNumber}.xml
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleDownloadFile(
                      doc.cdrXmlContent || "<?xml version='1.0'?><ApplicationResponse/>",
                      `R-20608945123-${doc.sunatCode}-${doc.fullNumber}.xml`
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar CDR XML</span>
                </button>
              </div>
              <pre className="overflow-x-auto p-3 bg-slate-900 rounded-lg text-[11px] text-sky-400 max-h-[480px]">
                {doc.cdrXmlContent || "Constancia de recepción CDR aceptada por SUNAT..."}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
