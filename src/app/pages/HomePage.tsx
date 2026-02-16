import { DailyHeader } from '../components/DailyHeader';
import { InteractiveTimeline } from '../components/InteractiveTimeline';
import { DailyDuaaCard } from '../components/DailyDuaaCard';
import { ChallengesCard, UserChallengeData } from '../components/ChallengesCard';
import { UpcomingEvents } from '../components/UpcomingEvents';
// import { RamadanCountdown } from '../components/RamadanCountdown';

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
    return (
        <div className="space-y-8 pb-32 px-4 sm:px-6 max-w-3xl mx-auto">
            <DailyHeader
                userName={currentUser?.name}
                userId={currentUser?.userId || currentUser?.id}
                partnerName={partnerName}
                onPartnerStatsClick={onPartnerStatsClick}
                onSettingsClick={onSettingsClick}
                onQiblaClick={onQiblaClick}
                hasPartner={!!partnerId}
            />

            <div className="space-y-8">
                {/* Timeline Section - Primary focus */}
                <div className="space-y-4">
                    <InteractiveTimeline />
                </div>

                {/* Secondary Cards Section - Stacked for mobile style */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <DailyDuaaCard
                            userId={currentUser?.userId}
                            onChallengesClick={() => setShowChallenges(true)}
                        />
                        <UpcomingEvents />
                    </div>
                </div>
            </div>
        </div>
    );
}
