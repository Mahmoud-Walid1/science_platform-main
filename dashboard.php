<?php
// dashboard.php - نسخة متكاملة: شاشة دخول قديمة + تغيير كلمة المرور
require_once 'config.php';

if (session_status() === PHP_SESSION_NONE) session_start();

// ========== إدارة كلمة المرور (ملف JSON) ==========
$admin_config_file = __DIR__ . '/admin_config.json';
if (!file_exists($admin_config_file)) {
    $default_hash = password_hash('password', PASSWORD_BCRYPT);
    file_put_contents($admin_config_file, json_encode(['admin_password_hash' => $default_hash]));
}
$admin_config = json_decode(file_get_contents($admin_config_file), true);
$admin_password_hash = $admin_config['admin_password_hash'] ?? '';

// حماية CSRF
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// تسجيل الخروج
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: dashboard.php");
    exit();
}

// ========== شاشة تسجيل الدخول (التصميم القديم) ==========
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    $error = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $password = $_POST['password'] ?? '';
        if (password_verify($password, $admin_password_hash)) {
            $_SESSION['admin_logged_in'] = true;
            header("Location: dashboard.php");
            exit();
        } else {
            $error = 'كلمة المرور غير صحيحة';
        }
    }
    ?>
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>دخول المدير | مختبرات العلوم التقنية</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body {
                font-family: 'Cairo', sans-serif;
                background: linear-gradient(135deg, #002d3d 0%, #004e66 50%, #006b8a 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .login-card {
                background: #ffffff;
                border-radius: 24px;
                padding: 40px 36px;
                width: 100%;
                max-width: 460px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.25);
                position: relative;
                overflow: hidden;
                animation: fadeInUp 0.5s ease-out;
            }
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .login-card::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 4px;
                background: linear-gradient(90deg, #004e66, #00a8d4, #2ec4e8);
            }
            .card-logo-wrap { text-align: center; margin-bottom: 24px; }
            .card-logo-wrap img { height: 72px; width: 72px; object-fit: contain; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,78,102,0.2); }
            .card-title { text-align: center; font-size: 1.5rem; font-weight: 800; color: #002d3d; margin-bottom: 4px; }
            .card-sub { text-align: center; font-size: 0.85rem; color: #94a3b8; margin-bottom: 28px; }
            .error-box {
                display: flex;
                align-items: center;
                gap: 10px;
                background: #fef2f2;
                border: 1px solid #fca5a5;
                border-radius: 12px;
                padding: 12px 16px;
                margin-bottom: 20px;
                color: #dc2626;
                font-size: 0.82rem;
            }
            .field { margin-bottom: 20px; }
            .field-label { display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 8px; }
            .input-wrap { position: relative; }
            .input-wrap .ico {
                position: absolute;
                right: 14px;
                top: 50%;
                transform: translateY(-50%);
                color: #0089ae;
                font-size: 1rem;
            }
            .code-input {
                width: 100%;
                padding: 14px 42px 14px 16px;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                font-family: 'Cairo', sans-serif;
                font-size: 1rem;
                font-weight: 600;
                color: #1e293b;
                direction: ltr;
                text-align: right;
                transition: all 0.25s;
                background: #f8fafc;
            }
            .code-input:focus {
                outline: none;
                border-color: #0089ae;
                background: #ffffff;
                box-shadow: 0 0 0 3px rgba(0,137,174,0.12);
            }
            .btn-enter {
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #004e66, #0089ae);
                border: none;
                border-radius: 12px;
                color: white;
                font-family: 'Cairo', sans-serif;
                font-size: 1rem;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                transition: all 0.3s ease;
                box-shadow: 0 6px 20px rgba(0,78,102,0.3);
            }
            .btn-enter:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,78,102,0.4); }
            .card-footer {
                margin-top: 24px;
                padding-top: 16px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-around;
            }
            .cfbadge { display: flex; align-items: center; gap: 5px; font-size: 0.7rem; color: #94a3b8; }
        </style>
    </head>
    <body>
        <div class="login-card">
            <div class="card-logo-wrap"><img src="logo2.png" alt="logo"></div>
            <div class="card-title">دخول المدير</div>
            <div class="card-sub">أدخل كلمة المرور للوصول إلى لوحة التحكم</div>
            <?php if ($error): ?>
                <div class="error-box"><i class="fas fa-circle-xmark"></i><span><?php echo htmlspecialchars($error); ?></span></div>
            <?php endif; ?>
            <form method="POST">
                <div class="field">
                    <label class="field-label">كلمة المرور</label>
                    <div class="input-wrap">
                        <span class="ico"><i class="fas fa-lock"></i></span>
                        <input type="password" name="password" class="code-input" placeholder="••••••••" required autofocus>
                    </div>
                </div>
                <button type="submit" class="btn-enter"><i class="fas fa-sign-in-alt"></i> دخول</button>
            </form>
            <div class="card-footer"><div class="cfbadge"><i class="fas fa-shield-alt"></i> بيئة آمنة</div><div class="cfbadge"><i class="fas fa-lock"></i> مشفرة SSL</div></div>
        </div>
    </body>
    </html>
    <?php
    exit();
}

// ========== معالجة الإجراءات بعد الدخول ==========
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_POST['change_password'])) {
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        die("خطأ في التحقق من الأمان (CSRF).");
    }
}

