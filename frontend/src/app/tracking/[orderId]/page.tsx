"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { STATUS_FLOW, STATUS_LABEL, STATUS_STYLE } from "@/lib/constants";
import { formatRupiah, formatTanggal, formatJam } from "@/lib/format";

// ==========================================================
// Deep Link Tracking — halaman public langsung tampilkan order.
// URL: /tracking/{orderId}
// ==========================================================

interface TrackingOrder {
  id: number;
  status: string;
  service: string;
  total_berat: number;
  total_harga: number;
  catatan?: string;
  tgl_masuk: string;
  tgl_selesai: string | null;
  estimasi_selesai?: string;
}

export default function TrackingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId ? parseInt(params.orderId as string) : 0;
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId || orderId <= 0) {
      setError("Nomor order tidak valid.");
      setLoading(false);
      return;
    }

    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getOrderTracking(orderId);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">LaundryFlow</h1>
          <p className="text-sm text-slate-500 mt-1">Lacak Status Pesanan</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Spinner size={28} />
            <p className="text-sm text-slate-400">Memuat data pesanan...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Order Tidak Ditemukan</h2>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <Button onClick={() => router.push("/tracking")} variant="outline">
              Cari Order Lain
            </Button>
          </Card>
        )}

        {/* Order Detail */}
        {order && !loading && (
          <div className="space-y-4">
            {/* Status Card */}
            <Card className="text-center">
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">Status Pesanan</p>
                <StatusBadge status={order.status} size="lg" />
              </div>
              <div className="border-t border-slate-100 pt-4 mt-4">
                <p className="text-sm font-medium text-slate-700">Order #{order.id}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {formatTanggal(order.tgl_masuk)} • {formatJam(order.tgl_masuk)}
                </p>
              </div>
            </Card>

            {/* Estimasi */}
            {order.estimasi_selesai && order.status !== "diambil" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-600 mb-1">Estimasi Selesai</p>
                <p className="text-lg font-bold text-blue-700">⏱ {order.estimasi_selesai}</p>
              </div>
            )}

            {/* Detail */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Detail Pesanan</h3>
              <dl className="space-y-2 text-sm">
                <Row label="Layanan" value={order.service || "-"} />
                <Row label="Berat" value={`${order.total_berat} kg`} />
                <Row label="Total" value={formatRupiah(order.total_harga)} bold />
                {order.catatan && <Row label="Catatan" value={order.catatan} />}
                {order.tgl_selesai && (
                  <Row label="Selesai" value={`${formatTanggal(order.tgl_selesai)} • ${formatJam(order.tgl_selesai)}`} />
                )}
              </dl>
            </Card>

            {/* Progress Timeline */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Progress Cucian</h3>
              <ol className="relative">
                {STATUS_FLOW.map((s, i) => {
                  const currentIdx = STATUS_FLOW.indexOf(order.status as any);
                  const done = i <= currentIdx;
                  const current = i === currentIdx;
                  const isLast = i === STATUS_FLOW.length - 1;

                  return (
                    <li key={s} className="relative pb-6 last:pb-0">
                      {!isLast && (
                        <div
                          className={`absolute left-3.5 top-8 w-0.5 h-full ${
                            done && !current ? "bg-brand-500" : "bg-slate-200"
                          }`}
                        />
                      )}
                      <div className="flex items-start gap-3">
                        <span
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 z-10 ${
                            done ? "text-white" : "bg-slate-100 text-slate-400"
                          }`}
                          style={done ? { backgroundColor: STATUS_STYLE[s].hex } : undefined}
                        >
                          {done ? "✓" : i + 1}
                        </span>
                        <div className="flex-1 pt-0.5">
                          <span
                            className={`text-sm ${
                              current ? "font-semibold text-slate-800" : done ? "text-slate-600" : "text-slate-400"
                            }`}
                          >
                            {STATUS_LABEL[s]}
                          </span>
                          {current && (
                            <span className="ml-2 text-xs text-brand-600 font-medium">• Saat ini</span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>

            {/* Refresh Button */}
            <div className="text-center">
              <Button onClick={loadOrder} variant="outline" size="sm">
                🔄 Refresh Status
              </Button>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-slate-400">
              Dikelola oleh LaundryFlow
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right ${bold ? "font-semibold text-slate-800" : "text-slate-700"}`}>{value}</dd>
    </div>
  );
}
