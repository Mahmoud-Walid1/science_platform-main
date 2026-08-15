<?php
// config.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// بيانات الاتصال بقاعدة بيانات Hostinger
define('DB_HOST', 'localhost');
define('DB_USER', 'u860574850_user1_labs1');
define('DB_PASS', 'S511511_s');
define('DB_NAME', 'u860574850_user1_labs1');

// الاتصال بقاعدة البيانات
$conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if (!$conn) {
    die("فشل الاتصال بقاعدة البيانات: " . mysqli_connect_error());
}

// تعيين ترميز اللغة العربية
mysqli_set_charset($conn, "utf8mb4");

// ثوابت عامة
define('SITE_NAME', 'منصة التجارب العلمية التفاعلية');
define('SITE_URL', 'https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/');
?>