"use client";

import { useState } from "react";
import { formatPEN } from "@/lib/utils";
import { createProduct, createInventoryAdjustment } from "@/app/actions/inventory";
import {
  Boxes,
  PlusCircle,
  Search,
  SlidersHorizontal,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  X,
  Layers,
} from "lucide-react";

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unitCode: string;
  avgCost: number;
  salePrice: number;
  minStock: number;
  isService: boolean;
  totalStock: number;
}

export function ProductList({ products }: { products: ProductItem[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("TODOS");
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedProductForAdj, setSelectedProductForAdj] = useState<ProductItem | null>(null);

  // Form states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Product Form
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Cómputo");
  const [unitCode, setUnitCode] = useState<"NIU" | "ZZ" | "BX">("NIU");
  const [avgCost, setAvgCost] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [initialStock, setInitialStock] = useState("0");
  const [isService, setIsService] = useState(false);

  // Adjustment Form
  const [adjType, setAdjType] = useState<"AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO">("AJUSTE_POSITIVO");
  const [adjQuantity, setAdjQuantity] = useState("");
  const [adjReason, setAdjReason] = useState("");

  const categories = ["TODOS", ...Array.from(new Set(products.map((p) => p.category || "General")))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === "TODOS" || (p.category || "General") === categoryFilter;
    return matchesSearch && matchesCat;
  });

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await createProduct({
      sku,
      name,
      category,
      unitCode: unitCode as any,
      igvType: "GRAVADO_10" as any,
      avgCost: parseFloat(avgCost) || 0,
      salePrice: parseFloat(salePrice) || 0,
      minStock: parseFloat(minStock) || 0,
      initialStock: parseFloat(initialStock) || 0,
      isService,
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "Ocurrió un error.");
    } else {
      setSuccessMsg("¡Producto creado y stock inicial registrado!");
      setTimeout(() => {
        setIsNewProductOpen(false);
        setSuccessMsg("");
        setSku("");
        setName("");
        setAvgCost("");
        setSalePrice("");
      }, 1000);
    }
  }

  async function handleAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProductForAdj) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await createInventoryAdjustment({
      productId: selectedProductForAdj.id,
      adjustmentType: adjType,
      quantity: parseFloat(adjQuantity) || 0,
      reason: adjReason,
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "Ocurrió un error.");
    } else {
      setSuccessMsg("¡Ajuste de inventario registrado en Kardex!");
      setTimeout(() => {
        setIsAdjustmentOpen(false);
        setSelectedProductForAdj(null);
        setSuccessMsg("");
        setAdjQuantity("");
        setAdjReason("");
      }, 1000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por SKU o nombre de producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "TODOS" ? "Todas las Categorías" : c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsNewProductOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Producto / Servicio</span>
        </button>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">SKU / Código</th>
                <th className="py-3 px-4">Descripción del Producto</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-right">Stock Actual</th>
                <th className="py-3 px-3 text-right">Costo Promedio</th>
                <th className="py-3 px-3 text-right">Precio Venta</th>
                <th className="py-3 px-3 text-center">Estado Stock</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No se encontraron productos coincidentes con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = !p.isService && p.totalStock === 0;
                  const isLow = !p.isService && p.totalStock <= p.minStock && !isOutOfStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 leading-snug">{p.name}</p>
                        <p className="text-[11px] text-slate-400">Unidad: {p.unitCode}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {p.category || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums">
                        {p.isService ? (
                          <span className="text-slate-400 font-normal italic">Servicio</span>
                        ) : (
                          `${p.totalStock} ${p.unitCode}`
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {formatPEN(p.avgCost)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#2563EB] tabular-nums">
                        {formatPEN(p.salePrice)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {p.isService ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                            Intangible
                          </span>
                        ) : isOutOfStock ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 inline-flex items-center gap-1">
                            Agotado
                          </span>
                        ) : isLow ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 inline-flex items-center gap-1 tabular-nums">
                            <AlertTriangle className="w-3 h-3" /> Bajo Stock
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!p.isService && (
                          <button
                            onClick={() => {
                              setSelectedProductForAdj(p);
                              setIsAdjustmentOpen(true);
                            }}
                            className="text-[11px] font-bold text-slate-700 hover:text-[#2563EB] px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                          >
                            Ajustar Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NUEVO PRODUCTO */}
      {isNewProductOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0F4C81] flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Registrar Nuevo Producto</h3>
              </div>
              <button
                onClick={() => setIsNewProductOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mt-3 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU / Código *</label>
                  <input
                    type="text"
                    required
                    placeholder="PROD-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                  <input
                    type="text"
                    placeholder="Ej: Cómputo"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre o Descripción Comercial *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Disco Sólido SSD 1TB Kingston NV2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unidad de Medida SUNAT</label>
                  <select
                    value={unitCode}
                    onChange={(e) => setUnitCode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  >
                    <option value="NIU">NIU - Unidades</option>
                    <option value="ZZ">ZZ - Servicios</option>
                    <option value="BX">BX - Cajas</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isService}
                      onChange={(e) => setIsService(e.target.checked)}
                      className="rounded border-slate-300 text-[#0F4C81] focus:ring-[#0F4C81]"
                    />
                    <span className="font-semibold text-slate-700">Es un Servicio Intangible</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Costo Unit. (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Precio Venta (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>
              </div>

              {!isService && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Inicial de Apertura</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Se registrará automáticamente como movimiento inicial en el Kardex.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewProductOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-semibold disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Registrar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE DE INVENTARIO */}
      {isAdjustmentOpen && selectedProductForAdj && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Ajuste Manual de Inventario</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedProductForAdj.name}</p>
              </div>
              <button
                onClick={() => setIsAdjustmentOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mt-3 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleAdjustment} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex justify-between">
                <span>Stock Actual en Almacén:</span>
                <span className="font-bold text-slate-900">
                  {selectedProductForAdj.totalStock} {selectedProductForAdj.unitCode}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Ajuste</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjType("AJUSTE_POSITIVO")}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                      adjType === "AJUSTE_POSITIVO"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    + Entrada (Sobrante)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType("AJUSTE_NEGATIVO")}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                      adjType === "AJUSTE_NEGATIVO"
                        ? "bg-rose-50 border-rose-500 text-rose-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    - Salida (Mermas / Pérdida)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cantidad a Ajustar *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Cantidad"
                  value={adjQuantity}
                  onChange={(e) => setAdjQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo o Justificación *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Conteo físico mensual, merma de transporte"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-semibold disabled:opacity-50"
                >
                  {loading ? "Aplicando..." : "Confirmar Ajuste en Kardex"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
