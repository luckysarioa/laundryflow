"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { ROLES } from "@/lib/constants";

export default function DesktopSettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === "pemilik" || user?.role === "superadmin";

  function handleLogout() {
    logout();
    toast.info("Anda telah keluar.");
    router.replace("/login");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan</h1>
        <p className="text-sm text-slate-500 mt-1">Akun & aplikasi</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white flex items-center justify-center text-2xl font-semibold">
                {user?.nama?.charAt(0) ?? "?"}
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mt-4">{user?.nama}</h3>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                {user ? ROLES[user.role] : "-"}
              </span>
            </div>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => router.push("/profile")}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Edit Profil
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="col-span-2 space-y-6">
          {/* Menu Utama */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Menu Utama</h3>
            <div className="grid grid-cols-2 gap-3">
              <MenuCard
                icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
                label="Notifikasi"
                onClick={() => router.push("/notifications")}
              />
              <MenuCard
                icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                label="Cek Order (Publik)"
                onClick={() => window.open("/tracking", "_blank")}
              />
            </div>
          </div>

          {/* Admin Menu */}
          {isAdmin && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Admin</h3>
              <div className="grid grid-cols-3 gap-3">
                <MenuCard
                  icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                  label="Sistem"
                  onClick={() => router.push("/system-settings")}
                />
                <MenuCard
                  icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                  label="Subscription"
                  onClick={() => router.push("/subscription")}
                />
                <MenuCard
                  icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                  label="Plan"
                  onClick={() => router.push("/plans")}
                />
                <MenuCard
                  icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                  label="Layanan"
                  onClick={() => router.push("/services")}
                />
                <MenuCard
                  icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                  label="User"
                  onClick={() => router.push("/users")}
                />
                <MenuCard
                  icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                  label="Cabang"
                  onClick={() => router.push("/outlets")}
                />
                <MenuCard
                  icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
                  label="Aktivitas"
                  onClick={() => router.push("/activity-logs")}
                />
                <MenuCard
                  icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  label="Laba/Rugi"
                  onClick={() => router.push("/profit-loss")}
                />
                <MenuCard
                  icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                  label="Backup"
                  onClick={() => router.push("/backups")}
                />
              </div>
            </div>
          )}

          {/* About */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Tentang Aplikasi</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Aplikasi</dt><dd className="text-slate-700 font-medium">LaundryFlow</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Versi</dt><dd className="text-slate-700 font-medium">1.0.0 (MVP)</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Mode Data</dt><dd className="text-slate-700 font-medium">{process.env.NEXT_PUBLIC_USE_MOCK === "false" ? "Backend Laravel" : "Mock (demo)"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Tipe</dt><dd className="text-slate-700 font-medium">PWA</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuCard({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition text-left"
    >
      <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">{icon}</div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </button>
  );
}
