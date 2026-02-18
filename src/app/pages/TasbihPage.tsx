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

    const toArabicNotation = (n: number) => {
        return n.toLocaleString('ar-EG');
    };

    return (
        <div className="h-full w-full flex flex-col items-center p-8 relative overflow-hidden bg-[#f8f9fa]">
            {/* Cinematic Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Top Navigation Row */}
            <div className="w-full flex justify-between items-center relative z-30 mb-8">
                <motion.button
                    whileHover={{ rotate: -180, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={resetCount}
                    className="w-12 h-12 rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-emerald-100 flex items-center justify-center text-emerald-800 transition-shadow hover:shadow-emerald-200/50"
                >
                    <RotateCcw className="w-5 h-5" />
                </motion.button>

                <div className="flex flex-col items-end">
                    <h2 className="text-2xl font-black text-emerald-950 tracking-tight">المسبحة</h2>
                    <span className="text-[9px] font-black text-emerald-800/40 uppercase tracking-[0.3em]">Norna Premium</span>
                </div>
            </div>

            {/* Main Interactive Stage */}
            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                {/* 3D-Like Geometric Aura */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                        animate={{
                            scale: isPressed ? 1.05 : 1
                        }}
                        transition={{
                            scale: { duration: 0.2 }
                        }}
                        className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]"
                    >
                        {/* Layer 1: The Outter Glow */}
                        <div className="absolute inset-0 rounded-full bg-emerald-500/5 blur-3xl animate-pulse" />

                        {/* Layer 2: Geometric SVG Lines */}
                        <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-900/10 drop-shadow-sm">
                            <defs>
                                <linearGradient id="geomGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
                                </linearGradient>
                            </defs>
                            <path d="M50 2 L61 39 L98 50 L61 61 L50 98 L39 61 L2 50 L39 39 Z" fill="none" stroke="url(#geomGradient)" strokeWidth="0.5" />
                            <circle cx="50" cy="50" r="48" fill="none" stroke="url(#geomGradient)" strokeWidth="0.1" strokeDasharray="2 4" />
                            <rect x="25" y="25" width="50" height="50" transform="rotate(22.5 50 50)" fill="none" stroke="url(#geomGradient)" strokeWidth="0.3" />
                            <rect x="25" y="25" width="50" height="50" transform="rotate(67.5 50 50)" fill="none" stroke="url(#geomGradient)" strokeWidth="0.3" />
                        </svg>
                    </motion.div>
                </div>

                {/* Counter & Dhikr Display */}
                <motion.button
                    onPointerDown={() => setIsPressed(true)}
                    onPointerUp={() => setIsPressed(false)}
                    onPointerLeave={() => setIsPressed(false)}
                    onClick={handleIncrement}
                    className="relative z-20 flex flex-col items-center justify-center group cursor-pointer"
                >
                    {/* Ripple Effect on Click */}
                    <AnimatePresence>
                        {isPressed && (
                            <motion.div
                                initial={{ opacity: 0.5, scale: 0.8 }}
                                animate={{ opacity: 0, scale: 2 }}
                                className="absolute bg-emerald-400/10 rounded-full w-40 h-40 pointer-events-none"
                            />
                        )}
                    </AnimatePresence>

                    <div className="relative text-center">
                        <motion.div
                            key={count}
                            initial={{ scale: 0.8, filter: "blur(2px)" }}
                            animate={{ scale: 1, filter: "blur(0px)" }}
                            className="text-[140px] sm:text-[180px] font-black leading-none text-emerald-950 selection:bg-none drop-shadow-[0_10px_30px_rgba(6,78,59,0.1)]"
                        >
                            {toArabicNotation(count)}
                        </motion.div>

                        <motion.div
                            className="flex flex-col items-center -mt-4 gap-4"
                        >
                            <span className="text-2xl font-black text-emerald-900/60 font-amiri tracking-wide drop-shadow-sm">
                                {currentDhikr.name}
                            </span>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDhikrIndex((activeDhikrIndex + 1) % DHIKRS.length);
                                    if (count > 0) saveLog();
                                    setCount(0);
                                }}
                                className="group/btn relative px-8 py-2.5 rounded-2xl bg-emerald-900 text-emerald-50 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-800 hover:scale-105 transition-all flex items-center justify-center"
                            >
                                <span>تغيير الذكر</span>
                            </button>
                        </motion.div>
                    </div>
                </motion.button>
            </div>

            {/* Dynamic Infinite Bead String */}
            <div className="w-full relative h-40 overflow-hidden flex items-center justify-center mt-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-[#f8f9fa] via-transparent to-[#f8f9fa] z-10 pointer-events-none" />

                <motion.div
                    className="flex gap-4 items-center"
                    animate={{ x: [20, 0] }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    key={count} // Only animate the container position slightly on click
                >
                    {[...Array(15)].map((_, i) => (
                        <div
                            key={i} // Stable key
                            className={`relative shrink-0 rounded-full shadow-lg border border-white/20
                                ${i === 7 ? 'w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-700 shadow-amber-900/20 z-20 scale-125' : 'w-10 h-10 bg-gradient-to-br from-emerald-800 to-emerald-950 opacity-40'}
                            `}
                        >
                            {/* Inner Shine */}
                            <div className="absolute top-1 left-2 w-1/3 h-1/3 bg-white/20 rounded-full blur-[1px]" />
                        </div>
                    ))}
                    {/* Connector Thread */}
                    <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-emerald-950/10 -translate-y-1/2" />
                </motion.div>
            </div>

            {/* Subtle Progress Bar & Total Stats */}
            <div className="w-full max-w-xs space-y-3 mb-4 relative z-20">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black text-emerald-950/40 uppercase tracking-widest">الإنجاز: {Math.round(progress)}%</span>
                    <div className="flex items-center gap-1.5 opacity-60">
                        <Trophy className="w-3 h-3 text-amber-600" />
                        <span className="text-[10px] font-black text-emerald-950 tabular-nums">المجموع: {toArabicNotation(totalCount)}</span>
                    </div>
                </div>
                <div className="h-1.5 bg-emerald-900/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        className="h-full bg-gradient-to-r from-emerald-800 to-amber-600 rounded-full"
                    />
                </div>
            </div>
        </div>
    );
}
