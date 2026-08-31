<?php
// experiments/photosynthesis_factors.php
require_once '../config.php';
require_once '../functions.php';

// Prevent browser caching for instant UI updates
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

$sub = isAuthenticated();

$user_name = $_SESSION['user']['name'] ?? $_SESSION['user_name'] ?? 'معلم معتمد';
$user_contact = $_SESSION['user']['whatsappNumber'] ?? $_SESSION['user']['phone'] ?? $_SESSION['user']['email'] ?? '';

// Check experiment active state in database
$exp_active = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM experiments WHERE code_name = 'photosynthesis_factors' OR id = 8"))['is_active'] ?? 1;
if (!$exp_active) {
    header("Location: ../my-experiments.php?msg=experiment_disabled");
    exit();
}

$css_v = file_exists('../css/photosynthesis_factors.css') ? filemtime('../css/photosynthesis_factors.css') : time();
$js_v  = file_exists('../js/experiments/photosynthesis_factors/app.js') ? filemtime('../js/experiments/photosynthesis_factors/app.js') : time();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>العوامل المؤثرة على البناء الضوئي | مختبرات العلوم والتقنية</title>
    
    <!-- Google Fonts Cairo -->
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <!-- FontAwesome 6 Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Chart.js for live graphing -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- CSS stylesheet with Cache-Busting -->
    <link rel="stylesheet" href="../css/photosynthesis_factors.css?v=<?= $css_v ?>">
