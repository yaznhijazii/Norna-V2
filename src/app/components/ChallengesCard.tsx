import { Trophy, BookOpen, ChevronRight, Clock, HandHeart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export interface UserChallengeData {
    id: string;
    type: 'quran' | 'charity';
    title: string;
    details: Record<string, string>;
    progress: number;
    partnerProgress: number;
    startDate: string;
    targetDate?: string;
}

interface ChallengesCardProps {
    onChallengesClick: () => void;
    activeChallenges: UserChallengeData[];
    partnerId?: string;
    partnerName?: string;
}

export function ChallengesCard({ onChallengesClick, activeChallenges, partnerName = 'الشريك' }: ChallengesCardProps) {
    const activeChallenge = activeChallenges[0];

    if (!activeChallenge) {
        return (
            <motion.button
                onClick={onChallengesClick}
                whileTap={{ scale: 0.98 }}
                className="w-full p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] text-white text-right relative overflow-hidden shadow-lg"
            >
                <div className="relative z-10">
                    <Trophy className="w-6 h-6 text-white/30 mb-3" />
                    <h3 className="text-sm font-black mb-1">منافسة جديدة</h3>
                    <p className="text-white/70 text-[9px] font-bold leading-relaxed mb-4">﴿وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ﴾</p>
                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest bg-white/10 w-fit px-3 py-1.5 rounded-lg active:bg-white/20 transition-colors">
                        ابدأ التحدي <ChevronRight className="w-3 h-3" />
                    </div>
                </div>
                <Sparkles className="absolute -bottom-4 -left-4 w-24 h-24 text-white/5" />
            </motion.button>
        );
    }

    const isQuran = activeChallenge.type === 'quran';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] p-6 border border-slate-100 dark:border-white/5 relative overflow-hidden shadow-sm group">
            {/* Challenge Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isQuran ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {isQuran ? <BookOpen className="w-5 h-5" /> : <HandHeart className="w-5 h-5" />}
                    </div>
                    <div>
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">تحدي مشتـرك</h4>
                        <span className="text-xs font-black text-slate-800 dark:text-white">
                            {isQuran ? activeChallenge.details.surah : `صدقة: ${activeChallenge.details.amount}`}
                        </span>
                    </div>
                </div>
                <div className="px-3 py-1 rounded-lg bg-orange-500/10 text-orange-500 text-[8px] font-black uppercase tracking-widest">
                    منافسة
                </div>
            </div>

            {/* VS Battle Section */}
            <div className="relative flex items-center justify-between mb-8 px-2">
                {/* User Side */}
                <div className="flex flex-col items-center gap-3 flex-1">
                    <div className="relative">
                        <svg className="w-16 h-16 transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                            <motion.circle
                                cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                                strokeDasharray={176}
                                initial={{ strokeDashoffset: 176 }}
                                animate={{ strokeDashoffset: 176 - (176 * activeChallenge.progress) / 100 }}
                                className="text-indigo-500 transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-black text-slate-900 dark:text-white leading-none">{activeChallenge.progress}%</span>
                        </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">أنت</span>
                </div>

                {/* VS Badge */}
                <div className="z-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mt-[-10px]">
                    <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-[10px] shadow-xl ring-4 ring-white dark:ring-slate-900">
                        VS
                    </div>
                </div>

                {/* Partner Side */}
                <div className="flex flex-col items-center gap-3 flex-1">
                    <div className="relative">
                        <svg className="w-16 h-16 transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                            <motion.circle
                                cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                                strokeDasharray={176}
                                initial={{ strokeDashoffset: 176 }}
                                animate={{ strokeDashoffset: 176 - (176 * activeChallenge.partnerProgress) / 100 }}
                                className="text-emerald-500 transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-black text-slate-900 dark:text-white leading-none">{activeChallenge.partnerProgress}%</span>
                        </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[60px]">{partnerName}</span>
                </div>
            </div>

            <button
                onClick={onChallengesClick}
                className="w-full h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-[10px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all"
            >
                {activeChallenge.progress >= 100 ? 'تم الإكمال' : 'تحديث التقدم'}
            </button>
        </div>
    );
}
