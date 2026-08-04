<?php
/**
 * Main API Router
 * All requests go through this file first
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/schema.php';

// Initialize database
$db_instance = Database::getInstance();

// Parse request
$method = Utils::getRequestMethod();
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$path = str_replace('/api/', '', $path);
$segments = array_filter(explode('/', $path));
$segments = array_values($segments);

$action = $segments[0] ?? null;
$id = $segments[1] ?? null;
$subaction = $segments[2] ?? null;

$data = Utils::getRequestData();

try {
  // Route dispatcher
  switch ($action) {
    // ========== AUTHENTICATION ==========
    case 'auth':
      if ($method === 'POST') {
        require_once __DIR__ . '/routes/auth.php';
        handleAuth($db_instance, $data);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== FINANCE ==========
    case 'finance':
      $role = Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'DIRECTOR', 'MANAGING_DIRECTOR'], 'finance');
      require_once __DIR__ . '/routes/finance.php';

      if ($method === 'GET') {
        handleFinanceReport($db_instance, $data);
      } elseif ($method === 'POST') {
        handleFinanceTransaction($db_instance, $data);
      } elseif ($method === 'PUT' && $id) {
        handleFinanceUpdate($db_instance, $id, $data);
      } elseif ($method === 'DELETE' && $id) {
        handleFinanceDelete($db_instance, $id);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== SALES ==========
    case 'sales':
      if ($id === 'records') {
        $role = Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'SALES', 'MANAGER', 'COUNTER'], 'ticketSalesRecord');
        require_once __DIR__ . '/routes/sales.php';

        if ($method === 'GET') {
          handleSalesRecords($db_instance, $data);
        } elseif ($method === 'POST') {
          handleSalesCreate($db_instance, $data);
        } elseif ($method === 'PUT' && $subaction) {
          handleSalesUpdate($db_instance, $subaction, $data);
        } elseif ($method === 'DELETE' && $subaction) {
          handleSalesDelete($db_instance, $subaction);
        } else {
          Response::error('Method not allowed', 405);
        }
      } elseif ($id === 'export') {
        $role = Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'SALES'], 'ticketSalesRecord');
        require_once __DIR__ . '/routes/sales.php';
        handleSalesExport($db_instance, $data);
      } else {
        Response::error('Invalid sales endpoint', 404);
      }
      break;

    // ========== STAFF ==========
    case 'staff':
      require_once __DIR__ . '/routes/staff.php';
      if ($method === 'GET') {
        // All authenticated roles can read staff (needed for driver/guide selection in ticketing)
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'ACCOUNTS', 'SALES', 'COUNTER', 'SUPERVISOR', 'DIRECTOR', 'MANAGING_DIRECTOR', 'IT']);
        if ($id) handleStaffGet($db_instance, $id);
        else handleStaffList($db_instance, $data);
      } elseif ($method === 'POST') {
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'hr');
        handleStaffCreate($db_instance, $data);
      } elseif ($method === 'PUT' && $id) {
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'hr');
        handleStaffUpdate($db_instance, $id, $data);
      } elseif ($method === 'DELETE' && $id) {
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGING_DIRECTOR', 'DIRECTOR'], 'hr');
        handleStaffDelete($db_instance, $id);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== COACHES ==========
    case 'coaches':
      require_once __DIR__ . '/routes/coaches.php';
      if ($method === 'GET') {
        if ($id) handleCoachGet($db_instance, $id);
        else handleCoachList($db_instance, $data);
      } elseif ($method === 'POST') {
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'fleetManagement');
        handleCoachCreate($db_instance, $data);
      } elseif ($method === 'PUT' && $id) {
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'fleetManagement');
        handleCoachUpdate($db_instance, $id, $data);
      } elseif ($method === 'DELETE' && $id) {
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR'], 'fleetManagement');
        handleCoachDelete($db_instance, $id);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== TRIPS ==========
    case 'trips':
      require_once __DIR__ . '/routes/trips.php';
      if ($method === 'GET') {
        if ($id) handleTripGet($db_instance, $id);
        else handleTripList($db_instance, $data);
      } elseif ($method === 'POST') {
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER', 'IT', 'SUPERVISOR'], 'fleetManagement');
        handleTripCreate($db_instance, $data);
      } elseif ($method === 'PUT' && $id) {
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER', 'IT', 'SUPERVISOR'], 'fleetManagement');
        handleTripUpdate($db_instance, $id, $data);
      } elseif ($method === 'DELETE' && $id) {
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'fleetManagement');
        handleTripDelete($db_instance, $id);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== COUNTERS ==========
    case 'counters':
      require_once __DIR__ . '/routes/counters.php';
      if ($method === 'GET') {
        if ($id) handleCounterGet($db_instance, $id);
        else handleCounterList($db_instance, $data);
      } elseif ($method === 'POST') {
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'counters');
        handleCounterCreate($db_instance, $data);
      } elseif ($method === 'PUT' && $id) {
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'counters');
        handleCounterUpdate($db_instance, $id, $data);
      } elseif ($method === 'DELETE' && $id) {
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR'], 'counters');
        handleCounterDelete($db_instance, $id);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== INVENTORY ==========
    case 'inventory':
      Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'PURCHASE', 'SUPERVISOR', 'MANAGING_DIRECTOR', 'DIRECTOR'], 'inventory');
      require_once __DIR__ . '/routes/inventory.php';
      if ($method === 'GET') {
        handleInventoryList($db_instance, $data);
      } elseif ($method === 'POST') {
        handleInventoryCreate($db_instance, $data);
      } elseif ($method === 'PUT' && $id) {
        handleInventoryUpdate($db_instance, $id, $data);
      } elseif ($method === 'DELETE' && $id) {
        handleInventoryDelete($db_instance, $id);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== INVENTORY ISSUES (Bus No log) ==========
    case 'inventory-issues':
      Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'PURCHASE', 'SUPERVISOR', 'MANAGING_DIRECTOR', 'DIRECTOR'], 'inventory');
      require_once __DIR__ . '/routes/inventory.php';
      if ($method === 'GET') {
        handleInventoryIssueList($db_instance);
      } elseif ($method === 'POST') {
        handleInventoryIssueCreate($db_instance, $data);
      } elseif ($method === 'DELETE' && $id) {
        handleInventoryIssueDelete($db_instance, $id);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== INVENTORY RECEIPTS (per-item stock-in log) ==========
    case 'inventory-receipts':
      Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'PURCHASE', 'SUPERVISOR', 'MANAGING_DIRECTOR', 'DIRECTOR'], 'inventory');
      require_once __DIR__ . '/routes/inventory.php';
      if ($method === 'GET') {
        handleInventoryReceiptList($db_instance);
      } elseif ($method === 'POST') {
        handleInventoryReceiptCreate($db_instance, $data);
      } elseif ($method === 'DELETE' && $id) {
        handleInventoryReceiptDelete($db_instance, $id);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== PARTS REQUISITION SLIPS ==========
    case 'parts-requisitions':
      Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'PURCHASE', 'SUPERVISOR', 'MANAGING_DIRECTOR', 'DIRECTOR'], 'inventory');
      require_once __DIR__ . '/routes/parts_requisitions.php';
      if ($method === 'GET') {
        handlePartsRequisitionList($db_instance);
      } elseif ($method === 'POST') {
        handlePartsRequisitionCreate($db_instance, $data);
      } elseif ($method === 'PUT' && $id) {
        handlePartsRequisitionUpdate($db_instance, $id, $data);
      } elseif ($method === 'DELETE' && $id) {
        handlePartsRequisitionDelete($db_instance, $id);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== NOTIFICATIONS ==========
    case 'notifications':
      require_once __DIR__ . '/routes/notifications.php';
      
      if ($method === 'GET') {
        handleNotificationList($db_instance, $data);
      } elseif ($method === 'POST' && $id === 'read') {
        handleNotificationRead($db_instance, $subaction);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== USER MANAGEMENT ==========
    case 'users':
      require_once __DIR__ . '/routes/users.php';

      if ($method === 'GET' && $id) {
        // Any authenticated role can fetch a single user profile (used for permissions self-sync)
        Auth::authorize(ALLOWED_ROLES);
        handleUserGet($db_instance->getConnection(), $id);
      } elseif ($method === 'PUT' && $id) {
        // Any authenticated user can update their own profile (password, photo, etc.)
        // The handler restricts sensitive fields (role, permissions) for non-privileged callers
        $requestorRole = Auth::authorize(ALLOWED_ROLES);
        handleUserUpdate($db_instance->getConnection(), $id, $data, $requestorRole);
      } else {
        Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'IT']);
        if ($method === 'GET') {
          handleUserList($db_instance->getConnection(), $data);
        } elseif ($method === 'POST') {
          handleUserCreate($db_instance->getConnection(), $data);
        } elseif ($method === 'DELETE' && $id) {
          handleUserDelete($db_instance->getConnection(), $id);
        } else {
          Response::error('Method not allowed', 405);
        }
      }
      break;

    // ========== VOUCHERS ==========
    case 'vouchers':
      Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER', 'IT', 'ACCOUNTS', 'HR'], 'vouchers');
      require_once __DIR__ . '/routes/vouchers.php';
      if ($method === 'GET') {
        handleVoucherList($db_instance->getConnection());
      } elseif ($method === 'POST') {
        handleVoucherCreate($db_instance->getConnection(), $data);
      } elseif ($method === 'PUT' && $id) {
        handleVoucherUpdate($db_instance->getConnection(), $id, $data);
      } elseif ($method === 'DELETE' && $id) {
        handleVoucherDelete($db_instance->getConnection(), $id);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== BKASH ==========
    case 'bkash':
      Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'bkash');
      require_once __DIR__ . '/routes/bkash.php';
      if ($method === 'GET') {
        handleBkashList($db_instance->getConnection());
      } elseif ($method === 'POST') {
        handleBkashCreate($db_instance->getConnection(), $data);
      } elseif ($method === 'PUT' && $id) {
        handleBkashUpdate($db_instance->getConnection(), $id, $data);
      } elseif ($method === 'DELETE' && $id) {
        handleBkashDelete($db_instance->getConnection(), $id);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== BUS BD ==========
    case 'busbd':
      Auth::authorize(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'MANAGING_DIRECTOR', 'DIRECTOR', 'MANAGER'], 'busbd');
      require_once __DIR__ . '/routes/busbd.php';
      if ($method === 'GET') {
        handleBusBdList($db_instance->getConnection());
      } elseif ($method === 'POST') {
        handleBusBdCreate($db_instance->getConnection(), $data);
      } elseif ($method === 'PUT' && $id) {
        handleBusBdUpdate($db_instance->getConnection(), $id, $data);
      } elseif ($method === 'DELETE' && $id) {
        handleBusBdDelete($db_instance->getConnection(), $id);
      } else {
        Response::error('Method not allowed', 405);
      }
      break;

    // ========== SYSTEM RESET ==========
    case 'system':
      if ($id === 'reset' && $method === 'POST') {
        Auth::authorize(['SUPER_ADMIN']);
        try {
          $db_conn = $db_instance->getConnection();
          // Clear all data EXCEPT doel_users (Manage Users preserved)
          // Factory Reset — wipe everything EXCEPT doel_users
          $db_conn->exec("DELETE FROM doel_transactions");
          $db_conn->exec("DELETE FROM doel_ticket_sales");
          $db_conn->exec("DELETE FROM doel_trips");
          $db_conn->exec("DELETE FROM doel_notifications");
          $db_conn->exec("DELETE FROM doel_staff");
          $db_conn->exec("DELETE FROM doel_coaches");
          $db_conn->exec("DELETE FROM doel_counters");
          $db_conn->exec("DELETE FROM doel_inventory");
          try { $db_conn->exec("DELETE FROM doel_bkash_records"); } catch (Exception $e) {}
          try { $db_conn->exec("DELETE FROM doel_busbd_records"); } catch (Exception $e) {}

          Response::success([], 'Factory reset complete. All data cleared. Users preserved.');
        } catch (Exception $e) {
          Response::error('Reset failed: ' . $e->getMessage(), 500);
        }
      } else {
        Response::error('Invalid system endpoint', 404);
      }
      break;

    // ========== FORECAST ==========
    case 'forecast':
      if ($id === 'revenue') {
        require_once __DIR__ . '/routes/forecast.php';
        handleRevenueForecast($db_instance, $data);
      } else {
        Response::error('Invalid forecast endpoint', 404);
      }
      break;

    // ========== DATABASE SETUP ==========
    case 'db-setup':
      $setup_key = getenv('SETUP_KEY') ?: 'doel_setup_2026';
      $provided_key = $data['key'] ?? $_GET['key'] ?? null;
      if ($provided_key === $setup_key) {
        $schema = new Schema(Database::getInstance()->getConnection());
        $schema->setupTables();
        Response::success([], 'Database tables created and seeded successfully');
      } else {
        Response::error('Invalid or missing setup key', 403);
      }
      break;

    // ========== HEALTH CHECK ==========
    case 'health':
      Response::success(['status' => 'ok', 'timestamp' => Utils::getCurrentDateTime()], 'API is healthy');
      break;

    default:
      Response::error('Endpoint not found', 404);
  }
} catch (Exception $e) {
  error_log($e->getMessage());
  Response::error('Server error: ' . $e->getMessage(), 500);
}
