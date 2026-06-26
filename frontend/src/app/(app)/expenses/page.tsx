"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Expense } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/format";

const KATEGORI = ["Sabun", "Listrik", "Sewa", "Gaji", "Perlengkapan", "Lainnya"];

export default function ExpensesPage() {
  const toast = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [kategori, setKategori] = useState("");
  const [totalNominal, setTotalNominal] = useState(0);

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
    <>
      <AppHeader title="Pengeluaran" subtitle={`${expenses.length} transaksi`}
        action={<button onClick={() => setOpen(true)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg></button>} />

      <div className="space-y-3">
        <Select value={kategori} onChange={(e) => setKategori(e.target.value)}>
          <option value="">Semua Kategori</option>
          {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
        </Select>

        <Card className="bg-red-50/60 border-red-100">
          <p className="text-xs text-slate-500">Total Pengeluaran</p>
          <p className="text-xl font-bold text-red-600">{formatRupiah(totalNominal)}</p>
        </Card>

        {loading ? <div className="flex justify-center py-8"><Spinner size={24} /></div> : expenses.length === 0 ? (
          <Card><p className="text-sm text-slate-500 text-center py-6">Belum ada pengeluaran.</p></Card>
        ) : (
          <div className="space-y-2">
            {expenses.map((e) => (
              <Card key={e.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{e.deskripsi}</p>
                    <p className="text-[11px] text-slate-400">{e.kategori} • {e.tanggal}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-red-600">-{formatRupiah(e.nominal)}</span>
                    <button onClick={() => handleDelete(e)} className="h-7 w-7 flex items-center justify-center rounded text-red-400 hover:bg-red-50"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ExpenseModal open={open} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); load(); }} />
    </>
  );
}

function ExpenseModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
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
    <Modal open={open} onClose={onClose} title="Tambah Pengeluaran"
      footer={<><Button variant="outline" fullWidth onClick={onClose}>Batal</Button><Button type="submit" form="expense-form" fullWidth loading={loading}>Simpan</Button></>}>
      <form onSubmit={handleSubmit} className="space-y-3" id="expense-form">
        <Select label="Kategori" value={kategori} onChange={(e) => setKategori(e.target.value)}>
          {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
        </Select>
        <Input label="Deskripsi" placeholder="Deskripsi pengeluaran" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} required />
        <Input label="Nominal (Rp)" type="number" inputMode="numeric" placeholder="mis. 150000" value={nominal} onChange={(e) => setNominal(e.target.value)} required />
        <Input label="Tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
