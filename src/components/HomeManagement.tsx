import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, storage, ref, uploadBytes, getDownloadURL, handleFirestoreError, OperationType } from '../firebase';
import { 
  Home, Users, Wallet, Calendar, FileText, Plus, Trash2, Edit2, 
  Heart, ShoppingCart, Bell, CheckCircle, Clock, Upload, Download,
  UserCheck, ListTodo, Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type HomeTab = 'family' | 'workers' | 'expenses' | 'shopping' | 'maintenance' | 'events' | 'files';

export default function HomeManagement() {
  const [activeTab, setActiveTab] = useState<HomeTab>('family');
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [homeExpenses, setHomeExpenses] = useState<any[]>([]);
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubFamily = onSnapshot(collection(db, 'family'), (snap) => {
      setFamilyMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubWorkers = onSnapshot(collection(db, 'home_workers'), (snap) => {
      setWorkers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubExpenses = onSnapshot(collection(db, 'home_expenses'), (snap) => {
      setHomeExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubShopping = onSnapshot(collection(db, 'shopping_list'), (snap) => {
      setShoppingList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubMaintenance = onSnapshot(collection(db, 'maintenance_tasks'), (snap) => {
      setMaintenanceTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      setEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubFiles = onSnapshot(collection(db, 'home_files'), (snap) => {
      setFiles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { 
      unsubFamily(); unsubWorkers(); unsubExpenses(); unsubShopping(); 
      unsubMaintenance(); unsubEvents(); unsubFiles(); 
    };
  }, []);

  const totalHomeExpenses = homeExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const toggleShoppingItem = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'shopping_list', id), { completed: !currentStatus });
    } catch (error) {
      console.error("Failed to toggle shopping item", error);
    }
  };

  return (
    <div className="space-y-10 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-foreground tracking-tight">نظام إدارة المنزل</h2>
          <p className="text-secondary mt-2 font-medium">تنظيم شئون العائلة، العمال، الميزانية، والمهام المنزلية</p>
        </div>
        <div className="bg-gradient-to-br from-highlight to-[#2563eb] text-white px-8 py-5 rounded-[2rem] shadow-[0_15px_30px_-10px_rgba(59,130,246,0.5)] flex items-center gap-5 border border-white/10">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <Wallet size={32} />
          </div>
          <div>
            <p className="text-[10px] opacity-80 uppercase font-black tracking-[0.2em]">إجمالي مصاريف الشهر</p>
            <p className="text-3xl font-black">{totalHomeExpenses.toLocaleString()} <span className="text-sm font-medium opacity-80">ريال</span></p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-1 custom-scrollbar">
        <TabButton active={activeTab === 'family'} onClick={() => setActiveTab('family')} icon={<Heart size={20} />} label="أفراد العائلة" />
        <TabButton active={activeTab === 'workers'} onClick={() => setActiveTab('workers')} icon={<UserCheck size={20} />} label="العمال" />
        <TabButton active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} icon={<ShoppingCart size={20} />} label="المصاريف" />
        <TabButton active={activeTab === 'shopping'} onClick={() => setActiveTab('shopping')} icon={<ListTodo size={20} />} label="قائمة التسوق" />
        <TabButton active={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')} icon={<Wrench size={20} />} label="الصيانة" />
        <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')} icon={<Bell size={20} />} label="المناسبات" />
        <TabButton active={activeTab === 'files'} onClick={() => setActiveTab('files')} icon={<FileText size={20} />} label="ملفات البيت" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {activeTab === 'family' && familyMembers.map(member => (
          <motion.div 
            key={member.id} 
            layout 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-lux p-8 flex items-center gap-6 group"
          >
            <div className="w-20 h-20 rounded-[2rem] bg-highlight/10 flex items-center justify-center text-highlight border border-highlight/20 shadow-xl group-hover:scale-110 transition-transform">
              <Users size={40} />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-black text-foreground tracking-tight">{member.name}</h4>
              <p className="text-sm font-bold text-secondary mt-1">{member.relation}</p>
            </div>
            <button onClick={() => deleteDoc(doc(db, 'family', member.id))} className="w-12 h-12 flex items-center justify-center text-red-400 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20"><Trash2 size={20} /></button>
          </motion.div>
        ))}

        {activeTab === 'workers' && workers.map(worker => (
          <motion.div 
            key={worker.id} 
            layout 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-lux p-8 flex items-center gap-6 group"
          >
            <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl group-hover:scale-110 transition-transform">
              <UserCheck size={40} />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-black text-foreground tracking-tight">{worker.name}</h4>
              <p className="text-sm font-bold text-secondary mt-1">{worker.jobTitle}</p>
              <p className="text-[10px] font-bold text-primary mt-1">الراتب: {worker.salary} ريال</p>
            </div>
            <button onClick={() => deleteDoc(doc(db, 'home_workers', worker.id))} className="w-12 h-12 flex items-center justify-center text-red-400 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20"><Trash2 size={20} /></button>
          </motion.div>
        ))}

        {activeTab === 'expenses' && homeExpenses.map(expense => (
          <motion.div 
            key={expense.id} 
            layout 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-lux p-8 group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20 text-orange-400 shadow-xl group-hover:scale-110 transition-transform">
                <ShoppingCart size={28} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-foreground">{expense.amount} <span className="text-sm font-medium text-secondary">ريال</span></p>
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1">المبلغ المصروف</p>
              </div>
            </div>
            <h4 className="text-lg font-black text-foreground mb-2 tracking-tight">{expense.title}</h4>
            <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-background w-fit px-3 py-1.5 rounded-lg border border-border">
              <Calendar size={14} className="text-highlight" />
              {expense.date}
            </div>
          </motion.div>
        ))}

        {activeTab === 'shopping' && (
          <div className="col-span-full space-y-4">
            {shoppingList.map(item => (
              <motion.div 
                key={item.id}
                layout
                className={`card-lux p-6 flex items-center justify-between group ${item.completed ? 'opacity-50 grayscale' : ''}`}
              >
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => toggleShoppingItem(item.id, item.completed)}
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-primary border-primary text-white' : 'border-border text-transparent hover:border-primary'}`}
                  >
                    <CheckCircle size={20} />
                  </button>
                  <div>
                    <h4 className={`text-lg font-black text-foreground ${item.completed ? 'line-through' : ''}`}>{item.item}</h4>
                    <p className="text-xs font-bold text-secondary">الكمية: {item.quantity || 'غير محدد'}</p>
                  </div>
                </div>
                <button onClick={() => deleteDoc(doc(db, 'shopping_list', item.id))} className="text-red-400 hover:text-red-500 p-2"><Trash2 size={20} /></button>
              </motion.div>
            ))}
            {shoppingList.length === 0 && <p className="text-center text-secondary py-10 font-bold">قائمة التسوق فارغة</p>}
          </div>
        )}

        {activeTab === 'maintenance' && maintenanceTasks.map(task => (
          <motion.div 
            key={task.id} 
            layout 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-lux p-8 group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="bg-highlight/10 p-4 rounded-2xl border border-highlight/20 text-highlight shadow-xl group-hover:scale-110 transition-transform">
                <Wrench size={28} />
              </div>
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${task.status === 'completed' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                {task.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}
              </span>
            </div>
            <h4 className="text-lg font-black text-foreground mb-2 tracking-tight">{task.title}</h4>
            <p className="text-sm text-secondary font-medium mb-4">{task.description}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-background w-fit px-3 py-1.5 rounded-lg border border-border">
              <Calendar size={14} className="text-highlight" />
              {task.dueDate}
            </div>
          </motion.div>
        ))}

        {activeTab === 'events' && events.map(event => (
          <motion.div 
            key={event.id} 
            layout 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-lux p-8 border-r-8 border-r-highlight group"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-xl font-black text-foreground tracking-tight">{event.title}</h4>
              <div className="bg-highlight/10 p-2 rounded-xl text-highlight">
                <Bell size={20} />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-background px-3 py-2 rounded-xl border border-border">
                <Calendar size={14} className="text-highlight" />
                {event.date}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-background px-3 py-2 rounded-xl border border-border">
                <Clock size={14} className="text-primary" />
                {event.time}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-10 left-10 bg-primary text-white w-20 h-20 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)] hover:scale-110 hover:rotate-90 transition-all z-30 flex items-center justify-center border-4 border-background"
      >
        <Plus size={40} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden border border-border">
              <div className="p-8 border-b border-border flex justify-between items-center bg-background/50">
                <div className="flex items-center gap-4">
                  <div className="bg-highlight/10 p-3 rounded-2xl border border-highlight/20">
                    <Home className="text-highlight" size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground">إضافة {
                      activeTab === 'family' ? 'فرد عائلة' : 
                      activeTab === 'workers' ? 'عامل' :
                      activeTab === 'expenses' ? 'مصروف' : 
                      activeTab === 'shopping' ? 'غرض للتسوق' :
                      activeTab === 'maintenance' ? 'مهمة صيانة' :
                      'مناسبة'
                    }</h3>
                    <p className="text-xs text-secondary font-medium uppercase tracking-widest mt-1">إدارة شئون المنزل</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-border text-secondary hover:text-foreground transition-all text-2xl font-light">×</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                setLoading(true);
                try {
                  const collectionMap: Record<HomeTab, string> = {
                    family: 'family',
                    workers: 'home_workers',
                    expenses: 'home_expenses',
                    shopping: 'shopping_list',
                    maintenance: 'maintenance_tasks',
                    events: 'events',
                    files: 'home_files'
                  };
                  await addDoc(collection(db, collectionMap[activeTab]), { ...data, userId: 'admin' });
                  setIsModalOpen(false);
                } catch (error) {
                  console.error("Home add failed", error);
                } finally {
                  setLoading(false);
                }
              }} className="p-10 space-y-6">
                {activeTab === 'family' && (
                  <>
                    <FormField label="الاسم الكامل" required><input name="name" placeholder="أدخل الاسم..." required className="form-input-lux" /></FormField>
                    <FormField label="صلة القرابة" required><input name="relation" placeholder="مثلاً: ابن، زوجة..." required className="form-input-lux" /></FormField>
                  </>
                )}
                {activeTab === 'workers' && (
                  <>
                    <FormField label="اسم العامل" required><input name="name" placeholder="أدخل اسم العامل..." required className="form-input-lux" /></FormField>
                    <FormField label="المسمى الوظيفي" required><input name="jobTitle" placeholder="مثلاً: سائق، عاملة منزلية..." required className="form-input-lux" /></FormField>
                    <FormField label="الراتب الشهري" required><input name="salary" type="number" placeholder="0.00" required className="form-input-lux" /></FormField>
                  </>
                )}
                {activeTab === 'expenses' && (
                  <>
                    <FormField label="بيان المصروف" required><input name="title" placeholder="مثلاً: فاتورة الكهرباء..." required className="form-input-lux" /></FormField>
                    <div className="grid grid-cols-2 gap-6">
                      <FormField label="المبلغ" required><input name="amount" type="number" placeholder="0.00" required className="form-input-lux" /></FormField>
                      <FormField label="التاريخ" required><input name="date" type="date" required className="form-input-lux" /></FormField>
                    </div>
                  </>
                )}
                {activeTab === 'shopping' && (
                  <>
                    <FormField label="الغرض" required><input name="item" placeholder="مثلاً: حليب، خبز..." required className="form-input-lux" /></FormField>
                    <FormField label="الكمية"><input name="quantity" placeholder="مثلاً: 2 كرتون" className="form-input-lux" /></FormField>
                  </>
                )}
                {activeTab === 'maintenance' && (
                  <>
                    <FormField label="عنوان المهمة" required><input name="title" placeholder="مثلاً: إصلاح التكييف..." required className="form-input-lux" /></FormField>
                    <FormField label="الوصف"><textarea name="description" placeholder="تفاصيل المهمة..." className="form-input-lux h-24" /></FormField>
                    <FormField label="تاريخ الاستحقاق" required><input name="dueDate" type="date" required className="form-input-lux" /></FormField>
                  </>
                )}
                {activeTab === 'events' && (
                  <>
                    <FormField label="عنوان المناسبة" required><input name="title" placeholder="أدخل عنوان المناسبة..." required className="form-input-lux" /></FormField>
                    <div className="grid grid-cols-2 gap-6">
                      <FormField label="التاريخ" required><input name="date" type="date" required className="form-input-lux" /></FormField>
                      <FormField label="الوقت" required><input name="time" type="time" required className="form-input-lux" /></FormField>
                    </div>
                  </>
                )}
                <div className="flex gap-6 pt-8 border-t border-border">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl border border-border text-secondary font-black hover:bg-border hover:text-foreground transition-all">إلغاء</button>
                  <button type="submit" disabled={loading} className="flex-1 py-4 rounded-2xl bg-highlight text-white font-black shadow-[0_15px_30px_-10px_rgba(59,130,246,0.5)] hover:bg-highlight/80 transition-all disabled:opacity-50">
                    {loading ? 'جاري الحفظ...' : 'حفظ البيانات'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-3 px-8 py-5 font-black transition-all whitespace-nowrap relative group ${
        active ? 'text-highlight' : 'text-secondary hover:text-foreground'
      }`}
    >
      {icon}
      <span className="text-sm tracking-tight">{label}</span>
      {active && <motion.div layoutId="activeHomeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-highlight rounded-full shadow-[0_-5px_15px_rgba(59,130,246,0.5)]" />}
    </button>
  );
}

function FormField({ label, children, required }: { label: string, children: React.ReactNode, required?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-secondary uppercase tracking-widest mr-1 flex items-center gap-2">
        {label}
        {required && <span className="text-red-500 text-lg">*</span>}
      </label>
      {children}
    </div>
  );
}
