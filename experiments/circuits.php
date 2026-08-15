<?php
require_once '../config.php';
require_once '../functions.php';

$sub = isAuthenticated();

$user_name = $_SESSION['user']['name'] ?? $_SESSION['user_name'] ?? 'معلم معتمد';
$user_contact = $_SESSION['user']['whatsappNumber'] ?? $_SESSION['user']['phone'] ?? $_SESSION['user']['email'] ?? '';

$exp_active = mysqli_fetch_assoc(mysqli_query($conn, "SELECT is_active FROM experiments WHERE id = 2"))['is_active'];
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
<title>الدائرة الكهربائية | مختبرات العلوم التقنية</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
:root{
  --teal-900:#002d3d;--teal-800:#004e66;--teal-700:#006b8a;
  --teal-600:#0089ae;--teal-500:#00a8d4;--teal-400:#2ec4e8;
  --teal-300:#7ddcf0;--teal-100:#e6f7fc;--teal-50:#f0fbfe;
  --white:#fff;--gray-50:#f8fafc;--gray-100:#f1f5f9;
  --gray-200:#e2e8f0;--gray-300:#cbd5e1;--gray-400:#94a3b8;
  --gray-600:#475569;--gray-800:#1e293b;
  --shadow-sm:0 1px 3px rgba(0,0,0,.03);
  --shadow-md:0 6px 16px -4px rgba(0,0,0,.06);
  --shadow-lg:0 16px 32px -8px rgba(0,0,0,.08);
  --r-lg:24px;--r-md:18px;--tr:.28s cubic-bezier(.4,0,.2,1);
}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Cairo',sans-serif;background:#f0f4f9;background-image:radial-gradient(circle at 10% 20%,rgba(0,137,174,.04) 0%,transparent 50%),radial-gradient(circle at 90% 70%,rgba(46,196,232,.03) 0%,transparent 50%);color:var(--gray-800);min-height:100vh;display:flex;flex-direction:column;}

