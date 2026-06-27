"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Service } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/format";

export default function DesktopServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const data = await api.getServices(); setServices(data); }
    catch { toast.error("Gagal memuat layanan."); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(s: Service) {
    if (!confirm(`Hapus layanan "${s.nama_layanan}"?`)) return;
    try {
      await api.deleteService(s.id);
      setServices((prev) => prev.filter((x) => x.id !== s.id));
      toast.success(`Layanan "${s.nama_layanan}" dihapus.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Layanan</h1>
          <p className="text-sm text-slate-500 mt-1">{services.length} layanan aktif</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Tambah Layanan
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : services.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-slate-500">Belum ada layanan.</p>
            <button onClick={() => { setEditing(null); setShowModal(true); }} className="mt-3 text-sm font-medium text-brand-600 hover:underline">+ Tambah Layanan</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Nama Layanan</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Harga / kg</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-800">{s.nama_layanan}</td>
                    <td className="py-3 px-4 text-right text-slate-700 font-medium">{formatRupiah(s.harga_per_kilo)}/kg</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditing(s); setShowModal(true); }} className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition" title="Edit">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path strokeLinecap="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(s)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition" title="Hapus">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ServiceModal
          editing={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={(s, isEdit) => {
            if (isEdit) {
              setServices((prev) => prev.map((x) => (x.id === s.id ? s : x)));
              toast.success(`Layanan "${s.nama_layanan}" diperbarui.`);
            } else {
              setServices((prev) => [...prev, s]);
              toast.success(`Layanan "${s.nama_layanan}" ditambahkan.`);
            }
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ServiceModal({ editing, onClose, onSaved }: { editing: Service | null; onClose: () => void; onSaved: (s: Service, isEdit: boolean) => void }) {
  const [nama, setNama] = useState(editing?.nama_layanan ?? "");
  const [harga, setHarga] = useState(editing ? String(editing.harga_per_kilo) : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!nama.trim()) return setError("Nama layanan wajib diisi.");
    const hargaNum = parseInt(harga) || 0;
    if (hargaNum <= 0) return setError("Harga harus lebih dari 0.");
    setLoading(true);
    try {
      if (editing) {
        const updated = await api.updateService(editing.id, { nama_layanan: nama.trim(), harga_per_kilo: hargaNum });
        onSaved(updated, true);
      } else {
        const created = await api.createService({ nama_layanan: nama.trim(), harga_per_kilo: hargaNum });
        onSaved(created, false);
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
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{editing ? "Edit Layanan" : "Tambah Layanan"}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Layanan</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Harga per kg (Rp)</label>
            <input type="number" value={harga} onChange={(e) => setHarga(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
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
