/**
 * mitosisEngine.js
 * Clean Architecture - Infinite Procedural Cell Matrix, Dynamic Cell Selection & Highlight Ring
 */

export class MitosisEngine {
    constructor() {
        this.activePhase = 'metaphase';
        this.selectedCell = { c: 0, r: 0 };
        this.scrubberProgress = 0.5;

        this.landmarkCoords = {
            metaphase: { c: 0, r: 0 },
            prophase: { c: -4, r: -3 },
            anaphase: { c: 4, r: -3 },
            telophase: { c: -4, r: 3 },
            interphase: { c: 4, r: 3 }
        };

        this.phaseInfoMap = {
            interphase: {
                title: 'الطور البيني (Interphase)',
                icon: 'fa-dot-circle',
                desc: 'تنمو الخلية ويتضاعف حمض DNA والمحتويات الخلوية استعداداً لبدء الانقسام.'
            },
            prophase: {
                title: 'الطور التمهيدي (Prophase)',
                icon: 'fa-dna',
                desc: 'تتكثف الخيوط الكروماتينية لتظهر الكروموسومات بوضوح ويبدأ الغشاء النووي بالتفكك.'
            },
            metaphase: {
                title: 'الطور الاستوائي (Metaphase)',
                icon: 'fa-align-center',
                desc: 'تصطف جميع الكروموسومات بدقة عند خط استواء الخلية وترتبط بخيوط المغزل.'
            },
            anaphase: {
                title: 'الطور الانفصالي (Anaphase)',
                icon: 'fa-arrows-alt-h',
                desc: 'تنفصل الكروماتيدات الشقيقة وتنكمش خيوط المغزل لتسحب كل مجموعة نحو أحد القطبين.'
            },
            telophase: {
                title: 'الطور النهائي (Telophase)',
                icon: 'fa-divide',
                desc: 'تتشكل نواتان جديدتان حول الكروموسومات ويبدأ الانقسام السيتوبلازمي (الصفيحة الخلوية/التخصر).'
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
        if (c === 0 && r === 0) return 'metaphase';
        if (c === -4 && r === -3) return 'prophase';
        if (c === 4 && r === -3) return 'anaphase';
        if (c === -4 && r === 3) return 'telophase';
        if (c === 4 && r === 3) return 'interphase';

        const hash = Math.abs(Math.sin(c * 12.9898 + r * 78.233) * 43758.5453);
        const val = hash - Math.floor(hash);

        if (val < 0.62) return 'interphase';
        if (val < 0.72) return 'prophase';
        if (val < 0.82) return 'metaphase';
        if (val < 0.91) return 'anaphase';
        return 'telophase';
    }

    getCellAtWorldPos(worldX, worldY) {
        const cellW = 100;
        const cellH = 55;

        const approxR = Math.round(worldY / cellH);
        const rowOffsetX = (Math.abs(approxR) % 2 === 0 ? 0 : cellW * 0.15);
        const approxC = Math.round((worldX - rowOffsetX) / cellW);

        this.selectedCell = { c: approxC, r: approxR };

        const phaseKey = this.getCellPhase(approxC, approxR);
        const info = this.phaseInfoMap[phaseKey] || this.phaseInfoMap['interphase'];

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
                        if (currentPhase === 'telophase') {
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

                // 1. Cell Boundary & Cytoplasm Fill
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

                // 2. Vibrant Glowing Highlight Ring for Clicked/Selected Cell (Traces exact cell boundary)
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

                // 3. Render Chromosomes & Centrosomes for Phase
                if (!isPlant && currentPhase !== 'interphase') {
                    [-cellW * 0.35, cellW * 0.35].forEach(px => {
                        ctx.fillStyle = '#f59e0b';
                        ctx.beginPath();
                        ctx.arc(px, 0, 4, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }

                switch (currentPhase) {
                    case 'interphase':
                        this.renderInterphase(ctx, isRedAnimal);
                        break;
                    case 'prophase':
                        this.renderProphase(ctx, isRedAnimal);
                        break;
                    case 'metaphase':
                        this.renderMetaphase(ctx);
                        break;
                    case 'anaphase':
                        this.renderAnaphase(ctx);
                        break;
                    case 'telophase':
                        this.renderTelophase(ctx, isPlant, cellH, isRedAnimal);
                        break;
                }

                ctx.restore();
            }
        }
    }

    renderInterphase(ctx, isRedAnimal = false) {
        ctx.fillStyle = isRedAnimal ? 'rgba(225, 29, 72, 0.4)' : 'rgba(147, 51, 234, 0.4)';
        ctx.strokeStyle = isRedAnimal ? '#e11d48' : '#9333ea';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isRedAnimal ? '#9f1239' : '#581c87';
        ctx.beginPath();
        ctx.arc(-3, -2, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    renderProphase(ctx, isRedAnimal = false) {
        ctx.strokeStyle = isRedAnimal ? '#e11d48' : '#9333ea';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        this.drawChromosomePair(ctx, -6, -5, 0.4, '#ef4444', 0.4);
        this.drawChromosomePair(ctx, 5, -4, -0.3, '#2563eb', 0.4);
        this.drawChromosomePair(ctx, -4, 6, 0.8, '#10b981', 0.4);
        this.drawChromosomePair(ctx, 6, 5, -0.6, '#f59e0b', 0.4);
    }

    renderMetaphase(ctx) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1;
        [-35, 35].forEach(poleX => {
            [-10, 0, 10].forEach(centerY => {
                ctx.beginPath();
                ctx.moveTo(poleX, 0);
                ctx.lineTo(0, centerY);
                ctx.stroke();
            });
        });

        this.drawChromosomePair(ctx, 0, -12, 0, '#ef4444', 0.45);
        this.drawChromosomePair(ctx, 0, -4, 0, '#2563eb', 0.45);
        this.drawChromosomePair(ctx, 0, 4, 0, '#10b981', 0.45);
        this.drawChromosomePair(ctx, 0, 12, 0, '#f59e0b', 0.45);
    }

    renderAnaphase(ctx) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1;
        const sepX = 14;

        [-35, 35].forEach(poleX => {
            const targetX = poleX < 0 ? -sepX : sepX;
            [-10, -3, 3, 10].forEach(y => {
                ctx.beginPath();
                ctx.moveTo(poleX, 0);
                ctx.lineTo(targetX, y);
                ctx.stroke();
            });
        });

        [-10, -3, 3, 10].forEach((y, idx) => {
            const colors = ['#ef4444', '#2563eb', '#10b981', '#f59e0b'];
            this.drawVChromatid(ctx, -sepX, y, true, colors[idx], 0.45);
            this.drawVChromatid(ctx, sepX, y, false, colors[idx], 0.45);
        });
    }

    renderTelophase(ctx, isPlant, cellH, isRedAnimal = false) {
        [-20, 20].forEach(poleX => {
            // Reforming Nuclear Envelope (Dashed circle)
            ctx.fillStyle = isRedAnimal ? 'rgba(225, 29, 72, 0.35)' : 'rgba(147, 51, 234, 0.35)';
            ctx.strokeStyle = isRedAnimal ? '#e11d48' : '#9333ea';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 2]);

            ctx.beginPath();
            ctx.arc(poleX, 0, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);

            // Nucleolus
            ctx.fillStyle = isRedAnimal ? '#9f1239' : '#581c87';
            ctx.beginPath();
            ctx.arc(poleX - 3, -2, 4, 0, Math.PI * 2);
            ctx.fill();

            // Decondensing chromatid strands inside nucleus
            const colors = ['#ef4444', '#2563eb', '#10b981', '#f59e0b'];
            [-6, -2, 2, 6].forEach((offsetY, idx) => {
                const isLeft = poleX < 0;
                this.drawVChromatid(ctx, poleX + (isLeft ? 2 : -2), offsetY * 0.7, !isLeft, colors[idx], 0.38);
            });
        });

        // Cytokinesis: Plant Cell Plate / Animal Cleavage Line
        if (isPlant) {
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 3;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(0, -cellH / 2 + 4);
            ctx.lineTo(0, cellH / 2 - 4);
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            ctx.strokeStyle = 'rgba(30, 41, 59, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(0, -cellH / 2 + 6);
            ctx.lineTo(0, cellH / 2 - 6);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    drawChromosomePair(ctx, x, y, angle, color, scale = 1.0) {
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

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawVChromatid(ctx, x, y, pointingLeft, color, scale = 1.0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        const dir = pointingLeft ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(dir * 12, -8);
        ctx.lineTo(dir * 10, 0);
        ctx.lineTo(dir * 12, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}
