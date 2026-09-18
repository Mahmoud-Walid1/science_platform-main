/**
 * stepperGuide.js - Educational Stepper & Step Instruction Panel
 */

import { STEP_DEFINITIONS, PATIENTS_DATABASE } from './types.js';

export class StepperGuide {
    constructor(store) {
        this.store = store;
    }

    init() {
        this.renderStepper();
        this.renderInstructions();
        this.bindEvents();

        this.store.subscribe((state) => {
            this.updateActiveStep(state.currentStep);
            this.updateSampleSwitcher(state.activePatientIndex);
        });
    }

    renderStepper() {
        const stepperContainer = document.getElementById('stepsNav');
        if (!stepperContainer) return;
        stepperContainer.innerHTML = STEP_DEFINITIONS.map(item => `
            <div class="step-nav-item ${item.step === 1 ? 'active' : ''}" data-step="${item.step}">
                <div class="step-circle">${item.step}</div>
                <div class="step-title">${item.title}</div>
            </div>
        `).join('');
    }

    renderInstructions() {
        const step = this.store.state.currentStep;
        const currentDef = STEP_DEFINITIONS.find(d => d.step === step) || STEP_DEFINITIONS[0];
        const titleEl = document.getElementById('stepCounterText');
        const textEl = document.getElementById('stepInstructionText');
        if (titleEl) titleEl.textContent = `الخطوة ${currentDef.step} من 6`;
        if (textEl) textEl.textContent = currentDef.instruction;
    }

    updateActiveStep(stepNum) {
        document.querySelectorAll('.step-nav-item').forEach(el => {
            const s = parseInt(el.dataset.step, 10);
            el.classList.toggle('active', s === stepNum);
            el.classList.toggle('completed', s < stepNum);
        });
        this.renderInstructions();
    }

    updateSampleSwitcher(patientIdx) {
        const label = document.getElementById('sampleSwitcherLabel');
        if (label) {
            label.textContent = `العينة ${patientIdx + 1} من ${PATIENTS_DATABASE.length}`;
        }
    }

    bindEvents() {
        const nextBtn = document.getElementById('nextStepBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.store.setStep(this.store.state.currentStep + 1);
            });
        }
        const prevSampleBtn = document.getElementById('prevSampleBtn');
        const nextSampleBtn = document.getElementById('nextSampleBtn');
        if (prevSampleBtn) {
            prevSampleBtn.addEventListener('click', () => {
                const cur = this.store.state.activePatientIndex;
                this.store.setPatientIndex(cur > 0 ? cur - 1 : PATIENTS_DATABASE.length - 1);
            });
        }
        if (nextSampleBtn) {
            nextSampleBtn.addEventListener('click', () => {
                const cur = this.store.state.activePatientIndex;
                this.store.setPatientIndex((cur + 1) % PATIENTS_DATABASE.length);
            });
        }
    }
}
