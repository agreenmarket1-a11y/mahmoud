import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, storage, ref, uploadBytes, getDownloadURL, handleFirestoreError, OperationType } from '../firebase';
import { 
  Plus, Search, Trash2, Edit2, UserPlus, DollarSign, Calendar, Shield, 
  Download, Wallet, FileDown, Building2, Sprout, CheckCircle, XCircle, 
  Clock, FileText, AlertTriangle, UserCheck, UserMinus, Briefcase, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { Employee, Attendance, Leave, Loan, Penalty } from '../types';

type HRTab = 'employees' | 'attendance' | 'leaves' | 'loans' | 'penalties';

export default function HRManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<HRTab>('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form States
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({
    name: '',
    idNumber: '',
    nationality: '',
    jobTitle: '',
    baseSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    totalSalary: 0,
    status: 'active',
    linkedEntityId: '',
    linkedEntityType: 'project',
    iqamaExpiry: '',
    lateSalaryCount: 0,
    unpaidSalaryTotal: 0
  });

  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snap) => {
      setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    });
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubFarms = onSnapshot(collection(db, 'farms'), (snap) => {
      setFarms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubEmployees(); unsubProjects(); unsubFarms(); };
  }, []);

  // Auto-calculate total salary
  useEffect(() => {
    const total = (Number(employeeForm.baseSalary) || 0) + 
                  (Number(employeeForm.housingAllowance) || 0) + 
                  (Number(employeeForm.transportAllowance) || 0);
    setEmployeeForm(prev => ({ ...prev, totalSalary: total }));
  }, [employeeForm.baseSalary, employeeForm.housingAllowance, employeeForm.transportAllowance]);

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...employeeForm, userId: 'admin' }; // Simplified userId
      if (editingItem) {
        await updateDoc(doc(db, 'employees', editingItem.id), data);
      } else {
        await addDoc(collection(db, 'employees'), data);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      resetEmployeeForm();
    } catch (error) {
      handleFirestoreError(error, editingItem ? OperationType.UPDATE : OperationType.CREATE, 'employees');
    } finally {
      setLoading(false);
    }
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: '',
      idNumber: '',
      nationality: '',
      jobTitle: '',
      baseSalary: 0,
      housingAllowance: 0,
      transportAllowance: 0,
      totalSalary: 0,
      status: 'active',
      linkedEntityId: '',
      linkedEntityType: 'project',
      iqamaExpiry: '',
      lateSalaryCount: 0,
      unpaidSalaryTotal: 0
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const storageRef = ref(storage, `employees/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setEmployeeForm(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      console.error("Image upload failed", error);
    } finally {
      setLoading(false);
    }
  };

  const getEntityName = (id: string, type: string) => {
    if (type === 'project') return projects.find(p => p.id === id)?.name || 'غير محدد';
    return farms.find(f => f.id === id)?.name || 'غير محدد';
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.idNumber.includes(searchTerm) ||
    e.nationality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h2 className="text-4xl font-black text-foreground tracking-tight">إدارة الموارد البشرية</h2>
          <p className="text-secondary mt-2 font-medium">إدارة الموظفين، الرواتب، الحضور، والإجازات بدقة متناهية</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => exportToPDF('hr-table', 'تقرير_الموظفين')} className="flex items-center gap-2 bg-red-500/10 text-red-400 px-5 py-3 rounded-2xl hover:bg-red-500/20 transition-all font-bold border border-red-500/30 shadow-xl"><FileDown size={20} /> تصدير PDF</button>
          <button onClick={() => exportToExcel(employees, 'الموظفين')} className="flex items-center gap-2 bg-primary/10 text-primary px-5 py-3 rounded-2xl hover:bg-primary/20 transition-all font-bold border border-primary/30 shadow-xl"><Download size={20} /> تصدير Excel</button>
          <button onClick={() => { setEditingItem(null); resetEmployeeForm(); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2 px-6 py-3"><UserPlus size={22} /> إضافة موظف</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border no-print overflow-x-auto pb-1 custom-scrollbar">
        <TabButton active={activeTab === 'employees'} onClick={() => setActiveTab('employees')} icon={<Users size={20} />} label="الموظفين" />
        <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<Calendar size={20} />} label="الحضور" />
        <TabButton active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')} icon={<FileText size={20} />} label="الإجازات" />
        <TabButton active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} icon={<Wallet size={20} />} label="السلف" />
        <TabButton active={activeTab === 'penalties'} onClick={() => setActiveTab('penalties')} icon={<AlertTriangle size={20} />} label="الجزاءات" />
      </div>

      {/* Search Bar */}
      <div className="card-lux p-6 no-print">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-highlight" size={20} />
          <input 
            type="text" 
            placeholder="بحث بالاسم أو رقم الهوية أو الجنسية..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pr-12 pl-4 py-4 rounded-2xl bg-background border border-border text-foreground focus:ring-2 focus:ring-highlight outline-none transition-all font-bold" 
          />
        </div>
      </div>

      {/* Content Area */}
      <div id="hr-table" className="bg-card rounded-[2.5rem] shadow-2xl border border-border overflow-hidden transition-all duration-500 hover:border-highlight/30">
        {activeTab === 'employees' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-background/50 text-secondary text-xs uppercase tracking-widest border-b border-border">
                  <th className="px-8 py-6 font-black">الموظف</th>
                  <th className="px-8 py-6 font-black">الهوية/الجنسية</th>
                  <th className="px-8 py-6 font-black">الجهة/الوظيفة</th>
                  <th className="px-8 py-6 font-black">الراتب الإجمالي</th>
                  <th className="px-8 py-6 font-black">الحالة</th>
                  <th className="px-8 py-6 font-black">المتأخرات</th>
                  <th className="px-8 py-6 font-black no-print">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-highlight/5 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-background overflow-hidden flex items-center justify-center border border-border shadow-xl group-hover:scale-110 transition-transform">
                          {emp.imageUrl ? (
                            <img src={emp.imageUrl} alt={emp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Users size={24} className="text-highlight/40" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-foreground text-lg">{emp.name}</p>
                          <p className="text-xs text-secondary font-bold mt-1">إقامة: {emp.iqamaExpiry}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-foreground tracking-wider">{emp.idNumber}</p>
                      <p className="text-xs text-secondary font-bold mt-1">{emp.nationality}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm font-black text-foreground">
                        <div className={`p-1.5 rounded-lg ${emp.linkedEntityType === 'project' ? 'bg-highlight/10 text-highlight' : 'bg-primary/10 text-primary'}`}>
                          {emp.linkedEntityType === 'project' ? <Building2 size={14} /> : <Sprout size={14} />}
                        </div>
                        {getEntityName(emp.linkedEntityId, emp.linkedEntityType)}
                      </div>
                      <p className="text-xs text-secondary font-bold mt-1">{emp.jobTitle}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-primary text-lg">{emp.totalSalary?.toLocaleString()} ريال</p>
                      <p className="text-[10px] text-secondary font-bold">أساسي: {emp.baseSalary}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        emp.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' : 
                        emp.status === 'on_leave' ? 'bg-highlight/10 text-highlight border-highlight/20' : 
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {emp.status === 'active' ? 'نشط' : emp.status === 'on_leave' ? 'في إجازة' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-red-400 font-black text-lg">{emp.unpaidSalaryTotal?.toLocaleString()} ريال</p>
                      <p className="text-[10px] text-secondary font-bold">{emp.lateSalaryCount} شهر متأخر</p>
                    </td>
                    <td className="px-8 py-6 no-print">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingItem(emp); setEmployeeForm(emp); setIsModalOpen(true); }} className="p-2.5 text-highlight hover:bg-highlight/10 rounded-xl transition-all"><Edit2 size={18} /></button>
                        <button onClick={() => deleteDoc(doc(db, 'employees', emp.id!))} className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab !== 'employees' && (
          <div className="p-32 text-center">
            <div className="w-24 h-24 bg-background rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-border shadow-2xl">
              <Clock size={48} className="text-highlight opacity-20" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">قسم {activeTab}</h3>
            <p className="text-secondary font-medium">هذا القسم قيد التجهيز حالياً</p>
          </div>
        )}
      </div>

      {/* Employee Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-5xl overflow-hidden max-h-[90vh] flex flex-col border border-border">
              <div className="p-8 border-b border-border flex justify-between items-center bg-background/50">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
                    <UserPlus className="text-primary" size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground">
                      {editingItem ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد للنظام'}
                    </h3>
                    <p className="text-xs text-secondary font-medium uppercase tracking-widest mt-1">إدارة الكوادر البشرية</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-border text-secondary hover:text-foreground transition-all text-2xl font-light">×</button>
              </div>
              
              <form onSubmit={handleEmployeeSubmit} className="p-10 overflow-y-auto space-y-12 custom-scrollbar">
                {/* Basic Info Section */}
                <section className="space-y-8">
                  <h4 className="font-black text-highlight flex items-center gap-3 uppercase tracking-widest text-xs">
                    <Briefcase size={18} /> المعلومات الأساسية والتعريفية
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FormField label="الاسم الكامل" required>
                      <input required type="text" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} className="form-input-lux" placeholder="أدخل الاسم الرباعي..." />
                    </FormField>
                    <FormField label="رقم الهوية / الإقامة" required>
                      <input required type="text" value={employeeForm.idNumber} onChange={(e) => setEmployeeForm({ ...employeeForm, idNumber: e.target.value })} className="form-input-lux font-mono" placeholder="10XXXXXXXX" />
                    </FormField>
                    <FormField label="الجنسية" required>
                      <input required type="text" value={employeeForm.nationality} onChange={(e) => setEmployeeForm({ ...employeeForm, nationality: e.target.value })} className="form-input-lux" placeholder="مثلاً: هندي، باكستاني..." />
                    </FormField>
                    <FormField label="المسمى الوظيفي">
                      <input type="text" value={employeeForm.jobTitle} onChange={(e) => setEmployeeForm({ ...employeeForm, jobTitle: e.target.value })} className="form-input-lux" placeholder="مثلاً: مهندس مدني، عامل..." />
                    </FormField>
                    <FormField label="تاريخ انتهاء الإقامة">
                      <input type="date" value={employeeForm.iqamaExpiry} onChange={(e) => setEmployeeForm({ ...employeeForm, iqamaExpiry: e.target.value })} className="form-input-lux" />
                    </FormField>
                    <FormField label="حالة العمل الحالية">
                      <select value={employeeForm.status} onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value as any })} className="form-input-lux font-bold">
                        <option value="active">نشط (على رأس العمل)</option>
                        <option value="on_leave">في إجازة رسمية</option>
                        <option value="inactive">غير نشط (خروج نهائي/أخرى)</option>
                      </select>
                    </FormField>
                  </div>
                </section>

                {/* Assignment Section */}
                <section className="space-y-8">
                  <h4 className="font-black text-primary flex items-center gap-3 uppercase tracking-widest text-xs">
                    <Building2 size={18} /> التعيين والربط القطاعي
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField label="نوع القطاع التابع له">
                      <select value={employeeForm.linkedEntityType} onChange={(e) => setEmployeeForm({ ...employeeForm, linkedEntityType: e.target.value as any, linkedEntityId: '' })} className="form-input-lux font-bold">
                        <option value="project">المشاريع الإنشائية والمقاولات</option>
                        <option value="farm">المزارع والقطاع الزراعي</option>
                      </select>
                    </FormField>
                    <FormField label="الجهة المحددة للعمل" required>
                      <select required value={employeeForm.linkedEntityId} onChange={(e) => setEmployeeForm({ ...employeeForm, linkedEntityId: e.target.value })} className="form-input-lux font-bold">
                        <option value="">اختر الجهة من القائمة...</option>
                        {employeeForm.linkedEntityType === 'project' 
                          ? projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                          : farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)
                        }
                      </select>
                    </FormField>
                  </div>
                </section>

                {/* Salary Section */}
                <section className="space-y-8">
                  <h4 className="font-black text-orange-400 flex items-center gap-3 uppercase tracking-widest text-xs">
                    <DollarSign size={18} /> الرواتب والبدلات المالية
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <FormField label="الراتب الأساسي" required>
                      <div className="relative">
                        <input required type="number" value={employeeForm.baseSalary} onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: Number(e.target.value) })} className="form-input-lux pl-12" />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold text-xs">ريال</span>
                      </div>
                    </FormField>
                    <FormField label="بدل سكن">
                      <input type="number" value={employeeForm.housingAllowance} onChange={(e) => setEmployeeForm({ ...employeeForm, housingAllowance: Number(e.target.value) })} className="form-input-lux" />
                    </FormField>
                    <FormField label="بدل نقل">
                      <input type="number" value={employeeForm.transportAllowance} onChange={(e) => setEmployeeForm({ ...employeeForm, transportAllowance: Number(e.target.value) })} className="form-input-lux" />
                    </FormField>
                    <FormField label="إجمالي الراتب الشهري">
                      <input disabled type="number" value={employeeForm.totalSalary} className="form-input-lux bg-primary/10 text-primary font-black border-primary/30" />
                    </FormField>
                  </div>
                </section>

                {/* Arrears Section */}
                <section className="space-y-8">
                  <h4 className="font-black text-red-400 flex items-center gap-3 uppercase tracking-widest text-xs">
                    <AlertTriangle size={18} /> المتأخرات والمستحقات المالية
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField label="عدد الرواتب المتأخرة (أشهر)">
                      <input type="number" value={employeeForm.lateSalaryCount} onChange={(e) => setEmployeeForm({ ...employeeForm, lateSalaryCount: Number(e.target.value) })} className="form-input-lux" />
                    </FormField>
                    <FormField label="إجمالي المستحقات غير المدفوعة">
                      <div className="relative">
                        <input type="number" value={employeeForm.unpaidSalaryTotal} onChange={(e) => setEmployeeForm({ ...employeeForm, unpaidSalaryTotal: Number(e.target.value) })} className="form-input-lux pl-12" />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400 font-bold text-xs">ريال</span>
                      </div>
                    </FormField>
                  </div>
                </section>

                {/* Image Section */}
                <section className="space-y-8">
                  <h4 className="font-black text-purple-400 flex items-center gap-3 uppercase tracking-widest text-xs">
                    <UserCheck size={18} /> صورة الهوية / الموظف الشخصية
                  </h4>
                  <div className="flex flex-col md:flex-row items-center gap-10 bg-background p-10 rounded-[2.5rem] border-2 border-dashed border-border hover:border-highlight transition-all group">
                    <div className="w-32 h-32 rounded-[2rem] bg-card border border-border overflow-hidden flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
                      {employeeForm.imageUrl ? (
                        <img src={employeeForm.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserPlus size={48} className="text-highlight/20" />
                      )}
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-right">
                      <h5 className="text-foreground font-black">رفع صورة الموظف</h5>
                      <p className="text-sm text-secondary font-medium leading-relaxed">يرجى رفع صورة واضحة بدقة عالية لتسهيل التعرف على الموظف في النظام والتقارير المطبوعة.</p>
                      <div className="relative inline-block">
                        <button type="button" className="bg-border text-foreground px-8 py-3 rounded-xl font-bold border border-border hover:bg-secondary/20 transition-all">اختر ملف الصورة</button>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex justify-end gap-6 pt-10 border-t border-border">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 rounded-2xl border border-border text-secondary font-black hover:bg-border hover:text-foreground transition-all">إلغاء</button>
                  <button type="submit" disabled={loading} className="btn-primary px-16 py-4">
                    {loading ? 'جاري الحفظ...' : 'حفظ بيانات الموظف'}
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
        active ? 'text-primary' : 'text-secondary hover:text-foreground'
      }`}
    >
      {icon}
      <span className="text-sm tracking-tight">{label}</span>
      {active && <motion.div layoutId="activeHRTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_-5px_15px_rgba(16,185,129,0.5)]" />}
    </button>
  );
}

function FormField({ label, children, required }: { label: string, children: React.ReactNode, required?: boolean }) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-black text-secondary uppercase tracking-widest mr-1 flex items-center gap-2">
        {label}
        {required && <span className="text-red-500 text-lg">*</span>}
      </label>
      {children}
    </div>
  );
}
