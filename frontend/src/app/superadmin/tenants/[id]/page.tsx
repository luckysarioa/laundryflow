"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { formatRupiah } from "@/lib/format";

interface TenantDetail {
  id: number;
  name: string;
  owner_name: string;
  email: string;
  phone: string;
  plan: string;
  status: "active" | "trial" | "suspended" | "cancelled";
  created_at: string;
  orders_count: number;
  revenue: number;
  total_users: number;
  total_customers: number;
  last_active: string;
}

const MOCK_TENANT: TenantDetail = {
  id: 1,
  name: "Laundry Bersih",
  owner_name: "Budi Santoso",
  email: "budi@laundrybersih.com",
  phone: "081234567890",
  plan: "Pro",
  status: "active",
  created_at: "2024-01-15",
  orders_count: 1250,
  revenue: 99000,
  total_users: 3,
  total_customers: 156,
  last_active: "2024-03-20T10:30:00Z",
};

const STATUS_COLOR: Record<TenantDetail["status"], "emerald" | "amber" | "red" | "slate"> = {
  active: "emerald",
  trial: "amber",
  suspended: "red",
  cancelled: "slate",
};

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = params?.id as string;
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchTenant = async () => {
      setLoading(true);
      try {
        const data = await api.getTenant(parseInt(tenantId));
        setTenant(data);
      } catch {
        setTenant(MOCK_TENANT);
      } finally {
        setLoading(false);
      }
    };
    fetchTenant();
  }, [tenantId]);

  async function handleStatusChange(newStatus: string) {
    if (!tenant) return;
    if (!confirm(`Ubah status tenant "${tenant.name}" ke ${newStatus}?`)) return;
    setUpdating(true);
    try {
      await api.updateTenantStatus(tenant.id, newStatus);
      setTenant({ ...tenant, status: newStatus as TenantDetail["status"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal update status.");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">Tenant tidak ditemukan.</p>
        <Link href="/superadmin/tenants" className="text-sm text-brand-600 hover:underline mt-2 inline-block">
          ← Kembali ke Daftar Tenant
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tenant.name}
        subtitle="Detail informasi tenant"
        action={
          <div className="flex items-center gap-2">
            <Badge color={STATUS_COLOR[tenant.status]}>{tenant.status}</Badge>
            <div className="w-40">
              <Select
                value={tenant.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
        }
      />

      {/* Info Cards — responsive 2/4 kolom */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard label="Total Order" value={tenant.orders_count.toLocaleString("id-ID")} />
        <InfoCard label="Total Pelanggan" value={tenant.total_customers.toLocaleString("id-ID")} />
        <InfoCard label="Users" value={String(tenant.total_users)} />
        <InfoCard label="Revenue/Bulan" value={tenant.revenue > 0 ? formatRupiah(tenant.revenue) : "-"} />
      </div>

      {/* Detail Info — responsive 1/2 kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Info */}
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Informasi Tenant</h3>
          <dl className="space-y-3 text-sm">
            <InfoRow label="Nama Usaha" value={tenant.name} />
            <InfoRow label="Pemilik" value={tenant.owner_name} />
            <InfoRow label="Email" value={tenant.email} />
            <InfoRow label="Telepon" value={tenant.phone} />
            <InfoRow label="Paket" value={tenant.plan} />
            <InfoRow label="Terdaftar" value={new Date(tenant.created_at).toLocaleDateString("id-ID")} />
            <InfoRow label="Terakhir Aktif" value={new Date(tenant.last_active).toLocaleString("id-ID")} />
          </dl>
        </Card>

        {/* Quick Actions */}
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Aksi Cepat</h3>
          <div className="space-y-3">
            <QuickActionRow
              onClick={() => window.open(`/desktop/dashboard`, "_blank")}
              iconClass="bg-blue-100 text-blue-600"
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
              title="Lihat Dashboard Tenant"
              desc="Buka panel tenant di tab baru"
            />

            <QuickActionRow
              onClick={() => {
                navigator.clipboard.writeText(`https://laundryflow.pixelmeliva.id/login?tenant=${tenant.id}`);
                alert("Link login tenant sudah di-copy!");
              }}
              iconClass="bg-emerald-100 text-emerald-600"
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              }
              title="Copy Link Login"
              desc="Bagikan link login ke tenant"
            />

            <a
              href={`https://wa.me/${tenant.phone.replace(/^0/, "62")}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition text-left"
            >
              <div className="h-10 w-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.748-.999z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Hubungi via WhatsApp</p>
                <p className="text-xs text-slate-400">{tenant.phone}</p>
              </div>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="text-slate-800 font-medium text-right">{value}</dd>
    </div>
  );
}

function QuickActionRow({
  onClick,
  iconClass,
  icon,
  title,
  desc,
}: {
  onClick: () => void;
  iconClass: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition text-left"
    >
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconClass}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </button>
  );
}
