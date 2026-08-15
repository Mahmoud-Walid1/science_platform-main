<?php
// config.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'science_platform');

// الاتصال بقاعدة البيانات
$conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if (!$conn) {
    die("فشل الاتصال بقاعدة البيانات: " . mysqli_connect_error());
}

// تعيين ترميز اللغة العربية
mysqli_set_charset($conn, "utf8mb4");

// ثوابت عامة
define('SITE_NAME', 'منصة التجارب العلمية التفاعلية');
define('SITE_URL', 'http://localhost/science-platform/');
?>