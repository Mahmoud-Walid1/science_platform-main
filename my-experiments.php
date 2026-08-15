<?php
require_once 'config.php';
require_once 'functions.php';

// التحقق من صحة واشتراك المستخدم
$sub = isAuthenticated();

$user_name = $_SESSION['user']['name'] ?? $_SESSION['user_name'] ?? 'معلم معتمد';
$user_contact = $_SESSION['user']['whatsappNumber'] ?? $_SESSION['user']['phone'] ?? $_SESSION['user']['email'] ?? '';

$expires_at = $sub['expires_at'] ?? null;
$experiments = mysqli_query($conn, "SELECT id, title, page_url, image_url, is_active FROM experiments ORDER BY id ASC");
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تجاربي الافتراضية | <?=SITE_NAME?></title>
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
            background: white; border-bottom: 3px solid var(--teal-800); padding: 0 40px; height: 70px;
            display: flex; align-items: center; justify-content: space-between;
        }
        .header-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .header-logo img { height: 44px; }
        .header-title { font-weight: 800; color: var(--teal-800); }
        .expiry-badge {
            background: var(--teal-100); color: var(--teal-800); padding: 6px 16px;
            border-radius: 100px; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;
        }
        .container { max-width: 1100px; margin: 40px auto; padding: 0 24px; }
        .page-title { font-size: 1.6rem; font-weight: 800; color: var(--teal-800); margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
        .card {
            background: white; border: 1px solid var(--gray-200); border-radius: 18px; padding: 24px;
            text-decoration: none; color: inherit; transition: 0.2s; display: flex; flex-direction: column; gap: 12px;
        }
        .card:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(0,78,102,0.1); border-color: var(--teal-500); }
        .card-icon { width: 50px; height: 50px; background: var(--teal-100); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--teal-700); font-size: 1.3rem; }
        .card-title { font-weight: 700; font-size: 1.05rem; }
        .card.disabled { opacity: 0.5; pointer-events: none; }
        .card-badge { font-size: 0.7rem; color: #dc2626; font-weight: 700; margin-top: 6px; display: block; }
    </style>
</head>
<body>
    <header class="site-header">
        <a href="index.php" class="header-logo">
            <img src="logo2.png" alt="logo" onerror="this.style.display='none'">
            <span class="header-title"><?=SITE_NAME?></span>
        </a>
        <div class="expiry-badge">
            <i class="fas fa-calendar-check"></i>
            <?=$sub['status_text']?>
            <?php if ($expires_at && !$sub['is_global_frozen']): ?>
                (ينتهي في <?=date('Y-m-d', strtotime($expires_at))?>)
            <?php endif; ?>
        </div>
    </header>

    <div class="container">
        <div class="page-title"><i class="fas fa-vials"></i> تجاربك المتاحة في المختبر الافتراضي</div>

        <?php if (isset($_GET['msg']) && $_GET['msg'] === 'redeemed'): ?>
            <div style="background:#dcfce7; color:#166534; padding:14px 18px; border-radius:12px; font-weight:700; margin-bottom:24px;">
                🎉 تم تفعيل شحن الكود بنجاح إضافة مدة الاشتراك لحسابك!
            </div>
        <?php endif; ?>

        <div class="grid">
            <?php while ($exp = mysqli_fetch_assoc($experiments)): ?>
                <?php if ($exp['is_active']): ?>
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
                    <div class="card disabled">
                        <div class="card-icon"><i class="fas fa-lock"></i></div>
                        <div class="card-title"><?=htmlspecialchars($exp['title'])?></div>
                        <span class="card-badge">التجربة متوقفة مؤقتًا</span>
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