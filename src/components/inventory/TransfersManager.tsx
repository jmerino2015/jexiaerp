"use client";

import { useState } from "react";
import { formatPEN, formatDate } from "@/lib/utils";
import { createStockTransfer } from "@/app/actions/transfers";
import { GreViewerModal, GreDocumentDetail } from "./GreViewerModal";
import {
  Truck,
  PlusCircle,
  Search,
  ArrowRight,
  ArrowLeftRight,
  Building2,
  FileText,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Trash2,
  Package,
  Calendar,
  Layers,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  address: string | null;
  isDefault: boolean;
}

export interface ProductStockInfo {
  id: string;
  sku: string;
  name: string;
  unitCode: string;
  avgCost: number;
  stocks: {
    warehouseId: string;
    quantity: number;
  }[];
}

export function TransfersManager({
  transfers,
  warehouses,
  products,
}: {
  transfers: any[];
  warehouses: WarehouseItem[];
  products: ProductStockInfo[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false);
  const [selectedTransferForView, setSelectedTransferForView] = useState<GreDocumentDetail | null>(null);

  // Form states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // New Transfer Inputs
  const [fromWarehouseId, setFromWarehouseId] = useState(warehouses[0]?.id || "");
  const [toWarehouseId, setToWarehouseId] = useState(warehouses[1]?.id || warehouses[0]?.id || "");
  const [transferReason, setTransferReason] = useState("04");
  const [transferReasonDesc, setTransferReasonDesc] = useState("Traslado entre establecimientos de la misma empresa");
  const [transportMode, setTransportMode] = useState("02"); // 02: Privado, 01: Público

  const fromWh = warehouses.find((w) => w.id === fromWarehouseId);
  const toWh = warehouses.find((w) => w.id === toWarehouseId);

  const [originAddress, setOriginAddress] = useState(fromWh?.address || "Av. Rivera Navarrete 501, San Isidro");
  const [destAddress, setDestAddress] = useState(toWh?.address || "Jr. Gamarra 840, La Victoria");

  // Transporte Privado
  const [driverName, setDriverName] = useState("Juan Carlos Pérez");
  const [driverDocNumber, setDriverDocNumber] = useState("45892147");
  const [driverLicense, setDriverLicense] = useState("Q45892147");
  const [vehiclePlate, setVehiclePlate] = useState("B7X-912");

  // Transporte Público
  const [carrierRuc, setCarrierRuc] = useState("");
  const [carrierName, setCarrierName] = useState("");

  const [totalWeight, setTotalWeight] = useState("25.0");
  const [packagesCount, setPackagesCount] = useState("2");
  const [notes, setNotes] = useState("");

  // Items to transfer
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || "", quantity: 10 },
  ]);

  function getAvailableStock(productId: string, whId: string): number {
    const p = products.find((prod) => prod.id === productId);
    if (!p) return 0;
    const st = p.stocks.find((s) => s.warehouseId === whId);
    return st ? st.quantity : 0;
  }

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      {
        productId: products[0]?.id || "",
        quantity: 5,
      },
    ]);
  }

  function handleRemoveItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleItemChange(idx: number, field: "productId" | "quantity", value: any) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i === idx) {
          return { ...it, [field]: value };
        }
        return it;
      })
    );
  }

  const filteredTransfers = transfers.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.transferNumber.toLowerCase().includes(q) ||
      (t.greFullNumber && t.greFullNumber.toLowerCase().includes(q)) ||
      t.fromWarehouse.name.toLowerCase().includes(q) ||
      t.toWarehouse.name.toLowerCase().includes(q)
    );
  });

  async function handleCreateTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (fromWarehouseId === toWarehouseId) {
      setErrorMsg("El almacén de origen y destino deben ser diferentes.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await createStockTransfer({
      fromWarehouseId,
      toWarehouseId,
      transferReason,
      transferReasonDesc,
      transportMode,
      originAddress,
      destAddress,
      driverName: transportMode === "02" ? driverName : undefined,
      driverDocNumber: transportMode === "02" ? driverDocNumber : undefined,
      driverLicense: transportMode === "02" ? driverLicense : undefined,
      vehiclePlate: transportMode === "02" ? vehiclePlate : undefined,
      carrierRuc: transportMode === "01" ? carrierRuc : undefined,
      carrierName: transportMode === "01" ? carrierName : undefined,
      totalWeight: parseFloat(totalWeight) || 10,
      packagesCount: parseInt(packagesCount, 10) || items.length,
      notes,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity),
      })),
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "Ocurrió un error al procesar la transferencia.");
    } else {
      setSuccessMsg("¡Transferencia completada y Guía de Remisión (GRE T001) emitida con éxito!");
      setTimeout(() => {
        setIsNewTransferOpen(false);
        setSuccessMsg("");
        if (res.data) {
          setSelectedTransferForView(res.data as any);
        }
      }, 1000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por N° Transferencia, Guía GRE o Almacén..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        <button
          onClick={() => {
            setIsNewTransferOpen(true);
            setErrorMsg("");
            setSuccessMsg("");
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition-all hover:shadow hover:scale-[1.01]"
        >
          <Truck className="w-4 h-4" />
          <span>Nueva Transferencia & GRE (SUNAT 09)</span>
        </button>
      </div>

      {/* Tarjetas Informativas de Almacenes Registrados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {warehouses.map((w) => (
          <div
            key={w.id}
            className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs flex items-center justify-between"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
                <span className="font-bold text-xs text-slate-900">{w.name}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight truncate max-w-[200px]">
                {w.address || "Dirección no registrada"}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                w.isDefault
                  ? "bg-blue-50 text-[#2563EB] border border-blue-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {w.code}
            </span>
          </div>
        ))}
      </div>

      {/* Tabla de Transferencias y Guías de Remisión */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-4 w-32">N° Transferencia</th>
                <th className="py-3 px-3 w-32">Guía SUNAT (09)</th>
                <th className="py-3 px-4">Origen ➔ Destino</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3 text-center">Modalidad</th>
                <th className="py-3 px-3 text-right">Items</th>
                <th className="py-3 px-3 text-right">Peso (KGM)</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No se han registrado transferencias internas aún. Haz clic en el botón superior para crear la primera.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                      {t.transferNumber}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 tabular-nums">
                        {t.greFullNumber || "T001-PENDIENTE"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span>{t.fromWarehouse.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[#2563EB]">{t.toWarehouse.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {t.vehiclePlate ? `Vehículo: ${t.vehiclePlate}` : "Transporte propio"}
                      </p>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {formatDate(t.issueDate)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {t.transportMode === "02" ? "Privado" : "Público"}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-800">
                      {t.items?.length || 0}
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                      {t.totalWeight ? `${t.totalWeight.toFixed(1)} KGM` : "-"}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completada
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedTransferForView(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border border-slate-300 transition-colors"
                        title="Ver Guía de Remisión A4 y XML"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Ver GRE (A4)</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          MODAL: NUEVA TRANSFERENCIA MULTI-ALMACÉN CON GRE SUNAT 09
          ======================================================== */}
      {isNewTransferOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#2563EB]" /> Nueva Transferencia & Guía de Remisión (GRE)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Traslado oficial de mercadería entre almacenes con serie SUNAT T001 y descuento atómico en Kardex
                </p>
              </div>
              <button
                onClick={() => setIsNewTransferOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleCreateTransfer} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Almacén Origen y Destino */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-slate-50 space-y-3">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-[#2563EB]" /> Establecimientos Involucrados
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Almacén de Origen (Punto de Partida) *
                    </label>
                    <select
                      value={fromWarehouseId}
                      onChange={(e) => {
                        const whId = e.target.value;
                        setFromWarehouseId(whId);
                        const wh = warehouses.find((w) => w.id === whId);
                        if (wh?.address) setOriginAddress(wh.address);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:ring-2 focus:ring-[#2563EB] font-medium"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Dirección de partida"
                      value={originAddress}
                      onChange={(e) => setOriginAddress(e.target.value)}
                      className="w-full mt-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Almacén de Destino (Punto de Llegada) *
                    </label>
                    <select
                      value={toWarehouseId}
                      onChange={(e) => {
                        const whId = e.target.value;
                        setToWarehouseId(whId);
                        const wh = warehouses.find((w) => w.id === whId);
                        if (wh?.address) setDestAddress(wh.address);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:ring-2 focus:ring-[#2563EB] font-medium"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Dirección de llegada"
                      value={destAddress}
                      onChange={(e) => setDestAddress(e.target.value)}
                      className="w-full mt-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Datos del Traslado SUNAT */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Motivo del Traslado (Catálogo 20 SUNAT)
                  </label>
                  <select
                    value={transferReason}
                    onChange={(e) => {
                      setTransferReason(e.target.value);
                      if (e.target.value === "04") {
                        setTransferReasonDesc("Traslado entre establecimientos de la misma empresa");
                      } else if (e.target.value === "01") {
                        setTransferReasonDesc("Venta");
                      } else {
                        setTransferReasonDesc("Otros traslados no especificados");
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="04">04 - Traslado entre establecimientos de la misma empresa</option>
                    <option value="01">01 - Venta</option>
                    <option value="02">02 - Compra</option>
                    <option value="13">13 - Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Modalidad de Transporte (Catálogo 18 SUNAT)
                  </label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="02">02 - Transporte Privado (Vehículo y conductor propio)</option>
                    <option value="01">01 - Transporte Público (Empresa transportista)</option>
                  </select>
                </div>
              </div>

              {/* Conductor y Vehículo */}
              {transportMode === "02" ? (
                <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-slate-50 space-y-2">
                  <span className="font-bold text-slate-800 text-[11px] block">
                    Datos del Conductor y Vehículo (Transporte Privado):
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">DNI Conductor</label>
                      <input
                        type="text"
                        placeholder="45892147"
                        value={driverDocNumber}
                        onChange={(e) => setDriverDocNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nombre Conductor</label>
                      <input
                        type="text"
                        placeholder="Juan Carlos Pérez"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">N° Licencia (Brevete)</label>
                      <input
                        type="text"
                        placeholder="Q45892147"
                        value={driverLicense}
                        onChange={(e) => setDriverLicense(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Placa del Vehículo</label>
                      <input
                        type="text"
                        placeholder="B7X-912"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-[#2563EB]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-slate-50 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">RUC Empresa de Transporte</label>
                    <input
                      type="text"
                      placeholder="20556789123"
                      value={carrierRuc}
                      onChange={(e) => setCarrierRuc(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Razón Social Transportista</label>
                    <input
                      type="text"
                      placeholder="TRANSPORTES NACIONALES S.A.C."
                      value={carrierName}
                      onChange={(e) => setCarrierName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Items a Transferir */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    Productos a Trasladar
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Agregar Ítem
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Producto</th>
                        <th className="py-2 px-3 text-center w-28">Stock en Origen</th>
                        <th className="py-2 px-3 text-right w-28">Cantidad a Trasladar</th>
                        <th className="py-2 px-2 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((it, idx) => {
                        const avail = getAvailableStock(it.productId, fromWarehouseId);
                        const isExcess = it.quantity > avail;

                        return (
                          <tr key={idx} className="bg-white">
                            <td className="py-2 px-3">
                              <select
                                value={it.productId}
                                onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-2 px-3 text-center font-mono font-semibold tabular-nums">
                              <span
                                className={`px-2 py-0.5 rounded ${
                                  avail > 0 ? "bg-slate-100 text-slate-700" : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {avail} disp.
                              </span>
                            </td>

                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                min="1"
                                max={avail}
                                value={it.quantity}
                                onChange={(e) =>
                                  handleItemChange(idx, "quantity", Math.max(1, parseInt(e.target.value, 10) || 1))
                                }
                                className={`w-24 px-2.5 py-1.5 rounded-lg border text-right font-mono font-bold tabular-nums focus:outline-none ${
                                  isExcess
                                    ? "border-rose-400 bg-rose-50 text-rose-700"
                                    : "border-slate-200 text-[#2563EB]"
                                }`}
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Carga y Notas */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Peso Bruto Total (KGM)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={totalWeight}
                    onChange={(e) => setTotalWeight(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Cantidad de Bultos / Cajas
                  </label>
                  <input
                    type="number"
                    value={packagesCount}
                    onChange={(e) => setPackagesCount(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Observaciones adicionales
                  </label>
                  <input
                    type="text"
                    placeholder="Traslado urgente de mercadería"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsNewTransferOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Procesando en Kardex y SUNAT...</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      <span>Emitir GRE y Trasladar Stock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE VISTA PREVIA GRE (A4 / XML UBL 2.1)
          ======================================================== */}
      {selectedTransferForView && (
        <GreViewerModal
          transfer={selectedTransferForView}
          onClose={() => setSelectedTransferForView(null)}
        />
      )}
    </div>
  );
}
