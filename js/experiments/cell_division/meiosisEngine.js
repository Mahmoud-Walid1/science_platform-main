/**
 * meiosisEngine.js
 * Clean Architecture - Meiosis Homologous Pair Alignment & Meiotic Division Engine
 */

export class MeiosisEngine {
    constructor() {
        this.activePhase = 'metaphase1';
        this.selectedCell = { c: 0, r: 0 };
        this.scrubberProgress = 0.5;

        this.landmarkCoords = {
            prophase1: { c: -4, r: -3 },
            metaphase1: { c: 0, r: 0 },
            anaphase1: { c: 4, r: -3 },
            telophase1: { c: -4, r: 3 },
            meiosis2: { c: 4, r: 3 }
        };

        this.phaseInfoMap = {
            prophase1: {
                title: 'الطور التمهيدي الأول (Prophase I)',
                icon: 'fa-dna',
                desc: 'تتقارب الكروموسومات المتماثلة لتشكل الرباعيات (Tetrads) وتحدث ظاهرة العبور الجيني (Crossing-over).'
            },
            metaphase1: {
                title: 'الطور الاستوائي الأول (Metaphase I)',
                icon: 'fa-align-center',
                desc: 'تصطف أزواج الكروموسومات المتماثلة في صفين متوازيين عند خط استواء الخلية.'
            },
            anaphase1: {
                title: 'الطور الانفصالي الأول (Anaphase I)',
                icon: 'fa-arrows-alt-h',
                desc: 'تنفصل أزواج الكروموسومات المتماثلة ويتجه كل كروموسوم كامل نحو أحد القطبين.'
            },
            telophase1: {
                title: 'الطور النهائي الأول (Telophase I)',
                icon: 'fa-divide',
                desc: 'تنقسم الخلية إلى خليتين بنتين تحتوي كل منهما على نصف عدد الكروموسومات (N).'
            },
            meiosis2: {
                title: 'الانقسام الميوزي الثاني (Meiosis II)',
                icon: 'fa-cubes',
                desc: 'تخضع الخليتان البنتان لانقسام ميوزي ثاني مباشر لتنتج في النهاية 4 خلايا أمشاج (Gametes).'
            }
        };
    }

    setPhase(phase) {
        this.activePhase = phase;
        const lm = this.landmarkCoords[phase];
        if (lm) {
            this.selectedCell = { c: lm.c, r: lm.r };
        }
    }

    getCellPhase(c, r) {
        if (c === 0 && r === 0) return 'metaphase1';
        if (c === -4 && r === -3) return 'prophase1';
        if (c === 4 && r === -3) return 'anaphase1';
        if (c === -4 && r === 3) return 'telophase1';
        if (c === 4 && r === 3) return 'meiosis2';

        const hash = Math.abs(Math.sin(c * 19.9898 + r * 63.233) * 43758.5453);
        const val = hash - Math.floor(hash);

        if (val < 0.25) return 'prophase1';
        if (val < 0.50) return 'metaphase1';
        if (val < 0.70) return 'anaphase1';
        if (val < 0.85) return 'telophase1';
        return 'meiosis2';
    }

    getCellAtWorldPos(worldX, worldY) {
        const cellW = 100;
        const cellH = 55;

        const approxR = Math.round(worldY / cellH);
        const rowOffsetX = (Math.abs(approxR) % 2 === 0 ? 0 : cellW * 0.15);
        const approxC = Math.round((worldX - rowOffsetX) / cellW);

        this.selectedCell = { c: approxC, r: approxR };

        const phaseKey = this.getCellPhase(approxC, approxR);
        const info = this.phaseInfoMap[phaseKey] || this.phaseInfoMap['metaphase1'];

        return {
            c: approxC,
            r: approxR,
            phase: phaseKey,
            title: info.title,
            icon: info.icon,
            desc: info.desc
        };
    }

