"use client";

import { useState } from "react";
import { formatPEN, formatDate } from "@/lib/utils";
import { createPurchaseOrder, receivePurchaseOrder } from "@/app/actions/purchases";
import {
  ShoppingCart,
  PlusCircle,
  CheckCircle2,
  PackageCheck,
  Building2,
  Calendar,
  AlertCircle,
  X,
  Trash2,
  Clock,
  Layers,
} from "lucide-react";

interface SupplierItem {
  id: string;
  docNumber: string;
  legalName: string;
}

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  avgCost: number;
  unitCode: string;
}

interface PurchaseOrderRecord {
  id: string;
  fullNumber: string;
  supplier: {
    legalName: string;
    docNumber: string;
  };
  issueDate: string | Date;
  status: string;
  supplierInvoice: string | null;
  subtotal: number;
  igv: number;
  total: number;
  notes: string | null;
  items: {
    id: string;
    product: {
      sku: string;
      name: string;
      unitCode: string;
    };
    quantity: number;
    receivedQty: number;
    unitCost: number;
    total: number;
  }[];
}

export function PurchasesManager({
  orders,
  suppliers,
  products,
}: {
  orders: PurchaseOrderRecord[];
  suppliers: SupplierItem[];
  products: ProductItem[];
}) {
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedOrderToReceive, setSelectedOrderToReceive] = useState<PurchaseOrderRecord | null>(null);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // New PO State
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || "");
  const [poNotes, setPoNotes] = useState("");
  const [items, setItems] = useState<
    { productId: string; quantity: number; unitCost: number }[]
  >([
    {
      productId: products[0]?.id || "",
      quantity: 5,
      unitCost: products[0]?.avgCost || 100,
    },
  ]);

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      {
        productId: products[0]?.id || "",
        quantity: 1,
        unitCost: products[0]?.avgCost || 50,
      },
    ]);
  }

  function handleRemoveItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleItemChange(
    idx: number,
    field: "productId" | "quantity" | "unitCost",
    value: any
  ) {
    setItems((prev) => {
      const copy = [...prev];
      if (field === "productId") {
        const prod = products.find((p) => p.id === value);
        copy[idx].productId = value;
        if (prod && prod.avgCost > 0) {
          copy[idx].unitCost = prod.avgCost;
        }
      } else {
        copy[idx][field] = Number(value);
      }
      return copy;
    });
  }

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitCost, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  async function handleCreatePO(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await createPurchaseOrder({
      supplierId: selectedSupplierId,
      notes: poNotes,
      items: items,
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "Error al emitir orden de compra.");
    } else {
      setSuccessMsg("¡Orden de compra emitida correctamente!");
      setTimeout(() => {
        setIsNewOrderOpen(false);
        setSuccessMsg("");
      }, 1000);
    }
  }

  async function handleConfirmReceipt(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrderToReceive) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await receivePurchaseOrder(
      selectedOrderToReceive.id,
      supplierInvoiceNumber
    );

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "Error al recepcionar mercadería.");
    } else {
      setSuccessMsg("¡Mercadería ingresada! Kardex y Costo Promedio actualizados.");
      setTimeout(() => {
        setIsReceiveModalOpen(false);
        setSelectedOrderToReceive(null);
        setSupplierInvoiceNumber("");
        setSuccessMsg("");
      }, 1200);
    }
  }

  return (
    <div className="space-y-6">
      {/* Botón de Emisión */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Control de órdenes de compra a proveedores con cálculo automático de Costo Promedio en recepción.
          </p>
        </div>

        <button
          onClick={() => setIsNewOrderOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nueva Orden de Compra</span>
        </button>
      </div>

      {/* Listado de Órdenes */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">N° Orden</th>
                <th className="py-3 px-4">Proveedor (RUC / Razón Social)</th>
                <th className="py-3 px-3">Fecha Emisión</th>
                <th className="py-3 px-3">Doc. Proveedor</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-right">IGV (18%)</th>
                <th className="py-3 px-4 text-right">Total (PEN)</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No se han registrado órdenes de compra.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isCompleted = order.status === "COMPLETADA";
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 tabular-nums">
                        {order.fullNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 leading-snug">
                          {order.supplier.legalName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                          RUC: {order.supplier.docNumber}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {formatDate(order.issueDate)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {order.supplierInvoice || "-"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {formatPEN(order.subtotal)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {formatPEN(order.igv)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#2563EB] tabular-nums">
                        {formatPEN(order.total)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isCompleted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Recepcionada
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!isCompleted ? (
                          <button
                            onClick={() => {
                              setSelectedOrderToReceive(order);
                              setIsReceiveModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Recibir Mercadería</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Kardex aplicado
                          </span>
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

      {/* MODAL: NUEVA ORDEN DE COMPRA */}
      {isNewOrderOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0F4C81] flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Nueva Orden de Compra (OC01)</h3>
              </div>
              <button
                onClick={() => setIsNewOrderOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs shrink-0">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mt-3 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs shrink-0">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleCreatePO} className="mt-4 space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* Proveedor */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Seleccionar Proveedor (RUC) *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.docNumber}] {s.legalName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">Productos a Adquirir</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[#0F4C81] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                  >
                    + Agregar Ítem
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-6">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Producto
                        </label>
                        <select
                          value={it.productId}
                          onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.sku}] {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Costo Unit. (S/)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={it.unitCost}
                          onChange={(e) => handleItemChange(idx, "unitCost", e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white"
                        />
                      </div>

                      <div className="col-span-1 text-center pt-3">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="p-3 bg-slate-100 rounded-lg space-y-1 text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Gravado:</span>
                  <span className="font-mono">{formatPEN(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IGV (18%):</span>
                  <span className="font-mono">{formatPEN(igv)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                  <span>Total Orden de Compra:</span>
                  <span className="font-mono text-[#0F4C81]">{formatPEN(total)}</span>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas u Observaciones
                </label>
                <input
                  type="text"
                  placeholder="Ej: Condiciones de pago 15 días, entrega en Almacén Central"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewOrderOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold disabled:opacity-50"
                >
                  {loading ? "Emitiendo..." : "Emitir Orden de Compra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR RECEPCIÓN TRANSACCIONAL */}
      {isReceiveModalOpen && selectedOrderToReceive && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Recepción de Mercadería</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedOrderToReceive.fullNumber}
                </p>
              </div>
              <button
                onClick={() => setIsReceiveModalOpen(false)}
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

            <form onSubmit={handleConfirmReceipt} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Proveedor:</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrderToReceive.supplier.legalName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Importe:</span>
                  <span className="font-bold font-mono text-[#0F4C81]">
                    {formatPEN(selectedOrderToReceive.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ítems a ingresar:</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrderToReceive.items.length} productos
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  N° Factura o Guía del Proveedor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: F001-008942 ó GR-00123"
                  value={supplierInvoiceNumber}
                  onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Este comprobante quedará vinculado al movimiento de Kardex.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex gap-2">
                <PackageCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <strong>Operación Transaccional ACID:</strong>
                  <br />
                  Se sumará el stock en el almacén y se recalculará automáticamente el <strong>Costo Promedio Ponderado</strong> de cada producto.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold disabled:opacity-50"
                >
                  {loading ? "Procesando en BD..." : "Confirmar e Ingresar a Kardex"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
