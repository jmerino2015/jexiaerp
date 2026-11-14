"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicOrAuth = pathname === "/login" || pathname === "/tienda";
  const { isOpen, closeSidebar } = useSidebar();

  if (isPublicOrAuth) {
    return <main className="min-h-screen w-full bg-slate-50">{children}</main>;
  }

  return (
    <div className="flex min-h-screen relative overflow-x-hidden bg-slate-50">
      {/* Backdrop para móviles cuando la barra está abierta */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          aria-hidden="true"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Barra Lateral con estado ocultar / mostrar */}
      <Sidebar />

      {/* Contenido Principal con expansión fluida */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellContent>{children}</AppShellContent>
    </SidebarProvider>
  );
}
