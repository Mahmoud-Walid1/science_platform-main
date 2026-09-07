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

// Check if experiment is active in database
$exp_active = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM experiments WHERE code_name = 'photosynthesis' OR id = 9"))['is_active'] ?? 1;
if (!$exp_active) {
    header("Location: ../my-experiments.php?msg=experiment_disabled");
    exit();
}

$css_v = file_exists('../css/photosynthesis.css') ? filemtime('../css/photosynthesis.css') : time();
$js_v  = file_exists('../js/experiments/photosynthesis/app.js') ? filemtime('../js/experiments/photosynthesis/app.js') : time();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>مختبر البناء الضوئي والتنفس الخلوي | مختبر العلوم الافتراضي</title>
    
    <!-- Google Fonts Cairo -->
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <!-- FontAwesome 6 Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Custom stylesheet for Photosynthesis Lab -->
    <link rel="stylesheet" href="../css/photosynthesis.css?v=<?= $css_v ?>">
</head>
<body>

    <!-- Header -->
    <header class="lab-header-photo">
        <a href="../my-experiments.php" class="lab-brand-photo">
            <i class="fas fa-leaf"></i>
            <span>مختبر البناء الضوئي والتنفس الخلوي</span>
        </a>


        <a href="../my-experiments.php" class="exit-btn-photo">
            <i class="fas fa-arrow-right"></i> خروج
        </a>
    </header>

    <!-- Main Container Grid -->
    <div class="lab-container-photo">

        <!-- Stage Panel with SVG Scene -->
        <main class="stage-panel" id="stagePanel">
            <!-- Educational Stepper Banner -->
            <div class="stepper-banner" id="experimentStepper">
                <span id="stepBadge" class="step-badge">الخطوة 1أ</span>
                <span id="stepText">راجع مخطط توزيع الأنابيب من الملصق المعلق على الجدار لمعرفة التركيب التجريبي.</span>
            </div>

            <!-- 12 Hours Incubation Trigger Overlay -->
            <div class="incubation-overlay" id="incubationOverlay">
                <div class="incubation-box">
                    <i class="fas fa-clock fa-spin-slow"></i>
                    <h3>محاكاة فترة الحضانة (12 ساعة)</h3>
                    <p>سيتم تسريع الوقت لرؤية تأثير عمليتي البناء الضوئي والتنفس الخلوي على درجة حموضة كاشف BTB الملون في الضوء والظلام.</p>
                    <button class="incubate-btn" id="btnStartIncubation">البدء وتسريع الوقت ⏱️</button>
                </div>
            </div>

            <!-- Custom 12 Hours Animation Timer (Spins clock) -->
            <div class="clock-spin-screen" id="clockSpinScreen">
                <div class="clock-container">
                    <div class="clock-face">
                        <div class="hand hour-hand" id="hourHand"></div>
                        <div class="hand minute-hand" id="minuteHand"></div>
                    </div>
                    <div class="time-readout" id="timeReadout">00:00</div>
                    <div class="cycle-label" id="cycleLabel">الصباح (إضاءة وبناء ضوئي)</div>
                </div>
            </div>

            <!-- Floating Toast Notification Container -->
            <div class="lab-toast" id="labToast"></div>



            <!-- SVG Lab Stage Container -->
            <div class="lab-canvas-container" id="labSvgContainer"></div>

            <!-- ويدجت مكبس الماصة المعملي (1st Stop / 2nd Stop Lens Widget) المطابق للصورة -->
            <div class="plunger-lens-overlay" id="plungerLensOverlay">
                <div class="plunger-lens-card" id="plungerLensCard">
                    <div class="plunger-arch-header state-rest" id="plungerArchHeader">وضع الراحة</div>
                    <div class="plunger-lens-circle" id="plungerLensCircle">
                        <svg class="plunger-lens-pipette-svg" viewBox="0 0 100 120" fill="none">
                            <path d="M 20 66 C 20 54 33 46 50 46 C 67 46 80 54 80 66 L 80 120 L 20 120 Z" fill="#f8fafc" />
                            <path d="M 28 66 C 28 58 37 52 50 52 C 63 52 72 58 72 66 L 72 120 L 28 120 Z" fill="#38bdf8" />
                            <rect x="36" y="58" width="28" height="62" rx="3" fill="#0284c7" opacity="0.35" />
                            <rect x="42" y="44" width="16" height="6" rx="2" fill="#0284c7" />
                            <path d="M 32 50 C 37 46 44 44 50 44 C 56 44 63 46 68 50" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none" />
                            <rect id="plungerWidgetStem" x="46" y="18" width="8" height="28" rx="1.5" fill="#0284c7" stroke="#0369a1" stroke-width="1" />
                            <g id="plungerWidgetKnob" transform="translate(0, 0)" style="transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);">
                                <rect x="32" y="10" width="36" height="12" rx="3" fill="#38bdf8" stroke="#0284c7" stroke-width="1.8" />
                                <line x1="37" y1="10" x2="37" y2="22" stroke="#0284c7" stroke-width="1.2" />
                                <line x1="42" y1="10" x2="42" y2="22" stroke="#0284c7" stroke-width="1.2" />
                                <line x1="47" y1="10" x2="47" y2="22" stroke="#0284c7" stroke-width="1.2" />
                                <line x1="53" y1="10" x2="53" y2="22" stroke="#0284c7" stroke-width="1.2" />
                                <line x1="58" y1="10" x2="58" y2="22" stroke="#0284c7" stroke-width="1.2" />
                                <line x1="63" y1="10" x2="63" y2="22" stroke="#0284c7" stroke-width="1.2" />
                            </g>
                        </svg>
                    </div>
                    <div class="plunger-tag-bottom">P1000</div>
                </div>
                <div class="plunger-action-tip" id="plungerActionTip">انقر للسحب (1st Stop)</div>
            </div>
        </main>

        <!-- Right Protocol Sidebar Checklist -->
        <aside class="protocol-sidebar" id="protocolSidebar">
            <div class="sidebar-title">
                <i class="fas fa-list-check"></i> دليل التجربة والخطوات
            </div>
            
            <!-- Phase Navigation Tabs -->
            <div class="phase-tabs">
                <div class="phase-tab active" id="tabPhase1" data-phase="1" onclick="window.photosynthesisLab.switchPhase(1)" style="cursor: pointer;">
                    <span class="num">1</span>
                    <span class="txt">الأنابيب والضوء</span>
                </div>
                <div class="phase-tab" id="tabPhase2" data-phase="2" onclick="window.photosynthesisLab.switchPhase(2)" style="cursor: pointer;">
                    <span class="num">2</span>
                    <span class="txt">نقل الكيوفيت</span>
                </div>
                <div class="phase-tab" id="tabPhase3" data-phase="3" onclick="window.photosynthesisLab.switchPhase(3)" style="cursor: pointer;">
                    <span class="num">3</span>
                    <span class="txt">قياس الامتصاص</span>
                </div>
            </div>

            <!-- Checklist Container -->
            <div class="checklist-container">
                <!-- Phase 1 Content -->
                <div class="phase-content active" id="contentPhase1">
                    <div class="step-card active" id="step_1a" data-step="1a">
                        <div class="step-indicator">أ</div>
                        <div class="step-body">
                            <strong>مراجعة المخطط:</strong> انقر هنا لرؤية مخطط إعداد التجربة:
                            <button type="button" class="inline-poster-btn" id="btnTogglePoster" onclick="window.photosynthesisLab.openSetupPosterModal()"><i class="fas fa-image"></i> عرض مخطط التجربة</button>
                        </div>
                    </div>
                    <div class="step-card locked" id="step_1b" data-step="1b">
                        <div class="step-indicator">ب</div>
                        <div class="step-body">
                            <strong>إضافة نباتات الإيلوديا:</strong> اسحب نبات الإيلوديا من الحوض وضعه في الأنبوب 3 والأنبوب 4.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_1c" data-step="1c">
                        <div class="step-indicator">ج</div>
                        <div class="step-body">
                            <strong>سد الأنابيب:</strong> اسحب السدادات المطاطية البرتقالية من الرف وسد الأنابيب الأربعة.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_1d" data-step="1d">
                        <div class="step-indicator">د</div>
                        <div class="step-body">
                            <strong>حجب الضوء:</strong> اسحب الصناديق البنية وغطّ بها الأنبوب 2 والأنبوب 4.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_1e" data-step="1e">
                        <div class="step-indicator">هـ</div>
                        <div class="step-body">
                            <strong>تشغيل الإضاءة:</strong> انقر على مفتاح المصابيح على الجدار لتشغيل الإضاءة.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_1f" data-step="1f">
                        <div class="step-indicator">و</div>
                        <div class="step-body">
                            <strong>الانتظار 12 ساعة (الحضانة):</strong> اترك التجربة تعمل لمدة 12 ساعة.
                        </div>
                    </div>

                    <!-- شريط التنقل السفلي للمرحلة الأولى -->
                    <div class="phase-navigation-footer">
                        <button type="button" class="phase-nav-btn prev-btn" disabled title="لا توجد مرحلة سابقة">
                            <i class="fas fa-chevron-right"></i>
                            <span>السابق</span>
                        </button>
                        <button type="button" class="phase-nav-btn next-btn" onclick="window.photosynthesisLab.switchPhase(2)">
                            <span>التالي</span>
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    </div>
                </div>

                <!-- Phase 2 Content -->
                <div class="phase-content" id="contentPhase2">
                    <div class="step-card active" id="step_2a" data-step="2a">
                        <div class="step-indicator">أ</div>
                        <div class="step-body">
                            <strong>إطفاء مصابيح LED:</strong> بعد مرور 12 ساعة، أطفئ مصابيح LED بالنقر على مفتاح الإضاءة الجداري في المعمل.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_2b" data-step="2b">
                        <div class="step-indicator">ب</div>
                        <div class="step-body">
                            <strong>إزالة الصناديق:</strong> انقر مباشرة على الصناديق البنية فوق الأنابيب أو اسحبها لإعادتها فوراً إلى الرف العلوي.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_2c" data-step="2c">
                        <div class="step-indicator">ج</div>
                        <div class="step-body">
                            <strong>إزالة السدادات:</strong> انقر مباشرة على السدادات المطاطية البرتقالية أو اسحبها لإعادتها إلى الرف وإتاحة سحب العينات.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_2d" data-step="2d">
                        <div class="step-indicator">د</div>
                        <div class="step-body">
                            <strong>تقدير الألوان والـ pH:</strong> تفحّص لون كل أنبوب بعد الحضانة واختر لونه المرصود (أخضر / أصفر / أزرق):
                            <div class="inline-tube-tests" style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.02); border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
                                <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 4px 0; border-bottom: 1px dashed #e2e8f0;">
                                    <span style="font-size: 12.5px; font-weight: 800; color: #1e293b; min-width: 55px;"><i class="fas fa-vial" style="color: #64748b;"></i> أنبوب 1</span>
                                    <div class="color-choice-wrapper" data-tube="1" style="display: flex; gap: 4px;">
                                        <button type="button" class="inline-color-btn" onclick="window.photosynthesisLab.selectNotebookColor(1, 'green', this)" style="padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #16a34a; display: inline-block;"></span> أخضر
                                        </button>
                                        <button type="button" class="inline-color-btn" onclick="window.photosynthesisLab.selectNotebookColor(1, 'yellow', this)" style="padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #ca8a04; display: inline-block;"></span> أصفر
                                        </button>
                                        <button type="button" class="inline-color-btn" onclick="window.photosynthesisLab.selectNotebookColor(1, 'blue', this)" style="padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #2563eb; display: inline-block;"></span> أزرق
                                        </button>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 4px 0; border-bottom: 1px dashed #e2e8f0;">
                                    <span style="font-size: 12.5px; font-weight: 800; color: #1e293b; min-width: 55px;"><i class="fas fa-vial" style="color: #64748b;"></i> أنبوب 2</span>
                                    <div class="color-choice-wrapper" data-tube="2" style="display: flex; gap: 4px;">
                                        <button type="button" class="inline-color-btn" onclick="window.photosynthesisLab.selectNotebookColor(2, 'green', this)" style="padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #16a34a; display: inline-block;"></span> أخضر
                                        </button>
                                        <button type="button" class="inline-color-btn" onclick="window.photosynthesisLab.selectNotebookColor(2, 'yellow', this)" style="padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #ca8a04; display: inline-block;"></span> أصفر
                                        </button>
                                        <button type="button" class="inline-color-btn" onclick="window.photosynthesisLab.selectNotebookColor(2, 'blue', this)" style="padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #2563eb; display: inline-block;"></span> أزرق
                                        </button>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 4px 0; border-bottom: 1px dashed #e2e8f0;">
                                    <span style="font-size: 12.5px; font-weight: 800; color: #1e293b; min-width: 55px;"><i class="fas fa-vial" style="color: #64748b;"></i> أنبوب 3</span>
                                    <div class="color-choice-wrapper" data-tube="3" style="display: flex; gap: 4px;">
                                        <button type="button" class="inline-color-btn" onclick="window.photosynthesisLab.selectNotebookColor(3, 'green', this)" style="padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #16a34a; display: inline-block;"></span> أخضر
                                        </button>
                                        <button type="button" class="inline-color-btn" onclick="window.photosynthesisLab.selectNotebookColor(3, 'yellow', this)" style="padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #ca8a04; display: inline-block;"></span> أصفر
                                        </button>
                                        <button type="button" class="inline-color-btn" onclick="window.photosynthesisLab.selectNotebookColor(3, 'blue', this)" style="padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #2563eb; display: inline-block;"></span> أزرق
                                        </button>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 4px 0;">
                                    <span style="font-size: 12.5px; font-weight: 800; color: #1e293b; min-width: 55px;"><i class="fas fa-vial" style="color: #64748b;"></i> أنبوب 4</span>
                                    <div class="color-choice-wrapper" data-tube="4" style="display: flex; gap: 4px;">
                                        <button type="button" class="inline-color-btn" onclick="window.photosynthesisLab.selectNotebookColor(4, 'green', this)" style="padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #16a34a; display: inline-block;"></span> أخضر
                                        </button>
                                        <button type="button" class="inline-color-btn" onclick="window.photosynthesisLab.selectNotebookColor(4, 'yellow', this)" style="padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #ca8a04; display: inline-block;"></span> أصفر
                                        </button>
                                        <button type="button" class="inline-color-btn" onclick="window.photosynthesisLab.selectNotebookColor(4, 'blue', this)" style="padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 3px;">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #2563eb; display: inline-block;"></span> أزرق
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="step-card locked" id="step_2e" data-step="2e">
                        <div class="step-indicator">هـ</div>
                        <div class="step-body">
                            <strong>ضبط حجم الماصة على 1,000 µl:</strong> انقر على فقاعة الحجم (200µl) المجاورة للماصة على الحامل، واضبط الحجم بدقة على 1,000 µl ثم اضغط "حفظ الحجم".
                        </div>
                    </div>
                    <div class="step-card locked" id="step_2g" data-step="2g">
                        <div class="step-indicator">و</div>
                        <div class="step-body">
                            <strong>تركيب الرأس (Tip):</strong> انقر على علبة الرؤوس لفتحها، ثم اسحب الماصة ومررها فوقها لتركيب رأس جديد.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_2h" data-step="2h">
                        <div class="step-indicator">ز</div>
                        <div class="step-body">
                            <strong>وضع طرف الماصة فوق الأنبوب 1:</strong> اسحب ماصة P1000 وضع طرفها داخل فوهة الأنبوب 1 لبدء سحب العينة.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_2i" data-step="2i">
                        <div class="step-indicator">ح</div>
                        <div class="step-body">
                            <strong>سحب 1,000 µl من الأنبوب 1:</strong> اضغط ضغطة واحدة على مكبس الماصة (1st Stop) لسحب 1000 µl من المحلول، وسيتلوّن السن بلون كاشف الأنبوب.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_2j" data-step="2j">
                        <div class="step-indicator">ط</div>
                        <div class="step-body">
                            <strong>الصب في الكيوفيت 1:</strong> اسحب الماصة فوق الكيوفيت 1، واضغط مطولاً على المكبس حتى الوقفة الثانية (2nd Stop) لتفريغ المحلول وامتلائها.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_2k" data-step="2k">
                        <div class="step-indicator">ي</div>
                        <div class="step-body">
                            <strong>قذف الرأس (Eject Tip):</strong> اسحب الماصة ومررها فوق سلة المهملات للتخلص من الرأس المستعمل.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_2l" data-step="2l">
                        <div class="step-indicator">ك</div>
                        <div class="step-body">
                            <strong>إغلاق الكيوفيت بالغطاء:</strong> اسحب الغطاء الأحمر من الرف وضعه فوق الكيوفيت 1 لمنع تغير لون المحلول بتأثير الهواء.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_2m" data-step="2m">
                        <div class="step-indicator">ل</div>
                        <div class="step-body">
                            <strong>تكرار النقل للأنابيب المتبقية:</strong> كرر العملية التفاعلية مع الأنابيب الثلاثة المتبقية لنقل 1 مل وتغطية الكيوفيتات:
                            <div class="cuvettes-progress-badge" id="cuvettesTransferProgress" style="margin-top: 6px;">
                                <i class="fas fa-vial"></i> الكيوفيتات المكتملة: <span id="cuvettesCountText">1 من 4</span>
                            </div>
                        </div>
                    </div>
                    <div class="step-card locked" id="step_2n" data-step="2n">
                        <div class="step-indicator">م</div>
                        <div class="step-body">
                            <strong>إغلاق علبة رؤوس ماصة P1000:</strong> انقر على علبة رؤوس ماصة P1000 لإغلاق غطائها وحمايتها من التلوث.
                        </div>
                    </div>

                    <!-- شريط التنقل السفلي للمرحلة الثانية -->
                    <div class="phase-navigation-footer">
                        <button type="button" class="phase-nav-btn prev-btn" onclick="window.photosynthesisLab.switchPhase(1)">
                            <i class="fas fa-chevron-right"></i>
                            <span>السابق</span>
                        </button>
                        <button type="button" class="phase-nav-btn next-btn" onclick="window.photosynthesisLab.switchPhase(3)">
                            <span>التالي</span>
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    </div>
                </div>

                <!-- Phase 3 Content -->
                <div class="phase-content" id="contentPhase3">
                    <div class="step-card" id="step_3a" data-step="3a">
                        <div class="step-indicator">أ</div>
                        <div class="step-body">
                            <strong>تشغيل مقياس الطيف الضوئي:</strong> انقر على زر التشغيل (Power) لتشغيل الجهاز، وانتظر حتى يسخن المصباح الداخلي لمدة 15 دقيقة.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3b" data-step="3b">
                        <div class="step-indicator">ب</div>
                        <div class="step-body">
                            <strong>التعرف على مقياس الطيف الضوئي:</strong> تعرّف على آلية عمل مقياس الطيف الضوئي وأجزائه أثناء فترة الإحماء.
                            <button type="button" class="inline-poster-btn" id="btnOpenSpecInfo" onclick="window.photosynthesisLab.openSpecInfoModal()" style="margin-top: 6px; display: block;"><i class="fas fa-info-circle"></i> قراءة معلومات مقياس الطيف (Spectrophotometer Info)</button>
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3c" data-step="3c">
                        <div class="step-indicator">ج</div>
                        <div class="step-body">
                            <strong>ضبط الطول الموجي على 615 nm:</strong> انقر على زر الترس (⚙️) واضبط الطول الموجي للمطياف على 615 نانومتر.
                            <button type="button" class="inline-poster-btn" id="btnOpenSpecSettings" onclick="window.photosynthesisLab.openSpecSettingsModal()" style="margin-top: 6px; display: block;"><i class="fas fa-cog"></i> ضبط الطول الموجي (Wavelength Settings)</button>
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3d" data-step="3d">
                        <div class="step-indicator">د</div>
                        <div class="step-body">
                            <strong>فتح غطاء الحجرة:</strong> انقر على الغطاء الأزرق لفتح حجرة العينات بمقياس الطيف الضوئي.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3e" data-step="3e">
                        <div class="step-indicator">هـ</div>
                        <div class="step-body">
                            <strong>توجيه الكيوفيت الضابطة:</strong> تعرّف على كيفية مسك وتوجيه الكيوفيت الضابطة (الماء) من الجوانب المعتمة دون لمس الأسطح الشفافة.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3f" data-step="3f">
                        <div class="step-indicator">و</div>
                        <div class="step-body">
                            <strong>وضع الكيوفيت الضابطة:</strong> اسحب الكيوفيت الضابطة الممتلئة بالماء الصافي وضعها داخل حجرة مقياس الطيف.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3g" data-step="3g">
                        <div class="step-indicator">ز</div>
                        <div class="step-body">
                            <strong>إغلاق غطاء الحجرة:</strong> انقر على الغطاء الأزرق لإغلاق حجرة مقياس الطيف الضوئي.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3h" data-step="3h">
                        <div class="step-indicator">ح</div>
                        <div class="step-body">
                            <strong>تصفير مقياس الطيف (0.000 Abs):</strong> لإنشاء نقطة مرجعية لكافة المحاليل الأخرى، اضبط الامتصاصية على 0.000. أولاً، اضغط على زر الترس (⚙️) ثم انقر على زر التصفير (Zero button). أغلق نافذة مقياس الطيف.
                            <button type="button" class="inline-poster-btn" id="btnZeroStep" onclick="window.photosynthesisLab.openSpecSettingsModal()" style="margin-top: 6px; display: block;"><i class="fas fa-bullseye"></i> فتح نافذة الضبط والتصفير (Zero Calibration)</button>
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3i" data-step="3i">
                        <div class="step-indicator">ط</div>
                        <div class="step-body">
                            <strong>فتح غطاء الحجرة:</strong> انقر على الغطاء الأزرق لفتح حجرة مقياس الطيف مجدداً.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3j" data-step="3j">
                        <div class="step-indicator">ي</div>
                        <div class="step-body">
                            <strong>إخراج الكيوفيت الضابطة ووضع الكيوفيت 1:</strong> أخرج الكيوفيت الضابطة وضع بدلاً منها الكيوفيت 1.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3k" data-step="3k">
                        <div class="step-indicator">ك</div>
                        <div class="step-body">
                            <strong>إغلاق غطاء مقياس الطيف:</strong> أغلق الغطاء الأزرق لقراءة قيمة الامتصاصية للكيوفيت 1.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3l" data-step="3l">
                        <div class="step-indicator">ل</div>
                        <div class="step-body">
                            <strong>تسجيل امتصاصية الكيوفيت 1:</strong> سجّل قيمة الامتصاصية المقاسة للكيوفيت 1 في جدول النتائج.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3m" data-step="3m">
                        <div class="step-indicator">م</div>
                        <div class="step-body">
                            <strong>فتح غطاء الحجرة:</strong> انقر على الغطاء الأزرق لفتح الحجرة مجدداً.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3n" data-step="3n">
                        <div class="step-indicator">ن</div>
                        <div class="step-body">
                            <strong>إخراج الكيوفيت 1 ووضع الكيوفيت 2:</strong> أخرج الكيوفيت 1 وضع بدلاً منها الكيوفيت 2 داخل الحجرة.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3o" data-step="3o">
                        <div class="step-indicator">س</div>
                        <div class="step-body">
                            <strong>إغلاق الغطاء وقراءة امتصاصية الكيوفيت 2:</strong> أغلق الغطاء الأزرق واقرأ قيمة الامتصاصية للكيوفيت 2.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3p" data-step="3p">
                        <div class="step-indicator">ع</div>
                        <div class="step-body">
                            <strong>تسجيل امتصاصية الكيوفيت 2:</strong> سجّل قيمة الامتصاصية المقاسة للكيوفيت 2 في الجدول.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3q" data-step="3q">
                        <div class="step-indicator">ف</div>
                        <div class="step-body">
                            <strong>تكرار القياس للكيوفيتات المتبقية (3 و 4):</strong> كرّر خطوات القياس للكيوفيتين 3 و 4 وسجّل كافة القيم في جدول النتائج.
                        </div>
                    </div>
                    <div class="step-card locked" id="step_3r" data-step="3r">
                        <div class="step-indicator">ص</div>
                        <div class="step-body">
                            <strong>إخراج آخر كيوفيت من الجهاز:</strong> أخرج الكيوفيت الأخيرة من مقياس الطيف لإتمام القياسات بنجاح.
                        </div>
                    </div>

                    <!-- شريط التنقل السفلي للمرحلة الثالثة: السابق والنتائج -->
                    <div class="phase-navigation-footer">
                        <button type="button" class="phase-nav-btn prev-btn" onclick="window.photosynthesisLab.switchPhase(2)">
                            <i class="fas fa-chevron-right"></i>
                            <span>السابق</span>
                        </button>
                        <button type="button" class="phase-nav-btn results-btn" id="btnGoToResults" onclick="window.photosynthesisLab.openResultsSection()">
                            <i class="fas fa-chart-line"></i>
                            <span>النتائج</span>
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    </div>
                </div>
            </div>
        </aside>

    </div>

    <!-- 2. Overlay Spectrophotometer Controller Panel Modal -->
    <div class="spec-modal" id="specModal">
        <div class="spec-card">
            <div class="spec-header">
                <h3>لوحة تحكم جهاز مطياف الضوء (Spectrophotometer)</h3>
                <button class="close-spec-btn" id="btnCloseSpec"><i class="fas fa-times"></i></button>
            </div>
            <div class="spec-body-content">
                <div class="spec-screen-panel">
                    <div class="spec-screen" id="modalSpecScreen">615 nm | 0.000 Abs</div>
                </div>
                
                <!-- جدول تدوين القياسات -->
                <div class="student-notebook">
                    <h4 style="margin-bottom: 10px; color: #1e293b;">جدول تدوين القياسات والامتصاصية (عند 615 نانومتر):</h4>
                    <table class="notebook-table">
                        <thead>
                            <tr>
                                <th>الكيوفيت</th>
                                <th>اللون المتوقع</th>
                                <th>الـ pH المقدر</th>
                                <th>الامتصاصية المقاسة (Abs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>كيوفيت 1 (ضابطة في الضوء)</td>
                                <td style="color:#059669; font-weight:800;">أخضر</td>
                                <td>7.0</td>
                                <td><span class="res-abs" id="abs_res_1">--</span></td>
                            </tr>
                            <tr>
                                <td>كيوفيت 2 (إيلوديا في الضوء)</td>
                                <td style="color:#1d4ed8; font-weight:800;">أزرق</td>
                                <td>7.8</td>
                                <td><span class="res-abs" id="abs_res_2">--</span></td>
                            </tr>
                            <tr>
                                <td>كيوفيت 3 (إيلوديا في الظلام)</td>
                                <td style="color:#ca8a04; font-weight:800;">أصفر</td>
                                <td>6.2</td>
                                <td><span class="res-abs" id="abs_res_3">--</span></td>
                            </tr>
                            <tr>
                                <td>كيوفيت 4 (ضابطة في الظلام)</td>
                                <td style="color:#059669; font-weight:800;">أخضر</td>
                                <td>7.0</td>
                                <td><span class="res-abs" id="abs_res_4">--</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- 3. Micropipette P1000 Volume Adjustment Modal -->
    <div class="pipette-volume-modal" id="pipetteVolumeModal">
        <div class="pipette-volume-card">
            <div class="pipette-volume-header">
                <div class="header-title-group">
                    <i class="fas fa-sliders-h" style="color: #0284c7; font-size: 1.2rem;"></i>
                    <div>
                        <h3>إعداد وضبط حجم الماصة الدقيقة (P1000 Micropipette)</h3>
                        <p class="subtitle">الحجم الحالي مضبوط على 200 µL — اكتب أو اضبط الحجم على 1000 ميكرولتر (1.0 mL)</p>
                    </div>
                </div>
                <button class="close-pipette-btn" id="btnClosePipetteModal" onclick="window.photosynthesisLab.closePipetteVolumeModal()"><i class="fas fa-times"></i></button>
            </div>
            
            <div class="pipette-volume-body">
                <!-- Visual Pipette Dial & Body Section -->
                <div class="pipette-visual-stage">
                    <div class="pipette-plunger-visual">
                        <div class="plunger-cap">
                            <span class="plunger-label">P1000</span>
                            <div class="plunger-stops-badge">
                                <span class="badge-1st"><i class="fas fa-arrow-down"></i> 1st Stop (سحب)</span>
                                <span class="badge-2nd"><i class="fas fa-angles-down"></i> 2nd Stop (تفريغ)</span>
                            </div>
                        </div>
                        <div class="plunger-shaft"></div>
                    </div>

                    <!-- Digital/Mechanical Volumeter Display Window -->
                    <div class="volumeter-window">
                        <div class="volumeter-frame" id="volumeterDialFrame">
                            <div class="digit-column" id="digitThousand">0</div>
                            <div class="digit-column" id="digitHundred">2</div>
                            <div class="digit-column" id="digitTen">0</div>
                            <div class="digit-column unit-col" id="digitUnit">0</div>
                        </div>
                        <div class="volumeter-unit-label" id="volumeterUnitLabel">200 ميكرولتر (µL) = 0.20 mL</div>
                    </div>
                </div>

                <!-- Direct Typing & Adjustment Controls Section -->
                <div class="pipette-controls-section">
                    <div class="volume-status-banner">
                        <span class="status-icon"><i class="fas fa-bullseye" style="color: #0284c7;"></i></span>
                        <div class="status-info">
                            <strong>الحجم المستهدف المطلوب للتجربة:</strong>
                            <span>1000 ميكرولتر (1000 µL) لكل أنبوب وكيوفيت</span>
                        </div>
                    </div>

                    <!-- Direct Typing Input Box -->
                    <div class="direct-input-box">
                        <label for="pipetteDirectVolumeInput" class="input-label">
                            <i class="fas fa-keyboard"></i> انقر هنا واكتب 1000 مباشرة من لوحة المفاتيح:
                        </label>
                        <div class="input-group-styled">
                            <input type="number" id="pipetteDirectVolumeInput" class="direct-vol-input" min="100" max="1000" step="10" value="200" placeholder="اكتب 1000" oninput="window.photosynthesisLab.handleDirectVolumeInput(this.value)" onkeydown="if(event.key==='Enter') window.photosynthesisLab.confirmPipetteVolumeSetting()">
                            <span class="input-addon">µL</span>
                        </div>
                    </div>

                    <!-- Quick Preset & Adjustment Buttons -->
                    <div class="adjust-buttons-grid">
                        <button type="button" class="volume-adj-btn set-1000-btn" onclick="window.photosynthesisLab.setExactVolume(1000)">🎯 ضبط سريع على 1000 µL</button>
                        <button type="button" class="volume-adj-btn" onclick="window.photosynthesisLab.adjustPipetteVolume(100)">+100 µL</button>
                        <button type="button" class="volume-adj-btn" onclick="window.photosynthesisLab.adjustPipetteVolume(10)">+10 µL</button>
                        <button type="button" class="volume-adj-btn" onclick="window.photosynthesisLab.adjustPipetteVolume(-10)">-10 µL</button>
                        <button type="button" class="volume-adj-btn" onclick="window.photosynthesisLab.adjustPipetteVolume(-100)">-100 µL</button>
                    </div>

                    <!-- Confirm Button -->
                    <div class="action-footer">
                        <button type="button" class="btn-reset-volume" id="btnConfirmVolume" onclick="window.photosynthesisLab.confirmPipetteVolumeSetting()">
                            <i class="fas fa-check-circle"></i> تأكيد ضبط الحجم على 1000 µL والعودة للتجربة
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Floating Plunger Stop Interactive HUD -->
    <div class="plunger-hud" id="plungerHud" style="display: none;">
        <div class="plunger-hud-content">
            <div class="plunger-hud-icon" id="plungerHudIcon"><i class="fas fa-arrow-down"></i></div>
            <div class="plunger-hud-text">
                <strong id="plungerHudTitle">نقطة التوقف الأولى (1st Stop)</strong>
                <p id="plungerHudDesc">تم الضغط على المكبس لسحب 1000 µL من المحلول</p>
            </div>
        </div>
    </div>

    <!-- 3.5. Overlay Experimental Setup Poster Modal (مخطط التجربة المطابق للصورة 100%) -->
    <div class="poster-modal" id="setupPosterModal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 15, 25, 0.75); backdrop-filter: blur(5px); z-index: 99999; justify-content: center; align-items: center;">
        <div class="poster-card-clean" style="position: relative; background: #ffffff; border-radius: 14px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45); padding: 30px 40px; max-width: 950px; width: 92%; max-height: 92vh; display: flex; flex-direction: column; align-items: center; border: 1px solid #cbd5e1;">
            <!-- زر الإغلاق الدائري الأنيق أعلى اليمين مطابق للصورة -->
            <button type="button" class="clean-modal-close-btn" id="btnClosePoster" onclick="window.photosynthesisLab.closeSetupPosterModal()" style="position: absolute; top: 16px; right: 16px; width: 34px; height: 34px; border-radius: 50%; background: #e2e8f0; border: none; font-size: 16px; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; z-index: 10;" title="إغلاق">
                <i class="fas fa-times"></i>
            </button>

            <!-- رسم SVG المتجهي فائق الدقة المطابق 100% لصورة المستخدم للأنابيب الأربعة -->
            <svg viewBox="0 0 850 480" style="width: 100%; height: auto; max-height: 75vh; display: block;">
                <!-- 1. الأنبوب 1: بدون نبات، بدون صندوق، مع سدادة مطاطية -->
                <g id="poster_station_1" transform="translate(100, 0)">
                    <!-- سدادة الفلين البرتقالية -->
                    <polygon points="32,125 68,125 64,95 36,95" fill="#d97706" stroke="#b45309" stroke-width="1.5" />
                    <ellipse cx="50" cy="95" rx="14" ry="4.5" fill="#f59e0b" />
                    <!-- شفة فوهة الأنبوب -->
                    <ellipse cx="50" cy="120" rx="26" ry="6" fill="none" stroke="#94a3b8" stroke-width="3" />
                    <!-- كاشف المحلول الزيتي الأخضر -->
                    <path d="M 28 145 L 72 145 L 72 380 C 72 418 28 418 28 380 Z" fill="#4d7c0f" />
                    <ellipse cx="50" cy="145" rx="22" ry="5" fill="#3f6212" />
                    <!-- زجاج الأنبوب الشفاف واللمعان -->
                    <path d="M 26 120 L 26 380 C 26 422 74 422 74 380 L 74 120" fill="none" stroke="#94a3b8" stroke-width="3" />
                    <rect x="30" y="125" width="8" height="250" rx="4" fill="rgba(255,255,255,0.3)" />
                    <!-- بطاقة رقم الأنبوب 1 -->
                    <rect x="23" y="235" width="54" height="66" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
                    <text x="50" y="284" fill="#000000" font-size="44" font-family="'Cairo', sans-serif" font-weight="900" text-anchor="middle">1</text>
                </g>

                <!-- 2. الأنبوب 2: بدون نبات، داخل صندوق، مع سدادة مطاطية -->
                <g id="poster_station_2" transform="translate(290, 0)">
                    <!-- الصندوق الكرتوني المفتوح المحيط بالأنبوب -->
                    <rect x="-10" y="70" width="120" height="370" fill="#78350f" />
                    <polygon points="-10,70 110,70 95,40 5,40" fill="#a16207" />
                    <polygon points="-10,70 -10,440 5,440 5,70" fill="#b45309" />
                    <polygon points="95,70 95,440 110,440 110,70" fill="#9a3412" />
                    <polygon points="-10,440 110,440 95,455 5,455" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1" />

                    <!-- سدادة الفلين البرتقالية -->
                    <polygon points="32,125 68,125 64,95 36,95" fill="#d97706" stroke="#b45309" stroke-width="1.5" />
                    <ellipse cx="50" cy="95" rx="14" ry="4.5" fill="#f59e0b" />
                    <!-- شفة فوهة الأنبوب -->
                    <ellipse cx="50" cy="120" rx="26" ry="6" fill="none" stroke="#94a3b8" stroke-width="3" />
                    <!-- كاشف المحلول الزيتي الأخضر -->
                    <path d="M 28 145 L 72 145 L 72 380 C 72 418 28 418 28 380 Z" fill="#4d7c0f" />
                    <ellipse cx="50" cy="145" rx="22" ry="5" fill="#3f6212" />
                    <!-- زجاج الأنبوب الشفاف واللمعان -->
                    <path d="M 26 120 L 26 380 C 26 422 74 422 74 380 L 74 120" fill="none" stroke="#94a3b8" stroke-width="3" />
                    <rect x="30" y="125" width="8" height="250" rx="4" fill="rgba(255,255,255,0.3)" />
                    <!-- بطاقة رقم الأنبوب 2 -->
                    <rect x="23" y="235" width="54" height="66" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
                    <text x="50" y="284" fill="#000000" font-size="44" font-family="'Cairo', sans-serif" font-weight="900" text-anchor="middle">2</text>
                </g>

                <!-- 3. الأنبوب 3: مع نبات إيلوديا، بدون صندوق، مع سدادة مطاطية -->
                <g id="poster_station_3" transform="translate(480, 0)">
                    <!-- سدادة الفلين البرتقالية -->
                    <polygon points="32,125 68,125 64,95 36,95" fill="#d97706" stroke="#b45309" stroke-width="1.5" />
                    <ellipse cx="50" cy="95" rx="14" ry="4.5" fill="#f59e0b" />
                    <!-- شفة فوهة الأنبوب -->
                    <ellipse cx="50" cy="120" rx="26" ry="6" fill="none" stroke="#94a3b8" stroke-width="3" />
                    <!-- كاشف المحلول الزيتي الأخضر -->
                    <path d="M 28 145 L 72 145 L 72 380 C 72 418 28 418 28 380 Z" fill="#4d7c0f" />
                    <ellipse cx="50" cy="145" rx="22" ry="5" fill="#3f6212" />

                    <!-- نبات الإيلوديا داخل المحلول -->
                    <path d="M 50 155 Q 51 280 50 400" stroke="#15803d" stroke-width="4" fill="none" />
                    <path d="M 50 175 C 30 167 28 189 50 180" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 175 C 70 167 72 189 50 180" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 205 C 30 197 28 219 50 210" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 205 C 70 197 72 219 50 210" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 310 C 30 302 28 324 50 315" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 310 C 70 302 72 324 50 315" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 340 C 30 332 28 354 50 345" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 340 C 70 332 72 354 50 345" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 370 C 30 362 28 384 50 375" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 370 C 70 362 72 384 50 375" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 395 C 32 388 30 405 50 400" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 395 C 68 388 70 405 50 400" fill="#22c55e" stroke="#166534" stroke-width="1" />

                    <!-- زجاج الأنبوب الشفاف واللمعان -->
                    <path d="M 26 120 L 26 380 C 26 422 74 422 74 380 L 74 120" fill="none" stroke="#94a3b8" stroke-width="3" />
                    <rect x="30" y="125" width="8" height="250" rx="4" fill="rgba(255,255,255,0.3)" />
                    <!-- بطاقة رقم الأنبوب 3 -->
                    <rect x="23" y="235" width="54" height="66" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
                    <text x="50" y="284" fill="#000000" font-size="44" font-family="'Cairo', sans-serif" font-weight="900" text-anchor="middle">3</text>
                </g>

                <!-- 4. الأنبوب 4: مع نبات إيلوديا، داخل صندوق، مع سدادة مطاطية -->
                <g id="poster_station_4" transform="translate(670, 0)">
                    <!-- الصندوق الكرتوني المفتوح المحيط بالأنبوب -->
                    <rect x="-10" y="70" width="120" height="370" fill="#78350f" />
                    <polygon points="-10,70 110,70 95,40 5,40" fill="#a16207" />
                    <polygon points="-10,70 -10,440 5,440 5,70" fill="#b45309" />
                    <polygon points="95,70 95,440 110,440 110,70" fill="#9a3412" />
                    <polygon points="-10,440 110,440 95,455 5,455" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1" />

                    <!-- سدادة الفلين البرتقالية -->
                    <polygon points="32,125 68,125 64,95 36,95" fill="#d97706" stroke="#b45309" stroke-width="1.5" />
                    <ellipse cx="50" cy="95" rx="14" ry="4.5" fill="#f59e0b" />
                    <!-- شفة فوهة الأنبوب -->
                    <ellipse cx="50" cy="120" rx="26" ry="6" fill="none" stroke="#94a3b8" stroke-width="3" />
                    <!-- كاشف المحلول الزيتي الأخضر -->
                    <path d="M 28 145 L 72 145 L 72 380 C 72 418 28 418 28 380 Z" fill="#4d7c0f" />
                    <ellipse cx="50" cy="145" rx="22" ry="5" fill="#3f6212" />

                    <!-- نبات الإيلوديا داخل المحلول -->
                    <path d="M 50 155 Q 51 280 50 400" stroke="#15803d" stroke-width="4" fill="none" />
                    <path d="M 50 175 C 30 167 28 189 50 180" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 175 C 70 167 72 189 50 180" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 205 C 30 197 28 219 50 210" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 205 C 70 197 72 219 50 210" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 310 C 30 302 28 324 50 315" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 310 C 70 302 72 324 50 315" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 340 C 30 332 28 354 50 345" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 340 C 70 332 72 354 50 345" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 370 C 30 362 28 384 50 375" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 370 C 70 362 72 384 50 375" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 395 C 32 388 30 405 50 400" fill="#22c55e" stroke="#166534" stroke-width="1" />
                    <path d="M 50 395 C 68 388 70 405 50 400" fill="#22c55e" stroke="#166534" stroke-width="1" />

                    <!-- زجاج الأنبوب الشفاف واللمعان -->
                    <path d="M 26 120 L 26 380 C 26 422 74 422 74 380 L 74 120" fill="none" stroke="#94a3b8" stroke-width="3" />
                    <rect x="30" y="125" width="8" height="250" rx="4" fill="rgba(255,255,255,0.3)" />
                    <!-- بطاقة رقم الأنبوب 4 -->
                    <rect x="23" y="235" width="54" height="66" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
                    <text x="50" y="284" fill="#000000" font-size="44" font-family="'Cairo', sans-serif" font-weight="900" text-anchor="middle">4</text>
                </g>
            </svg>
        </div>
    </div>

    <!-- نافذة محاكاة الحضانة 12 ساعة (WAIT 12 HOURS) - ساعة تناظرية دوارة فائقة الدقة -->
    <div class="photo-modal-overlay" id="wait12HoursModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 99999; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
        <div class="photo-modal-content wait-hours-card" style="max-width: 500px; width: 92%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);">
            <!-- رأس النافذة -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                <h2 style="margin: 0; font-size: 19px; font-weight: 900; color: #0f172a; font-family: 'Cairo', sans-serif;">الانتظار 12 ساعة | WAIT 12 HOURS</h2>
                <button id="btnCloseWaitModal" type="button" onclick="window.photosynthesisLab.closeWait12HoursModal()" style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #64748b;">✕</button>
            </div>

            <!-- مسرح الساعة التناظرية الدوارة الفاخرة -->
            <div style="background: linear-gradient(180deg, #07131f 0%, #0d1e30 100%); padding: 26px 20px; text-align: center; position: relative;">
                
                <div style="width: 260px; height: 260px; margin: 0 auto; position: relative; filter: drop-shadow(0 14px 32px rgba(0,0,0,0.65)); cursor: pointer;" onclick="window.photosynthesisLab.openWait12HoursModal()" title="انقر لإعادة تشغيل دوران الساعة">
                    <svg viewBox="0 0 300 300" style="width: 100%; height: 100%; display: block;">
                        <defs>
                            <linearGradient id="clockBezelGradPhp" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#38bdf8" />
                                <stop offset="50%" stop-color="#1e293b" />
                                <stop offset="100%" stop-color="#0284c7" />
                            </linearGradient>
                            <radialGradient id="clockFaceGradPhp" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#1e293b" />
                                <stop offset="85%" stop-color="#091422" />
                                <stop offset="100%" stop-color="#040a12" />
                            </radialGradient>
                            <filter id="clockGlowPhp" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2.5" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        <!-- الإطار الخارجي المعدني اللامع -->
                        <circle cx="150" cy="150" r="144" fill="none" stroke="url(#clockBezelGradPhp)" stroke-width="8" />
                        <circle cx="150" cy="150" r="138" fill="url(#clockFaceGradPhp)" stroke="#0f172a" stroke-width="2" />
                        
                        <!-- المسار الدائري المنقط لانقضاء الساعات -->
                        <circle cx="150" cy="150" r="96" fill="none" stroke="#1e293b" stroke-width="4" stroke-dasharray="2 4" />

                        <!-- قطاع انقضاء الوقت الدائري المتسع ديناميكياً مع دوران العقارب -->
                        <path id="clockTimeSector" d="M 150 150 L 150 54 A 96 96 0 0 1 150 54 Z" fill="rgba(56, 189, 248, 0.22)" stroke="#38bdf8" stroke-width="2" />

                        <!-- شرطات الساعات الرئيسية (12 شرطة) -->
                        <g stroke="#64748b" stroke-width="2" stroke-linecap="round">
                            <line x1="150" y1="18" x2="150" y2="30" stroke="#38bdf8" stroke-width="4" />
                            <line x1="216" y1="36" x2="210" y2="46" />
                            <line x1="264" y1="84" x2="254" y2="90" />
                            <line x1="282" y1="150" x2="270" y2="150" stroke="#38bdf8" stroke-width="4" />
                            <line x1="264" y1="216" x2="254" y2="210" />
                            <line x1="216" y1="264" x2="210" y2="254" />
                            <line x1="150" y1="282" x2="150" y2="270" stroke="#38bdf8" stroke-width="4" />
                            <line x1="84" y1="264" x2="90" y2="254" />
                            <line x1="36" y1="216" x2="46" y2="210" />
                            <line x1="18" y1="150" x2="30" y2="150" stroke="#38bdf8" stroke-width="4" />
                            <line x1="36" y1="84" x2="46" y2="90" />
                            <line x1="84" y1="36" x2="90" y2="46" />
                        </g>

                        <!-- أرقام الساعة من 1 إلى 12 بخط عريض متناسق -->
                        <g font-family="'Cairo', sans-serif" font-weight="900" font-size="15" fill="#f8fafc" text-anchor="middle" dominant-baseline="central">
                            <text x="150" y="44">12</text>
                            <text x="202" y="60">1</text>
                            <text x="240" y="98">2</text>
                            <text x="254" y="150">3</text>
                            <text x="240" y="202">4</text>
                            <text x="202" y="240">5</text>
                            <text x="150" y="254">6</text>
                            <text x="98" y="240">7</text>
                            <text x="60" y="202">8</text>
                            <text x="46" y="150">9</text>
                            <text x="60" y="98">10</text>
                            <text x="98" y="60">11</text>
                        </g>

                        <!-- عقرب الساعات (Hour Hand) -->
                        <g id="clockHourHand" transform="rotate(0, 150, 150)">
                            <path d="M 146 158 L 147 84 L 150 72 L 153 84 L 154 158 Z" fill="#38bdf8" filter="url(#clockGlowPhp)" />
                            <line x1="150" y1="150" x2="150" y2="76" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
                        </g>

                        <!-- عقرب الدقائق (Minute Hand) -->
                        <g id="clockMinuteHand" transform="rotate(0, 150, 150)">
                            <path d="M 147 162 L 148 56 L 150 42 L 152 56 L 153 162 Z" fill="#ffffff" />
                            <line x1="150" y1="150" x2="150" y2="48" stroke="#0284c7" stroke-width="1.5" stroke-linecap="round" />
                        </g>

                        <!-- عقرب الثواني السريع (Second Hand) -->
                        <g id="clockSecondHand" transform="rotate(0, 150, 150)">
                            <line x1="150" y1="166" x2="150" y2="34" stroke="#f43f5e" stroke-width="1.5" stroke-linecap="round" />
                            <circle cx="150" cy="34" r="3" fill="#f43f5e" />
                        </g>

                        <!-- مسمار التثبيت المركزي الأنيق -->
                        <circle cx="150" cy="150" r="7" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5" />
                        <circle cx="150" cy="150" r="3" fill="#f43f5e" />
                    </svg>
                </div>
            </div>

            <!-- تذييل النافذة وزر إنهاء الخطوة -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                <span style="color: #475569; font-size: 13.5px; font-weight: 700; font-family: 'Cairo', sans-serif;">انقر على زر "إنهاء الخطوة" عندما ترغب في المتابعة.</span>
                <button id="btnFinishWaitStep" type="button" onclick="window.photosynthesisLab.finishWait12Hours()" style="background: #f97316; color: #ffffff; border: none; padding: 10px 24px; border-radius: 6px; font-size: 15px; font-weight: 900; font-family: 'Cairo', sans-serif; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.3); transition: all 0.2s;">إنهاء الخطوة (Finish step)</button>
            </div>
        </div>
    </div>

    <!-- نافذة ضبط حجم ماصة P1000 الميكرومترية -->
    <div class="photo-modal-overlay" id="pipetteVolModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99999; display: none; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="photo-modal-content" style="max-width: 440px; width: 92%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); text-align: center;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                <h3 style="margin: 0; font-size: 17px; font-weight: 900; color: #0f172a; font-family: 'Cairo', sans-serif;">ضبط حجم ماصة P1000 الميكرومترية</h3>
                <button id="btnClosePipetteModal" type="button" onclick="window.photosynthesisLab.closePipetteVolModal()" style="background: #f1f5f9; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; color: #64748b;">✕</button>
            </div>

            <div style="padding: 24px 20px;">
                <p style="margin: 0 0 16px; color: #475569; font-size: 13.5px; font-family: 'Cairo', sans-serif;">
                    اضبط الحجم المطلوب لسحب العينات بدقة إلى <strong>1,000 µl</strong>:
                </p>

                <!-- شاشة العداد الرقمي للماصة -->
                <div style="display: inline-flex; align-items: center; justify-content: center; background: #0f172a; border: 3px solid #38bdf8; border-radius: 8px; padding: 10px 24px; margin-bottom: 18px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);">
                    <span id="pipetteModalDigits" style="color: #38bdf8; font-size: 38px; font-family: 'Courier New', monospace; font-weight: 900; letter-spacing: 4px;">0200</span>
                    <span style="color: #94a3b8; font-size: 16px; font-weight: bold; margin-right: 8px; font-family: sans-serif;">µL</span>
                </div>

                <!-- حقل الإدخال اليدوي المباشر لكتابة 1000 -->
                <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <label for="pipetteDirectInputPhp" style="font-size: 14px; font-weight: 800; color: #1e293b; font-family: 'Cairo', sans-serif;">اكتب الحجم:</label>
                    <input type="number" id="pipetteDirectInputPhp" min="100" max="1000" step="1" value="200" placeholder="1000"
                           oninput="window.photosynthesisLab.onPipetteInputDirect(this.value)"
                           style="width: 120px; padding: 6px 12px; font-size: 20px; font-weight: 900; font-family: 'Courier New', monospace; text-align: center; border: 2.5px solid #0284c7; border-radius: 8px; outline: none; background: #f0f9ff; color: #0369a1;">
                    <span style="font-weight: 800; color: #64748b; font-size: 15px;">µL</span>
                </div>

                <!-- أزرار الاختيار المباشر السريع -->
                <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 12px;">
                    <button type="button" id="btnPipetteQuick1000" onclick="window.photosynthesisLab.setPipetteModalVolDirect(1000)" style="padding: 6px 16px; background: #0284c7; color: #ffffff; border: none; border-radius: 6px; font-weight: 800; font-size: 13px; font-family: 'Cairo', sans-serif; cursor: pointer;">1,000 µL (المطلوب)</button>
                    <button type="button" id="btnPipetteQuick200" onclick="window.photosynthesisLab.setPipetteModalVolDirect(200)" style="padding: 6px 14px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: bold; font-size: 13px; font-family: 'Cairo', sans-serif; cursor: pointer; color: #475569;">200 µL</button>
                </div>

                <!-- أزرار التعديل اليدوي الدقيق -->
                <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 20px;">
                    <button type="button" id="btnPipetteSub100" onclick="window.photosynthesisLab.adjustPipetteModalVol(-100)" style="padding: 8px 14px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: bold; cursor: pointer;">-100</button>
                    <button type="button" id="btnPipetteSub10" onclick="window.photosynthesisLab.adjustPipetteModalVol(-10)" style="padding: 8px 12px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: bold; cursor: pointer;">-10</button>
                    <button type="button" id="btnPipetteAdd10" onclick="window.photosynthesisLab.adjustPipetteModalVol(10)" style="padding: 8px 12px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: bold; cursor: pointer;">+10</button>
                    <button type="button" id="btnPipetteAdd100" onclick="window.photosynthesisLab.adjustPipetteModalVol(100)" style="padding: 8px 14px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: bold; cursor: pointer;">+100</button>
                </div>

                <!-- زر الحفظ -->
                <button id="btnSavePipetteVolume" type="button" onclick="window.photosynthesisLab.savePipetteVolume()" style="width: 100%; padding: 12px; background: #0284c7; color: #ffffff; border: none; border-radius: 8px; font-size: 16px; font-weight: 900; font-family: 'Cairo', sans-serif; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.4);">
                    حفظ الحجم (Save Volume) ✓
                </button>
            </div>
        </div>
    </div>

    <!-- نافذة دفتر الملاحظات المعملية (Laboratory Notebook) للخطوة 2.د -->
    <div class="photo-modal-overlay" id="labNotebookModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99999; display: none; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="photo-modal-content" style="max-width: 620px; width: 95%; background: #fffdf5; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid #fde68a;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 2px solid #f59e0b; background: #fef3c7;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">📓</span>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 900; color: #78350f; font-family: 'Cairo', sans-serif;">دفتر الملاحظات المعملية (Laboratory Notebook)</h3>
                </div>
                <button id="btnCloseNotebookModal" type="button" onclick="window.photosynthesisLab.closeNotebookModal()" style="background: #fde68a; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; color: #92400e;">✕</button>
            </div>

            <div style="padding: 20px;">
                <p style="margin: 0 0 14px; font-size: 13.5px; color: #4b5563; font-family: 'Cairo', sans-serif; line-height: 1.6;">
                    <strong>الخطوة 2.د:</strong> باستخدام لوحة مقياس الرقم الهيدروجيني (pH Poster)، تفحّص اللون الفعلي لكل أنبوب بعد الحضانة، وحدد اللون المناسب (أخضر، أصفر، أزرق) لتسجيل تقدير الـ pH في دفتر المعمل:
                </p>

                <table style="width: 100%; border-collapse: collapse; font-family: 'Cairo', sans-serif; font-size: 13px; margin-bottom: 18px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background: #f8fafc; color: #1e293b; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; width: 18%;">الأنبوب</th>
                            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; width: 52%;">اختبار اللون المرصود</th>
                            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; width: 30%;">تقدير الرقم الهيدروجيني</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 800; text-align: center; color: #0f172a;">
                                <i class="fas fa-vial"></i> أنبوب 1
                            </td>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                                <div class="color-choice-wrapper" data-tube="1">
                                    <button type="button" class="color-choice-btn" onclick="window.photosynthesisLab.selectNotebookColor(1, 'green', this)">
                                        <span class="color-indicator-circle green"></span> أخضر
                                    </button>
                                    <button type="button" class="color-choice-btn" onclick="window.photosynthesisLab.selectNotebookColor(1, 'yellow', this)">
                                        <span class="color-indicator-circle yellow"></span> أصفر
                                    </button>
                                    <button type="button" class="color-choice-btn" onclick="window.photosynthesisLab.selectNotebookColor(1, 'blue', this)">
                                        <span class="color-indicator-circle blue"></span> أزرق
                                    </button>
                                </div>
                            </td>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                                <span id="notebook_ph_badge_1" style="display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: 900; background: #f1f5f9; color: #64748b;">
                                    حدد اللون
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 800; text-align: center; color: #0f172a;">
                                <i class="fas fa-vial"></i> أنبوب 2
                            </td>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                                <div class="color-choice-wrapper" data-tube="2">
                                    <button type="button" class="color-choice-btn" onclick="window.photosynthesisLab.selectNotebookColor(2, 'green', this)">
                                        <span class="color-indicator-circle green"></span> أخضر
                                    </button>
                                    <button type="button" class="color-choice-btn" onclick="window.photosynthesisLab.selectNotebookColor(2, 'yellow', this)">
                                        <span class="color-indicator-circle yellow"></span> أصفر
                                    </button>
                                    <button type="button" class="color-choice-btn" onclick="window.photosynthesisLab.selectNotebookColor(2, 'blue', this)">
                                        <span class="color-indicator-circle blue"></span> أزرق
                                    </button>
                                </div>
                            </td>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                                <span id="notebook_ph_badge_2" style="display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: 900; background: #f1f5f9; color: #64748b;">
                                    حدد اللون
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 800; text-align: center; color: #0f172a;">
                                <i class="fas fa-vial"></i> أنبوب 3
                            </td>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                                <div class="color-choice-wrapper" data-tube="3">
                                    <button type="button" class="color-choice-btn" onclick="window.photosynthesisLab.selectNotebookColor(3, 'green', this)">
                                        <span class="color-indicator-circle green"></span> أخضر
                                    </button>
                                    <button type="button" class="color-choice-btn" onclick="window.photosynthesisLab.selectNotebookColor(3, 'yellow', this)">
                                        <span class="color-indicator-circle yellow"></span> أصفر
                                    </button>
                                    <button type="button" class="color-choice-btn" onclick="window.photosynthesisLab.selectNotebookColor(3, 'blue', this)">
                                        <span class="color-indicator-circle blue"></span> أزرق
                                    </button>
                                </div>
                            </td>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                                <span id="notebook_ph_badge_3" style="display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: 900; background: #f1f5f9; color: #64748b;">
                                    حدد اللون
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 800; text-align: center; color: #0f172a;">
                                <i class="fas fa-vial"></i> أنبوب 4
                            </td>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                                <div class="color-choice-wrapper" data-tube="4">
                                    <button type="button" class="color-choice-btn" onclick="window.photosynthesisLab.selectNotebookColor(4, 'green', this)">
                                        <span class="color-indicator-circle green"></span> أخضر
                                    </button>
                                    <button type="button" class="color-choice-btn" onclick="window.photosynthesisLab.selectNotebookColor(4, 'yellow', this)">
                                        <span class="color-indicator-circle yellow"></span> أصفر
                                    </button>
                                    <button type="button" class="color-choice-btn" onclick="window.photosynthesisLab.selectNotebookColor(4, 'blue', this)">
                                        <span class="color-indicator-circle blue"></span> أزرق
                                    </button>
                                </div>
                            </td>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                                <span id="notebook_ph_badge_4" style="display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: 900; background: #f1f5f9; color: #64748b;">
                                    حدد اللون
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <button id="btnSaveNotebook" type="button" onclick="window.photosynthesisLab.saveNotebookNotes()" style="width: 100%; padding: 12px; background: #15803d; color: #ffffff; border: none; border-radius: 8px; font-size: 15px; font-weight: 900; font-family: 'Cairo', sans-serif; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(21, 128, 61, 0.4); display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <i class="fas fa-check"></i> تأكيد الملاحظات وحفظ التقديرات
                </button>
            </div>
        </div>
    </div>

    <!-- 4. Overlay Spectrophotometer Info Modal (LabXchange Exact Layout) -->
    <div class="spec-info-modal" id="specInfoModal" style="display: none;">
        <div class="spec-info-card">
            <!-- Modal Header -->
            <div class="spec-info-header">
                <h3>SPECTROPHOTOMETER INFO | معلومات مقياس الطيف الضوئي</h3>
                <button class="close-info-btn" id="btnCloseSpecInfo" onclick="window.photosynthesisLab.closeSpecInfoModal()">إغلاق <i class="fas fa-times"></i></button>
            </div>

            <!-- Modal Content Layout -->
            <div class="spec-info-body">
                <div class="spec-info-grid">
                    <!-- Left Column: How it Works (كيف يعمل) -->
                    <div class="info-section-how">
                        <div class="section-tab-header">
                            <span>How it works | كيف يعمل</span>
                        </div>
                        <div class="section-tab-content">
                            <p>
                                يُستخدم <strong>مقياس الطيف الضوئي</strong> لتحديد الرقم الهيدروجيني (pH) للمحلول عن طريق قياس امتصاصية كاشف الـ pH الخاص به (أزرق البروموثيمول BTB).
                            </p>
                            <p>
                                لقياس امتصاصية عينة BTB، تُوضع الكيوفيت المحتوية على المحلول داخل حجرة مقياس الطيف الضوئي. عندما يمر <strong>الضوء البرتقالي (عند طول موجي 615 نانومتر)</strong> عبر المحلول داخل الكيوفيت، تمتصه جزيئات كاشف BTB منزوعة البروتون (عند قيم pH المرتفعة والقاعدية - اللون الأزرق). أما جزيئات BTB المبرتنة (عند قيم pH المنخفضة والحمضية - اللون الأصفر) فلا تمتص الضوء البرتقالي.
                            </p>
                            <p>
                                الضوء الذي لا يتم امتصاصه ينفذ ويُقاس بواسطة <strong>كاشف الضوء (Light Detector)</strong>. وتُعد امتصاصية BTB مقياساً غير مباشر للرقم الهيدروجيني: <em>فكلما زادت امتصاصية محلول BTB، ارتفع رقمه الهيدروجيني (pH)</em>.
                            </p>
                            <p>
                                ولتحديد الرقم الهيدروجيني للعينة كمياً، تتم مقارنة قيمة الامتصاصية المقاسة للعينة المجهولة بمنحنى قياسي للرقم الهيدروجيني (pH Standard Curve) يربط الامتصاصية بعينات ذات رقم هيدروجيني معلوم.
                            </p>
                        </div>
                    </div>

                    <!-- Right Column: Parts Diagram (الأجزاء ومسار الضوء) -->
                    <div class="info-section-parts">
                        <div class="section-tab-header">
                            <span>Parts | أجزاء ومسار القياس</span>
                        </div>
                        <div class="diagram-container">
                            <svg viewBox="0 0 400 365" class="spec-diagram-svg" style="direction: ltr; text-align: left; width: 100%; height: auto;">
                                <!-- مسار الضوء البرتقالي من المصدر إلى الكاشف -->
                                <rect x="95" y="45" width="30" height="270" fill="#f59e0b" fill-opacity="0.3" />
                                <line x1="110" y1="315" x2="110" y2="45" stroke="#ea580c" stroke-width="2" stroke-dasharray="4,4" />

                                <!-- 1. كاشف الضوء العلوي (Light Detector) -->
                                <rect x="25" y="15" width="170" height="30" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
                                <text x="110" y="34" fill="#0f172a" font-size="10.5" font-weight="900" font-family="'Cairo', sans-serif" text-anchor="middle">كاشف الضوء (Detector)</text>
                                
                                <line x1="195" y1="30" x2="222" y2="30" stroke="#ffffff" stroke-width="1.5" />
                                <circle cx="195" cy="30" r="2.5" fill="#ffffff" />
                                <text x="228" y="27" fill="#ffffff" font-size="11" font-weight="800" font-family="'Cairo', sans-serif" text-anchor="start">كاشف الضوء</text>
                                <text x="228" y="39" fill="#93c5fd" font-size="9.5" font-family="'Cairo', sans-serif" text-anchor="start">(Light detector)</text>

                                <!-- 2. الضوء النافذ (Transmitted Light) -->
                                <line x1="125" y1="85" x2="222" y2="85" stroke="#ffffff" stroke-width="1.5" />
                                <circle cx="125" cy="85" r="2.5" fill="#ffffff" />
                                <text x="228" y="82" fill="#ffffff" font-size="11" font-weight="800" font-family="'Cairo', sans-serif" text-anchor="start">الضوء النافذ</text>
                                <text x="228" y="94" fill="#fed7aa" font-size="9.5" font-family="'Cairo', sans-serif" text-anchor="start">(Transmitted light)</text>

                                <!-- 3. حامل الكيوفيت والكيوفيت في المنتصف (Cuvette & Holder) -->
                                <rect x="60" y="120" width="100" height="100" rx="4" fill="#0f172a" stroke="#334155" stroke-width="2" />
                                <!-- الكيوفيت الزرقاء ثلاثية الأبعاد -->
                                <polygon points="75,135 135,135 145,125 85,125" fill="#38bdf8" fill-opacity="0.7" stroke="#0284c7" stroke-width="1.2" />
                                <polygon points="135,135 145,125 145,195 135,205" fill="#0284c7" fill-opacity="0.85" stroke="#0369a1" stroke-width="1.2" />
                                <rect x="75" y="135" width="60" height="70" fill="#0ea5e9" fill-opacity="0.8" stroke="#0284c7" stroke-width="1.5" />
                                <line x1="80" y1="140" x2="80" y2="200" stroke="#ffffff" stroke-width="1.5" opacity="0.6" />

                                <line x1="160" y1="170" x2="222" y2="170" stroke="#ffffff" stroke-width="1.5" />
                                <circle cx="160" cy="170" r="2.5" fill="#ffffff" />
                                <text x="228" y="165" fill="#ffffff" font-size="11" font-weight="800" font-family="'Cairo', sans-serif" text-anchor="start">عينة الكاشف في حامل الكيوفيت</text>
                                <text x="228" y="179" fill="#93c5fd" font-size="9.5" font-family="'Cairo', sans-serif" text-anchor="start">(BTB sample in cuvette holder)</text>

                                <!-- 4. شعاع الضوء البرتقالي الداخل (Entering Light 615nm) -->
                                <rect x="95" y="220" width="30" height="95" fill="#ea580c" />
                                <text x="90" y="270" fill="#ffffff" font-size="8.5" font-weight="800" font-family="'Cairo', sans-serif" transform="rotate(-90 90 270)" text-anchor="middle">مسار الضوء 615nm</text>

                                <line x1="125" y1="265" x2="222" y2="265" stroke="#ffffff" stroke-width="1.5" />
                                <circle cx="125" cy="265" r="2.5" fill="#ffffff" />
                                <text x="228" y="262" fill="#ffffff" font-size="11" font-weight="800" font-family="'Cairo', sans-serif" text-anchor="start">الضوء الداخل (615 nm)</text>
                                <text x="228" y="274" fill="#fed7aa" font-size="9.5" font-family="'Cairo', sans-serif" text-anchor="start">(Entering light)</text>

                                <!-- 5. مصدر الضوء السفلي (Light Source) -->
                                <rect x="25" y="315" width="170" height="32" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
                                <text x="110" y="335" fill="#0f172a" font-size="10.5" font-weight="900" font-family="'Cairo', sans-serif" text-anchor="middle">مصدر الضوء (Light source)</text>

                                <line x1="195" y1="331" x2="222" y2="331" stroke="#ffffff" stroke-width="1.5" />
                                <circle cx="195" cy="331" r="2.5" fill="#ffffff" />
                                <text x="228" y="328" fill="#ffffff" font-size="11" font-weight="800" font-family="'Cairo', sans-serif" text-anchor="start">مصدر الضوء</text>
                                <text x="228" y="340" fill="#cbd5e1" font-size="9.5" font-family="'Cairo', sans-serif" text-anchor="start">(Light source)</text>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Footer with Done Button -->
            <div class="spec-info-footer">
                <button class="spec-info-done-btn" id="btnDoneSpecInfo" onclick="window.photosynthesisLab.closeSpecInfoModal()">تم (Done) ✓</button>
            </div>
        </div>
    </div>

    <!-- 5. Overlay Spectrophotometer Settings Modal (LabXchange Exact Layout) -->
    <div class="spec-settings-modal" id="specSettingsModal" style="display: none;">
        <div class="spec-settings-card">
            <!-- Modal Header -->
            <div class="spec-settings-header">
                <h3>SPECTROPHOTOMETER SETTINGS | إعدادات مقياس الطيف الضوئي</h3>
                <button class="close-info-btn" id="btnCloseSpecSettings" onclick="window.photosynthesisLab.closeSpecSettingsModal()">إغلاق <i class="fas fa-times"></i></button>
            </div>

            <!-- Modal Content Layout -->
            <div class="spec-settings-body">
                <div class="spec-settings-grid">
                    <!-- Left Column: Line art & Instructions & Samples Table -->
                    <div class="settings-side-panel">
                        <div class="settings-spec-illustration">
                            <svg width="150" height="75" viewBox="0 0 150 75">
                                <rect x="5" y="18" width="140" height="52" rx="6" fill="none" stroke="#ffffff" stroke-width="2" />
                                <path d="M 55 18 L 55 6 C 55 3, 95 3, 95 6 L 95 18" fill="none" stroke="#ffffff" stroke-width="2" />
                                <rect x="16" y="28" width="44" height="22" rx="2" fill="none" stroke="#ffffff" stroke-width="1.4" />
                                <text x="38" y="43" fill="#ffffff" font-size="9" font-weight="900" font-family="'Courier New', monospace" text-anchor="middle">0.000</text>
                            </svg>
                        </div>
                        <h4>ضبط مقياس الطيف الضوئي | Set the spectrophotometer</h4>
                        <p>
                            استخدم العمود الثاني [الامتصاصية عند 615 nm] لتسجيل وتدوين قيم الامتصاصية المقاسة للعينات. سيتم تقريب القيم لرقمين عشريين، وتحديد قيم الرقم الهيدروجيني (pH) المقابلة لاحقاً.
                        </p>
                        <table class="settings-samples-table">
                            <thead>
                                <tr>
                                    <th>العينات (Samples)</th>
                                    <th>الامتصاصية (615nm)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>كيوفيت 1 (Cuvette 1)</td>
                                    <td><span id="set_abs_1_php">--</span></td>
                                </tr>
                                <tr>
                                    <td>كيوفيت 2 (Cuvette 2)</td>
                                    <td><span id="set_abs_2_php">--</span></td>
                                </tr>
                                <tr>
                                    <td>كيوفيت 3 (Cuvette 3)</td>
                                    <td><span id="set_abs_3_php">--</span></td>
                                </tr>
                                <tr>
                                    <td>كيوفيت 4 (Cuvette 4)</td>
                                    <td><span id="set_abs_4_php">--</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Right Column: Interactive Spectrophotometer Big Control Panel -->
                    <div class="settings-main-control">
                        <!-- Green LCD Screen -->
                        <div class="settings-lcd-box">
                            <div class="settings-lcd-header-left">
                                <div style="font-weight: 900; font-size: 0.88rem; color: #166534; letter-spacing: 0.5px;">الطول الموجي (WAVELENGTH): <span id="modalSpecWavelengthPhp">350</span>nm</div>
                                <div style="font-weight: 800; font-size: 0.8rem; color: #166534; margin-top: 3px; letter-spacing: 0.5px;">الامتصاصية (ABSORBANCE)</div>
                            </div>
                            <div class="settings-lcd-digits" id="modalSpecLcdDigitsPhp">0.000</div>
                        </div>

                        <!-- Spectrum Slider Box (Exact LabXchange Layout) -->
                        <div class="spectrum-slider-card">
                            <div class="spectrum-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                                <div>الطول الموجي: <span id="sliderCurrentValPhp" style="color:#0284c7; font-weight:900;">350 nm</span> | Wavelength</div>
                                <button type="button" class="btn-quick-615" onclick="window.photosynthesisLab.setWavelength615()" style="background: linear-gradient(135deg, #059669, #10b981); color: white; border: none; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 0.84rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 3px 10px rgba(16,185,129,0.35); transition: transform 0.15s, background 0.2s;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-bolt" style="color: #fef08a;"></i> ضبط مباشر (615 nm)
                                </button>
                            </div>
                            <div class="spectrum-dark-viewport">
                                <div class="spectrum-scale-labels">
                                    <span>350</span>
                                    <span>400</span>
                                    <span>450</span>
                                    <span>500</span>
                                    <span>550</span>
                                    <span>600</span>
                                    <span>650</span>
                                    <span>700</span>
                                    <span>750</span>
                                </div>
                                <div class="spectrum-track-container">
                                    <div class="spectrum-rainbow-bar"></div>
                                    <input type="range" id="wavelengthSliderInputPhp" class="wavelength-slider-input" min="350" max="750" value="350" step="1" oninput="window.photosynthesisLab.handleWavelengthChange(this.value)">
                                </div>
                            </div>
                        </div>

                        <!-- Zero & Power Buttons -->
                        <div class="settings-actions-row">
                            <button type="button" class="settings-zero-btn" onclick="window.photosynthesisLab.zeroSpectrophotometer()"><i class="fas fa-bullseye"></i> زر التصفير (Zero)</button>
                            <button type="button" class="settings-power-btn" onclick="window.photosynthesisLab.toggleSpecPower()"><i class="fas fa-power-off"></i> تشغيل / إيقاف (Power)</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Footer with Done Button -->
            <div class="spec-settings-footer">
                <button class="spec-info-done-btn" id="btnDoneSpecSettings" onclick="window.photosynthesisLab.closeSpecSettingsModal()">تم (Done) ✓</button>
            </div>
        </div>
    </div>

    <!-- 6. Overlay LabXchange Results & Scientific Analysis Page (RESULTS) -->
    <div class="results-page-modal" id="resultsModal" style="display: none;">
        <div class="results-page-wrapper">
            <!-- Header Bar -->
            <div class="results-top-header">
                <div class="results-header-left">
                    <button type="button" class="btn-back-to-lab" onclick="window.photosynthesisLab.closeResultsSection()">
                        <i class="fas fa-arrow-right"></i> <span>العودة للمختبر التفاعلي</span>
                    </button>
                </div>
                <div class="results-header-center">
                    <h2><i class="fas fa-chart-line"></i> النتائج والتحليل العلمي | RESULTS</h2>
                </div>
                <div class="results-header-right">
                    <button type="button" class="btn-print-results" onclick="window.print()">
                        <i class="fas fa-print"></i> <span>طباعة التقرير</span>
                    </button>
                </div>
            </div>

            <div class="results-main-scrollable">
                <!-- Research Questions Context -->
                <div class="results-context-card">
                    <div class="context-title-group">
                        <span class="context-pill">سؤالا البحث العلمي</span>
                        <h3>هل تقوم النباتات بالبناء الضوئي أكثر أم بالتنفس الخلوي في الضوء والظلام؟</h3>
                    </div>
                    <p class="context-desc">
                        سابقاً، قمت بوضع توقعاتك لنتائج التجربة للإجابة على سؤالي البحث:
                        <strong>(1) هل تُجري النباتات بناءً ضوئياً أكثر أم تنفساً خلوياً في وجود الضوء؟</strong>
                        و <strong>(2) هل تُجري بناءً ضوئياً أكثر أم تنفساً خلوياً في الظلام؟</strong>
                    </p>
                    <p class="context-instruction">
                        قارن الآن بين نتائجك المتوقعة (Predicted)، والنتائج الفعلية التي حصلت عليها في مختبرك (Actual)، والنتائج النموذجية المثالية (Ideal):
                    </p>
                </div>

                <!-- 1. Interactive Comparison Stage (Predicted / Actual / Ideal Tabs) -->
                <div class="results-comparison-card">
                    <div class="comparison-tabs-header">
                        <button type="button" class="comp-tab-btn" id="tabPredicted" onclick="window.photosynthesisLab.switchResultsTab('predicted')">التوقعات (Predicted)</button>
                        <button type="button" class="comp-tab-btn active" id="tabActual" onclick="window.photosynthesisLab.switchResultsTab('actual')">النتائج الفعلية (Actual)</button>
                        <button type="button" class="comp-tab-btn" id="tabIdeal" onclick="window.photosynthesisLab.switchResultsTab('ideal')">النتائج المثالية (Ideal)</button>
                    </div>

                    <div class="comparison-stage-content" id="comparisonStageBody">
                        <!-- Dynamic Visual of the 4 Tubes -->
                    </div>
                </div>

                <!-- 2. Single-Choice Question 1 (Tube 3 / Blue Color Analysis) -->
                <div class="quiz-question-card" id="cardQuestion1">
                    <div class="quiz-card-header">
                        <span class="q-badge">SINGLE-CHOICE QUESTION</span>
                        <span class="q-attempts" id="q1AttemptsLabel">المحاولات المتبقية: 3</span>
                    </div>
                    <h4 class="q-title">
                        1. تظهر النتائج المثالية أن لون كاشف الرقم الهيدروجيني (pH) في <strong>الأنبوب 3</strong> تحول إلى <strong>اللون الأزرق</strong> بعد انتهاء التجربة. ما هو التفسير العلمي لذلك؟
                    </h4>

                    <!-- Scale and Highlighted Diagram -->
                    <div class="q-diagram-box">
                        <div class="ph-scale-legend">
                            <span class="ph-legend-title">مستويات الرقم الهيدروجيني (pH levels)</span>
                            <div class="ph-scale-gradient-bar"></div>
                            <div class="ph-scale-ticks">
                                <span>0.0</span><span>2.0</span><span>6.1</span><span>6.3</span><span>6.5</span><span>6.7</span><span>6.9</span><span>7.1</span><span>7.3</span><span>7.5</span><span>7.7</span><span>7.9</span><span>12.0</span><span>14.0</span>
                            </div>
                        </div>

                        <!-- 4 Tubes graphic with Tube 3 highlighted with red border -->
                        <div class="q-tubes-graphic" id="q1TubesSvg"></div>
                        <p class="q-figure-caption">الشكل 13: النتائج بعد 12 ساعة من تعريض العينات لظروف الإضاءة أو الظلام. فسّر لون المحلول في الأنبوب 3.</p>
                    </div>

                    <!-- Multiple Choice Options -->
                    <div class="q-options-list">
                        <label class="q-option-item" id="q1_opt_A" onclick="window.photosynthesisLab.selectOption(1, 'A')">
                            <input type="radio" name="question1" value="A">
                            <span class="opt-letter">A</span>
                            <span class="opt-text">انخفض الرقم الهيدروجيني (pH) في الأنبوب 3 بسبب حدوث عملية البناء الضوئي. ويرتبط انخفاض pH بظهور درجات اللون الأزرق لكاشف BTB.</span>
                        </label>

                        <label class="q-option-item" id="q1_opt_B" onclick="window.photosynthesisLab.selectOption(1, 'B')">
                            <input type="radio" name="question1" value="B">
                            <span class="opt-letter">B</span>
                            <span class="opt-text">في الأنبوب 3، يتعرض النبات للضوء، وتتغلب عملية البناء الضوئي على التنفس الخلوي. يُستهلك غاز ثاني أكسيد الكربون (CO₂) من الماء المحيط بنبات الإيلوديا (Elodea). ونتيجة لذلك، يرتفع الرقم الهيدروجيني (pH) ويتحول كاشف BTB من اللون الأخضر إلى درجات اللون الأزرق.</span>
                        </label>

                        <label class="q-option-item" id="q1_opt_C" onclick="window.photosynthesisLab.selectOption(1, 'C')">
                            <input type="radio" name="question1" value="C">
                            <span class="opt-letter">C</span>
                            <span class="opt-text">أدى التنفس الخلوي في الأنبوب 3 إلى تحلل الصيغة الصفراء لكاشف pH، مما أدى إلى تلون الماء باللون الأزرق.</span>
                        </label>
                    </div>

                    <div class="q-footer">
                        <button type="button" class="btn-submit-q" id="btnSubmitQ1" onclick="window.photosynthesisLab.submitQuestion(1)">إرسال الإجابة</button>
                    </div>

                    <!-- Feedback Box -->
                    <div class="q-feedback-box" id="q1Feedback" style="display: none;"></div>
                </div>

                <!-- 3. Single-Choice Question 2 (Tube 4 / Yellow Color Analysis) -->
                <div class="quiz-question-card" id="cardQuestion2">
                    <div class="quiz-card-header">
                        <span class="q-badge">سؤال اختيار من متعدد</span>
                        <span class="q-attempts" id="q2AttemptsLabel">المحاولات المتبقية: 3</span>
                    </div>
                    <h4 class="q-title">
                        2. تظهر النتائج المثالية أن لون كاشف الرقم الهيدروجيني في <strong>الأنبوب 4</strong> تحول إلى <strong>اللون الأصفر</strong> بعد انتهاء التجربة. ما هو التفسير العلمي لذلك؟
                    </h4>

                    <!-- Scale and Highlighted Diagram -->
                    <div class="q-diagram-box">
                        <div class="ph-scale-legend">
                            <span class="ph-legend-title">مستويات الرقم الهيدروجيني (pH levels)</span>
                            <div class="ph-scale-gradient-bar"></div>
                            <div class="ph-scale-ticks">
                                <span>0.0</span><span>2.0</span><span>6.1</span><span>6.3</span><span>6.5</span><span>6.7</span><span>6.9</span><span>7.1</span><span>7.3</span><span>7.5</span><span>7.7</span><span>7.9</span><span>12.0</span><span>14.0</span>
                            </div>
                        </div>

                        <!-- 4 Tubes graphic with Tube 4 highlighted with red border -->
                        <div class="q-tubes-graphic" id="q2TubesSvg"></div>
                        <p class="q-figure-caption">الشكل 14: النتائج بعد 12 ساعة من تعريض العينات لظروف الإضاءة أو الظلام. فسّر لون المحلول في الأنبوب 4.</p>
                    </div>

                    <!-- Multiple Choice Options -->
                    <div class="q-options-list">
                        <label class="q-option-item" id="q2_opt_A" onclick="window.photosynthesisLab.selectOption(2, 'A')">
                            <input type="radio" name="question2" value="A">
                            <span class="opt-letter">A</span>
                            <span class="opt-text">في الظلام، يتوقف البناء الضوئي (غير نشط). ويجب تأمين الطاقة بواسطة التنفس الخلوي، مما يؤدي إلى انخفاض الرقم الهيدروجيني (pH).</span>
                        </label>

                        <label class="q-option-item" id="q2_opt_B" onclick="window.photosynthesisLab.selectOption(2, 'B')">
                            <input type="radio" name="question2" value="B">
                            <span class="opt-letter">B</span>
                            <span class="opt-text">تحول لون الأنبوب إلى الأصفر بسبب حدوث البناء الضوئي.</span>
                        </label>

                        <label class="q-option-item" id="q2_opt_C" onclick="window.photosynthesisLab.selectOption(2, 'C')">
                            <input type="radio" name="question2" value="C">
                            <span class="opt-letter">C</span>
                            <span class="opt-text">يشير اللون الأصفر لمحلول كاشف BTB إلى غياب كل من البناء الضوئي والتنفس الخلوي.</span>
                        </label>
                    </div>

                    <div class="q-footer">
                        <button type="button" class="btn-submit-q" id="btnSubmitQ2" onclick="window.photosynthesisLab.submitQuestion(2)">إرسال الإجابة</button>
                    </div>

                    <!-- Feedback Box -->
                    <div class="q-feedback-box" id="q2Feedback" style="display: none;"></div>
                </div>

                <!-- 4. Single-Choice Question 3 (Photosynthesis vs Cellular Respiration in Light) -->
                <div class="quiz-question-card" id="cardQuestion3">
                    <div class="quiz-card-header">
                        <span class="q-badge">سؤال اختيار من متعدد</span>
                        <span class="q-attempts" id="q3AttemptsLabel">المحاولات المتبقية: 3</span>
                    </div>
                    <h4 class="q-title">
                        3. بالنظر إلى النتائج المثالية، هل تؤكد التجربة أنه <strong>في وجود الضوء، يحدث البناء الضوئي بمعدل يفوق التنفس الخلوي</strong>؟
                    </h4>

                    <!-- Options -->
                    <div class="q-options-list">
                        <label class="q-option-item" id="q3_opt_A" onclick="window.photosynthesisLab.selectOption(3, 'A')">
                            <input type="radio" name="question3" value="A">
                            <span class="opt-letter">A</span>
                            <span class="opt-text">نعم</span>
                        </label>

                        <label class="q-option-item" id="q3_opt_B" onclick="window.photosynthesisLab.selectOption(3, 'B')">
                            <input type="radio" name="question3" value="B">
                            <span class="opt-letter">B</span>
                            <span class="opt-text">لا</span>
                        </label>

                        <label class="q-option-item" id="q3_opt_C" onclick="window.photosynthesisLab.selectOption(3, 'C')">
                            <input type="radio" name="question3" value="C">
                            <span class="opt-letter">C</span>
                            <span class="opt-text">البيانات غير حاسمة. لا يمكننا الجزم بما إذا كانت النباتات تقوم بالتنفس الخلوي في الظلام.</span>
                        </label>
                    </div>

                    <div class="q-footer">
                        <button type="button" class="btn-submit-q" id="btnSubmitQ3" onclick="window.photosynthesisLab.submitQuestion(3)">إرسال الإجابة</button>
                    </div>

                    <!-- Feedback Box -->
                    <div class="q-feedback-box" id="q3Feedback" style="display: none;"></div>
                </div>

                <!-- 5. Single-Choice Question 4 (Cellular Respiration in the Dark) -->
                <div class="quiz-question-card" id="cardQuestion4">
                    <div class="quiz-card-header">
                        <span class="q-badge">سؤال اختيار من متعدد</span>
                        <span class="q-attempts" id="q4AttemptsLabel">المحاولات المتبقية: 3</span>
                    </div>
                    <h4 class="q-title">
                        4. بالنظر إلى النتائج المثالية، هل تؤكد التجربة أن <strong>الخلايا تقوم بعملية التنفس الخلوي في الظلام</strong>؟
                    </h4>

                    <!-- Options -->
                    <div class="q-options-list">
                        <label class="q-option-item" id="q4_opt_A" onclick="window.photosynthesisLab.selectOption(4, 'A')">
                            <input type="radio" name="question4" value="A">
                            <span class="opt-letter">A</span>
                            <span class="opt-text">نعم</span>
                        </label>

                        <label class="q-option-item" id="q4_opt_B" onclick="window.photosynthesisLab.selectOption(4, 'B')">
                            <input type="radio" name="question4" value="B">
                            <span class="opt-letter">B</span>
                            <span class="opt-text">لا</span>
                        </label>

                        <label class="q-option-item" id="q4_opt_C" onclick="window.photosynthesisLab.selectOption(4, 'C')">
                            <input type="radio" name="question4" value="C">
                            <span class="opt-letter">C</span>
                            <span class="opt-text">البيانات غير حاسمة. لا يمكننا الجزم بما إذا كانت النباتات تقوم بالتنفس الخلوي في الظلام.</span>
                        </label>
                    </div>

                    <div class="q-footer">
                        <button type="button" class="btn-submit-q" id="btnSubmitQ4" onclick="window.photosynthesisLab.submitQuestion(4)">إرسال الإجابة</button>
                    </div>

                    <!-- Feedback Box -->
                    <div class="q-feedback-box" id="q4Feedback" style="display: none;"></div>
                </div>

                <!-- 6. Section: From Visual Inspection to Actual Numbers -->
                <div class="results-concept-card">
                    <h3 class="section-title"><i class="fas fa-eye"></i> من الفحص البصري للرقم الهيدروجيني إلى الأرقام الفعلية</h3>
                    <p class="concept-text">
                        إن التغير في لون كاشف الرقم الهيدروجيني استجابةً للظروف التجريبية يعطيك فقط <strong>قراءة نوعية وصفية (qualitative readout)</strong>. يمكنك تقدير التغير اللوني بصرياً في التجربة، ولكن لا يمكن تحديد التغير الدقيق المقابل في الرقم الهيدروجيني كأرقام عددية بدقة.
                    </p>
                    <div class="concept-question-box">
                        <strong>كيف يمكننا قياس التغير في الرقم الهيدروجيني كمياً؟</strong>
                        <p>بمعنى آخر، كيف نحول <strong>البيانات النوعية (اللون)</strong> إلى <strong>بيانات كمية (مخرجات عددية دقيقة)</strong>؟</p>
                    </div>
                </div>

                <!-- 7. Section: Building the Standard Curve (Figure 15) -->
                <div class="results-curve-card">
                    <h3 class="section-title"><i class="fas fa-chart-line"></i> بناء المنحنى القياسي للمعايرة (Building the standard curve)</h3>
                    <p class="curve-text">
                        أعطاك مقياس الطيف الضوئي قيماً دقيقة للامتصاصية لكل عينة تجريبية. ولتحديد الرقم الهيدروجيني (pH) للعينات كمياً، سنقارن قيم امتصاصيتها بسلسلة من العينات القياسية معلومة الـ pH بدقة. إن تمثيل قيم الامتصاصية للعينات القياسية على <strong>مخطط التبعثر (scatter plot)</strong> يتيح لنا إنشاء ما يُعرف بـ <strong>المنحنى القياسي (standard curve)</strong> (الشكل 15).
                    </p>

                    <!-- Figure 15 Interactive Card -->
                    <div class="figure-15-card" id="figure15Container">
                        <!-- Top pH Legend with dynamic active circle -->
                        <div class="fig15-ph-header">
                            <span class="fig15-ph-title">عينات كاشف BTB ذات الرقم الهيدروجيني المعلوم (BTB samples of known pH):</span>
                            <div class="ph-scale-gradient-bar" id="fig15GradientBar"></div>
                            <div class="ph-scale-ticks" id="fig15Ticks">
                                <span data-ph="0.0">0.0</span>
                                <span data-ph="2.0">2.0</span>
                                <span data-ph="6.1">6.1</span>
                                <span data-ph="6.3">6.3</span>
                                <span data-ph="6.5">6.5</span>
                                <span data-ph="6.7">6.7</span>
                                <span data-ph="6.9">6.9</span>
                                <span data-ph="7.1">7.1</span>
                                <span data-ph="7.3">7.3</span>
                                <span data-ph="7.5">7.5</span>
                                <span data-ph="7.7">7.7</span>
                                <span data-ph="7.9">7.9</span>
                                <span data-ph="12.0">12.0</span>
                                <span data-ph="14.0">14.0</span>
                            </div>
                        </div>

                        <!-- Grid: Table on Left, Chart on Right -->
                        <div class="fig15-grid">
                            <!-- Table -->
                            <div class="fig15-table-box">
                                <table class="fig15-data-table">
                                    <thead>
                                        <tr>
                                            <th>معايير pH<br><small>pH standards</small></th>
                                            <th>الامتصاصية عند 615nm<br><small>Abs (@615 nm)</small></th>
                                        </tr>
                                    </thead>
                                    <tbody id="fig15TableBody">
                                        <!-- Rows 6.1 through 7.7 populated interactively -->
                                    </tbody>
                                </table>
                            </div>

                            <!-- Scatter Plot Chart Canvas -->
                            <div class="fig15-chart-box">
                                <h4 class="fig15-chart-title">الامتصاصية مقابل الرقم الهيدروجيني (Absorbance versus pH)</h4>
                                <div id="fig15ChartSvgBox">
                                    <!-- Dynamic SVG Chart -->
                                </div>
                            </div>
                        </div>

                        <!-- Bottom Scrubber & Play Bar -->
                        <div class="fig15-player-bar" style="direction: ltr;">
                            <button type="button" class="fig15-play-btn" id="btnPlayFig15" onclick="window.photosynthesisLab.toggleFig15Play()">
                                <i class="fas fa-play" id="fig15PlayIcon"></i>
                            </button>
                            <div class="fig15-track-container" id="fig15Track" onclick="window.photosynthesisLab.handleTrackClick(event)">
                                <div class="fig15-track-line"></div>
                                <div class="fig15-track-progress" id="fig15TrackProgress" style="width: 0%;"></div>
                                <div class="fig15-dots-list" id="fig15DotsList">
                                    <!-- 9 clickable dots for pH 6.1 to 7.7 -->
                                </div>
                            </div>
                        </div>

                        <p class="q-figure-caption" style="margin-top: 14px; text-align: right; color: #94a3b8; font-size: 0.86rem; line-height: 1.55;">
                            الشكل 15: على اليمين جدول محاليل BTB معلومة الرقم الهيدروجيني (تُسمى المحاليل القياسية للـ pH) وقيم الامتصاصية المقابلة لها (Abs) عند 615 nm. يوضح المخطط البياني على اليسار تمثيل هذه القيم، حيث يمثل المحور الأفقي الرقم الهيدروجيني ويمثل المحور الرأسي الامتصاصية. يتم ربط نقاط البيانات الفردية بخط أفضل مطابقة (والذي يعبر بأفضل شكل عن العلاقة الخطية لمجموعة نقاط البيانات) لإنشاء المنحنى القياسي.
                        </p>
                    </div>
                </div>

                <!-- 8. Section: Determining Unknown pH in 3 Steps & Figure 16 -->
                <div class="results-concept-card">
                    <h3 class="section-title"><i class="fas fa-list-ol"></i> تحديد الرقم الهيدروجيني للعينات المجهولة في 3 خطوات (Determining pH in 3 steps)</h3>
                    <p class="concept-text">
                        يتم تنعيم قيم الامتصاصية المُمثلة للمحاليل القياسية للرقم الهيدروجيني بخط اتجاه خطي أفضل مطابقة لإنشاء <strong>المنحنى القياسي (standard curve)</strong>. يتيح لنا هذا المنحنى تحديد الرقم الهيدروجيني لأي محلول BTB مجهول في 3 خطوات متسلسلة:
                    </p>

                    <div class="steps-3-grid">
                        <div class="step-3-item">
                            <span class="step-3-num">1</span>
                            <div class="step-3-text">
                                <strong>إنشاء المنحنى القياسي:</strong>
                                <p>نقيس امتصاصية محاليل قياسية معلومة الرقم الهيدروجيني لإنشاء المنحنى القياسي. أي نحدد لكل قيمة pH قيمة امتصاصية مقابلة:</p>
                                <code>pH &rarr; Absorbance</code>
                            </div>
                        </div>

                        <div class="step-3-item">
                            <span class="step-3-num">2</span>
                            <div class="step-3-text">
                                <strong>قياس امتصاصية العينة المجهولة:</strong>
                                <p>نقيس امتصاصية العينة التجريبية مجهولة الرقم الهيدروجيني باستخدام مقياس الطيف الضوئي.</p>
                            </div>
                        </div>

                        <div class="step-3-item">
                            <span class="step-3-num">3</span>
                            <div class="step-3-text">
                                <strong>مطابقة الامتصاصية بالرقم الهيدروجيني:</strong>
                                <p>نطابق الامتصاصية مع قيمة الرقم الهيدروجيني بمساعدة المنحنى القياسي (وهو عكس الخطوة الأولى):</p>
                                <code>Absorbance &rarr; pH</code>
                            </div>
                        </div>
                    </div>

                    <!-- Example Banner -->
                    <div class="example-banner">
                        <i class="fas fa-lightbulb"></i>
                        <span>
                            <strong>مثال توضيحي:</strong> محلول كاشف BTB برقم هيدروجيني مجهول مبدئياً، وله امتصاصية مقاسة تبلغ <strong>0.75</strong>، يكون رقمه الهيدروجيني المقابل تقريباً هو <strong>7.40</strong> (كما هو موضح في الشكل 16).
                        </span>
                    </div>

                    <!-- Figure 16 Card -->
                    <div class="figure-16-card">
                        <h4 class="fig16-chart-title">الامتصاصية مقابل الرقم الهيدروجيني (Absorbance versus pH)</h4>
                        <div class="fig16-chart-box" id="fig16ChartSvgBox">
                            <!-- Rendered by JS: standard curve with green projection lines -->
                        </div>
                        <p class="q-figure-caption" style="margin-top: 14px; text-align: right; color: #94a3b8; font-size: 0.86rem; line-height: 1.55;">
                            الشكل 16: يُستخدم المنحنى القياسي لتحديد الرقم الهيدروجيني لمحلول BTB مجهول. أولاً، يتم قياس امتصاصية عينة BTB ذات الرقم الهيدروجيني المجهول. ثم باستخدام المنحنى القياسي، يتم ربط امتصاصية العينة (على المحور الرأسي y) بقيمة الرقم الهيدروجيني (على المحور الأفقي x).
                        </p>
                    </div>

                    <p class="concept-text" style="margin-top: 18px; font-weight: 700; color: #334155;">
                        يتيح لك شريط التمرير أدناه مطابقة امتصاصية عيناتك الأربعة مع رقمها الهيدروجيني (الشكل 17). اسحب منزلق الامتصاصية للوصول إلى امتصاصية عينتك المقاسة على المحور الرأسي، واقرأ قيمة الرقم الهيدروجيني المقابلة على المحور الأفقي، ثم سجّل هذه القيم في جدول النتائج أدناه.
                    </p>
                </div>

                <!-- 9. Section: Figure 17 (EXPLORE) Interactive Slider -->
                <div class="results-explore-card" id="figure17Container">
                    <div class="explore-header">
                        <span class="explore-badge"><i class="fas fa-compass"></i> EXPLORE (استكشف)</span>
                        <h3 class="explore-title">اسحب المنزلق لمعرفة قيمة الرقم الهيدروجيني المقابلة للامتصاصية (Drag the slider to see what pH value matches the absorbance)</h3>
                    </div>

                    <!-- Figure 17 Chart with continuous BTB gradient -->
                    <div class="fig17-chart-box" id="fig17ChartSvgBox">
                        <!-- Rendered by JS -->
                    </div>

                    <p class="q-figure-caption" style="margin-top: 12px; text-align: right; color: #94a3b8; font-size: 0.86rem; line-height: 1.55;">
                        الشكل 17: يتم عرض زوج بيانات الامتصاصية وقيمة الرقم الهيدروجيني كإحداثيات على طول المنحنى القياسي.
                    </p>

                    <!-- Interactive Slider -->
                    <div class="fig17-slider-container">
                        <div class="fig17-slider-header">
                            <span>الامتصاصية (Absorbance):</span>
                            <span class="slider-display-val" id="fig17SliderDisplay">0.11 Abs</span>
                        </div>
                        <div class="fig17-slider-wrapper" style="direction: ltr;">
                            <span class="slider-limit-label">0.11</span>
                            <input type="range" id="fig17Slider" min="0.11" max="1.00" step="0.005" value="0.11" oninput="window.photosynthesisLab.handleFig17Slider(this.value)">
                            <span class="slider-limit-label">1.00</span>
                        </div>
                    </div>
                </div>

                <!-- 10. Question 5 Table: Recording pH for the 4 Experimental Samples -->
                <div class="question-box" id="q5Box">
                    <div class="q-header">
                        <span class="q-badge"><i class="fas fa-table"></i> السؤال 5</span>
                        <span class="q-status" id="q5Status"><i class="fas fa-circle-notch"></i> بانتظار الإجابة</span>
                    </div>

                    <h4 class="q-title">
                        5. بمساعدة شريط التمرير أعلاه، طابق قيم الامتصاصية المقاسة للعينات 1-4 مع قيم الرقم الهيدروجيني الخاصة بها. في كل مرة، اسحب شريط التمرير إلى قيمة الامتصاصية المقاسة لقراءة قيمة الرقم الهيدروجيني المقابلة. أدخل كل قيمة pH في الجدول أدناه:
                    </h4>

                    <div class="q5-table-wrapper">
                        <table class="q5-data-table">
                            <thead>
                                <tr>
                                    <th>العينة</th>
                                    <th>الامتصاصية عند 615 نانومتر</th>
                                    <th>الرقم الهيدروجيني (pH)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>العينة 1</strong> - <span style="font-size: 0.85rem; color: #b45309;"><i class="fas fa-sun"></i> في الضوء (نبات)</span></td>
                                    <td><strong class="abs-val" id="q5_disp_s1">0.97</strong></td>
                                    <td>
                                        <input type="number" step="0.1" min="0" max="14" class="q5-table-input" id="q5_tube1_ph" placeholder="أدخل القيمة">
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>العينة 2</strong> - <span style="font-size: 0.85rem; color: #475569;"><i class="fas fa-moon"></i> في الظلام (نبات)</span></td>
                                    <td><strong class="abs-val" id="q5_disp_s2">0.13</strong></td>
                                    <td>
                                        <input type="number" step="0.1" min="0" max="14" class="q5-table-input" id="q5_tube2_ph" placeholder="أدخل القيمة">
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>العينة 3</strong> - <span style="font-size: 0.85rem; color: #b45309;"><i class="fas fa-sun"></i> ضابط في الضوء (بدون نبات)</span></td>
                                    <td><strong class="abs-val" id="q5_disp_s3">0.51</strong></td>
                                    <td>
                                        <input type="number" step="0.1" min="0" max="14" class="q5-table-input" id="q5_tube3_ph" placeholder="أدخل القيمة">
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>العينة 4</strong> - <span style="font-size: 0.85rem; color: #475569;"><i class="fas fa-moon"></i> ضابط في الظلام (بدون نبات)</span></td>
                                    <td><strong class="abs-val" id="q5_disp_s4">0.48</strong></td>
                                    <td>
                                        <input type="number" step="0.1" min="0" max="14" class="q5-table-input" id="q5_tube4_ph" placeholder="أدخل القيمة">
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="q-footer" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <span class="attempts-count" style="font-size: 0.88rem; color: #64748b; font-weight: 700;">المحاولات المتبقية: <strong id="q5AttemptsLeft" style="color: #0f172a;">3</strong></span>
                        <button type="button" class="btn-submit-q" id="btnSubmitQ5" onclick="window.photosynthesisLab.submitQuestion5()">
                            <i class="fas fa-check-circle"></i> إرسال الإجابة
                        </button>
                    </div>

                    <!-- Feedback Box -->
                    <div class="q-feedback-box" id="q5Feedback" style="display: none;"></div>
                </div>

                <!-- 11. Question 6: Open-Ended Question (Figure 18) -->
                <div class="question-box" id="q6Box" style="margin-top: 24px;">
                    <div class="q-header">
                        <span class="q-badge" style="background: #0d9488;"><i class="fas fa-comment-dots"></i> سؤال مفتوح</span>
                        <span class="q-status" id="q6Status"><i class="fas fa-circle-notch"></i> بانتظار الإجابة</span>
                    </div>

                    <h4 class="q-title">
                        6. هل تؤكد البيانات الكمية التي حصلت عليها من مقياس الطيف الضوئي بياناتك النوعية لكاشف الرقم الهيدروجيني؟
                    </h4>

                    <!-- pH Levels Scale Bar -->
                    <div class="q6-ph-scale-box" style="margin: 14px 0;">
                        <span class="fig15-ph-title" style="margin-bottom: 6px; display: block; font-weight: 700; color: #334155;">مستويات الرقم الهيدروجيني (pH levels):</span>
                        <div class="ph-scale-gradient-bar" style="height: 14px; border-radius: 4px;"></div>
                        <div class="ph-scale-ticks" style="font-size: 0.78rem; margin-top: 4px;">
                            <span>0.0</span><span>2.0</span><span>6.1</span><span>6.3</span><span>6.5</span><span>6.7</span><span>6.9</span><span>7.1</span><span>7.3</span><span>7.5</span><span>7.7</span><span>7.9</span><span>12.0</span><span>14.0</span>
                        </div>
                    </div>

                    <!-- Figure 18 Card (4 tubes after 12 hours) -->
                    <div class="fig18-card" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 16px 0; text-align: center;">
                        <div id="fig18TubesGraphicBox">
                            <!-- Rendered SVG of the 4 tubes -->
                        </div>
                        <p class="q-figure-caption" style="margin-top: 14px; text-align: right; color: #64748b; font-size: 0.86rem; line-height: 1.55;">
                            الشكل 18: يظهر الإعداد التجريبي المألوف مع 4 أنابيب تحتوي على محلول كاشف BTB بعد 12 ساعة من زمن التفاعل.
                        </p>
                    </div>

                    <!-- Textarea for Answer -->
                    <div class="q6-textarea-wrapper" style="margin: 14px 0;">
                        <textarea id="q6AnswerText" rows="4" class="q6-textarea" placeholder="اكتب إجابتك هنا..." style="width: 100%; padding: 12px 14px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-family: inherit; font-size: 0.95rem; line-height: 1.6; resize: vertical; box-sizing: border-box; outline: none;"></textarea>
                    </div>

                    <div class="q-footer" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <span class="attempts-count" style="font-size: 0.88rem; color: #64748b; font-weight: 700;">المحاولات المتبقية: غير محدود</span>
                        <button type="button" class="btn-submit-q" id="btnSubmitQ6" onclick="window.photosynthesisLab.submitQuestion6()">
                            <i class="fas fa-paper-plane"></i> إرسال الإجابة
                        </button>
                    </div>

                    <!-- Feedback Box -->
                    <div class="q-feedback-box" id="q6Feedback" style="display: none;"></div>

                    <!-- Next Section Button -->
                    <div id="q6NextBtnBox" style="display: none; margin-top: 18px; text-align: left;">
                        <button type="button" class="btn-submit-q" style="background: #f59e0b; color: #ffffff;" onclick="window.photosynthesisLab.finishExperimentFlow()">
                            القسم التالي <i class="fas fa-arrow-left"></i>
                        </button>
                    </div>
                    </div>
                </div>

                <!-- Final Summary Banner -->
                <div class="results-final-summary" id="resultsFinalSummary" style="display: none;">
                    <i class="fas fa-award" style="font-size: 2.4rem; color: #f59e0b;"></i>
                    <div class="summary-text">
                        <h3>🎉 تهانينا! اكتملت تجربة البناء الضوئي والتنفس الخلوي بنجاح تام</h3>
                        <p>لقد أثبتت التجربة علمياً وعملياً تفوق البناء الضوئي في الضوء (استهلاك CO₂ ورفع الرقم الهيدروجيني pH) وتفوق التنفس الخلوي في الظلام (إنتاج CO₂ وخفض pH وتحول اللون للأصفر).</p>
                    </div>
                </div>

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

    <!-- 3D Engine Library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

    <!-- Clean Architecture Modular Engines -->
    <script src="../js/experiments/photosynthesis/audioManager.js?v=<?= $js_v ?>"></script>
    <script src="../js/experiments/photosynthesis/spectroEngine.js?v=<?= $js_v ?>"></script>
    <script src="../js/experiments/photosynthesis/tubeEngine.js?v=<?= $js_v ?>"></script>
    <script src="../js/experiments/photosynthesis/modalManager.js?v=<?= $js_v ?>"></script>
    <script src="../js/experiments/photosynthesis/svgLabScene.js?v=<?= $js_v ?>"></script>
    <script src="../js/experiments/photosynthesis/svgDragDrop.js?v=<?= $js_v ?>"></script>
    <!-- Lab Engine Script -->
    <script src="../js/experiments/photosynthesis/app.js?v=<?= $js_v ?>"></script>
</body>
</html>
