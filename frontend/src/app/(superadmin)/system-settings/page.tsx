"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

// ==========================================================
// System Settings — pengaturan global SaaS.
// ==========================================================

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

// Mock data
const MOCK_SETTINGS: SystemSettings = {
  platform_name: "LaundryFlow",
  platform_email: "admin@laundryflow.id",
  support_email: "support@laundryflow.id",
  maintenance_mode: false,
  registration_enabled: true,
  default_trial_days: 7,
  max_free_users: 1,
  max_free_orders: 100,
};

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setSettings(MOCK_SETTINGS);
      setLoading(false);
    }, 500);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    alert("Settings saved!");
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-sm text-slate-500">Configure your SaaS platform</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Platform</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Platform Name</label>
            <input
              type="text"
              value={settings.platform_name}
              onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Platform Email</label>
            <input
              type="email"
              value={settings.platform_email}
              onChange={(e) => setSettings({ ...settings, platform_email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Support Email</label>
            <input
              type="email"
              value={settings.support_email}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </Card>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Access Control</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Maintenance Mode</p>
              <p className="text-xs text-slate-400">Disable access for all tenants</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.maintenance_mode ? "bg-red-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.maintenance_mode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Registration Enabled</p>
              <p className="text-xs text-slate-400">Allow new tenants to register</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, registration_enabled: !settings.registration_enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.registration_enabled ? "bg-emerald-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.registration_enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Free Plan Limits</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Default Trial Days</label>
            <input
              type="number"
              value={settings.default_trial_days}
              onChange={(e) => setSettings({ ...settings, default_trial_days: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max Free Users</label>
            <input
              type="number"
              value={settings.max_free_users}
              onChange={(e) => setSettings({ ...settings, max_free_users: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max Free Orders/Month</label>
            <input
              type="number"
              value={settings.max_free_orders}
              onChange={(e) => setSettings({ ...settings, max_free_orders: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
