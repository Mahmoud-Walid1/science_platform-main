/**
 * separation.js v5 — محاكاة فصل المخاليط
 * التركيز: أشكال مواد واقعية (سائل حقيقي داخل بيكر، حبيبات رمل/حصى غير منتظمة، برادة حديد كشظايا)
 * + اسم الأداة يظهر كملصق نصي وقت الفصل + إصلاح تمرير زر التلميح + إزالة الفراغات البيضاء حول البيكر
 */
'use strict';

/* ============ إعداد المواد ============ */
const MATERIALS = {
    sand:   { core: '#c99a58', r: 3.2 },
    gravel: { core: '#7d7568', r: 8 },
    iron:   { core: '#3a3f47', r: 3.2 },
    water:  { top: '#7cc0ea', bottom: '#2f79b8' },
    oil:    { top: '#f4d375', bottom: '#e0af2c' },
    salt:   { core: '#f4f7fb', outline: '#c7d0dc', r: 3.4 }
};

const TOOLS = [
    { id: 'sieve',     name: 'غربال',      icon: 'fa-border-all' },
    { id: 'magnet',    name: 'مغناطيس',    icon: 'fa-magnet' },
    { id: 'funnel',    name: 'قمع فصل',    icon: 'fa-filter' },
    { id: 'filter',    name: 'طقم ترشيح',  icon: 'fa-tint' },
    { id: 'evaporate', name: 'طقم تبخير',  icon: 'fa-fire' }
];
function toolName(id) { return (TOOLS.find(t => t.id === id) || {}).name || id; }

/* ============ خصائص المواد — لوحة مرجعية ثابتة ============ */
const PROPERTIES = [
    { mixtureId: 'sand_gravel', name: 'حجم الحبيبات',
      desc: 'الحصى أكبر حجمًا من الرمل بوضوح، فيسمح الغربال بمرور الحبيبات الدقيقة ويحجز الكبيرة فوقه.' },
    { mixtureId: 'iron_sand', name: 'المغناطيسية',
      desc: 'برادة الحديد مادة مغناطيسية تنجذب للمغناطيس، بينما الرمل لا يتأثر به إطلاقًا.' },
    { mixtureId: 'oil_water', name: 'الكثافة',
      desc: 'كثافة الزيت أقل من كثافة الماء، فيطفو دائمًا فوقه ويمكن فصلهما بقمع الفصل.' },
    { mixtureId: 'sand_water', name: 'الذوبانية',
      desc: 'الرمل مادة غير ذائبة في الماء، فتحجزه ورقة الترشيح بينما يمر الماء عبر مساماتها.' },
    { mixtureId: 'salt_water', name: 'درجة الغليان',
      desc: 'الماء يتبخر عند التسخين لأن درجة غليانه منخفضة، بينما يبقى الملح لأن درجة غليانه أعلى بكثير.' }
];

const INGREDIENTS = {
    sand_gravel: [
        { role: 'sand',   name: 'رمل',          icon: 'fa-water',  count: 55 },
        { role: 'gravel', name: 'حصى',          icon: 'fa-circle', count: 16 }
    ],
    iron_sand: [
        { role: 'sand', name: 'رمل',           icon: 'fa-water',  count: 55 },
        { role: 'iron', name: 'برادة حديد',    icon: 'fa-magnet', count: 26 }
    ],
    oil_water: [
        { role: 'oil',   name: 'زيت', icon: 'fa-oil-can', liquidLayer: 0 },
        { role: 'water', name: 'ماء', icon: 'fa-tint',    liquidLayer: 1 }
    ],
    sand_water: [
        { role: 'water', name: 'ماء', icon: 'fa-tint',  liquidLayer: 0 },
        { role: 'sand',  name: 'رمل', icon: 'fa-water', count: 22 }
    ],
    salt_water: [
        { role: 'water', name: 'ماء', icon: 'fa-tint', liquidLayer: 0 },
        { role: 'salt',  name: 'ملح', icon: 'fa-cube', dissolve: true }
    ]
};

function liquidLayerDefsFor(m) {
    if (m.id === 'oil_water') return [
        { colorTop: MATERIALS.oil.top, colorBottom: MATERIALS.oil.bottom, alpha: 0.85, targetTopFrac: 0.10, targetBottomFrac: 0.42 },
        { colorTop: MATERIALS.water.top, colorBottom: MATERIALS.water.bottom, alpha: 0.55, targetTopFrac: 0.42, targetBottomFrac: 0.95 }
    ];
    if (m.id === 'sand_water' || m.id === 'salt_water') return [
        { colorTop: MATERIALS.water.top, colorBottom: MATERIALS.water.bottom, alpha: 0.5, targetTopFrac: 0.14, targetBottomFrac: 0.95 }
    ];
    return [];
}

const MIXTURES = [
    {
        id: 'sand_gravel', name: 'رمل وحصى', correctTool: 'sieve',
        property: 'حجم الحبيبات',
        hint: 'حبيبات هذا المخلوط مختلفة في الحجم بوضوح؛ إحداها كبيرة والأخرى دقيقة جدًا.',
        fact: 'الغربال يحتوي على فتحات بحجم ثابت، تسمح بمرور الحبيبات الأصغر منها وتحجز الحبيبات الأكبر فوقها.',
        successMsg: 'مرّ الرمل الدقيق عبر فتحات الغربال، بينما بقي الحصى الكبير فوقها.',
        wrongMsgs: { default: 'المكوّنان صلبان ولا يستجيبان لهذه الأداة.' },
        explore: {
            q: 'جرّبت الأداة ولم يحدث فصل. ما رأيك في السبب؟',
            options: [
                'لأن الرمل والحصى يختلفان في حجم الحبيبات، وليس في الخاصية التي جربتها',
                'لأن الحصى مادة مغناطيسية',
                'لأن الرمل يذوب في الماء'
            ],
            correct: 0
        }
    },
    {
        id: 'iron_sand', name: 'برادة حديد ورمل', correctTool: 'magnet',
        property: 'المغناطيسية',
        hint: 'أحد المكوّنين معدني وينجذب لخاصية فيزيائية معيّنة، والآخر لا يتأثر بها إطلاقًا.',
        fact: 'الحديد من المواد المغناطيسية التي تنجذب للمغناطيس، بينما الرمل مادة غير مغناطيسية.',
        successMsg: 'انجذبت برادة الحديد إلى المغناطيس والتصقت به تمامًا، بينما لم يتأثر الرمل إطلاقًا وبقي في مكانه.',
        wrongMsgs: { default: 'لا توجد خاصية تستجيب لهذه الأداة في هذا المخلوط.' },
        explore: {
            q: 'جرّبت الأداة ولم يحدث فصل. ما رأيك في السبب؟',
            options: [
                'لأن الفصل هنا يعتمد على حجم حبيبات المخلوط',
                'لأن الفصل هنا يعتمد على المغناطيسية، وليس على أي خاصية أخرى',
                'لأن الحديد يذوب في الماء'
            ],
            correct: 1
        }
    },
    {
        id: 'oil_water', name: 'زيت وماء', correctTool: 'funnel',
        property: 'الكثافة', liquid: true,
        hint: 'السائلان لا يمتزجان كيميائيًا، وأحدهما أخف وزنًا من الآخر عند نفس الحجم.',
        fact: 'كثافة الزيت أقل من كثافة الماء، لذلك يطفو الزيت دائمًا فوق الماء، ويستغل قمع الفصل هذا الفرق لتصريف الماء الأثقل من الأسفل أولًا.',
        successMsg: 'صُرّف الماء الأثقل من أسفل قمع الفصل، وبقي الزيت الأخف وحده في الإناء.',
        wrongMsgs: { default: 'لا يوجد جسم صلب لفصله هنا؛ السائلان يحتاجان أداة تعتمد على فرق الكثافة بينهما.' },
        explore: {
            q: 'جرّبت الأداة ولم يحدث فصل. ما رأيك في السبب؟',
            options: [
                'لأن الفصل هنا يعتمد على فرق الكثافة بين الزيت والماء',
                'لأن الزيت والماء يتفاعلان كيميائيًا',
                'لأن أحد السائلين صلب في الحقيقة'
            ],
            correct: 0
        }
    },
    {
        id: 'sand_water', name: 'رمل وماء', correctTool: 'filter',
        property: 'الذوبانية', liquid: true,
        hint: 'أحد المكوّنين لا يذوب في الماء على الإطلاق، ويمكن حجزه بحاجز دقيق الفتحات.',
        fact: 'الرمل مادة غير ذائبة، فتحجزه ورقة الترشيح فوقها بينما يمر الماء عبر مسامها الدقيقة إلى الإناء أسفلها.',
        successMsg: 'مرّ الماء عبر ورقة الترشيح إلى الدورق أسفلها، بينما احتجز الرمل غير الذائب فوق الورقة.',
        wrongMsgs: {
            magnet: 'لا توجد خاصية مغناطيسية في هذا المخلوط.',
            default: 'هذه الأداة لا تعتمد على خاصية الذوبانية اللازمة لفصل هذا المخلوط.'
        },
        explore: {
            q: 'جرّبت الأداة ولم يحدث فصل. ما رأيك في السبب؟',
            options: [
                'لأن الرمل مادة غير ذائبة يمكن حجزها بورق ترشيح دقيق المسام',
                'لأن الرمل مادة مغناطيسية',
                'لأن الماء يتبخر بسرعة كبيرة'
            ],
            correct: 0
        }
    },
    {
        id: 'salt_water', name: 'ملح وماء (محلول)', correctTool: 'evaporate',
        property: 'الذوبانية ودرجة الغليان', liquid: true, dissolved: true,
        hint: 'الملح ذائب تمامًا في الماء ولا يمكن رؤيته أو حجزه بورق الترشيح، لكنه لا يتحول إلى بخار مثل الماء.',
        fact: 'عند التسخين يتبخر الماء تدريجيًا لأن درجة غليانه منخفضة، بينما يبقى الملح لأن درجة غليانه أعلى بكثير، فيظهر على هيئة بلورات.',
        successMsg: 'تصاعد بخار الماء بالتسخين تدريجيًا، وبقي الملح غير المتطاير على هيئة بلورات ظاهرة في الإناء.',
        wrongMsgs: {
            filter: 'الملح ذائب تمامًا في الماء، لذلك يمر مع الماء عبر ورقة الترشيح ولا تحجزه.',
            default: 'هذه الأداة لا تفصل موادًا ذائبة تمامًا في بعضها.'
        },
        explore: {
            q: 'جرّبت الأداة ولم يحدث فصل. ما رأيك في السبب؟',
            options: [
                'لأن الملح ذائب تمامًا فلا يُحجز بالترشيح، ولا يتبخر مثل الماء عند التسخين',
                'لأن الملح مادة مغناطيسية',
                'لأن الماء والملح متساويان في درجة الغليان'
            ],
            correct: 0
        }
    }
];

