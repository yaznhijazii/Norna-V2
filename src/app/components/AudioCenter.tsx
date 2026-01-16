import { useState, useEffect, useRef } from 'react';
import { Headphones, Radio, BookOpen, Play, Pause, Volume2, VolumeX, X, Search, Loader2, Music, Waves, Mic2, Heart, SkipForward, SkipBack } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PodcastCard } from './PodcastCard';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
}

export function AudioCenter() {
  const [activeTab, setActiveTab] = useState<'podcast' | 'radio' | 'quran'>('podcast');
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

  const togglePlay = () => {
    const audio = activeTab === 'radio' ? radioAudioRef.current : quranAudioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      if (activeTab === 'radio') {
        setIsBuffering(true);
        audio.load();
      }
      audio.play().catch(err => {
        console.error('Error playing:', err);
        setIsBuffering(false);
      });
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
    { id: 'podcast', label: 'بودكاست', icon: Headphones, color: 'purple', gradient: 'from-purple-500 to-indigo-600' },
    { id: 'radio', label: 'إذاعة', icon: Radio, color: 'emerald', gradient: 'from-emerald-500 to-teal-600' },
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
              onClick={() => { setActiveTab(tab.id); setIsPlaying(false); }}
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
            <div className="premium-card p-6 sm:p-8 shadow-2xl relative overflow-hidden group border-white/40 dark:border-white/10">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-emerald-500/15 transition-all duration-1000" />

              <div className="relative z-10 flex flex-col gap-8">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">Live Signal</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-800 dark:text-white font-mono tracking-tighter leading-none">90.9 FM</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2">البث الحي لإذاعة القرآن الكريم</p>
                  </div>
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                    <Waves className={`w-8 h-8 text-emerald-500 ${isPlaying ? 'animate-bounce' : ''}`} />
                  </div>
                </div>

                {/* Animated Display Area */}
                <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden min-h-[160px] flex flex-col justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.15)_0%,_transparent_70%)]" />
                  <div className="relative flex flex-col items-center gap-6">
                    <div className="flex items-end gap-1.5 h-16 w-full opacity-60">
                      {[...Array(28)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: isPlaying ? [6, Math.random() * 50 + 10, 6] : 6 }}
                          transition={{ duration: 0.4 + Math.random() * 0.6, repeat: Infinity }}
                          className="flex-1 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                        />
                      ))}
                    </div>
                    <div className="text-center group-hover:scale-105 transition-transform">
                      <h4 className="font-black text-emerald-400 text-base tracking-[0.2em] uppercase">MISHARY ALAFASY</h4>
                      <p className="text-emerald-500/60 text-[10px] uppercase font-black mt-2 tracking-widest">Global Broadcast Network</p>
                    </div>
                  </div>
                </div>

                {/* Player Controls */}
                <div className="flex items-center gap-8">
                  <motion.button
                    onClick={togglePlay}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all relative
                      ${isPlaying
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-8 ring-emerald-500/10'
                        : 'bg-emerald-500 text-white shadow-emerald-500/40'
                      }
                    `}
                  >
                    {isBuffering ? <Loader2 className="w-8 h-8 animate-spin" /> : isPlaying ? <Pause className="w-9 h-9 fill-current" /> : <Play className="w-9 h-9 fill-current translate-x-1" />}
                  </motion.button>

                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Master Level</span>
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">{Math.round(volume * 100)}%</span>
                    </div>
                    <div className="relative group h-10 flex items-center px-1">
                      <div className="absolute w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${volume * 100}%` }}
                          className="absolute h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
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
                    </div>
                  </div>
                </div>
              </div>
              <audio
                ref={radioAudioRef}
                src="https://qurango.net/radio/mishary_alafasi"
                onPlay={() => { setIsPlaying(true); setIsBuffering(false); }}
                onPause={() => { setIsPlaying(false); setIsBuffering(false); }}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onError={(e) => {
                  console.error('Radio Error:', e);
                  setIsPlaying(false);
                  setIsBuffering(false);
                  // Try a fallback if the main one fails
                  if (radioAudioRef.current && radioAudioRef.current.src !== "https://stream.radiojar.com/8s5u8p3p0uquv") {
                    radioAudioRef.current.src = "https://stream.radiojar.com/8s5u8p3p0uquv";
                    radioAudioRef.current.load();
                    radioAudioRef.current.play();
                  }
                }}
              />
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
                <div className="premium-card p-6 sm:p-10 shadow-[0_32px_80px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.4)] relative overflow-hidden text-center border-white/40 dark:border-white/10">
                  <div className="absolute top-6 right-6 z-20">
                    <button
                      onClick={() => { setSelectedSurah(null); setIsPlaying(false); if (quranAudioRef.current) quranAudioRef.current.pause(); }}
                      className="p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-rose-500 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-md border border-slate-100 dark:border-white/10"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-10 pt-6">
                      <div className="absolute -inset-10 bg-blue-500/25 blur-[100px] rounded-full animate-pulse" />
                      <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl flex items-center justify-center relative ring-4 ring-white/10">
                        <BookOpen className="w-12 h-12 text-white" />
                        {isPlaying && (
                          <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ repeat: Infinity, duration: 2.5 }}
                            className="absolute inset-0 bg-blue-400 rounded-[2.5rem] -z-10"
                          />
                        )}
                      </div>
                    </div>

                    <h3 className="text-4xl font-amiri font-black text-slate-800 dark:text-white mb-3 tracking-tight">{selectedSurah.name}</h3>
                    <div className="flex items-center gap-3 justify-center mb-12">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black rounded-lg uppercase tracking-[0.2em]">{selectedSurah.englishName}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <span className="text-slate-400 dark:text-slate-500 text-xs font-bold">{selectedSurah.numberOfAyahs} آية</span>
                    </div>

                    <div className="w-full max-w-sm space-y-10">
                      <div className="space-y-5">
                        <div className="relative h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full group cursor-pointer">
                          <div className="absolute inset-0 rounded-full overflow-hidden">
                            <motion.div
                              animate={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                              className="absolute h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                            />
                          </div>
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
                        <div className="flex justify-between text-[11px] font-mono font-black text-slate-400 px-1 uppercase tracking-widest">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-10">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <SkipBack className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                        </motion.button>

                        <motion.button
                          onClick={togglePlay}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-28 h-28 rounded-[3.5rem] flex items-center justify-center shadow-[0_24px_50px_rgba(59,130,246,0.4)] transition-all relative
                                ${isPlaying ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-[12px] ring-blue-500/10' : 'bg-blue-600 text-white'}
                            `}
                        >
                          {isBuffering ? <Loader2 className="w-10 h-10 animate-spin" /> : isPlaying ? <Pause className="w-12 h-12 fill-current" /> : <Play className="w-12 h-12 fill-current translate-x-1.5" />}
                        </motion.button>

                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <SkipForward className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                        </motion.button>
                      </div>

                      <div className="bg-slate-50/50 dark:bg-white/5 rounded-[2.5rem] p-6 border border-slate-100 dark:border-white/10 shadow-inner">
                        <div className="flex items-center gap-4">
                          <button onClick={toggleMute} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-500 shadow-sm transition-transform active:scale-95">
                            {isMuted || volume === 0 ? <VolumeX className="w-6 h-6 text-rose-500" /> : <Volume2 className="w-6 h-6" />}
                          </button>
                          <div className="flex-1 relative h-6 flex items-center">
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <motion.div animate={{ width: `${volume * 100}%` }} className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
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
                          <span className="text-xs font-black text-slate-500 dark:text-slate-400 min-w-[36px]">{Math.round(volume * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <audio
                    ref={quranAudioRef}
                    src={`https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${selectedSurah.number}.mp3`}
                    onPlay={() => { setIsPlaying(true); setIsBuffering(false); }}
                    onPause={() => { setIsPlaying(false); setIsBuffering(false); }}
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={() => setIsBuffering(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div >
  );
}