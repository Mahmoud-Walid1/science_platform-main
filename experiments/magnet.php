<?php
require_once '../config.php';
require_once '../functions.php';

$sub = isAuthenticated();

$user_name = $_SESSION['user']['name'] ?? $_SESSION['user_name'] ?? 'معلم معتمد';
$user_contact = $_SESSION['user']['whatsappNumber'] ?? $_SESSION['user']['phone'] ?? $_SESSION['user']['email'] ?? '';

$exp_active = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM experiments WHERE id = 3"))['is_active'];
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
    <title>المغناطيس الكهربائي | مختبرات العلوم التقنية</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --teal-900: #002d3d; --teal-800: #004e66; --teal-700: #006b8a;
            --teal-600: #0089ae; --teal-500: #00a8d4; --teal-400: #2ec4e8;
            --teal-300: #7ddcf0; --teal-100: #e6f7fc; --teal-50: #f0fbfe;
            --white: #ffffff; --gray-50: #f8fafc; --gray-100: #f1f5f9;
            --gray-200: #e2e8f0; --gray-300: #cbd5e1; --gray-400: #94a3b8;
            --gray-600: #475569; --gray-800: #1e293b;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.03);
            --shadow-md: 0 6px 16px -4px rgba(0,0,0,0.06);
            --shadow-lg: 0 16px 32px -8px rgba(0,0,0,0.08);
            --shadow-xl: 0 24px 48px -12px rgba(0,0,0,0.12);
            --r-xl: 32px; --r-lg: 24px; --r-md: 18px; --r-sm: 14px;
            --transition: 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
            font-family: 'Cairo', sans-serif;
            background: #f0f4f9;
            background-image: radial-gradient(circle at 10% 20%, rgba(0,137,174,0.04) 0%, transparent 50%),
                              radial-gradient(circle at 90% 70%, rgba(46,196,232,0.03) 0%, transparent 50%);
            color: var(--gray-800); min-height: 100vh; display: flex; flex-direction: column;
        }
        @keyframes fadeInUp {
            from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); }
        }
        @keyframes pulse {
            0%,100% { box-shadow:0 0 8px rgba(16,185,129,0.5); } 50% { box-shadow:0 0 24px rgba(16,185,129,0.85); }
        }
        @keyframes challengeComplete {
            0% { transform: scale(1); background-color: var(--gray-50); }
            50% { transform: scale(1.03); background-color: #d1fae5; }
            100% { transform: scale(1); background-color: #e6f7ec; }
        }
        .lab-header {
            width: 100%; display: flex; align-items: center; justify-content: space-between;
            background: rgba(255,255,255,0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
            border-bottom: 2px solid rgba(0,78,102,0.1); padding: 12px 32px;
            box-shadow: 0 4px 24px -10px rgba(0,0,0,0.05); gap: 20px; flex-wrap: wrap;
            position: sticky; top: 0; z-index: 100;
        }
        .lab-brand {
            display: flex; align-items: center; gap: 14px; text-decoration: none;
            transition: var(--transition); cursor: default;
        }
        .lab-brand img { height: 46px; width: 46px; border-radius: 14px; transition: transform 0.3s; }
        .lab-brand:hover img { transform: scale(1.05); }
        .lab-brand span { font-weight: 800; color: var(--teal-800); font-size: 1.1rem; }
        .exp-badge {
            background: linear-gradient(135deg, var(--teal-700), var(--teal-500));
            color: white; padding: 8px 26px; border-radius: 50px; font-weight: 700;
            font-size: 0.88rem; display: flex; align-items: center; gap: 10px;
            box-shadow: 0 8px 20px rgba(0,107,138,0.22); transition: transform 0.3s;
        }
        .exp-badge:hover { transform: scale(1.03); }
        .exit-btn {
            background: rgba(255,255,255,0.75); border: 1px solid rgba(220,38,38,0.15);
            padding: 10px 24px; border-radius: 50px; color: #dc2626; text-decoration: none;
            font-weight: 700; transition: var(--transition); font-size: 0.88rem;
            display: flex; align-items: center; gap: 8px;
        }
        .exit-btn:hover { background: #fee2e2; transform: translateX(6px); box-shadow: 0 4px 12px rgba(220,38,38,0.15); }

        .main-wrap { max-width: 1440px; margin: 24px auto 20px; padding: 0 24px; flex: 1; display: flex; flex-direction: column; gap: 24px; }
        .main-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
        .canvas-area {
            background: white; border-radius: var(--r-xl); border: 1px solid var(--gray-200);
            overflow: hidden; box-shadow: var(--shadow-md); animation: fadeInUp 0.6s ease;
            transition: box-shadow 0.3s;
        }
        .canvas-area:hover { box-shadow: var(--shadow-lg); }
        .canvas-header {
            padding: 16px 24px; border-bottom: 1px solid var(--gray-100); background: var(--gray-50);
            display: flex; justify-content: space-between; align-items: center; font-weight: 700;
            font-size: 0.9rem; flex-wrap: wrap; gap: 8px;
        }
        .live-dot { width: 10px; height: 10px; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; display: inline-block; margin-left: 8px; }
        #threeCanvas { display: block; width: 100%; height: 500px; background: radial-gradient(circle at center, #11161f, #070b12); cursor: grab; }
        .canvas-tools { padding: 12px 20px; background: var(--gray-50); display: flex; flex-wrap: wrap; gap: 10px; }
        .tool-btn {
            background: white; border: 1px solid var(--gray-300); padding: 8px 18px;
            border-radius: 40px; cursor: pointer; font-family: 'Cairo', sans-serif; font-weight: 600;
            font-size: 0.78rem; color: var(--gray-600); transition: var(--transition);
            display: flex; align-items: center; gap: 6px;
        }
        .tool-btn:hover { background: var(--teal-50); border-color: var(--teal-400); transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .tool-btn.active-tool {
            background: linear-gradient(135deg, var(--teal-700), var(--teal-500));
            color: white; border-color: transparent;
        }

        .side-panel { display: flex; flex-direction: column; gap: 20px; }
        .card {
            background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); border-radius: var(--r-md);
            padding: 20px; border: 1px solid rgba(255,255,255,0.6); box-shadow: var(--shadow-md);
            transition: all 0.3s ease;
        }
        .card:hover { box-shadow: var(--shadow-xl); transform: translateY(-4px); background: rgba(255,255,255,0.9); }
        .card-title {
            font-weight: 800; font-size: 0.88rem; margin-bottom: 16px; color: var(--teal-800);
            display: flex; align-items: center; gap: 10px; border-right: 4px solid var(--teal-600);
            padding-right: 14px; transition: var(--transition);
        }
        .card:hover .card-title { border-right-color: var(--teal-400); }

        .btn-group { display: flex; gap: 6px; flex-wrap: wrap; margin: 12px 0; }
        .turn-btn, .core-btn {
            padding: 8px 12px; border-radius: 40px; border: 1.5px solid var(--gray-200);
            background: var(--gray-50); cursor: pointer; font-family: 'Cairo', sans-serif;
            font-weight: 600; font-size: 0.76rem; transition: all 0.25s;
        }
        .turn-btn:hover, .core-btn:hover { background: #e0f2fe; border-color: #7ddcf0; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,137,174,0.15); }
        .turn-btn.active, .core-btn.active {
            background: var(--teal-600); color: white; border-color: transparent;
            box-shadow: 0 8px 20px rgba(0,137,174,0.35);
        }
        .slider-group { margin: 12px 0; }
        .slider-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        input[type="range"] {
            -webkit-appearance: none; width: 100%; height: 8px; border-radius: 10px;
            background: var(--gray-200); outline: none; transition: var(--transition);
        }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%;
            background: linear-gradient(135deg, var(--teal-700), var(--teal-500));
            cursor: pointer; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,137,174,0.35);
            transition: transform 0.2s;
        }
        input[type="range"]:hover::-webkit-slider-thumb { transform: scale(1.2); }
        .strength-bar { height: 10px; background: var(--gray-200); border-radius: 10px; margin: 12px 0; overflow: hidden; }
        .strength-fill { height: 100%; width: 0%; border-radius: 10px; transition: width 0.3s, background 0.5s; }
        .info-box {
            background: var(--teal-50); border: 1px solid var(--teal-200); border-radius: var(--r-md);
            padding: 16px; margin-top: 16px; font-size: 0.82rem; line-height: 1.8;
            border-right: 4px solid var(--teal-500); transition: var(--transition);
        }
        .info-box:hover { background: #e6f7fc; }
        .residual-indicator {
            display: none; background: #fff3cd; border: 1px solid #ffc107; border-radius: 10px;
            padding: 8px 12px; font-size: 0.75rem; font-weight: 700; color: #856404; margin-top: 8px; text-align: center;
            animation: fadeInUp 0.4s;
        }
        .turns-visual-hint { font-size: 0.72rem; color: var(--gray-500); padding: 6px 10px; background: var(--gray-50); border-radius: 10px; border: 1px solid var(--gray-100); margin-top: 6px; }

        .bottom-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 10px; }
        @media (max-width: 1100px) { .bottom-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 700px) { .bottom-grid { grid-template-columns: 1fr; } }

        .challenge-item {
            display: flex; align-items: center; gap: 8px; padding: 8px 12px;
            background: var(--gray-50); border-radius: 30px; margin: 6px 0;
            font-size: 0.8rem; border: 1px solid var(--gray-200); transition: var(--transition);
        }
        .challenge-item.completed {
            background: #e6f7ec; border-color: #10b981; color: #065f46;
            animation: challengeComplete 0.6s ease;
        }
        .challenge-dot { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; transition: var(--transition); }
        .challenge-item.completed .challenge-dot { background: #10b981; box-shadow: 0 0 12px rgba(16,185,129,0.7); }
        .permeability-chip {
            padding: 6px 14px; border-radius: 30px; font-size: 0.75rem; font-weight: 700;
            border: 1px solid var(--gray-200); background: #f8fafc; display: inline-block; margin: 4px;
            transition: var(--transition);
        }
        .permeability-chip.highlight { background: #e6f7fc; border-color: var(--teal-500); color: var(--teal-800); box-shadow: 0 4px 12px rgba(0,168,212,0.15); }
        .weight-btn {
            background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 30px;
            font-weight: 700; cursor: pointer; font-family: 'Cairo', sans-serif; transition: var(--transition);
            font-size: 0.8rem; margin: 4px;
        }
        .weight-btn:hover { background: #e0f2fe; border-color: #0089ae; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,137,174,0.2); }
        .weight-btn.active-lift { background: #10b981; color: white; border-color: #10b981; }
        .lifting-result { font-size: 0.8rem; margin-top: 8px; font-weight: 600; min-height: 24px; transition: var(--transition); }

        .lab-footer {
            background: rgba(255,255,255,0.75); backdrop-filter: blur(20px);
            border-top: 2px solid rgba(0,78,102,0.1); padding: 18px 0; margin-top: auto;
        }
        .footer-content {
            max-width: 1440px; margin: 0 auto; padding: 0 24px;
            display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 20px;
        }
        .footer-code {
            display: flex; align-items: center; gap: 12px; background: white; padding: 10px 20px;
            border-radius: 50px; border: 1px solid var(--gray-200); box-shadow: var(--shadow-sm);
            transition: var(--transition);
        }
        .footer-code:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .footer-code code {
            background: var(--teal-50); color: var(--teal-700); font-family: monospace; font-weight: 700;
            padding: 6px 16px; border-radius: 30px; cursor: pointer; transition: var(--transition);
        }
        .footer-code code:hover { background: var(--teal-600); color: white; transform: scale(1.05); }
        .footer-copy {
            background: var(--teal-600); color: white; border: none; padding: 8px 16px;
            border-radius: 30px; cursor: pointer; transition: var(--transition);
        }
        .footer-copy:hover { background: var(--teal-700); transform: scale(1.05); }
    </style>
</head>
<body>

<header class="lab-header">
    <a href="#" class="lab-brand" onclick="event.preventDefault();">
        <img src="../logo2.png" alt="logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="lab-brand-icon" style="display:none; height:46px; width:46px; border-radius:14px; background:linear-gradient(135deg,var(--teal-700),var(--teal-400)); align-items:center; justify-content:center; font-size:1.4rem; color:white;"><i class="fas fa-flask"></i></div>
        <span>مختبرات العلوم التقنية للجميع</span>
    </a>
    <div class="exp-badge"><i class="fas fa-magnet"></i> تجربة المغناطيس الكهربائي</div>
    <a href="../index.php" class="exit-btn"><i class="fas fa-sign-out-alt"></i> خروج</a>
</header>

<div class="main-wrap">
    <div class="main-grid">
        <div class="canvas-area">
            <div class="canvas-header">
                <span><span class="live-dot"></span> محاكاة تفاعلية – مغناطيس كهربائي</span>
                <span id="magnetStatus" style="color:var(--teal-700); font-weight:800;">⚡ نشط 45%</span>
            </div>
            <canvas id="threeCanvas"></canvas>
            <div class="canvas-tools">
                <button id="resetViewBtn" class="tool-btn"><i class="fas fa-undo-alt"></i> إعادة ضبط الكاميرا</button>
                <button id="toggleMagnetBtn" class="tool-btn active-tool"><i class="fas fa-power-off"></i> إيقاف المغناطيس</button>
                <button id="dropNailBtn" class="tool-btn"><i class="fas fa-paperclip"></i> إسقاط مشبك</button>
                <button id="resetMetalsBtn" class="tool-btn"><i class="fas fa-rotate-right"></i> إعادة المعادن</button>
            </div>
        </div>
        <div class="side-panel">
            <div class="card">
                <div class="card-title"><i class="fas fa-rotate"></i> عدد اللفات (N)</div>
                <div class="btn-group" id="turnsGroup">
                    <button class="turn-btn" data-turns="5">5</button>
                    <button class="turn-btn" data-turns="15">15</button>
                    <button class="turn-btn active" data-turns="30">30</button>
                    <button class="turn-btn" data-turns="50">50</button>
                    <button class="turn-btn" data-turns="80">80</button>
                </div>
                <div id="turnsVisualHint" class="turns-visual-hint">30 لفة — ملف متوسط الكثافة</div>
                <div style="font-size:0.8rem; color:var(--gray-600); margin-top:8px;">
                    <span id="turnsMultiplier" style="font-weight:800; color:var(--teal-700);">قوة مضاعفة ×3.0</span>
                </div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-bolt"></i> شدة التيار (I) – أمبير</div>
                <div class="slider-group">
                    <div class="slider-row">
                        <span>التيار الكهربائي</span>
                        <span id="currentValue" style="font-weight:800; color:var(--teal-700);">2.50 A</span>
                    </div>
                    <input type="range" id="currentSlider" min="0" max="5" step="0.05" value="2.5">
                </div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-microchip"></i> نوع القلب</div>
                <div class="btn-group" id="coreGroup">
                    <button class="core-btn" data-core="none">بدون قلب</button>
                    <button class="core-btn active" data-core="soft">حديد طري</button>
                    <button class="core-btn" data-core="steel">صلب</button>
                </div>
                <div id="coreDescription" style="font-size:0.75rem; color:var(--gray-500); padding:8px; background:var(--gray-50); border-radius:10px; border:1px solid var(--gray-100);">
                    μᵣ ≈ 4000 — يضخّم المجال 4000 مرة، يفقد مغناطيسيته فور قطع التيار
                </div>
                <div class="residual-indicator" id="residualIndicator">🧲 مغناطيسية متبقية نشطة (~20%)</div>
            </div>
            <div class="card">
                <div class="card-title"><i class="fas fa-gauge-high"></i> القياسات الآنية</div>
                <div style="font-size:0.82rem;">
                    <p style="display:flex; justify-content:space-between; margin:8px 0;"><span>🧲 كثافة الفيض (B)</span><strong id="fluxDensity" style="color:var(--teal-700);">0.000</strong><span>Tesla</span></p>
                    <p style="display:flex; justify-content:space-between; margin:8px 0;"><span>⚡ شدة المجال (H)</span><strong id="fieldStrength" style="color:var(--teal-700);">0</strong><span>A/m</span></p>
                    <p style="display:flex; justify-content:space-between; margin:8px 0;"><span>🔩 قوة الجذب</span><strong id="attractionForce" style="color:var(--teal-700);">0.0</strong><span>نيوتن</span></p>
                </div>
                <div class="strength-bar"><div class="strength-fill" id="strengthFill"></div></div>
                <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
                    <span id="strengthPercent">0%</span><span>100%</span>
                </div>
                <div style="background:var(--teal-50); border:1px solid var(--teal-100); border-radius:10px; padding:8px; margin-top:10px; text-align:center; font-family:monospace; font-size:0.8rem; font-weight:700;" id="formulaBox">
                    B = μᵣ=4000 × 30 × 2.50 / 0.12 = 0.000 T
                </div>
            </div>
            <div class="info-box">
                <strong>📊 معلومات المجال:</strong><br>
                عدد اللفات: <span id="displayTurns">30</span><br>
                شدة التيار: <span id="displayCurrent">2.50</span> A<br>
                القطب الشمالي: 🔴 N (أعلى)<br>
                القطب الجنوبي: 🔵 S (أسفل)<br>
                <span id="dynamicTip" style="display:block; margin-top:6px; font-weight:600;">💡 جرّب تغيير اللفات أو التيار أو القلب!</span>
            </div>
        </div>
    </div>

    <div class="bottom-grid">
        <div class="card">
            <div class="card-title"><i class="fas fa-graduation-cap"></i> الفهم العلمي</div>
            <div style="font-size:0.85rem; line-height:1.9;">
                <p><strong>🧲 المغناطيس الكهربائي:</strong> مغناطيس مؤقت يتولد عند مرور تيار في ملف.</p>
                <p><strong>📈 عدد اللفات (N):</strong> B ∝ N – كلما زادت اللفات زادت كثافة الفيض.</p>
                <p><strong>🧪 الحديد الطري (μᵣ≈4000):</strong> يضخم المجال بشدة، يفقد المغناطيسية فوراً عند قطع التيار (مثالي للرافعات).</p>
                <p><strong>الصلب (μᵣ≈800):</strong> تضخيم أقل، لكنه يحتفظ ببعض المغناطيسية بعد قطع التيار (مغناطيس دائم).</p>
                <p><strong>بدون قلب:</strong> مجال ضعيف جداً (μᵣ≈1).</p>
            </div>
        </div>
        <div class="card">
            <div class="card-title"><i class="fas fa-trophy"></i> تحديات المعمل</div>
            <div class="challenge-item" id="challenge1"><span class="challenge-dot"></span> ارفع 5 أجسام (<span id="liftedCount">0</span>/5)</div>
            <div class="challenge-item" id="challenge2"><span class="challenge-dot"></span> اجعل B يصل إلى 0.8 T</div>
            <div class="challenge-item" id="challenge3"><span class="challenge-dot"></span> اجعل قوة المجال > 50%</div>
        </div>
        <div class="card">
            <div class="card-title"><i class="fas fa-chart-bar"></i> مخطط القوة النسبية</div>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--gray-500);">
                <span>0%</span><span id="chartPercentLabel">0%</span><span>100%</span>
            </div>
            <div class="strength-bar" style="height:14px; margin:8px 0;"><div class="strength-fill" id="chartBar" style="height:100%; width:0%; background:linear-gradient(90deg,#f59e0b,#ef4444);"></div></div>
            <p style="font-size:0.8rem; color:var(--gray-600); margin-top:4px;" id="relativeStrengthText">القوة النسبية: 0% من أقصى قيمة</p>
            <div style="margin-top:12px; font-size:0.75rem; color:var(--gray-600);">النفاذية النسبية:</div>
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
                <span class="permeability-chip" id="chipAir">هواء μᵣ=1</span>
                <span class="permeability-chip highlight" id="chipSoft">حديد طري μᵣ=4000</span>
                <span class="permeability-chip" id="chipSteel">صلب μᵣ=800</span>
            </div>
        </div>
        <div class="card">
            <div class="card-title"><i class="fas fa-microscope"></i> تأثير العوامل على المجال</div>
            <ul style="list-style:none; font-size:0.8rem; color:var(--gray-700); line-height:2.2; padding:0;">
                <li><i class="fas fa-arrow-up" style="color:#10b981;"></i> زيادة اللفات ← زيادة كثافة الفيض (طردي)</li>
                <li><i class="fas fa-arrow-up" style="color:#10b981;"></i> زيادة التيار ← زيادة شدة المجال (طردي)</li>
                <li><i class="fas fa-microchip" style="color:var(--teal-600);"></i> الحديد الطري ← تضخيم هائل (μᵣ≈4000)</li>
                <li><i class="fas fa-microchip" style="color:#b0a89c;"></i> الصلب ← تضخيم متوسط (μᵣ≈800) مع احتفاظ جزئي</li>
                <li><i class="fas fa-wind" style="color:var(--gray-400);"></i> بدون قلب ← مجال ضعيف جداً (μᵣ=1)</li>
            </ul>
        </div>
        <div class="card">
            <div class="card-title"><i class="fas fa-crane"></i> تطبيق: الرافعة المغناطيسية</div>
            <p style="font-size:0.78rem; color:var(--gray-600);">اختبر قدرة المغناطيس على رفع أوزان مختلفة (يظهر الجسم في المشهد):</p>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin:10px 0;">
                <button class="weight-btn" data-weight="1">🚀 1 كجم</button>
                <button class="weight-btn" data-weight="5">🚛 5 كجم</button>
                <button class="weight-btn" data-weight="10">🏗️ 10 كجم</button>
            </div>
            <div id="liftingResult" class="lifting-result" style="color:#334155;">⚪ في انتظار الاختبار...</div>
        </div>
        <div class="card">
            <div class="card-title"><i class="fas fa-clipboard-check"></i> سجل الملاحظات</div>
            <div id="observationLog" style="font-size:0.78rem; max-height:200px; overflow-y:auto;"></div>
        </div>
    </div>
</div>

<footer class="lab-footer">
    <div class="footer-content">
        <div class="footer-code">
            <i class="fas fa-key" style="color:var(--teal-600);"></i>
            <span>كود الدخول:</span>
            <code id="accessCodeDisplay" onclick="copyAccessCode()">SCI-MAGNET-PERM-001</code>
            <button class="footer-copy" onclick="copyAccessCode()"><i id="copyIcon" class="fas fa-copy"></i></button>
        </div>
    </div>
</footer>

<script>
function copyAccessCode() {
    var code = document.getElementById('accessCodeDisplay').textContent;
    navigator.clipboard.writeText(code).then(function() {
        var icon = document.getElementById('copyIcon');
        icon.className = 'fas fa-check'; icon.style.color = '#10b981';
        setTimeout(function() { icon.className = 'fas fa-copy'; icon.style.color = ''; }, 2000);
    });
}
</script>

<script type="importmap">
{
    "imports": {
        "three": "https://unpkg.com/three@0.128.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.128.0/examples/jsm/"
    }
}
</script>

<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const canvas = document.getElementById('threeCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x0a0f1a, 1);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f1a);
scene.fog = new THREE.FogExp2(0x0a0f1a, 0.005);

const camera = new THREE.PerspectiveCamera(42, canvas.clientWidth/canvas.clientHeight, 0.1, 50);
camera.position.set(4.2, 2.8, 5.5);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(canvas.clientWidth, canvas.clientHeight), 1.0, 0.4, 0.85);
bloomPass.threshold = 0.2; bloomPass.strength = 0.5; bloomPass.radius = 0.4;
composer.addPass(bloomPass);

scene.add(new THREE.AmbientLight(0x404060, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 6, 3); scene.add(dirLight);

const table = new THREE.Mesh(new THREE.PlaneGeometry(7,5), new THREE.MeshStandardMaterial({ color:0x1e293b, roughness:0.4 }));
table.rotation.x = -Math.PI/2; table.position.y = -1.1; table.receiveShadow = true; scene.add(table);

const magnetGroup = new THREE.Group(); scene.add(magnetGroup);
const coreGeo = new THREE.CylinderGeometry(0.35,0.35,1.62,32);
const coreMat = new THREE.MeshStandardMaterial({ color:0x888888, metalness:0.92, roughness:0.18 });
const core = new THREE.Mesh(coreGeo, coreMat); core.castShadow = true; magnetGroup.add(core);

const copperMat = new THREE.MeshStandardMaterial({ color:0xcc7722, metalness:0.88, roughness:0.14, emissive:0xaa4400, emissiveIntensity:0 });
const windingsGroup = new THREE.Group(); magnetGroup.add(windingsGroup);

function rebuildWindings(turnsCount) {
    while(windingsGroup.children.length) windingsGroup.remove(windingsGroup.children[0]);
    const visible = Math.min(turnsCount, 44);
    const coilSpan = THREE.MathUtils.lerp(0.34, 1.38, (turnsCount-5)/75);
    const wireThick = THREE.MathUtils.lerp(0.09, 0.048, (turnsCount-5)/75);
    const spacing = coilSpan / (visible+1);
    const startY = -coilSpan/2;
    const ringGeo = new THREE.TorusGeometry(0.52, wireThick, 16, 52);
    for (let i=0; i<visible; i++) {
        const ring = new THREE.Mesh(ringGeo, copperMat.clone());
        ring.rotation.x = Math.PI/2; ring.position.y = startY + spacing*(i+1); ring.castShadow = true;
        windingsGroup.add(ring);
    }
}

const northMat = new THREE.MeshStandardMaterial({ color:0xff3333, emissive:0xff1100, emissiveIntensity:0.5 });
const southMat = new THREE.MeshStandardMaterial({ color:0x3355ff, emissive:0x1133ff, emissiveIntensity:0.5 });
const northPole = new THREE.Mesh(new THREE.SphereGeometry(0.18,32,32), northMat); northPole.position.y = 0.95; magnetGroup.add(northPole);
const southPole = new THREE.Mesh(new THREE.SphereGeometry(0.18,32,32), southMat); southPole.position.y = -0.95; magnetGroup.add(southPole);

const batteryGroup = new THREE.Group();
batteryGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.5,0.9,0.3), new THREE.MeshStandardMaterial({ color:0x1a2a3a })));
batteryGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.14,8), new THREE.MeshStandardMaterial({ color:0xffcc00 })).translateY(0.5));
batteryGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.09,8), new THREE.MeshStandardMaterial({ color:0xaaaaaa })).translateY(-0.5));
batteryGroup.position.set(-2.5,-0.3,0); scene.add(batteryGroup);

