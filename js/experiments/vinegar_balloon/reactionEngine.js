/**
 * reactionEngine.js
 * High-Fidelity Chemical Reaction Simulation
 * Liquid Effervescence, Surface Foaming & Ascending CO2 Gas Stream into Balloon
 * Clean Architecture - Single Responsibility
 */

import { soundManager } from './soundManager.js';
import { variableManager } from './variableManager.js';
import { APPARATUS_SVGS } from './apparatus.js';

class ReactionEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.liquidBubbles = [];
        this.gasStreamParticles = [];
        this.foamMounds = [];
        this.animId = null;
        this.isReacting = false;
        this.progress = 0; // 0 to 1
        this.onCompleteCallback = null;
        this.surfaceY = 280;
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
        // مطابقة نظام إحداثيات الكانفاس بدقة 1:1 مع نظام viewBox لمجسم الزجاجة SVG (160x380)
        this.canvas.width = 160;
        this.canvas.height = 380;
    }

    startReaction(onComplete) {
        if (this.isReacting) return;
        this.isReacting = true;
        this.progress = 0;
        this.onCompleteCallback = onComplete;

        if (!this.canvas || !this.ctx) {
            this.init('bubblesCanvas');
        }

        // حساب ارتفاع سطح السائل الفعلي بناءً على حجم الخل
        const calc = variableManager.getCalculation();
        const liquidH = calc.liquidHeightPx || 75;
        this.surfaceY = Math.max(220, 360 - liquidH);

        soundManager.startFizz();
        soundManager.playBalloonInflate(3.6);

        this.initParticleSystems();
        this.animate();
    }

    initParticleSystems() {
        this.liquidBubbles = [];
        this.gasStreamParticles = [];
        this.foamMounds = [];

        // 1. فقاعات الفوران داخل السائل (110 فقاعة متدرجة الأحجام)
        const bubbleCount = 110;
        for (let i = 0; i < bubbleCount; i++) {
            this.liquidBubbles.push(this.createLiquidBubble(true));
        }

        // 2. جسيمات وتيارات غاز ثاني أكسيد الكربون الصاعد في عنق الزجاجة نحو البالون (65 جسيم)
        const gasCount = 65;
        for (let i = 0; i < gasCount; i++) {
            this.gasStreamParticles.push(this.createGasParticle(true));
        }

        // 3. نقاط رغوة الفوران الكثيفة عند سطح السائل (18 تكتل رغوي متحرك)
        for (let x = 36; x <= 124; x += 5.5) {
            this.foamMounds.push({
                baseX: x,
                x: x,
                baseR: 3.5 + Math.random() * 3.0,
                phase: Math.random() * Math.PI * 2,
                speed: 0.08 + Math.random() * 0.06
            });
        }
    }

    createLiquidBubble(randomY = false) {
        const radius = Math.random() < 0.7 
            ? 0.9 + Math.random() * 1.5   // فقاعات ميكروية دقيقة فوارة
            : 2.4 + Math.random() * 2.2;  // فقاعات غازية أكبر صاعدة

        return {
            x: 38 + Math.random() * 84,
            y: randomY ? this.surfaceY + Math.random() * (356 - this.surfaceY) : 356 + Math.random() * 6,
            radius: radius,
            speedY: 1.6 + radius * 0.75 + Math.random() * 1.2,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.09 + Math.random() * 0.08,
            wobbleAmp: 0.5 + Math.random() * 1.0,
            alpha: 0.45 + Math.random() * 0.45
        };
    }

    createGasParticle(randomY = false) {
        const startY = randomY 
            ? 25 + Math.random() * (this.surfaceY - 25) 
            : this.surfaceY - 2 - Math.random() * 8;

        const maxSpread = this.getBottleWidthAtY(startY) * 0.38;

        return {
            x: 80 + (Math.random() - 0.5) * maxSpread * 2,
            y: startY,
            prevY: startY + 8,
            prevX: 80,
            radius: 1.4 + Math.random() * 2.6,
            speedY: 3.2 + Math.random() * 3.8, // سرعة تدفق الغاز الصاعد بقوة الضغط
            driftX: (Math.random() - 0.5) * 0.8,
            alpha: 0.4 + Math.random() * 0.5,
            age: 0
        };
    }

    // دالة محاكاة الجدران الفيزيائية لعنق وجسم الزجاجة حسب الارتفاع Y
    getBottleWidthAtY(y) {
        if (y >= 130) {
            // جسم الزجاجة العريض (x من 34 إلى 126)
            return 92;
        } else if (y >= 88) {
            // كتف الزجاجة المنحدر (تضيق تدريجي من 92 إلى 30)
            const t = (y - 88) / (130 - 88);
            return 30 + t * 62;
        } else {
            // عنق الزجاجة الضيق المؤدي للبالون (x من 66 إلى 94)
            return 28;
        }
    }

    animate() {
        if (!this.isReacting) return;
        this.animId = requestAnimationFrame(() => this.animate());

        if (!this.canvas || !this.ctx) {
            this.init('bubblesCanvas');
        }

        if (this.ctx && this.canvas) {
            const w = this.canvas.width;
            const h = this.canvas.height;
            this.ctx.clearRect(0, 0, w, h);
        }

        // تقدم التفاعل (4.2 ثانية تقريباً لدورة تفاعل غنية وممتعة)
        this.progress += 0.0042;

        // منحنى شدة الفوران وتصاعد الغاز (Reaction Effervescence Curve)
        let intensity;
        if (this.progress < 0.18) {
            // تصاعد فوري وسريع للفوران مع سقوط المسحوق
            intensity = 0.3 + (this.progress / 0.18) * 0.7;
        } else if (this.progress < 0.70) {
            // ذروة التفاعل وتوليد الغاز المستمر
            intensity = 1.0 - ((this.progress - 0.18) / 0.52) * 0.15;
        } else {
            // هدوء الفوران تدريجياً واستقرار الضغط داخل البالون
            intensity = 0.85 * (1 - (this.progress - 0.70) / 0.30);
        }
        intensity = Math.max(0.06, intensity);

        // ==================== 1. رسم وتحديث فقاعات السائل ====================
        for (let p of this.liquidBubbles) {
            p.y -= p.speedY * intensity;
            p.wobblePhase += p.wobbleSpeed;
            const curX = p.x + Math.sin(p.wobblePhase) * p.wobbleAmp;

            // إذا وصلت الفقاعة لسطح السائل
            if (p.y <= this.surfaceY) {
                if (this.progress < 0.92) {
                    // إعادة تدوير الفقاعة من قاع الزجاجة
                    Object.assign(p, this.createLiquidBubble(false));
                }
            } else {
                // رسم جسم الفقاعة الشفاف ثلاثي الأبعاد
                const bubbleAlpha = p.alpha * intensity;
                this.ctx.beginPath();
                this.ctx.arc(curX, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${bubbleAlpha * 0.55})`;
                this.ctx.fill();
                this.ctx.strokeStyle = `rgba(215, 240, 255, ${bubbleAlpha * 0.75})`;
                this.ctx.lineWidth = 0.75;
                this.ctx.stroke();

                // لمعة انعكاس الضوء الكروية على أعلى يسار الفقاعة (Gloss Specular Highlight)
                if (p.radius >= 1.6) {
                    this.ctx.beginPath();
                    this.ctx.arc(curX - p.radius * 0.38, p.y - p.radius * 0.38, p.radius * 0.28, 0, Math.PI * 2);
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, bubbleAlpha * 1.3)})`;
                    this.ctx.fill();
                }
            }
        }

        // ==================== 2. رسم طبقة رغوة الفوران عند سطح السائل ====================
        const foamWaveY = this.surfaceY;
        const foamIntensity = Math.min(1.0, intensity * 1.2);
        const time = performance.now() * 0.005;

        for (let m of this.foamMounds) {
            m.phase += m.speed;
            const moundR = m.baseR * (0.85 + Math.sin(m.phase + time) * 0.3) * foamIntensity;
            const moundY = foamWaveY - Math.abs(Math.sin(m.phase * 1.3)) * (5.5 * foamIntensity);

            this.ctx.beginPath();
            this.ctx.arc(m.x, moundY, moundR, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.75 * foamIntensity})`;
            this.ctx.fill();

            // فقاعة رغوية دقيقة متلألئة فوق الرغوة
            if (moundR > 3.0) {
                this.ctx.beginPath();
                this.ctx.arc(m.x + 1.2, moundY - 1.2, moundR * 0.35, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * foamIntensity})`;
                this.ctx.fill();
            }
        }

        // ==================== 3. رسم تيار غاز CO2 الصاعد في العنق نحو البالون ====================
        for (let g of this.gasStreamParticles) {
            g.prevX = g.x;
            g.prevY = g.y;

            g.y -= g.speedY * (0.6 + intensity * 0.55);
            g.x += g.driftX;
            g.age += 0.02;

            // توجيه وتقييد جسيمات الغاز لتنساب عبر عنق الزجاجة بدقة فيزيائية
            const allowedWidth = this.getBottleWidthAtY(g.y) * 0.45;
            const centerTargetX = 80;
            // قوة سحب مركزية تزداد كلما اقترب الغاز من عنق الزجاجة
            const convergenceRate = g.y < 130 ? 0.08 : 0.02;
            g.x += (centerTargetX - g.x) * convergenceRate;

            // الحد من الانحراف خارج جدار الزجاجة
            g.x = Math.max(centerTargetX - allowedWidth, Math.min(centerTargetX + allowedWidth, g.x));

            // عند وصول جسيم الغاز لفوهة البالون (y <= 24)
            if (g.y <= 24) {
                if (this.progress < 0.88) {
                    Object.assign(g, this.createGasParticle(false));
                }
            } else {
                const gasAlpha = g.alpha * intensity * Math.max(0.1, Math.min(1, g.y / 80));

                // 1. مسار تيار هوائي انسيابي صاعد (Upward Gas Stream Trail)
                this.ctx.beginPath();
                this.ctx.moveTo(g.prevX, g.prevY);
                this.ctx.lineTo(g.x, g.y);
                this.ctx.strokeStyle = `rgba(224, 242, 254, ${gasAlpha * 0.5})`;
                this.ctx.lineWidth = g.radius * 0.8;
                this.ctx.lineCap = 'round';
                this.ctx.stroke();

                // 2. هالة ضبابية من الغاز المتصاعد (Glowing CO2 Gas Puff)
                const grad = this.ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius * 2.2);
                grad.addColorStop(0, `rgba(255, 255, 255, ${gasAlpha * 0.9})`);
                grad.addColorStop(0.5, `rgba(224, 242, 254, ${gasAlpha * 0.45})`);
                grad.addColorStop(1, 'rgba(186, 230, 253, 0)');

                this.ctx.beginPath();
                this.ctx.arc(g.x, g.y, g.radius * 2.2, 0, Math.PI * 2);
                this.ctx.fillStyle = grad;
                this.ctx.fill();
            }
        }

        // ==================== 4. تحديث تمدد وانتفاخ البالون تدريجياً ====================
        const calc = variableManager.getCalculation();
        const targetScale = calc.scale || 1.0;

        let scaleFactor;
        if (this.progress < 0.82) {
            // تمدد انسيابي متسارع متوافق مع اندفاع الغاز
            const t = this.progress / 0.82;
            scaleFactor = 0.88 * Math.pow(t, 1.25);
        } else {
            // ارتداد مطاطي ناعم وطبيعي عند امتلاء البالون (Elastic Settle)
            const t = (this.progress - 0.82) / 0.18;
            const damp = Math.exp(-3.5 * t);
            const bounce = Math.sin(t * Math.PI * 3.2) * 0.038 * damp;
            scaleFactor = 0.88 + 0.12 * t + bounce;
        }

        const currentScale = Math.max(0.04, targetScale * scaleFactor);

        const balloonSlot = document.getElementById('activeBalloonSlot');
        if (balloonSlot) {
            balloonSlot.innerHTML = APPARATUS_SVGS.balloon('upright', currentScale);
        }

        // انتهاء التفاعل عند اكتمال الدورة
        if (this.progress >= 1.0) {
            this.finishReaction();
        }
    }

    finishReaction() {
        this.isReacting = false;
        if (this.animId) cancelAnimationFrame(this.animId);
        soundManager.stopFizz();
        soundManager.playSuccess();

        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.onCompleteCallback) {
            this.onCompleteCallback();
        }
    }

    reset() {
        this.isReacting = false;
        this.progress = 0;
        if (this.animId) cancelAnimationFrame(this.animId);
        soundManager.stopFizz();
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

export const reactionEngine = new ReactionEngine();
