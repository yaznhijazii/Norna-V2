import { useState } from "react";
import { LogIn, UserPlus, Heart, Sparkles, ChevronLeft } from "lucide-react";
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
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#0a0a0c]" dir="rtl">
      {/* Dynamic Mesh Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="inline-block relative"
          >
            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full" />
            <img
              src={logoImage}
              alt="نورنا"
              className="w-24 h-24 rounded-[2rem] shadow-2xl relative z-10 border border-white/20"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              نورنا
            </h1>
            <p className="text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">حب يضيء بالإيمان</p>
          </motion.div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative group">
          {/* Subtle Shine Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />

          {/* Mode Switcher */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-xs transition-all duration-500
                ${mode === "login" ? "bg-white text-black shadow-xl scale-[1.02]" : "text-white/40 hover:text-white/60"}`}
            >
              <LogIn className="w-3.5 h-3.5" />
              تسجيل الدخول
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-xs transition-all duration-500
                ${mode === "signup" ? "bg-white text-black shadow-xl scale-[1.02]" : "text-white/40 hover:text-white/60"}`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              حساب جديد
            </button>
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {mode === "signup" && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest pr-2">الاسم الكامل</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-white/10"
                      placeholder="نور أحمد"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest pr-2">اسم المستخدم</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-white/10"
                    placeholder="username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest pr-2">كلمة المرور</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-white/10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-[11px] font-bold text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group/btn"
            >
              <div className="absolute inset-0 bg-white blur-xl opacity-0 group-hover/btn:opacity-20 transition-opacity rounded-2xl" />
              <div className="relative bg-white text-slate-950 font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 overflow-hidden">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10">{mode === "login" ? "دخول" : "إنشاء الحساب"}</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
                {/* Button Shine Effect */}
                <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-black/5 to-transparent shadow-xl" />
              </div>
            </button>

            <p className="text-center text-white/20 text-[9px] font-bold uppercase tracking-widest pt-2">
              بمجرد دخولك، أنت توافق على رحلة الإيمان المشترك
            </p>
          </form>
        </div>

        {/* Floating Heart Decorations */}
        <div className="absolute -top-10 -right-10 opacity-10 blur-sm">
          <Heart className="w-20 h-20 text-white fill-current animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
        <div className="absolute -bottom-12 -left-12 opacity-5 blur-sm">
          <Heart className="w-32 h-32 text-indigo-500 fill-current animate-pulse" />
        </div>
      </motion.div>
    </div>
  );
}