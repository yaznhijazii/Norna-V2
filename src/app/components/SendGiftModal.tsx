import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, MessageCircle, Send, Flower2, Sparkles, Star, ArrowRight, Quote } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface SendGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  partnerId: string;
  partnerName: string;
  onGiftSent?: (gift: any) => void;
}

type GiftType = 'rose' | 'heart' | 'message';

export function SendGiftModal({ isOpen, onClose, currentUserId, partnerId, partnerName, onGiftSent }: SendGiftModalProps) {
  const [selectedType, setSelectedType] = useState<GiftType | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!selectedType) return;
    if (selectedType === 'message' && !messageText.trim()) return;

    if (!partnerId || partnerId === '') {
      alert('❌ لا يوجد شريك مرتبط!');
      return;
    }

    setIsSending(true);
    try {
      const giftData = {
        from_user_id: currentUserId,
        to_user_id: partnerId,
        gift_type: selectedType,
        message_text: selectedType === 'message' ? messageText.trim() : null,
        is_read: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('gifts')
        .insert(giftData)
        .select()
        .single();

      if (error) throw error;

      if (onGiftSent && data) {
        onGiftSent(data);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setSelectedType(null);
        setMessageText('');
      }, 2500);
    } catch (error: any) {
      console.error('Error sending gift:', error);
    } finally {
      setIsSending(false);
    }
  };

  const giftOptions = [
    {
      type: 'rose' as GiftType,
      icon: <Flower2 className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />,
      label: 'وردة تقدير',
      desc: 'جمالٌ لا يذبل يعبّر عن مقامك',
      theme: 'from-emerald-500/10 to-teal-500/5',
      accent: 'bg-emerald-500',
      border: 'border-emerald-500/20'
    },
    {
      type: 'heart' as GiftType,
      icon: <Heart className="w-8 h-8 text-rose-500" fill="currentColor" strokeWidth={1.5} />,
      label: 'نبض مودة',
      desc: 'رسالة ودّ خفية تصل للروح مباشرة',
      theme: 'from-rose-500/10 to-pink-500/5',
      accent: 'bg-rose-500',
      border: 'border-rose-500/20'
    },
    {
      type: 'message' as GiftType,
      icon: <MessageCircle className="w-8 h-8 text-indigo-500" strokeWidth={1.5} />,
      label: 'همس الروح',
      desc: 'كلمات تُكتب بصدق لتخلد في الأثر',
      theme: 'from-indigo-500/10 to-blue-500/5',
      accent: 'bg-indigo-500',
      border: 'border-indigo-500/20'
    },
  ];

  const selectedOption = giftOptions.find(opt => opt.type === selectedType);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 font-sans" style={{ direction: 'rtl' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-sm bg-white dark:bg-[#0B0F17] rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {showSuccess ? (
            <div className="p-12 flex flex-col items-center text-center overflow-hidden relative">
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-10 relative"
              >
                <div className={`absolute inset-[-20px] ${selectedOption?.theme} blur-3xl rounded-full`} />
                <div className="relative w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl flex items-center justify-center rotate-6 border border-white/20">
                  {selectedOption?.icon}
                </div>
              </motion.div>

              <div className="relative z-10 space-y-3">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">قُبِـلَ الأثـر</h3>
                <p className="text-slate-400 font-bold text-xs leading-relaxed">هدية {selectedOption?.label} بدأت الآن رحلتها نحو قلب {partnerName}</p>
              </div>

              {/* Celebration Sparks */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: '50%', y: '50%', scale: 0 }}
                    animate={{
                      x: `${50 + (Math.random() - 0.5) * 200}%`,
                      y: `${50 + (Math.random() - 0.5) * 200}%`,
                      scale: Math.random() * 1.5,
                      opacity: [1, 0]
                    }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className={`absolute w-1.5 h-1.5 ${selectedOption?.accent} rounded-full`}
                  />
                ))}
              </div>
            </div>
          ) : !selectedType ? (
            <div className="p-8">
              <div className="flex items-center justify-between mb-10">
                <button
                  onClick={onClose}
                  className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">إرسال هدية</h2>
                  <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">مُهداة إلى {partnerName}</p>
                </div>
                <div className="w-12" />
              </div>

              <div className="space-y-4">
                {giftOptions.map((option, idx) => (
                  <motion.button
                    key={option.type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => setSelectedType(option.type)}
                    className={`w-full group p-5 rounded-[2.2rem] border ${option.border} bg-white dark:bg-slate-900 hover:bg-gradient-to-l ${option.theme} transition-all duration-500 flex items-center justify-between text-right`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white dark:bg-white/5 rounded-[1.4rem] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-slate-50 dark:border-white/5">
                        {option.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">{option.label}</h3>
                        <p className="text-[10px] font-bold text-slate-400 leading-none">{option.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-200 dark:text-slate-800 -rotate-180 group-hover:text-indigo-500 transform group-hover:-translate-x-1 transition-all" />
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-10">
              <div className="flex items-center justify-between mb-12">
                <button
                  onClick={() => setSelectedType(null)}
                  className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">تجهيز الهدية</h3>
                <div className="w-12" />
              </div>

              <div className="flex flex-col items-center gap-8 mb-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  <div className={`absolute inset-[-15px] ${selectedOption?.theme} blur-2xl rounded-full`} />
                  <div className="relative w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-xl border border-white/10">
                    {selectedOption?.icon}
                  </div>
                </motion.div>

                {selectedType === 'message' ? (
                  <div className="w-full relative">
                    <Quote className="absolute -right-2 -top-2 w-8 h-8 text-indigo-500/10 transform rotate-180" />
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={`أهـمس لـ ${partnerName} بصدق...`}
                      className="w-full h-40 p-6 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-[#0F172A] transition-all text-sm font-bold resize-none outline-none text-right custom-scrollbar"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="text-center px-6">
                    <p className="text-[13px] font-black text-slate-400 leading-relaxed uppercase tracking-widest mb-1">تأكـيـد الإرسـال</p>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">إرسال {selectedOption?.label} الآن؟</h4>
                  </div>
                )}
              </div>

              <button
                onClick={handleSend}
                disabled={isSending || (selectedType === 'message' && !messageText.trim())}
                className={`w-full h-16 rounded-[1.8rem] font-black text-white text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${isSending || (selectedType === 'message' && !messageText.trim())
                  ? 'bg-slate-100 dark:bg-white/5 text-slate-400'
                  : 'bg-slate-950 dark:bg-indigo-600 hover:brightness-110 active:scale-95'
                  }`}
              >
                {isSending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Star className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    إرسال الأثـر
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