// تعريف المادة والأسلاك – يبقى wireMat معرّفاً مرة واحدة
const wireMat = new THREE.LineBasicMaterial({ color: 0xbb6600 });

// تعريف نقاط الأسلاك الجديدة التي تصل إلى الكرات
const WIRE_TOP_PTS = [new THREE.Vector3(-2.2, 0.2, 0), new THREE.Vector3(-0.18, 0.95, 0)];
const WIRE_BOT_PTS = [new THREE.Vector3(-2.25, -0.8, 0), new THREE.Vector3(-0.18, -0.95, 0)];

// حذف الأسلاك القديمة (إذا كانت موجودة مسبقاً في المشهد قد تحتاج إزالتها، لكنها تضاف مرة واحدة)
// لكن هنا الأسلاك أُنشئت سابقاً باستخدام نقاط قديمة، لذا نعيد إنشاءها:
scene.children.forEach(child => {
    if (child.isLine && child.material === wireMat) scene.remove(child);
});
scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(WIRE_TOP_PTS), wireMat));
scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(WIRE_BOT_PTS), wireMat));

// تهيئة الجسيمات
let currentParticles = [];
function createCurrentParticles() {
    currentParticles.forEach(p => scene.remove(p));
    currentParticles = [];
    [WIRE_TOP_PTS, WIRE_BOT_PTS].forEach(path => {
        for (let i = 0; i < 8; i++) {
            const p = new THREE.Mesh(
                new THREE.SphereGeometry(0.035, 6, 6),
                new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xffaa00, emissiveIntensity: 1.2 })
            );
            p.userData = { path, t: Math.random() };
            p.visible = false;
            scene.add(p);
            currentParticles.push(p);
        }
    });
}
createCurrentParticles();
function updateCurrentParticles() {
    const show = isActive && current > 0.1;
    const speed = current/5 * 0.025;
    currentParticles.forEach(p => {
        p.visible = show;
        if (!show) return;
        p.userData.t += speed;
        if (p.userData.t > 1) p.userData.t = 0;
        const path = p.userData.path;
        p.position.lerpVectors(path[0], path[1], p.userData.t);
    });
}

