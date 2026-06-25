"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

// ==========================================================
// Toast — notifikasi singkat muncul di bawah layar.
// Pakai: const toast = useToast(); toast.success("Tersimpan!");
// ==========================================================

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam ToastProvider");
  return ctx;
}

const typeStyle: Record<ToastType, string> = {
  success: "bg-emerald-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-slate-800 text-white",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, type, message }]);
      setTimeout(() => remove(id), 3200);
    },
    [remove],
  );

  const ctx: ToastContextValue = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Container */}
      <div className="fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {items.map((item) => (
          <ToastView key={item.id} item={item} onClose={() => remove(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className={[
        "pointer-events-auto max-w-sm w-full sm:w-auto rounded-xl shadow-lg px-4 py-3 text-sm font-medium",
        "transition-all duration-200",
        typeStyle[item.type],
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      ].join(" ")}
      role="alert"
      onClick={onClose}
    >
      {item.message}
    </div>
  );
}
