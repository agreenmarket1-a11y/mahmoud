import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, storage, ref, uploadBytes, getDownloadURL, handleFirestoreError, OperationType } from '../firebase';
import { Plus, Search, Trash2, Edit2, Sprout, MapPin, Maximize, FileSpreadsheet, Upload, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { Farm, FileRecord } from '../types';

export default function Farms() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);

  const [formData, setFormData] = useState<Partial<Farm>>({
    name: '',
    location: '',
    size: '',
    status: 'active'
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'farms'), (snap) => {
      setFarms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Farm)));
    });
    const unsubFiles = onSnapshot(collection(db, 'files'), (snap) => {
      setFiles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FileRecord)));
    });
    return () => { unsub(); unsubFiles(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...formData, userId: 'admin' };
      if (editingFarm) {
        await updateDoc(doc(db, 'farms', editingFarm.id), data);
      } else {
        await addDoc(collection(db, 'farms'), data);
      }
      setIsModalOpen(false);
      setEditingFarm(null);
      setFormData({ name: '', location: '', size: '', status: 'active' });
    } catch (error) {
      handleFirestoreError(error, editingFarm ? OperationType.UPDATE : OperationType.CREATE, 'farms');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, farmId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const storageRef = ref(storage, `farms/${farmId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      let data: any[] = [];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          data = XLSX.utils.sheet_to_json(ws);
          
          await addDoc(collection(db, 'files'), {
            userId: 'admin',
            linkedEntityId: farmId,
            linkedEntityType: 'farm',
            fileName: file.name,
            fileUrl: url,
            uploadDate: new Date().toISOString(),
            data: data
          });
        };
        reader.readAsBinaryString(file);
      } else {
        await addDoc(collection(db, 'files'), {
          userId: 'admin',
          linkedEntityId: farmId,
          linkedEntityType: 'farm',
          fileName: file.name,
          fileUrl: url,
          uploadDate: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("File upload failed", error);
    } finally {
      setLoading(false);
    }
  };

  const viewExcelData = (file: FileRecord) => {
    setSelectedFile(file);
    setExcelData(file.data || []);
  };

  const handleExcelEdit = (rowIndex: number, colKey: string, value: any) => {
    const newData = [...excelData];
    newData[rowIndex][colKey] = value;
    setExcelData(newData);
  };

  const saveExcelChanges = async () => {
    if (!selectedFile?.id) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'files', selectedFile.id), { data: excelData });
      alert('تم حفظ التعديلات بنجاح');
    } catch (error) {
      console.error("Failed to save excel changes", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFarms = farms.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-10 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-foreground tracking-tight">إدارة المزارع النموذجية</h2>
          <p className="text-secondary mt-2 font-medium">إدارة ذكية للأراضي الزراعية، المحاصيل، والإنتاجية</p>
        </div>
        <button 
          onClick={() => { setEditingFarm(null); setFormData({ name: '', location: '', size: '', status: 'active' }); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-3"
        >
          <Plus size={24} />
          إضافة مزرعة جديدة
        </button>
      </header>

      <div className="card-lux p-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-highlight" size={20} />
          <input 
            type="text" 
            placeholder="بحث عن مزرعة بالاسم أو الموقع..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pr-12 pl-4 py-4 rounded-2xl bg-background border border-border text-foreground focus:ring-2 focus:ring-highlight outline-none transition-all font-bold" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredFarms.map((farm) => (
          <motion.div 
            key={farm.id} 
            layout 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-lux overflow-hidden flex flex-col group"
          >
            <div className="p-8 space-y-6 flex-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 shadow-xl group-hover:scale-110 transition-transform">
                  <Sprout className="text-primary" size={28} />
                </div>
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${farm.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {farm.status === 'active' ? 'نشطة' : 'غير نشطة'}
                </span>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{farm.name}</h3>
                <div className="flex flex-col gap-3 mt-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-secondary bg-background px-4 py-2 rounded-xl border border-border"><MapPin size={16} className="text-highlight" /> {farm.location}</div>
                  <div className="flex items-center gap-3 text-sm font-bold text-secondary bg-background px-4 py-2 rounded-xl border border-border"><Maximize size={16} className="text-primary" /> {farm.size}</div>
                </div>
              </div>

              {/* Files Section */}
              <div className="pt-6 border-t border-border relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">سجلات المزرعة والإنتاج</h4>
                  <label className="cursor-pointer bg-primary/10 p-2 rounded-xl text-primary hover:bg-primary/20 transition-all border border-primary/20 shadow-lg">
                    <Upload size={16} />
                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, farm.id!)} />
                  </label>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {files.filter(f => f.linkedEntityId === farm.id).map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 rounded-2xl bg-background/50 border border-border hover:border-highlight/30 transition-all group/file">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                          <FileSpreadsheet size={14} className="text-primary" />
                        </div>
                        <span className="text-xs font-bold text-foreground truncate">{file.fileName}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover/file:opacity-100 transition-all">
                        {file.data && <button onClick={() => viewExcelData(file)} className="p-1.5 text-highlight hover:bg-highlight/10 rounded-lg"><Edit2 size={12} /></button>}
                        <button onClick={() => deleteDoc(doc(db, 'files', file.id!))} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                  {files.filter(f => f.linkedEntityId === farm.id).length === 0 && (
                    <p className="text-[10px] text-secondary text-center italic py-2">لا توجد سجلات مرفوعة حالياً</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-background/50 border-t border-border flex justify-between gap-4">
              <button onClick={() => { setEditingFarm(farm); setFormData(farm); setIsModalOpen(true); }} className="flex-1 flex items-center justify-center gap-2 py-3 bg-highlight/10 text-highlight hover:bg-highlight/20 rounded-2xl transition-all font-black text-xs border border-highlight/20"><Edit2 size={16} /> تعديل البيانات</button>
              <button onClick={() => deleteDoc(doc(db, 'farms', farm.id!))} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-2xl transition-all font-black text-xs border border-red-500/20"><Trash2 size={16} /> حذف</button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Excel Viewer Modal */}
      <AnimatePresence>
        {selectedFile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/90 backdrop-blur-2xl">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-card rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden border border-border">
              <div className="p-8 border-b border-border flex justify-between items-center bg-background/50">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
                    <FileSpreadsheet className="text-primary" size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground">{selectedFile.fileName}</h3>
                    <p className="text-xs text-secondary font-medium uppercase tracking-widest mt-1">محرر السجلات الزراعية</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={saveExcelChanges} className="btn-primary flex items-center gap-2 px-6 py-3"><Save size={20} /> حفظ التعديلات</button>
                  <button onClick={() => setSelectedFile(null)} className="w-12 h-12 flex items-center justify-center rounded-full bg-border text-secondary hover:text-foreground transition-all text-2xl font-light">×</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-10 custom-scrollbar">
                {excelData.length > 0 ? (
                  <div className="rounded-3xl border border-border overflow-hidden shadow-2xl">
                    <table className="w-full border-collapse text-right text-sm">
                      <thead>
                        <tr className="bg-background text-secondary text-xs uppercase tracking-widest">
                          {Object.keys(excelData[0]).map(key => (
                            <th key={key} className="border border-border p-5 font-black">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {excelData.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-highlight/5 bg-card transition-all">
                            {Object.entries(row).map(([key, value]) => (
                              <td key={key} className="border border-border p-0">
                                <input 
                                  type="text" 
                                  value={value as string} 
                                  onChange={(e) => handleExcelEdit(rowIndex, key, e.target.value)}
                                  className="w-full p-5 bg-transparent outline-none focus:bg-highlight/10 text-foreground font-bold transition-all"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-32">
                    <div className="w-20 h-20 bg-background rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border">
                      <FileSpreadsheet size={40} className="text-highlight opacity-20" />
                    </div>
                    <p className="text-secondary font-black text-xl">لا توجد سجلات متاحة للعرض</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Farm Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden border border-border">
              <div className="p-8 border-b border-border flex justify-between items-center bg-background/50">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
                    <Sprout className="text-primary" size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground">{editingFarm ? 'تعديل بيانات المزرعة' : 'إضافة مزرعة نموذجية'}</h3>
                    <p className="text-xs text-secondary font-medium uppercase tracking-widest mt-1">تخطيط الأراضي الزراعية</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-border text-secondary hover:text-foreground transition-all text-2xl font-light">×</button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-secondary uppercase tracking-widest mr-1">اسم المزرعة</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input-lux" placeholder="أدخل اسم المزرعة..." />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-secondary uppercase tracking-widest mr-1">الموقع الجغرافي</label>
                  <input required type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="form-input-lux" placeholder="أدخل موقع المزرعة..." />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-secondary uppercase tracking-widest mr-1">المساحة الإجمالية</label>
                    <input type="text" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} className="form-input-lux" placeholder="مثلاً: 50 هكتار" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-secondary uppercase tracking-widest mr-1">حالة المزرعة</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="form-input-lux font-bold">
                      <option value="active">نشطة (قيد الإنتاج)</option>
                      <option value="inactive">غير نشطة (موسم راحة)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-6 pt-8 border-t border-border">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 rounded-2xl border border-border text-secondary font-black hover:bg-border hover:text-foreground transition-all">إلغاء</button>
                  <button type="submit" disabled={loading} className="btn-primary px-16">
                    {loading ? 'جاري الحفظ...' : 'حفظ بيانات المزرعة'}
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
