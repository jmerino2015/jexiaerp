import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Jexia ERP - Claridad operativa para crecer sin límites",
  description: "ERP SaaS integral para MYPES: Compras, Inventario, Ventas y Facturación Electrónica SUNAT.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="bg-slate-50 antialiased selection:bg-blue-600 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
