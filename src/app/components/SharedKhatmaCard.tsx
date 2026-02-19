import { useState } from 'react';
import { BookOpen, Calendar, Trash2, Edit2, CheckCircle2, Award, User, BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';
import { deleteSharedKhatma } from '../utils/db';
import { toast } from 'sonner';
import { useRamadan } from '../hooks/useRamadan';

interface SharedKhatmaCardProps {
    currentUserId: string;
    partner: any | null;
    activeKhatma: any | null; // Shared Khatma Object
    onStartKhatma: () => void;
    onContinue: () => void;
    onRefresh: () => void;
}

export function SharedKhatmaCard({ currentUserId, partner, activeKhatma, onStartKhatma, onContinue, onRefresh }: SharedKhatmaCardProps) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!activeKhatma) return;
        if (confirm('هل أنت متأكد من حذف الختمة المشتركة؟')) {
            setLoading(true);
            await deleteSharedKhatma(activeKhatma.id);
            setLoading(false);
            toast.success('تم حذف الختمة');
            onRefresh();
        }
    };

    const getDaysLeft = () => {
        if (!activeKhatma?.end_date) return 0;
        const end = new Date(activeKhatma.end_date);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    const getPercentage = () => {
        if (!activeKhatma) return 0;
        // Current page out of 604
        const page = activeKhatma.current_page || 1;
        return Math.round((page / 604) * 100);
    };

    const formattedPercentage = getPercentage();

    // Smart Daily Goal Logic
    const getSmartStats = () => {
        if (!activeKhatma?.end_date || !activeKhatma?.start_date) return { dailyGoal: Math.ceil(604 / 30), adjustment: 0 };

        const end = new Date(activeKhatma.end_date).getTime();
        const start = new Date(activeKhatma.start_date).getTime();
        const now = new Date().getTime();

        const totalDays = Math.max(1, (end - start) / (1000 * 3600 * 24));
        const daysLeft = Math.max(1, Math.ceil((end - now) / (1000 * 3600 * 24)));

        const currentPage = activeKhatma.current_page || 0;
        const remainingPages = 604 - currentPage;

        const dailyGoal = Math.ceil(remainingPages / daysLeft);
        const originalGoal = Math.ceil(604 / totalDays);

        const adjustment = dailyGoal > originalGoal ? dailyGoal - originalGoal : 0;

        return { dailyGoal: dailyGoal > 0 ? dailyGoal : 0, adjustment };
    };

    const { dailyGoal, adjustment } = getSmartStats();

    if (!activeKhatma) {
        // Empty State - Start New Khatma
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center h-full min-h-[220px]">
                <Calendar className="w-10 h-10 text-emerald-500 mb-3" />
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-lg">ابدأ ختمة جديدة</h3>

                {partner ? (
                    <button
                        onClick={onStartKhatma}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>تخطيط ختمة مشتركة</span>
                    </button>
                ) : (
                    <div className="text-slate-400 text-sm font-bold">اربط شريكك للبدء بختمة مشتركة</div>
                )}
            </div>
        );
    }

    // Active Shared Khatma State
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm relative overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{activeKhatma.title || 'الختمة المشتركة'}</h3>
                        {adjustment > 0 && (
                            <BrainCircuit className="w-4 h-4 text-emerald-500 animate-pulse" />
                        )}
                        <RamadanBadge />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-500/10">
                            مواظب عالدرب
                        </span>
                        <span className="text-slate-400 text-xs font-bold">• باقي {getDaysLeft()} يوم</span>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100/50">
                    <Award className="w-5 h-5" />
                </div>
            </div>

            {/* Partner Info Row */}
            <div
                onClick={onContinue}
                className="flex items-center gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-dashed border-slate-200 dark:border-white/5 cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-colors group"
            >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm shrink-0">
                    {partner?.avatar_url ? (
                        <img src={partner.avatar_url} alt={partner.name} className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-6 h-6 text-indigo-500" />
                    )}
                </div>
                <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">آخر قراءة</div>
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 dark:text-white text-base">وصلت عند الصفحة {activeKhatma.current_page?.toLocaleString('ar-EG') || '١'}</h4>
                        <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <span className="text-[9px] font-black">تابع الآن</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-center relative">
                    <span className="block text-xl font-bold text-emerald-600">{dailyGoal}</span>
                    <span className="text-[10px] text-slate-500 font-bold">اليومي (معدل)</span>
                    {adjustment > 0 && (
                        <div className="absolute -top-2 -right-2 bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-amber-200">
                            +{adjustment}
                        </div>
                    )}
                </div>
                <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-center">
                    <span className="block text-xl font-bold text-slate-800 dark:text-white">{formattedPercentage}%</span>
                    <span className="text-[10px] text-slate-500 font-bold">الإنجاز</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${formattedPercentage}%` }}
                    className="h-full rounded-full bg-emerald-500"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button className="flex-1 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs hover:scale-[1.02] transition-transform">
                    تعديل
                </button>
                <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function RamadanBadge() {
    const { isRamadan } = useRamadan();
    if (!isRamadan) return null;
    return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/50 flex items-center gap-1 shadow-sm">
            <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></span>
            هدية رمضان
        </span>
    );
}
