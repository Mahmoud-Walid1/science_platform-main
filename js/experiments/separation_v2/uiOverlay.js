import * as THREE from 'three';

export class UIOverlay {
    constructor(beaker3D, materialsShelf, tools3D, sceneManager) {
        this.beaker3D = beaker3D;
        this.materialsShelf = materialsShelf;
        this.tools3D = tools3D;
        this.sceneManager = sceneManager;

        this.mixTitle = document.getElementById('mixTitle');
        this.mixDescription = document.getElementById('mixDescription');
        this.presetContainer = document.getElementById('presetMixturesList');
        this.btnReset = document.getElementById('btnReset');
        this.btnZoomIn = document.getElementById('btnZoomIn');
        this.btnZoomOut = document.getElementById('btnZoomOut');
        this.btnResetCamera = document.getElementById('btnResetCamera');
        this.hoverTooltip = document.getElementById('hoverTooltip');
        this.cleanMagnetBtn = document.getElementById('cleanMagnetBtn');

        this.stepBadge = document.getElementById('stepBadge');
        this.stepText = document.getElementById('stepText');

        this.toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
        this.closeDrawerBtn = document.getElementById('closeDrawerBtn');
        this.quickMixturesDrawer = document.getElementById('quickMixturesDrawer');

        this.initPresets();
        this.initListeners();
    }

    updateStepper(stepBadgeText, stepDetailText) {
        if (this.stepBadge) this.stepBadge.textContent = stepBadgeText;
        if (this.stepText) this.stepText.textContent = stepDetailText;
    }

    showResetCameraBtn() {
        if (this.btnResetCamera) this.btnResetCamera.classList.add('visible');
    }

    hideResetCameraBtn() {
        if (this.btnResetCamera) this.btnResetCamera.classList.remove('visible');
    }

    showHoverTooltip(x, y, text) {
        if (!this.hoverTooltip) return;
        this.hoverTooltip.textContent = text;
        this.hoverTooltip.style.left = `${x}px`;
        this.hoverTooltip.style.top = `${y}px`;
        this.hoverTooltip.classList.add('visible');
    }

    hideHoverTooltip() {
        if (!this.hoverTooltip) return;
        this.hoverTooltip.classList.remove('visible');
    }

    showCleanMagnetButton(onClean) {
        if (!this.cleanMagnetBtn) return;
        this.cleanMagnetBtn.classList.add('visible');
        this.cleanMagnetBtn.onclick = () => {
            if (onClean) onClean();
            this.cleanMagnetBtn.classList.remove('visible');
        };
    }

    hideCleanMagnetButton() {
        if (!this.cleanMagnetBtn) return;
        this.cleanMagnetBtn.classList.remove('visible');
    }

    showToast(message, type = 'info') {
        if (this.mixDescription) {
            this.mixDescription.textContent = message;
        }
    }

    updateMixtureStatus() {
        const ingredients = this.beaker3D.ingredients;

        if (ingredients.length === 0) {
            this.updateStepper('المرحلة 1', 'تجهيز المخلوط: قم بسكب مادتين في الكأس لتركيب المخلوط');
        } else if (ingredients.length === 1) {
            this.updateStepper('المرحلة 1', `تجهيز المخلوط: تم إضافة (${ingredients[0].name})، قم بإضافة المادة الثانية`);
        } else {
            const names = ingredients.map(i => i.name).join(' + ');
            this.updateStepper('المرحلة 1 تمت ✓', `تم تجهيز المخلوط: (${names})! انتقل للمرحلة 2 واختبر أداة الفصل المناسبة`);
        }
    }

