// ══════════════════════════════════════════════════════════════
// svgDragDrop.js - محرك السحب والإفلات الناعم لرسوميات SVG المتجهية
// مختبر البناء الضوئي والتنفس الخلوي | Clean Architecture
// ══════════════════════════════════════════════════════════════

class SvgDragDrop {
    constructor(svgScene, experimentEngine) {
        this.svgScene = svgScene;
        this.svg = svgScene.svg;
        this.engine = experimentEngine;

        this.draggedElement = null;
        this.dragType = null;
        this.dragIndex = null;
        this.initialTransform = '';
        this.startPointer = { x: 0, y: 0 };
        this.currentPointer = { x: 0, y: 0 };
        this.activeClone = null;

        this.initEvents();
        this.recordOriginalTransforms();
    }

    getInitialTransform(type, index) {
        switch (type) {
            case 'box':
                return parseInt(index) === 1 ? 'translate(435, 95)' : 'translate(495, 95)';
            case 'stopper':
                return `translate(${25 + parseInt(index) * 40}, 50)`;
            case 'cap':
                return `translate(${25 + parseInt(index) * 40}, 91)`;
            case 'plant':
                return `translate(${16 + (parseInt(index) - 1) * 28}, 15)`;
            case 'placed_box':
                return 'translate(-11, -30)';
            case 'placed_stopper':
                return 'translate(14, -2)';
            case 'pipette':
                return 'translate(337, 305)';
            default:
                return '';
        }
    }

    recordOriginalTransforms() {
        if (!this.svg) return;
        this.svg.querySelectorAll('.svg-draggable').forEach(el => {
            const type = el.getAttribute('data-type');
            const idx = el.getAttribute('data-index') || el.getAttribute('data-id') || el.getAttribute('data-tube');
            const defaultTransform = this.getInitialTransform(type, idx) || el.getAttribute('transform') || '';
            el.setAttribute('data-orig-transform', defaultTransform);
        });
    }

    initEvents() {
        this.lastActionTime = 0;
        this.svg.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', (e) => this.onPointerUp(e));
        window.addEventListener('pointercancel', (e) => this.onPointerUp(e));

        // النقر المباشر لإزالة الصناديق أو السدادات أو النباتات فردياً وبدقة
        this.svg.addEventListener('click', (e) => {
            const now = Date.now();
            if (now - this.lastActionTime < 400) {
                e.stopPropagation();
                return;
            }

            // 1. النقر على صندوق يغطي أنبوباً -> إزالة هذا الصندوق فقط
            const boxEl = e.target.closest('[id^="tube_box_"]') || e.target.closest('[data-type="placed_box"]');
            if (boxEl) {
                const num = parseInt(boxEl.getAttribute('data-tube') || boxEl.id.replace('tube_box_', ''));
                if (num && this.engine.tubesState && this.engine.tubesState[num - 1] && this.engine.tubesState[num - 1].hasBox) {
                    this.lastActionTime = Date.now() + 400;
                    this.removeTubeBox(num);
                    e.stopPropagation();
                    return;
                }
            }

            // 2. النقر على سدادة أنبوب -> إزالة هذه السدادة فقط
            const stopperEl = e.target.closest('[id^="tube_stopper_"]') || e.target.closest('[data-type="placed_stopper"]');
            if (stopperEl) {
                const num = parseInt(stopperEl.getAttribute('data-tube') || stopperEl.id.replace('tube_stopper_', ''));
                if (num && this.engine.tubesState && this.engine.tubesState[num - 1] && this.engine.tubesState[num - 1].hasStopper) {
                    this.lastActionTime = Date.now() + 400;
                    this.removeTubeStopper(num);
                    e.stopPropagation();
                    return;
                }
            }

            // تم إلغاء التغطية بالنقر المباشر ليكون التفاعل معتمداً كلياً على سحب الغطاء من الرف
        });
    }

