<?php
/**
 * Forecast Routes Handler
 */

function handleRevenueForecast($db, $data) {
  try {
    // Get last 6 months revenue
    $sql = "SELECT SUM(amount) as total, DATE_FORMAT(date, '%Y-%m') as month 
            FROM doel_transactions 
            WHERE type = 'Income' 
            AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY month 
            ORDER BY month DESC 
            LIMIT 6";
    
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $months = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate forecast
    $last6Months = [];
    foreach ($months as $month) {
      $last6Months[] = $month['total'] ?? 0;
    }
    $last6Months = array_reverse($last6Months);

    if (count($last6Months) >= 2) {
      $avgGrowth = ($last6Months[count($last6Months)-1] - $last6Months[0]) / (count($last6Months) - 1);
      $forecast = ($last6Months[count($last6Months)-1] + $avgGrowth);
    } else {
      $forecast = $last6Months[count($last6Months)-1] ?? 0;
      $avgGrowth = 0;
    }

    Response::success([
      'forecast' => $forecast,
      'confidence' => 0.85,
      'trend' => $avgGrowth > 0 ? 'Upward' : 'Downward',
      'message' => 'Expected revenue: ৳' . number_format($forecast, 0) . ' next month.',
      'lastSixMonths' => $last6Months
    ], 'Revenue forecast');
  } catch (Exception $e) {
    Response::error('Failed to fetch revenue forecast: ' . $e->getMessage(), 500);
  }
}
