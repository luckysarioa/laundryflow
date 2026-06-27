"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [nama, setNama] = useState(user?.nama ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [loading, setLoading] = useState(false);

  // Password change
  const [showPassword, setShowPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  async function handleProfile(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile({ nama: nama.trim(), email: email.trim() });
      toast.success("Profil berhasil diperbarui.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal."); }
    finally { setLoading(false); }
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) return toast.error("Konfirmasi password tidak cocok.");
    setPwLoading(true);
    try {
      await api.changePassword({ current_password: currentPw, password: newPw, password_confirmation: confirmPw });
      toast.success("Password berhasil diubah.");
      setCurrentPw(""); setNewPw(""); setConfirmPw(""); setShowPassword(false);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal."); }
    finally { setPwLoading(false); }
  }

  return (
    <>
      <AppHeader title="Edit Profil" subtitle="Ubah data akun" back />

      <div className="space-y-4">
        <form onSubmit={handleProfile}>
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Informasi Akun</h3>
            <div className="space-y-3">
              <Input label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} required />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className={`h-2 w-2 rounded-full ${user?.role === "superadmin" ? "bg-amber-500" : user?.role === "pemilik" ? "bg-purple-500" : "bg-blue-500"}`}></span>
                {user?.role === "superadmin" ? "Super Admin" : user?.role === "pemilik" ? "Pemilik" : "Kasir"}
              </div>
            </div>
            <div className="mt-4"><Button type="submit" fullWidth loading={loading}>Simpan Profil</Button></div>
          </Card>
        </form>

        <form onSubmit={handlePassword}>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">Ganti Password</h3>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-brand-600 hover:underline">
                {showPassword ? "Sembunyikan" : "Ubah"}
              </button>
            </div>
            {showPassword && (
              <div className="space-y-3">
                <Input label="Password Saat Ini" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
                <Input label="Password Baru" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} />
                <Input label="Konfirmasi Password Baru" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
                <Button type="submit" fullWidth loading={pwLoading}>Ganti Password</Button>
              </div>
            )}
          </Card>
        </form>
      </div>
    </>
  );
}
