<?php
// ============================================
// analytics.php - Charts & Reports Data
// Place in: htdocs/kamdhenu/api/analytics.php
// ============================================

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = getAuthUser();
$db = getDB();

// ---- MONTHLY ORDERS BAR CHART ----
if ($method === 'GET' && $action === 'monthly') {
    $year = intval($_GET['year'] ?? date('Y'));
    $stmt = $db->prepare("
        SELECT 
            MONTH(order_date) as month,
            COUNT(*) as order_count,
            SUM(total_amount) as total_amount,
            SUM(amount_credited) as credited
        FROM orders 
        WHERE user_id = ? AND YEAR(order_date) = ?
        GROUP BY MONTH(order_date)
        ORDER BY month
    ");
    $stmt->bind_param('ii', $userId, $year);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Fill all 12 months
    $months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    $result = [];
    for ($m = 1; $m <= 12; $m++) {
        $found = array_filter($rows, fn($r) => intval($r['month']) === $m);
        $found = array_values($found);
        $result[] = [
            'month' => $months[$m-1],
            'order_count' => $found ? intval($found[0]['order_count']) : 0,
            'total_amount' => $found ? floatval($found[0]['total_amount']) : 0,
            'credited' => $found ? floatval($found[0]['credited']) : 0,
        ];
    }
    respond($result);
}

// ---- PIE CHART BY ORGANIZATION ----
if ($method === 'GET' && $action === 'by_org') {
    $stmt = $db->prepare("
        SELECT org_name, COUNT(*) as order_count, CAST(SUM(total_amount) AS DECIMAL(12,2)) as total_amount
        FROM orders WHERE user_id = ?
        GROUP BY org_name
        ORDER BY total_amount DESC
        LIMIT 10
    ");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    // Cast to correct types for JSON
    $result = array_map(fn($r) => [
        'org_name' => $r['org_name'],
        'order_count' => intval($r['order_count']),
        'total_amount' => floatval($r['total_amount']),
    ], $rows);
    respond($result);
}

// ---- AVAILABLE YEARS ----
if ($method === 'GET' && $action === 'years') {
    $stmt = $db->prepare("SELECT DISTINCT YEAR(order_date) as year FROM orders WHERE user_id = ? ORDER BY year DESC");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $years = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    if (empty($years)) $years = [['year' => date('Y')]];
    respond($years);
}

// ---- WEEKLY ORDERS (all weeks with data, last 12 weeks) ----
if ($method === 'GET' && $action === 'weekly') {
    $stmt = $db->prepare("
        SELECT 
            YEARWEEK(order_date, 1) as yw,
            MIN(order_date) as week_start,
            COUNT(*) as order_count,
            CAST(SUM(total_amount) AS DECIMAL(12,2)) as total_amount,
            CAST(SUM(amount_credited) AS DECIMAL(12,2)) as credited
        FROM orders
        WHERE user_id = ?
        GROUP BY YEARWEEK(order_date, 1)
        ORDER BY yw ASC
        LIMIT 12
    ");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $result = array_map(fn($r) => [
        'yw' => $r['yw'],
        'week_start' => $r['week_start'],
        'order_count' => intval($r['order_count']),
        'total_amount' => floatval($r['total_amount']),
        'credited' => floatval($r['credited']),
    ], $rows);
    respond($result);
}

respond(['error' => 'Not found'], 404);