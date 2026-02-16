
import React from 'react';
import { NAV_ITEMS } from '../constants';
import { Language, translations } from '../translations';
import Logo from './Logo';
import { AppRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  lang: Language;
  onLogout?: () => void;
  userRole?: AppRole;
  hasPermission: (tab: string) => boolean;
  siteName: string;
  siteLogo: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen, 
  lang, 
  onLogout, 
  userRole, 
  hasPermission,
  siteName,
  siteLogo
}) => {
  const t = translations[lang];
  const visibleNavItems = NAV_ITEMS.filter(item => hasPermission(item.id));
  
  const nameParts = siteName.split(' ');
  const firstPart = nameParts[0];
  const restPart = nameParts.slice(1).join(' ');

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 bg-slate-900 dark:bg-slate-950 text-white w-[260px] z-[70] transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r border-slate-800 flex flex-col shadow-2xl`}>
        {/* Mobile Header with Close Button */}
        <div className="lg:hidden flex items-center justify-between p-6 border-b border-white/5">
          <Logo className="w-10 h-10" variant="dark" siteLogo={siteLogo} siteName={siteName} />
          <button 
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 bg-white/5 text-white rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition-all"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="hidden lg:flex p-10 flex-col items-center gap-4 text-center">
          <Logo className="w-16 h-16" variant="dark" siteLogo={siteLogo} siteName={siteName} />
          <div>
            <h1 className="text-xl font-black italic uppercase text-white leading-tight">
              {firstPart} <span className="text-blue-500">{restPart}</span>
            </h1>
            <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.4em] mt-1">Fleet Engine v2.4</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-6 ml-4">Enterprise Menu</p>
          <nav className="space-y-1">
            {visibleNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`text-lg w-6 flex justify-center ${activeTab === item.id ? 'text-white' : 'text-white/30'}`}>{item.icon}</span>
                <span className="text-[13px] font-bold">{(t as any)[item.id] || item.label}</span>
              </button>
            ))}

            {(userRole === AppRole.SUPER_ADMIN || userRole === AppRole.IT) && (
              <div className="pt-6 mt-6 border-t border-white/5">
                <button
                  onClick={() => { setActiveTab('userManagement'); setIsOpen(false); }}
                  className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${
                    activeTab === 'userManagement' ? 'bg-amber-600 text-white' : 'text-white/60 hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg w-6 flex justify-center opacity-40"><i className="fa-solid fa-shield-halved"></i></span>
                  <span className="text-[13px] font-bold">{t.userManagement}</span>
                </button>
              </div>
            )}
          </nav>
        </div>

        <div className="p-6 bg-slate-900/50">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-rose-500/10 text-white/80 hover:text-rose-400 rounded-2xl text-[11px] font-black transition-all border border-white/5 hover:border-rose-500/20 uppercase tracking-widest">
             <i className="fa-solid fa-power-off"></i> {t.logout}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
