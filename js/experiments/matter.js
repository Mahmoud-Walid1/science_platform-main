/**
 * matter.js v5.5 — محاكاة فائقة الوضوح مع هيدر وفوتر عرض كامل
 */
'use strict';

const CFG = {
    BASE_COUNT: 72,
    R: 7,
    MOLE_FACTOR: 36,
    COLORS: {
        solid:  { core: '#0089ae', glow: 'rgba(0,137,174,0.35)', bond: 'rgba(0,168,212,0.25)' },
        liquid: { core: '#00c9a7', glow: 'rgba(0,201,167,0.35)', bond: 'rgba(0,201,167,0.15)' },
        gas:    { core: '#f59e0b', glow: 'rgba(245,158,11,0.4)', bond: 'rgba(245,158,11,0.06)' },
    },
    SPEEDS: {
        solid:  { min: 0.06, max: 0.5 },
        liquid: { min: 0.9,  max: 2.8 },
        gas:    { min: 3.0,  max: 7.5 },
    },
    THRESHOLDS: { melt: 30, boil: 65 },
    GRAVITY: 0.14,
    LIQUID_LEVEL: 0.62,
};

let canvas, ctx, particles = [], temp = 0, pres = 50, state = 'solid', phase = 1;
let raf, tick = 0, bubbles = [];
let targetMoles = 2.0, currentMoles = 2.0;
let stateOverride = null;

class Particle {
    constructor(x, y, W, H) {
        this.W = W; this.H = H;
        this.bx = x; this.by = y;
        this.x = x; this.y = y;
        this.r = CFG.R;
        this.trail = [];
        this._setV();
    }

    _spd() {
        const s = CFG.SPEEDS[state];
        let pf = 1;
        if (state === 'gas') pf = Math.max(0.3, 1 - (pres / 100) * 0.5);
        else if (state === 'liquid') pf = Math.max(0.5, 1 - (pres / 100) * 0.15);
        else pf = Math.max(0.6, 1 - (pres / 100) * 0.1);
        return (s.min + Math.random() * (s.max - s.min)) * pf;
    }

    _setV() {
        const sp = this._spd(), a = Math.random() * Math.PI * 2;
        this.vx = Math.cos(a) * sp;
        this.vy = Math.sin(a) * sp;
    }

    _clamp() {
        const sp = this._spd(), cur = Math.hypot(this.vx, this.vy);
        if (!cur) { this._setV(); return; }
        const f = sp / cur;
        this.vx *= f; this.vy *= f;
    }

