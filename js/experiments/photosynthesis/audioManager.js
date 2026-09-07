// ══════════════════════════════════════════════════════════════
// audioManager.js - محرك المؤثرات الصوتية المعملية التفاعلية
// مختبر البناء الضوئي والتنفس الخلوي | Clean Architecture
// ══════════════════════════════════════════════════════════════

class LabAudioManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.initOnUserGesture();
    }

    initAudioContext() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    initOnUserGesture() {
        const unlock = () => {
            this.initAudioContext();
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    // --- مساعد داخلي لإنشاء عقدة صوتية بسيطة ---
    _tone(freq, type, gainVal, duration, startOffset = 0) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime + startOffset;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(gainVal, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + duration + 0.01);
    }

    // 1. صوت نزع وتركيب السدادات المطاطية (Cork Pop - نقرة مميزة)
    playPop() {
        if (this.isMuted) return;
        this.initAudioContext();
        if (!this.ctx) return;
        this._tone(280, 'sine', 0.5, 0.06);
        this._tone(140, 'triangle', 0.3, 0.08, 0.03);
    }

    // 2. صوت وضع نبات في الماء (Splash - رشة ماء)
    playSplash() {
        if (this.isMuted) return;
        this.initAudioContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // ضجيج أبيض مُشكَّل يشبه رشة الماء
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 0.8;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(now);
        src.stop(now + 0.26);
    }

    // 3. صوت وضع الصندوق الكرتوني (Cardboard Thud - دقة ثقيلة)
    playThud() {
        if (this.isMuted) return;
        this.initAudioContext();
        if (!this.ctx) return;
        this._tone(80, 'triangle', 0.6, 0.18);
        this._tone(55, 'sine', 0.4, 0.22, 0.02);
    }

    // 4. صوت تكة مفتاح الإضاءة الجداري (Light Switch Click)
    playSwitch() {
        if (this.isMuted) return;
        this.initAudioContext();
        if (!this.ctx) return;
        this._tone(1100, 'square', 0.2, 0.02);
        this._tone(700, 'square', 0.15, 0.025, 0.018);
    }

    // 5. صوت طقطقة قرص ضبط الماصة (Pipette Dial Click)
    playPipetteClick() {
        if (this.isMuted) return;
        this.initAudioContext();
        if (!this.ctx) return;
        this._tone(1800, 'sine', 0.25, 0.025);
        this._tone(1200, 'sine', 0.15, 0.03, 0.015);
    }

    // 6. صوت سحب / تفريغ السائل بالماصة (Liquid Aspiration)
    playAspirate() {
        if (this.isMuted) return;
        this.initAudioContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.linearRampToValueAtTime(480, now + 0.15);
        osc.frequency.linearRampToValueAtTime(320, now + 0.25);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.29);
    }

    // 7. صفارة جهاز مقياس الطيف الضوئي (Spectro Beep)
    playBeep() {
        if (this.isMuted) return;
        this.initAudioContext();
        if (!this.ctx) return;
        this._tone(880, 'sine', 0.22, 0.1);
        this._tone(1320, 'sine', 0.12, 0.06, 0.08);
    }

    // 8. جرس إنجاز الخطوة - واضح ومميز (Step Completion Bell)
    playChime() {
        if (this.isMuted) return;
        this.initAudioContext();
        if (!this.ctx) return;
        // نغمة جرس ثلاثية صاعدة مميزة
        const notes = [
            { freq: 523.25, gain: 0.3,  delay: 0.00 },  // C5
            { freq: 659.25, gain: 0.28, delay: 0.12 },  // E5
            { freq: 783.99, gain: 0.26, delay: 0.24 },  // G5
        ];
        notes.forEach(({ freq, gain, delay }) => {
            const t = this.ctx.currentTime + delay;
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gainNode.gain.setValueAtTime(gain, t);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
            // إضافة نبضة ثانية لصوت الجرس الطبيعي
            const osc2 = this.ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(freq * 2, t);
            const g2 = this.ctx.createGain();
            g2.gain.setValueAtTime(gain * 0.4, t);
            g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
            osc.connect(gainNode); gainNode.connect(this.ctx.destination);
            osc2.connect(g2); g2.connect(this.ctx.destination);
            osc.start(t); osc.stop(t + 0.56);
            osc2.start(t); osc2.stop(t + 0.31);
        });
    }
}

if (typeof window !== 'undefined') {
    window.LabAudioManager = LabAudioManager;
}
