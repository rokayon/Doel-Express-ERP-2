
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TicketSalesRecord, AppRole, Trip, Staff, Coach } from '../types';
import { Language, translations } from '../translations';

interface SearchableSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; sub?: string }[];
  placeholder?: string;
  required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ value, onChange, options, placeholder = 'Search...', required }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q) || (o.sub || '').toLowerCase().includes(q));
  }, [query, options]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (label: string) => {
    onChange(label);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => { setOpen(true); setQuery(''); }}
        className={`w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl px-4 py-4 flex items-center gap-2 cursor-text transition-all ${
          open ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-100 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
        }`}
      >
        {open ? (
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={value || placeholder}
            onClick={e => e.stopPropagation()}
            className="flex-1 bg-transparent outline-none font-bold text-sm dark:text-white placeholder:text-slate-400 placeholder:font-normal min-w-0"
          />
        ) : (
          <span className={`flex-1 font-bold text-sm truncate ${value ? 'dark:text-white' : 'text-slate-400 font-normal'}`}>
            {value || placeholder}
          </span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !open && (
            <button type="button" onClick={handleClear} className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 text-white dark:text-slate-300 flex items-center justify-center hover:bg-rose-400 transition-all">
              <i className="fa-solid fa-xmark text-[8px]"></i>
            </button>
          )}
          <i className={`fa-solid text-slate-400 text-[10px] transition-transform duration-200 ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-1 duration-100">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
              <i className="fa-solid fa-magnifying-glass mb-2 block text-slate-300"></i>No match found
            </div>
          ) : (
            <ul className="max-h-52 overflow-y-auto py-1.5">
              {filtered.map((opt, i) => (
                <li
                  key={i}
                  onMouseDown={() => handleSelect(opt.label)}
                  className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${
                    opt.label === value
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 flex-shrink-0 uppercase">
                    {opt.label.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm truncate">{opt.label}</p>
                    {opt.sub && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{opt.sub}</p>}
                  </div>
                  {opt.label === value && <i className="fa-solid fa-check text-blue-500 text-xs ml-auto flex-shrink-0"></i>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {required && <input type="text" value={value} required readOnly tabIndex={-1} className="sr-only" />}
    </div>
  );
};

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
  canWrite?: boolean;
  prefillTrip?: Trip | null;
  onClearPrefill?: () => void;
}

const TicketSalesRecordComponent: React.FC<TicketSalesRecordProps> = ({
  records, trips, staff, coaches, onAdd, onUpdate, onDelete, lang, userRole, canWrite, prefillTrip, onClearPrefill
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [showDieselRate, setShowDieselRate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [dieselRate, setDieselRate] = useState<number>(() => Number(localStorage.getItem('doel_diesel_rate') || 0));
  const [dieselRateInput, setDieselRateInput] = useState<string>(() => localStorage.getItem('doel_diesel_rate') || '');

  const saveDieselRate = () => {
    const rate = Number(dieselRateInput) || 0;
    setDieselRate(rate);
    localStorage.setItem('doel_diesel_rate', rate.toString());
    setShowDieselRate(false);
  };

  const t = translations[lang];
  const canEditRecord = canWrite ?? (userRole === AppRole.SUPER_ADMIN || userRole === AppRole.ADMIN || userRole === AppRole.ACCOUNTS);

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

  const aggregateStats = useMemo(() => {
    return filteredRecords.reduce((acc, curr) => ({
      profit: acc.profit + Number(curr.netProfit),
      revenue: acc.revenue + Number(curr.totalTaka),
      diesel: acc.diesel + Number(curr.dieselCost),
      count: acc.count + 1
    }), { profit: 0, revenue: 0, diesel: 0, count: 0 });
  }, [filteredRecords]);

  // Column totals for the currently filtered date range — shown as a footer row in the table
  const columnTotals = useMemo(() => {
    return filteredRecords.reduce((acc, r) => ({
      departureSeatQty: acc.departureSeatQty + (Number(r.departureSeatQty) || 0),
      departureTaka:    acc.departureTaka    + (Number(r.departureTaka)    || 0),
      returnSeatQty:    acc.returnSeatQty    + (Number(r.returnSeatQty)    || 0),
      returnTaka:       acc.returnTaka       + (Number(r.returnTaka)       || 0),
      totalTaka:        acc.totalTaka        + (Number(r.totalTaka)        || 0),
      dieselLtr:        acc.dieselLtr        + (Number(r.dieselLtr)        || 0),
      dieselCost:       acc.dieselCost       + (Number(r.dieselCost)       || 0),
      tripCost:         acc.tripCost         + (Number(r.tripCost)         || 0),
      totalCost:        acc.totalCost        + (Number(r.totalCost)        || 0),
      netProfit:        acc.netProfit        + (Number(r.netProfit)        || 0),
      abdullahpurOffice: acc.abdullahpurOffice + ((Number(r.dieselCost) || 0) + (Number(r.netProfit) || 0) - ((Number(r.coxsbazarOffice) || 0) + (Number(r.sonargaonOffice) || 0))),
      coxsbazarOffice:  acc.coxsbazarOffice  + (Number(r.coxsbazarOffice)  || 0),
      sonargaonOffice:  acc.sonargaonOffice  + (Number(r.sonargaonOffice)  || 0),
    }), {
      departureSeatQty: 0, departureTaka: 0, returnSeatQty: 0, returnTaka: 0, totalTaka: 0,
      dieselLtr: 0, dieselCost: 0, tripCost: 0, totalCost: 0, netProfit: 0,
      abdullahpurOffice: 0, coxsbazarOffice: 0, sonargaonOffice: 0,
    });
  }, [filteredRecords]);

  // Dual horizontal scrollbar (top + bottom) kept in sync, so users don't have to
  // scroll down to the bottom of a long table just to pan it left/right.
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const isSyncingScroll = useRef(false);

  useEffect(() => {
    const measure = () => setTableScrollWidth(tableScrollRef.current?.scrollWidth || 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [filteredRecords]);

  const handleTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingScroll.current) { isSyncingScroll.current = false; return; }
    isSyncingScroll.current = true;
    if (tableScrollRef.current) tableScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
  };

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingScroll.current) { isSyncingScroll.current = false; return; }
    isSyncingScroll.current = true;
    if (topScrollRef.current) topScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
  };

  const handleExportCSV = () => {
    // Wrap date strings in Excel formula notation so Excel treats them as text
    // (prevents auto-conversion to date serial which causes "###" in narrow columns)
    const csvDate = (d: string) => d ? `"=""${d}"""` : '';
    const headers = [
      'Date', 'Reg No', 'Coach No', 'Driver', 'Guide',
      'Dep Date', 'Dep Seats', 'Dep Taka',
      'Ret Date', 'Ret Seats', 'Ret Taka',
      'Total Taka', 'Diesel Ltr', 'Diesel Cost', 'Trip Cost',
      'Total Cost', 'Gross Profit',
      'Abdullahpur', 'Coxsbazar', 'Sonargaon'
    ];
    const rows = filteredRecords.map(r => [
      csvDate(r.date), r.regNo, r.coachNo, r.driverName, r.guideName || '',
      csvDate(r.departureDate), r.departureSeatQty, Number(r.departureTaka).toFixed(2),
      csvDate(r.returnDate || ''), r.returnSeatQty || 0, Number(r.returnTaka).toFixed(2),
      Number(r.totalTaka).toFixed(2), r.dieselLtr || 0, Number(r.dieselCost).toFixed(2),
      Number(r.tripCost).toFixed(2), Number(r.totalCost).toFixed(2), Number(r.netProfit).toFixed(2),
      Number(r.abdullahpurOffice || 0).toFixed(2), Number(r.coxsbazarOffice || 0).toFixed(2),
      Number(r.sonargaonOffice || 0).toFixed(2)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SalesRecord_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search by Coach, Driver, or Reg No..." 
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none font-medium text-sm dark:text-white" 
            />
          </div>
          <div className="flex gap-2 flex-wrap">
             <button
               onClick={handleExportCSV}
               className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all font-bold text-xs uppercase tracking-widest"
             >
                <i className="fa-solid fa-file-excel mr-2"></i> Export CSV
             </button>
             {/* Diesel Rate Button */}
             <div className="relative">
               <button
                 onClick={() => { setShowDieselRate(!showDieselRate); setDieselRateInput(dieselRate > 0 ? dieselRate.toString() : ''); }}
                 className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 border ${
                   dieselRate > 0
                     ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                     : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
                 }`}
               >
                 <i className="fa-solid fa-gas-pump text-[11px]"></i>
                 {dieselRate > 0 ? `৳${dieselRate}/L` : 'Set Rate'}
               </button>

               {showDieselRate && (
                 <div className="absolute right-0 top-full mt-2 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-5 w-64 animate-in slide-in-from-top-2 duration-150">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                     <i className="fa-solid fa-gas-pump mr-1.5 text-amber-500"></i>Diesel Rate per Liter
                   </p>
                   <p className="text-[10px] text-slate-400 mb-3 font-medium">
                     Set once — auto-calculates cost when you enter liters. You can still override cost manually.
                   </p>
                   <div className="flex items-center gap-2 mb-3">
                     <span className="text-sm font-black text-slate-500">৳</span>
                     <input
                       type="number"
                       value={dieselRateInput}
                       onChange={e => setDieselRateInput(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && saveDieselRate()}
                       placeholder="e.g. 112"
                       autoFocus
                       className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-black text-sm text-amber-600 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 dark:text-amber-400"
                     />
                     <span className="text-[10px] font-black text-slate-400">/ L</span>
                   </div>
                   <div className="flex gap-2">
                     <button
                       onClick={() => { setDieselRateInput(''); setDieselRate(0); localStorage.removeItem('doel_diesel_rate'); setShowDieselRate(false); }}
                       className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                     >
                       Clear
                     </button>
                     <button
                       onClick={saveDieselRate}
                       className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-400 text-white rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                     >
                       <i className="fa-solid fa-check mr-1"></i> Save Rate
                     </button>
                   </div>
                 </div>
               )}
             </div>

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

        {showFilters && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-top-4 duration-300 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 font-bold dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 font-bold dark:text-white" />
              </div>
              <div className="sm:col-span-2 flex items-end gap-2">
                <button
                  onClick={() => {
                    const base = filterStartDate
                      ? new Date(filterStartDate + 'T00:00:00')
                      : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
                    base.setDate(base.getDate() - 1);
                    const prev = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
                    setFilterStartDate(prev);
                    setFilterEndDate(prev);
                  }}
                  className="flex-1 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl font-black text-[10px] uppercase tracking-widest border border-amber-200 dark:border-amber-800/40 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all"
                >
                  <i className="fa-solid fa-chevron-left mr-1 text-[9px]"></i>Prev
                </button>
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setFilterStartDate(today);
                    setFilterEndDate(today);
                  }}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                >
                  Daily
                </button>
                <button 
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 7);
                    setFilterStartDate(start.toISOString().split('T')[0]);
                    setFilterEndDate(end.toISOString().split('T')[0]);
                  }}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                >
                  Weekly
                </button>
                <button 
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 30);
                    setFilterStartDate(start.toISOString().split('T')[0]);
                    setFilterEndDate(end.toISOString().split('T')[0]);
                  }}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                >
                  Monthly
                </button>
                <button 
                  onClick={() => {
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                  className="px-4 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Coach No</label>
                  <input
                    required
                    type="text"
                    value={formData.coachNo}
                    onChange={e => setFormData({...formData, coachNo: e.target.value})}
                    placeholder="e.g. C-001"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-black uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all hover:border-blue-400 dark:hover:border-blue-500 dark:text-white placeholder:font-normal placeholder:normal-case"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Reg No</label>
                  <input
                    type="text"
                    value={formData.regNo}
                    onChange={e => setFormData({...formData, regNo: e.target.value})}
                    placeholder="e.g. DHA-1234"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-black uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all hover:border-blue-400 dark:hover:border-blue-500 dark:text-white placeholder:font-normal placeholder:normal-case"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Driver</label>
                  <SearchableSelect
                    required
                    value={formData.driverName}
                    onChange={val => setFormData({...formData, driverName: val})}
                    options={drivers.map(d => ({ label: d.name, sub: d.role }))}
                    placeholder="Search driver..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Guide</label>
                  <SearchableSelect
                    value={formData.guideName}
                    onChange={val => setFormData({...formData, guideName: val})}
                    options={supervisors.map(s => ({ label: s.name, sub: s.role }))}
                    placeholder="Search guide..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Entry Date</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all hover:border-blue-400 dark:hover:border-blue-500 dark:text-white" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="p-8 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[2rem] border-2 border-emerald-100 dark:border-emerald-800/30 space-y-6">
                  <div className="flex items-center gap-2">
                  <p className="text-[11px] font-black text-emerald-600 uppercase italic">Departure Leg</p>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-md">Optional</span>
                </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase">Departure Date</label><input type="date" value={formData.departureDate} onChange={e => setFormData({...formData, departureDate: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-transparent hover:border-emerald-300 dark:hover:border-emerald-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 outline-none p-3 rounded-xl font-bold dark:text-white transition-all" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase">Seats Sold</label><input type="number" value={formData.departureSeatQty || ''} onChange={e => setFormData({...formData, departureSeatQty: Number(e.target.value)})} placeholder="0" className="w-full bg-white dark:bg-slate-900 border border-transparent hover:border-emerald-300 dark:hover:border-emerald-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 outline-none p-3 rounded-xl font-bold dark:text-white transition-all" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase">Taka (Revenue)</label><input type="number" value={formData.departureTaka || ''} onChange={e => setFormData({...formData, departureTaka: Number(e.target.value)})} placeholder="0" className="w-full bg-white dark:bg-slate-900 border border-transparent hover:border-emerald-300 dark:hover:border-emerald-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 outline-none p-3 rounded-xl font-black text-emerald-600 transition-all" /></div>
                  </div>
                </div>
                <div className="p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2rem] border-2 border-blue-100 dark:border-blue-800/30 space-y-6">
                  <div className="flex items-center gap-2">
                  <p className="text-[11px] font-black text-blue-600 uppercase italic">Return Leg</p>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-widest rounded-md">Optional</span>
                </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase">Return Date</label><input type="date" value={formData.returnDate} onChange={e => setFormData({...formData, returnDate: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-transparent hover:border-blue-300 dark:hover:border-blue-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none p-3 rounded-xl font-bold dark:text-white transition-all" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase">Seats Sold</label><input type="number" value={formData.returnSeatQty || ''} onChange={e => setFormData({...formData, returnSeatQty: Number(e.target.value)})} placeholder="0" className="w-full bg-white dark:bg-slate-900 border border-transparent hover:border-blue-300 dark:hover:border-blue-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none p-3 rounded-xl font-bold dark:text-white transition-all" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase">Taka (Revenue)</label><input type="number" value={formData.returnTaka || ''} onChange={e => setFormData({...formData, returnTaka: Number(e.target.value)})} placeholder="0" className="w-full bg-white dark:bg-slate-900 border border-transparent hover:border-blue-300 dark:hover:border-blue-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none p-3 rounded-xl font-black text-blue-600 transition-all" /></div>
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-xs">Diesel Ltr</label>
                    {dieselRate > 0 && (
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 px-1.5 py-0.5 rounded-md uppercase tracking-widest">
                        ৳{dieselRate}/L
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={formData.dieselLtr || ''}
                    onChange={e => {
                      const ltr = Number(e.target.value);
                      const autoCost = dieselRate > 0 ? Math.round(ltr * dieselRate) : formData.dieselCost;
                      setFormData({...formData, dieselLtr: ltr, dieselCost: autoCost});
                    }}
                    placeholder="0"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-black text-rose-600 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 transition-all hover:border-rose-300 dark:hover:border-rose-600"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-xs">Diesel Cost</label>
                    {dieselRate > 0 && formData.dieselLtr > 0 && (
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 px-1.5 py-0.5 rounded-md uppercase tracking-widest">
                        Auto
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={formData.dieselCost || ''}
                    onChange={e => setFormData({...formData, dieselCost: Number(e.target.value)})}
                    placeholder="0"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-black text-rose-600 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 transition-all hover:border-rose-300 dark:hover:border-rose-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Trip Misc Cost</label>
                  <input type="number" value={formData.tripCost || ''} onChange={e => setFormData({...formData, tripCost: Number(e.target.value)})} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-black text-rose-600 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 transition-all hover:border-rose-300 dark:hover:border-rose-600" />
                </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Office Collections</p>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[9px] font-black uppercase tracking-widest rounded-md">Optional</span>
                <span className="text-[10px] text-slate-400">— প্রতিটি শাখা অফিসে এই ট্রিপের জন্য কত টাকা collect হয়েছে তা এখানে লিখুন</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-xs">Abdullahpur Office</label>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 px-1.5 py-0.5 rounded-md uppercase tracking-widest">Auto</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl font-black text-purple-600 cursor-not-allowed opacity-75">
                    ৳{((formData.dieselCost || 0) + (formData.netProfit || 0) - ((formData.coxsbazarOffice || 0) + (formData.sonargaonOffice || 0))).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Coxsbazar Office</label>
                  <input type="number" value={formData.coxsbazarOffice || ''} onChange={e => setFormData({...formData, coxsbazarOffice: Number(e.target.value)})} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl font-black text-purple-600 outline-none focus:ring-2 focus:ring-purple-500 transition-all hover:border-purple-400 dark:hover:border-purple-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-xs">Sonargaon Office</label>
                  <input type="number" value={formData.sonargaonOffice || ''} onChange={e => setFormData({...formData, sonargaonOffice: Number(e.target.value)})} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl font-black text-purple-600 outline-none focus:ring-2 focus:ring-purple-500 transition-all hover:border-purple-400 dark:hover:border-purple-500" />
                </div>
            </div>

            <div className={`p-8 rounded-[2rem] shadow-sm border-2 transition-all ${formData.netProfit >= 0 ? 'bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40' : 'bg-rose-50/60 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/40'}`}>
               <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aggregate Ledger Calculation</p>
                     <p className={`text-3xl font-black tracking-tighter ${formData.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                       Gross Profit: ৳{formData.netProfit.toLocaleString()}
                     </p>
                  </div>
                  <div className="text-center md:text-right">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mission Totals</p>
                     <div className="flex gap-6 mt-1">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Revenue</p>
                          <p className="text-xl font-black text-blue-600 dark:text-blue-400">৳{formData.totalTaka.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Overhead</p>
                          <p className="text-xl font-black text-rose-500 dark:text-rose-400">৳{formData.totalCost.toLocaleString()}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black py-6 rounded-3xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all uppercase tracking-[0.4em] text-xs active:scale-[0.98]">
               <i className={`fa-solid ${editingId ? 'fa-file-signature' : 'fa-circle-check'} mr-3`}></i>
               {editingId ? 'Verify & Commit Updates' : 'Commit Voyage to Digital Ledger'}
            </button>
          </form>
        </div>
      )}

      {/* Master Trip Table (All 18 Heads) */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mobile-scroll-hint">
        {/* Top scrollbar — mirrors the bottom one so you can pan left/right without scrolling down */}
        <div
          ref={topScrollRef}
          onScroll={handleTopScroll}
          className="hidden lg:block overflow-x-auto overflow-y-hidden h-3 border-b border-slate-100 dark:border-slate-800"
        >
          <div style={{ width: tableScrollWidth, height: 1 }} />
        </div>
        <div ref={tableScrollRef} onScroll={handleTableScroll} className="overflow-x-auto">
          <table className="w-full text-left text-[11px] whitespace-nowrap border-separate border-spacing-0">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">
              <tr>
                <th className="px-6 py-5 sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 text-center">Actions</th>
                <th className="px-6 py-5">Coach No</th>
                <th className="px-6 py-5">Reg No</th>
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
              {filteredRecords.length > 0 && (
                <tr className="bg-slate-900 dark:bg-black border-t-2 border-b-2 border-blue-500 normal-case">
                  <td className="px-6 py-4 sticky left-0 z-20 bg-slate-900 dark:bg-black border-r border-slate-700 text-center">
                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/30">
                      Total
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">—</td>
                  <td className="px-6 py-4 text-slate-500">—</td>
                  <td className="px-6 py-4 text-slate-500">—</td>
                  <td className="px-6 py-4 text-slate-500">—</td>
                  <td className="px-6 py-4 text-slate-500">—</td>
                  <td className="px-6 py-4 font-black tabular-nums text-white">{columnTotals.departureSeatQty}</td>
                  <td className="px-6 py-4 font-black tabular-nums text-emerald-400">৳{columnTotals.departureTaka.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-500">—</td>
                  <td className="px-6 py-4 font-black tabular-nums text-white">{columnTotals.returnSeatQty}</td>
                  <td className="px-6 py-4 font-black tabular-nums text-blue-300">৳{columnTotals.returnTaka.toLocaleString()}</td>
                  <td className="px-6 py-4 font-black tabular-nums text-white bg-blue-500/20">৳{columnTotals.totalTaka.toLocaleString()}</td>
                  <td className="px-6 py-4 font-black tabular-nums text-amber-400">{columnTotals.dieselLtr} L</td>
                  <td className="px-6 py-4 font-black tabular-nums text-rose-400">৳{columnTotals.dieselCost.toLocaleString()}</td>
                  <td className="px-6 py-4 font-black tabular-nums text-rose-400">৳{columnTotals.tripCost.toLocaleString()}</td>
                  <td className="px-6 py-4 font-black tabular-nums text-white bg-rose-500/20">৳{columnTotals.totalCost.toLocaleString()}</td>
                  <td className={`px-6 py-4 font-black tabular-nums text-sm italic bg-emerald-500/20 ${columnTotals.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ৳{columnTotals.netProfit.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-black tabular-nums text-purple-300 bg-purple-500/15">৳{columnTotals.abdullahpurOffice.toLocaleString()}</td>
                  <td className="px-6 py-4 font-black tabular-nums text-purple-300 bg-purple-500/15">৳{columnTotals.coxsbazarOffice.toLocaleString()}</td>
                  <td className="px-6 py-4 font-black tabular-nums text-purple-300 bg-purple-500/15">৳{columnTotals.sonargaonOffice.toLocaleString()}</td>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={21} className="px-6 py-20 text-center text-slate-400 font-bold uppercase italic tracking-widest">
                    No voyage records found matching the current query.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <td className="px-6 py-4 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-sm text-center">
                      <div className="flex gap-2 justify-center">
                          <button onClick={() => handleEdit(record)} className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center transition-all hover:scale-110"><i className="fa-solid fa-pen text-[10px]"></i></button>
                          <button onClick={() => handleDelete(record.id)} className="w-8 h-8 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-lg flex items-center justify-center transition-all hover:scale-110"><i className="fa-solid fa-trash text-[10px]"></i></button>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-blue-600 italic uppercase">{record.coachNo}</td>
                    <td className="px-6 py-5 font-mono font-bold text-slate-500 uppercase text-[10px]">{record.regNo || '---'}</td>
                    <td className="px-6 py-5 font-bold uppercase tracking-tight">{record.driverName}</td>
                    <td className="px-6 py-5 text-slate-500 uppercase">{record.guideName || '---'}</td>
                    <td className="px-6 py-5 font-medium">{record.departureDate}</td>
                    <td className="px-6 py-5 font-bold">{Number(record.departureSeatQty)}</td>
                    <td className="px-6 py-5 font-black text-emerald-600">৳{Number(record.departureTaka).toLocaleString()}</td>
                    <td className="px-6 py-5 font-medium text-slate-400">{record.returnDate || '---'}</td>
                    <td className="px-6 py-5 text-slate-400">{Number(record.returnSeatQty) || 0}</td>
                    <td className="px-6 py-5 font-black text-blue-500">৳{Number(record.returnTaka).toLocaleString()}</td>
                    <td className="px-6 py-5 font-black text-slate-900 dark:text-white bg-blue-50/20 dark:bg-blue-900/5">৳{Number(record.totalTaka).toLocaleString()}</td>
                    <td className="px-6 py-5 font-bold text-amber-600 italic">{Number(record.dieselLtr) || 0} L</td>
                    <td className="px-6 py-5 font-black text-rose-500">৳{Number(record.dieselCost).toLocaleString()}</td>
                    <td className="px-6 py-5 text-rose-500">৳{Number(record.tripCost).toLocaleString()}</td>
                    <td className="px-6 py-5 font-black text-slate-900 dark:text-white bg-rose-50/20 dark:bg-rose-900/5">৳{Number(record.totalCost).toLocaleString()}</td>
                    <td className={`px-6 py-5 font-black text-sm italic bg-emerald-50/20 dark:bg-emerald-900/5 ${Number(record.netProfit) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      ৳{Number(record.netProfit).toLocaleString()}
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-600 bg-purple-50/10 dark:bg-purple-900/5">৳{((Number(record.dieselCost) || 0) + (Number(record.netProfit) || 0) - ((Number(record.coxsbazarOffice) || 0) + (Number(record.sonargaonOffice) || 0))).toLocaleString()}</td>
                    <td className="px-6 py-5 font-bold text-slate-600 bg-purple-50/10 dark:bg-purple-900/5">৳{Number(record.coxsbazarOffice || 0).toLocaleString()}</td>
                    <td className="px-6 py-5 font-bold text-slate-600 bg-purple-50/10 dark:bg-purple-900/5">৳{Number(record.sonargaonOffice || 0).toLocaleString()}</td>
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