    // إزالة صندوق الحجب عن الأنبوب وإعادته لمكانه في الرف
    removeTubeBox(tubeNum) {
        if (!tubeNum) return;
        const tubeIdx = tubeNum - 1;
        if (this.engine.tubesState && this.engine.tubesState[tubeIdx]) {
            this.engine.tubesState[tubeIdx].hasBox = false;
        }
        if (this.engine.syncBoxesState) {
            this.engine.syncBoxesState(tubeIdx);
        } else {
            this.svgScene.setTubeBoxVisible(tubeNum, false);
            const tubeBoxEl = document.getElementById(`tube_box_${tubeNum}`);
            if (tubeBoxEl) {
                tubeBoxEl.setAttribute('transform', 'translate(-11, -30)');
                tubeBoxEl.style.display = 'none';
            }
            const boxEl = document.getElementById(`box_source_${tubeNum}`);
            if (boxEl) {
                boxEl.setAttribute('transform', `translate(${405 + tubeIdx * 52}, 95)`);
                boxEl.style.display = 'block';
            }
        }

        this.lastActionTime = Date.now() + 400;
        if (this.engine.audioManager) this.engine.audioManager.playThud();
        this.engine.uiOverlay.showToast(`تمت إزالة صندوق العزل عن الأنبوب ${tubeNum} وإعادته لمكانه في الرف 📦`);
        if (this.engine.currentPhase === 2) {
            this.engine.checkPhase2Progress();
        } else {
            this.engine.checkPhase1Progress();
        }
    }

    // نزع السدادة المطاطية عن الأنبوب وإعادتها لمكانها في الرف
    removeTubeStopper(tubeNum) {
        if (!tubeNum) return;
        const tubeIdx = tubeNum - 1;
        let returnSlot = null;
        if (this.engine.tubesState && this.engine.tubesState[tubeIdx]) {
            this.engine.tubesState[tubeIdx].hasStopper = false;
            returnSlot = this.engine.tubesState[tubeIdx].shelfStopperIndex;
            this.engine.tubesState[tubeIdx].shelfStopperIndex = null;
        }
        if (this.engine.shelfStoppersState) {
            if (returnSlot === null || returnSlot === undefined || returnSlot < 0) {
                returnSlot = this.engine.shelfStoppersState.findIndex(s => !s);
            }
            if (returnSlot >= 0 && returnSlot < 4) {
                this.engine.shelfStoppersState[returnSlot] = true;
            }
        }
        if (this.engine.syncStoppersState) {
            this.engine.syncStoppersState(returnSlot);
        } else {
            this.svgScene.setTubeStopperVisible(tubeNum, false);
            const tubeStopperEl = document.getElementById(`tube_stopper_${tubeNum}`);
            if (tubeStopperEl) {
                tubeStopperEl.setAttribute('transform', 'translate(14, -12)');
                tubeStopperEl.style.display = 'none';
            }
            const shelfEl = document.getElementById(`shelf_stopper_group_${returnSlot !== null ? returnSlot : tubeIdx}`);
            if (shelfEl) {
                shelfEl.style.display = 'block';
            }
        }

        this.lastActionTime = Date.now() + 400;
        if (this.engine.audioManager) this.engine.audioManager.playPop();
        this.engine.uiOverlay.showToast(`تم نزع السدادة المطاطية عن الأنبوب ${tubeNum} وإعادتها لمكانها في الرف ✓`);
        if (this.engine.currentPhase === 2) {
            this.engine.checkPhase2Progress();
        } else {
            this.engine.checkPhase1Progress();
        }
    }

