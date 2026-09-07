/**
 * plantEngine.js
 * Clean Architecture - Draws realistic green plant, soil layer, roots, and sun.
 */

export class PlantEngine {
    constructor() {
        this.pulseTime = 0;
    }

    render(ctx, width, height, rateScore) {
        this.pulseTime += 0.03;

        const centerX = width / 2;
        const soilY = height - 120;

        // 1. Render Sky Background & Sun
        this.renderSun(ctx, width, height, rateScore);

        // 2. Render Soil & Roots
        this.renderSoilAndRoots(ctx, width, height, soilY, centerX);

        // 3. Render Plant Stem & Leaves
        this.renderPlant(ctx, centerX, soilY, rateScore);
    }

    renderSun(ctx, width, height, rateScore) {
        const sunX = 140;
        const sunY = 130;

        ctx.save();
        ctx.translate(sunX, sunY);

        // Sun Glow
        const glowRadius = 45 + Math.sin(this.pulseTime) * 4;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, glowRadius + 30);
        grad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
        grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.4)');
        grad.addColorStop(1, 'rgba(251, 191, 36, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius + 30, 0, Math.PI * 2);
        ctx.fill();

        // Sun Body
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-4, -4, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderSoilAndRoots(ctx, width, height, soilY, centerX) {
        ctx.save();

        // Soil Layer Gradient
        const soilGrad = ctx.createLinearGradient(0, soilY, 0, height);
        soilGrad.addColorStop(0, '#78350f');
        soilGrad.addColorStop(0.2, '#451a03');
        soilGrad.addColorStop(1, '#292524');

        ctx.fillStyle = soilGrad;
        ctx.beginPath();
        ctx.rect(0, soilY, width, height - soilY);
        ctx.fill();

        // Top Soil Line
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, soilY);
        ctx.lineTo(width, soilY);
        ctx.stroke();

        // Root System
        ctx.strokeStyle = '#fef3c7';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // Main Tap Root
        ctx.beginPath();
        ctx.moveTo(centerX, soilY);
        ctx.quadraticCurveTo(centerX - 5, soilY + 40, centerX + 2, soilY + 80);
        ctx.stroke();

        // Lateral Roots
        ctx.lineWidth = 2.5;
        
        ctx.beginPath();
        ctx.moveTo(centerX, soilY + 15);
        ctx.quadraticCurveTo(centerX - 35, soilY + 30, centerX - 55, soilY + 45);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, soilY + 25);
        ctx.quadraticCurveTo(centerX + 35, soilY + 40, centerX + 60, soilY + 55);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, soilY + 45);
        ctx.quadraticCurveTo(centerX - 25, soilY + 60, centerX - 40, soilY + 75);
        ctx.stroke();

        ctx.restore();
    }

    renderPlant(ctx, centerX, soilY, rateScore) {
        ctx.save();

        // Plant Colors based on rateScore (0..1)
        let leafColor = '#84cc16';
        let leafDark = '#4d7c0f';

        if (rateScore > 0.65) {
            leafColor = '#22c55e';
            leafDark = '#15803d';
        } else if (rateScore < 0.35) {
            leafColor = '#a3e635';
            leafDark = '#65a30d';
        }

        // Stem
        ctx.strokeStyle = leafDark;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(centerX, soilY);
        ctx.quadraticCurveTo(centerX - 8, soilY - 100, centerX, soilY - 200);
        ctx.stroke();

        // Leaves Position List [x, y, scaleX, scaleY, angle]
        const leaves = [
            { x: centerX - 6, y: soilY - 80, sx: -1, sy: 1, angle: -0.2 },
            { x: centerX + 6, y: soilY - 120, sx: 1, sy: 1, angle: 0.2 },
            { x: centerX - 8, y: soilY - 160, sx: -0.9, sy: 0.9, angle: -0.3 },
            { x: centerX + 8, y: soilY - 190, sx: 0.8, sy: 0.8, angle: 0.25 },
            { x: centerX, y: soilY - 215, sx: 0.7, sy: 0.9, angle: 0 }
        ];

        leaves.forEach(l => {
            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.rotate(l.angle);
            ctx.scale(l.sx, l.sy);

            // Leaf Fill
            ctx.fillStyle = leafColor;
            ctx.strokeStyle = leafDark;
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(45, -35, 75, -20, 85, 0);
            ctx.bezierCurveTo(75, 20, 45, 35, 0, 0);
            ctx.fill();
            ctx.stroke();

            // Leaf Central Vein
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(40, 0, 80, 0);
            ctx.stroke();

            ctx.restore();
        });

        ctx.restore();
    }
}
