# Doel Express ERP - PHP API Documentation

## Overview

This is a RESTful API built with PHP PDO for MySQL. It handles all CRUD operations for the Doel Express ERP system.

---

## Architecture

```
api/
├── index.php              # Main router & request handler
├── db.php                 # Database connection & helper (PDO)
├── schema.php             # Database schema & initialization
├── helpers.php            # Utility functions & response handlers
│
└── routes/
    ├── auth.php           # Authentication (login/register)
    ├── finance.php        # Finance (transactions, reports)
    ├── sales.php          # Ticket sales management
    ├── staff.php          # Staff/HR management
    ├── coaches.php        # Coach/Bus management
    ├── trips.php          # Trip scheduling
    ├── counters.php       # Counter management
    ├── notifications.php  # Notifications
    └── forecast.php       # Revenue forecasting
```

---

## Request Format

### Authentication

All requests (except `/auth`) require role authorization:

```
GET /api/finance/report?role=SUPER_ADMIN&...
POST /api/staff?role=HR
```

Or via header:
```
Authorization: Bearer your-token
X-User-Role: SUPER_ADMIN
```

### Data Format

**JSON Request:**
```json
POST /api/staff
{
  "action": "create",
  "name": "John Doe",
  "role": "Senior Driver",
  "phone": "01712345678",
  "nid": "1234567890",
  "salary": 35000,
  "joiningDate": "2024-06-01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Staff created",
  "data": {
    "id": "EMP-1717232100000001",
    "name": "John Doe",
    ...
  }
}
```

---

## API Reference

### 1. Authentication

#### Login
```
POST /api/auth
{
  "action": "login",
  "username": "Super admin",
  "password": "12345678"
}
```

#### Register
```
POST /api/auth
{
  "action": "register",
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "role": "DRIVER"  // Optional, default: DRIVER
}
```

---

### 2. Finance Management

#### Get Finance Report
```
GET /api/finance/report?role=SUPER_ADMIN&type=income&branch=Dhaka&from=2024-06-01&to=2024-06-30
```

#### Create Transaction
```
POST /api/finance/transactions?role=ACCOUNTS
{
  "date": "2024-06-15",
  "type": "Income",
  "category": "Ticket Sales",
  "amount": 45000,
  "description": "Counter Sales - Dhaka Station",
  "branch": "Dhaka"
}
```

---

### 3. Sales Management

#### Get Sales Records
```
GET /api/sales/records?role=SALES
```

#### Create Sales Record
```
POST /api/sales/records?role=COUNTER
{
  "date": "2024-06-15",
  "regNo": "D-001",
  "coachNo": "C-101",
  "driverName": "Rahim Uddin",
  "guideName": "Sumon Ahmed",
  "departureSeatQty": 32,
  "totalTaka": 27200,
  "ticketsSold": 32,
  "ticketPrice": 850,
  "discount": 0,
  "counterName": "Dhaka Main"
}
```

#### Export Sales Report
```
GET /api/sales/export?role=SALES
```
(Generates CSV file)

---

### 4. Staff Management

#### List Staff
```
GET /api/staff?role=HR
```

#### Get Staff by ID
```
GET /api/staff/EMP-001?role=HR
```

#### Create Staff
```
POST /api/staff?role=HR
{
  "name": "Abdur Rahman",
  "role": "Senior Driver",
  "phone": "01712345678",
  "nid": "1234567890",
  "email": "rahman@doel.com",
  "salary": 35000,
  "joiningDate": "2023-01-10",
  "designaltion": "Senior Driver"
}
```

#### Update Staff
```
PUT /api/staff/EMP-001?role=HR
{
  "salary": 40000,
  "status": "Active"
}
```

#### Delete Staff
```
DELETE /api/staff/EMP-001?role=HR
```

---

### 5. Coach Management

#### List Coaches
```
GET /api/coaches
```

#### Create Coach
```
POST /api/coaches?role=ADMIN
{
  "regNo": "D-003",
  "coachNo": "C-103",
  "type": "AC",
  "seats": 32,
  "status": "Active"
}
```

---

### 6. Trip Management

#### List Trips
```
GET /api/trips
```

#### Create Trip
```
POST /api/trips?role=MANAGER
{
  "busNumber": "D-001",
  "coachNo": "C-101",
  "route": "Dhaka-Sylhet",
  "departureTime": "2024-06-15 08:00:00",
  "driver": "Rahim Uddin",
  "capacity": 32,
  "status": "Scheduled"
}
```

#### Update Trip
```
PUT /api/trips/TRP-001?role=MANAGER
{
  "status": "On Trip",
  "bookedSeats": 28
}
```

---

### 7. Counter Management

#### List Counters
```
GET /api/counters
```

#### Create Counter
```
POST /api/counters?role=ADMIN
{
  "name": "Dhaka East",
  "location": "Dhaka",
  "assignedOperatorId": "sa-001",
  "isActive": true
}
```

#### Update Counter
```
PUT /api/counters/CNT-001?role=ADMIN
{
  "name": "Dhaka Central",
  "assignedOperatorId": "EMP-005",
  "isActive": true
}
```

---

### 8. Notifications

#### Get Notifications
```
GET /api/notifications?user_id=sa-001
```

#### Mark as Read
```
POST /api/notifications/read/NOTIF-001
```

---

### 9. Forecast

#### Get Revenue Forecast
```
GET /api/forecast/revenue
```

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden (Insufficient permissions) |
| 404 | Not Found |
| 405 | Method Not Allowed |
| 500 | Server Error |

---

## Error Handling

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid credentials or account not approved"
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE doel_users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM(...) DEFAULT 'DRIVER',
  isApproved BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Similar tables for: transactions, ticket_sales, staff, coaches, trips, counters, notifications

---

## Development Notes

### Add New Endpoint:

1. Create handler function in `routes/[module].php`
2. Add route in `api/index.php`
3. Use helper classes: `Response::`, `Auth::`, `Utils::`
4. Follow existing patterns for consistency

### Database Operations:

```php
// Get data
$db = Database::getInstance()->getConnection();
$stmt = $db->prepare("SELECT * FROM doel_users WHERE id = ?");
$stmt->execute([$id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Insert
$db->prepare("INSERT INTO table ...")->execute($values);

// Update
$db->prepare("UPDATE table ...")->execute($values);

// Delete
$db->prepare("DELETE FROM table ...")->execute($values);
```

---

## Security

- Passwords hashed with `PASSWORD_BCRYPT`
- Prepared statements prevent SQL injection
- Role-based access control on all sensitive endpoints
- `.env` file stores sensitive credentials
- `.htaccess` prevents direct access to sensitive files

---

## Performance

- Database queries optimized with indexes
- Pagination support for large datasets
- Gzip compression for responses
- Static asset caching configured
