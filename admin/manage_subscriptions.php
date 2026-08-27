<?php
// admin/manage_subscriptions.php - لوحة التحكم بالاشتراكات وإرسال الرسائل المخصصة للمعلمين
require_once __DIR__ . '/auth.php';
requireAdmin();

$success_msg = '';
$error_msg = '';

// 1. معالجة تحديث الاشتراك (تغيير الباقة، تمديد/تقليل التاريخ، تغيير الحالة أو الإلغاء)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action_update_sub'])) {
    $user_id = (int)$_POST['user_id'];
    $package_id = (int)$_POST['package_id'];
    $expires_at = trim($_POST['expires_at']);
    $status = trim($_POST['status']);

    if ($user_id > 0 && !empty($expires_at)) {
        if (updateSubscriptionByAdmin($user_id, $package_id, $expires_at, $status)) {
            $success_msg = "تم تحديث اشتراك المعلم #{$user_id} بنجاح.";
        } else {
            $error_msg = "فشل في تحديث بيانات اشتراك المعلم.";
        }
    } else {
        $error_msg = "تاريخ الانتهاء ورقم المعلم مطلوبان.";
    }
}

// 2. معالجة إرسال/تعديل الرسالة المخصصة للمعلم
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action_save_message'])) {
    $user_id = (int)$_POST['user_id'];
    $message_text = trim($_POST['message_text']);
    $show_once = isset($_POST['show_once']) ? 1 : 0;

    if ($user_id > 0) {
        if (setTeacherAdminMessage($user_id, $message_text, $show_once)) {
            $success_msg = empty($message_text) ? "تم مسح الرسالة المخصصة للمعلم #{$user_id}." : "تم حفظ وتفعيل الرسالة المخصصة للمعلم #{$user_id}.";
        } else {
            $error_msg = "فشل في حفظ الرسالة المخصصة.";
        }
    }
}

// جلب كلمة البحث إن وجدت
$search_query = trim($_GET['search'] ?? '');
$subscriptions = getAllTeacherSubscriptions($search_query);
$packages = getAllPackages();

