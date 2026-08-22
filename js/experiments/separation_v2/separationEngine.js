import * as THREE from 'three';
import { soundManager } from './soundManager.js';

export class SeparationEngine {
    constructor(sceneManager, beaker3D, uiOverlay) {
        this.sceneManager = sceneManager;
        this.beaker3D = beaker3D;
        this.uiOverlay = uiOverlay;
        this.scene = sceneManager.scene;

        this.burnerActive = false;
        this.funnelDraining = false;
        this.magnetFilingsMesh = null;

        this.initLoop();
    }

    initLoop() {
        this.sceneManager.addUpdatable((delta, elapsedTime) => {
            this.updateManualPhysics(delta, elapsedTime);
        });
    }

    checkMagnetProximity(magnetGroup) {
        if (!magnetGroup || this.isMagnetAttracting) return;

        const magnetPos = magnetGroup.position;
        const b1Group = this.beaker3D.beaker1.group;
        const b2Group = this.beaker3D.beaker2.group;

        const d1 = Math.hypot(magnetPos.x - b1Group.position.x, magnetPos.z - b1Group.position.z);
        const d2 = Math.hypot(magnetPos.x - b2Group.position.x, magnetPos.z - b2Group.position.z);

        const targetBeaker = d1 <= d2 ? this.beaker3D.beaker1 : this.beaker3D.beaker2;
        const minDist = Math.min(d1, d2);

        if (minDist < 0.70) {
            const hasIron = targetBeaker.ingredients.some(i => i.id === 'iron' || i.type === 'solid_magnetic' || (i.name && i.name.includes('حديد')));
            const hasWater = targetBeaker.ingredients.some(i => i.id === 'water');

            if (hasIron && !magnetGroup.userData.hasAttractedIron) {
                this.isMagnetAttracting = true;
                targetBeaker.removeIngredient('iron');

                this.animateFlyingIronFilings(targetBeaker, magnetGroup, () => {
                    this.attachFilingsToMagnet(magnetGroup);
                    soundManager.playMagnetClack();

                    magnetGroup.userData.hasAttractedIron = true;
                    this.isMagnetAttracting = false;

                    const msg = hasWater
                        ? 'نجحت عملية الجذب المغناطيسي من تحت سطح الماء! طارت برادة الحديد وانجذبت بقوة لقطبي المغناطيس 🧲✨'
                        : 'نجحت عملية الجذب المغناطيسي! طارت برادة الحديد وانجذبت برابطة مغناطيسية قوية لقطبي المغناطيس 🧲✨';

                    this.uiOverlay.showToast(msg, 'success');
                    this.uiOverlay.updateStepper('تم الجذب المغناطيسي ✓', 'طارت برادة الحديد وانجذبت للمغناطيس! تظل البرادة عالقة حتى تضغط زر التنظيف أو إعادة التهيئة');

                    this.uiOverlay.showCleanMagnetButton(() => {
                        this.cleanMagnet(magnetGroup);
                    });
                });
            }
        }
    }

