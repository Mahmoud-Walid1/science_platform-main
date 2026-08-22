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

$exp_active = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM experiments WHERE code_name = 'mixture_separation' OR id = 6"))['is_active'] ?? 1;
if (!$exp_active) {
    header("Location: ../my-experiments.php?msg=experiment_disabled");
    exit();
}

$css_v = file_exists('../css/separation_v2.css') ? filemtime('../css/separation_v2.css') : time();
$js_v  = file_exists('../js/experiments/separation_v2/app.js') ? filemtime('../js/experiments/separation_v2/app.js') : time();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>فصل المخاليط التفاعلي 3D | مختبرات العلوم والتقنية</title>
    
    <!-- Google Fonts Cairo -->
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <!-- FontAwesome 6 Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Modern Isometric Lab Light Stylesheet with Automatic Cache-Busting -->
    <link rel="stylesheet" href="../css/separation_v2.css?v=<?= $css_v ?>">
</head>
<body>

    <!-- Header -->
    <header class="lab-header-v2">
        <a href="../my-experiments.php" class="lab-brand-v2">
            <i class="fas fa-flask"></i>
            <span>مختبر فصل المخاليط</span>
        </a>

        <!-- Header Segmented Control Mode Switcher -->
        <div class="header-mode-switcher">
            <button type="button" class="mode-btn active" id="btnMode3D">
                <i class="fas fa-cubes"></i> <span>المختبر التفاعلي (3D)</span>
            </button>
            <button type="button" class="mode-btn" id="btnModeQuiz">
                <i class="fas fa-book-open"></i> <span>المعلومات والأسئلة والتقييم</span>
            </button>
        </div>

        <a href="../my-experiments.php" class="exit-btn-v2">
            <i class="fas fa-arrow-right"></i> خروج
        </a>
    </header>

    <!-- Main Container Grid - Fullscreen 3D Workspace -->
    <div class="lab-container-v2">

        <!-- 100% Full Stage Canvas -->
        <main class="stage-panel" id="stagePanel">
            <!-- Educational Stepper Banner -->
            <div class="stepper-banner" id="experimentStepper">
                <span id="stepBadge" class="step-badge">المرحلة 1</span>
                <span id="stepText">تجهيز المخلوط: قم بإضافة مادتين في الكأس لتركيب المخلوط</span>
            </div>

            <!-- Floating Sidebar Toggle Button -->
            <button class="toggle-sidebar-btn" id="toggleSidebarBtn">
                <i class="fas fa-layer-group"></i> مخاليط سريعة
            </button>

            <!-- Reset Focus Camera View Button -->
            <button class="reset-camera-btn" id="btnResetCamera">
                <i class="fas fa-expand"></i> العودة للمنظور الكامل
            </button>

            <!-- Clean Magnet Action Button -->
            <button class="clean-magnet-btn" id="cleanMagnetBtn">
                <i class="fas fa-broom"></i> تنظيف المغناطيس من برادة الحديد
            </button>

            <!-- Interactive Hover Tooltip -->
            <div class="hover-tooltip" id="hoverTooltip"></div>

            <!-- Canvas Container -->
            <canvas id="canvas3d"></canvas>

            <!-- Floating Navigation & Dragging Help Pill -->
            <div class="nav-help-pill">
                <i class="fas fa-hand-pointer"></i> <span>تلميح: يمكنك سحب الشاشة بالماوس في أي اتجاه أو التكبير والتصغير حرّاً ✋</span>
            </div>

            <!-- Zoom & Reset Controls Bar -->
            <div class="sim-controls-bar" id="simControls">
                <button class="ctrl-btn" id="btnZoomIn" title="تكبير المشهد (Zoom In)">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="ctrl-btn" id="btnZoomOut" title="تصغير المشهد (Zoom Out)">
                    <i class="fas fa-minus"></i>
                </button>
                <button class="ctrl-btn" id="btnReset" title="إعادة تهيئة التجربة والرف">
                    <i class="fas fa-rotate-right"></i>
                </button>
            </div>
        </main>

        <!-- Sliding Off-Canvas Sidebar "مخاليط سريعة" -->
        <aside class="sidebar-drawer" id="quickMixturesDrawer">
            <div class="drawer-header">
                <span><i class="fas fa-layer-group"></i> مخاليط سريعة</span>
                <button class="drawer-close-btn" id="closeDrawerBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mixtures-list">
                <div class="instructions-card">
                    <i class="fas fa-hand-pointer"></i> <strong>المخاليط السريعة:</strong> اضغط على أي مخلوط لتجهيز مكوناته في الكأس فوراً.
                </div>

                <div id="presetMixturesList">
                    <!-- Rendered via JS -->
                </div>
            </div>
        </aside>

    </div>

    <!-- Educational Concepts, Physical Properties Table & Interactive Quiz Panel -->
    <div class="educational-panel" id="educationalPanel" style="display: none;">
        <!-- Rendered dynamically by QuizEngine -->
    </div>

    <!-- Three.js Import Map -->
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js"
        }
    }
    </script>
    <!-- ES Module App Entry Point with Automatic Cache-Busting -->
    <script type="module" src="../js/experiments/separation_v2/app.js?v=<?= $js_v ?>"></script>
</body>
</html>
