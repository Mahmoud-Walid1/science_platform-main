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
    <title>المختبر الافتراضي | <?=SITE_NAME?></title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --teal-900: #002d3d; --teal-800: #004e66; --teal-700: #006b8a; --teal-600: #0089ae;
            --teal-500: #00a8d4; --gray-50: #f8fafc; --gray-100: #f1f5f9; --gray-200: #e2e8f0;
            --gray-600: #475569; --gray-800: #1e293b;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Cairo', sans-serif; background: #f8fafc; color: #1e293b; min-height: 100vh; }
        
        .site-header {
            background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 0 32px; height: 68px;
            display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .header-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .header-logo img { height: 38px; }
        .header-brand { font-weight: 800; color: var(--teal-900); font-size: 1rem; }
        
        .header-actions { display: flex; align-items: center; gap: 10px; }
        .user-pill {
            display: flex; align-items: center; gap: 8px; background: #f1f5f9; padding: 6px 14px;
            border-radius: 100px; font-size: 0.82rem; font-weight: 700; color: #334155;
        }
        .days-pill {
            background: #fef3c7; color: #92400e; padding: 6px 12px; border-radius: 100px;
            font-size: 0.8rem; font-weight: 800; border: 1px solid #fde68a;
        }
        .btn-action {
            display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 10px;
            font-size: 0.82rem; font-weight: 700; text-decoration: none; transition: 0.2s; border: none; cursor: pointer;
        }
        .btn-back { background: var(--teal-800); color: white; }
        .btn-back:hover { background: var(--teal-900); }
        .btn-recharge-toggle { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .btn-recharge-toggle:hover { background: #bae6fd; }

        .container { max-width: 1100px; margin: 32px auto; padding: 0 24px; }
        
        /* شحن الكارت الهادئ البسيط */
        .recharge-drawer {
            background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; margin-bottom: 28px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.03); display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
        }
        .recharge-info h3 { font-size: 0.98rem; font-weight: 800; color: var(--teal-900); }
        .recharge-info p { font-size: 0.8rem; color: #64748b; }
        .recharge-form-inline { display: flex; gap: 10px; flex: 1; max-width: 480px; }
        .recharge-input {
            flex: 1; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-weight: 700; font-size: 0.88rem; outline: none;
        }
        .recharge-input:focus { border-color: var(--teal-600); }
        .recharge-btn {
            padding: 10px 18px; background: var(--teal-800); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; white-space: nowrap;
        }

        .section-heading { font-size: 1.3rem; font-weight: 800; color: var(--teal-900); margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 20px; }
        .card {
            background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;
            text-decoration: none; color: inherit; transition: 0.2s; display: flex; flex-direction: column; gap: 12px;
        }
        .card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); border-color: var(--teal-500); }
        .card-icon {
            width: 48px; height: 48px; background: #e6f7fc; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--teal-700); font-size: 1.2rem;
        }
        .card-title { font-weight: 800; font-size: 1rem; color: #0f172a; }
        .card.disabled { opacity: 0.6; pointer-events: none; background: #f8fafc; }
        .card-status { font-size: 0.72rem; color: #dc2626; font-weight: 700; margin-top: 2px; }

        .alert-toast {
            padding: 12px 16px; border-radius: 10px; font-weight: 700; margin-bottom: 20px; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;
        }
        .alert-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .alert-danger { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-warning { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    </style>
</head>
<body>
    <header class="site-header">
        <a href="index.php" class="header-logo">
            <img src="logo2.png" alt="logo" onerror="this.style.display='none'">
            <span class="header-brand"><?=SITE_NAME?></span>
        </a>

        <div class="header-actions">
            <div class="user-pill">
                <i class="fas fa-user"></i>
                <span>أهلاً بك أستاذ <?=htmlspecialchars($user_name)?></span>
            </div>

            <div class="days-pill">
                <i class="fas fa-clock"></i>
                <span>الرصيد: <?=htmlspecialchars($days_left)?> يوم</span>
            </div>

            <a href="https://sabir511-platform.vercel.app/dashboard" class="btn-action btn-back">
                <i class="fas fa-arrow-right"></i>
                <span>العودة للمنصة</span>
            </a>
        </div>
    </header>

    <div class="container">
        <?php if (isset($_GET['msg']) && $_GET['msg'] === 'redeemed'): ?>
            <div class="alert-toast alert-success">
                <i class="fas fa-check-circle"></i>
                <span>تم شحن الكود بنجاح إضافة مدة الاشتراك لحسابك!</span>
            </div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="alert-toast alert-danger">
                <i class="fas fa-exclamation-circle"></i>
                <span><?=htmlspecialchars($error)?></span>
            </div>
        <?php endif; ?>

        <?php if (!$is_subscribed): ?>
            <div class="alert-toast alert-warning">
                <i class="fas fa-info-circle"></i>
                <span>حسابك غير مشترك حالياً، أدخل كود التفعيل أدناه لتنشيط التجارب.</span>
            </div>
        <?php endif; ?>

        <!-- شريط شحن الكود الهادئ -->
        <div class="recharge-drawer">
            <div class="recharge-info">
                <h3><i class="fas fa-key" style="color: var(--teal-600);"></i> شحن كود الاشتراك</h3>
                <p>أدخل كود الشحن لإضافة تمديد لمدّة رصيدك بالشهور</p>
            </div>
            <form method="POST" action="" class="recharge-form-inline">
                <input type="text" name="code" class="recharge-input" placeholder="SCI-XXXX-XXXX" required autocomplete="off">
                <button type="submit" class="recharge-btn"><i class="fas fa-bolt"></i> تفعيل الكود</button>
            </form>
        </div>

        <div class="section-heading">
            <i class="fas fa-flask" style="color: var(--teal-700);"></i>
            <span>التجارب العلمية المتاحة</span>
        </div>

        <div class="grid">
            <?php while ($exp = mysqli_fetch_assoc($experiments)): ?>
                <?php if ($exp['is_active']): ?>
                    <?php if ($is_subscribed): ?>
                        <a href="<?=htmlspecialchars($exp['page_url'])?>" class="card">
                            <div class="card-icon">
                                <?php if ($exp['image_url']): ?>
                                    <img src="<?=htmlspecialchars($exp['image_url'])?>" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">
                                <?php else: ?>
                                    <i class="fas fa-flask"></i>
                                <?php endif; ?>
                            </div>
                            <div class="card-title"><?=htmlspecialchars($exp['title'])?></div>
                        </a>
                    <?php else: ?>
                        <div class="card disabled">
                            <div class="card-icon"><i class="fas fa-lock"></i></div>
                            <div class="card-title"><?=htmlspecialchars($exp['title'])?></div>
                            <span class="card-status">مطلوب شحن كود الاشتراك</span>
                        </div>
                    <?php endif; ?>
                <?php else: ?>
                    <div class="card disabled">
                        <div class="card-icon"><i class="fas fa-lock"></i></div>
                        <div class="card-title"><?=htmlspecialchars($exp['title'])?></div>
                        <span class="card-status">متوقفة مؤقتًا</span>
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