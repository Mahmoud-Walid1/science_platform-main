import * as THREE from 'three';

export class SceneManager {
    constructor(canvasId) {
        if (typeof canvasId === 'string') {
            this.canvas = document.getElementById(canvasId);
        } else {
            this.canvas = canvasId;
        }

        if (!this.canvas) {
            throw new Error(`Canvas element not found.`);
        }

        this.width = this.canvas.parentElement.clientWidth || window.innerWidth;
        this.height = this.canvas.parentElement.clientHeight || (window.innerHeight - 60);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f4f9);

        this.zoomFrustum = 2.4;
        this.minFrustum = 1.2;
        this.maxFrustum = 3.6;

        const aspect = this.width / this.height;
        this.camera = new THREE.OrthographicCamera(
            -this.zoomFrustum * aspect,
            this.zoomFrustum * aspect,
            this.zoomFrustum,
            -this.zoomFrustum,
            0.1,
            1000
        );

        this.defaultCameraPos = new THREE.Vector3(0, 3.2, 5.8);
        this.defaultLookAt = new THREE.Vector3(0, 0.75, 0);
        this.currentLookAtTarget = this.defaultLookAt.clone();

        this.camera.position.copy(this.defaultCameraPos);
        this.camera.lookAt(this.defaultLookAt);

