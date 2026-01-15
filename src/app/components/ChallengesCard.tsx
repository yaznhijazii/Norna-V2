import { Trophy, BookOpen, ChevronRight, Clock, HandHeart } from 'lucide-react';
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
                className="w-full p-8 bg-indigo-500 rounded-[2.5rem] text-white text-right relative overflow-hidden"
            >
                <div className="relative z-10">
                    <Trophy className="w-8 h-8 text-white/30 mb-4" />
                    <h3 className="text-lg font-bold mb-1">تحدي جديد</h3>
                    <p className="text-white/70 text-[10px] font-medium leading-relaxed mb-6">﴿وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ﴾</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/10 w-fit px-4 py-2 rounded-xl">
                        ابدأ الآن <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </motion.button>
        );
    }

    const isQuran = activeChallenge.type === 'quran';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 relative overflow-hidden group">
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isQuran ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                        {isQuran ? <BookOpen className="w-6 h-6" /> : <HandHeart className="w-6 h-6" />}
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">تحدي جاري</h4>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">
                            {isQuran ? activeChallenge.details.surah : `صدقة: ${activeChallenge.details.amount}`}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                    <Clock className="w-3.5 h-3.5" />
                    جاري
                </div>
            </div>

            <div className="space-y-6 mb-8">
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold px-1 uppercase text-slate-400">
                        <span>أنت</span>
                        <span className="text-indigo-500">{activeChallenge.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${activeChallenge.progress}%` }} className="h-full bg-indigo-500" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold px-1 uppercase text-slate-400">
                        <span>{partnerName}</span>
                        <span className="text-emerald-500">{activeChallenge.partnerProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${activeChallenge.partnerProgress}%` }} className="h-full bg-emerald-500" />
                    </div>
                </div>
            </div>

            <button
                onClick={onChallengesClick}
                className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all"
            >
                {activeChallenge.progress >= 100 ? 'تم الإكمال' : 'تحديث التقدم'}
            </button>
        </div>
    );
}
