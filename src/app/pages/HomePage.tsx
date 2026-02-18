import { useState, useEffect } from 'react';
import { DailyHeader } from '../components/DailyHeader';
import { InteractiveTimeline } from '../components/InteractiveTimeline';
import { DailyInspiration } from '../components/DailyInspiration';
import { ChallengesCard, UserChallengeData } from '../components/ChallengesCard';
import { UpcomingEvents } from '../components/UpcomingEvents';
import { ShortcutsGrid } from '../components/ShortcutsGrid';
import { PrayerTimesDialog } from '../components/PrayerTimesDialog';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { getQuranBookmark } from '../utils/db';

interface HomePageProps {
    currentUser: any;
    partnerId?: string;
    partnerName?: string;
    onPartnerStatsClick: () => void;
    onSettingsClick: () => void;
    onQiblaClick: () => void;
    setShowChallenges: (show: boolean) => void;
    activeChallenges: UserChallengeData[];
}

export function HomePage({
    currentUser,
    partnerId,
    partnerName,
    onPartnerStatsClick,
    onSettingsClick,
    onQiblaClick,
    setShowChallenges,
    activeChallenges
}: HomePageProps) {
    const [showOccasions, setShowOccasions] = useState(false);
    const [showPrayerTimes, setShowPrayerTimes] = useState(false);
    const [lastRead, setLastRead] = useState<{ surah: string; ayah: number } | null>(null);

    useEffect(() => {
        const handleOpenPrayerTimes = () => setShowPrayerTimes(true);
        window.addEventListener('openPrayerTimes', handleOpenPrayerTimes);
        return () => window.removeEventListener('openPrayerTimes', handleOpenPrayerTimes);
    }, []);

    useEffect(() => {
        // ...
        const loadProgress = async () => {
            if (currentUser?.userId || currentUser?.id) {
                const bookmark = await getQuranBookmark(currentUser.userId || currentUser.id);
                if (bookmark) {
                    setLastRead({
                        surah: bookmark.surah_name,
                        ayah: bookmark.ayah_number
                    });
                }
            }
        };
        loadProgress();
    }, [currentUser]);

    const handleOpenTasbih = () => {
        window.dispatchEvent(new CustomEvent('openAthkar', { detail: { type: 'tasbih' } }));
    };

    const handleContinueQuran = () => {
        window.dispatchEvent(new CustomEvent('openQuranBookmark'));
    };

    const handleOpenFawait = () => {
        // Placeholder for now
        alert('قريباً - سجل الفوائت');
    };

    return (
        <div className="space-y-8 pb-32 px-4 sm:px-6 max-w-3xl mx-auto">
            <DailyHeader
                userName={currentUser?.name}
                userId={currentUser?.userId || currentUser?.id}
                partnerName={partnerName}
                onPartnerStatsClick={onPartnerStatsClick}
                onSettingsClick={onSettingsClick}
                hasPartner={!!partnerId}
            />

            <div className="space-y-12">
                {/* Timeline Section - Primary focus */}
                <div className="space-y-4">
                    <InteractiveTimeline />
                </div>

                {/* Secondary Cards Section - Stacked for mobile style */}
                <div className="space-y-8">
                    <DailyInspiration userId={currentUser?.userId || currentUser?.id} />
                </div>

                {/* Shortcuts Section (Now at the bottom) */}
                <ShortcutsGrid
                    onOpenOccasions={() => setShowOccasions(true)}
                    onOpenQibla={onQiblaClick}
                    onOpenTasbih={handleOpenTasbih}
                    onContinueQuran={handleContinueQuran}
                    onOpenPrayerTimes={() => setShowPrayerTimes(true)}
                    lastRead={lastRead}
                />
            </div>

            {/* Prayer Times Modal */}
            <PrayerTimesDialog
                isOpen={showPrayerTimes}
                onClose={() => setShowPrayerTimes(false)}
            />

            {/* Occasions Modal */}
            <AnimatePresence>
                {showOccasions && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowOccasions(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-[#f8f9fa] dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowOccasions(false)}
                                className="absolute top-4 left-4 z-20 w-8 h-8 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                            <UpcomingEvents />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
