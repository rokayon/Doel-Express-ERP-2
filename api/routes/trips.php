<?php
/**
 * Trips Routes Handler
 */

function handleTripList($db, $data) {
  try {
    $sql = "SELECT * FROM doel_trips ORDER BY departureTime DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $trips = array_map(function($t) {
      $t['capacity']    = (int)($t['capacity'] ?? 0);
      $t['bookedSeats'] = (int)($t['bookedSeats'] ?? 0);
      return $t;
    }, $raw);
    Response::success($trips, 'Trips fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch trips: ' . $e->getMessage(), 500);
  }
}

function handleTripGet($db, $id) {
  try {
    $sql = "SELECT * FROM doel_trips WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$id]);
    $trip = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$trip) {
      Response::error('Trip not found', 404);
    }
    $trip['capacity']    = (int)($trip['capacity'] ?? 0);
    $trip['bookedSeats'] = (int)($trip['bookedSeats'] ?? 0);
    Response::success($trip, 'Trip fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch trip: ' . $e->getMessage(), 500);
  }
}

function handleTripCreate($db, $data) {
  $errors = Utils::validate($data, [
    'busNumber'     => 'required',
    'coachNo'       => 'required',
    'route'         => 'required',
    'departureTime' => 'required',
    'driver'        => 'required',
  ]);
  if (!empty($errors)) {
    Response::error('Validation error: ' . implode(', ', $errors), 400);
  }
  try {
    $id = Utils::generateId('TRP');
    $sql = "INSERT INTO doel_trips 
            (id, busNumber, coachNo, route, departureTime, status, driver, guideName, capacity, bookedSeats, createdAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $db->prepare($sql);
    $stmt->execute([
      $id,
      $data['busNumber'],
      $data['coachNo'],
      $data['route'],
      $data['departureTime'],
      $data['status'] ?? 'Scheduled',
      $data['driver'],
      $data['guideName'] ?? null,
      $data['capacity'] ?? 32,
      $data['bookedSeats'] ?? 0
    ]);

    Response::success(['id' => $id], 'Trip created', 201);
  } catch (Exception $e) {
    Response::error('Failed to create trip: ' . $e->getMessage(), 500);
  }
}

function handleTripUpdate($db, $id, $data) {
  try {
    $fields = [];
    $values = [];

    foreach ($data as $key => $value) {
      if (in_array($key, ['busNumber', 'coachNo', 'route', 'departureTime', 'status', 'driver', 'guideName', 'capacity', 'bookedSeats'])) {
        $fields[] = "$key = ?";
        $values[] = $value;
      }
    }

    if (empty($fields)) {
      Response::error('No valid fields to update', 400);
    }

    $values[] = $id;
    $sql = "UPDATE doel_trips SET " . implode(', ', $fields) . ", updatedAt = NOW() WHERE id = ?";

    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    Response::success(['id' => $id], 'Trip updated');
  } catch (Exception $e) {
    Response::error('Failed to update trip: ' . $e->getMessage(), 500);
  }
}

function handleTripDelete($db, $id) {
  try {
    $stmt = $db->prepare("DELETE FROM doel_trips WHERE id = ?");
    $stmt->execute([$id]);
    Response::success(['id' => $id], 'Trip deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete trip: ' . $e->getMessage(), 500);
  }
}