.lab-header{width:100%;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.88);backdrop-filter:blur(24px);border-bottom:2px solid rgba(0,78,102,.1);padding:12px 32px;box-shadow:0 4px 24px -10px rgba(0,0,0,.05);gap:20px;flex-wrap:wrap;position:sticky;top:0;z-index:200;}
.lab-brand{display:flex;align-items:center;gap:14px;text-decoration:none;cursor:default;}
.brand-icon{height:46px;width:46px;border-radius:14px;background:linear-gradient(135deg,var(--teal-700),var(--teal-400));display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:#fff;}
.lab-brand span{font-weight:800;color:var(--teal-800);font-size:1.1rem;}
.exp-badge{background:linear-gradient(135deg,var(--teal-700),var(--teal-500));color:#fff;padding:8px 26px;border-radius:50px;font-weight:700;font-size:.88rem;display:flex;align-items:center;gap:10px;}
.mode-segmented{display:flex;gap:4px;background:var(--gray-100);padding:5px;border-radius:50px;}
.mode-btn{padding:9px 22px;border-radius:50px;border:none;background:transparent;cursor:pointer;font-family:'Cairo',sans-serif;font-weight:700;font-size:.84rem;transition:var(--tr);color:var(--gray-600);white-space:nowrap;}
.mode-btn:hover{color:var(--teal-800);background:rgba(0,137,174,.06);}
.mode-btn.active{background:linear-gradient(135deg,var(--teal-700),var(--teal-600));color:#fff;box-shadow:0 6px 18px rgba(0,107,138,.25);}
.exit-btn{background:rgba(255,255,255,.75);border:1px solid rgba(220,38,38,.15);padding:10px 24px;border-radius:50px;color:#dc2626;text-decoration:none;font-weight:700;transition:var(--tr);font-size:.88rem;display:flex;align-items:center;gap:8px;}
.exit-btn:hover{background:#fee2e2;}

.main-wrap{max-width:1440px;margin:22px auto 20px;padding:0 24px;flex:1;display:flex;flex-direction:column;gap:20px;}
.circuit-grid{display:grid;grid-template-columns:268px 1fr;gap:22px;align-items:start;}

.card{background:rgba(255,255,255,.82);backdrop-filter:blur(12px);border-radius:var(--r-md);padding:20px;border:1px solid rgba(255,255,255,.65);box-shadow:var(--shadow-md);transition:all .3s;}
.card:hover{box-shadow:var(--shadow-lg);transform:translateY(-2px);}
.card-title{font-weight:800;font-size:.88rem;margin-bottom:14px;color:var(--teal-800);display:flex;align-items:center;gap:10px;border-right:4px solid var(--teal-600);padding-right:14px;}

.comp-btn{display:flex;align-items:center;gap:12px;padding:11px 14px;margin:7px 0;border-radius:40px;cursor:pointer;transition:all .2s;border:1.5px solid var(--gray-200);background:var(--gray-50);font-size:.84rem;font-weight:600;user-select:none;}
.comp-btn:hover{background:var(--teal-50);border-color:var(--teal-400);transform:translateX(-5px);}
.comp-btn.selected{background:var(--teal-100);border-color:var(--teal-600);box-shadow:0 0 0 3px rgba(0,137,174,.15);}
.comp-icon{font-size:1.3rem;width:28px;text-align:center;}

.tool-btn{background:#fff;border:1px solid var(--gray-300);padding:8px 16px;border-radius:40px;cursor:pointer;font-family:'Cairo',sans-serif;font-weight:600;font-size:.78rem;color:var(--gray-600);transition:var(--tr);display:flex;align-items:center;gap:6px;width:100%;margin-top:7px;}
.tool-btn:hover{background:var(--teal-50);border-color:var(--teal-400);}
.tool-btn.primary{background:linear-gradient(135deg,var(--teal-700),var(--teal-500));color:#fff;border-color:transparent;}
.tool-btn.primary:hover{filter:brightness(1.1);}
.tool-btn.danger{background:#ef4444;color:#fff;border-color:transparent;}

.work-card{background:#fff;border-radius:var(--r-lg);border:1px solid var(--gray-200);overflow:hidden;box-shadow:var(--shadow-md);display:flex;flex-direction:column;}
.work-header{padding:13px 22px;background:var(--gray-50);border-bottom:1px solid var(--gray-200);font-weight:700;display:flex;justify-content:space-between;align-items:center;font-size:.88rem;gap:10px;flex-wrap:wrap;}
.live-badge{display:flex;align-items:center;gap:7px;}
.live-dot{width:9px;height:9px;border-radius:50%;background:#10b981;animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5);}50%{box-shadow:0 0 0 5px rgba(16,185,129,0);}}
#circuitCanvas{display:block;width:100%;height:490px;background:#fafcff;cursor:crosshair;touch-action:none;}

.status-bar{padding:9px 22px;font-size:.8rem;font-weight:700;display:flex;align-items:center;gap:8px;transition:all .3s;background:#fffbe6;border-bottom:1px solid #fde68a;color:#92400e;}
.status-bar.success{background:#ecfdf5;border-color:#10b981;color:#065f46;}
.status-bar.error{background:#fef2f2;border-color:#fca5a5;color:#991b1b;}
.status-bar.info{background:var(--teal-50);border-color:var(--teal-200);color:var(--teal-800);}

.readings{display:flex;gap:14px;padding:14px 22px;background:var(--gray-50);border-top:1px solid var(--gray-200);flex-wrap:wrap;}
.read-item{background:#fff;border-radius:40px;padding:9px 18px;border:1px solid var(--gray-200);font-size:.8rem;font-weight:600;box-shadow:var(--shadow-sm);transition:all .3s;}
.read-item strong{color:var(--teal-700);font-size:1.05rem;}

.branch-panel{display:none;padding:10px 22px;background:linear-gradient(135deg,var(--teal-50),#fff);border-top:1px solid var(--teal-100);gap:10px;flex-wrap:wrap;align-items:center;}
.branch-panel.visible{display:flex;}
.branch-chip{padding:6px 14px;border-radius:20px;font-size:.76rem;font-weight:700;border:1.5px solid;cursor:pointer;transition:all .2s;}
.branch-chip.on{background:var(--teal-600);color:#fff;border-color:var(--teal-600);}
.branch-chip.off{background:#fff;color:#dc2626;border-color:#fca5a5;}

.explanation-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;}
.explanation-card{background:rgba(255,255,255,.82);backdrop-filter:blur(12px);border-radius:var(--r-lg);padding:22px;border:1px solid rgba(255,255,255,.65);box-shadow:var(--shadow-md);transition:all .3s;}
.explanation-card:hover{box-shadow:var(--shadow-lg);transform:translateY(-3px);}
.explanation-card h3{font-size:.95rem;color:var(--teal-800);margin-bottom:12px;font-weight:800;}
.explanation-card p{font-size:.84rem;line-height:1.85;color:var(--gray-600);margin-bottom:8px;}
.explanation-card ul{list-style:none;}
.explanation-card ul li{margin:8px 0;display:flex;align-items:flex-start;gap:9px;font-size:.83rem;}
.explanation-card ul li i{color:var(--teal-600);width:20px;margin-top:2px;flex-shrink:0;}
.formula-row{display:flex;align-items:center;gap:12px;background:var(--teal-50);border:1px solid var(--teal-100);border-radius:12px;padding:10px 14px;margin:10px 0;font-size:.82rem;}
.formula-badge{background:var(--teal-600);color:#fff;padding:4px 12px;border-radius:20px;font-weight:800;font-size:.78rem;font-family:monospace;white-space:nowrap;}
.topology-badge{padding:5px 16px;border-radius:20px;font-weight:800;font-size:.8rem;display:inline-flex;align-items:center;gap:6px;}
.badge-series{background:#e0f2fe;color:#0369a1;}
.badge-parallel{background:#dcfce7;color:#15803d;}
.badge-mixed{background:#fef9c3;color:#854d0e;}
.badge-unknown{background:var(--gray-100);color:var(--gray-600);}

.lab-footer{background:rgba(255,255,255,.78);backdrop-filter:blur(20px);border-top:2px solid rgba(0,78,102,.1);padding:18px 0;margin-top:auto;}
.footer-content{max-width:1440px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:20px;}
.footer-code{display:flex;align-items:center;gap:12px;background:#fff;padding:10px 20px;border-radius:50px;border:1px solid var(--gray-200);box-shadow:var(--shadow-sm);}
.footer-code code{background:var(--teal-50);color:var(--teal-700);font-family:monospace;font-weight:700;padding:5px 14px;border-radius:28px;cursor:pointer;}
.footer-copy{background:var(--teal-600);color:#fff;border:none;padding:7px 14px;border-radius:28px;cursor:pointer;}
.footer-copy:hover{background:var(--teal-700);}

/* ═══ Rotation Button ═══ */
#rotateBtn{display:none;background:linear-gradient(135deg,#7c3aed,#a78bfa);color:#fff;border:none;padding:8px 16px;border-radius:40px;cursor:pointer;font-family:'Cairo',sans-serif;font-weight:700;font-size:.78rem;margin-top:7px;width:100%;align-items:center;gap:6px;}
#rotateBtn.visible{display:flex;}
#rotateBtn:hover{filter:brightness(1.15);}

@media(max-width:900px){.circuit-grid{grid-template-columns:1fr;}}
</style>
</head>
<body>

<header class="lab-header">
  <a href="#" class="lab-brand" onclick="return false">
    <img src="../logo2.png" alt="Logo" style="height:46px;width:46px;border-radius:14px;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="brand-icon" style="display:none"><i class="fas fa-bolt"></i></div>
    <span>مختبرات العلوم التقنية للجميع</span>
  </a>
  <div class="exp-badge"><i class="fas fa-bolt"></i> تجربة الدائرة الكهربائية</div>
  <div class="mode-segmented">
    <button class="mode-btn active" data-mode="free"><i class="fas fa-paint-brush"></i> رسم حر</button>
    <button class="mode-btn" data-mode="series"><i class="fas fa-link"></i> توالي</button>
    <button class="mode-btn" data-mode="parallel"><i class="fas fa-code-branch"></i> توازي</button>
  </div>
  <a href="../index.php" class="exit-btn"><i class="fas fa-sign-out-alt"></i> خروج</a>
</header>

<div class="main-wrap">
  <div class="circuit-grid">
    <div class="card">
      <div class="card-title"><i class="fas fa-cubes"></i> المكونات</div>
      <div id="palette">
        <div class="comp-btn" data-type="battery"><span class="comp-icon"><i class="fas fa-car-battery"></i></span> بطارية 9V</div>
        <div class="comp-btn" data-type="bulb"><span class="comp-icon"><i class="fas fa-lightbulb"></i></span> مصباح 200Ω</div>
        <div class="comp-btn" data-type="switch"><span class="comp-icon"><i class="fas fa-toggle-on"></i></span> مفتاح</div>
        <div class="comp-btn" data-type="resistor"><span class="comp-icon"><i class="fas fa-grip-lines"></i></span> مقاومة 100Ω</div>
        <div class="comp-btn" data-type="junction"><span class="comp-icon"><i class="fas fa-circle-dot"></i></span> عقدة توصيل</div>
      </div>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--gray-100);">
        <button id="rotateBtn"><i class="fas fa-rotate-right"></i> تدوير ↻ </button>
        <button id="undoBtn" class="tool-btn"><i class="fas fa-undo"></i> تراجع </button>
        <button id="redoBtn" class="tool-btn"><i class="fas fa-redo"></i> إعادة </button>
        <button id="clearBtn" class="tool-btn danger"><i class="fas fa-trash"></i> مسح الكل</button>
      </div>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--gray-100);font-size:.75rem;color:var(--gray-400);line-height:1.9;">
        <strong style="color:var(--gray-600);">💡 تلميحات:</strong><br>
        • اختر مكوناً ثم انقر على اللوحة<br>
        • اسحب الأطراف الزرقاء للتوصيل<br>
        • انقر المفتاح لفتحه/إغلاقه<br>
        • كليك يمين أو Delete لحذف المكون<br>
        • انقر مكوناً لتحديده ثم اضغط على زر التدوير<br>
        • عقدة التوصيل تربط 3+ أسلاك معاً<br>
        • يمكن وضع أكثر من بطارية (توالي/توازي)
      </div>
    </div>

    <div class="work-card">
      <div class="work-header">
        <span class="live-badge"><span class="live-dot"></span> لوحة التوصيل التفاعلية</span>
        <div style="display:flex;gap:8px;align-items:center;">
          <span id="topologyDisplay" style="font-size:.8rem;"></span>
          <button id="powerBtn" class="tool-btn primary" style="width:auto;margin:0;"><i class="fas fa-power-off"></i> التيار يعمل</button>
        </div>
      </div>
      <div id="statusBar" class="status-bar">🔌 أضف مكونات وصلها ببعض لإكمال الدائرة.</div>
      <canvas id="circuitCanvas"></canvas>
      <div class="branch-panel" id="branchPanel">
        <span style="font-size:.78rem;font-weight:800;color:var(--teal-700);display:flex;align-items:center;gap:6px;white-space:nowrap;"><i class="fas fa-code-branch"></i> فروع التوازي:</span>
        <div id="branchChips" style="display:flex;gap:8px;flex-wrap:wrap;"></div>
      </div>
      <div class="readings">
        <div class="read-item">⚡ I_كلي: <strong id="currVal">0.000</strong> A</div>
        <div class="read-item">🔋 V_كلي: <strong id="voltVal">0.00</strong> V</div>
        <div class="read-item">🔧 R_كلي: <strong id="resVal">∞</strong> Ω</div>
        <div class="read-item">💡 المصابيح: <strong id="bulbState" style="color:#666;">مطفأة</strong></div>
        <div class="read-item">⚡ P: <strong id="powerVal">0.00</strong> W</div>
      </div>
    </div>
  </div>

  <div class="explanation-grid">
    <div class="explanation-card">
      <h3><i class="fas fa-lightbulb"></i> كيف تستخدم المختبر؟</h3>
      <ul>
        <li><i class="fas fa-mouse-pointer"></i> اختر مكوناً من الشريط ثم انقر على اللوحة لوضعه.</li>
        <li><i class="fas fa-plug"></i> لتوصيل سلك: انقر طرفاً أزرق ← ثم طرفاً آخر.</li>
        <li><i class="fas fa-circle-dot"></i> العقدة تربط ثلاثة أسلاك أو أكثر في نقطة واحدة.</li>
        <li><i class="fas fa-hand-pointer"></i> انقر المفتاح لفتحه أو إغلاقه.</li>
        <li><i class="fas fa-rotate-right"></i> انقر مكوناً لتحديده واضغط  زر التدوير.</li>
        <li><i class="fas fa-trash-alt"></i> كليك يمين أو Delete لحذف المكون المحدد.</li>
        <li><i class="fas fa-code-branch"></i> في التوازي: اضغط "افتح فرع X" لرؤية بقية الفروع تعمل.</li>
      </ul>
    </div>
    <div class="explanation-card">
      <h3><i class="fas fa-graduation-cap"></i> تحليل الدائرة</h3>
      <p>🔍 <strong>نوع الدائرة:</strong> <span id="circuitType"><span class="topology-badge badge-unknown">غير محددة</span></span></p>
      <p id="circuitReason" style="font-size:.8rem;color:var(--gray-600);margin-top:6px;line-height:1.7;">قم ببناء دائرة لترى تحليلها.</p>
      <div class="formula-row"><span class="formula-badge">I = V / R</span><span>قانون أوم الأساسي</span></div>
      <div class="formula-row"><span class="formula-badge">P = V × I</span><span>القدرة الكهربائية</span></div>
      <div id="branchReadings" style="font-size:.78rem;line-height:2;color:var(--gray-600);margin-top:8px;"></div>
    </div>
    <div class="explanation-card">
      <h3><i class="fas fa-book-open"></i> التوالي مقابل التوازي</h3>
      <p><strong>🔗 التوالي:</strong> مسار واحد، تيار ثابت، جهد موزع. تعطّل عنصر = توقف الكل.</p>
      <p><strong>🔀 التوازي:</strong> فروع مستقلة، جهد ثابت، تيار مقسوم. تعطّل فرع لا يوقف الباقي.</p>
      <div class="formula-row"><span class="formula-badge">R_s = ΣRᵢ</span><span>مقاومة التوالي — تجمع</span></div>
      <div class="formula-row"><span class="formula-badge">1/R_p = Σ1/Rᵢ</span><span>مقاومة التوازي — تقل</span></div>
      <div class="formula-row"><span class="formula-badge">V_s = ΣVᵢ</span><span>بطاريات التوالي — جهودها تجمع</span></div>
    </div>
  </div>
</div>

<footer class="lab-footer">
  <div class="footer-content">
    <div class="footer-code">
      <i class="fas fa-key" style="color:var(--teal-600);"></i>
      <span>كود الدخول:</span>
      <code id="accessCodeDisplay" onclick="copyCode()">SCI-CIRCUIT-PERM-001</code>
      <button class="footer-copy" onclick="copyCode()"><i id="copyIcon" class="fas fa-copy"></i></button>
    </div>
  </div>
</footer>

<script>
function copyCode(){
  navigator.clipboard.writeText(document.getElementById('accessCodeDisplay').textContent).then(()=>{
    var ic=document.getElementById('copyIcon');
    ic.className='fas fa-check';ic.style.color='#10b981';
    setTimeout(()=>{ic.className='fas fa-copy';ic.style.color='';},2000);
  });
}
</script>

<script>
(function(){
'use strict';

// ══════════════════════════════════════════════════════════
// COMPONENT DEFINITIONS
// ══════════════════════════════════════════════════════════
const BATTERY_V  = 9;
const BULB_R     = 200;
const RESISTOR_R = 100;

// ══════════════════════════════════════════════════════════
// TYPES — base dimensions only; terminals are computed
// dynamically via termPos() based on rotation
// ══════════════════════════════════════════════════════════
const TYPES = {
  battery:  { name:'بطارية',  w:70,  h:100, baseTerms:[{dx:0,dy:-50},{dx:0,dy:50}]  },
  bulb:     { name:'مصباح',   w:60,  h:60,  baseTerms:[{dx:-30,dy:0},{dx:30,dy:0}]  },
  switch:   { name:'مفتاح',   w:80,  h:40,  baseTerms:[{dx:-40,dy:0},{dx:40,dy:0}]  },
  resistor: { name:'مقاومة',  w:100, h:40,  baseTerms:[{dx:-50,dy:0},{dx:50,dy:0}]  },
  junction: { name:'عقدة',    w:16,  h:16,  baseTerms:[{dx:0,dy:0}]                  },
};

// ══════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════
const canvas  = document.getElementById('circuitCanvas');
const ctx     = canvas.getContext('2d');

let components    = [];
let wires         = [];
let selectedType  = null;
let selectedComp  = -1;   // currently selected component index (for rotation/delete)
let dragging      = -1;
let dragOff       = {x:0,y:0};
let wireMode      = false;
let wireStart     = null;
let lastMouse     = {x:0,y:0};
let globalPower   = true;
let history       = [];
let histIdx       = -1;
let lastAnalysis  = null;
let openBranches  = {};
let physicalPaths = [];       // لتخزين المسارات الفعلية من السالب للموجب
let isolatedBranchId = null;  // لتحديد الفرع النشط بصرياً (null يعني الكل نشط)

// ══════════════════════════════════════════════════════════
// HISTORY
// ══════════════════════════════════════════════════════════
function saveState(){
  history = history.slice(0, histIdx+1);
  history.push(JSON.stringify({components, wires, openBranches}));
  histIdx++;
  if(history.length > 80){ history.shift(); histIdx--; }
}
function applyState(s){
  const d = JSON.parse(s);
  components  = d.components;
  wires       = d.wires;
  openBranches = d.openBranches || {};
  selectedComp = -1;
  updateRotateBtn();
  runAnalysis();
}
function undo(){ if(histIdx>0){ histIdx--; applyState(history[histIdx]); } }
function redo(){ if(histIdx<history.length-1){ histIdx++; applyState(history[histIdx]); } }

// ══════════════════════════════════════════════════════════
// ROTATION SYSTEM
// ══════════════════════════════════════════════════════════
/**
 * Rotate a point {dx,dy} by angle degrees (0/90/180/270)
 */
function rotatePoint(dx, dy, angle){
  const rad = (angle * Math.PI) / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));
  return { dx: dx*cos - dy*sin, dy: dx*sin + dy*cos };
}

/**
 * Get terminals for a component accounting for rotation
 */
function getTerminals(comp){
  const base = TYPES[comp.type].baseTerms;
  const rot  = comp.rotation || 0;
  return base.map(t => rotatePoint(t.dx, t.dy, rot));
}

function termKey(ci, ti){ return `${ci}_${ti}`; }

function termPos(comp, ti){
  const terms = getTerminals(comp);
  const t = terms[ti];
  if(!t) return {x:comp.x, y:comp.y};
  return { x: comp.x + t.dx, y: comp.y + t.dy };
}

function parseTerm(key){ const p=key.split('_'); return {ci:+p[0], ti:+p[1]}; }

/**
 * Rotate selected component by 90 degrees
 */
function rotateSelected(){
  if(selectedComp < 0 || selectedComp >= components.length) return;
  const comp = components[selectedComp];
  comp.rotation = ((comp.rotation || 0) + 90) % 360;
  // Wires stay attached — termPos() auto-updates based on new rotation
  saveState();
  runAnalysis();
}

function updateRotateBtn(){
  const btn = document.getElementById('rotateBtn');
  if(selectedComp >= 0 && components[selectedComp]){
    const t = components[selectedComp].type;
    if(t !== 'junction'){
      btn.classList.add('visible');
      const deg = components[selectedComp].rotation || 0;
      btn.innerHTML = `<i class="fas fa-rotate-right"></i> تدوير ↻ (R) — ${deg}°`;
      return;
    }
  }
  btn.classList.remove('visible');
}

// ══════════════════════════════════════════════════════════
// CANVAS HELPERS
// ══════════════════════════════════════════════════════════
function getPos(e){
  const r  = canvas.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  return { x:(cx-r.left)*(canvas.width/r.width), y:(cy-r.top)*(canvas.height/r.height) };
}
function findCompAt(pos){
  for(let i=components.length-1;i>=0;i--){
    const c=components[i], t=TYPES[c.type];
    const rot = c.rotation || 0;
    // For rotated components, check bounding circle (simpler, works for all rotations)
    const hw = Math.max(t.w/2, t.h/2, 14);
    if(Math.hypot(pos.x-c.x, pos.y-c.y) < hw + 4) return i;
  }
  return -1;
}
function deleteComp(idx){
  components.splice(idx,1);
  wires = wires
    .filter(w => {
      const {ci:ca}=parseTerm(w.a), {ci:cb}=parseTerm(w.b);
      return ca!==idx && cb!==idx;
    })
    .map(w => {
      const remapKey = k => {
        const {ci,ti}=parseTerm(k);
        return termKey(ci>idx ? ci-1 : ci, ti);
      };
      return {a:remapKey(w.a), b:remapKey(w.b)};
    });
  openBranches = {};
  if(selectedComp === idx) selectedComp = -1;
  else if(selectedComp > idx) selectedComp--;
  updateRotateBtn();
  saveState(); runAnalysis();
}

// ══════════════════════════════════════════════════════════
// PHYSICS ENGINE — Node-based MNA
// ══════════════════════════════════════════════════════════
function makeUF(n){
  const p=Array.from({length:n},(_,i)=>i);
  const find=i=>{ while(p[i]!==i){ p[i]=p[p[i]]; i=p[i]; } return i; };
  const union=(a,b)=>{ p[find(a)]=find(b); };
  return {find, union};
}

function buildNodes(openVirtualSwitches){
  const allTerms = [];
  components.forEach((c,ci)=>{
    TYPES[c.type].baseTerms.forEach((_,ti)=>{ allTerms.push(termKey(ci,ti)); });
  });
  const idx = {};
  allTerms.forEach((k,i)=>{ idx[k]=i; });
  const uf = makeUF(allTerms.length);

  wires.forEach(w=>{
    const ia=idx[w.a], ib=idx[w.b];
    if(ia!==undefined && ib!==undefined) uf.union(ia,ib);
  });

  components.forEach((c,ci)=>{
    if(TYPES[c.type].baseTerms.length < 2) return;
    const k0=termKey(ci,0), k1=termKey(ci,1);
    const i0=idx[k0], i1=idx[k1];
    if(i0===undefined || i1===undefined) return;
    if(c.type==='switch'){
      const isOpen = !c.closed || openVirtualSwitches.has(termKey(ci,'VS'));
      if(!isOpen) uf.union(i0, i1);
    }
  });

  const rootSet = new Set(allTerms.map(k=>uf.find(idx[k])));
  const rootArr = [...rootSet];
  const nodeId  = {};
  rootArr.forEach((r,i)=>{ nodeId[r]=i; });

  const nodeOf = {};
  allTerms.forEach(k=>{ nodeOf[k]=nodeId[uf.find(idx[k])]; });

  return { nodeOf, nodeCount: rootArr.length };
}

function buildBranches(nodeOf, openVirtualSwitches){
  const branches = [];
  components.forEach((c,ci)=>{
    if(TYPES[c.type].baseTerms.length < 2) return;
    const n0 = nodeOf[termKey(ci,0)];
    const n1 = nodeOf[termKey(ci,1)];
    if(n0===undefined || n1===undefined) return;
    if(n0===n1) return;
    if(c.type==='battery'){
      branches.push({type:'vsource', ci, fromNode:n1, toNode:n0, V:BATTERY_V, R:0.01});
    } else if(c.type==='bulb'){
      branches.push({type:'resistor', ci, fromNode:n0, toNode:n1, R:BULB_R, V:0});
    } else if(c.type==='resistor'){
      branches.push({type:'resistor', ci, fromNode:n0, toNode:n1, R:RESISTOR_R, V:0});
    } else if(c.type==='switch'){
      const isOpen = !c.closed || openVirtualSwitches.has(termKey(ci,'VS'));
      if(!isOpen){
        branches.push({type:'resistor', ci, fromNode:n0, toNode:n1, R:0.001, V:0});
      }
    }
  });
  return branches;
}

function solveCircuit(nodeCount, branches){
  if(nodeCount === 0 || branches.length === 0) return null;
  const vsources  = branches.filter(b=>b.type==='vsource');
  const resistors = branches.filter(b=>b.type==='resistor');
  if(vsources.length === 0) return null;

  const gnd = vsources[0].fromNode;
  const nNodes  = nodeCount;
  const nVS     = vsources.length;
  const dim     = (nNodes-1) + nVS;

  const nodeIdx = [];
  let row = 0;
  for(let n=0;n<nNodes;n++){
    nodeIdx[n] = (n===gnd) ? -1 : row++;
  }

  const mat = Array.from({length:dim},()=>new Float64Array(dim+1));

  resistors.forEach(b=>{
    const G   = 1/b.R;
    const ra  = nodeIdx[b.fromNode];
    const rb  = nodeIdx[b.toNode];
    if(ra>=0){ mat[ra][ra]+=G; if(rb>=0){ mat[ra][rb]-=G; } }
    if(rb>=0){ mat[rb][rb]+=G; if(ra>=0){ mat[rb][ra]-=G; } }
  });

  vsources.forEach((vs,vi)=>{
    const col = nNodes-1+vi;
    const ra  = nodeIdx[vs.fromNode];
    const rb  = nodeIdx[vs.toNode];
    if(ra>=0){ mat[ra][col]+=1; mat[col][ra]+=1; }
    if(rb>=0){ mat[rb][col]-=1; mat[col][rb]-=1; }
    mat[col][dim] = vs.V;
  });

  for(let c=0;c<dim;c++){
    let maxRow=c, maxVal=Math.abs(mat[c][c]);
    for(let r=c+1;r<dim;r++){
      if(Math.abs(mat[r][c])>maxVal){ maxVal=Math.abs(mat[r][c]); maxRow=r; }
    }
    if(maxVal < 1e-12) return null;
    [mat[c],mat[maxRow]]=[mat[maxRow],mat[c]];
    const pivot=mat[c][c];
    for(let r=0;r<dim;r++){
      if(r===c) continue;
      const f=mat[r][c]/pivot;
      for(let cc=c;cc<=dim;cc++) mat[r][cc]-=f*mat[c][cc];
    }
    const scale=mat[c][c];
    for(let cc=c;cc<=dim;cc++) mat[c][cc]/=scale;
  }

  const nodeVoltage = new Float64Array(nNodes);
  nodeVoltage[gnd] = 0;
  for(let n=0;n<nNodes;n++){
    const r=nodeIdx[n];
    if(r>=0) nodeVoltage[n]=mat[r][dim];
  }

  const sourceCurrent = vsources.map((_,vi)=>mat[nNodes-1+vi][dim]);

  const branchResults = {};
  resistors.forEach(b=>{
    const Va=nodeVoltage[b.fromNode], Vb=nodeVoltage[b.toNode];
    const Vdiff=Va-Vb, I=Vdiff/b.R;
    branchResults[b.ci]={V:Math.abs(Vdiff), I:Math.abs(I), current:I};
  });
  vsources.forEach((vs,vi)=>{
    branchResults[vs.ci]={V:vs.V, I:Math.abs(sourceCurrent[vi]), current:sourceCurrent[vi]};
  });

  return { nodeVoltage, sourceCurrent, branchResults, gnd, vsources, resistors };
}

function buildTopoGraph(nodeCount, branches){
  const adj = Array.from({length:nodeCount},()=>[]);
  branches.forEach((b,i)=>{
    if(b.type==='vsource') return;
    adj[b.fromNode].push({to:b.toNode, brIdx:i});
    adj[b.toNode].push({to:b.fromNode, brIdx:i});
  });
  return adj;
}

function findDistinctPaths(adj, src, dst, maxPaths=20){
  const paths = [];
  const usedEdges = new Set();
  const dfs = (node, path, visitedNodes)=>{
    if(paths.length >= maxPaths) return;
    if(node===dst){ if(path.length>0) paths.push([...path]); return; }
    for(const {to, brIdx} of adj[node]){
      if(usedEdges.has(brIdx) || visitedNodes.has(to)) continue;
      usedEdges.add(brIdx); visitedNodes.add(to); path.push(brIdx);
      dfs(to, path, visitedNodes);
      path.pop(); visitedNodes.delete(to); usedEdges.delete(brIdx);
    }
  };
  dfs(src,[],new Set([src]));
  return paths;
}


// ══════════════════════════════════════════════════════════
// MAIN ANALYSIS
// ══════════════════════════════════════════════════════════
function analyzeCore(openSwitchSet, openCI = new Set()){
  const R = {
    ok:false, current:0, voltage:0, resistance:Infinity,
    litBulbs:new Set(), topology:null, branches:[],
    statusMsg:'', statusClass:'', reason:'',
    branchDetails:[], totalPower:0,
    nodeVoltage:null, branchResults:{},
    batNegNode:-1, batPosNode:-1,
    termElectronRole:{} // new: maps termKey to 'source' or 'sink'
  };

  if(!globalPower){ R.statusMsg='🔌 التيار مقطوع.'; R.statusClass='error'; return R; }

  const batIdxs = components.reduce((a,c,i)=>{ if(c.type==='battery') a.push(i); return a; },[]);
  if(!batIdxs.length){ R.statusMsg='⚠️ لا توجد بطارية.'; return R; }

  const {nodeOf, nodeCount} = buildNodes(openSwitchSet);

  const branches = [];
  components.forEach((c,ci)=>{
    if(TYPES[c.type].baseTerms.length < 2) return;
    if(c._virtualOpen) return;
    const n0 = nodeOf[termKey(ci,0)];
    const n1 = nodeOf[termKey(ci,1)];
    if(n0===undefined || n1===undefined) return;
    if(n0===n1) return;
    if(c.type==='battery'){
      branches.push({type:'vsource', ci, fromNode:n1, toNode:n0, V:BATTERY_V, R:0.01});
    } else if(c.type==='bulb'){
      branches.push({type:'resistor', ci, fromNode:n0, toNode:n1, R:BULB_R, V:0});
    } else if(c.type==='resistor'){
      branches.push({type:'resistor', ci, fromNode:n0, toNode:n1, R:RESISTOR_R, V:0});
    } else if(c.type==='switch'){
      if(c.closed && !openSwitchSet.has(ci)){
        branches.push({type:'resistor', ci, fromNode:n0, toNode:n1, R:0.001, V:0});
      }
    }
  });

  const vsources = branches.filter(b=>b.type==='vsource');
  if(!vsources.length){ R.statusMsg='⚠️ البطارية غير موصلة.'; return R; }

  const sol = solveCircuit(nodeCount, branches);
  if(!sol){ R.statusMsg='⚠️ الدائرة مفتوحة أو غير مكتملة.'; return R; }

  const mainI = Math.abs(sol.sourceCurrent[0]);
  if(mainI < 1e-9){ R.statusMsg='⚠️ لا تيار — تحقق من المفاتيح.'; return R; }

  R.ok=true; R.current=mainI; R.voltage=BATTERY_V;
  R.resistance=mainI>1e-9?BATTERY_V/mainI:Infinity;
  R.branchResults=sol.branchResults; R.nodeVoltage=sol.nodeVoltage;
  R.totalPower=BATTERY_V*mainI;

  // Determine lit bulbs based on real current
  components.forEach((c,ci)=>{
    if(c.type!=='bulb') return;
    const br=sol.branchResults[ci];
    if(br && Math.abs(br.I)>0.005) R.litBulbs.add(ci);
  });

  const firstBat=batIdxs[0];
  const batPosNode=nodeOf[termKey(firstBat,0)];
  const batNegNode=nodeOf[termKey(firstBat,1)];
  R.batPosNode = batPosNode;
  R.batNegNode = batNegNode;

  // Compute terminal electron roles
  components.forEach((c,ci)=>{
    if(c.type==='battery'){
      // terminal 0 = positive (sink), terminal 1 = negative (source)
      R.termElectronRole[termKey(ci,0)] = 'sink';
      R.termElectronRole[termKey(ci,1)] = 'source';
    } else if(c.type==='bulb' || c.type==='resistor'){
      const br = sol.branchResults[ci];
      if(!br || Math.abs(br.I) < 1e-9) return;
      const current = br.current; // signed conventional current
      if(current > 0){
        R.termElectronRole[termKey(ci,0)] = 'sink';
        R.termElectronRole[termKey(ci,1)] = 'source';
      } else {
        R.termElectronRole[termKey(ci,0)] = 'source';
        R.termElectronRole[termKey(ci,1)] = 'sink';
      }
    } else if(c.type==='switch' && c.closed && !openSwitchSet.has(ci)){
      const br = sol.branchResults[ci];
      if(br && Math.abs(br.I) > 1e-9){
        const current = br.current;
        if(current > 0){
          R.termElectronRole[termKey(ci,0)] = 'sink';
          R.termElectronRole[termKey(ci,1)] = 'source';
        } else {
          R.termElectronRole[termKey(ci,0)] = 'source';
          R.termElectronRole[termKey(ci,1)] = 'sink';
        }
      }
    }
    // junctions have no role
  });

  const topoAdj=buildTopoGraph(nodeCount,branches);
  const paths=findDistinctPaths(topoAdj,batPosNode,batNegNode,30);

  let topology,reason;
  if(!paths.length){ R.statusMsg='⚠️ الدائرة مفتوحة.'; return R; }
  else if(paths.length===1){
    topology='series';
    reason=`مسار واحد — توالي. I = ${mainI.toFixed(3)} A ثابت.`;
  } else {
    const bSets=paths.map(p=>new Set(p));
    let shared=false;
    outer: for(let i=0;i<bSets.length;i++)
      for(let j=i+1;j<bSets.length;j++)
        for(const b of bSets[i])
          if(bSets[j].has(b)){shared=true;break outer;}
    if(!shared){
      topology='parallel';
      reason=`${paths.length} فروع مستقلة — توازي. V = ${BATTERY_V}V ثابت في كل فرع.`;
    } else {
      topology='mixed';
      reason=`دائرة مختلطة — ${paths.length} مسارات تشترك في عناصر.`;
    }
  }
  R.topology=topology; R.reason=reason;
  R._paths=paths; R._branches=branches; R._nodeOf=nodeOf;
  R._batPosNode=batPosNode; R._batNegNode=batNegNode;

  if(topology==='parallel' && paths.length>1){
    const resBranches=branches.filter(b=>b.type!=='vsource');
    R.branchDetails=paths.map((p,i)=>{
      const compIdxs=p.map(bi=>resBranches[bi]?.ci).filter(ci=>ci!==undefined&&components[ci]);
      const compNames=compIdxs.map(ci=>TYPES[components[ci].type].name).join('+');
      const firstB=resBranches[p[0]];
      const br=firstB?sol.branchResults[firstB.ci]:null;
      const I=br?Math.abs(br.I):0;
      return {idx:i, compIdxs, sig:compIdxs.slice().sort().join(','), compNames:compNames||`فرع ${i+1}`, I};
    });
  }

  const litCount=R.litBulbs.size;
  if(!litCount){ R.statusMsg=`✅ الدائرة تعمل (${topology==='series'?'🔗 توالي':'🔀 توازي'}) — لا مصباح.`; R.statusClass='info'; }
  else { R.statusMsg=`✅ ${litCount} مصباح مضيء — I = ${mainI.toFixed(3)} A`; R.statusClass='success'; }
  return R;
}

function analyzeWithOpenCI(openSwitchSet, openCI = new Set()){
  const savedVO = {};
  openCI.forEach(ci=>{ if(components[ci]){ savedVO[ci]=components[ci]._virtualOpen; components[ci]._virtualOpen=true; } });
  const R = analyzeCore(openSwitchSet, openCI);
  openCI.forEach(ci=>{ if(components[ci]) components[ci]._virtualOpen = savedVO[ci]||false; });
  return R;
}

function runAnalysis(){
  const firstPass = analyzeCore(new Set(), new Set());
  let openVirtualCI = new Set();
  if(firstPass.branchDetails && firstPass.branchDetails.length>0){
    firstPass.branchDetails.forEach((bd)=>{
      const sig = bd.compIdxs.sort().join(',');
      if(openBranches[sig]) bd.compIdxs.forEach(ci=>openVirtualCI.add(ci));
    });
  }
  lastAnalysis = analyzeWithOpenCI(new Set(), openVirtualCI);
  updateUI(lastAnalysis);
  updateBranchPanel(firstPass);
}

// ══════════════════════════════════════════════════════════
// UI UPDATE
// ══════════════════════════════════════════════════════════
function updateUI(a){
  const sb=document.getElementById('statusBar');
  sb.textContent=a.statusMsg; sb.className='status-bar '+(a.statusClass||'');
  document.getElementById('currVal').textContent=a.current>0?a.current.toFixed(3):'0.000';
  document.getElementById('voltVal').textContent=(a.ok&&a.current>0.001)?a.voltage.toFixed(2):'0.00';
  document.getElementById('resVal').textContent=a.resistance===Infinity?'∞':a.resistance.toFixed(1)+' Ω';
  document.getElementById('powerVal').textContent=a.totalPower?a.totalPower.toFixed(3):'0.000';
  const litCount=a.litBulbs?a.litBulbs.size:0;
  const bulbEl=document.getElementById('bulbState');
  bulbEl.textContent=litCount>0?`${litCount} مضيء 💡`:'مطفأة';
  bulbEl.style.color=litCount>0?'#f59e0b':'#666';
  const badges={
    series:'<span class="topology-badge badge-series">🔗 توالي</span>',
    parallel:'<span class="topology-badge badge-parallel">🔀 توازي</span>',
    mixed:'<span class="topology-badge badge-mixed">🔀🔗 مختلطة</span>',
  };
  document.getElementById('circuitType').innerHTML=a.topology?(badges[a.topology]||''):'<span class="topology-badge badge-unknown">غير محددة</span>';
  document.getElementById('topologyDisplay').innerHTML=a.topology?(badges[a.topology]||''):'';
  document.getElementById('circuitReason').textContent=a.reason||'قم ببناء دائرة لترى تحليلها.';
}

function updateBranchPanel(firstPass){
  const panel=document.getElementById('branchPanel');
  const chips=document.getElementById('branchChips');
  const br=document.getElementById('branchReadings');
  chips.innerHTML=''; br.innerHTML='';
  if(firstPass.topology==='parallel' && firstPass.branchDetails && firstPass.branchDetails.length>1){
    panel.classList.add('visible');
    firstPass.branchDetails.forEach((bd,i)=>{
      const sig=bd.sig||bd.compIdxs.slice().sort().join(',');
      const isOpen=!!openBranches[sig];
      const chip=document.createElement('button');
      chip.className='branch-chip '+(isOpen?'off':'on');
      chip.textContent=`فرع ${i+1}: ${bd.compNames} ${isOpen?'(مفتوح)':'(يعمل)'}`;
      chip.disabled = true;
      chips.appendChild(chip);
    });
    let html='<strong style="color:var(--teal-700)">تفاصيل الفروع:</strong><br>';
    firstPass.branchDetails.forEach((bd,i)=>{
      const sig=bd.sig||bd.compIdxs.slice().sort().join(',');
      const open=!!openBranches[sig];
      const I=open?0:bd.I;
      html+=`فرع ${i+1} [${bd.compNames}]: I = ${I.toFixed(3)} A ${open?'<span style="color:#dc2626">● مفتوح</span>':'<span style="color:#10b981">● يعمل</span>'}<br>`;
    });
    br.innerHTML=html;
  } else {
    panel.classList.remove('visible');
    if(firstPass.ok && firstPass.branchResults && Object.keys(firstPass.branchResults).length>0){
      let html='<strong style="color:var(--teal-700)">قراءات المكونات:</strong><br>';
      components.forEach((c,ci)=>{
        const bres=firstPass.branchResults[ci];
        if(!bres) return;
        if(c.type==='battery') html+=`بطارية: V = ${bres.V.toFixed(2)}V, I = ${bres.I.toFixed(3)}A<br>`;
        else if(c.type==='bulb') html+=`مصباح: V = ${bres.V.toFixed(2)}V, I = ${bres.I.toFixed(3)}A (${BULB_R}Ω)<br>`;
        else if(c.type==='resistor') html+=`مقاومة: V = ${bres.V.toFixed(2)}V, I = ${bres.I.toFixed(3)}A (${RESISTOR_R}Ω)<br>`;
      });
      document.getElementById('branchReadings').innerHTML=html;
    }
  }
}

// ══════════════════════════════════════════════════════════
// WIRE ACTIVITY CHECK
// ══════════════════════════════════════════════════════════
function isWireActive(w){
  if(!lastAnalysis || !lastAnalysis.branchResults) return true;
  const {ci:ca,ti:ta}=parseTerm(w.a), {ci:cb,ti:tb}=parseTerm(w.b);
  const compA=components[ca], compB=components[cb];
  if(!compA||!compB) return false;
  const isJA=compA.type==='junction', isJB=compB.type==='junction';

  if(globalPower && lastAnalysis.ok && lastAnalysis.current>0.001){
    if(compA.type==='battery'||compB.type==='battery') return true;
  }
  for(const ci of [ca,cb]){
    const comp=components[ci];
    if(comp&&comp.type==='switch'&&!comp.closed) return false;
  }
  if(isJA||isJB){
    if(isJA&&isJB) return lastAnalysis.ok&&lastAnalysis.current>0.001;
    const otherCI=isJA?cb:ca;
    const otherComp=components[otherCI];
    if(!otherComp) return false;
    if(otherComp.type==='battery') return lastAnalysis.ok&&lastAnalysis.current>0.001;
    const resOther=lastAnalysis.branchResults[otherCI];
    if(resOther&&typeof resOther.I==='number'&&Math.abs(resOther.I)>1e-6) return true;
    if(otherComp.type==='switch'&&otherComp.closed){
      if(lastAnalysis.branchDetails){
        for(const bd of lastAnalysis.branchDetails){
          const sig=bd.sig||bd.compIdxs.slice().sort().join(',');
          if(openBranches[sig]&&bd.compIdxs.includes(otherCI)) return false;
        }
      }
      return lastAnalysis.ok&&lastAnalysis.current>0.001;
    }
    return false;
  }
  const resA=lastAnalysis.branchResults[ca], resB=lastAnalysis.branchResults[cb];
  const iA=resA&&typeof resA.I==='number'?Math.abs(resA.I):0;
  const iB=resB&&typeof resB.I==='number'?Math.abs(resB.I):0;
  if(iA<1e-6&&iB<1e-6) return false;
  if(lastAnalysis.branchDetails){
    for(const bd of lastAnalysis.branchDetails){
      const sig=bd.sig||bd.compIdxs.slice().sort().join(',');
      if(openBranches[sig]&&(bd.compIdxs.includes(ca)||bd.compIdxs.includes(cb))) return false;
    }
  }
  return true;
}

// ══════════════════════════════════════════════════════════
// ELECTRON DIRECTION (physics‑correct using terminal roles)
// ══════════════════════════════════════════════════════════
function getElectronDirection(w, a){
  if(!a || !a.termElectronRole) return true; // fallback
  const {ci:ca, ti:ta}=parseTerm(w.a);
  const {ci:cb, ti:tb}=parseTerm(w.b);
  const roleA = a.termElectronRole[termKey(ca, ta)];
  const roleB = a.termElectronRole[termKey(cb, tb)];

  // If both roles are defined they must be opposite
  if(roleA && roleB){
    // electrons go from source to sink
    if(roleA === 'source' && roleB === 'sink') return true;   // A→B
    if(roleA === 'sink'   && roleB === 'source') return false; // B→A
  }
  // Only one role defined – wire connects a component to a junction
  if(roleA && !roleB){
    // electrons leave source, enter sink
    if(roleA === 'source') return true;  // leave A, go towards B (junction)
    if(roleA === 'sink')   return false; // enter A, so come from B
  }
  if(!roleA && roleB){
    if(roleB === 'source') return false; // leave B, so come from A? No: source means electrons leave B, so they go from B to A, so direction A→B is false
    if(roleB === 'sink')   return true;  // enter B, so flow A→B
  }
  // Fallback to voltage potential
  if(!a.nodeVoltage || a.batNegNode === undefined) return true;
  const nodeOf = a._nodeOf;
  if(!nodeOf) return true;
  const nodeA = nodeOf[termKey(ca, ta)];
  const nodeB = nodeOf[termKey(cb, tb)];
  if(nodeA === undefined || nodeB === undefined) return true;
  const Va = a.nodeVoltage[nodeA] || 0;
  const Vb = a.nodeVoltage[nodeB] || 0;

// A -> B if A has lower voltage than B
return Va < Vb;

}

// ══════════════════════════════════════════════════════════
// DRAWING
// ══════════════════════════════════════════════════════════
function drawGrid(){
  ctx.strokeStyle='#e2e8f0'; ctx.lineWidth=0.5;
  for(let x=0;x<canvas.width;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
  for(let y=0;y<canvas.height;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
}
function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function drawBattery(ci, comp){
  const rot = comp.rotation || 0;
  const br=lastAnalysis&&lastAnalysis.branchResults?lastAnalysis.branchResults[ci]:null;
  const w=TYPES.battery.w, h=TYPES.battery.h;

  ctx.save();
  ctx.rotate(rot * Math.PI / 180);

  ctx.fillStyle='#1e3a5f';
  roundRect(-w/2+6, -h/2+6, w-12, h-12, 8);
  ctx.fill();

  ctx.fillStyle='#f59e0b';
  ctx.fillRect(-14, -h/2+14, 28, 13);

  ctx.fillStyle='#64748b';
  ctx.fillRect(-10, h/2-27, 20, 13);

  ctx.fillStyle='#fff';
  ctx.font='bold 14px Cairo';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText('+', 0, -h/2+24);
  ctx.fillText('–', 0, h/2-18);

  ctx.font='bold 11px Cairo';
  ctx.fillStyle='#7ddcf0';
  ctx.fillText('9V', 0, 2);

  if(br){
    ctx.font='9px Cairo';
    ctx.fillStyle='#94a3b8';
    ctx.fillText(`${br.I.toFixed(2)}A`, 0, h/2-7);
  }

  ctx.restore();
}

function drawBulb(ci, comp, lit){
  const rot = comp.rotation || 0;
  const w = TYPES.bulb.w, h = TYPES.bulb.h;
  const r = h / 2;
  ctx.save();
  ctx.rotate(rot * Math.PI / 180);
  if(lit){
    const grd = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 2.5);
    grd.addColorStop(0, 'rgba(255,240,80,.5)');
    grd.addColorStop(1, 'rgba(255,240,80,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = lit ? '#fef08a' : '#dde3ed';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = lit ? '#f59e0b' : '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, 7);
  ctx.lineTo(-3, 0);
  ctx.lineTo(3, 5);
  ctx.lineTo(8, -3);
  ctx.stroke();
  const br = lastAnalysis && lastAnalysis.branchResults ? lastAnalysis.branchResults[ci] : null;
  if(br && Math.abs(br.I) > 0.001){
    ctx.font = '9px Cairo';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${br.V.toFixed(1)}V`, 0, r + 12);
  }
  ctx.restore();
}

function drawSwitch(comp){
  const rot = comp.rotation || 0;
  const w=TYPES.switch.w, h=TYPES.switch.h;
  const closed = comp.closed;

  ctx.save();
  ctx.rotate(rot * Math.PI / 180);

  ctx.strokeStyle='#334455';ctx.lineWidth=3;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-w/2,0);ctx.lineTo(-20,0);ctx.stroke();
  ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(w/2,0);ctx.stroke();
  ctx.fillStyle='#334455';
  [-20,20].forEach(px=>{ctx.beginPath();ctx.arc(px,0,5,0,Math.PI*2);ctx.fill();});
  ctx.strokeStyle='#0089ae';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(20,closed?0:-22);ctx.stroke();
  ctx.font='10px Cairo';ctx.fillStyle=closed?'#10b981':'#dc2626';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(closed?'مغلق':'مفتوح',0,closed?16:28);

  ctx.restore();
}

function drawResistor(ci, comp){
  const rot = comp.rotation || 0;
  const w=TYPES.resistor.w;
  const br=lastAnalysis&&lastAnalysis.branchResults?lastAnalysis.branchResults[ci]:null;

  ctx.save();
  ctx.rotate(rot * Math.PI / 180);

  ctx.strokeStyle='#334455';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(-w/2,0);
  const segs=6, segW=(w-36)/segs;
  ctx.lineTo(-w/2+18,0);
  for(let i=0;i<segs;i++){
    ctx.lineTo(-w/2+18+segW*(i+.5),i%2===0?-11:11);
    ctx.lineTo(-w/2+18+segW*(i+1),0);
  }
  ctx.lineTo(w/2,0);ctx.stroke();

  ctx.font='9px Cairo';ctx.fillStyle='#94a3b8';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(br&&Math.abs(br.I)>0.001?`${br.V.toFixed(1)}V`:'100Ω',0,17);

  ctx.restore();
}

function drawJunction(x,y){
  ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);
  ctx.fillStyle='#0089ae';ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
}

function drawSelectionHighlight(comp){
  const t = TYPES[comp.type];
  const r = Math.max(t.w, t.h) / 2 + 8;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI*2);
  ctx.strokeStyle='rgba(124,58,237,0.7)';
  ctx.lineWidth=2.5;
  ctx.setLineDash([5,4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function redraw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid();
  const a = lastAnalysis || {litBulbs:new Set(), branchResults:{}, batNegNode:-1, batPosNode:-1, termElectronRole:{}};
  const now = Date.now()/1000;

  // ── Draw Wires ──
  wires.forEach(w=>{
    const {ci:ca,ti:ta}=parseTerm(w.a), {ci:cb,ti:tb}=parseTerm(w.b);
    const c1=components[ca], c2=components[cb]; if(!c1||!c2) return;
    const p1=termPos(c1,ta), p2=termPos(c2,tb);
    const wireActive=isWireActive(w);
    const wireOn=a.ok&&a.current>0.005&&globalPower&&wireActive;
    ctx.strokeStyle=wireOn?'#0089ae':'#64748b';
    ctx.lineWidth=wireOn?3.5:2.5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
  });

  // ── Electron particles (correct direction: - → + externally) ──
  if(a.ok && a.current>0.005 && globalPower){
    const spd = Math.min(3, a.current/2+.4);
    ctx.fillStyle='#fbbf24';
    wires.forEach(w=>{
      if(!isWireActive(w)) return;
      const {ci:ca,ti:ta}=parseTerm(w.a), {ci:cb,ti:tb}=parseTerm(w.b);
      const c1=components[ca], c2=components[cb]; if(!c1||!c2) return;
      const p1=termPos(c1,ta), p2=termPos(c2,tb);
      const len=Math.hypot(p2.x-p1.x,p2.y-p1.y); if(len<6) return;
      const cnt=Math.max(2,Math.floor(len/38));

      const forward = getElectronDirection(w, a);

      for(let k=0;k<cnt;k++){
        let t = ((now*spd*.55 + k/cnt) % 1);
        if(!forward) t = 1 - t;

        const ex = p1.x + (p2.x-p1.x)*t;
        const ey = p1.y + (p2.y-p1.y)*t;
        ctx.shadowColor='#fbbf24'; ctx.shadowBlur=7;
        ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      }
    });
  }

  // ── Draw Components ──
  components.forEach((comp,ci)=>{
    ctx.save(); ctx.translate(comp.x, comp.y);
    const lit = a.litBulbs && a.litBulbs.has(ci) && globalPower;

    if(ci === selectedComp) drawSelectionHighlight(comp);

    switch(comp.type){
      case 'battery':  drawBattery(ci, comp); break;
      case 'bulb':     drawBulb(ci, comp, lit); break;   // FIXED: now passes comp, not raw numbers
      case 'switch':   drawSwitch(comp); break;
      case 'resistor': drawResistor(ci, comp); break;
      case 'junction': drawJunction(0, 0); break;
    }

    const terms = getTerminals(comp);
    terms.forEach((t,ti)=>{
      const pulse = wireMode && wireStart && wireStart.ci===ci && wireStart.ti===ti;
      ctx.beginPath(); ctx.arc(t.dx, t.dy, pulse?8:6, 0, Math.PI*2);
      ctx.fillStyle = pulse?'#2ec4e8':'#006b8a'; ctx.fill();
      if(pulse){ ctx.strokeStyle='rgba(0,168,212,.4)'; ctx.lineWidth=4; ctx.stroke(); }
    });

    ctx.restore();
  });

  if(wireMode && wireStart){
    const sc=components[wireStart.ci]; if(sc){
      const sp=termPos(sc,wireStart.ti);
      ctx.strokeStyle='#00a8d4'; ctx.lineWidth=2; ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(sp.x,sp.y); ctx.lineTo(lastMouse.x,lastMouse.y); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  requestAnimationFrame(redraw);
}

// ══════════════════════════════════════════════════════════
// INPUT HANDLERS
// ══════════════════════════════════════════════════════════
function handleDown(e){
  e.preventDefault();
  const pos=getPos(e);

  if(e.button===2){
    const idx=findCompAt(pos);
    if(idx>=0){ deleteComp(idx); wireMode=false; }
    return;
  }

  for(let ci=0;ci<components.length;ci++){
    const comp=components[ci];
    const terms=getTerminals(comp);
    let hit=false;
    terms.forEach((_,ti)=>{
      if(hit) return;
      const tp=termPos(comp,ti);
      if(Math.hypot(pos.x-tp.x,pos.y-tp.y)<12){
        wireMode=true; wireStart={ci,ti}; hit=true;
      }
    });
    if(wireMode) return;
  }

  const idx=findCompAt(pos);
  if(idx>=0){
    const comp=components[idx];
    if(comp.type==='switch'){
      comp.closed=!comp.closed;
      openBranches={};
      saveState(); runAnalysis(); return;
    }
    selectedComp=idx;
    updateRotateBtn();
    dragging=idx; dragOff={x:comp.x-pos.x,y:comp.y-pos.y};
    return;
  }

  selectedComp=-1;
  updateRotateBtn();

  if(selectedType){
    components.push({type:selectedType, x:pos.x, y:pos.y, closed:true, rotation:0, _virtualOpen:false});
    saveState(); runAnalysis();
  }
}

function handleMove(e){
  e.preventDefault(); lastMouse=getPos(e);
  if(dragging>=0){
    components[dragging].x=lastMouse.x+dragOff.x;
    components[dragging].y=lastMouse.y+dragOff.y;
    runAnalysis();
  }
}

function handleUp(e){
  e.preventDefault(); const pos=getPos(e);
  if(dragging>=0){ saveState(); runAnalysis(); dragging=-1; return; }
  if(wireMode && wireStart){
    for(let ci=0;ci<components.length;ci++){
      const comp=components[ci];
      const terms=getTerminals(comp);
      let done=false;
      terms.forEach((_,ti)=>{
        if(done) return;
        const tp=termPos(comp,ti);
        if(Math.hypot(pos.x-tp.x,pos.y-tp.y)<14 && !(ci===wireStart.ci&&ti===wireStart.ti)){
          const wa=termKey(wireStart.ci,wireStart.ti), wb=termKey(ci,ti);
          const dup=wires.some(w=>(w.a===wa&&w.b===wb)||(w.a===wb&&w.b===wa));
          if(!dup){ wires.push({a:wa,b:wb}); openBranches={}; saveState(); runAnalysis(); }
          done=true;
        }
      });
      if(done) break;
    }
    wireMode=false; wireStart=null;
  }
}

canvas.addEventListener('mousedown',handleDown);
canvas.addEventListener('mousemove',handleMove);
canvas.addEventListener('mouseup',handleUp);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('touchstart',handleDown,{passive:false});
canvas.addEventListener('touchmove',handleMove,{passive:false});
canvas.addEventListener('touchend',handleUp,{passive:false});

// ══════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════════════════
window.addEventListener('keydown', e => {
  const tag = document.activeElement ? document.activeElement.tagName : '';
  if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  const ctrl = e.ctrlKey || e.metaKey;

  if(ctrl && e.key === 'z' && !e.shiftKey){
    e.preventDefault();
    undo();
    return;
  }

  if(ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))){
    e.preventDefault();
    redo();
    return;
  }

  if(e.key === 'r' || e.key === 'R'){
    if(!ctrl){
      e.preventDefault();
      rotateSelected();
      return;
    }
  }

  if(e.key === 'Delete' || e.key === 'Backspace'){
    if(!ctrl){
      if(selectedComp >= 0){
        deleteComp(selectedComp);
      } else {
        const idx=findCompAt(lastMouse);
        if(idx>=0) deleteComp(idx);
      }
    }
  }
});

// ══════════════════════════════════════════════════════════
// ROTATE BUTTON
// ══════════════════════════════════════════════════════════
document.getElementById('rotateBtn').addEventListener('click', rotateSelected);

// ══════════════════════════════════════════════════════════
// PALETTE + MODE BUTTONS
// ══════════════════════════════════════════════════════════
document.getElementById('palette').addEventListener('click',e=>{
  const btn=e.target.closest('.comp-btn'); if(!btn) return;
  selectedType=btn.dataset.type;
  document.querySelectorAll('.comp-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
});

function buildSeries(){
  components = []; wires = [];  selectedComp = -1;
  updateRotateBtn();
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const xBattery  = cx - 300;
  const xSwitch   = cx - 100;
  const xResistor = cx + 100;
  const xBulb     = cx + 300;
  components.push({type:'battery',  x:xBattery,  y:cy, closed:true, rotation:0, _virtualOpen:false});
  components.push({type:'switch',   x:xSwitch,   y:cy, closed:true, rotation:0, _virtualOpen:false});
  components.push({type:'resistor', x:xResistor, y:cy, closed:true, rotation:0, _virtualOpen:false});
  components.push({type:'bulb',     x:xBulb,     y:cy, closed:true, rotation:0, _virtualOpen:false});
  wires.push({a:'1_0', b:'0_1'});
  wires.push({a:'1_1', b:'2_0'});
  wires.push({a:'2_1', b:'3_0'});
  wires.push({a:'3_1', b:'0_0'});
  saveState(); runAnalysis();
}

function buildParallel(){
  components = []; wires = []; openBranches = {}; selectedComp = -1;
  updateRotateBtn();
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const xBattery = cx - 280;
  const xJunction = cx - 140;
  const xMid = cx + 60;
  const xEnd = cx + 240;
  const yTop = cy - 120;
  const yBottom = cy + 120;
  
  components.push({type:'battery',  x:xBattery, y:cy,       closed:true, rotation:0, _virtualOpen:false}); // 0
  components.push({type:'junction', x:xJunction, y:yTop,    closed:true, rotation:0, _virtualOpen:false}); // 1
  components.push({type:'junction', x:xJunction, y:yBottom, closed:true, rotation:0, _virtualOpen:false}); // 2
  components.push({type:'switch',   x:xMid, y:yTop - 40, closed:true, rotation:0, _virtualOpen:false}); // 3
  components.push({type:'bulb',     x:xEnd, y:yTop - 40, closed:true, rotation:0, _virtualOpen:false}); // 4
  components.push({type:'switch',   x:xMid, y:yBottom + 40, closed:true, rotation:0, _virtualOpen:false}); // 5
  components.push({type:'resistor', x:xEnd - 40, y:yBottom + 40, closed:true, rotation:0, _virtualOpen:false}); // 6
  components.push({type:'bulb',     x:xEnd + 40, y:yBottom + 40, closed:true, rotation:0, _virtualOpen:false}); // 7
  
  wires.push({a:'0_0',b:'1_0'});
  wires.push({a:'0_1',b:'2_0'});
  wires.push({a:'1_0',b:'3_0'});
  wires.push({a:'3_1',b:'4_0'});
  wires.push({a:'4_1',b:'2_0'});
  wires.push({a:'1_0',b:'5_0'});
  wires.push({a:'5_1',b:'6_0'});
  wires.push({a:'6_1',b:'7_0'});
  wires.push({a:'7_1',b:'2_0'});
  
  saveState(); runAnalysis();
}
document.querySelectorAll('.mode-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const mode=btn.dataset.mode;
    if(mode==='series') buildSeries();
    else if(mode==='parallel') buildParallel();
    else { components=[]; wires=[]; openBranches={}; selectedComp=-1; updateRotateBtn(); saveState(); runAnalysis(); }
  });
});

// ══════════════════════════════════════════════════════════
// TOOLBAR
// ══════════════════════════════════════════════════════════
document.getElementById('clearBtn').addEventListener('click',()=>{
  components=[]; wires=[]; openBranches={}; selectedComp=-1; updateRotateBtn(); saveState(); runAnalysis();
});
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);
document.getElementById('powerBtn').addEventListener('click',function(){
  globalPower=!globalPower;
  this.innerHTML=globalPower?'<i class="fas fa-power-off"></i> التيار يعمل':'<i class="fas fa-power-off"></i> التيار مقطوع';
  this.classList.toggle('primary',globalPower);
  this.classList.toggle('danger',!globalPower);
  runAnalysis();
});

// ══════════════════════════════════════════════════════════
// RESIZE + INIT
// ══════════════════════════════════════════════════════════
function resize(){
  const w=canvas.clientWidth, h=canvas.clientHeight;
  if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
}
window.addEventListener('resize',resize);
resize();
saveState();
redraw();

})();
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