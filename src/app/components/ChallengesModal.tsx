import { useState, useEffect } from 'react';
import { Trophy, Target, Users, BookOpen, Quote, ChevronRight, CheckCircle2, Flame, Calendar, Plus, HandHeart, X, ArrowLeft, Send, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { UserChallengeData } from './ChallengesCard';

interface Action {
    id: string;
    text: string;
    completed?: boolean;
}

interface ChallengeTemplate {
    id: string;
    title: string;
    description: string;
    category: 'quran' | 'charity';
    icon: any;
    color: string;
    actions?: Action[];
    fields: { id: string; label: string; placeholder: string; type: string }[];
}

const CHALLEGES_LIST: ChallengeTemplate[] = [
    {
        id: 'quran-template',
        title: 'تحدي حفظ القرآن',
        description: 'حدد السورة والصفحات وتنافس مع شريكك في الحفظ والتسميع.',
        category: 'quran',
        icon: BookOpen,
        color: 'from-emerald-400 to-teal-600',
        actions: [
            { id: 'q1', text: 'قراءة التفسير الميسر' },
            { id: 'q2', text: 'الحفظ والترداد' },
            { id: 'q3', text: 'جلسة التسميع المشتركة' }
        ],
        fields: [
            { id: 'surah', label: 'اسم السورة', placeholder: 'مثلاً: سورة النبأ', type: 'text' },
            { id: 'from_ayah', label: 'من آية', placeholder: '1', type: 'number' },
            { id: 'to_ayah', label: 'إلى آية', placeholder: '10', type: 'number' }
        ]
    },
    {
        id: 'charity-template',
        title: 'تحدي الصدقة اليومية',
        description: 'تصدق بمبلغ بسيط يومياً وشارك شريكك الأجر والنية.',
        category: 'charity',
        icon: HandHeart,
        color: 'from-amber-400 to-orange-600',
        fields: [
            { id: 'amount', label: 'المبلغ المقترح يومياً', placeholder: 'مثلاً: 10 ريال', type: 'text' },
            { id: 'days_count', label: 'عدد الأيام', placeholder: '7', type: 'number' },
            { id: 'intent', label: 'نية الصدقة', placeholder: 'مثلاً: نية الشفاء', type: 'text' }
        ]
    }
];

interface ChallengesModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    partnerId?: string;
    partnerName?: string;
    activeChallenges: UserChallengeData[];
    onAddChallenge: (challenge: UserChallengeData) => void;
    onUpdateChallenge: (challengeId: string, progress: number) => void;
    onCompleteChallenge: (challengeId: string) => void;
    onCancelChallenge: (challengeId: string) => void;
    onOpenTasmeeRoom?: (details: any) => void;
}

