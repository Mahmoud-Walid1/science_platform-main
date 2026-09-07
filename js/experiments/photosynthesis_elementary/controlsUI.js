/**
 * controlsUI.js
 * Clean Architecture - Handles 3-Step Segmented Switches (Low/Med/High) & Reset Button.
 */

import { soundManager } from './soundManager.js';

export class ControlsUI {
    constructor(onChangeCallback) {
        this.lightLevel = 'low';
        this.co2Level = 'low';
        this.waterLevel = 'low';
        this.mineralsLevel = 'low';

        this.onChange = onChangeCallback;

        this.init();
    }

    init() {
        // Segmented Switch Buttons Listener
        document.querySelectorAll('.segmented-switch').forEach(switchGroup => {
            const controlType = switchGroup.getAttribute('data-control');

            switchGroup.querySelectorAll('.switch-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    soundManager.playClick();

                    const target = e.currentTarget;
                    const val = target.getAttribute('data-value');

                    switchGroup.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active'));
                    target.classList.add('active');

                    if (controlType === 'light') this.lightLevel = val;
                    if (controlType === 'co2') this.co2Level = val;
                    if (controlType === 'water') this.waterLevel = val;
                    if (controlType === 'minerals') this.mineralsLevel = val;

                    if (this.onChange) {
                        this.onChange(this.lightLevel, this.co2Level, this.waterLevel, this.mineralsLevel);
                    }
                });
            });
        });

        // Reset Button Listener
        const btnReset = document.getElementById('btnResetExp');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                soundManager.playReset();
                this.resetToDefaults();
            });
        }
    }

    resetToDefaults() {
        this.lightLevel = 'low';
        this.co2Level = 'low';
        this.waterLevel = 'low';
        this.mineralsLevel = 'low';

        document.querySelectorAll('.segmented-switch').forEach(switchGroup => {
            switchGroup.querySelectorAll('.switch-btn').forEach(btn => {
                if (btn.getAttribute('data-value') === 'low') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        });

        if (this.onChange) {
            this.onChange(this.lightLevel, this.co2Level, this.waterLevel, this.mineralsLevel);
        }
    }
}
