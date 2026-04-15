import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, onAuthStateChanged, signOut } from './firebase';
import { LayoutDashboard, Users, Construction, Sprout, FileText, LogOut, LogIn, ShieldCheck, Moon, Sun, Wallet, ReceiptText, Home, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Dashboard from './components/Dashboard';
import HRManagement from './components/HRManagement';
import Accounting from './components/Accounting';
import Projects from './components/Projects';
import Farms from './components/Farms';
import Reports from './components/Reports';
import HomeManagement from './components/HomeManagement';
import AIAssistant from './components/AIAssistant';
import Settings from './components/Settings';

type Tab = 'dashboard' | 'workers' | 'accounting' | 'projects' | 'farms' | 'reports' | 'home' | 'ai' | 'settings';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [authError, setAuthError] = useState('');
  const [password, setPassword] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = async () => {
    if (loginLoading) return;

    setAuthError('');
    if (password !== 'الربدي') {
      setAuthError('كلمة المرور غير صحيحة. يرجى إدخال كلمة المرور الصحيحة.');
      return;
    }

    setLoginLoading(true);
    try {
      // For this specific app, we use a fixed admin account or allow Google login after password check
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/popup-blocked') {
        setAuthError('تم حظر النافذة المنبثقة. يرجى السماح بالمنبثقات في إعدادات المتصفح أو فتح التطبيق في نافذة جديدة.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setAuthError('تم إلغاء طلب تسجيل الدخول بسبب محاولة أخرى. يرجى الانتظار قليلاً ثم المحاولة مرة واحدة فقط.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.');
      } else {
        setAuthError('فشل تسجيل الدخول: ' + (error.message || 'خطأ غير معروف'));
      }
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden transition-all duration-700">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-highlight/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-card p-12 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] max-w-lg w-full text-center border border-border relative z-10 backdrop-blur-sm"
        >
          <div className="relative mb-10 group">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
            <div className="bg-gradient-to-br from-primary to-[#059669] w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)] relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <ShieldCheck className="w-14 h-14 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-foreground mb-3 tracking-tighter">مؤسسات الربدي</h1>
          <p className="text-secondary mb-12 font-bold uppercase tracking-[0.3em] text-xs">نظام الإدارة المتكامل</p>
          
          <div className="space-y-8">
            <div className="text-right space-y-3">
              <label className="block text-xs font-black text-secondary uppercase tracking-widest mr-2">مفتاح الدخول للنظام</label>
              <div className="relative group">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور..."
                  className="w-full px-8 py-5 rounded-2xl bg-background border border-border text-foreground outline-none focus:ring-2 focus:ring-primary transition-all text-center font-black text-xl tracking-widest placeholder:text-secondary/30 placeholder:tracking-normal placeholder:font-bold"
                />
              </div>
            </div>

            {authError && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                <p className="text-red-400 text-sm font-black">{authError}</p>
              </motion.div>
            )}

            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full flex items-center justify-center gap-4 bg-[#10b981] text-white px-8 py-6 rounded-[2rem] hover:bg-[#059669] transition-all font-black text-lg shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loginLoading ? (
                <div className="animate-spin rounded-full h-7 w-7 border-4 border-white/30 border-t-white"></div>
              ) : (
                <>
                  <LogIn className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  بدء الجلسة الآمنة
                </>
              )}
            </button>
          </div>
          
          <div className="mt-12 pt-8 border-t border-[#1e293b] flex items-center justify-center gap-3 opacity-40">
            <div className="w-2 h-2 bg-[#10b981] rounded-full" />
            <p className="text-[10px] text-[#94a3b8] font-black uppercase tracking-widest">محمي بواسطة تشفير الربدي المتقدم</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'workers': return <HRManagement />;
      case 'accounting': return <Accounting />;
      case 'projects': return <Projects />;
      case 'farms': return <Farms />;
      case 'reports': return <Reports />;
      case 'home': return <HomeManagement />;
      case 'ai': return <AIAssistant />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-500" dir="rtl">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-card border-l border-border flex flex-col shadow-2xl transition-all duration-300 z-20">
        <div className="p-8 border-b border-border flex items-center justify-between bg-background/50">
          <div className="text-right">
            <h1 className="text-2xl font-black tracking-tighter text-primary">مؤسسات الربدي</h1>
            <p className="text-[10px] text-secondary mt-1 uppercase font-bold tracking-widest">نظام الإدارة</p>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl bg-border text-foreground hover:bg-secondary/20 transition-all shadow-inner border border-border"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem icon={<LayoutDashboard size={22} />} label="لوحة التحكم" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Users size={22} />} label="شئون العمال" active={activeTab === 'workers'} onClick={() => setActiveTab('workers')} />
          <NavItem icon={<Wallet size={22} />} label="المحاسبة" active={activeTab === 'accounting'} onClick={() => setActiveTab('accounting')} />
          <NavItem icon={<Construction size={22} />} label="المشاريع" active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} />
          <NavItem icon={<Sprout size={22} />} label="المزارع" active={activeTab === 'farms'} onClick={() => setActiveTab('farms')} />
          <NavItem icon={<FileText size={22} />} label="التقارير" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <NavItem icon={<Home size={22} />} label="نظام البيت" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={<Sparkles size={22} />} label="ذكاء الربدي" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
          <NavItem icon={<ShieldCheck size={22} />} label="الإعدادات" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-6 border-t border-border bg-background/30">
          <div className="flex items-center gap-4 mb-6 p-3 rounded-2xl bg-border/50 border border-border">
            <div className="relative">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=10b981&color=fff`} alt={user.displayName} className="w-12 h-12 rounded-xl border-2 border-primary shadow-lg" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-card rounded-full shadow-sm"></div>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-foreground truncate">{user.displayName}</p>
              <p className="text-[10px] text-secondary truncate font-mono">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 text-foreground bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 py-3 rounded-xl transition-all text-sm font-bold"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 md:p-10 bg-background relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
        active 
          ? 'bg-primary text-white shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)] scale-[1.02]' 
          : 'text-secondary hover:bg-border hover:text-foreground'
      }`}
    >
      <span className={`${active ? 'text-white' : 'text-highlight group-hover:text-primary'} transition-colors`}>
        {icon}
      </span>
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );
}
