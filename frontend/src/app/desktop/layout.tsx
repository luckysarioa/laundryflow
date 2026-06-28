"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FullPageSpinner } from "@/components/ui/Spinner";

// ==========================================================
// Desktop layout — full-width sidebar layout untuk superadmin
// mengelola tenant view dari browser desktop.
// ==========================================================

const NAV_SECTIONS = [
  {
    label: "Utama",
    items: [
      { href: "/desktop/dashboard", label: "Dashboard", icon: "home" },
      { href: "/desktop/orders", label: "Orders", icon: "order" },
      { href: "/desktop/customers", label: "Pelanggan", icon: "customer" },
      { href: "/desktop/status", label: "Status Board", icon: "board" },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { href: "/desktop/reports", label: "Laporan", icon: "chart" },
      { href: "/desktop/expenses", label: "Pengeluaran", icon: "wallet" },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { href: "/desktop/services", label: "Layanan", icon: "service" },
      { href: "/desktop/notifications", label: "Notifikasi", icon: "bell" },
      { href: "/desktop/settings", label: "Settings", icon: "settings" },
    ],
  },
];

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated, isImpersonating, restoreAdmin } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace("/login?next=/desktop/dashboard");
      } else if (user?.role === "superadmin" && !isImpersonating) {
        // Superadmin asli (bukan sedang impersonate) tidak boleh lihat panel tenant.
        router.replace("/superadmin");
      } else if (user?.role !== "pemilik" && user?.role !== "kasir") {
        router.replace("/dashboard");
      }
    }
  }, [loading, isAuthenticated, user, isImpersonating, router]);

  function handleReturnToAdmin() {
    restoreAdmin();
    router.push("/superadmin");
  }

  if (loading || !isAuthenticated || (user?.role !== "pemilik" && user?.role !== "kasir")) {
    return <FullPageSpinner label="Memuat..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full">
        {/* Brand */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-200">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">LF</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">LaundryFlow</p>
            <p className="text-[11px] text-slate-400">Tenant Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        active
                          ? "bg-brand-50 text-brand-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <NavIcon name={item.icon} active={active} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
              {user?.nama?.charAt(0) ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.nama}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        {isImpersonating && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-800">
              Anda sedang login sebagai tenant <span className="font-semibold">{user?.nama}</span> (mode impersonasi).
            </p>
            <button
              onClick={handleReturnToAdmin}
              className="shrink-0 text-sm font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2"
            >
              ← Kembali ke Panel Admin
            </button>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

// ---- Nav Icons ----
function NavIcon({ name, active }: { name: string; active: boolean }) {
  const cls = "h-5 w-5";
  const fill = active ? "fill-brand-100" : "";

  switch (name) {
    case "home":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5M5 10v10h5v-6h4v6h5V10" />
        </svg>
      );
    case "order":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="5" y="3" width="14" height="18" rx="2" className={fill} />
          <path strokeLinecap="round" d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case "customer":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" className={fill} />
          <path strokeLinecap="round" d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "board":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="5" height="14" rx="1.5" className={fill} />
          <rect x="9.5" y="5" width="5" height="10" rx="1.5" className={fill} />
          <rect x="16" y="5" width="5" height="7" rx="1.5" className={fill} />
        </svg>
      );
    case "chart":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 16V9m5 7V5m5 11v-6" />
        </svg>
      );
    case "wallet":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "service":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case "bell":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    case "settings":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" className={fill} />
          <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      );
    default:
      return null;
  }
}
