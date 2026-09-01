/**
 * teacherUI.js
 * Clean Architecture - Teacher Dock, Left Explanation Panel & Division Type Switcher UI Controller
 */

import { soundManager } from './soundManager.js';

export class TeacherUI {
    constructor(microscopeRenderer, mitosisEngine, meiosisEngine, timeLapseScrubber, spotlightEngine, annotationEngine, calloutLabels, chromosome3DEngine, splitScreenEngine) {
        this.microscope = microscopeRenderer;
        this.mitosis = mitosisEngine;
        this.meiosis = meiosisEngine;
        this.scrubber = timeLapseScrubber;
        this.spotlight = spotlightEngine;
        this.annotation = annotationEngine;
        this.callouts = calloutLabels;
        this.chromosome3D = chromosome3DEngine;
        this.splitScreen = splitScreenEngine;

        this.divisionType = 'mitosis'; // 'mitosis' | 'meiosis'

        this.init();
    }

    init() {
        // 1. Fixed Mitosis Division Mode
        this.divisionType = 'mitosis';

        // 2. Interactive Click Inspection on any Cell in the Microscope Field
        const stage = document.getElementById('stagePanel');
        const panelBody = document.getElementById('cellExplanationBody');

        let clickStartX = 0;
        let clickStartY = 0;

        if (stage) {
            stage.addEventListener('mousedown', (e) => {
                clickStartX = e.clientX;
                clickStartY = e.clientY;
            });

            stage.addEventListener('mouseup', (e) => {
                if (e.target.closest('button, input, aside, nav, .cell-explanation-panel')) return;

                const dist = Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY);
                if (dist < 6) {
                    const rect = stage.getBoundingClientRect();
                    const stageX = e.clientX - rect.left;
                    const stageY = e.clientY - rect.top;

                    const width = rect.width;
                    const height = rect.height;

                    const centerX = width / 2 + 100;
                    const centerY = height / 2;

                    const worldX = (stageX - centerX - this.microscope.panX) / this.microscope.zoom;
                    const worldY = (stageY - centerY - this.microscope.panY) / this.microscope.zoom;

                    const activeEngine = this.divisionType === 'mitosis' ? this.mitosis : this.meiosis;
                    const cellInfo = activeEngine.getCellAtWorldPos(worldX, worldY);

                    if (cellInfo && panelBody) {
                        soundManager.playClick();

                        // Update Left Explanation Panel
                        panelBody.innerHTML = `
                            <div class="phase-badge-card">
                                <div class="phase-badge-icon"><i class="fas ${cellInfo.icon}"></i></div>
                                <div class="phase-badge-title">${cellInfo.title}</div>
                            </div>
                            <div class="phase-desc-box">
                                <div class="phase-desc-text">${cellInfo.desc}</div>
                            </div>
                        `;

                        // Synchronize Right Phase Preset Menu Button Highlight
                        document.querySelectorAll('.phase-btn').forEach(btn => {
                            if (btn.getAttribute('data-phase') === cellInfo.phase) {
                                btn.classList.add('active');
                            } else {
                                btn.classList.remove('active');
                            }
                        });
                    }
                }
            });
        }

        // 3. Bind Quick Phase Presets
        this.bindPhaseButtons();

        // 4. Zoom Range Slider (1% to 100%)
        const zoomInput = document.getElementById('zoomRangeInput');
        const zoomBadge = document.getElementById('zoomPercentageBadge');

