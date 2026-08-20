/**
 * Separation Mechanics Engine & Trial Simulation
 * Single Responsibility: Manages the 5 separation procedures, pouring animations, physics state machine & fail results.
 */

import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { labStore, MIXTURES } from './store.js';

export class SeparationMechanics {
    constructor(scene, beaker3D) {
        this.scene = scene;
        this.beaker3D = beaker3D;
        this.activeToolMesh = null;
        this.animationTimer = 0;
        this.isAnimating = false;
        this.initToolMeshes();
    }

    initToolMeshes() {
        this.toolsGroup = new THREE.Group();
        this.scene.add(this.toolsGroup);

        // 1. Separating Funnel (قمع الفصل)
        this.funnelMesh = this.createSeparatingFunnelMesh();
        this.funnelMesh.position.set(0, 3.2, 0);
        this.funnelMesh.visible = false;
        this.toolsGroup.add(this.funnelMesh);

        // 2. Filter Funnel & Stand (قمع وورق ترشيح)
        this.filterMesh = this.createFilterFunnelMesh();
        this.filterMesh.position.set(0, 2.5, 0);
        this.filterMesh.visible = false;
        this.toolsGroup.add(this.filterMesh);

        // 3. Bunsen Burner & Dish (موقد اللهب وطبق التبخير)
        this.burnerMesh = this.createBunsenBurnerMesh();
        this.burnerMesh.position.set(0, 0, 0);
        this.burnerMesh.visible = false;
        this.toolsGroup.add(this.burnerMesh);

        // 4. Magnet (المغناطيس)
        this.magnetMesh = this.createMagnetMesh();
        this.magnetMesh.position.set(0, 2.8, 0);
        this.magnetMesh.visible = false;
        this.toolsGroup.add(this.magnetMesh);

        // 5. Sieve (الغربال)
        this.sieveMesh = this.createSieveMesh();
        this.sieveMesh.position.set(0, 2.5, 0);
        this.sieveMesh.visible = false;
        this.toolsGroup.add(this.sieveMesh);
    }

