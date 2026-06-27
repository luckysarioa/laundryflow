"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/lib/constants";

// ==========================================================
// BottomNav — navigasi bawah ala mobile app.
// Slot: [Beranda] [Order] [+ Tambah] [Status] [Akun/Laporan]
// Slot ke-5: "Laporan" untuk pemilik, "Akun" untuk kasir.
// ==========================================================

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isPemilik = user?.role === "pemilik" || user?.role === "superadmin";

  const trailing = isPemilik
    ? { href: "/reports", label: "Laporan", Icon: ChartIcon }
    : { href: "/settings", label: "Akun", Icon: UserIcon };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 pb-safe">
      <div className="mx-auto max-w-md grid grid-cols-5 h-16">
        <Slot href="/dashboard" label="Beranda" pathname={pathname} Icon={HomeIcon} />
        <Slot href="/orders" label="Order" pathname={pathname} Icon={OrderIcon} />

        {/* Tombol tambah (FAB di tengah) */}
        <div className="flex items-center justify-center">
          <Link
            href="/orders/new"
            className="h-12 w-12 -mt-6 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/40 ring-4 ring-white hover:bg-brand-700 active:bg-brand-800 transition"
            aria-label="Tambah Order"
          >
            <PlusIcon />
          </Link>
        </div>

        <Slot href="/status" label="Status" pathname={pathname} Icon={BoardIcon} />
        <Slot href={trailing.href} label={trailing.label} pathname={pathname} Icon={trailing.Icon} />
      </div>
      <p className="sr-only">
        Sesi: {user?.nama ?? "Tamu"} ({user ? ROLES[user.role] : "-"})
      </p>
    </nav>
  );
}

function Slot({
  href,
  label,
  pathname,
  Icon,
}: {
  href: string;
  label: string;
  pathname: string;
  Icon: (p: { active: boolean }) => React.ReactNode;
}) {
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition"
    >
      <span className={active ? "text-brand-600" : "text-slate-400"}>
        <Icon active={active} />
      </span>
      <span className={active ? "text-brand-600" : "text-slate-400"}>{label}</span>
    </Link>
  );
}

/* ---- Ikon (inline SVG) ---- */

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5M5 10v10h5v-6h4v6h5V10" />
    </svg>
  );
}
function OrderIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="3" width="14" height="18" rx="2" className={active ? "fill-brand-100" : ""} />
      <path strokeLinecap="round" d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}
function BoardIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="5" height="14" rx="1.5" className={active ? "fill-brand-100" : ""} />
      <rect x="9.5" y="5" width="5" height="10" rx="1.5" className={active ? "fill-brand-100" : ""} />
      <rect x="16" y="5" width="5" height="7" rx="1.5" className={active ? "fill-brand-100" : ""} />
    </svg>
  );
}
function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 16V9m5 7V5m5 11v-6" />
    </svg>
  );
}
function UserIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" className={active ? "fill-brand-100" : ""} />
      <path strokeLinecap="round" d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </svg>
  );
}
