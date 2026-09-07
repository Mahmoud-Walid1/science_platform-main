/**
 * rateGauge.js
 * Clean Architecture - Scientifically Accurate Photosynthesis Kinetics based on Liebig's Law of the Minimum.
 */

export class RateGauge {
    constructor() {
        this.currentScore = 0.2;
        this.targetScore = 0.2;

        this.fillElem = document.getElementById('rateGaugeFill');
        this.pointerElem = document.getElementById('rateGaugePointer');

        this.labelLow = document.getElementById('labelLow');
        this.labelMed = document.getElementById('labelMed');
        this.labelHigh = document.getElementById('labelHigh');
    }

    /**
     * Calculates Photosynthesis Rate based on Liebig's Law of the Minimum:
     * Photosynthesis is fundamentally constrained by the most limiting factor.
     */
    calculate(lightLevel, co2Level, waterLevel, mineralsLevel = 'low') {
        const factorMap = { low: 0.20, medium: 0.60, high: 1.00 };

        const lightVal = factorMap[lightLevel] || 0.20;
        const co2Val = factorMap[co2Level] || 0.20;
        const waterVal = factorMap[waterLevel] || 0.20;
        const minVal = factorMap[mineralsLevel] || 0.20;

        // 1. Limiting Factor (قانون الحد الأدنى لليبيغ - Liebig's Law)
        const limitingFactor = Math.min(lightVal, co2Val, waterVal, minVal);

        // 2. Average Overall Availability
        const avgVal = (lightVal + co2Val + waterVal + minVal) / 4.0;

        // 3. Combined Scientific Rate Score: 70% Limiting Factor + 30% Overall Average
        this.targetScore = (0.70 * limitingFactor) + (0.30 * avgVal);

        return this.targetScore;
    }

    update() {
        // Smooth linear interpolation for gauge needle & fill height
        this.currentScore += (this.targetScore - this.currentScore) * 0.1;

        const percent = Math.max(5, Math.min(100, Math.round(this.currentScore * 100)));

        if (this.fillElem) {
            this.fillElem.style.height = `${percent}%`;
        }

        if (this.pointerElem) {
            this.pointerElem.style.bottom = `${percent}%`;
        }

        // Active label highlighting matching gauge thresholds
        if (this.labelLow && this.labelMed && this.labelHigh) {
            this.labelLow.style.opacity = percent < 40 ? '1' : '0.35';
            this.labelMed.style.opacity = (percent >= 40 && percent <= 72) ? '1' : '0.35';
            this.labelHigh.style.opacity = percent > 72 ? '1' : '0.35';
        }
    }
}
