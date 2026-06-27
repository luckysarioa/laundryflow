"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

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
        const payload: any = { nama: form.nama, email: form.email };
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
    } catch (e: any) {
      setToast({ type: "error", msg: e.message || "Gagal menyimpan." });
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
    } catch (e: any) {
      setToast({ type: "error", msg: e.message || "Gagal menghapus." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Superadmin Users</h2>
          <p className="text-sm text-slate-500">Kelola akun superadmin</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition">
          + Tambah User
        </button>
      </div>

      {toast && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${toast.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {toast.msg}
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">{editingUser ? "Edit User" : "Tambah User Baru"}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
              <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password {editingUser && "(kosongkan jika tidak diubah)"}</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password</label>
              <input type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                Batal
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card padding="md">
        {loading ? (
          <div className="flex justify-center py-8"><Spinner size={24} /></div>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Belum ada superadmin.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Nama</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Dibuat</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">{u.nama}</td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(u.created_at).toLocaleDateString("id-ID")}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => openEdit(u)} className="text-brand-600 hover:text-brand-700 text-xs font-medium mr-3">Edit</button>
                      <button onClick={() => handleDelete(u)} className="text-red-600 hover:text-red-700 text-xs font-medium">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
