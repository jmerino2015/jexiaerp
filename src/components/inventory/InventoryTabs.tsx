"use client";

import { useState } from "react";
import { ProductList } from "./ProductList";
import { KardexView } from "./KardexView";
import { Boxes, FileSpreadsheet } from "lucide-react";

export function InventoryTabs({
  productsForList,
  productsForKardex,
}: {
  productsForList: any[];
  productsForKardex: any[];
}) {
  const [activeTab, setActiveTab] = useState<"catalog" | "kardex">("catalog");

  return (
    <div className="space-y-6">
      {/* Pestañas Superiores */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "catalog"
              ? "border-[#0F4C81] text-[#0F4C81] bg-sky-50/50"
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
              ? "border-[#0F4C81] text-[#0F4C81] bg-sky-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Kardex Valorizado Ponderado</span>
        </button>
      </div>

      {/* Contenido según pestaña activa */}
      {activeTab === "catalog" ? (
        <ProductList products={productsForList} />
      ) : (
        <KardexView products={productsForKardex} />
      )}
    </div>
  );
}
