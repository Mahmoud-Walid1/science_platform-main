/**
 * interactionEngine.js
 * Clean Architecture - Raycaster Hover Highlighting, Glassmorphic 3D Tooltips & Snap Drag Engine.
 */

export class InteractionEngine {
    constructor(camera, domContainer, tooltipId) {
        this.camera = camera;
        this.container = domContainer;
        this.tooltip = document.getElementById(tooltipId);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.interactiveObjects = [];
        this.hoveredObject = null;

        this.initHoverListeners();
    }

    registerInteractiveObject(mesh, name, description) {
        mesh.userData = { name, description };
        this.interactiveObjects.push(mesh);
    }

    initHoverListeners() {
        if (!this.container) return;

        const getMousePos = (e) => {
            const rect = this.container.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        };

        this.container.addEventListener('mousemove', (e) => {
            getMousePos(e);
            this.updateHover(e);
        });

        this.container.addEventListener('mouseleave', () => {
            this.clearHover();
        });
    }

    updateHover(event) {
        if (this.interactiveObjects.length === 0) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

        if (intersects.length > 0) {
            let hitObj = intersects[0].object;
            // Traverse up to find userData if nested inside a group
            while (hitObj && !hitObj.userData.name && hitObj.parent) {
                hitObj = hitObj.parent;
            }

            if (hitObj && hitObj.userData && hitObj.userData.name) {
                if (this.hoveredObject !== hitObj) {
                    this.clearHover();
                    this.hoveredObject = hitObj;
                    this.showTooltip(event, hitObj.userData.name, hitObj.userData.description);
                } else {
                    this.positionTooltip(event);
                }
                this.container.style.cursor = 'pointer';
                return;
            }
        }

        this.clearHover();
    }

    clearHover() {
        this.hoveredObject = null;
        if (this.tooltip) {
            this.tooltip.classList.remove('visible');
        }
        if (this.container) {
            this.container.style.cursor = 'default';
        }
    }

    showTooltip(event, title, desc) {
        if (!this.tooltip) return;
        this.tooltip.innerHTML = `
            <div class="tooltip-badge-title">${title}</div>
            <div class="tooltip-badge-desc">${desc}</div>
        `;
        this.positionTooltip(event);
        this.tooltip.classList.add('visible');
    }

    positionTooltip(event) {
        if (!this.tooltip) return;
        const x = event.clientX;
        const y = event.clientY;
        this.tooltip.style.left = `${x + 16}px`;
        this.tooltip.style.top = `${y - 12}px`;
    }
}
