<?php
require_once '../config.php';
require_once '../functions.php';

$sub = isAuthenticated();

$user_name = $_SESSION['user']['name'] ?? $_SESSION['user_name'] ?? 'معلم معتمد';
$user_contact = $_SESSION['user']['whatsappNumber'] ?? $_SESSION['user']['phone'] ?? $_SESSION['user']['email'] ?? '';

$exp_active = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM experiments WHERE id = 4"))['is_active'];
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
    <title>قوانين نيوتن للحركة | مختبرات العلوم التقنية</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --teal-900:#002d3d;--teal-800:#004e66;--teal-700:#006b8a;
            --teal-600:#0089ae;--teal-500:#00a8d4;--teal-400:#2ec4e8;
            --teal-300:#7ddcf0;--teal-100:#cff0f9;--teal-50:#e8f8fd;
            --white:#ffffff;
            --glass-bg:rgba(255,255,255,.76);
            --glass-border:rgba(255,255,255,.60);
            --glass-shadow:0 8px 32px rgba(0,0,0,.07);
            --gray-50:#f8fafc;--gray-100:#f1f5f9;--gray-200:#e2e8f0;
            --gray-300:#cbd5e1;--gray-400:#94a3b8;--gray-500:#64748b;
            --gray-600:#475569;--gray-700:#334155;--gray-800:#1e293b;
            --success:#10b981;--warning:#f59e0b;--error:#dc2626;
            --inst-bg:#e8f5fa;--inst-border:#b2dfee;
            --inst-label:#4a7a8a;--inst-val:#006b8a;--inst-unit:#6aabb8;
            --r-xl:32px;--r-lg:24px;--r-md:18px;--r-sm:14px;
            --transition:0.28s cubic-bezier(.4,0,.2,1);
        }
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Cairo',sans-serif;background:#f0f4f9;
            background-image:radial-gradient(circle at 10% 20%,rgba(0,137,174,.05) 0%,transparent 50%),
                radial-gradient(circle at 90% 70%,rgba(46,196,232,.04) 0%,transparent 50%);
            color:var(--gray-800);min-height:100vh;display:flex;flex-direction:column;}

        @keyframes fadeInUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 8px rgba(16,185,129,.5)}50%{box-shadow:0 0 24px rgba(16,185,129,.85)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 12px rgba(0,168,212,.35)}50%{box-shadow:0 0 28px rgba(0,168,212,.75)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
        @keyframes bounceIn{0%{transform:scale(.3);opacity:0}50%{transform:scale(1.07)}70%{transform:scale(.96)}100%{transform:scale(1);opacity:1}}
        @keyframes stallPulse{0%,100%{background:rgba(245,158,11,.08)}50%{background:rgba(245,158,11,.18)}}

        /* Header */
        .lab-header{width:100%;display:flex;align-items:center;justify-content:space-between;
            background:rgba(255,255,255,.90);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
            border-bottom:2px solid rgba(0,78,102,.10);padding:12px 32px;
            box-shadow:0 4px 24px -10px rgba(0,0,0,.06);gap:20px;flex-wrap:wrap;
            position:sticky;top:0;z-index:100;}
        .lab-brand{display:flex;align-items:center;gap:14px;text-decoration:none;transition:var(--transition);}
        .lab-brand:hover{transform:scale(1.02);}
        .lab-brand img{height:46px;width:46px;border-radius:14px;box-shadow:0 4px 12px rgba(0,0,0,.05);}
        .lab-brand span{font-weight:800;color:var(--teal-800);font-size:1.1rem;}
        .exp-badge{background:linear-gradient(135deg,var(--teal-700),var(--teal-500));color:white;
            padding:8px 26px;border-radius:50px;font-weight:700;font-size:.88rem;
            display:flex;align-items:center;gap:10px;box-shadow:0 8px 20px rgba(0,107,138,.22);transition:var(--transition);}
        .exp-badge:hover{transform:scale(1.05);}
        .exit-btn{background:rgba(255,255,255,.75);border:1px solid rgba(220,38,38,.15);
            padding:10px 24px;border-radius:50px;color:var(--error);text-decoration:none;
            font-weight:700;transition:var(--transition);font-size:.88rem;display:flex;align-items:center;gap:8px;}
        .exit-btn:hover{background:#fee2e2;transform:translateX(6px);}

        /* Layout */
        .main{max-width:1440px;margin:20px auto;padding:0 20px;
            display:grid;grid-template-columns:1fr 380px;gap:20px;align-items:start;flex:1;}

        /* Law Tabs */
        .law-tabs{grid-column:1/-1;display:flex;gap:10px;
            background:var(--glass-bg);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
            border:1px solid var(--glass-border);border-radius:var(--r-lg);
            padding:8px;box-shadow:var(--glass-shadow);}
        .law-tab{flex:1;padding:14px 16px;border-radius:var(--r-md);border:none;
            background:transparent;color:var(--gray-500);font-family:'Cairo',sans-serif;
            font-size:.85rem;font-weight:700;cursor:pointer;
            display:flex;align-items:center;justify-content:center;gap:8px;
            transition:all .3s cubic-bezier(.4,0,.2,1);text-align:center;}
        .law-tab.active{background:linear-gradient(135deg,var(--teal-700),var(--teal-500));
            color:white;box-shadow:0 8px 20px -6px rgba(0,107,138,.35);transform:translateY(-2px);}
        .law-tab:not(.active):hover{background:var(--teal-50);color:var(--teal-800);transform:translateY(-3px);}
        .law-num{width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.06);
            display:flex;align-items:center;justify-content:center;font-size:.75rem;
            font-weight:800;transition:var(--transition);flex-shrink:0;}
        .law-tab.active .law-num{background:rgba(255,255,255,.22);}
        .law-tab:hover .law-num{transform:rotate(360deg);}

        /* Canvas */
        .canvas-wrapper{background:var(--glass-bg);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
            border-radius:var(--r-xl);border:1px solid var(--glass-border);overflow:hidden;
            box-shadow:var(--glass-shadow);animation:fadeInUp .6s ease;transition:border-color .3s,box-shadow .3s;}
        .canvas-wrapper:hover{box-shadow:0 24px 48px -16px rgba(0,0,0,.10);}
        .canvas-header{padding:14px 20px;border-bottom:1px solid var(--gray-100);
            background:rgba(255,255,255,.55);display:flex;justify-content:space-between;
            align-items:center;font-weight:700;font-size:.85rem;flex-wrap:wrap;gap:10px;}
        .live-dot{width:10px;height:10px;border-radius:50%;background:var(--success);
            animation:pulse 2s infinite;display:inline-block;margin-left:8px;}
        .live-dot.paused-dot{background:var(--warning);animation:none;}
        #newtonCanvas{display:block;width:100%;height:460px;background:#f7fbfd;}
        .canvas-footer{padding:12px 20px;border-top:1px solid var(--gray-100);
            background:rgba(255,255,255,.55);display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
        .timer-display{font-family:'JetBrains Mono',monospace;font-size:1.2rem;font-weight:700;
            color:var(--teal-700);background:var(--teal-50);padding:8px 16px;border-radius:40px;
            display:flex;align-items:center;gap:8px;border:2px solid var(--teal-100);
            transition:var(--transition);animation:glowPulse 3s infinite;}
        .timer-display.paused{animation:none;border-color:var(--warning);color:var(--warning);background:#fffbeb;}

        /* Stall warning */
        .stall-warning{display:none;grid-column:1/-1;background:linear-gradient(135deg,#fffbeb,#fef3c7);
            border:1.5px solid var(--warning);border-radius:var(--r-md);padding:12px 18px;
            font-size:.82rem;font-weight:700;color:#92400e;gap:10px;align-items:center;
            animation:stallPulse 1.5s infinite,fadeInUp .3s ease;}
        .stall-warning.show{display:flex;}

        /* Side Panel */
        .side-panel{display:flex;flex-direction:column;gap:16px;}
        .control-card{background:var(--glass-bg);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
            border-radius:var(--r-md);padding:18px;border:1px solid var(--glass-border);
            box-shadow:var(--glass-shadow);transition:all .3s cubic-bezier(.4,0,.2,1);animation:fadeInUp .6s ease;}
        .control-card:hover{box-shadow:0 16px 40px rgba(0,0,0,.09);transform:translateY(-3px);background:rgba(255,255,255,.90);}
        .card-title{font-weight:800;font-size:.82rem;margin-bottom:14px;color:var(--teal-800);
            display:flex;align-items:center;gap:8px;border-right:4px solid var(--teal-600);padding-right:12px;}
        .slider-group{margin-bottom:14px;}
        .slider-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
        .slider-name{font-size:.8rem;font-weight:700;color:var(--gray-700);}
        .slider-val{font-size:.82rem;font-weight:800;color:var(--teal-700);
            background:var(--teal-50);padding:3px 12px;border-radius:40px;font-family:'JetBrains Mono',monospace;}
        input[type="range"]{-webkit-appearance:none;width:100%;height:10px;border-radius:10px;
            background:linear-gradient(to left,var(--gray-200),var(--gray-100));outline:none;cursor:pointer;}
        input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:28px;
            border-radius:50%;background:linear-gradient(135deg,var(--teal-700),var(--teal-500));
            cursor:pointer;border:3px solid white;box-shadow:0 4px 14px rgba(0,137,174,.35);transition:all .2s ease;}
        input[type="range"]::-webkit-slider-thumb:hover{transform:scale(1.2);}
        .slider-labels{display:flex;justify-content:space-between;font-size:.65rem;color:var(--gray-400);margin-top:4px;}

        /* Playback */
        .playback-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}
        .pb-btn{flex:1;min-width:38px;padding:9px 5px;border-radius:35px;
            border:2px solid var(--teal-200);background:var(--white);color:var(--teal-700);
            font-family:'Cairo',sans-serif;font-weight:700;font-size:.72rem;cursor:pointer;
            transition:all .25s ease;display:flex;align-items:center;justify-content:center;gap:4px;}
        .pb-btn:hover{background:var(--teal-600);color:white;border-color:var(--teal-600);
            box-shadow:0 6px 16px rgba(0,107,138,.25);transform:translateY(-2px);}
        .pb-btn:active{transform:scale(.94);}
        .pb-btn.active-speed{background:var(--teal-700);color:white;border-color:var(--teal-700);}
        .pb-btn.playing{background:var(--success);color:white;border-color:var(--success);}

        /* Achievements */
        .achievement-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}
        .ach-badge{padding:6px 12px;border-radius:35px;font-size:.7rem;font-weight:700;
            background:var(--gray-100);color:var(--gray-500);display:flex;align-items:center;gap:5px;transition:var(--transition);}
        .ach-badge.earned{background:#ecfdf5;color:var(--success);border:1px solid rgba(16,185,129,.3);animation:bounceIn .6s ease;}

        /* Instruments */
        .instrument-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;}
        .instrument{background:var(--inst-bg);border-radius:14px;padding:10px 12px;text-align:center;
            border:1.5px solid var(--inst-border);transition:var(--transition);}
        .instrument:hover{border-color:var(--teal-400);box-shadow:0 0 18px rgba(0,168,212,.15);}
        .instrument-label{font-size:.65rem;color:var(--inst-label);margin-bottom:4px;font-weight:600;}
        .instrument-value{font-family:'JetBrains Mono',monospace;font-size:1rem;font-weight:700;color:var(--inst-val);}
        .instrument-unit{font-size:.6rem;color:var(--inst-unit);}

        /* Graph Card */
        .graph-card{grid-column:1/-1;background:var(--glass-bg);backdrop-filter:blur(12px);
            -webkit-backdrop-filter:blur(12px);border-radius:var(--r-xl);border:1px solid var(--glass-border);
            box-shadow:var(--glass-shadow);padding:18px;}
        .graph-tabs{display:flex;gap:5px;margin-bottom:14px;flex-wrap:wrap;}
        .graph-tab{padding:8px 14px;border-radius:28px;border:1px solid var(--gray-200);background:white;
            font-family:'Cairo',sans-serif;font-weight:700;font-size:.74rem;cursor:pointer;
            transition:var(--transition);color:var(--gray-600);}
        .graph-tab.active{background:var(--teal-600);color:white;border-color:var(--teal-600);}
        .graph-tab:hover:not(.active){background:var(--teal-50);color:var(--teal-700);}
        #graphCanvas{display:block;width:100%;height:260px;background:#fdfdfd;
            border-radius:var(--r-md);border:1px solid var(--gray-100);}
        .graph-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}
        .graph-action-btn{padding:7px 14px;border-radius:28px;border:1px solid var(--gray-200);background:white;
            font-family:'Cairo',sans-serif;font-weight:600;font-size:.7rem;cursor:pointer;
            transition:var(--transition);display:flex;align-items:center;gap:5px;}
        .graph-action-btn:hover{background:var(--teal-50);border-color:var(--teal-300);color:var(--teal-700);}
        .graph-action-btn.compare-active{background:var(--teal-600);color:white;border-color:var(--teal-600);}
        .graph-legend-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;font-size:.68rem;color:var(--gray-600);}
        .legend-item{display:flex;align-items:center;gap:5px;padding:3px 8px;border-radius:20px;
            background:var(--gray-50);border:1px solid var(--gray-200);}
        .legend-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
        .legend-line{width:18px;height:3px;border-radius:2px;flex-shrink:0;}

        /* Data Table */
        .data-table-wrap{grid-column:1/-1;background:var(--glass-bg);backdrop-filter:blur(12px);
            -webkit-backdrop-filter:blur(12px);border-radius:var(--r-xl);border:1px solid var(--glass-border);
            box-shadow:var(--glass-shadow);overflow:hidden;max-height:200px;overflow-y:auto;}
        .data-table-wrap table{width:100%;border-collapse:collapse;font-size:.72rem;}
        .data-table-wrap th{background:var(--teal-700);color:white;padding:9px 10px;font-weight:700;
            position:sticky;top:0;font-family:'JetBrains Mono',monospace;font-size:.68rem;}
        .data-table-wrap td{padding:7px 10px;text-align:center;border-bottom:1px solid var(--gray-100);
            font-family:'JetBrains Mono',monospace;font-size:.68rem;}
        .data-table-wrap tr:hover td{background:var(--teal-50);}

        /* Investigation */
        .investigation-card{grid-column:1/-1;background:var(--glass-bg);backdrop-filter:blur(12px);
            -webkit-backdrop-filter:blur(12px);border-radius:var(--r-xl);border:1px solid var(--glass-border);
            box-shadow:var(--glass-shadow);padding:20px;animation:fadeInUp .6s ease;}
        .investigation-title{font-weight:800;font-size:1rem;color:var(--teal-800);margin-bottom:14px;
            display:flex;align-items:center;gap:8px;}
        .investigation-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;}
        .investigation-item{background:white;border-radius:var(--r-md);padding:14px;
            border:1px solid var(--gray-200);transition:var(--transition);}
        .investigation-item:hover{box-shadow:var(--glass-shadow);transform:translateY(-2px);}
        .investigation-q{font-weight:700;font-size:.8rem;margin-bottom:8px;color:var(--gray-700);}
        .investigation-options{display:flex;flex-direction:column;gap:5px;}
        .inv-opt{padding:8px 12px;border-radius:22px;border:1px solid var(--gray-200);
            background:var(--gray-50);font-family:'Cairo',sans-serif;font-size:.72rem;
            font-weight:600;cursor:pointer;transition:var(--transition);text-align:right;}
        .inv-opt:hover{background:var(--teal-50);border-color:var(--teal-300);color:var(--teal-700);}
        .inv-opt.correct{background:#ecfdf5;border-color:var(--success);color:var(--success);}
        .inv-opt.wrong{background:#fef2f2;border-color:var(--error);color:var(--error);}
        .inv-feedback{font-size:.7rem;margin-top:6px;padding:6px 10px;border-radius:12px;display:none;}
        .inv-feedback.show{display:block;animation:fadeInUp .3s ease;}

        /* Modal */
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.50);
            z-index:200;display:flex;align-items:center;justify-content:center;animation:fadeInUp .3s ease;}
        .modal-overlay.hidden{display:none;}
        .modal-box{background:white;border-radius:var(--r-xl);padding:28px;max-width:500px;width:90%;
            box-shadow:0 24px 60px rgba(0,0,0,.2);text-align:center;animation:bounceIn .5s ease;}
        .modal-box h3{color:var(--teal-800);margin-bottom:14px;}
        .modal-option{display:block;width:100%;padding:12px;margin:6px 0;border-radius:28px;
            border:2px solid var(--gray-200);background:var(--gray-50);font-family:'Cairo',sans-serif;
            font-weight:600;cursor:pointer;transition:var(--transition);font-size:.85rem;}
        .modal-option:hover{background:var(--teal-50);border-color:var(--teal-400);}
        .modal-close{margin-top:12px;padding:10px 28px;border-radius:30px;background:var(--teal-600);
            color:white;border:none;font-family:'Cairo',sans-serif;font-weight:700;cursor:pointer;transition:var(--transition);}
        .modal-close:hover{background:var(--teal-700);}

        /* Explanation */
        .explanation-panel{position:fixed;bottom:20px;left:20px;background:rgba(0,60,80,.93);
            backdrop-filter:blur(16px);color:white;padding:14px 20px;border-radius:20px;z-index:150;
            max-width:340px;font-size:.78rem;line-height:1.6;box-shadow:0 12px 40px rgba(0,0,0,.28);
            animation:slideInRight .4s ease;border:1px solid rgba(46,196,232,.25);}
        .explanation-panel.hidden{display:none;}
        .explanation-panel .step-num{display:inline-block;background:var(--teal-500);color:white;
            width:22px;height:22px;border-radius:50%;text-align:center;line-height:22px;
            font-size:.7rem;font-weight:800;margin-left:8px;}
        .explanation-panel .close-explanation{position:absolute;top:8px;left:12px;background:none;
            border:none;color:rgba(255,255,255,.6);cursor:pointer;font-size:1rem;}
        .explanation-panel .close-explanation:hover{color:white;}

        /* Toast */
        .toast{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
            background:var(--teal-800);color:white;padding:12px 28px;border-radius:50px;
            font-weight:700;font-size:.85rem;z-index:999;opacity:0;pointer-events:none;
            transition:opacity .4s ease;box-shadow:0 12px 32px rgba(0,0,0,.2);}
        .toast.show{opacity:1;pointer-events:auto;}

        /* Footer */
        .lab-footer{width:100%;background:rgba(255,255,255,.80);backdrop-filter:blur(20px);
            -webkit-backdrop-filter:blur(20px);border-top:2px solid rgba(0,78,102,.08);
            padding:16px 0;margin-top:20px;box-shadow:0 -4px 20px -8px rgba(0,0,0,.04);}
        .footer-content{max-width:1440px;margin:0 auto;padding:0 24px;
            display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:20px;}
        .footer-code{display:flex;align-items:center;gap:12px;background:var(--white);
            padding:10px 20px;border-radius:50px;border:1px solid var(--gray-200);
            box-shadow:0 2px 8px rgba(0,0,0,.03);}
        .footer-code code{background:var(--teal-50);color:var(--teal-700);
            font-family:'JetBrains Mono',monospace;font-weight:700;padding:6px 16px;
            border-radius:30px;font-size:.85rem;cursor:pointer;transition:var(--transition);
            border:1px solid var(--teal-100);}
        .footer-code code:hover{background:var(--teal-600);color:white;border-color:var(--teal-600);}
        .footer-copy{background:var(--teal-600);color:white;border:none;padding:8px 16px;
            border-radius:30px;font-family:'Cairo',sans-serif;font-weight:700;font-size:.8rem;
            cursor:pointer;transition:var(--transition);display:flex;align-items:center;gap:8px;}
        .footer-copy:hover{background:var(--teal-700);transform:scale(1.05);}

        @media(max-width:1000px){
            .main{grid-template-columns:1fr;}
            #newtonCanvas{height:340px;}
            #graphCanvas{height:200px;}
            .footer-content{flex-direction:column;text-align:center;}
        }
        @media(max-width:600px){
            .lab-header{padding:10px 14px;}
            .law-tab{padding:8px 6px;font-size:.68rem;gap:4px;}
            .law-tab .law-num{width:22px;height:22px;font-size:.65rem;}
            #newtonCanvas{height:260px;}
            .timer-display{font-size:.9rem;padding:6px 10px;}
            .investigation-grid{grid-template-columns:1fr;}
            .explanation-panel{max-width:90%;left:5%;bottom:10px;}
        }
    </style>
