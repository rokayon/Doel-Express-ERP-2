
import React, { useState, useMemo } from 'react';
import { BkashRecord } from '../types';
import { Language } from '../translations';

interface BkashProps {
  records: BkashRecord[];
  onAdd: (record: BkashRecord) => void;
  onUpdate: (id: string, record: BkashRecord) => void;
  onDelete: (id: string) => void;
  lang: Language;
  userRole?: string;
  canWrite?: boolean;
}

const BKASH_CHARGE_RATE = 0.0115;
const BKASH_PINK = '#E2136E';

const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'];

const Bkash: React.FC<BkashProps> = ({ records, onAdd, onUpdate, onDelete, lang, userRole, canWrite }) => {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.slice(0, 8) + '01';

  const canEdit = canWrite ?? WRITE_ROLES.includes(userRole || '');

  const [merchantTab, setMerchantTab] = useState<'all' | 'Dhaka' | 'Cox'>('all');
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Edit mode: single record form
  const [formData, setFormData] = useState({
    date: today,
    merchant: 'Dhaka' as 'Dhaka' | 'Cox',
    openingBalance: '',
    dailyReceived: '',
    merchantToBank: '',
    notes: '',
  });

  // Add mode: dual section form
  const [addDate, setAddDate] = useState(today);
  const [addNotes, setAddNotes] = useState('');
  const [dhakaForm, setDhakaForm] = useState({ openingBalance: '', dailyReceived: '', merchantToBank: '' });
  const [coxForm, setCoxForm] = useState({ openingBalance: '', dailyReceived: '', merchantToBank: '' });

  // Edit mode calc preview
  const calc = useMemo(() => {
    const mb = parseFloat(formData.merchantToBank) || 0;
    const ob = parseFloat(formData.openingBalance) || 0;
    const dr = parseFloat(formData.dailyReceived) || 0;
    const charge = mb * BKASH_CHARGE_RATE;
    return { bkashCharge: charge, netBankReceipt: mb - charge, closingBalance: ob + dr - mb };
  }, [formData.merchantToBank, formData.openingBalance, formData.dailyReceived]);

  // Add mode calc previews
  const dhakaCalc = useMemo(() => {
    const mb = parseFloat(dhakaForm.merchantToBank) || 0;
    const ob = parseFloat(dhakaForm.openingBalance) || 0;
    const dr = parseFloat(dhakaForm.dailyReceived) || 0;
    const charge = mb * BKASH_CHARGE_RATE;
    return { bkashCharge: charge, netBankReceipt: mb - charge, closingBalance: ob + dr - mb };
  }, [dhakaForm]);

  const coxCalc = useMemo(() => {
    const mb = parseFloat(coxForm.merchantToBank) || 0;
    const ob = parseFloat(coxForm.openingBalance) || 0;
    const dr = parseFloat(coxForm.dailyReceived) || 0;
    const charge = mb * BKASH_CHARGE_RATE;
    return { bkashCharge: charge, netBankReceipt: mb - charge, closingBalance: ob + dr - mb };
  }, [coxForm]);

  const filtered = useMemo(() => {
    return records
      .filter(r => {
        if (merchantTab !== 'all' && r.merchant !== merchantTab) return false;
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo && r.date > dateTo) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, merchantTab, dateFrom, dateTo]);

  const totals = useMemo(() => filtered.reduce((acc, r) => ({
    openingBalance: acc.openingBalance + r.openingBalance,
    dailyReceived: acc.dailyReceived + r.dailyReceived,
    merchantToBank: acc.merchantToBank + r.merchantToBank,
    bkashCharge: acc.bkashCharge + r.bkashCharge,
    netBankReceipt: acc.netBankReceipt + r.netBankReceipt,
    closingBalance: acc.closingBalance + r.closingBalance,
  }), { openingBalance: 0, dailyReceived: 0, merchantToBank: 0, bkashCharge: 0, netBankReceipt: 0, closingBalance: 0 }), [filtered]);

  const resetForm = () => {
    setFormData({ date: today, merchant: 'Dhaka', openingBalance: '', dailyReceived: '', merchantToBank: '', notes: '' });
    setDhakaForm({ openingBalance: '', dailyReceived: '', merchantToBank: '' });
    setCoxForm({ openingBalance: '', dailyReceived: '', merchantToBank: '' });
    setAddDate(today);
    setAddNotes('');
    setEditingId(null);
  };

  const handleEdit = (r: BkashRecord) => {
    setFormData({
      date: r.date,
      merchant: r.merchant,
      openingBalance: String(r.openingBalance),
      dailyReceived: String(r.dailyReceived),
      merchantToBank: String(r.merchantToBank),
      notes: r.notes || '',
    });
    setEditingId(r.id);
    setShowModal(true);
  };

  // Edit mode submit (single record)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mb = parseFloat(formData.merchantToBank) || 0;
    const ob = parseFloat(formData.openingBalance) || 0;
    const dr = parseFloat(formData.dailyReceived) || 0;
    const charge = parseFloat((mb * BKASH_CHARGE_RATE).toFixed(2));
    const record: BkashRecord = {
      id: editingId!,
      date: formData.date,
      merchant: formData.merchant,
      openingBalance: ob,
      dailyReceived: dr,
      merchantToBank: mb,
      bkashCharge: charge,
      netBankReceipt: parseFloat((mb - charge).toFixed(2)),
      closingBalance: parseFloat((ob + dr - mb).toFixed(2)),
      notes: formData.notes.trim() || undefined,
    };
    onUpdate(editingId!, record);
    setShowModal(false);
    resetForm();
  };

  // Add mode submit (dual records)
  const handleSubmitDual = (e: React.FormEvent) => {
    e.preventDefault();
    const hasData = (f: { openingBalance: string; dailyReceived: string; merchantToBank: string }) =>
      parseFloat(f.openingBalance) > 0 || parseFloat(f.dailyReceived) > 0 || parseFloat(f.merchantToBank) > 0;

    const makeRecord = (merchant: 'Dhaka' | 'Cox', f: typeof dhakaForm, ts: number): BkashRecord => {
      const mb = parseFloat(f.merchantToBank) || 0;
      const ob = parseFloat(f.openingBalance) || 0;
      const dr = parseFloat(f.dailyReceived) || 0;
      const charge = parseFloat((mb * BKASH_CHARGE_RATE).toFixed(2));
      return {
        id: 'BKS-' + ts.toString().slice(-8),
        date: addDate,
        merchant,
        openingBalance: ob,
        dailyReceived: dr,
        merchantToBank: mb,
        bkashCharge: charge,
        netBankReceipt: parseFloat((mb - charge).toFixed(2)),
        closingBalance: parseFloat((ob + dr - mb).toFixed(2)),
        notes: addNotes.trim() || undefined,
      };
    };

    const ts = Date.now();
    if (hasData(dhakaForm)) onAdd(makeRecord('Dhaka', dhakaForm, ts));
    if (hasData(coxForm)) onAdd(makeRecord('Cox', coxForm, ts + 1));

    setShowModal(false);
    resetForm();
  };

  const fmt = (n: number) => '৳' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const inputCls = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none transition-all hover:border-rose-300 dark:hover:border-rose-700 focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 dark:text-white";
  const blueCls = "w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/50 rounded-xl px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 dark:text-white";
  const tealCls = "w-full bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800/50 rounded-xl px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 dark:text-white";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-600/20 flex-shrink-0" style={{ backgroundColor: BKASH_PINK }}>
            <i className="fa-solid fa-mobile-screen-button text-xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              <span style={{ color: BKASH_PINK }}>bKash</span> Merchant Tracker
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {lang === 'en' ? 'Daily merchant wallet · bank transfer · 1.15% charge tracking' : 'ডেইলি মার্চেন্ট ওয়ালেট · ব্যাংক ট্রান্সফার · ১.১৫% চার্জ ট্র্যাকিং'}
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
            style={{ backgroundColor: BKASH_PINK }}
          >
            <i className="fa-solid fa-plus"></i>
            {lang === 'en' ? 'Add Record' : 'রেকর্ড যোগ'}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: lang === 'en' ? 'Daily Received' : 'ডেইলি রিসিভড', value: totals.dailyReceived, icon: 'fa-money-bill-trend-up', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30' },
            { label: lang === 'en' ? 'Merchant → Bank' : 'মার্চেন্ট → ব্যাংক', value: totals.merchantToBank, icon: 'fa-building-columns', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
            { label: lang === 'en' ? 'bKash Charges (1.15%)' : 'বিকাশ চার্জ (১.১৫%)', value: totals.bkashCharge, icon: 'fa-percent', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30' },
            { label: lang === 'en' ? 'Net Bank Receipt' : 'নেট ব্যাংক রিসিপ্ট', value: totals.netBankReceipt, icon: 'fa-circle-check', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-900/30' },
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

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'Dhaka', 'Cox'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMerchantTab(m)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  merchantTab === m
                    ? 'text-white shadow-lg shadow-rose-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                style={merchantTab === m ? { backgroundColor: BKASH_PINK } : {}}
              >
                {m === 'all'
                  ? (lang === 'en' ? 'All Merchants' : 'সব মার্চেন্ট')
                  : m === 'Dhaka'
                  ? (lang === 'en' ? 'Dhaka Merchant' : 'ঢাকা মার্চেন্ট')
                  : (lang === 'en' ? "Cox's Bazar" : 'কক্সবাজার')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset(null); }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-rose-400/30 dark:text-white" />
            <span className="text-slate-400 text-xs font-black">—</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset(null); }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-rose-400/30 dark:text-white" />
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-500 tabular-nums">
              {filtered.length}
            </span>
          </div>
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
              ? { backgroundColor: BKASH_PINK, color: '#fff', boxShadow: `0 4px 14px ${BKASH_PINK}40` }
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
              ? { backgroundColor: BKASH_PINK, color: '#fff', boxShadow: `0 4px 14px ${BKASH_PINK}40` }
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
              ? { backgroundColor: BKASH_PINK, color: '#fff', boxShadow: `0 4px 14px ${BKASH_PINK}40` }
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FFF0F5' }}>
              <i className="fa-solid fa-mobile-screen-button text-3xl" style={{ color: BKASH_PINK }}></i>
            </div>
            <p className="font-black text-slate-600 dark:text-slate-300">
              {lang === 'en' ? 'No bKash records found' : 'কোনো বিকাশ রেকর্ড নেই'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {lang === 'en' ? 'Add your first record to get started' : 'শুরু করতে প্রথম রেকর্ড যোগ করুন'}
            </p>
            {canEdit && (
              <button onClick={() => { resetForm(); setShowModal(true); }}
                className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest transition-all hover:opacity-90"
                style={{ backgroundColor: BKASH_PINK }}>
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
                    lang === 'en' ? 'Merchant' : 'মার্চেন্ট',
                    lang === 'en' ? 'Opening Bal.' : 'ওপেনিং',
                    lang === 'en' ? 'Daily Rcvd.' : 'ডেইলি রিসিভড',
                    lang === 'en' ? 'Merch.→Bank' : 'মার্চেন্ট→ব্যাংক',
                    'Charge 1.15%',
                    lang === 'en' ? 'Net to Bank' : 'নেট টু ব্যাংক',
                    lang === 'en' ? 'Closing Bal.' : 'ক্লোজিং',
                    lang === 'en' ? 'Notes' : 'নোট',
                    lang === 'en' ? 'Actions' : 'অ্যাকশন',
                  ].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap border-b border-slate-100 dark:border-slate-800">{h}</th>
                  ))}
                </tr>
                {/* Totals row */}
                <tr className="bg-slate-900 dark:bg-black border-b-2 border-rose-600/60">
                  <td colSpan={2} className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest text-white"
                      style={{ backgroundColor: BKASH_PINK }}>
                      <i className="fa-solid fa-sigma text-[9px]"></i> TOTAL
                    </span>
                  </td>
                  <td className="px-4 py-3 font-black tabular-nums text-white">৳{totals.openingBalance.toLocaleString()}</td>
                  <td className="px-4 py-3 font-black tabular-nums text-emerald-400">৳{totals.dailyReceived.toLocaleString()}</td>
                  <td className="px-4 py-3 font-black tabular-nums text-blue-300">৳{totals.merchantToBank.toLocaleString()}</td>
                  <td className="px-4 py-3 font-black tabular-nums text-rose-400">৳{totals.bkashCharge.toLocaleString()}</td>
                  <td className="px-4 py-3 font-black tabular-nums text-violet-400 bg-violet-500/10">৳{totals.netBankReceipt.toLocaleString()}</td>
                  <td className="px-4 py-3 font-black tabular-nums text-white">৳{totals.closingBalance.toLocaleString()}</td>
                  <td colSpan={2} className="px-4 py-3 text-slate-600">—</td>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-xs tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-300">{r.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        r.merchant === 'Dhaka'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                      }`}>
                        <i className="fa-solid fa-shop text-[7px]"></i>
                        {r.merchant === 'Dhaka' ? 'Dhaka' : "Cox's Bazar"}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-slate-500 dark:text-slate-500">৳{r.openingBalance.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums font-bold text-emerald-700 dark:text-emerald-400">৳{r.dailyReceived.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums font-bold text-blue-700 dark:text-blue-400">৳{r.merchantToBank.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums font-bold text-rose-600 dark:text-rose-400">৳{r.bkashCharge.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums font-black text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-900/5">৳{r.netBankReceipt.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums font-bold text-slate-700 dark:text-slate-300">৳{r.closingBalance.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{r.notes || '—'}</td>
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
          <div className={`bg-white dark:bg-slate-900 w-full ${editingId ? 'max-w-lg' : 'max-w-2xl'} rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200`}>
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center"
              style={{ background: 'linear-gradient(135deg, rgba(226,19,110,0.08), transparent)' }}>
              <div>
                <h3 className="text-lg font-black">
                  {editingId
                    ? (lang === 'en' ? 'Edit bKash Record' : 'বিকাশ রেকর্ড সম্পাদনা')
                    : (lang === 'en' ? 'New bKash Records' : 'নতুন বিকাশ রেকর্ড')}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: BKASH_PINK }}>
                  {editingId
                    ? (lang === 'en' ? '1.15% bKash charge auto-calculated' : '১.১৫% বিকাশ চার্জ স্বয়ংক্রিয়')
                    : (lang === 'en' ? 'Enter Dhaka & Cox records simultaneously' : 'ঢাকা ও কক্সবাজার একসাথে লিখুন')}
                </p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {editingId ? (
              /* ── EDIT MODE: single record form ── */
              <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                      {lang === 'en' ? 'Date' : 'তারিখ'}
                    </label>
                    <input type="date" value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                      {lang === 'en' ? 'Merchant' : 'মার্চেন্ট'}
                    </label>
                    <select value={formData.merchant}
                      onChange={e => setFormData({ ...formData, merchant: e.target.value as 'Dhaka' | 'Cox' })}
                      className={inputCls}>
                      <option value="Dhaka">Dhaka Merchant</option>
                      <option value="Cox">Cox's Bazar Merchant</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'openingBalance', label: lang === 'en' ? 'Opening Balance' : 'ওপেনিং ব্যালেন্স' },
                    { key: 'dailyReceived', label: lang === 'en' ? 'Daily Received' : 'ডেইলি রিসিভড' },
                    { key: 'merchantToBank', label: lang === 'en' ? 'Merch. → Bank' : 'মার্চেন্ট→ব্যাংক' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                        {label}
                      </label>
                      <input type="number" min="0" step="0.01"
                        value={formData[key as keyof typeof formData]}
                        onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                        className={inputCls} placeholder="0" />
                    </div>
                  ))}
                </div>

                {parseFloat(formData.merchantToBank) > 0 && (
                  <div className="rounded-2xl p-4 space-y-3"
                    style={{ backgroundColor: 'rgba(226,19,110,0.06)', border: '1px solid rgba(226,19,110,0.2)' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BKASH_PINK }}>
                      <i className="fa-solid fa-calculator mr-1.5"></i>
                      {lang === 'en' ? 'Auto-Calculated' : 'স্বয়ংক্রিয় হিসাব'}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wide mb-0.5">
                          {lang === 'en' ? 'bKash Charge' : 'বিকাশ চার্জ'}
                        </p>
                        <p className="font-black tabular-nums text-rose-600 dark:text-rose-400">
                          ৳{calc.bkashCharge.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wide mb-0.5">
                          {lang === 'en' ? 'Net to Bank' : 'নেট টু ব্যাংক'}
                        </p>
                        <p className="font-black tabular-nums text-violet-700 dark:text-violet-400">
                          ৳{calc.netBankReceipt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wide mb-0.5">
                          {lang === 'en' ? 'Closing Balance' : 'ক্লোজিং ব্যালেন্স'}
                        </p>
                        <p className={`font-black tabular-nums ${calc.closingBalance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                          ৳{calc.closingBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                    style={{ backgroundColor: BKASH_PINK }}>
                    {lang === 'en' ? 'Update' : 'আপডেট'}
                  </button>
                </div>
              </form>
            ) : (
              /* ── ADD MODE: dual section form ── */
              <form onSubmit={handleSubmitDual} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Shared date */}
                <div className="max-w-[200px]">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                    {lang === 'en' ? 'Date' : 'তারিখ'}
                  </label>
                  <input type="date" value={addDate}
                    onChange={e => setAddDate(e.target.value)}
                    className={inputCls} />
                </div>

                {/* Two merchant sections side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dhaka section */}
                  <div className="rounded-2xl p-4 space-y-3 border-2 border-blue-200 dark:border-blue-800/40"
                    style={{ background: 'rgba(59,130,246,0.03)' }}>
                    <div className="flex items-center gap-2 pb-2 border-b border-blue-100 dark:border-blue-900/40">
                      <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-shop text-white text-[9px]"></i>
                      </div>
                      <p className="text-[11px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">
                        {lang === 'en' ? 'Dhaka Merchant' : 'ঢাকা মার্চেন্ট'}
                      </p>
                    </div>
                    {[
                      { key: 'openingBalance', label: lang === 'en' ? 'Opening Balance' : 'ওপেনিং' },
                      { key: 'dailyReceived', label: lang === 'en' ? 'Daily Received' : 'ডেইলি রিসিভড' },
                      { key: 'merchantToBank', label: lang === 'en' ? 'Merch. → Bank' : 'মার্চেন্ট→ব্যাংক' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                          {label}
                        </label>
                        <input type="number" min="0" step="0.01"
                          value={dhakaForm[key as keyof typeof dhakaForm]}
                          onChange={e => setDhakaForm({ ...dhakaForm, [key]: e.target.value })}
                          className={blueCls} placeholder="0" />
                      </div>
                    ))}
                    {parseFloat(dhakaForm.merchantToBank) > 0 && (
                      <div className="rounded-xl p-3 bg-blue-50 dark:bg-blue-900/20 space-y-1.5 mt-2">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">Charge 1.15%</span>
                          <span className="font-black text-rose-500">৳{dhakaCalc.bkashCharge.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">{lang === 'en' ? 'Net to Bank' : 'নেট'}</span>
                          <span className="font-black text-violet-600 dark:text-violet-400">৳{dhakaCalc.netBankReceipt.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] border-t border-blue-100 dark:border-blue-800/40 pt-1.5">
                          <span className="text-slate-500">{lang === 'en' ? 'Closing' : 'ক্লোজিং'}</span>
                          <span className={`font-black ${dhakaCalc.closingBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ৳{dhakaCalc.closingBalance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cox section */}
                  <div className="rounded-2xl p-4 space-y-3 border-2 border-teal-200 dark:border-teal-800/40"
                    style={{ background: 'rgba(20,184,166,0.03)' }}>
                    <div className="flex items-center gap-2 pb-2 border-b border-teal-100 dark:border-teal-900/40">
                      <div className="w-7 h-7 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-shop text-white text-[9px]"></i>
                      </div>
                      <p className="text-[11px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest">
                        {lang === 'en' ? "Cox's Bazar Merchant" : 'কক্সবাজার মার্চেন্ট'}
                      </p>
                    </div>
                    {[
                      { key: 'openingBalance', label: lang === 'en' ? 'Opening Balance' : 'ওপেনিং' },
                      { key: 'dailyReceived', label: lang === 'en' ? 'Daily Received' : 'ডেইলি রিসিভড' },
                      { key: 'merchantToBank', label: lang === 'en' ? 'Merch. → Bank' : 'মার্চেন্ট→ব্যাংক' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                          {label}
                        </label>
                        <input type="number" min="0" step="0.01"
                          value={coxForm[key as keyof typeof coxForm]}
                          onChange={e => setCoxForm({ ...coxForm, [key]: e.target.value })}
                          className={tealCls} placeholder="0" />
                      </div>
                    ))}
                    {parseFloat(coxForm.merchantToBank) > 0 && (
                      <div className="rounded-xl p-3 bg-teal-50 dark:bg-teal-900/20 space-y-1.5 mt-2">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">Charge 1.15%</span>
                          <span className="font-black text-rose-500">৳{coxCalc.bkashCharge.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">{lang === 'en' ? 'Net to Bank' : 'নেট'}</span>
                          <span className="font-black text-violet-600 dark:text-violet-400">৳{coxCalc.netBankReceipt.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] border-t border-teal-100 dark:border-teal-800/40 pt-1.5">
                          <span className="text-slate-500">{lang === 'en' ? 'Closing' : 'ক্লোজিং'}</span>
                          <span className={`font-black ${coxCalc.closingBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ৳{coxCalc.closingBalance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shared notes */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                    {lang === 'en' ? 'Notes (optional, applies to both)' : 'নোট (ঐচ্ছিক, উভয়ের জন্য)'}
                  </label>
                  <input type="text" value={addNotes}
                    onChange={e => setAddNotes(e.target.value)}
                    className={inputCls} placeholder={lang === 'en' ? 'Optional notes...' : 'ঐচ্ছিক নোট...'} />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest">
                    {lang === 'en' ? 'Cancel' : 'বাতিল'}
                  </button>
                  <button type="submit"
                    className="flex-1 py-3 rounded-xl text-white font-black text-sm uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
                    style={{ backgroundColor: BKASH_PINK }}>
                    {lang === 'en' ? 'Save Records' : 'রেকর্ড সংরক্ষণ'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Bkash;
