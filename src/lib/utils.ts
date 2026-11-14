import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPEN(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "S/ 0.00";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function validateDocNumber(type: "DNI" | "RUC", value: string): { isValid: boolean; message?: string } {
  const clean = value.trim();
  if (type === "DNI") {
    if (!/^\d{8}$/.test(clean)) {
      return { isValid: false, message: "El DNI debe contener exactamente 8 dígitos numéricos" };
    }
  } else if (type === "RUC") {
    if (!/^(10|20|15|17)\d{9}$/.test(clean)) {
      return { isValid: false, message: "El RUC debe tener 11 dígitos y comenzar con 10, 20, 15 o 17" };
    }
  }
  return { isValid: true };
}
