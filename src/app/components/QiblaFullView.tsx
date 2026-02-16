import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, MapPin, X, Navigation, Compass, Camera } from 'lucide-react';
import { useQiblaDirection } from '../hooks/useQiblaDirection';

interface QiblaFullViewProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QiblaFullView({ isOpen, onClose }: QiblaFullViewProps) {
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
                    <div /> {/* Spacer to keep close button on the left (or right in RTL) */}

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
                    <div className="absolute top-[18%] z-20 w-full px-10">
                        <motion.div
                            animate={{
                                borderColor: isAligned ? '#10b981' : 'transparent',
                                scale: isAligned ? 1.02 : 1
                            }}
                            className={`mx-auto max-w-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-2 px-6 py-4 rounded-[2rem] shadow-xl shadow-emerald-500/5 flex items-center justify-center gap-4 transition-colors ${isAligned ? 'border-emerald-500' : 'border-white dark:border-white/10'}`}
                        >
                            {!isAligned && qiblaDirection !== null && deviceHeading !== null && (
                                <motion.div
                                    animate={{ rotate: rotation > 0 ? 15 : -15 }}
                                    transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
                                >
                                    <Navigation className={`w-5 h-5 ${rotation > 0 ? 'rotate-[90deg]' : 'rotate-[-90deg]'} text-emerald-500`} />
                                </motion.div>
                            )}

                            {(qiblaDirection === null || deviceHeading === null) && (
                                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            )}

                            <span className={`text-base font-black tracking-tight ${isAligned ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                {getInstruction()}
                            </span>

                            {isAligned && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
                                >
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                </motion.div>
                            )}
                        </motion.div>
                    </div>

                    {/* Prayer Mat (CSS Representation) */}
                    <div className="relative mt-20 perspective-[1000px]">
                        <motion.div
                            animate={{
                                rotateX: 45,
                                rotateY: 0,
                                rotateZ: -rotation,
                            }}
                            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                            className="w-64 h-[400px] bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-[10px] shadow-2xl relative overflow-hidden border-[6px] border-[#cbb061]"
                        >
                            {/* Intricate Patterns */}
                            <div className="absolute inset-4 border-2 border-[#cbb061]/30 rounded-[4px]" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                <div className="w-full h-full bg-[radial-gradient(circle_at_center,_#cbb061_0%,_transparent_70%)] bg-[length:20px_20px]" />
                            </div>

                            {/* Mihrab shape */}
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-48 border-t-[8px] border-x-[8px] border-[#cbb061]/50 rounded-t-full" />

                            {/* Fringes */}
                            <div className="absolute top-0 inset-x-0 h-2 bg-[repeating-linear-gradient(90deg,_#cbb061_0px,_#cbb061_2px,_transparent_2px,_transparent_4px)]" />
                            <div className="absolute bottom-0 inset-x-0 h-2 bg-[repeating-linear-gradient(90deg,_#cbb061_0px,_#cbb061_2px,_transparent_2px,_transparent_4px)]" />
                        </motion.div>

                        {/* Compass Overlay on Mat */}
                        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 translate-y-1/2 z-30">
                            <div className="relative w-32 h-32 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full border-4 border-emerald-500/20 shadow-2xl flex items-center justify-center">
                                {/* Compass Markers */}
                                <div className="absolute inset-2 border border-slate-200 dark:border-white/5 rounded-full" />
                                <span className="absolute top-1 text-[10px] font-black text-slate-400">N</span>
                                <span className="absolute bottom-1 text-[10px] font-black text-slate-400">S</span>
                                <span className="absolute left-1 text-[10px] font-black text-slate-400">W</span>
                                <span className="absolute right-1 text-[10px] font-black text-slate-400">E</span>

                                {/* Kaaba Center Icon */}
                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex flex-col items-center justify-center shadow-lg transform translate-y-1">
                                    <div className="w-full h-1 bg-amber-400 mb-0.5" />
                                    <div className="flex gap-0.5">
                                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                                    </div>
                                </div>

                                {/* Alignment Indicator (Green Triangle) */}
                                <motion.div
                                    animate={{
                                        opacity: isAligned ? 1 : 0.3,
                                        scale: isAligned ? 1.2 : 1
                                    }}
                                    className="absolute top-4 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[15px] border-b-emerald-500 transform -translate-y-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="px-6 pb-12 flex justify-between items-center">
                    <button className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400">
                        <Camera className="w-6 h-6" />
                    </button>

                    {needsPermission && (
                        <button
                            onClick={requestPermission}
                            className="bg-emerald-500 text-white px-8 py-4 rounded-[2rem] font-black shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                        >
                            <Compass className="w-5 h-5" />
                            <span>تفعيل البوصلة</span>
                        </button>
                    )}

                    <div className="w-12 h-12" /> {/* Spacer */}
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
