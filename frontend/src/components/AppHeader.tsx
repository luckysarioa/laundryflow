"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { ROLES } from "@/lib/constants";

// ==========================================================
// AppHeader — header atas tiap halaman dalam grup (app).
// Menampilkan judul halaman, nama user, dan aksi logout.
// ==========================================================

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean; // tampilkan tombol kembali
  action?: ReactNode;
}

export function AppHeader({ title, subtitle, back, action }: AppHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const toast = useToast();

  function handleLogout() {
    logout();
    toast.info("Anda telah keluar.");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-md px-4 h-14 flex items-center gap-3">
        {back ? (
          <button
            onClick={() => router.back()}
            className="h-9 w-9 -ml-1 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Kembali"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <Link href="/dashboard" className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M12 2.5c0 0 6 7 6 12a6 6 0 01-12 0c0-5 6-12 6-12z" fill="currentColor" opacity="0.95" />
            </svg>
          </Link>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-slate-800 truncate leading-tight">{title}</h1>
          {subtitle && <p className="text-[11px] text-slate-400 truncate leading-tight">{subtitle}</p>}
        </div>

        {action}

        <button
          onClick={handleLogout}
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-500"
          aria-label="Keluar"
          title={`${user?.nama ?? ""} (${user ? ROLES[user.role] : ""}) • Keluar`}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