    createSeparatingFunnelMesh() {
        const group = new THREE.Group();
        const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, transparent: true, opacity: 0.4 });
        
        // Pear Bulb
        const bulbGeo = new THREE.SphereGeometry(1.0, 32, 16);
        bulbGeo.scale(1, 1.4, 1);
        const bulb = new THREE.Mesh(bulbGeo, glassMat);
        group.add(bulb);

        // Valve Stopcock
        const valveGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 16);
        const valveMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        const valve = new THREE.Mesh(valveGeo, valveMat);
        valve.rotation.z = Math.PI / 2;
        valve.position.y = -1.3;
        group.add(valve);

        // Lower Spout
        const spoutGeo = new THREE.CylinderGeometry(0.08, 0.05, 1.0, 16);
        const spout = new THREE.Mesh(spoutGeo, glassMat);
        spout.position.y = -1.8;
        group.add(spout);

        return group;
    }

    createFilterFunnelMesh() {
        const group = new THREE.Group();
        const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, transparent: true, opacity: 0.4 });
        
        // Funnel Cone
        const coneGeo = new THREE.ConeGeometry(1.2, 1.2, 32, 1, true);
        const cone = new THREE.Mesh(coneGeo, glassMat);
        cone.rotation.x = Math.PI;
        group.add(cone);

        // White Filter Paper Inside
        const paperGeo = new THREE.ConeGeometry(1.15, 1.1, 32);
        const paperMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
        this.filterPaperMesh = new THREE.Mesh(paperGeo, paperMat);
        this.filterPaperMesh.rotation.x = Math.PI;
        group.add(this.filterPaperMesh);

        // Stem Tube
        const stemGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 16);
        const stem = new THREE.Mesh(stemGeo, glassMat);
        stem.position.y = -1.1;
        group.add(stem);

        return group;
    }

    createBunsenBurnerMesh() {
        const group = new THREE.Group();
        // Stand Base
        const baseGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.15, 24);
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
        const base = new THREE.Mesh(baseGeo, metalMat);
        base.position.y = -1.2;
        group.add(base);

        // Burner Tube
        const tubeGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 16);
        const tube = new THREE.Mesh(tubeGeo, metalMat);
        tube.position.y = -0.5;
        group.add(tube);

        // 3D Fire Flame Mesh
        const flameGeo = new THREE.ConeGeometry(0.25, 0.8, 16);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
        this.flameMesh = new THREE.Mesh(flameGeo, flameMat);
        this.flameMesh.position.y = 0.3;
        this.flameMesh.visible = false;
        group.add(this.flameMesh);

        return group;
    }

    createMagnetMesh() {
        const group = new THREE.Group();
        // Horseshoe Shape via Torus arc
        const uGeo = new THREE.TorusGeometry(0.7, 0.2, 16, 32, Math.PI);
        const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
        const magnet = new THREE.Mesh(uGeo, redMat);
        magnet.rotation.x = Math.PI / 2;
        group.add(magnet);

        // Silver Magnet Tips
        const tipGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16);
        const tipMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });
        
        const tip1 = new THREE.Mesh(tipGeo, tipMat);
        tip1.position.set(-0.7, 0, -0.15);
        group.add(tip1);

        const tip2 = new THREE.Mesh(tipGeo, tipMat);
        tip2.position.set(0.7, 0, -0.15);
        group.add(tip2);

        return group;
    }

    createSieveMesh() {
        const group = new THREE.Group();
        const ringGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.4, 32, 1, true);
        const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
        const ring = new THREE.Mesh(ringGeo, woodMat);
        group.add(ring);

        // Mesh Grid Bottom
        const meshGeo = new THREE.CircleGeometry(1.28, 32);
        const gridMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, wireframe: true });
        const grid = new THREE.Mesh(meshGeo, gridMat);
        grid.rotation.x = -Math.PI / 2;
        grid.position.y = -0.18;
        group.add(grid);

        return group;
    }

    applyTool(toolId) {
        const state = labStore.getState();
        const mix = MIXTURES[state.activeMixtureId];
        
        this.hideAllTools();

        if (toolId === mix.correctTool) {
            this.executeSuccessSeparation(toolId, mix);
        } else {
            this.executeFailedSeparation(toolId, mix);
        }
    }

    executeSuccessSeparation(toolId, mix) {
        labStore.setState({ simulationPhase: 'separating' });

        if (toolId === 'filter') {
            this.filterMesh.visible = true;
            labStore.showToast(`نجاح! تمت عملية الترشيح. الماء ينفذ عبر مسام الورقة ويبعد الرمل بالأعلى لأن حبيباته أكبر.`, 'success');
            setTimeout(() => {
                this.beaker3D.waterMaterial.color.setHex(0x0ea5e9);
                this.beaker3D.particlesGroup.position.y = 2.4; // Sand moves up to filter paper
                labStore.setState({ simulationPhase: 'separated' });
            }, 2000);
        } else if (toolId === 'burner') {
            this.burnerMesh.visible = true;
            this.flameMesh.visible = true;
            labStore.showToast(`نجاح! التبخير يعمل: درجة غليان الماء (100°م) يتبخر، وتبقى بلورات الملح الصلبة ذات درجة الغليان العالية.`, 'success');
            setTimeout(() => {
                this.beaker3D.waterMesh.visible = false;
                this.beaker3D.clearParticles();
                this.beaker3D.createSedimentParticles(0xffffff, 80, 0.04); // Salt crystals remain
                labStore.setState({ simulationPhase: 'separated' });
            }, 2500);
        } else if (toolId === 'funnel') {
            this.funnelMesh.visible = true;
            labStore.showToast(`نجاح! اختلاف الكثافة: كثافة الزيت أقل يطفو بالأعلى، يفتح صنبور القمع وينزل الماء أولاً ليفصل الزيت!`, 'success');
            setTimeout(() => {
                this.beaker3D.oilMesh.visible = false;
                labStore.setState({ simulationPhase: 'separated' });
            }, 2200);
        } else if (toolId === 'magnet') {
            this.magnetMesh.visible = true;
            labStore.showToast(`نجاح! الخاصية المغناطيسية: تنجذب برادة الحديد للمغناطيس وتنفصل عن الرمل غير المغناطيسي!`, 'success');
            setTimeout(() => {
                this.beaker3D.clearParticles();
                this.beaker3D.createSedimentParticles(0xd97706, 100, 0.05); // Only Sand remains
                labStore.setState({ simulationPhase: 'separated' });
            }, 1800);
        } else if (toolId === 'sieve') {
            this.sieveMesh.visible = true;
            labStore.showToast(`نجاح! اختلاف حجم الحبيبات: تعبر حبيبات الرمل الصغيرة عبر ثقوب الغربال، ويبقى الحصى الكبير!`, 'success');
            setTimeout(() => {
                this.beaker3D.clearParticles();
                this.beaker3D.createSedimentParticles(0xd97706, 120, 0.04); // Only Sand passed below
                labStore.setState({ simulationPhase: 'separated' });
            }, 2000);
        }
    }

    executeFailedSeparation(toolId, mix) {
        labStore.setState({ simulationPhase: 'failed' });

        if (toolId === 'filter' && mix.id === 'salt_water') {
            this.filterMesh.visible = true;
            labStore.showToast(`محاولة غير ناجحة! الملح ذائب في الماء وجزيئاته صغيرة جداً تعبر مسام ورقة الترشيح مع الماء دون انفصال!`, 'fail');
        } else if (toolId === 'magnet' && (mix.id === 'sand_water' || mix.id === 'salt_water')) {
            this.magnetMesh.visible = true;
            labStore.showToast(`محاولة غير ناجحة! لا توجد مادة مغناطيسية في هذا المخلوط، فلن ينجذب شيء للمغناطيس.`, 'fail');
        } else if (toolId === 'sieve' && mix.id === 'oil_water') {
            this.sieveMesh.visible = true;
            labStore.showToast(`محاولة غير ناجحة! الغربال يستغل حجم الحبيبات الصلبة، بينما الزيت والماء سوائل تمزج معاً!`, 'fail');
        } else {
            labStore.showToast(`طريقة غير مناسبة لهذا المخلوط! جرب أداة تستغل الخاصية الفيزيائية الصحيحة (${mix.propertyName}).`, 'fail');
        }
    }

    hideAllTools() {
        this.funnelMesh.visible = false;
        this.filterMesh.visible = false;
        this.burnerMesh.visible = false;
        this.flameMesh.visible = false;
        this.magnetMesh.visible = false;
        this.sieveMesh.visible = false;
    }
}
