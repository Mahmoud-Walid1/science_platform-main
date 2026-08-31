// js/experiments/photosynthesis_factors/indicatorEngine.js
import { soundManager } from './soundManager.js';

export class IndicatorEngine {
    constructor(chartManager) {
        this.chartManager = chartManager;

        this.lightLux = 600; // 0 to 1000 Lux
        this.temperatureC = 25; // 5 to 45 °C
        this.elapsedMinutes = 0; // 0 to 120 min

        this.selectedTubeId = 2; // Default selected tube for spectrophotometer
        this.isPlaying = false;
        this.playInterval = null;

        this.tubes = [
            { id: 1, name: "أنبوب 1: ضابطة", hasPlant: false, hasSnail: false, isFoil: false },
            { id: 2, name: "أنبوب 2: نبات + ضوء", hasPlant: true, hasSnail: false, isFoil: false },
            { id: 3, name: "أنبوب 3: نبات + ظلام", hasPlant: true, hasSnail: false, isFoil: true },
            { id: 4, name: "أنبوب 4: نبات + حلزون", hasPlant: true, hasSnail: true, isFoil: false }
        ];

        this.initDOM();
    }

    initDOM() {
        const container = document.getElementById('tubesRack');
        if (!container) return;

        container.innerHTML = '';

        this.tubes.forEach(tube => {
            const card = document.createElement('div');
            card.className = `tube-card ${this.selectedTubeId === tube.id ? 'active' : ''}`;
            card.id = `tubeCard-${tube.id}`;
            card.addEventListener('click', () => this.selectTube(tube.id));

            card.innerHTML = `
                <div class="glass-tube">
                    ${tube.id === 2 ? `
                        <div class="tube-top-lamp-fixture">
                            <div class="lamp-shade-hood"></div>
                            <div class="lamp-bulb-glow"></div>
                        </div>
                        <div class="tube-light-cone"></div>
                    ` : ''}
                    <div class="tube-liquid" id="tubeLiquid-${tube.id}"></div>
                    <div class="tube-bubble-container" id="tubeBubbles-${tube.id}"></div>
                    ${tube.isFoil ? '<div class="foil-wrap"></div>' : ''}
                    <div class="tube-contents">
                        ${tube.hasPlant ? '<i class="fas fa-leaf" style="color: #22c55e; font-size: 2.0rem; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.25));"></i>' : ''}
                        ${tube.hasSnail ? '<span style="font-size: 1.8rem; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.25));">🐌</span>' : ''}
                    </div>
                </div>
                <div class="tube-label-badge">${tube.name}</div>
                <div class="tube-live-metrics" id="tubeMetrics-${tube.id}">
                    <div class="m-row">
                        <span class="m-title">الأس الهيدروجيني:</span>
                        <strong id="tubePH-${tube.id}">8.40</strong>
                    </div>
                    <div class="m-row">
                        <span class="m-title">تركيز CO₂:</span>
                        <strong id="tubeCO2-${tube.id}">450 ppm</strong>
                    </div>
                    <div class="m-row">
                        <span class="m-title">الكثافة OD:</span>
                        <strong id="tubeOD-${tube.id}">0.555</strong>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        this.updateKinetics();
    }

    setParams({ lightLux, tempC, elapsedMin }) {
        if (lightLux !== undefined) this.lightLux = lightLux;
        if (tempC !== undefined) this.temperatureC = tempC;
        if (elapsedMin !== undefined) this.elapsedMinutes = elapsedMin;
        this.updateKinetics();
        this.updateThermalAndLightEffects();
    }

    updateThermalAndLightEffects() {
        const valTemp = document.getElementById('valIndTemp');
        const valLight = document.getElementById('valIndLight');
        const canvasCard = document.querySelector('#viewIndicator .canvas-card');

        if (valTemp) {
            valTemp.innerText = `${this.temperatureC}°C`;
        }

        if (valLight) {
            valLight.innerText = `${this.lightLux} Lux`;
        }

        if (canvasCard) {
            if (this.lightLux >= 600) {
                canvasCard.classList.add('high-light');
            } else {
                canvasCard.classList.remove('high-light');
            }
        }
    }

    startAutoPlay(onFinish) {
        if (this.isPlaying) return;
        this.isPlaying = true;

        if (this.elapsedMinutes >= 120) {
            this.elapsedMinutes = 0;
        }

        soundManager.playBeep(800, 0.1);

        this.playInterval = setInterval(() => {
            this.elapsedMinutes += 2;

            // Sync Slider UI
            const rangeTime = document.getElementById('rangeIndTime');
            const valTime = document.getElementById('valIndTime');
            if (rangeTime) rangeTime.value = this.elapsedMinutes;
            if (valTime) valTime.innerText = `${this.elapsedMinutes} دقيقة`;

            // Spawn animated rising bubbles in active tubes
            if (Math.random() < 0.6) {
                this.spawnBubbleInTube(2);
                this.spawnBubbleInTube(3);
                this.spawnBubbleInTube(4);
            }

            this.updateKinetics();

            if (this.elapsedMinutes >= 120) {
                this.stopAutoPlay();
                if (onFinish) onFinish();
            }
        }, 80);
    }

    stopAutoPlay() {
        this.isPlaying = false;
        if (this.playInterval) clearInterval(this.playInterval);
    }

    spawnBubbleInTube(tubeId) {
        const bubbleContainer = document.getElementById(`tubeBubbles-${tubeId}`);
        if (!bubbleContainer) return;

        const b = document.createElement('div');
        b.className = 'tube-micro-bubble';
        const left = 20 + Math.random() * 60;
        b.style.left = `${left}%`;
        b.style.bottom = '10%';

        bubbleContainer.appendChild(b);
        setTimeout(() => b.remove(), 1200);
    }

    selectTube(tubeId) {
        this.selectedTubeId = tubeId;
        soundManager.playClick();

        document.querySelectorAll('.tube-card').forEach(el => el.classList.remove('active'));
        const activeCard = document.getElementById(`tubeCard-${tubeId}`);
        if (activeCard) activeCard.classList.add('active');

        this.updateSpectroPanel();
    }

    calculateTubeState(tube, timeMin) {
        // Base CO2 = 450 ppm (Equilibrium pH 8.4)
        let co2Ppm = 450;

        if (tube.hasPlant) {
            // Temperature factor: Q10 = 2.0 with denaturation above 40°C
            const tempFactor = Math.pow(2.0, (this.temperatureC - 25) / 10) *
                               (this.temperatureC > 40 ? Math.exp(-Math.pow(this.temperatureC - 40, 2) / 15) : 1.0);

            const photoRate = tube.isFoil ? 0 : (this.lightLux / 1000) * 5.0 * tempFactor;
            const plantRespRate = 1.2 * tempFactor;
            const snailRespRate = tube.hasSnail ? 3.5 * tempFactor : 0;

            const netCo2Rate = (plantRespRate + snailRespRate) - photoRate;
            co2Ppm = Math.max(80, Math.min(950, 450 + netCo2Rate * (timeMin / 10)));
        }

        // Map CO2 ppm to pH
        // 450 ppm -> pH 8.4 (Orange/Red)
        // 900 ppm -> pH 7.6 (Yellow)
        // 100 ppm -> pH 9.2 (Purple)
        const ph = Math.max(7.2, Math.min(9.4, 8.4 - ((co2Ppm - 450) / 450) * 0.8));
        const colorHex = this.getColorForPH(ph);
        const od = (0.2 + (co2Ppm / 950) * 0.75).toFixed(3);

        return { co2Ppm: Math.round(co2Ppm), ph: ph.toFixed(2), colorHex, od };
    }

    getColorForPH(ph) {
        // Smooth Color Interpolation: Yellow (<=7.6) -> Red/Orange (8.4) -> Purple (>=9.2)
        if (ph <= 7.6) {
            return '#eab308'; // Yellow (High CO2)
        } else if (ph >= 9.2) {
            return '#8b5cf6'; // Purple (Low CO2)
        } else if (ph < 8.4) {
            const factor = (ph - 7.6) / (8.4 - 7.6);
            return this.interpolateColor('#eab308', '#ef4444', factor);
        } else {
            const factor = (ph - 8.4) / (9.2 - 8.4);
            return this.interpolateColor('#ef4444', '#8b5cf6', factor);
        }
    }

    interpolateColor(color1, color2, factor) {
        const c1 = parseInt(color1.slice(1), 16);
        const c2 = parseInt(color2.slice(1), 16);

        const r1 = (c1 >> 16) & 255, g1 = (c1 >> 8) & 255, b1 = c1 & 255;
        const r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255;

        const r = Math.round(r1 + factor * (r2 - r1));
        const g = Math.round(g1 + factor * (g2 - g1));
        const b = Math.round(b1 + factor * (b2 - b1));

        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    updateKinetics() {
        const chartData = [];

        this.tubes.forEach(tube => {
            const history = [];
            for (let t = 0; t <= 120; t += 15) {
                const stateAtT = this.calculateTubeState(tube, t);
                history.push(stateAtT.co2Ppm);
            }
            chartData.push({ id: tube.id, co2History: history });

            // Update liquid color in tube DOM
            const stateCurrent = this.calculateTubeState(tube, this.elapsedMinutes);
            const liquidEl = document.getElementById(`tubeLiquid-${tube.id}`);
            if (liquidEl) {
                liquidEl.style.backgroundColor = stateCurrent.colorHex;
            }

            // Update live metrics card directly under each tube
            const phEl = document.getElementById(`tubePH-${tube.id}`);
            const co2El = document.getElementById(`tubeCO2-${tube.id}`);
            const odEl = document.getElementById(`tubeOD-${tube.id}`);

            if (phEl) phEl.innerText = stateCurrent.ph;
            if (co2El) co2El.innerText = `${stateCurrent.co2Ppm} ppm`;
            if (odEl) odEl.innerText = stateCurrent.od;
        });

        if (this.chartManager) {
            this.chartManager.updateIndicatorChartData(chartData);
        }

        this.updateSpectroPanel();
    }

    updateSpectroPanel() {
        const tube = this.tubes.find(t => t.id === this.selectedTubeId);
        if (!tube) return;

        const state = this.calculateTubeState(tube, this.elapsedMinutes);

        const nameEl = document.getElementById('specTubeName');
        const phEl = document.getElementById('specPH');
        const co2El = document.getElementById('specCO2');
        const odEl = document.getElementById('specOD');

        if (nameEl) nameEl.innerText = tube.name;
        if (phEl) phEl.innerText = state.ph;
        if (co2El) co2El.innerText = `${state.co2Ppm} ppm`;
        if (odEl) odEl.innerText = state.od;
    }
}
