<?php
require_once '../config.php';
require_once '../functions.php';

$sub = isAuthenticated();

$user_name = $_SESSION['user']['name'] ?? $_SESSION['user_name'] ?? 'معلم معتمد';
$user_contact = $_SESSION['user']['whatsappNumber'] ?? $_SESSION['user']['phone'] ?? $_SESSION['user']['email'] ?? '';

$exp_active = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM experiments WHERE id = 6"))['is_active'];
if (!$exp_active) {
    header("Location: ../my-experiments.php?msg=experiment_disabled");
    exit();
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>فصل المخاليط | مختبرات العلوم والتقنية</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../css/separation.css">
</head>
<body>

    <header class="lab-header">
        <a href="../my-experiments.php" class="lab-brand">
            <i class="fas fa-flask"></i>
            <span>مختبرات العلوم والتقنية للجميع</span>
        </a>
        <div class="exp-badge"><i class="fas fa-vial"></i> فصل المخاليط</div>
        <a href="../my-experiments.php" class="exit-btn"><i class="fas fa-arrow-right"></i> خروج</a>
    </header>

    <div class="main" id="labStage">

        <!-- بانر تعريفي: ليه أصلاً بنقدر نفصل المخاليط؟ (من دليل التجربة) -->
        <div class="intro-banner" id="introBanner">
            <div class="intro-banner-icon"><i class="fas fa-lightbulb"></i></div>
            <div class="intro-banner-text">
                <strong>الفكرة الأساسية:</strong> كل مادة لها خواص فيزيائية تميزها عن غيرها (الحجم، الكثافة، الذوبانية،
                المغناطيسية، درجة الغليان)، ويمكن استغلال هذه الخاصية لفصل المخلوط دون تغيير تركيبه الكيميائي.
                الهدف في كل مخلوط أن تكتشف: <em>ما الخاصية التي جعلت هذه الطريقة تنجح؟</em>
            </div>
            <button type="button" class="intro-banner-close" id="introBannerClose" aria-label="إغلاق">
                <i class="fas fa-xmark"></i>
            </button>
        </div>

        <div class="mixture-tabs" id="mixtureTabs"></div>

        <div class="canvas-column">
            <div id="workspaceWrap">
                <div class="canvas-wrapper" id="canvasWrapper">
                    <div class="canvas-header">
                    <div><span class="live-dot"></span> <span id="workspaceTitle">المخلوط</span></div>
                    <button type="button" class="btn-hint" id="btnHint"><i class="fas fa-lightbulb"></i> تلميح ومعلومات</button>
                </div>
                <div id="feedbackText">اسحب إحدى الأدوات إلى المخلوط، أو اضغط عليها مباشرة.</div>
                <div class="canvas-stage" id="canvasStage">
                    <canvas id="labCanvas"></canvas>
                    <div class="result-toast" id="resultToast"></div>
                    <div id="exploreBox" class="explore-box" style="display:none;"></div>
                </div>
                </div>
            </div>

             <div class="control-card">
                <div class="card-title"><i class="fas fa-table-list"></i> خصائص المواد الخمس</div>
                <div class="properties-list" id="propertiesList"></div>
            </div>

            <!-- مفاهيم أساسية (من دليل التجربة) -->
            <section class="concepts-section" id="conceptsSection">
                <div class="concepts-header">
                    <i class="fas fa-graduation-cap"></i>
                    <span>مفاهيم أساسية في فصل المخاليط</span>
                </div>

                <div class="concept-item">
                    <button type="button" class="concept-toggle" data-concept="c1">
                        <span class="concept-title"><i class="fas fa-atom concept-icon"></i> المادة والمادة النقية</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="concept-panel" id="c1">
                        <p><strong>المادة:</strong> كل ما له كتلة ويشغل حيزًا من الفراغ.</p>
                        <p><strong>المادة النقية:</strong> تتكون من نوع واحد فقط من الجسيمات، مثل: الماء المقطر، الحديد، الذهب.</p>
                    </div>
                </div>

                <div class="concept-item">
                    <button type="button" class="concept-toggle" data-concept="c2">
                        <span class="concept-title"><i class="fas fa-flask concept-icon"></i> المخلوط ولماذا يمكن فصله</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="concept-panel" id="c2">
                        <p><strong>المخلوط:</strong> امتزاج مادتين أو أكثر دون حدوث تفاعل كيميائي، أي أن كل مادة تحتفظ بخصائصها، ولهذا يمكن فصلها مرة أخرى.</p>
                        <p>يمكن فصل المخاليط لأن المواد المكوّنة لها تختلف في خواصها الفيزيائية (الحجم، الكثافة، الذوبانية، المغناطيسية، درجة الغليان، حجم الحبيبات)، وكل طريقة فصل تعتمد على خاصية واحدة فقط، وهذا ما يكتشفه الطالب بنفسه أثناء المحاكاة.</p>
                    </div>
                </div>

                <div class="concept-item">
                    <button type="button" class="concept-toggle" data-concept="c3">
                        <span class="concept-title"><i class="fas fa-layer-group concept-icon"></i> نوعا المخلوط: متجانس وغير متجانس</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="concept-panel" id="c3">
                        <p><strong>المخلوط المتجانس (المحلول):</strong> يبدو مادة واحدة، لا يمكن رؤية مكوناته، وتركيبه متساوٍ ولا يترسب. مثل: الماء والملح، الماء والسكر، الهواء.</p>
                        <p><strong>المخلوط غير المتجانس:</strong> يمكن رؤية مكوناته، وتوزيع المواد فيه غير منتظم، ويمكن فصلها بسهولة غالبًا. مثل: الرمل والماء، الزيت والماء، برادة الحديد والرمل.</p>
                    </div>
                </div>

                <div class="concept-item">
                    <button type="button" class="concept-toggle" data-concept="c4">
                        <span class="concept-title"><i class="fas fa-table-list concept-icon"></i> خصائص المواد الخمس المستخدمة في هذه التجربة</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="concept-panel" id="c4">
                        <div class="concept-properties-list" id="conceptPropertiesTable"></div>
                    </div>
                </div>
            </section>
        </div>

        <div class="side-panel">

            <div class="control-card">
                <div class="card-title"><i class="fas fa-toolbox"></i> <span id="toolsCardTitle">أدوات الفصل</span></div>
                <div class="tool-grid" id="toolGrid"></div>
                <button type="button" class="btn-continue" id="btnContinue"></button>
            </div>

            <div class="control-card" id="infoCard">
                <div class="card-title"><i class="fas fa-circle-info"></i> لماذا هذه الأداة؟</div>
                <div class="info-tabs">
                    <button type="button" class="info-tab active" data-tab="hint">تلميح</button>
                    <button type="button" class="info-tab" data-tab="fact">حقيقة علمية</button>
                </div>
                <div class="info-panel active" data-panel="hint" id="hintPanelText"></div>
                <div class="info-panel" data-panel="fact" id="factPanelText"></div>
                <div class="property-chip" id="propertyChip" style="visibility:hidden;"><i class="fas fa-atom"></i> الخاصية</div>
            </div>

            <div class="control-card">
                <div class="card-title"><i class="fas fa-clock-rotate-left"></i> سجل المحاولات</div>
                <div class="attempts-log-list" id="attemptsLog"></div>
            </div>

            <div class="control-card">
                <div class="card-title"><i class="fas fa-list-check"></i> تقدّمك</div>
                <div class="progress-list" id="progressList"></div>
            </div>

        </div>
    </div>

    <!-- مرحلة التقييم -->
    <section class="stage" id="stage-quiz">
        <div class="stage-heading">
            <div class="stage-tag"><i class="fas fa-clipboard-check"></i> تقييم ختامي</div>
            <h1 class="stage-title">اختبر فهمك</h1>
        </div>
        <div class="quiz-card">
            <div class="quiz-progress" id="quizProgress"></div>
            <div class="quiz-question" id="quizQuestion"></div>
            <div class="quiz-options" id="quizOptions"></div>
        </div>
    </section>

    <!-- مرحلة النتيجة النهائية -->
    <section class="stage" id="stage-complete">
        <div class="complete-card">
            <div class="complete-icon"><i class="fas fa-trophy"></i></div>
            <div class="complete-score" id="completeScore">0 / 0</div>
            <div class="complete-label">نتيجتك في التقييم الختامي</div>
            <a href="../my-experiments.php" class="btn-restart"><i class="fas fa-arrow-right"></i> العودة إلى التجارب</a>
        </div>
    </section>

    <script src="../js/experiments/separation.js?v=15"></script>
    <script>
        window.WATERMARK_USER = {
            name: <?=json_encode($user_name)?>,
            contact: <?=json_encode($user_contact)?>
        };
    </script>
    <script src="../js/watermark.js?v=<?=time()?>"></script>
</body>
</html>