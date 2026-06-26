"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Subscription } from "@/lib/types";

// ==========================================================
// SubscriptionBanner — tampilkan peringatan trial/expired
// di atas dashboard atau halaman lain.
// ==========================================================

export function SubscriptionBanner() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    api.getSubscription()
      .then((data) => setSubscription(data.subscription))
      .catch(() => {});
  }, []);

  if (!subscription) return null;

  // Trial expiring soon (3 hari atau kurang)
  if (subscription.status === "trial" && subscription.days_until_expiry !== null && subscription.days_until_expiry <= 3) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Trial berakhir {subscription.days_until_expiry} hari lagi</p>
            <p className="text-xs text-blue-100">Upgrade ke Pro untuk tetap menggunakan semua fitur.</p>
          </div>
          <button
            onClick={() => router.push("/subscription")}
            className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  // Expired
  if (subscription.status === "expired") {
    return (
      <div className="rounded-xl bg-gradient-to-r from-red-500 to-rose-500 p-4 text-white mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Subscription telah berakhir</p>
            <p className="text-xs text-red-100">Beberapa fitur terkunci. Perpanjang untuk melanjutkan.</p>
          </div>
          <button
            onClick={() => router.push("/subscription")}
            className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            Perpanjang
          </button>
        </div>
      </div>
    );
  }

  // Past due
  if (subscription.status === "past_due") {
    return (
      <div className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Pembayaran tertunggak</p>
            <p className="text-xs text-amber-100">Silakan lakukan pembayaran untuk melanjutkan langganan.</p>
          </div>
          <button
            onClick={() => router.push("/subscription")}
            className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50"
          >
            Bayar
          </button>
        </div>
      </div>
    );
  }

  // No subscription yet
  if (subscription.status === "none") {
    return (
      <div className="rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Coba LaundryFlow Pro gratis</p>
            <p className="text-xs text-slate-500">7 hari akses penuh, tanpa kartu kredit.</p>
          </div>
          <button
            onClick={() => router.push("/subscription")}
            className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Aktifkan
          </button>
        </div>
      </div>
    );
  }

  return null;
}
