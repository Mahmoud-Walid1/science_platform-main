<?php
// functions.php - دوال المنصة (نظام كروت شحن الباقات واشتراكات المعلمين والتجميد الدراسي)

require_once __DIR__ . '/config.php';

/**
 * قراءة إعداد من نظام الإعدادات العام
 */
function getSystemSetting($key, $default = '') {
    global $conn;
    $stmt = $conn->prepare("SELECT setting_value FROM system_settings WHERE setting_key = ?");
    $stmt->bind_param("s", $key);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
        return $row['setting_value'];
    }
    return $default;
}

/**
 * حفظ إعداد في نظام الإعدادات العام
 */
function setSystemSetting($key, $value) {
    global $conn;
    $stmt = $conn->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->bind_param("sss", $key, $value, $value);
    return $stmt->execute();
}

/**
 * شحن واستبدال كود الباقة (One-Time Voucher Redemption)
 * يضيف مدة الباقة فوق اشتراك المعلم الحالي (تراكم الاشتراكات)
 */
function redeemCode($code, $user_id) {
    global $conn;

    $code = strtoupper(trim($code));
    $user_id = (int)$user_id;

    if (empty($code) || $user_id <= 0) {
        return ['success' => false, 'message' => '❌ بيانات غير مكتملة'];
    }

    // جلب بيانات الكود والباقة
    $stmt = $conn->prepare(
        "SELECT ac.id, ac.package_id, ac.is_active, ac.is_used, p.duration_months, p.name AS package_name
         FROM access_codes ac
         JOIN packages p ON ac.package_id = p.id
         WHERE ac.code = ?"
    );
    $stmt->bind_param("s", $code);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        logAccess($code, $user_id, 'invalid');
        return ['success' => false, 'message' => '❌ كود الشحن غير صحيح'];
    }

    $row = $result->fetch_assoc();

    if (!$row['is_active']) {
        logAccess($code, $user_id, 'deactivated');
        return ['success' => false, 'message' => '❌ هذا الكود معطّل من قِبل الإدارة'];
    }

    if ($row['is_used']) {
        logAccess($code, $user_id, 'already_used');
        return ['success' => false, 'message' => '❌ تم استخدام كود الشحن هذا من قبل ولا يمكن إعادة استخدامه'];
    }

    $duration_months = (int)$row['duration_months'];

    // فحص ما إذا كان للمستخدم اشتراك سابق لدمجه وتراكمه
    $sub_stmt = $conn->prepare("SELECT id, expires_at, is_frozen, frozen_days_remaining FROM user_subscriptions WHERE user_id = ?");
    $sub_stmt->bind_param("i", $user_id);
    $sub_stmt->execute();
    $sub_res = $sub_stmt->get_result();

    $now = time();
    $base_time = $now;

    if ($sub_res->num_rows > 0) {
        $existing_sub = $sub_res->fetch_assoc();
        $existing_expires = strtotime($existing_sub['expires_at']);
        
        // إذا كان الاشتراك الحالي لا يزال سارياً، نضيف عليه
        if ($existing_expires > $now) {
            $base_time = $existing_expires;
        }
    }

    // حساب تاريخ الانتهاء الجديد
    $new_expires_at = date('Y-m-d H:i:s', strtotime("+{$duration_months} months", $base_time));

    // تحديث أو إنشاء اشتراك المستخدم
    $save_sub = $conn->prepare(
        "INSERT INTO user_subscriptions (user_id, package_id, expires_at, is_frozen) 
         VALUES (?, ?, ?, 0) 
         ON DUPLICATE KEY UPDATE package_id = ?, expires_at = ?, updated_at = NOW()"
    );
    $save_sub->bind_param("iisis", $user_id, $row['package_id'], $new_expires_at, $row['package_id'], $new_expires_at);
    $save_sub->execute();

    // تعليم الكود كمستخدم ومستعمل
    $burn_stmt = $conn->prepare("UPDATE access_codes SET is_used = 1, used_by_user_id = ?, used_at = NOW() WHERE id = ?");
    $burn_stmt->bind_param("ii", $user_id, $row['id']);
    $burn_stmt->execute();

    logAccess($code, $user_id, 'success');

    return [
        'success' => true,
        'message' => '🎉 تم شحن الكود بنجاح وإضافة مدة ' . $duration_months . ' شهر إلى حسابك!',
        'package_name' => $row['package_name'],
        'expires_at' => $new_expires_at
    ];
}

