// js/experiments/photosynthesis/tubeEngine.js
// موديول المحاكاة الحيوية للأنابيب والتوزيع العشوائي للنبات والصناديق وتغير الألوان والامتصاص

class TubeEngine {
    constructor() {
        // الألوان القياسية لكاشف بروموثيمول الأزرق (BTB)
        this.COLOR_GREEN = 0x15803d;  // متعادل (pH ~ 7.0)
        this.COLOR_BLUE = 0x1d4ed8;   // قاعدي بفعل البناء الضوئي (pH ~ 7.8)
        this.COLOR_YELLOW = 0xca8a04; // حمضي بفعل التنفس الخلوي (pH ~ 6.2)
    }

    // التحقق من إمكانية وضع نبات في الأنبوب (الضابطة محظورة)
    canAcceptPlant(tubeGroup) {
        if (!tubeGroup || !tubeGroup.userData) return false;
        if (tubeGroup.userData.id === 'Blank') return false;
        return !tubeGroup.userData.hasPlant;
    }

    // التحقق من إمكانية تغطية الأنبوب بالصندوق (الضابطة محظورة)
    canAcceptBox(tubeGroup) {
        if (!tubeGroup || !tubeGroup.userData) return false;
        if (tubeGroup.userData.id === 'Blank') return false;
        return !tubeGroup.userData.hasBox;
    }

    // توليد انحراف عشوائي واقعي في خانتي المئة والألف (±0.015 إلى ±0.020)
    getThousandthsNoise() {
        return parseFloat(((Math.floor(Math.random() * 41) - 20) * 0.001).toFixed(3));
    }

    // تقييم التفاعلات الحيوية بعد فترة الحضانة (12 ساعة) لكافة الأنابيب ديناميكياً
    evaluateTubesAfterIncubation(tubes, blankRawAbsorbance) {
        return tubes.map((tubeObj, idx) => {
            const group = tubeObj.group;
            const hasPlant = Boolean(group.userData.hasPlant);
            const hasBox = Boolean(group.userData.hasBox);

            let baseAbs = 0.48;
            let colorHex = this.COLOR_GREEN;
            let phValue = 7.0;

            if (hasPlant && !hasBox) {
                // نبات + ضوء (غير مغطاة) -> بناء ضوئي -> أزرق -> 0.97
                baseAbs = 0.970;
                colorHex = this.COLOR_BLUE;
                phValue = 7.8;
            } else if (hasPlant && hasBox) {
                // نبات + ظلام (مغطاة) -> تنفس خلوي -> أصفر -> 0.125
                baseAbs = 0.125;
                colorHex = this.COLOR_YELLOW;
                phValue = 6.2;
            } else if (!hasPlant && !hasBox) {
                // بدون نبات + ضوء (غير مغطاة) -> ضابطة ضوء -> أخضر -> 0.48
                baseAbs = 0.480;
                colorHex = this.COLOR_GREEN;
                phValue = 7.0;
            } else {
                // بدون نبات + ظلام (مغطاة) -> ضابطة ظلام -> أخضر -> 0.51
                baseAbs = 0.510;
                colorHex = this.COLOR_GREEN;
                phValue = 7.0;
            }

            // إضافة التفاوت في خانة الألف
            const noise = this.getThousandthsNoise();
            const finalAbs = parseFloat((baseAbs + noise).toFixed(3));
            const rawAbs = parseFloat((finalAbs + (blankRawAbsorbance || 0.440)).toFixed(3));

            // تحديث مجسم السائل في المشهد
            if (tubeObj.fluidMat) {
                tubeObj.fluidMat.color.setHex(colorHex);
            }

            // تحديث بيانات الأنبوب
            group.userData.phValue = phValue;
            group.userData.absorbanceVal = finalAbs;
            group.userData.rawAbsorbance = rawAbs;
            group.userData.evaluatedColor = colorHex;

            const hexStr = '#' + colorHex.toString(16).padStart(6, '0');
            return {
                index: idx + 1,
                hasPlant,
                hasBox,
                color: colorHex,
                colorHex: hexStr,
                ph: phValue,
                phValue,
                absorbanceVal: finalAbs,
                rawAbsorbance: rawAbs
            };
        });
    }
}

if (typeof window !== 'undefined') {
    window.TubeEngine = TubeEngine;
}
