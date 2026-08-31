// js/experiments/photosynthesis_factors/leafDiskEngine.js
import { soundManager } from './soundManager.js';

export class LeafDiskEngine {
    constructor(chartManager) {
        this.chartManager = chartManager;
        this.canvas = null;
        this.ctx = null;

        // Experiment State
        this.lightIntensity = 80; // 0 to 100%
        this.lightColor = 'white'; // white, blue, red, green
        this.co2Conc = 0.5; // 0.0 to 1.0%
        this.simSpeed = 1; // 1, 5, 10

        this.isRunning = false;
        this.elapsedTimeSec = 0;
        this.timerInterval = null;

        this.disks = [];
        this.et50Time = null;
        this.animFrameId = null;

        this.wavelengthEfficiencies = {
            yellow: 0.85, // 580nm
            white: 0.90,
            blue: 1.00,  // 450nm
            red: 0.95,   // 660nm
            green: 0.15  // 530nm (reflected)
        };
    }

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.resetDisks();
        this.startRenderLoop();
    }

    resetDisks() {
        this.disks = [];
        const beakerBottomY = 400;
        const startX = 260;

        for (let i = 0; i < 10; i++) {
            this.disks.push({
                id: i,
                x: startX + (i % 5) * 60 + (Math.random() * 10 - 5),
                y: beakerBottomY + Math.floor(i / 5) * 18,
                targetY: 180 + (Math.random() * 15),
                isFloating: false,
                buoyancy: 0,
                threshold: 100 + Math.random() * 40,
                bubbles: []
            });
        }

        this.elapsedTimeSec = 0;
        this.et50Time = null;
        this.updateTimerDisplay();
        this.updateMetricsUI();
    }

    setParams({ lightIntensity, lightColor, co2Conc, speed }) {
        if (lightIntensity !== undefined) this.lightIntensity = lightIntensity;
        if (lightColor !== undefined) this.lightColor = lightColor;
        if (co2Conc !== undefined) this.co2Conc = co2Conc;
        if (speed !== undefined) this.simSpeed = speed;

        const canvasCard = document.querySelector('#viewLeaf .canvas-card');
        if (canvasCard) {
            if (this.lightIntensity >= 80) {
                canvasCard.classList.add('high-light');
            } else {
                canvasCard.classList.remove('high-light');
            }
        }
    }

    startTimer() {
        if (this.isRunning) return;
        this.isRunning = true;
        soundManager.playClick();

        this.timerInterval = setInterval(() => {
            this.stepSimulation();
        }, 1000 / this.simSpeed);
    }

    pauseTimer() {
        this.isRunning = false;
        if (this.timerInterval) clearInterval(this.timerInterval);
        soundManager.playClick();
    }

    resetSimulation() {
        this.pauseTimer();
        this.resetDisks();
        if (this.chartManager) this.chartManager.resetLeafChart();
    }

    stepSimulation() {
        if (!this.isRunning) return;
        this.elapsedTimeSec++;

        const waveEff = this.wavelengthEfficiencies[this.lightColor] || 0.9;
        const rateFactor = (this.lightIntensity / 100) * (this.co2Conc) * waveEff;

        let currentFloatingCount = 0;

        this.disks.forEach(disk => {
            if (!disk.isFloating) {
                disk.buoyancy += rateFactor * (8 + Math.random() * 4);

                // Form micro O2 bubbles
                if (disk.buoyancy > 20 && Math.random() < 0.4) {
                    disk.bubbles.push({
                        r: 2 + Math.random() * 2,
                        ox: (Math.random() - 0.5) * 16,
                        oy: (Math.random() - 0.5) * 8
                    });
                }

                if (disk.buoyancy >= disk.threshold) {
                    disk.isFloating = true;
                    soundManager.playBubble();
                }
            } else {
                currentFloatingCount++;
            }
        });

        // Record ET50 when 5th disk floats
        if (currentFloatingCount >= 5 && this.et50Time === null) {
            this.et50Time = this.elapsedTimeSec;
            soundManager.playSuccess();
        }

        this.updateTimerDisplay();
        this.updateMetricsUI();

        if (this.chartManager) {
            this.chartManager.updateLeafChart(this.elapsedTimeSec, currentFloatingCount);
        }

        if (currentFloatingCount === 10) {
            this.pauseTimer();
        }
    }

    updateTimerDisplay() {
        const badge = document.getElementById('leafTimerBadge');
        if (!badge) return;
        const mins = String(Math.floor(this.elapsedTimeSec / 60)).padStart(2, '0');
        const secs = String(this.elapsedTimeSec % 60).padStart(2, '0');
        badge.innerText = `${mins}:${secs}`;
    }

    updateMetricsUI() {
        const floatingCount = this.disks.filter(d => d.isFloating).length;
        const countEl = document.getElementById('metricFloatingCount');
        const et50El = document.getElementById('metricET50');
        const rateEl = document.getElementById('metricLeafRate');

        if (countEl) countEl.innerText = `${floatingCount} / 10`;
        if (et50El) et50El.innerText = this.et50Time !== null ? `${this.et50Time} ثانية` : '---';
        if (rateEl) {
            rateEl.innerText = this.et50Time !== null ? `${(1 / this.et50Time).toFixed(4)} s⁻¹` : '---';
        }
    }

    startRenderLoop() {
        const render = () => {
            this.drawScene();
            this.animFrameId = requestAnimationFrame(render);
        };
        render();
    }

    drawScene() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // 1. Draw Overhead Lamp Beam
        const beamGrd = ctx.createLinearGradient(0, 0, 0, h);
        const colorMap = {
            yellow: 'rgba(253, 224, 71, ',
            white: 'rgba(253, 224, 71, ',
            blue: 'rgba(59, 130, 246, ',
            red: 'rgba(239, 68, 68, ',
            green: 'rgba(34, 197, 94, '
        };
        const alpha = (this.lightIntensity / 100) * 0.25;
        const prefix = colorMap[this.lightColor] || colorMap.white;

        beamGrd.addColorStop(0, prefix + (alpha * 1.5) + ')');
        beamGrd.addColorStop(1, prefix + '0.01)');

        ctx.fillStyle = beamGrd;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 120, 0);
        ctx.lineTo(w / 2 + 120, 0);
        ctx.lineTo(w / 2 + 260, h);
        ctx.lineTo(w / 2 - 260, h);
        ctx.closePath();
        ctx.fill();

        // 2. Draw Beaker Liquid Container
        const beakerX = 220;
        const beakerY = 160;
        const beakerW = 360;
        const beakerH = 280;

        // Liquid Gradient
        const liqGrd = ctx.createLinearGradient(0, beakerY, 0, beakerY + beakerH);
        liqGrd.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        liqGrd.addColorStop(1, 'rgba(14, 116, 144, 0.55)');

        ctx.fillStyle = liqGrd;
        ctx.beginPath();
        ctx.roundRect(beakerX, beakerY, beakerW, beakerH, [0, 0, 30, 30]);
        ctx.fill();

        // Glass Outline
        ctx.strokeStyle = 'rgba(0, 40, 85, 0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(beakerX, beakerY - 10, beakerW, beakerH + 10);

        // Water Surface Ripple Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(beakerX, beakerY + 15);
        ctx.lineTo(beakerX + beakerW, beakerY + 15);
        ctx.stroke();

        // 3. Draw Disks and Micro O2 Bubbles
        this.disks.forEach(disk => {
            if (disk.isFloating && disk.y > disk.targetY) {
                disk.y -= 1.5; // Fluid drag animation to surface
            }

            // Draw Disk (Green Spinach Circle)
            ctx.fillStyle = '#15803d';
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(disk.x, disk.y, 22, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw O2 bubbles attached to disk
            disk.bubbles.forEach(b => {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(disk.x + b.ox, disk.y + b.oy, b.r, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }
}
