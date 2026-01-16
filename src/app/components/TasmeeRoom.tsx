import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, User, Users, Music, Star, Heart, Volume2, Shield, Sparkles, X, MessageSquare, BookOpen, UserCheck, Eye, ListFilter, RotateCcw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../utils/supabase';

interface TasmeeRoomProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    partnerId: string;
    partnerName: string;
    challengeDetails?: {
        surah?: string;
        from_ayah?: string;
        to_ayah?: string;
        from_page?: string;
        to_page?: string;
    };
}

const AYAH_PAGE_SIZE = 9;

interface Ayah {
    number: number;
    text: string;
    numberInSurah: number;
}

export function TasmeeRoom({ isOpen, onClose, currentUserId, partnerId, partnerName, challengeDetails }: TasmeeRoomProps) {
    const [isJoined, setIsJoined] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isPartnerInRoom, setIsPartnerInRoom] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [volume, setVolume] = useState(0);

    // Session State
    const [role, setRole] = useState<'none' | 'reciter' | 'listener'>('none');
    const [surahAyahs, setSurahAyahs] = useState<Ayah[]>([]);
    const [loadingAyahs, setLoadingAyahs] = useState(false);
    const [mistakes, setMistakes] = useState<number[]>([]);
    const [sessionEnded, setSessionEnded] = useState(false);
    const [currentAyahPage, setCurrentAyahPage] = useState(0);

    // Simulated noise/volume animation
    useEffect(() => {
        if (isMicOn && isJoined) {
            const interval = setInterval(() => {
                setVolume(Math.random() * 100);
            }, 100);
            return () => clearInterval(interval);
        } else {
            setVolume(0);
        }
    }, [isMicOn, isJoined]);

    // Fetch Ayahs when challengeDetails changes and role is set
    useEffect(() => {
        if (isOpen && challengeDetails?.surah && (role === 'listener' || sessionEnded)) {
            fetchAyahs();
            setCurrentAyahPage(0);
        }
    }, [isOpen, challengeDetails, role, sessionEnded]);

    const fetchAyahs = async () => {
        if (!challengeDetails?.surah) return;
        setLoadingAyahs(true);
        try {
            // Helper to remove Arabic diacritics
            const stripDiacritics = (text: string) => text.replace(/[\u064B-\u065F]/g, "");

            // 1. Find Surah Number
            const surahsRes = await fetch('https://api.alquran.cloud/v1/surah');
            const surahsData = await surahsRes.json();

            const searchName = stripDiacritics(challengeDetails.surah.replace('سورة', '').replace('سُورَةُ', '').trim());

            const surah = surahsData.data.find((s: any) => {
                const normalizedApiName = stripDiacritics(s.name.replace('سُورَةُ', '').trim());
                return normalizedApiName.includes(searchName) ||
                    s.englishName.toLowerCase().includes(searchName.toLowerCase());
            });

            if (surah) {
                const res = await fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/quran-uthmani`);
                const data = await res.json();
                let ayahs = data.data.ayahs;

                // Filter by ayah range
                const from = parseInt(challengeDetails.from_ayah || '1');
                const to = parseInt(challengeDetails.to_ayah || '999');

                ayahs = ayahs.filter((a: any) => a.numberInSurah >= from && a.numberInSurah <= to);
                setSurahAyahs(ayahs);
            }
        } catch (e) {
            console.error('Error fetching ayahs:', e);
        } finally {
            setLoadingAyahs(false);
        }
    };

    const toggleMic = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !isMicOn;
            });
            setIsMicOn(!isMicOn);
        }
    };

    const joinRoom = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setStream(mediaStream);
            setIsJoined(true);

            setTimeout(() => {
                setIsPartnerInRoom(true);
            }, 2000);

        } catch (err) {
            console.error('Failed to get microphone:', err);
        }
    };

    const toggleMistake = (ayahNumber: number) => {
        if (sessionEnded || role !== 'listener') return;
        setMistakes(prev =>
            prev.includes(ayahNumber)
                ? prev.filter(n => n !== ayahNumber)
                : [...prev, ayahNumber]
        );
    };

    const leaveRoom = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setIsJoined(false);
        setIsPartnerInRoom(false);
        setRole('none');
        setMistakes([]);
        setSessionEnded(false);
        onClose();
    };

    const finishSession = () => {
        setSessionEnded(true);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10001] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-hidden"
            >
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 -left-20 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />
                </div>

                <motion.div
                    initial={{ scale: 0.9, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 40, opacity: 0 }}
                    className="relative w-full max-w-2xl bg-white/5 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden backdrop-blur-md max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-8 flex items-center justify-between border-b border-white/5 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white">غرفة التسميع</h2>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isPartnerInRoom ? 'bg-emerald-500' : 'bg-slate-500'} animate-pulse`} />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {isPartnerInRoom ? 'جلسة مباشرة الآن' : 'في انتظار الشريك...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={leaveRoom} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10">
                        {!isJoined ? (
                            <div className="text-center space-y-10 py-10">
                                <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/10 relative">
                                    <Mic className="w-10 h-10 text-indigo-400" />
                                    <div className="absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-white">جاهز لبدء التسميع؟</h3>
                                    <p className="text-slate-400 text-sm max-w-xs mx-auto">سيتم تفعيل الميكروفون للتواصل الصوتي المباشر مع شريكك للمراجعة والحفظ.</p>
                                </div>
                                <button
                                    onClick={joinRoom}
                                    className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all text-base"
                                >
                                    دخول الغرفة ⚡
                                </button>
                            </div>
                        ) : role === 'none' ? (
                            <div className="space-y-10 py-10 text-center">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white">اختر دورك الآن</h3>
                                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">حدد من سيقوم بالتسميع اليوم</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <button
                                        onClick={() => setRole('reciter')}
                                        className="group p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-indigo-600/20 hover:border-indigo-500/40 transition-all flex flex-col items-center gap-4"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                            <Mic className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="text-right">
                                            <h4 className="font-black text-white text-lg">أنا المُسمِّع</h4>
                                            <p className="text-[10px] text-slate-500 font-bold group-hover:text-indigo-300">سأقوم بقراءة القرآن</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setRole('listener')}
                                        className="group p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-emerald-600/20 hover:border-emerald-500/40 transition-all flex flex-col items-center gap-4"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                            <Eye className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="text-right">
                                            <h4 className="font-black text-white text-lg">أنا المُستمِع</h4>
                                            <p className="text-[10px] text-slate-500 font-bold group-hover:text-emerald-300">سأتابع تلاوة شريكي</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        ) : sessionEnded ? (
                            <div className="space-y-8 py-6">
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 bg-indigo-600/20 rounded-[2rem] flex items-center justify-center mx-auto border border-indigo-500/30">
                                        <Star className="w-10 h-10 text-indigo-400" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white">اكتملت جلسة التسميع!</h3>
                                    <p className="text-slate-400 text-sm font-bold">بارك الله في هذا المجهود الطيب. إليكم ملخص الجلسة:</p>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                                                <ListFilter className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ملاحظات التسميع</p>
                                                <h4 className="text-lg font-black text-white">{mistakes.length} أخطاء تحتاج مراجعة</h4>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">التقييم</p>
                                            <p className="text-lg font-black text-emerald-500">{mistakes.length === 0 ? 'ممتاز ⭐' : mistakes.length <= 3 ? 'جيد جداً ✅' : 'يحتاج مراجعة 📚'}</p>
                                        </div>
                                    </div>

                                    {mistakes.length > 0 && (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">الآيات التي تعثرت بها:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {mistakes.map(num => (
                                                    <div key={num} className="px-4 py-2 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 font-black text-xs">
                                                        الآية {num}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            onClick={() => { setMistakes([]); setSessionEnded(false); setRole('none'); }}
                                            className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <RotateCcw className="w-4 h-4" /> دور جديد
                                        </button>
                                        <button
                                            onClick={leaveRoom}
                                            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all"
                                        >
                                            إنهاء الجلسة والعودة
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full space-y-8">
                                {/* Roles Stats Overlay */}
                                <div className="flex items-center justify-between px-4">
                                    <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${role === 'reciter' ? 'bg-indigo-600/20 border-indigo-500/30' : 'bg-slate-800/50 border-white/5 animate-pulse'}`}>
                                        <Mic className={`w-4 h-4 ${role === 'reciter' ? 'text-indigo-400' : 'text-slate-500'}`} />
                                        <span className="text-[11px] font-black text-white">المُسمِّع: {role === 'reciter' ? 'أنت' : partnerName}</span>
                                    </div>
                                    <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${role === 'listener' ? 'bg-emerald-600/20 border-emerald-500/30' : 'bg-slate-800/50 border-white/5 animate-pulse'}`}>
                                        <Eye className={`w-4 h-4 ${role === 'listener' ? 'text-emerald-400' : 'text-slate-500'}`} />
                                        <span className="text-[11px] font-black text-white">المُستمِع: {role === 'listener' ? 'أنت' : partnerName}</span>
                                    </div>
                                </div>

                                {role === 'listener' ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                                                    <BookOpen className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-white">قرآني</h4>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">نص المراجعة للتحدي</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 rounded-full border border-rose-500/30">
                                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                                <span className="text-[10px] font-black text-rose-300">{mistakes.length} أخطاء</span>
                                            </div>
                                        </div>

                                        {loadingAyahs ? (
                                            <div className="py-20 flex flex-col items-center gap-4">
                                                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">جاري تحميل النص الكريم...</p>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-900/50 rounded-3xl p-5 sm:p-7 text-center leading-[1.8] dir-rtl font-amiri text-base sm:text-xl text-slate-100 min-h-[150px] max-h-[400px] overflow-y-auto custom-scrollbar" dir="rtl">
                                                {surahAyahs.length > 0 ? (
                                                    <div className="space-y-4">
                                                        <div className="text-center">
                                                            {surahAyahs.slice(currentAyahPage * AYAH_PAGE_SIZE, (currentAyahPage + 1) * AYAH_PAGE_SIZE).map((ayah) => (
                                                                <span key={ayah.number} className="inline">
                                                                    <span
                                                                        onClick={() => toggleMistake(ayah.numberInSurah)}
                                                                        className={`cursor-pointer px-0.5 rounded transition-all inline ${mistakes.includes(ayah.numberInSurah) ? 'bg-rose-500/30 text-rose-400 ring-1 ring-rose-500/20' : 'hover:bg-white/10'}`}
                                                                    >
                                                                        {ayah.text}
                                                                    </span>
                                                                    <span className="mx-1 text-indigo-500/40 text-[10px] font-sans font-bold whitespace-nowrap">({ayah.numberInSurah})</span>
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {surahAyahs.length > AYAH_PAGE_SIZE && (
                                                            <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/5">
                                                                <button
                                                                    disabled={currentAyahPage === 0}
                                                                    onClick={() => setCurrentAyahPage(p => p - 1)}
                                                                    className="px-3 py-1.5 bg-white/5 rounded-xl text-[10px] font-black text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                                                                >
                                                                    السابق
                                                                </button>
                                                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                                                    {currentAyahPage + 1} / {Math.ceil(surahAyahs.length / AYAH_PAGE_SIZE)}
                                                                </span>
                                                                <button
                                                                    disabled={(currentAyahPage + 1) * AYAH_PAGE_SIZE >= surahAyahs.length}
                                                                    onClick={() => setCurrentAyahPage(p => p + 1)}
                                                                    className="px-3 py-1.5 bg-white/5 rounded-xl text-[10px] font-black text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                                                                >
                                                                    التالي
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-500 py-10 font-sans font-bold">المحتوى غير متوفر حالياً. تأكد من صحة التحدي.</p>
                                                )}
                                            </div>
                                        )}

                                        <button
                                            onClick={finishSession}
                                            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-3"
                                        >
                                            إكمال التسميع وعرض التقرير <CheckCircle2 className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-8 py-10 flex flex-col items-center">
                                        <div className="relative">
                                            <div className="w-32 h-32 rounded-[3rem] bg-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                                                <Mic className="w-12 h-12 text-white" />
                                            </div>
                                            <motion.div
                                                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="absolute -inset-6 border-4 border-indigo-500/20 rounded-[4rem]"
                                            />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl font-black text-white">أنت تقرأ الآن</h3>
                                            <p className="text-slate-400 text-sm max-w-xs mx-auto">شريكك يتابع معك بتركيز وسيقوم بتنبيهك للأخطاء إن وجدت.</p>
                                        </div>

                                        {/* Visualizer Middle */}
                                        <div className="flex items-center gap-2 h-12">
                                            {[...Array(8)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ height: isMicOn ? [12, Math.random() * 40 + 12, 12] : 6 }}
                                                    transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.05 }}
                                                    className="w-1.5 bg-indigo-500 rounded-full"
                                                />
                                            ))}
                                        </div>

                                        <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-center space-y-2">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">﴿فَإِذَا قَرَأْتَهُ فَاتَّبِعْ قُرْآنَهُ﴾</p>
                                            <p className="text-lg font-black text-indigo-300">
                                                {challengeDetails?.surah} • الآيات ({challengeDetails?.from_ayah || 1} - {challengeDetails?.to_ayah || 1})
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Floating Controls Bar */}
                                <div className="flex justify-center gap-6 pt-4 border-t border-white/5">
                                    <button
                                        onClick={toggleMic}
                                        className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 text-white border border-white/10' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}
                                    >
                                        {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                                    </button>
                                    <button
                                        onClick={leaveRoom}
                                        className="w-16 h-16 rounded-3xl bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <PhoneOff className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={() => setRole('none')}
                                        className="w-16 h-16 rounded-3xl bg-white/10 text-white border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                                    >
                                        <RotateCcw className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

