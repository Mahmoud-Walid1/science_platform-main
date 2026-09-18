/**
 * pipetteEngine.js - Micropipette Blood Sampling & Dispensing Engine
 */

import { soundFx } from './audioManager.js';
import { AgglutinationRenderer } from './agglutinationRenderer.js';

export class PipetteEngine {
    constructor(store) {
        this.store = store;
    }

    init() {
        const pipette = document.getElementById('micropipetteTool');
        const tubes = document.querySelectorAll('.blood-tube-item');
        const wells = document.querySelectorAll('.well-depression');

        tubes.forEach(tube => {
            tube.addEventListener('click', () => {
                const pIdx = parseInt(tube.dataset.patientIndex, 10);
                if (this.store.state.activePatientIndex !== pIdx) {
                    this.store.state.activePatientIndex = pIdx;
                    this.store.notify();
                }
                this.loadBloodFromTube();
            });
        });

        if (pipette) {
            pipette.addEventListener('click', () => {
                if (!this.store.state.pipetteLoaded) {
                    this.loadBloodFromTube();
                }
            });
        }

        wells.forEach(well => {
            well.addEventListener('click', () => {
                // Direct click dispensing is prevented; user must drag and drop the loaded pipette
            });
        });
    }

    loadBloodFromTube() {
        this.store.state.pipetteLoaded = true;
        soundFx.playPipetteClick();
        const tip = document.getElementById('pipetteTip');
        if (tip) tip.classList.add('has-blood');
        if (this.store.state.currentStep === 1) {
            this.store.setStep(2);
        }
    }

    dispenseBloodToWell(wellId) {
        if (!this.store.state.pipetteLoaded) return;
        const wellState = this.store.state.wells[wellId];
        if (!wellState || wellState.blood) return;

        soundFx.playDrop();
        this.store.addBloodToWell(wellId);
        const canvas = document.getElementById(`canvas_${wellId}`);
        AgglutinationRenderer.renderWellCanvas(canvas, wellState);

        const allFilled = ['anti_a', 'anti_b', 'anti_d'].every(id => this.store.state.wells[id]?.blood);
        if (allFilled) {
            const pipette = document.getElementById('micropipetteTool');
            const slot = document.getElementById('micropipetteSlot') || document.querySelector('.tools-cluster');
            if (pipette && slot && pipette.parentElement !== slot) {
                pipette.classList.remove('is-dragging', 'in-use-hover');
                pipette.style.left = '';
                pipette.style.top = '';
                pipette.style.position = '';
                pipette.style.transform = '';
                slot.appendChild(pipette);
            }
            const tip = document.getElementById('pipetteTip');
            if (tip) tip.classList.remove('has-blood');
            this.store.state.pipetteLoaded = false;
        }
    }
}