const compassGroup = new THREE.Group(); compassGroup.position.set(2.4,-0.6,-1.8); scene.add(compassGroup);
compassGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.06,32), new THREE.MeshStandardMaterial({ color:0x1e3a5f })));
const needleGroup = new THREE.Group(); needleGroup.position.y = 0.05; compassGroup.add(needleGroup);
needleGroup.add(new THREE.Mesh(new THREE.ConeGeometry(0.05,0.26,8), new THREE.MeshStandardMaterial({ color:0xff3333, emissive:0xcc1111 })).translateY(0.13));
needleGroup.add(new THREE.Mesh(new THREE.ConeGeometry(0.05,0.26,8), new THREE.MeshStandardMaterial({ color:0xdddddd })).translateY(-0.13).rotateZ(Math.PI));
let needleTargetAngle = 0, needleCurrentAngle = 0;

function updateCompass(strength) {
    if (!isActive || strength < 2) needleTargetAngle = 0;
    else needleTargetAngle = Math.atan2(0-2.4, 0-(-1.8));
    let diff = needleTargetAngle - needleCurrentAngle;
    while (diff > Math.PI) diff -= Math.PI*2;
    while (diff < -Math.PI) diff += Math.PI*2;
    needleCurrentAngle += diff * (0.01 + strength/100 * 0.1);
    needleGroup.rotation.y = needleCurrentAngle;
}