const QUIZ = [
    { q: 'ماذا يحدث عند تسخين محلول ملحي حتى التبخّر الكامل للماء؟',
      options: ['يتبخر الماء وتبقى بلورات الملح', 'يتبخر الملح ويبقى الماء', 'يتبخر الملح والماء معًا', 'لا يحدث أي تغيير'], correct: 0 },
    { q: 'ما الخاصية الفيزيائية التي تُستغل في فصل برادة الحديد عن الرمل؟',
      options: ['الذوبانية', 'المغناطيسية', 'الكثافة', 'حجم الحبيبات'], correct: 1 },
    { q: 'لماذا يطفو الزيت فوق الماء عند استخدام قمع الفصل؟',
      options: ['لأن كثافة الزيت أقل من كثافة الماء', 'لأن الزيت أثقل من الماء', 'لأن الماء يتبخر بسرعة', 'لأنهما يتفاعلان كيميائيًا'], correct: 0 },
    { q: 'ما الأداة الأنسب لفصل مخلوط رمل وحصى؟',
      options: ['المغناطيس', 'قمع الفصل', 'الغربال', 'طقم التبخير'], correct: 2 }
];

/* ============ فئة الجسيم (للمواد الصلبة فقط: رمل، حصى، حديد، ملح) ============ */
class Particle {
    constructor(role, x, y) {
        this.role = role;
        const m = MATERIALS[role];
        this.r = (m.r || 3.4) + Math.random() * 1.2;
        this.x = x; this.y = y;
        this.bx = x; this.by = y;
        this.tx = x; this.ty = y;
        this.opacity = 1;
        this.scale = 1;
        this.state = 'idle';
        this.speed = 0.05 + Math.random() * 0.02;
        this.jitter = role === 'gravel' ? 0.12 + Math.random() * 0.1 : 0.35 + Math.random() * 0.5;
        this.phaseOff = Math.random() * Math.PI * 2;

        if (role === 'sand') {
            const points = 5 + Math.floor(Math.random() * 2);
            this.grainPoints = [];
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                this.grainPoints.push({ angle, radius: this.r * (0.7 + Math.random() * 0.5) });
            }
            this.grainRotation = Math.random() * Math.PI * 2;
            this.grainShade = 0.85 + Math.random() * 0.3;
        }

        if (role === 'gravel') {
            const points = 7 + Math.floor(Math.random() * 3);
            this.rockPoints = [];
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                this.rockPoints.push({ angle, radius: this.r * (0.75 + Math.random() * 0.55) });
            }
            this.rockRotation = Math.random() * Math.PI * 2;
            this.rockShade = 0.85 + Math.random() * 0.3;
        }

        if (role === 'iron') {
            const len = this.r * (1.8 + Math.random() * 1.4);
            const width = this.r * (0.45 + Math.random() * 0.25);
            const bend = (Math.random() - 0.5) * width * 1.4;
            this.shardPoints = [
                { x: -len / 2, y: 0 },
                { x: -len / 6, y: -width / 2 + bend },
                { x: len / 2, y: 0 },
                { x: -len / 6, y: width / 2 + bend }
            ];
            this.shardRotation = Math.random() * Math.PI * 2;
        }
    }

    update(tick) {
        if (this.state === 'idle' || this.state === 'settled') {
            const amp = this.state === 'idle' ? this.jitter * 2.2 : this.jitter * 0.6;
            this.x = this.bx + Math.sin(tick * 0.05 + this.phaseOff) * amp;
            this.y = this.by + Math.cos(tick * 0.045 + this.phaseOff * 1.3) * amp;
        } else if (this.state === 'moving') {
            this.x += (this.tx - this.x) * this.speed;
            this.y += (this.ty - this.y) * this.speed;
            if (Math.abs(this.x - this.tx) < 1 && Math.abs(this.y - this.ty) < 1) {
                this.bx = this.tx; this.by = this.ty;
                this.state = 'settled';
            }
        } else if (this.state === 'rising') {
            this.y -= 0.55;
            this.x += Math.sin(tick * 0.08 + this.phaseOff) * 0.3;
            this.opacity -= 0.012;
            if (this.opacity <= 0) this.opacity = 0;
        } else if (this.state === 'fading') {
            this.y += 0.9;
            this.opacity -= 0.03;
            if (this.opacity <= 0) this.opacity = 0;
        } else if (this.state === 'growing') {
            if (this.scale < 1) this.scale += 0.05;
            this.x = this.bx + Math.sin(tick * 0.03 + this.phaseOff) * 0.4;
        }
    }

    draw(ctx) {
        if (this.opacity <= 0) return;
        const m = MATERIALS[this.role];
        ctx.save();
        ctx.globalAlpha = this.opacity;

        if (this.role === 'salt') {
            const s = this.r * 1.6 * this.scale;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.phaseOff);
            ctx.fillStyle = m.core;
            ctx.strokeStyle = m.outline;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.fillRect(-s / 2, -s / 2, s, s);
            ctx.strokeRect(-s / 2, -s / 2, s, s);
            ctx.restore();
            return;
        }

        if (this.role === 'sand') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.grainRotation);
            ctx.beginPath();
            this.grainPoints.forEach((p, i) => {
                const px = Math.cos(p.angle) * p.radius, py = Math.sin(p.angle) * p.radius;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.closePath();
            const sg = ctx.createLinearGradient(-this.r, -this.r, this.r, this.r);
            sg.addColorStop(0, '#e3c08a');
            sg.addColorStop(0.5, m.core);
            sg.addColorStop(1, '#a9814c');
            ctx.fillStyle = sg;
            ctx.globalAlpha = this.opacity * this.grainShade;
            ctx.shadowBlur = 2;
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.fill();
            ctx.restore();
            return;
        }

        if (this.role === 'gravel') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rockRotation);
            ctx.beginPath();
            this.rockPoints.forEach((p, i) => {
                const px = Math.cos(p.angle) * p.radius, py = Math.sin(p.angle) * p.radius;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.closePath();
            const rg = ctx.createLinearGradient(-this.r, -this.r, this.r, this.r);
            rg.addColorStop(0, '#9c9384');
            rg.addColorStop(0.5, m.core);
            rg.addColorStop(1, '#5c5548');
            ctx.fillStyle = rg;
            ctx.globalAlpha = this.opacity * this.rockShade;
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0,0,0,0.25)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.6;
            ctx.stroke();
            ctx.restore();
            return;
        }

        if (this.role === 'iron') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.shardRotation);
            ctx.beginPath();
            this.shardPoints.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
            ctx.closePath();
            const ig = ctx.createLinearGradient(this.shardPoints[0].x, 0, this.shardPoints[2].x, 0);
            ig.addColorStop(0, '#1c1f24');
            ig.addColorStop(0.5, '#5a616c');
            ig.addColorStop(1, '#1c1f24');
            ctx.fillStyle = ig;
            ctx.shadowBlur = 3;
            ctx.shadowColor = 'rgba(0,0,0,0.35)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(this.shardPoints[0].x, 0);
            ctx.lineTo(this.shardPoints[2].x, 0);
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.restore();
    }
}

