"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FullPageSpinner } from "@/components/ui/Spinner";

// ==========================================================
// Layout grup (superadmin) — shell aplikasi untuk pemilik SaaS.
// Melindungi semua route di grup ini: jika belum login atau
// bukan role superadmin, arahkan ke /login.
// ==========================================================

const NAV_ITEMS = [
  { href: "/superadmin", label: "Dashboard", icon: HomeIcon },
  { href: "/superadmin/tenants", label: "Tenants", icon: TenantIcon },
  { href: "/superadmin/subscriptions", label: "Subscriptions", icon: SubscriptionIcon },
  { href: "/superadmin/revenue", label: "Revenue", icon: RevenueIcon },
  { href: "/superadmin/sa-settings", label: "Settings", icon: SettingsIcon },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace("/login?next=/superadmin");
      } else if (user?.role !== "superadmin") {
        router.replace("/dashboard");
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !isAuthenticated || user?.role !== "superadmin") {
    return <FullPageSpinner label="Memuat..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">LF</span>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-800">LaundryFlow</h1>
                <p className="text-xs text-slate-400">Super Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{user?.nama}</span>
              <button
                onClick={() => {
                  localStorage.removeItem("laundryflow_session");
                  document.cookie = "laundryflow_authed=; path=/; max-age=0";
                  router.replace("/login");
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 shrink-0">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    <item.icon active={active} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

// ---- Icons ----
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5M5 10v10h5v-6h4v6h5V10" />
    </svg>
  );
}
function TenantIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" className={active ? "fill-brand-100" : ""} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" className={active ? "fill-brand-100" : ""} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" className={active ? "fill-brand-100" : ""} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" className={active ? "fill-brand-100" : ""} />
    </svg>
  );
}
function SubscriptionIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="5" width="20" height="14" rx="2" className={active ? "fill-brand-100" : ""} />
      <path strokeLinecap="round" d="M2 10h20" />
    </svg>
  );
}
function RevenueIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 16V9m5 7V5m5 11v-6" />
    </svg>
  );
}
function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" className={active ? "fill-brand-100" : ""} />
      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
