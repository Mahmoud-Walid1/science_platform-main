// js/experiments/ph_v2/soundManager.js
class SoundManager {
    constructor() {
        this.audioCtx = null;
    }

    initAudio() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // 1. Short Beep for pH Meter digital readings
    playBeep(frequency = 1200, duration = 0.08) {
        this.initAudio();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    // 2. Sizzling/Friction sound when litmus paper touches chemical solutions
    playSizzle(duration = 0.4) {
        this.initAudio();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const bufferSize = this.audioCtx.sampleRate * duration;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2200, now);
        filter.Q.setValueAtTime(3.0, now);

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        whiteNoise.start(now);
        whiteNoise.stop(now + duration);
    }

    // 3. Liquid Pouring sound when a new solution is selected
    playPour(duration = 1.0) {
        this.initAudio();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;

        // Low frequency sine rumble
        const lowOsc = this.audioCtx.createOscillator();
        const lowGain = this.audioCtx.createGain();
        lowOsc.type = 'sine';
        lowOsc.frequency.setValueAtTime(120, now);
        lowOsc.frequency.linearRampToValueAtTime(160, now + duration);

        lowGain.gain.setValueAtTime(0.01, now);
        lowGain.gain.linearRampToValueAtTime(0.12, now + 0.1);
        lowGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        lowOsc.connect(lowGain);
        lowGain.connect(this.audioCtx.destination);
        lowOsc.start(now);
        lowOsc.stop(now + duration);

        // White noise stream
        const bufferSize = this.audioCtx.sampleRate * duration;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);
        filter.frequency.linearRampToValueAtTime(600, now + duration);

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        whiteNoise.start(now);
        whiteNoise.stop(now + duration);
    }
}

export const soundManager = new SoundManager();
