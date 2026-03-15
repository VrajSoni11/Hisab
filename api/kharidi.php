<?php
// ============================================
// kharidi.php - Purchase / Kharidi Management
// Place in: htdocs/kamdhenu/api/kharidi.php
// ============================================

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$userId = getAuthUser();
$db = getDB();

// ---- LIST ALL KHARIDI ----
if ($method === 'GET' && $action === 'list') {
    $order_id = intval($_GET['order_id'] ?? 0);
    if ($order_id) {
        $stmt = $db->prepare("SELECT k.*, o.order_no, o.org_name FROM kharidi k LEFT JOIN orders o ON k.order_id = o.id WHERE k.user_id = ? AND k.order_id = ? ORDER BY k.payment_date ASC");
        $stmt->bind_param('ii', $userId, $order_id);
    } else {
        $stmt = $db->prepare("SELECT k.*, o.order_no, o.org_name FROM kharidi k LEFT JOIN orders o ON k.order_id = o.id WHERE k.user_id = ? ORDER BY k.payment_date DESC");
        $stmt->bind_param('i', $userId);
    }
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    respond($rows);
}

// ---- KHARIDI SUMMARY PER ORDER ----
if ($method === 'GET' && $action === 'summary') {
    $stmt = $db->prepare("
        SELECT o.id, o.order_no, o.org_name, o.total_amount, o.amount_credited, o.tds_cut, o.status,
               COALESCE(SUM(k.amount),0) as total_kharidi,
               GROUP_CONCAT(DISTINCT k.paid_by SEPARATOR ', ') as paid_by_list
        FROM orders o
        INNER JOIN kharidi k ON k.order_id = o.id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.id ASC
    ");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    foreach ($rows as &$r) {
        $r['profit'] = floatval($r['amount_credited']) - floatval($r['total_kharidi']);
    }
    respond($rows);
}

// ---- CREATE KHARIDI ENTRY ----
if ($method === 'POST' && $action === 'create') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $order_id = $data['order_id'] ? intval($data['order_id']) : null;
    $payment_date = $data['payment_date'] ?? date('Y-m-d');
    $amount = floatval($data['amount'] ?? 0);
    $paid_by = trim($data['paid_by'] ?? '');
    $vendor_name = trim($data['vendor_name'] ?? '');
    $description = trim($data['description'] ?? '');

    if (!$amount || !$paid_by) {
        respond(['error' => 'Amount and Paid By are required'], 400);
    }

    // If order_id given, verify it belongs to user
    if ($order_id) {
        $chk = $db->prepare("SELECT id FROM orders WHERE id = ? AND user_id = ?");
        $chk->bind_param('ii', $order_id, $userId);
        $chk->execute();
        if ($chk->get_result()->num_rows === 0) respond(['error' => 'Order not found'], 404);
    }

    $stmt = $db->prepare("INSERT INTO kharidi (user_id, order_id, payment_date, amount, paid_by, vendor_name, description) VALUES (?,?,?,?,?,?,?)");
    $stmt->bind_param('iidssss', $userId, $order_id, $payment_date, $amount, $paid_by, $vendor_name, $description);
    $stmt->execute();
    respond(['success' => true, 'id' => $db->insert_id]);
}

// ---- UPDATE KHARIDI ----
if ($method === 'PUT' && $action === 'update') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = intval($data['id'] ?? 0);
    $payment_date = $data['payment_date'] ?? date('Y-m-d');
    $amount = floatval($data['amount'] ?? 0);
    $paid_by = trim($data['paid_by'] ?? '');
    $vendor_name = trim($data['vendor_name'] ?? '');
    $description = trim($data['description'] ?? '');

    $stmt = $db->prepare("UPDATE kharidi SET payment_date=?, amount=?, paid_by=?, vendor_name=?, description=? WHERE id=? AND user_id=?");
    $stmt->bind_param('sdsssii', $payment_date, $amount, $paid_by, $vendor_name, $description, $id, $userId);
    $stmt->execute();
    respond(['success' => true]);
}

// ---- DELETE KHARIDI ----
if ($method === 'DELETE' && $action === 'delete') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = intval($data['id'] ?? $_GET['id'] ?? 0);
    $stmt = $db->prepare("DELETE FROM kharidi WHERE id = ? AND user_id = ?");
    $stmt->bind_param('ii', $id, $userId);
    $stmt->execute();
    respond(['success' => true]);
}

respond(['error' => 'Not found'], 404);