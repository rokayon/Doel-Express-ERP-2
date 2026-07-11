<?php
/**
 * Counters Routes Handler
 */

function handleCounterList($db, $data) {
  try {
    $sql = "SELECT * FROM doel_counters ORDER BY name ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $counters = array_map(function($c) {
      $c['isActive'] = (bool)$c['isActive'];
      return $c;
    }, $raw);
    Response::success($counters, 'Counters fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch counters: ' . $e->getMessage(), 500);
  }
}

function handleCounterGet($db, $id) {
  try {
    $sql = "SELECT * FROM doel_counters WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$id]);
    $counter = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$counter) {
      Response::error('Counter not found', 404);
    }
    $counter['isActive'] = (bool)$counter['isActive'];
    Response::success($counter, 'Counter fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch counter: ' . $e->getMessage(), 500);
  }
}

function handleCounterCreate($db, $data) {
  try {
    $id = Utils::generateId('CNT');
    $sql = "INSERT INTO doel_counters 
            (id, name, location, assignedOperatorId, isActive, lastSync, createdAt) 
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())";

    $stmt = $db->prepare($sql);
    $stmt->execute([
      $id,
      $data['name'],
      $data['location'],
      $data['assignedOperatorId'] ?? null,
      isset($data['isActive']) ? (bool)$data['isActive'] : true
    ]);

    Response::success(['id' => $id], 'Counter created', 201);
  } catch (Exception $e) {
    Response::error('Failed to create counter: ' . $e->getMessage(), 500);
  }
}

function handleCounterUpdate($db, $id, $data) {
  try {
    $fields = [];
    $values = [];

    foreach ($data as $key => $value) {
      if (in_array($key, ['name', 'location', 'assignedOperatorId', 'isActive'])) {
        $fields[] = "$key = ?";
        if ($key === 'isActive') {
          $values[] = (bool)$value ? 1 : 0;
        } else {
          $values[] = $value;
        }
      }
    }

    if (empty($fields)) {
      Response::error('No valid fields to update', 400);
    }

    $fields[] = "lastSync = NOW()";
    $values[] = $id;
    $sql = "UPDATE doel_counters SET " . implode(', ', $fields) . " WHERE id = ?";

    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    Response::success(['id' => $id], 'Counter updated');
  } catch (Exception $e) {
    Response::error('Failed to update counter: ' . $e->getMessage(), 500);
  }
}

function handleCounterDelete($db, $id) {
  try {
    $stmt = $db->prepare("DELETE FROM doel_counters WHERE id = ?");
    $stmt->execute([$id]);
    Response::success(['id' => $id], 'Counter deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete counter: ' . $e->getMessage(), 500);
  }
}
