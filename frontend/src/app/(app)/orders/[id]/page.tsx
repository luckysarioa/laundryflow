"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Order, Service } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah, formatTanggal, formatJam, storageUrl } from "@/lib/format";
import { STATUS_FLOW, STATUS_LABEL, STATUS_STYLE, nextStatus } from "@/lib/constants";

// ==========================================================
// Detail Order — info lengkap, update status (advance), & WA trigger.
// Dilengkapi: Edit order, upload foto bukti cucian.
// ==========================================================

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [editData, setEditData] = useState({
    serviceId: 0,
    total_berat: "",
    catatan: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrder(await api.getOrder(id));
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Load services when editing
  useEffect(() => {
    if (editing && services.length === 0) {
      api.getServices().then(setServices).catch(() => {});
    }
  }, [editing, services.length]);

  // Initialize edit data when order loads
  useEffect(() => {
    if (order && editing) {
      setEditData({
        serviceId: order.serviceId,
        total_berat: String(order.total_berat),
        catatan: order.catatan ?? "",
      });
    }
  }, [order, editing]);

  async function handleAdvance() {
    if (!order) return;
    const next = nextStatus(order.status);
    if (!next) return;
    setAdvancing(true);
    try {
      const updated = await api.advanceOrder(order.id);
      setOrder(updated);
      toast.success(`Status diperbarui ke "${STATUS_LABEL[updated.status]}".`);
      if (updated.status === "siap") {
        toast.info("Cucian siap diambil — kirim info ke pelanggan?");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui status.");
    } finally {
      setAdvancing(false);
    }
  }

  async function handleSaveEdit() {
    if (!order) return;
    const beratNum = parseFloat(editData.total_berat.replace(",", ".")) || 0;
    if (beratNum <= 0) {
      toast.error("Berat harus lebih dari 0 kg.");
      return;
    }

    setSaving(true);
    try {
      const updated = await api.updateOrder(order.id, {
        serviceId: editData.serviceId,
        total_berat: beratNum,
        catatan: editData.catatan.trim() || null,
      });
      setOrder(updated);
      setEditing(false);
      toast.success("Order berhasil diperbarui.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui order.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !order) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB.");
      return;
    }

    setUploading(true);
    try {
      const updated = await api.uploadOrderFoto(order.id, file);
      setOrder(updated);
      toast.success("Foto berhasil diupload.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal upload foto.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDeleteFoto() {
    if (!order || !order.foto) return;
    try {
      const updated = await api.deleteOrderFoto(order.id);
      setOrder(updated);
      toast.success("Foto berhasil dihapus.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus foto.");
    }
  }

  const canEdit = order && ["antrian", "cuci"].includes(order.status);

  if (loading) {
    return (
      <>
        <AppHeader title="Detail Order" back />
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <AppHeader title="Detail Order" back />
        <Card>
          <p className="text-sm text-slate-600 text-center py-6">Order tidak ditemukan.</p>
          <Button variant="outline" fullWidth onClick={() => router.replace("/orders")}>
            Kembali ke Daftar
          </Button>
        </Card>
      </>
    );
  }

  const next = nextStatus(order.status);

  return (
    <>
      <AppHeader
        title={`Order #${order.id}`}
        subtitle={`Masuk ${formatTanggal(order.tgl_masuk)}`}
        back
        action={
          canEdit && !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
              aria-label="Edit Order"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path strokeLinecap="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          ) : undefined
        }
      />

      <div className="space-y-4">
        {/* Status & customer */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <StatusBadge status={order.status} size="md" />
            <span className="text-sm font-semibold text-slate-700">{formatRupiah(order.total_harga)}</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">
                {(order.customer?.nama ?? "?").charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{order.customer?.nama}</p>
                <p className="text-[11px] text-slate-400 truncate">{order.customer?.no_hp}</p>
              </div>
            </div>
            {order.customer?.alamat && (
              <p className="text-[11px] text-slate-400 pt-1">📍 {order.customer.alamat}</p>
            )}
          </div>
        </Card>

        {/* Edit Form */}
        {editing ? (
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Edit Pesanan</h3>
            <div className="space-y-3">
              <Select
                label="Layanan"
                value={editData.serviceId}
                onChange={(e) => setEditData({ ...editData, serviceId: Number(e.target.value) })}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama_layanan} ({formatRupiah(s.harga_per_kilo)}/kg)
                  </option>
                ))}
              </Select>

              <Input
                label="Berat Cucian (kg)"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="mis. 3.5"
                value={editData.total_berat}
                onChange={(e) => setEditData({ ...editData, total_berat: e.target.value })}
              />

              <Input
                label="Catatan"
                placeholder="Catatan order..."
                value={editData.catatan}
                onChange={(e) => setEditData({ ...editData, catatan: e.target.value })}
              />

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditing(false)}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  loading={saving}
                  onClick={handleSaveEdit}
                >
                  Simpan
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* Rincian */
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Rincian Pesanan</h3>
            <dl className="space-y-2.5 text-sm">
              <Row label="Layanan" value={order.service?.nama_layanan ?? "-"} />
              <Row label="Harga / kg" value={formatRupiah(order.service?.harga_per_kilo ?? 0)} />
              <Row label="Berat" value={`${order.total_berat} kg`} />
              <div className="border-t border-dashed border-slate-200 my-1" />
              <Row label="Total Harga" value={formatRupiah(order.total_harga)} bold />
              <Row label="Waktu Masuk" value={`${formatTanggal(order.tgl_masuk)} • ${formatJam(order.tgl_masuk)}`} />
              {order.tgl_selesai && (
                <Row label="Selesai" value={`${formatTanggal(order.tgl_selesai)} • ${formatJam(order.tgl_selesai)}`} />
              )}
              {order.catatan && <Row label="Catatan" value={order.catatan} />}
            </dl>
          </Card>
        )}

        {/* Foto Bukti Cucian */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Foto Bukti Cucian</h3>
          {order.foto ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={storageUrl(order.foto ?? "", process.env.NEXT_PUBLIC_API_URL)}
                  alt="Bukti cucian"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={handleDeleteFoto}
              >
                Hapus Foto
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <svg className="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path strokeLinecap="round" d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 mb-3">Belum ada foto bukti cucian</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFotoUpload}
              />
              <Button
                size="sm"
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
                Upload Foto
              </Button>
            </div>
          )}
        </Card>

        {/* Progress alur status */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Progress Status</h3>
          <ol className="space-y-2">
            {STATUS_FLOW.map((s, i) => {
              const currentIdx = STATUS_FLOW.indexOf(order.status);
              const done = i <= currentIdx;
              const current = i === currentIdx;
              return (
                <li key={s} className="flex items-center gap-3">
                  <span
                    className={[
                      "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0",
                      done ? "text-white" : "bg-slate-100 text-slate-400",
                    ].join(" ")}
                    style={done ? { backgroundColor: STATUS_STYLE[s].hex } : undefined}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={["text-sm", current ? "font-semibold text-slate-800" : done ? "text-slate-600" : "text-slate-400"].join(" ")}>
                    {STATUS_LABEL[s]}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>

        {/* Aksi status */}
        {next ? (
          <Button size="lg" fullWidth loading={advancing} onClick={handleAdvance}>
            Majukan ke &ldquo;{STATUS_LABEL[next]}&rdquo;
          </Button>
        ) : (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 text-center">
            ✓ Order telah selesai &amp; diambil pelanggan.
          </div>
        )}

        {/* WhatsApp */}
        <WhatsAppButton order={order} />
      </div>
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={["text-right", bold ? "font-semibold text-slate-800" : "text-slate-700"].join(" ")}>{value}</dd>
    </div>
  );
}
