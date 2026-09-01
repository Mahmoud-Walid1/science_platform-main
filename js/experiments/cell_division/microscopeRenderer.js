/**
 * microscopeRenderer.js
 * Clean Architecture - Handles Microscope Viewport, Infinite Drag & Zoom-Scaled Phase Glides for Mitosis & Meiosis.
 */

export class MicroscopeRenderer {
    constructor() {
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.zoomPercent = 45;

        this.panX = 0;
        this.panY = 0;
        this.targetPanX = 0;
        this.targetPanY = 0;

        this.currentPhase = 'metaphase';
        this.slideType = 'plant';
        this.glideSpeed = 0.12;

        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;

        // Landmark World Coordinates (cellX, cellY) matching exact cell centers
        this.phaseCoords = {
            // Mitosis Phases
            metaphase: { x: 0, y: 0 },
            prophase: { x: -385, y: -165 },
            anaphase: { x: 415, y: -165 },
            telophase: { x: -385, y: 165 },
            interphase: { x: 415, y: 165 },

            // Meiosis Phases
            metaphase1: { x: 0, y: 0 },
            prophase1: { x: -385, y: -165 },
            anaphase1: { x: 415, y: -165 },
            telophase1: { x: -385, y: 165 },
            meiosis2: { x: 415, y: 165 }
        };

        this.initDragAndWheelListeners();
        this.setZoomPercent(45);
    }

    initDragAndWheelListeners() {
        const stage = document.getElementById('stagePanel');
        if (!stage) return;

        // 1. Mouse Wheel Zoom (Scroll to Zoom 1% - 100%)
        stage.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 4 : -4;
            const newPercent = Math.max(1, Math.min(100, this.zoomPercent + delta));
            this.setZoomPercent(newPercent);

            const slider = document.getElementById('zoomRangeInput');
            const badge = document.getElementById('zoomPercentageBadge');
            if (slider) slider.value = newPercent;
            if (badge) badge.textContent = `${Math.round(newPercent)}%`;
        }, { passive: false });

        // 2. Drag & Pan Listeners
        const startDrag = (clientX, clientY) => {
            this.isDragging = true;
            this.dragStartX = clientX - this.targetPanX;
            this.dragStartY = clientY - this.targetPanY;
        };

        const moveDrag = (clientX, clientY) => {
            if (!this.isDragging) return;
            this.targetPanX = clientX - this.dragStartX;
            this.targetPanY = clientY - this.dragStartY;
            this.panX = this.targetPanX;
            this.panY = this.targetPanY;
        };

        const endDrag = () => {
            this.isDragging = false;
        };

        stage.addEventListener('mousedown', (e) => {
            if (e.target.closest('button, input, aside, nav')) return;
            startDrag(e.clientX, e.clientY);
        });
        window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
        window.addEventListener('mouseup', endDrag);

        stage.addEventListener('touchstart', (e) => {
            if (e.target.closest('button, input, aside, nav')) return;
            if (e.touches.length > 0) startDrag(e.touches[0].clientX, e.touches[0].clientY);
        });
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
        });
        window.addEventListener('touchend', endDrag);
    }

    setSlideType(type) {
        this.slideType = type;
    }

    setZoomPercent(percent) {
        this.zoomPercent = Math.max(1, Math.min(100, percent));
        // Expanded high-power zoom scale (0.35x to 5.5x max magnification)
        const scale = 0.35 + (this.zoomPercent / 100) * 5.15;
        this.targetZoom = scale;

        const coord = this.phaseCoords[this.currentPhase] || { x: 0, y: 0 };
        this.targetPanX = -coord.x * this.targetZoom;
        this.targetPanY = -coord.y * this.targetZoom;
    }

    glideToPhase(phase) {
        this.currentPhase = phase;
        const coord = this.phaseCoords[phase] || { x: 0, y: 0 };
        const targetX = -coord.x * this.targetZoom;
        const targetY = -coord.y * this.targetZoom;
        this.glideTo(targetX, targetY, this.targetZoom);
    }

    glideTo(x, y, zoom = this.targetZoom) {
        this.targetPanX = x;
        this.targetPanY = y;
        this.targetZoom = zoom;
    }

    update() {
        if (this.isDragging) {
            this.panX = this.targetPanX;
            this.panY = this.targetPanY;
        } else {
            this.panX += (this.targetPanX - this.panX) * this.glideSpeed;
            this.panY += (this.targetPanY - this.panY) * this.glideSpeed;
        }
        this.zoom += (this.targetZoom - this.zoom) * this.glideSpeed;
    }

    renderSlideBackground(ctx, width, height) {
        ctx.save();

        // Stage Background
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, 0, width, height);

        // Ocular Aperture Field Circle (Balanced between left card and right dock)
        const radius = Math.min(width, height) * 0.44;
        const centerX = width / 2 + 100;
        const centerY = height / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();

        // Stained Microscopic Slide Background Gradient
        const bgGradient = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, radius);
        if (this.slideType === 'plant') {
            bgGradient.addColorStop(0, '#f3e8ff');
            bgGradient.addColorStop(0.7, '#e9d5ff');
            bgGradient.addColorStop(1, '#d8b4fe');
        } else if (this.slideType === 'animal_red') {
            bgGradient.addColorStop(0, '#ffe4e6');
            bgGradient.addColorStop(0.7, '#fecdd3');
            bgGradient.addColorStop(1, '#fda4af');
        } else {
            bgGradient.addColorStop(0, '#dbeafe');
            bgGradient.addColorStop(0.7, '#bfdbfe');
            bgGradient.addColorStop(1, '#93c5fd');
        }
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        ctx.restore();

        // Ocular Lens Frame & Reticle
        this.drawOcularBezel(ctx, width, height, centerX, centerY, radius);

        ctx.restore();
    }

    drawOcularBezel(ctx, width, height, cx, cy, radius) {
        ctx.save();

        // Metallic outer bezel ring
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 32;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Reticle Crosshairs
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.2)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(cx - radius + 20, cy);
        ctx.lineTo(cx + radius - 20, cy);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy - radius + 20);
        ctx.lineTo(cx, cy + radius - 20);
        ctx.stroke();

        ctx.restore();
    }
}
