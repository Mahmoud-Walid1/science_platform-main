<?php
// admin/auth.php - حماية لوحة التحكم والتحقق من الجلسة
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../functions.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$admin_config_file = __DIR__ . '/../admin_config.json';
if (!file_exists($admin_config_file)) {
    $default_hash = password_hash('password', PASSWORD_BCRYPT);
    file_put_contents($admin_config_file, json_encode(['admin_password_hash' => $default_hash]));
}
$admin_config = json_decode(file_get_contents($admin_config_file), true);
$admin_password_hash = $admin_config['admin_password_hash'] ?? '';

// تسجيل الخروج
if (isset($_GET['logout'])) {
    unset($_SESSION['admin_logged_in']);
    header("Location: index.php");
    exit();
}

// دالة حماية الصفحات
function requireAdmin() {
    if (empty($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        header("Location: index.php?msg=login_required");
        exit();
    }
}
