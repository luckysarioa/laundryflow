"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Service, ServiceInput } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/format";

// ==========================================================
// Manajemen Layanan — CRUD layanan laundry.
// ==========================================================

export default function ServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getServices();
      setServices(data);
    } catch {
      toast.error("Gagal memuat layanan.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  function handleEdit(service: Service) {
    setEditing(service);
    setOpen(true);
  }

  async function handleDelete(service: Service) {
    if (!confirm(`Hapus layanan "${service.nama_layanan}"?`)) return;
    try {
      await api.deleteService(service.id);
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      toast.success(`Layanan "${service.nama_layanan}" dihapus.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus layanan.");
    }
  }

  function handleSaved(service: Service, isEdit: boolean) {
    if (isEdit) {
      setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)));
      toast.success(`Layanan "${service.nama_layanan}" diperbarui.`);
    } else {
      setServices((prev) => [...prev, service]);
      toast.success(`Layanan "${service.nama_layanan}" ditambahkan.`);
    }
    setOpen(false);
    setEditing(null);
  }

  return (
    <>
      <AppHeader
        title="Layanan"
        subtitle={`${services.length} aktif`}
        action={
          <button
            onClick={() => { setEditing(null); setOpen(true); }}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
            aria-label="Tambah Layanan"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
        }
      />

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={26} /></div>
        ) : services.length === 0 ? (
          <EmptyState
            title="Tidak ada layanan"
            description="Tambahkan layanan pertama Anda."
            action={<Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>+ Tambah Layanan</Button>}
          />
        ) : (
          <div className="space-y-2">
            {services.map((s) => (
              <Card key={s.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{s.nama_layanan}</p>
                    <p className="text-xs text-slate-500">{formatRupiah(s.harga_per_kilo)}/kg</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(s)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                      aria-label="Edit"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path strokeLinecap="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                      aria-label="Hapus"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ServiceModal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSaved={handleSaved}
        editing={editing}
      />
    </>
  );
}

function ServiceModal({
  open,
  onClose,
  onSaved,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (service: Service, isEdit: boolean) => void;
  editing: Service | null;
}) {
  const [nama, setNama] = useState("");
  const [harga, setHarga] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize form when editing
  useState(() => {
    if (editing) {
      setNama(editing.nama_layanan);
      setHarga(String(editing.harga_per_kilo));
    }
  });

  // Reset when modal opens/closes
  const reset = () => {
    setNama("");
    setHarga("");
    setError("");
  };

  // Update form when editing changes
  useState(() => {
    if (editing) {
      setNama(editing.nama_layanan);
      setHarga(String(editing.harga_per_kilo));
    } else {
      reset();
    }
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!nama.trim()) return setError("Nama layanan wajib diisi.");
    const hargaNum = parseInt(harga) || 0;
    if (hargaNum <= 0) return setError("Harga harus lebih dari 0.");

    setLoading(true);
    try {
      if (editing) {
        const updated = await api.updateService(editing.id, {
          nama_layanan: nama.trim(),
          harga_per_kilo: hargaNum,
        });
        onSaved(updated, true);
      } else {
        const created = await api.createService({
          nama_layanan: nama.trim(),
          harga_per_kilo: hargaNum,
        });
        onSaved(created, false);
      }
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan layanan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={editing ? "Edit Layanan" : "Tambah Layanan"}
      footer={
        <>
          <Button variant="outline" fullWidth onClick={() => { reset(); onClose(); }}>
            Batal
          </Button>
          <Button type="submit" form="service-form" fullWidth loading={loading}>
            Simpan
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3" id="service-form">
        <Input
          label="Nama Layanan"
          name="nama_layanan"
          placeholder="mis. Cuci Kering"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
        />
        <Input
          label="Harga per kg (Rp)"
          name="harga_per_kilo"
          type="number"
          inputMode="numeric"
          placeholder="mis. 7000"
          value={harga}
          onChange={(e) => setHarga(e.target.value)}
          required
        />
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>
        )}
      </form>
    </Modal>
  );
}
