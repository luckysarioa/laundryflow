import { ReactNode } from "react";

// ==========================================================
// StatCard — kartu statistik untuk dashboard.
// ==========================================================

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "brand" | "emerald" | "amber" | "purple" | "slate";
}

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  brand: "from-brand-500 to-accent-500",
  emerald: "from-emerald-500 to-teal-500",
  amber: "from-amber-500 to-orange-500",
  purple: "from-purple-500 to-fuchsia-500",
  slate: "from-slate-500 to-slate-600",
};

export function StatCard({ label, value, hint, icon, tone = "brand" }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-800 truncate">{value}</p>
          {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
        </div>
        {icon && (
          <div
            className={[
              "h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br text-white flex items-center justify-center",
              toneClasses[tone],
            ].join(" ")}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
