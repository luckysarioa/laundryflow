"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

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

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Invoices & Pembayaran</h2>
        <p className="text-sm text-slate-500">Kelola tagihan dan pembayaran tenant</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Revenue (Paid)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">Rp {totalRevenue.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending + Overdue</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">Rp {pendingAmount.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Overdue</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{overdueCount} invoice</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Cari invoice / tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">Semua Status</option>
          <option value="paid">Lunas</option>
          <option value="pending">Menunggu</option>
          <option value="overdue">Jatuh Tempo</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Invoice</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Tenant</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Paket</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Periode</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Jatuh Tempo</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-medium text-brand-600">{inv.id}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-slate-800">{inv.tenant_name}</p>
                      <p className="text-xs text-slate-400">ID: {inv.tenant_id}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{inv.plan}</td>
                  <td className="py-3 px-4 text-slate-500">{inv.billing_period}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(inv.due_date).toLocaleDateString("id-ID")}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">
                    {inv.amount > 0 ? `Rp ${inv.amount.toLocaleString("id-ID")}` : "Free"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-500">Tidak ada invoice ditemukan.</div>
        )}
      </div>
    </div>
  );
}