    update() {
        let extraMargin = 0;
        if (state === 'gas') {
            extraMargin = (pres / 100) * (Math.min(this.W, this.H) * 0.2);
        } else if (state === 'liquid') {
            extraMargin = (pres / 100) * (Math.min(this.W, this.H) * 0.05);
        } else {
            extraMargin = (pres / 100) * (Math.min(this.W, this.H) * 0.08);
        }
        const mg = this.r + 4 + extraMargin;
        const maxX = this.W - mg, minX = mg;
        const maxY = this.H - mg, minY = mg;

        if (state === 'solid') {
            const amp = 2 + (temp / 100) * 10 + (pres / 100) * 4;
            this.x = this.bx + (Math.random() - 0.5) * amp;
            this.y = this.by + (Math.random() - 0.5) * amp;
            this.x = Math.min(maxX, Math.max(minX, this.x));
            this.y = Math.min(maxY, Math.max(minY, this.y));
            return;
        }

        if (state === 'liquid') {
            this.vy += CFG.GRAVITY;
            this.vx *= 0.998;
            this.vy *= 0.998;
            if (Math.hypot(this.vx, this.vy) < 0.3) {
                this.vx += (Math.random() - 0.5) * 0.4;
                this.vy += (Math.random() - 0.5) * 0.4;
            }
        }

        this.x += this.vx;
        this.y += this.vy;

        if (state === 'gas' && tick % 2 === 0) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 12) this.trail.shift();
        } else if (state !== 'gas') this.trail = [];

        if (this.x < minX) { this.x = minX; this.vx = Math.abs(this.vx); }
        if (this.x > maxX) { this.x = maxX; this.vx = -Math.abs(this.vx); }
        if (this.y < minY) { this.y = minY; this.vy = Math.abs(this.vy); }
        if (this.y > maxY) { this.y = maxY; this.vy = -Math.abs(this.vy); }

        if (state === 'liquid') {
            const levelShift = (pres / 100) * 0.04;
            const liquidTop = this.H * (1 - CFG.LIQUID_LEVEL - levelShift);
            if (this.y < liquidTop + this.r) {
                this.y = liquidTop + this.r;
                this.vy = Math.abs(this.vy) * 0.4;
            }
        }

        if (Math.hypot(this.vx, this.vy) > CFG.SPEEDS[state].max * 1.6) this._clamp();
    }

    draw() {
        const c = CFG.COLORS[state];
        if (state === 'gas') {
            this.trail.forEach((t, i) => {
                const alpha = (i / this.trail.length) * 0.4;
                ctx.beginPath(); ctx.arc(t.x, t.y, this.r * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = c.core + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.fill();
            });
        }

        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4);
        g.addColorStop(0, c.glow); g.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();

        const pg = ctx.createRadialGradient(this.x - this.r * 0.35, this.y - this.r * 0.35, 0, this.x, this.y, this.r);
        pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, c.core);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = pg;
        ctx.shadowBlur = 16; ctx.shadowColor = c.core;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function calcState() {
    if (phase === 3) return stateOverride || state;
    if (stateOverride) {
        const moleShift = (currentMoles - 2.0) * 6;
        const melt = Math.max(5, Math.min(50, CFG.THRESHOLDS.melt + moleShift));
        const boil = Math.max(35, Math.min(85, CFG.THRESHOLDS.boil + moleShift));
        const natural = temp < melt ? 'solid' : temp < boil ? 'liquid' : 'gas';
        if (natural !== stateOverride && Math.abs(temp - (natural==='solid'?0:natural==='liquid'?50:100)) > 15) return natural;
        return stateOverride;
    }
    const moleShift = (currentMoles - 2.0) * 6;
    const melt = Math.max(5, Math.min(50, CFG.THRESHOLDS.melt + moleShift));
    const boil = Math.max(35, Math.min(85, CFG.THRESHOLDS.boil + moleShift));
    return temp < melt ? 'solid' : temp < boil ? 'liquid' : 'gas';
}

function getParticleCount() {
    const factor = (phase === 2 || phase === 3) ? currentMoles * CFG.MOLE_FACTOR : CFG.BASE_COUNT;
    return Math.round(factor);
}

function redistributeParticles() {
    const W = canvas.width, H = canvas.height - 10;
    const target = getParticleCount();
    while (particles.length < target) {
        particles.push(new Particle(20 + Math.random() * (W - 40), 20 + Math.random() * (H - 40), W, H));
    }
    if (particles.length > target) particles.splice(target);

    if (state === 'solid' && target > 0) {
        const margin = 30 + (pres / 100) * 25;
        const availableW = W - margin * 2, availableH = H - margin * 2;
        let cols = Math.round(Math.sqrt(target * availableW / availableH));
        let rows = Math.ceil(target / cols);
        const remainder = target % cols;
        if (remainder > 0 && remainder < cols * 0.25) {
            cols = Math.max(1, cols - 1);
            rows = Math.ceil(target / cols);
        }
        const px = availableW / (cols + 1);
        const py = availableH / (rows + 1);
        for (let i = 0; i < target; i++) {
            const p = particles[i];
            const r = Math.floor(i / cols), c = i % cols;
            const rowCount = (r === rows - 1 && target % cols !== 0) ? target % cols : cols;
            const offsetX = (cols - rowCount) * px / 2;
            p.bx = margin + px * (c + 1) + offsetX;
            p.by = margin + py * (r + 1);
            p.x += (p.bx - p.x) * 0.4;
            p.y += (p.by - p.y) * 0.4;
        }
    }
}

