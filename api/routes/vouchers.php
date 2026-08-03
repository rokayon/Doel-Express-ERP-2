<?php
/**
 * Vouchers Routes Handler
 * Auto-deletes vouchers older than 40 days on every fetch.
 * Supports multiple compressed images per voucher (stored as JSON array).
 */

function handleVoucherList($db) {
  try {
    // Auto-delete expired vouchers (older than 40 days)
    $db->exec("DELETE FROM doel_vouchers WHERE expiresAt <= NOW()");

    $stmt = $db->prepare("SELECT id, name, image, images, createdAt, expiresAt FROM doel_vouchers ORDER BY createdAt DESC");
    $stmt->execute();
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $vouchers = array_map(function($v) {
      $decoded = !empty($v['images']) ? json_decode($v['images'], true) : null;
      $v['images'] = is_array($decoded) ? $decoded : (!empty($v['image']) ? [$v['image']] : []);
      return $v;
    }, $raw);
    Response::success($vouchers, 'Vouchers fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch vouchers: ' . $e->getMessage(), 500);
  }
}

function handleVoucherCreate($db, $data) {
  if (empty($data['name'])) {
    Response::error('Voucher name is required', 400);
  }

  try {
    $id = Utils::generateId('VCH');
    $name = trim($data['name']);
    $images = is_array($data['images'] ?? null) ? array_values($data['images']) : [];
    if (empty($images) && !empty($data['image'])) $images = [$data['image']];
    $firstImage = $images[0] ?? null;
    $createdAt = date('Y-m-d H:i:s');
    $expiresAt = date('Y-m-d H:i:s', strtotime('+40 days'));

    $stmt = $db->prepare(
      "INSERT INTO doel_vouchers (id, name, image, images, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$id, $name, $firstImage, json_encode($images), $createdAt, $expiresAt]);

    Response::success([
      'id'        => $id,
      'name'      => $name,
      'image'     => $firstImage,
      'images'    => $images,
      'createdAt' => $createdAt,
      'expiresAt' => $expiresAt,
    ], 'Voucher created', 201);
  } catch (Exception $e) {
    Response::error('Failed to create voucher: ' . $e->getMessage(), 500);
  }
}

function handleVoucherUpdate($db, $id, $data) {
  try {
    $fields = [];
    $values = [];

    if (isset($data['name']) && trim($data['name']) !== '') {
      $fields[] = 'name = ?';
      $values[] = trim($data['name']);
    }
    if (isset($data['images'])) {
      $images = is_array($data['images']) ? array_values($data['images']) : [];
      $fields[] = 'image = ?';
      $values[] = $images[0] ?? null;
      $fields[] = 'images = ?';
      $values[] = json_encode($images);
    }

    if (empty($fields)) Response::error('No fields to update', 400);

    $values[] = $id;
    $stmt = $db->prepare("UPDATE doel_vouchers SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($values);
    Response::success(['id' => $id], 'Voucher updated');
  } catch (Exception $e) {
    Response::error('Failed to update voucher: ' . $e->getMessage(), 500);
  }
}

function handleVoucherDelete($db, $id) {
  try {
    $stmt = $db->prepare("DELETE FROM doel_vouchers WHERE id = ?");
    $stmt->execute([$id]);
    Response::success(['id' => $id], 'Voucher deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete voucher: ' . $e->getMessage(), 500);
  }
}
