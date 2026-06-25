"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { toWaNumber } from "@/lib/format";

// ==========================================================
// Daftar Pelanggan + tambah pelanggan baru (modal).
// Sesuai PRD poin 4 (CRUD Customer).
// ==========================================================

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const data = await api.getCustomers();
    setCustomers(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!customers) return [];
    const query = q.toLowerCase();
    return customers.filter(
      (c) => c.nama.toLowerCase().includes(query) || c.no_hp.includes(query),
    );
  }, [customers, q]);

  async function handleCreated(c: Customer) {
    setCustomers((prev) => (prev ? [c, ...prev] : [c]));
    setOpen(false);
    toast.success(`Pelanggan "${c.nama}" ditambahkan.`);
  }

  return (
    <>
      <AppHeader
        title="Pelanggan"
        subtitle={`${customers?.length ?? 0} terdaftar`}
        action={
          <button
            onClick={() => setOpen(true)}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
            aria-label="Tambah Pelanggan"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
        }
      />

      <div className="space-y-3">
        <Input name="q" placeholder="Cari nama / no. HP..." value={q} onChange={(e) => setQ(e.target.value)} prefix="🔍" />

        {!customers ? (
          <div className="flex justify-center py-12"><Spinner size={26} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Tidak ada pelanggan"
            description={q ? "Tidak ada hasil pencarian." : "Tambahkan pelanggan pertama Anda."}
            action={!q && <Button size="sm" onClick={() => setOpen(true)}>+ Tambah Pelanggan</Button>}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <Card key={c.id} padding="sm" className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">
                  {c.nama.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.nama}</p>
                  <p className="text-[11px] text-slate-400 truncate">{c.no_hp}</p>
                </div>
                <a
                  href={`https://wa.me/${toWaNumber(c.no_hp)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50"
                  aria-label={`Chat WhatsApp ${c.nama}`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.748-.999z" />
                  </svg>
                </a>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddCustomerModal open={open} onClose={() => setOpen(false)} onCreated={handleCreated} />
    </>
  );
}

function AddCustomerModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (c: Customer) => void;
}) {
  const [nama, setNama] = useState("");
  const [no_hp, setNoHp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setNama("");
    setNoHp("");
    setAlamat("");
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!nama.trim()) return setError("Nama wajib diisi.");
    if (!no_hp.trim()) return setError("No. HP wajib diisi.");
    setLoading(true);
    try {
      const created = await api.createCustomer({
        nama: nama.trim(),
        no_hp: no_hp.trim(),
        alamat: alamat.trim(),
      });
      onCreated(created);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah pelanggan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Tambah Pelanggan"
      footer={
        <>
          <Button variant="outline" fullWidth onClick={() => {
            reset();
            onClose();
          }}>
            Batal
          </Button>
          <Button type="submit" form="customer-form" fullWidth loading={loading}>
            Simpan
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3" id="customer-form">
        <Input label="Nama" name="nama" placeholder="Nama pelanggan" value={nama} onChange={(e) => setNama(e.target.value)} required />
        <Input label="No. HP / WhatsApp" name="no_hp" type="tel" placeholder="08xxxxxxxxxx" value={no_hp} onChange={(e) => setNoHp(e.target.value)} required />
        <Input label="Alamat (opsional)" name="alamat" placeholder="Alamat" value={alamat} onChange={(e) => setAlamat(e.target.value)} />
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>
        )}
      </form>
    </Modal>
  );
}
