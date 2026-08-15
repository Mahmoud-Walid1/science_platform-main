/**
 * circuits.js - محاكاة دائرة كهربائية احترافية متقدمة
 * معمل فيزياء تفاعلي | إصدار 2.0
 */
'use strict';

// ==================== الإعدادات ====================
let currentMode = 'series';
let selectedComponent = null;
let isSwitchClosed = true;
let circuitComplete = false;
let tick = 0;
let electrons = [];
let canvas, ctx, animationId;

// مكونات الدائرة
const components = {
    battery:  { placed: false, voltage: 9, resistance: 0.1, x: 0, y: 0 },
    bulb:     { placed: false, resistance: 100, lit: false, glowIntensity: 0, x: 0, y: 0 },
    switch:   { placed: false, isClosed: true, x: 0, y: 0 },
    resistor1:{ placed: false, resistance: 100, x: 0, y: 0 },
    resistor2:{ placed: false, resistance: 150, x: 0, y: 0 }
};

// بيانات القياس
let totalResistance = 0;
let current_mA = 0;
let voltage_V = 0;

// إحداثيات المكونات
const seriesPositions = {
    battery:   { x: 120, y: 220 },
    bulb:      { x: 280, y: 220 },
    switch:    { x: 440, y: 220 },
    resistor1: { x: 600, y: 220 },
    resistor2: { x: 760, y: 220 }
};

const parallelPositions = {
    battery:   { x: 120, y: 220 },
    switch:    { x: 280, y: 220 },
    resistor1: { x: 480, y: 140 },
    bulb:      { x: 480, y: 300 },
    resistor2: { x: 700, y: 220 }
};

const seriesSlots = [
    { id: 'battery', label: 'بطارية', icon: '🔋', order: 1 },
    { id: 'bulb', label: 'مصباح', icon: '💡', order: 2 },
    { id: 'switch', label: 'مفتاح', icon: '🔘', order: 3 },
    { id: 'resistor1', label: 'مقاومة R₁', icon: '⚡', order: 4 },
    { id: 'resistor2', label: 'مقاومة R₂', icon: '⚡', order: 5 }
];

const parallelSlots = [
    { id: 'battery', label: 'بطارية', icon: '🔋', order: 1 },
    { id: 'switch', label: 'مفتاح', icon: '🔘', order: 2 },
    { id: 'resistor1', label: 'مقاومة R₁', icon: '⚡', order: 3 },
    { id: 'bulb', label: 'مصباح', icon: '💡', order: 4 },
    { id: 'resistor2', label: 'مقاومة R₂', icon: '⚡', order: 5 }
];

// ==================== الحسابات ====================
function updateComponentPositions() {
    const positions = currentMode === 'series' ? seriesPositions : parallelPositions;
    for (let key in components) {
        if (positions[key]) {
            components[key].x = positions[key].x;
            components[key].y = positions[key].y;
        }
    }
}

function calculateCircuit() {
    const required = currentMode === 'series'
        ? ['battery', 'bulb', 'switch', 'resistor1', 'resistor2']
        : ['battery', 'switch', 'resistor1', 'bulb'];
    
    const allPlaced = required.every(id => components[id].placed);
    circuitComplete = allPlaced;

    if (!allPlaced || !isSwitchClosed) {
        current_mA = 0;
        voltage_V = 0;
        totalResistance = 0;
        components.bulb.lit = false;
        components.bulb.glowIntensity = 0;
        electrons = [];
        updateUI();
        updateSlotStyles();
        return;
    }

    const V = components.battery.voltage;
    
    if (currentMode === 'series') {
        totalResistance = components.battery.resistance + 
                         components.resistor1.resistance + 
                         components.resistor2.resistance + 
                         components.bulb.resistance;
        current_mA = (V / totalResistance) * 1000;
        voltage_V = V;
    } else {
        const branch1_R = components.resistor1.resistance + components.bulb.resistance;
        let branch2_R = components.resistor2.placed ? components.resistor2.resistance : Infinity;
        
        if (branch2_R !== Infinity && branch1_R > 0) {
            totalResistance = components.battery.resistance + 
                            (branch1_R * branch2_R) / (branch1_R + branch2_R);
        } else if (branch1_R > 0) {
            totalResistance = components.battery.resistance + branch1_R;
        } else {
            totalResistance = 0;
        }
        
        if (totalResistance > 0) {
            current_mA = (V / totalResistance) * 1000;
            voltage_V = V;
        }
    }
    
    components.bulb.lit = current_mA > 0.5;
    components.bulb.glowIntensity = Math.min(1, current_mA / 80);
    
    if (current_mA > 0 && isSwitchClosed && circuitComplete) {
        if (electrons.length === 0) initElectrons();
    } else {
        electrons = [];
    }
    
    updateUI();
    updateSlotStyles();
}

