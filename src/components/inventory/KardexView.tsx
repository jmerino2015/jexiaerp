"use client";

import { useState } from "react";
import { formatPEN, formatDateTime } from "@/lib/utils";
import { Boxes, FileSpreadsheet, ArrowDownRight, ArrowUpRight, Scale, Filter } from "lucide-react";

interface KardexMovementItem {
  id: string;
  productId: string;
  createdAt: string | Date;
  movementType: string;
  documentType: string;
  documentNumber: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  balanceQty: number;
  balanceUnitCost: number;
  balanceTotal: number;
  notes: string | null;
}

interface ProductInfo {
  id: string;
  sku: string;
  name: string;
  unitCode: string;
  avgCost: number;
  totalStock: number;
  movements: KardexMovementItem[];
}

export function KardexView({ products }: { products: ProductInfo[] }) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ""
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  if (!selectedProduct) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
        No hay productos registrados con movimientos de inventario.
      </div>
    );
  }

  const movements = selectedProduct.movements || [];
  const totalValuation = selectedProduct.totalStock * selectedProduct.avgCost;

  return (
    <div className="space-y-6">
      {/* Selector de Producto y Resumen Superior */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-md">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Kardex Valorizado Ponderado (Método Promedio Móvil)
              </h2>
              <p className="text-xs text-slate-500">
                Control de inventarios según estándares de SUNAT y registro de transacciones ACID.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-80">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Seleccionar Producto
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3 Métricas del Producto Seleccionado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Stock Físico Actual
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {selectedProduct.totalStock} {selectedProduct.unitCode}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Almacén Central Lima</p>
          </div>

          <div className="p-3.5 rounded-lg bg-sky-50 border border-sky-100">
            <span className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider">
              Costo Promedio Ponderado
            </span>
            <p className="text-xl font-bold text-[#0F4C81] mt-1">
              {formatPEN(selectedProduct.avgCost)}
            </p>
            <p className="text-[11px] text-sky-600 mt-0.5">Recalculado con cada compra</p>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Valorización Total en Stock
            </span>
            <p className="text-xl font-bold text-emerald-800 mt-1">
              {formatPEN(totalValuation)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Activo corriente valorizado</p>
          </div>
        </div>
      </div>

      {/* Tabla Oficial de Kardex Valorizado */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Movimientos Cronológicos del Producto ({movements.length} operaciones)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            SKU: {selectedProduct.sku}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              {/* Encabezado Grupo */}
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <th colSpan={3} className="py-2 px-3 border-r border-slate-200">
                  Operación y Documento
                </th>
                <th colSpan={3} className="py-2 px-3 text-center bg-emerald-50/70 border-r border-slate-200 text-emerald-800">
                  Entradas (Compras / Ajustes)
                </th>
                <th colSpan={3} className="py-2 px-3 text-center bg-rose-50/70 border-r border-slate-200 text-rose-800">
                  Salidas (Ventas / Mermas)
                </th>
                <th colSpan={3} className="py-2 px-3 text-center bg-sky-50/70 text-[#0F4C81]">
                  Saldo Final en Existencias
                </th>
              </tr>
              {/* Encabezado Columnas */}
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <th className="py-2 px-3">Fecha y Hora</th>
                <th className="py-2 px-2">Tipo</th>
                <th className="py-2 px-3 border-r border-slate-200">Doc. Referencia</th>

                {/* Entradas */}
                <th className="py-2 px-2 text-right bg-emerald-50/40">Cant.</th>
                <th className="py-2 px-2 text-right bg-emerald-50/40">C. Unit</th>
                <th className="py-2 px-2 text-right bg-emerald-50/40 border-r border-slate-200">Total</th>

                {/* Salidas */}
                <th className="py-2 px-2 text-right bg-rose-50/40">Cant.</th>
                <th className="py-2 px-2 text-right bg-rose-50/40">C. Unit</th>
                <th className="py-2 px-2 text-right bg-rose-50/40 border-r border-slate-200">Total</th>

                {/* Saldos */}
                <th className="py-2 px-2 text-right bg-sky-50/40 font-bold">Cant.</th>
                <th className="py-2 px-2 text-right bg-sky-50/40 font-bold">Costo Prom.</th>
                <th className="py-2 px-3 text-right bg-sky-50/40 font-bold">Total Valorizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 font-sans">
                    No hay registros de movimientos en el Kardex para este producto.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const isEntry = m.quantity > 0;
                  const isExit = m.quantity < 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-sans text-slate-600">
                        {formatDateTime(m.createdAt)}
                      </td>
                      <td className="py-2.5 px-2 font-sans">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            m.movementType.includes("ENTRADA") || m.movementType === "INICIAL"
                              ? "bg-emerald-100 text-emerald-800"
                              : m.movementType.includes("SALIDA")
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {m.movementType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800 font-semibold truncate max-w-[140px]" title={m.documentNumber}>
                        {m.documentNumber}
                      </td>

                      {/* ENTRADAS */}
                      <td className="py-2.5 px-2 text-right bg-emerald-50/20 text-emerald-700 font-semibold">
                        {isEntry ? m.quantity : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-right bg-emerald-50/20 text-slate-600">
                        {isEntry ? formatPEN(m.unitCost) : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-right bg-emerald-50/20 border-r border-slate-200 text-emerald-700 font-semibold">
                        {isEntry ? formatPEN(m.totalCost) : "-"}
                      </td>

                      {/* SALIDAS */}
                      <td className="py-2.5 px-2 text-right bg-rose-50/20 text-rose-700 font-semibold">
                        {isExit ? Math.abs(m.quantity) : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-right bg-rose-50/20 text-slate-600">
                        {isExit ? formatPEN(m.unitCost) : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-right bg-rose-50/20 border-r border-slate-200 text-rose-700 font-semibold">
                        {isExit ? formatPEN(Math.abs(m.totalCost)) : "-"}
                      </td>

                      {/* SALDO ACUMULADO */}
                      <td className="py-2.5 px-2 text-right bg-sky-50/20 font-bold text-slate-900">
                        {m.balanceQty}
                      </td>
                      <td className="py-2.5 px-2 text-right bg-sky-50/20 font-semibold text-slate-800">
                        {formatPEN(m.balanceUnitCost)}
                      </td>
                      <td className="py-2.5 px-3 text-right bg-sky-50/20 font-bold text-[#0F4C81]">
                        {formatPEN(m.balanceTotal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
