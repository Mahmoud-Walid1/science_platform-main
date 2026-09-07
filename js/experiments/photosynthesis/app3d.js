// js/experiments/photosynthesis/app.js - محرك المختبر ثلاثي الأبعاد الموحد (مطابق للمرجع LabXchange بالعربية)

// ══════════════════════════════════════════════════════════════
// 1. موديول إدارة المشهد (SceneManager)
// ══════════════════════════════════════════════════════════════
class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        if (!this.canvas) {
            throw new Error("Canvas element is required.");
        }

        this.width = this.canvas.parentElement.clientWidth || window.innerWidth;
        this.height = this.canvas.parentElement.clientHeight || (window.innerHeight - 60);

        // Create Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x003d52); // Deep solid teal background matching LabXchange reference

        // Camera Frustum & Zoom setup (Orthographic projection for crisp, undistorted lab layout)
        this.zoomFrustum = 1.75;
        this.minFrustum = 0.9;
        this.maxFrustum = 3.2;
        const aspect = this.width / this.height;
        this.camera = new THREE.OrthographicCamera(
            -this.zoomFrustum * aspect,
            this.zoomFrustum * aspect,
            this.zoomFrustum,
            -this.zoomFrustum,
            0.1,
            1000
        );

        // Camera position: positioned straight-on looking at center of workbench and shelves
        this.defaultCameraPos = new THREE.Vector3(0, 0.88, 5.0);
        this.defaultLookAt = new THREE.Vector3(0, 0.88, 0);
        this.currentLookAt = this.defaultLookAt.clone();

        this.camera.position.copy(this.defaultCameraPos);
        this.camera.lookAt(this.defaultLookAt);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;

        // Lighting
        this.setupLights();

        // Lab Room Backdrop / Floor / Workbench / Shelves
        this.setupEnvironment();

        // Resize handler
        window.addEventListener('resize', () => this.onResize());

        // Mouse zoom handler
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomDelta = e.deltaY * 0.0015;
            this.zoomFrustum = Math.max(this.minFrustum, Math.min(this.maxFrustum, this.zoomFrustum + zoomDelta));
            this.onResize();
            this.checkCameraPanButton();
        }, { passive: false });

        // Panning system
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.initPanEvents();

        this.updatables = [];
        this.clock = new THREE.Clock();

        this.initTargetGlowRing();
        this.initFloatingLabels();

        setTimeout(() => this.onResize(), 100);
    }

    initFloatingLabels() {
        // Inject floating labels style
        const style = document.createElement('style');
        style.innerHTML = `
            .floating-label {
                position: absolute;
                transform: translate(-50%, -100%);
                background: #0f3d54;
                border: 1px solid #1c5f82;
                color: #ffffff;
                padding: 3px 8px;
                border-radius: 5px;
                font-size: 11px;
                font-weight: 700;
                font-family: 'Cairo', sans-serif;
                pointer-events: none;
                white-space: nowrap;
                z-index: 10;
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
                direction: rtl;
                transition: opacity 0.15s ease, transform 0.15s ease;
                letter-spacing: 0.2px;
            }
            .floating-label::after {
                content: '';
                position: absolute;
                bottom: -5px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 5px 5px 0;
                border-style: solid;
                border-color: #0f3d54 transparent transparent transparent;
                display: block;
                width: 0;
            }
            .floating-label.vertical-label {
                transform: translate(-50%, -100%);
                writing-mode: vertical-rl;
                transform: rotate(180deg) translate(50%, 0);
                padding: 6px 3px;
                font-size: 10.5px;
            }
            .floating-label.vertical-label::after {
                display: none;
            }
        `;
        document.head.appendChild(style);

        // Create container for floating labels
        const labelsContainer = document.createElement('div');
        labelsContainer.style.position = 'absolute';
        labelsContainer.style.top = '0';
        labelsContainer.style.left = '0';
        labelsContainer.style.width = '100%';
        labelsContainer.style.height = '100%';
        labelsContainer.style.pointerEvents = 'none';
        labelsContainer.style.overflow = 'hidden';
        labelsContainer.style.zIndex = '20';
        this.canvas.parentElement.appendChild(labelsContainer);

        // Precision-mapped 3D labels matching LabXchange reference layout
        this.labelsData = [
            { id: 'lbl-stoppers', text: 'سدادة', pos: new THREE.Vector3(-3.4, 1.95, -0.85) },
            { id: 'lbl-lids', text: 'غطاء', pos: new THREE.Vector3(-3.4, 1.55, -0.85) },
            { id: 'lbl-tank', text: 'حوض الإيلوديا', pos: new THREE.Vector3(-2.15, 1.95, -0.85) },
            { id: 'lbl-box1', text: 'صندوق', pos: new THREE.Vector3(-1.15, 2.05, -0.85) },
            { id: 'lbl-box2', text: 'صندوق', pos: new THREE.Vector3(-0.82, 1.98, -0.85) },
            { id: 'lbl-ph-poster', text: 'لوحة مقياس الأس الهيدروجيني (pH)', pos: new THREE.Vector3(1.5, 2.52, -1.4) },
            { id: 'lbl-setup-poster', text: 'مخطط إعداد التجربة', pos: new THREE.Vector3(-0.4, 1.25, -1.4) },
            { id: 'lbl-switch', text: 'مفتاح الإضاءة', pos: new THREE.Vector3(-2.9, 1.05, -1.4) },
            { id: 'lbl-tube1', text: 'أنبوب 1', pos: new THREE.Vector3(-3.7, 0.72, 0.0) },
            { id: 'lbl-tube2', text: 'أنبوب 2', pos: new THREE.Vector3(-3.2, 0.72, 0.0) },
            { id: 'lbl-tube3', text: 'أنبوب 3', pos: new THREE.Vector3(-2.6, 0.72, 0.0) },
            { id: 'lbl-tube4', text: 'أنبوب 4', pos: new THREE.Vector3(-2.1, 0.72, 0.0) },
            { id: 'lbl-pipette', text: 'ماصة P1000', pos: new THREE.Vector3(-1.35, 0.88, 0.0) },
            { id: 'lbl-tips', text: 'رؤوس الماصة P1000', pos: new THREE.Vector3(-0.55, 0.38, 0.0) },
            { id: 'lbl-trash', text: 'المهملات', pos: new THREE.Vector3(0.1, 0.32, 0.0) },
            { id: 'lbl-cuv-blank', text: 'كيوفيت ضابطة', pos: new THREE.Vector3(0.65, 0.58, 0.0), isVertical: true },
            { id: 'lbl-cuv-1', text: 'كيوفيت 1', pos: new THREE.Vector3(0.83, 0.58, 0.0), isVertical: true },
            { id: 'lbl-cuv-2', text: 'كيوفيت 2', pos: new THREE.Vector3(1.01, 0.58, 0.0), isVertical: true },
            { id: 'lbl-cuv-3', text: 'كيوفيت 3', pos: new THREE.Vector3(1.19, 0.58, 0.0), isVertical: true },
            { id: 'lbl-cuv-4', text: 'كيوفيت 4', pos: new THREE.Vector3(1.37, 0.58, 0.0), isVertical: true },
            { id: 'lbl-spec', text: 'جهاز مطياف الضوء', pos: new THREE.Vector3(2.45, 0.55, 0.0) }
        ];

        const labelElements = [];
        this.labelsData.forEach(data => {
            const div = document.createElement('div');
            div.className = 'floating-label' + (data.isVertical ? ' vertical-label' : '');
            div.textContent = data.text;
            labelsContainer.appendChild(div);
            labelElements.push({ div, data });
        });

        this.addUpdatable(() => {
            const tempV = new THREE.Vector3();
            const width = this.width;
            const height = this.height;

            labelElements.forEach(item => {
                tempV.copy(item.data.pos);
                tempV.project(this.camera);

                // Hide labels if camera culled or behind
                if (tempV.z > 1.0) {
                    item.div.style.display = 'none';
                    return;
                }

                item.div.style.display = 'block';
                const x = (tempV.x * 0.5 + 0.5) * width;
                const y = (tempV.y * -0.5 + 0.5) * height;

                item.div.style.left = `${x}px`;
                item.div.style.top = `${y}px`;
            });
        });
    }

    setupLights() {
        // Balanced ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
        this.scene.add(ambientLight);

        // Key overhead directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.25);
        mainLight.position.set(2, 8, 6);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.bias = -0.0005;
        this.scene.add(mainLight);

        // Soft fill light
        const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.5);
        fillLight.position.set(-4, 4, 3);
        this.scene.add(fillLight);
    }

    setupEnvironment() {
        // 1. Solid Back Wall (Matches LabXchange deep teal `#003d52`)
        const wallGeo = new THREE.PlaneGeometry(24, 14);
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x003d52,
            roughness: 0.95,
            metalness: 0.0
        });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(0, 1.5, -1.5);
        this.scene.add(wall);

        // 2. Long Upper Wall Shelf (Running horizontally across the entire upper scene)
        const shelfGroup = new THREE.Group();
        shelfGroup.position.set(0, 1.32, -0.9);

        // Main shelf board (Dark teal-grey)
        const shelfGeo = new THREE.BoxGeometry(10.5, 0.04, 0.65);
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x1e3a47, roughness: 0.4, metalness: 0.2 });
        const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
        shelfMesh.receiveShadow = true;
        shelfGroup.add(shelfMesh);

        // Shelf highlighted front lip
        const shelfLipGeo = new THREE.BoxGeometry(10.52, 0.025, 0.02);
        const shelfLipMat = new THREE.MeshStandardMaterial({ color: 0x386d85, roughness: 0.3 });
        const shelfLip = new THREE.Mesh(shelfLipGeo, shelfLipMat);
        shelfLip.position.set(0, 0.015, 0.325);
        shelfGroup.add(shelfLip);

        // Sleek metallic wall support brackets under shelf
        [-3.8, -1.8, 0.5, 2.8].forEach(xPos => {
            const bGeo = new THREE.BoxGeometry(0.04, 0.25, 0.45);
            const bMesh = new THREE.Mesh(bGeo, new THREE.MeshStandardMaterial({ color: 0x2c4a57, metalness: 0.7, roughness: 0.3 }));
            bMesh.position.set(xPos, -0.125, 0.05);
            shelfGroup.add(bMesh);
        });

        this.scene.add(shelfGroup);

        // 3. Lower Lab Workbench & Cabinet Unit (Extends down to fill bottom of viewport completely)
        const benchGroup = new THREE.Group();
        benchGroup.position.set(0, 0.0, 0.0);

        // Countertop Surface (Light blue-gray bevel matching reference image)
        const counterTopGeo = new THREE.BoxGeometry(11.0, 0.08, 1.8);
        const counterTopMat = new THREE.MeshStandardMaterial({
            color: 0xaec3ce,
            roughness: 0.25,
            metalness: 0.1
        });
        const counterTop = new THREE.Mesh(counterTopGeo, counterTopMat);
        counterTop.position.set(0, -0.04, 0.0);
        counterTop.receiveShadow = true;
        benchGroup.add(counterTop);

        // Countertop Top Highlight Edge
        const counterLipGeo = new THREE.BoxGeometry(11.02, 0.03, 0.04);
        const counterLipMat = new THREE.MeshStandardMaterial({ color: 0xd9e6ed });
        const counterLip = new THREE.Mesh(counterLipGeo, counterLipMat);
        counterLip.position.set(0, -0.015, 0.9);
        benchGroup.add(counterLip);

        // Lower Cabinet Facia (Spans from y = -0.08 down to -2.5 to completely eliminate floating voids)
        const cabinetGeo = new THREE.BoxGeometry(10.8, 2.5, 1.7);
        const cabinetMat = new THREE.MeshStandardMaterial({
            color: 0x6e8a9c,
            roughness: 0.5,
            metalness: 0.05
        });
        const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
        cabinet.position.set(0, -1.33, -0.02);
        cabinet.receiveShadow = true;
        benchGroup.add(cabinet);

        // Cabinet Drawers, Seams, and Metallic Handles for visual authenticity
        const drawerCols = [-4.0, -1.8, 0.8, 3.4];
        drawerCols.forEach(x => {
            // Horizontal drawer handle
            const handleGeo = new THREE.BoxGeometry(0.4, 0.04, 0.05);
            const handleMat = new THREE.MeshStandardMaterial({ color: 0xdeeaef, metalness: 0.85, roughness: 0.2 });
            const handle = new THREE.Mesh(handleGeo, handleMat);
            handle.position.set(x, -0.22, 0.86);
            benchGroup.add(handle);

            // Subtle drawer division groove
            const seamGeo = new THREE.BoxGeometry(0.02, 0.45, 0.02);
            const seamMat = new THREE.MeshStandardMaterial({ color: 0x486474 });
            const seam = new THREE.Mesh(seamGeo, seamMat);
            seam.position.set(x + 1.2, -0.25, 0.84);
            benchGroup.add(seam);
        });

        // Horizontal divider groove across cabinets
        const hSeamGeo = new THREE.BoxGeometry(10.78, 0.02, 0.02);
        const hSeamMat = new THREE.MeshStandardMaterial({ color: 0x486474 });
        const hSeam = new THREE.Mesh(hSeamGeo, hSeamMat);
        hSeam.position.set(0, -0.48, 0.84);
        benchGroup.add(hSeam);

        this.scene.add(benchGroup);
    }

    initTargetGlowRing() {
        const ringGeo = new THREE.RingGeometry(0.18, 0.24, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        this.targetGlowMesh = new THREE.Mesh(ringGeo, ringMat);
        this.targetGlowMesh.rotation.x = -Math.PI / 2;
        this.targetGlowMesh.visible = false;
        this.scene.add(this.targetGlowMesh);

        const secRingMat = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        this.secondaryTargetGlowMesh = new THREE.Mesh(ringGeo, secRingMat);
        this.secondaryTargetGlowMesh.rotation.x = -Math.PI / 2;
        this.secondaryTargetGlowMesh.visible = false;
        this.scene.add(this.secondaryTargetGlowMesh);

        this.addUpdatable((delta, elapsedTime) => {
            if (this.targetGlowMesh && this.targetGlowMesh.visible) {
                const pulse = 1.0 + Math.sin(elapsedTime * 8) * 0.12;
                this.targetGlowMesh.scale.set(pulse, pulse, pulse);
            }
            if (this.secondaryTargetGlowMesh && this.secondaryTargetGlowMesh.visible) {
                const pulseSec = 1.0 + Math.cos(elapsedTime * 10) * 0.15;
                this.secondaryTargetGlowMesh.scale.set(pulseSec, pulseSec, pulseSec);
            }
        });
    }

    addUpdatable(callback) {
        this.updatables.push(callback);
    }

    startLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            const delta = this.clock.getDelta();
            const elapsedTime = this.clock.getElapsedTime();
            this.updatables.forEach(upd => upd(delta, elapsedTime));
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }

    onResize() {
        this.width = this.canvas.parentElement.clientWidth || window.innerWidth;
        this.height = this.canvas.parentElement.clientHeight || (window.innerHeight - 60);
        const aspect = this.width / this.height;
        
        // Dynamically adjust zoomFrustum so the entire lab bench and upper shelf comfortably fit
        this.zoomFrustum = Math.max(1.4, Math.min(2.8, 3.1 / aspect));

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
        this.camera.position.copy(this.defaultCameraPos);
        this.camera.lookAt(this.defaultLookAt);
        this.currentLookAt.copy(this.defaultLookAt);
        this.zoomFrustum = 1.75;
        this.onResize();
        this.checkCameraPanButton();
    }

    checkCameraPanButton() {
        const btn = document.getElementById('btnResetCamera');
        if (btn) {
            const isPanned = this.camera.position.distanceTo(this.defaultCameraPos) > 0.1;
            const isZoomed = Math.abs(this.zoomFrustum - 1.75) > 0.05;
            btn.style.display = (isPanned || isZoomed) ? 'flex' : 'none';
        }
    }

    initPanEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            // Pan with right mouse button or when clicking empty canvas
            if (e.button === 2 || e.altKey) {
                this.isPanning = true;
                this.panStart.x = e.clientX;
                this.panStart.y = e.clientY;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                const deltaX = (e.clientX - this.panStart.x) * (this.zoomFrustum * 0.0035);
                const deltaY = (e.clientY - this.panStart.y) * (this.zoomFrustum * 0.0035);

                this.camera.position.x -= deltaX;
                this.camera.position.y += deltaY;
                this.currentLookAt.x -= deltaX;
                this.currentLookAt.y += deltaY;
                this.camera.lookAt(this.currentLookAt);

                this.panStart.x = e.clientX;
                this.panStart.y = e.clientY;
                this.checkCameraPanButton();
            }
        });

        window.addEventListener('mouseup', () => {
            this.isPanning = false;
        });

        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }
}

