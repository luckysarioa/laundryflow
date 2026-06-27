"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { FullPageSpinner } from "@/components/ui/Spinner";

// ==========================================================
// Layout grup (app) — shell aplikasi setelah login.
// Melindungi semua route di grup ini (client-side guard):
// jika belum login, arahkan ke /login.
// Lapisan tambahan proteksi server ada di middleware.ts.
// ==========================================================

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === "superadmin") {
      const width = window.innerWidth;
      if (width > 768 && !window.location.pathname.startsWith("/desktop")) {
        router.replace("/desktop/dashboard");
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !isAuthenticated) {
    return <FullPageSpinner label="Memuat..." />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {user?.role === "superadmin" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <span className="text-xs text-amber-700 font-medium">Mode: Super Admin (Mobile)</span>
            <Link href="/desktop/dashboard" className="text-xs font-medium text-amber-700 hover:text-amber-800 underline">
              Desktop View
            </Link>
          </div>
        </div>
      )}
      <main className="flex-1 mx-auto w-full max-w-md px-4 pb-24 pt-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
