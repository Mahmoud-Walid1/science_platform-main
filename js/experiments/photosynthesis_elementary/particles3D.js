/**
 * particles3D.js
 * Clean Architecture - 3D Particle Systems with Water Droplets Spawning from 3D Green Watering Can.
 */

export class Particles3D {
    constructor(scene) {
        this.scene = scene;

        this.airLinesGroup = new THREE.Group();
        this.airLinesGroup.renderOrder = -100; // Force Three.js to render airflow lines FIRST behind plant!

        this.waterGroup = new THREE.Group();
        this.o2Group = new THREE.Group();
        this.glucoseGroup = new THREE.Group();

        this.scene.add(this.waterGroup);
        this.scene.add(this.o2Group);
        this.scene.add(this.glucoseGroup);

        this.spawnTimer = 0;
        this.isAirLinesAttachedToCamera = false;

        this.initGeometriesAndMaterials();
        this.initProminentAirflowLines();
    }

    initGeometriesAndMaterials() {
        // 1. 💧 Water: Realistic 3D Teardrop Raindroplet Geometry & Glossy Liquid Material
        const createTeardropGeo = () => {
            const points = [];
            for (let i = 0; i <= 24; i++) {
                const t = i / 24;
                const y = (1 - t) * 0.28 + t * (-0.18);
                const r = Math.sin(t * Math.PI) * (1 - 0.45 * t) * 0.16;
                points.push(new THREE.Vector2(Math.max(0.001, r), y));
            }
            return new THREE.LatheGeometry(points, 24);
        };

        this.waterGeo = createTeardropGeo();
        this.waterMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            emissive: 0x0369a1,
            emissiveIntensity: 0.2,
            roughness: 0.15,
            metalness: 0.1
        });

        // 2. 🫧 O2: Translucent Oxygen Bubble Geometry & Material
        this.o2Geo = new THREE.SphereGeometry(0.12, 32, 32);
        this.o2Mat = new THREE.MeshPhysicalMaterial({
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.7,
            roughness: 0.0,
            transmission: 0.8,
            thickness: 0.5
        });

        // 3. 🟢 Glucose: Glowing Energy Sphere Geometry & Material
        this.glucoseGeo = new THREE.SphereGeometry(0.12, 16, 16);
        this.glucoseMat = new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            emissive: 0x16a34a,
            emissiveIntensity: 0.8,
            roughness: 0.2
        });
    }

    initProminentAirflowLines() {
        this.airLineMeshes = [];

        const createAirflowCurveInCameraSpace = (yOffset, waveFreq) => {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-5.2, 0.2 + yOffset, -8.0),
                new THREE.Vector3(-2.6, 0.25 + yOffset + waveFreq, -8.0),
                new THREE.Vector3(0.0, 0.18 + yOffset - waveFreq, -8.0),
                new THREE.Vector3(2.4, 0.22 + yOffset + waveFreq, -8.0),
                new THREE.Vector3(4.5, 0.2 + yOffset, -8.0)
            ]);
            return new THREE.TubeGeometry(curve, 54, 0.038, 10, false);
        };

        const offsets = [
            { y: 0.65, wave: 0.07 },
            { y: 0.45, wave: -0.06 },
            { y: 0.25, wave: 0.08 },
            { y: 0.08, wave: -0.07 },
            { y: -0.1, wave: 0.06 },
            { y: -0.28, wave: -0.08 },
            { y: -0.45, wave: 0.07 },
            { y: -0.62, wave: -0.06 }
        ];

        offsets.forEach((off, idx) => {
            const mat = new THREE.MeshBasicMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.6,
                depthTest: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });

            const geo = createAirflowCurveInCameraSpace(off.y, off.wave);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.renderOrder = -100;
            mesh.userData = { index: idx };
            this.airLinesGroup.add(mesh);
            this.airLineMeshes.push(mesh);
        });
    }

    update(lightLevel, co2Level, waterLevel, rateScore, sceneManager) {
        this.spawnTimer++;

        if (sceneManager && sceneManager.camera && !this.isAirLinesAttachedToCamera) {
            sceneManager.camera.add(this.airLinesGroup);
            this.isAirLinesAttachedToCamera = true;
        }

        const waterMult = waterLevel === 'high' ? 3.2 : (waterLevel === 'medium' ? 1.8 : 0.7);
        const outputMult = rateScore * 3;

        let activeLineCount = 5;
        let flowSpeedMult = 1.0;
        let lineOpacity = 0.6;

        if (co2Level === 'low') {
            activeLineCount = 3;
            flowSpeedMult = 0.6;
            lineOpacity = 0.4;
        } else if (co2Level === 'high') {
            activeLineCount = 8;
            flowSpeedMult = 2.0;
            lineOpacity = 0.85;
        }

        this.airLineMeshes.forEach((mesh, idx) => {
            if (idx < activeLineCount) {
                mesh.visible = true;
                mesh.material.opacity = lineOpacity;
            } else {
                mesh.visible = false;
            }
        });

        // Get dynamic world position of 3D Green Watering Can Nozzle Tip
        const nozzleTipPos = (sceneManager && sceneManager.getWorldWateringCanTipPosition) 
            ? sceneManager.getWorldWateringCanTipPosition() 
            : new THREE.Vector3(-0.7, 2.8, 0.4);

        // 1. 💧 Spawn 3D Teardrop Water Droplets from 3D Watering Can Nozzle down to Soil
        if (this.spawnTimer % Math.max(2, Math.floor(10 / waterMult)) === 0) {
            const p = new THREE.Mesh(this.waterGeo, this.waterMat);
            
            const spawnPos = new THREE.Vector3(
                nozzleTipPos.x + (Math.random() - 0.5) * 0.25,
                nozzleTipPos.y + (Math.random() - 0.5) * 0.15,
                nozzleTipPos.z + (Math.random() - 0.5) * 0.25
            );
            p.position.copy(spawnPos);

            const targetPos = new THREE.Vector3(
                (Math.random() - 0.5) * 0.65,
                0.05,
                (Math.random() - 0.5) * 0.65
            );

            p.userData = {
                startPos: spawnPos.clone(),
                targetPos: targetPos,
                progress: 0,
                speed: 0.024 + Math.random() * 0.015,
                scale: 0.75 + Math.random() * 0.4
            };
            p.scale.setScalar(p.userData.scale);
            this.waterGroup.add(p);
        }

        // 2. 🫧 Spawn 3D O2 Bubbles from Leaves into Air
        if (outputMult > 0.3 && this.spawnTimer % Math.max(2, Math.floor(14 / outputMult)) === 0) {
            const p = new THREE.Mesh(this.o2Geo, this.o2Mat);
            p.position.set((Math.random() - 0.5) * 1.2, 1.4 + Math.random() * 0.8, (Math.random() - 0.5) * 1.0);
            p.userData = {
                vy: 0.02 + Math.random() * 0.02,
                vx: (Math.random() - 0.5) * 0.01,
                life: 0
            };
            this.o2Group.add(p);
        }

        // 3. 🟢 Spawn 3D Glucose Energy Spheres in Plant
        if (outputMult > 0.3 && this.spawnTimer % Math.max(2, Math.floor(16 / outputMult)) === 0) {
            const p = new THREE.Mesh(this.glucoseGeo, this.glucoseMat);
            p.position.set((Math.random() - 0.5) * 1.0, 1.5 + (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.6);
            p.userData = {
                pulse: 0
            };
            this.glucoseGroup.add(p);
        }

        const time = Date.now() * 0.003 * flowSpeedMult;
        this.airLineMeshes.forEach((mesh, idx) => {
            mesh.position.y = Math.sin(time + idx * 0.8) * 0.04;
        });

        this.animateGroup(this.waterGroup, (p) => {
            p.userData.progress += p.userData.speed;
            p.position.lerpVectors(p.userData.startPos, p.userData.targetPos, p.userData.progress);
            return p.userData.progress >= 1.0;
        });

        this.animateGroup(this.o2Group, (p) => {
            p.userData.life += 0.02;
            p.position.y += p.userData.vy;
            p.position.x += Math.sin(p.userData.life * 5) * 0.01;
            return p.position.y > 5.0 || p.userData.life > 3.0;
        });

        this.animateGroup(this.glucoseGroup, (p) => {
            p.userData.pulse += 0.05;
            p.scale.setScalar(1.0 + Math.sin(p.userData.pulse) * 0.25);
            return p.userData.pulse > Math.PI * 4;
        });
    }

    animateGroup(group, removeCheck) {
        for (let i = group.children.length - 1; i >= 0; i--) {
            const child = group.children[i];
            if (removeCheck(child)) {
                group.remove(child);
                if (child.geometry) child.geometry.dispose();
            }
        }
    }
}
