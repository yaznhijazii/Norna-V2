import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Moon, Sparkles, Sunrise } from 'lucide-react';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useRamadan } from '../hooks/useRamadan';

export function RamadanCountdown() {
    const { isRamadan, isApproaching, daysUntil } = useRamadan();
    const prayerTimes = usePrayerTimes();
    const [countdown, setCountdown] = useState<string>('');
    const [targetName, setTargetName] = useState<string>('');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!prayerTimes) return;

        const calculateCountdown = () => {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const timeToMinutes = (timeStr: string) => {
                const [h, m] = timeStr.split(':').map(Number);
                return h * 60 + m;
            };

            const fajr = timeToMinutes(prayerTimes.Fajr);
            const maghrib = timeToMinutes(prayerTimes.Maghrib);

            let targetMinutes = 0;
            let name = '';

            if (currentMinutes < fajr) {
                targetMinutes = fajr;
                name = 'السحور';
            } else if (currentMinutes < maghrib) {
                targetMinutes = maghrib;
                name = 'الإفطار';
            } else {
                // After Maghrib, next target is Fajr tomorrow
                targetMinutes = fajr + 24 * 60;
                name = 'السحور';
            }

            setTargetName(name);

            const diffInMinutes = targetMinutes - currentMinutes;
            const hours = Math.floor(diffInMinutes / 60);
            const minutes = diffInMinutes % 60;
            const seconds = 59 - now.getSeconds();

            setCountdown(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        calculateCountdown();
        const interval = setInterval(calculateCountdown, 1000);
        return () => clearInterval(interval);
    }, [prayerTimes]);

    if (!isRamadan) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2.5rem] p-6 mb-8 border border-amber-200/30 bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 shadow-2xl shadow-indigo-500/20"
        >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl -ml-8 -mb-8"></div>

            {/* Sparkles / Stars Animation */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            opacity: [0.2, 0.8, 0.2],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                        className="absolute bg-amber-300 rounded-full"
                        style={{
                            width: Math.random() * 3 + 1 + 'px',
                            height: Math.random() * 3 + 1 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                        <span className="text-amber-200 font-black text-xs uppercase tracking-widest">
                            رمضان مبارك
                        </span>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-1 font-amiri">
                        الوقت المتبقي لـ {targetName}
                    </h2>
                    <p className="text-indigo-200 text-sm font-medium opacity-80">
                        تقبل الله طاعتكم وصالح أعمالكم
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] px-8 py-4 shadow-xl">
                    <div className="flex items-center gap-3 mb-1">
                        {targetName === 'الإفطار' ? (
                            <Moon className="w-6 h-6 text-amber-400 fill-amber-400/20" />
                        ) : (
                            <Sunrise className="w-6 h-6 text-amber-400" />
                        )}
                        <span className="text-4xl font-mono font-black text-white tracking-widest tabular-nums">
                            {countdown}
                        </span>
                    </div>
                    <span className="text-[10px] font-black text-amber-200/60 uppercase tracking-[0.2em]">ساعة : دقيقة : ثانية</span>
                </div>
            </div>
        </motion.div>
    );
}
