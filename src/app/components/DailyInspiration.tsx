import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Quote, Heart, ChevronRight, ChevronLeft, Sparkles, RefreshCw } from 'lucide-react';
import { dailyAyahs, dailyHadiths, getDailyItem } from '../utils/dailyData';
import { getUserDuaas, getSharedDuaas } from '../utils/db';

interface DailyInspirationProps {
    userId?: string;
}

export function DailyInspiration({ userId }: DailyInspirationProps) {
    const [activeTab, setActiveTab] = useState<'ayah' | 'hadith' | 'duaa'>('ayah');
    const [content, setContent] = useState<any>(null);
    const [userDuaas, setUserDuaas] = useState<any[]>([]);

    useEffect(() => {
        const loadUserContent = async () => {
            if (activeTab === 'ayah') {
                setContent(getDailyItem(dailyAyahs));
            } else if (activeTab === 'hadith') {
                setContent(getDailyItem(dailyHadiths));
            } else if (activeTab === 'duaa') {
                let duaas = userDuaas;
                if (duaas.length === 0 && userId) {
                    const [myDuaas, sharedDuaas] = await Promise.all([
                        getUserDuaas(userId),
                        getSharedDuaas(userId),
                    ]);
                    duaas = [...myDuaas, ...sharedDuaas];
                    setUserDuaas(duaas);
                }

                if (duaas.length > 0) {
                    setContent(getDailyItem(duaas.map(d => ({
                        content: d.content,
                        reference: d.is_shared ? 'دعاء مشترك ❤️' : 'ورد خاص',
                        theme: d.is_shared ? 'rose' : 'emerald'
                    }))));
                } else {
                    setContent({
                        content: "اللهم إني أسألك علماً نافعاً، ورزقاً طيباً، وعملاً متقبلاً",
                        reference: "دعاء مأثور",
                        theme: "emerald"
                    });
                }
            }
        };

        loadUserContent();
    }, [activeTab, userId]);

    const refreshContent = () => {
        if (activeTab === 'ayah') {
            setContent(dailyAyahs[Math.floor(Math.random() * dailyAyahs.length)]);
        } else if (activeTab === 'hadith') {
            setContent(dailyHadiths[Math.floor(Math.random() * dailyHadiths.length)]);
        } else if (userDuaas.length > 0) {
            const randomDuaa = userDuaas[Math.floor(Math.random() * userDuaas.length)];
            setContent({
                content: randomDuaa.content,
                reference: randomDuaa.is_shared ? 'دعاء مشترك ❤️' : 'ورد خاص',
                theme: randomDuaa.is_shared ? 'rose' : 'emerald'
            });
        }
    };

    const tabs = [
        { id: 'ayah', label: 'آية اليوم', icon: Book, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { id: 'hadith', label: 'حديث اليوم', icon: Quote, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 'duaa', label: 'دعاء اليوم', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    ];

    return (
        <div className="space-y-6 relative group">
            {/* Component Header - Added to match other sections */}
            <div className="flex items-center justify-between px-1" dir="rtl">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                    <div className="flex flex-col">
                        <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">محراب الإلهام</h2>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">آيات، أحاديث، وأدعية مختارة</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-500">منور</span>
                </div>
            </div>

            {/* Multi-layered Premium Glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-indigo-500/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>

            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-none">
                {/* Main Content Card with Mesh Background */}
                <div className="relative bg-white/90 dark:bg-slate-900/95 backdrop-blur-3xl min-h-[240px]">

                    {/* Subtle Texture Layer */}
                    <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none mix-blend-multiply dark:mix-blend-overlay"
                        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/arabesque.png")' }}></div>

                    {/* Internal Mesh Glows - Dynamic based on theme */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                x: [0, 20, 0],
                                y: [0, -20, 0],
                                scale: [1, 1.1, 1],
                                opacity: [0.05, 0.1, 0.05]
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] ${activeTab === 'ayah' ? 'bg-indigo-500' : activeTab === 'hadith' ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                        />
                        <motion.div
                            animate={{
                                x: [0, -15, 0],
                                y: [0, 15, 0],
                                opacity: [0.03, 0.08, 0.03]
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-[80px] bg-emerald-500"
                        />
                    </div>

                    {/* Tabs Header */}
                    <div className="flex items-center justify-between p-2 bg-white/40 dark:bg-black/20 border-b border-slate-100/50 dark:border-white/5 relative z-20">
                        <button
                            onClick={refreshContent}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all active:rotate-180 duration-500 z-30"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex-1 flex justify-center gap-1 md:gap-4 px-10">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all duration-500 relative ${activeTab === tab.id
                                        ? 'text-slate-900 dark:text-white'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTabBg"
                                            className="absolute inset-0 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/10 rounded-2xl z-0"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <tab.icon className={`w-4 h-4 relative z-10 transition-colors duration-500 ${activeTab === tab.id ? tab.color : 'opacity-40'}`} />
                                    <span className="text-[11px] font-black uppercase tracking-wider relative z-10">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8 pb-14 flex flex-col justify-center relative min-h-[180px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab + (content?.content || '')}
                                initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -15, filter: 'blur(10px)' }}
                                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                className="relative z-10 text-right"
                                dir="rtl"
                            >
                                <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/30 dark:bg-white/5 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200/50 dark:border-white/5 backdrop-blur-md">
                                    {activeTab === 'ayah' ? 'من آيات الذكر الحكيم' : activeTab === 'hadith' ? 'من أحاديث المصطفى' : 'من جوامع الكلم'}
                                </div>

                                <p className={`text-xl sm:text-2xl text-slate-800 dark:text-slate-100 leading-relaxed mb-8 pr-6 border-r-[3px] border-emerald-500/30 ${activeTab === 'ayah' ? 'font-amiri font-bold' : 'font-medium'}`}>
                                    {content?.content}
                                </p>

                                <div className="flex items-center justify-start gap-4 mr-6">
                                    <div className="h-[2px] w-8 bg-gradient-to-l from-emerald-500/50 to-transparent rounded-full" />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${content?.theme ? `text-${content.theme}-500/80` : 'text-emerald-500/80'}`}>
                                        {content?.reference}
                                    </span>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Pagination Progress Dots */}
                        <div className="absolute bottom-8 left-10 flex gap-2">
                            {tabs.map((tab) => (
                                <div key={tab.id} className="relative h-1.5 flex items-center">
                                    {activeTab === tab.id ? (
                                        <motion.div
                                            layoutId="activeDot"
                                            className="w-6 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                        />
                                    ) : (
                                        <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
