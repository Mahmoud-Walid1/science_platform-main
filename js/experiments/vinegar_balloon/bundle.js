/**
 * bundle.js
 * Standalone Self-Contained Script for Vinegar Balloon Experiment
 * Works natively on both file:// protocol (direct double-click) and HTTP servers.
 */

// 1. APPARATUS SVGS
const APPARATUS_SVGS = {
    bottle: (liquidLevel = 0, isCentral = false) => `
        <svg class="apparatus-svg bottle-svg" viewBox="0 0 160 380" width="100%" height="100%">
            <defs>
                <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="rgba(255,255,255,0.4)" />
                    <stop offset="15%" stop-color="rgba(220,240,255,0.2)" />
                    <stop offset="85%" stop-color="rgba(180,210,240,0.15)" />
                    <stop offset="100%" stop-color="rgba(255,255,255,0.45)" />
                </linearGradient>
                <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="rgba(245, 230, 180, 0.9)" />
                    <stop offset="50%" stop-color="rgba(250, 240, 200, 0.8)" />
                    <stop offset="100%" stop-color="rgba(240, 220, 160, 0.95)" />
                </linearGradient>
                <filter id="glassShadow" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="12" stdDeviation="8" flood-color="rgba(0,0,0,0.3)" />
                </filter>
            </defs>
            <ellipse cx="80" cy="370" rx="60" ry="8" fill="rgba(0,0,0,0.25)" />
            <g ${isCentral ? 'id="centralLiquidGroup"' : 'id="bottleLiquidGroup"'} style="opacity: ${liquidLevel > 0 ? 1 : 0}; transition: opacity 0.2s;">
                <path d="M 32 360 L 32 ${360 - liquidLevel} Q 80 ${358 - liquidLevel} 128 ${360 - liquidLevel} L 128 360 Q 80 365 32 360 Z" 
                      fill="url(#liquidGrad)" ${isCentral ? 'id="centralLiquidSurface"' : 'id="liquidSurface"'} />
                <ellipse cx="80" cy="${360 - liquidLevel}" rx="48" ry="4" fill="rgba(255,250,230,0.85)" stroke="rgba(240,220,160,0.9)" stroke-width="1" ${isCentral ? 'id="centralLiquidEllipse"' : 'id="liquidSurfaceEllipse"'} />
            </g>
            <path d="M 66 40 L 94 40 L 94 65 Q 98 75 106 88 L 126 125 Q 130 135 130 150 L 130 350 Q 130 365 110 365 L 50 365 Q 30 365 30 350 L 30 150 Q 30 135 34 125 L 54 88 Q 62 75 66 65 Z" 
                  fill="url(#glassGrad)" stroke="rgba(255,255,255,0.6)" stroke-width="2" filter="url(#glassShadow)" />
            <path d="M 30 180 Q 80 188 130 180" stroke="rgba(255,255,255,0.35)" stroke-width="2" fill="none" />
            <path d="M 30 220 Q 80 228 130 220" stroke="rgba(255,255,255,0.35)" stroke-width="2" fill="none" />
            <path d="M 30 260 Q 80 268 130 260" stroke="rgba(255,255,255,0.35)" stroke-width="2" fill="none" />
            <path d="M 30 300 Q 80 308 130 300" stroke="rgba(255,255,255,0.35)" stroke-width="2" fill="none" />
            <rect x="63" y="32" width="34" height="8" rx="2" fill="rgba(240,248,255,0.7)" stroke="#fff" stroke-width="1" />
            <path d="M 40 140 L 40 340" stroke="rgba(255,255,255,0.5)" stroke-width="4" stroke-linecap="round" />
            <path d="M 48 150 L 48 330" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-linecap="round" />
        </svg>
    `,

    funnel: () => `
        <svg class="apparatus-svg funnel-svg" viewBox="0 0 120 160" width="100%" height="100%">
            <defs>
                <linearGradient id="funnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="rgba(230,245,255,0.85)" />
                    <stop offset="30%" stop-color="rgba(190,225,245,0.5)" />
                    <stop offset="70%" stop-color="rgba(220,240,255,0.6)" />
                    <stop offset="100%" stop-color="rgba(255,255,255,0.9)" />
                </linearGradient>
            </defs>
            <ellipse cx="60" cy="18" rx="55" ry="12" fill="url(#funnelGrad)" stroke="rgba(255,255,255,0.8)" stroke-width="2" />
            <path d="M 5 18 L 54 85 L 54 150 L 66 150 L 66 85 L 115 18 Z" 
                  fill="url(#funnelGrad)" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />
            <path d="M 15 18 Q 60 26 105 18" stroke="rgba(255,255,255,0.6)" stroke-width="2" fill="none" />
            <path d="M 56 90 L 56 145" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round" />
        </svg>
    `,

    // البالون الأزرق المطاطي التفاعلي (3 وضعيات: مفرغ منبسط على الطاولة، متدلي جانباً على الزجاجة، منتفخ تدريجياً بالغاز)
    balloon: (state = 'deflated', scale = 1.0, hasSoda = false) => {
        if (state === 'deflated') {
            return `
            <svg class="apparatus-svg balloon-deflated-svg" viewBox="0 0 140 180" width="100%" height="100%">
                <defs>
                    <radialGradient id="balloonDeflatedGloss" cx="35%" cy="30%" r="65%">
                        <stop offset="0%" stop-color="#93c5fd" />
                        <stop offset="25%" stop-color="#38bdf8" />
                        <stop offset="60%" stop-color="#0284c7" />
                        <stop offset="90%" stop-color="#0369a1" />
                        <stop offset="100%" stop-color="#075985" />
                    </radialGradient>
                    <filter id="balloonDeflatedShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="rgba(2,132,199,0.35)" />
                    </filter>
                </defs>
                <!-- فوهة وعنق البالون لأعلى: حلقة مطاطية ملفوفة لاستقبال القمع -->
                <ellipse cx="70" cy="20" rx="13" ry="4.5" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5" />
                <ellipse cx="70" cy="20" rx="8" ry="2.5" fill="#0369a1" />
                <!-- كيس البالون المطاطي المفرغ تماماً وغير المنفوخ (نحيف ومسترخٍ) -->
                <path d="M 59 20 L 59 55 C 59 75, 47 98, 47 128 C 47 158, 56 168, 70 168 C 84 168, 93 158, 93 128 C 93 98, 81 75, 81 55 L 81 20 Z" 
                      fill="url(#balloonDeflatedGloss)" stroke="#0284c7" stroke-width="1.5" filter="url(#balloonDeflatedShadow)" />
                <!-- ثنايا وتجاعيد المطاط المفرغ الواقعية غير المنفوخ -->
                <path d="M 68 55 C 67 90, 68 125, 70 155" stroke="rgba(3,105,161,0.5)" stroke-width="2" stroke-linecap="round" fill="none" />
                <path d="M 54 85 C 50 110, 52 135, 58 145" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round" fill="none" />
                <!-- مسحوق البيكربونات الأبيض مستقر داخل قاع البالون المفرغ -->
                <g class="balloon-powder-fill" id="balloonPowderFill" style="display: ${hasSoda ? 'block' : 'none'};">
                    <path d="M 50 138 C 50 158, 58 166, 70 166 C 82 166, 90 158, 90 138 Q 70 144 50 138 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
                </g>
            </svg>`;
        }

        if (state === 'hanging') {
            return `
            <svg class="apparatus-svg balloon-hanging-svg" viewBox="0 0 240 330" width="100%" height="100%">
                <defs>
                    <radialGradient id="balloonHangingGloss" cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stop-color="#93c5fd" />
                        <stop offset="30%" stop-color="#38bdf8" />
                        <stop offset="70%" stop-color="#0284c7" />
                        <stop offset="100%" stop-color="#0369a1" />
                    </radialGradient>
                    <filter id="hangingShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="8" stdDeviation="6" flood-color="rgba(0,0,0,0.3)" />
                    </filter>
                </defs>
                <!-- ياقة عنق البالون مثبتة بإحكام على فوهة الزجاجة -->
                <path d="M 108 260 L 132 260 L 128 274 L 112 274 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="2" />
                <!-- كيس البالون المطاطي المفرغ متدلي تماماً لليمين قبل التفاعل -->
                <path d="M 112 260 
                         C 112 245, 120 236, 130 232 
                         C 145 226, 168 228, 185 240 
                         C 202 254, 206 276, 192 292 
                         C 176 305, 150 298, 138 280 
                         C 128 268, 128 262, 128 260 Z" 
                      fill="url(#balloonHangingGloss)" stroke="#0369a1" stroke-width="2" filter="url(#hangingShadow)" />
                <!-- ثنايا وتجاعيد المطاط المتدلي -->
                <path d="M 125 245 C 140 242, 160 248, 175 258" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" fill="none" />
                <!-- مسحوق البيكربونات مستقر داخل تجويف قاع البالون المتدلي غير المنفوخ -->
                <path d="M 160 270 Q 178 262 194 270 Q 192 288 178 296 Q 164 288 160 270 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.2" />
                <ellipse cx="177" cy="272" rx="14" ry="4" fill="#f8fafc" />
                <circle cx="173" cy="275" r="1.2" fill="#cbd5e1" />
                <circle cx="181" cy="277" r="1.2" fill="#cbd5e1" />
                <circle cx="176" cy="283" r="1" fill="#e2e8f0" />
            </svg>`;
        }

        const rx = 55 * scale;
        const ry = 62 * scale;
        return `
        <svg class="apparatus-svg balloon-svg" viewBox="0 0 240 330" width="100%" height="100%">
            <defs>
                <radialGradient id="blueBalloonGrad" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stop-color="#bae6fd" />
                    <stop offset="20%" stop-color="#38bdf8" />
                    <stop offset="60%" stop-color="#0284c7" />
                    <stop offset="90%" stop-color="#0369a1" />
                    <stop offset="100%" stop-color="#075985" />
                </radialGradient>
                <filter id="balloonShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="rgba(3,105,161,0.45)" />
                </filter>
            </defs>
            <!-- ياقة عنق البالون على فوهة الزجاجة -->
            <path d="M 108 260 L 132 260 L 128 274 L 112 274 Z" fill="#0284c7" stroke="#075985" stroke-width="2" />
            <path d="M 112 260 L 128 260 L ${120 + Math.max(8, rx * 0.35)} 235 L ${120 - Math.max(8, rx * 0.35)} 235 Z" fill="#0284c7" />
            <!-- جسم البالون المنتفخ تدريجياً لأعلى -->
            <ellipse class="balloon-bulb-ellipse" cx="120" cy="${235 - ry}" rx="${Math.max(6, rx)}" ry="${Math.max(8, ry)}" 
                     fill="url(#blueBalloonGrad)" stroke="rgba(255,255,255,0.5)" stroke-width="2" filter="url(#balloonShadow)" />
            <ellipse class="balloon-bulb-shine" cx="${120 - rx * 0.35}" cy="${(235 - ry) - ry * 0.35}" rx="${Math.max(2, rx * 0.28)}" ry="${Math.max(3, ry * 0.2)}" 
                     fill="rgba(255,255,255,0.65)" transform="rotate(-25, ${120 - rx * 0.35}, ${(235 - ry) - ry * 0.35})" />
        </svg>`;
    },

    spoon: (hasPowder = true) => `
        <svg class="apparatus-svg spoon-svg" viewBox="0 0 160 80" width="100%" height="100%">
            <defs>
                <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#e2e8f0" />
                    <stop offset="50%" stop-color="#94a3b8" />
                    <stop offset="80%" stop-color="#cbd5e1" />
                    <stop offset="100%" stop-color="#64748b" />
                </linearGradient>
                <linearGradient id="spoonPowderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="50%" stop-color="#f8fafc" />
                    <stop offset="85%" stop-color="#f1f5f9" />
                    <stop offset="100%" stop-color="#cbd5e1" />
                </linearGradient>
                <filter id="powderHeapShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(15,23,42,0.3)" />
                </filter>
            </defs>
            <!-- Spoon handle -->
            <path d="M 45 40 Q 110 32 155 35 Q 158 45 155 48 Q 110 42 45 44 Z" 
                  fill="url(#metalGrad)" stroke="#475569" stroke-width="1" />
            <!-- Spoon bowl -->
            <ellipse cx="32" cy="42" rx="28" ry="18" fill="url(#metalGrad)" stroke="#475569" stroke-width="1.5" />
            <!-- Inner scoop highlight -->
            <ellipse cx="32" cy="42" rx="24" ry="14" fill="#f8fafc" opacity="0.35" />
            ${hasPowder ? `
            <!-- كومة مسحوق بيكربونات الصوديوم البيضاء الواضحة والمرتفعة جداً داخل الملعقة -->
            <g class="spoon-powder-heap" filter="url(#powderHeapShadow)">
                <!-- التل الهرمي لمسحوق البيكربونات -->
                <path d="M 8 42 C 8 22, 18 10, 32 10 C 46 10, 56 22, 56 42 C 56 53, 44 57, 32 57 C 20 57, 8 53, 8 42 Z" 
                      fill="url(#spoonPowderGrad)" stroke="#94a3b8" stroke-width="1.3" />
                <!-- لمعان قمة المسحوق الأبيض الناصع -->
                <ellipse cx="32" cy="22" rx="16" ry="8" fill="#ffffff" />
                <path d="M 20 22 Q 32 13 44 22" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none" />
                <!-- حبيبات وتدرجات المسحوق المخبري البودري -->
                <circle cx="23" cy="30" r="1.5" fill="#cbd5e1" />
                <circle cx="37" cy="27" r="1.8" fill="#cbd5e1" />
                <circle cx="31" cy="38" r="1.6" fill="#94a3b8" opacity="0.7" />
                <circle cx="43" cy="36" r="1.5" fill="#cbd5e1" />
                <circle cx="19" cy="38" r="1.5" fill="#cbd5e1" />
            </g>
            ` : ''}
        </svg>
    `,

    vinegarBottle: (fillRatio = 1.0) => {
        const topY = 200 - Math.max(12, 75 * Math.max(0, Math.min(1, fillRatio)));
        return `
        <svg class="apparatus-svg reagent-svg" viewBox="0 0 120 220" width="100%" height="100%">
            <defs>
                <linearGradient id="amberLiquid" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="rgba(245, 230, 180, 0.85)" />
                    <stop offset="60%" stop-color="rgba(250, 240, 200, 0.7)" />
                    <stop offset="100%" stop-color="rgba(240, 220, 160, 0.9)" />
                </linearGradient>
            </defs>
            <ellipse cx="60" cy="18" rx="14" ry="7" fill="rgba(220,240,250,0.8)" stroke="#fff" stroke-width="1" />
            <rect x="52" y="18" width="16" height="14" rx="2" fill="rgba(200,230,245,0.8)" />
            <rect x="48" y="32" width="24" height="28" fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.7)" />
            <path d="M 48 60 Q 20 85 20 120 L 20 200 Q 20 215 60 215 Q 100 215 100 200 L 100 120 Q 100 85 72 60 Z" 
                  fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.6)" stroke-width="2" />
            <path id="vinegarBottleLiquidPath" d="M 23 ${topY} Q 60 ${topY + 5} 97 ${topY} L 97 200 Q 60 212 23 200 Z" fill="url(#amberLiquid)" style="opacity: ${fillRatio > 0.05 ? 1 : 0}; transition: opacity 0.2s;" />
            <rect x="35" y="140" width="50" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
            <text x="60" y="156" font-size="10" font-family="Cairo, sans-serif" font-weight="bold" fill="#0f172a" text-anchor="middle">خل</text>
            <text x="60" y="172" font-size="8" font-family="Arial, sans-serif" fill="#64748b" text-anchor="middle">CH₃COOH</text>
        </svg>
    `;
    },

    bakingSodaBowl: () => `
        <svg class="apparatus-svg bowl-svg" viewBox="0 0 160 110" width="100%" height="100%">
            <defs>
                <linearGradient id="bowlGlass" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="rgba(255,255,255,0.6)" />
                    <stop offset="50%" stop-color="rgba(220,240,255,0.3)" />
                    <stop offset="100%" stop-color="rgba(255,255,255,0.7)" />
                </linearGradient>
            </defs>
            <ellipse cx="80" cy="98" rx="60" ry="10" fill="rgba(0,0,0,0.2)" />
            <path d="M 15 45 Q 25 100 80 100 Q 135 100 145 45 Z" 
                  fill="url(#bowlGlass)" stroke="rgba(255,255,255,0.7)" stroke-width="2" />
            <path d="M 22 46 Q 80 15 138 46 Q 80 58 22 46 Z" fill="#ffffff" stroke="#f1f5f9" stroke-width="1" />
            <ellipse cx="80" cy="40" rx="35" ry="10" fill="#f8fafc" />
            <ellipse cx="80" cy="45" rx="65" ry="12" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" />
            <!-- Label -->
            <rect x="42" y="60" width="76" height="28" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
            <text x="80" y="73" font-size="8.5" font-family="Cairo, sans-serif" font-weight="bold" fill="#0f172a" text-anchor="middle">بيكربونات الصوديوم</text>
            <text x="80" y="83" font-size="7.5" font-family="Arial, sans-serif" fill="#64748b" text-anchor="middle">NaHCO₃</text>
        </svg>
    `
};

