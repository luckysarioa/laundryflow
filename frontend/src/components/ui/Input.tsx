import { InputHTMLAttributes, forwardRef } from "react";

// ==========================================================
// Input teks dengan label & pesan error.
// ==========================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, prefix, className = "", id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-400 pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full h-11 rounded-xl border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition",
            prefix ? "pl-12" : "",
            error ? "border-red-400 focus:ring-red-500/40 focus:border-red-500" : "border-slate-300",
            className,
          ].join(" ")}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
});