function updateUI() {
    // القراءات
    const currentEl = document.getElementById('currentValue');
    const voltageEl = document.getElementById('voltageValue');
    const resistanceEl = document.getElementById('resistanceValue');
    
    if (currentEl) currentEl.textContent = current_mA.toFixed(1);
    if (voltageEl) voltageEl.textContent = voltage_V.toFixed(1);
    if (resistanceEl) resistanceEl.textContent = totalResistance.toFixed(0);
    
    // أشرطة التقدم
    const currentBar = document.getElementById('currentBar');
    if (currentBar) {
        currentBar.style.width = Math.min(100, (current_mA / 80) * 100) + '%';
        currentBar.style.background = current_mA > 0 
            ? 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)' 
            : 'linear-gradient(90deg, #cbd5e1, #e2e8f0)';
    }
    
    const resistanceBar = document.getElementById('resistanceBar');
    if (resistanceBar) {
        resistanceBar.style.width = Math.min(100, (totalResistance / 500) * 100) + '%';
    }
    
    // جدول المقارنة
    const compCurrent = document.getElementById('compCurrent');
    const compVoltage = document.getElementById('compVoltage');
    const compResistance = document.getElementById('compResistance');
    const compRule = document.getElementById('compRule');
    const compBulb = document.getElementById('compBulb');
    
    if (compCurrent) compCurrent.innerHTML = current_mA > 0 
        ? `<span style="color:#f59e0b; font-weight:800;">${current_mA.toFixed(1)} mA</span>` 
        : '0 mA';
    if (compVoltage) compVoltage.innerHTML = voltage_V > 0 
        ? `<span style="color:#3b82f6; font-weight:800;">${voltage_V.toFixed(1)} V</span>` 
        : '0 V';
    if (compResistance) compResistance.innerHTML = totalResistance > 0 
        ? `<span style="color:#8b5cf6; font-weight:800;">${totalResistance.toFixed(0)} Ω</span>` 
        : '0 Ω';
    if (compRule) {
        compRule.innerHTML = currentMode === 'series' 
            ? 'Rₜ = R₁ + R₂ + R<sub>bulb</sub> = ' + totalResistance.toFixed(0) + ' Ω'
            : '1/Rₜ = 1/(R₁+R<sub>bulb</sub>) + 1/R₂';
    }
    if (compBulb) {
        compBulb.innerHTML = components.bulb.lit 
            ? '<span style="color:#f59e0b; font-weight:800;">💡 مضيء</span>' 
            : '⚫ مطفأ';
    }
    
    // مؤشر التيار
    const indicator = document.getElementById('liveIndicator');
    if (indicator) {
        if (current_mA > 0 && isSwitchClosed && circuitComplete) {
            indicator.innerHTML = '<i class="fas fa-circle"></i> التيار يسري ⚡';
            indicator.classList.add('active');
        } else {
            indicator.innerHTML = '<i class="fas fa-circle"></i> التيار متوقف';
            indicator.classList.remove('active');
        }
    }
    
    // زر المفتاح
    const switchBtn = document.getElementById('toggleSwitchBtn');
    if (switchBtn) {
        if (isSwitchClosed) {
            switchBtn.classList.add('off');
            switchBtn.innerHTML = '<i class="fas fa-power-off"></i> إيقاف المفتاح';
        } else {
            switchBtn.classList.remove('off');
            switchBtn.innerHTML = '<i class="fas fa-power-off"></i> تشغيل المفتاح';
        }
    }
    
    // تحديث حالة المكونات في الرف
    updateRackPlacedState();
}

