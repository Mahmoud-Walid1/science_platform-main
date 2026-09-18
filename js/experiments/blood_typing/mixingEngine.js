/**
 * mixingEngine.js - Well Stirring & Agglutination Trigger Engine
 */

import { soundFx } from './audioManager.js';
import { AgglutinationRenderer } from './agglutinationRenderer.js';

export class MixingEngine {
    constructor(store) {
        this.store = store;
    }

    init() {
        const stick = document.getElementById('stirStickTool');
        const wells = document.querySelectorAll('.well-depression');

        wells.forEach(well => {
            well.addEventListener('dblclick', () => {
                const targetWell = well.closest('.well-cell').dataset.well;
                this.stir(targetWell);
            });
        });

        if (stick) {
            stick.addEventListener('click', () => {
                // Stir all eligible wells in sequence
                ['anti_a', 'anti_b', 'anti_d'].forEach((id, idx) => {
                    setTimeout(() => this.stir(id), idx * 250);
                });
            });
        }
    }

    stir(wellId) {
        const wellState = this.store.state.wells[wellId];
        if (!wellState || !wellState.reagent || !wellState.blood || wellState.stirred) return;

        soundFx.playStir();
        this.store.stirWell(wellId);
        const canvas = document.getElementById(`canvas_${wellId}`);
        AgglutinationRenderer.renderWellCanvas(canvas, wellState);
    }
}
