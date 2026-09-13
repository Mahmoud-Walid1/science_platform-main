/**
 * sceneManager.js
 * Clean Architecture - Handles Canvas dimensions, DPR scaling for all layers.
 */

export class SceneManager {
    constructor() {
        this.canvases = [
            document.getElementById('canvas2d'),
            document.getElementById('annotationCanvas'),
            document.getElementById('laserCanvas')
        ].filter(Boolean);

        this.width = 0;
        this.height = 0;
        this.pixelRatio = window.devicePixelRatio || 1;
        this.listeners = [];
        this.animFrameId = null;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (this.canvases.length === 0) return;
        const parent = this.canvases[0].parentElement;
        if (!parent) return;

        const rect = parent.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        this.canvases.forEach(canvas => {
            canvas.width = Math.floor(this.width * this.pixelRatio);
            canvas.height = Math.floor(this.height * this.pixelRatio);
            canvas.style.width = `${this.width}px`;
            canvas.style.height = `${this.height}px`;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.resetTransform();
                ctx.scale(this.pixelRatio, this.pixelRatio);
            }
        });

        this.notifyResize();
    }

    onResize(callback) {
        this.listeners.push(callback);
    }

    notifyResize() {
        this.listeners.forEach(cb => cb(this.width, this.height));
    }

    startLoop(renderCallback) {
        const loop = () => {
            const ctx = this.canvases[0] ? this.canvases[0].getContext('2d') : null;
            if (ctx) {
                renderCallback(ctx, this.width, this.height);
            }
            this.animFrameId = requestAnimationFrame(loop);
        };
        loop();
    }

    stopLoop() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
        }
    }
}