function updateSlotStyles() {
    document.querySelectorAll('.slot').forEach(slot => {
        const slotId = slot.dataset.slotId;
        if (slotId && components[slotId]) {
            if (components[slotId].placed) {
                slot.classList.add('filled');
                slot.classList.remove('empty');
            } else {
                slot.classList.remove('filled');
                slot.classList.add('empty');
            }
        }
    });
}

function updateRackPlacedState() {
    document.querySelectorAll('.comp-card').forEach(card => {
        const type = card.dataset.type;
        if (type && components[type] && components[type].placed) {
            card.classList.add('placed');
        } else {
            card.classList.remove('placed');
        }
    });
}

// ==================== الرسم على Canvas ====================
function drawWireSegment(ctx, x1, y1, x2, y2, active) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    
    if (active) {
        const pulse = 0.5 + Math.sin(tick * 0.06) * 0.3;
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, `rgba(0,168,212,${0.5 + pulse * 0.3})`);
        gradient.addColorStop(0.5, `rgba(46,196,232,${0.7 + pulse * 0.3})`);
        gradient.addColorStop(1, `rgba(0,168,212,${0.5 + pulse * 0.3})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 14;
        ctx.shadowColor = 'rgba(0,168,212,0.6)';
    } else {
        ctx.strokeStyle = 'rgba(148,163,184,0.3)';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 0;
    }
    
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawSeriesWires(ctx, active) {
    const order = ['battery', 'bulb', 'switch', 'resistor1', 'resistor2'];
    for (let i = 0; i < order.length - 1; i++) {
        const a = components[order[i]];
        const b = components[order[i + 1]];
        if (a.placed && b.placed) {
            drawWireSegment(ctx, a.x, a.y, b.x, b.y, active);
        }
    }
    // إغلاق الدائرة
    const first = components[order[0]];
    const last = components[order[order.length - 1]];
    if (first.placed && last.placed) {
        // سلك العودة من الأسفل
        const midY = Math.max(first.y, last.y) + 40;
        drawWireSegment(ctx, last.x, last.y, last.x, midY, active);
        drawWireSegment(ctx, last.x, midY, first.x, midY, active);
        drawWireSegment(ctx, first.x, midY, first.x, first.y, active);
    }
}

function drawParallelWires(ctx, active) {
    const bat = components.battery;
    const sw = components.switch;
    const r1 = components.resistor1;
    const bulb = components.bulb;
    const r2 = components.resistor2;
    
    if (bat.placed && sw.placed) {
        drawWireSegment(ctx, bat.x, bat.y, sw.x, sw.y, active);
    }
    
    const branchX = sw.x + 50;
    if (sw.placed) {
        drawWireSegment(ctx, sw.x, sw.y, branchX, sw.y, active);
    }
    
    // الفرع العلوي
    if (r1.placed && bulb.placed && sw.placed) {
        drawWireSegment(ctx, branchX, sw.y, r1.x, r1.y, active);
        drawWireSegment(ctx, r1.x, r1.y, bulb.x, bulb.y, active);
        
        const returnY = bulb.y + 30;
        drawWireSegment(ctx, bulb.x, bulb.y, bulb.x, returnY, active);
        drawWireSegment(ctx, bulb.x, returnY, bat.x, returnY, active);
        drawWireSegment(ctx, bat.x, returnY, bat.x, bat.y, active);
    }
    
    // الفرع السفلي
    if (r2.placed && sw.placed) {
        drawWireSegment(ctx, branchX, sw.y + 15, r2.x, r2.y, active);
        
        const returnY2 = Math.max(bulb.placed ? bulb.y + 30 : bat.y + 30, r2.y + 30);
        drawWireSegment(ctx, r2.x, r2.y, r2.x, returnY2, active);
        drawWireSegment(ctx, r2.x, returnY2, bat.x, returnY2, active);
        drawWireSegment(ctx, bat.x, returnY2, bat.x, bat.y, active);
    }
}

// ==================== الإلكترونات ====================
function getElectronPath() {
    const path = [];
    
    if (currentMode === 'series') {
        const order = ['battery', 'bulb', 'switch', 'resistor1', 'resistor2'];
        for (let name of order) {
            if (components[name].placed) {
                path.push({ x: components[name].x, y: components[name].y });
            }
        }
        // سلك العودة
        const last = order[order.length - 1];
        const first = order[0];
        if (components[last].placed && components[first].placed) {
            const midY = Math.max(components[first].y, components[last].y) + 40;
            path.push({ x: components[last].x, y: midY });
            path.push({ x: components[first].x, y: midY });
            path.push({ x: components[first].x, y: components[first].y });
        }
    } else {
        const bat = components.battery;
        const sw = components.switch;
        const r1 = components.resistor1;
        const bulb = components.bulb;
        
        if (bat.placed && sw.placed) {
            path.push({ x: bat.x, y: bat.y });
            path.push({ x: sw.x, y: sw.y });
        }
        
        const branchX = sw.x + 50;
        if (sw.placed) path.push({ x: branchX, y: sw.y });
        
        if (r1.placed && bulb.placed) {
            path.push({ x: r1.x, y: r1.y });
            path.push({ x: bulb.x, y: bulb.y });
            
            const returnY = bulb.y + 30;
            path.push({ x: bulb.x, y: returnY });
            path.push({ x: bat.x, y: returnY });
            path.push({ x: bat.x, y: bat.y });
        }
    }
    
    return path;
}

class Electron {
    constructor(path, offset) {
        this.path = path;
        this.t = offset;
        this.speed = 0.005 + Math.random() * 0.01;
        this.size = 3.5 + Math.random() * 2.5;
        this.trail = [];
    }
    
    update() {
        if (this.path.length < 2) return;
        const speedFactor = Math.min(2, current_mA / 50);
        this.t += this.speed * speedFactor;
        if (this.t >= 1) this.t -= 1;
    }
    
    draw(ctx) {
        if (this.path.length < 2) return;
        const totalLen = this.path.length;
        const idx = Math.floor(this.t * (totalLen - 1));
        const nextIdx = Math.min(idx + 1, totalLen - 1);
        const localT = (this.t * (totalLen - 1)) - idx;
        
        const x = this.path[idx].x + (this.path[nextIdx].x - this.path[idx].x) * localT;
        const y = this.path[idx].y + (this.path[nextIdx].y - this.path[idx].y) * localT;
        
        // هالة الإلكترون
        const glow = ctx.createRadialGradient(x, y, 0, x, y, this.size * 3);
        glow.addColorStop(0, 'rgba(251,191,36,0.5)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // الإلكترون
        const electronGrad = ctx.createRadialGradient(x - 0.5, y - 0.5, 0, x, y, this.size);
        electronGrad.addColorStop(0, '#fef3c7');
        electronGrad.addColorStop(0.5, '#fbbf24');
        electronGrad.addColorStop(1, '#f59e0b');
        
        ctx.fillStyle = electronGrad;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(251,191,36,0.8)';
        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function initElectrons() {
    const path = getElectronPath();
    if (path.length < 2) return;
    electrons = [];
    const count = currentMode === 'series' ? 28 : 22;
    for (let i = 0; i < count; i++) {
        electrons.push(new Electron(path, i / count));
    }
}

// ==================== رسم المكونات ====================
function drawBattery(ctx, x, y) {
    // جسم البطارية
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 22, y - 18, 44, 36, 8);
    ctx.fill();
    ctx.stroke();
    
    // القطب الموجب
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(x + 18, y - 6, 8, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 11px Cairo';
    ctx.fillText('+', x + 20, y - 10);
    
    // القطب السالب
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(x - 26, y - 6, 8, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 11px Cairo';
    ctx.fillText('−', x - 24, y - 10);
    
    // تسمية
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 10px Cairo';
    ctx.fillText('9V', x - 7, y + 3);
}

function drawBulb(ctx, x, y, lit, intensity) {
    if (lit && intensity > 0) {
        // توهج
        const glowGrad = ctx.createRadialGradient(x, y - 8, 0, x, y - 8, 40 * intensity);
        glowGrad.addColorStop(0, `rgba(251,191,36,${0.7 * intensity})`);
        glowGrad.addColorStop(0.5, `rgba(245,158,11,${0.3 * intensity})`);
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(x, y - 8, 40 * intensity, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // المصباح
    const bulbColor = lit ? '#fbbf24' : '#cbd5e1';
    const bulbGrad = ctx.createRadialGradient(x - 2, y - 10, 0, x, y - 5, 20);
    bulbGrad.addColorStop(0, lit ? '#fef3c7' : '#f1f5f9');
    bulbGrad.addColorStop(1, bulbColor);
    
    ctx.fillStyle = bulbGrad;
    ctx.beginPath();
    ctx.arc(x, y - 8, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = lit ? '#f59e0b' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // القاعدة
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x - 8, y + 4, 16, 10);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(x - 8, y + 4, 16, 10);
}

function drawSwitch(ctx, x, y, closed) {
    // جسم المفتاح
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 20, y - 12, 40, 24, 6);
    ctx.fill();
    ctx.stroke();
    
    // الذراع
    ctx.fillStyle = closed ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.roundRect(x - 6, closed ? y - 22 : y - 2, 12, 22, 4);
    ctx.fill();
    ctx.strokeStyle = closed ? '#059669' : '#dc2626';
    ctx.stroke();
    
    // نقطة التوصيل
    ctx.fillStyle = closed ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.arc(x + (closed ? 16 : -16), y, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawResistor(ctx, x, y, resistance, color) {
    // جسم المقاومة
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 20, y - 14, 40, 28, 6);
    ctx.fill();
    ctx.stroke();
    
    // خطوط المقاومة
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
        const lx = x - 14 + i * 9;
        ctx.beginPath();
        ctx.moveTo(lx, y - 8);
        ctx.lineTo(lx, y + 8);
        ctx.stroke();
    }
    
    // القيمة
    ctx.fillStyle = color;
    ctx.font = 'bold 10px Cairo';
    ctx.fillText(resistance + 'Ω', x - 14, y - 16);
}

function drawComponents(ctx) {
    for (let type in components) {
        const comp = components[type];
        if (!comp.placed) continue;
        
        switch(type) {
            case 'battery':
                drawBattery(ctx, comp.x, comp.y);
                break;
            case 'bulb':
                drawBulb(ctx, comp.x, comp.y, comp.lit, comp.glowIntensity);
                break;
            case 'switch':
                drawSwitch(ctx, comp.x, comp.y, isSwitchClosed);
                break;
            case 'resistor1':
                drawResistor(ctx, comp.x, comp.y, 100, '#dc2626');
                break;
            case 'resistor2':
                drawResistor(ctx, comp.x, comp.y, 150, '#8b5cf6');
                break;
        }
    }
}

function drawBackground(ctx, w, h) {
    // خلفية
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    
    // نقاط الشبكة
    ctx.fillStyle = 'rgba(0,137,174,0.05)';
    for (let x = 35; x < w; x += 35) {
        for (let y = 35; y < h; y += 35) {
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // عنوان
    ctx.fillStyle = 'rgba(0,78,102,0.06)';
    ctx.font = 'bold 16px Cairo, sans-serif';
    ctx.textAlign = 'center';
    const title = currentMode === 'series' ? 'دائرة التوالي' : 'دائرة التوازي';
    ctx.fillText(title, w / 2, h - 12);
    ctx.textAlign = 'start';
}

function draw() {
    if (!ctx || !canvas) return;
    
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    drawBackground(ctx, w, h);
    
    const active = current_mA > 0 && isSwitchClosed && circuitComplete;
    
    if (currentMode === 'series') {
        drawSeriesWires(ctx, active);
    } else {
        drawParallelWires(ctx, active);
    }
    
    electrons.forEach(e => {
        e.update();
        e.draw(ctx);
    });
    
    drawComponents(ctx);
}

function animate() {
    tick++;
    draw();
    animationId = requestAnimationFrame(animate);
}

// ==================== الفتحات والتركيب ====================
function renderSlots() {
    const container = document.getElementById('slotsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    const slots = currentMode === 'series' ? seriesSlots : parallelSlots;
    
    const grid = document.createElement('div');
    grid.className = 'slots-grid';
    
    slots.forEach((slot, idx) => {
        const placed = components[slot.id].placed;
        const div = document.createElement('div');
        div.className = `slot ${placed ? 'filled' : 'empty'}`;
        div.dataset.slotId = slot.id;
        div.onclick = () => placeComponent(slot.id);
        
        div.innerHTML = `
            <div class="slot-number">${slot.order}</div>
            <div class="slot-icon">${placed ? slot.icon : '❓'}</div>
            <div class="slot-name">${placed ? slot.label : 'ضع ' + slot.label}</div>
        `;
        
        grid.appendChild(div);
        
        // سهم بين الفتحات في التوالي
        if (currentMode === 'series' && idx < slots.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'wire-arrow';
            arrow.innerHTML = '➡️';
            grid.appendChild(arrow);
        }
    });
    
    container.appendChild(grid);
    updateSlotStyles();
}

function placeComponent(slotId) {
    if (!selectedComponent) {
        showTip('⚠️ اختر مكوناً أولاً من الرف الأيسر.', 'warning');
        return;
    }
    
    if (components[slotId].placed) {
        showTip('⚠️ هذا المكان مشغول بالفعل!', 'warning');
        return;
    }
    
    if (selectedComponent !== slotId) {
        const slotLabel = getSlotLabel(slotId);
        showTip(`❌ هذا المكان مخصص لـ ${slotLabel}.`, 'error');
        return;
    }
    
    // تركيب المكون
    components[selectedComponent].placed = true;
    const positions = currentMode === 'series' ? seriesPositions : parallelPositions;
    if (positions[selectedComponent]) {
        components[selectedComponent].x = positions[selectedComponent].x;
        components[selectedComponent].y = positions[selectedComponent].y;
    }
    
    clearSelectedHighlight();
    renderSlots();
    updateRackPlacedState();
    calculateCircuit();
    
    const required = currentMode === 'series'
        ? ['battery', 'bulb', 'switch', 'resistor1', 'resistor2']
        : ['battery', 'switch', 'resistor1', 'bulb'];
    
    const allPlaced = required.every(id => components[id].placed);
    
    if (allPlaced) {
        showTip('🎉 أحسنت! الدائرة مكتملة. اضغط على زر تشغيل المفتاح لتشغيل التيار.', 'success');
    } else {
        showTip(`✅ تم تركيب ${getComponentName(selectedComponent)} بنجاح! استمر في تركيب باقي المكونات.`, 'success');
    }
    
    selectedComponent = null;
}

function getSlotLabel(slotId) {
    const slots = currentMode === 'series' ? seriesSlots : parallelSlots;
    const s = slots.find(s => s.id === slotId);
    return s ? s.label : slotId;
}

function getComponentName(type) {
    const names = {
        battery: 'البطارية',
        bulb: 'المصباح',
        switch: 'المفتاح',
        resistor1: 'المقاومة R₁',
        resistor2: 'المقاومة R₂'
    };
    return names[type] || type;
}

function clearSelectedHighlight() {
    selectedComponent = null;
    document.querySelectorAll('.comp-card').forEach(c => c.classList.remove('selected'));
}

function showTip(msg, type) {
    const tipDiv = document.getElementById('liveTips');
    if (!tipDiv) return;
    
    tipDiv.innerHTML = `💡 ${msg}`;
    
    const colors = {
        success: { bg: '#ecfdf5', border: '#10b981' },
        warning: { bg: '#fffbeb', border: '#f59e0b' },
        error: { bg: '#fef2f2', border: '#ef4444' },
        info: { bg: '#f0fbfe', border: '#0089ae' }
    };
    
    const color = colors[type] || colors.info;
    tipDiv.style.background = color.bg;
    tipDiv.style.borderColor = color.border;
    tipDiv.style.animation = 'none';
    tipDiv.offsetHeight;
    tipDiv.style.animation = 'tipFade 0.3s ease';
    
    setTimeout(() => {
        tipDiv.style.background = '';
        tipDiv.style.borderColor = '';
        tipDiv.innerHTML = '💡 اختر مكوناً من الرف الأيسر ثم انقر على مكانه في لوحة التوصيل.';
    }, 4000);
}

// ==================== إعداد الاختيار ====================
function setupSelection() {
    document.querySelectorAll('.comp-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            
            if (components[type].placed) {
                showTip(`⚠️ ${getComponentName(type)} مركب بالفعل في الدائرة!`, 'warning');
                return;
            }
            
            clearSelectedHighlight();
            card.classList.add('selected');
            selectedComponent = type;
            showTip(`👉 تم اختيار ${getComponentName(type)}. انقر على مكانه في لوحة التوصيل.`, 'success');
        });
    });
}

// ==================== إعادة الضبط ====================
function resetCircuit() {
    for (let k in components) {
        components[k].placed = false;
        components[k].lit = false;
        components[k].glowIntensity = 0;
    }
    components.switch.isClosed = true;
    isSwitchClosed = true;
    circuitComplete = false;
    selectedComponent = null;
    electrons = [];
    
    clearSelectedHighlight();
    renderSlots();
    updateRackPlacedState();
    calculateCircuit();
    showTip('🔄 تم مسح الدائرة بالكامل. ابدأ من جديد باختيار المكونات.', 'info');
}

// ==================== تبديل المفتاح ====================
function toggleSwitch() {
    if (!components.switch.placed) {
        showTip('⚠️ المفتاح غير مركب بعد. قم بتركيبه أولاً في مكانه المخصص.', 'warning');
        return;
    }
    
    const required = currentMode === 'series'
        ? ['battery', 'bulb', 'switch', 'resistor1', 'resistor2']
        : ['battery', 'switch', 'resistor1', 'bulb'];
    
    if (!required.every(id => components[id].placed)) {
        showTip('⚠️ أكمل تركيب جميع المكونات الأساسية أولاً.', 'warning');
        return;
    }
    
    isSwitchClosed = !isSwitchClosed;
    components.switch.isClosed = isSwitchClosed;
    electrons = [];
    calculateCircuit();
    
    if (isSwitchClosed) {
        showTip('🔌 المفتاح مغلق → التيار يسري في الدائرة ⚡', 'success');
    } else {
        showTip('⛔ المفتاح مفتوح → التيار متوقف تماماً.', 'info');
    }
}

// ==================== تغيير الوضع ====================
function changeMode(mode) {
    currentMode = mode;
    resetCircuit();
    
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.mode-btn[data-mode="${mode}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    renderSlots();
    updateComponentPositions();
    calculateCircuit();
    showTip(`🔄 تم التبديل إلى ${mode === 'series' ? 'التوصيل على التوالي' : 'التوصيل على التوازي'}. ابدأ بتركيب المكونات.`, 'info');
}

// ==================== Canvas ====================
function initCanvas() {
    canvas = document.getElementById('circuitCanvas');
    if (!canvas) {
        const container = document.querySelector('.circuit-canvas-area');
        if (container) {
            canvas = document.createElement('canvas');
            canvas.id = 'circuitCanvas';
            container.appendChild(canvas);
        }
    }
    
    if (canvas) {
        ctx = canvas.getContext('2d');
        
        function resize() {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width || 800;
            canvas.height = 420;
            updateComponentPositions();
        }
        
        resize();
        window.addEventListener('resize', () => {
            resize();
        });
        
        // تفاعل الماوس مع canvas
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            checkComponentClick(x, y);
        });
    }
}

function checkComponentClick(x, y) {
    for (let type in components) {
        const comp = components[type];
        if (!comp.placed) continue;
        
        const dx = x - comp.x;
        const dy = y - comp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 25) {
            showTip(`📌 هذا هو ${getComponentName(type)}. ${type === 'bulb' ? (comp.lit ? 'المصباح مضيء 💡' : 'المصباح مطفأ') : ''}`, 'info');
            return;
        }
    }
}

// ==================== التهيئة ====================
function init() {
    initCanvas();
    renderSlots();
    setupSelection();
    updateComponentPositions();
    updateRackPlacedState();
    
    document.getElementById('resetAllBtn')?.addEventListener('click', resetCircuit);
    document.getElementById('toggleSwitchBtn')?.addEventListener('click', toggleSwitch);
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => changeMode(btn.dataset.mode));
    });
    
    calculateCircuit();
    animate();
    
    console.log('✅ محاكاة الدائرة الكهربائية جاهزة | جميع الأنظمة تعمل بكفاءة');
}

// إضافة roundRect إذا لم يكن مدعوماً
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
        this.beginPath();
        this.moveTo(x + r.tl, y);
        this.lineTo(x + w - r.tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
        this.lineTo(x + w, y + h - r.br);
        this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
        this.lineTo(x + r.bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
        this.lineTo(x, y + r.tl);
        this.quadraticCurveTo(x, y, x + r.tl, y);
        this.closePath();
    };
}

document.addEventListener('DOMContentLoaded', init);