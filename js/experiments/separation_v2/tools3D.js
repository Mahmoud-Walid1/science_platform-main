import * as THREE from 'three';

export class Tools3D {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.scene;
        this.toolsList = [];

        this.initTools();
    }

    initTools() {
        const toolsData = [
            { id: 'funnel', name: 'قمع الفصل (فصل السوائل غير الممتزجة)', color: 0x38bdf8, posX: -3.0, posY: 0.0, posZ: -0.2 },
            { id: 'filter', name: 'قمع وقاعدة الترشيح (فصل المواد الصلبة)', color: 0x94a3b8, posX: -2.0, posY: 0.0, posZ: -0.2 },
            
            // On Tools Shelf
            { id: 'magnet', name: 'مغناطيس معملي (فصل المغناطيسية)', color: 0xdc2626, posX: 1.1, posY: 1.29, posZ: -0.9 },
            { id: 'sieve', name: 'غربال معملي (فصل الحبيبات الحصوية)', color: 0x475569, posX: 2.0, posY: 1.29, posZ: -0.9 },
            { id: 'evaporation', name: 'موقد بنسن وثلاثي التبخير (فصل التبخير والبلورة)', color: 0xe2e8f0, posX: 2.9, posY: 1.29, posZ: -0.9 },
            
            // Trash Bin on right corner
            { id: 'trash', name: 'سلة مهملات معملية (التخلص وتنظيف المعمل)', color: 0x1e293b, posX: 3.3, posY: 0.0, posZ: 0.8 }
        ];

        toolsData.forEach((tData) => {
            const toolGroup = new THREE.Group();
            toolGroup.name = `tool_${tData.id}`;
            toolGroup.userData = {
                type: 'tool_object',
                toolData: tData,
                isDragging: false,
                homePosition: new THREE.Vector3(tData.posX, tData.posY, tData.posZ)
            };

            switch (tData.id) {
                case 'magnet':
                    this.buildMagnetMesh(toolGroup);
                    break;
                case 'evaporation':
                    this.buildEvaporationMesh(toolGroup);
                    break;
                case 'funnel':
                    this.buildSeparatoryFunnelMesh(toolGroup);
                    break;
                case 'filter':
                    this.buildFilterMesh(toolGroup);
                    break;
                case 'sieve':
                    this.buildSieveMesh(toolGroup);
                    break;
                case 'trash':
                    this.buildTrashBinMesh(toolGroup);
                    break;
            }

            toolGroup.position.copy(toolGroup.userData.homePosition);
            this.scene.add(toolGroup);

            this.toolsList.push(toolGroup);
        });
    }

    buildMagnetMesh(group) {
        const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.15 });
        const blueMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.35, metalness: 0.15 });

        const extrudeSettings = {
            depth: 0.11,
            bevelEnabled: true,
            bevelSegments: 3,
            steps: 1,
            bevelSize: 0.007,
            bevelThickness: 0.007
        };

        const shapeN = new THREE.Shape();
        shapeN.moveTo(-0.22, 0.0);
        shapeN.lineTo(-0.22, 0.24);
        shapeN.absarc(0.0, 0.24, 0.22, Math.PI, Math.PI / 2, true);
        shapeN.lineTo(0.0, 0.35);
        shapeN.absarc(0.0, 0.24, 0.11, Math.PI / 2, Math.PI, false);
        shapeN.lineTo(-0.11, 0.0);
        shapeN.closePath();

        const geoN = new THREE.ExtrudeGeometry(shapeN, extrudeSettings);
        const northMesh = new THREE.Mesh(geoN, redMat);
        northMesh.castShadow = true;
        northMesh.position.set(0, 0, -0.055);
        group.add(northMesh);

        const shapeS = new THREE.Shape();
        shapeS.moveTo(0.22, 0.0);
        shapeS.lineTo(0.22, 0.24);
        shapeS.absarc(0.0, 0.24, 0.22, 0, Math.PI / 2, false);
        shapeS.lineTo(0.0, 0.35);
        shapeS.absarc(0.0, 0.24, 0.11, Math.PI / 2, 0, true);
        shapeS.lineTo(0.11, 0.0);
        shapeS.closePath();

        const geoS = new THREE.ExtrudeGeometry(shapeS, extrudeSettings);
        const southMesh = new THREE.Mesh(geoS, blueMat);
        southMesh.castShadow = true;
        southMesh.position.set(0, 0, -0.055);
        group.add(southMesh);

        const createStampedLabelTexture = (text, textColor, bgHex) => {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = bgHex;
            ctx.fillRect(0, 0, 128, 128);
            ctx.fillStyle = textColor;
            ctx.font = '900 84px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 64, 64);
            return new THREE.CanvasTexture(canvas);
        };

        const labelMatN = new THREE.MeshStandardMaterial({ map: createStampedLabelTexture('N', '#ffffff', '#dc2626'), roughness: 0.35 });
        const labelMatS = new THREE.MeshStandardMaterial({ map: createStampedLabelTexture('S', '#ffffff', '#1e3a8a'), roughness: 0.35 });

        const labelGeo = new THREE.PlaneGeometry(0.09, 0.09);

        const labelMeshN = new THREE.Mesh(labelGeo, labelMatN);
        labelMeshN.position.set(-0.165, 0.09, 0.06);
        group.add(labelMeshN);

        const labelMeshS = new THREE.Mesh(labelGeo, labelMatS);
        labelMeshS.position.set(0.165, 0.09, 0.06);
        group.add(labelMeshS);

        const tipN = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.11), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
        tipN.name = 'tipN';
        tipN.position.set(-0.165, 0.02, 0);
        group.add(tipN);

        const tipS = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.11), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
        tipS.name = 'tipS';
        tipS.position.set(0.165, 0.02, 0);
        group.add(tipS);
    }

    buildFilterMesh(group) {
        const standMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });
        const glassFunnelMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.45,
            roughness: 0.05,
            transmission: 0.92,
            thickness: 0.15,
            ior: 1.5,
            depthWrite: false
        });
        const filterPaperMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.95,
            side: THREE.DoubleSide
        });

        const base = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.26), standMat);
        base.position.set(-0.26, 0.02, 0);
        group.add(base);

        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.25, 16), standMat);
        rod.position.set(-0.26, 0.62, 0);
        group.add(rod);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.014, 16, 32), standMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, 0.88, 0);
        group.add(ring);

        const funnelConeGeo = new THREE.ConeGeometry(0.32, 0.36, 32, 1, true);
        const funnelConeMesh = new THREE.Mesh(funnelConeGeo, glassFunnelMat);
        funnelConeMesh.position.set(0, 0.96, 0);
        funnelConeMesh.rotation.x = Math.PI;
        funnelConeMesh.castShadow = true;
        group.add(funnelConeMesh);

        const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.48, 24);
        const stemMesh = new THREE.Mesh(stemGeo, glassFunnelMat);
        stemMesh.position.set(0, 0.54, 0);
        group.add(stemMesh);

        const paperConeGeo = new THREE.ConeGeometry(0.29, 0.32, 32, 1, true);
        const paperConeMesh = new THREE.Mesh(paperConeGeo, filterPaperMat);
        paperConeMesh.position.set(0, 0.97, 0);
        paperConeMesh.rotation.x = Math.PI;
        paperConeMesh.name = 'filterPaper';
        paperConeMesh.visible = false;
        group.add(paperConeMesh);

        const residueGeo = new THREE.ConeGeometry(0.25, 0.22, 32);
        const sandResidueMat = new THREE.MeshStandardMaterial({ color: 0xc28e5c, roughness: 0.95 });
        const sandResidueMesh = new THREE.Mesh(residueGeo, sandResidueMat);
        sandResidueMesh.position.set(0, 0.94, 0);
        sandResidueMesh.rotation.x = Math.PI;
        sandResidueMesh.name = 'sandResidue';
        sandResidueMesh.visible = false;
        group.add(sandResidueMesh);

        const streamGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.52, 16);
        const streamMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            opacity: 0.9,
            transparent: true,
            roughness: 0.1
        });
        const filterStreamMesh = new THREE.Mesh(streamGeo, streamMat);
        filterStreamMesh.position.set(0, 0.28, 0);
        filterStreamMesh.name = 'filterStream';
        filterStreamMesh.visible = false;
        group.add(filterStreamMesh);
    }

    buildEvaporationMesh(group) {
        const blueBaseMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.6 });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.1, metalness: 0.95 });
        const standMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.2, metalness: 0.85 });
        const hoseMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
        const wireGauzeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, wireframe: true });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.035, 32), blueBaseMat);
        base.position.y = 0.018;
        base.castShadow = true;
        group.add(base);

        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.26, 24), chromeMat);
        tube.position.y = 0.16;
        tube.castShadow = true;
        group.add(tube);

        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.04, 24), chromeMat);
        collar.position.y = 0.08;
        group.add(collar);

        const hoseConn = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.12, 16), chromeMat);
        hoseConn.rotation.z = Math.PI / 2;
        hoseConn.position.set(-0.08, 0.06, 0);
        group.add(hoseConn);

        const hoseCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.14, 0.06, 0),
            new THREE.Vector3(-0.35, 0.03, 0.05),
            new THREE.Vector3(-0.65, 0.0, 0.15)
        ]);
        const hoseGeo = new THREE.TubeGeometry(hoseCurve, 20, 0.014, 12, false);
        const hoseMesh = new THREE.Mesh(hoseGeo, hoseMat);
        group.add(hoseMesh);

        const flameGroup = new THREE.Group();
        flameGroup.name = 'burnerFlame';
        flameGroup.visible = false;

        const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95 });
        const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.14, 16), innerFlameMat);
        innerFlame.position.y = 0.35;
        flameGroup.add(innerFlame);

        const outerFlameMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.75 });
        const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.24, 16), outerFlameMat);
        outerFlame.position.y = 0.38;
        flameGroup.add(outerFlame);

        const flameLight = new THREE.PointLight(0xf97316, 1.8, 2.5);
        flameLight.position.y = 0.38;
        flameGroup.add(flameLight);

        group.add(flameGroup);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.016, 16, 32), standMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.54;
        group.add(ring);

        const gauzeGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.005, 32);
        const gauzeMesh = new THREE.Mesh(gauzeGeo, wireGauzeMat);
        gauzeMesh.position.y = 0.55;
        group.add(gauzeMesh);

        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3;
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.58), standMat);
            const radius = 0.30;
            leg.position.set(Math.cos(angle) * radius, 0.29, Math.sin(angle) * radius);
            leg.rotation.z = Math.cos(angle) * -0.06;
            leg.rotation.x = Math.sin(angle) * 0.06;
            leg.castShadow = true;
            group.add(leg);
        }
    }

    buildSeparatoryFunnelMesh(group) {
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.45,
            roughness: 0.05,
            transmission: 0.92,
            thickness: 0.15,
            ior: 1.5,
            depthWrite: false
        });
        const stopperMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2 });
        const valveMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2 });
        const standMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85 });

        const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.3), standMat);
        base.position.set(-0.32, 0.02, 0);
        group.add(base);

        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.45, 16), standMat);
        rod.position.set(-0.32, 0.72, 0);
        group.add(rod);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.016, 16, 32), standMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, 1.05, 0);
        group.add(ring);

        const points = [];
        points.push(new THREE.Vector2(0.04, 0.68));
        points.push(new THREE.Vector2(0.04, 0.85));
        points.push(new THREE.Vector2(0.29, 1.15));
        points.push(new THREE.Vector2(0.31, 1.35));
        points.push(new THREE.Vector2(0.1, 1.48));
        points.push(new THREE.Vector2(0.12, 1.54));

        const bodyGeo = new THREE.LatheGeometry(points, 32);
        const bodyMesh = new THREE.Mesh(bodyGeo, glassMat);
        bodyMesh.position.y = 0.0;
        bodyMesh.castShadow = true;
        group.add(bodyMesh);

        const lowerConePoints = [];
        lowerConePoints.push(new THREE.Vector2(0.04, 0.0));
        lowerConePoints.push(new THREE.Vector2(0.04, 0.17));
        lowerConePoints.push(new THREE.Vector2(0.28, 0.46));
        lowerConePoints.push(new THREE.Vector2(0.0, 0.46));
        const lowerConeGeo = new THREE.LatheGeometry(lowerConePoints, 32);

        const upperBulbPoints = [];
        upperBulbPoints.push(new THREE.Vector2(0.28, 0.0));
        upperBulbPoints.push(new THREE.Vector2(0.30, 0.20));
        upperBulbPoints.push(new THREE.Vector2(0.10, 0.31));
        upperBulbPoints.push(new THREE.Vector2(0.0, 0.31));
        const upperBulbGeo = new THREE.LatheGeometry(upperBulbPoints, 32);

        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            opacity: 0.9,
            transparent: true,
            roughness: 0.1
        });
        const oilMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            opacity: 0.9,
            transparent: true,
            roughness: 0.1
        });

        // Lower Water Mesh
        const funnelWaterMesh = new THREE.Mesh(lowerConeGeo, waterMat);
        funnelWaterMesh.position.set(0, 0.68, 0);
        funnelWaterMesh.name = 'funnelWater';
        funnelWaterMesh.renderOrder = 2;
        funnelWaterMesh.visible = false;
        group.add(funnelWaterMesh);

        // Lower Oil Mesh (for oil alone or after water drains out)
        const funnelOilLowerMesh = new THREE.Mesh(lowerConeGeo, oilMat);
        funnelOilLowerMesh.position.set(0, 0.68, 0);
        funnelOilLowerMesh.name = 'funnelOilLower';
        funnelOilLowerMesh.renderOrder = 2;
        funnelOilLowerMesh.visible = false;
        group.add(funnelOilLowerMesh);

        // Upper Oil Mesh (for oil floating on top of water)
        const funnelOilUpperMesh = new THREE.Mesh(upperBulbGeo, oilMat);
        funnelOilUpperMesh.position.set(0, 1.14, 0);
        funnelOilUpperMesh.name = 'funnelOilUpper';
        funnelOilUpperMesh.renderOrder = 2;
        funnelOilUpperMesh.visible = false;
        group.add(funnelOilUpperMesh);

        // Settled Oil Mesh alias
        const funnelOilSettledMesh = new THREE.Mesh(upperBulbGeo, oilMat);
        funnelOilSettledMesh.position.set(0, 1.14, 0);
        funnelOilSettledMesh.name = 'funnelOilSettled';
        funnelOilSettledMesh.renderOrder = 2;
        funnelOilSettledMesh.visible = false;
        group.add(funnelOilSettledMesh);

        const streamGeo = new THREE.CylinderGeometry(0.022, 0.028, 0.62, 16);
        const streamMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            opacity: 0.9,
            transparent: true
        });
        const streamMesh = new THREE.Mesh(streamGeo, streamMat);
        streamMesh.position.set(0, 0.36, 0);
        streamMesh.name = 'drainingStream';
        streamMesh.visible = false;
        group.add(streamMesh);

        const oilStreamMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            opacity: 0.9,
            transparent: true
        });
        const oilStreamMesh = new THREE.Mesh(streamGeo, oilStreamMat);
        oilStreamMesh.position.set(0, 0.36, 0);
        oilStreamMesh.name = 'drainingOilStream';
        oilStreamMesh.visible = false;
        group.add(oilStreamMesh);

        const stopperMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.08, 16), stopperMat);
        stopperMesh.position.set(0, 1.58, 0);
        group.add(stopperMesh);

        const valveKey = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.035), valveMat);
        valveKey.position.set(0, 0.62, 0);
        valveKey.name = 'funnelValveKey';
        group.add(valveKey);
    }

    buildSieveMesh(group) {
        const brassRimMat = new THREE.MeshStandardMaterial({
            color: 0xca8a04,
            metalness: 0.85,
            roughness: 0.25
        });
        const chromeRimMat = new THREE.MeshStandardMaterial({
            color: 0xcbd5e1,
            metalness: 0.9,
            roughness: 0.2
        });
        const meshWireMat = new THREE.MeshStandardMaterial({
            color: 0x475569,
            wireframe: true,
            roughness: 0.5
        });

        // 1. Outer Brass Cylindrical Rim Frame
        const outerRim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.16, 36, 1, true), brassRimMat);
        outerRim.position.y = 0.08;
        outerRim.castShadow = true;
        group.add(outerRim);

        // 2. Top & Bottom Metallic Borders
        const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.018, 16, 36), chromeRimMat);
        topRing.rotation.x = Math.PI / 2;
        topRing.position.y = 0.16;
        group.add(topRing);

        const bottomRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.018, 16, 36), chromeRimMat);
        bottomRing.rotation.x = Math.PI / 2;
        bottomRing.position.y = 0.01;
        group.add(bottomRing);

        // 3. Woven Wire Grid Filter Floor
        const bottomGrid = new THREE.Mesh(new THREE.CircleGeometry(0.375, 32), meshWireMat);
        bottomGrid.rotation.x = Math.PI / 2;
        bottomGrid.position.y = 0.02;
        group.add(bottomGrid);

        // 4. Trapped Coarse Pebbles Cluster (Hidden initially until sieving)
        const sievePebblesGroup = new THREE.Group();
        sievePebblesGroup.name = 'sievePebbles';
        sievePebblesGroup.visible = false;

        const pebbleGeo = new THREE.DodecahedronGeometry(0.042, 1);
        const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });

        for (let i = 0; i < 20; i++) {
            const pebbleMesh = new THREE.Mesh(pebbleGeo, pebbleMat);
            const radius = Math.random() * 0.28;
            const angle = Math.random() * Math.PI * 2;
            pebbleMesh.position.set(Math.cos(angle) * radius, 0.04 + Math.random() * 0.03, Math.sin(angle) * radius);
            pebbleMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            const s = 0.8 + Math.random() * 0.5;
            pebbleMesh.scale.set(s, s * 0.6, s);
            pebbleMesh.visible = false;
            sievePebblesGroup.add(pebbleMesh);
        }
        group.add(sievePebblesGroup);
    }

    buildTrashBinMesh(group) {
        const darkBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.2 });
        const lidMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
        const pedalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });

        const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.52, 32), darkBodyMat);
        bodyMesh.position.y = 0.26;
        bodyMesh.castShadow = true;
        group.add(bodyMesh);

        const lidMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.04, 32), lidMat);
        lidMesh.position.y = 0.54;
        group.add(lidMesh);

        const pedalMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.12), pedalMat);
        pedalMesh.position.set(0, 0.01, 0.28);
        group.add(pedalMesh);
    }
}
