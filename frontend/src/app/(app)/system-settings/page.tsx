"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

// ==========================================================
// System Settings — pengaturan bisnis, keuangan, notifikasi.
// ==========================================================

interface Settings {
  [key: string]: Record<string, string | null>;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("business");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      // Flatten all settings
      const flat: Record<string, string> = {};
      Object.values(settings).forEach((group) => {
        Object.entries(group).forEach(([key, value]) => {
          flat[key] = value ?? "";
        });
      });
      await api.updateSettings(flat);
      setMessage("Pengaturan berhasil disimpan!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: string, value: string) {
    setSettings((prev) => {
      const updated = { ...prev };
      for (const group of Object.keys(updated)) {
        if (key in updated[group]) {
          updated[group] = { ...updated[group], [key]: value };
        }
      }
      return updated;
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  const tabs = [
    { id: "business", label: "Bisnis", icon: "🏪" },
    { id: "finance", label: "Keuangan", icon: "💰" },
    { id: "notification", label: "Notifikasi", icon: "🔔" },
    { id: "receipt", label: "Struk", icon: "🧾" },
    { id: "system", label: "Sistem", icon: "⚙️" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">Pengaturan Sistem</h1>

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

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-brand-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {/* Business Settings */}
        {activeTab === "business" && (
          <Card className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Informasi Bisnis</h2>
            <Input
              label="Nama Bisnis"
              name="business_name"
              value={(settings.business?.business_name as string) || ""}
              onChange={(e) => updateSetting("business_name", e.target.value)}
            />
            <Input
              label="Alamat"
              name="business_address"
              value={(settings.business?.business_address as string) || ""}
              onChange={(e) => updateSetting("business_address", e.target.value)}
            />
            <Input
              label="Telepon"
              name="business_phone"
              value={(settings.business?.business_phone as string) || ""}
              onChange={(e) => updateSetting("business_phone", e.target.value)}
            />
            <Input
              label="Email"
              name="business_email"
              type="email"
              value={(settings.business?.business_email as string) || ""}
              onChange={(e) => updateSetting("business_email", e.target.value)}
            />
          </Card>
        )}

        {/* Finance Settings */}
        {activeTab === "finance" && (
          <Card className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Pengaturan Keuangan</h2>
            <Input
              label="Mata Uang"
              name="currency"
              value={(settings.finance?.currency as string) || "IDR"}
              onChange={(e) => updateSetting("currency", e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pajak (PPN)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(settings.finance?.tax_enabled as string) === "true"}
                    onChange={(e) =>
                      updateSetting("tax_enabled", e.target.checked ? "true" : "false")
                    }
                    className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-600">Aktifkan Pajak</span>
                </label>
              </div>
            </div>
            {(settings.finance?.tax_enabled as string) === "true" && (
              <Input
                label="Tarif Pajak (%)"
                name="tax_rate"
                type="number"
                value={(settings.finance?.tax_rate as string) || "0"}
                onChange={(e) => updateSetting("tax_rate", e.target.value)}
              />
            )}
          </Card>
        )}

        {/* Notification Settings */}
        {activeTab === "notification" && (
          <Card className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Pengaturan Notifikasi</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(settings.notification?.whatsapp_enabled as string) === "true"}
                  onChange={(e) =>
                    updateSetting("whatsapp_enabled", e.target.checked ? "true" : "false")
                  }
                  className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-600">Aktifkan WhatsApp</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(settings.notification?.auto_whatsapp as string) === "true"}
                  onChange={(e) =>
                    updateSetting("auto_whatsapp", e.target.checked ? "true" : "false")
                  }
                  className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-600">Auto WhatsApp saat status berubah</span>
              </label>
            </div>
          </Card>
        )}

        {/* Receipt Settings */}
        {activeTab === "receipt" && (
          <Card className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Pengaturan Struk</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Footer Struk
              </label>
              <textarea
                name="receipt_footer"
                rows={3}
                value={(settings.receipt?.receipt_footer as string) || ""}
                onChange={(e) => updateSetting("receipt_footer", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </Card>
        )}

        {/* System Settings */}
        {activeTab === "system" && (
          <Card className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Pengaturan Sistem</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Timezone
              </label>
              <select
                name="timezone"
                value={(settings.system?.timezone as string) || "Asia/Jakarta"}
                onChange={(e) => updateSetting("timezone", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
              </select>
            </div>
            <Input
              label="Format Tanggal"
              name="date_format"
              value={(settings.system?.date_format as string) || "d/m/Y"}
              onChange={(e) => updateSetting("date_format", e.target.value)}
            />
          </Card>
        )}

        {/* Save Button */}
        <div className="flex gap-2">
          <Button type="submit" loading={saving} className="flex-1">
            💾 Simpan Pengaturan
          </Button>
        </div>
      </form>
    </div>
  );
}