// ══════════════════════════════════════════════════════════════
// 2. موديول بناء أدوات ومعدات المختبر (LabSetup)
// ══════════════════════════════════════════════════════════════
class LabSetup {
    constructor(scene) {
        this.scene = scene;

        this.interactiveObjects = [];
        this.tubes = [];
        this.stoppers = [];
        this.boxes = [];
        this.cuvettes = [];
        this.cuvetteLids = [];
        this.plantsInTank = [];
        this.lamps = [];
        
        this.materials = {};
        this.initMaterials();

        // Build all items exactly matching the LabXchange layout blueprint
        this.buildPosters();
        this.buildStopperAndLidShelfRack();
        this.buildElodeaTank();
        this.buildLightBlockingBoxes();
        this.buildLampsAndSwitch();
        this.buildTestTubes();
        this.buildPipetteAndTips();
        this.buildTrash();
        this.buildCuvetteRackAndCuvettes();
        this.buildSpectrophotometer();
    }

    initMaterials() {
        this.materials.glass = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.05,
            metalness: 0.1,
            transmission: 0.95,
            ior: 1.5,
            thickness: 0.05,
            side: THREE.DoubleSide
        });

        this.materials.water = new THREE.MeshPhysicalMaterial({
            color: 0xbbe8f5,
            transparent: true,
            opacity: 0.45,
            roughness: 0.1,
            metalness: 0.0,
            transmission: 0.85,
            ior: 1.33
        });

        this.materials.btbGreen = new THREE.MeshStandardMaterial({
            color: 0x15803d, // Rich forest green (neutral BTB pH ~7.0)
            roughness: 0.15,
            transparent: true,
            opacity: 0.9
        });

        this.materials.btbBlue = new THREE.MeshStandardMaterial({
            color: 0x1d4ed8, // Deep blue (basic BTB pH ~7.8+)
            roughness: 0.15,
            transparent: true,
            opacity: 0.9
        });

        this.materials.btbYellow = new THREE.MeshStandardMaterial({
            color: 0xca8a04, // Golden yellow (acidic BTB pH ~6.2)
            roughness: 0.15,
            transparent: true,
            opacity: 0.9
        });

        this.materials.rubber = new THREE.MeshStandardMaterial({
            color: 0xc89658, // Warm tan rubber stopper matching reference image
            roughness: 0.85,
            metalness: 0.0
        });

        this.materials.cardboard = new THREE.MeshStandardMaterial({
            color: 0x966432, // Cardboard brown matching reference boxes
            roughness: 0.85,
            metalness: 0.0
        });

        this.materials.cardboardDark = new THREE.MeshStandardMaterial({
            color: 0x6e4722,
            roughness: 0.9
        });

        this.materials.leaf = new THREE.MeshStandardMaterial({
            color: 0x16a34a,
            roughness: 0.6
        });
    }

    buildPosters() {
        // 1. pH Scale Poster (Mounted on wall at top right: x = 1.5, y = 2.1, z = -1.45)
        const posterGeo = new THREE.PlaneGeometry(2.3, 0.8);
        const canvas = document.createElement('canvas');
        canvas.width = 1600;
        canvas.height = 560;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1600, 560);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 1592, 552);

        // Poster Title
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 34px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText('مقياس الأس الهيدروجيني لكاشف بروموثيمول الأزرق (pH scale poster)', 800, 65);

        // 13 pH colored circles
        const phColors = [
            { val: '2.0', col: '#facc15' },
            { val: '6.0', col: '#eab308' },
            { val: '6.1', col: '#d97706' },
            { val: '6.3', col: '#a3e635' },
            { val: '6.5', col: '#84cc16' },
            { val: '6.7', col: '#22c55e' },
            { val: '6.9', col: '#16a34a' },
            { val: '7.1', col: '#0d9488' },
            { val: '7.3', col: '#06b6d4' },
            { val: '7.5', col: '#3b82f6' },
            { val: '7.7', col: '#2563eb' },
            { val: '8.0', col: '#1d4ed8' },
            { val: '12.0', col: '#6b21a8' }
        ];

        const startX = 130;
        const spacing = 112;
        const cy = 215;
        const r = 38;

        // Inner frame
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.fillRect(startX - 60, cy - 65, spacing * 12 + 120, 140);
        ctx.strokeRect(startX - 60, cy - 65, spacing * 12 + 120, 140);

        phColors.forEach((item, idx) => {
            const cx = startX + idx * spacing;
            
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = item.col;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#334155';
            ctx.stroke();

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 22px Cairo';
            ctx.fillText(item.val, cx, cy + 78);
        });

        // Ideal pH range banner
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(startX + 10, cy + 130, spacing * 10 - 20, 48);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX + 10, cy + 130, spacing * 10 - 20, 48);
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px Cairo';
        ctx.fillText('المدى المثالي لنشاط كاشف BTB: 6.0 - 7.6 (Ideal pH range for BTB)', 800, cy + 162);

        const posterTex = new THREE.CanvasTexture(canvas);
        posterTex.minFilter = THREE.LinearFilter;
        const posterMat = new THREE.MeshBasicMaterial({ map: posterTex });
        const posterMesh = new THREE.Mesh(posterGeo, posterMat);
        posterMesh.position.set(1.5, 2.1, -1.45);
        this.scene.add(posterMesh);

        // 2. Experimental Setup Poster (Mounted on wall under shelf at x = -0.4, y = 0.8, z = -1.45)
        const setupGeo = new THREE.PlaneGeometry(1.2, 0.72);
        const setupCanvas = document.createElement('canvas');
        setupCanvas.width = 900;
        setupCanvas.height = 540;
        const sCtx = setupCanvas.getContext('2d');

        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0, 0, 900, 540);
        sCtx.strokeStyle = '#15803d';
        sCtx.lineWidth = 8;
        sCtx.strokeRect(4, 4, 892, 532);

        sCtx.fillStyle = '#14532d';
        sCtx.font = 'bold 28px Cairo';
        sCtx.textAlign = 'center';
        sCtx.fillText('مخطط توزيع وإعداد أنابيب التجربة', 450, 48);

        // 4 schematic test tubes side by side matching reference poster
        const tubeWidth = 55;
        const tubeHeight = 190;
        const tubeY = 160;
        const gap = 180;

        for (let i = 0; i < 4; i++) {
            const tx = 180 + i * gap;

            // Sun/Light icon for tubes 1 and 2
            if (i === 0 || i === 1) {
                sCtx.beginPath();
                sCtx.arc(tx, tubeY - 50, 16, 0, Math.PI * 2);
                sCtx.fillStyle = '#fef08a';
                sCtx.fill();
                sCtx.strokeStyle = '#ca8a04';
                sCtx.lineWidth = 2.5;
                sCtx.stroke();
            } else {
                // Dark box outline for tubes 3 and 4
                sCtx.fillStyle = '#78350f';
                sCtx.fillRect(tx - 35, tubeY - 65, 70, 30);
                sCtx.fillStyle = '#ffffff';
                sCtx.font = 'bold 15px Cairo';
                sCtx.fillText('حجب ضوء', tx, tubeY - 44);
            }

            // Glass Tube outline
            sCtx.strokeStyle = '#94a3b8';
            sCtx.lineWidth = 4;
            sCtx.beginPath();
            sCtx.moveTo(tx - tubeWidth/2, tubeY);
            sCtx.lineTo(tx - tubeWidth/2, tubeY + tubeHeight - tubeWidth/2);
            sCtx.arc(tx, tubeY + tubeHeight - tubeWidth/2, tubeWidth/2, Math.PI, 0, true);
            sCtx.lineTo(tx + tubeWidth/2, tubeY);
            sCtx.stroke();

            // Liquid fill
            sCtx.fillStyle = '#10b981';
            sCtx.beginPath();
            sCtx.moveTo(tx - tubeWidth/2 + 3, tubeY + 50);
            sCtx.lineTo(tx - tubeWidth/2 + 3, tubeY + tubeHeight - tubeWidth/2);
            sCtx.arc(tx, tubeY + tubeHeight - tubeWidth/2, tubeWidth/2 - 3, Math.PI, 0, true);
            sCtx.lineTo(tx + tubeWidth/2 - 3, tubeY + 50);
            sCtx.closePath();
            sCtx.fill();

            // Plant stem in tubes 2 and 3
            if (i === 1 || i === 2) {
                sCtx.strokeStyle = '#166534';
                sCtx.lineWidth = 6;
                sCtx.beginPath();
                sCtx.moveTo(tx, tubeY + 60);
                sCtx.lineTo(tx, tubeY + tubeHeight - 15);
                sCtx.stroke();

                sCtx.fillStyle = '#15803d';
                sCtx.beginPath();
                sCtx.arc(tx - 10, tubeY + 90, 7, 0, Math.PI * 2);
                sCtx.arc(tx + 10, tubeY + 115, 7, 0, Math.PI * 2);
                sCtx.arc(tx - 10, tubeY + 140, 7, 0, Math.PI * 2);
                sCtx.fill();
            }

            // Stopper on top
            sCtx.fillStyle = '#c89658';
            sCtx.fillRect(tx - tubeWidth/2 - 2, tubeY - 12, tubeWidth + 4, 16);

            // Tube number
            sCtx.fillStyle = '#0f172a';
            sCtx.font = 'bold 22px Cairo';
            sCtx.fillText(`${i + 1}`, tx, tubeY + tubeHeight + 40);

            // Box enclosure for tubes 3 and 4
            if (i === 2 || i === 3) {
                sCtx.strokeStyle = '#78350f';
                sCtx.lineWidth = 3;
                sCtx.setLineDash([5, 5]);
                sCtx.strokeRect(tx - tubeWidth/2 - 12, tubeY - 8, tubeWidth + 24, tubeHeight + 12);
                sCtx.setLineDash([]);
            }
        }

        const setupTex = new THREE.CanvasTexture(setupCanvas);
        setupTex.minFilter = THREE.LinearFilter;
        const setupMat = new THREE.MeshBasicMaterial({ map: setupTex });
        const setupMesh = new THREE.Mesh(setupGeo, setupMat);
        setupMesh.position.set(-0.4, 0.8, -1.45);
        this.scene.add(setupMesh);
    }

    buildStopperAndLidShelfRack() {
        // Shelf rack sitting on left shelf at x = -3.4, y = 1.34, z = -0.9
        const rackGroup = new THREE.Group();
        rackGroup.position.set(-3.4, 1.34, -0.9);

        const frameMat = new THREE.MeshStandardMaterial({ color: 0x1f3c4d, roughness: 0.5 });
        
        // Base plate
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.35), frameMat);
        base.position.y = 0.015;
        rackGroup.add(base);

        // Middle divider shelf
        const midShelf = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.025, 0.35), frameMat);
        midShelf.position.y = 0.3;
        rackGroup.add(midShelf);

        // Top plate
        const topPlate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.025, 0.35), frameMat);
        topPlate.position.y = 0.6;
        rackGroup.add(topPlate);

        // Side pillars & middle separator
        [-0.43, -0.15, 0.15, 0.43].forEach(x => {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.6, 0.35), frameMat);
            p.position.set(x, 0.3, 0);
            rackGroup.add(p);
        });

        this.scene.add(rackGroup);

        // 4 Rubber Stoppers on Top Tier (y = 1.68)
        const stopperOffsets = [-0.3, -0.1, 0.1, 0.3];
        stopperOffsets.forEach((xOffset, idx) => {
            const stopperGroup = new THREE.Group();
            stopperGroup.name = `stopper_${idx + 1}`;
            stopperGroup.userData = {
                type: 'stopper_draggable',
                index: idx + 1,
                isDragging: false,
                homePosition: new THREE.Vector3(rackGroup.position.x + xOffset, 1.68, -0.85),
                pluggedTubeIndex: null
            };

            const stopperGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.12, 16);
            const stopper = new THREE.Mesh(stopperGeo, this.materials.rubber);
            stopper.position.y = 0.06;
            stopper.castShadow = true;
            stopperGroup.add(stopper);

            stopperGroup.position.copy(stopperGroup.userData.homePosition);
            this.scene.add(stopperGroup);
            this.interactiveObjects.push(stopperGroup);
            this.stoppers.push(stopperGroup);
        });

        // 4 Cuvette Lids/Caps on Bottom Tier (y = 1.37)
        stopperOffsets.forEach((xOffset, idx) => {
            const capGroup = new THREE.Group();
            capGroup.name = `cuv_cap_${idx + 1}`;
            capGroup.userData = {
                type: 'cap_draggable',
                index: idx + 1,
                isDragging: false,
                homePosition: new THREE.Vector3(rackGroup.position.x + xOffset, 1.37, -0.85),
                cappedCuvetteId: null
            };

            const capGeo = new THREE.BoxGeometry(0.1, 0.035, 0.1);
            const capMesh = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }));
            capMesh.position.y = 0.018;
            capGroup.add(capMesh);

            capGroup.position.copy(capGroup.userData.homePosition);
            this.scene.add(capGroup);
            this.interactiveObjects.push(capGroup);
            this.cuvetteLids.push(capGroup);
        });
    }

    buildElodeaTank() {
        // Clear Aquarium on Upper Shelf at x = -2.15, y = 1.34, z = -0.9
        const tankGroup = new THREE.Group();
        tankGroup.position.set(-2.15, 1.34, -0.9);

        // Glass tank box
        const tankGeo = new THREE.BoxGeometry(0.85, 0.65, 0.4);
        const tankMesh = new THREE.Mesh(tankGeo, this.materials.glass);
        tankMesh.position.y = 0.325;
        tankMesh.castShadow = true;
        tankGroup.add(tankMesh);

        // Blue tinted water
        const waterGeo = new THREE.BoxGeometry(0.81, 0.58, 0.36);
        const waterMesh = new THREE.Mesh(waterGeo, this.materials.water);
        waterMesh.position.y = 0.29;
        tankGroup.add(waterMesh);

        // Bottom Gravel / Pebble bed
        const gravelGeo = new THREE.BoxGeometry(0.81, 0.06, 0.36);
        const gravelMat = new THREE.MeshStandardMaterial({ color: 0xd4b996, roughness: 0.9 });
        const gravelMesh = new THREE.Mesh(gravelGeo, gravelMat);
        gravelMesh.position.y = 0.03;
        tankGroup.add(gravelMesh);

        // Tiny multi-colored pebbles on gravel
        for (let i = 0; i < 20; i++) {
            const pebbleGeo = new THREE.SphereGeometry(0.015, 6, 6);
            const pColors = [0x94a3b8, 0x475569, 0xb45309, 0x059669];
            const pebbleMat = new THREE.MeshStandardMaterial({ color: pColors[i % 4], roughness: 0.8 });
            const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
            pebble.position.set(
                (Math.random() - 0.5) * 0.75,
                0.06 + Math.random() * 0.01,
                (Math.random() - 0.5) * 0.3
            );
            tankGroup.add(pebble);
        }

        this.scene.add(tankGroup);

        // 2 Draggable Elodea Plants inside the tank
        const plantPositions = [
            { x: -0.15, z: 0.0 },
            { x: 0.15, z: 0.0 }
        ];

        plantPositions.forEach((pos, idx) => {
            const plantGroup = new THREE.Group();
            plantGroup.name = `draggable_plant_${idx + 1}`;
            plantGroup.userData = {
                type: 'plant_draggable',
                index: idx + 1,
                isDragging: false,
                homePosition: new THREE.Vector3(tankGroup.position.x + pos.x, 1.38, tankGroup.position.z + pos.z),
                placedInTube: null
            };

            this.create3DPlantMesh(plantGroup);
            plantGroup.position.copy(plantGroup.userData.homePosition);
            this.scene.add(plantGroup);
            this.interactiveObjects.push(plantGroup);
            this.plantsInTank.push(plantGroup);
        });

        // Background decorative plant in middle of tank
        const decPlant = new THREE.Group();
        this.create3DPlantMesh(decPlant);
        decPlant.position.set(tankGroup.position.x, 1.38, tankGroup.position.z - 0.08);
        this.scene.add(decPlant);
    }

    create3DPlantMesh(group) {
        const stemGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.48, 8);
        const stemMesh = new THREE.Mesh(stemGeo, this.materials.leaf);
        stemMesh.position.y = 0.24;
        group.add(stemMesh);

        for (let y = 0.06; y <= 0.44; y += 0.045) {
            const rotY = (y * 15);
            for (let i = 0; i < 3; i++) {
                const leafGeo = new THREE.ConeGeometry(0.025, 0.09, 4);
                const leafMesh = new THREE.Mesh(leafGeo, this.materials.leaf);
                leafMesh.rotation.x = Math.PI / 3.2;
                leafMesh.rotation.y = rotY + (i * Math.PI * 2) / 3;
                leafMesh.position.set(0, y, 0);
                group.add(leafMesh);
            }
        }
    }

    buildLightBlockingBoxes() {
        // Two Tall Cardboard Boxes standing upright on the upper shelf beside the aquarium
        const boxConfigs = [
            { x: -1.15, height: 0.82, width: 0.28 },
            { x: -0.82, height: 0.76, width: 0.28 }
        ];

        boxConfigs.forEach((cfg, idx) => {
            const boxGroup = new THREE.Group();
            boxGroup.name = `box_${idx + 1}`;
            boxGroup.userData = {
                type: 'box_draggable',
                index: idx + 1,
                isDragging: false,
                homePosition: new THREE.Vector3(cfg.x, 1.34, -0.85),
                coveringTubeIndex: null
            };

            const boxGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.width);
            const boxMesh = new THREE.Mesh(boxGeo, this.materials.cardboard);
            boxMesh.position.y = cfg.height / 2;
            boxMesh.castShadow = true;
            boxMesh.receiveShadow = true;
            boxGroup.add(boxMesh);

            // Darker top cap/fold
            const topGeo = new THREE.BoxGeometry(cfg.width + 0.01, 0.06, cfg.width + 0.01);
            const topMesh = new THREE.Mesh(topGeo, this.materials.cardboardDark);
            topMesh.position.y = cfg.height - 0.03;
            boxGroup.add(topMesh);

            boxGroup.position.copy(boxGroup.userData.homePosition);
            this.scene.add(boxGroup);
            this.interactiveObjects.push(boxGroup);
            this.boxes.push(boxGroup);
        });
    }

    buildLampsAndSwitch() {
        // Two Dome Lamps hanging vertically under the shelf above test tubes
        const lampPositions = [-3.45, -2.35];

        lampPositions.forEach((xPos, idx) => {
            const lampGroup = new THREE.Group();
            lampGroup.name = `lamp_${idx + 1}`;

            // Clean white cord hanging straight down from shelf at y = 1.32 to y = 0.65
            const cordGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.67, 8);
            const cordMesh = new THREE.Mesh(cordGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
            cordMesh.position.set(xPos, 0.985, -0.1);
            this.scene.add(cordMesh);

            // White dome lamp shade
            const shadeGeo = new THREE.CylinderGeometry(0.08, 0.22, 0.24, 24);
            const shadeMesh = new THREE.Mesh(shadeGeo, new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.1, roughness: 0.2 }));
            shadeMesh.position.set(xPos, 0.65, -0.1);
            shadeMesh.castShadow = true;
            this.scene.add(shadeMesh);

            // Glass bulb inside shade
            const bulbGeo = new THREE.SphereGeometry(0.06, 16, 16);
            const bulbMat = new THREE.MeshStandardMaterial({
                color: 0xe2e8f0,
                emissive: 0x000000,
                roughness: 0.1
            });
            const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
            bulbMesh.position.set(xPos, 0.58, -0.1);
            this.scene.add(bulbMesh);

            // Conical light glow down onto the tubes
            const spotLight = new THREE.SpotLight(0xfffbeb, 0, 3.5, Math.PI / 4, 0.5, 1);
            spotLight.position.set(xPos, 0.55, -0.1);
            spotLight.target.position.set(xPos, 0.0, 0.0);
            this.scene.add(spotLight.target);
            this.scene.add(spotLight);

            this.lamps.push({
                group: lampGroup,
                bulbMat: bulbMat,
                light: spotLight,
                isOn: false
            });
        });

        // Wall Light Switch (Mounted between the two lamps at x = -2.9, y = 0.8, z = -1.45)
        const switchBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.26, 0.03),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
        );
        switchBase.position.set(-2.9, 0.8, -1.45);
        this.scene.add(switchBase);

        // Switch Toggle Rocker
        const rockerMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });
        const rocker = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.04), rockerMat);
        rocker.position.set(-2.9, 0.8, -1.42);
        rocker.name = "btn_lamps_switch";
        rocker.userData = { type: 'lamp_switch' };
        this.scene.add(rocker);
        this.interactiveObjects.push(rocker);
    }

    buildTestTubes() {
        // 4 Test Tubes standing on the table in a row under the lamps
        const tubePositions = [-3.7, -3.2, -2.6, -2.1];

        tubePositions.forEach((xPos, idx) => {
            const tubeGroup = new THREE.Group();
            tubeGroup.name = `tube_${idx + 1}`;
            tubeGroup.userData = {
                type: 'tube_object',
                index: idx + 1,
                hasPlant: false,
                hasStopper: false,
                hasBox: false,
                phValue: 7.0,
                isLiquidDispensed: false
            };

            // Glass Cylinder Tube
            const glassGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.68, 16, 1, true);
            const glassTube = new THREE.Mesh(glassGeo, this.materials.glass);
            glassTube.position.y = 0.34;
            glassTube.castShadow = true;
            tubeGroup.add(glassTube);

            // Rounded Glass Bottom
            const bottomGeo = new THREE.SphereGeometry(0.11, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
            const bottomGlass = new THREE.Mesh(bottomGeo, this.materials.glass);
            bottomGlass.position.y = 0.0;
            tubeGroup.add(bottomGlass);

            // Green BTB Fluid inside
            const fluidGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.5, 16);
            const fluidMat = this.materials.btbGreen.clone();
            const fluid = new THREE.Mesh(fluidGeo, fluidMat);
            fluid.position.y = 0.25;
            fluid.name = "fluid_mesh";
            tubeGroup.add(fluid);

            // White label with tube number
            const labelGeo = new THREE.PlaneGeometry(0.14, 0.18);
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 80;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 64, 80);
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 36px Cairo';
            ctx.textAlign = 'center';
            ctx.fillText(`${idx + 1}`, 32, 54);
            const labelTex = new THREE.CanvasTexture(canvas);
            const labelMesh = new THREE.Mesh(labelGeo, new THREE.MeshBasicMaterial({ map: labelTex }));
            labelMesh.position.set(0, 0.38, 0.115);
            tubeGroup.add(labelMesh);

            // Acrylic tube rack base ring
            const standGeo = new THREE.CylinderGeometry(0.15, 0.17, 0.03, 16);
            const standMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 });
            const standMesh = new THREE.Mesh(standGeo, standMat);
            standMesh.position.y = 0.015;
            tubeGroup.add(standMesh);

            tubeGroup.position.set(xPos, 0.0, 0.0);
            this.scene.add(tubeGroup);

            this.tubes.push({
                group: tubeGroup,
                fluidMesh: fluid,
                fluidMat: fluidMat,
                index: idx + 1
            });
        });
    }

    buildPipetteAndTips() {
        // P1000 Micropipette and Stand on Table at x = -1.35, y = 0.0, z = 0.0
        this.pipetteGroup = new THREE.Group();
        this.pipetteGroup.name = "pipette_p1000";
        this.pipetteGroup.userData = {
            type: 'pipette_object',
            isSelected: false,
            hasTip: false,
            containsFluid: false,
            fluidColor: null,
            fluidSourceTubeIndex: null,
            volume: 1000,
            homePosition: new THREE.Vector3(-1.35, 0.0, 0.0),
            currentPosition: new THREE.Vector3()
        };

        // Dual-leg Pipette Stand (Light grey matching reference)
        const standMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.2, roughness: 0.3 });
        const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.24), standMat);
        standBase.position.set(-1.35, 0.02, 0.0);
        this.scene.add(standBase);

        [-0.14, 0.14].forEach(xOff => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.72, 0.035), standMat);
            leg.position.set(-1.35 + xOff, 0.38, 0.0);
            this.scene.add(leg);
        });

        const topHanger = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.08), standMat);
        topHanger.position.set(-1.35, 0.74, 0.0);
        this.scene.add(topHanger);

        // Pipette Body
        const bodyGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.38, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = 0.44;
        this.pipetteGroup.add(bodyMesh);

        // White Digital Volume Display Window
        const sCanvas = document.createElement('canvas');
        sCanvas.width = 64;
        sCanvas.height = 80;
        const sCtx = sCanvas.getContext('2d');
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0,0,64,80);
        sCtx.fillStyle = '#000000';
        sCtx.font = 'bold 24px monospace';
        sCtx.fillText('10', 16, 35);
        sCtx.fillText('00', 16, 65);
        const sTex = new THREE.CanvasTexture(sCanvas);
        const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.07), new THREE.MeshBasicMaterial({ map: sTex }));
        screenMesh.position.set(0, 0.48, 0.036);
        this.pipetteGroup.add(screenMesh);

        // Metallic lower shaft
        const shaftGeo = new THREE.CylinderGeometry(0.016, 0.008, 0.26, 16);
        const shaftMesh = new THREE.Mesh(shaftGeo, new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.8, roughness: 0.2 }));
        shaftMesh.position.y = 0.16;
        this.pipetteGroup.add(shaftMesh);

        // Red Top Plunger
        const plungerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
        plungerMesh.position.y = 0.65;
        this.pipetteGroup.add(plungerMesh);

        // Attached yellow tip (hidden until attached from box)
        const tipGeo = new THREE.CylinderGeometry(0.009, 0.002, 0.14, 16);
        const tipMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, transparent: true, opacity: 0.85 });
        this.attachedTipMesh = new THREE.Mesh(tipGeo, tipMat);
        this.attachedTipMesh.position.y = -0.06;
        this.attachedTipMesh.visible = false;
        this.pipetteGroup.add(this.attachedTipMesh);

        // Fluid inside tip
        const pipFluidGeo = new THREE.CylinderGeometry(0.007, 0.003, 0.08, 8);
        const pipFluidMat = this.materials.btbGreen.clone();
        pipFluidMat.transparent = true;
        pipFluidMat.opacity = 0;
        this.pipetteFluidMesh = new THREE.Mesh(pipFluidGeo, pipFluidMat);
        this.pipetteFluidMesh.position.y = -0.05;
        this.attachedTipMesh.add(this.pipetteFluidMesh);

        this.pipetteGroup.position.copy(this.pipetteGroup.userData.homePosition);
        this.pipetteGroup.userData.currentPosition.copy(this.pipetteGroup.position);
        this.scene.add(this.pipetteGroup);
        this.interactiveObjects.push(this.pipetteGroup);

        // P1000 Tips Box on Table at x = -0.55, y = 0.0, z = 0.0
        this.tipsBoxGroup = new THREE.Group();
        this.tipsBoxGroup.name = "tips_box";
        this.tipsBoxGroup.userData = { type: 'tips_box_object' };
        this.tipsBoxGroup.position.set(-0.55, 0.0, 0.0);

        // Acrylic Base with blue trim
        const tbBase = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.38), this.materials.glass);
        tbBase.position.y = 0.11;
        this.tipsBoxGroup.add(tbBase);

        const tbBlueRim = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.03, 0.39), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
        tbBlueRim.position.y = 0.21;
        this.tipsBoxGroup.add(tbBlueRim);

        // Open clear blue lid tilted backwards
        const tbLid = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 0.38), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 }));
        tbLid.position.set(0, 0.24, -0.19);
        tbLid.rotation.x = -Math.PI / 1.7;
        this.tipsBoxGroup.add(tbLid);

        // Yellow tips grid inside box
        for (let row = -2; row <= 2; row++) {
            for (let col = -1; col <= 1; col++) {
                const tipPlug = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 8), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
                tipPlug.position.set(row * 0.07, 0.22, col * 0.08);
                this.tipsBoxGroup.add(tipPlug);
            }
        }
        this.scene.add(this.tipsBoxGroup);
        this.interactiveObjects.push(this.tipsBoxGroup);
    }

    buildTrash() {
        // Blue Lab Waste Bin on Table at x = 0.1, y = 0.0, z = 0.0
        const trashGroup = new THREE.Group();
        trashGroup.position.set(0.1, 0.0, 0.0);

        const bucketGeo = new THREE.BoxGeometry(0.38, 0.24, 0.3);
        const bucketMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.3 });
        const bucket = new THREE.Mesh(bucketGeo, bucketMat);
        bucket.name = "tool_trash";
        bucket.position.y = 0.12;
        trashGroup.add(bucket);

        // Bin outer lip
        const lipGeo = new THREE.BoxGeometry(0.42, 0.03, 0.34);
        const lipMesh = new THREE.Mesh(lipGeo, new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
        lipMesh.position.y = 0.24;
        trashGroup.add(lipMesh);

        // Discarded yellow tips inside
        for (let i = 0; i < 3; i++) {
            const dTip = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.002, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
            dTip.position.set((Math.random() - 0.5) * 0.15, 0.08, (Math.random() - 0.5) * 0.1);
            dTip.rotation.set(0.5, 0.2, 0.4);
            trashGroup.add(dTip);
        }

        this.scene.add(trashGroup);
        this.interactiveObjects.push(bucket);
    }

    buildCuvetteRackAndCuvettes() {
        // Stepped White Cuvette Rack on Table at x = 1.0, y = 0.0, z = 0.0
        const cuvRack = new THREE.Group();
        cuvRack.position.set(1.01, 0.0, 0.0);

        const rackBase = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.08, 0.3),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
        );
        rackBase.position.y = 0.04;
        cuvRack.add(rackBase);

        const cuvOffsets = [-0.36, -0.18, 0.0, 0.18, 0.36];
        const names = ['Blank', '1', '2', '3', '4'];

        cuvOffsets.forEach((xOffset, idx) => {
            const cuvetteGroup = new THREE.Group();
            cuvetteGroup.name = `cuvette_${names[idx]}`;
            cuvetteGroup.userData = {
                type: 'cuvette_object',
                id: names[idx],
                isFilled: idx === 0,
                isCapped: idx === 0,
                fluidColor: idx === 0 ? 0xffffff : null,
                phValue: idx === 0 ? 7.0 : null,
                absorbanceVal: idx === 0 ? 0.000 : null,
                homePosition: new THREE.Vector3(cuvRack.position.x + xOffset, 0.08, 0.0),
                currentPosition: new THREE.Vector3(),
                inSpectrophotometer: false
            };

            // Glass Cuvette
            const glassGeo = new THREE.BoxGeometry(0.11, 0.34, 0.11);
            const glassCuv = new THREE.Mesh(glassGeo, this.materials.glass);
            glassCuv.position.y = 0.17;
            glassCuv.castShadow = true;
            cuvetteGroup.add(glassCuv);

            // Fluid inside
            const fluidGeo = new THREE.BoxGeometry(0.09, 0.28, 0.09);
            let fluidMat = null;
            if (idx === 0) {
                fluidMat = this.materials.water.clone();
            } else {
                fluidMat = this.materials.btbGreen.clone();
                fluidMat.transparent = true;
                fluidMat.opacity = 0;
            }
            const fluidMesh = new THREE.Mesh(fluidGeo, fluidMat);
            fluidMesh.position.y = 0.15;
            fluidMesh.name = "cuvette_fluid_mesh";
            cuvetteGroup.add(fluidMesh);

            // Red cap for Blank cuvette initially
            if (idx === 0) {
                const bCap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.12), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
                bCap.position.y = 0.34;
                cuvetteGroup.add(bCap);
            }

            cuvetteGroup.position.copy(cuvetteGroup.userData.homePosition);
            cuvetteGroup.userData.currentPosition.copy(cuvetteGroup.position);
            this.scene.add(cuvetteGroup);
            this.interactiveObjects.push(cuvetteGroup);
            this.cuvettes.push(cuvetteGroup);
        });

        this.scene.add(cuvRack);
    }

    buildSpectrophotometer() {
        // Modern Spectrophotometer on Table at x = 2.45, y = 0.0, z = 0.0
        this.specGroup = new THREE.Group();
        this.specGroup.name = "spectrophotometer";
        this.specGroup.position.set(2.45, 0.0, 0.0);
        this.specGroup.userData = {
            type: 'spec_machine_object',
            isOn: false,
            isLidOpen: false,
            wavelength: 500,
            hasCuvette: false,
            cuvetteInChamber: null
        };

        // White Curved Chassis
        const chassis = new THREE.Mesh(
            new THREE.BoxGeometry(1.25, 0.52, 0.75),
            new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15 })
        );
        chassis.position.y = 0.26;
        chassis.castShadow = true;
        this.specGroup.add(chassis);

        // Blue sample chamber lid on right
        this.specLidGroup = new THREE.Group();
        this.specLidGroup.position.set(0.35, 0.52, -0.15);

        const lidMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.34, 0.05, 0.34),
            new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 })
        );
        lidMesh.position.set(0, 0.025, 0.17);
        this.specLidGroup.add(lidMesh);
        this.specLidGroup.name = "spec_lid";
        this.specGroup.add(this.specLidGroup);

        // Chamber snap spot
        this.specChamberSnapSpot = new THREE.Object3D();
        this.specChamberSnapSpot.position.set(0.35, 0.24, 0.02);
        this.specGroup.add(this.specChamberSnapSpot);

        // Green LCD Display on left front
        const screenMat = new THREE.MeshStandardMaterial({
            color: 0x065f46,
            emissive: 0x059669,
            emissiveIntensity: 0.6
        });
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.22), screenMat);
        screen.position.set(-0.28, 0.32, 0.376);
        this.specGroup.add(screen);

        // Red Power Button
        const pwrBtn = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16),
            new THREE.MeshStandardMaterial({ color: 0xef4444 })
        );
        pwrBtn.rotation.x = Math.PI / 2;
        pwrBtn.position.set(-0.28, 0.12, 0.38);
        pwrBtn.name = "spec_power_btn";
        this.specGroup.add(pwrBtn);

        this.scene.add(this.specGroup);
        this.interactiveObjects.push(pwrBtn);
        this.interactiveObjects.push(lidMesh);
    }
}