// 2. SOUND MANAGER
class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.fizzSource = null;
        this.fizzGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted && this.fizzGain && this.ctx) {
            this.fizzGain.gain.setValueAtTime(0, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    playClick() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playPourLiquid(duration = 2.4) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin(i / 14);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(500, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1350, this.ctx.currentTime + duration);
        filter.Q.value = 3.5;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.28, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.28, this.ctx.currentTime + duration - 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
        noise.stop(this.ctx.currentTime + duration);
    }

    playPourPowder(duration = 1.0) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2500, this.ctx.currentTime);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
        noise.stop(this.ctx.currentTime + duration);
    }

    startFizz() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx || this.fizzSource) return;
        const bufferSize = this.ctx.sampleRate * 4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        this.fizzSource = this.ctx.createBufferSource();
        this.fizzSource.buffer = buffer;
        this.fizzSource.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        filter.Q.value = 1.2;
        this.fizzGain = this.ctx.createGain();
        this.fizzGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        this.fizzGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.4);
        this.fizzSource.connect(filter);
        filter.connect(this.fizzGain);
        this.fizzGain.connect(this.ctx.destination);
        this.fizzSource.start();
    }

    stopFizz() {
        if (this.fizzGain && this.ctx) {
            this.fizzGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
            setTimeout(() => {
                if (this.fizzSource) {
                    try { this.fizzSource.stop(); } catch(e) {}
                    this.fizzSource = null;
                }
                this.fizzGain = null;
            }, 650);
        }
    }

    playBalloonInflate(duration = 2.5) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(220, this.ctx.currentTime + duration);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(700, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playSuccess() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const startTime = this.ctx.currentTime + (idx * 0.1);
            gain.gain.setValueAtTime(0.01, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.36);
        });
    }
}
const soundManager = new SoundManager();

