/**
 * agglutinationRenderer.js - High-Fidelity Clumping & Liquid Particle Visualizer
 */

export class AgglutinationRenderer {
    static renderWellCanvas(canvas, wellState) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const radius = w * 0.42;

        if (!wellState.reagent && !wellState.blood) return;

        // Base liquid disc
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.clip();

        if (wellState.reagent && !wellState.blood) {
            ctx.fillStyle = wellState.reagentColor || 'rgba(59, 130, 246, 0.4)';
            ctx.fill();
            ctx.restore();
            return;
        }

        if (wellState.blood && !wellState.stirred) {
            if (wellState.reagent) {
                ctx.fillStyle = wellState.reagentColor || 'rgba(59, 130, 246, 0.4)';
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(cx, cy, radius * (wellState.reagent ? 0.55 : 0.62), 0, Math.PI * 2);
            ctx.fillStyle = '#b91c1c';
            ctx.fill();
            ctx.strokeStyle = '#7f1d1d';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
            return;
        }

        if (wellState.stirred) {
            if (wellState.aggregated) {
                // Clumped erythrocytes (Positive agglutination +)
                ctx.fillStyle = 'rgba(254, 226, 226, 0.65)'; // light plasma background
                ctx.fillRect(0, 0, w, h);

                ctx.fillStyle = '#991b1b';
                const clumps = [
                    { x: 0.35, y: 0.35, r: 8 }, { x: 0.65, y: 0.32, r: 10 },
                    { x: 0.5, y: 0.52, r: 12 }, { x: 0.3, y: 0.68, r: 9 },
                    { x: 0.72, y: 0.65, r: 8 }, { x: 0.48, y: 0.28, r: 7 },
                    { x: 0.22, y: 0.48, r: 6 }, { x: 0.75, y: 0.48, r: 9 },
                    { x: 0.58, y: 0.72, r: 7 }, { x: 0.38, y: 0.52, r: 9 }
                ];
                clumps.forEach(c => {
                    ctx.beginPath();
                    ctx.arc(cx + (c.x - 0.5) * radius * 1.5, cy + (c.y - 0.5) * radius * 1.5, c.r, 0, Math.PI * 2);
                    ctx.fill();
                    // Micro satellite speckles
                    ctx.fillStyle = '#7f1d1d';
                    ctx.fillRect(cx + (c.x - 0.5) * radius * 1.5 + 4, cy + (c.y - 0.5) * radius * 1.5 - 3, 3, 3);
                });
            } else {
                // Smooth homogeneous fluid (Negative -)
                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
                grad.addColorStop(0, '#dc2626');
                grad.addColorStop(1, '#991b1b');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            }
        }
        ctx.restore();
    }
}
