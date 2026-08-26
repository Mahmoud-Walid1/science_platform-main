<?php
// experiments/ph_v2.php
require_once '../config.php';
require_once '../functions.php';

// منع التخزين المؤقت للفيوز للتأكد من تحديث الواجهة دائماً
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

$sub = isAuthenticated();

$user_name = $_SESSION['user']['name'] ?? $_SESSION['user_name'] ?? 'معلم معتمد';
$user_contact = $_SESSION['user']['whatsappNumber'] ?? $_SESSION['user']['phone'] ?? $_SESSION['user']['email'] ?? '';

// التأكد من تفعيل التجربة في قاعدة البيانات
$exp_active = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM experiments WHERE code_name = 'ph_measurement' OR id = 7"))['is_active'] ?? 1;
if (!$exp_active) {
    header("Location: ../my-experiments.php?msg=experiment_disabled");
    exit();
}

$css_v = file_exists('../css/ph_v2.css') ? filemtime('../css/ph_v2.css') : time();
$js_v  = file_exists('../js/experiments/ph_v2/app.js') ? filemtime('../js/experiments/ph_v2/app.js') : time();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>مختبر الرقم الهيدروجيني (pH) التفاعلي 3D | مختبرات العلوم والتقنية</title>
    
    <!-- Google Fonts Cairo -->
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <!-- FontAwesome 6 Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS stylesheet with Cache-Busting -->
    <link rel="stylesheet" href="../css/ph_v2.css?v=<?= $css_v ?>">
