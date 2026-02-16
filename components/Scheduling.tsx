
import React, { useState, useMemo } from 'react';
import { Trip, Staff, Coach } from '../types';
import { Language, translations } from '../translations';

interface SchedulingProps {
  trips: Trip[];
  staff: Staff[];
  coaches: Coach[];
  onAdd: (trip: Trip) => void;
  onUpdate: (id: string, trip: Trip) => void;
  onDelete: (id: string) => void;
  lang: Language;
  onFinalize?: (trip: Trip) => void; 
}

const Scheduling: React.FC<SchedulingProps> = ({ trips, staff, coaches, onAdd, onUpdate, onDelete, lang, onFinalize }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const t = translations[lang];
  
  const [formData, setFormData] = useState({
    coachId: '', 
    route: '',
    departureTime: '',
    driver: '',
    guideName: '',
    status: 'Scheduled' as Trip['status']
  });

  const selectedCoach = useMemo(() => coaches.find(c => c.id === formData.coachId), [formData.coachId, coaches]);
  const existingRoutes = Array.from(new Set(trips.map(t => t.route)));

  const drivers = useMemo(() => staff.filter(s => s.role.toLowerCase().includes('driver') && s.status === 'Active'), [staff]);
  const guides = useMemo(() => staff.filter(s => 
    (s.role.toLowerCase().includes('conductor') || 
     s.role.toLowerCase().includes('supervisor') || 
     s.role.toLowerCase().includes('guide')) && 
    s.status === 'Active'
  ), [staff]);

  const activeCoaches = useMemo(() => coaches.filter(c => c.status === 'Active' || c.id === formData.coachId), [coaches, formData.coachId]);

  const handleEdit = (trip: Trip) => {
    const coach = coaches.find(c => c.coachNo === trip.coachNo);
    setEditingId(trip.id);
    setFormData({
      coachId: coach?.id || '',
      route: trip.route,
      departureTime: trip.departureTime.replace(' ', 'T'),
      driver: trip.driver,
      guideName: trip.guideName || '',
      status: trip.status
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(lang === 'en' ? 'Are you sure you want to cancel and remove this trip?' : 'আপনি কি নিশ্চিত যে আপনি এই ট্রিপটি বাতিল করতে চান?')) {
      onDelete(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoach) return;

    const tripData: Trip = {
      id: editingId || `T${Date.now().toString().slice(-3)}`,
      busNumber: selectedCoach.regNo,
      coachNo: selectedCoach.coachNo,
      route: formData.route || 'Undefined Route',
      departureTime: formData.departureTime.replace('T', ' '),
      status: formData.status,
      driver: formData.driver,
      guideName: formData.guideName,
      capacity: selectedCoach.seats,
      bookedSeats: editingId ? trips.find(t => t.id === editingId)?.bookedSeats || 0 : 0
    };

    if (editingId) {
      onUpdate(editingId, tripData);
    } else {
      onAdd(tripData);
    }
    
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ coachId: '', route: '', departureTime: '', driver: '', guideName: '', status: 'Scheduled' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.scheduling}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Initialize voyages and fleet deployment from registry data</p>
        </div>
        <button 
          onClick={() => { if(showForm) closeForm(); else setShowForm(true); }}
          className={`flex-1 sm:flex-none px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg font-black text-xs uppercase tracking-widest ${showForm ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          <i className={`fa-solid ${showForm ? 'fa-xmark' : 'fa-bus-simple'}`}></i> 
          {showForm ? (lang === 'en' ? 'Close Entry' : 'এন্ট্রি বন্ধ করুন') : t.newTrip}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-4 border-indigo-500/30 dark:border-indigo-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden animate-in slide-in-from-top-4 duration-500 relative group/form">
          <button onClick={closeForm} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full flex items-center justify-center transition-all z-10"><i className="fa-solid fa-xmark text-xl"></i></button>

          <div className="p-8 border-b bg-indigo-50/50 dark:bg-indigo-900/5 flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <i className={`fa-solid ${editingId ? 'fa-calendar-check' : 'fa-calendar-plus'} text-xl`}></i>
             </div>
             <div><h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{editingId ? 'Modify Voyage Schedule' : 'Deploy New Fleet Unit'}</h3></div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1">Define Route</label>
                <input required list="route-suggestions" value={formData.route} onChange={e => setFormData({...formData, route: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold dark:text-white" />
                <datalist id="route-suggestions">{existingRoutes.map(r => <option key={r} value={r} />)}</datalist>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1">Departure Schedule</label>
                <input required type="datetime-local" value={formData.departureTime} onChange={e => setFormData({...formData, departureTime: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1">Verified Coach</label>
                <select required value={formData.coachId} onChange={e => setFormData({...formData, coachId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white">
                   <option value="">Select unit...</option>
                   {activeCoaches.map(c => <option key={c.id} value={c.id}>{c.coachNo} ({c.regNo})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1">Assigned Driver</label>
                <select required value={formData.driver} onChange={e => setFormData({...formData, driver: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white">
                  <option value="">Select Pilot...</option>
                  {drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Trip['status']})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white">
                  <option value="Scheduled">Scheduled</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-2xl transition-all uppercase tracking-[0.3em] mt-4 active:scale-[0.99] border-b-4 border-slate-800 dark:border-indigo-800">
              {editingId ? 'UPDATE VOYAGE DATA' : 'PUBLISH & SYNC SCHEDULE'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 space-y-4">
           {trips.length === 0 ? (
             <div className="p-12 text-center text-slate-400 border-2 border-dashed rounded-3xl"><p className="font-bold">No trips scheduled yet.</p></div>
           ) : (
             trips.map(trip => (
               <div key={trip.id} className="p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col xl:flex-row xl:items-center justify-between gap-8 hover:border-indigo-200 transition-all group">
                  <div className="flex gap-6 items-center">
                     <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold ${trip.status === 'On Trip' ? 'bg-blue-500 text-white' : trip.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 border'}`}>
                        <span className="text-[9px] tracking-widest uppercase">{trip.id}</span>
                        <i className="fa-solid fa-bus-simple text-2xl mt-1"></i>
                     </div>
                     <div>
                        <h4 className="font-black text-xl text-slate-900 dark:text-white uppercase italic">{trip.route}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 mt-1">
                           <span className="text-[11px] text-slate-500 font-black uppercase"><i className="fa-regular fa-clock text-indigo-500"></i> {trip.departureTime}</span>
                           <span className="text-[11px] text-slate-500 font-black uppercase"><i className="fa-solid fa-hashtag"></i> Coach: {trip.coachNo}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                     <div className="flex items-center gap-3">
                        <div className={`px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-center min-w-[100px]`}>
                           <p className={`text-[10px] font-black uppercase tracking-widest ${trip.status === 'On Trip' ? 'text-blue-500' : trip.status === 'Completed' ? 'text-emerald-500' : 'text-slate-400'}`}>{trip.status}</p>
                        </div>
                        <button onClick={() => handleEdit(trip)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"><i className="fa-solid fa-pen-to-square"></i></button>
                        <button onClick={() => handleDelete(trip.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"><i className="fa-solid fa-trash-can"></i></button>
                        {onFinalize && trip.status !== 'Completed' && (
                          <button onClick={() => onFinalize(trip)} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">FINALIZE SALES</button>
                        )}
                     </div>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

export default Scheduling;
