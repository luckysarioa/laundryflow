"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

// ==========================================================
// Subscriptions Management — kelola paket langganan.
// ==========================================================

interface Plan {
  id: number;
  name: string;
  label: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_orders_per_month: number;
  max_outlets: number;
  features: Record<string, boolean>;
  trial_days: number;
  subscribers: number;
}

// Mock data
const MOCK_PLANS: Plan[] = [
  {
    id: 1,
    name: "free",
    label: "Free",
    price_monthly: 0,
    price_yearly: 0,
    max_users: 1,
    max_orders_per_month: 100,
    max_outlets: 1,
    features: { pdf: false, wa: false, backup: false, kanban: true },
    trial_days: 0,
    subscribers: 4,
  },
  {
    id: 2,
    name: "pro",
    label: "Pro",
    price_monthly: 99000,
    price_yearly: 990000,
    max_users: 3,
    max_orders_per_month: 0,
    max_outlets: 3,
    features: { pdf: true, wa: true, backup: true, kanban: true },
    trial_days: 7,
    subscribers: 6,
  },
  {
    id: 3,
    name: "enterprise",
    label: "Enterprise",
    price_monthly: 299000,
    price_yearly: 2990000,
    max_users: 0,
    max_orders_per_month: 0,
    max_outlets: 0,
    features: { pdf: true, wa: true, backup: true, kanban: true, multi_outlet: true },
    trial_days: 14,
    subscribers: 2,
  },
];

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setPlans(MOCK_PLANS);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
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
          <h2 className="text-2xl font-bold text-slate-800">Subscription Plans</h2>
          <p className="text-sm text-slate-500">Manage pricing and features</p>
        </div>
        <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition">
          + Add Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} padding="md">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">{plan.label}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-800">
                  {plan.price_monthly === 0 ? "Free" : `Rp ${plan.price_monthly.toLocaleString("id-ID")}`}
                </span>
                {plan.price_monthly > 0 && (
                  <span className="text-sm text-slate-500">/month</span>
                )}
              </div>
              {plan.price_yearly > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  Rp {plan.price_yearly.toLocaleString("id-ID")}/year (save {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)
                </p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Max Users</span>
                <span className="font-medium text-slate-800">{plan.max_users === 0 ? "Unlimited" : plan.max_users}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Orders/Month</span>
                <span className="font-medium text-slate-800">{plan.max_orders_per_month === 0 ? "Unlimited" : plan.max_orders_per_month}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Outlets</span>
                <span className="font-medium text-slate-800">{plan.max_outlets === 0 ? "Unlimited" : plan.max_outlets}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Trial Days</span>
                <span className="font-medium text-slate-800">{plan.trial_days}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 mb-2">Features:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(plan.features).map(([key, enabled]) => (
                  <span
                    key={key}
                    className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {enabled ? "✓" : "✗"} {key}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-600">
                <span className="font-semibold">{plan.subscribers}</span> subscribers
              </p>
            </div>

            <button className="mt-4 w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
              Edit Plan
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
