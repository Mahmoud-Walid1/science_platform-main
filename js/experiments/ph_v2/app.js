// js/experiments/ph_v2/app.js
import * as THREE from 'three';
import { SceneManager } from './sceneManager.js';
import { Beaker3D } from './beaker3D.js';
import { LitmusPapers } from './litmusPapers.js';
import { PhMeter } from './phMeter.js';
import { PhEngine, SOLUTIONS_DB } from './phEngine.js';
import { DragControls3D } from './dragControls.js';
import { UIOverlay } from './uiOverlay.js';
import { QuizEngine } from './quizEngine.js';

class PhApp {
    constructor() {
        this.canvas = document.getElementById('canvas3d');
        if (!this.canvas) return;

        // Camera positioning
        this.cameraPos = new THREE.Vector3(0, 2.0, 5.6);
        this.cameraLookAt = new THREE.Vector3(0, 0.35, 0);

        this.init();
    }

    init() {
        // 1. Core Scene Manager
        this.sceneManager = new SceneManager(this.canvas);
        this.sceneManager.camera.position.copy(this.cameraPos);
        this.sceneManager.camera.lookAt(this.cameraLookAt);

        // 2. Beakers Mesh (Spawns all 5 side-by-side)
        this.beaker3D = new Beaker3D(this.sceneManager);

        // 3. Litmus Papers (Visible from start)
        this.litmusPapers = new LitmusPapers(this.sceneManager);
        this.litmusPapers.setVisible(true);

        // 4. Digital pH Meter (Visible from start)
        this.phMeter = new PhMeter(this.sceneManager);
        this.phMeter.setVisible(true);

        // 5. HTML UI Overlay
        this.uiOverlay = new UIOverlay(this.sceneManager, this.litmusPapers, this.phMeter);

        // 6. Chemical Logic Engine
        this.phEngine = new PhEngine(this.beaker3D, this.litmusPapers, this.phMeter, this.uiOverlay);
        this.uiOverlay.setEngine(this.phEngine);

        // 7. Raycasting pointer controls
        this.dragControls = new DragControls3D(
            this.sceneManager,
            this.litmusPapers,
            this.phMeter,
            this.phEngine
        );

        // 8. Quiz and Observations Panel
        this.quizEngine = new QuizEngine();
        this.quizEngine.init();

        // 9. Coordinate Mode Switcher callback
        this.uiOverlay.setModeChangeCallback((mode) => {
            if (mode === '3d') {
                this.sceneManager.startLoop();
            } else if (mode === 'quiz') {
                this.sceneManager.pauseLoop();
            }
        });

        // Create Beaker labels in DOM below canvas
        this.createBeakerLabelsDOM();

        // Bind custom updates to the sceneManager rendering loop
        this.sceneManager.tick = () => this.customTick();

        // Start Three.js loops
        this.sceneManager.startLoop();
    }

    createBeakerLabelsDOM() {
        const labelsContainer = document.getElementById('beakerLabels');
        if (!labelsContainer) return;
        labelsContainer.innerHTML = '';

        const formattedNames = {
            lemon: "عصير<br>الليمون",
            vinegar: "الخل<br>الأبيض",
            water: "الماء<br>المقطر",
            bicarb: "بيكربونات<br>الصوديوم",
            soap: "ماء<br>وصابون"
        };

        // Beaker Labels
        Object.keys(SOLUTIONS_DB).forEach(key => {
            const div = document.createElement('div');
            div.className = 'beaker-label vertical-label';
            div.id = `label-${key}`;
            div.innerHTML = formattedNames[key] || SOLUTIONS_DB[key].name;
            labelsContainer.appendChild(div);
        });

        // Extra Box & Trash Bin Labels
        this.extraLabels = [
            { id: "blueBox", name: "أوراق زرقاء 🟦", pos: new THREE.Vector3(-3.6, -0.05, 0.2) },
            { id: "redBox", name: "أوراق حمراء 🟥", pos: new THREE.Vector3(-2.9, -0.05, 0.2) },
            { id: "trashBin", name: "سلة المهملات 🗑️", pos: new THREE.Vector3(4.3, -0.05, 0.2) }
        ];

        this.extraLabels.forEach(ext => {
            const div = document.createElement('div');
            div.className = 'beaker-label extra-label';
            div.id = `label-extra-${ext.id}`;
            div.innerText = ext.name;
            labelsContainer.appendChild(div);
        });
    }

    customTick() {
        if (!this.sceneManager.isLoopRunning) return;
        
        // 1. Run rendering ticks
        requestAnimationFrame(() => this.sceneManager.tick());
        this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);

        // 2. Run smooth updates for litmus papers and pH meter zoom lerp
        if (this.litmusPapers) {
            this.litmusPapers.update();
        }
        if (this.phMeter) {
            this.phMeter.update();
        }

        // 3. Project 3D positions of the 5 beakers to float HTML labels
        const tempV = new THREE.Vector3();
        const widthHalf = this.canvas.clientWidth / 2;
        const heightHalf = this.canvas.clientHeight / 2;
        const cam = this.sceneManager.camera;

        Object.keys(this.beaker3D.beakers).forEach(key => {
            const beaker = this.beaker3D.beakers[key];
            const labelEl = document.getElementById(`label-${key}`);
            if (labelEl) {
                beaker.group.getWorldPosition(tempV);
                tempV.y -= 0.15;
                tempV.project(cam);

                const x = (tempV.x * widthHalf) + widthHalf;
                const y = -(tempV.y * heightHalf) + heightHalf;

                labelEl.style.left = `${x}px`;
                labelEl.style.top = `${y}px`;
            }
        });

        // 4. Project Extra Labels (Boxes & Trash Bin)
        if (this.extraLabels) {
            this.extraLabels.forEach(ext => {
                const labelEl = document.getElementById(`label-extra-${ext.id}`);
                if (labelEl) {
                    tempV.copy(ext.pos);
                    tempV.project(cam);

                    const x = (tempV.x * widthHalf) + widthHalf;
                    const y = -(tempV.y * heightHalf) + heightHalf;

                    labelEl.style.left = `${x}px`;
                    labelEl.style.top = `${y}px`;
                }
            });
        }
    }
}

// Bootstrap application on DOM load
window.addEventListener('DOMContentLoaded', () => {
    new PhApp();
});
