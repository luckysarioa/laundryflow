"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/admin/PageHeader";

interface SystemSettings {
  platform_name: string;
  platform_email: string;
  support_email: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  default_trial_days: number;
  max_free_users: number;
  max_free_orders: number;
}

export default function SaSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    api.getSuperAdminSettings()
      .then(setSettings)
      .catch(() => setToast({ type: "error", msg: "Gagal memuat settings." }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setToast(null);
    try {
      await api.updateSuperAdminSettings(settings);
      setToast({ type: "success", msg: "Settings berhasil disimpan." });
    } catch {
      setToast({ type: "error", msg: "Gagal menyimpan settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="System Settings"
        subtitle="Konfigurasi platform SaaS"
        action={<Button onClick={handleSave} loading={saving}>Simpan Perubahan</Button>}
      />

      {toast && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {toast.msg}
        </div>
      )}

      {/* Platform Settings */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-800 mb-5">Platform</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Nama Platform"
            type="text"
            value={settings.platform_name}
            onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
          />
          <Input
            label="Email Platform"
            type="email"
            value={settings.platform_email}
            onChange={(e) => setSettings({ ...settings, platform_email: e.target.value })}
          />
          <Input
            label="Email Support"
            type="email"
            value={settings.support_email}
            onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
          />
        </div>
      </Card>

      {/* Akses */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-800 mb-5">Akses</h3>
        <div className="space-y-5">
          <ToggleRow
            title="Maintenance Mode"
            desc="Nonaktifkan akses untuk semua tenant"
            on={settings.maintenance_mode}
            onToggle={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
            activeColor="bg-red-600"
          />
          <div className="border-t border-slate-100" />
          <ToggleRow
            title="Registrasi Aktif"
            desc="Izinkan tenant baru mendaftar"
            on={settings.registration_enabled}
            onToggle={() => setSettings({ ...settings, registration_enabled: !settings.registration_enabled })}
            activeColor="bg-emerald-600"
          />
        </div>
      </Card>

      {/* Batas Free Plan */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-800 mb-5">Batas Free Plan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Input
            label="Default Trial Days"
            type="number"
            value={settings.default_trial_days}
            onChange={(e) => setSettings({ ...settings, default_trial_days: Number(e.target.value) })}
          />
          <Input
            label="Max User Free"
            type="number"
            value={settings.max_free_users}
            onChange={(e) => setSettings({ ...settings, max_free_users: Number(e.target.value) })}
          />
          <Input
            label="Max Order/Bulan (Free)"
            type="number"
            value={settings.max_free_orders}
            onChange={(e) => setSettings({ ...settings, max_free_orders: Number(e.target.value) })}
          />
        </div>
      </Card>
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  on,
  onToggle,
  activeColor,
}: {
  title: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
  activeColor: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${on ? activeColor : "bg-slate-200"}`}
        aria-pressed={on}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${on ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

