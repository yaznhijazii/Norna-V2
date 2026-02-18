import { useState, useEffect, useCallback } from "react";
import { BookOpen, X, Loader2, Check, RotateCcw, Bookmark, Star, Play, Pause, Flame, Users, Award, Heart, ArrowDown, Calendar, ArrowLeft, ChevronRight, ChevronLeft, Plus, Trash2, User, BookHeart, Edit2, Bell, Trash, Clock, Lock, Settings, Sunrise, Sun, CloudSun, Sunset, Moon, Sparkles } from 'lucide-react';
import { InAppNotification } from './NotificationBanner';
import { motion, AnimatePresence } from 'motion/react';
import { TasbihIcon } from './TasbihIcon';
import { useTimeOfDay, timeOfDayConfig } from "../hooks/useTimeOfDay";
import { MoodSelector } from "./MoodSelector";
import { useRamadan } from "../hooks/useRamadan";
import { usePrayerTimes } from "../hooks/usePrayerTimes";
import {
  getTodayPrayers,
  getTodayAthkarProgress,
  getTodayQuranProgress,
} from "../utils/db";
import { supabase } from "../utils/supabase";
import { fetchJordanHolidays, getNextHoliday, Holiday } from "../utils/holidays";

const moods = [
  { id: 'serene', label: 'مطمئن', color: 'text-slate-100', bg: 'bg-slate-500/10', fill: '#f8fafc' },
  { id: 'happy', label: 'سعيد', color: 'text-rose-500', bg: 'bg-rose-500/10', fill: '#f43f5e' },
  { id: 'seeking', label: 'مشتاق', color: 'text-purple-500', bg: 'bg-purple-500/10', fill: '#a855f7' },
  { id: 'pensive', label: 'متفكر', color: 'text-blue-500', bg: 'bg-blue-500/10', fill: '#3b82f6' },
  { id: 'low', label: 'مرهق', color: 'text-slate-500', bg: 'bg-slate-500/10', fill: '#64748b' },
];

const logoImage = "/norna.png";

interface DailyHeaderProps {
  userName?: string;
  userId?: string;
  partnerName?: string;
  onPartnerStatsClick?: () => void;
  onSettingsClick?: () => void;
  hasPartner?: boolean;
}

