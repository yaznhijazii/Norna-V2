import { useState } from 'react';
import { Heart, MessageCircle, Sparkles, Gift as GiftIcon, Clock, ChevronDown, ChevronUp, BookHeart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Interaction {
    id: string;
    from_user_id?: string;
    user_id?: string;
    to_user_id?: string;
    gift_type: string;
    message_text?: string;
    content?: string;
    created_at: string;
    reaction?: string;
    is_highlight?: boolean;
}

interface InteractionsDashboardProps {
    interactions: Interaction[];
    currentUserId: string;
    partnerId: string;
    partnerName: string;
}

export function InteractionsDashboard({ interactions, currentUserId, partnerName }: InteractionsDashboardProps) {
    const [showAll, setShowAll] = useState(false);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const diffMins = Math.floor((new Date().getTime() - date.getTime()) / 60000);
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `${diffMins}د`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}سا`;
        return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    };

    const getGiftIcon = (type: string) => {
        switch (type) {
            case 'heart': return <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />;
            case 'rose': return <span className="text-sm">🌹</span>;
            case 'message': return <MessageCircle className="w-4 h-4 text-indigo-500" />;
            case 'dua': return <span className="text-sm">🤲</span>;
            case 'poke': return <Sparkles className="w-4 h-4 text-amber-500" />;
            default: return <GiftIcon className="w-4 h-4 text-slate-400" />;
        }
    };

    const displayedInteractions = showAll ? interactions : interactions.slice(0, 4);

    return (
        <div className="space-y-2">
            {interactions.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden">
                    <div className="divide-y divide-slate-50 dark:divide-white/5">
                        {displayedInteractions.map((interaction) => {
                            const senderId = interaction.from_user_id || interaction.user_id;
                            const isSent = senderId === currentUserId;

                            return (
                                <div key={interaction.id} className="flex items-start gap-4 p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0 mt-0.5">
                                        {getGiftIcon(interaction.gift_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                {isSent ? 'هدية منك' : `هدية من ${partnerName}`}
                                            </span>
                                            <span className="text-[10px] font-medium text-slate-300">
                                                {formatTime(interaction.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                                            {interaction.message_text || 'أرسل تفاعلاً جديداً'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {interactions.length > 4 && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="w-full py-4 text-[10px] font-bold text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest border-t border-slate-50 dark:border-white/5 flex items-center justify-center gap-2"
                        >
                            {showAll ? 'طي السجل' : `مشاهدة الكل (${interactions.length})`}
                            {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                    )}
                </div>
            ) : (
                <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/5">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                        <GiftIcon className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">سجل الهدايا فارغ حتى الآن</p>
                </div>
            )}
        </div>
    );
}