    // إخراج نبات الإيلوديا من الأنبوب وإعادته لحوض الإيلوديا
    removeTubePlant(tubeNum) {
        if (!tubeNum) return;
        const tubeIdx = tubeNum - 1;
        if (this.engine.tubesState && this.engine.tubesState[tubeIdx]) {
            this.engine.tubesState[tubeIdx].hasPlant = false;
        }
        this.svgScene.setTubePlantVisible(tubeNum, false);

        let restoredEl = null;
        if (this.engine.tubesState && this.engine.tubesState[tubeIdx] && this.engine.tubesState[tubeIdx].placedPlantElement) {
            restoredEl = this.engine.tubesState[tubeIdx].placedPlantElement;
            this.engine.tubesState[tubeIdx].placedPlantElement = null;
        } else {
            for (let i = 1; i <= 4; i++) {
                const el = document.getElementById(`elodea_plant_source_${i}`);
                if (el && el.style.display === 'none') {
                    restoredEl = el;
                    break;
                }
            }
        }

        if (!restoredEl) {
            restoredEl = document.getElementById(`elodea_plant_source_${tubeNum}`) || document.getElementById('elodea_plant_source_1');
        }

        if (restoredEl) {
            const pIdx = parseInt(restoredEl.getAttribute('data-index')) || 1;
            restoredEl.setAttribute('transform', `translate(${16 + (pIdx - 1) * 28}, 15)`);
            restoredEl.style.display = 'block';
            restoredEl.classList.remove('shelf-item-returned');
            void restoredEl.offsetWidth;
            restoredEl.classList.add('shelf-item-returned');
            setTimeout(() => {
                restoredEl.classList.remove('shelf-item-returned');
            }, 600);
        }

        if (this.engine.audioManager) this.engine.audioManager.playSplash();
        this.engine.uiOverlay.showToast(`تم إخراج نبات الإيلوديا من الأنبوب ${tubeNum} وإعادته لحوض الإيلوديا 🌿`);
        if (this.engine.currentPhase === 2) {
            this.engine.checkPhase2Progress();
        } else {
            this.engine.checkPhase1Progress();
        }
    }

    restoreSourceItem(type) {
        if (type === 'box') {
            for (let i = 1; i <= 2; i++) {
                const el = document.getElementById(`box_source_${i}`);
                if (el && el.style.display === 'none') {
                    const orig = el.getAttribute('data-orig-transform') || this.getInitialTransform('box', i);
                    el.setAttribute('transform', orig);
                    el.style.display = 'block';
                    break;
                }
            }
        } else if (type === 'stopper') {
            if (this.engine && this.engine.syncStoppersState) {
                this.engine.syncStoppersState();
            } else {
                for (let i = 0; i < 4; i++) {
                    const el = document.getElementById(`shelf_stopper_group_${i}`);
                    if (el && el.style.display === 'none') {
                        const orig = el.getAttribute('data-orig-transform') || this.getInitialTransform('stopper', i);
                        el.setAttribute('transform', orig);
                        el.style.display = 'block';
                        break;
                    }
                }
            }
        } else if (type === 'plant') {
            for (let i = 1; i <= 4; i++) {
                const el = document.getElementById(`elodea_plant_source_${i}`);
                if (el && el.style.display === 'none') {
                    const orig = el.getAttribute('data-orig-transform') || this.getInitialTransform('plant', i);
                    el.setAttribute('transform', orig);
                    el.style.display = 'block';
                    break;
                }
            }
        } else if (type === 'cap') {
            if (this.engine && this.engine.syncCuvetteCapsState) {
                this.engine.syncCuvetteCapsState();
            } else {
                for (let i = 0; i < 4; i++) {
                    const el = document.getElementById(`shelf_cuvette_cap_${i}`);
                    if (el && el.style.display === 'none') {
                        const orig = el.getAttribute('data-orig-transform') || this.getInitialTransform('cap', i);
                        el.setAttribute('transform', orig);
                        el.style.display = 'block';
                        break;
                    }
                }
            }
        }
    }

    getSvgCoordinates(e) {
        const pt = this.svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        return pt.matrixTransform(this.svg.getScreenCTM().inverse());
    }

    onPointerDown(e) {
        const target = e.target.closest('.svg-draggable');
        if (!target) return;

        e.preventDefault();
        this.draggedElement = target;
        this.dragType = target.getAttribute('data-type');
        this.dragIndex = target.getAttribute('data-index') || target.getAttribute('data-id') || target.getAttribute('data-tube');
        this.initialTransform = target.getAttribute('transform') || '';
        this.hasMovedDrag = false;
        this.dragDistance = 0;

        if (this.dragType === 'pipette' && this.engine) {
            this.engine.justDraggedPipette = false;
        }

        if (this.dragType === 'cuvette' && this.engine) {
            if (this.engine.currentStep === '3e') {
                this.engine.markStepCompleted('3e');
                this.engine.advanceStep('3f');
            }
        }

        // رفع محطة الكيوفيتات والعنصر المسحوب إلى قمة ترتيب الـ SVG ليظهر دائماً أمام جهاز المطياف
        const cuvStation = document.getElementById('cuvettes_station_group');
        if (cuvStation && cuvStation.parentElement) {
            cuvStation.parentElement.appendChild(cuvStation);
        }
        if (target.parentElement && target.parentElement !== cuvStation) {
            target.parentElement.appendChild(target);
        }

        const coords = this.getSvgCoordinates(e);
        this.startPointer = { x: coords.x, y: coords.y };
        this.currentPointer = { x: coords.x, y: coords.y };

        target.classList.add('dragging-active');
        this.highlightSnapTargets(true);
    }

