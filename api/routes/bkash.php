<?php
/**
 * bKash Merchant Tracker Routes
 */

function handleBkashList($db) {
  try {
    $stmt = $db->prepare("SELECT * FROM doel_bkash_records ORDER BY date DESC");
    $stmt->execute();
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $floatFields = ['openingBalance','dailyReceived','merchantToBank','bkashCharge','netBankReceipt','closingBalance'];
    $records = array_map(function($r) use ($floatFields) {
      foreach ($floatFields as $f) { if (isset($r[$f])) $r[$f] = (float)$r[$f]; }
      return $r;
    }, $raw);
    Response::success($records, 'bKash records fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch bKash records: ' . $e->getMessage(), 500);
  }
}

function handleBkashCreate($db, $data) {
  if (empty($data['date']) || empty($data['merchant'])) {
    Response::error('Date and merchant are required', 400);
  }
  try {
    $id = $data['id'] ?? ('BKS-' . substr(time(), -8));
    $charge = (float)($data['merchantToBank'] ?? 0) * 0.0115;
    $netReceipt = (float)($data['merchantToBank'] ?? 0) - $charge;
    $closing = (float)($data['openingBalance'] ?? 0) + (float)($data['dailyReceived'] ?? 0) - (float)($data['merchantToBank'] ?? 0);

    $stmt = $db->prepare("INSERT INTO doel_bkash_records
      (id, date, merchant, openingBalance, dailyReceived, merchantToBank, bkashCharge, netBankReceipt, closingBalance, notes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        date=VALUES(date), merchant=VALUES(merchant), openingBalance=VALUES(openingBalance),
        dailyReceived=VALUES(dailyReceived), merchantToBank=VALUES(merchantToBank),
        bkashCharge=VALUES(bkashCharge), netBankReceipt=VALUES(netBankReceipt),
        closingBalance=VALUES(closingBalance), notes=VALUES(notes)");
    $stmt->execute([
      $id, $data['date'], $data['merchant'],
      (float)($data['openingBalance'] ?? 0),
      (float)($data['dailyReceived'] ?? 0),
      (float)($data['merchantToBank'] ?? 0),
      round($data['bkashCharge'] ?? $charge, 2),
      round($data['netBankReceipt'] ?? $netReceipt, 2),
      round($data['closingBalance'] ?? $closing, 2),
      $data['notes'] ?? null,
    ]);
    Response::success(['id' => $id], 'bKash record saved', 201);
  } catch (Exception $e) {
    Response::error('Failed to save bKash record: ' . $e->getMessage(), 500);
  }
}

function handleBkashUpdate($db, $id, $data) {
  try {
    $charge = (float)($data['merchantToBank'] ?? 0) * 0.0115;
    $netReceipt = (float)($data['merchantToBank'] ?? 0) - $charge;
    $closing = (float)($data['openingBalance'] ?? 0) + (float)($data['dailyReceived'] ?? 0) - (float)($data['merchantToBank'] ?? 0);

    $stmt = $db->prepare("UPDATE doel_bkash_records SET
      date=?, merchant=?, openingBalance=?, dailyReceived=?, merchantToBank=?,
      bkashCharge=?, netBankReceipt=?, closingBalance=?, notes=?
      WHERE id=?");
    $stmt->execute([
      $data['date'], $data['merchant'],
      (float)($data['openingBalance'] ?? 0),
      (float)($data['dailyReceived'] ?? 0),
      (float)($data['merchantToBank'] ?? 0),
      round($data['bkashCharge'] ?? $charge, 2),
      round($data['netBankReceipt'] ?? $netReceipt, 2),
      round($data['closingBalance'] ?? $closing, 2),
      $data['notes'] ?? null,
      $id,
    ]);
    Response::success([], 'bKash record updated');
  } catch (Exception $e) {
    Response::error('Failed to update bKash record: ' . $e->getMessage(), 500);
  }
}

function handleBkashDelete($db, $id) {
  try {
    $stmt = $db->prepare("DELETE FROM doel_bkash_records WHERE id=?");
    $stmt->execute([$id]);
    Response::success([], 'bKash record deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete bKash record: ' . $e->getMessage(), 500);
  }
}
