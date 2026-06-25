"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import type { AuthSession, User } from "@/lib/types";
import { api } from "@/lib/api";
import { AUTH_STORAGE_KEY } from "@/lib/constants";

// ==========================================================
// AuthContext — menyimpan session (token + user) di React state
// dan mempersistensinya ke localStorage agar login bertahan setelah refresh.
//
// Catatan: proteksi route juga diperkuat di sisi server via middleware.ts.
// ==========================================================

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean; // true saat sedang init dari storage / login
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
  const [loading, setLoading] = useState(true);

  // Inisialisasi dari storage saat mount.
  useEffect(() => {
    setSession(readSession());
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
    persist(null);
  }, [persist]);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    token: session?.token ?? null,
    loading,
    isAuthenticated: !!session,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
