import React, { useState, useEffect } from 'react';
import { auth, updatePassword, EmailAuthProvider, reauthenticateWithCredential, db, collection, onSnapshot, addDoc, deleteDoc, doc } from '../firebase';
import { Shield, Key, CheckCircle, AlertCircle, Percent, Plus, Trash2, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [taxNumbers, setTaxNumbers] = useState<any[]>([]);
  const [newTaxNumber, setNewTaxNumber] = useState({ label: '', number: '' });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'settings_tax'), (snap) => {
      setTaxNumbers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddTaxNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaxNumber.label || !newTaxNumber.number) return;
    try {
      await addDoc(collection(db, 'settings_tax'), newTaxNumber);
      setNewTaxNumber({ label: '', number: '' });
    } catch (error) {
      console.error("Add tax number failed", error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'كلمات المرور الجديدة غير متطابقة' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const user = auth.currentUser;
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        setStatus({ type: 'success', message: 'تم تغيير كلمة المرور بنجاح' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error("Password change failed", error);
      setStatus({ type: 'error', message: 'فشل تغيير كلمة المرور: ' + (error.message || 'خطأ غير معروف') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20" dir="rtl">
      <header className="text-right">
        <h2 className="text-4xl font-black text-foreground tracking-tight">الإعدادات</h2>
        <p className="text-secondary mt-2 font-medium">تخصيص النظام وإدارة الأمان</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Password Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-lux p-8"
        >
          <div className="flex items-center gap-4 mb-8 border-b border-border pb-6">
            <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
              <Shield className="text-primary" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">أمان الحساب</h3>
              <p className="text-xs text-secondary">تحديث كلمة المرور الخاصة بك</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-secondary uppercase tracking-widest mr-1">كلمة المرور الحالية</label>
              <div className="relative">
                <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-highlight" size={18} />
                <input 
                  type="password" 
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pr-12 pl-4 py-4 rounded-2xl bg-background border border-border text-foreground outline-none focus:ring-2 focus:ring-highlight transition-all"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-secondary uppercase tracking-widest mr-1">كلمة المرور الجديدة</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input-lux"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-secondary uppercase tracking-widest mr-1">تأكيد كلمة المرور</label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input-lux"
                />
              </div>
            </div>

            {status && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl flex items-center gap-3 ${status.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
              >
                {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span className="font-bold text-sm">{status.message}</span>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4"
            >
              {loading ? 'جاري التحديث...' : 'تحديث الأمان'}
            </button>
          </form>
        </motion.div>

        {/* Tax Numbers Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-lux p-8"
        >
          <div className="flex items-center gap-4 mb-8 border-b border-border pb-6">
            <div className="bg-highlight/10 p-3 rounded-2xl border border-highlight/20">
              <Percent className="text-highlight" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">الأرقام الضريبية</h3>
              <p className="text-xs text-secondary">إدارة أرقام الضريبة للمؤسسة</p>
            </div>
          </div>

          <form onSubmit={handleAddTaxNumber} className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-3">
              <input 
                placeholder="اسم التعريف (مثلاً: الربدي 1)"
                value={newTaxNumber.label}
                onChange={(e) => setNewTaxNumber({...newTaxNumber, label: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-highlight"
              />
              <input 
                placeholder="الرقم الضريبي"
                value={newTaxNumber.number}
                onChange={(e) => setNewTaxNumber({...newTaxNumber, number: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-mono outline-none focus:ring-2 focus:ring-highlight"
              />
            </div>
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-highlight text-white py-3 rounded-xl font-bold hover:bg-highlight/80 transition-all">
              <Plus size={18} /> إضافة رقم ضريبي
            </button>
          </form>

          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            <AnimatePresence>
              {taxNumbers.map((tax) => (
                <motion.div 
                  key={tax.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border group"
                >
                  <div className="flex items-center gap-3">
                    <Hash size={16} className="text-primary" />
                    <div>
                      <p className="text-sm font-bold text-foreground">{tax.label}</p>
                      <p className="text-xs font-mono text-secondary">{tax.number}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteDoc(doc(db, 'settings_tax', tax.id))} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-highlight/10 p-8 rounded-3xl border border-border flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center border border-border shadow-xl">
          <Shield className="text-primary" size={32} />
        </div>
        <div>
          <h4 className="font-black text-foreground mb-1">مركز التحكم</h4>
          <p className="text-secondary text-sm leading-relaxed">
            أنت الآن في بيئة آمنة ومشفرة بالكامل. جميع العمليات الضريبية والمالية تتم وفقاً لأعلى معايير الأمان.
          </p>
        </div>
      </div>
    </div>
  );
}
