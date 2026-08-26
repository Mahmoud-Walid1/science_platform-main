// js/experiments/ph_v2/phMeter.js
import * as THREE from 'three';
import { soundManager } from './soundManager.js';

export class PhMeter {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.initialPos = new THREE.Vector3(2.55, 0.5, 1.05);
        
        this.isOn = false;
        this.lcdCanvas = null;
        this.lcdCtx = null;
        this.lcdTexture = null;
        
        this.electrodeGroup = null;
        this.powerButtonMesh = null;
        this.wireMesh = null;
        this.visible = false;

        // Resting vs Active ON target positions & scales
        this.restingPos = new THREE.Vector3(2.9, 1.0, -0.3);
        this.activePos = new THREE.Vector3(2.7, 1.1, 0.85); // Brought very close to camera lens
        
        this.restingScale = 1.0;
        this.activeScale = 1.7; // Enlarged by 170%
        this.currentScale = 1.0;

        this.init();
    }

    init() {
        this.group = new THREE.Group();
        this.group.name = "phMeterGroup";

        // 1. Device Body Box (Enlarged geometry: 0.6 x 0.95)
        const bodyGeo = new THREE.BoxGeometry(0.6, 0.95, 0.15);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0, 0);
        this.group.add(body);

        // 2. 4K High-DPI LCD Canvas (1024x512) & Enlarged Display Plane (0.52 x 0.32)
        this.lcdCanvas = document.createElement('canvas');
        this.lcdCanvas.width = 1024;
        this.lcdCanvas.height = 512;
        this.lcdCtx = this.lcdCanvas.getContext('2d');

        this.lcdTexture = new THREE.CanvasTexture(this.lcdCanvas);
        const lcdMat = new THREE.MeshBasicMaterial({ map: this.lcdTexture });
        const lcdGeo = new THREE.PlaneGeometry(0.52, 0.32);
        const meterDisplay = new THREE.Mesh(lcdGeo, lcdMat);
        meterDisplay.position.set(0, 0.18, 0.08);
        this.group.add(meterDisplay);

        // 3. Power Button (Red Cylinder on the body)
        const btnGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16);
        btnGeo.rotateX(Math.PI / 2);
        this.btnMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.1 });
        this.powerButtonMesh = new THREE.Mesh(btnGeo, this.btnMat);
        this.powerButtonMesh.position.set(0, -0.24, 0.08);
        this.powerButtonMesh.name = "powerButton";
        this.group.add(this.powerButtonMesh);

        // Position group at resting position
        this.group.position.copy(this.restingPos);

        // Render default OFF screen
        this.updateLcd("", "");

        // 4. Dynamic Rubber Cable Mesh (Flexible 3D Spline)
        const wireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
        this.wireMesh = new THREE.Mesh(new THREE.BufferGeometry(), wireMat);

        // 5. Electrode Probe Group (Draggable - Z = 1.05 keeps it in front of Z = 0.85)
        this.electrodeGroup = new THREE.Group();
        this.electrodeGroup.name = "electrodeGroup";

        const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 16);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
        const handle = new THREE.Mesh(handleGeo, handleMat);

        const probeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 16);
        const probeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
        const probe = new THREE.Mesh(probeGeo, probeMat);
        probe.position.y = -0.35;

        const bulbGeo = new THREE.SphereGeometry(0.03, 16, 16);
        const bulbMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.y = -0.6;

        this.electrodeGroup.add(handle);
        this.electrodeGroup.add(probe);
        this.electrodeGroup.add(bulb);
        this.electrodeGroup.position.copy(this.initialPos);

        this.sceneManager.addObject(this.group);
        this.sceneManager.addObject(this.wireMesh);
        this.sceneManager.addObject(this.electrodeGroup);
    }

    togglePower() {
        this.isOn = !this.isOn;
        soundManager.playBeep(this.isOn ? 1000 : 400, 0.15);

        if (this.isOn) {
            this.btnMat.color.setHex(0x22c55e); // Turn button Green when ON
            this.updateLcd("0.00", "READY");
        } else {
            this.btnMat.color.setHex(0xef4444); // Turn button Red when OFF
            this.updateLcd("", "");
        }
    }

    updateLcd(valueText, statusText) {
        const ctx = this.lcdCtx;
        const w = this.lcdCanvas.width;
        const h = this.lcdCanvas.height;

        ctx.clearRect(0, 0, w, h);

        if (!this.isOn) {
            // Dark Screen OFF
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 12;
            ctx.strokeRect(8, 8, w - 16, h - 16);
        } else {
            // Bright Glowing 4K LCD Screen ON
            ctx.fillStyle = '#011a10'; // Deep emerald black
            ctx.fillRect(0, 0, w, h);

            // Screen Outer Glowing Border
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 16;
            ctx.strokeRect(10, 10, w - 20, h - 20);

            // Inner Accent Border
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 4;
            ctx.strokeRect(26, 26, w - 52, h - 52);

            // Top Status Header Text
            ctx.fillStyle = '#34d399';
            ctx.font = "800 44px 'Cairo', sans-serif";
            ctx.textAlign = 'left';
            ctx.fillText(statusText || "pH METER", 45, 82);

            // Huge Digital Reading Text (140px Neon Green)
            ctx.fillStyle = '#00ff66'; // Neon Lime Green
            ctx.font = "900 140px 'Courier New', monospace";
            ctx.textAlign = 'center';
            ctx.fillText(valueText || "0.00", w / 2, 310);

            // Unit Label
            ctx.fillStyle = '#6ee7b7';
            ctx.font = "800 42px 'Cairo', sans-serif";
            ctx.textAlign = 'right';
            ctx.fillText("pH Unit", w - 45, 440);
        }

        this.lcdTexture.needsUpdate = true;

        // Sync with floating DOM HUD Badge
        const hud = document.getElementById('phDigitalHud');
        const hudVal = document.getElementById('hudValue');

        if (hud) {
            hud.style.display = this.isOn ? 'flex' : 'none';
        }
        if (hudVal) {
            hudVal.innerText = valueText || "0.00";
        }
    }

    updateWire() {
        if (!this.wireMesh || !this.electrodeGroup) return;

        // Start point: bottom left socket of pH meter body in world space
        const start = new THREE.Vector3();
        this.group.getWorldPosition(start);
        start.x -= 0.15 * this.currentScale;
        start.y -= 0.38 * this.currentScale;
        start.z += 0.05 * this.currentScale;

        // End point: top of electrode blue handle in world space
        const end = this.electrodeGroup.position.clone();
        end.y += 0.2; // top of handle

        // Control point for natural gravity droop curve
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.y -= 0.35; // wire droops downwards under gravity

        const curve = new THREE.CatmullRomCurve3([start, mid, end]);
        const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.012, 8, false);

        if (this.wireMesh.geometry) {
            this.wireMesh.geometry.dispose();
        }
        this.wireMesh.geometry = tubeGeo;
    }

    update() {
        // Smooth position & scale lerp transition when powered ON / OFF
        const targetPos = this.isOn ? this.activePos : this.restingPos;
        const targetScale = this.isOn ? this.activeScale : this.restingScale;

        this.group.position.lerp(targetPos, 0.08);

        this.currentScale += (targetScale - this.currentScale) * 0.08;
        this.group.scale.set(this.currentScale, this.currentScale, this.currentScale);

        // Update dynamic flexible rubber cable
        this.updateWire();
    }

    setVisible(visible) {
        this.visible = visible;
        this.group.visible = visible;
        if (this.wireMesh) {
            this.wireMesh.visible = visible;
        }
        if (this.electrodeGroup) {
            this.electrodeGroup.visible = visible;
        }
    }

    reset() {
        this.isOn = false;
        this.btnMat.color.setHex(0xef4444);
        this.updateLcd("", "");
        if (this.electrodeGroup) {
            this.electrodeGroup.position.copy(this.initialPos);
        }
    }
}