// ══════════════════════════════════════════════════════════════
// 3. موديول منطق المحاكاة والتفاعل (ExperimentEngine)
// ══════════════════════════════════════════════════════════════
class ExperimentEngine {
    constructor(sceneManager, labSetup, uiOverlay) {
        this.sceneManager = sceneManager;
        this.labSetup = labSetup;
        this.uiOverlay = uiOverlay;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.isDragging = false;
        this.selectedObject = null;
        this.dragOffset = new THREE.Vector3();
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        this.planeIntersection = new THREE.Vector3();

        this.activeTool = null; // 'pipette'
        this.currentStep = '1a';
        this.currentPhase = 1;
        this.spectrophotometerZeroed = false;

        this.initEvents();
    }

    initEvents() {
        const canvas = this.sceneManager.canvas;

        canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
        window.addEventListener('mousemove', (e) => this.onPointerMove(e));
        window.addEventListener('mouseup', (e) => this.onPointerUp(e));

        // Touch events for mobile/tablet support
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                this.onPointerDown({
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    button: 0,
                    preventDefault: () => e.preventDefault()
                });
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && (this.isDragging || this.activeTool)) {
                const touch = e.touches[0];
                this.onPointerMove({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            if (this.isDragging || this.activeTool) {
                this.onPointerUp(e);
            }
        });
    }

