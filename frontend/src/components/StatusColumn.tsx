import Link from "next/link";
import type { Order } from "@/lib/types";
import { formatRupiah } from "@/lib/format";

// ==========================================================
// StatusColumn — satu kolom di kanban Status Board.
// Mobile: tampil sebagai kolom vertikal yang discroll horizontal.
// ==========================================================

interface StatusColumnProps {
  title: string;
  hex: string;
  orders: Order[];
}

export function StatusColumn({ title, hex, orders }: StatusColumnProps) {
  return (
    <div className="w-72 shrink-0 flex flex-col">
      {/* Header kolom */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hex }} />
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {orders.length}
        </span>
      </div>

      {/* Kartu order */}
      <div className="flex-1 space-y-2 min-h-[60px]">
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-300">
            Kosong
          </div>
        ) : (
          orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`}>
              <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-3 hover:border-brand-300 hover:shadow transition cursor-pointer">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-brand-600">#{o.id}</span>
                  <span className="text-[11px] text-slate-400">{o.total_berat} kg</span>
                </div>
                <p className="text-sm font-medium text-slate-800 truncate">{o.customer?.nama}</p>
                <p className="text-[11px] text-slate-400 truncate mb-2">{o.service?.nama_layanan}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">{formatRupiah(o.total_harga)}</span>
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: hex }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
