/**
 * dropperEngine.js - Reagent Dropper Bottle Interactions
 */

import { soundFx } from './audioManager.js';
import { AgglutinationRenderer } from './agglutinationRenderer.js';

export class DropperEngine {
    constructor(store) {
        this.store = store;
    }

    init() {
        const bottles = document.querySelectorAll('.reagent-bottle');
        bottles.forEach(bottle => {
            bottle.addEventListener('click', (e) => this.handleBottleClick(e));
            bottle.addEventListener('dragstart', (e) => {
                const reagent = bottle.dataset.reagent;
                e.dataTransfer.setData('text/plain', reagent);
            });
        });

        const wells = document.querySelectorAll('.well-depression');
        wells.forEach(well => {
            well.addEventListener('dragover', (e) => e.preventDefault());
            well.addEventListener('drop', (e) => {
                e.preventDefault();
                const reagent = e.dataTransfer.getData('text/plain');
                const targetWell = well.closest('.well-cell').dataset.well;
                if (reagent === targetWell) {
                    this.applyReagent(targetWell);
                }
            });
        });
    }

    handleBottleClick(e) {
        const bottle = e.currentTarget;
        const reagent = bottle.dataset.reagent;
        this.applyReagent(reagent);
    }

    applyReagent(wellId) {
        const wellState = this.store.state.wells[wellId];
        if (!wellState || wellState.reagent) return;

        soundFx.playDrop();
        const colors = {
            anti_a: 'rgba(37, 99, 235, 0.45)',
            anti_b: 'rgba(234, 179, 8, 0.45)',
            anti_d: 'rgba(241, 245, 249, 0.65)'
        };
        wellState.reagentColor = colors[wellId];
        this.store.addReagentToWell(wellId);

        const canvas = document.getElementById(`canvas_${wellId}`);
        AgglutinationRenderer.renderWellCanvas(canvas, wellState);
    }
}
