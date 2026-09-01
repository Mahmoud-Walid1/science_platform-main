/**
 * particleEngine.js
 * Clean Architecture - Particle System for Sunlight, CO2, Water, O2 Bubbles, and Glucose.
 */

export class ParticleEngine {
    constructor() {
        this.lightParticles = [];
        this.co2Particles = [];
        this.waterParticles = [];
        this.o2Particles = [];
        this.glucoseParticles = [];

        this.spawnTimer = 0;
    }

    updateAndRender(ctx, width, height, lightLevel, co2Level, waterLevel, rateScore) {
        this.spawnTimer++;

        const centerX = width / 2;
        const soilY = height - 120;
        const sunX = 140;
        const sunY = 130;

        // Determine particle spawn rates based on levels
        const lightMult = lightLevel === 'high' ? 3 : (lightLevel === 'medium' ? 1.8 : 0.8);
        const co2Mult = co2Level === 'high' ? 3 : (co2Level === 'medium' ? 1.8 : 0.8);
        const waterMult = waterLevel === 'high' ? 3 : (waterLevel === 'medium' ? 1.8 : 0.8);
        const outputMult = rateScore * 3;

        // 1. Spawn Light Rays (Sun -> Plant Leaves)
        if (this.spawnTimer % Math.max(2, Math.floor(10 / lightMult)) === 0) {
            this.lightParticles.push({
                x: sunX + (Math.random() - 0.5) * 40,
                y: sunY + (Math.random() - 0.5) * 40,
                targetX: centerX + (Math.random() - 0.5) * 120,
                targetY: soilY - 140 + (Math.random() - 0.5) * 80,
                progress: 0,
                speed: 0.015 + Math.random() * 0.01
            });
        }

        // 2. Spawn CO2 Particles (Air -> Leaf Stomata)
        if (this.spawnTimer % Math.max(2, Math.floor(12 / co2Mult)) === 0) {
            this.co2Particles.push({
                x: 60 + Math.random() * 80,
                y: soilY - 160 + (Math.random() - 0.5) * 100,
                targetX: centerX - 30 + Math.random() * 20,
                targetY: soilY - 140 + (Math.random() - 0.5) * 60,
                progress: 0,
                speed: 0.012 + Math.random() * 0.01
            });
        }

        // 3. Spawn Water Particles (Soil -> Roots -> Stem -> Leaves)
        if (this.spawnTimer % Math.max(2, Math.floor(12 / waterMult)) === 0) {
            this.waterParticles.push({
                x: centerX + (Math.random() - 0.5) * 100,
                y: soilY + 50 + Math.random() * 40,
                progress: 0,
                speed: 0.015 + Math.random() * 0.01
            });
        }

        // 4. Spawn Oxygen Bubbles (Leaves -> Upward Air)
        if (outputMult > 0.3 && this.spawnTimer % Math.max(2, Math.floor(14 / outputMult)) === 0) {
            this.o2Particles.push({
                x: centerX + (Math.random() > 0.5 ? 40 : -40) + (Math.random() - 0.5) * 20,
                y: soilY - 150 + (Math.random() - 0.5) * 50,
                radius: 6 + Math.random() * 6,
                vy: -1.5 - Math.random() * 1.5,
                vx: (Math.random() - 0.5) * 0.8,
                alpha: 1.0
            });
        }

        // 5. Spawn Glucose Energy Nodes (Leaves -> Stem)
        if (outputMult > 0.3 && this.spawnTimer % Math.max(2, Math.floor(16 / outputMult)) === 0) {
            this.glucoseParticles.push({
                x: centerX + (Math.random() - 0.5) * 80,
                y: soilY - 170 + (Math.random() - 0.5) * 50,
                radius: 7 + Math.random() * 4,
                pulse: 0
            });
        }

        // Render & Update Particle Collections
        this.renderLight(ctx);
        this.renderCO2(ctx);
        this.renderWater(ctx, centerX, soilY);
        this.renderO2(ctx);
        this.renderGlucose(ctx);
    }

    renderLight(ctx) {
        for (let i = this.lightParticles.length - 1; i >= 0; i--) {
            const p = this.lightParticles[i];
            p.progress += p.speed;

            const currX = p.x + (p.targetX - p.x) * p.progress;
            const currY = p.y + (p.targetY - p.y) * p.progress;

            ctx.save();
            ctx.fillStyle = '#fde047';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(currX, currY, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (p.progress >= 1) {
                this.lightParticles.splice(i, 1);
            }
        }
    }

    renderCO2(ctx) {
        for (let i = this.co2Particles.length - 1; i >= 0; i--) {
            const p = this.co2Particles[i];
            p.progress += p.speed;

            const currX = p.x + (p.targetX - p.x) * p.progress;
            const currY = p.y + (p.targetY - p.y) * p.progress;

            ctx.save();
            ctx.fillStyle = 'rgba(100, 116, 139, 0.85)';
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(currX, currY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px Cairo';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('CO₂', currX, currY + 0.5);
            ctx.restore();

            if (p.progress >= 1) {
                this.co2Particles.splice(i, 1);
            }
        }
    }

    renderWater(ctx, centerX, soilY) {
        for (let i = this.waterParticles.length - 1; i >= 0; i--) {
            const p = this.waterParticles[i];
            p.progress += p.speed;

            const currY = p.y - p.progress * 160;

            ctx.save();
            ctx.fillStyle = '#0284c7';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 8;

            ctx.beginPath();
            ctx.arc(centerX + Math.sin(p.progress * 8) * 6, currY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (p.progress >= 1 || currY < soilY - 180) {
                this.waterParticles.splice(i, 1);
            }
        }
    }

    renderO2(ctx) {
        for (let i = this.o2Particles.length - 1; i >= 0; i--) {
            const p = this.o2Particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.008;

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
            ctx.strokeStyle = '#0891b2';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (p.alpha <= 0 || p.y < 50) {
                this.o2Particles.splice(i, 1);
            }
        }
    }

    renderGlucose(ctx) {
        for (let i = this.glucoseParticles.length - 1; i >= 0; i--) {
            const p = this.glucoseParticles[i];
            p.pulse += 0.05;

            ctx.save();
            ctx.fillStyle = '#22c55e';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#4ade80';
            ctx.shadowBlur = 12 + Math.sin(p.pulse) * 4;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            if (p.pulse > Math.PI * 4) {
                this.glucoseParticles.splice(i, 1);
            }
        }
    }
}
