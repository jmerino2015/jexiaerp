"use client";

import { useState } from "react";
import { createPartner } from "@/app/actions/partners";
import {
  Users,
  Building2,
  PlusCircle,
  Search,
  CheckCircle2,
  X,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react";

interface PartnerItem {
  id: string;
  docType: string;
  docNumber: string;
  legalName: string;
  tradeName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string | Date;
}

export function PartnersManager({
  partners,
  type, // "CLIENTE" | "PROVEEDOR"
}: {
  partners: PartnerItem[];
  type: "CLIENTE" | "PROVEEDOR";
}) {
  const isSupplier = type === "PROVEEDOR";
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpenModal, setIsOpenModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [docType, setDocType] = useState<"DNI" | "RUC">(isSupplier ? "RUC" : "RUC");
  const [docNumber, setDocNumber] = useState("");
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const filtered = partners.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.legalName.toLowerCase().includes(term) ||
      p.docNumber.toLowerCase().includes(term) ||
      (p.tradeName && p.tradeName.toLowerCase().includes(term))
    );
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await createPartner({
      docType,
      docNumber,
      legalName,
      tradeName,
      address,
      phone,
      email,
      isCustomer: !isSupplier,
      isSupplier: isSupplier,
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "Error al registrar.");
    } else {
      setSuccessMsg(`¡${type === "CLIENTE" ? "Cliente" : "Proveedor"} registrado con éxito!`);
      setTimeout(() => {
        setIsOpenModal(false);
        setSuccessMsg("");
        setDocNumber("");
        setLegalName("");
        setTradeName("");
        setAddress("");
        setPhone("");
        setEmail("");
      }, 1000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={`Buscar por RUC/DNI o Razón Social de ${type.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
          />
        </div>

        <button
          onClick={() => setIsOpenModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo {type === "CLIENTE" ? "Cliente" : "Proveedor"}</span>
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Doc. Identidad</th>
                <th className="py-3 px-4">Razón Social / Nombre</th>
                <th className="py-3 px-3">Nombre Comercial</th>
                <th className="py-3 px-3">Dirección Fiscal</th>
                <th className="py-3 px-3">Contacto</th>
                <th className="py-3 px-3 text-center">Estado SUNAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se encontraron registros de {type.toLowerCase()}s.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.docType}
                        </span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {item.docNumber}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 leading-snug">{item.legalName}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.tradeName || "-"}
                    </td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[200px]" title={item.address || ""}>
                      {item.address || "-"}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="flex flex-col gap-0.5 text-[11px]">
                        {item.phone && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" /> {item.phone}
                          </span>
                        )}
                        {item.email && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" /> {item.email}
                          </span>
                        )}
                        {!item.phone && !item.email && "-"}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Habido / Activo
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NUEVO REGISTRO */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0F4C81] flex items-center justify-center">
                  {isSupplier ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Registrar {type === "CLIENTE" ? "Cliente" : "Proveedor"}
                </h3>
              </div>
              <button
                onClick={() => setIsOpenModal(false)}
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

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo Doc.</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  >
                    <option value="RUC">RUC (11 dígitos)</option>
                    <option value="DNI">DNI (8 dígitos)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={docType === "RUC" ? 11 : 8}
                    placeholder={docType === "RUC" ? "20601234567" : "45892301"}
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Razón Social o Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: DISTRIBUIDORA COMERCIAL S.A.C."
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  placeholder="Ej: Discom Perú"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dirección Fiscal</label>
                <input
                  type="text"
                  placeholder="Av. Principal 123, Lima"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+51 987 654 321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar Registro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
