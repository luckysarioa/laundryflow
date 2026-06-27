"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Konfigurasi platform SaaS</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {toast && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.msg}
        </div>
      )}

      {/* Platform Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-5">Platform</h3>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Platform</label>
            <input
              type="text"
              value={settings.platform_name}
              onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Platform</label>
            <input
              type="email"
              value={settings.platform_email}
              onChange={(e) => setSettings({ ...settings, platform_email: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Support</label>
            <input
              type="email"
              value={settings.support_email}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Akses */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-5">Akses</h3>
        <div className="space-y-5">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-800">Maintenance Mode</p>
              <p className="text-xs text-slate-400 mt-0.5">Nonaktifkan akses untuk semua tenant</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${settings.maintenance_mode ? "bg-red-600" : "bg-slate-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${settings.maintenance_mode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="border-t border-slate-100" />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-800">Registrasi Aktif</p>
              <p className="text-xs text-slate-400 mt-0.5">Izinkan tenant baru mendaftar</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, registration_enabled: !settings.registration_enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${settings.registration_enabled ? "bg-emerald-600" : "bg-slate-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${settings.registration_enabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Batas Free Plan */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-5">Batas Free Plan</h3>
        <div className="grid grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Trial Days</label>
            <input
              type="number"
              value={settings.default_trial_days}
              onChange={(e) => setSettings({ ...settings, default_trial_days: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Max User Free</label>
            <input
              type="number"
              value={settings.max_free_users}
              onChange={(e) => setSettings({ ...settings, max_free_users: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Order/Bulan (Free)</label>
            <input
              type="number"
              value={settings.max_free_orders}
              onChange={(e) => setSettings({ ...settings, max_free_orders: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
