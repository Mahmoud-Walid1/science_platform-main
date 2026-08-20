import * as THREE from 'three';
import { soundManager } from './soundManager.js';

export class DragControls3D {
    constructor(sceneManager, materialsShelf, tools3D, beaker3D, pouringEngine, separationEngine, uiOverlay) {
        this.sceneManager = sceneManager;
        this.materialsShelf = materialsShelf;
        this.tools3D = tools3D;
        this.beaker3D = beaker3D;
        this.pouringEngine = pouringEngine;
        this.separationEngine = separationEngine;
        this.uiOverlay = uiOverlay;

        this.scene = sceneManager.scene;
        this.camera = sceneManager.camera;
        this.renderer = sceneManager.renderer;
        this.canvas = sceneManager.canvas;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.selectedObject = null;
        this.hoveredObject = null;
        this.isDragging = false;
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.dragOffset = new THREE.Vector3();
        this.lastDragPos = new THREE.Vector3();
        this.pointerDownPos = { x: 0, y: 0 };
        this.extractedPaperCount = 0;

        this.initEvents();
    }

    initEvents() {
        this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    }

    updateMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    getInteractables() {
        const list = [];
        this.scene.traverse((child) => {
            if (child.userData && child.userData.type) {
                list.push(child);
            }
        });
        return list;
    }

    findTargetHit(intersects) {
        for (const hit of intersects) {
            let curr = hit.object;
            while (curr && curr !== this.scene) {
                if (curr.userData && curr.userData.type) {
                    return curr;
                }
                curr = curr.parent;
            }
        }
        return null;
    }

    getObjectName(obj) {
        if (!obj || !obj.userData) return '';
        if (obj.userData.type === 'beaker_object') {
            return `كأس معملي زجاجي #${obj.userData.id}`;
        }
        if (obj.userData.type === 'material_bottle' && obj.userData.materialData) {
            return `زجاجة مادة (${obj.userData.materialData.name})`;
        }
        if (obj.userData.type === 'tool_object' && obj.userData.toolData) {
            return obj.userData.toolData.name;
        }
        if (obj.userData.type === 'extracted_paper') {
            return 'ورقة ترشيح مستخرجة تحمل راسباً صلبًا';
        }
        return '';
    }

    applyHoverHighlight(obj) {
        if (this.hoveredObject === obj) return;
        this.clearHoverHighlight();

        this.hoveredObject = obj;
        if (!obj) return;

        this.sceneManager.showTargetGlowAt(obj.position.x, Math.max(0.0, obj.position.y - 0.05), obj.position.z);
    }

    clearHoverHighlight() {
        this.hoveredObject = null;
        if (!this.isDragging) {
            this.sceneManager.hideTargetGlow();
        }
    }

