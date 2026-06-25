"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { StatusColumn } from "@/components/StatusColumn";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { STATUS_FLOW, STATUS_LABEL, STATUS_STYLE } from "@/lib/constants";

// ==========================================================
// Status Board — visualisasi 5 kolom status cucian (kanban).
// Antrian → Cuci → Setrika → Siap → Diambil (PRD poin 5).
//
// Mobile: kolom discroll horizontal; tiap kartu bisa diklik untuk
// detail, atau gunakan tombol "Maju" untuk advance status cepat.
// ==========================================================

export default function StatusBoardPage() {
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

  useEffect(() => {
    load();
  }, [load]);

  // Kelompokkan order per status.
  const grouped = useMemo(() => {
    const map: Record<OrderStatus, Order[]> = {
      antrian: [],
      cuci: [],
      setrika: [],
      siap: [],
      diambil: [],
    };
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
      <>
        <AppHeader title="Status Board" subtitle="Alur cucian" />
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Status Board" subtitle="Geser → untuk lihat semua tahap" />

      {/* Hint kontrol */}
      <div className="mb-3 rounded-lg bg-brand-50 border border-brand-100 px-3 py-2 text-[11px] text-brand-700">
        💡 Klik kartu untuk detail, atau gunakan tombol <b>Maju</b> untuk mempercepat status.
      </div>

      {/* Board horizontal */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
        {STATUS_FLOW.map((status) => {
          const items = grouped[status];
          return (
            <div key={status} className="flex flex-col">
              <StatusColumn
                title={STATUS_LABEL[status]}
                hex={STATUS_STYLE[status].hex}
                orders={items}
              />
              {/* Tombol advance massal per kolom (advance order pertama di kolom) */}
              {items.length > 0 && status !== "diambil" && (
                <div className="mt-2 px-1">
                  <Button
                    size="sm"
                    variant="outline"
                    fullWidth
                    loading={busy === items[0].id}
                    onClick={() => handleAdvance(items[0].id)}
                  >
                    Majukan #{items[0].id}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
