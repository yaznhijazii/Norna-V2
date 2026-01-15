import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ChevronLeft, Check, X } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface MoodSelectorProps {
    userId: string;
    partnerName?: string;
    onMoodUpdate?: (mood: string) => void;
}

const moods = [
    { id: 'serene', icon: '🤍', label: 'مطمئن', color: 'text-slate-100', bg: 'bg-slate-500/10' },
    { id: 'happy', icon: '❤️', label: 'سعيد', color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { id: 'seeking', icon: '💜', label: 'مشتاق', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'pensive', icon: '💙', label: 'متفكر', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'low', icon: '🖤', label: 'مرهق', color: 'text-slate-500', bg: 'bg-slate-500/10' },
];

export function MoodSelector({ userId, partnerName, onMoodUpdate }: MoodSelectorProps) {
    const [currentMood, setCurrentMood] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [partnerMood, setPartnerMood] = useState<any>(null);
    const [showSelector, setShowSelector] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const isUpdatedToday = () => {
        if (!lastUpdate) return false;
        const last = new Date(lastUpdate);
        const today = new Date();
        return last.getDate() === today.getDate() &&
            last.getMonth() === today.getMonth() &&
            last.getFullYear() === today.getFullYear();
    };

    useEffect(() => {
        if (!userId) return;
        loadMoods();

        const channel = supabase
            .channel(`mood-final-sync-${userId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'users'
            }, (payload) => {
                if (payload.new.id === userId) {
                    setCurrentMood(payload.new.current_mood);
                    setLastUpdate(payload.new.mood_updated_at);
                } else {
                    // This is the CRITICAL change: update partner mood independently
                    setPartnerMood({
                        mood: payload.new.current_mood,
                        updatedAt: payload.new.mood_updated_at
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    // Dispatch event when partner mood changes so header can sync
    useEffect(() => {
        if (partnerMood) {
            window.dispatchEvent(new CustomEvent('nooruna-partner-mood-sync', {
                detail: partnerMood
            }));
        }
    }, [partnerMood]);

    const loadMoods = async () => {
        const { data: user } = await supabase
            .from('users')
            .select('current_mood, mood_updated_at, partner_id')
            .eq('id', userId)
            .single();

        if (user) {
            setCurrentMood(user.current_mood);
            setLastUpdate(user.mood_updated_at);

            if (user.partner_id) {
                const { data: partner } = await supabase
                    .from('users')
                    .select('current_mood, mood_updated_at')
                    .eq('id', user.partner_id)
                    .single();
                if (partner) {
                    setPartnerMood({
                        mood: partner.current_mood,
                        updatedAt: partner.mood_updated_at
                    });
                }
            }
        }
    };

    const updateMood = async (moodId: string) => {
        setIsUpdating(true);
        const now = new Date().toISOString();
        const { error } = await supabase
            .from('users')
            .update({
                current_mood: moodId,
                mood_updated_at: now
            })
            .eq('id', userId);

        if (!error) {
            setCurrentMood(moodId);
            setLastUpdate(now);
            setShowSelector(false);
            if (onMoodUpdate) onMoodUpdate(moodId);
        }
        setIsUpdating(false);
    };

    const activeMood = moods.find(m => m.id === currentMood);
    const partnerActiveMood = moods.find(m => m.id === partnerMood?.mood);
    const needsUpdate = !isUpdatedToday();

    return (
        <div className="flex items-center gap-2">
            {/* My Section - Compact toggle */}
            <div className="relative">
                {needsUpdate ? (
                    <motion.button
                        layoutId="mood-final"
                        onClick={() => setShowSelector(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-lg group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 animate-pulse" />
                        <div className="relative z-10 flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-pink-400 animate-pulse" fill="currentColor" />
                            <span className="text-[10px] font-black text-white/90 uppercase tracking-widest leading-none">قلبك اليوم</span>
                            <ChevronLeft className="w-2.5 h-2.5 text-white/30 group-hover:translate-x-[-2px] transition-transform" />
                        </div>
                    </motion.button>
                ) : (
                    <motion.button
                        layoutId="mood-final"
                        onClick={() => setShowSelector(true)}
                        className={`group relative flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-700 bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10`}
                    >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap tracking-widest uppercase">
                            قلبي: {activeMood?.label}
                        </div>
                        <div className="text-lg">
                            {activeMood?.icon}
                        </div>
                    </motion.button>
                )}

                {/* Horizontal Heart Selector Modal */}
                <AnimatePresence>
                    {showSelector && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
                                onClick={() => setShowSelector(false)}
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="relative w-full max-w-[320px] bg-[#0F172A] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
                            >
                                <div className="p-4 flex items-center justify-between border-b border-white/5">
                                    <span className="text-[11px] font-black text-white/80 tracking-widest uppercase">كيف تجد قلبك الآن؟</span>
                                    <button
                                        onClick={() => setShowSelector(false)}
                                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="p-5">
                                    <div className="flex justify-between gap-1.5 overflow-x-auto pb-2">
                                        {moods.map((mood) => (
                                            <button
                                                key={mood.id}
                                                onClick={() => updateMood(mood.id)}
                                                disabled={isUpdating}
                                                className={`flex-1 min-w-[50px] flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all border group
                                                    ${currentMood === mood.id
                                                        ? 'bg-white/10 border-white/20'
                                                        : 'bg-white/5 border-transparent hover:border-white/10'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-900 border border-white/5 group-hover:scale-110 transition-transform relative text-xl`}>
                                                    {mood.icon}
                                                    {currentMood === mood.id && (
                                                        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-[#0F172A]">
                                                            <Check className="w-2 h-2 text-white" strokeWidth={5} />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-[9px] font-black whitespace-nowrap ${currentMood === mood.id ? 'text-white' : 'text-white/40'}`}>
                                                    {mood.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Partner's Heart - Visible on my screen */}
            <AnimatePresence>
                {partnerActiveMood && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group relative flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
                    >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap tracking-widest uppercase">
                            قلب {partnerName?.split(' ')[0]}: {partnerActiveMood.label}
                        </div>
                        <span className="text-lg leading-none select-none">{partnerActiveMood.icon}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
