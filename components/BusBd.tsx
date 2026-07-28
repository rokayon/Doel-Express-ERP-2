
import React, { useState, useMemo, useCallback } from 'react';
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
const COMMISSION_PER_TICKET = 100;
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'];

const BusBd: React.FC<BusBdProps> = ({ records, onAdd, onUpdate, onDelete, lang, userRole, canWrite }) => {
  const today = new Date().toISOString().split('T')[0];
  const canEdit = canWrite ?? WRITE_ROLES.includes(userRole || '');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Add mode
  const [addDate, setAddDate] = useState(today);
  const [openingBalanceOverride, setOpeningBalanceOverride] = useState<string | null>(null);
  const [noOfTickets, setNoOfTickets] = useState('');
  const [ticketAmount, setTicketAmount] = useState('');
  const [addNotes, setAddNotes] = useState('');

  // Edit mode
  const [editData, setEditData] = useState({
    date: today,
    openingAmount: 0,
    noOfTickets: '',
    ticketAmount: '',
    notes: '',
  });

  // ── Auto-carry: always the truly latest closing, regardless of selected date ──
  const getOpeningBalance = useCallback(
    (excludeId?: string): number => {
      const prev = records
        .filter(r => r.id !== excludeId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
      return prev.length > 0 ? prev[0].closingAmount : 0;
    },
    [records]
  );

  const autoOpeningBalance = useMemo(() => getOpeningBalance(), [getOpeningBalance]);
  const openingBalanceInput = openingBalanceOverride !== null ? openingBalanceOverride : String(autoOpeningBalance);

  const addCalc = useMemo(() => {
    const opening = parseFloat(openingBalanceInput) || 0;
    const tickets = parseInt(noOfTickets) || 0;
    const amount = parseFloat(ticketAmount) || 0;
    const commission = parseFloat((tickets * COMMISSION_PER_TICKET).toFixed(2));
    const doelWithdraw = parseFloat((amount - commission).toFixed(2));
    const closing = parseFloat((opening + doelWithdraw).toFixed(2));
    return { opening, tickets, amount, commission, doelWithdraw, closing };
  }, [openingBalanceInput, noOfTickets, ticketAmount]);

  const editCalc = useMemo(() => {
    const tickets = parseInt(editData.noOfTickets) || 0;
    const amount = parseFloat(editData.ticketAmount) || 0;
    const commission = parseFloat((tickets * COMMISSION_PER_TICKET).toFixed(2));
    const doelWithdraw = parseFloat((amount - commission).toFixed(2));
    const closing = parseFloat((editData.openingAmount + doelWithdraw).toFixed(2));
    return { tickets, amount, commission, doelWithdraw, closing };
  }, [editData.noOfTickets, editData.ticketAmount, editData.openingAmount]);

  const filtered = useMemo(() => {
    return records
      .filter(r => {
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo && r.date > dateTo) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [records, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const sums = filtered.reduce((acc, r) => ({
      openingAmount: acc.openingAmount + r.openingAmount,
      noOfTickets: acc.noOfTickets + r.noOfTickets,
      ticketAmount: acc.ticketAmount + r.ticketAmount,
      commission: acc.commission + r.commission,
      doelWithdrawAmount: acc.doelWithdrawAmount + r.doelWithdrawAmount,
      closingAmount: acc.closingAmount + r.closingAmount,
    }), { openingAmount: 0, noOfTickets: 0, ticketAmount: 0, commission: 0, doelWithdrawAmount: 0, closingAmount: 0 });

    // Closing = latest date's closing, not a sum across all dates
    const latestDate = filtered[0]?.date;
    const latestClosing = latestDate
      ? filtered.filter(r => r.date === latestDate).reduce((s, r) => s + r.closingAmount, 0)
      : 0;

    return { ...sums, closingAmount: latestClosing };
  }, [filtered]);

  const resetForm = () => {
    setOpeningBalanceOverride(null);
    setNoOfTickets(''); setTicketAmount(''); setAddDate(today); setAddNotes('');
    setEditData({ date: today, openingAmount: 0, noOfTickets: '', ticketAmount: '', notes: '' });
    setEditingId(null);
  };

  const handleEdit = (r: BusBdRecord) => {
    setEditData({
      date: r.date,
      openingAmount: r.openingAmount,
      noOfTickets: String(r.noOfTickets),
      ticketAmount: String(r.ticketAmount),
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
      openingAmount: editData.openingAmount,
      noOfTickets: editCalc.tickets,
      ticketAmount: editCalc.amount,
      commission: editCalc.commission,
      doelWithdrawAmount: editCalc.doelWithdraw,
      closingAmount: editCalc.closing,
      notes: editData.notes.trim() || undefined,
    });
    setShowModal(false);
    resetForm();
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: 'BBD-' + Date.now().toString().slice(-8),
      date: addDate,
      openingAmount: addCalc.opening,
      noOfTickets: addCalc.tickets,
      ticketAmount: addCalc.amount,
      commission: addCalc.commission,
      doelWithdrawAmount: addCalc.doelWithdraw,
      closingAmount: addCalc.closing,
      notes: addNotes.trim() || undefined,
    });
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
              <span style={{ color: BUSBD_GREEN }}>Bus BD</span> Ticket Commission Tracker
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {lang === 'en' ? 'Daily ticket sales · ৳100/ticket commission · opening balance auto-carried' : 'ডেইলি টিকেট বিক্রয় · ৳১০০/টিকেট কমিশন · ওপেনিং ব্যালেন্স অটো-ক্যারিড'}
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: lang === 'en' ? 'No. of Tickets' : 'টিকেট সংখ্যা', value: totals.noOfTickets, icon: 'fa-ticket', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30', isCount: true },
            { label: lang === 'en' ? 'Ticket Amount' : 'টিকেট পরিমাণ', value: totals.ticketAmount, icon: 'fa-money-bill-trend-up', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30' },
            { label: lang === 'en' ? 'Bus BD Commission' : 'বাস বিডি কমিশন', value: totals.commission, icon: 'fa-percent', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30' },
            { label: lang === 'en' ? 'Doel Withdraw Amount' : 'দোয়েল উইথড্র পরিমাণ', value: totals.doelWithdrawAmount, icon: 'fa-circle-check', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-900/30' },
            { label: lang === 'en' ? 'Closing Balance' : 'ক্লোজিং ব্যালেন্স', value: totals.closingAmount, icon: 'fa-scale-balanced', color: totals.closingAmount >= 0 ? 'text-slate-600 dark:text-slate-400' : 'text-rose-600 dark:text-rose-400', bg: totals.closingAmount >= 0 ? 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border`}>
              <div className="flex items-center gap-2 mb-2">
                <i className={`fa-solid ${stat.icon} ${stat.color} text-sm`}></i>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{stat.label}</p>
              </div>
              <p className={`text-xl font-black tabular-nums ${stat.color}`}>{stat.isCount ? stat.value.toLocaleString('en-IN') : fmt(stat.value)}</p>
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const base = dateFrom ? new Date(dateFrom + 'T00:00:00') : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
              base.setDate(base.getDate() - 1);
              const prev = `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}-${String(base.getDate()).padStart(2,'0')}`;
              setDateFrom(prev); setDateTo(prev); setActivePreset('prev');
            }}
            className={`flex-1 min-w-[60px] py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${activePreset === 'prev' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/25' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40 hover:bg-amber-500 hover:text-white hover:border-amber-500'}`}>
            <i className="fa-solid fa-chevron-left mr-1 text-[9px]"></i>Prev
          </button>
          {[
            { key: 'daily', label: 'Daily', fn: () => { const t = new Date().toISOString().split('T')[0]; setDateFrom(t); setDateTo(t); } },
            { key: 'weekly', label: 'Weekly', fn: () => { const e = new Date(); const s = new Date(); s.setDate(e.getDate()-7); setDateFrom(s.toISOString().split('T')[0]); setDateTo(e.toISOString().split('T')[0]); } },
            { key: 'monthly', label: 'Monthly', fn: () => { const e = new Date(); const s = new Date(); s.setDate(e.getDate()-30); setDateFrom(s.toISOString().split('T')[0]); setDateTo(e.toISOString().split('T')[0]); } },
          ].map(p => (
            <button key={p.key} onClick={() => { p.fn(); setActivePreset(p.key); }}
              className="flex-1 min-w-[60px] py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
              style={activePreset === p.key ? { backgroundColor: BUSBD_GREEN, color: '#fff', boxShadow: `0 4px 14px ${BUSBD_GREEN}40` } : { backgroundColor: 'rgb(241 245 249)', color: 'rgb(100 116 139)' }}>
              {p.label}
            </button>
          ))}
          <button onClick={() => { setDateFrom(''); setDateTo(''); setActivePreset(null); }}
            className="px-4 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">
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
                <tr style={{ backgroundColor: BUSBD_GREEN }}>
                  {[
                    lang === 'en' ? 'Date' : 'তারিখ',
                    lang === 'en' ? 'Opening' : 'ওপেনিং',
                    lang === 'en' ? 'No. of Ticket' : 'টিকেট সংখ্যা',
                    lang === 'en' ? 'Ticket Amount' : 'টিকেট পরিমাণ',
                    lang === 'en' ? 'Commission' : 'কমিশন',
                    lang === 'en' ? 'Doel Withdraw' : 'দোয়েল উইথড্র',
                    lang === 'en' ? 'Closing' : 'ক্লোজিং',
                    lang === 'en' ? 'Notes' : 'নোট',
                    lang === 'en' ? 'Actions' : 'অ্যাকশন',
                  ].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-white/90 uppercase tracking-widest text-left whitespace-nowrap">{h}</th>
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
                  <td className="px-4 py-3 font-black tabular-nums text-white">{fmt(totals.openingAmount)}</td>
                  <td className="px-4 py-3 font-black tabular-nums text-blue-300">{totals.noOfTickets.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 font-black tabular-nums text-emerald-400">{fmt(totals.ticketAmount)}</td>
                  <td className="px-4 py-3 font-black tabular-nums text-rose-400">{fmt(totals.commission)}</td>
                  <td className="px-4 py-3 font-black tabular-nums text-violet-400 bg-violet-500/10">{fmt(totals.doelWithdrawAmount)}</td>
                  <td className="px-4 py-3 font-black tabular-nums text-white">{fmt(totals.closingAmount)}</td>
                  <td colSpan={2} className="px-4 py-3 text-slate-600">—</td>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-xs tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-300">{r.date}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-slate-500 dark:text-slate-500">{fmt(r.openingAmount)}</td>
                    <td className="px-4 py-3 tabular-nums font-bold text-blue-700 dark:text-blue-400">{r.noOfTickets.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 tabular-nums font-bold text-emerald-700 dark:text-emerald-400">{fmt(r.ticketAmount)}</td>
                    <td className="px-4 py-3 tabular-nums font-bold text-rose-600 dark:text-rose-400">{fmt(r.commission)}</td>
                    <td className="px-4 py-3 tabular-nums font-black text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-900/5">{fmt(r.doelWithdrawAmount)}</td>
                    <td className={`px-4 py-3 tabular-nums font-bold ${r.closingAmount >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400'}`}>{fmt(r.closingAmount)}</td>
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
                    : (lang === 'en' ? 'Add Daily Ticket Record' : 'নতুন টিকেট রেকর্ড')}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: BUSBD_GREEN }}>
                  {editingId ? '৳100/ticket commission auto-calculated' : 'Opening auto-carried · ৳100/ticket commission'}
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
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Date</label>
                  <input type="date" value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })} className={inputCls} />
                </div>

                <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Opening Balance</p>
                  <p className="font-black tabular-nums text-slate-600 dark:text-slate-300">{fmt(editData.openingAmount)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">No. of Ticket</label>
                    <input type="number" min="0" value={editData.noOfTickets} onChange={e => setEditData({ ...editData, noOfTickets: e.target.value })} onWheel={e => e.currentTarget.blur()} className={inputCls} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Ticket Amount</label>
                    <input type="number" min="0" step="0.01" value={editData.ticketAmount} onChange={e => setEditData({ ...editData, ticketAmount: e.target.value })} onWheel={e => e.currentTarget.blur()} className={inputCls} placeholder="0.00" />
                  </div>
                </div>

                {editCalc.amount > 0 && (
                  <div className="rounded-2xl p-4 space-y-2.5" style={{ backgroundColor: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BUSBD_GREEN }}>
                      <i className="fa-solid fa-calculator mr-1.5"></i>Auto-Calculated
                    </p>
                    {[
                      { label: 'Bus BD Commission (৳100/ticket)', value: editCalc.commission, cls: 'text-rose-600 dark:text-rose-400' },
                      { label: 'Doel Withdraw Amount', value: editCalc.doelWithdraw, cls: 'text-violet-700 dark:text-violet-400' },
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
                    style={{ backgroundColor: BUSBD_GREEN }}>
                    {lang === 'en' ? 'Update' : 'আপডেট'}
                  </button>
                </div>
              </form>
            ) : (
              /* ── ADD MODE ── */
              <form onSubmit={handleSubmitAdd} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Date</label>
                  <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} className={inputCls} />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                    <i className="fa-solid fa-arrow-rotate-left mr-1"></i>Opening (auto-carried, editable)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold pointer-events-none">৳</span>
                    <input type="number" step="0.01"
                      value={openingBalanceInput}
                      onChange={e => setOpeningBalanceOverride(e.target.value)}
                      onWheel={e => e.currentTarget.blur()}
                      className="w-full bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-800/50 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 dark:text-white tabular-nums transition-all"
                      placeholder="0" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">No. of Ticket</label>
                  <input type="number" min="0" value={noOfTickets} onChange={e => setNoOfTickets(e.target.value)} onWheel={e => e.currentTarget.blur()} className={inputCls} placeholder="0" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Total Amount of Ticket</label>
                  <input type="number" min="0" step="0.01" value={ticketAmount} onChange={e => setTicketAmount(e.target.value)} onWheel={e => e.currentTarget.blur()} className={inputCls} placeholder="0.00" />
                </div>

                {addCalc.amount > 0 && (
                  <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700/50" style={{ background: 'rgba(22,163,74,0.04)' }}>
                      <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest">Bus BD Commission (৳100/ticket)</span>
                      <span className="font-black tabular-nums text-rose-500">− {fmt(addCalc.commission)}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 bg-violet-50 dark:bg-violet-900/10">
                      <span className="text-[11px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">Doel Withdraw Amount</span>
                      <span className="text-xl font-black tabular-nums text-violet-700 dark:text-violet-300">{fmt(addCalc.doelWithdraw)}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 border-t border-slate-100 dark:border-slate-700/50">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Closing Balance</span>
                      <span className={`font-black tabular-nums ${addCalc.closing >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-500'}`}>{fmt(addCalc.closing)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Remarks (optional)</label>
                  <input type="text" value={addNotes} onChange={e => setAddNotes(e.target.value)} className={inputCls} placeholder="Optional notes..." />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest">
                    {lang === 'en' ? 'Cancel' : 'বাতিল'}
                  </button>
                  <button type="submit"
                    className="flex-1 py-3 rounded-xl text-white font-black text-sm uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
                    style={{ backgroundColor: BUSBD_GREEN }}>
                    {lang === 'en' ? 'Save Record' : 'সংরক্ষণ'}
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

export default BusBd;
