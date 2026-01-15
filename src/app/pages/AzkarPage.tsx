import { AthkarReader } from '../components/AthkarReader';
import { Plus, BookOpen, Moon, Bed, BookmarkCheck, Heart, HandHeart } from 'lucide-react';
import { useTimeOfDay } from '../hooks/useTimeOfDay';

interface AzkarPageProps {
    initialType?: 'morning' | 'evening' | 'israa_miraj' | null;
}

export function AzkarPage({ initialType }: AzkarPageProps) {
    const timeOfDay = useTimeOfDay();
    const isNight = timeOfDay === 'night' || timeOfDay === 'evening';

    return (
        <div className="pb-24 pt-4 px-4 space-y-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between px-2 mb-2" dir="rtl">
                <div className="text-right">
                    <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-1">الأذكار</h2>
                    <div className={`flex items-center justify-start gap-2 font-bold text-[11px] text-[#62748e]`}>
                        <span className="text-base">{isNight ? '🌙' : '☀️'}</span>
                        <span>{isNight ? 'أذكار المساء والنوم' : 'أذكار الصباح واليوم'}</span>
                    </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl flex items-center justify-center">
                    <HandHeart className="w-7 h-7 text-[#62748e]" />
                </div>
            </div>

            <AthkarReader initialType={initialType} />

            {/* Future Sections - Improved UI */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">أقسام إضافية</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group relative bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 p-5 rounded-[2rem] hover:bg-white dark:hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                <Bed className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-800 dark:text-white">أذكار النوم</p>
                                <p className="text-[10px] font-bold text-indigo-400 mt-0.5">قريباً</p>
                            </div>
                        </div>
                    </div>

                    <div className="group relative bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 p-5 rounded-[2rem] hover:bg-white dark:hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <BookmarkCheck className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-800 dark:text-white">أذكار الصلاة</p>
                                <p className="text-[10px] font-bold text-emerald-400 mt-0.5">قريباً</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
