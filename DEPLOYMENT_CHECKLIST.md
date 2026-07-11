# Doel Express ERP — Deployment Checklist
# Target: doelbus.com (Hostinger Shared Hosting)

---

## LOCAL — Before Upload

- [ ] `npm install` — dependencies installed
- [ ] `npm run build` — `dist/` folder created
- [ ] `.env.local` updated with real DB password
- [ ] Test locally: `npm run dev` — no blank page, no errors

---

## HOSTINGER — Server Setup

- [ ] MySQL database exists: `u433063181_doel_bus`
- [ ] MySQL user exists: `u433063181_doel_bus`
- [ ] MySQL user has ALL PRIVILEGES on the database
- [ ] Password set and saved in `.env.local`

---

## FILE UPLOAD — Hostinger File Manager or FTP

Upload to `public_html/`:

- [ ] All files from `dist/` folder (index.html, assets/, etc.)
- [ ] `api/` folder (entire folder)
- [ ] `.htaccess` (root level)
- [ ] `.env.local` (root level — keep private!)

---

## POST-UPLOAD — Final Steps

- [ ] Visit `https://doelbus.com/api/health` → should return `{"success":true}`
- [ ] Visit `https://doelbus.com/api/db-setup?key=doel_setup_2026` → creates all DB tables
- [ ] Visit `https://doelbus.com` → login page loads
- [ ] Login with: `Super admin` / `12345678`
- [ ] Change Super Admin password immediately after first login

---

## DONE!
