"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";

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
    } catch (e) {
      setToast({ type: "error", msg: e instanceof Error ? e.message : "Gagal membuat backup." });
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
    } catch (e) {
      setToast({ type: "error", msg: e instanceof Error ? e.message : "Gagal restore." });
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
    } catch (e) {
      setToast({ type: "error", msg: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  const handleDownload = (name: string) => {
    const url = api.getSuperAdminBackupDownloadUrl(name);
    if (url === "#") return;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="System Backups"
        subtitle="Backup & restore database seluruh platform"
        action={<Button onClick={handleCreate} loading={creating}>+ Backup Baru</Button>}
      />

      {toast && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {toast.msg}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : backups.length === 0 ? (
        <EmptyState title="Belum ada backup" description="Buat backup database pertama Anda." />
      ) : (
        <DataTable>
          <DataTable.Head>
            <DataTable.Th>Nama File</DataTable.Th>
            <DataTable.Th>Ukuran</DataTable.Th>
            <DataTable.Th>Tanggal</DataTable.Th>
            <DataTable.Th align="right">Aksi</DataTable.Th>
          </DataTable.Head>
          <DataTable.Body>
            {backups.map((b) => (
              <DataTable.Tr key={b.name}>
                <DataTable.Td><span className="font-mono text-xs text-slate-800">{b.name}</span></DataTable.Td>
                <DataTable.Td><span className="text-slate-600">{formatSize(b.size)}</span></DataTable.Td>
                <DataTable.Td><span className="text-slate-500">{new Date(b.date).toLocaleString("id-ID")}</span></DataTable.Td>
                <DataTable.Td align="right">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => handleDownload(b.name)} className="text-brand-600 hover:text-brand-700 text-xs font-medium">Download</button>
                    <button
                      onClick={() => handleRestore(b.name)}
                      disabled={restoring === b.name}
                      className="text-amber-600 hover:text-amber-700 text-xs font-medium disabled:opacity-50"
                    >
                      {restoring === b.name ? "Restoring..." : "Restore"}
                    </button>
                    <button onClick={() => handleDelete(b.name)} className="text-red-600 hover:text-red-700 text-xs font-medium">Hapus</button>
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

