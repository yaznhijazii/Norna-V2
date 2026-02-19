import { useState, useEffect } from 'react';

interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export function usePrayerTimes() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);

  useEffect(() => {
    const adjustTime = (timeStr: string, minutes: number): string => {
      const [h, m] = timeStr.split(':').map(Number);
      let totalMinutes = h * 60 + m + minutes;
      if (totalMinutes < 0) totalMinutes += 24 * 60;
      const newH = Math.floor(totalMinutes / 60) % 24;
      const newM = totalMinutes % 60;
      return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
    };

    const fetchPrayerTimes = async () => {
      try {
        // Format today's date as DD-MM-YYYY
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const dateString = `${day}-${month}-${year}`;

        // Fetch from Aladhan API for Amman, Jordan
        const url = `https://api.aladhan.com/v1/timings/${dateString}?latitude=31.9454&longitude=35.9284&method=2`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.data && data.data.timings) {
          const t = data.data.timings;
          const adjustedTimings = {
            ...t,
            Fajr: adjustTime(t.Fajr, -14),
            Dhuhr: adjustTime(t.Dhuhr, 1),
            Asr: adjustTime(t.Asr, 2),
            Maghrib: adjustTime(t.Maghrib, 6),
            Isha: adjustTime(t.Isha, 15),
          };
          setPrayerTimes(adjustedTimings);
        }
      } catch (error) {
        console.error('Error fetching prayer times:', error);
        // Fallback to default times (already roughly adjusted)
        setPrayerTimes({
          Fajr: '05:15',
          Dhuhr: '12:30',
          Asr: '15:45',
          Maghrib: '18:26',
          Isha: '19:51',
        });
      }
    };

    fetchPrayerTimes();
  }, []);

  return prayerTimes;
}
