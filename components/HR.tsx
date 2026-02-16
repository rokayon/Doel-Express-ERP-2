
import React, { useState, useRef } from 'react';
import { Staff } from '../types';
import { Language, translations } from '../translations';

interface HRProps {
  staff: Staff[];
  onAdd: (member: Staff) => void;
  onUpdate: (id: string, member: Staff) => void;
  onDelete: (id: string) => void;
  lang: Language;
}

const HR: React.FC<HRProps> = ({ staff, onAdd, onUpdate, onDelete, lang }) => {
  const [showModal, setShowModal] = useState(false);
  const [viewingStaff, setViewingStaff] = useState<Staff | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const t = translations[lang];

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    role: 'Driver', 
    phone: '', 
    salary: '',
    photo: '',
    nidPhoto: '',
    licensePhoto: ''
  });

  const isDriverRole = formData.role.toLowerCase().includes('driver');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(lang === 'en' ? 'File too large! Max 5MB' : 'ফাইলটি অনেক বড়! সর্বোচ্চ ৫ মেগাবাইট');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (member: Staff) => {
    setEditingStaffId(member.id);
    setFormData({
      name: member.name,
      role: member.role,
      phone: member.phone,
      salary: member.salary.toString(),
      photo: member.photo || '',
      nidPhoto: member.nidPhoto || '',
      licensePhoto: member.licensePhoto || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(lang === 'en' ? 'Permanentely remove this staff member?' : 'এই স্টাফ সদস্যকে স্থায়ীভাবে অপসারণ করবেন?')) {
      onDelete(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staffData: Staff = {
      id: editingStaffId || `EMP-${Date.now().toString().slice(-4)}`,
      name: formData.name,
      role: formData.role || 'Staff',
      phone: formData.phone,
      status: 'Active',
      salary: parseFloat(formData.salary),
      photo: formData.photo,
      nidPhoto: formData.nidPhoto,
      licensePhoto: formData.licensePhoto
    };

    if (editingStaffId) {
      onUpdate(editingStaffId, staffData);
    } else {
      onAdd(staffData);
    }

    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingStaffId(null);
    setFormData({ name: '', role: 'Driver', phone: '', salary: '', photo: '', nidPhoto: '', licensePhoto: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.hr}</h2>
          <p className="text-sm text-slate-500">{lang === 'en' ? 'Digital Personnel Enrollment System' : 'ডিজিটাল কর্মী নিবন্ধন সিস্টেম'}</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl font-bold active:scale-[0.98]"
        >
          <i className="fa-solid fa-user-plus"></i> {t.newHire}
        </button>
      </div>

      {/* Staff Registry Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-black">
              <tr>
                <th className="px-6 py-5">Personnel</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">Phone</th>
                <th className="px-6 py-5">Documents</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border shadow-sm flex-shrink-0">
                          <img 
                            src={member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} 
                            className="w-full h-full object-cover" 
                            alt={member.name}
                          />
                       </div>
                       <div>
                          <p className="font-black text-[13px]">{member.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {member.id}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-tight">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">{member.phone}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <div title="Photo" className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${member.photo ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                        <i className="fa-solid fa-camera"></i>
                      </div>
                      <div title="NID/License" className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${member.nidPhoto || member.licensePhoto ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                        <i className="fa-solid fa-id-card"></i>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <div className="flex gap-2 justify-end">
                        <button onClick={() => setViewingStaff(member)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"><i className="fa-solid fa-eye"></i></button>
                        <button onClick={() => handleEdit(member)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"><i className="fa-solid fa-pen"></i></button>
                        <button onClick={() => handleDelete(member.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"><i className="fa-solid fa-trash"></i></button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Digital Enrollment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl min-h-screen sm:min-h-0 sm:rounded-[2.5rem] shadow-2xl flex flex-col relative">
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight dark:text-white">
                  {editingStaffId ? 'Update Personnel File' : 'Digital Staff Enrollment'}
                </h3>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Secure Document Registry</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-10 flex-1">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Staff Full Name</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-4 text-base font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" placeholder="Legal Name" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Assigned Designation</label>
                    <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-4 text-base font-bold dark:text-white">
                      <option value="Driver">Driver (Requires License)</option>
                      <option value="Guide">Guide</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Manager">Manager</option>
                      <option value="Counter Staff">Counter Staff</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Phone No</label>
                        <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-4 font-bold dark:text-white" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Salary (৳)</label>
                        <input required type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-4 font-black text-blue-600" />
                     </div>
                  </div>
                </div>

                {/* Upload Zone Grid */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Photo Upload */}
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel Photo</label>
                     <div 
                        onClick={() => photoInputRef.current?.click()}
                        className={`aspect-square w-32 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group mx-auto md:mx-0 ${formData.photo ? 'border-blue-500 border-solid' : 'border-slate-200 hover:border-blue-400 dark:border-slate-700'}`}
                     >
                        <input type="file" accept="image/*" ref={photoInputRef} onChange={(e) => handleFileChange(e, 'photo')} className="hidden" />
                        {formData.photo ? (
                           <img src={formData.photo} className="w-full h-full object-cover" />
                        ) : (
                           <div className="text-center p-4">
                              <i className="fa-solid fa-camera text-slate-300 text-3xl mb-2"></i>
                              <p className="text-[8px] font-black text-slate-400 uppercase">Upload Profile</p>
                           </div>
                        )}
                        {formData.photo && <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><i className="fa-solid fa-rotate"></i></div>}
                     </div>
                  </div>

                  {/* ID Document Upload */}
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {isDriverRole ? 'Driving License (Front)' : 'National ID (NID)'}
                     </label>
                     <div 
                        onClick={() => docInputRef.current?.click()}
                        className={`aspect-video w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${ (isDriverRole ? formData.licensePhoto : formData.nidPhoto) ? 'border-emerald-500 border-solid' : 'border-slate-200 hover:border-blue-400 dark:border-slate-700'}`}
                     >
                        <input type="file" accept="image/*" ref={docInputRef} onChange={(e) => handleFileChange(e, isDriverRole ? 'licensePhoto' : 'nidPhoto')} className="hidden" />
                        {(isDriverRole ? formData.licensePhoto : formData.nidPhoto) ? (
                           <img src={isDriverRole ? formData.licensePhoto : formData.nidPhoto} className="w-full h-full object-cover" />
                        ) : (
                           <div className="text-center p-6">
                              <i className={`fa-solid ${isDriverRole ? 'fa-id-card' : 'fa-address-card'} text-slate-300 text-4xl mb-3`}></i>
                              <p className="text-[10px] font-black text-slate-400 uppercase">Tap to scan document</p>
                           </div>
                        )}
                        {(isDriverRole ? formData.licensePhoto : formData.nidPhoto) && <div className="absolute inset-0 bg-emerald-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><i className="fa-solid fa-camera"></i></div>}
                     </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-2xl shadow-blue-600/20 transition-all uppercase tracking-[0.2em] active:scale-[0.98]">
                  {editingStaffId ? 'Verify & Update Records' : 'Authorize & Enroll Personnel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Profile Viewer */}
      {viewingStaff && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-6 bg-slate-950/95 backdrop-blur-xl animate-in zoom-in-95 duration-300 overflow-y-auto">
           <div className="bg-white dark:bg-slate-900 w-full max-w-5xl min-h-screen sm:min-h-0 sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
              <button onClick={() => setViewingStaff(null)} className="absolute top-6 right-6 w-12 h-12 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white z-20 transition-all">
                 <i className="fa-solid fa-xmark text-2xl"></i>
              </button>

              {/* Identity Sidebar */}
              <div className="md:w-[350px] bg-slate-50 dark:bg-slate-800 p-10 flex flex-col items-center text-center border-b md:border-b-0 md:border-r dark:border-slate-700">
                 <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-8 border-white dark:border-slate-900 shadow-2xl mb-8 relative">
                    <img 
                      src={viewingStaff.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingStaff.name)}&size=300`} 
                      className="w-full h-full object-cover" 
                      alt="Avatar"
                    />
                    <div className="absolute bottom-4 right-4 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 shadow-lg"></div>
                 </div>
                 <h3 className="text-3xl font-black uppercase italic tracking-tighter dark:text-white">{viewingStaff.name}</h3>
                 <p className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mt-4 mb-10 shadow-lg shadow-blue-500/20">
                    {viewingStaff.role}
                 </p>
                 
                 <div className="w-full space-y-4">
                    <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Member ID</span>
                       <span className="text-sm font-black dark:text-white">{viewingStaff.id}</span>
                    </div>
                    <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Monthly Payroll</span>
                       <span className="text-sm font-black text-emerald-600">৳ {viewingStaff.salary.toLocaleString()}</span>
                    </div>
                    <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Contact No</span>
                       <span className="text-sm font-black dark:text-white">{viewingStaff.phone}</span>
                    </div>
                 </div>
              </div>

              {/* Document Repository */}
              <div className="flex-1 p-8 sm:p-12 space-y-12">
                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                       <i className="fa-solid fa-shield-halved text-emerald-500"></i> Personnel Credentials
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-10">
                       <div className="group">
                          <div className="flex justify-between items-end mb-4">
                             <p className="font-black uppercase tracking-tighter text-sm italic">
                                {viewingStaff.role.toLowerCase().includes('driver') ? 'Authenticated Driving License' : 'Verified National ID (NID)'}
                             </p>
                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                                Security Scanned
                             </span>
                          </div>
                          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] border-4 border-slate-50 dark:border-slate-700 overflow-hidden shadow-inner relative group">
                             {(viewingStaff.licensePhoto || viewingStaff.nidPhoto) ? (
                                <img 
                                  src={viewingStaff.licensePhoto || viewingStaff.nidPhoto} 
                                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                                  alt="Document"
                                />
                             ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                                   <i className="fa-solid fa-file-excel text-5xl mb-3"></i>
                                   <p className="text-[10px] font-black uppercase tracking-widest">No Document Repository Data</p>
                                </div>
                             )}
                          </div>
                       </div>

                       {/* Digital Trust Badge */}
                       <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-8 border border-white/5">
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl shadow-2xl shadow-blue-600/40">
                                <i className="fa-solid fa-fingerprint"></i>
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Secure Identity</p>
                                <p className="text-lg font-black text-white italic tracking-tight uppercase">DOEL-ENROLL-AUTH-00{viewingStaff.id}</p>
                             </div>
                          </div>
                          <div className="w-24 h-24 bg-white p-3 rounded-3xl hidden sm:block shadow-2xl">
                             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DOEL_STAFF_VERIFIED_${viewingStaff.id}`} className="w-full h-full" alt="QR" />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HR;
