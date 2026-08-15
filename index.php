<?php
require_once 'config.php';
require_once 'functions.php';
require_once 'tracking.php';  // تضمين ملف التتبع
trackVisitor();              // تسجيل الزائر الحقيقي

$error = '';
$success_msg = '';

$user_id = $_SESSION['user_id'] ?? $_SESSION['user']['id'] ?? null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['code'])) {
    $code = trim($_POST['code']);
    
    if (!$user_id) {
        $error = '⚠️ يرجى تسجيل الدخول بحسابك أولاً لشحن كود الاشتراك';
    } else {
        $result = redeemCode($code, $user_id);
        if ($result['success']) {
            $success_msg = $result['message'];
            header("Location: my-experiments.php?msg=redeemed");
            exit();
        } else {
            $error = $result['message'];
        }
    }
}

// جلب الباقات المتاحة لعرضها في مودال "ابدأ الآن"
$homepage_packages = mysqli_query($conn, "SELECT name, duration_months, store_url FROM packages WHERE is_active = 1 ORDER BY duration_months ASC");
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>المختبر الافتراضي | العلوم والتقنية للجميع</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --teal-900: #002d3d;
            --teal-800: #004e66;
            --teal-700: #006b8a;
            --teal-600: #0089ae;
            --teal-500: #00a8d4;
            --teal-400: #2ec4e8;
            --teal-300: #7ddcf0;
            --teal-100: #e6f7fc;
            --teal-50:  #f0fbfe;
            --white:    #ffffff;
            --gray-50:  #f8fafc;
            --gray-100: #f1f5f9;
            --gray-200: #e2e8f0;
            --gray-400: #94a3b8;
            --gray-600: #475569;
            --gray-800: #1e293b;
            --error:    #dc2626;
            --error-bg: #fef2f2;
        }

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

        html { scroll-behavior: smooth; }

        body {
            font-family: 'Cairo', sans-serif;
            background: var(--gray-50);
            color: var(--gray-800);
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* ═══ HEADER ═══ */
        .site-header {
            background: var(--white);
            border-bottom: 3px solid var(--teal-800);
            padding: 0 40px;
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 12px rgba(0,78,102,0.08);
        }

        .header-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
        }

        .header-logo img {
            height: 48px;
            width: 48px;
            object-fit: contain;
            border-radius: 10px;
        }

        .header-brand {
            display: flex;
            flex-direction: column;
        }

        .header-brand-name {
            font-size: 1rem;
            font-weight: 800;
            color: var(--teal-800);
            line-height: 1.2;
        }

        .header-brand-sub {
            font-size: 0.7rem;
            color: var(--gray-400);
            font-weight: 400;
        }

        .header-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            background: var(--teal-100);
            border: 1px solid var(--teal-300);
            color: var(--teal-800);
            padding: 6px 14px;
            border-radius: 100px;
            font-size: 0.75rem;
            font-weight: 700;
        }

        .header-badge .live {
            width: 7px; height: 7px;
            background: #10b981;
            border-radius: 50%;
            animation: blink 1.5s infinite;
        }

        @keyframes blink {
            0%,100% { opacity:1; }
            50% { opacity:0.3; }
        }

        /* ═══ HERO SECTION ═══ */
        .hero {
            background: linear-gradient(135deg, var(--teal-900) 0%, var(--teal-800) 50%, var(--teal-700) 100%);
            padding: 72px 40px;
            position: relative;
            overflow: hidden;
        }

        .hero::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image:
                radial-gradient(circle at 80% 50%, rgba(0,168,212,0.15) 0%, transparent 60%),
                radial-gradient(circle at 20% 80%, rgba(0,107,138,0.2) 0%, transparent 50%);
        }

        /* شبكة خلفية خفيفة */
        .hero::after {
            content: '';
            position: absolute;
            inset: 0;
            background-image:
                linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
            background-size: 40px 40px;
        }

        .hero-inner {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 420px;
            gap: 60px;
            align-items: center;
            position: relative;
            z-index: 2;
        }

        .hero-content {}

        .hero-tag {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: var(--teal-300);
            padding: 6px 16px;
            border-radius: 100px;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.08em;
            margin-bottom: 24px;
        }

        .hero-title {
            font-size: clamp(1.8rem, 3.5vw, 2.8rem);
            font-weight: 900;
            color: var(--white);
            line-height: 1.2;
            letter-spacing: -0.02em;
            margin-bottom: 16px;
        }

        .hero-title span {
            color: var(--teal-400);
        }

        .hero-desc {
            font-size: 1rem;
            color: rgba(255,255,255,0.7);
            line-height: 1.8;
            max-width: 500px;
            margin-bottom: 36px;
        }

        /* pills التجارب */
        .hero-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .hpill {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 7px 14px;
            border-radius: 100px;
            font-size: 0.72rem;
            font-weight: 600;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            color: rgba(255,255,255,0.85);
            transition: all 0.2s;
        }

        .hpill:hover {
            background: rgba(255,255,255,0.15);
            transform: translateY(-1px);
        }

        .hpill i { color: var(--teal-400); }

        .btn-start-now {
            margin-top: 28px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 14px 32px;
            background: linear-gradient(135deg, var(--teal-500), var(--teal-400));
            border: none;
            border-radius: 100px;
            color: var(--teal-900);
            font-family: 'Cairo', sans-serif;
            font-size: 0.95rem;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.25s;
            box-shadow: 0 8px 24px rgba(0,168,212,0.3);
        }

        .btn-start-now:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 30px rgba(0,168,212,0.4);
        }

        /* ═══ PACKAGES MODAL ═══ */
        .pkg-modal-overlay {
            position: fixed; inset: 0;
            background: rgba(0,45,61,0.6);
            z-index: 500;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .pkg-modal-overlay.open { display: flex; }

        .pkg-modal-box {
            background: var(--white);
            border-radius: 24px;
            padding: 32px;
            max-width: 560px;
            width: 100%;
            box-shadow: 0 24px 60px rgba(0,0,0,0.3);
            position: relative;
        }

        .pkg-modal-close {
            position: absolute;
            top: 18px; left: 18px;
            background: var(--gray-100);
            border: none;
            width: 34px; height: 34px;
            border-radius: 50%;
            cursor: pointer;
            color: var(--gray-600);
            font-size: 0.9rem;
        }

        .pkg-modal-title {
            text-align: center;
            font-size: 1.3rem;
            font-weight: 900;
            color: var(--teal-900);
            margin-bottom: 6px;
        }

        .pkg-modal-sub {
            text-align: center;
            font-size: 0.82rem;
            color: var(--gray-400);
            margin-bottom: 24px;
        }

        .pkg-option {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            border: 2px solid var(--gray-200);
            border-radius: 16px;
            padding: 18px 20px;
            margin-bottom: 14px;
        }

        .pkg-option-name {
            font-weight: 800;
            color: var(--teal-800);
            font-size: 1rem;
            margin-bottom: 4px;
        }

        .pkg-option-duration {
            font-size: 0.78rem;
            color: var(--gray-400);
        }

        .pkg-option-btn {
            background: linear-gradient(135deg, var(--teal-700), var(--teal-600));
            color: white;
            border: none;
            padding: 10px 22px;
            border-radius: 100px;
            font-family: 'Cairo', sans-serif;
            font-weight: 700;
            font-size: 0.82rem;
            text-decoration: none;
            white-space: nowrap;
            cursor: pointer;
        }

        .pkg-option-btn.disabled {
            background: var(--gray-200);
            color: var(--gray-400);
            cursor: not-allowed;
            pointer-events: none;
        }

        /* ═══ LOGIN CARD ═══ */
        .login-card {
            background: var(--white);
            border-radius: 24px;
            padding: 40px 36px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,78,102,0.15);
            position: relative;
            overflow: hidden;
        }

        .login-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--teal-800), var(--teal-500), var(--teal-300));
        }

        .card-logo-wrap {
            text-align: center;
            margin-bottom: 24px;
        }

        .card-logo-wrap img {
            height: 72px;
            width: 72px;
            object-fit: contain;
            border-radius: 16px;
            box-shadow: 0 4px 16px rgba(0,78,102,0.2);
        }

        .card-title {
            text-align: center;
            font-size: 1.3rem;
            font-weight: 800;
            color: var(--teal-900);
            margin-bottom: 4px;
        }

        .card-sub {
            text-align: center;
            font-size: 0.78rem;
            color: var(--gray-400);
            margin-bottom: 28px;
        }

        /* ERROR */
        .error-box {
            display: flex;
            align-items: center;
            gap: 10px;
            background: var(--error-bg);
            border: 1px solid #fca5a5;
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 20px;
            color: var(--error);
            font-size: 0.82rem;
        }

        /* FIELD */
        .field { margin-bottom: 16px; }

        .field-label {
            display: block;
            font-size: 0.78rem;
            font-weight: 700;
            color: var(--gray-600);
            margin-bottom: 8px;
        }

        .input-wrap { position: relative; }

        .input-wrap .ico {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--teal-600);
            font-size: 0.9rem;
            pointer-events: none;
        }

        .code-input {
            width: 100%;
            padding: 14px 42px 14px 16px;
            border: 2px solid var(--gray-200);
            border-radius: 12px;
            font-family: 'Cairo', sans-serif;
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--gray-800);
            direction: ltr;
            text-align: right;
            letter-spacing: 0.05em;
            transition: all 0.25s;
            background: var(--gray-50);
        }

        .code-input:focus {
            outline: none;
            border-color: var(--teal-600);
            background: var(--white);
            box-shadow: 0 0 0 3px rgba(0,137,174,0.12);
        }

        .code-input::placeholder {
            color: var(--gray-400);
            font-size: 0.82rem;
            letter-spacing: 0;
        }

        /* شريط القوة */
        .strength-wrap {
            display: flex;
            gap: 4px;
            margin-top: 8px;
        }

        .strength-seg {
            flex: 1;
            height: 3px;
            background: var(--gray-200);
            border-radius: 100px;
            transition: background 0.3s;
        }

        /* زر الدخول */
        .btn-enter {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, var(--teal-800), var(--teal-600));
            border: none;
            border-radius: 12px;
            color: var(--white);
            font-family: 'Cairo', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 4px;
            transition: all 0.3s;
            box-shadow: 0 6px 20px rgba(0,78,102,0.3);
            position: relative;
            overflow: hidden;
        }

        .btn-enter::after {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
            transform: skewX(-15deg);
            animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
            0% { left: -100%; }
            40%,100% { left: 150%; }
        }

        .btn-enter:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 28px rgba(0,78,102,0.4);
        }

        .btn-enter:active { transform: translateY(0); }

        /* footer الكارد */
        .card-footer {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid var(--gray-200);
            display: flex;
            justify-content: space-around;
        }

        .cfbadge {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.68rem;
            color: var(--gray-400);
        }

        .cfbadge i { color: #10b981; font-size: 0.6rem; }

        /* ═══ STATS STRIP ═══ */
        .stats-strip {
            background: var(--white);
            border-bottom: 1px solid var(--gray-200);
            padding: 20px 40px;
        }

        .stats-inner {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 48px;
        }

        .stat-item {
            text-align: center;
        }

        .stat-num {
            font-size: 1.6rem;
            font-weight: 900;
            color: var(--teal-800);
            line-height: 1;
        }

        .stat-lbl {
            font-size: 0.72rem;
            color: var(--gray-400);
            margin-top: 4px;
        }

        .stat-div {
            width: 1px;
            height: 36px;
            background: var(--gray-200);
        }

        /* ═══ EXPERIMENTS GRID ═══ */
        .experiments {
            max-width: 1200px;
            margin: 0 auto;
            padding: 56px 40px;
        }

        .section-tag {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--teal-100);
            color: var(--teal-800);
            padding: 5px 14px;
            border-radius: 100px;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            margin-bottom: 12px;
        }

        .section-title {
            font-size: 1.6rem;
            font-weight: 900;
            color: var(--teal-900);
            margin-bottom: 6px;
            letter-spacing: -0.02em;
        }

        .section-desc {
            font-size: 0.88rem;
            color: var(--gray-400);
            margin-bottom: 36px;
        }

        .exp-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
        }

        .exp-card {
            background: var(--white);
            border: 1px solid var(--gray-200);
            border-radius: 16px;
            padding: 24px 20px;
            text-align: center;
            transition: all 0.3s;
            cursor: default;
            position: relative;
            overflow: hidden;
        }

        .exp-card::before {
            content: '';
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--teal-600), var(--teal-400));
            transform: scaleX(0);
            transition: transform 0.3s;
        }

        .exp-card:hover {
            border-color: var(--teal-300);
            box-shadow: 0 8px 24px rgba(0,78,102,0.1);
            transform: translateY(-4px);
        }

        .exp-card:hover::before { transform: scaleX(1); }

        .exp-icon {
            width: 56px; height: 56px;
            border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem;
            margin: 0 auto 14px;
        }

        .icon-blue   { background: #eff6ff; color: #2563eb; }
        .icon-teal   { background: var(--teal-100); color: var(--teal-700); }
        .icon-purple { background: #f5f3ff; color: #7c3aed; }
        .icon-green  { background: #f0fdf4; color: #16a34a; }
        .icon-orange { background: #fff7ed; color: #ea580c; }

        .exp-name {
            font-size: 0.88rem;
            font-weight: 700;
            color: var(--gray-800);
            margin-bottom: 6px;
        }

        .exp-desc {
            font-size: 0.72rem;
            color: var(--gray-400);
            line-height: 1.6;
        }

        .expand-note {
            text-align: center;
            margin-top: 32px;
            font-size: 0.9rem;
            color: var(--teal-700);
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        /* ═══ FOOTER ═══ */
        .site-footer {
            background: var(--teal-900);
            padding: 28px 40px;
            text-align: center;
        }

        .footer-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 12px;
        }

        .footer-logo img {
            height: 36px;
            object-fit: contain;
            filter: brightness(0) invert(1);
            opacity: 0.8;
        }

        .footer-text {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.4);
        }

        /* ═══ RESPONSIVE ═══ */
        @media (max-width: 900px) {
            .hero-inner {
                grid-template-columns: 1fr;
                text-align: center;
            }
            .hero-pills { justify-content: center; }
            .login-card { max-width: 440px; margin: 0 auto; }
            .site-header { padding: 0 20px; }
            .hero { padding: 48px 20px; }
            .experiments { padding: 40px 20px; }
            .stats-inner { gap: 24px; flex-wrap: wrap; }
            .stat-div { display: none; }
        }

        @media (max-width: 480px) {
            .login-card { padding: 28px 20px; border-radius: 16px; }
            .hero-title { font-size: 1.6rem; }
            .header-brand-name { font-size: 0.88rem; }
        }
    </style>
</head>
<body>

<!-- HEADER -->
<header class="site-header">
    <a href="index.php" class="header-logo">
        <img src="logo2.png" alt="العلوم والتقنية للجميع">
        <div class="header-brand">
            <div class="header-brand-name"> مختبرات العلوم والتقنية للجميع </div>
            <div class="header-brand-sub">Sabir Alsayyali</div>
        </div>
    </a>
    <div style="display: flex; align-items: center; gap: 12px;">
        <?php if ($user_id): ?>
            <a href="my-experiments.php" class="header-badge" style="text-decoration: none; background: #dcfce7; color: #166534; border-color: #86efac;">
                <i class="fas fa-user-check"></i>
                <span>مرحباً بك (تجاربي المتاحة)</span>
            </a>
        <?php else: ?>
            <a href="../login" class="header-badge" style="text-decoration: none; background: var(--teal-800); color: white;">
                <i class="fas fa-sign-in-alt"></i>
                <span>تسجيل الدخول بالمنصة</span>
            </a>
        <?php endif; ?>
    </div>
</header>

<!-- HERO -->
<section class="hero">
    <div class="hero-inner">
        <div class="hero-content">
            <div class="hero-tag">
                <i class="fas fa-flask"></i>
                منصة تجارب علمية تفاعلية
            </div>
            <h1 class="hero-title">
                علِّم بالتجربة<br>
                <span>لا بالحفظ</span>
            </h1>
            <p class="hero-desc">
                محاكاة علمية تفاعلية احترافية — تعمل مباشرة من المتصفح بدون تثبيت أي برامج.
            </p>
            <div class="hero-pills">
                <div class="hpill"><i class="fas fa-bolt"></i> الدائرة الكهربائية</div>
                <div class="hpill"><i class="fas fa-atom"></i> حالات المادة</div>
                <div class="hpill"><i class="fas fa-magnet"></i> المغناطيس الكهربائي</div>
                <div class="hpill"><i class="fas fa-running"></i> قوانين نيوتن</div>
                <div class="hpill"><i class="fas fa-rainbow"></i> المنشور الزجاجي</div>
                <div class="hpill"><i class="fas fa-ellipsis"></i> المزيد...</div>
            </div>
            <button type="button" class="btn-start-now" onclick="openPackagesModal()">
                <i class="fas fa-rocket"></i>
                <span>ابدأ الآن</span>
            </button>
        </div>

        <!-- RECHARGE / LOGIN CARD -->
        <div class="login-card">
            <div class="card-logo-wrap">
                <img src="logo2.png" alt="logo">
            </div>

            <?php if ($user_id): ?>
                <div class="card-title">شحن كارت الاشتراك</div>
                <div class="card-sub">أدخل كود الشحن لإضافة تمديد لمدّة اشتراكك بالشهور</div>

                <?php if ($error): ?>
                <div class="error-box">
                    <i class="fas fa-circle-xmark"></i>
                    <span><?php echo htmlspecialchars($error); ?></span>
                </div>
                <?php endif; ?>

                <form method="POST" action="">
                    <div class="field">
                        <label class="field-label" for="codeInput">كود تفعيل الاشتراك</label>
                        <div class="input-wrap">
                            <input
                                id="codeInput"
                                class="code-input"
                                type="text"
                                name="code"
                                placeholder="SCI-XXXX-XXXX"
                                autocomplete="off"
                                spellcheck="false"
                                required
                            >
                            <span class="ico"><i class="fas fa-key"></i></span>
                        </div>
                        <div class="strength-wrap">
                            <div class="strength-seg" id="s1"></div>
                            <div class="strength-seg" id="s2"></div>
                            <div class="strength-seg" id="s3"></div>
                        </div>
                    </div>

                    <button type="submit" class="btn-enter">
                        <i class="fas fa-bolt"></i>
                        <span>شحن وتفعيل الاشتراك</span>
                    </button>
                </form>

                <div style="margin-top: 16px; text-align: center;">
                    <a href="my-experiments.php" style="color: var(--teal-700); text-decoration: none; font-weight: 700; font-size: 0.9rem;">
                        <i class="fas fa-flask"></i> الذهاب إلى لوحة تجاربي المتاحة &larr;
                    </a>
                </div>
            <?php else: ?>
                <div class="card-title">مرحباً بك في المختبرات</div>
                <div class="card-sub">يرجى تسجيل الدخول بحسابك في المنصة الرئيسية لتنفيذ التجارب وشحن الأكواد</div>

                <?php if ($error): ?>
                <div class="error-box">
                    <i class="fas fa-circle-xmark"></i>
                    <span><?php echo htmlspecialchars($error); ?></span>
                </div>
                <?php endif; ?>

                <div style="margin-top: 24px; text-align: center;">
                    <a href="../login" class="btn-enter" style="text-decoration: none;">
                        <i class="fas fa-sign-in-alt"></i>
                        <span>تسجيل الدخول بالمنصة الرئيسية</span>
                    </a>
                </div>
            <?php endif; ?>

            <div class="card-footer">
                <div class="cfbadge"><i class="fas fa-circle"></i> كود آمن</div>
                <div class="cfbadge"><i class="fas fa-circle"></i> بدون تثبيت</div>
                <div class="cfbadge"><i class="fas fa-circle"></i> يدعم الجوال</div>
            </div>
        </div>
    </div>
</section>

<!-- STATS (بدون أرقام ثابتة – تعكس التوسع المستقبلي) -->
<div class="stats-strip">
    <div class="stats-inner">
        <div class="stat-item">
            <div class="stat-num"><i class="fas fa-infinity"></i></div>
            <div class="stat-lbl">تجارب تفاعلية</div>
        </div>
        <div class="stat-div"></div>
        <div class="stat-item">
            <div class="stat-num"><i class="fas fa-layer-group"></i></div>
            <div class="stat-lbl">مراحل متعددة</div>
        </div>
        <div class="stat-div"></div>
        <div class="stat-item">
            <div class="stat-num"><i class="fas fa-globe"></i></div>
            <div class="stat-lbl">من المتصفح مباشرة</div>
        </div>
        <div class="stat-div"></div>
        <div class="stat-item">
            <div class="stat-num"><i class="fas fa-code"></i></div>
            <div class="stat-lbl">تقنية حديثة</div>
        </div>
    </div>
</div>

<!-- EXPERIMENTS (مجموعة مختارة بدون ترقيم) -->
<section class="experiments">
    <div class="section-tag"><i class="fas fa-microscope"></i> مختارات من المختبر</div>
    <h2 class="section-title">اكتشف مجموعتنا المتنامية من التجارب</h2>
    <p class="section-desc">كل تجربة مبنية بعناية لتتناسب مع المنهج الدراسي – ونضيف تجارب جديدة باستمرار</p>

    <div class="exp-grid">
        <div class="exp-card">
            <div class="exp-icon icon-teal"><i class="fas fa-atom"></i></div>
            <div class="exp-name">حالات المادة</div>
            <div class="exp-desc">تأثير الحرارة والضغط على تحولات المادة بين الحالات الثلاث</div>
        </div>
        <div class="exp-card">
            <div class="exp-icon icon-blue"><i class="fas fa-bolt"></i></div>
            <div class="exp-name">الدائرة الكهربائية</div>
            <div class="exp-desc">التوصيل على التوالي والتوازي ومكونات الدائرة الكهربائية</div>
        </div>
        <div class="exp-card">
            <div class="exp-icon icon-purple"><i class="fas fa-magnet"></i></div>
            <div class="exp-name">المغناطيس الكهربائي</div>
            <div class="exp-desc">تأثير عدد اللفات والقلب الحديدي على شدة المجال المغناطيسي</div>
        </div>
        <div class="exp-card">
            <div class="exp-icon icon-green"><i class="fas fa-running"></i></div>
            <div class="exp-name">قوانين نيوتن</div>
            <div class="exp-desc">القصور الذاتي والتسارع والعلاقة بين القوة والكتلة</div>
        </div>
        <div class="exp-card">
            <div class="exp-icon icon-orange"><i class="fas fa-rainbow"></i></div>
            <div class="exp-name">المنشور الزجاجي</div>
            <div class="exp-desc">تحليل الضوء الأبيض وإظهار ألوان الطيف السبعة تفاعلياً</div>
        </div>
    </div>

    <div class="expand-note">
        <i class="fas fa-seedling"></i> تجارب جديدة قادمة قريباً – المكتبة في توسع دائم
    </div>
</section>

<!-- مودال اختيار الباقة -->
<div class="pkg-modal-overlay" id="pkgModal">
    <div class="pkg-modal-box">
        <button type="button" class="pkg-modal-close" onclick="closePackagesModal()"><i class="fas fa-times"></i></button>
        <div class="pkg-modal-title">اختر باقة الاشتراك</div>
        <div class="pkg-modal-sub">سوف يتم النقل تلقائيًا لمتجرنا لإتمام عملية الشراء والحصول على كود التفعيل</div>
        <?php mysqli_data_seek($homepage_packages, 0); while ($pk = mysqli_fetch_assoc($homepage_packages)): ?>
            <div class="pkg-option">
                <div>
                    <div class="pkg-option-name"><?=htmlspecialchars($pk['name'])?></div>
                    <div class="pkg-option-duration">اشتراك لمدة <?=$pk['duration_months']?> شهر</div>
                </div>
                <?php if (!empty($pk['store_url'])): ?>
                    <a href="<?=htmlspecialchars($pk['store_url'])?>" class="pkg-option-btn" target="_blank" rel="noopener">اشترك الآن</a>
                <?php else: ?>
                    <span class="pkg-option-btn disabled">قريبًا</span>
                <?php endif; ?>
            </div>
        <?php endwhile; ?>
    </div>
</div>

<!-- FOOTER -->
<footer class="site-footer">
    <div class="footer-logo">
        <img src="logo2.png" alt="logo">
    </div>
    <div class="footer-text">© 2026 العلوم والتقنية للجميع — Sabir Alsayyali | جميع الحقوق محفوظة</div>
</footer>

<script>
function openPackagesModal() { document.getElementById('pkgModal').classList.add('open'); }
function closePackagesModal() { document.getElementById('pkgModal').classList.remove('open'); }

const input = document.getElementById('codeInput');
const segs  = [document.getElementById('s1'), document.getElementById('s2'), document.getElementById('s3')];
const colors = ['#dc2626', '#f59e0b', '#10b981'];

input.addEventListener('input', () => {
    const len = input.value.trim().length;
    const level = len < 4 ? 0 : len < 8 ? 1 : len < 12 ? 2 : 3;
    segs.forEach((s, i) => {
        s.style.background = i < level ? colors[Math.min(level - 1, 2)] : '#e2e8f0';
    });
});
</script>

</body>
</html>