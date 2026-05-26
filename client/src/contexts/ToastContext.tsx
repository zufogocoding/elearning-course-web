'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastId = 0;

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const configs = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      bg: 'bg-emerald-500',
      border: 'border-emerald-400',
    },
    error: {
      icon: <XCircle className="w-4 h-4" />,
      bg: 'bg-rose-500',
      border: 'border-rose-400',
    },
    info: {
      icon: <Info className="w-4 h-4" />,
      bg: 'bg-indigo-500',
      border: 'border-indigo-400',
    },
  };

  const cfg = configs[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-xl border ${cfg.bg} ${cfg.border} animate-in slide-in-from-bottom-2 fade-in duration-300`}
      style={{ minWidth: '280px', maxWidth: '400px' }}
    >
      {cfg.icon}
      <span className="flex-1">{toast.message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
