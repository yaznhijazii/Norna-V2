import { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
    id: string;
    from_user_id: string;
    to_user_id: string;
    message_text: string;
    created_at: string;
    is_read: boolean;
}

interface DirectChatProps {
    isOpen: boolean;
    onClose: () => void;
    onOpen?: () => void;
    currentUserId: string;
    partnerId: string;
    partnerName: string;
    messages: Message[];
    onSendMessage: (text: string) => Promise<void>;
    isSending: boolean;
}

export function DirectChat({
    isOpen,
    onClose,
    onOpen,
    currentUserId,
    partnerId,
    partnerName,
    messages,
    onSendMessage,
    isSending
}: DirectChatProps) {
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            // Mark messages as read when chat opens
            if (onOpen) {
                onOpen();
            }
        }
    }, [messages, isOpen, onOpen]);

    const handleSend = async () => {
        if (!messageText.trim() || isSending) return;

        const textToSend = messageText.trim();
        setMessageText(''); // Clear input immediately for better UX

        try {
            await onSendMessage(textToSend);
        } catch (error) {
            // If send fails, restore the message
            setMessageText(textToSend);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col border border-slate-200 dark:border-white/10"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
                        <div>
                            <h2 className="text-base font-black text-slate-800 dark:text-white">{partnerName}</h2>
                            <p className="text-[10px] text-slate-400 font-bold">محادثة مباشرة</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center mb-3">
                                    <Send className="w-7 h-7 text-indigo-500" />
                                </div>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    ابدأ المحادثة
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                    أرسل أول رسالة لـ {partnerName}
                                </p>
                            </div>
                        ) : (
                            <>
                                {messages.map((message) => {
                                    const isSent = message.from_user_id === currentUserId;
                                    return (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[75%] rounded-2xl px-4 py-2 ${isSent
                                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-bl-sm'
                                                    }`}
                                            >
                                                <p className="text-sm font-medium leading-relaxed break-words">
                                                    {message.message_text}
                                                </p>
                                                <p
                                                    className={`text-[9px] mt-1 font-bold ${isSent ? 'text-white/70' : 'text-slate-400'
                                                        }`}
                                                >
                                                    {formatTime(message.created_at)}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-200 dark:border-white/10">
                        <div className="flex items-end gap-2">
                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={`اكتب رسالة لـ ${partnerName}...`}
                                className="flex-1 resize-none rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none transition-colors max-h-24 text-slate-800 dark:text-white placeholder:text-slate-400"
                                rows={1}
                                style={{
                                    height: 'auto',
                                    minHeight: '42px',
                                    maxHeight: '96px',
                                }}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = target.scrollHeight + 'px';
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!messageText.trim() || isSending}
                                className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${!messageText.trim() || isSending
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-105 active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20'
                                    }`}
                            >
                                {isSending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 text-center font-bold">
                            اضغط Enter للإرسال
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
