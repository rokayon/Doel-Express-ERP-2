import React, { useState, useMemo } from 'react';
import { InventoryItem, InventoryIssue, InventoryReceipt, PartsRequisition, Coach } from '../types';
import { Language, translations } from '../translations';
import PartsRequisitionSlip from './PartsRequisition';

interface InventoryProps {
  inventory: InventoryItem[];
  onAdd: (item: InventoryItem) => void;
  onUpdate: (id: string, item: InventoryItem) => void;
  onDelete: (id: string) => void;
  issues: InventoryIssue[];
  onAddIssue: (issue: InventoryIssue) => void;
  onDeleteIssue: (id: string) => void;
  receipts: InventoryReceipt[];
  onAddReceipt: (receipt: InventoryReceipt) => void;
  onDeleteReceipt: (id: string) => void;
  coaches: Coach[];
  requisitions: PartsRequisition[];
  onAddRequisition: (req: PartsRequisition) => void;
  onUpdateRequisition: (id: string, req: PartsRequisition) => void;
  onDeleteRequisition: (id: string) => void;
  lang: Language;
}

const KNOWN_BUS_NUMBERS = [
  '1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990',
  '2847', '2848', '2849', '2850', '2851', '2861',
  '2125', '2437', '2609', '2610', '2541', '2540',
];

type LedgerRow = {
  id: string;
  date: string;
  type: 'in' | 'out';
  qty: number;
  unit: string;
  ref?: string; // bus no / receiver for OUT, remarks for IN
  remarks?: string;
  runningBalance: number;
};

