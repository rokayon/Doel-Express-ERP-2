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
      "INSERT INTO doel_inventory (id, name, category, stock, minStock, unit, lastUpdated, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())"
    );
    $stmt->execute([
      $id,
      $data['name'],
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
    $allowed = ['name','category','stock','minStock','unit','lastUpdated'];
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
