
import React, { useState } from 'react';
import { Transaction } from '../types';
import { Language, translations } from '../translations';

interface FinanceProps {
  transactions: Transaction[];
  onAdd: (tx: Transaction) => void;
  onUpdate: (id: string, tx: Transaction) => void;
  onDelete: (id: string) => void;
  lang: Language;
}

const Finance: React.FC<FinanceProps> = ({ transactions, onAdd, onUpdate, onDelete, lang }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const t = translations[lang];
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    amount: '',
    type: 'Income' as 'Income' | 'Expense'
  });

  const existingCategories = Array.from(new Set(transactions.map(tx => tx.category)));

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setFormData({
      date: tx.date,
      description: tx.description,
      category: tx.category,
      amount: tx.amount.toString(),
      type: tx.type
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
      description: formData.description
    };
    
    if (editingId) {
      onUpdate(editingId, txData);
    } else {
      onAdd(txData);
    }
    
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ date: new Date().toISOString().split('T')[0], description: '', category: '', amount: '', type: 'Income' });
  };

  const totals = transactions.reduce((acc, tx) => {
    if (tx.type === 'Income') acc.income += tx.amount;
    else acc.expense += tx.amount;
    return acc;
  }, { income: 0, expense: 0 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t.accounting}</h2>
        <div className="flex gap-2">
           <button 
             onClick={() => { closeModal(); setShowModal(true); }}
             className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg font-bold"
           >
              <i className="fa-solid fa-plus mr-2"></i> {t.newTransaction}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest">{t.totalIncome}</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">৳ {totals.income.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest">{t.totalExpense}</p>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">৳ {totals.expense.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest">{t.availableBalance}</p>
          <p className={`text-3xl font-black mt-1 ${(totals.income - totals.expense) >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-500'}`}>
            ৳ {(totals.income - totals.expense).toLocaleString()}
          </p>
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
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((tx) => (
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
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-widest">Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-widest">Description</label>
                <input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" placeholder="e.g. Fuel Refill D-001" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-widest">Entry Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as 'Income' | 'Expense'})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 dark:text-white">
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-widest">Amount (৳)</label>
                  <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 dark:text-white" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-widest">Category</label>
                <input required list="finance-categories" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 dark:text-white" />
                <datalist id="finance-categories">
                  {existingCategories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
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
