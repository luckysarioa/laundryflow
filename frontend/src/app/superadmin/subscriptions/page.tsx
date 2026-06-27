"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatRupiah } from "@/lib/format";

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
  { id: 1, name: "free", label: "Free", price_monthly: 0, price_yearly: 0, max_users: 1, max_orders_per_month: 100, max_outlets: 1, features: { pdf: false, wa: false, backup: false, kanban: true }, trial_days: 0, subscribers: 4 },
  { id: 2, name: "pro", label: "Pro", price_monthly: 99000, price_yearly: 990000, max_users: 3, max_orders_per_month: 0, max_outlets: 3, features: { pdf: true, wa: true, backup: true, kanban: true }, trial_days: 7, subscribers: 6 },
  { id: 3, name: "enterprise", label: "Enterprise", price_monthly: 299000, price_yearly: 2990000, max_users: 0, max_orders_per_month: 0, max_outlets: 0, features: { pdf: true, wa: true, backup: true, kanban: true, multi_outlet: true }, trial_days: 14, subscribers: 2 },
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
    <div className="space-y-5">
      <PageHeader
        title="Subscription Plans"
        subtitle="Kelola harga dan fitur paket"
        action={<Button>+ Add Plan</Button>}
      />

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} padding="lg">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">{plan.label}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-800">
                  {plan.price_monthly === 0 ? "Free" : formatRupiah(plan.price_monthly)}
                </span>
                {plan.price_monthly > 0 && <span className="text-sm text-slate-500">/bln</span>}
              </div>
              {plan.price_yearly > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  {formatRupiah(plan.price_yearly)}/thn (hemat{" "}
                  {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)
                </p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <PlanSpec label="Max Users" value={plan.max_users === 0 ? "Unlimited" : String(plan.max_users)} />
              <PlanSpec label="Orders/Bulan" value={plan.max_orders_per_month === 0 ? "Unlimited" : String(plan.max_orders_per_month)} />
              <PlanSpec label="Outlets" value={plan.max_outlets === 0 ? "Unlimited" : String(plan.max_outlets)} />
              <PlanSpec label="Trial Days" value={String(plan.trial_days)} />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 mb-2">Fitur:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(plan.features).map(([key, enabled]) => (
                  <Badge key={key} color={enabled ? "emerald" : "slate"}>
                    {enabled ? "✓" : "✗"} {key}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-600">
                <span className="font-semibold">{plan.subscribers}</span> subscriber
              </p>
            </div>

            <Button variant="outline" fullWidth className="mt-4">
              Edit Plan
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PlanSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

