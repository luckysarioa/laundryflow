"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import type { AuthSession, User } from "@/lib/types";
import { api } from "@/lib/api";
import { AUTH_STORAGE_KEY, ADMIN_BACKUP_KEY } from "@/lib/constants";

// ==========================================================
// AuthContext — menyimpan session (token + user) di React state
// dan mempersistensinya ke localStorage agar login bertahan setelah refresh.
//
// Catatan: proteksi route juga diperkuat di sisi server via middleware.ts.
//
// Mendukung IMPERSONATION: superadmin bisa "login sebagai tenant" dengan
// menyimpan session superadmin asli ke ADMIN_BACKUP_KEY, lalu menggantinya
// dengan session tenant. restoreAdmin() membalik proses tersebut.
// ==========================================================

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean; // true saat sedang init dari storage / login
  isAuthenticated: boolean;
  isImpersonating: boolean; // true saat sedang login sebagai tenant (bukan diri sendiri)
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  impersonate: (session: AuthSession) => void;
  restoreAdmin: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inisialisasi dari storage saat mount.
  useEffect(() => {
    setSession(readSession());
    setIsImpersonating(
      typeof window !== "undefined" && !!localStorage.getItem(ADMIN_BACKUP_KEY),
    );
    setLoading(false);
  }, []);

  const persist = useCallback((next: AuthSession | null) => {
    setSession(next);
    if (next) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      // Cookie flag ringan untuk middleware (sisi server). Token Sanctum
      // tetap dibawa via header Authorization saat request ke API backend.
      document.cookie = "laundryflow_authed=1; path=/; max-age=2592000; SameSite=Lax";
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      document.cookie = "laundryflow_authed=; path=/; max-age=0";
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.login(email, password);
      persist(result);
    },
    [persist],
  );

  const logout = useCallback(() => {
    // Saat logout saat impersonasi, hapus juga backup admin agar tidak bocor.
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_BACKUP_KEY);
    }
    setIsImpersonating(false);
    persist(null);
  }, [persist]);

  // Impersonate: simpan session superadmin saat ini, lalu ganti dengan session tenant.
  const impersonate = useCallback(
    (tenantSession: AuthSession) => {
      if (typeof window === "undefined") return;
      const current = readSession();
      if (current && current.user?.role === "superadmin") {
        localStorage.setItem(ADMIN_BACKUP_KEY, JSON.stringify(current));
      }
      persist(tenantSession);
      setIsImpersonating(true);
    },
    [persist],
  );

  // Kembali ke session superadmin, hapus backup.
  const restoreAdmin = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(ADMIN_BACKUP_KEY);
      if (raw) {
        persist(JSON.parse(raw) as AuthSession);
      }
    } catch {
      // backup rusak — biarkan session saat ini.
    } finally {
      localStorage.removeItem(ADMIN_BACKUP_KEY);
      setIsImpersonating(false);
    }
  }, [persist]);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    token: session?.token ?? null,
    loading,
    isAuthenticated: !!session,
    isImpersonating,
    login,
    logout,
    impersonate,
    restoreAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
