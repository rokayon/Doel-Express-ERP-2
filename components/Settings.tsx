
import React, { useState, useRef } from 'react';
import { Language, translations } from '../translations';
import { AppRole, User } from '../types';

interface SettingsProps {
  lang: Language;
  user: User | null;
  onUpdateProfile: (updates: Partial<User>) => void;
  userRole?: AppRole;
  onResetData: () => void;
  siteName: string;
  siteLogo: string;
  onUpdateBranding: (name: string, logo: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  lang, 
  user, 
  onUpdateProfile, 
  userRole, 
  onResetData,
  siteName,
  siteLogo,
  onUpdateBranding
}) => {
  const t = translations[lang];
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  // Branding States
  const [tempSiteName, setTempSiteName] = useState(siteName);
  const [tempSiteLogo, setTempSiteLogo] = useState(siteLogo);
  const [brandingSaved, setBrandingSaved] = useState(false);

  // Refs for hidden inputs
  const profileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const brandingLogoRef = useRef<HTMLInputElement>(null);

  // Name edit
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [nameSaved, setNameSaved] = useState(false);

  const handleNameSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ name: nameValue.trim() || undefined });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [maintenanceReminders, setMaintenanceReminders] = useState(true);

  // Password Change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 2FA
  const [twoFactorActive, setTwoFactorActive] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  const handleReset = () => {
    onResetData();
    setResetDone(true);
    setShowConfirm(false);
    setTimeout(() => setResetDone(false), 3000);
  };

  const handleBrandingUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBranding(tempSiteName, tempSiteLogo);
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 3000);
  };

  const handleBrandingLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSiteLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [passwordError, setPasswordError] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!passwordForm.current.trim()) {
      setPasswordError(lang === 'en' ? 'Current password is required.' : 'বর্তমান পাসওয়ার্ড আবশ্যক।');
      setPasswordStatus('error');
      return;
    }
    if (passwordForm.next.length < 6) {
      setPasswordError(lang === 'en' ? 'New password must be at least 6 characters.' : 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      setPasswordStatus('error');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError(lang === 'en' ? 'New passwords do not match.' : 'নতুন পাসওয়ার্ড মিলছে না।');
      setPasswordStatus('error');
      return;
    }
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': userRole || '', 'x-user-id': user.id },
        body: JSON.stringify({ currentPassword: passwordForm.current, password: passwordForm.next })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setPasswordStatus('success');
        setPasswordError('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordStatus('idle');
          setPasswordForm({ current: '', next: '', confirm: '' });
        }, 2500);
      } else {
        setPasswordError(data.message || (lang === 'en' ? 'Current password is incorrect.' : 'বর্তমান পাসওয়ার্ড ভুল।'));
        setPasswordStatus('error');
      }
    } catch {
      setPasswordError(lang === 'en' ? 'Network error. Please try again.' : 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
      setPasswordStatus('error');
    }
  };

  const toggle2FA = () => {
    if (!twoFactorActive) {
      setShow2FAModal(true);
    } else {
      setTwoFactorActive(false);
    }
  };

  const finish2FASetup = () => {
    setTwoFactorActive(true);
    setShow2FAModal(false);
  };

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('no ctx')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = url;
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePhoto' | 'nidPhoto') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPhoto = field === 'profilePhoto';
    try {
      const compressed = await compressImage(file, isPhoto ? 800 : 1600, isPhoto ? 0.75 : 0.80);
      onUpdateProfile({ [field]: compressed });
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateProfile({ [field]: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const isDriver = userRole === AppRole.DRIVER;
  const canManageBranding = userRole === AppRole.SUPER_ADMIN || userRole === AppRole.IT;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.settings}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{lang === 'en' ? 'Configure core operational parameters and system security' : 'কোর অপারেশনাল প্যারামিটার এবং সিস্টেম নিরাপত্তা কনফিগার করুন'}</p>
        </div>
        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
           <i className="fa-solid fa-gears text-xl"></i>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
         <div className="flex flex-col md:flex-row gap-10">
            <div className="flex flex-col items-center space-y-4">
               <div className="relative group">
                  <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                     {user?.profilePhoto ? (
                        <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl font-black">
                           {user?.username.charAt(0)}
                        </div>
                     )}
                  </div>
                  <input type="file" accept="image/*" ref={profileInputRef} onChange={(e) => handleFileChange(e, 'profilePhoto')} className="hidden" />
                  <button 
                    onClick={() => profileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all border-4 border-white dark:border-slate-900"
                  >
                     <i className="fa-solid fa-camera text-xs"></i>
                  </button>
               </div>
               <div className="text-center">
                  <h3 className="font-black uppercase tracking-tight text-lg">{user?.username}</h3>
                  <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{userRole?.replace('_', ' ')}</p>
               </div>
            </div>

            <div className="flex-1 space-y-6">
               {/* Name Edit */}
               <form onSubmit={handleNameSave} className="flex items-end gap-3">
                 <div className="flex-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                     {lang === 'en' ? 'Display Name' : 'নাম'}
                   </label>
                   <input
                     type="text"
                     value={nameValue}
                     onChange={e => setNameValue(e.target.value)}
                     placeholder={lang === 'en' ? 'Your full name' : 'আপনার পুরো নাম'}
                     className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 text-sm font-medium dark:text-white"
                   />
                 </div>
                 <button type="submit" className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex-shrink-0">
                   {nameSaved ? <i className="fa-solid fa-check"></i> : (lang === 'en' ? 'Save' : 'সংরক্ষণ')}
                 </button>
               </form>

               <h3 className="text-lg font-black flex items-center gap-3">
                  <i className="fa-solid fa-id-card-clip text-blue-500"></i>
                  {lang === 'en' ? 'Identity Documents' : 'পরিচয় নথি'}
               </h3>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{isDriver ? 'Driving License' : 'National ID (NID)'}</label>
                     <input type="file" accept="image/*" ref={docInputRef} onChange={(e) => handleFileChange(e, 'nidPhoto')} className="hidden" />
                     <div 
                        onClick={() => docInputRef.current?.click()}
                        className="aspect-video bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all overflow-hidden relative group"
                     >
                        {user?.nidPhoto ? (
                           <img src={user.nidPhoto} className="w-full h-full object-cover" />
                        ) : (
                           <div className="text-center">
                              <i className={`fa-solid ${isDriver ? 'fa-id-card' : 'fa-address-card'} text-slate-300 text-3xl mb-2`}></i>
                              <p className="text-[9px] font-black text-slate-400 uppercase">Click to scan document</p>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 flex flex-col justify-center">
                     <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Verification Status</p>
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${user?.isApproved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}>
                           <i className={`fa-solid ${user?.isApproved ? 'fa-check' : 'fa-clock'}`}></i>
                        </div>
                        <div>
                           <p className="font-black text-sm uppercase">{user?.isApproved ? 'Identity Verified' : 'Under Review'}</p>
                           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                              {user?.isApproved ? 'All privileges enabled' : 'Waiting for system admin approval'}
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Branding Section - Restricted */}
      {canManageBranding && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-blue-500/20 dark:border-blue-500/10 shadow-sm relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="mb-8">
            <h3 className="text-lg font-black flex items-center gap-3">
              <i className="fa-solid fa-palette text-blue-500"></i>
              {t.brandingIdentity}
            </h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Global branding control for the ERP ecosystem</p>
          </div>

          <form onSubmit={handleBrandingUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">{t.siteName}</label>
                   <input 
                     required
                     value={tempSiteName}
                     onChange={(e) => setTempSiteName(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 font-bold"
                     placeholder="e.g. Doel Express"
                   />
                </div>
                <div className="flex items-end gap-3">
                   <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-600/20 transition-all uppercase tracking-widest text-xs">
                      {t.updateBranding}
                   </button>
                   {brandingSaved && (
                     <div className="bg-emerald-500 text-white px-4 py-4 rounded-xl animate-in zoom-in">
                        <i className="fa-solid fa-check"></i>
                     </div>
                   )}
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">{t.siteLogo}</label>
                <div className="flex items-center gap-6">
                   <div className="w-24 h-24 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                      <img src={tempSiteLogo} className="w-full h-full object-contain p-2" alt="Logo Preview" />
                   </div>
                   <div className="flex-1">
                      <input type="file" accept="image/*" ref={brandingLogoRef} onChange={handleBrandingLogoChange} className="hidden" />
                      <button 
                        type="button"
                        onClick={() => brandingLogoRef.current?.click()}
                        className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                      >
                         <i className="fa-solid fa-upload mr-2"></i> Upload New Logo
                      </button>
                      <p className="text-[8px] text-slate-400 mt-2 italic">Recommended: Transparent PNG, 512x512px</p>
                   </div>
                </div>
             </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Preferences Section */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6 shadow-sm">
           <h3 className="text-lg font-black flex items-center gap-3">
              <i className="fa-solid fa-sliders text-blue-500"></i>
              {t.preferences}
           </h3>
           <div className="space-y-4">
              <div onClick={() => setEmailNotifications(!emailNotifications)} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                 <div>
                    <p className="text-sm font-bold">{t.emailNotifications}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black">Trip confirmations & alerts</p>
                 </div>
                 <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${emailNotifications ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${emailNotifications ? 'right-1' : 'right-7'}`}></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Security Section */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6 shadow-sm">
           <h3 className="text-lg font-black flex items-center gap-3">
              <i className="fa-solid fa-shield-halved text-blue-500"></i>
              {t.securitySettings}
           </h3>
           <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors text-left">
              <div>
                 <p className="text-sm font-bold">{t.changePassword}</p>
                 <p className="text-[10px] text-slate-500 uppercase font-black">Last updated 14 days ago</p>
              </div>
              <i className="fa-solid fa-chevron-right text-slate-300"></i>
           </button>
        </div>
      </div>

      {/* Danger Zone — Factory Reset */}
      {userRole === AppRole.SUPER_ADMIN && (
        <div className="mt-12 bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/60 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative shadow-sm">
          {/* Warning stripe */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-400 via-rose-600 to-rose-400 rounded-t-[2.5rem]" />

          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600">
                <i className="fa-solid fa-triangle-exclamation text-xl"></i>
              </div>
              <div>
                <h4 className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {lang === 'en' ? 'Factory Reset' : 'ফ্যাক্টরি রিসেট'}
                </h4>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Danger Zone</p>
              </div>
            </div>

            <p className="text-slate-700 dark:text-slate-300 font-semibold mb-5 text-sm leading-relaxed">
              {lang === 'en'
                ? 'This will permanently DELETE all data from every module. The system will return to a completely blank state.'
                : 'এটি সকল মডিউলের সমস্ত ডেটা স্থায়ীভাবে মুছে ফেলবে। সিস্টেম সম্পূর্ণ ফাঁকা অবস্থায় ফিরে আসবে।'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
              {[
                {label: 'Fleet & Schedule', icon: 'fa-bus-simple'},
                {label: 'Sales Record', icon: 'fa-ticket'},
                {label: 'Counters', icon: 'fa-shop'},
                {label: 'Inventory', icon: 'fa-boxes-stacked'},
                {label: 'Finance', icon: 'fa-money-bill-transfer'},
                {label: 'HR / Staff', icon: 'fa-users-gear'},
                {label: 'Maintenance', icon: 'fa-wrench'},
                {label: 'Reports', icon: 'fa-file-contract'},
                {label: 'Dashboard', icon: 'fa-chart-line'},
              ].map(m => (
                <div key={m.label} className="flex items-center gap-1.5 text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider bg-rose-100/60 dark:bg-rose-900/20 px-2.5 py-1.5 rounded-xl">
                  <i className={`fa-solid ${m.icon} text-[9px]`}></i> {m.label}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-8 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
              <i className="fa-solid fa-shield-check text-blue-500"></i>
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                {lang === 'en'
                  ? 'Admin Control → Manage Users data is SAFE and will NOT be deleted.'
                  : 'Admin Control → Manage Users এর সকল ব্যবহারকারী সুরক্ষিত থাকবে।'}
              </p>
            </div>

            {resetDone ? (
              <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 w-fit">
                <i className="fa-solid fa-check text-xl"></i>
                {lang === 'en' ? 'Factory Reset Complete!' : 'ফ্যাক্টরি রিসেট সম্পন্ন!'}
              </div>
            ) : showConfirm ? (
              <div className="space-y-4">
                <div className="p-4 bg-rose-100 dark:bg-rose-900/30 rounded-2xl border border-rose-200 dark:border-rose-800">
                  <p className="text-sm font-black text-rose-700 dark:text-rose-300 text-center">
                    {lang === 'en'
                      ? '⚠️ Are you absolutely sure? This CANNOT be undone!'
                      : '⚠️ আপনি কি নিশ্চিত? এটি পূর্বাবস্থায় ফেরানো যাবে না!'}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button onClick={handleReset}
                    className="flex-1 px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-xl shadow-rose-600/30 uppercase tracking-widest text-xs transition-all active:scale-95">
                    <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                    {lang === 'en' ? 'Yes, Delete Everything' : 'হ্যাঁ, সব মুছুন'}
                  </button>
                  <button onClick={() => setShowConfirm(false)}
                    className="flex-1 px-6 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-2xl border border-slate-200 dark:border-slate-700 transition-all uppercase tracking-widest text-xs hover:bg-slate-50">
                    {lang === 'en' ? 'Cancel' : 'বাতিল'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowConfirm(true)}
                className="px-8 py-4 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-black rounded-2xl border-2 border-rose-300 dark:border-rose-800 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-700 dark:hover:text-white hover:border-rose-600 transition-all uppercase tracking-widest text-xs shadow-sm">
                <i className="fa-solid fa-rotate-left mr-2"></i>
                {lang === 'en' ? 'Initiate Factory Reset' : 'ফ্যাক্টরি রিসেট শুরু করুন'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden scale-in animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-lg font-black uppercase tracking-tight">{t.changePassword}</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-8 space-y-5">
              {passwordStatus === 'success' ? (
                <div className="py-12 text-center space-y-4 animate-in zoom-in">
                   <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                      <i className="fa-solid fa-check"></i>
                   </div>
                   <p className="font-black text-emerald-600 text-lg">{lang === 'en' ? 'Password Updated!' : 'পাসওয়ার্ড পরিবর্তন সফল!'}</p>
                   <p className="text-sm text-slate-500">{lang === 'en' ? 'Your new password is now active. Old password can no longer be used.' : 'নতুন পাসওয়ার্ড সক্রিয় হয়েছে। পুরনো পাসওয়ার্ড আর কাজ করবে না।'}</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-widest">{lang === 'en' ? 'Current Password' : 'বর্তমান পাসওয়ার্ড'} <span className="text-rose-500">*</span></label>
                    <input required type="password" value={passwordForm.current} onChange={e => { setPasswordForm({...passwordForm, current: e.target.value}); setPasswordStatus('idle'); setPasswordError(''); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-widest">{lang === 'en' ? 'New Password' : 'নতুন পাসওয়ার্ড'} <span className="text-rose-500">*</span></label>
                    <input required type="password" value={passwordForm.next} onChange={e => { setPasswordForm({...passwordForm, next: e.target.value}); setPasswordStatus('idle'); setPasswordError(''); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-widest">{lang === 'en' ? 'Confirm New Password' : 'নতুন পাসওয়ার্ড নিশ্চিত করুন'} <span className="text-rose-500">*</span></label>
                    <input required type="password" value={passwordForm.confirm} onChange={e => { setPasswordForm({...passwordForm, confirm: e.target.value}); setPasswordStatus('idle'); setPasswordError(''); }} className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white ${passwordStatus === 'error' ? 'border-rose-500' : 'border-slate-200 hover:border-blue-400 dark:border-slate-700 dark:hover:border-blue-400'}`} />
                  </div>
                  {passwordError && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 rounded-xl animate-in slide-in-from-top-1">
                      <i className="fa-solid fa-triangle-exclamation text-rose-500 text-sm flex-shrink-0"></i>
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{passwordError}</p>
                    </div>
                  )}
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-xl transition-all uppercase tracking-widest text-xs mt-2 active:scale-[0.98]">
                    <i className="fa-solid fa-lock mr-2"></i>{lang === 'en' ? 'Update Password' : 'পাসওয়ার্ড আপডেট করুন'}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
