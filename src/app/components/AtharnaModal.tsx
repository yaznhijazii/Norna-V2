import { motion, AnimatePresence } from 'motion/react';
import { X, Gift as GiftIcon, Heart, MessageCircle, Sparkles, Clock, Share2, Download, Instagram, Camera, Shapes } from 'lucide-react';
import { useState, useRef } from 'react';

interface Interaction {
    id: string;
    from_user_id?: string;
    user_id?: string;
    to_user_id?: string;
    gift_type: string;
    message_text?: string;
    created_at: string;
}

interface AtharnaModalProps {
    isOpen: boolean;
    onClose: () => void;
    interactions: Interaction[];
    currentUserId: string;
    partnerName: string;
}

export function AtharnaModal({ isOpen, onClose, interactions, currentUserId, partnerName }: AtharnaModalProps) {
    const [selectedStory, setSelectedStory] = useState<Interaction | null>(null);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getGiftIcon = (type: string, size: string = "w-6 h-6") => {
        switch (type) {
            case 'heart': return <Heart className={`${size} text-rose-500`} fill="currentColor" />;
            case 'rose': return <span className={size === "w-6 h-6" ? "text-2xl" : "text-6xl"}>🌹</span>;
            case 'message': return <MessageCircle className={`${size} text-indigo-500`} />;
            case 'dua': return <span className={size === "w-6 h-6" ? "text-2xl" : "text-6xl"}>🤲</span>;
            case 'poke': return <Sparkles className={`${size} text-amber-500`} />;
            default: return <GiftIcon className={`${size} text-slate-400`} />;
        }
    };

    const getGiftLabel = (type: string) => {
        switch (type) {
            case 'heart': return 'نبض مودة';
            case 'rose': return 'وردة تقدير';
            case 'message': return 'رسالة خاصة';
            case 'dua': return 'دعاء بظهر الغيب';
            case 'poke': return 'تنبيه غالي';
            default: return 'هدية تذكارية';
        }
    };

    const getStoryGradient = (type: string) => {
        switch (type) {
            case 'heart': return 'from-rose-500 to-pink-600';
            case 'rose': return 'from-emerald-500 to-teal-600';
            case 'message': return 'from-indigo-500 to-blue-600';
            case 'dua': return 'from-amber-400 to-orange-500';
            case 'poke': return 'from-violet-500 to-purple-600';
            default: return 'from-slate-700 to-slate-900';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 30 }}
                        className="relative w-full max-w-2xl bg-[#FDFDFF] dark:bg-slate-950 rounded-none sm:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col h-full sm:h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-950 sticky top-0 z-20">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">أثرنا الخالد</h2>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">سجل الهدايا والرسائل المتبادلة</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:rotate-90 transition-transform duration-500"
                            >
                                <X className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                            {interactions.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {interactions.map((interaction) => {
                                        const isSent = (interaction.from_user_id || (interaction as any).user_id) === currentUserId;
                                        return (
                                            <motion.div
                                                key={interaction.id}
                                                whileHover={{ y: -4 }}
                                                className={`p-8 rounded-[2.5rem] border relative overflow-hidden group transition-all duration-500 ${isSent
                                                        ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm'
                                                        : 'bg-white dark:bg-slate-900 border-orange-100 dark:border-orange-500/10 shadow-xl shadow-orange-500/5'
                                                    }`}
                                            >
                                                {/* Decorative Background Icon */}
                                                <div className="absolute -top-6 -right-6 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                                                    {getGiftIcon(interaction.gift_type, "w-40 h-40")}
                                                </div>

                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isSent ? 'bg-slate-50 dark:bg-slate-800' : 'bg-orange-50 dark:bg-orange-500/10'}`}>
                                                                {getGiftIcon(interaction.gift_type)}
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                                                                    {isSent ? 'هدية منك' : `هدية من ${partnerName}`}
                                                                </span>
                                                                <h3 className="font-black text-slate-900 dark:text-white text-lg">{getGiftLabel(interaction.gift_type)}</h3>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-full">
                                                            {formatTime(interaction.created_at)}
                                                        </span>
                                                    </div>

                                                    {interaction.message_text && (
                                                        <div className="mb-6 relative">
                                                            <div className="absolute -left-2 top-0 text-4xl text-orange-500/20 font-serif">“</div>
                                                            <div className="bg-slate-50/80 dark:bg-black/20 px-6 py-5 rounded-[2rem] border border-white dark:border-white/5 backdrop-blur-sm">
                                                                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-bold italic text-right">
                                                                    {interaction.message_text}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => setSelectedStory(interaction)}
                                                            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#0B0F17] text-white text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/20"
                                                        >
                                                            <Instagram className="w-4 h-4" />
                                                            نشر كستوري
                                                        </button>
                                                        <button className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                                            <Share2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-white dark:bg-slate-800 shadow-2xl flex items-center justify-center mb-6 rotate-12">
                                        <GiftIcon className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">السجل لا يزال ينتظر</h3>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-[200px]">لا يوجد هدايا في سجلكم الخالد بعد</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Quote */}
                        <div className="p-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-white/5 text-center">
                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-600 leading-relaxed italic">
                                "الهدايا تبقى، والكلمات تخلد في القلب أثرًا لا يمحى"
                            </p>
                        </div>
                    </motion.div>

                    {/* STORY PREVIEW OVERLAY */}
                    <AnimatePresence>
                        {selectedStory && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setSelectedStory(null)}
                                    className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
                                />

                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                    exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
                                    className="relative w-full max-w-[380px] aspect-[9/16] rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border-[8px] border-white/10"
                                >
                                    {/* Instagram Story-like UI */}
                                    <div className={`absolute inset-0 bg-gradient-to-v ${getStoryGradient(selectedStory.gift_type)} p-10 flex flex-col items-center justify-center text-center`}>
                                        {/* Background Decoration */}
                                        <div className="absolute inset-0 opacity-20">
                                            <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:40px_40px]" />
                                        </div>

                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="w-full space-y-8 relative z-10"
                                        >
                                            <div className="w-32 h-32 rounded-[2.5rem] bg-white shadow-2xl mx-auto flex items-center justify-center rotate-6">
                                                {getGiftIcon(selectedStory.gift_type, "w-16 h-16")}
                                            </div>

                                            <div>
                                                <span className="text-white/70 text-[10px] font-black uppercase tracking-[0.3em] block mb-2">أثر خالد من {selectedStory.from_user_id === currentUserId ? 'قلبي' : partnerName}</span>
                                                <h1 className="text-3xl font-black text-white tracking-tight">{getGiftLabel(selectedStory.gift_type)}</h1>
                                            </div>

                                            {selectedStory.message_text && (
                                                <div className="relative px-4">
                                                    <div className="text-6xl text-white/20 absolute -top-8 -left-2 font-serif">“</div>
                                                    <p className="text-xl font-bold text-white leading-relaxed italic text-right relative z-10">
                                                        {selectedStory.message_text}
                                                    </p>
                                                    <div className="text-6xl text-white/20 absolute -bottom-16 -right-2 font-serif">”</div>
                                                </div>
                                            )}

                                            <div className="pt-8">
                                                <div className="h-1 w-12 bg-white/30 rounded-full mx-auto mb-4" />
                                                <span className="text-white/50 text-[10px] font-black uppercase tracking-widest leading-none">تطبيق نورنا • {formatTime(selectedStory.created_at)}</span>
                                            </div>
                                        </motion.div>

                                        {/* App Branding Bottom */}
                                        <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2">
                                            <div className="px-5 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                                                NORONA APP
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Overlay (Hidden in actual capture instructions) */}
                                    <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3">
                                        <button
                                            onClick={() => {/* Actual capture logic would go here, user will screenshot for now */ }}
                                            className="flex-1 bg-white text-black h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all"
                                        >
                                            <Camera className="w-4 h-4" />
                                            التقط صورة
                                        </button>
                                        <button
                                            onClick={() => setSelectedStory(null)}
                                            className="w-14 h-14 rounded-2xl bg-black/50 backdrop-blur-xl text-white flex items-center justify-center border border-white/20"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </motion.div>

                                {/* Instruction Tooltip */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute top-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 pointer-events-none"
                                >
                                    <p className="text-white text-[10px] font-black uppercase tracking-widest">قم بتصوير الشاشة لمشاركة الأثر 📸</p>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </AnimatePresence>
    );
}
