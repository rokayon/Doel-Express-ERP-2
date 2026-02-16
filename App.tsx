
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Finance from './components/Finance';
import HR from './components/HR';
import Scheduling from './components/Scheduling';
import Maintenance from './components/Maintenance';
import Reports from './components/Reports';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';
import TicketSalesRecordComponent from './components/TicketSalesRecord';
import CoachRegister from './components/CoachRegister';
import { MOCK_TRIPS, MOCK_FINANCE, MOCK_INVENTORY, MOCK_STAFF, MOCK_TICKET_SALES, MOCK_COUNTERS, MOCK_COACHES } from './constants';
import { Trip, Transaction, InventoryItem, Staff, User, AppRole, TicketSalesRecord, Counter, Coach } from './types';
import { Language, translations } from './translations';

const PERMISSIONS: Record<string, AppRole[]> = {
  dashboard: [AppRole.SUPER_ADMIN, AppRole.MANAGING_DIRECTOR, AppRole.DIRECTOR, AppRole.ADMIN, AppRole.ACCOUNTS, AppRole.HR, AppRole.IT, AppRole.SALES, AppRole.PURCHASE, AppRole.MARKETING, AppRole.MANAGER, AppRole.COUNTER, AppRole.DRIVER, AppRole.SUPERVISOR],
  coachRegister: [AppRole.SUPER_ADMIN, AppRole.ADMIN, AppRole.MANAGING_DIRECTOR, AppRole.DIRECTOR, AppRole.MANAGER],
  ticketSalesRecord: [AppRole.SUPER_ADMIN, AppRole.ADMIN, AppRole.MANAGING_DIRECTOR, AppRole.DIRECTOR, AppRole.ACCOUNTS, AppRole.MANAGER, AppRole.COUNTER],
  scheduling: [AppRole.SUPER_ADMIN, AppRole.MANAGING_DIRECTOR, AppRole.DIRECTOR, AppRole.MANAGER, AppRole.ADMIN, AppRole.IT, AppRole.SUPERVISOR],
  inventory: [AppRole.SUPER_ADMIN, AppRole.MANAGING_DIRECTOR, AppRole.DIRECTOR, AppRole.PURCHASE, AppRole.ADMIN, AppRole.SUPERVISOR],
  finance: [AppRole.SUPER_ADMIN, AppRole.MANAGING_DIRECTOR, AppRole.DIRECTOR, AppRole.ACCOUNTS],
  hr: [AppRole.SUPER_ADMIN, AppRole.MANAGING_DIRECTOR, AppRole.DIRECTOR, AppRole.HR, AppRole.MANAGER],
  maintenance: [AppRole.SUPER_ADMIN, AppRole.MANAGING_DIRECTOR, AppRole.DIRECTOR, AppRole.IT, AppRole.ADMIN, AppRole.SUPERVISOR],
  reports: [AppRole.SUPER_ADMIN, AppRole.MANAGING_DIRECTOR, AppRole.DIRECTOR, AppRole.ACCOUNTS, AppRole.MARKETING, AppRole.MANAGER, AppRole.SUPERVISOR],
  settings: [AppRole.SUPER_ADMIN, AppRole.IT, AppRole.MANAGING_DIRECTOR, AppRole.DIRECTOR, AppRole.ADMIN, AppRole.ACCOUNTS, AppRole.HR, AppRole.SALES, AppRole.PURCHASE, AppRole.MARKETING, AppRole.MANAGER, AppRole.COUNTER, AppRole.DRIVER, AppRole.SUPERVISOR],
  userManagement: [AppRole.SUPER_ADMIN, AppRole.IT]
};

const DEFAULT_LOGO = "https://files.oaiusercontent.com/file-jI6tY5R4u3E2W1Q0P9O8N7M6?se=2025-02-21T12%3A02%3A34Z&sp=r&sv=2024-08-04&sr=b&rscc=max-age%3D604800%2C%20immutable%2C%20private&rscd=attachment%3B%20filename%3D7f7e9b2a-1e3d-4c5b-8a9c-0d1e2f3g4h5i.webp&sig=m2XF8%2B7j/QW3o0RNo8/8GzQJ2/G/Xf/P0VqO8x8r7Y%3D";

