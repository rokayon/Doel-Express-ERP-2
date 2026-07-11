<?php
/**
 * Notifications Routes Handler
 */

function handleNotificationList($db, $data) {
  try {
    $user_id = $data['user_id'] ?? null;
    
    if ($user_id) {
      $sql = "SELECT * FROM doel_notifications WHERE user_id = ? ORDER BY createdAt DESC";
      $stmt = $db->prepare($sql);
      $stmt->execute([$user_id]);
    } else {
      $sql = "SELECT * FROM doel_notifications ORDER BY createdAt DESC";
      $stmt = $db->prepare($sql);
      $stmt->execute();
    }
    
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    Response::success($notifications, 'Notifications fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch notifications: ' . $e->getMessage(), 500);
  }
}

function handleNotificationRead($db, $id) {
  try {
    $sql = "UPDATE doel_notifications SET `read` = TRUE WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$id]);

    Response::success(['id' => $id], 'Notification marked as read');
  } catch (Exception $e) {
    Response::error('Failed to update notification: ' . $e->getMessage(), 500);
  }
}
