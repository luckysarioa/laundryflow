"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { formatRupiah, formatRelative } from "@/lib/format";
import { STATUS_FLOW, STATUS_LABEL } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";

// ==========================================================
// Daftar Order — dengan filter status & pencarian (nama/no hp/id).
// Dilengkapi: Export PDF.
// ==========================================================

type Filter = OrderStatus | "semua";

export default function OrdersPage() {
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

  // Debounce pencarian.
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
      await api.downloadOrdersPdf({
        status: filter !== "semua" ? filter : undefined,
      });
      toast.success("PDF berhasil diunduh.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh PDF.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <AppHeader
        title="Daftar Order"
        subtitle={`${orders?.length ?? 0} order`}
        action={
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              aria-label="Download PDF"
            >
              {downloading ? (
                <Spinner size={16} className="text-white" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </button>
            <Link
              href="/orders/new"
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
              aria-label="Tambah Order"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </Link>
          </div>
        }
      />

      <div className="space-y-3">
        {/* Pencarian */}
        <Input
          name="q"
          placeholder="Cari nama / no. HP / ID order..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          prefix="🔍"
        />

        {/* Chip filter status */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          <Chip active={filter === "semua"} onClick={() => setFilter("semua")} label="Semua" count={orders?.length ?? 0} />
          {STATUS_FLOW.map((s) => (
            <Chip key={s} active={filter === s} onClick={() => setFilter(s)} label={STATUS_LABEL[s]} count={countByStatus(s)} />
          ))}
        </div>

        {/* Daftar */}
        {loading && !orders ? (
          <div className="flex justify-center py-12">
            <Spinner size={26} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Tidak ada order"
            description={q ? "Tidak ada hasil untuk pencarian ini." : "Belum ada order dengan status ini."}
            action={!q && <Button size="sm" onClick={() => (window.location.href = "/orders/new")}>+ Buat Order</Button>}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`}>
                <Card padding="sm" className="flex items-center gap-3 hover:border-brand-300 transition cursor-pointer">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-semibold text-sm">
                    #{o.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{o.customer?.nama}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {o.total_berat} kg • {o.service?.nama_layanan} • {formatRelative(o.tgl_masuk)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={o.status} />
                    <span className="text-[11px] font-medium text-slate-600">{formatRupiah(o.total_harga)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Chip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={[
        "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition whitespace-nowrap",
        active ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300",
      ].join(" ")}
    >
      {label}
      <span className={["rounded-full px-1.5 text-[10px]", active ? "bg-white/25" : "bg-slate-100 text-slate-500"].join(" ")}>
        {count}
      </span>
    </button>
  );
}