let fieldLines = [], fieldParticles = [];
function createFieldLines(strength) {
    fieldLines.forEach(l => scene.remove(l));
    fieldParticles.forEach(p => scene.remove(p));
    fieldLines = [];
    fieldParticles = [];
    
    // لا عودة مبكرة – نرسم دائماً عند وجود أي قوة
    const displayStrength = Math.max(0, strength); // للتأكد من عدم القيم السالبة
    
    // عدد الخطوط: أدنى عدد 2، ويتزايد مع القوة حتى 22 خطاً عند القوة 100
    const lineCount = Math.max(2, Math.floor(4 + (displayStrength / 100) * 18));
    const spread = 0.7 + (displayStrength / 100) * 0.7;
    const opacity = Math.max(0.15, 0.05 + (displayStrength / 100) * 0.5); // حد أدنى للشفافية 0.15 لظهور المجال الضعيف
    
    for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const pts = [];
        for (let t = 0; t <= 1; t += 0.04) {
            const r = spread * Math.sin(Math.PI * t);
            pts.push(new THREE.Vector3(Math.cos(angle) * r, 0.95 - 1.9 * t, Math.sin(angle) * r));
        }
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: 0x44aaff, transparent: true, opacity: opacity })
        );
        scene.add(line);
        fieldLines.push(line);
        
        const pCount = Math.floor(8 + (displayStrength / 100) * 20); // جسيمات أقل للقوى الضعيفة
        for (let j = 0; j < pCount; j++) {
            const p = new THREE.Mesh(
                new THREE.SphereGeometry(0.025, 6, 6),
                new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x2288aa })
            );
            p.userData = { lineIndex: i, progress: Math.random(), speed: 0.004 + Math.random() * 0.01 };
            scene.add(p);
            fieldParticles.push(p);
        }
    }
}
function updateFieldParticles(strength) {
    const speedFactor = Math.max(0.15, Math.min(2.5, strength/50));
    fieldParticles.forEach(p => {
        p.userData.progress += p.userData.speed * speedFactor;
        if (p.userData.progress >= 1) p.userData.progress = 0;
        const line = fieldLines[p.userData.lineIndex];
        if (line) {
            const pts = line.geometry.attributes.position.array;
            const idx = Math.floor(p.userData.progress*(pts.length/3-1));
            const next = Math.min(idx+1, pts.length/3-1);
            const frac = p.userData.progress*(pts.length/3-1)-idx;
            p.position.set(pts[idx*3]*(1-frac)+pts[next*3]*frac, pts[idx*3+1]*(1-frac)+pts[next*3+1]*frac, pts[idx*3+2]*(1-frac)+pts[next*3+2]*frac);
        }
    });
    fieldLines.forEach(l => l.material.opacity = 0.12 + Math.min(0.7, strength/100)*0.6);
}

