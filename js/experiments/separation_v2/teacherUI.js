/**
 * Teacher Presentation UI Overlay Component
 * Single Responsibility: Generates & updates DOM panels for mixtures, controls bar, tool shelf, and physical property cards.
 */

import { labStore, MIXTURES, TOOLS } from './store.js';

export class TeacherUI {
    constructor(mechanics) {
        this.mechanics = mechanics;
        this.initContainers();
        this.renderMixtureCards();
        this.renderToolShelf();
        this.renderControlsBar();
        this.bindEvents();

        // Subscribe to store updates
        labStore.subscribe(state => this.update(state));
    }

    initContainers() {
        this.mixturesList = document.getElementById('mixturesList');
        this.toolsGrid = document.getElementById('toolsGrid');
        this.toastBanner = document.getElementById('toastBanner');
        this.conceptCard = document.getElementById('conceptCard');
        this.simControls = document.getElementById('simControls');
    }

    renderMixtureCards() {
        if (!this.mixturesList) return;
        this.mixturesList.innerHTML = '';

        Object.values(MIXTURES).forEach(mix => {
            const card = document.createElement('div');
            card.className = `mixture-card ${mix.id === labStore.getState().activeMixtureId ? 'active' : ''}`;
            card.dataset.id = mix.id;

            card.innerHTML = `
                <div class="mixture-info">
                    <div class="mixture-name">${mix.name}</div>
                    <div class="mixture-type">${mix.type}</div>
                </div>
                <span class="badge-tag ${mix.badge}">${mix.badge === 'homogeneous' ? 'متجانس' : 'غير متجانس'}</span>
            `;

            card.addEventListener('click', () => {
                labStore.setMixture(mix.id);
            });

            this.mixturesList.appendChild(card);
        });
    }

    renderToolShelf() {
        if (!this.toolsGrid) return;
        this.toolsGrid.innerHTML = '';

        TOOLS.forEach(tool => {
            const item = document.createElement('div');
            item.className = 'tool-item';
            item.draggable = true;
            item.dataset.id = tool.id;

            item.innerHTML = `
                <i class="fas ${tool.icon} tool-icon"></i>
                <div class="tool-name">${tool.name}</div>
                <div class="tool-property">يعتمد على: ${tool.property}</div>
            `;

            // Drag and drop & Click listeners
            item.addEventListener('click', () => {
                this.mechanics.applyTool(tool.id);
            });

            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', tool.id);
            });

            this.toolsGrid.appendChild(item);
        });
    }

    renderControlsBar() {
        if (!this.simControls) return;
        const state = labStore.getState();

        this.simControls.innerHTML = `
            <button type="button" class="ctrl-btn ${state.isPlaying ? 'active' : ''}" id="btnPlayPause" title="تشغيل / إيقاف مؤقت">
                <i class="fas ${state.isPlaying ? 'fa-pause' : 'fa-play'}"></i>
            </button>
            <button type="button" class="ctrl-btn" id="btnReset" title="إعادة ضبط التجربة">
                <i class="fas fa-rotate-right"></i>
            </button>
            <div class="speed-selector">
                <button type="button" class="speed-btn ${state.speed === 0.5 ? 'active' : ''}" data-speed="0.5">0.5x</button>
                <button type="button" class="speed-btn ${state.speed === 1 ? 'active' : ''}" data-speed="1">1x</button>
                <button type="button" class="speed-btn ${state.speed === 2 ? 'active' : ''}" data-speed="2">2x</button>
            </div>
            <button type="button" class="toggle-annotations-btn" id="btnToggleAnnotations">
                <i class="fas ${state.showLabels ? 'fa-eye' : 'fa-eye-slash'}"></i>
                <span>${state.showLabels ? 'إخفاء الوسوم' : 'إظهار الوسوم'}</span>
            </button>
        `;
    }

    bindEvents() {
        // Drop on canvas area
        const canvas3d = document.getElementById('canvas3d');
        if (canvas3d) {
            canvas3d.addEventListener('dragover', (e) => e.preventDefault());
            canvas3d.addEventListener('drop', (e) => {
                e.preventDefault();
                const toolId = e.dataTransfer.getData('text/plain');
                if (toolId) {
                    this.mechanics.applyTool(toolId);
                }
            });
        }
    }

    update(state) {
        // Update Mixture Cards Active Class
        const cards = this.mixturesList.querySelectorAll('.mixture-card');
        cards.forEach(card => {
            card.classList.toggle('active', card.dataset.id === state.activeMixtureId);
        });

        // Update Toast
        if (this.toastBanner) {
            this.toastBanner.className = `toast-banner ${state.toast.type}`;
            this.toastBanner.innerHTML = `
                <i class="fas ${state.toast.type === 'success' ? 'fa-circle-check' : state.toast.type === 'fail' ? 'fa-circle-xmark' : 'fa-circle-info'}"></i>
                <span>${state.toast.message}</span>
            `;
        }

        // Update Concept Card
        if (this.conceptCard) {
            const mix = MIXTURES[state.activeMixtureId];
            this.conceptCard.innerHTML = `
                <div class="concept-title"><i class="fas fa-lightbulb"></i> الخاصية الفيزيائية المستهدفة</div>
                <div class="concept-text">
                    <strong>الخاصية:</strong> ${mix.propertyName}<br>
                    <strong>الشرح العلمي:</strong> ${mix.propertyDesc}<br>
                    <strong>الأداة المناسبة:</strong> ${mix.recommendedToolName}
                </div>
            `;
        }

        // Update Play/Pause & Annotations Button Status
        const btnPlay = document.getElementById('btnPlayPause');
        if (btnPlay) {
            btnPlay.classList.toggle('active', state.isPlaying);
            btnPlay.querySelector('i').className = `fas ${state.isPlaying ? 'fa-pause' : 'fa-play'}`;
        }

        const btnAnnotations = document.getElementById('btnToggleAnnotations');
        if (btnAnnotations) {
            btnAnnotations.querySelector('span').textContent = state.showLabels ? 'إخفاء الوسوم' : 'إظهار الوسوم';
            btnAnnotations.querySelector('i').className = `fas ${state.showLabels ? 'fa-eye' : 'fa-eye-slash'}`;
        }
    }
}
