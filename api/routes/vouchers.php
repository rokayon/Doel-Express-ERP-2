<?php
/**
 * Vouchers Routes Handler
 * Auto-deletes vouchers older than 40 days on every fetch.
 */

function handleVoucherList($db) {
  try {
    // Auto-delete expired vouchers (older than 40 days)
    $db->exec("DELETE FROM doel_vouchers WHERE expiresAt <= NOW()");

    $stmt = $db->prepare("SELECT id, name, image, createdAt, expiresAt FROM doel_vouchers ORDER BY createdAt DESC");
    $stmt->execute();
    $vouchers = $stmt->fetchAll(PDO::FETCH_ASSOC);
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
    $image = isset($data['image']) ? $data['image'] : null;
    $createdAt = date('Y-m-d H:i:s');
    $expiresAt = date('Y-m-d H:i:s', strtotime('+40 days'));

    $stmt = $db->prepare(
      "INSERT INTO doel_vouchers (id, name, image, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute([$id, $name, $image, $createdAt, $expiresAt]);

    Response::success([
      'id'        => $id,
      'name'      => $name,
      'image'     => $image,
      'createdAt' => $createdAt,
      'expiresAt' => $expiresAt,
    ], 'Voucher created', 201);
  } catch (Exception $e) {
    Response::error('Failed to create voucher: ' . $e->getMessage(), 500);
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
