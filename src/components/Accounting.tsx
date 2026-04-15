import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, storage, ref, uploadBytes, getDownloadURL, handleFirestoreError, OperationType } from '../firebase';
import { 
  Plus, Search, Trash2, Edit2, Wallet, ReceiptText, ArrowUpRight, 
  ArrowDownRight, Download, FileDown, Printer, Building2, Sprout, 
  Image as ImageIcon, FileSpreadsheet, Percent, CheckCircle, XCircle, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { Invoice } from '../types';

type AccountingTab = 'sales' | 'purchases' | 'expenses';

export default function Accounting() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [taxNumbers, setTaxNumbers] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<AccountingTab>('sales');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [filterType, setFilterType] = useState<'all' | 'project' | 'farm'>('all');
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [invoiceForm, setInvoiceForm] = useState<Partial<Invoice>>({
    type: 'sale',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    taxAmount: 0,
    taxNumber: '',
    totalWithTax: 0,
    paymentMethod: 'cash',
    description: '',
    linkedEntityId: '',
    linkedEntityType: 'project',
    customerName: '',
    category: '',
    invoiceImageUrl: '',
    fileUrl: ''
  });

  useEffect(() => {
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      setInvoices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)));
    });
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubFarms = onSnapshot(collection(db, 'farms'), (snap) => {
      setFarms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubTax = onSnapshot(collection(db, 'settings_tax'), (snap) => {
      setTaxNumbers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubInvoices(); unsubProjects(); unsubFarms(); unsubTax(); };
  }, []);

  // Auto-calculate tax and total
  useEffect(() => {
    const amount = Number(invoiceForm.amount) || 0;
    const tax = amount * 0.15; // 15% VAT
    setInvoiceForm(prev => ({ 
      ...prev, 
      taxAmount: tax, 
      totalWithTax: amount + tax 
    }));
  }, [invoiceForm.amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { 
        ...invoiceForm, 
        userId: 'admin',
        type: activeSubTab === 'sales' ? 'sale' : activeSubTab === 'purchases' ? 'purchase' : 'operational_expense'
      };
      if (editingItem) {
        await updateDoc(doc(db, 'invoices', editingItem.id), data);
      } else {
        await addDoc(collection(db, 'invoices'), data);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingItem ? OperationType.UPDATE : OperationType.CREATE, 'invoices');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setInvoiceForm({
      type: 'sale',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      taxAmount: 0,
      taxNumber: '',
      totalWithTax: 0,
      paymentMethod: 'cash',
      description: '',
      linkedEntityId: '',
      linkedEntityType: 'project',
      customerName: '',
      category: '',
      invoiceImageUrl: '',
      fileUrl: ''
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'invoiceImageUrl' | 'fileUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const storageRef = ref(storage, `accounting/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setInvoiceForm(prev => ({ ...prev, [field]: url }));
    } catch (error) {
      console.error("File upload failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredInvoices = invoices.filter(i => {
    const matchesTab = i.type === (activeSubTab === 'sales' ? 'sale' : activeSubTab === 'purchases' ? 'purchase' : 'operational_expense');
    const matchesFilter = filterType === 'all' || (i.linkedEntityType === filterType && i.linkedEntityId === selectedId);
    return matchesTab && matchesFilter;
  });

  const getEntityName = (id: string, type: string) => {
    if (type === 'project') return projects.find(p => p.id === id)?.name || 'غير محدد';
    return farms.find(f => f.id === id)?.name || 'غير محدد';
  };

  return (
    <div className="space-y-8 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h2 className="text-4xl font-black text-foreground tracking-tight">النظام المحاسبي</h2>
          <p className="text-secondary mt-2 font-medium">إدارة المبيعات، المشتريات، والمصروفات التشغيلية بدقة عالية</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-card text-foreground px-5 py-3 rounded-2xl hover:bg-border transition-all font-bold border border-border shadow-xl"><Printer size={20} /> طباعة</button>
          <button onClick={() => exportToPDF('accounting-table', `تقرير_${activeSubTab}`)} className="flex items-center gap-2 bg-red-500/10 text-red-400 px-5 py-3 rounded-2xl hover:bg-red-500/20 transition-all font-bold border border-red-500/30"><FileDown size={20} /> تصدير PDF</button>
          <button onClick={() => exportToExcel(filteredInvoices, activeSubTab)} className="flex items-center gap-2 bg-primary/10 text-primary px-5 py-3 rounded-2xl hover:bg-primary/20 transition-all font-bold border border-primary/30"><Download size={20} /> تصدير Excel</button>
          <button onClick={() => { setEditingItem(null); resetForm(); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={22} /> إضافة عملية</button>
        </div>
      </header>

      {/* Print Header (Only visible when printing) */}
      <div className="hidden print:block text-center mb-10 border-b-2 border-slate-900 pb-6">
        <h1 className="text-4xl font-black mb-2">مؤسسات الربدي للتجارة والمقاولات</h1>
        <p className="text-xl font-bold">تقرير مالي: {activeSubTab === 'sales' ? 'المبيعات' : activeSubTab === 'purchases' ? 'المشتريات' : 'المصروفات'}</p>
        <p className="text-sm mt-2">تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}</p>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-6 border-b border-border no-print">
        <div className="flex gap-2">
          <TabButton active={activeSubTab === 'sales'} onClick={() => setActiveSubTab('sales')} icon={<ArrowUpRight size={20} />} label="المبيعات" />
          <TabButton active={activeSubTab === 'purchases'} onClick={() => setActiveSubTab('purchases')} icon={<ArrowDownRight size={20} />} label="المشتريات" />
          <TabButton active={activeSubTab === 'expenses'} onClick={() => setActiveSubTab('expenses')} icon={<Wallet size={20} />} label="المصروفات" />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3 pb-4">
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value as any); setSelectedId(''); }} className="bg-card border border-border text-foreground rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-highlight font-bold">
            <option value="all">كل المؤسسة</option>
            <option value="project">حسب المشروع</option>
            <option value="farm">حسب المزرعة</option>
          </select>
          {filterType !== 'all' && (
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="bg-card border border-border text-foreground rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-highlight font-bold">
              <option value="">اختر {filterType === 'project' ? 'المشروع' : 'المزرعة'}</option>
              {(filterType === 'project' ? projects : farms).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div id="accounting-table" className="card-lux overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-background/50 text-secondary text-xs uppercase tracking-widest border-b border-border">
                <th className="px-8 py-6 font-black">التاريخ</th>
                <th className="px-8 py-6 font-black">الجهة المرتبطة</th>
                <th className="px-8 py-6 font-black">البيان / العميل</th>
                <th className="px-8 py-6 font-black">الرقم الضريبي</th>
                <th className="px-8 py-6 font-black">المبلغ</th>
                <th className="px-8 py-6 font-black no-print">المرفقات</th>
                <th className="px-8 py-6 font-black no-print">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.map((item) => (
                <tr key={item.id} className="hover:bg-highlight/5 transition-all group">
                  <td className="px-8 py-6 text-foreground font-medium">{item.date}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${item.linkedEntityType === 'project' ? 'bg-highlight/10 text-highlight' : 'bg-primary/10 text-primary'}`}>
                        {item.linkedEntityType === 'project' ? <Building2 size={16} /> : <Sprout size={16} />}
                      </div>
                      <span className="text-foreground font-bold">{getEntityName(item.linkedEntityId, item.linkedEntityType)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-foreground">{item.customerName || item.category || 'بدون اسم'}</p>
                    <p className="text-xs text-secondary mt-1 line-clamp-1">{item.description}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 rounded-lg bg-border text-secondary font-mono text-xs border border-border">
                      {item.taxNumber || '---'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-primary text-lg">{item.totalWithTax?.toLocaleString()} ريال</p>
                    <p className="text-[10px] text-secondary font-bold">ضريبة: {item.taxAmount?.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6 no-print">
                    <div className="flex gap-3">
                      {item.invoiceImageUrl && <a href={item.invoiceImageUrl} target="_blank" rel="noreferrer" className="p-2 bg-highlight/10 text-highlight rounded-xl hover:bg-highlight/20 transition-all"><ImageIcon size={18} /></a>}
                      {item.fileUrl && <a href={item.fileUrl} target="_blank" rel="noreferrer" className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"><FileSpreadsheet size={18} /></a>}
                    </div>
                  </td>
                  <td className="px-8 py-6 no-print">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingItem(item); setInvoiceForm(item); setIsModalOpen(true); }} className="p-2.5 text-highlight hover:bg-highlight/10 rounded-xl transition-all"><Edit2 size={18} /></button>
                      <button onClick={() => deleteDoc(doc(db, 'invoices', item.id!))} className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-5xl overflow-hidden max-h-[90vh] flex flex-col border border-border">
              <div className="p-8 border-b border-border flex justify-between items-center bg-background/50">
                <div className="flex items-center gap-4">
                  <div className="bg-highlight/10 p-3 rounded-2xl border border-highlight/20">
                    <ReceiptText className="text-highlight" size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground">
                      {editingItem ? 'تعديل الفاتورة' : 'إضافة عملية مالية جديدة'}
                    </h3>
                    <p className="text-xs text-secondary font-medium uppercase tracking-widest mt-1">نظام المحاسبة الذكي</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-border text-secondary hover:text-foreground transition-all text-2xl font-light">×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <FormField label="تاريخ العملية" required>
                    <input type="date" required value={invoiceForm.date} onChange={(e) => setInvoiceForm({...invoiceForm, date: e.target.value})} className="form-input-lux" />
                  </FormField>
                  <FormField label="تصنيف الجهة">
                    <select value={invoiceForm.linkedEntityType} onChange={(e) => setInvoiceForm({...invoiceForm, linkedEntityType: e.target.value as any, linkedEntityId: ''})} className="form-input-lux">
                      <option value="project">مشروع إنشائي</option>
                      <option value="farm">مزرعة زراعية</option>
                    </select>
                  </FormField>
                  <FormField label="الجهة المحددة" required>
                    <select required value={invoiceForm.linkedEntityId} onChange={(e) => setInvoiceForm({...invoiceForm, linkedEntityId: e.target.value})} className="form-input-lux">
                      <option value="">اختر من القائمة</option>
                      {invoiceForm.linkedEntityType === 'project' 
                        ? projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                        : farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)
                      }
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField label={activeSubTab === 'sales' ? 'اسم العميل / الجهة' : activeSubTab === 'purchases' ? 'اسم المورد / الشركة' : 'فئة المصروف التشغيلي'}>
                    <input type="text" value={invoiceForm.customerName || invoiceForm.category} onChange={(e) => setInvoiceForm({...invoiceForm, customerName: e.target.value, category: e.target.value})} className="form-input-lux" placeholder="أدخل الاسم هنا..." />
                  </FormField>
                  <FormField label="الرقم الضريبي المعتمد">
                    <select value={invoiceForm.taxNumber} onChange={(e) => setInvoiceForm({...invoiceForm, taxNumber: e.target.value})} className="form-input-lux font-mono">
                      <option value="">اختر الرقم الضريبي</option>
                      {taxNumbers.map(tax => <option key={tax.id} value={tax.number}>{tax.label} - {tax.number}</option>)}
                      <option value="custom">رقم مخصص...</option>
                    </select>
                    {invoiceForm.taxNumber === 'custom' && (
                      <input type="text" onChange={(e) => setInvoiceForm({...invoiceForm, taxNumber: e.target.value})} className="form-input-lux mt-2 font-mono" placeholder="أدخل الرقم يدوياً" />
                    )}
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <FormField label="المبلغ (قبل الضريبة)" required>
                    <div className="relative">
                      <input type="number" required value={invoiceForm.amount} onChange={(e) => setInvoiceForm({...invoiceForm, amount: Number(e.target.value)})} className="form-input-lux pl-12" />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold text-xs">ريال</span>
                    </div>
                  </FormField>
                  <FormField label="ضريبة القيمة المضافة (15%)">
                    <input disabled type="number" value={invoiceForm.taxAmount} className="form-input-lux bg-background/50 text-secondary border-dashed" />
                  </FormField>
                  <FormField label="الإجمالي النهائي">
                    <input disabled type="number" value={invoiceForm.totalWithTax} className="form-input-lux bg-primary/10 text-primary font-black border-primary/30" />
                  </FormField>
                  <FormField label="طريقة السداد">
                    <select value={invoiceForm.paymentMethod} onChange={(e) => setInvoiceForm({...invoiceForm, paymentMethod: e.target.value as any})} className="form-input-lux">
                      <option value="cash">نقدي (كاش)</option>
                      <option value="bank">تحويل بنكي</option>
                      <option value="check">شيك مصدّق</option>
                      <option value="credit">آجل (مدين)</option>
                    </select>
                  </FormField>
                </div>

                <FormField label="تفاصيل إضافية / ملاحظات">
                  <textarea value={invoiceForm.description} onChange={(e) => setInvoiceForm({...invoiceForm, description: e.target.value})} className="form-input-lux h-32 resize-none" placeholder="اكتب أي ملاحظات إضافية هنا..." />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-black text-highlight flex items-center gap-3 uppercase tracking-widest text-xs"><ImageIcon size={18} /> صورة الفاتورة / الإيصال</h4>
                    <div className="relative group overflow-hidden bg-background p-6 rounded-[2rem] border-2 border-dashed border-border hover:border-highlight transition-all flex flex-col items-center justify-center gap-4">
                      {invoiceForm.invoiceImageUrl ? (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border">
                          <img src={invoiceForm.invoiceImageUrl} alt="Invoice" className="w-full h-full object-cover" />
                          <button onClick={() => setInvoiceForm({...invoiceForm, invoiceImageUrl: ''})} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg">×</button>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-2xl bg-highlight/10 flex items-center justify-center text-highlight">
                            <Plus size={32} />
                          </div>
                          <p className="text-xs text-secondary font-bold">اسحب الصورة هنا أو اضغط للاختيار</p>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'invoiceImageUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-black text-primary flex items-center gap-3 uppercase tracking-widest text-xs"><FileSpreadsheet size={18} /> ملفات إضافية (Excel / Numbers)</h4>
                    <div className="relative group overflow-hidden bg-background p-6 rounded-[2rem] border-2 border-dashed border-border hover:border-primary transition-all flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <FileSpreadsheet size={32} />
                      </div>
                      <p className="text-xs text-secondary font-bold">
                        {invoiceForm.fileUrl ? 'تم رفع الملف بنجاح ✅' : 'اختر ملف Excel أو Numbers'}
                      </p>
                      <input type="file" accept=".xlsx,.xls,.csv,.numbers" onChange={(e) => handleFileUpload(e, 'fileUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-6 pt-10 border-t border-border">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 rounded-2xl border border-border text-secondary font-black hover:bg-border hover:text-foreground transition-all">إلغاء</button>
                  <button type="submit" disabled={loading} className="btn-primary px-16">
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
    <button onClick={onClick} className={`flex items-center gap-3 px-8 py-5 font-black transition-all whitespace-nowrap relative group ${active ? 'text-primary' : 'text-secondary hover:text-foreground'}`}>
      {icon}
      <span className="text-sm tracking-tight">{label}</span>
      {active && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_-5px_15px_rgba(16,185,129,0.5)]" />}
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