        try {
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
                failIfMajorPerformanceCaveat: false
            });
        } catch (e1) {
            console.warn('Primary WebGL creation fallback:', e1);
            try {
                this.renderer = new THREE.WebGLRenderer({
                    canvas: this.canvas,
                    powerPreference: "default"
                });
            } catch (e2) {
                console.warn('Secondary WebGL creation fallback:', e2);
                this.renderer = new THREE.WebGLRenderer({
                    canvas: this.canvas
                });
            }
        }

        if (this.renderer) {
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.1;

            this.canvas.addEventListener('webglcontextlost', (event) => {
                event.preventDefault();
                console.warn('WebGL context lost. Waiting for restoration...');
            }, false);

            this.canvas.addEventListener('webglcontextrestored', () => {
                console.log('WebGL context restored!');
                if (this.renderer) {
                    this.onResize();
                }
            }, false);
        }

        this.setupLights();
        this.setupEnvironment();

        window.addEventListener('resize', () => this.onResize());

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY !== 0) {
                if (e.deltaY > 0) {
                    this.zoomOut();
                } else {
                    this.zoomIn();
                }
            }
        }, { passive: false });

        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.initPanEvents();

        this.updatables = [];
        this.initTargetGlowRing();

        setTimeout(() => this.onResize(), 100);
    }

    initPanEvents() {
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        window.addEventListener('pointermove', (e) => {
            if (this.isPanning) {
                const dx = (e.clientX - this.panStart.x) * 0.006 * (this.zoomFrustum / 2.4);
                const dy = (e.clientY - this.panStart.y) * 0.006 * (this.zoomFrustum / 2.4);

                this.camera.position.x = Math.max(-4.5, Math.min(4.5, this.camera.position.x - dx));
                this.camera.position.y = Math.max(1.0, Math.min(5.8, this.camera.position.y + dy));

                this.currentLookAtTarget.x = this.camera.position.x;
                this.currentLookAtTarget.y = this.camera.position.y - 2.45;
                this.camera.lookAt(this.currentLookAtTarget);

                this.panStart = { x: e.clientX, y: e.clientY };
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

    startPanning(clientX, clientY) {
        this.isPanning = true;
        this.panStart = { x: clientX, y: clientY };
        this.canvas.style.cursor = 'move';
    }

    initTargetGlowRing() {
        const ringGeo = new THREE.RingGeometry(0.38, 0.46, 36);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00a8d4,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });
        this.targetGlowMesh = new THREE.Mesh(ringGeo, ringMat);
        this.targetGlowMesh.rotation.x = -Math.PI / 2;
        this.targetGlowMesh.visible = false;
        this.scene.add(this.targetGlowMesh);

        const secRingMat = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });
        this.secondaryTargetGlowMesh = new THREE.Mesh(ringGeo, secRingMat);
        this.secondaryTargetGlowMesh.rotation.x = -Math.PI / 2;
        this.secondaryTargetGlowMesh.visible = false;
        this.scene.add(this.secondaryTargetGlowMesh);

        this.addUpdatable((delta, elapsedTime) => {
            if (this.targetGlowMesh && this.targetGlowMesh.visible) {
                const pulse = 1.0 + Math.sin(elapsedTime * 8) * 0.08;
                this.targetGlowMesh.scale.set(pulse, pulse, pulse);
            }
            if (this.secondaryTargetGlowMesh && this.secondaryTargetGlowMesh.visible) {
                const pulseSec = 1.0 + Math.cos(elapsedTime * 10) * 0.12;
                this.secondaryTargetGlowMesh.scale.set(pulseSec, pulseSec, pulseSec);
            }
        });
    }

    showTargetGlowAt(x, y, z) {
        if (this.targetGlowMesh) {
            this.targetGlowMesh.position.set(x, y + 0.01, z);
            this.targetGlowMesh.visible = true;
        }
    }

    showSecondaryTargetGlowAt(x, y, z) {
        if (this.secondaryTargetGlowMesh) {
            this.secondaryTargetGlowMesh.position.set(x, y + 0.01, z);
            this.secondaryTargetGlowMesh.visible = true;
        }
    }

    hideTargetGlow() {
        if (this.targetGlowMesh) {
            this.targetGlowMesh.visible = false;
        }
        if (this.secondaryTargetGlowMesh) {
            this.secondaryTargetGlowMesh.visible = false;
        }
    }

    focusCameraOn(targetPos) {
        const startTime = performance.now();
        const duration = 650;
        const startPos = this.camera.position.clone();
        const startFrustum = this.zoomFrustum;
        const targetFrustum = 0.95; // Dramatic 2.5x Close-Up Magnification

        const startLookAt = this.currentLookAtTarget ? this.currentLookAtTarget.clone() : this.defaultLookAt.clone();
        const targetLookAt = new THREE.Vector3(targetPos.x, targetPos.y + 0.6, targetPos.z);
        const endPos = new THREE.Vector3(targetPos.x, targetPos.y + 1.2, targetPos.z + 2.8);

        const animateCamera = (now) => {
            const prog = Math.min((now - startTime) / duration, 1);
            const ease = 0.5 - Math.cos(prog * Math.PI) / 2;

            this.camera.position.lerpVectors(startPos, endPos, ease);
            this.currentLookAtTarget.lerpVectors(startLookAt, targetLookAt, ease);
            this.camera.lookAt(this.currentLookAtTarget);

            this.zoomFrustum = startFrustum + ease * (targetFrustum - startFrustum);
            this.updateCameraFrustum();

            if (prog < 1) {
                requestAnimationFrame(animateCamera);
            }
        };
        requestAnimationFrame(animateCamera);
    }

    focusCameraOnFunnelTopView(targetPos) {
        const startTime = performance.now();
        const duration = 750;
        const startPos = this.camera.position.clone();
        const startFrustum = this.zoomFrustum;
        const targetFrustum = 0.85; // High 2.8x magnification top-down view into paper cone!

        const startLookAt = this.currentLookAtTarget ? this.currentLookAtTarget.clone() : this.defaultLookAt.clone();
        const targetLookAt = new THREE.Vector3(targetPos.x, targetPos.y + 0.35, targetPos.z);
        const endPos = new THREE.Vector3(targetPos.x + 0.25, targetPos.y + 2.2, targetPos.z + 1.25);

        const animateCamera = (now) => {
            const prog = Math.min((now - startTime) / duration, 1);
            const ease = 0.5 - Math.cos(prog * Math.PI) / 2;

            this.camera.position.lerpVectors(startPos, endPos, ease);
            this.currentLookAtTarget.lerpVectors(startLookAt, targetLookAt, ease);
            this.camera.lookAt(this.currentLookAtTarget);

            this.zoomFrustum = startFrustum + ease * (targetFrustum - startFrustum);
            this.updateCameraFrustum();

            if (prog < 1) {
                requestAnimationFrame(animateCamera);
            }
        };
        requestAnimationFrame(animateCamera);
    }

    resetCameraView() {
        const startTime = performance.now();
        const duration = 650;
        const startPos = this.camera.position.clone();
        const startFrustum = this.zoomFrustum;
        const targetFrustum = 2.4;

        const startLookAt = this.currentLookAtTarget.clone();
        const targetLookAt = this.defaultLookAt.clone();

        const animateReset = (now) => {
            const prog = Math.min((now - startTime) / duration, 1);
            const ease = 0.5 - Math.cos(prog * Math.PI) / 2;

            this.camera.position.lerpVectors(startPos, this.defaultCameraPos, ease);
            this.currentLookAtTarget.lerpVectors(startLookAt, targetLookAt, ease);
            this.camera.lookAt(this.currentLookAtTarget);

            this.zoomFrustum = startFrustum + ease * (targetFrustum - startFrustum);
            this.updateCameraFrustum();

            if (prog < 1) {
                requestAnimationFrame(animateReset);
            }
        };
        requestAnimationFrame(animateReset);
    }

    zoomIn() {
        this.zoomFrustum = Math.max(this.minFrustum, this.zoomFrustum - 0.25);
        this.updateCameraFrustum();
    }

    zoomOut() {
        this.zoomFrustum = Math.min(this.maxFrustum, this.zoomFrustum + 0.25);
        this.updateCameraFrustum();
    }

    updateCameraFrustum() {
        const aspect = this.width / this.height;
        this.camera.left = -this.zoomFrustum * aspect;
        this.camera.right = this.zoomFrustum * aspect;
        this.camera.top = this.zoomFrustum;
        this.camera.bottom = -this.zoomFrustum;
        this.camera.updateProjectionMatrix();
        this.camera.lookAt(this.currentLookAtTarget || this.defaultLookAt);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.35);
        dirLight.position.set(4, 10, 8);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.bias = -0.0005;
        this.scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0x00a8d4, 0.45);
        fillLight.position.set(-5, 4, 3);
        this.scene.add(fillLight);
    }

    createScientificGridTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f0f4f9';
        ctx.fillRect(0, 0, 256, 256);

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;

        for (let i = 0; i <= 256; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 256);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(256, i);
            ctx.stroke();
        }

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 256, 256);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(12, 6);
        return texture;
    }

    setupEnvironment() {
        // 1. Scientific Wall Grid
        const wallGeo = new THREE.PlaneGeometry(24, 12);
        const wallMat = new THREE.MeshBasicMaterial({ map: this.createScientificGridTexture() });
        const backWall = new THREE.Mesh(wallGeo, wallMat);
        backWall.position.set(0, 4, -2.5);
        this.scene.add(backWall);

        // 2. Marble Lab Table
        const tableGeo = new THREE.BoxGeometry(7.6, 0.22, 3.8);
        const tableMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.1,
            metalness: 0.05
        });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(0, -0.11, 0.2);
        table.receiveShadow = true;
        this.scene.add(table);

        const rimGeo = new THREE.BoxGeometry(7.62, 0.08, 0.06);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.3 });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.set(0, -0.02, 2.11);
        this.scene.add(rim);

        // 3. Top Materials Shelf (رف زجاجات الخامات العلوية)
        const matShelfGeo = new THREE.BoxGeometry(5.8, 0.08, 0.65);
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.35, metalness: 0.1 });
        const matShelf = new THREE.Mesh(matShelfGeo, shelfMat);
        matShelf.position.set(0, 2.1, -0.9);
        matShelf.castShadow = true;
        matShelf.receiveShadow = true;
        this.scene.add(matShelf);

        for (let xPos of [-2.3, 2.3]) {
            const bracketGeo = new THREE.BoxGeometry(0.1, 0.3, 0.5);
            const bracketMesh = new THREE.Mesh(bracketGeo, shelfMat);
            bracketMesh.position.set(xPos, 1.91, -0.9);
            this.scene.add(bracketMesh);
        }

        // 4. Tools Storage Shelf (رف الأدوات الجانبي المميز للمغناطيس، الموقد، والغربال)
        const toolShelfGeo = new THREE.BoxGeometry(2.8, 0.08, 0.65);
        const toolShelf = new THREE.Mesh(toolShelfGeo, shelfMat);
        toolShelf.position.set(2.0, 1.25, -0.9);
        toolShelf.castShadow = true;
        toolShelf.receiveShadow = true;
        this.scene.add(toolShelf);

        const toolBracket = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.5), shelfMat);
        toolBracket.position.set(3.2, 1.06, -0.9);
        this.scene.add(toolBracket);

        this.tableY = 0;
        this.shelfY = 2.14;
        this.toolShelfY = 1.29;
    }

    onResize() {
        if (!this.canvas || !this.canvas.parentElement) return;
        this.width = this.canvas.parentElement.clientWidth || window.innerWidth;
        this.height = this.canvas.parentElement.clientHeight || (window.innerHeight - 60);

        if (this.width > 0 && this.height > 0) {
            this.updateCameraFrustum();
            this.renderer.setSize(this.width, this.height);
        }
    }

    addUpdatable(fn) {
        this.updatables.push(fn);
    }

    startLoop() {
        const clock = new THREE.Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const elapsedTime = clock.getElapsedTime();

            for (const fn of this.updatables) {
                fn(delta, elapsedTime);
            }

            if (this.renderer && this.renderer.getContext() && !this.renderer.getContext().isContextLost()) {
                this.renderer.render(this.scene, this.camera);
            }
        };
        animate();
    }
}
