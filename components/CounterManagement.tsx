
import React, { useState } from 'react';
import { Counter, User, AppRole, TicketSalesRecord, Trip } from '../types';
import { Language, translations } from '../translations';

interface CounterManagementProps {
  counters: Counter[];
  users: User[];
  trips: Trip[];
  currentUser: User | null;
  onAddCounter: (counter: Counter) => void;
  onUpdateCounter: (counterId: string, updates: Partial<Counter>) => void;
  onAddSalesRecord: (record: TicketSalesRecord) => void;
  lang: Language;
}

const CounterManagement: React.FC<CounterManagementProps> = ({ 
  counters, 
  users, 
  trips,
  currentUser, 
  onAddCounter, 
  onUpdateCounter, 
  onAddSalesRecord,
  lang 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [activeCounterForSales, setActiveCounterForSales] = useState<Counter | null>(null);
  const t = translations[lang];

  const isAdmin = currentUser?.role === AppRole.SUPER_ADMIN || currentUser?.role === AppRole.ADMIN;
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    assignedOperatorId: ''
  });

  const [salesFormData, setSalesFormData] = useState({
    tripId: '',
    ticketsSold: '',
    ticketPrice: '850',
    discount: '0',
    salesCommission: '0'
  });

  const handleAddCounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCounter: Counter = {
      id: `CNT-${Date.now().toString().slice(-4)}`,
      name: formData.name,
      location: formData.location,
      assignedOperatorId: formData.assignedOperatorId || undefined,
      isActive: true
    };
    onAddCounter(newCounter);
    setShowModal(false);
    setFormData({ name: '', location: '', assignedOperatorId: '' });
  };

  const handleSalesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCounterForSales) return;

    const selectedTrip = trips.find(t => t.id === salesFormData.tripId);
    if (!selectedTrip) return;

    const sold = parseInt(salesFormData.ticketsSold);
    const price = parseFloat(salesFormData.ticketPrice);
    const disc = parseFloat(salesFormData.discount || '0');
    const comm = parseFloat(salesFormData.salesCommission || '0');
    const total = (sold * price) - disc;

    const now = new Date();
    // Fix: Populating both mandatory and optional fields of TicketSalesRecord
    // This resolves the error where 'tripId' was not recognized and ensures
    // the object conforms to the defined interface in types.ts.
    const newRecord: TicketSalesRecord = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      date: now.toISOString().split('T')[0],
      regNo: selectedTrip.busNumber,
      coachNo: selectedTrip.id,
      driverName: selectedTrip.driver,
      guideName: 'Counter Staff',
      departureDate: selectedTrip.departureTime.split(' ')[0],
      departureSeatQty: sold,
      departureTaka: total,
      returnDate: '',
      returnSeatQty: 0,
      returnTaka: 0,
      totalTaka: total,
      dieselLtr: 0,
      dieselCost: 0,
      tripCost: 0,
      totalCost: 0,
      netProfit: total,
      abdullahpurOffice: 0,
      coxsbazarOffice: 0,
      sonargaonOffice: 0,
      dmd: 0,
      // Metadata fields for analytics and station performance tracking
      tripId: selectedTrip.id,
      busNumber: selectedTrip.busNumber,
      counterName: activeCounterForSales.name,
      operatorName: currentUser?.username || 'System',
      ticketsSold: sold,
      ticketPrice: price,
      discount: disc,
      salesCommission: comm,
      totalAmount: total,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onAddSalesRecord(newRecord);
    setShowSalesModal(false);
    setActiveCounterForSales(null);
    setSalesFormData({ tripId: '', ticketsSold: '', ticketPrice: '850', discount: '0', salesCommission: '0' });
  };

  const counterOperators = users.filter(u => u.role === AppRole.COUNTER || u.role === AppRole.MANAGER);
  const assignedCounter = counters.find(c => c.assignedOperatorId === currentUser?.id);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.counterManagement}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage station access and assign operations</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg font-bold"
          >
            <i className="fa-solid fa-plus"></i> {t.registerCounter}
          </button>
        )}
      </div>

      {assignedCounter && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-3xl shadow-xl">
                    <i className="fa-solid fa-store"></i>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-1">{t.yourAssignedCounter}</p>
                    <h3 className="text-3xl font-black uppercase tracking-tight italic">{assignedCounter.name}</h3>
                    <p className="text-xs font-bold opacity-80 mt-1 flex items-center gap-2">
                       <i className="fa-solid fa-location-dot"></i> {assignedCounter.location}
                    </p>
                 </div>
              </div>
              <button 
                onClick={() => {
                  setActiveCounterForSales(assignedCounter);
                  setShowSalesModal(true);
                }}
                className="w-full md:w-auto px-10 py-5 bg-white text-blue-600 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                 <i className="fa-solid fa-ticket"></i>
                 {t.recordSales}
              </button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {counters.length === 0 ? (
          <div className="col-span-full p-20 text-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
             <i className="fa-solid fa-store-slash text-4xl mb-4 opacity-50"></i>
             <p className="font-black uppercase tracking-widest text-sm">{t.noCounters}</p>
          </div>
        ) : (
          counters.map(counter => {
            const operator = users.find(u => u.id === counter.assignedOperatorId);
            return (
              <div key={counter.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 hover:shadow-xl transition-all group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-2 h-full ${counter.isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                      <i className="fa-solid fa-location-arrow"></i>
                   </div>
                   <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${counter.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {counter.isActive ? 'Active' : 'Inactive'}
                   </span>
                </div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-1">{counter.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <i className="fa-solid fa-map-pin"></i> {counter.location}
                </p>

                <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.assignedOperator}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {operator ? operator.username : t.notAssigned}
                      </span>
                   </div>
                   {counter.lastSync && (
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Activity</span>
                        <span className="text-[10px] font-bold text-slate-500">{counter.lastSync}</span>
                     </div>
                   )}
                </div>

                {isAdmin && (
                  <div className="mt-8 flex gap-2">
                    <button 
                      onClick={() => onUpdateCounter(counter.id, { isActive: !counter.isActive })}
                      className="flex-1 py-3 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {counter.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button 
                      className="w-12 h-12 bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl flex items-center justify-center transition-all"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-black uppercase tracking-tight">{t.registerCounter}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400"><i className="fa-solid fa-xmark text-2xl"></i></button>
            </div>
            <form onSubmit={handleAddCounterSubmit} className="p-10 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">{t.counterName}</label>
                <input 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Dhaka Main Terminal"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">{t.location}</label>
                <input 
                  required 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})} 
                  placeholder="Full Address"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">{t.assignedOperator}</label>
                <select 
                  value={formData.assignedOperatorId} 
                  onChange={e => setFormData({...formData, assignedOperatorId: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                >
                  <option value="">Unassigned</option>
                  {counterOperators.map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl transition-all uppercase tracking-widest text-xs">
                Deploy Station
              </button>
            </form>
          </div>
        </div>
      )}

      {showSalesModal && activeCounterForSales && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-1 bg-slate-50 dark:bg-slate-800/50 relative">
              <h3 className="text-xl font-black uppercase tracking-tight">{t.recordSales}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{activeCounterForSales.name}</p>
              <button onClick={() => setShowSalesModal(false)} className="absolute top-6 right-6 text-slate-400"><i className="fa-solid fa-xmark text-2xl"></i></button>
            </div>
            <form onSubmit={handleSalesSubmit} className="p-10 space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-widest">Select Trip</label>
                <select 
                  required 
                  value={salesFormData.tripId} 
                  onChange={e => setSalesFormData({...salesFormData, tripId: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                >
                  <option value="">Choose trip...</option>
                  {trips.map(trip => (
                    <option key={trip.id} value={trip.id}>{trip.id} - {trip.route} ({trip.busNumber})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-widest">{t.ticketsSold}</label>
                  <input required type="number" value={salesFormData.ticketsSold} onChange={e => setSalesFormData({...salesFormData, ticketsSold: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border p-4 rounded-xl font-black text-lg text-blue-600" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-widest">{t.ticketPrice}</label>
                  <input required type="number" value={salesFormData.ticketPrice} onChange={e => setSalesFormData({...salesFormData, ticketPrice: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border p-4 rounded-xl font-black text-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-widest">{t.discounts}</label>
                  <input type="number" value={salesFormData.discount} onChange={e => setSalesFormData({...salesFormData, discount: e.target.value})} className="w-full border p-4 rounded-xl text-rose-500 font-bold" placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-widest">{t.salesCommission}</label>
                  <input type="number" value={salesFormData.salesCommission} onChange={e => setSalesFormData({...salesFormData, salesCommission: e.target.value})} className="w-full border p-4 rounded-xl text-amber-600 font-bold" placeholder="0" />
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-slate-400">Net Receivable</span>
                    <span className="text-2xl font-black text-emerald-600 italic">
                       ৳ {((parseInt(salesFormData.ticketsSold || '0') * parseFloat(salesFormData.ticketPrice || '0')) - parseFloat(salesFormData.discount || '0')).toLocaleString()}
                    </span>
                 </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl transition-all uppercase tracking-widest text-xs mt-4">
                Finalize & Post to Ledger
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounterManagement;
