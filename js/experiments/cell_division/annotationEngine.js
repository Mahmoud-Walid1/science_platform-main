/**
 * annotationEngine.js
 * Clean Architecture - Stylus Pen Drawing, Arrows & Micrometer Ruler (µm) Engine
 */

export class AnnotationEngine {
    constructor() {
        this.canvas = document.getElementById('annotationCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        this.activeTool = 'laser'; // 'laser' | 'pen' | 'arrow' | 'ruler'
        this.penColor = '#ef4444'; // '#ef4444' (Red) | '#f59e0b' (Yellow) | '#06b6d4' (Cyan)
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;

        this.annotations = []; // Saved drawing paths, arrows, rulers

        this.init();
    }

    init() {
        if (!this.canvas) return;

        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const startDraw = (e) => {
            if (this.activeTool === 'laser') return;
            this.isDrawing = true;
            const pos = getPos(e);
            this.startX = pos.x;
            this.startY = pos.y;

            if (this.activeTool === 'pen') {
                this.annotations.push({
                    type: 'path',
                    color: this.penColor,
                    points: [{ x: pos.x, y: pos.y }]
                });
            }
        };

        const moveDraw = (e) => {
            if (!this.isDrawing || this.activeTool === 'laser') return;
            const pos = getPos(e);

            if (this.activeTool === 'pen') {
                const currentPath = this.annotations[this.annotations.length - 1];
                if (currentPath && currentPath.type === 'path') {
                    currentPath.points.push({ x: pos.x, y: pos.y });
                }
                this.redraw();
            }
        };

        const endDraw = (e) => {
            if (!this.isDrawing || this.activeTool === 'laser') return;
            const pos = getPos(e);

            if (this.activeTool === 'arrow') {
                this.annotations.push({
                    type: 'arrow',
                    color: this.penColor,
                    x1: this.startX,
                    y1: this.startY,
                    x2: pos.x,
                    y2: pos.y
                });
            } else if (this.activeTool === 'ruler') {
                this.annotations.push({
                    type: 'ruler',
                    x1: this.startX,
                    y1: this.startY,
                    x2: pos.x,
                    y2: pos.y
                });
            }

            this.isDrawing = false;
            this.redraw();
        };

        this.canvas.addEventListener('mousedown', startDraw);
        this.canvas.addEventListener('mousemove', moveDraw);
        this.canvas.addEventListener('mouseup', endDraw);

        this.canvas.addEventListener('touchstart', startDraw);
        this.canvas.addEventListener('touchmove', moveDraw);
        this.canvas.addEventListener('touchend', endDraw);
    }

    setTool(tool) {
        this.activeTool = tool;
        if (this.canvas) {
            this.canvas.style.pointerEvents = (tool === 'laser') ? 'none' : 'auto';
        }
    }

    setPenColor(color) {
        this.penColor = color;
    }

    clear() {
        this.annotations = [];
        this.redraw();
    }

    redraw() {
        if (!this.ctx || !this.canvas) return;
        const dpr = window.devicePixelRatio || 1;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.annotations.forEach(item => {
            this.ctx.save();

            if (item.type === 'path') {
                this.ctx.strokeStyle = item.color;
                this.ctx.lineWidth = 4 * dpr;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';

                this.ctx.beginPath();
                item.points.forEach((p, idx) => {
                    if (idx === 0) this.ctx.moveTo(p.x * dpr, p.y * dpr);
                    else this.ctx.lineTo(p.x * dpr, p.y * dpr);
                });
                this.ctx.stroke();
            } else if (item.type === 'arrow') {
                this.drawArrow(item.x1 * dpr, item.y1 * dpr, item.x2 * dpr, item.y2 * dpr, item.color);
            } else if (item.type === 'ruler') {
                this.drawRuler(item.x1 * dpr, item.y1 * dpr, item.x2 * dpr, item.y2 * dpr);
            }

            this.ctx.restore();
        });
    }

    drawArrow(x1, y1, x2, y2, color) {
        const headlen = 16;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 4;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawRuler(x1, y1, x2, y2) {
        const distPx = Math.hypot(x2 - x1, y2 - y1);
        const distUm = (distPx / 10).toFixed(1); // 10px = 1µm scale calibration

        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        // End ticks
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const perp = angle + Math.PI / 2;
        [ {x: x1, y: y1}, {x: x2, y: y2} ].forEach(pt => {
            this.ctx.beginPath();
            this.ctx.moveTo(pt.x - 10 * Math.cos(perp), pt.y - 10 * Math.sin(perp));
            this.ctx.lineTo(pt.x + 10 * Math.cos(perp), pt.y + 10 * Math.sin(perp));
            this.ctx.stroke();
        });

        // Label text (µm)
        this.ctx.font = 'bold 16px Cairo, sans-serif';
        this.ctx.fillText(`${distUm} µm`, (x1 + x2) / 2 + 10, (y1 + y2) / 2 - 10);
    }
}
