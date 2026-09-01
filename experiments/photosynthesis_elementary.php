<?php
require_once '../config.php';
require_once '../functions.php';

// Force browser to revalidate PHP page without stale HTML cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

$sub = isAuthenticated();

$user_name = $_SESSION['user']['name'] ?? $_SESSION['user_name'] ?? 'معلم معتمد';
$user_contact = $_SESSION['user']['whatsappNumber'] ?? $_SESSION['user']['phone'] ?? $_SESSION['user']['email'] ?? '';

// Check experiment active state in database
$exp_active = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM experiments WHERE code_name = 'photosynthesis_elementary' OR code_name = 'photosynthesis-elementary'"))['is_active'] ?? 1;
if (!$exp_active) {
    header("Location: ../my-experiments.php?msg=experiment_disabled");
    exit();
}

$css_v = file_exists('../css/photosynthesis_elementary.css') ? filemtime('../css/photosynthesis_elementary.css') : time();
$js_v  = file_exists('../js/experiments/photosynthesis_elementary/app.js') ? filemtime('../js/experiments/photosynthesis_elementary/app.js') : time();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>رحلة غذاء النبات ونموه | مختبرات العلوم والتقنية</title>
    
    <!-- Google Fonts Cairo -->
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <!-- FontAwesome 6 Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Three.js 3D Engine & OrbitControls -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    
    <!-- CSS stylesheet with Cache-Busting -->
    <link rel="stylesheet" href="../css/photosynthesis_elementary.css?v=<?= $css_v ?>">
</head>
<body class="photosynthesis-elem-body">

    <!-- Main Container -->
    <div class="photosynthesis-elem-container">
        
        <!-- Header & Brand Bar -->
        <header class="lab-header" id="labHeader">
            <a href="../my-experiments.php" class="lab-brand">
                <div class="brand-icon"><i class="fas fa-cube"></i></div>
                <div class="brand-text">
                    <span class="main-title">رحلة غذاء النبات ونموه</span>
                </div>
            </a>

            <div class="header-left-group" style="display: flex; align-items: center; gap: 12px;">
                <!-- Reset Button -->
                <button type="button" class="reset-btn" id="btnResetExp">
                    <i class="fas fa-rotate-right"></i>
                    <span>إعادة ضبط التجربة</span>
                </button>

                <a href="../my-experiments.php" class="exit-btn">
                    <i class="fas fa-arrow-right"></i> <span>خروج</span>
                </a>
            </div>
        </header>

        <!-- Main Workspace Container -->
        <main class="lab-main-container" id="mainContainer">

            <!-- Side Interactive Rate Gauge Bar (مؤشر معدل البناء الضوئي) -->
            <div class="rate-gauge-card">
                <div class="gauge-header">
                    <div class="gauge-icon"><i class="fas fa-bolt"></i></div>
                    <span class="gauge-title">معدل البناء الضوئي</span>
                </div>
                
                <div class="gauge-bar-wrapper">
                    <div class="gauge-track">
                        <div class="gauge-fill" id="rateGaugeFill"></div>
                        <div class="gauge-pointer" id="rateGaugePointer"></div>
                    </div>
                    <div class="gauge-labels">
                        <span class="g-label high" id="labelHigh">🟢 مرتفع</span>
                        <span class="g-label med" id="labelMed">🟡 متوسط</span>
                        <span class="g-label low" id="labelLow">🔴 منخفض</span>
                    </div>
                </div>
            </div>

            <!-- Central Interactive 3D Stage Container -->
            <div class="stage-wrapper" id="stageWrapper">
                <!-- 3D WebGL Canvas Container -->
                <div id="webglContainer" style="width: 100%; height: 100%;"></div>

                <!-- Right Minerals Legend Key Card (مفتاح العناصر والمعادن) -->
                <div class="minerals-key-card" id="mineralsKeyCard">
                    <div class="key-header">
                        <span class="key-icon">🧪</span>
                        <span class="key-title">دليل المغذيات والمعادن</span>
                    </div>
                    <div class="key-list">
                        <div class="key-item"><span class="elem-badge n-badge">N</span><span class="elem-name">النيتروجين</span></div>
                        <div class="key-item"><span class="elem-badge p-badge">P</span><span class="elem-name">الفسفور</span></div>
                        <div class="key-item"><span class="elem-badge k-badge">K</span><span class="elem-name">البوتاسيوم</span></div>
                        <div class="key-item"><span class="elem-badge ca-badge">Ca</span><span class="elem-name">الكالسيوم</span></div>
                        <div class="key-item"><span class="elem-badge mg-badge">Mg</span><span class="elem-name">المغنيسيوم</span></div>
                        <div class="key-item"><span class="elem-badge s-badge">S</span><span class="elem-name">الكبريت</span></div>
                    </div>
                </div>
            </div>

            <!-- Bottom Controls Bar (3-Step Segmented Switches) -->
            <footer class="controls-bar" id="controlsBar">
                
                <!-- 1. Light Control (الضوء) -->
                <div class="ctrl-card ctrl-light">
                    <div class="ctrl-header">
                        <span class="ctrl-icon">☀️</span>
                        <span class="ctrl-title">الضوء</span>
                    </div>
                    <div class="segmented-switch" data-control="light">
                        <button class="switch-btn active" data-value="low">منخفض</button>
                        <button class="switch-btn" data-value="medium">متوسط</button>
                        <button class="switch-btn" data-value="high">مرتفع</button>
                    </div>
                </div>

                <!-- 2. CO2 Control (ثاني أكسيد الكربون) -->
                <div class="ctrl-card ctrl-co2">
                    <div class="ctrl-header">
                        <span class="ctrl-icon">💨</span>
                        <span class="ctrl-title">ثاني أكسيد الكربون</span>
                    </div>
                    <div class="segmented-switch" data-control="co2">
                        <button class="switch-btn active" data-value="low">منخفض</button>
                        <button class="switch-btn" data-value="medium">متوسط</button>
                        <button class="switch-btn" data-value="high">مرتفع</button>
                    </div>
                </div>

                <!-- 3. Water Control (الماء) -->
                <div class="ctrl-card ctrl-water">
                    <div class="ctrl-header">
                        <span class="ctrl-icon">💧</span>
                        <span class="ctrl-title">الماء</span>
                    </div>
                    <div class="segmented-switch" data-control="water">
                        <button class="switch-btn active" data-value="low">منخفض</button>
                        <button class="switch-btn" data-value="medium">متوسط</button>
                        <button class="switch-btn" data-value="high">مرتفع</button>
                    </div>
                </div>

                <!-- 4. Minerals & Salts Control (الأملاح والمعادن) -->
                <div class="ctrl-card ctrl-minerals">
                    <div class="ctrl-header">
                        <span class="ctrl-icon">🧪</span>
                        <span class="ctrl-title">الأملاح والمعادن</span>
                    </div>
                    <div class="segmented-switch" data-control="minerals">
                        <button class="switch-btn active" data-value="low">منخفض</button>
                        <button class="switch-btn" data-value="medium">متوسط</button>
                        <button class="switch-btn" data-value="high">مرتفع</button>
                    </div>
                </div>

            </footer>

        </main>
    </div>

    <!-- Global Watermark -->
    <script src="../js/watermark.js?v=<?= time() ?>"></script>

    <!-- Clean Architecture ES6 Modules Entry Point -->
    <script type="module" src="../js/experiments/photosynthesis_elementary/app.js?v=<?= $js_v ?>"></script>
</body>
</html>
