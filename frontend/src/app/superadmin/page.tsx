"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatRupiah } from "@/lib/format";

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
      <PageHeader title="Dashboard" subtitle="Ringkasan platform LaundryFlow" />

      {/* Stats Grid — lebar penuh, responsive 1/2/3 kolom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          label="Total Tenants"
          value={String(stats.totalTenants)}
          hint={`${stats.activeTenants} aktif`}
          tone="brand"
          icon={<TenantIcon />}
        />
        <StatCard
          label="Revenue Bulanan"
          value={formatRupiah(stats.monthlyRevenue)}
          hint={`Total: ${formatRupiah(stats.totalRevenue)}`}
          tone="emerald"
          icon={<RevenueIcon />}
        />
        <StatCard
          label="Subscriptions"
          value={String(stats.activeSubscriptions)}
          hint={`${stats.trialSubscriptions} trial`}
          tone="purple"
          icon={<SubscriptionIcon />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <QuickAction
          href="/superadmin/tenants"
          title="Kelola Tenants"
          desc="Lihat & kelola semua laundry"
          iconClass="bg-brand-50 text-brand-600 group-hover:bg-brand-100"
          icon={<TenantIcon />}
        />
        <QuickAction
          href="/superadmin/invoices"
          title="Invoices"
          desc="Tagihan & pembayaran"
          iconClass="bg-amber-50 text-amber-600 group-hover:bg-amber-100"
          icon={<InvoiceIcon />}
        />
        <QuickAction
          href="/superadmin/subscriptions"
          title="Subscriptions"
          desc="Kelola paket langganan"
          iconClass="bg-purple-50 text-purple-600 group-hover:bg-purple-100"
          icon={<SubscriptionIcon />}
        />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  desc,
  iconClass,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  iconClass: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 hover:border-brand-300 hover:shadow-md transition group"
    >
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition ${iconClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
        </div>
      </div>
    </Link>
  );
}

// ---- Icons (reusable, dipakai StatCard + QuickAction) ----
function TenantIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function RevenueIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 16V9m5 7V5m5 11v-6" />
    </svg>
  );
}
function SubscriptionIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path strokeLinecap="round" d="M2 10h20" />
    </svg>
  );
}
function InvoiceIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
      />
    </svg>
  );
}
