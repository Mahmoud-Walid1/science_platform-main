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

        const doToggle = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            soundManager.playClick();
            if (!dock) return;

            const isCollapsed = dock.classList.toggle('is-collapsed');
            if (isCollapsed) {
                if (icon) icon.className = 'fas fa-eye';
                if (label) label.textContent = 'إظهار التعليمات';
                if (toggleBtn) toggleBtn.title = 'إظهار شريط التعليمات';
            } else {
                if (icon) icon.className = 'fas fa-eye-slash';
                if (label) label.textContent = 'إخفاء التعليمات';
                if (toggleBtn) toggleBtn.title = 'إخفاء شريط التعليمات';
            }
        };

        if (toggleBtn) {
            toggleBtn.onclick = doToggle;
        }

        // إتاحة النقر على الشارة العائمة المصغرة لإعادة فتح التعليمات بالكامل
        if (dock) {
            dock.addEventListener('click', (e) => {
                if (dock.classList.contains('is-collapsed')) {
                    doToggle(e);
                }
            });
        }

        window.toggleGuideDock = doToggle;
    }

    updateStep(stepState) {
        const { vinegarInBottle, sodaInBalloon, balloonAttached, reactionDone } = stepState;
        const added = stepState.sodaSpoonsAdded || 0;
        const needed = stepState.sodaSpoonsNeeded || 2;

        let stepNum = 1;
        let title = '';
        let desc = '';

        if (!vinegarInBottle && !sodaInBalloon) {
            stepNum = 1;
            title = '1. تحضير المواد المتفاعلة (الخل أو البيكربونات)';
            desc = 'اسحب القمع وضعه على الزجاجة لسكب الخل، أو ضعه على البالون لغرف البيكربونات بحرية تامة.';
        } else if (vinegarInBottle && !sodaInBalloon) {
            stepNum = 2;
            if (stepState.funnelLocation !== 'balloon') {
                title = '2. وضع القمع في البالون';
                desc = 'تم سكب الخل بنجاح! الآن اسحب القمع وضعه في عنق البالون المفرغ على الطاولة.';
            } else if (!stepState.sodaOnSpoon) {
                title = `2. غرف مسحوق البيكربونات (${added}/${needed})`;
                desc = `اسحب الملعقة إلى صحن البيكربونات لملئها بالمسحوق (ملعقة ${added + 1} من ${needed}).`;
            } else {
                title = `2. تفريغ المسحوق في البالون (${added + 1}/${needed})`;
                desc = 'اسحب الملعقة المحملة بالمسحوق إلى قمع البالون لتفريغها داخله.';
            }
        } else if (!vinegarInBottle && sodaInBalloon) {
            stepNum = 1;
            title = '1. إضافة الخل إلى الزجاجة';
            desc = 'تمت تعبئة البالون بالمسحوق بنجاح! الآن اسحب القمع وضعه على الزجاجة ثم اسكب كمية الخل عبر القمع.';
        } else if (!balloonAttached) {
            stepNum = 3;
            title = '3. تثبيت البالون على فوهة الزجاجة';
            desc = 'المواد جاهزة! اسحب البالون وثبته على فوهة الزجاجة دون سكب المسحوق حتى يستقر بإحكام.';
        } else if (!reactionDone) {
            stepNum = 4;
            title = '4. بدء التفاعل الكيميائي وتصاعد الغاز';
            desc = 'انقر على البالون أو اضغط "ابدأ التفاعل" لسكب البيكربونات في الخل ومشاهدة فوران الغاز وانتفاخ البالون!';
        } else {
            stepNum = 4;
            title = 'اكتمل التفاعل وتمدد البالون بالغاز!';
            desc = 'تفاعل حمض الأسيتيك مع بيكربونات الصوديوم ونتج غاز ثاني أكسيد الكربون (CO₂) مسبباً تمدد وانتفاخ البالون.';
        }

        // تحديث دوائر الـ Stepper الأربعة
        const s1 = document.getElementById('stepCircle1');
        const s2 = document.getElementById('stepCircle2');
        const s3 = document.getElementById('stepCircle3');
        const s4 = document.getElementById('stepCircle4');

        if (s1) {
            s1.className = 'step-circle' + (vinegarInBottle ? ' completed' : (!sodaInBalloon ? ' active' : ''));
        }
        if (s2) {
            s2.className = 'step-circle' + (sodaInBalloon ? ' completed' : (vinegarInBottle ? ' active' : ''));
        }
        if (s3) {
            s3.className = 'step-circle' + (balloonAttached ? ' completed' : (vinegarInBottle && sodaInBalloon ? ' active' : ''));
        }
        if (s4) {
            s4.className = 'step-circle' + (reactionDone ? ' completed' : (balloonAttached ? ' active' : ''));
        }

        // تحديث نصوص الشريط الجانبي
        const titleEl = document.getElementById('currentStepTitle');
        const descEl = document.getElementById('currentStepDesc');
        const actionBtn = document.getElementById('btnMainAction');

        if (titleEl) titleEl.innerText = title;
        if (descEl) descEl.innerText = desc;

        if (actionBtn) {
            if (balloonAttached && !reactionDone) {
                actionBtn.style.display = 'inline-flex';
                actionBtn.className = 'btn-main-action ready-pulse';
                actionBtn.innerHTML = '<i class="fas fa-flask"></i> ابدأ التفاعل الكيميائي';
            } else if (reactionDone) {
                actionBtn.style.display = 'inline-flex';
                actionBtn.className = 'btn-main-action completed-btn';
                actionBtn.innerHTML = '<i class="fas fa-sync-alt"></i> إعادة التجربة';
            } else {
                // إخفاء الزر أثناء خطوات السكب والتحضير لأن المعلم والطلاب يقومون بها بالسحب التفاعلي المباشر
                actionBtn.style.display = 'none';
            }
        }

        // تحديث نصوص شريط التعليمات العائم
        const floatPill = document.getElementById('floatingGuideStepText');
        const floatTitle = document.getElementById('floatingGuideTitle');
        const floatDesc = document.getElementById('floatingGuideDesc');

        if (floatPill) floatPill.innerText = `الخطوة ${stepNum} من 4`;
        if (floatTitle) floatTitle.innerText = title;
        if (floatDesc) floatDesc.innerText = desc;
    }

    bindActionBtn() {
        const btn = document.getElementById('btnMainAction');
        if (btn) {
            btn.addEventListener('click', () => {
                soundManager.playClick();
                const state = dragDropEngine.state;
                if (state.balloonAttached && !state.reactionDone) {
                    dragDropEngine.triggerReaction();
                } else if (state.reactionDone) {
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
