
import React, { useEffect, useState, useMemo } from 'react';
import StatCard from './StatCard';
import { Trip, Transaction, Staff, TicketSalesRecord } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { getSmartInsights } from '../services/gemini';
import { Language, translations } from '../translations';

interface DashboardProps {
  trips: Trip[];
  transactions: Transaction[];
  staff: Staff[];
  ticketSales: TicketSalesRecord[];
  lang: Language;
  onRefreshAi?: () => void;
  aiKey?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ trips, transactions, staff, ticketSales, lang, onRefreshAi, aiKey = 0 }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const t = translations[lang];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoadingInsights(true);
      const res = await getSmartInsights({ trips, transactions, ticketSales });
      setInsights(res || (lang === 'en' ? "Syncing fleet intelligence..." : "বহর ইন্টেলিজেন্স সিঙ্ক হচ্ছে..."));
      setLoadingInsights(false);
    };
    fetchInsights();
  }, [trips, transactions, ticketSales, aiKey, lang]);

  const totals = transactions.reduce((acc, tx) => {
    if (tx.type === 'Income') acc.income += tx.amount;
    else acc.expense += tx.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const chartData = [
    { name: lang === 'en' ? 'Mon' : 'সোম', revenue: 40000 },
    { name: lang === 'en' ? 'Tue' : 'মঙ্গল', revenue: 30000 },
    { name: lang === 'en' ? 'Wed' : 'বুধ', revenue: 20000 },
    { name: lang === 'en' ? 'Thu' : 'বৃহ', revenue: 27800 },
    { name: lang === 'en' ? 'Fri' : 'শুক্র', revenue: 18900 },
    { name: lang === 'en' ? 'Sat' : 'শনি', revenue: 53900 },
    { name: lang === 'en' ? 'Sun' : 'রবি', revenue: 64900 },
  ];

  const counterPerformanceData = useMemo(() => {
    const map: Record<string, number> = {};
    ticketSales.forEach(record => {
      const name = record.counterName || (lang === 'en' ? 'Main Station' : 'প্রধান স্টেশন');
      map[name] = (map[name] || 0) + (record.ticketsSold || 0);
    });
    return Object.entries(map).map(([name, sold]) => ({ name, sold })).sort((a, b) => b.sold - a.sold);
  }, [ticketSales, lang]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const locale = lang === 'en' ? 'en-US' : 'bn-BD';
  
  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-8 fade-in-up">
      {/* Dynamic Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
            <i className="fa-solid fa-tower-broadcast animate-pulse"></i>
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight dark:text-white uppercase leading-none">
              {t.operationalSnapshot}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
              {t.realtimeMonitor}
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center sm:block sm:text-right pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50 dark:border-slate-800">
          <p className="text-[10px] sm:text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            {currentTime.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <p className="text-xl sm:text-3xl font-black dark:text-white font-mono tracking-tighter tabular-nums leading-none mt-0.5">
            {currentTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>
      </div>

      {/* High-Impact Stat Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title={t.grossIncome} value={`৳${totals.income.toLocaleString()}`} trend="+12.4%" color="bg-emerald-500" icon={<i className="fa-solid fa-wallet"></i>} />
        <StatCard title={t.activeFleet} value={trips.length} trend="+2 Units" color="bg-blue-500" icon={<i className="fa-solid fa-bus-simple"></i>} />
        <StatCard title={t.ledgerEntries} value={transactions.length} trend="+42 New" color="bg-amber-500" icon={<i className="fa-solid fa-receipt"></i>} />
        <StatCard title={t.fleetHealth} value="98.2%" color="bg-rose-500" icon={<i className="fa-solid fa-microchip"></i>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {/* Primary Financial Graph */}
           <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex justify-between items-start mb-8">
                <div>
                   <h3 className="text-lg font-black tracking-tight dark:text-white">{t.financialTrajectory}</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weekly Revenue Velocity</p>
                </div>
                <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                   <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                </div>
             </div>
             <div className="h-64 sm:h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                   <defs>
                     <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-5" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                   <YAxis hide />
                   <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} />
                   <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={4} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           </div>

           {/* Mobile-Friendly Bar Chart */}
           <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
             <h3 className="text-lg font-black tracking-tight mb-8 dark:text-white uppercase italic">Station Throughput</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={counterPerformanceData} layout="vertical">
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 900}} width={120} />
                   <Bar dataKey="sold" radius={[0, 12, 12, 0]} barSize={20}>
                      {counterPerformanceData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>
        </div>

        {/* AI Command Center */}
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-slate-950 text-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
            
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 border border-emerald-400/20">
                <i className="fa-solid fa-brain text-white text-xl"></i>
              </div>
              <div>
                <h3 className="font-black text-base uppercase italic tracking-tight">{t.geminiAi}</h3>
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">{t.liveStrategy}</p>
              </div>
            </div>
            
            <div className="relative z-10 min-h-[16rem]">
              {loadingInsights ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-5">
                  <div className="relative w-12 h-12">
                     <div className="absolute inset-0 border-4 border-emerald-400/20 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-emerald-400 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.3em] animate-pulse">Running Neural Audit...</p>
                </div>
              ) : (
                <div className="text-sm leading-relaxed opacity-90 font-medium text-slate-300 italic">
                  {insights}
                </div>
              )}
            </div>

            <button onClick={onRefreshAi} className="relative z-10 mt-10 w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all shadow-2xl shadow-emerald-900/40 active:scale-[0.98] border-b-4 border-emerald-800">
              {t.refreshInsights}
            </button>
          </div>

          {/* Quick Fleet Health Check */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Unit Health Summary</h4>
                <i className="fa-solid fa-gauge-high text-blue-500"></i>
             </div>
             <div className="space-y-4">
                {[
                  { label: 'D-001', val: 92, status: 'Prime' },
                  { label: 'D-005', val: 74, status: 'Review' },
                  { label: 'D-008', val: 98, status: 'Prime' }
                ].map((u, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                       <span className="dark:text-white">{u.label}</span>
                       <span className={u.val > 80 ? 'text-emerald-500' : 'text-amber-500'}>{u.status}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-1000 ${u.val > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${u.val}%` }}></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
