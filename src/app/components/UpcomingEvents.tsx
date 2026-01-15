import { useState, useEffect } from 'react';
import { Calendar, ChevronRight, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchJordanHolidays, Holiday } from '../utils/holidays';

export function UpcomingEvents() {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await fetchJordanHolidays();
            setHolidays(data.slice(0, 3)); // Only show next 3
            setLoading(false);
        };
        load();
    }, []);

    if (loading || holidays.length === 0) return null;

    return (
        <div className="premium-card p-5 sm:p-6 backdrop-blur-3xl border-white/50 dark:border-white/5 relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/10 transition-colors duration-1000" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shadow-inner">
                            <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">المناسـبات القادمة</h3>
                            <p className="text-[10px] text-slate-500 font-bold opacity-70 uppercase tracking-widest">أحداث هامة في طريقك</p>
                        </div>
                    </div>
                </div>

                {/* Events List */}
                <div className="space-y-3">
                    {holidays.map((holiday, index) => (
                        <motion.div
                            key={holiday.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all
                                ${index === 0
                                    ? 'bg-amber-500/10 border-amber-500/20 shadow-lg shadow-amber-500/5'
                                    : 'bg-white/50 dark:bg-white/5 border-slate-100 dark:border-white/5'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                {index === 0 && (
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                )}
                                <div>
                                    <h4 className={`text-xs font-black ${index === 0 ? 'text-amber-900 dark:text-amber-200' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {holiday.name}
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                                        {holiday.hijri}
                                    </p>
                                </div>
                            </div>

                            <div className="text-left">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${index === 0 ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                    {holiday.daysUntil === 0 ? 'اليوم' : `بعد ${holiday.daysUntil} يوم`}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Hint */}
                <div className="mt-4 flex items-center justify-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                    <Star className="w-3 h-3" />
                    <span>تقويم عام 2026 هـ</span>
                    <Star className="w-3 h-3" />
                </div>
            </div>
        </div>
    );
}