    initPresets() {
        if (!this.presetContainer) return;
        const presets = [
            { name: 'رمل وماء', items: ['sand', 'water'], type: 'غير متجانس' },
            { name: 'ملح وماء', items: ['salt', 'water'], type: 'متجانس' },
            { name: 'برادة حديد ورمل', items: ['iron', 'sand'], type: 'غير متجانس' },
            { name: 'حصى ورمل', items: ['pebbles', 'sand'], type: 'غير متجانس' },
            { name: 'زيت وماء', items: ['oil', 'water'], type: 'غير متجانس' }
        ];

        this.presetContainer.innerHTML = '';
        presets.forEach(p => {
            const card = document.createElement('div');
            card.className = 'mixture-card';
            card.innerHTML = `
                <div class="mixture-info">
                    <span class="mixture-name">${p.name}</span>
                    <span class="mixture-type">${p.type}</span>
                </div>
                <i class="fas fa-chevron-left" style="color:#004e66;"></i>
            `;
            card.addEventListener('click', () => {
                this.beaker3D.resetBeaker();
                this.hideCleanMagnetButton();
                const RAW_MATERIALS = {
                    sand: { id: 'sand', name: 'رمل', color: 0xc28e5c, particleColor: 0xc28e5c, type: 'solid_granular' },
                    salt: { id: 'salt', name: 'ملح', color: 0xf8fafc, particleColor: 0xe2e8f0, type: 'solid_soluble' },
                    iron: { id: 'iron', name: 'برادة حديد', color: 0x1e293b, particleColor: 0x1e293b, type: 'solid_magnetic' },
                    pebbles: { id: 'pebbles', name: 'حصى', color: 0x64748b, particleColor: 0x475569, type: 'solid_coarse' },
                    oil: { id: 'oil', name: 'زيت', color: 0xeab308, particleColor: 0xfacc15, type: 'liquid_immiscible' },
                    water: { id: 'water', name: 'ماء', color: 0x0284c7, particleColor: 0x38bdf8, type: 'liquid_water' }
                };
                p.items.forEach(id => this.beaker3D.addIngredient(RAW_MATERIALS[id]));
                this.updateMixtureStatus();

                if (this.quickMixturesDrawer) {
                    this.quickMixturesDrawer.classList.remove('active');
                    this.quickMixturesDrawer.classList.remove('open');
                }
            });
            this.presetContainer.appendChild(card);
        });
    }

    highlightResetButton() {
        if (this.btnReset) {
            this.btnReset.classList.add('pulse-glow');
        }
    }

    unhighlightResetButton() {
        if (this.btnReset) {
            this.btnReset.classList.remove('pulse-glow');
        }
    }