// 3. VARIABLE MANAGER
class VariableManager {
    constructor() {
        this.vinegarVolume = 100;
        this.bakingSodaSpoons = 2;
        this.listeners = [];
    }

    setVinegar(vol) {
        this.vinegarVolume = Number(vol);
        this.notify();
    }

    setSodaSpoons(spoons) {
        this.bakingSodaSpoons = Number(spoons);
        this.notify();
    }

    getCalculation() {
        const vinegarMoles = (this.vinegarVolume / 1000) * 0.85; 
        const sodaMoles = (this.bakingSodaSpoons * 5.0) / 84.0;
        const co2Moles = Math.min(vinegarMoles, sodaMoles);
        const co2VolumeLiters = (co2Moles * 24.5).toFixed(2);
        const baseFactor = (this.vinegarVolume / 100) * 0.6 + (this.bakingSodaSpoons / 2) * 0.6;
        const balloonScale = Math.min(1.85, Math.max(0.65, baseFactor));

        return {
            co2Liters: co2VolumeLiters,
            scale: balloonScale,
            liquidHeightPx: Math.min(130, 40 + (this.vinegarVolume / 150) * 80)
        };
    }

    subscribe(fn) { this.listeners.push(fn); }
    notify() {
        const data = this.getCalculation();
        this.listeners.forEach(fn => fn(data));
    }
}
const variableManager = new VariableManager();

