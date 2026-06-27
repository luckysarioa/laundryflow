"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { formatRupiah } from "@/lib/format";

interface Invoice {
  id: string;
  tenant_name: string;
  tenant_id: number;
  plan: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "cancelled";
  due_date: string;
  paid_date: string | null;
  billing_period: string;
}

const MOCK_INVOICES: Invoice[] = [
  { id: "INV-2024-001", tenant_name: "Laundry Bersih", tenant_id: 1, plan: "Pro", amount: 99000, status: "paid", due_date: "2024-03-15", paid_date: "2024-03-14", billing_period: "Mar 2024" },
  { id: "INV-2024-002", tenant_name: "Cuci Bersih", tenant_id: 2, plan: "Enterprise", amount: 299000, status: "paid", due_date: "2024-03-20", paid_date: "2024-03-19", billing_period: "Mar 2024" },
  { id: "INV-2024-003", tenant_name: "Laundry Express", tenant_id: 3, plan: "Pro", amount: 99000, status: "pending", due_date: "2024-04-10", paid_date: null, billing_period: "Apr 2024" },
  { id: "INV-2024-004", tenant_name: "Laundry Kilat", tenant_id: 5, plan: "Pro", amount: 99000, status: "overdue", due_date: "2024-03-05", paid_date: null, billing_period: "Mar 2024" },
  { id: "INV-2024-005", tenant_name: "Laundry Bersih", tenant_id: 1, plan: "Pro", amount: 99000, status: "paid", due_date: "2024-02-15", paid_date: "2024-02-14", billing_period: "Feb 2024" },
  { id: "INV-2024-006", tenant_name: "Cuci Bersih", tenant_id: 2, plan: "Enterprise", amount: 299000, status: "paid", due_date: "2024-02-20", paid_date: "2024-02-19", billing_period: "Feb 2024" },
  { id: "INV-2024-007", tenant_name: "Clean Master", tenant_id: 4, plan: "Free", amount: 0, status: "paid", due_date: "2024-03-25", paid_date: "2024-03-25", billing_period: "Mar 2024" },
];

const STATUS_COLOR: Record<Invoice["status"], "emerald" | "amber" | "red" | "slate"> = {
  paid: "emerald",
  pending: "amber",
  overdue: "red",
  cancelled: "slate",
};

const STATUS_LABEL: Record<Invoice["status"], string> = {
  paid: "Lunas",
  pending: "Menunggu",
  overdue: "Jatuh Tempo",
  cancelled: "Dibatalkan",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setTimeout(() => {
      setInvoices(MOCK_INVOICES);
      setLoading(false);
    }, 500);
  }, []);

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const pendingAmount = invoices.filter((i) => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
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
      <PageHeader title="Invoices & Pembayaran" subtitle="Kelola tagihan dan pembayaran tenant" />

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
        <EmptyState title="Tidak ada invoice" description="Belum ada invoice yang cocok dengan filter." />
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
          </DataTable.Head>
          <DataTable.Body>
            {filtered.map((inv) => (
              <DataTable.Tr key={inv.id}>
                <DataTable.Td>
                  <span className="font-medium text-brand-600">{inv.id}</span>
                </DataTable.Td>
                <DataTable.Td>
                  <div>
                    <p className="font-medium text-slate-800">{inv.tenant_name}</p>
                    <p className="text-xs text-slate-400">ID: {inv.tenant_id}</p>
                  </div>
                </DataTable.Td>
                <DataTable.Td>
                  <span className="text-slate-600">{inv.plan}</span>
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
