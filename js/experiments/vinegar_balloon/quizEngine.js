/**
 * quizEngine.js
 * Observation and Scientific Knowledge Verification Engine
 * Clean Architecture - Single Responsibility
 */

import { soundManager } from './soundManager.js';

class QuizEngine {
    constructor() {
        this.selectedObservation = null;
        this.isCorrect = null;
    }

    init() {
        this.bindObservationOptions();
        this.bindQuantityQuiz();
    }

    bindObservationOptions() {
        const options = document.querySelectorAll('.obs-option-input');
        options.forEach(opt => {
            opt.addEventListener('change', (e) => {
                this.checkObservation(e.target.value);
            });
        });
    }

    checkObservation(value) {
        this.selectedObservation = value;
        const feedbackBox = document.getElementById('obsFeedbackBox');
        if (!feedbackBox) return;

        if (value === 'gas') {
            this.isCorrect = true;
            soundManager.playSuccess();
            feedbackBox.className = 'obs-feedback correct-feedback';
            feedbackBox.innerHTML = `
                <div class="feedback-title"><i class="fas fa-check-circle"></i> إجابة صحيحة وملاحظة دقيقة!</div>
                <div class="feedback-desc">
                    التفسير العلمي: تفاعل حمض الخليك (الأسيتيك) مع بيكربونات الصوديوم يؤدي إلى تحرير فوري لغاز ثاني أكسيد الكربون (CO₂)، وهو الذي شكل الفقاعات وتصاعد ليملأ تجويف البالون ويؤدي إلى تمدده وانتفاخه.
                </div>
            `;
        } else {
            this.isCorrect = false;
            soundManager.playClick();
            feedbackBox.className = 'obs-feedback incorrect-feedback';
            feedbackBox.innerHTML = `
                <div class="feedback-title"><i class="fas fa-times-circle"></i> ملاحظة غير دقيقة، حاول مجدداً!</div>
                <div class="feedback-desc">
                    ${value === 'color' ? 'لم يحدث تغير ملحوظ في لون السائل الشفاف.' : 'لم يتكوّن راسب صلب في قاع الزجاجة؛ بل حدث فوران وتصاعد لغاز CO₂.'}
                </div>
            `;
        }
        feedbackBox.style.display = 'block';
    }

    bindQuantityQuiz() {
        const quizBtn = document.getElementById('btnSubmitQuantityQuiz');
        if (quizBtn) {
            quizBtn.addEventListener('click', () => {
                const selected = document.querySelector('input[name="quantity_q1"]:checked');
                const resultDiv = document.getElementById('quantityQuizResult');
                if (!selected || !resultDiv) return;

                if (selected.value === 'increases') {
                    soundManager.playSuccess();
                    resultDiv.className = 'quiz-res correct';
                    resultDiv.innerHTML = '<i class="fas fa-check"></i> أحسنت! كلما زادت كمية المتفاعلات (الخل والبيكربونات) زادت كمية الغاز الناتجة (مولات CO₂) وبالتالي يزداد قطر وتمدد البالون.';
                } else {
                    soundManager.playClick();
                    resultDiv.className = 'quiz-res incorrect';
                    resultDiv.innerHTML = '<i class="fas fa-times"></i> إجابة غير صحيحة. زيادة المواد المتفاعلة تعطي نواتج أكثر من غاز ثاني أكسيد الكربون.';
                }
                resultDiv.style.display = 'block';
            });
        }
    }

    reset() {
        this.selectedObservation = null;
        this.isCorrect = null;
        const options = document.querySelectorAll('.obs-option-input');
        options.forEach(opt => opt.checked = false);
        const feedbackBox = document.getElementById('obsFeedbackBox');
        if (feedbackBox) {
            feedbackBox.style.display = 'none';
            feedbackBox.className = 'obs-feedback';
        }
    }
}

export const quizEngine = new QuizEngine();