/* ============ محرك المشهد ============ */
class Scene {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.tick = 0;
        this.raf = null;
        this.background = null;
        this.overlay = null;
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.w = rect.width;
        this.h = this.canvas.clientHeight;
    }

    clear(particles) {
        this.particles = particles || [];
        this.overlay = null;
    }

    start() {
        if (this.raf) return;
        const loop = () => {
            this.tick++;
            this.ctx.clearRect(0, 0, this.w, this.h);
            if (this.background) this.background(this.ctx, this.w, this.h, this.tick);
            this.particles.forEach(p => p.update(this.tick));
            this.particles.forEach(p => p.draw(this.ctx));
            if (this.overlay) this.overlay(this.ctx, this.w, this.h, this.tick);
            this.raf = requestAnimationFrame(loop);
        };
        this.raf = requestAnimationFrame(loop);
    }

    stop() {
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = null;
    }
}

/* ============ التطبيق ============ */
document.addEventListener('DOMContentLoaded', function () {

    const canvas = document.getElementById('labCanvas');
    const scene = new Scene(canvas);
    scene.start();

    let currentIndex = 0;
    const solved = new Set();
    const exploreShown = new Set();
    const attemptsLog = [];
    let isFlying = false;
    let liquidState = { layers: [] };

    const mixtureTabsEl = document.getElementById('mixtureTabs');
    const workspaceTitle = document.getElementById('workspaceTitle');
    const toolGrid = document.getElementById('toolGrid');
    const feedbackText = document.getElementById('feedbackText');
    const exploreBox = document.getElementById('exploreBox');
    const canvasWrapper = document.getElementById('canvasWrapper');
    const btnHint = document.getElementById('btnHint');
    const infoTabs = document.querySelectorAll('.info-tab');
    const infoPanels = document.querySelectorAll('.info-panel');
    const hintPanelText = document.getElementById('hintPanelText');
    const factPanelText = document.getElementById('factPanelText');
    const propertyChip = document.getElementById('propertyChip');
    const progressList = document.getElementById('progressList');
    const propertiesListEl = document.getElementById('propertiesList');
    const attemptsLogEl = document.getElementById('attemptsLog');
    const btnContinue = document.getElementById('btnContinue');
    const introBanner = document.getElementById('introBanner');
    const introBannerClose = document.getElementById('introBannerClose');
    const resultToast = document.getElementById('resultToast');
    const toolsCardTitle = document.getElementById('toolsCardTitle');
    let buildActive = false;
    let buildQueue = [];

    document.querySelectorAll('.concept-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = document.getElementById(btn.dataset.concept);
            const isOpen = btn.classList.toggle('open');
            panel.classList.toggle('open', isOpen);
        });
    });
    const conceptPropertiesTable = document.getElementById('conceptPropertiesTable');
    if (conceptPropertiesTable) {
        PROPERTIES.forEach(p => {
            const row = document.createElement('div');
            row.className = 'concept-property-row';
            row.innerHTML = `<span class="cp-name">${p.name}</span><span class="cp-desc">${p.desc}</span>`;
            conceptPropertiesTable.appendChild(row);
        });
    }

    if (introBannerClose) {
        introBannerClose.addEventListener('click', () => introBanner.classList.add('closed'));
    }

    function getBeakerBounds() {
        const w = scene.w, h = scene.h;
        const bw = Math.min(320, w * 0.56);
        const bh = h * 0.72;
        const bx = w / 2 - bw / 2;
        const by = h - bh - 30;
        return { x: bx, y: by, width: bw, height: bh };
    }

    function beakerInteriorPath(ctx, b) {
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - 4);
        ctx.lineTo(b.x, b.y + b.height - 18);
        ctx.quadraticCurveTo(b.x, b.y + b.height, b.x + 18, b.y + b.height);
        ctx.lineTo(b.x + b.width - 18, b.y + b.height);
        ctx.quadraticCurveTo(b.x + b.width, b.y + b.height, b.x + b.width, b.y + b.height - 18);
        ctx.lineTo(b.x + b.width, b.y - 4);
        ctx.closePath();
    }

    function drawBench(ctx, w, h) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#eef3f8');
        g.addColorStop(1, '#dfe7f0');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.strokeStyle = 'rgba(148,163,184,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h - 20);
        ctx.lineTo(w, h - 20);
        ctx.stroke();
        ctx.restore();
    }

   function drawBeaker(ctx, b) {
        ctx.save();
        // ظل أعمق وأوسع تحت البيكر
        ctx.beginPath();
        ctx.ellipse(b.x + b.width / 2, b.y + b.height + 8, b.width * 0.48, 9, 0, 0, Math.PI * 2);
        const shadowG = ctx.createRadialGradient(
            b.x + b.width / 2, b.y + b.height + 8, 0,
            b.x + b.width / 2, b.y + b.height + 8, b.width * 0.48
        );
        shadowG.addColorStop(0, 'rgba(30,41,59,0.18)');
        shadowG.addColorStop(1, 'rgba(30,41,59,0)');
        ctx.fillStyle = shadowG;
        ctx.fill();

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(b.x - 8, b.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(b.x, b.y + b.height - 18);
        ctx.quadraticCurveTo(b.x, b.y + b.height, b.x + 18, b.y + b.height);
        ctx.lineTo(b.x + b.width - 18, b.y + b.height);
        ctx.quadraticCurveTo(b.x + b.width, b.y + b.height, b.x + b.width, b.y + b.height - 18);
        ctx.lineTo(b.x + b.width, b.y);
        ctx.lineTo(b.x + b.width + 8, b.y);
        ctx.stroke();

        // خط لمعان خفيف على حافة البيكر الشمال يوحي بانعكاس ضوء (إحساس زجاج حقيقي)
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x + 8, b.y + 10);
        ctx.lineTo(b.x + 8, b.y + b.height - 24);
        ctx.stroke();
        ctx.restore();
    }

    function makeLiquidState(layers) {
        return { layers: layers.map(l => ({
            colorTop: l.colorTop, colorBottom: l.colorBottom, alpha: l.alpha,
            topFrac: l.startTop ?? l.targetTopFrac, bottomFrac: l.startBottom ?? l.targetBottomFrac,
            targetTopFrac: l.targetTopFrac, targetBottomFrac: l.targetBottomFrac,
            waveAmp: l.waveAmp ?? 2.5, phase: Math.random() * 10
        })) };
    }

    function drawLiquids(ctx, b, tick) {
        if (!liquidState.layers.length) return;
        ctx.save();
        beakerInteriorPath(ctx, b);
        ctx.clip();
       liquidState.layers.forEach(layer => {
            if (!layer) return;
            layer.topFrac += (layer.targetTopFrac - layer.topFrac) * 0.035;
            layer.bottomFrac += (layer.targetBottomFrac - layer.bottomFrac) * 0.035;
            const topY = b.y + b.height * layer.topFrac;
            const botY = b.y + b.height * layer.bottomFrac;
            if (botY <= topY + 1) return;
            const left = b.x + 1, right = b.x + b.width - 1;
            const segs = 22;
            ctx.beginPath();
            for (let i = 0; i <= segs; i++) {
                const x = left + (right - left) * (i / segs);
                const wave = Math.sin(tick * 0.035 + i * 0.7 + layer.phase) * layer.waveAmp;
                const y = topY + wave;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.lineTo(right, botY);
            ctx.lineTo(left, botY);
            ctx.closePath();
            const g = ctx.createLinearGradient(0, topY, 0, botY);
            g.addColorStop(0, layer.colorTop);
            g.addColorStop(1, layer.colorBottom);
            ctx.fillStyle = g;
            ctx.globalAlpha = layer.alpha;
            ctx.fill();
        });
        ctx.restore();
    }

    scene.background = (ctx, w, h, tick) => {
        drawBench(ctx, w, h);
        const b = getBeakerBounds();
        drawLiquids(ctx, b, tick);
        drawBeaker(ctx, b);
    };

    function drawToolLabel(ctx, text, x, y) {
        ctx.save();
        ctx.font = '700 12px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const w = ctx.measureText(text).width + 22;
        const h = 24;
        ctx.fillStyle = 'rgba(0,78,102,0.92)';
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 20); ctx.fill(); }
        else { ctx.fillRect(x - w / 2, y - h / 2, w, h); }
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x, y + 1);
        ctx.restore();
    }

    /* ============ مرحلة الصب اليدوي (رمل وماء / زيت وماء / ملح وماء) ============ */
    let pourGate = null;
    let magnetGate = null;
    let lastMagnetPos = null;

    function getPointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        const t = e.touches && e.touches[0];
        const clientX = t ? t.clientX : e.clientX;
        const clientY = t ? t.clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function pourLiquidColor(m) {
        return m.id === 'oil_water' ? MATERIALS.oil.top : MATERIALS.water.top;
    }

    function drawSeparatingFunnelVessel(ctx, x, y, w, h, fillFrac, color) {
        const cx = x + w / 2, top = y + 6, bottom = y + h * 0.55, r = w / 2 - 4;
        ctx.save();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, bottom); ctx.lineTo(cx, y + h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 16, y + h); ctx.lineTo(cx + 16, y + h); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - r, top);
        ctx.quadraticCurveTo(cx - r, bottom, cx, bottom + 8);
        ctx.quadraticCurveTo(cx + r, bottom, cx + r, top);
        ctx.lineTo(cx - r, top);
        ctx.stroke();
        if (fillFrac > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx - r, top);
            ctx.quadraticCurveTo(cx - r, bottom, cx, bottom + 8);
            ctx.quadraticCurveTo(cx + r, bottom, cx + r, top);
            ctx.closePath(); ctx.clip();
            const fillTop = bottom - (bottom - top) * fillFrac;
            ctx.fillStyle = color; ctx.globalAlpha = 0.7;
            ctx.fillRect(cx - r, fillTop, r * 2, bottom - fillTop + 10);
            ctx.restore();
        }
        ctx.restore();
    }

    function drawFilterVessel(ctx, x, y, w, h, fillFrac, color) {
        const cx = x + w / 2, topY = y, bottomY = y + h * 0.42, half = w / 2 - 4;
        ctx.save();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - half, topY); ctx.lineTo(cx, bottomY); ctx.lineTo(cx + half, topY);
        ctx.stroke();
        ctx.strokeStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(cx - half * 0.7, topY + 4); ctx.lineTo(cx, bottomY - 2); ctx.lineTo(cx + half * 0.7, topY + 4);
        ctx.stroke();
        ctx.strokeStyle = '#94a3b8';
        ctx.beginPath(); ctx.moveTo(cx, bottomY); ctx.lineTo(cx, bottomY + 14); ctx.stroke();
        const flaskTop = bottomY + 16, flaskBottom = y + h;
        ctx.beginPath();
        ctx.moveTo(cx - 10, flaskTop);
        ctx.lineTo(cx - w / 2 + 6, flaskBottom - 10);
        ctx.quadraticCurveTo(cx - w / 2 + 6, flaskBottom, cx - w / 2 + 16, flaskBottom);
        ctx.lineTo(cx + w / 2 - 16, flaskBottom);
        ctx.quadraticCurveTo(cx + w / 2 - 6, flaskBottom, cx + w / 2 - 6, flaskBottom - 10);
        ctx.lineTo(cx + 10, flaskTop);
        ctx.stroke();
        if (fillFrac > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx - 10, flaskTop);
            ctx.lineTo(cx - w / 2 + 6, flaskBottom - 10);
            ctx.quadraticCurveTo(cx - w / 2 + 6, flaskBottom, cx - w / 2 + 16, flaskBottom);
            ctx.lineTo(cx + w / 2 - 16, flaskBottom);
            ctx.quadraticCurveTo(cx + w / 2 - 6, flaskBottom, cx + w / 2 - 6, flaskBottom - 10);
            ctx.lineTo(cx + 10, flaskTop);
            ctx.closePath(); ctx.clip();
            const fh = (flaskBottom - flaskTop) * fillFrac;
            ctx.fillStyle = color; ctx.globalAlpha = 0.6;
            ctx.fillRect(cx - w / 2, flaskBottom - fh, w, fh);
            ctx.restore();
        }
        ctx.restore();
    }

    function drawEvapDishVessel(ctx, x, y, w, h, fillFrac, color) {
        const cx = x + w / 2, cy = y + h * 0.55;
        ctx.save();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cx, cy, w / 2 - 4, h * 0.4, 0, 0, Math.PI, false); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx, y + h * 0.15, w / 2 - 4, h * 0.18, 0, 0, Math.PI * 2); ctx.stroke();
        if (fillFrac > 0) {
            ctx.save();
            const k = Math.min(fillFrac * 1.2, 1);
            ctx.beginPath();
            ctx.ellipse(cx, y + h * 0.15, (w / 2 - 6) * k, h * 0.16 * k, 0, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.globalAlpha = 0.7; ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

   function drawMiniBeaker(ctx, cx, cy, fillFrac, color, tiltAngle) {
        tiltAngle = tiltAngle || 0;
        const w = 50, h = 60;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tiltAngle);
        ctx.translate(-w / 2, -h / 2);

        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
        const path = () => {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, h - 10);
            ctx.quadraticCurveTo(0, h, 10, h);
            ctx.lineTo(w - 10, h);
            ctx.quadraticCurveTo(w, h, w, h - 10);
            ctx.lineTo(w, 0);
        };
        path(); ctx.stroke();
        if (fillFrac > 0) {
            ctx.save();
            path(); ctx.lineTo(0, 0); ctx.closePath(); ctx.clip();
            const fh = h * fillFrac;
            ctx.fillStyle = color; ctx.globalAlpha = 0.75;
            ctx.fillRect(0, h - fh, w, fh);
            ctx.restore();
        }
        ctx.restore();
    }

    function drawMagnetIcon(ctx, x, y, tick) {
        ctx.save();
        const pulse = 1 + Math.sin(tick * 0.12) * 0.08;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 42 * pulse);
        g.addColorStop(0, 'rgba(0,78,102,0.35)');
        g.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(x, y, 42 * pulse, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();

        const w = 48, h = 30;
        ctx.translate(x - w / 2, y - h / 2);
        ctx.fillStyle = '#004e66';
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0, 0, w, h, 8); ctx.fill(); }
        else ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#ef4444';
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0, 0, w * 0.32, h, [8, 0, 0, 8]); ctx.fill(); }
        ctx.fillStyle = '#fff';
        ctx.font = '700 11px Cairo, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('N', w * 0.16, h / 2);
        ctx.fillText('S', w * 0.84, h / 2);
        ctx.restore();
    }

    function startMagnetGate(m, onComplete) {
        const b = getBeakerBounds();
        const totalIron = scene.particles.filter(p => p.role === 'iron').length;
        magnetGate = {
            x: b.x + b.width / 2, y: Math.max(40, b.y - 50),
            dragging: false, offsetX: 0, offsetY: 0,
            totalIron, completing: false, onComplete
        };
        scene.overlay = drawMagnetGate;
    }

    function drawMagnetGate(ctx, w, h, tick) {
        if (!magnetGate) return;
        const g = magnetGate;
        const captureRadius = 70;

        scene.particles.forEach(p => {
            if (p.role !== 'iron') return;
            if (!p.attracted) {
                const dist = Math.hypot(g.x - p.x, g.y - p.y);
                if (dist < captureRadius) {
                    p.attracted = true;
                    p.magnetOffsetX = (Math.random() - 0.5) * 22;
                    p.magnetOffsetY = (Math.random() - 0.5) * 18;
                    p.speed = 0.14;
                }
            }
            if (p.attracted) {
                p.state = 'moving';
                p.tx = g.x + p.magnetOffsetX;
                p.ty = g.y + p.magnetOffsetY;
            }
        });

        drawMagnetIcon(ctx, g.x, g.y, tick);
        if (!g.completing) drawToolLabel(ctx, 'اسحب المغناطيس نحو برادة الحديد', g.x, g.y - 46);

        const attractedCount = scene.particles.filter(p => p.role === 'iron' && p.attracted).length;
        if (attractedCount >= g.totalIron && g.totalIron > 0 && !g.completing) {
            g.completing = true;
            setTimeout(() => {
                if (!magnetGate) return;
                lastMagnetPos = { x: magnetGate.x, y: magnetGate.y };
                const cb = magnetGate.onComplete;
                scene.overlay = null;
                magnetGate = null;
                cb();
            }, 700);
        }
    }

    function vesselDrawInfo(toolId) {
        if (toolId === 'funnel') return { w: 74, h: 92, draw: drawSeparatingFunnelVessel, label: 'قمع الفصل' };
        if (toolId === 'filter') return { w: 78, h: 100, draw: drawFilterVessel, label: 'القمع وورقة الترشيح' };
        if (toolId === 'evaporate') return { w: 90, h: 46, draw: drawEvapDishVessel, label: 'طبق التبخير' };
        return null;
    }

    function startPourGate(m, toolId, onComplete) {
        const vessel = vesselDrawInfo(toolId);
        if (!vessel) { onComplete(); return; }
        const b = getBeakerBounds();
        const vesselX = Math.min(b.x + b.width + 60, scene.w - vessel.w - 16);
        const vesselY = b.y + b.height - vessel.h;
        const startX = b.x + b.width / 2, startY = b.y + b.height / 2;

        pourGate = {
            m, toolId, vessel, vesselX, vesselY,
            beakerX: startX, beakerY: startY, homeX: startX, homeY: startY,
            dragging: false, snapping: false, offsetX: 0, offsetY: 0,
            pouring: false, beakerFill: 1, vesselFill: 0, startTick: 0,
            onComplete
        };
        scene.overlay = drawPourGate;
    }

   function drawPourGate(ctx, w, h, tick) {
        if (!pourGate) return;
        const g = pourGate;
        const color = pourLiquidColor(g.m);
        let tiltAngle = 0;

        if (g.snapping) {
            g.beakerX += (g.homeX - g.beakerX) * 0.22;
            g.beakerY += (g.homeY - g.beakerY) * 0.22;
            if (Math.abs(g.beakerX - g.homeX) < 1 && Math.abs(g.beakerY - g.homeY) < 1) g.snapping = false;
        }

        if (g.pouring) {
            const progress = Math.min((tick - g.startTick) / 150, 1);
            g.beakerFill = 1 - progress;
            g.vesselFill = progress;

            const tiltIn = Math.min(progress / 0.2, 1);
            const tiltOut = progress > 0.8 ? Math.min((progress - 0.8) / 0.2, 1) : 0;
            tiltAngle = 0.85 * tiltIn * (1 - tiltOut);

            if (progress >= 1) {
                const cb = g.onComplete;
                scene.overlay = null;
                pourGate = null;
                cb();
                return;
            }

            if (progress > 0.15 && progress < 0.85) {
                const spoutX = g.beakerX + 26 * Math.cos(tiltAngle) + 6;
                const spoutY = g.beakerY - 12 + 26 * Math.sin(tiltAngle);
                const targetX = g.vesselX + g.vessel.w / 2, targetY = g.vesselY + 8;
                ctx.save();
                ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.moveTo(spoutX, spoutY);
                ctx.lineTo(targetX, targetY);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(targetX, targetY, 4 + Math.sin(tick * 0.6) * 2, 0, Math.PI * 2);
                ctx.fillStyle = color; ctx.globalAlpha = 0.5; ctx.fill();
                ctx.restore();
            }
        }

        g.vessel.draw(ctx, g.vesselX, g.vesselY, g.vessel.w, g.vessel.h, g.vesselFill, color);
        drawMiniBeaker(ctx, g.beakerX, g.beakerY, g.beakerFill, color, tiltAngle);
        if (!g.pouring) drawToolLabel(ctx, 'اسحب الكأس إلى ' + g.vessel.label, g.homeX, g.homeY - 60);
    }

    function onCanvasPointerDown(e) {
        const p = getPointerPos(e);
        if (pourGate && !pourGate.pouring) {
            const dx = p.x - pourGate.beakerX, dy = p.y - pourGate.beakerY;
            if (Math.hypot(dx, dy) < 36) {
                pourGate.dragging = true; pourGate.snapping = false;
                pourGate.offsetX = dx; pourGate.offsetY = dy;
                return;
            }
        }
        if (magnetGate && !magnetGate.completing) {
            const dx = p.x - magnetGate.x, dy = p.y - magnetGate.y;
            if (Math.hypot(dx, dy) < 40) {
                magnetGate.dragging = true;
                magnetGate.offsetX = dx; magnetGate.offsetY = dy;
            }
        }
    }
    function onCanvasPointerMove(e) {
        const p = getPointerPos(e);
        if (pourGate && pourGate.dragging) {
            pourGate.beakerX = p.x - pourGate.offsetX;
            pourGate.beakerY = p.y - pourGate.offsetY;
            return;
        }
        if (magnetGate && magnetGate.dragging) {
            magnetGate.x = p.x - magnetGate.offsetX;
            magnetGate.y = p.y - magnetGate.offsetY;
        }
    }
    function onCanvasPointerUp() {
        if (pourGate && pourGate.dragging) {
            pourGate.dragging = false;
            const g = pourGate;
            const targetX = g.vesselX + g.vessel.w / 2, targetY = g.vesselY + g.vessel.h * 0.25;
            if (Math.hypot(g.beakerX - targetX, g.beakerY - targetY) < 55) {
                g.beakerX = targetX - 24; g.beakerY = g.vesselY - 10;
                g.pouring = true; g.startTick = scene.tick;
            } else {
                g.snapping = true;
            }
        }
        if (magnetGate && magnetGate.dragging) {
            magnetGate.dragging = false;
        }
    
    }
    canvas.addEventListener('mousedown', onCanvasPointerDown);
    canvas.addEventListener('mousemove', onCanvasPointerMove);
    window.addEventListener('mouseup', onCanvasPointerUp);
    canvas.addEventListener('touchstart', onCanvasPointerDown, { passive: true });
    canvas.addEventListener('touchmove', onCanvasPointerMove, { passive: true });
    window.addEventListener('touchend', onCanvasPointerUp);

    function renderMixtureTabs() {
        mixtureTabsEl.innerHTML = '';
        MIXTURES.forEach((m, i) => {
            const btn = document.createElement('button');
            btn.className = 'mixture-tab' + (i === currentIndex ? ' active' : '') + (solved.has(m.id) ? ' solved' : '');
            btn.innerHTML = `<span class="mixture-num">${solved.has(m.id) ? '<i class="fas fa-check"></i>' : (i + 1)}</span> ${m.name}`;
            btn.addEventListener('click', () => loadMixture(i));
            mixtureTabsEl.appendChild(btn);
        });
    }

    function renderProgress() {
        progressList.innerHTML = '';
        MIXTURES.forEach(m => {
            const row = document.createElement('div');
            row.className = 'progress-row' + (solved.has(m.id) ? ' done' : '');
            row.innerHTML = `<span class="progress-icon">${solved.has(m.id) ? '<i class="fas fa-check"></i>' : ''}</span> ${m.name}`;
            progressList.appendChild(row);
        });
    }

    function renderProperties() {
        propertiesListEl.innerHTML = '';
        PROPERTIES.forEach(p => {
            const done = solved.has(p.mixtureId);
            const row = document.createElement('div');
            row.className = 'property-row' + (done ? ' done' : '');
            row.innerHTML = `
                <span class="property-icon">${done ? '<i class="fas fa-check"></i>' : '<i class="fas fa-hourglass-half"></i>'}</span>
                <span class="property-body">
                    <span class="property-name">${p.name}</span>
                    <span class="property-desc">${p.desc}</span>
                </span>`;
            propertiesListEl.appendChild(row);
        });
    }

    function logAttempt(m, toolId, isCorrect) {
        const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        attemptsLog.unshift({ mixture: m.name, tool: toolName(toolId), correct: isCorrect, time });
        if (attemptsLog.length > 25) attemptsLog.pop();
        renderAttemptsLog();
    }

    function renderAttemptsLog() {
        attemptsLogEl.innerHTML = '';
        if (attemptsLog.length === 0) {
            attemptsLogEl.innerHTML = '<div class="attempts-empty">لا توجد محاولات بعد، جرّب استخدام إحدى الأدوات على المخلوط الحالي.</div>';
            return;
        }
        attemptsLog.forEach(a => {
            const row = document.createElement('div');
            row.className = 'attempt-row ' + (a.correct ? 'ok' : 'bad');
            row.innerHTML = `
                <span class="attempt-icon"><i class="fas ${a.correct ? 'fa-check' : 'fa-xmark'}"></i></span>
                <span class="attempt-body">
                    <span class="attempt-main">${a.tool} ← ${a.mixture}</span>
                    <span class="attempt-time">${a.time}</span>
                </span>`;
            attemptsLogEl.appendChild(row);
        });
    }

    function renderTools() {
        toolGrid.innerHTML = '';
        TOOLS.forEach(t => {
            const el = document.createElement('div');
            el.className = 'tool-btn';
            el.draggable = true;
            el.dataset.toolId = t.id;
            el.innerHTML = `<i class="fas ${t.icon}"></i><span>${t.name}</span>`;
            el.addEventListener('click', () => attemptTool(t.id, el));
            el.addEventListener('dragstart', e => { el.classList.add('dragging'); e.dataTransfer.setData('text/plain', t.id); });
            el.addEventListener('dragend', () => el.classList.remove('dragging'));
            toolGrid.appendChild(el);
        });
    }

    canvas.addEventListener('dragover', e => e.preventDefault());
    canvas.addEventListener('drop', e => {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        if (data.startsWith('ingredient:')) {
            const role = data.replace('ingredient:', '');
            const m = MIXTURES[currentIndex];
            const ing = (INGREDIENTS[m.id] || []).find(i => i.role === role);
            const el = toolGrid.querySelector(`[data-ingredient-role="${role}"]`);
            if (ing && el) placeIngredient(ing, el, m);
        } else {
            const toolEl = toolGrid.querySelector(`[data-tool-id="${data}"]`);
            attemptTool(data, toolEl);
        }
    });

    function buildScene(m) {
        const b = getBeakerBounds();
        const pad = 22;
        const x0 = b.x + pad, x1 = b.x + b.width - pad;
        const rand = (a, c) => a + Math.random() * (c - a);
        const particles = [];

        if (m.id === 'sand_gravel') {
            liquidState = { layers: [] };
            const yTop = b.y + pad, yBottom = b.y + b.height - pad;
            for (let i = 0; i < 55; i++) particles.push(new Particle('sand', rand(x0, x1), rand(yTop, yBottom)));
            for (let i = 0; i < 16; i++) particles.push(new Particle('gravel', rand(x0, x1), rand(yTop, yBottom)));
        } else if (m.id === 'iron_sand') {
            liquidState = { layers: [] };
            const yTop = b.y + pad, yBottom = b.y + b.height - pad;
            for (let i = 0; i < 55; i++) particles.push(new Particle('sand', rand(x0, x1), rand(yTop, yBottom)));
            for (let i = 0; i < 26; i++) particles.push(new Particle('iron', rand(x0, x1), rand(yTop, yBottom)));
        } else if (m.id === 'oil_water') {
            liquidState = makeLiquidState([
                { colorTop: MATERIALS.oil.top, colorBottom: MATERIALS.oil.bottom, alpha: 0.85, targetTopFrac: 0.10, targetBottomFrac: 0.42 },
                { colorTop: MATERIALS.water.top, colorBottom: MATERIALS.water.bottom, alpha: 0.55, targetTopFrac: 0.42, targetBottomFrac: 0.95 }
            ]);
        } else if (m.id === 'sand_water') {
            liquidState = makeLiquidState([
                { colorTop: MATERIALS.water.top, colorBottom: MATERIALS.water.bottom, alpha: 0.5, targetTopFrac: 0.14, targetBottomFrac: 0.95 }
            ]);
            const yTop = b.y + b.height * 0.2, yBottom = b.y + b.height - pad;
            for (let i = 0; i < 22; i++) particles.push(new Particle('sand', rand(x0, x1), rand(yTop, yBottom)));
        } else if (m.id === 'salt_water') {
            liquidState = makeLiquidState([
                { colorTop: MATERIALS.water.top, colorBottom: MATERIALS.water.bottom, alpha: 0.5, targetTopFrac: 0.14, targetBottomFrac: 0.95 }
            ]);
        }
        return particles;
    }

   function spawnSolidIngredient(role, count) {
        const b = getBeakerBounds();
        const pad = 22;
        const x0 = b.x + pad, x1 = b.x + b.width - pad;
        const yTop = b.y + pad, yBottom = b.y + b.height - pad;
        const rand = (a, c) => a + Math.random() * (c - a);
        const delay = Math.max(12, Math.min(35, 700 / count));
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const p = new Particle(role, rand(x0, x1), rand(yTop, yBottom));
                p.state = 'growing'; p.scale = 0;
                scene.particles.push(p);
            }, i * delay);
        }
    }

    function revealLiquidLayer(ing, m) {
        const def = liquidLayerDefsFor(m)[ing.liquidLayer];
        if (!def) return;
        if (!liquidState.layers) liquidState = { layers: [] };
        liquidState.layers[ing.liquidLayer] = {
            colorTop: def.colorTop, colorBottom: def.colorBottom, alpha: def.alpha,
            topFrac: 0.95, bottomFrac: 0.95,
            targetTopFrac: def.targetTopFrac, targetBottomFrac: def.targetBottomFrac,
            waveAmp: 2.5, phase: Math.random() * 10
        };
    }

   function drawPourCup(ctx, cx, cy, tiltAngle, fillFrac, color) {
        const w = 46, h = 54;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tiltAngle);
        ctx.translate(-w / 2, -h / 2);

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        const path = () => {
            ctx.beginPath();
            ctx.moveTo(2, 0);
            ctx.lineTo(0, h - 8);
            ctx.quadraticCurveTo(0, h, 10, h);
            ctx.lineTo(w - 10, h);
            ctx.quadraticCurveTo(w, h, w - 2, h - 8);
            ctx.lineTo(w - 6, 0);
        };
        path(); ctx.stroke();

        if (fillFrac > 0) {
            ctx.save();
            path(); ctx.lineTo(2, 0); ctx.closePath(); ctx.clip();
            const fh = (h - 4) * fillFrac;
            ctx.fillStyle = color; ctx.globalAlpha = 0.8;
            ctx.fillRect(0, h - fh, w, fh);
            ctx.restore();
        }
        ctx.restore();
    }

    function startLiquidPourEffect(color, durationTicks, onDone) {
        const b = getBeakerBounds();
        const startTick = scene.tick;
        const cupCx = b.x + b.width / 2 - 30;
        const cupCy = 60;
        const streamX = b.x + b.width / 2 + 6;
        const streamTopY = cupCy + 40;
        const streamBottomY = b.y + 8;

        scene.overlay = (ctx, w, h, tick) => {
            const t = tick - startTick;
            const total = durationTicks;
            const tiltIn = Math.min(t / 20, 1);
            const tiltOut = t > total - 20 ? Math.min((t - (total - 20)) / 20, 1) : 0;
            const tiltAngle = (0.95 * tiltIn) * (1 - tiltOut);
            const pouring = t > 18 && t < total - 15;

            if (t > total) { scene.overlay = null; if (onDone) onDone(); return; }

            let cupFill = 1;
            if (pouring) {
                const pourProgress = (t - 18) / Math.max(1, total - 33);
                cupFill = Math.max(0, 1 - pourProgress);
            } else if (t >= total - 15) {
                cupFill = 0;
            }

            if (pouring) {
                ctx.save();
                ctx.strokeStyle = color;
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.globalAlpha = 0.85;
                ctx.beginPath();
                ctx.moveTo(streamX + Math.sin(tick * 0.4) * 2, streamTopY);
                ctx.lineTo(streamX, streamBottomY);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(streamX, streamBottomY, 5 + Math.sin(tick * 0.6) * 2, 0, Math.PI * 2);
                ctx.fillStyle = color; ctx.globalAlpha = 0.55;
                ctx.fill();
                ctx.restore();
            }

            drawPourCup(ctx, cupCx, cupCy, tiltAngle, cupFill, color);
        };
    }

    function revealDissolvingSalt() {
        const b = getBeakerBounds();
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const sp = new Particle('salt', b.x + 20 + Math.random() * (b.width - 40), b.y + 18);
                sp.r = 2.4; sp.opacity = 1; sp.state = 'fading'; sp.jitter = 0;
                scene.particles.push(sp);
            }, i * 70);
        }
    }

    function renderIngredients(m) {
        toolGrid.innerHTML = '';
        INGREDIENTS[m.id].forEach(ing => {
            const el = document.createElement('div');
            el.className = 'tool-btn';
            el.draggable = true;
            el.dataset.ingredientRole = ing.role;
            el.innerHTML = `<i class="fas ${ing.icon}"></i><span>${ing.name}</span>`;
            el.addEventListener('click', () => placeIngredient(ing, el, m));
            el.addEventListener('dragstart', e => {
                el.classList.add('dragging');
                e.dataTransfer.setData('text/plain', 'ingredient:' + ing.role);
            });
            el.addEventListener('dragend', () => el.classList.remove('dragging'));
            toolGrid.appendChild(el);
        });
    }

    function placeIngredient(ing, el, m) {
        if (el.classList.contains('placed') || isFlying) return;
        isFlying = true;
        flyToolToCanvas(el, () => {
            isFlying = false;
            el.classList.add('placed');

          let waitMs = 500;
            if (ing.liquidLayer !== undefined) {
                waitMs = 1500;
                startLiquidPourEffect(MATERIALS[ing.role].top, Math.round(waitMs / 16.6));
                setTimeout(() => revealLiquidLayer(ing, m), 280);
            } else if (ing.dissolve) {
                revealDissolvingSalt();
                waitMs = 900;
            } else {
                spawnSolidIngredient(ing.role, ing.count);
                waitMs = Math.max(600, ing.count * 30 + 300);
            }

            buildQueue = buildQueue.filter(q => q.role !== ing.role);
            setTimeout(() => {
                if (buildQueue.length === 0) finishBuildPhase(m);
            }, waitMs);
        });
    }

    function finishBuildPhase(m) {
        buildActive = false;
        toolsCardTitle.textContent = 'أدوات الفصل';
        feedbackText.textContent = 'المخلوط جاهز! اسحب إحدى الأدوات إلى المخلوط، أو اضغط عليها مباشرة.';
        feedbackText.className = 'success';
        renderTools();
    }

    function startBuildPhase(m) {
        buildActive = true;
        buildQueue = INGREDIENTS[m.id].slice();
        liquidState = { layers: [] };
        scene.overlay = null;
        scene.clear([]);
        workspaceTitle.textContent = m.name;
        feedbackText.textContent = 'اسحب كل مكوّن من المخلوط وضعه داخل الإناء لتحضيره.';
        feedbackText.className = '';
        exploreBox.style.display = 'none';
        exploreBox.innerHTML = '';
        hintPanelText.textContent = m.hint;
        factPanelText.textContent = m.fact;
        propertyChip.style.visibility = 'hidden';
        btnContinue.classList.remove('show');
        toolsCardTitle.textContent = 'مكوّنات المخلوط';
        renderIngredients(m);
    }

   function loadMixture(idx) {
       currentIndex = idx;
        const m = MIXTURES[idx];
        pourGate = null;
        magnetGate = null;
        lastMagnetPos = null;

        if (solved.has(m.id)) {
            buildActive = false;
            workspaceTitle.textContent = m.name;
            feedbackText.textContent = 'اسحب إحدى الأدوات إلى المخلوط، أو اضغط عليها مباشرة.';
            feedbackText.className = '';
            exploreBox.style.display = 'none';
            exploreBox.innerHTML = '';
            hintPanelText.textContent = m.hint;
            factPanelText.textContent = m.fact;
            propertyChip.innerHTML = `<i class="fas fa-atom"></i> الخاصية: ${m.property}`;
            propertyChip.style.visibility = 'visible';
            btnContinue.classList.remove('show');
            toolsCardTitle.textContent = 'أدوات الفصل';
            scene.overlay = null;
            scene.clear(buildScene(m));
            renderTools();
        } else {
            startBuildPhase(m);
        }
        renderMixtureTabs();
    }

    function flyToolToCanvas(toolEl, cb) {
        if (!toolEl) { cb(); return; }
        const startRect = toolEl.getBoundingClientRect();
        const endRect = canvas.getBoundingClientRect();
        const clone = toolEl.cloneNode(true);
        clone.classList.add('tool-flight-clone');
        clone.style.position = 'fixed';
        clone.style.left = startRect.left + 'px';
        clone.style.top = startRect.top + 'px';
        clone.style.width = startRect.width + 'px';
        clone.style.height = startRect.height + 'px';
        clone.style.margin = '0';
        clone.style.zIndex = '999';
        clone.style.pointerEvents = 'none';
        document.body.appendChild(clone);
        toolEl.classList.add('sending');

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const dx = (endRect.left + endRect.width / 2) - (startRect.left + startRect.width / 2);
                const dy = (endRect.top + endRect.height / 2) - (startRect.top + startRect.height / 2);
                clone.style.transition = 'transform .45s cubic-bezier(.4,0,.2,1), opacity .45s ease';
                clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.65)`;
                clone.style.opacity = '0.1';
            });
        });

        setTimeout(() => {
            clone.remove();
            toolEl.classList.remove('sending');
            cb();
        }, 470);
    }

   function attemptTool(toolId, toolEl) {
        if (!toolId || isFlying || pourGate || magnetGate || buildActive) return;
        const m = MIXTURES[currentIndex];
        if (solved.has(m.id)) return;

        isFlying = true;
        flyToolToCanvas(toolEl, () => {
            const isCorrect = toolId === m.correctTool;
            const usesPour = m.liquid && ['funnel', 'filter', 'evaporate'].includes(toolId);
            const usesMagnetDrag = m.id === 'iron_sand' && toolId === 'magnet';

            if (usesPour) {
                isFlying = false;
                startPourGate(m, toolId, () => {
                    logAttempt(m, toolId, isCorrect);
                    if (isCorrect) handleSuccess(m);
                    else handleWrong(m, toolId, toolEl);
                });
            } else if (usesMagnetDrag) {
                isFlying = false;
                startMagnetGate(m, () => {
                    logAttempt(m, toolId, true);
                    handleSuccess(m);
                });
            } else {
                logAttempt(m, toolId, isCorrect);
                if (isCorrect) {
                    isFlying = false;
                    handleSuccess(m);
                } else {
                    handleWrong(m, toolId, toolEl);
                }
            }
        });
    }

    function playFailedAttempt(m, toolId, cb) {
    const b = getBeakerBounds();
    const tool = TOOLS.find(t => t.id === toolId);

    if (!tool) {
        cb();
        return;
    }

    const canvasRect = canvas.getBoundingClientRect();

    // مكان الأداة فوق البيكر
    const x = canvasRect.left + b.x + b.width / 2;
    const y = canvasRect.top + b.y - 44;

    const overlay = document.createElement('div');
    overlay.className = 'failed-tool-overlay';

    overlay.innerHTML = `
        <div class="failed-tool-icon">
            <i class="fas ${tool.icon}"></i>
        </div>
        <div class="failed-tool-ban">
            <i class="fas fa-ban"></i>
        </div>
        <div class="failed-tool-label">${tool.name}</div>
    `;

    overlay.style.left = `${x}px`;
    overlay.style.top = `${y}px`;

    document.body.appendChild(overlay);

    const icon = overlay.querySelector('.failed-tool-icon');

    // أنواع الحركة حسب الأداة
    if (toolId === 'sieve') {
        icon.classList.add('failed-shake');
    } else if (toolId === 'magnet') {
        icon.classList.add('failed-pulse');
    } else if (toolId === 'funnel') {
        icon.classList.add('failed-tilt');
    } else if (toolId === 'filter') {
        icon.classList.add('failed-filter-move');
    } else if (toolId === 'evaporate') {
        icon.classList.add('failed-fire-move');
    }

    // علامة المنع تظهر بعد بداية الحركة
    setTimeout(() => {
        overlay.classList.add('show-ban');
    }, 850);

    // بعد حوالي 1.5 ثانية ننهي التجربة
    setTimeout(() => {
        overlay.classList.add('failed-tool-out');

        setTimeout(() => {
            overlay.remove();
            cb();
        }, 180);

    }, 1500);
}

let toastTimer = null;
    function showResultToast(text, type) {
        if (!resultToast) return;
        clearTimeout(toastTimer);
        resultToast.textContent = text;
        resultToast.className = 'result-toast show ' + type;
        toastTimer = setTimeout(() => {
            resultToast.classList.remove('show');
        }, 3200);
    }
    function handleWrong(m, toolId, toolEl) {
        playFailedAttempt(m, toolId, () => {
            isFlying = false;
            canvasWrapper.classList.add('flash-error');
            setTimeout(() => canvasWrapper.classList.remove('flash-error'), 800);

            if (!exploreShown.has(m.id)) {
                exploreShown.add(m.id);
                showExplore(m, toolId);
            } else {
                const msg = m.wrongMsgs[toolId] || m.wrongMsgs.default;
                showResultToast(msg, 'error');
            }
        });
    }

    function showExplore(m, toolId) {
        const msg = m.wrongMsgs[toolId] || m.wrongMsgs.default;
        showResultToast(msg, 'error');

       exploreBox.innerHTML = `
            <div class="explore-card">
                <div class="explore-q">
                    ${m.explore.q}
                </div>

                <div class="explore-options">
                    ${m.explore.options.map((option, index) => `
                        <button
                            class="explore-option"
                            data-index="${index}"
                            type="button"
                        >
                            ${option}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        exploreBox.style.display = 'block';

        const options = exploreBox.querySelectorAll('.explore-option');

       options.forEach(option => {
            option.addEventListener('click', () => {
                const selected = Number(option.dataset.index);

                options.forEach(btn => btn.classList.add('disabled'));

                if (selected === m.explore.correct) {
                    option.classList.add('correct');
                    showResultToast('أحسنت! فهمت الخاصية الفيزيائية التي يعتمد عليها الفصل.', 'success');
                } else {
                    option.classList.add('wrong');
                    options[m.explore.correct].classList.add('correct');
                    showResultToast('ليست هذه الخاصية المناسبة لهذا المخلوط. راجع التلميح وحاول فهم سبب عدم حدوث الفصل.', 'error');
                }

                setTimeout(() => {
                    exploreBox.style.display = 'none';
                    exploreBox.innerHTML = '';
                }, 1500);
            });
        });
    }
    function handleSuccess(m) {
        solved.add(m.id);
        feedbackText.style.display = 'block';
        exploreBox.style.display = 'none';
        feedbackText.textContent = 'اسحب إحدى الأدوات إلى المخلوط، أو اضغط عليها مباشرة.';
        feedbackText.className = '';
        showResultToast(m.successMsg, 'success');
        canvasWrapper.classList.add('flash-success');
        setTimeout(() => canvasWrapper.classList.remove('flash-success'), 1000);
        propertyChip.style.visibility = 'visible';
        renderMixtureTabs();
        renderProgress();
        renderProperties();
        playSuccessAnimation(m);

        btnContinue.classList.add('show');
        btnContinue.innerHTML = solved.size >= MIXTURES.length
            ? '<i class="fas fa-arrow-left"></i> الانتقال إلى التقييم الختامي'
            : '<i class="fas fa-arrow-left"></i> المخلوط التالي';
    }

    function playSuccessAnimation(m) {
        const b = getBeakerBounds();
        const label = toolName(m.correctTool);

        if (m.id === 'sand_gravel') {
            const meshY = b.y + b.height * 0.5;
            scene.particles.forEach(p => {
                if (p.role === 'sand') { p.state = 'moving'; p.tx = p.x; p.ty = meshY + 22 + Math.random() * (b.y + b.height - meshY - 40); }
                else { p.state = 'moving'; p.tx = p.x; p.ty = b.y + 16 + Math.random() * (meshY - b.y - 32); }
            });
            scene.overlay = (ctx) => {
                ctx.save();
                ctx.setLineDash([8, 6]);
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(b.x, meshY); ctx.lineTo(b.x + b.width, meshY); ctx.stroke();
                ctx.restore();
                drawToolLabel(ctx, label, b.x + b.width / 2, meshY - 16);
            };
        }

       if (m.id === 'iron_sand') {
            const mx = lastMagnetPos ? lastMagnetPos.x : b.x + 34;
            const my = lastMagnetPos ? lastMagnetPos.y : b.y + 34;
            scene.overlay = (ctx, w, h, tick) => {
                ctx.save();
                const pulse = 1 + Math.sin(tick * 0.08) * 0.15;
                const g = ctx.createRadialGradient(mx, my, 0, mx, my, 46 * pulse);
                g.addColorStop(0, 'rgba(0,78,102,0.35)');
                g.addColorStop(1, 'transparent');
                ctx.beginPath(); ctx.arc(mx, my, 46 * pulse, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
                ctx.restore();
                drawMagnetIcon(ctx, mx, my, tick);
                drawToolLabel(ctx, label, mx, my + 38);
            };
        }

        if (m.id === 'oil_water') {
            liquidState.layers[1].targetBottomFrac = 0.62;
            liquidState.layers[0].targetTopFrac = 0.10;
            liquidState.layers[0].targetBottomFrac = 0.60;
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    const dp = new Particle('sand', b.x + b.width / 2 + (Math.random() - 0.5) * 10, b.y + b.height - 6);
                    dp.r = 2.2; dp.state = 'fading'; dp.grainPoints = [{ angle: 0, radius: 2 }, { angle: 2, radius: 2 }, { angle: 4, radius: 2 }];
                    dp.grainRotation = 0; dp.grainShade = 1;
                    scene.particles.push(dp);
                }, i * 90);
            }
            scene.overlay = (ctx) => drawToolLabel(ctx, label, b.x + b.width / 2, b.y - 20);
        }

        if (m.id === 'sand_water') {
            const lineY = b.y + b.height * 0.4;
            const lineFrac = (lineY - b.y) / b.height;
            liquidState.layers[0].targetTopFrac = lineFrac;
            scene.particles.forEach(p => {
                if (p.role === 'sand') { p.state = 'moving'; p.speed = 0.05; p.tx = p.x; p.ty = lineY - 10 - Math.random() * 12; }
            });
            scene.overlay = (ctx) => {
                ctx.save();
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(b.x, lineY); ctx.lineTo(b.x + b.width, lineY); ctx.stroke();
                ctx.restore();
                drawToolLabel(ctx, 'ورقة الترشيح', b.x + b.width / 2, lineY - 14);
                drawToolLabel(ctx, label, b.x + b.width / 2, b.y - 14);
            };
        }

        if (m.id === 'salt_water') {
            liquidState.layers[0].targetTopFrac = 0.92;
            const steamPuffs = [];
            const steamStartTick = scene.tick;
            const steamTimer = setInterval(() => {
                if (!solved.has('salt_water')) { clearInterval(steamTimer); return; }
                steamPuffs.push({
                    x: b.x + 26 + Math.random() * (b.width - 52),
                    y: b.y + 10,
                    r: 6 + Math.random() * 5,
                    opacity: 0.6 + Math.random() * 0.2,
                    drift: (Math.random() - 0.5) * 0.35,
                    speed: 0.5 + Math.random() * 0.3,
                    born: scene.tick
                });
            }, 180);
            setTimeout(() => clearInterval(steamTimer), 2600);

            scene.overlay = (ctx, w, h, tick) => {
                for (let i = steamPuffs.length - 1; i >= 0; i--) {
                    const s = steamPuffs[i];
                    const age = tick - s.born;
                    s.y -= s.speed;
                    s.x += s.drift;
                    s.r += 0.06;
                    const fade = Math.max(0, 1 - age / 130);
                    if (fade <= 0) { steamPuffs.splice(i, 1); continue; }
                    ctx.save();
                    ctx.globalAlpha = Math.min(1, s.opacity * fade * 1.9);

                    // ظل رمادي خفيف تحت السحابة يدي تباين واضح مع الخلفية الفاتحة
                    ctx.beginPath();
                    ctx.arc(s.x, s.y + 1, s.r * 1.05, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(100,116,139,0.35)';
                    ctx.fill();

                    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
                    g.addColorStop(0, 'rgba(255,255,255,1)');
                    g.addColorStop(0.55, 'rgba(226,232,240,0.9)');
                    g.addColorStop(1, 'rgba(203,213,225,0)');
                    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                    ctx.fillStyle = g; ctx.fill();
                    ctx.restore();
                }
                drawToolLabel(ctx, label, b.x + b.width / 2, b.y - 20);
            };

            setTimeout(() => {
                for (let i = 0; i < 16; i++) {
                    const sp = new Particle('salt', b.x + 18 + Math.random() * (b.width - 36), b.y + b.height - 16 - Math.random() * 16);
                    sp.opacity = 1; sp.scale = 0; sp.state = 'growing';
                    scene.particles.push(sp);
                }
            }, 1900);
        }
    }

   btnHint.addEventListener('click', () => {
        btnHint.classList.toggle('active');
        showInfoTab('hint');
        const infoCard = document.getElementById('infoCard');
        if (infoCard) infoCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    infoTabs.forEach(tab => tab.addEventListener('click', () => showInfoTab(tab.dataset.tab)));
    function showInfoTab(name) {
        infoTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
        infoPanels.forEach(p => p.classList.toggle('active', p.dataset.panel === name));
    }

    btnContinue.addEventListener('click', () => {
        if (solved.size >= MIXTURES.length) {
            startQuiz();
        } else {
            let next = (currentIndex + 1) % MIXTURES.length;
            let guard = 0;
            while (solved.has(MIXTURES[next].id) && guard < MIXTURES.length) { next = (next + 1) % MIXTURES.length; guard++; }
            loadMixture(next);
        }
    });

    const labStage = document.getElementById('labStage');
    const stageQuiz = document.getElementById('stage-quiz');
    const stageComplete = document.getElementById('stage-complete');
    const quizProgress = document.getElementById('quizProgress');
    const quizQuestionEl = document.getElementById('quizQuestion');
    const quizOptionsEl = document.getElementById('quizOptions');
    let quizIndex = 0, quizScore = 0;

    function startQuiz() {
        scene.stop();
        labStage.style.display = 'none';
        stageQuiz.classList.add('active');
        quizIndex = 0; quizScore = 0;
        renderQuizQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderQuizQuestion() {
        const q = QUIZ[quizIndex];
        quizProgress.textContent = `السؤال ${quizIndex + 1} من ${QUIZ.length}`;
        quizQuestionEl.textContent = q.q;
        quizOptionsEl.innerHTML = '';
        q.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.addEventListener('click', () => selectQuizOption(i, btn, q));
            quizOptionsEl.appendChild(btn);
        });
    }

    function selectQuizOption(i, btn, q) {
        const allOptions = quizOptionsEl.querySelectorAll('.quiz-option');
        allOptions.forEach(o => o.classList.add('disabled'));
        if (i === q.correct) { btn.classList.add('correct'); quizScore++; }
        else { btn.classList.add('wrong'); allOptions[q.correct].classList.add('correct'); }

        setTimeout(() => {
            quizIndex++;
            if (quizIndex < QUIZ.length) renderQuizQuestion();
            else {
                stageQuiz.classList.remove('active');
                stageComplete.classList.add('active');
                document.getElementById('completeScore').textContent = `${quizScore} / ${QUIZ.length}`;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 1400);
    }

    renderTools();
    renderProgress();
    renderProperties();
    renderAttemptsLog();
    loadMixture(0);
    showInfoTab('hint');
});