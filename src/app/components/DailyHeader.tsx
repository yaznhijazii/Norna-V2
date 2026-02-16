import { useState, useEffect, useCallback } from "react";
import { BookOpen, X, Loader2, Check, RotateCcw, Bookmark, Star, Play, Pause, Flame, Users, Award, Heart, ArrowDown, Calendar, ArrowLeft, ChevronRight, ChevronLeft, Plus, Trash2, User, BookHeart, Edit2, Bell, Trash, Clock, Lock, Settings, Sunrise, Sun, CloudSun, Sunset, Moon, Sparkles } from 'lucide-react';
import { InAppNotification } from './NotificationBanner';
import { motion, AnimatePresence } from 'motion/react';
import { TasbihIcon } from './TasbihIcon';
import { useTimeOfDay, timeOfDayConfig } from "../hooks/useTimeOfDay";
import { QiblaCompass } from "./QiblaCompass";
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
  onQiblaClick?: () => void;
  hasPartner?: boolean;
}

export function DailyHeader({
  userName,
  userId,
  partnerName,
  onPartnerStatsClick,
  onSettingsClick,
  onQiblaClick,
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
  const { isRamadan } = useRamadan();
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
      className={`relative bg-gradient-to-br ${timeConfig.headerGradient} rounded-[2.5rem] p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.1)] text-white transition-all duration-1000 overflow-hidden group border border-white/20 backdrop-blur-2xl ring-1 ring-white/10`}
    >
      {/* Subtle Premium Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4" />
        {timeOfDay === 'night' && (
          <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        )}
      </div>

      <div className="relative z-10 space-y-5">
        {/* Top Navigation & Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30"
            >
              {(() => {
                switch (timeConfig.icon) {
                  case 'sunrise': return <Sunrise className="w-6 h-6 text-amber-300" />;
                  case 'sun': return <Sun className="w-6 h-6 text-amber-400" />;
                  case 'cloud-sun': return <CloudSun className="w-6 h-6 text-sky-300" />;
                  case 'sunset': return <Sunset className="w-6 h-6 text-orange-400" />;
                  case 'moon': return <Moon className="w-6 h-6 text-indigo-200" />;
                  default: return <Sun className="w-6 h-6" />;
                }
              })()}
            </motion.div>
            <div className="space-y-0.5 cursor-pointer" onClick={() => setShowRealTime(!showRealTime)}>
              <div className="flex items-center gap-2 text-white/60">
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{timeConfig.name}</span>
                <span className="w-1 h-1 bg-white/30 rounded-full" />
                <span className="text-[10px] font-bold text-white/80">{dayName}، {day} {month}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                <span>{displayedText}</span>
                {isRamadan && isTypingComplete && (
                  <Moon className="w-5 h-5 text-amber-400 fill-current drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onSettingsClick}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all shadow-lg"
            >
              <Settings className="w-4.5 h-4.5 text-white/90" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowNotifHistory(!showNotifHistory)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${showNotifHistory ? 'bg-white/30 border-white/40' : 'bg-white/10 border-white/20 hover:bg-white/20 shadow-lg'}`}
              >
                <Bell className="w-4.5 h-4.5 text-white/90" />
                {hasUnreadNotifs && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
                )}
              </button>

              <AnimatePresence>
                {showNotifHistory && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-[calc(100%+10px)] right-0 w-[280px] bg-white dark:bg-slate-900 shadow-2xl rounded-2xl z-[100] border border-white/20 overflow-hidden"
                  >
                    <div className="p-3 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                      <span>الإشعارات</span>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1.5 space-y-1">
                      {notifHistory.length === 0 ? (
                        <div className="py-6 text-center text-slate-300 text-[10px] font-black uppercase">فارغ</div>
                      ) : (
                        notifHistory.map((notif: any) => (
                          <div key={notif.id} className="p-3 bg-white dark:bg-white/5 rounded-xl text-right">
                            <h4 className="text-[11px] font-black dark:text-white truncate">{notif.title}</h4>
                            <p className="text-[9px] text-slate-400 line-clamp-1">{notif.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Dynamic Badges Row - More compact */}
        <div className="flex items-center gap-2 flex-wrap">
          {isRamadan && ramadanCountdown && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-[10px] font-black shadow-md">
              {ramadanTarget === 'الإفطار' ? <Sunset className="w-3.5 h-3.5 text-orange-300" /> : <Sunrise className="w-3.5 h-3.5 text-amber-300" />}
              <span className="text-white/60">{ramadanTarget}:</span>
              <span className="font-mono tabular-nums">{ramadanCountdown}</span>
            </div>
          )}

          {currentTask && (
            <button
              onClick={handleCurrentTaskClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-black shadow-md hover:bg-indigo-500/30 transition-all group"
            >
              <Star className="w-3.5 h-3.5 text-amber-300 fill-current" />
              <span>{currentTask}</span>
              <ChevronLeft className="w-3 h-3 text-white/40 group-hover:translate-x-[-2px] transition-transform" />
            </button>
          )}

          {userId && (
            <div className="ml-auto">
              <MoodSelector userId={userId} partnerName={partnerName} />
            </div>
          )}
        </div>

        {/* Improved Cards Layout - Compact & Flat */}
        <div className="grid grid-cols-3 gap-3">
          {/* Qibla Card */}
          <button
            onClick={onQiblaClick}
            className="bg-white/10 backdrop-blur-xl rounded-[1.75rem] border border-white/20 flex flex-col items-center justify-center h-20 relative overflow-hidden group hover:bg-white/20 transition-all active:scale-95"
          >
            <div className="scale-110 group-hover:scale-125 transition-transform duration-700">
              <QiblaCompass minimal />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-white/30 absolute bottom-2">القبلة</span>
          </button>

          {/* Progress Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-[1.75rem] border border-white/20 flex items-center justify-center gap-3 h-20 px-3 shadow-md relative group">
            <div className="relative w-11 h-11 shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="22" cy="22" r="19" className="stroke-white/10 fill-none" strokeWidth="4" />
                <motion.circle
                  initial={{ strokeDashoffset: 120 }}
                  animate={{ strokeDashoffset: 120 * (1 - stats.todayProgress / 100) }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  cx="22" cy="22" r="19"
                  className="stroke-amber-400 fill-none"
                  strokeWidth="4"
                  strokeDasharray="120"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black">{stats.todayProgress}%</div>
            </div>
            <div className="hidden sm:block">
              <span className="text-[8px] font-black text-white/40 uppercase block leading-none">الإنجاز</span>
              <span className="text-[11px] font-black block mt-1 tabular-nums">{stats.totalCompleted}/{stats.totalTasks}</span>
            </div>
          </div>

          {/* Partner Card */}
          {hasPartner ? (
            <button
              onClick={onPartnerStatsClick}
              className="bg-emerald-500/10 backdrop-blur-xl rounded-[1.75rem] border border-emerald-500/30 flex items-center justify-center gap-3 h-20 px-3 hover:bg-emerald-500/20 transition-all group shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform relative">
                <Heart className={`w-6 h-6 ${partnerMood ? 'text-pink-400 fill-current' : 'text-white/20'}`} />
                {partnerMood && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white/20 shadow-lg" />}
              </div>
              <div className="hidden sm:block text-right">
                <span className="text-[8px] font-black text-white/40 uppercase block leading-none">الشريك</span>
                <span className={`text-[11px] font-black block mt-1 ${partnerMood ? 'text-emerald-300' : 'text-white/20'}`}>
                  {partnerMood ? 'متصل' : 'غير متصل'}
                </span>
              </div>
            </button>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl rounded-[1.75rem] border border-white/10 flex items-center justify-center h-20 opacity-30">
              <User className="w-7 h-7" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}