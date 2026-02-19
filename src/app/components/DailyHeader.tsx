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

        // Count completed prayers (include Duha + Witr)
        const prayersCompleted = prayers
          ? (prayers.fajr ? 1 : 0) +
          (prayers.dhuhr ? 1 : 0) +
          (prayers.asr ? 1 : 0) +
          (prayers.maghrib ? 1 : 0) +
          (prayers.isha ? 1 : 0) +
          (prayers.duha ? 1 : 0) +
          (prayers.witr ? 1 : 0)
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
        // Base: mulk (1) + kahf on Friday (1) (Ramadan extra pages removed from stat)
        const maxQuranTasks = isFriday ? 2 : 1;
        // Prayers: 5 + 2 (Duha/Witr) (Taraweeh removed from stat)
        const maxPrayers = 7;

        const total =
          prayersCompleted + athkarCompleted + quranCompleted;
        const maxPossible = maxPrayers + 2 + maxQuranTasks; // prayers + 2 athkar + quran tasks
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
    if (!apiPrayerTimes) return;

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

      const fajrMinutes = timeStringToMinutes(apiPrayerTimes.Fajr);
      const dhuhrMinutes = timeStringToMinutes(apiPrayerTimes.Dhuhr);
      const asrMinutes = timeStringToMinutes(apiPrayerTimes.Asr);
      const maghribMinutes = timeStringToMinutes(apiPrayerTimes.Maghrib);
      const ishaMinutes = timeStringToMinutes(apiPrayerTimes.Isha);

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
        } else if (isRamadan && currentMinutes >= ishaMinutes + 20 && currentMinutes < ishaMinutes + 80) { // After Isha in Ramadan - Taraweeh
          current = "صلاة التراويح";
        } else if (isRamadan && currentMinutes >= ishaMinutes + 80 && currentMinutes < ishaMinutes + 180) { // After Taraweeh - 20 pages Quran
          current = "٢٠ صفحة قرآن";
        } else if (currentMinutes >= asrMinutes && currentMinutes < maghribMinutes) { // After Asr, before Maghrib
          current = "أذكار المساء";
        } else if (currentMinutes >= 21 * 60 || currentMinutes < 2 * 60) { // 9 PM to 2 AM
          current = "سورة الملك";
        } else {
          current = null;
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
  }, [apiPrayerTimes, nextHoliday]);

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
    } else if (currentTask === "صلاة التراويح") {
      window.dispatchEvent(new CustomEvent("openQuranSurah", { detail: { surah: "taraweeh" } })); // Or suitable action
    } else if (currentTask === "أذكار الصباح") {
      window.dispatchEvent(new CustomEvent("openAthkar", { detail: { type: "morning" } }));
    } else if (currentTask === "أذكار المساء") {
      window.dispatchEvent(new CustomEvent("openAthkar", { detail: { type: "evening" } }));
    } else if (currentTask === "أدعية الإسراء والمعراج") {
      window.dispatchEvent(new CustomEvent("openAthkar", { detail: { type: "israa_miraj" } }));
    } else if (currentTask === "٢٠ صفحة قرآن") {
      window.dispatchEvent(new CustomEvent("openQuranBookmark"));
    }
  };

  // Format time for the live clock
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Progress ring calculations
  const progressRadius = 28;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressOffset = progressCircumference - (stats.todayProgress / 100) * progressCircumference;

  return (
    <div
      dir="rtl"
      className={`relative bg-gradient-to-br ${timeConfig.headerGradient} rounded-[2rem] p-4 sm:p-6 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] text-white transition-all duration-1000 group border border-white/[0.15] backdrop-blur-2xl ring-1 ring-white/5 overflow-hidden min-h-[200px] flex flex-col justify-between`}
    >
      {/* === PREMIUM ANIMATED BACKGROUND === */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary gradient orb */}
        <motion.div
          animate={{ x: [0, 30, -10, 0], y: [0, -15, 10, 0], opacity: [0.12, 0.22, 0.15, 0.12] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -right-24 w-[350px] h-[350px] bg-white/10 rounded-full blur-[100px]"
        />
        {/* Secondary orb */}
        <motion.div
          animate={{ x: [0, -20, 15, 0], y: [0, 20, -10, 0], opacity: [0.08, 0.16, 0.1, 0.08] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-16 -left-16 w-[250px] h-[250px] bg-indigo-300/10 rounded-full blur-[90px]"
        />
        {/* Accent orb */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-amber-300/8 rounded-full blur-[80px]"
        />
        {/* Islamic geometric pattern overlay (SVG) */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamicPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 0 L60 30 L30 60 L0 30Z" fill="none" stroke="white" strokeWidth="0.5" />
              <circle cx="30" cy="30" r="12" fill="none" stroke="white" strokeWidth="0.5" />
              <path d="M30 18 L42 30 L30 42 L18 30Z" fill="none" stroke="white" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamicPattern)" />
        </svg>
        {/* Subtle stardust texture */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />
        {/* Bottom fade for depth */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/15 to-transparent" />
      </div>

      {/* === TOP BAR: Date Chip + Actions === */}
      <div className="relative z-20 flex items-center justify-between w-full mb-3">
        {/* Date chip (top right in RTL) */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.06]">
            {(() => {
              const iconClass = "w-3 h-3";
              switch (timeConfig.icon) {
                case 'sunrise': return <Sunrise className={`${iconClass} text-amber-300`} />;
                case 'sun': return <Sun className={`${iconClass} text-amber-400`} />;
                case 'cloud-sun': return <CloudSun className={`${iconClass} text-sky-200`} />;
                case 'sunset': return <Sunset className={`${iconClass} text-orange-400`} />;
                case 'moon': return <Moon className={`${iconClass} text-indigo-200`} />;
                default: return <Sun className={`${iconClass} text-amber-400`} />;
              }
            })()}
            <span className="text-[9px] font-bold text-white/35 tracking-wide">{isRamadan ? `رمضان ${ramadanDay} · ${dayName}` : `${dayName} · ${day} ${month}`}</span>
          </div>
        </motion.div>

        {/* Left side: Actions */}
        <div className="flex items-center gap-2">
          {/* Live Clock Chip */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setShowRealTime(!showRealTime)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.12] transition-all active:scale-95"
          >
            <Clock className="w-3 h-3 text-white/40" />
            <AnimatePresence mode="wait">
              {showRealTime ? (
                <motion.span
                  key="date"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[10px] font-bold text-white/60 tabular-nums"
                >
                  {dayName} {day} {month}
                </motion.span>
              ) : (
                <motion.span
                  key="time"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[11px] font-black text-white/70 tabular-nums tracking-wider font-mono"
                >
                  {formattedTime}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Settings */}
          <button
            onClick={onSettingsClick}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.14] transition-all active:scale-95 group/btn"
          >
            <Settings className="w-4 h-4 text-white/50 group-hover/btn:rotate-90 transition-transform duration-700" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifHistory(!showNotifHistory)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border backdrop-blur-xl ${showNotifHistory ? 'bg-white/20 border-white/15' : 'bg-white/[0.07] border-white/[0.08] hover:bg-white/[0.14]'} active:scale-95`}
            >
              <Bell className="w-4 h-4 text-white/50" />
              {hasUnreadNotifs && (
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                />
              )}
            </button>

            <AnimatePresence>
              {showNotifHistory && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute top-[calc(100%+8px)] left-0 w-[290px] bg-slate-950/95 backdrop-blur-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] rounded-2xl z-[100] border border-white/[0.08] overflow-hidden"
                >
                  <div className="p-3 bg-white/[0.03] border-b border-white/[0.05] flex justify-between items-center px-4">
                    <span className="text-[9px] font-black uppercase text-white/30 tracking-[0.15em]">الإشعارات</span>
                    <button onClick={clearHistory} className="text-[8px] font-bold text-rose-400/70 hover:text-rose-400 transition-colors">مسح</button>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto p-2 space-y-1">
                    {notifHistory.length === 0 ? (
                      <div className="py-10 text-center text-[9px] font-black uppercase text-white/[0.06] tracking-[0.2em]">فارغ</div>
                    ) : (
                      notifHistory.map((notif: any, i: number) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="p-3 bg-white/[0.03] hover:bg-white/[0.07] rounded-xl transition-all border border-white/[0.04] text-right cursor-default"
                        >
                          <h4 className="text-[11px] font-black text-white/80 mb-0.5">{notif.title}</h4>
                          <p className="text-[9px] text-white/30 leading-relaxed">{notif.body}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* === HERO GREETING SECTION === */}
      <div className="relative z-10 flex flex-col items-start w-full flex-1 justify-center px-1 sm:px-2">

        {/* Main Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 120 }}
          className="text-[1.65rem] sm:text-3xl font-black tracking-tight leading-[1.2] text-right w-full flex items-center justify-start gap-3"
        >
          <span className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.15)]">{displayedText}</span>
          {!isTypingComplete && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="inline-block w-[2px] h-6 bg-white/60 rounded-full"
            />
          )}
          {isRamadan && isTypingComplete && (
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
            >
              <motion.div
                animate={{ rotate: [0, 8, -8, 0], y: [0, -2, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Moon className="w-7 h-7 text-amber-400 fill-current drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
              </motion.div>
            </motion.div>
          )}
        </motion.h1>

        {/* Time of day message */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-[11px] sm:text-xs text-white/30 font-medium mt-1.5 tracking-wide"
        >
          {timeConfig.message}
        </motion.p>
      </div>

      {/* === BOTTOM BADGES === */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="relative z-10 flex flex-wrap items-center justify-start gap-2.5 mt-4 w-full"
      >
        {isRamadan && ramadanCountdown && (
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.08] text-[10px] font-black shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] hover:bg-white/[0.12] transition-all cursor-default"
          >
            {ramadanTarget === 'الإفطار' ? (
              <Sunset className="w-4 h-4 text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.4)]" />
            ) : (
              <Sunrise className="w-4 h-4 text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.4)]" />
            )}
            <span className="text-white/40">{ramadanTarget}</span>
            <div className="w-px h-3 bg-white/10" />
            <span className="font-mono text-white/90 tracking-tight text-[11px]">{ramadanCountdown}</span>
          </motion.div>
        )}

        {currentTask && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCurrentTaskClick}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-500/[0.1] backdrop-blur-xl border border-indigo-400/[0.12] text-[10px] font-black shadow-[0_4px_20px_-4px_rgba(99,102,241,0.15)] hover:bg-indigo-500/[0.18] transition-all group/task"
          >
            <Star className="w-3.5 h-3.5 text-amber-300 fill-current drop-shadow-[0_0_6px_rgba(252,211,77,0.3)]" />
            <span className="text-white/80 max-w-[130px] truncate">{currentTask}</span>
            <ChevronLeft className="w-3 h-3 text-white/20 group-hover/task:-translate-x-0.5 transition-transform" />
          </motion.button>
        )}

        {/* Stats mini badge */}
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/[0.05] border border-white/[0.05] text-[9px] font-bold text-white/25">
          <Check className="w-3 h-3" />
          <span>{stats.totalCompleted}/{stats.totalTasks}</span>
        </div>
      </motion.div>
    </div>
  );
}
