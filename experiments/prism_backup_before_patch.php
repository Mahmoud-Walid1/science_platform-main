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
  --teal-900:#002d3d;--teal-800:#004e66;--teal-700:#006b8a;
  --teal-600:#0089ae;--teal-500:#00a8d4;--teal-400:#2ec4e8;
  --teal-300:#7ddcf0;--teal-100:#e6f7fc;--teal-50:#f0fbfe;
  --white:#ffffff;--gray-50:#f8fafc;--gray-100:#f1f5f9;
  --gray-200:#e2e8f0;--gray-300:#cbd5e1;--gray-400:#94a3b8;
  --gray-600:#475569;--gray-700:#334155;--gray-800:#1e293b;
  --green-500:#10b981;--green-100:#d1fae5;
  --red-500:#ef4444;--red-100:#fee2e2;
  --shadow-sm:0 1px 3px rgba(0,0,0,0.03);
  --shadow-md:0 6px 16px -4px rgba(0,0,0,0.06);
  --r-xl:32px;--r-lg:24px;--r-md:18px;--r-sm:14px;
  --transition:0.28s cubic-bezier(0.4,0,0.2,1);
}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Cairo',sans-serif;background:#f0f4f9;color:var(--gray-800);min-height:100vh;display:flex;flex-direction:column;}
@keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{box-shadow:0 0 8px rgba(16,185,129,0.5)}50%{box-shadow:0 0 24px rgba(16,185,129,0.85)}}
@keyframes softGlow{0%,100%{text-shadow:0 0 8px rgba(0,168,212,0.3)}50%{text-shadow:0 0 20px rgba(0,168,212,0.7)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.lab-header{width:100%;display:flex;align-items:center;justify-content:space-between;
  background:rgba(255,255,255,0.88);backdrop-filter:blur(24px);
  border-bottom:2px solid rgba(0,78,102,0.1);padding:12px 32px;
  box-shadow:0 4px 24px -10px rgba(0,0,0,0.05);gap:20px;flex-wrap:wrap;position:sticky;top:0;z-index:200;}
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
        
  .brand-logo{
  width:100%;
  height:100%;
  object-fit:contain;
  image-rendering:auto;
  display:block;
  border-radius:14px;
}
.lab-brand span{font-weight:800;color:var(--teal-800);font-size:1.1rem;}
.exp-badge{background:linear-gradient(135deg,var(--teal-700),var(--teal-500));color:white;
  padding:8px 26px;border-radius:50px;font-weight:700;font-size:0.88rem;
  display:flex;align-items:center;gap:10px;box-shadow:0 8px 20px rgba(0,107,138,0.22);}
.exit-btn{background:rgba(255,255,255,0.75);border:1px solid rgba(220,38,38,0.15);
  padding:10px 24px;border-radius:50px;color:#dc2626;text-decoration:none;
  font-weight:700;font-size:0.88rem;display:flex;align-items:center;gap:8px;}
.exit-btn:hover{background:#fee2e2;}

.main-wrap{max-width:1440px;margin:24px auto 20px;padding:0 24px;flex:1;display:flex;flex-direction:column;gap:20px;}
.exp-banner{background:linear-gradient(135deg,var(--teal-100),var(--teal-50));
  border:2px solid var(--teal-300);border-radius:var(--r-lg);padding:20px 28px;
  display:flex;align-items:center;gap:20px;flex-wrap:wrap;animation:fadeInUp 0.6s ease;}
.exp-banner .icon{font-size:2.8rem;background:linear-gradient(135deg,var(--teal-500),var(--teal-700));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:softGlow 2s infinite;flex-shrink:0;}
.exp-banner .content h3{color:var(--teal-800);font-size:1rem;margin-bottom:4px;}
.exp-banner .content p{font-size:0.85rem;color:var(--gray-600);line-height:1.7;}

.exp-grid{display:grid;grid-template-columns:310px 1fr 280px;gap:20px;animation:fadeInUp 0.7s ease 0.1s both;}

.panel{background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);
  border:1.5px solid rgba(0,78,102,0.08);border-radius:var(--r-lg);box-shadow:var(--shadow-md);overflow:hidden;}
.panel-header{padding:16px 20px;background:linear-gradient(135deg,rgba(0,78,102,0.05),rgba(0,168,212,0.03));
  border-bottom:1px solid rgba(0,78,102,0.07);display:flex;align-items:center;gap:10px;}
.panel-header h2{font-size:0.92rem;font-weight:700;color:var(--teal-800);}
.ph-icon{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--teal-600),var(--teal-400));
  display:flex;align-items:center;justify-content:center;color:white;font-size:0.85rem;}
.panel-body{padding:18px;}

/* Canvas area – two views stacked: 3D top, 2D cross-section bottom */
.canvas-panel{background:#060d1a;border-radius:var(--r-lg);border:2px solid rgba(0,168,212,0.2);
  box-shadow:0 20px 60px rgba(0,0,0,0.35);position:relative;overflow:hidden;
  display:flex;flex-direction:column;}
#three-mount{flex:1;min-height:380px;width:100%;}
.crosssection-bar{background:#080f1e;border-top:1px solid rgba(0,168,212,0.15);padding:6px 8px;
  display:flex;align-items:center;gap:8px;}
.crosssection-bar span{color:rgba(255,255,255,0.45);font-size:0.68rem;font-family:'Cairo',sans-serif;white-space:nowrap;}
#canvas2d{display:block;}
.canvas-toolbar{position:absolute;bottom:16px;right:16px;display:flex;gap:8px;z-index:10;}
.tool-btn{background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.9);
  width:38px;height:38px;border-radius:10px;cursor:pointer;font-size:0.9rem;
  display:flex;align-items:center;justify-content:center;transition:var(--transition);}
.tool-btn:hover{background:rgba(0,168,212,0.3);border-color:rgba(0,168,212,0.5);}
.canvas-info{position:absolute;top:14px;right:14px;z-index:10;
  background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,0.1);border-radius:10px;
  padding:8px 14px;color:rgba(255,255,255,0.8);font-size:0.75rem;display:flex;gap:12px;}
.canvas-info span{display:flex;align-items:center;gap:5px;}
.status-dot{width:6px;height:6px;border-radius:50%;background:var(--green-500);animation:pulse 1.5s infinite;}

.ctrl-group{margin-bottom:16px;}
.ctrl-label{font-size:0.78rem;font-weight:700;color:var(--teal-700);margin-bottom:8px;
  display:flex;justify-content:space-between;align-items:center;}
.ctrl-value{font-size:0.78rem;font-weight:700;color:var(--gray-800);
  background:var(--teal-50);padding:2px 10px;border-radius:20px;border:1px solid var(--teal-100);}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:5px;
  background:linear-gradient(to left,var(--teal-500) var(--pct,50%),var(--gray-200) var(--pct,50%));
  border-radius:10px;outline:none;cursor:pointer;}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;
  border-radius:50%;background:linear-gradient(135deg,var(--teal-600),var(--teal-400));
  box-shadow:0 2px 8px rgba(0,107,138,0.35);border:2px solid white;cursor:pointer;}
input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;
  background:linear-gradient(135deg,var(--teal-600),var(--teal-400));border:2px solid white;cursor:pointer;}

.material-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.mat-btn{background:var(--gray-50);border:1.5px solid var(--gray-200);border-radius:var(--r-sm);
  padding:8px 10px;cursor:pointer;font-family:'Cairo',sans-serif;font-size:0.76rem;
  font-weight:600;color:var(--gray-700);transition:var(--transition);text-align:center;}
.mat-btn:hover{border-color:var(--teal-400);background:var(--teal-50);}
.mat-btn.active{background:linear-gradient(135deg,var(--teal-600),var(--teal-500));color:white;border-color:transparent;}

.color-row{display:flex;gap:8px;flex-wrap:wrap;}
.col-btn{width:30px;height:30px;border-radius:50%;cursor:pointer;border:3px solid transparent;transition:var(--transition);}
.col-btn.active{border-color:white;box-shadow:0 0 0 2px var(--teal-500);}
.col-btn:hover{transform:scale(1.15);}
.col-white{background:linear-gradient(135deg,#fff,#eee);border:2px solid #ddd!important;}

.toggle-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--gray-100);}
.toggle-row:last-child{border-bottom:none;}
.toggle-label{font-size:0.78rem;font-weight:600;color:var(--gray-700);}
.toggle{position:relative;width:40px;height:22px;}
.toggle input{opacity:0;width:0;height:0;}
.toggle-slider{position:absolute;inset:0;background:var(--gray-200);border-radius:22px;cursor:pointer;transition:var(--transition);}
.toggle-slider:before{content:'';position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:white;border-radius:50%;transition:var(--transition);}
input:checked + .toggle-slider{background:linear-gradient(135deg,var(--teal-600),var(--teal-400));}
input:checked + .toggle-slider:before{transform:translateX(18px);}

