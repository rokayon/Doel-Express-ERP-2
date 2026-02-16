
import React, { useState } from 'react';
import { User, AppRole } from '../types';
import { Language, translations } from '../translations';

interface UserManagementProps {
  users: User[];
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  lang: Language;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUser, lang }) => {
  const t = translations[lang];
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.manageUsers}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{lang === 'en' ? 'Authorize staff access and define operational permissions' : 'কর্মীদের অ্যাক্সেস অনুমোদন করুন এবং অপারেশনাল অনুমতি নির্ধারণ করুন'}</p>
        </div>
        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
           <i className="fa-solid fa-users-gear text-xl"></i>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-black">
              <tr>
                <th className="px-8 py-5">User Identity</th>
                <th className="px-8 py-5">Email Address</th>
                <th className="px-8 py-5">{t.approvalStatus}</th>
                <th className="px-8 py-5">{t.assignRole}</th>
                <th className="px-8 py-5">Verification</th>
                <th className="px-8 py-5 text-right">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-bold italic">
                    {t.noUsers}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all overflow-hidden ${user.role === AppRole.SUPER_ADMIN ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-600 group-hover:text-white'}`}>
                          {user.profilePhoto ? (
                             <img src={user.profilePhoto} className="w-full h-full object-cover" />
                          ) : (
                             user.role === AppRole.SUPER_ADMIN ? <i className="fa-solid fa-crown text-xs"></i> : user.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {user.username}
                            {user.role === AppRole.SUPER_ADMIN && <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">Super</span>}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 italic">{user.email}</p>
                    </td>
                    <td className="px-8 py-6">
                      <button
                        onClick={() => user.role !== AppRole.SUPER_ADMIN && onUpdateUser(user.id, { isApproved: !user.isApproved })}
                        disabled={user.role === AppRole.SUPER_ADMIN}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          user.isApproved 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:scale-105'
                        } ${user.role === AppRole.SUPER_ADMIN ? 'cursor-default opacity-80' : ''}`}
                      >
                        {user.isApproved ? t.approved : t.pending}
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <select
                        value={user.role}
                        disabled={user.role === AppRole.SUPER_ADMIN}
                        onChange={(e) => onUpdateUser(user.id, { role: e.target.value as AppRole })}
                        className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50"
                      >
                        {Object.values(AppRole).map(role => (
                          <option key={role} value={role}>{role.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${user.nidPhoto ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}
                      >
                        <i className="fa-solid fa-address-card"></i>
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                          disabled={user.role === AppRole.SUPER_ADMIN}
                          className={`p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg ${user.role === AppRole.SUPER_ADMIN ? 'opacity-20 cursor-not-allowed' : ''}`}>
                            <i className="fa-solid fa-trash"></i>
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User NID Viewer Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Identity Verification</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedUser.username} • Account ID: {selectedUser.id}</p>
                 </div>
                 <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
                    <i className="fa-solid fa-xmark text-2xl"></i>
                 </button>
              </div>
              <div className="p-10 space-y-8">
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-3 block tracking-widest">National ID (NID) Scan</label>
                    <div className="aspect-video bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-slate-100 overflow-hidden">
                       {selectedUser.nidPhoto ? (
                          <img src={selectedUser.nidPhoto} className="w-full h-full object-cover" />
                       ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                             <i className="fa-solid fa-address-card text-4xl mb-2"></i>
                             <p className="text-[10px] font-black uppercase">No Document Uploaded</p>
                          </div>
                       )}
                    </div>
                 </div>
                 <button 
                   onClick={() => {
                     onUpdateUser(selectedUser.id, { isApproved: true });
                     setSelectedUser(null);
                   }}
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs"
                 >
                   Verify & Approve User
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
