import { FC } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Toast: FC = () => {
  const notificationQueue = useTaskStore((state) => state.notificationQueue);
  const dismissNotification = useTaskStore((state) => state.dismissNotification);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
      <AnimatePresence>
        {notificationQueue.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto"
          >
            <div
              className={`
                flex items-center gap-3 p-4 rounded-lg shadow-lg border
                ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-900' : ''}
                ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-900' : ''}
                ${toast.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-900' : ''}
                ${toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-900' : ''}
              `}
              role="alert"
              aria-live="polite"
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {toast.type === 'success' && <span className="text-xl">✓</span>}
                {toast.type === 'error' && <span className="text-xl">✕</span>}
                {toast.type === 'warning' && <span className="text-xl">⚠</span>}
                {toast.type === 'info' && <span className="text-xl">ℹ</span>}
              </div>

              {/* Message */}
              <div className="flex-1 text-sm font-medium">
                {toast.message}
              </div>

              {/* Close Button */}
              <button
                onClick={() => dismissNotification(toast.id)}
                className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