.action-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;}
.act-btn{padding:10px;border-radius:var(--r-sm);border:none;cursor:pointer;
  font-family:'Cairo',sans-serif;font-weight:700;font-size:0.8rem;
  display:flex;align-items:center;justify-content:center;gap:6px;transition:var(--transition);}
.act-btn-primary{background:linear-gradient(135deg,var(--teal-700),var(--teal-500));color:white;box-shadow:0 6px 16px rgba(0,107,138,0.3);}
.act-btn-primary:hover{transform:translateY(-2px);}
.act-btn-secondary{background:var(--gray-100);color:var(--gray-700);}
.act-btn-secondary:hover{background:var(--gray-200);}

.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.stat-card{background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--r-sm);padding:10px 12px;}
.stat-card:hover{border-color:var(--teal-300);background:var(--teal-50);}
.stat-card.full{grid-column:span 2;}
.stat-card.highlight{background:linear-gradient(135deg,rgba(0,168,212,0.08),rgba(0,168,212,0.03));border-color:rgba(0,168,212,0.2);}
.stat-name{font-size:0.68rem;font-weight:600;color:var(--gray-400);margin-bottom:3px;}
.stat-val{font-size:1rem;font-weight:800;color:var(--teal-700);}
.stat-unit{font-size:0.65rem;font-weight:600;color:var(--gray-400);margin-top:2px;}
.tir-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:700;margin-top:4px;}
.tir-yes{background:var(--red-100);color:var(--red-500);}
.tir-no{background:var(--green-100);color:var(--green-500);}
.spectrum-bar{width:100%;height:16px;border-radius:8px;margin-top:8px;
  background:linear-gradient(to left,violet,indigo,blue,cyan,green,yellow,orange,red);}

.edu-section{margin-top:12px;}
.edu-toggle-grid{display:flex;flex-direction:column;gap:4px;}

.lab-footer{width:100%;background:rgba(255,255,255,0.75);backdrop-filter:blur(20px);
  border-top:2px solid rgba(0,78,102,0.1);padding:18px 0;margin-top:20px;}
.footer-content{max-width:1440px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:center;gap:20px;}
.footer-code{display:flex;align-items:center;gap:12px;background:white;padding:10px 20px;border-radius:50px;border:1px solid var(--gray-200);}
.footer-code code{background:var(--teal-50);color:var(--teal-700);font-family:monospace;font-weight:700;padding:6px 16px;border-radius:30px;font-size:0.9rem;cursor:pointer;border:1px solid var(--teal-100);}
.footer-copy{background:var(--teal-600);color:white;border:none;padding:8px 16px;border-radius:30px;font-family:'Cairo',sans-serif;font-weight:700;font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:8px;}

@media(max-width:1100px){.exp-grid{grid-template-columns:280px 1fr;} .exp-grid .panel:last-child{grid-column:span 2;}}
@media(max-width:800px){.exp-grid{grid-template-columns:1fr;} #three-mount{min-height:300px;}}
@media(max-width:600px){.lab-header{padding:12px 20px;} .main-wrap{padding:0 16px;}}

#loading-overlay{position:fixed;inset:0;background:rgba(10,15,26,0.96);z-index:1000;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;color:white;}
.loading-prism{width:60px;height:60px;border:3px solid rgba(255,255,255,0.1);border-top-color:#2ec4e8;border-radius:50%;animation:spin 0.8s linear infinite;}
#loading-overlay p{font-family:'Cairo',sans-serif;font-size:0.9rem;color:rgba(255,255,255,0.6);}
/* قسم البطاقات التعليمية */
.edu-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}
.edu-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0,78,102,0.1);
  border-radius: var(--r-md);
  overflow: hidden;
  transition: var(--transition);
}
.edu-card-header {
  padding: 14px 20px;
  background: linear-gradient(135deg, rgba(0,168,212,0.05), rgba(0,168,212,0.02));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  color: var(--teal-800);
  font-size: 0.9rem;
  user-select: none;
}
.edu-card-header:hover {
  background: rgba(0,168,212,0.12);
}
.edu-card-header i {
  transition: transform 0.3s;
  color: var(--teal-600);
}
.edu-card.open .edu-card-header i {
  transform: rotate(180deg);
}
.edu-card-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease, padding 0.3s;
  background: rgba(255,255,255,0.5);
  padding: 0 20px;
  font-size: 0.82rem;
  color: var(--gray-700);
  line-height: 1.8;
}
.edu-card.open .edu-card-body {
  max-height: 600px; /* يكفي لأي محتوى */
  padding: 16px 20px;
}
</style>
</head>
<body>

<div id="loading-overlay">
  <div class="loading-prism"></div>
  <p>جاري تهيئة المحاكاة الضوئية…</p>
</div>

<header class="lab-header">
  <a href="../index.php" class="lab-brand">
    <div class="brand-icon">