    onPointerMove(e) {
        if (!this.draggedElement) return;
        e.preventDefault();

        const coords = this.getSvgCoordinates(e);
        const dx = coords.x - this.startPointer.x;
        const dy = coords.y - this.startPointer.y;
        this.dragDistance = Math.hypot(dx, dy);
        if (this.dragDistance > 4) {
            this.hasMovedDrag = true;
        }
        this.currentPointer = { x: coords.x, y: coords.y };

        // تحريك العنصر بنعومة عبر SVG transform
        this.draggedElement.setAttribute('transform', `${this.initialTransform} translate(${dx}, ${dy})`);

        if (this.dragType === 'pipette') {
            if (this.engine && this.engine.hidePlungerWidget) {
                this.engine.hidePlungerWidget();
            }
        }

        this.checkHoverSnap();
    }

    onPointerUp(e) {
        if (!this.draggedElement) return;

        const targetEl = this.draggedElement;
        const dragType = this.dragType;
        const dragIndex = this.dragIndex;
        targetEl.classList.remove('dragging-active');
        this.highlightSnapTargets(false);

        // إذا كان العنصر صندوقاً أو سدادة على الأنبوب:
        // سواء نقرة واحدة أو سحب وإفلات -> إرجاعه فوراً لمكانه في الرف
        if (dragType === 'placed_box') {
            const tubeNum = parseInt(targetEl.getAttribute('data-tube') || dragIndex);
            this.draggedElement = null;
            this.dragType = null;
            this.dragIndex = null;
            this.hasMovedDrag = false;
            this.lastActionTime = Date.now() + 400;
            this.removeTubeBox(tubeNum);
            return;
        }

        if (dragType === 'placed_stopper') {
            const tubeNum = parseInt(targetEl.getAttribute('data-tube') || dragIndex);
            this.draggedElement = null;
            this.dragType = null;
            this.dragIndex = null;
            this.hasMovedDrag = false;
            this.lastActionTime = Date.now() + 400;
            this.removeTubeStopper(tubeNum);
            return;
        }

        const isPipette = (dragType === 'pipette');
        const dropSuccess = this.handleDropResolution();

        if (dropSuccess) {
            // تم وضع العنصر بنجاح على الأنبوب -> إرجاع التحويل المكاني للأصل قبل الإخفاء حتى يعود لمكانه الصحيح بالرف عند كشفه
            if (dragType !== 'pipette') {
                const orig = targetEl.getAttribute('data-orig-transform') || 
                             this.getInitialTransform(dragType, dragIndex) || 
                             this.initialTransform;
                targetEl.setAttribute('transform', orig);
                // للصناديق والسدادات وأغطية الكيوفيتات: دوال المزامنة syncBoxesState و syncStoppersState و syncCuvetteCapsState هي المسؤولة الحصرية عن إظهار وإخفاء عناصر الرف
                if (dragType !== 'box' && dragType !== 'stopper' && dragType !== 'cap') {
                    targetEl.style.display = 'none';
                }
            }
        } else {
            // إعادة التحويل المكاني للأصل إذا فشل الإفلات
            targetEl.setAttribute('transform', this.initialTransform);
            if (isPipette && this.engine) {
                this.engine.currentHoveredTube = null;
                this.engine.currentHoveredCuvette = null;
                if (this.engine.hidePlungerWidget) {
                    this.engine.hidePlungerWidget();
                }
            }
        }

        if (isPipette) {
            if (this.hasMovedDrag) {
                if (this.engine) this.engine.justDraggedPipette = true;
                setTimeout(() => {
                    if (this.engine) this.engine.justDraggedPipette = false;
                }, 250);
            }
            if (this.engine.syncPlungerWidgetPosition) {
                this.engine.syncPlungerWidgetPosition();
            }
        }

        this.draggedElement = null;
        this.dragType = null;
        this.dragIndex = null;
        setTimeout(() => {
            this.hasMovedDrag = false;
        }, 60);
    }

