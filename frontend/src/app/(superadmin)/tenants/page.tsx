"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

// ==========================================================
// Tenants Management — kelola semua laundry businesses.
// ==========================================================

interface Tenant {
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
}

// Mock data
const MOCK_TENANTS: Tenant[] = [
  {
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
  },
  {
    id: 2,
    name: "Cuci Bersih",
    owner_name: "Andi Wijaya",
    email: "andi@cucibersih.com",
    phone: "081234567891",
    plan: "Enterprise",
    status: "active",
    created_at: "2024-02-20",
    orders_count: 3200,
    revenue: 299000,
  },
  {
    id: 3,
    name: "Laundry Express",
    owner_name: "Sari Dewi",
    email: "sari@laundryexpress.com",
    phone: "081234567892",
    plan: "Pro",
    status: "trial",
    created_at: "2024-03-10",
    orders_count: 45,
    revenue: 0,
  },
  {
    id: 4,
    name: "Clean Master",
    owner_name: "Rizki Pratama",
    email: "rizki@cleanmaster.com",
    phone: "081234567893",
    plan: "Free",
    status: "active",
    created_at: "2024-03-25",
    orders_count: 89,
    revenue: 0,
  },
  {
    id: 5,
    name: "Laundry Kilat",
    owner_name: "Maya Putri",
    email: "maya@laundrykilat.com",
    phone: "081234567894",
    plan: "Pro",
    status: "suspended",
    created_at: "2024-01-05",
    orders_count: 567,
    revenue: 99000,
  },
];

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    setTimeout(() => {
      setTenants(MOCK_TENANTS);
      setLoading(false);
    }, 500);
  }, []);

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    active: "bg-emerald-100 text-emerald-700",
    trial: "bg-amber-100 text-amber-700",
    suspended: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-500",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tenants</h2>
          <p className="text-sm text-slate-500">Manage all laundry businesses</p>
        </div>
        <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition">
          + Add Tenant
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Tenants List */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tenant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Orders</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Revenue</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{tenant.name}</p>
                      <p className="text-xs text-slate-400">{tenant.owner_name}</p>
                      <p className="text-xs text-slate-400">{tenant.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{tenant.plan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[tenant.status]
                      }`}
                    >
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{tenant.orders_count.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">
                      {tenant.revenue > 0 ? `Rp ${tenant.revenue.toLocaleString("id-ID")}/mo` : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-sm text-brand-600 hover:text-brand-700">Edit</button>
                      <button className="text-sm text-red-600 hover:text-red-700">Suspend</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
