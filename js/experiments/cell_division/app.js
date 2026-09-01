/**
 * app.js
 * Clean Architecture - Main Entry Point & Orchestrator for 3D Prep Table & Microscope Viewport.
 */

import { PrepTableEngine } from './prepTableEngine.js';
import { SceneManager } from './sceneManager.js';
import { MicroscopeRenderer } from './microscopeRenderer.js';
import { MitosisEngine } from './mitosisEngine.js';
import { MeiosisEngine } from './meiosisEngine.js';
import { TimeLapseScrubber } from './timeLapseScrubber.js';
import { SpotlightEngine } from './spotlightEngine.js';
import { LaserPointerEngine } from './laserPointerEngine.js';
import { AnnotationEngine } from './annotationEngine.js';
import { CalloutLabels } from './calloutLabels.js';
import { Chromosome3DEngine } from './chromosome3DEngine.js';
import { SplitScreenEngine } from './splitScreenEngine.js';
import { TeacherUI } from './teacherUI.js';

class CellDivisionApp {
    constructor() {
        this.divisionType = 'mitosis'; // Fixed Mitosis mode

        this.sceneManager = new SceneManager();
        this.microscope = new MicroscopeRenderer();
        this.mitosis = new MitosisEngine();
        this.meiosis = new MeiosisEngine();

        this.prepTable = new PrepTableEngine('prep3DContainer', (selectedSample) => {
            this.onSlideDroppedUnderMicroscope(selectedSample);
        });
        
        this.scrubber = new TimeLapseScrubber(this.mitosis, (phase, progress) => {
            this.callouts.updatePins(
                phase,
                this.microscope.slideType,
                this.sceneManager.width,
                this.sceneManager.height,
                this.microscope.zoom,
                this.microscope.panX,
                this.microscope.panY
            );
        });

        this.spotlight = new SpotlightEngine();
        this.laserPointer = new LaserPointerEngine();
        this.annotation = new AnnotationEngine();
        this.callouts = new CalloutLabels();
        this.chromosome3D = new Chromosome3DEngine();
        this.splitScreen = new SplitScreenEngine(this.mitosis, this.meiosis);

        this.teacherUI = new TeacherUI(
            this.microscope,
            this.mitosis,
            this.meiosis,
            this.scrubber,
            this.spotlight,
            this.annotation,
            this.callouts,
            this.chromosome3D,
            this.splitScreen
        );

        this.initSampleCardListeners();
        this.init();
    }

    initSampleCardListeners() {
        const sampleBtns = document.querySelectorAll('.sample-card-btn');
        sampleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                const sampleType = target.getAttribute('data-sample');

                sampleBtns.forEach(b => b.classList.remove('active'));
                target.classList.add('active');

                if (this.prepTable) {
                    this.prepTable.startSlidePreparationAnimation(sampleType);
                }
            });
        });

        // Return to Prep Table button listener
        const btnSlideSample = document.getElementById('btnSlideSample');
        if (btnSlideSample) {
            btnSlideSample.addEventListener('click', () => {
                this.showPrepTableStage();
            });
        }
    }

    onSlideDroppedUnderMicroscope(selectedSample) {
        this.microscope.setSlideType(selectedSample);

        const prepStage = document.getElementById('prepStageWrapper');
        const stagePanel = document.getElementById('stagePanel');

        if (prepStage) prepStage.style.display = 'none';
        if (stagePanel) stagePanel.style.display = 'block';

        // Trigger window resize to ensure 2D microscope canvas has correct dimensions
        window.dispatchEvent(new Event('resize'));
    }

    showPrepTableStage() {
        const prepStage = document.getElementById('prepStageWrapper');
        const stagePanel = document.getElementById('stagePanel');

        if (prepStage) prepStage.style.display = 'block';
        if (stagePanel) stagePanel.style.display = 'none';

        document.querySelectorAll('.sample-card-btn').forEach(b => b.classList.remove('active'));

        if (this.prepTable) {
            this.prepTable.resetPrepStage();
        }

        window.dispatchEvent(new Event('resize'));
    }

    init() {
        this.sceneManager.startLoop((ctx, width, height) => {
            this.render(ctx, width, height);
        });
    }

    render(ctx, width, height) {
        this.microscope.update();
        ctx.clearRect(0, 0, width, height);

        const radius = Math.min(width, height) * 0.44;
        const centerX = width / 2 + 100;
        const centerY = height / 2;

        ctx.save();
        // 1. Render Microscope Base Slide Background & Bezel Frame
        this.microscope.renderSlideBackground(ctx, width, height);

        // 2. Render Active Engine Cell Matrix inside Ocular Lens Aperture Circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();

        const activeEngine = this.mitosis; // Mitosis mode

        activeEngine.renderCell(
            ctx,
            this.microscope.slideType,
            width,
            height,
            this.microscope.zoom,
            this.microscope.panX,
            this.microscope.panY
        );
        ctx.restore();

        // 3. Render Laser Pointer Trail
        this.laserPointer.render();

        // 4. Update Callout Pins Position
        if (this.callouts.visible) {
            const activePhase = activeEngine.activePhase;
            this.callouts.updatePins(
                activePhase,
                this.microscope.slideType,
                width,
                height,
                this.microscope.zoom,
                this.microscope.panX,
                this.microscope.panY
            );
        }
        ctx.restore();
    }
}

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CellDivisionApp();
});
