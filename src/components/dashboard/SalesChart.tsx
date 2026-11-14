"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatPEN } from "@/lib/utils";

interface ChartData {
  mes: string;
  ventas: number;
  compras: number;
}

export function SalesChart({ data }: { data: ChartData[] }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="mes"
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `S/ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip
            formatter={(value: any) => [formatPEN(Number(value)), ""]}
            contentStyle={{
              backgroundColor: "#0F172A",
              borderRadius: "8px",
              color: "#fff",
              border: "none",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="ventas" name="Ventas (S/)" fill="#2563EB" radius={[4, 4, 0, 0]} />
          <Bar dataKey="compras" name="Compras (S/)" fill="#38BDF8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
