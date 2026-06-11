import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ToastType, ToastItem } from '../../types/toast';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

/** Individual toast notification with icon, message, and close button. */
export const Toast = memo(function Toast({ message, type, onClose }: ToastProps) {
  return (
    <motion.div
      role={type === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className={`z-[200] flex items-center gap-3 px-4 py-2.5 rounded-sm shadow-2xl border backdrop-blur-md ${
        type === 'success'
          ? 'bg-[var(--rf-forest)]/90 border-[var(--rf-volt)]/30 text-[var(--rf-volt)]'
          : type === 'warning'
          ? 'bg-[var(--rf-forest)]/90 border-[var(--rf-warn)]/30 text-[var(--rf-warn)]'
          : 'bg-[var(--rf-ember)]/10 border-[var(--rf-ember)]/30 text-[var(--rf-ember)]'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertCircle size={16} aria-hidden="true" />}
      <span className="text-sm font-medium font-sans">{message}</span>
      <button onClick={onClose} aria-label="Close notification" className="ml-2 hover:opacity-70 transition-opacity cursor-pointer">
        <X size={14} aria-hidden="true" />
      </button>
    </motion.div>
  );
});

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

/** Container that renders a stack of toast notifications. */
export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col-reverse items-center gap-2 z-[200]">
      {/* Static live region for accessibility */}
      <div
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions text"
        className="sr-only"
        id="toast-announcer"
      >
        {toasts.map(t => (
          <span key={t.id}>{t.message}</span>
        ))}
      </div>

      <AnimatePresence>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => onRemove(t.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