// 4. REACTION ENGINE
class ReactionEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animId = null;
        this.isReacting = false;
        this.progress = 0;
        this.onCompleteCallback = null;
    }

    init(canvasId = 'bubblesCanvas') {
        this.canvas = document.getElementById(canvasId);
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width || 120;
        this.canvas.height = rect.height || 260;
    }

    startReaction(onComplete) {
        if (this.isReacting) return;
        this.isReacting = true;
        this.progress = 0;
        this.onCompleteCallback = onComplete;

        soundManager.startFizz();
        soundManager.playBalloonInflate(3.2);

        this.createParticles();
        this.animate();
    }

    createParticles() {
        if (!this.canvas) return;
        const count = 75;
        this.particles = [];
        const w = this.canvas.width;
        const h = this.canvas.height;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: w * 0.28 + Math.random() * (w * 0.44),
                y: h * 0.70 + Math.random() * (h * 0.28),
                radius: Math.random() * 3.5 + 1.2,
                speedY: Math.random() * 2.5 + 1.5,
                driftX: (Math.random() - 0.5) * 0.8
            });
        }
    }

    animate() {
        if (!this.isReacting) return;
        this.animId = requestAnimationFrame(() => this.animate());
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        this.progress += 0.006;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        for (let p of this.particles) {
            p.y -= p.speedY;
            p.x += p.driftX;
            if (p.y < h * 0.65 && this.progress < 0.9) {
                p.y = h * 0.95 + Math.random() * 10;
                p.x = w * 0.3 + Math.random() * (w * 0.4);
            }
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        const calc = variableManager.getCalculation();
        const startScale = 0.12;
        const currentScale = startScale + (calc.scale - startScale) * Math.min(1.0, Math.pow(this.progress, 1.15));
        const balloonSlot = document.getElementById('activeBalloonSlot');
        if (balloonSlot) {
            balloonSlot.innerHTML = APPARATUS_SVGS.balloon('upright', currentScale);
        }

        if (this.progress >= 1.0) this.finishReaction();
    }

    finishReaction() {
        this.isReacting = false;
        if (this.animId) cancelAnimationFrame(this.animId);
        soundManager.stopFizz();
        soundManager.playSuccess();
        if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.onCompleteCallback) this.onCompleteCallback();
    }

    reset() {
        this.isReacting = false;
        this.progress = 0;
        if (this.animId) cancelAnimationFrame(this.animId);
        soundManager.stopFizz();
        if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
const reactionEngine = new ReactionEngine();

// 5. DRAG & DROP ENGINE
class DragDropEngine {
    constructor() {
        this.currentDrag = null;
        this.startX = 0;
        this.startY = 0;
        this.state = {
            step: 1,
            funnelLocation: 'bench',
            vinegarInBottle: false,
            sodaInBalloon: false,
            sodaOnSpoon: false,
            balloonAttached: false,
            reactionDone: false
        };
        this.listeners = [];
    }

    init() {
        this.bindDraggables();
    }

    subscribe(fn) { this.listeners.push(fn); }
    notifyState() { this.listeners.forEach(fn => fn(this.state)); }

    bindDraggables() {
        const draggables = document.querySelectorAll('.draggable-item');
        draggables.forEach(el => {
            el.addEventListener('mousedown', (e) => this.onDragStart(e, el));
            el.addEventListener('touchstart', (e) => this.onDragStart(e, el), { passive: false });
        });

        window.addEventListener('mousemove', (e) => this.onDragMove(e));
        window.addEventListener('touchmove', (e) => this.onDragMove(e), { passive: false });
        window.addEventListener('mouseup', (e) => this.onDragEnd(e));
        window.addEventListener('touchend', (e) => this.onDragEnd(e));
    }

    onDragStart(e, element) {
        if (e.type === 'touchstart') e.preventDefault();
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        this.currentDrag = element;
        this.startX = clientX;
        this.startY = clientY;

        let tx = 0, ty = 0;
        if (window.getComputedStyle) {
            const style = window.getComputedStyle(element);
            const transform = style.transform || style.webkitTransform;
            if (transform && transform !== 'none') {
                try {
                    const matrix = new DOMMatrix(transform);
                    tx = matrix.m41;
                    ty = matrix.m42;
                } catch (err) {}
            }
        }
        this.initialTranslateX = tx;
        this.initialTranslateY = ty;

        element.classList.add('is-dragging');
        soundManager.playClick();
        this.highlightSnapTargets(element.dataset.tool);
    }

    onDragMove(e) {
        if (!this.currentDrag) return;
        if (e.type === 'touchmove') e.preventDefault();
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        const deltaX = this.initialTranslateX + (clientX - this.startX);
        const deltaY = this.initialTranslateY + (clientY - this.startY);
        this.currentDrag.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.08)`;
    }

    onDragEnd(e) {
        if (!this.currentDrag) return;
        const draggedEl = this.currentDrag;
        this.currentDrag = null;
        draggedEl.classList.remove('is-dragging');

        const clientX = e.type === 'touchend' && e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.type === 'touchend' && e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        const matchedTarget = this.checkDropTarget(clientX, clientY, draggedEl.dataset.tool);
        this.clearSnapTargets();

        let handled = false;
        if (matchedTarget) {
            handled = this.handleSuccessfulDrop(draggedEl.dataset.tool, matchedTarget);
        }

        if (!handled) {
            draggedEl.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
            draggedEl.style.transform = `translate(${this.initialTranslateX}px, ${this.initialTranslateY}px)`;
            setTimeout(() => { draggedEl.style.transition = ''; }, 300);
        }
    }

    checkDropTarget(x, y, toolType) {
        // Proximity detection for bottle mouth (radius 110px)
        const bottleMouth = document.getElementById('targetBottleMouth') || document.getElementById('centralBottleContainer');
        if (bottleMouth) {
            const rect = bottleMouth.getBoundingClientRect();
            const targetCenterX = rect.left + rect.width / 2;
            const targetCenterY = rect.top + 35;
            const dist = Math.hypot(x - targetCenterX, y - targetCenterY);
            if (dist < 110) {
                return 'bottleMouth';
            }
        }

        // Proximity detection for balloon mouth (radius 85px to prevent false triggers)
        const balloonMouth = document.getElementById('targetBalloonMouth') || document.getElementById('tableBalloonContainer');
        if (balloonMouth) {
            const rect = balloonMouth.getBoundingClientRect();
            const targetCenterX = rect.left + rect.width / 2;
            const targetCenterY = rect.top + 30;
            const dist = Math.hypot(x - targetCenterX, y - targetCenterY);
            if (dist < 85) {
                return 'balloonMouth';
            }
        }

        if (toolType === 'spoon') {
            const bowl = document.getElementById('tableSodaBowlContainer');
            if (bowl) {
                const rect = bowl.getBoundingClientRect();
                const targetCenterX = rect.left + rect.width / 2;
                const targetCenterY = rect.top + rect.height / 2;
                const dist = Math.hypot(x - targetCenterX, y - targetCenterY);
                if (dist < 130) {
                    return 'sodaBowl';
                }
            }
        }

        return null;
    }

    highlightSnapTargets(toolType) {}

    clearSnapTargets() {}

    getBaseRect(el) {
        let tx = 0, ty = 0;
        if (window.getComputedStyle) {
            const style = window.getComputedStyle(el);
            const transform = style.transform || style.webkitTransform;
            if (transform && transform !== 'none') {
                try {
                    const matrix = new DOMMatrix(transform);
                    tx = matrix.m41;
                    ty = matrix.m42;
                } catch (e) {
                    const match = transform.match(/matrix.*\((.+)\)/);
                    if (match) {
                        const parts = match[1].split(',').map(s => parseFloat(s.trim()));
                        if (parts.length >= 6) {
                            tx = parts[4];
                            ty = parts[5];
                        }
                    }
                }
            }
        }
        const rect = el.getBoundingClientRect();
        return {
            left: rect.left - tx,
            top: rect.top - ty,
            width: rect.width,
            height: rect.height
        };
    }

    moveFunnelToBottle() {
        const funnelEl = document.getElementById('tableFunnelContainer');
        const bottleMouth = document.getElementById('targetBottleMouth') || document.getElementById('centralBottleContainer');
        if (funnelEl && bottleMouth) {
            const fBase = this.getBaseRect(funnelEl);
            const bRect = bottleMouth.getBoundingClientRect();

            const deltaX = (bRect.left + bRect.width / 2) - (fBase.left + fBase.width / 2);
            const deltaY = (bRect.top + 18) - fBase.top;

            funnelEl.style.zIndex = '40';
            funnelEl.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
            funnelEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            this.state.funnelLocation = 'bottle';
        }
    }

    moveFunnelToBalloon() {
        const funnelEl = document.getElementById('tableFunnelContainer');
        const balloonEl = document.getElementById('tableBalloonContainer');
        if (funnelEl && balloonEl) {
            const fBase = this.getBaseRect(funnelEl);
            const blRect = balloonEl.getBoundingClientRect();

            const deltaX = (blRect.left + blRect.width / 2) - (fBase.left + fBase.width / 2);
            const deltaY = (blRect.top - 65) - fBase.top;

            funnelEl.style.zIndex = '40';
            funnelEl.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
            funnelEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            this.state.funnelLocation = 'balloon';
        }
    }

    returnFunnelToBench() {
        const funnelEl = document.getElementById('tableFunnelContainer');
        if (funnelEl) {
            funnelEl.style.transition = 'transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)';
            funnelEl.style.transform = 'translate(0px, 0px)';
            setTimeout(() => {
                funnelEl.style.zIndex = '';
            }, 650);
        }
        this.state.funnelLocation = 'bench';
    }

    handleSuccessfulDrop(toolType, targetId) {
        if (toolType === 'funnel' && !this.state.vinegarInBottle) {
            this.moveFunnelToBottle();
            soundManager.playClick();
            this.notifyState();
            return true;
        }
        else if (toolType === 'vinegar' && targetId === 'bottleMouth' && !this.state.vinegarInBottle) {
            if (this.state.funnelLocation !== 'bottle') {
                this.moveFunnelToBottle();
                this.notifyState();
                setTimeout(() => { this.executeVinegarPour(); }, 400);
            } else {
                this.executeVinegarPour();
            }
            return true;
        }
        else if (toolType === 'funnel' && this.state.vinegarInBottle && !this.state.sodaInBalloon) {
            this.moveFunnelToBalloon();
            soundManager.playClick();
            this.notifyState();
            return true;
        }
        else if (toolType === 'spoon' && targetId === 'sodaBowl' && !this.state.sodaInBalloon) {
            this.executeScoopFromBowl();
            return true;
        }
        else if (toolType === 'spoon' && targetId === 'balloonMouth' && !this.state.sodaInBalloon) {
            if (this.state.sodaOnSpoon && this.state.funnelLocation === 'balloon') {
                this.executeSodaScoop();
                return true;
            }
            return false;
        }
        else if (toolType === 'balloon' && targetId === 'bottleMouth' && this.state.sodaInBalloon) {
            this.state.balloonAttached = true;
            this.state.step = 3;
            soundManager.playClick();
            this.notifyState();
            return true;
        }

        return false;
    }

    executeVinegarPour() {
        const vinegarEl = document.getElementById('tableVinegarContainer');
        const bottleFunnel = document.getElementById('tableFunnelContainer') || document.getElementById('targetBottleMouth') || document.getElementById('centralBottleContainer');
        const pourAnim = document.getElementById('vinegarPourAnimation');
        const volumeBadge = document.getElementById('vinegarVolumeBadge');

        if (vinegarEl && bottleFunnel) {
            const vBase = this.getBaseRect(vinegarEl);
            const fRect = bottleFunnel.getBoundingClientRect();

            const mouthBaseX = vBase.left + 45;
            const mouthBaseY = vBase.top + 15;

            const funnelRimX = fRect.left + fRect.width / 2;
            const funnelRimY = fRect.top + 15;

            const deltaX = (funnelRimX - 20) - mouthBaseX;
            const deltaY = (funnelRimY - 10) - mouthBaseY;

            vinegarEl.style.transformOrigin = '45px 15px';
            vinegarEl.style.zIndex = '60';
            vinegarEl.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)';
            vinegarEl.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(52deg) scale(1.1)`;
        }

        setTimeout(() => {
            const calc = variableManager.getCalculation();
            const targetLiquidHeight = calc.liquidHeightPx || 70;
            const targetMl = variableManager.vinegarVolume || 100;
            const duration = 2500;

            soundManager.playPourLiquid(2.5);
            if (pourAnim) pourAnim.classList.add('active-pouring');

            if (volumeBadge) {
                volumeBadge.textContent = '0 مل';
                volumeBadge.style.display = 'block';
                volumeBadge.style.opacity = '1';
            }

            const bottleHousing = document.getElementById('centralBottleContainer');
            if (bottleHousing && !bottleHousing.querySelector('#centralLiquidSurface')) {
                bottleHousing.innerHTML = APPARATUS_SVGS.bottle(0, true);
            }

            const bottleLiquidGroup = document.getElementById('centralLiquidGroup') || (bottleHousing && bottleHousing.querySelector('#bottleLiquidGroup'));
            const liquidSurface = document.getElementById('centralLiquidSurface') || (bottleHousing && bottleHousing.querySelector('#liquidSurface'));
            const liquidSurfaceEllipse = document.getElementById('centralLiquidEllipse') || (bottleHousing && bottleHousing.querySelector('#liquidSurfaceEllipse'));
            const vinegarLiquidPath = vinegarEl ? vinegarEl.querySelector('#vinegarBottleLiquidPath') : null;

            if (bottleLiquidGroup) {
                bottleLiquidGroup.style.opacity = '1';
            }

            const startTime = performance.now();

            const animatePourFrame = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(1, Math.max(0, elapsed / duration));
                const ease = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                const currentH = targetLiquidHeight * ease;
                const currentMl = Math.round(targetMl * ease);

                if (liquidSurface) {
                    const y = 360 - currentH;
                    const wobble = progress < 1 ? Math.sin(now * 0.018) * 2.2 : 0;
                    liquidSurface.setAttribute('d', `M 32 360 L 32 ${y} Q 80 ${y - 2 + wobble} 128 ${y} L 128 360 Q 80 365 32 360 Z`);
                }
                if (liquidSurfaceEllipse) {
                    const y = 360 - currentH;
                    liquidSurfaceEllipse.setAttribute('cy', y);
                }

                if (vinegarLiquidPath) {
                    const fillRatio = 1.0 - (ease * 0.72);
                    const vTopY = 200 - Math.max(12, 75 * fillRatio);
                    vinegarLiquidPath.setAttribute('d', `M 23 ${vTopY} Q 60 ${vTopY + 5} 97 ${vTopY} L 97 200 Q 60 212 23 200 Z`);
                }

                if (volumeBadge) {
                    volumeBadge.textContent = `${currentMl} مل`;
                }

                if (progress < 1) {
                    requestAnimationFrame(animatePourFrame);
                } else {
                    if (pourAnim) pourAnim.classList.remove('active-pouring');

                    setTimeout(() => {
                        if (vinegarEl) {
                            vinegarEl.style.transition = 'transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)';
                            vinegarEl.style.transform = 'translate(0px, 0px) rotate(0deg) scale(1)';
                            setTimeout(() => { vinegarEl.style.zIndex = ''; }, 650);
                        }

                        this.returnFunnelToBench();

                        if (volumeBadge) {
                            setTimeout(() => {
                                volumeBadge.style.opacity = '0';
                                setTimeout(() => { volumeBadge.style.display = 'none'; }, 300);
                            }, 1200);
                        }

                        this.state.vinegarInBottle = true;
                        this.state.step = 2;
                        soundManager.playSuccess();
                        this.notifyState();
                    }, 350);
                }
            };

            requestAnimationFrame(animatePourFrame);
        }, 350);
    }

    executeScoopFromBowl() {
        const spoonEl = document.getElementById('tableSpoonContainer');
        const bowlEl = document.getElementById('tableSodaBowlContainer');

        if (spoonEl && bowlEl) {
            const sBase = this.getBaseRect(spoonEl);
            const bRect = bowlEl.getBoundingClientRect();

            const deltaX = (bRect.left + bRect.width / 2 - 35) - (sBase.left + 30);
            const deltaY = (bRect.top + 30) - (sBase.top + 35);

            spoonEl.style.zIndex = '60';
            spoonEl.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
            spoonEl.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(-15deg)`;
        }

        soundManager.playPourPowder(0.7);

        setTimeout(() => {
            this.state.sodaOnSpoon = true;
            const spoonEl = document.getElementById('tableSpoonContainer');
            if (spoonEl) {
                spoonEl.innerHTML = APPARATUS_SVGS.spoon(true);
            }
            soundManager.playClick();
            this.notifyState();
        }, 350);
    }

    executeSodaScoop() {
        const spoonEl = document.getElementById('tableSpoonContainer');
        const balloonFunnel = document.getElementById('tableFunnelContainer') || document.getElementById('targetBalloonMouth') || document.getElementById('tableBalloonContainer');
        const scoopAnim = document.getElementById('sodaPourAnimation');

        if (spoonEl && balloonFunnel) {
            const sBase = this.getBaseRect(spoonEl);
            const bRect = balloonFunnel.getBoundingClientRect();

            const spoonBowlBaseX = sBase.left + 30;
            const spoonBowlBaseY = sBase.top + 35;

            const targetX = bRect.left + bRect.width / 2;
            const targetY = bRect.top + 10;

            const deltaX = targetX - spoonBowlBaseX;
            const deltaY = targetY - spoonBowlBaseY;

            spoonEl.style.transformOrigin = '30px 35px';
            spoonEl.style.zIndex = '60';
            spoonEl.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)';
            spoonEl.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(-40deg) scale(1.15)`;
        }

        soundManager.playPourPowder(1.4);
        if (scoopAnim) scoopAnim.classList.add('active-pouring');

        setTimeout(() => {
            if (scoopAnim) scoopAnim.classList.remove('active-pouring');
            
            const powderFill = document.getElementById('balloonPowderFill');
            if (powderFill) powderFill.style.display = 'block';

            this.state.sodaOnSpoon = false;
            if (spoonEl) {
                spoonEl.innerHTML = APPARATUS_SVGS.spoon(false);
                spoonEl.style.transition = 'transform 0.6s ease';
                spoonEl.style.transform = 'translate(0px, 0px) rotate(0deg) scale(1)';
                setTimeout(() => { spoonEl.style.zIndex = ''; }, 600);
            }

            // إرجاع القمع لمكانه على الطاولة فور انتهاء مهمته بالضبط مثل الملعقة والخل
            this.returnFunnelToBench();

            this.state.sodaInBalloon = true;
            this.state.step = 3;
            soundManager.playSuccess();
            this.notifyState();
        }, 1500);
    }

    triggerReaction() {
        if (!this.state.balloonAttached || this.state.reactionDone) return;
        this.state.step = 4;

        // وضع البالون رأسياً لكن مفرغ تماماً وغير منفوخ في البداية
        const activeBalloonSlot = document.getElementById('activeBalloonSlot');
        if (activeBalloonSlot) {
            activeBalloonSlot.innerHTML = APPARATUS_SVGS.balloon('upright', 0.12);
        }

        soundManager.playPourPowder(0.8);

        // بعد لحظة سقوط المسحوق يبدأ فوران الغاز وتصاعده وانتفاخ البالون تدريجياً
        setTimeout(() => {
            reactionEngine.startReaction(() => {
                this.state.reactionDone = true;
                this.notifyState();
            });
        }, 500);

        this.notifyState();
    }

    resetAll() {
        this.state = {
            step: 1,
            funnelLocation: 'bench',
            vinegarInBottle: false,
            sodaInBalloon: false,
            sodaOnSpoon: false,
            balloonAttached: false,
            reactionDone: false
        };

        const powderFill = document.getElementById('balloonPowderFill');
        if (powderFill) powderFill.style.display = 'none';

        const spoonEl = document.getElementById('tableSpoonContainer');
        if (spoonEl) {
            spoonEl.innerHTML = APPARATUS_SVGS.spoon(false);
            spoonEl.style.transform = 'translate(0px, 0px)';
        }

        const vinegarContainer = document.getElementById('tableVinegarContainer');
        if (vinegarContainer) {
            vinegarContainer.innerHTML = APPARATUS_SVGS.vinegarBottle(1.0);
        }

        const volumeBadge = document.getElementById('vinegarVolumeBadge');
        if (volumeBadge) {
            volumeBadge.style.display = 'none';
            volumeBadge.style.opacity = '0';
            volumeBadge.textContent = '0 مل';
        }

        ['tableVinegarContainer', 'tableFunnelContainer', 'tableBalloonContainer'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.transform = 'translate(0px, 0px)';
                el.style.display = 'block';
            }
        });

        reactionEngine.reset();
        this.notifyState();
    }
}
const dragDropEngine = new DragDropEngine();

