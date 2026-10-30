'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ToastTone = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve?: (accepted: boolean) => void;
};

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  confirm: (message: string, options?: { confirmLabel?: string; cancelLabel?: string }) => Promise<boolean>;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClasses: Record<ToastTone, string> = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
};

function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string, accepted: boolean) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[110] flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg ${toneClasses[item.tone]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{item.message}</p>
            {!item.resolve && (
              <button
                type="button"
                onClick={() => onDismiss(item.id, false)}
                className="shrink-0 text-xs font-semibold opacity-70 hover:opacity-100"
                aria-label="Dismiss"
              >
                ✕
              </button>
            )}
          </div>
          {item.resolve && (
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-current px-3 py-1 text-xs font-medium"
                onClick={() => onDismiss(item.id, false)}
              >
                {item.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                className="rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white"
                onClick={() => onDismiss(item.id, true)}
              >
                {item.confirmLabel || 'Confirm'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string, accepted: boolean) => {
    setToasts((prev) => {
      const item = prev.find((toast) => toast.id === id);
      item?.resolve?.(accepted);
      return prev.filter((toast) => toast.id !== id);
    });
  }, []);

  const push = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { ...item, id }]);
    if (!item.resolve) {
      window.setTimeout(() => dismiss(id, false), 5000);
    }
    return id;
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(() => ({
    success: (message) => { push({ message, tone: 'success' }); },
    error: (message) => { push({ message, tone: 'error' }); },
    info: (message) => { push({ message, tone: 'info' }); },
    confirm: (message, options) => new Promise((resolve) => {
      push({
        message,
        tone: 'info',
        confirmLabel: options?.confirmLabel,
        cancelLabel: options?.cancelLabel,
        resolve,
      });
    }),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
