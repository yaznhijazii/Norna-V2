import { motion, AnimatePresence } from 'motion/react';
import {
    X,
    Gift,
    Heart,
    MessageCircle,
    Sparkles,
    Clock,
    Share2,
    Download,
    Instagram,
    ArrowRight,
    Search,
    Quote,
    Filter,
    Layers,
    History,
    MoreHorizontal,
    Flower2,
    Star
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface Interaction {
    id: string;
    from_user_id?: string;
    user_id?: string;
    to_user_id?: string;
    gift_type: string;
    message_text?: string;
    created_at: string;
}

interface AtharnaPageProps {
    interactions: Interaction[];
    currentUserId: string;
    partnerName: string;
    onBack: () => void;
}

export function AtharnaPage({ interactions, currentUserId, partnerName, onBack }: AtharnaPageProps) {
    const [selectedStory, setSelectedStory] = useState<Interaction | null>(null);
    const [filter, setFilter] = useState<'all' | 'received' | 'sent'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const formatFullDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getGiftIcon = (type: string, size: string = "w-5 h-5") => {
        switch (type) {
            case 'heart': return <Heart className={`${size} text-rose-500`} fill="currentColor" strokeWidth={1.5} />;
            case 'rose': return <Flower2 className={`${size} text-emerald-500`} strokeWidth={1.5} />;
            case 'message': return <MessageCircle className={`${size} text-blue-500`} strokeWidth={1.5} />;
            case 'dua': return <Sparkles className={`${size} text-amber-500`} strokeWidth={1.5} />;
            case 'poke': return <History className={`${size} text-violet-500`} strokeWidth={1.5} />;
            default: return <Gift className={`${size} text-slate-400`} strokeWidth={1.5} />;
        }
    };

    const getGiftLabel = (type: string) => {
        switch (type) {
            case 'heart': return 'نبض مودة';
            case 'rose': return 'وردة تقدير';
            case 'message': return 'همس الروح';
            case 'dua': return 'أثير الدعاء';
            case 'poke': return 'طيّ الذكرى';
            default: return 'أثر خالد';
        }
    };

    const getStoryTheme = (type: string) => {
        switch (type) {
            case 'heart': return { grad: 'from-rose-500 to-pink-600', accent: 'bg-rose-500' };
            case 'rose': return { grad: 'from-emerald-500 to-teal-600', accent: 'bg-emerald-500' };
            case 'message': return { grad: 'from-blue-500 to-indigo-600', accent: 'bg-blue-500' };
            case 'dua': return { grad: 'from-amber-400 to-orange-500', accent: 'bg-amber-500' };
            case 'poke': return { grad: 'from-violet-500 to-purple-600', accent: 'bg-violet-500' };
            default: return { grad: 'from-slate-700 to-slate-900', accent: 'bg-slate-800' };
        }
    };

    const filteredInteractions = useMemo(() => {
        return interactions
            .filter(i => {
                const isSent = (i.from_user_id || (i as any).user_id) === currentUserId;
                if (filter === 'sent') return isSent;
                if (filter === 'received') return !isSent;
                return true;
            })
            .filter(i =>
                (i.message_text || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                getGiftLabel(i.gift_type).toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [interactions, filter, searchQuery, currentUserId]);

    const groupedInteractions = useMemo(() => {
        return filteredInteractions.reduce((acc: { [key: string]: Interaction[] }, interaction) => {
            const date = new Date(interaction.created_at);
            const monthYear = date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
            if (!acc[monthYear]) acc[monthYear] = [];
            acc[monthYear].push(interaction);
            return acc;
        }, {});
    }, [filteredInteractions]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-[#fafafa] dark:bg-[#07090d] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
            style={{ direction: 'rtl' }}
        >
            {/* Background Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-rose-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Seamless Header */}
            <header className="relative z-10 px-8 pt-10 pb-6">
                <div className="max-w-4xl mx-auto flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onBack}
                            className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
                        >
                            <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>

                        <div className="text-center">
                            <h1 className="text-2xl font-black tracking-tight mb-1">أثـرنــا</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">The Eternal Gallery</p>
                        </div>

                        <div className="w-12 h-12 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input
                                type="text"
                                placeholder="بحث في المجلدات..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 pr-12 pl-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium outline-none"
                            />
                        </div>
                        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm self-start">
                            {[
                                { id: 'all', label: 'الكل' },
                                { id: 'received', label: 'الوارد' },
                                { id: 'sent', label: 'الصادر' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilter(tab.id as any)}
                                    className={`px-6 py-2 rounded-xl text-[11px] font-black transition-all ${filter === tab.id
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Feed */}
            <main className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
                <div className="max-w-4xl mx-auto pb-40">
                    {Object.entries(groupedInteractions).length > 0 ? (
                        Object.entries(groupedInteractions).map(([month, items], monthIdx) => (
                            <div key={month} className="mb-12">
                                <div className="sticky top-0 z-20 py-4 bg-[#fafafa]/80 dark:bg-[#07090d]/80 backdrop-blur-md mb-6 border-b border-slate-100 dark:border-white/5">
                                    <h2 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em]">{month}</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {items.map((item, idx) => {
                                        const isSent = (item.from_user_id || (item as any).user_id) === currentUserId;
                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 p-6 shadow-sm hover:shadow-xl hover:border-indigo-500/20 transition-all duration-500"
                                            >
                                                <div className="flex flex-col h-full gap-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSent ? 'bg-slate-50 dark:bg-white/5' : 'bg-indigo-50 dark:bg-indigo-500/10'}`}>
                                                            {getGiftIcon(item.gift_type, "w-6 h-6")}
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-600">
                                                                <Clock className="w-3 h-3" />
                                                                {formatFullDate(item.created_at)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 flex-1">
                                                        <h3 className="text-lg font-black tracking-tight group-hover:text-indigo-500 transition-colors">
                                                            {getGiftLabel(item.gift_type)}
                                                        </h3>
                                                        {item.message_text && (
                                                            <div className="relative">
                                                                <Quote className="absolute -right-1 -top-1 w-4 h-4 text-indigo-500/10 transform rotate-180" />
                                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 pl-2 pr-4">
                                                                    {item.message_text}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-50 dark:border-white/5">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${isSent ? 'bg-slate-100 dark:bg-white/10 text-slate-500' : 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600'}`}>
                                                                {isSent ? 'أثرك' : `من ${partnerName}`}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setSelectedStory(item)}
                                                                className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
                                                            >
                                                                <Instagram className="w-4 h-4" />
                                                            </button>
                                                            <button className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 flex items-center justify-center border border-slate-100 dark:border-white/5 hover:text-indigo-500">
                                                                <Share2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-[50vh] flex flex-col items-center justify-center text-center px-10">
                            <Layers className="w-16 h-16 text-slate-100 dark:text-slate-800 mb-6" />
                            <h3 className="text-lg font-black mb-2">سِجِلٌّ خالٍ من الأثر</h3>
                            <p className="text-xs font-bold text-slate-400 leading-relaxed">لم يرسل أحدكما أثراً بعد، ابدآ بتوثيق لحظاتكما لتظهر هنا.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Instagram Story Generator */}
            <AnimatePresence>
                {selectedStory && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedStory(null)}
                            className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: -20 }}
                            exit={{ scale: 0.9, opacity: 0, y: 40 }}
                            className="relative w-full max-w-[340px] aspect-[9/16] bg-[#f9f7f2] dark:bg-[#1a1c1e] rounded-[1.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] border-[10px] border-[#ede9df] dark:border-[#2a2d31]"
                        >
                            {/* Realistic Paper Texture Overlay */}
                            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

                            <div className="absolute inset-0 p-8 flex flex-col text-[#3d3a33] dark:text-[#ede9df]">
                                {/* Refined Header */}
                                <div className="flex items-start justify-between mb-12">
                                    <div className="space-y-1">
                                        <p className="text-[14px] font-black tracking-[0.2em] text-[#2a2823] dark:text-white uppercase">وثيقة مودة</p>
                                        <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest leading-none">أرشيف الأثر الموثق . نورونا</p>
                                    </div>
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full border-2 border-[#3d3a33]/10 dark:border-[#ede9df]/10 flex items-center justify-center">
                                            {getGiftIcon(selectedStory.gift_type, "w-6 h-6 text-[#3d3a33] dark:text-[#ede9df]")}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#3d3a33] dark:bg-[#ede9df] rounded-full flex items-center justify-center shadow-lg border-2 border-[#f9f7f2] dark:border-[#1a1c1e]">
                                            <Star className="w-3 h-3 text-white dark:text-black" />
                                        </div>
                                    </div>
                                </div>

                                {/* Body Content */}
                                <div className="flex-1 flex flex-col space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-4 bg-[#3d3a33]/20 dark:bg-[#ede9df]/20 rounded-full" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">بيان الأثر</span>
                                    </div>

                                    <div className="relative pl-4 pr-6 py-2 border-r-2 border-[#3d3a33]/10 dark:border-[#ede9df]/10">
                                        {selectedStory.message_text ? (
                                            <p className="text-[1.35rem] font-bold leading-relaxed text-[#2a2823] dark:text-[#eee] tracking-tight">
                                                {selectedStory.message_text}
                                            </p>
                                        ) : (
                                            <h2 className="text-3xl font-black text-[#2a2823] dark:text-white">
                                                {getGiftLabel(selectedStory.gift_type)}
                                            </h2>
                                        )}
                                    </div>

                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#3d3a33]/5 dark:bg-[#ede9df]/5 rounded-lg border border-[#3d3a33]/5 dark:border-[#ede9df]/5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                                                {selectedStory.from_user_id === currentUserId ? 'بإمضاء: الطرف الأول' : `بإمضاء: ${partnerName}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Refined Footer */}
                                <div className="mt-auto pt-8 border-t border-[#3d3a33]/5 dark:border-[#ede9df]/5">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="space-y-3">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-30">توقيت التوثيق</p>
                                                <p className="text-sm font-bold">{formatFullDate(selectedStory.created_at)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-30">صفة المستند</p>
                                                <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest border-b border-emerald-700/20 pb-0.5 inline-block">مُخلّـد للأَبَد</p>
                                            </div>
                                        </div>

                                        {/* Wax Seal - Smaller and lifted */}
                                        <motion.div
                                            initial={{ rotate: -20, scale: 0.8 }}
                                            animate={{ rotate: -15, scale: 1 }}
                                            className="w-20 h-20 rounded-full bg-rose-700/[0.03] border border-rose-700/10 flex items-center justify-center relative shadow-inner"
                                        >
                                            <div className="absolute inset-1 border border-dashed border-rose-700/10 rounded-full" />
                                            <Heart className="w-8 h-8 text-rose-700/20" fill="currentColor" strokeWidth={0.5} />
                                        </motion.div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex-1 h-12 rounded-xl bg-[#2a2823] dark:bg-[#ede9df] text-white dark:text-black font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                                            <Download className="w-3.5 h-3.5" />
                                            استخراج السجل
                                        </button>
                                        <button className="w-12 h-12 rounded-xl border border-[#3d3a33]/10 dark:border-[#ede9df]/10 flex items-center justify-center active:scale-95 transition-all">
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
