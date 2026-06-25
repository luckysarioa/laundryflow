import { HTMLAttributes } from "react";

// ==========================================================
// Card — wadah konten bersih dengan sudut membulat & shadow halus.
// ==========================================================

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export function Card({ padding = "md", className = "", children, ...props }: CardProps) {
  return (
    <div
      className={[
        "bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/40",
        paddingClasses[padding],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["mb-3 flex items-center justify-between gap-2", className].join(" ")} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={["text-sm font-semibold text-slate-800", className].join(" ")} {...props}>
      {children}
    </h3>
  );
}
