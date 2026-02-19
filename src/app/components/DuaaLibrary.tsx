import { useState, useEffect, useMemo } from 'react';
import {
    X, Copy, Heart, Search, CloudRain, Sun,
    HandHeart, Book, Stethoscope, Check,
    ChevronRight, ArrowLeft, Bookmark, Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Duaa {
    id: string;
    text: string;
    source: string;
    description: string;
}

interface Category {
    category: string;
    icon: string;
    duaas: Duaa[];
}

interface DuaaLibraryProps {
    onClose: () => void;
}

const iconMap: Record<string, any> = {
    CloudRain,
    Sun,
    Heart,
    Book,
    Stethoscope,
    HandHeart,
    Map
};

export function DuaaLibrary({ onClose }: DuaaLibraryProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/duaas_library.json')
            .then(res => res.json())
            .then(data => {
                setCategories(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading duaas:', err);
                setLoading(false);
            });

        const savedFavorites = localStorage.getItem('favorite_duaas');
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
    }, []);

    const toggleFavorite = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newFavorites = favorites.includes(id)
            ? favorites.filter(f => f !== id)
            : [...favorites, id];

        setFavorites(newFavorites);
        localStorage.setItem('favorite_duaas', JSON.stringify(newFavorites));

        if (!favorites.includes(id)) {
            toast.success('تمت الإضافة للمفضلة');
        }
    };

    const copyToClipboard = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast.success('تم نسخ الدعاء بنجاح');
    };

    const filteredCategories = useMemo(() => {
        if (!searchQuery) return categories;
        const query = searchQuery.toLowerCase();
        return categories.map(cat => ({
            ...cat,
            duaas: cat.duaas.filter(d =>
                d.text.toLowerCase().includes(query) ||
                d.description.toLowerCase().includes(query) ||
                cat.category.toLowerCase().includes(query)
            )
        })).filter(cat => cat.duaas.length > 0);
    }, [categories, searchQuery]);

    const favoriteDuaasList = useMemo(() => {
        const allDuaas = categories.flatMap(cat => cat.duaas);
        return allDuaas.filter(d => favorites.includes(d.id));
    }, [categories, favorites]);

    const [view, setView] = useState<'categories' | 'favorites'>('categories');

    return (
        <div className="flex flex-col h-full bg-[#fafaf9] dark:bg-[#0c0c0b]" dir="rtl">
            {/* Header */}
            <div className="relative pt-12 pb-6 px-6 bg-gradient-to-br from-teal-600 to-teal-800 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />

                <div className="relative z-10 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Book className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">مكتبة الأدعية</h2>
                            <p className="text-[12px] text-white/50 font-bold uppercase tracking-widest">أدعية مأثورة من الكتاب والسنة</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative z-10">
                    <div className="relative group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            placeholder="ابحث عن دعاء أو حالة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl py-4 pr-11 pl-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-base font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-2 gap-2 bg-white dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5">
                <button
                    onClick={() => { setView('categories'); setSelectedCategory(null); }}
                    className={`flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all ${view === 'categories' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                    التصنيفات
                </button>
                <button
                    onClick={() => setView('favorites')}
                    className={`flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${view === 'favorites' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                    <Bookmark className="w-3.5 h-3.5" />
                    المفضلة
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 gap-3"
                        >
                            <div className="w-10 h-10 border-4 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">جاري تحميل الأدعية...</span>
                        </motion.div>
                    ) : view === 'favorites' ? (
                        <motion.div
                            key="favorites"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {favoriteDuaasList.length > 0 ? (
                                favoriteDuaasList.map((duaa) => (
                                    <DuaaCard
                                        key={duaa.id}
                                        duaa={duaa}
                                        isFavorite={true}
                                        onFavorite={(e) => toggleFavorite(duaa.id, e)}
                                        onCopy={(e) => copyToClipboard(duaa.text, e)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-20 opacity-50">
                                    <Bookmark className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-500 font-bold">لم تقم بإضافة أدعية للمفضلة بعد</p>
                                </div>
                            )}
                        </motion.div>
                    ) : selectedCategory ? (
                        <motion.div
                            key="duaas"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="flex items-center gap-2 text-teal-600 font-black text-xs mb-6 hover:gap-3 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                العودة للتصنيفات
                            </button>

                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{selectedCategory.category}</h3>
                                <div className="h-1 w-12 bg-teal-600 rounded-full" />
                            </div>

                            {selectedCategory.duaas.map((duaa) => (
                                <DuaaCard
                                    key={duaa.id}
                                    duaa={duaa}
                                    isFavorite={favorites.includes(duaa.id)}
                                    onFavorite={(e) => toggleFavorite(duaa.id, e)}
                                    onCopy={(e) => copyToClipboard(duaa.text, e)}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="categories"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                        >
                            {filteredCategories.map((cat, idx) => {
                                const Icon = iconMap[cat.icon] || Book;
                                return (
                                    <motion.div
                                        key={cat.category}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => setSelectedCategory(cat)}
                                        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Icon className="w-6 h-6 text-teal-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-slate-800 dark:text-white">{cat.category}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{cat.duaas.length} دعاء</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-[-4px] transition-transform" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function DuaaCard({ duaa, isFavorite, onFavorite, onCopy }: {
    duaa: Duaa;
    isFavorite: boolean;
    onFavorite: (e: React.MouseEvent) => void;
    onCopy: (e: React.MouseEvent) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-white/[0.03] p-8 rounded-[3rem] border border-slate-100 dark:border-white/[0.05] shadow-sm space-y-6"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-teal-500/50 uppercase tracking-widest bg-teal-500/5 px-3 py-1 rounded-lg">
                    {duaa.source}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onCopy}
                        className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/20 transition-all"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onFavorite}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isFavorite ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-500' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                    >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            <p className="text-2xl sm:text-3xl font-amiri leading-relaxed text-slate-800 dark:text-white text-center px-4">
                {duaa.text}
            </p>

            {duaa.description && (
                <div className="pt-6 border-t border-slate-50 dark:border-white/5">
                    <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500 text-center leading-relaxed italic">
                        {duaa.description}
                    </p>
                </div>
            )}
        </motion.div>
    );
}
