import { SelectHTMLAttributes, forwardRef } from "react";

// ==========================================================
// Select dropdown dengan label & error.
// ==========================================================

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className = "", id, children, ...props },
  ref,
) {
  const selectId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={[
            "w-full h-11 rounded-xl border bg-white px-3 pr-9 text-sm text-slate-900 appearance-none",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition",
            error ? "border-red-400 focus:ring-red-500/40 focus:border-red-500" : "border-slate-300",
            className,
          ].join(" ")}
          {...props}
        >
          {children}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