    onPointerDown(e) {
        if (e.button === 2 || e.button === 1) {
            this.sceneManager.startPanning(e.clientX, e.clientY);
            return;
        }

        this.updateMouse(e);
        this.pointerDownPos = { x: e.clientX, y: e.clientY };
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const interactables = this.getInteractables();
        const intersects = this.raycaster.intersectObjects(interactables, true);

        const targetHit = this.findTargetHit(intersects);

        if (targetHit) {
            this.selectedObject = targetHit;
            this.isDragging = true;
            this.canvas.style.cursor = 'grabbing';

            soundManager.playGlassTouch();

            const normal = this.camera.getWorldDirection(new THREE.Vector3()).negate();
            this.dragPlane.setFromNormalAndCoplanarPoint(normal, targetHit.position);

            const planeIntersect = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.dragPlane, planeIntersect);
            if (planeIntersect) {
                this.dragOffset.subVectors(targetHit.position, planeIntersect);
            }
            this.lastDragPos.copy(targetHit.position);

            if (this.uiOverlay) this.uiOverlay.hideHoverTooltip();
        } else {
            this.sceneManager.startPanning(e.clientX, e.clientY);
        }
    }

    onPointerMove(e) {
        this.updateMouse(e);

        if (this.isDragging && this.selectedObject) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const planeIntersect = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.dragPlane, planeIntersect);

            if (planeIntersect) {
                const targetPos = planeIntersect.add(this.dragOffset);
                targetPos.y = Math.max(0.0, targetPos.y);

                this.lastDragPos.copy(targetPos);
                this.selectedObject.position.copy(targetPos);

                const trashTool = this.scene.getObjectByName('tool_trash');
                const magnetTool = this.scene.getObjectByName('tool_magnet');

                if (this.selectedObject.userData.type === 'extracted_paper') {
                    if (trashTool && Math.hypot(targetPos.x - trashTool.position.x, targetPos.z - trashTool.position.z) < 0.7) {
                        this.sceneManager.showTargetGlowAt(trashTool.position.x, trashTool.position.y + 0.52, trashTool.position.z);
                    } else if (this.selectedObject.userData.hasContents) {
                        const b1Pos = this.beaker3D.beaker1.group.position;
                        const b2Pos = this.beaker3D.beaker2.group.position;
                        const d1 = Math.hypot(targetPos.x - b1Pos.x, targetPos.z - b1Pos.z);
                        const d2 = Math.hypot(targetPos.x - b2Pos.x, targetPos.z - b2Pos.z);
                        const closestBeaker = d1 <= d2 ? b1Pos : b2Pos;
                        this.sceneManager.showTargetGlowAt(closestBeaker.x, 0, closestBeaker.z);
                    }
                } else if (this.selectedObject.userData.type === 'material_bottle') {
                    const matData = this.selectedObject.userData.materialData;
                    if (matData.id === 'filter_paper') {
                        const filterTool = this.scene.getObjectByName('tool_filter');
                        if (filterTool) {
                            this.sceneManager.showTargetGlowAt(
                                filterTool.position.x,
                                filterTool.position.y + 0.96,
                                filterTool.position.z
                            );
                        }
                    } else {
                        const b1Pos = this.beaker3D.beaker1.group.position;
                        const b2Pos = this.beaker3D.beaker2.group.position;
                        const d1 = Math.hypot(targetPos.x - b1Pos.x, targetPos.z - b1Pos.z);
                        const d2 = Math.hypot(targetPos.x - b2Pos.x, targetPos.z - b2Pos.z);
                        const closestBeaker = d1 <= d2 ? b1Pos : b2Pos;
                        this.sceneManager.showTargetGlowAt(closestBeaker.x, 0, closestBeaker.z);
                    }
                } else if (this.selectedObject.userData.type === 'beaker_object') {
                    const beakerObj = (this.selectedObject.userData.id === '1') ? this.beaker3D.beaker1 : this.beaker3D.beaker2;
                    const funnelTool = this.scene.getObjectByName('tool_funnel');
                    const filterTool = this.scene.getObjectByName('tool_filter');
                    const burnerTool = this.scene.getObjectByName('tool_evaporation');

                    if (magnetTool) {
                        this.separationEngine.checkMagnetProximity(magnetTool);
                    }

                    if (trashTool && Math.hypot(targetPos.x - trashTool.position.x, targetPos.z - trashTool.position.z) < 0.7) {
                        this.sceneManager.showTargetGlowAt(trashTool.position.x, trashTool.position.y + 0.52, trashTool.position.z);
                    } else if (burnerTool && Math.hypot(targetPos.x - burnerTool.position.x, targetPos.z - burnerTool.position.z) < 0.7) {
                        this.sceneManager.showTargetGlowAt(burnerTool.position.x, burnerTool.position.y + 0.58, burnerTool.position.z);
                    } else if (funnelTool && Math.hypot(targetPos.x - funnelTool.position.x, targetPos.z - funnelTool.position.z) < 0.7) {
                        this.sceneManager.showTargetGlowAt(funnelTool.position.x, funnelTool.position.y + 1.25, funnelTool.position.z);
                    } else if (filterTool && Math.hypot(targetPos.x - filterTool.position.x, targetPos.z - filterTool.position.z) < 0.7) {
                        const receivingBeaker = this.separationEngine.findReceivingBeakerUnder(filterTool, beakerObj);
                        this.sceneManager.showTargetGlowAt(filterTool.position.x, filterTool.position.y + 0.96, filterTool.position.z);

                        if (!receivingBeaker) {
                            this.sceneManager.showSecondaryTargetGlowAt(filterTool.position.x, 0, filterTool.position.z);
                        }
                    } else {
                        if (this.sceneManager.secondaryTargetGlowMesh) this.sceneManager.secondaryTargetGlowMesh.visible = false;
                    }
                } else if (this.selectedObject.userData.type === 'tool_object' && this.selectedObject.userData.toolData.id === 'magnet') {
                    this.separationEngine.checkMagnetProximity(this.selectedObject);
                }
            }
        } else {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const interactables = this.getInteractables();
            const intersects = this.raycaster.intersectObjects(interactables, true);

            const targetHit = this.findTargetHit(intersects);

            if (targetHit) {
                this.applyHoverHighlight(targetHit);
                const name = this.getObjectName(targetHit);
                if (name && this.uiOverlay) {
                    this.uiOverlay.showHoverTooltip(e.clientX, e.clientY, name);
                }
                this.canvas.style.cursor = 'grab';
            } else {
                this.clearHoverHighlight();
                if (this.uiOverlay) this.uiOverlay.hideHoverTooltip();
                if (!this.sceneManager.isPanning) {
                    this.canvas.style.cursor = 'default';
                }
            }
        }
    }

    installFilterPaperIntoFunnel(filterTool, paperBottleObj = null) {
        if (!filterTool) return;

        soundManager.playPaperSound();
        filterTool.userData.hasFilterPaper = true;
        const paperCone = filterTool.getObjectByName('filterPaper');
        if (paperCone) paperCone.visible = true;

        if (paperBottleObj && paperBottleObj.userData && paperBottleObj.userData.homePosition) {
            paperBottleObj.position.copy(paperBottleObj.userData.homePosition);
        }

        this.uiOverlay.showToast('تم تركيب ورقة الترشيح المطوية داخل القمع بنجاح! اسحب الكأس الآن لسكب المخلوط بالداخل.', 'success');
        this.uiOverlay.updateStepper('المرحلة 2', 'اسحب الكأس لسكب المخلوط داخل ورقة الترشيح بالقمع');
    }

    extractFilterPaperWithSand(filterTool) {
        const paperCone = filterTool.getObjectByName('filterPaper');

        if (filterTool.userData.hasFilterPaper) {
            soundManager.playPaperSound();

            paperCone.visible = false;
            filterTool.userData.hasFilterPaper = false;

            const trappedList = filterTool.userData.trappedIngredients || [];
            const trappedNames = trappedList.map(i => i.name);
            const solidName = trappedNames.length > 0 ? (trappedNames.length > 1 ? `(${trappedNames.join(' + ')})` : trappedNames[0]) : 'المحتويات الصلبة';

            this.extractedPaperCount++;
            const usedPaperGroup = new THREE.Group();
            usedPaperGroup.name = `extracted_paper_${this.extractedPaperCount}`;
            const firstIng = trappedList[0] || { id: 'sand', name: 'الرمل', color: 0xc28e5c, particleColor: 0xc28e5c, type: 'solid_granular' };
            usedPaperGroup.userData = {
                type: 'extracted_paper',
                hasContents: true,
                trappedIngredients: [...trappedList],
                trappedSolidData: { id: firstIng.id || 'sand', name: solidName, color: firstIng.color || 0xc28e5c, particleColor: firstIng.color || 0xc28e5c, type: 'solid_granular' },
                isDragging: false
            };

            const paperMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9, side: THREE.DoubleSide });
            const coneMesh = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.28, 32, 1, true), paperMat);
            coneMesh.rotation.x = Math.PI;
            coneMesh.position.y = 0.16;
            usedPaperGroup.add(coneMesh);

            const hasSand = trappedList.some(i => i.id === 'sand');
            const hasIron = trappedList.some(i => i.id === 'iron');
            const hasPebbles = trappedList.some(i => i.id === 'pebbles');

            if (hasSand) {
                const sandMat = new THREE.MeshStandardMaterial({ color: 0xc28e5c, roughness: 0.95 });
                const sMesh = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.18, 32), sandMat);
                sMesh.name = 'trappedSolidMesh';
                sMesh.rotation.x = Math.PI;
                sMesh.position.y = 0.12;
                usedPaperGroup.add(sMesh);
            }

            if (hasIron) {
                const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, metalness: 0.8 });
                const speckGeo = new THREE.BoxGeometry(0.025, 0.025, 0.035);
                for (let i = 0; i < 24; i++) {
                    const speck = new THREE.Mesh(speckGeo, ironMat);
                    const r = Math.random() * 0.12;
                    const theta = Math.random() * Math.PI * 2;
                    speck.position.set(r * Math.cos(theta), 0.12 + Math.random() * 0.04, r * Math.sin(theta));
                    speck.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                    usedPaperGroup.add(speck);
                }
            }

            if (hasPebbles) {
                const pebMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
                const pebGeo = new THREE.DodecahedronGeometry(0.028, 1);
                for (let i = 0; i < 8; i++) {
                    const peb = new THREE.Mesh(pebGeo, pebMat);
                    const r = Math.random() * 0.10;
                    const theta = Math.random() * Math.PI * 2;
                    peb.position.set(r * Math.cos(theta), 0.13 + Math.random() * 0.03, r * Math.sin(theta));
                    peb.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                    usedPaperGroup.add(peb);
                }
            }

            const petriDishMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, transmission: 0.9 });
            const dishMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 32), petriDishMat);
            dishMesh.position.y = 0.015;
            usedPaperGroup.add(dishMesh);

            usedPaperGroup.position.set(-1.4 - (this.extractedPaperCount * 0.7), 0.0, 0.6);
            this.scene.add(usedPaperGroup);

            this.uiOverlay.showToast(`تم استخراج ورقة الترشيح بنجاح! تحتوي على ${solidName} المستخرجة 📜 (اسحبها للتفريغ للكأس أو لسلة المهملات 🗑️)`, 'success');
            this.uiOverlay.updateStepper('تم الاستخراج بنجاح ✓', `تم استخراج ورقة الترشيح! اسحب الورقة لسلة المهملات للتخلص منها وتنظيف المعمل`);
        }
    }

    onPointerUp(e) {
        this.clearHoverHighlight();
        this.sceneManager.hideTargetGlow();

        if (!this.isDragging || !this.selectedObject) return;

        this.isDragging = false;
        this.canvas.style.cursor = 'default';

        const obj = this.selectedObject;
        this.selectedObject = null;

        const moveDist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
        const isSingleClick = moveDist < 10;

        // Magnet drag release vs single-click handling
        if (obj.userData.type === 'tool_object' && obj.userData.toolData && obj.userData.toolData.id === 'magnet') {
            if (isSingleClick && obj.userData.hasAttractedIron) {
                // Only clean magnet on explicit single click!
                this.separationEngine.cleanMagnet(obj);
                return;
            } else if (!obj.userData.hasAttractedIron) {
                this.separationEngine.checkMagnetProximity(obj);
            }
            // On drag release: keep the filings firmly attached to the magnet!
            return;
        }

        const trashTool = this.scene.getObjectByName('tool_trash');
        const magnetTool = this.scene.getObjectByName('tool_magnet');

        if (magnetTool && obj.userData.type === 'beaker_object') {
            this.separationEngine.checkMagnetProximity(magnetTool);
        }

        // Trash Disposal (< 0.7m)
        if (trashTool && obj.userData.type === 'beaker_object') {
            const tPos = trashTool.position;
            const distToTrash = Math.hypot(obj.position.x - tPos.x, obj.position.z - tPos.z);

            if (distToTrash < 0.7) {
                const beakerObj = (obj.userData.id === '1') ? this.beaker3D.beaker1 : this.beaker3D.beaker2;
                const hasContents = beakerObj.ingredients.length > 0;

                if (hasContents) {
                    soundManager.playTrashDump();

                    const dumpTargetPos = new THREE.Vector3(tPos.x - 0.2, tPos.y + 0.7, tPos.z);
                    const homePos = obj.userData.homePosition.clone();

                    const startTime = performance.now();
                    const duration = 500;

                    const animateMoveToTrash = (now) => {
                        const prog = Math.min((now - startTime) / duration, 1);
                        obj.position.lerpVectors(obj.position, dumpTargetPos, prog);

                        if (prog < 1) {
                            requestAnimationFrame(animateMoveToTrash);
                        } else {
                            const tiltStart = performance.now();
                            const tiltDuration = 400;

                            const animateTiltDump = (t) => {
                                const p = Math.min((t - tiltStart) / tiltDuration, 1);
                                obj.rotation.z = p * (Math.PI / 2.4);

                                if (p < 1) {
                                    requestAnimationFrame(animateTiltDump);
                                } else {
                                    beakerObj.resetBeaker();
                                    setTimeout(() => {
                                        obj.rotation.z = 0;
                                        obj.position.copy(homePos);
                                        this.uiOverlay.showToast('تم تفريغ محتويات الكأس وإلقائها في سلة المهملات المعملية بنجاح! 🗑️🧹 الكأس نظيف الآن.', 'success');
                                        this.uiOverlay.updateStepper('تنظيف الكأس ✓', 'تم تفريغ محتويات الكأس في سلة المهملات وتنظيف المعمل');
                                    }, 500);
                                }
                            };
                            requestAnimationFrame(animateTiltDump);
                        }
                    };
                    requestAnimationFrame(animateMoveToTrash);
                    return;
                }
            }
        }

        if (obj.userData.type === 'extracted_paper') {
            if (trashTool && Math.hypot(obj.position.x - trashTool.position.x, obj.position.z - trashTool.position.z) < 0.7) {
                soundManager.playTrashDump();
                const trashPos = new THREE.Vector3(trashTool.position.x, trashTool.position.y + 0.6, trashTool.position.z);
                const origPaperPos = obj.position.clone();

                const startTime = performance.now();
                const duration = 400;

                const animateTrashDrop = (now) => {
                    const prog = Math.min((now - startTime) / duration, 1);
                    obj.position.lerpVectors(origPaperPos, trashPos, prog);
                    const scale = 1.0 - prog * 0.7;
                    obj.scale.set(scale, scale, scale);

                    if (prog < 1) {
                        requestAnimationFrame(animateTrashDrop);
                    } else {
                        this.scene.remove(obj);
                        this.uiOverlay.showToast('تم إلقاء ورقة الترشيح المستعملة في سلة المهملات المعملية بنجاح! 🗑️🧹', 'success');
                        this.uiOverlay.updateStepper('تنظيف المعمل ✓', 'تم التخلص من ورقة الترشيح المستعملة في سلة المهملات المعملية بنجاح');
                    }
                };
                requestAnimationFrame(animateTrashDrop);
                return;
            }

            if (obj.userData.hasContents && (obj.userData.trappedIngredients || obj.userData.trappedSolidData)) {
                const b1Pos = this.beaker3D.beaker1.group.position;
                const b2Pos = this.beaker3D.beaker2.group.position;
                const d1 = Math.hypot(obj.position.x - b1Pos.x, obj.position.z - b1Pos.z);
                const d2 = Math.hypot(obj.position.x - b2Pos.x, obj.position.z - b2Pos.z);

                const targetBeaker = d1 <= d2 ? this.beaker3D.beaker1 : this.beaker3D.beaker2;
                const minDist = Math.min(d1, d2);

                if (minDist < 2.2 || isSingleClick) {
                    const ingredientsToDump = (obj.userData.trappedIngredients && obj.userData.trappedIngredients.length > 0)
                        ? obj.userData.trappedIngredients
                        : [obj.userData.trappedSolidData];

                    const solidNames = ingredientsToDump.map(i => i.name).join(' + ') || 'المحوى الصلب';

                    const pourTargetPos = new THREE.Vector3(targetBeaker.group.position.x + 0.28, targetBeaker.group.position.y + 0.85, targetBeaker.group.position.z);
                    const origPaperPos = new THREE.Vector3(-1.4, 0.0, 0.6);

                    const hasTargetLiquid = targetBeaker.ingredients.some(i => i.type && i.type.startsWith('liquid'));
                    if (hasTargetLiquid) {
                        soundManager.playSolidPourIntoLiquid(1.4);
                    } else {
                        soundManager.playSolidPourDry(1.4);
                    }

                    const startTime = performance.now();
                    const duration = 450;

                    const animateMoveToBeaker = (now) => {
                        const prog = Math.min((now - startTime) / duration, 1);
                        obj.position.lerpVectors(obj.position, pourTargetPos, prog);

                        if (prog < 1) {
                            requestAnimationFrame(animateMoveToBeaker);
                        } else {
                            const tiltStart = performance.now();
                            const tiltDuration = 450;

                            const animatePaperTilt = (t) => {
                                const p = Math.min((t - tiltStart) / tiltDuration, 1);
                                obj.rotation.z = p * (Math.PI / 2.2);

                                if (p < 1) {
                                    requestAnimationFrame(animatePaperTilt);
                                } else {
                                    // Hide all residue meshes on the extracted paper
                                    obj.children.forEach(child => {
                                        if (child.name === 'trappedSolidMesh' || (child.geometry && !(child.geometry instanceof THREE.CylinderGeometry) && child !== obj.children[0])) {
                                            child.visible = false;
                                        }
                                    });

                                    ingredientsToDump.forEach(ing => {
                                        if (ing) targetBeaker.addIngredient(ing);
                                    });
                                    obj.userData.hasContents = false;

                                    setTimeout(() => {
                                        obj.rotation.z = 0;
                                        obj.position.copy(origPaperPos);
                                        this.uiOverlay.showToast(`تم تفريغ المحتوى الصلب (${solidNames}) من ورقة الترشيح إلى الكأس المعملي بنجاح 📜✨`, 'success');
                                        this.uiOverlay.updateStepper('تم التفريغ بنجاح ✓', `تم إفراغ راسب (${solidNames}) من ورقة الترشيح واستقراره داخل الكأس`);
                                    }, 600);
                                }
                            };
                            requestAnimationFrame(animatePaperTilt);
                        }
                    };
                    requestAnimationFrame(animateMoveToBeaker);
                    return;
                }
            }

            if (obj.position.y <= 0.8) {
                obj.position.y = 0.0;
            }
            return;
        }

        // Material Bottle Interaction (Single click or drag & drop)
        if (obj.userData.type === 'material_bottle') {
            if (obj.userData.materialData && obj.userData.materialData.id === 'filter_paper') {
                const filterTool = this.scene.getObjectByName('tool_filter');
                if (filterTool) {
                    this.installFilterPaperIntoFunnel(filterTool, obj);
                }
                return;
            }

            const b1Pos = this.beaker3D.beaker1.group.position;
            const b2Pos = this.beaker3D.beaker2.group.position;
            const d1 = Math.hypot(obj.position.x - b1Pos.x, obj.position.z - b1Pos.z);
            const d2 = Math.hypot(obj.position.x - b2Pos.x, obj.position.z - b2Pos.z);

            const targetBeakerObj = d1 <= d2 ? this.beaker3D.beaker1 : this.beaker3D.beaker2;
            const minDist = Math.min(d1, d2);

            // Easy Pouring: Trigger if dragged within 1.5m OR if single clicked!
            if (minDist < 1.8 || isSingleClick) {
                const matType = obj.userData.materialData ? obj.userData.materialData.type : '';
                const hasLiquidInBeaker = targetBeakerObj.ingredients.some(i => i.type && i.type.startsWith('liquid'));

                if (matType.startsWith('liquid')) {
                    soundManager.playLiquidPour(1.6);
                } else {
                    if (hasLiquidInBeaker) {
                        soundManager.playSolidPourIntoLiquid(1.4);
                    } else {
                        soundManager.playSolidPourDry(1.4);
                    }
                }

                this.pouringEngine.pourMaterialBottleToBeaker(obj, targetBeakerObj, () => {
                    this.uiOverlay.updateMixtureStatus();
                });
            } else {
                if (obj.userData.homePosition) {
                    obj.position.copy(obj.userData.homePosition);
                }
            }
            return;
        }

        // Single click handling on tools
        if (isSingleClick && obj.userData.type === 'tool_object') {
            if (obj.userData.toolData.id === 'trash') {
                this.uiOverlay.showToast('سلة المهملات المعملية 🗑️ (اسحب أي ورقة ترشيح أو كأس ممتلئ وافلته فوق السلة للتفريغ والتنظيف)', 'info');
                return;
            }
            if (obj.userData.toolData.id === 'filter') {
                const sandResidue = obj.getObjectByName('sandResidue');
                if (sandResidue && sandResidue.visible) {
                    this.extractFilterPaperWithSand(obj);
                    return;
                }
                if (!obj.userData.hasFilterPaper) {
                    const paperBottle = this.materialsShelf.materialBottles.find(b => b.userData.materialData && b.userData.materialData.id === 'filter_paper');
                    this.installFilterPaperIntoFunnel(obj, paperBottle);
                    return;
                }
            }
            this.separationEngine.operateTool(obj);
            return;
        }

        // Drag Beaker onto Burner, Separatory Funnel, or Filter Funnel
        if (obj.userData.type === 'beaker_object') {
            const beakerObj = (obj.userData.id === '1') ? this.beaker3D.beaker1 : this.beaker3D.beaker2;

            const burnerTool = this.scene.getObjectByName('tool_evaporation');
            if (burnerTool && Math.hypot(obj.position.x - burnerTool.position.x, obj.position.z - burnerTool.position.z) < 0.75) {
                obj.position.set(burnerTool.position.x, burnerTool.position.y + 0.58, burnerTool.position.z);
                this.uiOverlay.showToast('تم تركيب الكأس بدقة متناهية فوق شبكة موقد التبخير! 💥🔥 اضغط على الموقد لإشعال الشعلة.', 'success');
                this.uiOverlay.updateStepper('المرحلة 2', 'تم تركيب الكأس فوق الموقد! اضغط على الموقد لإشعال الشعلة وتبخير الماء');
                return;
            }

            const funnelTool = this.scene.getObjectByName('tool_funnel');
            if (funnelTool && Math.hypot(obj.position.x - funnelTool.position.x, obj.position.z - funnelTool.position.z) < 0.75) {
                if (beakerObj.ingredients.length > 0) {
                    this.pouringEngine.pourBeakerIntoFunnel(beakerObj, funnelTool, () => {
                        this.separationEngine.pourMixtureIntoSeparatoryFunnel(funnelTool, beakerObj);
                    });
                }
                return;
            }

            const filterTool = this.scene.getObjectByName('tool_filter');
            if (filterTool && Math.hypot(obj.position.x - filterTool.position.x, obj.position.z - filterTool.position.z) < 1.35) {
                if (beakerObj.ingredients.length > 0) {
                    this.separationEngine.filterMixture(filterTool, beakerObj);
                }
                return;
            }

            const sieveTool = this.scene.getObjectByName('tool_sieve');
            if (sieveTool && Math.hypot(obj.position.x - sieveTool.position.x, obj.position.z - sieveTool.position.z) < 1.05) {
                if (beakerObj.ingredients.length > 0) {
                    this.separationEngine.sieveMixture(sieveTool, beakerObj);
                }
                return;
            }
        }

        // Drag Sieve Tool onto a Beaker
        if (obj.userData.type === 'tool_object' && obj.userData.toolData && obj.userData.toolData.id === 'sieve') {
            const b1 = this.beaker3D.beaker1.group.position;
            const b2 = this.beaker3D.beaker2.group.position;
            const d1 = Math.hypot(obj.position.x - b1.x, obj.position.z - b1.z);
            const d2 = Math.hypot(obj.position.x - b2.x, obj.position.z - b2.z);
            const targetBeakerPos = d1 <= d2 ? b1 : b2;
            const minDist = Math.min(d1, d2);

            if (minDist < 0.8) {
                soundManager.playPaperSound();
                obj.position.set(targetBeakerPos.x, targetBeakerPos.y + 0.65, targetBeakerPos.z);
                this.uiOverlay.showToast('تم تركيب الغربال المعملي فوق الكأس بنجاح! 🪵✨ اصب الكأس المحتوي على حصى بالداخل لفصل الحصى الكبيرة فوق شبكة الغربال.', 'success');
                this.uiOverlay.updateStepper('تركيب الغربال ✓', 'تم تركيب الغربال المعملي! اصب مخلوط الماء والحصى فوق الغربال لفصل الحصى');
                return;
            }
        }
    }
}
