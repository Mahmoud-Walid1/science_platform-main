/**
 * app.js - Blood Typing Simulation Entry Point & Coordinator
 */

import { labStore } from './stateManager.js';
import { LabScene } from './labScene.js';
import { DropperEngine } from './dropperEngine.js';
import { PipetteEngine } from './pipetteEngine.js';
import { MixingEngine } from './mixingEngine.js';
import { StepperGuide } from './stepperGuide.js';
import { NotebookManager } from './notebookManager.js';

class BloodTypingApp {
    init() {
        const stageContainer = document.getElementById('stageLabWorkspace');
        const notebookContainer = document.getElementById('notebookSection');

        if (!stageContainer || !notebookContainer) return;

        this.scene = new LabScene(stageContainer, labStore);
        this.scene.render();

        this.notebook = new NotebookManager(notebookContainer, labStore);
        this.notebook.render();

        this.dropper = new DropperEngine(labStore);
        this.dropper.init();

        this.pipette = new PipetteEngine(labStore);
        this.pipette.init();

        this.mixing = new MixingEngine(labStore);
        this.mixing.init();

        this.stepper = new StepperGuide(labStore);
        this.stepper.init();

        labStore.subscribe(() => {
            // Auto re-render when patient resets
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new BloodTypingApp();
    app.init();
    window.bloodTypingLab = app;
});
