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

// Auto sync title for photosynthesis_elementary in database
@mysqli_query($conn, "UPDATE experiments SET title = 'رحلة غذاء النبات ونموه' WHERE code_name IN ('photosynthesis_elementary', 'photosynthesis-elementary') AND title != 'رحلة غذاء النبات ونموه'");

$experiments = mysqli_query($conn, "SELECT id, code_name, title, page_url, image_url, is_active FROM experiments ORDER BY id ASC");
$exps_list = [];
while ($row = mysqli_fetch_assoc($experiments)) {
    if ($row['code_name'] === 'photosynthesis_elementary' || $row['code_name'] === 'photosynthesis-elementary') {
        $row['title'] = 'رحلة غذاء النبات ونموه';
    }
    $exps_list[] = $row;
}

// جلب باقات الشراء المتاحة
$available_packages = mysqli_query($conn, "SELECT name, duration_months, store_url FROM packages WHERE is_active = 1 ORDER BY duration_months ASC");

// تعيين الأيقونات والألوان المميزة للتجارب
function getExpVisuals($code_name, $title) {
    if (strpos($code_name, 'matter') !== false || strpos($title, 'المادة') !== false) {
        return ['icon' => 'fas fa-atom', 'bg' => 'linear-gradient(135deg, #e0f2fe, #bae6fd)', 'color' => '#0284c7'];
    }
    if (strpos($code_name, 'circuit') !== false || strpos($title, 'الكهربائ') !== false) {
        return ['icon' => 'fas fa-bolt', 'bg' => 'linear-gradient(135deg, #fef3c7, #fde68a)', 'color' => '#d97706'];
    }
    if (strpos($code_name, 'magnet') !== false || strpos($title, 'المغناطيس') !== false) {
        return ['icon' => 'fas fa-magnet', 'bg' => 'linear-gradient(135deg, #f3e8ff, #e9d5ff)', 'color' => '#7e22ce'];
    }
    if (strpos($code_name, 'newton') !== false || strpos($title, 'نيوتن') !== false) {
        return ['icon' => 'fas fa-running', 'bg' => 'linear-gradient(135deg, #dcfce7, #bbf7d0)', 'color' => '#15803d'];
    }
    if (strpos($code_name, 'prism') !== false || strpos($title, 'المنشور') !== false) {
        return ['icon' => 'fas fa-rainbow', 'bg' => 'linear-gradient(135deg, #ffedd5, #fed7aa)', 'color' => '#c2410c'];
    }
    if (strpos($code_name, 'separation') !== false || strpos($title, 'المخاليط') !== false) {
        return ['icon' => 'fas fa-vial-circle-check', 'bg' => 'linear-gradient(135deg, #fce7f3, #fbcfe8)', 'color' => '#be185d'];
    }
    return ['icon' => 'fas fa-flask', 'bg' => 'linear-gradient(135deg, #e6f7fc, #7ddcf0)', 'color' => '#006b8a'];
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مختبر العلوم الافتراضي | <?=SITE_NAME?></title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #004e66;
            --primary-dark: #002d3d;
            --accent: #00a8d4;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text-dark: #0f172a;
            --text-muted: #64748b;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Cairo', sans-serif; background: var(--bg); color: var(--text-dark); min-height: 100vh; overflow-x: hidden; }

        /* ═══ HEADER ═══ */
        .site-header {
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            padding: 0 36px;
            height: 72px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.02);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .header-logo img { height: 42px; object-fit: contain; }
        .header-brand { font-weight: 900; color: var(--primary-dark); font-size: 1.05rem; }
        .header-sub { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; }

        .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        
        .user-chip {
            display: flex; align-items: center; gap: 8px; background: #f0fdf4; color: #166534;
            border: 1px solid #bbf7d0; padding: 6px 16px; border-radius: 100px; font-size: 0.82rem; font-weight: 700;
        }

        .days-chip {
            display: flex; align-items: center; gap: 6px; background: #fef3c7; color: #92400e;
            border: 1px solid #fde68a; padding: 6px 14px; border-radius: 100px; font-size: 0.82rem; font-weight: 800;
        }

        .btn-buy-store {
            display: inline-flex; align-items: center; gap: 6px; background: #f59e0b; color: #78350f;
            border: 1px solid #fcd34d; padding: 7px 16px; border-radius: 100px; font-size: 0.82rem; font-weight: 900;
            cursor: pointer; transition: 0.2s;
        }
        .btn-buy-store:hover { background: #fbbf24; transform: scale(1.02); }

        .btn-back-platform {
            display: inline-flex; align-items: center; gap: 8px; background: var(--primary);
            color: white; padding: 8px 18px; border-radius: 12px; font-size: 0.85rem; font-weight: 700;
            text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,78,102,0.15);
        }
        .btn-back-platform:hover { background: var(--primary-dark); transform: translateY(-1px); }

        /* ═══ CONTAINER ═══ */
        .main-wrapper { max-width: 1140px; margin: 32px auto; padding: 0 24px; }

        /* ═══ HERO BANNER ═══ */
        .hero-dashboard {
            background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
            border-radius: 24px;
            padding: 32px 36px;
            color: white;
            position: relative;
            overflow: hidden;
            box-shadow: 0 12px 32px rgba(0,45,61,0.15);
            margin-bottom: 32px;
        }
        .hero-dashboard::after {
            content: ''; position: absolute; -top: 50px; -left: 50px; width: 220px; height: 220px;
            background: rgba(255,255,255,0.05); border-radius: 50%; pointer-events: none;
        }

        .hero-content { position: relative; z-index: 2; max-width: 700px; }
        .hero-title { font-size: 1.6rem; font-weight: 900; margin-bottom: 8px; line-height: 1.3; }
        .hero-desc { font-size: 0.88rem; color: rgba(255,255,255,0.85); line-height: 1.6; margin-bottom: 24px; }

        .recharge-bar {
            display: flex; gap: 10px; background: rgba(255,255,255,0.12); backdrop-filter: blur(10px);
            padding: 8px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.2); flex-wrap: wrap;
        }
        .recharge-input {
            flex: 1; min-width: 200px; background: white; border: none; padding: 10px 16px; border-radius: 12px;
            font-size: 0.9rem; font-weight: 700; outline: none; color: var(--text-dark);
        }
        .recharge-btn {
            background: #f59e0b; color: #78350f; border: none; padding: 10px 20px; border-radius: 12px;
            font-weight: 900; font-size: 0.88rem; cursor: pointer; transition: 0.2s; white-space: nowrap;
            display: flex; align-items: center; gap: 6px;
        }
        .recharge-btn:hover { background: #fbbf24; transform: scale(1.02); }

        .btn-buy-modal-trigger {
            background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4);
            padding: 10px 18px; border-radius: 12px; font-weight: 800; font-size: 0.85rem; cursor: pointer;
            transition: 0.2s; display: flex; align-items: center; gap: 6px; white-space: nowrap;
        }
        .btn-buy-modal-trigger:hover { background: rgba(255,255,255,0.3); }

        /* ═══ TOAST ALERTS ═══ */
        .toast-msg {
            padding: 14px 20px; border-radius: 14px; font-weight: 700; font-size: 0.88rem; margin-bottom: 24px;
            display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .toast-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .toast-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .toast-warning { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }

        /* ═══ SECTION HEADER & SEARCH ═══ */
        .section-bar {
            display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 24px;
        }
        .section-title { font-size: 1.3rem; font-weight: 900; color: var(--primary-dark); display: flex; align-items: center; gap: 10px; }
        .search-wrap { position: relative; width: 280px; }
        .search-input {
            width: 100%; padding: 10px 14px 10px 38px; border: 1px solid #cbd5e1; border-radius: 12px;
            font-size: 0.85rem; font-weight: 700; outline: none; background: white; transition: 0.2s;
        }
        .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,168,212,0.15); }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.85rem; }

        /* ═══ EXPERIMENT CARDS GRID ═══ */
        .exp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 24px; }
        
        .exp-card {
            background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px;
            text-decoration: none; color: inherit; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex; flex-direction: column; justify-content: space-between; height: 210px;
            position: relative; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.02);
        }
        .exp-card::before {
            content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--accent)); transform: scaleX(0); transition: transform 0.3s;
        }
        .exp-card:hover {
            transform: translateY(-6px); border-color: var(--accent); box-shadow: 0 14px 28px rgba(0,78,102,0.12);
        }
        .exp-card:hover::before { transform: scaleX(1); }

        .card-top { display: flex; align-items: flex-start; justify-content: space-between; }
        
        .exp-icon-box {
            width: 58px; height: 58px; border-radius: 16px; display: flex; align-items: center; justify-content: center;
            font-size: 1.5rem; transition: transform 0.3s; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .exp-card:hover .exp-icon-box { transform: scale(1.08) rotate(4deg); }

        .exp-badge-active {
            background: #dcfce7; color: #166534; font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 100px;
        }
        .exp-badge-lock {
            background: #fef2f2; color: #dc2626; font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 100px;
        }
        .exp-badge-coming {
            background: #fef3c7; color: #b45309; font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 100px; border: 1px solid #fde68a;
        }
        .exp-card.coming-soon {
            background: #fffbeb; border: 1px dashed #f59e0b; cursor: default;
        }
        .exp-card.coming-soon:hover {
            transform: none; box-shadow: 0 4px 14px rgba(0,0,0,0.02); border-color: #f59e0b;
        }

        .exp-card-name { font-size: 1.1rem; font-weight: 900; color: var(--primary-dark); margin-top: 12px; line-height: 1.3; }
        
        .card-bottom {
            display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; font-weight: 700;
            color: var(--primary); border-top: 1px solid #f1f5f9; pt: 12px; margin-top: auto; padding-top: 12px;
        }
        .card-bottom i { transition: transform 0.2s; }
        .exp-card:hover .card-bottom i { transform: translateX(-4px); }

        .exp-card.disabled { opacity: 0.65; pointer-events: none; background: #f8fafc; }

        /* ═══ STORE PACKAGES MODAL ═══ */
        .pkg-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15,23,42,0.6);
            backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center;
            z-index: 9999; opacity: 0; pointer-events: none; transition: opacity 0.3s; padding: 20px;
        }
        .pkg-modal-overlay.open { opacity: 1; pointer-events: auto; }
        
        .pkg-modal-box {
            background: white; border-radius: 24px; padding: 32px; max-width: 520px; width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2); position: relative; transform: translateY(20px); transition: transform 0.3s;
        }
        .pkg-modal-overlay.open .pkg-modal-box { transform: translateY(0); }
        
        .pkg-modal-close {
            position: absolute; top: 20px; left: 20px; background: #f1f5f9; border: none; width: 36px; height: 36px;
            border-radius: 50%; cursor: pointer; font-size: 1rem; color: #64748b; transition: 0.2s;
        }
        .pkg-modal-close:hover { background: #e2e8f0; color: #0f172a; }

        .pkg-modal-title { font-size: 1.4rem; font-weight: 900; color: var(--primary-dark); margin-bottom: 6px; }
        .pkg-modal-sub { font-size: 0.85rem; color: #64748b; margin-bottom: 24px; line-height: 1.5; }

        .pkg-option {
            display: flex; align-items: center; justify-content: space-between; gap: 16px;
            background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px 20px; border-radius: 16px; margin-bottom: 14px;
        }
        .pkg-option-name { font-weight: 800; font-size: 1rem; color: var(--primary-dark); }
        .pkg-option-duration { font-size: 0.78rem; color: #64748b; margin-top: 2px; }
        .pkg-option-btn {
            background: #f59e0b; color: #78350f; text-decoration: none; padding: 10px 18px; border-radius: 12px;
            font-weight: 900; font-size: 0.85rem; transition: 0.2s; white-space: nowrap;
        }
        .pkg-option-btn:hover { background: #fbbf24; transform: scale(1.03); }
    </style>
</head>
<body>

    <!-- HEADER -->
    <header class="site-header">
        <a href="index.php" class="header-logo">
            <img src="logo2.png" alt="logo" onerror="this.style.display='none'">
            <div>
                <div class="header-brand"><?=SITE_NAME?></div>
                <div class="header-sub">بيئة المحاكاة المعملية الفائقة</div>
            </div>
        </a>

        <div class="header-actions">
            <div class="user-chip">
                <i class="fas fa-user-check"></i>
                <span>أهلاً أستاذ <?=htmlspecialchars($user_name)?></span>
            </div>

            <div class="days-chip">
                <i class="fas fa-clock"></i>
                <span>الرصيد: <?=htmlspecialchars($days_left)?> يوم</span>
            </div>

            <button type="button" class="btn-buy-store" onclick="openPackagesModal()">
                <i class="fas fa-shopping-cart"></i>
                <span>شراء كود جديد</span>
            </button>

            <a href="https://sabir511-platform.vercel.app/dashboard" class="btn-back-platform">
                <i class="fas fa-arrow-right"></i>
                <span>العودة للمنصة</span>
            </a>
        </div>
    </header>

    <!-- MAIN WRAPPER -->
    <div class="main-wrapper">

        <?php if (isset($_GET['msg']) && $_GET['msg'] === 'redeemed'): ?>
            <div class="toast-msg toast-success">
                <i class="fas fa-check-circle"></i>
                <span>🎉 تم شحن الكود بنجاح وتراكم مدة الاشتراك في حسابك!</span>
            </div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="toast-msg toast-error">
                <i class="fas fa-circle-exclamation"></i>
                <span><?=htmlspecialchars($error)?></span>
            </div>
        <?php endif; ?>

        <?php if (!$is_subscribed): ?>
            <div class="toast-msg toast-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <span>تنبيه: حسابك غير مشترك حالياً. يمكنك الحصول على كود جديد من المتجر وشحنه أدناه لتفعيل التجارب.</span>
            </div>
        <?php endif; ?>

        <!-- HERO DASHBOARD BANNER -->
        <div class="hero-dashboard">
            <div class="hero-content">
                <h1 class="hero-title">أهلاً بك أستاذ <?=htmlspecialchars($user_name)?> 👋</h1>
                <p class="hero-desc">مرحباً بك في المختبر الافتراضي العلمي. يمكنك محاكاة جميع التجارب العلمية بدقة وأمان كامل، الشاشة محمية تلقائياً بالعلامة المائية الخاصة بك.</p>
                
                <!-- شريط شحن الكروت والـ Modal -->
                <form method="POST" action="" class="recharge-bar">
                    <input type="text" name="code" class="recharge-input" placeholder="أدخل كود الاشتراك (SCI-XXXX-XXXX)" required autocomplete="off">
                    <button type="submit" class="recharge-btn">
                        <i class="fas fa-bolt"></i>
                        <span>تفعيل الشحن</span>
                    </button>
                    <button type="button" class="btn-buy-modal-trigger" onclick="openPackagesModal()">
                        <i class="fas fa-shopping-bag"></i>
                        <span>شراء كود جديد من المتجر</span>
                    </button>
                </form>
            </div>
        </div>

        <!-- SECTION HEADER & SEARCH -->
        <div class="section-bar">
            <div class="section-title">
                <i class="fas fa-vials" style="color: var(--accent);"></i>
                <span>مكتبة التجارب العلمية المتاحة</span>
            </div>

            <div class="search-wrap">
                <input type="text" id="expSearch" class="search-input" placeholder="ابحث عن اسم التجربة..." onkeyup="filterExperiments()">
                <i class="fas fa-search search-icon"></i>
            </div>
        </div>

        <!-- EXPERIMENTS GRID (ICON CARDS) -->
        <div class="exp-grid" id="expGrid">
            <?php foreach ($exps_list as $exp): ?>
                <?php 
                    $visuals = getExpVisuals($exp['code_name'], $exp['title']); 
                ?>
                <?php if ($exp['is_active'] == 1): ?>
                    <?php if ($is_subscribed): ?>
                        <a href="<?=htmlspecialchars($exp['page_url'])?>" class="exp-card exp-item-card">
                            <div class="card-top">
                                <div class="exp-icon-box" style="background: <?=$visuals['bg']?>; color: <?=$visuals['color']?>;">
                                    <i class="<?=$visuals['icon']?>"></i>
                                </div>
                                <span class="exp-badge-active"><i class="fas fa-check"></i> متاح</span>
                            </div>
                            <div class="exp-card-name"><?=htmlspecialchars($exp['title'])?></div>
                            <div class="card-bottom">
                                <span>تشغيل التجربة الآن</span>
                                <i class="fas fa-arrow-left"></i>
                            </div>
                        </a>
                    <?php else: ?>
                        <div class="exp-card disabled exp-item-card" title="يلزم شحن كود الاشتراك لتشغيل التجربة">
                            <div class="card-top">
                                <div class="exp-icon-box" style="background: #f1f5f9; color: #94a3b8;">
                                    <i class="<?=$visuals['icon']?>"></i>
                                </div>
                                <span class="exp-badge-lock"><i class="fas fa-lock"></i> كود مطلوب</span>
                            </div>
                            <div class="exp-card-name"><?=htmlspecialchars($exp['title'])?></div>
                            <div class="card-bottom" style="color: #dc2626;">
                                <span>يلزم شحن الاشتراك</span>
                                <i class="fas fa-lock"></i>
                            </div>
                        </div>
                    <?php endif; ?>
                <?php elseif ($exp['is_active'] == 2): ?>
                    <div class="exp-card coming-soon exp-item-card" title="هذه التجربة قيد التطوير والإنتاج وستتاح للمعلمين قريباً!">
                        <div class="card-top">
                            <div class="exp-icon-box" style="background: linear-gradient(135deg, #fef3c7, #fde68a); color: #d97706;">
                                <i class="fas fa-hourglass-half"></i>
                            </div>
                            <span class="exp-badge-coming"><i class="fas fa-clock"></i> قيد التطوير</span>
                        </div>
                        <div class="exp-card-name"><?=htmlspecialchars($exp['title'])?></div>
                        <div class="card-bottom" style="color: #b45309;">
                            <span>قيد التطوير قريباً</span>
                            <i class="fas fa-hourglass-half"></i>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="exp-card disabled exp-item-card">
                        <div class="card-top">
                            <div class="exp-icon-box" style="background: #f1f5f9; color: #94a3b8;">
                                <i class="fas fa-ban"></i>
                            </div>
                            <span class="exp-badge-lock">متوقفة</span>
                        </div>
                        <div class="exp-card-name"><?=htmlspecialchars($exp['title'])?></div>
                        <div class="card-bottom" style="color: #94a3b8;">
                            <span>غير متاحة حالياً</span>
                        </div>
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>

    </div>

    <!-- مودال باقات الشراء من المتجر -->
    <div class="pkg-modal-overlay" id="pkgModal">
        <div class="pkg-modal-box">
            <button type="button" class="pkg-modal-close" onclick="closePackagesModal()"><i class="fas fa-times"></i></button>
            <div class="pkg-modal-title">شراء كود اشتراك جديد</div>
            <div class="pkg-modal-sub">اختر الباقة المناسبة وسوف يتم توجيهك فوراً لمتجرنا الرسمي لشراء كود التفعيل بالشهور</div>
            
            <?php mysqli_data_seek($available_packages, 0); while ($pk = mysqli_fetch_assoc($available_packages)): ?>
                <div class="pkg-option">
                    <div>
                        <div class="pkg-option-name"><?=htmlspecialchars($pk['name'])?></div>
                        <div class="pkg-option-duration">اشتراك وتمديد لمدة <?=$pk['duration_months']?> شهر</div>
                    </div>
                    <?php if (!empty($pk['store_url'])): ?>
                        <a href="<?=htmlspecialchars($pk['store_url'])?>" class="pkg-option-btn" target="_blank" rel="noopener">شراء الكود 🛒</a>
                    <?php else: ?>
                        <span class="pkg-option-btn" style="background:#cbd5e1; color:#475569; pointer-events:none;">قريباً</span>
                    <?php endif; ?>
                </div>
            <?php endwhile; ?>
        </div>
    </div>

    <!-- البحث المباشر في التجارب وسكريبت المودال -->
    <script>
        function openPackagesModal() { document.getElementById('pkgModal').classList.add('open'); }
        function closePackagesModal() { document.getElementById('pkgModal').classList.remove('open'); }

        function filterExperiments() {
            const input = document.getElementById('expSearch').value.toLowerCase().trim();
            const cards = document.querySelectorAll('.exp-item-card');
            cards.forEach(card => {
                const title = card.querySelector('.exp-card-name').textContent.toLowerCase();
                if (title.includes(input)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    </script>

    <!-- العلامة المائية لحماية شاشة المعلم -->
    <script>
        window.WATERMARK_USER = {
            name: <?=json_encode($user_name)?>,
            contact: <?=json_encode($user_contact)?>
        };
    </script>
    <script src="js/watermark.js?v=<?=time()?>"></script>
</body>
</html>