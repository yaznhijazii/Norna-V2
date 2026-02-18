import { Calendar, Compass, BookOpen, Clock, Plus } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { MouseEvent, useState } from 'react';

const TasbihIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Horizontal string */}
        <path d="M4 12H18" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" opacity="0.4" />

        {/* Beads in a horizontal line */}
        <circle cx="4" cy="12" r="2.2" fill="currentColor" />
        <circle cx="8.5" cy="12" r="2.2" fill="currentColor" />
        <circle cx="13" cy="12" r="2.2" fill="currentColor" />
        <circle cx="17.5" cy="12" r="2.5" fill="currentColor" />

        {/* Side Tassel */}
        <path d="M17.5 12V18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M15.5 20C15.5 19 16.5 18.5 17.5 18.5C18.5 18.5 19.5 19 19.5 20" stroke="currentColor" strokeWidth="1" />
        <path d="M16.5 20V23M17.5 20V24M18.5 20V23" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
);

interface ShortcutCardProps {
    title: string;
    subtitle?: string;
    icon: any;
    color: string;
    onClick: () => void;
    delay?: number;
    className?: string;
}

function ShortcutCard({ title, subtitle, icon: Icon, color, onClick, delay = 0, className = "" }: ShortcutCardProps) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const colorConfigs: Record<string, {
        gradient: string,
        iconColor: string,
        shadow: string,
        glow: string,
        border: string
    }> = {
        amber: {
            gradient: 'from-amber-500/5 to-transparent',
            iconColor: 'text-amber-500',
            shadow: 'group-hover:shadow-amber-500/20',
            glow: 'rgba(245, 158, 11, 0.15)',
            border: 'group-hover:border-amber-500/30'
        },
        emerald: {
            gradient: 'from-emerald-500/5 to-transparent',
            iconColor: 'text-emerald-500',
            shadow: 'group-hover:shadow-emerald-500/20',
            glow: 'rgba(16, 185, 129, 0.15)',
            border: 'group-hover:border-emerald-500/30'
        },
        indigo: {
            gradient: 'from-indigo-500/5 to-transparent',
            iconColor: 'text-indigo-500',
            shadow: 'group-hover:shadow-indigo-500/20',
            glow: 'rgba(99, 102, 241, 0.15)',
            border: 'group-hover:border-indigo-500/30'
        },
        rose: {
            gradient: 'from-rose-500/5 to-transparent',
            iconColor: 'text-rose-500',
            shadow: 'group-hover:shadow-rose-500/20',
            glow: 'rgba(244, 63, 94, 0.15)',
            border: 'group-hover:border-rose-500/30'
        },
        violet: {
            gradient: 'from-violet-500/5 to-transparent',
            iconColor: 'text-violet-500',
            shadow: 'group-hover:shadow-violet-500/20',
            glow: 'rgba(139, 92, 246, 0.15)',
            border: 'group-hover:border-violet-500/30'
        },
        slate: {
            gradient: 'from-slate-500/5 to-transparent',
            iconColor: 'text-slate-500',
            shadow: 'group-hover:shadow-slate-500/20',
            glow: 'rgba(71, 85, 105, 0.15)',
            border: 'group-hover:border-slate-500/30'
        }
    };

    const config = colorConfigs[color] || colorConfigs.slate;

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const springConfig = { damping: 20, stiffness: 300 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);
    const background = useTransform(
        [x, y],
        ([latestX, latestY]) => `radial-gradient(100px circle at ${latestX}px ${latestY}px, ${config.glow}, transparent)`
    );

    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: "spring", stiffness: 100, damping: 15 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onMouseMove={handleMouseMove}
            onClick={onClick}
            className={`flex flex-col items-center justify-between p-4 rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900 transition-colors duration-500 group relative overflow-hidden h-[120px] w-full shadow-lg shadow-slate-200/40 dark:shadow-none ${config.shadow} ${config.border} ${className}`}
        >
            <motion.div
                className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background }}
            />

            <div className="relative z-10 w-full h-full flex flex-col items-center justify-between pointer-events-none">
                <div className={`w-12 h-12 rounded-[1.25rem] bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-center transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110 ${config.iconColor}`}>
                    <Icon className="w-6 h-6 stroke-[2.25]" />
                </div>

                <div className="flex flex-col items-center gap-1 w-full mt-2">
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-[0.05em] leading-none group-hover:tracking-[0.1em] transition-all duration-500">{title}</span>
                    {subtitle && (
                        <div className="h-4 flex items-center justify-center w-full px-1 overflow-hidden">
                            <motion.span
                                key={subtitle}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate w-full text-center tabular-nums leading-none"
                                dir="rtl"
                            >
                                {subtitle}
                            </motion.span>
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </motion.button>
    );
}

interface ShortcutsGridProps {
    onOpenOccasions: () => void;
    onOpenQibla: () => void;
    onOpenTasbih: () => void;
    onContinueQuran: () => void;
    onOpenPrayerTimes?: () => void;
    lastRead?: {
        surah: string;
        ayah: number;
    } | null;
}

export function ShortcutsGrid({ onOpenOccasions, onOpenQibla, onOpenTasbih, onContinueQuran, onOpenPrayerTimes, lastRead }: ShortcutsGridProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleOpenPrayerTimes = () => {
        if (onOpenPrayerTimes) {
            onOpenPrayerTimes();
        } else {
            // Default behavior if not provided
            window.dispatchEvent(new CustomEvent('openPrayerTimes'));
        }
    };

    return (
        <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between px-1" dir="rtl">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                    <div className="flex flex-col">
                        <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">اللوحة الذكية</h2>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">الوصول السريع والذكي</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-500">جاهز</span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 w-full px-2">
                <ShortcutCard
                    title="المناسبات"
                    icon={Calendar}
                    color="amber"
                    onClick={onOpenOccasions}
                    delay={0}
                />
                <ShortcutCard
                    title="القبلة"
                    icon={Compass}
                    color="emerald"
                    onClick={onOpenQibla}
                    delay={0.06}
                />
                <ShortcutCard
                    title="المسبحة"
                    icon={TasbihIcon}
                    color="indigo"
                    onClick={onOpenTasbih}
                    delay={0.12}
                />

                {!isExpanded ? (
                    <ShortcutCard
                        title="المزيد"
                        icon={Plus}
                        color="slate"
                        onClick={() => setIsExpanded(true)}
                        delay={0.18}
                        className="bg-slate-50/50 dark:bg-slate-800/50 border-dashed"
                    />
                ) : (
                    <ShortcutCard
                        title="مواقيت الصلاة"
                        icon={Clock}
                        color="violet"
                        onClick={handleOpenPrayerTimes}
                        delay={0}
                    />
                )}

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="contents"
                        >
                            <ShortcutCard
                                title="مُتابعة الورد"
                                subtitle={lastRead ? `سورة ${lastRead.surah}، آية ${lastRead.ayah}` : 'ابدأ ختمتك الآن'}
                                icon={BookOpen}
                                color="rose"
                                onClick={onContinueQuran}
                                delay={0.06}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