</head>
<body>

<header class="lab-header">
    <a href="../index.php" class="lab-brand">
        <img src="../logo2.png" alt="logo" onerror="this.style.display='none'">
        <span>مختبرات العلوم التقنية للجميع</span>
    </a>
    <div class="exp-badge"><i class="fas fa-running"></i> تجربة قوانين نيوتن</div>
    <a href="../index.php" class="exit-btn"><i class="fas fa-sign-out-alt"></i> خروج</a>
</header>

<div class="main">

    <!-- Stall warning (shown when friction > applied force) -->
    <div class="stall-warning" id="stallWarning">
        <i class="fas fa-exclamation-triangle" style="font-size:1.1rem;flex-shrink:0;"></i>
        <span id="stallMsg">⚠️ الاحتكاك أكبر من القوة المطبقة — الجسم لن يتحرك! زِد القوة أو قلّل الاحتكاك.</span>
    </div>

    <!-- Law Tabs -->
    <div class="law-tabs">
        <button class="law-tab active" data-law="1">
            <span class="law-num">①</span> القانون الأول: القصور الذاتي
        </button>
        <button class="law-tab" data-law="2">
            <span class="law-num">②</span> القانون الثاني: F=m×a
        </button>
        <button class="law-tab" data-law="3">
            <span class="law-num">③</span> القانون الثالث: الفعل ورد الفعل
        </button>
    </div>

    <!-- Canvas -->
    <div class="canvas-wrapper">
        <div class="canvas-header">
            <span><span class="live-dot" id="liveDot"></span> <span id="simStatus">⚙️ جاهز للتشغيل</span></span>
            <div class="timer-display" id="timerDisplay">
                <i class="fas fa-stopwatch"></i> <span id="timerValue">0.00</span> ث
            </div>
        </div>
        <canvas id="newtonCanvas"></canvas>
        <div class="canvas-footer">
            <span id="stateDesc" style="font-size:.78rem;color:var(--gray-600);flex:1;">اختر قانوناً واضبط المتغيرات ثم اضغط تشغيل.</span>
            <div class="playback-row" style="margin-top:0;">
                <button class="pb-btn" id="btnPlay"    title="تشغيل"><i class="fas fa-play"></i></button>
                <button class="pb-btn" id="btnPause"   title="إيقاف مؤقت"><i class="fas fa-pause"></i></button>
                <button class="pb-btn" id="btnResume"  title="متابعة"><i class="fas fa-forward"></i></button>
                <button class="pb-btn" id="btnReset"   title="إعادة ضبط"><i class="fas fa-redo"></i></button>
                <button class="pb-btn" id="btnExplain" title="تشغيل الشرح"><i class="fas fa-chalkboard-teacher"></i></button>
            </div>
        </div>
    </div>

    <!-- Side Panel -->
    <div class="side-panel">
        <div class="control-card">
            <div class="card-title"><i class="fas fa-sliders-h"></i> التحكم في المتغيرات</div>
            <div class="slider-group">
                <div class="slider-row">
                    <span class="slider-name">⚖️ الكتلة (m)</span>
                    <span class="slider-val" id="massVal">2.0 kg</span>
                </div>
                <input type="range" id="massSlider" min="0.5" max="10" value="2" step="0.1">
                <div class="slider-labels"><span>0.5 kg</span><span>10 kg</span></div>
            </div>
            <div class="slider-group">
                <div class="slider-row">
                    <span class="slider-name">💪 القوة المطبقة (F)</span>
                    <span class="slider-val" id="forceVal">10.0 N</span>
                </div>
                <input type="range" id="forceSlider" min="1" max="50" value="10" step="0.5">
                <div class="slider-labels"><span>1 N</span><span>50 N</span></div>
            </div>
            <!-- Law 1: initial velocity -->
            <div class="slider-group" id="initialVelocityGroup" style="display:none;">
                <div class="slider-row">
                    <span class="slider-name">🚀 السرعة الابتدائية</span>
                    <span class="slider-val" id="initVelVal">4.0 m/s</span>
                </div>
                <input type="range" id="initVelSlider" min="0" max="10" value="4" step="0.5">
                <div class="slider-labels"><span>0 (ساكن)</span><span>10 m/s</span></div>
            </div>
            <!-- Law 2 & 3: friction -->
            <div class="slider-group" id="frictionGroup" style="display:none;">
                <div class="slider-row">
                    <span class="slider-name">🪨 معامل الاحتكاك (μ)</span>
                    <span class="slider-val" id="frictionVal">0.00</span>
                </div>
                <input type="range" id="frictionSlider" min="0" max="0.8" value="0" step="0.02">
                <div class="slider-labels"><span>0 (بلا احتكاك)</span><span>0.8 (احتكاك عالٍ)</span></div>
                <div style="font-size:.68rem;color:var(--gray-500);margin-top:6px;line-height:1.5;">
                    💡 <span id="frictionHint">قوة الاحتكاك = <span id="frictionForceCalc">0.00</span> N</span>
                </div>
            </div>
        </div>

        <!-- Instruments -->
        <div class="control-card">
            <div class="card-title"><i class="fas fa-microchip"></i> شاشات القياس الرقمية</div>
            <div class="instrument-row">
                <div class="instrument">
                    <div class="instrument-label">🚀 التسارع (a)</div>
                    <div class="instrument-value" id="instAccel">0.00</div>
                    <div class="instrument-unit">m/s²</div>
                </div>
                <div class="instrument">
                    <div class="instrument-label">📏 السرعة (v)</div>
                    <div class="instrument-value" id="instVel">0.00</div>
                    <div class="instrument-unit">m/s</div>
                </div>
                <div class="instrument">
                    <div class="instrument-label">📍 الإزاحة (x)</div>
                    <div class="instrument-value" id="instDisp">0.00</div>
                    <div class="instrument-unit">m</div>
                </div>
                <div class="instrument">
                    <div class="instrument-label">⚡ القوة المحصلة</div>
                    <div class="instrument-value" id="instNetF">0.00</div>
                    <div class="instrument-unit">N</div>
                </div>
                <div class="instrument">
                    <div class="instrument-label">🔋 الطاقة KE</div>
                    <div class="instrument-value" id="instKE">0.00</div>
                    <div class="instrument-unit">J</div>
                </div>
                <div class="instrument">
                    <div class="instrument-label">💫 الزخم P</div>
                    <div class="instrument-value" id="instMom">0.00</div>
                    <div class="instrument-unit">kg·m/s</div>
                </div>
            </div>
        </div>

        <!-- Speed & Achievements -->
        <div class="control-card">
            <div class="card-title"><i class="fas fa-tachometer-alt"></i> سرعة المحاكاة</div>
            <div class="playback-row">
                <button class="pb-btn speed-btn" data-speed="0.25">0.25x</button>
                <button class="pb-btn speed-btn active-speed" data-speed="0.5">0.5x</button>
                <button class="pb-btn speed-btn" data-speed="1">1x</button>
                <button class="pb-btn speed-btn" data-speed="2">2x</button>
            </div>
            <div class="achievement-row" style="margin-top:10px;">
                <span class="ach-badge" id="achLaw1">🏅 القانون الأول</span>
                <span class="ach-badge" id="achLaw2">🏅 القانون الثاني</span>
                <span class="ach-badge" id="achLaw3">🏅 القانون الثالث</span>
            </div>
            <div style="font-size:.7rem;color:var(--gray-400);margin-top:8px;text-align:center;">
                نسبة التقدم: <strong id="progressPercent" style="color:var(--teal-600);">0%</strong>
            </div>
        </div>
    </div>

    <!-- Graph Card -->
    <div class="graph-card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:4px;">
            <div class="graph-tabs">
                <button class="graph-tab active" data-graph="vt">📈 السرعة – الزمن</button>
                <button class="graph-tab" data-graph="at">📉 التسارع – الزمن</button>
                <button class="graph-tab" data-graph="xt">📊 الإزاحة – الزمن</button>
            </div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:.65rem;color:var(--gray-400);">
                التجارب المحفوظة: <span id="runCount">0</span>/5
            </div>
        </div>
        <canvas id="graphCanvas"></canvas>
        <div class="graph-legend-row" id="graphLegend"></div>
        <div class="graph-actions">
            <button class="graph-action-btn" id="btnCompare"><i class="fas fa-balance-scale"></i> مقارنة التجارب</button>
            <button class="graph-action-btn" id="btnClearGraph"><i class="fas fa-eraser"></i> مسح السجل</button>
            <button class="graph-action-btn" id="btnExportPNG"><i class="fas fa-image"></i> حفظ PNG</button>
            <button class="graph-action-btn" id="btnExportCSV"><i class="fas fa-file-csv"></i> تصدير CSV</button>
        </div>
    </div>

    <!-- Data Table -->
    <div class="data-table-wrap">
        <table>
            <thead>
                <tr>
                    <th>الزمن (ث)</th><th>السرعة (م/ث)</th><th>التسارع (م/ث²)</th>
                    <th>الإزاحة (م)</th><th>القوة المحصلة (N)</th><th>KE (J)</th>
                </tr>
            </thead>
            <tbody id="dataTableBody">
                <tr><td colspan="6" style="color:var(--gray-400);padding:14px;">في انتظار بدء التجربة...</td></tr>
            </tbody>
        </table>
    </div>

    <!-- Investigation -->
    <div class="investigation-card">
        <div class="investigation-title">🔍 استكشف بنفسك</div>
        <div class="investigation-grid">
            <div class="investigation-item">
                <div class="investigation-q">ماذا يحدث إذا زادت القوة (عند ثبات الكتلة)؟</div>
                <div class="investigation-options">
                    <button class="inv-opt" data-answer="correct">يزداد التسارع</button>
                    <button class="inv-opt" data-answer="wrong">يقل التسارع</button>
                    <button class="inv-opt" data-answer="wrong">لا يتغير شيء</button>
                </div>
                <div class="inv-feedback"></div>
            </div>
            <div class="investigation-item">
                <div class="investigation-q">ماذا يحدث إذا زادت الكتلة (عند ثبات القوة)؟</div>
                <div class="investigation-options">
                    <button class="inv-opt" data-answer="wrong">يزداد التسارع</button>
                    <button class="inv-opt" data-answer="correct">يقل التسارع</button>
                    <button class="inv-opt" data-answer="wrong">يبقى التسارع ثابتاً</button>
                </div>
                <div class="inv-feedback"></div>
            </div>
            <div class="investigation-item">
                <div class="investigation-q">ما الذي يميّز القانون الثالث عن القانونَين الأول والثاني؟</div>
                <div class="investigation-options">
                    <button class="inv-opt" data-answer="correct">يصف تفاعل جسمَين مع بعضهما</button>
                    <button class="inv-opt" data-answer="wrong">يصف حركة جسم واحد فقط</button>
                    <button class="inv-opt" data-answer="wrong">يُلغي تأثير القوة على الحركة</button>
                </div>
                <div class="inv-feedback"></div>
            </div>
        </div>
    </div>
