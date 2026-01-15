import { motion, AnimatePresence } from 'motion/react';
import { Check, Bell, Heart, Crosshair } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PartnerNotificationProps {
    partnerName: string;
    prayerName: string;
}

export function PartnerNotification({ partnerName, prayerName }: PartnerNotificationProps) {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShow(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    const prayerLabels: Record<string, string> = {
        fajr: 'صلاة الفجر',
        dhuhr: 'صلاة الظهر',
        asr: 'صلاة العصر',
        maghrib: 'صلاة المغرب',
        isha: 'صلاة العشاء'
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.9, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, scale: 0.95, filter: 'blur(10px)' }}
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-[320px]"
                >
                    <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-50" />

                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center shrink-0">
                                <Check className="w-6 h-6 text-white stroke-[3]" />
                            </div>

                            <div className="flex-1 text-right">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Bell className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">تنبيه الطاعة</span>
                                </div>
                                <h4 className="text-white font-black text-sm">
                                    أدى شريكك {partnerName} {prayerLabels[prayerName] || prayerName}
                                </h4>
                                <p className="text-[11px] font-bold text-white/40 mt-1">تقبل الله طاعته وبارك لك فيه ✨</p>
                            </div>

                            <div className="flex flex-col items-center justify-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                <Heart className="w-4 h-4 text-rose-500 fill-current animate-pulse" />
                            </div>
                        </div>

                        {/* Progress line timer */}
                        <motion.div
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 5, ease: 'linear' }}
                            className="absolute bottom-0 right-0 h-1 bg-emerald-500/50"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
