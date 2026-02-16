import { useState, useEffect } from 'react';

export type TimeOfDay = 'fajr' | 'morning' | 'afternoon' | 'evening' | 'night' | 'ramadan' | 'light' | 'dark';

export function useTimeOfDay() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');

  useEffect(() => {
    const updateTimeOfDay = () => {
      const savedTheme = localStorage.getItem('themeMode') as 'auto' | 'light' | 'dark' | null;

      if (savedTheme && savedTheme !== 'auto') {
        setTimeOfDay(savedTheme as any);
        return;
      }

      const now = new Date();
      const hour = now.getHours();

      if (hour >= 4 && hour < 6) {
        setTimeOfDay('fajr');
      } else if (hour >= 6 && hour < 12) {
        setTimeOfDay('morning');
      } else if (hour >= 12 && hour < 18) {
        setTimeOfDay('afternoon');
      } else if (hour >= 18 && hour < 21) {
        setTimeOfDay('evening');
      } else {
        setTimeOfDay('night');
      }
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000);

    // Listen for manual ramadan toggle changes and theme changes
    window.addEventListener('ramadanModeChange', updateTimeOfDay);
    window.addEventListener('themeChange', updateTimeOfDay);
    window.addEventListener('storage', updateTimeOfDay);

    return () => {
      clearInterval(interval);
      window.removeEventListener('ramadanModeChange', updateTimeOfDay);
      window.removeEventListener('themeChange', updateTimeOfDay);
      window.removeEventListener('storage', updateTimeOfDay);
    };
  }, []);

  return timeOfDay;
}

export const timeOfDayConfig = {
  fajr: {
    name: 'الفجر',
    gradient: 'from-indigo-50 via-purple-50 to-pink-50',
    headerGradient: 'from-[#1e1b4b] via-[#312e81] to-[#4338ca]',
    icon: 'sunrise',
    message: 'بارك الله في بكورها',
  },
  morning: {
    name: 'الصباح',
    gradient: 'from-sky-50 via-blue-50 to-indigo-50',
    headerGradient: 'from-[#1e3a8a] via-[#2563eb] to-[#60a5fa]',
    icon: 'sun',
    message: 'صباح النور والبركة',
  },
  afternoon: {
    name: 'الظهيرة',
    gradient: 'from-blue-50 via-cyan-50 to-teal-50',
    headerGradient: 'from-[#0c4a6e] via-[#0284c7] to-[#0ea5e9]',
    icon: 'cloud-sun',
    message: 'نهارك مبارك',
  },
  evening: {
    name: 'المساء',
    gradient: 'from-purple-50 via-pink-50 to-rose-50',
    headerGradient: 'from-[#4c1d95] via-[#7c3aed] to-[#a78bfa]',
    icon: 'sunset',
    message: 'مساء الخير والسكينة',
  },
  night: {
    name: 'الليل',
    gradient: 'from-[#020617] via-[#0f172a] to-[#1e1b4b]',
    headerGradient: 'from-[#0f172a] via-[#1e1b4b] to-[#312e81]',
    icon: 'moon',
    message: 'ليلة مباركة',
  },
  light: {
    name: 'الوضع النهاري',
    gradient: 'from-amber-50 via-orange-50 to-yellow-50',
    headerGradient: 'from-[#1e40af] via-[#3b82f6] to-[#60a5fa]',
    icon: 'sun',
    message: 'يومك سعيد ومبارك',
  },
  dark: {
    name: 'الوضع الليلي',
    gradient: 'from-[#020617] via-[#0f172a] to-[#1e1b4b]',
    headerGradient: 'from-[#020617] via-[#0f172a] to-[#1e1b4b]',
    icon: 'moon',
    message: 'ليلة هادئة ومباركة',
  },
  ramadan: {
    name: 'رمضان الكريم',
    gradient: 'from-[#1e1b4b] via-[#312e81] to-[#1e1b4b]',
    headerGradient: 'from-[#4c1d95] via-[#6d28d2] to-[#8b5cf6]',
    icon: 'moon',
    message: 'رمضان مبارك وكل عام وأنتم بخير',
  },
};