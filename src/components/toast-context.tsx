"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType, duration?: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info", duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3 rounded-lg border p-4 shadow-lg 
              transition-all duration-300 ease-out translate-y-0 opacity-100
              ${t.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : ""}
              ${t.type === "error" ? "bg-rose-50 border-rose-200 text-rose-900" : ""}
              ${t.type === "info" ? "bg-white border-outline text-ink" : ""}
            `}
            style={{ animation: "0.2s ease-out 0s 1 normal none running slideUp" }}
          >
            {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
            {t.type === "error" && <XCircle className="h-5 w-5 text-rose-600 shrink-0" />}
            {t.type === "info" && <Info className="h-5 w-5 text-ink-lighter shrink-0" />}
            
            <span className="text-sm font-medium">{t.message}</span>
            
            <button 
              onClick={() => removeToast(t.id)}
              className="ml-auto rounded-full p-1 hover:bg-black/5 transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4 opacity-50" />
            </button>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
