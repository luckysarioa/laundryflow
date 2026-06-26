"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah, formatRelative } from "@/lib/format";

export default function CustomerOrdersPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCustomerOrders(Number(params.id));
      setOrders(data);
      if (data.length > 0 && data[0].customer) {
        setCustomerName(data[0].customer.nama);
      }
    } catch { toast.error("Gagal memuat data."); }
    finally { setLoading(false); }
  }, [params.id, toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <AppHeader title={`Riwayat ${customerName || "Pelanggan"}`} subtitle={`${orders.length} order`} back />

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} /></div> : orders.length === 0 ? (
        <EmptyState title="Belum ada order" description="Pelanggan ini belum pernah melakukan order." />
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Card key={o.id} padding="sm" className="hover:border-brand-300 transition cursor-pointer" onClick={() => router.push(`/orders/${o.id}`)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">#{o.id} • {o.service?.nama_layanan}</p>
                  <p className="text-[11px] text-slate-400">{o.total_berat} kg • {formatRelative(o.tgl_masuk)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={o.status} />
                  <span className="text-[11px] font-medium text-slate-600">{formatRupiah(o.total_harga)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
