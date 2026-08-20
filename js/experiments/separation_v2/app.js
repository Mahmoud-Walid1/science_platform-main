import { SceneManager } from './sceneManager.js';
import { MaterialsShelf } from './materialsShelf.js';
import { Tools3D } from './tools3D.js';
import { Beaker3D } from './beaker3D.js';
import { PouringEngine } from './pouringEngine.js';
import { DragControls3D } from './dragControls.js';
import { SeparationEngine } from './separationEngine.js';
import { UIOverlay } from './uiOverlay.js';
import { QuizEngine } from './quizEngine.js';

class SeparationApp {
    constructor() {
        this.canvas = document.getElementById('canvas3d');
        this.init();
    }

    init() {
        // 1. Educational Concepts, Properties Table & Interactive Quiz Engine (Always Initialize First)
        try {
            this.quizEngine = new QuizEngine('educationalPanel');
            this.quizEngine.init();
        } catch (e) {
            console.warn('Quiz engine init warning:', e);
        }

        // 2. Bind Header Mode Switcher Controls Immediately
        this.initModeSwitcher();

        if (!this.canvas) return;

        // 3. 3D Laboratory Environment Initialization
        try {
            this.sceneManager = new SceneManager(this.canvas);
            this.beaker3D = new Beaker3D(this.sceneManager);
            this.materialsShelf = new MaterialsShelf(this.sceneManager);
            this.tools3D = new Tools3D(this.sceneManager);
            this.uiOverlay = new UIOverlay(this.beaker3D, this.materialsShelf, this.tools3D, this.sceneManager);
            this.separationEngine = new SeparationEngine(this.sceneManager, this.beaker3D, this.uiOverlay);
            this.pouringEngine = new PouringEngine(this.sceneManager, this.beaker3D);
            this.separationEngine.setPouringEngine(this.pouringEngine);
            this.dragControls = new DragControls3D(
                this.sceneManager,
                this.materialsShelf,
                this.tools3D,
                this.beaker3D,
                this.pouringEngine,
                this.separationEngine,
                this.uiOverlay
            );

            // Start 3D Render Loop
            if (this.sceneManager && this.sceneManager.renderer) {
                this.sceneManager.startLoop();
            }
        } catch (err) {
            console.error("3D Lab scene initialization handled:", err);
        }
    }

    initModeSwitcher() {
        const btn3D = document.getElementById('btnMode3D');
        const btnQuiz = document.getElementById('btnModeQuiz');
        const labContainer = document.querySelector('.lab-container-v2');
        const eduPanel = document.getElementById('educationalPanel');

        if (!btn3D || !btnQuiz || !labContainer || !eduPanel) return;

        btn3D.addEventListener('click', (e) => {
            e.preventDefault();
            btn3D.classList.add('active');
            btnQuiz.classList.remove('active');

            labContainer.style.display = 'flex';
            eduPanel.style.display = 'none';

            // Smooth resize & camera frustum refresh when returning to 3D mode
            setTimeout(() => {
                if (this.sceneManager && typeof this.sceneManager.onResize === 'function') {
                    this.sceneManager.onResize();
                }
            }, 50);
        });

        btnQuiz.addEventListener('click', (e) => {
            e.preventDefault();
            btnQuiz.classList.add('active');
            btn3D.classList.remove('active');

            labContainer.style.display = 'none';
            eduPanel.style.display = 'block';
        });
    }
}

// Instantiate App when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new SeparationApp();
});
