"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { formatRupiah } from "@/lib/format";

// ==========================================================
// Invoices & Pembayaran — tagihan bulanan tenant.
// Generate manual (tombol) + tandai lunas per-invoice.
// ==========================================================

type InvoiceStatus = "paid" | "pending" | "overdue" | "cancelled";

interface Invoice {
  id: number;
  invoice_number: string;
  tenant_id: number;
  tenant?: { nama: string; email: string } | null;
  amount: number;
  plan_name: string;
  billing_period: string;
  status: InvoiceStatus;
  due_date: string;
  paid_at: string | null;
}

const STATUS_COLOR: Record<InvoiceStatus, "emerald" | "amber" | "red" | "slate"> = {
  paid: "emerald",
  pending: "amber",
  overdue: "red",
  cancelled: "slate",
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Lunas",
  pending: "Menunggu",
  overdue: "Jatuh Tempo",
  cancelled: "Dibatalkan",
};

export default function InvoicesPage() {
  const toast = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    setLoading(true);
    try {
      const res = await api.getSuperAdminInvoices();
      setInvoices(res.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat invoice");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!confirm("Generate tagihan untuk semua subscription aktif/trial bulan ini? Tenant yang sudah punya tagihan bulan ini akan dilewati.")) return;
    setGenerating(true);
    try {
      const res = await api.generateInvoices();
      toast.success(res.message);
      loadInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal generate tagihan");
    } finally {
      setGenerating(false);
    }
  }

  async function handleMarkPaid(inv: Invoice) {
    setMarkingId(inv.id);
    try {
      await api.markInvoicePaid(inv.id);
      toast.success(`Invoice ${inv.invoice_number} ditandai lunas`);
      loadInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menandai invoice");
    } finally {
      setMarkingId(null);
    }
  }

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const tenantName = inv.tenant?.nama ?? "";
    const matchesSearch = !q || tenantName.toLowerCase().includes(q) || inv.invoice_number.toLowerCase().includes(q);
    const matchesStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const pendingAmount = invoices
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((s, i) => s + i.amount, 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

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
        title="Invoices & Pembayaran"
        subtitle="Kelola tagihan dan pembayaran tenant"
        action={
          <Button onClick={handleGenerate} loading={generating}>
            + Generate Tagihan Bulan Ini
          </Button>
        }
      />

      {/* Summary stats — responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Total Revenue (Paid)" value={formatRupiah(totalRevenue)} valueClass="text-emerald-600" />
        <SummaryCard label="Pending + Overdue" value={formatRupiah(pendingAmount)} valueClass="text-amber-600" />
        <SummaryCard label="Overdue" value={`${overdueCount} invoice`} valueClass="text-red-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Cari invoice / tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix="🔍"
          />
        </div>
        <div className="sm:w-48">
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="paid">Lunas</option>
            <option value="pending">Menunggu</option>
            <option value="overdue">Jatuh Tempo</option>
            <option value="cancelled">Dibatalkan</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada invoice"
          description="Klik Generate Tagihan Bulan Ini untuk membuat tagihan dari subscription aktif."
        />
      ) : (
        <DataTable>
          <DataTable.Head>
            <DataTable.Th>Invoice</DataTable.Th>
            <DataTable.Th>Tenant</DataTable.Th>
            <DataTable.Th>Paket</DataTable.Th>
            <DataTable.Th>Periode</DataTable.Th>
            <DataTable.Th>Status</DataTable.Th>
            <DataTable.Th>Jatuh Tempo</DataTable.Th>
            <DataTable.Th align="right">Jumlah</DataTable.Th>
            <DataTable.Th align="right">Aksi</DataTable.Th>
          </DataTable.Head>
          <DataTable.Body>
            {filtered.map((inv) => (
              <DataTable.Tr key={inv.id}>
                <DataTable.Td>
                  <span className="font-medium text-brand-600">{inv.invoice_number}</span>
                </DataTable.Td>
                <DataTable.Td>
                  <div>
                    <p className="font-medium text-slate-800">{inv.tenant?.nama ?? "-"}</p>
                    <p className="text-xs text-slate-400">{inv.tenant?.email ?? ""}</p>
                  </div>
                </DataTable.Td>
                <DataTable.Td>
                  <span className="text-slate-600">{inv.plan_name}</span>
                </DataTable.Td>
                <DataTable.Td>
                  <span className="text-slate-500">{inv.billing_period}</span>
                </DataTable.Td>
                <DataTable.Td>
                  <Badge color={STATUS_COLOR[inv.status]}>{STATUS_LABEL[inv.status]}</Badge>
                </DataTable.Td>
                <DataTable.Td>
                  <span className="text-slate-500">{new Date(inv.due_date).toLocaleDateString("id-ID")}</span>
                </DataTable.Td>
                <DataTable.Td align="right">
                  <span className="font-semibold text-slate-800">
                    {inv.amount > 0 ? formatRupiah(inv.amount) : "Free"}
                  </span>
                </DataTable.Td>
                <DataTable.Td align="right">
                  {(inv.status === "pending" || inv.status === "overdue") && (
                    <button
                      onClick={() => handleMarkPaid(inv)}
                      disabled={markingId === inv.id}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                    >
                      {markingId === inv.id ? "..." : "Tandai Lunas"}
                    </button>
                  )}
                </DataTable.Td>
              </DataTable.Tr>
            ))}
          </DataTable.Body>
        </DataTable>
      )}
    </div>
  );
}

function SummaryCard({ label, value, valueClass }: { label: string; value: string; valueClass: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</p>
    </div>
  );
}
