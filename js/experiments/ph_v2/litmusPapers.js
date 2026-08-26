// js/experiments/ph_v2/litmusPapers.js
import * as THREE from 'three';
import { soundManager } from './soundManager.js';

// Scientific Color palette based on pH intensity
export const PH_COLORS = {
    // Acids (for Blue paper turning red)
    lemon: { r: 136, g: 19, b: 55 },    // pH = 2.0 (Deep Crimson / Burgundy)
    vinegar: { r: 220, g: 38, b: 38 },  // pH = 2.5 (Bright Rose Red)
    
    // Bases (for Red paper turning blue)
    bicarb: { r: 59, g: 130, b: 246 },  // pH = 8.5 (Bright Cyan-Blue)
    soap: { r: 30, g: 58, b: 138 },     // pH = 9.5 (Deep Navy Blue)
    
    // Defaults
    blueOriginal: { r: 37, g: 99, b: 235 },
    redOriginal: { r: 239, g: 68, b: 68 }
};

export class LitmusPapers {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.papers = [];
        this.visible = true;
        this.paperCounter = 0;

        this.boxPos = {
            blue: new THREE.Vector3(-3.6, 0.45, 0.2),
            red: new THREE.Vector3(-2.9, 0.45, 0.2)
        };

        this.activeBluePaper = null;
        this.activeRedPaper = null;

