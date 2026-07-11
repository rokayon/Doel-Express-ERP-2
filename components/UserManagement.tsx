
import React, { useState } from 'react';
import { User, AppRole } from '../types';
import { Language, translations } from '../translations';
import { PERMISSIONS, MODULE_LABELS } from '../constants';

interface UserManagementProps {
  users: User[];
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onDeleteUser: (userId: string) => void;
  lang: Language;
}

const ROLES = Object.values(AppRole).filter(r => r !== AppRole.SUPER_ADMIN);

const emptyAddForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  role: AppRole.DRIVER as AppRole,
  isApproved: true,
};

const getDefaultModules = (role: AppRole): string[] =>
  Object.entries(PERMISSIONS)
    .filter(([, roles]) => roles.includes(role))
    .map(([key]) => key);

const ALL_MODULES = Object.entries(MODULE_LABELS);

const roleColor: Record<string, string> = {
  SUPER_ADMIN:       'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  MANAGING_DIRECTOR: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DIRECTOR:          'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  ADMIN:             'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACCOUNTS:          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  HR:                'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  IT:                'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  MANAGER:           'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  COUNTER:           'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  DRIVER:            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  SUPERVISOR:        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  SALES:             'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PURCHASE:          'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  MARKETING:         'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
};

const UserManagement: React.FC<UserManagementProps> = ({
  users, onUpdateUser, onAddUser, onDeleteUser, lang,
}) => {
  const t = translations[lang];

  // ── Add Modal ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addPermissions, setAddPermissions] = useState<string[]>(() => getDefaultModules(AppRole.DRIVER));
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Edit Modal ──
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', username: '', email: '', password: '', role: AppRole.DRIVER as AppRole, isApproved: true });
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // ── View Modal ──
  const [viewUser, setViewUser] = useState<User | null>(null);

  // ── Delete Confirm ──
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Image Lightbox ──
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ────────────────────────────────────────────
  // Add User
  // ────────────────────────────────────────────
  const openAdd = () => {
    setAddForm(emptyAddForm);
    setAddPermissions(getDefaultModules(AppRole.DRIVER));
    setAddError('');
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.username.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      setAddError(lang === 'en' ? 'All fields are required.' : 'সব ফিল্ড পূরণ করুন।');
      return;
    }
    setSaving(true);
    try {
      await onAddUser({ name: addForm.name.trim() || undefined, username: addForm.username.trim(), email: addForm.email.trim(), password: addForm.password, role: addForm.role, isApproved: addForm.isApproved, permissions: addPermissions });
      setShowAddModal(false);
    } catch (err: any) {
      setAddError(err?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  // ────────────────────────────────────────────
  // Edit User
  // ────────────────────────────────────────────
  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({ name: user.name || '', username: user.username, email: user.email, password: '', role: user.role, isApproved: user.isApproved });
    setEditPermissions(user.permissions && user.permissions.length > 0 ? user.permissions : getDefaultModules(user.role));
    setEditError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    if (!editForm.username.trim() || !editForm.email.trim()) {
      setEditError(lang === 'en' ? 'Username and email are required.' : 'ইউজারনেম এবং ইমেইল আবশ্যক।');
      return;
    }
    setEditSaving(true);
    const updates: Partial<User> = {
      name: editForm.name.trim() || undefined,
      username: editForm.username.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
      isApproved: editForm.isApproved,
      permissions: editPermissions,
    };
    if (editForm.password.trim()) updates.password = editForm.password;
    try {
      onUpdateUser(editUser.id, updates);
      setEditUser(null);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update user.');
    } finally {
      setEditSaving(false);
    }
  };

  // ────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────
  const ModuleCheckboxGrid: React.FC<{
    selected: string[];
    onChange: (modules: string[]) => void;
    role: AppRole;
  }> = ({ selected, onChange, role }) => {
    const toggle = (key: string) =>
      onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {lang === 'en' ? 'Module Access' : 'মডিউল অ্যাক্সেস'} <span className="text-blue-500">({selected.length}/{ALL_MODULES.length})</span>
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={() => onChange(getDefaultModules(role))}
              className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all">
              {lang === 'en' ? 'Role Defaults' : 'রোল ডিফল্ট'}
            </button>
            <button type="button" onClick={() => onChange(ALL_MODULES.map(([k]) => k))}
              className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-all">
              {lang === 'en' ? 'All' : 'সব'}
            </button>
            <button type="button" onClick={() => onChange([])}
              className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all">
              {lang === 'en' ? 'None' : 'কোনোটা না'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
          {ALL_MODULES.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => toggle(key)}
                className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all cursor-pointer ${
                  selected.includes(key)
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover:border-blue-400'
                }`}
              >
                {selected.includes(key) && <i className="fa-solid fa-check text-white text-[9px]"></i>}
              </div>
              <span
                onClick={() => toggle(key)}
                className={`text-[11px] font-bold select-none ${selected.includes(key) ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.manageUsers}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {lang === 'en' ? 'Manage system users, roles, and access permissions' : 'সিস্টেম ব্যবহারকারী, ভূমিকা এবং অ্যাক্সেস পরিচালনা করুন'}
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 text-sm">
          <i className="fa-solid fa-user-plus"></i>
          <span className="hidden sm:inline">{lang === 'en' ? 'Add User' : 'যোগ করুন'}</span>
        </button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-black">
              <tr>
                <th className="px-6 py-5">Name</th>
                <th className="px-6 py-5">Username</th>
                <th className="px-6 py-5">Email</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">{t.approvalStatus}</th>
                <th className="px-6 py-5 text-right">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                    {lang === 'en' ? 'No users found.' : 'কোনো ব্যবহারকারী নেই।'}
                  </td>
                </tr>
              ) : users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                  <td className="px-6 py-5">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{user.name || <span className="text-slate-300 dark:text-slate-600 italic font-normal">—</span>}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => user.profilePhoto && setPreviewImage(user.profilePhoto)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm overflow-hidden flex-shrink-0 ${user.role === AppRole.SUPER_ADMIN ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'} ${user.profilePhoto ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all' : ''}`}
                      >
                        {user.profilePhoto
                          ? <img src={user.profilePhoto} className="w-full h-full object-cover" />
                          : user.role === AppRole.SUPER_ADMIN
                            ? <i className="fa-solid fa-crown text-xs"></i>
                            : user.username.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-black text-slate-900 dark:text-white text-sm">{user.username}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{user.email}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${roleColor[user.role] || 'bg-slate-100 text-slate-600'}`}>
                      {user.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => user.role !== AppRole.SUPER_ADMIN && onUpdateUser(user.id, { isApproved: !user.isApproved })}
                      disabled={user.role === AppRole.SUPER_ADMIN}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        user.isApproved
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:scale-105'
                      } disabled:cursor-default disabled:opacity-80`}
                    >
                      {user.isApproved ? t.approved : t.pending}
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end items-center gap-1.5">
                      {/* View */}
                      <button
                        onClick={() => setViewUser(user)}
                        title="View details"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 border border-transparent hover:border-blue-200 transition-all"
                      >
                        <i className="fa-solid fa-eye text-xs"></i>
                      </button>
                      {/* Edit */}
                      {user.role !== AppRole.SUPER_ADMIN && (
                        <button
                          onClick={() => openEdit(user)}
                          title="Edit user"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 border border-transparent hover:border-amber-200 transition-all"
                        >
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                      )}
                      {/* Delete */}
                      {user.role !== AppRole.SUPER_ADMIN && (
                        <button
                          onClick={() => setDeleteId(user.id)}
                          title="Delete user"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-transparent hover:border-rose-200 transition-all"
                        >
                          <i className="fa-solid fa-trash text-xs"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════
          ADD USER MODAL
      ════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 my-4">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">{lang === 'en' ? 'Add New User' : 'নতুন ব্যবহারকারী'}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{lang === 'en' ? 'Create account & set access permissions' : 'অ্যাকাউন্ট তৈরি ও অ্যাক্সেস নির্ধারণ করুন'}</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              {addError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation"></i> {addError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Name <span className="text-slate-300 font-medium normal-case">(optional)</span></label>
                  <input type="text" value={addForm.name} onChange={e => { setAddForm(p => ({...p, name: e.target.value})); setAddError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 text-sm font-medium dark:text-white"
                    placeholder="e.g. Mohammad Ali" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t.username}</label>
                  <input required type="text" value={addForm.username} onChange={e => { setAddForm(p => ({...p, username: e.target.value})); setAddError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 text-sm font-medium dark:text-white"
                    placeholder="e.g. john_driver" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t.email}</label>
                  <input required type="email" value={addForm.email} onChange={e => { setAddForm(p => ({...p, email: e.target.value})); setAddError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 text-sm font-medium dark:text-white"
                    placeholder="user@doelbus.com" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t.password}</label>
                  <input required type="password" value={addForm.password} onChange={e => { setAddForm(p => ({...p, password: e.target.value})); setAddError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 text-sm font-medium dark:text-white"
                    placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Role</label>
                  <select value={addForm.role} onChange={e => {
                    const r = e.target.value as AppRole;
                    setAddForm(p => ({...p, role: r}));
                    setAddPermissions(getDefaultModules(r));
                  }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 text-sm font-medium dark:text-white">
                    {ROLES.map(role => <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>

              <ModuleCheckboxGrid selected={addPermissions} onChange={setAddPermissions} role={addForm.role} />

              {/* Approval toggle */}
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setAddForm(p => ({...p, isApproved: !p.isApproved}))}
                  className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${addForm.isApproved ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${addForm.isApproved ? 'left-[calc(100%-22px)]' : 'left-0.5'}`} />
                </button>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {addForm.isApproved
                    ? (lang === 'en' ? 'Approved — can login immediately' : 'অনুমোদিত — এখনই লগইন করতে পারবেন')
                    : (lang === 'en' ? 'Pending — requires approval' : 'অপেক্ষমাণ — অনুমোদন প্রয়োজন')}
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm">
                  {lang === 'en' ? 'Cancel' : 'বাতিল'}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm disabled:opacity-60">
                  {saving ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-user-plus mr-2"></i>}
                  {lang === 'en' ? 'Create User' : 'তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          EDIT USER MODAL
      ════════════════════════════════════════ */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 my-4">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">{lang === 'en' ? 'Edit User' : 'তথ্য সম্পাদনা'}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {editUser.id}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation"></i> {editError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Name <span className="text-slate-300 font-medium normal-case">(optional)</span></label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 text-sm font-medium dark:text-white"
                    placeholder="e.g. Mohammad Ali" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t.username}</label>
                  <input required type="text" value={editForm.username} onChange={e => setEditForm(p => ({...p, username: e.target.value}))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 text-sm font-medium dark:text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t.email}</label>
                  <input required type="email" value={editForm.email} onChange={e => setEditForm(p => ({...p, email: e.target.value}))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 text-sm font-medium dark:text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    {lang === 'en' ? 'New Password' : 'নতুন পাসওয়ার্ড'}
                    <span className="ml-1 text-slate-300 normal-case font-medium">{lang === 'en' ? '(leave blank to keep)' : '(খালি রাখলে পরিবর্তন হবে না)'}</span>
                  </label>
                  <input type="password" value={editForm.password} onChange={e => setEditForm(p => ({...p, password: e.target.value}))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 text-sm font-medium dark:text-white"
                    placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Role</label>
                  <select value={editForm.role} onChange={e => {
                    const r = e.target.value as AppRole;
                    setEditForm(p => ({...p, role: r}));
                    setEditPermissions(getDefaultModules(r));
                  }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 text-sm font-medium dark:text-white">
                    {ROLES.map(role => <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>

              <ModuleCheckboxGrid selected={editPermissions} onChange={setEditPermissions} role={editForm.role} />

              {/* Approval toggle */}
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setEditForm(p => ({...p, isApproved: !p.isApproved}))}
                  className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${editForm.isApproved ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${editForm.isApproved ? 'left-[calc(100%-22px)]' : 'left-0.5'}`} />
                </button>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {editForm.isApproved ? (lang === 'en' ? 'Account Approved' : 'অনুমোদিত') : (lang === 'en' ? 'Pending Approval' : 'অপেক্ষমাণ')}
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditUser(null)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm">
                  {lang === 'en' ? 'Cancel' : 'বাতিল'}
                </button>
                <button type="submit" disabled={editSaving}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all text-sm disabled:opacity-60">
                  {editSaving ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-floppy-disk mr-2"></i>}
                  {lang === 'en' ? 'Save Changes' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          VIEW USER MODAL
      ════════════════════════════════════════ */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[88vh]">

            {/* ── Sticky Header ── */}
            <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
              {/* drag handle on mobile */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full sm:hidden" />

              <div
                onClick={() => viewUser.profilePhoto && setPreviewImage(viewUser.profilePhoto)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black overflow-hidden flex-shrink-0 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 transition-all
                  ${viewUser.role === AppRole.SUPER_ADMIN ? 'bg-amber-100 text-amber-600 ring-amber-300 dark:ring-amber-700' : 'bg-blue-100 text-blue-600 ring-blue-200 dark:ring-blue-800'}
                  ${viewUser.profilePhoto ? 'cursor-pointer hover:ring-blue-400 dark:hover:ring-blue-500' : ''}`}
              >
                {viewUser.profilePhoto
                  ? <img src={viewUser.profilePhoto} className="w-full h-full object-cover" />
                  : viewUser.username.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-black text-base text-slate-900 dark:text-white truncate leading-tight">{viewUser.name || viewUser.username}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold truncate">@{viewUser.username}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${roleColor[viewUser.role] || 'bg-slate-100 text-slate-600'}`}>
                    {viewUser.role.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setViewUser(null)}
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-all"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-6 space-y-5">

                {/* Info rows */}
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    ...(viewUser.name ? [{ icon: 'fa-user', label: 'Name', value: viewUser.name }] : []),
                    { icon: 'fa-envelope', label: 'Email', value: viewUser.email },
                    { icon: 'fa-id-badge', label: 'User ID', value: viewUser.id },
                    { icon: 'fa-calendar', label: lang === 'en' ? 'Created' : 'তৈরির তারিখ', value: viewUser.createdAt },
                    {
                      icon: 'fa-circle-check',
                      label: lang === 'en' ? 'Status' : 'স্ট্যাটাস',
                      value: viewUser.isApproved
                        ? (lang === 'en' ? 'Approved' : 'অনুমোদিত')
                        : (lang === 'en' ? 'Pending' : 'অপেক্ষমাণ'),
                      accent: viewUser.isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                    },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <i className={`fa-solid ${row.icon} text-[10px] text-slate-500`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{row.label}</p>
                        <p className={`text-sm font-bold mt-0.5 truncate ${(row as any).accent || 'text-slate-900 dark:text-white'}`}>{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Accessible modules */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                    {lang === 'en' ? 'Accessible Modules' : 'অ্যাক্সেসযোগ্য মডিউল'}
                    <span className="ml-1.5 text-blue-500">
                      ({(viewUser.permissions && viewUser.permissions.length > 0 ? viewUser.permissions : getDefaultModules(viewUser.role)).length})
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(viewUser.permissions && viewUser.permissions.length > 0
                      ? viewUser.permissions
                      : getDefaultModules(viewUser.role)
                    ).map(key => (
                      <span key={key} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[9px] font-black uppercase rounded-lg">
                        {MODULE_LABELS[key] || key}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Profile Photo (large) */}
                {viewUser.profilePhoto && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Profile Photo</p>
                    <div
                      onClick={() => setPreviewImage(viewUser.profilePhoto!)}
                      className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 cursor-pointer relative group shadow-sm"
                    >
                      <img src={viewUser.profilePhoto} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-2xl">
                        <i className="fa-solid fa-magnifying-glass"></i>
                      </div>
                    </div>
                  </div>
                )}

                {/* NID / License */}
                {viewUser.nidPhoto && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">NID / License</p>
                    <div
                      onClick={() => setPreviewImage(viewUser.nidPhoto!)}
                      className="aspect-video rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 cursor-pointer relative group shadow-sm"
                    >
                      <img src={viewUser.nidPhoto} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <i className="fa-solid fa-magnifying-glass text-2xl"></i>
                      </div>
                    </div>
                  </div>
                )}

                {/* bottom padding so content clears the sticky footer */}
                <div className="h-1" />
              </div>
            </div>

            {/* ── Sticky Footer ── */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3">
              {viewUser.role !== AppRole.SUPER_ADMIN && (
                <button
                  onClick={() => { setViewUser(null); openEdit(viewUser); }}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-white font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all text-sm"
                >
                  <i className="fa-solid fa-pen-to-square mr-2"></i>
                  {lang === 'en' ? 'Edit' : 'সম্পাদনা'}
                </button>
              )}
              <button
                onClick={() => setViewUser(null)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 font-black rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-sm text-slate-600 dark:text-slate-300"
              >
                {lang === 'en' ? 'Close' : 'বন্ধ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          DELETE CONFIRM
      ════════════════════════════════════════ */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-5">
              <i className="fa-solid fa-trash text-2xl"></i>
            </div>
            <h3 className="text-lg font-black uppercase">{lang === 'en' ? 'Delete User?' : 'ব্যবহারকারী মুছবেন?'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
              {lang === 'en' ? 'This cannot be undone.' : 'এটি পূর্বাবস্থায় ফেরানো যাবে না।'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 font-black rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm">
                {lang === 'en' ? 'Cancel' : 'বাতিল'}
              </button>
              <button onClick={() => { onDeleteUser(deleteId); setDeleteId(null); }}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl shadow-lg shadow-rose-500/20 transition-all text-sm">
                {lang === 'en' ? 'Delete' : 'মুছুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-2xl shadow-2xl"
            alt="Preview"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
            onClick={() => setPreviewImage(null)}
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