</div>

<!-- Explanation Panel -->
<div class="explanation-panel hidden" id="explanationPanel">
    <button class="close-explanation" id="closeExplanation">✕</button>
    <div id="explanationContent"><strong>الشرح التلقائي</strong><br>في انتظار بدء التجربة...</div>
</div>

<!-- Conclusion Modal -->
<div class="modal-overlay hidden" id="conclusionModal">
    <div class="modal-box" id="conclusionBox"></div>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<!-- Footer -->
<footer class="lab-footer">
    <div class="footer-content">
        <div class="footer-code">
            <i class="fas fa-key" style="color:var(--teal-600);"></i>
            <span>كود الدخول:</span>
            <code id="accessCodeDisplay" onclick="copyAccessCode()" title="انقر للنسخ"><?php echo htmlspecialchars($code_used); ?></code>
            <button class="footer-copy" onclick="copyAccessCode()">
                <i id="copyIcon" class="fas fa-copy"></i>
            </button>
        </div>
    </div>
</footer>

<script>
function copyAccessCode(){
    var code=document.getElementById('accessCodeDisplay').textContent.trim();
    navigator.clipboard.writeText(code).then(function(){
        var icon=document.getElementById('copyIcon');
        icon.className='fas fa-check';icon.style.color='#10b981';
        setTimeout(function(){icon.className='fas fa-copy';icon.style.color='';},2000);
    }).catch(function(){alert('تعذر نسخ الكود');});
}

