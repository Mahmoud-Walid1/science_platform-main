/**
 * prepTableEngine.js
 * Clean Architecture - Synchronized Slide & Vertical Dropper Animation Engine.
 */

import { GSAPAnimator } from './gsapAnimator.js';
import { InteractionEngine } from './interactionEngine.js';

export class PrepTableEngine {
    constructor(containerId, onSlideReadyAndDropped) {
        this.container = document.getElementById(containerId);
        this.onSlideReadyAndDropped = onSlideReadyAndDropped;

        if (!this.container) return;

        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;

        this.selectedSample = null;
        this.prepState = 'idle';

        this.initScene();
        this.initOrbitControls();
        this.gsap = new GSAPAnimator(this.camera, this.controls);
        this.interaction = new InteractionEngine(this.camera, this.container, 'prep3DTooltip');

        this.buildLabBenchAndMicroscope();
        this.initRaycasterAndDrag();
        this.animate();

        window.addEventListener('resize', () => this.onResize());
    }

    initScene() {
        // 1. High-Contrast Light Scene Background
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf8fafc);
        this.scene.fog = new THREE.FogExp2(0xf8fafc, 0.04);

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 3.8, 6.2);
        this.scene.add(this.camera);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        // 4. Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffedd5, 1.6);
        keyLight.position.set(4, 8, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        this.scene.add(keyLight);

        const frontLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
        frontLight.position.set(-4, 4, 5);
        this.scene.add(frontLight);

        this.camera.lookAt(0, 0.5, 0);
    }

    initOrbitControls() {
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2.05;
            this.controls.minDistance = 2.5;
            this.controls.maxDistance = 10.0;
            this.controls.target.set(0, 0.5, 0);
        }
    }

    createCanvasTextureLabel(text, bgColor = '#0284c7', textColor = '#ffffff') {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 256, 64);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 248, 56);

        ctx.fillStyle = textColor;
        ctx.font = 'bold 22px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 32);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    buildLabBenchAndMicroscope() {
        this.benchGroup = new THREE.Group();

        // Slate Wood Table
        const benchGeo = new THREE.BoxGeometry(9.5, 0.35, 5.2);
        const benchMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            roughness: 0.4,
            metalness: 0.2
        });
        const benchMesh = new THREE.Mesh(benchGeo, benchMat);
        benchMesh.position.set(0, -0.175, 0);
        benchMesh.receiveShadow = true;
        this.benchGroup.add(benchMesh);

        // White Rubber Mat
        const matGeo = new THREE.BoxGeometry(7.5, 0.02, 3.8);
        const matMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const matMesh = new THREE.Mesh(matGeo, matMat);
        matMesh.position.set(0, 0.01, 0);
        matMesh.receiveShadow = true;
        this.benchGroup.add(matMesh);

        // LED Prep Pad Frame (Center Left: X = -0.6)
        const prepPadGeo = new THREE.BoxGeometry(1.6, 0.03, 1.0);
        const prepPadMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
        const prepPadMesh = new THREE.Mesh(prepPadGeo, prepPadMat);
        prepPadMesh.position.set(-0.6, 0.025, 0.4);
        this.benchGroup.add(prepPadMesh);

        const ledRingGeo = new THREE.BoxGeometry(1.64, 0.01, 1.04);
        const ledRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const ledRingMesh = new THREE.Mesh(ledRingGeo, ledRingMat);
        ledRingMesh.position.set(-0.6, 0.015, 0.4);
        this.benchGroup.add(ledRingMesh);

        // 2. TWO Fully-Visible Labeled Slide Boxes (Plant Box X = -2.1 & Animal Box X = -0.9)
        this.buildSlideBoxes();

        // 3. Compound Microscope (Right: X = 1.35)
        this.buildHighVisibilityMicroscope(1.35, 0.02, -0.1);

        // 4. Labeled Stain Bottles & Independent Pipettes (Far Left: X = -2.4)
        this.buildStainStation(-2.4, 0.02, 0.6);

        this.scene.add(this.benchGroup);
    }

    buildSlideBoxes() {
        // --- BOX 1: Plant Onion Slide Box (X = -2.1, Z = -0.4) ---
        this.plantBoxGroup = new THREE.Group();
        this.plantBoxGroup.position.set(-2.1, 0.02, -0.4);

        const boxGeo = new THREE.BoxGeometry(1.1, 0.28, 0.65);
        const plantBoxMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.3, metalness: 0.2 });
        const plantBoxMesh = new THREE.Mesh(boxGeo, plantBoxMat);
        plantBoxMesh.position.set(0, 0.14, 0);
        plantBoxMesh.castShadow = true;
        this.plantBoxGroup.add(plantBoxMesh);

        const slideGeo = new THREE.BoxGeometry(0.85, 0.018, 0.32);
        const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xf0f9ff, transparent: true, opacity: 0.75, roughness: 0.1 });
        for (let i = 0; i < 4; i++) {
            const s = new THREE.Mesh(slideGeo, glassMat);
            s.position.set(0, 0.24 + i * 0.02, 0);
            this.plantBoxGroup.add(s);
        }

        const plantTex = this.createCanvasTextureLabel('شرائح نباتية (البصل 🧅)', '#0d9488', '#ffffff');
        const labelGeo = new THREE.PlaneGeometry(0.9, 0.2);
        const plantLabelMat = new THREE.MeshBasicMaterial({ map: plantTex, transparent: true });
        const plantLabelMesh = new THREE.Mesh(labelGeo, plantLabelMat);
        plantLabelMesh.position.set(0, 0.14, 0.33);
        this.plantBoxGroup.add(plantLabelMesh);

        if (this.interaction) {
            this.interaction.registerInteractiveObject(
                plantBoxMesh,
                "علبة الشرائح النباتية (البصل 🧅)",
                "علبة خاصة بالشرائح الزجاجية المجهزة بأنسجة ناعمة من قشرة البصل."
            );
        }
        this.benchGroup.add(this.plantBoxGroup);

        // --- BOX 2: Somatic Animal Slide Box (X = -0.9, Z = -0.4) ---
        this.animalBoxGroup = new THREE.Group();
        this.animalBoxGroup.position.set(-0.9, 0.02, -0.4);

        const animalBoxMat = new THREE.MeshStandardMaterial({ color: 0xbe185d, roughness: 0.3, metalness: 0.2 });
        const animalBoxMesh = new THREE.Mesh(boxGeo, animalBoxMat);
        animalBoxMesh.position.set(0, 0.14, 0);
        animalBoxMesh.castShadow = true;
        this.animalBoxGroup.add(animalBoxMesh);

        for (let i = 0; i < 4; i++) {
            const s = new THREE.Mesh(slideGeo, glassMat);
            s.position.set(0, 0.24 + i * 0.02, 0);
            this.animalBoxGroup.add(s);
        }

        const animalTex = this.createCanvasTextureLabel('شرائح حيوانية جسدية 🧬', '#be185d', '#ffffff');
        const animalLabelMat = new THREE.MeshBasicMaterial({ map: animalTex, transparent: true });
        const animalLabelMesh = new THREE.Mesh(labelGeo, animalLabelMat);
        animalLabelMesh.position.set(0, 0.14, 0.33);
        this.animalBoxGroup.add(animalLabelMesh);

        if (this.interaction) {
            this.interaction.registerInteractiveObject(
                animalBoxMesh,
                "علبة الشرائح الحيوانية الجسدية 🧬",
                "علبة خاصة بالشرائح الزجاجية المجهزة بمسحة خلايا كائن حي مصبوغة."
            );
        }
        this.benchGroup.add(this.animalBoxGroup);
    }

    buildHighVisibilityMicroscope(x, y, z) {
        this.scopeGroup = new THREE.Group();
        this.scopeGroup.position.set(x, y, z);

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.9,
            roughness: 0.15
        });

        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            metalness: 0.98,
            roughness: 0.05
        });

        const brassMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.9,
            roughness: 0.25
        });

        const baseGeo = new THREE.CylinderGeometry(0.65, 0.78, 0.14, 32);
        const baseMesh = new THREE.Mesh(baseGeo, bodyMat);
        baseMesh.position.set(0, 0.07, 0);
        baseMesh.castShadow = true;
        this.scopeGroup.add(baseMesh);

        const armCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0.14, -0.25),
            new THREE.Vector3(0, 0.85, -0.35),
            new THREE.Vector3(0, 1.55, -0.15),
            new THREE.Vector3(0, 1.75, 0.1)
        ]);
        const armGeo = new THREE.TubeGeometry(armCurve, 32, 0.09, 16, false);
        const armMesh = new THREE.Mesh(armGeo, bodyMat);
        armMesh.castShadow = true;
        this.scopeGroup.add(armMesh);

        const stageGeo = new THREE.BoxGeometry(0.95, 0.05, 0.85);
        const stageMesh = new THREE.Mesh(stageGeo, bodyMat);
        stageMesh.position.set(0, 0.88, 0.1);
        stageMesh.castShadow = true;
        stageMesh.receiveShadow = true;
        this.scopeGroup.add(stageMesh);

        const subLight = new THREE.PointLight(0x38bdf8, 3.0, 3.0);
        subLight.position.set(0, 0.7, 0.1);
        this.scopeGroup.add(subLight);

        const clipGeo = new THREE.BoxGeometry(0.12, 0.025, 0.38);
        const clipL = new THREE.Mesh(clipGeo, chromeMat);
        clipL.position.set(-0.35, 0.96, 0.1);
        const clipR = new THREE.Mesh(clipGeo, chromeMat);
        clipR.position.set(0.35, 0.96, 0.1);
        this.scopeGroup.add(clipL);
        this.scopeGroup.add(clipR);

        const noseGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.1, 24);
        const noseMesh = new THREE.Mesh(noseGeo, chromeMat);
        noseMesh.position.set(0, 1.3, 0.1);
        this.scopeGroup.add(noseMesh);

        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3;
            const objGeo = new THREE.CylinderGeometry(0.045, 0.038, 0.25, 16);
            const objMesh = new THREE.Mesh(objGeo, brassMat);
            objMesh.position.set(Math.cos(angle) * 0.1, 1.16, 0.1 + Math.sin(angle) * 0.1);
            this.scopeGroup.add(objMesh);
        }

        const tubeGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.55, 24);
        const tubeMesh = new THREE.Mesh(tubeGeo, chromeMat);
        tubeMesh.position.set(0, 1.88, 0.2);
        tubeMesh.rotation.x = -0.22;
        this.scopeGroup.add(tubeMesh);

        if (this.interaction) {
            this.interaction.registerInteractiveObject(
                baseMesh,
                "المجهر المركب (Compound Microscope)",
                "مجهر ضوئي عالي التكبير يتيح فحص الخلايا الحية وأطوار الانقسام الميتوزي."
            );
        }

        this.benchGroup.add(this.scopeGroup);
    }

    buildStainStation(x, y, z) {
        this.stationGroup = new THREE.Group();
        this.stationGroup.position.set(x, y, z);

        const bottleGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.5, 24);
        const bLabelGeo = new THREE.PlaneGeometry(0.36, 0.18);

        // 1. Purple Iodine Bottle with 3D Label ("صبغة اليود")
        const iodineMat = new THREE.MeshPhysicalMaterial({ color: 0x9333ea, transparent: true, opacity: 0.85, roughness: 0.1 });
        this.iodineBottle = new THREE.Mesh(bottleGeo, iodineMat);
        this.iodineBottle.position.set(-0.35, 0.25, 0);

        const iodTex = this.createCanvasTextureLabel('صبغة اليود 🧪', '#9333ea', '#ffffff');
        const iodLabelMesh = new THREE.Mesh(bLabelGeo, new THREE.MeshBasicMaterial({ map: iodTex, transparent: true }));
        iodLabelMesh.position.set(0, 0, 0.23);
        this.iodineBottle.add(iodLabelMesh);

        this.stationGroup.add(this.iodineBottle);

        // 2. Blue Methylene Bottle with 3D Label ("ميثيلين أزرق")
        const blueMat = new THREE.MeshPhysicalMaterial({ color: 0x0284c7, transparent: true, opacity: 0.85, roughness: 0.1 });
        this.blueBottle = new THREE.Mesh(bottleGeo, blueMat);
        this.blueBottle.position.set(0.35, 0.25, 0);

        const blueTex = this.createCanvasTextureLabel('ميثيلين أزرق 🧪', '#0284c7', '#ffffff');
        const blueLabelMesh = new THREE.Mesh(bLabelGeo, new THREE.MeshBasicMaterial({ map: blueTex, transparent: true }));
        blueLabelMesh.position.set(0, 0, 0.23);
        this.blueBottle.add(blueLabelMesh);

        this.stationGroup.add(this.blueBottle);

        // --- Independent Pipettes Anchored directly in Bench Group ---
        const pipTubeGeo = new THREE.CylinderGeometry(0.02, 0.008, 0.45, 16);
        const pipTubeMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 0.1 });
        const bulbGeo = new THREE.SphereGeometry(0.065, 16, 16);

        // Plant Pipette Group (Home Pos: X = -2.75, Y = 0.67, Z = 0.6)
        this.plantPipetteGroup = new THREE.Group();
        this.plantPipetteGroup.position.set(-2.75, 0.67, 0.6);

        const plantPipTube = new THREE.Mesh(pipTubeGeo, pipTubeMat);
        this.plantPipetteGroup.add(plantPipTube);
        const plantBulb = new THREE.Mesh(bulbGeo, new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.8 }));
        plantBulb.position.set(0, 0.22, 0);
        this.plantPipetteGroup.add(plantBulb);

        this.benchGroup.add(this.plantPipetteGroup);

        // Animal Pipette Group (Home Pos: X = -2.05, Y = 0.67, Z = 0.6)
        this.animalPipetteGroup = new THREE.Group();
        this.animalPipetteGroup.position.set(-2.05, 0.67, 0.6);

        const animalPipTube = new THREE.Mesh(pipTubeGeo, pipTubeMat);
        this.animalPipetteGroup.add(animalPipTube);
        const animalBulb = new THREE.Mesh(bulbGeo, new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 }));
        animalBulb.position.set(0, 0.22, 0);
        this.animalPipetteGroup.add(animalBulb);

        this.benchGroup.add(this.animalPipetteGroup);

        if (this.interaction) {
            this.interaction.registerInteractiveObject(
                this.iodineBottle,
                "زجاجة صبغة اليود (Iodine Stain)",
                "صبغة خاصة بخلايا البصل لإبراز جدار الخلية والنواة والكروموسومات."
            );
            this.interaction.registerInteractiveObject(
                this.blueBottle,
                "زجاجة الميثيلين الأزرق (Methylene Blue)",
                "صبغة خاصة بالخلايا الحيوانية الجسدية لإظهار تفاصيل نواة الخلية."
            );
        }

        this.benchGroup.add(this.stationGroup);
    }

    resetPrepStage() {
        this.prepState = 'idle';
        this.clearChecklist();
        this.hideDragInstructionBanner();
        this.hideStepNotification();

        if (this.slideGroup) {
            this.scene.remove(this.slideGroup);
            this.slideGroup = null;
        }

        this.plantPipetteGroup.position.set(-2.75, 0.67, 0.6);
        this.plantPipetteGroup.rotation.set(0, 0, 0);
        this.animalPipetteGroup.position.set(-2.05, 0.67, 0.6);
        this.animalPipetteGroup.rotation.set(0, 0, 0);

        this.camera.position.set(0, 3.8, 6.2);
        if (this.controls) {
            this.controls.enabled = true;
            this.controls.target.set(0, 0.5, 0);
            this.controls.update();
        }
    }

    clearChecklist() {
        for (let i = 1; i <= 5; i++) {
            const item = document.getElementById(`chkStep${i}`);
            if (item) {
                item.classList.remove('done');
                const icon = item.querySelector('i');
                if (icon) {
                    icon.className = 'far fa-circle';
                }
            }
        }
    }

    markChecklistStep(stepNum) {
        const item = document.getElementById(`chkStep${stepNum}`);
        if (item) {
            item.classList.add('done');
            const icon = item.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-check-circle';
            }
        }
    }

    startSlidePreparationAnimation(sampleType) {
        this.selectedSample = sampleType;
        this.prepState = 'preparing';
        this.clearChecklist();

        if (this.slideGroup) {
            this.scene.remove(this.slideGroup);
        }

        // Box 1 (Plant) X = -2.1 vs Box 2 (Animal) X = -0.9
        const startX = sampleType === 'plant' ? -2.1 : -0.9;

        this.slideGroup = new THREE.Group();
        this.slideGroup.position.set(startX, 0.26, -0.4);

        const slideGeo = new THREE.BoxGeometry(0.85, 0.022, 0.32);
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.85,
            roughness: 0.05,
            metalness: 0.1
        });
        const glassSlide = new THREE.Mesh(slideGeo, glassMat);
        glassSlide.castShadow = true;
        this.slideGroup.add(glassSlide);

        const sampleColor = sampleType === 'plant' ? 0xc084fc : 0xf43f5e;
        const specimenGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.015, 20);
        const specimenMat = new THREE.MeshStandardMaterial({
            color: sampleColor,
            roughness: 0.4,
            transparent: true,
            opacity: 0.0
        });
        this.specimenMesh = new THREE.Mesh(specimenGeo, specimenMat);
        this.specimenMesh.position.set(0, 0.018, 0);
        this.slideGroup.add(this.specimenMesh);

        // Fluid Stain Droplet starting at tip level
        const dropGeo = new THREE.SphereGeometry(0.075, 20, 20);
        const dropMat = new THREE.MeshPhysicalMaterial({
            color: sampleType === 'plant' ? 0x9333ea : 0x0284c7,
            transparent: true,
            opacity: 0.0,
            roughness: 0.05
        });
        this.stainDropMesh = new THREE.Mesh(dropGeo, dropMat);
        this.stainDropMesh.position.set(0, 0.45, 0);
        this.slideGroup.add(this.stainDropMesh);

        const coverGeo = new THREE.BoxGeometry(0.28, 0.01, 0.28);
        const coverMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.0,
            roughness: 0.05
        });
        this.coverSlipMesh = new THREE.Mesh(coverGeo, coverMat);
        this.coverSlipMesh.position.set(0, 0.3, 0);
        this.slideGroup.add(this.coverSlipMesh);

        const auraGeo = new THREE.BoxGeometry(0.92, 0.035, 0.38);
        const auraMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.0
        });
        this.auraMesh = new THREE.Mesh(auraGeo, auraMat);
        this.slideGroup.add(this.auraMesh);

        this.scene.add(this.slideGroup);

        if (this.interaction) {
            this.interaction.registerInteractiveObject(
                glassSlide,
                "الشريحة الجاهزة للفحص",
                "انقر واسحب الشريحة وضعها تحت عدسة المجهر لفحص الخلايا."
            );
        }

        this.runGSAPPreparationSequence(sampleType, startX);
    }

    runGSAPPreparationSequence(sampleType, startX) {
        const sampleTitle = sampleType === 'plant' ? 'خلايا نباتية (البصل 🧅)' : 'خلايا حيوانية جسدية 🧬';
        const stainTitle = sampleType === 'plant' ? 'صبغة اليود 🧪 (Iodine)' : 'صبغة الميثيلين الأزرق 🧪 (Methylene Blue)';

        // Select ONLY the matching pipette group
        const targetPipetteGroup = sampleType === 'plant' ? this.plantPipetteGroup : this.animalPipetteGroup;
        const pipetteHomePos = sampleType === 'plant' ? new THREE.Vector3(-2.75, 0.67, 0.6) : new THREE.Vector3(-2.05, 0.67, 0.6);
        const pipetteTargetOverSlide = new THREE.Vector3(-0.6, 0.65, 0.4);

        // Step 1: Slide movement from Box to Prep Pad
        this.showStepNotification(`أخذ شريحة زجاجية جديدة من [علبة ${sampleTitle}]`);
        const startSlidePos = new THREE.Vector3(startX, 0.26, -0.4);
        const prepPadPos = new THREE.Vector3(-0.6, 0.04, 0.4);

        this.gsap.animateSlideMovement(this.slideGroup, startSlidePos, prepPadPos, 1.6, () => {
            this.markChecklistStep(1);

            // Step 2: Specimen placement
            this.markChecklistStep(2);

            // Step 3: Vertical Pipette Motion & Stain Drop Fall
            this.showStepNotification(`إضافة قطرة من [${stainTitle}] على العينة`);

            this.gsap.animateVerticalDropperSequence(
                targetPipetteGroup,
                pipetteHomePos,
                pipetteTargetOverSlide,
                this.stainDropMesh,
                this.specimenMesh,
                () => {
                    this.markChecklistStep(3);

                    // Step 4: Cover Slip Drop
                    this.gsap.animateCoverSlipDrop(this.coverSlipMesh, 1.0, () => {
                        this.markChecklistStep(4);
                        this.hideStepNotification();
                        this.showDragInstructionBanner();
                    });
                }
            );
        });
    }

    showStepNotification(text) {
        let badge = document.getElementById('stepNotificationBadge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'stepNotificationBadge';
            badge.className = 'step-notification-badge';
            document.body.appendChild(badge);
        }
        badge.innerHTML = `<i class="fas fa-info-circle"></i> <span>${text}</span>`;
        badge.classList.add('visible');
    }

    hideStepNotification() {
        const badge = document.getElementById('stepNotificationBadge');
        if (badge) badge.classList.remove('visible');
    }

    showDragInstructionBanner() {
        let banner = document.getElementById('dragInstructionBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'dragInstructionBanner';
            banner.className = 'drag-instruction-banner';
            document.body.appendChild(banner);
        }
        banner.innerHTML = `
            <i class="fas fa-hand-pointer pulse-icon"></i>
            <span>الشريحة جاهزة! اسحب الشريحة المتوهجة بالماوس وضبطها تحت عدسة المجهر 🔬</span>
        `;
        banner.classList.add('visible');
    }

    hideDragInstructionBanner() {
        const banner = document.getElementById('dragInstructionBanner');
        if (banner) banner.classList.remove('visible');
    }

    initRaycasterAndDrag() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isDraggingSlide = false;
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.04);

        const canvas = this.renderer.domElement;

        const getMousePos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        };

        const onDown = (e) => {
            if (!this.slideGroup || this.prepState !== 'preparing') return;

            getMousePos(e);
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.slideGroup, true);

            if (intersects.length > 0) {
                this.isDraggingSlide = true;
                if (this.controls) this.controls.enabled = false;
                canvas.style.cursor = 'grabbing';
            }
        };

        const onMove = (e) => {
            getMousePos(e);
            this.raycaster.setFromCamera(this.mouse, this.camera);

            if (this.slideGroup && this.prepState === 'preparing' && !this.isDraggingSlide) {
                const intersects = this.raycaster.intersectObject(this.slideGroup, true);
                if (intersects.length > 0) {
                    if (this.controls) this.controls.enabled = false;
                    canvas.style.cursor = 'grab';
                } else {
                    if (this.controls) this.controls.enabled = true;
                    canvas.style.cursor = 'default';
                }
            }

            if (!this.isDraggingSlide || !this.slideGroup) return;

            const intersectPoint = new THREE.Vector3();
            if (this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint)) {
                this.slideGroup.position.x = intersectPoint.x;
                this.slideGroup.position.z = intersectPoint.z;
                // Elevate Y to stage plate height (0.95) so slide glides ON TOP of microscope stage!
                this.slideGroup.position.y = 0.95;

                const targetPos = new THREE.Vector2(1.35, -0.1);
                const currentPos = new THREE.Vector2(intersectPoint.x, intersectPoint.z);
                const dist = currentPos.distanceTo(targetPos);

                if (dist < 0.75) {
                    this.isDraggingSlide = false;
                    if (this.controls) this.controls.enabled = true;
                    this.prepState = 'placed_on_microscope';
                    canvas.style.cursor = 'default';
                    this.hideDragInstructionBanner();

                    this.markChecklistStep(5);
                    this.slideGroup.position.set(1.35, 0.95, -0.1);

                    const eyeCamPos = new THREE.Vector3(1.35, 2.18, 0.26);
                    const lookPos = new THREE.Vector3(1.35, 1.88, 0.2);

                    this.gsap.animateCameraTo(eyeCamPos, lookPos, 1.4, () => {
                        if (this.onSlideReadyAndDropped) {
                            this.onSlideReadyAndDropped(this.selectedSample);
                        }
                    });
                }
            }
        };

        const onUp = () => {
            this.isDraggingSlide = false;
            if (this.controls) this.controls.enabled = true;
            canvas.style.cursor = 'default';
        };

        canvas.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);

        canvas.addEventListener('touchstart', onDown);
        window.addEventListener('touchmove', onMove);
        window.addEventListener('touchend', onUp);
    }

    onResize() {
        if (!this.container) return;
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls) this.controls.update();

        if (this.auraMesh && this.prepState === 'preparing') {
            const pulse = 0.35 + Math.sin(Date.now() * 0.007) * 0.3;
            this.auraMesh.material.opacity = pulse;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
