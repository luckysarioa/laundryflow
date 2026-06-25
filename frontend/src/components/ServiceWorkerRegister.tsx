"use client";

import { useEffect } from "react";

// ==========================================================
// Mendaftarkan service worker setelah load (client-only).
// Sesuai PRD poin 7: offline capability via Service Workers.
// ==========================================================

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      // Hanya register di production agar dev server tidak ter-cache.
      return;
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Gagal register tidak fatal; app tetap berjalan online.
      });
    };
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
