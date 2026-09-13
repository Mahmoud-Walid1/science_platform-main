/**
 * variableManager.js
 * Manages reactant quantities (Vinegar volume & Baking soda scoops)
 * and computes stoichometric CO2 gas production & balloon inflation scale.
 * Clean Architecture - Single Responsibility
 */

class VariableManager {
    constructor() {
        this.vinegarVolume = 100; // mL
        this.bakingSodaSpoons = 1; // scoop (~5g)
        this.listeners = [];
    }

    setVinegar(vol) {
        this.vinegarVolume = Number(vol);
        this.notify();
    }

    setSodaSpoons(spoons) {
        this.bakingSodaSpoons = Number(spoons);
        this.notify();
    }

    // حساب كمية الغاز المتولد وحجم انتفاخ البالون
    // تفاعل: CH3COOH + NaHCO3 -> CH3COONa + H2O + CO2
    getCalculation() {
        // تركيز الخل التجاري تقريباً 0.8 M (حوالي 5% حمض الأسيتيك)
        const vinegarMoles = (this.vinegarVolume / 1000) * 0.85; 
        // ملعقة الكربونات حوالي 5g، والكتلة المولية لـ NaHCO3 هي 84 g/mol
        const sodaMoles = (this.bakingSodaSpoons * 5.0) / 84.0;

        // المادة المحددة للتفاعل (Limiting Reactant)
        const co2Moles = Math.min(vinegarMoles, sodaMoles);
        const co2VolumeLiters = (co2Moles * 24.5).toFixed(2); // الحجم المولي 24.5 لتر

        // معامل تمدد البالون بالنسبة للحجم
        // 1 ملعقة + 50 مل -> scale = 0.8
        // 2 ملعقة + 100 مل -> scale = 1.2
        // 3 ملاعق + 150 مل -> scale = 1.6
        const baseFactor = (this.vinegarVolume / 100) * 0.6 + (this.bakingSodaSpoons / 2) * 0.6;
        const balloonScale = Math.min(1.85, Math.max(0.65, baseFactor));

        let limitingAgent = '';
        if (vinegarMoles < sodaMoles) {
            limitingAgent = 'الخل هو المادة المحددة للتفاعل (توجد كمية فائضة من الكربونات لم تتفاعل)';
        } else if (sodaMoles < vinegarMoles) {
            limitingAgent = 'بيكربونات الصوديوم هي المادة المحددة للتفاعل (نفدت الكربونات بالكامل)';
        } else {
            limitingAgent = 'تفاعل متكافئ بنسب متساوية تماماً';
        }

        return {
            co2Liters: co2VolumeLiters,
            scale: balloonScale,
            limitingAgent: limitingAgent,
            liquidHeightPx: Math.min(130, 40 + (this.vinegarVolume / 150) * 80)
        };
    }

    subscribe(fn) {
        this.listeners.push(fn);
    }

    notify() {
        const data = this.getCalculation();
        this.listeners.forEach(fn => fn(data));
    }
}

export const variableManager = new VariableManager();
