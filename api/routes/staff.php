<?php
/**
 * Staff Routes Handler
 */

function handleStaffList($db, $data) {
  try {
    // Exclude large photo columns from list — fetch per-record only when needed (View/Edit)
    $sql = "SELECT id, name, role, phone, email, nid, address, designation, department,
                   status, salary, joiningDate, expiryDate, licenseNumber, licenseCategory, emergencyContact, notes,
                   CASE WHEN photo      IS NOT NULL AND photo      != '' THEN 1 ELSE 0 END AS hasPhoto,
                   CASE WHEN nidPhoto   IS NOT NULL AND nidPhoto   != '' THEN 1 ELSE 0 END AS hasNidPhoto,
                   CASE WHEN licensePhoto IS NOT NULL AND licensePhoto != '' THEN 1 ELSE 0 END AS hasLicensePhoto,
                   createdAt, updatedAt
            FROM doel_staff ORDER BY name ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $staff = array_map(function($s) {
      $s['salary']          = (float)($s['salary'] ?? 0);
      $s['hasPhoto']        = (bool)($s['hasPhoto'] ?? 0);
      $s['hasNidPhoto']     = (bool)($s['hasNidPhoto'] ?? 0);
      $s['hasLicensePhoto'] = (bool)($s['hasLicensePhoto'] ?? 0);
      return $s;
    }, $raw);

    Response::success($staff, 'Staff list fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch staff: ' . $e->getMessage(), 500);
  }
}

function handleStaffGet($db, $id) {
  try {
    $sql = "SELECT * FROM doel_staff WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$id]);
    $staff = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$staff) {
      Response::error('Staff not found', 404);
    }

    $staff['salary'] = (float)($staff['salary'] ?? 0);
    Response::success($staff, 'Staff fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch staff: ' . $e->getMessage(), 500);
  }
}

function handleStaffCreate($db, $data) {
  $required = ['name'];
  $errors = Utils::validate($data, array_fill_keys($required, 'required'));

  if (!empty($errors)) {
    Response::error('Validation error: ' . implode(', ', $errors), 400);
  }

  try {
    // Check duplicate NID only if provided
    if (!empty($data['nid'])) {
      $sql = "SELECT id FROM doel_staff WHERE nid = ?";
      $stmt = $db->prepare($sql);
      $stmt->execute([$data['nid']]);
      if ($stmt->fetch()) {
        Response::error('Duplicate: NID already exists', 400);
      }
    }

    // Use frontend-provided ID if available, otherwise generate
    $id = $data['id'] ?? Utils::generateId('EMP');
    $sql = "INSERT INTO doel_staff
            (id, name, role, phone, email, nid, address, designation, department, status,
             salary, joiningDate, expiryDate, photo, nidPhoto, licensePhoto, licenseNumber, licenseCategory, emergencyContact, notes, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $db->prepare($sql);
    $stmt->execute([
      $id,
      $data['name'],
      $data['role'] ?? 'Driver',
      $data['phone'] ?? null,
      ($data['email'] ?? null) ?: null,
      ($data['nid'] ?? null) ?: null,
      $data['address'] ?? null,
      $data['designation'] ?? null,
      $data['department'] ?? null,
      $data['status'] ?? 'Active',
      $data['salary'] ?? 0,
      $data['joiningDate'] ?? Utils::getCurrentDate(),
      $data['expiryDate'] ?? null,
      $data['photo'] ?? null,
      $data['nidPhoto'] ?? null,
      $data['licensePhoto'] ?? null,
      $data['licenseNumber'] ?? null,
      $data['licenseCategory'] ?? null,
      $data['emergencyContact'] ?? null,
      $data['notes'] ?? null
    ]);

    Response::success(['id' => $id], 'Staff created', 201);
  } catch (Exception $e) {
    Response::error('Failed to create staff: ' . $e->getMessage(), 500);
  }
}

function handleStaffUpdate($db, $id, $data) {
  try {
    // Check NID uniqueness against other staff (not self)
    if (isset($data['nid']) && $data['nid'] !== '') {
      $checkStmt = $db->prepare("SELECT id FROM doel_staff WHERE nid = ? AND id != ?");
      $checkStmt->execute([$data['nid'], $id]);
      if ($checkStmt->fetch()) {
        Response::error('Duplicate: NID already exists', 400);
      }
    }

    $fields = [];
    $values = [];

    foreach ($data as $key => $value) {
      if (in_array($key, ['name', 'role', 'phone', 'email', 'nid', 'address', 'designation',
                           'department', 'status', 'salary', 'joiningDate', 'expiryDate',
                           'photo', 'nidPhoto', 'licensePhoto', 'licenseNumber', 'licenseCategory',
                           'emergencyContact', 'notes'])) {
        $fields[] = "$key = ?";
        $values[] = ($key === 'email' || $key === 'nid') ? (($value === '' || $value === null) ? null : $value) : $value;
      }
    }

    if (empty($fields)) {
      Response::error('No valid fields to update', 400);
    }

    $values[] = $id;
    $sql = "UPDATE doel_staff SET " . implode(', ', $fields) . ", updatedAt = NOW() WHERE id = ?";

    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    Response::success(['id' => $id], 'Staff updated');
  } catch (Exception $e) {
    Response::error('Failed to update staff: ' . $e->getMessage(), 500);
  }
}

function handleStaffDelete($db, $id) {
  try {
    $sql = "DELETE FROM doel_staff WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$id]);

    Response::success(['id' => $id], 'Staff deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete staff: ' . $e->getMessage(), 500);
  }
}
