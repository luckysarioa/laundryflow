// ==========================================================
// Spinner — indikator loading inline.
// ==========================================================

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 20, className = "" }: SpinnerProps) {
  return (
    <svg
      className={["animate-spin text-brand-500", className].join(" ")}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Memuat"
      role="status"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
    </svg>
  );
}

/** State loading layar penuh untuk halaman. */
export function FullPageSpinner({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Spinner size={32} />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}
