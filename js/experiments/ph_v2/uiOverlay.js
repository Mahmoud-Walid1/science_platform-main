// js/experiments/ph_v2/uiOverlay.js
export class UIOverlay {
    constructor(sceneManager, litmusPapers, phMeter) {
        this.sceneManager = sceneManager;
        this.litmusPapers = litmusPapers;
        this.phMeter = phMeter;
        
        this.phEngine = null;
        this.modeChangeCallback = null;
        this.toastTimeout = null;

        this.initDOM();
    }

    setEngine(phEngine) {
        this.phEngine = phEngine;
    }

    setModeChangeCallback(callback) {
        this.modeChangeCallback = callback;
    }

    initDOM() {
        // 1. Mode Switcher (3D Lab vs. Quiz/Theory)
        const btnMode3D = document.getElementById('btnMode3D');
        const btnModeQuiz = document.getElementById('btnModeQuiz');
        const stage3D = document.getElementById('stagePanel3D');
        const panelQuiz = document.getElementById('educationalPanel');

        if (btnMode3D && btnModeQuiz && stage3D && panelQuiz) {
            btnMode3D.addEventListener('click', () => {
                btnMode3D.classList.add('active');
                btnModeQuiz.classList.remove('active');
                stage3D.style.display = 'flex';
                panelQuiz.style.display = 'none';
                
                if (this.modeChangeCallback) {
                    this.modeChangeCallback('3d');
                }
            });

            btnModeQuiz.addEventListener('click', () => {
                btnModeQuiz.classList.add('active');
                btnMode3D.classList.remove('active');
                panelQuiz.style.display = 'block';
                stage3D.style.display = 'none';

                if (this.modeChangeCallback) {
                    this.modeChangeCallback('quiz');
                }
            });
        }

        // 2. Instructions Modal
        const btnOpen = document.getElementById('btnOpenInstructions');
        const btnClose = document.getElementById('btnCloseInstructions');
        const modal = document.getElementById('instructionsModal');

        if (btnOpen && modal) {
            btnOpen.addEventListener('click', () => modal.classList.add('active'));
        }
        if (btnClose && modal) {
            btnClose.addEventListener('click', () => modal.classList.remove('active'));
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        }

        // 3. Reset Button
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                this.litmusPapers.reset();
                this.phMeter.reset();
                if (this.phEngine) {
                    this.phEngine.lastProbeState = "OUT";
                }
                this.showToast("تم إعادة تهيئة أوراق عباد الشمس ومجس جهاز pH بنجاح!", "info");
            });
        }

        // 4. Camera zoom controls
        const btnZoomIn = document.getElementById('btnZoomIn');
        const btnZoomOut = document.getElementById('btnZoomOut');
        const btnResetCamera = document.getElementById('btnResetCamera');

        if (btnZoomIn) {
            btnZoomIn.addEventListener('click', () => {
                this.sceneManager.camera.position.z = Math.max(2, this.sceneManager.camera.position.z - 0.5);
            });
        }
        if (btnZoomOut) {
            btnZoomOut.addEventListener('click', () => {
                this.sceneManager.camera.position.z = Math.min(8, this.sceneManager.camera.position.z + 0.5);
            });
        }
        if (btnResetCamera) {
            btnResetCamera.addEventListener('click', () => {
                this.sceneManager.camera.position.set(0, 2.0, 5.6);
                this.sceneManager.camera.lookAt(0, 0.35, 0);
            });
        }

        // 5. Collapsible Summary Box Toggle
        const summaryCard = document.getElementById('expSummaryCard');
        const summaryHeader = document.getElementById('summaryHeader');
        const toggleIcon = document.getElementById('toggleSummaryIcon');

        if (summaryHeader && summaryCard) {
            summaryHeader.addEventListener('click', () => {
                const isCollapsed = summaryCard.classList.toggle('collapsed');
                if (toggleIcon) {
                    toggleIcon.className = isCollapsed ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
                }
            });
        }
    }

    showToast(msg, type = 'info') {
        const toast = document.getElementById('toastMsg');
        const text = document.getElementById('toastText');
        const icon = document.getElementById('toastIcon');

        if (!toast || !text) return;

        text.innerText = msg;
        if (icon) {
            icon.className = type === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle';
            icon.style.color = type === 'warning' ? '#ef4444' : '#38bdf8';
        }

        toast.classList.add('active');

        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('active');
        }, 3200);
    }
}
