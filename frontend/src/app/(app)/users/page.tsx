"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { UserFull } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<UserFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setUsers(await api.getUsers()); }
    catch { toast.error("Gagal memuat data."); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(u: UserFull) {
    if (!confirm(`Hapus user "${u.nama}"?`)) return;
    try { await api.deleteUser(u.id); toast.success("Berhasil dihapus."); load(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Gagal."); }
  }

  return (
    <>
      <AppHeader title="Kelola User" subtitle={`${users.length} akun`} back
        action={<button onClick={() => setOpen(true)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg></button>} />

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} /></div> : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id} padding="sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">{u.nama.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{u.nama}</p>
                  <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={u.role === "superadmin" ? "amber" : u.role === "pemilik" ? "purple" : "blue"}>{u.role === "superadmin" ? "Super Admin" : u.role === "pemilik" ? "Pemilik" : "Kasir"}</Badge>
                  <button onClick={() => handleDelete(u)} className="h-7 w-7 flex items-center justify-center rounded text-red-400 hover:bg-red-50"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <UserModal open={open} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); load(); }} />
    </>
  );
}

function UserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("kasir");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.createUser({ nama: nama.trim(), email: email.trim(), password, role });
      toast.success("User berhasil ditambahkan.");
      onCreated();
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal."); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah User"
      footer={<><Button variant="outline" fullWidth onClick={onClose}>Batal</Button><Button type="submit" form="user-form" fullWidth loading={loading}>Simpan</Button></>}>
      <form onSubmit={handleSubmit} className="space-y-3" id="user-form">
        <Input label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} required />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="kasir">Kasir</option>
          <option value="pemilik">Pemilik</option>
        </Select>
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
