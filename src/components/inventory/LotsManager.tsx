"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { createProductLot } from "@/app/actions/lots";
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  PlusCircle,
  Search,
  Filter,
  Building2,
  Layers,
  Tag,
  AlertOctagon,
  Boxes,
  X,
  FileText,
} from "lucide-react";

export interface LotItem {
  id: string;
  lotNumber: string;
  manufactureDate: Date | string | null;
  expirationDate: Date | string | null;
  initialQty: number;
  currentQty: number;
  status: string;
  notes: string | null;
  product: {
    id: string;
    sku: string;
    name: string;
    unitCode: string;
    imageUrl?: string | null;
    hasExpiryDate: boolean;
    alertDays: number;
  };
  warehouse: {
    id: string;
    code: string;
    name: string;
  };
}

export function LotsManager({
  lots,
  products,
  warehouses,
}: {
  lots: LotItem[];
  products: any[];
  warehouses: any[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [warehouseFilter, setWarehouseFilter] = useState("TODOS");
  const [isNewLotOpen, setIsNewLotOpen] = useState(false);

  // Form states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || "");
  const [lotNumber, setLotNumber] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [initialQty, setInitialQty] = useState("20");
  const [notes, setNotes] = useState("");

  const selectedProd = products.find((p) => p.id === selectedProductId);

  // Cálculos de días restantes
  function getDaysUntilExpiry(dateStr: Date | string | null): number | null {
    if (!dateStr) return null;
    const exp = new Date(dateStr);
    const now = new Date();
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Contadores para KPIs
  const totalLots = lots.length;
  const availableLots = lots.filter((l) => l.status === "DISPONIBLE").length;
  const nearExpiryLots = lots.filter((l) => l.status === "POR_VENCER").length;
  const expiredLots = lots.filter((l) => l.status === "VENCIDO").length;

  const filteredLots = lots.filter((l) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      l.lotNumber.toLowerCase().includes(q) ||
      l.product.name.toLowerCase().includes(q) ||
      l.product.sku.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "TODOS" || l.status === statusFilter;
    const matchesWarehouse = warehouseFilter === "TODOS" || l.warehouse.id === warehouseFilter;

    return matchesSearch && matchesStatus && matchesWarehouse;
  });

  function handleAutoLotNumber() {
    const skuCode = selectedProd ? selectedProd.sku.replace(/[^A-Z0-9]/g, "").substring(0, 4) : "LOT";
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    setLotNumber(`LOT-${year}-${skuCode}-${rand}`);
  }

  async function handleCreateLot(e: React.FormEvent) {
    e.preventDefault();
    if (!lotNumber.trim()) {
      setErrorMsg("Debe ingresar un número o código de lote.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await createProductLot({
      productId: selectedProductId,
      warehouseId: selectedWarehouseId,
      lotNumber: lotNumber.trim().toUpperCase(),
      manufactureDate: manufactureDate || undefined,
      expirationDate: expirationDate || undefined,
      initialQty: parseFloat(initialQty) || 0,
      notes,
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "Error al crear el lote.");
    } else {
      setSuccessMsg("¡Lote registrado y apertura aplicada en inventario!");
      router.refresh();
      setTimeout(() => {
        setIsNewLotOpen(false);
        setSuccessMsg("");
        setLotNumber("");
        setNotes("");
        setInitialQty("20");
      }, 1000);
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs Superiores de Trazabilidad y Vencimiento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Lotes Registrados
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {totalLots}
            </span>
            <Boxes className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-[11px] text-slate-400">En todos los almacenes</p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Lotes Disponibles
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-[#10B981] font-mono tabular-nums">
              {availableLots}
            </span>
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          </div>
          <p className="text-[11px] text-emerald-600">Vigentes para venta / despacho</p>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Por Vencer (Próximos)
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-[#F59E0B] font-mono tabular-nums">
              {nearExpiryLots}
            </span>
            <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <p className="text-[11px] text-amber-700">Prioridad FEFO / Promoción</p>
        </div>

        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
            Lotes Vencidos
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-[#EF4444] font-mono tabular-nums">
              {expiredLots}
            </span>
            <AlertOctagon className="w-5 h-5 text-[#EF4444]" />
          </div>
          <p className="text-[11px] text-rose-600">Retención / Bloqueo sanitario</p>
        </div>
      </div>

      {/* Barra de Filtros y CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por lote, SKU o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="DISPONIBLE">🟢 Disponible</option>
            <option value="POR_VENCER">🟡 Por Vencer (Alerta)</option>
            <option value="VENCIDO">🔴 Vencido (Bloqueado)</option>
            <option value="AGOTADO">⚪ Agotado</option>
          </select>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="TODOS">Todos los Almacenes</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setIsNewLotOpen(true);
            setErrorMsg("");
            setSuccessMsg("");
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition-all hover:shadow hover:scale-[1.01]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Nuevo Lote</span>
        </button>
      </div>

      {/* Tabla de Lotes y Vencimientos */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-3 text-center w-12">Foto</th>
                <th className="py-3 px-3 w-36">N° Lote / Batch</th>
                <th className="py-3 px-4">Producto & SKU</th>
                <th className="py-3 px-3">Almacén</th>
                <th className="py-3 px-3 text-right">Stock Lote</th>
                <th className="py-3 px-3 text-center">Fabricación</th>
                <th className="py-3 px-3 text-center">Vencimiento</th>
                <th className="py-3 px-3 text-center">Días Restantes</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4">Notas / Trazabilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredLots.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No se encontraron lotes coincidentes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLots.map((l) => {
                  const daysLeft = getDaysUntilExpiry(l.expirationDate);

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Miniatura */}
                      <td className="py-2.5 px-3 text-center">
                        {l.product.imageUrl ? (
                          <img
                            src={l.product.imageUrl}
                            alt={l.product.name}
                            className="w-9 h-9 object-contain rounded-lg border border-slate-200 bg-white p-0.5 mx-auto shadow-2xs"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center mx-auto border border-slate-200">
                            {l.product.name.charAt(0)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-900 tabular-nums">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {l.lotNumber}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 leading-snug">{l.product.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          SKU: {l.product.sku} • {l.product.unitCode}
                        </p>
                      </td>

                      <td className="py-3 px-3 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{l.warehouse.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-[#2563EB] tabular-nums">
                        {l.currentQty} {l.product.unitCode}
                      </td>

                      <td className="py-3 px-3 text-center text-slate-600">
                        {l.manufactureDate ? formatDate(l.manufactureDate) : "-"}
                      </td>

                      <td className="py-3 px-3 text-center font-semibold text-slate-800">
                        {l.expirationDate ? formatDate(l.expirationDate) : "Sin vencimiento"}
                      </td>

                      {/* Días Restantes */}
                      <td className="py-3 px-3 text-center tabular-nums font-mono font-bold">
                        {daysLeft === null ? (
                          <span className="text-slate-400 text-[11px] font-normal">N/A</span>
                        ) : daysLeft > 0 ? (
                          <span
                            className={`text-[11px] ${
                              daysLeft <= 30 ? "text-[#F59E0B]" : "text-[#10B981]"
                            }`}
                          >
                            {daysLeft} días
                          </span>
                        ) : (
                          <span className="text-[#EF4444] text-[11px]">
                            Venció ({Math.abs(daysLeft)} d)
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 text-center">
                        {l.status === "DISPONIBLE" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disponible
                          </span>
                        ) : l.status === "POR_VENCER" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Por Vencer
                          </span>
                        ) : l.status === "VENCIDO" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                            <AlertOctagon className="w-3 h-3 text-rose-600" /> Vencido
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                            Agotado
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-[180px]">
                        {l.notes || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          MODAL: REGISTRAR NUEVO LOTE DE PRODUCTO
          ======================================================== */}
      {isNewLotOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900 tracking-tight flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#2563EB]" /> Registro y Apertura de Lote
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control de partida, fechas de caducidad e ingreso a Kardex
                </p>
              </div>
              <button
                onClick={() => setIsNewLotOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateLot} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Selección de Producto */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Producto a Lotear *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:ring-2 focus:ring-[#2563EB] font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) {p.hasExpiryDate ? "• Con Vencimiento" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de Almacén */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Almacén de Ubicación *</label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:ring-2 focus:ring-[#2563EB]"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Número de Lote */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Código / N° de Lote *</label>
                  <button
                    type="button"
                    onClick={handleAutoLotNumber}
                    className="text-[10px] font-bold text-[#2563EB] hover:underline"
                  >
                    Auto Generar
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ej: LOT-2026-POL-03"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 font-mono font-bold text-[#2563EB] rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {/* Fechas de Fabricación y Vencimiento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Fabricación</label>
                  <input
                    type="date"
                    value={manufactureDate}
                    onChange={(e) => setManufactureDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Cantidad Inicial */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cantidad Inicial de Apertura ({selectedProd?.unitCode || "NIU"})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={initialQty}
                  onChange={(e) => setInitialQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] font-mono font-bold tabular-nums"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Se incrementará el stock del almacén seleccionado y se registrará en el Kardex.
                </p>
              </div>

              {/* Notas */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas / Sustento</label>
                <textarea
                  rows={2}
                  placeholder="Certificado de análisis, condiciones de almacenamiento, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0]"
                />
              </div>

              {/* Botonera */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsNewLotOpen(false)}
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
                      <span>Guardando lote...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Guardar Lote</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
