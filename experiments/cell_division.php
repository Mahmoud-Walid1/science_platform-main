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

$css_v = file_exists('../css/cell_division.css') ? filemtime('../css/cell_division.css') : time();
$js_v  = file_exists('../js/experiments/cell_division/app.js') ? filemtime('../js/experiments/cell_division/app.js') : time();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>انقسام الخلايا وتكاثرها | مختبرات العلوم والتقنية</title>
    
    <!-- Google Fonts Cairo -->
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <!-- FontAwesome 6 Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Three.js 3D Engine, OrbitControls & GSAP 3 Animator -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    
    <!-- Smartboard & High-Contrast Light Theme Stylesheet -->
    <link rel="stylesheet" href="../css/cell_division.css?v=<?= $css_v ?>">
</head>
<body>

    <!-- Header & Brand Bar -->
    <header class="lab-header-v2" id="labHeader">
        <a href="../my-experiments.php" class="lab-brand-v2">
            <i class="fas fa-microscope"></i>
            <span>انقسام الخلايا وتكاثرها</span>
        </a>

        <a href="../my-experiments.php" class="exit-btn-v2">
            <i class="fas fa-arrow-right"></i> خروج
        </a>
    </header>

    <!-- Main Workspace Container -->
    <div class="lab-container-v2" id="labContainer">

        <!-- 3D Interactive Lab Bench & Microscope Preparation Stage (Phase 1) -->
        <div class="prep-stage-wrapper" id="prepStageWrapper">
            <div id="prep3DContainer" style="width: 100%; height: 100%;"></div>

            <!-- Floating 3D Object Tooltip Badge -->
            <div class="prep-3d-tooltip" id="prep3DTooltip"></div>

            <!-- Floating Sample Selection Cards Overlay -->
            <div class="sample-selection-overlay" id="sampleSelectionOverlay">
                <div class="sample-overlay-title">
                    <i class="fas fa-flask"></i> <span>اختر شريحة الخلية المراد تجهيزها وفحصها:</span>
                </div>
                <div class="sample-cards-grid">
                    <button type="button" class="sample-card-btn" data-sample="plant">
                        <div class="sample-card-icon">🧅</div>
                        <div class="sample-card-info">
                            <span class="sample-name">خلايا نباتية (البصل)</span>
                            <span class="sample-desc">نسيج ناعم من قشرة البصل المصبوبة</span>
                        </div>
                    </button>
                    <button type="button" class="sample-card-btn" data-sample="animal_red">
                        <div class="sample-card-icon">🧬</div>
                        <div class="sample-card-info">
                            <span class="sample-name">خلايا حيوانية جسدية</span>
                            <span class="sample-desc">مسحة خلايا كائن حي مصبوغة</span>
                        </div>
                </div>
            </div>

            <!-- Floating Preparation Steps Checklist Card (Right Side) -->
            <aside class="prep-checklist-card" id="prepChecklistCard">
                <div class="checklist-header">
                    <i class="fas fa-tasks"></i> <span>خطوات تحضير الشريحة:</span>
                </div>
                <ul class="checklist-items">
                    <li id="chkStep1" class="chk-item"><i class="far fa-circle"></i> <span>1. أخذ شريحة زجاجية من العلبة</span></li>
                    <li id="chkStep2" class="chk-item"><i class="far fa-circle"></i> <span>2. وضع نسيج العينة على الشريحة</span></li>
                    <li id="chkStep3" class="chk-item"><i class="far fa-circle"></i> <span>3. إضافة قطرة الصباغ المناسبة</span></li>
                    <li id="chkStep4" class="chk-item"><i class="far fa-circle"></i> <span>4. تغطية العينة بالغطاء الزجاجي</span></li>
                    <li id="chkStep5" class="chk-item"><i class="far fa-circle"></i> <span>5. سحب وتثبيت الشريحة بالمجهر</span></li>
                </ul>
            </aside>
        </div>

        <!-- 100% Full Stage Microscope Viewport (Phase 2) -->
        <main class="stage-panel" id="stagePanel" style="display: none;">
            
            <!-- Top Controls Toolbar -->
            <div class="stage-top-controls">
                <!-- Mitosis Division Title Badge -->
                <div class="division-title-badge">
                    <i class="fas fa-divide"></i> <span>الانقسام الميتوزي (Mitosis)</span>
                </div>

                <!-- Slide Sample Selector -->
                <button class="stage-btn" id="btnSlideSample" title="طاولة التحضير وتغيير الشريحة">
                    <i class="fas fa-microscope"></i> <span id="slideSampleLabel">طاولة التحضير وتغيير الشريحة</span>
                </button>
            </div>

            <!-- Microscope Continuous Zoom Controls Panel (Top Left) -->
            <aside class="microscope-controls-bar">
                <div class="panel-section-title"><i class="fas fa-search-plus"></i> قوة التكبير (Zoom)</div>
                <div class="zoom-slider-wrapper">
                    <input type="range" min="1" max="100" value="45" id="zoomRangeInput" class="zoom-range-input">
                    <span id="zoomPercentageBadge" class="zoom-badge">45%</span>
                </div>
            </aside>

            <!-- Left Middle Cell Explanation Panel (لوحة الشرح التفاعلية) -->
            <aside class="cell-explanation-panel" id="cellExplanationPanel">
                <div class="panel-header">
                    <div class="panel-header-title">
                        <div class="panel-header-icon"><i class="fas fa-microscope"></i></div>
                        <span>بطاقة تفاصيل الخلية</span>
                    </div>
                </div>
                <div class="panel-body" id="cellExplanationBody">
                    <div class="empty-state">
                        <i class="fas fa-hand-pointer"></i>
                        <p>انقر على أي خلية داخل حقل المجهر للتعرف على طورها وشرحها العلمي.</p>
                    </div>
                </div>
            </aside>

            <!-- Spotlight Dimming Mask Layer -->
            <div class="spotlight-mask" id="spotlightMask"></div>

            <!-- Dynamic Anatomical Callout Pins Container -->
            <div class="callout-overlay" id="calloutOverlay"></div>

            <!-- Primary Microscope 2D Slide Canvas -->
            <canvas id="canvas2d"></canvas>
            
            <!-- Live Drawing & Annotation Canvas Overlay -->
            <canvas id="annotationCanvas"></canvas>

            <!-- Virtual Laser Pointer Particle Canvas -->
            <canvas id="laserCanvas"></canvas>

            <!-- Teacher Dock: Quick Phase Transition Presets (شريط الانتقال السريع للأطوار) -->
            <nav class="teacher-dock" id="teacherDock">
                <div class="dock-group-title">
                    <i class="fas fa-bolt"></i> الأطوار السريعة:
                </div>

                <div id="phaseButtonsContainer" style="display: flex; gap: 8px;">
                    <button class="phase-btn active" data-phase="interphase">
                        <span class="phase-title">الطور البيني</span>
                        <span class="phase-sub">Interphase</span>
                    </button>
                    
                    <button class="phase-btn" data-phase="prophase">
                        <span class="phase-title">الطور التمهيدي</span>
                        <span class="phase-sub">Prophase</span>
                    </button>

                    <button class="phase-btn" data-phase="metaphase">
                        <span class="phase-title">الطور الاستوائي</span>
                        <span class="phase-sub">Metaphase</span>
                    </button>

                    <button class="phase-btn" data-phase="anaphase">
                        <span class="phase-title">الطور الانفصالي</span>
                        <span class="phase-sub">Anaphase</span>
                    </button>

                    <button class="phase-btn" data-phase="telophase">
                        <span class="phase-title">الطور النهائي</span>
                        <span class="phase-sub">Telophase</span>
                    </button>
                </div>
            </nav>

        </main>
    </div>

    <!-- Three.js Import Map -->
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js"
        }
    }
    </script>

    <!-- Clean Architecture Entry Point -->
    <script type="module" src="../js/experiments/cell_division/app.js?v=<?= $js_v ?>"></script>
</body>
</html>
