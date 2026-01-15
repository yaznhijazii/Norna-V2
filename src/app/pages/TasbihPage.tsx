import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, ChevronDown, Sparkles, Trophy, History } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../utils/supabase';

const DHIKRS = [
    { name: 'سبحان الله', target: 33 },
    { name: 'الحمد لله', target: 33 },
    { name: 'الله أكبر', target: 34 },
    { name: 'لا إله إلا الله', target: 100 },
    { name: 'أستغفر الله', target: 100 },
    { name: 'اللهم صل على محمد', target: 100 },
];

export function TasbihPage() {
    const [count, setCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [activeDhikrIndex, setActiveDhikrIndex] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);
    const [isPressed, setIsPressed] = useState(false);

    useEffect(() => {
        const user = localStorage.getItem('nooruna_user');
        if (user) {
            const userData = JSON.parse(user);
            setUserId(userData.id);
            loadTotalCount(userData.id);
        }
    }, []);

    const loadTotalCount = async (uid: string) => {
        const { data, error } = await supabase
            .from('tasbih_logs')
            .select('count')
            .eq('user_id', uid);

        if (data) {
            const sum = data.reduce((acc, curr) => acc + curr.count, 0);
            setTotalCount(sum);
        }
    };

    const handleIncrement = useCallback(() => {
        setCount(prev => {
            const next = prev + 1;
            const currentDhikr = DHIKRS[activeDhikrIndex];

            if (next === currentDhikr.target) {
                confetti({
                    particleCount: 40,
                    spread: 60,
                    origin: { y: 0.8 },
                    colors: ['#fbbf24', '#f59e0b', '#d97706']
                });
            }
            return next;
        });
        setTotalCount(prev => prev + 1);

        // Haptic feedback (if supported)
        if ('vibrate' in navigator) navigator.vibrate(10);
    }, [activeDhikrIndex]);

    const resetCount = () => {
        if (count > 0 && userId) {
            saveLog();
        }
        setCount(0);
    };

    const saveLog = async () => {
        if (!userId || count === 0) return;

        await supabase.from('tasbih_logs').insert([{
            user_id: userId,
            dhikr_name: DHIKRS[activeDhikrIndex].name,
            count: count
        }]);
    };

    const currentDhikr = DHIKRS[activeDhikrIndex];
    const progress = (count / currentDhikr.target) * 100;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 pb-32 relative overflow-hidden">
            {/* Background Decorative Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-white/10 rounded-full pointer-events-none" />

            <div className="w-full max-w-md space-y-12 relative z-10">
                {/* Header Info */}
                <div className="flex justify-between items-center text-white/40">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-black tracking-widest uppercase">الإجمالي: {totalCount}</span>
                    </div>
                    <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <History className="w-5 h-5" />
                    </button>
                </div>

                {/* Dhikr Selector */}
                <div className="text-center space-y-4">
                    <button
                        onClick={() => setActiveDhikrIndex((activeDhikrIndex + 1) % DHIKRS.length)}
                        className="group flex flex-col items-center gap-2 mx-auto"
                    >
                        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight group-hover:text-amber-400 transition-colors duration-500">
                            {currentDhikr.name}
                        </h1>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 opacity-60 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-black uppercase tracking-widest">تغيير الذكر</span>
                            <ChevronDown className="w-3 h-3" />
                        </div>
                    </button>
                </div>

                {/* Main Counter Area */}
                <div className="relative aspect-square flex items-center justify-center">
                    {/* Progress Circle */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="50%" cy="50%" r="45%"
                            className="stroke-white/5 fill-none"
                            strokeWidth="2"
                        />
                        <motion.circle
                            cx="50%" cy="50%" r="45%"
                            className="stroke-amber-400 fill-none"
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: "283", strokeDashoffset: "283" }}
                            animate={{ strokeDashoffset: 283 - (283 * Math.min(progress, 100)) / 100 }}
                            transition={{ type: "spring", stiffness: 50, damping: 20 }}
                        />
                    </svg>

                    {/* Counter Button */}
                    <motion.button
                        onMouseDown={() => setIsPressed(true)}
                        onMouseUp={() => setIsPressed(false)}
                        onTouchStart={() => setIsPressed(true)}
                        onTouchEnd={() => setIsPressed(false)}
                        onClick={handleIncrement}
                        whileTap={{ scale: 0.92 }}
                        className="relative w-64 h-64 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.3)] backdrop-blur-3xl flex flex-col items-center justify-center group"
                    >
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={count}
                                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.5, y: -20 }}
                                className="text-8xl font-black text-white tabular-nums tracking-tighter"
                            >
                                {count}
                            </motion.span>
                        </AnimatePresence>
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-2 group-hover:text-amber-400/40 transition-colors">اضغط</span>

                        {/* Subtle Glow */}
                        <div className={`absolute inset-0 rounded-full bg-amber-400/5 blur-2xl transition-opacity duration-300 ${isPressed ? 'opacity-100' : 'opacity-0'}`} />
                    </motion.button>
                </div>

                {/* Bottom Actions */}
                <div className="flex justify-center gap-8">
                    <button
                        onClick={resetCount}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-rose-500/20 group-hover:border-rose-500/40 transition-all duration-300">
                            <RotateCcw className="w-5 h-5 text-white/40 group-hover:text-rose-400" />
                        </div>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">تصفير</span>
                    </button>

                    <button
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-300">
                            <Sparkles className="w-5 h-5 text-white/40 group-hover:text-emerald-400" />
                        </div>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">فضل الذكر</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
