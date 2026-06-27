"use client";

import { useCallback, useEffect, useState } from "react";

// ==========================================================
// usePwaInstall — hook untuk mengelola PWA install prompt.
//
// Chrome/Android hanya kirim event 'beforeinstallprompt' kalau app
// memenuhi installability criteria (manifest + icons + SW + HTTPS).
// Auto-prompt bisa tidak muncul karena heuristik engagement/riwayat
// diskad. Hook ini menangkap event lalu men-expose trigger manual
// via tombol/banner — jauh lebih reliable dari auto-prompt.
//
// iOS Safari TIDAK mengirim beforeinstallprompt (tidak ada API install).
// Petunjuk: pengguna iOS pakai Share → Add to Home Screen manual.
// ==========================================================

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

interface PwaInstallState {
  /** Bisa di-install & prompt siap dipanggil. */
  canInstall: boolean;
  /** Sudah ter-install (display-mode: standalone). */
  isInstalled: boolean;
  /** Perangkat iOS — perlu petunjuk manual (tidak ada API install). */
  isIOS: boolean;
  /** Tampilkan prompt install native (panggil dari tombol). */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  /** Tutup/dismiss banner (disimpan di localStorage agar tidak mengganggu). */
  dismiss: () => void;
  /** User pernah diskad (untuk hide banner permanen). */
  isDismissed: boolean;
}

const DISMISS_KEY = "laundryflow_pwa_install_dismissed";

export function usePwaInstall(): PwaInstallState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Deteksi iOS (untuk petunjuk manual Share → Add to Home Screen).
  const isIOS = typeof window !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  useEffect(() => {
    // Cek apakah sudah dismissed sebelumnya.
    try {
      setIsDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* localStorage mungkin tidak tersedia (incognito). */
    }

    // Deteksi mode standalone (sudah ter-install).
    const checkStandalone = () => {
      setIsInstalled(
        window.matchMedia("(display-mode: standalone)").matches ||
          // iOS Safari pakai navigator.standalone.
          (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
      );
    };
    checkStandalone();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", checkStandalone);

    // Tangkap event install — disimpan, dipanggil saat user klik tombol.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // cegah auto-prompt lama (kontrol penuh via UI kita)
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferred(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      mq.removeEventListener("change", checkStandalone);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    if (!deferred) return "unavailable";
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome;
  }, [deferred]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* abaikan */
    }
    setIsDismissed(true);
    setDeferred(null);
  }, []);

  return {
    canInstall: !!deferred && !isDismissed,
    isInstalled,
    isIOS,
    promptInstall,
    dismiss,
    isDismissed,
  };
}
