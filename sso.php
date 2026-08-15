<?php
// sso.php - الدخول الموحد من المنصة الرئيسية (Single Sign-On SSO)
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

define('SSO_SECRET', 'SabirPlatformVirtualLabsSecret2026');

$uid = (int)($_GET['uid'] ?? 0);
$name = trim($_GET['name'] ?? '');
$phone = trim($_GET['phone'] ?? '');
$ts = (int)($_GET['ts'] ?? 0);
$hash = $_GET['hash'] ?? '';

if ($uid <= 0 || empty($name) || empty($hash)) {
    die("❌ بيانات التوجيه الموحد غير صحيحة");
}

// فحص صلاحية التاريخ والوقت (الرابط صالحة لمدة 5 دقائق فقط)
if (abs(time() - $ts) > 300) {
    die("❌ انتهت صلاحية رابط الدخول، يرجى المحاولة من المنصة الرئيسية مجدداً");
}

// التحقق من التوقيع الرقمي (HMAC Hash)
$expected_hash = hash_hmac('sha256', "{$uid}|{$name}|{$phone}|{$ts}", SSO_SECRET);
if (!hash_equals($expected_hash, $hash)) {
    die("❌ توقيع الدخول غير موثوق");
}

// إنشاء جلسة المستخدم فوراً
if (session_status() === PHP_SESSION_NONE) session_start();

$_SESSION['user_id'] = $uid;
$_SESSION['user_name'] = $name;
$_SESSION['user'] = [
    'id' => $uid,
    'name' => $name,
    'whatsappNumber' => $phone
];

// تسجيل زيارة في اللوج
logAccess('SSO_LOGIN', $uid, 'success');

// التوجيه التلقائي إلى لوحة التجارب
header("Location: my-experiments.php");
exit();
