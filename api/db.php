<?php
/**
 * Database Connection & Configuration
 * PDO MySQL wrapper for Hostinger Shared Hosting
 */

// Load environment variables from PHP config (preferred) or .env.local fallback
if (file_exists(__DIR__ . '/db.config.php')) {
  require_once __DIR__ . '/db.config.php';
} elseif (file_exists(__DIR__ . '/../.env.local')) {
  $env = parse_ini_file(__DIR__ . '/../.env.local', false, INI_SCANNER_RAW);
  if ($env) {
    foreach ($env as $key => $value) {
      putenv("$key=$value");
    }
  }
}

class Database {
  private static $instance = null;
  private $connection;
  private $table_prefix = 'doel_';

  private function __construct() {
    try {
      $db_host = getenv('DB_HOST') ?: 'localhost';
      $db_name = getenv('DB_NAME') ?: 'doel_express';
      $db_user = getenv('DB_USER') ?: 'root';
      $db_pass = getenv('DB_PASS') ?: '';
      $db_port = getenv('DB_PORT') ?: '3306';

      $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
      
      $this->connection = new PDO(
        $dsn,
        $db_user,
        $db_pass,
        [
          PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
          PDO::ATTR_EMULATE_PREPARES => false,
        ]
      );
    } catch (PDOException $e) {
      die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
    }
  }

  public static function getInstance() {
    if (self::$instance === null) {
      self::$instance = new Database();
    }
    return self::$instance;
  }

  public function getConnection() {
    return $this->connection;
  }

  public function query($sql, $params = []) {
    try {
      $stmt = $this->connection->prepare($sql);
      $stmt->execute($params);
      return $stmt;
    } catch (PDOException $e) {
      throw new Exception("Database query error: " . $e->getMessage());
    }
  }

  public function fetch($sql, $params = []) {
    return $this->query($sql, $params)->fetch();
  }

  public function fetchAll($sql, $params = []) {
    return $this->query($sql, $params)->fetchAll();
  }

  public function insert($table, $data) {
    $table = $this->table_prefix . $table;
    $columns = implode(', ', array_keys($data));
    $placeholders = implode(', ', array_fill(0, count($data), '?'));
    
    $sql = "INSERT INTO $table ($columns) VALUES ($placeholders)";
    $this->query($sql, array_values($data));
    
    return $this->connection->lastInsertId();
  }

  public function update($table, $data, $where) {
    $table = $this->table_prefix . $table;
    $set = implode(', ', array_map(fn($k) => "$k = ?", array_keys($data)));
    $whereClause = implode(' AND ', array_map(fn($k) => "$k = ?", array_keys($where)));
    
    $sql = "UPDATE $table SET $set WHERE $whereClause";
    $params = array_merge(array_values($data), array_values($where));
    
    return $this->query($sql, $params)->rowCount();
  }

  public function delete($table, $where) {
    $table = $this->table_prefix . $table;
    $whereClause = implode(' AND ', array_map(fn($k) => "$k = ?", array_keys($where)));
    
    $sql = "DELETE FROM $table WHERE $whereClause";
    return $this->query($sql, array_values($where))->rowCount();
  }

  public function getTablePrefix() {
    return $this->table_prefix;
  }

  public function __call($name, $arguments) {
    return call_user_func_array([$this->connection, $name], $arguments);
  }
}

// Singleton instance
$db = Database::getInstance()->getConnection();
