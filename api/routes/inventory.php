<?php
/**
 * Inventory Routes Handler
 */

function handleInventoryList($db, $data) {
  try {
    $stmt = $db->prepare("SELECT * FROM doel_inventory ORDER BY name ASC");
    $stmt->execute();
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $items = array_map(function($item) {
      $item['stock']    = (int)($item['stock'] ?? 0);
      $item['minStock'] = (int)($item['minStock'] ?? 0);
      return $item;
    }, $raw);
    Response::success($items, 'Inventory fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch inventory: ' . $e->getMessage(), 500);
  }
}

function handleInventoryCreate($db, $data) {
  try {
    $id = Utils::generateId('INV');
    $stmt = $db->prepare(
      "INSERT INTO doel_inventory (id, name, partNo, category, stock, minStock, unit, lastUpdated, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())"
    );
    $stmt->execute([
      $id,
      $data['name'],
      $data['partNo'] ?? null,
      $data['category'] ?? 'General',
      $data['stock'] ?? 0,
      $data['minStock'] ?? 0,
      $data['unit'] ?? 'pcs',
      $data['lastUpdated'] ?? date('Y-m-d'),
    ]);
    Response::success(['id' => $id], 'Inventory item created', 201);
  } catch (Exception $e) {
    Response::error('Failed to create inventory item: ' . $e->getMessage(), 500);
  }
}

function handleInventoryUpdate($db, $id, $data) {
  try {
    $allowed = ['name','partNo','category','stock','minStock','unit','lastUpdated'];
    $fields = []; $values = [];
    foreach ($allowed as $key) {
      if (isset($data[$key])) { $fields[] = "$key = ?"; $values[] = $data[$key]; }
    }
    if (empty($fields)) Response::error('No fields to update', 400);
    $values[] = $id;
    $stmt = $db->prepare("UPDATE doel_inventory SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($values);
    Response::success(['id' => $id], 'Inventory item updated');
  } catch (Exception $e) {
    Response::error('Failed to update inventory: ' . $e->getMessage(), 500);
  }
}

function handleInventoryDelete($db, $id) {
  try {
    $stmt = $db->prepare("DELETE FROM doel_inventory WHERE id = ?");
    $stmt->execute([$id]);
    Response::success(['id' => $id], 'Inventory item deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete inventory: ' . $e->getMessage(), 500);
  }
}

function handleInventoryIssueList($db) {
  try {
    $stmt = $db->prepare("SELECT * FROM doel_inventory_issues ORDER BY date DESC, createdAt DESC");
    $stmt->execute();
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $items = array_map(function($item) {
      $item['qty'] = (int)($item['qty'] ?? 0);
      return $item;
    }, $raw);
    Response::success($items, 'Inventory issues fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch inventory issues: ' . $e->getMessage(), 500);
  }
}

function handleInventoryIssueCreate($db, $data) {
  if (empty($data['itemName']) || empty($data['date'])) {
    Response::error('Item name and date are required', 400);
  }
  try {
    $id = Utils::generateId('ISS');
    $stmt = $db->prepare(
      "INSERT INTO doel_inventory_issues (id, date, itemId, itemName, partNo, qty, unit, busNo, side, receiver, remarks, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
    );
    $stmt->execute([
      $id,
      $data['date'],
      $data['itemId'] ?? null,
      $data['itemName'],
      $data['partNo'] ?? null,
      $data['qty'] ?? 0,
      $data['unit'] ?? 'pcs',
      $data['busNo'] ?? null,
      $data['side'] ?? null,
      $data['receiver'] ?? null,
      $data['remarks'] ?? null,
    ]);
    Response::success(['id' => $id], 'Inventory issue logged', 201);
  } catch (Exception $e) {
    Response::error('Failed to log inventory issue: ' . $e->getMessage(), 500);
  }
}

function handleInventoryIssueDelete($db, $id) {
  try {
    $stmt = $db->prepare("DELETE FROM doel_inventory_issues WHERE id = ?");
    $stmt->execute([$id]);
    Response::success(['id' => $id], 'Inventory issue deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete inventory issue: ' . $e->getMessage(), 500);
  }
}

function handleInventoryReceiptList($db) {
  try {
    $stmt = $db->prepare("SELECT * FROM doel_inventory_receipts ORDER BY date DESC, createdAt DESC");
    $stmt->execute();
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $items = array_map(function($item) {
      $item['qty'] = (int)($item['qty'] ?? 0);
      return $item;
    }, $raw);
    Response::success($items, 'Inventory receipts fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch inventory receipts: ' . $e->getMessage(), 500);
  }
}

function handleInventoryReceiptCreate($db, $data) {
  if (empty($data['itemName']) || empty($data['date'])) {
    Response::error('Item name and date are required', 400);
  }
  try {
    $id = Utils::generateId('REC');
    $stmt = $db->prepare(
      "INSERT INTO doel_inventory_receipts (id, date, itemId, itemName, partNo, category, qty, unit, remarks, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
    );
    $stmt->execute([
      $id,
      $data['date'],
      $data['itemId'] ?? null,
      $data['itemName'],
      $data['partNo'] ?? null,
      $data['category'] ?? null,
      $data['qty'] ?? 0,
      $data['unit'] ?? 'pcs',
      $data['remarks'] ?? null,
    ]);
    Response::success(['id' => $id], 'Inventory receipt logged', 201);
  } catch (Exception $e) {
    Response::error('Failed to log inventory receipt: ' . $e->getMessage(), 500);
  }
}

function handleInventoryReceiptDelete($db, $id) {
  try {
    $stmt = $db->prepare("DELETE FROM doel_inventory_receipts WHERE id = ?");
    $stmt->execute([$id]);
    Response::success(['id' => $id], 'Inventory receipt deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete inventory receipt: ' . $e->getMessage(), 500);
  }
}