// ---------- تغيير كلمة المرور ----------
if (isset($_POST['change_password'])) {
    $old_password = $_POST['old_password'] ?? '';
    $new_password = $_POST['new_password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';

    if (!password_verify($old_password, $admin_password_hash)) {
        $_SESSION['toast'] = ['type' => 'error', 'message' => '❌ كلمة المرور القديمة غير صحيحة.'];
    } elseif (strlen($new_password) < 6) {
        $_SESSION['toast'] = ['type' => 'error', 'message' => '❌ يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل.'];
    } elseif ($new_password !== $confirm_password) {
        $_SESSION['toast'] = ['type' => 'error', 'message' => '❌ كلمة المرور الجديدة غير متطابقة.'];
    } else {
        $new_hash = password_hash($new_password, PASSWORD_BCRYPT);
        $admin_config['admin_password_hash'] = $new_hash;
        file_put_contents($admin_config_file, json_encode($admin_config, JSON_UNESCAPED_UNICODE));
        $_SESSION['toast'] = ['type' => 'success', 'message' => '✅ تم تغيير كلمة المرور بنجاح.'];
    }
    header("Location: dashboard.php");
    exit();
}

// ---------- إنشاء الأكواد (فردي وجماعي) ----------
if (isset($_POST['create_code'])) {
    $gen_mode = $_POST['gen_mode'] ?? 'package'; // 'package' أو 'experiment'
    $exp_id = (int)($_POST['exp_id'] ?? 0);
    $package_id = (int)($_POST['package_id'] ?? 0);
    $expiry_days = isset($_POST['expiry_days']) && is_numeric($_POST['expiry_days']) ? (int)$_POST['expiry_days'] : 0;
    $code_count = max(1, min(1000, (int)($_POST['code_count'] ?? 1)));
    $custom_code = !empty($_POST['new_code']) ? strtoupper(trim($_POST['new_code'])) : '';

    $codes_created = [];
    $errors = [];

    for ($i = 0; $i < $code_count; $i++) {
        if ($i === 0 && $custom_code !== '') {
            $new_code = $custom_code;
            $check_stmt = $conn->prepare("SELECT id FROM access_codes WHERE code = ?");
            $check_stmt->bind_param("s", $new_code);
            $check_stmt->execute();
            $check_stmt->store_result();
            if ($check_stmt->num_rows > 0) {
                $errors[] = "الكود المخصص {$new_code} موجود مسبقاً.";
                $check_stmt->close();
                continue;
            }
            $check_stmt->close();
        } else {
            $attempts = 0;
            do {
                $new_code = 'SCI-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
                $check_stmt = $conn->prepare("SELECT id FROM access_codes WHERE code = ?");
                $check_stmt->bind_param("s", $new_code);
                $check_stmt->execute();
                $check_stmt->store_result();
                $exists = $check_stmt->num_rows > 0;
                $check_stmt->close();
                $attempts++;
                if ($attempts > 10) {
                    $errors[] = "تعذر إنشاء كود فريد بعد 10 محاولات. توقف عند الكود رقم " . ($i + 1);
                    break 2;
                }
            } while ($exists);
        }

        if ($gen_mode === 'package' && $package_id > 0) {
            // كود باقة: بيفتح كل التجارب، ومدته بتتحدد تلقائيًا وقت أول تفعيل من المعلم
            $stmt = $conn->prepare("INSERT INTO access_codes (code, package_id, is_active) VALUES (?, ?, 1)");
            $stmt->bind_param("si", $new_code, $package_id);
        } elseif ($expiry_days > 0) {
            $expiry_date = date('Y-m-d H:i:s', strtotime("+{$expiry_days} days"));
            $stmt = $conn->prepare("INSERT INTO access_codes (code, experiment_id, is_active, expiry_date) VALUES (?, ?, 1, ?)");
            $stmt->bind_param("sis", $new_code, $exp_id, $expiry_date);
        } else {
            $stmt = $conn->prepare("INSERT INTO access_codes (code, experiment_id, is_active, expiry_date) VALUES (?, ?, 1, NULL)");
            $stmt->bind_param("si", $new_code, $exp_id);
        }

        if ($stmt->execute()) {
            $codes_created[] = $new_code;
        } else {
            $errors[] = "فشل إدخال الكود {$new_code}: " . $stmt->error;
        }
        $stmt->close();
    }

    $toast_type = 'success';
    $toast_msg = '';
    if (!empty($codes_created)) {
        $toast_msg = ' تم إنشاء ' . count($codes_created) . ' كود بنجاح: ' . implode(', ', array_slice($codes_created, 0, 10)) . (count($codes_created) > 10 ? ' ...' : '');
    }
    if (!empty($errors)) {
        $toast_type = 'error';
        $toast_msg .= (empty($toast_msg) ? '' : '<br>') . '⚠️ أخطاء: ' . implode('<br>', $errors);
    }
    if (empty($codes_created) && empty($errors)) {
        $toast_msg = '⚠️ لم يتم إنشاء أي كود.';
        $toast_type = 'error';
    }

    $_SESSION['toast'] = ['type' => $toast_type, 'message' => $toast_msg];
    header("Location: dashboard.php");
    exit();
}

// ---------- الإجراءات الفردية (تعطيل / تفعيل / حذف) ----------
if (isset($_GET['deactivate']) && isset($_GET['csrf']) && $_GET['csrf'] === $_SESSION['csrf_token']) {
    $id = (int)$_GET['deactivate'];
    $stmt = $conn->prepare("UPDATE access_codes SET is_active = 0 WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    $_SESSION['toast'] = ['type' => 'info', 'message' => "⚠️ تم تعطيل الكود بنجاح"];
    header("Location: dashboard.php");
    exit();
}

if (isset($_GET['activate']) && isset($_GET['csrf']) && $_GET['csrf'] === $_SESSION['csrf_token']) {
    $id = (int)$_GET['activate'];
    $stmt = $conn->prepare("UPDATE access_codes SET is_active = 1, expiry_date = NULL WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    $_SESSION['toast'] = ['type' => 'success', 'message' => " تم تفعيل الكود بنجاح"];
    header("Location: dashboard.php");
    exit();
}

if (isset($_GET['delete']) && isset($_GET['csrf']) && $_GET['csrf'] === $_SESSION['csrf_token']) {
    $id = (int)$_GET['delete'];
    $stmt = $conn->prepare("DELETE FROM access_codes WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    $_SESSION['toast'] = ['type' => 'error', 'message' => " تم حذف الكود نهائياً"];
    header("Location: dashboard.php");
    exit();
}

// ---------- تحديث مدة باقة ----------
if (isset($_POST['update_package'])) {
    $package_id = (int)$_POST['package_id'];
    $duration = (int)$_POST['duration_months'];
    if ($duration > 0) {
        $stmt = $conn->prepare("UPDATE packages SET duration_months = ? WHERE id = ?");
        $stmt->bind_param("ii", $duration, $package_id);
        $stmt->execute();
        $stmt->close();
        $_SESSION['toast'] = ['type' => 'success', 'message' => ' تم تحديث مدة الباقة بنجاح.'];
    } else {
        $_SESSION['toast'] = ['type' => 'error', 'message' => ' المدة يجب أن تكون رقم أكبر من صفر.'];
    }
    header("Location: dashboard.php");
    exit();
}

// ---------- تعطيل / تفعيل تجربة ----------
if (isset($_GET['toggle_experiment']) && isset($_GET['csrf']) && $_GET['csrf'] === $_SESSION['csrf_token']) {
    $exp_id = (int)$_GET['toggle_experiment'];
    $stmt = $conn->prepare("UPDATE experiments SET is_active = NOT is_active WHERE id = ?");
    $stmt->bind_param("i", $exp_id);
    $stmt->execute();
    $stmt->close();
    $_SESSION['toast'] = ['type' => 'info', 'message' => ' تم تحديث حالة التجربة.'];
    header("Location: dashboard.php");
    exit();
}

// ---------- إضافة باقة جديدة ----------
if (isset($_POST['add_package'])) {
    $name = trim($_POST['package_name'] ?? '');
    $duration = (int)($_POST['new_duration_months'] ?? 0);

    if ($name === '' || $duration <= 0) {
        $_SESSION['toast'] = ['type' => 'error', 'message' => ' اسم الباقة والمدة مطلوبين، والمدة لازم تكون رقم أكبر من صفر.'];
    } else {
        // توليد package_key فريد تلقائيًا من الاسم
        $base_key = preg_replace('/[^a-z0-9_]/', '_', strtolower($name));
        if ($base_key === '' || is_numeric($base_key[0])) {
            $base_key = 'pkg_' . $base_key;
        }
        $package_key = $base_key;
        $suffix = 1;
        while (true) {
            $check = $conn->prepare("SELECT id FROM packages WHERE package_key = ?");
            $check->bind_param("s", $package_key);
            $check->execute();
            $check->store_result();
            $exists = $check->num_rows > 0;
            $check->close();
            if (!$exists) break;
            $suffix++;
            $package_key = $base_key . '_' . $suffix;
        }

        $stmt = $conn->prepare("INSERT INTO packages (package_key, name, duration_months, is_active) VALUES (?, ?, ?, 1)");
        $stmt->bind_param("ssi", $package_key, $name, $duration);
        if ($stmt->execute()) {
            $_SESSION['toast'] = ['type' => 'success', 'message' => ' تم إضافة باقة "' . $name . '" بنجاح.'];
        } else {
            $_SESSION['toast'] = ['type' => 'error', 'message' => ' فشل إضافة الباقة: ' . $stmt->error];
        }
        $stmt->close();
    }
    header("Location: dashboard.php");
    exit();
}

// ---------- تحديث رابط المتجر لباقة ----------
if (isset($_POST['update_store_url'])) {
    $package_id = (int)$_POST['package_id'];
    $store_url = trim($_POST['store_url'] ?? '');
    $stmt = $conn->prepare("UPDATE packages SET store_url = ? WHERE id = ?");
    $stmt->bind_param("si", $store_url, $package_id);
    $stmt->execute();
    $stmt->close();
    $_SESSION['toast'] = ['type' => 'success', 'message' => ' تم تحديث رابط المتجر.'];
    header("Location: dashboard.php");
    exit();
}

// ---------- تعطيل / تفعيل باقة (إخفاؤها من قائمة توليد الأكواد) ----------
if (isset($_GET['toggle_package']) && isset($_GET['csrf']) && $_GET['csrf'] === $_SESSION['csrf_token']) {
    $pkg_id = (int)$_GET['toggle_package'];
    $stmt = $conn->prepare("UPDATE packages SET is_active = NOT is_active WHERE id = ?");
    $stmt->bind_param("i", $pkg_id);
    $stmt->execute();
    $stmt->close();
    $_SESSION['toast'] = ['type' => 'info', 'message' => ' تم تحديث حالة الباقة.'];
    header("Location: dashboard.php");
    exit();
}

// ========== جلب البيانات (زوار حقيقيون) ==========
$stats = [];
$stats['experiments'] = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(id) as total FROM experiments"))['total'];
$stats['active_codes'] = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(id) as total FROM access_codes WHERE is_active = 1 AND (expiry_date IS NULL OR expiry_date > NOW())"))['total'];
$stats['total_visitors'] = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(id) as total FROM visitors"))['total'];
$stats['total_codes'] = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(id) as total FROM access_codes"))['total'];

// ---------- إحصائيات الباقات ----------
$packages_stats = [];
$pkg_res = mysqli_query($conn, "SELECT * FROM packages ORDER BY duration_months ASC");
while ($pkg = mysqli_fetch_assoc($pkg_res)) {
    $pid = (int)$pkg['id'];
    $pkg['total_codes'] = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(id) as c FROM access_codes WHERE package_id = $pid"))['c'];
    $pkg['activated_codes'] = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(id) as c FROM access_codes WHERE package_id = $pid AND activated_by IS NOT NULL"))['c'];
    $pkg['available_codes'] = $pkg['total_codes'] - $pkg['activated_codes'];
    $packages_stats[] = $pkg;
}

// ---------- قائمة التجارب لإدارة التعطيل/التفعيل ----------
$experiments_list = mysqli_query($conn, "SELECT id, title, is_active FROM experiments ORDER BY id ASC");

// آخر 7 أيام: الزوار الحقيقيون يومياً
$chartData = [];
for ($i = 6; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $res = mysqli_query($conn, "SELECT COUNT(id) as cnt FROM visitors WHERE DATE(first_visit) = '$date'");
    $row = mysqli_fetch_assoc($res);
    $chartData['labels'][] = date('d/m', strtotime($date));
    $chartData['values'][] = $row['cnt'];
}

// ---------- الأكواد مع Pagination ----------
$codes_page = isset($_GET['codes_page']) ? max(1, (int)$_GET['codes_page']) : 1;
$codes_per_page = 20;
$codes_total = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(id) as total FROM access_codes"))['total'];
$codes_total_pages = ceil($codes_total / $codes_per_page);
$codes_offset = ($codes_page - 1) * $codes_per_page;

$codes_stmt = $conn->prepare(
    "SELECT ac.id, ac.code, ac.is_active, ac.expiry_date, ac.activated_by, ac.activated_at,
            ac.package_id, ac.expires_at, e.title AS experiment_title, p.name AS package_name
     FROM access_codes ac 
     LEFT JOIN experiments e ON ac.experiment_id = e.id 
     LEFT JOIN packages p ON ac.package_id = p.id
     ORDER BY ac.id DESC LIMIT ? OFFSET ?"
);
$codes_stmt->bind_param("ii", $codes_per_page, $codes_offset);
$codes_stmt->execute();
$codes_result = $codes_stmt->get_result();

// ---------- سجل الدخول ----------
$logs_page = isset($_GET['logs_page']) ? max(1, (int)$_GET['logs_page']) : 1;
$logs_per_page = 20;
$logs_offset = ($logs_page - 1) * $logs_per_page;
$logs_total = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(id) as total FROM access_logs"))['total'];
$logs_total_pages = ceil($logs_total / $logs_per_page);

$logs_stmt = $conn->prepare(
    "SELECT code, status, ip_address, access_time 
     FROM access_logs 
     ORDER BY access_time DESC LIMIT ? OFFSET ?"
);
$logs_stmt->bind_param("ii", $logs_per_page, $logs_offset);
$logs_stmt->execute();
$logs_result = $logs_stmt->get_result();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة التحكم | مختبرات العلوم التقنية</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        :root {
            --teal-900: #002d3d; --teal-800: #004e66; --teal-700: #006b8a; --teal-600: #0089ae;
            --teal-500: #00a8d4; --teal-400: #2ec4e8; --teal-100: #e6f7fc; --white: #ffffff;
            --gray-50: #f8fafc; --gray-100: #f1f5f9; --gray-200: #e2e8f0; --gray-400: #94a3b8;
            --gray-600: #475569; --gray-800: #1e293b; --error: #dc2626; --success: #10b981;
            --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Cairo', sans-serif; background: var(--gray-50);
            color: var(--gray-800); min-height: 100vh;
        }
        .toast-container {
            position: fixed; top: 20px; left: 20px; z-index: 9999;
            display: flex; flex-direction: column; gap: 12px;
        }
        .toast {
            background: white; border-radius: 12px; padding: 14px 20px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); display: flex;
            align-items: center; gap: 12px; min-width: 280px;
            animation: slideInRight 0.3s ease; border-right: 4px solid;
        }
        .toast.success { border-right-color: var(--success); }
        .toast.error { border-right-color: var(--error); }
        .toast.info { border-right-color: var(--teal-600); }
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .site-header {
            background: var(--white); border-bottom: 3px solid var(--teal-800);
            padding: 0 40px; height: 70px; display: flex; align-items: center;
            justify-content: space-between; position: sticky; top: 0; z-index: 100;
            box-shadow: 0 2px 12px rgba(0,78,102,0.08);
        }
        .header-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .header-logo img { height: 48px; width: 48px; object-fit: contain; border-radius: 10px; }
        .header-brand-name { font-size: 1rem; font-weight: 800; color: var(--teal-800); line-height: 1.2; }
        .header-brand-sub { font-size: 0.7rem; color: var(--gray-400); }
        .header-badge {
            background: var(--teal-100); border: 1px solid var(--teal-300); color: var(--teal-800);
            padding: 6px 14px; border-radius: 100px; font-size: 0.75rem; font-weight: 700;
        }
        .btn-logout {
            background: rgba(220,38,38,0.08); color: var(--error); padding: 8px 24px;
            border-radius: 40px; text-decoration: none; font-weight: 700;
            transition: var(--transition); display: flex; align-items: center; gap: 8px;
        }
        .btn-logout:hover { background: rgba(220,38,38,0.15); transform: translateY(-2px); }
        .admin-hero {
            background: linear-gradient(135deg, var(--teal-900) 0%, var(--teal-800) 50%, var(--teal-700) 100%);
            padding: 48px 40px; position: relative; overflow: hidden; margin-bottom: 40px;
        }
        .hero-content { max-width: 1200px; margin: 0 auto; text-align: center; position: relative; z-index: 2; }
        .hero-content h1 { font-size: 2rem; font-weight: 900; color: white; margin-bottom: 12px; }
        .hero-content p { color: rgba(255,255,255,0.7); font-size: 1rem; }
        .container { max-width: 1400px; margin: 0 auto 48px; padding: 0 28px; }
        .stats-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 24px; margin-bottom: 40px;
        }
        .stat-card {
            background: var(--white); border-radius: 20px; padding: 24px 20px;
            display: flex; align-items: center; gap: 18px; border: 1px solid var(--gray-200);
            transition: var(--transition); box-shadow: 0 4px 12px rgba(0,0,0,0.02); cursor: pointer;
        }
        .stat-card:hover {
            transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,78,102,0.1);
            border-color: var(--teal-300);
        }
        .stat-icon {
            width: 60px; height: 60px; background: var(--teal-100); border-radius: 18px;
            display: flex; align-items: center; justify-content: center; font-size: 1.6rem;
            color: var(--teal-700);
        }
        .stat-info h3 { font-size: 1.8rem; font-weight: 800; color: var(--teal-800); line-height: 1.2; }
        .stat-info p { color: var(--gray-600); font-size: 0.8rem; font-weight: 600; }
        .chart-card {
            background: var(--white); border-radius: 20px; padding: 24px;
            margin-bottom: 40px; border: 1px solid var(--gray-200);
        }
        .form-card {
            background: var(--white); border-radius: 24px; padding: 28px;
            border: 1px solid var(--gray-200); margin-bottom: 36px;
        }
        .form-row { display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-end; }
        .form-group { flex: 1; min-width: 180px; }
        .form-group label { display: block; font-size: 0.75rem; font-weight: 700; color: var(--gray-600); margin-bottom: 6px; }
        .form-group input, .form-group select {
            width: 100%; padding: 10px 16px; border-radius: 40px;
            border: 1px solid var(--gray-200); font-family: 'Cairo', sans-serif;
            transition: var(--transition);
        }
        .form-group input:focus, .form-group select:focus {
            outline: none; border-color: var(--teal-500);
            box-shadow: 0 0 0 3px rgba(0,137,174,0.1);
        }
        .btn-primary {
            background: linear-gradient(135deg, var(--teal-700), var(--teal-600));
            border: none; padding: 10px 28px; border-radius: 40px; color: white;
            font-weight: 800; cursor: pointer; transition: var(--transition);
            display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover {
            transform: translateY(-2px); filter: brightness(1.02);
            box-shadow: 0 4px 12px rgba(0,137,174,0.2);
        }
        .btn-danger {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            border: none; padding: 10px 28px; border-radius: 40px; color: white;
            font-weight: 800; cursor: pointer; transition: var(--transition);
            display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-danger:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .section-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
        }
        .section-header h2 {
            font-size: 1.3rem; font-weight: 800; color: var(--teal-800);
            display: flex; align-items: center; gap: 8px;
        }
        table {
            width: 100%; background: var(--white); border-radius: 20px;
            overflow: hidden; border-collapse: collapse; margin-bottom: 36px;
        }
        th, td { padding: 16px 12px; text-align: center; border-bottom: 1px solid var(--gray-200); }
        th { background: var(--gray-50); color: var(--teal-800); font-weight: 800; font-size: 0.85rem; }
        .badge-active, .badge-inactive {
            padding: 4px 14px; border-radius: 40px; font-size: 0.7rem;
            font-weight: 700; display: inline-block;
        }
        .badge-active { background: #ecfdf5; color: #059669; }
        .badge-inactive { background: #fef2f2; color: #dc2626; }
        .action-links a {
            margin: 0 4px; text-decoration: none; padding: 6px 12px;
            border-radius: 30px; font-size: 0.7rem; font-weight: 700;
            transition: var(--transition);
        }
        .pagination { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }
        .pagination a {
            padding: 8px 14px; background: white; border: 1px solid var(--gray-200);
            border-radius: 30px; text-decoration: none; color: var(--teal-800);
            font-weight: 600; transition: var(--transition);
        }
        .pagination a.active { background: var(--teal-800); color: white; border-color: var(--teal-800); }
        .search-box { margin-bottom: 20px; display: flex; gap: 12px; align-items: center; }
        .search-box input {
            flex: 1; padding: 10px 16px; border-radius: 40px;
            border: 1px solid var(--gray-200); font-family: 'Cairo', sans-serif;
        }
        /* Modal */
        .modal-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.4); z-index: 200;
            display: flex; align-items: center; justify-content: center;
        }
        .modal-box {
            background: white; border-radius: 24px; padding: 28px;
            max-width: 440px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        @media (max-width: 900px) {
            .site-header { padding: 0 20px; }
            .container { padding: 0 20px; }
            th, td { padding: 10px 6px; font-size: 0.7rem; }
            .admin-hero { padding: 32px 20px; }
        }
        @media (max-width: 700px) {
            .stat-card { padding: 16px; }
            .stat-icon { width: 48px; height: 48px; font-size: 1.2rem; }
            .stat-info h3 { font-size: 1.3rem; }
        }
        body.dark {
            --gray-50: #0f172a; --gray-100: #1e293b; --gray-200: #334155;
            --white: #1e293b; --gray-800: #f1f5f9;
        }
        .theme-toggle {
            background: none; border: none; font-size: 1.2rem;
            cursor: pointer; margin-left: 15px; color: var(--gray-800);
        }
        .info-tip {
            font-size: 0.7rem; color: var(--teal-600); margin-right: 5px;
            cursor: help; border-bottom: 1px dashed currentColor;
        }
    </style>
</head>
<body>
    <header class="site-header">
        <a href="#" class="header-logo">
            <img src="logo2.png" alt="العلوم والتقنية للجميع">
            <div class="header-brand">
                <div class="header-brand-name">مختبرات العلوم والتقنية للجميع</div>
                <div class="header-brand-sub">لوحة التحكم</div>
            </div>
        </a>
        <div style="display: flex; align-items: center; gap: 12px;">
            <button class="theme-toggle" id="themeToggle"><i class="fas fa-moon"></i></button>
            <div class="header-badge"><span style="width:7px;height:7px;background:#10b981;border-radius:50%;display:inline-block;"></span> مدير النظام</div>
            <a href="?logout=1" class="btn-logout"><i class="fas fa-sign-out-alt"></i> خروج</a>
        </div>
    </header>
    <div class="admin-hero">
        <div class="hero-content">
            <h1>لوحة تحكم المدير</h1>
            <p>إدارة الأكواد، متابعة النشاطات، وإحصائيات المنصة</p>
            <button class="btn-primary" style="margin-top:16px;" onclick="openPasswordModal()"><i class="fas fa-key"></i> تغيير كلمة المرور</button>
        </div>
    </div>
    <div class="container">
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon"><i class="fas fa-flask"></i></div><div class="stat-info"><h3><?=$stats['experiments']?></h3><p>تجارب تفاعلية</p></div></div>
            <div class="stat-card"><div class="stat-icon"><i class="fas fa-key"></i></div><div class="stat-info"><h3><?=$stats['active_codes']?></h3><p>كود نشط</p></div></div>
            <div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><h3><?=$stats['total_visitors']?> <span class="info-tip" title="عدد الزوار الحقيقيين المسجلين"><i class="fas fa-info-circle"></i></span></h3><p>زائر حقيقي</p></div></div>
            <div class="stat-card"><div class="stat-icon"><i class="fas fa-tag"></i></div><div class="stat-info"><h3><?=$stats['total_codes']?></h3><p>إجمالي الأكواد</p></div></div>
        </div>
        <div class="chart-card">
            <h3 style="margin-bottom:16px;"><i class="fas fa-chart-line"></i> عدد الزوار الحقيقيين (آخر 7 أيام)</h3>
            <canvas id="statsChart" width="400" height="180" style="max-height: 250px;"></canvas>
        </div>
        <div class="form-card">
            <h3 style="margin-bottom:20px;"><i class="fas fa-plus-circle" style="color:var(--teal-600);"></i> إنشاء أكواد وصول جديدة</h3>
            <form method="POST" onsubmit="return handleBulkCreate()">
                <input type="hidden" name="csrf_token" value="<?=$_SESSION['csrf_token']?>">
                <div class="form-row">
                    <div class="form-group"><label>الكود (اختياري)</label><input type="text" name="new_code" placeholder="اتركه للتوليد التلقائي"></div>
                    <div class="form-group">
                        <label>نوع الكود</label>
                        <select name="gen_mode" id="genMode" onchange="toggleGenMode()">
                            <option value="package">باقة اشتراك (النظام الجديد)</option>
                            <option value="experiment">تجربة واحدة (النظام القديم)</option>
                        </select>
                    </div>
                    <div class="form-group" id="packageField">
                        <label>الباقة</label>
                        <select name="package_id"><?php $pkgs = mysqli_query($conn, "SELECT id, name, duration_months FROM packages WHERE is_active = 1"); while($p=mysqli_fetch_assoc($pkgs)) echo "<option value='{$p['id']}'>{$p['name']} ({$p['duration_months']} شهر)</option>"; ?></select>
                    </div>
                    <div class="form-group" id="experimentField" style="display:none;">
                        <label>التجربة</label>
                        <select name="exp_id"><?php $exps = mysqli_query($conn, "SELECT id, title FROM experiments"); while($e=mysqli_fetch_assoc($exps)) echo "<option value='{$e['id']}'>{$e['title']}</option>"; ?></select>
                    </div>
                    <div class="form-group" id="expiryDaysField" style="display:none;"><label>صلاحية (أيام)</label><input type="number" name="expiry_days" placeholder="دائم"></div>
                    <div class="form-group"><label>عدد الأكواد</label><input type="number" name="code_count" id="codeCount" value="1" min="1" max="1000" required></div>
                    <div class="form-group"><button type="submit" name="create_code" class="btn-primary" id="createBtn"><i class="fas fa-key"></i> إنشاء</button></div>
                </div>
                <small style="color:var(--gray-600);">إذا كان العدد > 1 يتم تجاهل الكود المخصص وتوليد أكواد عشوائية فريدة.</small>
            </form>
        </div>

        <div class="section-header">
            <h2><i class="fas fa-layer-group"></i> إدارة الباقات</h2>
        </div>
        <div class="form-card">
            <h3 style="margin-bottom:20px;"><i class="fas fa-plus-circle" style="color:var(--teal-600);"></i> إضافة باقة جديدة</h3>
            <form method="POST">
                <input type="hidden" name="csrf_token" value="<?=$_SESSION['csrf_token']?>">
                <div class="form-row">
                    <div class="form-group"><label>اسم الباقة</label><input type="text" name="package_name" placeholder="مثال: معلم بلاتيني" required></div>
                    <div class="form-group"><label>المدة (شهور)</label><input type="number" name="new_duration_months" min="1" placeholder="مثال: 6" required></div>
                    <div class="form-group"><button type="submit" name="add_package" class="btn-primary"><i class="fas fa-plus"></i> إضافة الباقة</button></div>
                </div>
            </form>
        </div>
        <div style="overflow-x: auto;">
            <table>
                <thead><tr><th>الباقة</th><th>المدة الحالية</th><th>إجمالي الأكواد</th><th>مُفعّل</th><th>متاح (لم يُفعّل)</th><th>تعديل المدة</th><th>رابط المتجر (سلة)</th><th>الحالة</th></tr></thead>
                <tbody>
                    <?php foreach ($packages_stats as $pkg): $pkg_csrf = urlencode($_SESSION['csrf_token']); ?>
                    <tr>
                        <td><i class="fas fa-tag" style="color:var(--teal-600); margin-left:6px;"></i><?=htmlspecialchars($pkg['name'])?></td>
                        <td><?=$pkg['duration_months']?> شهر</td>
                        <td><?=$pkg['total_codes']?></td>
                        <td><?=$pkg['activated_codes']?></td>
                        <td><?=$pkg['available_codes']?></td>
                        <td>
                            <form method="POST" style="display:flex; gap:8px; align-items:center; justify-content:center;">
                                <input type="hidden" name="csrf_token" value="<?=$_SESSION['csrf_token']?>">
                                <input type="hidden" name="package_id" value="<?=$pkg['id']?>">
                                <input type="number" name="duration_months" value="<?=$pkg['duration_months']?>" min="1" style="width:70px; padding:6px 10px; border-radius:30px; border:1px solid var(--gray-200); text-align:center;">
                                <button type="submit" name="update_package" class="btn-primary" style="padding:6px 18px;">حفظ</button>
                            </form>
                        </td>
                        <td>
                            <form method="POST" style="display:flex; gap:8px; align-items:center; justify-content:center;">
                                <input type="hidden" name="csrf_token" value="<?=$_SESSION['csrf_token']?>">
                                <input type="hidden" name="package_id" value="<?=$pkg['id']?>">
                                <input type="text" name="store_url" value="<?=htmlspecialchars($pkg['store_url'] ?? '')?>" placeholder="لصق رابط سلة هنا" style="width:150px; padding:6px 10px; border-radius:30px; border:1px solid var(--gray-200); direction:ltr; font-size:0.75rem;">
                                <button type="submit" name="update_store_url" class="btn-primary" style="padding:6px 14px;">حفظ</button>
                            </form>
                        </td>
                        <td class="action-links">
                            <?php if ($pkg['is_active']): ?>
                                <span class="badge-active">متاحة</span>
                                <a href="?toggle_package=<?=$pkg['id']?>&csrf=<?=$pkg_csrf?>" class="btn-primary" style="background:#ef4444;">إخفاء</a>
                            <?php else: ?>
                                <span class="badge-inactive">مخفية</span>
                                <a href="?toggle_package=<?=$pkg['id']?>&csrf=<?=$pkg_csrf?>" class="btn-primary" style="background:#10b981;">إظهار</a>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>


        <div class="section-header">
            <h2><i class="fas fa-flask"></i> إدارة التجارب</h2>
        </div>
        <div style="overflow-x: auto;">
            <table>
                <thead><tr><th>#</th><th>التجربة</th><th>الحالة</th><th>الإجراء</th></tr></thead>
                <tbody>
                    <?php while ($exp = mysqli_fetch_assoc($experiments_list)): $exp_csrf = urlencode($_SESSION['csrf_token']); ?>
                    <tr>
                        <td><?=$exp['id']?></td>
                        <td><?=htmlspecialchars($exp['title'])?></td>
                        <td><span class="<?=$exp['is_active'] ? 'badge-active' : 'badge-inactive'?>"><?=$exp['is_active'] ? 'نشطة' : 'متوقفة'?></span></td>
                        <td class="action-links">
                            <?php if ($exp['is_active']): ?>
                                <a href="?toggle_experiment=<?=$exp['id']?>&csrf=<?=$exp_csrf?>" class="btn-primary" style="background:#ef4444;">إيقاف مؤقت</a>
                            <?php else: ?>
                                <a href="?toggle_experiment=<?=$exp['id']?>&csrf=<?=$exp_csrf?>" class="btn-primary" style="background:#10b981;">إعادة تشغيل</a>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        </div>

        <div class="section-header">
            <h2><i class="fas fa-list-ul"></i> إدارة رموز الوصول</h2>
            <button class="btn-primary" onclick="location.reload()"><i class="fas fa-sync-alt"></i> تحديث</button>
        </div>
        <div class="search-box"><input type="text" id="codeSearch" placeholder="🔍 بحث في الأكواد..." onkeyup="filterCodes()"></div>
        <div style="overflow-x: auto;" id="codesTableContainer">
            <table id="codesTable">
                <thead><tr><th>#</th><th>الكود</th><th>التجربة</th><th>الحالة</th><th>الصلاحية</th><th>الإجراءات</th></tr></thead>
                <tbody>
                    <?php while($c = $codes_result->fetch_assoc()): 
                        $active = $c['is_active'] == 1;
                        $is_package = !empty($c['package_id']);
                        if ($is_package) {
                            $expired = ($c['expires_at'] && strtotime($c['expires_at']) < time());
                            $expiry_display = $c['expires_at'] ? date('Y-m-d', strtotime($c['expires_at'])) : 'لم يُفعّل بعد';
                            $type_display = $c['package_name'] ?? 'باقة';
                        } else {
                            $expired = ($c['expiry_date'] && strtotime($c['expiry_date']) < time());
                            $expiry_display = $c['expiry_date'] ? date('Y-m-d', strtotime($c['expiry_date'])) : 'دائم';
                            $type_display = $c['experiment_title'] ?? '-';
                        }
                        $statusClass = $expired ? 'badge-inactive' : ($active ? 'badge-active' : 'badge-inactive');
                        $statusText = $expired ? 'منتهي' : ($active ? 'نشط' : 'معطل');
                        $csrf = urlencode($_SESSION['csrf_token']);
                    ?>
                    <tr>
                        <td><?=$c['id']?></td>
                        <td><code style="cursor:pointer;" onclick="copyToClipboard('<?=htmlspecialchars($c['code'])?>')" title="انسخ الكود"><?=htmlspecialchars($c['code'])?></code></td>
                        <td><?php if ($is_package): ?><i class="fas fa-tag" style="color:var(--teal-600); margin-left:6px;"></i><?php endif; ?><?=htmlspecialchars($type_display)?></td>
                        <td><span class="<?=$statusClass?>"><?=$statusText?></span></td>
                        <td><?=$expiry_display?></td>
                        <td class="action-links">
                            <?php if(!$expired): ?>
                                <?php if($active): ?>
                                    <a href="?deactivate=<?=$c['id']?>&csrf=<?=$csrf?>" class="btn-primary" style="background:#ef4444;">تعطيل</a>
                                <?php else: ?>
                                    <a href="?activate=<?=$c['id']?>&csrf=<?=$csrf?>" class="btn-primary" style="background:#10b981;">تفعيل</a>
                                <?php endif; ?>
                                <a href="#" onclick="confirmDelete('<?=$c['id']?>', '<?=$csrf?>')" class="btn-primary" style="background:#475569;">حذف</a>
                            <?php else: ?>
                                <span class="badge-inactive">منتهي</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        </div>
        <?php if ($codes_total_pages > 1): ?>
        <div class="pagination">
            <?php for ($i = 1; $i <= $codes_total_pages; $i++): ?>
                <a href="?codes_page=<?=$i?>" class="<?=($codes_page == $i) ? 'active' : ''?>"><?=$i?></a>
            <?php endfor; ?>
        </div>
        <?php endif; ?>
        <div class="section-header">
            <h2><i class="fas fa-history"></i> سجل النشاطات الأخيرة</h2>
            <button class="btn-primary" onclick="exportLogs()"><i class="fas fa-download"></i> تصدير CSV</button>
        </div>
        <div class="search-box"><input type="text" id="logSearch" placeholder="🔍 بحث في السجل..." onkeyup="filterLogs()"></div>
        <div style="overflow-x: auto;">
            <table id="logsTable">
                <thead><tr><th>الكود</th><th>الحالة</th><th>عنوان IP</th><th>التاريخ والوقت</th></tr></thead>
                <tbody>
                    <?php while($log = $logs_result->fetch_assoc()): ?>
                    <tr><td><?=htmlspecialchars($log['code'])?></td><td><span class="<?=$log['status']=='success'?'badge-active':'badge-inactive'?>"><?=$log['status']?></span></td><td><?=$log['ip_address']?></td><td><?=$log['access_time']?></td></tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        </div>
        <?php if ($logs_total_pages > 1): ?>
        <div class="pagination">
            <?php for ($i = 1; $i <= $logs_total_pages; $i++): ?>
                <a href="?logs_page=<?=$i?>" class="<?=($logs_page == $i) ? 'active' : ''?>"><?=$i?></a>
            <?php endfor; ?>
        </div>
        <?php endif; ?>
    </div>

    <!-- مودال تغيير كلمة المرور -->
    <div class="modal-overlay" id="passwordModal" style="display:none;">
        <div class="modal-box">
            <h3 style="color:var(--teal-800); margin-bottom:20px;">🔐 تغيير كلمة المرور</h3>
            <form method="POST">
                <input type="hidden" name="change_password" value="1">
                <div class="form-group" style="margin-bottom:12px;">
                    <label>كلمة المرور القديمة</label>
                    <input type="password" name="old_password" required>
                </div>
                <div class="form-group" style="margin-bottom:12px;">
                    <label>كلمة المرور الجديدة</label>
                    <input type="password" name="new_password" required minlength="6">
                </div>
                <div class="form-group" style="margin-bottom:20px;">
                    <label>تأكيد كلمة المرور الجديدة</label>
                    <input type="password" name="confirm_password" required>
                </div>
                <div style="display:flex; gap:12px; justify-content:center;">
                    <button type="submit" class="btn-primary">حفظ التغيير</button>
                    <button type="button" class="btn-danger" onclick="closePasswordModal()">إلغاء</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function toggleGenMode() {
            const mode = document.getElementById('genMode').value;
            document.getElementById('packageField').style.display = mode === 'package' ? '' : 'none';
            document.getElementById('experimentField').style.display = mode === 'experiment' ? '' : 'none';
            document.getElementById('expiryDaysField').style.display = mode === 'experiment' ? '' : 'none';
        }

        const ctx = document.getElementById('statsChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: <?=json_encode($chartData['labels'])?>,
                datasets: [{
                    label: 'زوار حقيقيون',
                    data: <?=json_encode($chartData['values'])?>,
                    borderColor: '#0089ae',
                    backgroundColor: 'rgba(0,137,174,0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } } }
        });

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => showToast('تم نسخ الكود: ' + text, 'success'));
        }

        function showToast(message, type) {
            const container = document.querySelector('.toast-container') || (() => { let d = document.createElement('div'); d.className = 'toast-container'; document.body.appendChild(d); return d; })();
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<i class="fas ${type==='success'?'fa-check-circle':type==='error'?'fa-exclamation-circle':'fa-info-circle'}"></i><span>${message}</span>`;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
        }

        function confirmDelete(id, csrf) {
            let modal = document.createElement('div');
            modal.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';
            modal.innerHTML = `
                <div style="background:white;border-radius:24px;padding:24px;max-width:400px;text-align:center;">
                    <i class="fas fa-trash-alt" style="font-size:48px;color:#dc2626;margin-bottom:16px;"></i>
                    <h3>تأكيد الحذف</h3>
                    <p>هل أنت متأكد من حذف هذا الكود نهائياً؟</p>
                    <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;">
                        <button class="btn-primary" style="background:#475569;" onclick="this.closest('div').parentElement.remove()">إلغاء</button>
                        <a href="?delete=${id}&csrf=${csrf}" class="btn-primary" style="background:#dc2626;">حذف</a>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        function handleBulkCreate() {
            const count = parseInt(document.getElementById('codeCount').value, 10);
            if (count > 5) {
                if (!confirm(`سيتم إنشاء ${count} كود. هل أنت متأكد؟`)) return false;
                let loader = document.createElement('div');
                loader.id = 'globalLoader';
                loader.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.2);backdrop-filter:blur(2px);z-index:10000;display:flex;align-items:center;justify-content:center;';
                loader.innerHTML = '<div style="width:50px;height:50px;border:5px solid var(--gray-200);border-top-color:var(--teal-600);border-radius:50%;animation:spin 1s linear infinite;"></div>';
                document.body.appendChild(loader);
                document.getElementById('createBtn').disabled = true;
            }
            return true;
        }

        function filterCodes() {
            let input = document.getElementById('codeSearch').value.toLowerCase();
            document.querySelectorAll('#codesTable tbody tr').forEach(row => row.style.display = row.innerText.toLowerCase().includes(input) ? '' : 'none');
        }
        function filterLogs() {
            let input = document.getElementById('logSearch').value.toLowerCase();
            document.querySelectorAll('#logsTable tbody tr').forEach(row => row.style.display = row.innerText.toLowerCase().includes(input) ? '' : 'none');
        }
        function exportLogs() {
            let csv = [];
            document.querySelectorAll('#logsTable tbody tr').forEach(row => {
                let rowData = Array.from(row.querySelectorAll('td')).map(cell => cell.innerText).join(',');
                csv.push(rowData);
            });
            let blob = new Blob(["\uFEFF" + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
            let link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'access_logs.csv';
            link.click();
        }

        const themeToggle = document.getElementById('themeToggle');
        if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
        });

        function openPasswordModal() { document.getElementById('passwordModal').style.display = 'flex'; }
        function closePasswordModal() { document.getElementById('passwordModal').style.display = 'none'; }

        <?php if(isset($_SESSION['toast'])): ?>
        showToast('<?=addslashes($_SESSION['toast']['message'])?>', '<?=$_SESSION['toast']['type']?>');
        <?php unset($_SESSION['toast']); endif; ?>
    </script>
</body>
</html>