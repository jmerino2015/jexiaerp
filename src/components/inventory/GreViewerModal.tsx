"use client";

import { useState } from "react";
import { JexiaLogo } from "@/components/JexiaLogo";
import { formatDate } from "@/lib/utils";
import { buildGreUblXml } from "@/lib/ubl-gre-builder";
import {
  Truck,
  Printer,
  Download,
  X,
  FileCode,
  ShieldCheck,
  Building2,
  MapPin,
  QrCode,
  CheckCircle2,
} from "lucide-react";

export interface GreDocumentDetail {
  id: string;
  transferNumber: string;
  greFullNumber: string;
  issueDate: Date | string;
  transferReasonDesc: string;
  transportMode: string;
  fromWarehouse: {
    name: string;
    code: string;
    address: string | null;
  };
  toWarehouse: {
    name: string;
    code: string;
    address: string | null;
  };
  originAddress: string;
  destAddress: string;
  driverDocNumber?: string | null;
  driverName?: string | null;
  driverLicense?: string | null;
  vehiclePlate?: string | null;
  carrierRuc?: string | null;
  carrierName?: string | null;
  totalWeight: number;
  packagesCount: number;
  sunatCdrHash?: string | null;
  notes?: string | null;
  items: {
    id: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    product: {
      sku: string;
      name: string;
      unitCode: string;
    };
  }[];
}

