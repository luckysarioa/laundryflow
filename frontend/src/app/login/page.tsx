"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// ==========================================================
// Halaman Login.
// Akun demo:
//   Pemilik: pemilik@laundryflow.id
//   Kasir  : kasir@laundryflow.id
//   Sandi  : laundry123   (untuk semua akun demo)
// ==========================================================

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-50 to-white">
      <div className="animate-pulse text-brand-500 text-sm">Memuat LaundryFlow...</div>
    </main>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Berhasil masuk!");
      const next = searchParams.get("next") ?? "/dashboard";
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  }

  function isiDemo(role: "pemilik" | "kasir") {
    setEmail(role === "pemilik" ? "pemilik@laundryflow.id" : "kasir@laundryflow.id");
    setPassword("laundry123");
    setError("");
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50 to-white">
      {/* Brand header */}
      <div className="flex-1 flex flex-col justify-center px-6 pt-16 pb-8">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-4">
              <LogoIcon className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">LaundryFlow</h1>
            <p className="text-sm text-slate-500 mt-1">Masuk untuk mengelola laundry Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nama@laundryflow.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Kata Sandi"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" fullWidth loading={loading}>
              Masuk
            </Button>
          </form>

          {/* Akun demo */}
          <div className="mt-5 rounded-2xl bg-brand-50/70 border border-brand-100 p-4">
            <p className="text-xs font-semibold text-brand-800 mb-2">Akun Demo</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => isiDemo("pemilik")}
                className="rounded-xl bg-white border border-brand-200 px-3 py-2.5 text-left hover:border-brand-400 transition"
              >
                <p className="text-xs font-semibold text-slate-700">Pemilik</p>
                <p className="text-[10px] text-slate-400 truncate">pemilik@laundryflow.id</p>
              </button>
              <button
                type="button"
                onClick={() => isiDemo("kasir")}
                className="rounded-xl bg-white border border-brand-200 px-3 py-2.5 text-left hover:border-brand-400 transition"
              >
                <p className="text-xs font-semibold text-slate-700">Kasir</p>
                <p className="text-[10px] text-slate-400 truncate">kasir@laundryflow.id</p>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">Sandi semua akun: laundry123</p>
          </div>
        </div>
      </div>

      <footer className="px-6 py-4 text-center text-[11px] text-slate-400">
        LaundryFlow • Sistem Manajemen Laundry UMKM
      </footer>
    </main>
  );
}

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.5c0 0 6 7 6 12a6 6 0 01-12 0c0-5 6-12 6-12z"
        fill="currentColor"
        opacity="0.95"
      />
    </svg>
  );
}