(function(){
'use strict';

/* ── DOM ── */
const NC  = document.getElementById('newtonCanvas');
const nctx = NC.getContext('2d');
const GC  = document.getElementById('graphCanvas');
const gctx = GC.getContext('2d');
const timerValue    = document.getElementById('timerValue');
const timerDisplay  = document.getElementById('timerDisplay');
const liveDot       = document.getElementById('liveDot');
const simStatusEl   = document.getElementById('simStatus');
const stateDesc     = document.getElementById('stateDesc');
const dataTableBody = document.getElementById('dataTableBody');
const graphLegend   = document.getElementById('graphLegend');
const runCountEl    = document.getElementById('runCount');
const explPanel     = document.getElementById('explanationPanel');
const explContent   = document.getElementById('explanationContent');
const conclusionModal = document.getElementById('conclusionModal');
const conclusionBox   = document.getElementById('conclusionBox');
const toast           = document.getElementById('toast');
const progressEl      = document.getElementById('progressPercent');
const stallWarning    = document.getElementById('stallWarning');
const stallMsg        = document.getElementById('stallMsg');
const frictionForceCalc = document.getElementById('frictionForceCalc');
const btnCompare      = document.getElementById('btnCompare');

/* ── State ── */
let law=1, mass=2.0, force=10, mu=0, v0=4.0;
let simSpeed=0.5, running=false, paused=false;
let t=0, pos=0, vel=0, acc=0, netF=0;
const DMAX=10;

/* Law-3 state machine */
let L3phase='approach'; // 'approach'|'bounced'|'done'
let L3bounceVel=0;
let sparks=[];

/* Data */
let dataLog=[], dlCounter=0;
let graphHistory=[];   // array of saved run objects
let compareMode=false; // true = show all runs overlaid
let graphType='vt';

/* Misc */
let achievedLaws=new Set();
let explMode=false;
let frameN=0;
let lastTs=performance.now();
const COLORS=['#0089ae','#10b981','#f59e0b','#7c3aed','#ef4444'];
const NAMES=['التجربة 1','التجربة 2','التجربة 3','التجربة 4','التجربة 5'];

/* ── Canvas sizing ── */
let cW=800,cH=460,gW=700,gH=260;

function sizeNC(){
    const r=NC.parentElement.getBoundingClientRect();
    const d=Math.min(devicePixelRatio||1,2);
    cW=r.width; cH=Math.max(260,Math.min(480,cW*.55));
    NC.width=cW*d; NC.height=cH*d;
    NC.style.width=cW+'px'; NC.style.height=cH+'px';
    nctx.setTransform(1,0,0,1,0,0); nctx.scale(d,d);
}
function sizeGC(){
    const r=GC.parentElement.getBoundingClientRect();
    const d=Math.min(devicePixelRatio||1,2);
    gW=Math.max(200,r.width-4); gH=260;
    GC.width=gW*d; GC.height=gH*d;
    GC.style.width=gW+'px'; GC.style.height=gH+'px';
    gctx.setTransform(1,0,0,1,0,0); gctx.scale(d,d);
}
function sizeAll(){ sizeNC(); sizeGC(); }
sizeAll();
window.addEventListener('resize',()=>{ sizeAll(); drawNC(); drawG(); });

/* ── Physics helpers ── */
function calcNet(){
    const ff=mu*mass*9.8;
    if(law===1){ netF=0; acc=0; }
    else { netF=Math.max(0,force-ff); acc=netF/mass; }
}
function isStalled(){ return law!==1 && (force - mu*mass*9.8)<=0; }
function frictionForce(){ return mu*mass*9.8; }

/* ── Stall warning ── */
function updateStallWarning(){
    if(law===1){ stallWarning.classList.remove('show'); return; }
    const ff=frictionForce();
    if(force<=ff){
        stallMsg.textContent=`⚠️ الاحتكاك (${ff.toFixed(1)} N) أكبر من القوة (${force} N) — الجسم لن يتحرك! زِد القوة أو قلّل الاحتكاك.`;
        stallWarning.classList.add('show');
    } else {
        stallWarning.classList.remove('show');
    }
    if(frictionForceCalc) frictionForceCalc.textContent=ff.toFixed(2);
}

/* ── Physics step ── */
function step(rawDt){
    if(!running||paused) return;
    const dt=Math.min(rawDt*simSpeed,.05);
    t+=dt; frameN++;

    if(law===1){
        vel=v0; acc=0; netF=0;
        pos+=vel*dt;
        if(pos>=DMAX){ pos=DMAX; running=false; onDone(); }

    } else if(law===2){
        calcNet();
        vel+=acc*dt; pos+=vel*dt;
        if(pos>=DMAX){ pos=DMAX; vel=0; running=false; onDone(); }
        // stall mid-run
        if(acc===0 && vel<=0 && pos>0 && pos<DMAX){
            running=false; onDone();
        }

    } else { // law 3
        calcNet();
        if(L3phase==='approach'){
            vel+=acc*dt; pos+=vel*dt;
            if(pos>=DMAX){
                pos=DMAX; L3bounceVel=vel;
                vel=-vel*0.65;
                L3phase='bounced';
                spawnSparks();
                updateStatus('collision');
            }
        } else if(L3phase==='bounced'){
            // gentle deceleration after bounce
            const decel=(mu*mass*9.8 + 0.9*mass)/mass;
            if(vel<0){ vel+=decel*dt; if(vel>0) vel=0; }
            pos+=vel*dt;
            if(pos<0){ pos=0; vel=0; }
            // fade sparks
            sparks=sparks.filter(s=>{
                s.x+=s.vx*dt*60; s.y+=s.vy*dt*60;
                s.vy+=0.12*dt*60; s.life-=0.025*dt*60;
                return s.life>0;
            });
            if(vel>=-0.02){ vel=0; L3phase='done'; running=false; onDone(); }
        }
    }

    // log every 4th frame
    dlCounter++;
    if(dlCounter%4===0 && dataLog.length<600){
        dataLog.push({
            t:+t.toFixed(3), v:+Math.abs(vel).toFixed(3),
            a:+acc.toFixed(3), x:+pos.toFixed(3),
            nf:+netF.toFixed(2), ke:+(0.5*mass*vel*vel).toFixed(3)
        });
    }
    if(explMode) updateExpl();
}

function spawnSparks(){
    sparks=[];
    for(let i=0;i<30;i++){
        const ang=Math.random()*Math.PI*2, sp=1.5+Math.random()*5;
        sparks.push({x:wx(DMAX),y:cH*.54,
            vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp-2.5,life:1,r:1.5+Math.random()*2.5});
    }
}

/* ── On sim complete ── */
function onDone(){
    updateDisp(); updateTable(false); drawNC(); drawG();
    saveRun();
    checkAch();
    showConclusion();
    updateStatus('done');
}

/* ════════════════════════════════════════
   GRAPH SAVE — fixed: no dedup by params,
   always save each completed run uniquely
   ════════════════════════════════════════ */
function saveRun(){
    if(dataLog.length<3) return;
    const run={
        id: Date.now(),
        law, mass, force, mu, v0,
        data: dataLog.map(d=>({...d})),   // deep copy
        color: COLORS[graphHistory.length % COLORS.length],
        name:  NAMES[graphHistory.length  % NAMES.length],
    };
    if(graphHistory.length>=5) graphHistory.shift();
    graphHistory.push(run);
    runCountEl.textContent=graphHistory.length;
    rebuildLegend();
    drawG();
}

/* ── Legend ── */
function rebuildLegend(){
    graphLegend.innerHTML=graphHistory.map(r=>`
        <span class="legend-item">
            <span class="legend-line" style="background:${r.color};${graphHistory.indexOf(r)===graphHistory.length-1?'':'border-bottom:2px dashed '+r.color+';background:transparent;'}"></span>
            ${r.name} · قانون ${r.law} · F=${r.force}N · m=${r.mass}kg
        </span>`).join('');
}

/* ─────────────────────────────────────────
   DRAW GRAPH — core fix
   compareMode=false → show only latest run
   compareMode=true  → show ALL saved runs
   ───────────────────────────────────────── */
function drawG(){
    const W=gW,H=gH;
    gctx.clearRect(0,0,W,H);
    gctx.fillStyle='#ffffff'; gctx.fillRect(0,0,W,H);
    const pad={l:54,r:16,t:20,b:34};
    const pW=W-pad.l-pad.r, pH=H-pad.t-pad.b;

    /* Decide which runs to draw */
    let runs=[];
    if(compareMode){
        // ALL saved runs (dashed historical + solid if current in-progress)
        runs=[...graphHistory];
    } else {
        // Only the most recent saved run OR current in-progress log
        if(dataLog.length>=2){
            runs=[{data:dataLog,color:'#0089ae',name:'الحالية',isCurrent:true,law,mass,force}];
        } else if(graphHistory.length>0){
            const last=graphHistory[graphHistory.length-1];
            runs=[{...last,isCurrent:true}];
        }
    }

    // If in compare mode but no runs yet, fall back to empty state
    if(runs.length===0){
        gctx.fillStyle='#94a3b8'; gctx.font='13px Cairo';
        gctx.textAlign='center';
        gctx.fillText(compareMode?'لا توجد تجارب محفوظة بعد — شغّل تجربة أولاً':'شغّل التجربة لرسم المنحنى البياني',W/2,H/2);
        gctx.textAlign='start'; return;
    }

    /* Global extents across all drawn runs */
    let maxT=0.1, maxVal=0.01;
    runs.forEach(r=>r.data.forEach(d=>{
        if(d.t>maxT) maxT=d.t;
        const v=graphType==='vt'?d.v:graphType==='at'?d.a:d.x;
        if(v>maxVal) maxVal=v;
    }));
    maxVal*=1.15; maxT=Math.max(maxT,.5);

    /* Grid */
    gctx.strokeStyle='rgba(0,78,102,.05)'; gctx.lineWidth=1;
    for(let i=0;i<=4;i++){const y=pad.t+i/4*pH;gctx.beginPath();gctx.moveTo(pad.l,y);gctx.lineTo(W-pad.r,y);gctx.stroke();}
    for(let i=0;i<=5;i++){const x=pad.l+i/5*pW;gctx.beginPath();gctx.moveTo(x,pad.t);gctx.lineTo(x,pad.t+pH);gctx.stroke();}

    /* Axes */
    gctx.strokeStyle='rgba(0,78,102,.20)'; gctx.lineWidth=1.5;
    gctx.beginPath();gctx.moveTo(pad.l,pad.t);gctx.lineTo(pad.l,pad.t+pH);gctx.stroke();
    gctx.beginPath();gctx.moveTo(pad.l,pad.t+pH);gctx.lineTo(W-pad.r,pad.t+pH);gctx.stroke();

    /* Y labels */
    gctx.fillStyle='#475569'; gctx.font='8px Cairo';
    for(let i=0;i<=4;i++){
        const v=(maxVal/4)*(4-i),y=pad.t+i/4*pH;
        gctx.textAlign='right'; gctx.fillText(v.toFixed(1),pad.l-5,y+3);
    }
    /* X labels */
    for(let i=0;i<=4;i++){
        const tl=(maxT/4)*i,x=pad.l+i/4*pW;
        gctx.textAlign='center'; gctx.fillText(tl.toFixed(1)+'ث',x,pad.t+pH+18);
    }
    gctx.textAlign='start';

    /* Axis units */
    const yUnit={vt:'م/ث',at:'م/ث²',xt:'م'}[graphType];
    gctx.save(); gctx.translate(10,pad.t+pH/2); gctx.rotate(-Math.PI/2);
    gctx.fillStyle='#94a3b8'; gctx.font='8px Cairo'; gctx.textAlign='center';
    gctx.fillText(yUnit,0,0); gctx.restore();
    gctx.fillStyle='#94a3b8'; gctx.font='8px Cairo'; gctx.textAlign='center';
    gctx.fillText('الزمن (ث)',pad.l+pW/2,pad.t+pH+30);

    /* Plot each run */
    runs.forEach((r,idx)=>{
        if(r.data.length<2) return;
        const isCurrent=!!r.isCurrent;
        // In compare mode: last run is solid, others dashed
        const isLast = compareMode && idx===runs.length-1;
        const solid  = !compareMode || isLast;

        gctx.beginPath();
        r.data.forEach((d,i)=>{
            const x=pad.l+(d.t/maxT)*pW;
            const v=graphType==='vt'?d.v:graphType==='at'?d.a:d.x;
            const y=pad.t+pH-(Math.max(0,v)/maxVal)*pH;
            i===0?gctx.moveTo(x,y):gctx.lineTo(x,y);
        });
        gctx.strokeStyle=r.color;
        gctx.lineWidth=solid?2.8:1.8;
        gctx.setLineDash(solid?[]:[7,4]);
        gctx.stroke();
        gctx.setLineDash([]);

        // Label at end of line (compare mode)
        if(compareMode && r.name){
            const last=r.data[r.data.length-1];
            const lx=pad.l+(last.t/maxT)*pW;
            const lv=graphType==='vt'?last.v:graphType==='at'?last.a:last.x;
            const ly=pad.t+pH-(Math.max(0,lv)/maxVal)*pH;
            gctx.fillStyle=r.color; gctx.font='bold 8px Cairo';
            gctx.textAlign='right';
            gctx.fillText(r.name,Math.min(lx+2,W-pad.r),ly-5);
        }
    });
    gctx.textAlign='start';

    /* Title */
    const titles={vt:'السرعة مقابل الزمن (V-T)',at:'التسارع مقابل الزمن (A-T)',xt:'الإزاحة مقابل الزمن (X-T)'};
    gctx.fillStyle='rgba(0,78,102,.45)'; gctx.font='bold 10px Cairo'; gctx.textAlign='center';
    gctx.fillText((compareMode?'مقارنة — ':'')+titles[graphType],W/2,pad.t-4);
    gctx.textAlign='start';
}

/* ── Draw Newton Canvas ── */
function wx(m){ return cW*.06+(m/DMAX)*cW*.88; }

function drawNC(){
    const W=cW,H=cH;
    nctx.clearRect(0,0,W,H);
    nctx.fillStyle='#f7fbfd'; nctx.fillRect(0,0,W,H);

    /* Grid */
    nctx.strokeStyle='rgba(0,78,102,.035)'; nctx.lineWidth=1;
    for(let x=0;x<W;x+=36){nctx.beginPath();nctx.moveTo(x,0);nctx.lineTo(x,H);nctx.stroke();}
    for(let y=0;y<H;y+=36){nctx.beginPath();nctx.moveTo(0,y);nctx.lineTo(W,y);nctx.stroke();}

    /* Ground */
    const gY=H*.73;
    const gg=nctx.createLinearGradient(0,gY,0,H);
    gg.addColorStop(0,'#e5f2f8');gg.addColorStop(1,'#ccdde6');
    nctx.fillStyle=gg; nctx.fillRect(0,gY,W,H-gY);
    nctx.strokeStyle='rgba(0,78,102,.10)'; nctx.lineWidth=2;
    nctx.beginPath(); nctx.moveTo(0,gY); nctx.lineTo(W,gY); nctx.stroke();

    /* Track */
    const tx0=W*.06, tx1=W*.94, tspan=tx1-tx0, tY=H*.58;
    nctx.shadowColor='rgba(0,78,102,.08)'; nctx.shadowBlur=8; nctx.shadowOffsetY=4;
    const tg=nctx.createLinearGradient(0,tY,0,tY+24);
    tg.addColorStop(0,'#e2ecf4'); tg.addColorStop(1,'#c2d2df');
    nctx.fillStyle=tg;
    nctx.beginPath(); nctx.roundRect(tx0-6,tY,tspan+12,24,5); nctx.fill();
    nctx.shadowBlur=0; nctx.shadowOffsetY=0;

    /* Track dash */
    nctx.setLineDash([10,8]); nctx.strokeStyle='rgba(0,78,102,.10)'; nctx.lineWidth=1;
    nctx.beginPath(); nctx.moveTo(tx0,tY+12); nctx.lineTo(tx1,tY+12); nctx.stroke();
    nctx.setLineDash([]);

    /* Metre marks */
    const fs=Math.max(9,W/90);
    for(let m=0;m<=DMAX;m++){
        const mx=tx0+(m/DMAX)*tspan;
        nctx.strokeStyle='rgba(0,78,102,.22)'; nctx.lineWidth=1;
        nctx.beginPath(); nctx.moveTo(mx,tY+24); nctx.lineTo(mx,tY+32); nctx.stroke();
        nctx.fillStyle='rgba(0,78,102,.40)'; nctx.font=`${fs}px Cairo`; nctx.textAlign='center';
        nctx.fillText(m+'م',mx,tY+44);
    }

    /* Start */
    nctx.fillStyle='#10b981';
    nctx.beginPath(); nctx.roundRect(tx0-3,tY-12,6,36,3); nctx.fill();
    nctx.font='bold 10px Cairo'; nctx.textAlign='center';
    nctx.fillText('بداية',tx0,tY-18);

    /* Wall */
    const wallGlow=(L3phase==='bounced'&&sparks.length>0)?Math.max(0,sparks[0].life*.7):0;
    nctx.shadowColor=`rgba(239,68,68,${wallGlow*.6})`; nctx.shadowBlur=wallGlow*24;
    const wg=nctx.createLinearGradient(tx1,0,tx1+18,0);
    wg.addColorStop(0,'#64748b'); wg.addColorStop(1,'#94a3b8');
    nctx.fillStyle=wg;
    nctx.beginPath(); nctx.roundRect(tx1-4,tY-30,20,72,5); nctx.fill();
    nctx.shadowBlur=0;
    for(let i=0;i<6;i++){
        nctx.strokeStyle='rgba(255,255,255,.20)'; nctx.lineWidth=1.5;
        nctx.beginPath(); nctx.moveTo(tx1+3,tY-22+i*10); nctx.lineTo(tx1+12,tY-22+i*10); nctx.stroke();
    }
    nctx.fillStyle='rgba(100,116,139,.55)'; nctx.font='bold 9px Cairo'; nctx.textAlign='center';
    nctx.fillText('جدار',tx1+8,tY-36); nctx.textAlign='start';

    /* Body */
    const bx=wx(pos), by=tY-4;
    const bW=Math.max(48,W*.06), bH=bW*.65;
    nctx.shadowColor='rgba(0,78,102,.15)'; nctx.shadowBlur=12; nctx.shadowOffsetY=5;
    const bg=nctx.createLinearGradient(bx-bW/2,by-bH,bx+bW/2,by);
    bg.addColorStop(0,'#2ec4e8'); bg.addColorStop(.4,'#0089ae'); bg.addColorStop(1,'#004e66');
    nctx.fillStyle=bg;
    nctx.beginPath(); nctx.roundRect(bx-bW/2,by-bH,bW,bH,7); nctx.fill();
    nctx.shadowBlur=0; nctx.shadowOffsetY=0;
    nctx.strokeStyle='rgba(255,255,255,.30)'; nctx.lineWidth=1.5;
    nctx.beginPath(); nctx.moveTo(bx-bW/2+7,by-bH+3); nctx.lineTo(bx+bW/2-7,by-bH+3); nctx.stroke();

    /* Wheels */
    [[bx-bW/3,by],[bx+bW/3,by]].forEach(([wx2,wy])=>{
        const wg2=nctx.createRadialGradient(wx2,wy,0,wx2,wy,9);
        wg2.addColorStop(0,'#94a3b8'); wg2.addColorStop(1,'#475569');
        nctx.beginPath(); nctx.arc(wx2,wy,9,0,Math.PI*2); nctx.fillStyle=wg2; nctx.fill();
        nctx.strokeStyle='#cbd5e1'; nctx.lineWidth=1;
        nctx.beginPath(); nctx.arc(wx2,wy,5.5,0,Math.PI*2); nctx.stroke();
        nctx.beginPath(); nctx.arc(wx2,wy,2.5,0,Math.PI*2); nctx.fillStyle='#e2e8f0'; nctx.fill();
    });

    /* Mass label */
    nctx.fillStyle='rgba(255,255,255,.92)';
    nctx.font=`bold ${Math.max(10,bW/4.2)}px Cairo`;
    nctx.textAlign='center'; nctx.fillText(mass.toFixed(1)+'kg',bx,by-bH/2+4);

    /* Speed floating label */
    if((running||pos>0)&&Math.abs(vel)>.05){
        nctx.fillStyle='rgba(0,78,102,.50)'; nctx.font='bold 10px JetBrains Mono,monospace';
        nctx.textAlign='center'; nctx.fillText(Math.abs(vel).toFixed(2)+' م/ث',bx,by-bH-14);
    }
    nctx.textAlign='start';

    /* Force arrows */
    const aY=by-bH/2;
    if(law===1&&running&&v0>0){
        arrow(bx+bW/2+4,aY,1,Math.min(70,v0*13),'#3b82f6',2.5,'v ثابتة');
        nctx.fillStyle='rgba(0,78,102,.30)'; nctx.font='11px Cairo'; nctx.textAlign='center';
        nctx.fillText('ΣF = 0',bx,aY-30); nctx.textAlign='start';
    } else if(law===2&&(running||pos>0)&&force>0){
        const al=Math.min(80,force*2.5);
        arrow(bx+bW/2+4,aY,1,al,'#10b981',3,'F='+force.toFixed(1)+'N');
        if(mu>0){
            const fl=Math.min(50,mu*mass*9.8*4);
            arrow(bx-bW/2-4,aY,-1,fl,'#ef4444',2,'احتكاك');
        }
        if(acc>0.01) arrow(bx+bW/2+al+10,aY,1,Math.min(50,acc*14),'#f59e0b',2,'a='+acc.toFixed(2));
    } else if(law===3){
        if(L3phase==='approach'&&(running||pos>0)){
            arrow(bx+bW/2+4,aY,1,Math.min(80,force*2.5),'#10b981',3,'فعل');
        } else if(L3phase==='bounced'){
            const rl=Math.min(70,Math.abs(L3bounceVel)*mass/6);
            arrow(wx(DMAX)-4,aY,-1,rl,'#ef4444',3,'رد الفعل');
            arrow(bx+bW/2+4,aY,1,rl*.9,'#f59e0b',2.5,'الفعل');
        }
    }

    /* Sparks */
    sparks.forEach(s=>{
        nctx.beginPath(); nctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        nctx.fillStyle=`rgba(245,158,11,${s.life*.85})`;
        nctx.shadowBlur=7; nctx.shadowColor='#f59e0b';
        nctx.fill(); nctx.shadowBlur=0;
    });

    /* Law label */
    const lawNames=['القانون الأول: القصور الذاتي','القانون الثاني: F = m × a','القانون الثالث: الفعل ورد الفعل'];
    nctx.fillStyle='rgba(0,78,102,.26)'; nctx.font=`bold ${Math.max(12,W/58)}px Cairo`;
    nctx.textAlign='center'; nctx.fillText(lawNames[law-1],W/2,H*.07); nctx.textAlign='start';

    /* Mini instruments */
    miniInst(W,H);
}

function arrow(x,y,dir,len,col,lw,lbl){
    if(len<3)return;
    const hd=Math.min(13,len*.28);
    nctx.strokeStyle=col; nctx.lineWidth=lw; nctx.fillStyle=col;
    nctx.beginPath(); nctx.moveTo(x+len*dir,y); nctx.lineTo(x,y); nctx.stroke();
    nctx.beginPath();
    nctx.moveTo(x+len*dir,y);
    nctx.lineTo(x+(len-hd)*dir,y-5); nctx.lineTo(x+(len-hd)*dir,y+5);
    nctx.closePath(); nctx.fill();
    if(lbl){
        nctx.fillStyle=col; nctx.font='bold 9px Cairo'; nctx.textAlign='center';
        lbl.split('\n').forEach((l,i)=>nctx.fillText(l,x+len*dir/2,y-16+i*12));
        nctx.textAlign='start';
    }
}

function miniInst(W,H){
    const ix=W*.03, iy=H*.84, iw=W*.13, ih=H*.12;
    [{label:'السرعة',val:Math.abs(vel).toFixed(2)+' م/ث',color:'#0089ae'},
     {label:'الإزاحة',val:pos.toFixed(1)+' م',color:'#006b8a'}
    ].forEach((p,i)=>{
        const px=ix+i*(iw+W*.015);
        nctx.fillStyle='rgba(232,245,250,.93)';
        nctx.beginPath(); nctx.roundRect(px,iy,iw,ih,10); nctx.fill();
        nctx.strokeStyle='rgba(0,137,174,.28)'; nctx.lineWidth=1.5;
        nctx.beginPath(); nctx.roundRect(px,iy,iw,ih,10); nctx.stroke();
        nctx.fillStyle='#4a7a8a'; nctx.font=`${Math.max(8,W/100)}px Cairo`;
        nctx.textAlign='center'; nctx.fillText(p.label,px+iw/2,iy+H*.028);
        nctx.fillStyle=p.color; nctx.font=`bold ${Math.max(11,W/76)}px JetBrains Mono,monospace`;
        nctx.fillText(p.val,px+iw/2,iy+H*.086); nctx.textAlign='start';
    });
}

/* ── Explanation ── */
function updateExpl(){
    let msg='';
    if(t<.15)           msg='<span class="step-num">1</span> تم تطبيق القوة على الجسم.';
    else if(t<1)        msg='<span class="step-num">2</span> الجسم بدأ بالتسارع تدريجياً.';
    else if(L3phase==='bounced') msg='<span class="step-num">💥</span> القانون الثالث في العمل: رد الفعل مساوٍ للفعل.';
    else if(pos<DMAX*.7) msg='<span class="step-num">3</span> السرعة تتزايد مع استمرار القوة.';
    else if(pos<DMAX)   msg='<span class="step-num">4</span> الجسم يقترب من نهاية المسار.';
    else                msg='<span class="step-num">✓</span> اكتملت التجربة بنجاح!';
    explContent.innerHTML='<strong>الشرح التلقائي</strong><br>'+msg;
}

/* ── Conclusion Modal ── */
const conclusionData={
    1:{q:'ماذا يحدث للجسم المتحرك عندما لا تؤثر عليه قوة خارجية؟',
       opts:[{t:'✅ يستمر في الحركة بسرعة ثابتة',c:true},
             {t:'❌ يتوقف تدريجياً',c:false},{t:'❌ يزداد سرعة',c:false}]},
    2:{q:'ما العلاقة بين القوة والتسارع (عند ثبات الكتلة)؟',
       opts:[{t:'✅ علاقة طردية: كلما زادت القوة زاد التسارع',c:true},
             {t:'❌ علاقة عكسية',c:false},{t:'❌ لا توجد علاقة',c:false}]},
    3:{q:'عند اصطدام الجسم بالجدار، ماذا يحدث؟',
       opts:[{t:'✅ قوة الفعل = رد الفعل ومعاكسة في الاتجاه',c:true},
             {t:'❌ قوة الفعل أكبر',c:false},{t:'❌ لا يوجد رد فعل',c:false}]},
};

function showConclusion(){
    const d=conclusionData[law];
    conclusionBox.innerHTML=`
        <h3>🧠 استنتاج التجربة</h3>
        <p style="margin-bottom:14px;color:var(--gray-600);">${d.q}</p>
        ${d.opts.map(o=>`<button class="modal-option" data-correct="${o.c}">${o.t}</button>`).join('')}
        <div id="concFB" style="margin-top:10px;font-weight:700;min-height:24px;"></div>
        <button class="modal-close" id="modalClose" style="margin-top:8px;">حسناً، فهمت</button>`;
    conclusionModal.classList.remove('hidden');
    conclusionBox.querySelectorAll('.modal-option').forEach(btn=>btn.addEventListener('click',function(){
        conclusionBox.querySelectorAll('.modal-option').forEach(b=>{b.style.pointerEvents='none';b.style.opacity='.55';});
        const fb=document.getElementById('concFB');
        if(this.dataset.correct==='true'){
            this.style.cssText+='background:#ecfdf5;border-color:#10b981;opacity:1;';
            fb.textContent='✅ إجابة صحيحة! أحسنت.'; fb.style.color='#10b981';
        } else {
            this.style.cssText+='background:#fef2f2;border-color:#dc2626;opacity:1;';
            fb.textContent='❌ ليس صحيحاً. راجع ملاحظاتك.'; fb.style.color='#dc2626';
        }
    }));
    document.getElementById('modalClose').addEventListener('click',()=>conclusionModal.classList.add('hidden'));
}

/* ── Achievements ── */
function checkAch(){
    if(achievedLaws.has(law)) return;
    achievedLaws.add(law);
    const ids={1:'achLaw1',2:'achLaw2',3:'achLaw3'};
    document.getElementById(ids[law])?.classList.add('earned');
    showToast('🏅 أنجزت: '+['','القانون الأول','القانون الثاني','القانون الثالث'][law]);
    progressEl.textContent=Math.round(achievedLaws.size/3*100)+'%';
}

/* ── UI helpers ── */
function updateDisp(){
    document.getElementById('instAccel').textContent=acc.toFixed(2);
    document.getElementById('instVel').textContent=Math.abs(vel).toFixed(2);
    document.getElementById('instDisp').textContent=pos.toFixed(2);
    document.getElementById('instNetF').textContent=netF.toFixed(2);
    document.getElementById('instKE').textContent=(0.5*mass*vel*vel).toFixed(3);
    document.getElementById('instMom').textContent=(mass*Math.abs(vel)).toFixed(3);
    document.getElementById('massVal').textContent=mass.toFixed(1)+' kg';
    document.getElementById('forceVal').textContent=force.toFixed(1)+' N';
    document.getElementById('frictionVal').textContent=mu.toFixed(2);
    document.getElementById('initVelVal').textContent=v0.toFixed(1)+' m/s';
    timerValue.textContent=t.toFixed(2);
    updateStallWarning();
}

function updateTable(reset){
    if(reset){
        dataTableBody.innerHTML='<tr><td colspan="6" style="color:var(--gray-400);padding:14px;">في انتظار بدء التجربة...</td></tr>';
        return;
    }
    if(!dataLog.length) return;
    dataTableBody.innerHTML=dataLog.slice(-20).map(d=>
        `<tr><td>${d.t}</td><td>${d.v}</td><td>${d.a}</td><td>${d.x}</td><td>${d.nf}</td><td>${d.ke}</td></tr>`
    ).join('');
    const w=document.getElementById('dataTableWrap');
    if(w) w.scrollTop=w.scrollHeight;
}

function updateStatus(s){
    const m={ready:'⚙️ جاهز للتشغيل',running:'🚀 الجسم في حركة...',
              paused:'⏸ متوقف مؤقتاً',done:'✅ اكتملت التجربة',collision:'💥 ارتداد! (الفعل ورد الفعل)'};
    simStatusEl.textContent=m[s]||m.ready;
    liveDot.classList.toggle('paused-dot',s==='paused');
    timerDisplay.classList.toggle('paused',s==='paused');
}

function showToast(msg){
    toast.textContent=msg; toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),2600);
}

