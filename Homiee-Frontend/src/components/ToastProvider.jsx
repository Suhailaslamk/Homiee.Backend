import React, { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import { ToastContext } from './toast-context';

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    accent: 'text-emerald-600',
    surface: 'border-emerald-200 bg-emerald-50',
  },
  error: {
    icon: CircleAlert,
    accent: 'text-rose-600',
    surface: 'border-rose-200 bg-rose-50',
  },
  info: {
    icon: Info,
    accent: 'text-[#b85c38]',
    surface: 'border-[#e7c0b1] bg-[#fff1e8]',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    // Check for existing toast with same message to prevent duplication
    setToasts((current) => {
      const isDuplicate = current.some((toast) => toast.message === message);
      if (isDuplicate) return current;

      const id = crypto.randomUUID();
      
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 3500);

      return [...current, { id, message, type }];
    });
  }, []);

  const value = useMemo(() => ({
    success: (message) => showToast(message, 'success'),
    error: (message) => showToast(message, 'error'),
    info: (message) => showToast(message, 'info'),
  }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto overflow-hidden rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${style.surface}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 ${style.accent}`} size={18} />
                <p className="flex-1 text-sm font-medium text-slate-700">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 transition hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
