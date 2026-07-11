import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import cron from 'node-cron';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Persistence
const DB_PATH = path.join(__dirname, 'db.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      transactions: [
        { id: 'TX001', date: '2024-05-20', type: 'Income', category: 'Ticket Sales', amount: 45000, description: 'Counter Sales - Dhaka Station', branch: 'Dhaka' },
        { id: 'TX002', date: '2024-05-20', type: 'Expense', category: 'Fuel', amount: 12000, description: 'Bus D-001 Refuel', branch: 'Dhaka' },
        { id: 'TX003', date: '2024-05-19', type: 'Expense', category: 'Maintenance', amount: 5500, description: 'Brake repair for D-008', branch: 'Rajshahi' },
        { id: 'TX004', date: '2024-05-19', type: 'Income', category: 'Online Booking', amount: 22500, description: 'App bookings - Sylhet Route', branch: 'Sylhet' },
      ],
      ticketSales: [
        {
          id: 'REC001',
          date: '2024-05-20',
          regNo: 'D-001',
          coachNo: 'C-101',
          driverName: 'Rahim Uddin',
          guideName: 'Sumon Ahmed',
          departureDate: '2024-05-20',
          departureSeatQty: 32,
          departureTaka: 27200,
          returnDate: '2024-05-21',
          returnSeatQty: 28,
          returnTaka: 23800,
          totalTaka: 51000,
          dieselLtr: 120,
          dieselCost: 12000,
          tripCost: 5000,
          totalCost: 17000,
          netProfit: 34000,
          abdullahpurOffice: 1000,
          coxsbazarOffice: 1500,
          sonargaonOffice: 800,
          dmd: 2000
        }
      ],
      staff: [
        { id: 'EMP001', name: 'Abdur Rahman', role: 'Senior Driver', phone: '01712345678', status: 'Active', salary: 35000, joiningDate: '2023-01-10', expiryDate: '2026-05-20', nid: '1234567890', email: 'rahman@doel.com' },
        { id: 'EMP002', name: 'Sumon Ahmed', role: 'Conductor', phone: '01812345678', status: 'Active', salary: 22000, joiningDate: '2023-03-15', expiryDate: '2026-02-25', nid: '0987654321', email: 'sumon@doel.com' },
        { id: 'EMP003', name: 'Nazrul Islam', role: 'Mechanic', phone: '01912345678', status: 'Active', salary: 28000, joiningDate: '2022-11-20', expiryDate: '2025-11-20', nid: '1122334455', email: 'nazrul@doel.com' },
        { id: 'EMP004', name: 'Farhana Akter', role: 'Counter Manager', phone: '01512345678', status: 'On Leave', salary: 25000, joiningDate: '2023-06-01', expiryDate: '2026-06-01', nid: '5544332211', email: 'farhana@doel.com' },
      ],
      notifications: [
        { id: '1', user_id: 'sa-001', message: 'System upgrade completed successfully.', read: false, createdAt: new Date().toISOString() },
        { id: '2', user_id: 'sa-001', message: 'Staff Sumon Ahmed\'s contract expires in 6 days.', read: false, createdAt: new Date().toISOString() },
      ],
      coaches: [
        { id: 'C1', regNo: 'D-001', coachNo: 'C-101', type: 'AC', seats: 32, status: 'Active' },
        { id: 'C2', regNo: 'D-002', coachNo: 'C-102', type: 'Non-AC', seats: 40, status: 'Active' },
      ],
      trips: [],
      counters: [
        { id: 'CNT-001', name: 'Dhaka Main', location: 'Dhaka', assignedOperatorId: 'u-001', isActive: true, lastSync: '2024-05-20 10:00 AM' },
        { id: 'CNT-002', name: 'Chittagong Port', location: 'Chittagong', assignedOperatorId: 'u-002', isActive: true, lastSync: '2024-05-20 09:30 AM' },
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

let db = loadDB();

// Middleware for Role-Based Access Control
function authorize(allowedRoles: string[], module?: string) {
  return (req: any, res: any, next: any) => {
    const userRole = (req.headers['x-user-role'] || req.query.role) as string;
    const userId = req.headers['x-user-id'] as string;
    if (userRole && allowedRoles.includes(userRole)) return next();
    // Fallback: check the user's custom permissions stored in db.users
    if (module && userId) {
      const user = (db.users || []).find((u: any) => u.id === userId);
      if (user && Array.isArray(user.permissions) && user.permissions.includes(module)) {
        return next();
      }
    }
    return res.status(403).json({ success: false, message: "Insufficient permissions" });
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API ROUTES ---

  // 1. Finance
  app.get('/api/finance/report', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'DIRECTOR', 'MANAGING_DIRECTOR'], 'finance'), (req, res) => {

    const { type, branch, category, from, to } = req.query;
    let filtered = db.transactions;
    if (type && type !== 'all') filtered = filtered.filter((t: any) => t.type.toLowerCase() === (type as string).toLowerCase());
    if (branch) filtered = filtered.filter((t: any) => t.branch === branch);
    if (category) filtered = filtered.filter((t: any) => t.category === category);
    if (from && to) filtered = filtered.filter((t: any) => t.date >= (from as string) && t.date <= (to as string));

    const total_income = filtered.filter((t: any) => t.type === 'Income').reduce((sum: number, t: any) => sum + t.amount, 0);
    const total_expense = filtered.filter((t: any) => t.type === 'Expense').reduce((sum: number, t: any) => sum + t.amount, 0);
    const net_profit = total_income - total_expense;

    const chart_data = filtered.reduce((acc: any[], t: any) => {
      const existing = acc.find(item => item.date === t.date);
      if (existing) {
        if (t.type === 'Income') existing.income += t.amount;
        else existing.expense += t.amount;
      } else {
        acc.push({ date: t.date, income: t.type === 'Income' ? t.amount : 0, expense: t.type === 'Expense' ? t.amount : 0 });
      }
      return acc;
    }, []).sort((a, b) => a.date.localeCompare(b.date));

    res.json({ total_income, total_expense, net_profit, chart_data, transactions: filtered });
  });

  app.post('/api/finance/transactions', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'], 'finance'), (req, res) => {
    const newTx = { ...req.body, id: req.body.id || ('TX' + Date.now().toString().slice(-6)) };
    db.transactions.push(newTx);
    saveDB(db);
    res.status(201).json({ success: true, data: newTx });
  });

  // POST /api/finance — save transaction (used by apiSync)
  app.post('/api/finance', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'DIRECTOR', 'MANAGING_DIRECTOR'], 'finance'), (req, res) => {
    if (!db.transactions) db.transactions = [];
    const tx = { ...req.body, id: req.body.id || ('TX' + Date.now().toString().slice(-6)) };
    const exists = db.transactions.findIndex((t: any) => t.id === tx.id);
    if (exists >= 0) db.transactions[exists] = tx;
    else db.transactions.unshift(tx);
    saveDB(db);
    res.status(201).json({ success: true, data: tx });
  });

  app.put('/api/finance/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'], 'finance'), (req, res) => {
    const idx = (db.transactions || []).findIndex((t: any) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
    db.transactions[idx] = { ...db.transactions[idx], ...req.body };
    saveDB(db);
    res.json({ success: true });
  });

  app.delete('/api/finance/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'], 'finance'), (req, res) => {
    db.transactions = (db.transactions || []).filter((t: any) => t.id !== req.params.id);
    saveDB(db);
    res.json({ success: true });
  });

  // 2. Sales
  app.get('/api/sales/records', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'SALES', 'MANAGER', 'COUNTER'], 'ticketSalesRecord'), (req, res) => {
    res.json({ success: true, data: db.ticketSales || [] });
  });

  app.post('/api/sales/records', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'SALES', 'COUNTER', 'MANAGER'], 'ticketSalesRecord'), (req, res) => {
    if (!db.ticketSales) db.ticketSales = [];
    const newRecord = { ...req.body, id: req.body.id || ('REC' + Date.now().toString().slice(-6)) };
    const exists = db.ticketSales.findIndex((r: any) => r.id === newRecord.id);
    if (exists >= 0) db.ticketSales[exists] = newRecord;
    else db.ticketSales.unshift(newRecord);
    saveDB(db);
    res.status(201).json({ success: true, data: newRecord });
  });

  app.put('/api/sales/records/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'SALES'], 'ticketSalesRecord'), (req, res) => {
    if (!db.ticketSales) db.ticketSales = [];
    const idx = db.ticketSales.findIndex((r: any) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
    db.ticketSales[idx] = { ...db.ticketSales[idx], ...req.body };
    saveDB(db);
    res.json({ success: true });
  });

  app.delete('/api/sales/records/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'SALES'], 'ticketSalesRecord'), (req, res) => {
    db.ticketSales = (db.ticketSales || []).filter((r: any) => r.id !== req.params.id);
    saveDB(db);
    res.json({ success: true });
  });

  app.get('/api/sales/export', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'SALES'], 'ticketSalesRecord'), async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");
    sheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Reg No", key: "regNo", width: 15 },
      { header: "Coach No", key: "coachNo", width: 15 },
      { header: "Driver", key: "driverName", width: 20 },
      { header: "Total Taka", key: "totalTaka", width: 15 },
      { header: "Total Cost", key: "totalCost", width: 15 },
      { header: "Net Profit", key: "netProfit", width: 15 }
    ];
    sheet.addRows(db.ticketSales);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  });

  // 3. Staff & HR
  app.get('/api/staff', authorize(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER', 'ACCOUNTS', 'SALES', 'COUNTER', 'SUPERVISOR', 'IT'], 'hr'), (req, res) => {
    res.json({ success: true, data: db.staff });
  });

  app.post('/api/staff', authorize(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'hr'), (req, res) => {
    const { name, nid, email } = req.body;
    if (!name || !nid) return res.status(400).json({ message: "Name and NID are mandatory." });
    if (db.staff.some((s: any) => s.nid === nid || (email && s.email === email))) {
      return res.status(400).json({ message: "Duplicate record: NID or Email already exists." });
    }
    const newStaff = { ...req.body, id: "ZJ-" + Math.floor(Math.random() * 1000000), status: 'Active' };
    db.staff.push(newStaff);
    saveDB(db);
    res.status(201).json(newStaff);
  });

  app.put('/api/staff/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'hr'), (req, res) => {
    if (!db.staff) db.staff = [];
    const idx = db.staff.findIndex((s: any) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Staff not found' });
    db.staff[idx] = { ...db.staff[idx], ...req.body };
    saveDB(db);
    res.json({ success: true, data: db.staff[idx] });
  });

  app.delete('/api/staff/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGING_DIRECTOR', 'DIRECTOR'], 'hr'), (req, res) => {
    if (!db.staff) db.staff = [];
    const staff = db.staff.find((s: any) => s.id === req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    db.staff = db.staff.filter((s: any) => s.id !== req.params.id);
    saveDB(db);
    res.json({ success: true });
  });

  // 4. Coaches, Trips, Counters, Inventory
  app.get('/api/coaches', (req, res) => res.json({ success: true, data: db.coaches || [] }));
  app.post('/api/coaches', authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER', 'IT', 'SUPERVISOR'], 'fleetManagement'), (req, res) => {
    if (!db.coaches) db.coaches = [];
    const c = { ...req.body, id: req.body.id || ('C' + Date.now().toString().slice(-4)) };
    db.coaches.push(c);
    saveDB(db);
    res.status(201).json({ success: true, data: c });
  });
  app.put('/api/coaches/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER', 'IT', 'SUPERVISOR'], 'fleetManagement'), (req, res) => {
    const idx = (db.coaches || []).findIndex((c: any) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false });
    db.coaches[idx] = { ...db.coaches[idx], ...req.body };
    saveDB(db);
    res.json({ success: true });
  });
  app.delete('/api/coaches/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'fleetManagement'), (req, res) => {
    db.coaches = (db.coaches || []).filter((c: any) => c.id !== req.params.id);
    saveDB(db);
    res.json({ success: true });
  });

  app.get('/api/trips', (req, res) => res.json({ success: true, data: db.trips || [] }));
  app.post('/api/trips', authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER', 'IT', 'SUPERVISOR'], 'fleetManagement'), (req, res) => {
    if (!db.trips) db.trips = [];
    const t = { ...req.body, id: req.body.id || ('TRP' + Date.now().toString().slice(-4)) };
    db.trips.push(t);
    saveDB(db);
    res.status(201).json({ success: true, data: t });
  });
  app.put('/api/trips/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER', 'IT', 'SUPERVISOR'], 'fleetManagement'), (req, res) => {
    const idx = (db.trips || []).findIndex((t: any) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false });
    db.trips[idx] = { ...db.trips[idx], ...req.body };
    saveDB(db);
    res.json({ success: true });
  });
  app.delete('/api/trips/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'fleetManagement'), (req, res) => {
    db.trips = (db.trips || []).filter((t: any) => t.id !== req.params.id);
    saveDB(db);
    res.json({ success: true });
  });

  app.get('/api/counters', (req, res) => res.json({ success: true, data: db.counters || [] }));
  app.post('/api/counters', authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'counters'), (req, res) => {
    if (!db.counters) db.counters = [];
    const c = { ...req.body, id: req.body.id || ('CNT-' + Date.now().toString().slice(-4)) };
    db.counters.push(c);
    saveDB(db);
    res.status(201).json({ success: true, data: c });
  });
  app.put('/api/counters/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'counters'), (req, res) => {
    const idx = (db.counters || []).findIndex((c: any) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false });
    db.counters[idx] = { ...db.counters[idx], ...req.body };
    saveDB(db);
    res.json({ success: true });
  });
  app.delete('/api/counters/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR'], 'counters'), (req, res) => {
    db.counters = (db.counters || []).filter((c: any) => c.id !== req.params.id);
    saveDB(db);
    res.json({ success: true });
  });

  // Inventory
  app.get('/api/inventory', (req, res) => res.json({ success: true, data: db.inventory || [] }));
  app.post('/api/inventory', authorize(['SUPER_ADMIN', 'ADMIN', 'PURCHASE', 'SUPERVISOR', 'MANAGING_DIRECTOR', 'DIRECTOR'], 'inventory'), (req, res) => {
    if (!db.inventory) db.inventory = [];
    const item = { ...req.body, id: req.body.id || ('INV' + Date.now().toString().slice(-6)) };
    db.inventory.push(item);
    saveDB(db);
    res.status(201).json({ success: true, data: item });
  });
  app.put('/api/inventory/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'PURCHASE', 'SUPERVISOR', 'MANAGING_DIRECTOR', 'DIRECTOR'], 'inventory'), (req, res) => {
    const idx = (db.inventory || []).findIndex((i: any) => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false });
    db.inventory[idx] = { ...db.inventory[idx], ...req.body };
    saveDB(db);
    res.json({ success: true });
  });
  app.delete('/api/inventory/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'PURCHASE', 'SUPERVISOR', 'MANAGING_DIRECTOR', 'DIRECTOR'], 'inventory'), (req, res) => {
    db.inventory = (db.inventory || []).filter((i: any) => i.id !== req.params.id);
    saveDB(db);
    res.json({ success: true });
  });

  // 5. User Management
  // Any authenticated user can fetch their own profile (for self-sync on login)
  app.get('/api/users/:id', (req, res) => {
    const userRole = req.headers['x-user-role'] || req.query.role;
    if (!userRole) return res.status(401).json({ success: false, message: 'Authorization required' });
    if (!db.users) return res.status(404).json({ success: false, message: 'User not found' });
    const user = db.users.find((u: any) => u.id === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  });

  // Any authenticated user can update their own profile (password, photo, etc.)
  app.put('/api/users/:id', (req, res) => {
    const userRole = (req.headers['x-user-role'] || req.query.role) as string;
    if (!userRole) return res.status(401).json({ success: false, message: 'Authorization required' });
    if (!db.users) db.users = [];
    const idx = db.users.findIndex((u: any) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'User not found' });
    if (db.users[idx].role === 'SUPER_ADMIN' && req.body.role && req.body.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot change Super Admin role' });
    }
    const isPrivileged = userRole === 'SUPER_ADMIN' || userRole === 'IT';
    if (isPrivileged) {
      db.users[idx] = { ...db.users[idx], ...req.body };
    } else {
      // Non-privileged: only allow safe self-profile fields
      const { role: _r, isApproved: _a, permissions: _p, ...safeUpdates } = req.body;
      db.users[idx] = { ...db.users[idx], ...safeUpdates };
    }
    saveDB(db);
    res.json({ success: true, data: { id: req.params.id } });
  });

  app.get('/api/users', authorize(['SUPER_ADMIN', 'IT']), (req, res) => {
    const safeUsers = (db.users || []).map(({ password: _, ...u }: any) => u);
    res.json({ success: true, data: safeUsers });
  });

  app.post('/api/users', authorize(['SUPER_ADMIN', 'IT']), (req, res) => {
    const { name, username, email, password, role, isApproved } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required' });
    }
    if (!db.users) db.users = [];
    const exists = db.users.find((u: any) => u.username === username || u.email === email);
    if (exists) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }
    const newUser = {
      id: 'U-' + Date.now().toString().slice(-8),
      name: name || null,
      username, email, password,
      role: role || 'DRIVER',
      isApproved: isApproved !== undefined ? isApproved : true,
      createdAt: new Date().toISOString().split('T')[0],
    };
    db.users.push(newUser);
    saveDB(db);
    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, data: safeUser });
  });

  app.delete('/api/users/:id', authorize(['SUPER_ADMIN', 'IT']), (req, res) => {
    if (!db.users) db.users = [];
    const user = db.users.find((u: any) => u.id === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'SUPER_ADMIN') return res.status(403).json({ success: false, message: 'Cannot delete Super Admin' });
    db.users = db.users.filter((u: any) => u.id !== req.params.id);
    saveDB(db);
    res.json({ success: true, data: { id: req.params.id } });
  });

  // Factory Reset — wipes ALL data to empty, users preserved
  app.post('/api/system/reset', authorize(['SUPER_ADMIN']), (req, res) => {
    const currentUsers = db.users || [];
    db.transactions = [];
    db.ticketSales = [];
    db.trips = [];
    db.notifications = [];
    db.staff = [];
    db.coaches = [];
    db.counters = [];
    db.inventory = [];
    db.bkashRecords = [];
    db.busBdRecords = [];
    db.users = currentUsers;
    saveDB(db);
    res.json({ success: true, message: 'Factory reset complete. All data cleared. Users preserved.' });
  });

  // 6. bKash
  const BKASH_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'];
  app.get('/api/bkash', authorize(BKASH_ROLES, 'bkash'), (req, res) => {
    res.json({ success: true, data: db.bkashRecords || [] });
  });
  app.post('/api/bkash', authorize(BKASH_ROLES, 'bkash'), (req, res) => {
    if (!db.bkashRecords) db.bkashRecords = [];
    const r = { ...req.body, id: req.body.id || ('BKS-' + Date.now().toString().slice(-8)) };
    const idx = db.bkashRecords.findIndex((x: any) => x.id === r.id);
    if (idx >= 0) db.bkashRecords[idx] = r;
    else db.bkashRecords.unshift(r);
    saveDB(db);
    res.status(201).json({ success: true, data: r });
  });
  app.put('/api/bkash/:id', authorize(BKASH_ROLES, 'bkash'), (req, res) => {
    if (!db.bkashRecords) db.bkashRecords = [];
    const idx = db.bkashRecords.findIndex((x: any) => x.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
    db.bkashRecords[idx] = { ...db.bkashRecords[idx], ...req.body };
    saveDB(db);
    res.json({ success: true });
  });
  app.delete('/api/bkash/:id', authorize(BKASH_ROLES, 'bkash'), (req, res) => {
    db.bkashRecords = (db.bkashRecords || []).filter((x: any) => x.id !== req.params.id);
    saveDB(db);
    res.json({ success: true });
  });

  // 7. Bus BD
  const BUSBD_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'];
  app.get('/api/busbd', authorize(BUSBD_ROLES, 'busbd'), (req, res) => {
    res.json({ success: true, data: db.busBdRecords || [] });
  });
  app.post('/api/busbd', authorize(BUSBD_ROLES, 'busbd'), (req, res) => {
    if (!db.busBdRecords) db.busBdRecords = [];
    const r = { ...req.body, id: req.body.id || ('BBD-' + Date.now().toString().slice(-8)) };
    const idx = db.busBdRecords.findIndex((x: any) => x.id === r.id);
    if (idx >= 0) db.busBdRecords[idx] = r;
    else db.busBdRecords.unshift(r);
    saveDB(db);
    res.status(201).json({ success: true, data: r });
  });
  app.put('/api/busbd/:id', authorize(BUSBD_ROLES, 'busbd'), (req, res) => {
    if (!db.busBdRecords) db.busBdRecords = [];
    const idx = db.busBdRecords.findIndex((x: any) => x.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
    db.busBdRecords[idx] = { ...db.busBdRecords[idx], ...req.body };
    saveDB(db);
    res.json({ success: true });
  });
  app.delete('/api/busbd/:id', authorize(BUSBD_ROLES, 'busbd'), (req, res) => {
    db.busBdRecords = (db.busBdRecords || []).filter((x: any) => x.id !== req.params.id);
    saveDB(db);
    res.json({ success: true });
  });

  // 8. AI & Notifications
  app.get('/api/forecast/revenue', (req, res) => {
    const last6Months = [450000, 480000, 510000, 495000, 530000, 560000];
    const avgGrowth = (last6Months[5] - last6Months[0]) / 5;
    const forecast = last6Months[5] + avgGrowth;
    res.json({ forecast, confidence: 0.85, trend: 'Upward', message: `Expected revenue: ৳${forecast.toFixed(0)} next month.` });
  });

  app.get('/api/notifications', (req, res) => res.json({ success: true, data: db.notifications }));
  app.get('/api/finance', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'DIRECTOR', 'MANAGING_DIRECTOR'], 'finance'), (req, res) => {
    const transactions = db.transactions;
    res.json({ success: true, data: { transactions } });
  });
  app.post('/api/notifications/read/:id', (req, res) => {
    db.notifications = db.notifications.map((n: any) => n.id === req.params.id ? { ...n, read: true } : n);
    saveDB(db);
    res.json({ success: true });
  });

  // --- CRON JOBS ---
  cron.schedule('0 0 * * *', () => {
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    db.staff.forEach((member: any) => {
      if (member.expiryDate) {
        const expiry = new Date(member.expiryDate);
        if (expiry <= today) member.status = 'Expired';
      }
    });
    saveDB(db);
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
