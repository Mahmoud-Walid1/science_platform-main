import * as THREE from 'three';

export class UIOverlay {
    constructor() {
        this.stepBadge = document.getElementById('stepBadge');
        this.stepText = document.getElementById('stepText');
        this.hoverTooltip = document.getElementById('hoverTooltip');
        this.btnResetCamera = document.getElementById('btnResetCamera');
        this.btnTogglePoster = document.getElementById('btnTogglePoster');
        
        // Modals
        this.posterModal = document.getElementById('posterModal');
        this.btnClosePoster = document.getElementById('btnClosePoster');

        this.specModal = document.getElementById('specModal');
        this.btnCloseSpec = document.getElementById('btnCloseSpec');

        // Sidebar Navigation
        this.btnPrevPhase = document.getElementById('btnPrevPhase');
        this.btnNextPhase = document.getElementById('btnNextPhase');

        // Volume UI
        this.btnVolMinus = document.getElementById('btnVolMinus');
        this.btnVolPlus = document.getElementById('btnVolPlus');
        this.btnSaveVolume = document.getElementById('btnSaveVolume');

        // Incubate button overlay
        this.incubationOverlay = document.getElementById('incubationOverlay');
        this.btnStartIncubation = document.getElementById('btnStartIncubation');

        // Wavelength adjust
        this.btnWlDown = document.getElementById('btnWlDown');
        this.btnWlUp = document.getElementById('btnWlUp');
        this.wlVal = document.getElementById('wlVal');

        this.currentPhase = 1;

        this.initListeners();
    }

    setEngine(engine) {
        this.engine = engine;
    }

    initListeners() {
        // Poster toggle
        if (this.btnTogglePoster) {
            this.btnTogglePoster.addEventListener('click', () => {
                this.posterModal.classList.add('visible');
                if (this.engine && this.engine.currentStep === '1a') {
                    this.engine.advanceStep('1b');
                }
            });
        }
        if (this.btnClosePoster) {
            this.btnClosePoster.addEventListener('click', () => {
                this.posterModal.classList.remove('visible');
            });
        }

        // Spectrophotometer modal close
        if (this.btnCloseSpec) {
            this.btnCloseSpec.addEventListener('click', () => {
                this.specModal.classList.remove('visible');
            });
        }

        // Camera Reset
        if (this.btnResetCamera) {
            this.btnResetCamera.addEventListener('click', () => {
                if (this.engine) this.engine.sceneManager.resetCamera();
            });
        }

        // Incubate Time Lapse trigger
        if (this.btnStartIncubation) {
            this.btnStartIncubation.addEventListener('click', () => {
                this.incubationOverlay.classList.remove('visible');
                if (this.engine) {
                    this.engine.startTimeLapseSimulation();
                }
            });
        }

        // Pipette volume adjustments
        if (this.btnVolMinus) {
            this.btnVolMinus.addEventListener('click', () => {
                if (this.engine) this.engine.adjustPipetteVolume(-50);
            });
        }
        if (this.btnVolPlus) {
            this.btnVolPlus.addEventListener('click', () => {
                if (this.engine) this.engine.adjustPipetteVolume(50);
            });
        }
        if (this.btnSaveVolume) {
            this.btnSaveVolume.addEventListener('click', () => {
                if (this.engine) this.engine.savePipetteVolume();
            });
        }

        // Wavelength adjust buttons
        if (this.btnWlDown) {
            this.btnWlDown.addEventListener('click', () => this.adjustWavelength(-5));
        }
        if (this.btnWlUp) {
            this.btnWlUp.addEventListener('click', () => this.adjustWavelength(5));
        }

        // Phase switching buttons
        if (this.btnPrevPhase) {
            this.btnPrevPhase.addEventListener('click', () => this.switchPhase(this.currentPhase - 1));
        }
        if (this.btnNextPhase) {
            this.btnNextPhase.addEventListener('click', () => this.switchPhase(this.currentPhase + 1));
        }

        // Phase tabs clicks
        ['1', '2', '3'].forEach(phNum => {
            const tab = document.getElementById(`tabPhase${phNum}`);
            if (tab) {
                tab.addEventListener('click', () => {
                    const phase = parseInt(phNum);
                    if (this.canAccessPhase(phase)) {
                        this.switchPhase(phase);
                    } else {
                        this.showToast(`⚠️ يرجى إكمال الخطوات السابقة قبل الانتقال للمرحلة ${phase}`);
                    }
                });
            }
        });
    }

    canAccessPhase(phase) {
        if (!this.engine) return false;
        if (phase === 1) return true;
        if (phase === 2) return this.engine.isIncubationComplete;
        if (phase === 3) {
            // Check if all cuvettes are filled and capped
            const capsPlaced = this.engine.labSetup.cuvetteLids.every(l => l.userData.cappedCuvetteId !== null);
            const cuvettesFilled = this.engine.labSetup.cuvettes.every(c => c.userData.isFilled);
            return cuvettesFilled && capsPlaced;
        }
        return false;
    }

