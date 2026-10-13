import React, { useState, useEffect } from 'react';
import { Award, AlertCircle, X } from 'lucide-react';
import { pointsManager, PointNotification } from '../utils/pointsManager';

export const PointsNotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<PointNotification[]>([]);

  useEffect(() => {
    const unsubscribe = pointsManager.subscribeNotifications((notification) => {
      setToasts((prev) => {
        // Prevent duplicate toasts with the exact same ID
        if (prev.some((t) => t.id === notification.id)) return prev;
        // Limit to max 4 visible notifications at once so screen isn't overwhelmed
        const updated = [...prev, notification];
        return updated.slice(-4);
      });

      // Automatically dismiss individual toast after 2.6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== notification.id));
      }, 2600);
    });

    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-16 right-3 sm:top-20 sm:right-6 z-[9999] pointer-events-none flex flex-col gap-2 max-w-sm w-[calc(100vw-1.5rem)] sm:w-auto"
      role="region"
      aria-live="polite"
      aria-label="Points Notifications"
    >
      {toasts.map((toast) => {
        const isReward = toast.type === 'reward';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl p-3 border shadow-lg backdrop-blur-md transition-all duration-300 flex items-center justify-between gap-3 animate-slide-in ${
              isReward
                ? 'bg-emerald-50/95 dark:bg-[#062419]/95 border-emerald-300 dark:border-emerald-600/50 text-emerald-950 dark:text-emerald-100 shadow-emerald-500/10'
                : 'bg-rose-50/95 dark:bg-[#280a0f]/95 border-rose-300 dark:border-rose-600/50 text-rose-950 dark:text-rose-100 shadow-rose-500/10'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isReward
                    ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30'
                    : 'bg-rose-500 text-white shadow-xs shadow-rose-500/30'
                }`}
              >
                {isReward ? (
                  <Award className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>

              <div className="truncate text-xs sm:text-sm">
                <span
                  className={`font-mono font-bold ${
                    isReward
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {toast.title}
                </span>
                <span className="text-slate-400 dark:text-slate-500 mx-1.5">—</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {toast.message}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
