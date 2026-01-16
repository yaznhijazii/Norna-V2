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
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-[#F8FAFC]" dir="rtl">
      {/* Soft Premium Mesh Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-emerald-100 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[60%] bg-indigo-100 rounded-full blur-[100px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block relative mb-6"
          >
            <div className="absolute inset-0 bg-white/40 blur-3xl rounded-full" />
            <img
              src={logoImage}
              alt="نورنا"
              className="w-20 h-20 rounded-[1.8rem] shadow-2xl relative z-10 border border-white"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter mb-1">
              نورنا
            </h1>
            <p className="text-[#64748B] font-bold text-[10px] uppercase tracking-[0.4em]">حب يضيء بالإيمان</p>
          </motion.div>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-white relative overflow-hidden">
          {/* Internal Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 blur-3xl rounded-full" />

          {/* Mode Switcher - Pill Style */}
          <div className="flex bg-[#F1F5F9] p-1.5 rounded-[1.5rem] mb-10 relative">
            <div
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-[1.2rem] shadow-sm transition-transform duration-500 ease-out
                ${mode === "signup" ? "translate-x-[-100%]" : "translate-x-0"}`}
            />
            <button
              onClick={() => setMode("login")}
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-xs transition-all duration-300 relative z-10
                ${mode === "login" ? "text-[#0F172A]" : "text-slate-400"}`}
            >
              <LogIn className={`w-3.5 h-3.5 transition-colors ${mode === "login" ? "text-indigo-500" : "text-slate-300"}`} />
              تسجيل الدخول
            </button>
            <button
              onClick={() => setMode("signup")}
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-xs transition-all duration-300 relative z-10
                ${mode === "signup" ? "text-[#0F172A]" : "text-slate-400"}`}
            >
              <UserPlus className={`w-3.5 h-3.5 transition-colors ${mode === "signup" ? "text-emerald-500" : "text-slate-300"}`} />
              إنشاء حساب
            </button>
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {mode === "signup" && (
                  <div className="space-y-3">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest pr-2">الاسم الحقيقي</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-100 rounded-2xl px-6 py-4 text-[#0F172A] font-bold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-200 transition-all placeholder:text-slate-300"
                      placeholder="اسمك الكريم"
                      required
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest pr-2">اسم المستخدم الحصري</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    className="w-full bg-[#F8FAFC] border border-slate-100 rounded-2xl px-6 py-4 text-[#0F172A] font-bold outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 transition-all placeholder:text-slate-300"
                    placeholder="shurooq_99"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest pr-2">كلمة المرور الخاصة بك</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-100 rounded-2xl px-6 py-4 text-[#0F172A] font-bold outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-200 transition-all placeholder:text-slate-300"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-50 border border-rose-100 text-rose-500 px-5 py-3 rounded-xl text-[10px] font-black text-center uppercase tracking-widest"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group"
            >
              <div className="absolute inset-0 bg-slate-900 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-[#0F172A] text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                ) : (
                  <>
                    <span className="text-[12px] uppercase tracking-[0.2em]">{mode === "login" ? "الدخول" : "تأكيد الانضمام"}</span>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </>
                )}

                {/* Shine Hover Effect */}
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-xl" />
              </div>
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em] mt-8 opacity-60">
          نورونا . تجربة دينية مشتركة
        </p>
      </motion.div>
    </div>
  );
}

// Custom Loader Icon for better styling
function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}