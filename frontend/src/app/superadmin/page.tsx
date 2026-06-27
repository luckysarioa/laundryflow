"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

interface SuperAdminStats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
}

const MOCK_STATS: SuperAdminStats = {
  totalTenants: 12,
  activeTenants: 10,
  totalRevenue: 12500000,
  monthlyRevenue: 2500000,
  activeSubscriptions: 8,
  trialSubscriptions: 2,
};

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getSuperAdminStats();
        setStats(data);
      } catch {
        setStats(MOCK_STATS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Ringkasan platform LaundryFlow</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-5">
        <StatCard
          label="Total Tenants"
          value={String(stats.totalTenants)}
          hint={`${stats.activeTenants} aktif`}
          tone="brand"
        />
        <StatCard
          label="Revenue Bulanan"
          value={`Rp ${stats.monthlyRevenue.toLocaleString("id-ID")}`}
          hint={`Total: Rp ${stats.totalRevenue.toLocaleString("id-ID")}`}
          tone="emerald"
        />
        <StatCard
          label="Subscriptions"
          value={String(stats.activeSubscriptions)}
          hint={`${stats.trialSubscriptions} trial`}
          tone="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-5">
        <Link href="/superadmin/tenants" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-sm transition group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-100 transition">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Kelola Tenants</p>
              <p className="text-xs text-slate-400 mt-0.5">Lihat & kelola semua laundry</p>
            </div>
          </div>
        </Link>

        <Link href="/superadmin/invoices" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-sm transition group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Invoices</p>
              <p className="text-xs text-slate-400 mt-0.5">Tagihan & pembayaran</p>
            </div>
          </div>
        </Link>

        <Link href="/superadmin/subscriptions" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-sm transition group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path strokeLinecap="round" d="M2 10h20" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Subscriptions</p>
              <p className="text-xs text-slate-400 mt-0.5">Kelola paket langganan</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: string }) {
  const tones: Record<string, string> = {
    brand: "border-l-brand-500",
    emerald: "border-l-emerald-500",
    purple: "border-l-purple-500",
  };
  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${tones[tone]} p-5`}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </div>
  );
}
