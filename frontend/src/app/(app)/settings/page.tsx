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
        </Card>

        {/* Info aplikasi */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Tentang Aplikasi</h3>
          <dl className="space-y-2 text-sm">
            <InfoRow label="Aplikasi" value="LaundryFlow" />
            <InfoRow label="Versi" value="1.0.0 (MVP)" />
            <InfoRow
              label="Mode Data"
              value={process.env.NEXT_PUBLIC_USE_MOCK === "false" ? "Backend Laravel" : "Mock (demo)"}
            />
            <InfoRow label="Tipe" value="PWA (Progressive Web App)" />
          </dl>
        </Card>

        {/* Bantuan */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Status Cucian</h3>
          <p className="text-xs text-slate-500 mb-3">Alur 5 tahap sesuai standar operasional:</p>
          <div className="flex flex-wrap gap-2">
            {["Antrian", "Cuci", "Setrika", "Siap", "Diambil"].map((s, i) => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                <span className="text-slate-400">{i + 1}.</span> {s}
              </span>
            ))}
          </div>
        </Card>

        <Button variant="danger" size="lg" fullWidth onClick={handleLogout}>
          Keluar
        </Button>
      </div>
    </>
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
