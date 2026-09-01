/**
 * chromosome3DEngine.js
 * Clean Architecture - Three.js Interactive 3D Chromosome Model Engine for Modal View
 */

import * as THREE from 'three';

export class Chromosome3DEngine {
    constructor() {
        this.container = document.getElementById('chromosome3DModal');
        this.canvas = document.getElementById('canvas3dChromosome');
        this.active = false;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.chromosomeGroup = null;
        this.animFrameId = null;

        this.init();
    }

    init() {
        if (!this.canvas) return;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        this.camera.position.set(0, 0, 5);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        this.renderer.setSize(400, 320);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        const dirLight = new THREE.DirectionalLight(0x3b82f6, 1.5);
        dirLight.position.set(5, 5, 5);
        this.scene.add(ambientLight, dirLight);

        // Create 3D Chromosome Group
        this.chromosomeGroup = new THREE.Group();
        this.build3DChromosomeModel();
        this.scene.add(this.chromosomeGroup);
    }

    build3DChromosomeModel() {
        // Sister Chromatids (Two Intersecting Cylinders/Capsules)
        const matRed = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            roughness: 0.3,
            metalness: 0.2,
            transparent: true,
            opacity: 0.95
        });

        const matBlue = new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            roughness: 0.3,
            metalness: 0.2,
            transparent: true,
            opacity: 0.95
        });

        const geoArm = new THREE.CylinderGeometry(0.2, 0.2, 2.4, 32);

        // Left Chromatid Arm
        const arm1 = new THREE.Mesh(geoArm, matRed);
        arm1.rotation.z = Math.PI / 8;
        this.chromosomeGroup.add(arm1);

        // Right Chromatid Arm
        const arm2 = new THREE.Mesh(geoArm, matBlue);
        arm2.rotation.z = -Math.PI / 8;
        this.chromosomeGroup.add(arm2);

        // Centromere Sphere at Center
        const geoCentromere = new THREE.SphereGeometry(0.35, 32, 32);
        const matCentromere = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
        const centromere = new THREE.Mesh(geoCentromere, matCentromere);
        this.chromosomeGroup.add(centromere);
    }

    toggle() {
        this.active = !this.active;
        if (this.container) {
            this.container.style.display = this.active ? 'flex' : 'none';
        }
        if (this.active) {
            this.startRenderLoop();
        } else {
            this.stopRenderLoop();
        }
        return this.active;
    }

    startRenderLoop() {
        const animate = () => {
            if (!this.active) return;
            if (this.chromosomeGroup) {
                this.chromosomeGroup.rotation.y += 0.015;
                this.chromosomeGroup.rotation.x += 0.005;
            }
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
            this.animFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    stopRenderLoop() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
        }
    }
}