const Inventory: React.FC<InventoryProps> = ({ inventory, onAdd, onUpdate, onDelete, issues, onAddIssue, onDeleteIssue, receipts, onAddReceipt, onDeleteReceipt, coaches, requisitions, onAddRequisition, onUpdateRequisition, onDeleteRequisition, lang }) => {
  const t = translations[lang];
  const today = new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState<'stock' | 'requisition'>('stock');

  // Dual-section form state
  const [receivedForm, setReceivedForm] = useState({ date: today, itemName: '', partNo: '', category: '', qty: '', unit: 'pcs', remarks: '' });
  const [issuedForm, setIssuedForm] = useState({ date: today, itemName: '', busNo: '', side: '', receiver: '', qty: '', unit: 'pcs', remarks: '' });
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [newItemInput, setNewItemInput] = useState('');
  const [isAddingNewBus, setIsAddingNewBus] = useState(false);
  const [newBusInput, setNewBusInput] = useState('');
  const [customBuses, setCustomBuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterBus, setFilterBus] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', partNo: '', category: '', stock: '', minStock: '', unit: 'pcs', lastUpdated: today });
  const [ledgerItem, setLedgerItem] = useState<InventoryItem | null>(null);

  const existingCategories = Array.from(new Set(inventory.map(item => item.category)));
  const itemNames = Array.from(new Set(inventory.map(item => item.name)));
  const busNumbers = Array.from(new Set([...KNOWN_BUS_NUMBERS, ...customBuses])).sort();
  const allBusOptions = busNumbers;

  const handleAddReceived = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivedForm.itemName || !receivedForm.qty) return;

    const existingItem = inventory.find(i => i.name.toLowerCase() === receivedForm.itemName.toLowerCase());
    const qty = parseInt(receivedForm.qty);
    const newStock = (existingItem?.stock || 0) + qty;
    const itemId = existingItem?.id || `INV-${Date.now().toString().slice(-4)}`;

    const itemData: InventoryItem = {
      id: itemId,
      name: receivedForm.itemName,
      partNo: receivedForm.partNo.trim() || existingItem?.partNo,
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

    onAddReceipt({
      id: 'REC-' + Date.now().toString().slice(-8),
      date: receivedForm.date,
      itemId,
      itemName: receivedForm.itemName,
      partNo: receivedForm.partNo.trim() || undefined,
      category: itemData.category,
      qty,
      unit: receivedForm.unit,
      remarks: receivedForm.remarks.trim() || undefined,
    });

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

    const qty = parseInt(issuedForm.qty);
    const newStock = Math.max(0, existingItem.stock - qty);

    const itemData: InventoryItem = {
      ...existingItem,
      stock: newStock,
      lastUpdated: issuedForm.date,
    };

    onUpdate(existingItem.id, itemData);

    onAddIssue({
      id: 'ISS-' + Date.now().toString().slice(-8),
      date: issuedForm.date,
      itemId: existingItem.id,
      itemName: existingItem.name,
      partNo: existingItem.partNo,
      qty,
      unit: issuedForm.unit,
      busNo: issuedForm.busNo.trim() || undefined,
      side: issuedForm.side.trim() || undefined,
      receiver: issuedForm.receiver.trim() || undefined,
      remarks: issuedForm.remarks.trim() || undefined,
    });
    setIssuedForm({ date: today, itemName: '', busNo: '', side: '', receiver: '', qty: '', unit: 'pcs', remarks: '' });
    setIsAddingNewBus(false);
    setNewBusInput('');
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      partNo: item.partNo || '',
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
      partNo: editForm.partNo.trim() || undefined,
      category: editForm.category || 'Uncategorized',
      stock: parseInt(editForm.stock) || 0,
      minStock: parseInt(editForm.minStock) || 0,
      unit: editForm.unit,
      lastUpdated: editForm.lastUpdated,
    });
    setEditingItem(null);
  };

  const totalIssuedByItem = useMemo(() => {
    const map = new Map<string, number>();
    issues.forEach(iss => {
      map.set(iss.itemId || iss.itemName, (map.get(iss.itemId || iss.itemName) || 0) + iss.qty);
    });
    return map;
  }, [issues]);

  // Per-item ledger: merge receipts (IN) + issues (OUT) sorted chronologically, with running balance
  const itemLedger: LedgerRow[] = useMemo(() => {
    if (!ledgerItem) return [];
    const key = ledgerItem.id;
    const inRows = receipts.filter(r => (r.itemId || r.itemName) === key || r.itemName === ledgerItem.name);
    const outRows = issues.filter(i => (i.itemId || i.itemName) === key || i.itemName === ledgerItem.name);

    const combined = [
      ...inRows.map(r => ({ id: r.id, date: r.date, type: 'in' as const, qty: r.qty, unit: r.unit, ref: undefined as string | undefined, remarks: r.remarks })),
      ...outRows.map(i => ({ id: i.id, date: i.date, type: 'out' as const, qty: i.qty, unit: i.unit, ref: i.busNo, remarks: [i.side, i.receiver].filter(Boolean).join(' · ') || i.remarks })),
    ].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

    let running = 0;
    return combined.map(row => {
      running += row.type === 'in' ? row.qty : -row.qty;
      return { ...row, runningBalance: running };
    }).reverse(); // latest first for display
  }, [ledgerItem, receipts, issues]);

  // Bus-wise issued filter (per-vehicle ledger view)
  const filteredIssues = useMemo(() => {
    return issues.filter(iss => {
      if (filterBus && iss.busNo !== filterBus) return false;
      return true;
    });
  }, [issues, filterBus]);

  const fmt = (n: number) => n.toLocaleString('en-IN');

  const selectCls = "px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 dark:text-white";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Inventory</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Stock ledger &amp; parts requisition slips</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
        {[
          { key: 'stock' as const, label: 'Stock Ledger', icon: 'fa-box' },
          { key: 'requisition' as const, label: 'Parts Requisition Slip', icon: 'fa-file-invoice' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <i className={`fa-solid ${tab.icon}`}></i>{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'requisition' ? (
        <PartsRequisitionSlip
          requisitions={requisitions}
          onAdd={onAddRequisition}
          onUpdate={onUpdateRequisition}
          onDelete={onDeleteRequisition}
          coaches={coaches}
          lang={lang}
        />
      ) : (
      <>
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
            <input type="date" value={receivedForm.date} onChange={e => setReceivedForm({ ...receivedForm, date: e.target.value })} className={`col-span-2 ${selectCls} focus:ring-emerald-400/30`} />

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
                  if (e.target.value === '__new__') {
                    setIsAddingNewItem(true); setNewItemInput('');
                    setReceivedForm({ ...receivedForm, itemName: '', partNo: '' });
                  } else {
                    const picked = inventory.find(i => i.name === e.target.value);
                    setReceivedForm({ ...receivedForm, itemName: e.target.value, partNo: picked?.partNo || '', category: picked?.category || receivedForm.category });
                  }
                }}
                className={`col-span-2 ${selectCls} focus:ring-emerald-400/30`}>
                <option value="">Item Name / Description</option>
                <option value="__new__">+ New Item</option>
                {itemNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            )}

            <input type="text" value={receivedForm.partNo} onChange={e => setReceivedForm({ ...receivedForm, partNo: e.target.value })} placeholder="Part No (spec/model code)" className={`${selectCls} focus:ring-emerald-400/30`} />

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
                className={`${selectCls} focus:ring-emerald-400/30`}>
                <option value="">Category</option>
                <option value="__new__">+ New Category</option>
                {existingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            )}

            <div className="col-span-2 flex gap-2">
              <input type="number" min="0" value={receivedForm.qty} onChange={e => setReceivedForm({ ...receivedForm, qty: e.target.value })} placeholder="Qty" className={`flex-1 ${selectCls} focus:ring-emerald-400/30`} />
              <select value={receivedForm.unit} onChange={e => setReceivedForm({ ...receivedForm, unit: e.target.value })} className={`${selectCls} focus:ring-emerald-400/30`}>
                <option value="pcs">Pcs</option>
                <option value="box">Box</option>
                <option value="kg">Kg</option>
                <option value="ltr">Ltr</option>
              </select>
            </div>

            <input type="text" value={receivedForm.remarks} onChange={e => setReceivedForm({ ...receivedForm, remarks: e.target.value })} placeholder="Remarks (optional)" className={`col-span-2 ${selectCls} focus:ring-emerald-400/30`} />
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
            <input type="date" value={issuedForm.date} onChange={e => setIssuedForm({ ...issuedForm, date: e.target.value })} className={`col-span-2 ${selectCls} focus:ring-rose-400/30`} />

            <select value={issuedForm.itemName} onChange={e => {
                const picked = inventory.find(i => i.name === e.target.value);
                setIssuedForm({ ...issuedForm, itemName: e.target.value, unit: picked?.unit || issuedForm.unit });
              }} className={`col-span-2 ${selectCls} focus:ring-rose-400/30`}>
              <option value="">Item Name / Description</option>
              {itemNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>

            {isAddingNewBus ? (
              <div className="flex gap-1">
                <input type="text" autoFocus value={newBusInput}
                  onChange={e => { setNewBusInput(e.target.value); setIssuedForm({ ...issuedForm, busNo: e.target.value }); }}
                  placeholder="Type bus no"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-400/30 dark:text-white" />
                <button type="button" onClick={() => {
                    if (newBusInput.trim()) setCustomBuses(prev => Array.from(new Set([...prev, newBusInput.trim()])));
                    setIsAddingNewBus(false); setNewBusInput('');
                  }}
                  className="px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500 text-xs">
                  <i className="fa-solid fa-check"></i>
                </button>
              </div>
            ) : (
              <select value={issuedForm.busNo}
                onChange={e => {
                  if (e.target.value === '__new__') { setIsAddingNewBus(true); setNewBusInput(''); setIssuedForm({ ...issuedForm, busNo: '' }); }
                  else setIssuedForm({ ...issuedForm, busNo: e.target.value });
                }}
                className={`${selectCls} focus:ring-rose-400/30`}>
                <option value="">Bus No</option>
                <option value="__new__">+ New Bus</option>
                {busNumbers.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}

            <input type="text" value={issuedForm.side} onChange={e => setIssuedForm({ ...issuedForm, side: e.target.value })} placeholder="Side (e.g. F/L, Re/R)" className={`${selectCls} focus:ring-rose-400/30`} />

            <input type="text" value={issuedForm.receiver} onChange={e => setIssuedForm({ ...issuedForm, receiver: e.target.value })} placeholder="Receiver (mechanic/driver name)" className={`col-span-2 ${selectCls} focus:ring-rose-400/30`} />

            <div className="col-span-2 flex gap-2">
              <input type="number" min="0" value={issuedForm.qty} onChange={e => setIssuedForm({ ...issuedForm, qty: e.target.value })} placeholder="Qty" className={`flex-1 ${selectCls} focus:ring-rose-400/30`} />
              <select value={issuedForm.unit} onChange={e => setIssuedForm({ ...issuedForm, unit: e.target.value })} className={`${selectCls} focus:ring-rose-400/30`}>
                <option value="pcs">Pcs</option>
                <option value="box">Box</option>
                <option value="kg">Kg</option>
                <option value="ltr">Ltr</option>
              </select>
            </div>

            <input type="text" value={issuedForm.remarks} onChange={e => setIssuedForm({ ...issuedForm, remarks: e.target.value })} placeholder="Remarks (optional)" className={`col-span-2 ${selectCls} focus:ring-rose-400/30`} />
          </div>

          <button type="submit" className="w-full py-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-widest transition-colors">
            + Add Issued
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search item name..." className={`flex-1 ${selectCls} focus:ring-blue-400/30`} />
        <select value={filterCategory || ''} onChange={e => setFilterCategory(e.target.value || null)} className={`${selectCls} focus:ring-blue-400/30`}>
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
                <tr className="bg-indigo-600 dark:bg-indigo-700">
                  {['SL', 'Date', 'Item', 'Category', 'Received', 'Issued', 'Total', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-white/90 uppercase tracking-widest text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory
                  .filter(item => !filterCategory || item.category === filterCategory)
                  .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item, idx) => (
                  <tr key={item.id} onClick={() => setLedgerItem(item)} className="hover:bg-violet-50/60 dark:hover:bg-violet-900/10 transition-colors cursor-pointer" title="Click to view full ledger">
                    <td className="px-4 py-3 text-xs font-black text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{item.lastUpdated}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-700 dark:text-slate-200">{item.name}</div>
                      {item.partNo && <div className="text-[10px] text-slate-400 font-medium">Part# {item.partNo}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">{item.category}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{fmt(item.stock)}</td>
                    <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">{fmt(totalIssuedByItem.get(item.id) || 0)}</td>
                    <td className="px-4 py-3 font-black text-slate-800 dark:text-slate-100 bg-slate-100/50 dark:bg-slate-800/50">{fmt(item.stock)} {item.unit}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button onClick={() => setLedgerItem(item)} title="View Ledger" className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 transition-colors">
                          <i className="fa-solid fa-book text-[10px]"></i>
                        </button>
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

      {/* Issued History / Per-Vehicle Ledger (filter by Bus No) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white">
              <i className="fa-solid fa-bus text-xs"></i>
            </div>
            <h3 className="font-black text-rose-700 dark:text-rose-400">Issued History — Vehicle Ledger</h3>
          </div>
          <select value={filterBus || ''} onChange={e => setFilterBus(e.target.value || null)} className={`${selectCls} focus:ring-rose-400/30`}>
            <option value="">All Buses</option>
            {allBusOptions.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        {filteredIssues.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No stock issued yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-rose-600 dark:bg-rose-700">
                  {['Date', 'Description', 'Part No', 'Bus No', 'Side', 'Qty', 'Receiver', 'Remarks', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-white/90 uppercase tracking-widest text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map(iss => (
                  <tr key={iss.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{iss.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{iss.itemName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{iss.partNo || '—'}</td>
                    <td className="px-4 py-3">
                      {iss.busNo ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          <i className="fa-solid fa-bus text-[8px]"></i>{iss.busNo}
                        </span>
                      ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{iss.side || '—'}</td>
                    <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">{fmt(iss.qty)} {iss.unit}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{iss.receiver || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{iss.remarks || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => onDeleteIssue(iss.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors">
                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Ledger Modal (date-wise stock in/out with running balance) */}
      {ledgerItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-violet-100 dark:border-violet-900/30 flex justify-between items-center bg-violet-50 dark:bg-violet-900/10">
              <div>
                <h3 className="text-lg font-black text-violet-800 dark:text-violet-300">{ledgerItem.name} — Stock Ledger</h3>
                <p className="text-xs text-violet-500/80 dark:text-violet-400/70 mt-0.5">{ledgerItem.partNo ? `Part# ${ledgerItem.partNo} · ` : ''}Current balance: {fmt(ledgerItem.stock)} {ledgerItem.unit}</p>
              </div>
              <button onClick={() => setLedgerItem(null)} className="w-8 h-8 flex items-center justify-center rounded-xl text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="px-6 py-2.5 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 dark:bg-emerald-800 border border-emerald-400"></span> Received (In)
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-200 dark:bg-rose-900/60 border border-rose-400"></span> Issued (Out)
              </span>
            </div>
            <div className="overflow-y-auto flex-1">
              {itemLedger.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">No transactions logged yet for this item</div>
              ) : (
                <table className="w-full text-sm border-separate border-spacing-0">
                  <thead className="sticky top-0 bg-violet-600 dark:bg-violet-800">
                    <tr>
                      {['Date', 'In', 'Out', 'Balance', 'Reference'].map(h => (
                        <th key={h} className="px-4 py-3 text-[10px] font-black text-white/90 uppercase tracking-widest text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {itemLedger.map(row => (
                      <tr key={row.id} className={`transition-colors ${row.type === 'in' ? 'bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20' : 'bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-900/10 dark:hover:bg-rose-900/20'}`}>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{row.date}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{row.type === 'in' ? `${fmt(row.qty)} ${row.unit}` : '—'}</td>
                        <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">{row.type === 'out' ? `${fmt(row.qty)} ${row.unit}` : '—'}</td>
                        <td className="px-4 py-3 font-black text-slate-800 dark:text-slate-100">{fmt(row.runningBalance)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate">{[row.ref, row.remarks].filter(Boolean).join(' · ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

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
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Part No (spec/model code)</label>
                <input type="text" value={editForm.partNo} onChange={e => setEditForm({ ...editForm, partNo: e.target.value })} placeholder="e.g. 225/80R22.5" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400/30 dark:text-white" />
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
      </>
      )}
    </div>
  );
};

export default Inventory;
