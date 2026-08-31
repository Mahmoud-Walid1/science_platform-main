// js/experiments/photosynthesis_factors/chartManager.js

export class ChartManager {
    constructor() {
        this.leafChart = null;
        this.indicatorChart = null;
        this.audusChart = null;
    }

    // 1. Leaf Disk Chart: Floating Disks vs Time
    initLeafChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (this.leafChart) this.leafChart.destroy();

        this.leafChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'عدد الأقراص الطافية',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'الزمن (ثانية)', color: '#002855', font: { weight: 'bold' } },
                        ticks: { color: '#475569' },
                        grid: { color: '#e2e8f0' }
                    },
                    y: {
                        min: 0,
                        max: 10,
                        title: { display: true, text: 'عدد الأقراص (0 - 10)', color: '#002855', font: { weight: 'bold' } },
                        ticks: { color: '#475569', stepSize: 1 },
                        grid: { color: '#e2e8f0' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#0f172a', font: { family: 'Cairo', weight: 'bold' } } }
                }
            }
        });
    }

    updateLeafChart(timeSec, count) {
        if (!this.leafChart) return;
        this.leafChart.data.labels.push(timeSec);
        this.leafChart.data.datasets[0].data.push(count);
        this.leafChart.update('quiet');
    }

    resetLeafChart() {
        if (!this.leafChart) return;
        this.leafChart.data.labels = [];
        this.leafChart.data.datasets[0].data = [];
        this.leafChart.update();
    }

    // 2. Hydrogencarbonate Indicator Chart: CO2 vs Time across 4 tubes
    initIndicatorChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (this.indicatorChart) this.indicatorChart.destroy();

        this.indicatorChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [0, 15, 30, 45, 60, 75, 90, 105, 120],
                datasets: [
                    { label: 'أنبوب 1 (ضابطة)', data: [450, 450, 450, 450, 450, 450, 450, 450, 450], borderColor: '#ef4444', borderWidth: 2 },
                    { label: 'أنبوب 2 (نبات + ضوء)', data: [450, 380, 310, 250, 200, 160, 130, 110, 100], borderColor: '#8b5cf6', borderWidth: 2.5 },
                    { label: 'أنبوب 3 (نبات + ظلام)', data: [450, 520, 600, 680, 750, 810, 860, 900, 940], borderColor: '#d97706', borderWidth: 2.5 },
                    { label: 'أنبوب 4 (نبات + حلزون)', data: [450, 460, 470, 465, 460, 455, 450, 450, 450], borderColor: '#0284c7', borderWidth: 2.5 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'الزمن (دقيقة)', color: '#002855', font: { weight: 'bold' } }, ticks: { color: '#475569' }, grid: { color: '#e2e8f0' } },
                    y: { title: { display: true, text: 'تركيز CO2 (ppm)', color: '#002855', font: { weight: 'bold' } }, ticks: { color: '#475569' }, grid: { color: '#e2e8f0' } }
                },
                plugins: {
                    legend: { labels: { color: '#0f172a', font: { family: 'Cairo', size: 11, weight: 'bold' } } }
                }
            }
        });
    }

    updateIndicatorChartData(tubeDataArray) {
        if (!this.indicatorChart) return;
        tubeDataArray.forEach((tube, idx) => {
            if (this.indicatorChart.data.datasets[idx]) {
                this.indicatorChart.data.datasets[idx].data = tube.co2History;
            }
        });
        this.indicatorChart.update();
    }

    // 3. Audus Photosynthometer Chart: Rate vs 1/d^2
    initAudusChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (this.audusChart) this.audusChart.destroy();

        this.audusChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'معدل البناء الضوئي مقابل شدة الضوء (1/d²)',
                    data: [],
                    borderColor: '#0284c7',
                    backgroundColor: '#0284c7',
                    showLine: true,
                    borderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'شدة الضوء النسبية (1/d²)', color: '#002855', font: { weight: 'bold' } }, ticks: { color: '#475569' }, grid: { color: '#e2e8f0' } },
                    y: { title: { display: true, text: 'المعدل (mm³/min)', color: '#002855', font: { weight: 'bold' } }, ticks: { color: '#475569' }, grid: { color: '#e2e8f0' } }
                },
                plugins: {
                    legend: { labels: { color: '#0f172a', font: { family: 'Cairo', weight: 'bold' } } }
                }
            }
        });
    }

    addAudusPoint(invD2, rate) {
        if (!this.audusChart) return;
        this.audusChart.data.datasets[0].data.push({ x: invD2, y: rate });
        this.audusChart.data.datasets[0].data.sort((a, b) => a.x - b.x);
        this.audusChart.update();
    }

    resetAudusChart() {
        if (!this.audusChart) return;
        this.audusChart.data.datasets[0].data = [];
        this.audusChart.update();
    }
}
