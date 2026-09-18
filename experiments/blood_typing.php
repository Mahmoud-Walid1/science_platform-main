<?php
require_once '../config.php';
require_once '../functions.php';

// Prevent caching for active lab sessions
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

$sub = isAuthenticated();
$user_name = $_SESSION['user']['name'] ?? $_SESSION['user_name'] ?? 'معلم معتمد';
$user_contact = $_SESSION['user']['whatsappNumber'] ?? $_SESSION['user']['phone'] ?? $_SESSION['user']['email'] ?? '';

// التحقق من حالة تفعيل التجربة في قاعدة البيانات
$exp_active = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM experiments WHERE code_name = 'blood_typing'"))['is_active'] ?? 1;
if (!$exp_active) {
    header("Location: ../my-experiments.php?msg=experiment_disabled");
    exit();
}

$css_v = file_exists('../css/blood_typing.css') ? filemtime('../css/blood_typing.css') : time();
$js_v  = file_exists('../js/experiments/blood_typing/blood_typing.js') ? filemtime('../js/experiments/blood_typing/blood_typing.js') : time();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مختبر تحديد فصائل الدم (ABO و Rh) | المعمل الافتراضي</title>
    
    <!-- Google Fonts Cairo -->
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- Custom Laboratory Stylesheet -->
    <link rel="stylesheet" href="../css/blood_typing.css?v=<?= $css_v ?>">
