import * as THREE from 'three';

export class LabSetup {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.scene;

        this.interactiveObjects = [];
        this.tubes = [];
        this.stoppers = [];
        this.boxes = [];
        this.cuvettes = [];
        this.cuvetteLids = [];
        this.plantsInTank = [];
        this.lamps = [];
        
        // Materials cache
        this.materials = {};
        this.initMaterials();

        // Build all models
        this.buildPosters();
        this.buildLamps();
        this.buildElodeaTank();
        this.buildTestTubesAndRack();
        this.buildStoppers();
        this.buildLightBlockingBoxes();
        this.buildCuvetteRackAndCuvettes();
        this.buildCuvetteLids();
        this.buildPipetteAndTips();
        this.buildSpectrophotometer();
    }

    initMaterials() {
        this.materials.glass = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.35,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.9,
            ior: 1.5,
            thickness: 0.05,
            side: THREE.DoubleSide
        });

        this.materials.water = new THREE.MeshPhysicalMaterial({
            color: 0xe0f2fe,
            transparent: true,
            opacity: 0.5,
            roughness: 0.1,
            metalness: 0.0,
            transmission: 0.8,
            ior: 1.33
        });

        // BTB solution colors (Neutral green initially)
        this.materials.btbGreen = new THREE.MeshStandardMaterial({
            color: 0x22c55e, // Green (Neutral pH ~7.0)
            roughness: 0.2,
            transparent: true,
            opacity: 0.85
        });

        this.materials.btbBlue = new THREE.MeshStandardMaterial({
            color: 0x1d4ed8, // Blue (Basic pH ~7.8)
            roughness: 0.2,
            transparent: true,
            opacity: 0.85
        });

        this.materials.btbYellow = new THREE.MeshStandardMaterial({
            color: 0xeab308, // Yellow (Acidic pH ~6.2)
            roughness: 0.2,
            transparent: true,
            opacity: 0.85
        });

        this.materials.rubber = new THREE.MeshStandardMaterial({
            color: 0x475569, // Grey-slate rubber stoppers
            roughness: 0.8,
            metalness: 0.1
        });

        this.materials.cardboard = new THREE.MeshStandardMaterial({
            color: 0x78350f, // Brown boxes
            roughness: 0.9,
            metalness: 0.0
        });

        this.materials.plasticGrey = new THREE.MeshStandardMaterial({
            color: 0xcbd5e1,
            roughness: 0.4
        });

        this.materials.plasticDark = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.5
        });

        this.materials.brass = new THREE.MeshStandardMaterial({
            color: 0xd97706,
            metalness: 0.8,
            roughness: 0.2
        });

        this.materials.leaf = new THREE.MeshStandardMaterial({
            color: 0x15803d,
            roughness: 0.6
        });
    }

    buildPosters() {
        // pH Scale poster on wall
        const posterGeo = new THREE.PlaneGeometry(2.0, 0.7);
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 180);
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText('كاشف بروموثيمول الأزرق (BTB pH Poster)', 256, 30);

        // Draw pH color strip
        const colors = [
            { ph: '6.0', col: '#eab308', lbl: 'حمضي' },
            { ph: '6.4', col: '#ca8a04', lbl: '' },
            { ph: '6.8', col: '#84cc16', lbl: '' },
            { ph: '7.0', col: '#22c55e', lbl: 'حيادي' },
            { ph: '7.2', col: '#10b981', lbl: '' },
            { ph: '7.6', col: '#06b6d4', lbl: '' },
            { ph: '8.0', col: '#1d4ed8', lbl: 'قاعدي' }
        ];

        const w = 420 / colors.length;
        colors.forEach((c, idx) => {
            const x = 46 + idx * w;
            ctx.fillStyle = c.col;
            ctx.fillRect(x, 60, w - 8, 45);
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 12px Cairo';
            ctx.fillText(c.ph, x + w/2 - 4, 125);
            if (c.lbl) {
                ctx.font = '8px Cairo';
                ctx.fillText(c.lbl, x + w/2 - 4, 145);
            }
        });

        const posterTex = new THREE.CanvasTexture(canvas);
        const posterMat = new THREE.MeshStandardMaterial({ map: posterTex });
        const posterMesh = new THREE.Mesh(posterGeo, posterMat);
        posterMesh.position.set(-1.8, 2.5, -2.18);
        this.scene.add(posterMesh);

        // Experimental Setup Poster
        const setupGeo = new THREE.PlaneGeometry(1.6, 1.0);
        const setupCanvas = document.createElement('canvas');
        setupCanvas.width = 400;
        setupCanvas.height = 250;
        const sCtx = setupCanvas.getContext('2d');
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0, 0, 400, 250);
        sCtx.strokeStyle = '#15803d';
        sCtx.lineWidth = 4;
        sCtx.strokeRect(2, 2, 396, 246);

        sCtx.fillStyle = '#14532d';
        sCtx.font = 'bold 16px Cairo';
        sCtx.textAlign = 'center';
        sCtx.fillText('توزيع أنابيب التجربة', 200, 40);

        sCtx.fillStyle = '#334155';
        sCtx.font = '12px Cairo';
        sCtx.fillText('أنبوب 1: كاشف فقط + إضاءة (ضبط الضوء)', 200, 85);
        sCtx.fillText('أنبوب 2: كاشف + إيلوديا + إضاءة (بناء ضوئي)', 200, 120);
        sCtx.fillText('أنبوب 3: كاشف + إيلوديا + ظلام (تنفس خلوي)', 200, 155);
        sCtx.fillText('أنبوب 4: كاشف فقط + ظلام (ضبط الظلام)', 200, 190);

        const setupTex = new THREE.CanvasTexture(setupCanvas);
        const setupMat = new THREE.MeshStandardMaterial({ map: setupTex });
        const setupMesh = new THREE.Mesh(setupGeo, setupMat);
        setupMesh.position.set(1.8, 2.3, -2.18);
        this.scene.add(setupMesh);
    }

    buildLamps() {
        // Build 2 lamps shining on the tubes
        const lampPositions = [-1.4, 1.4];
        
        lampPositions.forEach((xPos, idx) => {
            const lampGroup = new THREE.Group();
            lampGroup.name = `lamp_${idx + 1}`;

            // Stand base
            const baseGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
            const baseMesh = new THREE.Mesh(baseGeo, this.materials.plasticDark);
            baseMesh.position.y = 0.025;
            baseMesh.receiveShadow = true;
            lampGroup.add(baseMesh);

            // Pole
            const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
            const poleMesh = new THREE.Mesh(poleGeo, this.materials.plasticGrey);
            poleMesh.position.set(0, 0.6, -0.1);
            poleMesh.castShadow = true;
            lampGroup.add(poleMesh);

            // Horizontal bar
            const barGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8);
            const barMesh = new THREE.Mesh(barGeo, this.materials.plasticGrey);
            barMesh.rotation.x = Math.PI / 2;
            barMesh.position.set(0, 1.2, 0.05);
            lampGroup.add(barMesh);

            // Lampshade (Dome)
            const shadeGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.2, 16);
            const shadeMesh = new THREE.Mesh(shadeGeo, this.materials.plasticDark);
            shadeMesh.position.set(0, 1.1, 0.2);
            shadeMesh.castShadow = true;
            lampGroup.add(shadeMesh);

            // Bulb (Sphere)
            const bulbGeo = new THREE.SphereGeometry(0.06, 16, 16);
            const bulbMat = new THREE.MeshStandardMaterial({
                color: 0x94a3b8,
                emissive: 0x000000,
                roughness: 0.1
            });
            const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
            bulbMesh.position.set(0, 1.0, 0.2);
            lampGroup.add(bulbMesh);

            // SpotLight / PointLight pointing down
            const spotLight = new THREE.SpotLight(0xfffbeb, 0, 4.0, Math.PI / 4, 0.5, 1);
            spotLight.position.set(xPos, 1.0, 0.2 + 0.5);
            spotLight.target.position.set(xPos, 0, 0.5);
            this.scene.add(spotLight.target);
            this.scene.add(spotLight);

            lampGroup.position.set(xPos, 0, 0.5);
            this.scene.add(lampGroup);

            this.lamps.push({
                group: lampGroup,
                bulbMat: bulbMat,
                light: spotLight,
                isOn: false
            });
        });

        // Switch button on the table
        const switchGeo = new THREE.BoxGeometry(0.18, 0.08, 0.18);
        const switchBase = new THREE.Mesh(switchGeo, this.materials.plasticDark);
        switchBase.position.set(0, 0.04, 1.3);
        switchBase.receiveShadow = true;
        
        const btnGeo = new THREE.BoxGeometry(0.1, 0.05, 0.1);
        const btnMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        const btnMesh = new THREE.Mesh(btnGeo, btnMat);
        btnMesh.position.set(0, 0.07, 1.3);
        btnMesh.name = "btn_lamps_switch";
        
        const switchGroup = new THREE.Group();
        switchGroup.add(switchBase);
        switchGroup.add(btnMesh);
        switchGroup.userData = { type: 'lamp_switch' };
        this.scene.add(switchGroup);
        this.interactiveObjects.push(btnMesh);
    }

    buildElodeaTank() {
        // Build tank with water and plants to drag
        const tankGroup = new THREE.Group();
        tankGroup.position.set(-2.5, 0, 1.0);

        // Glass bowl
        const bowlGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
        const bowl = new THREE.Mesh(bowlGeo, this.materials.glass);
        bowl.position.y = 0.2;
        bowl.castShadow = true;
        bowl.receiveShadow = true;
        tankGroup.add(bowl);

        // Water level
        const waterGeo = new THREE.BoxGeometry(0.76, 0.35, 0.76);
        const water = new THREE.Mesh(waterGeo, this.materials.water);
        water.position.y = 0.185;
        tankGroup.add(water);

        // Draggable Plants inside tank
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
                homePosition: new THREE.Vector3(tankGroup.position.x + pos.x, 0.05, tankGroup.position.z + pos.z),
                placedInTube: null
            };

            this.create3DPlantMesh(plantGroup);
            plantGroup.position.copy(plantGroup.userData.homePosition);
            this.scene.add(plantGroup);
            this.interactiveObjects.push(plantGroup);
            this.plantsInTank.push(plantGroup);
        });

        // Label on tank
        const tankLabelGeo = new THREE.BoxGeometry(0.3, 0.1, 0.02);
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 64;
        labelCanvas.height = 32;
        const labelCtx = labelCanvas.getContext('2d');
        labelCtx.fillStyle = '#ffffff';
        labelCtx.fillRect(0,0,64,32);
        labelCtx.fillStyle = '#14532d';
        labelCtx.font = 'bold 9px Cairo';
        labelCtx.textAlign = 'center';
        labelCtx.fillText('نبات الإيلوديا', 32, 20);
        const labelTex = new THREE.CanvasTexture(labelCanvas);
        const tankLabel = new THREE.Mesh(tankLabelGeo, new THREE.MeshStandardMaterial({ map: labelTex }));
        tankLabel.position.set(0, 0.2, 0.41);
        tankGroup.add(tankLabel);

        this.scene.add(tankGroup);
    }

    create3DPlantMesh(group) {
        // Main stem
        const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8);
        const stemMesh = new THREE.Mesh(stemGeo, this.materials.leaf);
        stemMesh.position.y = 0.225;
        stemMesh.castShadow = true;
        group.add(stemMesh);

        // Leaves going up
        for (let y = 0.05; y <= 0.4; y += 0.05) {
            const rotY = Math.random() * Math.PI * 2;
            for (let i = 0; i < 3; i++) {
                const leafGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
                const leafMesh = new THREE.Mesh(leafGeo, this.materials.leaf);
                leafMesh.rotation.x = Math.PI / 3;
                leafMesh.rotation.y = rotY + (i * Math.PI * 2) / 3;
                leafMesh.position.set(0, y, 0);
                leafMesh.translateY(0.04);
                group.add(leafMesh);
            }
        }
    }

    buildTestTubesAndRack() {
        const rackGroup = new THREE.Group();
        rackGroup.position.set(0, 0, 0.5);

        // Base & Stand of Rack
        const baseGeo = new THREE.BoxGeometry(2.0, 0.08, 0.6);
        const base = new THREE.Mesh(baseGeo, this.materials.plasticGrey);
        base.position.y = 0.04;
        base.receiveShadow = true;
        rackGroup.add(base);

        const topGeo = new THREE.BoxGeometry(2.0, 0.04, 0.6);
        const topPlate = new THREE.Mesh(topGeo, this.materials.plasticGrey);
        topPlate.position.y = 0.6;
        topPlate.receiveShadow = true;
        rackGroup.add(topPlate);

        // Pillars
        [-0.95, 0.95].forEach(x => {
            const pillarGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.56, 8);
            const pillar = new THREE.Mesh(pillarGeo, this.materials.plasticDark);
            pillar.position.set(x, 0.32, 0);
            rackGroup.add(pillar);
        });

        // 4 Holes in the top plate for tubes
        // Create the 4 tubes
        const tubeXOffsets = [-0.65, -0.22, 0.22, 0.65];

        tubeXOffsets.forEach((xOffset, idx) => {
            const tubeGroup = new THREE.Group();
            tubeGroup.name = `tube_${idx + 1}`;
            tubeGroup.userData = {
                type: 'tube_object',
                index: idx + 1,
                hasPlant: false,
                hasStopper: false,
                hasBox: false,
                phValue: 7.0, // initial neutral pH
                isLiquidDispensed: false
            };

            // Glass Tube
            const glassGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.75, 16, 1, true);
            const glassTube = new THREE.Mesh(glassGeo, this.materials.glass);
            glassTube.position.y = 0.375;
            glassTube.castShadow = true;
            tubeGroup.add(glassTube);

            // Rounded glass bottom (half sphere)
            const bottomGeo = new THREE.SphereGeometry(0.12, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
            const bottomGlass = new THREE.Mesh(bottomGeo, this.materials.glass);
            bottomGlass.position.y = 0.0;
            tubeGroup.add(bottomGlass);

            // BTB fluid inside (cylinder)
            const fluidGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.55, 16);
            // Create unique material per tube to animate color separately
            const fluidMat = this.materials.btbGreen.clone();
            const fluid = new THREE.Mesh(fluidGeo, fluidMat);
            fluid.position.y = 0.275;
            fluid.name = "fluid_mesh";
            tubeGroup.add(fluid);

            // Snapping target spot for plant
            const plantSpot = new THREE.Object3D();
            plantSpot.position.set(0, 0.1, 0);
            plantSpot.name = "plant_snap_spot";
            tubeGroup.add(plantSpot);

            // Snapping target spot for stopper
            const stopperSpot = new THREE.Object3D();
            stopperSpot.position.set(0, 0.75, 0);
            stopperSpot.name = "stopper_snap_spot";
            tubeGroup.add(stopperSpot);

            // Label on the tube
            const labelGeo = new THREE.PlaneGeometry(0.1, 0.25);
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0,0,32,64);
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 24px Cairo';
            ctx.textAlign = 'center';
            ctx.fillText(`${idx + 1}`, 16, 42);
            const labelTex = new THREE.CanvasTexture(canvas);
            const labelMesh = new THREE.Mesh(labelGeo, new THREE.MeshStandardMaterial({ map: labelTex }));
            labelMesh.position.set(0, 0.45, 0.125);
            tubeGroup.add(labelMesh);

            tubeGroup.position.set(xOffset, 0.08, 0);
            rackGroup.add(tubeGroup);

            this.tubes.push({
                group: tubeGroup,
                fluidMesh: fluid,
                fluidMat: fluidMat,
                index: idx + 1
            });
        });

        this.scene.add(rackGroup);
    }

    buildStoppers() {
        // Build 4 rubber stoppers on the wall shelf
        const shelfXOffsets = [-1.5, -0.5, 0.5, 1.5];

        shelfXOffsets.forEach((x, idx) => {
            const stopperGroup = new THREE.Group();
            stopperGroup.name = `stopper_${idx + 1}`;
            stopperGroup.userData = {
                type: 'stopper_draggable',
                index: idx + 1,
                isDragging: false,
                homePosition: new THREE.Vector3(x, 1.44, -1.8),
                pluggedTubeIndex: null
            };

            // Rubber stopper mesh (tapered cylinder)
            const stopperGeo = new THREE.CylinderGeometry(0.1, 0.13, 0.18, 16);
            const stopper = new THREE.Mesh(stopperGeo, this.materials.rubber);
            stopper.position.y = 0.09;
            stopper.castShadow = true;
            stopperGroup.add(stopper);

            // Little metal ring on top
            const ringGeo = new THREE.TorusGeometry(0.04, 0.01, 8, 16);
            const ring = new THREE.Mesh(ringGeo, this.materials.brass);
            ring.position.y = 0.18;
            ring.rotation.x = Math.PI / 2;
            stopperGroup.add(ring);

            stopperGroup.position.copy(stopperGroup.userData.homePosition);
            this.scene.add(stopperGroup);
            this.interactiveObjects.push(stopperGroup);
            this.stoppers.push(stopperGroup);
        });
    }

    buildLightBlockingBoxes() {
        // Build 2 large cardboard boxes on the shelf
        // Box 1 on the left side of the shelf, Box 2 on the right
        const boxX = [-1.5, 1.5];
        
        boxX.forEach((x, idx) => {
            const boxGroup = new THREE.Group();
            boxGroup.name = `box_${idx + 1}`;
            boxGroup.userData = {
                type: 'box_draggable',
                index: idx + 1,
                isDragging: false,
                homePosition: new THREE.Vector3(x, 1.44, -1.3),
                coveringTubeIndex: null
            };

            // Cardboard cover box (open at bottom, hollowed-out look or just solid box covering tube)
            const outerGeo = new THREE.BoxGeometry(0.38, 1.0, 0.38);
            const boxMesh = new THREE.Mesh(outerGeo, this.materials.cardboard);
            boxMesh.position.y = 0.5;
            boxMesh.castShadow = true;
            boxMesh.receiveShadow = true;
            boxGroup.add(boxMesh);

            // Label "BOX" on front of box
            const labelGeo = new THREE.PlaneGeometry(0.24, 0.12);
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0,0,64,32);
            ctx.fillStyle = '#78350f';
            ctx.font = 'bold 12px Cairo';
            ctx.textAlign = 'center';
            ctx.fillText('حجب', 32, 20);
            const labelTex = new THREE.CanvasTexture(canvas);
            const labelMesh = new THREE.Mesh(labelGeo, new THREE.MeshStandardMaterial({ map: labelTex }));
            labelMesh.position.set(0, 0.5, 0.191);
            boxGroup.add(labelMesh);

            boxGroup.position.copy(boxGroup.userData.homePosition);
            this.scene.add(boxGroup);
            this.interactiveObjects.push(boxGroup);
            this.boxes.push(boxGroup);
        });
    }

    buildCuvetteRackAndCuvettes() {
        // Rack for cuvettes on right table side
        const cuvRack = new THREE.Group();
        cuvRack.position.set(2.0, 0, 0.8);

        // Rack base
        const rackBaseGeo = new THREE.BoxGeometry(1.6, 0.06, 0.5);
        const rackBase = new THREE.Mesh(rackBaseGeo, this.materials.plasticDark);
        rackBase.position.y = 0.03;
        cuvRack.add(rackBase);

        // 5 slots for cuvettes
        const cuvOffsets = [-0.6, -0.3, 0.0, 0.3, 0.6];
        const names = ['Blank', '1', '2', '3', '4'];

        cuvOffsets.forEach((xOffset, idx) => {
            const cuvetteGroup = new THREE.Group();
            cuvetteGroup.name = `cuvette_${names[idx]}`;
            cuvetteGroup.userData = {
                type: 'cuvette_object',
                id: names[idx],
                isFilled: idx === 0, // Blank is pre-filled with water
                isCapped: false,
                fluidColor: idx === 0 ? 0xffffff : null,
                phValue: idx === 0 ? 7.0 : null,
                absorbanceVal: idx === 0 ? 0.000 : null,
                homePosition: new THREE.Vector3(cuvRack.position.x + xOffset, 0.06, cuvRack.position.z),
                currentPosition: new THREE.Vector3(),
                inSpectrophotometer: false
            };

            // Small glass rectangle
            const glassGeo = new THREE.BoxGeometry(0.12, 0.32, 0.12);
            const glassCuv = new THREE.Mesh(glassGeo, this.materials.glass);
            glassCuv.position.y = 0.16;
            glassCuv.castShadow = true;
            cuvetteGroup.add(glassCuv);

            // Water/BTB fluid inside
            const fluidGeo = new THREE.BoxGeometry(0.1, 0.28, 0.1);
            let fluidMat = null;
            if (idx === 0) {
                // Pre-filled clear water
                fluidMat = this.materials.water.clone();
            } else {
                // Empty - hide initially by setting height/scale or opacity to 0
                fluidMat = this.materials.btbGreen.clone();
                fluidMat.transparent = true;
                fluidMat.opacity = 0;
            }
            const fluidMesh = new THREE.Mesh(fluidGeo, fluidMat);
            fluidMesh.position.y = 0.14;
            fluidMesh.name = "cuvette_fluid_mesh";
            cuvetteGroup.add(fluidMesh);

            // Small label paper on side
            const labelGeo = new THREE.PlaneGeometry(0.08, 0.1);
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0,0,32,32);
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 14px Cairo';
            ctx.textAlign = 'center';
            ctx.fillText(names[idx] === 'Blank' ? 'ض' : names[idx], 16, 22);
            const labelTex = new THREE.CanvasTexture(canvas);
            const labelMesh = new THREE.Mesh(labelGeo, new THREE.MeshStandardMaterial({ map: labelTex }));
            labelMesh.position.set(0, 0.24, 0.061);
            cuvetteGroup.add(labelMesh);

            cuvetteGroup.position.copy(cuvetteGroup.userData.homePosition);
            cuvetteGroup.userData.currentPosition.copy(cuvetteGroup.position);
            this.scene.add(cuvetteGroup);
            this.interactiveObjects.push(cuvetteGroup);
            this.cuvettes.push(cuvetteGroup);
        });

        this.scene.add(cuvRack);
    }

    buildCuvetteLids() {
        // Build 5 little cuvette caps on the shelf
        const xOffsets = [-1.0, -0.6, -0.2, 0.2, 0.6];
        
        xOffsets.forEach((x, idx) => {
            const capGroup = new THREE.Group();
            capGroup.name = `cuv_cap_${idx + 1}`;
            capGroup.userData = {
                type: 'cap_draggable',
                index: idx + 1,
                isDragging: false,
                homePosition: new THREE.Vector3(x, 1.44, -1.5),
                cappedCuvetteId: null
            };

            const capGeo = new THREE.BoxGeometry(0.14, 0.04, 0.14);
            const capMesh = new THREE.Mesh(capGeo, this.materials.plasticDark);
            capMesh.position.y = 0.02;
            capGroup.add(capMesh);

            capGroup.position.copy(capGroup.userData.homePosition);
            this.scene.add(capGroup);
            this.interactiveObjects.push(capGroup);
            this.cuvetteLids.push(capGroup);
        });
    }

    buildPipetteAndTips() {
        // P1000 Micropipette standing in holder
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
            homePosition: new THREE.Vector3(-1.0, 0.0, 1.3),
            currentPosition: new THREE.Vector3()
        };

        // Pipette Stand base
        const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 16), this.materials.plasticGrey);
        standBase.position.set(-1.0, 0.015, 1.3);
        standBase.receiveShadow = true;
        this.scene.add(standBase);

        const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 8), this.materials.plasticGrey);
        standPole.position.set(-1.0, 0.35, 1.25);
        standPole.castShadow = true;
        this.scene.add(standPole);

        const standHolder = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.12), this.materials.plasticDark);
        standHolder.position.set(-1.0, 0.65, 1.25);
        this.scene.add(standHolder);

        // Build 3D Pipette
        // Upper body (light blue/grey)
        const bodyGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.35, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 }); // Cyan/Blue body for P1000
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = 0.35;
        this.pipetteGroup.add(bodyMesh);

        // Lower body (white)
        const shaftGeo = new THREE.CylinderGeometry(0.02, 0.01, 0.25, 16);
        const shaftMesh = new THREE.Mesh(shaftGeo, this.materials.plasticGrey);
        shaftMesh.position.y = 0.125;
        this.pipetteGroup.add(shaftMesh);

        // Metallic ejector rod
        const rodGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.22, 8);
        const rodMesh = new THREE.Mesh(rodGeo, this.materials.brass);
        rodMesh.position.set(0.015, 0.2, 0);
        this.pipetteGroup.add(rodMesh);

        // Top plunger (red button)
        const plungerGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.06, 16);
        const plungerMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        const plungerMesh = new THREE.Mesh(plungerGeo, plungerMat);
        plungerMesh.position.y = 0.54;
        this.pipetteGroup.add(plungerMesh);

        // Ejector button (side red button)
        const ejBtnGeo = new THREE.BoxGeometry(0.015, 0.04, 0.015);
        const ejBtn = new THREE.Mesh(ejBtnGeo, plungerMat);
        ejBtn.position.set(-0.025, 0.44, 0);
        this.pipetteGroup.add(ejBtn);

        // Volume digital screen placeholder
        const screenGeo = new THREE.PlaneGeometry(0.025, 0.06);
        const sCanvas = document.createElement('canvas');
        sCanvas.width = 32;
        sCanvas.height = 64;
        const sCtx = sCanvas.getContext('2d');
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0,0,32,64);
        sCtx.fillStyle = '#000000';
        sCtx.font = 'bold 20px monospace';
        sCtx.fillText('10', 4, 25);
        sCtx.fillText('00', 4, 50);
        const sTex = new THREE.CanvasTexture(sCanvas);
        const screenMesh = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: sTex }));
        screenMesh.position.set(0, 0.38, 0.036);
        this.pipetteGroup.add(screenMesh);

        // Snapping point for pipette tip
        this.tipSnapSpot = new THREE.Object3D();
        this.tipSnapSpot.position.set(0, 0.0, 0);
        this.pipetteGroup.add(this.tipSnapSpot);

        // Detachable tip mesh (starts hidden)
        const tipGeo = new THREE.CylinderGeometry(0.01, 0.002, 0.12, 16);
        const tipMat = new THREE.MeshStandardMaterial({
            color: 0xfef08a, // Yellow P1000 tips
            transparent: true,
            opacity: 0.8
        });
        this.attachedTipMesh = new THREE.Mesh(tipGeo, tipMat);
        this.attachedTipMesh.position.y = -0.06;
        this.attachedTipMesh.visible = false;
        this.pipetteGroup.add(this.attachedTipMesh);

        // Small solution column inside pipette tip
        const pipFluidGeo = new THREE.CylinderGeometry(0.007, 0.003, 0.06, 8);
        const pipFluidMat = this.materials.btbGreen.clone();
        pipFluidMat.transparent = true;
        pipFluidMat.opacity = 0;
        this.pipetteFluidMesh = new THREE.Mesh(pipFluidGeo, pipFluidMat);
        this.pipetteFluidMesh.position.y = -0.07;
        this.attachedTipMesh.add(this.pipetteFluidMesh);

        this.pipetteGroup.position.copy(this.pipetteGroup.userData.homePosition);
        this.pipetteGroup.userData.currentPosition.copy(this.pipetteGroup.position);
        this.scene.add(this.pipetteGroup);
        this.interactiveObjects.push(this.pipetteGroup);

        // Tips Box on shelf/bench
        this.tipsBoxGroup = new THREE.Group();
        this.tipsBoxGroup.name = "tips_box";
        this.tipsBoxGroup.userData = { type: 'tips_box_object' };
        this.tipsBoxGroup.position.set(-1.0, 0, 0.5);

        // Box base
        const tbBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.6), this.materials.plasticGrey);
        tbBase.position.y = 0.125;
        tbBase.castShadow = true;
        this.tipsBoxGroup.add(tbBase);

        // Blue lid (which starts open)
        const tbLid = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.6), new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }));
        tbLid.position.set(0, 0.23, -0.28);
        tbLid.rotation.x = -Math.PI / 1.5; // open backwards
        this.tipsBoxGroup.add(tbLid);

        // Tip tray inserts (cylinders)
        for (let row = -2; row <= 2; row++) {
            for (let col = -2; col <= 2; col++) {
                const tipPlug = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 8), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
                tipPlug.position.set(row * 0.08, 0.24, col * 0.08);
                this.tipsBoxGroup.add(tipPlug);
            }
        }

        this.scene.add(this.tipsBoxGroup);
        this.interactiveObjects.push(this.tipsBoxGroup);
    }

    buildSpectrophotometer() {
        // Build Spectrophotometer machine
        this.specGroup = new THREE.Group();
        this.specGroup.name = "spectrophotometer";
        this.specGroup.position.set(2.8, 0, 0.1);
        this.specGroup.userData = {
            type: 'spec_machine_object',
            isOn: false,
            isLidOpen: false,
            wavelength: 500,
            hasCuvette: false,
            cuvetteInChamber: null
        };

        // Main chassis
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 1.0), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 }));
        chassis.position.y = 0.275;
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        this.specGroup.add(chassis);

        // Screen bezel
        const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.05), this.materials.plasticDark);
        bezel.position.set(-0.2, 0.45, 0.49);
        this.specGroup.add(bezel);

        // Screen face (initially dark/grey)
        const screenGeo = new THREE.PlaneGeometry(0.58, 0.18);
        this.specScreenMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
        const screenMesh = new THREE.Mesh(screenGeo, this.specScreenMat);
        screenMesh.position.set(-0.2, 0.45, 0.516);
        this.specGroup.add(screenMesh);

        // Power switch / control panel on spectrophotometer
        // Red Power button
        const powerBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
        powerBtn.rotation.x = Math.PI / 2;
        powerBtn.position.set(-0.2, 0.22, 0.51);
        powerBtn.name = "spec_power_btn";
        this.specGroup.add(powerBtn);

        // Measurement slot / chamber
        const chamberOuter = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.24), this.materials.plasticDark);
        chamberOuter.position.set(0.35, 0.35, 0.2);
        this.specGroup.add(chamberOuter);

        // Cuvette chamber snap spot inside (where a cuvette sits)
        this.specChamberSnapSpot = new THREE.Object3D();
        this.specChamberSnapSpot.position.set(0.35, 0.2, 0.2);
        this.specGroup.add(this.specChamberSnapSpot);

        // Chamber Lid (hinged at the back of the chamber)
        this.specLidGroup = new THREE.Group();
        this.specLidGroup.position.set(0.35, 0.51, 0.08); // hinge point at back-top of chamber

        const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.25), this.materials.plasticGrey);
        lidMesh.position.set(0, 0.025, 0.125); // extend forwards from hinge
        lidMesh.castShadow = true;
        this.specLidGroup.add(lidMesh);

        const handleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), this.materials.plasticDark);
        handleMesh.position.set(0, 0.08, 0.2);
        this.specLidGroup.add(handleMesh);

        this.specLidGroup.name = "spec_lid";
        this.specGroup.add(this.specLidGroup);

        this.scene.add(this.specGroup);
        
        // Register interactive targets inside spectrophotometer
        this.interactiveObjects.push(powerBtn);
        this.interactiveObjects.push(lidMesh);
    }
}
