<?php
/**
 * Bus BD Ticket Commission Tracker Routes
 */

const BUSBD_COMMISSION_PER_TICKET = 100.0;

function handleBusBdList($db) {
  try {
    $stmt = $db->prepare("SELECT * FROM doel_busbd_records ORDER BY date DESC");
    $stmt->execute();
    $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $floatFields = ['openingAmount','ticketAmount','commission','softwareCommission','doelWithdrawAmount','dailyAmount','closingAmount'];
    $records = array_map(function($r) use ($floatFields) {
      foreach ($floatFields as $f) { if (isset($r[$f])) $r[$f] = (float)$r[$f]; }
      if (isset($r['noOfTickets'])) $r['noOfTickets'] = (int)$r['noOfTickets'];
      return $r;
    }, $raw);
    Response::success($records, 'Bus BD records fetched');
  } catch (Exception $e) {
    Response::error('Failed to fetch Bus BD records: ' . $e->getMessage(), 500);
  }
}

function handleBusBdCreate($db, $data) {
  if (empty($data['date'])) {
    Response::error('Date is required', 400);
  }
  try {
    $id = $data['id'] ?? ('BBD-' . substr(time(), -8));

    $opening = (float)($data['openingAmount'] ?? 0);
    $noOfTickets = (int)($data['noOfTickets'] ?? 0);
    $ticketAmount = (float)($data['ticketAmount'] ?? 0);
    $softwareCommission = (float)($data['softwareCommission'] ?? 0);
    $commission = isset($data['commission']) ? (float)$data['commission'] : round($noOfTickets * BUSBD_COMMISSION_PER_TICKET, 2);
    // Doel Withdraw Amount is a manual figure entered by the user, not derived
    $doelWithdraw = (float)($data['doelWithdrawAmount'] ?? 0);
    // Doel Net BusBD Amount = Opening + (TicketAmount - (Commission + SoftwareCommission + DoelWithdrawAmount))
    $closing = isset($data['closingAmount'])
      ? (float)$data['closingAmount']
      : round($opening + ($ticketAmount - ($commission + $softwareCommission + $doelWithdraw)), 2);

    $stmt = $db->prepare("INSERT INTO doel_busbd_records
      (id, date, openingAmount, noOfTickets, ticketAmount, commission, softwareCommission, doelWithdrawAmount, closingAmount, notes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        date=VALUES(date), openingAmount=VALUES(openingAmount), noOfTickets=VALUES(noOfTickets),
        ticketAmount=VALUES(ticketAmount), commission=VALUES(commission), softwareCommission=VALUES(softwareCommission),
        doelWithdrawAmount=VALUES(doelWithdrawAmount), closingAmount=VALUES(closingAmount), notes=VALUES(notes)");
    $stmt->execute([
      $id, $data['date'],
      $opening,
      $noOfTickets,
      $ticketAmount,
      round($commission, 2),
      round($softwareCommission, 2),
      round($doelWithdraw, 2),
      round($closing, 2),
      $data['notes'] ?? null,
    ]);
    Response::success(['id' => $id], 'Bus BD record saved', 201);
  } catch (Exception $e) {
    Response::error('Failed to save Bus BD record: ' . $e->getMessage(), 500);
  }
}

function handleBusBdUpdate($db, $id, $data) {
  try {
    $opening = (float)($data['openingAmount'] ?? 0);
    $noOfTickets = (int)($data['noOfTickets'] ?? 0);
    $ticketAmount = (float)($data['ticketAmount'] ?? 0);
    $softwareCommission = (float)($data['softwareCommission'] ?? 0);
    $commission = isset($data['commission']) ? (float)$data['commission'] : round($noOfTickets * BUSBD_COMMISSION_PER_TICKET, 2);
    // Doel Withdraw Amount is a manual figure entered by the user, not derived
    $doelWithdraw = (float)($data['doelWithdrawAmount'] ?? 0);
    // Doel Net BusBD Amount = Opening + (TicketAmount - (Commission + SoftwareCommission + DoelWithdrawAmount))
    $closing = isset($data['closingAmount'])
      ? (float)$data['closingAmount']
      : round($opening + ($ticketAmount - ($commission + $softwareCommission + $doelWithdraw)), 2);

    $stmt = $db->prepare("UPDATE doel_busbd_records SET
      date=?, openingAmount=?, noOfTickets=?, ticketAmount=?, commission=?, softwareCommission=?, doelWithdrawAmount=?, closingAmount=?, notes=?
      WHERE id=?");
    $stmt->execute([
      $data['date'],
      $opening,
      $noOfTickets,
      $ticketAmount,
      round($commission, 2),
      round($softwareCommission, 2),
      round($doelWithdraw, 2),
      round($closing, 2),
      $data['notes'] ?? null,
      $id,
    ]);
    Response::success([], 'Bus BD record updated');
  } catch (Exception $e) {
    Response::error('Failed to update Bus BD record: ' . $e->getMessage(), 500);
  }
}

function handleBusBdDelete($db, $id) {
  try {
    $stmt = $db->prepare("DELETE FROM doel_busbd_records WHERE id=?");
    $stmt->execute([$id]);
    Response::success([], 'Bus BD record deleted');
  } catch (Exception $e) {
    Response::error('Failed to delete Bus BD record: ' . $e->getMessage(), 500);
  }
}
