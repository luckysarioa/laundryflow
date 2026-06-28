"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { formatRupiah } from "@/lib/format";

// ==========================================================
// Tenants Management — kelola semua bisnis laundry.
// ==========================================================

type SubStatus = "active" | "trial" | "suspended" | "cancelled" | "expired" | "past_due";

interface Tenant {
  id: number;
  nama: string;
  email: string;
  role: string;
  outlet?: { name?: string; phone?: string } | null;
  subscription?: {
    status: SubStatus;
    amount?: number;
    plan?: { label?: string; name?: string } | null;
  } | null;
  created_at?: string;
  orders_count?: number;
}

const STATUS_COLOR: Record<string, "emerald" | "amber" | "red" | "slate"> = {
  active: "emerald",
  trial: "amber",
  suspended: "red",
  cancelled: "slate",
  expired: "slate",
  past_due: "amber",
};

const PLAN_DEFAULT = [
  { id: 1, name: "free", label: "Free", price_monthly: 0 },
  { id: 2, name: "pro", label: "Pro", price_monthly: 99000 },
  { id: 3, name: "enterprise", label: "Enterprise", price_monthly: 299000 },
];

export default function TenantsPage() {
  const router = useRouter();
  const toast = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [plans, setPlans] = useState(PLAN_DEFAULT);

  // Modal form (create / edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState({
    nama: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    plan_id: 2,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTenants();
    loadPlans();
  }, []);

  async function loadTenants() {
    try {
      const res = await api.getTenants();
      setTenants(res.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat tenant");
    } finally {
      setLoading(false);
    }
  }

  async function loadPlans() {
    try {
      const res = await api.getSuperAdminPlans();
      if (Array.isArray(res) && res.length) {
        setPlans(res.map((p: any) => ({ id: p.id, name: p.name, label: p.label, price_monthly: p.price_monthly })));
      }
    } catch {
      // fallback ke plan default
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ nama: "", email: "", phone: "", password: "", password_confirmation: "", plan_id: plans[1]?.id ?? 2 });
    setModalOpen(true);
  }

  function openEdit(t: Tenant) {
    setEditing(t);
    setForm({
      nama: t.nama,
      email: t.email,
      phone: t.outlet?.phone ?? "",
      password: "",
      password_confirmation: "",
      plan_id: findPlanId(t.subscription?.plan?.name),
    });
    setModalOpen(true);
  }

  function findPlanId(planName?: string): number {
    const match = plans.find((p) => p.name === planName);
    return match?.id ?? plans[1]?.id ?? 2;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.updateTenant(editing.id, {
          nama: form.nama,
          email: form.email,
          phone: form.phone || undefined,
          plan_id: form.plan_id,
        });
        toast.success("Tenant diperbarui");
      } else {
        if (form.password.length < 6) {
          toast.error("Password minimal 6 karakter");
          setSaving(false);
          return;
        }
        await api.createTenant({
          nama: form.nama,
          email: form.email,
          phone: form.phone || undefined,
          plan_id: form.plan_id,
          password: form.password,
          password_confirmation: form.password_confirmation,
          status: "trial",
        });
        toast.success("Tenant dibuat");
      }
      setModalOpen(false);
      loadTenants();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan tenant");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: Tenant) {
    if (!confirm(`Hapus tenant "${t.nama}"? Tindakan ini tidak dapat dibatalkan dan menghapus semua data terkait.`)) return;
    try {
      await api.deleteTenant(t.id);
      toast.success("Tenant dihapus");
      loadTenants();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus tenant");
    }
  }

  function planLabel(t: Tenant): string {
    return t.subscription?.plan?.label ?? t.subscription?.plan?.name ?? "-";
  }

  function subAmount(t: Tenant): number {
    return t.subscription?.amount ?? 0;
  }

  function statusOf(t: Tenant): string {
    return t.subscription?.status ?? "trial";
  }

  // Filter di sisi klien untuk UX cepat; API juga mendukung server-side filter.
  const filteredTenants = tenants.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || t.nama.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
    const matchesStatus = filterStatus === "all" || statusOf(t) === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tenants"
        subtitle="Kelola semua bisnis laundry"
        action={<Button onClick={openCreate}>+ Add Tenant</Button>}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Cari nama / email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Tenants Table */}
      {filteredTenants.length === 0 ? (
        <EmptyState
          title="Tidak ada tenant"
          description={search ? "Tidak ada hasil untuk pencarian ini." : "Belum ada tenant terdaftar."}
        />
      ) : (
        <DataTable>
          <DataTable.Head>
            <DataTable.Th>Tenant</DataTable.Th>
            <DataTable.Th>Plan</DataTable.Th>
            <DataTable.Th>Status</DataTable.Th>
            <DataTable.Th align="right">Orders</DataTable.Th>
            <DataTable.Th align="right">Tagihan/Bln</DataTable.Th>
            <DataTable.Th align="right">Aksi</DataTable.Th>
          </DataTable.Head>
          <DataTable.Body>
            {filteredTenants.map((tenant) => {
              const st = statusOf(tenant);
              return (
                <DataTable.Tr key={tenant.id}>
                  <DataTable.Td>
                    <button
                      onClick={() => router.push(`/superadmin/tenants/${tenant.id}`)}
                      className="text-left group"
                    >
                      <p className="text-sm font-medium text-slate-800 group-hover:text-brand-700">{tenant.nama}</p>
                      <p className="text-xs text-slate-400">{tenant.email}</p>
                    </button>
                  </DataTable.Td>
                  <DataTable.Td>
                    <span className="text-sm text-slate-600">{planLabel(tenant)}</span>
                  </DataTable.Td>
                  <DataTable.Td>
                    <Badge color={STATUS_COLOR[st] ?? "slate"}>{st}</Badge>
                  </DataTable.Td>
                  <DataTable.Td align="right">
                    <span className="text-sm text-slate-600">{(tenant.orders_count ?? 0).toLocaleString("id-ID")}</span>
                  </DataTable.Td>
                  <DataTable.Td align="right">
                    <span className="text-sm text-slate-600">
                      {subAmount(tenant) > 0 ? `${formatRupiah(subAmount(tenant))}/bln` : "-"}
                    </span>
                  </DataTable.Td>
                  <DataTable.Td align="right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(tenant)}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tenant)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Hapus
                      </button>
                    </div>
                  </DataTable.Td>
                </DataTable.Tr>
              );
            })}
          </DataTable.Body>
        </DataTable>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Tenant" : "Tambah Tenant"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" form="tenant-form" loading={saving}>
              {editing ? "Simpan" : "Buat Tenant"}
            </Button>
          </>
        }
      >
        <form id="tenant-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Usaha / Pemilik"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="No. Telepon (opsional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Select
            label="Paket"
            value={form.plan_id}
            onChange={(e) => setForm({ ...form, plan_id: Number(e.target.value) })}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} {p.price_monthly > 0 ? `— ${formatRupiah(p.price_monthly)}/bln` : "(gratis)"}
              </option>
            ))}
          </Select>
          {!editing && (
            <>
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                hint="Minimal 6 karakter"
                required
              />
              <Input
                label="Konfirmasi Password"
                type="password"
                value={form.password_confirmation}
                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                required
              />
            </>
          )}
          {editing && (
            <p className="text-xs text-slate-500">
              Password tidak diubah dari sini — gunakan tombol "Reset Password" di halaman detail tenant.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
