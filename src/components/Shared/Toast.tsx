import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToasts, toastService } from '@/lib/toastService';

export default function ToastContainer() {
  const toasts = useToasts();

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`pointer-events-auto glass p-4 rounded-2xl flex items-center gap-3 shadow-xl border-l-[6px] ${
              toast.type === 'success' ? 'border-l-gwf-success' :
              toast.type === 'error' ? 'border-l-gwf-error' :
              toast.type === 'warning' ? 'border-l-gwf-warning' :
              'border-l-gwf-primary'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${
              toast.type === 'success' ? 'bg-gwf-success/10 text-gwf-success' :
              toast.type === 'error' ? 'bg-gwf-error/10 text-gwf-error' :
              toast.type === 'warning' ? 'bg-gwf-warning/10 text-gwf-warning' :
              'bg-gwf-primary/10 text-gwf-primary'
            }`}>
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'warning' && <AlertTriangle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            <p className="text-sm font-bold text-gwf-text italic">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
