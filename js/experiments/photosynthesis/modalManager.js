// js/experiments/photosynthesis/modalManager.js
// موديول إدارة النوافذ التفاعلية ونافذة إعدادات مقياس الطيف الضوئي (SPECTROPHOTOMETER SETTINGS)

class ModalManager {
    constructor(spectroEngine, uiOverlay) {
        this.spectroEngine = spectroEngine;
        this.uiOverlay = uiOverlay;
        this.activeCuvetteInChamber = null;
        this.experimentEngine = null; // سيتم تعيينه عند التهيئة
    }

    setExperimentEngine(engine) {
        this.experimentEngine = engine;
    }

    // فتح نافذة إعدادات مقياس الطيف الضوئي (مطابقة للصورة المرفقة تماماً)
    openSpecSettingsModal() {
        const modal = document.getElementById('specSettingsModal');
        if (!modal) return;

        modal.style.display = 'flex';

        // تحديث شاشة الـ LCD بالنافذة
        this.refreshSpecModalDisplay();

        // تحديث جدول العينات
        this.refreshSamplesTable();
    }

    closeSpecSettingsModal() {
        const modal = document.getElementById('specSettingsModal');
        if (modal) modal.style.display = 'none';

        if (this.spectroEngine && this.spectroEngine.wavelength === 615 && this.experimentEngine) {
            this.experimentEngine.markStepCompleted('3c');
            if (this.experimentEngine.currentStep === '3c' || !this.experimentEngine.currentStep || this.experimentEngine.currentStep < '3c') {
                this.experimentEngine.advanceStep('3d');
            }
        }
    }

    // تحديث الشاشة الخضراء وشريط الطول الموجي داخل نافذة الضبط
    refreshSpecModalDisplay() {
        const lcdDigits = document.getElementById('modalSpecLcdDigits') || document.getElementById('modalSpecLcdDigitsPhp');
        const wlDisplay = document.getElementById('modalSpecWavelength') || document.getElementById('modalSpecWavelengthPhp');
        const sliderInput = document.getElementById('wavelengthSliderInput') || document.getElementById('wavelengthSliderInputPhp');
        const sliderVal = document.getElementById('sliderCurrentVal') || document.getElementById('sliderCurrentValPhp');

        const cuvObj = this.experimentEngine?.specState?.cuvetteInChamber;
        const currentCuv = cuvObj ? { userData: cuvObj } : this.experimentEngine?.labSetup?.specGroup?.userData?.cuvetteInChamber;
        const res = this.spectroEngine.measureAbsorbance(currentCuv);

        if (lcdDigits) {
            lcdDigits.textContent = res.text;
        }

        if (wlDisplay) {
            wlDisplay.textContent = this.spectroEngine.wavelength;
        }

        if (sliderInput) {
            sliderInput.value = this.spectroEngine.wavelength;
        }

        if (sliderVal) {
            sliderVal.textContent = `${this.spectroEngine.wavelength} nm`;
        }

        // مزامنة شاشة الجهاز ثلاثي الأبعاد والـ SVG أيضاً
        const specScreen = document.getElementById('specScreen');
        if (specScreen) {
            specScreen.textContent = res.text === 'OFF' ? 'OFF' : `${res.text} Abs`;
        }
        if (this.experimentEngine?.svgScene) {
            this.experimentEngine.svgScene.updateSpecScreen(res.text);
        }
    }

    // تحديث جدول العينات (Cuvette 1 to 4) في الجانب الأيسر
    refreshSamplesTable() {
        ['1', '2', '3', '4'].forEach(id => {
            const cell = document.getElementById(`set_abs_${id}`) || document.getElementById(`set_abs_${id}_php`);
            if (!cell) return;

            // دعم حالة الـ SVG
            const svgCuv = this.experimentEngine?.cuvettesState?.[id];
            if (svgCuv && svgCuv.isFilled && svgCuv.hasBeenMeasured) {
                const res = this.spectroEngine.measureAbsorbance({ userData: svgCuv });
                cell.textContent = res.text;
                return;
            } else if (svgCuv && svgCuv.isFilled && svgCuv.recordedAbs) {
                cell.textContent = svgCuv.recordedAbs;
                return;
            }

            // دعم مجسمات 3D إذا وجدت
            const cuvettes = this.experimentEngine?.labSetup?.cuvettes;
            const cuv = cuvettes?.find(c => c.userData?.id === id);
            if (cuv && cuv.userData?.isFilled && cuv.userData?.hasBeenMeasured) {
                const res = this.spectroEngine.measureAbsorbance(cuv);
                cell.textContent = res.text;
            } else if (cuv && cuv.userData?.isFilled && cuv.userData?.recordedAbs) {
                cell.textContent = cuv.userData.recordedAbs;
            } else {
                cell.textContent = '--';
            }
        });
    }

