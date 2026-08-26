// js/experiments/ph_v2/phEngine.js
import { soundManager } from './soundManager.js';
import { PH_COLORS } from './litmusPapers.js';

export const SOLUTIONS_DB = {
    lemon: { id: "lemon", defaultX: -2.0, name: "عصير الليمون", ph: 2.0, type: "acid" },
    vinegar: { id: "vinegar", defaultX: -1.0, name: "الخل الأبيض", ph: 2.5, type: "acid" },
    water: { id: "water", defaultX: 0.0, name: "الماء المقطر", ph: 7.0, type: "neutral" },
    bicarb: { id: "bicarb", defaultX: 1.0, name: "بيكربونات الصوديوم", ph: 8.5, type: "base" },
    soap: { id: "soap", defaultX: 2.0, name: "ماء وصابون", ph: 9.5, type: "base" }
};

export class PhEngine {
    constructor(beaker3D, litmusPapers, phMeter, uiOverlay) {
        this.beaker3D = beaker3D;
        this.litmusPapers = litmusPapers;
        this.phMeter = phMeter;
        this.uiOverlay = uiOverlay;

        this.lastProbeState = "OUT"; // OUT, SUBMERGED, DEEP
        this.lastDippedBeaker = null; // Tracks last beaker dipped for probe
    }

    // Projects 3D object coordinates through camera view onto beaker depth plane (Z = 0)
    getProjectedTip(worldPos) {
        if (!this.beaker3D || !this.beaker3D.sceneManager || !this.beaker3D.sceneManager.camera) {
            return worldPos;
        }
        const cam = this.beaker3D.sceneManager.camera.position;
        const denominator = cam.z - worldPos.z;
        if (Math.abs(denominator) < 0.001) return worldPos;

        // Perspective ray parameter t at Z = 0
        const t = cam.z / denominator;
        return {
            x: cam.x + t * (worldPos.x - cam.x),
            y: cam.y + t * (worldPos.y - cam.y)
        };
    }

    // Detect beaker matching object tip position
    detectSubmergedBeaker(tipX, tipY) {
        if (tipY >= 0.85) return null; // Outside beaker top rim vertically (glass rim is at Y = 0.9)

        // Find which beaker is close horizontally
        for (const key of Object.keys(SOLUTIONS_DB)) {
            const conf = SOLUTIONS_DB[key];
            const distX = Math.abs(tipX - conf.defaultX);
            if (distX < 0.45) {
                return conf;
            }
        }
        return null;
    }

