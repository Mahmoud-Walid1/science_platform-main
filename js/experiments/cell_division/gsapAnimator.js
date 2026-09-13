/**
 * gsapAnimator.js
 * Clean Architecture - Synchronized Vertical Dropper Motion & Stain Drop Fall using GSAP 3 Timelines.
 */

export class GSAPAnimator {
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;
    }

    animateCameraTo(targetPos, lookAtPos, duration = 1.4, onComplete = null) {
        if (typeof gsap === 'undefined') {
            this.camera.position.set(targetPos.x, targetPos.y, targetPos.z);
            if (this.controls) this.controls.target.set(lookAtPos.x, lookAtPos.y, lookAtPos.z);
            if (onComplete) onComplete();
            return;
        }

        gsap.to(this.camera.position, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: duration,
            ease: "power2.inOut",
            onUpdate: () => {
                if (this.controls) {
                    this.controls.target.set(lookAtPos.x, lookAtPos.y, lookAtPos.z);
                    this.controls.update();
                }
            },
            onComplete: () => {
                if (onComplete) onComplete();
            }
        });
    }

    animateSlideMovement(slideGroup, startPos, targetPos, duration = 1.6, onComplete = null) {
        if (typeof gsap === 'undefined') {
            slideGroup.position.set(targetPos.x, targetPos.y, targetPos.z);
            if (onComplete) onComplete();
            return;
        }

        gsap.fromTo(slideGroup.position, 
            { x: startPos.x, y: startPos.y, z: startPos.z },
            {
                x: targetPos.x,
                y: targetPos.y,
                z: targetPos.z,
                duration: duration,
                ease: "power2.out",
                onComplete: () => {
                    if (onComplete) onComplete();
                }
            }
        );
    }

    animateVerticalDropperSequence(pipetteGroup, homePos, targetOverSlidePos, dropMesh, specimenMesh, onDropComplete = null) {
        if (typeof gsap === 'undefined') {
            dropMesh.position.y = 0.02;
            dropMesh.material.opacity = 0.95;
            specimenMesh.material.opacity = 0.9;
            if (onDropComplete) onDropComplete();
            return;
        }

        const tl = gsap.timeline();

        // 1. Lift Pipette Vertical & Glide Over Slide
        tl.to(pipetteGroup.position, {
            x: targetOverSlidePos.x,
            y: targetOverSlidePos.y + 0.35,
            z: targetOverSlidePos.z,
            duration: 0.8,
            ease: "power2.out"
        })
        // 2. Form & Fall Drop straight down from Pipette Tip (Y = 0.5 -> 0.02)
        .call(() => {
            dropMesh.material.opacity = 0.95;
            specimenMesh.material.opacity = 0.9;
            dropMesh.position.set(0, 0.45, 0); // At tip of pipette
        })
        .to(dropMesh.position, {
            y: 0.02,
            duration: 0.7,
            ease: "bounce.out"
        })
        // 3. Pipette returns vertical back to bottle
        .to(pipetteGroup.position, {
            x: homePos.x,
            y: homePos.y,
            z: homePos.z,
            duration: 0.8,
            delay: 0.2,
            ease: "power2.inOut",
            onComplete: () => {
                if (onDropComplete) onDropComplete();
            }
        });
    }

    animateCoverSlipDrop(coverMesh, duration = 0.8, onComplete = null) {
        if (typeof gsap === 'undefined') {
            coverMesh.position.y = 0.028;
            coverMesh.material.opacity = 0.7;
            if (onComplete) onComplete();
            return;
        }

        coverMesh.material.opacity = 0.7;
        gsap.to(coverMesh.position, {
            y: 0.028,
            duration: duration,
            ease: "power2.out",
            onComplete: () => {
                if (onComplete) onComplete();
            }
        });
    }
}
