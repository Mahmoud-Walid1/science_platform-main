/**
 * dragDropEngine.js
 * Touch & Mouse Drag and Drop Engine with Snap Targets & Guided Flow
 * Clean Architecture - Single Responsibility
 */

import { soundManager } from './soundManager.js';
import { variableManager } from './variableManager.js';
import { reactionEngine } from './reactionEngine.js';
import { APPARATUS_SVGS } from './apparatus.js';

class DragDropEngine {
    constructor() {
        this.currentDrag = null;
        this.startX = 0;
        this.startY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.state = {
            step: 1, // 1: Funnel & Vinegar -> 2: Funnel & Soda in Balloon -> 3: Attach Balloon -> 4: Lift & React
            funnelLocation: 'bench', // 'bench', 'bottle', 'balloon'
            vinegarInBottle: false,
            sodaInBalloon: false,
            sodaOnSpoon: false,
            balloonAttached: false,
            reactionDone: false
        };
        this.listeners = [];
    }

    init() {
        this.bindDraggables();
        this.bindSnapTargets();
    }

    subscribe(fn) {
        this.listeners.push(fn);
    }

    notifyState() {
        this.listeners.forEach(fn => fn(this.state));
    }

    bindDraggables() {
        const draggables = document.querySelectorAll('.draggable-item');
        draggables.forEach(el => {
            el.addEventListener('mousedown', (e) => this.onDragStart(e, el));
            el.addEventListener('touchstart', (e) => this.onDragStart(e, el), { passive: false });
        });

        window.addEventListener('mousemove', (e) => this.onDragMove(e));
        window.addEventListener('touchmove', (e) => this.onDragMove(e), { passive: false });

        window.addEventListener('mouseup', (e) => this.onDragEnd(e));
        window.addEventListener('touchend', (e) => this.onDragEnd(e));
    }

    bindSnapTargets() {
        // Snap targets are checked by proximity in checkDropTarget
    }

    onDragStart(e, el) {
        e.preventDefault();
        this.currentDrag = el;
        el.style.transition = 'none';

        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        this.startX = clientX;
        this.startY = clientY;

        // حفظ الإزاحة الحالية إن وجدت حتى يستمر السحب من موضع العنصر الحالي دون قفز
        let tx = 0, ty = 0;
        if (window.getComputedStyle) {
            const style = window.getComputedStyle(el);
            const transform = style.transform || style.webkitTransform;
            if (transform && transform !== 'none') {
                try {
                    const matrix = new DOMMatrix(transform);
                    tx = matrix.m41;
                    ty = matrix.m42;
                } catch (err) {}
            }
        }
        this.initialTranslateX = tx;
        this.initialTranslateY = ty;

        el.classList.add('is-dragging');
        soundManager.playClick();
        this.highlightSnapTargets(el.dataset.tool);
    }

