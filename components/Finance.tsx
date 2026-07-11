
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction } from '../types';
import { Language, translations } from '../translations';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinanceProps {
  transactions: Transaction[];
  onAdd: (tx: Transaction) => void;
  onUpdate: (id: string, tx: Transaction) => void;
  onDelete: (id: string) => void;
  lang: Language;
  userRole?: string;
}

const Finance: React.FC<FinanceProps> = ({ transactions: initialTransactions, onAdd, onUpdate, onDelete, lang, userRole }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'trialBalance' | 'statement'>('ledger');
  const t = translations[lang];
  
  const [filters, setFilters] = useState({
    type: 'all',
    branch: '',
    category: '',
    period: 'monthly',
    from: '',
    to: ''
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    amount: '',
    type: 'Income' as 'Income' | 'Expense',
    branch: 'Dhaka'
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/finance/report?${query}`, {
        headers: { 'x-user-role': userRole || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters]);

  const handleReset = () => {
    const defaultFilters = {
      type: 'all',
      branch: '',
      category: '',
      period: 'monthly',
      from: '',
      to: ''
    };
    setFilters(defaultFilters);
    localStorage.removeItem('finance_filters');
  };

  const handleExport = (type: 'excel' | 'pdf') => {
    window.open(`/api/finance/export/${type}?role=${userRole || ''}`, '_blank');
  };

  const existingCategories = Array.from(new Set(initialTransactions.map(tx => tx.category)));
  const existingCounters = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Abdullahpur', 'Coxsbazar', 'Sonargaon'];

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setFormData({
      date: tx.date,
      description: tx.description,
      category: tx.category,
      amount: tx.amount.toString(),
      type: tx.type,
      branch: (tx as any).branch || 'Dhaka'
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(lang === 'en' ? 'Are you sure you want to delete this transaction?' : 'আপনি কি নিশ্চিত যে আপনি এই লেনদেনটি মুছতে চান?')) {
      onDelete(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const txData: Transaction = {
      id: editingId || `TX-${Date.now().toString().slice(-4)}`,
      date: formData.date,
      type: formData.type,
      category: formData.category || 'General',
      amount: parseFloat(formData.amount),
      description: formData.description,
      ...({ branch: formData.branch })
    } as any;
    
    if (editingId) {
      onUpdate(editingId, txData);
    } else {
      onAdd(txData);
    }
    
    closeModal();
    fetchReport();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ date: new Date().toISOString().split('T')[0], description: '', category: '', amount: '', type: 'Income', branch: 'Dhaka' });
  };

  const totals = reportData || { total_income: 0, total_expense: 0, net_profit: 0, chart_data: [] };

  // Trial Balance Logic
  const trialBalance = useMemo(() => {
    const categories: Record<string, { income: number, expense: number }> = {};
    (reportData?.transactions || []).forEach((tx: any) => {
      if (!categories[tx.category]) categories[tx.category] = { income: 0, expense: 0 };
      if (tx.type === 'Income') categories[tx.category].income += tx.amount;
      else categories[tx.category].expense += tx.amount;
    });
    return Object.entries(categories).map(([name, data]) => ({ name, ...data }));
  }, [reportData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t.accounting}</h2>
          <p className="text-sm text-slate-500">Advanced Financial Intelligence & Reporting</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button 
             onClick={() => handleExport('excel')}
             className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all font-bold text-xs uppercase tracking-widest"
           >
              <i className="fa-solid fa-file-excel mr-2"></i> Excel
           </button>
           <button 
             onClick={() => handleExport('pdf')}
             className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all font-bold text-xs uppercase tracking-widest"
           >
              <i className="fa-solid fa-file-pdf mr-2"></i> PDF
           </button>
           <button 
             onClick={() => { closeModal(); setShowModal(true); }}
             className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg font-bold"
           >
              <i className="fa-solid fa-plus mr-2"></i> {t.newTransaction}
           </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        <button 
          onClick={() => setActiveSubTab('ledger')}
          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeSubTab === 'ledger' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Ledger
        </button>
        <button 
          onClick={() => setActiveSubTab('trialBalance')}
          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeSubTab === 'trialBalance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Trial Balance
        </button>
        <button 
          onClick={() => setActiveSubTab('statement')}
          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeSubTab === 'statement' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Financial Statement
        </button>
      </div>

      {activeSubTab === 'ledger' && (
        <>
          {/* Advanced Filters */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Type</label>
                <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs dark:text-white">
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Counter</label>
                <select value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs dark:text-white">
                  <option value="">All Counters</option>
                  {existingCounters.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Period</label>
                <select value={filters.period} onChange={e => setFilters({...filters, period: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs dark:text-white">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              {filters.period === 'custom' && (
                <>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">From</label>
                    <input type="date" value={filters.from} onChange={e => setFilters({...filters, from: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">To</label>
                    <input type="date" value={filters.to} onChange={e => setFilters({...filters, to: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs dark:text-white" />
                  </div>
                </>
              )}
              <div className="flex items-end">
                <button onClick={handleReset} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
                  <i className="fa-solid fa-rotate-left mr-2"></i> Reset
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest">{t.totalIncome}</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">৳ {totals.total_income.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest">{t.totalExpense}</p>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">৳ {totals.total_expense.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest">{t.availableBalance}</p>
              <p className={`text-3xl font-black mt-1 ${totals.net_profit >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-500'}`}>
                ৳ {totals.net_profit.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-[400px]">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={totals.chart_data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-[400px]">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6">Income vs Expense</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totals.chart_data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Transaction Details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Counter</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(reportData?.transactions || []).map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{tx.date}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold">{tx.description}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ref: {tx.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{tx.branch || 'N/A'}</td>
                      <td className={`px-6 py-4 font-black ${tx.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {tx.type === 'Income' ? '+' : '-'} ৳ {tx.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => handleEdit(tx)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"><i className="fa-solid fa-pen-to-square"></i></button>
                           <button onClick={() => handleDelete(tx.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"><i className="fa-solid fa-trash-can"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeSubTab === 'trialBalance' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-black uppercase tracking-tighter italic">Trial Balance Summary</h3>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">As of {new Date().toLocaleDateString()}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Account Head / Category</th>
                  <th className="px-8 py-5 text-right">Debit (Expense)</th>
                  <th className="px-8 py-5 text-right">Credit (Income)</th>
                  <th className="px-8 py-5 text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {trialBalance.map(row => (
                  <tr key={row.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-300">{row.name}</td>
                    <td className="px-8 py-5 text-right text-rose-500 font-bold">৳ {row.expense.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right text-emerald-500 font-bold">৳ {row.income.toLocaleString()}</td>
                    <td className={`px-8 py-5 text-right font-black ${row.income >= row.expense ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ৳ {(row.income - row.expense).toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-900 text-white">
                  <td className="px-8 py-6 font-black uppercase italic">Total Balance</td>
                  <td className="px-8 py-6 text-right font-black">৳ {totals.total_expense.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right font-black">৳ {totals.total_income.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right font-black">৳ {totals.net_profit.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'statement' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Income Statement</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profit & Loss Analysis</p>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-500 uppercase">Gross Revenue</span>
                <span className="text-lg font-black text-emerald-600">৳ {totals.total_income.toLocaleString()}</span>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operating Expenses</p>
                {trialBalance.filter(r => r.expense > 0).map(r => (
                  <div key={r.name} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{r.name}</span>
                    <span className="font-bold text-rose-500">- ৳ {r.expense.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t-4 border-double border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-lg font-black uppercase italic">Net Profit / Loss</span>
                <span className={`text-2xl font-black ${totals.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ৳ {totals.net_profit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="text-center space-y-2 relative z-10">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Financial Position</h3>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Liquidity & Asset Summary</p>
            </div>
            <div className="space-y-6 relative z-10">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Current Assets</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cash at Bank / Counters</span>
                  <span className="text-xl font-black text-emerald-400">৳ {totals.net_profit.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4 opacity-50">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Fixed Assets (Estimated)</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fleet Value (Coaches)</span>
                  <span className="text-xl font-black">৳ 45,000,000</span>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <span className="text-lg font-black uppercase italic">Total Equity</span>
                <span className="text-2xl font-black text-blue-400">৳ {(totals.net_profit + 45000000).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-black uppercase tracking-tight">{editingId ? 'Edit Ledger Entry' : 'New Ledger Entry'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-widest">Date <span className="text-rose-500">*</span></label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-widest">Description <span className="text-rose-500">*</span></label>
                <input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" placeholder="e.g. Fuel Refill D-001" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-widest">Entry Type <span className="text-rose-500">*</span></label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as 'Income' | 'Expense'})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 dark:text-white">
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-widest">Amount (৳) <span className="text-rose-500">*</span></label>
                  <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 dark:text-white" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-widest">Category <span className="text-rose-500">*</span></label>
                  <input required list="finance-categories" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 dark:text-white" />
                  <datalist id="finance-categories">
                    {existingCategories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-widest">Branch <span className="text-rose-500">*</span></label>
                  <select value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 dark:text-white">
                    {existingCounters.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg transition-all mt-4 uppercase tracking-widest">
                {editingId ? 'UPDATE TRANSACTION' : 'POST TRANSACTION'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