</head>
<body>

    <!-- Top Navigation Header -->
    <header class="lab-header">
        <a href="../my-experiments.php" class="lab-brand">
            <i class="fas fa-seedling"></i>
            <span>العوامل المؤثرة على البناء الضوئي</span>
        </a>

        <!-- Segmented Tab Switcher -->
        <div class="header-mode-switcher">
            <button type="button" class="tab-btn active" id="btnTabLeaf" data-tab="leaf">
                <i class="fas fa-leaf"></i> <span>أقراص السبانخ الطافية</span>
            </button>
            <button type="button" class="tab-btn" id="btnTabIndicator" data-tab="indicator">
                <i class="fas fa-vial"></i> <span>كاشف الهيدروجين</span>
            </button>
            <button type="button" class="tab-btn" id="btnTabAudus" data-tab="audus">
                <i class="fas fa-ruler-combined"></i> <span>مانوميتر أودوم</span>
            </button>
        </div>

        <div class="header-actions">
            <a href="../my-experiments.php" class="exit-btn">
                <i class="fas fa-sign-out-alt"></i> <span>خروج</span>
            </a>
        </div>
    </header>

    <!-- Main Workspace Container -->
    <main class="lab-main-container">

        <!-- Toast Notifications Area -->
        <div id="toastContainer" class="toast-container"></div>

        <!-- Educational Summary & Concept Card (Collapsible) -->
        <div class="exp-summary-card" id="summaryCard">
            <div class="summary-header">
                <div class="header-title">
                    <i class="fas fa-lightbulb"></i>
                    <span>الأساس العلمي: العوامل المؤثرة في عملية البناء الضوئي (Photosynthesis)</span>
                </div>
                <button type="button" class="card-toggle-btn" id="btnCollapseCard" title="طي/فتح البطاقة">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
            <div class="summary-content" id="summaryContent">
                <div class="summary-grid">
                    <div class="summary-box">
                        <h4><i class="fas fa-sun"></i> شدة الضوء ولونه</h4>
                        <p>تزداد سرعة البناء الضوئي بزيادة شدة الإضاءة حتى تصل للنقطة الحرجة. يمتص البلاستيد الضوء الأحمر (660nm) والأزرق (450nm) بكفاءة عالية، بينما يعكس الضوء الأخضر.</p>
                    </div>
                    <div class="summary-box">
                        <h4><i class="fas fa-cloud-sun"></i> تركيز ثاني أكسيد الكربون (CO₂)</h4>
                        <p>يعتبر CO₂ ركيزة أساسية لتفاعلات الظلام (دورة كالفن). تزويد الماء بـ NaHCO₃ يوفر مركب CO₂ الذائب اللازم لتكوين الجلوكوز والأكسجين.</p>
                    </div>
                    <div class="summary-box">
                        <h4><i class="fas fa-thermometer-half"></i> درجة الحرارة وقانون بلاكمان</h4>
                        <p>تخضع إنزيمات التثبيت لـ (Q10 Rule). تزداد السرعة حتى درجة الحرارة المثلى (35°C - 40°C) ثم تنخفض حاداً بسبب التلف الإنزيمي (Denaturation).</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- VIEW 1: Floating Leaf Disk Assay -->
        <section class="tab-view active" id="viewLeaf">
            <div class="sim-grid">
                <!-- Left Simulation Canvas Column -->
                <div class="canvas-card">
                    <div class="card-bar">
                        <h3><i class="fas fa-flask"></i> محاكاة أقراص أوراق السبانخ الطافية</h3>
                        <div class="timer-badge" id="leafTimerBadge">00:00.0</div>
                    </div>
                    <div class="canvas-wrapper">
                        <canvas id="canvasLeafDisks" width="800" height="500"></canvas>
                        <!-- Light cone overlay dynamically updated by JS -->
                        <div class="light-beam-overlay" id="leafLightOverlay"></div>
                    </div>
                </div>

                <!-- Right Controls & Dashboard Column -->
                <div class="dashboard-card">
                    <div class="ctrl-panel">
                        <h3><i class="fas fa-sliders-h"></i> عوامل التجربة التحكمية</h3>
                        
                        <!-- Light Intensity Slider -->
                        <div class="ctrl-group">
                            <label>شدة الإضاءة: <span id="valLeafLight">80%</span></label>
                            <input type="range" id="rangeLeafLight" min="0" max="100" value="80" step="5">
                        </div>

                        <!-- Light Spectrum Selector -->
                        <div class="ctrl-group">
                            <label>الطول الموجي للضوء (اللون):</label>
                            <div class="color-btn-group">
                                <button class="color-btn active" data-color="yellow" style="background:#fef08a; color:#854d0e;">أصفر (580nm)</button>
                                <button class="color-btn" data-color="blue" style="background:#3b82f6; color:#fff;">أزرق (450nm)</button>
                                <button class="color-btn" data-color="red" style="background:#ef4444; color:#fff;">أحمر (660nm)</button>
                                <button class="color-btn" data-color="green" style="background:#22c55e; color:#fff;">أخضر (530nm)</button>
                            </div>
                        </div>

                        <!-- NaHCO3 Concentration Slider -->
                        <div class="ctrl-group">
                            <label>تركيز بيكربونات الصوديوم (NaHCO₃): <span id="valLeafNacoh">0.5%</span></label>
                            <input type="range" id="rangeLeafNacoh" min="0.0" max="1.0" value="0.5" step="0.1">
                        </div>

                        <!-- Action Controls -->
                        <div class="btn-action-row">
                            <button class="action-btn primary" id="btnStartLeafTimer"><i class="fas fa-play"></i> بدء التجربة</button>
                            <button class="action-btn secondary" id="btnPauseLeafTimer"><i class="fas fa-pause"></i> إيقاف</button>
                            <button class="action-btn danger" id="btnResetLeaf"><i class="fas fa-undo"></i> إعادة</button>
                        </div>
                        <div class="speed-row">
                            <span>السرعة:</span>
                            <button class="speed-btn active" data-speed="1">1x</button>
                            <button class="speed-btn" data-speed="5">5x</button>
                            <button class="speed-btn" data-speed="10">10x</button>
                        </div>
                    </div>

                    <!-- Metrics Dashboard -->
                    <div class="metrics-panel">
                        <div class="metric-box">
                            <span class="m-title">الأقراص الطافية</span>
                            <span class="m-val" id="metricFloatingCount">0 / 10</span>
                        </div>
                        <div class="metric-box">
                            <span class="m-title">زمن طفو 50% (ET₅₀)</span>
                            <span class="m-val" id="metricET50">---</span>
                        </div>
                        <div class="metric-box">
                            <span class="m-title">معدل البناء الضوئي (1 / ET₅₀)</span>
                            <span class="m-val" id="metricLeafRate">---</span>
                        </div>
                    </div>

                    <!-- Chart Container -->
                    <div class="chart-container">
                        <canvas id="chartLeafDisks"></canvas>
                    </div>
                </div>
            </div>
        </section>

        <!-- VIEW 2: Hydrogencarbonate Indicator -->
        <section class="tab-view" id="viewIndicator">
            <div class="sim-grid">
                <!-- Left Tubes Rack Interactive Workspace -->
                <div class="canvas-card">
                    <div class="card-bar">
                        <h3><i class="fas fa-vial"></i> أنابيب اختبار كاشف بيكربونات الهيدروجين</h3>
                        <span class="sub-note">انقر على أي أنبوب لقياس درجة الحموضة وقراءة الطيف الضوئي!</span>
                    </div>
                    <div class="tubes-rack-workspace" id="tubesRack">
                        <!-- 4 Interactive Tubes rendered via JS -->
                    </div>
                </div>

                <!-- Right Controls & Spectrophotometer Dashboard -->
                <div class="dashboard-card">
                    <div class="ctrl-panel">
                        <h3><i class="fas fa-sliders-h"></i> العوامل البيئية والتنفسية</h3>

                        <!-- Light Level Slider -->
                        <div class="ctrl-group">
                            <label>شدة الإضاءة العامة: <span id="valIndLight">600 Lux</span></label>
                            <input type="range" id="rangeIndLight" min="0" max="1000" value="600" step="50">
                        </div>

                        <!-- Temperature Slider (Q10 Rule) -->
                        <div class="ctrl-group">
                            <label>درجة الحرارة: <span id="valIndTemp">25°C</span></label>
                            <input type="range" id="rangeIndTemp" min="5" max="45" value="25" step="1">
                        </div>

                        <!-- Time Lapse Simulation Speed -->
                        <div class="ctrl-group">
                            <label>زمن الانقضاء: <span id="valIndTime">0 دقيقة</span></label>
                            <input type="range" id="rangeIndTime" min="0" max="120" value="0" step="5">
                        </div>

                        <!-- Action Buttons -->
                        <div class="btn-action-row">
                            <button class="action-btn primary" id="btnRunInd"><i class="fas fa-play"></i> تشغيل التفاعل</button>
                            <button class="action-btn danger" id="btnResetInd"><i class="fas fa-undo"></i> إعادة ضبط الأنابيب</button>
                        </div>
                    </div>

                    <!-- Spectrophotometer / Colorimeter Tool Inspection Panel -->
                    <div class="spectro-panel" id="spectroPanel">
                        <div class="spectro-header">
                            <i class="fas fa-microscope"></i>
                            <span>جهاز قياس الطيف والـ pH (Spectrophotometer)</span>
                        </div>
                        <div class="spectro-grid">
                            <div class="spec-box">
                                <span class="s-label">الأنبوب المحدد:</span>
                                <span class="s-val" id="specTubeName">اختر أنبوباً</span>
                            </div>
                            <div class="spec-box">
                                <span class="s-label">درجة الـ pH:</span>
                                <span class="s-val" id="specPH">--</span>
                            </div>
                            <div class="spec-box">
                                <span class="s-label">تركيز CO₂:</span>
                                <span class="s-val" id="specCO2">-- ppm</span>
                            </div>
                            <div class="spec-box">
                                <span class="s-label">الكثافة الضوئية (OD):</span>
                                <span class="s-val" id="specOD">--</span>
                            </div>
                        </div>
                    </div>

                    <!-- Chart Container -->
                    <div class="chart-container">
                        <canvas id="chartIndicator"></canvas>
                    </div>
                </div>
            </div>
        </section>

        <!-- VIEW 3: Audus Micro-Respirometer -->
        <section class="tab-view" id="viewAudus">
            <div class="sim-grid">
                <!-- Left Apparatus Workspace -->
                <div class="canvas-card">
                    <div class="card-bar">
                        <h3><i class="fas fa-ruler-combined"></i> جهاز مانوميتر أودوم لقياس حجم غاز الأكسجين</h3>
                        <span class="sub-note">قانون التربيع العكسي للضوء: (I ∝ 1/d²)</span>
                    </div>
                    <div class="audus-workspace" id="audusWorkspace">
                        <!-- SVG / Canvas Interactive Apparatus rendered via JS -->
                    </div>
                </div>

                <!-- Right Controls & Data Table Dashboard -->
                <div class="dashboard-card">
                    <div class="ctrl-panel">
                        <h3><i class="fas fa-sliders-h"></i> ضبط المسافة والعوامل</h3>

                        <!-- Lamp Distance Track Slider -->
                        <div class="ctrl-group">
                            <label>مسافة المصباح (d): <span id="valAudusDist">20 cm</span></label>
                            <input type="range" id="rangeAudusDist" min="10" max="100" value="20" step="2">
                            <small class="hint-text">شدة الضوء المحسوبة (I ∝ 1/d²): <strong id="valAudusIntensity">2500 Lux</strong></small>
                        </div>

                        <!-- Water Bath Temp Slider -->
                        <div class="ctrl-group">
                            <label>حرارة الحمام المائي: <span id="valAudusTemp">25°C</span></label>
                            <input type="range" id="rangeAudusTemp" min="5" max="50" value="25" step="1">
                        </div>

                        <!-- CO2 Conc Slider -->
                        <div class="ctrl-group">
                            <label>تركيز CO₂ الذائب: <span id="valAudusCO2">0.20%</span></label>
                            <input type="range" id="rangeAudusCO2" min="0.01" max="0.50" value="0.20" step="0.01">
                        </div>

                        <!-- Buttons Row -->
                        <div class="btn-action-row">
                            <button class="action-btn primary" id="btnStartAudus"><i class="fas fa-play"></i> بدء التجربة</button>
                            <button class="action-btn secondary" id="btnPauseAudus"><i class="fas fa-pause"></i> إيقاف</button>
                            <button class="action-btn primary" id="btnRecordAudusData"><i class="fas fa-save"></i> تسجيل القراءة</button>
                            <button class="action-btn danger" id="btnResetSyringe"><i class="fas fa-undo"></i> تصفير</button>
                        </div>
                    </div>

                    <!-- Recorded Data Table -->
                    <div class="data-table-wrapper">
                        <div class="table-header-flex">
                            <h4><i class="fas fa-table"></i> سجل القراءات المسجلة</h4>
                            <button class="btn-clear-table" id="btnClearAudusTable">
                                <i class="fas fa-trash-alt"></i> تفريغ السجل
                            </button>
                        </div>
                        <table class="data-table" id="audusDataTable">
                            <thead>
                                <tr>
                                    <th>المسافة (cm)</th>
                                    <th>الشدة النسبيية (1/d²)</th>
                                    <th>الحرارة (°C)</th>
                                    <th>الحجم المجمع (mm³)</th>
                                    <th>المعدل (mm³/min)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="empty-row"><td colspan="5">لا توجد قراءات مسجلة بعد</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Chart Container -->
                    <div class="chart-container">
                        <canvas id="chartAudus"></canvas>
                    </div>
                </div>
            </div>
        </section>

    </main>

    <!-- Global Watermark -->
    <script src="../js/watermark.js?v=<?= time() ?>"></script>

    <!-- ES6 Modules Scripts -->
    <script type="module" src="../js/experiments/photosynthesis_factors/app.js?v=<?= $js_v ?>"></script>
</body>
</html>
