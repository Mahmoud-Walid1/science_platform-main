/**
 * labScene.js - Realistic Virtual Laboratory Visual Elements
 */

import { PATIENTS_DATABASE } from './types.js';

export class LabScene {
    constructor(container, store) {
        this.container = container;
        this.store = store;
    }

    render() {
        this.container.innerHTML = `
            <div class="lab-workspace-stage">
                <!-- Background bench shadow & surface -->
                <div class="lab-bench-surface"></div>

                <!-- Sample Tubes Rack with Purple/Mauve EDTA Caps -->
                <div class="rack-container" id="tubeRack">
                    <div class="rack-label">حامل العينات (EDTA)</div>
                    <div class="rack-tubes-grid">
                        ${PATIENTS_DATABASE.map((patient, idx) => `
                            <div class="blood-tube-item ${this.store.state.activePatientIndex === idx ? 'selected' : ''}" 
                                 data-patient-index="${idx}" id="tubePatient${idx + 1}">
                                <div class="tube-cap-purple"></div>
                                <div class="tube-glass-body">
                                    <div class="tube-label">${idx + 1}</div>
                                    <div class="tube-blood-level"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Reagents Dropper Rack: Anti-A (Blue), Anti-B (Yellow), Anti-D (Colorless) -->
                <div class="reagents-rack" id="reagentsRack">
                    <div class="reagent-slot" id="slot_anti_a">
                        <div class="reagent-bottle blue" data-reagent="anti_a" draggable="true" id="bottleAntiA">
                            <div class="dropper-cap"></div>
                            <div class="bottle-body">Anti-A (IgM)</div>
                        </div>
                    </div>
                    <div class="reagent-slot" id="slot_anti_b">
                        <div class="reagent-bottle yellow" data-reagent="anti_b" draggable="true" id="bottleAntiB">
                            <div class="dropper-cap"></div>
                            <div class="bottle-body">Anti-B (IgM)</div>
                        </div>
                    </div>
                    <div class="reagent-slot" id="slot_anti_d">
                        <div class="reagent-bottle colorless" data-reagent="anti_d" draggable="true" id="bottleAntiD">
                            <div class="dropper-cap"></div>
                            <div class="bottle-body">Anti-D (IgG)</div>
                        </div>
                    </div>
                </div>

                <!-- Reaction Tile / Well Plate -->
                <div class="reaction-plate-wrapper" id="reactionPlate">
                    <div class="plate-header-row">
                        <div class="plate-title">بطاقة التفاعل</div>
                        <button class="btn-clean-wells" id="btnCleanWells" type="button" title="مسح وتنظيف الآبار لإعادة التجربة على نفس العينة">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2">
                                <path d="M2.5 2v6h6M21.5 22v-6h-6"></path>
                                <path d="M22 11.5A10 10 0 0 0 3.2 7.2L2.5 8M2 12.5a10 10 0 0 0 18.8 4.3l.7-.8"></path>
                            </svg>
                            <span>مسح الآبار</span>
                        </button>
                    </div>
                    <div class="plate-wells-row">
                        <div class="well-cell" data-well="anti_a">
                            <div class="well-badge blue">Anti-A</div>
                            <div class="well-depression" id="wellDepression_anti_a">
                                <canvas width="80" height="80" id="canvas_anti_a"></canvas>
                            </div>
                        </div>
                        <div class="well-cell" data-well="anti_b">
                            <div class="well-badge yellow">Anti-B</div>
                            <div class="well-depression" id="wellDepression_anti_b">
                                <canvas width="80" height="80" id="canvas_anti_b"></canvas>
                            </div>
                        </div>
                        <div class="well-cell" data-well="anti_d">
                            <div class="well-badge purple">Anti-D</div>
                            <div class="well-depression" id="wellDepression_anti_d">
                                <canvas width="80" height="80" id="canvas_anti_d"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Lab Instruments & Tools -->
                    <div class="micropipette-tool" id="micropipetteTool" title="ماصة آلية دقيقة">
                        <div class="pipette-plunger-cap"></div>
                        <div class="pipette-plunger-stem"></div>
                        <div class="pipette-finger-hook"></div>
                        <div class="pipette-upper-casing"></div>
                        <div class="pipette-collar-blue"></div>
                        <div class="pipette-lower-barrel"></div>
                        <div class="pipette-steel-shaft"></div>
                        <div class="pipette-cone-tip" id="pipetteTip"></div>
                    </div>
                    <div class="stir-stick-slot" id="stirStickSlot">
                        <div class="stir-stick-tool" id="stirStickTool" title="عود مزج معقم"></div>
                        <span class="stir-stick-side-tag">عود المزج</span>
                    </div>
                    <div class="biohazard-bin" title="حاوية النفايات الحيوية">
                        <svg class="biohazard-svg" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                </div>
            </div>
        `;
    }
}
