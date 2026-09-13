/**
 * labScene.js
 * Lab Workspace Setup, Bench Rendering, Zoom & Transform Management
 * Clean Architecture - Single Responsibility
 */

class LabScene {
    constructor() {
        this.container = null;
        this.bench = null;
        this.scale = 1.0;
        this.minScale = 0.75;
        this.maxScale = 1.45;
    }

    init(containerId = 'labStage') {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.bench = this.container.querySelector('.lab-bench-surface');
    }

    zoomIn() {
        if (this.scale < this.maxScale) {
            this.scale = Math.min(this.maxScale, this.scale + 0.15);
            this.applyTransform();
        }
        return this.scale;
    }

    zoomOut() {
        if (this.scale > this.minScale) {
            this.scale = Math.max(this.minScale, this.scale - 0.15);
            this.applyTransform();
        }
        return this.scale;
    }

    resetZoom() {
        this.scale = 1.0;
        this.applyTransform();
        return this.scale;
    }

    applyTransform() {
        const stageContent = document.getElementById('stageWorkspace');
        if (stageContent) {
            stageContent.style.transform = `scale(${this.scale})`;
            stageContent.style.transformOrigin = 'center bottom';
        }
    }
}

export const labScene = new LabScene();
