import { useState, useEffect } from 'react';

// Approximate Ramadan 2026 dates: Feb 18 to Mar 19
const RAMADAN_START_2026 = new Date('2026-02-18T00:00:00');
const RAMADAN_END_2026 = new Date('2026-03-20T00:00:00');

export function useRamadan() {
    const [isRamadan, setIsRamadan] = useState(false);
    const [isApproaching, setIsApproaching] = useState(false);
    const [daysUntil, setDaysUntil] = useState(0);

    useEffect(() => {
        const checkRamadan = () => {
            const now = new Date();

            // Manual override - prioritize user setting
            const savedMode = localStorage.getItem('ramadanMode');
            const isManualMode = savedMode === 'true';

            // The user wants to manually activate/deactivate it instead of automatic behavior
            setIsRamadan(isManualMode);

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
        const interval = setInterval(checkRamadan, 3600000); // Check every hour

        // Listen for storage changes to update UI immediately when setting changes
        const handleStorage = () => checkRamadan();
        window.addEventListener('storage', handleStorage);
        window.addEventListener('ramadanModeChange', handleStorage);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('ramadanModeChange', handleStorage);
        };
    }, []);

    return { isRamadan, isApproaching, daysUntil };
}
