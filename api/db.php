<?php
// db.php - Konfigurasi dan inisialisasi database SQLite

$db_dir = __DIR__ . '/../database';
$db_file = $db_dir . '/news.sqlite';

// Buat direktori jika belum ada
if (!file_exists($db_dir)) {
    mkdir($db_dir, 0777, true);
}

try {
    $pdo = new PDO("sqlite:" . $db_file);
    // Set PDO to throw exceptions on error
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Buat tabel berita
    $query = "CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        media_path TEXT,
        media_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($query);

    // Buat tabel admin
    $query_admin = "CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )";
    $pdo->exec($query_admin);

    // Insert default admin if table is empty
    $check_admin = $pdo->query("SELECT COUNT(*) FROM admin_users")->fetchColumn();
    if ($check_admin == 0) {
        $default_user = 'admin';
        $default_pass = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO admin_users (username, password) VALUES (?, ?)");
        $stmt->execute([$default_user, $default_pass]);
    }

} catch (PDOException $e) {
    die("Database Connection failed: " . $e->getMessage());
}
?>
