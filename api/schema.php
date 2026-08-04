<?php
/**
 * Database Schema Setup
 * Auto-creates tables on first run
 */

require_once __DIR__ . '/db.php';

class Schema {
  private $db;
  private $prefix = 'doel_';

  public function __construct($connection) {
    $this->db = $connection;
  }

  public function setupTables() {
    $this->createUsers();
    $this->migrateUsersPermissions();
    $this->migrateUsersName();
    $this->migratePhotoColumns();
    $this->createTransactions();
    $this->createTicketSales();
    $this->createStaff();
    $this->migrateStaffLicenseFields();
    $this->createCoaches();
    $this->createTrips();
    $this->createCounters();
    $this->createNotifications();
    $this->createInventory();
    $this->createInventoryIssues();
    $this->createInventoryReceipts();
    $this->createPartsRequisitions();
    $this->createVouchers();
    $this->createBkashRecords();
    $this->createBusBdRecords();
    $this->seedInitialData();
  }

  private function createUsers() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}users (
      id VARCHAR(50) PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('SUPER_ADMIN','MANAGING_DIRECTOR','DIRECTOR','ADMIN','ACCOUNTS','HR','IT','SALES','PURCHASE','MARKETING','MANAGER','COUNTER','DRIVER','SUPERVISOR') DEFAULT 'DRIVER',
      isApproved BOOLEAN DEFAULT FALSE,
      profilePhoto MEDIUMTEXT,
      nidPhoto MEDIUMTEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_role (role),
      INDEX idx_approved (isApproved)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $this->db->exec($sql);
  }

  private function migrateUsersPermissions() {
    try {
      $this->db->exec("ALTER TABLE {$this->prefix}users ADD COLUMN permissions TEXT NULL DEFAULT NULL");
    } catch (Exception $e) {
      // Column already exists — ignore
    }
  }

  private function migrateUsersName() {
    try {
      $this->db->exec("ALTER TABLE {$this->prefix}users ADD COLUMN name VARCHAR(200) NULL DEFAULT NULL AFTER id");
    } catch (Exception $e) {
      // Column already exists — ignore
    }
  }

  private function migratePhotoColumns() {
    // VARCHAR(500) is too small for base64 images — upgrade to MEDIUMTEXT
    $columns = [
      "{$this->prefix}staff"  => ['photo', 'nidPhoto', 'licensePhoto'],
      "{$this->prefix}users"  => ['profilePhoto', 'nidPhoto'],
    ];
    foreach ($columns as $table => $cols) {
      foreach ($cols as $col) {
        try {
          $this->db->exec("ALTER TABLE `$table` MODIFY COLUMN `$col` MEDIUMTEXT NULL DEFAULT NULL");
        } catch (Exception $e) {
          // Column may not exist yet — ignore
        }
      }
    }
  }

  private function migrateStaffLicenseFields() {
    try {
      $this->db->exec("ALTER TABLE {$this->prefix}staff ADD COLUMN licenseNumber VARCHAR(50) NULL DEFAULT NULL AFTER licensePhoto");
    } catch (Exception $e) {
      // Column already exists — ignore
    }
    try {
      $this->db->exec("ALTER TABLE {$this->prefix}staff ADD COLUMN licenseCategory ENUM('Heavy','Medium','Light') NULL DEFAULT NULL AFTER licenseNumber");
    } catch (Exception $e) {
      // Column already exists — ignore
    }
  }

  private function createTransactions() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}transactions (
      id VARCHAR(50) PRIMARY KEY,
      date DATE NOT NULL,
      type ENUM('Income','Expense') NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      description TEXT,
      branch VARCHAR(100),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_date (date),
      INDEX idx_type (type),
      INDEX idx_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $this->db->exec($sql);
  }

  private function createTicketSales() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}ticket_sales (
      id VARCHAR(50) PRIMARY KEY,
      date DATE NOT NULL,
      time TIME,
      regNo VARCHAR(50),
      coachNo VARCHAR(50),
      driverName VARCHAR(100),
      guideName VARCHAR(100),
      operatorName VARCHAR(100),
      counterName VARCHAR(100),
      tripId VARCHAR(50),
      busNumber VARCHAR(50),
      departureDate DATE,
      departureSeatQty INT DEFAULT 0,
      departureTaka DECIMAL(15,2) DEFAULT 0,
      returnDate DATE,
      returnSeatQty INT DEFAULT 0,
      returnTaka DECIMAL(15,2) DEFAULT 0,
      totalTaka DECIMAL(15,2) DEFAULT 0,
      dieselLtr DECIMAL(10,2) DEFAULT 0,
      dieselCost DECIMAL(15,2) DEFAULT 0,
      tripCost DECIMAL(15,2) DEFAULT 0,
      totalCost DECIMAL(15,2) DEFAULT 0,
      netProfit DECIMAL(15,2) DEFAULT 0,
      abdullahpurOffice DECIMAL(15,2) DEFAULT 0,
      coxsbazarOffice DECIMAL(15,2) DEFAULT 0,
      sonargaonOffice DECIMAL(15,2) DEFAULT 0,
      dmd DECIMAL(15,2) DEFAULT 0,
      ticketsSold INT DEFAULT 0,
      ticketPrice DECIMAL(10,2) DEFAULT 0,
      discount DECIMAL(15,2) DEFAULT 0,
      salesCommission DECIMAL(15,2) DEFAULT 0,
      totalAmount DECIMAL(15,2) DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_date (date),
      INDEX idx_tripId (tripId),
      INDEX idx_driverName (driverName)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $this->db->exec($sql);
  }

  private function createStaff() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}staff (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(50) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(100) UNIQUE,
      nid VARCHAR(20) UNIQUE,
      address TEXT,
      designation VARCHAR(100),
      department VARCHAR(100),
      status ENUM('Active','On Leave','Inactive','Expired','Resigned','Terminated') DEFAULT 'Active',
      salary DECIMAL(10,2),
      joiningDate DATE,
      expiryDate DATE,
      photo MEDIUMTEXT,
      nidPhoto MEDIUMTEXT,
      licensePhoto MEDIUMTEXT,
      licenseNumber VARCHAR(50),
      licenseCategory ENUM('Heavy','Medium','Light') NULL,
      emergencyContact VARCHAR(20),
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_nid (nid),
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $this->db->exec($sql);
  }

  private function createCoaches() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}coaches (
      id VARCHAR(50) PRIMARY KEY,
      regNo VARCHAR(50) NOT NULL,
      coachNo VARCHAR(50) NOT NULL,
      type ENUM('AC','Non-AC') DEFAULT 'AC',
      seats INT DEFAULT 32,
      status ENUM('Active','Maintenance','Inactive') DEFAULT 'Active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      UNIQUE KEY uk_regNo (regNo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $this->db->exec($sql);
  }

  private function createTrips() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}trips (
      id VARCHAR(50) PRIMARY KEY,
      busNumber VARCHAR(50),
      coachNo VARCHAR(50),
      route VARCHAR(200),
      departureTime DATETIME,
      status ENUM('Scheduled','On Trip','Completed','Delayed','Cancelled') DEFAULT 'Scheduled',
      driver VARCHAR(100),
      guideName VARCHAR(100),
      capacity INT DEFAULT 32,
      bookedSeats INT DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_departureTime (departureTime)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $this->db->exec($sql);
  }

  private function createCounters() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}counters (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      location VARCHAR(200),
      assignedOperatorId VARCHAR(50),
      isActive BOOLEAN DEFAULT TRUE,
      lastSync DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_isActive (isActive),
      INDEX idx_assignedOperatorId (assignedOperatorId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $this->db->exec($sql);
  }

  private function createNotifications() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}notifications (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50),
      message TEXT NOT NULL,
      `read` BOOLEAN DEFAULT FALSE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_read (`read`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $this->db->exec($sql);
  }

  private function createInventory() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}inventory (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      partNo VARCHAR(100),
      category VARCHAR(100),
      stock INT DEFAULT 0,
      minStock INT DEFAULT 5,
      unit VARCHAR(50),
      lastUpdated DATE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_stock (stock)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $this->db->exec($sql);

    // Add partNo column if the table already existed without it
    try {
      $this->db->exec("ALTER TABLE {$this->prefix}inventory ADD COLUMN partNo VARCHAR(100) AFTER name");
    } catch (Exception $e) {
      // Column already exists — ignore
    }
  }

  private function createInventoryIssues() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}inventory_issues (
      id VARCHAR(50) PRIMARY KEY,
      date DATE NOT NULL,
      itemId VARCHAR(50),
      itemName VARCHAR(200) NOT NULL,
      partNo VARCHAR(100),
      qty INT DEFAULT 0,
      unit VARCHAR(50),
      busNo VARCHAR(100),
      side VARCHAR(50),
      receiver VARCHAR(150),
      remarks VARCHAR(255),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_date (date),
      INDEX idx_item (itemId),
      INDEX idx_bus (busNo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $this->db->exec($sql);

    // Add new columns if the table already existed without them
    foreach ([
      "ALTER TABLE {$this->prefix}inventory_issues ADD COLUMN partNo VARCHAR(100) AFTER itemName",
      "ALTER TABLE {$this->prefix}inventory_issues ADD COLUMN side VARCHAR(50) AFTER busNo",
      "ALTER TABLE {$this->prefix}inventory_issues ADD COLUMN receiver VARCHAR(150) AFTER side",
    ] as $alterSql) {
      try { $this->db->exec($alterSql); } catch (Exception $e) { /* column already exists */ }
    }
  }

  private function createInventoryReceipts() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}inventory_receipts (
      id VARCHAR(50) PRIMARY KEY,
      date DATE NOT NULL,
      itemId VARCHAR(50),
      itemName VARCHAR(200) NOT NULL,
      partNo VARCHAR(100),
      category VARCHAR(100),
      qty INT DEFAULT 0,
      unit VARCHAR(50),
      remarks VARCHAR(255),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_date (date),
      INDEX idx_item (itemId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $this->db->exec($sql);
  }

  private function createPartsRequisitions() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}parts_requisitions (
      id VARCHAR(50) PRIMARY KEY,
      voucherNo VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      ref VARCHAR(150),
      busNo VARCHAR(100),
      receivedName VARCHAR(150),
      items LONGTEXT,
      total VARCHAR(50),
      approvedBy VARCHAR(150),
      foreman VARCHAR(150),
      receivedBySign VARCHAR(150),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_voucherNo (voucherNo),
      INDEX idx_date (date),
      INDEX idx_busNo (busNo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $this->db->exec($sql);
  }

  private function createVouchers() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}vouchers (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      image MEDIUMTEXT,
      images LONGTEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME NOT NULL,
      INDEX idx_expires (expiresAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $this->db->exec($sql);

    // Add images column (JSON array of compressed data URIs) if table already existed without it
    try {
      $this->db->exec("ALTER TABLE {$this->prefix}vouchers ADD COLUMN images LONGTEXT AFTER image");
    } catch (Exception $e) {
      // Column already exists — ignore
    }
  }

  private function createBkashRecords() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}bkash_records (
      id VARCHAR(50) PRIMARY KEY,
      date DATE NOT NULL,
      merchant ENUM('Dhaka','Cox') NOT NULL,
      openingBalance DECIMAL(15,2) DEFAULT 0,
      dailyReceived DECIMAL(15,2) DEFAULT 0,
      merchantToBank DECIMAL(15,2) DEFAULT 0,
      bkashCharge DECIMAL(15,2) DEFAULT 0,
      netBankReceipt DECIMAL(15,2) DEFAULT 0,
      closingBalance DECIMAL(15,2) DEFAULT 0,
      notes TEXT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_date (date),
      INDEX idx_merchant (merchant)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $this->db->exec($sql);
  }

  private function createBusBdRecords() {
    $sql = "CREATE TABLE IF NOT EXISTS {$this->prefix}busbd_records (
      id VARCHAR(50) PRIMARY KEY,
      date DATE NOT NULL,
      openingAmount DECIMAL(15,2) DEFAULT 0,
      noOfTickets INT DEFAULT 0,
      ticketAmount DECIMAL(15,2) DEFAULT 0,
      commission DECIMAL(15,2) DEFAULT 0,
      softwareCommission DECIMAL(15,2) DEFAULT 0,
      doelWithdrawAmount DECIMAL(15,2) DEFAULT 0,
      dailyAmount DECIMAL(15,2) DEFAULT 0,
      closingAmount DECIMAL(15,2) DEFAULT 0,
      notes TEXT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_date (date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $this->db->exec($sql);

    // Add ticket-based commission columns if table already existed without them
    foreach ([
      "ALTER TABLE {$this->prefix}busbd_records ADD COLUMN noOfTickets INT DEFAULT 0 AFTER openingAmount",
      "ALTER TABLE {$this->prefix}busbd_records ADD COLUMN ticketAmount DECIMAL(15,2) DEFAULT 0 AFTER noOfTickets",
      "ALTER TABLE {$this->prefix}busbd_records ADD COLUMN commission DECIMAL(15,2) DEFAULT 0 AFTER ticketAmount",
      "ALTER TABLE {$this->prefix}busbd_records ADD COLUMN softwareCommission DECIMAL(15,2) DEFAULT 0 AFTER commission",
      "ALTER TABLE {$this->prefix}busbd_records ADD COLUMN doelWithdrawAmount DECIMAL(15,2) DEFAULT 0 AFTER softwareCommission",
    ] as $alterSql) {
      try { $this->db->exec($alterSql); } catch (Exception $e) { /* column already exists */ }
    }
  }

  private function seedInitialData() {
    // Check if data exists
    $result = $this->db->query("SELECT COUNT(*) as count FROM {$this->prefix}users");
    $row = $result->fetch(PDO::FETCH_ASSOC);
    
    if ($row['count'] == 0) {
      // Seed default Super Admin user
      $sql = "INSERT INTO {$this->prefix}users 
              (id, username, email, password, role, isApproved, createdAt) 
              VALUES (?, ?, ?, ?, ?, ?, NOW())";
      
      $stmt = $this->db->prepare($sql);
      $stmt->execute([
        'sa-001',
        'Super admin',
        'admin@doel.com',
        password_hash('12345678', PASSWORD_BCRYPT),
        'SUPER_ADMIN',
        true
      ]);

      // Seed initial staff
      $staffSql = "INSERT INTO {$this->prefix}staff 
                   (id, name, role, phone, status, salary, joiningDate, expiryDate, nid, email) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      
      $staffData = [
        ['EMP001', 'Abdur Rahman', 'Senior Driver', '01712345678', 'Active', 35000, '2023-01-10', '2026-05-20', '1234567890', 'rahman@doel.com'],
        ['EMP002', 'Sumon Ahmed', 'Conductor', '01812345678', 'Active', 22000, '2023-03-15', '2026-02-25', '0987654321', 'sumon@doel.com'],
        ['EMP003', 'Nazrul Islam', 'Mechanic', '01912345678', 'Active', 28000, '2022-11-20', '2025-11-20', '1122334455', 'nazrul@doel.com'],
        ['EMP004', 'Farhana Akter', 'Counter Manager', '01512345678', 'On Leave', 25000, '2023-06-01', '2026-06-01', '5544332211', 'farhana@doel.com'],
      ];

      $staffStmt = $this->db->prepare($staffSql);
      foreach ($staffData as $staff) {
        $staffStmt->execute($staff);
      }

      // Seed initial coaches
      $coachSql = "INSERT INTO {$this->prefix}coaches 
                   (id, regNo, coachNo, type, seats, status) 
                   VALUES (?, ?, ?, ?, ?, ?)";
      
      $coachData = [
        ['C1', 'D-001', 'C-101', 'AC', 32, 'Active'],
        ['C2', 'D-002', 'C-102', 'Non-AC', 40, 'Active'],
      ];

      $coachStmt = $this->db->prepare($coachSql);
      foreach ($coachData as $coach) {
        $coachStmt->execute($coach);
      }

      // Seed initial counters
      $counterSql = "INSERT INTO {$this->prefix}counters 
                     (id, name, location, assignedOperatorId, isActive, lastSync) 
                     VALUES (?, ?, ?, ?, ?, NOW())";
      
      $counterData = [
        ['CNT-001', 'Dhaka Main', 'Dhaka', 'sa-001', true],
        ['CNT-002', 'Chittagong Port', 'Chittagong', 'sa-001', true],
      ];

      $counterStmt = $this->db->prepare($counterSql);
      foreach ($counterData as $counter) {
        $counterStmt->execute($counter);
      }
    }
  }
}

// Auto-run schema setup if accessed directly
if (php_sapi_name() === 'cli' || (isset($_GET['action']) && $_GET['action'] === 'setup')) {
  try {
    $schema = new Schema(Database::getInstance()->getConnection());
    $schema->setupTables();
    echo json_encode(['success' => true, 'message' => 'Database tables created and seeded successfully']);
  } catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
  }
}
