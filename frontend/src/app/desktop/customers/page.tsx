"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { toWaNumber } from "@/lib/format";

export default function DesktopCustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!customers) return [];
    const query = q.toLowerCase();
    return customers.filter(
      (c) => c.nama.toLowerCase().includes(query) || c.no_hp.includes(query),
    );
  }, [customers, q]);

  async function handleDelete(c: Customer) {
    if (!confirm(`Hapus pelanggan "${c.nama}"?`)) return;
    try {
      await api.deleteCustomer(c.id);
      setCustomers((prev) => prev ? prev.filter((x) => x.id !== c.id) : null);
      toast.success(`Pelanggan "${c.nama}" dihapus.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus pelanggan.");
    }
  }

  function handleEdit(c: Customer) {
    setEditing(c);
    setShowModal(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pelanggan</h1>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} pelanggan terdaftar</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Tambah Pelanggan
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Cari nama / no. HP..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-slate-500">Tidak ada pelanggan ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Pelanggan</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">No. HP</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Alamat</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm shrink-0">
                          {c.nama.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{c.nama}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.no_hp}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{c.alamat || "-"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(c)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path strokeLinecap="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition"
                          title="Hapus"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                        <a
                          href={`https://wa.me/${toWaNumber(c.no_hp)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                          title="WhatsApp"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.748-.999z" />
                          </svg>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simple Modal */}
      {showModal && (
        <CustomerModal
          editing={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={(c) => {
            if (editing) {
              setCustomers((prev) => prev ? prev.map((x) => (x.id === c.id ? c : x)) : [c]);
              toast.success(`Pelanggan "${c.nama}" diperbarui.`);
            } else {
              setCustomers((prev) => prev ? [c, ...prev] : [c]);
              toast.success(`Pelanggan "${c.nama}" ditambahkan.`);
            }
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function CustomerModal({ editing, onClose, onSaved }: { editing: Customer | null; onClose: () => void; onSaved: (c: Customer) => void }) {
  const [nama, setNama] = useState(editing?.nama ?? "");
  const [no_hp, setNoHp] = useState(editing?.no_hp ?? "");
  const [alamat, setAlamat] = useState(editing?.alamat ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nama.trim()) return setError("Nama wajib diisi.");
    if (!no_hp.trim()) return setError("No. HP wajib diisi.");
    setLoading(true);
    try {
      if (editing) {
        const updated = await api.updateCustomer(editing.id, { nama: nama.trim(), no_hp: no_hp.trim(), alamat: alamat.trim() });
        onSaved(updated);
      } else {
        const created = await api.createCustomer({ nama: nama.trim(), no_hp: no_hp.trim(), alamat: alamat.trim() });
        onSaved(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{editing ? "Edit Pelanggan" : "Tambah Pelanggan"}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">No. HP</label>
            <input type="tel" value={no_hp} onChange={(e) => setNoHp(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat (opsional)</label>
            <input type="text" value={alamat} onChange={(e) => setAlamat(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition">{loading ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
