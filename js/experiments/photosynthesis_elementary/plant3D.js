/**
 * plant3D.js
 * Clean Architecture - Realistically Tapered & Fibrous Underground Root System, Organic Soil Bed, and 3D Minerals.
 */

export class Plant3D {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.plantBodyGroup = new THREE.Group();
        this.mineralsGroup = new THREE.Group();
        this.leaves = [];
        this.leafMaterials = [];
        this.mineralSpheres = [];

        this.pulseTime = 0;
        this.currentGrowthY = 1.0;
        this.targetGrowthY = 1.0;
        this.currentGrowthXZ = 1.0;
        this.targetGrowthXZ = 1.0;

        this.mineralsLevel = 'low';

        this.buildWideOrganicSoilBedAndRoots();
        this.buildMineralElementSpheres();
        this.buildStemAndLushLeaves();

        this.group.add(this.mineralsGroup);
        this.group.add(this.plantBodyGroup);
        this.scene.add(this.group);
    }

    createMineralCanvasTexture(symbol, bgColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Circular background fill
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(64, 64, 58, 0, Math.PI * 2);
        ctx.fill();

        // Thick White Border Ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Bold Symbol Text (N, P, K, Ca, Mg, S)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 54px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    buildWideOrganicSoilBedAndRoots() {
        // --- 1. Compact Central Soil Bed (Trimmed Width: 9.5) ---
        const soilBedGeo = new THREE.BoxGeometry(9.5, 1.5, 2.5);
        const soilMat = new THREE.MeshStandardMaterial({
            color: 0x2e190e,
            roughness: 0.95,
            metalness: 0.05
        });
        const soilMesh = new THREE.Mesh(soilBedGeo, soilMat);
        soilMesh.position.set(0, -0.75, -1.25);
        soilMesh.receiveShadow = true;
        this.group.add(soilMesh);

        // Organic Topsoil Surfacing Layer
        const topSoilGeo = new THREE.BoxGeometry(9.7, 0.08, 2.6);
        const topSoilMat = new THREE.MeshStandardMaterial({
            color: 0x422714,
            roughness: 0.9
        });
        const topSoilMesh = new THREE.Mesh(topSoilGeo, topSoilMat);
        topSoilMesh.position.set(0, 0.01, -1.25);
        topSoilMesh.receiveShadow = true;
        this.group.add(topSoilMesh);

        // Soil Mounds
        for (let i = 0; i < 18; i++) {
            const moundGeo = new THREE.SphereGeometry(0.15 + Math.random() * 0.18, 16, 16);
            moundGeo.scale(1.4, 0.4, 1.2);
            const moundMesh = new THREE.Mesh(moundGeo, topSoilMat);
            moundMesh.position.set(
                (Math.random() - 0.5) * 4.5,
                0.015,
                -0.2 - Math.random() * 1.0
            );
            this.group.add(moundMesh);
        }

        // Soil Granules
        const pebbleGeo = new THREE.DodecahedronGeometry(0.04, 1);
        const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x1f1008, roughness: 0.9 });
        for (let i = 0; i < 45; i++) {
            const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
            pebble.position.set(
                (Math.random() - 0.5) * 8.5,
                -0.06 - Math.random() * 1.0,
                0.01
            );
            pebble.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
            this.group.add(pebble);
        }

        // --- 2. Realistic Tapered & Fibrous Underground Root Network ---
        const rootMat = new THREE.MeshStandardMaterial({
            color: 0xebd4b0, // Realistic Ivory / Warm Root Tan
            roughness: 0.65,
            metalness: 0.02
        });

        // Helper to generate tapered organic root tubes
        const createTaperedRootMesh = (points, startRadius, endRadius, radialSegs = 10) => {
            const curve = new THREE.CatmullRomCurve3(points);
            const numSamples = 24;
            const geom = new THREE.BufferGeometry();
            const positions = [];
            const indices = [];

            const curvePoints = curve.getPoints(numSamples);

            for (let i = 0; i <= numSamples; i++) {
                const t = i / numSamples;
                const radius = startRadius * (1 - t) + endRadius * t;
                const point = curvePoints[i];
                const tangent = curve.getTangent(t);

                // Calculate perpendicular frame
                const up = Math.abs(tangent.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
                const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
                const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

                for (let j = 0; j < radialSegs; j++) {
                    const angle = (j / radialSegs) * Math.PI * 2;
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    const px = point.x + radius * (cos * normal.x + sin * binormal.x);
                    const py = point.y + radius * (cos * normal.y + sin * binormal.y);
                    const pz = point.z + radius * (cos * normal.z + sin * binormal.z);

                    positions.push(px, py, pz);
                }
            }

            for (let i = 0; i < numSamples; i++) {
                for (let j = 0; j < radialSegs; j++) {
                    const current = i * radialSegs + j;
                    const next = i * radialSegs + ((j + 1) % radialSegs);
                    const currentNext = (i + 1) * radialSegs + j;
                    const nextNext = (i + 1) * radialSegs + ((j + 1) % radialSegs);

                    indices.push(current, currentNext, next);
                    indices.push(next, currentNext, nextNext);
                }
            }

            geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geom.setIndex(indices);
            geom.computeVertexNormals();

            const mesh = new THREE.Mesh(geom, rootMat);
            mesh.renderOrder = 10;
            mesh.castShadow = true;
            return mesh;
        };

        // Root Branches Definition with Realistic Organic Splines
        const rootBranchSpecs = [
            // Central Taproot
            {
                pts: [
                    new THREE.Vector3(0, 0.01, 0.45),
                    new THREE.Vector3(0.04, -0.3, 0.46),
                    new THREE.Vector3(-0.06, -0.75, 0.47),
                    new THREE.Vector3(0.03, -1.2, 0.46),
                    new THREE.Vector3(-0.02, -1.5, 0.45)
                ],
                rStart: 0.09, rEnd: 0.02
            },
            // Left Major Lateral
            {
                pts: [
                    new THREE.Vector3(0, -0.1, 0.45),
                    new THREE.Vector3(-0.4, -0.32, 0.47),
                    new THREE.Vector3(-1.1, -0.6, 0.48),
                    new THREE.Vector3(-1.9, -0.88, 0.46),
                    new THREE.Vector3(-2.6, -1.05, 0.44)
                ],
                rStart: 0.075, rEnd: 0.015
            },
            // Right Major Lateral
            {
                pts: [
                    new THREE.Vector3(0, -0.1, 0.45),
                    new THREE.Vector3(0.45, -0.3, 0.47),
                    new THREE.Vector3(1.15, -0.58, 0.48),
                    new THREE.Vector3(2.0, -0.85, 0.46),
                    new THREE.Vector3(2.7, -1.02, 0.44)
                ],
                rStart: 0.075, rEnd: 0.015
            },
            // Left Secondary Branch 1
            {
                pts: [
                    new THREE.Vector3(-0.4, -0.32, 0.47),
                    new THREE.Vector3(-0.8, -0.65, 0.48),
                    new THREE.Vector3(-1.3, -1.0, 0.46),
                    new THREE.Vector3(-1.75, -1.28, 0.45)
                ],
                rStart: 0.05, rEnd: 0.01
            },
            // Right Secondary Branch 1
            {
                pts: [
                    new THREE.Vector3(0.45, -0.3, 0.47),
                    new THREE.Vector3(0.85, -0.62, 0.48),
                    new THREE.Vector3(1.35, -0.98, 0.46),
                    new THREE.Vector3(1.8, -1.25, 0.45)
                ],
                rStart: 0.05, rEnd: 0.01
            },
            // Left Secondary Branch 2 (Deep)
            {
                pts: [
                    new THREE.Vector3(-0.06, -0.75, 0.47),
                    new THREE.Vector3(-0.5, -1.05, 0.46),
                    new THREE.Vector3(-0.95, -1.35, 0.45)
                ],
                rStart: 0.04, rEnd: 0.01
            },
            // Right Secondary Branch 2 (Deep)
            {
                pts: [
                    new THREE.Vector3(-0.06, -0.75, 0.47),
                    new THREE.Vector3(0.45, -1.02, 0.46),
                    new THREE.Vector3(0.9, -1.32, 0.45)
                ],
                rStart: 0.04, rEnd: 0.01
            },
            // Far Left Shallow Rootlet
            {
                pts: [
                    new THREE.Vector3(-1.1, -0.6, 0.48),
                    new THREE.Vector3(-1.7, -0.72, 0.47),
                    new THREE.Vector3(-2.3, -0.8, 0.45)
                ],
                rStart: 0.035, rEnd: 0.008
            },
            // Far Right Shallow Rootlet
            {
                pts: [
                    new THREE.Vector3(1.15, -0.58, 0.48),
                    new THREE.Vector3(1.75, -0.7, 0.47),
                    new THREE.Vector3(2.35, -0.78, 0.45)
                ],
                rStart: 0.035, rEnd: 0.008
            }
        ];

        rootBranchSpecs.forEach(spec => {
            const rootMesh = createTaperedRootMesh(spec.pts, spec.rStart, spec.rEnd);
            this.group.add(rootMesh);
        });
    }

    buildMineralElementSpheres() {
        this.elementDefs = [
            { symbol: 'N', color: '#10b981', hex: 0x10b981 }, // Nitrogen (Emerald Green)
            { symbol: 'P', color: '#f97316', hex: 0xf97316 }, // Phosphorus (Orange)
            { symbol: 'K', color: '#2563eb', hex: 0x2563eb }, // Potassium (Royal Blue)
            { symbol: 'Ca', color: '#06b6d4', hex: 0x06b6d4 },// Calcium (Cyan)
            { symbol: 'Mg', color: '#9333ea', hex: 0x9333ea },// Magnesium (Purple)
            { symbol: 'S', color: '#eab308', hex: 0xeab308 }  // Sulfur (Gold Yellow)
        ];

        const sphereGeo = new THREE.SphereGeometry(0.14, 32, 32);

        for (let i = 0; i < 30; i++) {
            const elem = this.elementDefs[i % this.elementDefs.length];
            const tex = this.createMineralCanvasTexture(elem.symbol, elem.color);

            const mat = new THREE.MeshStandardMaterial({
                map: tex,
                color: 0xffffff,
                roughness: 0.15,
                metalness: 0.1,
                emissive: elem.hex,
                emissiveIntensity: 0.65
            });

            const sphereMesh = new THREE.Mesh(sphereGeo, mat);
            sphereMesh.renderOrder = 20;

            const baseX = (Math.random() - 0.5) * 5.5;
            const baseY = -0.15 - Math.random() * 0.9;
            const baseZ = 0.55 + (Math.random() - 0.5) * 0.08;

            sphereMesh.position.set(baseX, baseY, baseZ);
            sphereMesh.userData = {
                baseX, baseY, baseZ,
                pulseOffset: Math.random() * Math.PI * 2,
                elemSymbol: elem.symbol
            };

            this.mineralSpheres.push(sphereMesh);
            this.mineralsGroup.add(sphereMesh);
        }

        this.updateMineralVisibility();
    }

    setMineralsLevel(level) {
        this.mineralsLevel = level;
        this.updateMineralVisibility();
    }

    updateMineralVisibility() {
        let activeCount = 8;
        if (this.mineralsLevel === 'medium') activeCount = 18;
        if (this.mineralsLevel === 'high') activeCount = 30;

        this.mineralSpheres.forEach((sphere, idx) => {
            if (idx < activeCount) {
                sphere.visible = true;
            } else {
                sphere.visible = false;
            }
        });
    }

    buildStemAndLushLeaves() {
        const stemCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 1.3, 0),
            new THREE.Vector3(0, 2.6, 0)
        ]);

        const stemGeo = new THREE.TubeGeometry(stemCurve, 32, 0.07, 16, false);
        const stemMat = new THREE.MeshStandardMaterial({
            color: 0x15803d,
            roughness: 0.45,
            metalness: 0.05
        });
        const stemMesh = new THREE.Mesh(stemGeo, stemMat);
        stemMesh.castShadow = true;
        stemMesh.receiveShadow = true;
        this.plantBodyGroup.add(stemMesh);

        const createLeafGeo = () => {
            const geom = new THREE.PlaneGeometry(0.7, 1.2, 12, 12);
            geom.translate(0, 0.6, 0);

            const pos = geom.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);

                const centerDist = Math.abs(x);
                const yFactor = y / 1.2;

                const widthScale = Math.sin(yFactor * Math.PI) * 0.95;
                pos.setX(i, x * widthScale);

                const zCurve = -Math.pow(centerDist, 1.4) * 0.2 + Math.sin(yFactor * Math.PI) * 0.08;
                pos.setZ(i, zCurve);
            }

            geom.computeVertexNormals();
            return geom;
        };

        const leafGeo = createLeafGeo();

        const leafNodes = [
            { pos: new THREE.Vector3(0, 0.65, 0), rot: new THREE.Euler(0.2, 0, -1.0), scale: 0.85 },
            { pos: new THREE.Vector3(0, 0.65, 0), rot: new THREE.Euler(0.2, Math.PI, -1.0), scale: 0.85 },
            { pos: new THREE.Vector3(0, 1.15, 0), rot: new THREE.Euler(-1.0, Math.PI / 2, 0.2), scale: 0.82 },
            { pos: new THREE.Vector3(0, 1.15, 0), rot: new THREE.Euler(-1.0, -Math.PI / 2, -0.2), scale: 0.82 },
            { pos: new THREE.Vector3(0, 1.65, 0), rot: new THREE.Euler(0.15, 0.3, -0.9), scale: 0.76 },
            { pos: new THREE.Vector3(0, 1.65, 0), rot: new THREE.Euler(0.15, Math.PI - 0.3, -0.9), scale: 0.76 },
            { pos: new THREE.Vector3(0, 2.1, 0), rot: new THREE.Euler(-0.8, Math.PI / 2 + 0.3, 0.2), scale: 0.68 },
            { pos: new THREE.Vector3(0, 2.1, 0), rot: new THREE.Euler(-0.8, -Math.PI / 2 - 0.3, -0.2), scale: 0.68 },
            { pos: new THREE.Vector3(0, 2.45, 0), rot: new THREE.Euler(0.1, 0, -0.8), scale: 0.58 },
            { pos: new THREE.Vector3(0, 2.6, 0), rot: new THREE.Euler(-0.2, 0, 0), scale: 0.45 }
        ];

        leafNodes.forEach((lc, idx) => {
            const mat = new THREE.MeshStandardMaterial({
                color: 0x22c55e,
                roughness: 0.3,
                metalness: 0.04,
                side: THREE.DoubleSide,
                emissive: 0x000000
            });
            this.leafMaterials.push(mat);

            const leafMesh = new THREE.Mesh(leafGeo, mat);
            leafMesh.position.copy(lc.pos);
            leafMesh.rotation.copy(lc.rot);
            leafMesh.scale.setScalar(lc.scale);
            leafMesh.castShadow = true;
            leafMesh.receiveShadow = true;

            leafMesh.userData = {
                baseRotX: lc.rot.x,
                baseRotY: lc.rot.y,
                baseRotZ: lc.rot.z,
                index: idx
            };

            this.leaves.push(leafMesh);
            this.plantBodyGroup.add(leafMesh);
        });
    }

    update(rateScore) {
        this.pulseTime += 0.035;

        // Animate 3D Mineral Element Spheres Pulsing
        this.mineralSpheres.forEach(sphere => {
            if (!sphere.visible) return;
            const data = sphere.userData;

            sphere.position.y = data.baseY + Math.sin(this.pulseTime * 2.5 + data.pulseOffset) * 0.05;

            if (this.mineralsLevel === 'high') {
                sphere.material.emissiveIntensity = 0.65 + Math.sin(this.pulseTime * 5 + data.pulseOffset) * 0.35;
            } else {
                sphere.material.emissiveIntensity = 0.45;
            }
        });

        // Continuous Proportional Botanical Growth based on rateScore (0.2 -> 1.0)
        // Low (0.2) = 0.88, Medium (0.6) = 1.11, High (1.0) = 1.33 (Distinct visible height!)
        this.targetGrowthY = 0.80 + rateScore * 0.53;
        this.targetGrowthXZ = 0.88 + rateScore * 0.32;

        // Smooth Lerp Vertical Stem & Leaf Expansion
        this.currentGrowthY += (this.targetGrowthY - this.currentGrowthY) * 0.04;
        this.currentGrowthXZ += (this.targetGrowthXZ - this.currentGrowthXZ) * 0.04;

        if (this.plantBodyGroup) {
            this.plantBodyGroup.scale.set(this.currentGrowthXZ, this.currentGrowthY, this.currentGrowthXZ);
        }

        // Smooth Color & Glow Transition from Low (Lime) -> Medium (Green) -> High (Lush Emerald Glow)
        const colorLow = new THREE.Color(0x84cc16);   // Lime Green
        const colorMed = new THREE.Color(0x22c55e);   // Vibrant Green
        const colorHigh = new THREE.Color(0x4ade80);  // Lush Emerald Green

        const currentLeafColor = new THREE.Color();
        if (rateScore < 0.6) {
            const t = (rateScore - 0.2) / 0.4;
            currentLeafColor.lerpColors(colorLow, colorMed, Math.max(0, Math.min(1, t)));
        } else {
            const t = (rateScore - 0.6) / 0.4;
            currentLeafColor.lerpColors(colorMed, colorHigh, Math.max(0, Math.min(1, t)));
        }

        const windSpeed = 0.6 + rateScore * 1.0;
        const droopOffset = (1.0 - rateScore) * 0.14;

        this.leaves.forEach((leaf) => {
            const idx = leaf.userData.index;
            const mat = leaf.material;

            mat.color.copy(currentLeafColor);

            if (rateScore > 0.65) {
                mat.emissive.setHex(0x15803d);
                mat.emissiveIntensity = (rateScore - 0.65) * 0.6 * (0.8 + Math.sin(this.pulseTime * 2.5 + idx) * 0.2);
            } else {
                mat.emissive.setHex(0x000000);
                mat.emissiveIntensity = 0;
            }

            const swayX = Math.sin(this.pulseTime * windSpeed + idx * 0.8) * 0.035 + droopOffset;
            const swayZ = Math.cos(this.pulseTime * windSpeed * 0.9 + idx * 1.2) * 0.04;

            leaf.rotation.x = leaf.userData.baseRotX + swayX;
            leaf.rotation.z = leaf.userData.baseRotZ + swayZ;
        });

        this.group.rotation.y = Math.sin(this.pulseTime * 0.4) * 0.025;
    }
}
