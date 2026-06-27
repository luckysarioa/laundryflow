"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";

// ==========================================================
// Activity Logs — audit trail semua aktivitas tenant.
// ==========================================================

interface LogEntry {
  id: number;
  user_id: number;
  type: string;
  subject_type: string | null;
  subject_id: number | null;
  properties: Record<string, unknown> | null;
  created_at: string;
  user?: { id: number; nama: string; email: string; role: string };
}

const LOG_TYPES = [
  { value: "", label: "Semua" },
  { value: "order_created", label: "Order Dibuat" },
  { value: "order_completed", label: "Order Selesai" },
  { value: "customer_created", label: "Pelanggan Baru" },
  { value: "service_created", label: "Layanan Baru" },
  { value: "user_login", label: "Login" },
  { value: "settings_updated", label: "Settings Diubah" },
];

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const loadLogs = (p = page, t = typeFilter, s = search) => {
    setLoading(true);
    api.getSuperAdminActivityLogs({ type: t || undefined, search: s || undefined, page: p })
      .then((res) => {
        setLogs(res.data || []);
        setLastPage(res.last_page || 1);
        setTotal(res.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLogs(1); }, []);

  const handleFilter = () => {
    setPage(1);
    loadLogs(1, typeFilter, search);
  };

  const formatProps = (props: Record<string, unknown> | null) => {
    if (!props) return "";
    return Object.entries(props).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(", ");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Activity Logs" subtitle={`Audit trail semua aktivitas (${total} total)`} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
            placeholder="Cari nama atau email user..."
            prefix="🔍"
          />
        </div>
        <div className="sm:w-56">
          <Select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); setTimeout(() => loadLogs(1, e.target.value, search), 0); }}
          >
            {LOG_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>
        <Button onClick={handleFilter}>Cari</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : logs.length === 0 ? (
        <EmptyState title="Tidak ada activity log" description="Belum ada aktivitas tercatat." />
      ) : (
        <>
          <DataTable>
            <DataTable.Head>
              <DataTable.Th>Waktu</DataTable.Th>
              <DataTable.Th>User</DataTable.Th>
              <DataTable.Th>Tipe</DataTable.Th>
              <DataTable.Th>Detail</DataTable.Th>
            </DataTable.Head>
            <DataTable.Body>
              {logs.map((log) => (
                <DataTable.Tr key={log.id}>
                  <DataTable.Td>
                    <span className="text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </DataTable.Td>
                  <DataTable.Td>
                    <div className="font-medium text-slate-800">{log.user?.nama || `User #${log.user_id}`}</div>
                    <div className="text-xs text-slate-400">{log.user?.email}</div>
                  </DataTable.Td>
                  <DataTable.Td>
                    <Badge color="slate">{log.type}</Badge>
                  </DataTable.Td>
                  <DataTable.Td>
                    <span className="text-slate-600 max-w-xs truncate block">{formatProps(log.properties)}</span>
                  </DataTable.Td>
                </DataTable.Tr>
              ))}
            </DataTable.Body>
          </DataTable>

          {lastPage > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-500">Halaman {page} dari {lastPage}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => { setPage(page - 1); loadLogs(page - 1); }}
                >
                  ← Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= lastPage}
                  onClick={() => { setPage(page + 1); loadLogs(page + 1); }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