    switchPhase(phaseNum) {
        if (phaseNum < 1 || phaseNum > 3) return;
        this.currentPhase = phaseNum;

        // Switch active tab
        ['1', '2', '3'].forEach(num => {
            const tab = document.getElementById(`tabPhase${num}`);
            const content = document.getElementById(`contentPhase${num}`);
            if (tab) tab.classList.toggle('active', parseInt(num) === phaseNum);
            if (content) content.classList.toggle('active', parseInt(num) === phaseNum);
        });

        // Update footer buttons
        if (this.btnPrevPhase) this.btnPrevPhase.disabled = (phaseNum === 1);
        
        // Next button is disabled for phase 3, and only enabled after measuring all samples in phase 3
        if (this.btnNextPhase) {
            if (phaseNum === 3) {
                // If it is phase 3, the Next button will take the user to the quiz screen
                this.btnNextPhase.innerHTML = `الانتقال للتقييم <i class="fas fa-arrow-left"></i>`;
                this.btnNextPhase.disabled = true; // Wait until all absorbance measures are completed
                this.btnNextPhase.onclick = () => this.showQuizPanel();
            } else {
                this.btnNextPhase.innerHTML = `التالي <i class="fas fa-chevron-left"></i>`;
                this.btnNextPhase.disabled = !this.canAccessPhase(phaseNum + 1);
                this.btnNextPhase.onclick = () => this.switchPhase(phaseNum + 1);
            }
        }

        // If switching to Phase 3, highlight spectrophotometer
        if (phaseNum === 3 && this.engine) {
            this.engine.sceneManager.zoomFrustum = 1.3;
            // focus near spectrophotometer
            this.engine.sceneManager.camera.position.set(2.4, 2.5, 4.0);
            this.engine.sceneManager.currentLookAt.set(2.6, 0.4, 0.4);
            this.engine.sceneManager.camera.lookAt(this.engine.sceneManager.currentLookAt);
            this.engine.sceneManager.checkCameraPanButton();
        } else if (phaseNum === 2 && this.engine) {
            // Focus on table center
            this.engine.sceneManager.resetCamera();
        }
    }

    adjustWavelength(amount) {
        if (!this.engine) return;
        const spec = this.engine.labSetup.specGroup;
        if (!spec.userData.isOn) {
            this.showToast("⚠️ الرجاء تشغيل جهاز مطياف الضوء أولاً!");
            return;
        }

        spec.userData.wavelength = Math.max(350, Math.min(750, spec.userData.wavelength + amount));
        if (this.wlVal) this.wlVal.textContent = spec.userData.wavelength;
        
        const screen = document.getElementById('specScreen');
        if (screen) screen.textContent = `${spec.userData.wavelength} نانومتر`;

        if (spec.userData.wavelength === 615 && this.engine.currentStep === '3c') {
            this.showToast("تم ضبط الطول الموجي على 615 نانومتر بنجاح! الآن افتح غطاء حجرة القياس.");
            this.engine.advanceStep('3d');
        }
    }

