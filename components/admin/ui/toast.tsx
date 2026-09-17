"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type ToastTone = "success" | "error" | "info";
type ToastInput = { message: string; tone?: ToastTone };
type ToastItem = { id: number; message: string; tone: ToastTone };

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});

const ICONS = { success: CheckCircle2, error: TriangleAlert, info: Info };
const ICON_COLORS = { success: "text-brand-600", error: "text-red-600", info: "text-sky-600" };

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    ({ message, tone = "success" }: ToastInput) => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-3), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 8000 : 5000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-sm shadow-lg"
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${ICON_COLORS[toast.tone]}`} aria-hidden />
              <p className="flex-1 text-slate-800">{toast.message}</p>
              <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)} className="rounded-md p-0.5 text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/** Shows a toast once after a redirect (e.g. ?saved=1), then drops the flag from the URL. */
export function FlashToast({ message, tone = "success", cleanHref }: { message: string; tone?: ToastTone; cleanHref: string }) {
  const toast = useToast();
  const router = useRouter();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    toast({ message, tone });
    router.replace(cleanHref, { scroll: false });
  }, [toast, router, message, tone, cleanHref]);

  return null;
}
