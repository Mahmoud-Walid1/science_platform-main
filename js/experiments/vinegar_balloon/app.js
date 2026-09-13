/**
 * app.js
 * Main Application Orchestrator & Bootstrapper
 * Clean Architecture
 */

import { soundManager } from './soundManager.js';
import { APPARATUS_SVGS } from './apparatus.js';
import { labScene } from './labScene.js';
import { reactionEngine } from './reactionEngine.js';
import { dragDropEngine } from './dragDropEngine.js';
import { variableManager } from './variableManager.js';
import { quizEngine } from './quizEngine.js';
import { uiOverlay } from './uiOverlay.js';

class VinegarBalloonApp {
    init() {
        // تهيئة المشهد ومحرك التفاعل والـ UI
        labScene.init('labStage');
        reactionEngine.init('bubblesCanvas');
        dragDropEngine.init();
        quizEngine.init();
        uiOverlay.init();

        // رسم الأدوات الأولية
        this.renderInitialApparatus();

        // الاستماع لتغيرات سحب وتفاعل الأدوات
        dragDropEngine.subscribe((state) => this.onStateChange(state));

        // ربط متحكمات الكميات (Variable Manager)
        this.bindVariableControls();

        // زر إعادة التجربة
        const resetBtn = document.getElementById('btnResetExperiment');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                soundManager.playClick();
                this.resetExperiment();
            });
        }

        // تفاعل النقر على البالون المعلق لبدء التفاعل
        const activeBalloonSlot = document.getElementById('activeBalloonSlot');
        if (activeBalloonSlot) {
            activeBalloonSlot.addEventListener('click', () => {
                if (dragDropEngine.state.balloonAttached && !dragDropEngine.state.reactionDone) {
                    dragDropEngine.triggerReaction();
                }
            });
        }
    }

    renderInitialApparatus() {
        // زجاجة المختبر المركزية
        const bottleContainer = document.getElementById('centralBottleContainer');
        if (bottleContainer) {
            bottleContainer.innerHTML = APPARATUS_SVGS.bottle(0, false, true);
        }

        // أداة القمع
        const funnelContainer = document.getElementById('tableFunnelContainer');
        if (funnelContainer) {
            funnelContainer.innerHTML = APPARATUS_SVGS.funnel();
        }

        // البالون على الطاولة (أول مرحلة غير منفوخ)
        const tableBalloon = document.getElementById('tableBalloonGraphic') || document.getElementById('tableBalloonContainer');
        if (tableBalloon) {
            tableBalloon.innerHTML = APPARATUS_SVGS.balloon('deflated', 1.0);
        }

        // ملعقة بيكربونات الصوديوم (تبدأ فارغة تماماً ونظيفة)
        const spoonContainer = document.getElementById('tableSpoonContainer');
        if (spoonContainer) {
            spoonContainer.innerHTML = APPARATUS_SVGS.spoon(false);
        }

        // زجاجة الخل
        const vinegarContainer = document.getElementById('tableVinegarContainer');
        if (vinegarContainer) {
            vinegarContainer.innerHTML = APPARATUS_SVGS.vinegarBottle();
        }

        // صحن البيكربونات
        const sodaBowlContainer = document.getElementById('tableSodaBowlContainer');
        if (sodaBowlContainer) {
            sodaBowlContainer.innerHTML = APPARATUS_SVGS.bakingSodaBowl();
        }

        // أدوات السايدبار المماثلة للتصميم
        this.renderSidebarIcons();
    }

    renderSidebarIcons() {
        const setHtml = (id, svg) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = svg;
        };
        setHtml('sideIconBottle', APPARATUS_SVGS.bottle(0, false, false));
        setHtml('sideIconBalloon', APPARATUS_SVGS.balloon('upright', 0.7));
        setHtml('sideIconFunnel', APPARATUS_SVGS.funnel());
        setHtml('sideIconSpoon', APPARATUS_SVGS.spoon(false));
        setHtml('sideIconVinegar', APPARATUS_SVGS.vinegarBottle());
        setHtml('sideIconSoda', APPARATUS_SVGS.bakingSodaBowl());
    }

    onStateChange(state) {
        uiOverlay.updateStep(state);

        const bottleContainer = document.getElementById('centralBottleContainer');
        const calc = variableManager.getCalculation();

        // تحديث حالة السائل بالزجاجة
        if (bottleContainer) {
            const liquidH = state.vinegarInBottle ? calc.liquidHeightPx : 0;
            bottleContainer.innerHTML = APPARATUS_SVGS.bottle(liquidH, false, true);
        }

        // تحديث موضع القمع (يتحرك القمع بانسيابية ويعود لمكانه مثل عبوة الخل)
        const tableFunnel = document.getElementById('tableFunnelContainer');
        const bottleFunnelSlot = document.getElementById('bottleFunnelSlot');
        const balloonFunnelSlot = document.getElementById('balloonFunnelSlot');

        if (tableFunnel) tableFunnel.style.display = 'block';
        if (bottleFunnelSlot) bottleFunnelSlot.style.display = 'none';
        if (balloonFunnelSlot) balloonFunnelSlot.style.display = 'none';

        // تحديث البالون
        const activeBalloonSlot = document.getElementById('activeBalloonSlot');
        const tableBalloon = document.getElementById('tableBalloonContainer');

        if (state.balloonAttached) {
            if (tableBalloon) tableBalloon.style.display = 'none';
            if (activeBalloonSlot) {
                activeBalloonSlot.style.display = 'block';
                if (!state.reactionDone && state.step === 3) {
                    activeBalloonSlot.innerHTML = APPARATUS_SVGS.balloon('hanging');
                } else if (state.step === 4 && state.reactionDone) {
                    activeBalloonSlot.innerHTML = APPARATUS_SVGS.balloon('upright', calc.scale);
                }
            }
        } else {
            if (activeBalloonSlot) activeBalloonSlot.style.display = 'none';
            if (tableBalloon) tableBalloon.style.display = 'block';
        }
    }

    bindVariableControls() {
        const vinegarSlider = document.getElementById('sliderVinegarVol');
        const sodaSlider = document.getElementById('sliderSodaSpoons');
        const valVinegar = document.getElementById('valVinegarVol');
        const valSoda = document.getElementById('valSodaSpoons');
        const co2Badge = document.getElementById('co2YieldBadge');

        if (vinegarSlider && valVinegar) {
            vinegarSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                valVinegar.innerText = `${val} مل`;
                variableManager.setVinegar(val);
                this.updateGasYieldDisplay(co2Badge);
            });
        }

        if (sodaSlider && valSoda) {
            sodaSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                valSoda.innerText = `${val} ملاعق`;
                variableManager.setSoda(val);
                dragDropEngine.state.sodaSpoonsNeeded = val;
                this.updateGasYieldDisplay(co2Badge);
                uiOverlay.updateStep(dragDropEngine.state);
            });
        }

        this.updateGasYieldDisplay(co2Badge);
    }

    updateGasYieldDisplay(co2Badge) {
        if (!co2Badge) return;
        const calc = variableManager.getCalculation();
        co2Badge.innerText = `حجم الغاز المتوقع: ~${calc.co2Liters} لتر (معامل تمدد: ×${calc.scale.toFixed(2)})`;
    }

    resetExperiment() {
        dragDropEngine.resetAll();
        quizEngine.reset();
        labScene.resetZoom();
        this.renderInitialApparatus();
    }
}

// تشغيل التطبيق عند اكتمال تحميل الـ DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new VinegarBalloonApp();
    app.init();
});
