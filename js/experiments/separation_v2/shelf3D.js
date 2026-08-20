/**
 * Laboratory Table & 3D Isometric Shelf Mesh Component
 * Single Responsibility: Constructs the 3D isometric laboratory environment table, shadow floor, and background shelf.
 */

import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

export class LabEnvironment3D {
    constructor(scene) {
        this.scene = scene;
        this.initTable();
        this.initShelf();
        this.initGround();
    }

    initTable() {
        this.tableGroup = new THREE.Group();
        this.scene.add(this.tableGroup);

        // Slate / Wooden Top
        const topGeo = new THREE.BoxGeometry(10, 0.4, 6);
        const topMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.3,
            metalness: 0.1
        });
        const tableTop = new THREE.Mesh(topGeo, topMat);
        tableTop.position.y = -0.2;
        tableTop.receiveShadow = true;
        tableTop.castShadow = true;
        this.tableGroup.add(tableTop);

        // Table Beveled Border Accent
        const borderGeo = new THREE.BoxGeometry(10.2, 0.1, 6.2);
        const borderMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2 });
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.position.y = -0.45;
        this.tableGroup.add(border);

        // Metallic Legs
        const legGeo = new THREE.CylinderGeometry(0.15, 0.15, 4, 16);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
        
        const legPositions = [
            [-4.6, -2.4, -2.6],
            [4.6, -2.4, -2.6],
            [-4.6, -2.4, 2.6],
            [4.6, -2.4, 2.6]
        ];

        legPositions.forEach(([x, y, z]) => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(x, y, z);
            leg.castShadow = true;
            this.tableGroup.add(leg);
        });
    }

    initShelf() {
        this.shelfGroup = new THREE.Group();
        this.shelfGroup.position.set(0, 2.5, -3.2);
        this.scene.add(this.shelfGroup);

        // Wooden / Dark Metallic Backboard
        const backGeo = new THREE.BoxGeometry(9.5, 3.5, 0.2);
        const backMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
        const back = new THREE.Mesh(backGeo, backMat);
        back.castShadow = true;
        this.shelfGroup.add(back);

        // Horizontal Shelf Planks
        const plankGeo = new THREE.BoxGeometry(9.2, 0.15, 1.2);
        const plankMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });

        const plank1 = new THREE.Mesh(plankGeo, plankMat);
        plank1.position.set(0, -0.6, 0.5);
        plank1.castShadow = true;
        plank1.receiveShadow = true;
        this.shelfGroup.add(plank1);

        const plank2 = new THREE.Mesh(plankGeo, plankMat);
        plank2.position.set(0, 0.8, 0.5);
        plank2.castShadow = true;
        plank2.receiveShadow = true;
        this.shelfGroup.add(plank2);
    }

    initGround() {
        // Soft Shadow Floor Plane
        const floorGeo = new THREE.PlaneGeometry(30, 30);
        const floorMat = new THREE.ShadowMaterial({ opacity: 0.35 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -4.4;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }
}