$is_frozen = getSystemSetting('global_freeze', '0') === '1';
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إدارة اشتراكات المعلمين | منصة التجارب العلمية</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --main: #004e66;
            --dark: #002d3d;
            --light: #f8fafc;
            --accent: #00a8d4;
            --success: #16a34a;
            --warning: #ea580c;
            --danger: #dc2626;
            --frozen: #0284c7;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Cairo', sans-serif; }
        body { background: var(--light); color: #1e293b; display: flex; min-height: 100vh; }
        
        .sidebar { width: 260px; background: var(--dark); color: white; padding: 24px 16px; display: flex; flex-direction: column; gap: 12px; }
        .sidebar-brand { font-size: 1.2rem; font-weight: 800; padding: 12px; color: var(--accent); display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 12px; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: #cbd5e1; text-decoration: none; border-radius: 12px; font-weight: 600; transition: 0.2s; }
        .nav-item:hover, .nav-item.active { background: var(--main); color: white; }

        .main-content { flex: 1; padding: 32px; overflow-y: auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
        .page-title { font-size: 1.6rem; font-weight: 800; color: var(--dark); display: flex; align-items: center; gap: 10px; }
        
        .alert { padding: 14px 20px; border-radius: 12px; margin-bottom: 24px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
        .alert-success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .alert-danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

        .search-card { background: white; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.02); margin-bottom: 28px; }
        .search-form { display: flex; gap: 12px; align-items: center; }
        .search-input-wrap { position: relative; flex: 1; }
        .search-input-wrap i { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .search-input { width: 100%; padding: 12px 42px 12px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 0.95rem; outline: none; transition: 0.2s; }
        .search-input:focus { border-color: var(--accent); }
        .btn-search { padding: 12px 24px; background: var(--main); color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-search:hover { background: var(--dark); }
        .btn-reset { padding: 12px 20px; background: #f1f5f9; color: #64748b; text-decoration: none; border-radius: 12px; font-weight: 700; transition: 0.2s; }
        .btn-reset:hover { background: #e2e8f0; color: #334155; }

        .table-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; text-align: right; }
        th, td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; font-size: 0.92rem; }
        th { background: #f8fafc; color: #475569; font-weight: 800; font-size: 0.85rem; }
        tr:hover { background: #f8fafc; }

        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 100px; font-size: 0.78rem; font-weight: 800; }
        .badge-active { background: #dcfce7; color: #166534; }
        .badge-frozen { background: #e0f2fe; color: #0369a1; }
        .badge-cancelled { background: #fef2f2; color: #991b1b; }
        .badge-expired { background: #f3f4f6; color: #4b5563; }

        .btn-action { padding: 8px 14px; border: none; border-radius: 10px; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
        .btn-edit { background: #e0f2fe; color: #0284c7; }
        .btn-edit:hover { background: #bae6fd; }
        .btn-msg { background: #fef3c7; color: #d97706; }
        .btn-msg:hover { background: #fde68a; }

        /* Custom Modal Styling */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-overlay.active { display: flex; }
        .modal-box { background: white; border-radius: 20px; width: 100%; max-width: 520px; box-shadow: 0 20px 40px rgba(0,0,0,0.25); overflow: hidden; animation: popIn 0.25s ease-out; }
        @keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .modal-header { background: var(--dark); color: white; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
        .modal-title { font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; gap: 10px; }
        .modal-close { background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; transition: 0.2s; }
        .modal-close:hover { color: white; }
        .modal-body { padding: 24px; }
        .form-group { margin-bottom: 18px; text-align: right; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 8px; }
        .form-control { width: 100%; padding: 12px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; outline: none; transition: 0.2s; }
        .form-control:focus { border-color: var(--accent); }
        textarea.form-control { min-height: 100px; resize: vertical; }
        .checkbox-group { display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; cursor: pointer; }
        .checkbox-group input { width: 18px; height: 18px; cursor: pointer; }
        .modal-footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; }
        .btn-submit { padding: 12px 24px; background: var(--main); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-submit:hover { background: var(--dark); }
        .btn-cancel { padding: 12px 20px; background: #e2e8f0; color: #475569; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-brand"><i class="fas fa-flask"></i> لوحة المختبرات</div>
        <a href="index.php" class="nav-item"><i class="fas fa-chart-line"></i> الملخص والأداء</a>
        <a href="manage_subscriptions.php" class="nav-item active"><i class="fas fa-id-card"></i> إدارة اشتراكات المعلمين</a>
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
            <div class="page-title"><i class="fas fa-users-cog"></i> إدارة اشتراكات المعلمين والرسائل</div>
        </div>

        <?php if ($success_msg): ?>
            <div class="alert alert-success"><i class="fas fa-check-circle"></i> <?=$success_msg?></div>
        <?php endif; ?>
        <?php if ($error_msg): ?>
            <div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> <?=$error_msg?></div>
        <?php endif; ?>

        <!-- كارت البحث الشامل -->
        <div class="search-card">
            <form method="GET" class="search-form">
                <div class="search-input-wrap">
                    <i class="fas fa-search"></i>
                    <input type="text" name="search" class="search-input" placeholder="ابحث باسم المعلم، رقم الهاتف / الواتساب، البريد الإلكتروني، أو رقم ID..." value="<?=htmlspecialchars($search_query)?>">
                </div>
                <button type="submit" class="btn-search"><i class="fas fa-filter"></i> بحث</button>
                <?php if (!empty($search_query)): ?>
                    <a href="manage_subscriptions.php" class="btn-reset"><i class="fas fa-times"></i> إلغاء البحث</a>
                <?php endif; ?>
            </form>
        </div>

        <!-- جدول الاشتراكات -->
        <div class="table-card">
            <table>
                <thead>
                    <tr>
                        <th># المعلم</th>
                        <th>اسم المعلم</th>
                        <th>التواصل (هاتف / ايميل)</th>
                        <th>الباقة الحالية</th>
                        <th>تاريخ الانتهاء</th>
                        <th>حالة الاشتراك</th>
                        <th>الرسالة المخصصة</th>
                        <th>إجراءات الإدارة</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($subscriptions)): ?>
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 40px; color: #94a3b8;">
                                <i class="fas fa-user-slash" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                                لا توجد اشتراكات مطابقة للبحث أو مسجلة حالياً.
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($subscriptions as $sub): 
                            $now = time();
                            $exp_time = strtotime($sub['expires_at']);
                            $status_code = $sub['status'] ?? 'active';

                            if ($status_code === 'cancelled') {
                                $badge_class = 'badge-cancelled';
                                $badge_icon = 'fa-ban';
                                $status_name = 'ملغى من الإدارة';
                            } elseif ($sub['is_frozen'] || $status_code === 'frozen') {
                                $badge_class = 'badge-frozen';
                                $badge_icon = 'fa-snowflake';
                                $status_name = 'مُجمد';
                            } elseif ($exp_time > $now) {
                                $badge_class = 'badge-active';
                                $badge_icon = 'fa-check-circle';
                                $status_name = 'نشط وسارٍ';
                            } else {
                                $badge_class = 'badge-expired';
                                $badge_icon = 'fa-clock';
                                $status_name = 'منتهي';
                            }

                            $has_msg = !empty($sub['admin_message']);
                            $msg_read = $sub['message_read'] == 1;
                        ?>
                            <tr>
                                <td><strong>#<?=$sub['user_id']?></strong></td>
                                <td><strong><?=htmlspecialchars($sub['teacher_name'] ?? 'معلم #' . $sub['user_id'])?></strong></td>
                                <td>
                                    <div><i class="fab fa-whatsapp" style="color: #25d366;"></i> <?=htmlspecialchars($sub['teacher_phone'] ?? 'غير مسجل')?></div>
                                    <?php if (!empty($sub['teacher_email'])): ?>
                                        <div style="font-size: 0.8rem; color: #64748b;"><i class="fas fa-envelope"></i> <?=htmlspecialchars($sub['teacher_email'])?></div>
                                    <?php endif; ?>
                                </td>
                                <td><span style="font-weight: 700; color: var(--main);"><?=htmlspecialchars($sub['package_name'])?></span></td>
                                <td>
                                    <div><?=date('Y-m-d H:i', strtotime($sub['expires_at']))?></div>
                                    <div style="font-size: 0.78rem; color: #64748b;">
                                        <?php 
                                            $diff_days = ceil(($exp_time - $now) / 86400);
                                            echo $diff_days > 0 ? "متبقي {$diff_days} يوم" : "انتهى منذ " . abs($diff_days) . " يوم";
                                        ?>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge <?=$badge_class?>">
                                        <i class="fas <?=$badge_icon?>"></i> <?=$status_name?>
                                    </span>
                                </td>
                                <td>
                                    <?php if ($has_msg): ?>
                                        <span class="badge <?=$msg_read ? 'badge-expired' : 'badge-active'?>" title="<?=htmlspecialchars($sub['admin_message'])?>">
                                            <i class="fas <?=$msg_read ? 'fa-envelope-open' : 'fa-paper-plane'?>"></i>
                                            <?=$msg_read ? 'تمت القراءة' : 'نشطة/معروضة'?>
                                        </span>
                                    <?php else: ?>
                                        <span style="font-size: 0.8rem; color: #94a3b8;">لا توجد رسالة</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn-action btn-edit" onclick="openEditModal(<?=htmlentities(json_encode($sub), ENT_QUOTES, 'UTF-8')?>)">
                                            <i class="fas fa-edit"></i> تعديل / إلغاء
                                        </button>
                                        <button class="btn-action btn-msg" onclick="openMsgModal(<?=htmlentities(json_encode($sub), ENT_QUOTES, 'UTF-8')?>)">
                                            <i class="fas fa-comment-alt"></i> الرسالة
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- نافذة تعديل الاشتراك والإلغاء Modal -->
    <div class="modal-overlay" id="editModal">
        <div class="modal-box">
            <div class="modal-header">
                <div class="modal-title"><i class="fas fa-user-edit"></i> تعديل اشتراك المعلم <span id="modalTeacherName"></span></div>
                <button class="modal-close" onclick="closeModal('editModal')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action_update_sub" value="1">
                    <input type="hidden" name="user_id" id="editUserId">

                    <div class="form-group">
                        <label>نوع الباقة</label>
                        <select name="package_id" id="editPackageId" class="form-control" required>
                            <?php foreach ($packages as $pkg): ?>
                                <option value="<?=$pkg['id']?>"><?=htmlspecialchars($pkg['name'])?> (<?=$pkg['duration_months']?> شهور)</option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>تاريخ ووقت انتهاء الاشتراك</label>
                        <input type="datetime-local" name="expires_at" id="editExpiresAt" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label>حالة الاشتراك الإدارية</label>
                        <select name="status" id="editStatus" class="form-control" required>
                            <option value="active">✅ نشط وسارٍ</option>
                            <option value="frozen">❄️ مُجمد (إيقاف حساب الأيام)</option>
                            <option value="cancelled">⛔ ملغى (حظر الدخول وتسجيله كـ ملغى)</option>
                            <option value="expired">❌ منتهي الصلاحية</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-cancel" onclick="closeModal('editModal')">إلغاء</button>
                    <button type="submit" class="btn-submit"><i class="fas fa-save"></i> حفظ التغيرات</button>
                </div>
            </form>
        </div>
    </div>

    <!-- نافذة كتابة الرسالة المخصصة Modal -->
    <div class="modal-overlay" id="msgModal">
        <div class="modal-box">
            <div class="modal-header">
                <div class="modal-title"><i class="fas fa-comment-dots"></i> إرسال رسالة مخصصة للمعلم <span id="msgTeacherName"></span></div>
                <button class="modal-close" onclick="closeModal('msgModal')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action_save_message" value="1">
                    <input type="hidden" name="user_id" id="msgUserId">

                    <div class="form-group">
                        <label>نص الرسالة المنبثقة (Popup Message)</label>
                        <textarea name="message_text" id="msgText" class="form-control" placeholder="أدخل نص التنبيه أو الرسالة التي ستظهر للمعلم فور دخوله للمنصة..."></textarea>
                    </div>

                    <label class="checkbox-group">
                        <input type="checkbox" name="show_once" id="msgShowOnce" value="1" checked>
                        <div>
                            <strong>تظهر مرة واحدة فقط (عدم التكرار)</strong>
                            <div style="font-size: 0.78rem; color: #64748b;">تظهر الرسالة للمعلم أول مرة فقط وتختفي ولا تظهر مجدداً فور قراءتها.</div>
                        </div>
                    </label>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-cancel" onclick="closeModal('msgModal')">إلغاء</button>
                    <button type="submit" class="btn-submit"><i class="fas fa-paper-plane"></i> حفظ وإرسال الرسالة</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function openEditModal(sub) {
            document.getElementById('editUserId').value = sub.user_id;
            document.getElementById('modalTeacherName').textContent = '#' + sub.user_id + ' (' + (sub.teacher_name || 'معلم') + ')';
            document.getElementById('editPackageId').value = sub.package_id;
            
            // Format datetime-local
            if (sub.expires_at) {
                var dt = new Date(sub.expires_at);
                var yr = dt.getFullYear();
                var mo = String(dt.getMonth() + 1).padStart(2, '0');
                var da = String(dt.getDate()).padStart(2, '0');
                var hr = String(dt.getHours()).padStart(2, '0');
                var mi = String(dt.getMinutes()).padStart(2, '0');
                document.getElementById('editExpiresAt').value = yr + '-' + mo + '-' + da + 'T' + hr + ':' + mi;
            }
            
            document.getElementById('editStatus').value = sub.status || (sub.is_frozen ? 'frozen' : 'active');
            document.getElementById('editModal').classList.add('active');
        }

        function openMsgModal(sub) {
            document.getElementById('msgUserId').value = sub.user_id;
            document.getElementById('msgTeacherName').textContent = '#' + sub.user_id + ' (' + (sub.teacher_name || 'معلم') + ')';
            document.getElementById('msgText').value = sub.admin_message || '';
            document.getElementById('msgShowOnce').checked = (sub.message_show_once != 0);
            document.getElementById('msgModal').classList.add('active');
        }

        function closeModal(id) {
            document.getElementById(id).classList.remove('active');
        }

        // Close modal when clicking outside box
        window.onclick = function(event) {
            if (event.target.classList.contains('modal-overlay')) {
                event.target.classList.remove('active');
            }
        };
    </script>
</body>
</html>
