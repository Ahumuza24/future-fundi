import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { useToastStore } from '@/lib/toast';

const toneStyles = {
  success: {
    border: 'border-[var(--fundi-lime)]/40',
    iconBg: 'bg-[var(--fundi-lime)]',
    icon: CheckCircle2,
  },
  error: {
    border: 'border-[var(--fundi-red)]/40',
    iconBg: 'bg-[var(--fundi-red)]',
    icon: AlertTriangle,
  },
  info: {
    border: 'border-[var(--fundi-cyan)]/40',
    iconBg: 'bg-[var(--fundi-cyan)]',
    icon: Info,
  },
} as const;

export default function BrandToasts() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="fixed top-20 right-4 z-[100] w-full max-w-sm space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((item) => {
          const tone = toneStyles[item.type];
          const Icon = tone.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={`pointer-events-auto rounded-xl border bg-white shadow-lg ${tone.border}`}
            >
              <div className="p-3 pr-2 flex gap-3">
                <div className={`mt-0.5 h-7 w-7 rounded-full ${tone.iconBg} text-white flex items-center justify-center`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--fundi-black)]">{item.title}</p>
                  <p className="text-xs text-gray-600 whitespace-pre-line">{item.message}</p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(item.id)}
                  className="h-6 w-6 rounded-md text-gray-400 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
