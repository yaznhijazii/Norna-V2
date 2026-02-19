import { useState, useEffect, useRef } from 'react';
import { Headphones, Radio, BookOpen, Play, Pause, Volume2, VolumeX, X, Search, Loader2, Music, Waves, Mic2, Heart, SkipForward, SkipBack, Sun, Moon, CloudMoon, Sparkles, Info, Users, Sunrise, Sunset, Wind, Shield, Scroll, Compass, Lightbulb, History, Microscope, Feather, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PodcastCard } from './PodcastCard';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
}

export function AudioCenter() {
  const [activeTab, setActiveTab] = useState<'radio' | 'podcast' | 'quran'>('radio');
  const [selectedRadioStation, setSelectedRadioStation] = useState({
    id: 79,
    name: 'مشاري العفاسي',
    url: 'https://backup.qurango.net/radio/mishary_alafasi',
    category: 'quran',
    icon: Mic2
  });
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  const quranAudioRef = useRef<HTMLAudioElement>(null);
  const radioAudioRef = useRef<HTMLAudioElement>(null);

  const RADIO_STATIONS = [
    { id: 79, name: 'مشاري العفاسي', url: 'https://backup.qurango.net/radio/mishary_alafasi', category: 'quran', icon: Headphones, color: 'emerald' },
    { id: 109, name: 'تلاوات خاشعة', url: 'https://backup.qurango.net/radio/salma', category: 'spiritual', icon: Wind, color: 'rose' },
    { id: 10902, name: 'آيات السكينة', url: 'https://backup.qurango.net/radio/sakeenah', category: 'spiritual', icon: Shield, color: 'indigo' },
    { id: 10906, name: 'أذكار الصباح', url: 'https://backup.qurango.net/radio/athkar_sabah', category: 'athkar', icon: Sunrise, color: 'emerald' },
    { id: 10907, name: 'أذكار المساء', url: 'https://backup.qurango.net/radio/athkar_masa', category: 'athkar', icon: Sunset, color: 'blue' },
    { id: 10903, name: 'قصص الصحابة', url: 'https://backup.qurango.net/radio/sahabah', category: 'stories', icon: Scroll, color: 'slate' },
    { id: 10969, name: 'قصص الأنبياء', url: 'https://backup.qurango.net/radio/alanbiya', category: 'stories', icon: Feather, color: 'orange' },
    { id: 116, name: 'تفسير القرآن', url: 'https://backup.qurango.net/radio/tafseer', category: 'learning', icon: Lightbulb, color: 'teal' },
  ];

  const handlePrevStation = () => {
    const currentIndex = RADIO_STATIONS.findIndex(s => s.id === selectedRadioStation.id);
    const prevIndex = (currentIndex - 1 + RADIO_STATIONS.length) % RADIO_STATIONS.length;
    const prevStation = RADIO_STATIONS[prevIndex];

    const wasPlaying = isPlaying;
    setSelectedRadioStation(prevStation as any);

    if (radioAudioRef.current) {
      setIsBuffering(true);
      radioAudioRef.current.src = prevStation.url;
      if (wasPlaying) {
        radioAudioRef.current.play();
      }
    }
  };

  const handleNextStation = () => {
    const currentIndex = RADIO_STATIONS.findIndex(s => s.id === selectedRadioStation.id);
    const nextIndex = (currentIndex + 1) % RADIO_STATIONS.length;
    const nextStation = RADIO_STATIONS[nextIndex];

    const wasPlaying = isPlaying;
    setSelectedRadioStation(nextStation as any);

    if (radioAudioRef.current) {
      setIsBuffering(true);
      radioAudioRef.current.src = nextStation.url;
      if (wasPlaying) {
        radioAudioRef.current.play();
      }
    }
  };

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(data => { if (data.data) setSurahs(data.data); })
      .catch(err => console.error('Error fetching surahs:', err));
  }, []);

  useEffect(() => {
    if (quranAudioRef.current) quranAudioRef.current.volume = volume;
    if (radioAudioRef.current) radioAudioRef.current.volume = volume;
  }, [volume]);

  const normalizeArabic = (text: string) => {
    return text.replace(/[\u064B-\u0652]/g, '').replace(/[أإآ]/g, 'ا').replace(/[ى]/g, 'ي').replace(/[ة]/g, 'ه');
  };

  const filteredSurahs = surahs.filter(surah => {
    const normalizedQuery = normalizeArabic(searchQuery.toLowerCase());
    const normalizedName = normalizeArabic(surah.name);
    return normalizedName.includes(normalizedQuery) || surah.englishName.toLowerCase().includes(normalizedQuery);
  });

  const isProcessingRef = useRef(false);

  const togglePlay = async () => {
    if (isProcessingRef.current) return;

    const radio = radioAudioRef.current;
    const quran = quranAudioRef.current;
    const audio = activeTab === 'radio' ? radio : quran;
    const inactive = activeTab === 'radio' ? quran : radio;

    if (!audio) return;

    // 1. Instant Pause (No processing delay)
    if (!audio.paused) {
      audio.pause();
      return;
    }

    // 2. Start Playback Flow
    isProcessingRef.current = true;

    // Stop other audio sources
    if (inactive && !inactive.paused) {
      inactive.pause();
    }

    try {
      if (activeTab === 'radio') {
        setIsBuffering(true);
        // Refresh live stream buffer
        audio.load();
      }

      await audio.play();
    } catch (err) {
      console.error('Playback failed:', err);
      setIsBuffering(false);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const toggleMute = () => {
    const audio = activeTab === 'radio' ? radioAudioRef.current : quranAudioRef.current;
    if (audio) { audio.muted = !isMuted; setIsMuted(!isMuted); }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      if (quranAudioRef.current) quranAudioRef.current.muted = false;
      if (radioAudioRef.current) radioAudioRef.current.muted = false;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (quranAudioRef.current) { setCurrentTime(quranAudioRef.current.currentTime); setDuration(quranAudioRef.current.duration); }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (quranAudioRef.current) { quranAudioRef.current.currentTime = time; setCurrentTime(time); }
  };

  const tabs = [
    { id: 'radio', label: 'إذاعة', icon: Radio, color: 'emerald', gradient: 'from-emerald-500 to-teal-600' },
    { id: 'podcast', label: 'بودكاست', icon: Headphones, color: 'purple', gradient: 'from-purple-500 to-indigo-600' },
    { id: 'quran', label: 'قرآن كـريـم', icon: BookOpen, color: 'blue', gradient: 'from-blue-500 to-indigo-600' }
  ] as const;

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Header Section */}
      <div className="px-2 pt-10">
        <div className="flex items-center justify-between mb-4" dir="rtl">
          <div className="text-right">
            <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-1">المشغل الصوتي</h1>
            <div className="flex items-center gap-2 text-[#62748e] font-bold text-[11px] uppercase tracking-widest">
              <Music className="w-4 h-4 text-emerald-500" />
              <span>استمع واطمئن</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-[18px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-center">
            <Mic2 className="w-6 h-6 text-slate-400 dark:text-slate-500" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher - Mobile Native Look */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[1.5rem] p-1.5 border border-white dark:border-white/10 flex gap-2 shadow-sm sticky top-2 z-[50]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id !== activeTab) {
                  // Stop all audio when switching tabs to prevent "ghost" audio and state confusion
                  if (radioAudioRef.current) radioAudioRef.current.pause();
                  if (quranAudioRef.current) quranAudioRef.current.pause();
                  setIsPlaying(false);
                  setIsBuffering(false);
                  setActiveTab(tab.id);
                }
              }}
              className={`relative flex-1 py-3 px-2 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2 overflow-hidden
                ${isActive
                  ? 'text-white shadow-lg'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className={`absolute inset-0 bg-gradient-to-br ${tab.gradient}`}
                />
              )}
              <Icon className={`w-4.5 h-4.5 relative z-10 ${isActive ? 'scale-110 active:rotate-12 transition-transform' : 'opacity-60'}`} />
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>
              <span className="relative z-10 sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-[450px]"
        >
          {activeTab === 'podcast' && (
            <div className="space-y-4">
              <PodcastCard />
            </div>
          )}

          {activeTab === 'radio' && (
            <div className="flex flex-col gap-8 pb-10">
              {/* Premium Hi-Fi Radio Unit */}
              <div className="relative p-1.5 bg-gradient-to-b from-[#3a352f] to-[#1a1816] rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] border border-white/[0.05] overflow-hidden max-w-[650px] mx-auto w-full group/radio">
                {/* Wood/Metal Frame Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/10 via-transparent to-white/5 opacity-50" />

                <div className="bg-[#121110] rounded-[2.8rem] p-6 sm:p-8 relative overflow-hidden ring-1 ring-white/10 shadow-inner">
                  {/* Internal Ambient Glow */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px]" />
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px]" />

                  <div className="relative z-10 flex flex-col gap-9">
                    {/* 1. Frequency Display & Tuning Bar */}
                    <div className="relative bg-[#080807] rounded-3xl p-6 border border-white/[0.03] shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] overflow-hidden">
                      {/* Interactive Tuning Scale */}
                      <div className="relative h-14 w-full flex items-center justify-center overflow-hidden" dir="ltr">
                        {/* Scale Ticks */}
                        <div className="flex items-center gap-1.5 opacity-20 transition-all duration-700">
                          {[...Array(81)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-0.5 rounded-full bg-emerald-200 ${i % 10 === 0 ? 'h-6' : i % 5 === 0 ? 'h-4' : 'h-2'}`}
                            />
                          ))}
                        </div>

                        {/* Frequency Numbers */}
                        <div className="absolute top-0 inset-x-0 flex justify-between px-2 text-[6px] font-black text-emerald-500/20 uppercase tracking-tighter" dir="ltr">
                          <span>88.0</span>
                          <span>92.0</span>
                          <span>96.0</span>
                          <span>100.0</span>
                          <span>104.0</span>
                          <span>108.0</span>
                        </div>

                        {/* Active Glow Needle */}
                        <motion.div
                          animate={{ x: `${(RADIO_STATIONS.findIndex(s => s.id === selectedRadioStation.id) / (RADIO_STATIONS.length - 1)) * 100 - 50}%` }}
                          transition={{ type: "spring", stiffness: 45, damping: 12 }}
                          className="absolute inset-y-0 w-1 flex flex-col items-center justify-between py-1 z-20 pointer-events-none"
                          dir="ltr"
                        >
                          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.8)]" />
                          <div className="w-0.5 h-full bg-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.8)]" />
                        </motion.div>
                      </div>

                      {/* 2. Main Station Name Display ('Digital VFD Look') */}
                      <div className="mt-4 relative bg-black/40 rounded-2xl p-5 border border-white/[0.05] shadow-2xl flex flex-col items-center justify-center min-h-[90px] overflow-hidden">
                        <motion.div
                          animate={isPlaying ? { opacity: [0.03, 0.08, 0.03] } : { opacity: 0.03 }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-emerald-500 blur-2xl"
                        />

                        <AnimatePresence mode="wait">
                          <motion.div
                            key={selectedRadioStation.id}
                            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                            className="text-center relative z-10 w-full"
                          >
                            <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)] tracking-tight leading-none mb-1">
                              {selectedRadioStation.name.replace('إذاعة ', '')}
                            </h3>
                            <div className="flex items-center justify-center gap-2">
                              {isPlaying && (
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                  className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                                />
                              )}
                              <span className="text-[8px] font-black text-emerald-500/30 uppercase tracking-[0.3em]">
                                {isBuffering ? 'Buffering Link...' : isPlaying ? 'Transmitting Live' : 'Signal Ready'}
                              </span>
                            </div>
                          </motion.div>
                        </AnimatePresence>

                        {/* Frequency Waveflow (Animated when playing) */}
                        <div className="absolute bottom-2 inset-x-6 h-6 flex items-end justify-center gap-[2px] opacity-20">
                          {[...Array(20)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={isPlaying ? {
                                height: [4, Math.random() * 16 + 4, 4],
                                opacity: [0.3, 0.7, 0.3]
                              } : { height: 4 }}
                              transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.05 }}
                              className="w-1 bg-emerald-500 rounded-t-full"
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 3. Controls Section */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-10 px-2 lg:px-4">
                      {/* Play Button - Centered */}
                      <div className="relative group/play flex-shrink-0">
                        <motion.button
                          onClick={togglePlay}
                          whileTap={{ scale: 0.92 }}
                          className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 border-[10px] dark:border-[#1a1816] shadow-2xl
                            ${isPlaying
                              ? 'bg-[#1a1816] text-emerald-500 border-[#2a2723]'
                              : 'bg-emerald-500 text-white border-white/[0.05] shadow-emerald-500/20'
                            }
                          `}
                        >
                          <AnimatePresence>
                            <motion.div
                              key={isBuffering ? 'buff' : isPlaying ? 'pause' : 'play'}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center justify-center"
                            >
                              {isBuffering ? (
                                <Loader2 className="w-10 h-10 animate-spin" />
                              ) : isPlaying ? (
                                <Pause className="w-12 h-12 fill-current" />
                              ) : (
                                <Play className="w-12 h-12 fill-current translate-x-1.5" />
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </motion.button>
                      </div>

                      <div className="flex-1 w-full flex flex-col gap-6">
                        {/* Navigation Row */}
                        <div className="flex items-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePrevStation}
                            className="flex-1 h-16 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all shadow-lg"
                          >
                            <ChevronRight className="w-7 h-7 ml-2" />
                            <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">السابق</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNextStation}
                            className="flex-1 h-16 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all shadow-lg"
                          >
                            <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">التالي</span>
                            <ChevronLeft className="w-7 h-7 mr-2" />
                          </motion.button>
                        </div>

                        {/* Volume Gauge */}
                        <div className="bg-black/40 rounded-2xl p-4 border border-white/[0.05] shadow-inner" dir="ltr">
                          <div className="flex justify-between items-center mb-3 px-1">
                            <div className="flex items-center gap-2">
                              <Volume2 className="w-3.5 h-3.5 text-emerald-500/40" />
                              <span className="text-[9px] font-black text-emerald-500/20 uppercase tracking-[0.2em]">Master Output</span>
                            </div>
                            <span className="text-[10px] font-mono font-black text-emerald-500 tabular-nums bg-emerald-500/10 px-2 py-0.5 rounded-md">{Math.round(volume * 100)}%</span>
                          </div>
                          <div className="relative h-6 flex items-center group/vol">
                            <div className="w-full h-1.5 bg-white/[0.03] rounded-full overflow-hidden border border-white/5 shadow-inner">
                              <motion.div
                                animate={{ width: `${volume * 100}%` }}
                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                              />
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={volume}
                              onChange={handleVolumeChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {/* Visual Handle */}
                            <motion.div
                              animate={{ left: `${volume * 100}%` }}
                              className="absolute w-4 h-4 bg-white rounded-full border-2 border-emerald-500 shadow-xl pointer-events-none -ml-2 opacity-0 group-hover/vol:opacity-100 transition-opacity"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <audio
                  ref={radioAudioRef}
                  src={selectedRadioStation.url}
                  preload="metadata"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onWaiting={() => setIsBuffering(true)}
                  onPlaying={() => setIsBuffering(false)}
                  onCanPlay={() => setIsBuffering(false)}
                  onEnded={() => setIsPlaying(false)}
                  onError={(e) => {
                    console.error('Radio Error:', e);
                    setIsPlaying(false);
                    setIsBuffering(false);
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'quran' && (
            <div className="flex flex-col gap-6">
              {!selectedSurah ? (
                <div className="space-y-6">
                  {/* Search Bar - More Premium */}
                  <div className="relative group px-1">
                    <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                      <Search className="w-5 h-5 text-blue-500/60 group-focus-within:text-blue-500 group-focus-within:scale-110 transition-all" />
                    </div>
                    <input
                      type="text"
                      placeholder="ابحث عن اسم السورة..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-14 pl-5 py-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 rounded-3xl text-base font-black focus:outline-none focus:ring-[6px] focus:ring-blue-500/5 shadow-sm dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>

                  {/* Surah List - Better Spacing for Mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 pb-12">
                    {filteredSurahs.map((surah, idx) => (
                      <motion.button
                        key={surah.number}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                        onClick={() => setSelectedSurah(surah)}
                        whileHover={{ y: -4, x: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="group flex items-center gap-5 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2rem] transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/5 relative overflow-hidden"
                      >
                        <div className="w-14 h-14 shrink-0 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center font-mono text-xs font-black text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-12 shadow-sm">
                          {surah.number.toString().padStart(3, '0')}
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <h4 className="font-amiri font-black text-slate-800 dark:text-white text-2xl leading-none mb-2">{surah.name}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{surah.englishName}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                            <span className="text-[10px] text-blue-500 font-black px-2 py-0.5 bg-blue-500/5 rounded-lg border border-blue-500/10">{surah.numberOfAyahs} آيـة</span>
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:border-blue-500 transition-all">
                          <Play className="w-5 h-5 text-blue-500 group-hover:text-white group-hover:fill-current" />
                        </div>
                      </motion.button>
                    ))}
                    {filteredSurahs.length === 0 && (
                      <div className="col-span-full py-24 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-6">
                          <Search className="w-10 h-10 text-slate-200 dark:text-slate-800" />
                        </div>
                        <p className="text-slate-400 font-black text-lg">لم نعثر على أي نتائج.. جرب كلمة أخرى</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="premium-card min-h-[480px] shadow-[0_32px_80px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.4)] relative overflow-hidden flex flex-col items-center justify-between p-8 border-white/40 dark:border-white/10 group">
                    {/* Premium Spiritual Background */}
                    <div className="absolute inset-0 z-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-900 to-slate-900 opacity-90 dark:opacity-100" />
                      <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')] mix-blend-overlay" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.4),transparent_70%)]" />
                    </div>

                    {/* Top Actions */}
                    <div className="absolute top-6 right-6 z-20">
                      <button
                        onClick={() => { setSelectedSurah(null); setIsPlaying(false); if (quranAudioRef.current) quranAudioRef.current.pause(); }}
                        className="p-3 bg-white/10 backdrop-blur-3xl text-white rounded-2xl hover:bg-white/20 hover:scale-110 active:scale-95 transition-all border border-white/10"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Player Content */}
                    <div className="relative z-10 w-full flex flex-col items-center gap-10">
                      {/* Header: Surah Info */}
                      <div className="text-center mt-12 space-y-4">
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10"
                        >
                          <BookOpen className="w-4 h-4 text-blue-300" />
                          <span className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em]">القرآن الكريم</span>
                        </motion.div>

                        <h3 className="text-5xl font-amiri font-black text-white drop-shadow-2xl">{selectedSurah.name}</h3>

                        <div className="flex items-center gap-3 justify-center">
                          <span className="text-blue-200/60 text-xs font-black uppercase tracking-widest">{selectedSurah.englishName}</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400/40" />
                          <span className="text-blue-200/80 text-[11px] font-bold">{selectedSurah.numberOfAyahs} آية</span>
                        </div>
                      </div>

                      {/* Progress Area */}
                      <div className="w-full max-w-[320px] space-y-4">
                        <div className="relative h-1.5 bg-white/10 rounded-full group cursor-pointer overflow-hidden backdrop-blur-sm">
                          <motion.div
                            animate={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                            className="absolute h-full bg-gradient-to-r from-blue-400 to-indigo-400 shadow-[0_0_15px_rgba(96,165,250,0.6)]"
                          />
                          <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            step="0.1"
                            value={currentTime}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono font-black text-blue-100/40 px-0.5 uppercase tracking-widest">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Main Controls */}
                      <div className="flex items-center justify-center gap-10">
                        <motion.button
                          whileHover={{ scale: 1.1, x: -5 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 text-white/40 hover:text-white transition-colors"
                        >
                          <SkipBack className="w-7 h-7" />
                        </motion.button>

                        <motion.button
                          onClick={togglePlay}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-24 h-24 rounded-[3rem] flex items-center justify-center bg-white text-blue-900 shadow-[0_20px_50px_rgba(255,255,255,0.2)] transition-all relative overflow-hidden group/play"
                        >
                          <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover/play:opacity-10 transition-opacity" />
                          {isBuffering ? <Loader2 className="w-10 h-10 animate-spin" /> : isPlaying ? <Pause className="w-12 h-12 fill-current" /> : <Play className="w-12 h-12 fill-current translate-x-1.5" />}
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1, x: 5 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 text-white/40 hover:text-white transition-colors"
                        >
                          <SkipForward className="w-7 h-7" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Volume Bar: Vertical style? No, stay horizontal but premium */}
                    <div className="w-full relative z-10" dir="ltr">
                      <div className="bg-black/20 backdrop-blur-2xl rounded-3xl p-5 border border-white/5 shadow-inner">
                        <div className="flex items-center gap-5">
                          <button onClick={toggleMute} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-sm transition-all hover:bg-white/20 active:scale-95">
                            {isMuted || volume === 0 ? <VolumeX className="w-6 h-6 text-rose-400" /> : <Volume2 className="w-6 h-6" />}
                          </button>
                          <div className="flex-1 relative h-6 flex items-center">
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                              <motion.div animate={{ width: `${volume * 100}%` }} className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={volume}
                              onChange={handleVolumeChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                          </div>
                          <span className="text-xs font-black text-white/60 min-w-[36px] font-mono">{Math.round(volume * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <audio
                    ref={quranAudioRef}
                    src={selectedSurah ? `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${selectedSurah.number}.mp3` : ''}
                    preload="metadata"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={() => setIsBuffering(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                  />
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}