/**
 * splitScreenEngine.js
 * Clean Architecture - Split Screen Comparative Dual Viewport Engine
 */

export class SplitScreenEngine {
    constructor(mitosisEngine, meiosisEngine) {
        this.mitosisEngine = mitosisEngine;
        this.meiosisEngine = meiosisEngine;
        
        this.container = document.getElementById('splitScreenContainer');
        this.canvasLeft = document.getElementById('canvasSplitLeft');
        this.canvasRight = document.getElementById('canvasSplitRight');
        this.ctxLeft = this.canvasLeft ? this.canvasLeft.getContext('2d') : null;
        this.ctxRight = this.canvasRight ? this.canvasRight.getContext('2d') : null;

        this.active = false;
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.container || !this.active) return;
        const rect = this.container.getBoundingClientRect();
        const halfW = rect.width / 2;
        const h = rect.height;

        [this.canvasLeft, this.canvasRight].forEach(c => {
            if (c) {
                c.width = halfW * (window.devicePixelRatio || 1);
                c.height = h * (window.devicePixelRatio || 1);
                c.style.width = `${halfW}px`;
                c.style.height = `${h}px`;
            }
        });
    }

    toggle() {
        this.active = !this.active;
        if (this.container) {
            this.container.style.display = this.active ? 'flex' : 'none';
        }
        if (this.active) {
            this.resize();
        }
        return this.active;
    }

    render() {
        if (!this.active || !this.ctxLeft || !this.ctxRight) return;
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvasLeft.width / dpr;
        const h = this.canvasLeft.height / dpr;

        // Reset transforms
        this.ctxLeft.resetTransform();
        this.ctxRight.resetTransform();
        this.ctxLeft.scale(dpr, dpr);
        this.ctxRight.scale(dpr, dpr);

        // Fill background
        this.ctxLeft.fillStyle = '#064e3b';
        this.ctxLeft.fillRect(0, 0, w, h);
        this.ctxRight.fillStyle = '#312e81';
        this.ctxRight.fillRect(0, 0, w, h);

        // Left Viewport: Plant Cell Division (Mitosis Metaphase)
        this.mitosisEngine.renderCell(this.ctxLeft, 'plant', w, h, 1.0, 0, 0);

        // Right Viewport: Animal Cell Division (Meiosis I Tetrad Metaphase)
        this.meiosisEngine.renderMeiosisMetaphase1(this.ctxRight, w, h, 1.0);
    }
}
