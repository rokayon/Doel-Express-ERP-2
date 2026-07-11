<?php
/**
 * Sales Routes Handler
 */

function handleSalesRecords($db, $data) {
  try {
    $sql = "SELECT * FROM doel_ticket_sales ORDER BY date DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $intFields   = ['departureSeatQty','returnSeatQty','ticketsSold','dmd'];
    $floatFields = ['departureTaka','returnTaka','totalTaka','dieselLtr','dieselCost',
                    'tripCost','totalCost','netProfit','abdullahpurOffice','coxsbazarOffice',
                    'sonargaonOffice','ticketPrice','discount','salesCommission','totalAmount'];
    $records = array_map(function($r) use ($intFields, $floatFields) {
      foreach ($intFields   as $f) { if (isset($r[$f])) $r[$f] = (int)$r[$f]; }
      foreach ($floatFields as $f) { if (isset($r[$f])) $r[$f] = (float)$r[$f]; }
      return $r;
    }, $raw);

    Response::success($records, 'Sales records fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch sales records: ' . $e->getMessage(), 500);
  }
}

function handleSalesCreate($db, $data) {
  $required = ['date', 'regNo', 'coachNo', 'driverName'];
  $errors = Utils::validate($data, array_fill_keys($required, 'required'));

  if (!empty($errors)) {
    Response::error('Validation error: ' . implode(', ', $errors), 400);
  }

  try {
    $id = Utils::generateId('REC');
    
    $sql = "INSERT INTO doel_ticket_sales 
            (id, date, time, regNo, coachNo, driverName, guideName, operatorName, counterName, 
             tripId, busNumber, departureDate, departureSeatQty, departureTaka, returnDate, 
             returnSeatQty, returnTaka, totalTaka, dieselLtr, dieselCost, tripCost, totalCost, 
             netProfit, abdullahpurOffice, coxsbazarOffice, sonargaonOffice, dmd, 
             ticketsSold, ticketPrice, discount, salesCommission, totalAmount, createdAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $db->prepare($sql);
    $stmt->execute([
      $id,
      $data['date'],
      Utils::getCurrentTime(),
      $data['regNo'],
      $data['coachNo'],
      $data['driverName'],
      $data['guideName'] ?? 'Counter Staff',
      $data['operatorName'] ?? null,
      $data['counterName'] ?? null,
      $data['tripId'] ?? null,
      $data['busNumber'] ?? null,
      $data['departureDate'] ?? $data['date'],
      $data['departureSeatQty'] ?? $data['ticketsSold'] ?? 0,
      $data['departureTaka'] ?? $data['totalAmount'] ?? 0,
      $data['returnDate'] ?? null,
      $data['returnSeatQty'] ?? 0,
      $data['returnTaka'] ?? 0,
      $data['totalTaka'] ?? $data['totalAmount'] ?? 0,
      $data['dieselLtr'] ?? 0,
      $data['dieselCost'] ?? 0,
      $data['tripCost'] ?? 0,
      $data['totalCost'] ?? 0,
      $data['netProfit'] ?? ($data['totalAmount'] ?? 0),
      $data['abdullahpurOffice'] ?? 0,
      $data['coxsbazarOffice'] ?? 0,
      $data['sonargaonOffice'] ?? 0,
      $data['dmd'] ?? 0,
      $data['ticketsSold'] ?? 0,
      $data['ticketPrice'] ?? 0,
      $data['discount'] ?? 0,
      $data['salesCommission'] ?? 0,
      $data['totalAmount'] ?? 0
    ]);

    Response::success(['id' => $id], 'Sales record created', 201);
  } catch (Exception $e) {
    Response::error('Failed to create sales record: ' . $e->getMessage(), 500);
  }
}

function handleSalesExport($db, $data) {
  try {
    $sql = "SELECT * FROM doel_ticket_sales ORDER BY date DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Generate CSV
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=sales_report.csv');

    $output = fopen('php://output', 'w');
    
    // BOM for UTF-8
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    // Headers
    $headers = ['Date', 'Reg No', 'Coach No', 'Driver', 'Total Taka', 'Total Cost', 'Net Profit'];
    fputcsv($output, $headers);

    // Data
    foreach ($records as $record) {
      fputcsv($output, [
        $record['date'],
        $record['regNo'],
        $record['coachNo'],
        $record['driverName'],
        $record['totalTaka'],
        $record['totalCost'],
        $record['netProfit']
      ]);
    }

    fclose($output);
    exit;
  } catch (Exception $e) {
    Response::error('Failed to export sales: ' . $e->getMessage(), 500);
  }
}

function handleSalesUpdate($db, $id, $data) {
  try {
    $allowed = ['date','regNo','coachNo','driverName','guideName',
                'departureDate','departureSeatQty','departureTaka',
                'returnDate','returnSeatQty','returnTaka',
                'totalTaka','dieselLtr','dieselCost','tripCost','totalCost','netProfit',
                'abdullahpurOffice','coxsbazarOffice','sonargaonOffice','dmd'];
    $fields = [];
    $values = [];
    foreach ($allowed as $key) {
      if (isset($data[$key])) { $fields[] = "$key = ?"; $values[] = $data[$key]; }
    }
    if (empty($fields)) Response::error('No fields to update', 400);
    $values[] = $id;
    $stmt = $db->prepare("UPDATE doel_ticket_sales SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($values);
    Response::success(['id' => $id], 'Sales record updated');
  } catch (Exception $e) {
    Response::error('Failed to update: ' . $e->getMessage(), 500);
  }
}

function handleSalesDelete($db, $id) {
  try {
    $stmt = $db->prepare("DELETE FROM doel_ticket_sales WHERE id = ?");
    $stmt->execute([$id]);
    Response::success(['id' => $id], 'Sales record deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete: ' . $e->getMessage(), 500);
  }
}
