// js/experiments/photosynthesis_factors/audusEngine.js
import { soundManager } from './soundManager.js';

export class AudusEngine {
    constructor(chartManager) {
        this.chartManager = chartManager;

        this.distanceCm = 20; // 10 to 100 cm
        this.temperatureC = 25; // 5 to 50 °C
        this.co2Conc = 0.20; // 0.01 to 0.50%

        this.gasVolumeMm3 = 0.0;
        this.recordedData = [];
        this.risingBubbles = [];

        this.isRunning = false; // Paused by default until user clicks Start
        this.workspaceEl = null;
        this.animFrameId = null;
        this.isDraggingLamp = false;
    }

    init(workspaceId) {
        this.workspaceEl = document.getElementById(workspaceId);
        if (!this.workspaceEl) return;

        this.renderSVGApparatus();
        this.setupLampDragListeners();
        this.startRenderLoop();
    }

    setParams({ distanceCm, tempC, co2Conc }) {
        if (distanceCm !== undefined) this.distanceCm = distanceCm;
        if (tempC !== undefined) this.temperatureC = tempC;
        if (co2Conc !== undefined) this.co2Conc = co2Conc;

        this.updateCalculatedValues();
    }

    startTimer() {
        this.isRunning = true;
        soundManager.playClick();
    }

    pauseTimer() {
        this.isRunning = false;
        soundManager.playClick();
    }

    resetSyringe() {
        this.isRunning = false;
        this.gasVolumeMm3 = 0.0;
        this.risingBubbles = [];
        soundManager.playClick();
        this.updateApparatusVisuals();
    }

    calculateRate() {
        // 1. Light Intensity via Inverse Square Law: I = P / d^2
        const lightIntensity = 1000000 / Math.pow(this.distanceCm, 2); // Lux relative

        // 2. Blackman's Law of Limiting Factors
        const lightFactor = Math.min(1.0, lightIntensity / 2500);
        const co2Factor = Math.min(1.0, this.co2Conc / 0.35);

        // Temp Factor: Q10 = 2.0 with denaturation above 40°C
        const tempFactor = Math.pow(2.0, (this.temperatureC - 25) / 10) *
                           (this.temperatureC > 40 ? Math.exp(-Math.pow(this.temperatureC - 40, 2) / 20) : 1.0);

        const rateMm3Min = Math.min(lightFactor, co2Factor) * tempFactor * 14.5;
        return { lightIntensity: Math.round(lightIntensity), rateMm3Min: Math.max(0, rateMm3Min) };
    }

    updateCalculatedValues() {
        const { lightIntensity } = this.calculateRate();

        const distVal = document.getElementById('valAudusDist');
        const intVal = document.getElementById('valAudusIntensity');
        const tempVal = document.getElementById('valAudusTemp');
        const canvasCard = document.querySelector('#viewAudus .canvas-card');

        if (distVal) distVal.innerText = `${this.distanceCm} cm`;
        if (intVal) intVal.innerText = `${lightIntensity} Lux`;

        if (tempVal) {
            tempVal.innerText = `${this.temperatureC}°C`;
        }

        if (canvasCard) {
            if (lightIntensity >= 2000) {
                canvasCard.classList.add('high-light');
            } else {
                canvasCard.classList.remove('high-light');
            }
        }
    }

    recordDataPoint() {
        const { lightIntensity, rateMm3Min } = this.calculateRate();
        const invD2 = (1 / Math.pow(this.distanceCm, 2)).toFixed(6);

        const point = {
            id: this.recordedData.length + 1,
            distanceCm: this.distanceCm,
            invD2: parseFloat(invD2),
            tempC: this.temperatureC,
            co2Conc: this.co2Conc,
            volumeMm3: this.gasVolumeMm3.toFixed(2),
            rate: rateMm3Min.toFixed(2)
        };

        this.recordedData.push(point);
        soundManager.playSuccess();

        this.updateTableDOM();
        if (this.chartManager) {
            this.chartManager.addAudusPoint(point.invD2, parseFloat(point.rate));
        }
    }

