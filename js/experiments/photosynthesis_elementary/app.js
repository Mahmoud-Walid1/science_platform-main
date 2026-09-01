/**
 * app.js
 * Clean Architecture - Main 3D Orchestrator & 60 FPS Three.js Loop for Elementary Photosynthesis.
 */

import { SceneManager3D } from './sceneManager3D.js';
import { Plant3D } from './plant3D.js';
import { Particles3D } from './particles3D.js';
import { RateGauge } from './rateGauge.js';
import { ControlsUI } from './controlsUI.js';

class ElementaryPhotosynthesis3DApp {
    constructor() {
        this.sceneManager = new SceneManager3D('webglContainer');
        if (!this.sceneManager || !this.sceneManager.scene) return;

        this.plant3D = new Plant3D(this.sceneManager.scene);
        this.particles3D = new Particles3D(this.sceneManager.scene);
        this.rateGauge = new RateGauge();

        this.controls = new ControlsUI((light, co2, water, minerals) => {
            this.onControlsChange(light, co2, water, minerals);
        });

        this.rateScore = 0.5;

        this.onControlsChange(
            this.controls.lightLevel,
            this.controls.co2Level,
            this.controls.waterLevel,
            this.controls.mineralsLevel
        );
        this.startLoop();
    }

    onControlsChange(light, co2, water, minerals) {
        this.rateScore = this.rateGauge.calculate(light, co2, water, minerals);
        if (this.sceneManager) {
            if (this.sceneManager.setLightLevel) this.sceneManager.setLightLevel(light);
            if (this.sceneManager.setCO2Level) this.sceneManager.setCO2Level(co2);
            if (this.sceneManager.setWaterLevel) this.sceneManager.setWaterLevel(water);
        }
        if (this.plant3D && this.plant3D.setMineralsLevel) {
            this.plant3D.setMineralsLevel(minerals);
        }
    }

    startLoop() {
        const loop = () => {
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    render() {
        // Update Rate Gauge Bar
        this.rateGauge.update();

        // Update 3D Plant Model
        if (this.plant3D) {
            this.plant3D.update(this.rateScore);
        }

        // Update 3D Particle Systems
        if (this.particles3D) {
            this.particles3D.update(
                this.controls.lightLevel,
                this.controls.co2Level,
                this.controls.waterLevel,
                this.rateScore,
                this.sceneManager
            );
        }

        // Render 3D Scene
        if (this.sceneManager) {
            this.sceneManager.render();
        }
    }
}

// Initialize Application when DOM ready or immediately if already loaded
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        window.app = new ElementaryPhotosynthesis3DApp();
    });
} else {
    window.app = new ElementaryPhotosynthesis3DApp();
}
