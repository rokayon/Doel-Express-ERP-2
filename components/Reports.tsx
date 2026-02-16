import React, { useState } from 'react';
import { Trip, Transaction, Staff } from '../types';
import { Language, translations } from '../translations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface ReportsProps {
  trips: Trip[];
  transactions: Transaction[];
  staff: Staff[];
  lang: Language;
}

const Reports: React.FC<ReportsProps> = ({ trips, transactions, staff, lang }) => {
  const t = translations[lang];
  const [isExporting, setIsExporting] = useState<'pdf' | 'csv' | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Mock aggregated reporting data
  const passengerData = [
    { name: 'Dhaka-Ctg', count: 1240 },
    { name: 'Dhaka-Syl', count: 890 },
    { name: 'Dhaka-Raj', count: 650 },
    { name: 'Dhaka-Khu', count: 1100 },
  ];

  const categoryMix = [
    { name: 'Direct Sales', value: 45 },
    { name: 'App Booking', value: 35 },
    { name: 'B2B/Agent', value: 20 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleExportCSV = () => {
    setIsExporting('csv');
    
    // Aggregate data for CSV
    const headers = ["Metric Group", "Label", "Value", "Notes"];
    const rows = [
      ["Summary", "Total Trips Run", trips.length.toString(), "Monthly period"],
      ["Summary", "Total Revenue", "৳ 842,500", "Currency: BDT"],
      ["Summary", "Active Staff", staff.filter(s => s.status === 'Active').length.toString(), "Deployment status"],
      ...passengerData.map(d => ["Route Performance", d.name, d.count.toString(), "Passengers"]),
      ...categoryMix.map(c => ["Booking Channels", c.name, `${c.value}%`, "Revenue Share"])
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Doel_Express_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast();
    setIsExporting(null);
  };

  const handleExportPDF = () => {
    setIsExporting('pdf');
    // The browser's print engine will use the @media print styles from index.html
    setTimeout(() => {
      window.print();
      setIsExporting(null);
      triggerToast();
    }, 500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-right-10">
           <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-check"></i>
           </div>
           <div>
              <p className="text-sm font-black uppercase tracking-tighter">Export Successful</p>
              <p className="text-[10px] text-slate-400 font-bold">Document is ready for viewing.</p>
           </div>
        </div>
      )}

      {/* Header Area - Hidden on Print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.reports}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Financial auditing and operational intelligence</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleExportPDF}
             disabled={isExporting !== null}
             className="px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
           >
              {isExporting === 'pdf' ? (
                <i className="fa-solid fa-circle-notch animate-spin"></i>
              ) : (
                <i className="fa-solid fa-file-pdf text-rose-500"></i>
              )}
              {isExporting === 'pdf' ? 'Preparing PDF...' : 'Export PDF'}
           </button>
           <button 
             onClick={handleExportCSV}
             disabled={isExporting !== null}
             className="px-5 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
           >
              {isExporting === 'csv' ? (
                <i className="fa-solid fa-circle-notch animate-spin"></i>
              ) : (
                <i className="fa-solid fa-file-csv"></i>
              )}
              {isExporting === 'csv' ? 'Generating CSV...' : 'Download CSV'}
           </button>
        </div>
      </div>

      {/* Print Header - Only Visible on Print */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
          <h1 className="text-3xl font-black uppercase italic">Doel Express Operational Audit</h1>
          <div className="flex justify-between mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <span>Report Date: {new Date().toLocaleDateString()}</span>
              <span>Generated by: Doel Fleet OS</span>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:space-y-12">
        {/* Route Performance Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm print:shadow-none print:border-slate-200">
           <div className="mb-8">
              <h3 className="text-lg font-black tracking-tight">Passenger Volume by Route</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Last 30 Days Operations</p>
           </div>
           <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={passengerData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Channel Distribution */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col print:shadow-none print:border-slate-200">
           <div className="mb-8">
              <h3 className="text-lg font-black tracking-tight">Booking Channels</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Revenue Distribution</p>
           </div>
           <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={categoryMix}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {categoryMix.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Strategic Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid print:grid-cols-2">
         {[
           { label: 'Avg Punctuality', value: '94.2%', icon: 'fa-bolt', color: 'text-blue-500' },
           { label: 'Fuel Efficiency', value: '3.4km/L', icon: 'fa-gas-pump', color: 'text-emerald-500' },
           { label: 'Seat Occupancy', value: '78%', icon: 'fa-couch', color: 'text-amber-500' },
           { label: 'Incident Rate', value: '0.04%', icon: 'fa-shield-heart', color: 'text-rose-500' },
         ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
               <div className={`w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${stat.color}`}>
                  <i className={`fa-solid ${stat.icon} text-lg`}></i>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xl font-black">{stat.value}</p>
               </div>
            </div>
         ))}
      </div>

      {/* Data Table for PDF/Print */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
         <div className="p-8 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-sm uppercase tracking-[0.2em]">Detailed Operational Summary</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase">
                  <tr>
                     <th className="px-8 py-5">Performance Metric</th>
                     <th className="px-8 py-5">Current Period</th>
                     <th className="px-8 py-5">Historical Avg</th>
                     <th className="px-8 py-5 text-right">Variance</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                     { metric: 'Passenger Kilometers', current: '242.5k', avg: '210k', var: '+15.4%' },
                     { metric: 'Revenue per Unit', current: '৳ 14.2k', avg: '৳ 12.8k', var: '+10.9%' },
                     { metric: 'Maintenance Cost', current: '৳ 4.1k', avg: '৳ 3.8k', var: '-7.2%' },
                  ].map((row, i) => (
                     <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                        <td className="px-8 py-6 font-bold text-sm">{row.metric}</td>
                        <td className="px-8 py-6 text-sm">{row.current}</td>
                        <td className="px-8 py-6 text-sm text-slate-400">{row.avg}</td>
                        <td className={`px-8 py-6 text-sm text-right font-black ${row.var.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{row.var}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Reports;