    onPointerDown(event) {
        if (event.button !== 0) return; // Only left click

        const rect = this.sceneManager.canvas.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;

        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        
        const intersects = this.raycaster.intersectObjects(this.labSetup.interactiveObjects, true);

        if (intersects.length > 0) {
            let hitObj = intersects[0].object;
            let parent = hitObj;
            while (parent && !parent.userData.type) {
                parent = parent.parent;
            }

            if (parent) {
                const type = parent.userData.type;

                if (type === 'lamp_switch') {
                    this.toggleLamps();
                    return;
                }
                if (type === 'pipette_object') {
                    this.selectPipette();
                    return;
                }
                if (type === 'tips_box_object') {
                    this.attachPipetteTip();
                    return;
                }
                if (hitObj.name === 'spec_power_btn') {
                    this.toggleSpectrophotometerPower();
                    return;
                }
                if (hitObj.parent && hitObj.parent.name === 'spec_lid') {
                    this.toggleSpectrophotometerLid();
                    return;
                }
            }
        }

        // Check draggable objects
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
                this.sceneManager.isPanning = false;

                this.dragPlane.normal.set(0, 0, 1);
                this.dragPlane.constant = -this.selectedObject.position.z;
                
                if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersection)) {
                    this.dragOffset.copy(this.selectedObject.position).sub(this.planeIntersection);
                }

                this.uiOverlay.showHoverTooltip(localX, localY - 30, this.getFriendlyName(this.selectedObject));
            }
        }
    }

    onPointerMove(event) {
        const rect = this.sceneManager.canvas.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;

        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

        if (this.isDragging && this.selectedObject) {
            this.dragPlane.constant = -this.selectedObject.position.z;
            if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersection)) {
                const newPos = this.planeIntersection.clone().add(this.dragOffset);
                newPos.x = Math.max(-4.2, Math.min(4.2, newPos.x));
                newPos.y = Math.max(-0.2, Math.min(2.5, newPos.y));

                this.selectedObject.position.set(newPos.x, newPos.y, 0.1);
            }

            this.uiOverlay.showHoverTooltip(localX, localY - 30, `سحب: ${this.getFriendlyName(this.selectedObject)}`);
            this.checkHoverTargets();
            return;
        }

        if (this.activeTool === 'pipette') {
            this.dragPlane.constant = 0.0;
            if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersection)) {
                const clampedX = Math.max(-4.0, Math.min(4.0, this.planeIntersection.x));
                const clampedY = Math.max(0.1, Math.min(2.0, this.planeIntersection.y));
                this.labSetup.pipetteGroup.position.set(clampedX, clampedY, 0.2);
            }
            this.uiOverlay.showHoverTooltip(localX, localY - 40, "انقر على الأنبوب لسحب العينة، أو الكيوفيت لصبها");
            return;
        }

        const intersects = this.raycaster.intersectObjects(this.labSetup.interactiveObjects, true);
        if (intersects.length > 0) {
            let hit = intersects[0].object;
            while (hit && !hit.userData.type) hit = hit.parent;
            if (hit) {
                this.uiOverlay.showHoverTooltip(localX, localY - 30, this.getFriendlyName(hit));
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
            
            this.sceneManager.targetGlowMesh.visible = false;
            this.sceneManager.secondaryTargetGlowMesh.visible = false;
        }

        if (this.activeTool === 'pipette') {
            this.handlePipetteClick();
        }
    }

    canDrag(obj) {
        const type = obj.userData.type;
        const phase = this.currentStep.charAt(0);

        if (phase === '1') {
            if (type === 'plant_draggable' || type === 'stopper_draggable' || type === 'box_draggable') {
                return true;
            }
        }
        if (phase === '2') {
            if (type === 'box_draggable' || type === 'stopper_draggable' || type === 'cap_draggable') {
                return true;
            }
        }
        if (phase === '3') {
            if (type === 'cuvette_object') {
                return true;
            }
        }
        return false;
    }

    checkHoverTargets() {
        const obj = this.selectedObject;
        const type = obj.userData.type;
        const getDistXY = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

        if (type === 'plant_draggable') {
            const t2Pos = this.labSetup.tubes[1].group.position;
            const t3Pos = this.labSetup.tubes[2].group.position;
            
            const dist2 = getDistXY(obj.position, { x: t2Pos.x, y: 0.35 });
            const dist3 = getDistXY(obj.position, { x: t3Pos.x, y: 0.35 });

            if (dist2 < 0.45 && !this.labSetup.tubes[1].group.userData.hasPlant) {
                this.showGlowRing(t2Pos.x, 0.02, t2Pos.z, 'blue');
            } else if (dist3 < 0.45 && !this.labSetup.tubes[2].group.userData.hasPlant) {
                this.showGlowRing(t3Pos.x, 0.02, t3Pos.z, 'blue');
            } else {
                this.sceneManager.targetGlowMesh.visible = false;
            }
        }

        if (type === 'stopper_draggable') {
            let hoveredTube = null;
            this.labSetup.tubes.forEach(t => {
                const tPos = t.group.position;
                if (!t.group.userData.hasStopper && getDistXY(obj.position, { x: tPos.x, y: 0.68 }) < 0.45) {
                    hoveredTube = t.group;
                }
            });

            if (hoveredTube) {
                this.showGlowRing(hoveredTube.position.x, 0.68, hoveredTube.position.z, 'blue');
            } else {
                this.sceneManager.targetGlowMesh.visible = false;
            }
        }

        if (type === 'box_draggable') {
            const t3Pos = this.labSetup.tubes[2].group.position;
            const t4Pos = this.labSetup.tubes[3].group.position;
            const dist3 = getDistXY(obj.position, { x: t3Pos.x, y: 0.35 });
            const dist4 = getDistXY(obj.position, { x: t4Pos.x, y: 0.35 });

            if (dist3 < 0.45 && !this.labSetup.tubes[2].group.userData.hasBox) {
                this.showGlowRing(t3Pos.x, 0.02, t3Pos.z, 'blue');
            } else if (dist4 < 0.45 && !this.labSetup.tubes[3].group.userData.hasBox) {
                this.showGlowRing(t4Pos.x, 0.02, t4Pos.z, 'blue');
            } else {
                this.sceneManager.targetGlowMesh.visible = false;
            }
        }

        if (type === 'cap_draggable') {
            let hoveredCuv = null;
            this.labSetup.cuvettes.forEach(c => {
                const cPos = c.position;
                if (c.userData.id !== 'Blank' && !c.userData.isCapped && getDistXY(obj.position, { x: cPos.x, y: 0.34 }) < 0.35) {
                    hoveredCuv = c;
                }
            });

            if (hoveredCuv) {
                this.showGlowRing(hoveredCuv.position.x, 0.34, hoveredCuv.position.z, 'blue');
            } else {
                this.sceneManager.targetGlowMesh.visible = false;
            }
        }

        if (type === 'cuvette_object') {
            const slotPos = new THREE.Vector3();
            this.labSetup.specChamberSnapSpot.getWorldPosition(slotPos);
            const dist = getDistXY(obj.position, slotPos);

            if (dist < 0.5 && this.labSetup.specGroup.userData.isLidOpen && !this.labSetup.specGroup.userData.hasCuvette) {
                this.showGlowRing(slotPos.x, slotPos.y + 0.05, slotPos.z, 'red');
            } else {
                this.sceneManager.secondaryTargetGlowMesh.visible = false;
            }
        }
    }

    showGlowRing(x, y, z, color = 'blue') {
        if (color === 'blue') {
            this.sceneManager.targetGlowMesh.position.set(x, y, z + 0.05);
            this.sceneManager.targetGlowMesh.visible = true;
        } else {
            this.sceneManager.secondaryTargetGlowMesh.position.set(x, y, z + 0.05);
            this.sceneManager.secondaryTargetGlowMesh.visible = true;
        }
    }

    handleDrop(obj) {
        const type = obj.userData.type;
        const getDistXY = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

        if (type === 'plant_draggable') {
            const t2Pos = this.labSetup.tubes[1].group.position;
            const t3Pos = this.labSetup.tubes[2].group.position;
            const dist2 = getDistXY(obj.position, { x: t2Pos.x, y: 0.35 });
            const dist3 = getDistXY(obj.position, { x: t3Pos.x, y: 0.35 });

            if (dist2 < 0.45 && !this.labSetup.tubes[1].group.userData.hasPlant && obj.userData.index === 1) {
                obj.position.set(t2Pos.x, 0.08, t2Pos.z + 0.01);
                this.labSetup.tubes[1].group.userData.hasPlant = true;
                obj.userData.placedInTube = 2;
                this.uiOverlay.showToast("تم وضع نبات الإيلوديا في الأنبوب 2");
                this.checkPhase1Progress();
            } else if (dist3 < 0.45 && !this.labSetup.tubes[2].group.userData.hasPlant && obj.userData.index === 2) {
                obj.position.set(t3Pos.x, 0.08, t3Pos.z + 0.01);
                this.labSetup.tubes[2].group.userData.hasPlant = true;
                obj.userData.placedInTube = 3;
                this.uiOverlay.showToast("تم وضع نبات الإيلوديا في الأنبوب 3");
                this.checkPhase1Progress();
            } else {
                obj.position.copy(obj.userData.homePosition);
            }
        }

        else if (type === 'stopper_draggable') {
            let snapped = false;
            this.labSetup.tubes.forEach(t => {
                const tPos = t.group.position;
                if (!t.group.userData.hasStopper && getDistXY(obj.position, { x: tPos.x, y: 0.68 }) < 0.45) {
                    obj.position.set(tPos.x, 0.68, tPos.z);
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

        else if (type === 'box_draggable') {
            const t3Pos = this.labSetup.tubes[2].group.position;
            const t4Pos = this.labSetup.tubes[3].group.position;
            const dist3 = getDistXY(obj.position, { x: t3Pos.x, y: 0.35 });
            const dist4 = getDistXY(obj.position, { x: t4Pos.x, y: 0.35 });

            if (dist3 < 0.45 && !this.labSetup.tubes[2].group.userData.hasBox && obj.userData.index === 1) {
                obj.position.set(t3Pos.x, 0.0, t3Pos.z + 0.02);
                this.labSetup.tubes[2].group.userData.hasBox = true;
                obj.userData.coveringTubeIndex = 3;
                
                this.setTubeVisibility(this.labSetup.tubes[2].group, false);
                this.uiOverlay.showToast("تم تغطية الأنبوب 3 بصندوق عزل الضوء");
                this.checkPhase1Progress();
            } else if (dist4 < 0.45 && !this.labSetup.tubes[3].group.userData.hasBox && obj.userData.index === 2) {
                obj.position.set(t4Pos.x, 0.0, t4Pos.z + 0.02);
                this.labSetup.tubes[3].group.userData.hasBox = true;
                obj.userData.coveringTubeIndex = 4;
                
                this.setTubeVisibility(this.labSetup.tubes[3].group, false);
                this.uiOverlay.showToast("تم تغطية الأنبوب 4 بصندوق عزل الضوء");
                this.checkPhase1Progress();
            } else {
                if (obj.userData.coveringTubeIndex !== null) {
                    const idx = obj.userData.coveringTubeIndex;
                    const tubeGroup = this.labSetup.tubes[idx - 1].group;
                    tubeGroup.userData.hasBox = false;
                    this.setTubeVisibility(tubeGroup, true);
                    obj.userData.coveringTubeIndex = null;
                }
                obj.position.copy(obj.userData.homePosition);
                
                if (this.currentStep === '2b') {
                    this.checkPhase2Progress();
                }
            }
        }

        else if (type === 'cap_draggable') {
            let snapped = false;
            this.labSetup.cuvettes.forEach(c => {
                const cPos = c.position;
                if (c.userData.id !== 'Blank' && !c.userData.isCapped && getDistXY(obj.position, { x: cPos.x, y: 0.34 }) < 0.35) {
                    obj.position.set(cPos.x, 0.34, cPos.z);
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

        else if (type === 'cuvette_object') {
            const slotPos = new THREE.Vector3();
            this.labSetup.specChamberSnapSpot.getWorldPosition(slotPos);
            const dist = getDistXY(obj.position, slotPos);

            if (dist < 0.5 && this.labSetup.specGroup.userData.isLidOpen && !this.labSetup.specGroup.userData.hasCuvette) {
                obj.position.copy(slotPos);
                obj.position.y += 0.06;
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
                if (obj.userData.inSpectrophotometer) {
                    obj.userData.inSpectrophotometer = false;
                    this.labSetup.specGroup.userData.hasCuvette = false;
                    this.labSetup.specGroup.userData.cuvetteInChamber = null;
                }
                obj.position.copy(obj.userData.homePosition);
                
                if (this.currentStep === '3h') {
                    this.checkPhase3Progress();
                }
            }
        }
    }

    setTubeVisibility(tubeGroup, visible) {
        tubeGroup.traverse(child => {
            child.visible = visible;
        });
        
        this.labSetup.plantsInTank.forEach(plant => {
            if (plant.userData.placedInTube === tubeGroup.userData.index) {
                plant.visible = visible;
            }
        });

        this.labSetup.stoppers.forEach(stopper => {
            if (stopper.userData.pluggedTubeIndex === tubeGroup.userData.index) {
                stopper.visible = visible;
            }
        });
    }

    toggleLamps() {
        const anyOn = this.labSetup.lamps.some(l => l.isOn);
        const newState = !anyOn;

        this.labSetup.lamps.forEach(lamp => {
            lamp.isOn = newState;
            lamp.light.intensity = newState ? 2.5 : 0;
            lamp.bulbMat.emissive.setHex(newState ? 0xfef08a : 0x000000);
        });

        this.uiOverlay.showToast(newState ? "💡 تم تشغيل مصابيح الإضاءة" : "تم إطفاء المصابيح");

        if (this.currentStep === '1e' && newState) {
            setTimeout(() => {
                this.uiOverlay.showIncubationDialog();
            }, 500);
        }
    }

    selectPipette() {
        if (this.currentPhase !== 2) {
            this.uiOverlay.showToast("الماصة الدقيقة تُستخدم في المرحلة 2 لنقل العينات للكيوفيتات.");
            return;
        }

        if (this.activeTool === 'pipette') {
            this.activeTool = null;
            this.labSetup.pipetteGroup.userData.isSelected = false;
            this.labSetup.pipetteGroup.position.copy(this.labSetup.pipetteGroup.userData.homePosition);
            this.uiOverlay.showToast("تمت إعادة الماصة إلى الحامل.");
        } else {
            this.activeTool = 'pipette';
            this.labSetup.pipetteGroup.userData.isSelected = true;
            this.uiOverlay.showToast("تم تحديد الماصة P1000. انقر على علبة الرؤوس أولاً لتركيب رأس جديد.");
            
            if (this.currentStep === '2e') {
                this.advanceStep('2f');
            }
        }
    }

    attachPipetteTip() {
        if (this.activeTool !== 'pipette') {
            this.uiOverlay.showToast("يجب تحديد الماصة P1000 أولاً بالنقر عليها!");
            return;
        }

        if (this.labSetup.pipetteGroup.userData.hasTip) {
            this.uiOverlay.showToast("الماصة تحتوي على رأس بالفعل!");
            return;
        }

        this.labSetup.pipetteGroup.userData.hasTip = true;
        this.labSetup.attachedTipMesh.visible = true;
        this.uiOverlay.showToast("✓ تم تركيب رأس ماصة جديد P1000.");

        if (this.currentStep === '2f' || this.currentStep === '2j') {
            this.advanceStep('2g');
        }
    }

    handlePipetteClick() {
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        const intersects = this.raycaster.intersectObjects(this.labSetup.interactiveObjects, true);

        if (intersects.length === 0) return;

        let hitObj = intersects[0].object;
        let parent = hitObj;
        while (parent && !parent.userData.type && parent.name !== 'tool_trash') {
            parent = parent.parent;
        }

        if (!parent) return;

        const pip = this.labSetup.pipetteGroup.userData;

        // 1. Click on Trash
        if (parent.name === 'tool_trash' || (hitObj.parent && hitObj.parent.name === 'tool_trash')) {
            if (!pip.hasTip) {
                this.uiOverlay.showToast("لا يوجد رأس في الماصة للتخلص منه!");
                return;
            }

            pip.hasTip = false;
            pip.containsFluid = false;
            pip.fluidColor = null;
            pip.fluidSourceTubeIndex = null;
            this.labSetup.attachedTipMesh.visible = false;
            this.labSetup.pipetteFluidMesh.material.opacity = 0;

            this.uiOverlay.showToast("🗑️ تم التخلص من رأس الماصة في سلة المهملات.");

            if (this.currentStep === '2i') {
                this.advanceStep('2j');
            }
            return;
        }

        // 2. Click on Test Tube (Aspirate Sample)
        if (parent.userData.type === 'tube_object') {
            if (!pip.hasTip) {
                this.uiOverlay.showToast("⚠️ يجب تركيب رأس ماصة جديد من العلبة أولاً!");
                return;
            }

            if (pip.containsFluid) {
                this.uiOverlay.showToast("⚠️ الماصة ممتلئة بالفعل! أفرغ العينة في الكيوفيت المخصص أولاً.");
                return;
            }

            const tubeIdx = parent.userData.index;
            const tubeFluidMat = this.labSetup.tubes[tubeIdx - 1].fluidMat;

            pip.containsFluid = true;
            pip.fluidColor = tubeFluidMat.color.getHex();
            pip.fluidSourceTubeIndex = tubeIdx;

            this.labSetup.pipetteFluidMesh.material.color.setHex(pip.fluidColor);
            this.labSetup.pipetteFluidMesh.material.opacity = 0.9;

            this.uiOverlay.showToast(`✓ تم سحب 1000 µL من كاشف الأنبوب ${tubeIdx}`);

            if (this.currentStep === '2g') {
                this.advanceStep('2h');
            }
            return;
        }

        // 3. Click on Cuvette (Dispense Sample)
        if (parent.userData.type === 'cuvette_object') {
            if (!pip.containsFluid) {
                this.uiOverlay.showToast("⚠️ الماصة فارغة! اسحب عينة من أحد الأنابيب أولاً.");
                return;
            }

            const cuvId = parent.userData.id;
            if (cuvId === 'Blank') {
                this.uiOverlay.showToast("الكيوفيت الضابطة تحتوي على ماء نقي مسبقاً.");
                return;
            }

            const targetCuv = this.labSetup.cuvettes.find(c => c.userData.id === cuvId);
            if (!targetCuv) return;

            if (targetCuv.userData.isFilled) {
                this.uiOverlay.showToast(`الكيوفيت ${cuvId} ممتلئة بالفعل!`);
                return;
            }

            const fluidMesh = targetCuv.getObjectByName('cuvette_fluid_mesh');
            if (fluidMesh) {
                fluidMesh.material.color.setHex(pip.fluidColor);
                fluidMesh.material.opacity = 0.9;
            }

            targetCuv.userData.isFilled = true;
            targetCuv.userData.fluidColor = pip.fluidColor;

            // Transfer fluid to cuvette
            pip.containsFluid = false;
            this.labSetup.pipetteFluidMesh.material.opacity = 0;

            this.uiOverlay.showToast(`✓ تم صب العينة في الكيوفيت ${cuvId}. تخلص من رأس الماصة في سلة المهملات.`);

            if (this.currentStep === '2h') {
                this.advanceStep('2i');
            } else {
                this.checkPhase2Progress();
            }
        }
    }

    toggleSpectrophotometerPower() {
        const spec = this.labSetup.specGroup;
        spec.userData.isOn = !spec.userData.isOn;

        const screen = document.getElementById('specScreen');
        if (spec.userData.isOn) {
            this.uiOverlay.showToast("جهاز مطياف الضوء: قيد التشغيل (ON)");
            if (screen) screen.textContent = "500 nm | جاهز";
            this.uiOverlay.openSpecOverlay();
            
            if (this.currentStep === '3b') {
                this.advanceStep('3c');
            }
        } else {
            this.uiOverlay.showToast("تم إطفاء جهاز مطياف الضوء.");
            if (screen) screen.textContent = "OFF";
        }
    }

    toggleSpectrophotometerLid() {
        const spec = this.labSetup.specGroup;
        spec.userData.isLidOpen = !spec.userData.isLidOpen;

        if (spec.userData.isLidOpen) {
            this.labSetup.specLidGroup.rotation.x = -Math.PI / 2.2;
            this.uiOverlay.showToast("تم فتح غطاء حجرة العينات");
            
            if (this.currentStep === '3d') {
                this.advanceStep('3e');
            }
        } else {
            this.labSetup.specLidGroup.rotation.x = 0;
            this.uiOverlay.showToast("تم إغلاق غطاء حجرة العينات");
            
            if (this.currentStep === '3f') {
                this.advanceStep('3g');
                this.checkPhase3Progress();
            }
        }
    }

    start12HoursIncubation() {
        this.uiOverlay.hideIncubationDialog();
        this.uiOverlay.showClockSpinAnimation();

        let hour = 0;
        const hourHand = document.getElementById('hourHand');
        const minuteHand = document.getElementById('minuteHand');
        const timeReadout = document.getElementById('timeReadout');
        const cycleLabel = document.getElementById('cycleLabel');

        const interval = setInterval(() => {
            hour++;
            if (hourHand) hourHand.style.transform = `rotate(${hour * 30}deg)`;
            if (minuteHand) minuteHand.style.transform = `rotate(${hour * 360}deg)`;
            if (timeReadout) timeReadout.textContent = `${String(hour).padStart(2, '0')}:00`;

            if (hour <= 6) {
                if (cycleLabel) cycleLabel.textContent = "ساعات الإضاءة (تفاعل البناء الضوئي)";
            } else {
                if (cycleLabel) cycleLabel.textContent = "استمرار التفاعل والتبادل الغازي";
            }

            if (hour >= 12) {
                clearInterval(interval);
                setTimeout(() => {
                    this.uiOverlay.hideClockSpinAnimation();
                    this.applyIncubationResults();
                }, 600);
            }
        }, 120);
    }

    applyIncubationResults() {
        // Apply color change results after 12h:
        // Tube 1 (Control + Light): Remains Green (pH 7.0)
        // Tube 2 (Elodea + Light): Turns Blue (pH 7.8, Photosynthesis consumed CO2)
        // Tube 3 (Elodea + Dark): Turns Yellow (pH 6.2, Cellular Respiration produced CO2)
        // Tube 4 (Control + Dark): Remains Green (pH 7.0)
        
        this.labSetup.tubes[0].fluidMat.color.setHex(0x15803d); // Green
        this.labSetup.tubes[1].fluidMat.color.setHex(0x1d4ed8); // Blue
        this.labSetup.tubes[2].fluidMat.color.setHex(0xca8a04); // Yellow
        this.labSetup.tubes[3].fluidMat.color.setHex(0x15803d); // Green

        this.labSetup.tubes[0].group.userData.phValue = 7.0;
        this.labSetup.tubes[1].group.userData.phValue = 7.8;
        this.labSetup.tubes[2].group.userData.phValue = 6.2;
        this.labSetup.tubes[3].group.userData.phValue = 7.0;

        // Cuvettes absorbance at 615 nm
        this.labSetup.cuvettes[1].userData.phValue = 7.0;
        this.labSetup.cuvettes[1].userData.absorbanceVal = 0.350;

        this.labSetup.cuvettes[2].userData.phValue = 7.8;
        this.labSetup.cuvettes[2].userData.absorbanceVal = 0.850;

        this.labSetup.cuvettes[3].userData.phValue = 6.2;
        this.labSetup.cuvettes[3].userData.absorbanceVal = 0.050;

        this.labSetup.cuvettes[4].userData.phValue = 7.0;
        this.labSetup.cuvettes[4].userData.absorbanceVal = 0.350;

        this.uiOverlay.showToast("انتهت فترة الحضانة (12 ساعة)! لاحظ تغير ألوان الكاشف في الأنابيب.");
        this.advanceStep('2a');
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
            this.uiOverlay.showToast("الخطوة 2د: تقدير الرقم الهيدروجيني بالعين باستخدام الملصق. ثم حدد الماصة للخطوة التالية.");
            setTimeout(() => this.advanceStep('2e'), 1500);
        } else if (this.currentStep === '2k' && this.labSetup.cuvettes[1].userData.isCapped && this.labSetup.cuvettes[1].userData.isFilled) {
            this.advanceStep('2l');
        } else if (this.currentStep === '2l' && cuvettesFilled && capsPlaced) {
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
        
        if (this.currentStep === '3g' && spec.userData.hasCuvette && spec.userData.cuvetteInChamber.userData.id === 'Blank' && !spec.userData.isLidOpen) {
            const btnZero = document.getElementById('btnSpecZero');
            if (btnZero) btnZero.disabled = false;
            if (btnZero) btnZero.onclick = () => {
                this.spectrophotometerZeroed = true;
                if (screen) screen.textContent = "0.000 امتصاص";
                this.uiOverlay.showToast("تم تصفير الجهاز بكيوفيت الماء بنجاح. الآن استبدل كيوفيت الماء بعيناتك وقسها.");
                
                document.getElementById('btnSpecRead').disabled = false;
                this.advanceStep('3h');
            };
        }

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
                    const val = cuv.userData.absorbanceVal;
                    if (screen) screen.textContent = `${val.toFixed(3)} Abs`;

                    // Update notebook table
                    if (cuv.userData.id !== 'Blank') {
                        const cell = document.getElementById(`abs_res_${cuv.userData.id}`);
                        if (cell) cell.textContent = val.toFixed(3);
                    }

                    this.uiOverlay.showToast(`تم قياس الامتصاصية للكيوفيت ${cuv.userData.id}: ${val.toFixed(3)}`);
                };
            }
        }
    }

    advanceStep(stepKey) {
        this.currentStep = stepKey;
        this.currentPhase = parseInt(stepKey.charAt(0));
        this.uiOverlay.updateStepBanner(stepKey);
    }

    getFriendlyName(obj) {
        const type = obj.userData.type;
        if (type === 'plant_draggable') return `نبات الإيلوديا (فرع ${obj.userData.index}) 🌿`;
        if (type === 'stopper_draggable') return `سدادة مطاطية (${obj.userData.index}) 🟤`;
        if (type === 'box_draggable') return `صندوق حجب الضوء (${obj.userData.index}) 📦`;
        if (type === 'cap_draggable') return `غطاء كيوفيت أحمر (${obj.userData.index}) 🔴`;
        if (type === 'cuvette_object') return obj.userData.id === 'Blank' ? "كيوفيت ضابطة (ماء)" : `كيوفيت عينة (${obj.userData.id})`;
        if (type === 'tube_object') return `أنبوب اختبار ${obj.userData.index}`;
        if (type === 'pipette_object') return "الماصة الدقيقة P1000 (1000 µL)";
        if (type === 'tips_box_object') return "علبة رؤوس الماصة P1000";
        if (type === 'lamp_switch') return "مفتاح تشغيل مصابيح الإضاءة 💡";
        if (obj.name === 'tool_trash') return "سلة المهملات 🗑️";
        if (obj.name === 'spec_power_btn') return "زر تشغيل مطياف الضوء";
        if (obj.parent && obj.parent.name === 'spec_lid') return "غطاء حجرة عينات مطياف الضوء";
        return "";
    }
}

// ══════════════════════════════════════════════════════════════
// 4. موديول واجهة المستخدم والتنبيهات (UIOverlay)
// ══════════════════════════════════════════════════════════════
class UIOverlay {
    constructor() {
        this.hoverTooltip = document.getElementById('hoverTooltip');
        this.stepBadge = document.getElementById('stepBadge');
        this.stepText = document.getElementById('stepText');
        this.specOverlay = document.getElementById('specOverlay');

        this.initEventListeners();
    }

    initEventListeners() {
        // Toggle poster overlay
        const btnTogglePoster = document.getElementById('btnTogglePoster');
        const posterOverlay = document.getElementById('posterOverlay');
        const btnClosePoster = document.getElementById('btnClosePoster');

        if (btnTogglePoster && posterOverlay) {
            btnTogglePoster.onclick = () => {
                posterOverlay.style.display = 'flex';
                if (window.appInstance && window.appInstance.engine.currentStep === '1a') {
                    window.appInstance.engine.advanceStep('1b');
                }
            };
        }
        if (btnClosePoster && posterOverlay) {
            btnClosePoster.onclick = () => {
                posterOverlay.style.display = 'none';
            };
        }

        // Incubation button
        const btnIncubate = document.getElementById('btnStartIncubation');
        if (btnIncubate) {
            btnIncubate.onclick = () => {
                if (window.appInstance) {
                    window.appInstance.engine.start12HoursIncubation();
                }
            };
        }

        // Spectrophotometer overlay close button
        const btnCloseSpec = document.getElementById('btnCloseSpec');
        if (btnCloseSpec && this.specOverlay) {
            btnCloseSpec.onclick = () => {
                this.specOverlay.style.display = 'none';
            };
        }

        // Wavelength adjustments
        const btnWlUp = document.getElementById('btnWlUp');
        const btnWlDown = document.getElementById('btnWlDown');
        const wlVal = document.getElementById('wlVal');

        if (btnWlUp && wlVal) {
            btnWlUp.onclick = () => {
                let current = parseInt(wlVal.textContent) || 500;
                current = Math.min(800, current + 5);
                wlVal.textContent = current;
                if (current === 615 && window.appInstance && window.appInstance.engine.currentStep === '3c') {
                    window.appInstance.engine.advanceStep('3d');
                    this.showToast("✓ تم ضبط الطول الموجي على 615 nm (الأمثل لكاشف BTB)");
                }
            };
        }

        if (btnWlDown && wlVal) {
            btnWlDown.onclick = () => {
                let current = parseInt(wlVal.textContent) || 500;
                current = Math.max(400, current - 5);
                wlVal.textContent = current;
                if (current === 615 && window.appInstance && window.appInstance.engine.currentStep === '3c') {
                    window.appInstance.engine.advanceStep('3d');
                    this.showToast("✓ تم ضبط الطول الموجي على 615 nm (الأمثل لكاشف BTB)");
                }
            };
        }
    }

    showHoverTooltip(x, y, text) {
        if (!text || !this.hoverTooltip) return;
        this.hoverTooltip.textContent = text;
        this.hoverTooltip.style.left = `${x}px`;
        this.hoverTooltip.style.top = `${y}px`;
        this.hoverTooltip.style.display = 'block';
    }

    hideHoverTooltip() {
        if (this.hoverTooltip) this.hoverTooltip.style.display = 'none';
    }

    showToast(message) {
        let toast = document.getElementById('labToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'labToast';
            toast.className = 'lab-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    updateStepBanner(stepKey) {
        const stepDescriptions = {
            '1a': { badge: 'الخطوة 1أ', text: 'راجع مخطط توزيع الأنابيب المعلق على الجدار لمعرفة التركيب التجريبي.' },
            '1b': { badge: 'الخطوة 1ب', text: 'اسحب فرع نبات الإيلوديا من الحوض العلوي وضعه في الأنبوب 2 والأنبوب 3.' },
            '1c': { badge: 'الخطوة 1ج', text: 'اسحب السدادات المطاطية من الرف العلوي وأغلق بها جميع الأنابيب الأربعة.' },
            '1d': { badge: 'الخطوة 1د', text: 'اسحب صناديق حجب الضوء وضع صندوقاً فوق الأنبوب 3 وصندوقاً فوق الأنبوب 4.' },
            '1e': { badge: 'الخطوة 1هـ', text: 'انقر على مفتاح الإضاءة على الجدار لتشغيل المصابيح وبدء التجربة.' },
            '2a': { badge: 'الخطوة 2أ', text: 'المرحلة 2: راجع ألوان الكاشف الناتجة بعد 12 ساعة من الحضانة.' },
            '2b': { badge: 'الخطوة 2ب', text: 'اسحب الصناديق البنية عن الأنبوبين 3 و 4 وأعدها إلى الرف.' },
            '2c': { badge: 'الخطوة 2ج', text: 'انزع السدادات المطاطية عن الأنابيب الأربعة لإتاحة سحب العينات.' },
            '2d': { badge: 'الخطوة 2د', text: 'قدّر الرقم الهيدروجيني بالعين لكل أنبوب بمقارنته مع ملصق مقياس pH.' },
            '2e': { badge: 'الخطوة 2هـ', text: 'انقر على الماصة الدقيقة P1000 لتحديدها واستخدامها.' },
            '2f': { badge: 'الخطوة 2و', text: 'انقر على علبة رؤوس الماصة لتركيب رأس ماصة أصفر جديد.' },
            '2g': { badge: 'الخطوة 2ز', text: 'انقر على الأنبوب 1 لسحب 1000 µL من العينة.' },
            '2h': { badge: 'الخطوة 2ح', text: 'انقر على الكيوفيت 1 لصب العينة بداخلها.' },
            '2i': { badge: 'الخطوة 2ط', text: 'انقر على سلة المهملات للتخلص من رأس الماصة المستخدم.' },
            '2j': { badge: 'الخطوة 2ي', text: 'كرر الخطوات (تركيب رأس -> سحب -> صب -> رمي) للأنابيب 2 و 3 و 4.' },
            '2k': { badge: 'الخطوة 2ك', text: 'اسحب الأغطية الحمراء من الرف وأغلق بها الكيوفيتات 1 إلى 4.' },
            '2l': { badge: 'الخطوة 2ل', text: 'اكتمل تجهيز الكيوفيتات! انتقل للمرحلة 3 لقياس الامتصاصية.' },
            '3a': { badge: 'الخطوة 3أ', text: 'المرحلة 3: قياس الامتصاصية بجهاز المطياف الضوئي (Spectrophotometer).' },
            '3b': { badge: 'الخطوة 3ب', text: 'انقر على الزر الأحمر لتشغيل جهاز مطياف الضوء.' },
            '3c': { badge: 'الخطوة 3ج', text: 'اضبط الطول الموجي على 615 nm باستخدام أزرار (+) و (-).' },
            '3d': { badge: 'الخطوة 3د', text: 'انقر على غطاء حجرة العينات الأزرق لفتحه.' },
            '3e': { badge: 'الخطوة 3هـ', text: 'اسحب الكيوفيت الضابطة (Blank) وضعها داخل حجرة العينات.' },
            '3f': { badge: 'الخطوة 3و', text: 'انقر على غطاء الحجرة لإغلاقه.' },
            '3g': { badge: 'الخطوة 3ز', text: 'انقر على زر "تصفير الجهاز (Zero)" لضبط العيار المرجعي على 0.000.' },
            '3h': { badge: 'الخطوة 3ح', text: 'قس امتصاصية الكيوفيتات 1 إلى 4 ودون القيم في جدول الملاحظات.' }
        };

        const info = stepDescriptions[stepKey];
        if (info) {
            if (this.stepBadge) this.stepBadge.textContent = info.badge;
            if (this.stepText) this.stepText.textContent = info.text;
        }

        // Highlight active sidebar step
        document.querySelectorAll('.step-card').forEach(card => {
            card.classList.remove('active');
            if (card.id === `step_${stepKey}`) {
                card.classList.add('active');
                card.classList.remove('locked');
            }
        });
    }

    showIncubationDialog() {
        const overlay = document.getElementById('incubationOverlay');
        if (overlay) overlay.style.display = 'flex';
    }

    hideIncubationDialog() {
        const overlay = document.getElementById('incubationOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    showClockSpinAnimation() {
        const screen = document.getElementById('clockSpinScreen');
        if (screen) screen.style.display = 'flex';
    }

    hideClockSpinAnimation() {
        const screen = document.getElementById('clockSpinScreen');
        if (screen) screen.style.display = 'none';
    }

    openSpecOverlay() {
        if (this.specOverlay) this.specOverlay.style.display = 'flex';
    }
}

// ══════════════════════════════════════════════════════════════
// 5. موديول التقييم والتحليل العلمي (QuizEngine)
// ══════════════════════════════════════════════════════════════
class QuizEngine {
    constructor() {
        this.container = document.getElementById('educationalPanel');
        this.score = 0;
        this.currentQ = 0;
        this.questions = [
            {
                q: "ما هو التغير اللوني الذي طرأ على كاشف BTB في الأنبوب 2 (نبات الإيلوديا في الضوء)؟ وما سببه؟",
                options: [
                    "تحول إلى اللون الأزرق بسبب استهلاك CO2 في عملية البناء الضوئي وارتفاع الـ pH.",
                    "تحول إلى اللون الأصفر بسبب إنتاج CO2 في التنفس الخلوي.",
                    "بقي أخضر لعدم حدوث أي تفاعل حيوي.",
                    "تحول إلى اللون الأحمر نتيجة زيادة الحموضة."
                ],
                correct: 0,
                explanation: "في وجود الضوء، يستهلك نبات الإيلوديا ثاني أكسيد الكربون عبر البناء الضوئي بمعدل يفوق إنتاجه في التنفس، مما يقلل حمض الكربونيك ويرفع الرقم الهيدروجيني فيتحول الكاشف للأزرق."
            },
            {
                q: "لماذا تحول الكاشف في الأنبوب 3 (نبات الإيلوديا في الظلام) إلى اللون الأصفر؟",
                options: [
                    "لتوقف البناء الضوئي واستمرار التنفس الخلوي منتجاً CO2 الذي خفض الـ pH.",
                    "لأن الظلام يحفز البناء الضوئي فقط.",
                    "لأن النبات يمتص الأكسجين دون إطلاق ثاني أكسيد الكربون.",
                    "بسبب تفكك كاشف بروموثيمول الأزرق تلقائياً في العتمة."
                ],
                correct: 0,
                explanation: "في غياب الضوء يتوقف البناء الضوئي وتستمر الميتوكوندريا في التنفس الخلوي محررة CO2 الذي يتحد مع الماء مكوناً حمض الكربونيك H2CO3 فينخفض الـ pH ويصبح المحلول حمضياً أصفر."
            },
            {
                q: "ما الغرض من استخدام الأنبوب 1 والأنبوب 4 (بدون نبات الإيلوديا) في التجربة؟",
                options: [
                    "أنابيب ضابطة (Control) لإثبات أن التغير اللوني ناتج عن الكائن الحي فقط.",
                    "لتغذية النباتات في الأنابيب المجاورة.",
                    "لزيادة كمية الضوء المنعكس في المختبر.",
                    "لقياس درجة حرارة المحلول فقط."
                ],
                correct: 0,
                explanation: "المجموعة الضابطة تضمن أن تغيرات الـ pH ناتجة عن النشاط الحيوي لنبات الإيلوديا وليست ناتجة عن الضوء أو الظلام بمفردهما."
            }
        ];
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="edu-content-wrapper">
                <div class="edu-card">
                    <h2><i class="fas fa-microscope"></i> المفاهيم العلمية: البناء الضوئي والتنفس الخلوي</h2>
                    <div class="equation-box">
                        <h3>معادلة البناء الضوئي (Photosynthesis):</h3>
                        <code>6CO₂ + 6H₂O + طاقة ضوئية ➔ C₆H₁₂O₆ + 6O₂</code>
                    </div>
                    <div class="equation-box">
                        <h3>معادلة التنفس الخلوي (Cellular Respiration):</h3>
                        <code>C₆H₁₂O₆ + 6O₂ ➔ 6CO₂ + 6H₂O + طاقة (ATP)</code>
                    </div>
                </div>

                <div class="edu-card quiz-box">
                    <h2><i class="fas fa-award"></i> الاختبار التقييمي التفاعلي</h2>
                    <div id="quizQuestionArea"></div>
                </div>
            </div>
        `;
        this.showQuestion();
    }

    showQuestion() {
        const area = document.getElementById('quizQuestionArea');
        if (!area) return;

        if (this.currentQ >= this.questions.length) {
            area.innerHTML = `
                <div class="quiz-result">
                    <h3>🎉 اكتمل التقييم بنجاح!</h3>
                    <p>درجتك: <strong>${this.score} من ${this.questions.length}</strong></p>
                    <button class="mode-btn active" onclick="location.reload()">إعادة التجربة والتقييم 🔄</button>
                </div>
            `;
            return;
        }

        const q = this.questions[this.currentQ];
        let optionsHtml = '';
        q.options.forEach((opt, idx) => {
            optionsHtml += `
                <button class="quiz-opt-btn" onclick="window.quizEngineInstance.selectAnswer(${idx})">
                    ${opt}
                </button>
            `;
        });

        area.innerHTML = `
            <div class="question-header">السؤال ${this.currentQ + 1} من ${this.questions.length}</div>
            <p class="question-text">${q.q}</p>
            <div class="options-list">${optionsHtml}</div>
            <div id="quizFeedback" class="quiz-feedback"></div>
        `;
    }

    selectAnswer(idx) {
        const q = this.questions[this.currentQ];
        const feedback = document.getElementById('quizFeedback');
        const btns = document.querySelectorAll('.quiz-opt-btn');

        btns.forEach(b => b.disabled = true);

        if (idx === q.correct) {
            this.score++;
            btns[idx].classList.add('correct');
            if (feedback) {
                feedback.className = 'quiz-feedback success';
                feedback.innerHTML = `✓ إجابة صحيحة! ${q.explanation}`;
            }
        } else {
            btns[idx].classList.add('wrong');
            btns[q.correct].classList.add('correct');
            if (feedback) {
                feedback.className = 'quiz-feedback error';
                feedback.innerHTML = `✗ إجابة غير صحيحة. ${q.explanation}`;
            }
        }

        setTimeout(() => {
            this.currentQ++;
            this.showQuestion();
        }, 3000);
    }
}

// ══════════════════════════════════════════════════════════════
// 6. تشغيل وتهيئة التطبيق بالكامل عند تحميل الصفحة
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas3d');
    if (!canvas) return;

    const sceneManager = new SceneManager(canvas);
    const labSetup = new LabSetup(sceneManager.scene);
    const uiOverlay = new UIOverlay();
    const experimentEngine = new ExperimentEngine(sceneManager, labSetup, uiOverlay);
    const quizEngine = new QuizEngine();

    window.quizEngineInstance = quizEngine;
    window.appInstance = {
        scene: sceneManager,
        setup: labSetup,
        engine: experimentEngine,
        ui: uiOverlay
    };

    // Camera control buttons
    const btnResetCam = document.getElementById('btnResetCamera');
    if (btnResetCam) btnResetCam.onclick = () => sceneManager.resetCamera();

    const btnZoomIn = document.getElementById('btnZoomIn');
    if (btnZoomIn) btnZoomIn.onclick = () => sceneManager.zoomIn();

    const btnZoomOut = document.getElementById('btnZoomOut');
    if (btnZoomOut) btnZoomOut.onclick = () => sceneManager.zoomOut();

    const btnResetExp = document.getElementById('btnReset');
    if (btnResetExp) btnResetExp.onclick = () => location.reload();

    // Mode switchers in header
    const btnMode3D = document.getElementById('btnMode3D');
    const btnModeQuiz = document.getElementById('btnModeQuiz');
    const stagePanel = document.getElementById('stagePanel');
    const protocolSidebar = document.getElementById('protocolSidebar');
    const eduPanel = document.getElementById('educationalPanel');

    if (btnMode3D && btnModeQuiz) {
        btnMode3D.onclick = () => {
            btnMode3D.classList.add('active');
            btnModeQuiz.classList.remove('active');
            if (stagePanel) stagePanel.style.display = 'block';
            if (protocolSidebar) protocolSidebar.style.display = 'block';
            if (eduPanel) eduPanel.style.display = 'none';
        };

        btnModeQuiz.onclick = () => {
            btnModeQuiz.classList.add('active');
            btnMode3D.classList.remove('active');
            if (stagePanel) stagePanel.style.display = 'none';
            if (protocolSidebar) protocolSidebar.style.display = 'none';
            if (eduPanel) {
                eduPanel.style.display = 'block';
                quizEngine.render();
            }
        };
    }

    sceneManager.startLoop();
});