<img src="../logo2.png" alt="logo" onerror="this.style.display='none'"></div>
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
      <p>محاكاة علمية دقيقة لانكسار الضوء: تطبيق قانون سنيل باستخدام تتبع الأشعة الحقيقي — كل لون له معامل انكسار مختلف حسب نموذج كوشي، ويُحسب الانكسار على الوجهين بدقة مع دعم الانعكاس الداخلي الكلي.</p>
    </div>
  </div>

  <div class="exp-grid">
    <!-- LEFT: CONTROLS -->
    <div class="panel" style="animation:fadeInUp 0.7s ease 0.15s both">
      <div class="panel-header">
        <div class="ph-icon"><i class="fas fa-sliders-h"></i></div>
        <h2>معاملات التجربة</h2>
      </div>
      <div class="panel-body">
        <div class="ctrl-group">
          <div class="ctrl-label">
            <span>زاوية السقوط (θ₁) مع العمود</span>
            <span class="ctrl-value" id="val-incident">38.0°</span>
          </div>
          <input type="range" id="sl-incident" min="5" max="85" step="0.5" value="38">
        </div>
        <div class="ctrl-group">
          <div class="ctrl-label">
            <span>دوران المنشور</span>
            <span class="ctrl-value" id="val-rotation">0.0°</span>
          </div>
          <input type="range" id="sl-rotation" min="-45" max="45" step="0.5" value="0">
        </div>
        <div class="ctrl-group">
          <div class="ctrl-label">
            <span>زاوية رأس المنشور (A)</span>
            <span class="ctrl-value" id="val-apex">60.0°</span>
          </div>
          <input type="range" id="sl-apex" min="20" max="80" step="1" value="60">
        </div>
        <div class="ctrl-group">
          <div class="ctrl-label"><span>مادة المنشور</span></div>
          <div class="material-grid">
            <button class="mat-btn active" data-mat="glass">زجاج Crown</button>
            <button class="mat-btn" data-mat="crystal">كريستال</button>
            <button class="mat-btn" data-mat="acrylic">أكريليك</button>
            <button class="mat-btn" data-mat="water">ماء</button>
          </div>
        </div>
        <div class="ctrl-group">
          <div class="ctrl-label"><span>لون الليزر</span></div>
          <div class="color-row">
            <div class="col-btn col-white active" data-wl="white" title="ضوء أبيض"></div>
            <div class="col-btn" style="background:#f00" data-wl="700" title="700nm أحمر"></div>
            <div class="col-btn" style="background:#f60" data-wl="620" title="620nm برتقالي"></div>
            <div class="col-btn" style="background:#ff0" data-wl="570" title="570nm أصفر"></div>
            <div class="col-btn" style="background:#0f0" data-wl="530" title="530nm أخضر"></div>
            <div class="col-btn" style="background:#0af" data-wl="470" title="470nm أزرق"></div>
            <div class="col-btn" style="background:#80f" data-wl="420" title="420nm بنفسجي"></div>
          </div>
        </div>
        <div class="ctrl-group">
          <div class="toggle-row">
            <span class="toggle-label"><i class="fas fa-play-circle" style="color:#00a8d4;margin-left:6px"></i>تشغيل الحركة</span>
            <label class="toggle"><input type="checkbox" id="tog-animate"><span class="toggle-slider"></span></label>
          </div>
          <div class="toggle-row">
            <span class="toggle-label"><i class="fas fa-tag" style="color:#00a8d4;margin-left:6px"></i>عرض التسميات</span>
            <label class="toggle"><input type="checkbox" id="tog-labels" checked><span class="toggle-slider"></span></label>
          </div>
          <div class="toggle-row">
            <span class="toggle-label"><i class="fas fa-graduation-cap" style="color:#00a8d4;margin-left:6px"></i>الوضع التعليمي</span>
            <label class="toggle"><input type="checkbox" id="tog-edu"><span class="toggle-slider"></span></label>
          </div>
        </div>
        <div class="action-row">
          <button class="act-btn act-btn-primary" onclick="sim.resetCamera()"><i class="fas fa-camera"></i> إعادة الكاميرا</button>
          <button class="act-btn act-btn-secondary" onclick="sim.reset()"><i class="fas fa-redo"></i> إعادة ضبط</button>
        </div>
      </div>
    </div>

    <!-- CENTER: CANVAS -->
    <div class="canvas-panel" style="animation:fadeInUp 0.7s ease 0.2s both">
      <div id="three-mount"></div>
      <!-- 2D cross-section view -->
      <div class="crosssection-bar">
        <span><i class="fas fa-drafting-compass"></i> مقطع عرضي دقيق (2D):</span>
        <canvas id="canvas2d" height="130"></canvas>
      </div>
      <div class="canvas-info">
        <span><div class="status-dot"></div> مباشر</span>
        <span><i class="fas fa-cube" style="color:#2ec4e8"></i> <span id="fps-counter">60</span> fps</span>
      </div>
      <div class="canvas-toolbar">
        <button class="tool-btn" onclick="sim.zoomOut()"><i class="fas fa-search-minus"></i></button>
        <button class="tool-btn" onclick="sim.zoomIn()"><i class="fas fa-search-plus"></i></button>
        <button class="tool-btn" onclick="sim.resetCamera()"><i class="fas fa-compress-arrows-alt"></i></button>
      </div>
    </div>

    <!-- RIGHT: ANALYSIS -->
    <div class="panel" style="animation:fadeInUp 0.7s ease 0.25s both">
      <div class="panel-header">
        <div class="ph-icon"><i class="fas fa-chart-bar"></i></div>
        <h2>لوحة التحليل</h2>
      </div>
      <div class="panel-body">
        <div class="stat-grid">
          <div class="stat-card highlight">
            <div class="stat-name">زاوية السقوط θ₁</div>
            <div class="stat-val" id="an-incident">—</div>
            <div class="stat-unit">درجة</div>
          </div>
          <div class="stat-card highlight">
            <div class="stat-name">معامل الانكسار n</div>
            <div class="stat-val" id="an-n">—</div>
            <div class="stat-unit">بلا وحدة</div>
          </div>
          <div class="stat-card">
            <div class="stat-name">الانكسار الأول r₁</div>
            <div class="stat-val" id="an-r1">—</div>
            <div class="stat-unit">درجة</div>
          </div>
          <div class="stat-card">
            <div class="stat-name">الانكسار الثاني r₂</div>
            <div class="stat-val" id="an-r2">—</div>
            <div class="stat-unit">درجة</div>
          </div>
          <div class="stat-card">
            <div class="stat-name">زاوية الخروج θ₂</div>
            <div class="stat-val" id="an-exit">—</div>
            <div class="stat-unit">درجة</div>
          </div>
          <div class="stat-card">
            <div class="stat-name">زاوية الانحراف δ</div>
            <div class="stat-val" id="an-dev">—</div>
            <div class="stat-unit">درجة</div>
          </div>
          <div class="stat-card">
            <div class="stat-name">الزاوية الحرجة</div>
            <div class="stat-val" id="an-crit">—</div>
            <div class="stat-unit">درجة</div>
          </div>
          <div class="stat-card">
            <div class="stat-name">r₁ + r₂ = A ؟</div>
            <div class="stat-val" id="an-verify">—</div>
            <div class="stat-unit">تحقق</div>
          </div>
          <div class="stat-card full">
            <div class="stat-name">الطيف الضوئي</div>
            <div class="spectrum-bar"></div>
          </div>
          <div class="stat-card full">
            <div class="stat-name">الانعكاس الداخلي الكلي</div>
            <div id="an-tir"><span class="tir-badge tir-no"><i class="fas fa-check"></i> لا يوجد</span></div>
          </div>
                    <div class="stat-card full" id="verify-card" style="display:none;">
            <div class="stat-name"><i class="fas fa-check-circle" style="color:#10b981;"></i> التحقق من قانون المنشور</div>
            <div class="stat-val" style="font-size:0.9rem; margin-top:6px;">
              <span id="v-r1">—</span>° + <span id="v-r2">—</span>° = <span id="v-sum">—</span>°
            </div>
            <div class="stat-unit" style="margin-top:2px;">A = <span id="v-apex">—</span>°</div>
            <div id="v-status" class="tir-badge tir-no" style="margin-top:6px;"><i class="fas fa-check"></i> متحقق</div>
          </div>
        </div>

        <div class="edu-section" id="edu-controls" style="display:none">
          <div class="panel-header" style="padding:10px 0;background:none;border:none;margin-top:8px">
            <div class="ph-icon" style="width:24px;height:24px;font-size:0.7rem"><i class="fas fa-eye"></i></div>
            <h2 style="font-size:0.82rem">عناصر تعليمية</h2>
          </div>
          <div class="edu-toggle-grid">
            <div class="toggle-row">
              <span class="toggle-label">الأعمدة العمودية (Normals)</span>
              <label class="toggle"><input type="checkbox" id="edu-normals" checked><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <span class="toggle-label">نقاط الدخول/الخروج</span>
              <label class="toggle"><input type="checkbox" id="edu-points" checked><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <span class="toggle-label">التحقق r₁+r₂=A</span>
              <label class="toggle"><input type="checkbox" id="edu-verify" checked><span class="toggle-slider"></span></label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  <!-- قسم البطاقات التعليمية -->
  <div class="panel" style="animation:fadeInUp 0.7s ease 0.3s both">
    <div class="panel-header">
      <div class="ph-icon"><i class="fas fa-graduation-cap"></i></div>
      <h2>مفاهيم أساسية في الضوء والمنشور</h2>
    </div>
    <div class="panel-body">
      <div class="edu-cards">
        <div class="edu-card">
          <div class="edu-card-header" onclick="this.parentElement.classList.toggle('open')">
            <span><i class="fas fa-wave-square" style="margin-left:8px;"></i> قانون سنيل (الانكسار)</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="edu-card-body">
            <p><strong>n₁ sin θ₁ = n₂ sin θ₂</strong></p>
            <p>عندما ينتقل الضوء بين وسطين شفافين (مثل الهواء والزجاج)، تتغير سرعته فينحرف. يصف قانون سنيل العلاقة بين زاويتي السقوط والانكسار ومعاملي الانكسار.</p>
            <p>في هذه التجربة: الشعاع الوارد من الهواء (n₁=1.0) يصطدم بالمنشور (مادة ذات معامل انكسار n₂) فينكسر داخله، ثم ينكسر مرة أخرى عند خروجه إلى الهواء.</p>
          </div>
        </div>
        <div class="edu-card">
          <div class="edu-card-header" onclick="this.parentElement.classList.toggle('open')">
            <span><i class="fas fa-rainbow" style="margin-left:8px;"></i> التشتت (Dispersion)</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="edu-card-body">
            <p>الضوء الأبيض مزيج من ألوان الطيف، لكل منها طول موجي مختلف. معامل الانكسار للمادة يعتمد على الطول الموجي (وفق معادلة كوشي)، لذلك ينكسر كل لون بزاوية مختلفة قليلاً، مما يؤدي إلى انفصال الألوان.</p>
            <p>البنفسجي (طول موجي قصير) ينكسر أكثر من الأحمر (طول موجي طويل). في المشاهدة، يظهر الأحمر بأعلى انحراف والبنفسجي بأقل انحراف.</p>
          </div>
        </div>
        <div class="edu-card">
          <div class="edu-card-header" onclick="this.parentElement.classList.toggle('open')">
            <span><i class="fas fa-exclamation-triangle" style="margin-left:8px;"></i> الزاوية الحرجة والانعكاس الداخلي الكلي</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="edu-card-body">
            <p>عندما يحاول الضوء الخروج من وسط كثيف (زجاج) إلى وسط أقل كثافة (هواء)، إذا كانت زاوية السقوط داخل المادة أكبر من <strong>الزاوية الحرجة</strong> (θ<sub>c</sub>)، فإنه لا ينكسر بل ينعكس كلياً داخل المادة.</p>
            <p><strong>θ<sub>c</sub> = arcsin(n<sub>هواء</sub> / n<sub>مادة</sub>)</strong></p>
            <p>في هذه التجربة، عند تفعيل "الانعكاس الداخلي الكلي" في لوحة التحليل، يظهر شعاع برتقالي منعكس بدلاً من شعاع خارجي.</p>
          </div>
        </div>
        <div class="edu-card">
          <div class="edu-card-header" onclick="this.parentElement.classList.toggle('open')">
            <span><i class="fas fa-calculator" style="margin-left:8px;"></i> لماذا r₁ + r₂ = A؟</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="edu-card-body">
            <p>في المنشور الثلاثي، مجموع زاويتي الانكسار الداخليتين (r₁ عند الوجه الأول، و r₂ عند الوجه الثاني) يساوي زاوية رأس المنشور A، بشرط أن يكون مسار الشعاع هو المسار الكلاسيكي (يدخل من وجه ويخرج من الوجه الآخر).</p>
            <p>هذه العلاقة تنبع من هندسة المثلث ومجموع الزوايا. عند تفعيل خيار "التحقق" في الوضع التعليمي، تظهر لك بطاقة تؤكد صحة هذه المعادلة.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

