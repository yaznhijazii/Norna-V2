import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Navigation, Compass, Camera } from 'lucide-react';
import { useQiblaDirection } from '../hooks/useQiblaDirection';
import { QiblaARView } from './QiblaARView';

interface QiblaFullViewProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QiblaFullView({ isOpen, onClose }: QiblaFullViewProps) {
    const [showAR, setShowAR] = useState(false);
    const { qiblaDirection, deviceHeading, needsPermission, error, loading, requestPermission } = useQiblaDirection();

    // Calculate relative rotation
    const getRotation = () => {
        if (qiblaDirection === null || deviceHeading === null) return 0;
        return qiblaDirection - deviceHeading;
    };

    const rotation = getRotation();
    const isAligned = Math.abs(rotation) < 5;

    // Dynamic instruction based on rotation
    const getInstruction = () => {
        if (qiblaDirection === null || deviceHeading === null) return 'بانتظار تحديد الاتجاه...';
        if (isAligned) return 'أنت بوضع صحيح للقبلة';
        return rotation > 0 ? 'أدر الجوال لليمين قليلاً' : 'أدر الجوال لليسار قليلاً';
    };

    if (!isOpen) return null;

    return (
        <>
            <QiblaARView isOpen={showAR} onClose={() => setShowAR(false)} />
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[100] bg-[#f8faff] dark:bg-slate-950 flex flex-col font-sans overflow-hidden"
                    dir="rtl"
                >
                    {/* Top Bar */}
                    <div className="px-6 pt-12 pb-4 flex items-center justify-between">
                        {/* AR Button */}
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowAR(true)}
                            className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center border border-white/20"
                        >
                            <Camera className="w-6 h-6" />
                        </motion.button>

                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/5 text-slate-500"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Title */}
                    <div className="px-6 mt-4">
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white">اتجاه القبلة</h1>
                    </div>

                    {/* Middle Section: Prayer Mat & Compass */}
                    <div className="flex-1 relative flex flex-col items-center justify-center">

                        {/* Background Decorative Rings */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                            <div className="w-[80vw] h-[80vw] border-[20px] border-emerald-500 rounded-full" />
                            <div className="absolute w-[60vw] h-[60vw] border-[10px] border-emerald-500 rounded-full" />
                        </div>

                        {/* Tooltip / Instruction */}
                        <div className="absolute top-[18%] z-40 w-full px-10">
                            <motion.div
                                animate={{
                                    borderColor: isAligned ? '#10b981' : 'transparent',
                                    scale: isAligned ? 1.05 : 1,
                                }}
                                className={`mx-auto max-w-xs bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-2 px-5 py-3 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex items-center justify-center gap-3 transition-all duration-500 ${isAligned ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-white/20 dark:border-white/5'}`}
                            >
                                {(qiblaDirection === null || deviceHeading === null) ? (
                                    <div className="w-4 h-4 border-[2.5px] border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                ) : isAligned ? (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
                                    >
                                        <motion.div
                                            animate={{ scale: [1, 1.4, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="w-2 h-2 bg-white rounded-full"
                                        />
                                    </motion.div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-emerald-500/10 flex items-center justify-center">
                                        <Navigation
                                            className={`w-4 h-4 transition-transform duration-500 ${rotation > 0 ? 'rotate-90' : '-rotate-90'} text-emerald-500`}
                                        />
                                    </div>
                                )}

                                <div className="flex flex-col items-center">
                                    <span className={`text-sm font-black tracking-tight ${isAligned ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                        {getInstruction()}
                                    </span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Prayer Mat (CSS Representation) */}
                        <div className="relative mt-20 perspective-[1000px]">
                            <motion.div
                                animate={{
                                    rotateX: 45,
                                    rotateY: 0,
                                    rotateZ: rotation,
                                }}
                                transition={{ type: 'spring', damping: 25, stiffness: 80 }}
                                className="relative group"
                            >
                                {/* Shadow for the mat */}
                                <div className="absolute -inset-4 bg-black/20 blur-2xl rounded-full transform translate-y-8 scale-x-90" />

                                <div className="w-60 h-[380px] bg-gradient-to-b from-emerald-900 to-[#064e3b] rounded-[12px] shadow-2xl relative overflow-hidden border-[5px] border-[#cbb061]/80 p-1">
                                    {/* Intricate Inner Border */}
                                    <div className="absolute inset-2 border border-[#cbb061]/40 rounded-[6px]" />

                                    {/* Traditional Pattern Overlay */}
                                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                                        style={{ backgroundImage: 'radial-gradient(#cbb061 1px, transparent 1px)', backgroundSize: '15px 15px' }} />

                                    {/* Mihrab (Arch) */}
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-44 border-t-[6px] border-x-[6px] border-[#cbb061]/30 rounded-t-[80px]" />
                                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-24 h-36 border-t-[3px] border-x-[3px] border-[#cbb061]/20 rounded-t-[60px]" />

                                    {/* Center Ornament */}
                                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-12 h-12 border-2 border-[#cbb061]/20 rounded-full flex items-center justify-center rotate-45">
                                        <div className="w-6 h-6 border border-[#cbb061]/40" />
                                    </div>

                                    {/* Aligned Glow Effect */}
                                    <AnimatePresence>
                                        {isAligned && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 bg-emerald-400/10 blur-xl animate-pulse"
                                            />
                                        )}
                                    </AnimatePresence>

                                    {/* Fringes (Top & Bottom) */}
                                    <div className="absolute top-0 inset-x-0 h-1 flex justify-around">
                                        {[...Array(20)].map((_, i) => (
                                            <div key={i} className="w-[2px] h-3 bg-[#cbb061]/60" />
                                        ))}
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 h-1 flex justify-around">
                                        {[...Array(20)].map((_, i) => (
                                            <div key={i} className="w-[2px] h-3 bg-[#cbb061]/60" />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Compass Overlay on Mat */}
                            <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 translate-y-1/2 z-30">
                                <div className="relative w-36 h-36 flex items-center justify-center">
                                    {/* Compass Orbit Ring */}
                                    <motion.div
                                        animate={{ rotate: rotation }}
                                        className="absolute inset-0 rounded-full border border-emerald-500/10"
                                    />

                                    {/* Main Compass Circle */}
                                    <div className="w-28 h-28 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-full border-[3px] border-emerald-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-center relative">
                                        {/* Direction Tick Marks */}
                                        <div className="absolute inset-1 rounded-full border border-slate-100 dark:border-white/5" />

                                        {/* Small Compass Dots */}
                                        {[...Array(12)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"
                                                style={{ transform: `rotate(${i * 30}deg) translateY(-46px)` }}
                                            />
                                        ))}

                                        {/* N S E W Labels */}
                                        <span className="absolute top-2 text-[9px] font-black text-slate-400">N</span>
                                        <span className="absolute bottom-2 text-[9px] font-black text-slate-400">S</span>
                                        <span className="absolute left-2 text-[9px] font-black text-slate-400">W</span>
                                        <span className="absolute right-2 text-[9px] font-black text-slate-400">E</span>

                                        {/* Modern Kaaba Representation */}
                                        <div className="relative w-12 h-12 bg-[#1a1a1a] rounded-xl flex flex-col items-center justify-center shadow-lg border border-[#cbb061]/30">
                                            <div className="w-full h-2 bg-[#cbb061] absolute top-2 flex items-center px-1 gap-0.5">
                                                <div className="w-1 h-1 bg-black/20 rounded-full" />
                                                <div className="w-1 h-1 bg-black/20 rounded-full" />
                                            </div>
                                            <div className="w-3 h-5 border-2 border-[#cbb061]/40 rounded-t-sm mt-3" />
                                        </div>

                                        {/* Dynamic Alignment Arrow */}
                                        <motion.div
                                            animate={{
                                                opacity: isAligned ? 1 : 0.3,
                                                scale: isAligned ? 1.25 : 1,
                                                y: isAligned ? -14 : -10
                                            }}
                                            className="absolute top-0 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[18px] border-b-emerald-500 z-40 transform"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="px-6 pb-12 flex justify-center items-center">
                        {needsPermission && (
                            <button
                                onClick={requestPermission}
                                className="bg-emerald-500 text-white px-8 py-4 rounded-[2rem] font-black shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                            >
                                <Compass className="w-5 h-5" />
                                <span>تفعيل البوصلة</span>
                            </button>
                        )}
                    </div>

                    {loading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </>
    );
}
