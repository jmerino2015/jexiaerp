"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPEN, formatDate } from "@/lib/utils";
import { registerPayment } from "@/app/actions/payments";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  CreditCard,
  Building2,
  FileText,
  PlusCircle,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  Landmark,
  ShieldAlert,
} from "lucide-react";

export interface ReceivableDoc {
  id: string;
  fullNumber: string;
  docType: string;
  issueDate: string;
  dueDate: string | null;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  paymentCondition: string;
  customer: {
    id: string;
    docNumber: string;
    legalName: string;
  };
  schedules: {
    id: string;
    installmentNumber: number;
    dueDate: string;
    amount: number;
    paidAmount: number;
    balance: number;
    status: string;
  }[];
}

export interface PayableDoc {
  id: string;
  fullNumber: string;
  supplierInvoice: string | null;
  issueDate: string;
  dueDate: string | null;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  paymentCondition: string;
  supplier: {
    id: string;
    docNumber: string;
    legalName: string;
  };
  schedules: {
    id: string;
    installmentNumber: number;
    dueDate: string;
    amount: number;
    paidAmount: number;
    balance: number;
    status: string;
  }[];
}

export interface PaymentTransaction {
  id: string;
  paymentType: "COBRO_VENTA" | "PAGO_COMPRA";
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  bankName: string | null;
  operationNumber: string | null;
  notes: string | null;
  journalEntryId: string | null;
  partner: {
    legalName: string;
    docNumber: string;
  };
  salesDocument: {
    fullNumber: string;
    docType: string;
  } | null;
  purchaseOrder: {
    fullNumber: string;
    supplierInvoice: string | null;
  } | null;
}