// 6. QUIZ ENGINE
class QuizEngine {
    init() {
        document.querySelectorAll('.obs-option-input').forEach(opt => {
            opt.addEventListener('change', (e) => this.checkObservation(e.target.value));
        });
        const quizBtn = document.getElementById('btnSubmitQuantityQuiz');
        if (quizBtn) {
            quizBtn.addEventListener('click', () => {
                const selected = document.querySelector('input[name="quantity_q1"]:checked');
                const resultDiv = document.getElementById('quantityQuizResult');
                if (!selected || !resultDiv) return;
                if (selected.value === 'increases') {
                    soundManager.playSuccess();
                    resultDiv.className = 'quiz-res correct';
                    resultDiv.innerHTML = '<i class="fas fa-check"></i> أحسنت! كلما زادت كمية المتفاعلات (الخل والبيكربونات) زادت كمية الغاز الناتجة (مولات CO₂) وبالتالي يزداد تمدد البالون.';
                } else {
                    soundManager.playClick();
                    resultDiv.className = 'quiz-res incorrect';
                    resultDiv.innerHTML = '<i class="fas fa-times"></i> إجابة غير صحيحة. زيادة المواد المتفاعلة تعطي نواتج أكثر من غاز ثاني أكسيد الكربون.';
                }
                resultDiv.style.display = 'block';
            });
        }
    }