export function ChallengesModal({
    isOpen,
    onClose,
    partnerName = 'الشريك',
    activeChallenges,
    onAddChallenge,
    onUpdateChallenge,
    onCompleteChallenge,
    onCancelChallenge,
    onOpenTasmeeRoom
}: ChallengesModalProps) {
    const [activeTab, setActiveTab] = useState<'available' | 'active'>('available');
    const [selectedToJoin, setSelectedToJoin] = useState<ChallengeTemplate | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [selectedChallengeDetail, setSelectedChallengeDetail] = useState<string | null>(null);
    const [updateValue, setUpdateValue] = useState('');
    const [surahs, setSurahs] = useState<any[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<any>(null);

    // Fetch Surahs
    useEffect(() => {
        if (isOpen) {
            fetch('https://api.alquran.cloud/v1/surah')
                .then(res => res.json())
                .then(data => setSurahs(data.data))
                .catch(err => console.error('Error fetching surahs:', err));
        }
    }, [isOpen]);

    // Switch to active tab if there are active challenges and modal opens
    useEffect(() => {
        if (isOpen && activeChallenges.length > 0 && activeTab === 'available' && !selectedToJoin) {
            setActiveTab('active');
        }
    }, [isOpen]);

    const handleJoin = () => {
        if (!selectedToJoin) return;

        // Create actual challenge data from form
        const newChallenge: UserChallengeData = {
            id: Math.random().toString(36).substr(2, 9),
            type: selectedToJoin.category,
            title: selectedToJoin.title,
            details: {
                ...formValues,
                surah: selectedSurah?.name || formValues.surah
            },
            progress: 0,
            partnerProgress: 0, // In reality, fetch from DB
            startDate: new Date().toISOString(),
        };

        onAddChallenge(newChallenge);
        setSelectedToJoin(null);
        setFormValues({});
        setSelectedSurah(null);
        setActiveTab('active');

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#6366f1', '#f59e0b']
        });
    };

    const currentActiveChallenge = activeChallenges.find(c => c.id === selectedChallengeDetail);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="relative w-full max-w-lg bg-[#fcf8ff] dark:bg-slate-900/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white dark:border-white/10"
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20 flex items-center justify-center">
                                    <Trophy className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm sm:text-lg font-black text-slate-800 dark:text-white">مركز التحديات المشتركة</h2>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">خطوة بخطوة نحو الجنة</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Sub-Navigation */}
                        <div className="flex px-6 pt-5 gap-6 border-b border-slate-100 dark:border-slate-800">
                            {[
                                { id: 'active', label: 'تحدياتنا الجارية' },
                                { id: 'available', label: 'تحدي جديد' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id as any); setSelectedToJoin(null); setSelectedChallengeDetail(null); }}
                                    className={`pb-3 text-xs font-black transition-all relative ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar min-h-[420px]">
                            <AnimatePresence mode="wait">
                                {/* 1. Detail View for Active Challenge */}
                                {selectedChallengeDetail && currentActiveChallenge ? (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        <button onClick={() => setSelectedChallengeDetail(null)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors">
                                            <ArrowLeft className="w-3.5 h-3.5 rotate-180" /> عودة لقائمة التحديات
                                        </button>

                                        <div className="p-6 bg-[#fcf8ff] dark:bg-white/5 rounded-[2.5rem] border border-slate-200/50 dark:border-white/5">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentActiveChallenge.type === 'quran' ? 'from-emerald-400 to-teal-600' : 'from-amber-400 to-orange-600'} flex items-center justify-center shadow-lg`}>
                                                    {currentActiveChallenge.type === 'quran' ? <BookOpen className="w-6 h-6 text-white" /> : <HandHeart className="w-6 h-6 text-white" />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{currentActiveChallenge.title}</h3>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                        {currentActiveChallenge.type === 'quran' ? `${currentActiveChallenge.details.surah.startsWith('سُورَةُ') ? '' : 'سورة '}${currentActiveChallenge.details.surah} • الآيات (${currentActiveChallenge.details.from_ayah || 1} - ${currentActiveChallenge.details.to_ayah || 1})` : `صدقة بقيمة ${currentActiveChallenge.details.amount}`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4 mb-8">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[11px] font-bold px-1 text-slate-500">
                                                        <span>تقدمك أنت</span>
                                                        <span>{currentActiveChallenge.progress}%</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${currentActiveChallenge.progress}%` }} className="h-full bg-emerald-500" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[11px] font-bold px-1 text-slate-500">
                                                        <span>تقدم {partnerName}</span>
                                                        <span>{currentActiveChallenge.partnerProgress}%</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${currentActiveChallenge.partnerProgress}%` }} className="h-full bg-indigo-500" />
                                                    </div>
                                                </div>
                                            </div>

                                            {currentActiveChallenge.type === 'quran' && onOpenTasmeeRoom && (
                                                <button
                                                    onClick={() => onOpenTasmeeRoom(currentActiveChallenge.details)}
                                                    className="w-full mb-4 py-4 bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-2xl text-[12px] font-black flex items-center justify-center gap-3 hover:bg-indigo-600/20 transition-all group"
                                                >
                                                    <Mic className="w-4 h-4" /> لدخول غرفة التسميع المباشرة
                                                </button>
                                            )}

                                            <div className="flex flex-col gap-3">
                                                <div className="relative group">
                                                    <input
                                                        type="number"
                                                        placeholder={currentActiveChallenge.type === 'quran' ? "كم آية أنهيت حتى الآن؟" : "كم تصدقت حتى الآن؟"}
                                                        value={updateValue}
                                                        onChange={(e) => setUpdateValue(e.target.value)}
                                                        className="w-full py-4 px-5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-2xl text-xs font-black text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const val = parseInt(updateValue);
                                                            if (!isNaN(val) && val >= 0) {
                                                                let progress = 0;
                                                                if (currentActiveChallenge.type === 'quran') {
                                                                    const from = parseInt(currentActiveChallenge.details.from_ayah) || 1;
                                                                    const to = parseInt(currentActiveChallenge.details.to_ayah) || 1;
                                                                    const total = Math.max(1, to - from + 1);
                                                                    progress = Math.min(100, Math.round((val / total) * 100));
                                                                } else {
                                                                    // For charity or other, treat as manual percentage or a simplified logic
                                                                    progress = Math.min(100, val);
                                                                }
                                                                onUpdateChallenge(currentActiveChallenge.id, progress);
                                                                setUpdateValue('');
                                                                toast.success('تم تحديث إنجازك بنجاح! 💪', { position: 'top-center' });
                                                            }
                                                        }}
                                                        className="absolute left-2 top-2 bottom-2 px-6 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                                                    >
                                                        تحديث
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => { onCompleteChallenge(currentActiveChallenge.id); setSelectedChallengeDetail(null); confetti(); }}
                                                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[12px] font-black shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" /> إتمام التحدي كاملاً
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('هل أنت متأكد من إلغاء هذا التحدي؟')) {
                                                            onCancelChallenge(currentActiveChallenge.id);
                                                            setSelectedChallengeDetail(null);
                                                            toast.error('تم إلغاء التحدي');
                                                        }
                                                    }}
                                                    className="w-full py-3 text-[10px] font-black text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-widest mt-2"
                                                >
                                                    إلغاء التحدي نهائياً ✕
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>

                                    /* 2. Setup Form for New Challenge Selection */
                                ) : selectedToJoin ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                        <div className="flex items-center justify-between px-2">
                                            <button onClick={() => setSelectedToJoin(null)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors">
                                                <ArrowLeft className="w-3.5 h-3.5 rotate-180" /> تغيير نوع التحدي
                                            </button>
                                            <div className={`px-3 py-1 bg-gradient-to-br ${selectedToJoin.color} text-white rounded-full text-[9px] font-black uppercase shadow-lg`}>
                                                {selectedToJoin.category === 'quran' ? 'تحدي قرآني' : 'تحدي صدقة'}
                                            </div>
                                        </div>

                                        <div className="space-y-6 p-6 bg-[#fcf8ff] dark:bg-slate-950/50 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                                            <div className="text-center space-y-2 mb-2">
                                                <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${selectedToJoin.color} flex items-center justify-center mx-auto shadow-2xl`}>
                                                    <selectedToJoin.icon className="w-9 h-9 text-white" />
                                                </div>
                                                <h3 className="text-lg font-black text-slate-800 dark:text-white">إعداد {selectedToJoin.title}</h3>
                                            </div>

                                            <div className="space-y-4">
                                                {selectedToJoin.fields?.map((field) => (
                                                    <div key={field.id} className="space-y-1.5 px-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            {field.label}
                                                            {field.id === 'from_ayah' && selectedSurah && (
                                                                <span className="text-[9px] text-indigo-500 mr-2">(من 1 إلى {selectedSurah.numberOfAyahs})</span>
                                                            )}
                                                            {field.id === 'to_ayah' && selectedSurah && (
                                                                <span className="text-[9px] text-indigo-500 mr-2">(بأقصى حد {selectedSurah.numberOfAyahs})</span>
                                                            )}
                                                        </label>
                                                        {field.id === 'surah' ? (
                                                            <div className="relative">
                                                                <select
                                                                    value={selectedSurah?.number || ''}
                                                                    onChange={(e) => {
                                                                        const s = surahs.find(x => x.number === parseInt(e.target.value));
                                                                        setSelectedSurah(s);
                                                                        setFormValues({ ...formValues, [field.id]: s?.name || '' });
                                                                    }}
                                                                    className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm appearance-none cursor-pointer"
                                                                >
                                                                    <option value="">اختر السورة</option>
                                                                    {surahs.map(s => (
                                                                        <option key={s.number} value={s.number}>{s.name} ({s.englishName})</option>
                                                                    ))}
                                                                </select>
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                    <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <input
                                                                type={field.type}
                                                                placeholder={field.placeholder}
                                                                value={formValues[field.id] || ''}
                                                                onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                                                                className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                onClick={handleJoin}
                                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm group"
                                            >
                                                إنشاء التحدي وإرساله <Send className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                            </button>
                                        </div>
                                    </motion.div>

                                    /* 3. Available Tab: List of Templates */
                                ) : activeTab === 'available' ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                        <div className="px-2 mb-2">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اختر نوع التحدي</h3>
                                        </div>
                                        {CHALLEGES_LIST.map(challenge => (
                                            <button
                                                key={challenge.id}
                                                onClick={() => setSelectedToJoin(challenge)}
                                                className="w-full p-6 bg-white dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:border-indigo-500/30 hover:shadow-lg transition-all text-right group"
                                            >
                                                <div className="flex gap-4">
                                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${challenge.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                                        <challenge.icon className="w-8 h-8 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-base">{challenge.title}</h4>
                                                            <Plus className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:rotate-90 transition-all" />
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{challenge.description}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </motion.div>

                                    /* 4. Active Tab: List of Live User Challenges */
                                ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                        {activeChallenges.length === 0 ? (
                                            <div className="py-20 text-center space-y-4">
                                                <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] mx-auto flex items-center justify-center">
                                                    <Target className="w-10 h-10 text-slate-300" />
                                                </div>
                                                <p className="font-bold text-sm text-slate-400">لا توجد تحديات نشطة حالياً</p>
                                                <button onClick={() => setActiveTab('available')} className="text-xs font-black text-indigo-600 hover:underline">أنشئ تحدياً جديداً الآن</button>
                                            </div>
                                        ) : (
                                            activeChallenges.map(challenge => (
                                                <button
                                                    key={challenge.id}
                                                    onClick={() => setSelectedChallengeDetail(challenge.id)}
                                                    className="w-full p-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 hover:border-indigo-500/30 rounded-[2.5rem] shadow-sm transition-all text-right group"
                                                >
                                                    <div className="flex items-center gap-4 mb-5">
                                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${challenge.type === 'quran' ? 'from-emerald-400 to-teal-600' : 'from-amber-400 to-orange-600'} flex items-center justify-center shrink-0 shadow-lg`}>
                                                            {challenge.type === 'quran' ? <BookOpen className="w-6 h-6 text-white" /> : <HandHeart className="w-6 h-6 text-white" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h4 className="font-bold text-slate-800 dark:text-white text-base">{challenge.title}</h4>
                                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${challenge.progress}%` }} className="h-full bg-emerald-500" />
                                                                </div>
                                                                <span className="text-[10px] font-black text-emerald-600">{challenge.progress}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-50 dark:border-white/5 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            {challenge.type === 'quran' ? `${challenge.details.surah.startsWith('سُورَةُ') || challenge.details.surah.includes('سورة') ? '' : 'سورة '}${challenge.details.surah} • الآيات (${challenge.details.from_ayah || 1} - ${challenge.details.to_ayah || 1})` : `صدقة بقيمة ${challenge.details.amount}`}
                                                        </span>
                                                        <div className="flex -space-x-2">
                                                            <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                                                            <div className="w-6 h-6 rounded-full border-2 border-white bg-indigo-500" />
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer Quote */}
                        <div className="p-6 bg-[#fcf8ff] dark:bg-indigo-950/20 flex items-center gap-3 border-t border-slate-100 dark:border-white/5">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-white/10">
                                <Quote className="w-4 h-4 text-emerald-600" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                ﴿وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ﴾ - اجعلا المنافسة سبباً في القرب والخير.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