<footer class="lab-footer">
  <div class="footer-content">
    <div class="footer-code">
      <i class="fas fa-key" style="color:#006b8a;"></i>
      <span>كود دخول المستخدم:</span>
      <code id="accessCodeDisplay" onclick="copyAccessCode()">DEMO-2025</code>
      <button class="footer-copy" onclick="copyAccessCode()"><i id="copyIcon" class="fas fa-copy"></i></button>
    </div>
  </div>
</footer>

<script type="importmap">{"imports":{"three":"https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js"}}</script>

<script type="module">
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// ═══════════════════════════════════════════════════════════════════
//  PHYSICS ENGINE – Correct implementation
//  Coordinate system: X = right, Y = up (standard math coords)
//  This matches Three.js scene coords directly (no conversion needed)
// ═══════════════════════════════════════════════════════════════════

const MATERIALS = {
  glass:   { name:'زجاج Crown', A:1.5220, B:0.00459, C:0.000000 },
  crystal: { name:'كريستال',    A:1.7500, B:0.01200, C:0.000040 },
  acrylic: { name:'أكريليك',    A:1.4840, B:0.00532, C:0.000000 },
  water:   { name:'ماء',        A:1.3240, B:0.00300, C:0.000000 },
};

// White light: sample 11 wavelengths across visible spectrum
const WHITE_WLS = [
  {nm:700,hex:'#FF1100'},{nm:660,hex:'#FF4400'},{nm:630,hex:'#FF7700'},
  {nm:600,hex:'#FFAA00'},{nm:580,hex:'#FFD700'},{nm:560,hex:'#CCFF00'},
  {nm:530,hex:'#44FF00'},{nm:510,hex:'#00FF88'},{nm:490,hex:'#00BBFF'},
  {nm:465,hex:'#0055FF'},{nm:430,hex:'#5500FF'},
];
const SINGLE_WL = {
  '700':{nm:700,hex:'#FF1100'},'620':{nm:620,hex:'#FF7700'},
  '570':{nm:570,hex:'#FFD700'},'530':{nm:530,hex:'#44FF00'},
  '470':{nm:470,hex:'#0088FF'},'420':{nm:420,hex:'#8800FF'},
};

// Cauchy dispersion equation: n(λ) = A + B/λ² + C/λ⁴  (λ in µm)
function refIdx(mat, nm) {
  const u = nm / 1000;
  return mat.A + mat.B/(u*u) + mat.C/(u*u*u*u);
}

// ── 2D Vector helpers ──────────────────────────────────────────────
const v = {
  mk: (x,y)   => ({x,y}),
  add:(a,b)   => ({x:a.x+b.x, y:a.y+b.y}),
  sub:(a,b)   => ({x:a.x-b.x, y:a.y-b.y}),
  mul:(a,s)   => ({x:a.x*s,   y:a.y*s}),
  dot:(a,b)   => a.x*b.x + a.y*b.y,
  len:(a)     => Math.sqrt(a.x*a.x + a.y*a.y),
  neg:(a)     => ({x:-a.x, y:-a.y}),
  norm:(a)    => { const l=Math.sqrt(a.x*a.x+a.y*a.y); return l<1e-12?{x:0,y:0}:{x:a.x/l,y:a.y/l}; },
  perp:(a)    => ({x:-a.y, y:a.x}),   // 90° CCW rotation
};

/**
 * Ray–segment intersection in 2D.
 * Returns {t, pt, u} or null.  (t>0 along ray, 0≤u≤1 along segment)
 */
function hitSeg(ro, rd, p0, p1) {
  const dx=p1.x-p0.x, dy=p1.y-p0.y;
  const den = rd.x*dy - rd.y*dx;
  if (Math.abs(den)<1e-10) return null;
  const ex=p0.x-ro.x, ey=p0.y-ro.y;
  const t = (ex*dy - ey*dx)/den;
  const u = (ex*rd.y - ey*rd.x)/den;
  if (t<1e-5 || u<-1e-6 || u>1+1e-6) return null;
  return { t, pt:v.add(ro,v.mul(rd,t)), u };
}

/**
 * Build prism triangle vertices (CCW, apex at top):
 *   [0] apex   = (0, +height/2)
 *   [1] BL     = (-halfBase, -height/2)
 *   [2] BR     = (+halfBase, -height/2)
 */
function prismVerts(apexDeg, size=2.0) {
  const A=apexDeg*Math.PI/180;
  const hb=size*Math.sin(A/2), h=size*Math.cos(A/2);
  return [v.mk(0,h*0.5), v.mk(-hb,-h*0.5), v.mk(hb,-h*0.5)];
}

/**
 * Rotate 2D point by angle (rad) around origin
 */
function rot2D(p, a) {
  const c=Math.cos(a), s=Math.sin(a);
  return v.mk(p.x*c-p.y*s, p.x*s+p.y*c);
}

/**
 * Outward unit normal for edge p0→p1, given that interior is CCW.
 * Uses centroid to verify direction.
 */
function faceNormal(p0, p1, centroid) {
  const e = v.sub(p1,p0), len=v.len(e);
  const cand = v.mk(-e.y/len, e.x/len);     // rotated +90° = outward for CCW
  // Verify: midpoint→centroid should be in OPPOSITE direction to outward normal
  const mid = v.mk((p0.x+p1.x)/2,(p0.y+p1.y)/2);
  const toC = v.sub(centroid, mid);
  return v.dot(cand, toC) < 0 ? cand : v.neg(cand);
}

/**
 * Snell's Law vector refraction.
 *   incident: unit direction going INTO surface
 *   nOut: outward unit normal of surface (pointing INTO incident medium)
 *   n1, n2: refractive indices
 * Returns refracted unit direction, or null on TIR.
 */
function snellVec(incident, nOut, n1, n2) {
  // Ensure nOut opposes incident (points toward incident side)
  const N = v.dot(incident, nOut) > 0 ? v.neg(nOut) : nOut;
  const cosI = -v.dot(incident, N);
  const r = n1/n2;
  const sin2T = r*r*(1-cosI*cosI);
  if (sin2T > 1.0) return null; // TIR
  const cosT = Math.sqrt(1-sin2T);
  return v.norm(v.add(v.mul(incident,r), v.mul(N, r*cosI-cosT)));
}

/**
 * Reflect vector d around normal N (unit).
 * N should oppose d.
 */
function reflect2D(d, N) {
  const n = v.dot(d,N) > 0 ? v.neg(N) : N;
  const dot = v.dot(d,n);
  return v.norm(v.sub(d, v.mul(n, 2*dot)));
}

// ═══════════════════════════════════════════════════════════════════
//  FULL RAY TRACE
//
//  incidentDeg = TRUE angle of incidence (with face normal) at entry face.
//  We compute the beam direction that achieves this θ₁ on the LEFT face.
//  This keeps the analysis panel values physically meaningful.
// ═══════════════════════════════════════════════════════════════════

