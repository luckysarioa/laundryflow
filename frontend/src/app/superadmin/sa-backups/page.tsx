"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

// ==========================================================
// System Backups — backup & restore database seluruh platform.
// ==========================================================

interface Backup {
  name: string;
  size: number;
  date: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function SaBackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const loadBackups = () => {
    setLoading(true);
    api.getSuperAdminBackups()
      .then(setBackups)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBackups(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    setToast(null);
    try {
      const res = await api.createSuperAdminBackup();
      setToast({ type: "success", msg: res.message || "Backup berhasil dibuat." });
      loadBackups();
    } catch (e: any) {
      setToast({ type: "error", msg: e.message || "Gagal membuat backup." });
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (name: string) => {
    if (!confirm(`Restore database dari ${name}? Semua data saat ini akan ditimpa!`)) return;
    setRestoring(name);
    setToast(null);
    try {
      const res = await api.restoreSuperAdminBackup(name);
      setToast({ type: "success", msg: res.message || "Restore berhasil." });
    } catch (e: any) {
      setToast({ type: "error", msg: e.message || "Gagal restore." });
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Hapus backup ${name}?`)) return;
    setToast(null);
    try {
      await api.deleteSuperAdminBackup(name);
      setToast({ type: "success", msg: "Backup dihapus." });
      loadBackups();
    } catch (e: any) {
      setToast({ type: "error", msg: e.message || "Gagal menghapus." });
    }
  };

  const handleDownload = (name: string) => {
    const url = api.getSuperAdminBackupDownloadUrl(name);
    if (url === "#") return;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Backups</h2>
          <p className="text-sm text-slate-500">Backup & restore database seluruh platform</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
        >
          {creating ? "Membuat..." : "+ Backup Baru"}
        </button>
      </div>

      {toast && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${toast.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {toast.msg}
        </div>
      )}

      <Card padding="md">
        {loading ? (
          <div className="flex justify-center py-8"><Spinner size={24} /></div>
        ) : backups.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Belum ada backup.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Nama File</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Ukuran</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Tanggal</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.name} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs text-slate-800">{b.name}</td>
                    <td className="py-3 px-4 text-slate-600">{formatSize(b.size)}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(b.date).toLocaleString("id-ID")}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button onClick={() => handleDownload(b.name)} className="text-brand-600 hover:text-brand-700 text-xs font-medium">Download</button>
                      <button
                        onClick={() => handleRestore(b.name)}
                        disabled={restoring === b.name}
                        className="text-amber-600 hover:text-amber-700 text-xs font-medium disabled:opacity-50"
                      >
                        {restoring === b.name ? "Restoring..." : "Restore"}
                      </button>
                      <button onClick={() => handleDelete(b.name)} className="text-red-600 hover:text-red-700 text-xs font-medium">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