let metalObjects = [];
let heavyObject = null; // للرافعة المغناطيسية
let liftedCount = 0; // عدد الأجسام المرفوعة للتحدي

function createMetalObjects() {
    const configs = [
        { geo:() => new THREE.CylinderGeometry(0.05,0.09,0.35,8), col:0xb0b8c8, pos:[1.4,-1.1,0.9], label:'مسمار' },
        { geo:() => new THREE.SphereGeometry(0.14,20,20), col:0xcc9955, pos:[1.6,-1.1,-0.5], label:'كرة' },
        { geo:() => new THREE.BoxGeometry(0.22,0.22,0.22), col:0x8a8fa0, pos:[1.9,-1.12,0.3], label:'مكعب' },
        { geo:() => new THREE.TorusGeometry(0.08,0.02,8,14), col:0xccd5ee, pos:[1.2,-1.1,-0.8], label:'مشبك' },
        { geo:() => new THREE.TorusGeometry(0.1,0.04,8,24), col:0xaa99bb, pos:[1.55,-1.1,0.0], label:'حلقة' }
    ];
    configs.forEach(c => {
        const mesh = new THREE.Mesh(c.geo(), new THREE.MeshStandardMaterial({ color:c.col, metalness:0.78, roughness:0.22 }));
        mesh.position.set(...c.pos); mesh.userData = { origPos:mesh.position.clone(), label:c.label, attached:false, velocity:new THREE.Vector3(), wasLifted: false };
        mesh.castShadow = true; scene.add(mesh); metalObjects.push(mesh);
    });
}

