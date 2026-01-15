import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Flag, User as UserIcon, Heart } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface JourneyProps {
    userId: string;
    partnerId?: string;
    partnerName?: string;
}

export function SharedJourney({ userId, partnerId, partnerName }: JourneyProps) {
    const [userProgress, setUserProgress] = useState(0);
    const [partnerProgress, setPartnerProgress] = useState(0);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);

    useEffect(() => {
        loadProgress();

        // Subscription for real-time updates
        const channel = supabase
            .channel('journey-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_challenges'
            }, () => {
                loadProgress();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, partnerId]);

    const loadProgress = async () => {
        // Load user progress
        const { data: userData } = await supabase
            .from('user_challenges')
            .select('progress_percent')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (userData && userData.length > 0) {
            const avg = userData.reduce((acc, curr) => acc + curr.progress_percent, 0) / userData.length;
            setUserProgress(avg);
        }

        // Load partner progress
        if (partnerId) {
            const { data: pData } = await supabase
                .from('user_challenges')
                .select('progress_percent')
                .eq('user_id', partnerId)
                .eq('status', 'active');

            if (pData && pData.length > 0) {
                const avg = pData.reduce((acc, curr) => acc + curr.progress_percent, 0) / pData.length;
                setPartnerProgress(avg);
            }

            // Load avatars
            const { data: profiles } = await supabase
                .from('users')
                .select('id, avatar_url')
                .in('id', [userId, partnerId]);

            profiles?.forEach(p => {
                if (p.id === userId) setUserAvatar(p.avatar_url);
                if (p.id === partnerId) setPartnerAvatar(p.avatar_url);
            });
        }
    };

    return (
        <div className="premium-card p-6 border-white/20 dark:border-white/5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">رحلة النور المشتركة</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">تقدمكم نحو الأهداف الروحية</p>
                </div>
                <div className="flex -space-x-2 rtl:space-x-reverse">
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 overflow-hidden">
                        {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 m-2 text-slate-400" />}
                    </div>
                    {partnerId && (
                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-100 overflow-hidden">
                            {partnerAvatar ? <img src={partnerAvatar} className="w-full h-full object-cover" /> : <Heart className="w-4 h-4 m-2 text-emerald-400" />}
                        </div>
                    )}
                </div>
            </div>

            {/* Journey Map Path */}
            <div className="relative h-24 mb-4 flex items-center">
                {/* Horizontal Track */}
                <div className="absolute left-4 right-4 h-1 bg-slate-100 dark:bg-white/5 rounded-full" />

                {/* Dashed Progress Line */}
                <svg className="absolute left-4 right-4 w-[calc(100%-2rem)] h-1 overflow-visible">
                    <line
                        x1="0" y1="2" x2="100%" y2="2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className="text-slate-200 dark:text-white/10"
                    />
                </svg>

                {/* Start & End Pins */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                    <MapPin className="w-4 h-4 text-slate-300" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">البداية</span>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                    <Flag className="w-4 h-4 text-emerald-500" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">الهدف</span>
                </div>

                {/* User Mark */}
                <motion.div
                    className="absolute z-10"
                    initial={{ left: '0%' }}
                    animate={{ left: `${userProgress}%` }}
                    transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                >
                    <div className="relative -translate-x-1/2 -translate-y-8 flex flex-col items-center">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-white/10 flex items-center justify-center overflow-hidden">
                            {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rotate-45 -mt-1 border-r border-b border-slate-100 dark:border-white/10" />
                        <span className="text-[9px] font-black text-slate-600 dark:text-white/60 mt-2">أنت</span>
                    </div>
                </motion.div>

                {/* Partner Mark */}
                {partnerId && (
                    <motion.div
                        className="absolute z-10"
                        initial={{ left: '0%' }}
                        animate={{ left: `${partnerProgress}%` }}
                        transition={{ type: 'spring', stiffness: 50, damping: 15, delay: 0.2 }}
                    >
                        <div className="relative -translate-x-1/2 translate-y-6 flex flex-col items-center">
                            <div className="w-2 h-2 bg-emerald-500 rotate-45 -mb-1" />
                            <div className="w-8 h-8 rounded-xl bg-emerald-500 shadow-xl border-2 border-white/20 flex items-center justify-center overflow-hidden">
                                {partnerAvatar ? <img src={partnerAvatar} className="w-full h-full object-cover" /> : <Heart className="w-4 h-4 text-white" />}
                            </div>
                            <span className="text-[9px] font-black text-emerald-500 mt-2">{partnerName || 'الشريك'}</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4 mt-12 bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">إنجازك</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">{Math.round(userProgress)}%</p>
                </div>
                <div className="text-center border-r border-white/10">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">إنجاز {partnerName || 'الشريك'}</p>
                    <p className="text-2xl font-black text-emerald-500">{Math.round(partnerProgress)}%</p>
                </div>
            </div>
        </div>
    );
}
