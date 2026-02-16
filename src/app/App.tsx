import { HomePage } from './pages/HomePage';
import { PlayerPage } from './pages/PlayerPage';
import { QuranPage } from './pages/QuranPage';
import { AzkarPage } from './pages/AzkarPage';
import { PartnerPage } from './pages/PartnerPage';
import { QiblaPage } from './pages/QiblaPage';
import { BottomNavigation } from './components/BottomNavigation';
import { DuaaJournal } from './components/DuaaJournal';
import { FloatingMenu } from './components/FloatingMenu';
import { SendGiftModal } from './components/SendGiftModal';
import { ReceiveGiftModal } from './components/ReceiveGiftModal';
import { NotificationBanner } from './components/NotificationBanner';
import { SettingsModal } from './components/SettingsModal';
import { ChallengesModal } from './components/ChallengesModal';
import { TasmeeRoom } from './components/TasmeeRoom';
import { UserChallengeData } from './components/ChallengesCard';
import { supabase } from './utils/supabase';
import { LoginScreen } from './components/LoginScreen';
import { PartnerNotification } from './components/PartnerNotification';
import { Toaster } from './components/ui/sonner';
import { useState, useEffect } from 'react';
import { updateUserStreak } from './utils/db';
import { useTimeOfDay, timeOfDayConfig } from './hooks/useTimeOfDay';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { useNotifications } from './hooks/useNotifications';
import { usePartnerActivity } from './hooks/usePartnerActivity';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useGiftNotifications } from './hooks/useGiftNotifications';
import { useRamadan } from './hooks/useRamadan';
import { motion } from 'motion/react';

const logoImage = 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png';

interface User {
  username: string;
  name: string;
  userId: string;
}

