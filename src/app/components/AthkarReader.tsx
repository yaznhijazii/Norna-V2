import { useState, useEffect } from 'react';
import { Sun, Moon, X, Loader2, Check, RotateCcw, Heart, Star, Sparkles, HandHeart, Plus, CheckCircle2, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAthkarProgress, updateAthkarProgress } from '../utils/db';
import { useTimeOfDay } from '../hooks/useTimeOfDay';
import { fetchJordanHolidays, Holiday } from '../utils/holidays';
import { TasbihPage } from '../pages/TasbihPage';

interface Zekr {
  zekr: string;
  repeat: number;
  bless: string;
}

type AthkarType = 'morning' | 'evening' | 'israa_miraj' | 'tasbih';

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

  // Load incremental progress from localStorage
  useEffect(() => {
    if (selectedType && currentUserId) {
      const key = `athkar_progress_${currentUserId}_${selectedType}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setProgress(JSON.parse(saved));
      } else {
        setProgress({});
      }
    }
  }, [selectedType, currentUserId]);

  // Save incremental progress to localStorage
  useEffect(() => {
    if (selectedType && currentUserId && Object.keys(progress).length > 0) {
      const key = `athkar_progress_${currentUserId}_${selectedType}`;
      localStorage.setItem(key, JSON.stringify(progress));
    }
  }, [progress, selectedType, currentUserId]);

  const fetchAthkar = async (type: string) => {
    setLoading(true);
    setSelectedType(type as AthkarType);

    // Don't reset progress here, let the useEffect load it

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
    // Clear incremental saved progress once fully completed
    localStorage.removeItem(`athkar_progress_${currentUserId}_${selectedType}`);
    window.dispatchEvent(new Event('storage'));
    loadProgress();
  };

  const handleReset = () => {
    setProgress({});
    if (selectedType && currentUserId) {
      localStorage.removeItem(`athkar_progress_${currentUserId}_${selectedType}`);
    }
  };
  const close = () => {
    if (selectedType === 'tasbih') {
      // Save tasbih count if needed (handled inside TasbihPage usually)
    }
    setSelectedType(null);
    setAthkar([]);
    setProgress({});
  };

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
        {selectedType && selectedType === 'tasbih' && (
          <div className="fixed inset-0 bg-black/80 z-[9990] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-950 w-full h-full relative"
            >
              <button
                onClick={close}
                className="absolute top-6 left-6 z-[10000] p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <TasbihPage />
            </motion.div>
          </div>
        )}

        {selectedType && selectedType !== 'tasbih' && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9990] flex items-center justify-center p-0 lg:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#fafaf9] dark:bg-[#0c0c0b] w-full h-full lg:h-[88vh] lg:max-w-xl lg:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/5"
            >
              {/* Premium Header - More Compact */}
              <div className={`relative pt-10 pb-6 px-6 sm:px-8 overflow-hidden ${selectedType === 'morning' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                selectedType === 'evening' ? 'bg-gradient-to-br from-indigo-600 to-slate-900' :
                  'bg-gradient-to-br from-slate-800 to-slate-950'
                }`}>
                {/* Abstract Background Orbs */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] -mr-15 -mt-15" />

                <div className="relative z-10 flex items-center justify-between" dir="rtl">
                  <div className="text-right">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                        {selectedType === 'morning' ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {selectedType === 'morning' ? 'أذكار الصباح' : selectedType === 'evening' ? 'أذكار المساء' : 'أدعية الإسراء والمعراج'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{stats.completed} / {stats.total} منجزة</span>
                      <div className="h-1 w-16 bg-black/10 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${stats.percentage}%` }} className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={close}
                    className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-90 border border-white/10 group"
                  >
                    <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              {/* Reader Body - Compacted Padding */}
              <div className="flex-1 overflow-y-auto scrollbar-hide bg-[#fafaf9] dark:bg-[#0c0c0b] px-4 py-6 sm:px-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-500/40" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">جاري التحميل...</span>
                  </div>
                ) : (
                  <div className="max-w-xl mx-auto space-y-6" dir="rtl">
                    {athkar.map((zekr, index) => {
                      const currentCount = progress[index] || 0;
                      const done = currentCount >= zekr.repeat;

                      return (
                        <motion.div
                          key={index}
                          layout
                          className={`relative group p-6 sm:p-7 rounded-[2rem] transition-all duration-500 ${done
                            ? 'bg-slate-50 dark:bg-white/[0.01] border-transparent opacity-40 scale-[0.98]'
                            : 'bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] shadow-sm hover:shadow-lg'
                            }`}
                        >
                          {/* Top Info Bar */}
                          <div className="flex items-center justify-between mb-6">
                            <div className={`flex items-center gap-2.5`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${done ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                }`}>
                                {index + 1}
                              </div>
                              {done && (
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded-lg">تم</span>
                              )}
                            </div>

                            {zekr.repeat > 1 && (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-right">التكرار</span>
                                <div className="text-xs font-black tabular-nums dark:text-white/60">{zekr.repeat} مرات</div>
                              </div>
                            )}
                          </div>

                          {/* The Zekr Text - Smaller font */}
                          <p
                            onClick={() => handleZekrClick(index, zekr.repeat)}
                            className={`text-xl sm:text-2xl text-center font-amiri leading-[1.6] mb-6 cursor-pointer select-none transition-all duration-700 ${done ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-800 dark:text-white group-hover:scale-[1.005]'
                              }`}
                          >
                            {zekr.zekr}
                          </p>

                          {/* Bless Section */}
                          {zekr.bless && !done && (
                            <div className="mb-0 bg-amber-50/40 dark:bg-amber-500/5 p-4 rounded-2xl border border-amber-100/40 dark:border-amber-500/10 flex gap-3 items-start">
                              <Calculator className="w-4 h-4 text-amber-500/60 shrink-0 mt-0.5" />
                              <p className="text-[10px] font-medium text-amber-900/50 dark:text-amber-200/30 leading-relaxed font-sans">{zekr.bless}</p>
                            </div>
                          )}

                          {/* Action Area: Counter Button - Smaller */}
                          <div className="mt-8 flex justify-center">
                            {zekr.repeat > 1 ? (
                              <motion.button
                                onClick={() => handleZekrClick(index, zekr.repeat)}
                                disabled={done}
                                whileTap={{ scale: 0.9 }}
                                className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-500 group/btn ${done
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                  : 'bg-[#1a1816] dark:bg-white text-white dark:text-slate-900 shadow-lg'
                                  }`}
                              >
                                {done ? (
                                  <Check className="w-7 h-7 stroke-[3]" />
                                ) : (
                                  <>
                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5">اضغط</span>
                                    <span className="text-xl font-black tabular-nums">{currentCount} / {zekr.repeat}</span>
                                    <div className="absolute inset-0 rounded-full border-[3px] border-white/5" />
                                  </>
                                )}
                              </motion.button>
                            ) : (
                              !done && (
                                <motion.button
                                  onClick={() => handleZekrClick(index, zekr.repeat)}
                                  whileTap={{ scale: 0.95 }}
                                  className="w-full py-4 bg-[#1a1816] dark:bg-white text-white dark:text-slate-900 rounded-[1.25rem] font-black text-xs shadow-lg transition-all"
                                >
                                  أكملت القراءة
                                </motion.button>
                              )
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {isCompleted && (
                      <div className="py-12 text-center space-y-4">
                        <div className="w-20 h-20 rounded-[2rem] bg-emerald-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 overflow-hidden relative">
                          <CheckCircle2 className="w-10 h-10 text-white relative z-10" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black text-slate-800 dark:text-white">حصنك الله بحفظه</h3>
                          <p className="text-slate-400 dark:text-white/30 font-bold text-xs">تقبل الله طاعتكم</p>
                        </div>
                        <button onClick={close} className="px-10 py-3.5 bg-emerald-500 text-white rounded-[1.25rem] font-black text-sm shadow-lg active:scale-95 transition-all">العودة للرئيسية</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Sticky Action Bar - More Compact */}
              <div className="p-5 bg-white dark:bg-[#0c0c0b] border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between gap-5 px-6 sm:px-10">
                <button
                  onClick={handleReset}
                  className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all active:scale-90"
                  title="إعادة ضبط"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center">
                  <div className="text-[9px] font-black text-slate-300 dark:text-white/20 uppercase tracking-[0.2em] mb-0.5">الإنجاز</div>
                  <div className="text-lg font-mono font-black text-slate-800 dark:text-white tabular-nums tracking-tighter">
                    {stats.completed} <span className="text-slate-200 dark:text-white/10 mx-1">/</span> {stats.total}
                  </div>
                </div>

                <button
                  onClick={close}
                  className={`flex-1 sm:flex-none px-8 py-3.5 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-[#1a1816] dark:bg-white text-white dark:text-slate-900'
                    }`}
                >
                  {isCompleted ? 'تم الإنجاز' : 'إخفاء'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}