    renderCell(ctx, slideType, width, height, zoom, panX, panY) {
        const centerX = width / 2 + 100;
        const centerY = height / 2;

        const isPlant = slideType === 'plant';
        const isRedAnimal = slideType === 'animal_red';

        const cellW = 100;
        const cellH = 55;

        const halfW = (width / 2 + Math.abs(panX) + 800) / (cellW * zoom);
        const halfH = (height / 2 + Math.abs(panY) + 800) / (cellH * zoom);

        const minCol = Math.floor(-halfW) - 8;
        const maxCol = Math.ceil(halfW) + 8;
        const minRow = Math.floor(-halfH) - 8;
        const maxRow = Math.ceil(halfH) + 8;

        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const cellX = c * cellW + (Math.abs(r) % 2 === 0 ? 0 : cellW * 0.15);
                const cellY = r * cellH;

                const drawX = centerX + panX + cellX * zoom;
                const drawY = centerY + panY + cellY * zoom;

                if (drawX < -150 || drawX > width + 150 || drawY < -150 || drawY > height + 150) continue;

                const currentPhase = this.getCellPhase(c, r);
                const tilt = Math.sin(c * 17 + r * 31) * 0.04;

                ctx.save();
                ctx.translate(drawX, drawY);
                ctx.scale(zoom, zoom);
                ctx.rotate(tilt);

                // Helper to define exact cell boundary path
                const traceCellPath = () => {
                    ctx.beginPath();
                    if (isPlant) {
                        ctx.roundRect(-cellW / 2 + 2, -cellH / 2 + 2, cellW - 4, cellH - 4, 6);
                    } else {
                        if (currentPhase === 'telophase1') {
                            const indent = 12;
                            ctx.moveTo(-cellW / 2 + 2, -cellH / 2 + 2);
                            ctx.lineTo(0, -cellH / 2 + 2 + indent);
                            ctx.lineTo(cellW / 2 - 2, -cellH / 2 + 2);
                            ctx.lineTo(cellW / 2 - 2, cellH / 2 - 2);
                            ctx.lineTo(0, cellH / 2 - 2 - indent);
                            ctx.lineTo(-cellW / 2 + 2, cellH / 2 - 2);
                            ctx.closePath();
                        } else {
                            ctx.ellipse(0, 0, cellW / 2 - 2, cellH / 2 - 2, 0, 0, Math.PI * 2);
                        }
                    }
                };

                // Cell Wall / Membrane
                if (isPlant) {
                    ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
                    ctx.strokeStyle = 'rgba(147, 51, 234, 0.65)';
                } else if (isRedAnimal) {
                    ctx.fillStyle = 'rgba(251, 113, 133, 0.38)';
                    ctx.strokeStyle = 'rgba(225, 29, 72, 0.75)';
                } else {
                    ctx.fillStyle = 'rgba(147, 197, 253, 0.35)';
                    ctx.strokeStyle = 'rgba(37, 99, 235, 0.65)';
                }
                ctx.lineWidth = 2;

                traceCellPath();
                ctx.fill();
                ctx.stroke();

                // 2. Vibrant Glowing Highlight Ring for Clicked/Selected Cell
                if (this.selectedCell && c === this.selectedCell.c && r === this.selectedCell.r) {
                    ctx.save();
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 5;
                    ctx.shadowColor = '#f59e0b';
                    ctx.shadowBlur = 22;

                    traceCellPath();
                    ctx.stroke();
                    ctx.restore();
                }

                // Render Meiotic Structures
                switch (currentPhase) {
                    case 'prophase1':
                        this.renderProphase1(ctx);
                        break;
                    case 'metaphase1':
                        this.renderMetaphase1(ctx);
                        break;
                    case 'anaphase1':
                        this.renderAnaphase1(ctx);
                        break;
                    case 'telophase1':
                        this.renderTelophase1(ctx, isPlant, cellH, isRedAnimal);
                        break;
                    case 'meiosis2':
                        this.renderMeiosis2(ctx, isPlant, cellH, isRedAnimal);
                        break;
                }

                ctx.restore();
            }
        }
    }

    renderProphase1(ctx) {
        ctx.strokeStyle = '#9333ea';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        this.drawTetradPair(ctx, -6, -4, '#ef4444', '#3b82f6', 0.45);
        this.drawTetradPair(ctx, 6, 4, '#10b981', '#f59e0b', 0.45);
    }

    renderMetaphase1(ctx) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1;
        [-35, 35].forEach(poleX => {
            [-10, 10].forEach(centerY => {
                ctx.beginPath();
                ctx.moveTo(poleX, 0);
                ctx.lineTo(poleX < 0 ? -12 : 12, centerY);
                ctx.stroke();
            });
        });

        this.drawTetradPair(ctx, 0, -10, '#ef4444', '#3b82f6', 0.45);
        this.drawTetradPair(ctx, 0, 10, '#10b981', '#f59e0b', 0.45);
    }

    renderAnaphase1(ctx) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1;

        [-35, 35].forEach(poleX => {
            const targetX = poleX < 0 ? -16 : 16;
            [-10, 10].forEach(y => {
                ctx.beginPath();
                ctx.moveTo(poleX, 0);
                ctx.lineTo(targetX, y);
                ctx.stroke();
            });
        });

        this.drawSingleChromosome(ctx, -16, -10, 0.2, '#ef4444', 0.45);
        this.drawSingleChromosome(ctx, -16, 10, -0.2, '#10b981', 0.45);

        this.drawSingleChromosome(ctx, 16, -10, -0.2, '#3b82f6', 0.45);
        this.drawSingleChromosome(ctx, 16, 10, 0.2, '#f59e0b', 0.45);
    }

    renderTelophase1(ctx, isPlant, cellH, isRedAnimal = false) {
        [-20, 20].forEach(poleX => {
            ctx.fillStyle = isRedAnimal ? 'rgba(225, 29, 72, 0.35)' : 'rgba(147, 51, 234, 0.35)';
            ctx.strokeStyle = isRedAnimal ? '#e11d48' : '#9333ea';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 2]);

            ctx.beginPath();
            ctx.arc(poleX, 0, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = isRedAnimal ? '#9f1239' : '#581c87';
            ctx.beginPath();
            ctx.arc(poleX - 3, -2, 4, 0, Math.PI * 2);
            ctx.fill();

            const colors = poleX < 0 ? ['#ef4444', '#10b981'] : ['#3b82f6', '#f59e0b'];
            [-4, 4].forEach((offsetY, idx) => {
                this.drawSingleChromosome(ctx, poleX, offsetY * 0.8, 0, colors[idx], 0.35);
            });
        });
    }

    renderMeiosis2(ctx, isPlant, cellH, isRedAnimal = false) {
        [ {x: -20, y: -11}, {x: -20, y: 11}, {x: 20, y: -11}, {x: 20, y: 11} ].forEach((pt, idx) => {
            ctx.fillStyle = isRedAnimal ? 'rgba(225, 29, 72, 0.35)' : 'rgba(16, 185, 129, 0.35)';
            ctx.strokeStyle = isRedAnimal ? '#e11d48' : '#10b981';
            ctx.lineWidth = 1.2;

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            const colors = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b'];
            this.drawSingleChromosome(ctx, pt.x, pt.y, 0, colors[idx], 0.3);
        });
    }

    drawTetradPair(ctx, x, y, color1, color2, scale = 1.0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.fillStyle = color1;
        ctx.beginPath();
        ctx.ellipse(-5, 0, 4, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color2;
        ctx.beginPath();
        ctx.ellipse(5, 0, 4, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawSingleChromosome(ctx, x, y, angle, color, scale = 1.0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(scale, scale);

        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        [-1, 1].forEach(dir => {
            ctx.beginPath();
            ctx.ellipse(0, 0, 4, 14, (dir * Math.PI) / 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        ctx.restore();
    }
}