</head>
<body>

    <!-- Header Navigation (White Background + Green Title + Red Exit Button) -->
    <header class="lab-top-navbar">
        <div class="brand-section">
            <div class="brand-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                </svg>
            </div>
            <h1 class="brand-title">مختبر تحديد فصائل الدم (ABO و Rh)</h1>
        </div>

        <div class="header-left-actions">
            <!-- Notebook Toggle Button -->
            <button class="notebook-toggle-btn" id="openNotebookBtn" title="فتح دفتر المختبر">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span>دفتر المختبر</span>
            </button>

            <!-- Sample Switcher Pill -->
            <div class="sample-switcher-pill">
                <button class="switcher-btn" id="prevSampleBtn" title="العينة السابقة">&gt;</button>
                <span id="sampleSwitcherLabel">العينة 1 من 8</span>
                <button class="switcher-btn" id="nextSampleBtn" title="العينة التالية">&lt;</button>
            </div>

            <!-- Exit Button -->
            <a href="../my-experiments.php" class="exit-btn-red" title="خروج">
                <span>&rarr;</span>
                <span>خروج</span>
            </a>
        </div>
    </header>

    <!-- Main Workspace Area: Stage on Right, Sidebar on Left (RTL Layout) -->
    <main class="main-lab-layout">
        <!-- Stage Card on the Right -->
        <section class="stage-card" id="stageLabWorkspace"></section>

        <!-- Sidebar Panel (دليل التجربة) on the Left -->
        <aside class="sidebar-panel" id="sidebarGuidePanel">
            <div class="sidebar-title-bar" id="sidebarToggleBtn" role="button" tabindex="0" title="إخفاء / إظهار دليل الخطوات">
                <button class="sidebar-hamburger-btn" id="sidebarHamburgerBtn" type="button" aria-label="تبديل ظهور دليل الخطوات" title="إخفاء / إظهار دليل الخطوات">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                </button>
                <span class="sidebar-title-text">دليل التجربة والخطوات</span>
            </div>

            <!-- Phase Tabs -->
            <div class="sidebar-tabs-row">
                <div class="phase-tab-item active" data-phase="1" id="tabPhase1">
                    <div class="phase-num">1</div>
                    <div>عينة الدم</div>
                </div>
                <div class="phase-tab-item" data-phase="2" id="tabPhase2">
                    <div class="phase-num">2</div>
                    <div>إضافة الكواشف</div>
                </div>
                <div class="phase-tab-item" data-phase="3" id="tabPhase3">
                    <div class="phase-num">3</div>
                    <div>المزج والاستنتاج</div>
                </div>
            </div>

            <!-- Steps List (Scrollable vertically) -->
            <div class="steps-cards-list" id="sidebarStepsList"></div>
        </aside>
    </main>

    <!-- Lab Notebook Modal Overlay (Only appears on recording / click) -->
    <div class="notebook-modal-backdrop" id="notebookModalBackdrop">
        <div class="notebook-modal-window" id="notebookModalWindow">
            <div class="notebook-header-tab" id="notebookHeaderTab">
                <div class="notebook-header-left">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <span>دفتر المختبر - نتائج التحليل واستنتاج فصيلة الدم</span>
                    <span class="drag-handle-hint">(اسحب النافذة بحرية)</span>
                </div>
                <div class="notebook-header-actions">
                    <button class="close-modal-btn" id="closeNotebookBtn" title="إغلاق">&times;</button>
                </div>
            </div>

            <div class="notebook-body-grid">
                <!-- General Notes & Previous Samples History -->
                <div class="notebook-col-notes">
                    <div class="block-title">ملاحظات عامة:</div>
                    <ul class="notes-list">
                        <li>استخدم القفازات لتجنب تلوث العينات.</li>
                        <li>أضف كميات متساوية من الكواشف والدم.</li>
                        <li>امزج بلطف لتسريع ظهور تفاعل التراص.</li>
                        <li>راقب حدوث التكتل الحبيبي (+) للكريات.</li>
                    </ul>

                    <div class="nb-history-section">
                        <div class="nb-history-title-row">
                            <div class="block-title">سجل العينات السابقة:</div>
                            <span class="nb-history-count-badge" id="nbHistoryCount">0 عينات</span>
                        </div>
                        <div class="nb-history-table-wrapper">
                            <table class="nb-history-table">
                                <thead>
                                    <tr>
                                        <th>العينة</th>
                                        <th>Anti-A</th>
                                        <th>Anti-B</th>
                                        <th>Anti-D</th>
                                        <th>الفصيلة</th>
                                    </tr>
                                </thead>
                                <tbody id="nbHistoryTableBody">
                                    <tr class="empty-history-row">
                                        <td colspan="5">لا توجد عينات مكتملة بعد</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Results Table -->
                <div class="notebook-col-table">
                    <!-- Live Reaction Plate Preview -->
                    <div class="nb-live-plate-box">
                        <div class="nb-live-title">
                            <span class="pulsing-live-dot"></span>
                            <span>المعاينة الحية لآبار تفاعل العينة:</span>
                        </div>
                        <div class="nb-live-wells-row">
                            <div class="nb-live-well-card">
                                <span class="badge-reagent blue">Anti-A</span>
                                <div class="nb-well-preview">
                                    <canvas id="canvas_nb_anti_a" width="64" height="64"></canvas>
                                </div>
                            </div>
                            <div class="nb-live-well-card">
                                <span class="badge-reagent yellow">Anti-B</span>
                                <div class="nb-well-preview">
                                    <canvas id="canvas_nb_anti_b" width="64" height="64"></canvas>
                                </div>
                            </div>
                            <div class="nb-live-well-card">
                                <span class="badge-reagent purple">Anti-D</span>
                                <div class="nb-well-preview">
                                    <canvas id="canvas_nb_anti_d" width="64" height="64"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="block-title">جدول نتائج التفاعل:</div>
                    <table class="notebook-results-table">
                        <thead>
                            <tr>
                                <th>الكاشف</th>
                                <th>النتيجة (+/-)</th>
                                <th>الملاحظة</th>
                                <th>الاستنتاج</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span class="badge-reagent blue">Anti-A</span></td>
                                <td>
                                    <select class="nb-select" id="selectResult_anti_a">
                                        <option value="">اختر النتيجة</option>
                                        <option value="+">(+) موجب (تكتل)</option>
                                        <option value="-">(-) سالب (متجانس)</option>
                                    </select>
                                </td>
                                <td><input type="text" class="nb-input" placeholder="تكتل / متجانس"></td>
                                <td><input type="text" class="nb-input" placeholder="مولد ضد A"></td>
                            </tr>
                            <tr>
                                <td><span class="badge-reagent yellow">Anti-B</span></td>
                                <td>
                                    <select class="nb-select" id="selectResult_anti_b">
                                        <option value="">اختر النتيجة</option>
                                        <option value="+">(+) موجب (تكتل)</option>
                                        <option value="-">(-) سالب (متجانس)</option>
                                    </select>
                                </td>
                                <td><input type="text" class="nb-input" placeholder="تكتل / متجانس"></td>
                                <td><input type="text" class="nb-input" placeholder="مولد ضد B"></td>
                            </tr>
                            <tr>
                                <td><span class="badge-reagent purple">Anti-D</span></td>
                                <td>
                                    <select class="nb-select" id="selectResult_anti_d">
                                        <option value="">اختر النتيجة</option>
                                        <option value="+">(+) موجب (تكتل)</option>
                                        <option value="-">(-) سالب (متجانس)</option>
                                    </select>
                                </td>
                                <td><input type="text" class="nb-input" placeholder="تكتل / متجانس"></td>
                                <td><input type="text" class="nb-input" placeholder="عامل Rh"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Conclusion & Blood Type Deduction -->
                <div class="notebook-col-deduction">
                    <div class="block-title">استنتج فصيلة الدم:</div>
                    <div class="deduction-field">
                        <label>فصيلة الدم (ABO):</label>
                        <select class="nb-select" id="selectBloodGroup">
                            <option value="">-- اختر الفصيلة --</option>
                            <option value="A">فصيلة A</option>
                            <option value="B">فصيلة B</option>
                            <option value="AB">فصيلة AB</option>
                            <option value="O">فصيلة O</option>
                        </select>
                    </div>
                    <div class="deduction-field">
                        <label>عامل ريسوس (Rh):</label>
                        <select class="nb-select" id="selectRhFactor">
                            <option value="">-- اختر العامل --</option>
                            <option value="+">(+) موجب</option>
                            <option value="-">(-) سالب</option>
                        </select>
                    </div>
                    <button class="verify-btn" id="verifyDeductionBtn">
                        التحقق من النتيجة
                    </button>
                    <div class="evaluation-feedback" id="evalFeedbackBox"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- App Unified Script -->
    <script src="../js/experiments/blood_typing/blood_typing.js?v=<?= $js_v ?>"></script>

    <!-- Platform Watermark Script -->
    <script src="../js/watermark.js"></script>
    <script>
        if (typeof initWatermark === 'function') {
            initWatermark(<?= json_encode($user_name) ?>, <?= json_encode($user_contact) ?>);
        }
    </script>
</body>
</html>
