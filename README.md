# Doel Express ERP

Fleet & Business Management System for **Doel Express** bus service company.

**Live Site:** https://doelbus.com  
**Developed by:** Zojon Digital Solutions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend (Production) | PHP 8+ with PDO MySQL |
| Backend (Local Dev) | Node.js Express + Vite |
| Database | MySQL (Hostinger) |
| Hosting | Hostinger Shared Hosting |

---

## Local Development

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

App runs at: http://localhost:3000

**Default login:**
- Username: `Super admin`
- Password: `12345678`

---

## Production Deployment (Hostinger → doelbus.com)

### Step 1 — Build the frontend
```bash
npm run build
```
This creates a `dist/` folder.

### Step 2 — Update `.env.local`
```
DB_HOST=localhost
DB_NAME=u433063181_doel_bus
DB_USER=u433063181_doel_bus
DB_PASS=your_actual_password
```

### Step 3 — Upload to Hostinger (public_html)

Upload these to `public_html/`:
```
dist/          → upload all contents of dist/ directly (not the folder)
api/           → upload entire api/ folder
.htaccess      → upload to root
.env.local     → upload to root (keep private!)
```

Final structure on server:
```
public_html/
├── index.html         ← from dist/
├── assets/            ← from dist/
├── api/
│   ├── index.php
│   ├── db.php
│   ├── schema.php
│   ├── helpers.php
│   └── routes/
├── .htaccess
└── .env.local
```

### Step 4 — Initialize Database

Visit once to create all tables:
```
https://doelbus.com/api/db-setup?key=doel_setup_2026
```

---

## Database Info

- **Host:** Hostinger cPanel → MySQL Databases
- **Database:** `u433063181_doel_bus`
- **User:** `u433063181_doel_bus`
- **Tables (auto-created):** users, staff, coaches, trips, ticket_sales, transactions, counters, notifications, inventory

---

## Features

- Dashboard with AI insights
- Fleet & Schedule management
- Ticket Sales Records
- Counter Management
- Inventory tracking
- Finance & Reports
- HR Management
- Role-based access control (14 roles)
- Dark mode + Bilingual (EN/BN)
