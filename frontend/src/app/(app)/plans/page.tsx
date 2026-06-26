"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatRupiah } from "@/lib/format";
import type { Plan } from "@/lib/types";

// ==========================================================
// Plan Management — CRUD subscription plans.
// ==========================================================

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    label: "",
    price_monthly: 0,
    price_yearly: 0,
    max_users: 1,
    max_orders_per_month: 0,
    max_outlets: 1,
    trial_days: 0,
    features: { pdf: false, wa: false, backup: false, kanban: true, multi_outlet: false } as Record<string, boolean>,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    try {
      const data = await api.getPlans();
      setPlans(data);
    } catch (err) {
      console.error("Failed to load plans:", err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      name: "",
      label: "",
      price_monthly: 0,
      price_yearly: 0,
      max_users: 1,
      max_orders_per_month: 0,
      max_outlets: 1,
      trial_days: 0,
      features: { pdf: false, wa: false, backup: false, kanban: true, multi_outlet: false },
    });
    setEditing(null);
  }

  function handleEdit(plan: Plan) {
    setEditing(plan);
    setForm({
      name: plan.name,
      label: plan.label,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_users: plan.max_users,
      max_orders_per_month: plan.max_orders_per_month,
      max_outlets: plan.max_outlets,
      trial_days: plan.trial_days,
      features: { ...plan.features },
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (editing) {
        await api.updatePlan(editing.id, form);
        setMessage("Plan berhasil diupdate!");
      } else {
        await api.createPlan(form);
        setMessage("Plan berhasil dibuat!");
      }
      setShowForm(false);
      resetForm();
      loadPlans();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal menyimpan plan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Yakin ingin menghapus plan ini?")) return;
    try {
      await api.deletePlan(id);
      setMessage("Plan berhasil dihapus!");
      loadPlans();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal menghapus plan.");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Manajemen Plan</h1>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          size="sm"
        >
          + Tambah Plan
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

      {/* Plan Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              {editing ? "Edit Plan" : "Tambah Plan Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {!editing && (
                <Input
                  label="Kode Plan"
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase() })}
                  placeholder="pro, enterprise, dll."
                  required
                />
              )}
              <Input
                label="Nama Tampilan"
                name="label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Harga/Bulan (Rp)"
                  name="price_monthly"
                  type="number"
                  value={form.price_monthly}
                  onChange={(e) => setForm({ ...form, price_monthly: +e.target.value })}
                />
                <Input
                  label="Harga/Tahun (Rp)"
                  name="price_yearly"
                  type="number"
                  value={form.price_yearly}
                  onChange={(e) => setForm({ ...form, price_yearly: +e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Max User"
                  name="max_users"
                  type="number"
                  value={form.max_users}
                  onChange={(e) => setForm({ ...form, max_users: +e.target.value })}
                />
                <Input
                  label="Max Order/Bulan"
                  name="max_orders_per_month"
                  type="number"
                  value={form.max_orders_per_month}
                  onChange={(e) => setForm({ ...form, max_orders_per_month: +e.target.value })}
                />
                <Input
                  label="Max Outlet"
                  name="max_outlets"
                  type="number"
                  value={form.max_outlets}
                  onChange={(e) => setForm({ ...form, max_outlets: +e.target.value })}
                />
              </div>
              <Input
                label="Trial (hari)"
                name="trial_days"
                type="number"
                value={form.trial_days}
                onChange={(e) => setForm({ ...form, trial_days: +e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fitur</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(form.features).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            features: { ...form.features, [key]: e.target.checked },
                          })
                        }
                        className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-sm text-slate-600 capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" loading={saving} className="flex-1">
                  {editing ? "Update" : "Simpan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Plans List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-slate-800">{plan.label}</h3>
              <p className="text-xs text-slate-400">{plan.name}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Bulanan</span>
                <span className="font-semibold">{formatRupiah(plan.price_monthly)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tahunan</span>
                <span className="font-semibold">{formatRupiah(plan.price_yearly)}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">User</span>
                  <span>{plan.max_users === 0 ? "Unlimited" : plan.max_users}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Order/Bulan</span>
                  <span>{plan.max_orders_per_month === 0 ? "Unlimited" : plan.max_orders_per_month}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Outlet</span>
                  <span>{plan.max_outlets === 0 ? "Unlimited" : plan.max_outlets}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Trial</span>
                  <span>{plan.trial_days} hari</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-2 mt-2">
                <div className="flex flex-wrap gap-1">
                  {Object.entries(plan.features)
                    .filter(([, v]) => v)
                    .map(([k]) => (
                      <span key={k} className="px-2 py-0.5 bg-brand-50 text-brand-600 text-xs rounded-full">
                        {k}
                      </span>
                    ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => handleEdit(plan)} variant="outline" size="sm" className="flex-1">
                Edit
              </Button>
              <Button onClick={() => handleDelete(plan.id)} variant="danger" size="sm">
                Hapus
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-slate-500">Belum ada plan. Klik &quot;+ Tambah Plan&quot; untuk membuat.</p>
        </Card>
      )}
    </div>
  );
}
