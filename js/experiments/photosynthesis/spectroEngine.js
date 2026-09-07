// js/experiments/photosynthesis/spectroEngine.js
// وحدة إدارة مقياس الطيف الضوئي وحساب الامتصاصية والتصفير المعملي

class SpectroEngine {
    constructor() {
        this.isOn = false;
        this.wavelength = 350;
        this.isZeroed = false;
        this.isZeroedWithBlank = false;
        this.zeroCalibrationOffset = 0.0;

        // التفاوت العشوائي في خانتي المئة والألف للأنبوبة الضابطة قبل التصفير (~0.44)
        const blankNoise = (Math.floor(Math.random() * 31) - 15) * 0.001;
        this.blankRawAbsorbance = parseFloat((0.440 + blankNoise).toFixed(3));
    }

    setWavelength(wl) {
        this.wavelength = parseInt(wl, 10) || 350;
    }

    togglePower() {
        this.isOn = !this.isOn;
        return this.isOn;
    }

    zero(isBlank) {
        return this.performZero(isBlank ? { id: 'Blank', userData: { id: 'Blank' } } : null);
    }

    // تصفير الجهاز بناءً على ما هو موجود في حجرة القياس حالياً
    performZero(cuvetteInChamber) {
        this.isZeroed = true;

        if (cuvetteInChamber && (cuvetteInChamber.userData?.id === 'Blank' || cuvetteInChamber.id === 'Blank')) {
            // تصفير صحيح بالأنبوبة الضابطة
            this.zeroCalibrationOffset = this.blankRawAbsorbance;
            this.isZeroedWithBlank = true;
            return {
                success: true,
                isBlank: true,
                offset: this.zeroCalibrationOffset,
                message: "✓ تم تصفير مقياس الطيف بنجاح بالأنبوبة الضابطة (0.000 Abs)"
            };
        } else if (cuvetteInChamber) {
            // تصفير خاطئ على عينة أخرى
            const cuvRaw = cuvetteInChamber.userData?.rawAbsorbance || cuvetteInChamber.rawAbsorbance || 0.500;
            this.zeroCalibrationOffset = cuvRaw;
            this.isZeroedWithBlank = false;
            return {
                success: true,
                isBlank: false,
                offset: this.zeroCalibrationOffset,
                message: "⚠️ تم التصفير على عينة تجريبية! القراءات التالية ستكون غير دقيقة."
            };
        } else {
            // تصفير على حجرة فارغة (هواء)
            this.zeroCalibrationOffset = 0.000;
            this.isZeroedWithBlank = false;
            return {
                success: true,
                isBlank: false,
                offset: 0.0,
                message: "⚠️ تم التصفير على حجرة فارغة (هواء)! لم يتم ضبط صفر الأنبوبة الضابطة."
            };
        }
    }

    // قياس الامتصاصية للكيوفيت الموجودة بالحجرة
    measureAbsorbance(cuvette) {
        if (!this.isOn) {
            return { text: "OFF", value: null };
        }

        if (!cuvette) {
            // عند إخراج الكيوفيت الضابطة أو عدم وجود عينة بالحجرة، تبقى القراءة صفر (0.000) بدقة
            return { text: "0.000", value: 0.000 };
        }

        const id = cuvette.userData?.id || cuvette.id;

        if (id === 'Blank') {
            if (!this.isZeroed) {
                // تظهر .44 مع التفاوت في الألف قبل التصفير
                return { text: this.blankRawAbsorbance.toFixed(3), value: this.blankRawAbsorbance };
            }
            if (this.isZeroedWithBlank) {
                return { text: "0.000", value: 0.000 };
            }
            const val = this.blankRawAbsorbance - this.zeroCalibrationOffset;
            return { text: val.toFixed(3), value: val };
        }

        // العينات 1، 2، 3، 4
        const raw = cuvette.userData?.rawAbsorbance || cuvette.rawAbsorbance || 0.500;
        let displayedVal;

        if (this.isZeroed) {
            displayedVal = raw - this.zeroCalibrationOffset;
        } else {
            // قبل التصفير، يعرض القيمة الخام (تشمل امتصاص الضابطة)
            displayedVal = raw;
        }

        return {
            text: displayedVal.toFixed(3),
            value: displayedVal
        };
    }
}

if (typeof window !== 'undefined') {
    window.SpectroEngine = SpectroEngine;
}