</head>
<body>

    <!-- Header Navigation with Switcher -->
    <header class="lab-header-v2">
        <a href="../my-experiments.php" class="lab-brand-v2">
            <i class="fas fa-flask"></i>
            <span>مختبر الرقم الهيدروجيني (pH)</span>
        </a>

        <!-- Segmented Switcher (Same layout as Mixtures Separation) -->
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

    <!-- Main Workspace Container -->
    <div class="lab-container-v2">
        
        <!-- 3D Lab Panel (Full Width) -->
        <main class="stage-panel" id="stagePanel3D">
            
            <!-- Stepper Banner / Instructions Banner -->
            <div class="stepper-banner" id="experimentStepper">
                <span id="stepBadge" class="step-badge">المرحلة الحرة</span>
                <span id="stepText">اسحب أوراق عباد الشمس أو مجس الرقم الهيدروجيني واغمرها داخل أي كأس للمعايرة</span>
            </div>

            <!-- Toast Messages -->
            <div class="toast-notification" id="toastMsg">
                <i class="fas fa-info-circle" id="toastIcon"></i>
                <span id="toastText">رسالة نظام</span>
            </div>

            <!-- 3D Canvas Work Area -->
            <div class="canvas-wrapper">
                <canvas id="canvas3d"></canvas>
                
                <!-- Floating labels under beakers -->
                <div class="beaker-labels-container" id="beakerLabels">
                    <!-- Added dynamically in 3D scene mapping -->
                </div>

                <!-- Guidance Help Pill -->
                <div class="nav-help-pill" id="dragHelpPill">
                    <i class="fas fa-hand-pointer"></i> <span>تلميح: اسحب الأوراق الملونة أو مجس جهاز pH واغمرها في أي كأس للقياس 🧪</span>
                </div>

                <!-- Zoom Controls Bar -->
                <div class="sim-controls-bar" id="zoomControlsBar">
                    <button class="ctrl-btn" id="btnZoomIn" title="تكبير المشهد"><i class="fas fa-plus"></i></button>
                    <button class="ctrl-btn" id="btnZoomOut" title="تصغير المشهد"><i class="fas fa-minus"></i></button>
                    <button class="ctrl-btn" id="btnResetCamera" title="العودة للمنظور الكامل"><i class="fas fa-expand"></i></button>
                </div>

                <!-- Floating Digital pH Meter Reading HUD Badge -->
                <div class="ph-digital-hud" id="phDigitalHud" style="display: none;">
                    <div class="hud-label"><i class="fas fa-bolt" style="color: #00ff66;"></i> قراءة الـ pH:</div>
                    <div class="hud-value" id="hudValue">0.00</div>
                    <div class="hud-unit">pH</div>
                </div>
            </div>

            <!-- Scientific Overview & Explanation Card (Collapsible) -->
            <div class="exp-summary-card" id="expSummaryCard">
                <div class="summary-header" id="summaryHeader">
                    <div class="summary-header-title">
                        <i class="fas fa-microscope"></i>
                        <span>فكرة التجربة العلمية وكيفية تغير الألوان:</span>
                    </div>
                    <button type="button" class="toggle-summary-btn" id="btnToggleSummary" title="إخفاء / إظهار الشرح">
                        <i class="fas fa-chevron-down" id="toggleSummaryIcon"></i>
                    </button>
                </div>
                <div class="summary-content" id="summaryContent">
                    <div class="summary-item acid-item">
                        <i class="fas fa-vial" style="color: #ef4444;"></i>
                        <div>
                            <strong>المحاليل الحمضية (pH < 7):</strong>
                            <p>تحول ورقة عباد الشمس الزرقاء إلى اللون الاحـمر (كالليمون والخل). تزداد شدة وقتمة اللون الأحمر كلما زادت الحمضية.</p>
                        </div>
                    </div>
                    <div class="summary-item neutral-item">
                        <i class="fas fa-droplet" style="color: #0ea5e9;"></i>
                        <div>
                            <strong>المحاليل المتعادلة (pH = 7):</strong>
                            <p>لا تؤثر على ألوان الأوراق الملونة وتظل كألوانها الأصلية (كالماء المقطر).</p>
                        </div>
                    </div>
                    <div class="summary-item base-item">
                        <i class="fas fa-pump-soap" style="color: #2563eb;"></i>
                        <div>
                            <strong>المحاليل القاعدية (pH > 7):</strong>
                            <p>تحول ورقة عباد الشمس الحمراء إلى اللون الأزرق (كماء الصابون والبيكربونات). تزداد شدة وقتمة اللون الأزرق كلما زادت القاعدية.</p>
                        </div>
                    </div>
                    <div class="summary-item meter-item">
                        <i class="fas fa-bolt" style="color: #f59e0b;"></i>
                        <div>
                            <strong>جهاز pH Meter الرقمي:</strong>
                            <p>يقيس تركيز أيونات الهيدروجين بدقة ويعطي قيمة رقمية مباشرة (اضغط على الزر الدائري الأحمر لتشغيله!).</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Control Bar -->
            <div class="bottom-controls-bar">
                <button type="button" class="bottom-btn secondary-btn" id="btnOpenInstructions">
                    <i class="fas fa-question-circle"></i> تعليمات التجربة
                </button>
                <button type="button" class="bottom-btn primary-btn" id="btnReset">
                    <i class="fas fa-rotate-right"></i> إعادة تهيئة التجربة
                </button>
            </div>

        </main>

        <!-- Educational Tab Panel (Hidden by default, displayed via Mode Switcher) -->
        <main class="educational-panel" id="educationalPanel" style="display: none;">
            <div id="pane-observations">
                <!-- Rendered dynamically by QuizEngine -->
            </div>
            <div id="pane-conclusions">
                <!-- Rendered dynamically by QuizEngine -->
            </div>
            <div id="pane-quiz">
                <!-- Rendered dynamically by QuizEngine -->
            </div>
        </main>
    </div>

    <!-- Instructions Modal Popup -->
    <div class="instructions-modal-overlay" id="instructionsModal">
        <div class="instructions-modal-card">
            <div class="modal-header">
                <h3><i class="fas fa-book-open"></i> شرح ودليل تجربة الرقم الهيدروجيني (pH)</h3>
                <button type="button" class="close-modal-btn" id="btnCloseInstructions"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <h4>🧪 فكرة التجربة العلمية:</h4>
                <p>الرقم الهيدروجيني (pH) هو مقياس تركيز أيونات الهيدروجين بالسوائل لمعرفة حمضيتها أو قاعديتها وتتدرج قيمه من 0 إلى 14:</p>
                <ul>
                    <li><strong style="color: var(--accent-red);">المحاليل الحمضية (pH < 7):</strong> مثل عصير الليمون والخل، وتحول لون ورقة عباد الشمس الزرقاء للأحمر.</li>
                    <li><strong style="color: #64748b;">المحاليل المتعادلة (pH = 7):</strong> مثل الماء المقطر، ولا تؤثر على ألوان أوراق عباد الشمس.</li>
                    <li><strong style="color: var(--accent-blue);">المحاليل القاعدية (pH > 7):</strong> مثل ماء الصابون وبيكربونات الصوديوم، وتحول الورقة الحمراء للأزرق.</li>
                </ul>

                <h4 style="margin-top: 20px;">💡 كيفية إجراء الفحص في المختبر المفتوح:</h4>
                <ol>
                    <li><strong>أولاً:</strong> الكؤوس الخمسة مصطفة أمامك على الطاولة مع بطاقاتها التعرفية.</li>
                    <li><strong>ثانياً:</strong> على الطاولة بالجانب الأيسر توجد أوراق عباد الشمس الزرقاء والحمراء. يمكنك سحب أي ورقة بالماوس وغمرها في الكأس المطلوب لتلاحظ تغير اللون. 
                        <br><em>(ملاحظة: الورقة المستخدمة لا يمكن إعادة غمرها، اضغط "إعادة تهيئة" للحصول على أوراق جديدة).</em>
                    </li>
                    <li><strong>ثالثاً:</strong> على الجانب الأيمن يوجد جهاز pH Meter الرقمي. اضغط على الزر الأحمر الصغير لتشغيله أولاً، ثم اسحب المجس واغمره في الكأس لقراءة الـ pH.</li>
                    <li><strong>رابعاً:</strong> انتقل لتبويب "المعلومات والأسئلة والتقييم" بالأعلى لملء الجدول وحل أسئلة التقييم الذاتي.</li>
                </ol>
            </div>
        </div>
    </div>

    <!-- Watermark for Teacher Screens -->
    <script>
        window.WATERMARK_USER = {
            name: <?=json_encode($user_name)?>,
            contact: <?=json_encode($user_contact)?>
        };
    </script>
    <script src="../js/watermark.js?v=<?=time()?>"></script>
    
    <!-- Three.js Import Map -->
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js"
        }
    }
    </script>

    <!-- ES Module App Entry Point -->
    <script type="module" src="../js/experiments/ph_v2/app.js?v=<?= $js_v ?>"></script>
</body>
</html>
