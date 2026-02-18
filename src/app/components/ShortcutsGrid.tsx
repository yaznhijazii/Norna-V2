import { Calendar, Compass, BookOpen, Clock, Plus } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { MouseEvent, useState } from 'react';

const TasbihIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Horizontal string */}
        <path d="M5.5 12H19.5" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" opacity="0.4" />

        {/* Beads in a horizontal line - Perfectly Centered */}
        <circle cx="5.5" cy="12" r="2.2" fill="currentColor" />
        <circle cx="10" cy="12" r="2.2" fill="currentColor" />
        <circle cx="14.5" cy="12" r="2.2" fill="currentColor" />
        <circle cx="19" cy="12" r="2.5" fill="currentColor" />

        {/* Side Tassel */}
        <path d="M19 12V18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M17 20C17 19 18 18.5 19 18.5C20 18.5 21 19 21 20" stroke="currentColor" strokeWidth="1" />
        <path d="M18 20V23M19 20V24M20 20V23" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
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
        iconBox: string,
        iconColor: string,
        glow: string,
        border: string,
        hoverBg: string
    }> = {
        amber: {
            gradient: 'from-amber-500/10 to-transparent',
            iconBox: 'bg-amber-500/10 border-amber-500/20',
            iconColor: 'text-amber-500',
            glow: 'rgba(245, 158, 11, 0.12)',
            border: 'group-hover:border-amber-500/30',
            hoverBg: 'dark:group-hover:bg-amber-500/[0.03]'
        },
        emerald: {
            gradient: 'from-emerald-500/10 to-transparent',
            iconBox: 'bg-emerald-500/10 border-emerald-500/20',
            iconColor: 'text-emerald-500',
            glow: 'rgba(16, 185, 129, 0.12)',
            border: 'group-hover:border-emerald-500/30',
            hoverBg: 'dark:group-hover:bg-emerald-500/[0.03]'
        },
        indigo: {
            gradient: 'from-indigo-500/10 to-transparent',
            iconBox: 'bg-indigo-500/10 border-indigo-500/20',
            iconColor: 'text-indigo-500',
            glow: 'rgba(99, 102, 241, 0.12)',
            border: 'group-hover:border-indigo-500/30',
            hoverBg: 'dark:group-hover:bg-indigo-500/[0.03]'
        },
        rose: {
            gradient: 'from-rose-500/10 to-transparent',
            iconBox: 'bg-rose-500/10 border-rose-500/20',
            iconColor: 'text-rose-500',
            glow: 'rgba(244, 63, 94, 0.12)',
            border: 'group-hover:border-rose-500/30',
            hoverBg: 'dark:group-hover:bg-rose-500/[0.03]'
        },
        violet: {
            gradient: 'from-violet-500/10 to-transparent',
            iconBox: 'bg-violet-500/10 border-violet-500/20',
            iconColor: 'text-violet-500',
            glow: 'rgba(139, 92, 246, 0.12)',
            border: 'group-hover:border-violet-500/30',
            hoverBg: 'dark:group-hover:bg-violet-500/[0.03]'
        },
        slate: {
            gradient: 'from-slate-500/10 to-transparent',
            iconBox: 'bg-slate-500/10 border-slate-500/20',
            iconColor: 'text-slate-500',
            glow: 'rgba(71, 85, 105, 0.12)',
            border: 'group-hover:border-slate-500/30',
            hoverBg: 'dark:group-hover:bg-slate-500/[0.03]'
        }
    };

    const config = colorConfigs[color] || colorConfigs.slate;

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const mouseSpringConfig = { damping: 25, stiffness: 250 };
    const x = useSpring(mouseX, mouseSpringConfig);
    const y = useSpring(mouseY, mouseSpringConfig);
    const background = useTransform(
        [x, y],
        ([latestX, latestY]) => `radial-gradient(120px circle at ${latestX}px ${latestY}px, ${config.glow}, transparent)`
    );

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: "spring", stiffness: 120, damping: 20 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onMouseMove={handleMouseMove}
            onClick={onClick}
            className={`flex items-center justify-center p-0 rounded-[2.25rem] border border-slate-100 dark:border-white/[0.04] bg-white dark:bg-white/[0.02] backdrop-blur-md transition-all duration-500 group relative overflow-hidden h-[130px] w-full shadow-sm dark:shadow-none hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none ${config.border} ${config.hoverBg} ${className}`}
        >
            {/* Dynamic Spotlight Effect */}
            <motion.div
                className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background }}
            />

            {/* Content Container - Perfect Vertical Centering */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-3 pointer-events-none">
                {/* Icon Box */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-[8deg] border border-transparent shadow-sm dark:shadow-none ${config.iconBox} ${config.iconColor}`}>
                    <Icon className="w-6 h-6 stroke-[2.25] drop-shadow-[0_0_8px_rgba(var(--icon-rgb),0.3)]" />
                </div>

                {/* Text Section - Balanced spacing */}
                <div className="flex flex-col items-center justify-center w-full px-2">
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-[0.15em] leading-tight block w-full text-center mb-1">{title}</span>
                    {subtitle ? (
                        <div className="h-3 flex items-center justify-center w-full px-1 overflow-hidden">
                            <motion.span
                                key={subtitle}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[8px] font-bold text-slate-400 dark:text-white/20 truncate w-full text-center tabular-nums leading-none tracking-tight block"
                                dir="rtl"
                            >
                                {subtitle}
                            </motion.span>
                        </div>
                    ) : (
                        <div className="h-3 flex items-center justify-center">
                            <div className="w-5 h-[1.5px] bg-slate-100 dark:bg-white/[0.03] opacity-30" />
                        </div>
                    )}
                </div>
            </div>

            {/* Corner Shine */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
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
            window.dispatchEvent(new CustomEvent('openPrayerTimes'));
        }
    };

    return (
        <div className="space-y-5 pt-4">
            {/* Layout Container */}
            <div className="p-1 rounded-[2.75rem] bg-slate-50/50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/[0.03] shadow-inner">
                {/* Header (Inside Container) */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4" dir="rtl">
                    <div className="flex items-center gap-3.5">
                        <div className="w-1.5 h-7 bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-[1.15rem] font-black text-slate-800 dark:text-white leading-none tracking-tight">اللوحة الذكية</h2>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">الوصول السريع والذكي</span>
                        </div>
                    </div>

                    <motion.div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] shadow-sm relative overflow-hidden group/ready"
                    >
                        <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                        />
                        <span className="text-[10px] font-black text-slate-600 dark:text-white/40 tracking-wider">جاهز</span>
                    </motion.div>
                </div>

                {/* Grid (Centered inside Container) */}
                <div className="flex justify-center w-full p-3.5">
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3.5 w-full">
                        <ShortcutCard
                            title="المناسبات"
                            icon={Calendar}
                            color="amber"
                            onClick={onOpenOccasions}
                            delay={0.1}
                            className="flex-1 min-w-[120px] max-w-[160px]"
                        />
                        <ShortcutCard
                            title="القبلة"
                            icon={Compass}
                            color="emerald"
                            onClick={onOpenQibla}
                            delay={0.15}
                            className="flex-1 min-w-[120px] max-w-[160px]"
                        />
                        <ShortcutCard
                            title="المسبحة"
                            icon={TasbihIcon}
                            color="indigo"
                            onClick={onOpenTasbih}
                            delay={0.2}
                            className="flex-1 min-w-[120px] max-w-[160px]"
                        />

                        {!isExpanded ? (
                            <ShortcutCard
                                title="المزيد"
                                icon={Plus}
                                color="slate"
                                onClick={() => setIsExpanded(true)}
                                delay={0.25}
                                className="flex-1 min-w-[120px] max-w-[160px] dark:bg-white/[0.01] border-dashed border-slate-200 dark:border-white/[0.08]"
                            />
                        ) : (
                            <ShortcutCard
                                title="المواقيت"
                                icon={Clock}
                                color="violet"
                                onClick={handleOpenPrayerTimes}
                                delay={0}
                                className="flex-1 min-w-[120px] max-w-[160px]"
                            />
                        )}

                        <AnimatePresence mode="popLayout">
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                                    transition={{ type: "spring", stiffness: 150, damping: 15 }}
                                    className="flex-1 min-w-[120px] max-w-[160px]"
                                >
                                    <ShortcutCard
                                        title="الورد"
                                        subtitle={lastRead ? `سورة ${lastRead.surah}` : 'ابدأ الآن'}
                                        icon={BookOpen}
                                        color="rose"
                                        onClick={onContinueQuran}
                                        delay={0.05}
                                        className="w-full"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
