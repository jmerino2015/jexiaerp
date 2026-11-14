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
  Upload,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  Building2,
  Percent,
  TrendingUp,
  Store,
  DollarSign,
  Package,
} from "lucide-react";

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  brand?: string | null;
  unitCode: string;
  avgCost: number;
  salePrice: number;
  minStock: number;
  isService: boolean;
  totalStock: number;
  imageUrl?: string | null;
  sunatCode?: string | null;
  isEcommerce?: boolean;
  detractionSubject?: boolean;
  detractionPercent?: number | null;
}

export function ProductList({ products }: { products: ProductItem[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("TODOS");
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedProductForAdj, setSelectedProductForAdj] = useState<ProductItem | null>(null);

  // Modal active tab: GENERAL, SUNAT, KARDEX
  const [activeTab, setActiveTab] = useState<"GENERAL" | "SUNAT" | "KARDEX">("GENERAL");

  // Form states
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Product Form Parameters
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("Textil y Moda");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isEcommerce, setIsEcommerce] = useState(true);

  // SUNAT Parameters
  const [unitCode, setUnitCode] = useState<"NIU" | "ZZ" | "BX" | "KGM" | "LTR" | "MTR">("NIU");
  const [igvType, setIgvType] = useState<"GRAVADO_10" | "EXONERADO_20" | "INAFECTO_30">("GRAVADO_10");
  const [sunatCode, setSunatCode] = useState("53102902");
  const [detractionSubject, setDetractionSubject] = useState(false);
  const [detractionCode, setDetractionCode] = useState("022");
  const [detractionPercent, setDetractionPercent] = useState("10");

  // Pricing & Kardex
  const [avgCost, setAvgCost] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [minStock, setMinStock] = useState("10");
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
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter === "TODOS" || (p.category || "General") === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Cálculos automáticos de rentabilidad
  const costNum = parseFloat(avgCost) || 0;
  const priceNum = parseFloat(salePrice) || 0;
  const initialStockNum = parseFloat(initialStock) || 0;
  const estimatedMargin = priceNum > 0 ? (((priceNum - costNum) / priceNum) * 100).toFixed(1) : "0.0";
  const unitProfit = priceNum > costNum ? priceNum - costNum : 0;
  const totalValuation = initialStockNum * costNum;

  // Generador de SKU
  function handleGenerateSku() {
    const prefix = name ? name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "PRD") : "PRD";
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${rand}`);
  }

  // Subida de imagen a /api/upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg("");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al subir la imagen");
      }

      setImageUrl(data.url);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al subir fotografía.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!sku.trim()) {
      setErrorMsg("El código SKU es obligatorio.");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("El nombre del producto es obligatorio.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await createProduct({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      brand: brand.trim(),
      category: category.trim(),
      unitCode: unitCode as any,
      igvType: igvType as any,
      sunatCode: sunatCode.trim(),
      imageUrl: imageUrl.trim() || undefined,
      isEcommerce,
      detractionSubject,
      detractionCode: detractionSubject ? detractionCode.trim() : undefined,
      detractionPercent: detractionSubject ? parseFloat(detractionPercent) || 0 : undefined,
      avgCost: costNum,
      salePrice: priceNum,
      minStock: parseFloat(minStock) || 0,
      initialStock: initialStockNum,
      isService,
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "Ocurrió un error al registrar el producto.");
    } else {
      setSuccessMsg("¡Producto parametrizado y stock inicial registrado en Kardex!");
      setTimeout(() => {
        setIsNewProductOpen(false);
        setSuccessMsg("");
        setSku("");
        setName("");
        setBrand("");
        setDescription("");
        setImageUrl("");
        setAvgCost("");
        setSalePrice("");
        setInitialStock("0");
      }, 1200);
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
    <div className="space-y-6">
      {/* Barra de Filtros y Acción Primaria */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por SKU, nombre o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-slate-700"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón Primario CTA: Parametrizar y Crear Producto */}
        <button
          onClick={() => {
            setActiveTab("GENERAL");
            setIsNewProductOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition-all hover:shadow hover:scale-[1.01]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Crear Producto & E-commerce</span>
        </button>
      </div>

      {/* Tabla de Catálogo de Productos con Fotografías */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-3 text-center w-14">Foto</th>
                <th className="py-3 px-3 w-28">SKU</th>
                <th className="py-3 px-4">Descripción del Producto</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-center">Canal</th>
                <th className="py-3 px-3 text-right">Stock</th>
                <th className="py-3 px-3 text-right">Costo Prom.</th>
                <th className="py-3 px-3 text-right">Precio Venta</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    No se encontraron productos coincidentes con los filtros.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = !p.isService && p.totalStock === 0;
                  const isLow = !p.isService && p.totalStock <= p.minStock && !isOutOfStock;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Miniatura de Fotografía */}
                      <td className="py-2.5 px-3 text-center">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 object-contain rounded-lg border border-[#E2E8F0] bg-white p-0.5 mx-auto shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center mx-auto border border-slate-200">
                            {p.name.charAt(0)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {p.sku}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900 leading-snug">{p.name}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>Unidad: {p.unitCode}</span>
                          {p.brand && <span>• Marca: {p.brand}</span>}
                          {p.sunatCode && <span>• SUNAT: {p.sunatCode}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {p.category || "General"}
                        </span>
                      </td>

                      {/* Canal E-commerce */}
                      <td className="py-3 px-3 text-center">
                        {p.isEcommerce ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <Store className="w-3 h-3 text-emerald-600" /> Tienda
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Solo ERP</span>
                        )}
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
                            <AlertTriangle className="w-3 h-3" /> Bajo
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            Óptimo
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

      {/* ========================================================
          MODAL: CREACIÓN Y PARAMETRIZACIÓN AVANZADA DE PRODUCTO
          ======================================================== */}
      {isNewProductOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#2563EB]" /> Parametrización de Nuevo Producto
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configuración integral para Compras, Inventario, SUNAT y Venta Online
                </p>
              </div>
              <button
                onClick={() => setIsNewProductOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Pestañas de Parametrización */}
            <div className="flex border-b border-[#E2E8F0] bg-white px-6">
              <button
                type="button"
                onClick={() => setActiveTab("GENERAL")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === "GENERAL"
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>1. General & Fotografía E-commerce</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("SUNAT")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === "SUNAT"
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>2. Parámetros Tributarios SUNAT</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("KARDEX")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === "KARDEX"
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>3. Costos, Precios & Kardex</span>
              </button>
            </div>

            {/* Mensajes de Alerta */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {successMsg}
              </div>
            )}

            {/* Formulario con Scroll */}
            <form onSubmit={handleCreateProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* ========================================================
                  PESTAÑA 1: GENERAL & MULTIMEDIA ECOMMERCE
                  ======================================================== */}
              {activeTab === "GENERAL" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-8">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nombre Comercial del Producto *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: POLO VERANO COLOR ROJO TALLA L"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div className="col-span-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Código SKU *
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateSku}
                          className="text-[10px] font-bold text-[#2563EB] hover:underline"
                        >
                          Auto
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="POLO-ROJ-L"
                        value={sku}
                        onChange={(e) => setSku(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Categoría
                      </label>
                      <input
                        type="text"
                        placeholder="Textil y Moda, Cómputo, Alimentos..."
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Marca Comercial
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Jexia Brand, Lenovo, Genérica..."
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Descripción para la Tienda y Ficha Técnica
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Confeccionado en 100% algodón pima peruano, fresco y durable..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    />
                  </div>

                  {/* ZONA DE SUBIDA DE FOTOGRAFÍAS PARA E-COMMERCE */}
                  <div className="p-4 rounded-xl border-2 border-dashed border-[#E2E8F0] bg-slate-50/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#2563EB]" /> Fotografía del Producto para E-commerce
                      </span>
                      {uploadingImage && (
                        <span className="text-[11px] text-[#2563EB] font-bold flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                          Subiendo...
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Vista Previa de Imagen */}
                      <div className="w-24 h-24 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative group">
                        {imageUrl ? (
                          <>
                            <img
                              src={imageUrl}
                              alt="Vista previa"
                              className="w-full h-full object-contain p-1"
                            />
                            <button
                              type="button"
                              onClick={() => setImageUrl("")}
                              className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Quitar foto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-2 text-slate-400">
                            <Upload className="w-6 h-6 mx-auto mb-1 stroke-1" />
                            <span className="text-[9px] block">Sin foto</span>
                          </div>
                        )}
                      </div>

                      {/* Inputs de Carga */}
                      <div className="flex-1 space-y-2 w-full">
                        <div>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors">
                            <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>Seleccionar archivo desde el equipo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Formatos soportados: PNG, JPG, WEBP, SVG (máx. 5 MB)
                          </p>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="O pega una URL de imagen (ej: /uploads/products/polo-verano-rojo.svg)"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Switch de Publicación en Tienda Retail */}
                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEcommerce}
                          onChange={(e) => setIsEcommerce(e.target.checked)}
                          className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] border-slate-300"
                        />
                        <span className="text-xs font-bold text-slate-800">
                          Publicar inmediatamente en Tienda Retail Online (/tienda)
                        </span>
                      </label>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {isEcommerce ? "Activo para clientes" : "Oculto"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  PESTAÑA 2: PARÁMETROS TRIBUTARIOS SUNAT PERÚ
                  ======================================================== */}
              {activeTab === "SUNAT" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0" />
                    <span>
                      Estos parámetros garantizan la emisión legal del XML UBL 2.1 y la validación en SUNAT / SIRE.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Unidad de Medida Oficial SUNAT
                      </label>
                      <select
                        value={unitCode}
                        onChange={(e) => setUnitCode(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                      >
                        <option value="NIU">NIU - Unidad de Bienes Físicos</option>
                        <option value="ZZ">ZZ - Servicio Intangible</option>
                        <option value="BX">BX - Caja / Pack</option>
                        <option value="KGM">KGM - Kilogramos</option>
                        <option value="LTR">LTR - Litros</option>
                        <option value="MTR">MTR - Metros</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tipo de Afectación al IGV (Cat. 07)
                      </label>
                      <select
                        value={igvType}
                        onChange={(e) => setIgvType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                      >
                        <option value="GRAVADO_10">10 - Gravado (Operación Onerosa 18% IGV)</option>
                        <option value="EXONERADO_20">20 - Exonerado (Apéndice I TUO IGV)</option>
                        <option value="INAFECTO_30">30 - Inafecto (No gravado con IGV)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Código de Producto SUNAT (Catálogo 25)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 53102902 (Polos y camisas), 43211503 (Laptops)"
                      value={sunatCode}
                      onChange={(e) => setSunatCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Clasificación arancelaria / estándar según UNSPSC exigido por SUNAT.
                    </p>
                  </div>

                  {/* Detracciones SPOT */}
                  <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-slate-50 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={detractionSubject}
                        onChange={(e) => setDetractionSubject(e.target.checked)}
                        className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] border-slate-300"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Sujeto a Sistema de Detracciones SPOT (Banco de la Nación)
                      </span>
                    </label>

                    {detractionSubject && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0] animate-in fade-in">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Código Bien SPOT (Cat. 54)
                          </label>
                          <input
                            type="text"
                            placeholder="022"
                            value={detractionCode}
                            onChange={(e) => setDetractionCode(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Porcentaje SPOT (%)
                          </label>
                          <input
                            type="number"
                            placeholder="10"
                            value={detractionPercent}
                            onChange={(e) => setDetractionPercent(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  PESTAÑA 3: COSTOS, PRECIOS & KARDEX
                  ======================================================== */}
              {activeTab === "KARDEX" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800">Naturaleza del Ítem</span>
                      <p className="text-[11px] text-slate-500">
                        Los servicios intangibles no generan saldo físico en Kardex.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isService}
                        onChange={(e) => {
                          setIsService(e.target.checked);
                          if (e.target.checked) setUnitCode("ZZ");
                          else setUnitCode("NIU");
                        }}
                        className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] border-slate-300"
                      />
                      <span className="text-xs font-bold text-slate-700">Es un Servicio</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Costo Promedio Inicial (S/ sin IGV) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                          S/
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={avgCost}
                          onChange={(e) => setAvgCost(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:outline-none tabular-nums"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Precio de Venta al Público (S/ con IGV) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                          S/
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold text-[#2563EB] rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:outline-none tabular-nums"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rentabilidad y Margen Comercial en Tiempo Real */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200/70 grid grid-cols-2 gap-3 text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        Margen Comercial Estimado
                      </span>
                      <p className="text-lg font-black text-[#2563EB] font-mono tabular-nums">
                        {estimatedMargin}%
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        Utilidad Bruta x Unidad
                      </span>
                      <p className="text-lg font-black text-[#10B981] font-mono tabular-nums">
                        {formatPEN(unitProfit)}
                      </p>
                    </div>
                  </div>

                  {!isService && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Stock Inicial en Almacén Central
                        </label>
                        <input
                          type="number"
                          step="1"
                          placeholder="0"
                          value={initialStock}
                          onChange={(e) => setInitialStock(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:outline-none tabular-nums"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Crea asiento y movimiento transaccional en el Kardex Valorizado.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Stock Mínimo de Alerta
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={minStock}
                          onChange={(e) => setMinStock(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:outline-none tabular-nums"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Alerta en panel si las existencias caen a este número.
                        </p>
                      </div>
                    </div>
                  )}

                  {!isService && initialStockNum > 0 && (
                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 text-xs flex justify-between items-center font-medium">
                      <span>Valorización de Inventario Inicial:</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {formatPEN(totalValuation)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Botonera Inferior del Modal */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold">Pestaña activa:</span>
                  <span className="text-[11px] font-bold text-[#2563EB] uppercase">
                    {activeTab}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewProductOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Guardando en BD...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Guardar Producto</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: AJUSTE MANUAL DE INVENTARIO
          ======================================================== */}
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

            <form onSubmit={handleAdjustment} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Ajuste</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                >
                  <option value="AJUSTE_POSITIVO">Ajuste Positivo (+ Entrada por Sobrante / Conteo)</option>
                  <option value="AJUSTE_NEGATIVO">Ajuste Negativo (- Salida por Merma / Deterioro)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cantidad a Ajustar</label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="0"
                  value={adjQuantity}
                  onChange={(e) => setAdjQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Stock actual en almacén:{" "}
                  <strong className="text-slate-800">{selectedProductForAdj.totalStock}</strong>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo / Sustento de Auditoría</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ej: Diferencia encontrada durante el conteo físico semestral..."
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
                  {loading ? "Registrando..." : "Confirmar Ajuste en Kardex"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
