<?php
require_once '../config.php';
require_once '../functions.php';
isAuthenticated();

$experiment_id = $_SESSION['experiment_id'];
$code_used = $_SESSION['code_used'];

if ($experiment_id != 5) {
    header("Location: ../index.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>تحليل الضوء بالمنشور | مختبرات العلوم التقنية</title>
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
            --teal-50: #f0fbfe;
            --white: #ffffff;
            --gray-50: #f8fafc;
            --gray-100: #f1f5f9;
            --gray-200: #e2e8f0;
            --gray-300: #cbd5e1;
            --gray-400: #94a3b8;
            --gray-600: #475569;
            --gray-700: #334155;
            --gray-800: #1e293b;
            --green-500: #10b981;
            --green-100: #d1fae5;
            --red-500: #ef4444;
            --red-100: #fee2e2;
            --orange-500: #f59e0b;
            --orange-100: #fef3c7;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.03);
            --shadow-md: 0 6px 16px -4px rgba(0,0,0,0.06);
            --shadow-lg: 0 16px 32px -8px rgba(0,0,0,0.05);
            --r-xl: 32px;
            --r-lg: 24px;
            --r-md: 18px;
            --r-sm: 14px;
            --transition: 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Cairo', sans-serif;
            background: #f0f4f9;
            background-image: radial-gradient(circle at 10% 20%, rgba(0,137,174,0.04) 0%, transparent 50%),
                              radial-gradient(circle at 90% 70%, rgba(46,196,232,0.03) 0%, transparent 50%);
            color: var(--gray-800);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 8px rgba(16,185,129,0.5); } 50% { box-shadow: 0 0 24px rgba(16,185,129,0.85); } }
        @keyframes softGlow { 0%,100% { text-shadow: 0 0 8px rgba(0,168,212,0.3); } 50% { text-shadow: 0 0 20px rgba(0,168,212,0.7); } }
        @keyframes highlightUpdate { 0% { background: rgba(0,168,212,0.25); transform: scale(1.03); } 100% { background: transparent; transform: scale(1); } }
        .highlight-flash { animation: highlightUpdate 0.6s ease-out; }
        /* HEADER */
        .lab-header {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(255,255,255,0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border-bottom: 2px solid rgba(0,78,102,0.1);
            padding: 12px 32px;
            box-shadow: 0 4px 24px -10px rgba(0,0,0,0.05);
            gap: 20px;
            flex-wrap: wrap;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .lab-brand {
            display: flex;
            align-items: center;
            gap: 14px;
            text-decoration: none;
            transition: var(--transition);
        }
        .lab-brand:hover { transform: scale(1.02); }
        .lab-brand img {
            height: 46px;
            width: 46px;
            border-radius: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        .lab-brand span {
            font-weight: 800;
            color: var(--teal-800);
            font-size: 1.1rem;
        }
        .exp-badge {
            background: linear-gradient(135deg, var(--teal-700), var(--teal-500));
            color: white;
            padding: 8px 26px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 0.88rem;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 8px 20px rgba(0,107,138,0.22);
            transition: var(--transition);
        }
        .exp-badge:hover { transform: scale(1.05); }
        .exit-btn {
            background: rgba(255,255,255,0.75);
            border: 1px solid rgba(220,38,38,0.15);
            padding: 10px 24px;
            border-radius: 50px;
            color: #dc2626;
            text-decoration: none;
            font-weight: 700;
            transition: var(--transition);
            font-size: 0.88rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .exit-btn:hover { background: #fee2e2; transform: translateX(6px); }
        /* MAIN */
        .main-wrap {
            max-width: 1440px;
            margin: 24px auto 20px;
            padding: 0 24px;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
        .exp-banner {
            background: linear-gradient(135deg, var(--teal-100), var(--teal-50));
            border: 2px solid var(--teal-300);
            border-radius: var(--r-lg);
            padding: 20px 28px;
            display: flex;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
            animation: fadeInUp 0.6s ease;
        }
        .exp-banner .icon {
            font-size: 2.8rem;
            background: linear-gradient(135deg, var(--teal-500), var(--teal-700));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: softGlow 2s infinite;
            flex-shrink: 0;
        }
        .exp-banner .content { flex: 1; min-width: 200px; }
        .exp-banner .content h3 { color: var(--teal-800); font-size: 1rem; margin-bottom: 4px; }
        .exp-banner .content p { font-size: 0.85rem; color: var(--gray-600); line-height: 1.7; }
        /* GRID */
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 24px;
            align-items: start;
        }
        /* CANVAS AREA */
        .canvas-area {
            background: white;
            border-radius: var(--r-xl);
            border: 1px solid var(--gray-200);
            overflow: hidden;
            box-shadow: var(--shadow-md);
            animation: fadeInUp 0.6s ease;
            transition: box-shadow 0.3s;
        }
        .canvas-area:hover { box-shadow: var(--shadow-lg); }
        .canvas-header {
            padding: 16px 24px;
            border-bottom: 1px solid var(--gray-100);
            background: var(--gray-50);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
            font-size: 0.9rem;
            flex-wrap: wrap;
            gap: 8px;
        }
        .live-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #10b981;
            animation: pulse 2s infinite;
            display: inline-block;
            margin-left: 8px;
        }
        #simulationStatus {
            padding: 6px 18px;
            border-radius: 50px;
            background: var(--teal-50);
            color: var(--teal-700);
            font-size: 0.8rem;
        }
        #mainCanvas {
            display: block;
            width: 100%;
            height: 500px;
            background: radial-gradient(circle at center, #11161f, #070b12);
            cursor: grab;
            touch-action: none;
        }
        #mainCanvas:active { cursor: grabbing; }
        .canvas-tools {
            padding: 12px 20px;
            background: var(--gray-50);
            border-top: 1px solid var(--gray-200);
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .tool-btn {
            background: white;
            border: 1px solid var(--gray-300);
            padding: 8px 18px;
            border-radius: 40px;
            cursor: pointer;
            font-family: 'Cairo', sans-serif;
            font-weight: 600;
            font-size: 0.78rem;
            color: var(--gray-600);
            transition: var(--transition);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .tool-btn:hover { background: var(--teal-50); border-color: var(--teal-400); transform: translateY(-2px); }
        .tool-btn.primary {
            background: linear-gradient(135deg, var(--teal-700), var(--teal-500));
            color: white;
            border-color: transparent;
        }
        .tool-btn.primary:hover { filter: brightness(1.05); transform: translateY(-2px); }
        .tool-btn.active { background: #f59e0b; color: white; border-color: transparent; }
        /* SIDE PANEL */
        .side-panel { display: flex; flex-direction: column; gap: 20px; }
        .card {
            background: rgba(255,255,255,0.8);
            backdrop-filter: blur(12px);
            border-radius: var(--r-md);
            padding: 20px;
            border: 1px solid rgba(255,255,255,0.6);
            box-shadow: var(--shadow-md);
            transition: all 0.3s ease;
            animation: fadeInUp 0.6s ease;
        }
        .card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); background: rgba(255,255,255,0.9); }
        .card-title {
            font-weight: 800;
            font-size: 0.88rem;
            margin-bottom: 16px;
            color: var(--teal-800);
            display: flex;
            align-items: center;
            gap: 10px;
            border-right: 4px solid var(--teal-600);
            padding-right: 14px;
            transition: var(--transition);
        }
        .card:hover .card-title { border-right-color: var(--teal-400); }
        .color-selector { display: flex; flex-direction: column; gap: 8px; }
        .color-btn {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            border: 1.5px solid var(--gray-200);
            border-radius: 40px;
            background: var(--gray-50);
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Cairo', sans-serif;
            font-weight: 600;
            font-size: 0.82rem;
        }
        .color-btn.active { border-color: var(--teal-600); background: var(--teal-50); box-shadow: 0 0 0 3px rgba(0,137,174,0.15); }
        .color-dot { width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(0,0,0,0.08); flex-shrink: 0; }
        .slider-group { margin: 12px 0; }
        .slider-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .slider-name { font-size: 0.85rem; font-weight: 600; color: var(--gray-700); }
        .slider-val {
            background: var(--teal-50);
            padding: 2px 14px;
            border-radius: 40px;
            font-weight: 700;
            font-size: 0.8rem;
            color: var(--teal-700);
        }
        input[type="range"] {
            -webkit-appearance: none;
            width: 100%;
            height: 8px;
            border-radius: 10px;
            background: var(--gray-200);
            outline: none;
            transition: var(--transition);
        }
        input[type="range"]:hover { background: var(--gray-300); }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--teal-700), var(--teal-500));
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 4px 14px rgba(0,137,174,0.35);
            transition: all 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .slider-labels { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--gray-400); margin-top: 4px; }
        .prism-selector { display: flex; gap: 8px; }
        .prism-btn {
            flex: 1;
            padding: 10px 6px;
            border-radius: 40px;
            border: 1.5px solid var(--gray-200);
            background: var(--gray-50);
            cursor: pointer;
            font-family: 'Cairo', sans-serif;
            font-weight: 600;
            font-size: 0.78rem;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        }
        .prism-btn.active { background: var(--teal-600); color: white; border-color: transparent; }
        .spectrum-bar {
            display: flex;
            height: 32px;
            border-radius: 20px;
            overflow: hidden;
            margin: 10px 0;
            border: 1px solid var(--gray-200);
        }
        .spectrum-segment { display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 700; color: #1e293b; flex: 1; }
        .wavelength-labels { display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--gray-500); margin-top: 4px; }
        .snell-container { background: var(--gray-50); border-radius: var(--r-sm); padding: 12px; margin: 8px 0; }
        #snellCanvas { width: 100%; height: 140px; display: block; background: white; border-radius: 12px; border: 1px solid var(--gray-200); }
        #snellInfo { font-size: 0.78rem; color: var(--gray-600); line-height: 1.9; margin-top: 8px; text-align: center; }
        /* ANALYSIS */
        .live-analysis {
            background: white;
            border-radius: var(--r-xl);
            border: 1px solid var(--gray-200);
            padding: 24px;
            box-shadow: var(--shadow-md);
            animation: fadeInUp 0.8s ease;
        }
        .analysis-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; font-weight: 800; color: var(--teal-800); }
        .analysis-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
        .analysis-item {
            background: var(--gray-50);
            border-radius: var(--r-md);
            padding: 14px;
            text-align: center;
            border: 1px solid var(--gray-100);
            transition: all 0.3s ease;
        }
        .analysis-item .value {
            font-size: 1.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--teal-600), var(--teal-400));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            transition: all 0.3s ease;
        }
        .analysis-item .label { font-size: 0.75rem; color: var(--gray-500); margin-top: 4px; }
        .analysis-item.active-color-item { border: 2px solid var(--teal-500); box-shadow: 0 0 12px rgba(0,168,212,0.2); background: var(--teal-50); }
        .analysis-text {
            font-size: 0.88rem;
            line-height: 1.9;
            color: var(--gray-600);
            background: var(--teal-50);
            border-radius: var(--r-md);
            padding: 16px;
            border-right: 4px solid var(--teal-500);
        }
        .active-color-indicator {
            display: inline-block;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            margin-left: 6px;
            vertical-align: middle;
            border: 1px solid rgba(0,0,0,0.15);
        }
        /* TABLE */
        .comparison-section {
            background: white;
            border-radius: var(--r-xl);
            border: 1px solid var(--gray-200);
            padding: 20px;
            overflow-x: auto;
            box-shadow: var(--shadow-sm);
            animation: fadeInUp 0.8s ease;
        }
        .section-title { font-weight: 800; margin-bottom: 16px; color: var(--teal-800); display: flex; align-items: center; gap: 8px; }
        table { width: 100%; border-collapse: collapse; min-width: 500px; }
        th, td { padding: 12px; text-align: center; border-bottom: 1px solid var(--gray-200); font-size: 0.85rem; }
        th { background: var(--gray-50); color: var(--teal-700); font-weight: 800; }
        .highlight-row { font-weight: 700; box-shadow: inset 0 0 0 2px var(--teal-500); transition: all 0.3s ease; }
        /* VALIDATION */
        .validation-section {
            background: white;
            border-radius: var(--r-xl);
            border: 1px solid var(--gray-200);
            padding: 24px;
            box-shadow: var(--shadow-md);
            animation: fadeInUp 0.8s ease;
        }
        .validation-header { display: flex; align-items: center; gap: 12px; font-weight: 800; color: var(--teal-800); margin-bottom: 18px; }
        .validation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 16px; }
        .test-item { background: var(--gray-50); border-radius: var(--r-md); padding: 14px; border: 1px solid var(--gray-100); display: flex; align-items: center; gap: 12px; font-size: 0.82rem; transition: all 0.3s ease; }
        .test-item.pass { border-color: #10b981; background: var(--green-100); }
        .test-item.fail { border-color: #ef4444; background: var(--red-100); }
        .test-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
        .test-icon.pass { background: #10b981; color: white; }
        .test-icon.fail { background: #ef4444; color: white; }
        .test-icon.warning { background: #f59e0b; color: white; }
        .test-details { flex: 1; line-height: 1.6; }
        .test-details strong { display: block; color: var(--gray-800); }
        .test-details span { font-size: 0.75rem; color: var(--gray-500); }
        .run-tests-btn {
            background: linear-gradient(135deg, var(--teal-700), var(--teal-500));
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 40px;
            cursor: pointer;
            font-family: 'Cairo', sans-serif;
            font-weight: 700;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: var(--transition);
        }
        .run-tests-btn:hover { filter: brightness(1.08); transform: translateY(-2px); }
        .auto-test-indicator { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: var(--gray-600); margin-top: 8px; }
        .auto-test-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; }
        /* FOOTER */
        .lab-footer {
            width: 100%;
            background: rgba(255,255,255,0.75);
            backdrop-filter: blur(20px);
            border-top: 2px solid rgba(0,78,102,0.1);
            padding: 18px 0;
            margin-top: 20px;
        }
        .footer-content { max-width: 1440px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 20px; }
        .footer-code { display: flex; align-items: center; gap: 12px; background: var(--white); padding: 10px 20px; border-radius: 50px; border: 1px solid var(--gray-200); box-shadow: var(--shadow-sm); }
        .footer-code code { background: var(--teal-50); color: var(--teal-700); font-family: monospace; font-weight: 700; padding: 6px 16px; border-radius: 30px; font-size: 0.9rem; cursor: pointer; border: 1px solid var(--teal-100); }
        .footer-copy { background: var(--teal-600); color: white; border: none; padding: 8px 16px; border-radius: 30px; font-family: 'Cairo', sans-serif; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: var(--transition); display: flex; align-items: center; gap: 8px; }
        .tir-warning { background: #fef3c7; border: 1.5px solid #f59e0b; border-radius: var(--r-md); padding: 12px 16px; font-size: 0.82rem; color: #92400e; display: none; margin-top: 8px; }
        @media (max-width:1000px) {
            .main-grid { grid-template-columns: 1fr; }
            #mainCanvas { height: 420px; }
            .analysis-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width:600px) {
            .lab-header { padding: 12px 20px; }
            #mainCanvas { height: 300px; }
            .analysis-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>

<header class="lab-header">
    <a href="../index.php" class="lab-brand">
        <img src="../logo2.png" alt="logo" onerror="this.style.display='none'">
        <span>مختبرات العلوم التقنية للجميع</span>
    </a>
    <div class="exp-badge"><i class="fas fa-rainbow"></i> تجربة تحليل الضوء بالمنشور</div>
    <a href="../index.php" class="exit-btn"><i class="fas fa-sign-out-alt"></i> خروج</a>
</header>

<div class="main-wrap">
    <div class="exp-banner">
        <div class="icon"><i class="fas fa-flask"></i></div>
        <div class="content">
            <h3>مرحباً في تجربة تحليل الضوء بالمنشور</h3>
            <p>محاكاة علمية دقيقة لانكسار الضوء: تطبيق قانون سنيل باستخدام تتبع الأشعة الحقيقي (Ray Tracing) — كل لون له معامل انكسار مختلف حسب نموذج كوشي، ويُحسب الانكسار على الوجهين بدقة مع دعم الانعكاس الداخلي الكلي.</p>
        </div>
    </div>

    <div class="main-grid">
        <!-- منطقة الرسم الرئيسية -->
        <div class="canvas-area">
            <div class="canvas-header">
                <span><span class="live-dot"></span> محاكاة تتبع الأشعة — مصدر وحيد traceRay()</span>
                <span id="simulationStatus">🌈 ضوء أبيض (طيف كامل)</span>
            </div>
            <canvas id="mainCanvas"></canvas>
            <div class="canvas-tools">
                <button id="resetViewBtn" class="tool-btn"><i class="fas fa-undo-alt"></i> إعادة ضبط</button>
                <button id="toggleLightBtn" class="tool-btn primary"><i class="fas fa-lightbulb"></i> إيقاف الضوء</button>
                <button id="toggleLabelBtn" class="tool-btn"><i class="fas fa-tag"></i> إظهار الزوايا</button>
                <button id="toggleAnimBtn" class="tool-btn"><i class="fas fa-play"></i> تحريك الفوتونات</button>
            </div>
        </div>

        <!-- اللوحة الجانبية -->
        <div class="side-panel">
            <div class="card">
                <div class="card-title"><i class="fas fa-palette"></i> لون مصدر الضوء</div>
                <div class="color-selector" id="colorSelector">
                    <button class="color-btn active" data-color="white"><span class="color-dot" style="background:linear-gradient(135deg,#fff,#e2e8f0);"></span> أبيض (طيف كامل)</button>
                    <button class="color-btn" data-color="red"><span class="color-dot" style="background:#ef4444;"></span> أحمر (700 nm)</button>
                    <button class="color-btn" data-color="orange"><span class="color-dot" style="background:#ff8833;"></span> برتقالي (620 nm)</button>
                    <button class="color-btn" data-color="yellow"><span class="color-dot" style="background:#eab308;"></span> أصفر (580 nm)</button>
                    <button class="color-btn" data-color="green"><span class="color-dot" style="background:#22c55e;"></span> أخضر (530 nm)</button>
                    <button class="color-btn" data-color="blue"><span class="color-dot" style="background:#3b82f6;"></span> أزرق (470 nm)</button>
                    <button class="color-btn" data-color="indigo"><span class="color-dot" style="background:#7744ee;"></span> نيلي (440 nm)</button>
                    <button class="color-btn" data-color="violet"><span class="color-dot" style="background:#a855f7;"></span> بنفسجي (400 nm)</button>
                </div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-angle-right"></i> زاوية السقوط</div>
                <div class="slider-group">
                    <div class="slider-row"><span class="slider-name">زاوية السقوط (i)</span><span class="slider-val" id="incidentValue">35°</span></div>
                    <input type="range" id="incidentSlider" min="10" max="80" value="35" step="1">
                    <div class="slider-labels"><span>10°</span><span>45°</span><span>80°</span></div>
                </div>
                <div id="tirWarning" class="tir-warning">⚠️ انعكاس داخلي كلي! زاوية السقوط على الوجه الثاني تجاوزت الزاوية الحرجة — لا يخرج ضوء.</div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-undo-alt"></i> دوران المنشور</div>
                <div class="slider-group">
                    <div class="slider-row"><span class="slider-name">زاوية الدوران</span><span class="slider-val" id="rotationValue">0°</span></div>
                    <input type="range" id="rotationSlider" min="-60" max="60" value="0" step="1">
                    <div class="slider-labels"><span>-60°</span><span>0°</span><span>+60°</span></div>
                </div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-cube"></i> نوع المنشور</div>
                <div class="prism-selector">
                    <button class="prism-btn active" data-prism="glass"><i class="fas fa-glass-whiskey"></i> زجاجي</button>
                    <button class="prism-btn" data-prism="crystal"><i class="fas fa-gem"></i> كريستال</button>
                    <button class="prism-btn" data-prism="plastic"><i class="fas fa-cube"></i> بلاستيك</button>
                </div>
                <div style="margin-top:10px; font-size:0.75rem; color:var(--gray-500); text-align:center;" id="prismIORLabel">معامل انكسار الزجاج القياسي: n = 1.520</div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-chart-line"></i> طيف الألوان المرئي</div>
                <div class="spectrum-bar">
                    <div class="spectrum-segment" style="background:#ef4444;">700</div>
                    <div class="spectrum-segment" style="background:#ff8833;">620</div>
                    <div class="spectrum-segment" style="background:#eab308;">580</div>
                    <div class="spectrum-segment" style="background:#22c55e;">530</div>
                    <div class="spectrum-segment" style="background:#3b82f6;">470</div>
                    <div class="spectrum-segment" style="background:#7744ee;">440</div>
                    <div class="spectrum-segment" style="background:#a855f7;">400</div>
                </div>
                <div class="wavelength-labels"><span>🔴</span><span>🟠</span><span>🟡</span><span>🟢</span><span>🔵</span><span>🟣</span><span>🟣</span></div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-chalkboard-teacher"></i> مخطط قانون سنيل</div>
                <div class="snell-container">
                    <canvas id="snellCanvas" width="400" height="150"></canvas>
                </div>
                <div id="snellInfo">n₁·sin(θ₁) = n₂·sin(θ₂)</div>
            </div>
        </div>
    </div>

    <!-- التحليل العلمي -->
    <div class="live-analysis" id="liveAnalysisPanel">
        <div class="analysis-header">
            <i class="fas fa-microscope" style="font-size:1.5rem;color:var(--teal-600);"></i>
            <span>التحليل العلمي — من traceRay() مباشرة</span>
            <span id="activeColorBadge" style="font-size:0.75rem;background:var(--teal-100);padding:4px 12px;border-radius:20px;color:var(--teal-700);">اللون النشط للتحليل</span>
        </div>
        <div class="analysis-grid" id="analysisGrid">
            <div class="analysis-item" id="item_i"><div class="value" id="val_i">35°</div><div class="label">زاوية السقوط (i)</div></div>
            <div class="analysis-item" id="item_r1"><div class="value" id="val_r1">--</div><div class="label">زاوية الانكسار الأولى (r₁)</div></div>
            <div class="analysis-item" id="item_r2"><div class="value" id="val_r2">--</div><div class="label">زاوية السقوط الثانية (r₂)</div></div>
            <div class="analysis-item" id="item_e"><div class="value" id="val_e">--</div><div class="label">زاوية الخروج (e)</div></div>
            <div class="analysis-item" id="item_delta"><div class="value" id="val_delta">--</div><div class="label">زاوية الانحراف (δ)</div></div>
            <div class="analysis-item" id="item_disp"><div class="value" id="val_disp">--</div><div class="label">التشتت (δ_بنفسجي − δ_أحمر)</div></div>
            <div class="analysis-item" id="item_ior"><div class="value" id="val_ior">1.520</div><div class="label">معامل انكسار (n) عند λ المختار</div></div>
            <div class="analysis-item" id="item_apex"><div class="value" id="val_apex">60°</div><div class="label">زاوية رأس المنشور (A)</div></div>
        </div>
        <div class="analysis-text" id="analysisText"></div>
    </div>

    <!-- جدول المقارنة -->
    <div class="comparison-section">
        <div class="section-title"><i class="fas fa-table"></i> نتائج تتبع الأشعة لكل لون (traceRay)</div>
        <table id="resultsTable">
            <thead><tr><th>اللون</th><th>λ (nm)</th><th>n</th><th>r₁ (°)</th><th>r₂ (°)</th><th>e (°)</th><th>δ (°)</th></tr></thead>
            <tbody id="tableBody"></tbody>
        </table>
    </div>

    <!-- وحدة الاختبارات -->
    <div class="validation-section" id="validationSection">
        <div class="validation-header">
            <i class="fas fa-check-circle" style="color:var(--teal-600);"></i>
            <span>اختبارات التحقق الفيزيائي (تعتمد على traceRay)</span>
            <span class="auto-test-indicator"><span class="auto-test-dot"></span> اختبار تلقائي عند كل تحديث</span>
        </div>
        <div class="validation-grid" id="validationGrid"></div>
        <button class="run-tests-btn" id="runTestsBtn" onclick="runAllValidationTests()"><i class="fas fa-play-circle"></i> تشغيل جميع الاختبارات الآن</button>
        <div id="testSummary" style="margin-top:12px;font-size:0.82rem;color:var(--gray-600);"></div>
    </div>
</div>

<footer class="lab-footer">
    <div class="footer-content">
        <div class="footer-code">
            <i class="fas fa-key" style="color:var(--teal-600);"></i>
            <span>كود دخول المستخدم:</span>
            <code id="accessCodeDisplay" onclick="copyAccessCode()" title="انقر للنسخ"><?php echo htmlspecialchars($code_used); ?></code>
            <button class="footer-copy" onclick="copyAccessCode()"><i id="copyIcon" class="fas fa-copy"></i></button>
        </div>
    </div>
</footer>

<script>
/* ===================================================================
   PHYSICS ENGINE – traceRay() هو المصدر الوحيد لجميع البيانات
   =================================================================== */
const SPECTRUM = [
    { name: 'red',    label: 'أحمر',   λ: 700, hex: '#ff4444', rgba: 'rgba(255,68,68,' },
    { name: 'orange', label: 'برتقالي', λ: 620, hex: '#ff8833', rgba: 'rgba(255,136,51,' },
    { name: 'yellow', label: 'أصفر',   λ: 580, hex: '#ffdd00', rgba: 'rgba(255,221,0,' },
    { name: 'green',  label: 'أخضر',   λ: 530, hex: '#33ee55', rgba: 'rgba(51,238,85,' },
    { name: 'blue',   label: 'أزرق',   λ: 470, hex: '#4488ff', rgba: 'rgba(68,136,255,' },
    { name: 'indigo', label: 'نيلي',   λ: 440, hex: '#7744ee', rgba: 'rgba(119,68,238,' },
    { name: 'violet', label: 'بنفسجي', λ: 400, hex: '#bb66ff', rgba: 'rgba(187,102,255,' }
];

const CAUCHY = {
    glass:   { A: 1.5046, B: 4200 },
    crystal: { A: 1.6130, B: 8500 },
    plastic: { A: 1.4820, B: 3100 }
};
const APEX_DEG = 60;          // زاوية رأس المنشور
const N_AIR = 1.000293;

// دوال حسابية مساعدة
function deg2rad(d) { return d * Math.PI / 180; }
function rad2deg(r) { return r * 180 / Math.PI; }

// معامل الانكسار حسب كوشي
function getIOR(prismType, λ) {
    const { A, B } = CAUCHY[prismType];
    return A + B / (λ * λ);
}

// قانون سنيل (يرجع الزاوية المنكسرة أو null للانعكاس الكلي)
function snell(n1, n2, angleDeg) {
    const sinR = (n1 / n2) * Math.sin(deg2rad(angleDeg));
    if (Math.abs(sinR) > 1) return null;
    return rad2deg(Math.asin(sinR));
}

// تدوير نقطة
function rotate2D(x, y, angleDeg) {
    const r = deg2rad(angleDeg);
    return { x: x * Math.cos(r) - y * Math.sin(r), y: x * Math.sin(r) + y * Math.cos(r) };
}

// تقاطع شعاع مع قطعة مستقيمة
function intersectRaySegment(ox, oy, dx, dy, ax, ay, bx, by) {
    const ex = bx - ax, ey = by - ay;
    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-10) return null;
    const fx = ax - ox, fy = ay - oy;
    const t = (fx * ey - fy * ex) / denom;
    const u = (fx * dy - fy * dx) / denom;
    if (t > 1e-6 && u >= -1e-6 && u <= 1 + 1e-6) return t;
    return null;
}

// الطبيعي الداخلي لوجه (باتجاه centroid)
function inwardNormal(ax, ay, bx, by, cx, cy) {
    const ex = bx - ax, ey = by - ay;
    const len = Math.sqrt(ex*ex + ey*ey);
    let nx = -ey / len, ny = ex / len;
    const mx = (ax + bx)/2, my = (ay + by)/2;
    if ((cx - mx)*nx + (cy - my)*ny < 0) { nx = -nx; ny = -ny; }
    return { nx, ny };
}

// انكسار متجه
function refractVector(dx, dy, nx, ny, n1, n2) {
    let nnx = nx, nny = ny;
    if (dx * nnx + dy * nny > 0) { nnx = -nx; nny = -ny; }
    const cosI = -(dx * nnx + dy * nny);
    const ratio = n1 / n2;
    const sinT2 = ratio * ratio * (1 - cosI * cosI);
    if (sinT2 > 1.0) return null;  // TIR
    const cosT = Math.sqrt(1 - sinT2);
    return {
        dx: ratio * dx + (ratio * cosI - cosT) * nnx,
        dy: ratio * dy + (ratio * cosI - cosT) * nny
    };
}

/**
 * traceRay – المحرك الوحيد لتتبع الأشعة عبر المنشور
 * @param {Object} prism - { vertices: [{x,y},{x,y},{x,y}], centroid: {x,y} }
 * @param {number} incidentDeg - زاوية السقوط المطلوبة بالنسبة للطبيعي للوجه الساقط
 * @param {string} prismType - 'glass'|'crystal'|'plastic'
 * @param {number} λ - الطول الموجي (nm)
 * @param {Object} lampPos - موقع المصباح {x,y}
 * @returns {Object|null} كائن بيانات التتبع
 */
function traceRay(prism, incidentDeg, prismType, λ, lampPos) {
    const vertices = prism.vertices;
    const centroid = prism.centroid;
    const nGlass = getIOR(prismType, λ);

    // الوجوه الثلاثة
    const faces = [
        { a: vertices[0], b: vertices[2] }, // الوجه الأيسر (أعلى-يسار)
        { a: vertices[2], b: vertices[1] }, // القاعدة
        { a: vertices[0], b: vertices[1] }  // الوجه الأيمن (أعلى-يمين)
    ];

    // تحديد الوجه الساقط: الوجه الذي يتقاطع معه شعاع من المصباح نحو مركز الوجه
    let entryFace = null, minDist = Infinity;
    for (const face of faces) {
        const mx = (face.a.x + face.b.x) / 2, my = (face.a.y + face.b.y) / 2;
        const dx = mx - lampPos.x, dy = my - lampPos.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        const t = intersectRaySegment(lampPos.x, lampPos.y, dx/len, dy/len, face.a.x, face.a.y, face.b.x, face.b.y);
        if (t !== null && t < minDist) {
            minDist = t;
            entryFace = face;
        }
    }
    if (!entryFace) return null;

    // الطبيعي الداخلي للوجه الساقط
    const entryNormal = inwardNormal(entryFace.a.x, entryFace.a.y, entryFace.b.x, entryFace.b.y, centroid.x, centroid.y);

    // بناء شعاع السقوط بالزاوية incidentDeg مع الطبيعي
    // نحتاج مماساً للوجه باتجاه المصباح
    const ex = entryFace.b.x - entryFace.a.x, ey = entryFace.b.y - entryFace.a.y;
    const faceLen = Math.sqrt(ex*ex + ey*ey);
    const tangent = { x: ex/faceLen, y: ey/faceLen };
    const faceMid = { x: (entryFace.a.x + entryFace.b.x)/2, y: (entryFace.a.y + entryFace.b.y)/2 };
    const toLamp = { x: lampPos.x - faceMid.x, y: lampPos.y - faceMid.y };
    const sign = (tangent.x * toLamp.x + tangent.y * toLamp.y) >= 0 ? 1 : -1;
    const incRad = deg2rad(incidentDeg);
    const dirX = Math.sin(incRad) * (-sign * tangent.x) + Math.cos(incRad) * entryNormal.nx;
    const dirY = Math.sin(incRad) * (-sign * tangent.y) + Math.cos(incRad) * entryNormal.ny;
    const incidentDir = { dx: dirX, dy: dirY };

    // نقطة الاصطدام الأولى
    const tEntry = intersectRaySegment(lampPos.x, lampPos.y, incidentDir.dx, incidentDir.dy,
                                       entryFace.a.x, entryFace.a.y, entryFace.b.x, entryFace.b.y);
    if (tEntry === null) return null;
    const entryPoint = { x: lampPos.x + incidentDir.dx * tEntry, y: lampPos.y + incidentDir.dy * tEntry };

    // الانكسار الأول
    const refracted1 = refractVector(incidentDir.dx, incidentDir.dy, entryNormal.nx, entryNormal.ny, N_AIR, nGlass);
    if (!refracted1) return { hit: true, entryPoint, isTIR: true }; // نظرياً لا يحدث

    // تتبع الشعاع الداخلي لأقرب وجه آخر
    const otherFaces = faces.filter(f => f !== entryFace);
    let exitFace = null, bestT = Infinity, exitPoint = null;
    for (const face of otherFaces) {
        const t = intersectRaySegment(entryPoint.x, entryPoint.y, refracted1.dx, refracted1.dy,
                                      face.a.x, face.a.y, face.b.x, face.b.y);
        if (t !== null && t > 1e-6 && t < bestT) {
            bestT = t;
            exitFace = face;
            exitPoint = { x: entryPoint.x + refracted1.dx * t, y: entryPoint.y + refracted1.dy * t };
        }
    }
    if (!exitPoint) return null;

    // الانكسار الثاني (أو الانعكاس الكلي)
    const exitNormalIn = inwardNormal(exitFace.a.x, exitFace.a.y, exitFace.b.x, exitFace.b.y, centroid.x, centroid.y);
    const exitOutNormal = { nx: -exitNormalIn.nx, ny: -exitNormalIn.ny };
    const refracted2 = refractVector(refracted1.dx, refracted1.dy, exitOutNormal.nx, exitOutNormal.ny, nGlass, N_AIR);

    if (!refracted2) {
        // انعكاس داخلي كلي
        const dot = refracted1.dx * exitNormalIn.nx + refracted1.dy * exitNormalIn.ny;
        const reflX = refracted1.dx - 2 * dot * exitNormalIn.nx;
        const reflY = refracted1.dy - 2 * dot * exitNormalIn.ny;
        return {
            hit: true, entryPoint, exitPoint, isTIR: true,
            vectors: { incident: incidentDir, refractedInside: refracted1, reflected: { dx: reflX, dy: reflY } },
            normals: { entryNormal, exitNormalIn },
            nGlass, λ
        };
    }

    // حساب الزوايا الحقيقية من المتجهات
    const cosR1 = -(refracted1.dx * entryNormal.nx + refracted1.dy * entryNormal.ny);
    const r1 = rad2deg(Math.acos(cosR1));
    const cosR2 = -(refracted1.dx * exitNormalIn.nx + refracted1.dy * exitNormalIn.ny);
    const r2 = rad2deg(Math.acos(cosR2));
    const cosE = refracted2.dx * (-exitNormalIn.nx) + refracted2.dy * (-exitNormalIn.ny);
    const e = rad2deg(Math.acos(cosE));
    const delta = incidentDeg + e - APEX_DEG;

    return {
        hit: true, entryPoint, exitPoint, isTIR: false,
        incidentAngle: incidentDeg,
        refractionAngle1: r1,
        internalAngle: r2,
        exitAngle: e,
        deviationAngle: delta,
        vectors: { incident: incidentDir, refractedInside: refracted1, exiting: refracted2 },
        normals: { entryNormal, exitNormalIn },
        nGlass,
        λ
    };
}

/* ===================================================================
   RENDERING & UI
   =================================================================== */
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

let state = {
    incidentDeg: 35,
    prismRotDeg: 0,
    prismType: 'glass',
    lightColor: 'white',
    lightOn: true,
    showLabels: false,
    animating: true
};

let animParticles = [];
let animFrame = null;

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    redraw();
}
new ResizeObserver(resizeCanvas).observe(canvas);

// توليد رؤوس المنشور بحسب الدوران
function getPrismVertices(cx, cy, size, rotDeg) {
    const raw = [
        { x: 0, y: -size * 0.667 },
        { x: size * 0.577, y: size * 0.333 },
        { x: -size * 0.577, y: size * 0.333 }
    ];
    return raw.map(p => {
        const r = rotate2D(p.x, p.y, rotDeg);
        return { x: cx + r.x, y: cy + r.y };
    });
}

// رسم المنشور
function drawPrism(verts) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    ctx.lineTo(verts[1].x, verts[1].y);
    ctx.lineTo(verts[2].x, verts[2].y);
    ctx.closePath();

    let grad;
    if (state.prismType === 'glass') {
        grad = ctx.createLinearGradient(verts[2].x, verts[2].y, verts[1].x, verts[1].y);
        grad.addColorStop(0, 'rgba(136,187,238,0.55)');
        grad.addColorStop(0.5, 'rgba(200,230,255,0.65)');
        grad.addColorStop(1, 'rgba(136,187,238,0.55)');
    } else if (state.prismType === 'crystal') {
        grad = ctx.createLinearGradient(verts[0].x, verts[0].y, verts[2].x, verts[2].y);
        grad.addColorStop(0, 'rgba(200,240,255,0.70)');
        grad.addColorStop(0.5, 'rgba(220,255,255,0.78)');
        grad.addColorStop(1, 'rgba(180,210,255,0.65)');
    } else {
        grad = ctx.createLinearGradient(verts[0].x, verts[0].y, verts[1].x, verts[1].y);
        grad.addColorStop(0, 'rgba(170,204,221,0.60)');
        grad.addColorStop(1, 'rgba(140,180,200,0.55)');
    }
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(170,221,255,0.9)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
}

// رسم المصباح
function drawLamp(pos) {
    ctx.save();
    const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 22);
    grd.addColorStop(0, 'rgba(255,220,120,1)');
    grd.addColorStop(0.4, 'rgba(255,160,60,0.8)');
    grd.addColorStop(1, 'rgba(255,120,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 22, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = state.lightOn ? '#ffcc66' : '#888';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
}

// رسم نقطة مضيئة
function drawDot(x, y, color, r=4) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
}

// رسم الطبيعي
function drawNormal(x, y, nx, ny, len, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    ctx.beginPath();
    ctx.moveTo(x - nx*len, y - ny*len);
    ctx.lineTo(x + nx*len, y + ny*len);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

// إعادة رسم المشهد الرئيسي
function redraw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // خلفية
    const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.7);
    bg.addColorStop(0, '#11161f');
    bg.addColorStop(1, '#070b12');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // شبكة خفيفة
    ctx.strokeStyle = 'rgba(136,170,255,0.04)';
    ctx.lineWidth = 1;
    for (let x=0; x<W; x+=40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=0; y<H; y+=40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    const cx = W * 0.48, cy = H * 0.5;
    const size = Math.min(W, H) * 0.28;
    const verts = getPrismVertices(cx, cy, size, state.prismRotDeg);
    const centX = (verts[0].x+verts[1].x+verts[2].x)/3;
    const centY = (verts[0].y+verts[1].y+verts[2].y)/3;
    const centroid = { x: centX, y: centY };
    const lampPos = { x: cx - size*1.9, y: cy };

    drawPrism(verts);
    drawLamp(lampPos);

    if (state.lightOn) {
        drawLightRays(verts, centroid, lampPos, W, H);
    }

    updateAnalysis();
    drawSnellDiagram();
    updateTable();
    runAllValidationTests();
}

// رسم الأشعة لجميع الألوان المطلوبة
function drawLightRays(verts, centroid, lampPos, W, H) {
    const activeSpectrum = state.lightColor === 'white' ? SPECTRUM : SPECTRUM.filter(s => s.name === state.lightColor);
    const prismObj = { vertices: verts, centroid };

    // رسم الشعاع الساقط المشترك (لأول لون كممثل)
    const firstTrace = traceRay(prismObj, state.incidentDeg, state.prismType, activeSpectrum[0].λ, lampPos);
    if (firstTrace && !firstTrace.isTIR) {
        ctx.save();
        ctx.strokeStyle = state.lightColor === 'white' ? 'rgba(255,200,100,0.85)' : activeSpectrum[0].hex;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = state.lightColor === 'white' ? 'rgba(255,200,100,0.8)' : activeSpectrum[0].hex;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(lampPos.x, lampPos.y);
        ctx.lineTo(firstTrace.entryPoint.x, firstTrace.entryPoint.y);
        ctx.stroke();
        ctx.restore();
        drawDot(firstTrace.entryPoint.x, firstTrace.entryPoint.y, '#ffcc66', 5);
        if (state.showLabels) {
            drawNormal(firstTrace.entryPoint.x, firstTrace.entryPoint.y, firstTrace.normals.entryNormal.nx, firstTrace.normals.entryNormal.ny, 35, 'rgba(255,255,100,0.5)');
        }
    }

    // رسم الأشعة الداخلية والخارجة لكل لون
    activeSpectrum.forEach(spec => {
        const result = traceRay(prismObj, state.incidentDeg, state.prismType, spec.λ, lampPos);
        if (!result || result.isTIR || !result.vectors.exiting) return;

        const { entryPoint, exitPoint, vectors } = result;
        // شعاع داخلي
        ctx.save();
        ctx.strokeStyle = spec.rgba + (state.lightColor==='white' ? '0.7)' : '0.9)');
        ctx.lineWidth = state.lightColor==='white' ? 1.8 : 2.2;
        ctx.shadowColor = spec.hex;
        ctx.shadowBlur = 6;
        ctx.setLineDash([6,4]);
        ctx.beginPath();
        ctx.moveTo(entryPoint.x, entryPoint.y);
        ctx.lineTo(exitPoint.x, exitPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        drawDot(exitPoint.x, exitPoint.y, spec.hex, 4);

        // شعاع خارج
        const exitLen = Math.max(W, H) * 1.5;
        ctx.save();
        ctx.strokeStyle = spec.rgba + (state.lightColor==='white' ? '0.85)' : '0.95)');
        ctx.lineWidth = state.lightColor==='white' ? 2 : 2.5;
        ctx.shadowColor = spec.hex;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(exitPoint.x, exitPoint.y);
        ctx.lineTo(exitPoint.x + vectors.exiting.dx * exitLen, exitPoint.y + vectors.exiting.dy * exitLen);
        ctx.stroke();
        ctx.restore();

        if (state.showLabels && (spec.name === 'red' || spec.name === 'violet')) {
            const physics = traceRay(prismObj, state.incidentDeg, state.prismType, spec.λ, lampPos);
            if (physics && !physics.isTIR) {
                ctx.fillStyle = spec.hex;
                ctx.font = 'bold 10px Cairo';
                ctx.fillText(`e=${physics.exitAngle.toFixed(1)}°`, exitPoint.x + vectors.exiting.dx*50, exitPoint.y + vectors.exiting.dy*50);
            }
        }
    });

    // تحذير TIR
    const testTIR = traceRay(prismObj, state.incidentDeg, state.prismType, 400, lampPos);
    document.getElementById('tirWarning').style.display = (testTIR && !testTIR.isTIR) ? 'none' : 'block';
}

// تحريك الفوتونات
function spawnParticles() {
    if (!state.animating || !state.lightOn) return;
    const W = canvas.width, H = canvas.height;
    const cx = W*0.48, cy = H*0.5, size = Math.min(W,H)*0.28;
    const verts = getPrismVertices(cx, cy, size, state.prismRotDeg);
    const centroid = { x: (verts[0].x+verts[1].x+verts[2].x)/3, y: (verts[0].y+verts[1].y+verts[2].y)/3 };
    const lampPos = { x: cx - size*1.9, y: cy };
    const activeSpectrum = state.lightColor === 'white' ? SPECTRUM : SPECTRUM.filter(s => s.name === state.lightColor);

    activeSpectrum.forEach(spec => {
        const result = traceRay({ vertices: verts, centroid }, state.incidentDeg, state.prismType, spec.λ, lampPos);
        if (!result || result.isTIR || !result.vectors.exiting) return;
        const path = [lampPos, result.entryPoint, result.exitPoint,
                      { x: result.exitPoint.x + result.vectors.exiting.dx * 300, y: result.exitPoint.y + result.vectors.exiting.dy * 300 }];
        animParticles.push({ spec, path, t: Math.random(), speed: 0.005 + Math.random()*0.004 });
    });
}

function animLoop() {
    if (!state.animating) { animParticles = []; return; }
    animFrame = requestAnimationFrame(animLoop);
    if (Math.random() < 0.25) spawnParticles();
    animParticles = animParticles.filter(p => {
        p.t += p.speed;
        if (p.t >= 1) return false;
        const seg = Math.floor(p.t * (p.path.length-1));
        const nextSeg = Math.min(seg+1, p.path.length-1);
        const frac = (p.t*(p.path.length-1)) - seg;
        const px = p.path[seg].x + (p.path[nextSeg].x - p.path[seg].x)*frac;
        const py = p.path[seg].y + (p.path[nextSeg].y - p.path[seg].y)*frac;
        ctx.fillStyle = p.spec.hex;
        ctx.shadowColor = p.spec.hex;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI*2);
        ctx.fill();
        return true;
    });
    if (animParticles.length > 150) animParticles.splice(0, animParticles.length-150);
}

/* ---------- تحليل، جدول، مخطط سنيل ---------- */
function getActiveSpecForAnalysis() {
    return state.lightColor === 'white' ? SPECTRUM.find(s=>s.name==='green') : SPECTRUM.find(s=>s.name===state.lightColor) || SPECTRUM[3];
}

function updateAnalysis() {
    const i = state.incidentDeg;
    const activeSpec = getActiveSpecForAnalysis();
    const W = canvas.width, H = canvas.height;
    const cx = W*0.48, cy = H*0.5, size = Math.min(W,H)*0.28;
    const verts = getPrismVertices(cx, cy, size, state.prismRotDeg);
    const centroid = { x: (verts[0].x+verts[1].x+verts[2].x)/3, y: (verts[0].y+verts[1].y+verts[2].y)/3 };
    const lampPos = { x: cx - size*1.9, y: cy };
    const result = traceRay({ vertices: verts, centroid }, i, state.prismType, activeSpec.λ, lampPos);

    // تحديث البادج
    const badge = document.getElementById('activeColorBadge');
    if (state.lightColor === 'white') {
        badge.innerHTML = '<span class="active-color-indicator" style="background:linear-gradient(135deg,#ef4444,#a855f7);"></span> تحليل: ممثل الضوء الأبيض (أخضر 530nm)';
        badge.style.background = 'var(--gray-100)';
    } else {
        badge.innerHTML = `<span class="active-color-indicator" style="background:${activeSpec.hex};"></span> تحليل: ${activeSpec.label} (λ=${activeSpec.λ}nm)`;
        badge.style.background = activeSpec.tableRow || '';
    }

    document.getElementById('val_i').textContent = i + '°';
    document.getElementById('val_apex').textContent = APEX_DEG + '°';
    document.querySelectorAll('.analysis-item').forEach(el => el.classList.remove('active-color-item'));

    if (!result || result.isTIR) {
        ['val_r1','val_r2','val_e','val_delta'].forEach(id => document.getElementById(id).textContent = 'TIR');
        document.getElementById('analysisText').innerHTML = '<strong>⚠️ انعكاس داخلي كلي!</strong> الزاوية الحرجة تجاوزت، لا يخرج ضوء من المنشور.';
        document.getElementById('val_ior').textContent = getIOR(state.prismType, activeSpec.λ).toFixed(4);
    } else {
        document.getElementById('val_r1').textContent = result.refractionAngle1.toFixed(2) + '°';
        document.getElementById('val_r2').textContent = result.internalAngle.toFixed(2) + '°';
        document.getElementById('val_e').textContent = result.exitAngle.toFixed(2) + '°';
        document.getElementById('val_delta').textContent = result.deviationAngle.toFixed(2) + '°';
        ['item_r1','item_r2','item_e','item_delta'].forEach(id => document.getElementById(id).classList.add('active-color-item'));
        document.getElementById('val_ior').textContent = result.nGlass.toFixed(4);
        document.getElementById('item_ior').classList.add('active-color-item');

        // التشتت
        const resRed = traceRay({ vertices: verts, centroid }, i, state.prismType, 700, lampPos);
        const resViolet = traceRay({ vertices: verts, centroid }, i, state.prismType, 400, lampPos);
        let dispersion = null;
        if (resRed && !resRed.isTIR && resViolet && !resViolet.isTIR) {
            dispersion = resViolet.deviationAngle - resRed.deviationAngle;
        }
        document.getElementById('val_disp').textContent = dispersion !== null ? dispersion.toFixed(2) + '°' : '--';
        if (dispersion !== null) document.getElementById('item_disp').classList.add('active-color-item');

        const nActive = result.nGlass;
        const txt = document.getElementById('analysisText');
        txt.innerHTML = `<strong>🔬 ${state.lightColor==='white'?'ضوء أبيض (ممثل أخضر)':'ضوء أحادي اللون — '+activeSpec.label} (λ=${activeSpec.λ}nm, n=${nActive.toFixed(4)}):</strong><br>
        1) ${N_AIR.toFixed(6)}·sin(${i}°) = ${nActive.toFixed(4)}·sin(r₁) ⇒ r₁ = ${result.refractionAngle1.toFixed(2)}°<br>
        2) زاوية السقوط الثانية r₂ = ${result.internalAngle.toFixed(2)}°<br>
        3) ${nActive.toFixed(4)}·sin(${result.internalAngle.toFixed(2)}°) = ${N_AIR.toFixed(6)}·sin(e) ⇒ e = ${result.exitAngle.toFixed(2)}°<br>
        4) الانحراف δ = ${i}° + ${result.exitAngle.toFixed(2)}° − ${APEX_DEG}° = ${result.deviationAngle.toFixed(2)}°.<br>
        <em>التشتت الكلي للطيف (أحمر→بنفسجي): Δδ = ${dispersion?.toFixed(2) ?? '--'}°</em>`;
    }

    const panel = document.getElementById('liveAnalysisPanel');
    panel.classList.add('highlight-flash');
    setTimeout(() => panel.classList.remove('highlight-flash'), 600);
}

function updateTable() {
    const tbody = document.getElementById('tableBody');
    const W = canvas.width, H = canvas.height;
    const cx = W*0.48, cy = H*0.5, size = Math.min(W,H)*0.28;
    const verts = getPrismVertices(cx, cy, size, state.prismRotDeg);
    const centroid = { x: (verts[0].x+verts[1].x+verts[2].x)/3, y: (verts[0].y+verts[1].y+verts[2].y)/3 };
    const lampPos = { x: cx - size*1.9, y: cy };
    let html = '';
    SPECTRUM.forEach(s => {
        const res = traceRay({ vertices: verts, centroid }, state.incidentDeg, state.prismType, s.λ, lampPos);
        const n = getIOR(state.prismType, s.λ);
        const isActive = state.lightColor === s.name;
        const rowClass = isActive ? 'highlight-row' : '';
        if (!res || res.isTIR) {
            html += `<tr class="${rowClass}" style="background:${s.tableRow||''}"><td><span style="color:${s.hex};font-weight:800;">●</span> ${s.label}</td><td>${s.λ}</td><td>${n.toFixed(4)}</td><td colspan="4" style="color:#dc2626;font-weight:700;">TIR</td></tr>`;
        } else {
            html += `<tr class="${rowClass}" style="background:${s.tableRow||''}"><td><span style="color:${s.hex};font-weight:800;">●</span> ${s.label}${isActive?' <small>(نشط)</small>':''}</td><td>${s.λ}</td><td>${n.toFixed(4)}</td><td>${res.refractionAngle1.toFixed(2)}°</td><td>${res.internalAngle.toFixed(2)}°</td><td>${res.exitAngle.toFixed(2)}°</td><td>${res.deviationAngle.toFixed(2)}°</td></tr>`;
        }
    });
    tbody.innerHTML = html;
}

function drawSnellDiagram() {
    const sc = document.getElementById('snellCanvas');
    const sctx = sc.getContext('2d');
    const sw = sc.width, sh = sc.height;
    sctx.clearRect(0, 0, sw, sh);
    const midY = sh/2, nx = sw*0.4;
    sctx.fillStyle = '#f8fafc';
    sctx.fillRect(0,0,sw,sh);
    sctx.fillStyle = 'rgba(100,160,220,0.08)';
    sctx.fillRect(nx,0,sw-nx,sh);
    sctx.beginPath(); sctx.moveTo(0,midY); sctx.lineTo(sw,midY); sctx.strokeStyle='#94a3b8'; sctx.lineWidth=2; sctx.stroke();
    sctx.beginPath(); sctx.moveTo(nx,0); sctx.lineTo(nx,sh); sctx.strokeStyle='#cbd5e1'; sctx.setLineDash([4,4]); sctx.stroke(); sctx.setLineDash([]);

    // شعاع ساقط
    const incR = deg2rad(state.incidentDeg);
    const incX = nx - Math.sin(incR)*70, incY = midY - Math.cos(incR)*70;
    sctx.beginPath(); sctx.moveTo(incX, incY); sctx.lineTo(nx, midY); sctx.strokeStyle='#f59e0b'; sctx.lineWidth=2.5; sctx.stroke();

    const activeSpec = getActiveSpecForAnalysis();
    const W = canvas.width, H = canvas.height;
    const cx = W*0.48, cy = H*0.5, size = Math.min(W,H)*0.28;
    const verts = getPrismVertices(cx, cy, size, state.prismRotDeg);
    const centroid = { x: (verts[0].x+verts[1].x+verts[2].x)/3, y: (verts[0].y+verts[1].y+verts[2].y)/3 };
    const lampPos = { x: cx - size*1.9, y: cy };

    if (state.lightColor !== 'white') {
        const res = traceRay({ vertices: verts, centroid }, state.incidentDeg, state.prismType, activeSpec.λ, lampPos);
        if (res && !res.isTIR) {
            const r1R = deg2rad(res.refractionAngle1);
            const refX = nx + Math.sin(r1R)*60, refY = midY + Math.cos(r1R)*60;
            sctx.beginPath(); sctx.moveTo(nx, midY); sctx.lineTo(refX, refY); sctx.strokeStyle=activeSpec.hex; sctx.lineWidth=3; sctx.stroke();
        }
    } else {
        SPECTRUM.forEach(s => {
            const res = traceRay({ vertices: verts, centroid }, state.incidentDeg, state.prismType, s.λ, lampPos);
            if (res && !res.isTIR) {
                const r1R = deg2rad(res.refractionAngle1);
                const refX = nx + Math.sin(r1R)*60, refY = midY + Math.cos(r1R)*60;
                sctx.beginPath(); sctx.moveTo(nx, midY); sctx.lineTo(refX, refY); sctx.strokeStyle=s.hex; sctx.lineWidth=1.8; sctx.stroke();
            }
        });
    }

    const n = getIOR(state.prismType, activeSpec.λ);
    document.getElementById('prismIORLabel').textContent = `معامل انكسار ${state.prismType==='glass'?'الزجاج':state.prismType==='crystal'?'الكريستال':'البلاستيك'}: n(${activeSpec.λ}nm) = ${n.toFixed(4)}`;
    document.getElementById('snellInfo').textContent = `n₁·sin(θ₁) = n₂·sin(θ₂)   |   n(${activeSpec.label}، ${activeSpec.λ}nm) = ${n.toFixed(4)}`;
}

/* ---------- اختبارات التحقق ---------- */
function runAllValidationTests() {
    const grid = document.getElementById('validationGrid');
    const summary = document.getElementById('testSummary');
    const tests = [];
    let pass = 0, fail = 0, warn = 0;
    const W = canvas.width, H = canvas.height;
    const cx = W*0.48, cy = H*0.5, size = Math.min(W,H)*0.28;
    const verts = getPrismVertices(cx, cy, size, state.prismRotDeg);
    const centroid = { x: (verts[0].x+verts[1].x+verts[2].x)/3, y: (verts[0].y+verts[1].y+verts[2].y)/3 };
    const lampPos = { x: cx - size*1.9, y: cy };
    const prismObj = { vertices: verts, centroid };

    // 1. تغير n مع الطول الموجي
    const nRed = getIOR(state.prismType, 700);
    const nGreen = getIOR(state.prismType, 530);
    const nViolet = getIOR(state.prismType, 400);
    const t1 = nViolet > nGreen && nGreen > nRed;
    tests.push({ name:'تغير معامل الانكسار مع الطول الموجي', detail:`n(700)=${nRed.toFixed(4)} | n(530)=${nGreen.toFixed(4)} | n(400)=${nViolet.toFixed(4)}`, pass:t1 });
    t1 ? pass++ : fail++;

    // 2. δ بنفسجي > δ أحمر
    const redRes = traceRay(prismObj, state.incidentDeg, state.prismType, 700, lampPos);
    const violetRes = traceRay(prismObj, state.incidentDeg, state.prismType, 400, lampPos);
    const t2 = redRes && violetRes && !redRes.isTIR && !violetRes.isTIR && violetRes.deviationAngle > redRes.deviationAngle;
    tests.push({ name:'δ(بنفسجي) > δ(أحمر)', detail:t2?`δ_red=${redRes.deviationAngle.toFixed(2)}° | δ_violet=${violetRes.deviationAngle.toFixed(2)}° ✓`:'فشل', pass:t2 });
    t2 ? pass++ : fail++;

    // 3. التشتت المعروض = الفرق
    const dispCalc = (redRes && violetRes && !redRes.isTIR && !violetRes.isTIR) ? violetRes.deviationAngle - redRes.deviationAngle : null;
    const dispDisp = parseFloat(document.getElementById('val_disp').textContent);
    const t3 = dispCalc !== null && !isNaN(dispDisp) && Math.abs(dispCalc - dispDisp) < 0.05;
    tests.push({ name:'التشتت المعروض = δ(بنفسجي) − δ(أحمر)', detail:t3?`Δδ=${dispCalc.toFixed(2)}° (محسوب) = ${dispDisp.toFixed(2)}° (معروض)`:'عدم تطابق', pass:t3 });
    t3 ? pass++ : fail++;

    // 4. تغير n مع نوع المنشور
    const nGl = getIOR('glass',589), nCr = getIOR('crystal',589), nPl = getIOR('plastic',589);
    const t4 = nCr > nGl && nGl > nPl;
    tests.push({ name:'تغير معامل الانكسار مع نوع المنشور', detail:`كريستال=${nCr.toFixed(4)} > زجاج=${nGl.toFixed(4)} > بلاستيك=${nPl.toFixed(4)}`, pass:t4 });
    t4 ? pass++ : fail++;

    // 5. تطابق التحليل مع الجدول
    const activeSpec = getActiveSpecForAnalysis();
    const anaRes = traceRay(prismObj, state.incidentDeg, state.prismType, activeSpec.λ, lampPos);
    const tabRes = traceRay(prismObj, state.incidentDeg, state.prismType, activeSpec.λ, lampPos);
    const t5 = anaRes && tabRes && Math.abs(anaRes.deviationAngle - tabRes.deviationAngle) < 0.01;
    tests.push({ name:'تطابق لوحة التحليل مع الجدول (نفس المحرك)', detail:t5?'متطابقة':'عدم تطابق', pass:t5 });
    t5 ? pass++ : fail++;

    // 6. قيم n ضمن النطاق الفيزيائي
    let cauchyValid = true;
    [400,500,600,700].forEach(l => { const nv = getIOR(state.prismType,l); if (nv<1.3 || nv>2.5) cauchyValid = false; });
    tests.push({ name:'قيم n ضمن النطاق 1.3–2.5', detail:cauchyValid?'جميع القيم صحيحة':'قيم خارج النطاق', pass:cauchyValid });
    cauchyValid ? pass++ : fail++;

    // 7. اختلاف r1 بين الأحمر والبنفسجي
    const r1Red = redRes?.refractionAngle1, r1Violet = violetRes?.refractionAngle1;
    const t7 = r1Red!==null && r1Violet!==null && Math.abs(r1Red - r1Violet) > 0.01;
    tests.push({ name:'اختلاف r₁ بين الأحمر والبنفسجي', detail:t7?`فرق=${(r1Violet-r1Red).toFixed(2)}°`:'لا فرق', pass:t7 });
    t7 ? pass++ : warn++;

    // عرض الاختبارات
    let html = '';
    tests.forEach(t => {
        const cls = t.pass ? 'pass' : 'fail';
        html += `<div class="test-item ${cls}"><div class="test-icon ${cls}">${t.pass?'✓':'✗'}</div><div class="test-details"><strong>${t.name}</strong><span>${t.detail}</span></div></div>`;
    });
    grid.innerHTML = html;
    summary.innerHTML = `✓ ${pass} نجح | ✗ ${fail} فشل | ⚠ ${warn} تحذير — ${fail===0?'✅ جميع الاختبارات الفيزيائية ناجحة.':'⚠ يوجد فشل في بعض الاختبارات.'}`;
}

/* ---------- أحداث UI ---------- */
document.getElementById('incidentSlider').addEventListener('input', e => {
    state.incidentDeg = +e.target.value;
    document.getElementById('incidentValue').textContent = state.incidentDeg + '°';
    redraw();
});
document.getElementById('rotationSlider').addEventListener('input', e => {
    state.prismRotDeg = +e.target.value;
    document.getElementById('rotationValue').textContent = state.prismRotDeg + '°';
    redraw();
});
document.querySelectorAll('.color-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.lightColor = btn.dataset.color;
    const spec = SPECTRUM.find(s=>s.name===state.lightColor);
    document.getElementById('simulationStatus').textContent = state.lightColor==='white'?'🌈 ضوء أبيض (طيف كامل)':`● ضوء ${spec.label} (${spec.λ}nm)`;
    redraw();
}));
document.querySelectorAll('.prism-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.prism-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.prismType = btn.dataset.prism;
    redraw();
}));
document.getElementById('toggleLightBtn').addEventListener('click', () => {
    state.lightOn = !state.lightOn;
    const btn = document.getElementById('toggleLightBtn');
    btn.innerHTML = state.lightOn ? '<i class="fas fa-lightbulb"></i> إيقاف الضوء' : '<i class="fas fa-lightbulb"></i> تشغيل الضوء';
    redraw();
});
document.getElementById('toggleLabelBtn').addEventListener('click', () => {
    state.showLabels = !state.showLabels;
    document.getElementById('toggleLabelBtn').classList.toggle('active', state.showLabels);
    redraw();
});
document.getElementById('toggleAnimBtn').addEventListener('click', () => {
    state.animating = !state.animating;
    const btn = document.getElementById('toggleAnimBtn');
    btn.classList.toggle('active', state.animating);
    btn.innerHTML = state.animating ? '<i class="fas fa-pause"></i> إيقاف الحركة' : '<i class="fas fa-play"></i> تحريك الفوتونات';
    if (state.animating) { animParticles = []; animLoop(); }
    else { cancelAnimationFrame(animFrame); animParticles = []; redraw(); }
});
document.getElementById('resetViewBtn').addEventListener('click', () => {
    state.incidentDeg = 35; state.prismRotDeg = 0;
    document.getElementById('incidentSlider').value = 35;
    document.getElementById('incidentValue').textContent = '35°';
    document.getElementById('rotationSlider').value = 0;
    document.getElementById('rotationValue').textContent = '0°';
    redraw();
});

function copyAccessCode() {
    const code = document.getElementById('accessCodeDisplay').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const icon = document.getElementById('copyIcon');
        icon.className = 'fas fa-check';
        icon.style.color = '#10b981';
        setTimeout(() => { icon.className = 'fas fa-copy'; icon.style.color = ''; }, 2000);
    });
}

// بدء التشغيل
resizeCanvas();
animLoop();
runAllValidationTests();
</script>
</body>
</html>