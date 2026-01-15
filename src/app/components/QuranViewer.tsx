import { useState, useEffect, useRef } from 'react';
import { BookOpen, X, Loader2, Search, ChevronRight, ChevronLeft, Play, Pause, Bookmark, Award, BookHeart, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { updateQuranProgress, saveQuranBookmark, getQuranBookmark, getActiveKhatma, createNewKhatma, updateKhatmaProgress } from '../utils/db';

interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

interface Ayah {
    number: number;
    text: string;
    numberInSurah: number;
}

interface SurahData {
    number: number;
    name: string;
    englishName: string;
    ayahs: Ayah[];
}

interface UserBookmark {
    surah_number: number;
    surah_name: string;
    ayah_number: number;
}

interface Khatma {
    id: string;
    current_surah: number;
    current_ayah: number;
    status: string;
    start_date: string;
    end_date: string;
}

export function QuranViewer() {
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
    const [surahData, setSurahData] = useState<SurahData | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingAyahs, setLoadingAyahs] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [currentAyahPlaying, setCurrentAyahPlaying] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Progress & Khatma State
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [userBookmark, setUserBookmark] = useState<UserBookmark | null>(null);
    const [activeKhatma, setActiveKhatma] = useState<Khatma | null>(null);

    // Khatma Creation UI
    const [showKhatmaModal, setShowKhatmaModal] = useState(false);
    const [khatmaDays, setKhatmaDays] = useState(30);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const AYAHS_PER_PAGE = 41;
    const TOTAL_PAGES_QURAN = 604;
    // Standard Madani Mushaf Page Starts for 114 Surahs
    const SURAH_START_PAGES = [1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 586, 587, 587, 589, 590, 591, 591, 592, 593, 594, 595, 595, 596, 596, 597, 597, 598, 598, 599, 599, 600, 600, 601, 601, 601, 602, 602, 602, 603, 603, 603, 604, 604, 604];

    useEffect(() => {
        const user = localStorage.getItem('nooruna_user');
        if (user) {
            const userData = JSON.parse(user);
            setCurrentUserId(userData.id);
            loadUserProgress(userData.id);
        }
        fetchSurahs();
    }, []);

    const loadUserProgress = async (userId: string) => {
        const bookmark = await getQuranBookmark(userId);
        if (bookmark) setUserBookmark(bookmark);

        const khatma = await getActiveKhatma(userId);
        setActiveKhatma(khatma);
    };

    const createKhatma = async () => {
        if (!currentUserId) return;
        const newKhatma = await createNewKhatma(currentUserId, khatmaDays);
        setActiveKhatma(newKhatma);
        setShowKhatmaModal(false);
        toast.success(`تم إنشاء خطة ختمة جديدة لمدة ${khatmaDays} يوم`, { className: 'font-bold font-amiri', position: 'top-center' });
    };

    const fetchSurahs = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://api.alquran.cloud/v1/surah');
            const data = await response.json();
            if (data.data) setSurahs(data.data);
        } catch (e) { console.error('Error fetching surahs:', e); }
        finally { setLoading(false); }
    };

    const fetchSurahContent = async (surahNumber: number) => {
        setLoadingAyahs(true);
        try {
            const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`);
            const data = await response.json();
            if (data.data) {
                let ayahs = data.data.ayahs;
                if (ayahs.length > 0 && surahNumber !== 1 && surahNumber !== 9) {
                    const bismillahRegex = /^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s?/;
                    ayahs[0].text = ayahs[0].text.replace(bismillahRegex, '').trim();
                }
                setSurahData(data.data);
            }
        } catch (e) { console.error('Error fetching ayahs:', e); }
        finally { setLoadingAyahs(false); }
    };

    const handleSurahSelect = (surah: Surah, startPage: number = 1) => {
        setSelectedSurah(surah);
        setCurrentPage(startPage);
        fetchSurahContent(surah.number);
    };

    const handleContinueReading = () => {
        if (userBookmark && surahs.length > 0) {
            const targetSurah = surahs.find(s => s.number === userBookmark.surah_number);
            if (targetSurah) {
                const targetPage = Math.ceil(userBookmark.ayah_number / AYAHS_PER_PAGE);
                handleSurahSelect(targetSurah, targetPage);
            }
        }
    };

    const getTotalPages = () => {
        if (!selectedSurah) return 1;
        return Math.ceil(selectedSurah.numberOfAyahs / AYAHS_PER_PAGE);
    };

    const getCurrentPageAyahs = (): Ayah[] => {
        if (!surahData) return [];
        const start = (currentPage - 1) * AYAHS_PER_PAGE;
        const end = start + AYAHS_PER_PAGE;
        return surahData.ayahs.slice(start, end);
    };

    const togglePlayAyah = (ayah: Ayah) => {
        if (currentAyahPlaying === ayah.number) {
            if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
            else { audioRef.current?.play(); setIsPlaying(true); }
        } else {
            setCurrentAyahPlaying(ayah.number);
            setIsPlaying(true);
            if (audioRef.current) {
                audioRef.current.src = `https://cdn.islamic.network/quran/audio/ar.alafasy/${ayah.number}.mp3`;
                audioRef.current.play();
            }
        }
    };

    const handleBookmark = async (ayah: Ayah) => {
        if (!currentUserId || !selectedSurah) return;
        await saveQuranBookmark(currentUserId, selectedSurah.number, selectedSurah.name, ayah.numberInSurah);
        setUserBookmark({ surah_number: selectedSurah.number, surah_name: selectedSurah.name, ayah_number: ayah.numberInSurah });
        if (activeKhatma) {
            await updateKhatmaProgress(activeKhatma.id, selectedSurah.number, ayah.numberInSurah);
            setActiveKhatma({ ...activeKhatma, current_surah: selectedSurah.number, current_ayah: ayah.numberInSurah });
        }
        toast.success('تم حفظ مكان القراءة وتحديث الختمة', { position: 'top-center', className: 'font-amiri font-bold', icon: '💾' });
    };

    // Khatma Calculations
    const getKhatmaStatus = () => {
        if (!activeKhatma) return null;

        // 1. Calculate Actual Page based on Surah
        const currentGlobalPage = SURAH_START_PAGES[activeKhatma.current_surah - 1] || 1;

        // 2. Calculate Expected Page based on Time
        const start = new Date(activeKhatma.start_date).getTime();
        const end = new Date(activeKhatma.end_date).getTime();
        const now = new Date().getTime();

        // Safety check for invalid dates
        if (isNaN(start) || isNaN(end)) return null;

        const totalDuration = end - start;
        const elapsedDuration = now - start;

        // If plan hasn't started or just started (less than 1 min), assume expected page 0
        if (elapsedDuration < 0) return { isAhead: true, pagesDiff: 0, statusText: 'بداية جديدة', colorClass: 'text-slate-500 bg-slate-100' };

        // Total pages to read is 604
        // Rate: Pages / Millisecond
        const pagesPerMs = 604 / (totalDuration || 1);
        const expectedPage = Math.floor(elapsedDuration * pagesPerMs);

        // Calculate Diff
        const diff = currentGlobalPage - expectedPage;
        const absDiff = Math.abs(diff);

        // Threshold: +/- 2 pages is considered "On Track"
        if (absDiff <= 2) {
            return {
                isAhead: true,
                pagesDiff: 0,
                statusText: 'مواظب عالدرب',
                colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10'
            };
        }

        return {
            isAhead: diff > 0,
            pagesDiff: absDiff,
            statusText: diff > 0 ? 'متقدم' : 'متأخر',
            colorClass: diff > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-red-500 bg-red-50 dark:bg-red-500/10'
        };
    };

    const getKhatmaPercentage = () => {
        if (!activeKhatma) return 0;
        const currentGlobalPage = SURAH_START_PAGES[activeKhatma.current_surah - 1] || 1;
        return Math.round((currentGlobalPage / TOTAL_PAGES_QURAN) * 100);
    };

    const getDaysLeft = () => {
        if (!activeKhatma?.end_date) return 0;
        const end = new Date(activeKhatma.end_date);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    const getDailyPagesGoal = () => {
        if (!activeKhatma?.end_date) return Math.ceil(TOTAL_PAGES_QURAN / 30);
        const daysLeft = Math.max(1, getDaysLeft());
        // A simplified estimate: (Surahs Left / Total Surahs) * Total Pages / Days Left
        // Better approximation: (1 - Progress) * 604 / Days
        const remainingPages = 604 * (1 - (getKhatmaPercentage() / 100));
        return Math.ceil(remainingPages / daysLeft);
    };

    const khatmaStatus = getKhatmaStatus();

    const filteredSurahs = surahs.filter(s =>
        s.name.includes(searchQuery) ||
        s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.number.toString() === searchQuery
    );

    return (
        <div className="max-w-3xl mx-auto px-2 min-h-screen font-sans">
            <AnimatePresence mode="wait">
                {!selectedSurah ? (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pt-6 pb-24">

                        {/* Header Redesigned */}
                        <div className="flex items-center justify-between px-2 mb-6" dir="rtl">
                            <div className="text-right">
                                <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-1">القرآن الكريم</h1>
                                <div className="flex items-center gap-2 text-[#62748e] font-bold text-[11px]">
                                    <BookHeart className="w-4 h-4" />
                                    <span>كتاب الله، نورٌ وهداية</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-[18px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                            </div>
                        </div>

                        {/* Dashboard Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                            {/* 1. Continue Reading Card */}
                            {userBookmark ? (
                                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2rem] p-6 text-white shadow-lg shadow-emerald-600/20 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer" onClick={handleContinueReading}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                                <Bookmark className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">تابِع تلاوتك</span>
                                        </div>
                                        <h3 className="text-3xl font-amiri font-bold mb-1">{userBookmark.surah_name}</h3>
                                        <p className="opacity-90 font-medium">وصلت عند الآية رقم {userBookmark.ayah_number}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-100 dark:bg-slate-800 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center opacity-70">
                                    <BookOpen className="w-10 h-10 mb-2 opacity-50" />
                                    <p className="font-bold">ابدأ القراءة ليظهر تقدمك هنا</p>
                                </div>
                            )}

                            {/* 2. Khatma Plan Card */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
                                {activeKhatma ? (
                                    <>
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-white text-lg">ختمة القرآن</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {khatmaStatus && (
                                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${khatmaStatus.colorClass}`}>
                                                            {khatmaStatus.statusText} {khatmaStatus.pagesDiff > 0 ? `(${khatmaStatus.pagesDiff} صفحة)` : ''}
                                                        </span>
                                                    )}
                                                    <span className="text-slate-400 text-xs font-bold">• باقي {getDaysLeft()} يوم</span>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
                                                <Award className="w-5 h-5" />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-center">
                                                <span className="block text-xl font-bold text-emerald-600">{getDailyPagesGoal()}</span>
                                                <span className="text-[10px] text-slate-500 font-bold">صفحة يومياً</span>
                                            </div>
                                            <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-center">
                                                <span className="block text-xl font-bold text-slate-800 dark:text-white">{getKhatmaPercentage()}%</span>
                                                <span className="text-[10px] text-slate-500 font-bold">التقدم العام</span>
                                            </div>
                                        </div>

                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${getKhatmaPercentage()}%` }}
                                                className={`h-full rounded-full ${khatmaStatus?.isAhead ? 'bg-emerald-500' : 'bg-red-500'}`}
                                            />
                                        </div>

                                        <button onClick={() => setShowKhatmaModal(true)} className="mt-4 w-full py-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors">تعديل الخطة</button>
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center">
                                        <Calendar className="w-10 h-10 text-emerald-500 mb-2" />
                                        <h3 className="font-bold text-slate-800 dark:text-white mb-2">ابدأ ختمة جديدة</h3>
                                        <button
                                            onClick={() => setShowKhatmaModal(true)}
                                            className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-all"
                                        >
                                            تخطيط ختمة
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Khatma Modal */}
                        <AnimatePresence>
                            {showKhatmaModal && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                        className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-white/10"
                                    >
                                        <h3 className="text-xl font-bold text-center mb-6 text-slate-800 dark:text-white">خطط لختمتك الجديدة</h3>

                                        <div className="space-y-6 mb-8">
                                            <div className="text-center">
                                                <span className="text-4xl font-black text-emerald-600">{khatmaDays}</span>
                                                <span className="text-sm font-bold text-slate-400 block mt-1">يوم لإكمال القرآن</span>
                                            </div>

                                            <input
                                                type="range" min="7" max="60" step="1"
                                                value={khatmaDays}
                                                onChange={(e) => setKhatmaDays(parseInt(e.target.value))}
                                                className="w-full accent-emerald-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                                            />

                                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl flex items-center justify-between">
                                                <div className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">المطلوب يومياً</div>
                                                <div className="font-black text-emerald-800 dark:text-emerald-300">~{Math.ceil(604 / khatmaDays)} صفحة</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button onClick={() => setShowKhatmaModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">إلغاء</button>
                                            <button onClick={createKhatma} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20">اعتمد الخطة</button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Search */}
                        <div className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-950 px-2 py-2">
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <Search className="w-5 h-5 text-emerald-600" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="ابحث عن سورة..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pr-12 pl-4 py-4 bg-white dark:bg-slate-900 border-0 rounded-2xl text-lg focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-white font-bold shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-1">
                                {filteredSurahs.map((surah) => (
                                    <button
                                        key={surah.number}
                                        onClick={() => handleSurahSelect(surah)}
                                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all text-right group border border-transparent hover:border-emerald-500/10"
                                    >
                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/10 flex items-center justify-center font-amiri text-lg text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                            {surah.number}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-amiri text-xl font-bold text-slate-800 dark:text-white mb-0.5">{surah.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{surah.englishName}</span>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                <span className="text-[10px] text-emerald-600 font-bold">{surah.numberOfAyahs} آية</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="reader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-[#fdfbf7] dark:bg-slate-950 z-[200] flex flex-col h-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-[#fdfbf7] dark:bg-slate-950 shrink-0 px-4 py-3 flex items-center justify-between border-b border-[#eee8d5] dark:border-white/5 relative z-10">
                            <button
                                onClick={() => setSelectedSurah(null)}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-500" />
                            </button>

                            <div className="flex flex-col items-center">
                                <span className="font-amiri text-xl font-bold text-slate-900 dark:text-white leading-none mb-1">{selectedSurah.name}</span>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600/80 uppercase tracking-widest">
                                    <span>{selectedSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                                    <span className="w-1 h-1 bg-emerald-200 rounded-full"></span>
                                    <span>{selectedSurah.numberOfAyahs} آيـة</span>
                                </div>
                            </div>

                            <div className="w-10 h-10 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-emerald-800/20" />
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto relative bg-[#fdfbf7] dark:bg-slate-950 pb-32">
                            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

                            {loadingAyahs ? (
                                <div className="flex h-full items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                                </div>
                            ) : (
                                <div className="min-h-full py-8 px-2 sm:px-6 flex flex-col items-center pb-32">
                                    <div className="w-full max-w-3xl bg-white dark:bg-slate-900 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-none border border-[#eee8d5] dark:border-white/5 rounded-[4px] p-6 sm:p-12 md:p-16 relative">

                                        {/* Decorative Borders */}
                                        <div className="absolute top-4 left-4 right-4 bottom-4 border border-[#f5f0e1] dark:border-white/5 pointer-events-none rounded-[2px]"></div>
                                        <div className="absolute top-3 left-3 right-3 bottom-3 border border-[#f5f0e1] dark:border-white/5 pointer-events-none rounded-[2px] opacity-50"></div>

                                        {(currentPage === 1 && selectedSurah.number !== 1 && selectedSurah.number !== 9) && (
                                            <div className="flex justify-center mb-10 mt-2">
                                                <p className="quran-text text-3xl sm:text-4xl text-slate-900 dark:text-slate-100 select-none">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                                            </div>
                                        )}

                                        <div
                                            className="quran-text text-[22px] sm:text-[28px] md:text-[30px] leading-[2.1] sm:leading-[2.2] text-justify dir-rtl text-slate-900 dark:text-slate-100 relative z-10"
                                            dir="rtl"
                                            style={{ textAlignLast: 'center' }}
                                        >
                                            {getCurrentPageAyahs().map((ayah) => (
                                                <span key={ayah.number} className="inline group">
                                                    <span
                                                        onClick={() => togglePlayAyah(ayah)}
                                                        className={`cursor-pointer decoration-clone box-decoration-clone px-0.5 rounded transition-colors ${currentAyahPlaying === ayah.number
                                                            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                                            : (userBookmark && userBookmark.surah_number === selectedSurah.number && userBookmark.ayah_number === ayah.numberInSurah) ? 'bg-amber-100/50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
                                                                : 'hover:text-emerald-700'
                                                            }`}
                                                    >
                                                        {ayah.text}
                                                    </span>

                                                    {/* Ayah Marker */}
                                                    <span
                                                        onClick={(e) => { e.stopPropagation(); handleBookmark(ayah); }}
                                                        className="inline-flex items-center justify-center mx-1.5 align-middle relative h-[1em] w-[1em] cursor-pointer hover:scale-110 transition-transform"
                                                        title="اضغط لحفظ مكان القراءة وتحديث الختمة"
                                                    >
                                                        <svg viewBox="0 0 36 36" className={`w-[1.1em] h-[1.1em] fill-current opacity-90 absolute ${userBookmark && userBookmark.surah_number === selectedSurah.number && userBookmark.ayah_number === ayah.numberInSurah ? 'text-amber-500' : 'text-[#cbb181]'}`}>
                                                            <path d="M18 2L20.8 5.2L25 5.5L26.5 9.5L30.5 11L30.5 15.2L33.5 18L30.5 20.8L30.5 25L26.5 26.5L25 30.5L20.8 30.8L18 34L15.2 30.8L11 30.5L9.5 26.5L5.5 25L5.5 20.8L2.5 18L5.5 15.2L5.5 11L9.5 9.5L11 5.5L15.2 5.2L18 2Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                                        </svg>
                                                        <span className={`relative z-10 text-[0.45em] font-bold font-sans pt-[0.1em] ${userBookmark && userBookmark.surah_number === selectedSurah.number && userBookmark.ayah_number === ayah.numberInSurah ? 'text-amber-900 dark:text-amber-100' : 'text-[#8b6d3f]'}`}>
                                                            {ayah.numberInSurah}
                                                        </span>
                                                    </span>
                                                </span>
                                            ))}
                                        </div>

                                    </div>

                                    <div className="mt-6 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                                        Page {currentPage} of {getTotalPages()}
                                    </div>

                                    {/* Footer Nav */}
                                    <div className="flex items-center justify-between w-full max-w-3xl mt-10">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white dark:bg-white/5 shadow-sm border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all text-sm"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                            <span>السابق</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (currentPage < getTotalPages()) { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
                                                else setSelectedSurah(null);
                                            }}
                                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-bold hover:bg-emerald-700 transition-all text-sm"
                                        >
                                            <span>{currentPage === getTotalPages() ? 'ختم السورة' : 'الصفحة التالية'}</span>
                                            <ChevronLeft className="w-4 h-4 text-white/80" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