/* ── Main loop ── */
function loop(ts){
    const dt=Math.min((ts-lastTs)/1000,.08);
    lastTs=ts;
    step(dt);
    updateDisp();
    if(frameN%6===0) updateTable(false);
    drawNC();
    if(frameN%8===0) drawG();
    requestAnimationFrame(loop);
}

/* ── Controls ── */
function resetSim(){
    running=false; paused=false;
    t=0;pos=0;vel=0;acc=0;netF=0;
    dataLog=[];dlCounter=0;sparks=[];
    L3phase='approach';L3bounceVel=0;
    calcNet(); updateDisp(); updateTable(true);
    drawNC(); drawG(); updateStatus('ready');
    stateDesc.textContent='اختر قانوناً واضبط المتغيرات ثم اضغط تشغيل.';
}

function startSim(){
    if(isStalled()){ showToast('⚠️ القوة أقل من الاحتكاك — الجسم لن يتحرك!'); return; }
    if(running&&!paused) return;
    if(paused){ paused=false; updateStatus('running'); return; }
    resetSim();
    calcNet();
    if(law===1){vel=v0;acc=0;netF=0;}
    L3phase='approach'; L3bounceVel=0;
    running=true; paused=false;
    if(explMode) explContent.innerHTML='<strong>الشرح التلقائي</strong><br>في انتظار بدء الحركة...';
    updateStatus('running');
}

