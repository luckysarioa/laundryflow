// ==========================================================
// Helper format — locale Indonesia (id-ID)
// ==========================================================

/** Format angka ke Rupiah, mis. 25000 -> "Rp 25.000". */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Versi ringkas untuk angka besar, mis. 1.250.000 -> "Rp 1,25 jt". */
export function formatRupiahRingkas(value: number): string {
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)} jt`;
  }
  if (value >= 1_000) {
    return `Rp ${(value / 1_000).toFixed(0)} rb`;
  }
  return formatRupiah(value);
}

/** Format tanggal lengkap, mis. "Selasa, 25 Jun 2025". */
export function formatTanggal(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format tanggal pendek untuk label chart, mis. "25 Jun". */
export function formatTanggalPendek(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

/** Format jam, mis. "14.30". */
export function formatJam(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Hari ini" / "Kemarin" / tanggal. */
export function formatRelative(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor(
    (today.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86_400_000,
  );
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} hari lalu`;
  return formatTanggalPendek(iso);
}

/** Normalisasi nomor HP ke format wa.me (62...). */
export function toWaNumber(no_hp: string): string {
  let cleaned = no_hp.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
  if (cleaned.startsWith("8")) cleaned = "62" + cleaned;
  return cleaned;
}

/**
 * Bangun URL absolut untuk file di storage publik backend.
 *
 * `path` = jalur relatif dari backend (mis. "orders/5/abc.jpg"),
 * `apiUrl` = NEXT_PUBLIC_API_URL yang berakhiran /api (mis. "https://api.domain.com/api").
 *
 * Origin di-strip dari suffix /api agar URL benar:
 *   "https://api.domain.com/api" + "orders/5/x.jpg"
 *   → "https://api.domain.com/storage/orders/5/x.jpg"
 *
 * Bila apiUrl relatif (mode proxy internal "/api") → "/storage/orders/5/x.jpg".
 */
export function storageUrl(path: string, apiUrl?: string): string {
  if (!path) return "";
  // Bila path sudah absolut (http/...), atau blob:/data: (preview upload lokal),
  // pakai apa adanya — jangan di-prefix /storage.
  if (/^(https?:|blob:|data:)/i.test(path)) return path;

  const base = (apiUrl ?? "").replace(/\/api\/?$/, "").replace(/\/$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${base}/storage/${cleanPath}`;
}