    checkInteractions() {
        // 1. Litmus Papers Dipping & Trash Bin Disposal
        if (this.litmusPapers && this.litmusPapers.papers) {
            for (let i = this.litmusPapers.papers.length - 1; i >= 0; i--) {
                const paper = this.litmusPapers.papers[i];
                const pos = paper.mesh.position.clone();

                // A) Check Trash Bin Disposal (X = 4.3)
                const projPos = this.getProjectedTip(pos);
                const distTrashX = Math.abs(projPos.x - 4.3);
                if (distTrashX < 0.5 && projPos.y < 0.8) {
                    this.litmusPapers.disposePaper(paper);
                    this.uiOverlay.showToast("تم إلقاء الورقة في سلة المهملات 🗑️", "info");
                    continue;
                }

                // B) Check Beaker Dipping using camera perspective projection
                pos.y -= 0.3; // Paper bottom tip offset
                const projPaper = this.getProjectedTip(pos);
                const beaker = this.detectSubmergedBeaker(projPaper.x, projPaper.y);

                if (beaker) {
                    if (paper.isUsed && paper.lastDippedBeaker !== beaker.id) {
                        // Dipping an ALREADY USED paper into a DIFFERENT beaker
                        this.uiOverlay.showToast("هذه الورقة مستخدمة بالفعل! اسحب ورقة جديدة من العلبة أو ارمِها في سلة المهملات.", "warning");
                        paper.mesh.position.y = 0.95; // Bounce back above liquid
                    } else if (!paper.isUsed) {
                        paper.lastDippedBeaker = beaker.id;

                        if (paper.type === 'blue') {
                            if (beaker.type === 'acid') {
                                const targetColor = PH_COLORS[beaker.id] || PH_COLORS.vinegar;
                                this.litmusPapers.triggerColorAnimation(paper, targetColor);
                                soundManager.playSizzle();
                                this.uiOverlay.showToast(`تحولت الورقة الزرقاء للون الأحمر في ${beaker.name}! (المحلول حمضي)`, "info");
                            } else {
                                paper.isUsed = true;
                                this.uiOverlay.showToast(`لم يتغير لون الورقة الزرقاء في ${beaker.name}. (المحلول غير حمضي)`, "info");
                            }
                        } else if (paper.type === 'red') {
                            if (beaker.type === 'base') {
                                const targetColor = PH_COLORS[beaker.id] || PH_COLORS.soap;
                                this.litmusPapers.triggerColorAnimation(paper, targetColor);
                                soundManager.playSizzle();
                                this.uiOverlay.showToast(`تحولت الورقة الحمراء للون الأزرق في ${beaker.name}! (المحلول قاعدي)`, "info");
                            } else {
                                paper.isUsed = true;
                                this.uiOverlay.showToast(`لم يتغير لون الورقة الحمراء في ${beaker.name}. (المحلول غير قاعدي)`, "info");
                            }
                        }
                    }
                }
            }
        }

        // 2. pH Probe Dipping (Bulb tip is at probePos.y - 0.6)
        const probePos = this.phMeter.electrodeGroup.position.clone();
        probePos.y -= 0.6; // Bulb tip offset
        const projProbe = this.getProjectedTip(probePos);
        const probeBeaker = this.detectSubmergedBeaker(projProbe.x, projProbe.y);
        
        if (probeBeaker) {
            // Power Check
            if (!this.phMeter.isOn) {
                this.uiOverlay.showToast("الرجاء تشغيل جهاز pH أولاً بالضغط على زر التشغيل الأحمر!", "warning");
                this.phMeter.updateLcd("", "");
                this.phMeter.electrodeGroup.position.y = 1.25; // bounce back to top of beaker
                return;
            }

            // Power is ON: Instant reading upon bulb entering liquid surface
            if (projProbe.y < 0.85 && projProbe.y >= 0.05) {
                // Correct Measurement Depth inside liquid
                if (this.lastProbeState !== "SUBMERGED" || this.lastDippedBeaker !== probeBeaker.id) {
                    this.lastProbeState = "SUBMERGED";
                    this.lastDippedBeaker = probeBeaker.id;
                    soundManager.playBeep(1200, 0.08);
                    this.uiOverlay.showToast(`قراءة الجهاز في ${probeBeaker.name}: pH = ${probeBeaker.ph.toFixed(1)}`, "info");
                }
                this.phMeter.updateLcd(probeBeaker.ph.toFixed(1), "pH METER");
            } else if (projProbe.y < 0.05) {
                // Hits bottom
                this.phMeter.updateLcd(probeBeaker.ph.toFixed(1), "pH METER");
                if (this.lastProbeState !== "DEEP") {
                    this.lastProbeState = "DEEP";
                    soundManager.playBeep(600, 0.18);
                    this.uiOverlay.showToast("تنبيه: لا تضغط المجس بقوة في قاع الكأس!", "warning");
                }
            }
        } else {
            // Outside liquid
            if (this.lastProbeState !== "OUT") {
                this.lastProbeState = "OUT";
                this.lastDippedBeaker = null;
            }
            if (this.phMeter.isOn) {
                this.phMeter.updateLcd("0.00", "READY");
            } else {
                this.phMeter.updateLcd("", "");
            }
        }
    }
}
