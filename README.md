# 🌾 Kamdhenu Trading - Account Manager
## Setup Guide / સ્થાપના માર્ગદર્શિકા

---

## 📁 Project Structure

```
kamdhenu/
├── frontend/          ← React App (run with npm)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   ├── utils/api.js
│   │   └── pages/
│   │       ├── Auth.jsx
│   │       ├── Dashboard.jsx
│   │       ├── OrdersPage.jsx
│   │       ├── KharidiPage.jsx
│   │       └── AnalyticsPage.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── api/               ← PHP Backend (copy to XAMPP htdocs)
│   ├── config.php
│   ├── auth.php
│   ├── orders.php
│   ├── kharidi.php
│   └── analytics.php
│
└── database/
    └── schema.sql     ← Run this in phpMyAdmin
```

---

## 🚀 Step-by-Step Setup

### Step 1: Database Setup
1. Start **XAMPP** → Start **Apache** and **MySQL**
2. Open **phpMyAdmin** → `http://localhost/phpmyadmin`
3. Click **"New"** → Create database named `kamdhenu_db`
4. Select `kamdhenu_db` → Click **"SQL"** tab
5. Paste contents of `database/schema.sql` → Click **Go**

---

### Step 2: PHP Backend Setup
1. Copy the entire `api/` folder to:
   ```
   C:\xampp\htdocs\kamdhenu\api\
   ```
2. Create the uploads folder:
   ```
   C:\xampp\htdocs\kamdhenu\uploads\
   ```
3. Open `api/config.php` and verify:
   - `DB_USER` = `root` (default XAMPP)
   - `DB_PASS` = `` (empty for XAMPP default)
   - Change `JWT_SECRET` to something unique

4. Test API: Open browser → `http://localhost/kamdhenu/api/auth.php?action=me`
   - Should return `{"error":"Unauthorized"}` ← This is correct! ✅

---

### Step 3: React Frontend Setup
1. Make sure **Node.js** is installed (download from nodejs.org)
2. Open terminal / command prompt in the `frontend/` folder:
   ```bash
   cd path/to/kamdhenu/frontend
   npm install
   npm run dev
   ```
3. Open browser → `http://localhost:3000`

---

## 🔧 Configuration

In `frontend/src/App.jsx`, line 4:
```js
export const API_BASE = 'http://localhost/kamdhenu/api';
```
Change `localhost` if your XAMPP runs on a different host.

---

## 📱 Features

### 🔐 Auth
- Register with Firm Name
- Login / Logout
- JWT-based session (7 days)

### 📦 Orders / Vikri
- Add / Edit / Delete orders
- Upload PDF bill or invoice per order
- Status: Pending / Partial / Credited
- View full order with kharidi details
- Search and filter by status

### 🛒 Kharidi / Purchases
- Link payments to orders (or standalone)
- Multiple payments per order
- Track who paid (Paid By)
- Profit auto-calculated per order
- Order-wise summary view + all entries view

### 📊 Analytics
- Monthly bar chart (order amount, credited, count)
- Weekly bar chart (last 8 weeks)
- Pie chart by organization
- Organization summary table

### 💰 KPI Dashboard (Top)
- Total Orders & Value
- Total Credited
- Total Pending
- Total TDS Cut
- Total Kharidi Spent
- Net Profit

---

## 🆘 Troubleshooting

**API not working?**
- Check XAMPP Apache + MySQL are running
- Check `http://localhost/kamdhenu/api/auth.php?action=me` returns JSON
- Check `config.php` DB credentials

**CORS error?**
- In `config.php`, update the `Access-Control-Allow-Origin` header to match your React dev URL

**File upload not working?**
- Make sure `C:\xampp\htdocs\kamdhenu\uploads\` folder exists
- Check PHP `upload_max_filesize` in php.ini (increase if needed)

---

## 🛠️ Built With
- React 18 + Vite
- Recharts (charts)
- PHP 8 + MySQL (XAMPP)
- JWT authentication (custom implementation)
- Google Fonts: Mukta (Gujarati support) + Playfair Display

---

*Made with ❤️ for Kamdhenu Trading*
