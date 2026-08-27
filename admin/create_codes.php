<?php
// admin/create_codes.php - توليد كمية أكواد بالجملة (Batch Code Generation)
require_once __DIR__ . '/auth.php';
requireAdmin();

$packages = getAllPackages();
$message = '';
$generated_codes = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['generate'])) {
    $package_id = (int)$_POST['package_id'];
    $count = (int)$_POST['count'];
    $prefix = trim($_POST['prefix']) ?: 'SCI';

    if ($package_id > 0 && $count > 0) {
        $generated_codes = generateBatchCodes($package_id, $count, $prefix);
        $message = "✅ تم توليد " . count($generated_codes) . " كود شحن بنجاح!";
    } else {
        $message = "❌ يرجى اختيار الباقة وتحديد عدد الأكواد المطلوبة.";
    }
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>توليد الأكواد بالجملة | منصة التجارب</title>
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
        .card { background: white; border-radius: 16px; padding: 28px; border: 1px solid #e2e8f0; max-width: 600px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-weight: 700; color: #475569; margin-bottom: 8px; font-size: 0.9rem; }
        .form-group select, .form-group input { width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 1rem; outline: none; transition: 0.2s; }
        .form-group select:focus, .form-group input:focus { border-color: var(--accent); }
        .btn { padding: 14px 24px; background: var(--main); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: 0.2s; width: 100%; }
        .btn:hover { background: var(--dark); }
        .msg { padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; font-weight: 700; background: #e0f2fe; color: #0369a1; }
        .codes-box { margin-top: 24px; background: #f1f5f9; border-radius: 12px; padding: 16px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 1.1rem; }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-brand"><i class="fas fa-flask"></i> لوحة المختبرات</div>
        <a href="index.php" class="nav-item"><i class="fas fa-chart-line"></i> الملخص والأداء</a>
        <a href="manage_subscriptions.php" class="nav-item"><i class="fas fa-id-card"></i> إدارة اشتراكات المعلمين</a>
        <a href="create_codes.php" class="nav-item active"><i class="fas fa-magic"></i> توليد الأكواد بالجملة</a>
        <a href="manage_codes.php" class="nav-item"><i class="fas fa-barcode"></i> إدارة وتصدير الأكواد</a>
        <a href="experiments.php" class="nav-item"><i class="fas fa-vials"></i> التجارب العلمية</a>
        <a href="packages.php" class="nav-item"><i class="fas fa-cubes"></i> الباقات والاشتراكات</a>
        <a href="system_freeze.php" class="nav-item"><i class="fas fa-snowflake"></i> تجميد الإجازات الدراسية</a>
        <a href="statistics.php" class="nav-item"><i class="fas fa-user-check"></i> تقارير وتفاعل المعلمين</a>
        <a href="auth.php?logout=1" class="nav-item" style="margin-top: auto; color: #f87171;"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</a>
    </div>

    <div class="main-content">
        <div class="page-title"><i class="fas fa-magic"></i> توليد كمية أكواد شحن جديدة (Batch Generation)</div>

        <?php if ($message): ?>
            <div class="msg"><?=$message?></div>
        <?php endif; ?>

        <div class="card">
            <form method="POST">
                <div class="form-group">
                    <label>الباقة المستهدفة</label>
                    <select name="package_id" required>
                        <option value="">-- اختر الباقة --</option>
                        <?php foreach ($packages as $pkg): ?>
                            <option value="<?=$pkg['id']?>"><?=htmlspecialchars($pkg['name'])?> (<?=$pkg['duration_months']?> شهور)</option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="form-group">
                    <label>عدد الأكواد المطلوب توليدها</label>
                    <input type="number" name="count" min="1" max="500" value="50" required>
                </div>

                <div class="form-group">
                    <label>بادئة الكود (Prefix)</label>
                    <input type="text" name="prefix" value="SCI" placeholder="SCI">
                </div>

                <button type="submit" name="generate" class="btn"><i class="fas fa-cog"></i> توليد الأكواد الآن</button>
            </form>

            <?php if (!empty($generated_codes)): ?>
                <div class="codes-box">
                    <strong>الأكواد التي تم توليدها حديثاً:</strong><br><br>
                    <?php foreach ($generated_codes as $c): ?>
                        <?=$c?><br>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
