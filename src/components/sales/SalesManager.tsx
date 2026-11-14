"use client";

import { useState } from "react";
import { formatPEN, formatDate } from "@/lib/utils";
import { createSalesDocument, convertQuoteToSalesDoc } from "@/app/actions/sales";
import { DocumentViewerModal, SalesDocDetail } from "./DocumentViewerModal";
import {
  Receipt,
  PlusCircle,
  Search,
  CheckCircle2,
  FileText,
  Printer,
  ShieldCheck,
  Building,
  Trash2,
  Clock,
  AlertCircle,
  Percent,
} from "lucide-react";

interface CustomerOption {
  id: string;
  docType: string;
  docNumber: string;
  legalName: string;
}

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  salePrice: number;
  totalStock: number;
  unitCode: string;
}

export function SalesManager({
  documents,
  customers,
  products,
}: {
  documents: SalesDocDetail[];
  customers: CustomerOption[];
  products: ProductOption[];
}) {
  const [activeTab, setActiveTab] = useState<"comprobantes" | "pos" | "cotizaciones">("comprobantes");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocForView, setSelectedDocForView] = useState<SalesDocDetail | null>(null);

  // POS State
  const [posDocType, setPosDocType] = useState<"FACTURA" | "BOLETA" | "COTIZACION" | "NOTA_CREDITO">("BOLETA");
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || "");
  const [paymentMethod, setPaymentMethod] = useState<
    "EFECTIVO" | "TRANSFERENCIA" | "YAPE_PLIN" | "TARJETA" | "CREDITO"
  >("EFECTIVO");
  const [posNotes, setPosNotes] = useState("");

  // Detracción SPOT
  const [detractionApplied, setDetractionApplied] = useState(false);
  const [detractionCode, setDetractionCode] = useState("022");
  const [detractionPercent, setDetractionPercent] = useState(12);

  // Nota de Crédito
  const [relatedDocNumber, setRelatedDocNumber] = useState("");
  const [creditDebitReason, setCreditDebitReason] = useState("01");

  const [posItems, setPosItems] = useState<
    { productId: string; quantity: number; unitPrice: number }[]
  >([
    {
      productId: products[0]?.id || "",
      quantity: 1,
      unitPrice: products[0]?.salePrice || 100,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Totales POS
  const subtotalGravado = posItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const igvAmount = subtotalGravado * 0.18;
  const totalAmount = subtotalGravado + igvAmount;
  const detractionAmount = detractionApplied && totalAmount > 700 ? totalAmount * (detractionPercent / 100) : 0;

  function handleAddPosItem() {
    setPosItems((prev) => [
      ...prev,
      {
        productId: products[0]?.id || "",
        quantity: 1,
        unitPrice: products[0]?.salePrice || 50,
      },
    ]);
  }

  function handleRemovePosItem(idx: number) {
    setPosItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handlePosItemChange(
    idx: number,
    field: "productId" | "quantity" | "unitPrice",
    val: any
  ) {
    setPosItems((prev) => {
      const copy = [...prev];
      if (field === "productId") {
        const prod = products.find((p) => p.id === val);
        copy[idx].productId = val;
        if (prod && prod.salePrice > 0) {
          copy[idx].unitPrice = prod.salePrice;
        }
      } else {
        copy[idx][field] = Number(val);
      }
      return copy;
    });
  }

  async function handleEmitSale(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await createSalesDocument({
      docType: posDocType,
      customerId: selectedCustomerId,
      paymentMethod,
      notes: posNotes,
      items: posItems,
      detractionApplied,
      detractionCode,
      detractionPercent,
      relatedDocType: "01",
      relatedDocNumber,
      creditDebitReason,
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "Error al emitir el comprobante.");
    } else {
      setSuccessMsg(`¡${posDocType} emitida exitosamente con UBL 2.1 y aceptada por SUNAT!`);
      setTimeout(() => {
        setSuccessMsg("");
        setActiveTab("comprobantes");
      }, 1200);
    }
  }

  async function handleConvertQuote(quoteId: string, targetType: "FACTURA" | "BOLETA") {
    if (!confirm(`¿Convertir cotización en ${targetType} Electrónica ahora?`)) return;
    setLoading(true);
    const res = await convertQuoteToSalesDoc(quoteId, targetType);
    setLoading(false);
    if (!res.success) {
      alert(res.error || "Error al convertir.");
    } else {
      alert(`¡Cotización convertida exitosamente a ${targetType}!`);
      setActiveTab("comprobantes");
    }
  }

  // Filtrado de documentos
  const fiscalDocs = documents.filter((d) => d.docType !== "COTIZACION");
  const quoteDocs = documents.filter((d) => d.docType === "COTIZACION");

  const displayedDocs = (activeTab === "cotizaciones" ? quoteDocs : fiscalDocs).filter((d) => {
    const term = searchTerm.toLowerCase();
    return (
      d.fullNumber.toLowerCase().includes(term) ||
      d.customer.legalName.toLowerCase().includes(term) ||
      d.customer.docNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Pestañas Superiores */}
      <div className="flex border-b border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab("comprobantes")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "comprobantes"
              ? "border-[#2563EB] text-[#2563EB] bg-sky-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Comprobantes SUNAT (Facturas, Boletas y N/C)</span>
        </button>

        <button
          onClick={() => setActiveTab("pos")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "pos"
              ? "border-[#2563EB] text-[#2563EB] bg-sky-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <PlusCircle className="w-4 h-4 text-[#10B981]" />
          <span>Punto de Venta / Emisión UBL 2.1 (POS)</span>
        </button>

        <button
          onClick={() => setActiveTab("cotizaciones")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "cotizaciones"
              ? "border-[#2563EB] text-[#2563EB] bg-sky-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4 text-[#2563EB]" />
          <span>Cotizaciones Comerciales</span>
        </button>
      </div>

      {/* CONTENIDO 1: COMPROBANTES SUNAT O COTIZACIONES */}
      {activeTab !== "pos" ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por N° comprobante o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <button
              onClick={() => {
                setPosDocType(activeTab === "cotizaciones" ? "COTIZACION" : "BOLETA");
                setActiveTab("pos");
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>
                {activeTab === "cotizaciones" ? "Nueva Cotización" : "Nueva Venta (Factura / Boleta)"}
              </span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Comprobante</th>
                    <th className="py-3 px-4">Cliente (RUC/DNI)</th>
                    <th className="py-3 px-3">Fecha Emisión</th>
                    <th className="py-3 px-3 text-right">Subtotal</th>
                    <th className="py-3 px-3 text-right">IGV (18%)</th>
                    <th className="py-3 px-4 text-right">Total (PEN)</th>
                    <th className="py-3 px-3 text-center">Estado SUNAT</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {displayedDocs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                        No se encontraron comprobantes emitidos.
                      </td>
                    </tr>
                  ) : (
                    displayedDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block tabular-nums">
                            {doc.fullNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase font-sans">
                            {doc.docType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <p className="font-bold text-slate-900 leading-snug">
                            {doc.customer.legalName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                            {doc.customer.docType}: {doc.customer.docNumber}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium font-sans">
                          {formatDate(doc.issueDate)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                          {formatPEN(doc.subtotalGravado)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                          {formatPEN(doc.igvAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#2563EB] tabular-nums">
                          {formatPEN(doc.totalAmount)}
                        </td>
                        <td className="py-3 px-3 text-center font-sans">
                          {doc.docType === "COTIZACION" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                              Vigente
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Aceptado CDR
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedDocForView(doc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-200 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>A4 / Ticket / XML</span>
                            </button>

                            {doc.docType === "COTIZACION" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleConvertQuote(doc.id, "FACTURA")}
                                  disabled={loading}
                                  className="px-2 py-1 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[10px] transition-colors"
                                >
                                  A Factura
                                </button>
                                <button
                                  onClick={() => handleConvertQuote(doc.id, "BOLETA")}
                                  disabled={loading}
                                  className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] transition-colors"
                                >
                                  A Boleta
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* CONTENIDO 2: POS / EMISIÓN RÁPIDA DE COMPROBANTES CON UBL 2.1 Y SPOT */
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Punto de Venta & Emisión UBL 2.1 (SUNAT)
              </h2>
              <p className="text-xs text-slate-500">
                Generación automática de XML firmado, CDR oficial, asiento contable y descuento de existencias.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("comprobantes")}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
            >
              ← Volver al Listado
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleEmitSale} className="space-y-5 text-xs">
            {/* Tipo de Comprobante */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Comprobante SUNAT *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPosDocType("BOLETA")}
                    className={`py-2 px-2 text-center rounded-lg border font-semibold text-[11px] transition-all ${
                      posDocType === "BOLETA"
                        ? "bg-[#0F4C81] text-white border-[#0F4C81]"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Boleta (B001)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosDocType("FACTURA")}
                    className={`py-2 px-2 text-center rounded-lg border font-semibold text-[11px] transition-all ${
                      posDocType === "FACTURA"
                        ? "bg-[#0F4C81] text-white border-[#0F4C81]"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Factura (F001)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosDocType("NOTA_CREDITO")}
                    className={`py-2 px-2 text-center rounded-lg border font-semibold text-[11px] transition-all ${
                      posDocType === "NOTA_CREDITO"
                        ? "bg-rose-700 text-white border-rose-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    N/C (FC01)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosDocType("COTIZACION")}
                    className={`py-2 px-2 text-center rounded-lg border font-semibold text-[11px] transition-all ${
                      posDocType === "COTIZACION"
                        ? "bg-[#0F4C81] text-white border-[#0F4C81]"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Cotización
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Cliente (RUC / DNI) *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.docType} {c.docNumber}] {c.legalName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medio de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria BCP/BBVA</option>
                  <option value="YAPE_PLIN">Yape / Plin</option>
                  <option value="TARJETA">Tarjeta Visa / Mastercard</option>
                  <option value="CREDITO">Crédito Comercial (15 días)</option>
                </select>
              </div>
            </div>

            {/* Campos condicionales para Nota de Crédito */}
            {posDocType === "NOTA_CREDITO" && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 grid grid-cols-2 gap-3 text-rose-900">
                <div>
                  <label className="block font-bold mb-1">Comprobante que modifica (Ej: F001-000012) *</label>
                  <input
                    type="text"
                    required
                    placeholder="F001-000012"
                    value={relatedDocNumber}
                    onChange={(e) => setRelatedDocNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-rose-300 font-mono uppercase bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Motivo SUNAT (Catálogo 09)</label>
                  <select
                    value={creditDebitReason}
                    onChange={(e) => setCreditDebitReason(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-rose-300 bg-white text-slate-900"
                  >
                    <option value="01">01 - Anulación de la operación</option>
                    <option value="07">07 - Devolución total de mercadería</option>
                    <option value="04">04 - Descuento global</option>
                  </select>
                </div>
              </div>
            )}

            {/* Checkbox Detracción SPOT Banco de la Nación */}
            {posDocType === "FACTURA" && (
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={detractionApplied}
                    onChange={(e) => setDetractionApplied(e.target.checked)}
                    className="rounded text-[#0F4C81] focus:ring-[#0F4C81]"
                  />
                  <div>
                    <span className="font-bold text-amber-900">
                      Sujeto al Sistema de Detracciones SPOT (Banco de la Nación)
                    </span>
                    <p className="text-[11px] text-amber-700">
                      Aplica cuando el total supera S/ 700 (Cta. BN: 00-068-123456)
                    </p>
                  </div>
                </label>

                {detractionApplied && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-amber-800">Tasa:</span>
                    <select
                      value={detractionPercent}
                      onChange={(e) => setDetractionPercent(Number(e.target.value))}
                      className="px-2 py-1 rounded border border-amber-300 bg-white text-amber-900 font-bold"
                    >
                      <option value="12">12% (Servicios Empresariales)</option>
                      <option value="10">10% (Mantenimiento)</option>
                      <option value="4">4% (Transporte)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Ítems */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-xs">
                  Detalle de Productos a Facturar
                </span>
                <button
                  type="button"
                  onClick={handleAddPosItem}
                  className="text-[#0F4C81] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                >
                  + Agregar Producto
                </button>
              </div>

              <div className="space-y-2">
                {posItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-6">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Producto / Servicio
                      </label>
                      <select
                        value={it.productId}
                        onChange={(e) => handlePosItemChange(idx, "productId", e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.sku}] {p.name} (Stock: {p.totalStock} {p.unitCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={it.quantity}
                        onChange={(e) => handlePosItemChange(idx, "quantity", e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Precio Venta Unit. (S/)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={it.unitPrice}
                        onChange={(e) => handlePosItemChange(idx, "unitPrice", e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white"
                      />
                    </div>

                    <div className="col-span-1 text-center pt-3">
                      {posItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePosItem(idx)}
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

            {/* Totales y Liquidación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas / Observaciones del Comprobante
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Orden de compra N° 129, entrega en obra."
                  value={posNotes}
                  onChange={(e) => setPosNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 resize-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Gravado (Base Imponible):</span>
                  <span className="font-mono font-semibold">{formatPEN(subtotalGravado)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>I.G.V. Oficial (18%):</span>
                  <span className="font-mono font-semibold">{formatPEN(igvAmount)}</span>
                </div>
                {detractionApplied && detractionAmount > 0 && (
                  <div className="flex justify-between text-amber-700 border-t border-amber-200 pt-1 text-xs">
                    <span>Monto Detracción SPOT ({detractionPercent}%):</span>
                    <span className="font-mono font-bold">- {formatPEN(detractionAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                  <span>TOTAL COMPROBANTE (PEN):</span>
                  <span className="font-mono text-[#0F4C81]">{formatPEN(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Botón de Emisión */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab("comprobantes")}
                className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold shadow-md transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>
                  {loading
                    ? "Firmando XML UBL 2.1 y Transmitiendo a SUNAT..."
                    : `Emitir ${posDocType} Electrónica (${formatPEN(totalAmount)})`}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA (A4 / TICKET / XML / CDR) */}
      {selectedDocForView && (
        <DocumentViewerModal
          doc={selectedDocForView}
          onClose={() => setSelectedDocForView(null)}
        />
      )}
    </div>
  );
}
