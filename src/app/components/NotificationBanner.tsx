import { useState, useEffect } from 'react';
import { Bell, X, Check, Info, AlertTriangle, Gift, Heart, BookOpen, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  type?: 'default' | 'success' | 'info' | 'warning' | 'gift' | 'prayer' | 'athkar' | 'quran';
  icon?: string | React.ReactNode;
  duration?: number;
  timestamp?: string;
  isRead?: boolean;
}

export function NotificationBanner() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // Listen for custom "nooruna-notification" events
  useEffect(() => {
    const handleNotification = (event: any) => {
      const data = event.detail as InAppNotification;
      const id = data.id || Math.random().toString(36).substr(2, 9);

      setNotifications(prev => [
        { ...data, id },
        ...prev
      ].slice(0, 3)); // Keep only latest 3

      // Auto-remove after duration
      const duration = data.duration || 6000;
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    };

    window.addEventListener('nooruna-in-app-notification', handleNotification);
    return () => window.removeEventListener('nooruna-in-app-notification', handleNotification);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (notif: InAppNotification) => {
    if (notif.icon && typeof notif.icon !== 'string') return notif.icon;

    switch (notif.type) {
      case 'success': return <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><Check className="w-4 h-4" /></div>;
      case 'gift': return <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><Gift className="w-4 h-4" /></div>;
      case 'prayer': return <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600"><Star className="w-4 h-4" /></div>;
      case 'athkar': return <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Bell className="w-4 h-4" /></div>;
      case 'quran': return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><BookOpen className="w-4 h-4" /></div>;
      default: return <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Bell className="w-4 h-4" /></div>;
    }
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10001] w-full max-w-sm px-4 pointer-events-none flex flex-col gap-3">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto relative group"
            onClick={() => removeNotification(notif.id)}
          >
            {/* Premium Glassmorphism Background */}
            <div className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[24px] overflow-hidden">
              {/* Animated Progress Bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: (notif.duration || 6000) / 1000, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-teal-500/20"
              />

              <div className="p-4 flex items-start gap-4">
                <div className="shrink-0 pt-0.5">
                  {getIcon(notif)}
                </div>

                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="font-bold text-slate-800 text-[13px] tracking-tight leading-tight mb-1 rtl:text-right">
                    {notif.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed rtl:text-right">
                    {notif.body}
                  </p>
                </div>

                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400">
                    <X className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle glow effect based on type */}
            <div className={`absolute -inset-0.5 blur-xl opacity-20 -z-10 rounded-[28px] ${notif.type === 'gift' ? 'bg-rose-500' :
              notif.type === 'prayer' ? 'bg-teal-500' :
                notif.type === 'quran' ? 'bg-blue-500' : 'bg-slate-400'
              }`} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Global helper to trigger in-app notifications
export const showInAppNotification = (data: Omit<InAppNotification, 'id'>) => {
  const event = new CustomEvent('nooruna-in-app-notification', { detail: data });
  window.dispatchEvent(event);
};