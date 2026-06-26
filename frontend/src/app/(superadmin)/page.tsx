"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/StatCard";
import { Spinner } from "@/components/ui/Spinner";

// ==========================================================
// Super Admin Dashboard — ringkasan SaaS: total tenants,
// revenue, subscriptions, dll.
// ==========================================================

interface SuperAdminStats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
}

// Mock data untuk development
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
    // Simulate API call
    setTimeout(() => {
      setStats(MOCK_STATS);
      setLoading(false);
    }, 500);
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
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500">Overview of your SaaS platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Tenants</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalTenants}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center">
              <TenantIcon />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">{stats.activeTenants} active</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-slate-800">
                Rp {stats.monthlyRevenue.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <RevenueIcon />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Total: Rp {stats.totalRevenue.toLocaleString("id-ID")}
          </p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Subscriptions</p>
              <p className="text-2xl font-bold text-slate-800">{stats.activeSubscriptions}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <SubscriptionIcon />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">{stats.trialSubscriptions} in trial</p>
        </Card>
      </div>

      {/* Recent Tenants */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Recent Tenants</h3>
        <div className="space-y-3">
          {[
            { name: "Laundry Bersih", plan: "Pro", status: "active", revenue: 99000 },
            { name: "Cuci Bersih", plan: "Enterprise", status: "active", revenue: 299000 },
            { name: "Laundry Express", plan: "Pro", status: "trial", revenue: 0 },
          ].map((tenant, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{tenant.name}</p>
                <p className="text-xs text-slate-400">{tenant.plan}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    tenant.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {tenant.status}
                </span>
                {tenant.revenue > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Rp {tenant.revenue.toLocaleString("id-ID")}/mo
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---- Icons ----
function TenantIcon() {
  return (
    <svg className="h-6 w-6 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function RevenueIcon() {
  return (
    <svg className="h-6 w-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 16V9m5 7V5m5 11v-6" />
    </svg>
  );
}
function SubscriptionIcon() {
  return (
    <svg className="h-6 w-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path strokeLinecap="round" d="M2 10h20" />
    </svg>
  );
}
