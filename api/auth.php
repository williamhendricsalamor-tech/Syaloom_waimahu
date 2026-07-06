<?php
// auth.php - Handle admin login and session
session_start();
require_once 'db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Handle Login
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        echo json_encode(['status' => 'error', 'message' => 'Username dan password wajib diisi.']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id, password FROM admin_users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_id'] = $user['id'];
        echo json_encode(['status' => 'success', 'message' => 'Login berhasil.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Username atau password salah.']);
    }
} elseif ($method === 'GET') {
    // Check session or logout
    if (isset($_GET['action']) && $_GET['action'] === 'logout') {
        session_destroy();
        echo json_encode(['status' => 'success', 'message' => 'Logout berhasil.']);
    } else {
        if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
            echo json_encode(['status' => 'success', 'message' => 'Authenticated']);
        } else {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
        }
    }
}
?>
