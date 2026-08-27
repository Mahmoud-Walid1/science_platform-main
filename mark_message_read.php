<?php
// mark_message_read.php - تحديث حالة قراءة الرسالة المنبثقة للمعلم عبر AJAX
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) session_start();

$user_id = $_SESSION['user_id'] ?? $_SESSION['user']['id'] ?? null;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'غير مسجل دخول']);
    exit();
}

if (markTeacherMessageRead($user_id)) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'تعذر تحديث الحالة']);
}