    checkObservation(value) {
        const feedbackBox = document.getElementById('obsFeedbackBox');
        if (!feedbackBox) return;
        if (value === 'gas') {
            soundManager.playSuccess();
            feedbackBox.className = 'obs-feedback correct-feedback';
            feedbackBox.innerHTML = `
                <div class="feedback-title"><i class="fas fa-check-circle"></i> إجابة صحيحة وملاحظة دقيقة!</div>
                <div class="feedback-desc">التفسير العلمي: تفاعل حمض الخليك (الأسيتيك) مع بيكربونات الصوديوم يؤدي لتحرير فوري لغاز ثاني أكسيد الكربون (CO₂)، وهو ما شكّل الفقاعات وتصاعد ليملأ تجويف البالون ويؤدي لانتفاخه.</div>
            `;
        } else {
            soundManager.playClick();
            feedbackBox.className = 'obs-feedback incorrect-feedback';
            feedbackBox.innerHTML = `
                <div class="feedback-title"><i class="fas fa-times-circle"></i> ملاحظة غير دقيقة، حاول مجدداً!</div>
                <div class="feedback-desc">${value === 'color' ? 'لم يحدث تغير ملحوظ في لون السائل الشفاف.' : 'لم يتكوّن راسب صلب؛ بل حدث فوران وتصاعد لغاز ثاني أكسيد الكربون.'}</div>
            `;
        }
        feedbackBox.style.display = 'block';
    }