/**
 * جلب تفاصيل اشتراك المستخدم وتأكيد حالة التجميد
 */
function getUserSubscription($user_id) {
    global $conn;
    $user_id = (int)$user_id;

    $stmt = $conn->prepare(
        "SELECT us.*, p.name AS package_name, p.duration_months 
         FROM user_subscriptions us
         JOIN packages p ON us.package_id = p.id
         WHERE us.user_id = ?"
    );
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 0) {
        return null;
    }

    $sub = $res->fetch_assoc();
    $global_freeze = (getSystemSetting('global_freeze', '0') === '1');

    $is_active = false;
    $now = time();
    $expires_timestamp = strtotime($sub['expires_at']);

    if ($global_freeze || $sub['is_frozen']) {
        // في حالة التجميد، يظل الاشتراك متاحاً وحافظاً لأيامه
        $is_active = true;
        $sub['status_text'] = '❄️ الاشتراك مُجمد (فترة إجازة وحساب الأيام متوقف)';
    } elseif ($expires_timestamp > $now) {
        $is_active = true;
        $sub['status_text'] = '✅ اشتراك نشط وسارٍ';
    } else {
        $is_active = false;
        $sub['status_text'] = '❌ اشتراك منتهي';
    }

    $sub['is_valid'] = $is_active;
    $sub['is_global_frozen'] = $global_freeze;

    return $sub;
}

/**
 * التحقق من تسجيل الدخول واشتراك المستخدم قبل الدخول لأي تجربة
 */
function isAuthenticated() {
    if (session_status() === PHP_SESSION_NONE) session_start();

    // التأكد من وجود جلسة مستخدم مأخوذة من المنصة
    $user_id = $_SESSION['user_id'] ?? $_SESSION['user']['id'] ?? null;

    if (!$user_id) {
        header("Location: ../index.php?msg=login_required");
        exit();
    }

    $sub = getUserSubscription($user_id);
    if (!$sub || !$sub['is_valid']) {
        header("Location: ../index.php?msg=subscription_required");
        exit();
    }

    return $sub;
}

/**
 * توليد كمية أكواد شحن دفعة واحدة (Batch Generation)
 */
function generateBatchCodes($package_id, $count = 10, $prefix = 'SCI') {
    global $conn;
    $package_id = (int)$package_id;
    $count = min(max((int)$count, 1), 500); // بين 1 و 500 كود
    $prefix = strtoupper(trim($prefix));

    $created_codes = [];
    $stmt = $conn->prepare("INSERT INTO access_codes (code, package_id, is_active, is_used) VALUES (?, ?, 1, 0)");

    for ($i = 0; $i < $count; $i++) {
        $random_str = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
        $code = "{$prefix}-{$random_str}";

        $stmt->bind_param("si", $code, $package_id);
        if ($stmt->execute()) {
            $created_codes[] = $code;
        }
    }

    return $created_codes;
}

/**
 * تسجيل محاولات الوصول والعمليات
 */
function logAccess($code, $user_id, $status) {
    global $conn;
    if (!$conn) return false;

    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $code = trim($code);
    $status = trim($status);
    $user_id_sql = ($user_id !== null && is_numeric($user_id)) ? (int)$user_id : 'NULL';

    $stmt = $conn->prepare("INSERT INTO access_logs (code, user_id, ip_address, status) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("siss", $code, $user_id_sql, $ip, $status);
    return $stmt->execute();
}

/**
 * جلب جميع الباقات
 */
function getAllPackages($active_only = false) {
    global $conn;
    $query = "SELECT * FROM packages";
    if ($active_only) $query .= " WHERE is_active = 1";
    $query .= " ORDER BY duration_months ASC";
    $result = mysqli_query($conn, $query);
    return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
}

/**
 * جلب جميع التجارب
 */
function getAllExperiments($active_only = false) {
    global $conn;
    $query = "SELECT * FROM experiments";
    if ($active_only) $query .= " WHERE is_active = 1";
    $query .= " ORDER BY id ASC";
    $result = mysqli_query($conn, $query);
    return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
}