function switchLaw(l){
    law=l; resetSim();
    document.getElementById('initialVelocityGroup').style.display=l===1?'block':'none';
    document.getElementById('frictionGroup').style.display=l!==1?'block':'none';
    calcNet(); updateDisp();
    stateDesc.textContent=['','الجسم يتحرك بسرعة ثابتة ما لم تؤثر عليه قوة خارجية (القصور الذاتي).',
        'التسارع يتناسب طردياً مع القوة المحصلة وعكسياً مع الكتلة: F = m × a.',
        'لكل فعل رد فعل مساوٍ في المقدار ومعاكس في الاتجاه.'][l];
    updateStallWarning();
}

/* ── Event bindings ── */
document.querySelectorAll('.law-tab').forEach(tab=>tab.addEventListener('click',function(){
    document.querySelectorAll('.law-tab').forEach(t=>t.classList.remove('active'));
    this.classList.add('active'); switchLaw(parseInt(this.dataset.law));
}));

document.getElementById('btnPlay').addEventListener('click',startSim);
document.getElementById('btnPause').addEventListener('click',()=>{
    if(!running||paused)return; paused=true; updateStatus('paused');
});
document.getElementById('btnResume').addEventListener('click',()=>{
    if(!running||!paused)return; paused=false; updateStatus('running');
});
document.getElementById('btnReset').addEventListener('click',resetSim);
document.getElementById('btnExplain').addEventListener('click',function(){
    explMode=!explMode;
    if(explMode){
        explPanel.classList.remove('hidden'); this.classList.add('playing');
        explContent.innerHTML='<strong>الشرح التلقائي</strong><br>في انتظار بدء التجربة...';
        showToast('📢 الشرح التلقائي مُفعّل');
    } else {
        explPanel.classList.add('hidden'); this.classList.remove('playing');
        showToast('🔇 تم إيقاف الشرح');
    }
});
document.getElementById('closeExplanation').addEventListener('click',()=>{
    explMode=false; explPanel.classList.add('hidden');
    document.getElementById('btnExplain').classList.remove('playing');
});

