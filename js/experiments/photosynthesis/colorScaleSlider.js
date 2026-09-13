// js/experiments/photosynthesis/colorScaleSlider.js
// موديول مقياس وسلايدر الألوان والـ pH المصفى (منع تشابه الألوان وإتاحة التحديد التفاعلي)

(function () {
    'use strict';

    // الألوان الستة المتمايزة علمياً وبصرياً (مختصرة وأنيقة لمنع كسر أو تمدد التصميم)
    const BTB_COLOR_STOPS = [
        {
            index: 0,
            ph: 6.0,
            colorKey: 'yellow',
            label: 'أصفر',
            phDisplay: 'pH 6.0',
            hex: '#facc15',
            badgeBg: '#fef08a',
            badgeText: '#854d0e',
            category: 'acidic'
        },
        {
            index: 1,
            ph: 6.4,
            colorKey: 'lime',
            label: 'ليموني',
            phDisplay: 'pH 6.4',
            hex: '#84cc16',
            badgeBg: '#ecfccb',
            badgeText: '#3f6212',
            category: 'transitional'
        },
        {
            index: 2,
            ph: 7.0,
            colorKey: 'green',
            label: 'أخضر',
            phDisplay: 'pH 7.0',
            hex: '#16a34a',
            badgeBg: '#dcfce7',
            badgeText: '#166534',
            category: 'neutral'
        },
        {
            index: 3,
            ph: 7.3,
            colorKey: 'teal',
            label: 'تيل',
            phDisplay: 'pH 7.3',
            hex: '#06b6d4',
            badgeBg: '#cffafe',
            badgeText: '#0e7490',
            category: 'transitional'
        },
        {
            index: 4,
            ph: 7.8,
            colorKey: 'blue',
            label: 'أزرق',
            phDisplay: 'pH 7.8',
            hex: '#2563eb',
            badgeBg: '#dbeafe',
            badgeText: '#1e40af',
            category: 'basic'
        },
        {
            index: 5,
            ph: 10.0,
            colorKey: 'violet',
            label: 'بنفسجي',
            phDisplay: 'pH 10+',
            hex: '#7c3aed',
            badgeBg: '#ede9fe',
            badgeText: '#5b21b6',
            category: 'strong-basic'
        }
    ];

    class ColorScaleSliderManager {
        constructor() {
            this.stops = BTB_COLOR_STOPS;
            // التهيئة التلقائية بالقيم المعيارية لمنع بقاء القيمة null
            this.selections = {
                1: this.stops[2], // أخضر متعادل
                2: this.stops[4], // أزرق قاعدي
                3: this.stops[0], // أصفر حمضي
                4: this.stops[2]  // أخضر متعادل
            };
            this.touched = { 1: false, 2: false, 3: false, 4: false };

            // المزامنة التلقائية فور اكتمال تحميل الصفحة
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initAllSliders());
            } else {
                setTimeout(() => this.initAllSliders(), 50);
            }
        }

        initAllSliders() {
            [1, 2, 3, 4].forEach(tubeNum => {
                const stop = this.selections[tubeNum];
                if (stop) {
                    this.updateBadgeElement(`sidebar_ph_badge_${tubeNum}`, stop);
                    this.updateBadgeElement(`notebook_ph_badge_${tubeNum}`, stop);

                    const sideRange = document.getElementById(`sidebar_slider_${tubeNum}`);
                    if (sideRange) {
                        sideRange.value = stop.index;
                        this.updateThumbColor(sideRange, stop.hex);
                    }

                    const modalRange = document.getElementById(`modal_slider_${tubeNum}`);
                    if (modalRange) {
                        modalRange.value = stop.index;
                        this.updateThumbColor(modalRange, stop.hex);
                    }
                }
            });
        }

        getStop(index) {
            const idx = Math.max(0, Math.min(this.stops.length - 1, parseInt(index, 10)));
            return this.stops[idx];
        }

        // تحديث قيمة الأنبوب ومزامنة الواجهتين (الشريط الجانبي ونافذة الملاحظات)
        setTubeSelection(tubeNum, stopIndex, source) {
            const stop = this.getStop(stopIndex);
            this.selections[tubeNum] = stop;
            this.touched[tubeNum] = true;

            // 1. تحديث عناصر الشريط الجانبي
            this.updateBadgeElement(`sidebar_ph_badge_${tubeNum}`, stop);
            const sideRange = document.getElementById(`sidebar_slider_${tubeNum}`);
            if (sideRange) {
                if (source !== 'sidebar') sideRange.value = stop.index;
                this.updateThumbColor(sideRange, stop.hex);
            }

            // 2. تحديث عناصر نافذة دفتر الملاحظات (Modal)
            this.updateBadgeElement(`notebook_ph_badge_${tubeNum}`, stop);
            const modalRange = document.getElementById(`modal_slider_${tubeNum}`);
            if (modalRange) {
                if (source !== 'modal') modalRange.value = stop.index;
                this.updateThumbColor(modalRange, stop.hex);
            }

            return stop;
        }

        updateBadgeElement(elementId, stop) {
            const el = document.getElementById(elementId);
            if (!el) return;
            el.innerHTML = `<span class="ph-badge-dot" style="background:${stop.hex};"></span> <bdi>${stop.label}</bdi> <bdi dir="ltr">(${stop.phDisplay})</bdi>`;
            el.style.background = stop.badgeBg;
            el.style.color = stop.badgeText;
            el.style.borderColor = stop.hex;
        }

        updateThumbColor(rangeEl, hex) {
            rangeEl.style.setProperty('--current-thumb-color', hex);
        }

        areAllTubesSelected() {
            return [1, 2, 3, 4].every(n => this.selections[n] !== null);
        }

        // تقييم مدى صحة التقدير العلمي (نطاق القبول المتسامح)
        validateScientificSelections() {
            // أنبوب 1: كاشف فقط + ضوء -> أخضر متعادل (مؤشر 2 أو مجاوره 1-3)
            const t1 = this.selections[1];
            const t1Ok = t1 && (t1.index === 2 || t1.index === 1 || t1.index === 3);

            // أنبوب 2: كاشف + نبات + ضوء -> أزرق قاعدي (مؤشر 4 أو 3 أو 5)
            const t2 = this.selections[2];
            const t2Ok = t2 && (t2.index === 4 || t2.index === 3 || t2.index === 5);

            // أنبوب 3: كاشف + نبات + ظلام -> أصفر حمضي (مؤشر 0 أو 1)
            const t3 = this.selections[3];
            const t3Ok = t3 && (t3.index === 0 || t3.index === 1);

            // أنبوب 4: كاشف فقط + ظلام -> أخضر متعادل (مؤشر 2 أو 1 أو 3)
            const t4 = this.selections[4];
            const t4Ok = t4 && (t4.index === 2 || t4.index === 1 || t4.index === 3);

            return {
                valid: t1Ok && t2Ok && t3Ok && t4Ok,
                details: { 1: t1Ok, 2: t2Ok, 3: t3Ok, 4: t4Ok }
            };
        }
    }

    // تصدير كائن عام
    window.ColorScaleSliderManager = ColorScaleSliderManager;
    window.btbColorScaleSlider = new ColorScaleSliderManager();
})();