const App: React.FC = () => {
  const savedUser = localStorage.getItem('doel_user');
  const savedLang = localStorage.getItem('doel_lang') as Language;
  const savedTheme = localStorage.getItem('doel_theme') === 'dark';
  const savedSiteName = localStorage.getItem('doel_site_name') || 'Doel Express';
  const savedSiteLogo = localStorage.getItem('doel_site_logo') || DEFAULT_LOGO;

  const [isAuthenticated, setIsAuthenticated] = useState(!!savedUser);
  const [currentUser, setCurrentUser] = useState<User | null>(savedUser ? JSON.parse(savedUser) : null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(savedTheme || false);
  const [language, setLanguage] = useState<Language>(savedLang || 'en');
  const [refreshKey, setRefreshKey] = useState(0);

  // Chaining State
  const [pendingSalesTrip, setPendingSalesTrip] = useState<Trip | null>(null);

  // Global Branding State
  const [siteName, setSiteName] = useState(savedSiteName);
  const [siteLogo, setSiteLogo] = useState(savedSiteLogo);

  const t = translations[language];

  const [coaches, setCoaches] = useState<Coach[]>(MOCK_COACHES);
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_FINANCE);
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [staff, setStaff] = useState<Staff[]>(MOCK_STAFF);
  const [ticketSales, setTicketSales] = useState<TicketSalesRecord[]>(MOCK_TICKET_SALES);
  const [counters, setCounters] = useState<Counter[]>(MOCK_COUNTERS);
  
  const [users, setUsers] = useState<User[]>([
    { id: 'sa-001', username: 'Super admin', email: 'sa@doelexpress.com', password: '12345678', role: AppRole.SUPER_ADMIN, isApproved: true, createdAt: '2024-01-01' },
    { id: 'sv-001', username: 'Supervisor', email: 'supervisor@doelexpress.com', password: 'sv_doel_2025', role: AppRole.SUPERVISOR, isApproved: true, createdAt: '2024-05-01' },
    { id: 'it-001', username: 'IT User', email: 'it@doelexpress.com', password: 'it_doel_2025', role: AppRole.IT, isApproved: true, createdAt: '2024-01-01' },
    { id: 'dv-001', username: 'Driver User', email: 'driver@doelexpress.com', password: 'drv_doel_2025', role: AppRole.DRIVER, isApproved: true, createdAt: '2024-01-01' },
    { id: 'ad-001', username: 'Admin User', email: 'admin@doelexpress.com', password: 'admin_doel_2025', role: AppRole.ADMIN, isApproved: true, createdAt: '2024-01-01' },
  ]);

  useEffect(() => {
    localStorage.setItem('doel_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('doel_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('doel_site_name', siteName);
    localStorage.setItem('doel_site_logo', siteLogo);
  }, [siteName, siteLogo]);

  const handleLogin = (username: string, password?: string) => {
    const user = users.find(u => u.username === username);
    if (user && user.isApproved) {
      if (user.password && user.password !== password) return false;
      setCurrentUser(user);
      setIsAuthenticated(true);
      setActiveTab('dashboard');
      localStorage.setItem('doel_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const handleSignUp = (username: string, email: string, password?: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      email,
      password,
      role: AppRole.COUNTER,
      isApproved: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setUsers(prev => [...prev, newUser]);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('doel_user');
  };

  const updateUserInfo = (userId: string, updates: Partial<User>) => {
    if (userId === 'sa-001' && updates.role && updates.role !== AppRole.SUPER_ADMIN) return;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser?.id === userId) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem('doel_user', JSON.stringify(updatedUser));
    }
  };

  const handleUpdateCurrentUser = (updates: Partial<User>) => {
    if (currentUser) {
      updateUserInfo(currentUser.id, updates);
    }
  };

  const handleUpdateBranding = (name: string, logo: string) => {
    setSiteName(name);
    setSiteLogo(logo);
  };

  // Finance Handlers
  const addTransaction = (tx: Transaction) => setTransactions(prev => [tx, ...prev]);
  const updateTransaction = (id: string, updates: Transaction) => setTransactions(prev => prev.map(tx => tx.id === id ? updates : tx));
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(tx => tx.id !== id));

  // Trip Handlers
  const addTrip = (trip: Trip) => setTrips(prev => [trip, ...prev]);
  const updateTrip = (id: string, updates: Trip) => setTrips(prev => prev.map(t => t.id === id ? updates : t));
  const deleteTrip = (id: string) => setTrips(prev => prev.filter(t => t.id !== id));

  // Inventory Handlers
  const addInventory = (item: InventoryItem) => setInventory(prev => [item, ...prev]);
  const updateInventory = (id: string, updates: InventoryItem) => setInventory(prev => prev.map(i => i.id === id ? updates : i));
  const deleteInventory = (id: string) => setInventory(prev => prev.filter(i => i.id !== id));
  
  // Staff Handlers
  const addStaff = (member: Staff) => setStaff(prev => [member, ...prev]);
  const updateStaff = (id: string, updates: Staff) => setStaff(prev => prev.map(s => s.id === id ? updates : s));
  const deleteStaff = (id: string) => setStaff(prev => prev.filter(s => s.id !== id));
  
  // Coach Handlers
  const addCoach = (coach: Coach) => setCoaches(prev => [coach, ...prev]);
  const updateCoach = (id: string, updates: Coach) => setCoaches(prev => prev.map(c => c.id === id ? updates : c));
  const deleteCoach = (id: string) => setCoaches(prev => prev.filter(c => c.id !== id));

  // Counter Handlers
  const addCounter = (counter: Counter) => setCounters(prev => [counter, ...prev]);
  const updateCounter = (id: string, updates: Partial<Counter>) => setCounters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  const deleteCounter = (id: string) => setCounters(prev => prev.filter(c => c.id !== id));

  const adjustInventoryStock = (itemId: string, amount: number) => {
    setInventory(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, stock: Math.max(0, item.stock - amount), lastUpdated: new Date().toISOString().split('T')[0] } 
        : item
    ));
  };

  // Ticket Sales Handlers
  const addTicketRecord = (record: TicketSalesRecord) => {
    setTicketSales(prev => [record, ...prev]);
    const incomeTx: Transaction = {
      id: `TX-INC-${record.id}`,
      date: record.date,
      type: 'Income',
      category: 'Ticket Sales',
      amount: record.totalTaka,
      description: `Trip Income: ${record.regNo} (Coach: ${record.coachNo})`
    };
    const expenseTx: Transaction = {
      id: `TX-EXP-${record.id}`,
      date: record.date,
      type: 'Expense',
      category: 'Trip Operating Cost',
      amount: record.totalCost,
      description: `Trip Cost: ${record.regNo} (Fuel + Exp)`
    };
    setTransactions(prev => [incomeTx, expenseTx, ...prev]);
  };

  const updateTicketRecord = (id: string, updates: TicketSalesRecord) => {
    setTicketSales(prev => prev.map(r => r.id === id ? updates : r));
    setTransactions(prev => prev.map(tx => {
      if (tx.id === `TX-INC-${id}`) {
        return {
          ...tx,
          amount: updates.totalTaka,
          description: `Trip Income: ${updates.regNo} (Coach: ${updates.coachNo})`
        };
      }
      if (tx.id === `TX-EXP-${id}`) {
        return {
          ...tx,
          amount: updates.totalCost,
          description: `Trip Cost: ${updates.regNo} (Fuel + Exp)`
        };
      }
      return tx;
    }));
  };

  const deleteTicketRecord = (id: string) => {
    setTicketSales(prev => prev.filter(r => r.id !== id));
    // Also cleanup linked transactions if any
    setTransactions(prev => prev.filter(tx => tx.id !== `TX-INC-${id}` && tx.id !== `TX-EXP-${id}`));
  };

  const finalizeTripIntoSales = (trip: Trip) => {
    setPendingSalesTrip(trip);
    setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'Completed' } : t));
    setActiveTab('ticketSalesRecord');
  };

  const handleDataReset = () => {
    if (currentUser?.role !== AppRole.SUPER_ADMIN) return;
    setTrips(MOCK_TRIPS);
    setTransactions(MOCK_FINANCE);
    setInventory(MOCK_INVENTORY);
    setStaff(MOCK_STAFF);
    setTicketSales(MOCK_TICKET_SALES);
    setCounters(MOCK_COUNTERS);
    setCoaches(MOCK_COACHES);
    setSiteName('Doel Express');
    setSiteLogo(DEFAULT_LOGO);
  };

  const hasPermission = (tab: string) => {
    if (!currentUser) return false;
    const allowedRoles = PERMISSIONS[tab];
    return allowedRoles ? allowedRoles.includes(currentUser.role) : false;
  };

  const triggerAiRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        language={language} 
        onLanguageToggle={() => setLanguage(language === 'en' ? 'bn' : 'en')}
        isDarkMode={isDarkMode}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        siteName={siteName}
        siteLogo={siteLogo}
      />
    );
  }

  const renderContent = () => {
    if (!hasPermission(activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4 text-center">
           <div className="w-20 h-20 sm:w-24 sm:h-24 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 border border-rose-500/20">
              <i className="fa-solid fa-lock text-3xl sm:text-4xl"></i>
           </div>
           <div className="max-w-xs">
             <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{t.accessDenied}</h2>
             <p className="text-sm text-slate-500 mt-2">Authorization required for this module.</p>
           </div>
           <button onClick={() => setActiveTab('dashboard')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
             Return to Dashboard
           </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard trips={trips} transactions={transactions} staff={staff} ticketSales={ticketSales} lang={language} onRefreshAi={triggerAiRefresh} aiKey={refreshKey} />;
      case 'coachRegister': return <CoachRegister coaches={coaches} onAdd={addCoach} onUpdate={updateCoach} onRemove={deleteCoach} lang={language} userRole={currentUser?.role} />;
      case 'ticketSalesRecord': return (
        <TicketSalesRecordComponent 
          records={ticketSales} 
          trips={trips} 
          staff={staff} 
          coaches={coaches} 
          onAdd={addTicketRecord} 
          onUpdate={updateTicketRecord} 
          onDelete={deleteTicketRecord}
          lang={language} 
          userRole={currentUser?.role}
          prefillTrip={pendingSalesTrip}
          onClearPrefill={() => setPendingSalesTrip(null)}
        />
      );
      case 'inventory': return <Inventory inventory={inventory} onAdd={addInventory} onUpdate={updateInventory} onDelete={deleteInventory} lang={language} />;
      case 'finance': return <Finance transactions={transactions} onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction} lang={language} />;
      case 'hr': return <HR staff={staff} onAdd={addStaff} onUpdate={updateStaff} onDelete={deleteStaff} lang={language} />;
      case 'scheduling': return <Scheduling trips={trips} staff={staff} coaches={coaches} onAdd={addTrip} onUpdate={updateTrip} onDelete={deleteTrip} onFinalize={finalizeTripIntoSales} lang={language} />;
      case 'maintenance': return <Maintenance trips={trips} inventory={inventory} onUseInventory={adjustInventoryStock} lang={language} />;
      case 'reports': return <Reports trips={trips} transactions={transactions} staff={staff} lang={language} />;
      case 'userManagement': return <UserManagement users={users} onUpdateUser={updateUserInfo} lang={language} />;
      case 'settings': return (
        <Settings 
          lang={language} 
          user={currentUser} 
          onUpdateProfile={handleUpdateCurrentUser} 
          userRole={currentUser?.role} 
          onResetData={handleDataReset}
          siteName={siteName}
          siteLogo={siteLogo}
          onUpdateBranding={handleUpdateBranding}
        />
      );
      default: return <Dashboard trips={trips} transactions={transactions} staff={staff} ticketSales={ticketSales} lang={language} />;
    }
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        lang={language}
        onLogout={handleLogout}
        userRole={currentUser?.role}
        hasPermission={hasPermission}
        siteName={siteName}
        siteLogo={siteLogo}
      />

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                <i className="fa-solid fa-bars-staggered text-lg sm:text-xl"></i>
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="lg:hidden w-8 h-8 rounded-full overflow-hidden bg-white border shadow-sm">
                  <img src={siteLogo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="hidden xs:block">{siteName}</span>
                  <i className="fa-solid fa-chevron-right text-[7px] opacity-30 hidden xs:block"></i>
                  <span className="text-blue-600 dark:text-blue-400">{(t as any)[activeTab]}</span>
                </div>
              </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4">
            <button onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')} className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm font-bold text-[10px] sm:text-xs">
              <i className="fa-solid fa-globe"></i>
              <span className="hidden xs:block">{language === 'en' ? 'BN' : 'EN'}</span>
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
              <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-500'} text-base sm:text-lg`}></i>
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden xs:block mx-1"></div>
            <div className="flex items-center gap-2 sm:gap-3">
               <div className="hidden md:block text-right">
                  <p className={`text-xs font-black uppercase tracking-widest ${currentUser?.role === AppRole.SUPER_ADMIN ? 'text-amber-500' : 'text-blue-500'}`}>
                    {currentUser?.username.split(' ')[0]}
                  </p>
               </div>
               <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${currentUser?.role === AppRole.SUPER_ADMIN ? 'bg-amber-500 shadow-amber-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>
                  {currentUser?.profilePhoto ? (
                     <img src={currentUser.profilePhoto} className="w-full h-full object-cover rounded-xl" alt="P" />
                  ) : (
                     <i className={`fa-solid ${currentUser?.role === AppRole.SUPER_ADMIN ? 'fa-crown text-sm' : 'fa-user-shield text-sm'}`}></i>
                  )}
               </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          {renderContent()}
        </div>

        <footer className="mt-auto py-5 px-8 border-t border-slate-100 dark:border-slate-800 flex justify-center items-center">
          <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] sm:tracking-[0.4em] text-center">
            Designed by <span className="text-blue-600 dark:text-blue-400 italic">Zojon Digital Solutions</span>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
