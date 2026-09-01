import React, { useState, useMemo } from 'react';
import { PartsRequisition, PartsRequisitionItem, Coach } from '../types';
import { Language } from '../translations';

interface PartsRequisitionProps {
  requisitions: PartsRequisition[];
  onAdd: (req: PartsRequisition) => void;
  onUpdate: (id: string, req: PartsRequisition) => void;
  onDelete: (id: string) => void;
  coaches: Coach[];
  lang: Language;
}

const KNOWN_BUS_NUMBERS = [
  '1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990',
  '2847', '2848', '2849', '2850', '2851', '2861',
  '2125', '2437', '2609', '2610', '2541', '2540',
];

const emptyItem = (): PartsRequisitionItem => ({ partsName: '', partsNo: '', quantity: '', remarks: '' });

const PartsRequisitionSlip: React.FC<PartsRequisitionProps> = ({ requisitions, onAdd, onUpdate, onDelete, coaches, lang }) => {
  const today = new Date().toISOString().split('T')[0];

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewReq, setPreviewReq] = useState<PartsRequisition | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    voucherNo: '',
    date: today,
    ref: '',
    busNo: '',
    receivedName: '',
    total: '',
    approvedBy: '',
    foreman: '',
    receivedBySign: '',
  });
  const [items, setItems] = useState<PartsRequisitionItem[]>([emptyItem()]);

  const busNumbers = Array.from(new Set([...KNOWN_BUS_NUMBERS, ...coaches.map(c => c.regNo || c.coachNo).filter(Boolean)])).sort();

  const filtered = useMemo(() => {
    return requisitions
      .filter(r =>
        !searchQuery ||
        r.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.busNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.receivedName || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [requisitions, searchQuery]);

  const resetForm = () => {
    setForm({ voucherNo: '', date: today, ref: '', busNo: '', receivedName: '', total: '', approvedBy: '', foreman: '', receivedBySign: '' });
    setItems([emptyItem()]);
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (r: PartsRequisition) => {
    setForm({
      voucherNo: r.voucherNo,
      date: r.date,
      ref: r.ref || '',
      busNo: r.busNo || '',
      receivedName: r.receivedName || '',
      total: r.total || '',
      approvedBy: r.approvedBy || '',
      foreman: r.foreman || '',
      receivedBySign: r.receivedBySign || '',
    });
    setItems(r.items.length > 0 ? r.items : [emptyItem()]);
    setEditingId(r.id);
    setShowModal(true);
  };

  const updateItem = (idx: number, field: keyof PartsRequisitionItem, value: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };
  const addItemRow = () => setItems(prev => [...prev, emptyItem()]);
  const removeItemRow = (idx: number) => setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.voucherNo.trim()) return;
    const cleanItems = items.filter(it => it.partsName.trim() || it.partsNo?.trim() || it.quantity.trim());

    const record: PartsRequisition = {
      id: editingId || ('PRQ-' + Date.now().toString().slice(-8)),
      voucherNo: form.voucherNo.trim(),
      date: form.date,
      ref: form.ref.trim() || undefined,
      busNo: form.busNo.trim() || undefined,
      receivedName: form.receivedName.trim() || undefined,
      items: cleanItems,
      total: form.total.trim() || undefined,
      approvedBy: form.approvedBy.trim() || undefined,
      foreman: form.foreman.trim() || undefined,
      receivedBySign: form.receivedBySign.trim() || undefined,
      createdAt: editingId ? (requisitions.find(r => r.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    if (editingId) onUpdate(editingId, record);
    else onAdd(record);

    setShowModal(false);
    resetForm();
  };

  const inputCls = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 dark:text-white";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black tracking-tight">Parts Requisition Slip</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Voucher-based multi-line parts requisition, matching the printed form</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95"
        >
          <i className="fa-solid fa-plus"></i> New Requisition
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search Voucher No / Bus No / Received Name..."
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400/30 dark:text-white"
      />

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <i className="fa-solid fa-file-invoice text-4xl text-slate-300 dark:text-slate-600 mb-3"></i>
            <p className="font-black text-slate-600 dark:text-slate-300">No requisition slips yet</p>
            <p className="text-sm text-slate-400 mt-1">Add your first Parts Requisition Slip above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-indigo-600">
                  {['Voucher No', 'Date', 'Bus No', 'Received Name', 'Items', 'Total', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-white/90 uppercase tracking-widest text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} onClick={() => setPreviewReq(r)} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-black text-indigo-700 dark:text-indigo-400">{r.voucherNo}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{r.date}</td>
                    <td className="px-4 py-3">
                      {r.busNo ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          <i className="fa-solid fa-bus text-[8px]"></i>{r.busNo}
                        </span>
                      ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">{r.receivedName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.items.length} part{r.items.length !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{r.total || '—'}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button onClick={() => setPreviewReq(r)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 transition-colors" title="Preview">
                          <i className="fa-solid fa-eye text-[10px]"></i>
                        </button>
                        <button onClick={() => openEditModal(r)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors" title="Edit">
                          <i className="fa-solid fa-pen text-[10px]"></i>
                        </button>
                        <button onClick={() => setDeleteConfirmId(r.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors" title="Delete">
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-600 text-white flex-shrink-0">
              <h3 className="text-lg font-black">{editingId ? 'Edit Requisition Slip' : 'New Parts Requisition Slip'}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              {/* Header fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Voucher No *</label>
                  <input required type="text" value={form.voucherNo} onChange={e => setForm({ ...form, voucherNo: e.target.value })} className={inputCls} placeholder="e.g. 824" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Ref</label>
                  <input type="text" value={form.ref} onChange={e => setForm({ ...form, ref: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Bus No</label>
                  <select value={form.busNo} onChange={e => setForm({ ...form, busNo: e.target.value })} className={inputCls}>
                    <option value="">Select Bus</option>
                    {busNumbers.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="col-span-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Received Name</label>
                  <input type="text" value={form.receivedName} onChange={e => setForm({ ...form, receivedName: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Total</label>
                  <input type="text" value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} className={inputCls} placeholder="e.g. 5 items" />
                </div>
              </div>

              {/* Line items table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Parts</label>
                  <button type="button" onClick={addItemRow} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline">
                    <i className="fa-solid fa-plus mr-1"></i>Add Row
                  </button>
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-sm border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        {['Parts Name', 'Parts No.', 'Quantity', 'Remarks', ''].map(h => (
                          <th key={h} className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="p-2"><input type="text" value={item.partsName} onChange={e => updateItem(idx, 'partsName', e.target.value)} className={inputCls} placeholder="Parts Name" /></td>
                          <td className="p-2"><input type="text" value={item.partsNo} onChange={e => updateItem(idx, 'partsNo', e.target.value)} className={inputCls} placeholder="Parts No." /></td>
                          <td className="p-2"><input type="text" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className={inputCls} placeholder="e.g. 01Pcs" /></td>
                          <td className="p-2"><input type="text" value={item.remarks} onChange={e => updateItem(idx, 'remarks', e.target.value)} className={inputCls} placeholder="Remarks" /></td>
                          <td className="p-2">
                            <button type="button" onClick={() => removeItemRow(idx)} className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                              <i className="fa-solid fa-trash-can text-[10px]"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Approval fields */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Received by Sign &amp; Name</label>
                  <input type="text" value={form.receivedBySign} onChange={e => setForm({ ...form, receivedBySign: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Store Incharge</label>
                  <input type="text" value={form.foreman} onChange={e => setForm({ ...form, foreman: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Approved</label>
                  <input type="text" value={form.approvedBy} onChange={e => setForm({ ...form, approvedBy: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest transition-colors">
                  {editingId ? 'Save Changes' : 'Save Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal — mirrors the physical slip layout */}
      {previewReq && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-lg font-black text-indigo-700 dark:text-indigo-400">DOEL EXPRESS</h3>
                <p className="text-[10px] text-slate-400 font-bold">Head Office: Nabilaperagong 9no, Sector, Uttara, Abdullahpur, Dhaka</p>
              </div>
              <button onClick={() => setPreviewReq(null)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-center font-black text-sm uppercase tracking-widest border border-slate-300 dark:border-slate-700 rounded-full inline-block px-4 py-1 mx-auto block w-fit">Parts Requisition Slip</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-400 font-bold text-xs">Voucher No: </span><span className="font-black">{previewReq.voucherNo}</span></div>
                <div><span className="text-slate-400 font-bold text-xs">Date: </span><span className="font-black">{previewReq.date}</span></div>
                <div><span className="text-slate-400 font-bold text-xs">Ref: </span><span className="font-black">{previewReq.ref || '—'}</span></div>
                <div><span className="text-slate-400 font-bold text-xs">Bus No: </span><span className="font-black">{previewReq.busNo || '—'}</span></div>
                <div className="col-span-2"><span className="text-slate-400 font-bold text-xs">Received Name: </span><span className="font-black">{previewReq.receivedName || '—'}</span></div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      {['Parts Name', 'Parts No.', 'Quantity', 'Remarks'].map(h => (
                        <th key={h} className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewReq.items.length === 0 ? (
                      <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400 text-xs">No parts listed</td></tr>
                    ) : previewReq.items.map((item, idx) => (
                      <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2 font-bold">{item.partsName || '—'}</td>
                        <td className="px-3 py-2 text-slate-500">{item.partsNo || '—'}</td>
                        <td className="px-3 py-2 font-bold text-blue-600 dark:text-blue-400">{item.quantity || '—'}</td>
                        <td className="px-3 py-2 text-slate-500">{item.remarks || '—'}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <td colSpan={2} className="px-3 py-2 font-black text-right uppercase tracking-widest text-[10px]">Total</td>
                      <td colSpan={2} className="px-3 py-2 font-black text-emerald-600 dark:text-emerald-400">{previewReq.total || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 text-center">
                <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
                  <p className="text-xs font-bold">{previewReq.receivedBySign || '—'}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Received by Sign &amp; Name</p>
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
                  <p className="text-xs font-bold">{previewReq.foreman || '—'}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Store Incharge</p>
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
                  <p className="text-xs font-bold">{previewReq.approvedBy || '—'}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Approved</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 flex-shrink-0">
              <button onClick={() => setPreviewReq(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest">
                Close
              </button>
              <button onClick={() => { setPreviewReq(null); openEditModal(previewReq); }} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black uppercase tracking-widest transition-colors">
                <i className="fa-solid fa-pen mr-1.5"></i>Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 text-xl">
              <i className="fa-solid fa-trash"></i>
            </div>
            <h3 className="font-black text-slate-900 dark:text-white mb-2">Delete this requisition slip?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">This will permanently remove the slip and all its line items.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={() => { onDelete(deleteConfirmId); setDeleteConfirmId(null); }} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-black transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsRequisitionSlip;
