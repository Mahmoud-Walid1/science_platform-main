<?php
// admin/manage_codes.php - إدارة وتصدير الأكواد (Excel/CSV/Clipboard)
require_once __DIR__ . '/auth.php';
requireAdmin();

// تصدير CSV
if (isset($_GET['export']) && $_GET['export'] === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=access_codes_' . date('Y-m-d') . '.csv');
    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM
    fputcsv($output, ['المعرف', 'الكود', 'الباقة', 'المدة (شهور)', 'الحالة', 'تم الاستخدام', 'المستخدم', 'تاريخ الشحن', 'تاريخ الإنشاء']);

    $res = mysqli_query($conn, "
        SELECT ac.id, ac.code, p.name AS package_name, p.duration_months, ac.is_active, ac.is_used, ac.used_by_user_id, ac.used_at, ac.created_at
        FROM access_codes ac
        JOIN packages p ON ac.package_id = p.id
        ORDER BY ac.id DESC
    ");
    while ($row = mysqli_fetch_assoc($res)) {
        fputcsv($output, [
            $row['id'],
            $row['code'],
            $row['package_name'],
            $row['duration_months'],
            $row['is_active'] ? 'نشط' : 'معطل',
            $row['is_used'] ? 'مستعمل' : 'غير مستعمل',
            $row['used_by_user_id'] ?? '-',
            $row['used_at'] ?? '-',
            $row['created_at']
        ]);
    }
    fclose($output);
    exit();
}

$status_filter = $_GET['status'] ?? 'all';
$search = trim($_GET['search'] ?? '');

$query = "
    SELECT ac.id, ac.code, p.name AS package_name, p.duration_months, ac.is_active, ac.is_used, ac.used_by_user_id, ac.used_at, ac.created_at
    FROM access_codes ac
    JOIN packages p ON ac.package_id = p.id
    WHERE 1=1
";

if ($status_filter === 'unused') {
    $query .= " AND ac.is_used = 0";
} elseif ($status_filter === 'used') {
    $query .= " AND ac.is_used = 1";
}

if ($search !== '') {
    $safe_search = mysqli_real_escape_string($conn, $search);
    $query .= " AND ac.code LIKE '%$safe_search%'";
}

$query .= " ORDER BY ac.id DESC LIMIT 200";
$result = mysqli_query($conn, $query);
$codes_list = mysqli_fetch_all($result, MYSQLI_ASSOC);
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>إدارة الأكواد وتصديرها | منصة التجارب</title>
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
        .toolbar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; justify-content: space-between; align-items: center; }
        .search-box { display: flex; gap: 8px; }
        .search-box input { padding: 10px 16px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; outline: none; width: 260px; }
        .btn { padding: 10px 18px; background: var(--main); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 0.9rem; }
        .btn-green { background: #16a34a; }
        .btn-gray { background: #64748b; }
        .table-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        table { width: 100%; border-collapse: collapse; text-align: right; }
        th, td { padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
        th { background: #f8fafc; color: #475569; font-weight: 700; }
        .badge { padding: 4px 10px; border-radius: 100px; font-size: 0.75rem; font-weight: 700; }
        .badge-unused { background: #dcfce7; color: #15803d; }
        .badge-used { background: #fee2e2; color: #b91c1c; }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-brand"><i class="fas fa-flask"></i> لوحة المختبرات</div>
        <a href="index.php" class="nav-item"><i class="fas fa-chart-line"></i> الملخص والأداء</a>
        <a href="create_codes.php" class="nav-item"><i class="fas fa-magic"></i> توليد الأكواد بالجملة</a>
        <a href="manage_codes.php" class="nav-item active"><i class="fas fa-barcode"></i> إدارة وتصدير الأكواد</a>
        <a href="experiments.php" class="nav-item"><i class="fas fa-vials"></i> التجارب العلمية</a>
        <a href="packages.php" class="nav-item"><i class="fas fa-cubes"></i> الباقات والاشتراكات</a>
        <a href="system_freeze.php" class="nav-item"><i class="fas fa-snowflake"></i> تجميد الإجازات الدراسية</a>
        <a href="statistics.php" class="nav-item"><i class="fas fa-user-check"></i> تقارير وتفاعل المعلمين</a>
        <a href="auth.php?logout=1" class="nav-item" style="margin-top: auto; color: #f87171;"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</a>
    </div>

    <div class="main-content">
        <div class="page-title"><i class="fas fa-barcode"></i> إدارة الأكواد وتصديرها</div>

        <div class="toolbar">
            <form class="search-box" method="GET">
                <input type="text" name="search" value="<?=htmlspecialchars($search)?>" placeholder="ابحث بالكود...">
                <button type="submit" class="btn"><i class="fas fa-search"></i> بحث</button>
                <a href="manage_codes.php" class="btn btn-gray">إلغاء</a>
            </form>

            <div style="display: flex; gap: 8px;">
                <button onclick="copyUnusedCodes()" class="btn btn-gray"><i class="fas fa-copy"></i> نسخ الأكواد غير المستعملة</button>
                <a href="manage_codes.php?export=csv" class="btn btn-green"><i class="fas fa-file-excel"></i> تصدير ملف Excel / CSV</a>
            </div>
        </div>

        <div class="table-card">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>الكود</th>
                        <th>الباقة</th>
                        <th>المدة</th>
                        <th>حالة الاستخدام</th>
                        <th>المستخدم</th>
                        <th>تاريخ الشحن</th>
                        <th>تاريخ التوليد</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($codes_list)): ?>
                        <tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:30px;">لا توجد أكواد مطابقة للبحث</td></tr>
                    <?php else: ?>
                        <?php foreach ($codes_list as $row): ?>
                            <tr>
                                <td><?=$row['id']?></td>
                                <td style="font-family:monospace; font-weight:800; font-size:1.05rem; color:#004e66;"><?=$row['code']?></td>
                                <td><?=htmlspecialchars($row['package_name'])?></td>
                                <td><?=$row['duration_months']?> شهور</td>
                                <td>
                                    <?php if ($row['is_used']): ?>
                                        <span class="badge badge-used"><i class="fas fa-check-circle"></i> مستعمل</span>
                                    <?php else: ?>
                                        <span class="badge badge-unused"><i class="fas fa-clock"></i> جاهز للشحن</span>
                                    <?php endif; ?>
                                </td>
                                <td><?=$row['used_by_user_id'] ? 'المستخدم #'.$row['used_by_user_id'] : '-'?></td>
                                <td><?=$row['used_at'] ? date('Y-m-d H:i', strtotime($row['used_at'])) : '-'?></td>
                                <td><?=date('Y-m-d', strtotime($row['created_at']))?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        function copyUnusedCodes() {
            const codes = [
                <?php 
                foreach ($codes_list as $c) {
                    if (!$c['is_used']) echo '"' . $c['code'] . '",';
                }
                ?>
            ];
            if (codes.length === 0) {
                alert('لا توجد أكواد غير مستعملة في القائمة الحالية للنسخ');
                return;
            }
            navigator.clipboard.writeText(codes.join("\n")).then(() => {
                alert('تم نسخ ' + codes.length + ' كود غير مستعمل للحافظة بنجاح!');
            });
        }
    </script>
</body>
</html>
