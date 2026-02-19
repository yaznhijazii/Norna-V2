import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, X, Settings2, Minus, Plus, Palette, Type, Check, Play, Pause, Volume2, Search, BookOpen, Clock, Heart, Share2, MoreVertical, Gauge, Sparkles, Brain, Loader2, Lightbulb, Bookmark, Award, BookHeart, Calendar, Trash2, Users, Eye, EyeOff, Layout, Monitor, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { updateQuranProgress, saveQuranBookmark, getQuranBookmark, getActiveKhatma, createNewKhatma, updateKhatmaProgress, deleteKhatma, getPartner, getActiveSharedKhatma, createSharedKhatma, updateSharedKhatmaProgress } from '../utils/db';
import { SharedKhatmaCard } from './SharedKhatmaCard';

const JUZ_DATA = [
    { id: 1, name: "الم", start_surah: 1, start_ayah: 1 },
    { id: 2, name: "سيقول", start_surah: 2, start_ayah: 142 },
    { id: 3, name: "تلك الرسل", start_surah: 2, start_ayah: 253 },
    { id: 4, name: "لن تنالوا", start_surah: 3, start_ayah: 93 },
    { id: 5, name: "والمحصنات", start_surah: 4, start_ayah: 24 },
    { id: 6, name: "لا يحب الله", start_surah: 4, start_ayah: 148 },
    { id: 7, name: "وإذا سمعوا", start_surah: 5, start_ayah: 82 },
    { id: 8, name: "ولو أننا", start_surah: 6, start_ayah: 111 },
    { id: 9, name: "قال الملأ", start_surah: 7, start_ayah: 88 },
    { id: 10, name: "واعلموا", start_surah: 8, start_ayah: 41 },
    { id: 11, name: "يعتذرون", start_surah: 9, start_ayah: 93 },
    { id: 12, name: "وما من دابة", start_surah: 11, start_ayah: 6 },
    { id: 13, name: "وما أبرئ", start_surah: 12, start_ayah: 53 },
    { id: 14, name: "ربما", start_surah: 15, start_ayah: 1 },
    { id: 15, name: "سبحان الذي", start_surah: 17, start_ayah: 1 },
    { id: 16, name: "قال ألم", start_surah: 18, start_ayah: 75 },
    { id: 17, name: "اقترب للناس", start_surah: 21, start_ayah: 1 },
    { id: 18, name: "قد أفلح", start_surah: 23, start_ayah: 1 },
    { id: 19, name: "وقال الذين", start_surah: 25, start_ayah: 21 },
    { id: 20, name: "أمن خلق", start_surah: 27, start_ayah: 56 },
    { id: 21, name: "اتل ما أوحي", start_surah: 29, start_ayah: 46 },
    { id: 22, name: "ومن يقنت", start_surah: 33, start_ayah: 31 },
    { id: 23, name: "وما لي", start_surah: 36, start_ayah: 28 },
    { id: 24, name: "فمن أظلم", start_surah: 39, start_ayah: 32 },
    { id: 25, name: "إليه يرد", start_surah: 41, start_ayah: 47 },
    { id: 26, name: "حم", start_surah: 46, start_ayah: 1 },
    { id: 27, name: "قال فما خطبكم", start_surah: 51, start_ayah: 31 },
    { id: 28, name: "قد سمع الله", start_surah: 58, start_ayah: 1 },
    { id: 29, name: "تبارك الذي", start_surah: 67, start_ayah: 1 },
    { id: 30, name: "عم يتساءلون", start_surah: 78, start_ayah: 1 },
];

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
    juz: number;
    page: number;
    surah?: {
        number: number;
        name: string;
        englishName: string;
    };
}

interface SurahData {
    number: number;
    name: string;
    englishName: string;
    ayahs: Ayah[];
}

interface UserBookmark {
    user_id?: string;
    surah_number: number;
    surah_name: string;
    ayah_number: number;
    page_number?: number;
    updated_at?: string;
}

interface Khatma {
    id: string;
    current_surah: number;
    current_ayah: number;
    current_page?: number;
    status: string;
    start_date: string;
    end_date: string;
}


export const toArabicDigits = (num: number | string) => {
    return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
};

interface QuranViewerProps {
    jumpToBookmark?: boolean;
    initialSurah?: { number: number; name: string; englishName: string; numberOfAyahs: number } | null;
    onJumped?: () => void;
}

