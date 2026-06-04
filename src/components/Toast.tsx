import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

/** Toast notification type. */
export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

/** Individual toast notification with icon, message, and close button. */
export function Toast({ message, type, onClose }: ToastProps) {
  return (
    <motion.div
      role="alert"
      aria-live="polite"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl border backdrop-blur-md ${
        type === 'success'
          ? 'bg-[var(--rf-forest)]/90 border-[var(--rf-volt)]/30 text-[var(--rf-volt)]'
          : 'bg-[var(--rf-ember)]/10 border-[var(--rf-ember)]/30 text-[var(--rf-ember)]'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} aria-label="Close notification" className="ml-2 hover:opacity-70 transition-opacity">
        <X size={14} />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: { id: string; message: string; type: ToastType }[];
  onRemove: (id: string) => void;
}

/** Container that renders a stack of toast notifications. */
export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none flex flex-col items-center gap-2 p-6 z-[200]">
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
