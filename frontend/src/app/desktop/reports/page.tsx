"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { RevenuePoint } from "@/lib/types";
import { RevenueChart } from "@/components/RevenueChart";
import { Spinner } from "@/components/ui/Spinner";
import { formatRupiah } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";

function toISODate(d: Date): string { return d.toISOString().slice(0, 10); }
function daysAgoISO(days: number): string { const d = new Date(); d.setDate(d.getDate() - days); return toISODate(d); }

export default function DesktopReportsPage() {
  const [dari, setDari] = useState(daysAgoISO(13));
  const [sampai, setSampai] = useState(toISODate(new Date()));
  const [data, setData] = useState<RevenuePoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.getRevenue(dari, sampai)); }
    finally { setLoading(false); }
  }, [dari, sampai]);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => {
    if (!data) return { total: 0, orders: 0, avg: 0, peak: 0 };
    const total = data.reduce((s, d) => s + d.omzet, 0);
    const orders = data.reduce((s, d) => s + d.jumlahOrder, 0);
    const activeDays = data.filter((d) => d.omzet > 0).length || 1;
    const peak = data.reduce((max, d) => Math.max(max, d.omzet), 0);
    return { total, orders, avg: Math.round(total / activeDays), peak };
  }, [data]);

  function applyPreset(days: number) {
    setDari(daysAgoISO(days - 1));
    setSampai(toISODate(new Date()));
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      await api.downloadRevenuePdf(dari, sampai);
      toast.success("PDF berhasil diunduh.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh PDF.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Keuangan</h1>
          <p className="text-sm text-slate-500 mt-1">Ringkasan pendapatan</p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Filter + Stats in one row */}
      <div className="grid grid-cols-5 gap-4">
        {/* Date Filter - 2 cols */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Filter Periode</h3>
          <div className="flex gap-2 mb-4">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => applyPreset(d)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${
                  dari === daysAgoISO(d - 1) && sampai === toISODate(new Date())
                    ? "bg-brand-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:border-brand-300"
                }`}
              >
                {d} Hari
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Dari</label>
              <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sampai</label>
              <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </div>

        {/* Stats - 3 cols */}
        <div className="col-span-3 grid grid-cols-3 gap-4">
          <StatCard label="Total Pendapatan" value={formatRupiah(summary.total)} tone="emerald" />
          <StatCard label="Rata-rata / Hari" value={formatRupiah(summary.avg)} tone="purple" />
          <StatCard label="Total Order" value={String(summary.orders)} tone="blue" />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Grafik Pendapatan</h3>
          <span className="text-xs text-slate-400">{dari} → {sampai}</span>
        </div>
        {loading && !data ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : data && data.some((d) => d.omzet > 0) ? (
          <RevenueChart data={data} />
        ) : (
          <div className="text-center py-12 text-sm text-slate-400">Belum ada pendapatan pada periode ini.</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-600",
    purple: "text-purple-600",
    blue: "text-blue-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${colors[tone] || "text-slate-800"}`}>{value}</p>
    </div>
  );
}