document.querySelectorAll('.speed-btn').forEach(b=>b.addEventListener('click',function(){
    document.querySelectorAll('.speed-btn').forEach(x=>x.classList.remove('active-speed'));
    this.classList.add('active-speed'); simSpeed=parseFloat(this.dataset.speed);
}));

document.getElementById('massSlider').addEventListener('input',function(){
    mass=parseFloat(this.value);
    document.getElementById('massVal').textContent=mass.toFixed(1)+' kg';
    calcNet(); updateDisp();
});
document.getElementById('forceSlider').addEventListener('input',function(){
    force=parseFloat(this.value);
    document.getElementById('forceVal').textContent=force.toFixed(1)+' N';
    calcNet(); updateDisp();
});
document.getElementById('frictionSlider').addEventListener('input',function(){
    mu=parseFloat(this.value);
    document.getElementById('frictionVal').textContent=mu.toFixed(2);
    calcNet(); updateDisp();
});
document.getElementById('initVelSlider').addEventListener('input',function(){
    v0=parseFloat(this.value);
    document.getElementById('initVelVal').textContent=v0.toFixed(1)+' m/s';
    if(law===1&&running) vel=v0;
    updateDisp();
});

/* Graph tabs */
document.querySelectorAll('.graph-tab').forEach(tab=>tab.addEventListener('click',function(){
    document.querySelectorAll('.graph-tab').forEach(t=>t.classList.remove('active'));
    this.classList.add('active'); graphType=this.dataset.graph; drawG();
}));