        this.init();
    }

    init() {
        this.group = new THREE.Group();
        this.group.name = "litmusPapersGroup";

        // 1. Blue Litmus Paper Box (Container)
        const boxGeo = new THREE.BoxGeometry(0.35, 0.35, 0.3);
        const blueBoxMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3 });
        const blueBox = new THREE.Mesh(boxGeo, blueBoxMat);
        blueBox.position.set(-3.6, 0.175, 0.2);
        this.group.add(blueBox);

        // Blue Box Label Badge
        const blueRimGeo = new THREE.BoxGeometry(0.37, 0.04, 0.32);
        const rimMatBlue = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
        const blueRim = new THREE.Mesh(blueRimGeo, rimMatBlue);
        blueRim.position.set(-3.6, 0.34, 0.2);
        this.group.add(blueRim);

        // 2. Red Litmus Paper Box (Container)
        const redBoxMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.3 });
        const redBox = new THREE.Mesh(boxGeo, redBoxMat);
        redBox.position.set(-2.9, 0.175, 0.2);
        this.group.add(redBox);

        // Red Box Label Badge
        const rimMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        const redRim = new THREE.Mesh(blueRimGeo, rimMatRed);
        redRim.position.set(-2.9, 0.34, 0.2);
        this.group.add(redRim);

        // 3. 3D Trash Bin (Waste Basket on the far right)
        const binGeo = new THREE.CylinderGeometry(0.3, 0.24, 0.6, 24);
        const binMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.3 });
        this.trashBin = new THREE.Mesh(binGeo, binMat);
        this.trashBin.position.set(4.3, 0.3, 0.2);
        this.trashBin.name = "trashBin";
        this.group.add(this.trashBin);

        const binRimGeo = new THREE.TorusGeometry(0.3, 0.025, 16, 32);
        binRimGeo.rotateX(Math.PI / 2);
        const binRimMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
        const binRim = new THREE.Mesh(binRimGeo, binRimMat);
        binRim.position.set(4.3, 0.6, 0.2);
        this.group.add(binRim);

        // Spawn initial active papers inside boxes
        this.activeBluePaper = this.spawnPaper('blue');
        this.activeRedPaper = this.spawnPaper('red');

        this.sceneManager.addObject(this.group);
    }

    spawnPaper(type) {
        this.paperCounter++;
        const id = `${type}_${this.paperCounter}`;
        const pos = this.boxPos[type].clone();
        const origColor = type === 'blue' ? PH_COLORS.blueOriginal : PH_COLORS.redOriginal;

        const paperGeo = new THREE.BoxGeometry(0.08, 0.6, 0.01);

        // Create 2D Canvas for texture mapping
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.85
        });

        const mesh = new THREE.Mesh(paperGeo, mat);
        mesh.position.copy(pos);
        mesh.name = type === 'blue' ? "bluePaper" : "redPaper";
        mesh.userData = { id: id, type: type };

        const paperObj = {
            id: id,
            type: type,
            mesh: mesh,
            initialPos: pos.clone(),
            isUsed: false,
            isPulledFromBox: false,
            canvas: canvas,
            ctx: ctx,
            texture: texture,
            origColor: { ...origColor },
            currentColor: { ...origColor },
            targetColor: { ...origColor },
            animating: false
        };

        this.redrawPaperCanvas(paperObj);
        this.group.add(mesh);
        this.papers.push(paperObj);

        return paperObj;
    }

    // Called when user grabs active paper from box to instantly spawn a replacement in box
    onPaperPulled(paper) {
        if (!paper.isPulledFromBox) {
            paper.isPulledFromBox = true;

            if (paper.type === 'blue' && paper === this.activeBluePaper) {
                this.activeBluePaper = this.spawnPaper('blue');
            } else if (paper.type === 'red' && paper === this.activeRedPaper) {
                this.activeRedPaper = this.spawnPaper('red');
            }
        }
    }

    redrawPaperCanvas(paper) {
        const ctx = paper.ctx;
        const w = paper.canvas.width;
        const h = paper.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Top 65%: Original Color
        const origRgb = `rgb(${paper.origColor.r}, ${paper.origColor.g}, ${paper.origColor.b})`;
        ctx.fillStyle = origRgb;
        ctx.fillRect(0, 0, w, Math.floor(h * 0.65));

        // Bottom 35%: Dipped Color (Animates smoothly)
        const currentRgb = `rgb(${Math.round(paper.currentColor.r)}, ${Math.round(paper.currentColor.g)}, ${Math.round(paper.currentColor.b)})`;
        ctx.fillStyle = currentRgb;
        ctx.fillRect(0, Math.floor(h * 0.65), w, Math.ceil(h * 0.35));

        // Smooth boundary line blur between dry and wet paper
        const grad = ctx.createLinearGradient(0, h * 0.62, 0, h * 0.68);
        grad.addColorStop(0, origRgb);
        grad.addColorStop(1, currentRgb);
        ctx.fillStyle = grad;
        ctx.fillRect(0, Math.floor(h * 0.62), w, Math.ceil(h * 0.06));

        paper.texture.needsUpdate = true;
    }

    triggerColorAnimation(paper, targetRgb) {
        paper.targetColor = { ...targetRgb };
        paper.animating = true;
        paper.isUsed = true;
    }

    disposePaper(paper) {
        const idx = this.papers.findIndex(p => p.id === paper.id);
        if (idx !== -1) {
            this.papers.splice(idx, 1);
        }
        if (paper.mesh && paper.mesh.parent) {
            paper.mesh.parent.remove(paper.mesh);
        }
        if (paper.texture) paper.texture.dispose();
        soundManager.playPop();
    }

    update() {
        // Run smooth color lerping animations in rendering loop (60fps)
        this.papers.forEach(paper => {
            if (paper.animating) {
                const cur = paper.currentColor;
                const tar = paper.targetColor;

                cur.r += (tar.r - cur.r) * 0.1;
                cur.g += (tar.g - cur.g) * 0.1;
                cur.b += (tar.b - cur.b) * 0.1;

                this.redrawPaperCanvas(paper);

                if (Math.abs(cur.r - tar.r) < 0.5 && Math.abs(cur.g - tar.g) < 0.5 && Math.abs(cur.b - tar.b) < 0.5) {
                    cur.r = tar.r;
                    cur.g = tar.g;
                    cur.b = tar.b;
                    paper.animating = false;
                    this.redrawPaperCanvas(paper);
                }
            }
        });
    }

    setVisible(visible) {
        this.visible = visible;
        this.group.visible = visible;
    }

    reset() {
        // Remove all extra spawned papers except active ones
        [...this.papers].forEach(paper => {
            if (paper.mesh && paper.mesh.parent) {
                paper.mesh.parent.remove(paper.mesh);
            }
            if (paper.texture) paper.texture.dispose();
        });

        this.papers = [];
        this.activeBluePaper = this.spawnPaper('blue');
        this.activeRedPaper = this.spawnPaper('red');
    }
}
