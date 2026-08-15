<?php
// admin/experiments.php - إدارة التجارب العلمية وصورها وتفعيلها
require_once __DIR__ . '/auth.php';
requireAdmin();

$message = '';
$upload_dir = __DIR__ . '/../uploads/experiments/';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// تفعيل/تعطيل تجربة
if (isset($_GET['toggle'])) {
    $exp_id = (int)$_GET['toggle'];
    mysqli_query($conn, "UPDATE experiments SET is_active = NOT is_active WHERE id = $exp_id");
    header("Location: experiments.php");
    exit();
}

// تحديث تجربة ورفع صوره
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_exp'])) {
    $exp_id = (int)$_POST['exp_id'];
    $title = trim($_POST['title']);

    $image_path = null;
    if (isset($_FILES['exp_image']) && $_FILES['exp_image']['error'] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($_FILES['exp_image']['name'], PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'svg'])) {
            $new_name = 'exp_' . $exp_id . '_' . time() . '.' . $ext;
            $target = $upload_dir . $new_name;
            if (move_uploaded_file($_FILES['exp_image']['tmp_name'], $target)) {
                $image_path = 'uploads/experiments/' . $new_name;
            }
        }
    }

    if ($image_path) {
        $stmt = $conn->prepare("UPDATE experiments SET title = ?, image_url = ? WHERE id = ?");
        $stmt->bind_param("ssi", $title, $image_path, $exp_id);
    } else {
        $stmt = $conn->prepare("UPDATE experiments SET title = ? WHERE id = ?");
        $stmt->bind_param("si", $title, $exp_id);
    }
    $stmt->execute();
    $message = "✅ تم تحديث التجربة بنجاح!";
}

// إضافة تجربة جديدة
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_exp'])) {
    $title = trim($_POST['title']);
    $code_name = trim($_POST['code_name']);
    $page_url = trim($_POST['page_url']);

    if (empty($page_url)) $page_url = 'experiments/matter.php';
    if (empty($code_name)) $code_name = 'exp_' . time();

    $image_path = null;
    if (isset($_FILES['exp_image']) && $_FILES['exp_image']['error'] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($_FILES['exp_image']['name'], PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'svg'])) {
            $new_name = 'exp_new_' . time() . '.' . $ext;
            $target = $upload_dir . $new_name;
            if (move_uploaded_file($_FILES['exp_image']['tmp_name'], $target)) {
                $image_path = 'uploads/experiments/' . $new_name;
            }
        }
    }

    $stmt = $conn->prepare("INSERT INTO experiments (code_name, title, page_url, image_url, is_active) VALUES (?, ?, ?, ?, 1)");
    $stmt->bind_param("ssss", $code_name, $title, $page_url, $image_path);
    if ($stmt->execute()) {
        $message = "🎉 تم إضافة التجربة الجديدة بنجاح وستظهر في منصة المختبرات فوراً!";
    } else {
        $message = "❌ فشل إضافة التجربة (تأكد من عدم تكرار كود التجربة)";
    }
}

$experiments = getAllExperiments();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>إدارة التجارب العلمية | منصة التجارب</title>
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
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .card-title { font-size: 1.1rem; font-weight: 800; color: var(--dark); }
        .btn { padding: 8px 14px; background: var(--main); color: white; text-decoration: none; border-radius: 8px; font-weight: 700; border: none; cursor: pointer; font-size: 0.85rem; }
        .btn-toggle { background: #e2e8f0; color: #475569; }
        .btn-toggle.active { background: #dcfce7; color: #166534; }
        .form-group { margin-bottom: 14px; }
        .form-group label { display: block; font-weight: 700; font-size: 0.85rem; color: #475569; margin-bottom: 6px; }
        .form-group input { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; }
        .msg { padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; background: #dcfce7; color: #166534; font-weight: 700; }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-brand"><i class="fas fa-flask"></i> لوحة المختبرات</div>
        <a href="index.php" class="nav-item"><i class="fas fa-chart-line"></i> الملخص والأداء</a>
        <a href="create_codes.php" class="nav-item"><i class="fas fa-magic"></i> توليد الأكواد بالجملة</a>
        <a href="manage_codes.php" class="nav-item"><i class="fas fa-barcode"></i> إدارة وتصدير الأكواد</a>
        <a href="experiments.php" class="nav-item active"><i class="fas fa-vials"></i> التجارب العلمية</a>
        <a href="packages.php" class="nav-item"><i class="fas fa-cubes"></i> الباقات والاشتراكات</a>
        <a href="system_freeze.php" class="nav-item"><i class="fas fa-snowflake"></i> تجميد الإجازات الدراسية</a>
        <a href="statistics.php" class="nav-item"><i class="fas fa-user-check"></i> تقارير وتفاعل المعلمين</a>
        <a href="auth.php?logout=1" class="nav-item" style="margin-top: auto; color: #f87171;"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</a>
    </div>

    <div class="main-content">
        <div class="page-title"><i class="fas fa-vials"></i> إدارة التجارب العلمية والمختبرات</div>

        <?php if ($message): ?>
            <div class="msg"><?=$message?></div>
        <?php endif; ?>

        <!-- كارت إضافة تجربة جديدة -->
        <div class="card" style="margin-bottom: 28px; border-top: 4px solid var(--accent);">
            <div class="card-title" style="margin-bottom: 16px;"><i class="fas fa-plus-circle"></i> إضافة تجربة جديدة للمختبر</div>
            <form method="POST" enctype="multipart/form-data" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; align-items: end;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label>عنوان التجربة</label>
                    <input type="text" name="title" placeholder="مثال: الضغط والتسامي" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>المعرف (Code Name)</label>
                    <input type="text" name="code_name" placeholder="مثال: pressure_exp" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>رابط صفحة التجربة</label>
                    <input type="text" name="page_url" placeholder="experiments/matter.php" value="experiments/matter.php">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>صورة التجربة (اختياري)</label>
                    <input type="file" name="exp_image" accept="image/*">
                </div>
                <div>
                    <button type="submit" name="add_exp" class="btn" style="background: var(--accent); color: var(--dark); padding: 12px 20px; width: 100%; font-weight: 800;"><i class="fas fa-plus"></i> إضافة التجربة الآن</button>
                </div>
            </form>
        </div>

        <div class="grid">
            <?php foreach ($experiments as $exp): ?>
                <div class="card">
                    <div class="card-header">
                        <div class="card-title"><?=htmlspecialchars($exp['title'])?></div>
                        <a href="experiments.php?toggle=<?=$exp['id']?>" class="btn btn-toggle <?=$exp['is_active'] ? 'active' : ''?>">
                            <?=$exp['is_active'] ? '✅ مفعلة' : '❌ متوقفة'?>
                        </a>
                    </div>

                    <form method="POST" enctype="multipart/form-data">
                        <input type="hidden" name="exp_id" value="<?=$exp['id']?>">
                        <div class="form-group">
                            <label>عنوان التجربة</label>
                            <input type="text" name="title" value="<?=htmlspecialchars($exp['title'])?>" required>
                        </div>
                        <div class="form-group">
                            <label>صورة المعاينة (اختياري)</label>
                            <input type="file" name="exp_image" accept="image/*">
                        </div>
                        <?php if ($exp['image_url']): ?>
                            <div style="margin-bottom:12px;"><img src="../<?=htmlspecialchars($exp['image_url'])?>" style="height:60px; border-radius:8px;"></div>
                        <?php endif; ?>
                        <button type="submit" name="update_exp" class="btn"><i class="fas fa-save"></i> حفظ التعديلات</button>
                    </form>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</body>
</html>
