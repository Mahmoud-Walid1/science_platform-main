/**
 * calloutLabels.js
 * Clean Architecture - Dynamic Anatomical Callout Pins Overlay Engine
 */

export class CalloutLabels {
    constructor() {
        this.container = document.getElementById('calloutOverlay');
        this.visible = false;
        this.pins = [];
    }

    toggle() {
        this.visible = !this.visible;
        if (this.container) {
            this.container.style.display = this.visible ? 'block' : 'none';
        }
        return this.visible;
    }

    updatePins(phase, slideType, width, height, zoom, panX, panY) {
        if (!this.container || !this.visible) return;

        this.container.innerHTML = '';

        const centerX = width / 2 + panX;
        const centerY = height / 2 + panY;

        let pinData = [];

        if (phase === 'metaphase') {
            pinData = [
                { label: 'السنترومير (Centromere)', x: centerX, y: centerY - 15 * zoom },
                { label: 'الخيوط المغزلية (Spindle Fibers)', x: centerX - 60 * zoom, y: centerY - 25 * zoom }
            ];
            if (slideType === 'animal') {
                pinData.push({ label: 'المريكزات (Centrioles)', x: centerX - 120 * zoom, y: centerY });
            }
        } else if (phase === 'telophase') {
            if (slideType === 'plant') {
                pinData.push({ label: 'الصفيحة الخلوية (Cell Plate)', x: centerX, y: centerY });
            } else {
                pinData.push({ label: 'تخصر الغشاء (Cleavage Furrow)', x: centerX, y: centerY - 45 * zoom });
            }
        } else if (phase === 'prophase') {
            pinData.push({ label: 'الكروماتيدات الشقيقة (Sister Chromatids)', x: centerX + 20 * zoom, y: centerY - 15 * zoom });
        } else if (phase === 'anaphase') {
            pinData.push({ label: 'الكروموسومات الابنة (V-shaped Chromatids)', x: centerX + 55 * zoom, y: centerY - 20 * zoom });
        }

        pinData.forEach(p => {
            const div = document.createElement('div');
            div.className = 'callout-pin';
            div.style.left = `${p.x}px`;
            div.style.top = `${p.y}px`;
            div.innerHTML = `<i class="fas fa-map-marker-alt"></i> <span>${p.label}</span>`;
            this.container.appendChild(div);
        });
    }
}
