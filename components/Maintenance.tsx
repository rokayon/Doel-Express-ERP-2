
import React, { useState, useMemo } from 'react';
import { Trip, InventoryItem } from '../types';
import { Language, translations } from '../translations';

interface MaintenanceProps {
  trips: Trip[];
  inventory: InventoryItem[];
  onUseInventory: (itemId: string, qty: number) => void;
  lang: Language;
}

const Maintenance: React.FC<MaintenanceProps> = ({ trips, inventory, onUseInventory, lang }) => {
  const t = translations[lang];
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [partSource, setPartSource] = useState<'inventory' | 'third-party'>('inventory');
  
  const [serviceRequest, setServiceRequest] = useState({ 
    busId: '', 
    partId: '', 
    externalPartName: '',
    supplierName: '',
    quantity: '1',
    notes: '' 
  });

  const maintenanceStatus = [
    { id: 'D-001', part: lang === 'en' ? 'Engine Oil' : 'ইঞ্জিন তেল', health: 85, status: 'Good', lastService: '2024-04-12' },
    { id: 'D-005', part: lang === 'en' ? 'Brake Pads' : 'ব্রেক প্যাড', health: 32, status: 'Critical', lastService: '2023-11-20' },
    { id: 'D-008', part: lang === 'en' ? 'Tires' : 'টায়ার', health: 68, status: 'Review', lastService: '2024-02-15' },
    { id: 'D-012', part: lang === 'en' ? 'Battery' : 'ব্যাটারি', health: 94, status: 'Good', lastService: '2024-05-01' },
  ];

  const selectedInventoryItem = useMemo(() => 
    inventory.find(item => item.id === serviceRequest.partId), 
  [serviceRequest.partId, inventory]);

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (partSource === 'inventory' && serviceRequest.partId) {
      const qty = parseInt(serviceRequest.quantity);
      if (selectedInventoryItem && selectedInventoryItem.stock < qty) {
        alert(t.insufficientStock);
        return;
      }
      onUseInventory(serviceRequest.partId, qty);
      alert(`${t.serviceScheduled} ${selectedInventoryItem?.name}`);
    } else {
      alert(`${t.externalTicketCreated} ${serviceRequest.externalPartName} (${serviceRequest.supplierName})`);
    }

    setShowServiceModal(false);
    setServiceRequest({ busId: '', partId: '', externalPartName: '', supplierName: '', quantity: '1', notes: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.maintenance}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Fleet longevity and safety management' : 'বহরের দীর্ঘায়ু এবং নিরাপত্তা ব্যবস্থাপনা'}</p>
        </div>
        <button 
          onClick={() => setShowServiceModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg font-bold"
        >
          <i className="fa-solid fa-wrench"></i> {t.scheduleService}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 p-6 rounded-3xl">
          <p className="text-rose-600 text-xs font-black uppercase tracking-widest">{t.criticalRepairs}</p>
          <h3 className="text-4xl font-black mt-2 text-rose-700">02</h3>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 p-6 rounded-3xl">
          <p className="text-amber-600 text-xs font-black uppercase tracking-widest">{t.pendingReview}</p>
          <h3 className="text-4xl font-black mt-2 text-amber-700">05</h3>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 p-6 rounded-3xl">
          <p className="text-emerald-600 text-xs font-black uppercase tracking-widest">{t.operationalHealth}</p>
          <h3 className="text-4xl font-black mt-2 text-emerald-700">94%</h3>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-black tracking-tight">{t.vehicleComponentHealth}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase tracking-widest font-black">
              <tr>
                <th className="px-8 py-5">Vehicle ID</th>
                <th className="px-8 py-5">Monitoring</th>
                <th className="px-8 py-5">Life</th>
                <th className="px-8 py-5 text-right">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {maintenanceStatus.map((bus) => (
                <tr key={bus.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  <td className="px-8 py-6 font-black">{bus.id}</td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold mb-1.5">{bus.part}</p>
                    <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${bus.health < 40 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${bus.health}%` }}></div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-black">{bus.health}%</td>
                  <td className="px-8 py-6 text-right">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${bus.status === 'Good' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {bus.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-black uppercase tracking-tight">{t.workshopTicket}</h3>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            
            <form onSubmit={handleSchedule} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block ml-1">{t.vehicleSelection}</label>
                  <select 
                    required 
                    value={serviceRequest.busId} 
                    onChange={e => setServiceRequest({...serviceRequest, busId: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select...</option>
                    {maintenanceStatus.map(b => <option key={b.id} value={b.id}>{b.id}</option>)}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block ml-1">{t.partSourcing}</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                     <button 
                       type="button"
                       onClick={() => setPartSource('inventory')}
                       className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${partSource === 'inventory' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       {t.inHouse}
                     </button>
                     <button 
                       type="button"
                       onClick={() => setPartSource('third-party')}
                       className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${partSource === 'third-party' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       {t.externalSource}
                     </button>
                  </div>
                </div>
              </div>

              {partSource === 'inventory' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block ml-1">{t.stockItem}</label>
                    <select 
                      required 
                      value={serviceRequest.partId} 
                      onChange={e => setServiceRequest({...serviceRequest, partId: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">{lang === 'en' ? 'Select from inventory...' : 'ইনভেন্টরি থেকে নির্বাচন করুন...'}</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.id} disabled={item.stock <= 0}>
                          {item.name} ({lang === 'en' ? 'Stock' : 'স্টক'}: {item.stock} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block ml-1">{t.quantity}</label>
                    <input 
                      required 
                      type="number" 
                      min="1"
                      value={serviceRequest.quantity} 
                      onChange={e => setServiceRequest({...serviceRequest, quantity: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block ml-1">{t.partDescription}</label>
                    <input 
                      required 
                      value={serviceRequest.externalPartName} 
                      onChange={e => setServiceRequest({...serviceRequest, externalPartName: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="e.g. Gearbox Assembly" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block ml-1">{t.supplierName}</label>
                    <input 
                      required 
                      value={serviceRequest.supplierName} 
                      onChange={e => setServiceRequest({...serviceRequest, supplierName: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="e.g. Apex Auto Parts" 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block ml-1">{t.mechanicNotes}</label>
                <textarea 
                  value={serviceRequest.notes} 
                  onChange={e => setServiceRequest({...serviceRequest, notes: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none h-24" 
                  placeholder={lang === 'en' ? "Detailed description of the issue..." : "সমস্যার বিস্তারিত বিবরণ..."} 
                />
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-[0.2em] active:scale-[0.98] border-b-4 border-indigo-800">
                {t.authorizeServiceTicket}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
