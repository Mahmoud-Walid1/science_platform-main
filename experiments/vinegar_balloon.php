<?php
// experiments/vinegar_balloon.php
require_once '../config.php';
require_once '../functions.php';

// منع التخزين المؤقت لضمان تحديث الأصول دائماً
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

$sub = isAuthenticated();

$user_name = $_SESSION['user']['name'] ?? $_SESSION['user_name'] ?? 'معلم معتمد';
$user_contact = $_SESSION['user']['whatsappNumber'] ?? $_SESSION['user']['phone'] ?? $_SESSION['user']['email'] ?? '';

// التحقق من حالة تفعيل التجربة في قاعدة البيانات
$exp_active = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM experiments WHERE code_name = 'chemical_change' OR code_name = 'gas_reaction' OR id = 12"))['is_active'] ?? 1;
if (!$exp_active) {
    header("Location: ../my-experiments.php?msg=experiment_disabled");
    exit();
}

$css_v = file_exists('../css/vinegar_balloon.css') ? filemtime('../css/vinegar_balloon.css') : time();
$js_v  = file_exists('../js/experiments/vinegar_balloon/app.js') ? filemtime('../js/experiments/vinegar_balloon/app.js') : time();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>دلائل حدوث التغير الكيميائي (تكوّن غاز) | <?=SITE_NAME?></title>
    
    <!-- Google Fonts Cairo -->
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <!-- FontAwesome 6 Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS stylesheet with Cache-Busting -->
    <link rel="stylesheet" href="../css/vinegar_balloon.css?v=<?=$css_v?>">
