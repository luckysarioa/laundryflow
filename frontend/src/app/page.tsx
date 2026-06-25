"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FullPageSpinner } from "@/components/ui/Spinner";

// ==========================================================
// Root page — mengarahkan ke /dashboard jika sudah login,
// atau /login jika belum. Cek dilakukan client-side.
// ==========================================================

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [isAuthenticated, loading, router]);

  return <FullPageSpinner label="Memuat LaundryFlow..." />;
}
