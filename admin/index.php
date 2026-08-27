<?php
// admin/index.php - لوحة التحكم الرئيسية والملخص
require_once __DIR__ . '/auth.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $password = $_POST['password'] ?? '';
    if (password_verify($password, $admin_password_hash)) {
        $_SESSION['admin_logged_in'] = true;
        header("Location: index.php");
        exit();
    } else {
        $error = 'كلمة المرور غير صحيحة';
    }
}

// إذا لم يكن مسجلاً، عرض شاشة الدخول
if (empty($_SESSION['admin_logged_in'])) {
    ?>
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>دخول الأدمن | منصة التجارب العلمية</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Cairo', sans-serif; }
            body { background: linear-gradient(135deg, #002d3d 0%, #004e66 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
            .card { background: white; border-radius: 20px; padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 20px 40px rgba(0,0,0,0.25); text-align: center; }
            .title { font-size: 1.5rem; font-weight: 800; color: #002d3d; margin-bottom: 20px; }
            .input-group { margin-bottom: 20px; text-align: right; }
            .input-group label { font-size: 0.85rem; font-weight: 700; color: #475569; display: block; margin-bottom: 8px; }
            .input-group input { width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; outline: none; transition: 0.2s; }
            .input-group input:focus { border-color: #0089ae; }
            .btn { width: 100%; padding: 14px; background: #004e66; color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
            .btn:hover { background: #002d3d; }
            .error { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; padding: 10px; border-radius: 10px; font-size: 0.85rem; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="title"><i class="fas fa-user-lock"></i> لوحة التحكم الفائقة</div>
            <?php if ($error): ?><div class="error"><?=$error?></div><?php endif; ?>
            <form method="POST">
                <div class="input-group">
                    <label>كلمة المرور</label>
                    <input type="password" name="password" required placeholder="••••••••">
                </div>
                <button type="submit" name="login" class="btn"><i class="fas fa-sign-in-alt"></i> تسجيل الدخول</button>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit();
}

requireAdmin();

// جلب إحصائيات عامة
$total_codes = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM access_codes"))['c'] ?? 0;
$used_codes = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM access_codes WHERE is_used = 1"))['c'] ?? 0;
$active_subs = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM user_subscriptions WHERE expires_at > NOW() OR is_frozen = 1"))['c'] ?? 0;
$is_frozen = getSystemSetting('global_freeze', '0') === '1';
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>لوحة الأدمن | منصة التجارب العلمية</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --main: #004e66; --dark: #002d3d; --light: #f8fafc; --accent: #00a8d4; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Cairo', sans-serif; }
        body { background: var(--light); color: #1e293b; display: flex; min-height: 100vh; }
        .sidebar { width: 260px; background: var(--dark); color: white; padding: 24px 16px; display: flex; flex-direction: column; gap: 12px; }
        .sidebar-brand { font-size: 1.2rem; font-weight: 800; padding: 12px; color: var(--accent); display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 12px; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: #cbd5e1; text-decoration: none; border-radius: 12px; font-weight: 600; transition: 0.2s; }
        .nav-item:hover, .nav-item.active { background: var(--main); color: white; }
        .main-content { flex: 1; padding: 32px; overflow-y: auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .page-title { font-size: 1.6rem; font-weight: 800; color: var(--dark); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px; }
        .kpi-card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .kpi-title { font-size: 0.85rem; color: #64748b; font-weight: 700; margin-bottom: 8px; }
        .kpi-val { font-size: 1.8rem; font-weight: 800; color: var(--dark); }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 100px; font-size: 0.8rem; font-weight: 700; }
        .status-badge.active { background: #dcfce7; color: #166534; }
        .status-badge.frozen { background: #e0f2fe; color: #0369a1; }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-brand"><i class="fas fa-flask"></i> لوحة المختبرات</div>
        <a href="index.php" class="nav-item active"><i class="fas fa-chart-line"></i> الملخص والأداء</a>
        <a href="manage_subscriptions.php" class="nav-item"><i class="fas fa-id-card"></i> إدارة اشتراكات المعلمين</a>
        <a href="create_codes.php" class="nav-item"><i class="fas fa-magic"></i> توليد الأكواد بالجملة</a>
        <a href="manage_codes.php" class="nav-item"><i class="fas fa-barcode"></i> إدارة وتصدير الأكواد</a>
        <a href="experiments.php" class="nav-item"><i class="fas fa-vials"></i> التجارب العلمية</a>
        <a href="packages.php" class="nav-item"><i class="fas fa-cubes"></i> الباقات والاشتراكات</a>
        <a href="system_freeze.php" class="nav-item"><i class="fas fa-snowflake"></i> تجميد الإجازات الدراسية</a>
        <a href="statistics.php" class="nav-item"><i class="fas fa-user-check"></i> تقارير وتفاعل المعلمين</a>
        <a href="auth.php?logout=1" class="nav-item" style="margin-top: auto; color: #f87171;"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</a>
    </div>

    <div class="main-content">
        <div class="header">
            <div class="page-title">ملخص المنصة والنظرة العامة</div>
            <div>
                <?php if ($is_frozen): ?>
                    <span class="status-badge frozen"><i class="fas fa-snowflake"></i> العدادات مُجمدة حالياً</span>
                <?php else: ?>
                    <span class="status-badge active"><i class="fas fa-check-circle"></i> العدادات تعمل بنشاط</span>
                <?php endif; ?>
            </div>
        </div>

        <div class="grid">
            <div class="kpi-card">
                <div class="kpi-title"><i class="fas fa-barcode"></i> إجمالي الكروت المطبوعة</div>
                <div class="kpi-val"><?=$total_codes?></div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title"><i class="fas fa-check-double"></i> الأكواد المشحونة</div>
                <div class="kpi-val"><?=$used_codes?></div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title"><i class="fas fa-users-class"></i> المعلمين النشطين</div>
                <div class="kpi-val"><?=$active_subs?></div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title"><i class="fas fa-percentage"></i> نسبة التفعيل</div>
                <div class="kpi-val"><?=$total_codes > 0 ? round(($used_codes/$total_codes)*100, 1) . '%' : '0%'?></div>
            </div>
        </div>

        <div style="background: white; border-radius: 16px; padding: 28px; border: 1px solid #e2e8f0;">
            <h3 style="margin-bottom: 16px; color: var(--dark);"><i class="fas fa-rocket"></i> اختصارات سريعة للإدارة</h3>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <a href="create_codes.php" style="padding: 12px 20px; background: #004e66; color: white; text-decoration: none; border-radius: 10px; font-weight: 700;"><i class="fas fa-plus"></i> توليد 50 كود جديد</a>
                <a href="manage_codes.php" style="padding: 12px 20px; background: #0089ae; color: white; text-decoration: none; border-radius: 10px; font-weight: 700;"><i class="fas fa-file-excel"></i> تصدير الأكواد لـ Excel</a>
                <a href="system_freeze.php" style="padding: 12px 20px; background: #0284c7; color: white; text-decoration: none; border-radius: 10px; font-weight: 700;"><i class="fas fa-snowflake"></i> إدارة تجميد الإجازات</a>
            </div>
        </div>
    </div>
</body>
</html>