</head>
<body>

    <!-- ==================== Top Header ==================== -->
    <header class="lab-top-header">
        <div class="header-right">
            <button class="header-icon-btn" id="btnMenuDrawer" title="القائمة الرئيسية">
                <i class="fas fa-bars"></i>
            </button>
            <h1 class="header-title-text">دلائل حدوث التغير الكيميائي (تكوّن غاز)</h1>
        </div>

        <div class="header-left">
            <button class="header-reset-btn" id="btnResetExperiment" title="إعادة التجربة من البداية">
                <i class="fas fa-sync-alt"></i>
                <span>إعادة التجربة</span>
            </button>
            <button class="header-icon-btn" id="btnToggleAudio" title="كتم / تشغيل المؤثرات الصوتية">
                <i class="fas fa-volume-up"></i>
            </button>
            <button class="header-icon-btn" id="btnHeaderHelp" title="دليل التجربة">
                <i class="fas fa-question"></i>
            </button>
            <a href="../my-experiments.php" class="header-icon-btn" title="العودة لمنصة التجارب">
                <i class="fas fa-home"></i>
            </a>
        </div>
    </header>

    <!-- ==================== Main Layout Container ==================== -->
    <div class="lab-main-container">
        
        <!-- Center Stage: Workbench & Interactive Scene -->
        <main class="lab-center-stage" id="labStage">
            <div class="lab-backdrop-room"></div>
            <div class="lab-bench-surface">
                <div class="bench-reflection-strip"></div>
            </div>

            <div class="stage-workspace-content" id="stageWorkspace">
                
                <!-- Table Items with Draggable capabilities -->
                <!-- 1. عبوة الخل الكيميائية -->
                <div class="workbench-item draggable-item" id="tableVinegarContainer" data-tool="vinegar" title="عبوة الخل المخبرية">
                    <svg class="apparatus-svg reagent-svg" viewBox="0 0 120 220" width="100%" height="100%">
                        <ellipse cx="60" cy="18" rx="14" ry="7" fill="rgba(220,240,250,0.8)" stroke="#fff" stroke-width="1" />
                        <rect x="52" y="18" width="16" height="14" rx="2" fill="rgba(200,230,245,0.8)" />
                        <rect x="48" y="32" width="24" height="28" fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.7)" />
                        <path d="M 48 60 Q 20 85 20 120 L 20 200 Q 20 215 60 215 Q 100 215 100 200 L 100 120 Q 100 85 72 60 Z" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.6)" stroke-width="2" />
                        <path d="M 23 125 Q 60 130 97 125 L 97 200 Q 60 212 23 200 Z" fill="rgba(245, 230, 180, 0.85)" />
                        <rect x="35" y="140" width="50" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
                        <text x="60" y="156" font-size="12" font-family="Cairo" font-weight="bold" fill="#0f172a" text-anchor="middle">خل</text>
                        <text x="60" y="172" font-size="9" font-family="Arial, sans-serif" fill="#64748b" text-anchor="middle">CH₃COOH</text>
                    </svg>
                </div>

                <!-- 2. القمع على الطاولة -->
                <div class="workbench-item draggable-item" id="tableFunnelContainer" data-tool="funnel" title="قمع مخبري زجاجي">
                    <svg class="apparatus-svg funnel-svg" viewBox="0 0 120 160" width="100%" height="100%">
                        <ellipse cx="60" cy="18" rx="55" ry="12" fill="rgba(230,245,255,0.85)" stroke="rgba(255,255,255,0.8)" stroke-width="2" />
                        <path d="M 5 18 L 54 85 L 54 150 L 66 150 L 66 85 L 115 18 Z" fill="rgba(220,240,255,0.6)" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />
                    </svg>
                </div>

                <!-- 3. الملعقة الستانلس ستيل -->
                <div class="workbench-item draggable-item" id="tableSpoonContainer" data-tool="spoon" title="ملعقة تعبئة المسحوق">
                    <svg class="apparatus-svg spoon-svg" viewBox="0 0 160 80" width="100%" height="100%">
                        <path d="M 45 40 Q 110 32 155 35 Q 158 45 155 48 Q 110 42 45 44 Z" fill="#cbd5e1" stroke="#475569" stroke-width="1" />
                        <ellipse cx="32" cy="42" rx="28" ry="18" fill="#e2e8f0" stroke="#475569" stroke-width="1.5" />
                    </svg>
                </div>

                <!-- 4. وعاء مسحوق بيكربونات الصوديوم -->
                <div class="workbench-item draggable-item" id="tableSodaBowlContainer" data-tool="soda" title="وعاء بيكربونات الصوديوم">
                    <svg class="apparatus-svg bowl-svg" viewBox="0 0 160 110" width="100%" height="100%">
                        <ellipse cx="80" cy="98" rx="60" ry="10" fill="rgba(0,0,0,0.2)" />
                        <path d="M 15 45 Q 25 100 80 100 Q 135 100 145 45 Z" fill="rgba(220,240,255,0.3)" stroke="rgba(255,255,255,0.7)" stroke-width="2" />
                        <path d="M 22 46 Q 80 15 138 46 Q 80 58 22 46 Z" fill="#ffffff" stroke="#f1f5f9" stroke-width="1" />
                        <ellipse cx="80" cy="45" rx="65" ry="12" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" />
                        <!-- ملصق بيكربونات الصوديوم على الصحن -->
                        <rect x="42" y="60" width="76" height="28" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
                        <text x="80" y="73" font-size="8.5" font-family="Cairo, sans-serif" font-weight="bold" fill="#0f172a" text-anchor="middle">بيكربونات الصوديوم</text>
                        <text x="80" y="83" font-size="7.5" font-family="Arial, sans-serif" fill="#64748b" text-anchor="middle">NaHCO₃</text>
                    </svg>
                </div>

                <!-- 5. البالون على الطاولة (قبل تركيبه) -->
                <div class="workbench-item draggable-item" id="tableBalloonContainer" data-tool="balloon" title="بالون مطاطي مرن">
                    <div class="snap-target" id="targetBalloonMouth" data-target-id="balloonMouth"></div>
                    <div class="balloon-funnel-slot" id="balloonFunnelSlot"></div>
                    <div class="pouring-stream" id="sodaPourAnimation"></div>
                    <div class="table-balloon-graphic" id="tableBalloonGraphic">
                        <svg class="apparatus-svg balloon-deflated-svg" viewBox="0 0 140 180" width="100%" height="100%">
                            <defs>
                                <radialGradient id="balloonTablePhpGloss" cx="35%" cy="30%" r="65%">
                                    <stop offset="0%" stop-color="#93c5fd" />
                                    <stop offset="25%" stop-color="#38bdf8" />
                                    <stop offset="60%" stop-color="#0284c7" />
                                    <stop offset="90%" stop-color="#0369a1" />
                                    <stop offset="100%" stop-color="#075985" />
                                </radialGradient>
                                <filter id="balloonTablePhpShadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="rgba(2,132,199,0.4)" />
                                </filter>
                            </defs>
                            <!-- فوهة وعنق البالون لأعلى: حلقة مطاطية ملفوفة لاستقبال القمع -->
                            <ellipse cx="70" cy="20" rx="13" ry="4.5" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5" />
                            <ellipse cx="70" cy="20" rx="8" ry="2.5" fill="#0369a1" />
                            <!-- كيس البالون المطاطي المفرغ تماماً وغير المنفوخ (نحيف ومسترخٍ) -->
                            <path d="M 59 20 L 59 55 C 59 75, 47 98, 47 128 C 47 158, 56 168, 70 168 C 84 168, 93 158, 93 128 C 93 98, 81 75, 81 55 L 81 20 Z" 
                                  fill="url(#balloonTablePhpGloss)" stroke="#0284c7" stroke-width="1.5" filter="url(#balloonTablePhpShadow)" />
                            <!-- ثنايا وتجاعيد المطاط المفرغ الواقعية غير المنفوخ -->
                            <path d="M 68 55 C 67 90, 68 125, 70 155" stroke="rgba(3,105,161,0.5)" stroke-width="2" stroke-linecap="round" fill="none" />
                            <path d="M 54 85 C 50 110, 52 135, 58 145" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round" fill="none" />
                            <!-- مسحوق البيكربونات الأبيض داخل قاع البالون المفرغ (يظهر بعد التعبئة) -->
                            <g class="balloon-powder-fill" id="balloonPowderFill" style="display: none;">
                                <path d="M 50 138 C 50 158, 58 166, 70 166 C 82 166, 90 158, 90 138 Q 70 144 50 138 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
                            </g>
                        </svg>
                    </div>
                </div>

                <!-- المنطقة المركزية: الزجاجة والتفاعل والبالون المنفوخ -->
                <div class="central-apparatus-zone">
                    <div class="snap-target" id="targetBottleMouth" data-target-id="bottleMouth"></div>
                    <div class="bottle-funnel-slot" id="bottleFunnelSlot"></div>
                    <div class="pouring-stream" id="vinegarPourAnimation"></div>
                    <div class="vinegar-volume-badge" id="vinegarVolumeBadge" style="display: none; opacity: 0;">0 مل</div>
                    <div class="active-balloon-slot" id="activeBalloonSlot" title="انقر لرفع البالون وبدء التفاعل"></div>

                    <!-- جسم الزجاجة الرئيسي مع فقاعات التفاعل -->
                    <div class="bottle-housing" id="centralBottleContainer">
                        <svg class="apparatus-svg bottle-svg" viewBox="0 0 160 380" width="100%" height="100%">
                            <ellipse cx="80" cy="370" rx="60" ry="8" fill="rgba(0,0,0,0.25)" />
                            <path d="M 66 40 L 94 40 L 94 65 Q 98 75 106 88 L 126 125 Q 130 135 130 150 L 130 350 Q 130 365 110 365 L 50 365 Q 30 365 30 350 L 30 150 Q 30 135 34 125 L 54 88 Q 62 75 66 65 Z" fill="rgba(220,240,255,0.2)" stroke="rgba(255,255,255,0.6)" stroke-width="2" />
                            <path d="M 30 180 Q 80 188 130 180" stroke="rgba(255,255,255,0.35)" stroke-width="2" fill="none" />
                            <path d="M 30 220 Q 80 228 130 220" stroke="rgba(255,255,255,0.35)" stroke-width="2" fill="none" />
                            <path d="M 30 260 Q 80 268 130 260" stroke="rgba(255,255,255,0.35)" stroke-width="2" fill="none" />
                            <path d="M 30 300 Q 80 308 130 300" stroke="rgba(255,255,255,0.35)" stroke-width="2" fill="none" />
                            <rect x="63" y="32" width="34" height="8" rx="2" fill="rgba(240,248,255,0.7)" stroke="#fff" stroke-width="1" />
                        </svg>
                    </div>
                    <canvas class="bubbles-overlay-canvas" id="bubblesCanvas"></canvas>
                </div>

            </div>
        </main>

        <!-- Right Panel: Stepper, Step Guide, Action Button & Quiz Observation -->
        <aside class="lab-right-panel">
            
            <!-- Card 1: Steps Stepper -->
            <div class="panel-card">
                <div class="stepper-header">
                    <span class="stepper-header-title">خطوات التجربة</span>
                    <div class="stepper-circles">
                        <div class="step-circle active" id="stepCircle1">1</div>
                        <div class="step-divider-line"></div>
                        <div class="step-circle" id="stepCircle2">2</div>
                        <div class="step-divider-line"></div>
                        <div class="step-circle" id="stepCircle3">3</div>
                        <div class="step-divider-line"></div>
                        <div class="step-circle" id="stepCircle4">4</div>
                    </div>
                </div>

                <div class="current-step-box">
                    <div class="current-step-title" id="currentStepTitle">1. إضافة الخل إلى الزجاجة</div>
                    <div class="current-step-desc" id="currentStepDesc">
                        اسحب القمع وضعه على فوهة الزجاجة، ثم اسكب كمية الخل عبر القمع.
                    </div>
                </div>

                <button type="button" class="btn-main-action" id="btnMainAction">
                    <i class="fas fa-play"></i> اسكب الخل عبر القمع
                </button>
            </div>

            <!-- Card 2: Scientific Observation -->
            <div class="panel-card">
                <div class="observation-card-title">الملاحظة العلمية</div>
                <div class="observation-subtitle">اختر ما تلاحظه في التجربة:</div>

                <div class="obs-options-list">
                    <label class="obs-option-label">
                        <span>تغير في اللون</span>
                        <input type="radio" name="observation" value="color" class="obs-option-input">
                    </label>
                    <label class="obs-option-label">
                        <span>تصاعد غاز</span>
                        <input type="radio" name="observation" value="gas" class="obs-option-input">
                    </label>
                    <label class="obs-option-label">
                        <span>تكوّن راسب</span>
                        <input type="radio" name="observation" value="precipitate" class="obs-option-input">
                    </label>
                </div>

                <div class="obs-feedback" id="obsFeedbackBox"></div>
            </div>

            <!-- Card 3: Variable Quantities & Impact on Balloon Size -->
            <div class="panel-card">
                <div class="quantities-title">
                    <i class="fas fa-sliders-h"></i> تجربة تغيير الكميات وحجم الانتفاخ
                </div>
                
                <div class="slider-row">
                    <div class="slider-label">
                        <span>كمية الخل (مل):</span>
                        <span id="valVinegarVol">100 مل</span>
                    </div>
                    <input type="range" min="50" max="150" step="25" value="100" class="lab-slider" id="sliderVinegarVol">
                </div>

                <div class="slider-row">
                    <div class="slider-label">
                        <span>ملاعق البيكربونات:</span>
                        <span id="valSodaSpoons">2 ملاعق</span>
                    </div>
                    <input type="range" min="1" max="3" step="1" value="2" class="lab-slider" id="sliderSodaSpoons">
                </div>

                <div class="co2-badge" id="co2YieldBadge">حجم الغاز المتوقع: ~0.85 لتر (معامل: ×1.2)</div>

                <div style="margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                    <div style="font-size: 12px; font-weight: 700; margin-bottom: 4px;">سؤال التحدي: ماذا يحدث لانتفاخ البالون عند مضاعفة كمية الخل والبيكربونات؟</div>
                    <label style="font-size: 11px; display: block; margin-bottom: 2px;">
                        <input type="radio" name="quantity_q1" value="increases"> يزداد حجم وقطر انتفاخ البالون
                    </label>
                    <label style="font-size: 11px; display: block; margin-bottom: 6px;">
                        <input type="radio" name="quantity_q1" value="stays"> يبقى حجم البالون ثابتاً دون تغير
                    </label>
                    <button type="button" id="btnSubmitQuantityQuiz" style="background:#0284c7; color:#fff; border:none; padding:4px 10px; border-radius:6px; font-family:Cairo; font-size:11px; cursor:pointer;">تحقق من الإجابة</button>
                    <div id="quantityQuizResult" style="display:none; font-size:11px; margin-top:4px; padding:4px; border-radius:4px;"></div>
                </div>
            </div>

        </aside>

    </div>

    <!-- ==================== Bottom Control Toolbar ==================== -->
    <footer class="lab-bottom-toolbar">
        <div class="bottom-tools-group">
            <button class="toolbar-btn" id="btnToolbarHints">
                <i class="far fa-lightbulb"></i> تلميحات
            </button>
            <button class="toolbar-btn" id="btnToolbarNotes">
                <i class="far fa-clipboard"></i> ملاحظاتي
            </button>
        </div>

        <div class="bottom-tools-group">
            <button class="toolbar-btn" id="btnZoomIn" title="تكبير المنظور">
                <i class="fas fa-search-plus"></i> تكبير
            </button>
            <button class="toolbar-btn" id="btnZoomOut" title="تصغير المنظور">
                <i class="fas fa-search-minus"></i> تصغير
            </button>
            <button class="toolbar-btn" id="btnFullscreen" title="ملء الشاشة">
                <i class="fas fa-expand"></i> ملء الشاشة
            </button>
        </div>
    </footer>

    <!-- ==================== Modals (Hints & Notes) ==================== -->
    <!-- Modal 1: Hints -->
    <div class="lab-modal-backdrop" id="modalHints">
        <div class="lab-modal-card">
            <div class="modal-header">
                <div class="modal-title"><i class="fas fa-lightbulb" style="color: #f59e0b;"></i> تلميحات إرشادية للتجربة</div>
                <button class="modal-close-btn" id="btnCloseHints">&times;</button>
            </div>
            <div style="font-size: 13px; line-height: 1.8; color: #334155;">
                <p><i class="fas fa-lightbulb" style="color: #f59e0b; margin-left: 6px;"></i> <strong>خطوة 1:</strong> اسحب القمع إلى فوهة الزجاجة ثم اسحب عبوة الخل لصب الكمية المحددة في الزجاجة.</p>
                <p><i class="fas fa-lightbulb" style="color: #f59e0b; margin-left: 6px;"></i> <strong>خطوة 2:</strong> اسحب القمع إلى عنق البالون واسحب الملعقة لوضع مسحوق بيكربونات الصوديوم داخل البالون.</p>
                <p><i class="fas fa-lightbulb" style="color: #f59e0b; margin-left: 6px;"></i> <strong>خطوة 3:</strong> ثبت عنق البالون على فوهة الزجاجة دون سكب المسحوق حتى تثبت بإحكام.</p>
                <p><i class="fas fa-lightbulb" style="color: #f59e0b; margin-left: 6px;"></i> <strong>خطوة 4:</strong> ارفع البالون أو اضغط "ابدأ التفاعل" لتسقط البيكربونات في الخل وتشاهد انطلاق الغاز فوراً!</p>
            </div>
        </div>
    </div>

    <!-- Modal 2: Student Notes -->
    <div class="lab-modal-backdrop" id="modalNotes">
        <div class="lab-modal-card">
            <div class="modal-header">
                <div class="modal-title"><i class="fas fa-book" style="color: #0284c7;"></i> كشكول ملاحظاتي العلمية</div>
                <button class="modal-close-btn" id="btnCloseNotes">&times;</button>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">دوّن استنتاجاتك ومشاهداتك في هذا الصندوق، يتم حفظها تلقائياً لجهازك:</p>
            <textarea class="student-notes-area" id="studentNotesText" placeholder="اكتب ملاحظاتك عن التفاعل والغاز المتصاعد وحجم البالون هنا..."></textarea>
        </div>
    </div>

    <!-- Watermark Script for Teacher Account Protection -->
    <script>
        window.WATERMARK_USER = {
            name: <?=json_encode($user_name)?>,
            contact: <?=json_encode($user_contact)?>
        };
    </script>
    <script src="../js/watermark.js?v=<?=time()?>"></script>

    <!-- Main Application Entry Point (Modular ES Modules) -->
    <script type="module" src="../js/experiments/vinegar_balloon/app.js?v=<?=$js_v?>"></script>
</body>
</html>
