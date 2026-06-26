import type { OrderStatus, Role } from "./types";

// ==========================================================
// Konstanta aplikasi LaundryFlow
// ==========================================================

/** Alur status cucian sesuai PRD poin 5. Urutan = urutan tahapan. */
export const STATUS_FLOW: OrderStatus[] = [
  "antrian",
  "cuci",
  "setrika",
  "siap",
  "diambil",
];

/** Status yang dianggap "masih diproses" (belum diambil customer). */
export const ACTIVE_STATUSES: OrderStatus[] = ["antrian", "cuci", "setrika", "siap"];

/** Label tampilan untuk tiap status. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  antrian: "Antrian",
  cuci: "Cuci",
  setrika: "Setrika",
  siap: "Siap Diambil",
  diambil: "Diambil",
};

/** Konfigurasi warna tiap status (kelas Tailwind untuk Badge dsb.). */
export const STATUS_STYLE: Record<
  OrderStatus,
  { bg: string; text: string; dot: string; hex: string }
> = {
  antrian: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-500", hex: "#94a3b8" },
  cuci: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", hex: "#3b82f6" },
  setrika: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500", hex: "#a855f7" },
  siap: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", hex: "#10b981" },
  diambil: { bg: "bg-slate-200", text: "text-slate-600", dot: "bg-slate-400", hex: "#64748b" },
};

/** Definisi role. */
export const ROLES: Record<Role, string> = {
  pemilik: "Pemilik",
  kasir: "Kasir",
  superadmin: "Super Admin",
};

/** Kunci penyimpanan session di localStorage. */
export const AUTH_STORAGE_KEY = "laundryflow_session";

/** Nama aplikasi & metadata PWA. */
export const APP_NAME = "LaundryFlow";
export const APP_TAGLINE = "Manajemen Laundry UMKM";

/**
 * Status berikutnya dalam alur. Berguna untuk tombol "Maju ke ...".
 * Mengembalikan null jika sudah di status terakhir.
 */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(status);
  return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
}
