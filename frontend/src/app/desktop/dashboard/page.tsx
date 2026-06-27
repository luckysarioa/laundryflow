"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { DashboardStats, Order } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { formatRupiah, formatRelative } from "@/lib/format";
import { ROLES, STATUS_FLOW, STATUS_LABEL } from "@/lib/constants";

export default function DesktopDashboardPage() {
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
        setRecent(orders.slice(0, 8));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const statusCount = (status: (typeof STATUS_FLOW)[number]) =>
    recent?.filter((o) => o.status === status).length ?? 0;

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Halo, {user?.nama?.split(" ")[0] ?? ""}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {ROLES[user?.role ?? "kasir"]} &bull; LaundryFlow &bull; {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Stats Cards - 4 columns */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Omzet Hari Ini"
          value={formatRupiah(stats.omzetHariIni)}
          hint={`${stats.jumlahOrderHariIni} order masuk`}
          tone="brand"
        />
        <StatCard
          label="Cucian Diproses"
          value={String(stats.cucianDiproses)}
          hint="belum diambil"
          tone="amber"
        />
        <StatCard
          label="Siap Diambil"
          value={String(stats.siapDiambil)}
          hint="menunggu customer"
          tone="emerald"
        />
        <StatCard
          label="Total Pelanggan"
          value={String(stats.totalCustomer)}
          hint="terdaftar"
          tone="purple"
        />
      </div>

      {/* Status Summary + Recent Orders side by side */}
      <div className="grid grid-cols-3 gap-6">
        {/* Status Ringkasan - takes 1 col */}
        <div className="col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Status Alur</h3>
              <Link href="/desktop/status" className="text-xs font-medium text-brand-600 hover:underline">
                Lihat Board →
              </Link>
            </div>
            <div className="space-y-3">
              {STATUS_FLOW.map((s) => {
                const count = statusCount(s);
                const colors: Record<string, string> = {
                  antrian: "bg-blue-500",
                  cuci: "bg-amber-500",
                  setrika: "bg-purple-500",
                  siap: "bg-emerald-500",
                  diambil: "bg-slate-400",
                };
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${colors[s]}`} />
                    <span className="text-sm text-slate-600 flex-1">{STATUS_LABEL[s]}</span>
                    <span className="text-sm font-semibold text-slate-800">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Terbaru - takes 2 cols */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Order Terbaru</h3>
              <Link href="/desktop/orders" className="text-xs font-medium text-brand-600 hover:underline">
                Semua Order →
              </Link>
            </div>
            {!recent || recent.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">Belum ada order</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Pelanggan</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Layanan</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Berat</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((o) => (
                      <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer" onClick={() => window.location.href = `/desktop/orders/${o.id}`}>
                        <td className="py-2.5 px-3 font-medium text-slate-700">#{o.id}</td>
                        <td className="py-2.5 px-3 text-slate-800">{o.customer?.nama}</td>
                        <td className="py-2.5 px-3 text-slate-500">{o.service?.nama_layanan}</td>
                        <td className="py-2.5 px-3 text-slate-500">{o.total_berat} kg</td>
                        <td className="py-2.5 px-3"><StatusBadge status={o.status} size="sm" /></td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">{formatRupiah(o.total_harga)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: string }) {
  const tones: Record<string, { bg: string; text: string; border: string }> = {
    brand: { bg: "bg-brand-50", text: "text-brand-600", border: "border-brand-100" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
  };
  const t = tones[tone] || tones.brand;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </div>
  );
}