function traceRay(apexDeg, matCoeffs, nm, theta1Deg, rotDeg) {
  const n1 = 1.0;
  const n2 = refIdx(matCoeffs, nm);
  const rotRad = rotDeg * Math.PI/180;

  // Build rotated prism vertices
  const baseVerts = prismVerts(apexDeg);
  const verts = baseVerts.map(p => rot2D(p, rotRad));
  const cen = v.mk((verts[0].x+verts[1].x+verts[2].x)/3,
                   (verts[0].y+verts[1].y+verts[2].y)/3);

  // Edges [0→1 = apex-BL (LEFT face), 1→2 = base, 2→0 = right face]
  const edges = [[verts[0],verts[1]], [verts[1],verts[2]], [verts[2],verts[0]]];
  const norms = edges.map(([p0,p1]) => faceNormal(p0,p1,cen));

    const rayOrigin = v.mk(-5.5, 0.0);
  let rayDir, entryHit = null, eFace = -1;

  // Try each face as the intended entry face; accept only if the ray
  // actually hits that face FIRST with the requested incident angle.
  for (let candidate = 0; candidate < 3; candidate++) {
    const entryNorm = norms[candidate];

    // Build ray direction to achieve θ₁ on this face
    const inN = v.neg(entryNorm);
    const phi = Math.atan2(inN.y, inN.x);
    const t1r = theta1Deg * Math.PI / 180;
    const alpha1 = phi + t1r;
    const alpha2 = phi - t1r;
    let alpha = alpha1;
    if (Math.cos(alpha1) < Math.cos(alpha2)) alpha = alpha2;
    if (Math.cos(alpha1) < 0 && Math.cos(alpha2) < 0)
      alpha = Math.cos(alpha1) > Math.cos(alpha2) ? alpha1 : alpha2;
    const candidateDir = v.norm(v.mk(Math.cos(alpha), Math.sin(alpha)));

    // Find first intersection with this candidate direction
    let hit = null, hitFace = -1;
    let bestT = Infinity;
    for (let i = 0; i < 3; i++) {
      const h = hitSeg(rayOrigin, candidateDir, edges[i][0], edges[i][1]);
      if (h && h.t < bestT) { bestT = h.t; hit = h; hitFace = i; }
    }
    console.log(
"ENTRY TRY",
candidate,
"SUCCESS FACE",
hitFace
);

    // Accept only if the first hit is exactly the face we aimed for
    if (hit && hitFace === candidate) {
      rayDir = candidateDir;
      entryHit = hit;
      eFace = hitFace;
      break;
    }
  }

  // If no face satisfies the condition, the requested θ₁ is physically impossible
  if (!entryHit) return null;
  if (!edges[eFace].includes(verts[0])) return null;


  // ── Refract into prism ──
  const entN = norms[eFace];
  const refr1 = snellVec(rayDir, entN, n1, n2);
  if (!refr1) return null; // no TIR air→glass normally
  

  // Actual incident angle (should equal theta1Deg, this is a sanity check)
  const cosI = Math.abs(v.dot(rayDir, v.neg(entN)));
  const r1_deg = Math.asin(Math.min((n1/n2)*Math.sin(Math.acos(Math.min(cosI,1))),1))*180/Math.PI;
  const theta1_actual = Math.acos(Math.min(cosI,1))*180/Math.PI;

  // ── Trace internal ray to exit/TIR face ──
  const intOrigin = v.add(entryHit.pt, v.mul(refr1, 1e-4));
  let exitHit = null, xFace = -1;
  let bestT = Infinity;
  for (let i=0;i<3;i++) {
    if (i===eFace) continue;
    const h = hitSeg(intOrigin, refr1, edges[i][0], edges[i][1]);
    if (h && h.t < bestT) { bestT=h.t; exitHit=h; xFace=i; }
  }
  if (!exitHit) return null;

// Accept only the two faces that meet at the prism apex (the optical faces)
if (!edges[xFace].includes(verts[0])) return null;
  let exitN = norms[xFace];

// Make normal face against the internal ray direction
if (v.dot(refr1, exitN) > 0) {
    exitN = v.neg(exitN);
}

// Internal incidence angle at exit face
// Always use the acute angle between ray and face normal
const cosR2 = Math.abs(v.dot(refr1, exitN));

const r2_deg = Math.acos(
    Math.max(-1, Math.min(cosR2, 1))
) * 180 / Math.PI;
  // Check TIR
  const sinOut = (n2/n1)*Math.sin(r2_deg*Math.PI/180);
  const tirOccurs = sinOut >= 1.0 - 1e-7;

  // TIR reflected ray
  let tirDir = null;
  if (tirOccurs) tirDir = reflect2D(refr1, exitN);

  // Refract out (glass → air)
  let exitDir=null, theta2_deg=null, devDeg=null;
  if (!tirOccurs) {
    exitDir = snellVec(refr1, exitN, n2, n1);
    if (exitDir) {
      // Exit angle = angle between exit ray and exit face outward normal
      theta2_deg = Math.acos(Math.min(Math.abs(v.dot(exitDir, exitN)),1))*180/Math.PI;
      // Deviation angle = angle between original ray and exit ray
      const cosD = v.dot(rayDir, exitDir);
      devDeg = Math.acos(Math.min(Math.abs(cosD),1))*180/Math.PI;
    }
  }
  // ✅ تحقق من العلاقة الأساسية للمنشور
  const apexRad = apexDeg * Math.PI / 180;
  if (Math.abs((r1_deg + r2_deg) * Math.PI / 180 - apexRad) > 1e-4) return null;

  return {
    nm, n2,
    theta1_deg: theta1_actual,
    r1_deg,
    r2_deg,
    theta2_deg,
    devDeg,
    critDeg: Math.asin(n1/n2)*180/Math.PI,
    verifyR1R2: r1_deg + r2_deg,
    tirOccurs,
    // Geometry (direct 2D ↔ Three.js X,Y mapping)
    rayOrigin,
    entryPt: entryHit.pt,
    exitPt:  exitHit.pt,
    rayDir,
    refr1,
    exitDir,
    tirDir,
    entryNorm: entN,
    exitNorm: exitN,
    verts,
    cen,
    eFace, xFace,
  };
}
// ═══════════════════════════════════════════════════════════════════
//  THREE.JS SIMULATION CLASS
// ═══════════════════════════════════════════════════════════════════

class PrismSim {
  constructor() {
    this.state = {
      theta1: 38, rotDeg: 0, apexDeg: 60,
      material: 'glass', wavelength: 'white',
      animate: false, showLabels: true, eduMode: false,
      eduNormals: true, eduPoints: true, eduVerify: true,
    };
    this.results = [];
    this._lastT = performance.now();
    this._fps = [];
    this._animT = 0;
        // للتحريك السلس عند تغيير زاوية السقوط
    this._targetTheta1 = this.state.theta1;
    this._slidingIncident = false;
    this._init3D();
    this._init2D();
    this._bindControls();
    this.compute();
    this._loop();
    setTimeout(() => document.getElementById('loading-overlay').style.display='none', 500);
  }

  // ── التحقق من معادلة المنشور (بطاقة في لوحة التحليل) ──
  _updateVerifyCard() {
    const card = document.getElementById('verify-card');
    if (!card) return;
    const show = this.state.eduMode && this.state.eduVerify && this.results.length > 0;
    card.style.display = show ? '' : 'none';
    if (!show) return;

    const pr = this.state.wavelength==='white'
      ? (this.results.find(r=>r.nm===570)||this.results[Math.floor(this.results.length/2)])
      : this.results[0];
    if (!pr) return;

    document.getElementById('v-r1').textContent = pr.r1_deg.toFixed(2);
    document.getElementById('v-r2').textContent = pr.r2_deg.toFixed(2);
    document.getElementById('v-sum').textContent = pr.verifyR1R2.toFixed(2);
    document.getElementById('v-apex').textContent = this.state.apexDeg.toFixed(1);
    const valid = Math.abs(pr.verifyR1R2 - this.state.apexDeg) < 0.1;
    const statusEl = document.getElementById('v-status');
    statusEl.innerHTML = valid
      ? '<i class="fas fa-check"></i> متحقق'
      : '<i class="fas fa-times"></i> غير متحقق';
    statusEl.className = 'tir-badge ' + (valid ? 'tir-no' : 'tir-yes');
  }

