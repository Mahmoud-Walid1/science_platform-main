import * as THREE from 'three';
import { soundManager } from './soundManager.js';

export class PouringEngine {
    constructor(sceneManager, beaker3D) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.scene;
        this.beaker3D = beaker3D;
        this.isPouring = false;

        this.initStreamMesh();
    }

    initStreamMesh() {
        const streamGeo = new THREE.CylinderGeometry(0.016, 0.026, 0.45, 16);
        const streamMat = new THREE.MeshBasicMaterial({
            color: 0x0284c7,
            transparent: true,
            opacity: 0.9
        });
        this.streamMesh = new THREE.Mesh(streamGeo, streamMat);
        this.streamMesh.position.set(0, 1.0, 0);
        this.streamMesh.visible = false;
        this.scene.add(this.streamMesh);

        const grainCount = 40;
        const grainGeo = new THREE.BufferGeometry();
        const grainPos = new Float32Array(grainCount * 3);
        for (let i = 0; i < grainCount; i++) {
            grainPos[i * 3] = (Math.random() - 0.5) * 0.03;
            grainPos[i * 3 + 1] = -Math.random() * 0.45;
            grainPos[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
        }
        grainGeo.setAttribute('position', new THREE.BufferAttribute(grainPos, 3));
        const grainMat = new THREE.PointsMaterial({ size: 0.03, transparent: true, opacity: 0.9 });
        this.grainStream = new THREE.Points(grainGeo, grainMat);
        this.grainStream.visible = false;
        this.scene.add(this.grainStream);
    }

    animatePour(bottleGroup, onComplete) {
        const targetBeaker = this.beaker3D.beaker1 || this.beaker3D;
        this.pourMaterialBottleToBeaker(bottleGroup, targetBeaker, onComplete);
    }

    pourMaterialBottleToBeaker(bottleGroup, targetBeaker, onComplete) {
        if (this.isPouring) return;
        this.isPouring = true;

        const matData = bottleGroup.userData.materialData;
        const beakerGroup = targetBeaker.group ? targetBeaker.group : targetBeaker;
        
        // Dynamically fetch live 3D position of target beaker
        const beakerPos = beakerGroup.position.clone();
        const targetPos = new THREE.Vector3(beakerPos.x + 0.22, beakerPos.y + 0.72, beakerPos.z);
        const homePos = bottleGroup.userData.homePosition.clone();

        const startTime = performance.now();
        const duration = 400;

        const animateMove = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

            bottleGroup.position.lerpVectors(bottleGroup.position, targetPos, easeProgress);

            if (progress < 1) {
                requestAnimationFrame(animateMove);
            } else {
                this.tiltAndPour(bottleGroup, matData, beakerGroup, homePos, targetBeaker, onComplete);
            }
        };
        requestAnimationFrame(animateMove);
    }

    pourBeakerIntoFunnel(beakerObj, funnelTool, onComplete) {
        if (this.isPouring) return;
        this.isPouring = true;

        this.sceneManager.focusCameraOn(funnelTool.position);

        const beakerGroup = beakerObj.group ? beakerObj.group : beakerObj;
        const fPos = funnelTool.position.clone();
        const targetPos = new THREE.Vector3(fPos.x + 0.35, fPos.y + 1.45, fPos.z);
        const origPos = beakerObj.homePosition ? beakerObj.homePosition.clone() : beakerGroup.position.clone();

        const hasWater = beakerObj.ingredients.some(i => i.id === 'water');
        const hasOil = beakerObj.ingredients.some(i => i.id === 'oil');

        soundManager.playLiquidPour(2.2);

        const startTime = performance.now();
        const duration = 450;

        const animateMove = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

            beakerGroup.position.lerpVectors(beakerGroup.position, targetPos, easeProgress);

            if (progress < 1) {
                requestAnimationFrame(animateMove);
            } else {
                const tiltStart = performance.now();
                const tiltDuration = 600;

                const streamX = fPos.x + 0.08;
                const streamY = fPos.y + 1.15;

                if (hasWater) {
                    this.streamMesh.material.color.setHex(0x0284c7);
                } else if (hasOil) {
                    this.streamMesh.material.color.setHex(0xfacc15);
                }
                this.streamMesh.position.set(streamX, streamY, fPos.z);
                this.streamMesh.visible = true;

                const funnelWater = funnelTool.getObjectByName('funnelWater');
                const funnelOilLower = funnelTool.getObjectByName('funnelOilLower');
                const funnelOilUpper = funnelTool.getObjectByName('funnelOilUpper');

                const animateTilt = (t) => {
                    const p = Math.min((t - tiltStart) / tiltDuration, 1);
                    beakerGroup.rotation.z = p * (Math.PI / 2.4);

                    if (beakerObj.waterMesh && beakerObj.waterMesh.visible) {
                        beakerObj.waterMesh.scale.y = Math.max(0.01, (1 - p) * 1.0);
                    }
                    if (beakerObj.oilMesh && beakerObj.oilMesh.visible) {
                        beakerObj.oilMesh.scale.y = Math.max(0.01, (1 - p) * 1.0);
                    }

                    // Real-time simultaneous fluid level rise inside separatory funnel as pouring happens!
                    const existingIngredients = funnelTool.userData.ingredients || [];
                    const currentHasWater = existingIngredients.some(i => i.id === 'water') || hasWater;
                    const currentHasOil = existingIngredients.some(i => i.id === 'oil') || hasOil;

                    if (currentHasWater && currentHasOil) {
                        if (funnelWater) {
                            funnelWater.visible = true;
                            funnelWater.scale.set(p, p, p);
                        }
                        if (funnelOilUpper) {
                            funnelOilUpper.visible = true;
                            funnelOilUpper.position.set(0, 1.14, 0);
                            funnelOilUpper.scale.set(p, p, p);
                        }
                        if (funnelOilLower) funnelOilLower.visible = false;
                    } else if (currentHasOil) {
                        if (funnelOilLower) {
                            funnelOilLower.visible = true;
                            funnelOilLower.scale.set(p, p, p);
                        }
                    } else if (currentHasWater) {
                        if (funnelWater) {
                            funnelWater.visible = true;
                            funnelWater.scale.set(p, p, p);
                        }
                    }

                    if (p < 1) {
                        requestAnimationFrame(animateTilt);
                    } else {
                        setTimeout(() => {
                            this.streamMesh.visible = false;
                            beakerGroup.rotation.z = 0;
                            beakerGroup.position.copy(origPos);
                            this.isPouring = false;
                            if (onComplete) onComplete();
                        }, 500);
                    }
                };
                requestAnimationFrame(animateTilt);
            }
        };
        requestAnimationFrame(animateMove);
    }

    pourBeakerIntoFilterFunnel(beakerObj, filterTool, onComplete) {
        if (this.isPouring) return;
        this.isPouring = true;

        // Immediately Zoom Camera in High Top-Down view on Filter Funnel
        this.sceneManager.focusCameraOnFunnelTopView(filterTool.position);

        const beakerGroup = beakerObj.group ? beakerObj.group : beakerObj;
        const fPos = filterTool.position.clone();
        const targetPos = new THREE.Vector3(fPos.x + 0.32, fPos.y + 1.25, fPos.z);
        const origPos = beakerGroup.position.clone();

        const hasWater = beakerObj.ingredients.some(i => i.id === 'water');
        const hasSolids = beakerObj.ingredients.some(i => i.type && i.type.startsWith('solid'));

        if (hasWater) {
            soundManager.playLiquidPour(2.2);
        } else {
            soundManager.playSolidPourDry(1.8);
        }

        const startTime = performance.now();
        const duration = 500;

        const animateMove = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

            beakerGroup.position.lerpVectors(beakerGroup.position, targetPos, easeProgress);

            if (progress < 1) {
                requestAnimationFrame(animateMove);
            } else {
                const tiltStart = performance.now();
                const tiltDuration = 600;

                const streamX = fPos.x + 0.08;
                const streamY = fPos.y + 0.95;

                // Turn on visual pouring stream meshes directly into the funnel paper cone
                if (hasWater) {
                    this.streamMesh.material.color.setHex(0x0284c7);
                    this.streamMesh.position.set(streamX, streamY, fPos.z);
                    this.streamMesh.visible = true;
                }
                if (hasSolids) {
                    const solidIng = beakerObj.ingredients.find(i => i.type && i.type.startsWith('solid'));
                    const solidColor = solidIng ? solidIng.color : 0xc28e5c;
                    this.grainStream.material.color.setHex(solidColor);
                    this.grainStream.position.set(streamX, streamY + 0.08, fPos.z);
                    this.grainStream.visible = true;
                }

                const animateTilt = (t) => {
                    const p = Math.min((t - tiltStart) / tiltDuration, 1);
                    beakerGroup.rotation.z = p * (Math.PI / 2.4);

                    // Smoothly deplete water/oil/solids inside beaker while pouring
                    if (beakerObj.waterMesh && beakerObj.waterMesh.visible) {
                        beakerObj.waterMesh.scale.y = Math.max(0.01, (1 - p) * 1.0);
                    }
                    if (beakerObj.oilMesh && beakerObj.oilMesh.visible) {
                        beakerObj.oilMesh.scale.y = Math.max(0.01, (1 - p) * 1.0);
                    }

                    beakerGroup.children.forEach(c => {
                        if (c.name && c.name.startsWith('particles_')) {
                            c.scale.set(1 - p, 1 - p, 1 - p);
                        }
                    });

                    if (p < 1) {
                        requestAnimationFrame(animateTilt);
                    } else {
                        setTimeout(() => {
                            this.streamMesh.visible = false;
                            this.grainStream.visible = false;
                            beakerGroup.rotation.z = 0;
                            beakerGroup.position.copy(origPos);

                            beakerGroup.children.forEach(c => {
                                if (c.name && c.name.startsWith('particles_')) {
                                    c.scale.set(1, 1, 1);
                                }
                            });

                            this.isPouring = false;
                            if (onComplete) onComplete();
                        }, 500);
                    }
                };
                requestAnimationFrame(animateTilt);
            }
        };
        requestAnimationFrame(animateMove);
    }

    tiltAndPour(bottleGroup, matData, beakerGroup, homePos, targetBeaker, onComplete) {
        const tiltStart = performance.now();
        const tiltDuration = 350;
        const isGranular = matData.type.startsWith('solid');

        // Dynamically compute exact spout and stream 3D coordinates based on target beaker's current position
        const currentBeakerPos = beakerGroup.position.clone();
        const spoutX = currentBeakerPos.x + 0.05;
        const streamY = currentBeakerPos.y + 0.36;
        const streamZ = currentBeakerPos.z;

        if (isGranular) {
            this.grainStream.material.color.setHex(matData.particleColor || matData.color);
            this.grainStream.position.set(spoutX, streamY + 0.08, streamZ);
            this.grainStream.visible = true;
            this.streamMesh.visible = false;
        } else {
            this.streamMesh.material.color.setHex(matData.particleColor || matData.color);
            this.streamMesh.position.set(spoutX, streamY, streamZ);
            this.streamMesh.visible = true;
            this.grainStream.visible = false;
        }

        // Add ingredient to live target beaker
        if (targetBeaker && targetBeaker.addIngredient) {
            targetBeaker.addIngredient(matData);
        } else if (this.beaker3D && this.beaker3D.addIngredient) {
            this.beaker3D.addIngredient(matData);
        }

        const animateTilt = (now) => {
            const elapsed = now - tiltStart;
            const progress = Math.min(elapsed / tiltDuration, 1);

            bottleGroup.rotation.z = progress * (Math.PI / 2.6);

            if (progress < 1) {
                requestAnimationFrame(animateTilt);
            } else {
                setTimeout(() => {
                    this.returnBottle(bottleGroup, homePos, onComplete);
                }, 500);
            }
        };
        requestAnimationFrame(animateTilt);
    }

    returnBottle(bottleGroup, homePos, onComplete) {
        this.streamMesh.visible = false;
        this.grainStream.visible = false;
        const returnStart = performance.now();
        const returnDuration = 450;
        const startPos = bottleGroup.position.clone();
        const startRot = bottleGroup.rotation.z;

        const animateReturn = (now) => {
            const elapsed = now - returnStart;
            const progress = Math.min(elapsed / returnDuration, 1);
            const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

            bottleGroup.position.lerpVectors(startPos, homePos, ease);
            bottleGroup.rotation.z = startRot * (1 - ease);

            if (progress < 1) {
                requestAnimationFrame(animateReturn);
            } else {
                bottleGroup.position.copy(homePos);
                bottleGroup.rotation.set(0, 0, 0);
                this.isPouring = false;
                if (onComplete) onComplete();
            }
        };
        requestAnimationFrame(animateReturn);
    }
}
