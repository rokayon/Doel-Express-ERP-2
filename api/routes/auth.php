<?php
/**
 * Authentication Routes Handler
 */

function handleAuth($db, $data) {
  $method = Utils::getRequestMethod();
  $action = $data['action'] ?? 'login';

  if ($action === 'login') {
    handleLogin($db, $data);
  } elseif ($action === 'register') {
    handleRegister($db, $data);
  } else {
    Response::error('Invalid action', 400);
  }
}

function handleLogin($db, $data) {
  $username = $data['username'] ?? null;
  $password = $data['password'] ?? null;

  if (!$username || !$password) {
    Response::error('Username and password required', 400);
  }

  try {
    $sql = "SELECT id, username, email, password, role, isApproved, profilePhoto, permissions FROM doel_users WHERE username = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
      Response::error('Invalid credentials', 401);
    }

    if (!$user['isApproved']) {
      Response::error('Account pending approval', 401);
    }

    if (!Auth::verifyPassword($password, $user['password'])) {
      Response::error('Invalid credentials', 401);
    }

    unset($user['password']);
    $user['isApproved'] = (bool)$user['isApproved'];
    $user['permissions'] = $user['permissions'] ? json_decode($user['permissions'], true) : [];
    Response::success($user, 'Login successful', 200);
  } catch (Exception $e) {
    Response::error('Login failed: ' . $e->getMessage(), 500);
  }
}

function handleRegister($db, $data) {
  $username = $data['username'] ?? null;
  $email = $data['email'] ?? null;
  $password = $data['password'] ?? null;
  $role = $data['role'] ?? 'DRIVER';

  $errors = Utils::validate($data, [
    'username' => 'required',
    'email' => 'required|email',
    'password' => 'required'
  ]);

  if (!empty($errors)) {
    Response::error('Validation error: ' . implode(', ', $errors), 400);
  }

  try {
    // Check duplicates
    $sql = "SELECT id FROM doel_users WHERE username = ? OR email = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$username, $email]);
    
    if ($stmt->fetch()) {
      Response::error('Username or email already exists', 400);
    }

    $id = Utils::generateId('U');
    $hashedPassword = Auth::hashPassword($password);

    $sql = "INSERT INTO doel_users 
            (id, username, email, password, role, isApproved, createdAt) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $db->prepare($sql);
    $stmt->execute([
      $id,
      $username,
      $email,
      $hashedPassword,
      in_array($role, ALLOWED_ROLES) ? $role : 'DRIVER',
      false // Not approved by default
    ]);

    Response::success(
      ['id' => $id, 'username' => $username, 'email' => $email],
      'Registration request submitted! Super Admin approval required',
      201
    );
  } catch (Exception $e) {
    Response::error('Registration failed: ' . $e->getMessage(), 500);
  }
}
