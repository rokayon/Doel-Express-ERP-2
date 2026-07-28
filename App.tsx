
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
import CounterManagement from './components/CounterManagement';
import Vouchers from './components/Vouchers';
import Bkash from './components/Bkash';
import BusBd from './components/BusBd';
import { PERMISSIONS } from './constants';
import { Trip, Transaction, InventoryItem, InventoryIssue, InventoryReceipt, Staff, User, AppRole, TicketSalesRecord, Counter, Coach, Voucher, BkashRecord, BusBdRecord } from './types';
import { Language, translations } from './translations';


const DEFAULT_LOGO = "https://files.oaiusercontent.com/file-jI6tY5R4u3E2W1Q0P9O8N7M6?se=2025-02-21T12%3A02%3A34Z&sp=r&sv=2024-08-04&sr=b&rscc=max-age%3D604800%2C%20immutable%2C%20private&rscd=attachment%3B%20filename%3D7f7e9b2a-1e3d-4c5b-8a9c-0d1e2f3g4h5i.webp&sig=m2XF8%2B7j/QW3o0RNo8/8GzQJ2/G/Xf/P0VqO8x8r7Y%3D";

const App: React.FC = () => {
  const savedUser = localStorage.getItem('doel_user');
  const savedLang = localStorage.getItem('doel_lang') as Language;
  const savedTheme = localStorage.getItem('doel_theme') === 'dark';
  const savedSiteName = localStorage.getItem('doel_site_name') || 'Doel Express';
  const savedSiteLogo = localStorage.getItem('doel_site_logo') || DEFAULT_LOGO;

  const [isAuthenticated, setIsAuthenticated] = useState(!!savedUser);
  const [currentUser, setCurrentUser] = useState<User | null>(savedUser ? JSON.parse(savedUser) : null);
  const VALID_TABS = ['dashboard','fleetManagement','ticketSalesRecord','counters','inventory','finance','hr','maintenance','reports','settings','userManagement','vouchers','bkash','busbd'];
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('doel_tab') || 'dashboard';
    return VALID_TABS.includes(saved) ? saved : 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(savedTheme || false);
  const [language, setLanguage] = useState<Language>(savedLang || 'en');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Chaining State
  const [pendingSalesTrip, setPendingSalesTrip] = useState<Trip | null>(null);

  // Global Branding State
  const [siteName, setSiteName] = useState(savedSiteName);
  const [siteLogo, setSiteLogo] = useState(savedSiteLogo);

  const t = translations[language];

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [bkashRecords, setBkashRecords] = useState<BkashRecord[]>([]);
  const [busBdRecords, setBusBdRecords] = useState<BusBdRecord[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryIssues, setInventoryIssues] = useState<InventoryIssue[]>([]);
  const [inventoryReceipts, setInventoryReceipts] = useState<InventoryReceipt[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [ticketSales, setTicketSales] = useState<TicketSalesRecord[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  
  const [users, setUsers] = useState<User[]>([]);

  // Fire-and-forget API sync helper (for non-critical background writes)
  const apiSync = useCallback((method: string, url: string, body?: any) => {
    const role = currentUser?.role || '';
    const uid = currentUser?.id || '';
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-user-role': role, 'x-user-id': uid },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }).catch(() => {});
  }, [currentUser]);

  // Awaited mutation helper — returns true on success
  const apiMutate = useCallback(async (method: string, url: string, body?: any): Promise<boolean> => {
    const role = currentUser?.role || '';
    const uid = currentUser?.id || '';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-role': role, 'x-user-id': uid },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return res.ok;
    } catch (_) { return false; }
  }, [currentUser]);

  // Fetch ALL data from API on login / refresh
  useEffect(() => {
    const fetchData = async () => {
      try {
        const role = currentUser?.role || '';
        const h = { 'x-user-role': role, 'x-user-id': currentUser?.id || '' };
        // Safe loader: returns null on error or non-2xx (no throws)
        const load = async (url: string) => {
          try {
            const r = await fetch(url, { headers: h });
            if (!r.ok) return null;
            return r.json();
          } catch (_) { return null; }
        };

        // Re-sync current user's permissions from DB first (sequential)
        if (currentUser?.id) {
          const freshUser = await load(`/api/users/${currentUser.id}`);
          if (freshUser?.success && freshUser.data) {
            const updated: User = { ...currentUser, ...freshUser.data, password: currentUser.password };
            setCurrentUser(updated);
            localStorage.setItem('doel_user', JSON.stringify(updated));
          }
        }

        // Fetch all modules in parallel — API enforces per-endpoint RBAC (403 → null → state unchanged)
        const [notif, coachesRes, tripsRes, countersRes, usersRes, staffRes, finRes, salesRes, invRes, invIssuesRes, invReceiptsRes, vouchersRes, bkashRes, busBdRes] = await Promise.all([
          load('/api/notifications'),
          load('/api/coaches'),
          load('/api/trips'),
          load('/api/counters'),
          (role === AppRole.SUPER_ADMIN || role === AppRole.ADMIN || role === AppRole.IT) ? load(`/api/users?role=${role}`) : Promise.resolve(null),
          load('/api/staff'),
          load(`/api/finance?role=${role}`),
          load(`/api/sales/records?role=${role}`),
          load(`/api/inventory?role=${role}`),
          load('/api/inventory-issues'),
          load('/api/inventory-receipts'),
          load('/api/vouchers'),
          load('/api/bkash'),
          load('/api/busbd'),
        ]);

        if (notif?.success && Array.isArray(notif.data)) setNotifications(notif.data);

        if (coachesRes?.success && Array.isArray(coachesRes.data)) setCoaches(coachesRes.data);
        else if (Array.isArray(coachesRes)) setCoaches(coachesRes);

        if (tripsRes?.success && Array.isArray(tripsRes.data)) setTrips(tripsRes.data);
        else if (Array.isArray(tripsRes)) setTrips(tripsRes);

        if (countersRes?.success && Array.isArray(countersRes.data)) setCounters(countersRes.data);
        else if (Array.isArray(countersRes)) setCounters(countersRes);

        if (usersRes?.success && Array.isArray(usersRes.data)) {
          setUsers(prev => {
            const dbIds = new Set(usersRes.data.map((u: User) => u.id));
            return [...usersRes.data, ...prev.filter(u => !dbIds.has(u.id))];
          });
        }

        if (staffRes?.success && Array.isArray(staffRes.data)) setStaff(staffRes.data);

        if (finRes?.success && Array.isArray(finRes.data?.transactions)) setTransactions(finRes.data.transactions);

        if (salesRes?.success && Array.isArray(salesRes.data)) setTicketSales(salesRes.data);
        else if (Array.isArray(salesRes)) setTicketSales(salesRes);

        if (invRes?.success && Array.isArray(invRes.data)) setInventory(invRes.data);
        else if (Array.isArray(invRes)) setInventory(invRes);

        if (invIssuesRes?.success && Array.isArray(invIssuesRes.data)) setInventoryIssues(invIssuesRes.data);
        else if (Array.isArray(invIssuesRes)) setInventoryIssues(invIssuesRes);

        if (invReceiptsRes?.success && Array.isArray(invReceiptsRes.data)) setInventoryReceipts(invReceiptsRes.data);
        else if (Array.isArray(invReceiptsRes)) setInventoryReceipts(invReceiptsRes);

        if (vouchersRes?.success && Array.isArray(vouchersRes.data)) setVouchers(vouchersRes.data);
        else if (Array.isArray(vouchersRes)) setVouchers(vouchersRes);

        if (bkashRes?.success && Array.isArray(bkashRes.data)) setBkashRecords(bkashRes.data);
        else if (Array.isArray(bkashRes)) setBkashRecords(bkashRes);

        if (busBdRes?.success && Array.isArray(busBdRes.data)) setBusBdRecords(busBdRes.data);
        else if (Array.isArray(busBdRes)) setBusBdRecords(busBdRes);

      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, refreshKey]);

  // Re-fetch on tab focus so data stays fresh across user sessions
  useEffect(() => {
    if (!isAuthenticated) return;
    const onFocus = () => setRefreshKey(prev => prev + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('doel_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('doel_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('doel_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('doel_site_name', siteName);
    localStorage.setItem('doel_site_logo', siteLogo);
  }, [siteName, siteLogo]);

  const handleResetSystem = () => {
    if (window.confirm('Are you sure you want to reset the system? This will clear local caches and reload data.')) {
      setRefreshKey(prev => prev + 1);
      // In a real app, you might call a backend reset endpoint
      console.log('System Reset Triggered');
    }
  };

  const handleLogin = async (username: string, password?: string): Promise<boolean> => {
    // Try API login first (MySQL-backed, bcrypt-verified)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const user: User = { ...data.data, password };
          setCurrentUser(user);
          setIsAuthenticated(true);
          setActiveTab('dashboard');
          localStorage.setItem('doel_user', JSON.stringify(user));
          return true;
        }
      }
    } catch (_) {}

    // Fallback: check hardcoded users (dev / API-unavailable mode)
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

  const handleSignUp = async (username: string, email: string, password?: string) => {
    // Try API first, fall back to local state
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', username, email, password, role: 'COUNTER' }),
      });
      const data = await res.json();
      if (data.success) {
        const newUser: User = {
          id: data.data?.id || Math.random().toString(36).substr(2, 9),
          username, email, password,
          role: AppRole.COUNTER, isApproved: false,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setUsers(prev => [...prev, newUser]);
        return;
      }
    } catch (_) {}
    // Local fallback
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username, email, password,
      role: AppRole.COUNTER, isApproved: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, newUser]);
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    const role = currentUser?.role || '';
    try {
      const res = await fetch(`/api/users?role=${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': role, 'x-user-id': currentUser?.id || '' },
        body: JSON.stringify(userData),
      });
      // Only try to parse JSON if response has content
      if (res.ok || res.status === 400) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          // Business logic error (e.g. duplicate) — throw so modal shows it
          if (!data.success) throw new Error(data.message || 'Failed to create user');
          const newUser: User = {
            ...userData,
            id: data.data?.id || Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString().split('T')[0],
          };
          setUsers(prev => [...prev, newUser]);
          return;
        }
      }
    } catch (err: any) {
      // Re-throw only real business errors, not network/parse issues
      if (err?.message && !err.message.includes('JSON') && !err.message.includes('fetch')) {
        throw err;
      }
    }
    // Network/API unavailable — add locally without error
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, newUser]);
  };

  const deleteUser = async (userId: string) => {
    const role = currentUser?.role || '';
    try {
      await fetch(`/api/users/${userId}?role=${role}`, {
        method: 'DELETE',
        headers: { 'x-user-role': role, 'x-user-id': currentUser?.id || '' },
      });
    } catch (_) {}
    setUsers(prev => prev.filter(u => u.id !== userId));
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
    // Sync to API (fire-and-forget)
    const role = currentUser?.role || '';
    fetch(`/api/users/${userId}?role=${role}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': role, 'x-user-id': currentUser?.id || '' },
      body: JSON.stringify(updates),
    }).catch(() => {});
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
  const addTransaction = async (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
    const ok = await apiMutate('POST', '/api/finance', tx);
    if (ok) setRefreshKey(prev => prev + 1);
  };
  const updateTransaction = async (id: string, updates: Transaction) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? updates : tx));
    const ok = await apiMutate('PUT', `/api/finance/${id}`, updates);
    if (ok) setRefreshKey(prev => prev + 1);
  };
  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
    await apiMutate('DELETE', `/api/finance/${id}`);
    setRefreshKey(prev => prev + 1);
  };

  // Trip Handlers
  const addTrip = async (trip: Trip) => {
    setTrips(prev => [trip, ...prev]);
    const ok = await apiMutate('POST', '/api/trips', trip);
    if (ok) setRefreshKey(prev => prev + 1);
  };
  const updateTrip = async (id: string, updates: Trip) => {
    setTrips(prev => prev.map(t => t.id === id ? updates : t));
    await apiMutate('PUT', `/api/trips/${id}`, updates);
    setRefreshKey(prev => prev + 1); // always sync — reverts on failure, confirms on success
  };
  const deleteTrip = async (id: string) => {
    setTrips(prev => prev.filter(t => t.id !== id));
    await apiMutate('DELETE', `/api/trips/${id}`);
    setRefreshKey(prev => prev + 1);
  };

  // Inventory Handlers
  const addInventory = async (item: InventoryItem) => {
    setInventory(prev => [item, ...prev]); // show immediately
    await apiMutate('POST', '/api/inventory', item);
    setRefreshKey(prev => prev + 1); // confirms from DB, or reverts if API rejected
  };
  const updateInventory = async (id: string, updates: InventoryItem) => {
    setInventory(prev => prev.map(i => i.id === id ? updates : i));
    const ok = await apiMutate('PUT', `/api/inventory/${id}`, updates);
    if (ok) setRefreshKey(prev => prev + 1);
    else setRefreshKey(prev => prev + 1); // revert on failure
  };
  const deleteInventory = async (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
    await apiMutate('DELETE', `/api/inventory/${id}`);
    setRefreshKey(prev => prev + 1);
  };

  // Inventory Issue Log Handlers (Bus No tracking)
  const addInventoryIssue = async (issue: InventoryIssue) => {
    setInventoryIssues(prev => [issue, ...prev]);
    await apiMutate('POST', '/api/inventory-issues', issue);
    setRefreshKey(prev => prev + 1);
  };
  const deleteInventoryIssue = async (id: string) => {
    setInventoryIssues(prev => prev.filter(i => i.id !== id));
    await apiMutate('DELETE', `/api/inventory-issues/${id}`);
    setRefreshKey(prev => prev + 1);
  };

  // Inventory Receipt Log Handlers (per-item stock-in history)
  const addInventoryReceipt = async (receipt: InventoryReceipt) => {
    setInventoryReceipts(prev => [receipt, ...prev]);
    await apiMutate('POST', '/api/inventory-receipts', receipt);
    setRefreshKey(prev => prev + 1);
  };
  const deleteInventoryReceipt = async (id: string) => {
    setInventoryReceipts(prev => prev.filter(i => i.id !== id));
    await apiMutate('DELETE', `/api/inventory-receipts/${id}`);
    setRefreshKey(prev => prev + 1);
  };

  // Staff Handlers — HR.tsx owns the API call; these just sync local state and trigger refresh
  const addStaff = (member: Staff) => {
    setStaff(prev => [member, ...prev]);
    setRefreshKey(prev => prev + 1);
  };
  const updateStaff = (id: string, updates: Staff) => {
    setStaff(prev => prev.map(s => s.id === id ? updates : s));
    setRefreshKey(prev => prev + 1);
  };
  const deleteStaff = async (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    await apiMutate('DELETE', `/api/staff/${id}`);
    setRefreshKey(prev => prev + 1);
  };

  // Coach Handlers
  const addCoach = async (coach: Coach): Promise<void> => {
    const role = currentUser?.role || '';
    try {
      const res = await fetch('/api/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': role, 'x-user-id': currentUser?.id || '' },
        body: JSON.stringify(coach),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to save coach');
      const savedId = data.data?.id || coach.id;
      setCoaches(prev => [{ ...coach, id: savedId }, ...prev]);
    } catch (err: any) {
      throw err;
    }
  };
  const updateCoach = async (id: string, updates: Coach) => {
    setCoaches(prev => prev.map(c => c.id === id ? updates : c));
    const ok = await apiMutate('PUT', `/api/coaches/${id}`, updates);
    if (ok) setRefreshKey(prev => prev + 1);
  };
  const deleteCoach = async (id: string) => {
    setCoaches(prev => prev.filter(c => c.id !== id));
    await apiMutate('DELETE', `/api/coaches/${id}`);
    setRefreshKey(prev => prev + 1);
  };

  const addCounter = async (counter: Counter) => {
    setCounters(prev => [counter, ...prev]);
    const ok = await apiMutate('POST', '/api/counters', counter);
    if (ok) setRefreshKey(prev => prev + 1);
  };
  const updateCounter = async (id: string, updates: Partial<Counter>) => {
    setCounters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    const ok = await apiMutate('PUT', `/api/counters/${id}`, updates);
    if (ok) setRefreshKey(prev => prev + 1);
  };
  const deleteCounter = async (id: string) => {
    setCounters(prev => prev.filter(c => c.id !== id));
    await apiMutate('DELETE', `/api/counters/${id}`);
    setRefreshKey(prev => prev + 1);
  };

  const adjustInventoryStock = (itemId: string, amount: number) => {
    setInventory(prev => {
      const updated = prev.map(item =>
        item.id === itemId
          ? { ...item, stock: Math.max(0, item.stock - amount), lastUpdated: new Date().toISOString().split('T')[0] }
          : item
      );
      const changedItem = updated.find(item => item.id === itemId);
      if (changedItem) {
        apiMutate('PUT', `/api/inventory/${itemId}`, changedItem);
      }
      return updated;
    });
  };

  // Ticket Sales Handlers
  const addTicketRecord = async (record: TicketSalesRecord) => {
    setTicketSales(prev => [record, ...prev]); // optimistic
    const ok = await apiMutate('POST', '/api/sales/records', record);
    if (ok) {
      // Log associated finance transactions
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
      apiSync('POST', '/api/finance', incomeTx);
      apiSync('POST', '/api/finance', expenseTx);
      setRefreshKey(prev => prev + 1); // sync DB-assigned ID + finance
    }
  };

  const updateTicketRecord = async (id: string, updates: TicketSalesRecord) => {
    setTicketSales(prev => prev.map(r => r.id === id ? updates : r)); // optimistic
    const ok = await apiMutate('PUT', `/api/sales/records/${id}`, updates);
    if (ok) {
      // Sync associated finance records
      apiSync('PUT', `/api/finance/TX-INC-${id}`, {
        amount: updates.totalTaka,
        description: `Trip Income: ${updates.regNo} (Coach: ${updates.coachNo})`
      });
      apiSync('PUT', `/api/finance/TX-EXP-${id}`, {
        amount: updates.totalCost,
        description: `Trip Cost: ${updates.regNo} (Fuel + Exp)`
      });
      setRefreshKey(prev => prev + 1); // confirm DB truth
    } else {
      setRefreshKey(prev => prev + 1); // revert optimistic if API rejected
    }
  };

  // Voucher Handlers
  const addVoucher = async (voucher: Voucher) => {
    setVouchers(prev => [voucher, ...prev]);
    const ok = await apiMutate('POST', '/api/vouchers', voucher);
    if (ok) setRefreshKey(prev => prev + 1);
  };
  const deleteVoucher = async (id: string) => {
    setVouchers(prev => prev.filter(v => v.id !== id));
    await apiMutate('DELETE', `/api/vouchers/${id}`);
    setRefreshKey(prev => prev + 1);
  };

  // bKash Handlers
  const addBkashRecord = async (record: BkashRecord) => {
    setBkashRecords(prev => [record, ...prev]);
    await apiMutate('POST', '/api/bkash', record);
    setRefreshKey(prev => prev + 1);
  };
  const updateBkashRecord = async (id: string, record: BkashRecord) => {
    setBkashRecords(prev => prev.map(r => r.id === id ? record : r));
    await apiMutate('PUT', `/api/bkash/${id}`, record);
    setRefreshKey(prev => prev + 1);
  };
  const deleteBkashRecord = async (id: string) => {
    setBkashRecords(prev => prev.filter(r => r.id !== id));
    await apiMutate('DELETE', `/api/bkash/${id}`);
    setRefreshKey(prev => prev + 1);
  };

  // Bus BD Handlers
  const addBusBdRecord = async (record: BusBdRecord) => {
    setBusBdRecords(prev => [record, ...prev]);
    await apiMutate('POST', '/api/busbd', record);
    setRefreshKey(prev => prev + 1);
  };
  const updateBusBdRecord = async (id: string, record: BusBdRecord) => {
    setBusBdRecords(prev => prev.map(r => r.id === id ? record : r));
    await apiMutate('PUT', `/api/busbd/${id}`, record);
    setRefreshKey(prev => prev + 1);
  };
  const deleteBusBdRecord = async (id: string) => {
    setBusBdRecords(prev => prev.filter(r => r.id !== id));
    await apiMutate('DELETE', `/api/busbd/${id}`);
    setRefreshKey(prev => prev + 1);
  };

  const deleteTicketRecord = async (id: string) => {
    setTicketSales(prev => prev.filter(r => r.id !== id)); // optimistic
    await apiMutate('DELETE', `/api/sales/records/${id}`);
    apiSync('DELETE', `/api/finance/TX-INC-${id}`);
    apiSync('DELETE', `/api/finance/TX-EXP-${id}`);
    setRefreshKey(prev => prev + 1);
  };

  const finalizeTripIntoSales = (trip: Trip) => {
    const completed = { ...trip, status: 'Completed' as Trip['status'] };
    setPendingSalesTrip(trip);
    setTrips(prev => prev.map(t => t.id === trip.id ? completed : t));
    apiMutate('PUT', `/api/trips/${trip.id}`, completed); // persist to DB
    setActiveTab('ticketSalesRecord');
  };

  const handleDataReset = async () => {
    if (currentUser?.role !== AppRole.SUPER_ADMIN) return;

    // Factory Reset — wipe ALL module data to empty (clean slate)
    // Only USERS (Manage Users) are preserved
    setTrips([]);
    setTransactions([]);
    setInventory([]);
    setStaff([]);
    setCoaches([]);
    setCounters([]);
    setTicketSales([]);
    setNotifications([]);
    setVouchers([]);
    setPendingSalesTrip(null);

    // Sync to API (wipe db.json too, preserving users)
    try {
      await fetch('/api/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': AppRole.SUPER_ADMIN },
      });
    } catch (_) {}
  };

  const hasPermission = (tab: string) => {
    if (!currentUser) return false;
    if (currentUser.role === AppRole.SUPER_ADMIN) return true;
    // Custom per-user permissions override role defaults
    if (currentUser.permissions && currentUser.permissions.length > 0) {
      return currentUser.permissions.includes(tab);
    }
    // Fall back to role-based defaults
    const allowedRoles = PERMISSIONS[tab];
    return allowedRoles ? allowedRoles.includes(currentUser.role) : false;
  };

  const triggerAiRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setIsRefreshing(false);
    }, 600);
  }, [isRefreshing]);

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
      case 'dashboard': return <Dashboard trips={trips} transactions={transactions} staff={staff} ticketSales={ticketSales} lang={language} />;
      case 'fleetManagement': return (
        <div className="space-y-12">
          <CoachRegister
            coaches={coaches}
            onAdd={addCoach}
            onUpdate={updateCoach}
            onRemove={deleteCoach}
            lang={language}
            userRole={currentUser?.role}
            canManage={hasPermission('fleetManagement')}
          />
          <div className="border-t-4 border-slate-100 dark:border-slate-800 pt-12">
            <Scheduling
              trips={trips}
              staff={staff}
              coaches={coaches}
              onAdd={addTrip}
              onUpdate={updateTrip}
              onDelete={deleteTrip}
              onFinalize={finalizeTripIntoSales}
              lang={language}
              userRole={currentUser?.role}
              canWrite={hasPermission('fleetManagement')}
            />
          </div>
        </div>
      );
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
          canWrite={hasPermission('ticketSalesRecord')}
          prefillTrip={pendingSalesTrip}
          onClearPrefill={() => setPendingSalesTrip(null)}
        />
      );
      case 'counters': return (
        <CounterManagement
          counters={counters}
          users={users}
          trips={trips}
          currentUser={currentUser}
          onAddCounter={addCounter}
          onUpdateCounter={updateCounter}
          onAddSalesRecord={addTicketRecord}
          lang={language}
          canWrite={hasPermission('counters')}
        />
      );
      case 'inventory': return <Inventory inventory={inventory} onAdd={addInventory} onUpdate={updateInventory} onDelete={deleteInventory} issues={inventoryIssues} onAddIssue={addInventoryIssue} onDeleteIssue={deleteInventoryIssue} receipts={inventoryReceipts} onAddReceipt={addInventoryReceipt} onDeleteReceipt={deleteInventoryReceipt} coaches={coaches} lang={language} />;
      case 'finance': return <Finance transactions={transactions} onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction} lang={language} userRole={currentUser?.role} userId={currentUser?.id} counters={counters} />;
      case 'hr': return <HR staff={staff} onAdd={addStaff} onUpdate={updateStaff} onDelete={deleteStaff} lang={language} userRole={currentUser?.role} userId={currentUser?.id} />;
      case 'maintenance': return <Maintenance trips={trips} inventory={inventory} coaches={coaches} onUseInventory={adjustInventoryStock} lang={language} />;
      case 'reports': return <Reports trips={trips} transactions={transactions} staff={staff} lang={language} />;
      case 'userManagement': return <UserManagement users={users} onUpdateUser={updateUserInfo} onAddUser={addUser} onDeleteUser={deleteUser} lang={language} />;
      case 'vouchers': return (
        <Vouchers
          vouchers={vouchers}
          onAdd={addVoucher}
          onDelete={deleteVoucher}
          lang={language}
          canWrite={hasPermission('vouchers')}
        />
      );
      case 'bkash': return (
        <Bkash
          records={bkashRecords}
          onAdd={addBkashRecord}
          onUpdate={updateBkashRecord}
          onDelete={deleteBkashRecord}
          lang={language}
          userRole={currentUser?.role}
          canWrite={hasPermission('bkash')}
        />
      );
      case 'busbd': return (
        <BusBd
          records={busBdRecords}
          onAdd={addBusBdRecord}
          onUpdate={updateBusBdRecord}
          onDelete={deleteBusBdRecord}
          lang={language}
          userRole={currentUser?.role}
          canWrite={hasPermission('busbd')}
        />
      );
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
        notificationCount={
          notifications.filter(n => !n.read).length +
          staff.filter(s => s.expiryDate && new Date(s.expiryDate) < new Date() && s.status !== 'Resigned' && s.status !== 'Terminated').length
        }
      />

      <main className="flex-1 lg:ml-[260px] flex flex-col min-h-screen overflow-x-hidden">
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
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh page data"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-black text-[10px] sm:text-xs transition-all shadow-sm border ${
                isRefreshing
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500 border-blue-200 dark:border-blue-700 cursor-not-allowed'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95'
              }`}
            >
              <i className={`fa-solid fa-arrows-rotate text-sm ${isRefreshing ? 'animate-spin' : ''}`}></i>
              <span className="hidden sm:block">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
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
