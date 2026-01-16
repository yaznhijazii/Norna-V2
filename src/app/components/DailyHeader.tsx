import { useState, useEffect, useCallback } from "react";
import { BookOpen, X, Loader2, Check, RotateCcw, Bookmark, Star, Play, Pause, Flame, Users, Award, Heart, ArrowDown, Calendar, ArrowLeft, ChevronRight, ChevronLeft, Plus, Trash2, User, BookHeart, Edit2, Bell, Trash, Clock, Lock, Settings, Sunrise, Sun, CloudSun, Sunset, Moon } from 'lucide-react';
import { InAppNotification } from './NotificationBanner';
import { motion, AnimatePresence } from 'motion/react';
import { TasbihIcon } from './TasbihIcon';
import { useTimeOfDay, timeOfDayConfig } from "../hooks/useTimeOfDay";
import { QiblaCompass } from "./QiblaCompass";
import { MoodSelector } from "./MoodSelector";
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
  const greetingText = `السلام عليكم ورحمة الله ${firstName ? `يا ${firstName}` : ""} `;

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
      className={`relative bg-gradient-to-br ${timeConfig.headerGradient} rounded-[1.75rem] p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-white transition-all duration-1000 overflow-hidden group border border-white/40 animate-gradient backdrop-blur-2xl ring-1 ring-white/20`}
    >
      {/* Dynamic Background Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="floating-particle opacity-20 bg-white"></div>
        <div className="floating-particle opacity-10 bg-white"></div>
        <div className="floating-particle opacity-25 bg-white"></div>
        <div className="floating-particle opacity-15 bg-white"></div>
        <div className="floating-particle opacity-20 bg-white"></div>
        <div className="floating-particle opacity-10 bg-white"></div>
      </div>

      {/* Premium Glass Effect Overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>

      {/* Decorative Aura */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"></div>

      {/* Starry Background for Night Mode */}
      {timeOfDay === 'night' && (
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      )}

      <div className="relative z-10 space-y-4">
        {/* Top & Mid: Compact Greeting Row */}
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-2xl flex items-center justify-center text-2xl shadow-xl border border-white/30 shrink-0"
            >
              {(() => {
                switch (timeConfig.icon) {
                  case 'sunrise': return <Sunrise className="w-7 h-7 text-amber-300" />;
                  case 'sun': return <Sun className="w-7 h-7 text-amber-400" />;
                  case 'cloud-sun': return <CloudSun className="w-7 h-7 text-sky-300" />;
                  case 'sunset': return <Sunset className="w-7 h-7 text-orange-400" />;
                  case 'moon': return <Moon className="w-7 h-7 text-indigo-200" />;
                  default: return <Sun className="w-7 h-7" />;
                }
              })()}
            </motion.div>
            {/* Header Text Section with Click Handler */}
            <div className="space-y-1 cursor-pointer" onClick={() => setShowRealTime(!showRealTime)}>
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{timeConfig.name}</span>
                <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                <span className="text-[11px] font-bold text-white/90">{dayName}، {day} {month}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight min-h-[40px] flex items-center">
                {showRealTime ? (
                  <span className="font-mono tracking-widest text-3xl tabular-nums">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).replace('AM', 'ص').replace('PM', 'm')}
                  </span>
                ) : (
                  <>
                    {displayedText}
                    {!isTypingComplete && <span className="animate-pulse text-amber-300 ml-1">|</span>}
                  </>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSettingsClick}
              className="w-11 h-11 flex items-center justify-center rounded-2xl transition-all bg-white/10 border border-white/20 hover:bg-white/25 hover:scale-105 active:scale-95 shadow-xl backdrop-blur-md"
            >
              <Settings className="w-5 h-5 text-white/90" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowNotifHistory(!showNotifHistory)}
                className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all relative border backdrop-blur-md ${showNotifHistory ? 'bg-white/30 border-white/40 scale-105 shadow-2xl' : 'bg-white/10 border-white/20 hover:bg-white/25 hover:scale-105 active:scale-95 shadow-xl'}`}
              >
                <Bell className="w-5 h-5 text-white/90" />
                {hasUnreadNotifs && (
                  <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse"></span>
                )}
              </button>
              {/* Notification History Popover */}
              <AnimatePresence>
                {showNotifHistory && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute top-[calc(100%+12px)] left-0 w-[300px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[2rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] z-[9999] border border-white dark:border-white/10 overflow-hidden"
                  >
                    <div className="px-3 py-1.5 bg-gradient-to-r from-slate-50 to-white dark:from-white/5 dark:to-transparent border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                        <h3 className="font-black text-[8px] text-slate-800 dark:text-white uppercase tracking-[0.1em]">التنبيهات</h3>
                      </div>
                      {notifHistory.length > 0 && (
                        <button
                          onClick={clearHistory}
                          className="text-[9px] font-black text-rose-500 hover:text-rose-600 transition-all hover:scale-105 active:scale-95 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full uppercase tracking-wider"
                        >
                          مسح
                        </button>
                      )}
                    </div>

                    <div className="max-h-[140px] overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                      {notifHistory.length === 0 ? (
                        <div className="py-3 text-center">
                          <div className="relative inline-block mb-1">
                            <div className="absolute inset-0 bg-slate-100 dark:bg-white/5 blur-2xl rounded-full scale-150"></div>
                            <div className="relative w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-50 dark:border-white/5 mx-auto">
                              <Bell className="w-6 h-6 text-slate-200 dark:text-slate-700" />
                            </div>
                          </div>
                          <p className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-wider">لا توجد تنبيهات حالياً</p>
                          <p className="text-slate-300 dark:text-slate-600 text-[9px] mt-1">سنطلعك على كل جديد هنا</p>
                        </div>
                      ) : (
                        notifHistory.map((notif: any) => (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-[1.5rem] transition-all flex gap-4 items-start group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-white/5"
                          >
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-110 group-hover:rotate-3 ${notif.type === 'gift' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 shadow-rose-100/50' :
                              notif.type === 'prayer' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 shadow-emerald-100/50' :
                                'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 shadow-indigo-100/50'
                              }`}>
                              {notif.type === 'gift' ? <Heart className="w-5 h-5 fill-current" /> :
                                notif.type === 'prayer' ? <Star className="w-5 h-5 fill-current" /> :
                                  <Bell className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0 flex-1 py-0.5">
                              <div className="flex items-center justify-between mb-0.5">
                                <h4 className="text-[12px] font-black text-slate-800 dark:text-white truncate">{notif.title}</h4>
                                <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase">
                                  {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{notif.body}</p>
                            </div>
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

        <div className="flex items-center gap-4 flex-wrap">
          {currentTask && (
            <motion.button
              onClick={handleCurrentTaskClick}
              whileHover={{ scale: 1.03, x: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg shadow-md transition-all group border relative overflow-hidden text-[10px] font-black tracking-tight
                  ${currentTask.includes('الإسراء')
                  ? 'bg-indigo-500/80 border-indigo-400/40 text-white'
                  : 'bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15'}`}
            >
              <div className="relative z-10 flex items-center gap-1.5">
                <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center ${currentTask.includes('الإسراء') ? 'bg-white/20' : 'bg-white/10'}`}>
                  {currentTask.includes('صلاة') ? <Clock className="w-2.5 h-2.5" /> : <Star className="w-2.5 h-2.5 fill-current" />}
                </div>
                <span className="opacity-90">{currentTask}</span>
                <ChevronLeft className="w-3 h-3 group-hover:translate-x-[-2px] transition-transform text-white/50" />
              </div>
            </motion.button>
          )}

          {userId && (
            <MoodSelector userId={userId} partnerName={partnerName} />
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Card 1: Qibla */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 flex flex-col items-center justify-center h-24 shadow-2xl overflow-hidden group/qibla relative"
          >
            <div className="scale-[1.2] transition-transform group-hover/qibla:scale-[1.3] duration-700">
              <QiblaCompass minimal />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 absolute bottom-3">القبلة</span>
          </motion.div>

          {/* Card 2: Progress */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 flex items-center justify-center gap-3 h-24 px-4 shadow-2xl relative overflow-hidden"
          >
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-full h-full -rotate-90 filter drop-shadow-[0_0_8px_rgba(252,211,77,0.3)]">
                <circle cx="24" cy="24" r="21" className="stroke-white/10 fill-none" strokeWidth="4" />
                <motion.circle
                  initial={{ strokeDashoffset: 2 * Math.PI * 21 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 21 * (1 - stats.todayProgress / 100) }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  cx="24" cy="24" r="21"
                  className="stroke-amber-300 fill-none"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 21}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black tabular-nums">{stats.todayProgress}%</div>
            </div>
            <div className="hidden sm:block">
              <span className="text-[9px] font-black uppercase tracking-wider text-white/60 block leading-none">إنجاز اليوم</span>
              <span className="text-[12px] font-black block mt-1.5 tabular-nums text-white/90">{stats.totalCompleted}/{stats.totalTasks}</span>
            </div>
            <div className="absolute -right-2 -top-2 w-12 h-12 bg-white/5 rounded-full blur-xl"></div>
          </motion.div>

          {/* Card 3: Partner */}
          {hasPartner && onPartnerStatsClick ? (
            <motion.button
              onClick={onPartnerStatsClick}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-emerald-500/10 backdrop-blur-2xl rounded-3xl border border-emerald-500/30 flex items-center justify-center gap-3 h-24 px-4 hover:bg-emerald-500/20 transition-all group shadow-2xl relative overflow-hidden text-right"
            >
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 overflow-hidden relative">
                {partnerMood?.mood ? (() => {
                  const mood = moods.find(m => m.id === partnerMood.mood);
                  return (
                    <Heart
                      className={`w-7 h-7 ${mood?.color || 'text-pink-400'}`}
                      fill="currentColor"
                      style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
                    />
                  );
                })() : (
                  <Heart className="w-6 h-6 text-pink-400/40" />
                )}
              </div>
              <div className="hidden sm:block">
                <span className="text-[9px] font-black uppercase tracking-wider text-white/60 block leading-none">الشريك</span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {partnerMood && (() => {
                    const last = new Date(partnerMood.updatedAt);
                    const today = new Date();
                    const isUpdatedToday = last.getDate() === today.getDate() &&
                      last.getMonth() === today.getMonth() &&
                      last.getFullYear() === today.getFullYear();

                    return isUpdatedToday ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                        <span className="text-[11px] font-black text-emerald-300 tracking-wide">متصل</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full opacity-50"></span>
                        <span className="text-[11px] font-black text-white/30 tracking-wide">غير متصل</span>
                      </>
                    );
                  })()}
                  {!partnerMood && (
                    <>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full opacity-50"></span>
                      <span className="text-[11px] font-black text-white/30 tracking-wide">غير متصل</span>
                    </>
                  )}
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl"></div>
            </motion.button>
          ) : (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 flex items-center justify-center h-24 opacity-40 shadow-xl"
            >
              <User className="w-7 h-7" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}