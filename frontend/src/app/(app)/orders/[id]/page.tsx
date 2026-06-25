"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah, formatTanggal, formatJam } from "@/lib/format";
import { STATUS_FLOW, STATUS_LABEL, STATUS_STYLE, nextStatus } from "@/lib/constants";

// ==========================================================
// Detail Order — info lengkap, update status (advance), & WA trigger.
// Sesuai PRD poin 6: update status via klik tombol.
// ==========================================================

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrder(await api.getOrder(id));
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdvance() {
    if (!order) return;
    const next = nextStatus(order.status);
    if (!next) return;
    setAdvancing(true);
    try {
      const updated = await api.advanceOrder(order.id);
      setOrder(updated);
      toast.success(`Status diperbarui ke "${STATUS_LABEL[updated.status]}".`);
      // Saat status "siap"/"diambil", sarankan kirim WA.
      if (updated.status === "siap") {
        toast.info("Cucian siap diambil — kirim info ke pelanggan?");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui status.");
    } finally {
      setAdvancing(false);
    }
  }

  if (loading) {
    return (
      <>
        <AppHeader title="Detail Order" back />
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <AppHeader title="Detail Order" back />
        <Card>
          <p className="text-sm text-slate-600 text-center py-6">Order tidak ditemukan.</p>
          <Button variant="outline" fullWidth onClick={() => router.replace("/orders")}>
            Kembali ke Daftar
          </Button>
        </Card>
      </>
    );
  }

  const next = nextStatus(order.status);

  return (
    <>
      <AppHeader title={`Order #${order.id}`} subtitle={`Masuk ${formatTanggal(order.tgl_masuk)}`} back />

      <div className="space-y-4">
        {/* Status & customer */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <StatusBadge status={order.status} size="md" />
            <span className="text-sm font-semibold text-slate-700">{formatRupiah(order.total_harga)}</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">
                {(order.customer?.nama ?? "?").charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{order.customer?.nama}</p>
                <p className="text-[11px] text-slate-400 truncate">{order.customer?.no_hp}</p>
              </div>
            </div>
            {order.customer?.alamat && (
              <p className="text-[11px] text-slate-400 pt-1">📍 {order.customer.alamat}</p>
            )}
          </div>
        </Card>

        {/* Rincian */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Rincian Pesanan</h3>
          <dl className="space-y-2.5 text-sm">
            <Row label="Layanan" value={order.service?.nama_layanan ?? "-"} />
            <Row label="Harga / kg" value={formatRupiah(order.service?.harga_per_kilo ?? 0)} />
            <Row label="Berat" value={`${order.total_berat} kg`} />
            <div className="border-t border-dashed border-slate-200 my-1" />
            <Row label="Total Harga" value={formatRupiah(order.total_harga)} bold />
            <Row label="Waktu Masuk" value={`${formatTanggal(order.tgl_masuk)} • ${formatJam(order.tgl_masuk)}`} />
            {order.tgl_selesai && (
              <Row label="Selesai" value={`${formatTanggal(order.tgl_selesai)} • ${formatJam(order.tgl_selesai)}`} />
            )}
            {order.catatan && <Row label="Catatan" value={order.catatan} />}
          </dl>
        </Card>

        {/* Progress alur status */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Progress Status</h3>
          <ol className="space-y-2">
            {STATUS_FLOW.map((s, i) => {
              const currentIdx = STATUS_FLOW.indexOf(order.status);
              const done = i <= currentIdx;
              const current = i === currentIdx;
              return (
                <li key={s} className="flex items-center gap-3">
                  <span
                    className={[
                      "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0",
                      done ? "text-white" : "bg-slate-100 text-slate-400",
                    ].join(" ")}
                    style={done ? { backgroundColor: STATUS_STYLE[s].hex } : undefined}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={["text-sm", current ? "font-semibold text-slate-800" : done ? "text-slate-600" : "text-slate-400"].join(" ")}>
                    {STATUS_LABEL[s]}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>

        {/* Aksi status */}
        {next ? (
          <Button size="lg" fullWidth loading={advancing} onClick={handleAdvance}>
            Majukan ke &ldquo;{STATUS_LABEL[next]}&rdquo;
          </Button>
        ) : (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 text-center">
            ✓ Order telah selesai &amp; diambil pelanggan.
          </div>
        )}

        {/* WhatsApp */}
        <WhatsAppButton order={order} />
      </div>
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={["text-right", bold ? "font-semibold text-slate-800" : "text-slate-700"].join(" ")}>{value}</dd>
    </div>
  );
}
