"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ROLES } from "@/lib/constants";

// ==========================================================
// Pengaturan / Akun — info pengguna & keluar.
// ==========================================================

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const toast = useToast();
  const isPemilik = user?.role === "pemilik";

  function handleLogout() {
    logout();
    toast.info("Anda telah keluar.");
    router.replace("/login");
  }

  return (
    <>
      <AppHeader title="Pengaturan" subtitle="Akun & aplikasi" />

      <div className="space-y-4">
        {/* Profil */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white flex items-center justify-center text-xl font-semibold">
              {user?.nama?.charAt(0) ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-800 truncate">{user?.nama}</p>
              <p className="text-sm text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={user?.role === "pemilik" ? "purple" : "blue"}>
              {user ? ROLES[user.role] : "-"}
            </Badge>
          </div>
          <div className="mt-3">
            <Button variant="outline" size="sm" fullWidth onClick={() => router.push("/profile")}>
              Edit Profil & Password
            </Button>
          </div>
        </Card>

        {/* Menu */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Menu</h3>

          <MenuItem
            icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
            label="Notifikasi" onClick={() => router.push("/notifications")}
          />

          {isPemilik && (
            <>
              <MenuItem
                icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                label="Subscription" onClick={() => router.push("/subscription")}
              />
              <MenuItem
                icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                label="Layanan" onClick={() => router.push("/services")}
              />
              <MenuItem
                icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                label="Kelola User" onClick={() => router.push("/users")}
              />
              <MenuItem
                icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                label="Kelola Cabang" onClick={() => router.push("/outlets")}
              />
              <MenuItem
                icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
                label="Riwayat Aktivitas" onClick={() => router.push("/activity-logs")}
              />
            </>
          )}

          <MenuItem
            icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            label="Cek Order (Publik)" onClick={() => window.open("/tracking", "_blank")}
          />
        </Card>

        {/* Info aplikasi */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Tentang Aplikasi</h3>
          <dl className="space-y-2 text-sm">
            <InfoRow label="Aplikasi" value="LaundryFlow" />
            <InfoRow label="Versi" value="1.0.0 (MVP)" />
            <InfoRow label="Mode Data" value={process.env.NEXT_PUBLIC_USE_MOCK === "false" ? "Backend Laravel" : "Mock (demo)"} />
            <InfoRow label="Tipe" value="PWA (Progressive Web App)" />
          </dl>
        </Card>

        <Button variant="danger" size="lg" fullWidth onClick={handleLogout}>
          Keluar
        </Button>
      </div>
    </>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">{icon}</div>
        <span className="text-sm font-medium text-slate-800">{label}</span>
      </div>
      <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M9 5l7 7-7 7" /></svg>
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-700 font-medium">{value}</dd>
    </div>
  );
}
