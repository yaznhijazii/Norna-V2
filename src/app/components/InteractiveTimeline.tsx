import { useState, useEffect } from "react";
import { Sunrise, Sun, Sunset, Moon, Book, BookOpen, Calendar, Check, ChevronLeft, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const prayerTimes = usePrayerTimes();

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const completedCount = Object.values(completionStatus).filter(Boolean).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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
    if (prayerTimes && currentUserId) loadTasks(currentUserId);
  }, [prayerTimes, currentTime, currentUserId]);

  const loadTasks = async (userId: string) => {
    if (!prayerTimes) return;
    const isFriday = new Date().getDay() === 5;

    const allTasks: TimelineTask[] = [
      { id: "fajr", title: "صلاة الفجر", time: prayerTimes.Fajr, timeValue: convertToMinutes(prayerTimes.Fajr), icon: Sunrise, isActive: false, isPast: false, type: "prayer", storageField: "fajr" },
      { id: "athkar-morning", title: "أذكار الصباح", time: "بعد الفجر", timeValue: convertToMinutes(prayerTimes.Fajr) + 30, icon: Book, isActive: false, isPast: false, type: "athkar" },
      { id: "baqarah", title: "سورة البقرة", time: `ص ${Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000) % 604 + 1}`, timeValue: convertToMinutes(prayerTimes.Fajr) + 60, icon: BookOpen, isActive: false, isPast: false, type: "quran", storageField: "baqarah" },
      ...(isFriday ? [{ id: "kahf", title: "سورة الكهف", time: "الجمعة", timeValue: convertToMinutes(prayerTimes.Dhuhr) - 60, icon: BookOpen, isActive: false, isPast: false, type: "quran" as const, storageField: "kahf" }] : []),
      { id: "dhuhr", title: "صلاة الظهر", time: prayerTimes.Dhuhr, timeValue: convertToMinutes(prayerTimes.Dhuhr), icon: Sun, isActive: false, isPast: false, type: "prayer" as const, storageField: "dhuhr" },
      { id: "asr", title: "صلاة العصر", time: prayerTimes.Asr, timeValue: convertToMinutes(prayerTimes.Asr), icon: Sun, isActive: false, isPast: false, type: "prayer" as const, storageField: "asr" },
      { id: "maghrib", title: "صلاة المغرب", time: prayerTimes.Maghrib, timeValue: convertToMinutes(prayerTimes.Maghrib), icon: Sunset, isActive: false, isPast: false, type: "prayer" as const, storageField: "maghrib" },
      { id: "athkar-evening", title: "أذكار المساء", time: "المغرب", timeValue: convertToMinutes(prayerTimes.Maghrib) + 30, icon: Book, isActive: false, isPast: false, type: "athkar" as const },
      { id: "isha", title: "صلاة العشاء", time: prayerTimes.Isha, timeValue: convertToMinutes(prayerTimes.Isha), icon: Moon, isActive: false, isPast: false, type: "prayer" as const, storageField: "isha" },
      { id: "mulk", title: "سورة الملك", time: "النوم", timeValue: 23 * 60 + 58, icon: BookOpen, isActive: false, isPast: false, type: "quran" as const, storageField: "mulk" }
    ];

    allTasks.sort((a, b) => a.timeValue - b.timeValue);
    let activeIdx = allTasks.findIndex(t => t.timeValue > currentMinutes) - 1;
    if (activeIdx < 0) activeIdx = allTasks.length - 1;

    allTasks.forEach((task, index) => {
      task.isActive = index === activeIdx;
      task.isPast = index < activeIdx;
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

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentUserId) return;

    const newStatus = !completionStatus[taskId];

    if (task.type === 'prayer') {
      await updatePrayer(currentUserId, task.storageField!, newStatus);
    } else if (task.type === 'quran' && task.storageField) {
      const targetPage = task.storageField === 'baqarah' ? (new Date().getDay() === 6 ? 1 : new Date().getDay() + 2) : 1;
      await updateQuranProgress(currentUserId, task.storageField, targetPage, 0, newStatus);
    } else if (task.type === 'athkar') {
      await updateAthkarProgress(currentUserId, task.id === 'athkar-morning' ? 'morning' : 'evening', newStatus);
    }

    setCompletionStatus(prev => ({ ...prev, [taskId]: newStatus }));
    window.dispatchEvent(new Event("storage"));
    if (newStatus) confetti({ particleCount: 20, spread: 30, origin: { y: 0.8 } });
  };

  const handleTaskClick = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentUserId) return;

    if (task.type === 'prayer') {
      handleToggleTask(taskId);
    } else {
      if (task.type === 'quran' && task.storageField) {
        window.dispatchEvent(new CustomEvent('openQuranSurah', { detail: { surah: task.storageField, openTodayPage: task.storageField === 'baqarah' } }));
      } else if (task.type === 'athkar') {
        window.dispatchEvent(new CustomEvent('openAthkar', { detail: { type: task.id === 'athkar-morning' ? 'morning' : 'evening' } }));
      }
    }
  };

  const activeIndex = tasks.findIndex(t => t.isActive);
  const visibleTasks = isExpanded
    ? tasks
    : tasks.filter((_, idx) => idx >= activeIndex - 1 && idx <= activeIndex + 1);

  return (
    <div className="relative space-y-4" dir="rtl">
      {/* Improved Header Section - Not a Card anymore */}
      <div className="flex flex-col gap-5 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">الخطة اليومية</h2>
                {progressPercent === 100 && <Sparkles className="w-4 h-4 text-amber-500" />}
              </div>
              <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400/80 uppercase tracking-widest mt-1">
                تم إنجاز {progressPercent.toFixed(0)}% من مهام اليوم
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
          >
            <span>{isExpanded ? 'طيّ' : 'عرض الكل'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Dynamic Progress Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-emerald-500"
            />
          </div>
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">%{progressPercent.toFixed(0)}</span>
        </div>
      </div>

      {/* Task List Section */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visibleTasks.map((task, index) => {
            const Icon = task.icon;
            const isCompleted = completionStatus[task.id];

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative"
              >
                <button
                  onClick={() => handleTaskClick(task.id)}
                  onDoubleClick={() => handleToggleTask(task.id)}
                  className={`
                    w-full flex items-center gap-3 p-4 rounded-[1.75rem] border transition-all duration-500 text-right
                    ${task.isActive
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.3)] scale-[1.02] z-10'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm'
                    }
                    ${isCompleted && !task.isActive ? 'grayscale opacity-60' : ''}
                  `}
                >
                  {/* Task Icon */}
                  <div className={`
                    w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                    ${task.isActive
                      ? 'bg-white/20 backdrop-blur-md text-white'
                      : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                    }
                  `}>
                    {isCompleted ? <Check className="w-6 h-6 stroke-[3]" /> : <Icon className="w-5 h-5" />}
                  </div>

                  {/* Task Text Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-start leading-none">
                        <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${task.isActive ? 'text-white/70' : 'text-slate-400'}`}>
                          {task.isActive ? 'الآن وبقوة' : task.isPast ? 'مضى' : 'قادماً'}
                        </span>
                        <h3 className={`font-black text-[15px] ${task.isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                          {task.title}
                        </h3>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className={`text-[11px] font-black tabular-nums ${task.isActive ? 'text-white/80' : 'text-slate-400'}`}>
                          {task.time}
                        </span>
                        {task.type === 'quran' && !isCompleted && (
                          <span className={`text-[8px] font-black mt-1 px-1.5 py-0.5 rounded-md ${task.isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'}`}>
                            وِرد يومي
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Link for Quran/Athkar */}
                  {(task.type === 'quran' || task.type === 'athkar') && !isCompleted && (
                    <ChevronLeft className={`w-5 h-5 ${task.isActive ? 'text-white' : 'text-slate-300'}`} />
                  )}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {!isExpanded && tasks.length > visibleTasks.length && (
        <div className="flex items-center justify-center gap-2 pt-1 opacity-40">
          <div className="w-1 h-1 rounded-full bg-slate-400" />
          <div className="w-1 h-1 rounded-full bg-slate-400" />
          <div className="w-1 h-1 rounded-full bg-slate-400" />
        </div>
      )}
    </div>
  );
}

function convertToMinutes(time: string): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}