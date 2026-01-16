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
    { id: 'serene', label: 'مطمئن', color: 'text-white', fill: '#f8fafc', bg: 'bg-slate-200/20' },
    { id: 'happy', label: 'سعيد', color: 'text-rose-500', fill: '#f43f5e', bg: 'bg-rose-500/10' },
    { id: 'seeking', label: 'مشتاق', color: 'text-purple-400', fill: '#c084fc', bg: 'bg-purple-500/10' },
    { id: 'pensive', label: 'متفكر', color: 'text-blue-400', fill: '#60a5fa', bg: 'bg-blue-500/10' },
    { id: 'low', label: 'مرهق', color: 'text-slate-400', fill: '#94a3b8', bg: 'bg-slate-500/10' },
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
    const needsUpdate = !isUpdatedToday();

    return (
        <div className="flex items-center gap-2">
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
                        className={`group relative flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-700 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 shadow-lg`}
                    >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap tracking-widest uppercase">
                            قلبي: {activeMood?.label}
                        </div>
                        <Heart
                            className={`w-5 h-5 ${activeMood?.color || 'text-white/40'}`}
                            fill={activeMood ? activeMood.fill : 'none'}
                            style={{ filter: activeMood ? `drop-shadow(0 0 8px ${activeMood.fill}40)` : 'none' }}
                        />
                    </motion.button>
                )}

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
                                className="relative w-full max-w-[320px] bg-[#1a2234] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                            >
                                <div className="p-6 flex items-center justify-between border-b border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase mb-1">الحالة النفسية</span>
                                        <h3 className="text-sm font-black text-white">كيف تجد قلبك الآن؟</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowSelector(false)}
                                        className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-5 gap-3">
                                        {moods.map((mood) => (
                                            <button
                                                key={mood.id}
                                                onClick={() => updateMood(mood.id)}
                                                disabled={isUpdating}
                                                className={`flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all border group
                                                    ${currentMood === mood.id
                                                        ? 'bg-white/10 border-white/20'
                                                        : 'bg-white/5 border-transparent hover:border-white/10'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-950/50 border border-white/5 group-hover:scale-110 transition-all duration-300 relative`}>
                                                    <Heart
                                                        className={`w-6 h-6 ${mood.color}`}
                                                        fill={mood.fill}
                                                        style={{ filter: `drop-shadow(0 0 6px ${mood.fill}40)` }}
                                                    />
                                                    {currentMood === mood.id && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-[#1a2234]">
                                                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
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
        </div>
    );
}