function spawnHeavyWeight(weightKg) {
    if (heavyObject) { scene.remove(heavyObject); heavyObject = null; }
    const size = 0.2 + weightKg * 0.04;
    const geo = new THREE.BoxGeometry(size, size*0.6, size);
    const mat = new THREE.MeshStandardMaterial({ color:0x445566, metalness:0.8, roughness:0.25 });
    heavyObject = new THREE.Mesh(geo, mat);
    heavyObject.position.set(1.8, -0.8, -0.3);
    heavyObject.userData = { weight: weightKg, originalPos: heavyObject.position.clone(), attracted: false, wasLifted: false };
    heavyObject.castShadow = true;
    scene.add(heavyObject);
    metalObjects.push(heavyObject);
    addObservation(`🚛 تم وضع وزن ${weightKg} كجم لاختبار الرافعة`);
}

function updateAttraction(strength) {
    const center = new THREE.Vector3(0,0,0);
    metalObjects.forEach(obj => {
        if (obj === heavyObject && !obj.userData.attracted && strength < 30) return; // ثقيل لا يتحرك إلا بقوة
        const dist = obj.position.distanceTo(center);
        const force = (strength/100) * (1/(dist+0.3))*0.05;
        if (strength > 12 && force > 0.012) {
            obj.position.add(center.clone().sub(obj.position).normalize().multiplyScalar(force));
            if (dist < 0.25 && !obj.userData.wasLifted) {
                obj.userData.wasLifted = true;
                if (obj === heavyObject) {
                    document.getElementById('liftingResult').innerHTML = `✅ تم رفع ${obj.userData.weight} كجم بنجاح!`;
                    addObservation(`🏆 رفع وزن ${obj.userData.weight} كجم`);
                } else {
                    liftedCount++;
                    document.getElementById('liftedCount').textContent = liftedCount;
                    addObservation(`📌 جذب ${obj.userData.label} (${liftedCount}/5)`);
                }
            }
        } else {
            obj.position.lerp(obj.userData.origPos, 0.04);
        }
    });
}