function drawGasVolumeFrame() {
    if (state !== 'gas' || phase !== 3) return;
    const W = canvas.width, H = canvas.height;
    const margin = 20 + (pres / 100) * (Math.min(W, H) * 0.2);
    const x = margin, y = margin, w = W - margin * 2, h = H - margin * 2;
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(245,158,11,0.5)';
    ctx.strokeRect(x, y, w, h);
    ctx.restore();

    const percent = Math.round(100 - (pres / 100) * 40);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 14px Cairo';
    ctx.textAlign = 'right';
    ctx.fillText(`حجم الغاز: ${percent}%`, x + w - 15, y + 30);
}

function drawLiquidSurface() {
    if (state !== 'liquid') return;
    const W = canvas.width, H = canvas.height;
    const levelShift = (pres / 100) * 0.04;
    const topY = H * (1 - CFG.LIQUID_LEVEL - levelShift);
    const segments = 60, dx = W / segments;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let i = 0; i <= segments; i++) {
        const x = i * dx;
        let minY = topY;
        for (const p of particles) if (Math.abs(p.x - x) < dx * 1.2 && p.y < minY) minY = p.y;
        const wave = Math.sin(x * 0.06 + tick * 0.04) * 5;
        ctx.lineTo(x, minY + wave);
    }
    ctx.lineTo(W, H); ctx.closePath();
    const grad = ctx.createLinearGradient(0, topY, 0, H);
    grad.addColorStop(0, 'rgba(0,201,167,0.06)'); grad.addColorStop(0.6, 'rgba(0,201,167,0.2)'); grad.addColorStop(1, 'rgba(0,168,212,0.35)');
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = 'rgba(0,201,167,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, topY);
    for (let i = 0; i <= segments; i++) {
        const x = i * dx;
        let minY = topY;
        for (const p of particles) if (Math.abs(p.x - x) < dx * 1.2 && p.y < minY) minY = p.y;
        const wave = Math.sin(x * 0.06 + tick * 0.04) * 5;
        ctx.lineTo(x, minY + wave);
    }
    ctx.stroke();
}

function updateBubbles() {
    if (state !== 'liquid' || temp < 55) { bubbles = []; return; }
    if (Math.random() < (temp - 55) / 45 * 0.32) {
        bubbles.push({ x: 20 + Math.random() * (canvas.width - 40), y: canvas.height - 10, r: 2 + Math.random() * 6, vy: 0.7 + Math.random() * 1.5, a: 0.8 });
    }
    bubbles = bubbles.filter(b => b.a > 0.05);
    bubbles.forEach(b => { b.y -= b.vy; b.x += (Math.random() - 0.5) * 0.6; b.a -= 0.005; });
}

function drawBubbles() {
    bubbles.forEach(b => {
        ctx.globalAlpha = b.a; ctx.strokeStyle = '#00c9a7'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
    });
}

function drawContainer() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#f5f8fc'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,78,102,0.04)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 45) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 45) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const thickness = 1.5 + (pres / 100) * 6;
    ctx.strokeStyle = `rgba(0,78,102,${0.15 + (pres / 100) * 0.45})`;
    ctx.lineWidth = thickness;
    ctx.strokeRect(2, 2, W - 4, H - 4);
    ctx.lineWidth = 1;
    const bW = 14, bH = H - 40, bX = W - 22, bY = 20;
    ctx.fillStyle = 'rgba(0,78,102,0.06)'; ctx.beginPath(); roundRect(ctx, bX, bY, bW, bH, 8); ctx.fill();
    const fH = (temp / 100) * bH;
    const tg = ctx.createLinearGradient(bX, bY + bH, bX, bY);
    tg.addColorStop(0, '#2563eb'); tg.addColorStop(0.35, '#10b981'); tg.addColorStop(0.7, '#f59e0b'); tg.addColorStop(1, '#ef4444');
    ctx.fillStyle = tg; ctx.beginPath(); roundRect(ctx, bX, bY + bH - fH, bW, fH, 8); ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawBonds() {
    const md = state === 'solid' ? 55 : state === 'liquid' ? 30 : 0;
    if (!md) return;
    ctx.lineWidth = state === 'solid' ? 2.6 : 0.8;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
            if (d < md) {
                ctx.globalAlpha = (1 - d / md) * (state === 'solid' ? 0.55 : 0.18);
                ctx.strokeStyle = CFG.COLORS[state].bond;
                ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
            }
        }
    }
    ctx.globalAlpha = 1;
}

