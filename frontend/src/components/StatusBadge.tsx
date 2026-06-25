import type { OrderStatus } from "@/lib/types";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/constants";

// ==========================================================
// StatusBadge — penanda status cucian dengan warna khas tiap tahap.
// ==========================================================

interface StatusBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        style.bg,
        style.text,
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
      ].join(" ")}
    >
      <span className={["h-1.5 w-1.5 rounded-full", style.dot].join(" ")} />
      {STATUS_LABEL[status]}
    </span>
  );
}
