/**
 * laserPointerEngine.js
 * Clean Architecture - Laser Pointer Engine (Toggleable)
 */

export class LaserPointerEngine {
    constructor() {
        this.canvas = document.getElementById('laserCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.active = false; // Disabled by default
        this.trail = [];
        this.maxTrailLength = 15;

        this.init();
    }

    init() {
        if (!this.canvas) return;

        const handleMove = (clientX, clientY) => {
            if (!this.active) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            this.addPoint(x, y);
        };

        window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
        });
    }

    setActive(enabled) {
        this.active = enabled;
        if (!enabled) {
            this.trail = [];
            this.clear();
        }
    }

    addPoint(x, y) {
        this.trail.push({ x, y, alpha: 1.0 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    clear() {
        if (this.ctx && this.canvas) {
            this.ctx.save();
            this.ctx.resetTransform();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
    }

    render() {
        if (!this.ctx || !this.canvas) return;
        this.clear();

        if (!this.active || this.trail.length === 0) return;

        for (let i = 0; i < this.trail.length; i++) {
            const p = this.trail[i];
            p.alpha -= 0.05;
            if (p.alpha <= 0) continue;

            const ratio = (i + 1) / this.trail.length;
            const radius = 6 * ratio;

            this.ctx.save();
            this.ctx.shadowColor = '#ef4444';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = `rgba(239, 68, 68, ${p.alpha * ratio})`;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
}