let turns = 30, current = 2.5, coreType = 'soft', isActive = true;
let strengthPercent = 0, residualStrength = 0;

function getMuR() { return coreType==='none' ? 1 : coreType==='soft' ? 4000 : 800; }
function calcStrength() {
    if (!isActive && coreType!=='steel') return 0;
    if (!isActive && coreType==='steel') return Math.max(0, residualStrength*0.92);
    const H = (turns*current)/0.12;
    const B = (4*Math.PI*1e-7) * getMuR() * H;
    const s = Math.min(100, B*55);
    if (coreType==='steel') residualStrength = s;
    return s;
}

function updateUI() {
    strengthPercent = calcStrength();
    const eff = isActive ? strengthPercent : residualStrength;
    const muR = getMuR();
    const H = (turns*current)/0.12;
    const B = (4*Math.PI*1e-7) * muR * H;

    document.getElementById('displayTurns').textContent = turns;
    document.getElementById('displayCurrent').textContent = current.toFixed(2);
    document.getElementById('currentValue').textContent = current.toFixed(2)+' A';
    document.getElementById('fluxDensity').textContent = B.toFixed(4);
    document.getElementById('fieldStrength').textContent = Math.round(H);
    document.getElementById('attractionForce').textContent = (eff*0.085).toFixed(2);
    document.getElementById('strengthFill').style.width = Math.round(eff)+'%';
    document.getElementById('strengthFill').style.background = eff<33?'#10b981':eff<66?'#f59e0b':'#ef4444';
    document.getElementById('strengthPercent').textContent = Math.round(eff)+'%';
    document.getElementById('turnsMultiplier').textContent = 'قوة مضاعفة ×'+(turns/10).toFixed(1);
    document.getElementById('formulaBox').innerHTML = `B = μᵣ=${muR} × ${turns} × ${current.toFixed(2)} / 0.12 = <strong>${B.toFixed(4)}</strong> T`;

    const status = document.getElementById('magnetStatus');
    if (!isActive && residualStrength<1) { status.innerHTML='⚫ غير نشط'; status.style.color='#94a3b8'; }
    else if (!isActive && residualStrength>1) { status.innerHTML=`🧲 مغناطيسية متبقية ${Math.round(residualStrength)}%`; status.style.color='#f59e0b'; }
    else if (eff<30) { status.innerHTML=`⚡ نشط ${Math.round(eff)}%`; status.style.color='#f59e0b'; }
    else { status.innerHTML=`⚡ نشط ${Math.round(eff)}% 🔥`; status.style.color='#10b981'; }

    northPole.material.emissiveIntensity = 0.2+eff/100*1.5;
    southPole.material.emissiveIntensity = 0.2+eff/100*1.5;
    bloomPass.strength = 0.3+eff/100*0.9;

    if (coreType==='none') { core.material.color.setHex(0x666666); core.material.transparent=true; core.material.opacity=0.25; }
    else if (coreType==='soft') { core.material.color.setHex(0x8899aa); core.material.transparent=false; core.material.opacity=1; }
    else { core.material.color.setHex(0xaa8866); core.material.transparent=false; core.material.opacity=1; }

    document.getElementById('residualIndicator').style.display = (!isActive && residualStrength>1) ? 'block' : 'none';

    const tips = [[80,'💪🔥 مجال قوي جداً! الجسيمات سريعة والأجسام تنجذب بقوة.'],[50,'👍 مجال متوسط – جرب زيادة اللفات أو التيار.'],[20,'⚠️ مجال ضعيف – اختر قلباً حديدياً.'],[0,'💡 المغناطيس غير نشط. شغّله أو ارفع التيار.']];
    for (const [t,msg] of tips) { if (eff>=t) { document.getElementById('dynamicTip').textContent=msg; break; } }

    windingsGroup.children.forEach((ring,i) => {
        const n = windingsGroup.children.length;
        const wave = Math.sin(Date.now()*0.005 - (i/n)*Math.PI*4)*0.5+0.5;
        ring.material.emissiveIntensity = isActive ? wave * eff/100 * 1.2 : 0;
    });

    document.getElementById('chartBar').style.width = Math.round(eff)+'%';
    document.getElementById('chartPercentLabel').textContent = Math.round(eff)+'%';
    document.getElementById('relativeStrengthText').textContent = `القوة النسبية: ${Math.round(eff)}% من أقصى قيمة`;
    document.getElementById('chipAir').classList.toggle('highlight', coreType==='none');
    document.getElementById('chipSoft').classList.toggle('highlight', coreType==='soft');
    document.getElementById('chipSteel').classList.toggle('highlight', coreType==='steel');

    // تحديات المعمل
    document.getElementById('liftedCount').textContent = liftedCount;
    document.getElementById('challenge1').classList.toggle('completed', liftedCount>=5);
    document.getElementById('challenge2').classList.toggle('completed', B>=0.8);
    document.getElementById('challenge3').classList.toggle('completed', eff>50);
}