export function QuranViewer({ jumpToBookmark, initialSurah, onJumped }: QuranViewerProps) {
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);


    const [surahData, setSurahData] = useState<SurahData | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingAyahs, setLoadingAyahs] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [currentAyahPlaying, setCurrentAyahPlaying] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [stopAtAyah, setStopAtAyah] = useState<number | null>(null);
    const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
    const [selectedReciter, setSelectedReciter] = useState('ar.alafasy');
    const [isReciterMenuOpen, setIsReciterMenuOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isReadyToSave, setIsReadyToSave] = useState(false);
    // Ref to prevent double-triggering auto-resume
    const hasAutoResumedRef = useRef(false);

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [readerTheme, setReaderTheme] = useState('classic');
    const [fontSize, setFontSize] = useState(22);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);

    // Hifz Mode State
    const [isHifzMode, setIsHifzMode] = useState(false);
    const [hifzModeType, setHifzModeType] = useState<'manual' | 'auto'>('manual');
    const [revealedAyahs, setRevealedAyahs] = useState<Set<number>>(new Set());
    const [hifzReadingSpeed, setHifzReadingSpeed] = useState(5); // Seconds per ayah
    const [isHifzFlowing, setIsHifzFlowing] = useState(false);
    const [hifzSyncWithAudio, setHifzSyncWithAudio] = useState(true);
    const hifzIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-reveal and Flow logic for Hifz Mode
    useEffect(() => {
        if (isHifzMode && hifzModeType === 'auto' && currentAyahPlaying) {
            setRevealedAyahs(prev => {
                const next = new Set(prev);
                next.add(currentAyahPlaying);
                return next;
            });

            // Auto-scroll to current ayah
            const element = document.getElementById(`ayah-${currentAyahPlaying}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentAyahPlaying, isHifzMode, hifzModeType]);

    // Update isHifzFlowing status based on audio
    useEffect(() => {
        if (isHifzMode && hifzModeType === 'auto' && hifzSyncWithAudio) {
            setIsHifzFlowing(isPlaying);
        }
    }, [isPlaying, isHifzMode, hifzModeType, hifzSyncWithAudio]);

    // Timer-based Flow (When no audio is playing or sync is off)
    useEffect(() => {
        if (isHifzMode && hifzModeType === 'auto' && isHifzFlowing && (!hifzSyncWithAudio || !isPlaying)) {
            if (hifzSyncWithAudio && isPlaying) return; // Audio is handling it

            hifzIntervalRef.current = setInterval(() => {
                if (surahData && currentAyahPlaying) {
                    const currentIndex = surahData.ayahs.findIndex(a => a.number === currentAyahPlaying);
                    if (currentIndex < surahData.ayahs.length - 1) {
                        setCurrentAyahPlaying(surahData.ayahs[currentIndex + 1].number);
                    } else {
                        setIsHifzFlowing(false);
                    }
                } else if (surahData && !currentAyahPlaying) {
                    setCurrentAyahPlaying(surahData.ayahs[0].number);
                }
            }, hifzReadingSpeed * 1000);
        } else {
            if (hifzIntervalRef.current) clearInterval(hifzIntervalRef.current);
        }
        return () => { if (hifzIntervalRef.current) clearInterval(hifzIntervalRef.current); };
    }, [isHifzMode, hifzModeType, isHifzFlowing, isPlaying, surahData, currentAyahPlaying, hifzReadingSpeed, hifzSyncWithAudio]);

    const THEMES = [
        { id: 'classic', name: 'الكلاسيكي', bg: 'bg-[#fdfbf7]', darkBg: 'dark:bg-slate-950', border: 'border-[#eee8d5]', text: 'text-slate-900', preview: '#fdfbf7' },
        { id: 'blue', name: 'سماء صافية', bg: 'bg-[#f0f9ff]', darkBg: 'dark:bg-slate-950', border: 'border-sky-100', text: 'text-slate-900', preview: '#f0f9ff' },
        { id: 'sepia', name: 'ورق قديم', bg: 'bg-[#fff8e1]', darkBg: 'dark:bg-amber-950', border: 'border-amber-100', text: 'text-amber-900', preview: '#fff8e1' },
        { id: 'rose', name: 'ورد هادئ', bg: 'bg-[#fff1f2]', darkBg: 'dark:bg-rose-950', border: 'border-rose-100', text: 'text-rose-900', preview: '#fff1f2' },
    ];

    const currentTheme = THEMES.find(t => t.id === readerTheme) || THEMES[0];

    // Player Controls State
    const [showPlayerControls, setShowPlayerControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetControlsTimeout = () => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        setShowPlayerControls(true);
        controlsTimeoutRef.current = setTimeout(() => setShowPlayerControls(false), 3000);
    };

    // Swipe State
    const touchStartRef = useRef<number | null>(null);
    const touchEndRef = useRef<number | null>(null);
    const minSwipeDistance = 50;

    // Tafsir State
    const [showTafsirModal, setShowTafsirModal] = useState(false);
    const [selectedTafsirAyah, setSelectedTafsirAyah] = useState<{ ayah: Ayah, text: string } | null>(null);
    const [loadingTafsir, setLoadingTafsir] = useState(false);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressRef = useRef(false);

    const [activeTab, setActiveTab] = useState<'surah' | 'juz'>('surah');

    const JUZ_PAGE_STARTS = [1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];

    const handleJuzSelect = (juz: typeof JUZ_DATA[0]) => {
        const startSurah = surahs.find(s => s.number === juz.start_surah);
        if (startSurah) setSelectedSurah(startSurah);
        const targetPage = JUZ_PAGE_STARTS[juz.id - 1];
        setCurrentPage(targetPage);
    };


    const RECITERS = [
        { id: 'ar.alafasy', name: 'مشاري العفاسي' },
        { id: 'ar.abdulsamad', name: 'عبدالباسط عبدالصمد' },
        { id: 'ar.abdurrahmaansudais', name: 'عبدالرحمن السديس' },
        { id: 'ar.mahermuaiqly', name: 'ماهر المعيقلي' },
        { id: 'ar.husary', name: 'محمود خليل الحصري' },
        { id: 'ar.hudhaify', name: 'علي الحذيفي' },
        { id: 'ar.shaatree', name: 'أبو بكر الشاطري' },
        { id: 'ar.ahmedajamy', name: 'أحمد بن علي العجمي' },
    ];

    // Progress & Khatma State
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [userBookmark, setUserBookmark] = useState<UserBookmark | null>(null);



    const [activeKhatma, setActiveKhatma] = useState<Khatma | null>(null);
    const [partner, setPartner] = useState<any>(null);
    const [sharedKhatma, setSharedKhatma] = useState<any>(null);

    // Khatma Creation UI
    const [showKhatmaModal, setShowKhatmaModal] = useState(false);
    const [isSharedMode, setIsSharedMode] = useState(false);
    const [khatmaDays, setKhatmaDays] = useState(30);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const TOTAL_PAGES_QURAN = 604;
    // Standard Madani Mushaf Page Starts for 114 Surahs
    const SURAH_START_PAGES = [1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 586, 587, 587, 589, 590, 591, 591, 592, 593, 594, 595, 595, 596, 596, 597, 597, 598, 598, 599, 599, 600, 600, 601, 601, 601, 602, 602, 602, 603, 603, 603, 604, 604, 604];

    // Hide global navigation when reading
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('hideBottomNav', { detail: !!selectedSurah }));
        return () => {
            window.dispatchEvent(new CustomEvent('hideBottomNav', { detail: false }));
        };
    }, [!!selectedSurah]);

    useEffect(() => {
        const user = localStorage.getItem('nooruna_user');
        if (user) {
            const userData = JSON.parse(user);
            const userId = userData.id;
            setCurrentUserId(userId);

            // ─── INSTANT RESTORE ─────────────────────────────────────────
            // Read saved position from localStorage SYNCHRONOUSLY (no waiting
            // for Supabase or surahs API). This is the only reliable way to
            // restore position on every refresh/tab-switch.
            if (!initialSurah && !jumpToBookmark) {
                const localRaw = localStorage.getItem(`quran_bookmark_${userId}`);
                if (localRaw) {
                    try {
                        const bm = JSON.parse(localRaw);
                        if (bm.page_number && bm.surah_number) {
                            console.log('⚡ Instant restore from localStorage → page', bm.page_number, bm.surah_name);
                            setUserBookmark(bm);
                            setCurrentPage(bm.page_number);
                            // Set a minimal selectedSurah so fetchPageContent will trigger
                            // once surahs are loaded (the API response will update it fully).
                            setSelectedSurah({
                                number: bm.surah_number,
                                name: bm.surah_name,
                                englishName: '',
                                englishNameTranslation: '',
                                numberOfAyahs: 0,
                                revelationType: ''
                            });
                            setIsInitialized(true);
                            setTimeout(() => setIsReadyToSave(true), 2000);
                        }
                    } catch (e) { console.error('Bookmark parse error', e); }
                } else {
                    // No local bookmark = brand new user, show surah list
                    setIsInitialized(true);
                }
            }
            // ─────────────────────────────────────────────────────────────

            // Background sync from Supabase (updates localStorage with latest DB data)
            loadUserProgress(userId).finally(() => setIsLoadingData(false));
        }
        fetchSurahs();
    }, []);

    const loadUserProgress = async (userId: string) => {
        console.log('🔄 Loading user progress for:', userId);

        // Always read current localStorage state first — it is the source of truth
        const localRaw = localStorage.getItem(`quran_bookmark_${userId}`);
        const localBookmark = localRaw ? JSON.parse(localRaw) : null;

        let bookmark = await getQuranBookmark(userId);

        if (bookmark) {
            console.log('✅ Found Supabase bookmark:', bookmark.surah_name, 'Page', bookmark.page_number, 'Updated:', bookmark.updated_at);

            // Smart Data Recovery: If page_number is missing in Supabase data
            if (!bookmark.page_number) {
                try {
                    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${bookmark.surah_number}:${bookmark.ayah_number}/quran-uthmani`);
                    const data = await response.json();
                    if (data.data) {
                        bookmark.page_number = data.data.page;
                        await saveQuranBookmark(userId, bookmark.surah_number, bookmark.surah_name, bookmark.ayah_number, bookmark.page_number);
                    }
                } catch (e) {
                    console.error("Failed to recover page number for bookmark", e);
                }
            }

            // ✅ KEY FIX: Only use Supabase data if it is NEWER than localStorage.
            // localStorage is updated instantly on every save/page-change.
            // Supabase may lag behind if the upsert was slow or failed.
            const dbDate = bookmark.updated_at ? new Date(bookmark.updated_at).getTime() : 0;
            const localDate = localBookmark?.updated_at ? new Date(localBookmark.updated_at).getTime() : 0;

            if (dbDate >= localDate) {
                // Supabase is up-to-date — use it and sync to localStorage
                console.log('☁️  Supabase bookmark is newer or equal, applying it.');
                setUserBookmark(bookmark);
                localStorage.setItem(`quran_bookmark_${userId}`, JSON.stringify(bookmark));
                // Also navigate to this page if we haven't yet
                if (bookmark.page_number && bookmark.page_number !== currentPage) {
                    setCurrentPage(bookmark.page_number);
                }
            } else {
                // localStorage is newer — push it back up to Supabase, don't overwrite local
                console.log('💾 localStorage bookmark is newer (page', localBookmark.page_number, '> DB page', bookmark.page_number, '), keeping local and syncing to DB.');
                setUserBookmark(localBookmark);
                // Push the newer local data back to Supabase
                saveQuranBookmark(userId, localBookmark.surah_number, localBookmark.surah_name, localBookmark.ayah_number, localBookmark.page_number);
            }
        } else {
            // No Supabase record — use localStorage if available
            if (localBookmark) {
                console.log('📦 No Supabase record, using localStorage bookmark:', localBookmark.surah_name, 'page', localBookmark.page_number);
                setUserBookmark(localBookmark);
                // Push to Supabase so it's there next time
                saveQuranBookmark(userId, localBookmark.surah_number, localBookmark.surah_name, localBookmark.ayah_number, localBookmark.page_number);
            }
        }

        const khatma = await getActiveKhatma(userId);
        if (khatma) {
            // Do the same for Khatma if missing page
            if (!khatma.current_page) {
                try {
                    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${khatma.current_surah}:${khatma.current_ayah}/quran-uthmani`);
                    const data = await response.json();
                    if (data.data) {
                        khatma.current_page = data.data.page;
                        await updateKhatmaProgress(khatma.id, khatma.current_surah, khatma.current_ayah, khatma.current_page);
                    }
                } catch (e) { }
            }
            console.log('✅ Found active khatma progress: Page', khatma.current_page);
            setActiveKhatma(khatma);

            // Backup Khatma to LocalStorage
            localStorage.setItem(`quran_khatma_${userId}`, JSON.stringify(khatma));
        } else {
            // Check LocalStorage Fallback for Khatma
            const localKhatma = localStorage.getItem(`quran_khatma_${userId}`);
            if (localKhatma) {
                const parsed = JSON.parse(localKhatma);
                console.log('📦 Found localStorage khatma fallback:', parsed.current_page);
                setActiveKhatma(parsed);
            }
        }

        const p = await getPartner(userId);
        if (p) setPartner(p);

        const sk = await getActiveSharedKhatma(userId);
        if (sk) {
            console.log('✅ Found shared khatma');
            setSharedKhatma(sk);
        }
    };

    // Auto-Save progress on page change
    useEffect(() => {
        if (!isLoadingData && isInitialized && isReadyToSave && currentPage && currentUserId && selectedSurah && surahData) {
            const firstAyah = surahData.ayahs[0];
            if (firstAyah && !isNaN(currentPage)) {
                console.log('📝 Auto-saving Quran progress...', { surah: selectedSurah.name, page: currentPage });
                // Update Bookmark (Silently)
                saveQuranBookmark(currentUserId, selectedSurah.number, selectedSurah.name, firstAyah.numberInSurah, currentPage);

                // Backup to LocalStorage
                localStorage.setItem(`quran_bookmark_${currentUserId}`, JSON.stringify({
                    surah_number: selectedSurah.number,
                    surah_name: selectedSurah.name,
                    ayah_number: firstAyah.numberInSurah,
                    page_number: currentPage,
                    updated_at: new Date().toISOString()
                }));

                // Update Khatma (Silently)
                if (activeKhatma) {
                    updateKhatmaProgress(activeKhatma.id, selectedSurah.number, firstAyah.numberInSurah, currentPage);
                }

                // Update local state without toast
                if (activeKhatma) {
                    const updatedKhatma = { ...activeKhatma, current_surah: selectedSurah.number, current_ayah: firstAyah.numberInSurah, current_page: currentPage };
                    setActiveKhatma(updatedKhatma);
                    localStorage.setItem(`quran_khatma_${currentUserId}`, JSON.stringify(updatedKhatma));
                }
                setUserBookmark(prev => ({
                    ...(prev || {}),
                    surah_number: selectedSurah.number,
                    ayah_number: firstAyah.numberInSurah,
                    page_number: currentPage,
                    surah_name: selectedSurah.name
                }) as UserBookmark);
            }
        }
    }, [currentPage, !!surahData, isInitialized]);

    const createKhatma = async () => {
        if (!currentUserId) return;

        if (isSharedMode && partner) {
            try {
                await createSharedKhatma(currentUserId, partner.id, khatmaDays);
                const sk = await getActiveSharedKhatma(currentUserId);
                setSharedKhatma(sk);
                toast.success(`تم بدء الختمة المشتركة لمدة ${khatmaDays} يوم`, { className: 'font-bold font-amiri', position: 'top-center' });
            } catch (error) {
                toast.error('حدث خطأ أثناء إنشاء الختمة المشتركة');
            }
        } else {
            const newKhatma = await createNewKhatma(currentUserId, khatmaDays);
            setActiveKhatma(newKhatma);
            toast.success(`تم إنشاء خطة ختمة شخصية جديدة لمدة ${khatmaDays} يوم`, { className: 'font-bold font-amiri', position: 'top-center' });
        }
        setShowKhatmaModal(false);
    };

    const handleDeleteKhatma = async () => {
        if (!activeKhatma) return;
        if (confirm('هل أنت متأكد من حذف الختمة الحالية؟')) {
            await deleteKhatma(activeKhatma.id);
            setActiveKhatma(null);
            setShowKhatmaModal(false);
            toast.success('تم حذف الختمة بنجاح');
        }
    };


    const handleCreateSharedKhatma = async () => {
        // This function might be deprecated if we use the modal primarily, 
        // but kept for SharedKhatmaCard's internal "Start" if used directly.
        // We can just open the modal from the card instead.
        setIsSharedMode(true);
        setShowKhatmaModal(true);
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

    const fetchPageContent = async (pageNumber: number) => {
        setLoadingAyahs(true);
        try {
            const response = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`);
            const data = await response.json();
            if (data.data) {
                let ayahs = data.data.ayahs;
                // Add page header cleanups for bismillah (standard in Mushaf rendering)
                ayahs = ayahs.map((a: any, idx: number) => {
                    // If it's the first ayah on the page AND start of a Surah (except Fatiha and Tawbah)
                    if (a.numberInSurah === 1 && a.surah.number !== 1 && a.surah.number !== 9) {
                        const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
                        if (a.text.startsWith(bismillah)) {
                            a.text = a.text.replace(bismillah, "").trim();
                        }
                    }
                    return a;
                });

                setSurahData({
                    number: data.data.ayahs[0].surah.number,
                    name: data.data.ayahs[0].surah.name,
                    englishName: data.data.ayahs[0].surah.englishName,
                    ayahs: ayahs
                });

                // Update selectedSurah to match current page content
                const surahData = surahs.find(s => s.number === data.data.ayahs[0].surah.number);
                if (surahData) setSelectedSurah(surahData);
            }
        } catch (e) {
            console.error('Error fetching page content:', e);
            toast.error('حدث خطأ في تحميل الصفحة');
        } finally {
            setLoadingAyahs(false);
        }
    };

    useEffect(() => {
        if (currentPage && surahs.length > 0 && selectedSurah) {
            fetchPageContent(currentPage);
        }
    }, [currentPage, surahs, !!selectedSurah]);

    const handleSurahSelect = (surah: Surah) => {
        setSelectedSurah(surah);

        // Smart Resume: If this is the surah the user was previously reading, resume from their page
        if (userBookmark && userBookmark.surah_number === surah.number && userBookmark.page_number) {
            setCurrentPage(userBookmark.page_number);
        } else {
            const startPage = SURAH_START_PAGES[surah.number - 1];
            setCurrentPage(startPage);
        }

        setIsInitialized(true);
        // We do NOT set isReadyToSave here to avoid immediate overwrite.
        // It will be set when the user actually changes pages or confirms position.
        setTimeout(() => setIsReadyToSave(true), 1000); // Allow safe delay
    };

    const handleContinueReading = async (targetOverride?: typeof userBookmark) => {
        const target = targetOverride || userBookmark || (activeKhatma ? {
            surah_number: activeKhatma.current_surah,
            surah_name: surahs.find(s => s.number === activeKhatma.current_surah)?.name || '',
            ayah_number: activeKhatma.current_ayah,
            page_number: activeKhatma.current_page
        } : null);

        if (!target || surahs.length === 0) return;

        const targetSurah = surahs.find(s => s.number === target.surah_number);
        if (targetSurah) setSelectedSurah(targetSurah);

        // ✅ If page_number is already known, use it directly — no API call needed
        if (target.page_number) {
            console.log('✅ Restoring to page', target.page_number, 'surah', target.surah_name);
            setCurrentPage(target.page_number);
            setIsInitialized(true);
            setTimeout(() => setIsReadyToSave(true), 1500);
            return;
        }

        // Fallback: fetch page number from API (only if page_number missing)
        setLoadingAyahs(true);
        try {
            const response = await fetch(`https://api.alquran.cloud/v1/ayah/${target.surah_number}:${target.ayah_number}/quran-uthmani`);
            const data = await response.json();
            if (data.data) {
                const page = data.data.page;
                setCurrentPage(page);
                // Save the recovered page_number
                if (userBookmark) {
                    const updated = { ...userBookmark, page_number: page };
                    setUserBookmark(updated);
                    localStorage.setItem(`quran_bookmark_${currentUserId}`, JSON.stringify(updated));
                    saveQuranBookmark(currentUserId, target.surah_number, target.surah_name, target.ayah_number, page);
                }
                setIsInitialized(true);
                setTimeout(() => setIsReadyToSave(true), 1500);
            }
        } catch (error) {
            console.error('Error jumping to bookmark:', error);
            const startPage = SURAH_START_PAGES[target.surah_number - 1] || 1;
            setCurrentPage(startPage);
            setIsInitialized(true);
            setTimeout(() => setIsReadyToSave(true), 1000);
        } finally {
            setLoadingAyahs(false);
        }
    };

    useEffect(() => {
        // Handle EXPLICIT jumps from outside (home screen Continue Reading, etc.)
        if (!isLoadingData && jumpToBookmark && userBookmark && surahs.length > 0 && !hasAutoResumedRef.current) {
            hasAutoResumedRef.current = true;
            handleContinueReading();
            onJumped?.();
        }
    }, [isLoadingData, jumpToBookmark, surahs, !!userBookmark]);


    useEffect(() => {
        if (!isLoadingData && initialSurah && surahs.length > 0) {
            const s = surahs.find(surah => surah.number === initialSurah.number);
            if (s) {
                handleSurahSelect(s);
                onJumped?.();
            }
        }
    }, [isLoadingData, initialSurah, surahs]);

    const getTotalPages = () => {
        return TOTAL_PAGES_QURAN;
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(p => p - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            resetControlsTimeout();
        }
    };

    const nextPage = () => {
        if (currentPage < TOTAL_PAGES_QURAN) {
            setCurrentPage(p => p + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            resetControlsTimeout();
        } else {
            setSelectedSurah(null);
        }
    };

    useEffect(() => {
        if (!selectedSurah) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                // In RTL, ArrowLeft usually means "forward" or "next" 
                // but let's stick to logical direction.
                // Usually for Quran, Left is Next page (move towards page 1) in some apps, 
                // but here we use LTR logical progression (1 -> 604).
                // So ArrowRight = p + 1 (forward in reading), ArrowLeft = p - 1 (back).
                prevPage();
            } else if (e.key === 'ArrowRight') {
                nextPage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedSurah, currentPage]);

    const getCurrentPageAyahs = (): Ayah[] => {
        if (!surahData) return [];
        return surahData.ayahs;
    };

    const togglePlayAyah = (ayah: Ayah) => {
        // Reset stop point if manually changing ayah
        setStopAtAyah(null);
        resetControlsTimeout();

        if (currentAyahPlaying === ayah.number) {
            if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
            else { audioRef.current?.play(); setIsPlaying(true); }
        } else {
            setCurrentAyahPlaying(ayah.number);
            setIsPlaying(true);
            if (audioRef.current) {
                audioRef.current.src = `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/${ayah.number}.mp3`;
                audioRef.current.play();
            }
        }
    };

    const fetchTafsir = async (ayah: Ayah) => {
        setLoadingTafsir(true);
        setShowTafsirModal(true);
        try {
            // Using Tafsir Al-Muyassar (ar.muyassar)
            const response = await fetch(`https://api.alquran.cloud/v1/ayah/${ayah.number}/ar.muyassar`);
            const data = await response.json();
            if (data.data) {
                setSelectedTafsirAyah({ ayah: ayah, text: data.data.text });
            }
        } catch (error) {
            console.error('Error fetching tafsir:', error);
            toast.error('تعذر تحميل التفسير');
            setShowTafsirModal(false);
        } finally {
            setLoadingTafsir(false);
        }
    };

    const handleAyahClick = (ayah: Ayah) => {
        resetControlsTimeout(); // Show UI on click

        if (isHifzMode) {
            // In Hifz Mode, first click reveals text, second click plays audio
            const isRevealed = revealedAyahs.has(ayah.number);

            if (!isRevealed) {
                const newRevealed = new Set(revealedAyahs);
                newRevealed.add(ayah.number);
                setRevealedAyahs(newRevealed);
            } else {
                // Ayah is already revealed, so play it
                togglePlayAyah(ayah);
            }
            return;
        }

        if (clickTimeout) {
            clearTimeout(clickTimeout);
            setClickTimeout(null);
            handleAyahDoubleClick(ayah);
        } else {
            const timeout = setTimeout(() => {
                togglePlayAyah(ayah);
                setClickTimeout(null);
            }, 250); // 250ms delay to wait for potential double click
            setClickTimeout(timeout);
        }
    };

    const handleAyahDoubleClick = (ayah: Ayah) => {
        fetchTafsir(ayah);
    };

    const playNextAyah = () => {
        // Check if we reached the stop point
        if (currentAyahPlaying && stopAtAyah === currentAyahPlaying) {
            setIsPlaying(false);
            setStopAtAyah(null);
            toast.success('تم إنهاء القراءة المحددة', { icon: '✅' });
            return;
        }

        if (!surahData || !currentAyahPlaying) {
            setIsPlaying(false);
            return;
        }

        const currentIndex = surahData.ayahs.findIndex(a => a.number === currentAyahPlaying);
        if (currentIndex !== -1) {
            if (currentIndex < surahData.ayahs.length - 1) {
                // Next ayah on the same page
                const nextAyah = surahData.ayahs[currentIndex + 1];
                setCurrentAyahPlaying(nextAyah.number);
                setIsPlaying(true);

                if (audioRef.current) {
                    audioRef.current.src = `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/${nextAyah.number}.mp3`;
                    audioRef.current.play();
                }
            } else if (currentPage < TOTAL_PAGES_QURAN) {
                // Move to next page
                const nextPage = currentPage + 1;
                setCurrentPage(nextPage);
                // We'll need to know what's the next ayah global number
                const nextGlobalAyahNumber = currentAyahPlaying + 1;
                setCurrentAyahPlaying(nextGlobalAyahNumber);
                setIsPlaying(true);
                // The useEffect for currentPage will fetch new ayahs,
                // and the audio will start in the playNextAyah logic if we can detect the change.
                // For simplicity, we can fetch the next audio directly since global numbers are sequential.
                if (audioRef.current) {
                    audioRef.current.src = `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/${nextGlobalAyahNumber}.mp3`;
                    audioRef.current.play();
                }
            } else {
                setIsPlaying(false);
            }
        } else {
            setIsPlaying(false);
        }
    };

    const handleBookmark = async (ayah: Ayah) => {
        if (!currentUserId || !selectedSurah) return;
        setIsInitialized(true); // Manually saving means we are active and initialized
        await saveQuranBookmark(currentUserId, selectedSurah.number, selectedSurah.name, ayah.numberInSurah, currentPage);
        const newBookmark = {
            surah_number: selectedSurah.number,
            surah_name: selectedSurah.name,
            ayah_number: ayah.numberInSurah,
            page_number: currentPage,
            updated_at: new Date().toISOString()
        };
        setUserBookmark(newBookmark);
        localStorage.setItem(`quran_bookmark_${currentUserId}`, JSON.stringify(newBookmark));

        // Update Individual Khatma
        if (activeKhatma) {
            await updateKhatmaProgress(activeKhatma.id, selectedSurah.number, ayah.numberInSurah, currentPage);
            const updatedKhatma = { ...activeKhatma, current_surah: selectedSurah.number, current_ayah: ayah.numberInSurah, current_page: currentPage };
            setActiveKhatma(updatedKhatma);
            localStorage.setItem(`quran_khatma_${currentUserId}`, JSON.stringify(updatedKhatma));
        }

        // Update Shared Khatma
        if (sharedKhatma) {
            await updateSharedKhatmaProgress(sharedKhatma.id, currentUserId, selectedSurah.number, ayah.numberInSurah, currentPage);
            setSharedKhatma({ ...sharedKhatma, current_page: currentPage, current_surah: selectedSurah.number, current_ayah: ayah.numberInSurah });
            toast.success('تم تحديث الختمة المشتركة أيضًا', { position: 'bottom-center' });
        }

        toast.success('تم حفظ مكان القراءة وتحديث الختمة', { position: 'top-center', className: 'font-amiri font-bold', icon: '💾' });
    };

    // Khatma Calculations
    const getKhatmaStatus = () => {
        if (!activeKhatma) return null;

        // 1. Calculate Actual Page based on Surah (Prefer UserBookmark if available for accuracy)
        const currentGlobalPage = userBookmark?.page_number || activeKhatma.current_page || SURAH_START_PAGES[activeKhatma.current_surah - 1] || 1;

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
        // Prefer UserBookmark if available for accuracy
        const currentGlobalPage = userBookmark?.page_number || activeKhatma.current_page || SURAH_START_PAGES[activeKhatma.current_surah - 1] || 1;

        // Ensure percentage is at least 1% if they started reading (page > 1)
        const percentage = Math.round((currentGlobalPage / TOTAL_PAGES_QURAN) * 100);
        return (percentage === 0 && currentGlobalPage > 5) ? 1 : percentage;
    };

    const getDaysLeft = () => {
        if (!activeKhatma?.end_date) return 0;
        const end = new Date(activeKhatma.end_date);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    const getDailyPagesGoal = () => {
        if (!activeKhatma?.end_date || !activeKhatma?.start_date) return 20;

        const start = new Date(activeKhatma.start_date).getTime();
        const end = new Date(activeKhatma.end_date).getTime();
        const now = new Date().getTime();

        const totalDuration = end - start;
        const pagesPerMs = 604 / (totalDuration || 1);

        // Smart Logic: Catch-up Mode
        // Calculate what page we SHOULD be on by the end of today
        const elapsed = now - start;
        const oneDayMs = 24 * 60 * 60 * 1000;
        const endOfTodayElapsed = elapsed + oneDayMs;
        const expectedPageByTonight = Math.min(604, Math.ceil(endOfTodayElapsed * pagesPerMs));

        const currentGlobalPage = activeKhatma.current_page || SURAH_START_PAGES[activeKhatma.current_surah - 1] || 1;

        // If we are behind, the goal will naturally be higher
        const goal = expectedPageByTonight - currentGlobalPage;

        // If we are ahead, still show the original daily quota as a minimum goal to maintain habit
        const originalQuota = Math.ceil(604 / (totalDuration / oneDayMs));

        return Math.max(originalQuota, goal);
    };

    // Calculate Original vs Smart Goal for UI
    const getSmartAdjustment = () => {
        if (!activeKhatma) return null;
        const oneDayMs = 24 * 60 * 60 * 1000;
        const totalDays = (new Date(activeKhatma.end_date).getTime() - new Date(activeKhatma.start_date).getTime()) / oneDayMs;
        const originalGoal = Math.ceil(604 / (totalDays || 30));
        const currentGoal = getDailyPagesGoal();

        if (currentGoal > originalGoal) {
            return { isAdjusted: true, diff: currentGoal - originalGoal, text: 'تعويض فائت' };
        }
        return { isAdjusted: false, diff: 0 };
    };

    const smartAdjustment = getSmartAdjustment();

    const khatmaStatus = getKhatmaStatus();

    const filteredSurahs = surahs.filter(s =>
        s.name.includes(searchQuery) ||
        s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.number.toString() === searchQuery
    );



    useEffect(() => {
        // Cleanup timeout on unmount
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    // Swipe Handlers
    const onTouchStart = (e: React.TouchEvent) => {
        touchEndRef.current = null;
        touchStartRef.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEndRef.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStartRef.current || !touchEndRef.current) return;
        const distance = touchStartRef.current - touchEndRef.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            // Swipe Left -> Next Page (in RTL logic this might feel inverted depending on implementation, 
            // but physically swiping content left reveals right content. 
            // However, usually Next Page is "Forward".
            // Let's implement generic Next/Prev logic)
            // Actually, simply:
            if (currentPage > 1) {
                setCurrentPage(p => p - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        if (isRightSwipe) {
            // Swipe Right -> Previous Page
            if (currentPage < getTotalPages()) {
                setCurrentPage(p => p + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const getJuzNumber = () => {
        if (!surahData || currentPage <= 0) return null;
        const currentAyahs = getCurrentPageAyahs();
        if (currentAyahs.length > 0) {
            return currentAyahs[0].juz;
        }
        return null; // Fallback
    };

    const toArabicNumber = (num: number) => {
        return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
    };

    const currentJuz = getJuzNumber();

    return (
        <div className="max-w-3xl mx-auto px-2 min-h-screen font-sans">
            <AnimatePresence mode="wait">
                {!selectedSurah ? (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pt-10 pb-24">

                        {/* Header Redesigned */}
                        <div className="flex items-center justify-between px-2 mb-4" dir="rtl">
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

                        {/* Dashboard Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                            {/* Left Column (in RTL): Shared Khatma / Continue Reading (if no shared) */}
                            {/* User requested Shared Khatma to be on the Left Card (which is the second visual column in standard LTR, but in RTL it is the Left side). 
                                Wait, 'Right' is the first column in RTL. 'Left' is the second column.
                                User says: "Card on the Left".
                                So Shared Khatma should be the SECOND child in the grid?
                                Let's follow the user's specific request: "Card on the Left".
                            */}

                            {/* 1. Right Column (RTL): Continue Reading */}
                            <div>
                                {userBookmark ? (
                                    <div className="bg-gradient-to-br from-[#064e3b] to-[#065f46] rounded-[2.5rem] p-7 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer h-full min-h-[200px] border border-white/5" onClick={() => handleContinueReading()}>
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-colors"></div>
                                        <div className="relative z-10 flex flex-col h-full">
                                            {/* Top Section */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                                                    <Bookmark className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="bg-emerald-400/20 text-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm border border-emerald-400/20">تابِع تلاوتك</span>
                                                    <span className="text-[10px] text-white/40 font-bold mt-1">آخر قراءة</span>
                                                </div>
                                            </div>

                                            {/* Surah Info - Adjusted to be centered vertically within the card */}
                                            <div className="flex-1 flex flex-col justify-center pb-2">
                                                <h3 className="text-[42px] font-amiri font-bold mb-1 leading-tight">{userBookmark.surah_name}</h3>
                                                <p className="text-emerald-100/70 font-bold text-sm opacity-90">الصفحة {toArabicDigits(userBookmark.page_number || SURAH_START_PAGES[userBookmark.surah_number - 1] || 1)} • الآية {toArabicDigits(userBookmark.ayah_number)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-100 dark:bg-slate-800 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center opacity-70 h-full min-h-[200px]">
                                        <BookOpen className="w-10 h-10 mb-2 opacity-50" />
                                        <p className="font-bold">ابدأ القراءة ليظهر تقدمك هنا</p>
                                    </div>
                                )}
                            </div>

                            {/* 2. Left Column (RTL): Shared Khatma OR Personal Khatma */}
                            <div>
                                {sharedKhatma ? (
                                    <SharedKhatmaCard
                                        currentUserId={currentUserId}
                                        partner={partner}
                                        activeKhatma={sharedKhatma}
                                        onStartKhatma={handleCreateSharedKhatma}
                                        onContinue={handleContinueReading}
                                        onRefresh={() => loadUserProgress(currentUserId)}
                                    />
                                ) : (
                                    // Fallback to Personal Khatma Card if no Shared Khatma
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-7 shadow-sm relative overflow-hidden h-full flex flex-col">
                                        {activeKhatma ? (
                                            <>
                                                <div className="flex items-start justify-between mb-6">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">الختمة الشخصية</h3>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {khatmaStatus && (
                                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${khatmaStatus.colorClass}`}>
                                                                    {khatmaStatus.statusText} {khatmaStatus.pagesDiff > 0 ? `(${toArabicDigits(khatmaStatus.pagesDiff)} صفحة)` : ''}
                                                                </span>
                                                            )}
                                                            <span className="text-slate-400 text-xs font-bold">• باقي {toArabicDigits(getDaysLeft())} يوم</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100/50">
                                                        <Award className="w-6 h-6" />
                                                    </div>
                                                </div>

                                                {/* Last Read Row */}
                                                <div
                                                    onClick={() => handleContinueReading()}
                                                    className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl mb-6 border border-dashed border-slate-200 dark:border-white/5 cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-colors group"
                                                >
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">آخر إنجاز لك</div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-base font-bold text-slate-800 dark:text-white">وصلت ص {toArabicDigits(userBookmark?.page_number || activeKhatma.current_page || 1)}</div>
                                                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-black group-hover:bg-emerald-500 group-hover:text-white transition-colors">متابعة الآن</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mb-6">
                                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-center relative group border border-slate-100 dark:border-white/5">
                                                        <span className="block text-2xl font-black text-emerald-600">{toArabicDigits(getDailyPagesGoal())}</span>
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{smartAdjustment?.isAdjusted ? 'المتبقي لليوم' : 'هدف اليوم'}</span>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-center border border-slate-100 dark:border-white/5">
                                                        <span className="block text-2xl font-black text-slate-800 dark:text-white">{toArabicDigits(getKhatmaPercentage())}%</span>
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">الإنجاز الكلي</span>
                                                    </div>
                                                </div>

                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-auto">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${getKhatmaPercentage()}%` }}
                                                        className={`h-full rounded-full ${khatmaStatus?.isAhead ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                    />
                                                </div>

                                                <div className="flex gap-2 mt-6">
                                                    <button
                                                        onClick={() => handleContinueReading()}
                                                        className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                                                    >
                                                        <Play className="w-4 h-4 fill-current" />
                                                        <span>تابع التلاوة</span>
                                                    </button>
                                                    <button onClick={() => setShowKhatmaModal(true)} className="flex-1 py-4 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">الخطة</button>
                                                </div>
                                            </>
                                        ) : (
                                            // If neither Shared NOR Personal Active -> Show Create Options
                                            partner ? (
                                                <SharedKhatmaCard
                                                    currentUserId={currentUserId}
                                                    partner={partner}
                                                    activeKhatma={null} // Empty state
                                                    onStartKhatma={handleCreateSharedKhatma}
                                                    onContinue={handleContinueReading}
                                                    onRefresh={() => loadUserProgress(currentUserId)}
                                                />
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
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

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

                                        {partner && (
                                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                                                <button
                                                    onClick={() => setIsSharedMode(false)}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isSharedMode ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                                >
                                                    ختمة شخصية
                                                </button>
                                                <button
                                                    onClick={() => setIsSharedMode(true)}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isSharedMode ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                                >
                                                    مع {partner.display_name || 'شريكك'}
                                                </button>
                                            </div>
                                        )}

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

                                        <div className="flex flex-col gap-3">
                                            <div className="flex gap-3">
                                                <button onClick={() => setShowKhatmaModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">إلغاء</button>
                                                <button onClick={createKhatma} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                                                    {isSharedMode ? 'اعتمد الختمة المشتركة' : 'اعتمد الخطة'}
                                                </button>
                                            </div>

                                            {activeKhatma && !isSharedMode && (
                                                <button
                                                    onClick={handleDeleteKhatma}
                                                    className="w-full py-3 mt-2 text-red-500 font-bold text-sm bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                                >
                                                    حذف الختمة الحالية
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>


                        {/* Tab Switcher - Redesigned to be more minimal like the reference */}
                        <div className="flex justify-center mb-8 px-4">
                            <div className="bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl flex items-center w-full max-w-sm shadow-inner">
                                <button
                                    onClick={() => setActiveTab('surah')}
                                    className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'surah' ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
                                >
                                    المصحف
                                </button>
                                <button
                                    onClick={() => setActiveTab('juz')}
                                    className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'juz' ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
                                >
                                    فهرس الأجزاء
                                </button>
                            </div>
                        </div>

                        {/* Search - More minimal and elegant */}
                        <div className="sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md px-2 py-3 mb-4 rounded-b-3xl">
                            <div className="relative max-w-xl mx-auto">
                                <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                                    <Search className="w-4 h-4 text-emerald-600/50" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="ابحث عن السورة، الجزء، أو الآية..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pr-12 pl-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl text-base focus:ring-4 focus:ring-emerald-500/5 text-slate-800 dark:text-white font-bold shadow-sm transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>




                        {activeTab === 'surah' ? (
                            loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1 pb-10">
                                    {filteredSurahs.map((surah) => (
                                        <button
                                            key={surah.number}
                                            onClick={() => handleSurahSelect(surah)}
                                            className="group relative flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all animate-in fade-in slide-in-from-bottom-2"
                                        >
                                            {/* Number Badge - Refined Rub el Hizb Star */}
                                            <div className="relative shrink-0 w-14 h-14 flex items-center justify-center">
                                                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-emerald-600/10 dark:text-emerald-500/20 fill-none stroke-current" strokeWidth="4">
                                                    <rect x="22" y="22" width="56" height="56" rx="4" transform="rotate(0 50 50)" />
                                                    <rect x="22" y="22" width="56" height="56" rx="4" transform="rotate(45 50 50)" />
                                                    <circle cx="50" cy="50" r="12" strokeWidth="3" />
                                                    <circle cx="50" cy="50" r="3.5" fill="currentColor" stroke="none" />
                                                </svg>
                                                <span className="relative z-10 font-bold text-emerald-800 dark:text-emerald-400 text-xs">{toArabicDigits(surah.number)}</span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 text-right">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-amiri text-2xl font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors">{surah.name}</h4>
                                                    <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:translate-x-[-4px] transition-transform" />
                                                </div>

                                                <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] tracking-wide">
                                                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-100 dark:border-white/5">
                                                        <span className="text-emerald-600/80">الصفحة</span>
                                                        <span className="text-slate-600 dark:text-slate-300">{toArabicDigits(SURAH_START_PAGES[surah.number - 1])}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span>{surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span>{toArabicDigits(surah.numberOfAyahs)} آية</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-1 pb-24">
                                {JUZ_DATA.map((juz) => (
                                    <button
                                        key={juz.id}
                                        onClick={() => handleJuzSelect(juz)}
                                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all text-right group border border-transparent hover:border-emerald-500/10"
                                    >
                                        <div className="w-12 h-12 shrink-0 rounded-full bg-emerald-50/50 dark:bg-emerald-500/10 flex items-center justify-center font-amiri text-2xl font-bold text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all pb-2">
                                            {toArabicDigits(juz.id)}
                                        </div>
                                        <div>
                                            <h4 className="font-amiri text-xl text-slate-800 dark:text-white mb-1">
                                                <span className="font-bold">جزء</span> {juz.name}
                                            </h4>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div >
                ) : (
                    <motion.div
                        key="reader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`fixed inset-0 ${currentTheme.bg} ${currentTheme.darkBg} flex flex-col h-full overflow-hidden transition-colors duration-500 z-[5000]`}
                        onClick={resetControlsTimeout}
                        onTouchStart={(e) => { resetControlsTimeout(); onTouchStart(e); }}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        {/* Header */}
                        <div className={`${currentTheme.bg} ${currentTheme.darkBg} shrink-0 px-4 py-3 flex items-center justify-between border-b ${currentTheme.border} dark:border-white/5 relative z-[6000] transition-transform duration-300 ${showPlayerControls ? 'translate-y-0' : '-translate-y-[110%]'}`}>
                            <button
                                onClick={() => setSelectedSurah(null)}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex flex-col items-center">
                                <span className={`font-amiri text-xl font-bold ${currentTheme.text} dark:text-white leading-none mb-1`}>{selectedSurah.name}</span>
                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600/80 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
                                    <span>{selectedSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                                    <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                                    <span className="tabular-nums">{toArabicDigits(selectedSurah.numberOfAyahs)} آيـة</span>
                                    {isHifzMode && (
                                        <>
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full"></span>
                                            <span className="text-indigo-500 font-black">وضع الحفظ</span>
                                        </>
                                    )}
                                </div>
                            </div>


                            <div className="relative">
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                                >
                                    <Settings2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className={`flex-1 overflow-y-auto relative ${currentTheme.bg} ${currentTheme.darkBg} pb-32 transition-colors duration-500`}>
                            <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none"></div>

                            {loadingAyahs ? (
                                <div className="flex h-full items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                                </div>
                            ) : (
                                <div className="min-h-full py-8 px-2 sm:px-6 flex flex-col items-center pb-32">
                                    <div className={`w-full max-w-3xl bg-white dark:bg-slate-900 shadow-sm border ${currentTheme.border} dark:border-white/5 rounded-[4px] p-6 sm:p-12 md:p-16 relative transition-colors duration-500`}>

                                        {/* Desktop Side Navigation Zones */}
                                        <div className="hidden lg:block">
                                            {/* Previous Page Zone (Right side in RTL) */}
                                            <button
                                                onClick={prevPage}
                                                disabled={currentPage === 1}
                                                className="fixed right-0 top-0 bottom-0 w-20 flex items-center justify-center group/side z-[4500] disabled:opacity-0"
                                            >
                                                <div className="bg-white/5 backdrop-blur-md h-32 w-12 rounded-l-3xl border-l border-white/10 flex items-center justify-center translate-x-12 group-hover/side:translate-x-0 transition-transform duration-500 shadow-2xl">
                                                    <ChevronRight className="w-6 h-6 text-slate-400 group-hover/side:text-emerald-500 transition-colors" />
                                                </div>
                                            </button>

                                            {/* Next Page Zone (Left side in RTL) */}
                                            <button
                                                onClick={nextPage}
                                                className="fixed left-0 top-0 bottom-0 w-20 flex items-center justify-center group/side z-[4500]"
                                            >
                                                <div className="bg-white/5 backdrop-blur-md h-32 w-12 rounded-r-3xl border-r border-white/10 flex items-center justify-center -translate-x-12 group-hover/side:translate-x-0 transition-transform duration-500 shadow-2xl">
                                                    <ChevronLeft className="w-6 h-6 text-slate-400 group-hover/side:text-emerald-500 transition-colors" />
                                                </div>
                                            </button>
                                        </div>

                                        {/* Decorative Borders */}
                                        <div className={`absolute top-4 left-4 right-4 bottom-4 border ${currentTheme.border} dark:border-white/5 pointer-events-none rounded-[2px]`}></div>
                                        <div className={`absolute top-3 left-3 right-3 bottom-3 border ${currentTheme.border} dark:border-white/5 pointer-events-none rounded-[2px] opacity-50`}></div>



                                        <div
                                            className={`quran-text text-justify dir-rtl ${currentTheme.text} dark:text-slate-100 relative z-10 transition-colors duration-500`}
                                            dir="rtl"
                                            style={{
                                                textAlignLast: 'center',
                                                fontSize: `${fontSize}px`,
                                                lineHeight: `${fontSize * 2.1}px`
                                            }}
                                        >
                                            {getCurrentPageAyahs().map((ayah, index) => (
                                                <span key={ayah.number} id={`ayah-${ayah.number}`} className="inline group">
                                                    {/* Besmalah / Surah Header inside a page */}
                                                    {ayah.numberInSurah === 1 && ayah.surah && ayah.surah.number !== 1 && (
                                                        <div className="block w-full py-8 text-center opacity-80" dir="rtl">
                                                            <div className={`text-xl font-bold ${currentTheme.text} opacity-40 mb-2`}>--- {ayah.surah.name} ---</div>
                                                            {ayah.surah.number !== 9 && (
                                                                <p className={`quran-text text-3xl leading-none selection:bg-transparent`}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    <span
                                                        onClick={() => handleAyahClick(ayah)}
                                                        className={`cursor-pointer decoration-clone box-decoration-clone px-0.5 rounded transition-all select-none ${isHifzMode && !revealedAyahs.has(ayah.number)
                                                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-200 blur-[6px] dark:from-slate-700 dark:to-slate-700'
                                                            : currentAyahPlaying === ayah.number
                                                                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                                                : (stopAtAyah === ayah.number) ? 'bg-red-100/50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                                                                    : (userBookmark && userBookmark.surah_number === ayah.surah?.number && userBookmark.ayah_number === ayah.numberInSurah) ? 'bg-amber-100/50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
                                                                        : 'hover:text-emerald-700 dark:text-slate-100'
                                                            }`}
                                                    >
                                                        {ayah.text}
                                                    </span>



                                                    {/* Ayah Marker - Reverted Star Style */}
                                                    <span
                                                        onClick={(e) => { e.stopPropagation(); handleBookmark(ayah); }}
                                                        className="inline-flex items-center justify-center mx-1.5 align-middle relative h-[1.3em] w-[1.3em] cursor-pointer hover:scale-110 transition-all group/marker text-[#cbb181] hover:text-orange-500"
                                                        title="اضغط لحفظ مكان القراءة وتحديث الختمة"
                                                    >
                                                        <svg viewBox="0 0 36 36" className={`w-full h-full fill-none stroke-current transition-colors ${userBookmark && userBookmark.surah_number === selectedSurah.number && userBookmark.ayah_number === ayah.numberInSurah ? 'text-emerald-600 dark:text-emerald-400 opacity-100' : ''}`} strokeWidth="1.5">
                                                            <path d="M18 2L20.8 5.2L25 5.5L26.5 9.5L30.5 11L30.5 15.2L33.5 18L30.5 20.8L30.5 25L26.5 26.5L25 30.5L20.8 30.8L18 34L15.2 30.8L11 30.5L9.5 26.5L5.5 25L5.5 20.8L2.5 18L5.5 15.2L5.5 11L9.5 9.5L11 5.5L15.2 5.2L18 2Z" />
                                                        </svg>
                                                        <span className={`absolute inset-0 flex items-center justify-center text-[0.45em] font-amiri font-bold pb-1 transition-colors ${userBookmark && userBookmark.surah_number === ayah.surah?.number && userBookmark.ayah_number === ayah.numberInSurah ? 'text-emerald-900 dark:text-emerald-100' : 'text-[#8b6d3f] group-hover/marker:text-orange-700'}`}>
                                                            {toArabicDigits(ayah.numberInSurah)}
                                                        </span>
                                                    </span>
                                                </span>
                                            ))}
                                        </div>

                                    </div>

                                    <div className="mt-12 flex flex-col items-center gap-3 pb-32">
                                        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent"></div>
                                        <div className="px-6 py-2 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase tabular-nums">
                                            صفحة {toArabicDigits(currentPage)} من {toArabicDigits(getTotalPages())}
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>

                        <audio ref={audioRef} onEnded={playNextAyah} />

                        {/* Floating Audio Controller */}
                        <AnimatePresence>
                            {(currentAyahPlaying || isPlaying || (isHifzMode && hifzModeType === 'auto')) && showPlayerControls && (
                                <motion.div
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[4000] w-[95%] max-w-md h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-between px-8"
                                >
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={prevPage}
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (isHifzMode && hifzModeType === 'auto' && !hifzSyncWithAudio) {
                                                    setIsHifzFlowing(!isHifzFlowing);
                                                } else if (currentAyahPlaying) {
                                                    if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
                                                    else { audioRef.current?.play(); setIsPlaying(true); }
                                                } else {
                                                    // Start from first ayah on page if nothing playing
                                                    const firstAyah = getCurrentPageAyahs()[0];
                                                    if (firstAyah) togglePlayAyah(firstAyah);
                                                }
                                            }}
                                            className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            {(isPlaying || (isHifzMode && hifzModeType === 'auto' && isHifzFlowing)) ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                                        </button>

                                        <button
                                            onClick={nextPage}
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-end gap-0.5">
                                        <div className="flex items-center gap-2">
                                            {isHifzMode && (
                                                <span className="text-[9px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Hifz</span>
                                            )}
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{selectedSurah.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">صفحة {toArabicDigits(currentPage)} • آية {toArabicDigits(currentAyahPlaying ? getCurrentPageAyahs().find(a => a.number === currentAyahPlaying)?.numberInSurah || 1 : 1)}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* Settings Modal */}
                        <AnimatePresence>
                            {showSettings && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                                    onClick={() => setShowSettings(false)}
                                >
                                    <motion.div
                                        initial={{ y: 50, opacity: 0, scale: 0.95 }}
                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                        exit={{ y: 50, opacity: 0, scale: 0.95 }}
                                        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col max-h-[90vh]"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="p-6 border-b border-slate-100 dark:border-white/5 shrink-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-bold dark:text-white">إعدادات القارئ</h3>
                                                <button onClick={() => setShowSettings(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:text-slate-800">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="overflow-y-auto flex-1 p-6 space-y-6">
                                            {/* Section: Appearance */}
                                            <div className="bg-slate-50/50 dark:bg-white/[0.02] rounded-[2rem] p-6 border border-slate-100 dark:border-white/5">
                                                <div className="flex items-center gap-2 mb-6 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                                    <Palette className="w-4 h-4 text-emerald-500" />
                                                    <span>المظهر والنصوص</span>
                                                </div>

                                                {/* Themes Grid */}
                                                <div className="grid grid-cols-4 gap-4 mb-8">
                                                    {THEMES.map((theme) => (
                                                        <button
                                                            key={theme.id}
                                                            onClick={() => setReaderTheme(theme.id)}
                                                            className="flex flex-col items-center gap-2 group/theme"
                                                        >
                                                            <div
                                                                className={`relative w-full aspect-square rounded-2xl border-2 transition-all flex items-center justify-center ${readerTheme === theme.id ? 'border-emerald-500 scale-105 shadow-lg shadow-emerald-500/10' : 'border-slate-100 dark:border-white/5 hover:scale-105'}`}
                                                                style={{ backgroundColor: theme.preview }}
                                                            >
                                                                {readerTheme === theme.id && (
                                                                    <div className="bg-emerald-500 rounded-full p-1.5 shadow-sm border-2 border-white dark:border-slate-900">
                                                                        <Check className="w-3 h-3 text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className={`text-[9px] font-black transition-colors ${readerTheme === theme.id ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                {theme.name}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Font Size Control */}
                                                <div className="flex items-center justify-between bg-white dark:bg-white/5 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                                            <Type className="w-5 h-5" />
                                                        </div>
                                                        <span className="font-black text-slate-700 dark:text-slate-300 text-xs">حجم الخط</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl">
                                                        <button
                                                            onClick={() => setFontSize(s => Math.max(16, s - 2))}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-white/10 shadow-sm text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="font-mono font-black w-8 text-center text-slate-800 dark:text-white text-base leading-none pt-1">
                                                            {fontSize}
                                                        </span>
                                                        <button
                                                            onClick={() => setFontSize(s => Math.min(64, s + 2))}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-white/10 shadow-sm text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section: Audio Settings */}
                                            <div className="bg-slate-50/50 dark:bg-white/[0.02] rounded-[2rem] p-6 border border-slate-100 dark:border-white/5">
                                                <div className="flex items-center gap-2 mb-6 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                                    <Volume2 className="w-4 h-4 text-emerald-500" />
                                                    <span>إعدادات الصوت والتلاوة</span>
                                                </div>

                                                {/* Playback Speed Mini Switcher */}
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-2">
                                                        <Gauge className="w-4 h-4 text-slate-400" />
                                                        <span className="text-[11px] font-black text-slate-500">سرعة التلاوة</span>
                                                    </div>
                                                    <div className="flex bg-slate-200/50 dark:bg-black/30 p-1 rounded-xl">
                                                        {[0.75, 1, 1.25, 1.5].map(speed => (
                                                            <button
                                                                key={speed}
                                                                onClick={() => setPlaybackSpeed(speed)}
                                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${playbackSpeed === speed ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                            >
                                                                {speed}x
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Reciter Selector */}
                                                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {RECITERS.map((reciter) => (
                                                        <button
                                                            key={reciter.id}
                                                            onClick={() => { setSelectedReciter(reciter.id); toast.success(`تم اختيار: ${reciter.name}`, { position: 'bottom-center' }); }}
                                                            className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all border ${selectedReciter === reciter.id
                                                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                                                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-white/5 hover:border-emerald-500/30'
                                                                }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedReciter === reciter.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/5'}`}>
                                                                {selectedReciter === reciter.id ? <Volume2 className="w-4 h-4" /> : <Play className="w-3 h-3 text-slate-400" />}
                                                            </div>
                                                            <span className="flex-1 text-right font-bold text-sm tracking-tight">{reciter.name}</span>
                                                            {selectedReciter === reciter.id && (
                                                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Section: Smart Hifz */}
                                            <div className="relative overflow-hidden bg-gradient-to-br from-[#4338ca] to-[#3730a3] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/20 border border-white/10">
                                                {/* Decorative background element */}
                                                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl" />

                                                <div className="relative z-10 flex items-center justify-between mb-8">
                                                    <div className="text-right">
                                                        <h4 className="font-black text-xl tracking-tight">وضع التسميع الذكي</h4>
                                                        <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest mt-1">ثبّت حفظك بطريقة تفاعلية</p>
                                                    </div>
                                                    <button
                                                        onClick={() => { setIsHifzMode(!isHifzMode); setRevealedAyahs(new Set()); }}
                                                        className={`w-14 h-7 rounded-full transition-all duration-500 flex items-center px-1.5 ${isHifzMode ? 'bg-white justify-end' : 'bg-white/20 justify-start'}`}
                                                    >
                                                        <motion.div layout className={`w-4 h-4 rounded-full shadow-lg ${isHifzMode ? 'bg-indigo-600' : 'bg-white'}`} />
                                                    </button>
                                                </div>

                                                {isHifzMode && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="relative z-10 space-y-6"
                                                    >
                                                        <div className="flex gap-2 p-1.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                                            <button
                                                                onClick={() => { setHifzModeType('manual'); setRevealedAyahs(new Set()); }}
                                                                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${hifzModeType === 'manual' ? 'bg-white text-indigo-600 shadow-xl' : 'text-white/60 hover:text-white'}`}
                                                            >
                                                                يدوي (نقر)
                                                            </button>
                                                            <button
                                                                onClick={() => { setHifzModeType('auto'); setRevealedAyahs(new Set()); setIsHifzFlowing(isPlaying); }}
                                                                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${hifzModeType === 'auto' ? 'bg-white text-indigo-600 shadow-xl' : 'text-white/60 hover:text-white'}`}
                                                            >
                                                                تلقائي (جريان)
                                                            </button>
                                                        </div>

                                                        <div className="px-2">
                                                            <p className="text-[10px] text-indigo-200/70 font-bold leading-relaxed">
                                                                {hifzModeType === 'manual'
                                                                    ? "• انقر على الآية لإظهارها، وانقر مرة أخرى لتسمعها بصوت القارئ."
                                                                    : "• سيقوم التطبيق بإظهار الآيات تباعاً بشكل تلقائي لتتمكن من التسميع."}
                                                            </p>
                                                        </div>

                                                        {hifzModeType === 'auto' && (
                                                            <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-500">
                                                                <div className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/5">
                                                                    <div className="flex items-center gap-3">
                                                                        <Volume2 className="w-4 h-4 text-white/70" />
                                                                        <span className="text-[11px] font-black text-white/90">تزامن مع صوت القارئ</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => { setHifzSyncWithAudio(!hifzSyncWithAudio); setIsHifzFlowing(false); }}
                                                                        className={`w-10 h-5 rounded-full transition-all duration-300 flex items-center px-1 ${hifzSyncWithAudio ? 'bg-white justify-end' : 'bg-white/20 justify-start'}`}
                                                                    >
                                                                        <div className={`w-3 h-3 rounded-full shadow-sm ${hifzSyncWithAudio ? 'bg-indigo-600' : 'bg-white'}`} />
                                                                    </button>
                                                                </div>

                                                                {!hifzSyncWithAudio && (
                                                                    <div className="space-y-4 px-1">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[11px] font-black text-white/60">سرعة الجريان القلقائي</span>
                                                                            <span className="text-xs font-black tabular-nums">{hifzReadingSpeed} ثواني</span>
                                                                        </div>
                                                                        <input
                                                                            type="range" min="2" max="15" step="1"
                                                                            value={hifzReadingSpeed}
                                                                            onChange={(e) => setHifzReadingSpeed(parseInt(e.target.value))}
                                                                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Tafsir Modal */}
                        <AnimatePresence>
                            {showTafsirModal && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                                    onClick={() => setShowTafsirModal(false)}
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        exit={{ scale: 0.9, y: 20 }}
                                        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-white/10"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-4 flex items-center justify-between border-b border-emerald-100 dark:border-white/5">
                                            <h3 className="font-bold font-amiri text-lg text-emerald-800 dark:text-emerald-400">
                                                تفسير الآية {selectedTafsirAyah && toArabicDigits(selectedTafsirAyah.ayah.numberInSurah)}
                                            </h3>
                                            <button onClick={() => setShowTafsirModal(false)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                                                <X className="w-5 h-5 text-emerald-700 dark:text-emerald-500" />
                                            </button>
                                        </div>
                                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                                            {loadingTafsir ? (
                                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                                    <span className="text-sm font-bold text-slate-400">جاري تحميل التفسير...</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <p className="font-amiri text-xl leading-loose text-slate-800 dark:text-slate-200 text-center border-b border-dashed border-slate-200 dark:border-white/10 pb-4">
                                                        {selectedTafsirAyah?.ayah.text}
                                                    </p>
                                                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl">
                                                        <p className="text-base leading-loose text-slate-600 dark:text-slate-300 font-medium text-justify" dir="rtl">
                                                            {selectedTafsirAyah?.text}
                                                        </p>
                                                    </div>
                                                    <div className="text-center text-[10px] text-slate-400 font-bold mt-2">
                                                        التفسير الميسر
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-white/5 text-center">
                                            <button
                                                onClick={() => setShowTafsirModal(false)}
                                                className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                                            >
                                                إغلاق
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )
                }
            </AnimatePresence >



        </div >
    );
}
