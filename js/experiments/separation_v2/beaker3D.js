import * as THREE from 'three';

export class SingleBeaker3D {
    constructor(sceneManager, id, homePos) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.scene;
        this.id = id;
        this.homePosition = homePos.clone();

        this.group = new THREE.Group();
        this.group.name = `beaker_${id}`;
        this.group.userData = {
            type: 'beaker_object',
            id: id,
            isDragging: false,
            homePosition: this.homePosition
        };
        this.group.position.copy(this.homePosition);

        this.ingredients = [];
        this.particleSystems = {};
        this.boilingParticles = null;
        this.steamParticles = null;

        this.initBeakerMesh();
        this.initFluidMesh();
        this.initAnimationParticles();
        this.scene.add(this.group);
    }

    initBeakerMesh() {
        const beakerGeo = new THREE.CylinderGeometry(0.35, 0.32, 0.72, 36, 1, true);
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.45,
            roughness: 0.05,
            metalness: 0.1,
            transmission: 0.95,
            thickness: 0.3,
            ior: 1.52,
            depthWrite: false
        });
        const beakerMesh = new THREE.Mesh(beakerGeo, glassMat);
        beakerMesh.position.y = 0.36;
        beakerMesh.castShadow = true;
        this.group.add(beakerMesh);

        const rimGeo = new THREE.TorusGeometry(0.352, 0.012, 12, 36);
        const rimMesh = new THREE.Mesh(rimGeo, glassMat);
        rimMesh.rotation.x = Math.PI / 2;
        rimMesh.position.y = 0.72;
        rimMesh.raycast = () => {};
        this.group.add(rimMesh);

        const baseGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.04, 36);
        const baseMesh = new THREE.Mesh(baseGeo, glassMat);
        baseMesh.position.y = 0.02;
        baseMesh.raycast = () => {};
        this.group.add(baseMesh);

        const scaleGroup = new THREE.Group();
        const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        for (let i = 1; i <= 4; i++) {
            const width = (i % 2 === 0) ? 0.12 : 0.07;
            const tickGeo = new THREE.PlaneGeometry(width, 0.01);
            const tickMesh = new THREE.Mesh(tickGeo, whiteMat);
            tickMesh.position.set(0, 0.12 + i * 0.11, 0.33);
            tickMesh.raycast = () => {};
            scaleGroup.add(tickMesh);
        }
        scaleGroup.raycast = () => {};
        this.group.add(scaleGroup);
    }

    initFluidMesh() {
        const waterGeo = new THREE.CylinderGeometry(0.32, 0.30, 0.28, 36);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            transparent: true,
            opacity: 0.88,
            roughness: 0.1,
            metalness: 0.05,
            depthWrite: false
        });
        this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
        this.waterMesh.position.y = 0.16;
        this.waterMesh.visible = false;
        this.waterMesh.renderOrder = 2;
        this.waterMesh.raycast = () => {};
        this.group.add(this.waterMesh);

        // Natural Golden Yellow Vegetable Oil Color (0xfacc15)
        const oilGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.12, 36);
        const oilMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            roughness: 0.15,
            metalness: 0.05,
            transparent: true,
            opacity: 0.88,
            depthWrite: false
        });
        this.oilMesh = new THREE.Mesh(oilGeo, oilMat);
        this.oilMesh.position.y = 0.34;
        this.oilMesh.visible = false;
        this.oilMesh.renderOrder = 3;
        this.oilMesh.raycast = () => {};
        this.group.add(this.oilMesh);
    }

    initAnimationParticles() {
        const bubbleCount = 30;
        const bubbleGeo = new THREE.BufferGeometry();
        const bubblePositions = new Float32Array(bubbleCount * 3);

        for (let i = 0; i < bubbleCount; i++) {
            bubblePositions[i * 3] = (Math.random() - 0.5) * 0.5;
            bubblePositions[i * 3 + 1] = 0.06 + Math.random() * 0.2;
            bubblePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }

        bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));
        const bubbleMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.8 });
        this.boilingParticles = new THREE.Points(bubbleGeo, bubbleMat);
        this.boilingParticles.visible = false;
        this.boilingParticles.raycast = () => {};
        this.group.add(this.boilingParticles);

        const steamCount = 25;
        const steamGeo = new THREE.BufferGeometry();
        const steamPositions = new Float32Array(steamCount * 3);

        for (let i = 0; i < steamCount; i++) {
            steamPositions[i * 3] = (Math.random() - 0.5) * 0.4;
            steamPositions[i * 3 + 1] = 0.4 + Math.random() * 0.6;
            steamPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
        }

        steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
        const steamMat = new THREE.PointsMaterial({ color: 0xe2e8f0, size: 0.05, transparent: true, opacity: 0.4 });
        this.steamParticles = new THREE.Points(steamGeo, steamMat);
        this.steamParticles.visible = false;
        this.steamParticles.raycast = () => {};
        this.group.add(this.steamParticles);
    }

    setBoilingAnimation(active) {
        if (this.boilingParticles) this.boilingParticles.visible = active;
        if (this.steamParticles) this.steamParticles.visible = active;
    }

    addIngredient(matData) {
        if (!this.ingredients.some(i => i.id === matData.id)) {
            this.ingredients.push(matData);
            if (matData.id === 'water' || matData.id === 'oil') {
                this.animateFluidRising(matData.id);
            } else {
                this.updateContents();
            }
        }
    }

    animateFluidRising(type) {
        const hasWater = this.ingredients.some(i => i.id === 'water');
        const startTime = performance.now();
        const duration = 1000;

        if (type === 'water') {
            this.waterMesh.visible = true;
            this.waterMesh.scale.y = 0.05;
            this.waterMesh.position.y = 0.05;

            const animateWater = (now) => {
                const prog = Math.min((now - startTime) / duration, 1);
                const ease = 0.5 - Math.cos(prog * Math.PI) / 2;

                this.waterMesh.scale.y = 0.05 + ease * 0.95;
                this.waterMesh.position.y = 0.05 + ease * 0.11;

                if (prog < 1) {
                    requestAnimationFrame(animateWater);
                } else {
                    this.updateContents();
                }
            };
            requestAnimationFrame(animateWater);
        } else if (type === 'oil') {
            this.oilMesh.visible = true;
            const targetY = hasWater ? 0.34 : 0.09;

            this.oilMesh.scale.y = 0.05;
            this.oilMesh.position.y = targetY - 0.04;

            const animateOil = (now) => {
                const prog = Math.min((now - startTime) / duration, 1);
                const ease = 0.5 - Math.cos(prog * Math.PI) / 2;

                this.oilMesh.scale.y = 0.05 + ease * 0.95;
                this.oilMesh.position.y = (targetY - 0.04) + ease * 0.04;

                if (prog < 1) {
                    requestAnimationFrame(animateOil);
                } else {
                    this.updateContents();
                }
            };
            requestAnimationFrame(animateOil);
        }
    }

    updateContents() {
        const hasWater = this.ingredients.some(i => i.id === 'water');
        const hasOil = this.ingredients.some(i => i.id === 'oil');
        const solids = this.ingredients.filter(i => i.type.startsWith('solid'));

        if (hasWater) {
            this.waterMesh.visible = true;
            this.waterMesh.scale.y = 1.0;
            this.waterMesh.position.y = 0.16;
        } else {
            this.waterMesh.visible = false;
        }

        if (hasOil) {
            this.oilMesh.visible = true;
            this.oilMesh.scale.y = 1.0;
            this.oilMesh.position.y = hasWater ? 0.34 : 0.09;
        } else {
            this.oilMesh.visible = false;
        }

        solids.forEach(solid => {
            if (!this.particleSystems[solid.id]) {
                this.particleSystems[solid.id] = this.createDistinctMaterialGroup(solid);
                this.group.add(this.particleSystems[solid.id]);
            } else {
                this.particleSystems[solid.id].visible = true;
            }
        });
    }

    createDistinctMaterialGroup(solidData) {
        const pGroup = new THREE.Group();
        pGroup.name = `particles_${solidData.id}`;
        pGroup.raycast = () => {};

        if (solidData.id === 'sand') {
            const sandGeo = new THREE.CylinderGeometry(0.31, 0.29, 0.05, 32);
            const sandMat = new THREE.MeshStandardMaterial({ color: 0xc28e5c, roughness: 0.95, metalness: 0.05 });
            const sandBed = new THREE.Mesh(sandGeo, sandMat);
            sandBed.position.y = 0.045;
            sandBed.renderOrder = 4;
            sandBed.raycast = () => {};
            pGroup.add(sandBed);

            const grainCount = 90;
            const grainGeo = new THREE.BoxGeometry(0.018, 0.018, 0.018);
            const grainMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.9 });
            const instancedGrains = new THREE.InstancedMesh(grainGeo, grainMat, grainCount);
            instancedGrains.renderOrder = 5;
            instancedGrains.raycast = () => {};
            const dummy = new THREE.Object3D();

            for (let i = 0; i < grainCount; i++) {
                const radius = Math.random() * 0.28;
                const theta = Math.random() * Math.PI * 2;
                dummy.position.set(Math.cos(theta) * radius, 0.07 + Math.random() * 0.015, Math.sin(theta) * radius);
                dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                dummy.updateMatrix();
                instancedGrains.setMatrixAt(i, dummy.matrix);
            }
            instancedGrains.instanceMatrix.needsUpdate = true;
            pGroup.add(instancedGrains);
        } else if (solidData.id === 'iron') {
            const count = 120;
            const ironGeo = new THREE.BoxGeometry(0.012, 0.012, 0.03);
            const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.2 });
            const instanced = new THREE.InstancedMesh(ironGeo, ironMat, count);
            instanced.renderOrder = 4;
            instanced.raycast = () => {};
            const dummy = new THREE.Object3D();

            for (let i = 0; i < count; i++) {
                const radius = Math.random() * 0.26;
                const theta = Math.random() * Math.PI * 2;
                dummy.position.set(Math.cos(theta) * radius, 0.035 + Math.random() * 0.04, Math.sin(theta) * radius);
                dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                dummy.updateMatrix();
                instanced.setMatrixAt(i, dummy.matrix);
            }
            instanced.instanceMatrix.needsUpdate = true;
            pGroup.add(instanced);
        } else if (solidData.id === 'salt') {
            // White Salt Sediment Bed + Sparkling Cubic Salt Crystals clearly visible inside water!
            const saltBedGeo = new THREE.CylinderGeometry(0.31, 0.29, 0.05, 32);
            const saltBedMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.1 });
            const saltBed = new THREE.Mesh(saltBedGeo, saltBedMat);
            saltBed.position.y = 0.045;
            saltBed.renderOrder = 4;
            saltBed.raycast = () => {};
            pGroup.add(saltBed);

            const count = 80;
            const crystalGeo = new THREE.BoxGeometry(0.016, 0.016, 0.016);
            const crystalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
            const instancedCrystals = new THREE.InstancedMesh(crystalGeo, crystalMat, count);
            instancedCrystals.renderOrder = 5;
            instancedCrystals.raycast = () => {};
            const dummy = new THREE.Object3D();

            for (let i = 0; i < count; i++) {
                const radius = Math.random() * 0.28;
                const theta = Math.random() * Math.PI * 2;
                dummy.position.set(Math.cos(theta) * radius, 0.07 + Math.random() * 0.015, Math.sin(theta) * radius);
                dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                dummy.updateMatrix();
                instancedCrystals.setMatrixAt(i, dummy.matrix);
            }
            instancedCrystals.instanceMatrix.needsUpdate = true;
            pGroup.add(instancedCrystals);
        } else if (solidData.id === 'pebbles') {
            const count = 14;
            const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });

            for (let i = 0; i < count; i++) {
                const pebbleGeo = new THREE.DodecahedronGeometry(0.028 + Math.random() * 0.015, 1);
                const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
                pebble.renderOrder = 4;
                pebble.raycast = () => {};
                const r = Math.random() * 0.25;
                const t = Math.random() * Math.PI * 2;
                pebble.position.set(Math.cos(t) * r, 0.05 + Math.random() * 0.03, Math.sin(t) * r);
                pebble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                pGroup.add(pebble);
            }
        }

        return pGroup;
    }

    removeIngredient(materialId) {
        this.ingredients = this.ingredients.filter(i => i.id !== materialId);
        if (this.particleSystems[materialId]) {
            this.particleSystems[materialId].visible = false;
        }
        this.updateContents();
    }

    resetBeaker() {
        this.ingredients = [];
        if (this.waterMesh) this.waterMesh.visible = false;
        if (this.oilMesh) this.oilMesh.visible = false;
        this.setBoilingAnimation(false);

        Object.values(this.particleSystems).forEach(sys => {
            sys.visible = false;
        });

        this.group.position.copy(this.homePosition);
        this.group.rotation.set(0, 0, 0);
    }
}

export class Beaker3D {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.scene;

        this.beaker1 = new SingleBeaker3D(sceneManager, '1', new THREE.Vector3(-0.6, 0, 0));
        this.beaker2 = new SingleBeaker3D(sceneManager, '2', new THREE.Vector3(0.6, 0, 0));

        this.group = this.beaker1.group;
        this.secondaryGroup = this.beaker2.group;
        this.ingredients = this.beaker1.ingredients;
        this.particleSystems = this.beaker1.particleSystems;
        this.waterMesh = this.beaker1.waterMesh;
        this.oilMesh = this.beaker1.oilMesh;
    }

    addIngredient(matData) {
        this.beaker1.addIngredient(matData);
    }

    removeIngredient(materialId) {
        this.beaker1.removeIngredient(materialId);
        this.beaker2.removeIngredient(materialId);
    }

    setBoilingAnimation(active) {
        this.beaker1.setBoilingAnimation(active);
        this.beaker2.setBoilingAnimation(active);
    }

    resetBeaker() {
        this.beaker1.resetBeaker();
        this.beaker2.resetBeaker();
    }
}
