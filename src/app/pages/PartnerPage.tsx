import { useState, useEffect } from 'react';
import { DailyPartnerStats } from '../components/DailyPartnerStats';
import { ChallengesCard, UserChallengeData } from '../components/ChallengesCard';
import { DirectChat } from '../components/DirectChat';
import { InteractionsDashboard } from '../components/InteractionsDashboard';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Send, Sparkles, MessageCircle, Gift, ArrowLeft, MoreVertical, Flame, Target, Share2, Trophy, Loader2, Check, Clock, BookHeart, User, ShieldCheck, ChevronRight, Gamepad2, Sun, Moon, LogOut } from 'lucide-react';
import { SendGiftModal } from '../components/SendGiftModal';
import { GamesModal } from '../components/GamesModal';
import { AtharnaPage } from '../pages/AtharnaPage';
import { supabase } from '../utils/supabase';

interface PartnerPageProps {
    currentUserId: string;
    partnerId: string;
    partnerName: string;
    activeChallenges: UserChallengeData[];
    onChallengesClick: () => void;
    onDuaaClick: () => void;
    onBack?: () => void;
    themeMode?: 'auto' | 'light' | 'dark';
    onThemeToggle?: () => void;
    onLogout?: () => void;
}

export function PartnerPage({
    currentUserId,
    partnerId,
    partnerName,
    activeChallenges,
    onChallengesClick,
    onDuaaClick,
    onBack,
    themeMode = 'auto',
    onThemeToggle,
    onLogout
}: PartnerPageProps) {
    const [showSendGift, setShowSendGift] = useState(false);
    const [showDirectChat, setShowDirectChat] = useState(false);
    const [showAtharnaPage, setShowAtharnaPage] = useState(false);
    const [showGamesModal, setShowGamesModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [partnerDetailedData, setPartnerDetailedData] = useState<any>(null);
    const [interactions, setInteractions] = useState<any[]>([]);
    const [directMessages, setDirectMessages] = useState<any[]>([]);
    const [isSendingChat, setIsSendingChat] = useState(false);
    const [scrollOpacity, setScrollOpacity] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const opacity = Math.min(window.scrollY / 50, 1);
            setScrollOpacity(opacity);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (partnerId) {
            // OPTIMIZED: Fire all essential requests in parallel to avoid "Waterfall" delay
            Promise.all([
                fetchPartnerDetails(),
                fetchInteractions(),
                fetchDirectMessages()
            ]);

            const giftsChannel = supabase
                .channel(`partner-gifts-${currentUserId}-${partnerId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gifts', filter: `to_user_id=eq.${currentUserId}` },
                    (payload) => {
                        if (payload.new.from_user_id === partnerId) {
                            setInteractions(prev => [payload.new, ...prev.slice(0, 19)]);
                        }
                    }
                )
                .subscribe();

            const messagesChannel = supabase
                .channel(`partner-messages-${currentUserId}-${partnerId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `to_user_id=eq.${currentUserId}` },
                    (payload) => {
                        if (payload.new.from_user_id === partnerId) {
                            setDirectMessages(prev => [...prev, payload.new]);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(giftsChannel);
                supabase.removeChannel(messagesChannel);
            };
        }
    }, [partnerId]);

    const fetchPartnerDetails = async () => {
        try {
            const { data, error } = await supabase.from('users')
                .select('streak_count, last_login, avatar_url, username, xp, level')
                .eq('id', partnerId)
                .single();

            if (error) throw error;
            if (data) {
                setPartnerDetailedData({
                    ...data,
                    xp: data.xp || 0,
                    level: data.level || 1
                });
            }
        } catch (error) {
            console.error('Error fetching partner details:', error);
        }
    };

    const fetchInteractions = async () => {
        try {
            // Optimized query with limit
            const { data, error } = await supabase
                .from('gifts')
                .select('id, from_user_id, to_user_id, gift_type, message_text, created_at')
                .or(`and(from_user_id.eq.${currentUserId},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${currentUserId})`)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setInteractions(data || []);
        } catch (error) {
            console.error('Error fetching gifts history:', error);
        }
    };

    const fetchDirectMessages = async () => {
        try {
            // Optimized query with specific columns
            const { data } = await supabase
                .from('direct_messages')
                .select('id, from_user_id, to_user_id, message_text, is_read, created_at')
                .or(`and(from_user_id.eq.${currentUserId},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${currentUserId})`)
                .order('created_at', { ascending: true })
                .limit(50);

            if (data) setDirectMessages(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isSendingChat) return;
        setIsSendingChat(true);
        try {
            const { data } = await supabase.from('direct_messages').insert({ from_user_id: currentUserId, to_user_id: partnerId, message_text: text.trim(), is_read: false }).select().single();
            if (data) setDirectMessages(prev => [...prev, data]);
        } catch (error) { console.error(error); } finally { setIsSendingChat(false); }
    };

    const markMessagesAsRead = async () => {
        const unreadIds = directMessages.filter(m => m.from_user_id === partnerId && !m.is_read).map(m => m.id);
        if (unreadIds.length === 0) return;
        try {
            await supabase.from('direct_messages').update({ is_read: true }).in('id', unreadIds);
            setDirectMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, is_read: true } : m));
        } catch (error) { console.error(error); }
    };

    const formatLastSeen = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const diffMins = Math.floor((new Date().getTime() - date.getTime()) / 60000);
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `${diffMins}د`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}س`;
        return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    };

    const isOnline = (dateString: string) => {
        if (!dateString) return false;
        return (new Date().getTime() - new Date(dateString).getTime()) < 5 * 60 * 1000;
    };

    const unreadCount = directMessages.filter(m => m.to_user_id === currentUserId && !m.is_read).length;

    return (
        <div className="min-h-screen pb-32 bg-[#FDFDFF] dark:bg-slate-950 transition-colors duration-700 overflow-hidden relative">
            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent blur-[60px] rounded-full"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [90, 0, 90],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -left-[10%] w-[800px] h-[800px] bg-gradient-to-tr from-orange-500/5 via-transparent to-transparent blur-[60px] rounded-full"
                />
            </div>

            {/* Ultra-Clean Sticky Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: scrollOpacity > 0.5 ? 0 : -20, opacity: scrollOpacity }}
                className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#0B0F17]/80 backdrop-blur-xl z-[100] border-b border-slate-100 dark:border-white/5 flex items-center px-4"
            >
                <div className="flex items-center gap-3 w-full max-w-lg mx-auto">
                    <button onClick={onBack} className="p-2 -mr-2"><ArrowLeft className="w-5 h-5 dark:text-white" /></button>
                    <div className="flex items-center gap-2 flex-1 justify-center -ml-8">
                        <div className="w-8 h-8 rounded-xl overflow-hidden ring-2 ring-slate-100 dark:ring-white/10">
                            {partnerDetailedData?.avatar_url ? <img src={partnerDetailedData.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 bg-slate-50 text-slate-400" />}
                        </div>
                        <span className="font-extrabold text-sm dark:text-white">{partnerName}</span>
                    </div>
                </div>
            </motion.div>

            {/* Seamless Profile Section */}
            <div className="relative pt-6 px-4 z-10">
                <header className="flex items-center justify-between mb-8 max-w-lg mx-auto relative">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/5 active:scale-90 transition-all">
                        <ArrowLeft className="w-5 h-5 dark:text-white" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/5 active:scale-90 transition-all"
                        >
                            <MoreVertical className="w-5 h-5 dark:text-white" />
                        </button>

                        <AnimatePresence>
                            {showMenu && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setShowMenu(false)}
                                        className="fixed inset-0 z-[140]"
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute top-12 left-0 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/5 z-[150] overflow-hidden"
                                    >
                                        <div className="p-2 space-y-1">
                                            <button
                                                onClick={() => { onThemeToggle?.(); setShowMenu(false); }}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group text-right"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {themeMode === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> :
                                                        themeMode === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> :
                                                            <Sparkles className="w-4 h-4 text-purple-400" />}
                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">المظهر</span>
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase">
                                                    {themeMode === 'light' ? 'نهاري' : themeMode === 'dark' ? 'ليلي' : 'تلقائي'}
                                                </span>
                                            </button>

                                            <div className="h-px bg-slate-100 dark:bg-white/5 mx-2" />

                                            <button
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    setShowLogoutConfirm(true);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors group text-right"
                                            >
                                                <LogOut className="w-4 h-4 text-rose-500" />
                                                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">تسجيل الخروج</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                <div className="flex flex-col items-center">
                    <div className="relative mb-8 cursor-default group">
                        {/* Presence Glow Effect */}
                        {isOnline(partnerDetailedData?.last_login) && (
                            <>
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute inset-[-15px] rounded-full bg-emerald-500/20 blur-2xl z-0"
                                />
                                <div className="absolute inset-[-8px] rounded-full bg-emerald-500/10 z-0 border border-emerald-500/20" />
                            </>
                        )}

                        <div className="absolute inset-[-6px] rounded-[3rem] bg-slate-900 shadow-2xl z-0 ring-1 ring-white/10" />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowDirectChat(true)}
                            className="w-32 h-32 rounded-[2.8rem] overflow-hidden ring-[6px] ring-white dark:ring-slate-800 shadow-inner relative z-10 cursor-pointer"
                        >
                            {partnerDetailedData?.avatar_url ? (
                                <img
                                    src={partnerDetailedData.avatar_url}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    alt={partnerName}
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <User className="w-12 h-12 text-slate-300" />
                                </div>
                            )}

                            {/* Unread Chat Peek */}
                            {unreadCount > 0 && (
                                <div className="absolute inset-0 bg-indigo-600/60 backdrop-blur-sm flex items-center justify-center z-20">
                                    <MessageCircle className="w-10 h-10 text-white animate-bounce" />
                                </div>
                            )}
                        </motion.div>

                        {/* Luxury Status dot */}
                        <div className={`absolute bottom-1 right-1 w-7 h-7 rounded-full border-[5px] border-slate-900 z-30 shadow-lg ${isOnline(partnerDetailedData?.last_login) ? 'bg-emerald-500' : 'bg-slate-400'}`} />

                        {/* Static Decorative Hearts Frame */}
                        <div className="absolute inset-[-35px] pointer-events-none z-0">
                            {[
                                { top: '5%', left: '80%', rotate: '15deg' },
                                { top: '85%', left: '15%', rotate: '-20deg' },
                                { top: '40%', left: '-5%', rotate: '-10deg' }
                            ].map((pos, i) => (
                                <div
                                    key={i}
                                    className="absolute p-1.5 bg-white dark:bg-slate-900 rounded-full shadow-md border border-pink-100 dark:border-pink-500/20"
                                    style={{
                                        top: pos.top,
                                        left: pos.left,
                                        transform: `rotate(${pos.rotate})`
                                    }}
                                >
                                    <Heart className="w-2.5 h-2.5 text-pink-400/80" fill="currentColor" />
                                </div>
                            ))}
                        </div>

                        {/* Luxury Orbit Ring */}
                        <div className="absolute inset-[-25px] rounded-full pointer-events-none border border-indigo-500/5 dark:border-white/5 opacity-40 animate-spin-slow" />
                    </div>

                    <div className="text-center space-y-1 mb-8">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">
                            {partnerName}
                        </h1>
                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em]">
                            @{partnerDetailedData?.username || 'NORONA'}
                        </p>
                    </div>

                    {/* Highly Refined Status Badge */}
                    <div className="flex flex-col items-center gap-2 mb-12">
                        {isOnline(partnerDetailedData?.last_login) ? (
                            <div className="bg-white dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 shadow-sm border border-emerald-500/10 backdrop-blur-md">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                متواجد حالياً
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-white/5 px-5 py-2 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 dark:border-white/5">
                                {formatLastSeen(partnerDetailedData?.last_login) ? `متاح منذ ${formatLastSeen(partnerDetailedData.last_login)}` : 'غير نشط'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Compact Premium Action Bar */}
                <div className="max-w-md mx-auto mb-16 px-6">
                    <div className="grid grid-cols-5 gap-4">
                        {[
                            { id: 'atharna', icon: <BookHeart className="w-5 h-5" />, label: 'أرشيفنا', color: 'bg-[#451A03]', action: () => setShowAtharnaPage(true) },
                            { id: 'challenges', icon: <Trophy className="w-5 h-5" />, label: 'تحديات', color: 'bg-emerald-500', action: onChallengesClick },
                            { id: 'dua', icon: <Heart className="w-5 h-5" />, label: 'دعاء', color: 'bg-red-500', action: onDuaaClick },
                            { id: 'games', icon: <Gamepad2 className="w-5 h-5" />, label: 'ألعاب', color: 'bg-purple-600', action: () => setShowGamesModal(true) },
                            { id: 'gift', icon: <Gift className="w-5 h-5" />, label: 'إهداء', color: 'bg-pink-500', action: () => setShowSendGift(true) },
                        ].map((item) => (
                            <motion.button
                                key={item.id}
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ y: -3 }}
                                onClick={item.action}
                                className="flex flex-col items-center gap-2 relative"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${item.color} text-white flex items-center justify-center shadow-lg relative overflow-hidden group/btn`}>
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter whitespace-nowrap">{item.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Premium Stats Grid */}
                <div className="max-w-xl mx-auto mb-16 px-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Streak Card */}
                        <motion.div
                            whileHover={{ y: -3 }}
                            className="bg-[#0B0F17] dark:bg-slate-900 rounded-[2rem] p-5 relative overflow-hidden group shadow-xl"
                        >
                            <div className="absolute -top-6 -right-6 text-orange-500/5 group-hover:text-orange-500/10 transition-all duration-1000">
                                <Flame className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الارتباط الروحي</span>
                                    <Flame className="w-4 h-4 text-orange-500" />
                                </div>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-5xl font-black text-white tracking-tighter">{partnerDetailedData?.streak_count || 1}</span>
                                    <span className="text-xs font-black text-orange-500 uppercase">يوم</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black text-slate-600">
                                        <span>تقدم مميز</span>
                                        <span>85%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "85%" }}
                                            className="h-full bg-gradient-to-r from-orange-600 to-amber-400 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* XP Card */}
                        <motion.div
                            whileHover={{ y: -3 }}
                            className="bg-gradient-to-br from-[#4F46E5] to-[#3730A3] rounded-[2rem] p-5 relative overflow-hidden group shadow-xl"
                        >
                            <div className="absolute -top-6 -right-6 text-white/5 group-hover:text-white/10 transition-all duration-1000">
                                <Sparkles className="w-32 h-32" />
                            </div>
                            <div className="relative z-10 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">مستوى التأثير</span>
                                    <Trophy className="w-4 h-4 text-indigo-200" />
                                </div>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-5xl font-black tracking-tighter">{partnerDetailedData?.xp || 0}</span>
                                    <span className="text-xs font-black text-indigo-200 uppercase">XP</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-xl px-4 py-3 rounded-xl text-xs font-black flex items-center justify-between border border-white/20">
                                    <span>المستوى الحالي</span>
                                    <span className="bg-white text-indigo-600 px-3 py-1 rounded-lg text-[10px]">{partnerDetailedData?.level || 1}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="max-w-xl mx-auto space-y-16">
                    <section>
                        <div className="flex items-center gap-3 mb-6 px-1">
                            <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">إنجازات اليوم</h3>
                        </div>
                        <DailyPartnerStats
                            currentUserId={currentUserId}
                            partnerId={partnerId}
                            partnerData={partnerDetailedData}
                        />
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-8 px-1">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                                <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">تحدياتنا</h3>
                            </div>
                            <button onClick={onChallengesClick} className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-all border border-slate-100 dark:border-white/10">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <ChallengesCard activeChallenges={activeChallenges} partnerId={partnerId} partnerName={partnerName} onChallengesClick={onChallengesClick} />
                    </section>
                </div>

                <div className="h-20" />
            </div>


            {/* Modals */}
            <AnimatePresence>
                {showSendGift && <SendGiftModal isOpen={showSendGift} onClose={() => setShowSendGift(false)} currentUserId={currentUserId} partnerId={partnerId} partnerName={partnerName} onGiftSent={(gift) => setInteractions(prev => [gift, ...prev.slice(0, 19)])} />}
                {showDirectChat && <DirectChat isOpen={showDirectChat} onClose={() => setShowDirectChat(false)} onOpen={markMessagesAsRead} currentUserId={currentUserId} partnerId={partnerId} partnerName={partnerName} messages={directMessages} onSendMessage={handleSendMessage} isSending={isSendingChat} />}
                {showAtharnaPage && <AtharnaPage interactions={interactions} currentUserId={currentUserId} partnerName={partnerName} onBack={() => setShowAtharnaPage(false)} />}
                {showGamesModal && <GamesModal isOpen={showGamesModal} onClose={() => setShowGamesModal(false)} partnerName={partnerName} />}

                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutConfirm(false)}
                            className="absolute inset-0"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-white/5"
                        >
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <LogOut className="w-10 h-10 text-rose-500" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">تسجيل الخروج</h3>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-8 leading-relaxed">
                                    هل أنت متأكد من رغبتك في تسجيل الخروج؟ سنفتقد تواجدك معنا.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => onLogout?.()}
                                        className="w-full h-14 bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                                    >
                                        تأكيد الخروج
                                    </button>
                                    <button
                                        onClick={() => setShowLogoutConfirm(false)}
                                        className="w-full h-14 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                                    >
                                        تراجع
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
