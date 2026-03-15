<?php
// ============================================
// orders.php - Orders / Vikri Management
// Place in: htdocs/kamdhenu/api/orders.php
// ============================================

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$userId = getAuthUser();
$db = getDB();

// ---- LIST ORDERS ----
if ($method === 'GET' && $action === 'list') {
    $search = '%' . ($_GET['search'] ?? '') . '%';
    $status = $_GET['status'] ?? '';
    $statusClause = $status ? "AND o.status = '$status'" : '';

    $sql = "SELECT o.*, 
            (SELECT COALESCE(SUM(k.amount),0) FROM kharidi k WHERE k.order_id = o.id) as total_kharidi
            FROM orders o 
            WHERE o.user_id = ? AND (o.order_no LIKE ? OR o.org_name LIKE ? OR o.item_name LIKE ?)
            $statusClause
            ORDER BY o.id ASC";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('isss', $userId, $search, $search, $search);
    $stmt->execute();
    $orders = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    respond($orders);
}

// ---- GET SINGLE ORDER ----
if ($method === 'GET' && $action === 'get') {
    $id = intval($_GET['id'] ?? 0);
    $stmt = $db->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?");
    $stmt->bind_param('ii', $id, $userId);
    $stmt->execute();
    $order = $stmt->get_result()->fetch_assoc();
    if (!$order) respond(['error' => 'Order not found'], 404);

    // Fetch kharidi for this order
    $stmt2 = $db->prepare("SELECT * FROM kharidi WHERE order_id = ? ORDER BY payment_date ASC");
    $stmt2->bind_param('i', $id);
    $stmt2->execute();
    $order['kharidi'] = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);
    respond($order);
}

// ---- CREATE ORDER ----
if ($method === 'POST' && $action === 'create') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $order_no = trim($data['order_no'] ?? '');
    $order_date = $data['order_date'] ?? '';
    $org_name = trim($data['org_name'] ?? '');
    $item_name = trim($data['item_name'] ?? '');
    $total_amount = floatval($data['total_amount'] ?? 0);
    $credit_date = $data['credit_date'] ?: null;
    $amount_credited = floatval($data['amount_credited'] ?? 0);
    $tds_cut = floatval($data['tds_cut'] ?? 0);
    $notes = trim($data['notes'] ?? '');

    if (!$order_no || !$order_date || !$org_name || !$item_name || !$total_amount) {
        respond(['error' => 'Required fields missing'], 400);
    }

    // Determine status
    $status = 'pending';
    if ($amount_credited > 0 && $amount_credited >= ($total_amount - 1)) $status = 'credited';
    elseif ($amount_credited > 0) $status = 'partial';

    $stmt = $db->prepare("INSERT INTO orders (user_id, order_no, order_date, org_name, item_name, total_amount, credit_date, amount_credited, tds_cut, status, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->bind_param('issssdsdsss', $userId, $order_no, $order_date, $org_name, $item_name, $total_amount, $credit_date, $amount_credited, $tds_cut, $status, $notes);
    $stmt->execute();
    respond(['success' => true, 'id' => $db->insert_id]);
}

// ---- UPDATE ORDER ----
if ($method === 'PUT' && $action === 'update') {
    $isMultipart = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart') !== false;
    if ($isMultipart) {
        parse_str(file_get_contents('php://input'), $data);
        $data = array_merge($data, $_POST);
    } else {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
    }

    $id = intval($data['id'] ?? 0);
    $order_no = trim($data['order_no'] ?? '');
    $order_date = $data['order_date'] ?? '';
    $org_name = trim($data['org_name'] ?? '');
    $item_name = trim($data['item_name'] ?? '');
    $total_amount = floatval($data['total_amount'] ?? 0);
    $credit_date = $data['credit_date'] ?: null;
    $amount_credited = floatval($data['amount_credited'] ?? 0);
    $tds_cut = floatval($data['tds_cut'] ?? 0);
    $notes = trim($data['notes'] ?? '');

    $status = 'pending';
    if ($amount_credited > 0 && $amount_credited >= ($total_amount - 1)) $status = 'credited';
    elseif ($amount_credited > 0) $status = 'partial';

    $stmt = $db->prepare("UPDATE orders SET order_no=?, order_date=?, org_name=?, item_name=?, total_amount=?, credit_date=?, amount_credited=?, tds_cut=?, status=?, notes=? WHERE id=? AND user_id=?");
    $stmt->bind_param('ssssdsdsssii', $order_no, $order_date, $org_name, $item_name, $total_amount, $credit_date, $amount_credited, $tds_cut, $status, $notes, $id, $userId);
    $stmt->execute();
    respond(['success' => true]);
}

// ---- DELETE ORDER ----
if ($method === 'DELETE' && $action === 'delete') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = intval($data['id'] ?? $_GET['id'] ?? 0);
    $stmt = $db->prepare("DELETE FROM orders WHERE id = ? AND user_id = ?");
    $stmt->bind_param('ii', $id, $userId);
    $stmt->execute();
    respond(['success' => true]);
}

// ---- KPI SUMMARY ----
if ($method === 'GET' && $action === 'kpi') {
    $stmt = $db->prepare("SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount),0) as total_order_value,
        COALESCE(SUM(amount_credited),0) as total_credited,
        COALESCE(SUM(tds_cut),0) as total_tds,
        COALESCE(SUM(CASE WHEN status='pending' THEN (total_amount - amount_credited - tds_cut) ELSE 0 END),0) as total_pending
        FROM orders WHERE user_id = ?");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $kpi = $stmt->get_result()->fetch_assoc();

    // Total Kharidi
    $stmt2 = $db->prepare("SELECT COALESCE(SUM(amount),0) as total_kharidi FROM kharidi WHERE user_id = ?");
    $stmt2->bind_param('i', $userId);
    $stmt2->execute();
    $kharidi = $stmt2->get_result()->fetch_assoc();
    $kpi['total_kharidi'] = $kharidi['total_kharidi'];
    $kpi['total_profit'] = $kpi['total_credited'] - $kpi['total_kharidi'];

    respond($kpi);
}

respond(['error' => 'Not found'], 404);