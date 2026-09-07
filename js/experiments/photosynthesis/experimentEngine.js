import * as THREE from 'three';

export class ExperimentEngine {
    constructor(sceneManager, labSetup, uiOverlay) {
        this.sceneManager = sceneManager;
        this.labSetup = labSetup;
        this.uiOverlay = uiOverlay;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Horizontal dragging plane at y=0
        this.planeIntersection = new THREE.Vector3();
        this.dragOffset = new THREE.Vector3();
        
        this.selectedObject = null;
        this.isDragging = false;
        
        // Active tool state
        this.activeTool = null; // 'pipette' or null
        
        // Experiment logic state
        this.currentStep = '1a'; // starts at 1a
        this.isIncubationComplete = false;
        this.spectrophotometerZeroed = false;

        this.initListeners();
    }

    initListeners() {
        const canvas = this.sceneManager.canvas;

        canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
        canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));

        // Connect reset button
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetExperiment());
        }
    }

    onPointerDown(event) {
        if (event.button !== 0) return; // Only left click

        const rect = this.sceneManager.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        
        // Let's check clickable objects first (e.g. switch, pipette, power button, open lid)
        const intersects = this.raycaster.intersectObjects(this.labSetup.interactiveObjects, true);

        if (intersects.length > 0) {
            let hitObj = intersects[0].object;
            // Traverse up to find group with userData if needed
            let parent = hitObj;
            while (parent && !parent.userData.type) {
                parent = parent.parent;
            }

            if (parent) {
                const type = parent.userData.type;

                // 1. Lamp Switch click
                if (type === 'lamp_switch') {
                    this.toggleLamps();
                    return;
                }

                // 2. Pipette click
                if (type === 'pipette_object') {
                    this.selectPipette();
                    return;
                }

                // 3. Tips Box click
                if (type === 'tips_box_object') {
                    this.attachPipetteTip();
                    return;
                }

                // 4. Spectrophotometer Power click
                if (hitObj.name === 'spec_power_btn') {
                    this.toggleSpectrophotometerPower();
                    return;
                }

                // 5. Spectrophotometer Lid click
                if (hitObj.parent && hitObj.parent.name === 'spec_lid') {
                    this.toggleSpectrophotometerLid();
                    return;
                }
            }
        }

        // Check if we can drag objects
        const draggableIntersects = this.raycaster.intersectObjects(
            this.labSetup.interactiveObjects.filter(obj => 
                obj.userData.type === 'plant_draggable' ||
                obj.userData.type === 'stopper_draggable' ||
                obj.userData.type === 'box_draggable' ||
                obj.userData.type === 'cap_draggable' ||
                obj.userData.type === 'cuvette_object'
            ), true
        );

        if (draggableIntersects.length > 0) {
            let obj = draggableIntersects[0].object;
            while (obj && !obj.userData.type) {
                obj = obj.parent;
            }

            if (obj && this.canDrag(obj)) {
                this.selectedObject = obj;
                this.isDragging = true;
                this.selectedObject.userData.isDragging = true;

                // Disable Orbit controls panning/zoom while dragging
                this.sceneManager.isPanning = false;

                // If dragging a box that covers a tube, reveal the tube immediately
                // so it doesn't appear to "jump" or "move" when the box lifts off
                if (obj.userData.type === 'box_draggable' && obj.userData.coveringTubeIndex !== null) {
                    const idx = obj.userData.coveringTubeIndex;
                    const tubeGroup = this.labSetup.tubes[idx - 1].group;
                    tubeGroup.userData.hasBox = false; // clear so re-snap logic works
                    this.setTubeVisibility(tubeGroup, true);
                    // Don't clear coveringTubeIndex yet - handleDrop will decide based on final position
                }

                // Intersection point with horizontal drag plane at the object's height
                this.dragPlane.normal.set(0, 1, 0);
                this.dragPlane.constant = -this.selectedObject.position.y;
                
                if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersection)) {
                    this.dragOffset.copy(this.selectedObject.position).sub(this.planeIntersection);
                }

                this.uiOverlay.showHoverTooltip(event.clientX, event.clientY - 30, this.selectedObject.name);
            }
        }
    }

    onPointerMove(event) {
        const rect = this.sceneManager.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

        // Update tooltip position if dragging
        if (this.isDragging && this.selectedObject) {
            this.dragPlane.constant = -this.selectedObject.position.y;
            if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersection)) {
                const newPos = this.planeIntersection.clone().add(this.dragOffset);
                
                // Boundaries
                newPos.x = Math.max(-4.0, Math.min(4.0, newPos.x));
                newPos.z = Math.max(-2.0, Math.min(2.0, newPos.z));

                this.selectedObject.position.copy(newPos);
            }

            this.uiOverlay.showHoverTooltip(event.clientX, event.clientY - 30, `سحب: ${this.getFriendlyName(this.selectedObject)}`);
            this.checkHoverTargets();
            return;
        }

        // Pipette hover / action handling
        if (this.activeTool === 'pipette') {
            // Project mouse to table height
            this.dragPlane.constant = -0.55; // hover height
            if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersection)) {
                // Move pipette to pointer position
                this.labSetup.pipetteGroup.position.set(
                    this.planeIntersection.x,
                    0.55,
                    this.planeIntersection.z
                );
            }
            this.uiOverlay.showHoverTooltip(event.clientX, event.clientY - 40, "انقر على الأنبوب لسحب العينة، أو الكيوفيت لصبها");
            return;
        }

        // Normal Hover Tooltip
        const intersects = this.raycaster.intersectObjects(this.labSetup.interactiveObjects, true);
        if (intersects.length > 0) {
            let hit = intersects[0].object;
            while (hit && !hit.userData.type) hit = hit.parent;
            if (hit) {
                this.uiOverlay.showHoverTooltip(event.clientX, event.clientY - 30, this.getFriendlyName(hit));
            }
        } else {
            this.uiOverlay.hideHoverTooltip();
        }
    }

    onPointerUp(event) {
        if (this.isDragging && this.selectedObject) {
            this.selectedObject.userData.isDragging = false;
            this.handleDrop(this.selectedObject);
            this.selectedObject = null;
            this.isDragging = false;
            this.uiOverlay.hideHoverTooltip();
            
            // Hide glow indicators
            this.sceneManager.targetGlowMesh.visible = false;
            this.sceneManager.secondaryTargetGlowMesh.visible = false;
        }

        // Click actions when pipette is active
        if (this.activeTool === 'pipette') {
            this.handlePipetteClick();
        }
    }

    canDrag(obj) {
        const type = obj.userData.type;
        // Phase-based restrictions
        if (this.currentStep === '1a') return false; // Must review poster first
        if (this.currentStep === '1b' && type === 'plant_draggable') return true;
        if (this.currentStep === '1c' && type === 'stopper_draggable') return true;
        if (this.currentStep === '1d' && type === 'box_draggable') return true;
        
        // Phase 2
        if (this.currentStep === '2b' && type === 'box_draggable') return true;
        if (this.currentStep === '2c' && type === 'stopper_draggable') return true;
        if (this.currentStep === '2k' && type === 'cap_draggable') return true;
        if (this.currentStep === '2l') {
            if (type === 'cap_draggable') return true;
        }

        // Phase 3
        if (this.currentStep === '3e' && obj.name === 'cuvette_Blank') return true;
        if (this.currentStep === '3h' && type === 'cuvette_object') return true;

        return false;
    }

    checkHoverTargets() {
        const obj = this.selectedObject;
        const type = obj.userData.type;

        // Visual snap target highlight
        if (type === 'plant_draggable') {
            // Glow over tubes 2 or 3
            const t2 = this.labSetup.tubes[1].group;
            const t3 = this.labSetup.tubes[2].group;
            
            const dist2 = obj.position.distanceTo(t2.position);
            const dist3 = obj.position.distanceTo(t3.position);

            if (dist2 < 0.45 && !this.labSetup.tubes[1].group.userData.hasPlant) {
                this.showGlowRing(t2.position.x, 0.08, t2.position.z, 'blue');
            } else if (dist3 < 0.45 && !this.labSetup.tubes[2].group.userData.hasPlant) {
                this.showGlowRing(t3.position.x, 0.08, t3.position.z, 'blue');
            } else {
                this.sceneManager.targetGlowMesh.visible = false;
            }
        }

        if (type === 'stopper_draggable') {
            // Highlight tubes that don't have stoppers
            let hoveredTube = null;
            this.labSetup.tubes.forEach(t => {
                if (!t.group.userData.hasStopper && obj.position.distanceTo(t.group.position) < 0.4) {
                    hoveredTube = t.group;
                }
            });

            if (hoveredTube) {
                this.showGlowRing(hoveredTube.position.x, 0.75, hoveredTube.position.z, 'blue');
            } else {
                this.sceneManager.targetGlowMesh.visible = false;
            }
        }

        if (type === 'box_draggable') {
            // Highlight Tube 3 or Tube 4
            const t3 = this.labSetup.tubes[2].group;
            const t4 = this.labSetup.tubes[3].group;
            const dist3 = obj.position.distanceTo(t3.position);
            const dist4 = obj.position.distanceTo(t4.position);

            if (dist3 < 0.45 && !t3.userData.hasBox) {
                this.showGlowRing(t3.position.x, 0.08, t3.position.z, 'blue');
            } else if (dist4 < 0.45 && !t4.userData.hasBox) {
                this.showGlowRing(t4.position.x, 0.08, t4.position.z, 'blue');
            } else {
                this.sceneManager.targetGlowMesh.visible = false;
            }
        }

        if (type === 'cap_draggable') {
            // Highlight empty or filled cuvettes
            let hoveredCuv = null;
            this.labSetup.cuvettes.forEach(c => {
                if (c.userData.id !== 'Blank' && !c.userData.isCapped && obj.position.distanceTo(c.position) < 0.35) {
                    hoveredCuv = c;
                }
            });

            if (hoveredCuv) {
                this.showGlowRing(hoveredCuv.position.x, 0.32, hoveredCuv.position.z, 'blue');
            } else {
                this.sceneManager.targetGlowMesh.visible = false;
            }
        }

        if (type === 'cuvette_object') {
            // Highlight spectrophotometer chamber slot
            const slotPos = new THREE.Vector3();
            this.labSetup.specChamberSnapSpot.getWorldPosition(slotPos);
            const dist = obj.position.distanceTo(slotPos);

            if (dist < 0.55 && this.labSetup.specGroup.userData.isLidOpen && !this.labSetup.specGroup.userData.hasCuvette) {
                this.showGlowRing(slotPos.x, slotPos.y + 0.1, slotPos.z, 'red');
            } else {
                this.sceneManager.secondaryTargetGlowMesh.visible = false;
            }
        }
    }

    showGlowRing(x, y, z, color = 'blue') {
        if (color === 'blue') {
            this.sceneManager.targetGlowMesh.position.set(x, y + 0.01, z);
            this.sceneManager.targetGlowMesh.visible = true;
        } else {
            this.sceneManager.secondaryTargetGlowMesh.position.set(x, y + 0.01, z);
            this.sceneManager.secondaryTargetGlowMesh.visible = true;
        }
    }

    handleDrop(obj) {
        const type = obj.userData.type;

        // 1. Drop Plant
        if (type === 'plant_draggable') {
            const t2 = this.labSetup.tubes[1].group;
            const t3 = this.labSetup.tubes[2].group;
            const dist2 = obj.position.distanceTo(t2.position);
            const dist3 = obj.position.distanceTo(t3.position);

            if (dist2 < 0.45 && !t2.userData.hasPlant && obj.userData.index === 1) {
                // Snap into Tube 2
                obj.position.set(t2.position.x, t2.position.y + 0.1, t2.position.z);
                t2.userData.hasPlant = true;
                obj.userData.placedInTube = 2;
                this.uiOverlay.showToast("تم وضع نبات الإيلوديا في الأنبوب 2");
                this.checkPhase1Progress();
            } else if (dist3 < 0.45 && !t3.userData.hasPlant && obj.userData.index === 2) {
                // Snap into Tube 3
                obj.position.set(t3.position.x, t3.position.y + 0.1, t3.position.z);
                t3.userData.hasPlant = true;
                obj.userData.placedInTube = 3;
                this.uiOverlay.showToast("تم وضع نبات الإيلوديا في الأنبوب 3");
                this.checkPhase1Progress();
            } else {
                // Return home
                obj.position.copy(obj.userData.homePosition);
            }
        }

        // 2. Drop Stopper
        else if (type === 'stopper_draggable') {
            let snapped = false;
            this.labSetup.tubes.forEach(t => {
                if (!t.group.userData.hasStopper && obj.position.distanceTo(t.group.position) < 0.4) {
                    // Snap
                    obj.position.set(t.group.position.x, t.group.position.y + 0.75, t.group.position.z);
                    t.group.userData.hasStopper = true;
                    obj.userData.pluggedTubeIndex = t.index;
                    this.uiOverlay.showToast(`تم سد الأنبوب ${t.index} بسدادة مطاطية`);
                    snapped = true;
                    this.checkPhase1Progress();
                    
                    if (this.currentStep === '2c') {
                        this.checkPhase2Progress();
                    }
                }
            });

            if (!snapped) {
                // If it was plugged inside a tube, unplug it
                if (obj.userData.pluggedTubeIndex !== null) {
                    const idx = obj.userData.pluggedTubeIndex;
                    this.labSetup.tubes[idx - 1].group.userData.hasStopper = false;
                    obj.userData.pluggedTubeIndex = null;
                }
                obj.position.copy(obj.userData.homePosition);
                
                if (this.currentStep === '2c') {
                    this.checkPhase2Progress();
                }
            }
        }

        // 3. Drop Box
        else if (type === 'box_draggable') {
            const t3 = this.labSetup.tubes[2].group;
            const t4 = this.labSetup.tubes[3].group;
            const dist3 = obj.position.distanceTo(t3.position);
            const dist4 = obj.position.distanceTo(t4.position);

            if (dist3 < 0.45 && !t3.userData.hasBox && obj.userData.index === 1) {
                obj.position.set(t3.position.x, t3.position.y + 0.4, t3.position.z);
                t3.userData.hasBox = true;
                obj.userData.coveringTubeIndex = 3;
                
                // Hide tube visually (box is sitting on top of it)
                this.setTubeVisibility(t3, false);
                this.uiOverlay.showToast("تم تغطية الأنبوب 3 بصندوق عزل الضوء");
                this.checkPhase1Progress();
            } else if (dist4 < 0.45 && !t4.userData.hasBox && obj.userData.index === 2) {
                obj.position.set(t4.position.x, t4.position.y + 0.4, t4.position.z);
                t4.userData.hasBox = true;
                obj.userData.coveringTubeIndex = 4;
                
                // Hide tube visually (box is sitting on top of it)
                this.setTubeVisibility(t4, false);
                this.uiOverlay.showToast("تم تغطية الأنبوب 4 بصندوق عزل الضوء");
                this.checkPhase1Progress();
            } else {
                // Box was NOT snapped to any tube — clear any previous covering state
                // (tube was already made visible in onPointerDown, so just clean up state)
                if (obj.userData.coveringTubeIndex !== null) {
                    const idx = obj.userData.coveringTubeIndex;
                    const tubeGroup = this.labSetup.tubes[idx - 1].group;
                    tubeGroup.userData.hasBox = false;
                    // Tube is already visible (was shown in onPointerDown), ensure it's visible
                    this.setTubeVisibility(tubeGroup, true);
                    obj.userData.coveringTubeIndex = null;
                }
                obj.position.copy(obj.userData.homePosition);
                
                if (this.currentStep === '2b') {
                    this.checkPhase2Progress();
                }
            }
        }

        // 4. Drop Cuvette Cap
        else if (type === 'cap_draggable') {
            let snapped = false;
            this.labSetup.cuvettes.forEach(c => {
                if (c.userData.id !== 'Blank' && !c.userData.isCapped && obj.position.distanceTo(c.position) < 0.35) {
                    obj.position.set(c.position.x, c.position.y + 0.32, c.position.z);
                    c.userData.isCapped = true;
                    obj.userData.cappedCuvetteId = c.userData.id;
                    this.uiOverlay.showToast(`تم إغلاق الكيوفيت ${c.userData.id}`);
                    snapped = true;
                    this.checkPhase2Progress();
                }
            });

            if (!snapped) {
                if (obj.userData.cappedCuvetteId !== null) {
                    const cid = obj.userData.cappedCuvetteId;
                    const targetCuv = this.labSetup.cuvettes.find(c => c.userData.id === cid);
                    if (targetCuv) targetCuv.userData.isCapped = false;
                    obj.userData.cappedCuvetteId = null;
                }
                obj.position.copy(obj.userData.homePosition);
                this.checkPhase2Progress();
            }
        }

        // 5. Drop Cuvette into Spectrophotometer
        else if (type === 'cuvette_object') {
            const slotPos = new THREE.Vector3();
            this.labSetup.specChamberSnapSpot.getWorldPosition(slotPos);
            const dist = obj.position.distanceTo(slotPos);

            if (dist < 0.55 && this.labSetup.specGroup.userData.isLidOpen && !this.labSetup.specGroup.userData.hasCuvette) {
                // Snap into spec chamber
                obj.position.copy(slotPos);
                obj.position.y += 0.08; // fit height
                obj.userData.inSpectrophotometer = true;
                
                this.labSetup.specGroup.userData.hasCuvette = true;
                this.labSetup.specGroup.userData.cuvetteInChamber = obj;

                this.uiOverlay.showToast(`تم إدخال الكيوفيت ${obj.userData.id === 'Blank' ? 'الضابطة (الماء)' : 'رقم ' + obj.userData.id} في مطياف الضوء`);
                
                if (this.currentStep === '3e' && obj.userData.id === 'Blank') {
                    this.advanceStep('3f');
                } else if (this.currentStep === '3h') {
                    this.checkPhase3Progress();
                }
            } else {
                // Unsnap if it was in the spec
                if (obj.userData.inSpectrophotometer) {
                    obj.userData.inSpectrophotometer = false;
                    this.labSetup.specGroup.userData.hasCuvette = false;
                    this.labSetup.specGroup.userData.cuvetteInChamber = null;
                }
                // Return to cuvette rack position
                obj.position.copy(obj.userData.homePosition);
                
                if (this.currentStep === '3h') {
                    this.checkPhase3Progress();
                }
            }
        }
    }

    setTubeVisibility(tubeGroup, visible) {
        tubeGroup.traverse(child => {
            if (child.name !== 'stopper_snap_spot' && child.name !== 'plant_snap_spot') {
                child.visible = visible;
            }
        });
        
        // Also hide any plants inside this tube
        this.labSetup.plantsInTank.forEach(plant => {
            if (plant.userData.placedInTube === tubeGroup.userData.index) {
                plant.visible = visible;
            }
        });

        // Also hide any stoppers snapped to this tube
        this.labSetup.stoppers.forEach(stopper => {
            if (stopper.userData.pluggedTubeIndex === tubeGroup.userData.index) {
                stopper.visible = visible;
            }
        });
    }

    toggleLamps() {
        const switchBtn = this.labSetup.interactiveObjects.find(obj => obj.name === "btn_lamps_switch");
        
        // Rotate/translate switch button down/up slightly
        const anyLampOn = this.labSetup.lamps[0].isOn;
        
        this.labSetup.lamps.forEach(lamp => {
            lamp.isOn = !anyLampOn;
            if (lamp.isOn) {
                lamp.bulbMat.emissive.setHex(0xeab308); // glowing yellow bulb
                lamp.light.intensity = 2.0; // shine spotLight
            } else {
                lamp.bulbMat.emissive.setHex(0x000000);
                lamp.light.intensity = 0;
            }
        });

        if (!anyLampOn) {
            switchBtn.position.y = 0.05; // pressed look
            this.uiOverlay.showToast("تم تشغيل الإضاءة في المختبر 💡");
            if (this.currentStep === '1e') {
                this.advanceStep('1f');
            }
        } else {
            switchBtn.position.y = 0.07;
            this.uiOverlay.showToast("تم إطفاء الإضاءة");
            
            if (this.currentStep === '2a' && this.isIncubationComplete) {
                this.advanceStep('2b');
            }
        }
    }

    toggleSpectrophotometerPower() {
        const spec = this.labSetup.specGroup;
        spec.userData.isOn = !spec.userData.isOn;
        
        const screen = document.getElementById('specScreen');
        const warmLed = document.getElementById('warmLed');
        const warmLabel = document.getElementById('warmLabel');
        const btnZero = document.getElementById('btnSpecZero');
        const btnRead = document.getElementById('btnSpecRead');

        if (spec.userData.isOn) {
            this.labSetup.specScreenMat.color.setHex(0x14532d); // glowing dark green screen
            
            if (screen) screen.textContent = "جاري الإحماء...";
            if (warmLed) {
                warmLed.className = "indicator-led warm"; // yellow
            }
            if (warmLabel) warmLabel.textContent = "جارِ الإحماء...";

            this.uiOverlay.showToast("تم تشغيل مطياف الضوء، انتظر الإحماء 15 دقيقة...");

            if (this.currentStep === '3a') {
                this.advanceStep('3b');
                // Simulate 15 min warm up in 2 seconds
                setTimeout(() => {
                    if (spec.userData.isOn) {
                        if (screen) screen.textContent = `${spec.userData.wavelength} نانومتر`;
                        if (warmLed) {
                            warmLed.className = "indicator-led ready"; // green
                        }
                        if (warmLabel) warmLabel.textContent = "جاهز للعمل";
                        if (btnZero) btnZero.disabled = false;
                        if (btnRead) btnRead.disabled = false;

                        this.uiOverlay.showToast("اكتمل إحماء مطياف الضوء وجاهز للاستخدام!");
                        this.advanceStep('3c');
                    }
                }, 2000);
            }
        } else {
            this.labSetup.specScreenMat.color.setHex(0x1e293b);
            if (screen) screen.textContent = "مغلق";
            if (warmLed) warmLed.className = "indicator-led"; // dark
            if (warmLabel) warmLabel.textContent = "مغلق";
            if (btnZero) btnZero.disabled = true;
            if (btnRead) btnRead.disabled = true;
            this.uiOverlay.showToast("تم إيقاف تشغيل مطياف الضوء");
        }
    }

    toggleSpectrophotometerLid() {
        const spec = this.labSetup.specGroup;
        spec.userData.isLidOpen = !spec.userData.isLidOpen;
        
        // Rotate lid group mesh
        const targetRot = spec.userData.isLidOpen ? -Math.PI / 2 : 0;
        
        // Simple animation
        let elapsed = 0;
        const speed = 0.1;
        const anim = () => {
            if (elapsed < 1) {
                this.labSetup.specLidGroup.rotation.x = THREE.MathUtils.lerp(this.labSetup.specLidGroup.rotation.x, targetRot, speed);
                elapsed += speed;
                requestAnimationFrame(anim);
            } else {
                this.labSetup.specLidGroup.rotation.x = targetRot;
            }
        };
        anim();

        if (spec.userData.isLidOpen) {
            this.uiOverlay.showToast("تم فتح غطاء مطياف الضوء");
            if (this.currentStep === '3d') {
                this.advanceStep('3e');
            }
        } else {
            this.uiOverlay.showToast("تم إغلاق غطاء مطياف الضوء");
            if (this.currentStep === '3f') {
                this.advanceStep('3g');
            }
        }
    }

    selectPipette() {
        if (this.currentStep === '2e') {
            this.activeTool = 'pipette';
            this.labSetup.pipetteGroup.userData.isSelected = true;
            this.uiOverlay.showToast("تم تحديد ماصة الميكروبيبت P1000. وجّهها لعلبة الرؤوس (Tips Box) لتركيب رأس ماصة.");
            this.advanceStep('2f');
            
            // Show volume ui overlay
            const volUI = document.getElementById('volumeSetterUI');
            if (volUI) volUI.style.display = 'block';
        }
    }

    adjustPipetteVolume(amount) {
        const p = this.labSetup.pipetteGroup.userData;
        p.volume = Math.max(100, Math.min(1000, p.volume + amount));
        const valDisp = document.getElementById('volumeValue');
        if (valDisp) valDisp.textContent = p.volume;
    }

    savePipetteVolume() {
        const p = this.labSetup.pipetteGroup.userData;
        if (p.volume === 1000 && (this.currentStep === '2e' || this.currentStep === '2f')) {
            this.uiOverlay.showToast("تم حفظ الحجم على 1000 µL. انقر على علبة الرؤوس (Tips Box) لتركيب رأس جديد.");
            
            // Hide volume UI
            const volUI = document.getElementById('volumeSetterUI');
            if (volUI) volUI.style.display = 'none';

            this.advanceStep('2g');
        } else {
            this.uiOverlay.showToast("⚠️ يجب ضبط الحجم على 1000 µL لنقل 1 مل من العينة بدقة كما ينص البروتوكول!");
        }
    }

    attachPipetteTip() {
        const p = this.labSetup.pipetteGroup.userData;
        if (this.activeTool === 'pipette' && !p.hasTip) {
            p.hasTip = true;
            this.labSetup.attachedTipMesh.visible = true;
            this.uiOverlay.showToast("تم تركيب رأس ماصة جديد (Tip). انقر على الأنبوب 1 لسحب العينة الأولى.");
            
            if (this.currentStep === '2g') {
                this.advanceStep('2h');
            } else if (this.currentStep === '2l') {
                this.uiOverlay.showToast("تم تركيب رأس ماصة جديد. اسحب من الأنبوب التالي.");
            }
        }
    }

    handlePipetteClick() {
        // Cast ray to find if we clicked on tubes or cuvettes
        const checkIntersects = this.raycaster.intersectObjects(
            this.labSetup.tubes.map(t => t.group).concat(this.labSetup.cuvettes), true
        );

        if (checkIntersects.length > 0) {
            let hit = checkIntersects[0].object;
            while (hit && !hit.userData.type) hit = hit.parent;

            if (hit) {
                const type = hit.userData.type;
                const p = this.labSetup.pipetteGroup.userData;

                // 1. Draw Liquid from Tube
                if (type === 'tube_object') {
                    const tubeIndex = hit.userData.index;

                    if (!p.hasTip) {
                        this.uiOverlay.showToast("⚠️ يجب تركيب رأس ماصة جديد أولاً!");
                        return;
                    }

                    if (p.containsFluid) {
                        this.uiOverlay.showToast("⚠️ الماصة ممتلئة بالفعل بالسوائل! صبها أولاً في الكيوفيت المناسب.");
                        return;
                    }

                    // Perform suction animation/sound/state
                    p.containsFluid = true;
                    p.fluidSourceTubeIndex = tubeIndex;
                    
                    // Match fluid color in tip to the tube's current color
                    const tubeCol = this.labSetup.tubes[tubeIndex - 1].fluidMat.color.clone();
                    this.labSetup.pipetteFluidMesh.material.color.copy(tubeCol);
                    this.labSetup.pipetteFluidMesh.material.opacity = 0.85;

                    this.uiOverlay.showToast(`تم سحب 1000 µL من محلول الأنبوب ${tubeIndex}. صب العينة في الكيوفيت ${tubeIndex}.`);

                    if (this.currentStep === '2h' && tubeIndex === 1) {
                        this.advanceStep('2i');
                    }
                }

                // 2. Dispense Liquid to Cuvette
                else if (type === 'cuvette_object') {
                    const cuvId = hit.userData.id;

                    if (cuvId === 'Blank') {
                        this.uiOverlay.showToast("⚠️ كيوفيت الماء (Blank) جاهزة بالفعل ولا تحتاج لعينات.");
                        return;
                    }

                    if (!p.containsFluid) {
                        this.uiOverlay.showToast("⚠️ الماصة فارغة! اسحب عينة من أحد الأنابيب أولاً.");
                        return;
                    }

                    const targetTubeIdx = parseInt(cuvId);
                    if (p.fluidSourceTubeIndex !== targetTubeIdx) {
                        this.uiOverlay.showToast(`⚠️ خطأ! يجب صب سائل الأنبوب ${p.fluidSourceTubeIndex} في الكيوفيت ${p.fluidSourceTubeIndex} لتفادي اختلاط العينات!`);
                        return;
                    }

                    // Fill cuvette
                    hit.userData.isFilled = true;
                    const cFluidMesh = hit.getObjectByName("cuvette_fluid_mesh");
                    cFluidMesh.material.color.copy(this.labSetup.pipetteFluidMesh.material.color);
                    cFluidMesh.material.opacity = 0.85;

                    // Empty pipette fluid
                    p.containsFluid = false;
                    p.fluidSourceTubeIndex = null;
                    this.labSetup.pipetteFluidMesh.material.opacity = 0;

                    this.uiOverlay.showToast(`تم صب العينة بنجاح في الكيوفيت ${cuvId}. الآن تخلص من رأس الماصة بسلة المهملات.`);

                    if (this.currentStep === '2i' && cuvId === '1') {
                        this.advanceStep('2j');
                    } else if (this.currentStep === '2l') {
                        this.checkPhase2Progress();
                    }
                }
            }
        }

        // Check if trash is clicked
        const trashIntersect = this.raycaster.intersectObject(this.labSetup.interactiveObjects.find(obj => obj.name === "tool_trash"), true);
        if (trashIntersect.length > 0) {
            const p = this.labSetup.pipetteGroup.userData;
            if (this.activeTool === 'pipette' && p.hasTip) {
                // Eject Tip
                p.hasTip = false;
                p.containsFluid = false;
                p.fluidSourceTubeIndex = null;
                this.labSetup.attachedTipMesh.visible = false;
                this.labSetup.pipetteFluidMesh.material.opacity = 0;

                this.uiOverlay.showToast("تم إلقاء رأس الماصة المستعمل في سلة المهملات.");

                if (this.currentStep === '2j') {
                    this.advanceStep('2k');
                } else if (this.currentStep === '2l') {
                    this.checkPhase2Progress();
                }
            }
        }
    }

    startTimeLapseSimulation() {
        const screen = document.getElementById('clockSpinScreen');
        const hourHand = document.getElementById('hourHand');
        const minHand = document.getElementById('minuteHand');
        const readout = document.getElementById('timeReadout');
        const cycle = document.getElementById('cycleLabel');

        if (screen) screen.classList.add('visible');

        // Play a nice time-lapse animation: spin clock hands 12 rotations
        let totalMinutes = 0;
        const targetMinutes = 12 * 60; // 12 hours
        const speed = 12; // minutes per tick

        const tick = () => {
            totalMinutes += speed;
            if (totalMinutes <= targetMinutes) {
                // Spin hands
                const hrRot = (totalMinutes / 60) * 30; // 30 deg per hour
                const minRot = totalMinutes * 6; // 6 deg per minute

                if (hourHand) hourHand.style.transform = `rotate(${hrRot}deg)`;
                if (minHand) minHand.style.transform = `rotate(${minRot}deg)`;

                // Digital readout
                const h = Math.floor(totalMinutes / 60);
                const m = totalMinutes % 60;
                const hh = h < 10 ? '0' + h : h;
                const mm = m < 10 ? '0' + m : m;
                if (readout) readout.textContent = `${hh}:${mm}`;

                // Day/Night label
                if (cycle) {
                    if (h < 6) cycle.textContent = "النهار (البناء الضوئي النشط) ☀️";
                    else cycle.textContent = "المساء (التنفس الخلوي) 🌙";
                }

                // Smooth color change of the solution in tubes inside scene Manager loop
                // Tube 2 turns Blue, Tube 3 turns Yellow, 1 and 4 stay Green
                const ratio = totalMinutes / targetMinutes;
                
                // Tube 2 Green to Blue
                this.labSetup.tubes[1].fluidMat.color.lerpColors(
                    this.labSetup.materials.btbGreen.color,
                    this.labSetup.materials.btbBlue.color,
                    ratio
                );

                // Tube 3 Green to Yellow
                this.labSetup.tubes[2].fluidMat.color.lerpColors(
                    this.labSetup.materials.btbGreen.color,
                    this.labSetup.materials.btbYellow.color,
                    ratio
                );

                setTimeout(tick, 25);
            } else {
                // Done!
                setTimeout(() => {
                    if (screen) screen.classList.remove('visible');
                    this.isIncubationComplete = true;
                    this.uiOverlay.showToast("مرت 12 ساعة بنجاح! قارن الألوان والـ pH الآن.");
                    
                    // Update state variables for tubes
                    this.labSetup.tubes[0].group.userData.phValue = 7.0; // Green
                    this.labSetup.tubes[1].group.userData.phValue = 7.8; // Blue
                    this.labSetup.tubes[2].group.userData.phValue = 6.2; // Yellow
                    this.labSetup.tubes[3].group.userData.phValue = 7.0; // Green

                    // Setup Cuvette values matching tubes
                    this.labSetup.cuvettes[1].userData.phValue = 7.0;
                    this.labSetup.cuvettes[1].userData.absorbanceVal = 0.350;

                    this.labSetup.cuvettes[2].userData.phValue = 7.8;
                    this.labSetup.cuvettes[2].userData.absorbanceVal = 0.800; // Blue - high abs at 615nm

                    this.labSetup.cuvettes[3].userData.phValue = 6.2;
                    this.labSetup.cuvettes[3].userData.absorbanceVal = 0.050; // Yellow - low abs at 615nm

                    this.labSetup.cuvettes[4].userData.phValue = 7.0;
                    this.labSetup.cuvettes[4].userData.absorbanceVal = 0.350;

                    this.advanceStep('2a'); // Shift to Phase 2
                }, 800);
            }
        };

        tick();
    }

    checkPhase1Progress() {
        const tubes = this.labSetup.tubes;
        const plantsPlaced = tubes[1].group.userData.hasPlant && tubes[2].group.userData.hasPlant;
        const stoppersPlaced = tubes.every(t => t.group.userData.hasStopper);
        const boxesPlaced = tubes[2].group.userData.hasBox && tubes[3].group.userData.hasBox;

        if (this.currentStep === '1b' && plantsPlaced) {
            this.advanceStep('1c');
        } else if (this.currentStep === '1c' && stoppersPlaced) {
            this.advanceStep('1d');
        } else if (this.currentStep === '1d' && boxesPlaced) {
            this.advanceStep('1e');
        }
    }

    checkPhase2Progress() {
        const tubes = this.labSetup.tubes;
        const boxesRemoved = !tubes[2].group.userData.hasBox && !tubes[3].group.userData.hasBox;
        const stoppersRemoved = tubes.every(t => !t.group.userData.hasStopper);
        const capsPlaced = this.labSetup.cuvetteLids.every(l => l.userData.cappedCuvetteId !== null);
        const cuvettesFilled = this.labSetup.cuvettes.every(c => c.userData.isFilled);

        if (this.currentStep === '2b' && boxesRemoved) {
            this.advanceStep('2c');
        } else if (this.currentStep === '2c' && stoppersRemoved) {
            this.advanceStep('2d');
            // Give brief estimation pH popup instructions
            this.uiOverlay.showToast("الخطوة 2د: تقدير الرقم الهيدروجيني بالعين باستخدام الملصق. ثم حدد الماصة للخطوة التالية.");
            setTimeout(() => this.advanceStep('2e'), 1500);
        } else if (this.currentStep === '2k' && this.labSetup.cuvettes[1].userData.isCapped && this.labSetup.cuvettes[1].userData.isFilled) {
            this.advanceStep('2l');
        } else if (this.currentStep === '2l' && cuvettesFilled && capsPlaced) {
            // Eject pipette tool and shift to Phase 3
            this.activeTool = null;
            this.labSetup.pipetteGroup.userData.isSelected = false;
            this.labSetup.pipetteGroup.position.copy(this.labSetup.pipetteGroup.userData.homePosition);
            this.uiOverlay.showToast("المرحلة 2 اكتملت بنجاح ✓! انتقل للمرحلة 3 وجهاز مطياف الضوء.");
            this.advanceStep('3a');
        }
    }

    checkPhase3Progress() {
        const spec = this.labSetup.specGroup;
        const screen = document.getElementById('specScreen');
        
        // Zeroing spectrophotometer
        if (this.currentStep === '3g' && spec.userData.hasCuvette && spec.userData.cuvetteInChamber.userData.id === 'Blank' && !spec.userData.isLidOpen) {
            // Enable zero button
            const btnZero = document.getElementById('btnSpecZero');
            if (btnZero) btnZero.onclick = () => {
                this.spectrophotometerZeroed = true;
                if (screen) screen.textContent = "0.000 امتصاص";
                this.uiOverlay.showToast("تم ضبط العيار المرجعي بنجاح (تصفير). الآن استبدل كيوفيت الماء بعيناتك وقسها.");
                
                // Show measurement values table header update or enable measurement buttons
                document.getElementById('btnSpecRead').disabled = false;
                this.advanceStep('3h');
            };
        }

        // Measuring 4 samples
        if (this.currentStep === '3h') {
            const btnRead = document.getElementById('btnSpecRead');
            if (btnRead) {
                btnRead.onclick = () => {
                    if (!this.spectrophotometerZeroed) {
                        this.uiOverlay.showToast("⚠️ يجب تصفير الجهاز بكيوفيت الماء أولاً!");
                        return;
                    }
                    if (!spec.userData.hasCuvette) {
                        this.uiOverlay.showToast("⚠️ لا توجد كيوفيت في حجرة القياس!");
                        return;
                    }
                    if (spec.userData.isLidOpen) {
                        this.uiOverlay.showToast("⚠️ أغلق غطاء حجرة القياس قبل الضغط على قياس!");
                        return;
                    }

                    const cuv = spec.userData.cuvetteInChamber;
                    if (cuv.userData.id === 'Blank') {
                        if (screen) screen.textContent = "0.000 امتصاص";
                        return;
                    }

                    const val = cuv.userData.absorbanceVal;
                    if (screen) screen.textContent = `${val.toFixed(3)} امتصاص`;
                    
                    const resLabel = document.getElementById(`abs_res_${cuv.userData.id}`);
                    if (resLabel) resLabel.textContent = val.toFixed(3);

                    this.uiOverlay.showToast(`الكيوفيت ${cuv.userData.id}: الامتصاصية = ${val.toFixed(3)}`);

                    // Check if all 4 absorbance readings are done
                    const readings = ['1', '2', '3', '4'].map(id => {
                        const lbl = document.getElementById(`abs_res_${id}`);
                        return lbl ? lbl.textContent : '--';
                    });

                    if (readings.every(r => r !== '--')) {
                        this.uiOverlay.showToast("تهانينا! لقد سجلت جميع قياسات امتصاص الضوء للعينات الأربعة بنجاح!");
                        // Enable final Next button to trigger Quiz phase
                        const btnNext = document.getElementById('btnNextPhase');
                        if (btnNext) btnNext.disabled = false;
                    }
                };
            }
        }
    }

    advanceStep(nextStep) {
        // Unlock next step
        this.currentStep = nextStep;
        this.uiOverlay.updateStepList(nextStep);
    }

    getFriendlyName(obj) {
        const type = obj.userData.type;
        if (type === 'plant_draggable') return `نبات الإيلوديا المخبري #${obj.userData.index}`;
        if (type === 'stopper_draggable') return `سدادة مطاطية #${obj.userData.index}`;
        if (type === 'box_draggable') return `صندوق حجب الضوء #${obj.userData.index}`;
        if (type === 'cap_draggable') return `غطاء الكيوفيت #${obj.userData.index}`;
        if (type === 'cuvette_object') return obj.userData.id === 'Blank' ? 'كيوفيت الضبط (ماء مقطر)' : `كيوفيت العينة ${obj.userData.id}`;
        if (type === 'lamp_switch') return "مفتاح تشغيل مصابيح الإضاءة 💡";
        if (type === 'pipette_object') return "ماصة ميكروبيبت P1000";
        if (type === 'tips_box_object') return "علبة رؤوس الماصة (Tips Box)";
        if (obj.name === 'spec_power_btn') return "مفتاح تشغيل مطياف الضوء 🔌";
        if (obj.name === 'spec_lid' || (obj.parent && obj.parent.name === 'spec_lid')) return "غطاء حجرة قياس مطياف الضوء";
        return obj.name || "عنصر معملي";
    }

    resetExperiment() {
        // Reload page to perform complete hard reset
        window.location.reload();
    }
}
