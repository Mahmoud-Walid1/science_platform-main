// js/experiments/ph_v2/beaker3D.js
import * as THREE from 'three';

const BEAKER_CONFIG = {
    lemon: { defaultX: -2.0, name: "عصير الليمون", color: 0xfacc15, opacity: 0.85 },
    vinegar: { defaultX: -1.0, name: "الخل الأبيض", color: 0x94a3b8, opacity: 0.45 },
    water: { defaultX: 0.0, name: "الماء المقطر", color: 0x38bdf8, opacity: 0.65 },
    bicarb: { defaultX: 1.0, name: "بيكربونات الصوديوم", color: 0xffffff, opacity: 0.98 },
    soap: { defaultX: 2.0, name: "ماء وصابون", color: 0x22d3ee, opacity: 0.75 }
};

export class Beaker3D {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.beakers = {};

        this.init();
    }

    init() {
        const glassGeo = new THREE.CylinderGeometry(0.35, 0.32, 0.9, 32, 1, false);
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.28,
            roughness: 0.1,
            metalness: 0.1
        });

        const baseGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.02, 32);
        const liquidGeo = new THREE.CylinderGeometry(0.33, 0.30, 0.6, 32);

        Object.keys(BEAKER_CONFIG).forEach(key => {
            const conf = BEAKER_CONFIG[key];
            const group = new THREE.Group();
            group.name = `beaker_${key}`;

            // Glass mesh
            const glassMesh = new THREE.Mesh(glassGeo, glassMat);
            glassMesh.position.y = 0.45;
            glassMesh.renderOrder = 2; // Render glass after liquid
            group.add(glassMesh);

            // Base mesh
            const baseMesh = new THREE.Mesh(baseGeo, glassMat);
            baseMesh.position.y = 0.01;
            baseMesh.renderOrder = 2;
            group.add(baseMesh);

            // Liquid mesh
            const liquidMat = new THREE.MeshStandardMaterial({
                color: conf.color,
                transparent: true,
                opacity: conf.opacity,
                roughness: 0.15,
                depthWrite: true
            });
            const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
            liquidMesh.position.y = 0.31;
            liquidMesh.renderOrder = 1; // Render liquid before glass
            group.add(liquidMesh);

            // Set fixed coordinates on table
            group.position.set(conf.defaultX, 0, 0);

            this.sceneManager.addObject(group);
            this.beakers[key] = {
                group: group,
                liquidMesh: liquidMesh,
                defaultX: conf.defaultX
            };
        });
    }

    update() {
        // No animation calculations needed in open sandbox
    }

    resetAll() {
        // Reset liquid visual colors if needed (but they stay constant)
    }
}
