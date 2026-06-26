"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Customer, Service, TipePembayaran } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/format";

// ==========================================================
// OrderForm — form input pesanan dengan kalkulasi otomatis:
//   total_harga = berat (kg) × harga_per_kilo (layanan)
// Sesuai PRD poin 5 (Order Management).
//
// Props `services` & `customers` di-fetch oleh parent (server or client)
// dan di-pass agar form murni presentational.
// ==========================================================

interface OrderFormProps {
  services: Service[];
  customers: Customer[];
}

export function OrderForm({ services, customers }: OrderFormProps) {
  const router = useRouter();
  const toast = useToast();

  const [customerId, setCustomerId] = useState<number>(customers[0]?.id ?? 0);
  const [serviceId, setServiceId] = useState<number>(services[0]?.id ?? 0);
  const [berat, setBerat] = useState<string>("");
  const [catatan, setCatatan] = useState("");
  const [tipePembayaran, setTipePembayaran] = useState<TipePembayaran | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedService = services.find((s) => s.id === serviceId);
  const beratNum = parseFloat(berat.replace(",", ".")) || 0;
  const total = useMemo(
    () => (selectedService ? selectedService.harga_per_kilo * beratNum : 0),
    [selectedService, beratNum],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!customerId) return setError("Pilih pelanggan terlebih dahulu.");
    if (!serviceId) return setError("Pilih layanan terlebih dahulu.");
    if (beratNum <= 0) return setError("Berat harus lebih dari 0 kg.");

    setLoading(true);
    try {
      const order = await api.createOrder({
        customerId,
        serviceId,
        total_berat: beratNum,
        catatan: catatan.trim() || undefined,
        tipe_pembayaran: tipePembayaran || undefined,
      });
      toast.success(`Order #${order.id} dibuat!`);
      router.replace(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat order.");
    } finally {
      setLoading(false);
    }
  }

  if (customers.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">
          Belum ada pelanggan.{" "}
          <button onClick={() => router.push("/customers")} className="text-brand-600 font-medium hover:underline">
            Tambah pelanggan dulu →
          </button>
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <div className="space-y-4">
          <Select label="Pelanggan" value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama} — {c.no_hp}
              </option>
            ))}
          </Select>

          <Select label="Layanan" value={serviceId} onChange={(e) => setServiceId(Number(e.target.value))}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama_layanan} ({formatRupiah(s.harga_per_kilo)}/kg)
              </option>
            ))}
          </Select>

          <Input
            label="Berat Cucian (kg)"
            name="berat"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            placeholder="mis. 3.5"
            value={berat}
            onChange={(e) => setBerat(e.target.value)}
            hint={selectedService ? `Harga ${formatRupiah(selectedService.harga_per_kilo)}/kg` : undefined}
          />

          <Input
            label="Catatan (opsional)"
            name="catatan"
            placeholder="mis. prioritas, noda membandel..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />

          <Select
            label="Metode Pembayaran (opsional)"
            value={tipePembayaran}
            onChange={(e) => setTipePembayaran(e.target.value as TipePembayaran | "")}
          >
            <option value="">Belum ditentukan</option>
            <option value="tunai">Tunai</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer</option>
          </Select>
        </div>
      </Card>

      {/* Ringkasan harga */}
      <Card className="bg-brand-50/60 border-brand-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Total Harga</p>
            <p className="text-2xl font-bold text-brand-700">{formatRupiah(total)}</p>
          </div>
          <div className="text-right text-[11px] text-slate-400">
            {beratNum > 0 && selectedService ? (
              <p>
                {beratNum} kg × {formatRupiah(selectedService.harga_per_kilo)}
              </p>
            ) : (
              <p>Masukkan berat untuk menghitung</p>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      <Button type="submit" size="lg" fullWidth loading={loading}>
        Simpan Order
      </Button>
    </form>
  );
}
