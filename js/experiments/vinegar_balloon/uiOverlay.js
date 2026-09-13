/**
 * uiOverlay.js
 * Stepper, Modals (Hints, Notes), Toolbars & Action Buttons
 * Clean Architecture - Single Responsibility
 */

import { soundManager } from './soundManager.js';
import { labScene } from './labScene.js';
import { dragDropEngine } from './dragDropEngine.js';

class UIOverlay {
    constructor() {
        this.stepDescriptions = {
            1: {
                title: '1. إضافة الخل إلى الزجاجة',
                desc: 'اسحب القمع وضعه على فوهة الزجاجة، ثم اسكب كمية الخل عبر القمع.',
                btnText: 'اسكب الخل عبر القمع',
                diagram: 'funnel_vinegar'
            },
            2: {
                title: '2. وضع البيكربونات في البالون',
                desc: '1. ضع القمع على فوهة البالون. 2. اغرف مسحوق البيكربونات بالملعقة. 3. اسكب المسحوق عبر القمع داخل البالون.',
                btnText: 'أضف البيكربونات إلى البالون',
                diagram: 'funnel_soda'
            },
            3: {
                title: '3. تثبيت البالون وبدء التفاعل',
                desc: 'اسحب البالون وثبته على فوهة الزجاجة، ثم اضغط على زر "ابدأ التفاعل" أو انقر على البالون لمزج المسحوق مع الخل.',
                btnText: 'ابدأ التفاعل',
                diagram: 'attach_react'
            },
            4: {
                title: '4. اكتمال التفاعل وتصاعد الغاز',
                desc: 'لاحظ فوران السائل وتصاعد فقاعات غاز ثاني أكسيد الكربون (CO₂) التي تسببت في انتفاخ البالون.',
                btnText: 'تم التفاعل بنجاح',
                diagram: 'inflated_balloon'
            }
        };
    }

    init() {
        this.bindModals();
        this.bindBottomBar();
        this.bindActionBtn();
        this.bindFloatingGuide();
        this.bindNotesStorage();
    }

