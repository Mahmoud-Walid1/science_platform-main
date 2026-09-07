/**
 * sceneManager3D.js
 * Clean Architecture - Three.js 3D Scene with Fixed Sun, Viewport-Pinned 3D Watering Can, and Orbit Controls.
 */

export class SceneManager3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf1f5f9);

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 3.2, 8.5);
        this.scene.add(this.camera);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 4. Orbit Controls
        if (window.THREE && window.THREE.OrbitControls) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
            this.controls.target.set(0, 1.2, 0);
        }

        // 5. Lights & Fixed Sun
        this.initLightsAndFixedSun();

        // 6. Viewport-Pinned 3D Green Watering Can (Fixed Top-Left, Never Orbiting!)
        this.initViewportPinnedWateringCan();

        // 7. Window Resize Listener
        window.addEventListener('resize', () => this.onResize());
    }

    initLightsAndFixedSun() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xfff5c0, 1.6);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 25;
        this.sunLight.shadow.bias = -0.0005;
        this.scene.add(this.sunLight);

        this.spotLight = new THREE.SpotLight(0xfef08a, 1.8, 18, Math.PI / 4, 0.8, 1);
        this.spotLight.target.position.set(0, 1.2, 0);
        this.scene.add(this.spotLight);
        this.scene.add(this.spotLight.target);

        // 3D Sun Group Pinned in Top-Right Viewport
        this.sunGroup = new THREE.Group();
        this.sunGroup.position.set(3.2, 2.0, -6.0);

        const sunGeo = new THREE.SphereGeometry(0.42, 32, 32);
        this.sunMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xf59e0b,
            emissiveIntensity: 1.2,
            roughness: 0.1
        });
        this.sunMesh = new THREE.Mesh(sunGeo, this.sunMat);
        this.sunGroup.add(this.sunMesh);

        const coronaGeo = new THREE.SphereGeometry(0.65, 32, 32);
        this.coronaMat = new THREE.MeshBasicMaterial({
            color: 0xfde047,
            transparent: true,
            opacity: 0.35,
            side: THREE.BackSide
        });
        this.coronaMesh = new THREE.Mesh(coronaGeo, this.coronaMat);
        this.sunGroup.add(this.coronaMesh);

        const haloGeo = new THREE.SphereGeometry(0.95, 32, 32);
        this.haloMat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        this.haloMesh = new THREE.Mesh(haloGeo, this.haloMat);
        this.sunGroup.add(this.haloMesh);

        this.camera.add(this.sunGroup);
        this.initConicalSunbeam();

        const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.45);
        fillLight.position.set(-5, 4, -4);
        this.scene.add(fillLight);
    }

    initConicalSunbeam() {
        const coneGeo = new THREE.ConeGeometry(1.45, 8, 32, 1, true);
        coneGeo.translate(0, -4, 0);

        this.coneMat = new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.14,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        this.conicalBeamMesh = new THREE.Mesh(coneGeo, this.coneMat);
        this.scene.add(this.conicalBeamMesh);
    }

    initViewportPinnedWateringCan() {
        // 3D Green Watering Can Group - Pinned directly to PerspectiveCamera (Top-Left)
        this.wateringCanGroup = new THREE.Group();
        this.wateringCanGroup.position.set(-2.2, 0.7, -6.0);
        this.wateringCanGroup.scale.setScalar(1.25);
        this.wateringCanGroup.rotation.z = -0.52;
        this.wateringCanGroup.renderOrder = 50;

        const canMat = new THREE.MeshStandardMaterial({
            color: 0x16a34a,
            roughness: 0.35,
            metalness: 0.15
        });

        const chromeNozzleMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            metalness: 0.8,
            roughness: 0.2
        });

        // Can Main Body
        const bodyGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.65, 32);
        const bodyMesh = new THREE.Mesh(bodyGeo, canMat);
        bodyMesh.castShadow = true;
        this.wateringCanGroup.add(bodyMesh);

        // Can Top Rim
        const rimGeo = new THREE.TorusGeometry(0.33, 0.025, 16, 32);
        const rimMesh = new THREE.Mesh(rimGeo, canMat);
        rimMesh.rotation.x = Math.PI / 2;
        rimMesh.position.y = 0.325;
        this.wateringCanGroup.add(rimMesh);

        // Long Spout Tube
        const spoutCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.2, 0.0, 0),
            new THREE.Vector3(0.65, 0.25, 0),
            new THREE.Vector3(1.1, 0.42, 0)
        ]);
        const spoutGeo = new THREE.TubeGeometry(spoutCurve, 24, 0.045, 16, false);
        const spoutMesh = new THREE.Mesh(spoutGeo, canMat);
        spoutMesh.castShadow = true;
        this.wateringCanGroup.add(spoutMesh);

        // Rose / Shower Head Nozzle Tip
        const roseGeo = new THREE.ConeGeometry(0.12, 0.14, 24);
        this.roseMesh = new THREE.Mesh(roseGeo, chromeNozzleMat);
        this.roseMesh.position.set(1.18, 0.44, 0);
        this.roseMesh.rotation.z = -Math.PI / 3;
        this.wateringCanGroup.add(this.roseMesh);

        // Curved Handle Loop
        const handleCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.35, 0.25, 0),
            new THREE.Vector3(-0.65, 0.0, 0),
            new THREE.Vector3(-0.35, -0.25, 0)
        ]);
        const handleGeo = new THREE.TubeGeometry(handleCurve, 24, 0.035, 16, false);
        const handleMesh = new THREE.Mesh(handleGeo, canMat);
        this.wateringCanGroup.add(handleMesh);

        // Pin to Camera Viewport so it NEVER rotates with scene OrbitControls!
        this.camera.add(this.wateringCanGroup);
    }

    setCO2Level(level) {}

    setWaterLevel(level) {
        this.waterLevel = level;
    }

    setLightLevel(level) {
        let intensity = 1.6;
        let emissive = 1.2;
        let opacityCorona = 0.35;
        let spotIntensity = 1.8;
        let opacityCone = 0.14;

        if (level === 'low') {
            intensity = 0.8;
            emissive = 0.5;
            opacityCorona = 0.18;
            spotIntensity = 0.8;
            opacityCone = 0.05;
        } else if (level === 'high') {
            intensity = 2.4;
            emissive = 2.0;
            opacityCorona = 0.6;
            spotIntensity = 2.6;
            opacityCone = 0.22;
        }

        if (this.sunLight) this.sunLight.intensity = intensity;
        if (this.spotLight) this.spotLight.intensity = spotIntensity;
        if (this.sunMat) this.sunMat.emissiveIntensity = emissive;
        if (this.coronaMat) this.coronaMat.opacity = opacityCorona;
        if (this.coneMat) this.coneMat.opacity = opacityCone;
    }

    onResize() {
        if (!this.container) return;
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    }

    getWorldCloudPosition() {
        return this.getWorldWateringCanTipPosition();
    }

    getWorldWateringCanTipPosition() {
        const tipPos = new THREE.Vector3();
        if (this.roseMesh) {
            this.roseMesh.getWorldPosition(tipPos);
        } else {
            tipPos.set(-1.2, 2.6, 0.0);
        }
        return tipPos;
    }

    render() {
        if (this.controls) this.controls.update();

        // Animate Watering Can pour tilt depth
        if (this.wateringCanGroup) {
            const targetRot = (this.waterLevel === 'high' || this.waterLevel === 'medium') ? -0.72 : -0.52;
            this.wateringCanGroup.rotation.z += (targetRot - this.wateringCanGroup.rotation.z) * 0.08;
        }

        const worldSunPos = new THREE.Vector3();
        if (this.sunMesh) this.sunMesh.getWorldPosition(worldSunPos);

        const plantLeavesTarget = new THREE.Vector3(0, 1.4, 0);

        if (this.conicalBeamMesh) {
            const dist = worldSunPos.distanceTo(plantLeavesTarget);
            this.conicalBeamMesh.position.copy(worldSunPos);
            this.conicalBeamMesh.scale.set(1, dist / 8.0, 1);
            this.conicalBeamMesh.lookAt(plantLeavesTarget);
            this.conicalBeamMesh.rotateX(-Math.PI / 2);
        }

        if (this.coronaMesh) {
            const pulse = 1.0 + Math.sin(Date.now() * 0.003) * 0.08;
            this.coronaMesh.scale.setScalar(pulse);
        }

        this.renderer.render(this.scene, this.camera);
    }
}
