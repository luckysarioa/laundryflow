"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Plan, Subscription, SubscriptionResponse } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/format";

// ==========================================================
// Subscription page — manage plan, view status, upgrade.
// ==========================================================

export default function SubscriptionPage() {
  const toast = useToast();
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [purchasing, setPurchasing] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.getSubscription());
    } catch {
      toast.error("Gagal memuat data subscription.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleActivateTrial() {
    try {
      await api.activateTrial();
      toast.success("Trial 7 hari berhasil diaktifkan!");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengaktifkan trial.");
    }
  }

  async function handlePurchase(plan: Plan) {
    setPurchasing(plan.id);
    try {
      const result = await api.checkoutSubscription({
        plan_id: plan.id,
        billing,
        method: "qris",
      });
      // Redirect to payment page
      if (result.redirect_url && result.redirect_url !== "#mock-payment") {
        window.location.href = result.redirect_url;
      } else {
        toast.success("Pembayaran berhasil! (demo)");
        load();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses pembayaran.");
    } finally {
      setPurchasing(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Batalkan subscription? Anda akan kehilangan akses fitur Pro.")) return;
    try {
      await api.cancelSubscription();
      toast.success("Subscription dibatalkan.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membatalkan.");
    }
  }

  if (loading) {
    return (
      <>
        <AppHeader title="Subscription" back />
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      </>
    );
  }

  const subscription = data?.subscription;
  const plans = data?.plans ?? [];

  return (
    <>
      <AppHeader title="Subscription" subtitle="Kelola langganan Anda" back />

      <div className="space-y-4">
        {/* Current Status */}
        {subscription && (
          <CurrentStatus subscription={subscription} onCancel={handleCancel} />
        )}

        {/* No subscription - show trial */}
        {!subscription && (
          <Card>
            <div className="text-center py-4">
              <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">Mulai dengan Trial Gratis</h3>
              <p className="text-sm text-slate-500 mb-4">Coba fitur Pro selama 7 hari tanpa kartu kredit.</p>
              <Button onClick={handleActivateTrial}>Aktifkan Trial 7 Hari</Button>
            </div>
          </Card>
        )}

        {/* Billing toggle */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Pilih Paket</h3>
          <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
            <button
              onClick={() => setBilling("monthly")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                billing === "monthly" ? "bg-white text-slate-800 shadow" : "text-slate-500"
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                billing === "yearly" ? "bg-white text-slate-800 shadow" : "text-slate-500"
              }`}
            >
              Tahunan <span className="text-[10px] text-emerald-600 font-semibold">Hemat 17%</span>
            </button>
          </div>

          <div className="space-y-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billing={billing}
                isCurrent={subscription?.plan?.id === plan.id}
                isTrial={subscription?.status === "trial"}
                loading={purchasing === plan.id}
                onPurchase={() => handlePurchase(plan)}
              />
            ))}
          </div>
        </Card>

        {/* Features comparison */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Perbandingan Fitur</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-slate-500 font-medium">Fitur</th>
                  <th className="text-center py-2 text-slate-500 font-medium">Free</th>
                  <th className="text-center py-2 text-slate-500 font-medium">Pro</th>
                  <th className="text-center py-2 text-slate-500 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <FeatureRow label="Order/bulan" free="100" pro="Unlimited" enterprise="Unlimited" />
                <FeatureRow label="User/Kasir" free="1" pro="3" enterprise="Unlimited" />
                <FeatureRow label="Cabang" free="1" pro="3" enterprise="Unlimited" />
                <FeatureRow label="Laporan PDF" free={false} pro={true} enterprise={true} />
                <FeatureRow label="WhatsApp Notif" free={false} pro={true} enterprise={true} />
                <FeatureRow label="Backup Data" free={false} pro={true} enterprise={true} />
                <FeatureRow label="Multi-Cabang" free={false} pro={false} enterprise={true} />
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function CurrentStatus({
  subscription,
  onCancel,
}: {
  subscription: Subscription;
  onCancel: () => void;
}) {
  const statusColors: Record<string, string> = {
    trial: "blue",
    active: "emerald",
    past_due: "amber",
    expired: "red",
    cancelled: "slate",
  };

  const statusLabels: Record<string, string> = {
    trial: "Trial",
    active: "Aktif",
    past_due: "Perlu Pembayaran",
    expired: "Expired",
    cancelled: "Dibatalkan",
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Status Langganan</h3>
        <Badge color={statusColors[subscription.status] as any}>
          {statusLabels[subscription.status]}
        </Badge>
      </div>

      <div className="rounded-xl bg-slate-50 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Paket</span>
          <span className="text-sm font-medium text-slate-800">{subscription.plan?.label ?? "-"}</span>
        </div>
        {subscription.status === "trial" && subscription.trial_ends_at && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Trial berakhir</span>
            <span className="text-sm text-slate-700">
              {new Date(subscription.trial_ends_at).toLocaleDateString("id-ID", {
                day: "numeric", month: "long", year: "numeric"
              })}
              {subscription.days_until_expiry !== null && (
                <span className="text-xs text-amber-600 ml-1">({subscription.days_until_expiry} hari lagi)</span>
              )}
            </span>
          </div>
        )}
        {subscription.status === "active" && subscription.current_period_end && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Berlaku s/d</span>
            <span className="text-sm text-slate-700">
              {new Date(subscription.current_period_end).toLocaleDateString("id-ID", {
                day: "numeric", month: "long", year: "numeric"
              })}
            </span>
          </div>
        )}
        {subscription.orders_limit > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Order bulan ini</span>
            <span className="text-sm text-slate-700">
              {subscription.orders_used} / {subscription.orders_limit}
            </span>
          </div>
        )}
        {subscription.orders_limit === 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Order bulan ini</span>
            <span className="text-sm text-slate-700">{subscription.orders_used} / Unlimited</span>
          </div>
        )}
      </div>

      {subscription.status === "active" && (
        <div className="mt-3">
          <Button variant="outline" size="sm" fullWidth onClick={onCancel}>
            Batalkan Langganan
          </Button>
        </div>
      )}
    </Card>
  );
}

function PlanCard({
  plan,
  billing,
  isCurrent,
  isTrial,
  loading,
  onPurchase,
}: {
  plan: Plan;
  billing: "monthly" | "yearly";
  isCurrent: boolean;
  isTrial: boolean;
  loading: boolean;
  onPurchase: () => void;
}) {
  const price = billing === "yearly" ? plan.price_yearly : plan.price_monthly;
  const monthlyEquivalent = billing === "yearly" ? Math.round(plan.price_yearly / 12) : plan.price_monthly;
  const isPopular = plan.name === "pro";

  return (
    <div className={`rounded-xl border-2 p-4 transition ${
      isCurrent ? "border-brand-500 bg-brand-50/30" :
      isPopular ? "border-emerald-200 bg-emerald-50/20" :
      "border-slate-200"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">{plan.label}</h4>
          {isPopular && (
            <span className="text-[10px] font-semibold text-emerald-600 uppercase">Paling Populer</span>
          )}
        </div>
        {isCurrent && !isTrial && (
          <Badge color="emerald">Paket Saat Ini</Badge>
        )}
        {isTrial && plan.name === "pro" && (
          <Badge color="blue">Trial</Badge>
        )}
      </div>

      {plan.price_monthly === 0 ? (
        <p className="text-lg font-bold text-slate-800 mb-1">Gratis</p>
      ) : (
        <div className="mb-1">
          <p className="text-lg font-bold text-slate-800">
            {formatRupiah(monthlyEquivalent)}<span className="text-xs font-normal text-slate-500">/bulan</span>
          </p>
          {billing === "yearly" && (
            <p className="text-[11px] text-slate-500">
              {formatRupiah(plan.price_yearly)}/tahun (hemat {formatRupiah((plan.price_monthly * 12) - plan.price_yearly)})
            </p>
          )}
        </div>
      )}

      <ul className="text-xs text-slate-600 space-y-1.5 mb-3">
        <li className="flex items-center gap-2">
          <CheckIcon className="text-emerald-500" />
          {plan.max_orders_per_month === 0 ? "Order unlimited" : `${plan.max_orders_per_month} order/bulan`}
        </li>
        <li className="flex items-center gap-2">
          <CheckIcon className="text-emerald-500" />
          {plan.max_users === 0 ? "User unlimited" : `${plan.max_users} user/kasir`}
        </li>
        <li className="flex items-center gap-2">
          <CheckIcon className="text-emerald-500" />
          {plan.max_outlets === 0 ? "Cabang unlimited" : `${plan.max_outlets} cabang`}
        </li>
        {plan.features.pdf && (
          <li className="flex items-center gap-2"><CheckIcon className="text-emerald-500" /> Laporan PDF</li>
        )}
        {plan.features.wa && (
          <li className="flex items-center gap-2"><CheckIcon className="text-emerald-500" /> WhatsApp Notifikasi</li>
        )}
        {plan.features.backup && (
          <li className="flex items-center gap-2"><CheckIcon className="text-emerald-500" /> Backup Data</li>
        )}
        {plan.features.multi_outlet && (
          <li className="flex items-center gap-2"><CheckIcon className="text-emerald-500" /> Multi-Cabang</li>
        )}
      </ul>

      {!isCurrent && plan.price_monthly > 0 && (
        <Button
          size="sm"
          fullWidth
          loading={loading}
          onClick={onPurchase}
          variant={isPopular ? undefined : "outline"}
        >
          {isTrial && plan.name === "pro" ? "Upgrade ke Pro" : "Pilih Paket Ini"}
        </Button>
      )}
      {isCurrent && !isTrial && (
        <div className="text-center text-xs text-emerald-600 font-medium py-1">
          Aktif
        </div>
      )}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-3.5 w-3.5 ${className ?? ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FeatureRow({
  label, free, pro, enterprise
}: {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}) {
  function renderValue(val: string | boolean) {
    if (typeof val === "boolean") {
      return val ? (
        <CheckIcon className="text-emerald-500 mx-auto" />
      ) : (
        <svg className="h-3.5 w-3.5 text-slate-300 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return <span>{val}</span>;
  }

  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 text-slate-600">{label}</td>
      <td className="py-2 text-center">{renderValue(free)}</td>
      <td className="py-2 text-center">{renderValue(pro)}</td>
      <td className="py-2 text-center">{renderValue(enterprise)}</td>
    </tr>
  );
}
