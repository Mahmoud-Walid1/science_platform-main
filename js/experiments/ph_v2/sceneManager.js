// js/experiments/ph_v2/sceneManager.js
import * as THREE from 'three';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.isLoopRunning = true;
        this.init();
    }

    init() {
        // Create Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf1f5f9);

        // Create Camera
        this.camera = new THREE.PerspectiveCamera(45, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 100);
        this.camera.position.set(0, 2.0, 5.6);
        this.camera.lookAt(0, 0.35, 0);

        // Create Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.shadowMap.enabled = true;

        // Ambient Light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
        this.scene.add(this.ambientLight);

        // Directional Light
        this.dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.dirLight.position.set(5, 8, 5);
        this.dirLight.castShadow = true;
        this.scene.add(this.dirLight);

        // Lab Table
        const tableGeo = new THREE.BoxGeometry(10, 0.2, 5);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35 });
        this.table = new THREE.Mesh(tableGeo, tableMat);
        this.table.position.y = -0.1;
        this.table.receiveShadow = true;
        this.scene.add(this.table);

        // Bind Resize Event
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }

    startLoop() {
        this.isLoopRunning = true;
        this.tick();
    }

    pauseLoop() {
        this.isLoopRunning = false;
    }

    tick() {
        if (!this.isLoopRunning) return;
        requestAnimationFrame(() => this.tick());
        this.renderer.render(this.scene, this.camera);
    }

    addObject(obj) {
        this.scene.add(obj);
    }
}
