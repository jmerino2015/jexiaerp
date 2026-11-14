"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Boxes,
  Users,
  Building2,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  {
    title: "Inicio",
    href: "/inicio",
    icon: LayoutDashboard,
  },
  {
    title: "Ventas",
    href: "/ventas",
    icon: Receipt,
    badge: "SUNAT",
    badgeColor: "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30",
  },
  {
    title: "E-commerce Retail",
    href: "/ecommerce",
    icon: ShoppingBag,
    badge: "Tienda",
    badgeColor: "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30",
  },
  {
    title: "Compras",
    href: "/compras",
    icon: ShoppingCart,
  },
  {
    title: "Inventario",
    href: "/inventario",
    icon: Boxes,
    badge: "Kardex",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    title: "Proveedores",
    href: "/proveedores",
    icon: Building2,
  },
  {
    title: "Contabilidad",
    href: "/contabilidad",
    icon: BookOpen,
    badge: "PCGE",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  },
  {
    title: "Reportes",
    href: "/reportes",
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gradient-to-b from-[#0F172A] to-[#0F4C81] text-white flex flex-col shrink-0 min-h-screen border-r border-[#1E3A5F]/70 shadow-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex flex-col gap-1">
        <Link href="/inicio" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#1D4ED8] flex items-center justify-center shadow-lg shadow-blue-950/60 group-hover:scale-105 transition-transform">
            <span className="font-black text-xl text-white tracking-tighter">J</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">Jexia</span>
              <span className="font-semibold text-xs px-1.5 py-0.5 rounded bg-[#2563EB]/30 text-sky-200 border border-sky-400/30">
                ERP
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-none mt-0.5">
              Claridad operativa sin límites
            </p>
          </div>
        </Link>
      </div>

      {/* SUNAT Badge */}
      <div className="mx-4 mt-4 p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> Facturación SUNAT
          </p>
          <p className="text-[10px] text-slate-400">Emisión UBL 2.1 Online</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80 mb-2">
          Módulos Principales
        </p>

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/inicio" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-[#2563EB] text-white shadow-md shadow-blue-900/50 font-bold"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                  )}
                />
                <span>{item.title}</span>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    item.badgeColor || "bg-slate-700 text-slate-300 border-slate-600"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Metrics Footer */}
      <div className="p-4 border-t border-white/10 bg-[#0F172A]/70">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" /> Moneda
          </span>
          <span className="font-bold text-white tabular-nums">Soles (PEN)</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Versión 2025.2.0 • Multi-almacén
        </div>
      </div>
    </aside>
  );
}
