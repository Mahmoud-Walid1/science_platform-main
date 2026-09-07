import * as THREE from 'three';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        if (!this.canvas) {
            throw new Error("Canvas element is required.");
        }

        this.width = this.canvas.parentElement.clientWidth || window.innerWidth;
        this.height = this.canvas.parentElement.clientHeight || (window.innerHeight - 60);

        // Create Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf1f5f9); // Light laboratory bg

        // Camera Frustum & Zoom setup (Orthographic projection for isometric view)
        this.zoomFrustum = 2.4;
        this.minFrustum = 1.0;
        this.maxFrustum = 4.0;
        const aspect = this.width / this.height;
        this.camera = new THREE.OrthographicCamera(
            -this.zoomFrustum * aspect,
            this.zoomFrustum * aspect,
            this.zoomFrustum,
            -this.zoomFrustum,
            0.1,
            1000
        );

        // Camera positions: standard isometric high perspective
        this.defaultCameraPos = new THREE.Vector3(0, 3.2, 5.8);
        this.defaultLookAt = new THREE.Vector3(0, 0.75, 0);
        this.currentLookAt = this.defaultLookAt.clone();

        this.camera.position.copy(this.defaultCameraPos);
        this.camera.lookAt(this.defaultLookAt);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;

        // Lighting
        this.setupLights();

        // Lab Room Backdrop / Floor / Workbench
        this.setupEnvironment();

        // Resize handler
        window.addEventListener('resize', () => this.onResize());

        // Mouse zoom handler
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) {
                this.zoomOut();
            } else if (e.deltaY < 0) {
                this.zoomIn();
            }
        }, { passive: false });

        // Panning system
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.initPanEvents();

        this.updatables = [];
        this.clock = new THREE.Clock();

        setTimeout(() => this.onResize(), 100);
    }

    setupLights() {
        // Soft ambient
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        this.scene.add(ambientLight);

        // Sunlight / Ceiling light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 8, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.bias = -0.001;
        mainLight.shadow.camera.left = -4;
        mainLight.shadow.camera.right = 4;
        mainLight.shadow.camera.top = 4;
        mainLight.shadow.camera.bottom = -4;
        this.scene.add(mainLight);

        // Soft back-filler
        const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.35);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);
    }

    setupEnvironment() {
        // Floor Grid/Lab Bench
        // Large lab table
        const tableGeo = new THREE.BoxGeometry(9, 0.15, 4.5);
        const tableMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            roughness: 0.1,
            metalness: 0.05
        });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(0, -0.075, 0);
        table.receiveShadow = true;
        this.scene.add(table);

        // Table lip (darker edge)
        const lipGeo = new THREE.BoxGeometry(9.04, 0.05, 0.1);
        const lipMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
        const lip = new THREE.Mesh(lipGeo, lipMat);
        lip.position.set(0, 0, 2.22);
        lip.receiveShadow = true;
        this.scene.add(lip);

        // Lab wall back-panel
        const wallGeo = new THREE.PlaneGeometry(16, 8);
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.9,
            metalness: 0.0
        });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(0, 3.2, -2.2);
        wall.receiveShadow = true;
        this.scene.add(wall);

        // Shelf unit on wall (for boxes and stoppers)
        const shelfGeo = new THREE.BoxGeometry(4.5, 0.08, 0.55);
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
        
        // Wall shelf
        const shelf = new THREE.Mesh(shelfGeo, shelfMat);
        shelf.position.set(0, 1.4, -1.8);
        shelf.receiveShadow = true;
        shelf.castShadow = true;
        this.scene.add(shelf);
    }

    addUpdatable(callback) {
        this.updatables.push(callback);
    }

    startLoop() {
        const animate = () => {
            requestAnimationFrame(animate);

            const delta = this.clock.getDelta();
            const elapsedTime = this.clock.getElapsedTime();

            // Run registered updates
            this.updatables.forEach(upd => upd(delta, elapsedTime));

            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }

    onResize() {
        this.width = this.canvas.parentElement.clientWidth || window.innerWidth;
        this.height = this.canvas.parentElement.clientHeight || (window.innerHeight - 60);

        const aspect = this.width / this.height;
        this.camera.left = -this.zoomFrustum * aspect;
        this.camera.right = this.zoomFrustum * aspect;
        this.camera.top = this.zoomFrustum;
        this.camera.bottom = -this.zoomFrustum;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    }

    zoomIn() {
        this.zoomFrustum = Math.max(this.minFrustum, this.zoomFrustum - 0.15);
        this.onResize();
        this.checkCameraPanButton();
    }

    zoomOut() {
        this.zoomFrustum = Math.min(this.maxFrustum, this.zoomFrustum + 0.15);
        this.onResize();
        this.checkCameraPanButton();
    }

    resetCamera() {
        this.zoomFrustum = 2.4;
        this.camera.position.copy(this.defaultCameraPos);
        this.currentLookAt.copy(this.defaultLookAt);
        this.camera.lookAt(this.currentLookAt);
        this.onResize();
        this.checkCameraPanButton();
    }

    initPanEvents() {
        // Prevent context menu
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        this.canvas.addEventListener('pointerdown', (e) => {
            // Check if right click or middle mouse wheel is down for panning
            if (e.button === 2 || e.button === 1 || e.shiftKey) {
                this.isPanning = true;
                this.panStart = { x: e.clientX, y: e.clientY };
                this.canvas.style.cursor = 'move';
                e.stopPropagation();
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (this.isPanning) {
                const aspect = this.width / this.height;
                // Scale factor for panning based on zoom level
                const factor = 0.005 * (this.zoomFrustum / 2.4);
                const dx = (e.clientX - this.panStart.x) * factor * aspect;
                const dy = (e.clientY - this.panStart.y) * factor;

                // Shift camera position left/right and up/down
                this.camera.position.x = Math.max(-3.0, Math.min(3.0, this.camera.position.x - dx));
                this.camera.position.y = Math.max(1.5, Math.min(5.0, this.camera.position.y + dy));

                this.currentLookAt.x = this.camera.position.x;
                this.currentLookAt.y = this.camera.position.y - 2.45;
                this.camera.lookAt(this.currentLookAt);

                this.panStart = { x: e.clientX, y: e.clientY };
                this.checkCameraPanButton();
            }
        });

        const stopPan = () => {
            if (this.isPanning) {
                this.isPanning = false;
                this.canvas.style.cursor = 'default';
            }
        };

        window.addEventListener('pointerup', stopPan);
        window.addEventListener('pointerleave', stopPan);
    }

    checkCameraPanButton() {
        const btn = document.getElementById('btnResetCamera');
        if (!btn) return;
        const isDefault = 
            Math.abs(this.zoomFrustum - 2.4) < 0.05 &&
            Math.abs(this.camera.position.x) < 0.05 &&
            Math.abs(this.camera.position.y - 3.2) < 0.05;
        
        if (isDefault) {
            btn.classList.remove('visible');
        } else {
            btn.classList.add('visible');
        }
    }
}
