import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot } from '../firebase';
import { 
  Users, Wallet, Construction, Sprout, TrendingUp, TrendingDown, 
  Clock, AlertCircle, Calendar, DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Employee, Invoice, Project, Farm } from '../types';

export default function Dashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);

  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snap) => {
      setEmployees(snap.docs.map(doc => doc.data() as Employee));
    });
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      setInvoices(snap.docs.map(doc => doc.data() as Invoice));
    });
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setProjects(snap.docs.map(doc => doc.data() as Project));
    });
    const unsubFarms = onSnapshot(collection(db, 'farms'), (snap) => {
      setFarms(snap.docs.map(doc => doc.data() as Farm));
    });
    return () => { unsubEmployees(); unsubInvoices(); unsubProjects(); unsubFarms(); };
  }, []);

  const totalSales = invoices.filter(i => i.type === 'sale').reduce((acc, i) => acc + (i.totalWithTax || 0), 0);
  const totalPurchases = invoices.filter(i => i.type === 'purchase').reduce((acc, i) => acc + (i.totalWithTax || 0), 0);
  const totalExpenses = invoices.filter(i => i.type === 'operational_expense').reduce((acc, i) => acc + (i.totalWithTax || 0), 0);
  const totalSalaries = employees.reduce((acc, e) => acc + (e.totalSalary || 0), 0);
  const totalArrears = employees.reduce((acc, e) => acc + (e.unpaidSalaryTotal || 0), 0);

  const stats = [
    { label: 'إجمالي المبيعات', value: `${totalSales.toLocaleString()} ريال`, icon: <TrendingUp size={24} />, color: 'bg-green-500', trend: '+12%', sub: 'هذا الشهر' },
    { label: 'إجمالي المشتريات', value: `${totalPurchases.toLocaleString()} ريال`, icon: <TrendingDown size={24} />, color: 'bg-red-500', trend: '-5%', sub: 'هذا الشهر' },
    { label: 'عدد الموظفين', value: employees.length, icon: <Users size={24} />, color: 'bg-blue-500', trend: 'نشط', sub: 'في جميع القطاعات' },
    { label: 'المشاريع والمزارع', value: projects.length + farms.length, icon: <Construction size={24} />, color: 'bg-orange-500', trend: 'قائم', sub: 'تحت الإدارة' },
  ];

  const chartData = [
    { name: 'المبيعات', value: totalSales },
    { name: 'المشتريات', value: totalPurchases },
    { name: 'المصروفات', value: totalExpenses },
    { name: 'الرواتب', value: totalSalaries },
  ];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

  return (
    <div className="space-y-10 pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-foreground tracking-tight">لوحة التحكم</h2>
          <p className="text-secondary mt-2 font-medium">نظرة عامة شاملة على أداء مؤسسات الربدي</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border border-border shadow-xl">
          <Calendar className="text-highlight mr-2" size={20} />
          <span className="text-foreground font-bold text-sm">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card p-8 rounded-[2.5rem] shadow-2xl border border-border hover:border-highlight/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-highlight/5 to-transparent rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={`${stat.color} p-4 rounded-2xl text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform border border-white/10`}>
                {stat.icon}
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${stat.trend.startsWith('+') ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-highlight/10 text-highlight border border-highlight/20'}`}>
                  {stat.trend}
                </span>
              </div>
            </div>
            
            <h3 className="text-secondary text-xs font-black uppercase tracking-widest mb-1 relative z-10">{stat.label}</h3>
            <p className="text-3xl font-black text-foreground mt-1 relative z-10 tracking-tight">{stat.value}</p>
            <p className="text-[10px] text-secondary font-bold flex items-center gap-1 relative z-10">
              <Clock size={12} /> {stat.sub}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-card p-10 rounded-[3rem] shadow-2xl border border-border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-highlight to-primary" />
          
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tight">تحليل التدفقات المالية</h3>
              <p className="text-secondary text-xs font-medium mt-1">مقارنة المبيعات والمشتريات والمصروفات</p>
            </div>
            <select className="bg-background border border-border rounded-xl px-4 py-2 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-highlight">
              <option>آخر 30 يوم</option>
              <option>آخر 6 أشهر</option>
              <option>هذا العام</option>
            </select>
          </div>
          
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderRadius: '20px', border: '1px solid #1e293b', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', padding: '15px' }}
                  itemStyle={{ color: '#f8fafc', fontWeight: 900 }}
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Info */}
        <div className="space-y-8">
          <div className="bg-card p-8 rounded-[2.5rem] shadow-2xl border border-border">
            <h3 className="text-xl font-black text-foreground mb-8 flex items-center gap-3">
              <div className="bg-red-500/10 p-2 rounded-xl">
                <AlertCircle className="text-red-500" size={24} />
              </div>
              تنبيهات حرجة
            </h3>
            <div className="space-y-6">
              <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/20 group hover:bg-red-500/10 transition-all">
                <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-2">إجمالي رواتب متأخرة</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black text-red-500">{totalArrears.toLocaleString()}</p>
                  <span className="text-xs text-red-400/60 font-bold mb-1">ريال سعودي</span>
                </div>
              </div>
              
              <div className="p-6 bg-orange-500/5 rounded-3xl border border-orange-500/20 group hover:bg-orange-500/10 transition-all">
                <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest mb-2">إقامات قاربت على الانتهاء</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black text-orange-500">
                    {employees.filter(e => {
                      if (!e.iqamaExpiry) return false;
                      const expiry = new Date(e.iqamaExpiry);
                      const diff = expiry.getTime() - new Date().getTime();
                      return diff < 30 * 24 * 60 * 60 * 1000;
                    }).length}
                  </p>
                  <span className="text-xs text-orange-400/60 font-bold mb-1">موظفين</span>
                </div>
              </div>
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-highlight to-[#2563eb] p-8 rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(59,130,246,0.5)] text-white relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all" />
            <h3 className="text-xl font-black mb-4 flex items-center gap-3 relative z-10">
              <TrendingUp size={24} />
              ذكاء الربدي الاصطناعي
            </h3>
            <p className="text-blue-50 text-sm leading-relaxed mb-8 font-medium relative z-10">
              بناءً على تحليل التدفقات المالية الحالية، نقترح مراجعة عقود الموردين في قطاع المقاولات لتحسين هامش الربح بنسبة 4%.
            </p>
            <button className="w-full bg-white text-highlight py-4 rounded-2xl text-sm font-black transition-all hover:shadow-xl hover:-translate-y-1 relative z-10">
              عرض التقرير التحليلي
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
