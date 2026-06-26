"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Outlet } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

export default function OutletsPage() {
  const toast = useToast();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setOutlets(await api.getOutlets()); }
    catch { toast.error("Gagal memuat data."); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(o: Outlet) {
    if (!confirm(`Hapus cabang "${o.name}"?`)) return;
    try { await api.deleteOutlet(o.id); toast.success("Berhasil dihapus."); load(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Gagal."); }
  }

  return (
    <>
      <AppHeader title="Kelola Cabang" subtitle={`${outlets.length} cabang`} back
        action={<button onClick={() => setOpen(true)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg></button>} />

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} /></div> : outlets.length === 0 ? (
        <Card><p className="text-sm text-slate-500 text-center py-8">Belum ada cabang.</p></Card>
      ) : (
        <div className="space-y-2">
          {outlets.map((o) => (
            <Card key={o.id} padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{o.name}</p>
                  {o.address && <p className="text-[11px] text-slate-400">{o.address}</p>}
                  {o.phone && <p className="text-[11px] text-slate-400">{o.phone}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${o.is_active ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                  <button onClick={() => handleDelete(o)} className="h-7 w-7 flex items-center justify-center rounded text-red-400 hover:bg-red-50"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <OutletModal open={open} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); load(); }} />
    </>
  );
}

function OutletModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.createOutlet({ name: name.trim(), address: address.trim() || undefined, phone: phone.trim() || undefined });
      toast.success("Cabang berhasil ditambahkan.");
      onCreated();
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal."); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Cabang"
      footer={<><Button variant="outline" fullWidth onClick={onClose}>Batal</Button><Button type="submit" form="outlet-form" fullWidth loading={loading}>Simpan</Button></>}>
      <form onSubmit={handleSubmit} className="space-y-3" id="outlet-form">
        <Input label="Nama Cabang" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Alamat (opsional)" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input label="Telepon (opsional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
