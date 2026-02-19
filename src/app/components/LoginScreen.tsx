import { useState } from "react";
import { LogIn, UserPlus, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../utils/supabase";

const logoImage = 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png';

interface LoginScreenProps {
  onLogin: (username: string, name: string, userId: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase
        .rpc('login_user', {
          p_password: password,
          p_username: username
        });

      if (rpcError) {
        setError("حدث خطأ، الرجاء المحاولة مرة أخرى");
        setLoading(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (data?.user) {
        localStorage.setItem('nooruna_token', data.token);
        const userToStore = {
          id: data.user.id,
          userId: data.user.id,
          username: data.user.username,
          name: data.user.name
        };
        localStorage.setItem('nooruna_user', JSON.stringify(userToStore));
        onLogin(data.user.username, data.user.name, data.user.id);
      }
    } catch (err) {
      setError("حدث خطأ، الرجاء المحاولة مرة أخرى");
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase
        .rpc('register_user', {
          p_username: username,
          p_password: password,
          p_name: name.trim()
        });

      if (rpcError || data?.error) {
        setError(data?.error || "حدث خطأ أثناء إنشاء الحساب");
        setLoading(false);
        return;
      }

      if (data?.user) {
        localStorage.setItem('nooruna_token', data.token);
        const userToStore = {
          id: data.user.id,
          userId: data.user.id,
          username: data.user.username,
          name: data.user.name
        };
        localStorage.setItem('nooruna_user', JSON.stringify(userToStore));
        onLogin(data.user.username, data.user.name, data.user.id);
      }
    } catch (err) {
      setError("حدث خطأ أثناء إنشاء الحساب");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-slate-950" dir="rtl">
      {/* Premium Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.05)_0%,_transparent_50%)]" />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-5%] w-[70%] h-[70%] bg-emerald-500 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, -20, 0],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-[120px]"
        />
        {/* Subtle Islamic Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')] bg-repeat" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Brand Identity */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block relative mb-8"
          >
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
            <div className="relative p-1 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-[2.2rem] shadow-2xl">
              <motion.img
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                src={logoImage}
                alt="نورنا"
                className="w-24 h-24 rounded-[2rem] shadow-inner border border-white/20"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h1 className="text-5xl font-black text-white tracking-tight font-amiri">
              نورنــــا
            </h1>
            <p className="text-emerald-400/80 font-bold text-xs uppercase tracking-[0.4em]">يُضيء بالإيمان والمودة</p>
          </motion.div>
        </div>

        {/* Auth Card - Advanced Glassmorphism */}
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[3.5rem] p-10 border border-white/10 shadow-2xl shadow-black/50 relative overflow-hidden">
          {/* Decorative Internal Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full" />

          {/* Mode Switcher */}
          <div className="flex bg-white/[0.05] p-2 rounded-[2rem] mb-12 relative border border-white/5">
            <motion.div
              layoutId="pill"
              className={`absolute top-2 bottom-2 w-[calc(50%-8px)] bg-emerald-500 rounded-[1.6rem] shadow-lg shadow-emerald-500/20 right-2
                ${mode === "login" ? "translate-x-0" : "-translate-x-full"}`}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
            <button
              onClick={() => setMode("login")}
              type="button"
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm transition-colors relative z-10
                ${mode === "login" ? "text-white" : "text-white/40"}`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>
            <button
              onClick={() => setMode("signup")}
              type="button"
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm transition-colors relative z-10
                ${mode === "signup" ? "text-white" : "text-white/40"}`}
            >
              <UserPlus className="w-4 h-4" />
              <span>إنشاء حساب</span>
            </button>
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {mode === "signup" && (
                  <div className="space-y-3 group">
                    <label className="block text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] pr-4">الاسم الكامل</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all placeholder:text-white/20"
                        placeholder="أدخل اسمك الكريم"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] pr-4">اسم المستخدم</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all placeholder:text-white/20"
                    placeholder="Username"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] pr-4">كلمة المرور</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all placeholder:text-white/20"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-6 py-4 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group"
            >
              <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-4 group-hover:shadow-emerald-500/20 group-hover:-translate-y-0.5">
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span className="text-sm uppercase tracking-[0.2em]">{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-white/30 text-[10px] font-bold uppercase tracking-[0.5em] mt-12 pb-10">
          NORNA • AUTHENTIC SPIRITUAL CONNECT
        </p>
      </motion.div>
    </div>
  );
}