    reset() {
        document.querySelectorAll('.obs-option-input').forEach(opt => opt.checked = false);
        const feedbackBox = document.getElementById('obsFeedbackBox');
        if (feedbackBox) feedbackBox.style.display = 'none';
    }
}
const quizEngine = new QuizEngine();

// 7. UI OVERLAY
class UIOverlay {
    constructor() {
        this.stepDescriptions = {
            1: {
                title: '1. إضافة الخل إلى الزجاجة',
                desc: 'اسحب القمع وضعه على فوهة الزجاجة، ثم اسكب كمية الخل عبر القمع.',
                btnText: 'اسكب الخل عبر القمع'
            },
            2: {
                title: '2. وضع البيكربونات في البالون',
                desc: '1. ضع القمع على فوهة البالون. 2. اغرف مسحوق البيكربونات بالملعقة. 3. اسكب المسحوق عبر القمع داخل البالون.',
                btnText: 'أضف البيكربونات إلى البالون'
            },
            3: {
                title: '3. تثبيت البالون وبدء التفاعل',
                desc: 'اسحب البالون وثبته على فوهة الزجاجة، ثم اضغط على زر "ابدأ التفاعل" لمزج المسحوق مع الخل.',
                btnText: 'ابدأ التفاعل'
            },
            4: {
                title: '4. اكتمال التفاعل وتصاعد الغاز',
                desc: 'لاحظ فوران السائل وتصاعد فقاعات غاز ثاني أكسيد الكربون (CO₂) التي تسببت في انتفاخ البالون.',
                btnText: 'تم التفاعل بنجاح'
            }
        };
    }

    init() {
        this.bindModals();
        this.bindBottomBar();
        this.bindActionBtn();
    }

    updateStep(stepState) {
        const stepNum = stepState.step;
        const info = this.stepDescriptions[stepNum] || this.stepDescriptions[1];

        for (let i = 1; i <= 4; i++) {
            const circle = document.getElementById(`stepCircle${i}`);
            if (circle) {
                circle.classList.remove('active', 'completed');
                if (i < stepNum) circle.classList.add('completed');
                else if (i === stepNum) circle.classList.add('active');
            }
        }

        const titleEl = document.getElementById('currentStepTitle');
        const descEl = document.getElementById('currentStepDesc');
        const actionBtn = document.getElementById('btnMainAction');
        if (titleEl) titleEl.innerText = info.title;
        if (descEl) descEl.innerText = info.desc;
        if (actionBtn) {
            actionBtn.innerText = info.btnText;
            if (stepNum === 3 && stepState.balloonAttached) {
                actionBtn.classList.remove('disabled');
                actionBtn.classList.add('ready-pulse');
            } else if (stepNum === 4) {
                actionBtn.classList.add('completed-btn');
                actionBtn.classList.remove('ready-pulse');
            }
        }
    }

    bindActionBtn() {
        const btn = document.getElementById('btnMainAction');
        if (btn) {
            btn.addEventListener('click', () => {
                soundManager.playClick();
                const state = dragDropEngine.state;
                if (state.step === 1 && !state.vinegarInBottle) {
                    if (dragDropEngine.state.funnelLocation !== 'bottle') {
                        dragDropEngine.moveFunnelToBottle();
                        setTimeout(() => { dragDropEngine.executeVinegarPour(); }, 400);
                    } else {
                        dragDropEngine.executeVinegarPour();
                    }
                } else if (state.step === 2 && !state.sodaInBalloon) {
                    if (dragDropEngine.state.funnelLocation !== 'balloon') {
                        dragDropEngine.moveFunnelToBalloon();
                        dragDropEngine.notifyState();
                    } else if (!dragDropEngine.state.sodaOnSpoon) {
                        dragDropEngine.executeScoopFromBowl();
                    } else {
                        dragDropEngine.executeSodaScoop();
                    }
                } else if (state.step === 3 && state.balloonAttached) {
                    dragDropEngine.triggerReaction();
                } else if (state.step === 3 && !state.balloonAttached) {
                    dragDropEngine.state.balloonAttached = true;
                    dragDropEngine.notifyState();
                }
            });
        }
    }

