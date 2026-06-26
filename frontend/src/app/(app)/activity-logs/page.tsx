"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ActivityLog } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

const TYPE_LABELS: Record<string, string> = {
  "order.create": "Order Dibuat",
  "order.advance": "Status Diubah",
  "customer.create": "Pelanggan Baru",
  "expense.create": "Pengeluaran",
  "user.create": "User Baru",
};

export default function ActivityLogsPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setLogs(await api.getActivityLogs()); }
    catch { toast.error("Gagal memuat data."); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <AppHeader title="Riwayat Aktivitas" subtitle="Audit log" back />

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} /></div> : logs.length === 0 ? (
        <Card><p className="text-sm text-slate-500 text-center py-8">Belum ada aktivitas.</p></Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} padding="sm">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 text-xs">
                  {log.user?.nama?.charAt(0) ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">{log.user?.nama ?? "System"}</span>{" "}
                    <span className="text-slate-500">{TYPE_LABELS[log.type] || log.type}</span>
                  </p>
                  {log.properties?.detail && <p className="text-xs text-slate-500 mt-0.5">{log.properties.detail}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(log.created_at).toLocaleString("id-ID")}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
