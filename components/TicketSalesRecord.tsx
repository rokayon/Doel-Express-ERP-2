
import React, { useState, useMemo, useEffect } from 'react';
import { TicketSalesRecord, AppRole, Trip, Staff, Coach } from '../types';
import { Language, translations } from '../translations';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TicketSalesRecordProps {
  records: TicketSalesRecord[];
  trips: Trip[];
  staff: Staff[];
  coaches: Coach[];
  onAdd: (record: TicketSalesRecord) => void;
  onUpdate: (id: string, record: TicketSalesRecord) => void;
  onDelete: (id: string) => void;
  lang: Language;
  userRole?: AppRole;
  prefillTrip?: Trip | null;
  onClearPrefill?: () => void;
}

const TicketSalesRecordComponent: React.FC<TicketSalesRecordProps> = ({ 
  records, trips, staff, coaches, onAdd, onUpdate, onDelete, lang, userRole, prefillTrip, onClearPrefill 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const t = translations[lang];
  const canEditRecord = userRole === AppRole.SUPER_ADMIN || userRole === AppRole.ADMIN || userRole === AppRole.ACCOUNTS;

  const drivers = useMemo(() => staff.filter(s => s.role.toLowerCase().includes('driver') && s.status === 'Active'), [staff]);
  const supervisors = useMemo(() => staff.filter(s => (s.role.toLowerCase().includes('guide') || s.role.toLowerCase().includes('supervisor') || s.role.toLowerCase().includes('conductor')) && s.status === 'Active'), [staff]);

  const [formData, setFormData] = useState<Omit<TicketSalesRecord, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    regNo: '',
    coachNo: '',
    driverName: '',
    guideName: '',
    departureDate: new Date().toISOString().split('T')[0],
    departureSeatQty: 0,
    departureTaka: 0,
    returnDate: '',
    returnSeatQty: 0,
    returnTaka: 0,
    totalTaka: 0,
    dieselLtr: 0,
    dieselCost: 0,
    tripCost: 0,
    totalCost: 0,
    netProfit: 0,
    abdullahpurOffice: 0,
    coxsbazarOffice: 0,
    sonargaonOffice: 0,
    dmd: 0
  });

  const salesRecordHeads = [
    { head: 'Coach No', type: 'String', cat: 'Identity', desc: 'Internal Doel Express coach identifier.' },
    { head: 'Driver', type: 'String', cat: 'Identity', desc: 'Primary pilot assigned to the voyage.' },
    { head: 'Guide', type: 'String', cat: 'Identity', desc: 'Supervisor or Guide assigned to the voyage.' },
    { head: 'Departure Date', type: 'Date', cat: 'Departure', desc: 'Date of outgoing journey.' },
    { head: 'Seat (Dep)', type: 'Number', cat: 'Departure', desc: 'Total seats sold for the departure trip.' },
    { head: 'Taka (Dep)', type: 'Currency', cat: 'Departure', desc: 'Revenue collected from departure tickets.' },
    { head: 'Return Date', type: 'Date', cat: 'Return', desc: 'Date of incoming journey.' },
    { head: 'Seat (Ret)', type: 'Number', cat: 'Return', desc: 'Total seats sold for the return trip.' },
    { head: 'Taka (Ret)', type: 'Currency', cat: 'Return', desc: 'Revenue collected from return tickets.' },
    { head: 'Total Taka', type: 'Currency', cat: 'Calculated', desc: 'Sum of Departure + Return revenue.' },
    { head: 'Diesel Ltr', type: 'Number', cat: 'Cost', desc: 'Total fuel consumed in liters.' },
    { head: 'Diesel Cost', type: 'Currency', cat: 'Cost', desc: 'Total expenditure on fuel.' },
    { head: 'Trip Cost', type: 'Currency', cat: 'Cost', desc: 'Misc costs (Tolls, maintenance, meals).' },
    { head: 'Total Cost', type: 'Currency', cat: 'Calculated', desc: 'Sum of Diesel + Trip costs.' },
    { head: 'Gross Profit', type: 'Currency', cat: 'Calculated', desc: 'Total Taka minus Total Cost.' },
    { head: 'Abdullahpur Office', type: 'Currency', cat: 'Branch', desc: 'Revenue collected from Abdullahpur branch.' },
    { head: 'Coxsbazar Office', type: 'Currency', cat: 'Branch', desc: 'Revenue collected from Cox’s Bazar branch.' },
    { head: 'Sonargaon Office', type: 'Currency', cat: 'Branch', desc: 'Revenue collected from Sonargaon branch.' }
  ];

  useEffect(() => {
    if (prefillTrip) {
      setEditingId(null);
      setFormData(prev => ({
        ...prev,
        regNo: prefillTrip.busNumber,
        coachNo: prefillTrip.coachNo,
        driverName: prefillTrip.driver,
        guideName: prefillTrip.guideName || '',
        departureDate: prefillTrip.departureTime.split(' ')[0],
        departureSeatQty: prefillTrip.bookedSeats,
      }));
      setShowForm(true);
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillTrip, onClearPrefill]);

  const handleCoachSelect = (coachId: string) => {
    const coach = coaches.find(c => c.id === coachId);
    if (coach) {
      setFormData(prev => ({ ...prev, coachNo: coach.coachNo, regNo: coach.regNo }));
    } else {
      setFormData(prev => ({ ...prev, coachNo: '', regNo: '' }));
    }
  };

  useEffect(() => {
    const totalTaka = (Number(formData.departureTaka) || 0) + (Number(formData.returnTaka) || 0);
    const totalCost = (Number(formData.dieselCost) || 0) + (Number(formData.tripCost) || 0);
    const netProfit = totalTaka - totalCost;

    setFormData(prev => ({ ...prev, totalTaka, totalCost, netProfit }));
  }, [formData.departureTaka, formData.returnTaka, formData.dieselCost, formData.tripCost]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const searchMatch = searchQuery === '' || 
        record.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.coachNo.toLowerCase().includes(searchQuery.toLowerCase());

      const dateMatch = (filterStartDate === '' || record.date >= filterStartDate) &&
                        (filterEndDate === '' || record.date <= filterEndDate);

      return searchMatch && dateMatch;
    });
  }, [records, searchQuery, filterStartDate, filterEndDate]);

  const dailySalesData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach(record => {
      const d = record.date;
      map[d] = (map[d] || 0) + record.totalTaka;
    });
    return Object.entries(map)
      .map(([date, amount]) => ({ 
        dateStr: date,
        label: new Date(date).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', { month: 'short', day: 'numeric' }), 
        amount 
      }))
      .sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());
  }, [filteredRecords, lang]);

  const aggregateStats = useMemo(() => {
    return filteredRecords.reduce((acc, curr) => ({
      profit: acc.profit + curr.netProfit,
      revenue: acc.revenue + curr.totalTaka,
      diesel: acc.diesel + curr.dieselCost,
      count: acc.count + 1
    }), { profit: 0, revenue: 0, diesel: 0, count: 0 });
  }, [filteredRecords]);

  const handleEdit = (record: TicketSalesRecord) => {
    setEditingId(record.id);
    setFormData({ ...record });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm(lang === 'en' ? 'Delete this voyage record permanently?' : 'এই ট্রিপের রেকর্ডটি স্থায়ীভাবে মুছবেন?')) {
      onDelete(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, { ...formData, id: editingId });
    } else {
      const newRecord: TicketSalesRecord = { ...formData, id: `REC-${Date.now().toString().slice(-4)}` };
      onAdd(newRecord);
    }
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Module Header & Summary */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic dark:text-white">
            {t.ticketSalesRecord}
          </h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Voyage Logistics & Financial Performance</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full xl:w-auto">
          <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Gross Profit</p>
             <p className={`text-xl font-black ${aggregateStats.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
               ৳{aggregateStats.profit.toLocaleString()}
             </p>
          </div>
          <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fuel Overhead</p>
             <p className="text-xl font-black text-amber-500">৳{aggregateStats.diesel.toLocaleString()}</p>
          </div>
          <div className="hidden sm:block bg-slate-900 text-white px-6 py-4 rounded-[1.5rem] border border-slate-800 shadow-xl">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Trips Processed</p>
             <p className="text-xl font-black text-blue-500">{aggregateStats.count}</p>
          </div>
        </div>
      </div>

      {/* Main Full-Width Daily Sales Graph */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
         <div className="flex justify-between items-center mb-10 relative z-10">
            <div>
               <h3 className="text-xl font-black tracking-tight dark:text-white uppercase italic">Daily Sales Velocity</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Aggregated Ticket Revenue Performance</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Revenue</span>
               </div>
               <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                  <i className="fa-solid fa-chart-line text-lg"></i>
               </div>
            </div>
         </div>
         
         <div className="h-72 sm:h-96 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={dailySalesData}>
                  <defs>
                    <linearGradient id="colorSalesPremium" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-5" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800, textTransform: 'uppercase'}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 800}}
                    tickFormatter={(val) => `৳${(val/1000)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', padding: '16px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}
                    itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '16px' }}
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, 'NET REVENUE']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorSalesPremium)" animationDuration={1500} />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Field Registry Documentation Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <button 
          onClick={() => setShowSchema(!showSchema)}
          className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
           <div className="flex items-center gap-3">
              <i className="fa-solid fa-circle-info text-blue-600"></i>
              <span className="text-xs font-black uppercase tracking-widest">{lang === 'en' ? 'Operational Field Logic Documentation' : 'অপারেশনাল ফিল্ড লজিক ডকুমেন্টেশন'}</span>
           </div>
           <i className={`fa-solid ${showSchema ? 'fa-chevron-up' : 'fa-chevron-down'} text-slate-300`}></i>
        </button>
        
        {showSchema && (
          <div className="p-0 border-t border-slate-50 dark:border-slate-800 animate-in slide-in-from-top-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Field Name</th>
                    <th className="px-8 py-4">Category</th>
                    <th className="px-8 py-4">Operational Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {salesRecordHeads.map((h, i) => (
                    <tr key={i} className="text-[11px] hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-4 font-mono font-black text-blue-600 uppercase italic">{h.head}</td>
                      <td className="px-8 py-4">
                        <span className={`px-2 py-0.5 rounded-md font-black text-[9px] uppercase ${
                          h.cat === 'Calculated' ? 'bg-amber-100 text-amber-700' : 
                          h.cat === 'Departure' ? 'bg-emerald-100 text-emerald-700' : 
                          h.cat === 'Return' ? 'bg-indigo-100 text-indigo-700' : 
                          h.cat === 'Cost' ? 'bg-rose-100 text-rose-700' : 
                          h.cat === 'Branch' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {h.cat}
                        </span>
                      </td>
                      <td className="px-8 py-4 font-medium text-slate-500 italic">{h.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Search by Coach, Driver, or Reg No..." 
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm transition-all font-medium text-sm dark:text-white" 
          />
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowFilters(!showFilters)} className={`px-6 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${showFilters ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50'}`}>
              <i className="fa-solid fa-filter"></i> {showFilters ? 'Apply' : 'Filters'}
           </button>
           {canEditRecord && (
             <button onClick={() => setShowForm(!showForm)} className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2">
                <i className={`fa-solid ${showForm ? 'fa-xmark' : 'fa-plus'}`}></i> {showForm ? 'Cancel' : 'Add Record'}
             </button>
           )}
        </div>
      </div>

      {/* Record Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-4 border-blue-600/10 shadow-2xl overflow-hidden relative group/form animate-in slide-in-from-top-6 duration-500">
          <div className="p-8 border-b bg-blue-50/30 dark:bg-blue-900/10 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/40">
                   <i className={`fa-solid ${editingId ? 'fa-file-signature' : 'fa-file-circle-plus'} text-2xl`}></i>
                </div>
                <div>
                   <h3 className="text-xl font-black uppercase italic tracking-tight">{editingId ? 'Modify Sales Record' : 'New Voyage Sales Record'}</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Ledger Validation</p>
                </div>
             </div>
             <button onClick={() => { setShowForm(false); setEditingId(null); }} className="w-12 h-12 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-full flex items-center justify-center transition-all shadow-sm">
                <i className="fa-solid fa-xmark text-xl"></i>
             </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Coach No</label>
                  <select required value={coaches.find(c => c.coachNo === formData.coachNo)?.id || ''} onChange={e => handleCoachSelect(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-black outline-none focus:border-blue-500 transition-all dark:text-white">
                     <option value="">Select coach...</option>
                     {coaches.map(c => <option key={c.id} value={c.id}>{c.coachNo} (Reg: {c.regNo})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Driver</label>
                  <select required value={formData.driverName} onChange={e => setFormData({...formData, driverName: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all dark:text-white">
                    <option value="">Select driver...</option>
                    {drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Guide</label>
                  <select required value={formData.guideName} onChange={e => setFormData({...formData, guideName: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all dark:text-white">
                    <option value="">Select guide...</option>
                    {supervisors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Entry Date</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all dark:text-white" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="p-8 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[2rem] border-2 border-emerald-100 dark:border-emerald-800/30 space-y-6">
                  <p className="text-[11px] font-black text-emerald-600 uppercase italic">Departure Leg</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase">Departure Date</label><input required type="date" value={formData.departureDate} onChange={e => setFormData({...formData, departureDate: e.target.value})} className="w-full border-none bg-white dark:bg-slate-900 p-3 rounded-xl font-bold dark:text-white" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase">Seats Sold</label><input required type="number" value={formData.departureSeatQty} onChange={e => setFormData({...formData, departureSeatQty: Number(e.target.value)})} className="w-full border-none bg-white dark:bg-slate-900 p-3 rounded-xl font-bold dark:text-white" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase">Taka (Revenue)</label><input required type="number" value={formData.departureTaka} onChange={e => setFormData({...formData, departureTaka: Number(e.target.value)})} className="w-full border-none bg-white dark:bg-slate-900 p-3 rounded-xl font-black text-emerald-600" /></div>
                  </div>
                </div>
                <div className="p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2rem] border-2 border-blue-100 dark:border-blue-800/30 space-y-6">
                  <p className="text-[11px] font-black text-blue-600 uppercase italic">Return Leg</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase">Return Date</label><input required type="date" value={formData.returnDate} onChange={e => setFormData({...formData, returnDate: e.target.value})} className="w-full border-none bg-white dark:bg-slate-900 p-3 rounded-xl font-bold dark:text-white" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase">Seats Sold</label><input required type="number" value={formData.returnSeatQty} onChange={e => setFormData({...formData, returnSeatQty: Number(e.target.value)})} className="w-full border-none bg-white dark:bg-slate-900 p-3 rounded-xl font-bold dark:text-white" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase">Taka (Revenue)</label><input required type="number" value={formData.returnTaka} onChange={e => setFormData({...formData, returnTaka: Number(e.target.value)})} className="w-full border-none bg-white dark:bg-slate-900 p-3 rounded-xl font-black text-blue-600" /></div>
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Diesel Ltr</label>
                  <input type="number" value={formData.dieselLtr} onChange={e => setFormData({...formData, dieselLtr: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-black text-rose-600 outline-none focus:border-rose-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Diesel Cost</label>
                  <input required type="number" value={formData.dieselCost} onChange={e => setFormData({...formData, dieselCost: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-black text-rose-600 outline-none focus:border-rose-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Trip Misc Cost</label>
                  <input required type="number" value={formData.tripCost} onChange={e => setFormData({...formData, tripCost: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-black text-rose-600 outline-none focus:border-rose-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Abdullahpur Office</label>
                  <input type="number" value={formData.abdullahpurOffice} onChange={e => setFormData({...formData, abdullahpurOffice: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border p-4 rounded-2xl font-black text-purple-600 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Coxsbazar Office</label>
                  <input type="number" value={formData.coxsbazarOffice} onChange={e => setFormData({...formData, coxsbazarOffice: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border p-4 rounded-2xl font-black text-purple-600 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Sonargaon Office</label>
                  <input type="number" value={formData.sonargaonOffice} onChange={e => setFormData({...formData, sonargaonOffice: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border p-4 rounded-2xl font-black text-purple-600 outline-none" />
                </div>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl">
               <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aggregate Ledger Calculation</p>
                     <p className={`text-3xl font-black tracking-tighter ${formData.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                       Gross Profit: ৳{formData.netProfit.toLocaleString()}
                     </p>
                  </div>
                  <div className="text-center md:text-right">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mission Totals</p>
                     <div className="flex gap-6 mt-1">
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase">Revenue</p>
                          <p className="text-xl font-black text-blue-400">৳{formData.totalTaka.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase">Overhead</p>
                          <p className="text-xl font-black text-rose-400">৳{formData.totalCost.toLocaleString()}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <button type="submit" className="w-full bg-slate-950 dark:bg-blue-600 text-white font-black py-6 rounded-3xl shadow-2xl transition-all uppercase tracking-[0.4em] text-xs active:scale-[0.98] border-b-8 border-slate-800 dark:border-blue-800">
               {editingId ? 'Verify & Commit Updates' : 'Commit Voyage to Digital Ledger'}
            </button>
          </form>
        </div>
      )}

      {/* Master Trip Table (All 18 Heads) */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mobile-scroll-hint">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] whitespace-nowrap border-separate border-spacing-0">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">
              <tr>
                <th className="px-6 py-5 sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 text-center">Actions</th>
                <th className="px-6 py-5">Coach No</th>
                <th className="px-6 py-5">Driver</th>
                <th className="px-6 py-5">Guide</th>
                <th className="px-6 py-5">Departure Date</th>
                <th className="px-6 py-5">Seat (Dep)</th>
                <th className="px-6 py-5">Taka (Dep)</th>
                <th className="px-6 py-5">Return Date</th>
                <th className="px-6 py-5">Seat (Ret)</th>
                <th className="px-6 py-5">Taka (Ret)</th>
                <th className="px-6 py-5 font-black text-blue-600 bg-blue-50/30 dark:bg-blue-900/10">Total Taka</th>
                <th className="px-6 py-5">Diesel Ltr</th>
                <th className="px-6 py-5">Diesel Cost</th>
                <th className="px-6 py-5">Trip Cost</th>
                <th className="px-6 py-5 font-black text-rose-600 bg-rose-50/30 dark:bg-rose-900/10">Total Cost</th>
                <th className="px-6 py-5 font-black text-emerald-600 bg-emerald-50/30 dark:bg-emerald-900/10">Gross Profit</th>
                <th className="px-6 py-5 bg-purple-50/30 dark:bg-purple-900/10">Abdullahpur</th>
                <th className="px-6 py-5 bg-purple-50/30 dark:bg-purple-900/10">Coxsbazar</th>
                <th className="px-6 py-5 bg-purple-50/30 dark:bg-purple-900/10">Sonargaon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={20} className="px-6 py-20 text-center text-slate-400 font-bold uppercase italic tracking-widest">
                    No voyage records found matching the current query.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <td className="px-6 py-4 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-sm text-center">
                      <div className="flex gap-2 justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(record)} className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center transition-all hover:scale-110"><i className="fa-solid fa-pen text-[10px]"></i></button>
                          <button onClick={() => handleDelete(record.id)} className="w-8 h-8 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-lg flex items-center justify-center transition-all hover:scale-110"><i className="fa-solid fa-trash text-[10px]"></i></button>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-blue-600 italic uppercase">{record.coachNo}</td>
                    <td className="px-6 py-5 font-bold uppercase tracking-tight">{record.driverName}</td>
                    <td className="px-6 py-5 text-slate-500 uppercase">{record.guideName || '---'}</td>
                    <td className="px-6 py-5 font-medium">{record.departureDate}</td>
                    <td className="px-6 py-5 font-bold">{record.departureSeatQty}</td>
                    <td className="px-6 py-5 font-black text-emerald-600">৳{record.departureTaka.toLocaleString()}</td>
                    <td className="px-6 py-5 font-medium text-slate-400">{record.returnDate || '---'}</td>
                    <td className="px-6 py-5 text-slate-400">{record.returnSeatQty || 0}</td>
                    <td className="px-6 py-5 font-black text-blue-500">৳{record.returnTaka.toLocaleString()}</td>
                    <td className="px-6 py-5 font-black text-slate-900 dark:text-white bg-blue-50/20 dark:bg-blue-900/5">৳{record.totalTaka.toLocaleString()}</td>
                    <td className="px-6 py-5 font-bold text-amber-600 italic">{record.dieselLtr || 0} L</td>
                    <td className="px-6 py-5 font-black text-rose-500">৳{record.dieselCost.toLocaleString()}</td>
                    <td className="px-6 py-5 text-rose-500">৳{record.tripCost.toLocaleString()}</td>
                    <td className="px-6 py-5 font-black text-slate-900 dark:text-white bg-rose-50/20 dark:bg-rose-900/5">৳{record.totalCost.toLocaleString()}</td>
                    <td className={`px-6 py-5 font-black text-sm italic bg-emerald-50/20 dark:bg-emerald-900/5 ${record.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      ৳{record.netProfit.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-600 bg-purple-50/10 dark:bg-purple-900/5">৳{record.abdullahpurOffice?.toLocaleString() || 0}</td>
                    <td className="px-6 py-5 font-bold text-slate-600 bg-purple-50/10 dark:bg-purple-900/5">৳{record.coxsbazarOffice?.toLocaleString() || 0}</td>
                    <td className="px-6 py-5 font-bold text-slate-600 bg-purple-50/10 dark:bg-purple-900/5">৳{record.sonargaonOffice?.toLocaleString() || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TicketSalesRecordComponent;
