<?php
// admin/system_freeze.php - إدارة تجميد الاشتراكات في فترة الإجازات الدراسية
require_once __DIR__ . '/auth.php';
requireAdmin();

$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['toggle_freeze'])) {
    $current_freeze = getSystemSetting('global_freeze', '0');
    $new_status = ($current_freeze === '1') ? '0' : '1';
    setSystemSetting('global_freeze', $new_status);

    if ($new_status === '1') {
        $message = "❄️ تم تفعيل تجميد الاشتراكات لجميع المعلمين بنجاح (عداد الأيام متوقف حالياً).";
    } else {
        $message = "☀️ تم استئناف عداد الاشتراكات وإلغاء التجميد بنجاح.";
    }
}

$is_frozen = getSystemSetting('global_freeze', '0') === '1';
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>تجميد الإجازات الدراسية | منصة التجارب</title>
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
        .page-title { font-size: 1.6rem; font-weight: 800; color: var(--dark); margin-bottom: 24px; }
        .card { background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; max-width: 650px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .btn { padding: 14px 28px; border: none; border-radius: 12px; font-weight: 800; font-size: 1.1rem; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; gap: 10px; }
        .btn-freeze { background: #0284c7; color: white; }
        .btn-unfreeze { background: #16a34a; color: white; }
        .msg { padding: 14px 18px; border-radius: 12px; margin-bottom: 24px; background: #e0f2fe; color: #0369a1; font-weight: 700; }
        .info-box { background: #f8fafc; border-right: 4px solid #004e66; padding: 16px; border-radius: 8px; margin-bottom: 24px; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-brand"><i class="fas fa-flask"></i> لوحة المختبرات</div>
        <a href="index.php" class="nav-item"><i class="fas fa-chart-line"></i> الملخص والأداء</a>
        <a href="manage_subscriptions.php" class="nav-item"><i class="fas fa-id-card"></i> إدارة اشتراكات المعلمين</a>
        <a href="create_codes.php" class="nav-item"><i class="fas fa-magic"></i> توليد الأكواد بالجملة</a>
        <a href="manage_codes.php" class="nav-item"><i class="fas fa-barcode"></i> إدارة وتصدير الأكواد</a>
        <a href="experiments.php" class="nav-item"><i class="fas fa-vials"></i> التجارب العلمية</a>
        <a href="packages.php" class="nav-item"><i class="fas fa-cubes"></i> الباقات والاشتراكات</a>
        <a href="system_freeze.php" class="nav-item active"><i class="fas fa-snowflake"></i> تجميد الإجازات الدراسية</a>
        <a href="statistics.php" class="nav-item"><i class="fas fa-user-check"></i> تقارير وتفاعل المعلمين</a>
        <a href="auth.php?logout=1" class="nav-item" style="margin-top: auto; color: #f87171;"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</a>
    </div>

    <div class="main-content">
        <div class="page-title"><i class="fas fa-snowflake"></i> نظام تجميد عداد الاشتراكات (الإجازات الدراسية)</div>

        <?php if ($message): ?>
            <div class="msg"><?=$message?></div>
        <?php endif; ?>

        <div class="card">
            <div class="info-box">
                <strong><i class="fas fa-info-circle"></i> كيف يعمل نظام التجميد؟</strong><br>
                عند تفعيل التجميد (مثلاً في الإجازة الصيفية)، يتوقف عداد الأيام لجميع المعلمين. يظل المعلمون قادرين على استخدام المنصة، وتظل أيام اشتراكاتهم المتبقية مجمّدة وحافظة لقيمتها، لحين قيامك بإلغاء التجميد مع بداية العام الدراسي الجديد.
            </div>

            <div style="margin-bottom: 24px;">
                <strong>حالة النظام الحالية:</strong>
                <?php if ($is_frozen): ?>
                    <span style="color:#0284c7; font-weight:800; font-size:1.2rem;"> ❄️ العدادات مُجمدة حالياً</span>
                <?php else: ?>
                    <span style="color:#16a34a; font-weight:800; font-size:1.2rem;"> ☀️ العدادات تعمل بنشاط وحرية</span>
                <?php endif; ?>
            </div>

            <form method="POST">
                <?php if ($is_frozen): ?>
                    <button type="submit" name="toggle_freeze" class="btn btn-unfreeze"><i class="fas fa-sun"></i> إلغاء التجميد وإعادة تشغيل العدادات</button>
                <?php else: ?>
                    <button type="submit" name="toggle_freeze" class="btn btn-freeze"><i class="fas fa-snowflake"></i> تفعيل تجميد الاشتراكات للإجازة</button>
                <?php endif; ?>
            </form>
        </div>
    </div>
</body>
</html>
