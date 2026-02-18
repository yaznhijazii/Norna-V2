import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Moon, Sparkles, Sunrise, Star } from 'lucide-react';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useRamadan } from '../hooks/useRamadan';

export function RamadanCountdown() {
    const { isRamadan } = useRamadan();
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative overflow-hidden rounded-[2.5rem] p-8 mb-8 border border-white/10 shadow-2xl"
        >
            {/* Real Premium Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c2c] via-[#4a192c] to-[#1a1c2c] transition-colors duration-700"></div>

            {/* Animated Mesh Gradients within card */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute -top-20 -left-20 w-64 h-64 bg-amber-500 rounded-full blur-[80px]"
                />
                <motion.div
                    animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
                    transition={{ duration: 12, repeat: Infinity }}
                    className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-600 rounded-full blur-[80px]"
                />
            </div>

            {/* Islamic Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03] grayscale invert pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/arabesque.png")' }}></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-right flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                        </div>
                        <span className="text-amber-200 font-black text-[10px] uppercase tracking-[0.3em]">
                            رمضان مبارك
                        </span>
                    </div>

                    <h2 className="text-3xl font-black text-white mb-2 font-amiri tracking-tight">
                        الوقت المتبقي لـ <span className="text-amber-400">{targetName}</span>
                    </h2>

                    <p className="text-indigo-200/60 text-xs font-bold uppercase tracking-widest">
                        تقبل الله طاعتكم وصالح أعمالكم
                    </p>
                </div>

                <div className="relative">
                    {/* Glowing Ring behind Time */}
                    <div className="absolute inset-[-20px] bg-amber-500/10 blur-2xl rounded-full animate-pulse"></div>

                    <div className="relative flex flex-col items-center justify-center bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] px-10 py-6 shadow-2xl">
                        <div className="flex items-center gap-5">
                            <div className={`p-3 rounded-2xl ${targetName === 'الإفطار' ? 'bg-amber-500 text-white' : 'bg-indigo-500 text-white shadow-lg'}`}>
                                {targetName === 'الإفطار' ? <Moon className="w-6 h-6" /> : <Sunrise className="w-6 h-6" />}
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[44px] font-black text-white leading-none tabular-nums tracking-tighter">
                                    {countdown}
                                </span>
                                <div className="flex gap-4 mt-2">
                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">ساعة</span>
                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">دقيقة</span>
                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">ثانية</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Corner Decorative Star */}
            <div className="absolute top-4 left-4 opacity-10">
                <Star className="w-12 h-12 text-white" />
            </div>
        </motion.div>
    );
}
