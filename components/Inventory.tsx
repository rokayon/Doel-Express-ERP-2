import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { Language, translations } from '../translations';

interface InventoryProps {
  inventory: InventoryItem[];
  onAdd: (item: InventoryItem) => void;
  onUpdate: (id: string, item: InventoryItem) => void;
  onDelete: (id: string) => void;
  lang: Language;
}

interface TransactionRecord {
  id: string;
  date: string;
  itemName: string;
  partNo: string;
  category: string;
  type: 'received' | 'issued';
  qty: number;
  unit: string;
  remarks?: string;
  previousBalance: number;
  newBalance: number;
}

const Inventory: React.FC<InventoryProps> = ({ inventory, onAdd, onUpdate, onDelete, lang }) => {
  const t = translations[lang];
  const today = new Date().toISOString().split('T')[0];

  // Dual-section form state
  const [receivedForm, setReceivedForm] = useState({ date: today, itemName: '', partNo: '', category: '', qty: '', unit: 'pcs', remarks: '' });
  const [issuedForm, setIssuedForm] = useState({ date: today, itemName: '', busNo: '', qty: '', unit: 'pcs', remarks: '' });
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [newItemInput, setNewItemInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', stock: '', minStock: '', unit: 'pcs', lastUpdated: today });

  const existingCategories = Array.from(new Set(inventory.map(item => item.category)));
  const itemNames = Array.from(new Set(inventory.map(item => item.name)));

  // Build transaction history from inventory (simplified - uses lastUpdated)
  const transactions: TransactionRecord[] = useMemo(() => {
    return inventory.map((item, idx) => ({
      id: item.id,
      date: item.lastUpdated,
      itemName: item.name,
      partNo: item.id,
      category: item.category,
      type: 'received' as const,
      qty: item.stock,
      unit: item.unit,
      remarks: undefined,
      previousBalance: 0,
      newBalance: item.stock,
    })).sort((a, b) => b.date.localeCompare(a.date));
  }, [inventory]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterCategory && t.category !== filterCategory) return false;
      if (searchQuery && !t.itemName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filterCategory, searchQuery]);

  const handleAddReceived = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivedForm.itemName || !receivedForm.qty) return;

    const existingItem = inventory.find(i => i.name.toLowerCase() === receivedForm.itemName.toLowerCase());
    const newStock = (existingItem?.stock || 0) + parseInt(receivedForm.qty);

    const itemData: InventoryItem = {
      id: existingItem?.id || `INV-${Date.now().toString().slice(-4)}`,
      name: receivedForm.itemName,
      category: receivedForm.category || 'Uncategorized',
      stock: newStock,
      minStock: existingItem?.minStock || 0,
      unit: receivedForm.unit,
      lastUpdated: receivedForm.date,
    };

    if (existingItem) {
      onUpdate(existingItem.id, itemData);
    } else {
      onAdd(itemData);
    }

    setReceivedForm({ date: today, itemName: '', partNo: '', category: '', qty: '', unit: 'pcs', remarks: '' });
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setIsAddingNewItem(false);
    setNewItemInput('');
  };

  const handleAddIssued = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuedForm.itemName || !issuedForm.qty) return;

    const existingItem = inventory.find(i => i.name.toLowerCase() === issuedForm.itemName.toLowerCase());
    if (!existingItem) return;

    const newStock = Math.max(0, existingItem.stock - parseInt(issuedForm.qty));

    const itemData: InventoryItem = {
      ...existingItem,
      stock: newStock,
      lastUpdated: issuedForm.date,
    };

    onUpdate(existingItem.id, itemData);
    setIssuedForm({ date: today, itemName: '', busNo: '', qty: '', unit: 'pcs', remarks: '' });
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      category: item.category,
      stock: String(item.stock),
      minStock: String(item.minStock),
      unit: item.unit,
      lastUpdated: item.lastUpdated,
    });
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onUpdate(editingItem.id, {
      ...editingItem,
      name: editForm.name,
      category: editForm.category || 'Uncategorized',
      stock: parseInt(editForm.stock) || 0,
      minStock: parseInt(editForm.minStock) || 0,
      unit: editForm.unit,
      lastUpdated: editForm.lastUpdated,
    });
    setEditingItem(null);
  };

  const fmt = (n: number) => n.toLocaleString('en-IN');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Inventory Stock Register</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Daily received · issued · balance tracking</p>
        </div>
      </div>

      {/* Dual-Section Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECEIVED SECTION */}
        <form onSubmit={handleAddReceived} className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <i className="fa-solid fa-arrow-down text-sm"></i>
            </div>
            <h3 className="text-lg font-black text-emerald-700 dark:text-emerald-400">Stock Received</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={receivedForm.date} onChange={e => setReceivedForm({ ...receivedForm, date: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/30 dark:text-white" />

            {isAddingNewItem ? (
              <div className="col-span-2 flex gap-1">
                <input type="text" autoFocus value={newItemInput}
                  onChange={e => { setNewItemInput(e.target.value); setReceivedForm({ ...receivedForm, itemName: e.target.value }); }}
                  placeholder="Type item name"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/30 dark:text-white" />
                <button type="button" onClick={() => { setIsAddingNewItem(false); setNewItemInput(''); setReceivedForm({ ...receivedForm, itemName: '' }); }}
                  className="px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 text-xs">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ) : (
              <select value={receivedForm.itemName}
                onChange={e => {
                  if (e.target.value === '__new__') { setIsAddingNewItem(true); setNewItemInput(''); setReceivedForm({ ...receivedForm, itemName: '' }); }
                  else setReceivedForm({ ...receivedForm, itemName: e.target.value });
                }}
                className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/30 dark:text-white">
                <option value="">Item Name</option>
                {itemNames.map(name => <option key={name} value={name}>{name}</option>)}
                <option value="__new__">+ New Item</option>
              </select>
            )}

            <input type="text" value={receivedForm.partNo} onChange={e => setReceivedForm({ ...receivedForm, partNo: e.target.value })} placeholder="Part No" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/30 dark:text-white" />

            {isAddingNewCategory ? (
              <div className="flex gap-1">
                <input type="text" autoFocus value={newCategoryInput}
                  onChange={e => { setNewCategoryInput(e.target.value); setReceivedForm({ ...receivedForm, category: e.target.value }); }}
                  placeholder="Type category name"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/30 dark:text-white" />
                <button type="button" onClick={() => { setIsAddingNewCategory(false); setNewCategoryInput(''); setReceivedForm({ ...receivedForm, category: '' }); }}
                  className="px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 text-xs">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ) : (
              <select value={receivedForm.category}
                onChange={e => {
                  if (e.target.value === '__new__') { setIsAddingNewCategory(true); setNewCategoryInput(''); setReceivedForm({ ...receivedForm, category: '' }); }
                  else setReceivedForm({ ...receivedForm, category: e.target.value });
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/30 dark:text-white">
                <option value="">Category</option>
                {existingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                <option value="__new__">+ New Category</option>
              </select>
            )}

            <div className="col-span-2 flex gap-2">
              <input type="number" min="0" value={receivedForm.qty} onChange={e => setReceivedForm({ ...receivedForm, qty: e.target.value })} placeholder="Qty" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/30 dark:text-white" />
              <select value={receivedForm.unit} onChange={e => setReceivedForm({ ...receivedForm, unit: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/30 dark:text-white">
                <option value="pcs">Pcs</option>
                <option value="box">Box</option>
                <option value="kg">Kg</option>
                <option value="ltr">Ltr</option>
              </select>
            </div>

            <input type="text" value={receivedForm.remarks} onChange={e => setReceivedForm({ ...receivedForm, remarks: e.target.value })} placeholder="Remarks (optional)" className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/30 dark:text-white" />
          </div>

          <button type="submit" className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest transition-colors">
            + Add Received
          </button>
        </form>

        {/* ISSUED SECTION */}
        <form onSubmit={handleAddIssued} className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/30 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
              <i className="fa-solid fa-arrow-up text-sm"></i>
            </div>
            <h3 className="text-lg font-black text-rose-700 dark:text-rose-400">Stock Issued</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={issuedForm.date} onChange={e => setIssuedForm({ ...issuedForm, date: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-400/30 dark:text-white" />

            <select value={issuedForm.itemName} onChange={e => setIssuedForm({ ...issuedForm, itemName: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-400/30 dark:text-white">
              <option value="">Select Item / Description</option>
              {itemNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>

            <input type="text" value={issuedForm.busNo} onChange={e => setIssuedForm({ ...issuedForm, busNo: e.target.value })} placeholder="Bus No" className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-400/30 dark:text-white" />

            <div className="col-span-2 flex gap-2">
              <input type="number" min="0" value={issuedForm.qty} onChange={e => setIssuedForm({ ...issuedForm, qty: e.target.value })} placeholder="Qty" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-400/30 dark:text-white" />
              <select value={issuedForm.unit} onChange={e => setIssuedForm({ ...issuedForm, unit: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-400/30 dark:text-white">
                <option value="pcs">Pcs</option>
                <option value="box">Box</option>
                <option value="kg">Kg</option>
                <option value="ltr">Ltr</option>
              </select>
            </div>

            <input type="text" value={issuedForm.remarks} onChange={e => setIssuedForm({ ...issuedForm, remarks: e.target.value })} placeholder="Remarks (optional)" className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-400/30 dark:text-white" />
          </div>

          <button type="submit" className="w-full py-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-widest transition-colors">
            + Add Issued
          </button>
        </form>
      </div>

      <datalist id="itemList">
        {itemNames.map(name => <option key={name} value={name} />)}
      </datalist>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search item name..." className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-400/30 dark:text-white" />
        <select value={filterCategory || ''} onChange={e => setFilterCategory(e.target.value || null)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-400/30 dark:text-white">
          <option value="">All Categories</option>
          {existingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {inventory.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-black text-slate-600 dark:text-slate-300">No inventory items yet</p>
            <p className="text-sm text-slate-400 mt-1">Add received or issued stock above to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  {['Date', 'Item', 'Category', 'Received', 'Issued', 'Balance', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap border-b border-slate-100 dark:border-slate-800">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{item.lastUpdated}</td>
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{item.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">{item.category}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{fmt(item.stock)}</td>
                    <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">—</td>
                    <td className="px-4 py-3 font-black text-slate-800 dark:text-slate-100 bg-slate-100/50 dark:bg-slate-800/50">{fmt(item.stock)} {item.unit}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(item)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors">
                          <i className="fa-solid fa-pen text-[10px]"></i>
                        </button>
                        <button onClick={() => onDelete(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors">
                          <i className="fa-solid fa-trash-can text-[10px]"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black">Edit Item</h3>
              <button onClick={() => setEditingItem(null)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleUpdateItem} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Item Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400/30 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Category</label>
                <input type="text" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400/30 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Stock</label>
                  <input type="number" min="0" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400/30 dark:text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Unit</label>
                  <select value={editForm.unit} onChange={e => setEditForm({ ...editForm, unit: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400/30 dark:text-white">
                    <option value="pcs">Pcs</option>
                    <option value="box">Box</option>
                    <option value="kg">Kg</option>
                    <option value="ltr">Ltr</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Min Stock</label>
                <input type="number" min="0" value={editForm.minStock} onChange={e => setEditForm({ ...editForm, minStock: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400/30 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Last Updated</label>
                <input type="date" value={editForm.lastUpdated} onChange={e => setEditForm({ ...editForm, lastUpdated: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400/30 dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest transition-colors">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
