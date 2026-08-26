// js/experiments/ph_v2/dragControls.js
import * as THREE from 'three';

export class DragControls3D {
    constructor(sceneManager, litmusPapers, phMeter, phEngine) {
        this.sceneManager = sceneManager;
        this.litmusPapers = litmusPapers;
        this.phMeter = phMeter;
        this.phEngine = phEngine;

        this.canvas = sceneManager.canvas;
        this.camera = sceneManager.camera;

        this.draggedObject = null;
        this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.bindEvents();
    }

    bindEvents() {
        this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.canvas.addEventListener('pointerup', () => this.onPointerUp());
    }

    onPointerDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 1. Check for clicking the 3D Power Button on the pH Meter
        if (this.phMeter.visible && this.phMeter.powerButtonMesh) {
            const btnIntersects = this.raycaster.intersectObject(this.phMeter.powerButtonMesh);
            if (btnIntersects.length > 0) {
                this.phMeter.togglePower();
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
                this.canvas.setPointerCapture(e.pointerId);

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
                    this.canvas.setPointerCapture(e.pointerId);
                    return;
                }
                obj = obj.parent;
            }
        }
    }

    onPointerMove(e) {
        if (!this.draggedObject) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

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
