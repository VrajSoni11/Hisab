<?php
// ============================================
// config.php - Database Configuration
// Place this in: htdocs/kamdhenu/api/config.php
// ============================================

define('DB_HOST', 'localhost');
define('DB_USER', 'root');       // Change if needed
define('DB_PASS', '');           // XAMPP default is empty
define('DB_NAME', 'kamdhenu_db');
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('JWT_SECRET', 'kamdhenu_secret_key_2025_change_this');

// CORS Headers
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// DB Connection
function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
        exit();
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

// JWT helpers (simple base64 implementation for XAMPP)
function generateToken($userId) {
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode(['user_id' => $userId, 'exp' => time() + 86400 * 7]));
    $sig = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$sig";
}

function verifyToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    [$header, $payload, $sig] = $parts;
    $expectedSig = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    if ($sig !== $expectedSig) return false;
    $data = json_decode(base64_decode($payload), true);
    if ($data['exp'] < time()) return false;
    return $data['user_id'];
}

function getAuthUser() {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? '';
    if (!str_starts_with($auth, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    $token = substr($auth, 7);
    $userId = verifyToken($token);
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit();
    }
    return $userId;
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}
