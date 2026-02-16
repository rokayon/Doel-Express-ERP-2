
import React, { useState } from 'react';
import { Coach, AppRole } from '../types';
import { Language, translations } from '../translations';

interface CoachRegisterProps {
  coaches: Coach[];
  onAdd: (coach: Coach) => void;
  onUpdate: (id: string, coach: Coach) => void;
  onRemove: (id: string) => void;
  lang: Language;
  userRole?: AppRole;
}

const CoachRegister: React.FC<CoachRegisterProps> = ({ coaches, onAdd, onUpdate, onRemove, lang, userRole }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const t = translations[lang];

  const isAdmin = userRole === AppRole.SUPER_ADMIN || userRole === AppRole.ADMIN;

  const [formData, setFormData] = useState({
    coachNo: '',
    regNo: '',
    seats: '40'
  });

  const handleEdit = (coach: Coach) => {
    if (!isAdmin) return;
    setEditingId(coach.id);
    setFormData({
      coachNo: coach.coachNo,
      regNo: coach.regNo,
      seats: coach.seats.toString()
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemove = (id: string) => {
    if (!isAdmin) return;
    
    // Double confirmation for fleet assets
    const unit = coaches.find(c => c.id === id);
    const confirmMsg = lang === 'en' 
      ? `ATTENTION: Deleting Coach ${unit?.coachNo} will remove all linked operational data. Are you sure?`
      : `সতর্কতা: কোচ ${unit?.coachNo} ডিলিট করলে এর সাথে যুক্ত সকল তথ্য মুছে যাবে। আপনি কি নিশ্চিত?`;
      
    if (window.confirm(confirmMsg)) {
      const finalCheck = lang === 'en' ? "CONFIRM FINAL REMOVAL?" : "চূড়ান্তভাবে মুছে ফেলবেন?";
      if (window.confirm(finalCheck)) {
        onRemove(id);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updatedCoach: Coach = {
        id: editingId,
        coachNo: formData.coachNo,
        regNo: formData.regNo,
        seats: parseInt(formData.seats),
        status: coaches.find(c => c.id === editingId)?.status || 'Active'
      };
      onUpdate(editingId, updatedCoach);
    } else {
      const newCoach: Coach = {
        id: `C${Date.now().toString().slice(-4)}`,
        coachNo: formData.coachNo,
        regNo: formData.regNo,
        seats: parseInt(formData.seats),
        status: 'Active'
      };
      onAdd(newCoach);
    }
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ coachNo: '', regNo: '', seats: '40' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.coachRegister}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Inventory and lifecycle management of fleet assets</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              if (showForm && !editingId) closeForm();
              else {
                setEditingId(null);
                setShowForm(true);
              }
            }}
            className={`flex-1 sm:flex-none px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl font-black text-xs uppercase tracking-widest ${showForm && !editingId ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            <i className={`fa-solid ${showForm && !editingId ? 'fa-xmark' : 'fa-bus-simple'}`}></i> 
            {showForm && !editingId ? (lang === 'en' ? 'Close Entry' : 'এন্ট্রি বন্ধ করুন') : (lang === 'en' ? 'Enroll New Coach' : 'নতুন কোচ নিবন্ধন')}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-4 border-indigo-500/20 dark:border-indigo-500/10 shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-500 relative">
          <button onClick={closeForm} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-full flex items-center justify-center transition-all z-10"><i className="fa-solid fa-xmark text-xl"></i></button>

          <div className="p-8 border-b bg-indigo-50/50 dark:bg-indigo-900/5 flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-bus'} text-xl`}></i>
             </div>
             <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                   {editingId ? 'Modify Unit Configuration' : 'Fleet Unit Enrollment'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized fleet control system</p>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">{t.coachNo}</label>
                <input required value={formData.coachNo} onChange={e => setFormData({...formData, coachNo: e.target.value})} placeholder="C-000" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">{t.regNo}</label>
                <input required value={formData.regNo} onChange={e => setFormData({...formData, regNo: e.target.value})} placeholder="Dhaka-Metro-..." className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">{t.seats}</label>
                <input required type="number" value={formData.seats} onChange={e => setFormData({...formData, seats: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold dark:text-white" />
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-2xl transition-all uppercase tracking-[0.3em] active:scale-[0.99] border-b-4 border-indigo-800">
               {editingId ? 'Authorize System Update' : 'Register Authorized Unit'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
         {coaches.length === 0 ? (
           <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[2.5rem] border-slate-100 dark:border-slate-800 text-slate-400">
              <i className="fa-solid fa-bus-simple text-4xl mb-4 opacity-30"></i>
              <p className="font-bold">No registered units detected in the local registry.</p>
           </div>
         ) : (
           coaches.map(coach => (
              <div key={coach.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-all flex flex-col">
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                       <i className="fa-solid fa-bus"></i>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${coach.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                       {coach.status}
                    </span>
                 </div>
                 <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{coach.coachNo}</h4>
                 <div className="flex flex-col gap-1.5 mt-2 mb-8">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-hashtag text-indigo-400"></i> {coach.regNo}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-couch text-indigo-400"></i> {coach.seats} Seats</p>
                 </div>
                 {isAdmin && (
                    <div className="mt-auto pt-5 border-t border-slate-50 dark:border-slate-800 flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(coach)} className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all flex items-center justify-center gap-2"><i className="fa-solid fa-pen"></i> Edit</button>
                        <button onClick={() => handleRemove(coach.id)} className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all flex items-center justify-center gap-2"><i className="fa-solid fa-trash"></i> Remove</button>
                    </div>
                 )}
              </div>
           ))
         )}
      </div>
    </div>
  );
};

export default CoachRegister;
