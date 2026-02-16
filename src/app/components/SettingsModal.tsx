import { useState, useEffect } from 'react';
import { Settings, X, User, Upload, Heart, Copy, CheckCircle2, Link2, Youtube, Radio, Sun, Moon, Trophy, Star, TrendingUp, LogOut, ArrowLeft, Award, Bell, ShieldCheck, AlertCircle } from 'lucide-react';
import { notificationService } from '../utils/notifications';
import { testPushNotification, isPushNotificationSupported } from '../utils/pushNotifications';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { supabase } from '../utils/supabase';
import { getUserById, linkPartner, unlinkPartner, getUserByPartnerCode, getWeekPrayers, getWeekAthkarProgress, getWeekQuranProgress } from '../utils/db';
import { motion, AnimatePresence } from 'motion/react';

// Generate unique partner code
const generatePartnerCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

interface UserProgress {
  name: string;
  prayers: number;
  quran: {
    totalPages: number;
    baqarah: number;
    mulk: number;
    kahf: number;
  };
  athkar: {
    total: number;
    morning: number;
    evening: number;
  };
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: 'auto' | 'light' | 'dark';
  onThemeToggle: () => void;
  onLogout?: () => void;
}

export function SettingsModal({ isOpen, onClose, themeMode, onThemeToggle, onLogout }: SettingsModalProps) {
  const [currentUserId, setCurrentUserId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [partnerNickname, setPartnerNickname] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Partner settings state
  const [myCode, setMyCode] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [podcastUrl, setPodcastUrl] = useState('');
  const [loadingPodcast, setLoadingPodcast] = useState(false);
  const [copied, setCopied] = useState(false);

  // Weekly stats state
  const [myProgress, setMyProgress] = useState<UserProgress | null>(null);
  const [partnerProgress, setPartnerProgress] = useState<UserProgress | null>(null);
  const [hasPartner, setHasPartner] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isRamadanMode, setIsRamadanMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAllSettings();
      const savedRamadan = localStorage.getItem('ramadanMode');
      setIsRamadanMode(savedRamadan === 'true');
    }
  }, [isOpen]);

  const toggleRamadanMode = () => {
    const newVal = !isRamadanMode;
    setIsRamadanMode(newVal);
    localStorage.setItem('ramadanMode', newVal.toString());
    window.dispatchEvent(new Event('ramadanModeChange'));
  };

  const loadAllSettings = async () => {
    const userStr = localStorage.getItem('nooruna_user');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    setCurrentUserId(user.id);

    // Load user settings
    const { data, error: userError } = await supabase
      .from('users')
      .select('avatar_url, partner_nickname, partner_code, partner_id, podcast_id')
      .eq('id', user.id)
      .single();

    if (data) {
      setAvatarUrl(data.avatar_url || '');
      setPartnerNickname(data.partner_nickname || '');

      // Handle partner code
      if (!data.partner_code || data.partner_code === '') {
        let newCode = generatePartnerCode();
        let isUnique = false;
        while (!isUnique) {
          const existing = await getUserByPartnerCode(newCode);
          if (!existing) {
            isUnique = true;
          } else {
            newCode = generatePartnerCode();
          }
        }

        const { error } = await supabase
          .from('users')
          .update({ partner_code: newCode })
          .eq('id', user.id);

        if (!error) {
          setMyCode(newCode);
        }
      } else {
        setMyCode(data.partner_code);
      }

      // Check if has partner
      if (data.partner_id) {
        const partner = await getUserById(data.partner_id);
        if (partner) {
          setPartnerName(partner.name);
          setHasPartner(true);
        }
      }

      setPodcastUrl(data.podcast_id ? `https://www.youtube.com/watch?v=${data.podcast_id}` : '');
    }

    // Load weekly stats
    loadWeeklyData(user.id);
  };

  const loadWeeklyData = async (userId: string) => {
    setLoading(true);
    try {
      const user = await getUserById(userId);
      if (!user) return;

      const myProgressData = await calculateUserProgress(userId, user.name);
      setMyProgress(myProgressData);

      if (user.partner_id) {
        const partner = await getUserById(user.partner_id);
        if (partner) {
          setHasPartner(true);
          const partnerProgressData = await calculateUserProgress(user.partner_id, partner.name);
          setPartnerProgress(partnerProgressData);
        }
      } else {
        setHasPartner(false);
        setPartnerProgress(null);
      }
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserProgress = async (userId: string, name: string): Promise<UserProgress> => {
    try {
      const weekPrayers = await getWeekPrayers(userId);
      const totalPrayers = weekPrayers.reduce((sum, day) => {
        return sum +
          (day.fajr ? 1 : 0) +
          (day.dhuhr ? 1 : 0) +
          (day.asr ? 1 : 0) +
          (day.maghrib ? 1 : 0) +
          (day.isha ? 1 : 0);
      }, 0);

      const weekQuran = await getWeekQuranProgress(userId);
      const quranStats = {
        totalPages: 0,
        baqarah: 0,
        mulk: 0,
        kahf: 0,
      };

      weekQuran.forEach((reading: any) => {
        const pages = reading.pages_read || 0;
        quranStats.totalPages += pages;

        if (reading.surah_name === 'baqarah') {
          quranStats.baqarah += pages;
        } else if (reading.surah_name === 'mulk') {
          quranStats.mulk += pages;
        } else if (reading.surah_name === 'kahf') {
          quranStats.kahf += pages;
        }
      });

      const weekAthkar = await getWeekAthkarProgress(userId);
      const athkarDates = new Map<string, { morning: boolean; evening: boolean }>();

      weekAthkar.forEach((athkar: any) => {
        if (!athkar.completed) return;

        const date = athkar.date;
        if (!athkarDates.has(date)) {
          athkarDates.set(date, { morning: false, evening: false });
        }

        const dayData = athkarDates.get(date)!;
        if (athkar.type === 'morning') {
          dayData.morning = true;
        } else if (athkar.type === 'evening') {
          dayData.evening = true;
        }
      });

      let morningDays = 0;
      let eveningDays = 0;
      let bothDays = 0;

      athkarDates.forEach((data) => {
        if (data.morning) morningDays++;
        if (data.evening) eveningDays++;
        if (data.morning && data.evening) bothDays++;
      });

      return {
        name,
        prayers: totalPrayers,
        quran: quranStats,
        athkar: {
          total: bothDays,
          morning: morningDays,
          evening: eveningDays,
        },
      };
    } catch (error) {
      console.error('Error calculating progress:', error);
      return {
        name,
        prayers: 0,
        quran: { totalPages: 0, baqarah: 0, mulk: 0, kahf: 0 },
        athkar: { total: 0, morning: 0, evening: 0 },
      };
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        const { error } = await supabase
          .from('users')
          .update({ avatar_url: base64 })
          .eq('id', currentUserId);

        if (error) {
          console.error('Error uploading avatar:', error);
          alert('فشل رفع الصورة');
        } else {
          setAvatarUrl(base64);
          window.dispatchEvent(new Event('storage'));
        }

        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error:', error);
      setUploading(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!currentUserId) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ partner_nickname: partnerNickname })
        .eq('id', currentUserId);

      if (error) {
        console.error('Error saving nickname:', error);
        alert('فشل حفظ اللقب');
      } else {
        window.dispatchEvent(new Event('storage'));
        alert('تم الحفظ بنجاح! 💚');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = async () => {
    if (!myCode || myCode === '') return;

    try {
      await navigator.clipboard.writeText(myCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = myCode;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleLinkPartner = async () => {
    setError('');
    setSuccess('');

    if (!currentUserId) return;

    try {
      const partner = await getUserByPartnerCode(partnerCode.trim());

      if (!partner) {
        setError('الكود غير صحيح أو غير موجود');
        return;
      }

      if (partner.id === currentUserId) {
        setError('😅 لا يمكنك ربط حسابك بنفسك!\n\nلازم تربط مع مستخدم آخر عشان تقدر ترسل الهدايا.\n\n💡 نصيحة: اطلب من صديق/ة يسجل دخول ويعطيك الكود حقه!');
        return;
      }

      await linkPartner(currentUserId, partner.id);
      await linkPartner(partner.id, currentUserId);

      setPartnerName(partner.name);
      setHasPartner(true);
      setSuccess('تم الربط بنجاح! ♥');
      setPartnerCode('');

      window.dispatchEvent(new Event('storage'));
      loadWeeklyData(currentUserId);
    } catch (error) {
      console.error('Error linking partner:', error);
      setError('حدث خطأ أثناء الربط');
    }
  };

  const handleUnlinkPartner = async () => {
    if (!currentUserId) return;

    try {
      const user = await getUserById(currentUserId);
      if (user?.partner_id) {
        await unlinkPartner(currentUserId);
        await unlinkPartner(user.partner_id);

        setPartnerName('');
        setHasPartner(false);
        setSuccess('تم إلغاء الربط');

        window.dispatchEvent(new Event('storage'));
        loadWeeklyData(currentUserId);
      }
    } catch (error) {
      console.error('Error unlinking partner:', error);
      setError('حدث خطأ أثناء إلغاء الربط');
    }
  };

  const getPercentage = (value: number, max: number) => {
    return Math.min(Math.round((value / max) * 100), 100);
  };

  const getBadge = (prayers: number, quran: number, athkar: number) => {
    const total = prayers + quran + athkar;
    if (total >= 80) return { emoji: '🌟', title: 'متميز جداً!', color: 'gold' };
    if (total >= 60) return { emoji: '✨', title: 'ممتاز!', color: 'emerald' };
    if (total >= 40) return { emoji: '⭐', title: 'جيد جداً', color: 'blue' };
    if (total >= 20) return { emoji: '💫', title: 'جيد', color: 'purple' };
    return { emoji: '🌱', title: 'ابدأ قوي!', color: 'gray' };
  };

  const tabs = [
    { id: 'general', label: 'عام', icon: User },
    { id: 'partner', label: 'الشريك', icon: Heart },
    { id: 'podcast', label: 'البودكاست', icon: Radio },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'theme', label: 'المظهر', icon: Sun },
  ];

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [swSupported, setSwSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
    setSwSupported(isPushNotificationSupported());
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted) {
      alert('✅ تم تفعيل الإشعارات بنجاح!');
    } else {
      alert('❌ تم رفض صلاحية الإشعارات. يرجى تفعيلها من إعدادات المتصفح/الهاتف.');
    }
  };

  const handleTestNotif = async () => {
    await notificationService.show({
      title: 'نورنا - اختبار النظام 🔔',
      body: 'هذا إشعار تجريبي للتأكد من أن نظام التنبيهات يعمل بشكل صحيح على جهازك.',
      type: 'info',
      requireInteraction: false
    });
  };

  const handleTestInAppNotif = async () => {
    await notificationService.show({
      title: 'تم تحديث البيانات بنجاح ✨',
      body: 'نظام التنبيهات الداخلية يعمل! سيظهر هذا في سجل التنبيهات أيضاً.',
      type: 'success',
      requireInteraction: false
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white relative z-10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <Settings className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">الإعدادات</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <div className="px-4 py-2 bg-white z-10 shrink-0 border-b border-slate-50">
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all
                    flex items-center justify-center gap-2 z-10
                    ${activeTab === tab.id ? 'text-teal-700' : 'text-slate-500 hover:text-slate-700'}
                  `}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white shadow-sm rounded-lg border border-slate-200"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-slate-50/50">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-teal-400 to-emerald-400">
                          <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                <User className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                        </div>
                        <label className="absolute -bottom-0.5 -right-0.5 cursor-pointer">
                          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md border-2 border-white">
                            <Upload className="w-3 h-3" />
                          </div>
                        </label>
                      </div>

                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-sm">الملف الشخصي</h4>
                        <p className="text-[10px] text-slate-400">قم بتحديث صورتك ولقب شريكك</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block pr-1">لقب الشريك في التطبيق</label>
                        <div className="relative">
                          <Input
                            value={partnerNickname}
                            onChange={(e) => setPartnerNickname(e.target.value)}
                            placeholder="مثلاً: نوشي 💚"
                            className="text-center font-bold text-base h-11 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-teal-500 rounded-xl"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleSaveNickname}
                        disabled={saving || !partnerNickname.trim()}
                        className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
                      >
                        {saving ? 'جاري الحفظ...' : 'حفظ اللقب الجديد'}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-1">
                    <button
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                          onLogout?.();
                        }
                      }}
                      className="w-full p-3 rounded-xl flex items-center justify-between group hover:bg-white transition-all shadow-sm shadow-transparent hover:shadow-rose-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-700 text-xs">تسجيل الخروج</p>
                        </div>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-rose-300 group-hover:-translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'partner' && (
                <motion.div
                  key="partner"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Your Code */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Link2 className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-sm text-slate-800">كودك الخاص</h3>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">شاركه مع شريكك لترتبط به</span>
                    </div>

                    <div
                      className="bg-slate-50/80 rounded-xl p-4 flex items-center justify-between border border-slate-100 group cursor-pointer active:scale-[0.98] transition-all"
                      onClick={handleCopyCode}
                    >
                      <code className="text-xl font-mono font-bold text-slate-700 tracking-widest">{myCode}</code>
                      <div className={`
                        w-9 h-9 rounded-lg flex items-center justify-center transition-all
                        ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 group-hover:text-indigo-600 shadow-sm'}
                      `}>
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Partner Connection */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-sm text-slate-800 mb-4">حالة الشريك</h3>

                    {partnerName ? (
                      <div className="text-center py-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                        <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg shadow-emerald-50 relative">
                          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </div>
                          {partnerName.charAt(0)}
                        </div>
                        <p className="text-xs font-bold text-emerald-800 mb-4">أنت مرتبط حالياً مع {partnerName}</p>

                        <Button
                          variant="ghost"
                          onClick={handleUnlinkPartner}
                          className="h-9 px-4 text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          إلغاء الارتباط
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            placeholder="أدخل كود الشريك هنا"
                            value={partnerCode}
                            onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                            maxLength={8}
                            className="text-center font-mono tracking-widest uppercase h-11 text-base bg-slate-50/50 border-slate-100 rounded-xl"
                          />
                        </div>
                        <Button
                          onClick={handleLinkPartner}
                          disabled={!partnerCode || partnerCode.length < 8}
                          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
                        >
                          ربط الحساب
                        </Button>

                        {(error || success) && (
                          <div className={`p-3 rounded-xl text-center text-[10px] font-bold ${error ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {error || success}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'podcast' && (
                <motion.div
                  key="podcast"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                        <Youtube className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800">إدارة البودكاست</h3>
                        <p className="text-[10px] text-slate-400">قم بتغيير فيديو اليوتيوب الذي يظهر في المشعل الصوتي</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block pr-1">رابط فيديو YouTube</label>
                        <Input
                          value={podcastUrl}
                          onChange={(e) => setPodcastUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="h-11 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-red-500 rounded-xl text-sm"
                        />
                      </div>

                      <Button
                        onClick={async () => {
                          if (!currentUserId) return;
                          setLoadingPodcast(true);

                          // Extract Video ID from various YouTube URL formats
                          let videoId = podcastUrl;
                          if (podcastUrl.includes('v=')) {
                            videoId = podcastUrl.split('v=')[1].split('&')[0];
                          } else if (podcastUrl.includes('youtu.be/')) {
                            videoId = podcastUrl.split('youtu.be/')[1].split('?')[0];
                          } else if (podcastUrl.includes('embed/')) {
                            videoId = podcastUrl.split('embed/')[1].split('?')[0];
                          }

                          const { error } = await supabase
                            .from('users')
                            .update({ podcast_id: videoId })
                            .eq('id', currentUserId);

                          if (error) {
                            console.error('Error saving podcast:', error);
                            alert('فشل حفظ الرابط. تأكد من أن الرابط صحيح.');
                          } else {
                            alert('تم تحديث البودكاست بنجاح! ✨');
                            window.dispatchEvent(new Event('storage'));
                          }
                          setLoadingPodcast(false);
                        }}
                        disabled={loadingPodcast || !podcastUrl.trim()}
                        className="w-full h-11 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm"
                      >
                        {loadingPodcast ? 'جاري التحديث...' : 'تحديث البودكاست'}
                      </Button>

                      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          💡 <span className="font-bold">نصيحة:</span> يمكنك نسخ الرابط من تطبيق يوتيوب مباشرة ولصقه هنا. سيظهر الفيديو الجديد فوراً لكل منكما.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notifPermission === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800">حالة الإشعارات</h3>
                        <p className="text-[10px] text-slate-400">تحقق من قدرة التطبيق على إرسال التنبيهات</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          {notifPermission === 'granted' ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          )}
                          <span className="text-xs font-bold text-slate-700">الصلاحية:</span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${notifPermission === 'granted' ? 'bg-emerald-100 text-emerald-700' :
                          notifPermission === 'denied' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {notifPermission === 'granted' ? 'مقبولة' : notifPermission === 'denied' ? 'مرفوضة' : 'بانتظار الموافقة'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 ${swSupported ? 'text-emerald-500' : 'text-slate-300'}`} />
                          <span className="text-xs font-bold text-slate-700">دعم PWA:</span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${swSupported ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                          {swSupported ? 'مدعوم' : 'غير مدعوم'}
                        </span>
                      </div>
                    </div>

                    {notifPermission !== 'granted' && (
                      <Button
                        onClick={handleRequestPermission}
                        className="w-full mt-6 h-11 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm"
                      >
                        تفعيل الإشعارات الآن
                      </Button>
                    )}

                    {notifPermission === 'granted' && (
                      <div className="grid grid-cols-2 gap-3 mt-6">
                        <Button
                          onClick={handleTestNotif}
                          variant="outline"
                          className="h-11 border-slate-200 text-slate-600 text-[10px] font-bold rounded-xl hover:bg-slate-50"
                        >
                          تنبيه النظام 🧪
                        </Button>
                        <Button
                          onClick={handleTestInAppNotif}
                          variant="outline"
                          className="h-11 border-slate-200 text-slate-600 text-[10px] font-bold rounded-xl hover:bg-slate-50"
                        >
                          تنبيه داخلي ✨
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
                    <h4 className="font-bold text-amber-900 text-[10px] mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      ملاحظة لمستخدمي الآيفون
                    </h4>
                    <p className="text-[9px] text-amber-800 leading-relaxed opacity-90">
                      لتصلك الإشعارات والرسائل من شريكك، يجب إضافة التطبيق للشاشة الرئيسية (Add to Home Screen) من متصفح سفاري أولاً، ثم فتح التطبيق من الأيقونة الجديدة والموافقة على الصلاحية.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'theme' && (
                <motion.div
                  key="theme"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                      <h3 className="font-bold text-xs text-slate-700 flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>مظهر التطبيق</span>
                      </h3>
                    </div>

                    <div className="p-2 space-y-1">
                      {[
                        { id: 'auto', label: 'تلقائي (حسب الوقت)', icon: Trophy, color: 'text-purple-500', desc: 'نهاري في الصباح، ليلي في المساء' },
                        { id: 'light', label: 'الوضع النهاري', icon: Sun, color: 'text-amber-500', desc: 'مظهر مشرق وهادئ' },
                        { id: 'dark', label: 'الوضع الليلي', icon: Moon, color: 'text-indigo-500', desc: 'مظهر داكن ومريح للعين' }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => onThemeToggle()}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
                            ${themeMode === mode.id
                              ? 'bg-slate-50 border border-slate-100 shadow-inner'
                              : 'hover:bg-slate-50/50'
                            }
                          `}
                        >
                          <div className={`
                            w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
                            ${themeMode === mode.id ? 'bg-white shadow-sm ring-1 ring-slate-200/50' : 'bg-slate-50 group-hover:bg-white'}
                          `}>
                            <mode.icon className={`w-4 h-4 ${mode.color}`} />
                          </div>

                          <div className="flex-1 text-right">
                            <p className={`text-[11px] font-bold ${themeMode === mode.id ? 'text-slate-900' : 'text-slate-600'}`}>
                              {mode.label}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{mode.desc}</p>
                          </div>

                          <div className={`
                            w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                            ${themeMode === mode.id
                              ? 'border-teal-500 bg-teal-500'
                              : 'border-slate-200 group-hover:border-slate-300'
                            }
                          `}>
                            {themeMode === mode.id && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                      <h3 className="font-bold text-xs text-slate-700 flex items-center gap-2">
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>وضع رمضان</span>
                      </h3>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div className="flex-1 text-right">
                        <p className="text-[11px] font-bold text-slate-900">تفعيل مظهر رمضان</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">يُظهر زينة رمضان، العداد التنازلي، والسمات الذهبية</p>
                      </div>

                      <button
                        onClick={toggleRamadanMode}
                        className={`
                          w-12 h-6 rounded-full transition-all duration-300 relative
                          ${isRamadanMode ? 'bg-amber-500' : 'bg-slate-200'}
                        `}
                      >
                        <div className={`
                          absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm
                          ${isRamadanMode ? 'left-1' : 'left-7'}
                        `} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 items-start">
                    <div className="bg-white rounded-lg p-1.5 shadow-sm shrink-0">
                      <Award className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-900 text-[10px] mb-1">الوضع الذكي</h4>
                      <p className="text-[9px] text-indigo-700 leading-relaxed opacity-80">
                        يفضل استخدام الوضع "التلقائي" للحفاظ على صحة عينيك، حيث يتم ضبط الألوان آلياً بناءً على مواقيت الشروق والغروب في مدينتك.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}