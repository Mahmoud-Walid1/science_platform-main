<?php
// admin/packages.php - إدارة الباقات والمدة بالشهور
require_once __DIR__ . '/auth.php';
requireAdmin();

$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_package'])) {
    $package_id = (int)$_POST['package_id'];
    $name = trim($_POST['name']);
    $duration_months = (int)$_POST['duration_months'];

    $stmt = $conn->prepare("UPDATE packages SET name = ?, duration_months = ? WHERE id = ?");
    $stmt->bind_param("sii", $name, $duration_months, $package_id);
    $stmt->execute();
    $message = "✅ تم تحديث الباقة بنجاح!";
}

$packages = getAllPackages();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>إدارة الباقات والاشتراكات | منصة التجارب</title>
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
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
        .card { background: white; border-radius: 16px; padding: 28px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-weight: 700; font-size: 0.85rem; color: #475569; margin-bottom: 6px; }
        .form-group input { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; }
        .btn { padding: 12px 20px; background: var(--main); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; width: 100%; }
        .msg { padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; background: #dcfce7; color: #166534; font-weight: 700; }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-brand"><i class="fas fa-flask"></i> لوحة المختبرات</div>
        <a href="index.php" class="nav-item"><i class="fas fa-chart-line"></i> الملخص والأداء</a>
        <a href="create_codes.php" class="nav-item"><i class="fas fa-magic"></i> توليد الأكواد بالجملة</a>
        <a href="manage_codes.php" class="nav-item"><i class="fas fa-barcode"></i> إدارة وتصدير الأكواد</a>
        <a href="experiments.php" class="nav-item"><i class="fas fa-vials"></i> التجارب العلمية</a>
        <a href="packages.php" class="nav-item active"><i class="fas fa-cubes"></i> الباقات والاشتراكات</a>
        <a href="system_freeze.php" class="nav-item"><i class="fas fa-snowflake"></i> تجميد الإجازات الدراسية</a>
        <a href="statistics.php" class="nav-item"><i class="fas fa-user-check"></i> تقارير وتفاعل المعلمين</a>
        <a href="auth.php?logout=1" class="nav-item" style="margin-top: auto; color: #f87171;"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</a>
    </div>

    <div class="main-content">
        <div class="page-title"><i class="fas fa-cubes"></i> إدارة الباقات ومُدد الإشتراكات</div>

        <?php if ($message): ?>
            <div class="msg"><?=$message?></div>
        <?php endif; ?>

        <div class="grid">
            <?php foreach ($packages as $pkg): ?>
                <div class="card">
                    <form method="POST">
                        <input type="hidden" name="package_id" value="<?=$pkg['id']?>">
                        <div class="form-group">
                            <label>اسم الباقة</label>
                            <input type="text" name="name" value="<?=htmlspecialchars($pkg['name'])?>" required>
                        </div>
                        <div class="form-group">
                            <label>مدة الباقة (بالشهور)</label>
                            <input type="number" name="duration_months" value="<?=$pkg['duration_months']?>" min="1" max="60" required>
                        </div>
                        <button type="submit" name="update_package" class="btn"><i class="fas fa-save"></i> حفظ تعديلات الباقة</button>
                    </form>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</body>
</html>
