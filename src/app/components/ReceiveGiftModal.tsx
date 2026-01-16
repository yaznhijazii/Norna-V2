import { useState, useEffect } from 'react';
import { Heart, MessageCircle, ThumbsUp, Flame, Star, HandHeart, X, Quote } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { RoseIcon } from './RoseIcon';
import { addReactionToGift, ReactionType } from '../utils/db';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface Gift {
    id: string;
    gift_type: 'rose' | 'heart' | 'message' | 'poke' | 'dua';
    message_text?: string;
    from_user_id: string;
    created_at: string;
    reaction?: string | null;
}

interface ReceiveGiftModalProps {
    gift: Gift | null;
    senderName: string;
    onClose: () => void;
}

export function ReceiveGiftModal({ gift, senderName, onClose }: ReceiveGiftModalProps) {
    const [selectedReaction, setSelectedReaction] = useState<ReactionType>(gift?.reaction as ReactionType || null);
    const [isReacting, setIsReacting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (gift) {
            setIsVisible(true);
            // Trigger confetti for roses and hearts
            if (gift.gift_type === 'rose' || gift.gift_type === 'heart') {
                const colors = gift.gift_type === 'rose' ? ['#f43f5e', '#fb7185', '#fda4af'] : ['#ef4444', '#f87171', '#fca5a5'];
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors
                });
            }
        }
    }, [gift]);

    if (!gift) return null;

    const handleClose = async () => {
        setIsVisible(false);
        setTimeout(async () => {
            try {
                await supabase
                    .from('gifts')
                    .update({
                        is_read: true,
                        read_at: new Date().toISOString()
                    })
                    .eq('id', gift.id);
            } catch (error) {
                console.error('Error marking gift as read:', error);
            }
            onClose();
        }, 200);
    };

    const handleReaction = async (reaction: ReactionType) => {
        if (isReacting) return;
        setIsReacting(true);

        try {
            const result = await addReactionToGift(gift.id, reaction);
            if (result) {
                setSelectedReaction(reaction);
                // Simple success haptic feedback feel
                confetti({
                    particleCount: 20,
                    spread: 30,
                    origin: { y: 0.8 },
                    colors: ['#3b82f6', '#ef4444', '#eab308']
                });
            }
        } catch (error) {
            console.error('Exception adding reaction:', error);
        } finally {
            setIsReacting(false);
        }
    };

    const getGiftConfig = () => {
        switch (gift.gift_type) {
            case 'rose':
                return {
                    icon: <RoseIcon size={80} animate={false} />,
                    color: 'rose',
                    text: 'أهداك وردة تعبّر عن المودة',
                    emoji: '🌹',
                    accent: 'bg-rose-500',
                    glow: 'bg-rose-400/20'
                };
            case 'heart':
                return {
                    icon: (
                        <div className="relative">
                            <Heart className="w-20 h-20 text-red-500 drop-shadow-xl" fill="currentColor" />
                        </div>
                    ),
                    color: 'red',
                    text: 'أرسل لك فيضاً من مشاعره',
                    emoji: '❤️',
                    accent: 'bg-red-500',
                    glow: 'bg-red-400/20'
                };
            case 'message':
                return {
                    icon: (
                        <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 via-blue-600 to-indigo-700 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-blue-500/30">
                                <MessageCircle className="w-8 h-8 text-white" fill="white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-blue-50">
                                <Heart className="w-3 h-3 text-blue-500 fill-blue-500" />
                            </div>
                        </div>
                    ),
                    color: 'blue',
                    text: 'كتب لك مسودة من المشاعر',
                    emoji: '💌',
                    accent: 'bg-blue-500',
                    glow: 'bg-blue-500/20'
                };
            case 'poke':
                return {
                    icon: (
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/20 border-2 border-white">
                            <HandHeart className="w-8 h-8 text-white" />
                        </div>
                    ),
                    color: 'amber',
                    text: 'يلفت انتباهك بلطف',
                    emoji: '🔔',
                    accent: 'bg-amber-500',
                    glow: 'bg-amber-400/25'
                };
            case 'dua':
                return {
                    icon: (
                        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-teal-600 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-emerald-500/20 transform rotate-12">
                            <Quote className="w-7 h-7 text-white -rotate-12" />
                        </div>
                    ),
                    color: 'emerald',
                    text: 'خصّك بدعوة في ظهر الغيب',
                    emoji: '🤲',
                    accent: 'bg-emerald-500',
                    glow: 'bg-emerald-400/20'
                };
        }
    };

    const config = getGiftConfig();

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 overflow-y-auto"
                    onClick={handleClose}
                >
                    {/* Animated Magic Particles */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-white rounded-full"
                                animate={{
                                    y: [-20, -120],
                                    x: [0, (i % 2 === 0 ? 50 : -50)],
                                    opacity: [0, 0.8, 0],
                                    scale: [0, 1.5, 0]
                                }}
                                transition={{
                                    duration: 2 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: i * 0.4,
                                    ease: "easeInOut"
                                }}
                                style={{
                                    left: `${20 + i * 12}%`,
                                    bottom: '20%'
                                }}
                            />
                        ))}
                    </div>

                    <motion.div
                        initial={{ scale: 0.9, y: 30, opacity: 0, rotate: -2 }}
                        animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.9, y: 30, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 180 }}
                        className="relative w-full max-w-[400px] bg-white rounded-[3rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-6 left-6 w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 z-50 transition-all border border-slate-100 hover:rotate-90"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8 pb-10 relative z-10">
                            {/* Header Title */}
                            <div className="text-center mb-10">
                                <motion.div
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-[10px] font-black text-amber-700 uppercase tracking-[0.2em] mb-4 shadow-sm"
                                >
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                    مفاجأة جديدة من القلب
                                </motion.div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-relaxed px-4">
                                    وصلتك هدية مميزة
                                </h3>
                            </div>

                            {/* Main Visual with Glow */}
                            <div className="flex justify-center mb-10">
                                <div className="relative">
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className={`absolute inset-0 ${config.glow} blur-3xl rounded-full`}
                                    />
                                    <motion.div
                                        initial={{ rotate: -15, scale: 0.5 }}
                                        animate={{ rotate: 0, scale: 1 }}
                                        transition={{ type: "spring", damping: 15, stiffness: 150 }}
                                        className="relative z-10"
                                    >
                                        {config.icon}
                                    </motion.div>
                                </div>
                            </div>

                            {/* Gift Message Card - Premium Box */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="relative mb-10 group"
                            >
                                <div className="absolute inset-0 bg-amber-50/60 rounded-[2rem] transform rotate-1 group-hover:rotate-0 transition-transform duration-500" />
                                <div className="relative bg-white border border-amber-100/50 rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border-b-4 border-b-amber-100/40">
                                    <Quote className="absolute -top-4 -right-4 w-10 h-10 text-amber-100 transform scale-x-[-1]" />

                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-amber-600/50 mb-3 uppercase tracking-widest">{config.text}</p>
                                        {gift.message_text && gift.gift_type === 'message' ? (
                                            <p className="text-2xl font-bold text-slate-800 leading-relaxed font-amiri" dir="rtl">
                                                {gift.message_text}
                                            </p>
                                        ) : (
                                            <div className="text-5xl pt-2">{config.emoji}</div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Reaction Section */}
                            <div className="text-center pt-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">تفاعل مع هذه اللفتة الطيبة</p>
                                <div className="flex justify-center gap-4">
                                    {[
                                        { id: 'like', icon: ThumbsUp, color: 'blue', label: 'أعجبني' },
                                        { id: 'fire', icon: Flame, color: 'orange', label: 'رهيب' },
                                        { id: 'star', icon: Star, color: 'amber', label: 'مميز' },
                                        { id: 'pray', icon: HandHeart, color: 'rose', label: 'ممنون' }
                                    ].map((item) => (
                                        <motion.button
                                            key={item.id}
                                            whileHover={{ y: -6 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleReaction(item.id as ReactionType)}
                                            disabled={isReacting}
                                            className="group flex flex-col items-center gap-1.5"
                                        >
                                            <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500
                        ${selectedReaction === item.id
                                                    ? `bg-${item.color}-500 text-white shadow-xl shadow-${item.color}-500/30 scale-110`
                                                    : 'bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-600 border border-slate-100 group-hover:shadow-lg group-hover:border-slate-200'
                                                }
                      `}>
                                                <item.icon className="w-5 h-5" strokeWidth={selectedReaction === item.id ? 2.5 : 2} />
                                            </div>
                                            <span className={`text-[8px] font-black uppercase tracking-tight transition-colors ${selectedReaction === item.id ? `text-${item.color}-600` : 'text-slate-400'}`}>
                                                {item.label}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Info Bar */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="py-5 bg-slate-50/80 border-t border-slate-100 text-center backdrop-blur-sm"
                        >
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                اضغط في أي مكان للإغلاق
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                            </p>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
