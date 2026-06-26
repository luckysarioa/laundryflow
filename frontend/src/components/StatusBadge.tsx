import type { OrderStatus } from "@/lib/types";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/constants";

// ==========================================================
// StatusBadge — penanda status cucian dengan warna khas tiap tahap.
// ==========================================================

interface StatusBadgeProps {
  status: OrderStatus | string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const style = STATUS_STYLE[status as OrderStatus] ?? {
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
    hex: "#64748b",
  };
  const label = STATUS_LABEL[status as OrderStatus] ?? status;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        style.bg,
        style.text,
        size === "sm" ? "px-2.5 py-0.5 text-xs" :
        size === "lg" ? "px-4 py-1.5 text-base" :
        "px-3 py-1 text-sm",
      ].join(" ")}
    >
      <span className={["h-1.5 w-1.5 rounded-full", style.dot].join(" ")} />
      {label}
    </span>
  );
}
