<?php
/**
 * Coaches Routes Handler
 */

function handleCoachList($db, $data) {
  try {
    $sql = "SELECT * FROM doel_coaches ORDER BY regNo ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $coaches = array_map(function($c) {
      $c['seats'] = (int)($c['seats'] ?? 0);
      return $c;
    }, $raw);
    Response::success($coaches, 'Coaches fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch coaches: ' . $e->getMessage(), 500);
  }
}

function handleCoachGet($db, $id) {
  try {
    $sql = "SELECT * FROM doel_coaches WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$id]);
    $coach = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$coach) {
      Response::error('Coach not found', 404);
    }
    $coach['seats'] = (int)($coach['seats'] ?? 0);
    Response::success($coach, 'Coach fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch coach: ' . $e->getMessage(), 500);
  }
}

function handleCoachCreate($db, $data) {
  if (empty($data['regNo']) || empty($data['coachNo'])) {
    Response::error('regNo and coachNo are required', 400);
  }

  // Check duplicate regNo
  $stmt = $db->prepare("SELECT id FROM doel_coaches WHERE regNo = ?");
  $stmt->execute([$data['regNo']]);
  if ($stmt->fetch()) {
    Response::error('A coach with this Reg No already exists', 400);
  }

  try {
    $id = $data['id'] ?? Utils::generateId('C');
    $sql = "INSERT INTO doel_coaches (id, regNo, coachNo, type, seats, status, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $db->prepare($sql);
    $stmt->execute([
      $id,
      $data['regNo'],
      $data['coachNo'],
      $data['type'] ?? 'AC',
      $data['seats'] ?? 32,
      $data['status'] ?? 'Active'
    ]);

    Response::success(['id' => $id], 'Coach created', 201);
  } catch (Exception $e) {
    Response::error('Failed to create coach: ' . $e->getMessage(), 500);
  }
}

function handleCoachUpdate($db, $id, $data) {
  try {
    $allowed = ['regNo','coachNo','type','seats','status','gpsDeviceId'];
    $fields = []; $values = [];
    foreach ($allowed as $key) {
      if (isset($data[$key])) { $fields[] = "$key = ?"; $values[] = $data[$key]; }
    }
    if (empty($fields)) Response::error('No fields to update', 400);
    $values[] = $id;
    $stmt = $db->prepare("UPDATE doel_coaches SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($values);
    Response::success(['id' => $id], 'Coach updated');
  } catch (Exception $e) {
    Response::error('Failed to update coach: ' . $e->getMessage(), 500);
  }
}

function handleCoachDelete($db, $id) {
  try {
    $stmt = $db->prepare("DELETE FROM doel_coaches WHERE id = ?");
    $stmt->execute([$id]);
    Response::success(['id' => $id], 'Coach deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete coach: ' . $e->getMessage(), 500);
  }
}
