"use client";

import { useState } from "react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

// ==========================================================
// InstallPrompt — banner/toast yang menawarkan install PWA.
//
// Muncul ketika:
// 1. Chrome/Android kirim beforeinstallprompt (canInstall=true) → tombol Install
// 2. iOS (isIOS=true, belum installed) → petunjuk Share → Add to Home Screen
//
// Dismiss disimpan di localStorage supaya tidak mengganggu user yang
// sudah menolak. Tidak muncul kalau sudah ter-install.
// ==========================================================

export function InstallPrompt() {
  const { canInstall, isInstalled, isIOS, promptInstall, dismiss } = usePwaInstall();
  const [installing, setInstalling] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  // Sudah ter-install → tidak perlu banner.
  if (isInstalled) return null;

  // iOS: tidak ada API install. Tampilkan petunjuk manual (sekali per session,
  // tidak disimpan permanen agar bisa muncul lagi lain waktu).
  if (isIOS && !showIOSHint) {
    // Munculkan hint iOS setelah delay singkat hanya sekali.
    setTimeout(() => setShowIOSHint(true), 1500);
  }

  async function handleInstall() {
    setInstalling(true);
    const result = await promptInstall();
    setInstalling(false);
    if (result === "accepted") {
      dismiss(); // sembunyikan setelah install
    }
  }

  // Banner install Chrome/Android.
  if (canInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-4 animate-[slideUp_0.3s_ease-out]">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-600 flex items-center justify-center text-white text-lg">
            📲
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Pasang LaundryFlow</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Akses lebih cepat & bisa dipakai offline dari layar utama.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {installing ? "Memasang..." : "Pasang"}
              </button>
              <button
                onClick={dismiss}
                className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Nanti
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hint iOS (Share → Add to Home Screen).
  if (isIOS && showIOSHint) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-600 flex items-center justify-center text-white text-lg">
            📲
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Pasang LaundryFlow</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Ketuk tombol{" "}
              <span className="inline-flex items-center font-medium">
                Share
                <svg className="inline h-3 w-3 mx-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                </svg>
              </span>{" "}
              di Safari, lalu pilih{" "}
              <span className="font-medium">Add to Home Screen</span>.
            </p>
            <button
              onClick={() => setShowIOSHint(false)}
              className="mt-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100"
            >
              Mengerti
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