/* ── COMPARE BUTTON — the real fix ── */
btnCompare.addEventListener('click',()=>{
    if(graphHistory.length===0){ showToast('⚠️ لا توجد تجارب محفوظة بعد — شغّل تجربة أولاً'); return; }
    if(graphHistory.length===1){ showToast('⚠️ تحتاج إلى تجربتين على الأقل للمقارنة'); return; }
    compareMode=!compareMode;
    btnCompare.classList.toggle('compare-active',compareMode);
    btnCompare.innerHTML=compareMode
        ?'<i class="fas fa-times-circle"></i> إلغاء المقارنة'
        :'<i class="fas fa-balance-scale"></i> مقارنة التجارب';
    drawG();
    showToast(compareMode
        ?`📊 مقارنة ${graphHistory.length} تجارب — كل منحنى بلون مختلف`
        :'📈 عرض التجربة الأخيرة فقط');
});

document.getElementById('btnClearGraph').addEventListener('click',()=>{
    graphHistory=[]; runCountEl.textContent='0'; graphLegend.innerHTML='';
    compareMode=false;
    btnCompare.classList.remove('compare-active');
    btnCompare.innerHTML='<i class="fas fa-balance-scale"></i> مقارنة التجارب';
    drawG(); showToast('🗑️ تم مسح سجل الرسوم البيانية');
});

document.getElementById('btnExportPNG').addEventListener('click',()=>{
    const a=document.createElement('a');
    a.download='رسم_بياني_نيوتن.png'; a.href=GC.toDataURL('image/png'); a.click();
    showToast('📸 تم حفظ PNG');
});

document.getElementById('btnExportCSV').addEventListener('click',()=>{
    if(!dataLog.length){ showToast('⚠️ لا توجد بيانات'); return; }
    const h='الزمن (ث),السرعة (م/ث),التسارع (م/ث²),الإزاحة (م),القوة المحصلة (N),KE (J)\n';
    const rows=dataLog.map(d=>`${d.t},${d.v},${d.a},${d.x},${d.nf},${d.ke}`).join('\n');
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([h+rows],{type:'text/csv;charset=utf-8;'}));
    a.download='بيانات_التجربة.csv'; a.click();
    showToast('📄 تم تصدير CSV');
});

/* Investigation */
document.querySelectorAll('.inv-opt').forEach(opt=>opt.addEventListener('click',function(){
    const opts=this.parentElement.querySelectorAll('.inv-opt');
    const fb=this.parentElement.nextElementSibling;
    opts.forEach(o=>{o.style.pointerEvents='none';o.style.opacity='.6';});
    if(this.dataset.answer==='correct'){
        this.classList.add('correct');
        fb.textContent='✅ إجابة صحيحة! أحسنت.'; fb.style.cssText='background:#ecfdf5;color:#10b981;';
    } else {
        this.classList.add('wrong');
        fb.textContent='❌ حاول مرة أخرى.'; fb.style.cssText='background:#fef2f2;color:#dc2626;';
    }
    fb.classList.add('show');
    setTimeout(()=>{
        opts.forEach(o=>{o.style.pointerEvents='auto';o.style.opacity='1';o.classList.remove('correct','wrong');});
        fb.classList.remove('show');
    },2400);
}));

conclusionModal.addEventListener('click',e=>{if(e.target===conclusionModal)conclusionModal.classList.add('hidden');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)lastTs=performance.now();});

/* ── Init ── */
switchLaw(1);
lastTs=performance.now();
requestAnimationFrame(loop);
console.log('%c🔬 مختبر نيوتن v3 — جاهز','color:#0089ae;font-weight:bold;font-size:14px');
})();
</script>
<script>
    window.WATERMARK_USER = {
        name: <?=json_encode($user_name)?>,
        contact: <?=json_encode($user_contact)?>
    };
</script>
<script src="../js/watermark.js"></script>
</body>
</html>