    onDragMove(e) {
        if (!this.currentDrag) return;
        e.preventDefault();

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        const deltaX = this.initialTranslateX + (clientX - this.startX);
        const deltaY = this.initialTranslateY + (clientY - this.startY);

        this.currentDrag.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.08)`;
    }

    onDragEnd(e) {
        if (!this.currentDrag) return;

        const draggedEl = this.currentDrag;
        this.currentDrag = null;
        draggedEl.classList.remove('is-dragging');

        const clientX = e.type === 'touchend' && e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.type === 'touchend' && e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        const matchedTarget = this.checkDropTarget(clientX, clientY, draggedEl.dataset.tool);
        this.clearSnapTargets();

        let handled = false;
        if (matchedTarget) {
            handled = this.handleSuccessfulDrop(draggedEl.dataset.tool, matchedTarget);
        }

        if (!handled) {
            // العودة للموضع الذي بدأ منه السحب بسلاسة
            draggedEl.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
            draggedEl.style.transform = `translate(${this.initialTranslateX}px, ${this.initialTranslateY}px)`;
            setTimeout(() => {
                draggedEl.style.transition = '';
            }, 300);
        }
    }

    checkDropTarget(x, y, toolType) {
        // Proximity detection for bottle mouth (radius 110px)
        const bottleMouth = document.getElementById('targetBottleMouth') || document.getElementById('centralBottleContainer');
        if (bottleMouth) {
            const rect = bottleMouth.getBoundingClientRect();
            const targetCenterX = rect.left + rect.width / 2;
            const targetCenterY = rect.top + 35;
            const dist = Math.hypot(x - targetCenterX, y - targetCenterY);
            if (dist < 110) {
                return 'bottleMouth';
            }
        }

        // Proximity detection for balloon mouth (radius 85px to prevent false triggers)
        const balloonMouth = document.getElementById('targetBalloonMouth') || document.getElementById('tableBalloonContainer');
        if (balloonMouth) {
            const rect = balloonMouth.getBoundingClientRect();
            const targetCenterX = rect.left + rect.width / 2;
            const targetCenterY = rect.top + 30;
            const dist = Math.hypot(x - targetCenterX, y - targetCenterY);
            if (dist < 85) {
                return 'balloonMouth';
            }
        }

        // Proximity detection for soda bowl (radius 130px)
        if (toolType === 'spoon') {
            const bowl = document.getElementById('tableSodaBowlContainer');
            if (bowl) {
                const rect = bowl.getBoundingClientRect();
                const targetCenterX = rect.left + rect.width / 2;
                const targetCenterY = rect.top + rect.height / 2;
                const dist = Math.hypot(x - targetCenterX, y - targetCenterY);
                if (dist < 130) {
                    return 'sodaBowl';
                }
            }
        }

        return null;
    }

    highlightSnapTargets(toolType) {
        // No visible circles per user instructions
    }

    clearSnapTargets() {
        // No visible circles
    }

    getBaseRect(el) {
        let tx = 0, ty = 0;
        if (window.getComputedStyle) {
            const style = window.getComputedStyle(el);
            const transform = style.transform || style.webkitTransform;
            if (transform && transform !== 'none') {
                try {
                    const matrix = new DOMMatrix(transform);
                    tx = matrix.m41;
                    ty = matrix.m42;
                } catch (e) {
                    const match = transform.match(/matrix.*\((.+)\)/);
                    if (match) {
                        const parts = match[1].split(',').map(s => parseFloat(s.trim()));
                        if (parts.length >= 6) {
                            tx = parts[4];
                            ty = parts[5];
                        }
                    }
                }
            }
        }
        const rect = el.getBoundingClientRect();
        return {
            left: rect.left - tx,
            top: rect.top - ty,
            width: rect.width,
            height: rect.height
        };
    }

    moveFunnelToBottle() {
        const funnelEl = document.getElementById('tableFunnelContainer');
        const bottleMouth = document.getElementById('targetBottleMouth') || document.getElementById('centralBottleContainer');
        if (funnelEl && bottleMouth) {
            const fBase = this.getBaseRect(funnelEl);
            const bRect = bottleMouth.getBoundingClientRect();

            const deltaX = (bRect.left + bRect.width / 2) - (fBase.left + fBase.width / 2);
            const deltaY = (bRect.top + 18) - fBase.top;

            funnelEl.style.zIndex = '40';
            funnelEl.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
            funnelEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            this.state.funnelLocation = 'bottle';
        }
    }

    moveFunnelToBalloon() {
        const funnelEl = document.getElementById('tableFunnelContainer');
        const balloonEl = document.getElementById('tableBalloonContainer');
        if (funnelEl && balloonEl) {
            const fBase = this.getBaseRect(funnelEl);
            const blRect = balloonEl.getBoundingClientRect();

            const deltaX = (blRect.left + blRect.width / 2) - (fBase.left + fBase.width / 2);
            const deltaY = (blRect.top - 65) - fBase.top;

            funnelEl.style.zIndex = '40';
            funnelEl.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
            funnelEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            this.state.funnelLocation = 'balloon';
        }
    }

    returnFunnelToBench() {
        const funnelEl = document.getElementById('tableFunnelContainer');
        if (funnelEl) {
            funnelEl.style.transition = 'transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)';
            funnelEl.style.transform = 'translate(0px, 0px)';
            setTimeout(() => {
                funnelEl.style.zIndex = '';
            }, 650);
        }
        this.state.funnelLocation = 'bench';
    }

    handleSuccessfulDrop(toolType, targetId) {
        // الخطوة 1: وضع القمع في الزجاجة
        if (toolType === 'funnel' && !this.state.vinegarInBottle) {
            this.moveFunnelToBottle();
            soundManager.playClick();
            this.notifyState();
            return true;
        }
        // الخطوة 1: سكب الخل داخل القمع في الزجاجة
        else if (toolType === 'vinegar' && targetId === 'bottleMouth' && !this.state.vinegarInBottle) {
            if (this.state.funnelLocation !== 'bottle') {
                this.moveFunnelToBottle();
                this.notifyState();
                setTimeout(() => { this.executeVinegarPour(); }, 400);
            } else {
                this.executeVinegarPour();
            }
            return true;
        }
        // الخطوة 2: وضع القمع في البالون
        else if (toolType === 'funnel' && this.state.vinegarInBottle && !this.state.sodaInBalloon) {
            this.moveFunnelToBalloon();
            soundManager.playClick();
            this.notifyState();
            return true;
        }
        // الخطوة 2: غرف البيكربونات بالملعقة من وعاء البيكربونات
        else if (toolType === 'spoon' && targetId === 'sodaBowl' && !this.state.sodaInBalloon) {
            this.executeScoopFromBowl();
            return true;
        }
        // الخطوة 2: سكب البيكربونات بالملعقة داخل القمع في البالون
        else if (toolType === 'spoon' && targetId === 'balloonMouth' && !this.state.sodaInBalloon) {
            if (this.state.sodaOnSpoon && this.state.funnelLocation === 'balloon') {
                this.executeSodaScoop();
                return true;
            }
            return false;
        }
        // الخطوة 3: تثبيت البالون على فوهة الزجاجة
        else if (toolType === 'balloon' && targetId === 'bottleMouth' && this.state.sodaInBalloon) {
            this.state.balloonAttached = true;
            this.state.step = 3;
            soundManager.playClick();
            this.notifyState();
            return true;
        }

        return false;
    }

    executeVinegarPour() {
        const vinegarEl = document.getElementById('tableVinegarContainer');
        const bottleFunnel = document.getElementById('tableFunnelContainer') || document.getElementById('targetBottleMouth') || document.getElementById('centralBottleContainer');
        const pourAnim = document.getElementById('vinegarPourAnimation');
        const volumeBadge = document.getElementById('vinegarVolumeBadge');

        if (vinegarEl && bottleFunnel) {
            const vBase = this.getBaseRect(vinegarEl);
            const fRect = bottleFunnel.getBoundingClientRect();

            // Mouth of vinegar bottle is at x=45px, y=15px
            const mouthBaseX = vBase.left + 45;
            const mouthBaseY = vBase.top + 15;

            // Target is top rim of the funnel at the bottle
            const funnelRimX = fRect.left + fRect.width / 2;
            const funnelRimY = fRect.top + 15;

            // Delta to place mouth of vinegar bottle right at funnel rim, tilting clockwise
            const deltaX = (funnelRimX - 20) - mouthBaseX;
            const deltaY = (funnelRimY - 10) - mouthBaseY;

            vinegarEl.style.transformOrigin = '45px 15px';
            vinegarEl.style.zIndex = '60';
            vinegarEl.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)';
            vinegarEl.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(52deg) scale(1.1)`;
        }

        // بدء التدفق بعد اكتمال وصول العبوة لفوهة القمع
        setTimeout(() => {
            const calc = variableManager.getCalculation();
            const targetLiquidHeight = calc.liquidHeightPx || 70;
            const targetMl = variableManager.vinegarVolume || 100;
            const duration = 2500; // 2.5 ثانية للسكب التفاعلي التدريجي المعملي

            soundManager.playPourLiquid(2.5);
            if (pourAnim) pourAnim.classList.add('active-pouring');

            if (volumeBadge) {
                volumeBadge.textContent = '0 مل';
                volumeBadge.style.display = 'block';
                volumeBadge.style.opacity = '1';
            }

            const bottleHousing = document.getElementById('centralBottleContainer');
            // تأكيد وجود مجسم الزجاجة المركزية بالمعرفات الفريدة الخاصة بها
            if (bottleHousing && !bottleHousing.querySelector('#centralLiquidSurface')) {
                bottleHousing.innerHTML = APPARATUS_SVGS.bottle(0, false, true);
            }

            const bottleLiquidGroup = document.getElementById('centralLiquidGroup') || (bottleHousing && bottleHousing.querySelector('#bottleLiquidGroup'));
            const liquidSurface = document.getElementById('centralLiquidSurface') || (bottleHousing && bottleHousing.querySelector('#liquidSurface'));
            const liquidSurfaceEllipse = document.getElementById('centralLiquidEllipse') || (bottleHousing && bottleHousing.querySelector('#liquidSurfaceEllipse'));
            const vinegarLiquidPath = vinegarEl ? vinegarEl.querySelector('#vinegarBottleLiquidPath') : null;

            if (bottleLiquidGroup) {
                bottleLiquidGroup.style.opacity = '1';
            }

            const startTime = performance.now();

            const animatePourFrame = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(1, Math.max(0, elapsed / duration));
                // منحنى حركة انسيابي (Smooth Ease-in-out)
                const ease = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                const currentH = targetLiquidHeight * ease;
                const currentMl = Math.round(targetMl * ease);

                // 1. ارتفاع السائل تدريجياً في زجاجة التفاعل مع تموج السطح
                if (liquidSurface) {
                    const y = 360 - currentH;
                    const wobble = progress < 1 ? Math.sin(now * 0.018) * 2.2 : 0;
                    liquidSurface.setAttribute('d', `M 32 360 L 32 ${y} Q 80 ${y - 2 + wobble} 128 ${y} L 128 360 Q 80 365 32 360 Z`);
                }
                if (liquidSurfaceEllipse) {
                    const y = 360 - currentH;
                    liquidSurfaceEllipse.setAttribute('cy', y);
                }

                // 2. تناقص سائل الخل المتزامن في العبوة المائلة
                if (vinegarLiquidPath) {
                    const fillRatio = 1.0 - (ease * 0.72);
                    const vTopY = 200 - Math.max(12, 75 * fillRatio);
                    vinegarLiquidPath.setAttribute('d', `M 23 ${vTopY} Q 60 ${vTopY + 5} 97 ${vTopY} L 97 200 Q 60 212 23 200 Z`);
                }

                // 3. تحديث قراءة عداد المليلترات الرقمي
                if (volumeBadge) {
                    volumeBadge.textContent = `${currentMl} مل`;
                }

                if (progress < 1) {
                    requestAnimationFrame(animatePourFrame);
                } else {
                    // انتهاء تيار السكب
                    if (pourAnim) pourAnim.classList.remove('active-pouring');

                    // استقرار السائل ثم عودة العبوة والقمع
                    setTimeout(() => {
                        if (vinegarEl) {
                            vinegarEl.style.transition = 'transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)';
                            vinegarEl.style.transform = 'translate(0px, 0px) rotate(0deg) scale(1)';
                            setTimeout(() => { vinegarEl.style.zIndex = ''; }, 650);
                        }

                        // إرجاع القمع لمكانه على الطاولة فور انتهاء مهمة سكب الخل
                        this.returnFunnelToBench();

                        // إخفاء شارة العداد بعد ثانية ونصف بسلاسة
                        if (volumeBadge) {
                            setTimeout(() => {
                                volumeBadge.style.opacity = '0';
                                setTimeout(() => { volumeBadge.style.display = 'none'; }, 300);
                            }, 1200);
                        }

                        this.state.vinegarInBottle = true;
                        this.state.step = 2;
                        soundManager.playSuccess();
                        this.notifyState();
                    }, 350);
                }
            };

            requestAnimationFrame(animatePourFrame);
        }, 350);
    }

    executeScoopFromBowl() {
        const spoonEl = document.getElementById('tableSpoonContainer');
        const bowlEl = document.getElementById('tableSodaBowlContainer');

        if (spoonEl && bowlEl) {
            const sBase = this.getBaseRect(spoonEl);
            const bRect = bowlEl.getBoundingClientRect();

            const deltaX = (bRect.left + bRect.width / 2 - 35) - (sBase.left + 30);
            const deltaY = (bRect.top + 30) - (sBase.top + 35);

            spoonEl.style.zIndex = '60';
            spoonEl.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
            spoonEl.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(-15deg)`;
        }

        soundManager.playPourPowder(0.7);

        // ملء الملعقة بالمسحوق فوراً وبشكل بارز، وتركها في مكانها محملة بالمسحوق
        setTimeout(() => {
            this.state.sodaOnSpoon = true;
            const spoonEl = document.getElementById('tableSpoonContainer');
            if (spoonEl) {
                spoonEl.innerHTML = APPARATUS_SVGS.spoon(true);
            }
            soundManager.playClick();
            this.notifyState();
        }, 350);
    }

    executeSodaScoop() {
        const spoonEl = document.getElementById('tableSpoonContainer');
        const balloonFunnel = document.getElementById('tableFunnelContainer') || document.getElementById('targetBalloonMouth') || document.getElementById('tableBalloonContainer');
        const scoopAnim = document.getElementById('sodaPourAnimation');

        if (spoonEl && balloonFunnel) {
            const sBase = this.getBaseRect(spoonEl);
            const bRect = balloonFunnel.getBoundingClientRect();

            // Spoon bowl is at left side of spoon SVG (x=30px, y=35px)
            const spoonBowlBaseX = sBase.left + 30;
            const spoonBowlBaseY = sBase.top + 35;

            // Target is top rim of the balloon's funnel
            const targetX = bRect.left + bRect.width / 2;
            const targetY = bRect.top + 10;

            const deltaX = targetX - spoonBowlBaseX;
            const deltaY = targetY - spoonBowlBaseY;

            spoonEl.style.transformOrigin = '30px 35px';
            spoonEl.style.zIndex = '60';
            spoonEl.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)';
            spoonEl.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(-40deg) scale(1.15)`;
        }

        soundManager.playPourPowder(1.4);
        if (scoopAnim) scoopAnim.classList.add('active-pouring');

        setTimeout(() => {
            if (scoopAnim) scoopAnim.classList.remove('active-pouring');
            
            // إظهار مسحوق البيكربونات مستقراً داخل قاع البالون
            const powderFill = document.getElementById('balloonPowderFill');
            if (powderFill) powderFill.style.display = 'block';

            // تفريغ الملعقة وإرجاعها لمكانها الأصلي فقط بعد انتهاء المهمة
            this.state.sodaOnSpoon = false;
            if (spoonEl) {
                spoonEl.innerHTML = APPARATUS_SVGS.spoon(false);
                spoonEl.style.transition = 'transform 0.6s ease';
                spoonEl.style.transform = 'translate(0px, 0px) rotate(0deg) scale(1)';
                setTimeout(() => { spoonEl.style.zIndex = ''; }, 600);
            }

            // إرجاع القمع لمكانه على الطاولة فور انتهاء مهمته بالضبط مثل الملعقة والخل
            this.returnFunnelToBench();

            this.state.sodaInBalloon = true;
            this.state.step = 3;
            soundManager.playSuccess();
            this.notifyState();
        }, 1500);
    }

    triggerReaction() {
        if (!this.state.balloonAttached || this.state.reactionDone) return;
        this.state.step = 4;

        // وضع البالون رأسياً لكن مفرغ تماماً وغير منفوخ في البداية
        const activeBalloonSlot = document.getElementById('activeBalloonSlot');
        if (activeBalloonSlot) {
            activeBalloonSlot.innerHTML = APPARATUS_SVGS.balloon('upright', 0.12);
        }

        soundManager.playPourPowder(0.8);

        // بعد لحظة سقوط المسحوق يبدأ فوران الغاز وتصاعده وانتفاخ البالون تدريجياً
        setTimeout(() => {
            reactionEngine.startReaction(() => {
                this.state.reactionDone = true;
                this.notifyState();
            });
        }, 500);

        this.notifyState();
    }

    resetAll() {
        this.state = {
            step: 1,
            funnelLocation: 'bench',
            vinegarInBottle: false,
            sodaInBalloon: false,
            sodaOnSpoon: false,
            balloonAttached: false,
            reactionDone: false
        };

        const powderFill = document.getElementById('balloonPowderFill');
        if (powderFill) powderFill.style.display = 'none';

        const spoonEl = document.getElementById('tableSpoonContainer');
        if (spoonEl) {
            spoonEl.innerHTML = APPARATUS_SVGS.spoon(false);
            spoonEl.style.transform = 'translate(0px, 0px)';
        }

        const vinegarContainer = document.getElementById('tableVinegarContainer');
        if (vinegarContainer) {
            vinegarContainer.innerHTML = APPARATUS_SVGS.vinegarBottle(1.0);
        }

        const volumeBadge = document.getElementById('vinegarVolumeBadge');
        if (volumeBadge) {
            volumeBadge.style.display = 'none';
            volumeBadge.style.opacity = '0';
            volumeBadge.textContent = '0 مل';
        }

        ['tableVinegarContainer', 'tableFunnelContainer', 'tableBalloonContainer'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.transform = 'translate(0px, 0px)';
                el.style.display = 'block';
            }
        });

        reactionEngine.reset();
        this.notifyState();
    }
}

export const dragDropEngine = new DragDropEngine();
