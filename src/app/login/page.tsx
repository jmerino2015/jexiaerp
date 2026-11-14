"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { JexiaLogo } from "@/components/JexiaLogo";
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@jexia.pe");
  const [password, setPassword] = useState("••••••••");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/inicio");
    }, 600);
  }

  function handleQuickDemoFill() {
    setEmail("admin@jexia.pe");
    setPassword("admin123");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient blur background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/50 via-slate-100/20 to-transparent pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* LOGO JEXIA ERP CON FONDO CLARO */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-[#E2E8F0] inline-block hover:shadow-md transition-shadow">
            <JexiaLogo width={210} height={56} className="w-auto h-12" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Ingreso a la Plataforma
        </h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Control integral de Compras, Inventario, Ventas y SUNAT
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-[#E2E8F0] rounded-2xl space-y-6">
          {/* Demo Callout */}
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/60 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" /> Acceso Demo Activo
              </p>
              <p className="text-[11px] text-blue-700">
                Usuario administrador precargado para revisión comercial.
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="text-[11px] font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-white px-2.5 py-1 rounded-md border border-blue-200 shadow-2xs hover:bg-blue-50 transition-colors shrink-0"
            >
              Completar
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico Corporativo
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.pe"
                  className="block w-full pl-9 pr-3 py-2 text-sm text-slate-900 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Contraseña
                </label>
                <a
                  href="#recuperar"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Para la demo, usa las credenciales por defecto.");
                  }}
                  className="text-[11px] font-semibold text-[#2563EB] hover:underline"
                >
                  ¿Olvidaste tu clave?
                </a>
              </div>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm text-slate-900 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-slate-50/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-600">
                  Recordar mi sesión en este equipo
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-bold text-sm bg-[#2563EB] hover:bg-[#1D4ED8] transition-all shadow-md shadow-blue-500/20 active:scale-[0.99] disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a Jexia ERP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Institutional Compliance Badges */}
          <div className="pt-4 border-t border-[#E2E8F0] grid grid-cols-2 gap-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 py-1.5 px-2 rounded-lg border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>SUNAT UBL 2.1</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 py-1.5 px-2 rounded-lg border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Multi-Almacén</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          ¿Quieres ver la tienda retail directa?{" "}
          <Link
            href="/tienda"
            className="font-bold text-[#2563EB] hover:underline"
          >
            Ir al E-commerce Público &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
