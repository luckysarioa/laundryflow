"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AppNotification } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

export default function NotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch { toast.error("Gagal memuat notifikasi."); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function handleMarkRead(id: number) {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function handleMarkAllRead() {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    toast.success("Semua notifikasi ditandai sudah dibaca.");
  }

  async function handleDelete(id: number) {
    await api.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const typeColors: Record<string, string> = {
    info: "bg-blue-100 text-blue-600",
    warning: "bg-amber-100 text-amber-600",
    success: "bg-emerald-100 text-emerald-600",
    error: "bg-red-100 text-red-600",
  };

  return (
    <>
      <AppHeader title="Notifikasi" subtitle={`${unreadCount} belum dibaca`} back
        action={unreadCount > 0 ? <button onClick={handleMarkAllRead} className="text-xs font-medium text-brand-600 hover:underline">Baca Semua</button> : undefined} />

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} /></div> : notifications.length === 0 ? (
        <Card><p className="text-sm text-slate-500 text-center py-8">Tidak ada notifikasi.</p></Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} padding="sm" className={`${!n.is_read ? "border-brand-200 bg-brand-50/30" : ""}`}>
              <div className="flex items-start gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${typeColors[n.type] || typeColors.info}`}>
                  {n.type === "warning" ? <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> :
                   n.type === "success" ? <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M5 13l4 4L19 7" /></svg> :
                   <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString("id-ID")}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!n.is_read && <button onClick={() => handleMarkRead(n.id)} className="text-[10px] text-brand-600 hover:underline">Baca</button>}
                  <button onClick={() => handleDelete(n.id)} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
