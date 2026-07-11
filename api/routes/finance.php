<?php
/**
 * Finance Routes Handler
 */

function handleFinanceReport($db, $data) {
  $type = $data['type'] ?? null;
  $branch = $data['branch'] ?? null;
  $category = $data['category'] ?? null;
  $period = $data['period'] ?? null;
  $from = $data['from'] ?? null;
  $to = $data['to'] ?? null;

  // Resolve period → date range when no explicit from/to is set
  if ($period && $period !== 'custom' && (!$from || !$to)) {
    if ($period === 'daily') {
      $from = $to = date('Y-m-d');
    } elseif ($period === 'weekly') {
      $from = date('Y-m-d', strtotime('-6 days'));
      $to = date('Y-m-d');
    } elseif ($period === 'monthly') {
      // Accounting month: 2nd of current month → 1st of next month
      $from = date('Y-m') . '-02';
      $to = date('Y-m-d', mktime(0, 0, 0, (int)date('m') + 1, 1, (int)date('Y')));
    }
  }

  $sql = "SELECT * FROM doel_transactions WHERE 1=1";
  $params = [];

  if ($type && $type !== 'all') {
    $sql .= " AND type = ?";
    $params[] = ucfirst($type);
  }
  if ($branch) {
    $sql .= " AND branch = ?";
    $params[] = $branch;
  }
  if ($category) {
    $sql .= " AND category = ?";
    $params[] = $category;
  }
  if ($from && $to) {
    $sql .= " AND date BETWEEN ? AND ?";
    $params[] = $from;
    $params[] = $to;
  }

  $sql .= " ORDER BY date DESC";

  try {
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast numeric fields so JSON encodes them as numbers, not strings
    $transactions = array_map(function($tx) {
      $tx['amount'] = (float)$tx['amount'];
      return $tx;
    }, $raw);

    $total_income = 0.0;
    $total_expense = 0.0;
    $chart_data = [];

    foreach ($transactions as $tx) {
      if ($tx['type'] === 'Income') {
        $total_income += $tx['amount'];
      } else {
        $total_expense += $tx['amount'];
      }

      $date = $tx['date'];
      if (!isset($chart_data[$date])) {
        $chart_data[$date] = ['date' => $date, 'income' => 0.0, 'expense' => 0.0];
      }
      if ($tx['type'] === 'Income') {
        $chart_data[$date]['income'] += $tx['amount'];
      } else {
        $chart_data[$date]['expense'] += $tx['amount'];
      }
    }

    $chart_data = array_values($chart_data);
    usort($chart_data, fn($a, $b) => strcmp($a['date'], $b['date']));

    $net_profit = $total_income - $total_expense;

    Response::success([
      'total_income' => $total_income,
      'total_expense' => $total_expense,
      'net_profit' => $net_profit,
      'chart_data' => $chart_data,
      'transactions' => $transactions
    ], 'Finance report fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch finance report: ' . $e->getMessage(), 500);
  }
}

function handleFinanceTransaction($db, $data) {
  $required = ['date', 'type', 'category', 'amount', 'description'];
  $errors = Utils::validate($data, array_fill_keys($required, 'required'));

  if (!empty($errors)) {
    Response::error('Validation error: ' . implode(', ', $errors), 400);
  }

  try {
    $id = Utils::generateId('TX');
    $sql = "INSERT INTO doel_transactions (id, date, type, category, amount, description, branch, createdAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $db->prepare($sql);
    $stmt->execute([
      $id,
      $data['date'],
      ucfirst($data['type']),
      $data['category'],
      $data['amount'],
      $data['description'],
      $data['branch'] ?? null
    ]);

    Response::success(
      [
        'id' => $id,
        'date' => $data['date'],
        'type' => $data['type'],
        'category' => $data['category'],
        'amount' => $data['amount'],
        'description' => $data['description']
      ],
      'Transaction created',
      201
    );
  } catch (Exception $e) {
    Response::error('Failed to create transaction: ' . $e->getMessage(), 500);
  }
}

function handleFinanceUpdate($db, $id, $data) {
  try {
    $fields = [];
    $values = [];
    foreach (['date','type','category','amount','description','branch'] as $key) {
      if (isset($data[$key])) {
        $fields[] = "$key = ?";
        $values[] = $data[$key];
      }
    }
    if (empty($fields)) Response::error('No fields to update', 400);
    $values[] = $id;
    $stmt = $db->prepare("UPDATE doel_transactions SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($values);
    Response::success(['id' => $id], 'Transaction updated');
  } catch (Exception $e) {
    Response::error('Failed to update: ' . $e->getMessage(), 500);
  }
}

function handleFinanceDelete($db, $id) {
  try {
    $stmt = $db->prepare("DELETE FROM doel_transactions WHERE id = ?");
    $stmt->execute([$id]);
    Response::success(['id' => $id], 'Transaction deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete: ' . $e->getMessage(), 500);
  }
}
