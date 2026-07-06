<?php
// berita.php - Handle CRUD for news/announcements
session_start();
require_once 'db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$upload_dir = __DIR__ . '/../uploads/';

// Create uploads directory if not exists
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

if ($method === 'GET') {
    // Fetch news (publicly accessible)
    $stmt = $pdo->query("SELECT * FROM news ORDER BY created_at DESC");
    $news = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['status' => 'success', 'data' => $news]);
} elseif ($method === 'POST') {
    // Check authentication
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }

    $title = $_POST['title'] ?? '';
    $content = $_POST['content'] ?? '';

    if (empty($title) || empty($content)) {
        echo json_encode(['status' => 'error', 'message' => 'Judul dan konten wajib diisi.']);
        exit;
    }

    $media_path = null;
    $media_type = null;

    // Handle file upload
    if (isset($_FILES['media']) && $_FILES['media']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['media'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        $allowed_image_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $allowed_video_ext = ['mp4', 'webm', 'ogg'];

        if (in_array($ext, $allowed_image_ext)) {
            $media_type = 'image';
        } elseif (in_array($ext, $allowed_video_ext)) {
            $media_type = 'video';
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Format file tidak didukung.']);
            exit;
        }

        $filename = uniqid('media_') . '.' . $ext;
        if (move_uploaded_file($file['tmp_name'], $upload_dir . $filename)) {
            $media_path = 'uploads/' . $filename;
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Gagal mengupload file.']);
            exit;
        }
    }

    $stmt = $pdo->prepare("INSERT INTO news (title, content, media_path, media_type) VALUES (?, ?, ?, ?)");
    if ($stmt->execute([$title, $content, $media_path, $media_type])) {
        echo json_encode(['status' => 'success', 'message' => 'Berita berhasil ditambahkan.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan ke database.']);
    }
} elseif ($method === 'DELETE') {
    // Check authentication
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;

    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'ID tidak ditemukan.']);
        exit;
    }

    // Ambil path media untuk dihapus filenya
    $stmt = $pdo->prepare("SELECT media_path FROM news WHERE id = ?");
    $stmt->execute([$id]);
    $news = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($news) {
        if (!empty($news['media_path']) && file_exists(__DIR__ . '/../' . $news['media_path'])) {
            unlink(__DIR__ . '/../' . $news['media_path']);
        }
        
        $deleteStmt = $pdo->prepare("DELETE FROM news WHERE id = ?");
        $deleteStmt->execute([$id]);
        
        echo json_encode(['status' => 'success', 'message' => 'Berita berhasil dihapus.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Berita tidak ditemukan.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed']);
}
?>