export function GreViewerModal({
  transfer,
  onClose,
}: {
  transfer: GreDocumentDetail;
  onClose: () => void;
}) {
  const [viewMode, setViewMode] = useState<"A4" | "XML">("A4");

  const company = {
    ruc: "20608945123",
    name: "JEXIA TECH SOLUTIONS S.A.C.",
    tradeName: "Jexia ERP",
    address: "Av. Rivera Navarrete 501, Piso 14, San Isidro, Lima - Perú",
    phone: "+51 1 719-8400",
    email: "logistica@jexia.pe",
  };

  const { xml, digestValue, cdrHash } = buildGreUblXml({
    company: {
      ruc: company.ruc,
      businessName: company.name,
      tradeName: company.tradeName,
      fiscalAddress: company.address,
      ubigeo: "150131",
    },
    greSeries: transfer.greFullNumber.split("-")[0] || "T001",
    greNumber: parseInt(transfer.greFullNumber.split("-")[1] || "1", 10),
    greFullNumber: transfer.greFullNumber,
    issueDate: transfer.issueDate,
    transferReason: "04",
    transferReasonDesc: transfer.transferReasonDesc,
    transportMode: transfer.transportMode,
    originAddress: transfer.originAddress,
    originUbigeo: "150101",
    destAddress: transfer.destAddress,
    destUbigeo: "150101",
    driverDocNumber: transfer.driverDocNumber || undefined,
    driverName: transfer.driverName || undefined,
    driverLicense: transfer.driverLicense || undefined,
    vehiclePlate: transfer.vehiclePlate || undefined,
    carrierRuc: transfer.carrierRuc || undefined,
    carrierName: transfer.carrierName || undefined,
    totalWeight: transfer.totalWeight,
    packagesCount: transfer.packagesCount,
    items: transfer.items.map((it) => ({
      id: it.id,
      sku: it.product.sku,
      name: it.product.name,
      unitCode: it.product.unitCode,
      quantity: it.quantity,
    })),
  });

  function handleDownloadXml() {
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${company.ruc}-09-${transfer.greFullNumber}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in">
        {/* Top bar */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-sm">
                Guía de Remisión Remitente (GRE): {transfer.greFullNumber}
              </span>
            </div>

            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setViewMode("A4")}
                className={`px-3 py-1 rounded-md font-bold transition-colors ${
                  viewMode === "A4" ? "bg-[#2563EB] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Formato A4 Oficial
              </button>
              <button
                onClick={() => setViewMode("XML")}
                className={`px-3 py-1 rounded-md font-bold transition-colors flex items-center gap-1 ${
                  viewMode === "XML" ? "bg-[#2563EB] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>XML UBL 2.1</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "A4" ? (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir A4</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadXml}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar XML</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          {viewMode === "A4" ? (
            /* ========================================================
               REPRESENTACIÓN IMPRESA A4 - GUÍA DE REMISIÓN REMITENTE
               ======================================================== */
            <div className="bg-white w-full max-w-[780px] p-8 shadow-sm border border-slate-200 text-slate-900 text-xs font-sans space-y-5">
              {/* Header Empresa y Cuadro Oficial GRE */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="mb-2">
                    <JexiaLogo width={190} height={48} className="w-auto h-11" />
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

                {/* Cuadro Oficial SUNAT Código 09 */}
                <div className="w-72 border-2 border-slate-900 rounded-lg p-3 text-center shrink-0 bg-slate-50">
                  <p className="font-bold text-xs tracking-wider">R.U.C. N° {company.ruc}</p>
                  <div className="bg-slate-900 text-white font-bold py-1.5 my-1.5 text-xs tracking-wide uppercase leading-tight">
                    GUÍA DE REMISIÓN ELECTRÓNICA<br />REMITENTE
                  </div>
                  <p className="font-mono font-bold text-sm tracking-wider text-[#2563EB]">
                    N° {transfer.greFullNumber}
                  </p>
                </div>
              </div>

              {/* Datos del Traslado */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 grid grid-cols-12 gap-3">
                <div className="col-span-4">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">
                    Fecha de Emisión:
                  </span>
                  <p className="font-semibold text-slate-800">{formatDate(transfer.issueDate)}</p>
                </div>
                <div className="col-span-4">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">
                    Motivo de Traslado (Cat. 20):
                  </span>
                  <p className="font-semibold text-slate-800">{transfer.transferReasonDesc}</p>
                </div>
                <div className="col-span-4">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">
                    Modalidad de Transporte:
                  </span>
                  <p className="font-semibold text-slate-800">
                    {transfer.transportMode === "02" ? "Transporte Privado (Vehículo propio)" : "Transporte Público"}
                  </p>
                </div>
              </div>

              {/* Puntos de Partida y Llegada */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-1">
                  <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1 text-[#2563EB]">
                    <MapPin className="w-3.5 h-3.5" /> Punto de Partida (Origen)
                  </span>
                  <p className="text-[11px] font-semibold text-slate-800">
                    {transfer.fromWarehouse.name} ({transfer.fromWarehouse.code})
                  </p>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    {transfer.originAddress}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">Ubigeo: 150101 (Lima - Lima)</p>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-1">
                  <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1 text-[#10B981]">
                    <MapPin className="w-3.5 h-3.5" /> Punto de Llegada (Destino)
                  </span>
                  <p className="text-[11px] font-semibold text-slate-800">
                    {transfer.toWarehouse.name} ({transfer.toWarehouse.code})
                  </p>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    {transfer.destAddress}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">Ubigeo: 150101 (Lima - Lima)</p>
                </div>
              </div>

              {/* Datos de Transporte y Conductor */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 grid grid-cols-12 gap-3">
                <div className="col-span-4">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">
                    Conductor Autorizado:
                  </span>
                  <p className="font-semibold text-slate-800">{transfer.driverName || "Juan Carlos Pérez"}</p>
                  <p className="text-[10px] text-slate-500 font-mono">DNI: {transfer.driverDocNumber || "45892147"}</p>
                </div>

                <div className="col-span-4">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">
                    Licencia de Conducir:
                  </span>
                  <p className="font-mono font-semibold text-slate-800">{transfer.driverLicense || "Q-45892147"}</p>
                </div>

                <div className="col-span-4">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">
                    Placa de Rodaje del Vehículo:
                  </span>
                  <p className="font-mono font-bold text-base text-[#2563EB]">{transfer.vehiclePlate || "B7X-912"}</p>
                </div>
              </div>

              {/* Tabla de Mercadería */}
              <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-center w-12">Ítem</th>
                    <th className="py-2 px-3 w-28">Código SKU</th>
                    <th className="py-2 px-3">Descripción de los Bienes</th>
                    <th className="py-2 px-2 text-center w-16">U.M.</th>
                    <th className="py-2 px-3 text-right w-20">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transfer.items.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="py-2 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-800">{it.product.sku}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{it.product.name}</td>
                      <td className="py-2 px-2 text-center text-slate-600 font-mono">{it.product.unitCode}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold tabular-nums text-[#2563EB]">
                        {it.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Carga y QR Footer */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs">
                    <span className="font-bold text-slate-600">PESO BRUTO TOTAL:</span>{" "}
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {transfer.totalWeight.toFixed(2)} KGM
                    </span>
                  </p>
                  <p className="text-xs">
                    <span className="font-bold text-slate-600">NÚMERO DE BULTOS:</span>{" "}
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {transfer.packagesCount}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono break-all pt-1">
                    Hash CDR: {transfer.sunatCdrHash || cdrHash}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-16 h-16 bg-white border border-slate-300 rounded flex items-center justify-center p-1 shadow-2xs">
                    <QrCode className="w-14 h-14 text-slate-800" />
                  </div>
                  <div className="text-[10px] text-slate-500 max-w-[200px] leading-tight">
                    <p className="font-bold text-slate-700">Comprobante Autorizado por SUNAT</p>
                    <p>Representación impresa de la Guía de Remisión Electrónica Remitente.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* XML Viewer */
            <div className="bg-slate-950 text-slate-100 w-full max-w-[780px] p-4 rounded-xl font-mono text-[11px] overflow-x-auto shadow-inner">
              <pre className="whitespace-pre-wrap">{xml}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
