/**
 * Jordan Holidays Utility
 * Reads from public/calenders.json
 */

export interface Holiday {
    name: string;
    date: string;
    hijri?: string;
    daysUntil: number;
}

export async function fetchJordanHolidays(): Promise<Holiday[]> {
    try {
        const response = await fetch('/calenders.json');
        if (!response.ok) throw new Error('Failed to load local calendar');

        const data = await response.json();
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const holidays: Holiday[] = data.religious_occasions.map((occ: any) => {
            // Handle both single date and date_range
            const targetDate = occ.date || (occ.date_range ? occ.date_range.from : '');
            if (!targetDate) return null;

            const [y, m, d] = targetDate.split('-').map(Number);
            const holidayTime = new Date(y, m - 1, d).getTime();

            const diffTime = holidayTime - todayTime;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            return {
                name: occ.name_ar,
                date: targetDate,
                hijri: occ.hijri,
                daysUntil: diffDays
            };
        }).filter((h: any) => h !== null && h.daysUntil >= 0)
            .sort((a: Holiday, b: Holiday) => a.daysUntil - b.daysUntil);

        return holidays;
    } catch (error) {
        console.error('❌ Calendar Error:', error);
        return [];
    }
}

export function getNextHoliday(holidays: Holiday[]): Holiday | null {
    if (!holidays || holidays.length === 0) return null;
    return holidays[0];
}
