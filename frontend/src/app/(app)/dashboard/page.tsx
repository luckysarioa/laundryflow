"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { DashboardStats, Order } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { formatRupiah, formatRelative } from "@/lib/format";
import { ROLES, STATUS_FLOW, STATUS_LABEL } from "@/lib/constants";

// ==========================================================
// Dashboard — ringkasan omzet hari ini, cucian diproses,
// dan order terbaru. Sesuai PRD poin 5 (Dashboard).
// ==========================================================

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [s, orders] = await Promise.all([api.getDashboardStats(), api.getOrders()]);
        if (!active) return;
        setStats(s);
        setRecent(orders.slice(0, 4));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Hitung distribusi status dari recent (ringkasan cepat).
  const statusCount = (status: (typeof STATUS_FLOW)[number]) =>
    recent?.filter((o) => o.status === status).length ?? 0;

  return (
    <>
      <AppHeader title={`Halo, ${user?.nama?.split(" ")[0] ?? ""}! 👋`} subtitle={`${ROLES[user?.role ?? "kasir"]} • LaundryFlow`} />

      {loading || !stats ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Omzet hari ini (kartu utama) */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 p-5 text-white shadow-lg shadow-brand-600/20">
            <p className="text-sm text-brand-50/90">Omzet Hari Ini</p>
            <p className="mt-1 text-3xl font-bold">{formatRupiah(stats.omzetHariIni)}</p>
            <p className="mt-2 text-xs text-brand-50/80">
              {stats.jumlahOrderHariIni} order masuk hari ini
            </p>
          </div>

          {/* Statistik grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Cucian Diproses"
              value={String(stats.cucianDiproses)}
              hint="belum diambil"
              tone="blue"
              icon={<WashIcon />}
            />
            <StatCard
              label="Siap Diambil"
              value={String(stats.siapDiambil)}
              hint="menunggu customer"
              tone="emerald"
              icon={<CheckIcon />}
            />
            <StatCard
              label="Order Hari Ini"
              value={String(stats.jumlahOrderHariIni)}
              hint="total masuk"
              tone="purple"
              icon={<ClipboardIcon />}
            />
            <StatCard
              label="Total Pelanggan"
              value={String(stats.totalCustomer)}
              hint="terdaftar"
              tone="amber"
              icon={<UsersIcon />}
            />
          </div>

          {/* Ringkasan status alur */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">Ringkasan Status</h3>
              <Link href="/status" className="text-xs font-medium text-brand-600 hover:underline">
                Lihat Board →
              </Link>
            </div>
            <div className="flex items-center justify-between gap-1">
              {STATUS_FLOW.map((s) => (
                <div key={s} className="flex flex-col items-center gap-1 text-center">
                  <span className="text-lg font-bold text-slate-700">{statusCount(s)}</span>
                  <span className="text-[10px] text-slate-400">{STATUS_LABEL[s]}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Order terbaru */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-sm font-semibold text-slate-800">Order Terbaru</h3>
              <Link href="/orders" className="text-xs font-medium text-brand-600 hover:underline">
                Semua →
              </Link>
            </div>
            <div className="space-y-2">
              {recent && recent.length === 0 ? (
                <EmptyState title="Belum ada order" description="Order baru akan muncul di sini." />
              ) : (
                recent?.map((o) => <OrderRow key={o.id} order={o} />)
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function OrderRow({ order }: { order: Order }) {
  return (
    <Link href={`/orders/${order.id}`}>
      <Card padding="sm" className="flex items-center gap-3 hover:border-brand-300 transition cursor-pointer">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-semibold text-sm">
          #{order.id}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{order.customer?.nama}</p>
          <p className="text-[11px] text-slate-400 truncate">
            {order.total_berat} kg • {order.service?.nama_layanan} • {formatRelative(order.tgl_masuk)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={order.status} />
          <span className="text-[11px] font-medium text-slate-600">{formatRupiah(order.total_harga)}</span>
        </div>
      </Card>
    </Link>
  );
}

/* ---- Ikon ---- */
function WashIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path strokeLinecap="round" d="M8 6h.01M11 6h.01" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
function UsersIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <path strokeLinecap="round" d="M3 20c0-3 2.7-5 6-5s6 2 6 5M16 8.5a2.5 2.5 0 010 5M21 20c0-2.2-1.7-4-4-4.5" />
    </svg>
  );
}