        if (zoomInput) {
            zoomInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.microscope.setZoomPercent(val);
                if (zoomBadge) {
                    zoomBadge.textContent = `${Math.round(val)}%`;
                }
            });
        }

        // 5. Slide Sample Selector (Toggles between Plant Onion Cells and Somatic Animal Cells)
        const btnSlideSample = document.getElementById('btnSlideSample');
        const slideLabel = document.getElementById('slideSampleLabel');
        if (btnSlideSample) {
            btnSlideSample.addEventListener('click', () => {
                soundManager.playClick();

                let nextType = 'plant';
                let labelText = 'خلايا نباتية (البصل)';

                if (this.microscope.slideType === 'plant') {
                    nextType = 'animal_red';
                    labelText = 'خلايا حيوانية جسدية';
                } else {
                    nextType = 'plant';
                    labelText = 'خلايا نباتية (البصل)';
                }

                this.microscope.setSlideType(nextType);
                if (slideLabel) {
                    slideLabel.textContent = labelText;
                }
            });
        }
    }

    setDivisionType(type) {
        this.divisionType = type;
        if (window.app) {
            window.app.divisionType = type;
        }

        this.renderPhaseButtonsForDivisionType();
    }

    renderPhaseButtonsForDivisionType() {
        const container = document.getElementById('phaseButtonsContainer');
        if (!container) return;

        let buttonsHTML = '';

        if (this.divisionType === 'mitosis') {
            buttonsHTML = `
                <button class="phase-btn active" data-phase="interphase">
                    <span class="phase-title">الطور البيني</span>
                    <span class="phase-sub">Interphase</span>
                </button>
                <button class="phase-btn" data-phase="prophase">
                    <span class="phase-title">الطور التمهيدي</span>
                    <span class="phase-sub">Prophase</span>
                </button>
                <button class="phase-btn" data-phase="metaphase">
                    <span class="phase-title">الطور الاستوائي</span>
                    <span class="phase-sub">Metaphase</span>
                </button>
                <button class="phase-btn" data-phase="anaphase">
                    <span class="phase-title">الطور الانفصالي</span>
                    <span class="phase-sub">Anaphase</span>
                </button>
                <button class="phase-btn" data-phase="telophase">
                    <span class="phase-title">الطور النهائي</span>
                    <span class="phase-sub">Telophase</span>
                </button>
            `;
            this.mitosis.setPhase('interphase');
        } else {
            buttonsHTML = `
                <button class="phase-btn active" data-phase="prophase1">
                    <span class="phase-title">التمهيدي I</span>
                    <span class="phase-sub">Prophase I</span>
                </button>
                <button class="phase-btn" data-phase="metaphase1">
                    <span class="phase-title">الاستوائي I</span>
                    <span class="phase-sub">Metaphase I</span>
                </button>
                <button class="phase-btn" data-phase="anaphase1">
                    <span class="phase-title">الانفصالي I</span>
                    <span class="phase-sub">Anaphase I</span>
                </button>
                <button class="phase-btn" data-phase="telophase1">
                    <span class="phase-title">النهائي I</span>
                    <span class="phase-sub">Telophase I</span>
                </button>
                <button class="phase-btn" data-phase="meiosis2">
                    <span class="phase-title">الميوزي الثاني</span>
                    <span class="phase-sub">Meiosis II</span>
                </button>
            `;
            this.meiosis.setPhase('prophase1');
        }

        container.innerHTML = buttonsHTML;
        this.bindPhaseButtons();
    }

    bindPhaseButtons() {
        const panelBody = document.getElementById('cellExplanationBody');

        document.querySelectorAll('.phase-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                const phase = target.getAttribute('data-phase');

                document.querySelectorAll('.phase-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');

                soundManager.playGlide();
                const activeEngine = this.divisionType === 'mitosis' ? this.mitosis : this.meiosis;
                activeEngine.setPhase(phase);
                this.microscope.glideToPhase(phase);

                // Populate Left Panel with phase info
                const info = activeEngine.phaseInfoMap[phase];
                if (info && panelBody) {
                    panelBody.innerHTML = `
                        <div class="phase-badge-card">
                            <div class="phase-badge-icon"><i class="fas ${info.icon}"></i></div>
                            <div class="phase-badge-title">${info.title}</div>
                        </div>
                        <div class="phase-desc-box">
                            <div class="phase-desc-text">${info.desc}</div>
                        </div>
                    `;
                }
            });
        });
    }
}