    getClosestTube(x, y) {
        let bestTube = null;
        let minDistance = Infinity;

        // مراكز محطات الأنابيب الأربعة بدقة:
        // الأنبوب 1: 70 + 0*60 + 14 = 84
        // الأنبوب 2: 70 + 1*60 + 14 = 144
        // الأنبوب 3: 70 + 2*60 + 14 = 204
        // الأنبوب 4: 70 + 3*60 + 14 = 264
        for (let num = 1; num <= 4; num++) {
            const tubeCenterX = 70 + (num - 1) * 60 + 14;
            const dx = Math.abs(x - tubeCenterX);

            // نطاق الالتقاط: المسافة الأفقية dx <= 35 (نصف عرض الخانة 30px) والعمق الرأسي y بين 200 و 560
            if (dx <= 35 && y >= 200 && y <= 560) {
                const dist = Math.hypot(dx, Math.abs(y - 410));
                if (dist < minDistance) {
                    minDistance = dist;
                    bestTube = num;
                }
            }
        }
        return bestTube;
    }

    getClosestCuvette(x, y) {
        let bestCuv = null;
        let minDistance = Infinity;

        // مراكز الكيوفيتات 1 إلى 4 بدقة على الحامل (X=685, Y=380):
        // كيوفيت 1: 685 + 10 + 1*31 + 11 = 737
        // كيوفيت 2: 685 + 10 + 2*31 + 11 = 768
        // كيوفيت 3: 685 + 10 + 3*31 + 11 = 799
        // كيوفيت 4: 685 + 10 + 4*31 + 11 = 830
        const cuvettes = ['1', '2', '3', '4'];
        for (let i = 0; i < cuvettes.length; i++) {
            const id = cuvettes[i];
            const idx = i + 1;
            const cuvCenterX = 685 + 10 + idx * 31 + 11;
            const dx = Math.abs(x - cuvCenterX);

            // نطاق الفتحة الخاص بكل كيوفيت بدقة لمنع أي تداخل بين الخانات المجاورة
            if (dx <= 20 && y >= 160 && y <= 580) {
                const dist = Math.hypot(dx, Math.abs(y - 410));
                if (dist < minDistance) {
                    minDistance = dist;
                    bestCuv = id;
                }
            }
        }
        return bestCuv;
    }

    highlightSnapTargets(enable) {
        if (this.dragType === 'plant' || this.dragType === 'stopper' || this.dragType === 'cap' || this.dragType === 'box') {
            for (let i = 1; i <= 4; i++) {
                const target = document.getElementById(`tube_snap_target_${i}`);
                if (target) target.setAttribute('opacity', enable ? '0.85' : '0');
            }
        }
        if (this.dragType === 'cap') {
            ['1', '2', '3', '4'].forEach(id => {
                const cuvSlot = document.getElementById(`cuvette_slot_${id}`);
                if (cuvSlot) cuvSlot.classList.toggle('snap-highlight-active', enable);
            });
        } else if (this.dragType === 'cuvette') {
            const chamber = document.getElementById('spec_cuvette_slot') || document.getElementById('spec_chamber_well_group');
            if (chamber) chamber.setAttribute('stroke', enable ? '#22c55e' : '#3f3f46');
        }
    }

    checkHoverSnap() {
        // فحص الاقتراب من محطات الأنابيب وإبراز الأنبوب المستهدف بدقة
        if (this.dragType === 'plant' || this.dragType === 'stopper' || this.dragType === 'cap' || this.dragType === 'box') {
            const targetTube = this.getClosestTube(this.currentPointer.x, this.currentPointer.y);
            for (let num = 1; num <= 4; num++) {
                const target = document.getElementById(`tube_snap_target_${num}`);
                if (target) {
                    target.setAttribute('stroke', num === targetTube ? '#22c55e' : '#38bdf8');
                    target.setAttribute('stroke-width', num === targetTube ? '3.5' : '2.5');
                }
            }
        }
    }