export function FinanceManager({
  receivables,
  payables,
  transactions,
}: {
  receivables: ReceivableDoc[];
  payables: PayableDoc[];
  transactions: PaymentTransaction[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"cxc" | "cxp" | "transactions">("cxc");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"COBRO_VENTA" | "PAGO_COMPRA">("COBRO_VENTA");
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [payAmount, setPayAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<
    "TRANSFERENCIA" | "DEPOSITO_CUENTA" | "YAPE_PLIN" | "TARJETA" | "EFECTIVO"
  >("TRANSFERENCIA");
  const [bankName, setBankName] = useState("BCP Soles Cta Cte");
  const [operationNumber, setOperationNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Cálculos de KPIs
  const totalReceivable = receivables.reduce((sum, r) => sum + r.balanceAmount, 0);
  const now = new Date();
  const overdueReceivable = receivables
    .filter((r) => r.dueDate && new Date(r.dueDate) < now && r.balanceAmount > 0)
    .reduce((sum, r) => sum + r.balanceAmount, 0);

  const totalPayable = payables.reduce((sum, p) => sum + p.balanceAmount, 0);
  const overduePayable = payables
    .filter((p) => p.dueDate && new Date(p.dueDate) < now && p.balanceAmount > 0)
    .reduce((sum, p) => sum + p.balanceAmount, 0);

  const totalCollectedMonth = transactions
    .filter((t) => t.paymentType === "COBRO_VENTA")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaidMonth = transactions
    .filter((t) => t.paymentType === "PAGO_COMPRA")
    .reduce((sum, t) => sum + t.amount, 0);

  // Filtrado de tablas
  const filteredReceivables = receivables.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.fullNumber.toLowerCase().includes(q) ||
      r.customer.legalName.toLowerCase().includes(q) ||
      r.customer.docNumber.includes(q);

    const isOverdue = r.dueDate && new Date(r.dueDate) < now && r.balanceAmount > 0;
    let matchesStatus = true;
    if (statusFilter === "PENDIENTE") matchesStatus = r.paymentStatus === "PENDIENTE" && !isOverdue;
    else if (statusFilter === "PARCIAL") matchesStatus = r.paymentStatus === "PARCIAL" && !isOverdue;
    else if (statusFilter === "VENCIDO") matchesStatus = !!isOverdue;
    else if (statusFilter === "PAGADO") matchesStatus = r.paymentStatus === "PAGADO";

    return matchesSearch && matchesStatus;
  });

  const filteredPayables = payables.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.fullNumber.toLowerCase().includes(q) ||
      p.supplier.legalName.toLowerCase().includes(q) ||
      p.supplier.docNumber.includes(q) ||
      (p.supplierInvoice && p.supplierInvoice.toLowerCase().includes(q));

    const isOverdue = p.dueDate && new Date(p.dueDate) < now && p.balanceAmount > 0;
    let matchesStatus = true;
    if (statusFilter === "PENDIENTE") matchesStatus = p.paymentStatus === "PENDIENTE" && !isOverdue;
    else if (statusFilter === "PARCIAL") matchesStatus = p.paymentStatus === "PARCIAL" && !isOverdue;
    else if (statusFilter === "VENCIDO") matchesStatus = !!isOverdue;
    else if (statusFilter === "PAGADO") matchesStatus = p.paymentStatus === "PAGADO";

    return matchesSearch && matchesStatus;
  });

  const filteredTransactions = transactions.filter((t) => {
    const q = searchTerm.toLowerCase();
    const docRef =
      t.salesDocument?.fullNumber || t.purchaseOrder?.fullNumber || "";
    return (
      docRef.toLowerCase().includes(q) ||
      t.partner.legalName.toLowerCase().includes(q) ||
      t.partner.docNumber.includes(q) ||
      (t.operationNumber && t.operationNumber.toLowerCase().includes(q))
    );
  });

  // Abrir modal de cobro/pago para un documento específico
  function openPaymentModal(type: "COBRO_VENTA" | "PAGO_COMPRA", docId: string, maxAmount: number) {
    setModalType(type);
    setSelectedDocId(docId);
    setPayAmount(maxAmount.toFixed(2));
    setErrorMsg("");
    setSuccessMsg("");
    setOperationNumber("");
    setNotes("");
    setIsModalOpen(true);
  }

  const selectedReceivable = receivables.find((r) => r.id === selectedDocId);
  const selectedPayable = payables.find((p) => p.id === selectedDocId);

  async function handleSubmitPayment(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg("Ingrese un monto válido mayor a 0.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await registerPayment({
      paymentType: modalType,
      salesDocumentId: modalType === "COBRO_VENTA" ? selectedDocId : undefined,
      purchaseOrderId: modalType === "PAGO_COMPRA" ? selectedDocId : undefined,
      amount: amt,
      paymentDate: paymentDate,
      paymentMethod: paymentMethod,
      bankName: bankName,
      operationNumber: operationNumber,
      notes: notes,
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "Error al procesar el pago.");
    } else {
      setSuccessMsg("¡Pago y conciliación contable registrados con éxito!");
      router.refresh();
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg("");
      }, 1200);
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs Superiores de Flujo de Caja y Cartera */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Cuentas por Cobrar */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total por Cobrar (CXC)
            </span>
            <ArrowDownLeft className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {formatPEN(totalReceivable)}
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-[#2563EB]">PCGE 1212</span> Clientes
          </p>
        </div>

        {/* Morosidad / Vencidas CXC */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              CXC Vencidas (Morosas)
            </span>
            <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div className="text-2xl font-black text-[#EF4444] font-mono tabular-nums">
            {formatPEN(overdueReceivable)}
          </div>
          <p className="text-[11px] text-rose-600">Requiere gestión de cobranza</p>
        </div>

        {/* Total Cuentas por Pagar */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total por Pagar (CXP)
            </span>
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {formatPEN(totalPayable)}
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-amber-600">PCGE 4212</span> Proveedores
          </p>
        </div>

        {/* Total Cobrado / Recuperado */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Cobranzas Realizadas
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-black text-[#10B981] font-mono tabular-nums">
            {formatPEN(totalCollectedMonth)}
          </div>
          <p className="text-[11px] text-emerald-600">Ingresos conciliados en banco</p>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("cxc");
            setStatusFilter("TODOS");
          }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === "cxc"
              ? "border-[#2563EB] text-[#2563EB] bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Cuentas por Cobrar (Clientes)</span>
          {receivables.filter((r) => r.balanceAmount > 0).length > 0 && (
            <span className="ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-[#2563EB]">
              {receivables.filter((r) => r.balanceAmount > 0).length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("cxp");
            setStatusFilter("TODOS");
          }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === "cxp"
              ? "border-[#2563EB] text-[#2563EB] bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Cuentas por Pagar (Proveedores)</span>
          {payables.filter((p) => p.balanceAmount > 0).length > 0 && (
            <span className="ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700">
              {payables.filter((p) => p.balanceAmount > 0).length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("transactions");
            setStatusFilter("TODOS");
          }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === "transactions"
              ? "border-[#2563EB] text-[#2563EB] bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Historial de Pagos & Tesorería</span>
          {transactions.length > 0 && (
            <span className="ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {transactions.length}
            </span>
          )}
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === "cxc"
                ? "Buscar por factura, RUC o cliente..."
                : activeTab === "cxp"
                ? "Buscar por compra, factura o proveedor..."
                : "Buscar por referencia u operación..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-[#E2E8F0] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>

        {activeTab !== "transactions" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Estado:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-[#E2E8F0] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="PARCIAL">Parciales (Con abonos)</option>
              <option value="VENCIDO">Vencidos (Morosos)</option>
              <option value="PAGADO">Cobrados / Pagados 100%</option>
            </select>
          </div>
        )}
      </div>

      {/* TABLA 1: CUENTAS POR COBRAR (CXC) */}
      {activeTab === "cxc" && (
        <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-2xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] text-slate-500 border-b border-[#E2E8F0] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Comprobante</th>
                <th className="px-4 py-3">Cliente / RUC</th>
                <th className="px-4 py-3">Emisión / Vencimiento</th>
                <th className="px-4 py-3">Término</th>
                <th className="px-4 py-3 text-right">Total Factura</th>
                <th className="px-4 py-3 text-right">Cobrado</th>
                <th className="px-4 py-3 text-right">Saldo Pendiente</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    No se encontraron cuentas por cobrar registradas.
                  </td>
                </tr>
              ) : (
                filteredReceivables.map((doc) => {
                  const isOverdue = doc.dueDate && new Date(doc.dueDate) < now && doc.balanceAmount > 0;
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                        {doc.fullNumber}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {doc.docType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800 line-clamp-1">
                          {doc.customer.legalName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {doc.customer.docNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{formatDate(doc.issueDate)}</div>
                        {doc.dueDate ? (
                          <div
                            className={`text-[11px] flex items-center gap-1 font-medium ${
                              isOverdue ? "text-[#EF4444]" : "text-slate-500"
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            Vence: {formatDate(doc.dueDate)}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Contado</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                          {doc.paymentCondition}
                        </span>
                        {doc.schedules.length > 0 && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {doc.schedules.length} cuotas
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium tabular-nums text-slate-700">
                        {formatPEN(doc.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium tabular-nums text-[#10B981]">
                        {formatPEN(doc.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                        <span
                          className={
                            doc.balanceAmount > 0 ? "text-[#2563EB]" : "text-slate-400"
                          }
                        >
                          {formatPEN(doc.balanceAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-[#EF4444]">
                            <AlertTriangle className="w-3 h-3" />
                            VENCIDO
                          </span>
                        ) : doc.paymentStatus === "PAGADO" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#10B981]">
                            <CheckCircle2 className="w-3 h-3" />
                            COBRADO
                          </span>
                        ) : doc.paymentStatus === "PARCIAL" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#2563EB]">
                            <Clock className="w-3 h-3" />
                            PARCIAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            PENDIENTE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {doc.balanceAmount > 0 ? (
                          <button
                            onClick={() =>
                              openPaymentModal("COBRO_VENTA", doc.id, doc.balanceAmount)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 shadow-2xs transition-colors"
                          >
                            <DollarSign className="w-3 h-3" />
                            Cobrar
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Cancelado</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLA 2: CUENTAS POR PAGAR (CXP) */}
      {activeTab === "cxp" && (
        <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-2xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] text-slate-500 border-b border-[#E2E8F0] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Orden / Factura Prov.</th>
                <th className="px-4 py-3">Proveedor / RUC</th>
                <th className="px-4 py-3">Emisión / Vencimiento</th>
                <th className="px-4 py-3">Condición</th>
                <th className="px-4 py-3 text-right">Total Compra</th>
                <th className="px-4 py-3 text-right">Pagado</th>
                <th className="px-4 py-3 text-right">Saldo por Pagar</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayables.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    No se encontraron cuentas por pagar registradas.
                  </td>
                </tr>
              ) : (
                filteredPayables.map((doc) => {
                  const isOverdue = doc.dueDate && new Date(doc.dueDate) < now && doc.balanceAmount > 0;
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                        {doc.fullNumber}
                        {doc.supplierInvoice && (
                          <span className="block text-[10px] text-slate-500 font-normal">
                            Fact: {doc.supplierInvoice}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800 line-clamp-1">
                          {doc.supplier.legalName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {doc.supplier.docNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{formatDate(doc.issueDate)}</div>
                        {doc.dueDate ? (
                          <div
                            className={`text-[11px] flex items-center gap-1 font-medium ${
                              isOverdue ? "text-[#EF4444]" : "text-slate-500"
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            Vence: {formatDate(doc.dueDate)}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Inmediato</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                          {doc.paymentCondition}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium tabular-nums text-slate-700">
                        {formatPEN(doc.total)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium tabular-nums text-[#10B981]">
                        {formatPEN(doc.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                        <span
                          className={
                            doc.balanceAmount > 0 ? "text-amber-700" : "text-slate-400"
                          }
                        >
                          {formatPEN(doc.balanceAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-[#EF4444]">
                            <AlertTriangle className="w-3 h-3" />
                            VENCIDO
                          </span>
                        ) : doc.paymentStatus === "PAGADO" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#10B981]">
                            <CheckCircle2 className="w-3 h-3" />
                            PAGADO
                          </span>
                        ) : doc.paymentStatus === "PARCIAL" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#2563EB]">
                            <Clock className="w-3 h-3" />
                            PARCIAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            PENDIENTE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {doc.balanceAmount > 0 ? (
                          <button
                            onClick={() =>
                              openPaymentModal("PAGO_COMPRA", doc.id, doc.balanceAmount)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 shadow-2xs transition-colors"
                          >
                            <DollarSign className="w-3 h-3" />
                            Pagar
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Cancelado</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLA 3: HISTORIAL DE TRANSACCIONES Y CONCILIACIÓN */}
      {activeTab === "transactions" && (
        <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-2xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] text-slate-500 border-b border-[#E2E8F0] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo Operación</th>
                <th className="px-4 py-3">Referencia Documental</th>
                <th className="px-4 py-3">Cliente / Proveedor</th>
                <th className="px-4 py-3">Medio de Pago & Banco</th>
                <th className="px-4 py-3">N° Operación / Voucher</th>
                <th className="px-4 py-3 text-right">Importe</th>
                <th className="px-4 py-3 text-center">Asiento PCGE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No se registran transacciones bancarias o de tesorería aún.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {formatDate(t.paymentDate)}
                    </td>
                    <td className="px-4 py-3">
                      {t.paymentType === "COBRO_VENTA" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <ArrowDownLeft className="w-3 h-3 text-[#10B981]" />
                          COBRO CXC
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <ArrowUpRight className="w-3 h-3 text-amber-700" />
                          PAGO CXP
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                      {t.salesDocument ? t.salesDocument.fullNumber : t.purchaseOrder?.fullNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{t.partner.legalName}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {t.partner.docNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="font-medium text-slate-800">{t.paymentMethod}</span>
                      {t.bankName && (
                        <span className="block text-[10px] text-slate-400">{t.bankName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {t.operationNumber || <span className="text-slate-400 italic">S/N</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                      <span
                        className={
                          t.paymentType === "COBRO_VENTA" ? "text-[#10B981]" : "text-amber-700"
                        }
                      >
                        {formatPEN(t.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[10px] font-semibold border border-indigo-200">
                        {t.paymentType === "COBRO_VENTA" ? "1041 ➔ 1212" : "4212 ➔ 1041"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE REGISTRO DE COBRO / PAGO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header del Modal */}
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-lg ${
                    modalType === "COBRO_VENTA"
                      ? "bg-blue-100 text-[#2563EB]"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {modalType === "COBRO_VENTA"
                      ? "Registrar Cobranza a Cliente"
                      : "Registrar Pago a Proveedor"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Conciliación bancaria y asiento contable automático en PCGE
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmitPayment} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs rounded-lg bg-rose-50 text-[#EF4444] border border-rose-200">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 text-xs rounded-lg bg-emerald-50 text-[#10B981] border border-emerald-200">
                  {successMsg}
                </div>
              )}

              {/* Info del Documento */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Documento / Ref:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {modalType === "COBRO_VENTA"
                      ? selectedReceivable?.fullNumber
                      : selectedPayable?.fullNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {modalType === "COBRO_VENTA" ? "Cliente:" : "Proveedor:"}
                  </span>
                  <span className="font-semibold text-slate-800 line-clamp-1">
                    {modalType === "COBRO_VENTA"
                      ? selectedReceivable?.customer.legalName
                      : selectedPayable?.supplier.legalName}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold">
                  <span className="text-slate-600">Saldo Pendiente Actual:</span>
                  <span className="font-mono text-[#2563EB] tabular-nums">
                    {formatPEN(
                      modalType === "COBRO_VENTA"
                        ? selectedReceivable?.balanceAmount || 0
                        : selectedPayable?.balanceAmount || 0
                    )}
                  </span>
                </div>
              </div>

              {/* Importe a Amortizar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Importe a {modalType === "COBRO_VENTA" ? "Cobrar" : "Pagar"} (S/ PEN) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Fecha y Método */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de Operación *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] focus:ring-1 focus:ring-[#2563EB] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medio de Pago *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] focus:ring-1 focus:ring-[#2563EB] focus:outline-hidden"
                  >
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="DEPOSITO_CUENTA">Depósito en Cuenta</option>
                    <option value="YAPE_PLIN">Yape / Plin</option>
                    <option value="TARJETA">Tarjeta Débito/Crédito</option>
                    <option value="EFECTIVO">Efectivo en Caja</option>
                  </select>
                </div>
              </div>

              {/* Banco y Número de Operación */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Banco / Cuenta Destino
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ej: BCP Soles, BBVA, Interbank"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] focus:ring-1 focus:ring-[#2563EB] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    N° de Operación / Voucher
                  </label>
                  <input
                    type="text"
                    value={operationNumber}
                    onChange={(e) => setOperationNumber(e.target.value)}
                    placeholder="Ej: OP-9842103"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E2E8F0] focus:ring-1 focus:ring-[#2563EB] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Glosa / Observaciones
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones de la amortización o conciliación..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] focus:ring-1 focus:ring-[#2563EB] focus:outline-hidden"
                />
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-colors ${
                    modalType === "COBRO_VENTA"
                      ? "bg-[#2563EB] hover:bg-blue-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {loading ? "Procesando..." : "Confirmar Operación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