    // الضغط على زر التصفير (Zero button) الأزرق داخل نافذة الضبط
    handleZeroButton() {
        const currentCuv = this.experimentEngine?.labSetup?.specGroup?.userData?.cuvetteInChamber || this.experimentEngine?.specState?.cuvetteInChamber;
        const result = this.spectroEngine.performZero(currentCuv);

        this.refreshSpecModalDisplay();

        if (this.uiOverlay) {
            this.uiOverlay.showToast(result.message);
        }

        if (this.experimentEngine) {
            this.experimentEngine.spectrophotometerZeroed = true;
            if (result.isBlank) {
                this.experimentEngine.markStepCompleted('3h');
                if (this.experimentEngine.currentStep === '3h') {
                    this.experimentEngine.advanceStep('3i');
                }
            }
        }
    }

    // الضغط على زر الطاقة (Power) الأحمر
    handlePowerToggle() {
        const isOn = this.spectroEngine.togglePower();
        this.refreshSpecModalDisplay();

        if (this.uiOverlay) {
            this.uiOverlay.showToast(isOn ? "تم تشغيل مقياس الطيف الضوئي ✓" : "تم إيقاف مقياس الطيف الضوئي");
        }

        if (this.experimentEngine && isOn) {
            this.experimentEngine.markStepCompleted('3a');
            if (this.experimentEngine.currentStep === '3a' || !this.experimentEngine.currentStep || !this.experimentEngine.currentStep.startsWith('3')) {
                this.experimentEngine.advanceStep('3b');
            }
        }
    }

    // تغيير الطول الموجي عبر شريط التمرير
    handleWavelengthChange(value) {
        const numVal = parseInt(value, 10) || 350;
        this.spectroEngine.setWavelength(numVal);
        const wlDisplay = document.getElementById('modalSpecWavelength') || document.getElementById('modalSpecWavelengthPhp');
        const sliderVal = document.getElementById('sliderCurrentVal') || document.getElementById('sliderCurrentValPhp');
        const svgWl = document.getElementById('svg_spec_wl_display');
        if (wlDisplay) wlDisplay.textContent = numVal;
        if (sliderVal) sliderVal.textContent = `${numVal} nm`;
        if (svgWl) {
            svgWl.textContent = `الطول الموجي: ${numVal} nm`;
            svgWl.setAttribute('fill', '#10b981');
        }

        // تحديث موضع مؤشر الانزلاق في الـ SVG
        const svgThumb = document.getElementById('spec_slider_thumb');
        if (svgThumb) {
            const pct = Math.max(0, Math.min(1, (numVal - 350) / (750 - 350)));
            svgThumb.setAttribute('cx', (pct * 95).toFixed(1));
        }

        if (this.experimentEngine?.svgScene) {
            const cuvObj = this.experimentEngine?.specState?.cuvetteInChamber;
            const currentCuv = cuvObj ? { userData: cuvObj } : this.experimentEngine?.labSetup?.specGroup?.userData?.cuvetteInChamber;
            const res = this.spectroEngine.measureAbsorbance(currentCuv);
            this.experimentEngine.svgScene.updateSpecScreen(res.text);
            const screen = document.getElementById('specScreen');
            if (screen) screen.textContent = res.text === 'OFF' ? 'OFF' : `${res.text} Abs`;
        }

        // عند ضبط الطول الموجي على 615 nm
        if (numVal === 615 && this.experimentEngine) {
            this.experimentEngine.markStepCompleted('3c');
            if (this.experimentEngine.currentStep === '3c' || !this.experimentEngine.currentStep || this.experimentEngine.currentStep < '3c') {
                this.experimentEngine.advanceStep('3d');
            }
            if (this.uiOverlay) {
                this.uiOverlay.showToast("✓ تم ضبط الطول الموجي على 615 nm بنجاح!");
            }
        }
    }

    // إدارة باقي النوافذ
    openSetupPosterModal() {
        const m = document.getElementById('setupPosterModal') || document.getElementById('posterModal');
        if (m) {
            m.style.display = 'flex';
            m.onclick = (e) => {
                if (e.target === m) this.closeSetupPosterModal();
            };
        }
    }

    closeSetupPosterModal() {
        const m = document.getElementById('setupPosterModal') || document.getElementById('posterModal');
        if (m) m.style.display = 'none';
        if (this.experimentEngine && this.experimentEngine.currentStep === '1a') {
            this.experimentEngine.markStepCompleted('1a');
            this.experimentEngine.advanceStep('1b');
        }
    }

    openSpecInfoModal() {
        const m = document.getElementById('specInfoModal');
        if (m) m.style.display = 'flex';
        if (this.experimentEngine) {
            this.experimentEngine.markStepCompleted('3b');
            if (this.experimentEngine.currentStep === '3b') {
                this.experimentEngine.advanceStep('3c');
            }
        }
    }

    closeSpecInfoModal() {
        const m = document.getElementById('specInfoModal');
        if (m) m.style.display = 'none';
        if (this.experimentEngine) {
            this.experimentEngine.markStepCompleted('3b');
            if (this.experimentEngine.currentStep === '3b') {
                this.experimentEngine.advanceStep('3c');
            }
        }
    }

    openPipetteVolumeModal() {
        const m = document.getElementById('pipetteVolumeModal');
        if (m) m.style.display = 'flex';
    }

    closePipetteVolumeModal() {
        const m = document.getElementById('pipetteVolumeModal');
        if (m) m.style.display = 'none';
    }
}

if (typeof window !== 'undefined') {
    window.ModalManager = ModalManager;
}