    initListeners() {
        if (this.btnReset) {
            this.btnReset.addEventListener('click', () => {
                this.unhighlightResetButton();

                // 1. Reset Beakers
                this.beaker3D.resetBeaker();

                // 2. Reset Material Bottles & Shelf
                this.materialsShelf.resetAllPositions();
                this.tools3D.resetAllPositions();

                this.hideCleanMagnetButton();
                this.hideResetCameraBtn();

                // 3. Reset Stepper Banner Text to Initial State
                this.updateStepper('المرحلة 1', 'تجهيز المخلوط: قم بإضافة مادتين في الكأس لتركيب المخلوط');

                // 4. Comprehensive Scene Equipment & Tool State Reset
                if (this.sceneManager) {
                    this.sceneManager.resetCameraView();
                    const toRemove = [];

                    this.sceneManager.scene.traverse((obj) => {
                        if (obj.name && (obj.name.startsWith('liquidPuddle') || obj.name.startsWith('extractedPaperGroup'))) {
                            toRemove.push(obj);
                        }

                        // Reset Filter Funnel
                        if (obj.name === 'tool_filter') {
                            obj.userData.hasFilterPaper = false;
                            obj.userData.trappedSolidType = null;
                            obj.userData.trappedSolidName = null;
                            obj.userData.trappedSolidColor = null;

                            const paper = obj.getObjectByName('filterPaper');
                            const residue = obj.getObjectByName('sandResidue');
                            const stream = obj.getObjectByName('filterStream');
                            if (paper) paper.visible = false;
                            if (residue) residue.visible = false;
                            if (stream) stream.visible = false;
                        }

                        // Reset Separatory Funnel
                        if (obj.name === 'tool_funnel') {
                            obj.userData.ingredients = [];
                            const fWater = obj.getObjectByName('funnelWater');
                            const fOilLower = obj.getObjectByName('funnelOilLower');
                            const fOilUpper = obj.getObjectByName('funnelOilUpper');
                            const wStream = obj.getObjectByName('drainingStream');
                            const oStream = obj.getObjectByName('drainingOilStream');
                            const valve = obj.getObjectByName('funnelValveKey');

                            if (fWater) fWater.visible = false;
                            if (fOilLower) fOilLower.visible = false;
                            if (fOilUpper) {
                                fOilUpper.visible = false;
                                fOilUpper.position.set(0, 1.14, 0);
                            }
                            if (wStream) wStream.visible = false;
                            if (oStream) oStream.visible = false;
                            if (valve) valve.rotation.y = 0;
                        }

                        // Reset Magnet
                        if (obj.name === 'tool_magnet') {
                            obj.userData.hasAttractedIron = false;
                            obj.userData.isAttracting = false;
                            const cluster = obj.getObjectByName('magnetFilingsCluster');
                            if (cluster) obj.remove(cluster);
                        }

                        // Reset Burner
                        if (obj.name === 'tool_evaporation') {
                            const flame = obj.getObjectByName('burnerFlame');
                            if (flame) flame.visible = false;
                        }
                    });

                    toRemove.forEach(item => this.sceneManager.scene.remove(item));
                }

                this.updateMixtureStatus();
                this.showToast('تم إعادة تهيئة المختبر بالكامل وتصفير جميع الأواني والأدوات! 🧹✨', 'info');
            });
        }

        if (this.btnResetCamera) {
            this.btnResetCamera.addEventListener('click', () => {
                if (this.sceneManager) this.sceneManager.resetCameraView();
                this.hideResetCameraBtn();
            });
        }

        if (this.btnZoomIn) {
            this.btnZoomIn.addEventListener('click', () => {
                if (this.sceneManager) this.sceneManager.zoomIn();
            });
        }

        if (this.btnZoomOut) {
            this.btnZoomOut.addEventListener('click', () => {
                if (this.sceneManager) this.sceneManager.zoomOut();
            });
        }

        if (this.toggleSidebarBtn && this.quickMixturesDrawer) {
            this.toggleSidebarBtn.addEventListener('click', () => {
                this.quickMixturesDrawer.classList.toggle('active');
                this.quickMixturesDrawer.classList.toggle('open');
            });
        }

        if (this.closeDrawerBtn && this.quickMixturesDrawer) {
            this.closeDrawerBtn.addEventListener('click', () => {
                this.quickMixturesDrawer.classList.remove('active');
                this.quickMixturesDrawer.classList.remove('open');
            });
        }

        // Left Tools Drawer Toggle & Tool Placement
        const toggleLeftDrawerBtn = document.getElementById('toggleLeftDrawerBtn');
        const leftToolsDrawer = document.getElementById('leftToolsDrawer');
        const leftDrawerChevron = document.getElementById('leftDrawerChevron');

        if (toggleLeftDrawerBtn && leftToolsDrawer) {
            toggleLeftDrawerBtn.addEventListener('click', () => {
                leftToolsDrawer.classList.toggle('collapsed');
                if (leftDrawerChevron) {
                    leftDrawerChevron.classList.toggle('fa-chevron-left');
                    leftDrawerChevron.classList.toggle('fa-chevron-down');
                }
            });
        }

        const drawerCards = document.querySelectorAll('.tool-drawer-card');
        drawerCards.forEach(card => {
            card.addEventListener('click', () => {
                const toolId = card.getAttribute('data-tool');
                const toolGroup = this.sceneManager.scene.getObjectByName(`tool_${toolId}`);
                if (toolGroup) {
                    const targetPos = new THREE.Vector3(0.0, 0.0, 0.2);
                    toolGroup.position.copy(targetPos);
                    this.showToast(`تم إضافة ${toolGroup.userData.toolData.name} إلى الترابيزة الرئيسية!`, 'success');
                }
            });
        });
    }
}
