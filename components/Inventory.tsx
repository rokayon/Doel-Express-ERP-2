
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

const Inventory: React.FC<InventoryProps> = ({ inventory, onAdd, onUpdate, onDelete, lang }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const t = translations[lang];
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock: '',
    minStock: '',
    unit: 'pcs'
  });

  const existingCategories = Array.from(new Set(inventory.map(item => item.category)));

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      stock: item.stock.toString(),
      minStock: item.minStock.toString(),
      unit: item.unit
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(lang === 'en' ? 'Are you sure you want to remove this item?' : 'আপনি কি নিশ্চিত যে আপনি এই আইটেমটি অপসারণ করতে চান?')) {
      onDelete(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemData: InventoryItem = {
      id: editingId || `INV-${Date.now().toString().slice(-4)}`,
      name: formData.name,
      category: formData.category || 'Uncategorized',
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock),
      unit: formData.unit,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (editingId) {
      onUpdate(editingId, itemData);
    } else {
      onAdd(itemData);
    }

    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', category: '', stock: '', minStock: '', unit: 'pcs' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t.inventory}</h2>
        <button 
          onClick={() => { closeModal(); setShowModal(true); }}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg font-bold"
        >
          <i className="fa-solid fa-plus"></i> {t.addPart}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchParts} 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">{t.itemDetails}</th>
                <th className="px-6 py-4">{t.category}</th>
                <th className="px-6 py-4">{t.stockLevel}</th>
                <th className="px-6 py-4">{t.status}</th>
                <th className="px-6 py-4 text-right">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {item.id} • Updated: {item.lastUpdated}</p>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-tight">{item.category}</span></td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{item.stock} <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span></p>
                    <p className="text-[10px] text-slate-400 font-bold">MIN: {item.minStock}</p>
                  </td>
                  <td className="px-6 py-4">
                    {item.stock <= item.minStock ? (
                      <span className="flex items-center gap-1.5 text-rose-500 text-xs font-black uppercase"><i className="fa-solid fa-triangle-exclamation"></i> Low Stock</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-black uppercase"><i className="fa-solid fa-check-circle"></i> Healthy</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg"><i className="fa-solid fa-pen-to-square"></i></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Inventory Item' : 'Register New Inventory'}</h3>
              <button onClick={closeModal} className="text-slate-400"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="text-[10px] font-black uppercase mb-1 block">Item Name</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border p-3 rounded-xl dark:text-white" /></div>
              <div><label className="text-[10px] font-black uppercase mb-1 block">Category</label><input required list="inventory-categories" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border p-3 rounded-xl dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black uppercase mb-1 block">Stock</label><input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full border p-3 rounded-xl dark:bg-slate-800 dark:text-white" /></div>
                <div><label className="text-[10px] font-black uppercase mb-1 block">Unit</label><input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full border p-3 rounded-xl dark:bg-slate-800 dark:text-white" /></div>
              </div>
              <div className="mt-2"><label className="text-[10px] font-black uppercase mb-1 block">Min Stock (Alert Level)</label><input required type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} className="w-full border p-3 rounded-xl dark:bg-slate-800 dark:text-white" /></div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl mt-4 uppercase tracking-widest">{editingId ? 'UPDATE ITEM' : 'ADD TO INVENTORY'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
