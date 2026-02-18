import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, MapPin, Star, Bell, Calendar as CalendarIcon } from 'lucide-react';
import { usePrayerTimes } from '../hooks/usePrayerTimes';

interface PrayerTimesDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PrayerTimesDialog({ isOpen, onClose }: PrayerTimesDialogProps) {
    const prayerTimes = usePrayerTimes();
    const [currentTime, setCurrentTime] = useState(new Date());

    if (!isOpen) return null;

    const prayerOrder = [
        { id: 'Fajr', label: 'الفجر' },
        { id: 'Sunrise', label: 'الشروق' },
        { id: 'Dhuhr', label: 'الظهر' },
        { id: 'Asr', label: 'العصر' },
        { id: 'Maghrib', label: 'المغرب' },
        { id: 'Isha', label: 'العشاء' }
    ];

    // Helper to check if time has passed
    const isPast = (timeStr: string) => {
        if (!timeStr) return false;
        const [h, m] = timeStr.split(':').map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(h, m, 0, 0);
        return currentTime > prayerTime;
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative"
                >
                    {/* Header Image/Gradient */}
                    <div className="h-32 bg-gradient-to-br from-violet-600 to-indigo-700 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <Star className="absolute top-4 left-4 w-12 h-12 text-white" />
                            <Star className="absolute bottom-4 right-12 w-8 h-8 text-white" />
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-2">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-black text-white">مواقيت الصلاة</h2>
                            <p className="text-[10px] font-bold text-white/60 tracking-widest uppercase">الأردن، عمان</p>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center bg-black/10 hover:bg-black/20 rounded-full transition-colors text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-3">
                            {prayerOrder.map((prayer) => {
                                const time = (prayerTimes as any)?.[prayer.id] || '--:--';
                                const passed = isPast(time);

                                return (
                                    <motion.div
                                        key={prayer.id}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${passed
                                                ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5 opacity-60'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${passed ? 'bg-slate-200 dark:bg-slate-700 text-slate-500' : 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                                                }`}>
                                                <Bell className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-white">{prayer.label}</h4>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">بتوقيت عمان</span>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <span className={`text-lg font-black tabular-nums ${passed ? 'text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                                                {time}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Footer Info */}
                        <div className="mt-6 flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                                <MapPin className="w-3 h-3" />
                                <span>يتم التحديث تلقائياً حسب موقعك</span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 text-center opacity-70">يتم جلب المواقيت من Aladhan API المعتمد لمساجد الأردن</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
