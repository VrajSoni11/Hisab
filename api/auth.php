<?php
// ============================================
// auth.php - Register & Login
// Place in: htdocs/kamdhenu/api/auth.php
// ============================================

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method === 'POST' && $path === 'register') {
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $firm_name = trim($input['firm_name'] ?? '');

    if (!$name || !$email || !$password || !$firm_name) {
        respond(['error' => 'All fields are required'], 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(['error' => 'Invalid email format'], 400);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        respond(['error' => 'Email already registered'], 409);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare("INSERT INTO users (name, email, password, firm_name) VALUES (?,?,?,?)");
    $stmt->bind_param('ssss', $name, $email, $hash, $firm_name);
    $stmt->execute();
    $userId = $db->insert_id;

    $token = generateToken($userId);
    respond(['token' => $token, 'user' => ['id' => $userId, 'name' => $name, 'email' => $email, 'firm_name' => $firm_name]]);
}

if ($method === 'POST' && $path === 'login') {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (!$email || !$password) {
        respond(['error' => 'Email and password required'], 400);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user || !password_verify($password, $user['password'])) {
        respond(['error' => 'Invalid credentials'], 401);
    }

    $token = generateToken($user['id']);
    respond(['token' => $token, 'user' => ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email'], 'firm_name' => $user['firm_name']]]);
}

if ($method === 'GET' && $path === 'me') {
    $userId = getAuthUser();
    $db = getDB();
    $stmt = $db->prepare("SELECT id, name, email, firm_name FROM users WHERE id = ?");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    respond($user);
}

respond(['error' => 'Not found'], 404);
