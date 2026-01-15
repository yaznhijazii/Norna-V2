import { useState, useEffect, useRef } from "react";
import { Sunrise, Sun, Sunset, Moon, Book, BookOpen, Clock, Calendar, Check, ChevronLeft, AlertCircle } from "lucide-react";
import { usePrayerTimes } from "../hooks/usePrayerTimes";
import { motion, AnimatePresence } from "motion/react";
import confetti from 'canvas-confetti';
import {
  getTodayPrayers,
  updatePrayer,
  getTodayQuranProgress,
  updateQuranProgress,
  getTodayAthkarProgress,
  updateAthkarProgress
} from "../utils/db";

interface TimelineTask {
  id: string;
  title: string;
  time: string;
  timeValue: number;
  icon: any;
  isActive: boolean;
  isPast: boolean;
  type: "prayer" | "athkar" | "quran";
  storageField?: string;
}

interface InteractiveTimelineProps {
  userId?: string;
}

export function InteractiveTimeline({ userId }: InteractiveTimelineProps) {
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});
  const [nextPrayerCountdown, setNextPrayerCountdown] = useState<string>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const clickTimerRef = useRef<{ [key: string]: { count: number; timer: NodeJS.Timeout | null } }>({});
  const prayerTimes = usePrayerTimes();

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const getCurrentUserId = () => {
    if (userId) return userId;
    try {
      const userStr = localStorage.getItem('nooruna_user');
      if (userStr) return JSON.parse(userStr).id;
    } catch (e) { }
    return null;
  };

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const prayers = tasks.filter(t => t.type === 'prayer' && !completionStatus[t.id]);
    const nextPrayer = prayers.find(p => p.timeValue > currentMinutes);
    if (nextPrayer) {
      const diff = nextPrayer.timeValue - currentMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      setNextPrayerCountdown(`${nextPrayer.title} بعد ${hours > 0 ? hours + 'س ' : ''}${mins}د`);
    } else {
      setNextPrayerCountdown('');
    }
  }, [tasks, currentMinutes, completionStatus]);

  useEffect(() => {
    if (prayerTimes && currentUserId) loadTasks(currentUserId);
  }, [prayerTimes, currentTime, currentUserId]);

  const loadTasks = async (userId: string) => {
    if (!prayerTimes) return;

    const isFriday = new Date().getDay() === 5;

    const allTasks: TimelineTask[] = [
      { id: "fajr", title: "صلاة الفجر", time: prayerTimes.Fajr, timeValue: convertToMinutes(prayerTimes.Fajr), icon: Sunrise, isActive: false, isPast: false, type: "prayer", storageField: "fajr" },
      { id: "athkar-morning", title: "أذكار الصباح", time: "بعد الفجر", timeValue: convertToMinutes(prayerTimes.Fajr) + 30, icon: Book, isActive: false, isPast: false, type: "athkar" },
      { id: "baqarah", title: "سورة البقرة", time: `صفحة ${Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000) % 604 + 1}`, timeValue: convertToMinutes(prayerTimes.Fajr) + 60, icon: BookOpen, isActive: false, isPast: false, type: "quran", storageField: "baqarah" },
      ...(isFriday ? [{ id: "kahf", title: "سورة الكهف", time: "يوم الجمعة", timeValue: convertToMinutes(prayerTimes.Dhuhr) - 60, icon: BookOpen, isActive: false, isPast: false, type: "quran" as const, storageField: "kahf" }] : []),
      { id: "dhuhr", title: "صلاة الظهر", time: prayerTimes.Dhuhr, timeValue: convertToMinutes(prayerTimes.Dhuhr), icon: Sun, isActive: false, isPast: false, type: "prayer" as const, storageField: "dhuhr" },
      { id: "asr", title: "صلاة العصر", time: prayerTimes.Asr, timeValue: convertToMinutes(prayerTimes.Asr), icon: Sun, isActive: false, isPast: false, type: "prayer" as const, storageField: "asr" },
      { id: "maghrib", title: "صلاة المغرب", time: prayerTimes.Maghrib, timeValue: convertToMinutes(prayerTimes.Maghrib), icon: Sunset, isActive: false, isPast: false, type: "prayer" as const, storageField: "maghrib" },
      { id: "athkar-evening", title: "أذكار المساء", time: "بعد المغرب", timeValue: convertToMinutes(prayerTimes.Maghrib) + 30, icon: Book, isActive: false, isPast: false, type: "athkar" as const },
      { id: "isha", title: "صلاة العشاء", time: prayerTimes.Isha, timeValue: convertToMinutes(prayerTimes.Isha), icon: Moon, isActive: false, isPast: false, type: "prayer" as const, storageField: "isha" },
      { id: "mulk", title: "سورة الملك", time: "قبل النوم", timeValue: 23 * 60 + 58, icon: BookOpen, isActive: false, isPast: false, type: "quran" as const, storageField: "mulk" }
    ];

    allTasks.sort((a, b) => a.timeValue - b.timeValue);
    let currentActiveIndex = -1;
    for (let i = 0; i < allTasks.length; i++) {
      if (currentMinutes >= allTasks[i].timeValue) currentActiveIndex = i;
    }

    allTasks.forEach((task, index) => {
      if (index === currentActiveIndex) { task.isActive = true; task.isPast = false; }
      else if (index < currentActiveIndex) { task.isActive = false; task.isPast = true; }
    });

    setTasks(allTasks);

    const status: Record<string, boolean> = {};
    try {
      const [prayers, quranList, athkarList] = await Promise.all([
        getTodayPrayers(userId),
        getTodayQuranProgress(userId),
        getTodayAthkarProgress(userId),
      ]);
      allTasks.forEach((task) => {
        if (task.type === "prayer" && task.storageField) status[task.id] = prayers?.[task.storageField] || false;
        else if (task.type === "quran" && task.storageField) status[task.id] = quranList?.find((q: any) => q.surah === task.storageField)?.completed || false;
        else if (task.type === "athkar") status[task.id] = athkarList?.find((a: any) => a.type === (task.id === 'athkar-morning' ? 'morning' : 'evening'))?.completed || false;
      });
    } catch (e) { }
    setCompletionStatus(status);
  };

  const handleTaskClick = async (taskId: string, e: React.MouseEvent) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentUserId) return;

    if (!clickTimerRef.current[taskId]) clickTimerRef.current[taskId] = { count: 0, timer: null };
    const clickData = clickTimerRef.current[taskId];
    clickData.count++;
    if (clickData.timer) clearTimeout(clickData.timer);

    if (clickData.count === 1) {
      clickData.timer = setTimeout(async () => {
        if (task.type === 'prayer') {
          const newStatus = !completionStatus[taskId];
          await updatePrayer(currentUserId, task.storageField!, newStatus);
          setCompletionStatus({ ...completionStatus, [taskId]: newStatus });
          window.dispatchEvent(new Event("storage"));
          if (newStatus) confetti({ particleCount: 30, spread: 30, origin: { y: 0.7 } });
        } else if (task.type === 'quran' || task.type === 'athkar') {
          if (!completionStatus[taskId]) {
            if (task.type === 'quran' && task.storageField) {
              window.dispatchEvent(new CustomEvent('openQuranSurah', { detail: { surah: task.storageField, openTodayPage: task.storageField === 'baqarah' } }));
            } else if (task.type === 'athkar') {
              window.dispatchEvent(new CustomEvent('openAthkar', { detail: { type: task.id === 'athkar-morning' ? 'morning' : 'evening' } }));
            }
          } else {
            if (task.type === 'athkar') await updateAthkarProgress(currentUserId, task.id === 'athkar-morning' ? 'morning' : 'evening', false);
            else await updateQuranProgress(currentUserId, task.storageField as any, 0, 0, false);
            setCompletionStatus({ ...completionStatus, [taskId]: false });
            window.dispatchEvent(new Event("storage"));
          }
        }
        clickData.count = 0;
      }, 300);
    } else if (clickData.count === 2) {
      clearTimeout(clickData.timer!);
      clickData.count = 0;
      if (!completionStatus[taskId]) {
        if (task.type === 'athkar') await updateAthkarProgress(currentUserId, task.id === 'athkar-morning' ? 'morning' : 'evening', true);
        else if (task.type === 'quran' && task.storageField) await updateQuranProgress(currentUserId, task.storageField as any, 100, 0, true);
        setCompletionStatus({ ...completionStatus, [taskId]: true });
        window.dispatchEvent(new Event("storage"));
        confetti({ particleCount: 60, spread: 50 });
      }
    }
  };

  return (
    <div className="premium-card p-5 sm:p-6 backdrop-blur-3xl sticky top-4 border-white/50 dark:border-white/10 dark:bg-slate-900/40 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">الخطة اليومية</h2>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">خطة يومك المبارك</p>
          </div>
        </div>
        {nextPrayerCountdown && (
          <div className="flex items-center gap-2 text-[11px] font-black text-white bg-amber-500 px-4 py-2 rounded-full shadow-lg border border-white/20">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>{nextPrayerCountdown}</span>
          </div>
        )}
      </div>

      <div
        className="relative custom-scrollbar max-h-[520px] overflow-y-auto overflow-x-hidden px-1 py-2"
        ref={scrollContainerRef}
      >
        <div className="space-y-3 relative pr-10 pl-1">
          {/* Vertical line specifically placed - Aligned with dots */}
          <div className="absolute right-[20px] top-0 bottom-0 w-px border-r border-dotted border-slate-300 dark:border-white/20" />

          <AnimatePresence>
            {tasks.map((task, index) => {
              const Icon = task.icon;
              const isCompleted = completionStatus[task.id];
              const nextTask = index < tasks.length - 1 ? tasks[index + 1] : null;
              const isMissed = task.isPast && !isCompleted && nextTask && currentMinutes >= (nextTask.timeValue - 2);

              return (
                <div key={task.id} className="relative">
                  {/* Timeline Dot - Perfectly centered on the line */}
                  <div className="absolute right-[-32px] top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-6 h-6">
                    <motion.div
                      animate={task.isActive ? { scale: [1, 1.3, 1] } : {}}
                      transition={task.isActive ? { repeat: Infinity, duration: 2 } : {}}
                      className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-md shrink-0 aspect-square
                          ${isCompleted ? 'bg-emerald-500' :
                          task.isActive ? 'bg-amber-500' :
                            isMissed ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'}
                        `}
                    />
                  </div>

                  <motion.button
                    onClick={(e) => handleTaskClick(task.id, e)}
                    whileHover={{ x: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 border text-right relative overflow-hidden
                      ${task.isActive
                        ? 'bg-white dark:bg-slate-800/60 border-amber-300 dark:border-amber-500/40 shadow-xl shadow-amber-500/5'
                        : isCompleted
                          ? 'bg-slate-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10'
                          : isMissed
                            ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/10'
                            : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 hover:border-emerald-400/30'
                      }
                      ${task.isActive ? 'ring-1 ring-amber-500/10' : ''}
                    `}
                  >
                    {/* Icon Section */}
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0
                      ${isCompleted
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : task.isActive
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                          : isMissed
                            ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-500'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }
                    `}>
                      {isCompleted ? <Check className="w-5.5 h-5.5 stroke-[3]" /> : <Icon className={`w-5 h-5 ${task.isActive ? 'animate-pulse' : ''}`} />}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-black text-[14px] transition-colors leading-none ${isCompleted ? 'text-slate-400 dark:text-slate-500' :
                          task.isActive ? 'text-amber-900 dark:text-amber-100' :
                            isMissed ? 'text-rose-900 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'
                          }`}>
                          {task.title}
                        </h3>
                        {task.isActive && !isCompleted && (
                          <span className="text-[8px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-md animate-pulse">الآن</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                          {task.time}
                        </span>
                        {task.type === 'quran' && !isCompleted && (
                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/10">ورد</span>
                        )}
                        {isMissed && (
                          <span className="text-[9px] font-black text-rose-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> فائتة
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Arrow */}
                    {(task.type === 'quran' || task.type === 'athkar') && !isCompleted && (
                      <ChevronLeft className="w-4.5 h-4.5 text-slate-300" />
                    )}
                  </motion.button>
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function convertToMinutes(time: string): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}