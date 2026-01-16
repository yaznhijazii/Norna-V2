import { useState, useEffect } from 'react';
import { Sun, Moon, X, Loader2, Check, RotateCcw, Heart, Star, Sparkles, HandHeart, Plus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAthkarProgress, updateAthkarProgress } from '../utils/db';
import { useTimeOfDay } from '../hooks/useTimeOfDay';
import { fetchJordanHolidays, Holiday } from '../utils/holidays';

interface Zekr {
  zekr: string;
  repeat: number;
  bless: string;
}

type AthkarType = 'morning' | 'evening' | 'israa_miraj';

interface AthkarReaderProps {
  initialType?: AthkarType | null;
}

export function AthkarReader({ initialType }: AthkarReaderProps) {
  const [selectedType, setSelectedType] = useState<AthkarType | null>(initialType || null);

  useEffect(() => {
    if (initialType) {
      fetchAthkar(initialType);
    }
  }, [initialType]);

  const [athkar, setAthkar] = useState<Zekr[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [completedToday, setCompletedToday] = useState({
    morning: false,
    evening: false,
  });
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const timeOfDay = useTimeOfDay();

  useEffect(() => {
    const loadData = async () => {
      const user = localStorage.getItem('nooruna_user');
      if (user) {
        const userData = JSON.parse(user);
        setCurrentUserId(userData.id);
      }

      const holidayData = await fetchJordanHolidays();
      setHolidays(holidayData);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadProgress();
      window.addEventListener('storage', loadProgress);

      const handleOpenAthkar = (e: any) => {
        const type = e.detail?.type as AthkarType;
        if (type && (type === 'morning' || type === 'evening' || type === 'israa_miraj')) {
          fetchAthkar(type);
        }
      };

      window.addEventListener('openAthkar', handleOpenAthkar);

      return () => {
        window.removeEventListener('storage', loadProgress);
        window.removeEventListener('openAthkar', handleOpenAthkar);
      };
    }
  }, [currentUserId]);

  const loadProgress = async () => {
    if (!currentUserId) return;

    try {
      const [morningData, eveningData] = await Promise.all([
        getAthkarProgress(currentUserId, 'morning'),
        getAthkarProgress(currentUserId, 'evening'),
      ]);

      setCompletedToday({
        morning: morningData?.completed || false,
        evening: eveningData?.completed || false,
      });
    } catch (error) {
      console.error('Error loading athkar progress:', error);
    }
  };

  const fetchAthkar = async (type: string) => {
    setLoading(true);
    setSelectedType(type as AthkarType);
    setProgress({});

    try {
      let url = '';
      if (type === 'morning') url = 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/77117060ce43a12ea603b025a7852ffe62cb5c1f/morningthk.json';
      else if (type === 'evening') url = 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/77117060ce43a12ea603b025a7852ffe62cb5c1f/masaatk.json';
      else if (type === 'israa_miraj') url = '/israaandmiraj.json';

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      let athkarArray: any[] = [];

      if (data.content && Array.isArray(data.content)) athkarArray = data.content;
      else if (Array.isArray(data)) athkarArray = data;
      else if (typeof data === 'object') athkarArray = Object.values(data);

      athkarArray = athkarArray.filter((item: any) => {
        return item && typeof item === 'object' && typeof item.zekr === 'string' && item.zekr.trim() !== '';
      }).map((item: any) => ({
        zekr: item.zekr || '',
        repeat: typeof item.repeat === 'number' ? item.repeat : parseInt(item.repeat) || 1,
        bless: item.bless || ''
      }));

      setAthkar(athkarArray);
    } catch (err) {
      console.error('Error fetching athkar:', err);
      setAthkar([]);
    } finally {
      setLoading(false);
    }
  };

  const handleZekrClick = (index: number, totalRepeats: number) => {
    const currentCount = progress[index] || 0;
    const newCount = currentCount + 1;

    if (newCount <= totalRepeats) {
      const newProgress = { ...progress, [index]: newCount };
      setProgress(newProgress);

      if ('vibrate' in navigator) navigator.vibrate(30);

      const allCompleted = athkar.every((zekr, idx) => {
        const count = newProgress[idx] || 0;
        return count >= zekr.repeat;
      });

      if (allCompleted) markAsCompleted();
    }
  };

  const markAsCompleted = () => {
    if (!selectedType || !currentUserId) return;
    if (selectedType !== 'morning' && selectedType !== 'evening') return;
    updateAthkarProgress(currentUserId, selectedType, true);
    window.dispatchEvent(new Event('storage'));
    loadProgress();
  };

  const handleReset = () => setProgress({});
  const close = () => { setSelectedType(null); setAthkar([]); setProgress({}); };

  const getTotalProgress = () => {
    if (!Array.isArray(athkar) || athkar.length === 0) return { total: 0, completed: 0, percentage: 0 };
    const total = athkar.length;
    const completedCount = athkar.filter((_, idx) => (progress[idx] || 0) >= athkar[idx].repeat).length;
    return { total, completed: completedCount, percentage: (completedCount / total) * 100 };
  };

  const stats = getTotalProgress();
  const isCompleted = stats.completed === stats.total && stats.total > 0;
  const isMorningTime = timeOfDay === 'morning' || timeOfDay === 'fajr';
  const isEveningTime = timeOfDay === 'evening' || timeOfDay === 'afternoon';

  // Only show Israa and Miraj card on the day of the occasion (daysUntil === 0)
  const isIsraaDay = holidays.some(h => h.name.includes('الإسراء والمعراج') && h.daysUntil === 0);

  const athkarCards = [
    {
      id: 'morning',
      label: 'أذكار الصباح',
      desc: 'بدء اليوم بذكر الله يزرع الطمأنينة في قلبك وبركة في رزقك.',
      icon: Sun,
      color: 'amber',
      done: completedToday.morning,
      badge: 'صباحاً',
      isRecommended: isMorningTime,
      iconBg: 'bg-slate-50 dark:bg-slate-800',
      iconColor: 'text-slate-400 dark:text-slate-500',
      btnColor: 'bg-emerald-500 text-white',
      barColor: 'bg-orange-400',
      hoverFill: 'bg-amber-400/5'
    },
    {
      id: 'evening',
      label: 'أذكار المساء',
      desc: 'اختم يومك بالسكينة والتحصين لتنعم بليلة هادئة في حفظ الله.',
      icon: Moon,
      color: 'indigo',
      done: completedToday.evening,
      badge: 'مساءً',
      isRecommended: isEveningTime,
      iconBg: 'bg-indigo-600',
      iconColor: 'text-white',
      btnColor: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900',
      barColor: 'bg-indigo-500',
      hoverFill: 'bg-indigo-600/5'
    }
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className="px-2 pt-10">
        <div className="flex items-center justify-between mb-8" dir="rtl">
          <div className="text-right">
            <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-1.5">الأذكار</h1>
            <div className="flex items-center gap-2 text-[#62748e] font-bold text-[11px] uppercase tracking-widest">
              <span>أذكار الصباح واليوم</span>
              <span className="text-base">{isMorningTime ? '☀️' : '🌙'}</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl flex items-center justify-center">
            <HandHeart className="w-7 h-7 text-[#62748e]" />
          </div>
        </div>
      </div>

      <div className="px-1 grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
        {athkarCards.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -3 }}
            onClick={() => fetchAthkar(item.id)}
            className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col min-h-[220px] cursor-pointer group overflow-hidden"
          >
            {/* Hover Background Fill Effect */}
            <div className={`absolute inset-0 ${item.hoverFill} opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-[0.8] group-hover:scale-[1.1] blur-3xl`} />

            {/* Top Layout */}
            <div className="relative z-10 flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:rotate-12 duration-500 ${item.iconBg} ${item.iconColor}`}>
                <item.icon className="w-6 h-6" />
              </div>

              <div className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${item.isRecommended ? 'bg-[#eef2ff] text-[#4f46e5]' : 'bg-slate-50 text-slate-400'}`}>
                {item.isRecommended ? 'مستحب الآن' : item.badge}
              </div>
            </div>

            {/* Center Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center space-y-1 mb-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white group-hover:scale-105 transition-transform">{item.label}</h3>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed max-w-[200px]">
                {item.desc}
              </p>
            </div>

            {/* Bottom Layout */}
            <div className="relative z-10 flex items-center justify-between mt-auto">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${item.done ? 'bg-emerald-500 text-white shadow-emerald-500/20' : item.btnColor} group-hover:scale-110`}>
                {item.done ? <Check className="w-6 h-6 stroke-[3]" /> : <Plus className="w-6 h-6 stroke-[3]" />}
              </div>

              <div className="flex flex-col gap-1 flex-1 mr-4">
                <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-left">الإنجاز</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black ${item.done ? 'text-orange-500' : 'text-slate-300'}`}>
                    {item.done ? '١٠٠٪' : '-٪'}
                  </span>
                  <div className="h-1.5 flex-1 bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: item.done ? '100%' : '0%' }}
                      className={`h-full rounded-full ${item.barColor}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Prominent Israa and Miraj Card */}
      <AnimatePresence>
        {(isIsraaDay || initialType === 'israa_miraj') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative overflow-hidden rounded-2xl p-0.5 shadow-xl transition-all duration-500 hover:shadow-indigo-500/30 mx-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81]"></div>
            <div className="relative z-10 bg-white/5 backdrop-blur-2xl rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-row items-center gap-4 text-right" dir="rtl">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-300 to-orange-500 flex items-center justify-center text-indigo-950 shadow-[0_0_20px_rgba(251,191,36,0.2)] relative z-10">
                    <Star className="w-6 h-6 fill-current animate-pulse" />
                  </div>
                  <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity animate-pulse"></div>
                </div>

                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-white leading-tight">أدعية الإسراء والمعراج</h3>
                  <p className="text-white/50 text-[10px] font-bold leading-relaxed truncate max-w-[200px] sm:max-w-md">أدعية مباركة مستجابة بإذن الله في ذكرى معجزة سيد الخلق.</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchAthkar('israa_miraj')}
                className="group/btn relative w-full md:w-auto overflow-hidden bg-white text-indigo-950 px-6 py-2 rounded-xl font-black text-xs shadow-lg transition-all"
              >
                قرآءة الأدعية
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reader Modal */}
      <AnimatePresence>
        {selectedType && (
          <div className="fixed inset-0 bg-black/60 z-[9990] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-white/5">
              <div className={`${selectedType === 'morning' ? 'bg-amber-500' : selectedType === 'evening' ? 'bg-indigo-600' : 'bg-slate-900'} text-white p-7 relative overflow-hidden`}>
                <div className="relative z-10 flex items-center justify-between" dir="rtl">
                  <div className="text-right">
                    <h2 className="text-2xl font-black">{selectedType === 'morning' ? 'أذكار الصباح' : selectedType === 'evening' ? 'أذكار المساء' : 'أدعية الإسراء والمعراج'}</h2>
                    <p className="text-xs text-white/70 font-bold mt-1">{stats.completed} من {stats.total} منجزة</p>
                  </div>
                  <button onClick={close} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="mt-5 h-2.5 bg-black/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${stats.percentage}%` }} className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </div>
              </div>

              <div className="p-4 sm:p-8 overflow-y-auto h-[60vh] bg-slate-50 dark:bg-slate-950">
                {loading ? <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-slate-400" /></div> : (
                  <div className="space-y-6" dir="rtl">
                    {athkar.map((zekr, index) => {
                      const currentCount = progress[index] || 0;
                      const done = currentCount >= zekr.repeat;
                      return (
                        <div key={index} className={`p-5 rounded-3xl border transition-all ${done ? 'bg-emerald-50/30 border-emerald-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{index + 1}</span>
                            {zekr.repeat > 1 && (
                              <button onClick={() => handleZekrClick(index, zekr.repeat)} disabled={done} className={`px-4 py-1.5 rounded-lg font-black text-[10px] transition-all ${done ? 'text-emerald-600 bg-emerald-100' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95'}`}>
                                {currentCount} / {zekr.repeat}
                              </button>
                            )}
                          </div>
                          <p onClick={() => handleZekrClick(index, zekr.repeat)} className={`text-lg sm:text-xl text-center font-amiri leading-relaxed mb-4 cursor-pointer select-none ${done ? 'opacity-40 italic' : 'text-slate-800 dark:text-white'}`}>
                            {zekr.zekr}
                          </p>
                          {zekr.bless && (
                            <div className="bg-rose-50/30 dark:bg-rose-500/5 p-4 rounded-2xl flex gap-3 items-start border border-rose-100/30">
                              <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-1" />
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold leading-relaxed">{zekr.bless}</p>
                            </div>
                          )}
                          {zekr.repeat === 1 && !done && (
                            <button onClick={() => handleZekrClick(index, zekr.repeat)} className="w-full mt-4 py-3 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95">تمت القراءة</button>
                          )}
                        </div>
                      );
                    })}
                    {isCompleted && (
                      <div className="p-10 bg-emerald-600 text-white rounded-[3rem] text-center shadow-2xl shadow-emerald-500/30">
                        <span className="text-5xl block mb-4">✨</span>
                        <h3 className="text-2xl font-black">تقبل الله طاعتكم</h3>
                        <p className="text-base opacity-90 mt-2 font-bold">الحمد لله الذي بنعمته تتم الصالحات</p>
                        <button onClick={close} className="mt-8 bg-white text-emerald-700 px-12 py-3 rounded-2xl font-black shadow-lg hover:shadow-white/20 transition-all">تم</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex justify-between items-center gap-4">
                <button onClick={handleReset} className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 hover:text-slate-900 transition-colors"><RotateCcw className="w-6 h-6" /></button>
                <div className="text-base font-black text-slate-400">{stats.completed} / {stats.total}</div>
                <button onClick={close} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm hover:scale-105 transition-all">إغلاق</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}