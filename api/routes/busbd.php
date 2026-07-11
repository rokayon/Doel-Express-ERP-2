<?php
/**
 * Bus BD Payment Tracker Routes
 */

function handleBusBdList($db) {
  try {
    $stmt = $db->prepare("SELECT * FROM doel_busbd_records ORDER BY date DESC");
    $stmt->execute();
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $floatFields = ['openingAmount','dailyAmount','closingAmount'];
    $records = array_map(function($r) use ($floatFields) {
      foreach ($floatFields as $f) { if (isset($r[$f])) $r[$f] = (float)$r[$f]; }
      return $r;
    }, $raw);
    Response::success($records, 'Bus BD records fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch Bus BD records: ' . $e->getMessage(), 500);
  }
}

function handleBusBdCreate($db, $data) {
  if (empty($data['date'])) {
    Response::error('Date is required', 400);
  }
  try {
    $id = $data['id'] ?? ('BBD-' . substr(time(), -8));
    $closing = isset($data['closingAmount'])
      ? (float)$data['closingAmount']
      : (float)($data['openingAmount'] ?? 0) + (float)($data['dailyAmount'] ?? 0);

    $stmt = $db->prepare("INSERT INTO doel_busbd_records
      (id, date, openingAmount, dailyAmount, closingAmount, notes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        date=VALUES(date), openingAmount=VALUES(openingAmount),
        dailyAmount=VALUES(dailyAmount), closingAmount=VALUES(closingAmount), notes=VALUES(notes)");
    $stmt->execute([
      $id, $data['date'],
      (float)($data['openingAmount'] ?? 0),
      (float)($data['dailyAmount'] ?? 0),
      round($closing, 2),
      $data['notes'] ?? null,
    ]);
    Response::success(['id' => $id], 'Bus BD record saved', 201);
  } catch (Exception $e) {
    Response::error('Failed to save Bus BD record: ' . $e->getMessage(), 500);
  }
}

function handleBusBdUpdate($db, $id, $data) {
  try {
    $closing = isset($data['closingAmount'])
      ? (float)$data['closingAmount']
      : (float)($data['openingAmount'] ?? 0) + (float)($data['dailyAmount'] ?? 0);

    $stmt = $db->prepare("UPDATE doel_busbd_records SET
      date=?, openingAmount=?, dailyAmount=?, closingAmount=?, notes=?
      WHERE id=?");
    $stmt->execute([
      $data['date'],
      (float)($data['openingAmount'] ?? 0),
      (float)($data['dailyAmount'] ?? 0),
      round($closing, 2),
      $data['notes'] ?? null,
      $id,
    ]);
    Response::success([], 'Bus BD record updated');
  } catch (Exception $e) {
    Response::error('Failed to update Bus BD record: ' . $e->getMessage(), 500);
  }
}

function handleBusBdDelete($db, $id) {
  try {
    $stmt = $db->prepare("DELETE FROM doel_busbd_records WHERE id=?");
    $stmt->execute([$id]);
    Response::success([], 'Bus BD record deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete Bus BD record: ' . $e->getMessage(), 500);
  }
}
