import { useState, useEffect } from 'react';
import { User, Trophy, Sparkles } from 'lucide-react';
import { getTodayPrayers, getTodayQuranProgress, getTodayAthkarProgress } from '../utils/db';
import { supabase } from '../utils/supabase';
import { motion } from 'motion/react';

interface UserStats {
  userId: string;
  username: string;
  avatar?: string;
  totalTasks: number;
  completedTasks: number;
  streakCount?: number;
  lastLogin?: string;
  prayers: { total: number; completed: number };
  quran: { total: number; completed: number };
  athkar: { total: number; completed: number };
}

interface DailyPartnerStatsProps {
  currentUserId: string;
  partnerId?: string;
  partnerData?: any;
}

export function DailyPartnerStats({ currentUserId, partnerId, partnerData }: DailyPartnerStatsProps) {
  const [partnerStats, setPartnerStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (partnerId) {
      loadPartnerStats();
      // Increased interval to reduce DB load
      const interval = setInterval(loadPartnerStats, 120000); // 2 minutes instead of 1
      return () => clearInterval(interval);
    }
  }, [partnerId]);

  const loadPartnerStats = async () => {
    if (!partnerId) return;
    try {
      // Parallel fetch tasks ONLY (No more redundant user fetching)
      const [prayers, quranList, athkarList] = await Promise.all([
        getTodayPrayers(partnerId),
        getTodayQuranProgress(partnerId),
        getTodayAthkarProgress(partnerId),
      ]);

      const completedPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].filter(p => prayers?.[p]).length;
      const completedQuran = quranList?.filter((q: any) => q.completed).length || 0;
      const completedAthkar = athkarList?.filter((a: any) => a.completed).length || 0;

      setPartnerStats({
        userId: partnerId,
        username: partnerData?.name || partnerData?.username || 'الشريك',
        totalTasks: 9,
        completedTasks: completedPrayers + completedQuran + completedAthkar,
        prayers: { total: 5, completed: completedPrayers },
        quran: { total: 2, completed: completedQuran },
        athkar: { total: 2, completed: completedAthkar },
      });
    } catch (e) {
      console.error('Error loading partner stats:', e);
    }
  };

  if (!partnerStats) return null;
  const percentage = Math.round((partnerStats.completedTasks / partnerStats.totalTasks) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5">
      <div className="flex flex-col sm:flex-row items-center gap-10">
        {/* Minimal Progress Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-50 dark:text-slate-800" />
            <motion.circle
              initial={{ strokeDashoffset: 364 }}
              animate={{ strokeDashoffset: 364 - (364 * percentage / 100) }}
              transition={{ duration: 1, ease: "easeOut" }}
              cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round"
              className="text-indigo-500"
              style={{ strokeDasharray: 364 }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold dark:text-white leading-none">{percentage}%</span>
            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">إنجاز</span>
          </div>
        </div>

        {/* Simplified Stats List */}
        <div className="flex-1 w-full space-y-6">
          {[
            { label: 'الصلوات', stats: partnerStats.prayers, color: 'bg-blue-500' },
            { label: 'القرآن', stats: partnerStats.quran, color: 'bg-emerald-500' },
            { label: 'الأذكار', stats: partnerStats.athkar, color: 'bg-purple-500' }
          ].map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                <span className="text-[10px] font-bold text-slate-400">{item.stats.completed} / {item.stats.total}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.stats.completed / item.stats.total) * 100}%` }}
                  className={`h-full ${item.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {percentage === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center gap-3"
        >
          <Trophy className="w-5 h-5 text-indigo-500" />
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">أتمّ الشريك جميع مهامه اليوم! ✨</span>
        </motion.div>
      )}
    </div>
  );
}