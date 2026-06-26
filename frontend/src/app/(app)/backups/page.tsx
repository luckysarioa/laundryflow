"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

// ==========================================================
// Backup Management — backup, download, restore.
// ==========================================================

interface Backup {
  name: string;
  size: number;
  date: string;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadBackups();
  }, []);

  async function loadBackups() {
    setLoading(true);
    try {
      const data = await api.getBackups();
      setBackups(data);
    } catch (err) {
      console.error("Failed to load backups:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBackup() {
    setCreating(true);
    setMessage("");
    try {
      const result = await api.createBackup();
      setMessage(`Backup berhasil dibuat: ${result.backup.name}`);
      loadBackups();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal membuat backup.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDownload(filename: string) {
    try {
      const blob = await api.downloadBackup(filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setMessage("Gagal mengunduh backup.");
    }
  }

  async function handleDelete(filename: string) {
    if (!confirm(`Yakin ingin menghapus backup ${filename}?`)) return;
    try {
      await api.deleteBackup(filename);
      setMessage("Backup berhasil dihapus.");
      loadBackups();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Gagal menghapus backup.");
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Backup & Restore</h1>
        <Button onClick={handleCreateBackup} loading={creating} size="sm">
          + Buat Backup
        </Button>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-2 text-sm ${
            message.includes("berhasil")
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Tentang Backup</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Backup berisi seluruh database aplikasi</li>
              <li>Simpan file backup di tempat yang aman</li>
              <li>Restore hanya bisa dilakukan melalui command line</li>
            </ul>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      {!loading && backups.length === 0 && (
        <Card className="text-center py-8">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-slate-500">Belum ada backup.</p>
          <p className="text-xs text-slate-400 mt-1">
            Klik &quot;+ Buat Backup&quot; untuk membuat backup pertama.
          </p>
        </Card>
      )}

      {!loading && backups.length > 0 && (
        <div className="space-y-3">
          {backups.map((backup) => (
            <Card key={backup.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xl">
                  📦
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{backup.name}</p>
                  <p className="text-xs text-slate-400">
                    {backup.date} • {formatSize(backup.size)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownload(backup.name)}
                  variant="outline"
                  size="sm"
                >
                  ⬇️
                </Button>
                <Button
                  onClick={() => handleDelete(backup.name)}
                  variant="danger"
                  size="sm"
                >
                  🗑️
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