    updateStepList(activeStep) {
        // Find step card in DOM and toggle active/completed/locked
        // Format of activeStep: '1a', '1b', etc.
        const stepNum = activeStep.charAt(0);
        
        // Auto-switch sidebar phase tab to match active step
        const phase = parseInt(stepNum);
        if (phase !== this.currentPhase) {
            this.switchPhase(phase);
        }

        // List of all step names
        let stepNames = [];
        if (phase === 1) stepNames = ['1a', '1b', '1c', '1d', '1e', '1f'];
        else if (phase === 2) stepNames = ['2a', '2b', '2c', '2d', '2e', '2f', '2g', '2h', '2i', '2j', '2k', '2l'];
        else if (phase === 3) stepNames = ['3a', '3b', '3c', '3d', '3e', '3f', '3g', '3h'];

        // Get index of active step
        const activeIdx = stepNames.indexOf(activeStep);

        stepNames.forEach((name, idx) => {
            const card = document.getElementById(`step_${name}`);
            if (!card) return;

            card.classList.remove('active', 'completed', 'locked');

            if (idx < activeIdx) {
                card.classList.add('completed');
            } else if (idx === activeIdx) {
                card.classList.add('active');
            } else {
                card.classList.add('locked');
            }
        });

        // Update top stepper banner instructions
        const instructions = {
            '1a': 'تجهيز الأنابيب: راجع مخطط التجربة من الملصق المعلق على الجدار.',
            '1b': 'تجهيز الأنابيب: اسحب نبات الإيلوديا وضعه في الأنبوب 2 والأنبوب 3.',
            '1c': 'سد الأنابيب: اسحب السدادات المطاطية وضع سدادة على كل من الأنابيب الأربعة.',
            '1d': 'حجب الضوء: اسحب الصناديق العازلة للضوء وغطّ بها الأنبوب 3 والأنبوب 4.',
            '1e': 'تشغيل الإضاءة: انقر على مفتاح المصابيح لتشغيل إضاءة LED في المشهد للبدء.',
            '1f': 'حضانة 12 ساعة: انقر على زر تسريع الوقت لانتظار مرور 12 ساعة وملاحظة تغير الألوان.',
            '2a': 'إطفاء الإضاءة: انقر على مفتاح المصابيح لإغلاقها بعد انتهاء الـ 12 ساعة.',
            '2b': 'إزالة الصناديق: اسحب الصناديق العازلة للضوء من الأنابيب 3 و 4 وأرجعها للرف.',
            '2c': 'إزالة السدادات: اسحب السدادات المطاطية من الأنابيب الأربعة وأرجعها للرف.',
            '2d': 'تقدير الحموضة (pH): قارن لون العينات بملصق ألوان pH وسجل تقديراتك.',
            '2e': 'اختيار الماصة: انقر على ماصة الميكروبيبت P1000 لتحديدها.',
            '2f': 'ضبط الحجم: اضبط حجم الماصة على 1000 ميكرولتر (1ml) ثم انقر "حفظ الحجم".',
            '2g': 'تركيب رأس ماصة: انقر على علبة الرؤوس (Tips Box) لتركيب رأس جديد للماصة.',
            '2h': 'سحب عينة 1: وجه الماصة للأنبوب 1 وانقر لسحب 1000 µL من المحلول الأخضر.',
            '2i': 'صب في الكيوفيت 1: وجه الماصة للكيوفيت 1 وانقر لصب السائل فيه.',
            '2j': 'إسقاط رأس الماصة: وجه الماصة لسلة المهملات وانقر على زر "إخراج رأس الماصة".',
            '2k': 'إغلاق الكيوفيت: اسحب أحد الأغطية الصغيرة وغطّ به الكيوفيت 1.',
            '2l': 'تكرار العملية للأنابيب 2 و 3 و 4: كرر السحب والصب لكل عينة بكيوفيت خاصة ورأس ماصة جديد وغطّها.',
            '3a': 'تشغيل جهاز مطياف الضوء: انقر على لوحة تحكم جهاز مطياف الضوء وشغله بالضغط على زر الطاقة.',
            '3b': 'الاحماء: انتظر انتهاء 15 دقيقة المطلوبة لإحماء مصباح الجهاز (تلقائي).',
            '3c': 'ضبط الطول الموجي: اضبط الطول الموجي للمطياف على 615 نانومتر (nm) باستخدام الأزرار.',
            '3d': 'فتح غطاء المطياف: انقر على غطاء حجرة القياس بالمطياف لفتحه.',
            '3e': 'إدخال الكيوفيت الفارغة: اسحب كيوفيت الماء الصافي (Blank Cuvette) وضعها داخل الحجرة.',
            '3f': 'إغلاق الغطاء: انقر على غطاء حجرة المطياف لإغلاقه.',
            '3g': 'تصفير الجهاز (Zeroing): اضغط زر تصفير الجهاز (Zero) لضبط الامتصاصية المرجعية على 0.000.',
            '3h': 'قياس العينات: أخرج الكيوفيت الفارغة، ثم أدخل كيوفيت 1 وقس امتصاصيتها، وكرر لـ 2 و 3 و 4.'
        };

        if (this.stepBadge) this.stepBadge.textContent = `الخطوة ${activeStep.toUpperCase()}`;
        if (this.stepText) this.stepText.textContent = instructions[activeStep] || '';

        // Handle specific overlay triggers based on step
        if (activeStep === '1f') {
            this.incubationOverlay.classList.add('visible');
        } else {
            this.incubationOverlay.classList.remove('visible');
        }

        // Show spectrophotometer dashboard overlay in Phase 3
        if (phase === 3) {
            this.specModal.classList.add('visible');
        } else {
            this.specModal.classList.remove('visible');
        }
    }

    showHoverTooltip(x, y, text) {
        if (!this.hoverTooltip) return;
        this.hoverTooltip.textContent = text;
        this.hoverTooltip.style.left = `${x}px`;
        this.hoverTooltip.style.top = `${y}px`;
        this.hoverTooltip.classList.add('visible');
    }

    hideHoverTooltip() {
        if (!this.hoverTooltip) return;
        this.hoverTooltip.classList.remove('visible');
    }

    showToast(message) {
        // In this implementation, we update the top banner text or trigger a temporary floating toast
        const toast = document.createElement('div');
        toast.className = 'toast-alert-float';
        toast.textContent = message;
        
        // CSS for temporary toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            color: 'white',
            padding: '10px 24px',
            borderRadius: '100px',
            fontSize: '0.85rem',
            fontWeight: '700',
            zIndex: '9999',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            pointerEvents: 'none'
        });

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = 0;
            toast.style.transform = 'translateX(-50%) translateY(-10px)';
            setTimeout(() => toast.remove(), 300);
        }, 2200);
    }

    showQuizPanel() {
        if (window.photosynthesisLab?.openResultsSection) {
            window.photosynthesisLab.openResultsSection();
        }
    }
}
