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
        this.zoomFrustum = 2.45;
        this.minFrustum = 1.5;
        this.maxFrustum = 4.2;
        const aspect = this.width / this.height;
        this.camera = new THREE.OrthographicCamera(
            -this.zoomFrustum * aspect,
            this.zoomFrustum * aspect,
            this.zoomFrustum,
            -this.zoomFrustum,
            0.1,
            1000
        );

        // Camera position: positioned perfectly centered to show the entire lab bench, shelves, and all equipment
        this.defaultCameraPos = new THREE.Vector3(-0.40, 1.15, 5.0);
        this.defaultLookAt = new THREE.Vector3(-0.40, 1.15, 0);
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
        // Disabling cluttering persistent floating labels so all 3D tools remain completely sharp, visible and unobstructed
        // this.initFloatingLabels();

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
        
        // حساب إطار الكاميرا بدقة لإظهار كامل الطاولة من الرف الأيسر إلى جهاز مقياس الطيف الأيمن
        this.zoomFrustum = Math.max(2.15, Math.min(3.5, 4.35 / aspect));

        this.camera.left = -this.zoomFrustum * aspect;
        this.camera.right = this.zoomFrustum * aspect;
        this.camera.top = this.zoomFrustum;
        this.camera.bottom = -this.zoomFrustum;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    zoomIn() {
        this.zoomFrustum = Math.max(this.minFrustum, this.zoomFrustum - 0.2);
        this.onResize();
        this.checkCameraPanButton();
    }

    zoomOut() {
        this.zoomFrustum = Math.min(this.maxFrustum, this.zoomFrustum + 0.2);
        this.onResize();
        this.checkCameraPanButton();
    }

    resetCamera() {
        this.camera.position.copy(this.defaultCameraPos);
        this.camera.lookAt(this.defaultLookAt);
        this.currentLookAt.copy(this.defaultLookAt);
        this.zoomFrustum = 2.45;
        this.onResize();
        this.checkCameraPanButton();
    }

    checkCameraPanButton() {
        const btn = document.getElementById('btnResetCamera');
        if (btn) {
            const isPanned = this.camera.position.distanceTo(this.defaultCameraPos) > 0.1;
            const isZoomed = Math.abs(this.zoomFrustum - 2.45) > 0.08;
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

        // تهيئة موديولات Clean Architecture
        this.spectroEngine = new (window.SpectroEngine || SpectroEngine)();
        this.tubeEngine = new (window.TubeEngine || TubeEngine)();
        this.modalManager = new (window.ModalManager || ModalManager)(this.spectroEngine, this.uiOverlay);
        this.modalManager.setExperimentEngine(this);

        // تهيئة محرك الرسوميات المتجهية 2D SVG ومحرك السحب والإفلات الناعم
        const SvgSceneClass = window.SvgLabScene || (typeof SvgLabScene !== 'undefined' ? SvgLabScene : null);
        const SvgDragClass = window.SvgDragDrop || (typeof SvgDragDrop !== 'undefined' ? SvgDragDrop : null);

        if (SvgSceneClass && document.getElementById('labSvgContainer')) {
            this.svgScene = new SvgSceneClass('labSvgContainer');
            if (SvgDragClass) {
                this.svgDrag = new SvgDragClass(this.svgScene, this);
            }
        }

        // حالة الأنابيب الأربعة المعملية
        this.tubesState = [
            { index: 1, hasPlant: false, hasStopper: false, shelfStopperIndex: null, hasBox: false, colorHex: '#15803d', phValue: 7.0, rawAbsorbance: 0.48 },
            { index: 2, hasPlant: false, hasStopper: false, shelfStopperIndex: null, hasBox: false, colorHex: '#15803d', phValue: 7.0, rawAbsorbance: 0.48 },
            { index: 3, hasPlant: false, hasStopper: false, shelfStopperIndex: null, hasBox: false, colorHex: '#15803d', phValue: 7.0, rawAbsorbance: 0.48 },
            { index: 4, hasPlant: false, hasStopper: false, shelfStopperIndex: null, hasBox: false, colorHex: '#15803d', phValue: 7.0, rawAbsorbance: 0.48 }
        ];

        // حالة الكيوفيتات الخمس
        this.cuvettesState = {
            'Blank': { id: 'Blank', isFilled: true, isCapped: true, shelfCapIndex: null, rawAbsorbance: this.spectroEngine.blankRawAbsorbance, absorbanceVal: 0.000, phValue: 7.0, colorHex: 'rgba(56,189,248,0.4)', hasBeenMeasured: true },
            '1': { id: '1', isFilled: false, isCapped: false, shelfCapIndex: null, rawAbsorbance: null, absorbanceVal: null, phValue: null, colorHex: null, hasBeenMeasured: false },
            '2': { id: '2', isFilled: false, isCapped: false, shelfCapIndex: null, rawAbsorbance: null, absorbanceVal: null, phValue: null, colorHex: null, hasBeenMeasured: false },
            '3': { id: '3', isFilled: false, isCapped: false, shelfCapIndex: null, rawAbsorbance: null, absorbanceVal: null, phValue: null, colorHex: null, hasBeenMeasured: false },
            '4': { id: '4', isFilled: false, isCapped: false, shelfCapIndex: null, rawAbsorbance: null, absorbanceVal: null, phValue: null, colorHex: null, hasBeenMeasured: false }
        };

        // حالة مواضع السدادات وأغطية الكيوفيتات على الرف (4 خانات مستقلة تماماً 1-to-1)
        this.shelfStoppersState = [true, true, true, true];
        this.shelfCapsState = [true, true, true, true];

        // حالة الماصة P1000
        this.pipetteState = {
            hasFluid: false,
            hasTip: false,
            sourceTubeIndex: null,
            fluidColor: null,
            isSelected: false,
            volume: 200
        };

        // دفتر الملاحظات واختبارات الألوان (أخضر / أصفر / أزرق)
        this.notebookSelections = { 1: null, 2: null, 3: null, 4: null };
        this.completedCuvettesCount = 0;
        this.secondStopTimer = null;
        this.secondStopTriggered = false;

        // حالة مقياس الطيف (مغلق ومطفأ في البداية)
        this.specState = {
            isOn: false,
            isLidOpen: false,
            cuvetteInChamber: null
        };

        this.pipetteVolume = 200;
        this.tempPipetteVol = 200;

        if (this.labSetup && this.labSetup.cuvettes && this.labSetup.cuvettes[0]) {
            this.labSetup.cuvettes[0].userData.rawAbsorbance = this.spectroEngine.blankRawAbsorbance;
            this.labSetup.cuvettes[0].userData.absorbanceVal = 0.000;
        }

        setTimeout(() => this.initPlungerWidget(), 200);
        setTimeout(() => {
            this.syncStoppersState();
            this.syncBoxesState();
            this.syncCuvetteCapsState();
            if (this.svgScene) {
                this.svgScene.updateSpecScreen('OFF');
                this.svgScene.setPipetteVolume(200);
            }
        }, 100);

        if (this.sceneManager && this.sceneManager.canvas) {
            this.initEvents();
        }
    }

    initEvents() {
        if (!this.sceneManager || !this.sceneManager.canvas) return;
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

                // إذا كان الصندوق يغطي أنبوباً، أظهر الأنبوب فوراً عند رفع الصندوق
                // حتى لا يبدو الأنبوب متحركاً أو مختفياً أثناء السحب
                if (obj.userData.type === 'box_draggable' && obj.userData.coveringTubeIndex !== null) {
                    const idx = obj.userData.coveringTubeIndex;
                    const tubeGroup = this.labSetup.tubes[idx - 1].group;
                    tubeGroup.userData.hasBox = false; // نظّف الحالة حتى يعمل إعادة الإسقاط بشكل صحيح
                    this.setTubeVisibility(tubeGroup, true);
                    // لا نُنظف coveringTubeIndex بعد - handleDrop سيقرر بناءً على الموقع النهائي
                }

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
            let hoveredTube = null;
            this.labSetup.tubes.forEach(t => {
                const tPos = t.group.position;
                if (!t.group.userData.hasPlant && getDistXY(obj.position, { x: tPos.x, y: 0.35 }) < 0.45) {
                    hoveredTube = t.group;
                }
            });

            if (hoveredTube) {
                this.showGlowRing(hoveredTube.position.x, 0.02, hoveredTube.position.z, 'blue');
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
            let hoveredTube = null;
            this.labSetup.tubes.forEach(t => {
                const tPos = t.group.position;
                if (!t.group.userData.hasBox && getDistXY(obj.position, { x: tPos.x, y: 0.35 }) < 0.45) {
                    hoveredTube = t.group;
                }
            });

            if (hoveredTube) {
                this.showGlowRing(hoveredTube.position.x, 0.02, hoveredTube.position.z, 'blue');
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
            let snappedTube = null;
            this.labSetup.tubes.forEach(t => {
                const tPos = t.group.position;
                if (!t.group.userData.hasPlant && getDistXY(obj.position, { x: tPos.x, y: 0.35 }) < 0.45) {
                    snappedTube = t;
                }
            });

            if (snappedTube) {
                // إذا كان النبات موضوعاً في أنبوب سابق نحرره
                if (obj.userData.placedInTube !== null && obj.userData.placedInTube !== snappedTube.index) {
                    this.labSetup.tubes[obj.userData.placedInTube - 1].group.userData.hasPlant = false;
                }
                const tPos = snappedTube.group.position;
                obj.position.set(tPos.x, 0.08, tPos.z + 0.01);
                snappedTube.group.userData.hasPlant = true;
                obj.userData.placedInTube = snappedTube.index;
                this.uiOverlay.showToast(`تم وضع نبات الإيلوديا في الأنبوب ${snappedTube.index}`);
                this.checkPhase1Progress();
            } else {
                if (obj.userData.placedInTube !== null) {
                    const prevIdx = obj.userData.placedInTube;
                    this.labSetup.tubes[prevIdx - 1].group.userData.hasPlant = false;
                    obj.userData.placedInTube = null;
                }
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
            let snappedTube = null;
            this.labSetup.tubes.forEach(t => {
                const tPos = t.group.position;
                if (!t.group.userData.hasBox && getDistXY(obj.position, { x: tPos.x, y: 0.35 }) < 0.45) {
                    snappedTube = t;
                }
            });

            if (snappedTube) {
                // إذا كان الصندوق يغطي أنبوباً سابقاً نحرره
                if (obj.userData.coveringTubeIndex !== null && obj.userData.coveringTubeIndex !== snappedTube.index) {
                    const prev = obj.userData.coveringTubeIndex;
                    this.labSetup.tubes[prev - 1].group.userData.hasBox = false;
                    this.setTubeVisibility(this.labSetup.tubes[prev - 1].group, true);
                }
                const tPos = snappedTube.group.position;
                obj.position.set(tPos.x, 0.0, tPos.z + 0.02);
                snappedTube.group.userData.hasBox = true;
                obj.userData.coveringTubeIndex = snappedTube.index;
                this.setTubeVisibility(snappedTube.group, false);
                this.uiOverlay.showToast(`تم تغطية الأنبوب ${snappedTube.index} بصندوق عزل الضوء`);
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
        let isLit = true;
        if (this.svgScene) {
            isLit = this.svgScene.toggleLamps();
        }
        if (this.labSetup && this.labSetup.lamps) {
            this.labSetup.lamps.forEach(lamp => {
                lamp.isOn = isLit;
                lamp.light.intensity = isLit ? 2.5 : 0;
                lamp.bulbMat.emissive.setHex(isLit ? 0xfef08a : 0x000000);
            });
        }

        this.uiOverlay.showToast(isLit ? "💡 تم تشغيل مصابيح الإضاءة" : "تم إطفاء المصابيح وتعتيم المعمل 🌙");

        if (this.currentStep === '1e' && isLit) {
            this.markStepCompleted('1e');
            this.advanceStep('1f');
            setTimeout(() => {
                this.openWait12HoursModal();
            }, 600);
        } else if (this.currentStep === '2a' && !isLit) {
            this.markStepCompleted('2a');
            this.advanceStep('2b');
            this.uiOverlay.showToast("تم إطفاء المصابيح بنجاح! انتقل للخطوة 2ب وأزل الصناديق الكرتونية.");
            this.checkPhase2Progress();
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
            targetCuv.userData.sourceTubeIndex = pip.fluidSourceTubeIndex;

            // توريث قيم الامتصاصية والحموضة المقاسة من الأنبوب المصدر
            const srcTube = this.labSetup.tubes[pip.fluidSourceTubeIndex - 1];
            if (srcTube && srcTube.group && srcTube.group.userData) {
                targetCuv.userData.phValue = srcTube.group.userData.phValue;
                targetCuv.userData.absorbanceVal = srcTube.group.userData.absorbanceVal;
                targetCuv.userData.rawAbsorbance = srcTube.group.userData.rawAbsorbance;
            }

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

    toggleSpecLid() {
        this.specState.isLidOpen = !this.specState.isLidOpen;
        if (this.svgScene) this.svgScene.setSpecLidState(this.specState.isLidOpen);
        if (this.labSetup && this.labSetup.specLidGroup) {
            this.labSetup.specLidGroup.rotation.x = this.specState.isLidOpen ? -Math.PI / 2.2 : 0;
            this.labSetup.specGroup.userData.isLidOpen = this.specState.isLidOpen;
        }

        if (this.specState.isLidOpen) {
            this.uiOverlay.showToast("تم فتح غطاء حجرة مقياس الطيف الضوئي");
            // علامة إتمام فتح الغطاء للخطوات ذات الصلة فقط عند الوصول إليها بترتيبها النظامي
            if (this.currentStep === '3d') {
                this.markStepCompleted('3d');
                this.advanceStep('3e');
            } else if (this.currentStep === '3i') {
                this.markStepCompleted('3i');
                this.advanceStep('3j');
            } else if (this.currentStep === '3m') {
                this.markStepCompleted('3m');
                this.advanceStep('3n');
            }
        } else {
            this.uiOverlay.showToast("تم إغلاق غطاء حجرة مقياس الطيف الضوئي");
            const cuv = this.specState.cuvetteInChamber || (this.labSetup?.specGroup?.userData?.cuvetteInChamber ? { id: this.labSetup.specGroup.userData.cuvetteInChamber.userData.id, ...this.labSetup.specGroup.userData.cuvetteInChamber.userData } : null);
            const res = this.spectroEngine.measureAbsorbance(cuv ? { userData: cuv } : null);
            
            if (this.svgScene) this.svgScene.updateSpecScreen(res.text);
            const screen = document.getElementById('specScreen');
            if (screen) screen.textContent = res.text === 'OFF' ? 'OFF' : `${res.text} Abs`;

            if (this.modalManager) this.modalManager.refreshSpecModalDisplay();

            if (cuv && cuv.id !== 'Blank') {
                this.recordCuvetteAbsorbance(cuv.id);
            }

            if (this.currentStep === '3g') {
                this.markStepCompleted('3g');
                this.advanceStep('3h');
            } else if (this.currentStep === '3k' || this.currentStep === '3l') {
                this.markStepCompleted('3k');
                this.recordCuvetteAbsorbance('1');
                this.markStepCompleted('3l');
                setTimeout(() => {
                    this.advanceStep('3m');
                }, 400);
            } else if (this.currentStep === '3o' || this.currentStep === '3p') {
                this.markStepCompleted('3o');
                this.recordCuvetteAbsorbance('2');
                this.markStepCompleted('3p');
                setTimeout(() => {
                    this.advanceStep('3q');
                }, 400);
            } else if (this.currentStep === '3q') {
                if (cuv && (cuv.id === '3' || cuv.id === '4')) {
                    this.recordCuvetteAbsorbance(cuv.id);
                    const c3Done = Boolean(this.cuvettesState['3']?.hasBeenMeasured);
                    const c4Done = Boolean(this.cuvettesState['4']?.hasBeenMeasured);
                    if (c3Done && c4Done) {
                        this.markStepCompleted('3q');
                        this.advanceStep('3r');
                    }
                }
            }
            this.checkPhase3Progress();
        }
    }

    onSpecSlotClick() {
        if (!this.specState.isLidOpen) {
            this.toggleSpecLid();
        } else if (this.specState.cuvetteInChamber) {
            this.removeCuvetteFromChamber();
        }
    }

    insertCuvetteIntoChamber(cuvId, draggedElement = null) {
        const cuvData = this.cuvettesState[cuvId] || {};
        this.specState.cuvetteInChamber = { id: cuvId, ...cuvData };

        // إخفاء الكيوفيت من الحامل
        const el = draggedElement || document.getElementById(`cuvette_obj_${cuvId}`);
        if (el) el.style.display = 'none';

        // تحديد لون السائل للعرض داخل فتحة الجهاز
        let fluidColor = 'rgba(56, 189, 248, 0.6)'; // لون الكيوفيت الضابطة الافتراضي (ماء شفاف)
        if (cuvId !== 'Blank') {
            const cuvFluid = document.getElementById(`cuvette_fluid_${cuvId}`);
            if (cuvFluid && cuvFluid.getAttribute('fill') && cuvFluid.getAttribute('fill') !== 'none') {
                fluidColor = cuvFluid.getAttribute('fill');
            } else if (cuvData.fluidColor) {
                fluidColor = cuvData.fluidColor;
            }
        }

        if (this.svgScene) {
            this.svgScene.setCuvetteInChamberVisible(true, cuvId, fluidColor);
        }

        if (this.audioManager) this.audioManager.playPop();
        this.uiOverlay.showToast(`تم وضع الكيوفيت ${cuvId === 'Blank' ? 'الضابطة' : cuvId} في حجرة مقياس الطيف الضوئي ✓`);

        if (this.currentStep === '3e' || this.currentStep === '3f') {
            this.markStepCompleted('3e');
            this.markStepCompleted('3f');
            this.advanceStep('3g');
        } else if (this.currentStep === '3j' && cuvId === '1') {
            this.markStepCompleted('3j');
            this.advanceStep('3k');
        } else if (this.currentStep === '3n' && cuvId === '2') {
            this.markStepCompleted('3n');
            this.advanceStep('3o');
        } else if (this.currentStep === '3q') {
            this.uiOverlay.showToast(`تم وضع الكيوفيت ${cuvId} في الحجرة - أغلق الغطاء لتسجيل الامتصاصية تلقائياً 📉`);
        }
        this.checkPhase3Progress();
    }

    removeCuvetteFromChamber() {
        if (!this.specState.isLidOpen) {
            this.uiOverlay.showToast("⚠️ لا يمكن إخراج الكيوفيت والغطاء مغلق! افتح غطاء الحجرة أولاً.");
            return;
        }
        const cuv = this.specState.cuvetteInChamber;
        if (!cuv) return;

        // إرجاع الكيوفيت إلى الحامل وإظهارها
        const cuvObj = document.getElementById(`cuvette_obj_${cuv.id}`);
        if (cuvObj) {
            cuvObj.style.display = 'block';
            cuvObj.setAttribute('transform', 'translate(0, 0)');
        }

        if (this.svgScene) {
            this.svgScene.setCuvetteInChamberVisible(false);
        }

        const cuvId = cuv.id;
        this.specState.cuvetteInChamber = null;

        // إبقاء القراءة دائماً عند 0.000 عند إخراج الكيوفيت الضابطة أو أي عينة وفق المعيار العلمي
        if (this.specState.isOn) {
            if (this.svgScene) this.svgScene.updateSpecScreen("0.000");
            const screen = document.getElementById('specScreen');
            if (screen) screen.textContent = "0.000 Abs";
            if (this.modalManager) this.modalManager.refreshSpecModalDisplay();
        }

        if (this.audioManager) this.audioManager.playPop();
        this.uiOverlay.showToast(`تمت إزالة الكيوفيت ${cuvId === 'Blank' ? 'الضابطة' : cuvId} وإعادتها إلى الحامل ✓`);

        if (this.currentStep === '3i') {
            this.markStepCompleted('3i');
            this.advanceStep('3j');
        } else if (this.currentStep === '3j' && cuvId === 'Blank') {
            this.uiOverlay.showToast("تم إخراج الكيوفيت الضابطة (الامتصاصية 0.000) - ضع الآن الكيوفيت 1 في الحجرة");
        } else if (this.currentStep === '3m') {
            this.markStepCompleted('3m');
            this.advanceStep('3n');
        } else if (this.currentStep === '3r') {
            this.markStepCompleted('3r');
            // الانتقال التلقائي الفوري لصفحة النتائج والتحليل العلمي
            setTimeout(() => {
                if (window.photosynthesisLab && window.photosynthesisLab.openResultsSection) {
                    window.photosynthesisLab.openResultsSection();
                } else {
                    const m = document.getElementById('resultsModal');
                    if (m) m.style.display = 'flex';
                }
                this.uiOverlay.showToast("اكتملت جميع خطوات وقياسات التجربة بنجاح! 🎉 جاري عرض جدول النتائج والتحليل العلمي.");
            }, 600);
        }

        this.checkPhase3Progress();
    }

    toggleSpecPower() {
        const newState = !this.specState.isOn;
        this.specState.isOn = newState;
        this.spectroEngine.isOn = newState;
        const cuv = this.specState.cuvetteInChamber;
        const res = this.spectroEngine.measureAbsorbance(cuv ? { userData: cuv } : null);
        if (this.svgScene) this.svgScene.updateSpecScreen(res.text);

        const screen = document.getElementById('specScreen');
        if (screen) screen.textContent = res.text === 'OFF' ? 'OFF' : `${res.text} Abs`;

        if (this.modalManager) this.modalManager.refreshSpecModalDisplay();
        this.uiOverlay.showToast(this.specState.isOn ? "جهاز مقياس الطيف: قيد التشغيل (ON) 🟢" : "تم إطفاء جهاز مقياس الطيف (OFF) 🔴");

        if (this.specState.isOn) {
            this.markStepCompleted('3a');
            if (this.currentStep === '3a' || !this.currentStep || !this.currentStep.startsWith('3')) {
                this.advanceStep('3b');
            }
        }
    }

    zeroSpectrophotometer() {
        const cuv = this.specState.cuvetteInChamber;
        const isBlank = cuv && cuv.id === 'Blank';
        this.spectroEngine.zero(isBlank);
        const res = this.spectroEngine.measureAbsorbance(cuv ? { userData: cuv } : null);
        if (this.svgScene) this.svgScene.updateSpecScreen(res.text);

        const screen = document.getElementById('specScreen');
        if (screen) screen.textContent = res.text === 'OFF' ? 'OFF' : `${res.text} Abs`;

        if (this.modalManager) this.modalManager.refreshSpecModalDisplay();
        this.uiOverlay.showToast(isBlank ? "تم تصفير جهاز مقياس الطيف بالأنبوبة الضابطة بنجاح (0.000 Abs) ✓" : "تنبيه: تم التصفير بدون الأنبوبة الضابطة!");
        
        if (isBlank) {
            this.markStepCompleted('3h');
            if (this.currentStep === '3h') this.advanceStep('3i');
        }
    }

    attachPipetteTip() {
        this.pipetteState.hasTip = true;
        const tip = document.getElementById('pipette_tip');
        if (tip) tip.style.display = 'block';
        this.uiOverlay.showToast("تم تركيب رأس ماصة جديد P1000 ✓");
        if (this.currentStep === '2f') this.advanceStep('2g');
    }

    toggleSpectrophotometerLid() {
        this.toggleSpecLid();
    }

    toggleSpectrophotometerPower() {
        this.toggleSpecPower();
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

    // مزامنة حالة السدادات في المعمل بقانون حفظ الأدوات (1-to-1): بالضبط 4 سدادات في المعمل
    syncStoppersState(animatedIdx = null) {
        for (let i = 0; i < 4; i++) {
            const hasStopper = Boolean(this.tubesState[i] && this.tubesState[i].hasStopper);
            // 1. حالة السدادة على الأنبوب (أنبوب i+1)
            if (this.svgScene) {
                this.svgScene.setTubeStopperVisible(i + 1, hasStopper);
            } else {
                const ts = document.getElementById(`tube_stopper_${i + 1}`);
                if (ts) {
                    ts.style.display = hasStopper ? 'block' : 'none';
                    if (!hasStopper) ts.setAttribute('transform', 'translate(14, -2)');
                }
            }
        }

        // 2. حالة السدادات في الرف (4 خانات مستقلة تماماً 1-to-1 لمنع أي إزاحة عند أخذ سدادة من الوسط)
        if (!this.shelfStoppersState) {
            this.shelfStoppersState = [true, true, true, true];
        }
        for (let i = 0; i < 4; i++) {
            const shelfStopper = document.getElementById(`shelf_stopper_group_${i}`);
            const isVisible = Boolean(this.shelfStoppersState[i]);
            if (this.svgScene && this.svgScene.setShelfStopperVisible) {
                this.svgScene.setShelfStopperVisible(i, isVisible);
            }
            if (shelfStopper) {
                shelfStopper.setAttribute('transform', `translate(${25 + i * 40}, 50)`);
                shelfStopper.style.display = isVisible ? 'block' : 'none';
                if (isVisible && animatedIdx === i) {
                    shelfStopper.classList.remove('shelf-item-returned');
                    void shelfStopper.offsetWidth;
                    shelfStopper.classList.add('shelf-item-returned');
                    setTimeout(() => {
                        shelfStopper.classList.remove('shelf-item-returned');
                    }, 600);
                }
            }
        }
    }

    // مزامنة حالة الصندوقين الكرتونيين في المعمل بقانون حفظ الأدوات (1-to-1)
    syncBoxesState(animatedIdx = null) {
        for (let i = 0; i < 4; i++) {
            const hasBox = Boolean(this.tubesState[i] && this.tubesState[i].hasBox);
            // 1. حالة الصندوق على الأنبوب (أنبوب i+1)
            if (this.svgScene) {
                this.svgScene.setTubeBoxVisible(i + 1, hasBox);
            } else {
                const tb = document.getElementById(`tube_box_${i + 1}`);
                if (tb) {
                    tb.style.display = hasBox ? 'block' : 'none';
                    if (!hasBox) tb.setAttribute('transform', 'translate(-11, -30)');
                }
            }
        }

        // 2. حالة الصندوقين في الرف: عند وضع صندوق واحد يظل الصندوق الثاني ظاهراً على الرف
        const placedBoxesCount = this.tubesState.filter(t => t.hasBox).length;
        const box1 = document.getElementById('box_source_1');
        const box2 = document.getElementById('box_source_2');

        if (box1) {
            box1.setAttribute('transform', 'translate(435, 95)');
            box1.style.display = placedBoxesCount === 0 ? 'block' : 'none';
        }
        if (box2) {
            box2.setAttribute('transform', 'translate(495, 95)');
            box2.style.display = placedBoxesCount < 2 ? 'block' : 'none';
        }

        if (animatedIdx !== null) {
            const returnedBox = (placedBoxesCount === 1) ? box2 : (placedBoxesCount === 0 ? box1 : null);
            if (returnedBox) {
                returnedBox.classList.remove('shelf-item-returned');
                void returnedBox.offsetWidth;
                returnedBox.classList.add('shelf-item-returned');
                setTimeout(() => {
                    returnedBox.classList.remove('shelf-item-returned');
                }, 600);
            }
        }
    }

    applyIncubationResults() {
        // إذا لم يكن المستخدم قد وضع نباتات (مثلاً انتقل مباشرة للمرحلة الثانية)، نطبق التوزيع المعياري المعتمد للتجربة
        const hasAnyPlant = this.tubesState.some(t => t.hasPlant);
        if (!hasAnyPlant) {
            // الأنبوب 1: بدون نبات، بدون صندوق -> أخضر (ضابطة ضوء)
            this.tubesState[0].hasPlant = false;
            this.tubesState[0].hasBox = false;

            // الأنبوب 2: بدون نبات، مع صندوق -> أخضر (ضابطة ظلام)
            this.tubesState[1].hasPlant = false;
            this.tubesState[1].hasBox = true;

            // الأنبوب 3: نبات فقط -> أزرق (بناء ضوئي)
            this.tubesState[2].hasPlant = true;
            this.tubesState[2].hasBox = false;

            // الأنبوب 4: نبات و صندوق -> أصفر (تنفس خلوي)
            this.tubesState[3].hasPlant = true;
            this.tubesState[3].hasBox = true;

            if (this.svgScene) {
                this.svgScene.setTubePlantVisible(1, false);
                this.svgScene.setTubePlantVisible(2, false);
                this.svgScene.setTubePlantVisible(3, true);
                this.svgScene.setTubePlantVisible(4, true);
            }
        }

        // الأنابيب الأربعة بعد فترة الحضانة 12 ساعة تكون جميعها مغلقة بالسدادات وفق التجربة العلمية
        this.tubesState.forEach((t, i) => {
            t.hasStopper = true;
            t.shelfStopperIndex = i;
        });
        this.shelfStoppersState = [false, false, false, false];

        // مزامنة حالة السدادات والصناديق في المعمل بدقة متناهية وفق قانون حفظ الأدوات (1-to-1)
        this.syncStoppersState();
        this.syncBoxesState();

        // ═══════════════════════════════════════════════════════════════
        // القاعدة العلمية الصارمة:
        // 1. نبات و صندوق -> أصفر (#ca8a04, pH ~ 6.2, Abs ~ 0.125)
        // 2. نبات فقط (بدون صندوق) -> أزرق (#1d4ed8, pH ~ 7.8, Abs ~ 0.970)
        // 3. من غير نبات (مع صندوق أو بدونه) -> أخضر (#15803d, pH ~ 7.0, Abs ~ 0.480)
        // ═══════════════════════════════════════════════════════════════
        this.tubesState.forEach((t, i) => {
            const hasPlant = Boolean(t.hasPlant);
            const hasBox = Boolean(t.hasBox);
            const noise = (Math.floor(Math.random() * 41) - 20) * 0.001; // ±0.020 variation

            if (hasPlant && hasBox) {
                // نبات و صندوق -> أصفر
                t.colorHex = '#ca8a04';
                t.phValue = 6.2;
                t.absorbanceVal = parseFloat((0.125 + noise).toFixed(3));
            } else if (hasPlant && !hasBox) {
                // نبات فقط -> أزرق
                t.colorHex = '#1d4ed8';
                t.phValue = 7.8;
                t.absorbanceVal = parseFloat((0.970 + noise).toFixed(3));
            } else {
                // من غير نبات -> أخضر
                t.colorHex = '#15803d';
                t.phValue = 7.0;
                const base = hasBox ? 0.510 : 0.480;
                t.absorbanceVal = parseFloat((base + noise).toFixed(3));
            }

            const blankAbs = (this.spectroEngine && this.spectroEngine.blankRawAbsorbance) || 0.440;
            t.rawAbsorbance = parseFloat((t.absorbanceVal + blankAbs).toFixed(3));

            // تحديث لون السائل فوراً في رسم الـ SVG المعملي
            if (this.svgScene) {
                this.svgScene.updateTubeFluid(t.index, t.colorHex);
            }

            // تحديث بيانات الكيوفيت المقابلة
            const cuvKey = String(t.index);
            if (this.cuvettesState && this.cuvettesState[cuvKey]) {
                this.cuvettesState[cuvKey].phValue = t.phValue;
                this.cuvettesState[cuvKey].absorbanceVal = t.absorbanceVal;
                this.cuvettesState[cuvKey].rawAbsorbance = t.rawAbsorbance;
                this.cuvettesState[cuvKey].colorHex = t.colorHex;
            }

            // تحديث مجسم السائل ثلاثي الأبعاد إن وجد
            if (this.labSetup && this.labSetup.tubes && this.labSetup.tubes[i]) {
                const hexNum = parseInt(t.colorHex.replace('#', '0x'), 16);
                if (this.labSetup.tubes[i].fluidMat && this.labSetup.tubes[i].fluidMat.color) {
                    this.labSetup.tubes[i].fluidMat.color.setHex(hexNum);
                }
                this.labSetup.tubes[i].group.userData.phValue = t.phValue;
                this.labSetup.tubes[i].group.userData.absorbanceVal = t.absorbanceVal;
                this.labSetup.tubes[i].group.userData.rawAbsorbance = t.rawAbsorbance;
                this.labSetup.tubes[i].group.userData.evaluatedColor = hexNum;
            }
        });

        // رسالة ديناميكية واضحة تصف نتائج الأنابيب
        const blueCount = this.tubesState.filter(t => t.colorHex === '#1d4ed8').length;
        const yellowCount = this.tubesState.filter(t => t.colorHex === '#ca8a04').length;
        const greenCount = this.tubesState.filter(t => t.colorHex === '#15803d').length;
        this.uiOverlay.showToast(
            `نتائج الحضانة: ${blueCount > 0 ? `${blueCount} أزرق (نبات فقط) ` : ''}${yellowCount > 0 ? `${yellowCount} أصفر (نبات وصندوق) ` : ''}${greenCount > 0 ? `${greenCount} أخضر (بدون نبات)` : ''}`
        );
        this.advanceStep('2a');
    }

    markStepCompleted(stepKey) {
        // التحقق الصارم من الترتيب التسلسلي للخطوات: لا يجوز وسم أي خطوة كمكتملة ما لم تكتمل الخطوات السابقة لها في نفس المرحلة
        const stepSequences = {
            1: ['1a', '1b', '1c', '1d', '1e', '1f'],
            2: ['2a', '2b', '2c', '2d', '2e', '2g', '2h', '2i', '2j', '2k', '2l', '2m', '2n'],
            3: ['3a', '3b', '3c', '3d', '3e', '3f', '3g', '3h', '3i', '3j', '3k', '3l', '3m', '3n', '3o', '3p', '3q', '3r']
        };

        const phase = parseInt(stepKey.charAt(0), 10);
        const seq = stepSequences[phase];
        if (seq) {
            const idx = seq.indexOf(stepKey);
            if (idx > 0) {
                // التأكد من اكتمال كافة الخطوات السابقة في هذه المرحلة
                for (let i = 0; i < idx; i++) {
                    const prevKey = seq[i];
                    const prevCard = document.getElementById(`step_${prevKey}`);
                    const isPrevDone = prevCard && prevCard.classList.contains('completed');
                    if (!isPrevDone) {
                        // خطوة سابقة لم تكتمل بعد! منع وسم هذه الخطوة إطلاقاً
                        return false;
                    }
                }
            }
        }

        const card = document.getElementById(`step_${stepKey}`);
        if (card) {
            card.classList.add('completed');
            card.classList.remove('locked');
            const ind = card.querySelector('.step-indicator');
            if (ind) {
                ind.innerHTML = '<i class="fas fa-check check-icon" style="color: #ffffff;"></i>';
            }
        }

        // الانتقال التلقائي الفوري بين المراحل عند إنجاز آخر خطوة في كل مرحلة:
        if (stepKey === '1f') {
            setTimeout(() => {
                if (this.currentPhase === 1) {
                    this.switchPhase(2);
                    this.advanceStep('2a');
                }
            }, 500);
        } else if (stepKey === '2n') {
            setTimeout(() => {
                if (this.currentPhase === 2) {
                    this.switchPhase(3);
                    this.advanceStep('3a');
                    this.uiOverlay.showToast("اكتملت المرحلة الثانية بنجاح! 🎉 تم الانتقال للمرحلة الثالثة: مقياس الطيف الضوئي.");
                }
            }, 500);
        } else if (stepKey === '3r') {
            setTimeout(() => {
                if (window.photosynthesisLab && window.photosynthesisLab.openResultsSection) {
                    window.photosynthesisLab.openResultsSection();
                } else {
                    const m = document.getElementById('resultsModal');
                    if (m) m.style.display = 'flex';
                }
                this.uiOverlay.showToast("اكتملت جميع خطوات وقياسات التجربة بنجاح! 🎉 جاري عرض جدول النتائج والتحليل العلمي.");
            }, 600);
        }
        return true;
    }

    enforceStepOrderIntegrity() {
        const stepSequences = {
            1: ['1a', '1b', '1c', '1d', '1e', '1f'],
            2: ['2a', '2b', '2c', '2d', '2e', '2g', '2h', '2i', '2j', '2k', '2l', '2m', '2n'],
            3: ['3a', '3b', '3c', '3d', '3e', '3f', '3g', '3h', '3i', '3j', '3k', '3l', '3m', '3n', '3o', '3p', '3q', '3r']
        };
        [1, 2, 3].forEach(phase => {
            const seq = stepSequences[phase];
            let hasIncomplete = false;
            for (const key of seq) {
                const card = document.getElementById(`step_${key}`);
                const isDone = card && card.classList.contains('completed');
                if (!isDone) {
                    hasIncomplete = true;
                } else if (hasIncomplete) {
                    // وُسمت هذه الخطوة قبل إتمام ما قبلها -> إلغاء التحديد فوراً واسترجاع الحرف الأصلي
                    this.unmarkStepCompleted(key);
                }
            }
        });
    }

    unmarkStepCompleted(stepKey) {
        const card = document.getElementById(`step_${stepKey}`);
        if (card) {
            card.classList.remove('completed');
            const ind = card.querySelector('.step-indicator');
            const letters = {
                '1a': 'أ', '1b': 'ب', '1c': 'ج', '1d': 'د', '1e': 'هـ', '1f': 'و',
                '2a': 'أ', '2b': 'ب', '2c': 'ج', '2d': 'د', '2e': 'هـ',
                '2g': 'و', '2h': 'ز', '2i': 'ح', '2j': 'ط', '2k': 'ي', '2l': 'ك',
                '2m': 'ل', '2n': 'م',
                '3a': 'أ', '3b': 'ب', '3c': 'ج', '3d': 'د', '3e': 'هـ', '3f': 'و', '3g': 'ز', '3h': 'ح',
                '3i': 'ط', '3j': 'ي', '3k': 'ك', '3l': 'ل', '3m': 'م', '3n': 'ن',
                '3o': 'س', '3p': 'ع', '3q': 'ف', '3r': 'ص'
            };
            if (ind && letters[stepKey]) {
                ind.textContent = letters[stepKey];
            }
        }
    }

    recordCuvetteAbsorbance(cuvId) {
        if (!cuvId || cuvId === 'Blank') return '0.000';
        const cuv = this.cuvettesState[cuvId] || (this.labSetup?.cuvettes?.find(c => c.userData?.id === cuvId)?.userData) || { id: cuvId };
        const meas = this.spectroEngine.measureAbsorbance({ userData: cuv });
        cuv.hasBeenMeasured = true;
        cuv.recordedAbs = meas.text;
        if (this.cuvettesState[cuvId]) {
            this.cuvettesState[cuvId].hasBeenMeasured = true;
            this.cuvettesState[cuvId].recordedAbs = meas.text;
        }

        const cell = document.getElementById(`abs_res_${cuvId}`);
        if (cell) cell.textContent = meas.text;
        const setCell = document.getElementById(`set_abs_${cuvId}`) || document.getElementById(`set_abs_${cuvId}_php`);
        if (setCell) setCell.textContent = meas.text;
        const q5Cell = document.getElementById(`q5_disp_s${cuvId}`);
        if (q5Cell) q5Cell.textContent = meas.text;

        if (this.modalManager) this.modalManager.refreshSamplesTable();
        this.uiOverlay.showToast(`تم تسجيل امتصاصية الكيوفيت ${cuvId} (${meas.text} Abs) في جدول النتائج تلقائياً ✓`);
        return meas.text;
    }

    checkPhase1Progress() {
        if (this.currentPhase !== 1) return;

        // ═══════════════════════════════════════════════════════════════
        // التحقق الدقيق من شروط المرحلة الأولى:
        // 1. نباتان على الأقل (plantsOk: plantCount >= 2)
        // 2. سد جميع الأنابيب الأربعة دون استثناء (stoppersOk: stopperCount === 4)
        // 3. صندوقان لحجب الضوء (boxesOk: boxCount >= 2)
        // ═══════════════════════════════════════════════════════════════
        const plantCount   = this.tubesState.filter(t => t.hasPlant).length;
        const plantsOk     = plantCount >= 2;
        const stopperCount = this.tubesState.filter(t => t.hasStopper).length;
        const stoppersOk   = stopperCount === 4; // صارم: يجب سد الـ 4 أنابيب بالكامل
        const boxCount     = this.tubesState.filter(t => t.hasBox).length;
        const boxesOk      = boxCount >= 2;

        // تسجيل إنجاز الخطوات وفق الشروط الصارمة:
        // الخطوة 1ب: وضع نباتين
        if (plantsOk) this.markStepCompleted('1b');
        else this.unmarkStepCompleted('1b');

        // الخطوة 1ج: سد الأنابيب الأربعة بالسدادات (تعتمد على إنجاز الخطوة السابقة)
        if (plantsOk && stoppersOk) this.markStepCompleted('1c');
        else this.unmarkStepCompleted('1c');

        // الخطوة 1د (الصناديق): لا تُحدد صح إلا بعد اكتمال الخطوات التي فوقها (النباتات والسدادات الـ 4 مع الصناديق)
        if (plantsOk && stoppersOk && boxesOk) this.markStepCompleted('1d');
        else this.unmarkStepCompleted('1d');

        // إدارة انتقال الخطوات النشطة والتوجيه للمستخدم بسلاسة:
        if (this.currentStep === '1b') {
            if (plantsOk) {
                if (stoppersOk && boxesOk) {
                    this.advanceStep('1e');
                    this.uiOverlay.showToast("اكتملت جميع المتطلبات السابقة بنجاح ✓ الآن انقر على مفتاح الإضاءة لتشغيل المصابيح (الخطوة 1هـ).");
                } else if (stoppersOk) {
                    this.advanceStep('1d');
                    this.uiOverlay.showToast("اكتملت النباتات وسد الأنابيب ✓ الآن غطِّ أنبوبين بصناديق حجب الضوء (الخطوة 1د).");
                } else {
                    this.advanceStep('1c');
                    this.uiOverlay.showToast("اكتملت الخطوة 1ب بنجاح ✓ الآن اسحب السدادات المطاطية وسد الأنابيب الأربعة (الخطوة 1ج).");
                }
            } else if (plantCount === 1) {
                this.uiOverlay.showToast(`تم وضع نبات في أنبوب (1 من 2). أضف نباتاً ثانياً في أنبوب آخر.`);
            }
        } else if (this.currentStep === '1c') {
            if (stoppersOk) {
                if (boxesOk) {
                    this.advanceStep('1e');
                    this.uiOverlay.showToast("اكتمل سد الأنابيب وحجبها بالصناديق ✓ الآن انقر على مفتاح الإضاءة الجداري لتشغيل المصابيح (الخطوة 1هـ).");
                } else {
                    this.advanceStep('1d');
                    this.uiOverlay.showToast("اكتمل سد جميع الأنابيب الأربعة بنجاح (4 من 4) ✓ الآن غطِّ أنبوبين بصناديق حجب الضوء (الخطوة 1د).");
                }
            } else {
                this.uiOverlay.showToast(`تم سد الأنبوب بالسدادة (${stopperCount} من 4 مكتملة). سد باقي الأنابيب (${4 - stopperCount} متبقية).`);
            }
        } else if (this.currentStep === '1d') {
            if (!stoppersOk) {
                this.advanceStep('1c');
                this.uiOverlay.showToast(`⚠️ تنبيه: نقص في السدادات (${stopperCount} من 4). يجب سد كافة الأنابيب الـ 4 أولاً.`);
            } else if (boxesOk) {
                this.advanceStep('1e');
                this.uiOverlay.showToast("اكتمل حجب الضوء بصندوقين ✓ الآن انقر على مفتاح الإضاءة الجداري لتشغيل المصابيح (الخطوة 1هـ).");
            } else if (boxCount === 1) {
                this.uiOverlay.showToast(`تم وضع صندوق واحد (1 من 2). ضع الصندوق الثاني لإكمال الخطوة 1د.`);
            }
        }
    }

    checkPhase2Progress() {
        if (this.currentPhase !== 2) return;

        const boxesRemoved    = !this.tubesState.some(t => t.hasBox);
        const stoppersRemoved = this.tubesState.every(t => !t.hasStopper);

        if (boxesRemoved) {
            this.syncBoxesState();
            this.markStepCompleted('2b');
            if (this.currentStep === '2b') {
                this.advanceStep('2c');
                this.uiOverlay.showToast("تمت إزالة الصناديق بنجاح ✓ الخطوة 2ج: اسحب السدادات المطاطية لإزالتها.");
            }
        }

        if (stoppersRemoved) {
            this.syncStoppersState();
            this.markStepCompleted('2c');
            if (this.currentStep === '2c') {
                this.advanceStep('2d');
                this.uiOverlay.showToast("الخطوة 2د: قدّر الرقم الهيدروجيني بالعين وسجله في خيارات الألوان المجاورة للخطوة 📓");
            }
        }

        // التحقق التلقائي من حجم الماصة وتركيب الرأس
        if (this.pipetteVolume && this.pipetteVolume >= 1000) {
            this.markStepCompleted('2e');
        }
        if (this.pipetteState && this.pipetteState.hasTip) {
            this.markStepCompleted('2g');
        }

        // التحقق من ملء وتغطية الكيوفيت 1 والكيوفيتات المتبقية
        // التحقق المرن من ملء وتغطية الكيوفيتات بحرية تامة وبأي ترتيب
        if (this.cuvettesState) {
            const anyFilled = Object.keys(this.cuvettesState).some(k => k !== 'Blank' && this.cuvettesState[k].isFilled);
            if (anyFilled) {
                this.markStepCompleted('2j');
                if (this.currentStep === '2j') {
                    this.advanceStep('2k');
                }
            }
            const anyCapped = Object.keys(this.cuvettesState).some(k => k !== 'Blank' && this.cuvettesState[k].isCapped);
            if (anyCapped) {
                this.markStepCompleted('2l');
                if (this.currentStep === '2l') {
                    this.advanceStep('2m');
                }
            }
        }

        let completedCount = 0;
        for (let i = 1; i <= 4; i++) {
            if (this.cuvettesState[String(i)] && this.cuvettesState[String(i)].isFilled && this.cuvettesState[String(i)].isCapped) {
                completedCount++;
            }
        }
        this.completedCuvettesCount = completedCount;
        const counter = document.getElementById('cuvettesCountText');
        if (counter) counter.textContent = `${completedCount} من 4`;

        if (completedCount >= 4) {
            this.markStepCompleted('2m');
            if (this.currentStep === '2m') {
                this.advanceStep('2n');
            }
        }
    }

    // إدارة نافذة الحضانة 12 ساعة (Wait 12 Hours Modal) - الساعة التناظرية الدوارة
    openWait12HoursModal() {
        const modal = document.getElementById('wait12HoursModal');
        if (!modal) return;
        modal.style.display = 'flex';

        this.waitIsPaused = false;
        this.waitProgress = 0;
        this.initWaitScrubber();
        this.updateClockDisplay(0);

        const badge = document.getElementById('waitStatusBadge');
        if (badge) {
            badge.textContent = "جاري انقضاء فترة الحضانة (12 ساعة)...";
            badge.style.background = "rgba(56, 189, 248, 0.15)";
            badge.style.borderColor = "rgba(56, 189, 248, 0.4)";
            badge.style.color = "#7dd3fc";
        }
        const btnPlay = document.getElementById('btnPlayPauseWait');
        if (btnPlay) btnPlay.textContent = "⏸";

        if (this.waitTimer) clearInterval(this.waitTimer);

        // سرعة دوران واقعية وسلسة (تستغرق ~4 إلى 5 ثوانٍ لإتمام 12 ساعة كاملة)
        this.waitTimer = setInterval(() => {
            if (this.waitIsPaused) return;

            this.waitProgress += 0.8;
            if (this.waitProgress >= 100) {
                this.waitProgress = 100;
                this.updateClockDisplay(100);
                clearInterval(this.waitTimer);
                this.waitTimer = null;
                const b = document.getElementById('waitStatusBadge');
                if (b) {
                    b.textContent = "✓ اكتملت فترة الحضانة 12 ساعة بنجاح! 🎉";
                    b.style.background = "rgba(34, 197, 94, 0.25)";
                    b.style.borderColor = "#22c55e";
                    b.style.color = "#4ade80";
                }
                const btn = document.getElementById('btnPlayPauseWait');
                if (btn) btn.textContent = "🔄";
                const finishBtn = document.getElementById('btnFinishWaitStep');
                if (finishBtn) {
                    finishBtn.style.transform = 'scale(1.04)';
                    finishBtn.style.boxShadow = '0 0 18px rgba(249, 115, 22, 0.7)';
                }
                if (this.audioManager) this.audioManager.playChime();
                return;
            }

            this.updateClockDisplay(this.waitProgress);
        }, 35);
    }

    updateClockDisplay(progress) {
        const bar = document.getElementById('waitProgressBar');
        const thumb = document.getElementById('waitProgressThumb');
        const txt = document.getElementById('waitElapsedText');
        const digH = document.getElementById('clockDigitalHours');
        const digM = document.getElementById('clockDigitalMinutes');

        if (bar) bar.style.width = `${progress}%`;
        if (thumb) thumb.style.right = `${100 - progress}%`;

        const totalHours = (progress / 100) * 12;
        const hInt = Math.floor(totalHours);
        const mInt = Math.floor((totalHours - hInt) * 60);

        if (txt) txt.textContent = `${hInt}h / 12h`;
        if (digH) digH.textContent = String(hInt).padStart(2, '0');
        if (digM) digM.textContent = String(mInt).padStart(2, '0');

        // زوايا دوران عقارب الساعة حول المركز (150, 150):
        const hourAngle = progress * 3.6;     // دورة كاملة 360° عند 12 ساعة
        const minuteAngle = progress * 43.2;  // 12 دورة كاملة (دورة لكل ساعة)
        const secondAngle = (progress * 180) % 360;

        const hourHand = document.getElementById('clockHourHand');
        if (hourHand) hourHand.setAttribute('transform', `rotate(${hourAngle.toFixed(1)}, 150, 150)`);

        const minuteHand = document.getElementById('clockMinuteHand');
        if (minuteHand) minuteHand.setAttribute('transform', `rotate(${minuteAngle.toFixed(1)}, 150, 150)`);

        const secondHand = document.getElementById('clockSecondHand');
        if (secondHand) secondHand.setAttribute('transform', `rotate(${secondAngle.toFixed(1)}, 150, 150)`);

        // تحديث قطاع مسار الساعات المنقضية (Wedge)
        const sector = document.getElementById('clockTimeSector');
        if (sector) {
            if (progress <= 0.2) {
                sector.setAttribute('d', 'M 150 150 L 150 54 A 96 96 0 0 1 150 54 Z');
            } else if (progress >= 99.8) {
                sector.setAttribute('d', 'M 150 54 A 96 96 0 1 1 149.99 54 Z');
            } else {
                const rad = (hourAngle * Math.PI) / 180;
                const x = 150 + 96 * Math.sin(rad);
                const y = 150 - 96 * Math.cos(rad);
                const largeArc = hourAngle > 180 ? 1 : 0;
                sector.setAttribute('d', `M 150 150 L 150 54 A 96 96 0 ${largeArc} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`);
            }
        }
    }

    toggleWaitTimer() {
        if (this.waitProgress >= 100) {
            this.openWait12HoursModal();
            return;
        }
        this.waitIsPaused = !this.waitIsPaused;
        const btn = document.getElementById('btnPlayPauseWait');
        if (btn) btn.textContent = this.waitIsPaused ? "▶" : "⏸";
    }

    initWaitScrubber() {
        const track = document.getElementById('waitProgressTrack');
        if (!track || track.dataset.scrubberInit) return;
        track.dataset.scrubberInit = 'true';
        track.addEventListener('click', (e) => {
            const rect = track.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = 1 - (clickX / rect.width); // RTL
            const clamped = Math.max(0, Math.min(1, ratio));
            this.waitProgress = clamped * 100;
            this.updateClockDisplay(this.waitProgress);
            if (this.waitProgress >= 100) {
                if (this.waitTimer) clearInterval(this.waitTimer);
                this.waitTimer = null;
                const badge = document.getElementById('waitStatusBadge');
                if (badge) {
                    badge.textContent = "✓ اكتملت فترة الحضانة 12 ساعة بنجاح! 🎉";
                    badge.style.background = "rgba(34, 197, 94, 0.25)";
                    badge.style.borderColor = "#22c55e";
                    badge.style.color = "#4ade80";
                }
                const btnPlay = document.getElementById('btnPlayPauseWait');
                if (btnPlay) btnPlay.textContent = "🔄";
            }
        });
    }

    closeWait12HoursModal() {
        const modal = document.getElementById('wait12HoursModal');
        if (modal) modal.style.display = 'none';
        if (this.waitTimer) clearInterval(this.waitTimer);
    }

    switchPhase(phaseNum) {
        for (let i = 1; i <= 3; i++) {
            const tab = document.getElementById(`tabPhase${i}`);
            const content = document.getElementById(`contentPhase${i}`);
            if (tab) {
                if (i === phaseNum) tab.classList.add('active');
                else tab.classList.remove('active');
            }
            if (content) {
                if (i === phaseNum) content.classList.add('active');
                else content.classList.remove('active');
            }
        }
        this.currentPhase = phaseNum;
        if (this.audioManager) this.audioManager.playPipetteClick();
        this.enforceStepOrderIntegrity();

        if (phaseNum === 2) {
            this.applyIncubationResults();
            const card2a = document.getElementById('step_2a');
            if (card2a) {
                card2a.classList.add('active');
                card2a.classList.remove('locked');
                card2a.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            this.checkPhase2Progress();
            setTimeout(() => this.syncPlungerWidgetPosition(), 80);
            setTimeout(() => this.syncPlungerWidgetPosition(), 350);
        } else if (phaseNum === 3) {
            const card3a = document.getElementById('step_3a');
            if (card3a) {
                card3a.classList.add('active');
                card3a.classList.remove('locked');
                card3a.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    removeBoxes() {
        this.tubesState.forEach(t => {
            t.hasBox = false;
            t.placedBoxElement = null;
        });
        this.syncBoxesState();
        for (let i = 1; i <= 2; i++) {
            const el = document.getElementById(`box_source_${i}`);
            if (el) {
                el.classList.remove('shelf-item-returned');
                void el.offsetWidth;
                el.classList.add('shelf-item-returned');
            }
        }
        setTimeout(() => {
            for (let i = 1; i <= 2; i++) {
                const el = document.getElementById(`box_source_${i}`);
                if (el) el.classList.remove('shelf-item-returned');
            }
        }, 600);
        if (this.audioManager) this.audioManager.playThud();
        this.uiOverlay.showToast("تمت إزالة الصناديق البنية عن الأنابيب وإعادتها لمكانها بالرف 📦");
        this.markStepCompleted('2b');
        this.advanceStep('2c');
        this.checkPhase2Progress();
    }

    removeStoppers() {
        this.tubesState.forEach(t => {
            t.hasStopper = false;
            t.shelfStopperIndex = null;
            t.placedStopperElement = null;
        });
        this.shelfStoppersState = [true, true, true, true];
        this.syncStoppersState();
        for (let i = 0; i < 4; i++) {
            const el = document.getElementById(`shelf_stopper_group_${i}`);
            if (el) {
                el.classList.remove('shelf-item-returned');
                void el.offsetWidth;
                el.classList.add('shelf-item-returned');
            }
        }
        setTimeout(() => {
            for (let i = 0; i < 4; i++) {
                const el = document.getElementById(`shelf_stopper_group_${i}`);
                if (el) el.classList.remove('shelf-item-returned');
            }
        }, 600);
        if (this.audioManager) this.audioManager.playPop();
        this.uiOverlay.showToast("تم نزع السدادات المطاطية عن الأنابيب الأربعة وإعادتها لمكانها بالرف ✓");
        this.markStepCompleted('2c');
        this.advanceStep('2d');
        this.checkPhase2Progress();
    }

    finishWait12Hours() {
        this.closeWait12HoursModal();
        this.applyIncubationResults();
        if (this.audioManager) this.audioManager.playChime();
        this.markStepCompleted('1f');
        this.advanceStep('2a');

        // ─── الانتقال التلقائي الفوري لتبويب المرحلة الثانية في الشريط الجانبي ───
        setTimeout(() => {
            this.switchPhase(2);
            this.uiOverlay.showToast("انتهت فترة الحضانة 12 ساعة! أطفئ مصابيح LED بالنقر على المفتاح وابدأ المرحلة الثانية.");
        }, 200);
    }

    // إدارة نافذة ضبط حجم ماصة P1000 الميكرومترية
    openPipetteVolModal() {
        const modal = document.getElementById('pipetteVolModal');
        if (modal) {
            modal.style.display = 'flex';
            this.tempPipetteVol = this.pipetteVolume || 200;
            this.updatePipetteModalDigits();
            const inputs = [
                document.getElementById('pipetteDirectInput'),
                document.getElementById('pipetteDirectInputPhp')
            ].filter(Boolean);

            inputs.forEach(input => {
                input.value = this.tempPipetteVol;
                setTimeout(() => {
                    input.focus();
                    input.select();
                }, 80);
                input.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (input.value) {
                            this.onPipetteInputDirect(input.value);
                        }
                        this.savePipetteVolume();
                    }
                };
            });
        }
    }

    closePipetteVolModal() {
        const modal = document.getElementById('pipetteVolModal');
        if (modal) modal.style.display = 'none';
        if (this.tempPipetteVol >= 1000 || this.tempPipetteVol === 100) {
            this.pipetteVolume = 1000;
            if (this.svgScene) this.svgScene.setPipetteVolume(1000);
            this.markStepCompleted('2e');
            if (this.currentStep === '2e' || this.currentStep === '2f') {
                this.advanceStep('2g');
            }
        }
        this.checkPhase2Progress();
    }

    updatePipetteModalDigits() {
        const digits = document.getElementById('pipetteModalDigits');
        if (digits) digits.textContent = String(this.tempPipetteVol).padStart(4, '0');
        const input = document.getElementById('pipetteDirectInput') || document.getElementById('pipetteDirectInputPhp');
        if (input && document.activeElement !== input) {
            input.value = this.tempPipetteVol;
        }
    }

    onPipetteInputDirect(val) {
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
            // إذا أدخل المستخدم 100 أو 1000 تظهر 1000 مباشرة
            if (num === 100 || num >= 1000) {
                this.tempPipetteVol = 1000;
            } else {
                this.tempPipetteVol = Math.max(0, Math.min(1000, num));
            }
            const digits = document.getElementById('pipetteModalDigits');
            if (digits) digits.textContent = String(this.tempPipetteVol).padStart(4, '0');
        }
    }

    adjustPipetteModalVol(delta) {
        this.tempPipetteVol = Math.max(100, Math.min(1000, (this.tempPipetteVol || 200) + delta));
        this.updatePipetteModalDigits();
        if (this.audioManager) this.audioManager.playPipetteClick();
    }

    setPipetteModalVolDirect(val) {
        this.tempPipetteVol = (val === 100 || val >= 1000) ? 1000 : val;
        this.updatePipetteModalDigits();
        if (this.audioManager) this.audioManager.playPipetteClick();
    }

    savePipetteVolume() {
        const input = document.getElementById('pipetteDirectInput') || document.getElementById('pipetteDirectInputPhp');
        if (input && input.value) {
            const num = parseInt(input.value, 10);
            if (!isNaN(num)) {
                this.tempPipetteVol = (num === 100 || num >= 1000) ? 1000 : num;
            }
        }
        let vol = parseInt(this.tempPipetteVol || 1000, 10);
        if (vol === 100 || vol >= 1000) {
            vol = 1000; // تحويل 100 أو 1000 تلقائياً إلى 1000 µL كما طلب المستخدم
        }
        this.pipetteVolume = vol;
        if (this.svgScene) this.svgScene.setPipetteVolume(this.pipetteVolume);
        const modal = document.getElementById('pipetteVolModal');
        if (modal) modal.style.display = 'none';
        if (this.audioManager) this.audioManager.playPipetteClick();
        this.uiOverlay.showToast(`تم حفظ حجم ماصة P1000 على ${this.pipetteVolume} µL ✓`);
        if (this.pipetteVolume >= 1000) {
            this.markStepCompleted('2e');
            if (this.currentStep === '2e' || this.currentStep === '2f') {
                this.advanceStep('2g');
            }
        }
        this.checkPhase2Progress();
    }

    toggleTipsBoxLid() {
        if (!this.tipsBoxLidOpen) {
            this.tipsBoxLidOpen = true;
            if (this.svgScene) {
                this.svgScene.setTipsBoxLidOpen(true);
            }
            if (this.audioManager) this.audioManager.playPop();
            this.uiOverlay.showToast("تم فتح غطاء علبة الرؤوس (Tips Box) - انقر عليها أو مرر الماصة لتركيب رأس ✓");
            return;
        }

        // إذا كان الغطاء مفتوحاً بالفعل والماصة بدون رأس، النقر يركب الرأس فوراً!
        if (this.tipsBoxLidOpen && !this.pipetteState.hasTip) {
            this.attachPipetteTip();
            return;
        }

        // إغلاق الغطاء
        this.tipsBoxLidOpen = false;
        if (this.svgScene) {
            this.svgScene.setTipsBoxLidOpen(false);
        }
        if (this.audioManager) this.audioManager.playPop();
        this.uiOverlay.showToast("تم إغلاق غطاء علبة الرؤوس ✓");
        if (this.currentStep === '2n') {
            this.closeTipBox();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // إدارة نافذة دفتر الملاحظات المعملية واختبارات الألوان
    // ═══════════════════════════════════════════════════════════════
    openNotebookModal() {
        const modal = document.getElementById('labNotebookModal');
        if (modal) modal.style.display = 'flex';
    }

    closeNotebookModal() {
        const modal = document.getElementById('labNotebookModal');
        if (modal) modal.style.display = 'none';
    }

    selectNotebookColor(tubeNum, color, btn) {
        this.notebookSelections[tubeNum] = color;
        if (this.audioManager) this.audioManager.playPipetteClick();

        const wrapper = btn.closest('.color-choice-wrapper');
        if (wrapper) {
            wrapper.querySelectorAll('button').forEach(b => {
                b.style.borderColor = '#cbd5e1';
                b.style.background = '#ffffff';
                b.style.color = '#1e293b';
                b.style.boxShadow = 'none';
            });
        }
        btn.style.borderColor = color === 'green' ? '#16a34a' : (color === 'yellow' ? '#ca8a04' : '#2563eb');
        btn.style.background = color === 'green' ? '#dcfce7' : (color === 'yellow' ? '#fef9c3' : '#dbeafe');
        btn.style.color = color === 'green' ? '#166534' : (color === 'yellow' ? '#854d0e' : '#1e40af');
        btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';

        const badge = document.getElementById(`notebook_ph_badge_${tubeNum}`);
        if (badge) {
            if (color === 'green') {
                badge.textContent = "pH ≈ 7.0 (متعادل)";
                badge.style.background = "#ecfdf5";
                badge.style.color = "#065f46";
            } else if (color === 'yellow') {
                badge.textContent = "pH ≈ 6.1 (حمضي)";
                badge.style.background = "#fefce8";
                badge.style.color = "#854d0e";
            } else if (color === 'blue') {
                badge.textContent = "pH ≈ 7.6 (قاعدي)";
                badge.style.background = "#eff6ff";
                badge.style.color = "#1e40af";
            }
        }

        // فحص تلقائي إذا تم تحديد ألوان الأنابيب الأربعة
        const allSelected = [1, 2, 3, 4].every(num => !!this.notebookSelections[num]);
        if (allSelected) {
            this.markStepCompleted('2d');
            if (this.currentStep === '2d') {
                this.advanceStep('2e');
                if (this.audioManager) this.audioManager.playChime();
                this.uiOverlay.showToast("اكتمل تسجيل ألوان جميع الأنابيب بنجاح ✓ الآن اضبط حجم ماصة P1000 على 1,000 µl (الخطوة 2هـ)");
            }
        }
    }

    saveNotebookNotes() {
        const allSelected = [1, 2, 3, 4].every(num => !!this.notebookSelections[num]);
        if (!allSelected) {
            this.uiOverlay.showToast("يرجى تحديد اللون المرصود لجميع الأنابيب الأربعة أولاً!");
            return;
        }

        this.closeNotebookModal();
        if (this.audioManager) this.audioManager.playChime();
        this.uiOverlay.showToast("تم حفظ تقديرات الـ pH واختبارات الألوان بنجاح ✓");
        this.markStepCompleted('2d');
        if (this.currentStep === '2d') {
            this.advanceStep('2e');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ويدجت مكبس الماصة بوقفتين (1st Stop & 2nd Stop Lens Widget)
    // ═══════════════════════════════════════════════════════════════
    initPlungerWidget() {
        const card = document.getElementById('plungerLensCard');
        if (!card) return;

        this.plungerPressed = false;
        this.isAspirating = false;
        this.isDispensing = false;
        this.dispenseSecondStopReached = false;
        this.dispenseTimer = null;

        // عند بدء الضغط بالماوس أو اللمس على ويدجت المكبس (pointerdown)
        card.onpointerdown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.plungerPressed = true;

            // 1. إذا كانت الماصة فوق الأنبوب وبحاجة لسحب المحلول
            if (this.currentHoveredTube && !this.pipetteState.hasFluid && this.pipetteState.hasTip) {
                this.isAspirating = true;
                this.isDispensing = false;
                // يهبط المكبس للمنتصف (نص نازلة) ويتحول النص لـ الوقفة الأولى
                this.updatePlungerWidget('1st', `الوقفة الأولى: أطلق المكبس لسحب 1000 µl من الأنبوب ${this.currentHoveredTube}`);
                if (this.audioManager) this.audioManager.playPipetteClick();
                return;
            }

            // 2. إذا كانت الماصة فوق الكيوفيت وبحاجة لتفريغ المحلول
            if (this.currentHoveredCuvette && this.pipetteState.hasFluid) {
                this.isDispensing = true;
                this.isAspirating = false;
                this.dispenseSecondStopReached = false;
                // يهبط المكبس للمنتصف (نص نازلة)
                this.updatePlungerWidget('1st', 'الوقفة الأولى: استمر بالضغط للوصول للوقفة الثانية...');
                if (this.audioManager) this.audioManager.playPipetteClick();

                // مؤقت الاستمرار بالضغط للنزول للآخر (الوقفة الثانية)
                if (this.dispenseTimer) clearTimeout(this.dispenseTimer);
                this.dispenseTimer = setTimeout(() => {
                    if (this.isDispensing && this.plungerPressed) {
                        this.dispenseSecondStopReached = true;
                        // يهبط المكبس للأسفل بالكامل (ينزل للآخر)
                        this.updatePlungerWidget('2nd', 'الوقفة الثانية: تم التفريغ الكامل!');
                        this.executeDispense(this.currentHoveredCuvette);
                    }
                }, 380);
                return;
            }
        };

        // عند إفلات الضغط بالماوس (pointerup)
        card.onpointerup = (e) => {
            e.stopPropagation();
            this.handlePlungerRelease();
        };

        // عند خروج مؤشر الماوس من الويدجت (pointerleave)
        card.onpointerleave = () => {
            if (this.plungerPressed) {
                this.handlePlungerRelease();
            }
        };

        window.addEventListener('resize', () => {
            this.syncPlungerWidgetPosition();
        });

        const overlay = document.getElementById('plungerLensOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    handlePlungerRelease() {
        if (!this.plungerPressed) return;
        this.plungerPressed = false;

        // معالجة إفلات المكبس عند السحب من الأنبوب: يرتفع المكبس لـ وضع الراحة وينسحب السائل
        if (this.isAspirating) {
            this.isAspirating = false;
            this.updatePlungerWidget('at_rest', 'تم سحب 1,000 µl بنجاح');
            this.executeAspiration(this.currentHoveredTube || 1);
            return;
        }

        // معالجة إفلات المكبس عند التفريغ في الكيوفيت
        if (this.isDispensing) {
            this.isDispensing = false;
            if (this.dispenseTimer) {
                clearTimeout(this.dispenseTimer);
                this.dispenseTimer = null;
            }
            if (!this.dispenseSecondStopReached) {
                this.executeDispense(this.currentHoveredCuvette || '1');
            }
            this.hidePlungerWidget();
            return;
        }

        if (this.currentHoveredTube || this.currentHoveredCuvette) {
            this.updatePlungerWidget('at_rest');
        } else {
            this.hidePlungerWidget();
        }
    }

    syncPlungerWidgetPosition() {
        const overlay = document.getElementById('plungerLensOverlay');
        const pipette = document.getElementById('pipette_tool');
        if (!overlay || !pipette) return;
        const stage = overlay.offsetParent || document.getElementById('labSvgContainer') || document.getElementById('stagePanel') || document.body;

        const pipRect = pipette.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();

        if (pipRect.width === 0 || stageRect.width === 0) return;

        const centerX = (pipRect.left + pipRect.width / 2) - stageRect.left;
        const topY = pipRect.top - stageRect.top;

        overlay.style.left = `${centerX}px`;
        overlay.style.top = `${topY - 8}px`;
        overlay.style.right = 'auto';
        overlay.style.transform = 'translate(-50%, -100%)';
    }

    hidePlungerWidget() {
        this.currentHoveredTube = null;
        this.currentHoveredCuvette = null;
        const overlay = document.getElementById('plungerLensOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    updatePlungerWidget(state = 'at_rest', tipText = '') {
        const overlay = document.getElementById('plungerLensOverlay');
        const header = document.getElementById('plungerArchHeader');
        const circle = document.getElementById('plungerLensCircle');
        const knob = document.getElementById('plungerWidgetKnob');
        const stem = document.getElementById('plungerWidgetStem');
        const tipEl = document.getElementById('plungerActionTip');

        if (!overlay) return;

        if (state === 'hide' || state === 'none') {
            this.currentHoveredTube = null;
            this.currentHoveredCuvette = null;
            overlay.style.display = 'none';
            return;
        }

        // لا يظهر الويدجت مطلقاً إلا عند السحب (فوق أنبوب ومعه رأس وبدون سائل) أو الصب (فوق كيوفيت ومعه سائل)
        const canAspirate = Boolean(this.currentHoveredTube && this.pipetteState && this.pipetteState.hasTip && !this.pipetteState.hasFluid);
        const canDispense = Boolean(this.currentHoveredCuvette && this.pipetteState && this.pipetteState.hasFluid);
        if (!canAspirate && !canDispense) {
            overlay.style.display = 'none';
            return;
        }

        overlay.style.display = 'flex';

        if (tipEl && tipText) tipEl.textContent = tipText;

        if (state === 'at_rest' || state === 'rest') {
            if (header) {
                header.textContent = "وضع الراحة";
                header.className = 'plunger-arch-header state-rest';
            }
            if (circle) circle.className = 'plunger-lens-circle';
            if (knob) knob.setAttribute('transform', 'translate(0, 0)');
            if (stem) {
                stem.setAttribute('y', '18');
                stem.setAttribute('height', '28');
            }
        } else if (state === '1st') {
            if (header) {
                header.textContent = "الوقفة الأولى";
                header.className = 'plunger-arch-header state-first';
            }
            if (circle) circle.className = 'plunger-lens-circle';
            if (knob) knob.setAttribute('transform', 'translate(0, 10)');
            if (stem) {
                stem.setAttribute('y', '28');
                stem.setAttribute('height', '18');
            }
        } else if (state === '2nd') {
            if (header) {
                header.textContent = "الوقفة الثانية";
                header.className = 'plunger-arch-header state-second';
            }
            if (circle) circle.className = 'plunger-lens-circle stop-second';
            if (knob) knob.setAttribute('transform', 'translate(0, 20)');
            if (stem) {
                stem.setAttribute('y', '38');
                stem.setAttribute('height', '8');
            }
        }

        this.syncPlungerWidgetPosition();
    }

    onPipetteClick() {
        // التفاعل محصور بويدجت المكبس نفسه
    }

    // ═══════════════════════════════════════════════════════════════
    // إجراءات المرحلة الثانية المتسلسلة (خطوات الماصة ونقل الكيوفيتات)
    // ═══════════════════════════════════════════════════════════════
    selectPipette() {
        this.pipetteState.isSelected = true;
        this.hidePlungerWidget();
        if (this.audioManager) this.audioManager.playPipetteClick();
    }

    attachPipetteTip() {
        this.pipetteState.hasTip = true;
        const tip = document.getElementById('pipette_tip');
        if (tip) {
            tip.style.display = 'block';
            tip.setAttribute('fill', 'rgba(56, 189, 248, 0.7)');
            tip.setAttribute('opacity', '0.8');
        }
        if (this.audioManager) this.audioManager.playPop();
        this.uiOverlay.showToast("تم تركيب رأس ماصة جديد (Tip) P1000 ✓ اسحب الماصة نحو الأنبوب المطلوب");
        this.markStepCompleted('2g');
        if (this.currentStep === '2g') {
            this.advanceStep('2h');
        }
        // إبقاء الويدجت مخفياً أثناء بقاء الماصة على الحامل
        this.hidePlungerWidget();
    }

    movePipetteToTube(tubeNum = 1) {
        const num = parseInt(tubeNum, 10) || 1;
        // إزالة السدادات أو الصناديق تلقائياً إن وجدت على الأنبوب لتسهيل السحب
        if (this.tubesState && this.tubesState[num - 1]) {
            if (this.tubesState[num - 1].hasStopper && this.svgDrag) {
                this.svgDrag.removeTubeStopper(num);
            }
            if (this.tubesState[num - 1].hasBox && this.svgDrag) {
                this.svgDrag.removeTubeBox(num);
            }
        }
        const pipTool = document.getElementById('pipette_tool');
        if (pipTool) {
            const targetX = 70 + (num - 1) * 60 + 14 - 12;
            pipTool.setAttribute('transform', `translate(${targetX}, 285)`);
        }
        this.currentHoveredTube = num;
        this.currentHoveredCuvette = null;
        if (this.audioManager) this.audioManager.playPipetteClick();
        this.uiOverlay.showToast(`تم وضع طرف ماصة P1000 فوق فوهة الأنبوب ${num} ✓`);
        this.markStepCompleted('2h');
        if (this.currentStep === '2h') {
            this.advanceStep('2i');
        }
        this.updatePlungerWidget('at_rest', `اضغط المكبس (الوقفة الأولى) ثم أفلته لسحب المحلول من الأنبوب ${num}`);
        this.syncPlungerWidgetPosition();
    }

    executeAspiration(tubeNum = 1) {
        const num = tubeNum || this.currentHoveredTube || 1;
        const tubeData = this.tubesState[num - 1];
        const fluidCol = tubeData ? tubeData.colorHex : '#16a34a';

        if (this.audioManager) this.audioManager.playAspirate();

        this.pipetteState.hasFluid = true;
        this.pipetteState.fluidColor = fluidCol;
        this.pipetteState.sourceTubeIndex = num;

        // تلوين السائل داخل الماصة وتلوين السن بلون كاشف الأنبوب المطابق تماماً
        const pipFluid = document.getElementById('pipette_fluid');
        if (pipFluid) {
            pipFluid.setAttribute('fill', fluidCol);
            pipFluid.setAttribute('opacity', '0.9');
        }

        const pipTip = document.getElementById('pipette_tip');
        if (pipTip) {
            pipTip.setAttribute('fill', fluidCol);
            pipTip.setAttribute('opacity', '0.95');
        }

        this.uiOverlay.showToast(`تم سحب 1,000 µL من محلول الأنبوب ${num} بنجاح - وجّه الماصة فوق الكيوفيت ${num} (الخطوة 2ط) ✓`);
        this.markStepCompleted('2h');
        this.markStepCompleted('2i');
        if (this.currentStep === '2h' || this.currentStep === '2i') {
            this.advanceStep('2j');
        }
    }

    pressPlungerFirstStop(tubeNum) {
        this.executeAspiration(tubeNum);
    }

    executeDispense(targetCuvId = '1') {
        const id = targetCuvId || this.currentHoveredCuvette || '1';
        if (this.audioManager) this.audioManager.playSplash();

        // تفريغ المحلول من الماصة وإعادة لون السن إلى الشفاف
        const pipFluid = document.getElementById('pipette_fluid');
        if (pipFluid) pipFluid.setAttribute('opacity', '0');

        const pipTip = document.getElementById('pipette_tip');
        if (pipTip) {
            pipTip.setAttribute('fill', 'rgba(56, 189, 248, 0.7)');
            pipTip.setAttribute('opacity', '0.8');
        }

        this.pipetteState.hasFluid = false;

        const col = this.pipetteState.fluidColor || '#16a34a';
        const cuvData = this.cuvettesState[id];
        if (cuvData) {
            cuvData.isFilled = true;
            cuvData.fluidColor = col;
            cuvData.sourceTubeIndex = this.pipetteState.sourceTubeIndex || parseInt(id, 10);

            const srcTube = this.tubesState[cuvData.sourceTubeIndex - 1];
            if (srcTube) {
                cuvData.rawAbsorbance = srcTube.rawAbsorbance;
                cuvData.phValue = srcTube.phValue;
            }
        }

        if (this.svgScene) {
            this.svgScene.updateCuvetteFluid(id, col);
        }

        this.uiOverlay.showToast(`تم تفريغ 1 مل في الكيوفيت ${id} بالكامل (2nd Stop) ✓`);

        // احتساب خطوة الصب فورياً
        this.markStepCompleted('2j');
        if (this.currentStep === '2j') {
            this.advanceStep('2k');
        }
        this.checkPhase2Progress();
    }

    startPlungerSecondStop(targetCuvId) {
        this.executeDispense(targetCuvId);
    }

    releasePlungerSecondStop() {
        this.handlePlungerRelease();
    }

    ejectPipetteTip() {
        this.pipetteState.hasTip = false;
        this.currentHoveredTube = null;
        this.currentHoveredCuvette = null;
        const tip = document.getElementById('pipette_tip');
        if (tip) tip.style.display = 'none';
        if (this.audioManager) this.audioManager.playPipetteClick();
        this.uiOverlay.showToast("تم قذف رأس الماصة المستعمل في سلة المهملات 🗑️");
        this.markStepCompleted('2k');
        if (this.currentStep === '2k') {
            this.advanceStep('2l');
        }
        this.hidePlungerWidget();
        this.checkPhase2Progress();
    }

    capCuvette(cuvId = '1', capSlot = null) {
        if (!this.shelfCapsState) {
            this.shelfCapsState = [true, true, true, true];
        }
        let chosenSlot = (capSlot !== null && capSlot >= 0 && capSlot < 4 && this.shelfCapsState[capSlot]) ? capSlot : -1;
        if (chosenSlot === -1) {
            chosenSlot = this.shelfCapsState.findIndex(c => c === true);
        }
        if (chosenSlot !== -1) {
            this.shelfCapsState[chosenSlot] = false;
        }

        const cap = document.getElementById(`cuvette_cap_${cuvId}`);
        if (cap) cap.style.display = 'block';
        if (this.cuvettesState[cuvId]) {
            this.cuvettesState[cuvId].isCapped = true;
            this.cuvettesState[cuvId].shelfCapIndex = chosenSlot !== -1 ? chosenSlot : null;
        }
        if (this.svgScene) {
            this.svgScene.setCuvetteCapVisible(cuvId, true);
        }
        this.syncCuvetteCapsState();
        if (this.audioManager) this.audioManager.playPop();
        this.uiOverlay.showToast(`تم تركيب غطاء الكيوفيت ${cuvId} بإحكام ✓`);

        // حساب عدد الكيوفيتات المغطاة المكتملة
        let count = 0;
        for (let i = 1; i <= 4; i++) {
            if (this.cuvettesState[String(i)] && this.cuvettesState[String(i)].isFilled && this.cuvettesState[String(i)].isCapped) {
                count++;
            }
        }
        this.completedCuvettesCount = count;
        const counter = document.getElementById('cuvettesCountText');
        if (counter) counter.textContent = `${count} من 4`;

        // احتساب خطوة تغطية الكيوفيت 1 فوراً وبشكل مرن
        if (cuvId === '1') {
            this.markStepCompleted('2l');
            if (this.currentStep === '2l') {
                this.advanceStep('2m');
            }
        }

        // إخفاء ويدجت المكبس تماماً عند غلق الأغطية
        this.hidePlungerWidget();

        if (count >= 4) {
            this.markStepCompleted('2m');
            this.advanceStep('2n');
            this.uiOverlay.showToast("اكتمل نقل المحاليل وتغطية الكيوفيتات الأربعة! انقر على علبة الرؤوس لإغلاقها ✓");
        }
        this.checkPhase2Progress();
    }

    removeCuvetteCap(cuvId = '1') {
        if (cuvId === 'Blank') return; // Blank remains capped
        let returnSlot = null;
        if (this.cuvettesState[cuvId]) {
            this.cuvettesState[cuvId].isCapped = false;
            returnSlot = this.cuvettesState[cuvId].shelfCapIndex;
            this.cuvettesState[cuvId].shelfCapIndex = null;
        }
        if (!this.shelfCapsState) {
            this.shelfCapsState = [true, true, true, true];
        }
        if (returnSlot === null || returnSlot === undefined || returnSlot < 0) {
            returnSlot = this.shelfCapsState.findIndex(c => !c);
        }
        if (returnSlot >= 0 && returnSlot < 4) {
            this.shelfCapsState[returnSlot] = true;
        }
        const cap = document.getElementById(`cuvette_cap_${cuvId}`);
        if (cap) cap.style.display = 'none';
        if (this.svgScene) {
            this.svgScene.setCuvetteCapVisible(cuvId, false);
        }
        this.syncCuvetteCapsState(returnSlot);
        if (this.audioManager) this.audioManager.playPop();
        this.uiOverlay.showToast(`تمت إزالة غطاء الكيوفيت ${cuvId} وإعادته إلى الرف ✓`);
    }

    onShelfCapClick(capIdx) {
        // تم إلغاء التغطية بالنقر المباشر التزاماً بطلب المستخدم للاعتماد التام على السحب والإفلات التفاعلي
        if (this.uiOverlay) {
            this.uiOverlay.showToast('اسحب غطاء الكيوفيت وأفلته فوق الكيوفيت المطلوب لتغطيته 🖱️');
        }
    }

    syncCuvetteCapsState(animatedIdx = null) {
        if (!this.cuvettesState) return;
        // 1. أغطية الكيوفيتات الأربعة في الحامل
        ['1', '2', '3', '4'].forEach((id) => {
            const isCapped = Boolean(this.cuvettesState[id] && this.cuvettesState[id].isCapped);
            if (this.svgScene) {
                this.svgScene.setCuvetteCapVisible(id, isCapped);
            }
            const capEl = document.getElementById(`cuvette_cap_${id}`);
            if (capEl) capEl.style.display = isCapped ? 'block' : 'none';
        });

        // 2. حالة أغطية الكيوفيتات الأربعة في الرف (4 خانات مستقلة تماماً 1-to-1 لمنع أي إزاحة عند أخذ غطاء من الوسط)
        if (!this.shelfCapsState) {
            this.shelfCapsState = [true, true, true, true];
        }
        for (let idx = 0; idx < 4; idx++) {
            const isVisible = Boolean(this.shelfCapsState[idx]);
            if (this.svgScene) {
                this.svgScene.setShelfCapVisible(idx, isVisible);
            }
            const shelfCap = document.getElementById(`shelf_cuvette_cap_${idx}`);
            if (shelfCap) {
                shelfCap.setAttribute('transform', `translate(${25 + idx * 40}, 91)`);
                shelfCap.style.display = isVisible ? 'block' : 'none';
                if (isVisible && animatedIdx === idx) {
                    shelfCap.classList.remove('shelf-item-returned');
                    void shelfCap.offsetWidth;
                    shelfCap.classList.add('shelf-item-returned');
                    setTimeout(() => {
                        shelfCap.classList.remove('shelf-item-returned');
                    }, 600);
                }
            }
        }
    }

    movePipetteToCuvette(cuvId = '1') {
        const pipTool = document.getElementById('pipette_tool');
        const cuvIndex = cuvId === 'Blank' ? 0 : parseInt(cuvId, 10);
        const targetX = 685 + 10 + cuvIndex * 31 - 1;
        if (pipTool) {
            pipTool.setAttribute('transform', `translate(${targetX}, 275)`);
        }
        this.currentHoveredCuvette = cuvId;
        this.currentHoveredTube = null;
        if (this.audioManager) this.audioManager.playPipetteClick();
        this.uiOverlay.showToast(`تم وضع طرف ماصة P1000 فوق الكيوفيت ${cuvId} - اضغط مطولاً على المكبس للوقفة الثانية لتفريغ المحلول ✓`);
        this.updatePlungerWidget('at_rest', 'اضغط مطولاً على المكبس للوصول للوقفة الثانية لتفريغ المحلول');
        this.syncPlungerWidgetPosition();
    }

    onTubeClick(tubeNum = 1) {
        // تم إلغاء النقل بالنقر المباشر تلبية لرغبة المستخدم واعتماد السحب والإفلات حصراً
    }

    onCuvetteClick(cuvId = '1') {
        // تم إلغاء النقل بالنقر المباشر تلبية لرغبة المستخدم واعتماد السحب والإفلات حصراً
    }

    capNextUncappedCuvette() {
        const cuvettes = ['1', '2', '3', '4'];
        for (const id of cuvettes) {
            const data = this.cuvettesState[id];
            if (data && data.isFilled && !data.isCapped) {
                this.capCuvette(id);
                return;
            }
        }
        this.uiOverlay.showToast("لا توجد كيوفيتات ممتلئة بحاجة للغطاء حالياً");
    }

    transferNextCuvette() {
        // دعم التكرار التلقائي إذا تم استدعاؤه برمجياً
        if (this.completedCuvettesCount < 4) {
            this.completedCuvettesCount++;
            const num = this.completedCuvettesCount;
            const tube = this.tubesState[num - 1];
            const col = tube ? tube.colorHex : '#16a34a';

            const cuvFluid = document.getElementById(`cuvette_fluid_${num}`);
            if (cuvFluid) cuvFluid.setAttribute('fill', col);

            const cuvCap = document.getElementById(`cuvette_cap_${num}`);
            if (cuvCap) cuvCap.style.display = 'block';

            this.cuvettesState[String(num)].isFilled = true;
            this.cuvettesState[String(num)].colorHex = col;
            this.cuvettesState[String(num)].isCapped = true;
            this.cuvettesState[String(num)].shelfCapIndex = num - 1;
            if (this.shelfCapsState && this.shelfCapsState[num - 1] !== undefined) {
                this.shelfCapsState[num - 1] = false;
            }
            this.syncCuvetteCapsState();

            const counter = document.getElementById('cuvettesCountText');
            if (counter) counter.textContent = `${num} من 4`;

            if (this.audioManager) this.audioManager.playChime();
            this.uiOverlay.showToast(`✓ تم نقل 1 مل من الأنبوب ${num} للكيوفيت ${num} وتغطيتها (${num} من 4).`);

            if (this.completedCuvettesCount >= 4) {
                this.markStepCompleted('2m');
                this.advanceStep('2n');
                this.hidePlungerWidget();
            }
        }
    }

    closeTipBox() {
        if (this.audioManager) this.audioManager.playPop();
        this.tipsBoxLidOpen = false;
        if (this.svgScene && this.svgScene.setTipsBoxLidOpen) {
            this.svgScene.setTipsBoxLidOpen(false);
        }
        this.markStepCompleted('2n');

        // إرجاع الماصة إلى الحامل
        const pipTool = document.getElementById('pipette_tool');
        if (pipTool) pipTool.setAttribute('transform', 'translate(337, 305)');

        const overlay = document.getElementById('plungerLensOverlay');
        if (overlay) overlay.style.display = 'none';

        this.uiOverlay.showToast("اكتملت المرحلة الثانية بنجاح! 🎉 جاري الانتقال التلقائي للمرحلة الثالثة: مقياس الطيف الضوئي...");
        this.advanceStep('3a');

        // الانتقال التلقائي لتبويب المرحلة الثالثة
        setTimeout(() => {
            this.switchPhase(3);
        }, 400);
    }

    checkPhase3Progress() {
        this.enforceStepOrderIntegrity();
        const cuv = this.specState.cuvetteInChamber;
        const isBlank = cuv && cuv.id === 'Blank';
        const res = this.spectroEngine.measureAbsorbance(cuv ? { userData: cuv } : null);
        if (this.svgScene) this.svgScene.updateSpecScreen(res.text);

        const screen = document.getElementById('specScreen');
        if (screen) screen.textContent = res.text === 'OFF' ? 'OFF' : `${res.text} Abs`;

        if (this.modalManager) this.modalManager.refreshSpecModalDisplay();

        // فك التعليق التلقائي الفوري إذا كان المستخدم متوقفاً عند خطوة تسجيل امتصاصية
        if (this.currentStep === '3l') {
            this.recordCuvetteAbsorbance('1');
            this.markStepCompleted('3l');
            setTimeout(() => {
                if (this.currentStep === '3l') this.advanceStep('3m');
            }, 400);
        } else if (this.currentStep === '3p') {
            this.recordCuvetteAbsorbance('2');
            this.markStepCompleted('3p');
            setTimeout(() => {
                if (this.currentStep === '3p') this.advanceStep('3q');
            }, 400);
        } else if (this.currentStep === '3q') {
            const c3Done = Boolean(this.cuvettesState['3']?.hasBeenMeasured);
            const c4Done = Boolean(this.cuvettesState['4']?.hasBeenMeasured);
            if (c3Done && c4Done) {
                this.markStepCompleted('3q');
                this.advanceStep('3r');
            }
        }

        if (this.currentStep === '3g' && isBlank && !this.specState.isLidOpen) {
            const btnZero = document.getElementById('btnSpecZero');
            if (btnZero) btnZero.disabled = false;
        }

        const btnZero = document.getElementById('btnSpecZero');
        if (btnZero) {
            btnZero.onclick = () => {
                this.zeroSpectrophotometer();
                const btnRead = document.getElementById('btnSpecRead');
                if (btnRead) btnRead.disabled = false;
            };
        }

        const btnRead = document.getElementById('btnSpecRead');
        if (btnRead) {
            btnRead.onclick = () => {
                if (!this.specState.cuvetteInChamber) {
                    this.uiOverlay.showToast("⚠️ لا توجد كيوفيت في حجرة القياس!");
                    return;
                }
                if (this.specState.isLidOpen) {
                    this.uiOverlay.showToast("⚠️ أغلق غطاء حجرة القياس قبل الضغط على قياس!");
                    return;
                }

                const currentCuv = this.specState.cuvetteInChamber;
                const meas = this.spectroEngine.measureAbsorbance({ userData: currentCuv });
                if (this.svgScene) this.svgScene.updateSpecScreen(meas.text);

                if (screen) screen.textContent = `${meas.text} Abs`;
                if (this.modalManager) this.modalManager.refreshSpecModalDisplay();

                if (currentCuv.id !== 'Blank') {
                    this.recordCuvetteAbsorbance(currentCuv.id);
                }

                this.uiOverlay.showToast(`تم قياس الامتصاصية للكيوفيت ${currentCuv.id}: ${meas.text}`);
            };
        }
    }

    advanceStep(stepKey) {
        // تشغيل صوت جرس الإنجاز عند الانتقال لكل خطوة جديدة
        if (this.audioManager) this.audioManager.playChime();
        this.currentStep = stepKey;
        this.currentPhase = parseInt(stepKey.charAt(0));
        this.uiOverlay.updateStepBanner(stepKey);

        // فتح بطاقة الخطوة الحالية وتفعيلها في الشريط الجانبي
        const currentCard = document.getElementById(`step_${stepKey}`);
        if (currentCard) {
            currentCard.classList.remove('locked');
            currentCard.classList.add('active');
        }

        // معالجة الحالات المستوفاة مسبقاً والتسجيل التلقائي للنتائج:
        // 1. إذا انتقلنا لخطوة ضبط الطول الموجي (3c) وكان الطول الموجي مضبوطاً بالفعل على 615 nm
        if (stepKey === '3c' && this.spectroEngine?.wavelength === 615) {
            this.markStepCompleted('3c');
            setTimeout(() => {
                if (this.currentStep === '3c') this.advanceStep('3d');
            }, 300);
            return;
        }

        // 2. إذا انتقلنا لخطوة فتح الغطاء (3d) وكان غطاء الحجرة مفتوحاً بالفعل
        if (stepKey === '3d' && this.specState?.isLidOpen) {
            this.markStepCompleted('3d');
            setTimeout(() => {
                if (this.currentStep === '3d') this.advanceStep('3e');
            }, 300);
            return;
        }

        // 3. إذا انتقلنا لخطوة 3e أو 3f وكانت الكيوفيت الضابطة موضوعة في الحجرة بالفعل
        if ((stepKey === '3e' || stepKey === '3f') && this.specState?.cuvetteInChamber?.id === 'Blank') {
            this.markStepCompleted('3e');
            this.markStepCompleted('3f');
            setTimeout(() => {
                if (this.currentStep === '3e' || this.currentStep === '3f') this.advanceStep('3g');
            }, 300);
            return;
        }

        // 4. إذا انتقلنا لخطوة تسجيل امتصاصية الكيوفيت 1 (3l) -> تسجيل تلقائي فوري
        if (stepKey === '3l') {
            this.recordCuvetteAbsorbance('1');
            this.markStepCompleted('3l');
            setTimeout(() => {
                if (this.currentStep === '3l') this.advanceStep('3m');
            }, 400);
            return;
        }

        // 5. إذا انتقلنا لخطوة فتح غطاء الحجرة (3m) وكان الغطاء مفتوحاً بالفعل
        if (stepKey === '3m' && this.specState?.isLidOpen) {
            this.markStepCompleted('3m');
            setTimeout(() => {
                if (this.currentStep === '3m') this.advanceStep('3n');
            }, 300);
            return;
        }

        // 6. إذا انتقلنا لخطوة تسجيل امتصاصية الكيوفيت 2 (3p) -> تسجيل تلقائي فوري
        if (stepKey === '3p') {
            this.recordCuvetteAbsorbance('2');
            this.markStepCompleted('3p');
            setTimeout(() => {
                if (this.currentStep === '3p') this.advanceStep('3q');
            }, 400);
            return;
        }

        // 7. إذا انتقلنا لخطوة 3q وكانت الكيوفيتان 3 و 4 مقاستين بالفعل
        if (stepKey === '3q') {
            const c3Done = Boolean(this.cuvettesState['3']?.hasBeenMeasured);
            const c4Done = Boolean(this.cuvettesState['4']?.hasBeenMeasured);
            if (c3Done && c4Done) {
                this.markStepCompleted('3q');
                setTimeout(() => {
                    if (this.currentStep === '3q') this.advanceStep('3r');
                }, 400);
                return;
            }
        }
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
        if (btnTogglePoster) {
            btnTogglePoster.onclick = (e) => {
                if (e) e.preventDefault();
                if (window.photosynthesisLab) {
                    window.photosynthesisLab.openSetupPosterModal();
                } else {
                    const m = document.getElementById('setupPosterModal') || document.getElementById('posterModal');
                    if (m) m.style.display = 'flex';
                }
            };
        }

        const btnClosePoster = document.getElementById('btnClosePoster');
        if (btnClosePoster) {
            btnClosePoster.onclick = (e) => {
                if (e) e.preventDefault();
                if (window.photosynthesisLab) {
                    window.photosynthesisLab.closeSetupPosterModal();
                } else {
                    const m = document.getElementById('setupPosterModal') || document.getElementById('posterModal');
                    if (m) m.style.display = 'none';
                }
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
            '1a': { badge: 'الخطوة 1أ', text: 'راجع مخطط إعداد التجربة المعلق على الجدار للتعرف على محتويات الأنابيب.' },
            '1b': { badge: 'الخطوة 1ب', text: 'اسحب فرع نبات الإيلوديا من الحوض وضعه في الأنبوب 3 والأنبوب 4.' },
            '1c': { badge: 'الخطوة 1ج', text: 'اسحب السدادات المطاطية من الرف وسد جميع الأنابيب الأربعة.' },
            '1d': { badge: 'الخطوة 1د', text: 'اسحب صناديق حجب الضوء وضع صندوقاً فوق الأنبوب 2 وصندوقاً فوق الأنبوب 4.' },
            '1e': { badge: 'الخطوة 1هـ', text: 'انقر على مفتاح الإضاءة الجداري لتشغيل مصابيح LED وبدء التجربة.' },
            '1f': { badge: 'الخطوة 1و', text: 'اترك التجربة تعمل لمدة 12 ساعة. انقر هنا للانتظار 12 ساعة وملاحظة النتائج.' },
            '2a': { badge: 'الخطوة 2أ', text: 'بعد انقضاء 12 ساعة، أطفئ مصابيح LED بالنقر على مفتاح الإضاءة الجداري.' },
            '2b': { badge: 'الخطوة 2ب', text: 'أزل صناديق حجب الضوء عن الأنبوبين وأرجعها إلى الرف.' },
            '2c': { badge: 'الخطوة 2ج', text: 'أزل السدادات المطاطية عن الأنابيب الأربعة لإتاحة سحب العينات.' },
            '2d': { badge: 'الخطوة 2د', text: 'باستخدام لوحة مقياس الرقم الهيدروجيني، قدّر بالعين قيمة pH وسجلها في الخيارات المجاورة أو دفتر الملاحظات.' },
            '2e': { badge: 'الخطوة 2هـ', text: 'اضبط حجم ماصة P1000 على 1,000 µl واحفظ الحجم بالنقر على الزر أو فقاعة الحجم.' },
            '2g': { badge: 'الخطوة 2و', text: 'افتح علبة رؤوس P1000 وركّب رأساً جديداً بالماصة.' },
            '2h': { badge: 'الخطوة 2ز', text: 'ضع طرف ماصة P1000 فوق الأنبوب 1.' },
            '2i': { badge: 'الخطوة 2ح', text: 'اسحب 1,000 µl من محلول الأنبوب 1 بالضغط حتى الوقفة الأولى ثم تحريره ببطء.' },
            '2j': { badge: 'الخطوة 2ط', text: 'انقل الماصة إلى الكيوفيت 1، وفرّغ المحلول بالضغط حتى الوقفة الثانية.' },
            '2k': { badge: 'الخطوة 2ي', text: 'تخلص من رأس الماصة في سلة المهملات بالنقر على سلة المهملات أو زر القذف.' },
            '2l': { badge: 'الخطوة 2ك', text: 'ضع الغطاء الأحمر فوق الكيوفيت 1 لمنع تغير لون المحلول بتأثير الهواء.' },
            '2m': { badge: 'الخطوة 2ل', text: 'كرر العملية مع الأنابيب المتبقية لنقل 1 مل وتغطية الكيوفيتات.' },
            '2n': { badge: 'الخطوة 2م', text: 'أغلق علبة رؤوس ماصة P1000 لحمايتها من التلوث.' },
            '3a': { badge: 'الخطوة 3أ', text: 'انقر على زر التشغيل (Power) لتشغيل جهاز مقياس الطيف الضوئي.' },
            '3b': { badge: 'الخطوة 3ب', text: 'تعرّف على آلية عمل مقياس الطيف الضوئي وأجزائه أثناء فترة الإحماء بالنقر على زر المعلومات.' },
            '3c': { badge: 'الخطوة 3ج', text: 'اضبط الطول الموجي على 615 nm باستخدام نافذة الإعدادات.' },
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
    const uiOverlay = new UIOverlay();
    const canvas = document.getElementById('canvas3d');
    let sceneManager = null;
    let labSetup = null;

    // تهيئة 3D اختيارياً إذا توفر الكانفاس وكان مرئياً
    if (canvas && canvas.style.display !== 'none' && canvas.offsetParent !== null) {
        try {
            sceneManager = new SceneManager(canvas);
            labSetup = new LabSetup(sceneManager.scene);
            sceneManager.startLoop();
        } catch (e) {
            console.warn("Using pure 2D SVG vector lab engine:", e);
        }
    }

    const audioManager = new LabAudioManager();
    const experimentEngine = new ExperimentEngine(sceneManager, labSetup, uiOverlay);
    experimentEngine.audioManager = audioManager;
    const quizEngine = new QuizEngine();

    window.quizEngineInstance = quizEngine;
    window.experimentEngineInstance = experimentEngine;
    window.appInstance = {
        scene: sceneManager,
        setup: labSetup,
        engine: experimentEngine,
        ui: uiOverlay,
        svgScene: experimentEngine.svgScene,
        svgDrag: experimentEngine.svgDrag,
        audioManager: audioManager
    };

    // ربط كائن photosynthesisLab العام لجميع أزرار الواجهة والنوافذ المنبثقة
    window.photosynthesisLab = {
        audioManager: audioManager,
        toggleSound: () => audioManager.toggleMute(),
        toggleSpecLid: () => experimentEngine.toggleSpecLid(),
        toggleSpecPower: () => experimentEngine.toggleSpecPower(),
        zeroSpectrophotometer: () => experimentEngine.zeroSpectrophotometer(),
        attachPipetteTip: () => experimentEngine.attachPipetteTip(),
        toggleLamps: () => experimentEngine.toggleLamps(),
        openSetupPosterModal: () => experimentEngine.modalManager.openSetupPosterModal(),
        closeSetupPosterModal: () => experimentEngine.modalManager.closeSetupPosterModal(),
        openWait12HoursModal: () => experimentEngine.openWait12HoursModal(),
        closeWait12HoursModal: () => experimentEngine.closeWait12HoursModal(),
        toggleWaitTimer: () => experimentEngine.toggleWaitTimer(),
        finishWait12Hours: () => experimentEngine.finishWait12Hours(),
        switchPhase: (phase) => experimentEngine.switchPhase(phase),
        removeBoxes: () => experimentEngine.removeBoxes(),
        removeStoppers: () => experimentEngine.removeStoppers(),
        removeTubeBox: (num) => experimentEngine.svgDrag ? experimentEngine.svgDrag.removeTubeBox(num) : null,
        removeTubeStopper: (num) => experimentEngine.svgDrag ? experimentEngine.svgDrag.removeTubeStopper(num) : null,
        removeTubePlant: (num) => experimentEngine.svgDrag ? experimentEngine.svgDrag.removeTubePlant(num) : null,
        openPipetteVolModal: () => experimentEngine.openPipetteVolModal(),
        closePipetteVolModal: () => experimentEngine.closePipetteVolModal(),
        adjustPipetteModalVol: (delta) => experimentEngine.adjustPipetteModalVol(delta),
        setPipetteModalVolDirect: (val) => experimentEngine.setPipetteModalVolDirect(val),
        onPipetteInputDirect: (val) => experimentEngine.onPipetteInputDirect(val),
        savePipetteVolume: () => experimentEngine.savePipetteVolume(),
        onPipetteClick: () => experimentEngine.onPipetteClick(),
        capNextUncappedCuvette: () => experimentEngine.capNextUncappedCuvette(),
        syncPlungerWidgetPosition: () => experimentEngine.syncPlungerWidgetPosition(),
        toggleTipsBoxLid: () => experimentEngine.toggleTipsBoxLid(),
        openNotebookModal: () => experimentEngine.openNotebookModal(),
        closeNotebookModal: () => experimentEngine.closeNotebookModal(),
        saveNotebookNotes: () => experimentEngine.saveNotebookNotes(),
        selectNotebookColor: (tubeNum, col, btn) => experimentEngine.selectNotebookColor(tubeNum, col, btn),
        selectPipette: () => experimentEngine.selectPipette(),
        movePipetteToTube: (num) => experimentEngine.movePipetteToTube(num),
        pressPlungerFirstStop: (tubeNum) => experimentEngine.pressPlungerFirstStop(tubeNum),
        startPlungerSecondStop: (id) => experimentEngine.startPlungerSecondStop(id),
        releasePlungerSecondStop: () => experimentEngine.releasePlungerSecondStop(),
        ejectPipetteTip: () => experimentEngine.ejectPipetteTip(),
        capCuvette: (id) => experimentEngine.capCuvette(id),
        removeCuvetteCap: (id) => experimentEngine.removeCuvetteCap(id),
        onShelfCapClick: (idx) => experimentEngine.onShelfCapClick(idx),
        movePipetteToCuvette: (id) => experimentEngine.movePipetteToCuvette(id),
        onTubeClick: (num) => experimentEngine.onTubeClick(num),
        onCuvetteClick: (id) => experimentEngine.onCuvetteClick(id),
        syncCuvetteCapsState: () => experimentEngine.syncCuvetteCapsState(),
        transferNextCuvette: () => experimentEngine.transferNextCuvette(),
        closeTipBox: () => experimentEngine.closeTipBox(),
        openSpecInfoModal: () => experimentEngine.modalManager.openSpecInfoModal(),
        closeSpecInfoModal: () => experimentEngine.modalManager.closeSpecInfoModal(),
        openSpecSettingsModal: () => experimentEngine.modalManager.openSpecSettingsModal(),
        closeSpecSettingsModal: () => experimentEngine.modalManager.closeSpecSettingsModal(),
        removeCuvetteFromChamber: () => experimentEngine.removeCuvetteFromChamber(),
        onSpecSlotClick: () => experimentEngine.onSpecSlotClick(),
        insertCuvetteIntoChamber: (id, el) => experimentEngine.insertCuvetteIntoChamber(id, el),
        handleWavelengthChange: (val) => experimentEngine.modalManager.handleWavelengthChange(val),
        openPipetteVolumeModal: () => experimentEngine.openPipetteVolModal(),
        closePipetteVolumeModal: () => experimentEngine.closePipetteVolModal(),
        checkTubeColorChoice: (tubeNum, color, btn) => {
            const tube = labSetup.tubes[tubeNum - 1];
            const evalColor = tube?.group?.userData?.evaluatedColor || 0x15803d;
            let isMatch = false;
            if (color === 'blue' && evalColor === 0x1d4ed8) isMatch = true;
            else if (color === 'yellow' && evalColor === 0xca8a04) isMatch = true;
            else if (color === 'green' && evalColor === 0x15803d) isMatch = true;

            const parentRow = btn.closest('.quiz-color-row') || btn.parentElement;
            if (parentRow) {
                parentRow.querySelectorAll('.quiz-color-pill').forEach(b => b.classList.remove('active', 'correct', 'wrong'));
            }

            if (isMatch) {
                btn.classList.add('active', 'correct');
                experimentEngine.uiOverlay.showToast(`✓ إجابة صحيحة للأنبوب ${tubeNum}!`);
            } else {
                btn.classList.add('active', 'wrong');
                experimentEngine.uiOverlay.showToast(`✗ راجع لون الأنبوب ${tubeNum} جيداً.`);
            }
        },
        confirmPhEstimation: () => {
            experimentEngine.uiOverlay.showToast("✓ تم تأكيد تقدير الـ pH لجميع العينات بنجاح.");
            if (experimentEngine.currentStep === '2d') {
                experimentEngine.advanceStep('2e');
            }
        },
        openResultsSection: () => {
            const m = document.getElementById('resultsModal');
            if (m) {
                m.style.display = 'flex';
                window.photosynthesisLab.initResultsVisuals();
            }
        },
        closeResultsSection: () => {
            const m = document.getElementById('resultsModal');
            if (m) m.style.display = 'none';
        },
        switchResultsTab: (tab) => {
            document.querySelectorAll('.comp-tab-btn').forEach(b => b.classList.remove('active'));
            const activeBtn = document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
            if (activeBtn) activeBtn.classList.add('active');
            window.photosynthesisLab.renderComparisonTubes(tab);
        },
        selectOption: (qNum, opt) => {
            const card = document.getElementById(`cardQuestion${qNum}`) || document.getElementById(`q${qNum}_box`) || document.getElementById(`qBox${qNum}`);
            const selectedOpt = document.getElementById(`q${qNum}_opt_${opt}`);
            const container = card || (selectedOpt ? selectedOpt.closest('.q-options-list') : null);
            if (container) {
                container.querySelectorAll('.q-option-item').forEach(i => {
                    i.classList.remove('selected');
                    const rad = i.querySelector('input[type="radio"]');
                    if (rad) rad.checked = false;
                });
            }
            if (selectedOpt) {
                selectedOpt.classList.add('selected');
                const rad = selectedOpt.querySelector('input[type="radio"]');
                if (rad) rad.checked = true;
                if (experimentEngine.audioManager) experimentEngine.audioManager.playClick();
            }
            const feedbackBox = document.getElementById(`q${qNum}Feedback`);
            if (feedbackBox && feedbackBox.classList.contains('wrong')) {
                feedbackBox.style.display = 'none';
            }
        },
        qAttempts: { 1: 3, 2: 3, 3: 3, 4: 3 },
        solvedQuestions: new Set(),
        submitQuestion: (qNum) => {
            const card = document.getElementById(`cardQuestion${qNum}`);
            if (!card) return;
            const selectedOpt = card.querySelector('.q-option-item.selected') || card.querySelector('input[type="radio"]:checked')?.closest('.q-option-item');
            const feedbackBox = document.getElementById(`q${qNum}Feedback`);
            if (!selectedOpt) {
                experimentEngine.uiOverlay.showToast("⚠️ يرجى تحديد إجابة أولاً قبل النقر على إرسال الإجابة.");
                return;
            }
            const chosenValue = selectedOpt.querySelector('input[type="radio"]')?.value;
            const correctAnswers = { 1: 'B', 2: 'A', 3: 'A', 4: 'A' };
            const explanations = {
                1: {
                    correct: "✓ إجابة صحيحة ومثالية! في الأنبوب 3، يتعرض نبات الإيلوديا للضوء فتتفوق عملية البناء الضوئي على التنفس الخلوي. يؤدي ذلك إلى استهلاك غاز ثاني أكسيد الكربون (CO₂) من الماء، مما يقلل حمض الكربونيك ويرفع الرقم الهيدروجيني (pH) فيتحول كاشف BTB من اللون الأخضر إلى درجات الأزرق.",
                    wrong: "❌ إجابة غير دقيقة. تذكّر: استهلاك CO₂ في عملية البناء الضوئي يُقلل الحموضة ويرفع الرقم الهيدروجيني (pH)، وظهور اللون الأزرق لكاشف BTB يرتبط بالـ pH المرتفع (القاعدي)."
                },
                2: {
                    correct: "✓ إجابة صحيحة ومثالية! في الأنبوب 4 (في الظلام)، يتوقف البناء الضوئي تماماً بينما تستمر خلايا النبات في التنفس الخلوي الذي يطلق غاز CO₂ في الماء مكوناً حمض الكربونيك، مما يخفض الرقم الهيدروجيني (pH) ويحول كاشف BTB إلى اللون الأصفر.",
                    wrong: "❌ إجابة غير دقيقة. تذكّر: في غياب الضوء لا يحدث بناء ضوئي، بل تُطلق الخلايا غاز ثاني أكسيد الكربون عبر التنفس الخلوي مما يزيد الحموضة ويخفض pH فيظهر اللون الأصفر."
                },
                3: {
                    correct: "✓ إجابة صحيحة! نعم، تحول كاشف الأنبوب 3 إلى اللون الأزرق (ارتفاع pH) يؤكد أن معدل استهلاك CO₂ في البناء الضوئي يفوق بكثير معدل إنتاجه في التنفس الخلوي في وجود الضوء.",
                    wrong: "❌ إجابة غير دقيقة. لاحظ أن ارتفاع الـ pH وتحول المحلول للأزرق دليل قاطع على استهلاك صافٍ لغاز ثاني أكسيد الكربون بواسطة البناء الضوئي المتفوق على التنفس."
                },
                4: {
                    correct: "✓ إجابة صحيحة! نعم، تحول كاشف الأنبوب 4 في الظلام إلى اللون الأصفر (انخفاض pH) يثبت بشكل قاطع قيام خلايا نبات الإيلوديا بعملية التنفس الخلوي وإنتاج CO₂.",
                    wrong: "❌ إجابة غير دقيقة. تراكم ثاني أكسيد الكربون الذي أدى لانخفاض الـ pH وتحول اللون للأصفر يبرهن عملياً على حدوث التنفس الخلوي للخلايا النباتية في الظلام."
                }
            };

            const isCorrect = chosenValue === correctAnswers[qNum];
            const attemptsLabel = document.getElementById(`q${qNum}AttemptsLabel`);

            if (isCorrect) {
                if (experimentEngine.audioManager) experimentEngine.audioManager.playChime();
                experimentEngine.uiOverlay.showToast(`🎉 إجابة السؤال (${qNum}) صحيحة!`);
                
                if (feedbackBox) {
                    feedbackBox.style.display = 'block';
                    feedbackBox.className = 'q-feedback-box correct';
                    feedbackBox.innerHTML = `<strong>أحسنت! 👏</strong> ${explanations[qNum].correct}`;
                }

                const submitBtn = card.querySelector('.btn-submit-q');
                if (submitBtn) {
                    submitBtn.textContent = '✓ تم التحقق بنجاح';
                    submitBtn.style.background = '#16a34a';
                    submitBtn.disabled = true;
                }

                window.photosynthesisLab.solvedQuestions.add(qNum);
                if (window.photosynthesisLab.solvedQuestions.size >= 4) {
                    const finalSummary = document.getElementById('resultsFinalSummary');
                    if (finalSummary) {
                        finalSummary.style.display = 'flex';
                        finalSummary.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            } else {
                if (experimentEngine.audioManager) experimentEngine.audioManager.playPop();
                if (window.photosynthesisLab.qAttempts[qNum] > 0) {
                    window.photosynthesisLab.qAttempts[qNum]--;
                }
                if (attemptsLabel) {
                    attemptsLabel.textContent = `المحاولات المتبقية: ${window.photosynthesisLab.qAttempts[qNum]}`;
                }

                if (feedbackBox) {
                    feedbackBox.style.display = 'block';
                    feedbackBox.className = 'q-feedback-box wrong';
                    feedbackBox.innerHTML = `<strong>توجيه علمي:</strong> ${explanations[qNum].wrong}`;
                }

                if (window.photosynthesisLab.qAttempts[qNum] <= 0) {
                    experimentEngine.uiOverlay.showToast(`⚠️ استنفدت المحاولات لهذا السؤال.`);
                    const submitBtn = card.querySelector('.btn-submit-q');
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.style.background = '#94a3b8';
                    }
                } else {
                    experimentEngine.uiOverlay.showToast(`⚠️ الإجابة غير صحيحة، حاول مجدداً.`);
                }
            }
        },
        initResultsVisuals: () => {
            // ربط مستمعات النقر مباشرة بجميع خيارات الأسئلة
            document.querySelectorAll('.q-option-item').forEach(item => {
                item.onclick = function() {
                    const id = this.id;
                    const m = id.match(/^q(\d+)_opt_([A-Z])$/);
                    if (m) {
                        const qNum = parseInt(m[1], 10);
                        const opt = m[2];
                        window.photosynthesisLab.selectOption(qNum, opt);
                    }
                };
            });

            // عرض الأنابيب في نافذة المقارنة
            window.photosynthesisLab.renderComparisonTubes('actual');

            // عرض رسومات الأنابيب في السؤال 1 و 2
            const q1Svg = document.getElementById('q1TubesSvg');
            if (q1Svg) {
                q1Svg.innerHTML = window.photosynthesisLab.generateTubesGraphic(3);
            }
            const q2Svg = document.getElementById('q2TubesSvg');
            if (q2Svg) {
                q2Svg.innerHTML = window.photosynthesisLab.generateTubesGraphic(4);
            }

            // تهيئة الأشكال البيانية التفاعلية للنتائج (الشكل 15 و 16 و 17 و 18)
            window.photosynthesisLab.initFigure15();
            window.photosynthesisLab.renderFigure16Svg();
            window.photosynthesisLab.renderFigure17Svg(0.11);
            window.photosynthesisLab.renderFigure18Svg();

            // تحديث قيم الامتصاصية في جدول السؤال 5 بالقيم المقاسة فعلياً مع التفاوت في الأجزاء من المئة والألف
            const plantLight = experimentEngine?.tubesState?.find(t => t.hasPlant && !t.hasBox);
            const plantDark = experimentEngine?.tubesState?.find(t => t.hasPlant && t.hasBox);
            const ctrlLight = experimentEngine?.tubesState?.find(t => !t.hasPlant && !t.hasBox);
            const ctrlDark = experimentEngine?.tubesState?.find(t => !t.hasPlant && t.hasBox);

            const s1El = document.getElementById('q5_disp_s1');
            const s2El = document.getElementById('q5_disp_s2');
            const s3El = document.getElementById('q5_disp_s3');
            const s4El = document.getElementById('q5_disp_s4');

            if (s1El && plantLight) s1El.textContent = plantLight.absorbanceVal.toFixed(3);
            if (s2El && plantDark) s2El.textContent = plantDark.absorbanceVal.toFixed(3);
            if (s3El && ctrlLight) s3El.textContent = ctrlLight.absorbanceVal.toFixed(3);
            if (s4El && ctrlDark) s4El.textContent = ctrlDark.absorbanceVal.toFixed(3);
        },
        fig15Data: [
            { ph: 6.1, abs: 0.12 },
            { ph: 6.3, abs: 0.24 },
            { ph: 6.5, abs: 0.26 },
            { ph: 6.7, abs: 0.42 },
            { ph: 6.9, abs: 0.46 },
            { ph: 7.1, abs: 0.62 },
            { ph: 7.3, abs: 0.68 },
            { ph: 7.5, abs: 0.85 },
            { ph: 7.7, abs: 0.91 }
        ],
        fig15CurrentStep: 0,
        fig15IsPlaying: false,
        fig15Timer: null,
        initFigure15: () => {
            const dotsList = document.getElementById('fig15DotsList');
            if (dotsList) {
                let html = window.photosynthesisLab.fig15Data.map((d, i) => `
                    <div class="fig15-dot ${i === 0 ? 'active' : ''}" 
                         title="pH ${d.ph}" 
                         onclick="event.stopPropagation(); window.photosynthesisLab.setFig15Step(${i})">
                    </div>
                `).join('');
                // الخطوة الإضافية الأخيرة: المنحنى القياسي المتصل (Standard curve)
                html += `
                    <div class="fig15-dot" 
                         title="المنحنى القياسي (Standard curve)" 
                         onclick="event.stopPropagation(); window.photosynthesisLab.setFig15Step(9)">
                    </div>
                `;
                dotsList.innerHTML = html;
            }
            window.photosynthesisLab.setFig15Step(0);
        },
        setFig15Step: (stepIndex) => {
            const data = window.photosynthesisLab.fig15Data;
            const maxStep = 9;
            const clampedIndex = Math.max(0, Math.min(stepIndex, maxStep));
            window.photosynthesisLab.fig15CurrentStep = clampedIndex;

            // 1. تحديث شريط التقدم والنقاط
            const progress = document.getElementById('fig15TrackProgress');
            if (progress) {
                progress.style.width = `${(clampedIndex / maxStep) * 100}%`;
            }
            const dots = document.querySelectorAll('.fig15-dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('passed', i < clampedIndex);
                dot.classList.toggle('active', i === clampedIndex);
            });

            // 2. تحديث مؤشر الـ pH النشط في الشريط العلوي (الدائرة الحمراء حول الرقم)
            const ticks = document.querySelectorAll('#fig15Ticks span');
            if (clampedIndex < data.length) {
                const currentPh = data[clampedIndex].ph.toFixed(1);
                ticks.forEach(tick => {
                    const tickPh = tick.getAttribute('data-ph');
                    tick.classList.toggle('active-tick', tickPh === currentPh);
                });
            } else {
                ticks.forEach(tick => tick.classList.remove('active-tick'));
            }

            // 3. تحديث جدول المحاليل القياسية على اليمين
            const tbody = document.getElementById('fig15TableBody');
            if (tbody) {
                tbody.innerHTML = data.map((row, i) => {
                    const isPassed = (clampedIndex === 9) || (i <= clampedIndex);
                    const isActive = (clampedIndex < 9) && (i === clampedIndex);
                    const absText = isPassed ? row.abs.toFixed(2) : '&nbsp;';
                    return `
                        <tr class="${isActive ? 'active-row' : ''}">
                            <td><strong>${row.ph.toFixed(1)}</strong></td>
                            <td>${absText}</td>
                        </tr>
                    `;
                }).join('');
            }

            // 4. تحديث الرسم البياني (Scatter Plot SVG)
            const chartBox = document.getElementById('fig15ChartSvgBox');
            if (chartBox) {
                const w = 440;
                const h = 245;
                const xStart = 60;
                const xEnd = 405;
                const yBottom = 200;
                const yTop = 30;

                const getX = (ph) => xStart + ((ph - 6.1) / (7.7 - 6.1)) * (xEnd - xStart);
                const getY = (abs) => yBottom - (abs / 1.00) * (yBottom - yTop);

                let svg = `<svg viewBox="0 0 ${w} ${h}" style="width: 100%; height: auto; display: block; background: #081a2e; border-radius: 6px;">`;

                // شبكة الخطوط الأفقية (Grid lines)
                const gridValues = [0.00, 0.25, 0.50, 0.75, 1.00];
                gridValues.forEach(val => {
                    const y = getY(val);
                    svg += `<line x1="55" y1="${y}" x2="${xEnd + 10}" y2="${y}" stroke="#1e3a5f" stroke-width="1" />`;
                    svg += `<text x="50" y="${y + 4}" text-anchor="end" font-size="10" fill="#94a3b8" font-family="'Cairo', sans-serif">${val.toFixed(2)}</text>`;
                });

                // علامات المحور الأفقي (pH ticks)
                data.forEach(d => {
                    const x = getX(d.ph);
                    svg += `<line x1="${x}" y1="${yBottom}" x2="${x}" y2="${yBottom + 5}" stroke="#475569" stroke-width="1.2" />`;
                    svg += `<text x="${x}" y="${yBottom + 16}" text-anchor="middle" font-size="10" fill="#cbd5e1" font-family="'Cairo', sans-serif">${d.ph.toFixed(1)}</text>`;
                });

                // المحاور الرئيسية
                svg += `<line x1="55" y1="${yBottom}" x2="${xEnd + 10}" y2="${yBottom}" stroke="#64748b" stroke-width="1.5" />`;
                svg += `<line x1="55" y1="${yTop}" x2="55" y2="${yBottom}" stroke="#64748b" stroke-width="1.5" />`;

                // تسميات المحاور
                svg += `<text transform="rotate(-90)" x="-115" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1" font-family="'Cairo', sans-serif">Absorbance (arbitrary units)</text>`;
                svg += `<text x="${(xStart + xEnd) / 2}" y="${h - 4}" text-anchor="middle" font-size="12" font-weight="800" fill="#cbd5e1" font-family="'Cairo', sans-serif">pH</text>`;

                const lineX1 = xStart - 5;
                const lineY1 = getY(0.08);
                const lineX2 = xEnd + 8;
                const lineY2 = getY(0.93);

                if (clampedIndex === 8) {
                    // الخطوة 8: خط أفضل مطابقة متقطع (Best-fit line) مع النقاط التسعة
                    svg += `<line x1="${lineX1}" y1="${lineY1}" x2="${lineX2}" y2="${lineY2}" stroke="#ef4444" stroke-dasharray="5,4" stroke-width="2.2" stroke-linecap="round" opacity="0.95" />`;
                    svg += `<text x="210" y="118" fill="#ef4444" font-size="12.5" font-weight="800" font-family="'Cairo', sans-serif">Best-fit line</text>`;
                } else if (clampedIndex === 9) {
                    // الخطوة 9 (الأخيرة): خط المنحنى القياسي المتصل (Solid Standard curve) مطابقة تماماً للمخطط المستهدف
                    svg += `<line x1="${lineX1}" y1="${lineY1}" x2="${lineX2}" y2="${lineY2}" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" />`;
                    svg += `<text x="135" y="115" fill="#ef4444" font-size="14" font-weight="700" font-family="'Cairo', sans-serif">Standard curve</text>`;
                }

                // رسم النقاط المقاسة حتى الخطوة 8 فقط (في الخطوة 9 يظهر المنحنى القياسي المتصل النقي دون نقاط فردية)
                if (clampedIndex < 9) {
                    for (let i = 0; i <= clampedIndex; i++) {
                        const pt = data[i];
                        const cx = getX(pt.ph);
                        const cy = getY(pt.abs);
                        svg += `
                            <g>
                                <circle cx="${cx}" cy="${cy}" r="6" fill="#84cc16" stroke="#ffffff" stroke-width="2" />
                                ${i === clampedIndex ? `<circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.85" />` : ''}
                            </g>
                        `;
                    }
                }

                svg += `</svg>`;
                chartBox.innerHTML = svg;
            }
        },
        toggleFig15Play: () => {
            const playIcon = document.getElementById('fig15PlayIcon');
            const maxStep = 9;
            if (window.photosynthesisLab.fig15IsPlaying) {
                clearInterval(window.photosynthesisLab.fig15Timer);
                window.photosynthesisLab.fig15IsPlaying = false;
                if (playIcon) playIcon.className = 'fas fa-play';
            } else {
                if (window.photosynthesisLab.fig15CurrentStep >= maxStep) {
                    window.photosynthesisLab.setFig15Step(0);
                }
                window.photosynthesisLab.fig15IsPlaying = true;
                if (playIcon) playIcon.className = 'fas fa-pause';

                window.photosynthesisLab.fig15Timer = setInterval(() => {
                    const next = window.photosynthesisLab.fig15CurrentStep + 1;
                    if (next >= maxStep) {
                        window.photosynthesisLab.setFig15Step(maxStep);
                        window.photosynthesisLab.toggleFig15Play();
                    } else {
                        window.photosynthesisLab.setFig15Step(next);
                    }
                }, 850);
            }
        },
        handleTrackClick: (e) => {
            const track = document.getElementById('fig15Track');
            if (!track) return;
            const rect = track.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            const targetStep = Math.round(ratio * 9);
            window.photosynthesisLab.setFig15Step(targetStep);
        },
        renderFigure16Svg: () => {
            const chartBox = document.getElementById('fig16ChartSvgBox');
            if (!chartBox) return;

            const w = 440;
            const h = 245;
            const xStart = 60;
            const xEnd = 405;
            const yBottom = 200;
            const yTop = 30;

            const getX = (ph) => xStart + ((ph - 6.1) / (7.7 - 6.1)) * (xEnd - xStart);
            const getY = (abs) => yBottom - (abs / 1.00) * (yBottom - yTop);

            const sampleAbs = 0.75;
            const samplePh = 7.40;
            const targetX = getX(samplePh);
            const targetY = getY(sampleAbs);

            let svg = `<svg viewBox="0 0 ${w} ${h}" style="width: 100%; height: auto; display: block; background: #081a2e; border-radius: 6px;">`;
            
            // Defs for green arrow
            svg += `
                <defs>
                    <marker id="fig16GreenArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#22c55e" />
                    </marker>
                </defs>
            `;

            // Grid lines
            const gridValues = [0.00, 0.25, 0.50, 0.75, 1.00];
            gridValues.forEach(val => {
                const y = getY(val);
                svg += `<line x1="55" y1="${y}" x2="${xEnd + 10}" y2="${y}" stroke="#1e3a5f" stroke-width="1" />`;
                svg += `<text x="50" y="${y + 4}" text-anchor="end" font-size="10" fill="#94a3b8" font-family="'Cairo', sans-serif">${val.toFixed(2)}</text>`;
            });

            // pH ticks
            const phTicks = [6.1, 6.3, 6.5, 6.7, 6.9, 7.1, 7.3, 7.5, 7.7];
            phTicks.forEach(ph => {
                const x = getX(ph);
                svg += `<line x1="${x}" y1="${yBottom}" x2="${x}" y2="${yBottom + 5}" stroke="#475569" stroke-width="1.2" />`;
                svg += `<text x="${x}" y="${yBottom + 16}" text-anchor="middle" font-size="10" fill="#cbd5e1" font-family="'Cairo', sans-serif">${ph.toFixed(1)}</text>`;
            });

            // Axes
            svg += `<line x1="55" y1="${yBottom}" x2="${xEnd + 10}" y2="${yBottom}" stroke="#64748b" stroke-width="1.5" />`;
            svg += `<line x1="55" y1="${yTop}" x2="55" y2="${yBottom}" stroke="#64748b" stroke-width="1.5" />`;

            // Axis labels
            svg += `<text transform="rotate(-90)" x="-115" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1" font-family="'Cairo', sans-serif">Absorbance (arbitrary units)</text>`;
            svg += `<text x="${(xStart + xEnd) / 2}" y="${h - 4}" text-anchor="middle" font-size="12" font-weight="800" fill="#cbd5e1" font-family="'Cairo', sans-serif">pH</text>`;

            // Solid Red Standard Curve
            const lineX1 = getX(6.1) - 5;
            const lineY1 = getY(0.10);
            const lineX2 = getX(7.7) + 8;
            const lineY2 = getY(0.92);
            svg += `<line x1="${lineX1}" y1="${lineY1}" x2="${lineX2}" y2="${lineY2}" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" />`;
            svg += `<text x="160" y="165" fill="#ef4444" font-size="12" font-weight="700" font-family="'Cairo', sans-serif">Standard curve</text>`;

            // Green horizontal projection from Y=0.75 to the curve
            svg += `<line x1="55" y1="${targetY}" x2="${targetX - 4}" y2="${targetY}" stroke="#22c55e" stroke-width="2" marker-end="url(#fig16GreenArrow)" />`;
            svg += `<text x="${(55 + targetX) / 2}" y="${targetY - 14}" fill="#4ade80" font-size="10" font-weight="700" text-anchor="middle" font-family="'Cairo', sans-serif">امتصاصية العينة مجهولة الرقم الهيدروجيني</text>`;
            svg += `<text x="${(55 + targetX) / 2}" y="${targetY - 3}" fill="#86efac" font-size="9" font-weight="600" text-anchor="middle" font-family="'Cairo', sans-serif">(Absorbance of sample with unknown pH)</text>`;

            // Green vertical projection from curve intersection (pH 7.40) down to x-axis
            svg += `<line x1="${targetX}" y1="${targetY}" x2="${targetX}" y2="${yBottom - 4}" stroke="#22c55e" stroke-width="2" marker-end="url(#fig16GreenArrow)" />`;
            svg += `<text x="${targetX - 8}" y="${(targetY + yBottom) / 2 - 8}" fill="#4ade80" font-size="10" font-weight="700" text-anchor="end" font-family="'Cairo', sans-serif">ربط الامتصاصية</text>`;
            svg += `<text x="${targetX - 8}" y="${(targetY + yBottom) / 2 + 5}" fill="#86efac" font-size="9.5" font-weight="700" text-anchor="end" font-family="'Cairo', sans-serif">بالرقم الهيدروجيني</text>`;
            svg += `<text x="${targetX - 8}" y="${(targetY + yBottom) / 2 + 18}" fill="#94a3b8" font-size="8" text-anchor="end" font-family="'Cairo', sans-serif">(Linking absorbance to pH)</text>`;

            svg += `</svg>`;
            chartBox.innerHTML = svg;
        },
        renderFigure17Svg: (currentAbs = 0.11) => {
            const chartBox = document.getElementById('fig17ChartSvgBox');
            if (!chartBox) return;

            const w = 500;
            const h = 260;
            const xStart = 65;
            const xEnd = 465;
            const yBottom = 215;
            const yTop = 30;

            const phMin = 6.0;
            const phMax = 8.0;
            const absMin = 0.11;
            const absMax = 1.00;

            const clampedAbs = Math.max(absMin, Math.min(absMax, parseFloat(currentAbs) || absMin));
            const ph = phMin + ((clampedAbs - absMin) / (absMax - absMin)) * (phMax - phMin);

            const getX = (p) => xStart + ((p - phMin) / (phMax - phMin)) * (xEnd - xStart);
            const getY = (a) => yBottom - ((a - 0.00) / (1.00 - 0.00)) * (yBottom - yTop);

            let svg = `<svg viewBox="0 0 ${w} ${h}" style="width: 100%; height: auto; display: block; border-radius: 8px;">`;

            // Defs: continuous BTB gradient + white down arrow
            svg += `
                <defs>
                    <linearGradient id="fig17BtbGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#eab308" />
                        <stop offset="25%" stop-color="#ca8a04" />
                        <stop offset="45%" stop-color="#65a30d" />
                        <stop offset="65%" stop-color="#166534" />
                        <stop offset="85%" stop-color="#1e3a8a" />
                        <stop offset="100%" stop-color="#0f172a" />
                    </linearGradient>
                    <marker id="fig17DownArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ffffff" />
                    </marker>
                </defs>
            `;

            // Gradient Background inside chart area
            svg += `<rect x="${xStart}" y="${yTop}" width="${xEnd - xStart}" height="${yBottom - yTop}" fill="url(#fig17BtbGradient)" />`;

            // Grid lines (Y-axis)
            const yTicks = [0.00, 0.25, 0.50, 0.75, 1.00];
            yTicks.forEach(val => {
                const y = getY(val);
                svg += `<line x1="${xStart - 5}" y1="${y}" x2="${xEnd}" y2="${y}" stroke="rgba(255,255,255,0.18)" stroke-width="1" />`;
                svg += `<text x="${xStart - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#94a3b8" font-family="'Cairo', sans-serif">${val.toFixed(2)}</text>`;
            });

            // X-axis ticks (pH 6.0 to 8.0 in steps of 0.5)
            const xTicks = [6.0, 6.5, 7.0, 7.5, 8.0];
            xTicks.forEach(p => {
                const x = getX(p);
                svg += `<line x1="${x}" y1="${yBottom}" x2="${x}" y2="${yBottom + 5}" stroke="#475569" stroke-width="1.2" />`;
                svg += `<text x="${x}" y="${yBottom + 16}" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1" font-family="'Cairo', sans-serif">${p.toFixed(1)}</text>`;
            });

            // Axes borders
            svg += `<line x1="${xStart}" y1="${yBottom}" x2="${xEnd}" y2="${yBottom}" stroke="#64748b" stroke-width="1.5" />`;
            svg += `<line x1="${xStart}" y1="${yTop}" x2="${xStart}" y2="${yBottom}" stroke="#64748b" stroke-width="1.5" />`;

            // Axis labels
            svg += `<text transform="rotate(-90)" x="-120" y="18" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1" font-family="'Cairo', sans-serif">Absorbance (arbitrary units)</text>`;
            svg += `<text x="${(xStart + xEnd) / 2}" y="${h - 4}" text-anchor="middle" font-size="12" font-weight="800" fill="#cbd5e1" font-family="'Cairo', sans-serif">pH</text>`;

            // Solid Red Standard Curve Line
            const cx1 = getX(phMin);
            const cy1 = getY(absMin);
            const cx2 = getX(phMax);
            const cy2 = getY(absMax);
            svg += `<line x1="${cx1}" y1="${cy1}" x2="${cx2}" y2="${cy2}" stroke="#ef4444" stroke-width="3.2" stroke-linecap="round" />`;

            // Label "Standard curve" tilted along the line
            svg += `<text x="${(cx1 + cx2) / 2 - 10}" y="${(cy1 + cy2) / 2 - 12}" fill="#ef4444" font-size="12" font-weight="800" transform="rotate(-23 ${(cx1 + cx2) / 2 - 10} ${(cy1 + cy2) / 2 - 12})" font-family="'Cairo', sans-serif">Standard curve</text>`;

            // Current Coordinates Point on the line
            const currentX = getX(ph);
            const currentY = getY(clampedAbs);

            // White dashed projection lines matching LabXchange Figure 17
            // 1. Horizontal dashed white line from Y-axis to point
            svg += `<line x1="${xStart}" y1="${currentY}" x2="${currentX}" y2="${currentY}" stroke="#ffffff" stroke-dasharray="4,3" stroke-width="1.8" opacity="0.95" />`;
            // 2. Vertical dashed white line from point down to X-axis with arrowhead
            svg += `<line x1="${currentX}" y1="${currentY}" x2="${currentX}" y2="${yBottom - 3}" stroke="#ffffff" stroke-dasharray="4,3" stroke-width="1.8" opacity="0.95" marker-end="url(#fig17DownArrow)" />`;

            // Floating Tooltip Badge next to point
            const badgeW = 95;
            const badgeH = 48;
            const badgeX = currentX > (xEnd - 110) ? (currentX - badgeW - 14) : (currentX + 16);
            const badgeY = Math.max(yTop + 5, Math.min(yBottom - badgeH - 5, currentY - badgeH / 2));

            svg += `
                <g class="fig17-badge-group">
                    <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="6" fill="rgba(15, 23, 42, 0.92)" stroke="#334155" stroke-width="1.5" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.4))" />
                    <text x="${badgeX + badgeW / 2}" y="${badgeY + 20}" fill="#ffffff" font-size="12.5" font-weight="800" text-anchor="middle" font-family="'Cairo', sans-serif">${clampedAbs.toFixed(2)} Abs</text>
                    <text x="${badgeX + badgeW / 2}" y="${badgeY + 38}" fill="#38bdf8" font-size="12.5" font-weight="800" text-anchor="middle" font-family="'Cairo', sans-serif">${ph.toFixed(1)} pH</text>
                </g>
            `;

            // Circle point on the curve (white center with orange border)
            svg += `
                <g class="fig17-point-group">
                    <circle cx="${currentX}" cy="${currentY}" r="8" fill="#ffffff" stroke="#f97316" stroke-width="3" />
                </g>
            `;

            svg += `</svg>`;
            chartBox.innerHTML = svg;
        },
        handleFig17Slider: (val) => {
            const parsed = parseFloat(val);
            const absMin = 0.11;
            const absMax = 1.00;
            const pct = Math.max(0, Math.min(100, ((parsed - absMin) / (absMax - absMin)) * 100));

            const display = document.getElementById('fig17SliderDisplay');
            if (display) {
                display.textContent = `${parsed.toFixed(2)} Abs`;
            }
            const slider = document.getElementById('fig17Slider');
            if (slider) {
                slider.style.background = `linear-gradient(to right, #0284c7 0%, #0284c7 ${pct}%, #cbd5e1 ${pct}%, #cbd5e1 100%)`;
            }
            window.photosynthesisLab.renderFigure17Svg(parsed);
        },
        q5AttemptsLeft: 3,
        submitQuestion5: () => {
            const in1 = document.getElementById('q5_tube1_ph');
            const in2 = document.getElementById('q5_tube2_ph');
            const in3 = document.getElementById('q5_tube3_ph');
            const in4 = document.getElementById('q5_tube4_ph');
            const feedbackBox = document.getElementById('q5Feedback');
            const statusBadge = document.getElementById('q5Status');
            const attemptsBadge = document.getElementById('q5AttemptsLeft');

            if (!in1 || !in2 || !in3 || !in4 || !feedbackBox) return;

            const v1 = parseFloat(in1.value);
            const v2 = parseFloat(in2.value);
            const v3 = parseFloat(in3.value);
            const v4 = parseFloat(in4.value);

            if (isNaN(v1) || isNaN(v2) || isNaN(v3) || isNaN(v4)) {
                feedbackBox.style.display = 'block';
                feedbackBox.className = 'q-feedback-box error';
                feedbackBox.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>يرجى إدخال قيم الرقم الهيدروجيني المقدرة لجميع العينات الأربعة من المنحنى القياسي قبل الإرسال.</span>
                    </div>
                `;
                return;
            }

            // Expected ranges:
            // Tube 1 (Light, Abs 0.97): ~7.9 (accept 7.7 - 8.1)
            // Tube 2 (Dark, Abs 0.13): ~6.0 - 6.1 (accept 5.9 - 6.3)
            // Tube 3 (Control Light, Abs 0.51): ~6.9 (accept 6.7 - 7.1)
            // Tube 4 (Control Dark, Abs 0.48): ~6.8 (accept 6.6 - 7.0)
            const c1 = (v1 >= 7.7 && v1 <= 8.1);
            const c2 = (v2 >= 5.9 && v2 <= 6.3);
            const c3 = (v3 >= 6.7 && v3 <= 7.1);
            const c4 = (v4 >= 6.6 && v4 <= 7.0);

            [in1, in2, in3, in4].forEach((input, idx) => {
                const isCorrect = [c1, c2, c3, c4][idx];
                input.style.borderColor = isCorrect ? '#22c55e' : '#ef4444';
                input.style.backgroundColor = isCorrect ? '#f0fdf4' : '#fef2f2';
            });

            if (c1 && c2 && c3 && c4) {
                feedbackBox.style.display = 'block';
                feedbackBox.className = 'q-feedback-box success';
                feedbackBox.innerHTML = `
                    <div style="display: flex; align-items: flex-start; gap: 10px;">
                        <i class="fas fa-check-circle" style="font-size: 1.4rem; color: #16a34a; margin-top: 2px;"></i>
                        <div>
                            <strong style="font-size: 1rem; color: #166534; display: block; margin-bottom: 4px;">إجابة دقيقة وصحيحة 100%!</strong>
                            <p style="color: #1e293b; margin: 0; line-height: 1.6;">
                                ممتاز! استخرجت قيم الرقم الهيدروجيني الدقيقة بنجاح:
                                <br>&bull; <strong>العينة 1 (في الضوء):</strong> ارتفع الرقم الهيدروجيني إلى <strong>${v1}</strong> (قاعدي/أزرق) بسبب استهلاك غاز CO₂ في البناء الضوئي.
                                <br>&bull; <strong>العينة 2 (في الظلام):</strong> انخفض الرقم الهيدروجيني إلى <strong>${v2}</strong> (حمضي/أصفر) بسبب إنتاج CO₂ في التنفس الخلوي.
                                <br>&bull; <strong>عينات الضبط (3 و 4):</strong> استقر الـ pH حول <strong>6.8 - 6.9</strong> لعدم وجود نبات، مما يؤكد أن التغير ناجم عن العمليات الحيوية للنبات حصراً.
                            </p>
                        </div>
                    </div>
                `;

                if (statusBadge) {
                    statusBadge.className = 'q-status correct';
                    statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> مكتمل بنجاح';
                }

                // Render Figure 18 and scroll to Question 6
                window.photosynthesisLab.renderFigure18Svg();
                const q6 = document.getElementById('q6Box');
                if (q6) {
                    q6.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                window.photosynthesisLab.q5AttemptsLeft = Math.max(0, window.photosynthesisLab.q5AttemptsLeft - 1);
                if (attemptsBadge) {
                    attemptsBadge.textContent = window.photosynthesisLab.q5AttemptsLeft;
                }

                if (window.photosynthesisLab.q5AttemptsLeft > 0) {
                    feedbackBox.style.display = 'block';
                    feedbackBox.className = 'q-feedback-box error';
                    feedbackBox.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-times-circle" style="color: #dc2626;"></i>
                            <span>بعض القيم غير دقيقة. استخدم شريط التمرير في الشكل 17 لتحريك المنزلق عند امتصاصية كل عينة وقراءة قيمة pH المقابلة. المحاولات المتبقية: ${window.photosynthesisLab.q5AttemptsLeft}.</span>
                        </div>
                    `;
                } else {
                    feedbackBox.style.display = 'block';
                    feedbackBox.className = 'q-feedback-box';
                    feedbackBox.style.background = '#fffbeb';
                    feedbackBox.style.border = '1px solid #fef08a';
                    feedbackBox.innerHTML = `
                        <div style="display: flex; align-items: flex-start; gap: 8px; color: #92400e;">
                            <i class="fas fa-info-circle" style="margin-top: 3px;"></i>
                            <div>
                                <strong>انتهت المحاولات الثلاث. إليك القيم الصحيحة الدقيقة المستخرجة من المنحنى القياسي:</strong>
                                <br>&bull; العينة 1 (Abs 0.97): pH = <strong>7.9</strong>
                                <br>&bull; العينة 2 (Abs 0.13): pH = <strong>6.0</strong>
                                <br>&bull; العينة 3 (Abs 0.51): pH = <strong>6.9</strong>
                                <br>&bull; العينة 4 (Abs 0.48): pH = <strong>6.8</strong>
                            </div>
                        </div>
                    `;
                    in1.value = 7.9;
                    in2.value = 6.0;
                    in3.value = 6.9;
                    in4.value = 6.8;

                    // Enable proceeding to Q6
                    window.photosynthesisLab.renderFigure18Svg();
                    const q6 = document.getElementById('q6Box');
                    if (q6) {
                        q6.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }
        },
        renderFigure18Svg: () => {
            const box = document.getElementById('fig18TubesGraphicBox');
            if (!box) return;
            const tubes = [
                { color: '#568b2e', hasBox: false, hasPlant: true },
                { color: '#587e2b', hasBox: true, hasPlant: true },
                { color: '#163d7e', hasBox: false, hasPlant: true },
                { color: '#c7b41e', hasBox: true, hasPlant: true }
            ];
            box.innerHTML = window.photosynthesisLab.drawTubesSvg(tubes, 4, 460, 200);
        },
        submitQuestion6: () => {
            const textarea = document.getElementById('q6AnswerText');
            const feedbackBox = document.getElementById('q6Feedback');
            const statusBadge = document.getElementById('q6Status');
            const nextBtnBox = document.getElementById('q6NextBtnBox');

            if (!textarea || !feedbackBox) return;
            const ans = textarea.value.trim();

            if (ans.length < 3) {
                feedbackBox.style.display = 'block';
                feedbackBox.className = 'q-feedback-box error';
                feedbackBox.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-exclamation-circle" style="color: #dc2626;"></i>
                        <span>يرجى كتابة تحليلك العلمي وإجابتك في المربع أعلاه قبل الإرسال.</span>
                    </div>
                `;
                return;
            }

            if (statusBadge) {
                statusBadge.className = 'q-status correct';
                statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> تم تسجيل الإجابة';
            }

            feedbackBox.style.display = 'block';
            feedbackBox.className = 'q-feedback-box success';
            feedbackBox.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <i class="fas fa-clipboard-check" style="font-size: 1.4rem; color: #0d9488; margin-top: 2px;"></i>
                    <div>
                        <strong style="font-size: 1rem; color: #115e59; display: block; margin-bottom: 4px;">التحليل العلمي النموذجي:</strong>
                        <p style="color: #1e293b; margin: 0; line-height: 1.6;">
                            <strong>نعم، تؤكد البيانات الكمية تماماً البيانات النوعية لكاشف الرقم الهيدروجيني:</strong>
                            <br>&bull; <strong>في الضوء (الأنبوب 1):</strong> امتصاصية عالية (0.97) تناظر رقماً هيدروجينياً قاعدياً (~7.9) وتوافق اللون الأزرق الداكن، نتيجة استهلاك CO₂ السريع في البناء الضوئي.
                            <br>&bull; <strong>في الظلام (الأنبوب 2):</strong> امتصاصية منخفضة (0.13) تناظر رقماً هيدروجينياً حمضياً (~6.0) وتوافق اللون الأصفر، نتيجة تحرر CO₂ الناتج عن التنفس الخلوي في حمض الكربونيك.
                            <br>&bull; <strong>أنابيب التحكم (3 و 4):</strong> حافظت على قيم متوسطة ومستقرة، مما يثبت قطعياً أن التغيرات ناجمة عن النشاط الأيضي الحيوي لنبات الإيلوديا.
                        </p>
                    </div>
                </div>
            `;

            if (nextBtnBox) {
                nextBtnBox.style.display = 'block';
            }
        },
        finishExperimentFlow: () => {
            const summary = document.getElementById('resultsFinalSummary');
            if (summary) {
                summary.style.display = 'flex';
                summary.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        },
        drawTubesSvg: (configs, highlightNum = null, width = 480, height = 200) => {
            const spacing = width / 5;
            let svg = `<svg viewBox="0 0 ${width} ${height}" style="width: 100%; max-width: ${width}px; height: auto; display: block; margin: 0 auto;">`;
            svg += `<ellipse cx="${width / 2}" cy="${height - 15}" rx="${width * 0.44}" ry="7" fill="rgba(0,0,0,0.06)" />`;

            configs.forEach((t, i) => {
                const x = spacing * (i + 1);
                const tubeNum = i + 1;
                const isHighlighted = highlightNum === tubeNum;

                // الصندوق الكرتوني للأنبوبين 2 و 4
                if (t.hasBox) {
                    svg += `
                        <g class="tube-box-group">
                            <rect x="${x - 22}" y="36" width="44" height="148" rx="4" fill="#6d4724" stroke="#452a11" stroke-width="1.5" />
                            <rect x="${x - 17}" y="40" width="34" height="140" rx="2" fill="#381e08" />
                        </g>
                    `;
                }

                // جسم الأنبوب الزجاجي والمحلول
                svg += `
                    <g class="tube-body-group">
                        <path d="M${x - 12} 52 L${x - 12} 156 A12 12 0 0 0 ${x + 12} 156 L${x + 12} 52 Z" fill="${t.color}" stroke="rgba(255,255,255,0.75)" stroke-width="2" />
                        <path d="M${x - 9} 56 L${x - 9} 154" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" />
                    </g>
                `;

                // نبات الإيلوديا في الأنبوبين 3 و 4
                if (t.hasPlant) {
                    svg += `
                        <g class="tube-plant-group">
                            <path d="M${x} 68 Q${x - 3} 108 ${x + 2} 152" stroke="#15803d" stroke-width="2.5" fill="none" stroke-linecap="round" />
                            <path d="M${x} 82 C${x - 11} 76, ${x - 9} 70, ${x} 78" fill="#22c55e" opacity="0.95" />
                            <path d="M${x} 94 C${x + 11} 88, ${x + 9} 82, ${x} 90" fill="#22c55e" opacity="0.95" />
                            <path d="M${x} 110 C${x - 11} 104, ${x - 9} 98, ${x} 106" fill="#22c55e" opacity="0.95" />
                            <path d="M${x} 124 C${x + 11} 118, ${x + 9} 112, ${x} 120" fill="#22c55e" opacity="0.95" />
                            <path d="M${x} 138 C${x - 9} 134, ${x - 7} 128, ${x} 134" fill="#22c55e" opacity="0.95" />
                        </g>
                    `;
                }

                // سدادة الأنبوب
                svg += `
                    <g class="tube-stopper-group">
                        <polygon points="${x - 12},46 ${x + 12},46 ${x + 9},54 ${x - 9},54" fill="#c2782e" stroke="#92400e" stroke-width="1.2" />
                        <rect x="${x - 13}" y="42" width="26" height="5" rx="1.5" fill="#d97706" stroke="#92400e" stroke-width="1.2" />
                    </g>
                `;

                // ملصق رقم الأنبوب
                svg += `
                    <g class="tube-label-group">
                        <rect x="${x - 8}" y="112" width="16" height="16" rx="2" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
                        <text x="${x}" y="124" text-anchor="middle" font-size="12" font-weight="900" fill="#0f172a" font-family="'Cairo', sans-serif">${tubeNum}</text>
                    </g>
                `;

                // إطار التحديد الأحمر للسؤالين 1 و 2
                if (isHighlighted) {
                    svg += `
                        <rect x="${x - 26}" y="30" width="52" height="160" fill="none" stroke="#ef4444" stroke-width="3.5" rx="4" />
                    `;
                }
            });

            svg += `</svg>`;
            return svg;
        },
        renderComparisonTubes: (tab) => {
            const container = document.getElementById('comparisonStageBody');
            if (!container) return;

            const predTubes = [
                { color: '#4d8b31', hasBox: false, hasPlant: false },
                { color: '#4d8b31', hasBox: true, hasPlant: false },
                { color: '#4d8b31', hasBox: false, hasPlant: true },
                { color: '#4d8b31', hasBox: true, hasPlant: true }
            ];

            const idealTubes = [
                { color: '#4d8b31', hasBox: false, hasPlant: false },
                { color: '#4d8b31', hasBox: true, hasPlant: false },
                { color: '#1e3a8a', hasBox: false, hasPlant: true },
                { color: '#ca8a04', hasBox: true, hasPlant: true }
            ];

            if (tab === 'actual') {
                container.innerHTML = `
                    <div class="comp-split-container">
                        <div class="comp-col">
                            <h5 class="comp-col-title">هذه هي توقعاتك الأولية:</h5>
                            ${window.photosynthesisLab.drawTubesSvg(predTubes, null, 360, 200)}
                        </div>
                        <div class="comp-col">
                            <h5 class="comp-col-title">هذه هي نتائجك الفعلية:</h5>
                            ${window.photosynthesisLab.drawTubesSvg(idealTubes, null, 360, 200)}
                        </div>
                    </div>
                `;
            } else if (tab === 'predicted') {
                container.innerHTML = `
                    <div class="comp-col" style="width: 100%; max-width: 520px;">
                        <h5 class="comp-col-title">هذه هي توقعاتك الأولية:</h5>
                        ${window.photosynthesisLab.drawTubesSvg(predTubes, null, 480, 200)}
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="comp-col" style="width: 100%; max-width: 520px;">
                        <h5 class="comp-col-title">هذه هي النتائج النموذجية المثالية:</h5>
                        ${window.photosynthesisLab.drawTubesSvg(idealTubes, null, 480, 200)}
                    </div>
                `;
            }
        },
        generateTubesGraphic: (highlightNum) => {
            const idealTubes = [
                { color: '#4d8b31', hasBox: false, hasPlant: false },
                { color: '#4d8b31', hasBox: true, hasPlant: false },
                { color: '#1e3a8a', hasBox: false, hasPlant: true },
                { color: '#ca8a04', hasBox: true, hasPlant: true }
            ];
            return window.photosynthesisLab.drawTubesSvg(idealTubes, highlightNum, 500, 205);
        }
    };

    // Camera control buttons
    const btnResetCam = document.getElementById('btnResetCamera');
    if (btnResetCam) btnResetCam.onclick = () => { if (sceneManager) sceneManager.resetCamera(); };

    const btnZoomIn = document.getElementById('btnZoomIn');
    if (btnZoomIn) btnZoomIn.onclick = () => { if (sceneManager) sceneManager.zoomIn(); };

    const btnZoomOut = document.getElementById('btnZoomOut');
    if (btnZoomOut) btnZoomOut.onclick = () => { if (sceneManager) sceneManager.zoomOut(); };

    const btnResetExp = document.getElementById('btnReset');
    if (btnResetExp) btnResetExp.onclick = () => location.reload();



    // التهيئة المسبقة الفورية لجميع الأشكال البيانية في صفحة النتائج لتظهر مفتوحة دائماً
    if (window.photosynthesisLab && window.photosynthesisLab.initResultsVisuals) {
        window.photosynthesisLab.initResultsVisuals();
    }

    if (sceneManager) {
        sceneManager.startLoop();
    }
});
