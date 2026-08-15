<?php
// admin/statistics.php - إحصائيات المعلمين والزيارات والتفاعل
require_once __DIR__ . '/auth.php';
requireAdmin();

// جلب أفضل المعلمين المترددين على المنصة
$top_users = mysqli_query($conn, "
    SELECT user_id, COUNT(*) AS access_count, MAX(access_time) AS last_access
    FROM access_logs
    WHERE user_id IS NOT NULL AND status = 'success'
    GROUP BY user_id
    ORDER BY access_count DESC
    LIMIT 20
");

// سجلات الدخول الأخيرة
$recent_logs = mysqli_query($conn, "
    SELECT * FROM access_logs ORDER BY id DESC LIMIT 50
");
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>تقارير وتفاعل المعلمين | منصة التجارب</title>
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
        .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .card-header { padding: 20px; border-bottom: 1px solid #e2e8f0; font-weight: 800; font-size: 1.1rem; color: var(--dark); background: #f8fafc; }
        table { width: 100%; border-collapse: collapse; text-align: right; }
        th, td { padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
        th { background: #f8fafc; color: #475569; font-weight: 700; }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-brand"><i class="fas fa-flask"></i> لوحة المختبرات</div>
        <a href="index.php" class="nav-item"><i class="fas fa-chart-line"></i> الملخص والأداء</a>
        <a href="create_codes.php" class="nav-item"><i class="fas fa-magic"></i> توليد الأكواد بالجملة</a>
        <a href="manage_codes.php" class="nav-item"><i class="fas fa-barcode"></i> إدارة وتصدير الأكواد</a>
        <a href="experiments.php" class="nav-item"><i class="fas fa-vials"></i> التجارب العلمية</a>
        <a href="packages.php" class="nav-item"><i class="fas fa-cubes"></i> الباقات والاشتراكات</a>
        <a href="system_freeze.php" class="nav-item"><i class="fas fa-snowflake"></i> تجميد الإجازات الدراسية</a>
        <a href="statistics.php" class="nav-item active"><i class="fas fa-user-check"></i> تقارير وتفاعل المعلمين</a>
        <a href="auth.php?logout=1" class="nav-item" style="margin-top: auto; color: #f87171;"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</a>
    </div>

    <div class="main-content">
        <div class="page-title"><i class="fas fa-chart-bar"></i> تقارير تفاعل المعلمين والعمليات</div>

        <div class="card">
            <div class="card-header"><i class="fas fa-user-graduate"></i> المعلمون الأكثر استخداماً وتدخولاً للمختبرات</div>
            <table>
                <thead>
                    <tr>
                        <th>المستخدم</th>
                        <th>عدد مرات فتح واستخدام المنصة</th>
                        <th>آخر تواجد ودخول</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (mysqli_num_rows($top_users) === 0): ?>
                        <tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:24px;">لا توجد بيانات تفاعل بعد</td></tr>
                    <?php else: ?>
                        <?php while ($u = mysqli_fetch_assoc($top_users)): ?>
                            <tr>
                                <td><strong>المعلم #<?=$u['user_id']?></strong></td>
                                <td><span style="font-weight:800; color:#004e66;"><?=$u['access_count']?> مرة</span></td>
                                <td><?=date('Y-m-d H:i', strtotime($u['last_access']))?></td>
                            </tr>
                        <?php endwhile; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <div class="card">
            <div class="card-header"><i class="fas fa-history"></i> سجل العمليات والدخول الحديثة (Access Logs)</div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>الكود / العملية</th>
                        <th>المستخدم</th>
                        <th>الـ IP</th>
                        <th>الحالة</th>
                        <th>التاريخ والوقت</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while ($log = mysqli_fetch_assoc($recent_logs)): ?>
                        <tr>
                            <td><?=$log['id']?></td>
                            <td style="font-family:monospace; font-weight:700;"><?=$log['code'] ?: 'عملية دخول'?></td>
                            <td><?=$log['user_id'] ? 'المستخدم #'.$log['user_id'] : '-'?></td>
                            <td><?=$log['ip_address']?></td>
                            <td>
                                <?php if ($log['status'] === 'success'): ?>
                                    <span style="color:#16a34a; font-weight:700;">ناجحة</span>
                                <?php else: ?>
                                    <span style="color:#dc2626; font-weight:700;"><?=htmlspecialchars($log['status'])?></span>
                                <?php endif; ?>
                            </td>
                            <td><?=date('Y-m-d H:i:s', strtotime($log['access_time']))?></td>
                        </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
