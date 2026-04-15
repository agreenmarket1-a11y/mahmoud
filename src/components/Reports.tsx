import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot } from '../firebase';
import { 
  FileText, Download, FileDown, Printer, Filter, Calendar, 
  Users, Wallet, Construction, Sprout, TrendingUp, Percent
} from 'lucide-react';
import { motion } from 'motion/react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { Employee, Invoice, Project, Farm } from '../types';

type ReportType = 'employees' | 'financial' | 'projects' | 'tax';

export default function Reports() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeReport, setActiveReport] = useState<ReportType>('employees');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snap) => {
      setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    });
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      setInvoices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)));
    });
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });
    const unsubFarms = onSnapshot(collection(db, 'farms'), (snap) => {
      setFarms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Farm)));
    });
    return () => { unsubEmployees(); unsubInvoices(); unsubProjects(); unsubFarms(); };
  }, []);

  const getReportData = () => {
    switch (activeReport) {
      case 'employees': return employees;
      case 'financial': return invoices;
      case 'projects': return [...projects, ...farms];
      case 'tax': return invoices.filter(i => i.taxNumber);
      default: return [];
    }
  };

  const totalTax = invoices.reduce((acc, i) => acc + (i.taxAmount || 0), 0);
  const totalSales = invoices.filter(i => i.type === 'sale').reduce((acc, i) => acc + (i.totalWithTax || 0), 0);
  const totalExpenses = invoices.filter(i => i.type !== 'sale').reduce((acc, i) => acc + (i.totalWithTax || 0), 0);

  return (
    <div className="space-y-10 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h2 className="text-4xl font-black text-foreground tracking-tight">مركز التقارير والذكاء المالي</h2>
          <p className="text-secondary mt-2 font-medium">استخراج، تحليل، وتصدير بيانات المؤسسة بدقة متناهية</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => exportToPDF('report-content', `تقرير_${activeReport}`)} className="flex items-center gap-2 bg-red-500/10 text-red-400 px-6 py-3 rounded-2xl hover:bg-red-500/20 transition-all font-black border border-red-500/30 shadow-xl"><FileDown size={20} /> تصدير PDF</button>
          <button onClick={() => exportToExcel(getReportData(), `تقرير_${activeReport}`)} className="flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-2xl hover:bg-primary/20 transition-all font-black border border-primary/30 shadow-xl"><Download size={20} /> تصدير Excel</button>
        </div>
      </header>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <ReportCard active={activeReport === 'employees'} onClick={() => setActiveReport('employees')} icon={<Users size={24} />} title="تقرير الموظفين" desc="الرواتب، البيانات، المتأخرات" />
        <ReportCard active={activeReport === 'financial'} onClick={() => setActiveReport('financial')} icon={<Wallet size={24} />} title="التقرير المالي" desc="المبيعات، المشتريات، المصروفات" />
        <ReportCard active={activeReport === 'projects'} onClick={() => setActiveReport('projects')} icon={<Construction size={24} />} title="تقرير المشاريع" desc="الحالة، المزارع، الإنجاز" />
        <ReportCard active={activeReport === 'tax'} onClick={() => setActiveReport('tax')} icon={<Percent size={24} />} title="التقرير الضريبي" desc="ضريبة القيمة المضافة، الفواتير" />
      </div>

      {/* Filters */}
      <div className="card-lux p-8 flex flex-wrap items-end gap-8 no-print">
        <div className="space-y-3">
          <label className="text-xs font-black text-secondary uppercase tracking-widest mr-1 flex items-center gap-2"><Calendar size={14} className="text-highlight" /> من تاريخ</label>
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="form-input-lux" />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-black text-secondary uppercase tracking-widest mr-1 flex items-center gap-2"><Calendar size={14} className="text-highlight" /> إلى تاريخ</label>
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="form-input-lux" />
        </div>
        <div className="flex-1" />
        <button className="btn-primary flex items-center gap-3">
          <Filter size={20} />
          تطبيق الفلتر الذكي
        </button>
      </div>

      {/* Report Content */}
      <div id="report-content" className="bg-card rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-border overflow-hidden transition-all duration-500 hover:border-highlight/30">
        <div className="p-10 border-b border-border bg-gradient-to-r from-background to-card flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-highlight/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10">
            <h3 className="text-3xl font-black text-foreground tracking-tight">
              {activeReport === 'employees' ? 'تقرير شئون الموظفين' : 
               activeReport === 'financial' ? 'التقرير المالي العام' : 
               activeReport === 'projects' ? 'تقرير المشاريع والمزارع' : 'التقرير الضريبي'}
            </h3>
            <p className="text-secondary mt-2 font-bold uppercase tracking-widest text-xs">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>
          <div className="text-left relative z-10">
            <h4 className="text-2xl font-black text-primary tracking-tighter">مؤسسات الربدي</h4>
            <p className="text-[10px] text-secondary font-black uppercase tracking-widest mt-1">نظام الإدارة</p>
          </div>
        </div>

        <div className="p-10">
          {activeReport === 'financial' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <SummaryBox title="إجمالي المبيعات" value={totalSales} color="text-primary" />
              <SummaryBox title="إجمالي المصروفات" value={totalExpenses} color="text-red-400" />
              <SummaryBox title="صافي الربح التقديري" value={totalSales - totalExpenses} color="text-highlight" />
            </div>
          )}

          {activeReport === 'tax' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <SummaryBox title="إجمالي الضريبة المحصلة" value={totalTax} color="text-orange-400" />
              <SummaryBox title="عدد الفواتير الضريبية" value={invoices.filter(i => i.taxNumber).length} color="text-highlight" isCurrency={false} />
            </div>
          )}

          <div className="overflow-x-auto rounded-3xl border border-border bg-background/30">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-background/50 text-secondary text-xs uppercase tracking-widest border-b border-border">
                  {activeReport === 'employees' && (
                    <>
                      <th className="px-8 py-6 font-black">الاسم</th>
                      <th className="px-8 py-6 font-black">الهوية</th>
                      <th className="px-8 py-6 font-black">الوظيفة</th>
                      <th className="px-8 py-6 font-black">الراتب</th>
                      <th className="px-8 py-6 font-black">المتأخرات</th>
                    </>
                  )}
                  {activeReport === 'financial' && (
                    <>
                      <th className="px-8 py-6 font-black">التاريخ</th>
                      <th className="px-8 py-6 font-black">النوع</th>
                      <th className="px-8 py-6 font-black">البيان</th>
                      <th className="px-8 py-6 font-black">المبلغ</th>
                      <th className="px-8 py-6 font-black">الضريبة</th>
                    </>
                  )}
                  {activeReport === 'projects' && (
                    <>
                      <th className="px-8 py-6 font-black">الاسم</th>
                      <th className="px-8 py-6 font-black">النوع</th>
                      <th className="px-8 py-6 font-black">الموقع</th>
                      <th className="px-8 py-6 font-black">الحالة</th>
                    </>
                  )}
                  {activeReport === 'tax' && (
                    <>
                      <th className="px-8 py-6 font-black">رقم الفاتورة</th>
                      <th className="px-8 py-6 font-black">الرقم الضريبي</th>
                      <th className="px-8 py-6 font-black">المبلغ</th>
                      <th className="px-8 py-6 font-black">الضريبة</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {getReportData().map((item: any, idx) => (
                  <tr key={idx} className="hover:bg-highlight/5 transition-all group">
                    {activeReport === 'employees' && (
                      <>
                        <td className="px-8 py-6 text-foreground font-black">{item.name}</td>
                        <td className="px-8 py-6 text-secondary font-mono text-xs">{item.idNumber}</td>
                        <td className="px-8 py-6 text-secondary font-bold">{item.jobTitle}</td>
                        <td className="px-8 py-6 text-primary font-black">{item.totalSalary?.toLocaleString()} ريال</td>
                        <td className="px-8 py-6 text-red-400 font-black">{item.unpaidSalaryTotal?.toLocaleString()} ريال</td>
                      </>
                    )}
                    {activeReport === 'financial' && (
                      <>
                        <td className="px-8 py-6 text-foreground font-medium">{item.date}</td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${item.type === 'sale' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                            {item.type === 'sale' ? 'بيع' : 'شراء/مصروف'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-foreground font-bold">{item.customerName || item.category}</td>
                        <td className="px-8 py-6 text-primary font-black">{item.amount?.toLocaleString()} ريال</td>
                        <td className="px-8 py-6 text-secondary font-bold">{item.taxAmount?.toLocaleString()} ريال</td>
                      </>
                    )}
                    {activeReport === 'projects' && (
                      <>
                        <td className="px-8 py-6 text-foreground font-black">{item.name}</td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${item.location ? 'bg-primary/10 text-primary border-primary/20' : 'bg-highlight/10 text-highlight border-highlight/20'}`}>
                            {item.location ? 'مزرعة' : 'مشروع'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-secondary font-bold">{item.location || '---'}</td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 rounded-lg bg-border text-foreground text-xs font-bold border border-border">
                            {item.status}
                          </span>
                        </td>
                      </>
                    )}
                    {activeReport === 'tax' && (
                      <>
                        <td className="px-8 py-6 text-foreground font-bold">{idx + 1}</td>
                        <td className="px-8 py-6 text-secondary font-mono text-xs">{item.taxNumber}</td>
                        <td className="px-8 py-6 text-primary font-black">{item.amount?.toLocaleString()} ريال</td>
                        <td className="px-8 py-6 text-secondary font-bold">{item.taxAmount?.toLocaleString()} ريال</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ active, onClick, icon, title, desc }: { active: boolean, onClick: () => void, icon: React.ReactNode, title: string, desc: string }) {
  return (
    <button 
      onClick={onClick}
      className={`p-8 rounded-[2.5rem] border text-right transition-all group relative overflow-hidden ${
        active 
          ? 'bg-gradient-to-br from-highlight to-[#2563eb] border-highlight text-white shadow-[0_20px_40px_-10px_rgba(59,130,246,0.5)] scale-[1.02]' 
          : 'bg-card border-border hover:border-highlight/50 shadow-xl'
      }`}
    >
      <div className={`p-4 rounded-2xl w-fit mb-6 transition-all shadow-lg ${active ? 'bg-white/20' : 'bg-highlight/10 text-highlight group-hover:scale-110'}`}>
        {icon}
      </div>
      <h4 className={`text-xl font-black mb-2 tracking-tight ${active ? 'text-white' : 'text-foreground'}`}>{title}</h4>
      <p className={`text-xs font-bold leading-relaxed ${active ? 'text-blue-100' : 'text-secondary'}`}>{desc}</p>
      {active && <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />}
    </button>
  );
}

function SummaryBox({ title, value, color, isCurrency = true }: { title: string, value: number, color: string, isCurrency?: boolean }) {
  return (
    <div className="p-8 bg-background rounded-[2rem] border border-border shadow-2xl group hover:border-highlight/30 transition-all">
      <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-3">{title}</p>
      <p className={`text-3xl font-black ${color} tracking-tight`}>
        {value.toLocaleString()} <span className="text-sm font-medium opacity-80">{isCurrency && 'ريال'}</span>
      </p>
    </div>
  );
}
