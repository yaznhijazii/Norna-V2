import { useState, useEffect } from 'react';
import { DailyPartnerStats } from '../components/DailyPartnerStats';
import { ChallengesCard, UserChallengeData } from '../components/ChallengesCard';
import { DirectChat } from '../components/DirectChat';
import { InteractionsDashboard } from '../components/InteractionsDashboard';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Send, Sparkles, MessageCircle, Gift, ArrowLeft, MoreVertical, Flame, Target, Share2, Trophy, Loader2, Check, Clock, BookHeart, User, ShieldCheck, ChevronRight } from 'lucide-react';
import { SendGiftModal } from '../components/SendGiftModal';
import { supabase } from '../utils/supabase';

interface PartnerPageProps {
    currentUserId: string;
    partnerId: string;
    partnerName: string;
    activeChallenges: UserChallengeData[];
    onChallengesClick: () => void;
    onDuaaClick: () => void;
    onBack?: () => void;
}

export function PartnerPage({
    currentUserId,
    partnerId,
    partnerName,
    activeChallenges,
    onChallengesClick,
    onDuaaClick,
    onBack
}: PartnerPageProps) {
    const [showSendGift, setShowSendGift] = useState(false);
    const [showDirectChat, setShowDirectChat] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
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
            fetchPartnerDetails();
            fetchInteractions();
            fetchDirectMessages();

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
            const { data } = await supabase.from('users').select('streak_count, last_login, avatar_url, username').eq('id', partnerId).single();
            if (data) setPartnerDetailedData(data);
        } catch (error) { console.error(error); }
    };

    const fetchInteractions = async () => {
        try {
            const [giftsRes, highlightsRes] = await Promise.all([
                supabase.from('gifts')
                    .select('*')
                    .or(`and(from_user_id.eq.${currentUserId},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${currentUserId})`)
                    .neq('gift_type', 'message')
                    .order('created_at', { ascending: false })
                    .limit(10),
                supabase.from('podcast_highlights')
                    .select('*')
                    .or(`user_id.eq.${currentUserId},user_id.eq.${partnerId}`)
                    .eq('is_shared', true)
                    .order('created_at', { ascending: false })
                    .limit(10)
            ]);

            const merged = [
                ...(giftsRes.data || []),
                ...(highlightsRes.data || []).map(h => ({ ...h, gift_type: 'highlight', is_highlight: true }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setInteractions(merged.slice(0, 15));
        } catch (error) { console.error(error); }
    };

    const fetchDirectMessages = async () => {
        try {
            const { data } = await supabase.from('direct_messages').select('*').or(`and(from_user_id.eq.${currentUserId},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${currentUserId})`).order('created_at', { ascending: true }).limit(50);
            if (data) setDirectMessages(data);
        } catch (error) { console.error(error); }
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
        if (diffMins < 60) return `منذ ${diffMins}د`;
        if (diffMins < 1440) return `منذ ${Math.floor(diffMins / 60)}س`;
        return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    };

    const isOnline = (dateString: string) => {
        if (!dateString) return false;
        return (new Date().getTime() - new Date(dateString).getTime()) < 5 * 60 * 1000;
    };

    const unreadCount = directMessages.filter(m => m.to_user_id === currentUserId && !m.is_read).length;

    return (
        <div className="min-h-screen pb-32 bg-[#FDFDFF] dark:bg-slate-950 transition-colors duration-700">
            {/* Ultra-Clean Sticky Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: scrollOpacity > 0.5 ? 0 : -20, opacity: scrollOpacity }}
                className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-[100] border-b border-slate-100 dark:border-white/5 flex items-center px-4"
            >
                <div className="flex items-center gap-3 w-full">
                    <button onClick={onBack} className="p-2 -mr-2"><ArrowLeft className="w-5 h-5 dark:text-white" /></button>
                    <div className="flex items-center gap-2 flex-1 justify-center -ml-8">
                        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-slate-100 dark:ring-white/10">
                            {partnerDetailedData?.avatar_url ? <img src={partnerDetailedData.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 bg-slate-50 text-slate-400" />}
                        </div>
                        <span className="font-bold text-sm dark:text-white">{partnerName}</span>
                    </div>
                </div>
            </motion.div>

            {/* Seamless Profile Section */}
            <div className="relative pt-6 px-4">
                <header className="flex items-center justify-between mb-8">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform"><ArrowLeft className="w-6 h-6 dark:text-white" /></button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform"><MoreVertical className="w-5 h-5 dark:text-white opacity-40" /></button>
                </header>

                <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 rounded-full overflow-hidden ring-[6px] ring-white dark:ring-slate-900 shadow-2xl relative z-10">
                            {partnerDetailedData?.avatar_url ? <img src={partnerDetailedData.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center"><User className="w-10 h-10 text-slate-200" /></div>}
                        </motion.div>
                        <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] border-white dark:border-slate-950 z-20 shadow-sm ${isOnline(partnerDetailedData?.last_login) ? 'bg-emerald-500' : 'bg-slate-300'}`} />

                        {/* Soft Aura Effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl rounded-full" />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5">{partnerName}</h1>

                    {/* Status Text Under Name */}
                    <div className="flex flex-col items-center gap-1 mb-8">
                        {isOnline(partnerDetailedData?.last_login) ? (
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">متصل الآن</span>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">آخر ظهور</span>
                                <span className="text-[10px] font-medium text-slate-400">{formatLastSeen(partnerDetailedData?.last_login)}</span>
                            </div>
                        )}
                        <p className="text-[9px] font-medium text-slate-300 dark:text-slate-600 tracking-widest uppercase">@{partnerDetailedData?.username || 'partner'}</p>
                    </div>
                </div>

                {/* Integrated Action Bar - Sleek & Floating */}
                <div className="max-w-md mx-auto mb-10">
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: 'chat', icon: <MessageCircle className="w-5 h-5" />, label: 'دردشة', color: 'bg-indigo-500', shadow: 'shadow-indigo-500/20', action: () => setShowDirectChat(true), badge: unreadCount },
                            { id: 'gift', icon: <Gift className="w-5 h-5" />, label: 'هدية', color: 'bg-rose-500', shadow: 'shadow-rose-500/20', action: () => setShowSendGift(true) },
                            { id: 'journal', icon: <BookHeart className="w-5 h-5" />, label: 'أدعية', color: 'bg-pink-500', shadow: 'shadow-pink-500/20', action: onDuaaClick },
                            { id: 'challenges', icon: <Trophy className="w-5 h-5" />, label: 'تحدي', color: 'bg-amber-500', shadow: 'shadow-amber-500/20', action: onChallengesClick },
                        ].map((item) => (
                            <motion.button
                                key={item.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={item.action}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${item.color} text-white flex items-center justify-center shadow-lg ${item.shadow} group-hover:brightness-105 transition-all relative`}>
                                    {item.icon}
                                    {item.badge ? <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-rose-500 text-[10px] font-black rounded-full flex items-center justify-center shadow-sm border border-rose-100">{item.badge}</span> : null}
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-tighter">{item.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Clean Content Sections */}
                <div className="max-w-xl mx-auto space-y-12">
                    {/* Stats Section - Reduced Visual Noise */}
                    <section>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">إنجاز اليوم</h3>
                        </div>
                        <DailyPartnerStats currentUserId={currentUserId} partnerId={partnerId} />
                    </section>

                    {/* Unified Connection Status Card */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <Flame className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">سلسلة التواصل</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold dark:text-white">{partnerDetailedData?.streak_count || 0}</span>
                                    <span className="text-[10px] font-bold text-slate-400">يوم متواصل</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-10 w-[1px] bg-slate-100 dark:bg-white/5 hidden sm:block" />

                        <div className="text-left flex flex-col items-end">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold dark:text-white">
                                    {isOnline(partnerDetailedData?.last_login) ? 'نشط الآن' : 'غير متصل'}
                                </span>
                                <div className={`w-2 h-2 rounded-full ${isOnline(partnerDetailedData?.last_login) ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                {isOnline(partnerDetailedData?.last_login) ? 'متصل بالتطبيق ⚡' : 'آخر رؤية قريبة'}
                            </span>
                        </div>
                    </div>

                    {/* Interactions - More Flat & Spacious */}
                    <section>
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">تفاعلات قريبة</h3>
                        </div>
                        <InteractionsDashboard interactions={interactions} currentUserId={currentUserId} partnerId={partnerId} partnerName={partnerName} />
                    </section>

                    {/* Challenges - One Focused Card */}
                    <section>
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">تحديات مشتركة</h3>
                            <button onClick={onChallengesClick} className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 uppercase tracking-widest">المزيد <ChevronRight className="w-3 h-3" /></button>
                        </div>
                        <ChallengesCard activeChallenges={activeChallenges} partnerId={partnerId} partnerName={partnerName} onChallengesClick={onChallengesClick} />
                    </section>
                </div>

                {/* Discrete Footer Quote */}
                <footer className="mt-20 pb-20 text-center">
                    <p className="text-[11px] font-bold text-slate-300 dark:text-slate-700 leading-relaxed max-w-[200px] mx-auto">"المؤمن للمؤمن كالبنيان يشد بعضه بعضاً"</p>
                </footer>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showSendGift && <SendGiftModal isOpen={showSendGift} onClose={() => setShowSendGift(false)} currentUserId={currentUserId} partnerId={partnerId} partnerName={partnerName} onGiftSent={(gift) => setInteractions(prev => [gift, ...prev.slice(0, 19)])} />}
                {showDirectChat && <DirectChat isOpen={showDirectChat} onClose={() => setShowDirectChat(false)} onOpen={markMessagesAsRead} currentUserId={currentUserId} partnerId={partnerId} partnerName={partnerName} messages={directMessages} onSendMessage={handleSendMessage} isSending={isSendingChat} />}
            </AnimatePresence>
        </div>
    );
}
