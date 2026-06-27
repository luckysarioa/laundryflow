"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { formatRupiah } from "@/lib/format";

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
  { id: 1, name: "Laundry Bersih", owner_name: "Budi Santoso", email: "budi@laundrybersih.com", phone: "081234567890", plan: "Pro", status: "active", created_at: "2024-01-15", orders_count: 1250, revenue: 99000 },
  { id: 2, name: "Cuci Bersih", owner_name: "Andi Wijaya", email: "andi@cucibersih.com", phone: "081234567891", plan: "Enterprise", status: "active", created_at: "2024-02-20", orders_count: 3200, revenue: 299000 },
  { id: 3, name: "Laundry Express", owner_name: "Sari Dewi", email: "sari@laundryexpress.com", phone: "081234567892", plan: "Pro", status: "trial", created_at: "2024-03-10", orders_count: 45, revenue: 0 },
  { id: 4, name: "Clean Master", owner_name: "Rizki Pratama", email: "rizki@cleanmaster.com", phone: "081234567893", plan: "Free", status: "active", created_at: "2024-03-25", orders_count: 89, revenue: 0 },
  { id: 5, name: "Laundry Kilat", owner_name: "Maya Putri", email: "maya@laundrykilat.com", phone: "081234567894", plan: "Pro", status: "suspended", created_at: "2024-01-05", orders_count: 567, revenue: 99000 },
];

const STATUS_COLOR: Record<Tenant["status"], "emerald" | "amber" | "red" | "slate"> = {
  active: "emerald",
  trial: "amber",
  suspended: "red",
  cancelled: "slate",
};

export default function TenantsPage() {
  const router = useRouter();
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
        action={<Button>+ Add Tenant</Button>}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Cari nama / pemilik / email..."
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
            <DataTable.Th align="right">Revenue</DataTable.Th>
            <DataTable.Th align="right">Aksi</DataTable.Th>
          </DataTable.Head>
          <DataTable.Body>
            {filteredTenants.map((tenant) => (
              <DataTable.Tr
                key={tenant.id}
                className="cursor-pointer"
                onClick={() => router.push(`/superadmin/tenants/${tenant.id}`)}
              >
                <DataTable.Td>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{tenant.name}</p>
                    <p className="text-xs text-slate-400">{tenant.owner_name}</p>
                    <p className="text-xs text-slate-400">{tenant.email}</p>
                  </div>
                </DataTable.Td>
                <DataTable.Td>
                  <span className="text-sm text-slate-600">{tenant.plan}</span>
                </DataTable.Td>
                <DataTable.Td>
                  <Badge color={STATUS_COLOR[tenant.status]}>{tenant.status}</Badge>
                </DataTable.Td>
                <DataTable.Td align="right">
                  <span className="text-sm text-slate-600">{tenant.orders_count.toLocaleString("id-ID")}</span>
                </DataTable.Td>
                <DataTable.Td align="right">
                  <span className="text-sm text-slate-600">
                    {tenant.revenue > 0 ? `${formatRupiah(tenant.revenue)}/bln` : "-"}
                  </span>
                </DataTable.Td>
                <DataTable.Td align="right">
                  <div className="flex justify-end gap-2">
                    <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">Edit</button>
                    <button className="text-sm text-red-600 hover:text-red-700 font-medium">Suspend</button>
                  </div>
                </DataTable.Td>
              </DataTable.Tr>
            ))}
          </DataTable.Body>
        </DataTable>
      )}
    </div>
  );
}
