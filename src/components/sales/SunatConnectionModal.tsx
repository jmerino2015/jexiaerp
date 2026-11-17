"use client";

import { useState } from "react";
import { testSunatConnection } from "@/app/actions/sales";
import { ShieldCheck, Server, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, X, Globe, Key, Lock } from "lucide-react";

export function SunatConnectionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  if (!isOpen) return null;

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSunatConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-[#2563EB]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Conexión Directa Web Service SOAP — SUNAT / OSE (Camino 1)
              </h3>
              <p className="text-[11px] text-slate-500">
                Emisión electrónica UBL 2.1 nativa sin intermediarios ni costos por comprobante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4 text-xs">
          {/* Tarjeta de Arquitectura Activa */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                Modo: SEE - Del Contribuyente (Envío Directo SOAP)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB] font-bold text-[10px]">
                UBL 2.1 OFICIAL
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Jexia ERP genera el archivo XML UBL 2.1, aplica la firma digital canónica XMLDSig con tu certificado digital, comprime en ZIP y lo transmite mediante el método SOAP <code className="bg-blue-100/70 px-1 py-0.5 rounded font-mono text-[#2563EB]">sendBill</code> al servidor oficial de SUNAT o a tu OSE.
            </p>
          </div>

          {/* Parámetros de Configuración */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Endpoint SOAP Activo
              </span>
              <p className="font-mono text-[11px] font-semibold text-slate-800 truncate" title="https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService">
                https://e-beta.sunat.gob.pe/...
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">SUNAT Beta (Pruebas Oficiales)</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Key className="w-3 h-3" /> Credenciales SOL
              </span>
              <p className="font-mono text-[11px] font-semibold text-slate-800">
                Usuario Secundario: MODDATOS
              </p>
              <span className="text-[10px] text-slate-500">Permisos CPE habilitados</span>
            </div>
          </div>

          {/* Resultado de la prueba si se ejecutó */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              testResult.success
                ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                : "bg-rose-50/60 border-rose-200 text-rose-900"
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                )}
                <span>Respuesta del Servidor SUNAT: {testResult.responseCode || "OK"}</span>
              </div>
              <p className="text-[11px] font-mono leading-relaxed">
                {testResult.description || testResult.error}
              </p>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 flex justify-between">
                <span>RUC: {testResult.companyRuc}</span>
                <span>Entorno: {testResult.environment}</span>
              </div>
            </div>
          )}

          {/* Guía Rápida para Producción */}
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40 text-[11px] text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-700" /> Para pasar a Producción en Vivo:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-700">
              <li>Colocar en tu archivo <code className="bg-amber-100 px-1 rounded font-mono">.env</code> la variable <code className="bg-amber-100 px-1 rounded font-mono">SUNAT_ENV="PRODUCTION"</code>.</li>
              <li>Ingresar tu Usuario SOL Secundario y Clave SOL en los datos de la empresa.</li>
              <li>Cargar tu Certificado Digital Tributario (.pfx) entregado gratuitamente por SUNAT.</li>
            </ol>
          </div>
        </div>

        {/* Footer con Botón de Prueba */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Protocolo WSDL / SOAP 1.1 — UBL 2.1
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              disabled={testing}
              onClick={handleTest}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
              {testing ? "Conectando con SUNAT..." : "Probar Conexión Directa con SUNAT"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
