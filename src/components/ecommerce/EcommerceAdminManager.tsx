"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPEN, formatDate } from "@/lib/utils";
import { updateEcommerceOrderStatus } from "@/app/actions/ecommerce";
import { DocumentViewerModal, SalesDocDetail } from "@/components/sales/DocumentViewerModal";
import {
  ShoppingBag,
  ExternalLink,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  Package,
  Search,
  Filter,
  AlertCircle,
  Store,
} from "lucide-react";

interface EcommerceOrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerDocType: string;
  customerDocNumber: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  shippingCost: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  total: number;
  salesDocumentNumber: string | null;
  salesDocumentId: string | null;
  createdAt: string | Date;
  items: {
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export function EcommerceAdminManager({
  orders,
}: {
  orders: EcommerceOrderRecord[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    const matchText =
      o.orderNumber.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term) ||
      o.customerDocNumber.toLowerCase().includes(term) ||
      (o.salesDocumentNumber && o.salesDocumentNumber.toLowerCase().includes(term));
    const matchStatus = statusFilter === "TODOS" || o.orderStatus === statusFilter;
    return matchText && matchStatus;
  });

  async function handleStatusChange(orderId: string, newStatus: any) {
    setLoadingId(orderId);
    await updateEcommerceOrderStatus(orderId, newStatus);
    setLoadingId(null);
  }

  // Métricas
  const totalVentasOnline = orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = orders.length;
  const preparingOrders = orders.filter((o) => o.orderStatus === "PAGADO_PREPARANDO").length;
  const inRouteOrders = orders.filter((o) => o.orderStatus === "EN_RUTA_DELIVERY").length;

  return (
    <div className="space-y-6">
      {/* 4 KPIs Superiores de E-commerce */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ventas Retail E-commerce
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">
            {formatPEN(totalVentasOnline)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Ingresos canal tienda online</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pedidos Online
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">{totalOrders}</p>
          <p className="text-[11px] text-slate-400 mt-1">Con boleta/factura emitida</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              En Preparación (Almacén)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#F59E0B] mt-2 font-mono tabular-nums">{preparingOrders}</p>
          <p className="text-[11px] text-amber-600 mt-1">Pendiente de empaque</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              En Ruta de Delivery
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-indigo-700 mt-2 font-mono tabular-nums">{inRouteOrders}</p>
          <p className="text-[11px] text-indigo-600 mt-1">En camino al cliente</p>
        </div>
      </div>

      {/* Barra de Acciones y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por N° pedido, cliente o comprobante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="PAGADO_PREPARANDO">En Preparación</option>
            <option value="EN_RUTA_DELIVERY">En Ruta</option>
            <option value="ENTREGADO">Entregados</option>
          </select>
        </div>

        <Link
          href="/tienda"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
        >
          <Store className="w-4 h-4" />
          <span>Abrir Tienda Online (Público)</span>
          <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">N° Pedido Online</th>
                <th className="py-3 px-4">Cliente Retail</th>
                <th className="py-3 px-3">Entrega</th>
                <th className="py-3 px-3">Medio de Pago</th>
                <th className="py-3 px-3">Comprobante SUNAT</th>
                <th className="py-3 px-3 text-right">Total (PEN)</th>
                <th className="py-3 px-4 text-center">Estado de Despacho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se han registrado pedidos en la tienda online aún.
                    <br />
                    <Link href="/tienda" target="_blank" className="text-[#0F4C81] font-bold underline mt-2 inline-block">
                      Ir a la tienda y realizar una compra demo →
                    </Link>
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{o.orderNumber}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(o.createdAt)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 leading-snug">{o.customerName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {o.customerDocType}: {o.customerDocNumber} • Tel: {o.customerPhone}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      {o.deliveryMethod === "DELIVERY" ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                            <Truck className="w-3 h-3" /> Delivery
                          </span>
                          <p className="text-[10px] text-slate-500 truncate max-w-[150px] mt-0.5" title={o.deliveryAddress || ""}>
                            {o.deliveryAddress || "Lima"}
                          </p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                          <Store className="w-3 h-3" /> Recojo Almacén
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 text-[11px]">
                      {o.paymentMethod}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#0F4C81]">
                      {o.salesDocumentNumber || "Emitido"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatPEN(o.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={o.orderStatus}
                        disabled={loadingId === o.id}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`text-xs font-bold py-1 px-2.5 rounded-lg border focus:outline-none transition-colors ${
                          o.orderStatus === "PAGADO_PREPARANDO"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : o.orderStatus === "EN_RUTA_DELIVERY"
                            ? "bg-sky-50 text-sky-800 border-sky-300"
                            : o.orderStatus === "ENTREGADO"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        <option value="PAGADO_PREPARANDO">📦 En Preparación</option>
                        <option value="EN_RUTA_DELIVERY">🚚 En Ruta Delivery</option>
                        <option value="ENTREGADO">✅ Entregado</option>
                        <option value="CANCELADO">❌ Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
