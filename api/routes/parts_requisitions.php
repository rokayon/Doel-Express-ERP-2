<?php
/**
 * Parts Requisition Slip Routes
 * Header (voucher) + line items (parts), matching the physical "Parts Requisition Slip" form.
 */

function handlePartsRequisitionList($db) {
  try {
    $stmt = $db->prepare("SELECT * FROM doel_parts_requisitions ORDER BY date DESC, createdAt DESC");
    $stmt->execute();
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $records = array_map(function($r) {
      $decoded = !empty($r['items']) ? json_decode($r['items'], true) : null;
      $r['items'] = is_array($decoded) ? $decoded : [];
      return $r;
    }, $raw);
    Response::success($records, 'Parts requisitions fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch parts requisitions: ' . $e->getMessage(), 500);
  }
}

function handlePartsRequisitionCreate($db, $data) {
  if (empty($data['voucherNo']) || empty($data['date'])) {
    Response::error('Voucher No and date are required', 400);
  }
  try {
    $id = $data['id'] ?? Utils::generateId('PRQ');
    $items = is_array($data['items'] ?? null) ? array_values($data['items']) : [];

    $stmt = $db->prepare("INSERT INTO doel_parts_requisitions
      (id, voucherNo, date, ref, busNo, receivedName, items, total, approvedBy, foreman, receivedBySign, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([
      $id,
      $data['voucherNo'],
      $data['date'],
      $data['ref'] ?? null,
      $data['busNo'] ?? null,
      $data['receivedName'] ?? null,
      json_encode($items),
      $data['total'] ?? null,
      $data['approvedBy'] ?? null,
      $data['foreman'] ?? null,
      $data['receivedBySign'] ?? null,
    ]);
    Response::success(['id' => $id], 'Parts requisition saved', 201);
  } catch (Exception $e) {
    Response::error('Failed to save parts requisition: ' . $e->getMessage(), 500);
  }
}

function handlePartsRequisitionUpdate($db, $id, $data) {
  try {
    $items = is_array($data['items'] ?? null) ? array_values($data['items']) : [];

    $stmt = $db->prepare("UPDATE doel_parts_requisitions SET
      voucherNo=?, date=?, ref=?, busNo=?, receivedName=?, items=?, total=?, approvedBy=?, foreman=?, receivedBySign=?
      WHERE id=?");
    $stmt->execute([
      $data['voucherNo'],
      $data['date'],
      $data['ref'] ?? null,
      $data['busNo'] ?? null,
      $data['receivedName'] ?? null,
      json_encode($items),
      $data['total'] ?? null,
      $data['approvedBy'] ?? null,
      $data['foreman'] ?? null,
      $data['receivedBySign'] ?? null,
      $id,
    ]);
    Response::success([], 'Parts requisition updated');
  } catch (Exception $e) {
    Response::error('Failed to update parts requisition: ' . $e->getMessage(), 500);
  }
}

function handlePartsRequisitionDelete($db, $id) {
  try {
    $stmt = $db->prepare("DELETE FROM doel_parts_requisitions WHERE id=?");
    $stmt->execute([$id]);
    Response::success([], 'Parts requisition deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete parts requisition: ' . $e->getMessage(), 500);
  }
}