export function DailyHeader({
  userName,
  userId,
  partnerName,
  onPartnerStatsClick,
  onSettingsClick,
  hasPartner,
}: DailyHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentTask, setCurrentTask] = useState<string | null>(
    null,
  );
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] =
    useState(false);
  const [stats, setStats] = useState({
    todayProgress: 0,
    totalCompleted: 0,
    totalTasks: 0,
  });
  const [nextHoliday, setNextHoliday] = useState<Holiday | null>(null);
  const [partnerMood, setPartnerMood] = useState<{ mood: string; updatedAt: string } | null>(null);
  const timeOfDay = useTimeOfDay();
  const timeConfig = timeOfDayConfig[timeOfDay];
  const [showRealTime, setShowRealTime] = useState(false);

  // Extract first name only
  const firstName = userName ? userName.split(" ")[0] : "";
  const { isRamadan, ramadanDay } = useRamadan();
  const greetingText = isRamadan
    ? `رمضان كريم ${firstName ? `يا ${firstName}` : ""} `
    : `السلام عليكم ورحمة الله ${firstName ? `يا ${firstName}` : ""} `;

  // Ramadan Countdown Logic
  const apiPrayerTimes = usePrayerTimes();
  const [ramadanCountdown, setRamadanCountdown] = useState<string>('');
  const [ramadanTarget, setRamadanTarget] = useState<string>('');

  useEffect(() => {
    if (!isRamadan || !apiPrayerTimes) return;

    const calculateCountdown = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const timeToMinutes = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };

      const fajr = timeToMinutes(apiPrayerTimes.Fajr);
      const maghrib = timeToMinutes(apiPrayerTimes.Maghrib);

      let targetMinutes = 0;
      let name = '';

      if (currentMinutes < fajr) {
        targetMinutes = fajr;
        name = 'السحور';
      } else if (currentMinutes < maghrib) {
        targetMinutes = maghrib;
        name = 'الإفطار';
      } else {
        targetMinutes = fajr + 24 * 60;
        name = 'السحور';
      }

      setRamadanTarget(name);

      const diffInMinutes = targetMinutes - currentMinutes;
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      const seconds = 59 - now.getSeconds();

      setRamadanCountdown(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isRamadan, apiPrayerTimes]);

  // Typewriter effect
  useEffect(() => {
    let currentIndex = 0;
    setDisplayedText("");
    setIsTypingComplete(false);

    const typeInterval = setInterval(() => {
      if (currentIndex < greetingText.length) {
        setDisplayedText(
          greetingText.slice(0, currentIndex + 1),
        );
        currentIndex++;
      } else {
        setIsTypingComplete(true);
        clearInterval(typeInterval);
      }
    }, 50); // Typing speed

    return () => clearInterval(typeInterval);
  }, [greetingText]);

  // Notification History Logic
  const [notifHistory, setNotifHistory] = useState<InAppNotification[]>([]);
  const [showNotifHistory, setShowNotifHistory] = useState(false);

  useEffect(() => {
    // Load history from localStorage
    const saved = localStorage.getItem('nooruna_notif_history');
    if (saved) {
      try {
        setNotifHistory(JSON.parse(saved));
      } catch (e) { }
    }

    const handleNewNotif = (event: any) => {
      const data = event.detail as InAppNotification;
      setNotifHistory(prev => {
        const updated = [{
          ...data,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 20);
        localStorage.setItem('nooruna_notif_history', JSON.stringify(updated));
        return updated;
      });
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nooruna_notif_history' && e.newValue) {
        try {
          setNotifHistory(JSON.parse(e.newValue));
        } catch (err) { }
      }
    };

    const handlePartnerMoodSync = (e: any) => {
      setPartnerMood(e.detail);
    };

    // Initial partner data fetch to sync "متصل/غير متصل" immediately
    const fetchInitialPartnerMood = async () => {
      if (!userId) return;
      try {
        const { data: user } = await supabase
          .from('users')
          .select('partner_id')
          .eq('id', userId)
          .single();

        if (user?.partner_id) {
          const { data: partner } = await supabase
            .from('users')
            .select('current_mood, mood_updated_at')
            .eq('id', user.partner_id)
            .single();

          if (partner) {
            setPartnerMood({
              mood: partner.current_mood,
              updatedAt: partner.mood_updated_at
            });
          }
        }
      } catch (e) { }
    };

    window.addEventListener('nooruna-in-app-notification', handleNewNotif);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('nooruna-partner-mood-sync', handlePartnerMoodSync);

    fetchInitialPartnerMood();

    return () => {
      window.removeEventListener('nooruna-in-app-notification', handleNewNotif);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('nooruna-partner-mood-sync', handlePartnerMoodSync);
    };
  }, [userId]);

  // Badge Logic
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  useEffect(() => {
    if (showNotifHistory) {
      setHasUnreadNotifs(false);
      localStorage.setItem('nooruna_notif_last_read', Date.now().toString());
    }
  }, [showNotifHistory]);

  useEffect(() => {
    const lastRead = parseInt(localStorage.getItem('nooruna_notif_last_read') || '0');
    const hasUnread = notifHistory.some(n => new Date(n.timestamp || 0).getTime() > lastRead);
    setHasUnreadNotifs(hasUnread);
  }, [notifHistory, showNotifHistory]);

  const clearHistory = () => {
    setNotifHistory([]);
    localStorage.removeItem('nooruna_notif_history');
  };

  // Calculate stats
  useEffect(() => {
    const updateStats = async () => {
      try {
        const currentUser =
          localStorage.getItem("nooruna_user");
        if (!currentUser) return;

        const user = JSON.parse(currentUser);
        const userId = user.id;

        // Get all today's data from Supabase
        const [prayers, athkar, quran] = await Promise.all([
          getTodayPrayers(userId),
          getTodayAthkarProgress(userId),
          getTodayQuranProgress(userId),
        ]);

        // Count completed prayers
        const prayersCompleted = prayers
          ? (prayers.fajr ? 1 : 0) +
          (prayers.dhuhr ? 1 : 0) +
          (prayers.asr ? 1 : 0) +
          (prayers.maghrib ? 1 : 0) +
          (prayers.isha ? 1 : 0)
          : 0;

        // Count completed athkar
        const athkarCompleted = athkar
          ? athkar.filter((a: any) => a.completed).length
          : 0;

        // Count completed quran
        const quranCompleted = quran
          ? quran.filter((q: any) => q.completed).length
          : 0;

        // Check if today is Friday for Kahf availability
        const isFriday = new Date().getDay() === 5;
        const maxQuranTasks = isFriday ? 3 : 2; // Kahf only on Friday

        const total =
          prayersCompleted + athkarCompleted + quranCompleted;
        const maxPossible = 5 + 2 + maxQuranTasks; // 5 prayers + 2 athkar + quran tasks
        const progress = Math.round(
          (total / maxPossible) * 100,
        );

        setStats({
          todayProgress: progress,
          totalCompleted: total,
          totalTasks: maxPossible,
        });
      } catch (error) {
        console.error("Error updating stats:", error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds
    window.addEventListener("storage", updateStats);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", updateStats);
    };
  }, []);

  // Fetch prayer times from API
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        // Format today's date as DD-MM-YYYY
        const today = new Date();
        const day = String(today.getDate()).padStart(2, "0");
        const month = String(today.getMonth() + 1).padStart(
          2,
          "0",
        );
        const year = today.getFullYear();
        const dateString = `${day} -${month} -${year} `;

        const url = `https://api.aladhan.com/v1/timings/${dateString}?latitude=31.9454&longitude=35.9284&method=1`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.data && data.data.timings) {
          setPrayerTimes(data.data.timings);
        }
      } catch (error) {
        console.error("Error fetching prayer times:", error);
        // Fallback to default times
        setPrayerTimes({
          Fajr: "05:15",
          Dhuhr: "12:30",
          Asr: "15:45",
          Maghrib: "18:20",
          Isha: "19:45",
        });
      }
    };

    fetchPrayerTimes();
  }, []);

  // Fetch holidays on mount
  useEffect(() => {
    const loadHolidays = async () => {
      const holidays = await fetchJordanHolidays();
      const next = getNextHoliday(holidays);
      console.log('📅 Next holiday:', next);
      setNextHoliday(next);
    };
    loadHolidays();
  }, []);

  useEffect(() => {
    if (!prayerTimes) return;

    const timeStringToMinutes = (timeString: string): number => {
      const [hours, minutes] = timeString.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const updateCurrentTask = () => {
      const now = new Date();
      setCurrentTime(now);

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const isFriday = now.getDay() === 5;
      let current = null;

      const fajrMinutes = timeStringToMinutes(prayerTimes.Fajr);
      const dhuhrMinutes = timeStringToMinutes(prayerTimes.Dhuhr);
      const asrMinutes = timeStringToMinutes(prayerTimes.Asr);
      const maghribMinutes = timeStringToMinutes(prayerTimes.Maghrib);
      const ishaMinutes = timeStringToMinutes(prayerTimes.Isha);

      // 1. Mandatory Prayers (with 30 min preview)
      const previewWindow = 30; // minutes
      if (currentMinutes >= fajrMinutes - previewWindow && currentMinutes < fajrMinutes + 60) {
        current = "صلاة الفجر";
      } else if (currentMinutes >= dhuhrMinutes - previewWindow && currentMinutes < dhuhrMinutes + 90) {
        current = "صلاة الظهر";
      } else if (currentMinutes >= asrMinutes - previewWindow && currentMinutes < asrMinutes + 90) {
        current = "صلاة العصر";
      } else if (currentMinutes >= maghribMinutes - previewWindow && currentMinutes < maghribMinutes + 60) {
        current = "صلاة المغرب";
      } else if (currentMinutes >= ishaMinutes - previewWindow && currentMinutes < ishaMinutes + 120) {
        current = "صلاة العشاء";
      }

      // 2. Special Occasions (Specific Timeframe Logic)
      if (!current && nextHoliday && nextHoliday.daysUntil === 0) {
        // Example: If it's Israa and Miraj, only show it late at night (e.g., 12 AM - 3 AM)
        if (nextHoliday.name.includes("الإسراء")) {
          if (currentMinutes >= 0 && currentMinutes < 3 * 60) {
            current = `ليلة ${nextHoliday.name}`;
          }
        } else {
          // For other holidays, show all day
          current = `ذكرى ${nextHoliday.name}`;
        }
      }

      // 3. Weekly/Daily Religious Tasks
      if (!current) {
        if (isFriday && currentMinutes < maghribMinutes) { // Kahf is read before Maghrib on Friday
          current = "سورة الكهف";
        } else if (currentMinutes >= 6 * 60 && currentMinutes < 10 * 60) { // 6 AM to 10 AM
          current = "أذكار الصباح";
        } else if (currentMinutes >= asrMinutes && currentMinutes < maghribMinutes) { // After Asr, before Maghrib
          current = "أذكار المساء";
        } else if (currentMinutes >= 21 * 60 || currentMinutes < 2 * 60) { // 9 PM to 2 AM
          current = "سورة الملك";
        } else {
          current = "سورة البقرة";
        }
      }

      setCurrentTask(current);
    };

    updateCurrentTask();
    const timer = setInterval(updateCurrentTask, 60000); // Update every minute

    // Listen for storage changes
    window.addEventListener("storage", updateCurrentTask);

    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", updateCurrentTask);
    };
  }, [prayerTimes, nextHoliday]);

  const arabicDays = [
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];
  const arabicMonths = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const dayName = arabicDays[currentTime.getDay()];
  const day = currentTime.getDate();
  const month = arabicMonths[currentTime.getMonth()];
  const year = currentTime.getFullYear();

  // Handle click on current task badge
  const handleCurrentTaskClick = () => {
    if (!currentTask) return;

    if (currentTask === "سورة البقرة") {
      window.dispatchEvent(new CustomEvent("openQuranSurah", { detail: { surah: "baqarah" } }));
    } else if (currentTask === "سورة الملك") {
      window.dispatchEvent(new CustomEvent("openQuranSurah", { detail: { surah: "mulk" } }));
    } else if (currentTask === "سورة الكهف") {
      window.dispatchEvent(new CustomEvent("openQuranSurah", { detail: { surah: "kahf" } }));
    } else if (currentTask === "أذكار الصباح") {
      window.dispatchEvent(new CustomEvent("openAthkar", { detail: { type: "morning" } }));
    } else if (currentTask === "أذكار المساء") {
      window.dispatchEvent(new CustomEvent("openAthkar", { detail: { type: "evening" } }));
    } else if (currentTask === "أدعية الإسراء والمعراج") {
      window.dispatchEvent(new CustomEvent("openAthkar", { detail: { type: "israa_miraj" } }));
    }
  };

  return (
    <div
      className={`relative bg-gradient-to-br ${timeConfig.headerGradient} rounded-[2rem] p-5 sm:p-7 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] text-white transition-all duration-1000 group border border-white/20 backdrop-blur-2xl ring-1 ring-white/5 overflow-hidden min-h-[190px] flex flex-col justify-center`}
    >
      {/* Sleek Mesh Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 20, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-white/10 rounded-full blur-[80px]"
        />
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />
      </div>

      {/* Top Right: Compact Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={onSettingsClick}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-3xl border border-white/10 hover:bg-white/20 transition-all active:scale-95 group/btn"
        >
          <Settings className="w-4 h-4 text-white/70 group-hover/btn:rotate-90 transition-transform duration-700" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowNotifHistory(!showNotifHistory)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border backdrop-blur-3xl ${showNotifHistory ? 'bg-white/30 border-white/20' : 'bg-white/10 border-white/10 hover:bg-white/20'} active:scale-95`}
          >
            <Bell className="w-4 h-4 text-white/70" />
            {hasUnreadNotifs && (
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-indigo-600 animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifHistory && (
              <motion.div
                initial={{ opacity: 0, y: 10, x: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, x: 10, scale: 0.95 }}
                className="absolute top-[calc(100%+8px)] right-0 w-[280px] bg-slate-950/90 backdrop-blur-3xl shadow-2xl rounded-2xl z-[100] border border-white/10 overflow-hidden"
              >
                <div className="p-3 bg-white/5 border-b border-white/5 flex justify-between items-center px-4">
                  <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">الإشعارات</span>
                  <button onClick={clearHistory} className="text-[8px] font-bold text-rose-400">مسح</button>
                </div>
                <div className="max-h-[250px] overflow-y-auto p-2 space-y-1">
                  {notifHistory.length === 0 ? (
                    <div className="py-8 text-center text-[9px] font-black uppercase text-white/10 tracking-widest">فارغ</div>
                  ) : (
                    notifHistory.map((notif: any) => (
                      <div key={notif.id} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 text-right">
                        <h4 className="text-[11px] font-black text-white/90 mb-0.5">{notif.title}</h4>
                        <p className="text-[9px] text-white/40 leading-tight">{notif.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Unified Smart Calendar Unit (Far Left & Centered Vertically) */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex flex-col w-[85px] rounded-2xl backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden ring-1 ring-white/10 bg-white/10"
          >
            {/* Month Header */}
            <div className="h-[22px] flex items-center justify-center bg-rose-500/80">
              <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none">
                {isRamadan ? 'رمضان' : month}
              </span>
            </div>

            {/* Day Number */}
            <div className="flex flex-col items-center justify-center bg-white/5 py-1.5 relative overflow-hidden">
              {isRamadan && (
                <Moon className="absolute -right-2 -bottom-2 w-8 h-8 text-white/5 -rotate-12" />
              )}
              <span className="text-2xl font-black tracking-tighter leading-tight text-white">
                {isRamadan ? ramadanDay : day}
              </span>
              {isRamadan && (
                <span className="text-[7px] font-bold text-white/30 uppercase tracking-tighter -mt-1">يوم مبارك</span>
              )}
            </div>

            {/* Day Name & Period Footer */}
            <div className="bg-black/20 py-1 flex flex-col items-center border-t border-white/10">
              <span className="text-[8px] font-black uppercase text-white/60 leading-none mb-0.5">
                {isRamadan ? `${dayName} ${day} ${month}` : dayName}
              </span>
              <div className="flex items-center gap-1">
                {(() => {
                  const iconProps = { className: "w-2.5 h-2.5" };
                  switch (timeConfig.icon) {
                    case 'sunrise': return <Sunrise {...iconProps} className="text-amber-300" />;
                    case 'sun': return <Sun {...iconProps} className="text-amber-400" />;
                    case 'cloud-sun': return <CloudSun {...iconProps} className="text-sky-200" />;
                    case 'sunset': return <Sunset {...iconProps} className="text-orange-400" />;
                    case 'moon': return <Moon {...iconProps} className="text-indigo-200" />;
                    default: return <Sun {...iconProps} />;
                  }
                })()}
                <span className="text-[7px] font-bold text-white/30 capitalize">{timeConfig.name}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Center: Greeting (Smaller & Balanced) */}
        <div className="flex flex-col items-center gap-1 py-4">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-2xl sm:text-3xl font-black tracking-tight flex items-center justify-center gap-4 leading-none text-center"
          >
            <span className="drop-shadow-sm">{displayedText}</span>
            {isRamadan && isTypingComplete && (
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <Moon className="w-6 h-6 text-amber-400 fill-current drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]" />
              </motion.div>
            )}
          </motion.h1>
        </div>

        {/* Bottom Row: Ultra-Compact Badges */}
        <div className="flex items-center justify-center gap-3 mt-1 scale-90 sm:scale-100">
          {isRamadan && ramadanCountdown && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-3xl border border-white/10 text-[10px] font-black shadow-lg">
              {ramadanTarget === 'الإفطار' ? <Sunset className="w-3.5 h-3.5 text-orange-400" /> : <Sunrise className="w-3.5 h-3.5 text-amber-300" />}
              <span className="text-white/50">{ramadanTarget}:</span>
              <span className="font-mono text-white tracking-tight">{ramadanCountdown}</span>
            </div>
          )}

          {currentTask && (
            <button
              onClick={handleCurrentTaskClick}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 backdrop-blur-3xl border border-indigo-400/20 text-[10px] font-black shadow-lg hover:bg-indigo-500/25 transition-all group"
            >
              <Star className="w-3.5 h-3.5 text-amber-300 fill-current" />
              <span className="max-w-[120px] truncate">المهمة: {currentTask}</span>
              <ChevronLeft className="w-3 h-3 text-white/30 group-hover:translate-x-[-2px] transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
