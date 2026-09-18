/**
 * stateManager.js - Reactive Laboratory State Store
 */

import { PATIENTS_DATABASE, ALL_8_BLOOD_TYPES } from './types.js';

class StateManager {
    constructor() {
        this.listeners = [];
        this.state = {
            currentStep: 1,
            activePatientIndex: 0,
            sampleHistory: [],
            wells: {
                anti_a: { reagent: false, blood: false, stirred: false, aggregated: false, reagentColor: 'rgba(37, 99, 235, 0.55)' },
                anti_b: { reagent: false, blood: false, stirred: false, aggregated: false, reagentColor: 'rgba(234, 179, 8, 0.55)' },
                anti_d: { reagent: false, blood: false, stirred: false, aggregated: false, reagentColor: 'rgba(241, 245, 249, 0.75)' }
            },
            pipetteLoaded: false,
            activeDropper: null
        };
        this.randomizeAllPatients();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        listener(this.state);
    }

    notify() {
        this.listeners.forEach(fn => fn(this.state));
    }

    getActivePatient() {
        return PATIENTS_DATABASE[this.state.activePatientIndex];
    }

    randomizeAllPatients() {
        // Shuffle ALL_8_BLOOD_TYPES to assign completely UNIQUE non-repeating blood types
        const shuffled = [...ALL_8_BLOOD_TYPES].sort(() => Math.random() - 0.5);
        PATIENTS_DATABASE.forEach((patient, idx) => {
            const selected = shuffled[idx % shuffled.length];
            patient.bloodType = selected.bloodType;
            patient.rhFactor = selected.rhFactor;
            patient.reactions = { ...selected.reactions };
        });
    }

    recordSampleResult(resultData) {
        const existingIdx = this.state.sampleHistory.findIndex(h => h.patientIndex === resultData.patientIndex);
        if (existingIdx >= 0) {
            this.state.sampleHistory[existingIdx] = resultData;
        } else {
            this.state.sampleHistory.push(resultData);
        }
        this.notify();
    }

    setPatientIndex(index) {
        if (index >= 0 && index < PATIENTS_DATABASE.length) {
            this.state.activePatientIndex = index;
            this.resetWells();
            this.notify();
        }
    }

    restartExperiment() {
        this.randomizeAllPatients();
        this.state.activePatientIndex = 0;
        this.state.sampleHistory = [];
        this.resetWells();
        if (window.labInteraction) {
            window.labInteraction.returnPipetteToStand();
            window.labInteraction.restoreBottlesToRack();
            window.labInteraction.returnStirStickToStand();
        }
        this.notify();
    }

    setStep(stepNumber) {
        this.state.currentStep = Math.max(1, Math.min(6, stepNumber));
        this.notify();
    }

    setPlatePositioned(isPositioned) {
        this.state.platePositioned = isPositioned;
        this.notify();
    }

    addReagentToWell(wellId) {
        if (this.state.wells[wellId]) {
            this.state.wells[wellId].reagent = true;
            this.checkReagentsComplete();
            this.notify();
        }
    }

    addBloodToWell(wellId) {
        if (this.state.wells[wellId]) {
            this.state.wells[wellId].blood = true;
            this.checkBloodComplete();
            this.notify();
        }
    }

    stirWell(wellId) {
        if (this.state.wells[wellId] && this.state.wells[wellId].blood && this.state.wells[wellId].reagent) {
            this.state.wells[wellId].stirred = true;
            const patient = this.getActivePatient();
            this.state.wells[wellId].aggregated = !!patient.reactions[wellId];
            this.checkStirComplete();
            this.notify();
        }
    }

    checkReagentsComplete() {
        const { anti_a, anti_b, anti_d } = this.state.wells;
        const hasReagents = anti_a.reagent && anti_b.reagent && anti_d.reagent;
        const hasBlood = anti_a.blood && anti_b.blood && anti_d.blood;
        const hasStirred = anti_a.stirred && anti_b.stirred && anti_d.stirred;

        if (hasReagents) {
            if (hasBlood && hasStirred) {
                this.setStep(6);
            } else if (hasBlood) {
                this.setStep(5);
            } else {
                if (!this.state.pipetteLoaded) {
                    this.setStep(1);
                } else {
                    this.setStep(2);
                }
            }
        }
    }

    checkBloodComplete() {
        const { anti_a, anti_b, anti_d } = this.state.wells;
        const hasReagents = anti_a.reagent && anti_b.reagent && anti_d.reagent;
        const hasBlood = anti_a.blood && anti_b.blood && anti_d.blood;
        const hasStirred = anti_a.stirred && anti_b.stirred && anti_d.stirred;

        if (hasBlood) {
            if (hasReagents) {
                if (hasStirred) {
                    this.setStep(6);
                } else {
                    this.setStep(5);
                }
            } else {
                this.setStep(3);
            }
        }
    }

    checkStirComplete() {
        const { anti_a, anti_b, anti_d } = this.state.wells;
        const hasReagents = anti_a.reagent && anti_b.reagent && anti_d.reagent;
        const hasBlood = anti_a.blood && anti_b.blood && anti_d.blood;
        const hasStirred = anti_a.stirred && anti_b.stirred && anti_d.stirred;

        if (hasStirred) {
            if (hasReagents && hasBlood) {
                this.setStep(6);
            } else if (!hasBlood) {
                this.setStep(1);
            } else if (!hasReagents) {
                this.setStep(3);
            }
        }
    }

    resetWells() {
        this.state.platePositioned = false;
        this.state.currentStep = 1;
        this.state.pipetteLoaded = false;
        this.state.wellsEvaluated = false;
        this.state.wells = {
            anti_a: { reagent: false, blood: false, stirred: false, aggregated: false },
            anti_b: { reagent: false, blood: false, stirred: false, aggregated: false },
            anti_d: { reagent: false, blood: false, stirred: false, aggregated: false }
        };
        this.notify();
    }
}

export const labStore = new StateManager();
