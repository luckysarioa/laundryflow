"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return <FullPageSpinner label="Memuat..." />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-md px-4 pb-24 pt-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
