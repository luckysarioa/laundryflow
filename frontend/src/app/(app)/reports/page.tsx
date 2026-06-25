"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { RevenuePoint } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RevenueChart } from "@/components/RevenueChart";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/StatCard";
import { formatRupiah } from "@/lib/format";

// ==========================================================
// Laporan Keuangan — grafik pendapatan + ringkasan
// dengan filter rentang tanggal. Sesuai PRD poin 4 & 6.
//
// Default: 14 hari terakhir. Preset cepat: 7/14/30 hari.
// ==========================================================

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toISODate(d);
}

export default function ReportsPage() {
  const [dari, setDari] = useState(daysAgoISO(13));
  const [sampai, setSampai] = useState(toISODate(new Date()));
  const [data, setData] = useState<RevenuePoint[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.getRevenue(dari, sampai));
    } finally {
      setLoading(false);
    }
  }, [dari, sampai]);

  useEffect(() => {
    load();
  }, [load]);

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

  return (
    <>
      <AppHeader title="Laporan Keuangan" subtitle="Ringkasan pendapatan" />

      <div className="space-y-4">
        {/* Filter rentang tanggal */}
        <Card>
          <div className="flex gap-2 mb-3">
            {[7, 14, 30].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={dari === daysAgoISO(d - 1) && sampai === toISODate(new Date()) ? "primary" : "outline"}
                onClick={() => applyPreset(d)}
                className="flex-1"
              >
                {d} Hari
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Dari" name="dari" type="date" value={dari} onChange={(e) => setDari(e.target.value)} />
            <Input label="Sampai" name="sampai" type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </div>
        </Card>

        {/* Ringkasan */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Pendapatan" value={formatRupiah(summary.total)} tone="emerald" icon={<MoneyIcon />} />
          <StatCard label="Total Order" value={String(summary.orders)} hint="periode terpilih" tone="blue" icon={<ClipboardIcon />} />
          <StatCard label="Rata-rata / Hari" value={formatRupiah(summary.avg)} hint="hari aktif" tone="purple" icon={<TrendIcon />} />
          <StatCard label="Pendapatan Tertinggi" value={formatRupiah(summary.peak)} hint="dalam sehari" tone="amber" icon={<PeakIcon />} />
        </div>

        {/* Grafik */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800">Grafik Pendapatan</h3>
            <span className="text-[11px] text-slate-400">{dari} → {sampai}</span>
          </div>
          {loading && !data ? (
            <div className="flex justify-center py-10"><Spinner size={26} /></div>
          ) : data && data.some((d) => d.omzet > 0) ? (
            <RevenueChart data={data} />
          ) : (
            <EmptyState title="Belum ada pendapatan" description="Tidak ada transaksi pada rentang tanggal ini." />
          )}
        </Card>
      </div>
    </>
  );
}

function MoneyIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path strokeLinecap="round" d="M6 9v6M18 9v6" />
    </svg>
  );
}
function ClipboardIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <rect x="9" y="2" width="6" height="4" rx="1" className="fill-white" />
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 7-7M14 8h6v6" />
    </svg>
  );
}
function PeakIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5v14h14M9 14l3-3 2 2 4-5" />
    </svg>
  );
}
