/**
 * timeLapseScrubber.js
 * Clean Architecture - Time-Lapse Scrubber Timeline Interpolator
 */

export class TimeLapseScrubber {
    constructor(mitosisEngine, onPhaseChange) {
        this.mitosisEngine = mitosisEngine;
        this.onPhaseChange = onPhaseChange;
        this.progress = 0; // 0 to 100
        
        this.slider = document.getElementById('scrubberInput');
        this.titleSpan = document.getElementById('scrubberPhaseTitle');
        
        this.init();
    }

    init() {
        if (!this.slider) return;
        this.slider.addEventListener('input', (e) => {
            this.setProgress(parseFloat(e.target.value));
        });
    }

    setProgress(val) {
        this.progress = Math.max(0, Math.min(100, val));
        if (this.slider && parseFloat(this.slider.value) !== this.progress) {
            this.slider.value = this.progress;
        }

        // Map percentage to phase and intra-phase progress
        let phase = 'interphase';
        let phaseArabic = 'الطور البيني (Interphase)';
        let phaseProgress = 0;

        if (this.progress < 20) {
            phase = 'interphase';
            phaseArabic = 'الطور البيني (Interphase)';
            phaseProgress = this.progress / 20;
        } else if (this.progress < 40) {
            phase = 'prophase';
            phaseArabic = 'الطور التمهيدي (Prophase)';
            phaseProgress = (this.progress - 20) / 20;
        } else if (this.progress < 60) {
            phase = 'metaphase';
            phaseArabic = 'الطور الاستوائي (Metaphase)';
            phaseProgress = (this.progress - 40) / 20;
        } else if (this.progress < 80) {
            phase = 'anaphase';
            phaseArabic = 'الطور الانفصالي (Anaphase)';
            phaseProgress = (this.progress - 60) / 20;
        } else {
            phase = 'telophase';
            phaseArabic = 'الطور النهائي (Telophase)';
            phaseProgress = (this.progress - 80) / 20;
        }

        this.mitosisEngine.setPhase(phase);
        this.mitosisEngine.progress = phaseProgress;

        if (this.titleSpan) {
            this.titleSpan.textContent = `${phaseArabic} - ${Math.round(this.progress)}%`;
        }

        if (this.onPhaseChange) {
            this.onPhaseChange(phase, this.progress);
        }
    }

    syncWithPhase(phase) {
        const map = {
            interphase: 10,
            prophase: 30,
            metaphase: 50,
            anaphase: 70,
            telophase: 90
        };
        if (map[phase] !== undefined) {
            this.setProgress(map[phase]);
        }
    }
}
