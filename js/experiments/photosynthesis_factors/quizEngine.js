// js/experiments/photosynthesis_factors/quizEngine.js
import { soundManager } from './soundManager.js';

export class QuizEngine {
    constructor() {
        this.questions = [
            {
                id: 1,
                text: "ما سبب طفو أقراص أوراق السبانخ إلى سطح المحلول عند تسليط الضوء عليها؟",
                options: [
                    "امتصاص الماء داخل الفراغات الهوائية للورقة",
                    "تراكم غاز الأكسجين (O₂) الناتج عن عملية البناء الضوئي مما يزيد قوة الطفو",
                    "تفكك نسيج الورقة الإسفنجي بفعل الحرارة",
                    "تبخر محاليل بيكربونات الصوديوم"
                ],
                correct: 1,
                explanation: "عند حدوث البناء الضوئي ينطلق غاز الأكسجين وتتجمع فقاعاته داخل الفراغات الهوائية بنسيج الورقة، فيقل متوسط كثافتها وتكتسب قوة طفو تدفعها للأعلى."
            },
            {
                id: 2,
                text: "ماذا يحدث للون كاشف بيكربونات الهيدروجين عند وضع نبات مائي معه في أنبوب معرّض للضوء المباشر؟",
                options: [
                    "يتحول للون الأصفر بسبب انخفاض الـ pH",
                    "يتحول للون الأرجواني/البنفسجي بسبب استهلاك CO₂ وارتفاع الـ pH",
                    "يتحول للون الأبيض الشفاف",
                    "يظل باللون البرتقالي كما هو بدون تغيير"
                ],
                correct: 1,
                explanation: "في وجود الضوء، يستهلك النبات غاز CO₂ في البناء الضوئي بمعدل أسرع من إنتاجه بالتنفس، فيقل حمض الكربونيك ويرتفع الـ pH (أكبر من 9.2) فيتحول الكاشف للون البنفسجي."
            },
            {
                id: 3,
                text: "حسب قانون التربيع العكسي (Inverse Square Law)، إذا تم مضاعفة المسافة بين المصباح ونبات الإيلوديا من 20cm إلى 40cm، فإن شدة الإضاءة تقل إلى:",
                options: [
                    "النصف (1/2)",
                    "الربع (1/4)",
                    "الثمن (1/8)",
                    "تتضاعف مرتين"
                ],
                correct: 1,
                explanation: "تتناسب شدة الضوء عكسياً مع مربع المسافة (I ∝ 1/d²). عند مضاعفة المسافة 2x تصبح الشدة 1/(2²) = 1/4 الشدة الأصلية."
            },
            {
                id: 4,
                text: "لماذا ينخفض معدل البناء الضوئي حاداً عند رفع درجة الحرارة فوق 45°C في تجارب بلاكمان؟",
                options: [
                    "بسبب تفكك مركب بيكربونات الصوديوم",
                    "بسبب التلف الإنزيمي وتغير طبيعة إنزيمات تثبيت CO₂ (Denaturation)",
                    "بسبب انعدام الضوء",
                    "بسبب زيادة ذوبان الأكسجين"
                ],
                correct: 1,
                explanation: "إنزيمات تثبيت CO₂ (مثل إنزيم روبيسكو) هي بروتينات تتلف وتتغير بنيتها الفراغية (Denaturation) عند درجات الحرارة العالية فوق 40°C-45°C."
            },
            {
                id: 5,
                text: "ما الدور الأساسي لإضافة بيكربونات الصوديوم (NaHCO₃) للماء في تجارب البناء الضوئي؟",
                options: [
                    "تزويد المحلول بمركب ثاني أكسيد الكربون (CO₂) الذائب اللازم لتفاعلات الظلام",
                    "تسريع امتصاص الضوء الأخضر",
                    "تخفيض درجة حرارة الماء",
                    "زيادة إنتاج النشا في الجذور"
                ],
                correct: 0,
                explanation: "تتحلل بيكربونات الصوديوم NaHCO₃ في الماء مطلقةً غاز CO₂ الذائب، والذي يعتبر المصدر الرئيسي للكربون اللازم لبناء مركب الجلوكوز في دورة كالفن."
            }
        ];

        this.userAnswers = {};
    }

    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.renderQuiz(container);
    }

    renderQuiz(container) {
        let html = `
            <div style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">
                <div class="quiz-header-card">
                    <h2 style="color: #002855; font-size: 1.25rem; font-weight: 800; margin-bottom: 8px; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-graduation-cap" style="color: #10b981;"></i> اختبار وتقييم مفاهيم العوامل المؤثرة على البناء الضوئي
                    </h2>
                    <p style="color: #475569; font-size: 0.9rem;">أجب على الأسئلة التالية لاختبار فهمك للتجارب المعملية والتفاعلات الكيميائية:</p>
                </div>
        `;

        this.questions.forEach((q, idx) => {
            html += `
                <div class="quiz-card">
                    <h3 style="font-size: 1rem; color: #002855; margin-bottom: 14px; font-weight: 800;">
                        السؤال ${idx + 1}: ${q.text}
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
            `;

            q.options.forEach((opt, optIdx) => {
                const isSelected = this.userAnswers[q.id] === optIdx;
                const isAnswered = this.userAnswers[q.id] !== undefined;

                let optClass = 'quiz-opt';
                let icon = '';

                if (isAnswered) {
                    if (optIdx === q.correct) {
                        optClass += ' correct';
                        icon = '<i class="fas fa-check-circle" style="color: #059669; margin-left: 8px;"></i>';
                    } else if (isSelected && optIdx !== q.correct) {
                        optClass += ' incorrect';
                        icon = '<i class="fas fa-times-circle" style="color: #dc2626; margin-left: 8px;"></i>';
                    }
                }

                html += `
                    <div class="${optClass}" data-qid="${q.id}" data-oid="${optIdx}">
                        ${icon} ${opt}
                    </div>
                `;
            });

            if (this.userAnswers[q.id] !== undefined) {
                html += `
                    <div class="quiz-explanation">
                        <strong>الشرح العلمي:</strong> ${q.explanation}
                    </div>
                `;
            }

            html += `</div></div>`;
        });

        html += `</div>`;
        container.innerHTML = html;

        // Bind Option Clicks
        container.querySelectorAll('.quiz-opt').forEach(el => {
            el.addEventListener('click', (e) => {
                const qid = parseInt(el.getAttribute('data-qid'));
                const oid = parseInt(el.getAttribute('data-oid'));

                if (this.userAnswers[qid] === undefined) {
                    this.userAnswers[qid] = oid;

                    const q = this.questions.find(item => item.id === qid);
                    if (q && oid === q.correct) {
                        soundManager.playSuccess();
                    } else {
                        soundManager.playBeep(300, 0.2);
                    }

                    this.renderQuiz(container);
                }
            });
        });
    }
}
