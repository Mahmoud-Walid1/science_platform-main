<?php
// tracking.php - تتبع الزوار الحقيقيين

require_once __DIR__ . '/config.php';

/**
 * تسجيل الزائر إذا لم يُسجّل اليوم
 */
function trackVisitor() {
    global $conn;
    // منع تكرار التسجيل في نفس الجلسة
    if (!empty($_SESSION['visitor_tracked'])) return;

    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    $session_id = session_id();
    $today = date('Y-m-d');

    // فحص الوجود: نفس الجلسة أو (نفس IP + User Agent) اليوم
    $stmt = $conn->prepare(
        "SELECT id FROM visitors 
         WHERE DATE(first_visit) = ? 
           AND (session_id = ? OR (ip_address = ? AND user_agent = ?)) 
         LIMIT 1"
    );
    $stmt->bind_param("ssss", $today, $session_id, $ip, $ua);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows == 0) {
        // زائر جديد اليوم
        $insert = $conn->prepare(
            "INSERT INTO visitors (session_id, ip_address, user_agent, first_visit, last_visit) 
             VALUES (?, ?, ?, NOW(), NOW())"
        );
        $insert->bind_param("sss", $session_id, $ip, $ua);
        $insert->execute();
        $insert->close();
    } else {
        // تحديث آخر نشاط
        $update = $conn->prepare(
            "UPDATE visitors SET last_visit = NOW() WHERE session_id = ? AND DATE(first_visit) = ?"
        );
        $update->bind_param("ss", $session_id, $today);
        $update->execute();
        $update->close();
    }
    $stmt->close();

    $_SESSION['visitor_tracked'] = true;
}