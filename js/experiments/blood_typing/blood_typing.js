/**
 * blood_typing.js - Laboratory Engine for Blood Typing Simulation (ABO & Rh)
 * Authentic Photosynthesis / LabXchange UI Architecture
 */

(function() {
    'use strict';

    // ══════════════════════════════════════════════════════════════
    // 1. Scientific Data & Patient Types
    // ══════════════════════════════════════════════════════════════
    const ALL_8_BLOOD_TYPES = [
        { bloodType: 'A', rhFactor: '+', reactions: { anti_a: true, anti_b: false, anti_d: true } },
        { bloodType: 'A', rhFactor: '-', reactions: { anti_a: true, anti_b: false, anti_d: false } },
        { bloodType: 'B', rhFactor: '+', reactions: { anti_a: false, anti_b: true, anti_d: true } },
        { bloodType: 'B', rhFactor: '-', reactions: { anti_a: false, anti_b: true, anti_d: false } },
        { bloodType: 'AB', rhFactor: '+', reactions: { anti_a: true, anti_b: true, anti_d: true } },
        { bloodType: 'AB', rhFactor: '-', reactions: { anti_a: true, anti_b: true, anti_d: false } },
        { bloodType: 'O', rhFactor: '+', reactions: { anti_a: false, anti_b: false, anti_d: true } },
        { bloodType: 'O', rhFactor: '-', reactions: { anti_a: false, anti_b: false, anti_d: false } }
    ];

    const PATIENTS_DATABASE = [
        { id: 1, name: 'العينة 1', bloodType: 'A', rhFactor: '+', reactions: { anti_a: true, anti_b: false, anti_d: true } },
        { id: 2, name: 'العينة 2', bloodType: 'B', rhFactor: '+', reactions: { anti_a: false, anti_b: true, anti_d: true } },
        { id: 3, name: 'العينة 3', bloodType: 'O', rhFactor: '+', reactions: { anti_a: false, anti_b: false, anti_d: true } },
        { id: 4, name: 'العينة 4', bloodType: 'AB', rhFactor: '+', reactions: { anti_a: true, anti_b: true, anti_d: true } },
        { id: 5, name: 'العينة 5', bloodType: 'A', rhFactor: '-', reactions: { anti_a: true, anti_b: false, anti_d: false } },
        { id: 6, name: 'العينة 6', bloodType: 'B', rhFactor: '-', reactions: { anti_a: false, anti_b: true, anti_d: false } },
        { id: 7, name: 'العينة 7', bloodType: 'AB', rhFactor: '-', reactions: { anti_a: true, anti_b: true, anti_d: false } },
        { id: 8, name: 'العينة 8', bloodType: 'O', rhFactor: '-', reactions: { anti_a: false, anti_b: false, anti_d: false } }
    ];

    const GUIDE_STEPS = [
        {
            id: 1,
            phase: 1,
            letter: 'أ',
            title: 'سحب عينة دم المريض بالماصة:',
            desc: 'انقر على أنبوب العينة المحدد في الحامل (أو اسحب الماصة فوقه) لملء الماصة بدم المريض تمهيداً للتحليل.',
            actionText: 'ملء الماصة بالدم'
        },
        {
            id: 2,
            phase: 1,
            letter: 'ب',
            title: 'إضافة قطرات الدم في الآبار:',
            desc: 'استخدم الماصة الدقيقة لإضافة قطرة دم من عينة المريض في كل بئر من الآبار الثلاثة (أ، ب، د).',
            actionText: 'إضافة قطرات الدم'
        },
        {
            id: 3,
            phase: 2,
            letter: 'ج',
            title: 'إضافة كواشف الأجسام المضادة:',
            desc: 'أضف قطرة من كاشف Anti-A الأزرق، و Anti-B الأصفر، و Anti-D الشفاف فوق قطرات الدم في آبارها المعنية على بطاقة التفاعل.',
            actionText: 'إضافة الكواشف'
        },
        {
            id: 4,
            phase: 2,
            letter: 'د',
            title: 'تجهيز بطاقة التفاعل:',
            desc: 'تأكد من نزول قطرات الكواشف الثلاثة فوق قطرات الدم في الآبار وجاهزيتها لعملية المزج.',
            actionText: 'جاهزية الآبار'
        },
        {
            id: 5,
            phase: 3,
            letter: 'هـ',
            title: 'مزج وخلط العينات:',
            desc: 'استخدم عود المزج لتحريك العينات بلطف في كل بئر لتحفيز تفاعل الالتصاق المناعي (التراص).',
            actionText: 'مزج الآبار'
        },
        {
            id: 6,
            phase: 3,
            letter: 'و',
            title: 'ملاحظة وتدوين النتيجة:',
            desc: 'راقب حدوث التراص (التكتل الحبيبي) وسجل قراءتك في جدول دفتر المختبر واستنتج الفصيلة.',
            actionText: 'فتح دفتر المختبر'
        }
    ];

    // ══════════════════════════════════════════════════════════════
    // 2. Synthesized Web Audio Effects
    // ══════════════════════════════════════════════════════════════
    class LabAudio {
        constructor() {
            this.ctx = null;
        }

        init() {
            try {
                if (!this.ctx) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    if (AudioContext) this.ctx = new AudioContext();
                }
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume();
                }
            } catch (e) {
                console.warn('AudioContext:', e);
            }
        }

        playDrop() {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(650, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.13);
        }

        playPipetteClick() {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.09);
        }

        playStir() {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(280, this.ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.16);
        }

        playSuccess() {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.15, now + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.1);
                osc.stop(now + idx * 0.1 + 0.36);
            });
        }
    }

    const soundFx = new LabAudio();

    // ══════════════════════════════════════════════════════════════
    // 3. Reactive State Store
    // ══════════════════════════════════════════════════════════════
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
                pipetteLoaded: false
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
            // Shuffle ALL_8_BLOOD_TYPES to assign completely UNIQUE non-repeating blood types to all 8 samples
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
            const well = this.state.wells[wellId];
            if (well && well.blood && well.reagent) {
                well.stirred = true;
                const patient = this.getActivePatient();
                well.aggregated = !!patient.reactions[wellId];
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
            this.state.currentStep = 1;
            this.state.pipetteLoaded = false;
            this.state.wellsEvaluated = false;
            this.state.wells = {
                anti_a: { reagent: false, blood: false, stirred: false, aggregated: false, reagentColor: 'rgba(37, 99, 235, 0.55)' },
                anti_b: { reagent: false, blood: false, stirred: false, aggregated: false, reagentColor: 'rgba(234, 179, 8, 0.55)' },
                anti_d: { reagent: false, blood: false, stirred: false, aggregated: false, reagentColor: 'rgba(241, 245, 249, 0.75)' }
            };
            ['anti_a', 'anti_b', 'anti_d'].forEach(id => {
                const dep = document.getElementById(`wellDepression_${id}`);
                if (dep) {
                    dep.className = 'well-depression';
                }
                const c = document.getElementById(`canvas_${id}`);
                if (c) {
                    const ctx = c.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, c.width, c.height);
                }
                const cNb = document.getElementById(`canvas_nb_${id}`);
                if (cNb) {
                    const ctxNb = cNb.getContext('2d');
                    if (ctxNb) ctxNb.clearRect(0, 0, cNb.width, cNb.height);
                }
            });
            const tip = document.getElementById('pipetteTip');
            if (tip) tip.classList.remove('has-blood');
            if (window.labInteraction) {
                window.labInteraction.returnPipetteToStand();
                if (typeof window.labInteraction.resetStirProgress === 'function') {
                    window.labInteraction.resetStirProgress();
                }
            }
            this.notify();
        }
    }

    const labStore = new StateManager();

    // ══════════════════════════════════════════════════════════════
    // 4. Agglutination & Canvas Liquid Renderer
    // ══════════════════════════════════════════════════════════════
    class AgglutinationRenderer {
        static renderWellCanvas(canvas, wellState) {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            const cx = w / 2;
            const cy = h / 2;
            const radius = w * 0.44;

            if (!wellState.reagent && !wellState.blood) return;

            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.clip();

            if (wellState.reagent && !wellState.blood) {
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                if (canvas.id === 'canvas_anti_d' || wellState.wellId === 'anti_d') {
                    // Crystalline water liquid pool with realistic cyan/white sheen for Anti-D
                    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
                    grad.addColorStop(0, 'rgba(240, 249, 255, 0.95)');
                    grad.addColorStop(0.65, 'rgba(186, 230, 253, 0.75)');
                    grad.addColorStop(1, 'rgba(56, 189, 248, 0.85)');
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.strokeStyle = '#0284c7';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    // Gloss reflection arc
                    ctx.beginPath();
                    ctx.arc(cx - 5, cy - 8, radius * 0.45, 0.2, Math.PI * 0.9);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                } else if (canvas.id === 'canvas_anti_a' || wellState.wellId === 'anti_a') {
                    // Vivid Blue Reagent Pool
                    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
                    grad.addColorStop(0, 'rgba(96, 165, 250, 0.9)');
                    grad.addColorStop(1, 'rgba(29, 78, 216, 0.98)');
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.strokeStyle = '#1e3a8a';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    // Gloss reflection
                    ctx.beginPath();
                    ctx.arc(cx - 5, cy - 8, radius * 0.45, 0.2, Math.PI * 0.9);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                } else {
                    // Vivid Yellow Reagent Pool (Anti-B)
                    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
                    grad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
                    grad.addColorStop(1, 'rgba(202, 138, 4, 0.98)');
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.strokeStyle = '#854d0e';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    // Gloss reflection
                    ctx.beginPath();
                    ctx.arc(cx - 5, cy - 8, radius * 0.45, 0.2, Math.PI * 0.9);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
                ctx.restore();
                return;
            }

            if (wellState.blood && !wellState.stirred) {
                if (wellState.reagent) {
                    // Reagent pool + Fresh Blood drop in the center
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    if (canvas.id === 'canvas_anti_a' || wellState.wellId === 'anti_a') {
                        ctx.fillStyle = 'rgba(37, 99, 235, 0.45)';
                    } else if (canvas.id === 'canvas_anti_b' || wellState.wellId === 'anti_b') {
                        ctx.fillStyle = 'rgba(234, 179, 8, 0.45)';
                    } else {
                        ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
                    }
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
                    ctx.fillStyle = '#b91c1c';
                    ctx.fill();
                    ctx.strokeStyle = '#7f1d1d';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(cx - 3, cy - 5, radius * 0.2, 0.3, Math.PI * 0.85);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else {
                    // Fresh Blood drop alone (Phase 1: blood dispensed first)
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * 0.62, 0, Math.PI * 2);
                    const bloodGrad = ctx.createRadialGradient(cx - 2, cy - 3, 2, cx, cy, radius * 0.62);
                    bloodGrad.addColorStop(0, '#ef4444');
                    bloodGrad.addColorStop(0.45, '#dc2626');
                    bloodGrad.addColorStop(1, '#991b1b');
                    ctx.fillStyle = bloodGrad;
                    ctx.fill();
                    ctx.strokeStyle = '#7f1d1d';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Gloss reflection arc
                    ctx.beginPath();
                    ctx.arc(cx - 4, cy - 6, radius * 0.28, 0.3, Math.PI * 0.85);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                }

                ctx.restore();
                return;
            }

            if (wellState.stirred) {
                if (wellState.aggregated) {
                    ctx.fillStyle = '#fee2e2';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#7f1d1d';
                    const clumps = [
                        { x: 0.35, y: 0.35, r: 7 }, { x: 0.65, y: 0.32, r: 9 },
                        { x: 0.5, y: 0.52, r: 10 }, { x: 0.3, y: 0.68, r: 8 },
                        { x: 0.72, y: 0.65, r: 7 }, { x: 0.48, y: 0.28, r: 6 },
                        { x: 0.22, y: 0.48, r: 5 }, { x: 0.75, y: 0.48, r: 8 },
                        { x: 0.58, y: 0.72, r: 6 }, { x: 0.38, y: 0.52, r: 8 }
                    ];
                    clumps.forEach(c => {
                        ctx.beginPath();
                        ctx.arc(cx + (c.x - 0.5) * radius * 1.5, cy + (c.y - 0.5) * radius * 1.5, c.r, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#450a0a';
                        ctx.fillRect(cx + (c.x - 0.5) * radius * 1.5 + 2, cy + (c.y - 0.5) * radius * 1.5 - 2, 2.5, 2.5);
                    });
                } else {
                    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
                    grad.addColorStop(0, '#dc2626');
                    grad.addColorStop(1, '#991b1b');
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, w, h);
                }
            }
            ctx.restore();
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 5. Stage Lab Scene Builder
    // ══════════════════════════════════════════════════════════════
    class LabScene {
        constructor(container) {
            this.container = container;
        }

        render() {
            this.container.innerHTML = `
                <!-- Stage Top Banner (White with Dark Green Pill) -->
                <div class="stage-top-banner" id="stageTopBanner">
                    <div class="banner-step-pill" id="bannerStepPill">الخطوة أ1</div>
                    <div class="banner-instruction-text" id="bannerInstructionText">
                        اختر أنبوب العينة الخاص بالمريض من حامل العينات على طاولة المختبر.
                    </div>
                    <button class="banner-notebook-btn" id="bannerNotebookBtn" type="button" title="فتح دفتر الملاحظات">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        <span>دفتر الملاحظات</span>
                    </button>
                </div>

                <div class="lab-workspace-stage">
                    <!-- Wall Reference Poster (Anti-A, Anti-B, Anti-D) -->
                    <div class="wall-reference-poster">
                        <div class="poster-title">مخطط كواشف فصائل الدم (Blood Typing Reagents)</div>
                        <div class="poster-reagents-row">
                            <div class="poster-reagent-item">
                                <div class="poster-dot blue"></div>
                                <span>Anti-A (أزرق)</span>
                            </div>
                            <div class="poster-reagent-item">
                                <div class="poster-dot yellow"></div>
                                <span>Anti-B (أصفر)</span>
                            </div>
                            <div class="poster-reagent-item">
                                <div class="poster-dot clear"></div>
                                <span>Anti-D (عديم اللون)</span>
                            </div>
                        </div>
                    </div>

                    <!-- Upper Wall Shelf -->
                    <div class="lab-upper-shelf">
                        <div class="shelf-bracket"></div>
                        <div class="shelf-bracket"></div>
                        <div class="shelf-bracket"></div>
                    </div>

                    <!-- Lower Countertop & Cabinets -->
                    <div class="lab-bench-area">
                        <div class="lab-countertop-slab"></div>
                        <div class="lab-cabinet-unit">
                            <div class="cabinet-handle"></div>
                            <div class="cabinet-handle"></div>
                            <div class="cabinet-handle"></div>
                        </div>

                        <!-- Sample Tubes Rack (Purple/Mauve EDTA Caps) -->
                        <div class="rack-container" id="tubeRack">
                            <div class="obj-floating-label">حامل العينات (EDTA)</div>
                            <div class="rack-tubes-grid">
                                ${PATIENTS_DATABASE.map((patient, idx) => `
                                    <div class="blood-tube-item ${labStore.state.activePatientIndex === idx ? 'selected' : ''} ${labStore.state.activePatientIndex === idx && labStore.state.currentStep === 3 ? 'tube-step-target' : ''}" 
                                         data-patient-index="${idx}" id="tubePatient${idx + 1}" title="عينة ${patient.name}">
                                        <div class="tube-cap-purple"></div>
                                        <div class="tube-glass-body">
                                            <div class="tube-label">${idx + 1}</div>
                                            <div class="tube-blood-level"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Reagent Bottles (Anti-A blue, Anti-B yellow, Anti-D colorless) -->
                        <div class="reagents-rack ${labStore.state.currentStep === 1 ? 'reagents-step-target' : ''}" id="reagentsRack">
                            <div class="obj-floating-label">زجاجات الكواشف</div>
                            <div class="reagent-slot" id="slot_anti_a">
                                <div class="reagent-bottle blue" data-reagent="anti_a" id="bottleAntiA" title="Anti-A (أزرق)">
                                    <div class="dropper-cap"></div>
                                    <div class="bottle-body">Anti-A<br>(IgM)</div>
                                </div>
                            </div>
                            <div class="reagent-slot" id="slot_anti_b">
                                <div class="reagent-bottle yellow" data-reagent="anti_b" id="bottleAntiB" title="Anti-B (أصفر)">
                                    <div class="dropper-cap"></div>
                                    <div class="bottle-body">Anti-B<br>(IgM)</div>
                                </div>
                            </div>
                            <div class="reagent-slot" id="slot_anti_d">
                                <div class="reagent-bottle colorless" data-reagent="anti_d" id="bottleAntiD" title="Anti-D (عديم اللون)">
                                    <div class="dropper-cap"></div>
                                    <div class="bottle-body">Anti-D<br>(IgG)</div>
                                </div>
                            </div>
                        </div>

                        <!-- Reaction Plate (3 Wells) -->
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
                                        <canvas width="78" height="78" id="canvas_anti_a"></canvas>
                                    </div>
                                </div>
                                <div class="well-cell" data-well="anti_b">
                                    <div class="well-badge yellow">Anti-B</div>
                                    <div class="well-depression" id="wellDepression_anti_b">
                                        <canvas width="78" height="78" id="canvas_anti_b"></canvas>
                                    </div>
                                </div>
                                <div class="well-cell" data-well="anti_d">
                                    <div class="well-badge purple">Anti-D</div>
                                    <div class="well-depression" id="wellDepression_anti_d">
                                        <canvas width="78" height="78" id="canvas_anti_d"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tools Cluster with Realistic Pro Micropipette -->
                        <div class="tools-cluster">
                            <!-- Micropipette Stand Slot -->
                            <div class="micropipette-slot" id="micropipetteSlot">
                                <div class="obj-floating-label">ماصة سحب الدم</div>
                                
                                <!-- Realistic Research Micropipette -->
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
                            </div>

                            <!-- Accessories Shelf -->
                            <div class="lab-accessories-shelf">
                                <div class="stir-stick-slot" id="stirStickSlot">
                                    <div class="stir-stick-tool" id="stirStickTool" title="عود مزج معقم"></div>
                                    <span class="stir-stick-side-tag">عود المزج</span>
                                </div>
                                <div class="biohazard-bin" title="حاوية المخلفات">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 6. Interactive Sidebar Guide & Steps Controller
    // ══════════════════════════════════════════════════════════════
    class SidebarGuideController {
        init() {
            this.renderSteps();
            this.bindEvents();
            labStore.subscribe(state => this.update(state));
        }

        renderSteps() {
            const list = document.getElementById('sidebarStepsList');
            if (!list) return;

            list.innerHTML = GUIDE_STEPS.map(step => `
                <div class="step-guide-card ${step.id === 1 ? 'active' : ''}" data-step-id="${step.id}" data-phase="${step.phase}">
                    <div class="step-card-header">
                        <div class="step-letter-badge">${step.letter}</div>
                        <div>${step.title}</div>
                    </div>
                    <div class="step-card-body">${step.desc}</div>
                    ${step.id === 6 ? `
                        <div class="step-card-action-container">
                            <button class="step-notebook-btn" type="button" id="cardOpenNotebookBtn" title="فتح دفتر الملاحظات">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                </svg>
                                <span>دفتر الملاحظات</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }

        bindEvents() {
            // Phase tabs
            document.querySelectorAll('.phase-tab-item').forEach(tab => {
                tab.addEventListener('click', () => {
                    const phase = parseInt(tab.dataset.phase, 10);
                    const targetStep = GUIDE_STEPS.find(s => s.phase === phase);
                    if (targetStep) {
                        const card = document.querySelector(`.step-guide-card[data-step-id="${targetStep.id}"]`);
                        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });
            });

            // Sample switcher
            const prev = document.getElementById('prevSampleBtn');
            const next = document.getElementById('nextSampleBtn');
            if (prev) {
                prev.addEventListener('click', () => {
                    const cur = labStore.state.activePatientIndex;
                    labStore.setPatientIndex(cur > 0 ? cur - 1 : PATIENTS_DATABASE.length - 1);
                });
            }
            if (next) {
                next.addEventListener('click', () => {
                    const cur = labStore.state.activePatientIndex;
                    labStore.setPatientIndex((cur + 1) % PATIENTS_DATABASE.length);
                });
            }

            // Toggle sidebar collapse / expand (3 bars button)
            const toggleBtn = document.getElementById('sidebarToggleBtn');
            const hamburgerBtn = document.getElementById('sidebarHamburgerBtn');
            const sidebarPanel = document.getElementById('sidebarGuidePanel') || document.querySelector('.sidebar-panel');
            const mainLayout = document.querySelector('.main-lab-layout');

            const toggleSidebar = (e) => {
                if (e) {
                    e.stopPropagation();
                }
                if (!sidebarPanel) return;
                const isCollapsed = sidebarPanel.classList.toggle('collapsed');
                if (mainLayout) {
                    mainLayout.classList.toggle('sidebar-collapsed', isCollapsed);
                }
                if (toggleBtn) {
                    toggleBtn.setAttribute('title', isCollapsed ? 'إظهار دليل الخطوات' : 'إخفاء دليل الخطوات');
                }
                if (hamburgerBtn) {
                    hamburgerBtn.setAttribute('title', isCollapsed ? 'إظهار دليل الخطوات' : 'إخفاء دليل الخطوات');
                }
                soundFx.playPipetteClick();
            };

            if (toggleBtn) {
                toggleBtn.addEventListener('click', toggleSidebar);
                toggleBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleSidebar(e);
                    }
                });
            } else if (hamburgerBtn) {
                hamburgerBtn.addEventListener('click', toggleSidebar);
            }
        }

        update(state) {
            const currentStep = GUIDE_STEPS.find(s => s.id === state.currentStep) || GUIDE_STEPS[0];

            // 1. Evaluate individual action completion
            const { anti_a, anti_b, anti_d } = state.wells;
            const hasReagents = !!(anti_a.reagent && anti_b.reagent && anti_d.reagent);
            const hasBlood = !!(anti_a.blood && anti_b.blood && anti_d.blood);
            const hasStirred = !!(anti_a.stirred && anti_b.stirred && anti_d.stirred);

            // 2. Strict sequential green requirement:
            // 1, 2, 3 must turn green in order.
            // If action 3 was done earlier, it won't color green until 1 & 2 are done, then colors green automatically!
            const phase1Green = hasBlood;
            const phase2Green = phase1Green && hasReagents;
            const phase3Green = phase1Green && phase2Green && hasStirred;

            const phaseGreenMap = {
                1: phase1Green,
                2: phase2Green,
                3: phase3Green
            };

            // 3. Update top stage banner
            const pill = document.getElementById('bannerStepPill');
            const text = document.getElementById('bannerInstructionText');
            if (pill) pill.textContent = `الخطوة ${currentStep.letter}${currentStep.id}`;
            if (text) text.textContent = currentStep.desc;

            // 4. Update phase tabs
            document.querySelectorAll('.phase-tab-item').forEach(tab => {
                const p = parseInt(tab.dataset.phase, 10);
                const isGreen = !!phaseGreenMap[p];
                const isActive = (p === currentStep.phase) && !isGreen;

                tab.classList.toggle('completed', isGreen);
                tab.classList.toggle('active', isActive || isGreen);
            });

            // 5. Update step cards in sidebar
            const stepCompletedMap = {
                1: state.pipetteLoaded || hasBlood,
                2: phase1Green,
                3: phase1Green && hasReagents,
                4: phase2Green,
                5: phase3Green,
                6: phase3Green && state.wellsEvaluated
            };

            document.querySelectorAll('.step-guide-card').forEach(card => {
                const sId = parseInt(card.dataset.stepId, 10);
                const isDone = !!stepCompletedMap[sId];
                const isActive = (sId === state.currentStep);

                card.classList.toggle('completed', isDone);
                card.classList.toggle('active', isActive || isDone);
            });

            // Switcher label
            const switcherLabel = document.getElementById('sampleSwitcherLabel');
            if (switcherLabel) {
                switcherLabel.textContent = `العينة ${state.activePatientIndex + 1} من ${PATIENTS_DATABASE.length}`;
            }

            // Sync well canvases
            ['anti_a', 'anti_b', 'anti_d'].forEach(id => {
                const canvas = document.getElementById(`canvas_${id}`);
                AgglutinationRenderer.renderWellCanvas(canvas, state.wells[id]);
                const nbCanvas = document.getElementById(`canvas_nb_${id}`);
                AgglutinationRenderer.renderWellCanvas(nbCanvas, state.wells[id]);
            });

            // Highlight the active patient tube when blood needs to be drawn (Step 1)
            document.querySelectorAll('.blood-tube-item').forEach(tube => {
                const pIdx = parseInt(tube.dataset.patientIndex, 10);
                const isCurrent = (pIdx === state.activePatientIndex);
                tube.classList.toggle('selected', isCurrent);
                tube.classList.toggle('tube-step-target', isCurrent && !hasBlood && !state.pipetteLoaded);
            });

            // Highlight reaction plate & empty wells when pipette is loaded with blood (Step 2)
            const reactionPlate = document.getElementById('reactionPlate');
            if (reactionPlate) {
                reactionPlate.classList.toggle('wells-step-target', state.pipetteLoaded && !hasBlood);
            }
            document.querySelectorAll('.well-cell').forEach(cell => {
                const wId = cell.dataset.well;
                const wState = state.wells[wId];
                cell.classList.toggle('well-needs-blood', state.pipetteLoaded && wState && !wState.blood);
            });

            // Highlight the reagents rack when on reagent step (Step 3: after blood is complete)
            const reagentsRack = document.getElementById('reagentsRack');
            if (reagentsRack) {
                const needsReagents = !state.wells.anti_a.reagent || !state.wells.anti_b.reagent || !state.wells.anti_d.reagent;
                reagentsRack.classList.toggle('reagents-step-target', hasBlood && needsReagents);
            }
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 7. Interactive Handlers & Direct Drag & Drop Engine
    // ══════════════════════════════════════════════════════════════
    class InteractionManager {
        constructor() {
            this.pipette = document.getElementById('micropipetteTool');
            this.isDraggingPipette = false;
            this.dragOffset = { x: 0, y: 0 };
            window.labInteraction = this;

            this.bindEvents();
            this.initPipetteDragAndDrop();
            this.initDropperDragAndDrop();
            this.initStirStickDragAndStir();
        }

        bindEvents() {
            // Tubes selection
            document.querySelectorAll('.blood-tube-item').forEach(tube => {
                tube.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const pIdx = parseInt(tube.dataset.patientIndex, 10);
                    if (labStore.state.activePatientIndex !== pIdx) {
                        labStore.setPatientIndex(pIdx);
                    }
                    document.querySelectorAll('.blood-tube-item').forEach(t => t.classList.remove('selected'));
                    tube.classList.add('selected');
                    this.animateSuction();
                    if (labStore.state.currentStep <= 1) {
                        labStore.setStep(2);
                    }
                });
            });

            // Clean Wells Button (مسح الشريحة / تنظيف الآبار)
            const cleanBtn = document.getElementById('btnCleanWells');
            if (cleanBtn) {
                cleanBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    soundFx.playPipetteClick();
                    labStore.resetWells();
                    this.showTemporaryHint(cleanBtn, 'تم مسح وتنظيف الآبار بنجاح');
                });
            }

            // Dropper bottles direct click
            document.querySelectorAll('.reagent-bottle').forEach(bottle => {
                bottle.addEventListener('click', () => {
                    const reagent = bottle.dataset.reagent;
                    this.applyReagent(reagent);
                });
            });

            // Well cell direct click
            document.querySelectorAll('.well-cell').forEach(cell => {
                cell.addEventListener('click', () => {
                    const targetWell = cell.dataset.well;
                    const wState = labStore.state.wells[targetWell];
                    if (!wState.blood) {
                        if (!labStore.state.pipetteLoaded) {
                            this.showTempHint(cell, 'يجب سحب عينة الدم من الأنبوب بالماصة أولاً!');
                            const activeTube = document.querySelector(`.blood-tube-item[data-patient-index="${labStore.state.activePatientIndex}"]`);
                            if (activeTube) activeTube.classList.add('tube-step-target');
                        } else {
                            this.showTempHint(cell, 'اسحب الماصة المحملة بالدم وأفلتها فوق هذا البئر لوضع قطرة الدم!');
                        }
                    } else if (!wState.reagent) {
                        this.applyReagent(targetWell);
                    } else if (!wState.stirred) {
                        this.showTempHint(cell, 'اسحب عود المزج من الرف وحركه داخل البئر بنفسك للمزج!');
                    }
                });
            });

            // Stir stick click hint
            const stick = document.getElementById('stirStickTool');
            if (stick) {
                stick.addEventListener('click', () => {
                    this.showTempHint(stick, 'اسحب عود المزج وضعه داخل البئر وحركه دائرياً للمزج!');
                });
            }
        }

        handleStepAction(stepId) {
            if (stepId === 1) {
                this.animateSuction();
                labStore.setStep(2);
            } else if (stepId === 2) {
                ['anti_a', 'anti_b', 'anti_d'].forEach((id, idx) => {
                    setTimeout(() => this.dispenseBlood(id), idx * 250);
                });
            } else if (stepId === 3 || stepId === 4) {
                ['anti_a', 'anti_b', 'anti_d'].forEach((id, idx) => {
                    setTimeout(() => this.applyReagent(id), idx * 220);
                });
            } else if (stepId === 5) {
                this.animateStickMixingAll();
            } else if (stepId === 6) {
                const openBtn = document.getElementById('openNotebookBtn');
                if (openBtn) openBtn.click();
            }
        }

        initDropperDragAndDrop() {
            document.querySelectorAll('.reagent-bottle').forEach(bottle => {
                let startX = 0;
                let startY = 0;
                let isDragging = false;
                const reagent = bottle.dataset.reagent;

                const onPointerDown = (e) => {
                    startX = e.clientX;
                    startY = e.clientY;
                    isDragging = false;

                    const onPointerMove = (moveEv) => {
                        const dist = Math.hypot(moveEv.clientX - startX, moveEv.clientY - startY);
                        if (!isDragging && dist > 5) {
                            isDragging = true;
                            bottle.classList.add('is-dragging-bottle');
                            document.body.appendChild(bottle);
                        }
                        if (isDragging) {
                            bottle.style.left = `${moveEv.clientX}px`;
                            bottle.style.top = `${moveEv.clientY}px`;
                            this.checkDropperHoverTargets(moveEv.clientX, moveEv.clientY, reagent);
                        }
                    };

                    const onPointerUp = (upEv) => {
                        window.removeEventListener('pointermove', onPointerMove);
                        window.removeEventListener('pointerup', onPointerUp);

                        if (isDragging) {
                            isDragging = false;
                            this.restoreBottlesToRack();
                            this.handleReagentDrop(upEv.clientX, upEv.clientY, reagent);
                            this.clearHoverHighlights();
                        } else {
                            // Direct click
                            this.applyReagent(reagent);
                            this.restoreBottlesToRack();
                        }
                    };

                    window.addEventListener('pointermove', onPointerMove);
                    window.addEventListener('pointerup', onPointerUp);
                };

                bottle.addEventListener('pointerdown', onPointerDown);
            });
        }

        restoreBottlesToRack() {
            ['anti_a', 'anti_b', 'anti_d'].forEach(rId => {
                const bottle = document.querySelector(`.reagent-bottle[data-reagent="${rId}"]`);
                const slot = document.getElementById(`slot_${rId}`);
                if (bottle) {
                    if (slot && bottle.parentElement !== slot) {
                        slot.appendChild(bottle);
                    } else if (!slot) {
                        const rack = document.getElementById('reagentsRack');
                        if (rack && bottle.parentElement !== rack) rack.appendChild(bottle);
                    }
                    bottle.classList.remove('is-dragging-bottle');
                    bottle.style.left = '';
                    bottle.style.top = '';
                    bottle.style.position = '';
                    bottle.style.transform = '';
                    bottle.style.zIndex = '';
                }
            });
        }

        handleReagentDrop(x, y, reagent) {
            // Check target well cell or depression
            const targetCell = document.querySelector(`.well-cell[data-well="${reagent}"]`);
            if (targetCell) {
                const rect = targetCell.getBoundingClientRect();
                if (x >= rect.left - 40 && x <= rect.right + 40 && y >= rect.top - 40 && y <= rect.bottom + 40) {
                    this.applyReagent(reagent);
                    return true;
                }
            }

            // Check entire reaction plate
            const plate = document.getElementById('reactionPlate');
            if (plate) {
                const pRect = plate.getBoundingClientRect();
                if (x >= pRect.left - 20 && x <= pRect.right + 20 && y >= pRect.top - 20 && y <= pRect.bottom + 20) {
                    this.applyReagent(reagent);
                    return true;
                }
            }

            return false;
        }

        checkDropperHoverTargets(x, y, reagent) {
            this.clearHoverHighlights();
            const targetDep = document.getElementById(`wellDepression_${reagent}`);
            const plate = document.getElementById('reactionPlate');
            if (plate && targetDep) {
                const pRect = plate.getBoundingClientRect();
                if (x >= pRect.left - 20 && x <= pRect.right + 20 && y >= pRect.top - 20 && y <= pRect.bottom + 20) {
                    targetDep.classList.add('drop-target');
                }
            }
        }

        initPipetteDragAndDrop() {
            if (!this.pipette) return;

            let startX = 0;
            let startY = 0;
            let isDragging = false;

            const onPointerDown = (e) => {
                startX = e.clientX;
                startY = e.clientY;
                isDragging = false;
                this.pipette.style.transition = 'none';

                const onPointerMove = (moveEv) => {
                    const dist = Math.hypot(moveEv.clientX - startX, moveEv.clientY - startY);
                    if (!isDragging && dist > 5) {
                        isDragging = true;
                        this.pipette.classList.remove('in-use-hover');
                        this.pipette.classList.add('is-dragging');
                        if (this.pipette.parentElement !== document.body) {
                            document.body.appendChild(this.pipette);
                        }
                    }
                    if (isDragging) {
                        this.pipette.style.left = `${moveEv.clientX}px`;
                        this.pipette.style.top = `${moveEv.clientY}px`;
                        this.checkHoverTargets(moveEv.clientX, moveEv.clientY);
                    }
                };

                const onPointerUp = (upEv) => {
                    window.removeEventListener('pointermove', onPointerMove);
                    window.removeEventListener('pointerup', onPointerUp);

                    if (isDragging) {
                        isDragging = false;
                        this.handleDrop(upEv.clientX, upEv.clientY);
                        this.clearHoverHighlights();

                        // Check if all 3 wells have blood
                        const allThreeFilled = ['anti_a', 'anti_b', 'anti_d'].every(id => labStore.state.wells[id]?.blood);

                        if (allThreeFilled) {
                            setTimeout(() => {
                                this.returnPipetteToStand();
                            }, 350);
                        } else if (labStore.state.pipetteLoaded) {
                            // Pipette stays EXACTLY where the user dropped it! No auto-movement!
                            this.pipette.classList.remove('is-dragging');
                            this.pipette.classList.add('in-use-hover');
                            this.pipette.style.position = 'fixed';
                            this.pipette.style.left = `${upEv.clientX}px`;
                            this.pipette.style.top = `${upEv.clientY}px`;
                            this.pipette.style.zIndex = '100';
                            this.pipette.style.transition = 'none';
                        } else {
                            this.returnPipetteToStand();
                        }
                    } else {
                        // Direct click on pipette
                        if (!labStore.state.pipetteLoaded) {
                            this.showTempHint(this.pipette, 'اسحب الماصة وضعها فوق أنبوب الدم لسحب العينة أولاً!');
                            const activeTube = document.querySelector(`.blood-tube-item[data-patient-index="${labStore.state.activePatientIndex}"]`);
                            if (activeTube) activeTube.classList.add('tube-step-target');
                        }
                    }
                };

                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('pointerup', onPointerUp);
            };

            this.pipette.addEventListener('pointerdown', onPointerDown);
        }

        checkHoverTargets(x, y) {
            this.clearHoverHighlights();

            // Find closest tube
            const tubes = document.querySelectorAll('.blood-tube-item');
            let bestTube = null;
            let minTubeDist = Infinity;
            tubes.forEach(tube => {
                const rect = tube.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                // Check within horizontal bounds of this specific tube
                if (Math.abs(x - cx) <= (rect.width / 2 + 10) && y >= rect.top - 25 && y <= rect.bottom + 35) {
                    const dist = Math.hypot(x - cx, y - cy);
                    if (dist < minTubeDist) {
                        minTubeDist = dist;
                        bestTube = tube;
                    }
                }
            });
            if (bestTube) {
                bestTube.classList.add('drop-target');
            }

            // Find closest reaction well
            const wells = document.querySelectorAll('.well-depression');
            let bestWell = null;
            let minWellDist = Infinity;
            wells.forEach(well => {
                const rect = well.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dist = Math.hypot(x - cx, y - cy);
                if (dist <= 52) {
                    if (dist < minWellDist) {
                        minWellDist = dist;
                        bestWell = well;
                    }
                }
            });
            if (bestWell) {
                bestWell.classList.add('drop-target');
            }
        }

        clearHoverHighlights() {
            document.querySelectorAll('.blood-tube-item.drop-target').forEach(el => el.classList.remove('drop-target'));
            document.querySelectorAll('.well-depression.drop-target').forEach(el => el.classList.remove('drop-target'));
        }

        handleDrop(x, y) {
            // 1. Dropped over closest blood tube
            const tubes = document.querySelectorAll('.blood-tube-item');
            let bestTube = null;
            let minTubeDist = Infinity;
            for (let tube of tubes) {
                const rect = tube.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                if (Math.abs(x - cx) <= (rect.width / 2 + 12) && y >= rect.top - 25 && y <= rect.bottom + 35) {
                    const dist = Math.hypot(x - cx, y - cy);
                    if (dist < minTubeDist) {
                        minTubeDist = dist;
                        bestTube = tube;
                    }
                }
            }

            if (bestTube) {
                const pIdx = parseInt(bestTube.dataset.patientIndex, 10);
                if (labStore.state.activePatientIndex !== pIdx) {
                    labStore.setPatientIndex(pIdx);
                }
                document.querySelectorAll('.blood-tube-item').forEach(t => t.classList.remove('selected'));
                bestTube.classList.add('selected');
                this.animateSuction();
                if (labStore.state.currentStep <= 1) labStore.setStep(2);
                return 'tube';
            }

            // 2. Dropped over closest reaction well or cell
            const wells = document.querySelectorAll('.well-cell');
            let bestWell = null;
            let minWellDist = Infinity;
            for (let cell of wells) {
                const rect = cell.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dist = Math.hypot(x - cx, y - cy);
                if (dist <= 55) {
                    if (dist < minWellDist) {
                        minWellDist = dist;
                        bestWell = cell;
                    }
                }
            }

            if (bestWell) {
                const targetWell = bestWell.dataset.well;
                if (!labStore.state.pipetteLoaded) {
                    this.returnPipetteToStand();
                    this.showTempHint(bestWell, 'يجب سحب عينة الدم من الأنبوب أولاً!');
                    soundFx.playPipetteClick();
                    const activeTube = document.querySelector(`.blood-tube-item[data-patient-index="${labStore.state.activePatientIndex}"]`);
                    if (activeTube) {
                        activeTube.classList.add('tube-step-target');
                    }
                    return 'empty_pipette';
                }
                this.dispenseBlood(targetWell);
                return 'well';
            }

            return null;
        }

        animateSuction() {
            labStore.state.pipetteLoaded = true;
            if (labStore.state.currentStep <= 1) {
                labStore.setStep(2);
            }
            soundFx.playPipetteClick();

            const plunger = this.pipette ? (this.pipette.querySelector('.pipette-plunger-cap') || this.pipette.querySelector('.pipette-plunger')) : null;
            if (plunger) {
                plunger.classList.add('plunged');
                setTimeout(() => plunger.classList.remove('plunged'), 250);
            }

            const tip = document.getElementById('pipetteTip');
            if (tip) tip.classList.add('has-blood');
            labStore.notify();
        }

        dispenseBlood(wellId) {
            if (!labStore.state.pipetteLoaded) return;
            const well = labStore.state.wells[wellId];
            if (!well || well.blood) return;

            soundFx.playDrop();
            this.spawnDropAnimation(wellId, 'blood');

            const plunger = this.pipette ? (this.pipette.querySelector('.pipette-plunger-cap') || this.pipette.querySelector('.pipette-plunger')) : null;
            if (plunger) {
                plunger.classList.add('plunged');
                setTimeout(() => plunger.classList.remove('plunged'), 200);
            }

            labStore.addBloodToWell(wellId);
            const canvas = document.getElementById(`canvas_${wellId}`);
            AgglutinationRenderer.renderWellCanvas(canvas, well);
            const nbCanvas = document.getElementById(`canvas_nb_${wellId}`);
            AgglutinationRenderer.renderWellCanvas(nbCanvas, well);

            // Check if all 3 wells now have blood!
            const allThreeFilled = ['anti_a', 'anti_b', 'anti_d'].every(id => labStore.state.wells[id]?.blood);
            if (allThreeFilled) {
                setTimeout(() => {
                    this.returnPipetteToStand();
                }, 350);
            }
        }

        returnPipetteToStand() {
            if (!this.pipette) return;
            this.pipette.classList.remove('is-dragging', 'in-use-hover');
            this.pipette.style.left = '';
            this.pipette.style.top = '';
            this.pipette.style.position = '';
            this.pipette.style.zIndex = '';
            this.pipette.style.transform = '';
            this.pipette.style.transition = '';
            const slot = document.getElementById('micropipetteSlot') || document.querySelector('.tools-cluster');
            if (slot && this.pipette.parentElement !== slot) {
                slot.appendChild(this.pipette);
            }
            const tip = document.getElementById('pipetteTip');
            if (tip) {
                tip.classList.remove('has-blood');
            }
            labStore.state.pipetteLoaded = false;
            this.clearHoverHighlights();
        }

        applyReagent(wellId) {
            const well = labStore.state.wells[wellId];
            if (!well || well.reagent) return;

            soundFx.playDrop();
            const color = wellId === 'anti_a' ? 'blue' : (wellId === 'anti_b' ? 'yellow' : 'clear');
            this.spawnDropAnimation(wellId, color);

            labStore.addReagentToWell(wellId);
            const dep = document.getElementById(`wellDepression_${wellId}`);
            if (dep) {
                dep.classList.add(`reagent-added-${wellId}`);
            }

            const canvas = document.getElementById(`canvas_${wellId}`);
            AgglutinationRenderer.renderWellCanvas(canvas, well);
            const nbCanvas = document.getElementById(`canvas_nb_${wellId}`);
            AgglutinationRenderer.renderWellCanvas(nbCanvas, well);

            this.restoreBottlesToRack();
        }

        spawnDropAnimation(wellId, colorClass) {
            const wellDep = document.getElementById(`wellDepression_${wellId}`);
            if (!wellDep) return;
            const drop = document.createElement('div');
            drop.className = `reagent-droplet-anim ${colorClass}`;
            wellDep.appendChild(drop);
            setTimeout(() => drop.remove(), 400);
        }

        stirWell(wellId) {
            const well = labStore.state.wells[wellId];
            if (!well || !well.reagent || !well.blood || well.stirred) return;

            soundFx.playStir();
            labStore.stirWell(wellId);
            const canvas = document.getElementById(`canvas_${wellId}`);
            AgglutinationRenderer.renderWellCanvas(canvas, well);
            const nbCanvas = document.getElementById(`canvas_nb_${wellId}`);
            AgglutinationRenderer.renderWellCanvas(nbCanvas, well);
        }

        resetStirProgress() {
            this.stirProgressMap = { anti_a: 0, anti_b: 0, anti_d: 0 };
        }

        initStirStickDragAndStir() {
            const stick = document.getElementById('stirStickTool');
            if (!stick) return;

            let isDragging = false;
            let startX = 0, startY = 0;
            let lastX = 0, lastY = 0;
            let lastSoundTime = 0;
            let lastMotionTime = 0;
            let activeWellId = null;
            if (!this.stirProgressMap) {
                this.stirProgressMap = { anti_a: 0, anti_b: 0, anti_d: 0 };
            }

            const onPointerDown = (e) => {
                startX = e.clientX;
                startY = e.clientY;
                lastX = e.clientX;
                lastY = e.clientY;
                isDragging = false;

                const onPointerMove = (moveEv) => {
                    const dist = Math.hypot(moveEv.clientX - startX, moveEv.clientY - startY);
                    if (!isDragging && dist > 4) {
                        isDragging = true;
                        stick.classList.add('is-dragging-stick');
                        document.body.appendChild(stick);
                    }

                    if (isDragging) {
                        stick.style.left = `${moveEv.clientX}px`;
                        stick.style.top = `${moveEv.clientY}px`;

                        const hoveredCell = this.getHoveredWell(moveEv.clientX, moveEv.clientY);
                        if (hoveredCell) {
                            const wId = hoveredCell.dataset.well;
                            const wState = labStore.state.wells[wId];

                            if (wState && wState.reagent && wState.blood && !wState.stirred) {
                                stick.classList.add('is-stirring-anim');
                                const dep = hoveredCell.querySelector('.well-depression');
                                if (dep) dep.classList.add('stir-target');

                                if (activeWellId !== wId) {
                                    activeWellId = wId;
                                    lastMotionTime = Date.now();
                                }

                                const stepMotion = Math.hypot(moveEv.clientX - lastX, moveEv.clientY - lastY);
                                if (stepMotion > 1.2) {
                                    const now = Date.now();
                                    const timeDelta = Math.min(now - lastMotionTime, 80);
                                    lastMotionTime = now;

                                    // Require exactly 1.2 seconds (1200ms) of continuous active stirring motion
                                    this.stirProgressMap[wId] = (this.stirProgressMap[wId] || 0) + (timeDelta / 1200) * 100;
                                    const pct = Math.min(100, Math.floor(this.stirProgressMap[wId]));

                                    if (now - lastSoundTime > 190) {
                                        soundFx.playStir();
                                        lastSoundTime = now;
                                    }

                                    this.clearStirTooltips();

                                    if (pct >= 100) {
                                        this.stirWell(wId);
                                        if (dep) {
                                            dep.classList.remove('stir-target');
                                            dep.classList.add('stir-complete-flash');
                                        }
                                        this.clearStirTooltips();
                                        stick.classList.remove('is-stirring-anim');
                                        activeWellId = null;
                                    }
                                }
                            } else if (wState && wState.stirred) {
                                stick.classList.remove('is-stirring-anim');
                                this.showStirTooltip(hoveredCell, 'تم مزج هذا البئر مسبقاً', true);
                            } else {
                                stick.classList.remove('is-stirring-anim');
                                this.showStirTooltip(hoveredCell, 'أضف الكاشف والدم أولاً');
                            }
                        } else {
                            stick.classList.remove('is-stirring-anim');
                            this.clearStirTooltips();
                            document.querySelectorAll('.well-depression.stir-target').forEach(el => el.classList.remove('stir-target'));
                            activeWellId = null;
                        }

                        lastX = moveEv.clientX;
                        lastY = moveEv.clientY;
                    }
                };

                const onPointerUp = (upEv) => {
                    window.removeEventListener('pointermove', onPointerMove);
                    window.removeEventListener('pointerup', onPointerUp);

                    if (isDragging) {
                        isDragging = false;
                        stick.classList.remove('is-dragging-stick', 'is-stirring-anim');
                        stick.style.left = '';
                        stick.style.top = '';

                        const slot = document.getElementById('stirStickSlot') || document.querySelector('.lab-accessories-shelf');
                        if (slot && stick.parentElement !== slot) {
                            slot.insertBefore(stick, slot.firstChild);
                        }

                        this.clearStirTooltips();
                        document.querySelectorAll('.well-depression.stir-target').forEach(el => el.classList.remove('stir-target'));
                        activeWellId = null;
                    }
                };

                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('pointerup', onPointerUp);
            };

            stick.addEventListener('pointerdown', onPointerDown);
        }

        getHoveredWell(x, y) {
            const cells = document.querySelectorAll('.well-cell');
            for (let cell of cells) {
                const rect = cell.getBoundingClientRect();
                if (x >= rect.left - 20 && x <= rect.right + 20 && y >= rect.top - 20 && y <= rect.bottom + 20) {
                    return cell;
                }
            }
            return null;
        }

        showStirTooltip(wellElement, text, isSuccess = false) {
            let tooltip = wellElement.querySelector('.stir-cue-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.className = 'stir-cue-tooltip';
                wellElement.appendChild(tooltip);
            } else {
                tooltip.className = 'stir-cue-tooltip';
                tooltip.innerHTML = '';
            }
            tooltip.textContent = text;
            if (isSuccess) {
                tooltip.style.color = '#86efac';
                tooltip.style.borderColor = '#22c55e';
            } else {
                tooltip.style.color = '#fef08a';
                tooltip.style.borderColor = '#f59e0b';
            }
        }

        clearStirTooltips() {
            document.querySelectorAll('.stir-cue-tooltip').forEach(el => el.remove());
        }

        showTempHint(element, text) {
            let hint = document.querySelector('.temp-action-hint');
            if (!hint) {
                hint = document.createElement('div');
                hint.className = 'temp-action-hint';
                document.body.appendChild(hint);
            }
            hint.textContent = text;
            const rect = element.getBoundingClientRect();
            hint.style.left = `${rect.left + rect.width / 2}px`;
            hint.style.top = `${rect.top - 36}px`;
            hint.classList.add('show');
            setTimeout(() => {
                hint.classList.remove('show');
            }, 2500);
        }

        animateStickMixingAll() {
            const stick = document.getElementById('stirStickTool');
            if (!stick) return;

            const unstirredWells = ['anti_a', 'anti_b', 'anti_d'].filter(id => {
                const w = labStore.state.wells[id];
                return w && w.reagent && w.blood && !w.stirred;
            });

            if (unstirredWells.length === 0) {
                ['anti_a', 'anti_b', 'anti_d'].forEach((id, idx) => {
                    setTimeout(() => this.stirWell(id), idx * 250);
                });
                return;
            }

            stick.classList.add('is-dragging-stick');
            document.body.appendChild(stick);

            unstirredWells.forEach((wId, idx) => {
                setTimeout(() => {
                    const dep = document.getElementById(`wellDepression_${wId}`);
                    if (!dep) return;
                    const rect = dep.getBoundingClientRect();
                    stick.style.left = `${rect.left + rect.width / 2}px`;
                    stick.style.top = `${rect.top + rect.height / 2}px`;
                    stick.classList.add('is-stirring-anim');
                    soundFx.playStir();

                    setTimeout(() => {
                        this.stirWell(wId);
                        dep.classList.add('stir-complete-flash');
                    }, 350);

                    if (idx === unstirredWells.length - 1) {
                        setTimeout(() => {
                            stick.classList.remove('is-dragging-stick', 'is-stirring-anim');
                            stick.style.left = '';
                            stick.style.top = '';
                            const slot = document.getElementById('stirStickSlot') || document.querySelector('.lab-accessories-shelf');
                            if (slot && stick.parentElement !== slot) {
                                slot.insertBefore(stick, slot.firstChild);
                            }
                        }, 700);
                    }
                }, idx * 600);
            });
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 8. Lab Notebook Modal Controller
    // ══════════════════════════════════════════════════════════════
    class NotebookManager {
        constructor() {
            this.modal = document.getElementById('notebookModalBackdrop');
            this.openBtn = document.getElementById('openNotebookBtn');
            this.closeBtn = document.getElementById('closeNotebookBtn');
            this.bindModalEvents();
            this.bindVerification();
            this.initDraggableModal();
            this.renderHistoryTable();
            this.initCustomDropdowns();
        }

        bindModalEvents() {
            if (this.openBtn) {
                this.openBtn.addEventListener('click', () => this.open());
            }
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.close());
            }
            if (this.modal) {
                this.modal.addEventListener('click', (e) => {
                    if (e.target === this.modal) this.close();
                });
            }

            // Listen for clicks on step card notebook button or top banner notebook button
            document.addEventListener('click', (e) => {
                if (e.target.closest('.step-notebook-btn') || e.target.closest('.banner-notebook-btn') || e.target.closest('#bannerNotebookBtn')) {
                    e.stopPropagation();
                    this.open();
                }
            });

            // Auto-open notebook when reaching step 6 (ملاحظة وتدوين النتيجة)
            labStore.subscribe(state => {
                if (state.currentStep === 6) {
                    setTimeout(() => this.open(), 400);
                }
            });
        }

        open() {
            if (this.modal) {
                this.modal.classList.add('open');
                this.syncNotebookCanvases();
                this.renderHistoryTable();
            }
        }

        close() {
            if (this.modal) {
                this.modal.classList.remove('open');
            }
        }

        syncNotebookCanvases() {
            ['anti_a', 'anti_b', 'anti_d'].forEach(id => {
                const nbCanvas = document.getElementById(`canvas_nb_${id}`);
                AgglutinationRenderer.renderWellCanvas(nbCanvas, labStore.state.wells[id]);
            });
        }

        renderHistoryTable() {
            const tbody = document.getElementById('nbHistoryTableBody');
            const countBadge = document.getElementById('nbHistoryCount');
            if (!tbody) return;

            const history = labStore.state.sampleHistory || [];
            if (countBadge) {
                countBadge.textContent = `${history.length} من ${PATIENTS_DATABASE.length} مكتملة`;
            }

            if (history.length === 0) {
                tbody.innerHTML = `
                    <tr class="empty-history-row">
                        <td colspan="5">لا توجد عينات مكتملة بعد</td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = history.map(item => `
                <tr>
                    <td class="sample-name-cell">${item.patientName}</td>
                    <td class="${item.anti_a === '+' ? 'badge-history-pos' : 'badge-history-neg'}">${item.anti_a}</td>
                    <td class="${item.anti_b === '+' ? 'badge-history-pos' : 'badge-history-neg'}">${item.anti_b}</td>
                    <td class="${item.anti_d === '+' ? 'badge-history-pos' : 'badge-history-neg'}">${item.anti_d}</td>
                    <td>
                        <span class="badge-history-type">${item.bloodType}</span>
                    </td>
                </tr>
            `).join('');
        }

        initDraggableModal() {
            const header = document.getElementById('notebookHeaderTab');
            const windowEl = document.getElementById('notebookModalWindow');
            if (!header || !windowEl) return;

            let isDragging = false;
            let startX = 0, startY = 0;
            let initialX = 0, initialY = 0;

            header.addEventListener('pointerdown', (e) => {
                if (e.target.closest('button')) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = windowEl.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;

                const onMove = (moveEv) => {
                    if (!isDragging) return;
                    const dx = moveEv.clientX - startX;
                    const dy = moveEv.clientY - startY;
                    windowEl.style.position = 'fixed';
                    windowEl.style.left = `${initialX + dx}px`;
                    windowEl.style.top = `${initialY + dy}px`;
                    windowEl.style.transform = 'none';
                    windowEl.style.margin = '0';
                };

                const onUp = () => {
                    isDragging = false;
                    window.removeEventListener('pointermove', onMove);
                    window.removeEventListener('pointerup', onUp);
                };

                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
            });
        }

        clearForm() {
            ['anti_a', 'anti_b', 'anti_d'].forEach(id => {
                const sel = document.getElementById(`selectResult_${id}`);
                if (sel) {
                    sel.value = '';
                    sel.dispatchEvent(new Event('change'));
                }
            });
            document.querySelectorAll('.notebook-results-table input[type="text"]').forEach(input => {
                input.value = '';
            });
            const selGrp = document.getElementById('selectBloodGroup');
            const selRh = document.getElementById('selectRhFactor');
            if (selGrp) {
                selGrp.value = '';
                selGrp.dispatchEvent(new Event('change'));
            }
            if (selRh) {
                selRh.value = '';
                selRh.dispatchEvent(new Event('change'));
            }
            const feedback = document.getElementById('evalFeedbackBox');
            if (feedback) {
                feedback.className = 'evaluation-feedback';
                feedback.textContent = '';
            }
        }

        initCustomDropdowns() {
            document.querySelectorAll('.notebook-body-grid select.nb-select').forEach(selectEl => {
                if (selectEl.dataset.customEnhanced === 'true') return;
                selectEl.dataset.customEnhanced = 'true';
                selectEl.style.display = 'none';

                const wrapper = document.createElement('div');
                wrapper.className = 'custom-select-wrapper';

                const trigger = document.createElement('div');
                trigger.className = 'custom-select-trigger';
                trigger.setAttribute('tabindex', '0');

                const triggerVal = document.createElement('div');
                triggerVal.className = 'trigger-value';

                const arrow = document.createElement('div');
                arrow.className = 'custom-select-arrow';
                arrow.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                `;

                trigger.appendChild(triggerVal);
                trigger.appendChild(arrow);
                wrapper.appendChild(trigger);

                const menu = document.createElement('div');
                menu.className = 'custom-select-menu';

                const updateTrigger = () => {
                    const selOpt = selectEl.options[selectEl.selectedIndex];
                    if (!selOpt || !selOpt.value) {
                        triggerVal.innerHTML = `<span class="trigger-placeholder">${selOpt ? selOpt.text : 'اختر...'}</span>`;
                    } else if (selOpt.value === '+') {
                        triggerVal.innerHTML = `<span class="opt-badge pos">+</span><span>${selOpt.text.replace('(+)', '').trim()}</span>`;
                    } else if (selOpt.value === '-') {
                        triggerVal.innerHTML = `<span class="opt-badge neg">-</span><span>${selOpt.text.replace('(-)', '').trim()}</span>`;
                    } else {
                        triggerVal.innerHTML = `<span>${selOpt.text}</span>`;
                    }
                };

                Array.from(selectEl.options).forEach((opt, idx) => {
                    const item = document.createElement('div');
                    item.className = 'custom-select-option';
                    if (idx === selectEl.selectedIndex) item.classList.add('selected');

                    if (!opt.value) {
                        item.classList.add('is-placeholder');
                        item.innerHTML = `<span>${opt.text}</span>`;
                    } else if (opt.value === '+') {
                        item.innerHTML = `<span class="opt-badge pos">+</span><span>${opt.text.replace('(+)', '').trim()}</span>`;
                    } else if (opt.value === '-') {
                        item.innerHTML = `<span class="opt-badge neg">-</span><span>${opt.text.replace('(-)', '').trim()}</span>`;
                    } else {
                        item.innerHTML = `<span>${opt.text}</span>`;
                    }

                    item.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectEl.selectedIndex = idx;
                        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                        updateTrigger();
                        wrapper.classList.remove('open');
                        menu.querySelectorAll('.custom-select-option').forEach((o, i) => {
                            o.classList.toggle('selected', i === idx);
                        });
                    });

                    menu.appendChild(item);
                });

                updateTrigger();
                wrapper.appendChild(menu);

                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = wrapper.classList.contains('open');
                    document.querySelectorAll('.custom-select-wrapper.open').forEach(w => {
                        if (w !== wrapper) w.classList.remove('open');
                    });
                    wrapper.classList.toggle('open', !isOpen);
                });

                selectEl.addEventListener('change', () => {
                    updateTrigger();
                    menu.querySelectorAll('.custom-select-option').forEach((o, i) => {
                        o.classList.toggle('selected', i === selectEl.selectedIndex);
                    });
                });

                selectEl.parentNode.insertBefore(wrapper, selectEl.nextSibling);
            });

            document.addEventListener('click', () => {
                document.querySelectorAll('.custom-select-wrapper.open').forEach(w => w.classList.remove('open'));
            });
        }

        bindVerification() {
            const btn = document.getElementById('verifyDeductionBtn');
            const feedback = document.getElementById('evalFeedbackBox');
            if (!btn || !feedback) return;

            // Clear notebook form inputs whenever patient changes
            labStore.subscribe(state => {
                this.syncNotebookCanvases();
                this.renderHistoryTable();
            });

            btn.addEventListener('click', () => {
                const patient = labStore.getActivePatient();
                const chosenGroup = document.getElementById('selectBloodGroup').value;
                const chosenRh = document.getElementById('selectRhFactor').value;

                if (!chosenGroup || !chosenRh) {
                    feedback.className = 'evaluation-feedback warning';
                    feedback.textContent = 'يرجى اختيار الفصيلة وعامل Rh لاكتمال التقييم.';
                    return;
                }

                const isGroupCorrect = chosenGroup === patient.bloodType;
                const isRhCorrect = chosenRh === patient.rhFactor;

                if (isGroupCorrect && isRhCorrect) {
                    soundFx.playSuccess();
                    feedback.className = 'evaluation-feedback success';
                    labStore.state.wellsEvaluated = true;
                    
                    // Record result to cumulative sample history
                    labStore.recordSampleResult({
                        patientIndex: labStore.state.activePatientIndex,
                        patientName: patient.name,
                        anti_a: patient.reactions.anti_a ? '+' : '-',
                        anti_b: patient.reactions.anti_b ? '+' : '-',
                        anti_d: patient.reactions.anti_d ? '+' : '-',
                        bloodType: `${patient.bloodType}${patient.rhFactor}`
                    });
                    this.renderHistoryTable();
                    labStore.notify();
                    
                    const isLastSample = labStore.state.activePatientIndex === PATIENTS_DATABASE.length - 1;
                    const nextIndex = (labStore.state.activePatientIndex + 1) % PATIENTS_DATABASE.length;
                    const nextPatient = PATIENTS_DATABASE[nextIndex];
                    
                    if (isLastSample) {
                        feedback.innerHTML = `
                            <div style="font-size: 0.95rem; margin-bottom: 6px;">
                                &#10004; أحسنت صنعاً! إجابة صحيحة 100%. فصيلة دم <strong>${patient.name}</strong> هي (<strong>${patient.bloodType}${patient.rhFactor}</strong>).
                            </div>
                            <div style="margin-top: 6px; margin-bottom: 10px; font-weight: 600; font-size: 0.85rem; color: #166534;">
                                تهانينا! لقد أنهيت فحص جميع عينات التجربة بنجاح. اضغط أدناه لإعادة التجربة:
                            </div>
                            <button id="nextSampleNowBtn" class="next-sample-btn-pro restart-mode">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
                                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                                    <path d="M21 3v5h-5"></path>
                                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                                    <path d="M3 21v-5h5"></path>
                                </svg>
                                <span>إعادة التجربة مرة أخرى</span>
                            </button>
                        `;
                    } else {
                        feedback.innerHTML = `
                            <div style="font-size: 0.95rem; margin-bottom: 6px;">
                                &#10004; أحسنت صنعاً! إجابة صحيحة 100%. فصيلة دم <strong>${patient.name}</strong> هي (<strong>${patient.bloodType}${patient.rhFactor}</strong>).
                            </div>
                            <div style="margin-top: 6px; margin-bottom: 10px; font-weight: 600; font-size: 0.85rem; color: #166534;">
                                اضغط على الزر أدناه عند استعدادك للانتقال إلى العينة التالية:
                            </div>
                            <button id="nextSampleNowBtn" class="next-sample-btn-pro">
                                <span>الانتقال إلى العينة التالية (${nextPatient.name})</span>
                                <span style="font-size: 1.15rem; font-weight: bold;">&larr;</span>
                            </button>
                        `;
                    }

                    let hasAdvanced = false;
                    const handleButtonClick = () => {
                        if (hasAdvanced) return;
                        hasAdvanced = true;
                        this.clearForm();
                        this.close();
                        if (isLastSample) {
                            labStore.restartExperiment();
                        } else {
                            labStore.setPatientIndex(nextIndex);
                        }
                    };

                    const nextBtn = document.getElementById('nextSampleNowBtn');
                    if (nextBtn) {
                        nextBtn.addEventListener('click', handleButtonClick);
                    }

                } else {
                    feedback.className = 'evaluation-feedback error';
                    feedback.innerHTML = `النتيجة غير متطابقة مع المشاهدة. راجع حدوث التراص في الآبار وأعد المحاولة.`;
                }
            });
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 9. App Bootstrap
    // ══════════════════════════════════════════════════════════════
    function initApp() {
        const stageContainer = document.getElementById('stageLabWorkspace');
        if (!stageContainer) return;

        const scene = new LabScene(stageContainer);
        scene.render();

        const notebook = new NotebookManager();
        const interaction = new InteractionManager();
        const sidebar = new SidebarGuideController();
        sidebar.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();
