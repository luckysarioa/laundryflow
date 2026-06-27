import type { ReactNode } from "react";

// ==========================================================
// PageHeader — header standar tiap halaman admin.
// Menghilangkan duplikasi <h1 className="text-2xl font-bold"> + subtitle + aksi.
// ==========================================================

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Slot aksi kanan (mis. tombol tambah, filter). */
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}
