"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatRupiah } from "@/lib/format";

// ==========================================================
// Profit/Loss Report — laporan laba/rugi dengan chart.
// ==========================================================

interface ProfitLossData {
  summary: {
    total_revenue: number;
    total_expenses: number;
    profit: number;
    margin: number;
  };
  daily: Array<{
    tanggal: string;
    label: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  expenses_by_category: Record<string, number>;
}

export default function ProfitLossPage() {
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dari, setDari] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [sampai, setSampai] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const result = await api.getProfitLoss(dari, sampai);
      setData(result);
    } catch (err) {
      console.error("Failed to load profit/loss:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleExportPdf() {
    window.open(api.getProfitLossPdfUrl(dari, sampai), "_blank");
  }

  function handleExportExpensesCsv() {
    window.open(api.getExpensesCsvUrl(dari, sampai), "_blank");
  }

  const maxVal = data
    ? Math.max(...data.daily.map((d) => Math.max(d.revenue, d.expenses)), 1)
    : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Laba/Rugi</h1>
      </div>

      {/* Filter */}
      <Card>
        <form onSubmit={loadData} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Dari</label>
            <input
              type="date"
              value={dari}
              onChange={(e) => setDari(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Sampai</label>
            <input
              type="date"
              value={sampai}
              onChange={(e) => setSampai(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" loading={loading} size="sm">
            Load
          </Button>
          <Button type="button" onClick={handleExportPdf} variant="outline" size="sm">
            📄 Export PDF
          </Button>
          <Button type="button" onClick={handleExportExpensesCsv} variant="outline" size="sm">
            📊 Export Expenses CSV
          </Button>
        </form>
      </Card>

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="text-center">
              <p className="text-xs text-slate-400 mb-1">Pendapatan</p>
              <p className="text-lg font-bold text-green-600">
                {formatRupiah(data.summary.total_revenue)}
              </p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-slate-400 mb-1">Pengeluaran</p>
              <p className="text-lg font-bold text-red-600">
                {formatRupiah(data.summary.total_expenses)}
              </p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-slate-400 mb-1">Laba/Rugi</p>
              <p
                className={`text-lg font-bold ${
                  data.summary.profit >= 0 ? "text-blue-600" : "text-red-600"
                }`}
              >
                {formatRupiah(data.summary.profit)}
              </p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-slate-400 mb-1">Margin</p>
              <p
                className={`text-lg font-bold ${
                  data.summary.margin >= 0 ? "text-blue-600" : "text-red-600"
                }`}
              >
                {data.summary.margin}%
              </p>
            </Card>
          </div>

          {/* Daily Chart */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Grafik Harian</h3>
            <div className="flex items-end gap-1 h-40">
              {data.daily.map((d) => (
                <div key={d.tanggal} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex gap-px items-end" style={{ height: "120px" }}>
                    <div
                      className="flex-1 bg-green-400 rounded-t"
                      style={{ height: `${(d.revenue / maxVal) * 100}%`, minHeight: d.revenue > 0 ? "2px" : "0" }}
                      title={`Revenue: ${formatRupiah(d.revenue)}`}
                    />
                    <div
                      className="flex-1 bg-red-400 rounded-t"
                      style={{ height: `${(d.expenses / maxVal) * 100}%`, minHeight: d.expenses > 0 ? "2px" : "0" }}
                      title={`Expenses: ${formatRupiah(d.expenses)}`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 truncate w-full text-center">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-400 rounded" /> Pendapatan
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-400 rounded" /> Pengeluaran
              </span>
            </div>
          </Card>

          {/* Expense Breakdown */}
          {Object.keys(data.expenses_by_category).length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Pengeluaran per Kategori
              </h3>
              <div className="space-y-2">
                {Object.entries(data.expenses_by_category)
                  .sort(([, a], [, b]) => b - a)
                  .map(([kategori, nominal]) => {
                    const pct = data.summary.total_expenses > 0
                      ? Math.round((nominal / data.summary.total_expenses) * 100)
                      : 0;
                    return (
                      <div key={kategori}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">{kategori}</span>
                          <span className="font-medium">{formatRupiah(nominal)}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-brand-500 h-2 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          {/* Daily Table */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Detail Harian</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-slate-500">Tanggal</th>
                    <th className="text-right py-2 text-slate-500">Pendapatan</th>
                    <th className="text-right py-2 text-slate-500">Pengeluaran</th>
                    <th className="text-right py-2 text-slate-500">Laba/Rugi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily.map((d) => (
                    <tr key={d.tanggal} className="border-b border-slate-100">
                      <td className="py-2 text-slate-700">{d.label}</td>
                      <td className="py-2 text-right text-green-600">
                        {formatRupiah(d.revenue)}
                      </td>
                      <td className="py-2 text-right text-red-600">
                        {formatRupiah(d.expenses)}
                      </td>
                      <td
                        className={`py-2 text-right font-medium ${
                          d.profit >= 0 ? "text-blue-600" : "text-red-600"
                        }`}
                      >
                        {formatRupiah(d.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