    bindFloatingGuide() {
        const toggleBtn = document.getElementById('btnToggleGuideDock');
        const dock = document.getElementById('labFloatingGuide');
        const icon = document.getElementById('toggleGuideIcon');
        const label = document.getElementById('toggleGuideLabel');
        const floatActionBtn = document.getElementById('btnFloatingAction');

        if (toggleBtn && dock) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                soundManager.playClick();
                const isCollapsed = dock.classList.toggle('is-collapsed');
                if (isCollapsed) {
                    if (icon) icon.className = 'fas fa-eye';
                    if (label) label.textContent = 'إظهار التعليمات';
                    toggleBtn.title = 'إظهار شريط التعليمات';
                } else {
                    if (icon) icon.className = 'fas fa-eye-slash';
                    if (label) label.textContent = 'إخفاء التعليمات';
                    toggleBtn.title = 'إخفاء شريط التعليمات';
                }
            });
        }

        if (floatActionBtn) {
            floatActionBtn.addEventListener('click', () => {
                const mainBtn = document.getElementById('btnMainAction');
                if (mainBtn) mainBtn.click();
            });
        }
    }

    updateStep(stepState) {
        const stepNum = stepState.step;
        let title = '';
        let desc = '';
        let btnText = '';

        if (stepNum === 1) {
            title = '1. إضافة الخل إلى الزجاجة';
            desc = 'اسحب القمع وضعه على فوهة الزجاجة، ثم اسكب كمية الخل عبر القمع.';
            btnText = 'اسكب الخل عبر القمع';
        } else if (stepNum === 2) {
            const added = stepState.sodaSpoonsAdded || 0;
            const needed = stepState.sodaSpoonsNeeded || 2;
            if (stepState.funnelLocation !== 'balloon') {
                title = '2. وضع القمع في البالون';
                desc = 'اسحب القمع وضعه في عنق البالون المفرغ على الطاولة لصب المسحوق.';
                btnText = 'ضع القمع في البالون';
            } else if (!stepState.sodaOnSpoon) {
                title = `2. غرف مسحوق البيكربونات (${added}/${needed})`;
                desc = `اسحب الملعقة إلى وعاء البيكربونات لملئها بالمسحوق (ملعقة ${added + 1} من ${needed}).`;
                btnText = `اغرف الملعقة (${added + 1} من ${needed})`;
            } else {
                title = `2. وضع المسحوق في البالون (${added + 1}/${needed})`;
                desc = `اسحب الملعقة المحملة بالمسحوق إلى قمع البالون لتفريغها.`;
                btnText = `فرغ الملعقة في البالون`;
            }
        } else if (stepNum === 3) {
            title = '3. تثبيت البالون على فوهة الزجاجة';
            desc = 'اسحب البالون وثبته على فوهة الزجاجة دون سكب المسحوق حتى يستقر بإحكام.';
            btnText = stepState.balloonAttached ? 'ابدأ التفاعل الكيميائي' : 'ثبت البالون على الزجاجة';
        } else if (stepNum === 4) {
            if (!stepState.reactionDone) {
                title = '4. فوران التفاعل وتصاعد الغاز';
                desc = 'ارفع البالون أو اضغط زر "ابدأ التفاعل" لتسقط البيكربونات في الخل وتشاهد انطلاق الغاز!';
                btnText = 'جاري التفاعل...';
            } else {
                title = 'اكتمل التفاعل وتمدد البالون بالغاز!';
                desc = 'تفاعل حمض الأسيتيك مع بيكربونات الصوديوم وأنتج غاز ثاني أكسيد الكربون (CO₂) مسبباً انتفاخ البالون.';
                btnText = 'إعادة التجربة';
            }
        }

        // تحديث دوائر الـ Stepper
        for (let i = 1; i <= 4; i++) {
            const circle = document.getElementById(`stepCircle${i}`);
            if (circle) {
                circle.classList.remove('active', 'completed');
                if (i < stepNum) {
                    circle.classList.add('completed');
                } else if (i === stepNum) {
                    circle.classList.add('active');
                }
            }
        }

        // تحديث النصوص في الشريط الجانبي
        const titleEl = document.getElementById('currentStepTitle');
        const descEl = document.getElementById('currentStepDesc');
        const actionBtn = document.getElementById('btnMainAction');

        if (titleEl) titleEl.innerText = title;
        if (descEl) descEl.innerText = desc;
        if (actionBtn) {
            actionBtn.innerText = btnText;
            if (stepNum === 3 && stepState.balloonAttached) {
                actionBtn.classList.remove('disabled');
                actionBtn.classList.add('ready-pulse');
            } else if (stepNum === 4 && stepState.reactionDone) {
                actionBtn.classList.add('completed-btn');
                actionBtn.classList.remove('ready-pulse');
            } else {
                actionBtn.classList.remove('ready-pulse', 'completed-btn');
            }
        }

        // تحديث النصوص في شريط التعليمات العائم
        const floatPill = document.getElementById('floatingGuideStepText');
        const floatTitle = document.getElementById('floatingGuideTitle');
        const floatDesc = document.getElementById('floatingGuideDesc');
        const floatActionLabel = document.getElementById('floatingActionLabel');

        if (floatPill) floatPill.innerText = `الخطوة ${stepNum} من 4`;
        if (floatTitle) floatTitle.innerText = title;
        if (floatDesc) floatDesc.innerText = desc;
        if (floatActionLabel) floatActionLabel.innerText = btnText;
    }

    bindActionBtn() {
        const btn = document.getElementById('btnMainAction');
        if (btn) {
            btn.addEventListener('click', () => {
                soundManager.playClick();
                const state = dragDropEngine.state;
                if (state.step === 1 && !state.vinegarInBottle) {
                    if (dragDropEngine.state.funnelLocation !== 'bottle') {
                        dragDropEngine.moveFunnelToBottle();
                        setTimeout(() => { dragDropEngine.executeVinegarPour(); }, 400);
                    } else {
                        dragDropEngine.executeVinegarPour();
                    }
                } else if (state.step === 2 && !state.sodaInBalloon) {
                    if (dragDropEngine.state.funnelLocation !== 'balloon') {
                        dragDropEngine.moveFunnelToBalloon();
                        dragDropEngine.notifyState();
                    } else if (!dragDropEngine.state.sodaOnSpoon) {
                        dragDropEngine.executeScoopFromBowl();
                    } else {
                        dragDropEngine.executeSodaScoop();
                    }
                } else if (state.step === 3 && state.balloonAttached) {
                    dragDropEngine.triggerReaction();
                } else if (state.step === 3 && !state.balloonAttached) {
                    dragDropEngine.state.balloonAttached = true;
                    dragDropEngine.notifyState();
                } else if (state.step === 4 && state.reactionDone) {
                    const resetBtn = document.getElementById('btnResetExperiment');
                    if (resetBtn) resetBtn.click();
                }
            });
        }
    }

    bindModals() {
        // تلميحات
        const btnHints = document.getElementById('btnToolbarHints');
        const hintsModal = document.getElementById('modalHints');
        const closeHints = document.getElementById('btnCloseHints');

        if (btnHints && hintsModal) {
            btnHints.addEventListener('click', () => {
                soundManager.playClick();
                hintsModal.classList.add('open');
            });
        }
        if (closeHints && hintsModal) {
            closeHints.addEventListener('click', () => hintsModal.classList.remove('open'));
        }

        // ملاحظاتي
        const btnNotes = document.getElementById('btnToolbarNotes');
        const notesModal = document.getElementById('modalNotes');
        const closeNotes = document.getElementById('btnCloseNotes');

        if (btnNotes && notesModal) {
            btnNotes.addEventListener('click', () => {
                soundManager.playClick();
                notesModal.classList.add('open');
            });
        }
        if (closeNotes && notesModal) {
            closeNotes.addEventListener('click', () => notesModal.classList.remove('open'));
        }

        // إغلاق النوافذ عند النقر خارجها
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('lab-modal-backdrop')) {
                e.target.classList.remove('open');
            }
        });
    }

    bindNotesStorage() {
        const textarea = document.getElementById('studentNotesText');
        if (textarea) {
            const saved = localStorage.getItem('vinegar_balloon_notes');
            if (saved) textarea.value = saved;
            textarea.addEventListener('input', (e) => {
                localStorage.setItem('vinegar_balloon_notes', e.target.value);
            });
        }
    }

    bindBottomBar() {
        // تكبير وتصغير
        const btnZoomIn = document.getElementById('btnZoomIn');
        const btnZoomOut = document.getElementById('btnZoomOut');
        if (btnZoomIn) btnZoomIn.addEventListener('click', () => {
            soundManager.playClick();
            labScene.zoomIn();
        });
        if (btnZoomOut) btnZoomOut.addEventListener('click', () => {
            soundManager.playClick();
            labScene.zoomOut();
        });

        // ملء الشاشة
        const btnFullscreen = document.getElementById('btnFullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                soundManager.playClick();
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => console.log(err));
                } else {
                    document.exitFullscreen();
                }
            });
        }

        // الصوت
        const btnSound = document.getElementById('btnToggleAudio');
        if (btnSound) {
            btnSound.addEventListener('click', () => {
                const muted = soundManager.toggleMute();
                btnSound.innerHTML = muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
                btnSound.classList.toggle('muted', muted);
            });
        }
    }
}

export const uiOverlay = new UIOverlay();
