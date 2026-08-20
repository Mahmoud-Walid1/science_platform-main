// Sound Manager for Science Platform - Realistic Web Audio API Synthesizer
class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.burnerOsc = null;
        this.burnerGain = null;
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

    // 1. Water & Liquid Pouring Sound (صوت صب المياه المريح والواقعي)
    playLiquidPour(duration = 1.6) {
        this.initAudio();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;

        // Low frequency sine rumble (صوت اندفاع الماء العذب)
        const lowOsc = this.audioCtx.createOscillator();
        const lowGain = this.audioCtx.createGain();

        lowOsc.type = 'sine';
        lowOsc.frequency.setValueAtTime(140, now);
        lowOsc.frequency.linearRampToValueAtTime(180, now + duration);

        lowGain.gain.setValueAtTime(0.01, now);
        lowGain.gain.linearRampToValueAtTime(0.18, now + 0.1);
        lowGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        lowOsc.connect(lowGain);
        lowGain.connect(this.audioCtx.destination);
        lowOsc.start(now);

        // Smooth filtered stream noise (خاطر الماء الرائق)
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
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.linearRampToValueAtTime(700, now + duration);

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        whiteNoise.start(now);
    }

    // 2. Solid Materials into Dry Empty Beaker Sound (صوت صب المواد الصلبة في كوب فارغ)
    playSolidPourDry(duration = 1.4) {
        this.initAudio();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const bufferSize = this.audioCtx.sampleRate * duration;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 0.5);
        }

        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1400, now);

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        noise.start(now);
    }

    // 3. Solid Materials into Liquid-filled Beaker Sound (صوت صب المواد الصلبة في كوب به سائل)
    playSolidPourIntoLiquid(duration = 1.4) {
        this.initAudio();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;

        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

        oscGain.gain.setValueAtTime(0.25, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(oscGain);
        oscGain.connect(this.audioCtx.destination);
        osc.start(now);

        const bufferSize = this.audioCtx.sampleRate * duration;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const splashNoise = this.audioCtx.createBufferSource();
        splashNoise.buffer = noiseBuffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        splashNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        splashNoise.start(now);
    }

    playGlassTouch() {}
    playMagnetClack() {}
    playTrashDump() {}
    playPaperSound() {}

    playBurnerFlame(active) {
        this.initAudio();
        if (!this.audioCtx) return;

        if (active) {
            if (this.burnerOsc) return;

            const bufferSize = this.audioCtx.sampleRate * 2;
            const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const whiteNoise = this.audioCtx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, this.audioCtx.currentTime);

            this.burnerGain = this.audioCtx.createGain();
            this.burnerGain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
            this.burnerGain.gain.exponentialRampToValueAtTime(0.35, this.audioCtx.currentTime + 0.3);

            whiteNoise.connect(filter);
            filter.connect(this.burnerGain);
            this.burnerGain.connect(this.audioCtx.destination);

            whiteNoise.start();
            this.burnerOsc = whiteNoise;
        } else {
            if (this.burnerGain && this.audioCtx) {
                this.burnerGain.gain.setValueAtTime(this.burnerGain.gain.value, this.audioCtx.currentTime);
                this.burnerGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);
                setTimeout(() => {
                    if (this.burnerOsc) {
                        this.burnerOsc.stop();
                        this.burnerOsc.disconnect();
                        this.burnerOsc = null;
                    }
                }, 200);
            }
        }
    }

    playSolidPour(duration = 1.4) {
        this.playSolidPourDry(duration);
    }
}

export const soundManager = new SoundManager();
