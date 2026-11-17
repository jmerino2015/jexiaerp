"use client";

import Link from "next/link";
import {
  Building2,
  Bell,
  PlusCircle,
  Search,
  User,
  Shield,
  Store,
  ExternalLink,
  PanelLeft,
  LogOut,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

interface HeaderProps {
  companyName?: string;
  companyRuc?: string;
  userName?: string;
  userRole?: string;
}

export function Header({
  companyName = "JEXIA TECH SOLUTIONS S.A.C.",
  companyRuc = "20608945123",
  userName = "Carlos Mendoza",
  userRole = "Administrador",
}: HeaderProps) {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Botón Alternar Barra Lateral + Selector de Empresa */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-2xs transition-all active:scale-95 flex items-center gap-1.5"
          title={isOpen ? "Ocultar menú lateral" : "Mostrar menú lateral"}
          aria-label="Alternar barra lateral"
        >
          <PanelLeft className="w-5 h-5 text-[#2563EB]" />
          <span className="hidden md:inline text-xs font-semibold text-slate-600">
            {isOpen ? "Ocultar menú" : "Mostrar menú"}
          </span>
        </button>

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-[#E2E8F0] hover:bg-slate-100 transition-colors cursor-pointer">
          <div className="w-7 h-7 rounded-md bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 tracking-tight">
                {companyName}
              </span>
              <span className="text-[10px] bg-sky-100 text-[#2563EB] px-1.5 py-0.2 rounded font-bold border border-sky-200">
                Principal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono tabular-nums">RUC: {companyRuc}</p>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas y Usuario */}
      <div className="flex items-center gap-3">
        {/* Acceso a Tienda E-commerce */}
        <Link
          href="/tienda"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#10B981] text-xs font-bold border border-emerald-200 transition-all"
        >
          <Store className="w-4 h-4" />
          <span>Ver Tienda Online</span>
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </Link>

        {/* Acceso Rápido a Emitir Venta (Botón Primario CTA) */}
        <Link
          href="/ventas"
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition-all hover:shadow hover:scale-[1.01]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nueva Venta (POS)</span>
        </Link>

        {/* Acceso Rápido a Nueva Compra */}
        <Link
          href="/compras"
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-[#E2E8F0] shadow-xs transition-all"
        >
          <PlusCircle className="w-4 h-4 text-slate-500" />
          <span>Nueva Compra</span>
        </Link>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Notificaciones */}
        <button
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notificaciones operativas"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
        </button>

        {/* Perfil de Usuario y Cerrar Sesión */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-inner">
            CM
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{userName}</p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
              <Shield className="w-3 h-3 text-[#2563EB]" /> {userRole}
            </p>
          </div>
          <Link
            href="/login"
            className="p-1.5 ml-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Cerrar sesión / Salir"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