    exportCSV() {
        if (this.recordedData.length === 0) {
            alert('لا توجد قراءات مسجلة بعد لتصديرها!');
            return;
        }

        let csv = '\uFEFF'; // UTF-8 BOM for Excel Arabic support
        csv += 'رقم القراءة,المسافة (cm),شدة الضوء (1/d²),درجة الحرارة (°C),تركيز CO2 (%),الحجم المجمع (mm³),معدل البناء الضوئي (mm³/min)\n';

        this.recordedData.forEach(row => {
            csv += `${row.id},${row.distanceCm},${row.invD2},${row.tempC},${row.co2Conc},${row.volumeMm3},${row.rate}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Audus_Photosynthesis_Data_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        soundManager.playBeep(1200, 0.15);
    }

    clearTableData() {
        if (this.recordedData.length === 0) return;
        this.recordedData = [];
        this.updateTableDOM();
        soundManager.playClick();
    }

    updateTableDOM() {
        const tbody = document.querySelector('#audusDataTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (this.recordedData.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="5">لا توجد قراءات مسجلة بعد</td></tr>';
            return;
        }

        this.recordedData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.distanceCm}</td>
                <td>${row.invD2}</td>
                <td>${row.tempC}</td>
                <td>${row.volumeMm3}</td>
                <td><strong style="color:#10b981">${row.rate}</strong></td>
            `;
            tbody.appendChild(tr);
        });
    }

    setupLampDragListeners() {
        const svg = this.workspaceEl.querySelector('svg');
        const lamp = document.getElementById('svgLampGroup');
        if (!svg || !lamp) return;

        lamp.style.cursor = 'grab';

        const handlePointerMove = (clientX) => {
            const rect = svg.getBoundingClientRect();
            // Map screen X coordinate to SVG viewBox space (0 to 800)
            const svgX = ((clientX - rect.left) / rect.width) * 800;
            // Bounded SVG X between 60px (100 cm far) and 280px (10 cm close)
            const clampedX = Math.max(60, Math.min(280, svgX));
            // Correct physical mapping: Moving right closer to beaker -> distance decrease (10 cm)
            const newDist = Math.round(100 - ((clampedX - 60) / 220) * 90);

            if (newDist !== this.distanceCm) {
                this.distanceCm = newDist;
                const slider = document.getElementById('rangeAudusDist');
                if (slider) {
                    slider.value = newDist;
                    slider.dispatchEvent(new Event('input'));
                }
                this.updateCalculatedValues();
                this.updateApparatusVisuals();
            }
        };

        lamp.addEventListener('mousedown', (e) => {
            this.isDraggingLamp = true;
            lamp.style.cursor = 'grabbing';
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDraggingLamp) {
                handlePointerMove(e.clientX);
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.isDraggingLamp) {
                this.isDraggingLamp = false;
                if (lamp) lamp.style.cursor = 'grab';
            }
        });

        // Touch input support for mobile & tablet
        lamp.addEventListener('touchstart', (e) => {
            this.isDraggingLamp = true;
            e.preventDefault();
        });

        window.addEventListener('touchmove', (e) => {
            if (this.isDraggingLamp && e.touches.length > 0) {
                handlePointerMove(e.touches[0].clientX);
            }
        });