    handleDropResolution() {
        const { x, y } = this.currentPointer;

        // 1. إسقاط نبات الإيلوديا على أي أنبوب من الأنابيب الأربعة (1، 2، 3، 4)
        if (this.dragType === 'plant') {
            const targetTube = this.getClosestTube(x, y);
            if (targetTube) {
                const tubeData = this.engine.tubesState[targetTube - 1];
                if (tubeData.placedPlantElement && tubeData.placedPlantElement !== this.draggedElement) {
                    const prevPlant = tubeData.placedPlantElement;
                    const prevIdx = prevPlant.getAttribute('data-index') || 1;
                    prevPlant.setAttribute('transform', this.getInitialTransform('plant', prevIdx));
                    prevPlant.style.display = 'block';
                }
                tubeData.hasPlant = true;
                tubeData.placedPlantElement = this.draggedElement;
                this.svgScene.setTubePlantVisible(targetTube, true);
                if (this.engine.audioManager) this.engine.audioManager.playSplash();
                this.engine.uiOverlay.showToast(`تم وضع نبات الإيلوديا في الأنبوب ${targetTube} 🌿`);
                this.engine.checkPhase1Progress();
                return true;
            }
        }

        // 2. إسقاط السدادات المطاطية على أي أنبوب من الأنابيب الأربعة (1، 2، 3، 4)
        if (this.dragType === 'stopper') {
            const targetTube = this.getClosestTube(x, y);
            if (targetTube) {
                const tubeIdx = targetTube - 1;
                if (this.engine.tubesState[tubeIdx].hasStopper) {
                    this.engine.uiOverlay.showToast(`الأنبوب ${targetTube} مغلق بالسدادة بالفعل!`);
                    return false;
                }
                const stopperSlot = parseInt(this.dragIndex, 10);
                let chosenSlot = (!isNaN(stopperSlot) && stopperSlot >= 0 && stopperSlot < 4) ? stopperSlot : -1;
                if (this.engine.shelfStoppersState) {
                    if (chosenSlot === -1 || !this.engine.shelfStoppersState[chosenSlot]) {
                        chosenSlot = this.engine.shelfStoppersState.findIndex(s => s === true);
                    }
                    if (chosenSlot !== -1) {
                        this.engine.shelfStoppersState[chosenSlot] = false;
                    }
                }
                this.engine.tubesState[tubeIdx].hasStopper = true;
                this.engine.tubesState[tubeIdx].shelfStopperIndex = chosenSlot !== -1 ? chosenSlot : null;
                if (this.engine.syncStoppersState) {
                    this.engine.syncStoppersState();
                } else {
                    this.svgScene.setTubeStopperVisible(targetTube, true);
                }
                if (this.engine.audioManager) this.engine.audioManager.playPop();
                this.engine.uiOverlay.showToast(`تم سد وتغطية الأنبوب ${targetTube} بالسدادة المطاطية ✓`);
                if (this.engine.currentPhase === 1) {
                    this.engine.checkPhase1Progress();
                } else {
                    this.engine.checkPhase2Progress();
                }
                return true;
            }
        }

        // إذا كان غطاءً وسُحب فوق حامل الكيوفيتات
        if (this.dragType === 'cap') {
            const targetCuv = this.getClosestCuvette(x, y);
            if (targetCuv) {
                if (this.engine.cuvettesState[targetCuv] && this.engine.cuvettesState[targetCuv].isCapped) {
                    this.engine.uiOverlay.showToast(`الكيوفيت ${targetCuv} مغطاة بالفعل!`);
                    return false;
                }
                const capSlot = parseInt(this.dragIndex, 10);
                this.engine.capCuvette(targetCuv, isNaN(capSlot) ? null : capSlot);
                return true;
            }
        }

        // 3. إسقاط صناديق حجب الضوء على أي أنبوب من الأنابيب الأربعة (1، 2، 3، 4) بحرية تفاعلية
        if (this.dragType === 'box') {
            const targetTube = this.getClosestTube(x, y);
            if (targetTube) {
                const tubeIdx = targetTube - 1;
                this.engine.tubesState[tubeIdx].hasBox = true;
                if (this.engine.syncBoxesState) {
                    this.engine.syncBoxesState();
                } else {
                    this.svgScene.setTubeBoxVisible(targetTube, true);
                }
                if (this.engine.audioManager) this.engine.audioManager.playThud();
                this.engine.uiOverlay.showToast(`تم تغطية الأنبوب ${targetTube} بصندوق عزل الضوء 📦`);
                if (this.engine.currentPhase === 1) {
                    this.engine.checkPhase1Progress();
                } else {
                    this.engine.checkPhase2Progress();
                }
                return true;
            }
        }

        // 4. إزالة صناديق الحجب أو السدادات بالسحب أو النقر تفاعلياً عن الأنابيب
        if (this.dragType === 'placed_box') {
            const tubeNum = parseInt(this.draggedElement.getAttribute('data-tube') || this.dragIndex);
            if (tubeNum) {
                this.removeTubeBox(tubeNum);
                return true;
            }
        }

        if (this.dragType === 'placed_stopper') {
            const tubeNum = parseInt(this.draggedElement.getAttribute('data-tube') || this.dragIndex);
            if (tubeNum) {
                this.removeTubeStopper(tubeNum);
                return true;
            }
        }

        // 5. سحب الماصة P1000 لتركيب رأس أو أخذ عينات أو تفريغها بالحركة
        if (this.dragType === 'pipette') {
            // تركيب رأس ماصة جديد بالسحب فوق علبة الرؤوس المفتوحة (Tips Box)
            const tipsBoxDist = Math.hypot(x - 460, y - 440);
            if (tipsBoxDist < 85 || (x >= 390 && x <= 530 && y >= 340 && y <= 550)) {
                if (!this.engine.pipetteState.hasTip) {
                    if (!this.engine.tipsBoxLidOpen) {
                        this.engine.uiOverlay.showToast("انقر على علبة الرؤوس لفتح الغطاء أولاً ⚠️");
                        return false;
                    }
                    this.engine.attachPipetteTip();
                    this.draggedElement.setAttribute('transform', 'translate(337, 305)');
                    return true;
                }
            }

            // توجيه الماصة فوق أي أنبوب من الأنابيب الأربعة للسحب (وضع الراحة -> الوقفة الأولى)
            const closestTube = this.getClosestTube(x, y);
            if (closestTube) {
                const num = closestTube;
                const tubeX = 70 + (num - 1) * 60;
                const tubeCenterX = tubeX + 14;
                const isNearTube = (Math.abs(x - tubeCenterX) < 55 && y >= 140 && y <= 600) || (Math.hypot(x - tubeCenterX, y - 410) < 110);
                if (isNearTube) {
                    if (!this.engine.pipetteState.hasTip) {
                        this.engine.uiOverlay.showToast("يجب تركيب رأس الماصة (Tip) من علبة الرؤوس أولاً ⚠️");
                        if (this.engine.hidePlungerWidget) this.engine.hidePlungerWidget();
                        return false;
                    }
                    if (this.engine.pipetteState.hasFluid) {
                        this.engine.uiOverlay.showToast("الماصة ممتلئة بالفعل - فرّغها في الكيوفيت أولاً ⚠️");
                        if (this.engine.hidePlungerWidget) this.engine.hidePlungerWidget();
                        return false;
                    }
                    // إزالة السدادة أو الصندوق تلقائياً إن وجدا بالأنبوب لتسهيل أخذ العينة بدون تعليق
                    if (this.engine.tubesState && this.engine.tubesState[num - 1]) {
                        if (this.engine.tubesState[num - 1].hasStopper) {
                            this.removeTubeStopper(num);
                        }
                        if (this.engine.tubesState[num - 1].hasBox) {
                            this.removeTubeBox(num);
                        }
                    }
                    // وضع الماصة بدقة فوق فوهة الأنبوب وإظهار عدسة المكبس في وضع الراحة
                    const targetX = tubeX + 14 - 12;
                    this.draggedElement.setAttribute('transform', `translate(${targetX}, 285)`);
                    this.engine.currentHoveredTube = num;
                    this.engine.currentHoveredCuvette = null;
                    this.engine.updatePlungerWidget('at_rest', `اضغط المكبس (الوقفة الأولى) ثم أفلته لسحب المحلول`);
                    this.engine.uiOverlay.showToast(`الماصة فوق الأنبوب ${num} - اضغط المكبس (الوقفة الأولى) ثم أفلته لسحب العينة 👆`);
                    if (this.engine.currentStep === '2h') this.engine.advanceStep('2i');
                    return true;
                }
            }

            // توجيه الماصة فوق أي كيوفيت من الكيوفيتات للتفريغ (وضع الراحة -> الوقفة الأولى -> الوقفة الثانية)
            const targetCuv = this.getClosestCuvette(x, y);
            if (targetCuv) {
                const id = targetCuv;
                const idx = parseInt(id, 10);
                const cuvX = 685 + 10 + idx * 31;
                if (!this.engine.pipetteState.hasFluid) {
                    this.engine.uiOverlay.showToast("يجب سحب محلول من الأنبوب أولاً قبل الصب ⚠️");
                    if (this.engine.hidePlungerWidget) this.engine.hidePlungerWidget();
                    return false;
                }
                const cuvData = this.engine.cuvettesState[id];
                if (cuvData && cuvData.isFilled) {
                    this.engine.uiOverlay.showToast(`الكيوفيت ${id} ممتلئة بالفعل ⚠️`);
                    if (this.engine.hidePlungerWidget) this.engine.hidePlungerWidget();
                    return false;
                }
                if (cuvData && cuvData.isCapped) {
                    this.engine.uiOverlay.showToast(`الكيوفيت ${id} مغطاة - أزل الغطاء أولاً ⚠️`);
                    if (this.engine.hidePlungerWidget) this.engine.hidePlungerWidget();
                    return false;
                }
                // وضع الماصة بدقة فوق الكيوفيت المختارة وإظهار عدسة المكبس في وضع الراحة
                const targetX = cuvX + 11 - 12;
                this.draggedElement.setAttribute('transform', `translate(${targetX}, 275)`);
                this.engine.currentHoveredCuvette = id;
                this.engine.currentHoveredTube = null;
                this.engine.updatePlungerWidget('at_rest', `اضغط مطولاً على المكبس للوقفة الثانية لتفريغ المحلول`);
                this.engine.uiOverlay.showToast(`الماصة فوق الكيوفيت ${id} - اضغط مطولاً على المكبس للتفريغ الكامل (الوقفة الثانية) ⬇️`);
                return true;
            }

            // التخلص من الرأس في سلة المهملات
            const trashDist = Math.hypot(x - 570, y - 475);
            if (trashDist < 85 || (x >= 520 && x <= 630 && y >= 360 && y <= 560)) {
                if (this.engine.pipetteState.hasTip) {
                    this.engine.ejectPipetteTip();
                    this.draggedElement.setAttribute('transform', 'translate(337, 305)');
                    if (this.engine.hidePlungerWidget) this.engine.hidePlungerWidget();
                    return true;
                }
            }
            
            // إذا أفلتت الماصة في أي مكان آخر يخفى الويجت
            if (this.engine.hidePlungerWidget) this.engine.hidePlungerWidget();
        }

        // 6. سحب الكيوفيتات إلى جهاز مقياس الطيف الضوئي
        if (this.dragType === 'cuvette') {
            const chamberDist = Math.hypot(x - 1040, y - 420);
            if (chamberDist < 95 || (x >= 960 && x <= 1130 && y >= 310 && y <= 490)) {
                const specData = this.engine.specState;
                if (!specData.isLidOpen) {
                    this.engine.uiOverlay.showToast("⚠️ افتح غطاء حجرة العينات أولاً قبل وضع الكيوفيت!");
                    return false;
                }
                if (specData.cuvetteInChamber) {
                    this.engine.uiOverlay.showToast("⚠️ توجد كيوفيت بالفعل داخل فتحة الجهاز! أخرجها أولاً.");
                    return false;
                }
                
                const cuvId = this.dragIndex || this.draggedElement.getAttribute('data-id') || 'Blank';
                this.engine.insertCuvetteIntoChamber(cuvId, this.draggedElement);
                return true;
            }
        }

        return false;
    }
}

if (typeof window !== 'undefined') {
    window.SvgDragDrop = SvgDragDrop;
}
