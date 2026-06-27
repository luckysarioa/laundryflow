"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";

// ==========================================================
// Superadmin Users — kelola akun superadmin.
// ==========================================================

interface SAUser {
  id: number;
  nama: string;
  email: string;
  role: string;
  created_at: string;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<SAUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<SAUser | null>(null);
  const [form, setForm] = useState({ nama: "", email: "", password: "", password_confirmation: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const loadUsers = () => {
    setLoading(true);
    api.getSuperAdminUsers()
      .then(setUsers)
      .catch(() => setToast({ type: "error", msg: "Gagal memuat data." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ nama: "", email: "", password: "", password_confirmation: "" });
    setShowForm(true);
  };

  const openEdit = (u: SAUser) => {
    setEditingUser(u);
    setForm({ nama: u.nama, email: u.email, password: "", password_confirmation: "" });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setToast(null);
    try {
      if (editingUser) {
        const payload: Record<string, string> = { nama: form.nama, email: form.email };
        if (form.password) {
          payload.password = form.password;
          payload.password_confirmation = form.password_confirmation;
        }
        await api.updateSuperAdminUser(editingUser.id, payload);
        setToast({ type: "success", msg: "User berhasil diupdate." });
      } else {
        await api.createSuperAdminUser(form);
        setToast({ type: "success", msg: "User berhasil dibuat." });
      }
      setShowForm(false);
      loadUsers();
    } catch (e) {
      setToast({ type: "error", msg: e instanceof Error ? e.message : "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: SAUser) => {
    if (!confirm(`Hapus akun ${u.nama}?`)) return;
    setToast(null);
    try {
      await api.deleteSuperAdminUser(u.id);
      setToast({ type: "success", msg: "User berhasil dihapus." });
      loadUsers();
    } catch (e) {
      setToast({ type: "error", msg: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Superadmin Users"
        subtitle="Kelola akun superadmin"
        action={<Button onClick={openCreate}>+ Tambah User</Button>}
      />

      {toast && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {toast.msg}
        </div>
      )}

      {showForm && (
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">{editingUser ? "Edit User" : "Tambah User Baru"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nama" type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label={editingUser ? "Password (kosongkan jika tidak diubah)" : "Password"} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Input label="Konfirmasi Password" type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-5">
            <Button onClick={handleSubmit} loading={saving}>Simpan</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : users.length === 0 ? (
        <EmptyState title="Belum ada superadmin" description="Tambahkan akun superadmin pertama." />
      ) : (
        <DataTable>
          <DataTable.Head>
            <DataTable.Th>Nama</DataTable.Th>
            <DataTable.Th>Email</DataTable.Th>
            <DataTable.Th>Dibuat</DataTable.Th>
            <DataTable.Th align="right">Aksi</DataTable.Th>
          </DataTable.Head>
          <DataTable.Body>
            {users.map((u) => (
              <DataTable.Tr key={u.id}>
                <DataTable.Td><span className="font-medium text-slate-800">{u.nama}</span></DataTable.Td>
                <DataTable.Td><span className="text-slate-600">{u.email}</span></DataTable.Td>
                <DataTable.Td><span className="text-slate-500">{new Date(u.created_at).toLocaleDateString("id-ID")}</span></DataTable.Td>
                <DataTable.Td align="right">
                  <button onClick={() => openEdit(u)} className="text-brand-600 hover:text-brand-700 text-xs font-medium mr-3">Edit</button>
                  <button onClick={() => handleDelete(u)} className="text-red-600 hover:text-red-700 text-xs font-medium">Hapus</button>
                </DataTable.Td>
              </DataTable.Tr>
            ))}
          </DataTable.Body>
        </DataTable>
      )}
    </div>
  );
}

