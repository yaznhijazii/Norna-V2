import { useState, useEffect } from 'react';
import { Sun, Moon, X, Loader2, Check, RotateCcw, Heart, Star, Sparkles, Wind, CloudMoon, Plus, CheckCircle2 } from 'lucide-react';
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

  // Check if specific occasions are relevant (within 2 days)
  const isNearOccasion = (name: string) => {
    return holidays.some(h => h.name.includes(name) && h.daysUntil <= 2 && h.daysUntil >= -1);
  };

  const showIsraaCard = isNearOccasion('الإسراء والمعراج');

  return (
    <div className="space-y-8">
      {/* Dynamic Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-1 shadow-2xl transition-all duration-700">
        <div className={`absolute inset-0 bg-gradient-to-br ${isMorningTime ? 'from-amber-400 via-orange-500 to-yellow-600' : isEveningTime ? 'from-indigo-600 via-purple-700 to-slate-900' : 'from-slate-800 to-slate-950'}`}></div>
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-[2.3rem] p-6 sm:p-8 border border-white/20 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
          <div className="flex flex-col items-center md:items-start text-center md:text-right gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white shadow-xl">
                {isMorningTime ? <Sun className="w-8 h-8" /> : <Moon className="w-8 h-8" />}
              </div>
              <div>
                <span className="text-white/70 text-xs font-bold uppercase tracking-widest block mb-0.5">الذكر المستحب الآن</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {isMorningTime ? 'أذكار الصباح' : isEveningTime ? 'أذكار المساء' : 'أذكار الليل'}
                </h3>
              </div>
            </div>
            <p className="text-white/80 text-sm sm:text-base font-medium max-w-sm leading-relaxed">
              {isMorningTime ? 'نورٌ لقلبك وحرزٌ ليومك، ابدأ صباحك بذكر الله.' : 'حصنٌ منيع وسكينة لنفسك قبل المبيت.'}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button onClick={() => fetchAthkar(isMorningTime ? 'morning' : 'evening')} className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all flex items-center gap-2">
                <span>ابدأ الآن</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-dashed border-white/30">
              <span className="text-4xl text-white">📿</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!isMorningTime && (
          <div onClick={() => fetchAthkar('morning')} className="p-5 bg-white hover:bg-amber-50 rounded-3xl border border-amber-100 flex items-center justify-between cursor-pointer group transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                <Sun className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800">أذكار الصباح</h4>
            </div>
            <div className="text-amber-600">{completedToday.morning ? <CheckCircle2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}</div>
          </div>
        )}
        {!isEveningTime && (
          <div onClick={() => fetchAthkar('evening')} className="p-5 bg-white hover:bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center justify-between cursor-pointer group transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Moon className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800">أذكار المساء</h4>
            </div>
            <div className="text-indigo-600">{completedToday.evening ? <CheckCircle2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}</div>
          </div>
        )}
      </div>

      {/* Special Card: Israa and Miraj - Dynamic Visibility */}
      {showIsraaCard && (
        <div className="group relative overflow-hidden rounded-[2.5rem] p-1 shadow-2xl transition-all duration-500 hover:shadow-indigo-500/20 active:scale-[0.98]">
          {/* Deep Celestial Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81]"></div>

          {/* Golden Aura Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-400/20 rounded-full blur-[80px] group-hover:bg-amber-400/30 transition-all duration-700"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>

          {/* Animated Twinkling Background Particles */}
          <div className="absolute inset-0 opacity-40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`absolute w-1 h-1 bg-white rounded-full animate-pulse`}
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}></div>
            ))}
          </div>

          <div className="relative z-10 bg-white/5 backdrop-blur-xl rounded-[2.4rem] p-6 sm:p-8 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
              {/* Iconic Star with Glow */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-indigo-950 shadow-2xl shadow-amber-500/40 relative z-10 group-hover:rotate-[360deg] transition-all duration-1000 ease-in-out">
                  <Star className="w-8 h-8 fill-current" />
                </div>
                <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-20 group-hover:opacity-60 transition-opacity"></div>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-white">أدعية الإسراء والمعراج</h3>
                <p className="text-white/60 text-sm font-medium leading-relaxed tracking-wide">رحلة مباركة من المسجد الحرام إلى المسجد الأقصى</p>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                  <span className="w-8 h-px bg-amber-400/50"></span>
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-400/80">ليلة مباركة</span>
                  <span className="w-8 h-px bg-amber-400/50"></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchAthkar('israa_miraj')}
              className="group/btn relative w-full md:w-auto overflow-hidden bg-white hover:bg-amber-50 text-indigo-950 px-12 py-4 rounded-2xl font-black text-sm transition-all shadow-2xl hover:-translate-y-1 active:translate-y-0"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                اقرأ الأدعية المستحبة
                <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
              </span>
              {/* Shine effect on button hover */}
              <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
            </button>
          </div>
        </div>
      )}

      {/* Reader Modal */}
      <AnimatePresence>
        {selectedType && (
          <div className="fixed inset-0 bg-black/60 z-[9990] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-white/5">
              <div className={`${selectedType === 'morning' ? 'bg-amber-500' : selectedType === 'evening' ? 'bg-indigo-600' : 'bg-slate-900'} text-white p-6 relative overflow-hidden`}>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="text-right">
                    <h2 className="text-xl font-black">{selectedType === 'morning' ? 'أذكار الصباح' : selectedType === 'evening' ? 'أذكار المساء' : 'أدعية الإسراء والمعراج'}</h2>
                    <p className="text-xs text-white/70 font-bold">{stats.completed} من {stats.total} منجزة</p>
                  </div>
                  <button onClick={close} className="p-2 bg-white/10 rounded-xl"><X className="w-6 h-6" /></button>
                </div>
                <div className="mt-4 h-2 bg-black/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${stats.percentage}%` }} className="h-full bg-white" />
                </div>
              </div>

              <div className="p-4 sm:p-8 overflow-y-auto h-[60vh] bg-slate-50 dark:bg-slate-950">
                {loading ? <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-slate-400" /></div> : (
                  <div className="space-y-6">
                    {athkar.map((zekr, index) => {
                      const currentCount = progress[index] || 0;
                      const done = currentCount >= zekr.repeat;
                      return (
                        <div key={index} className={`p-6 rounded-[2rem] border-2 transition-all ${done ? 'bg-emerald-50/50 border-emerald-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${done ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{index + 1}</span>
                            {zekr.repeat > 1 && (
                              <button onClick={() => handleZekrClick(index, zekr.repeat)} disabled={done} className={`px-4 py-1.5 rounded-xl font-black text-xs ${done ? 'text-emerald-600 bg-emerald-100' : 'bg-emerald-600 text-white shadow-lg'}`}>
                                {currentCount} / {zekr.repeat}
                              </button>
                            )}
                          </div>
                          <p onClick={() => handleZekrClick(index, zekr.repeat)} className={`text-xl sm:text-2xl text-center font-amiri leading-loose mb-4 cursor-pointer ${done ? 'opacity-40 italic' : 'text-slate-800 dark:text-white'}`}>
                            {zekr.zekr}
                          </p>
                          {zekr.bless && (
                            <div className="bg-rose-50/50 dark:bg-rose-500/5 p-4 rounded-2xl flex gap-3 items-start border border-rose-100/50">
                              <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-1" />
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{zekr.bless}</p>
                            </div>
                          )}
                          {zekr.repeat === 1 && !done && (
                            <button onClick={() => handleZekrClick(index, zekr.repeat)} className="w-full mt-4 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm">تمت القراءة</button>
                          )}
                        </div>
                      );
                    })}
                    {isCompleted && (
                      <div className="p-8 bg-emerald-600 text-white rounded-[2rem] text-center shadow-xl">
                        <span className="text-4xl block mb-2">✨</span>
                        <h3 className="text-xl font-black">تقبل الله طاعتكم</h3>
                        <p className="text-sm opacity-80 mt-1">الحمد لله الذي بنعمته تتم الصالحات</p>
                        <button onClick={close} className="mt-4 bg-white text-emerald-700 px-8 py-2 rounded-xl font-black">تم</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex justify-between items-center gap-4">
                <button onClick={handleReset} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"><RotateCcw className="w-5 h-5" /></button>
                <div className="text-sm font-black text-slate-500">{stats.completed} / {stats.total}</div>
                <button onClick={close} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-sm">إغلاق</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}