  // ── 3D SCENE ──────────────────────────────────────────────────
  _init3D() {
    const mount = document.getElementById('three-mount');
    const W = mount.clientWidth||700, H = mount.clientHeight||380;

    this.renderer = new THREE.WebGLRenderer({antialias:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.setSize(W, H);
    this.renderer.setClearColor(0x060d1a);
    mount.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(44, W/H, 0.01, 100);
    this._orb = {theta:0, phi:1.25, r:8.5};
    this._camT = new THREE.Vector3(0,0,0);
    this._syncCam();
    this._bindOrbit();

    // Lighting
    this.scene.add(new THREE.AmbientLight(0x1a2a44, 1.0));
    const dl = new THREE.DirectionalLight(0xffffff,0.9);
    dl.position.set(4,6,5); this.scene.add(dl);
    const fl = new THREE.DirectionalLight(0x4488ff,0.3);
    fl.position.set(-4,2,-3); this.scene.add(fl);

    // Ground grid
    const grid = new THREE.GridHelper(24,48,0x0d1a2e,0x080f1d);
    grid.position.y = -1.9; this.scene.add(grid);

    // Groups
    this._prismG = new THREE.Group(); this.scene.add(this._prismG);
    this._rayG   = new THREE.Group(); this.scene.add(this._rayG);
    this._ovrG   = new THREE.Group(); this.scene.add(this._ovrG);

    // Laser emitter body
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09,0.12,0.5,16),
      new THREE.MeshStandardMaterial({color:0x1a2233,metalness:0.9,roughness:0.1})
    );
    cyl.rotation.z = Math.PI/2;
    this._emitterMesh = cyl; this.scene.add(cyl);

    const ringMat = new THREE.MeshBasicMaterial({color:0x00ccff});
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1,0.02,8,32), ringMat);
    ring.rotation.y = Math.PI/2;
    this._ringMesh = ring; this._ringMat = ringMat;
    this.scene.add(ring);

    // إعداد التلميح (tooltip) لنقاط الدخول/الخروج
    this._tooltip = document.createElement('div');
    this._tooltip.style.cssText = `
      position: fixed; background: rgba(0,0,0,0.8); color: white; padding: 4px 10px;
      border-radius: 6px; font-size: 0.7rem; pointer-events: none; z-index: 1000;
      visibility: hidden; white-space: nowrap; font-family: 'Cairo', sans-serif;
    `;
    document.body.appendChild(this._tooltip);

    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._hoverPoints = []; // سنملؤها في _buildOverlays

    // مستمع لحركة الفأرة للكشف عن التمرير
    this.renderer.domElement.addEventListener('mousemove', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this._mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this._raycaster.setFromCamera(this._mouse, this.camera);
      const intersects = this._raycaster.intersectObjects(this._hoverPoints);
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const type = obj.userData.type;
        this._tooltip.style.visibility = 'visible';
        this._tooltip.style.left = (e.clientX + 12) + 'px';
        this._tooltip.style.top = (e.clientY - 10) + 'px';
        this._tooltip.textContent = type === 'entry' ? 'نقطة الدخول' : 'نقطة الخروج';
      } else {
        this._tooltip.style.visibility = 'hidden';
      }
    });

    this._buildPrism();
    window.addEventListener('resize', ()=>this._resize());
  }

  _syncCam() {
    const {theta,phi,r} = this._orb;
    this.camera.position.set(
      r*Math.sin(phi)*Math.sin(theta),
      r*Math.cos(phi),
      r*Math.sin(phi)*Math.cos(theta)
    );
    this.camera.lookAt(this._camT);
  }

  _bindOrbit() {
    const el = this.renderer.domElement;
    const o = this._orb;
    let drag=false, px=0, py=0;
    el.addEventListener('mousedown',  e=>{drag=true; px=e.clientX; py=e.clientY;});
    window.addEventListener('mouseup',()=>drag=false);
    el.addEventListener('mousemove',  e=>{
      if(!drag) return;
      o.theta += (e.clientX-px)*0.007;
      o.phi = Math.max(0.02, Math.min(1.35, o.phi-(e.clientY-py)*0.005));
      px=e.clientX; py=e.clientY; this._syncCam();
    });
    el.addEventListener('wheel', e=>{
      o.r = Math.max(3,Math.min(18,o.r+e.deltaY*0.012));
      this._syncCam(); e.preventDefault();
    },{passive:false});
    let lx=0,ly=0;
    el.addEventListener('touchstart', e=>{lx=e.touches[0].clientX; ly=e.touches[0].clientY;});
    el.addEventListener('touchmove',  e=>{
      o.theta += (e.touches[0].clientX-lx)*0.007;
      o.phi = Math.max(0.02,Math.min(1.35,o.phi-(e.touches[0].clientY-ly)*0.005));
      lx=e.touches[0].clientX; ly=e.touches[0].clientY;
      this._syncCam(); e.preventDefault();
    },{passive:false});
  }

  // ── BUILD PRISM MESH ─────────────────────────────────────────
  _buildPrism() {
    this._prismG.clear();
    const bv = prismVerts(this.state.apexDeg, 2.0);
    const depth = 2.4;
    const shape = new THREE.Shape();
    shape.moveTo(bv[0].x, bv[0].y);
    shape.lineTo(bv[1].x, bv[1].y);
    shape.lineTo(bv[2].x, bv[2].y);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false});
    geo.translate(0,0,-depth/2);

    const mat = new THREE.MeshPhysicalMaterial({
      color:0x99ccff, metalness:0, roughness:0.0,
      transmission:0.55, opacity:0.70, transparent:true,
      reflectivity:0.35, clearcoat:0.8, clearcoatRoughness:0.0,
      side:THREE.DoubleSide, depthWrite:false,
    });
    this._prismG.add(new THREE.Mesh(geo,mat));

    const edg = new THREE.EdgesGeometry(geo);
    const eMat = new THREE.LineBasicMaterial({color:0x55ddff,linewidth:2,transparent:true,opacity:0.95});
    this._prismG.add(new THREE.LineSegments(edg,eMat));

    this._prismG.rotation.z = this.state.rotDeg * Math.PI/180;
  }

  _init2D() {
    this._c2 = document.getElementById('canvas2d');
    this._ctx = this._c2.getContext('2d');
  }

  compute() {
    const {state} = this;
    const mat = MATERIALS[state.material];
    const wls = state.wavelength==='white'
      ? WHITE_WLS
      : [SINGLE_WL[state.wavelength]||WHITE_WLS[5]];

    this.results = [];
    for (const w of wls) {
      const r = traceRay(state.apexDeg, mat, w.nm, state.theta1, state.rotDeg);
      if (r) this.results.push({...r, hex:w.hex});
    }
    this._build3DRays();
    this._buildOverlays();
    this._updatePanel();
    this._updateEmitter();
    this._draw2D();
    this._updateVerifyCard();  // تحديث البطاقة التعليمية
  }

  // ── 3D RAYS (تم إصلاح اللون الأبيض) ──────────────────────
  _build3DRays() {
    while (this._rayG.children.length) this._rayG.remove(this._rayG.children[0]);
    if (!this.results.length) return;

    const Z=0, REACH=5.5;
    const isW = this.state.wavelength==='white';

    // شعاع أبيض واحد قبل المنشور
    if (isW && this.results.length > 0) {
      const r0 = this.results[0];
      const whiteCol = new THREE.Color('#ffffff');
      this._tube(
        new THREE.Vector3(r0.rayOrigin.x, r0.rayOrigin.y, Z),
        new THREE.Vector3(r0.entryPt.x, r0.entryPt.y, Z),
        whiteCol, 1.0, 0.025
      );
    }

    for (const r of this.results) {
      const c = new THREE.Color(r.hex);
      const w = isW ? 0.013 : 0.022;
      const op = isW ? 0.55 : 0.95;

      if (!isW) {
        this._tube(
          new THREE.Vector3(r.rayOrigin.x, r.rayOrigin.y, Z),
          new THREE.Vector3(r.entryPt.x, r.entryPt.y, Z),
          c, op, w
        );
      }

      this._tube(
        new THREE.Vector3(r.entryPt.x, r.entryPt.y, Z),
        new THREE.Vector3(r.exitPt.x, r.exitPt.y, Z),
        c, op*0.85, w*0.85
      );

      if (!r.tirOccurs && r.exitDir) {
        const ep = {x:r.exitPt.x+r.exitDir.x*REACH, y:r.exitPt.y+r.exitDir.y*REACH};
        this._tube(
          new THREE.Vector3(r.exitPt.x, r.exitPt.y, Z),
          new THREE.Vector3(ep.x, ep.y, Z),
          c, op, isW?0.015:0.024
        );
      } else if (r.tirOccurs && r.tirDir) {
        const tp = {x:r.exitPt.x+r.tirDir.x*REACH, y:r.exitPt.y+r.tirDir.y*REACH};
        this._tube(
          new THREE.Vector3(r.exitPt.x, r.exitPt.y, Z),
          new THREE.Vector3(tp.x, tp.y, Z),
          new THREE.Color(0xff5500), 0.9, 0.025
        );
      }
    }

    const pr = this.results[Math.floor(this.results.length/2)];
    if (pr) {
      this._glowDot(new THREE.Vector3(pr.entryPt.x,pr.entryPt.y,Z), 0xffffff);
      if (!pr.tirOccurs) this._glowDot(new THREE.Vector3(pr.exitPt.x,pr.exitPt.y,Z), 0xffffff);
      else if (pr.tirOccurs) this._glowDot(new THREE.Vector3(pr.exitPt.x,pr.exitPt.y,Z), 0xff4400);
    }
  }

  _tube(from, to, color, opacity, radius) {
    const path = new THREE.LineCurve3(from,to);
    const g = new THREE.TubeGeometry(path,1,radius,6,false);
    this._rayG.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false})));
    const gg = new THREE.TubeGeometry(path,1,radius*3,6,false);
    this._rayG.add(new THREE.Mesh(gg, new THREE.MeshBasicMaterial({color,transparent:true,opacity:opacity*0.10,depthWrite:false})));
  }

  _glowDot(pos, colorHex) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.06,10,10),
      new THREE.MeshBasicMaterial({color:colorHex,transparent:true,opacity:0.95,depthWrite:false}));
    m.position.copy(pos); this._rayG.add(m);
    const gm = new THREE.Mesh(new THREE.SphereGeometry(0.18,10,10),
      new THREE.MeshBasicMaterial({color:colorHex,transparent:true,opacity:0.15,depthWrite:false}));
    gm.position.copy(pos); this._rayG.add(gm);
  }

  // ── 3D OVERLAYS (تم إصلاح نقاط الدخول/الخروج وإزالة التحقق من المشهد) ──
  _buildOverlays() {
    while (this._ovrG.children.length) this._ovrG.remove(this._ovrG.children[0]);
    if (!this.results.length) return;

    const pr = this.results[Math.floor(this.results.length/2)];
    const Z = 0.02;
    const p3 = (p2) => new THREE.Vector3(p2.x, p2.y, Z);

    if (this.state.showLabels) {
      const midIn = v.mk((pr.rayOrigin.x+pr.entryPt.x)/2, (pr.rayOrigin.y+pr.entryPt.y)/2);
      this._lbl(`θ₁=${pr.theta1_deg.toFixed(1)}°`, p3(v.add(midIn,v.mk(0,0.42))), '#7ddcf0', 0.52);


      if (!pr.tirOccurs && pr.exitDir && pr.theta2_deg !== null) {
        const ep = v.add(pr.exitPt, v.mul(pr.exitDir, 1.3));
        this._lbl(`θ₂=${pr.theta2_deg.toFixed(1)}°`, p3(v.add(ep,v.mk(0,0.4))), '#7ddcf0', 0.52);
      }
      if (pr.devDeg !== null && !pr.tirOccurs) {
        const mid = v.mk((pr.entryPt.x+pr.exitPt.x)/2, (pr.entryPt.y+pr.exitPt.y)/2+0.55);
        this._lbl(`δ=${pr.devDeg.toFixed(1)}°`, p3(mid), '#ffd700', 0.50);
      }
      if (pr.tirOccurs) {
        this._lbl('⚠ انعكاس داخلي كلي',
          new THREE.Vector3(pr.exitPt.x+0.1, pr.exitPt.y+0.6, Z), '#ff6644', 0.54);
      }
    }

    if (this.state.eduMode) {
      const NL = 0.9;

      if (this.state.eduNormals) {
        this._dashLine(p3(pr.entryPt),
          p3(v.add(pr.entryPt, v.mul(pr.entryNorm, NL))), 0xffffff, 0.8);
        this._dashLine(p3(pr.entryPt),
          p3(v.add(pr.entryPt, v.mul(v.neg(pr.entryNorm), NL*0.5))), 0xffffff, 0.4);
        this._lbl(`r₁=${pr.r1_deg.toFixed(1)}°`,
          p3(v.add(pr.entryPt, v.mul(pr.entryNorm, NL+0.28))), '#ffaa44', 0.40);

        if (!pr.tirOccurs) {
          this._dashLine(p3(pr.exitPt),
            p3(v.add(pr.exitPt, v.mul(pr.exitNorm, NL))), 0xffffff, 0.8);
          this._dashLine(p3(pr.exitPt),
            p3(v.add(pr.exitPt, v.mul(v.neg(pr.exitNorm), NL*0.5))), 0xffffff, 0.4);
          this._lbl(`r₂=${pr.r2_deg.toFixed(1)}°`,
            p3(v.add(pr.exitPt, v.mul(pr.exitNorm, NL+0.28))), '#ffaa44', 0.40);
        }
      }

      if (this.state.eduPoints) {
        const addPoint = (pt, color, type) => {
          if (!pt || typeof pt.x==='undefined') return;
          const dotG = new THREE.SphereGeometry(0.12,16,16);
          const dotM = new THREE.MeshBasicMaterial({color, depthTest:false});
          const dot = new THREE.Mesh(dotG, dotM);
          dot.position.set(pt.x, pt.y, Z+0.02);
          dot.userData = { type };
          this._ovrG.add(dot);

          const glowG = new THREE.SphereGeometry(0.22,16,16);
          const glowM = new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.25, depthTest:false});
          const glow = new THREE.Mesh(glowG, glowM);
          glow.position.copy(dot.position);
          this._ovrG.add(glow);
        };
        addPoint(pr.entryPt, 0x00ff88, 'entry');
        if (!pr.tirOccurs) {
          addPoint(pr.exitPt, 0x00ff88, 'exit');
        } else {
          addPoint(pr.exitPt, 0xff4400, 'exit');
        }
      }
    }

    // تحديث قائمة النقاط للـ tooltip
    this._hoverPoints = [];
    this._ovrG.children.forEach(child => {
      if (child.userData && child.userData.type) {
        this._hoverPoints.push(child);
      }
    });
  }

  _lbl(text, pos, color, scale) {
    const cv = document.createElement('canvas');
    cv.width=380; cv.height=80;
    const ctx=cv.getContext('2d');
    ctx.font='Bold 33px Cairo,Arial,sans-serif';
    ctx.fillStyle=color;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(text,190,40);
    const tex=new THREE.CanvasTexture(cv);
    tex.minFilter=THREE.LinearFilter;
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,transparent:true}));
    sp.scale.set(scale*2.5,scale*0.55,1);
    sp.position.copy(pos);
    this._ovrG.add(sp);
  }

  _dashLine(from, to, colorHex, opacity) {
    const g=new THREE.BufferGeometry().setFromPoints([from,to]);
    const m=new THREE.LineDashedMaterial({color:colorHex,dashSize:0.14,gapSize:0.08,
      transparent:true,opacity,depthTest:false,linewidth:1});
    const l=new THREE.Line(g,m); l.computeLineDistances();
    this._ovrG.add(l);
  }

  _draw2D() {
    const cv = this._c2, ctx = this._ctx;
    const parent = cv.parentElement;
    const W = parent.clientWidth - 120;
    const H = 130;
    if (cv.width !== W) cv.width = W;
    cv.height = H;
    ctx.clearRect(0,0,W,H);

    if (!this.results.length) return;

    const pr = this.results[Math.floor(this.results.length/2)];
    const allPts = this.results.flatMap(r => {
      const pts = [r.rayOrigin, r.entryPt, r.exitPt];
      if (!r.tirOccurs && r.exitDir)
        pts.push(v.add(r.exitPt, v.mul(r.exitDir, 4.5)));
      else if (r.tirOccurs && r.tirDir)
        pts.push(v.add(r.exitPt, v.mul(r.tirDir, 2.5)));
      return pts;
    });

    const xs = allPts.map(p=>p.x), ys = allPts.map(p=>p.y);
    const xmin=Math.min(...xs)-0.3, xmax=Math.max(...xs)+0.3;
    const ymin=Math.min(...ys)-0.5, ymax=Math.max(...ys)+0.5;
    const pad=12;
    const scaleX = (W-2*pad)/(xmax-xmin);
    const scaleY = (H-2*pad)/(ymax-ymin);
    const sc = Math.min(scaleX,scaleY);
    const toX = p => pad + (p.x-xmin)*sc + (W-2*pad-(xmax-xmin)*sc)/2;
    const toY = p => H-pad - (p.y-ymin)*sc - (H-2*pad-(ymax-ymin)*sc)/2;

    ctx.fillStyle='#060d1a'; ctx.fillRect(0,0,W,H);
    const vv = pr.verts;
    ctx.beginPath();
    ctx.moveTo(toX(vv[0]),toY(vv[0]));
    for (let i=1;i<vv.length;i++) ctx.lineTo(toX(vv[i]),toY(vv[i]));
    ctx.closePath();
    ctx.fillStyle='rgba(100,180,255,0.12)';
    ctx.fill();
    ctx.strokeStyle='rgba(80,200,255,0.8)'; ctx.lineWidth=1.5;
    ctx.stroke();

    const REACH2D = 4.5;
    for (const r of this.results) {
      ctx.strokeStyle = r.hex;
      ctx.lineWidth = this.state.wavelength==='white' ? 1.0 : 1.8;
      ctx.globalAlpha = this.state.wavelength==='white' ? 0.7 : 1.0;

      ctx.beginPath();
      ctx.moveTo(toX(r.rayOrigin),toY(r.rayOrigin));
      ctx.lineTo(toX(r.entryPt),toY(r.entryPt));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(toX(r.entryPt),toY(r.entryPt));
      ctx.lineTo(toX(r.exitPt),toY(r.exitPt));
      ctx.stroke();
      if (!r.tirOccurs && r.exitDir) {
        const ep2 = v.add(r.exitPt, v.mul(r.exitDir, REACH2D));
        ctx.beginPath();
        ctx.moveTo(toX(r.exitPt),toY(r.exitPt));
        ctx.lineTo(toX(ep2),toY(ep2));
        ctx.stroke();
      } else if (r.tirOccurs && r.tirDir) {
        const tp2 = v.add(r.exitPt, v.mul(r.tirDir, 2.5));
        ctx.strokeStyle='#ff5500';
        ctx.beginPath();
        ctx.moveTo(toX(r.exitPt),toY(r.exitPt));
        ctx.lineTo(toX(tp2),toY(tp2));
        ctx.stroke();
      }
    }
    ctx.globalAlpha=1.0;

    ctx.fillStyle='#ffffff';
    ctx.beginPath(); ctx.arc(toX(pr.entryPt),toY(pr.entryPt),3.5,0,Math.PI*2); ctx.fill();
    if (!pr.tirOccurs) {
      ctx.beginPath(); ctx.arc(toX(pr.exitPt),toY(pr.exitPt),3.5,0,Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle='#ff5500';
      ctx.beginPath(); ctx.arc(toX(pr.exitPt),toY(pr.exitPt),3.5,0,Math.PI*2); ctx.fill();
    }

    if (this.state.eduMode && this.state.eduNormals) {
      ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=1; ctx.setLineDash([4,3]);
      const NL2 = 0.65;
      const en2 = v.add(pr.entryPt, v.mul(pr.entryNorm, NL2));
      ctx.beginPath(); ctx.moveTo(toX(pr.entryPt),toY(pr.entryPt)); ctx.lineTo(toX(en2),toY(en2)); ctx.stroke();
      if (!pr.tirOccurs) {
        const xn2 = v.add(pr.exitPt, v.mul(pr.exitNorm, NL2));
        ctx.beginPath(); ctx.moveTo(toX(pr.exitPt),toY(pr.exitPt)); ctx.lineTo(toX(xn2),toY(xn2)); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }

  _updateEmitter() {
    if (!this.results.length) return;
    const r = this.results[0];
    this._emitterMesh.position.set(r.rayOrigin.x-0.4, r.rayOrigin.y, 0);
    this._ringMesh.position.set(r.rayOrigin.x-0.05, r.rayOrigin.y, 0);
    const clrHex = this.state.wavelength==='white'
      ? 0xffffff
      : parseInt((SINGLE_WL[this.state.wavelength]?.hex||'#00aaff').replace('#',''),16);
    this._ringMat.color.setHex(clrHex);
  }
  

  _updatePanel() {
    const pr = this.state.wavelength==='white'
      ? (this.results.find(r=>r.nm===570)||this.results[Math.floor(this.results.length/2)])
      : this.results[0];

    const set=(id,val,d=2)=>{
      const el=document.getElementById(id);
      if(!el) return;
      el.textContent=(val!==null&&val!==undefined&&!isNaN(val))?parseFloat(val).toFixed(d):'—';
    };
    if(!pr){['an-incident','an-n','an-r1','an-r2','an-exit','an-dev','an-crit','an-verify']
      .forEach(id=>{const e=document.getElementById(id);if(e)e.textContent='—';});return;}

    set('an-incident',pr.theta1_deg);
    set('an-n',pr.n2,4);
    set('an-r1',pr.r1_deg);
    set('an-r2',pr.r2_deg);
    set('an-exit',pr.theta2_deg);
    set('an-dev',pr.devDeg);
    set('an-crit',pr.critDeg);
    set('an-verify',pr.verifyR1R2);

    const te=document.getElementById('an-tir');
    if(te) {
      const tir=this.results.some(r=>r.tirOccurs);
      te.innerHTML=tir
        ?'<span class="tir-badge tir-yes"><i class="fas fa-exclamation-triangle"></i> انعكاس داخلي كلي</span>'
        :'<span class="tir-badge tir-no"><i class="fas fa-check"></i> لا يوجد انعكاس داخلي</span>';
    }
  }

  _loop() {
    requestAnimationFrame(()=>this._loop());
    const now=performance.now();
    const dt=Math.min((now-this._lastT)/1000,0.1);
    this._lastT=now;
    this._fps.push(1/dt);
    if(this._fps.length>30) this._fps.shift();
    document.getElementById('fps-counter').textContent=
      Math.round(this._fps.reduce((a,b)=>a+b,0)/this._fps.length);
          // تحريك سلس لزاوية السقوط عند استخدام المنزلق
    if (this._slidingIncident && !this.state.animate) {
      const diff = this._targetTheta1 - this.state.theta1;
      if (Math.abs(diff) < 0.02) {
        this.state.theta1 = this._targetTheta1;
        this._slidingIncident = false;
      } else {
        this.state.theta1 += diff * 0.25; // سرعة التقارب، يمكن تعديلها
      }
      // تحديث القيمة المعروضة
      document.getElementById('val-incident').textContent = this.state.theta1.toFixed(1) + '°';
      document.getElementById('sl-incident').value = this.state.theta1;
      this._slBg(document.getElementById('sl-incident'));
      this.compute();
    }

    if(this.state.animate) {
      this._slidingIncident = false;
      this._animT += dt*0.4;
      const na = 40+28*Math.sin(this._animT);
      this.state.theta1=na;
      const sl=document.getElementById('sl-incident');
      sl.value=na;
      document.getElementById('val-incident').textContent=na.toFixed(1)+'°';
      this._slBg(sl);
      this.compute();
    }

    this._prismG.rotation.z = this.state.rotDeg*Math.PI/180;
    if(this._ringMesh) this._ringMesh.scale.setScalar(1+0.04*Math.sin(now*0.006));

    this.renderer.render(this.scene,this.camera);
  }

  _bindControls() {
    const sl=(id,key,valId)=>{
      const el=document.getElementById(id), ve=document.getElementById(valId);
      this._slBg(el);
      el.addEventListener('input',()=>{
        this.state[key]=parseFloat(el.value);
        if(ve) ve.textContent=parseFloat(el.value).toFixed(1)+'°';
        this._slBg(el);
        if(key==='apexDeg') this._buildPrism();
        this.compute();
      });
    };
    const slIncident = document.getElementById('sl-incident');
    const veIncident = document.getElementById('val-incident');
    this._slBg(slIncident);
    slIncident.addEventListener('input', () => {
      const target = parseFloat(slIncident.value);
      this._targetTheta1 = target;
      this._slidingIncident = true;
      // تحديث شريط الخلفية فوراً
      this._slBg(slIncident);
    });
    sl('sl-rotation','rotDeg','val-rotation');
    sl('sl-apex','apexDeg','val-apex');

    document.querySelectorAll('.mat-btn').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.mat-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); this.state.material=b.dataset.mat; this.compute();
    }));
    document.querySelectorAll('.col-btn').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.col-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); this.state.wavelength=b.dataset.wl; this.compute();
    }));

    document.getElementById('tog-animate').addEventListener('change',e=>this.state.animate=e.target.checked);
    document.getElementById('tog-labels').addEventListener('change',e=>{
      this.state.showLabels=e.target.checked; this._buildOverlays();
    });
    document.getElementById('tog-edu').addEventListener('change',e=>{
      this.state.eduMode=e.target.checked;
      document.getElementById('edu-controls').style.display=e.target.checked?'':'none';
      this._buildOverlays(); this._draw2D();
      this._updateVerifyCard();  // إظهار/إخفاء بطاقة التحقق
    });
    [{id:'edu-normals',k:'eduNormals'},{id:'edu-points',k:'eduPoints'},{id:'edu-verify',k:'eduVerify'}]
      .forEach(({id,k})=>{
        const el=document.getElementById(id);
        if(el) el.addEventListener('change',e=>{
          this.state[k]=e.target.checked;
          this._buildOverlays();
          this._draw2D();
          this._updateVerifyCard();  // تحديث البطاقة
        });
      });
  }

  _slBg(el) {
    const min=parseFloat(el.min),max=parseFloat(el.max),val=parseFloat(el.value);
    el.style.setProperty('--pct',((val-min)/(max-min)*100).toFixed(1)+'%');
  }

  // ── PUBLIC ──────────────────────────────────────────────────
  resetCamera(){this._orb.theta=0;this._orb.phi=0.16;this._orb.r=9.5;this._syncCam();}
  zoomIn(){this._orb.r=Math.max(3,this._orb.r-1.0);this._syncCam();}
  zoomOut(){this._orb.r=Math.min(18,this._orb.r+1.0);this._syncCam();}

  reset(){
    Object.assign(this.state,{theta1:38,rotDeg:0,apexDeg:60,material:'glass',wavelength:'white'});
    document.getElementById('sl-incident').value=38;
    document.getElementById('sl-rotation').value=0;
    document.getElementById('sl-apex').value=60;
    document.getElementById('val-incident').textContent='38.0°';
    document.getElementById('val-rotation').textContent='0.0°';
    document.getElementById('val-apex').textContent='60.0°';
    ['sl-incident','sl-rotation','sl-apex'].forEach(id=>this._slBg(document.getElementById(id)));
    document.querySelectorAll('.mat-btn').forEach(b=>b.classList.toggle('active',b.dataset.mat==='glass'));
    document.querySelectorAll('.col-btn').forEach(b=>b.classList.toggle('active',b.dataset.wl==='white'));
    this._buildPrism(); this.compute(); this.resetCamera();
  }

  _resize(){
    const m=document.getElementById('three-mount');
    const W=m.clientWidth,H=Math.max(m.clientHeight,300);
    this.camera.aspect=W/H; this.camera.updateProjectionMatrix();
    this.renderer.setSize(W,H);
    this._draw2D();
  }
}

const sim=new PrismSim();
window.sim=sim;

function copyAccessCode(){
  navigator.clipboard.writeText(document.getElementById('accessCodeDisplay').textContent).then(()=>{
    const i=document.getElementById('copyIcon');
    i.className='fas fa-check'; i.style.color='#10b981';
    setTimeout(()=>{i.className='fas fa-copy';i.style.color='';},2000);
  });
}
window.copyAccessCode=copyAccessCode;
</script>
</body>
</html>