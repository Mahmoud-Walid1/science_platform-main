<?php
// admin/experiments.php - إدارة التجارب العلمية وصورها وتفعيلها
require_once __DIR__ . '/auth.php';
requireAdmin();

$message = '';
$upload_dir = __DIR__ . '/../uploads/experiments/';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// معالجة طلب إعادة ترتيب التجارب عبر AJAX
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'reorder_experiments') {
    header('Content-Type: application/json; charset=utf-8');
    $order = $_POST['order'] ?? [];
    if (is_array($order) && !empty($order)) {
        ensureExperimentsSchemaUpdated();
        $stmt = $conn->prepare("UPDATE experiments SET display_order = ? WHERE id = ?");
        foreach ($order as $index => $id) {
            $order_num = $index + 1;
            $exp_id = (int)$id;
            $stmt->bind_param("ii", $order_num, $exp_id);
            $stmt->execute();
        }
        echo json_encode(['success' => true, 'message' => 'تم حفظ الترتيب الجديد بنجاح!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'بيانات الترتيب غير صحيحة']);
    }
    exit();
}

// تغيير حالة التجربة المباشر
if (isset($_GET['status']) && isset($_GET['id'])) {
    $exp_id = (int)$_GET['id'];
    $status = (int)$_GET['status'];
    if (in_array($status, [0, 1, 2])) {
        mysqli_query($conn, "UPDATE experiments SET is_active = $status WHERE id = $exp_id");
    }
    header("Location: experiments.php");
    exit();
}

// التبديل التتابعي القديم لزر toggle
if (isset($_GET['toggle'])) {
    $exp_id = (int)$_GET['toggle'];
    $res = mysqli_query($conn, "SELECT is_active FROM experiments WHERE id = $exp_id");
    if ($row = mysqli_fetch_assoc($res)) {
        $next = ($row['is_active'] == 1) ? 2 : (($row['is_active'] == 2) ? 0 : 1);
        mysqli_query($conn, "UPDATE experiments SET is_active = $next WHERE id = $exp_id");
    }
    header("Location: experiments.php");
    exit();
}

// تحديث تجربة ورفع صوره
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_exp'])) {
    $exp_id = (int)$_POST['exp_id'];
    $title = trim($_POST['title']);
    $page_url = trim($_POST['page_url'] ?? '#');
    $is_active = isset($_POST['is_active']) ? (int)$_POST['is_active'] : 1;

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
        $stmt = $conn->prepare("UPDATE experiments SET title = ?, page_url = ?, is_active = ?, image_url = ? WHERE id = ?");
        $stmt->bind_param("ssisi", $title, $page_url, $is_active, $image_path, $exp_id);
    } else {
        $stmt = $conn->prepare("UPDATE experiments SET title = ?, page_url = ?, is_active = ? WHERE id = ?");
        $stmt->bind_param("ssii", $title, $page_url, $is_active, $exp_id);
    }
    $stmt->execute();
    $message = "✅ تم تحديث التجربة بنجاح!";
}

