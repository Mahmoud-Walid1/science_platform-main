// js/experiments/ph_v2/dragControls.js
import * as THREE from 'three';

export class DragControls3D {
    constructor(sceneManager, litmusPapers, phMeter, phEngine, uiOverlay) {
        this.sceneManager = sceneManager;
        this.litmusPapers = litmusPapers;
        this.phMeter = phMeter;
        this.phEngine = phEngine;
        this.uiOverlay = uiOverlay;

        this.canvas = sceneManager.canvas;
        this.camera = sceneManager.camera;

        this.draggedObject = null;
        this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.bindEvents();
    }

    bindEvents() {
        this.canvas.style.touchAction = 'none';

        const extractClientCoords = (e) => {
            if (e.touches && e.touches.length > 0) {
                return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
            }
            if (e.changedTouches && e.changedTouches.length > 0) {
                return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
            }
            return { clientX: e.clientX, clientY: e.clientY };
        };

        const handleStart = (e) => {
            const coords = extractClientCoords(e);
            this.onPointerDown(coords.clientX, coords.clientY, e);
        };

        const handleMove = (e) => {
            if (!this.draggedObject) return;
            if (e.preventDefault && e.cancelable) e.preventDefault();
            const coords = extractClientCoords(e);
            this.onPointerMove(coords.clientX, coords.clientY);
        };

        const handleEnd = () => {
            this.onPointerUp();
        };

        this.canvas.addEventListener('pointerdown', handleStart);
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleEnd);

        // Mobile Touch Fallback Listeners
        this.canvas.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    }

    onPointerDown(clientX, clientY, rawEvent) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 1. Check for clicking the 3D pH Meter (Body, Screen, or Power Button)
        if (this.phMeter.visible && this.phMeter.group) {
            const btnIntersects = this.raycaster.intersectObject(this.phMeter.group, true);
            if (btnIntersects.length > 0) {
                this.phMeter.togglePower();
                if (this.uiOverlay) {
                    this.uiOverlay.updatePowerBtnUI();
                }
                this.phEngine.checkInteractions();
                return; // Click handled, do not drag
            }
        }

        // 2. Check for dragging tools (All 6 paper strips + Electrode probe)
        const targets = [];
        if (this.litmusPapers.visible && this.litmusPapers.papers) {
            this.litmusPapers.papers.forEach(p => targets.push(p.mesh));
        }
        if (this.phMeter.visible) {
            targets.push(this.phMeter.electrodeGroup);
        }

        if (targets.length === 0) return;

        const intersects = this.raycaster.intersectObjects(targets, true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            // Direct match for papers
            if (obj.name === "bluePaper" || obj.name === "redPaper") {
                this.draggedObject = obj;
                if (rawEvent && rawEvent.pointerId && this.canvas.setPointerCapture) {
                    try { this.canvas.setPointerCapture(rawEvent.pointerId); } catch (err) {}
                }

                // Check if this was an active paper inside a box to replenish
                const paperObj = this.litmusPapers.papers.find(p => p.mesh === obj || p.id === obj.userData?.id);
                if (paperObj) {
                    this.litmusPapers.onPaperPulled(paperObj);
                }
                return;
            }
            // Traverse up for electrodeGroup
            while (obj && obj !== this.sceneManager.scene) {
                if (obj.name === "electrodeGroup") {
                    this.draggedObject = obj;
                    if (rawEvent && rawEvent.pointerId && this.canvas.setPointerCapture) {
                        try { this.canvas.setPointerCapture(rawEvent.pointerId); } catch (err) {}
                    }
                    return;
                }
                obj = obj.parent;
            }
        }
    }

    onPointerMove(clientX, clientY) {
        if (!this.draggedObject) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Dynamically align raycast plane to the object's Z depth (eliminates parallax zoom shift)
        this.plane.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 0, 1),
            this.draggedObject.position
        );

        const targetPos = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.plane, targetPos);

        // Boundary restrictions across full table
        targetPos.x = Math.max(-4.4, Math.min(4.4, targetPos.x));
        targetPos.y = Math.max(0.1, Math.min(1.8, targetPos.y));
        targetPos.z = this.draggedObject.position.z; // maintain Z coordinate

        this.draggedObject.position.copy(targetPos);

        // Run chemical calculations
        this.phEngine.checkInteractions();
    }

    onPointerUp() {
        this.draggedObject = null;
    }
}
