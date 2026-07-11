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
function authorize(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    const userRole = req.headers['x-user-role'] || req.query.role; 
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Access Denied: Insufficient Permissions" });
    }
    next();
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API ROUTES ---

  // 1. Finance
  app.get('/api/finance/report', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'DIRECTOR', 'MANAGING_DIRECTOR']), (req, res) => {
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

  app.post('/api/finance/transactions', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']), (req, res) => {
    const newTx = { ...req.body, id: 'TX' + Date.now().toString().slice(-6) };
    db.transactions.push(newTx);
    saveDB(db);
    res.status(201).json(newTx);
  });

  // 2. Sales
  app.get('/api/sales/records', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'SALES']), (req, res) => {
    res.json(db.ticketSales);
  });

  app.post('/api/sales/records', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'SALES', 'COUNTER']), (req, res) => {
    const newRecord = { ...req.body, id: 'REC' + Date.now().toString().slice(-6) };
    db.ticketSales.push(newRecord);
    saveDB(db);
    res.status(201).json(newRecord);
  });

  app.get('/api/sales/export', authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'SALES']), async (req, res) => {
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
  app.get('/api/staff', authorize(['SUPER_ADMIN', 'ADMIN', 'HR']), (req, res) => {
    res.json(db.staff);
  });

  app.post('/api/staff', authorize(['SUPER_ADMIN', 'ADMIN', 'HR']), (req, res) => {
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

  // 4. Coaches, Trips, Counters
  app.get('/api/coaches', (req, res) => res.json(db.coaches));
  app.post('/api/coaches', authorize(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const newCoach = { ...req.body, id: 'C' + Date.now().toString().slice(-4) };
    db.coaches.push(newCoach);
    saveDB(db);
    res.status(201).json(newCoach);
  });

  app.get('/api/trips', (req, res) => res.json(db.trips));
  app.post('/api/trips', authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGER']), (req, res) => {
    const newTrip = { ...req.body, id: 'TRP' + Date.now().toString().slice(-4) };
    db.trips.push(newTrip);
    saveDB(db);
    res.status(201).json(newTrip);
  });

  app.get('/api/counters', (req, res) => res.json(db.counters));
  app.post('/api/counters', authorize(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
    const newCounter = { ...req.body, id: 'CNT-' + Date.now().toString().slice(-4) };
    db.counters.push(newCounter);
    saveDB(db);
    res.status(201).json(newCounter);
  });

  // 5. AI & Notifications
  app.get('/api/forecast/revenue', (req, res) => {
    const last6Months = [450000, 480000, 510000, 495000, 530000, 560000];
    const avgGrowth = (last6Months[5] - last6Months[0]) / 5;
    const forecast = last6Months[5] + avgGrowth;
    res.json({ forecast, confidence: 0.85, trend: 'Upward', message: `Expected revenue: ৳${forecast.toFixed(0)} next month.` });
  });

  app.get('/api/notifications', (req, res) => res.json(db.notifications));
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