// إضافة تجربة جديدة
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_exp'])) {
    $title = trim($_POST['title']);
    $code_name = trim($_POST['code_name']);
    $page_url = trim($_POST['page_url']);
    $is_active = isset($_POST['is_active']) ? (int)$_POST['is_active'] : 1;

    if (empty($page_url)) $page_url = '#';
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

    $stmt = $conn->prepare("INSERT INTO experiments (code_name, title, page_url, image_url, is_active) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssi", $code_name, $title, $page_url, $image_path, $is_active);
    if ($stmt->execute()) {
        $message = "🎉 تم إضافة التجربة بنجاح!";
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

        /* Reorder Controls & Card Styles */
        .reorder-hint-banner {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1e40af;
            padding: 12px 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            font-weight: 700;
            font-size: 0.92rem;
            box-shadow: 0 2px 6px rgba(30, 64, 175, 0.05);
        }
        .card-reorder-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 6px 12px;
            margin-bottom: 14px;
            gap: 8px;
        }
        .drag-handle {
            cursor: grab;
            color: #64748b;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            transition: all 0.2s;
            user-select: none;
        }
        .drag-handle:hover {
            color: var(--main);
            background: #e2e8f0;
        }
        .drag-handle:active {
            cursor: grabbing;
        }
        .order-badge {
            font-size: 0.82rem;
            font-weight: 800;
            color: #0f172a;
            background: #e2e8f0;
            padding: 2px 12px;
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .order-badge strong {
            color: var(--main);
            font-size: 1.0rem;
        }
        .reorder-arrow-btns {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .btn-arrow {
            width: 30px;
            height: 30px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #475569;
            border-radius: 6px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            transition: all 0.2s;
        }
        .btn-arrow:hover {
            background: var(--main);
            color: #ffffff;
            border-color: var(--main);
            transform: translateY(-1px);
        }
        .card.exp-sortable-card {
            transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s, border-color 0.2s;
        }
        .card.exp-sortable-card.dragging {
            opacity: 0.4;
            border: 2px dashed var(--accent);
            transform: scale(0.98);
        }
        .card.exp-sortable-card.drag-over {
            border-color: var(--accent);
            box-shadow: 0 0 18px rgba(0, 168, 212, 0.4);
            transform: translateY(-4px);
        }
        .reorder-toast {
            position: fixed;
            top: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(-60px);
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff;
            padding: 12px 28px;
            border-radius: 50px;
            font-weight: 800;
            font-size: 0.95rem;
            box-shadow: 0 12px 28px rgba(16, 185, 129, 0.35);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 99999;
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reorder-toast.active {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-brand"><i class="fas fa-flask"></i> لوحة المختبرات</div>
        <a href="index.php" class="nav-item"><i class="fas fa-chart-line"></i> الملخص والأداء</a>
        <a href="manage_subscriptions.php" class="nav-item"><i class="fas fa-id-card"></i> إدارة اشتراكات المعلمين</a>
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
            <form method="POST" enctype="multipart/form-data" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; align-items: end;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label>عنوان التجربة</label>
                    <input type="text" name="title" placeholder="مثال: التسامي والتبخر" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>المعرف (Code Name)</label>
                    <input type="text" name="code_name" placeholder="مثال: evaporation_exp" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>رابط الصفحة (اختياري لقيد التنفيذ)</label>
                    <input type="text" name="page_url" placeholder="experiments/ph_v2.php">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>حالة التجربة</label>
                    <select name="is_active" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; font-family: 'Cairo'; font-weight: 700;">
                        <option value="1">✅ نشطة ومتاحة للمعلمين</option>
                        <option value="2" selected>⏳ قيد التنفيذ (تشويق قريباً)</option>
                        <option value="0">❌ معطلة ومخفية</option>
                    </select>
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

        <!-- تنبيه وتعليمات إعادة الترتيب -->
        <div class="reorder-hint-banner">
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-arrows-up-down-left-right" style="font-size: 1.2rem; color: var(--accent);"></i>
                <span><strong>إعادة ترتيب ظهور التجارب:</strong> يمكنك سحب وإفلات البطاقات بالماوس أو استخدام أزرار الأسهم (▲ / ▼)، ويتم حفظ الترتيب الجديد تلقائياً وفورياً.</span>
            </div>
            <span style="font-size: 0.85rem; color: #64748b; background: white; padding: 4px 12px; border-radius: 20px; border: 1px solid #cbd5e1;">حفظ تلقائي (Auto-Save)</span>
        </div>

        <div class="grid" id="experimentsGrid">
            <?php foreach ($experiments as $idx => $exp): ?>
                <div class="card exp-sortable-card" draggable="true" data-id="<?=$exp['id']?>">
                    <!-- شريط أدوات التحكم في الترتيب -->
                    <div class="card-reorder-toolbar">
                        <div class="drag-handle" title="اسحب بالماوس أو اللمس لإعادة الترتيب">
                            <i class="fas fa-grip-vertical"></i>
                        </div>
                        <span class="order-badge">الترتيب: #<strong class="order-num"><?=$idx + 1?></strong></span>
                        <div class="reorder-arrow-btns">
                            <button type="button" class="btn-arrow btn-up" title="تقديم للأعلى" onclick="moveCard(this, -1)">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                            <button type="button" class="btn-arrow btn-down" title="تأخير للأسفل" onclick="moveCard(this, 1)">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                    </div>

                    <div class="card-header">
                        <div class="card-title"><?=htmlspecialchars($exp['title'])?></div>
                        <div>
                            <?php if ($exp['is_active'] == 1): ?>
                                <span style="background:#dcfce7; color:#166534; padding:4px 10px; border-radius:8px; font-weight:700; font-size:0.8rem;"><i class="fas fa-check-circle"></i> متاحة</span>
                            <?php elseif ($exp['is_active'] == 2): ?>
                                <span style="background:#fef3c7; color:#92400e; padding:4px 10px; border-radius:8px; font-weight:700; font-size:0.8rem;"><i class="fas fa-hourglass-half"></i> قيد التنفيذ</span>
                            <?php else: ?>
                                <span style="background:#f1f5f9; color:#64748b; padding:4px 10px; border-radius:8px; font-weight:700; font-size:0.8rem;"><i class="fas fa-ban"></i> معطلة</span>
                            <?php endif; ?>
                        </div>
                    </div>

                    <form method="POST" enctype="multipart/form-data">
                        <input type="hidden" name="exp_id" value="<?=$exp['id']?>">
                        <div class="form-group">
                            <label>عنوان التجربة</label>
                            <input type="text" name="title" value="<?=htmlspecialchars($exp['title'])?>" required>
                        </div>
                        <div class="form-group">
                            <label>رابط صفحة التجربة</label>
                            <input type="text" name="page_url" value="<?=htmlspecialchars($exp['page_url'])?>">
                        </div>
                        <div class="form-group">
                            <label>حالة التجربة</label>
                            <select name="is_active" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; font-family: 'Cairo'; font-weight: 700;">
                                <option value="1" <?=$exp['is_active'] == 1 ? 'selected' : ''?>>✅ نشطة ومتاحة</option>
                                <option value="2" <?=$exp['is_active'] == 2 ? 'selected' : ''?>>⏳ قيد التنفيذ (قريباً)</option>
                                <option value="0" <?=$exp['is_active'] == 0 ? 'selected' : ''?>>❌ معطلة ومخفية</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>صورة المعاينة (اختياري)</label>
                            <input type="file" name="exp_image" accept="image/*">
                        </div>
                        <?php if ($exp['image_url']): ?>
                            <div style="margin-bottom:12px;"><img src="../<?=htmlspecialchars($exp['image_url'])?>" style="height:60px; border-radius:8px;"></div>
                        <?php endif; ?>
                        <button type="submit" name="update_exp" class="btn" style="width:100%;"><i class="fas fa-save"></i> حفظ التعديلات</button>
                    </form>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Floating Success Toast -->
    <div id="reorderToast" class="reorder-toast">
        <i class="fas fa-check-circle"></i>
        <span id="reorderToastText">تم حفظ الترتيب الجديد بنجاح!</span>
    </div>

    <!-- Interactive Drag & Drop Reorder Scripts -->
    <script>
    let draggedCard = null;

    function initSortableCards() {
        const grid = document.getElementById('experimentsGrid');
        if (!grid) return;

        const cards = grid.querySelectorAll('.exp-sortable-card');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                // Don't drag if interacting with inputs or buttons
                if (['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(e.target.tagName)) {
                    e.preventDefault();
                    return;
                }
                draggedCard = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', card.dataset.id);
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                cards.forEach(c => c.classList.remove('drag-over'));
                draggedCard = null;
                saveNewOrder();
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (draggedCard && draggedCard !== card) {
                    card.classList.add('drag-over');
                }
            });

            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over');
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                if (draggedCard && draggedCard !== card) {
                    const rect = card.getBoundingClientRect();
                    const next = (e.clientX - rect.left) / (rect.right - rect.left) < 0.5;
                    grid.insertBefore(draggedCard, next ? card.nextSibling : card);
                    updateOrderBadges();
                }
            });
        });
    }

    function moveCard(button, direction) {
        const card = button.closest('.exp-sortable-card');
        const grid = document.getElementById('experimentsGrid');
        if (!card || !grid) return;

        if (direction === -1 && card.previousElementSibling) {
            grid.insertBefore(card, card.previousElementSibling);
            updateOrderBadges();
            saveNewOrder();
        } else if (direction === 1 && card.nextElementSibling) {
            grid.insertBefore(card.nextElementSibling, card);
            updateOrderBadges();
            saveNewOrder();
        }
    }

    function updateOrderBadges() {
        const cards = document.querySelectorAll('#experimentsGrid .exp-sortable-card');
        cards.forEach((card, idx) => {
            const badge = card.querySelector('.order-num');
            if (badge) badge.innerText = idx + 1;
        });
    }

    function saveNewOrder() {
        updateOrderBadges();
        const cards = document.querySelectorAll('#experimentsGrid .exp-sortable-card');
        const order = Array.from(cards).map(c => c.dataset.id);

        const formData = new FormData();
        formData.append('action', 'reorder_experiments');
        order.forEach(id => formData.append('order[]', id));

        fetch('experiments.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showReorderToast(data.message || 'تم حفظ الترتيب الجديد بنجاح!');
            }
        })
        .catch(err => {
            console.error('Error saving order:', err);
        });
    }

    function showReorderToast(msg) {
        const toast = document.getElementById('reorderToast');
        const text = document.getElementById('reorderToastText');
        if (!toast) return;
        if (text) text.innerText = msg;
        toast.classList.add('active');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('active');
        }, 2800);
    }

    document.addEventListener('DOMContentLoaded', initSortableCards);
    </script>
</body>
</html>
