import { Home, Play, Book, Moon, Heart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavigationProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    hasPartner: boolean;
}

export function BottomNavigation({ activeTab, onTabChange, hasPartner }: BottomNavigationProps) {
    const tabs = [
        {
            id: 'home',
            label: 'الرئيسية',
            icon: Home
        },
        {
            id: 'player',
            label: 'المشغل',
            icon: Play
        },
        {
            id: 'quran',
            label: 'المصحف',
            icon: Book
        },
        {
            id: 'azkar',
            label: 'الأذكار',
            icon: Moon
        },
        {
            id: 'partner',
            label: 'شريكي',
            icon: Heart,
            show: hasPartner
        }
    ].filter(tab => tab.show !== false);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] pb-safe glass-nav">
            <div className="flex items-center justify-around px-2 py-0.5 max-w-md mx-auto h-[56px]">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="relative flex flex-col items-center justify-center w-14 h-full transition-all duration-300 active:scale-95"
                        >
                            <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 translate-y-[-2px]' : 'text-slate-400 dark:text-slate-500 hover:text-emerald-500 hover:translate-y-[-1px]'}`}>
                                <tab.icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </div>
                            <span className={`text-[9px] font-bold mt-0.5 transition-all duration-300 ${isActive ? 'text-emerald-600 dark:text-emerald-400 opacity-100' : 'text-slate-400 dark:text-slate-500 opacity-80'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
