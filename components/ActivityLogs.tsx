import React, { useState, useEffect } from 'react';
import { Language, translations } from '../translations';

interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  userRole: string;
  action: string;
  module: string;
  recordId: string;
  recordType: string;
  details?: string;
  timestamp: string;
  ipAddress?: string;
}

interface ActivityLogsProps {
  lang: Language;
  userRole?: string;
}

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER', 'IT', 'ACCOUNTS', 'HR', 'SALES', 'PURCHASE', 'MARKETING', 'COUNTER', 'DRIVER', 'SUPERVISOR'];

// Maps raw backend route segments (URL module names) to a readable label for the log table
const MODULE_DISPLAY: Record<string, string> = {
  finance: 'Finance',
  sales: 'Sales Record',
  staff: 'HR / Staff',
  coaches: 'Fleet & Schedule',
  trips: 'Fleet & Schedule',
  counters: 'Counters',
  inventory: 'Inventory',
  'inventory-issues': 'Inventory Issues',
  'inventory-receipts': 'Inventory Receipts',
  'parts-requisitions': 'Parts Requisition',
  notifications: 'Notifications',
  users: 'Manage Users',
  vouchers: 'Vouchers',
  bkash: 'bKash',
  busbd: 'Bus BD',
  'activity-logs': 'Activity Log Settings',
  system: 'System',
};
const moduleLabel = (m: string) => MODULE_DISPLAY[m] || m;

const ActivityLogs: React.FC<ActivityLogsProps> = ({ lang, userRole }) => {
  const t = translations[lang];
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [retentionDays, setRetentionDays] = useState(30);
  const [autoDelete, setAutoDelete] = useState(true);
  const [allowedRoles, setAllowedRoles] = useState<string[]>(['SUPER_ADMIN', 'ADMIN']);
  const [saving, setSaving] = useState(false);
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    fetchLogs();
  }, [limit]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/activity-logs?limit=${limit}`, {
        headers: { 'x-user-role': userRole || '', 'x-user-id': '' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.data.logs || []);
          setRetentionDays(data.data.config?.retentionDays || 30);
          setAutoDelete(data.data.config?.enableAutoDelete ?? true);
          setAllowedRoles(data.data.config?.allowedRoles || ['SUPER_ADMIN', 'ADMIN']);
        }
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/activity-logs/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': userRole || '', 'x-user-id': '' },
        body: JSON.stringify({ retentionDays, enableAutoDelete: autoDelete, allowedRoles }),
      });
      if (res.ok) {
        alert(lang === 'en' ? 'Configuration saved' : 'কনফিগুরেশন সংরক্ষিত হয়েছে');
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (role: string) => {
    if (allowedRoles.includes(role)) {
      setAllowedRoles(allowedRoles.filter(r => r !== role));
    } else {
      setAllowedRoles([...allowedRoles, role]);
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
      case 'INSERT':
        return 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400';
      case 'UPDATE':
      case 'MODIFY':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'DELETE':
        return 'bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400';
      default:
        return 'bg-slate-100 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400';
    }
  };

  const selectCls = "px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 dark:text-white";

  if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center py-24 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          {lang === 'en' ? 'Only admins can view activity logs' : 'শুধুমাত্র এডমিনরা সক্রিয়তা লগ দেখতে পারেন'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight">
          {lang === 'en' ? 'Activity Logs' : 'কার্যকলাপ লগ'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          {lang === 'en' ? 'Track all user actions and changes' : 'সমস্ত ব্যবহারকারী ক্রিয়া এবং পরিবর্তন ট্র্যাক করুন'}
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h3 className="font-black text-lg text-slate-900 dark:text-white">
          {lang === 'en' ? 'Retention Settings' : 'ধরে রাখার সেটিংস'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              {lang === 'en' ? 'Retain logs for (days)' : 'লগ রাখুন (দিন)'}
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={retentionDays}
              onChange={e => setRetentionDays(parseInt(e.target.value) || 30)}
              className={selectCls}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'en' ? 'Logs older than this will be deleted' : 'এর চেয়ে পুরানো লগ মুছে ফেলা হবে'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              {lang === 'en' ? 'Auto-delete enabled' : 'স্বয়ংক্রিয় মুছুন সক্ষম'}
            </label>
            <button
              onClick={() => setAutoDelete(!autoDelete)}
              className={`w-full px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                autoDelete
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {autoDelete ? (lang === 'en' ? 'Enabled' : 'সক্ষম') : (lang === 'en' ? 'Disabled' : 'অক্ষম')}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {lang === 'en' ? 'Roles with access to view logs' : 'লগ দেখার অ্যাক্সেস সহ ভূমিকা'} <span className="text-blue-500">({allowedRoles.length}/{ALL_ROLES.length})</span>
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAllowedRoles(['SUPER_ADMIN', 'ADMIN'])}
                className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all">
                {lang === 'en' ? 'Admins Only' : 'শুধু এডমিন'}
              </button>
              <button type="button" onClick={() => setAllowedRoles([...ALL_ROLES])}
                className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-all">
                {lang === 'en' ? 'All' : 'সব'}
              </button>
              <button type="button" onClick={() => setAllowedRoles([])}
                className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all">
                {lang === 'en' ? 'None' : 'কোনোটা না'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            {ALL_ROLES.map(role => (
              <label key={role} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => toggleRole(role)}
                  className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all cursor-pointer ${
                    allowedRoles.includes(role)
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover:border-blue-400'
                  }`}
                >
                  {allowedRoles.includes(role) && <i className="fa-solid fa-check text-white text-[9px]"></i>}
                </div>
                <span
                  onClick={() => toggleRole(role)}
                  className={`text-[11px] font-bold select-none ${allowedRoles.includes(role) ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
                >
                  {role}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-lg font-black text-sm uppercase tracking-widest transition-colors"
        >
          {saving ? (lang === 'en' ? 'Saving...' : 'সংরক্ষণ করছে...') : (lang === 'en' ? 'Save Settings' : 'সেটিংস সংরক্ষণ করুন')}
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  {lang === 'en' ? 'User' : 'ব্যবহারকারী'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  {lang === 'en' ? 'Action' : 'কর্ম'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  {lang === 'en' ? 'Module' : 'মডিউল'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  {lang === 'en' ? 'Date & Time' : 'তারিখ ও সময়'}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    {lang === 'en' ? 'Loading...' : 'লোড হচ্ছে...'}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    {lang === 'en' ? 'No activity logs' : 'কোনো কার্যকলাপ লগ নেই'}
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{log.username || log.userId}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{log.userRole}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {moduleLabel(log.module)} {log.recordId && <span className="text-xs text-slate-500">#{log.recordId}</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {logs.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {lang === 'en' ? `Showing ${logs.length} logs` : `${logs.length}টি লগ দেখাচ্ছে`}
            </p>
            {limit < 500 && (
              <button
                onClick={() => setLimit(prev => prev + 100)}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {lang === 'en' ? 'Load more' : 'আরও লোড করুন'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