function loop() {
    tick++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawContainer();
    drawGasVolumeFrame();

    if (Math.abs(currentMoles - targetMoles) > 0.01) {
        currentMoles += (targetMoles - currentMoles) * 0.07;
        redistributeParticles();
    }

    const newState = calcState();
    if (newState !== state) {
        state = newState;
        particles.forEach(p => p._setV());
        triggerStateFlash();
        redistributeParticles();
    }

    drawBonds();
    if (state === 'liquid') drawLiquidSurface();
    updateBubbles();
    drawBubbles();

    particles.forEach(p => { p.update(); p.draw(); });

    updateUI();
    raf = requestAnimationFrame(loop);
}

function initParticles() {
    particles = [];
    redistributeParticles();
}

function triggerStateFlash() {
    const wrapper = document.getElementById('canvasWrapper');
    if (wrapper) {
        wrapper.classList.add('state-flash');
        setTimeout(() => wrapper.classList.remove('state-flash'), 500);
    }
}

function updateUI() {
    const names = { solid: 'صلب 🧊', liquid: 'سائل 💧', gas: 'غازي 💨' };
    const lbl = document.getElementById('stateLabel');
    if (lbl) { lbl.textContent = names[state]; lbl.className = 'state-' + state; }

    const descMap = {
        solid: 'الجزيئات في شبكة بلورية منتظمة وتهتز حول مواضع ثابتة. الشكل والحجم ثابتان.',
        liquid: 'الجزيئات متقاربة وتتحرك بحرية، يحافظ السائل على حجمه ويأخذ شكل الوعاء.',
        gas: 'الجزيئات متباعدة جداً وتتحرك بسرعات عالية، يملأ الغاز كامل الحاوية.'
    };
    let desc = descMap[state];
    if (phase === 3) {
        if (pres > 80) desc += ' ⚡ ضغط مرتفع: تقلصت المسافات.';
        else if (pres < 20) desc += ' 🌫️ ضغط منخفض: تمددت المسافات.';
    }
    document.getElementById('stateDesc').textContent = desc;

    const realTemp = Math.round(temp * 3.74 - 100);
    document.getElementById('tempValue') && (document.getElementById('tempValue').textContent = realTemp + ' °م');
    document.getElementById('tempBig') && (document.getElementById('tempBig').textContent = realTemp + '°');
    document.getElementById('thermoFill') && (document.getElementById('thermoFill').style.height = temp + '%');
    document.getElementById('pressValue') && (document.getElementById('pressValue').textContent = Math.round(pres * 2) + ' kPa');
    document.getElementById('molesValue') && (document.getElementById('molesValue').textContent = currentMoles.toFixed(1));

    const moleShift = (currentMoles - 2.0) * 6;
    const melt = Math.max(5, Math.min(50, CFG.THRESHOLDS.melt + moleShift));
    const boil = Math.max(35, Math.min(85, CFG.THRESHOLDS.boil + moleShift));
    document.getElementById('meltPoint') && (document.getElementById('meltPoint').textContent = Math.round(melt * 3.74 - 100) + ' °م');
    document.getElementById('boilPoint') && (document.getElementById('boilPoint').textContent = Math.round(boil * 3.74 - 100) + ' °م');

    const wrapper = document.getElementById('canvasWrapper');
    if (wrapper) {
        wrapper.classList.remove('pressure-high', 'pressure-low');
        if (pres > 75) wrapper.classList.add('pressure-high');
        else if (pres < 25) wrapper.classList.add('pressure-low');
    }

    const keMap = { solid: 15 + temp * 0.3 + (pres / 100) * 6, liquid: 40 + temp * 0.5, gas: 65 + temp * 0.35 };
    const kePercent = Math.min(100, keMap[state] || 50);
    const denMap = { solid: 90 - temp * 0.1 - (pres / 100) * 6, liquid: 68 - temp * 0.15, gas: Math.max(8, 30 + pres * 0.4) };
    const denPercent = Math.min(100, Math.max(5, denMap[state] || 50));

    const keBar = document.getElementById(phase === 2 ? 'keBar' : 'keBar3');
    const keVal = document.getElementById(phase === 2 ? 'keVal' : 'keVal3');
    const denseBar = document.getElementById(phase === 2 ? 'denseBar' : 'denseBar3');
    const denseVal = document.getElementById(phase === 2 ? 'denseVal' : 'denseVal3');

    if (keBar) {
        keBar.style.width = kePercent + '%';
        keBar.style.background = state === 'solid' ? '#2563eb' : state === 'liquid' ? '#10b981' : '#f59e0b';
    }
    if (keVal) keVal.textContent = kePercent < 25 ? 'منخفضة' : kePercent < 55 ? 'متوسطة' : kePercent < 80 ? 'عالية' : 'مرتفعة جداً';
    if (denseBar) {
        denseBar.style.width = denPercent + '%';
        denseBar.style.background = state === 'solid' ? '#1e40af' : state === 'liquid' ? '#047857' : '#b45309';
    }
    if (denseVal) denseVal.textContent = denPercent > 80 ? 'عالية' : denPercent > 50 ? 'متوسطة' : 'منخفضة';

    document.querySelectorAll('.state-btn').forEach(b => b.classList.toggle('active', b.dataset.state === state));
}

