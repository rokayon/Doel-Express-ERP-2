
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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordStatus('error');
      return;
    }
    setPasswordStatus('success');
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordStatus('idle');
      setPasswordForm({ current: '', next: '', confirm: '' });
    }, 2000);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePhoto' | 'nidPhoto') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfile({ [field]: reader.result as string });
      };
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
                     className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
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

      {/* Danger Zone */}
      {userRole === AppRole.SUPER_ADMIN && (
        <div className="mt-12 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative shadow-sm">
          <div className="max-w-2xl">
            <h4 className="text-2xl font-black mb-4 text-slate-900 dark:text-white">Data Reset</h4>
            <p className="text-slate-600 dark:text-slate-400 font-medium mb-8">This will restore the ERP to its default state, including factory branding.</p>
            {resetDone ? (
              <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 w-fit animate-in zoom-in">
                 <i className="fa-solid fa-check text-xl"></i> Successful
              </div>
            ) : showConfirm ? (
              <div className="flex gap-4">
                <button onClick={handleReset} className="px-8 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">Confirm Reset</button>
                <button onClick={() => setShowConfirm(false)} className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-2xl border transition-all uppercase tracking-widest text-xs">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowConfirm(true)} className="px-8 py-4 bg-white dark:bg-slate-900 text-rose-600 font-black rounded-2xl border-2 border-rose-200 hover:bg-rose-50 transition-all uppercase tracking-widest text-xs">Initiate Factory Reset</button>
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
                   <p className="font-bold text-emerald-600">Password Updated!</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-widest">New Password</label>
                    <input required type="password" value={passwordForm.next} onChange={e => setPasswordForm({...passwordForm, next: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-widest">Confirm Password</label>
                    <input required type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none ${passwordStatus === 'error' ? 'border-rose-500' : 'border-slate-200'}`} />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-xl transition-all uppercase tracking-widest text-xs mt-4">Update Security</button>
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
