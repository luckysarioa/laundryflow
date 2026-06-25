"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenuePoint } from "@/lib/types";
import { formatRupiah, formatRupiahRingkas } from "@/lib/format";

// ==========================================================
// RevenueChart — grafik pendapatan (area chart) pakai Recharts.
// Sesuai PRD poin 4 (Financial Reporting) & 6 (grafik pendapatan).
// ==========================================================

interface RevenueChartProps {
  data: RevenuePoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="omzetGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={42}
            tickFormatter={(v) => formatRupiahRingkas(Number(v))}
          />
          <Tooltip
            cursor={{ stroke: "#0ea5e9", strokeWidth: 1, strokeDasharray: "4 4" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
            labelStyle={{ color: "#475569", fontWeight: 600 }}
            formatter={(value: number) => [formatRupiah(Number(value)), "Omzet"]}
          />
          <Area
            type="monotone"
            dataKey="omzet"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            fill="url(#omzetGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
