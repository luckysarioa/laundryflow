"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatRupiah } from "@/lib/format";

// ==========================================================
// Revenue Dashboard — total pendapatan dari semua tenant.
// ==========================================================

interface RevenueData {
  total: number;
  monthly: number;
  yearly: number;
  by_plan: { plan: string; revenue: number; count: number }[];
  monthly_trend: { month: string; revenue: number }[];
}

// Mock data
const MOCK_REVENUE: RevenueData = {
  total: 32500000,
  monthly: 2500000,
  yearly: 30000000,
  by_plan: [
    { plan: "Free", revenue: 0, count: 4 },
    { plan: "Pro", revenue: 1980000, count: 6 },
    { plan: "Enterprise", revenue: 598000, count: 2 },
  ],
  monthly_trend: [
    { month: "Jan", revenue: 1800000 },
    { month: "Feb", revenue: 2100000 },
    { month: "Mar", revenue: 2500000 },
    { month: "Apr", revenue: 2300000 },
    { month: "May", revenue: 2800000 },
    { month: "Jun", revenue: 2500000 },
  ],
};

export default function RevenuePage() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setRevenue(MOCK_REVENUE);
      setLoading(false);
    }, 500);
  }, []);

  if (loading || !revenue) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  const maxRevenue = Math.max(...revenue.monthly_trend.map((m) => m.revenue));

  return (
    <div className="space-y-5">
      <PageHeader title="Revenue" subtitle="Total pendapatan dari semua tenant" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Total Revenue" value={formatRupiah(revenue.total)} />
        <SummaryCard label="Monthly Revenue" value={formatRupiah(revenue.monthly)} />
        <SummaryCard label="Yearly Revenue" value={formatRupiah(revenue.yearly)} />
      </div>

      {/* Charts — responsive 1/2 kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Trend */}
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Tren Bulanan</h3>
          <div className="flex items-end gap-2 h-40">
            {revenue.monthly_trend.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className="text-[10px] text-slate-500 truncate">
                  {(item.revenue / 1000000).toFixed(1)}M
                </span>
                <div
                  className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-md transition-all hover:from-brand-700 hover:to-brand-500"
                  style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
                />
                <span className="text-xs text-slate-400">{item.month}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue by Plan */}
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Revenue per Paket</h3>
          <div className="space-y-3">
            {revenue.by_plan.map((item) => (
              <div key={item.plan} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-brand-500" />
                  <span className="text-sm font-medium text-slate-800">{item.plan}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">
                    {item.revenue > 0 ? formatRupiah(item.revenue) : "-"}
                  </p>
                  <p className="text-xs text-slate-400">{item.count} tenant</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
}

