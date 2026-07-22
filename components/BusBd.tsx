
import React, { useState, useMemo } from 'react';
import { BusBdRecord } from '../types';
import { Language } from '../translations';

interface BusBdProps {
  records: BusBdRecord[];
  onAdd: (record: BusBdRecord) => void;
  onUpdate: (id: string, record: BusBdRecord) => void;
  onDelete: (id: string) => void;
  lang: Language;
  userRole?: string;
  canWrite?: boolean;
}

const BUSBD_GREEN = '#16A34A';
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'];

const BusBd: React.FC<BusBdProps> = ({ records, onAdd, onUpdate, onDelete, lang, userRole, canWrite }) => {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.slice(0, 8) + '01';

  const canEdit = canWrite ?? WRITE_ROLES.includes(userRole || '');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [autoCalcClosing, setAutoCalcClosing] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: today,
    openingAmount: '',
    dailyAmount: '',
    closingAmount: '',
    notes: '',
  });

  const autoClosing = useMemo(() => {
    const op = parseFloat(formData.openingAmount) || 0;
    const da = parseFloat(formData.dailyAmount) || 0;
    return op + da;
  }, [formData.openingAmount, formData.dailyAmount]);

  const filtered = useMemo(() => {
    return records
      .filter(r => {
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo && r.date > dateTo) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, dateFrom, dateTo]);

  const totals = useMemo(() => filtered.reduce((acc, r) => ({
    openingAmount: acc.openingAmount + r.openingAmount,
    dailyAmount: acc.dailyAmount + r.dailyAmount,
    closingAmount: acc.closingAmount + r.closingAmount,
  }), { openingAmount: 0, dailyAmount: 0, closingAmount: 0 }), [filtered]);

  const resetForm = () => {
    setFormData({ date: today, openingAmount: '', dailyAmount: '', closingAmount: '', notes: '' });
    setEditingId(null);
    setAutoCalcClosing(true);
  };

  const handleEdit = (r: BusBdRecord) => {
    setFormData({
      date: r.date,
      openingAmount: String(r.openingAmount),
      dailyAmount: String(r.dailyAmount),
      closingAmount: String(r.closingAmount),
      notes: r.notes || '',
    });
    setEditingId(r.id);
    setAutoCalcClosing(false);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const op = parseFloat(formData.openingAmount) || 0;
    const da = parseFloat(formData.dailyAmount) || 0;
    const closing = autoCalcClosing ? (op + da) : (parseFloat(formData.closingAmount) || 0);
    const record: BusBdRecord = {
      id: editingId || ('BBD-' + Date.now().toString().slice(-8)),
      date: formData.date,
      openingAmount: op,
      dailyAmount: da,
      closingAmount: parseFloat(closing.toFixed(2)),
      notes: formData.notes.trim() || undefined,
    };
    if (editingId) onUpdate(editingId, record);
    else onAdd(record);
    setShowModal(false);
    resetForm();
  };

  const fmt = (n: number) => '৳' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const inputCls = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none transition-all hover:border-emerald-300 dark:hover:border-emerald-700 focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 dark:text-white";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 flex-shrink-0"
            style={{ backgroundColor: BUSBD_GREEN }}>
            <i className="fa-solid fa-bus text-xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              <span style={{ color: BUSBD_GREEN }}>Bus BD</span> Payment Tracker
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {lang === 'en' ? 'Daily Bus BD platform amount tracking' : 'ডেইলি বাস বিডি প্ল্যাটফর্ম পেমেন্ট ট্র্যাকিং'}
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
            style={{ backgroundColor: BUSBD_GREEN }}
          >
            <i className="fa-solid fa-plus"></i>
            {lang === 'en' ? 'Add Record' : 'রেকর্ড যোগ'}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: lang === 'en' ? 'Total Opening' : 'মোট ওপেনিং', value: totals.openingAmount, icon: 'fa-wallet', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
            { label: lang === 'en' ? 'Total Daily Amount' : 'মোট ডেইলি পরিমাণ', value: totals.dailyAmount, icon: 'fa-money-bill-trend-up', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30' },
            { label: lang === 'en' ? 'Total Closing' : 'মোট ক্লোজিং', value: totals.closingAmount, icon: 'fa-circle-check', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-900/30' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border`}>
              <div className="flex items-center gap-2 mb-2">
                <i className={`fa-solid ${stat.icon} ${stat.color} text-sm`}></i>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{stat.label}</p>
              </div>
              <p className={`text-xl font-black tabular-nums ${stat.color}`}>{fmt(stat.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Date Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {lang === 'en' ? 'Date Range' : 'তারিখ পরিসীমা'}
          </span>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset(null); }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-400/30 dark:text-white" />
          <span className="text-slate-400 text-xs font-black">—</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset(null); }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-400/30 dark:text-white" />
          <span className="ml-auto px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-500 tabular-nums">
            {filtered.length} {lang === 'en' ? 'records' : 'রেকর্ড'}
          </span>
        </div>
        {/* Date preset buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const base = dateFrom
                ? new Date(dateFrom + 'T00:00:00')
                : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
              base.setDate(base.getDate() - 1);
              const prev = `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}-${String(base.getDate()).padStart(2,'0')}`;
              setDateFrom(prev);
              setDateTo(prev);
              setActivePreset('prev');
            }}
            className={`flex-1 min-w-[60px] py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${
              activePreset === 'prev'
                ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/25'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40 hover:bg-amber-500 hover:text-white hover:border-amber-500'
            }`}
          >
            <i className="fa-solid fa-chevron-left mr-1 text-[9px]"></i>Prev
          </button>
          <button
            onClick={() => {
              const t = new Date().toISOString().split('T')[0];
              setDateFrom(t);
              setDateTo(t);
              setActivePreset('daily');
            }}
            className="flex-1 min-w-[60px] py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
            style={activePreset === 'daily'
              ? { backgroundColor: BUSBD_GREEN, color: '#fff', boxShadow: `0 4px 14px ${BUSBD_GREEN}40` }
              : { backgroundColor: 'rgb(241 245 249)', color: 'rgb(100 116 139)' }}
          >
            Daily
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 7);
              setDateFrom(start.toISOString().split('T')[0]);
              setDateTo(end.toISOString().split('T')[0]);
              setActivePreset('weekly');
            }}
            className="flex-1 min-w-[60px] py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
            style={activePreset === 'weekly'
              ? { backgroundColor: BUSBD_GREEN, color: '#fff', boxShadow: `0 4px 14px ${BUSBD_GREEN}40` }
              : { backgroundColor: 'rgb(241 245 249)', color: 'rgb(100 116 139)' }}
          >
            Weekly
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 30);
              setDateFrom(start.toISOString().split('T')[0]);
              setDateTo(end.toISOString().split('T')[0]);
              setActivePreset('monthly');
            }}
            className="flex-1 min-w-[60px] py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
            style={activePreset === 'monthly'
              ? { backgroundColor: BUSBD_GREEN, color: '#fff', boxShadow: `0 4px 14px ${BUSBD_GREEN}40` }
              : { backgroundColor: 'rgb(241 245 249)', color: 'rgb(100 116 139)' }}
          >
            Monthly
          </button>
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setActivePreset(null); }}
            className="px-4 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(22,163,74,0.1)' }}>
              <i className="fa-solid fa-bus text-3xl" style={{ color: BUSBD_GREEN }}></i>
            </div>
            <p className="font-black text-slate-600 dark:text-slate-300">
              {lang === 'en' ? 'No Bus BD records found' : 'কোনো বাস বিডি রেকর্ড নেই'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {lang === 'en' ? 'Add your first record to get started' : 'শুরু করতে প্রথম রেকর্ড যোগ করুন'}
            </p>
            {canEdit && (
              <button onClick={() => { resetForm(); setShowModal(true); }}
                className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest transition-all hover:opacity-90"
                style={{ backgroundColor: BUSBD_GREEN }}>
                <i className="fa-solid fa-plus"></i>
                {lang === 'en' ? 'Add First Record' : 'প্রথম রেকর্ড যোগ করুন'}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  {[
                    lang === 'en' ? 'Date' : 'তারিখ',
                    lang === 'en' ? 'Opening Amount' : 'ওপেনিং পরিমাণ',
                    lang === 'en' ? 'Daily Amount' : 'ডেইলি পরিমাণ',
                    lang === 'en' ? 'Closing Amount' : 'ক্লোজিং পরিমাণ',
                    lang === 'en' ? 'Notes' : 'নোট',
                    lang === 'en' ? 'Actions' : 'অ্যাকশন',
                  ].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap border-b border-slate-100 dark:border-slate-800">{h}</th>
                  ))}
                </tr>
                {/* Totals row */}
                <tr className="bg-slate-900 dark:bg-black border-b-2 border-emerald-600/60">
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest text-white"
                      style={{ backgroundColor: BUSBD_GREEN }}>
                      <i className="fa-solid fa-sigma text-[9px]"></i> TOTAL
                    </span>
                  </td>
                  <td className="px-4 py-3 font-black tabular-nums text-blue-300">৳{totals.openingAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 font-black tabular-nums text-emerald-400">৳{totals.dailyAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 font-black tabular-nums text-violet-400 bg-violet-500/10">৳{totals.closingAmount.toLocaleString()}</td>
                  <td colSpan={2} className="px-4 py-3 text-slate-600">—</td>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-xs tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-300">{r.date}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-blue-700 dark:text-blue-400">৳{r.openingAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums font-bold text-emerald-700 dark:text-emerald-400">৳{r.dailyAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums font-black text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-900/5">৳{r.closingAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate">{r.notes || '—'}</td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(r)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors">
                            <i className="fa-solid fa-pen text-[10px]"></i>
                          </button>
                          <button onClick={() => onDelete(r.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors">
                            <i className="fa-solid fa-trash-can text-[10px]"></i>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center"
              style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.08), transparent)' }}>
              <div>
                <h3 className="text-lg font-black">
                  {editingId
                    ? (lang === 'en' ? 'Edit Bus BD Record' : 'বাস বিডি রেকর্ড সম্পাদনা')
                    : (lang === 'en' ? 'New Bus BD Record' : 'নতুন বাস বিডি রেকর্ড')}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: BUSBD_GREEN }}>
                  {lang === 'en' ? 'Closing = Opening + Daily (auto)' : 'ক্লোজিং = ওপেনিং + ডেইলি (অটো)'}
                </p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                  {lang === 'en' ? 'Date' : 'তারিখ'}
                </label>
                <input type="date" value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                    {lang === 'en' ? 'Opening Amount' : 'ওপেনিং পরিমাণ'}
                  </label>
                  <input type="number" min="0" step="0.01"
                    value={formData.openingAmount}
                    onChange={e => setFormData({ ...formData, openingAmount: e.target.value })}
                    className={inputCls} placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                    {lang === 'en' ? 'Daily Amount' : 'ডেইলি পরিমাণ'}
                  </label>
                  <input type="number" min="0" step="0.01"
                    value={formData.dailyAmount}
                    onChange={e => setFormData({ ...formData, dailyAmount: e.target.value })}
                    className={inputCls} placeholder="0" />
                </div>
              </div>

              {/* Closing Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {lang === 'en' ? 'Closing Amount' : 'ক্লোজিং পরিমাণ'}
                  </label>
                  <button type="button"
                    onClick={() => setAutoCalcClosing(!autoCalcClosing)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                      autoCalcClosing
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                    <i className={`fa-solid ${autoCalcClosing ? 'fa-calculator' : 'fa-pen'} text-[8px]`}></i>
                    {autoCalcClosing ? 'Auto' : 'Manual'}
                  </button>
                </div>
                {autoCalcClosing ? (
                  <div className="w-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2.5 text-sm font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                    ৳{autoClosing.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    <span className="ml-2 text-[9px] font-black text-emerald-500 uppercase tracking-wide normal-case">
                      = Opening + Daily
                    </span>
                  </div>
                ) : (
                  <input type="number" min="0" step="0.01"
                    value={formData.closingAmount}
                    onChange={e => setFormData({ ...formData, closingAmount: e.target.value })}
                    className={inputCls} placeholder="0" />
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                  {lang === 'en' ? 'Notes' : 'নোট'}
                </label>
                <input type="text" value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className={inputCls} placeholder={lang === 'en' ? 'Optional notes...' : 'ঐচ্ছিক নোট...'} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest">
                  {lang === 'en' ? 'Cancel' : 'বাতিল'}
                </button>
                <button type="submit"
                  className="flex-1 py-3 rounded-xl text-white font-black text-sm uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
                  style={{ backgroundColor: BUSBD_GREEN }}>
                  {editingId ? (lang === 'en' ? 'Update' : 'আপডেট') : (lang === 'en' ? 'Save Record' : 'সংরক্ষণ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusBd;