// رفع الأثقال
document.querySelectorAll('.weight-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const weight = parseInt(btn.dataset.weight);
        spawnHeavyWeight(weight);
        document.getElementById('liftingResult').innerHTML = `⏳ جاري اختبار رفع ${weight} كجم...`;
    });
});

function addObservation(msg) {
    const log = document.getElementById('observationLog');
    const time = new Date().toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true});
    const div = document.createElement('div');
    div.style.cssText = 'padding:5px 0; border-bottom:1px solid #f1f5f9; font-size:0.78rem; display:flex; gap:8px;';
    div.innerHTML = `<span style="color:#94a3b8; min-width:50px;">${time}</span><span>📝 ${msg}</span>`;
    log.prepend(div);
    if (log.children.length > 8) log.removeChild(log.lastChild);
}

const TURNS_HINTS = {5:'5 لفات — ملف متباعد',15:'15 لفة — مجال منخفض',30:'30 لفة — ملف متوسط',50:'50 لفة — كثيف',80:'80 لفة — أقصى كثافة'};
const CORE_DESC = {none:'μᵣ=1 – مجال ضعيف',soft:'μᵣ≈4000 – تضخيم هائل، يفقد فوراً',steel:'μᵣ≈800 – تضخيم متوسط، يحتفظ جزئياً'};

document.querySelectorAll('.turn-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.turn-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    turns = parseInt(btn.dataset.turns);
    rebuildWindings(turns);
    document.getElementById('turnsVisualHint').textContent = TURNS_HINTS[turns] || '';
    updateUI(); createFieldLines(strengthPercent);
    addObservation(`تغيير اللفات إلى ${turns}`);
}));
document.getElementById('currentSlider').addEventListener('input', e => { current = parseFloat(e.target.value); updateUI(); });
document.querySelectorAll('.core-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.core-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    coreType = btn.dataset.core;
    document.getElementById('coreDescription').textContent = CORE_DESC[coreType];
    residualStrength = 0;
    updateUI(); createFieldLines(strengthPercent);
    addObservation(`تغيير القلب إلى ${coreType==='soft'?'حديد طري':coreType==='steel'?'صلب':'بدون قلب'}`);
}));
document.getElementById('toggleMagnetBtn').addEventListener('click', function() {
    isActive = !isActive;
    this.innerHTML = isActive ? '<i class="fas fa-power-off"></i> إيقاف المغناطيس' : '<i class="fas fa-power-off"></i> تشغيل المغناطيس';
    this.classList.toggle('active-tool', isActive);
    if (!isActive && coreType==='steel') residualStrength = strengthPercent*(0.15+Math.random()*0.1);
    else if (!isActive) residualStrength = 0;
    updateUI();
    addObservation(isActive?'تشغيل المغناطيس':'إيقاف المغناطيس');
});
document.getElementById('resetViewBtn').addEventListener('click', () => { camera.position.set(4.2,2.8,5.5); controls.target.set(0,0,0); controls.update(); });
document.getElementById('dropNailBtn').addEventListener('click', () => {
    if (metalObjects.length) {
        const obj = metalObjects[Math.floor(Math.random()*metalObjects.length)];
        obj.position.copy(obj.userData.origPos).add(new THREE.Vector3(0,1.5,0));
        obj.userData.wasLifted = false;
        addObservation(`إسقاط ${obj.userData.label}`);
    }
});
document.getElementById('resetMetalsBtn').addEventListener('click', () => {
    metalObjects.forEach(obj => { obj.position.copy(obj.userData.origPos); obj.userData.attached=false; obj.userData.wasLifted=false; });
    liftedCount = 0;
    if (heavyObject) { scene.remove(heavyObject); heavyObject = null; }
    document.getElementById('liftingResult').innerHTML = '⚪ في انتظار الاختبار...';
    document.getElementById('liftedCount').textContent = '0';
    addObservation('إعادة المعادن لمواضعها');
});

function animate() {
    requestAnimationFrame(animate);
    updateFieldParticles(isActive ? strengthPercent : residualStrength);
    updateAttraction(isActive ? strengthPercent : residualStrength);
    updateCompass(isActive ? strengthPercent : residualStrength);
    updateCurrentParticles();
    controls.update();
    composer.render();
}

rebuildWindings(turns); createMetalObjects(); updateUI(); createFieldLines(strengthPercent); animate();
addObservation('بدء المحاكاة – الإعدادات الافتراضية');

window.addEventListener('resize', () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w,h); composer.setSize(w,h); camera.aspect = w/h; camera.updateProjectionMatrix();
});
</script>
<script>
    window.WATERMARK_USER = {
        name: <?=json_encode($user_name)?>,
        contact: <?=json_encode($user_contact)?>
    };
</script>
<script src="../js/watermark.js?v=<?=time()?>"></script>
</body>
</html>