    bindModals() {
        const btnHints = document.getElementById('btnToolbarHints');
        const hintsModal = document.getElementById('modalHints');
        const closeHints = document.getElementById('btnCloseHints');
        if (btnHints && hintsModal) btnHints.addEventListener('click', () => hintsModal.classList.add('open'));
        if (closeHints && hintsModal) closeHints.addEventListener('click', () => hintsModal.classList.remove('open'));

        const btnNotes = document.getElementById('btnToolbarNotes');
        const notesModal = document.getElementById('modalNotes');
        const closeNotes = document.getElementById('btnCloseNotes');
        if (btnNotes && notesModal) btnNotes.addEventListener('click', () => notesModal.classList.add('open'));
        if (closeNotes && notesModal) closeNotes.addEventListener('click', () => notesModal.classList.remove('open'));

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('lab-modal-backdrop')) e.target.classList.remove('open');
        });
    }

    bindBottomBar() {
        const btnFullscreen = document.getElementById('btnFullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                soundManager.playClick();
                if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
                else document.exitFullscreen();
            });
        }
        const btnSound = document.getElementById('btnToggleAudio');
        if (btnSound) {
            btnSound.addEventListener('click', () => {
                const muted = soundManager.toggleMute();
                btnSound.innerHTML = muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
            });
        }
    }
}
const uiOverlay = new UIOverlay();

// 8. APP INITIALIZER
function initApp() {
    reactionEngine.init('bubblesCanvas');
    dragDropEngine.init();
    quizEngine.init();
    uiOverlay.init();

    // Render Apparatus SVGs
    const render = (id, svg) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = svg;
    };

    render('centralBottleContainer', APPARATUS_SVGS.bottle(0, true));
    render('tableFunnelContainer', APPARATUS_SVGS.funnel());
    render('tableBalloonGraphic', APPARATUS_SVGS.balloon('deflated', 1.0));
    render('tableSpoonContainer', APPARATUS_SVGS.spoon(false));
    render('tableVinegarContainer', APPARATUS_SVGS.vinegarBottle());
    render('tableSodaBowlContainer', APPARATUS_SVGS.bakingSodaBowl());

    render('sideIconBottle', APPARATUS_SVGS.bottle(0, false));
    render('sideIconBalloon', APPARATUS_SVGS.balloon('deflated', 1.0));
    render('sideIconFunnel', APPARATUS_SVGS.funnel());
    render('sideIconSpoon', APPARATUS_SVGS.spoon(false));
    render('sideIconVinegar', APPARATUS_SVGS.vinegarBottle());
    render('sideIconSoda', APPARATUS_SVGS.bakingSodaBowl());

    dragDropEngine.subscribe((state) => {
        uiOverlay.updateStep(state);
        const bottleContainer = document.getElementById('centralBottleContainer');
        const calc = variableManager.getCalculation();
        if (bottleContainer) {
            bottleContainer.innerHTML = APPARATUS_SVGS.bottle(state.vinegarInBottle ? calc.liquidHeightPx : 0, true);
        }

        const tableFunnel = document.getElementById('tableFunnelContainer');
        const bottleFunnelSlot = document.getElementById('bottleFunnelSlot');
        const balloonFunnelSlot = document.getElementById('balloonFunnelSlot');

        if (tableFunnel) tableFunnel.style.display = 'block';
        if (bottleFunnelSlot) bottleFunnelSlot.style.display = 'none';
        if (balloonFunnelSlot) balloonFunnelSlot.style.display = 'none';

        const activeBalloonSlot = document.getElementById('activeBalloonSlot');
        const tableBalloon = document.getElementById('tableBalloonContainer');

        if (state.balloonAttached) {
            if (tableBalloon) tableBalloon.style.display = 'none';
            if (activeBalloonSlot) {
                activeBalloonSlot.style.display = 'block';
                if (!state.reactionDone && state.step === 3) {
                    activeBalloonSlot.innerHTML = APPARATUS_SVGS.balloon('hanging');
                } else if (state.step === 4 || state.reactionDone) {
                    activeBalloonSlot.innerHTML = APPARATUS_SVGS.balloon('upright', calc.scale);
                }
            }
        } else {
            if (activeBalloonSlot) activeBalloonSlot.style.display = 'none';
            if (tableBalloon) tableBalloon.style.display = 'block';
        }
    });

    const resetBtn = document.getElementById('btnResetExperiment');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            soundManager.playClick();
            dragDropEngine.resetAll();
            quizEngine.reset();
            render('centralBottleContainer', APPARATUS_SVGS.bottle(0, true));
            render('tableBalloonGraphic', APPARATUS_SVGS.balloon('deflated', 1.0));
            render('tableFunnelContainer', APPARATUS_SVGS.funnel());
        });
    }

    const activeBalloonSlot = document.getElementById('activeBalloonSlot');
    if (activeBalloonSlot) {
        activeBalloonSlot.addEventListener('click', () => {
            if (dragDropEngine.state.balloonAttached && !dragDropEngine.state.reactionDone) {
                dragDropEngine.triggerReaction();
            }
        });
    }

    const vinegarSlider = document.getElementById('sliderVinegarVol');
    const sodaSlider = document.getElementById('sliderSodaSpoons');
    const valVinegar = document.getElementById('valVinegarVol');
    const valSoda = document.getElementById('valSodaSpoons');
    const co2Badge = document.getElementById('co2YieldBadge');

    if (vinegarSlider && valVinegar) {
        vinegarSlider.addEventListener('input', (e) => {
            valVinegar.innerText = `${e.target.value} مل`;
            variableManager.setVinegar(e.target.value);
            const calc = variableManager.getCalculation();
            if (co2Badge) co2Badge.innerText = `حجم الغاز المتوقع: ~${calc.co2Liters} لتر (معامل: ×${calc.scale.toFixed(2)})`;
        });
    }
    if (sodaSlider && valSoda) {
        sodaSlider.addEventListener('input', (e) => {
            valSoda.innerText = `${e.target.value} ${e.target.value == 1 ? 'ملعقة' : 'ملاعق'}`;
            variableManager.setSodaSpoons(e.target.value);
            const calc = variableManager.getCalculation();
            if (co2Badge) co2Badge.innerText = `حجم الغاز المتوقع: ~${calc.co2Liters} لتر (معامل: ×${calc.scale.toFixed(2)})`;
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
