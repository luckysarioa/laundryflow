"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Expense } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/format";

const KATEGORI = ["Sabun", "Listrik", "Sewa", "Gaji", "Perlengkapan", "Lainnya"];

export default function DesktopExpensesPage() {
  const toast = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [kategori, setKategori] = useState("");
  const [totalNominal, setTotalNominal] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getExpenses(kategori ? { kategori } : undefined);
      setExpenses(data);
      setTotalNominal(data.reduce((s, e) => s + e.nominal, 0));
    } catch { toast.error("Gagal memuat data."); }
    finally { setLoading(false); }
  }, [kategori, toast]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(e: Expense) {
    if (!confirm(`Hapus "${e.deskripsi}"?`)) return;
    try { await api.deleteExpense(e.id); toast.success("Berhasil dihapus."); load(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Gagal."); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pengeluaran</h1>
          <p className="text-sm text-slate-500 mt-1">{expenses.length} transaksi</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Tambah Pengeluaran
        </button>
      </div>

      {/* Filter + Total */}
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1">
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Semua Kategori</option>
            {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="col-span-3 bg-red-50 border border-red-100 rounded-xl px-5 py-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">Total Pengeluaran</span>
          <span className="text-xl font-bold text-red-600">{formatRupiah(totalNominal)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-500">Belum ada pengeluaran.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Deskripsi</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Kategori</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Nominal</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-800">{e.deskripsi}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{e.kategori}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{e.tanggal}</td>
                    <td className="py-3 px-4 text-right font-semibold text-red-600">-{formatRupiah(e.nominal)}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleDelete(e)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
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
        <ExpenseModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}

function ExpenseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [kategori, setKategori] = useState("Sabun");
  const [deskripsi, setDeskripsi] = useState("");
  const [nominal, setNominal] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const nom = parseInt(nominal) || 0;
    if (nom <= 0) return setError("Nominal harus lebih dari 0.");
    setLoading(true);
    try {
      await api.createExpense({ kategori, deskripsi: deskripsi.trim(), nominal: nom, tanggal });
      toast.success("Pengeluaran ditambahkan.");
      onCreated();
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Tambah Pengeluaran</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
            <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
            <input type="text" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
            <input type="number" value={nominal} onChange={(e) => setNominal(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
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
