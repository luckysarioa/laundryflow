"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah, formatRelative } from "@/lib/format";
import { STATUS_FLOW, STATUS_LABEL, STATUS_STYLE } from "@/lib/constants";

const STATUS_COLORS: Record<string, { header: string; dot: string; bg: string }> = {
  antrian: { header: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500", bg: "bg-blue-50/30" },
  cuci: { header: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500", bg: "bg-amber-50/30" },
  setrika: { header: "bg-purple-50 border-purple-200 text-purple-700", dot: "bg-purple-500", bg: "bg-purple-50/30" },
  siap: { header: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500", bg: "bg-emerald-50/30" },
  diambil: { header: "bg-slate-100 border-slate-200 text-slate-600", dot: "bg-slate-400", bg: "bg-slate-50/30" },
};

export default function DesktopStatusPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await api.getOrders());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const map: Record<OrderStatus, Order[]> = { antrian: [], cuci: [], setrika: [], siap: [], diambil: [] };
    orders?.forEach((o) => map[o.status].push(o));
    return map;
  }, [orders]);

  async function handleAdvance(orderId: number) {
    setBusy(orderId);
    try {
      await api.advanceOrder(orderId);
      toast.success("Status diperbarui.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui status.");
    } finally {
      setBusy(null);
    }
  }

  if (loading && !orders) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Status Board</h1>
          <p className="text-sm text-slate-500 mt-1">Alur cucian — klik kartu untuk detail</p>
        </div>
      </div>

      {/* Kanban Board - 5 columns */}
      <div className="grid grid-cols-5 gap-4">
        {STATUS_FLOW.map((status) => {
          const items = grouped[status];
          const colors = STATUS_COLORS[status];
          return (
            <div key={status} className="flex flex-col">
              {/* Column Header */}
              <div className={`rounded-t-xl border px-4 py-3 ${colors.header}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                    <span className="text-sm font-semibold">{STATUS_LABEL[status]}</span>
                  </div>
                  <span className="text-xs font-bold bg-white/60 rounded-full px-2 py-0.5">{items.length}</span>
                </div>
              </div>

              {/* Column Body */}
              <div className={`flex-1 rounded-b-xl border border-t-0 border-slate-200 p-2 space-y-2 min-h-[200px] ${colors.bg}`}>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">Kosong</div>
                ) : (
                  items.map((o) => (
                    <Link
                      key={o.id}
                      href={`/desktop/orders/${o.id}`}
                      className="block bg-white rounded-lg border border-slate-100 p-3 hover:border-brand-300 hover:shadow-sm transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-brand-600">#{o.id}</span>
                        <StatusBadge status={o.status} size="sm" />
                      </div>
                      <p className="text-sm font-medium text-slate-800 truncate">{o.customer?.nama}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{o.service?.nama_layanan} &bull; {o.total_berat}kg</p>
                      <p className="text-xs font-medium text-slate-600 mt-1">{formatRupiah(o.total_harga)}</p>
                    </Link>
                  ))
                )}
              </div>

              {/* Advance Button */}
              {items.length > 0 && status !== "diambil" && (
                <button
                  disabled={busy === items[0].id}
                  onClick={() => handleAdvance(items[0].id)}
                  className="mt-2 w-full py-2 text-xs font-medium text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 disabled:opacity-50 transition"
                >
                  {busy === items[0].id ? "Memproses..." : `Majukan #${items[0].id}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
