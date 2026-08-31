// js/experiments/photosynthesis_factors/app.js
import { ChartManager } from './chartManager.js';
import { LeafDiskEngine } from './leafDiskEngine.js';
import { IndicatorEngine } from './indicatorEngine.js';
import { AudusEngine } from './audusEngine.js';
import { QuizEngine } from './quizEngine.js';
import { soundManager } from './soundManager.js';

class PhotosynthesisApp {
    constructor() {
        this.chartManager = new ChartManager();
        this.leafEngine = new LeafDiskEngine(this.chartManager);
        this.indicatorEngine = new IndicatorEngine(this.chartManager);
        this.audusEngine = new AudusEngine(this.chartManager);
        this.quizEngine = new QuizEngine();

        this.currentTab = 'leaf';
    }

    init() {
        this.bindTabNavigation();
        this.bindSummaryCardToggle();

        // 1. Init Sub-Exp 1: Floating Leaf Disks
        this.leafEngine.init('canvasLeafDisks');
        this.chartManager.initLeafChart('chartLeafDisks');
        this.bindLeafControls();

        // 2. Init Sub-Exp 2: Hydrogencarbonate Indicator
        this.chartManager.initIndicatorChart('chartIndicator');
        this.bindIndicatorControls();

        // 3. Init Sub-Exp 3: Audus Photosynthometer
        this.audusEngine.init('audusWorkspace');
        this.chartManager.initAudusChart('chartAudus');
        this.bindAudusControls();

        // 4. Init Sub-Exp 4: Quiz
        this.quizEngine.init('quizContainer');
    }

    bindTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                if (tab && tab !== this.currentTab) {
                    this.switchTab(tab);
                }
            });
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        soundManager.playClick();

        // Pause engines when leaving or entering their tabs until user clicks Start
        if (tab !== 'leaf') this.leafEngine.pauseTimer();
        if (tab !== 'indicator') this.indicatorEngine.stopAutoPlay();
        this.audusEngine.pauseTimer();

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));

        const activeBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
        const activeViewMap = {
            leaf: 'viewLeaf',
            indicator: 'viewIndicator',
            audus: 'viewAudus',
            quiz: 'viewQuiz'
        };

        const activeView = document.getElementById(activeViewMap[tab]);

        if (activeBtn) activeBtn.classList.add('active');
        if (activeView) activeView.classList.add('active');
    }

    bindSummaryCardToggle() {
        const toggleBtn = document.getElementById('btnCollapseCard');
        const headerToggleBtn = document.getElementById('btnToggleSummary');
        const summaryCard = document.getElementById('summaryCard');

        const toggleHandler = (e) => {
            if (e) e.preventDefault();
            if (!summaryCard) return;
            summaryCard.classList.toggle('collapsed');
            const isCollapsed = summaryCard.classList.contains('collapsed');
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                if (icon) icon.className = isCollapsed ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
            }
            soundManager.playClick();
        };

        if (toggleBtn) toggleBtn.addEventListener('click', toggleHandler);
        if (headerToggleBtn) headerToggleBtn.addEventListener('click', toggleHandler);
    }

    bindLeafControls() {
        const rangeLight = document.getElementById('rangeLeafLight');
        const rangeNacoh = document.getElementById('rangeLeafNacoh');
        const valLight = document.getElementById('valLeafLight');
        const valNacoh = document.getElementById('valLeafNacoh');

        if (rangeLight) {
            rangeLight.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (valLight) valLight.innerText = `${val}%`;
                this.leafEngine.setParams({ lightIntensity: val });
            });
        }

        if (rangeNacoh) {
            rangeNacoh.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (valNacoh) valNacoh.innerText = `${val.toFixed(1)}%`;
                this.leafEngine.setParams({ co2Conc: val });
            });
        }

        // Light Color Spectrum Buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const color = btn.getAttribute('data-color');
                this.leafEngine.setParams({ lightColor: color });
                soundManager.playClick();
            });
        });

        // Speed Buttons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const speed = parseInt(btn.getAttribute('data-speed'));
                this.leafEngine.setParams({ speed });
                soundManager.playClick();
            });
        });

        // Actions
        const btnStart = document.getElementById('btnStartLeafTimer');
        const btnPause = document.getElementById('btnPauseLeafTimer');
        const btnReset = document.getElementById('btnResetLeaf');

        if (btnStart) btnStart.addEventListener('click', () => this.leafEngine.startTimer());
        if (btnPause) btnPause.addEventListener('click', () => this.leafEngine.pauseTimer());
        if (btnReset) btnReset.addEventListener('click', () => this.leafEngine.resetSimulation());
    }

    bindIndicatorControls() {
        const rangeLight = document.getElementById('rangeIndLight');
        const rangeTemp = document.getElementById('rangeIndTemp');
        const rangeTime = document.getElementById('rangeIndTime');

        const valLight = document.getElementById('valIndLight');
        const valTemp = document.getElementById('valIndTemp');
        const valTime = document.getElementById('valIndTime');

        if (rangeLight) {
            rangeLight.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (valLight) valLight.innerText = `${val} Lux`;
                this.indicatorEngine.setParams({ lightLux: val });
            });
        }

        if (rangeTemp) {
            rangeTemp.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (valTemp) valTemp.innerText = `${val}°C`;
                this.indicatorEngine.setParams({ tempC: val });
            });
        }

        if (rangeTime) {
            rangeTime.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (valTime) valTime.innerText = `${val} دقيقة`;
                this.indicatorEngine.setParams({ elapsedMin: val });
            });
        }

        const btnRun = document.getElementById('btnRunInd');
        const btnReset = document.getElementById('btnResetInd');

        if (btnRun) {
            btnRun.addEventListener('click', () => {
                btnRun.disabled = true;
                this.showToast("بدء التفاعل الزمني في الأنابيب الأربعة...", "info");
                this.indicatorEngine.startAutoPlay(() => {
                    btnRun.disabled = false;
                    soundManager.playSuccess();
                    this.showToast("اكتمل التفاعل التنافسي في الأنابيب الأربعة!", "info");
                });
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                this.indicatorEngine.stopAutoPlay();
                if (btnRun) btnRun.disabled = false;
                this.indicatorEngine.setParams({ elapsedMin: 0 });
                if (rangeTime) rangeTime.value = 0;
                if (valTime) valTime.innerText = "0 دقيقة";
                soundManager.playClick();
            });
        }
    }

    bindAudusControls() {
        const rangeDist = document.getElementById('rangeAudusDist');
        const rangeTemp = document.getElementById('rangeAudusTemp');
        const rangeCO2 = document.getElementById('rangeAudusCO2');

        const valTemp = document.getElementById('valAudusTemp');
        const valCO2 = document.getElementById('valAudusCO2');

        if (rangeDist) {
            rangeDist.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                this.audusEngine.setParams({ distanceCm: val });
            });
        }

        if (rangeTemp) {
            rangeTemp.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (valTemp) valTemp.innerText = `${val}°C`;
                this.audusEngine.setParams({ tempC: val });
            });
        }

        if (rangeCO2) {
            rangeCO2.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (valCO2) valCO2.innerText = `${val.toFixed(2)}%`;
                this.audusEngine.setParams({ co2Conc: val });
            });
        }

        const btnStart = document.getElementById('btnStartAudus');
        const btnPause = document.getElementById('btnPauseAudus');
        const btnRecord = document.getElementById('btnRecordAudusData');
        const btnSyringe = document.getElementById('btnResetSyringe');
        const btnClearTable = document.getElementById('btnClearAudusTable');

        if (btnStart) btnStart.addEventListener('click', () => this.audusEngine.startTimer());
        if (btnPause) btnPause.addEventListener('click', () => this.audusEngine.pauseTimer());
        if (btnRecord) btnRecord.addEventListener('click', () => this.audusEngine.recordDataPoint());
        if (btnSyringe) btnSyringe.addEventListener('click', () => this.audusEngine.resetSyringe());
        if (btnClearTable) btnClearTable.addEventListener('click', () => this.audusEngine.clearTableData());
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;

        container.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new PhotosynthesisApp();
    app.init();
});
