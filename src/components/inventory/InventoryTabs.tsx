"use client";

import { useState } from "react";
import { ProductList } from "./ProductList";
import { KardexView } from "./KardexView";
import { TransfersManager } from "./TransfersManager";
import { Boxes, FileSpreadsheet, Truck } from "lucide-react";

export function InventoryTabs({
  productsForList,
  productsForKardex,
  transfers,
  warehouses,
  productsForTransfers,
}: {
  productsForList: any[];
  productsForKardex: any[];
  transfers: any[];
  warehouses: any[];
  productsForTransfers: any[];
}) {
  const [activeTab, setActiveTab] = useState<"catalog" | "kardex" | "transfers">("catalog");

  return (
    <div className="space-y-6">
      {/* Pestañas Superiores */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "catalog"
              ? "border-[#2563EB] text-[#2563EB] bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Catálogo de Productos & Almacén</span>
        </button>

        <button
          onClick={() => setActiveTab("kardex")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "kardex"
              ? "border-[#2563EB] text-[#2563EB] bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Kardex Valorizado Ponderado</span>
        </button>

        <button
          onClick={() => setActiveTab("transfers")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "transfers"
              ? "border-[#2563EB] text-[#2563EB] bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Transferencias Multi-Almacén & Guías GRE (09)</span>
          {transfers.length > 0 && (
            <span className="ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-[#2563EB]">
              {transfers.length}
            </span>
          )}
        </button>
      </div>

      {/* Contenido según pestaña activa */}
      {activeTab === "catalog" ? (
        <ProductList products={productsForList} />
      ) : activeTab === "kardex" ? (
        <KardexView products={productsForKardex} />
      ) : (
        <TransfersManager
          transfers={transfers}
          warehouses={warehouses}
          products={productsForTransfers}
        />
      )}
    </div>
  );
}
