"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { formatRupiah } from "@/lib/format";

// ==========================================================
// Tenant Detail — profil + aksi kelola (status, impersonate,
// reset password, perpanjang langganan).
// ==========================================================

type SubStatus = "active" | "trial" | "suspended" | "cancelled" | "expired" | "past_due";

interface TenantDetail {
  id: number;
  nama: string;
  email: string;
  role: string;
  created_at?: string;
  updated_at?: string;
  outlet?: { name?: string; phone?: string; address?: string } | null;
  subscription?: {
    status: SubStatus;
    amount?: number;
    current_period_end?: string;
    trial_ends_at?: string;
    plan?: { id?: number; name?: string; label?: string; price_monthly?: number } | null;
  } | null;
  orders_count?: number;
  expenses_count?: number;
}

const STATUS_COLOR: Record<string, "emerald" | "amber" | "red" | "slate"> = {
  active: "emerald",
  trial: "amber",
  suspended: "red",
  cancelled: "slate",
  expired: "slate",
  past_due: "amber",
};

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auth = useAuth();
  const toast = useToast();
  const tenantId = params?.id as string;
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Modal states
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ password: "", password_confirmation: "" });
  const [pwSaving, setPwSaving] = useState(false);

  const [extModalOpen, setExtModalOpen] = useState(false);
  const [extDays, setExtDays] = useState(30);
  const [extSaving, setExtSaving] = useState(false);

  const [impLoading, setImpLoading] = useState(false);

  useEffect(() => {
    loadTenant();
  }, [tenantId]);

  async function loadTenant() {
    setLoading(true);
    try {
      const data = await api.getTenant(parseInt(tenantId));
      setTenant(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat tenant");
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!tenant) return;
    if (!confirm(`Ubah status tenant "${tenant.nama}" ke ${newStatus}?`)) return;
    setUpdating(true);
    try {
      await api.updateTenantStatus(tenant.id, newStatus);
      setTenant({ ...tenant, subscription: { ...tenant.subscription!, status: newStatus as SubStatus } });
      toast.success("Status tenant diperbarui");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal update status");
    } finally {
      setUpdating(false);
    }
  }

  async function handleImpersonate() {
    if (!tenant) return;
    if (!confirm(`Login sebagai tenant "${tenant.nama}"? Anda bisa kembali ke panel admin kapan saja.`)) return;
    setImpLoading(true);
    try {
      const result = await api.impersonateTenant(tenant.id);
      auth.impersonate({ token: result.token, user: result.user });
      toast.success(`Berlogin sebagai ${tenant.nama}`);
      router.push("/desktop/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal login sebagai tenant");
    } finally {
      setImpLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    if (pwForm.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setPwSaving(true);
    try {
      await api.resetTenantPassword(tenant.id, pwForm.password, pwForm.password_confirmation);
      toast.success("Password tenant berhasil direset");
      setPwModalOpen(false);
      setPwForm({ password: "", password_confirmation: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal reset password");
    } finally {
      setPwSaving(false);
    }
  }

  async function handleExtend(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setExtSaving(true);
    try {
      await api.extendTenantSubscription(tenant.id, extDays);
      toast.success(`Langganan diperpanjang ${extDays} hari`);
      setExtModalOpen(false);
      loadTenant();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperpanjang langganan");
    } finally {
      setExtSaving(false);
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

  const status = tenant.subscription?.status ?? "trial";
  const planLabel = tenant.subscription?.plan?.label ?? tenant.subscription?.plan?.name ?? "-";
  const amount = tenant.subscription?.amount ?? tenant.subscription?.plan?.price_monthly ?? 0;
  const periodEnd = tenant.subscription?.current_period_end;

  return (
    <div className="space-y-6">
      <PageHeader
        title={tenant.nama}
        subtitle="Detail informasi tenant"
        action={
          <div className="flex items-center gap-2">
            <Badge color={STATUS_COLOR[status] ?? "slate"}>{status}</Badge>
            <div className="w-40">
              <Select value={status} onChange={(e) => handleStatusChange(e.target.value)} disabled={updating}>
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
        <InfoCard label="Total Order" value={(tenant.orders_count ?? 0).toLocaleString("id-ID")} />
        <InfoCard label="Total Pengeluaran" value={(tenant.expenses_count ?? 0).toLocaleString("id-ID")} />
        <InfoCard label="Paket" value={planLabel} />
        <InfoCard label="Tagihan/Bulan" value={amount > 0 ? formatRupiah(amount) : "-"} />
      </div>

      {/* Detail Info — responsive 1/2 kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Info */}
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Informasi Tenant</h3>
          <dl className="space-y-3 text-sm">
            <InfoRow label="Nama Usaha" value={tenant.nama} />
            <InfoRow label="Email" value={tenant.email} />
            <InfoRow label="Telepon" value={tenant.outlet?.phone || "-"} />
            <InfoRow label="Paket" value={planLabel} />
            <InfoRow label="Status" value={status} />
            {periodEnd && (
              <InfoRow label="Periode Berakhir" value={new Date(periodEnd).toLocaleDateString("id-ID")} />
            )}
            {tenant.created_at && (
              <InfoRow label="Terdaftar" value={new Date(tenant.created_at).toLocaleDateString("id-ID")} />
            )}
          </dl>
        </Card>

        {/* Quick Actions */}
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Aksi Cepat</h3>
          <div className="space-y-3">
            <QuickActionRow
              onClick={handleImpersonate}
              disabled={impLoading}
              iconClass="bg-brand-100 text-brand-600"
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
              title={impLoading ? "Memproses..." : "Login sebagai Tenant"}
              desc="Buka panel tenant dengan sesi admin ter-simpan"
            />

            <QuickActionRow
              onClick={() => setExtModalOpen(true)}
              iconClass="bg-purple-100 text-purple-600"
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Perpanjang Langganan"
              desc="Tambah hari ke periode aktif tenant"
            />

            <QuickActionRow
              onClick={() => setPwModalOpen(true)}
              iconClass="bg-amber-100 text-amber-600"
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              }
              title="Reset Password"
              desc="Setel password baru untuk tenant"
            />

            <a
              href={`https://wa.me/${(tenant.outlet?.phone || "").replace(/^0/, "62")}`}
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
                <p className="text-xs text-slate-400">{tenant.outlet?.phone || "tidak ada nomor"}</p>
              </div>
            </a>
          </div>
        </Card>
      </div>

      {/* Reset Password Modal */}
      <Modal
        open={pwModalOpen}
        onClose={() => setPwModalOpen(false)}
        title="Reset Password Tenant"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPwModalOpen(false)} disabled={pwSaving}>
              Batal
            </Button>
            <Button type="submit" form="pw-form" loading={pwSaving}>
              Reset Password
            </Button>
          </>
        }
      >
        <form id="pw-form" onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm text-slate-500">
            Password baru untuk <span className="font-medium text-slate-700">{tenant.nama}</span>. Semua sesi aktif
            tenant akan dicabut.
          </p>
          <Input
            label="Password Baru"
            type="password"
            value={pwForm.password}
            onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
            hint="Minimal 6 karakter"
            required
          />
          <Input
            label="Konfirmasi Password"
            type="password"
            value={pwForm.password_confirmation}
            onChange={(e) => setPwForm({ ...pwForm, password_confirmation: e.target.value })}
            required
          />
        </form>
      </Modal>

      {/* Extend Subscription Modal */}
      <Modal
        open={extModalOpen}
        onClose={() => setExtModalOpen(false)}
        title="Perpanjang Langganan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setExtModalOpen(false)} disabled={extSaving}>
              Batal
            </Button>
            <Button type="submit" form="ext-form" loading={extSaving}>
              Perpanjang
            </Button>
          </>
        }
      >
        <form id="ext-form" onSubmit={handleExtend} className="space-y-4">
          <Select label="Durasi Perpanjangan" value={String(extDays)} onChange={(e) => setExtDays(Number(e.target.value))}>
            <option value="7">7 hari</option>
            <option value="30">30 hari (1 bulan)</option>
            <option value="90">90 hari (3 bulan)</option>
            <option value="180">180 hari (6 bulan)</option>
            <option value="365">365 hari (1 tahun)</option>
          </Select>
          <p className="text-xs text-slate-500">
            Hari ditambahkan ke akhir periode aktif saat ini (bukan reset dari hari ini).
          </p>
        </form>
      </Modal>
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
  disabled,
}: {
  onClick: () => void;
  iconClass: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition text-left disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconClass}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </button>
  );
}
