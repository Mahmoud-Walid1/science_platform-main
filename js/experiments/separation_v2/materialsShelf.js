import * as THREE from 'three';

export const RAW_MATERIALS = {
    sand: { id: 'sand', name: 'رمل', color: 0xc28e5c, particleColor: 0xc28e5c, type: 'solid_granular' },
    salt: { id: 'salt', name: 'ملح', color: 0xf8fafc, particleColor: 0xe2e8f0, type: 'solid_soluble' },
    iron: { id: 'iron', name: 'برادة حديد', color: 0x1e293b, particleColor: 0x1e293b, type: 'solid_magnetic' },
    pebbles: { id: 'pebbles', name: 'حصى', color: 0x64748b, particleColor: 0x475569, type: 'solid_coarse' },
    oil: { id: 'oil', name: 'زيت', color: 0xfacc15, particleColor: 0xfde047, type: 'liquid_immiscible' },
    water: { id: 'water', name: 'ماء', color: 0x0284c7, particleColor: 0x38bdf8, type: 'liquid_water' },
    filter_paper: { id: 'filter_paper', name: 'ورقة ترشيح', color: 0xf8fafc, particleColor: 0xffffff, type: 'filter_item' }
};

export class MaterialsShelf {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.scene;
        this.materialBottles = [];

        this.initBottles();
    }

    createStickerTexture(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 128);
        ctx.strokeStyle = '#004e66';
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, 248, 120);

        ctx.fillStyle = '#004e66';
        ctx.font = 'bold 38px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    initBottles() {
        const materialsList = Object.values(RAW_MATERIALS);
        const startX = -2.2;
        const spacingX = 0.72;
        const shelfY = 2.14;
        const shelfZ = -0.9;

        materialsList.forEach((matInfo, index) => {
            const bottleGroup = new THREE.Group();
            bottleGroup.name = `bottle_${matInfo.id}`;
            bottleGroup.userData = {
                type: 'material_bottle',
                materialData: matInfo,
                isDragging: false,
                homePosition: new THREE.Vector3(startX + index * spacingX, shelfY, shelfZ)
            };

            if (matInfo.id === 'filter_paper') {
                const boxMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
                const boxGeo = new THREE.BoxGeometry(0.36, 0.22, 0.36);
                const boxMesh = new THREE.Mesh(boxGeo, boxMat);
                boxMesh.position.y = 0.11;
                boxMesh.castShadow = false;
                bottleGroup.add(boxMesh);

                const stickerMat = new THREE.MeshBasicMaterial({ map: this.createStickerTexture('ورقة ترشيح') });
                const stickerMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.14), stickerMat);
                stickerMesh.position.set(0, 0.11, 0.185);
                bottleGroup.add(stickerMesh);

                const paperTopMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.95 });
                const paperCone = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.14, 16), paperTopMat);
                paperCone.rotation.x = Math.PI;
                paperCone.position.set(0, 0.24, 0);
                bottleGroup.add(paperCone);
            } else if (matInfo.type.startsWith('liquid')) {
                const liquidColor = matInfo.id === 'oil' ? 0xf59e0b : 0x0284c7;
                const liquidMat = new THREE.MeshStandardMaterial({
                    color: liquidColor,
                    transparent: true,
                    opacity: 0.95,
                    roughness: 0.1,
                    depthWrite: true
                });
                const liquidMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.28, 24), liquidMat);
                liquidMesh.position.y = 0.14;
                liquidMesh.renderOrder = 2;
                bottleGroup.add(liquidMesh);

                const glassMat = new THREE.MeshPhysicalMaterial({
                    color: 0xdbeafe,
                    transparent: true,
                    opacity: 0.50,
                    roughness: 0.1,
                    transmission: 0.2,
                    ior: 1.5,
                    thickness: 0.25,
                    depthWrite: false
                });
                const flaskBody = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.36, 24), glassMat);
                flaskBody.position.y = 0.18;
                flaskBody.castShadow = false;
                flaskBody.renderOrder = 10;
                bottleGroup.add(flaskBody);

                const capMat = new THREE.MeshStandardMaterial({ color: 0x004e66, roughness: 0.2 });
                const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.09, 24), capMat);
                capMesh.position.y = 0.405;
                capMesh.renderOrder = 11;
                bottleGroup.add(capMesh);

                const stickerMat = new THREE.MeshBasicMaterial({ map: this.createStickerTexture(matInfo.name) });
                const stickerMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.13), stickerMat);
                stickerMesh.position.set(0, 0.2, 0.175);
                stickerMesh.renderOrder = 12;
                bottleGroup.add(stickerMesh);
            } else {
                // Solid Jars (Sand, Salt, Iron, Pebbles)
                const jarGlassMat = new THREE.MeshPhysicalMaterial({
                    color: 0xdbeafe,
                    transparent: true,
                    opacity: 0.50,
                    roughness: 0.1,
                    transmission: 0.2,
                    ior: 1.45,
                    depthWrite: false
                });

                const jarBody = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.36, 24), jarGlassMat);
                jarBody.position.y = 0.18;
                jarBody.castShadow = false;
                jarBody.renderOrder = 10;
                bottleGroup.add(jarBody);

                if (matInfo.id === 'pebbles') {
                    // Realistic 3D Pebbles/Rocks inside Jar
                    const pebbleGroup = new THREE.Group();
                    pebbleGroup.name = 'jarPebblesGroup';
                    const colors = [0x475569, 0x64748b, 0x334155, 0x52525b, 0x78716c];

                    for (let i = 0; i < 22; i++) {
                        const col = colors[i % colors.length];
                        const pebbleMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 });
                        const size = 0.024 + Math.random() * 0.016;
                        const pebbleGeo = new THREE.DodecahedronGeometry(size, 1);
                        const pebbleMesh = new THREE.Mesh(pebbleGeo, pebbleMat);

                        const radius = Math.random() * 0.13;
                        const theta = Math.random() * Math.PI * 2;
                        const pY = 0.05 + Math.random() * 0.22;

                        pebbleMesh.position.set(Math.cos(theta) * radius, pY, Math.sin(theta) * radius);
                        pebbleMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                        pebbleGroup.add(pebbleMesh);
                    }
                    bottleGroup.add(pebbleGroup);
                } else {
                    const solidContentMat = new THREE.MeshStandardMaterial({
                        color: matInfo.color,
                        roughness: 0.95
                    });
                    const solidContentMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.24, 24), solidContentMat);
                    solidContentMesh.position.y = 0.12;
                    bottleGroup.add(solidContentMesh);
                }

                const corkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
                const corkMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.08, 24), corkMat);
                corkMesh.position.y = 0.40;
                bottleGroup.add(corkMesh);

                const stickerMat = new THREE.MeshBasicMaterial({ map: this.createStickerTexture(matInfo.name) });
                const stickerMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.14), stickerMat);
                stickerMesh.position.set(0, 0.2, 0.195);
                bottleGroup.add(stickerMesh);
            }

            bottleGroup.position.copy(bottleGroup.userData.homePosition);
            this.scene.add(bottleGroup);

            this.materialBottles.push(bottleGroup);
        });
    }
}
