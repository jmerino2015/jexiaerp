"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPEN } from "@/lib/utils";
import { processEcommerceCheckout } from "@/app/actions/ecommerce";
import { DocumentViewerModal, SalesDocDetail } from "@/components/sales/DocumentViewerModal";
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Truck,
  ShieldCheck,
  CreditCard,
  QrCode,
  Building,
  Plus,
  Minus,
  Trash2,
  X,
  PackageCheck,
  ArrowRight,
  Store,
  Sparkles,
  ExternalLink,
  Receipt,
  FileText,
  AlertCircle,
} from "lucide-react";

interface StoreProduct {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  salePrice: number;
  totalStock: number;
  unitCode: string;
}

export function EcommerceStorefront({ products }: { products: StoreProduct[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODOS");
  const [cart, setCart] = useState<{ product: StoreProduct; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Checkout Form State
  const [invoiceType, setInvoiceType] = useState<"BOLETA" | "FACTURA">("BOLETA");
  const [customerName, setCustomerName] = useState("");
  const [customerDocType, setCustomerDocType] = useState<"DNI" | "RUC">("DNI");
  const [customerDocNumber, setCustomerDocNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"YAPE_PLIN" | "TARJETA" | "TRANSFERENCIA">("YAPE_PLIN");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [selectedDocForModal, setSelectedDocForModal] = useState<SalesDocDetail | null>(null);

  const categories = ["TODOS", ...Array.from(new Set(products.map((p) => p.category || "General")))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "TODOS" || (p.category || "General") === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Carrito helpers
  function addToCart(p: StoreProduct) {
    if (p.totalStock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === p.id);
      if (existing) {
        if (existing.quantity >= p.totalStock) return prev;
        return prev.map((item) =>
          item.product.id === p.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product: p, quantity: 1 }];
    });
    setIsCartOpen(true);
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.totalStock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as { product: StoreProduct; quantity: number }[]
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalCart = cart.reduce((acc, item) => acc + item.product.salePrice * item.quantity, 0);
  const shippingCost = deliveryMethod === "DELIVERY" ? (subtotalCart >= 500 ? 0 : 15) : 0;
  const totalCart = subtotalCart + shippingCost;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const res = await processEcommerceCheckout({
      customerName,
      customerDocType,
      customerDocNumber,
      customerEmail,
      customerPhone,
      deliveryMethod,
      deliveryAddress,
      shippingCost,
      paymentMethod,
      invoiceType,
      items: cart.map((it) => ({
        productId: it.product.id,
        quantity: it.quantity,
      })),
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "Ocurrió un error al procesar el pedido.");
    } else {
      setCompletedOrder(res.data);
      setCart([]);
      setIsCheckoutOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Banner Tienda */}
      <div className="bg-[#0B1E36] text-white text-[11px] py-2 px-4 border-b border-[#1E3A5F]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded text-[10px] font-bold">
              JEXIA RETAIL E-COMMERCE
            </span>
            <span>Despacho express a todo el Perú en 24h • Boleta y Factura SUNAT automática</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-[10px]">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-emerald-400" /> Envío Gratis en compras &gt; S/ 500
            </span>
            <Link href="/inicio" className="text-sky-300 hover:underline flex items-center gap-1 font-bold">
              Ir al ERP Administrativo →
            </Link>
          </div>
        </div>
      </div>

      {/* Header Tienda */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/tienda" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F4C81] text-white flex items-center justify-center font-black text-lg shadow-md">
              J
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">Jexia Store</span>
              <span className="text-[10px] block text-slate-500 font-medium leading-none">
                Venta Retail Oficial
              </span>
            </div>
          </Link>

          {/* Buscador */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar laptops, monitores, periféricos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            />
          </div>

          {/* Carrito Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-[#0F4C81] hover:bg-[#0c3f6c] text-white text-xs font-bold shadow-sm transition-all relative"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Mi Carrito</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center shadow-md">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Banner Promocional */}
      <section className="bg-gradient-to-r from-[#0F4C81] via-[#1E3A8A] to-[#0B1E36] text-white py-10 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider bg-sky-400/20 text-sky-300 border border-sky-400/30 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" /> Lo mejor en Tecnología & Suministros
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Equipamiento Corporativo & Retail con Entrega Rápida
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Compra con stock garantizado en Almacén Central Lima. Emisión inmediata de comprobante SUNAT con código QR y constancia de recepción CDR oficial.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <p className="font-bold">Garantía Real</p>
              <p className="text-[11px] text-slate-300">Equipos 100% Nuevos</p>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <Truck className="w-6 h-6 text-sky-400 mx-auto mb-1" />
              <p className="font-bold">Despacho 24h</p>
              <p className="text-[11px] text-slate-300">Lima y Provincias</p>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de Productos */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Filtros de Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50"
              }`}
            >
              {cat === "TODOS" ? "Todos los Productos" : cat}
            </button>
          ))}
        </div>

        {/* Grid de Productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((p) => {
            const hasStock = p.totalStock > 0;
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Imagen del Producto para Ecommerce */}
                <div className="h-44 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-center p-3 relative group-hover:scale-[1.01] transition-transform overflow-hidden">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#2563EB] flex items-center justify-center font-mono font-black text-2xl shadow-inner">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded bg-white/90 backdrop-blur-xs border border-[#E2E8F0] text-slate-700 shadow-2xs">
                    {p.category || "General"}
                  </span>
                  <span
                    className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded tabular-nums ${
                      hasStock
                        ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                        : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                    }`}
                  >
                    {hasStock ? `${p.totalStock} disp.` : "Agotado"}
                  </span>
                </div>

                {/* Info Producto */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
                      SKU: {p.sku}
                    </span>
                    <h3 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2" title={p.name}>
                      {p.name}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Precio Retail</span>
                      <span className="text-base font-extrabold text-[#2563EB] font-mono tabular-nums">
                        {formatPEN(p.salePrice)}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(p)}
                      disabled={!hasStock}
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{hasStock ? "Comprar" : "Agotado"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* DRAWER DEL CARRITO */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#0F4C81]" />
                <h3 className="font-bold text-sm text-slate-900">Carrito de Compras ({cartCount})</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                  <ShoppingCart className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
                  <p>Tu carrito está vacío.</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-[#0F4C81] font-bold underline"
                  >
                    Ver catálogo de productos
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-xs"
                  >
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-12 h-12 object-contain rounded-md bg-slate-50 border border-slate-200 shrink-0 p-1"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-sky-50 text-[#2563EB] font-bold text-sm flex items-center justify-center shrink-0">
                        {item.product.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[11px] font-mono text-[#0F4C81] font-bold">
                        {formatPEN(item.product.salePrice)} c/u
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-rose-500 hover:text-rose-700 ml-1 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Productos:</span>
                    <span className="font-mono font-semibold">{formatPEN(subtotalCart)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Envío a Domicilio:</span>
                    <span className="font-mono font-semibold">
                      {shippingCost === 0 ? "¡GRATIS!" : formatPEN(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                    <span>Total a Pagar:</span>
                    <span className="font-mono text-[#0F4C81]">{formatPEN(totalCart)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <span>Continuar al Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT INTEGRADO */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full my-6 p-6 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Finalizar Compra Retail</h3>
                  <p className="text-[11px] text-slate-500">Facturación electrónica SUNAT inmediata</p>
                </div>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs shrink-0">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCheckout} className="mt-4 space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* Comprobante requerido */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Comprobante Requerido *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInvoiceType("BOLETA");
                      setCustomerDocType("DNI");
                    }}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-all ${
                      invoiceType === "BOLETA"
                        ? "bg-[#0F4C81] text-white border-[#0F4C81]"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    Boleta de Venta (DNI)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInvoiceType("FACTURA");
                      setCustomerDocType("RUC");
                    }}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-all ${
                      invoiceType === "FACTURA"
                        ? "bg-[#0F4C81] text-white border-[#0F4C81]"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    Factura Electrónica (RUC)
                  </button>
                </div>
              </div>

              {/* Datos del Cliente */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {customerDocType === "RUC" ? "RUC (11 d.)" : "DNI (8 d.)"} *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={customerDocType === "RUC" ? 11 : 8}
                    placeholder={customerDocType === "RUC" ? "20601234567" : "45892301"}
                    value={customerDocNumber}
                    onChange={(e) => setCustomerDocNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    {customerDocType === "RUC" ? "Razón Social *" : "Nombres y Apellidos *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez o Empresa S.A.C."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="+51 987 654 321"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email para Factura *</label>
                  <input
                    type="email"
                    required
                    placeholder="tuemail@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200"
                  />
                </div>
              </div>

              {/* Método de Entrega */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Método de Entrega</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("DELIVERY")}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center flex items-center justify-center gap-1.5 ${
                      deliveryMethod === "DELIVERY"
                        ? "bg-sky-50 border-[#0F4C81] text-[#0F4C81]"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Envío a Domicilio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("PICKUP")}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center flex items-center justify-center gap-1.5 ${
                      deliveryMethod === "PICKUP"
                        ? "bg-sky-50 border-[#0F4C81] text-[#0F4C81]"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Recojo en Almacén (Gratis)</span>
                  </button>
                </div>

                {deliveryMethod === "DELIVERY" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      placeholder="Dirección exacta de entrega y distrito (Ej: Av. Benavides 1230, Miraflores)"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* Medio de Pago */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medio de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("YAPE_PLIN")}
                    className={`py-2 px-2 rounded-lg border font-semibold text-center text-[11px] ${
                      paymentMethod === "YAPE_PLIN"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    Yape / Plin (QR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("TARJETA")}
                    className={`py-2 px-2 rounded-lg border font-semibold text-center text-[11px] ${
                      paymentMethod === "TARJETA"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    Tarjeta Débito/Crédito
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("TRANSFERENCIA")}
                    className={`py-2 px-2 rounded-lg border font-semibold text-center text-[11px] ${
                      paymentMethod === "TRANSFERENCIA"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    Transferencia BCP
                  </button>
                </div>
              </div>

              {/* Resumen Total */}
              <div className="p-3 bg-slate-100 rounded-lg space-y-1 text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Productos ({cartCount}):</span>
                  <span className="font-mono">{formatPEN(subtotalCart)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Costo Envío:</span>
                  <span className="font-mono">{shippingCost === 0 ? "S/ 0.00 (Gratis)" : formatPEN(shippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                  <span>Total a Pagar:</span>
                  <span className="font-mono text-[#0F4C81]">{formatPEN(totalCart)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? "Emitiendo Comprobante..." : `Pagar ${formatPEN(totalCart)}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PANTALLA DE PEDIDO EXITOSO */}
      {completedOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                PAGO CONFIRMADO & COMPROBANTE SUNAT EMITIDO
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">¡Gracias por tu compra!</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                N° Pedido Online: <strong>{completedOrder.order?.orderNumber}</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Comprobante Electrónico:</span>
                <span className="font-bold font-mono text-[#0F4C81]">
                  {completedOrder.order?.salesDocumentNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold">{completedOrder.order?.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado de Despacho:</span>
                <span className="text-emerald-700 font-bold">En Preparación (Almacén Central)</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                <span>Total Abonado:</span>
                <span className="font-mono text-[#0F4C81]">{formatPEN(completedOrder.order?.total)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                El comprobante fue transmitido y aceptado por SUNAT. Se descontó automáticamente del Kardex y se registró el asiento contable.
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setCompletedOrder(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Seguir Comprando
              </button>
              <Link
                href="/ecommerce"
                className="px-4 py-2 rounded-lg bg-[#0F4C81] hover:bg-[#0c3f6c] text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                <span>Ver en Gestión ERP</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
