"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah, formatRelative } from "@/lib/format";
import { STATUS_FLOW, STATUS_LABEL } from "@/lib/constants";

type Filter = OrderStatus | "semua";

export default function DesktopOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<Filter>("semua");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getOrders({ q: q.trim() || undefined });
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    if (filter === "semua") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const countByStatus = (s: OrderStatus) => orders?.filter((o) => o.status === s).length ?? 0;

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      await api.downloadOrdersPdf({ status: filter !== "semua" ? filter : undefined });
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
          <h1 className="text-2xl font-bold text-slate-800">Daftar Order</h1>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} order ditampilkan</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
          <Link
            href="/desktop/orders/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Order Baru
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama / no. HP / ID order..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <div className="flex gap-1.5">
          <FilterChip active={filter === "semua"} onClick={() => setFilter("semua")} label="Semua" count={orders?.length ?? 0} />
          {STATUS_FLOW.map((s) => (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} label={STATUS_LABEL[s]} count={countByStatus(s)} />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading && !orders ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-slate-500">Tidak ada order ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Pelanggan</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Layanan</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Berat</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-slate-100 hover:bg-brand-50/30 transition cursor-pointer"
                    onClick={() => window.location.href = `/desktop/orders/${o.id}`}
                  >
                    <td className="py-3 px-4 font-medium text-brand-600">#{o.id}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-800">{o.customer?.nama}</p>
                        <p className="text-xs text-slate-400">{o.customer?.no_hp}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{o.service?.nama_layanan}</td>
                    <td className="py-3 px-4 text-slate-600">{o.total_berat} kg</td>
                    <td className="py-3 px-4"><StatusBadge status={o.status} size="sm" /></td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{formatRelative(o.tgl_masuk)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">{formatRupiah(o.total_harga)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition border",
        active ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-200 text-slate-600 hover:border-brand-300",
      ].join(" ")}
    >
      {label}
      <span className={["rounded px-1.5 text-[10px] font-semibold", active ? "bg-white/25" : "bg-slate-100 text-slate-500"].join(" ")}>
        {count}
      </span>
    </button>
  );
}
