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
        if (!this.canvas) return;

        this.init();
    }

    init() {
        // 1. Core Scene Manager
        this.sceneManager = new SceneManager(this.canvas);

        // 2. Beaker 3D Object & Fluids
        this.beaker3D = new Beaker3D(this.sceneManager);

        // 3. Raw Materials Shelf (Top Back)
        this.materialsShelf = new MaterialsShelf(this.sceneManager);

        // 4. Interactive Tools 3D (Side Equipment Racks)
        this.tools3D = new Tools3D(this.sceneManager);

        // 5. UI Overlay
        this.uiOverlay = new UIOverlay(this.beaker3D, this.materialsShelf, this.tools3D, this.sceneManager);

        // 6. Separation Physics Engine
        this.separationEngine = new SeparationEngine(this.sceneManager, this.beaker3D, this.uiOverlay);

        // 7. Pouring Engine (Pouring animations)
        this.pouringEngine = new PouringEngine(this.sceneManager, this.beaker3D);
        this.separationEngine.setPouringEngine(this.pouringEngine);

        // 8. 3D Drag & Drop Controls
        this.dragControls = new DragControls3D(
            this.sceneManager,
            this.materialsShelf,
            this.tools3D,
            this.beaker3D,
            this.pouringEngine,
            this.separationEngine,
            this.uiOverlay
        );

        // 9. Educational Concepts, Properties Table & Interactive Quiz Engine
        this.quizEngine = new QuizEngine('educationalPanel');
        this.quizEngine.init();

        // 10. Bind Header Mode Switcher Controls
        this.initModeSwitcher();

        // Start 3D Render Loop
        this.sceneManager.startLoop();
    }

    initModeSwitcher() {
        const btn3D = document.getElementById('btnMode3D');
        const btnQuiz = document.getElementById('btnModeQuiz');
        const labContainer = document.querySelector('.lab-container-v2');
        const eduPanel = document.getElementById('educationalPanel');

        if (!btn3D || !btnQuiz || !labContainer || !eduPanel) return;

        btn3D.addEventListener('click', () => {
            btn3D.classList.add('active');
            btnQuiz.classList.remove('active');

            labContainer.style.display = 'flex';
            eduPanel.style.display = 'none';

            // Smooth resize & camera frustum refresh when returning to 3D mode
            setTimeout(() => {
                this.sceneManager.onResize();
            }, 50);
        });

        btnQuiz.addEventListener('click', () => {
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
