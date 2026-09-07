export class QuizEngine {
    constructor() {
        this.container = document.getElementById('educationalPanel');
        this.questions = [
            {
                q: "ما هي العملية الحيوية التي حدثت في الأنبوب 2 وأدت إلى زيادة الرقم الهيدروجيني (pH ~7.8) وتحول كاشف BTB إلى اللون الأزرق؟",
                options: [
                    "التنفس الخلوي فقط وإنتاج الأكسجين",
                    "البناء الضوئي واستهلاك ثاني أكسيد الكربون (CO2)",
                    "التحلل السكري وإنتاج حمض اللاكتيك",
                    "تبخر الكاشف بفعل حرارة المصباح"
                ],
                correct: 1
            },
            {
                q: "في الأنبوب 3 (المغطى بصندوق حجب الضوء)، لماذا انخفض الرقم الهيدروجيني (pH ~6.2) وتحول كاشف BTB إلى اللون الأصفر؟",
                options: [
                    "لأن النبات مات بسبب نقص الهواء وتفكك المحلول",
                    "لأن النبات قام بعملية البناء الضوئي سريداً في الظلام",
                    "لأن النبات قام بالتنفس الخلوي فقط وأنتج ثاني أكسيد الكربون (CO2) الذي يكوّن حمضاً ضعيفاً في الماء",
                    "لأن كاشف BTB يتلف كيميائياً في الظلام الدامس"
                ],
                correct: 2
            },
            {
                q: "ما هي المعادلة الكيميائية الصحيحة التي تمثل عملية البناء الضوئي (Photosynthesis)؟",
                options: [
                    "C6H12O6 + 6O2 ➔ 6CO2 + 6H2O + طاقة",
                    "6CO2 + 6H2O + ضوء ➔ C6H12O6 + 6O2",
                    "CO2 + H2O ➔ H2CO3",
                    "C6H12O6 ➔ 2C2H5OH + 2CO2"
                ],
                correct: 1
            },
            {
                q: "لماذا سجلت عينة الأنبوب 2 (الزرقاء) أعلى قيمة امتصاصية للضوء (Absorbance ~0.800) عند طول موجي 615 نانومتر؟",
                options: [
                    "لأن اللون الأصفر للأنبوب يمتص هذا الطول الموجي بقوة",
                    "لأن كاشف BTB في صورته القاعدية الزرقاء يمتص الضوء الأحمر/البرتقالي (حول 615 nm) بأعلى كفاءة",
                    "لأن الميكروبيبت نقل خلايا من أوراق نبات الإيلوديا حجب الضوء تماماً",
                    "لأن مطياف الضوء يكون أكثر حساسية للسوائل الباردة"
                ],
                correct: 1
            }
        ];
        
        this.selectedAnswers = Array(this.questions.length).fill(null);
        this.isSubmitted = false;

        this.render();
    }

    render() {
        if (!this.container) return;

        let html = `
            <div class="quiz-card">
                <h2 class="quiz-title"><i class="fas fa-book-open"></i> التقييم العلمي والمفاهيم الكيميائية</h2>
                
                <!-- Equations Display Section -->
                <div class="equations-section">
                    <h4>المعادلات الكيميائية الحيوية للتفاعل:</h4>
                    <div class="equations-grid">
                        <div class="formula-card">
                            <strong>1. عملية البناء الضوئي (Photosynthesis):</strong>
                            <code>6CO₂ + 6H₂O + Light Energy ➔ C₆H₁₂O₆ + 6O₂</code>
                            <p style="font-size:0.75rem; color:#15803d; margin-top:8px; font-weight:700;">يمتص النبات غاز ثاني أكسيد الكربون من الماء، مما يرفع الـ pH ويجعل كاشف BTB قاعدياً (أزرق).</p>
                        </div>
                        <div class="formula-card">
                            <strong>2. عملية التنفس الخلوي (Cellular Respiration):</strong>
                            <code>C₆H₁₂O₆ + 6O₂ ➔ 6CO₂ + 6H₂O + ATP Energy</code>
                            <p style="font-size:0.75rem; color:#b45309; margin-top:8px; font-weight:700;">ينتج النبات غاز ثاني أكسيد الكربون عند غياب الضوء، مما يذوب في الماء مكوناً حمض الكربونيك المخفف (أصفر).</p>
                        </div>
                    </div>
                </div>

                <!-- Questions List -->
                <div class="quiz-questions-list">
        `;

        this.questions.forEach((qData, qIdx) => {
            html += `
                <div class="question-item" id="q_item_${qIdx}">
                    <p>${qIdx + 1}. ${qData.q}</p>
                    <div class="options-grid">
            `;

            qData.options.forEach((optText, optIdx) => {
                let extraClass = '';
                if (this.selectedAnswers[qIdx] === optIdx) {
                    extraClass = 'selected';
                }

                if (this.isSubmitted) {
                    if (optIdx === qData.correct) {
                        extraClass = 'correct';
                    } else if (this.selectedAnswers[qIdx] === optIdx) {
                        extraClass = 'wrong';
                    }
                }

                html += `
                    <button type="button" class="option-btn ${extraClass}" 
                            data-qidx="${qIdx}" data-optidx="${optIdx}" 
                            ${this.isSubmitted ? 'disabled' : ''}>
                        ${optText}
                    </button>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += `
                </div>

                <!-- Submit Section -->
                <div class="submit-quiz-row">
                    ${this.isSubmitted ? '' : '<button type="button" class="btn-submit-quiz" id="btnSubmitQuiz">إرسال الإجابات وتقييم الأداء</button>'}
                </div>

                <!-- Score Board (Shown after submit) -->
                <div id="quizScoreCard" style="display:${this.isSubmitted ? 'block' : 'none'};">
                    <!-- Rendered in submission logic -->
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.initListeners();
    }

    initListeners() {
        // Option selection
        const optionBtns = this.container.querySelectorAll('.option-btn');
        optionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isSubmitted) return;
                const qIdx = parseInt(btn.getAttribute('data-qidx'));
                const optIdx = parseInt(btn.getAttribute('data-optidx'));

                this.selectedAnswers[qIdx] = optIdx;
                this.render();
            });
        });

        // Submit Quiz
        const btnSubmit = document.getElementById('btnSubmitQuiz');
        if (btnSubmit) {
            btnSubmit.addEventListener('click', () => {
                // Check if all answered
                if (this.selectedAnswers.includes(null)) {
                    alert("⚠️ الرجاء الإجابة على جميع الأسئلة الأربعة قبل الإرسال!");
                    return;
                }

                this.isSubmitted = true;
                this.render();
                this.calculateScore();
            });
        }
    }

    calculateScore() {
        let score = 0;
        this.questions.forEach((q, idx) => {
            if (this.selectedAnswers[idx] === q.correct) {
                score++;
            }
        });

        const pct = Math.round((score / this.questions.length) * 100);
        const scoreCard = document.getElementById('quizScoreCard');
        if (scoreCard) {
            scoreCard.style.display = 'block';
            scoreCard.className = 'quiz-score-card';
            scoreCard.innerHTML = `
                <h3>🎉 نتيجة التقييم العلمي للنشاط التفاعلي</h3>
                <p>درجتك هي: ${score} من أصل ${this.questions.length} (${pct}%)</p>
                <p style="font-size:0.85rem; margin-top:8px; color:#1e293b;">
                    ${pct === 100 ? 'أحسنت! إجاباتك نموذجية وتدل على فهم ممتاز للبناء الضوئي والتنفس الخلوي.' : 'لقد قمت بعمل رائع! يمكنك مراجعة الأسئلة الخاطئة بالأعلى ومقارنتها بالإجابات الخضراء لمعرفة التفسير الصحيح.'}
                </p>
                <button type="button" class="incubate-btn" style="margin-top:16px; max-width:200px;" onclick="window.location.reload()">إعادة إجراء التجربة 🔄</button>
            `;
        }

        // Scroll to score
        if (scoreCard) scoreCard.scrollIntoView({ behavior: 'smooth' });
    }
}
