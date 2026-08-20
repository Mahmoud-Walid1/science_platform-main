<?php
// admin/packages.php - إدارة الباقات ومُدد الاشتراك ورابط متجر شراء الأكواد
require_once __DIR__ . '/auth.php';
requireAdmin();

$message = '';
$error = '';

// 1. تحديث باقة حالية
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_package'])) {
    $package_id = (int)$_POST['package_id'];
    $name = trim($_POST['name']);
    $duration_months = (int)$_POST['duration_months'];
    $store_url = trim($_POST['store_url']);
    $is_active = isset($_POST['is_active']) ? 1 : 0;

    $stmt = $conn->prepare("UPDATE packages SET name = ?, duration_months = ?, store_url = ?, is_active = ? WHERE id = ?");
    $stmt->bind_param("sisii", $name, $duration_months, $store_url, $is_active, $package_id);
    if ($stmt->execute()) {
        $message = "✅ تم تحديث الباقة ورابط الشراء بنجاح!";
    } else {
        $error = "❌ حدث خطأ أثناء التحديث.";
    }
}

// 2. إضافة باقة جديدة
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_package'])) {
    $name = trim($_POST['name']);
    $duration_months = (int)$_POST['duration_months'];
    $store_url = trim($_POST['store_url']);
    $package_key = 'pkg_' . time();
    $is_active = 1;

    if (!empty($name) && $duration_months > 0) {
        $stmt = $conn->prepare("INSERT INTO packages (package_key, name, duration_months, store_url, is_active) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("ssisi", $package_key, $name, $duration_months, $store_url, $is_active);
        if ($stmt->execute()) {
            $message = "✅ تم إضافة الباقة الجديدة بنجاح!";
        } else {
            $error = "❌ تعذر إضافة الباقة.";
        }
    } else {
        $error = "❌ يرجى إدخال اسم الباقة ومدة الشهور بشكل صحيح.";
    }
}

$packages = getAllPackages();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>إدارة الباقات وروابط الشراء | منصة المختبرات</title>
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
        .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-title { font-size: 1.6rem; font-weight: 800; color: var(--dark); }
        .btn-add { background: #10b981; color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; border: none; cursor: pointer; }
        .btn-add:hover { background: #059669; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; }
        .card { background: white; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.03); position: relative; }
        .card-badge { position: absolute; top: 16px; left: 16px; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
        .badge-active { background: #dcfce7; color: #15803d; }
        .badge-inactive { background: #f1f5f9; color: #64748b; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-weight: 700; font-size: 0.85rem; color: #475569; margin-bottom: 6px; }
        .form-group input, .form-group select { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 10px; outline: none; font-size: 0.9rem; }
        .form-group input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,168,212,0.15); }
        .toggle-wrap { display: flex; align-items: center; gap: 10px; cursor: pointer; margin-bottom: 16px; font-weight: 700; font-size: 0.85rem; color: #334155; }
        .toggle-wrap input { width: 18px; height: 18px; cursor: pointer; }
        .btn { padding: 12px 20px; background: var(--main); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; width: 100%; transition: 0.2s; }
        .btn:hover { background: var(--dark); }
        .msg { padding: 14px 18px; border-radius: 12px; margin-bottom: 24px; background: #dcfce7; color: #15803d; font-weight: 700; border: 1px solid #bbf7d0; }
        .err { padding: 14px 18px; border-radius: 12px; margin-bottom: 24px; background: #fee2e2; color: #b91c1c; font-weight: 700; border: 1px solid #fecaca; }
        .new-pkg-box { background: #f0f9ff; border: 2px dashed #38bdf8; border-radius: 20px; padding: 24px; margin-bottom: 32px; }
        .new-pkg-title { font-weight: 800; font-size: 1.1rem; color: #0369a1; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
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
        <div class="page-header">
            <div class="page-title"><i class="fas fa-cubes"></i> إدارة الباقات وروابط شراء الأكواد</div>
            <button onclick="document.getElementById('newPkgBox').style.display='block'" class="btn-add">
                <i class="fas fa-plus-circle"></i> إضافة باقة جديدة
            </button>
        </div>

        <?php if ($message): ?>
            <div class="msg"><?=$message?></div>
        <?php endif; ?>
        <?php if ($error): ?>
            <div class="err"><?=$error?></div>
        <?php endif; ?>

        <!-- نموذج إضافة باقة جديدة -->
        <div class="new-pkg-box" id="newPkgBox" style="display: none;">
            <div class="new-pkg-title"><i class="fas fa-plus"></i> إنشاء باقة اشتراك جديدة</div>
            <form method="POST">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                    <div class="form-group">
                        <label>اسم الباقة</label>
                        <input type="text" name="name" placeholder="مثال: معلم مميز" required>
                    </div>
                    <div class="form-group">
                        <label>المدة (بالشهور)</label>
                        <input type="number" name="duration_months" placeholder="مثال: 6" min="1" max="60" required>
                    </div>
                    <div class="form-group">
                        <label>رابط الشراء من المتجر (URL)</label>
                        <input type="url" name="store_url" placeholder="https://salla.sa/..." dir="ltr">
                    </div>
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 12px;">
                    <button type="button" onclick="document.getElementById('newPkgBox').style.display='none'" class="btn" style="background:#64748b; width:auto;">إلغاء</button>
                    <button type="submit" name="add_package" class="btn" style="background:#10b981; width:auto;">إضافة الباقة الآن</button>
                </div>
            </form>
        </div>

        <div class="grid">
            <?php foreach ($packages as $pkg): ?>
                <div class="card">
                    <span class="card-badge <?=$pkg['is_active'] ? 'badge-active' : 'badge-inactive'?>">
                        <?=$pkg['is_active'] ? 'مفعلة وتظهر بالمعاينة' : 'معطلة (مخفية)'?>
                    </span>

                    <form method="POST" style="margin-top: 16px;">
                        <input type="hidden" name="package_id" value="<?=$pkg['id']?>">
                        
                        <div class="form-group">
                            <label>اسم الباقة</label>
                            <input type="text" name="name" value="<?=htmlspecialchars($pkg['name'])?>" required>
                        </div>
                        
                        <div class="form-group">
                            <label>مدة الباقة (بالشهور)</label>
                            <input type="number" name="duration_months" value="<?=$pkg['duration_months']?>" min="1" max="60" required>
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-shopping-cart text-amber-500"></i> رابط الشراء بالمتجر الرسمي (URL)</label>
                            <input type="url" name="store_url" value="<?=htmlspecialchars($pkg['store_url'] ?? '')?>" placeholder="https://salla.sa/your-store/pkg" dir="ltr">
                            <small style="display:block; margin-top:4px; color:#64748b; font-size:0.75rem;">عند كتابة الرابط، ستحول الكلمة من (قريباً) إلى زر شراء مباشر للمتجر!</small>
                        </div>

                        <label class="toggle-wrap">
                            <input type="checkbox" name="is_active" value="1" <?=$pkg['is_active'] ? 'checked' : ''?>>
                            <span>تفعيل الباقة وإظهارها في قائمة الشراء للمعلمين</span>
                        </label>

                        <button type="submit" name="update_package" class="btn"><i class="fas fa-save"></i> حفظ التعديلات والرابط</button>
                    </form>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</body>
</html>
