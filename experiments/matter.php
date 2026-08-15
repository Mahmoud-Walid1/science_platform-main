<?php
require_once '../config.php';
require_once '../functions.php';

$sub = isAuthenticated();

$user_name = $_SESSION['user']['name'] ?? $_SESSION['user_name'] ?? 'معلم معتمد';
$user_contact = $_SESSION['user']['whatsappNumber'] ?? $_SESSION['user']['phone'] ?? $_SESSION['user']['email'] ?? '';

$exp_active = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM experiments WHERE id = 1"))['is_active'];
if (!$exp_active) {
    header('Location: ../my-experiments.php?msg=experiment_disabled');
    exit();
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>حالات المادة | مختبرات العلوم التقنية</title>
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
            --gray-800: #1e293b;
            --solid-c: #2563eb;
            --liquid-c: #10b981;
            --gas-c: #f59e0b;
            --error: #dc2626;
            --success: #10b981;
            --warning: #f59e0b;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.03);
            --shadow-md: 0 6px 16px -4px rgba(0,0,0,0.06);
            --shadow-lg: 0 16px 32px -8px rgba(0,0,0,0.05);
            --r-xl: 32px;
            --r-lg: 24px;
            --r-md: 18px;
            --r-sm: 14px;
            --transition: 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * { margin:0; padding:0; box-sizing:border-box; }
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

        /* ===== ANIMATIONS ===== */
        @keyframes fadeInUp {
            from { opacity:0; transform:translateY(30px); }
            to { opacity:1; transform:translateY(0); }
        }

        @keyframes pulse {
            0%,100% { box-shadow:0 0 8px rgba(16,185,129,0.5); }
            50% { box-shadow:0 0 24px rgba(16,185,129,0.85); }
        }

        @keyframes stateFlash {
            0% { filter: brightness(1); }
            40% { filter: brightness(1.25); }
            100% { filter: brightness(1); }
        }

        .state-flash {
            animation: stateFlash 0.5s ease;
        }

        /* ===== HEADER (FULL WIDTH) ===== */
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

        .lab-brand:hover {
            transform: scale(1.02);
        }

        .lab-brand img {
            height: 46px;
            width: 46px;
            border-radius: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
            transition: var(--transition);
        }

        .lab-brand span {
            font-weight: 800;
            color: var(--teal-800);
            font-size: 1.1rem;
            letter-spacing: -0.2px;
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

        .exp-badge:hover {
            transform: scale(1.05);
        }

        .exit-btn {
            background: rgba(255,255,255,0.75);
            border: 1px solid rgba(220,38,38,0.15);
            padding: 10px 24px;
            border-radius: 50px;
            color: var(--error);
            text-decoration: none;
            font-weight: 700;
            transition: var(--transition);
            font-size: 0.88rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .exit-btn:hover {
            background: #fee2e2;
            transform: translateX(6px);
        }

        /* ===== MAIN GRID ===== */
        .main {
            max-width: 1440px;
            margin: 24px auto 20px;
            padding: 0 24px;
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 24px;
            align-items: start;
            flex: 1;
        }

        /* ===== PHASE TABS ===== */
        .phase-tabs {
            grid-column: 1 / -1;
            display: flex;
            gap: 10px;
            background: rgba(255,255,255,0.65);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.7);
            border-radius: var(--r-lg);
            padding: 8px;
            box-shadow: var(--shadow-md);
        }

        .phase-tab {
            flex: 1;
            padding: 14px 20px;
            border-radius: var(--r-md);
            border: none;
            background: transparent;
            color: var(--gray-500);
            font-family: 'Cairo', sans-serif;
            font-size: 0.92rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }

        .phase-tab.active {
            background: linear-gradient(135deg, var(--teal-700), var(--teal-500));
            color: white;
            box-shadow: 0 8px 20px -6px rgba(0,107,138,0.35);
            transform: translateY(-2px);
        }

        .phase-tab:not(.active):hover {
            background: var(--teal-50);
            color: var(--teal-800);
            transform: translateY(-3px);
        }

        .phase-num {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(0,0,0,0.06);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 800;
            transition: var(--transition);
        }

        .phase-tab.active .phase-num {
            background: rgba(255,255,255,0.2);
        }

        .phase-tab:hover .phase-num {
            transform: rotate(360deg);
        }

        /* ===== CANVAS AREA ===== */
        .canvas-wrapper {
            background: white;
            border-radius: var(--r-xl);
            border: 1px solid var(--gray-200);
            overflow: hidden;
            box-shadow: 0 16px 40px -16px rgba(0,0,0,0.06);
            animation: fadeInUp 0.6s ease;
            transition: border-color 0.3s, box-shadow 0.3s;
        }

        .canvas-wrapper:hover {
            box-shadow: 0 24px 48px -16px rgba(0,0,0,0.1);
        }

        .canvas-wrapper.pressure-high {
            border-color: var(--teal-600);
            box-shadow: 0 0 0 4px rgba(0,107,138,0.1);
        }

        .canvas-wrapper.pressure-low {
            border-color: var(--gray-300);
        }

        .canvas-header {
            padding: 18px 24px;
            border-bottom: 1px solid var(--gray-100);
            background: var(--gray-50);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
            font-size: 0.95rem;
            flex-wrap: wrap;
            gap: 10px;
        }

        .live-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--success);
            animation: pulse 2s infinite;
            display: inline-block;
            margin-left: 8px;
        }

        #stateLabel {
            font-size: 1.05rem;
            font-weight: 800;
            padding: 8px 24px;
            border-radius: 50px;
            transition: all 0.3s ease;
        }

        #stateLabel:hover {
            transform: scale(1.05);
        }

        #stateLabel.state-solid { background: #eff6ff; color: var(--solid-c); }
        #stateLabel.state-liquid { background: #ecfdf5; color: var(--liquid-c); }
        #stateLabel.state-gas { background: #fffbeb; color: var(--gas-c); }

        #matterCanvas {
            display: block;
            width: 100%;
            height: 480px;
            background: #f9fbfd;
        }

        .canvas-footer {
            padding: 16px 24px;
            border-top: 1px solid var(--gray-100);
            background: white;
        }

        #stateDesc {
            font-size: 0.86rem;
            color: var(--gray-600);
            line-height: 1.8;
            transition: var(--transition);
        }

        /* ===== SIDE PANEL CARDS ===== */
        .side-panel {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .control-card {
            background: rgba(255,255,255,0.8);
            backdrop-filter: blur(12px);
            border-radius: var(--r-md);
            padding: 22px;
            border: 1px solid rgba(255,255,255,0.6);
            box-shadow: var(--shadow-md);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            animation: fadeInUp 0.6s ease;
        }

        .control-card:hover {
            box-shadow: var(--shadow-lg);
            transform: translateY(-4px);
            background: rgba(255,255,255,0.9);
        }

        .card-title {
            font-weight: 800;
            font-size: 0.88rem;
            margin-bottom: 20px;
            color: var(--teal-800);
            display: flex;
            align-items: center;
            gap: 10px;
            border-right: 4px solid var(--teal-600);
            padding-right: 14px;
            transition: var(--transition);
        }

        .control-card:hover .card-title {
            border-right-color: var(--teal-400);
        }

        .state-btns {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
        }

        .state-btn {
            padding: 16px 10px;
            border-radius: var(--r-md);
            border: 2px solid;
            background: transparent;
            font-family: 'Cairo', sans-serif;
            font-size: 0.84rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .state-btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255,255,255,0.3);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }

        .state-btn:hover::before {
            width: 300px;
            height: 300px;
        }

        .state-btn[data-state="solid"] { color: var(--solid-c); border-color: rgba(37,99,235,0.2); background: #eff6ff; }
        .state-btn[data-state="liquid"] { color: var(--liquid-c); border-color: rgba(16,185,129,0.2); background: #ecfdf5; }
        .state-btn[data-state="gas"] { color: var(--gas-c); border-color: rgba(245,158,11,0.2); background: #fffbeb; }

        .state-btn.active {
            background: linear-gradient(135deg, var(--teal-700), var(--teal-600));
            color: white;
            border-color: transparent;
            box-shadow: 0 8px 24px rgba(0,78,102,0.28);
            transform: scale(1.03);
        }

        .state-btn:hover:not(.active) {
            transform: translateY(-5px);
            box-shadow: 0 12px 20px -8px rgba(0,0,0,0.1);
        }

        .state-btn i {
            font-size: 1.5rem;
            transition: var(--transition);
        }

        .state-btn:hover i {
            transform: scale(1.2);
        }

        /* Sliders */
        .slider-group {
            margin-bottom: 24px;
        }

        .slider-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .slider-name {
            font-size: 0.88rem;
            font-weight: 700;
            color: var(--gray-700);
        }

        .slider-val {
            font-size: 0.92rem;
            font-weight: 800;
            color: var(--teal-700);
            background: var(--teal-50);
            padding: 4px 14px;
            border-radius: 40px;
            transition: var(--transition);
        }

        .slider-val:hover {
            background: var(--teal-100);
        }

        input[type="range"] {
            -webkit-appearance: none;
            width: 100%;
            height: 10px;
            border-radius: 10px;
            background: linear-gradient(to left, var(--gray-200), var(--gray-100));
            outline: none;
            cursor: pointer;
            transition: var(--transition);
        }

        input[type="range"]:hover {
            background: linear-gradient(to left, var(--gray-300), var(--gray-200));
        }

        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--teal-700), var(--teal-500));
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 4px 14px rgba(0,137,174,0.35);
            transition: all 0.2s ease;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 6px 20px rgba(0,137,174,0.5);
        }

        .slider-labels {
            display: flex;
            justify-content: space-between;
            font-size: 0.72rem;
            color: var(--gray-400);
            margin-top: 8px;
        }

        .moles-display {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin: 12px 0;
        }

        .mole-btn {
            width: 46px;
            height: 46px;
            border-radius: 50%;
            border: 2px solid var(--teal-600);
            background: white;
            color: var(--teal-600);
            font-size: 1.2rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .mole-btn:hover {
            background: var(--teal-600);
            color: white;
            transform: scale(1.15);
            box-shadow: 0 8px 16px rgba(0,107,138,0.25);
        }

        .mole-btn:active {
            transform: scale(0.9);
        }

        .moles-value {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--teal-700);
            min-width: 60px;
            text-align: center;
            transition: var(--transition);
        }

        .moles-value:hover {
            transform: scale(1.1);
        }

        /* Temperature Gauge */
        .temp-gauge {
            display: flex;
            align-items: center;
            gap: 18px;
            padding: 16px;
            background: rgba(255,255,255,0.7);
            border-radius: var(--r-md);
            transition: var(--transition);
        }

        .temp-gauge:hover {
            background: rgba(255,255,255,0.9);
        }

        .thermo {
            width: 18px;
            height: 100px;
            background: var(--gray-200);
            border-radius: 30px;
            position: relative;
            overflow: hidden;
            flex-shrink: 0;
            box-shadow: inset 0 2px 6px rgba(0,0,0,0.04);
            transition: var(--transition);
        }

        .thermo-fill {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(0deg, #2563eb, #10b981, #f59e0b, #ef4444);
            border-radius: 30px;
            transition: height 0.5s cubic-bezier(0.2,0.9,0.4,1.1);
            height: 0%;
        }

        .temp-big {
            font-size: 2rem;
            font-weight: 800;
            color: var(--gray-800);
            transition: var(--transition);
        }

        .temp-big:hover {
            transform: scale(1.05);
        }

        .temp-sub {
            font-size: 0.75rem;
            color: var(--gray-500);
        }

        .transitions {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 14px;
        }

        .trans-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            border-radius: var(--r-sm);
            font-size: 0.82rem;
            background: rgba(255,255,255,0.6);
            border: 1px solid var(--gray-200);
            transition: var(--transition);
        }

        .trans-item:hover {
            background: rgba(0,168,212,0.05);
            transform: translateX(-4px);
        }

        /* ===== INFO CARD ===== */
        .info-card {
            background: rgba(255,255,255,0.8);
            backdrop-filter: blur(12px);
            border-radius: var(--r-md);
            padding: 20px;
            border: 1px solid rgba(255,255,255,0.6);
            box-shadow: var(--shadow-md);
            transition: var(--transition);
        }

        .info-card:hover {
            box-shadow: var(--shadow-lg);
            transform: translateY(-2px);
        }

        .info-tabs {
            display: flex;
            border-bottom: 2px solid var(--gray-100);
            margin-bottom: 20px;
            gap: 4px;
        }

        .info-tab {
            flex: 1;
            padding: 14px 8px;
            text-align: center;
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--gray-500);
            cursor: pointer;
            border: none;
            background: transparent;
            font-family: 'Cairo', sans-serif;
            border-radius: 12px 12px 0 0;
            transition: all 0.3s ease;
            position: relative;
        }

        .info-tab.active {
            color: white;
            background: linear-gradient(135deg, var(--teal-700), var(--teal-500));
            box-shadow: 0 4px 12px rgba(0,107,138,0.15);
        }

        .info-tab:not(.active):hover {
            color: var(--teal-700);
            background: rgba(0,168,212,0.05);
        }

        .info-pane {
            display: none;
            animation: fadeInUp 0.4s ease;
        }

        .info-pane.active {
            display: block;
        }

        .fact-item {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            padding: 12px 0;
            border-bottom: 1px solid var(--gray-100);
            font-size: 0.82rem;
            color: var(--gray-600);
            line-height: 1.7;
            transition: var(--transition);
        }

        .fact-item:hover {
            background: rgba(0,168,212,0.02);
            padding-right: 8px;
        }

        .fact-item:last-child {
            border-bottom: none;
        }

        .fact-icon {
            width: 36px;
            height: 36px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            flex-shrink: 0;
            transition: var(--transition);
        }

        .fact-item:hover .fact-icon {
            transform: scale(1.1) rotate(-5deg);
        }

        .fact-icon.blue { background: #eff6ff; color: var(--solid-c); }
        .fact-icon.green { background: #ecfdf5; color: var(--liquid-c); }
        .fact-icon.pink { background: #fffbeb; color: var(--gas-c); }

        .quiz-opt {
            width: 100%;
            padding: 14px 16px;
            border-radius: var(--r-sm);
            border: 1px solid var(--gray-200);
            background: var(--gray-50);
            color: var(--gray-600);
            font-family: 'Cairo', sans-serif;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            text-align: right;
            transition: all 0.3s ease;
            margin-bottom: 10px;
        }

        .quiz-opt:hover {
            background: var(--teal-50);
            color: var(--teal-700);
            transform: translateX(-4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .quiz-opt.correct {
            background: #ecfdf5;
            border-color: var(--success);
            color: var(--success);
            font-weight: 700;
        }

        .quiz-opt.wrong {
            background: #fef2f2;
            border-color: var(--error);
            color: var(--error);
        }

        /* ===== FOOTER (FULL WIDTH) ===== */
        .lab-footer {
            width: 100%;
            background: rgba(255,255,255,0.75);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 2px solid rgba(0,78,102,0.1);
            padding: 18px 0;
            margin-top: 20px;
            box-shadow: 0 -4px 20px -8px rgba(0,0,0,0.04);
            transition: var(--transition);
        }

        .lab-footer:hover {
            background: rgba(255,255,255,0.85);
            box-shadow: 0 -6px 24px -8px rgba(0,0,0,0.06);
        }

        .footer-content {
            max-width: 1440px;
            margin: 0 auto;
            padding: 0 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 20px;
        }

        .footer-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 700;
            color: var(--gray-600);
            font-size: 0.9rem;
        }

        .footer-brand i {
            font-size: 1.2rem;
            color: var(--teal-600);
        }

        .footer-code {
            display: flex;
            align-items: center;
            gap: 12px;
            background: var(--white);
            padding: 10px 20px;
            border-radius: 50px;
            border: 1px solid var(--gray-200);
            box-shadow: var(--shadow-sm);
            transition: var(--transition);
        }

        .footer-code:hover {
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
        }

        .footer-code span {
            font-size: 0.85rem;
            color: var(--gray-500);
        }

        .footer-code code {
            background: var(--teal-50);
            color: var(--teal-700);
            font-family: monospace;
            font-weight: 700;
            padding: 6px 16px;
            border-radius: 30px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: var(--transition);
            border: 1px solid var(--teal-100);
        }

        .footer-code code:hover {
            background: var(--teal-600);
            color: white;
            border-color: var(--teal-600);
            transform: scale(1.05);
        }

        .footer-copy {
            background: var(--teal-600);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 30px;
            font-family: 'Cairo', sans-serif;
            font-weight: 700;
            font-size: 0.8rem;
            cursor: pointer;
            transition: var(--transition);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .footer-copy:hover {
            background: var(--teal-700);
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(0,107,138,0.3);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1000px) {
            .main {
                grid-template-columns: 1fr;
            }
            #matterCanvas {
                height: 380px;
            }
            .footer-content {
                flex-direction: column;
                text-align: center;
            }
        }

        @media (max-width: 600px) {
            .lab-header {
                padding: 12px 20px;
            }
            .phase-tab {
                padding: 10px 12px;
                font-size: 0.78rem;
            }
            .phase-tab i {
                display: none;
            }
            #matterCanvas {
                height: 300px;
            }
            .temp-big {
                font-size: 1.6rem;
            }
        }
    </style>
</head>
<body>

<header class="lab-header">
    <a href="../index.php" class="lab-brand">
        <img src="../logo2.png" alt="logo" onerror="this.style.display='none'">
        <span>مختبرات العلوم التقنية للجميع</span>
    </a>
    <div class="exp-badge">
        <i class="fas fa-atom"></i> تجربة حالات المادة
    </div>
    <a href="../index.php" class="exit-btn">
        <i class="fas fa-sign-out-alt"></i> خروج
    </a>
</header>

<div class="main">
    <div class="phase-tabs">
        <button class="phase-tab active" onclick="setPhase(1, this)">
            <span class="phase-num">١</span>
            <i class="fas fa-cubes"></i> الحالات الثلاث
        </button>
        <button class="phase-tab" onclick="setPhase(2, this)">
            <span class="phase-num">٢</span>
            <i class="fas fa-temperature-high"></i> تأثير الحرارة
        </button>
        <button class="phase-tab" onclick="setPhase(3, this)">
            <span class="phase-num">٣</span>
            <i class="fas fa-compress-arrows-alt"></i> تأثير الضغط
        </button>
    </div>

    <div class="canvas-wrapper" id="canvasWrapper">
        <div class="canvas-header">
            <span><span class="live-dot"></span> محاكاة تفاعلية – حالات المادة</span>
            <span id="stateLabel" class="state-solid">صلب 🧊</span>
        </div>
        <canvas id="matterCanvas"></canvas>
        <div class="canvas-footer">
            <p id="stateDesc">الجزيئات مرتبة في شبكة بلورية منتظمة وتهتز حول مواضع ثابتة. الشكل والحجم ثابتان.</p>
        </div>
    </div>

    <div class="side-panel">
        <!-- المرحلة 1 -->
        <div class="control-card" id="phase1Controls">
            <div class="card-title"><i class="fas fa-exchange-alt"></i> انتقال سريع بين الحالات</div>
            <div class="state-btns">
                <button class="state-btn active" data-state="solid" onclick="setMatterState('solid')">
                    <i class="fas fa-cube"></i><span>صلب</span>
                </button>
                <button class="state-btn" data-state="liquid" onclick="setMatterState('liquid')">
                    <i class="fas fa-tint"></i><span>سائل</span>
                </button>
                <button class="state-btn" data-state="gas" onclick="setMatterState('gas')">
                    <i class="fas fa-wind"></i><span>غازي</span>
                </button>
            </div>
        </div>

        <!-- المرحلة 2 -->
        <div class="control-card" id="phase2Controls" style="display:none;">
            <div class="card-title"><i class="fas fa-sliders-h"></i> التحكم بدرجة الحرارة</div>
            <div class="slider-group">
                <div class="slider-row">
                    <div class="slider-name"><i class="fas fa-thermometer-half" style="color:#f59e0b;"></i> درجة الحرارة</div>
                    <div class="slider-val" id="tempValue">−100 °م</div>
                </div>
                <input type="range" id="tempSlider" min="0" max="100" value="0" step="1">
                <div class="slider-labels"><span>−100 °م</span><span>274 °م</span></div>
            </div>
            <div class="bar-group">
                <div class="bar-label"><span>⚡ الطاقة الحركية</span><span id="keVal">منخفضة</span></div>
                <div class="bar-track"><div class="bar-fill" id="keBar" style="width:0%; background:#2563eb;"></div></div>
            </div>
            <div class="bar-group">
                <div class="bar-label"><span>🧱 الكثافة</span><span id="denseVal">عالية</span></div>
                <div class="bar-track"><div class="bar-fill" id="denseBar" style="width:95%; background:#1e40af;"></div></div>
            </div>
        </div>

        <!-- المرحلة 3 -->
        <div class="control-card" id="phase3Controls" style="display:none;">
            <div class="card-title"><i class="fas fa-compress"></i> تأثير الضغط على المادة</div>
            <div class="state-btns" style="margin-bottom:16px;">
                <button class="state-btn" data-state="solid" onclick="setMatterState('solid')"><i class="fas fa-cube"></i><span>صلب</span></button>
                <button class="state-btn" data-state="liquid" onclick="setMatterState('liquid')"><i class="fas fa-tint"></i><span>سائل</span></button>
                <button class="state-btn" data-state="gas" onclick="setMatterState('gas')"><i class="fas fa-wind"></i><span>غازي</span></button>
            </div>
            <div style="margin-bottom:18px; text-align:center;">
                <div style="font-size:0.8rem; font-weight:700; color:var(--gray-600); margin-bottom:6px;">عدد المولات (n)</div>
                <div class="moles-display">
                    <button class="mole-btn" onclick="changeMoles(-1)"><i class="fas fa-minus"></i></button>
                    <span class="moles-value" id="molesValue">2.0</span>
                    <button class="mole-btn" onclick="changeMoles(1)"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <div class="slider-group">
                <div class="slider-row">
                    <div class="slider-name"><i class="fas fa-compress-arrows-alt" style="color:#8b5cf6;"></i> الضغط</div>
                    <div class="slider-val" id="pressValue">100 kPa</div>
                </div>
                <input type="range" id="pressSlider" min="0" max="100" value="50" step="1">
                <div class="slider-labels"><span>0 kPa</span><span>200 kPa</span></div>
            </div>
            <div class="bar-group">
                <div class="bar-label"><span>⚡ الطاقة الحركية</span><span id="keVal3">متوسطة</span></div>
                <div class="bar-track"><div class="bar-fill" id="keBar3" style="width:50%; background:#f59e0b;"></div></div>
            </div>
            <div class="bar-group">
                <div class="bar-label"><span>🧱 الكثافة</span><span id="denseVal3">متوسطة</span></div>
                <div class="bar-track"><div class="bar-fill" id="denseBar3" style="width:50%; background:#10b981;"></div></div>
            </div>
        </div>

        <!-- مقياس الحرارة -->
        <div class="control-card">
            <div class="card-title"><i class="fas fa-thermometer"></i> مقياس الحرارة</div>
            <div class="temp-gauge">
                <div class="thermo"><div class="thermo-fill" id="thermoFill"></div></div>
                <div class="temp-info">
                    <div class="temp-big" id="tempBig">−100°</div>
                    <div class="temp-sub">درجة مئوية (°C)</div>
                    <div class="transitions">
                        <div class="trans-item"><span><i class="fas fa-arrow-down"></i> انصهار</span> <span id="meltPoint">0 °م</span></div>
                        <div class="trans-item"><span><i class="fas fa-arrow-down"></i> تبخر</span> <span id="boilPoint">100 °م</span></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- بطاقة المعلومات -->
        <div class="info-card">
            <div class="info-tabs">
                <button class="info-tab active" onclick="showInfoTab('facts', this)">📖 حقائق علمية</button>
                <button class="info-tab" onclick="showInfoTab('examples', this)">🌍 أمثلة حياتية</button>
                <button class="info-tab" onclick="showInfoTab('quiz', this)">🧪 اختبر نفسك</button>
            </div>
            <div class="info-content">
                <div class="info-pane active" id="pane-facts">
                    <div class="fact-item">
                        <div class="fact-icon blue"><i class="fas fa-cube"></i></div>
                        <div>المادة الصلبة لها شكل وحجم ثابتان، وجسيماتها مرتبة بانتظام وتهتز في مكانها.</div>
                    </div>
                    <div class="fact-item">
                        <div class="fact-icon green"><i class="fas fa-tint"></i></div>
                        <div>المادة السائلة لها حجم ثابت لكن شكلها يأخذ شكل الوعاء الذي توضع فيه.</div>
                    </div>
                    <div class="fact-item">
                        <div class="fact-icon pink"><i class="fas fa-wind"></i></div>
                        <div>الغاز ليس له شكل ولا حجم ثابتان ويضغط ويتمدد بحسب الإناء المحيط.</div>
                    </div>
                </div>
                <div class="info-pane" id="pane-examples">
                    <div class="fact-item"><div class="fact-icon blue"><i class="fas fa-snowflake"></i></div><div><strong>صلب:</strong> الجليد، الحديد، الخشب، الملح.</div></div>
                    <div class="fact-item"><div class="fact-icon green"><i class="fas fa-mug-hot"></i></div><div><strong>سائل:</strong> الماء، الزيت، العصير.</div></div>
                    <div class="fact-item"><div class="fact-icon pink"><i class="fas fa-cloud"></i></div><div><strong>غازي:</strong> الأكسجين، بخار الماء، الهيليوم.</div></div>
                </div>
                <div class="info-pane" id="pane-quiz">
                    <div style="font-weight:800; margin-bottom:16px;">💡 ماذا يحدث للجسيمات عند ارتفاع الحرارة؟</div>
                    <button class="quiz-opt" onclick="checkAnswer(this, false)">تتوقف عن الحركة</button>
                    <button class="quiz-opt" onclick="checkAnswer(this, true)">تتحرك أسرع وتتباعد</button>
                    <button class="quiz-opt" onclick="checkAnswer(this, false)">تنكمش</button>
                </div>
            </div>
        </div>
    </div>
</div>

<footer class="lab-footer">
    <div class="footer-content">
        <div class="footer-brand">
        </div>
        <div class="footer-code">
            <i class="fas fa-key" style="color: var(--teal-600);"></i>
            <span>كود دخول المستخدم:</span>
            <code id="accessCodeDisplay" onclick="copyAccessCode()" title="انقر للنسخ"><?php echo htmlspecialchars($code_used); ?></code>
            <button class="footer-copy" onclick="copyAccessCode()">
                <i id="copyIcon" class="fas fa-copy"></i>
            </button>
        </div>
    </div>
</footer>

<script>
function copyAccessCode() {
    var code = document.getElementById('accessCodeDisplay').textContent;
    navigator.clipboard.writeText(code).then(function() {
        var icon = document.getElementById('copyIcon');
        icon.className = 'fas fa-check';
        icon.style.color = '#10b981';
        setTimeout(function() {
            icon.className = 'fas fa-copy';
            icon.style.color = '';
        }, 2000);
    }).catch(function() {
        alert('تعذر نسخ الكود');
    });
}
</script>

<script src="../js/experiments/matter.js?v=5.5"></script>
<script>
    window.WATERMARK_USER = {
        name: <?=json_encode($user_name)?>,
        contact: <?=json_encode($user_contact)?>
    };
</script>
<script src="../js/watermark.js?v=<?=time()?>"></script>
</body>
</html>