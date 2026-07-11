<?php
/**
 * User Management Routes Handler
 * Only SUPER_ADMIN and IT can access these endpoints
 */

function handleUserGet($db, $id) {
  try {
    $sql = "SELECT id, name, username, email, role, isApproved, profilePhoto, nidPhoto, permissions, createdAt
            FROM doel_users WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
      Response::error('User not found', 404);
    }

    $user['isApproved'] = (bool)$user['isApproved'];
    $user['permissions'] = $user['permissions'] ? json_decode($user['permissions'], true) : [];

    Response::success($user, 'User fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch user: ' . $e->getMessage(), 500);
  }
}

function handleUserList($db, $data) {
  try {
    $sql = "SELECT id, name, username, email, role, isApproved, profilePhoto, nidPhoto, permissions, createdAt
            FROM doel_users ORDER BY createdAt DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($users as &$u) {
      $u['isApproved'] = (bool)$u['isApproved'];
      $u['permissions'] = $u['permissions'] ? json_decode($u['permissions'], true) : [];
    }

    Response::success($users, 'Users fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch users: ' . $e->getMessage(), 500);
  }
}

function handleUserCreate($db, $data) {
  $errors = Utils::validate($data, [
    'username' => 'required',
    'email'    => 'required|email',
    'password' => 'required',
    'role'     => 'required',
  ]);

  if (!empty($errors)) {
    Response::error('Validation error: ' . implode(', ', $errors), 400);
  }

  try {
    // Check duplicate username or email
    $check = $db->prepare("SELECT id FROM doel_users WHERE username = ? OR email = ?");
    $check->execute([$data['username'], $data['email']]);
    if ($check->fetch()) {
      Response::error('Username or email already exists', 400);
    }

    $id = Utils::generateId('U');
    $role = in_array($data['role'], ALLOWED_ROLES) ? $data['role'] : 'DRIVER';
    $isApproved = isset($data['isApproved']) ? (bool)$data['isApproved'] : true;
    $permissions = isset($data['permissions']) && is_array($data['permissions'])
      ? json_encode($data['permissions'])
      : null;

    $name = isset($data['name']) ? trim($data['name']) : null;

    $sql = "INSERT INTO doel_users (id, name, username, email, password, role, isApproved, permissions, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    $stmt = $db->prepare($sql);
    $stmt->execute([
      $id,
      $name ?: null,
      $data['username'],
      $data['email'],
      Auth::hashPassword($data['password']),
      $role,
      $isApproved,
      $permissions,
    ]);

    Response::success([
      'id'         => $id,
      'name'       => $name,
      'username'   => $data['username'],
      'email'      => $data['email'],
      'role'       => $role,
      'isApproved' => $isApproved,
    ], 'User created', 201);
  } catch (Exception $e) {
    Response::error('Failed to create user: ' . $e->getMessage(), 500);
  }
}

function handleUserUpdate($db, $id, $data, $requestorRole = 'SUPER_ADMIN') {
  // Protect Super Admin from being demoted
  $existing = $db->prepare("SELECT role FROM doel_users WHERE id = ?");
  $existing->execute([$id]);
  $user = $existing->fetch(PDO::FETCH_ASSOC);

  if (!$user) {
    Response::error('User not found', 404);
  }
  if ($user['role'] === 'SUPER_ADMIN' && isset($data['role']) && $data['role'] !== 'SUPER_ADMIN') {
    Response::error('Cannot change Super Admin role', 403);
  }

  $isPrivileged = in_array($requestorRole, ['SUPER_ADMIN', 'ADMIN', 'IT']);

  try {
    $fields = [];
    $values = [];

    // Non-privileged users (self-update) can update their own display info and photos
    // Privileged roles (SUPER_ADMIN, IT) can also update role, approval, and permissions
    $allowed = $isPrivileged
      ? ['name', 'username', 'email', 'role', 'isApproved', 'profilePhoto', 'nidPhoto']
      : ['name', 'username', 'email', 'profilePhoto', 'nidPhoto'];

    if ($isPrivileged && array_key_exists('permissions', $data)) {
      $fields[] = "permissions = ?";
      $values[] = is_array($data['permissions']) ? json_encode($data['permissions']) : null;
    }
    foreach ($allowed as $field) {
      if (array_key_exists($field, $data)) {
        $fields[] = "$field = ?";
        $values[] = $field === 'isApproved' ? (bool)$data[$field] : $data[$field];
      }
    }

    // Handle password change separately
    if (!empty($data['password'])) {
      // Non-privileged users must provide currentPassword to change their own password
      if (!$isPrivileged) {
        if (empty($data['currentPassword'])) {
          Response::error('Current password is required to change password', 400);
        }
        $pwRow = $db->prepare("SELECT password FROM doel_users WHERE id = ?");
        $pwRow->execute([$id]);
        $stored = $pwRow->fetch(PDO::FETCH_ASSOC);
        if (!$stored || !Auth::verifyPassword($data['currentPassword'], $stored['password'])) {
          Response::error('Current password is incorrect', 403);
        }
      }
      $fields[] = "password = ?";
      $values[] = Auth::hashPassword($data['password']);
    }

    if (empty($fields)) {
      Response::error('No valid fields to update', 400);
    }

    $values[] = $id;
    $sql = "UPDATE doel_users SET " . implode(', ', $fields) . ", updatedAt = NOW() WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    Response::success(['id' => $id], 'User updated');
  } catch (Exception $e) {
    Response::error('Failed to update user: ' . $e->getMessage(), 500);
  }
}

function handleUserDelete($db, $id) {
  // Never delete super admin
  $check = $db->prepare("SELECT role FROM doel_users WHERE id = ?");
  $check->execute([$id]);
  $user = $check->fetch(PDO::FETCH_ASSOC);

  if (!$user) {
    Response::error('User not found', 404);
  }
  if ($user['role'] === 'SUPER_ADMIN') {
    Response::error('Cannot delete Super Admin', 403);
  }

  try {
    $stmt = $db->prepare("DELETE FROM doel_users WHERE id = ?");
    $stmt->execute([$id]);
    Response::success(['id' => $id], 'User deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete user: ' . $e->getMessage(), 500);
  }
}