function bindControls() {
    document.getElementById('tempSlider')?.addEventListener('input', e => {
        temp = +e.target.value;
        if (phase !== 3) stateOverride = null;
    });
    document.getElementById('pressSlider')?.addEventListener('input', e => {
        pres = +e.target.value;
        if (state === 'solid') redistributeParticles();
    });
}

window.setPhase = function(n, el) {
    document.querySelectorAll('.phase-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    phase = n;

    document.getElementById('phase1Controls').style.display = 'none';
    document.getElementById('phase2Controls').style.display = 'none';
    document.getElementById('phase3Controls').style.display = 'none';

    if (n === 1) {
        document.getElementById('phase1Controls').style.display = 'block';
        stateOverride = 'solid';
        temp = 0;
    } else if (n === 2) {
        document.getElementById('phase2Controls').style.display = 'block';
        stateOverride = null;
    } else {
        document.getElementById('phase3Controls').style.display = 'block';
        if (!stateOverride) stateOverride = 'gas';
        temp = 50;
        document.getElementById('tempSlider') && (document.getElementById('tempSlider').value = temp);
    }

    if (document.getElementById('tempSlider')) document.getElementById('tempSlider').value = temp;
    updateUI();
    redistributeParticles();
};

window.setMatterState = function(s) {
    stateOverride = s;
    temp = { solid: 10, liquid: 50, gas: 90 }[s];
    if (document.getElementById('tempSlider')) document.getElementById('tempSlider').value = temp;
    updateUI();
    redistributeParticles();
};

window.showInfoTab = function(id, el) {
    document.querySelectorAll('.info-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.info-pane').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('pane-' + id).classList.add('active');
};

window.checkAnswer = function(btn, correct) {
    const all = btn.parentElement.querySelectorAll('.quiz-opt');
    all.forEach(b => { b.disabled = true; b.classList.remove('correct', 'wrong'); });
    btn.classList.add(correct ? 'correct' : 'wrong');
};

window.changeMoles = function(d) {
    targetMoles = Math.max(0.5, Math.min(5, parseFloat((targetMoles + d * 0.5).toFixed(1))));
    document.getElementById('molesValue').textContent = targetMoles.toFixed(1);
};

function init() {
    canvas = document.getElementById('matterCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    function resize() {
        canvas.width = canvas.parentElement.clientWidth || 700;
        canvas.height = 480;
        initParticles();
    }
    resize();
    window.addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); loop(); });
    bindControls();
    updateUI();
    loop();
}
document.addEventListener('DOMContentLoaded', init);