/**
 * spotlightEngine.js
 * Clean Architecture - Spotlight & Background Tissue Dimming (70%) Engine
 */

export class SpotlightEngine {
    constructor() {
        this.active = false;
        this.maskEl = document.getElementById('spotlightMask');
        this.ocularEl = document.getElementById('ocularViewport');
        this.x = window.innerWidth / 2;
        this.y = window.innerHeight / 2;

        this.init();
    }

    init() {
        window.addEventListener('mousemove', (e) => {
            if (this.active) {
                this.setPosition(e.clientX, e.clientY);
            }
        });

        window.addEventListener('touchmove', (e) => {
            if (this.active && e.touches.length > 0) {
                this.setPosition(e.touches[0].clientX, e.touches[0].clientY);
            }
        });
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        if (this.maskEl) {
            this.maskEl.style.setProperty('--spot-x', `${x}px`);
            this.maskEl.style.setProperty('--spot-y', `${y}px`);
        }
    }

    toggle() {
        this.active = !this.active;
        if (this.maskEl) {
            this.maskEl.classList.toggle('active', this.active);
        }
        if (this.ocularEl) {
            this.ocularEl.classList.toggle('spotlight-active', this.active);
        }
        return this.active;
    }
}
