import { useState, useEffect } from 'react';

// Adjusted Ramadan 2026 dates for user location: Starts Feb 19, 2026
const RAMADAN_START_2026 = new Date('2026-02-19T00:00:00');
const RAMADAN_END_2026 = new Date('2026-03-20T00:00:00');

export function useRamadan() {
    const [isRamadan, setIsRamadan] = useState(false);
    const [isApproaching, setIsApproaching] = useState(false);
    const [daysUntil, setDaysUntil] = useState(0);
    const [ramadanDay, setRamadanDay] = useState<number | null>(null);

    useEffect(() => {
        const checkRamadan = () => {
            const now = new Date();

            // Manual override - prioritize user setting
            const savedMode = localStorage.getItem('ramadanMode');
            const isManualMode = savedMode === 'true';

            // Automatic check
            const isAutoRamadan = now >= RAMADAN_START_2026 && now <= RAMADAN_END_2026;

            const active = isManualMode || isAutoRamadan;
            setIsRamadan(active);

            if (active) {
                // Calculate Ramadan Day (Day 1 starts on RAMADAN_START_2026)
                const diffTime = now.getTime() - RAMADAN_START_2026.getTime();
                const day = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setRamadanDay(day > 0 ? day : 1); // Fallback to 1 if manual mode is on before start
            } else {
                setRamadanDay(null);
            }

            const diff = RAMADAN_START_2026.getTime() - now.getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

            if (days > 0 && days <= 10) {
                setIsApproaching(true);
                setDaysUntil(days);
            } else {
                setIsApproaching(false);
                setDaysUntil(0);
            }
        };

        checkRamadan();
        const interval = setInterval(checkRamadan, 3600000);

        const handleStorage = () => checkRamadan();
        window.addEventListener('storage', handleStorage);
        window.addEventListener('ramadanModeChange', handleStorage);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('ramadanModeChange', handleStorage);
        };
    }, []);

    return { isRamadan, isApproaching, daysUntil, ramadanDay };
}