    animateFlyingIronFilings(targetBeaker, magnetGroup, onComplete) {
        const flyingGroup = new THREE.Group();
        flyingGroup.name = 'flyingFilingsGroup';

        const particleCount = 60;
        const geo = new THREE.BoxGeometry(0.012, 0.012, 0.025);
        const mat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, metalness: 0.8 });

        const particles = [];
        const startPos = targetBeaker.group.position.clone();
        startPos.y += 0.15;
        const endPos = magnetGroup.position.clone();
        endPos.y -= 0.04;

        for (let i = 0; i < particleCount; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            const initOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.3
            );
            const pStart = startPos.clone().add(initOffset);

            const sideOffset = (i % 2 === 0 ? -0.165 : 0.165);
            const pEnd = new THREE.Vector3(endPos.x + sideOffset, endPos.y, endPos.z + (Math.random() - 0.5) * 0.1);

            const ctrlPoint = new THREE.Vector3(
                (pStart.x + pEnd.x) / 2 + (Math.random() - 0.5) * 0.2,
                Math.max(pStart.y, pEnd.y) + 0.2 + Math.random() * 0.15,
                (pStart.z + pEnd.z) / 2 + (Math.random() - 0.5) * 0.2
            );

            mesh.position.copy(pStart);
            flyingGroup.add(mesh);

            particles.push({
                mesh,
                pStart,
                ctrlPoint,
                pEnd,
                speedOffset: Math.random() * 0.15
            });
        }

        this.scene.add(flyingGroup);
        soundManager.playSolidPourDry(0.6);

        const startTime = performance.now();
        const duration = 550;

        const animateFlying = (now) => {
            const rawProgress = Math.min((now - startTime) / duration, 1);

            particles.forEach(p => {
                const prog = Math.min(1, Math.max(0, (rawProgress - p.speedOffset) / (1 - p.speedOffset)));
                const easeP = prog * prog * (3 - 2 * prog);

                const oneMinusT = 1 - easeP;
                const x = oneMinusT * oneMinusT * p.pStart.x + 2 * oneMinusT * easeP * p.ctrlPoint.x + easeP * easeP * p.pEnd.x;
                const y = oneMinusT * oneMinusT * p.pStart.y + 2 * oneMinusT * easeP * p.ctrlPoint.y + easeP * easeP * p.pEnd.y;
                const z = oneMinusT * oneMinusT * p.pStart.z + 2 * oneMinusT * easeP * p.ctrlPoint.z + easeP * easeP * p.pEnd.z;

                p.mesh.position.set(x, y, z);
                p.mesh.rotation.x += 0.2;
                p.mesh.rotation.y += 0.2;
            });

            if (rawProgress < 1) {
                requestAnimationFrame(animateFlying);
            } else {
                this.scene.remove(flyingGroup);
                if (onComplete) onComplete();
            }
        };
        requestAnimationFrame(animateFlying);
    }

    attachFilingsToMagnet(magnetGroup) {
        if (this.magnetFilingsMesh) return;

        const count = 350;
        const geo = new THREE.BoxGeometry(0.015, 0.015, 0.04);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.9,
            metalness: 0.8
        });

        const instanced = new THREE.InstancedMesh(geo, mat, count);
        const dummy = new THREE.Object3D();

        const clusterGroup = new THREE.Group();
        clusterGroup.name = 'magnetFilingsCluster';

        for (let side of [-0.165, 0.165]) {
            for (let i = 0; i < count / 2; i++) {
                const spreadX = (Math.random() - 0.5) * 0.14;
                const spreadZ = (Math.random() - 0.5) * 0.12;
                const spreadY = -0.04 - Math.random() * 0.06;

                dummy.position.set(side + spreadX, spreadY, spreadZ);
                const angleX = (Math.random() - 0.5) * 0.6;
                const angleZ = (side < 0 ? -1 : 1) * (0.3 + Math.random() * 0.5);
                dummy.rotation.set(Math.PI + angleX, 0, angleZ);
                dummy.scale.set(0.8 + Math.random() * 0.6, 0.8 + Math.random() * 0.6, 0.8 + Math.random() * 0.6);
                dummy.updateMatrix();
                instanced.setMatrixAt(i, dummy.matrix);
            }
            instanced.instanceMatrix.needsUpdate = true;
            clusterGroup.add(instanced);
        }

        magnetGroup.add(clusterGroup);
        this.magnetFilingsMesh = clusterGroup;
    }

    cleanMagnet(magnetGroup) {
        if (!magnetGroup || !magnetGroup.userData.hasAttractedIron) return;

        const magPos = magnetGroup.position;
        const b1Pos = this.beaker3D.beaker1.group.position;
        const b2Pos = this.beaker3D.beaker2.group.position;
        const d1 = Math.hypot(magPos.x - b1Pos.x, magPos.z - b1Pos.z);
        const d2 = Math.hypot(magPos.x - b2Pos.x, magPos.z - b2Pos.z);

        const targetBeaker = d1 <= d2 ? this.beaker3D.beaker1 : this.beaker3D.beaker2;

        const RAW_MATERIALS = {
            iron: { id: 'iron', name: 'برادة حديد', color: 0x1e293b, particleColor: 0x1e293b, type: 'solid_magnetic' }
        };

        this.detachFilingsFromMagnet(magnetGroup);
        magnetGroup.userData.hasAttractedIron = false;
        magnetGroup.userData.isAttracting = false;

        soundManager.playSolidPour(0.8);
        targetBeaker.addIngredient(RAW_MATERIALS.iron);
        this.uiOverlay.hideCleanMagnetButton();

        this.uiOverlay.showToast('تم تنظيف المغناطيس وتفريغ برادة الحديد داخل الكأس بنجاح! 🧹✨', 'success');
        this.uiOverlay.updateStepper('تم التنظيف والتفريغ ✓', 'تم تنظيف المغناطيس واستقرار برادة الحديد النظيفة داخل الكأس');
    }

    detachFilingsFromMagnet(magnetGroup) {
        if (this.magnetFilingsMesh) {
            magnetGroup.remove(this.magnetFilingsMesh);
            this.magnetFilingsMesh = null;
        }
    }

    operateTool(toolGroup) {
        const toolData = toolGroup.userData.toolData;
        if (!toolData) return;

        if (toolData.id === 'evaporation') {
            this.toggleBurnerFlame(toolGroup);
        } else if (toolData.id === 'funnel') {
            this.toggleSeparatoryValve(toolGroup);
        } else if (toolData.id === 'magnet') {
            this.checkMagnetProximity(toolGroup);
        } else {
            this.uiOverlay.showToast(`أداة ${toolData.name} جاهزة للاستخدام اليدوي الحر.`, 'info');
        }
    }

    toggleBurnerFlame(burnerGroup) {
        const flame = burnerGroup.getObjectByName('burnerFlame');
        if (!flame) return;

        flame.visible = !flame.visible;
        this.burnerActive = flame.visible;

        soundManager.playBurnerFlame(this.burnerActive);

        if (this.burnerActive) {
            this.uiOverlay.showToast('تم إشعال شعلة الموقد بنجاح! ضع الكأس فوق الموقد لتبخير السائل.', 'success');
        } else {
            this.uiOverlay.showToast('تم إطفاء شعلة الموقد.', 'info');
            this.beaker3D.setBoilingAnimation(false);
        }
    }

    toggleSeparatoryValve(funnelGroup) {
        const valveKey = funnelGroup.getObjectByName('funnelValveKey');
        if (!valveKey) return;

        const funnelWater = funnelGroup.getObjectByName('funnelWater');
        const funnelOilSettled = funnelGroup.getObjectByName('funnelOilSettled');

        this.funnelDraining = !this.funnelDraining;
        valveKey.rotation.y = this.funnelDraining ? Math.PI / 2 : 0;

        const waterStreamMesh = funnelGroup.getObjectByName('drainingStream');
        const oilStreamMesh = funnelGroup.getObjectByName('drainingOilStream');

        if (this.funnelDraining) {
            soundManager.playLiquidPour(2.0);

            if (funnelWater && funnelWater.visible) {
                if (waterStreamMesh) waterStreamMesh.visible = true;
                this.uiOverlay.showToast('تم فتح الصمام! جارٍ تصريف السائل المائي...', 'info');
            } else if (funnelOilSettled && funnelOilSettled.visible) {
                if (oilStreamMesh) oilStreamMesh.visible = true;
                this.uiOverlay.showToast('تم فتح الصمام! جارٍ تصريف الزيت النقي المتبقي بالقمع...', 'info');
            }
        } else {
            if (waterStreamMesh) waterStreamMesh.visible = false;
            if (oilStreamMesh) oilStreamMesh.visible = false;
            this.uiOverlay.showToast('تم إغلاق صمام قمع الفصل.', 'info');
        }
    }

    setPouringEngine(pouringEngine) {
        this.pouringEngine = pouringEngine;
    }

    filterMixture(filterTool, beakerObj, onComplete) {
        // Step 1: Switch camera to high top-down view looking into the paper cone
        this.sceneManager.focusCameraOnFunnelTopView(filterTool.position);
        this.uiOverlay.showResetCameraBtn();

        const filterStream = filterTool.getObjectByName('filterStream');
        const sandResidue = filterTool.getObjectByName('sandResidue');

        const hasFilterPaper = filterTool.userData.hasFilterPaper === true;
        const pouredIngredients = [...beakerObj.ingredients];
        const hasWater = pouredIngredients.some(i => i.id === 'water');
        const hasSand = pouredIngredients.some(i => i.id === 'sand');
        const hasPebbles = pouredIngredients.some(i => i.id === 'pebbles');
        const hasIron = pouredIngredients.some(i => i.id === 'iron');
        const hasSalt = pouredIngredients.some(i => i.id === 'salt');

        const hasInsolubleSolid = hasSand || hasPebbles || hasIron;
        const hasAnySolid = hasInsolubleSolid || hasSalt;

        const filterPos = filterTool.position;
        const receivingBeaker = this.findReceivingBeakerUnder(filterTool, beakerObj);
        const hasBeakerUnderneath = receivingBeaker !== null;

        let solidName = 'الرمل';
        let solidColor = 0xc28e5c;
        let solidType = 'sand';

        if (hasPebbles) {
            solidName = 'الحصى';
            solidColor = 0x64748b;
            solidType = 'pebbles';
        } else if (hasIron) {
            solidName = 'برادة الحديد';
            solidColor = 0x1e293b;
            solidType = 'iron';
        } else if (hasSalt && !hasWater) {
            solidName = 'الملح الجاف';
            solidColor = 0xf8fafc;
            solidType = 'salt';
        }

        filterTool.userData.trappedSolidType = solidType;
        filterTool.userData.trappedSolidName = solidName;
        filterTool.userData.trappedSolidColor = solidColor;

        if (sandResidue && hasInsolubleSolid && hasFilterPaper) {
            sandResidue.material.color.setHex(solidColor);
            sandResidue.visible = true;
            sandResidue.scale.set(0.01, 0.01, 0.01);
        }

        if (filterStream && hasWater && hasFilterPaper) {
            filterStream.visible = true;
        }

        // Initialize receiving beaker liquid for real-time smooth level rise
        if (receivingBeaker && hasWater && hasFilterPaper) {
            const RAW_MATERIALS = {
                water: { id: 'water', name: 'ماء', color: 0x0284c7, particleColor: 0x38bdf8, type: 'liquid_water' }
            };
            receivingBeaker.addIngredient(RAW_MATERIALS.water);
            if (hasSalt) {
                const SALT_MAT = { id: 'salt', name: 'ملح', color: 0xf8fafc, particleColor: 0xe2e8f0, type: 'solid_soluble' };
                receivingBeaker.addIngredient(SALT_MAT);
            }
            if (receivingBeaker.waterMesh) {
                receivingBeaker.waterMesh.visible = true;
                receivingBeaker.waterMesh.scale.y = 0.01;
            }
        }

        soundManager.playLiquidPour(2.5);

        const beakerGroup = beakerObj.group ? beakerObj.group : beakerObj;
        const fPos = filterTool.position.clone();
        const targetPos = new THREE.Vector3(fPos.x + 0.32, fPos.y + 1.25, fPos.z);
        const origPos = beakerObj.homePosition ? beakerObj.homePosition.clone() : beakerGroup.position.clone();

        const moveStart = performance.now();
        const moveDuration = 450;
        const tiltPourDuration = 2200;

        const animateMove = (now) => {
            const moveProg = Math.min((now - moveStart) / moveDuration, 1);
            const moveEase = 0.5 - Math.cos(moveProg * Math.PI) / 2;

            beakerGroup.position.lerpVectors(beakerGroup.position, targetPos, moveEase);

            if (moveProg < 1) {
                requestAnimationFrame(animateMove);
            } else {
                const tiltStart = performance.now();

                const streamX = fPos.x + 0.08;
                const streamY = fPos.y + 0.95;

                if (this.pouringEngine) {
                    if (hasWater) {
                        this.pouringEngine.streamMesh.material.color.setHex(0x0284c7);
                        this.pouringEngine.streamMesh.position.set(streamX, streamY, fPos.z);
                        this.pouringEngine.streamMesh.visible = true;
                    }
                    if (hasInsolubleSolid) {
                        this.pouringEngine.grainStream.material.color.setHex(solidColor);
                        this.pouringEngine.grainStream.position.set(streamX, streamY + 0.08, fPos.z);
                        this.pouringEngine.grainStream.visible = true;
                    }
                }

                const animateSimultaneousFiltration = (t) => {
                    const p = Math.min((t - tiltStart) / tiltPourDuration, 1);
                    const easeP = 0.5 - Math.cos(p * Math.PI) / 2;

                    // 1. Tilt beaker over funnel mouth
                    beakerGroup.rotation.z = -easeP * (Math.PI / 2.4);

                    // 2. Deplete fluid & particles inside pouring beaker
                    if (beakerObj.waterMesh && beakerObj.waterMesh.visible) {
                        beakerObj.waterMesh.scale.y = Math.max(0.01, (1 - easeP) * 1.0);
                    }
                    beakerGroup.children.forEach(c => {
                        if (c.name && c.name.startsWith('particles_')) {
                            c.scale.set(1 - easeP, 1 - easeP, 1 - easeP);
                        }
                    });

                    // 3. Accumulate trapped solid residue inside filter paper cone in real-time
                    if (sandResidue && sandResidue.visible && hasFilterPaper) {
                        sandResidue.scale.set(easeP, easeP, easeP);
                    }

                    // 4. Smoothly rise water level in receiving beaker below in real-time!
                    if (receivingBeaker && receivingBeaker.waterMesh && hasWater && hasFilterPaper) {
                        receivingBeaker.waterMesh.scale.y = Math.max(0.01, easeP * 1.0);
                    }

                    if (p < 1) {
                        requestAnimationFrame(animateSimultaneousFiltration);
                    } else {
                        // Turn off streams & return pouring beaker to table
                        if (this.pouringEngine) {
                            this.pouringEngine.streamMesh.visible = false;
                            this.pouringEngine.grainStream.visible = false;
                        }
                        if (filterStream) filterStream.visible = false;

                        beakerGroup.rotation.z = 0;
                        beakerGroup.position.copy(origPos);
                        beakerObj.resetBeaker();

                        beakerGroup.children.forEach(c => {
                            if (c.name && c.name.startsWith('particles_')) {
                                c.scale.set(1, 1, 1);
                            }
                        });

                        if (!hasFilterPaper) {
                            if (receivingBeaker) pouredIngredients.forEach(ing => receivingBeaker.addIngredient(ing));
                            this.uiOverlay.showToast('تنبيه كيميائي: نزل المخلوط بالكامل دون ترشيح! يجب تركيب ورقة الترشيح المطوية داخل القمع أولاً لاحتجاز الحبيبات الصلبة.', 'warning');
                        } else if (!hasWater && hasAnySolid) {
                            this.uiOverlay.showToast(`تنبيه كيميائي: ورقة الترشيح احتجزت (${solidName}) الجافة ولا تفصل بين المواد الصلبة الجافة!`, 'warning');
                        } else {
                            if (!hasBeakerUnderneath && hasWater) {
                                this.createLiquidSpillPuddle(filterPos.x, filterPos.z, 0x0284c7);
                            }
                            this.uiOverlay.showToast('تمت عملية الترشيح بنجاح! تم احتجاز المحتوى الصلب في القمع ونزل الماء النقي الرائق إلى الكأس.', 'success');
                            this.uiOverlay.updateStepper('المرحلة 2 تمت ✓', 'اكتمل الترشيح! استقر الراسب الصلب بالقمع ونزل الماء الرائق في الكأس السفلي');
                        }

                        // Step 3: Return camera to normal laboratory perspective after 1.2s!
                        setTimeout(() => {
                            this.sceneManager.resetCameraView();
                            this.uiOverlay.hideResetCameraBtn();
                        }, 1200);

                        if (onComplete) onComplete();
                    }
                };
                requestAnimationFrame(animateSimultaneousFiltration);
            }
        };
        requestAnimationFrame(animateMove);
    }

    pourMixtureIntoSeparatoryFunnel(funnelTool, beakerObj) {
        const pouredList = [...beakerObj.ingredients];
        funnelTool.userData.ingredients = funnelTool.userData.ingredients || [];
        pouredList.forEach(ing => {
            if (!funnelTool.userData.ingredients.some(i => i.id === ing.id)) {
                funnelTool.userData.ingredients.push(ing);
            }
        });

        const currentIngredients = funnelTool.userData.ingredients;
        const hasWater = currentIngredients.some(i => i.id === 'water');
        const hasOil = currentIngredients.some(i => i.id === 'oil');

        soundManager.playLiquidPour(2.0);

        const funnelWater = funnelTool.getObjectByName('funnelWater');
        const funnelOilLower = funnelTool.getObjectByName('funnelOilLower');
        const funnelOilUpper = funnelTool.getObjectByName('funnelOilUpper');
        const funnelOilSettled = funnelTool.getObjectByName('funnelOilSettled');

        beakerObj.resetBeaker();

        this.sceneManager.focusCameraOn(funnelTool.position);
        this.uiOverlay.showResetCameraBtn();

        if (hasWater && hasOil) {
            if (funnelWater) { funnelWater.visible = true; funnelWater.scale.set(1, 1, 1); }
            if (funnelOilUpper) { funnelOilUpper.visible = true; funnelOilUpper.scale.set(1, 1, 1); }
            if (funnelOilSettled) { funnelOilSettled.visible = true; funnelOilSettled.scale.set(1, 1, 1); }
            if (funnelOilLower) funnelOilLower.visible = false;
            this.uiOverlay.showToast('انفصل السائلان بنجاح حسب الكثافة! هبط الماء الأكبر كثافة للأسفل وطفا الزيت الأقل كثافة بالأعلى ✨. افتح الصمام الآن.', 'success');
            this.uiOverlay.updateStepper('انفصال الكثافة ✓', 'انفصل الزيت عن الماء! افتح الصمام لتصريف الماء أولاً في الكأس السفلي');
        } else if (hasOil) {
            if (funnelOilLower) { funnelOilLower.visible = true; funnelOilLower.scale.set(1, 1, 1); }
            if (funnelWater) funnelWater.visible = false;
            if (funnelOilUpper) funnelOilUpper.visible = false;
            this.uiOverlay.showToast('تم سكب الزيت في قمع الفصل. عند إضافة الماء، سيهبط الماء للأسفل ويرتفع الزيت للأعلى بسبب الكثافة!', 'info');
        } else if (hasWater) {
            if (funnelWater) { funnelWater.visible = true; funnelWater.scale.set(1, 1, 1); }
            if (funnelOilLower) funnelOilLower.visible = false;
            if (funnelOilUpper) funnelOilUpper.visible = false;
            this.uiOverlay.showToast('تم سكب الماء في قمع الفصل. يمكنك إضافة الزيت لملاحظة ظاهرة الكثافة!', 'info');
        }

        setTimeout(() => {
            this.sceneManager.resetCameraView();
            this.uiOverlay.hideResetCameraBtn();
        }, 1200);
    }

    sieveMixture(sieveTool, beakerObj) {
        const ingredients = [...beakerObj.ingredients];
        if (ingredients.length === 0) return;

        const receivingBeaker = this.findReceivingBeakerUnder(sieveTool, beakerObj);
        const sievePebbles = sieveTool.getObjectByName('sievePebbles');

        const hasPebbles = ingredients.some(i => i.id === 'pebbles');
        const hasSand = ingredients.some(i => i.id === 'sand');
        const hasWater = ingredients.some(i => i.id === 'water');
        const fineIngredients = ingredients.filter(i => i.id !== 'pebbles');

        const beakerGroup = beakerObj.group ? beakerObj.group : beakerObj;
        const sPos = sieveTool.position.clone();
        const dumpPos = new THREE.Vector3(sPos.x + 0.35, sPos.y + 0.95, sPos.z);
        const homePos = beakerObj.homePosition ? beakerObj.homePosition.clone() : beakerGroup.position.clone();

        soundManager.playSolidPourDry(2.2);

        this.sceneManager.focusCameraOn(sieveTool.position);
        this.uiOverlay.showResetCameraBtn();

        // Configure Sand / Solid Pour Stream
        const streamX = sPos.x + 0.08;
        const streamY = sPos.y + 0.65;
        
        const pouringEngine = this.pouringEngine;
        if (pouringEngine) {
            if (hasSand) {
                pouringEngine.grainStream.material.color.setHex(0xc28e5c);
                pouringEngine.grainStream.position.set(streamX, streamY, sPos.z);
                pouringEngine.grainStream.visible = true;
            }
            if (hasWater) {
                pouringEngine.streamMesh.material.color.setHex(0x0284c7);
                pouringEngine.streamMesh.position.set(streamX, streamY, sPos.z);
                pouringEngine.streamMesh.visible = true;
            }
        }

        const startTime = performance.now();
        const duration = 500;

        const animateMove = (now) => {
            const p = Math.min((now - startTime) / duration, 1);
            beakerGroup.position.lerpVectors(beakerGroup.position, dumpPos, p);

            if (p < 1) {
                requestAnimationFrame(animateMove);
            } else {
                const tiltStart = performance.now();
                const tiltDuration = 1800;

                const animateSieveTilt = (t) => {
                    const prog = Math.min((t - tiltStart) / tiltDuration, 1);
                    beakerGroup.rotation.z = -prog * (Math.PI / 2.3);

                    // Deplete pouring beaker content
                    if (beakerObj.waterMesh && beakerObj.waterMesh.visible) {
                        beakerObj.waterMesh.scale.y = Math.max(0.01, 1 - prog);
                    }
                    if (beakerObj.sandMesh && beakerObj.sandMesh.visible) {
                        beakerObj.sandMesh.scale.y = Math.max(0.01, 1 - prog);
                    }

                    // Fill receiving beaker with fine ingredients in real time
                    if (receivingBeaker && fineIngredients.length > 0) {
                        if (receivingBeaker.waterMesh && hasWater) {
                            receivingBeaker.waterMesh.visible = true;
                            receivingBeaker.waterMesh.scale.y = Math.max(0.01, prog);
                        }
                        if (receivingBeaker.sandMesh && hasSand) {
                            receivingBeaker.sandMesh.visible = true;
                            receivingBeaker.sandMesh.scale.y = Math.max(0.01, prog);
                        }
                    }

                    // Accumulate pebbles on top of sieve grid ONE BY ONE!
                    if (hasPebbles && sievePebbles) {
                        sievePebbles.visible = true;
                        const pebblesChildren = sievePebbles.children;
                        const total = pebblesChildren.length;
                        const activeCount = Math.floor(prog * total);

                        pebblesChildren.forEach((peb, i) => {
                            if (i <= activeCount) {
                                peb.visible = true;
                                const pebProg = Math.min(1, (prog * total - i));
                                peb.scale.setScalar(pebProg * (0.8 + (i % 3) * 0.2));
                            } else {
                                peb.visible = false;
                            }
                        });
                    }

                    if (prog < 1) {
                        requestAnimationFrame(animateSieveTilt);
                    } else {
                        if (pouringEngine) {
                            pouringEngine.grainStream.visible = false;
                            pouringEngine.streamMesh.visible = false;
                        }
                        beakerObj.resetBeaker();
                        if (receivingBeaker && fineIngredients.length > 0) {
                            fineIngredients.forEach(ing => receivingBeaker.addIngredient(ing));
                        }

                        // Return beaker to table
                        const returnStart = performance.now();
                        const returnDur = 400;

                        const animateReturn = (rT) => {
                            const rP = Math.min((rT - returnStart) / returnDur, 1);
                            beakerGroup.rotation.z = -(1 - rP) * (Math.PI / 2.3);
                            beakerGroup.position.lerpVectors(dumpPos, homePos, rP);

                            if (rP < 1) {
                                requestAnimationFrame(animateReturn);
                            } else {
                                beakerGroup.position.copy(homePos);
                                beakerGroup.rotation.set(0, 0, 0);

                                if (hasPebbles) {
                                    this.uiOverlay.showToast('تمت عملية الغربلة بنجاح! 🪵✨ مرت حبيبات الرمل والمكونات الناعمة عبر شبكة الغربال للكأس السفلي، واحتُجِزت الحصى الكبيرة فوق الغربال.', 'success');
                                    this.uiOverlay.updateStepper('تمت الغربلة ✓', 'انفصلت الحصى الكبيرة وتراكمت فوق الغربال، بينما مرت حبيبات الرمل للكأس السفلي');
                                } else {
                                    this.uiOverlay.showToast('تم إمرار حبيبات الرمل والمكونات الناعمة بالكامل عبر شبكة الغربال إلى الكأس السفلي.', 'info');
                                }

                                setTimeout(() => {
                                    this.sceneManager.resetCameraView();
                                    this.uiOverlay.hideResetCameraBtn();
                                }, 1200);
                            }
                        };
                        requestAnimationFrame(animateReturn);
                    }
                };
                requestAnimationFrame(animateSieveTilt);
            }
        };
        requestAnimationFrame(animateMove);
    }

    createLiquidSpillPuddle(x, z, hexColor) {
        const puddleGeo = new THREE.CircleGeometry(0.48, 32);
        const puddleMat = new THREE.MeshPhysicalMaterial({
            color: hexColor,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            transmission: 0.8
        });
        const puddle = new THREE.Mesh(puddleGeo, puddleMat);
        puddle.rotation.x = -Math.PI / 2;
        puddle.position.set(x, 0.005, z);
        puddle.name = `liquidPuddle_${Date.now()}`;
        this.scene.add(puddle);

        this.uiOverlay.showToast('تنبيه: انسكب السائل على طاولة المعمل لعدم وجود كأس استقبال بالأسفل! اضغط إعادة تهيئة للتنظيف 🧹', 'warning');
    }

    findReceivingBeakerUnder(toolGroup, pouringBeakerObj = null) {
        const tPos = toolGroup.position;
        const b1 = this.beaker3D.beaker1;
        const b2 = this.beaker3D.beaker2;

        const d1 = Math.hypot(b1.group.position.x - tPos.x, b1.group.position.z - tPos.z);
        const d2 = Math.hypot(b2.group.position.x - tPos.x, b2.group.position.z - tPos.z);

        const threshold = 0.65;

        if (d1 < threshold && b1 !== pouringBeakerObj) return b1;
        if (d2 < threshold && b2 !== pouringBeakerObj) return b2;
        return null;
    }

    updateManualPhysics(delta, time) {
        const burnerTool = this.scene.getObjectByName('tool_evaporation');
        if (burnerTool && this.burnerActive) {
            const b1Pos = this.beaker3D.beaker1.group.position;
            const b2Pos = this.beaker3D.beaker2.group.position;
            const burnerPos = burnerTool.position;
            const d1 = Math.hypot(b1Pos.x - burnerPos.x, b1Pos.z - burnerPos.z);
            const d2 = Math.hypot(b2Pos.x - burnerPos.x, b2Pos.z - burnerPos.z);

            const activeBeaker = d1 <= d2 ? this.beaker3D.beaker1 : this.beaker3D.beaker2;
            const minDist = Math.min(d1, d2);
            const hasWater = activeBeaker.ingredients.some(i => i.id === 'water');

            if (minDist < 0.65 && hasWater) {
                activeBeaker.setBoilingAnimation(true);

                if (activeBeaker.waterMesh) {
                    activeBeaker.waterMesh.scale.y -= delta * 0.35;
                    if (activeBeaker.waterMesh.scale.y <= 0.05) {
                        activeBeaker.removeIngredient('water');
                        activeBeaker.setBoilingAnimation(false);

                        const remaining = activeBeaker.ingredients.map(i => i.name).join(' و ');
                        const resultText = remaining ? `استقرت بلورات (${remaining}) الصلبة في قاع الكأس` : 'تبخر الماء بالكامل';

                        this.uiOverlay.showToast(`اكتملت عملية التبخير والتسخين بنجاح! 💨 ${resultText}.`, 'success');
                        this.uiOverlay.updateStepper('المرحلة 2 تمت ✓', `نجح التبخير! تبخر الماء بالكامل و${resultText}`);
                    }
                }
            } else {
                activeBeaker.setBoilingAnimation(false);
            }
        }

        const funnelTool = this.scene.getObjectByName('tool_funnel');
        if (funnelTool && this.funnelDraining) {
            const funnelWater = funnelTool.getObjectByName('funnelWater');
            const funnelOilLower = funnelTool.getObjectByName('funnelOilLower');
            const funnelOilUpper = funnelTool.getObjectByName('funnelOilUpper');
            const waterStreamMesh = funnelTool.getObjectByName('drainingStream');
            const oilStreamMesh = funnelTool.getObjectByName('drainingOilStream');

            const fPos = funnelTool.position;
            const receivingBeaker = this.findReceivingBeakerUnder(funnelTool);
            const hasBeakerUnderneath = receivingBeaker !== null;

            if (funnelWater && funnelWater.visible) {
                funnelWater.scale.y -= delta * 0.35;
                if (funnelWater.scale.y < 0) funnelWater.scale.y = 0;

                const waterScale = funnelWater.scale.y;
                funnelWater.scale.set(waterScale, waterScale, waterScale);
                const drainProgress = Math.min(1.0, 1.0 - waterScale);

                if (waterStreamMesh) {
                    waterStreamMesh.visible = true;
                    waterStreamMesh.scale.x = 0.85 + Math.sin(time * 30) * 0.15;
                    waterStreamMesh.scale.z = 0.85 + Math.cos(time * 30) * 0.15;
                }

                // Seamless transition: As water drains out, oil in upper bulb shrinks and oil in lower cone fills up!
                if (funnelOilUpper && funnelOilUpper.visible) {
                    funnelOilUpper.scale.set(waterScale, waterScale, waterScale);
                    if (funnelOilLower) {
                        funnelOilLower.visible = true;
                        funnelOilLower.scale.set(1.0 - waterScale, 1.0 - waterScale, 1.0 - waterScale);
                    }
                }

                if (hasBeakerUnderneath && receivingBeaker.waterMesh) {
                    receivingBeaker.waterMesh.visible = true;
                    receivingBeaker.waterMesh.scale.y = Math.max(0.01, drainProgress * 1.0);
                }

                if (funnelWater.scale.y <= 0.05) {
                    funnelWater.visible = false;
                    if (funnelOilUpper) funnelOilUpper.visible = false;
                    if (waterStreamMesh) waterStreamMesh.visible = false;

                    // Oil has cleanly taken over the lower cone at scale 1.0!
                    if (funnelOilLower) {
                        funnelOilLower.visible = true;
                        funnelOilLower.scale.set(1, 1, 1);
                    }

                    this.funnelDraining = false;
                    const valveKey = funnelTool.getObjectByName('funnelValveKey');
                    if (valveKey) valveKey.rotation.y = 0;

                    if (!hasBeakerUnderneath) {
                        this.createLiquidSpillPuddle(fPos.x, fPos.z, 0x0284c7);
                    } else {
                        const RAW_MATERIALS = {
                            water: { id: 'water', name: 'ماء', color: 0x0284c7, particleColor: 0x38bdf8, type: 'liquid_water' }
                        };
                        receivingBeaker.addIngredient(RAW_MATERIALS.water);
                        this.uiOverlay.showToast('تم تصريف السائل المائي بالكامل بنجاح في الكأس السفلي! استقرت طبقة الزيت في قاع القمع جاهزة للتصريف، أغلق الصمام واجلب كأساً ثانياً لتجميع الزيت.', 'success');
                        this.uiOverlay.updateStepper('تصريف الماء ✓', 'تم تجميع الماء بالكامل! استقرت طبقة الزيت في قاع القمع. اجلب كأساً ثانياً لتصريف الزيت النقي');
                    }
                }
            } else if (funnelOilLower && funnelOilLower.visible) {
                funnelOilLower.scale.y -= delta * 0.35;
                if (funnelOilLower.scale.y < 0) funnelOilLower.scale.y = 0;

                const oilScale = funnelOilLower.scale.y;
                funnelOilLower.scale.set(oilScale, oilScale, oilScale);
                const drainProgress = Math.min(1.0, 1.0 - oilScale);

                if (oilStreamMesh) {
                    oilStreamMesh.visible = true;
                    oilStreamMesh.scale.x = 0.85 + Math.sin(time * 30) * 0.15;
                    oilStreamMesh.scale.z = 0.85 + Math.cos(time * 30) * 0.15;
                }

                if (hasBeakerUnderneath && receivingBeaker.oilMesh) {
                    receivingBeaker.oilMesh.visible = true;
                    receivingBeaker.oilMesh.scale.y = Math.max(0.01, drainProgress * 1.0);
                }

                if (funnelOilLower.scale.y <= 0.05) {
                    funnelOilLower.visible = false;
                    if (oilStreamMesh) oilStreamMesh.visible = false;

                    this.funnelDraining = false;
                    const valveKey = funnelTool.getObjectByName('funnelValveKey');
                    if (valveKey) valveKey.rotation.y = 0;

                    if (!hasBeakerUnderneath) {
                        this.createLiquidSpillPuddle(fPos.x, fPos.z, 0xfacc15);
                    } else {
                        const RAW_MATERIALS = {
                            oil: { id: 'oil', name: 'زيت', color: 0xfacc15, particleColor: 0xfde047, type: 'liquid_immiscible' }
                        };
                        receivingBeaker.addIngredient(RAW_MATERIALS.oil);
                        this.uiOverlay.showToast('تم تصريف الزيت النقي بالكامل في الكأس الجديد! اكتملت تجربة فصل السوائل بنجاح 100%.', 'success');
                        this.uiOverlay.updateStepper('المرحلة 2 تمت ✓', 'نجح التجميع المفصل! الكأس الأول يحتوي على الماء والكأس الثاني يحتوي على الزيت النقي');
                    }

                    setTimeout(() => {
                        this.sceneManager.resetCameraView();
                        this.uiOverlay.hideResetCameraBtn();
                    }, 1000);
                }
            }
        }
    }
}
