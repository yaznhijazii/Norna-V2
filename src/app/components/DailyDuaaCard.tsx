import { useState, useEffect } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import { getUserDuaas, getSharedDuaas } from '../utils/db';

interface Duaa {
  id: string;
  user_id: string;
  content: string;
  is_shared: boolean;
  partner_id: string | null;
  created_at: string;
  category?: string;
}

interface DailyDuaaCardProps {
  userId: string;
  onChallengesClick: () => void;
}

export function DailyDuaaCard({ userId }: DailyDuaaCardProps) {
  const [currentDuaa, setCurrentDuaa] = useState<Duaa | null>(null);
  const [allDuaas, setAllDuaas] = useState<Duaa[]>([]);

  const loadDuaas = async () => {
    if (!userId) return;

    try {
      const [myDuaas, sharedDuaas] = await Promise.all([
        getUserDuaas(userId),
        getSharedDuaas(userId),
      ]);

      const combined = [...myDuaas, ...sharedDuaas];
      setAllDuaas(combined);

      if (combined.length > 0 && !currentDuaa) {
        updateDuaa(combined, false);
      }
    } catch (error) {
      console.error('Error loading duaas:', error);
    }
  };

  const updateDuaa = (duaas: Duaa[], forceRandom = false) => {
    if (duaas.length === 0) {
      setCurrentDuaa(null);
      return;
    }

    if (forceRandom) {
      const randomIndex = Math.floor(Math.random() * duaas.length);
      setCurrentDuaa(duaas[randomIndex]);
    } else {
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
      const index = dayOfYear % duaas.length;
      setCurrentDuaa(duaas[index]);
    }
  };

  useEffect(() => {
    if (userId) {
      loadDuaas();
    }
  }, [userId]);

  if (!currentDuaa) {
    return null;
  }

  return (
    <div className="premium-card p-5 sm:p-6 backdrop-blur-3xl border-white/50 dark:border-white/5 relative overflow-hidden group">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors duration-700" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shadow-inner">
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">دعاء اليوم</h3>
            <p className="text-xs text-slate-500 font-bold opacity-70">من دفترك الشخصي</p>
          </div>
        </div>
        <button
          onClick={() => updateDuaa(allDuaas, true)}
          className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-800 transition-all active:rotate-180 duration-500"
          title="دعاء عشوائي"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Duaa Content */}
      <div className="mb-5 relative z-10">
        <p className="text-slate-800 dark:text-slate-100 leading-relaxed text-lg sm:text-xl pr-3 border-r-4 border-purple-500/20">
          {currentDuaa.content}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between relative z-10 pt-3 border-t border-slate-100 dark:border-white/5">
        {currentDuaa.is_shared ? (
          <span className="text-[11px] font-black px-3 py-1 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 uppercase tracking-tight">
            دعاء مشترك ❤️
          </span>
        ) : (
          <span className="text-[11px] font-black px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 uppercase tracking-tight">
            ورد خاص
          </span>
        )}
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
        </div>
      </div>
    </div>
  );
}