import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        foreground: "#0F172A",
        surface: {
          DEFAULT: "#FFFFFF",
          border: "#E2E8F0",
        },
        brand: {
          DEFAULT: "#2563EB", // Azul Eléctrico Primario (CTA)
          hover: "#1D4ED8",
          dark: "#0F4C81",
          deep: "#0F172A",
        },
        sidebar: {
          from: "#0F172A",
          to: "#0F4C81",
          active: "#2563EB",
        },
        semantic: {
          success: "#10B981", // Verde Esmeralda (Ventas / Aceptado SUNAT)
          warning: "#F59E0B", // Ámbar (Stock Mínimo / Pendientes)
          danger: "#EF4444",  // Rojo (Stock Agotado / Anulados)
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
