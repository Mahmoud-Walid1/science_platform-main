<?php
require_once 'config.php';
require_once 'functions.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$user_id = $_SESSION['user_id'] ?? $_SESSION['user']['id'] ?? null;
if (!$user_id) {
    header("Location: index.php");
    exit();
}

$user_name = $_SESSION['user']['name'] ?? $_SESSION['user_name'] ?? 'معلم معتمد';
$user_contact = $_SESSION['user']['whatsappNumber'] ?? $_SESSION['user']['phone'] ?? $_SESSION['user']['email'] ?? '';

$sub = getUserSubscription($user_id);
$is_subscribed = ($sub && !empty($sub['is_valid']));
$days_left = 0;

if ($is_subscribed && !empty($sub['expires_at'])) {
    $days_left = max(0, (int)ceil((strtotime($sub['expires_at']) - time()) / 86400));
}

// معالجة نموذج شحن كود التفعيل
$error = '';
$success_msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['code'])) {
    $code = trim($_POST['code']);
    $result = redeemCode($code, $user_id);
    if ($result['success']) {
        header("Location: my-experiments.php?msg=redeemed");
        exit();
    } else {
        $error = $result['message'];
    }
}

$experiments = mysqli_query($conn, "SELECT id, title, page_url, image_url, is_active FROM experiments ORDER BY id ASC");
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة التجارب الافتراضية | <?=SITE_NAME?></title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --teal-900: #002d3d; --teal-800: #004e66; --teal-700: #006b8a; --teal-600: #0089ae;
            --teal-500: #00a8d4; --teal-100: #e6f7fc; --gray-50: #f8fafc; --gray-200: #e2e8f0;
            --gray-600: #475569; --gray-800: #1e293b;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Cairo', sans-serif; background: var(--gray-50); color: var(--gray-800); min-height: 100vh; }
        .site-header {
            background: white; border-bottom: 3px solid var(--teal-800); padding: 0 32px; height: 75px;
            display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
        }
        .header-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .header-logo img { height: 44px; }
        .header-title { font-weight: 800; color: var(--teal-800); font-size: 1.1rem; }
        .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .badge {
            padding: 8px 16px; border-radius: 100px; font-size: 0.82rem; font-weight: 700;
            display: inline-flex; align-items: center; gap: 8px; text-decoration: none; border: 1px solid transparent;
        }
        .badge-user { background: #dcfce7; color: #166534; border-color: #86efac; }
        .badge-days { background: #fef3c7; color: #92400e; border-color: #fcd34d; font-weight: 800; }
        .btn-back { background: var(--teal-800); color: white; border-color: var(--teal-700); transition: 0.2s; }
        .btn-back:hover { background: var(--teal-900); }
        .container { max-width: 1100px; margin: 36px auto; padding: 0 24px; }
        .page-header-box {
            display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 28px;
        }
        .page-title { font-size: 1.5rem; font-weight: 800; color: var(--teal-800); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
        .card {
            background: white; border: 1px solid var(--gray-200); border-radius: 18px; padding: 24px;
            text-decoration: none; color: inherit; transition: 0.2s; display: flex; flex-direction: column; gap: 12px;
            position: relative; overflow: hidden;
        }
        .card:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(0,78,102,0.12); border-color: var(--teal-500); }
        .card-icon { width: 56px; height: 56px; background: var(--teal-100); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--teal-700); font-size: 1.4rem; }
        .card-title { font-weight: 800; font-size: 1.05rem; color: var(--teal-900); }
        .card.disabled { opacity: 0.55; pointer-events: none; }
        .card-badge { font-size: 0.72rem; color: #dc2626; font-weight: 700; margin-top: 4px; display: block; }
        .recharge-box {
            background: white; border: 2px dashed var(--teal-500); border-radius: 20px; padding: 24px; margin-bottom: 32px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.02);
        }
        .recharge-title { font-size: 1.1rem; font-weight: 800; color: var(--teal-900); margin-bottom: 6px; }
        .recharge-sub { font-size: 0.85rem; color: var(--gray-600); margin-bottom: 16px; }
        .recharge-form { display: flex; gap: 12px; flex-wrap: wrap; }
        .recharge-input {
            flex: 1; min-width: 220px; padding: 12px 16px; border: 1px solid var(--gray-200); border-radius: 12px; font-weight: 700; outline: none; font-size: 0.95rem;
        }
        .recharge-input:focus { border-color: var(--teal-500); }
        .recharge-btn {
            padding: 12px 24px; background: var(--teal-800); color: white; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 0.95rem;
        }
        .recharge-btn:hover { background: var(--teal-900); }
        .alert-box { padding: 14px 18px; border-radius: 12px; font-weight: 700; margin-bottom: 20px; font-size: 0.9rem; }
        .alert-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .alert-danger { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-warning { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    </style>
</head>
<body>
    <header class="site-header">
        <a href="index.php" class="header-logo">
            <img src="logo2.png" alt="logo" onerror="this.style.display='none'">
            <span class="header-title"><?=SITE_NAME?></span>
        </a>

        <div class="header-actions">
            <div class="badge badge-user">
                <i class="fas fa-user-check"></i>
                <span>أهلاً بك أستاذ <?=htmlspecialchars($user_name)?></span>
            </div>

            <div class="badge badge-days">
                <i class="fas fa-clock"></i>
                <span>الرصيد: <strong><?=htmlspecialchars($days_left)?></strong> يوم</span>
            </div>

            <a href="https://sabir511-platform.vercel.app/dashboard" class="badge btn-back">
                <i class="fas fa-arrow-right"></i>
                <span>العودة للمنصة الرئيسية</span>
            </a>
        </div>
    </header>

    <div class="container">
        <?php if (isset($_GET['msg']) && $_GET['msg'] === 'redeemed'): ?>
            <div class="alert-box alert-success">
                🎉 تم شحن الكود بنجاح وإضافة مدة الاشتراك إلى حسابك!
            </div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="alert-box alert-danger">
                <?=$error?>
            </div>
        <?php endif; ?>

        <?php if (!$is_subscribed): ?>
            <div class="alert-box alert-warning">
                ⚠️ تنبيه: حسابك غير مشترك حالياً أو انتهى رصيد الاشتراك. يرجى إدخال كود التفعيل أدناه لتشغيل التجارب العلمية.
            </div>
        <?php endif; ?>

        <!-- كارت شحن الكود للمعلم المسجل -->
        <div class="recharge-box">
            <div class="recharge-title"><i class="fas fa-key" style="color: var(--teal-600);"></i> شحن كود تفعيل الاشتراك</div>
            <div class="recharge-sub">أدخل كود الشحن لإضافة تمديد بالشهور لرصيد حسابك في المنصة</div>
            <form method="POST" action="" class="recharge-form">
                <input type="text" name="code" class="recharge-input" placeholder="SCI-XXXX-XXXX" required autocomplete="off">
                <button type="submit" class="recharge-btn"><i class="fas fa-bolt"></i> شحن وتفعيل الكود</button>
            </form>
        </div>

        <div class="page-header-box">
            <div class="page-title"><i class="fas fa-vials"></i> التجارب العلمية المتاحة</div>
        </div>

        <div class="grid">
            <?php while ($exp = mysqli_fetch_assoc($experiments)): ?>
                <?php if ($exp['is_active']): ?>
                    <?php if ($is_subscribed): ?>
                        <a href="<?=htmlspecialchars($exp['page_url'])?>" class="card">
                            <div class="card-icon">
                                <?php if ($exp['image_url']): ?>
                                    <img src="<?=htmlspecialchars($exp['image_url'])?>" style="width:100%; height:100%; object-fit:cover; border-radius:14px;">
                                <?php else: ?>
                                    <i class="fas fa-flask"></i>
                                <?php endif; ?>
                            </div>
                            <div class="card-title"><?=htmlspecialchars($exp['title'])?></div>
                        </a>
                    <?php else: ?>
                        <div class="card disabled" title="يلزم شحن كود الاشتراك لتشغيل التجربة">
                            <div class="card-icon"><i class="fas fa-lock"></i></div>
                            <div class="card-title"><?=htmlspecialchars($exp['title'])?></div>
                            <span class="card-badge">يلزم شحن رصيد الاشتراك</span>
                        </div>
                    <?php endif; ?>
                <?php else: ?>
                    <div class="card disabled">
                        <div class="card-icon"><i class="fas fa-lock"></i></div>
                        <div class="card-title"><?=htmlspecialchars($exp['title'])?></div>
                        <span class="card-badge">التجربة متوقفة مؤقتًا من الإدارة</span>
                    </div>
                <?php endif; ?>
            <?php endwhile; ?>
        </div>
    </div>

    <!-- العلامة المائية لحماية شاشة المعلم -->
    <script>
        window.WATERMARK_USER = {
            name: <?=json_encode($user_name)?>,
            contact: <?=json_encode($user_contact)?>
        };
    </script>
    <script src="js/watermark.js"></script>
</body>
</html>