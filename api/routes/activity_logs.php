<?php
/**
 * Activity Logs Routes
 * Track all user actions (create, update, delete, insert, modify)
 */

function cleanupOldActivityLogs($db) {
  try {
    // Get retention config
    $configStmt = $db->prepare("SELECT retentionDays, enableAutoDelete FROM doel_activity_log_config WHERE id = 1");
    $configStmt->execute();
    $config = $configStmt->fetch(PDO::FETCH_ASSOC);

    if (!$config || !$config['enableAutoDelete']) return;

    $retentionDays = (int)$config['retentionDays'];
    $cutoffDate = date('Y-m-d H:i:s', strtotime("-$retentionDays days"));

    // Delete old logs
    $deleteStmt = $db->prepare("DELETE FROM doel_activity_logs WHERE timestamp < ?");
    $deleteStmt->execute([$cutoffDate]);

    // Update cleanup timestamp
    $updateStmt = $db->prepare("UPDATE doel_activity_log_config SET lastCleanupAt = NOW() WHERE id = 1");
    $updateStmt->execute();
  } catch (Exception $e) {
    error_log("Activity log cleanup failed: " . $e->getMessage());
  }
}

function handleActivityLogList($db, $data) {
  try {
    $limit = (int)($data['limit'] ?? 100);
    $offset = (int)($data['offset'] ?? 0);

    // Get authenticated user's role from session (not from request data)
    $userRole = Auth::getUserRole();

    // Get allowed roles from config
    $configStmt = $db->prepare("SELECT allowedRoles FROM doel_activity_log_config WHERE id = 1");
    $configStmt->execute();
    $config = $configStmt->fetch(PDO::FETCH_ASSOC);
    $allowedRoles = !empty($config['allowedRoles']) ? json_decode($config['allowedRoles'], true) : ['SUPER_ADMIN', 'ADMIN'];

    // Check if current user's role is in allowed list
    if (!in_array($userRole, $allowedRoles)) {
      Response::error('Insufficient permissions to view activity logs', 403);
    }

    // Auto-cleanup old logs on fetch
    cleanupOldActivityLogs($db);

    $stmt = $db->prepare("SELECT * FROM doel_activity_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?");
    $stmt->execute([$limit, $offset]);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get total count
    $countStmt = $db->prepare("SELECT COUNT(*) as total FROM doel_activity_logs");
    $countStmt->execute();
    $countResult = $countStmt->fetch(PDO::FETCH_ASSOC);

    // Get current config
    $configStmt = $db->prepare("SELECT retentionDays, enableAutoDelete, allowedRoles, lastCleanupAt FROM doel_activity_log_config WHERE id = 1");
    $configStmt->execute();
    $config = $configStmt->fetch(PDO::FETCH_ASSOC);

    // Decode allowedRoles
    if (!empty($config['allowedRoles'])) {
      $config['allowedRoles'] = json_decode($config['allowedRoles'], true);
    } else {
      $config['allowedRoles'] = ['SUPER_ADMIN', 'ADMIN'];
    }

    Response::success([
      'logs' => $logs,
      'total' => (int)$countResult['total'],
      'limit' => $limit,
      'offset' => $offset,
      'config' => $config,
    ], 'Activity logs fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch activity logs: ' . $e->getMessage(), 500);
  }
}

function handleActivityLogConfigUpdate($db, $data) {
  try {
    // Only SUPER_ADMIN and ADMIN can modify activity log config
    Auth::authorize(['SUPER_ADMIN', 'ADMIN'], 'activity_logs_config');

    $retentionDays = (int)($data['retentionDays'] ?? 30);
    $enableAutoDelete = (bool)($data['enableAutoDelete'] ?? true);
    $allowedRoles = is_array($data['allowedRoles'] ?? null) ? $data['allowedRoles'] : ['SUPER_ADMIN', 'ADMIN'];

    if ($retentionDays < 1 || $retentionDays > 365) {
      Response::error('Retention days must be between 1 and 365', 400);
    }

    $rolesJson = json_encode($allowedRoles);
    $stmt = $db->prepare("UPDATE doel_activity_log_config SET retentionDays = ?, enableAutoDelete = ?, allowedRoles = ? WHERE id = 1");
    $stmt->execute([$retentionDays, $enableAutoDelete, $rolesJson]);

    Response::success(['allowedRoles' => $allowedRoles], 'Activity log config updated');
  } catch (Exception $e) {
    Response::error('Failed to update config: ' . $e->getMessage(), 500);
  }
}

function handleActivityLogByUser($db, $userId) {
  try {
    $requesterRole = Auth::getUserRole();
    $requesterId = Auth::getUserId();

    // Anyone can view their own logs; viewing someone else's requires the configured allowedRoles
    if ($requesterId !== $userId) {
      $configStmt = $db->prepare("SELECT allowedRoles FROM doel_activity_log_config WHERE id = 1");
      $configStmt->execute();
      $config = $configStmt->fetch(PDO::FETCH_ASSOC);
      $allowedRoles = !empty($config['allowedRoles']) ? json_decode($config['allowedRoles'], true) : ['SUPER_ADMIN', 'ADMIN'];
      if (!in_array($requesterRole, $allowedRoles, true)) {
        Response::error('Insufficient permissions to view these activity logs', 403);
      }
    }

    $stmt = $db->prepare("SELECT * FROM doel_activity_logs WHERE userId = ? ORDER BY timestamp DESC LIMIT 50");
    $stmt->execute([$userId]);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    Response::success($logs, 'User activity logs fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch user logs: ' . $e->getMessage(), 500);
  }
}

// Activity rows are now auto-inserted by Response::success() in helpers.php
// (single hook for every mutation, instead of per-handler calls).