export default function App() {
  const { isRamadan } = useRamadan();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  // Navigation State
  const [navInitialSurah, setNavInitialSurah] = useState<{ number: number; name: string; englishName: string; numberOfAyahs: number } | null>(null);
  const [navInitialAzkar, setNavInitialAzkar] = useState<'morning' | 'evening' | null>(null);

  // Listen for timeline events
  useEffect(() => {
    const handleOpenQuran = (e: any) => {
      const surahKey = e.detail?.surah;
      let surahNum = 0;
      let surahName = '';

      // Map common keys to numbers (simplified)
      if (surahKey === 'baqarah') { surahNum = 2; surahName = 'سورة البقرة'; }
      else if (surahKey === 'mulk') { surahNum = 67; surahName = 'سورة الملك'; }
      else if (surahKey === 'kahf') { surahNum = 18; surahName = 'سورة الكهف'; }

      if (surahNum > 0) {
        setNavInitialSurah({
          number: surahNum,
          name: surahName,
          englishName: '',
          numberOfAyahs: 0
        });
        setActiveTab('quran');
      }
    };

    const handleOpenAthkar = (e: any) => {
      const type = e.detail?.type;
      if (type === 'morning' || type === 'evening' || type === 'israa_miraj') {
        setNavInitialAzkar(type);
        setActiveTab('azkar');
      }
    };

    const handlePartnerActivity = (e: any) => {
      const { partnerName, prayerName, type } = e.detail;
      if (type === 'prayer') {
        setPartnerActivity({ partnerName, prayerName });
        // Auto clear after 5 seconds to match component exit
        setTimeout(() => setPartnerActivity(null), 5500);
      }
    };

    window.addEventListener('openQuranSurah', handleOpenQuran);
    window.addEventListener('openAthkar', handleOpenAthkar);
    window.addEventListener('partnerActivity', handlePartnerActivity);

    return () => {
      window.removeEventListener('openQuranSurah', handleOpenQuran);
      window.removeEventListener('openAthkar', handleOpenAthkar);
      window.removeEventListener('partnerActivity', handlePartnerActivity);
    };
  }, []);

  // Modals stats
  const [showSettings, setShowSettings] = useState(false);
  const [showDuaaJournal, setShowDuaaJournal] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showTasmeeRoom, setShowTasmeeRoom] = useState(false);
  const [tasmeeDetails, setTasmeeDetails] = useState<any>(null);
  const [showSendGift, setShowSendGift] = useState(false);
  const [receivedGift, setReceivedGift] = useState<any>(null);
  const [partnerActivity, setPartnerActivity] = useState<{ partnerName: string; prayerName: string } | null>(null);

  // Data states
  const [activeChallenges, setActiveChallenges] = useState<UserChallengeData[]>([]);
  const [partnerName, setPartnerName] = useState('');
  const [themeMode, setThemeMode] = useState<'auto' | 'light' | 'dark'>('auto');
  const [partnerId, setPartnerId] = useState<string | undefined>(undefined);

  const systemTimeOfDay = useTimeOfDay();
  const activeTimeOfDay = themeMode === 'auto' ? systemTimeOfDay : themeMode;

  // Load theme mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') as 'auto' | 'light' | 'dark' | null;
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    const isDark = activeTimeOfDay === 'night' || activeTimeOfDay === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [activeTimeOfDay]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('nooruna_user');
        const storedToken = localStorage.getItem('nooruna_token');

        console.log('🔐 Checking authentication...');

        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser);

          // Fix: Check if userId exists, otherwise use id
          if (!user.userId && user.id) {
            user.userId = user.id;
          }

          setCurrentUser(user);

          // ✅ Update user streak and last login
          updateUserStreak(user.userId || user.id);

          // Load partner ID if exists
          const { data: userData, error: partnerError } = await supabase
            .from('users')
            .select('partner_id, partner_nickname')
            .eq('id', user.userId || user.id)
            .single();

          if (userData?.partner_id) {
            // ✅ Validate that partner_id is different from current user
            if (userData.partner_id === user.userId || userData.partner_id === user.id) {
              setPartnerId(undefined);
              setPartnerName('');
            } else {
              setPartnerId(userData.partner_id);

              // Load partner name
              const { data: partnerData } = await supabase
                .from('users')
                .select('name')
                .eq('id', userData.partner_id)
                .single();

              if (partnerData) {
                setPartnerName(partnerData.name);
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch prayer times
  const prayerTimes = usePrayerTimes();

  // Setup notifications
  useNotifications({ prayerTimes, enabled: !!currentUser });

  // Setup partner activity notifications with partner name
  usePartnerActivity(currentUser?.userId || null, partnerId || null, partnerName);

  // Setup PWA push notifications
  usePushNotifications({
    userId: currentUser?.userId || null,
    enabled: !!currentUser
  });

  // 🎁 Setup Gift Notifications (Push + Realtime)
  useGiftNotifications({
    userId: currentUser?.userId || null,
    enabled: !!currentUser,
    onGiftReceived: (gift) => {
      setReceivedGift(gift);
    }
  });

  // 🎁 Check for unread gifts on mount and periodically
  useEffect(() => {
    if (!currentUser?.userId) return;

    const checkForUnreadGifts = async () => {
      try {
        const { data, error } = await supabase
          .from('gifts')
          .select('*')
          .eq('to_user_id', currentUser.userId)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          setReceivedGift(data[0]);
        }
      } catch (err) {
        console.error('❌ Error in checkForUnreadGifts:', err);
      }
    };

    checkForUnreadGifts();
    const interval = setInterval(checkForUnreadGifts, 10000);
    return () => clearInterval(interval);
  }, [currentUser?.userId]);

  // Set document title & PWA meta
  useEffect(() => {
    document.title = 'نورنا - يضيء بالإيمان';

    // Set favicon
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = logoImage;
    if (!document.querySelector("link[rel*='icon']")) {
      document.getElementsByTagName('head')[0].appendChild(link);
    }

    // Add PWA manifest link
    const manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement || document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    if (!document.querySelector("link[rel='manifest']")) {
      document.getElementsByTagName('head')[0].appendChild(manifestLink);
    }
  }, []);

  const handleLogin = (username: string, name: string, userId: string) => {
    const user = { username, name, userId };
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('nooruna_token');
      if (token) {
        await supabase.rpc('logout_user', { p_token: token });
      }
      localStorage.removeItem('nooruna_token');
      localStorage.removeItem('nooruna_user');
      setCurrentUser(null);
    } catch (err) {
      localStorage.removeItem('nooruna_token');
      localStorage.removeItem('nooruna_user');
      setCurrentUser(null);
    }
  };

  const toggleTheme = () => {
    const themes: ('auto' | 'light' | 'dark')[] = ['auto', 'light', 'dark'];
    const currentIndex = themes.indexOf(themeMode);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setThemeMode(nextTheme);
    localStorage.setItem('themeMode', nextTheme);
    window.dispatchEvent(new Event('themeChange'));
  };

  // Challenges Logic
  const fetchChallenges = async () => {
    if (!currentUser?.userId) return;

    const { data, error } = await supabase
      .from('user_challenges')
      .select('*')
      .or(`user_id.eq.${currentUser.userId},partner_id.eq.${currentUser.userId}`)
      .eq('status', 'active');

    if (error) return;

    const mapped: UserChallengeData[] = (data || []).map(c => {
      const isCreator = c.user_id === currentUser.userId;
      return {
        id: c.id,
        type: c.challenge_type as 'quran' | 'charity',
        title: c.challenge_type === 'quran' ? 'تحدي حفظ القرآن' : 'تحدي الصدقة اليومية',
        details: {
          surah: c.surah_name || '',
          from_page: c.start_page?.toString() || '',
          to_page: c.end_page?.toString() || '',
          from_ayah: c.start_page?.toString() || '',
          to_ayah: c.end_page?.toString() || '',
          amount: c.charity_amount || '',
          intent: c.charity_intention || ''
        },
        progress: isCreator ? (c.progress_percent || 0) : (c.partner_progress_percent || 0),
        partnerProgress: isCreator ? (c.partner_progress_percent || 0) : (c.progress_percent || 0),
        startDate: c.created_at,
      };
    });

    setActiveChallenges(mapped);
  };

  useEffect(() => {
    if (currentUser?.userId) {
      fetchChallenges();
      const interval = setInterval(fetchChallenges, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.userId, partnerId]);

  const handleAddChallenge = async (challenge: UserChallengeData) => {
    if (!currentUser?.userId) return;

    const { data, error } = await supabase
      .from('user_challenges')
      .insert([{
        user_id: currentUser.userId,
        partner_id: partnerId || null,
        challenge_type: challenge.type,
        surah_name: challenge.details.surah,
        start_page: challenge.type === 'quran' ? (challenge.details.from_ayah ? parseInt(challenge.details.from_ayah) : null) : (challenge.details.from_page ? parseInt(challenge.details.from_page) : null),
        end_page: challenge.type === 'quran' ? (challenge.details.to_ayah ? parseInt(challenge.details.to_ayah) : null) : (challenge.details.to_page ? parseInt(challenge.details.to_page) : null),
        charity_amount: challenge.details.amount,
        charity_intention: challenge.details.intent,
        progress_percent: 0,
        status: 'active'
      }])
      .select();

    if (!error) {
      fetchChallenges();
    }
  };

  const handleUpdateChallenge = async (challengeId: string, progress: number) => {
    const { error } = await supabase
      .from('user_challenges')
      .update({ progress_percent: progress })
      .eq('id', challengeId);
    if (!error) fetchChallenges();
  };

  const handleCompleteChallenge = async (challengeId: string) => {
    const { error } = await supabase
      .from('user_challenges')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', challengeId);
    if (!error) fetchChallenges();
  };

  const handleCancelChallenge = async (challengeId: string) => {
    const { error } = await supabase
      .from('user_challenges')
      .update({ status: 'cancelled' })
      .eq('id', challengeId);
    if (!error) fetchChallenges();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] dark:bg-slate-950">
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <img
              src={logoImage}
              alt="Nooruna Logo"
              className="w-24 h-24 opacity-80"
            />
          </div>
          <h1 className="font-amiri text-4xl font-bold text-slate-800 dark:text-white mb-2">
            نورنا
          </h1>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div
      className={`min-h-screen relative overflow-hidden premium-bg-layout ${isRamadan ? 'ramadan-mode' : ''}`}
      style={{
        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
        direction: 'rtl'
      }}
    >
      {/* Premium Background Layer */}
      <div className="mesh-gradient">
        <div className={`mesh-sphere w-[80%] h-[80%] -top-[20%] -left-[10%] ${isRamadan ? 'bg-amber-500/20' : 'bg-indigo-500/20'}`}></div>
        <div className={`mesh-sphere w-[70%] h-[70%] -bottom-[10%] -right-[10%] ${isRamadan ? 'bg-purple-500/20' : 'bg-purple-500/20'} animate-[meshFloat_25s_infinite_alternate-reverse]`}></div>
        <div className={`mesh-sphere w-[60%] h-[60%] top-[20%] left-[30%] ${isRamadan ? 'bg-amber-200/10' : 'bg-emerald-500/10'} animate-[meshFloat_30s_infinite_alternate]`}></div>
      </div>

      {/* Noise Grain for High-End Texture */}
      <div className="grain-overlay"></div>

      {/* Global Ramadan Decorations */}
      <RamadanDecorations isRamadan={isRamadan} />

      <Toaster position="top-center" richColors closeButton />


      {/* Global Overlays */}
      <NotificationBanner />

      {partnerActivity && (
        <PartnerNotification
          partnerName={partnerActivity.partnerName}
          prayerName={partnerActivity.prayerName}
        />
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        themeMode={themeMode}
        onThemeToggle={toggleTheme}
        onLogout={handleLogout}
      />

      <DuaaJournal isOpen={showDuaaJournal} onClose={() => setShowDuaaJournal(false)} />

      <SendGiftModal
        isOpen={showSendGift}
        onClose={() => setShowSendGift(false)}
        currentUserId={currentUser.userId}
        partnerId={partnerId || ''}
        partnerName={partnerName}
      />

      <ReceiveGiftModal
        gift={receivedGift}
        senderName={partnerName}
        onClose={() => setReceivedGift(null)}
      />

      <ChallengesModal
        isOpen={showChallenges}
        onClose={() => setShowChallenges(false)}
        currentUserId={currentUser.userId}
        partnerId={partnerId}
        partnerName={partnerName}
        activeChallenges={activeChallenges}
        onAddChallenge={handleAddChallenge}
        onUpdateChallenge={handleUpdateChallenge}
        onCompleteChallenge={handleCompleteChallenge}
        onCancelChallenge={handleCancelChallenge}
        onOpenTasmeeRoom={(details) => {
          setTasmeeDetails(details);
          setShowTasmeeRoom(true);
        }}
      />

      {currentUser && (
        <TasmeeRoom
          isOpen={showTasmeeRoom}
          onClose={() => {
            setShowTasmeeRoom(false);
            setTasmeeDetails(null);
          }}
          currentUserId={currentUser.userId}
          partnerId={partnerId || ''}
          partnerName={partnerName}
          challengeDetails={tasmeeDetails}
        />
      )}

      {/* Floating Menu - simplified or kept for secondary actions */}
      <div className="max-w-3xl mx-auto relative z-10 min-h-screen">
        {activeTab === 'home' && (
          <HomePage
            currentUser={currentUser}
            partnerId={partnerId}
            partnerName={partnerName}
            onPartnerStatsClick={() => setActiveTab('partner')}
            onSettingsClick={() => setShowSettings(true)}
            onQiblaClick={() => setActiveTab('qibla')}
            setShowChallenges={setShowChallenges}
            activeChallenges={activeChallenges}
          />
        )}
        {activeTab === 'player' && <PlayerPage />}
        {activeTab === 'quran' && <QuranPage initialSurah={navInitialSurah?.name} />}
        {activeTab === 'azkar' && <AzkarPage initialType={navInitialAzkar} />}
        {activeTab === 'qibla' && <QiblaPage onBack={() => setActiveTab('home')} />}
        {activeTab === 'partner' && (
          <PartnerPage
            currentUserId={currentUser.userId}
            partnerId={partnerId || ''}
            partnerName={partnerName}
            activeChallenges={activeChallenges}
            onChallengesClick={() => setShowChallenges(true)}
            onDuaaClick={() => setShowDuaaJournal(true)}
            onBack={() => setActiveTab('home')}
            themeMode={themeMode}
            onThemeToggle={toggleTheme}
            onLogout={handleLogout}
          />
        )}
      </div>

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasPartner={!!partnerId}
      />
    </div >
  );
}
function RamadanDecorations({ isRamadan }: { isRamadan: boolean }) {
  if (!isRamadan) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Stars in the background */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5
          }}
          className="absolute bg-amber-200 rounded-full blur-[1px]"
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
          }}
        />
      ))}

      {/* Main Lantern (Left) */}
      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [-2, 2, -2]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-10 left-[10%] text-amber-500/20 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]"
      >
        <svg width="60" height="120" viewBox="0 0 60 120" fill="currentColor">
          <path d="M30 0V15M15 15H45L40 25H20L15 15ZM10 25L0 45H60L50 25H10ZM0 45L10 90H50L60 45H0ZM10 90L15 105H45L50 90H10ZM25 105V120M35 105V120" />
          <rect x="25" y="50" width="10" height="30" rx="2" fill="white" opacity="0.3" />
        </svg>
      </motion.div>

      {/* Small Lantern (Right) */}
      <motion.div
        animate={{
          y: [0, 15, 0],
          rotate: [2, -2, 2]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -top-5 right-[15%] text-indigo-400/20 drop-shadow-[0_0_10px_rgba(129,140,248,0.2)]"
      >
        <svg width="45" height="90" viewBox="0 0 45 90" fill="currentColor">
          <path d="M22.5 0V10M12 10H33L30 18H15L12 10ZM5 18L0 35H45L40 18H5ZM0 35L8 70H37L45 35H0ZM10 70L15 80H30L35 70H10Z" />
          <circle cx="22.5" cy="45" r="5" fill="white" opacity="0.2" />
        </svg>
      </motion.div>

      {/* Floating Fanous (Bottom Left) */}
      <motion.div
        animate={{
          y: [0, -10, 0],
          x: [0, 5, 0]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-[20%] left-[5%] text-amber-600/10"
      >
        <svg width="40" height="70" viewBox="0 0 40 70" fill="currentColor">
          <path d="M20 0L25 10H15L20 0ZM10 10H30L35 25H5L10 10ZM5 25L10 55H30L35 25H5ZM12 55L15 65H25L28 55H12Z" />
        </svg>
      </motion.div>
    </div>
  );
}

