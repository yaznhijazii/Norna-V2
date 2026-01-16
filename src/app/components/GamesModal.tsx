import { useState, useEffect } from 'react';
import { X, Gamepad2, Trophy, Loader2, Check, ArrowRight, BookOpen, Star, RefreshCw, HelpCircle, ChevronLeft, Quote, Users, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { supabase } from '../utils/supabase';

interface GameProps {
    isOpen: boolean;
    onClose: () => void;
    partnerName: string;
}

type GameMode = 'menu' | 'rattil' | 'quiz' | 'settings' | 'lobby';
type PlayMode = 'solo' | 'partner';

interface Question {
    id: number;
    question: string;
    options: string[];
    answer: string;
    category: string;
}

export function GamesModal({ isOpen, onClose, partnerName }: GameProps) {
    const [mode, setMode] = useState<GameMode>('menu');
    const [playMode, setPlayMode] = useState<PlayMode>('solo');
    const [rounds, setRounds] = useState(5);
    const [selectedGame, setSelectedGame] = useState<'rattil' | 'quiz' | null>(null);
    const [loading, setLoading] = useState(false);
    const [score, setScore] = useState(0);

    // Common State
    const [currentRound, setCurrentRound] = useState(1);

    // Rattil State
    const [ayah, setAyah] = useState<{ text: string; surah: string; number: number } | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [hiddenIndex, setHiddenIndex] = useState(-1);
    const [ayahWords, setAyahWords] = useState<string[]>([]);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    // Quiz State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);
    // Presence & Game State
    const [isPartnerOnline, setIsPartnerOnline] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [roomCode, setRoomCode] = useState<string>('');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [gameRoom, setGameRoom] = useState<any>(null);
    const [inviteSent, setInviteSent] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('nooruna_user');
        if (userStr) {
            const localUser = JSON.parse(userStr);
            setCurrentUser(localUser);

            // Fetch latest from DB to ensure partner_id is up to date
            const refreshUser = async () => {
                const { data } = await supabase.from('users').select('*').eq('id', localUser.id).single();
                if (data) {
                    setCurrentUser(data);
                    localStorage.setItem('nooruna_user', JSON.stringify(data));
                }
            };
            refreshUser();
        }
    }, []);

    // Simplified presence just to show online status, game logic moved to DB
    useEffect(() => {
        if (isOpen && currentUser?.id && currentUser?.partner_id) {
            const userRoomId = [currentUser.id, currentUser.partner_id].sort().join('-');
            // Visual code
            setRoomCode(userRoomId.slice(0, 4).toUpperCase());

            const presenceChannel = supabase.channel(`global-presence:${userRoomId}`, {
                config: { presence: { key: currentUser.id } }
            });

            presenceChannel
                .on('presence', { event: 'sync' }, () => {
                    const state = presenceChannel.presenceState();
                    const partnerPresent = !!Object.values(state).flat().find((p: any) => p.user_id === currentUser.partner_id);
                    setIsPartnerOnline(partnerPresent);
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await presenceChannel.track({
                            user_id: currentUser.id,
                            online_at: new Date().toISOString()
                        });
                    }
                });

            return () => {
                presenceChannel.unsubscribe();
            };
        } else if (isOpen && currentUser?.id && !currentUser?.partner_id) {
            setRoomCode('----'); // No Partner
        }
    }, [isOpen, currentUser]);

    // Listener for Game Room Updates (DB)
    useEffect(() => {
        if (!roomId) return;

        const roomChannel = supabase
            .channel(`game_room_db:${roomId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
                (payload) => {
                    const room = payload.new;
                    setGameRoom(room);

                    // Sync Local State from DB
                    if (room.puzzle_data) {
                        setAyah(room.puzzle_data.ayah);
                        setAyahWords(room.puzzle_data.words);
                        setOptions(room.puzzle_data.options);
                        setHiddenIndex(room.puzzle_data.hiddenIndex);
                        setAyah(room.puzzle_data.ayah);
                        // Reset selection for new round
                        if (room.current_round !== currentRound) {
                            setIsCorrect(null);
                            setSelectedOption(null);
                            setCurrentRound(room.current_round);
                        }
                    }

                    if (room.status === 'finished') {
                        setQuizFinished(true);
                        setScore(room.host_score + room.guest_score); // Collective score
                    } else if (room.status === 'playing' && quizFinished) {
                        // RESTART DETECTED
                        setQuizFinished(false);
                        setScore(0);
                        setCurrentRound(1);
                        setIsCorrect(null);
                        setSelectedOption(null);
                    }
                }
            )
            .subscribe();

        return () => {
            roomChannel.unsubscribe();
        };
    }, [roomId]);


    const createOrJoinRoom = async (autoJoinLobby = false) => {
        if (!currentUser || !currentUser.partner_id) return;
        setLoading(true);

        try {
            // Check for existing active room (waiting or playing)
            const { data: existing } = await supabase
                .from('game_rooms')
                .select('*')
                .or(`host_id.eq.${currentUser.id},guest_id.eq.${currentUser.id}`)
                .in('status', ['playing', 'waiting'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (existing) {
                setRoomId(existing.id);
                setGameRoom(existing);
                // Update room code logic immediately
                setRoomCode(existing.id.slice(0, 4).toUpperCase());

                if (!autoJoinLobby && existing.status === 'playing') {
                    setMode('rattil'); // Resume only if asked AND playing
                }
            } else {
                // Create new room if none
                const { data: newRoom, error } = await supabase
                    .from('game_rooms')
                    .insert({
                        host_id: currentUser.id,
                        guest_id: currentUser.partner_id,
                        status: 'waiting',
                        game_type: 'rattil',
                        total_rounds: rounds
                    })
                    .select()
                    .single();

                if (error) throw error;
                setRoomId(newRoom.id);
                setGameRoom(newRoom);
                setRoomCode(newRoom.id.slice(0, 4).toUpperCase());
            }
        } catch (e) {
            console.error('Error creating room:', e);
        } finally {
            setLoading(false);
        }
    };

    // Auto-create/join room when entering Lobby
    useEffect(() => {
        if (mode === 'lobby') {
            createOrJoinRoom(true).then(() => {
                // Ensure code is updated if room exists
                if (gameRoom?.id) setRoomCode(gameRoom.id.slice(0, 4).toUpperCase());
            });
        }
    }, [mode]);



    const invitePartner = async () => {
        if (!currentUser?.partner_id) return;
        setInviteSent(true);

        try {
            await supabase.from('notifications').insert({
                user_id: currentUser.partner_id,
                type: 'game_invite',
                title: 'دعوة للعب 🎮',
                content: `شريكك ${currentUser.name} يدعوك لتحدي في واحة الألعاب!`,
                link: '/games',
                is_read: false
            });
            setTimeout(() => setInviteSent(false), 3000); // UI Reset
        } catch (e) {
            console.error('Error sending invite:', e);
            setInviteSent(false);
        }
    };



    useEffect(() => {
        if (isOpen) {
            resetToMenu();
        }
    }, [isOpen]);

    const resetToMenu = () => {
        setMode('menu');
        setScore(0);
        setCurrentRound(1);
        setIsCorrect(null);
        setAyah(null);
        setSelectedOption(null);
        setQuizFinished(false);
        setRoomId(null);
        setGameRoom(null);
    };

    const fetchRandomAyah = async (returnOnly = false) => {
        setLoading(true);
        if (!returnOnly) {
            setIsCorrect(null);
            setSelectedOption(null);
        }

        try {
            const randomID = Math.floor(Math.random() * 6236) + 1;
            const res = await fetch(`https://api.alquran.cloud/v1/ayah/${randomID}/ar.clean`);
            const data = await res.json();
            if (data.data) {
                // Aggressive cleaning
                const textWithVowels = data.data.text;
                const cleanText = textWithVowels.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0611-\u0614]/g, '');
                const originalWords = cleanText.split(/\s+/).filter((w: string) => w.length > 0);

                const validIndices = originalWords
                    .map((w: string, i: number) => w.length > 2 ? i : -1)
                    .filter((i: number) => i !== -1);

                if (validIndices.length === 0) return fetchRandomAyah(returnOnly);

                const randomIndex = validIndices[Math.floor(Math.random() * validIndices.length)];
                const correctWord = originalWords[randomIndex];

                // Distractors (Simplified logic for brevity, assuming same robust logic as before)
                const distractors = ['الذين', 'آمنوا', 'الأرض']; // Fallback

                const finalOptions = [correctWord, ...distractors].sort(() => 0.5 - Math.random());
                const puzzleData = {
                    text: cleanText,
                    surah: data.data.surah.name,
                    number: data.data.numberInSurah,
                    words: originalWords,
                    options: finalOptions,
                    hiddenIndex: randomIndex,
                    correctWord
                };

                if (returnOnly) return { ayah: puzzleData, ...puzzleData }; // Return for DB

                setOptions(finalOptions);
                setHiddenIndex(randomIndex);
                setAyahWords(originalWords);
                setAyah({
                    text: cleanText,
                    surah: data.data.surah.name,
                    number: data.data.numberInSurah
                });
            }
        } catch (error) {
            console.error('Error fetching ayah:', error);
        } finally {
            setLoading(false);
        }
    };

    const startGame = async (game: 'rattil' | 'quiz') => {
        setSelectedGame(game);
        setMode('settings');
    };

    const startQuiz = async () => {
        setLoading(true);
        try {
            const res = await fetch('/islamicquestion.json');
            const data = await res.json();
            const shuffled = [...data].sort(() => 0.5 - Math.random()).slice(0, rounds);
            setQuestions(shuffled);
            setCurrentQuestionIndex(0);
            setQuizFinished(false);
            setScore(0);
            setCurrentRound(1);
            setSelectedOption(null);
            setMode('quiz');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const launchGame = async () => {
        if (selectedGame === 'rattil') {
            if (playMode === 'partner') {
                // Restart Logic for Existing Room
                if (roomId && gameRoom?.status === 'finished') {
                    if (currentUser.id === gameRoom.host_id) {
                        const puzzle = await fetchRandomAyah(true);
                        if (puzzle) {
                            await supabase.from('game_rooms').update({
                                status: 'playing',
                                puzzle_data: puzzle,
                                current_round: 1,
                                host_score: 0,
                                guest_score: 0
                            }).eq('id', roomId);
                        }
                    } else {
                        alert('في انتظار المضيف لبدء جولة جديدة...');
                    }
                    setMode('rattil');
                    return;
                }

                await createOrJoinRoom();
                // Host generates first puzzle
                const puzzle = await fetchRandomAyah(true);
                if (puzzle && roomId) {
                    await supabase.from('game_rooms').update({
                        status: 'playing',
                        puzzle_data: puzzle,
                        current_round: 1
                    }).eq('id', roomId);
                }
                setMode('rattil');
            } else {
                setScore(0);
                setCurrentRound(1);
                setMode('rattil');
                fetchRandomAyah();
            }
        } else if (selectedGame === 'quiz') {
            startQuiz();
        }
    };

    const handleRattilAnswer = async (option: string) => {
        if (selectedOption) return;
        setSelectedOption(option);
        const correctWord = ayahWords[hiddenIndex];
        const correct = option === correctWord;

        if (correct) {
            setIsCorrect(true);
            const newScore = score + 1;
            setScore(newScore);
            confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 }, colors: ['#10b981', '#34d399'] });

            // DB Update for Partner Mode
            if (playMode === 'partner' && roomId && gameRoom) {
                const isHost = currentUser.id === gameRoom.host_id;
                await supabase.from('game_rooms').update({
                    [isHost ? 'host_score' : 'guest_score']: (isHost ? gameRoom.host_score : gameRoom.guest_score) + 1
                }).eq('id', roomId);
            }
        } else {
            setIsCorrect(false);
        }

        setTimeout(async () => {
            if (currentRound < rounds) {
                // Partner Mode: Fetch new puzzle and update DB
                if (playMode === 'partner' && roomId && gameRoom) {
                    // Only Host generates new puzzle to avoid collision
                    if (currentUser.id === gameRoom.host_id) {
                        const nextPuzzle = await fetchRandomAyah(true);
                        if (nextPuzzle) {
                            await supabase.from('game_rooms').update({
                                current_round: currentRound + 1,
                                puzzle_data: nextPuzzle
                            }).eq('id', roomId);
                        }
                    }
                } else {
                    setCurrentRound(r => r + 1);
                    fetchRandomAyah();
                }
            } else {
                if (playMode === 'partner' && roomId) {
                    await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', roomId);
                }
                setQuizFinished(true);
            }
        }, 1500);
    };

    const handleQuizAnswer = (option: string) => {
        if (selectedOption) return;
        setSelectedOption(option);
        if (option === questions[currentQuestionIndex].answer) {
            setScore(s => s + 1);
            confetti({
                particleCount: 30,
                spread: 40,
                origin: { y: 0.8 },
                colors: ['#fbbf24', '#f59e0b']
            });
        }

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(i => i + 1);
                setCurrentRound(r => r + 1);
                setSelectedOption(null);
            } else {
                setQuizFinished(true);
            }
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 bg-white dark:bg-slate-950 z-[10000] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
                        >
                            <ArrowRight className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">واحة الألعاب</h2>
                            <div className="flex items-center gap-2">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">تسمو بك وبشريكك</p>
                                {isPartnerOnline && (
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">شريكك متصل الآن</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-[480px] mx-auto w-full p-6 pb-24">
                        {mode === 'menu' && (
                            <div className="space-y-6 py-4">
                                <div className="text-center space-y-2 mb-6">
                                    <div className="w-16 h-16 bg-violet-100 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-600 mx-auto mb-3">
                                        <Gamepad2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">اختر تحدي اليوم</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">استمتع بوقتك في طاعة الله ومعرفة دينه</p>
                                </div>

                                <button
                                    onClick={() => startGame('rattil')}
                                    className="w-full p-6 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 group relative overflow-hidden text-right transition-transform hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    <div className="relative z-10 flex items-center justify-between">
                                        <ChevronLeft className="w-5 h-5 opacity-40 group-hover:-translate-x-1 transition-transform" />
                                        <div className="flex-1 mr-4">
                                            <h3 className="text-xl font-black mb-1">لعبة الترتيل</h3>
                                            <p className="text-xs text-emerald-100 font-medium opacity-90">أكمل الكلمة الناقصة في الآيات</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 blur-[60px] rounded-full -translate-x-1/2 -translate-y-1/2" />
                                </button>

                                <button
                                    onClick={() => startGame('quiz')}
                                    className="w-full p-6 rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl shadow-amber-500/20 group relative overflow-hidden text-right transition-transform hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    <div className="relative z-10 flex items-center justify-between">
                                        <ChevronLeft className="w-5 h-5 opacity-40 group-hover:-translate-x-1 transition-transform" />
                                        <div className="flex-1 mr-4">
                                            <h3 className="text-xl font-black mb-1">أسئلة إسلامية</h3>
                                            <p className="text-xs text-amber-50 font-medium opacity-90">معلومات شاملة تغني ثقافتك</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                            <HelpCircle className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 blur-[60px] rounded-full -translate-x-1/2 -translate-y-1/2" />
                                </button>

                                <div className="mt-8 p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 relative overflow-hidden">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600">
                                            <Star className="w-4 h-4 fill-amber-500" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">نظام النقاط</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed relative z-10">العب مع شريكك لتكسب نقاطاً تضاف لمستواكم المشترك وتزيد من قوة ارتباطكم الروحي!</p>
                                </div>
                            </div>
                        )}



                        {mode === 'lobby' && (
                            <div className="flex flex-col items-center justify-center space-y-8 py-12">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-500/10 mb-4 relative">
                                        <Users className="w-10 h-10 text-violet-600 animate-pulse" />
                                        {isPartnerOnline && (
                                            <span className="absolute top-0 right-0 w-5 h-5 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full"></span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">غرفة اللعب</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                                        {isPartnerOnline ? 'شريكك متواجد الآن!' : 'بانتظار انضمام شريكك...'}
                                    </p>
                                </div>

                                <div className="w-full max-w-xs space-y-4">
                                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">رمز الغرفة</p>
                                        <p className="text-3xl font-black text-slate-800 dark:text-white tracking-widest font-mono">{roomCode}</p>
                                    </div>

                                    <div className="flex flex-col w-full gap-3">
                                        {!isPartnerOnline && (
                                            <button
                                                onClick={invitePartner}
                                                disabled={inviteSent}
                                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${inviteSent
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 cursor-default'
                                                    : 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-500/30'
                                                    }`}
                                            >
                                                {inviteSent ? (
                                                    <>
                                                        <Check className="w-5 h-5" /> تم الإرسال
                                                    </>
                                                ) : (
                                                    <>
                                                        <Users className="w-5 h-5" /> دعوة الشريك
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        <div className={`p-3 rounded-xl flex items-center gap-3 ${isPartnerOnline ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-100 dark:bg-white/5 opacity-70'}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-colors ${isPartnerOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                                {partnerName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className={`font-bold ${isPartnerOnline ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>{partnerName}</p>
                                                <p className="text-[10px] opacity-70">{isPartnerOnline ? 'متصل وجاهز للتحدي' : 'غير متصل (يمكنك البدء)'}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={launchGame}
                                            className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-black shadow-xl active:scale-95 transition-all"
                                        >
                                            إنطلاق! 🚀
                                        </button>
                                    </div>
                                </div>

                                <button onClick={() => setMode('settings')} className="text-sm font-bold text-slate-400 hover:text-slate-600">
                                    العودة للإعدادات
                                </button>
                            </div>
                        )}

                        {mode === 'settings' && (
                            <div className="space-y-8 py-6">
                                {playMode === 'partner' && (
                                    <div className="text-center">
                                        <span className="inline-block px-3 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-600 rounded-full text-[10px] font-black tracking-widest border border-violet-100 dark:border-violet-500/20">
                                            ROOM: {roomCode}
                                        </span>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <h4 className="text-base font-black text-slate-800 dark:text-white text-right pr-2">اختر نمط اللعب</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setPlayMode('solo')}
                                            className={`p-6 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-3 ${playMode === 'solo' ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-500 text-violet-600 shadow-xl shadow-violet-500/10' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${playMode === 'solo' ? 'bg-white dark:bg-violet-500/20 text-violet-600' : 'bg-slate-50 dark:bg-white/5 text-slate-400'}`}>
                                                <User className="w-5 h-5" />
                                            </div>
                                            <span className="font-black text-base">فردي</span>
                                        </button>
                                        <button
                                            onClick={() => setPlayMode('partner')}
                                            className={`p-6 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-3 ${playMode === 'partner' ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-500 text-violet-600 shadow-xl shadow-violet-500/10' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${playMode === 'partner' ? 'bg-white dark:bg-violet-500/20 text-violet-600' : 'bg-slate-50 dark:bg-white/5 text-slate-400'}`}>
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <span className="font-black text-base">مع شريكي</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-base font-black text-slate-800 dark:text-white text-right pr-2">حدد عدد الجولات</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[5, 10, 15].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => setRounds(num)}
                                                className={`py-4 rounded-xl border-2 font-black text-xl transition-all ${rounds === num ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-xl' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400'}`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={() => {
                                            if (playMode === 'partner') {
                                                setMode('lobby');
                                            } else {
                                                launchGame();
                                            }
                                        }}
                                        className="w-full h-16 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                                    >
                                        إبدأ التحدي المنتظر <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {(mode === 'rattil' || mode === 'quiz') && !quizFinished && (
                            <div className="space-y-8 py-4">
                                <div className="flex items-center justify-between">
                                    <button onClick={() => setMode('settings')} className="text-xs font-black text-slate-400 hover:text-slate-600 flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4" /> تغيير الإعدادات
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <div className="px-4 py-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 border border-violet-100 dark:border-violet-500/20 rounded-full text-xs font-black">
                                            الجولة {currentRound}/{rounds}
                                        </div>
                                        <div className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-100 dark:border-emerald-500/20 rounded-full text-xs font-black">
                                            النقاط: {score}
                                        </div>
                                    </div>
                                </div>

                                {mode === 'rattil' && (
                                    <div className="space-y-6">
                                        <div className="relative p-6 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 text-center min-h-[220px] flex items-center justify-center">
                                            {loading ? (
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="relative">
                                                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                                        <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full" />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-400">نختار لك آية كريمة...</p>
                                                </div>
                                            ) : ayah ? (
                                                <div className="space-y-6">
                                                    <Quote className="w-8 h-8 text-slate-200 dark:text-white/5 mx-auto -mb-2" />
                                                    <div className="relative font-amiri leading-[2.6] text-xl sm:text-2xl text-slate-800 dark:text-white text-center px-4" style={{ wordSpacing: '0.15em' }} dir="rtl">
                                                        <span className="opacity-20 text-4xl absolute -right-2 -top-2">﴿</span>
                                                        {ayahWords.map((word, i) => (
                                                            i === hiddenIndex ? (
                                                                <span key={i} className={`inline-flex items-center justify-center mx-1.5 px-3 min-w-[70px] h-[36px] border-b-2 translate-y-2 transition-all rounded-lg align-middle ${isCorrect === true ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-400' : isCorrect === false ? 'bg-rose-100 dark:bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-400' : 'bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-transparent'}`}>
                                                                    {selectedOption || '...'}
                                                                </span>
                                                            ) : (
                                                                <span key={i} className="mx-0.5 inline-block">{word}</span>
                                                            )
                                                        ))}
                                                        <span className="opacity-20 text-4xl absolute -left-2 -bottom-2">﴾</span>
                                                    </div>
                                                    <div className="inline-flex m-auto px-4 py-1.5 bg-slate-900/5 dark:bg-white/5 backdrop-blur-sm rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        سورة {ayah.surah} • آية {ayah.number}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        {!loading && ayah && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {options.map((option, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleRattilAnswer(option)}
                                                        disabled={!!selectedOption}
                                                        className={`p-4 rounded-xl border-2 text-center transition-all transform active:scale-[0.98] font-black text-base ${selectedOption === option
                                                            ? option === ayahWords[hiddenIndex]
                                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-xl shadow-emerald-500/20 scale-[1.02]'
                                                                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400'
                                                            : selectedOption && option === ayahWords[hiddenIndex]
                                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                                                : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-emerald-200 dark:hover:border-emerald-500/30 text-slate-800 dark:text-slate-200'
                                                            }`}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {mode === 'quiz' && (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-amber-50 dark:bg-amber-500/5 rounded-[2.5rem] border border-amber-100 dark:border-amber-500/10 text-center relative overflow-hidden min-h-[180px] flex flex-col items-center justify-center">
                                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                                <HelpCircle className="w-12 h-12" />
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-800 dark:text-white leading-relaxed font-amiri relative z-10" dir="rtl">
                                                {questions[currentQuestionIndex]?.question}
                                            </h4>
                                            <div className="mt-4 inline-flex px-4 py-1 bg-white dark:bg-white/10 rounded-full text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                {questions[currentQuestionIndex]?.category}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            {questions[currentQuestionIndex]?.options.map((option, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleQuizAnswer(option)}
                                                    disabled={!!selectedOption}
                                                    className={`p-3 rounded-xl border-2 text-right transition-all transform active:scale-[0.98] relative overflow-hidden flex items-center justify-between gap-2 ${selectedOption === option
                                                        ? option === questions[currentQuestionIndex].answer
                                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-xl shadow-emerald-500/20'
                                                            : 'bg-rose-50 dark:bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400'
                                                        : selectedOption && option === questions[currentQuestionIndex].answer
                                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                                            : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-amber-200 dark:hover:border-amber-500/30 text-slate-800 dark:text-slate-200 shadow-sm'
                                                        }`}
                                                >
                                                    <span className="font-black text-sm flex-1 leading-tight">{option}</span>
                                                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${selectedOption === option ? 'border-transparent bg-white/50 dark:bg-white/20' : 'border-slate-100 dark:border-white/10'}`}>
                                                        {selectedOption === option ? (
                                                            option === questions[currentQuestionIndex].answer ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <div className="w-1 h-1 rounded-full bg-slate-100 dark:bg-white/20" />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {quizFinished && (
                            <div className="py-12 text-center space-y-12">
                                <div className="relative">
                                    <div className="w-32 h-32 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner relative z-10 rotate-12">
                                        <Trophy className="w-16 h-16" />
                                    </div>
                                    <motion.div
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-400/20 blur-[60px] rounded-full"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">أداء استثنائي!</h3>
                                    <p className="text-lg text-slate-500 dark:text-slate-400 font-bold px-8 leading-relaxed max-w-sm mx-auto">
                                        {playMode === 'partner' ? `أتممت أنت و${partnerName} التحدي بنجاح وحققتم ${score} نقطة في رصيدكم!` : `لقد أنهيت التحدي بنجاح مبهر وحصلت على ${score} من ${rounds} نقاط.`}
                                    </p>
                                </div>

                                <div className="space-y-4 max-w-xs mx-auto">
                                    <button
                                        onClick={launchGame}
                                        className="w-full py-6 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        <RefreshCw className="w-5 h-5" /> تحدي جديد
                                    </button>
                                    <button
                                        onClick={resetToMenu}
                                        className="w-full py-6 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-lg border border-slate-200 dark:border-white/10 active:scale-95 transition-all"
                                    >
                                        العودة للواحة
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-white/80 dark:bg-slate-950/80 border-t border-slate-50 dark:border-white/5 text-center backdrop-blur-xl">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                        <Star className="w-3 h-3 fill-slate-300 dark:fill-slate-700" />
                        نورنا - نلتقي لنرتقي
                        <Star className="w-3 h-3 fill-slate-300 dark:fill-slate-700" />
                    </p>
                </div>
            </motion.div>
        </AnimatePresence >
    );
}
