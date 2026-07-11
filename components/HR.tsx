
import React, { useState, useRef } from 'react';
import { Staff } from '../types';
import { Language, translations } from '../translations';

interface HRProps {
  staff: Staff[];
  onAdd: (member: Staff) => void;
  onUpdate: (id: string, member: Staff) => void;
  onDelete: (id: string) => void;
  lang: Language;
  userRole?: string;
  userId?: string;
}

const DEPT_CONFIG = [
  { id: 'all',          label: 'All Staff',      labelBn: 'সকল স্টাফ',        icon: 'fa-users',              activeClass: 'bg-slate-800 text-white dark:bg-white dark:text-slate-900',  badgeClass: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
  { id: 'Driver',       label: 'Driver',         labelBn: 'ড্রাইভার',          icon: 'fa-steering-wheel',     activeClass: 'bg-blue-600 text-white',     badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  { id: 'Guide',        label: 'Guide',          labelBn: 'গাইড',              icon: 'fa-user-tie',           activeClass: 'bg-violet-600 text-white',   badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' },
  { id: 'Accounts',     label: 'Accounts',       labelBn: 'অ্যাকাউন্টস',       icon: 'fa-calculator',         activeClass: 'bg-emerald-600 text-white',  badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
  { id: 'IT',           label: 'IT Dept.',       labelBn: 'আইটি',              icon: 'fa-laptop-code',        activeClass: 'bg-cyan-600 text-white',     badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' },
  { id: 'Store',        label: 'Store',          labelBn: 'স্টোর',             icon: 'fa-warehouse',          activeClass: 'bg-amber-600 text-white',    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  { id: 'Technical',    label: 'Technical',      labelBn: 'টেকনিকাল',          icon: 'fa-wrench',             activeClass: 'bg-orange-600 text-white',   badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
  { id: 'Counter',      label: 'Counter Staff',  labelBn: 'কাউন্টার স্টাফ',    icon: 'fa-shop',               activeClass: 'bg-rose-600 text-white',     badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' },
  { id: 'Staff/Helper', label: 'Helper',         labelBn: 'হেলপার',            icon: 'fa-hand-holding-heart', activeClass: 'bg-indigo-600 text-white',   badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' },
] as const;

const COUNTER_LOCATIONS = [
  'Abdullahpur Counter',
  'Kalyanpur-Kalabagan Counter',
  'Arambag Counter',
  'Chittagong Counter',
  "Cox's Bazar Counter",
];

const DEPT_ROLES: Record<string, string[]> = {
  Driver:        ['Driver', 'Senior Driver', 'Assistant Driver'],
  Guide:         ['Guide', 'Senior Guide'],
  Accounts:      ['Accountant', 'Senior Accountant', 'Cashier', 'Finance Officer'],
  IT:            ['IT Officer', 'Web Developer', 'System Admin', 'IT Support'],
  Store:         ['Store Manager', 'Store Keeper', 'Delivery Staff'],
  Technical:     ['Mechanic', 'Senior Mechanic', 'Electrician', 'Helper'],
  Counter:       ['Counter Staff', 'Counter Manager', 'Senior Counter Staff'],
  'Staff/Helper':['Helper', 'Office Boy', 'Supervisor', 'Security Guard'],
};

const getStaffDeptId = (member: Staff): string => {
  const d = (member.department || '').trim();
  if (!d) {
    const r = member.role.toLowerCase();
    if (r.includes('driver'))     return 'Driver';
    if (r === 'guide')            return 'Guide';
    if (r.includes('accountant') || r.includes('cashier')) return 'Accounts';
    if (r.includes('counter'))    return 'Counter';
    return 'Staff/Helper';
  }
  if (COUNTER_LOCATIONS.includes(d) || d.toLowerCase().includes('counter')) return 'Counter';
  return d;
};

const getDeptConf = (id: string) => DEPT_CONFIG.find(d => d.id === id) ?? DEPT_CONFIG[0];

const HR: React.FC<HRProps> = ({ staff, onAdd, onUpdate, onDelete, lang, userRole, userId }) => {
  const [activeTab, setActiveTab]       = useState<string>('all');
  const [counterFilter, setCounterFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal]       = useState(false);
  const [viewingStaff, setViewingStaff] = useState<Staff | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [hrSearch, setHrSearch]         = useState('');
  const [formDept, setFormDept]         = useState('Driver');
  const [counterLocation, setCounterLocation] = useState(COUNTER_LOCATIONS[0]);
  const [loadingId, setLoadingId]       = useState<string | null>(null);
  const t = translations[lang];

  const fetchStaffFull = async (id: string): Promise<Staff | null> => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        headers: { 'x-user-role': userRole || '', 'x-user-id': userId || '' }
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return null;
      return json.data as Staff;
    } catch { return null; }
  };

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef   = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '', role: 'Driver', phone: '', email: '', nid: '', address: '',
    designation: '', department: 'Driver', salary: '',
    joiningDate: new Date().toISOString().split('T')[0],
    expiryDate: '', photo: '', nidPhoto: '', licensePhoto: '',
    licenseNumber: '', licenseCategory: 'Medium' as 'Heavy' | 'Medium' | 'Light',
    emergencyContact: '', notes: '', status: 'Active' as any
  });

  const isDriverDept  = formDept === 'Driver';
  const isCounterDept = formDept === 'Counter';

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('no ctx')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = url;
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPhoto = field === 'photo';
    try {
      const compressed = await compressImage(file, isPhoto ? 800 : 1600, isPhoto ? 0.75 : 0.80);
      setFormData(prev => ({ ...prev, [field]: compressed }));
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = (deptHint?: string) => {
    resetForm();
    const dept = deptHint || (activeTab !== 'all' ? activeTab : 'Driver');
    setFormDept(dept);
    const defaultRole = DEPT_ROLES[dept]?.[0] || 'Staff';
    setFormData(prev => ({
      ...prev,
      role: defaultRole,
      department: dept === 'Counter' ? COUNTER_LOCATIONS[0] : dept,
    }));
    setShowModal(true);
  };

  const handleEdit = async (member: Staff) => {
    const full = await fetchStaffFull(member.id);
    const m = full || member;
    setEditingStaffId(m.id);
    const deptId = getStaffDeptId(m);
    setFormDept(deptId);
    if (deptId === 'Counter' && COUNTER_LOCATIONS.includes(m.department || '')) {
      setCounterLocation(m.department!);
    }
    setFormData({
      name: m.name, role: m.role, phone: m.phone,
      email: m.email || '', nid: m.nid || '', address: m.address || '',
      designation: m.designation || '', department: m.department || '',
      salary: m.salary ? m.salary.toString() : '',
      joiningDate: m.joiningDate || '', expiryDate: m.expiryDate || '',
      photo: m.photo || '', nidPhoto: m.nidPhoto || '', licensePhoto: m.licensePhoto || '',
      licenseNumber: m.licenseNumber || '', licenseCategory: m.licenseCategory || 'Medium',
      emergencyContact: m.emergencyContact || '', notes: m.notes || '', status: m.status
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(lang === 'en' ? 'Permanently remove this staff member?' : 'এই স্টাফ সদস্যকে স্থায়ীভাবে অপসারণ করবেন?')) {
      onDelete(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert(lang === 'en' ? 'Staff name is required!' : 'নাম আবশ্যক!');
      return;
    }
    const isDuplicate = staff.some(s => s.id !== editingStaffId && formData.nid && s.nid === formData.nid);
    if (isDuplicate) {
      alert(lang === 'en' ? 'A staff member with this NID already exists!' : 'এই NID সহ একজন স্টাফ ইতিমধ্যে বিদ্যমান!');
      return;
    }

    const finalDept = isCounterDept ? counterLocation : formDept;

    const staffData: Staff = {
      id: editingStaffId || `ZJ-${Math.floor(Math.random() * 1000000)}`,
      name: formData.name, role: formData.role, phone: formData.phone.trim() || '',
      email: formData.email.trim() || undefined, nid: formData.nid, address: formData.address,
      designation: formData.designation, department: finalDept, status: formData.status,
      salary: parseFloat(formData.salary) || 0, joiningDate: formData.joiningDate,
      expiryDate: formData.expiryDate, photo: formData.photo, nidPhoto: formData.nidPhoto,
      licensePhoto: formData.licensePhoto,
      licenseNumber: isDriverDept ? formData.licenseNumber : undefined,
      licenseCategory: isDriverDept ? formData.licenseCategory : undefined,
      emergencyContact: formData.emergencyContact, notes: formData.notes
    };

    try {
      const method = editingStaffId ? 'PUT' : 'POST';
      const url    = editingStaffId ? `/api/staff/${editingStaffId}` : '/api/staff';
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', 'x-user-role': userRole || '', 'x-user-id': userId || '' },
        body: JSON.stringify(staffData)
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) { alert(responseData.message || 'Failed to save staff member'); return; }
      const savedId = responseData.data?.id || staffData.id;
      const savedStaff = { ...staffData, id: savedId };
      if (editingStaffId) onUpdate(editingStaffId, savedStaff);
      else onAdd(savedStaff);
    } catch {
      alert(lang === 'en' ? 'Network error. Please try again.' : 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
      return;
    }
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingStaffId(null);
    setFormDept('Driver');
    setCounterLocation(COUNTER_LOCATIONS[0]);
    setFormData({
      name: '', role: 'Driver', phone: '', email: '', nid: '', address: '',
      designation: '', department: 'Driver', salary: '',
      joiningDate: new Date().toISOString().split('T')[0],
      expiryDate: '', photo: '', nidPhoto: '', licensePhoto: '',
      licenseNumber: '', licenseCategory: 'Medium',
      emergencyContact: '', notes: '', status: 'Active'
    });
  };

  // Counts per dept
  const deptCounts = DEPT_CONFIG.reduce((acc, d) => {
    acc[d.id] = d.id === 'all' ? staff.length : staff.filter(m => getStaffDeptId(m) === d.id).length;
    return acc;
  }, {} as Record<string, number>);

  // Counts per status — shown as a summary bar at the top
  const STATUS_CONFIG = [
    { id: 'Active',     labelBn: 'অ্যাক্টিভ',          icon: 'fa-circle-check',     color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { id: 'On Leave',    labelBn: 'ছুটিতে',             icon: 'fa-mug-hot',          color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { id: 'Inactive',    labelBn: 'ইনঅ্যাক্টিভ',        icon: 'fa-circle-minus',     color: 'text-slate-500 dark:text-slate-400',     bg: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'Expired',     labelBn: 'মেয়াদ উত্তীর্ণ',     icon: 'fa-triangle-exclamation', color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { id: 'Resigned',    labelBn: 'পদত্যাগ',            icon: 'fa-door-open',        color: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { id: 'Terminated',  labelBn: 'বহিষ্কৃত',           icon: 'fa-ban',              color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-900/20' },
  ] as const;
  const statusCounts = STATUS_CONFIG.reduce((acc, s) => {
    acc[s.id] = staff.filter(m => m.status === s.id).length;
    return acc;
  }, {} as Record<string, number>);

  // Staff with an expired license/contract that hasn't been resolved yet — surfaced as a notice
  const today = new Date();
  const expiredStaffList = staff.filter(m =>
    m.expiryDate && new Date(m.expiryDate) < today && m.status !== 'Resigned' && m.status !== 'Terminated'
  );

  // Filtered staff for table
  const tabFiltered = activeTab === 'all' ? staff : staff.filter(m => getStaffDeptId(m) === activeTab);
  const counterFiltered = (activeTab === 'Counter' && counterFilter !== 'all')
    ? tabFiltered.filter(m => m.department === counterFilter)
    : tabFiltered;
  const statusFiltered = statusFilter === 'all' ? counterFiltered : counterFiltered.filter(m => m.status === statusFilter);
  const searchFiltered = hrSearch.trim()
    ? statusFiltered.filter(m => {
        const q = hrSearch.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) ||
               (m.phone || '').toLowerCase().includes(q) || (m.department || '').toLowerCase().includes(q) ||
               (m.nid || '').toLowerCase().includes(q) || (m.id || '').toLowerCase().includes(q);
      })
    : statusFiltered;

  const activeDeptConf = getDeptConf(activeTab);

  const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-2xl p-4 font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-400 text-sm";
  const labelCls = "text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.18em] mb-2 block";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.hr}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lang === 'en' ? 'Digital Personnel Enrollment System' : 'ডিজিটাল কর্মী নিবন্ধন সিস্টেম'}
          </p>
        </div>
        <button
          onClick={() => openAddModal()}
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl font-bold active:scale-[0.98]"
        >
          <i className="fa-solid fa-user-plus"></i> {t.newHire}
        </button>
      </div>

      {/* Past-due License / Contract Notice — date-based, independent of the manually-set Status field below */}
      {expiredStaffList.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-triangle-exclamation text-rose-500"></i>
          </div>
          <div className="min-w-0">
            <p className="font-black text-rose-700 dark:text-rose-400 text-sm">
              {expiredStaffList.length} {lang === 'en'
                ? `license/contract date${expiredStaffList.length > 1 ? 's' : ''} past due`
                : `জনের লাইসেন্স/চুক্তির মেয়াদ পার হয়ে গেছে`}
            </p>
            <p className="text-[11px] text-rose-500/80 dark:text-rose-400/70 mt-0.5 font-semibold">
              {lang === 'en'
                ? "Their Status field below hasn't been updated to \"Expired\" yet — this counts the date only, not the Status box."
                : 'নিচের Status এখনও "Expired" করে আপডেট করা হয়নি — এটা শুধু তারিখ দেখে গণনা করা, Status বক্সের সাথে মিলবে না।'}
            </p>
            <p className="text-[11px] text-rose-500/90 dark:text-rose-400/80 mt-1.5 font-medium">
              {expiredStaffList.map(m => m.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Status Summary Bar — click a status to filter the list below */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STATUS_CONFIG.map(s => {
          const isActive = statusFilter === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatusFilter(isActive ? 'all' : s.id)}
              aria-pressed={isActive}
              className={`rounded-2xl p-3 flex flex-col items-center gap-1 transition-all min-h-[44px] ${s.bg} ${
                isActive ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ring-blue-500 shadow-md' : 'hover:opacity-80 active:scale-[0.97]'
              }`}
            >
              <i className={`fa-solid ${s.icon} ${s.color} text-sm`}></i>
              <span className={`text-lg font-black ${s.color}`}>{statusCounts[s.id]}</span>
              <span className="text-[9px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 text-center leading-tight">
                {lang === 'en' ? s.id : s.labelBn}
              </span>
            </button>
          );
        })}
      </div>
      {statusFilter !== 'all' && (
        <div className="flex items-center gap-2 -mt-2">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
            {lang === 'en' ? `Showing only: ${statusFilter}` : `শুধু দেখানো হচ্ছে: ${statusFilter}`}
          </span>
          <button onClick={() => setStatusFilter('all')} className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase underline">
            {lang === 'en' ? 'Clear' : 'মুছুন'}
          </button>
        </div>
      )}

      {/* Department Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-2 shadow-sm">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {DEPT_CONFIG.map(dept => (
            <button
              key={dept.id}
              onClick={() => { setActiveTab(dept.id); setCounterFilter('all'); }}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all ${
                activeTab === dept.id ? dept.activeClass : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <i className={`fa-solid ${dept.icon} text-xs`}></i>
              <span className="hidden xs:block">{lang === 'en' ? dept.label : dept.labelBn}</span>
              {deptCounts[dept.id] > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                  activeTab === dept.id ? 'bg-white/20 text-current' : dept.badgeClass
                }`}>
                  {deptCounts[dept.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Counter sub-location filter */}
      {activeTab === 'Counter' && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCounterFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
              counterFilter === 'all' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 hover:bg-rose-100'
            }`}
          >
            <i className="fa-solid fa-layer-group mr-1.5"></i>
            {lang === 'en' ? 'All Counters' : 'সব কাউন্টার'}
          </button>
          {COUNTER_LOCATIONS.map(loc => (
            <button
              key={loc}
              onClick={() => setCounterFilter(loc)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                counterFilter === loc ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 hover:bg-rose-100'
              }`}
            >
              <i className="fa-solid fa-location-dot mr-1.5"></i>
              {loc.replace(' Counter', '')}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"></i>
        <input
          type="text"
          value={hrSearch}
          onChange={e => setHrSearch(e.target.value)}
          placeholder={lang === 'en' ? 'Search by name, role, phone, NID...' : 'নাম, পদবি, ফোন দিয়ে খুঁজুন...'}
          className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all dark:text-white placeholder:text-slate-400 shadow-sm"
        />
        {hrSearch && (
          <button onClick={() => setHrSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-all">
            <i className="fa-solid fa-xmark text-[9px]"></i>
          </button>
        )}
      </div>
      {hrSearch && (
        <p className="text-[11px] text-slate-400 font-bold -mt-3 ml-1">
          {searchFiltered.length} {lang === 'en' ? 'result(s)' : 'ফলাফল'}
          {searchFiltered.length === 0 && <span className="ml-2 text-rose-400">{lang === 'en' ? '— no match' : '— কোনো মিল নেই'}</span>}
        </p>
      )}

      {/* Section Header with Add button */}
      {activeTab !== 'all' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeDeptConf.activeClass}`}>
              <i className={`fa-solid ${activeDeptConf.icon} text-sm`}></i>
            </div>
            <div>
              <p className="font-black text-sm dark:text-white">
                {lang === 'en' ? activeDeptConf.label : activeDeptConf.labelBn}
              </p>
              <p className="text-[10px] text-slate-400 font-bold">
                {searchFiltered.length} {lang === 'en' ? 'personnel' : 'জন'}
              </p>
            </div>
          </div>
          <button
            onClick={() => openAddModal(activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all active:scale-[0.97] ${activeDeptConf.activeClass}`}
          >
            <i className="fa-solid fa-plus"></i>
            {lang === 'en' ? `Add ${activeDeptConf.label}` : 'নতুন যোগ করুন'}
          </button>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-black">
              <tr>
                <th className="px-6 py-5">Personnel</th>
                <th className="px-6 py-5">Department / Role</th>
                <th className="px-6 py-5">Phone</th>
                <th className="px-6 py-5">Docs</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {searchFiltered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${activeDeptConf.activeClass} opacity-30`}>
                        <i className={`fa-solid ${activeDeptConf.icon} text-xl`}></i>
                      </div>
                      <p className="text-slate-400 font-bold text-sm">
                        {hrSearch
                          ? (lang === 'en' ? 'No staff matching your search.' : 'অনুসন্ধানে কোনো স্টাফ পাওয়া যায়নি।')
                          : (lang === 'en' ? `No ${activeDeptConf.label} enrolled yet.` : 'এখনো কেউ নেই।')}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {searchFiltered.map(member => {
                const deptId   = getStaffDeptId(member);
                const deptConf = getDeptConf(deptId);
                return (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border shadow-sm flex-shrink-0">
                          <img
                            src={member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                            className="w-full h-full object-cover" alt={member.name}
                          />
                        </div>
                        <div>
                          <p className="font-black text-[13px] dark:text-white">{member.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {member.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${deptConf.badgeClass}`}>
                          <i className={`fa-solid ${deptConf.icon} text-[9px]`}></i>
                          {lang === 'en' ? deptConf.label : deptConf.labelBn}
                        </span>
                        {member.department && COUNTER_LOCATIONS.includes(member.department) && (
                          <p className="text-[10px] text-slate-400 font-bold">{member.department}</p>
                        )}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{member.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400 text-[13px]">{member.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          title={(member.hasPhoto ?? !!member.photo) ? 'View Photo' : 'No Photo'}
                          onClick={async () => {
                            if (!(member.hasPhoto ?? !!member.photo)) return;
                            setLoadingId(member.id + 'p');
                            const full = await fetchStaffFull(member.id);
                            setLoadingId(null);
                            if (full?.photo) setPreviewImage(full.photo);
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] transition-all ${(member.hasPhoto ?? !!member.photo) ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 cursor-pointer dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-300 cursor-default dark:bg-slate-800'}`}
                        >
                          <i className={`fa-solid ${loadingId === member.id + 'p' ? 'fa-spinner animate-spin' : 'fa-camera'}`}></i>
                        </button>
                        <button
                          type="button"
                          title={(member.hasLicensePhoto ?? !!member.licensePhoto) || (member.hasNidPhoto ?? !!member.nidPhoto) ? 'View Document' : 'No Document'}
                          onClick={async () => {
                            if (!((member.hasLicensePhoto ?? !!member.licensePhoto) || (member.hasNidPhoto ?? !!member.nidPhoto))) return;
                            setLoadingId(member.id + 'd');
                            const full = await fetchStaffFull(member.id);
                            setLoadingId(null);
                            const img = full?.licensePhoto || full?.nidPhoto;
                            if (img) setPreviewImage(img);
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] transition-all ${(member.hasLicensePhoto ?? !!member.licensePhoto) || (member.hasNidPhoto ?? !!member.nidPhoto) ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 cursor-pointer dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-300 cursor-default dark:bg-slate-800'}`}
                        >
                          <i className={`fa-solid ${loadingId === member.id + 'd' ? 'fa-spinner animate-spin' : 'fa-id-card'}`}></i>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                        member.status === 'Active'     ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        member.status === 'On Leave'   ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        member.status === 'Inactive'   ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>{member.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={async () => {
                            setLoadingId(member.id + 'v');
                            const full = await fetchStaffFull(member.id);
                            setLoadingId(null);
                            setViewingStaff(full || member);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="View"
                        >
                          <i className={`fa-solid ${loadingId === member.id + 'v' ? 'fa-spinner animate-spin' : 'fa-eye'}`}></i>
                        </button>
                        <button
                          onClick={async () => {
                            setLoadingId(member.id + 'e');
                            await handleEdit(member);
                            setLoadingId(null);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all" title="Edit"
                        >
                          <i className={`fa-solid ${loadingId === member.id + 'e' ? 'fa-spinner animate-spin' : 'fa-pen'}`}></i>
                        </button>
                        <button onClick={() => handleDelete(member.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all" title="Delete"><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[95vh] sm:rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  {editingStaffId ? 'Update Personnel File' : 'New Staff Enrollment'}
                </h3>
                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">
                  {lang === 'en' ? 'Digital Staff Registry' : 'ডিজিটাল স্টাফ রেজিস্ট্রি'}
                </p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-slate-900">
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">

                {/* Department Selector */}
                <div>
                  <label className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-[0.18em] mb-3 block">
                    {lang === 'en' ? 'Department / Section' : 'বিভাগ / সেকশন'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DEPT_CONFIG.filter(d => d.id !== 'all').map(dept => (
                      <button
                        key={dept.id} type="button"
                        onClick={() => {
                          setFormDept(dept.id);
                          const defaultRole = DEPT_ROLES[dept.id]?.[0] || 'Staff';
                          setFormData(prev => ({
                            ...prev,
                            role: defaultRole,
                            department: dept.id === 'Counter' ? COUNTER_LOCATIONS[0] : dept.id,
                          }));
                        }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${
                          formDept === dept.id ? dept.activeClass + ' shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        <i className={`fa-solid ${dept.icon} text-xs`}></i>
                        {lang === 'en' ? dept.label : dept.labelBn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Counter Location (only when Counter dept selected) */}
                {isCounterDept && (
                  <div>
                    <label className={labelCls}>Counter Location <span className="text-rose-500">*</span></label>
                    <select
                      value={counterLocation}
                      onChange={e => { setCounterLocation(e.target.value); setFormData(prev => ({ ...prev, department: e.target.value })); }}
                      className={inputCls}
                    >
                      {COUNTER_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>
                )}

                {/* Core Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelCls}>Full Name <span className="text-rose-500">*</span></label>
                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder="Legal full name" />
                  </div>
                  <div>
                    <label className={labelCls}>Role / Designation <span className="text-rose-500">*</span></label>
                    <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className={inputCls}>
                      {(DEPT_ROLES[formDept] || ['Staff']).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Phone No.</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputCls} placeholder="01XXXXXXXXX" />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputCls} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className={labelCls}>NID Number</label>
                    <input value={formData.nid} onChange={e => setFormData({ ...formData, nid: e.target.value })} className={inputCls} placeholder="National ID (optional)" />
                  </div>
                  <div>
                    <label className={labelCls}>Monthly Salary (৳)</label>
                    <input type="number" value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} className={inputCls} placeholder="0" />
                  </div>
                  <div>
                    <label className={labelCls}>Joining Date</label>
                    <input type="date" value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{isDriverDept ? 'License Expiry Date' : 'Contract Expiry Date'}</label>
                    <input type="date" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} className={inputCls} />
                  </div>
                  {isDriverDept && (
                    <>
                      <div>
                        <label className={labelCls}>Driving License Number</label>
                        <input value={formData.licenseNumber} onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })} className={inputCls} placeholder="e.g. DHK-0123456" />
                      </div>
                      <div>
                        <label className={labelCls}>License Category</label>
                        <select value={formData.licenseCategory} onChange={e => setFormData({ ...formData, licenseCategory: e.target.value as any })} className={inputCls}>
                          <option value="Heavy">Heavy</option>
                          <option value="Medium">Medium</option>
                          <option value="Light">Light</option>
                        </select>
                      </div>
                    </>
                  )}
                  <div>
                    <label className={labelCls}>Status</label>
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className={inputCls}>
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Expired">Expired</option>
                      <option value="Resigned">Resigned</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Address</label>
                    <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputCls} placeholder="Current address" />
                  </div>
                  <div>
                    <label className={labelCls}>Emergency Contact</label>
                    <input type="tel" value={formData.emergencyContact} onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })} className={inputCls} placeholder="Emergency phone number" />
                  </div>
                </div>

                {/* Photo + Document */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className={labelCls}>Personnel Photo</label>
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      className={`aspect-square w-32 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group mx-auto sm:mx-0 ${formData.photo ? 'border-blue-500 border-solid' : 'border-slate-200 hover:border-blue-400 dark:border-slate-700'}`}
                    >
                      <input type="file" accept="image/*" ref={photoInputRef} onChange={e => handleFileChange(e, 'photo')} className="hidden" />
                      {formData.photo ? (
                        <img src={formData.photo} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="text-center p-4">
                          <i className="fa-solid fa-camera text-slate-300 text-3xl mb-2"></i>
                          <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase">Upload Photo</p>
                        </div>
                      )}
                      {formData.photo && <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><i className="fa-solid fa-rotate"></i></div>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className={labelCls}>{isDriverDept ? 'Driving License (Front)' : 'National ID (NID)'}</label>
                    <div
                      onClick={() => docInputRef.current?.click()}
                      className={`aspect-video w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${(isDriverDept ? formData.licensePhoto : formData.nidPhoto) ? 'border-emerald-500 border-solid' : 'border-slate-200 hover:border-blue-400 dark:border-slate-700'}`}
                    >
                      <input type="file" accept="image/*" ref={docInputRef} onChange={e => handleFileChange(e, isDriverDept ? 'licensePhoto' : 'nidPhoto')} className="hidden" />
                      {(isDriverDept ? formData.licensePhoto : formData.nidPhoto) ? (
                        <img src={isDriverDept ? formData.licensePhoto : formData.nidPhoto} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="text-center p-6">
                          <i className={`fa-solid ${isDriverDept ? 'fa-id-card' : 'fa-address-card'} text-slate-300 text-4xl mb-3`}></i>
                          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Tap to scan document</p>
                        </div>
                      )}
                      {(isDriverDept ? formData.licensePhoto : formData.nidPhoto) && <div className="absolute inset-0 bg-emerald-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><i className="fa-solid fa-camera"></i></div>}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Notes</label>
                  <input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputCls} placeholder="Any additional notes..." />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-2xl shadow-blue-600/20 transition-all uppercase tracking-[0.2em] active:scale-[0.98]">
                  {editingStaffId ? (lang === 'en' ? 'Update Personnel' : 'আপডেট করুন') : (lang === 'en' ? 'Enroll Staff' : 'সংরক্ষণ করুন')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Profile Viewer */}
      {viewingStaff && (() => {
        const deptId   = getStaffDeptId(viewingStaff);
        const deptConf = getDeptConf(deptId);
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-6 bg-slate-950/95 backdrop-blur-xl animate-in zoom-in-95 duration-300 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl min-h-screen sm:min-h-0 sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
              <button onClick={() => setViewingStaff(null)} className="absolute top-6 right-6 w-12 h-12 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white z-20 transition-all">
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>

              {/* Sidebar */}
              <div className="md:w-[320px] bg-slate-50 dark:bg-slate-800 p-8 flex flex-col items-center text-center border-b md:border-b-0 md:border-r dark:border-slate-700">
                <div
                  className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-8 border-white dark:border-slate-900 shadow-2xl mb-6 relative cursor-pointer group"
                  onClick={() => viewingStaff.photo && setPreviewImage(viewingStaff.photo)}
                >
                  <img
                    src={viewingStaff.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingStaff.name)}&size=300`}
                    className="w-full h-full object-cover" alt="Avatar"
                  />
                  {viewingStaff.photo && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-[2.5rem]">
                      <i className="fa-solid fa-magnifying-glass text-2xl"></i>
                    </div>
                  )}
                  <div className={`absolute bottom-3 right-3 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 shadow-lg ${viewingStaff.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                </div>

                <h3 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">{viewingStaff.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{viewingStaff.role}</p>

                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] mt-3 mb-8 ${deptConf.activeClass}`}>
                  <i className={`fa-solid ${deptConf.icon} text-[9px]`}></i>
                  {lang === 'en' ? deptConf.label : deptConf.labelBn}
                  {viewingStaff.department && COUNTER_LOCATIONS.includes(viewingStaff.department) && (
                    <span className="opacity-70">· {viewingStaff.department.replace(' Counter', '')}</span>
                  )}
                </div>

                <div className="w-full space-y-3">
                  {[
                    { label: 'Member ID', value: viewingStaff.id },
                    { label: 'Monthly Pay', value: `৳ ${(viewingStaff.salary || 0).toLocaleString()}`, green: true },
                    { label: 'Contact', value: viewingStaff.phone || '—' },
                    ...(viewingStaff.emergencyContact ? [{ label: 'Emergency', value: viewingStaff.emergencyContact }] : []),
                    { label: 'Status', value: viewingStaff.status },
                    ...(viewingStaff.licenseNumber ? [{ label: 'License No.', value: viewingStaff.licenseNumber }] : []),
                    ...(viewingStaff.licenseCategory ? [{ label: 'License Category', value: viewingStaff.licenseCategory }] : []),
                    ...(viewingStaff.joiningDate ? [{ label: 'Joined', value: viewingStaff.joiningDate }] : []),
                    ...(viewingStaff.email ? [{ label: 'Email', value: viewingStaff.email }] : []),
                    ...(viewingStaff.nid ? [{ label: 'NID', value: viewingStaff.nid }] : []),
                  ].map(item => (
                    <div key={item.label} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                      <span className={`text-sm font-black ${(item as any).green ? 'text-emerald-600' : 'dark:text-white'}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Area */}
              <div className="flex-1 p-8 sm:p-10 space-y-10">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-shield-halved text-emerald-500"></i> Personnel Credentials
                  </h4>
                  <div className="space-y-8">
                    <div className="group">
                      <div className="flex justify-between items-end mb-4">
                        <p className="font-black uppercase tracking-tighter text-sm italic dark:text-white">
                          {viewingStaff.role.toLowerCase().includes('driver') ? 'Driving License' : 'National ID (NID)'}
                        </p>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">Security Scanned</span>
                      </div>
                      <div
                        className={`aspect-video bg-slate-100 dark:bg-slate-800 rounded-[2rem] border-4 border-slate-50 dark:border-slate-700 overflow-hidden shadow-inner relative group ${(viewingStaff.licensePhoto || viewingStaff.nidPhoto) ? 'cursor-pointer' : ''}`}
                        onClick={() => { const img = viewingStaff.licensePhoto || viewingStaff.nidPhoto; if (img) setPreviewImage(img); }}
                      >
                        {(viewingStaff.licensePhoto || viewingStaff.nidPhoto) ? (
                          <>
                            <img src={viewingStaff.licensePhoto || viewingStaff.nidPhoto} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Document" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <i className="fa-solid fa-magnifying-glass text-3xl"></i>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                            <i className="fa-solid fa-file-excel text-5xl mb-3"></i>
                            <p className="text-[10px] font-black uppercase tracking-widest">No Document Uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* QR Badge */}
                    <div className="bg-slate-900 dark:bg-black p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/5">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-2xl shadow-blue-600/40">
                          <i className="fa-solid fa-fingerprint"></i>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Identity</p>
                          <p className="text-base font-black text-white italic tracking-tight uppercase">DOEL-STAFF-{viewingStaff.id}</p>
                          {viewingStaff.notes && <p className="text-[10px] text-slate-400 mt-1">{viewingStaff.notes}</p>}
                        </div>
                      </div>
                      <div className="w-20 h-20 bg-white p-2.5 rounded-2xl shadow-2xl hidden sm:block">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DOEL_STAFF_${viewingStaff.id}`} className="w-full h-full" alt="QR" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Image Lightbox */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm cursor-pointer" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-[95vw] max-h-[95vh] object-contain rounded-2xl shadow-2xl" alt="Preview" onClick={e => e.stopPropagation()} />
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all" onClick={() => setPreviewImage(null)}>
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default HR;