        window.addEventListener('touchend', () => {
            this.isDraggingLamp = false;
        });
    }

    startRenderLoop() {
        let lastTime = performance.now();
        const loop = (now) => {
            const dt = Math.min(0.1, (now - lastTime) / 1000);
            lastTime = now;

            if (this.isRunning) {
                const { rateMm3Min } = this.calculateRate();
                
                // Filling speed scales linearly with scientific rateMm3Min
                const visualRate = (rateMm3Min / 14.5) * 5.0;
                this.gasVolumeMm3 = Math.min(100.0, this.gasVolumeMm3 + visualRate * dt);

                if (this.gasVolumeMm3 >= 100.0) {
                    this.isRunning = false;
                }

                // Spawn rising O2 bubbles inside the funnel proportional to rate
                const bubbleChance = Math.min(0.8, (rateMm3Min / 14.5) * 0.5);
                if (rateMm3Min > 0.05 && Math.random() < bubbleChance) {
                    this.risingBubbles.push({
                        x: 400 + (Math.random() - 0.5) * 10,
                        y: 305,
                        r: 2.5 + Math.random() * 2,
                        speed: 25 + (rateMm3Min / 14.5) * 35
                    });
                }

                // Update rising bubbles
                this.risingBubbles.forEach(b => {
                    b.y -= b.speed * dt;
                });
                this.risingBubbles = this.risingBubbles.filter(b => b.y > 215);
            }

            this.updateApparatusVisuals();
            this.animFrameId = requestAnimationFrame(loop);
        };
        this.animFrameId = requestAnimationFrame(loop);
    }

    renderSVGApparatus() {
        this.workspaceEl.innerHTML = `
            <svg width="100%" height="450" viewBox="0 0 800 450" style="background:#f8fafc; border-radius:16px;">
                <defs>
                    <linearGradient id="audusWaterGrd" x1="0" y1="0" x2="0" y2="1">
                        <stop id="waterStop1" offset="0%" stop-color="rgba(56, 189, 248, 0.25)"/>
                        <stop id="waterStop2" offset="100%" stop-color="rgba(14, 116, 144, 0.45)"/>
                    </linearGradient>
                    <linearGradient id="lampLightGrd" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="rgba(253, 224, 71, 0.45)"/>
                        <stop offset="100%" stop-color="rgba(253, 224, 71, 0.02)"/>
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                <!-- Lamp Beam Overlay -->
                <polygon id="svgLampBeam" points="130,165 400,145 400,405 130,265" fill="url(#lampLightGrd)"/>

                <!-- Water Bath Beaker -->
                <rect x="220" y="145" width="360" height="270" rx="20" fill="url(#audusWaterGrd)" stroke="#0284c7" stroke-width="3"/>
                <line x1="220" y1="165" x2="580" y2="165" stroke="rgba(2, 132, 199, 0.5)" stroke-width="2"/>
                <text x="400" y="398" fill="#002855" font-size="13" text-anchor="middle" font-weight="bold">حمام مائي بدرجة حرارة ثابتة (Water Bath)</text>

                <!-- Glass Funnel over Elodea Plant -->
                <path d="M 360 325 L 440 325 L 410 245 L 390 245 Z" fill="rgba(255,255,255,0.4)" stroke="#002855" stroke-width="2"/>

                <!-- Elodea Cut Shoot in Test Tube -->
                <rect x="370" y="205" width="60" height="160" rx="10" fill="rgba(255, 255, 255, 0.3)" stroke="#002855" stroke-width="2"/>
                <path d="M 400 355 Q 395 275 400 225" stroke="#15803d" stroke-width="7" fill="none"/>
                <!-- Leaves -->
                <ellipse cx="390" cy="315" rx="12" ry="5" fill="#22c55e" transform="rotate(-30 390 315)"/>
                <ellipse cx="410" cy="295" rx="12" ry="5" fill="#22c55e" transform="rotate(30 410 295)"/>
                <ellipse cx="390" cy="265" rx="12" ry="5" fill="#22c55e" transform="rotate(-30 390 265)"/>
                <ellipse cx="410" cy="245" rx="12" ry="5" fill="#22c55e" transform="rotate(30 410 245)"/>

                <!-- SVG Container for Rising Plant Bubbles -->
                <g id="svgPlantBubbles"></g>

                <!-- ENLARGED PROMINENT TOP LABORATORY METRICS BAR -->
                <g transform="translate(140, 15)">
                    <rect x="0" y="0" width="520" height="60" rx="16" fill="#ffffff" stroke="#0284c7" stroke-width="2.5" filter="url(#glow)"/>

                    <!-- Left Metric: Production Rate -->
                    <text x="130" y="22" fill="#475569" font-size="12" font-weight="bold" text-anchor="middle">معدل البناء الضوئي (Rate)</text>
                    <text id="svgMetricRateText" x="130" y="46" fill="#10b981" font-size="17" font-weight="900" text-anchor="middle">0.00 mm³/min</text>

                    <!-- Center Divider Line -->
                    <line x1="260" y1="12" x2="260" y2="48" stroke="#cbd5e1" stroke-width="2"/>

                    <!-- Right Metric: Total Accumulated Volume -->
                    <text x="390" y="22" fill="#475569" font-size="12" font-weight="bold" text-anchor="middle">الحجم المجمع (Volume)</text>
                    <text id="svgGasVolumeBadge" x="390" y="46" fill="#002855" font-size="17" font-weight="900" text-anchor="middle">0.00 mm³</text>
                </g>

                <!-- Capillary Tube Line from Funnel -->
                <path d="M 400 225 L 400 115 L 680 115" stroke="#002855" stroke-width="6" fill="none"/>

                <!-- Capillary Scale Box -->
                <rect x="440" y="115" width="220" height="28" fill="#ffffff" stroke="#0284c7" stroke-width="2" rx="8"/>

                <!-- Ruler Scale Ticks & Numbers (0 to 100 mm³) -->
                <line x1="450" y1="115" x2="450" y2="121" stroke="#475569" stroke-width="1.5"/>
                <line x1="490" y1="115" x2="490" y2="121" stroke="#475569" stroke-width="1.5"/>
                <line x1="530" y1="115" x2="530" y2="121" stroke="#475569" stroke-width="1.5"/>
                <line x1="570" y1="115" x2="570" y2="121" stroke="#475569" stroke-width="1.5"/>
                <line x1="610" y1="115" x2="610" y2="121" stroke="#475569" stroke-width="1.5"/>
                <line x1="650" y1="115" x2="650" y2="121" stroke="#475569" stroke-width="1.5"/>

                <text x="450" y="110" fill="#64748b" font-size="10" font-weight="bold" text-anchor="middle">0</text>
                <text x="490" y="110" fill="#64748b" font-size="10" font-weight="bold" text-anchor="middle">20</text>
                <text x="530" y="110" fill="#64748b" font-size="10" font-weight="bold" text-anchor="middle">40</text>
                <text x="570" y="110" fill="#64748b" font-size="10" font-weight="bold" text-anchor="middle">60</text>
                <text x="610" y="110" fill="#64748b" font-size="10" font-weight="bold" text-anchor="middle">80</text>
                <text x="650" y="110" fill="#64748b" font-size="10" font-weight="bold" text-anchor="middle">100</text>

                <!-- Expanding Gas Bubble Meniscus -->
                <rect id="svgGasBubble" x="445" y="121" width="0" height="16" fill="#10b981" rx="4" filter="url(#glow)"/>

                <!-- Syringe Assembly -->
                <rect x="680" y="114" width="55" height="28" rx="6" fill="#e2e8f0" stroke="#002855" stroke-width="2"/>
                <rect id="svgSyringePlunger" x="710" y="118" width="20" height="20" fill="#64748b"/>
                <line x1="735" y1="128" x2="775" y2="128" stroke="#dc2626" stroke-width="8" stroke-linecap="round"/>
                <text x="710" y="156" fill="#475569" font-size="11" font-weight="bold" text-anchor="middle">تصفير المحقنة</text>

                <!-- DRAGGABLE INTERACTIVE LAMP APPARATUS -->
                <g id="svgLampGroup" transform="translate(100, 205)" style="cursor: grab;">
                    <!-- Lamp Title Label (Raised cleanly above hood) -->
                    <text x="15" y="-52" fill="#b45309" font-size="12" text-anchor="middle" font-weight="800">مصباح كهربائي</text>

                    <!-- Lamp Shade Hood -->
                    <path d="M 0 -25 L 35 -40 L 35 40 L 0 25 Z" fill="#d97706" stroke="#78350f" stroke-width="2"/>
                    <!-- Light Bulb -->
                    <circle cx="20" cy="0" r="14" fill="#fef08a" filter="url(#glow)"/>
                    <!-- Stand -->
                    <line x1="0" y1="25" x2="0" y2="215" stroke="#475569" stroke-width="6"/>
                    <rect x="-20" y="210" width="40" height="10" fill="#1e293b" rx="3"/>
                </g>

                <!-- Distance Track Line -->
                <line x1="60" y1="415" x2="740" y2="415" stroke="#002855" stroke-width="4" stroke-linecap="round"/>
            </svg>
        `;
    }

    updateApparatusVisuals() {
        // 1. Move SVG Lamp & Beam based on distanceCm (10 cm close -> posX = 280 | 100 cm far -> posX = 60)
        const lampGroup = document.getElementById('svgLampGroup');
        const lampBeam = document.getElementById('svgLampBeam');
        if (lampGroup) {
            const posX = 60 + ((100 - this.distanceCm) / 90) * 220;
            lampGroup.setAttribute('transform', `translate(${posX}, 205)`);
            if (lampBeam) {
                lampBeam.setAttribute('points', `${posX + 35},165 400,145 400,405 ${posX + 35},265`);
            }
        }

        // 2. Scientific Rate Calculation & Top Header Metrics Update
        const { rateMm3Min } = this.calculateRate();
        const rateMetricText = document.getElementById('svgMetricRateText');

        if (rateMetricText) {
            rateMetricText.textContent = `${rateMm3Min.toFixed(2)} mm³/min`;
            if (rateMm3Min >= 10.0) {
                rateMetricText.setAttribute('fill', '#10b981'); // High rate green
            } else if (rateMm3Min >= 3.0) {
                rateMetricText.setAttribute('fill', '#0284c7'); // Normal rate blue
            } else {
                rateMetricText.setAttribute('fill', '#f59e0b'); // Low rate orange
            }
        }

        // 3. Expand Gas Bubble width along capillary tube scale (scaled to 100 mm3)
        const bubble = document.getElementById('svgGasBubble');
        const badgeVolume = document.getElementById('svgGasVolumeBadge');

        if (bubble) {
            const bubbleWidth = Math.min(210, (this.gasVolumeMm3 / 100) * 210);
            bubble.setAttribute('width', `${bubbleWidth}`);
        }

        if (badgeVolume) {
            badgeVolume.textContent = `${this.gasVolumeMm3.toFixed(2)} mm³`;
        }

        // 4. Render Rising SVG Micro Bubbles from Plant Stem
        const bubblesGroup = document.getElementById('svgPlantBubbles');
        if (bubblesGroup) {
            let html = '';
            if (this.isRunning) {
                this.risingBubbles.forEach(b => {
                    html += `<circle cx="${b.x}" cy="${b.y}" r="${b.r}" fill="rgba(255,255,255,0.85)" stroke="#10b981" stroke-width="0.5"/>`;
                });
            }
            bubblesGroup.innerHTML = html;
        }
    }
}
