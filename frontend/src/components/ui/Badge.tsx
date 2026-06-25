import { HTMLAttributes } from "react";

// ==========================================================
// Badge — penanda kecil (mis. status, tipe pembayaran).
// ==========================================================

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: "slate" | "blue" | "purple" | "emerald" | "amber" | "red" | "cyan";
}

const colorClasses: Record<NonNullable<BadgeProps["color"]>, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  cyan: "bg-cyan-100 text-cyan-700",
};

export function Badge({ color = "slate", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClasses[color],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
