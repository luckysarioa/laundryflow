"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

// ==========================================================
// Activity Logs — audit trail semua aktivitas tenant.
// ==========================================================

interface LogEntry {
  id: number;
  user_id: number;
  type: string;
  subject_type: string | null;
  subject_id: number | null;
  properties: Record<string, any> | null;
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

  const formatProps = (props: Record<string, any> | null) => {
    if (!props) return "";
    return Object.entries(props).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(", ");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Activity Logs</h2>
        <p className="text-sm text-slate-500">Audit trail semua aktivitas ({total} total)</p>
      </div>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1">Cari User</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
            placeholder="Nama atau email..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Tipe</label>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); setTimeout(() => loadLogs(1, e.target.value, search), 0); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {LOG_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <button onClick={handleFilter} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition">
          Cari
        </button>
      </div>

      <Card padding="md">
        {loading ? (
          <div className="flex justify-center py-8"><Spinner size={24} /></div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Tidak ada activity log.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Waktu</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">User</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Tipe</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{log.user?.nama || `User #${log.user_id}`}</div>
                      <div className="text-xs text-slate-400">{log.user?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{formatProps(log.properties)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">Halaman {page} dari {lastPage}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => { setPage(page - 1); loadLogs(page - 1); }}
                className="px-3 py-1 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= lastPage}
                onClick={() => { setPage(page + 1); loadLogs(page + 1); }}
                className="px-3 py-1 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
