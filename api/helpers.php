<?php
/**
 * Helper Functions & Utilities
 */

class Response {
  public static function json($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
  }

  public static function success($data, $message = 'Success', $code = 200) {
    self::json([
      'success' => true,
      'message' => $message,
      'data' => $data
    ], $code);
  }

  public static function error($message = 'Error', $code = 400) {
    self::json([
      'success' => false,
      'message' => $message
    ], $code);
  }
}

class Auth {
  public static function getToken() {
    $headers = getallheaders();
    return $headers['Authorization'] ?? $headers['authorization'] ?? $_GET['token'] ?? null;
  }

  public static function authorize($requiredRoles = [], $module = null) {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $role = $headers['x-user-role']
         ?? $headers['X-User-Role']
         ?? $headers['X-USER-ROLE']
         ?? null;
    $userId = $headers['x-user-id']
           ?? $headers['X-User-Id']
           ?? $headers['X-USER-ID']
           ?? null;

    if (!$role) {
      Response::error('Authorization required', 401);
    }

    // Pass if role is directly in the allowed list
    if (empty($requiredRoles) || in_array($role, $requiredRoles)) {
      return $role;
    }

    // Fallback: check the user's custom permissions stored in the DB.
    // This handles cases where an admin has granted a user access to a module
    // that is outside their role's default permissions.
    if ($module && $userId) {
      try {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT permissions FROM doel_users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user && !empty($user['permissions'])) {
          $perms = json_decode($user['permissions'], true);
          if (is_array($perms) && in_array($module, $perms)) {
            return $role;
          }
        }
      } catch (Exception $e) {
        // DB lookup failed — fall through to deny
      }
    }

    Response::error('Insufficient permissions', 403);
  }

  public static function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
  }

  public static function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
  }
}

class Utils {
  public static function generateId($prefix = 'ID') {
    $timestamp = substr(str_replace('.', '', microtime(true)), 0, 13);
    $random = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
    return strtoupper($prefix) . '-' . $timestamp . $random;
  }

  public static function formatDate($date, $format = 'Y-m-d') {
    if (!$date) return null;
    try {
      $dt = new DateTime($date);
      return $dt->format($format);
    } catch (Exception $e) {
      return null;
    }
  }

  public static function getCurrentDate() {
    return date('Y-m-d');
  }

  public static function getCurrentTime() {
    return date('H:i:s');
  }

  public static function getCurrentDateTime() {
    return date('Y-m-d H:i:s');
  }

  public static function getRequestMethod() {
    return $_SERVER['REQUEST_METHOD'] ?? 'GET';
  }

  public static function getRequestData() {
    $method = self::getRequestMethod();
    
    if ($method === 'GET') {
      return $_GET;
    } elseif ($method === 'POST' || $method === 'PUT' || $method === 'DELETE') {
      $input = file_get_contents('php://input');
      $data = json_decode($input, true);
      return $data ?? $_POST;
    }
    
    return [];
  }

  public static function getPathSegments() {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $segments = array_filter(explode('/', $path));
    return array_values($segments);
  }

  public static function sanitize($data) {
    if (is_array($data)) {
      return array_map([self::class, 'sanitize'], $data);
    }
    return htmlspecialchars($data ?? '', ENT_QUOTES, 'UTF-8');
  }

  public static function validate($data, $rules) {
    $errors = [];
    
    foreach ($rules as $field => $rule) {
      $value = $data[$field] ?? null;
      
      if (strpos($rule, 'required') !== false) {
        if (empty($value)) {
          $errors[$field] = "$field is required";
        }
      }
      
      if (strpos($rule, 'email') !== false && $value) {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
          $errors[$field] = "$field must be a valid email";
        }
      }
      
      if (strpos($rule, 'numeric') !== false && $value) {
        if (!is_numeric($value)) {
          $errors[$field] = "$field must be numeric";
        }
      }
    }
    
    return $errors;
  }
}

class Pagination {
  private $page;
  private $limit;
  private $total;

  public function __construct($total = 0, $page = 1, $limit = 10) {
    $this->total = $total;
    $this->page = max(1, (int)$page);
    $this->limit = max(1, min((int)$limit, 100));
  }

  public function getOffset() {
    return ($this->page - 1) * $this->limit;
  }

  public function getLimit() {
    return $this->limit;
  }

  public function getPage() {
    return $this->page;
  }

  public function getTotalPages() {
    return ceil($this->total / $this->limit);
  }

  public function toArray() {
    return [
      'currentPage' => $this->page,
      'limit' => $this->limit,
      'total' => $this->total,
      'totalPages' => $this->getTotalPages(),
      'hasNextPage' => $this->page < $this->getTotalPages(),
      'hasPrevPage' => $this->page > 1
    ];
  }
}

// Allowed roles constant
define('ALLOWED_ROLES', [
  'SUPER_ADMIN', 'MANAGING_DIRECTOR', 'DIRECTOR', 'ADMIN', 
  'ACCOUNTS', 'HR', 'IT', 'SALES', 'PURCHASE', 'MARKETING', 
  'MANAGER', 'COUNTER', 'DRIVER', 'SUPERVISOR'
]);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Role, X-User-Id');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}
