"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";

// ==========================================================
// Providers — membungkus seluruh app dengan context providers
// (Auth + Toast). Dipakai di root layout.
// ==========================================================

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
