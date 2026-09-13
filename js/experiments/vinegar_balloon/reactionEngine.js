/**
 * reactionEngine.js
 * Chemical Reaction Simulation, Gas Bubble Particles & Balloon Inflation
 * Clean Architecture - Single Responsibility
 */

import { soundManager } from './soundManager.js';
import { variableManager } from './variableManager.js';
import { APPARATUS_SVGS } from './apparatus.js';

class ReactionEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animId = null;
        this.isReacting = false;
        this.progress = 0; // 0 to 1
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
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
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
                driftX: (Math.random() - 0.5) * 0.8,
                alpha: Math.random() * 0.7 + 0.3
            });
        }
    }

    animate() {
        if (!this.isReacting) return;
        this.animId = requestAnimationFrame(() => this.animate());

        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        // تحديث نسبة تقدم التفاعل
        this.progress += 0.005;

        // رسم وتحديث فقاعات CO2
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        for (let p of this.particles) {
            p.y -= p.speedY;
            p.x += p.driftX;

            if (p.y < h * 0.65) {
                // وصول الفقاعة لسطح السائل، إعادة تدويرها من الأسفل إذا كان التفاعل مستمراً
                if (this.progress < 0.9) {
                    p.y = h * 0.95 + Math.random() * 10;
                    p.x = w * 0.3 + Math.random() * (w * 0.4);
                }
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // تحديث انتفاخ البالون تدريجياً مع تصاعد الغاز
        const calc = variableManager.getCalculation();
        const startScale = 0.12;
        const currentScale = startScale + (calc.scale - startScale) * Math.min(1.0, Math.pow(this.progress, 1.15));
        
        const balloonSlot = document.getElementById('activeBalloonSlot');
        if (balloonSlot) {
            balloonSlot.innerHTML = APPARATUS_SVGS.balloon('upright', currentScale);
        }

        // انتهاء التفاعل
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
