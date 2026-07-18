
import React, { useState, useMemo, useCallback } from 'react';
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

const RATE = 0.0115;
const BKASH_PINK = '#E2136E';
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'];

const Bkash: React.FC<BkashProps> = ({ records, onAdd, onUpdate, onDelete, lang, userRole, canWrite }) => {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.slice(0, 8) + '01';
  const canEdit = canWrite ?? WRITE_ROLES.includes(userRole || '');

  // ── Filter state ──────────────────────────────────────
  const [merchantTab, setMerchantTab] = useState<'all' | 'Dhaka' | 'Cox'>('all');
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Add mode state (dual merchant, simplified) ────────
  const [addDate, setAddDate] = useState(today);
  const [addNotes, setAddNotes] = useState('');
  const [dhakaM2B, setDhakaM2B] = useState('');
  const [coxM2B, setCoxM2B] = useState('');

  // ── Edit mode state ───────────────────────────────────
  const [editData, setEditData] = useState({
    date: today,
    merchant: 'Dhaka' as 'Dhaka' | 'Cox',
    openingBalance: 0,
    dailyReceived: 0,
    merchantToBank: '',
    notes: '',
  });

  // ── Auto-carry: last closing of a merchant before a date ──
  const getOpeningBalance = useCallback(
    (merchant: 'Dhaka' | 'Cox', beforeDate: string, excludeId?: string): number => {
      const prev = records
        .filter(r => r.merchant === merchant && r.date < beforeDate && r.id !== excludeId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
      return prev.length > 0 ? prev[0].closingBalance : 0;
    },
    [records]
  );

  // ── Add mode calcs ────────────────────────────────────
  const dhakaOB = useMemo(() => getOpeningBalance('Dhaka', addDate), [getOpeningBalance, addDate]);
  const coxOB   = useMemo(() => getOpeningBalance('Cox',   addDate), [getOpeningBalance, addDate]);

  const dhakaCalc = useMemo(() => {
    const m2b = parseFloat(dhakaM2B) || 0;
    const charge  = parseFloat((m2b * RATE).toFixed(2));
    const net     = parseFloat((m2b - charge).toFixed(2));
    const closing = parseFloat((dhakaOB - m2b).toFixed(2));
    return { m2b, charge, net, closing };
  }, [dhakaM2B, dhakaOB]);

  const coxCalc = useMemo(() => {
    const m2b = parseFloat(coxM2B) || 0;
    const charge  = parseFloat((m2b * RATE).toFixed(2));
    const net     = parseFloat((m2b - charge).toFixed(2));
    const closing = parseFloat((coxOB - m2b).toFixed(2));
    return { m2b, charge, net, closing };
  }, [coxM2B, coxOB]);

  const combined = useMemo(() => {
    const total  = dhakaCalc.m2b + coxCalc.m2b;
    const charge = parseFloat((total * RATE).toFixed(2));
    const net    = parseFloat((total - charge).toFixed(2));
    return { total, charge, net };
  }, [dhakaCalc.m2b, coxCalc.m2b]);

  // ── Edit mode calcs (preserve stored OB + DR) ─────────
  const editCalc = useMemo(() => {
    const m2b     = parseFloat(editData.merchantToBank) || 0;
    const charge  = parseFloat((m2b * RATE).toFixed(2));
    const net     = parseFloat((m2b - charge).toFixed(2));
    const closing = parseFloat((editData.openingBalance + editData.dailyReceived - m2b).toFixed(2));
    return { m2b, charge, net, closing };
  }, [editData.merchantToBank, editData.openingBalance, editData.dailyReceived]);

  // ── Filtered + sorted records ─────────────────────────
  const filtered = useMemo(() =>
    records
      .filter(r => {
        if (merchantTab !== 'all' && r.merchant !== merchantTab) return false;
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo   && r.date > dateTo)   return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [records, merchantTab, dateFrom, dateTo]
  );

  const totals = useMemo(() =>
    filtered.reduce((acc, r) => ({
      openingBalance: acc.openingBalance + r.openingBalance,
      dailyReceived:  acc.dailyReceived  + r.dailyReceived,
      merchantToBank: acc.merchantToBank + r.merchantToBank,
      bkashCharge:    acc.bkashCharge    + r.bkashCharge,
      netBankReceipt: acc.netBankReceipt + r.netBankReceipt,
      closingBalance: acc.closingBalance + r.closingBalance,
    }), { openingBalance: 0, dailyReceived: 0, merchantToBank: 0, bkashCharge: 0, netBankReceipt: 0, closingBalance: 0 }),
    [filtered]
  );

  // ── Date groups for table rendering ──────────────────
  const dateGroups = useMemo(() => {
    const groups: { date: string; rows: BkashRecord[]; sub: { m2b: number; charge: number; net: number; closing: number } }[] = [];
    filtered.forEach(r => {
      const last = groups[groups.length - 1];
      if (last && last.date === r.date) {
        last.rows.push(r);
        last.sub.m2b     += r.merchantToBank;
        last.sub.charge  += r.bkashCharge;
        last.sub.net     += r.netBankReceipt;
        last.sub.closing += r.closingBalance;
      } else {
        groups.push({ date: r.date, rows: [r], sub: { m2b: r.merchantToBank, charge: r.bkashCharge, net: r.netBankReceipt, closing: r.closingBalance } });
      }
    });
    return groups;
  }, [filtered]);

  // ── Helpers ───────────────────────────────────────────
  const fmt = (n: number) => '৳' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const resetForm = () => {
    setDhakaM2B(''); setCoxM2B(''); setAddDate(today); setAddNotes('');
    setEditData({ date: today, merchant: 'Dhaka', openingBalance: 0, dailyReceived: 0, merchantToBank: '', notes: '' });
    setEditingId(null);
  };

  const handleEdit = (r: BkashRecord) => {
    setEditData({
      date: r.date,
      merchant: r.merchant,
      openingBalance: r.openingBalance,
      dailyReceived: r.dailyReceived,
      merchantToBank: String(r.merchantToBank),
      notes: r.notes || '',
    });
    setEditingId(r.id);
    setShowModal(true);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(editingId!, {
      id: editingId!,
      date: editData.date,
      merchant: editData.merchant,
      openingBalance: editData.openingBalance,
      dailyReceived: editData.dailyReceived,
      merchantToBank: editCalc.m2b,
      bkashCharge: editCalc.charge,
      netBankReceipt: editCalc.net,
      closingBalance: editCalc.closing,
      notes: editData.notes.trim() || undefined,
    });
    setShowModal(false);
    resetForm();
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const ts = Date.now();
    if (dhakaCalc.m2b > 0) {
      onAdd({
        id: 'BKS-' + ts.toString().slice(-8),
        date: addDate, merchant: 'Dhaka',
        openingBalance: dhakaOB, dailyReceived: 0,
        merchantToBank: dhakaCalc.m2b, bkashCharge: dhakaCalc.charge,
        netBankReceipt: dhakaCalc.net, closingBalance: dhakaCalc.closing,
        notes: addNotes.trim() || undefined,
      });
    }
    if (coxCalc.m2b > 0) {
      onAdd({
        id: 'BKS-' + (ts + 1).toString().slice(-8),
        date: addDate, merchant: 'Cox',
        openingBalance: coxOB, dailyReceived: 0,
        merchantToBank: coxCalc.m2b, bkashCharge: coxCalc.charge,
        netBankReceipt: coxCalc.net, closingBalance: coxCalc.closing,
        notes: addNotes.trim() || undefined,
      });
    }
    setShowModal(false);
    resetForm();
  };

  const inputCls = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none transition-all hover:border-rose-300 dark:hover:border-rose-700 focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 dark:text-white";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
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

      {/* ── Summary Cards ── */}
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

      {/* ── Filters ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'Dhaka', 'Cox'] as const).map(m => (
              <button key={m} onClick={() => setMerchantTab(m)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${merchantTab === m ? 'text-white shadow-lg shadow-rose-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                style={merchantTab === m ? { backgroundColor: BKASH_PINK } : {}}>
                {m === 'all' ? (lang === 'en' ? 'All Merchants' : 'সব মার্চেন্ট') : m === 'Dhaka' ? (lang === 'en' ? 'Dhaka' : 'ঢাকা') : (lang === 'en' ? "Cox's Bazar" : 'কক্সবাজার')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset(null); }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-rose-400/30 dark:text-white" />
            <span className="text-slate-400 text-xs font-black">—</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset(null); }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-rose-400/30 dark:text-white" />
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-500 tabular-nums">{filtered.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const base = dateFrom ? new Date(dateFrom + 'T00:00:00') : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
              base.setDate(base.getDate() - 1);
              const p = `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}-${String(base.getDate()).padStart(2,'0')}`;
              setDateFrom(p); setDateTo(p); setActivePreset('prev');
            }}
            className={`flex-1 min-w-[60px] py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${activePreset === 'prev' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/25' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40 hover:bg-amber-500 hover:text-white hover:border-amber-500'}`}>
            <i className="fa-solid fa-chevron-left mr-1 text-[9px]"></i>Prev
          </button>
          {[
            { key: 'daily',   label: 'Daily',   fn: () => { const t = new Date().toISOString().split('T')[0]; setDateFrom(t); setDateTo(t); } },
            { key: 'weekly',  label: 'Weekly',  fn: () => { const e = new Date(); const s = new Date(); s.setDate(e.getDate()-7); setDateFrom(s.toISOString().split('T')[0]); setDateTo(e.toISOString().split('T')[0]); } },
            { key: 'monthly', label: 'Monthly', fn: () => { const e = new Date(); const s = new Date(); s.setDate(e.getDate()-30); setDateFrom(s.toISOString().split('T')[0]); setDateTo(e.toISOString().split('T')[0]); } },
          ].map(p => (
            <button key={p.key} onClick={() => { p.fn(); setActivePreset(p.key); }}
              className="flex-1 min-w-[60px] py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
              style={activePreset === p.key ? { backgroundColor: BKASH_PINK, color: '#fff', boxShadow: `0 4px 14px ${BKASH_PINK}40` } : { backgroundColor: 'rgb(241 245 249)', color: 'rgb(100 116 139)' }}>
              {p.label}
            </button>
          ))}
          <button onClick={() => { setDateFrom(''); setDateTo(''); setActivePreset(null); }}
            className="px-4 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">
            Clear
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FFF0F5' }}>
              <i className="fa-solid fa-mobile-screen-button text-3xl" style={{ color: BKASH_PINK }}></i>
            </div>
            <p className="font-black text-slate-600 dark:text-slate-300">{lang === 'en' ? 'No bKash records found' : 'কোনো বিকাশ রেকর্ড নেই'}</p>
            <p className="text-sm text-slate-400 mt-1">{lang === 'en' ? 'Add your first record to get started' : 'শুরু করতে প্রথম রেকর্ড যোগ করুন'}</p>
            {canEdit && (
              <button onClick={() => { resetForm(); setShowModal(true); }}
                className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest transition-all hover:opacity-90"
                style={{ backgroundColor: BKASH_PINK }}>
                <i className="fa-solid fa-plus"></i>{lang === 'en' ? 'Add First Record' : 'প্রথম রেকর্ড যোগ করুন'}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  {['Date', 'Merchant', 'Opening Bal.', 'Daily Rcvd.', 'Merch.→Bank', 'Charge 1.15%', 'Net to Bank', 'Closing Bal.', 'Notes', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap border-b border-slate-100 dark:border-slate-800">{h}</th>
                  ))}
                </tr>
                <tr className="bg-slate-900 dark:bg-black border-b-2 border-rose-600/60">
                  <td colSpan={2} className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest text-white" style={{ backgroundColor: BKASH_PINK }}>
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
              <tbody>
                {dateGroups.map((group, gi) => {
                  const isOdd = gi % 2 === 1;
                  const groupBg = isOdd
                    ? 'bg-blue-50/40 dark:bg-blue-950/10'
                    : 'bg-white dark:bg-slate-900';
                  const hasMultiple = group.rows.length > 1;
                  return (
                    <React.Fragment key={group.date}>
                      {group.rows.map((r, ri) => (
                        <tr key={r.id} className={`${groupBg} transition-colors hover:brightness-95 dark:hover:brightness-110`}>
                          <td className="px-4 py-3 font-bold text-xs tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-300">
                            {ri === 0 ? r.date : <span className="text-slate-300 dark:text-slate-600 select-none pl-2">↳</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${r.merchant === 'Dhaka' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'}`}>
                              <i className="fa-solid fa-shop text-[7px]"></i>
                              {r.merchant === 'Dhaka' ? 'Dhaka' : "Cox's Bazar"}
                            </span>
                          </td>
                          <td className="px-4 py-3 tabular-nums font-semibold text-slate-500 dark:text-slate-500">{fmt(r.openingBalance)}</td>
                          <td className="px-4 py-3 tabular-nums font-bold text-emerald-700 dark:text-emerald-400">{fmt(r.dailyReceived)}</td>
                          <td className="px-4 py-3 tabular-nums font-bold text-blue-700 dark:text-blue-400">{fmt(r.merchantToBank)}</td>
                          <td className="px-4 py-3 tabular-nums font-bold text-rose-600 dark:text-rose-400">{fmt(r.bkashCharge)}</td>
                          <td className="px-4 py-3 tabular-nums font-black text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-900/5">{fmt(r.netBankReceipt)}</td>
                          <td className={`px-4 py-3 tabular-nums font-bold ${r.closingBalance >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400'}`}>{fmt(r.closingBalance)}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{r.notes || '—'}</td>
                          <td className="px-4 py-3">
                            {canEdit && (
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleEdit(r)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors">
                                  <i className="fa-solid fa-pen text-[10px]"></i>
                                </button>
                                <button onClick={() => onDelete(r.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors">
                                  <i className="fa-solid fa-trash-can text-[10px]"></i>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {hasMultiple && (
                        <tr className="border-t border-b-2 border-slate-200 dark:border-slate-700" style={{ backgroundColor: isOdd ? 'rgba(59,130,246,0.07)' : 'rgba(0,0,0,0.03)' }}>
                          <td colSpan={2} className="px-4 py-2">
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                              <i className="fa-solid fa-equals text-[7px]"></i>
                              {group.date} Daily Total
                            </span>
                          </td>
                          <td colSpan={2} className="px-4 py-2 text-slate-300 dark:text-slate-600 text-xs">—</td>
                          <td className="px-4 py-2 font-black tabular-nums text-xs text-blue-600 dark:text-blue-400">{fmt(group.sub.m2b)}</td>
                          <td className="px-4 py-2 font-black tabular-nums text-xs text-rose-500">{fmt(group.sub.charge)}</td>
                          <td className="px-4 py-2 font-black tabular-nums text-xs text-violet-700 dark:text-violet-400 bg-violet-50/30 dark:bg-violet-900/5">{fmt(group.sub.net)}</td>
                          <td className={`px-4 py-2 font-black tabular-nums text-xs ${group.sub.closing >= 0 ? 'text-slate-600 dark:text-slate-400' : 'text-rose-500'}`}>{fmt(group.sub.closing)}</td>
                          <td colSpan={2} className="px-4 py-2"></td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-white dark:bg-slate-900 w-full ${editingId ? 'max-w-md' : 'max-w-lg'} rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200`}>

            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center"
              style={{ background: 'linear-gradient(135deg, rgba(226,19,110,0.08), transparent)' }}>
              <div>
                <h3 className="text-lg font-black">
                  {editingId ? (lang === 'en' ? 'Edit bKash Record' : 'বিকাশ রেকর্ড সম্পাদনা') : (lang === 'en' ? 'Daily Bank Transfer' : 'ডেইলি ব্যাংক ট্রান্সফার')}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: BKASH_PINK }}>
                  {editingId ? '1.15% charge auto-calculated · opening balance preserved' : 'Dhaka & Cox · 1.15% bKash charge · opening balance auto-carried'}
                </p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {editingId ? (
              /* ── EDIT MODE ── */
              <form onSubmit={handleSubmitEdit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Date</label>
                    <input type="date" value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Merchant</label>
                    <select value={editData.merchant} onChange={e => setEditData({ ...editData, merchant: e.target.value as 'Dhaka' | 'Cox' })} className={inputCls}>
                      <option value="Dhaka">Dhaka Merchant</option>
                      <option value="Cox">Cox's Bazar Merchant</option>
                    </select>
                  </div>
                </div>

                {/* Read-only opening info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Opening Balance</p>
                    <p className="font-black tabular-nums text-slate-600 dark:text-slate-300">{fmt(editData.openingBalance)}</p>
                  </div>
                  <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Daily Received</p>
                    <p className="font-black tabular-nums text-emerald-600">{fmt(editData.dailyReceived)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Merchant → Bank</label>
                  <input type="number" min="0" step="0.01"
                    value={editData.merchantToBank}
                    onChange={e => setEditData({ ...editData, merchantToBank: e.target.value })}
                    onWheel={e => e.currentTarget.blur()}
                    className={inputCls} placeholder="0.00" />
                </div>

                {editCalc.m2b > 0 && (
                  <div className="rounded-2xl p-4 space-y-2.5" style={{ backgroundColor: 'rgba(226,19,110,0.06)', border: '1px solid rgba(226,19,110,0.2)' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BKASH_PINK }}>
                      <i className="fa-solid fa-calculator mr-1.5"></i>Auto-Calculated
                    </p>
                    {[
                      { label: 'bKash Charge 1.15%', value: editCalc.charge, cls: 'text-rose-600 dark:text-rose-400' },
                      { label: 'Net to Bank', value: editCalc.net, cls: 'text-violet-700 dark:text-violet-400' },
                      { label: 'Closing Balance', value: editCalc.closing, cls: editCalc.closing >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 text-xs font-bold">{row.label}</span>
                        <span className={`font-black tabular-nums ${row.cls}`}>{fmt(row.value)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Notes</label>
                  <input type="text" value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })} className={inputCls} placeholder="Optional notes..." />
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
              /* ── ADD MODE: unified dual-merchant form ── */
              <form onSubmit={handleSubmitAdd} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

                {/* Date */}
                <div className="max-w-[190px]">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Date</label>
                  <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} className={inputCls} />
                </div>

                {/* Unified merchant → bank box */}
                <div className="rounded-2xl border-2 border-rose-100 dark:border-rose-900/30 overflow-hidden">
                  {/* Box header */}
                  <div className="px-4 py-3 flex items-center gap-2.5 border-b border-rose-100 dark:border-rose-900/30"
                    style={{ background: 'rgba(226,19,110,0.06)' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow flex-shrink-0" style={{ backgroundColor: BKASH_PINK }}>
                      <i className="fa-solid fa-building-columns text-xs"></i>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: BKASH_PINK }}>
                        {lang === 'en' ? 'Daily Merchant → Bank' : 'ডেইলি মার্চেন্ট → ব্যাংক'}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold">Opening balance auto-carried from previous record</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Dhaka input row */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-[130px] flex-shrink-0">
                        <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-shop text-white text-[7px]"></i>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest leading-none">Dhaka</p>
                          {dhakaOB !== 0 && <p className="text-[9px] text-slate-400 tabular-nums mt-0.5">OB: {fmt(dhakaOB)}</p>}
                        </div>
                      </div>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold pointer-events-none">৳</span>
                        <input type="number" min="0" step="0.01"
                          value={dhakaM2B}
                          onChange={e => setDhakaM2B(e.target.value)}
                          onWheel={e => e.currentTarget.blur()}
                          className="w-full bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-800/50 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-500 dark:text-white tabular-nums transition-all"
                          placeholder="0.00" />
                      </div>
                    </div>

                    {/* Cox input row */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-[130px] flex-shrink-0">
                        <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-shop text-white text-[7px]"></i>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest leading-none">Cox's Bazar</p>
                          {coxOB !== 0 && <p className="text-[9px] text-slate-400 tabular-nums mt-0.5">OB: {fmt(coxOB)}</p>}
                        </div>
                      </div>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold pointer-events-none">৳</span>
                        <input type="number" min="0" step="0.01"
                          value={coxM2B}
                          onChange={e => setCoxM2B(e.target.value)}
                          onWheel={e => e.currentTarget.blur()}
                          className="w-full bg-white dark:bg-slate-800 border-2 border-teal-200 dark:border-teal-800/50 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-500 dark:text-white tabular-nums transition-all"
                          placeholder="0.00" />
                      </div>
                    </div>

                    {/* Combined totals (visible when any amount entered) */}
                    {combined.total > 0 && (
                      <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 mt-2">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-sigma text-[9px] text-slate-400"></i>
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Daily Merchant → Bank</span>
                          </div>
                          <span className="font-black tabular-nums text-slate-800 dark:text-slate-100 text-base">{fmt(combined.total)}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/50" style={{ background: 'rgba(226,19,110,0.04)' }}>
                          <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest">bKash Charge 1.15%</span>
                          <span className="font-black tabular-nums text-rose-500">− {fmt(combined.charge)}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 bg-violet-50 dark:bg-violet-900/10">
                          <span className="text-[11px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">Net to Bank</span>
                          <span className="text-xl font-black tabular-nums text-violet-700 dark:text-violet-300">{fmt(combined.net)}</span>
                        </div>
                      </div>
                    )}

                    {/* Per-merchant balance preview */}
                    {(dhakaCalc.m2b > 0 || coxCalc.m2b > 0) && (
                      <div className="pt-1 space-y-1.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Closing Balance (after transfer)</p>
                        {dhakaCalc.m2b > 0 && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                            <span className="font-black text-blue-600 dark:text-blue-400">Dhaka</span>
                            <span className="text-slate-400">{fmt(dhakaOB)} → bank {fmt(dhakaCalc.m2b)} =</span>
                            <span className={`font-black ${dhakaCalc.closing >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>{fmt(dhakaCalc.closing)}</span>
                          </div>
                        )}
                        {coxCalc.m2b > 0 && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0"></span>
                            <span className="font-black text-teal-600 dark:text-teal-400">Cox</span>
                            <span className="text-slate-400">{fmt(coxOB)} → bank {fmt(coxCalc.m2b)} =</span>
                            <span className={`font-black ${coxCalc.closing >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>{fmt(coxCalc.closing)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                    {lang === 'en' ? 'Notes (optional)' : 'নোট (ঐচ্ছিক)'}
                  </label>
                  <input type="text" value={addNotes} onChange={e => setAddNotes(e.target.value)}
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
