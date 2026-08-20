/**
 * Quiz & Educational Engine Module for Mixture Separation
 * Manages concepts, physical properties table, interactive quiz, and scoring.
 */

export class QuizEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentQuestion = 0;
        this.score = 0;
        this.answered = false;

        this.questions = [
            {
                id: 1,
                question: "ما الخاصية الفيزيائية التي تعتمد عليها طريقة الجذب المغناطيسي لفصل المخاليط؟",
                options: [
                    { text: "اختلاف حجم الحبيبات", correct: false },
                    { text: "الخاصية المغناطيسية (انجذاب الفلزات للحديد)", correct: true },
                    { text: "اختلاف درجة الغليان", correct: false },
                    { text: "اختلاف الكثافة بين السوائل", correct: false }
                ],
                explanation: "المغناطيس يجذب المواد المغناطيسية فقط (مثل برادة الحديد) ويترك المواد غير المغناطيسية مثل الرمل أو الحصى."
            },
            {
                id: 2,
                question: "عند فصل مخلوط غير متجانس مكون من (الزيت + الماء)، ما الأداة المناسبة وما الخاصية الفيزيائية المعتمدة؟",
                options: [
                    { text: "ورقة الترشيح (حجم الجسيمات)", correct: false },
                    { text: "موقد التبخير (درجة الغليان)", correct: false },
                    { text: "قمع الفصل (اختلاف الكثافة وعدم الامتزاج)", correct: true },
                    { text: "الغربال المعملي (الحجم)", correct: false }
                ],
                explanation: "الزيت أقل كثافة من الماء فيطفو على السطح، وتسمح صنبور قمع الفصل بتصريف السائل الأثقل كثافة (الماء) أولاً."
            },
            {
                id: 3,
                question: "ما الخاصية الفيزيائية المستخدمة لفصل الرمل عن الماء باستخدام ورقة الترشيح؟",
                options: [
                    { text: "الخاصية المغناطيسية", correct: false },
                    { text: "عدم الذوبانية وحجم حبيبات الرمل الأكبر من مسام الورقة", correct: true },
                    { text: "اختلاف درجة الانصهار", correct: false },
                    { text: "سرعة التبخر", correct: false }
                ],
                explanation: "الرمل مادة صلبة غير ذائبة في الماء، وحجم حبيباتها أكبر من مسامات ورقة الترشيح فيتم احتجازها كراسب."
            },
            {
                id: 4,
                question: "ما المادة الصلبة التي تتبقى على شبكة الغربال عند غربلة مخلوط مكون من (حصى + رمل + ماء)؟",
                options: [
                    { text: "الرمل فقط", correct: false },
                    { text: "الحصى فقط (لأن حجم حبيباته أكبر من ثقوب الغربال)", correct: true },
                    { text: "الماء فقط", correct: false },
                    { text: "ينفذ الحصى والرمل معاً", correct: false }
                ],
                explanation: "ثقوب الغربال تسمح بنفاذ الجسيمات الصغيرة (الرمل والماء) وتحتجز الجسيمات الكبيرة (الحصى)."
            },
            {
                id: 5,
                question: "عند فصل الملح الذائب في الماء باستخدام موقد التبخير، كيف تنجح هذه العملية؟",
                options: [
                    { text: "بسبب انجذاب الملح للموقد", correct: false },
                    { text: "بسبب ترشيح الملح", correct: false },
                    { text: "تبخر الماء عند درجة غليانه (100°C) وبقاء بلورات الملح الصلبة ذات درجة الغليان العالية جداً", correct: true },
                    { text: "طفو الملح فوق سطح الماء", correct: false }
                ],
                explanation: "الماء يتحول إلى بخار بالحرارة بينما يتبقى الملح الصلب ناصع البياض في القاع لشدة ثباته الحراري."
            }
        ];
    }

    init() {
        if (!this.container) return;
        this.renderLayout();
        this.bindEvents();
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="edu-wrapper">
                <!-- Banner Title -->
                <div class="edu-header-card">
                    <div class="edu-header-icon"><i class="fas fa-graduation-cap"></i></div>
                    <div class="edu-header-info">
                        <h2>المفاهيم والخواص الفيزيائية والتقييم الختامي</h2>
                        <p>دليل المعلم والطالب للخصائص الفيزيائية والاختبار التفاعلي الشامل</p>
                    </div>
                </div>

                <!-- Tabs Menu -->
                <div class="edu-tabs-nav">
                    <button type="button" class="edu-tab-btn active" data-edutab="concepts">
                        <i class="fas fa-atom"></i> <span>المفاهيم الكيميائية</span>
                    </button>
                    <button type="button" class="edu-tab-btn" data-edutab="table">
                        <i class="fas fa-table-list"></i> <span>جدول الخصائص الخمس</span>
                    </button>
                    <button type="button" class="edu-tab-btn" data-edutab="quiz">
                        <i class="fas fa-clipboard-check"></i> <span>اختبر فهمك التفاعلي</span>
                    </button>
                </div>

                <!-- Panel 1: Concepts -->
                <div class="edu-panel active" id="eduPanelConcepts">
                    <div class="concept-cards-grid">
                        <div class="concept-card">
                            <div class="concept-card-title"><i class="fas fa-flask"></i> المادة والمادة النقية</div>
                            <p><strong>المادة:</strong> كل ما له كتلة ويشغل حيزًا من الفراغ.</p>
                            <p><strong>المادة النقية:</strong> مادة تتكون من نوع واحد فقط من الجسيمات وذات تركيب ثابت ومحدد مثل: (الماء المقطر، حديد خالص، ملح طعام نقي).</p>
                        </div>
                        <div class="concept-card">
                            <div class="concept-card-title"><i class="fas fa-vial-circle-check"></i> المخلوط ولماذا يمكن فصله؟</div>
                            <p><strong>المخلوط:</strong> امتزاج مادتين أو أكثر بنسب مختلفة دون حدوث تفاعل كيميائي، حيث تحتفظ كل مادة بخصائصها الأصلية كاملة.</p>
                            <p><strong>سبب إمكانية الفصل:</strong> لأن المواد المكونة للمخلوط تختلف في خواصها الفيزيائية (الحجم، الكثافة، الذوبانية، المغناطيسية، درجة الغليان)، وتعتمد كل طريقة فصل على خاصية محددة.</p>
                        </div>
                        <div class="concept-card">
                            <div class="concept-card-title"><i class="fas fa-layer-group"></i> المخلوط المتجانس والغير متجانس</div>
                            <p><strong>المخلوط المتجانس (المحلول):</strong> امتزاج تام تذوب فيه المكونات ولا يمكن تمييزها بالعين مثل (الماء والملح). يفصل بالتبخير.</p>
                            <p><strong>المخلوط غير المتجانس:</strong> مادتان أو أكثر غير ممتزجتين ويمكن رؤية المكونات بالعين مثل (الزيت والماء، الرمل والماء). يفصل بالترشيح أو قمع الفصل.</p>
                        </div>
                    </div>
                </div>

                <!-- Panel 2: Physical Properties Table -->
                <div class="edu-panel" id="eduPanelTable">
                    <div class="properties-table-card">
                        <h3><i class="fas fa-table"></i> الخصائص الفيزيائية للمواد الخمس في المختبر</h3>
                        <div class="table-responsive">
                            <table class="edu-table">
                                <thead>
                                    <tr>
                                        <th>المادة</th>
                                        <th>الحالة الفيزيائية</th>
                                        <th>الخاصية الرئيسية للفصل</th>
                                        <th>طريقة والأداة المستخدمة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><span class="mat-chip chip-iron"><i class="fas fa-magnet"></i> برادة الحديد</span></td>
                                        <td>صلبة مغناطيسية</td>
                                        <td>الانجذاب للمغناطيس</td>
                                        <td>المغناطيس المعملي</td>
                                    </tr>
                                    <tr>
                                        <td><span class="mat-chip chip-sand"><i class="fas fa-mountain"></i> الرمل الناعم</span></td>
                                        <td>صلبة غير ذائبة (حبيبات متوسطة)</td>
                                        <td>حجم الجسيمات وعدم الذوبانية</td>
                                        <td>قمع ورقة الترشيح</td>
                                    </tr>
                                    <tr>
                                        <td><span class="mat-chip chip-pebbles"><i class="fas fa-gem"></i> الحصى</span></td>
                                        <td>صلبة خشنة (حبيبات كبيرة)</td>
                                        <td>كبر حجم الحبيبات جداً</td>
                                        <td>الغربال الشبكي المعملي</td>
                                    </tr>
                                    <tr>
                                        <td><span class="mat-chip chip-salt"><i class="fas fa-cubes"></i> ملح الطعام</span></td>
                                        <td>صلبة ذائبة في الماء</td>
                                        <td>اختلاف درجة الغليان عن الماء</td>
                                        <td>موقد بنسن وطبق التبخير</td>
                                    </tr>
                                    <tr>
                                        <td><span class="mat-chip chip-oil"><i class="fas fa-droplet"></i> الزيت</span></td>
                                        <td>سائلة (أقل كثافة من الماء)</td>
                                        <td>اختلاف الكثافة وعدم الإمتزاج</td>
                                        <td>قمع الفصل ذو الصنبور</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Panel 3: Quiz -->
                <div class="edu-panel" id="eduPanelQuiz">
                    <div class="quiz-container-card" id="quizContainer">
                        <!-- Rendered by JS -->
                    </div>
                </div>
            </div>
        `;

        this.renderQuizQuestion();
    }

    bindEvents() {
        const tabBtns = this.container.querySelectorAll('.edu-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const targetTab = btn.getAttribute('data-edutab');
                const panels = this.container.querySelectorAll('.edu-panel');
                panels.forEach(p => p.classList.remove('active'));

                if (targetTab === 'concepts') {
                    this.container.querySelector('#eduPanelConcepts').classList.add('active');
                } else if (targetTab === 'table') {
                    this.container.querySelector('#eduPanelTable').classList.add('active');
                } else if (targetTab === 'quiz') {
                    this.container.querySelector('#eduPanelQuiz').classList.add('active');
                }
            });
        });
    }

    renderQuizQuestion() {
        const quizBox = this.container.querySelector('#quizContainer');
        if (!quizBox) return;

        if (this.currentQuestion >= this.questions.length) {
            this.renderQuizResult(quizBox);
            return;
        }

        const q = this.questions[this.currentQuestion];
        this.answered = false;

        quizBox.innerHTML = `
            <div class="quiz-header">
                <span class="quiz-badge">السؤال ${this.currentQuestion + 1} من ${this.questions.length}</span>
                <div class="quiz-progress-bar">
                    <div class="quiz-progress-fill" style="width: ${((this.currentQuestion + 1) / this.questions.length) * 100}%"></div>
                </div>
            </div>

            <h3 class="quiz-question-title">${q.question}</h3>

            <div class="quiz-options-list">
                ${q.options.map((opt, idx) => `
                    <button type="button" class="quiz-option-btn" data-idx="${idx}">
                        <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
                        <span class="opt-text">${opt.text}</span>
                    </button>
                `).join('')}
            </div>

            <div class="quiz-feedback-box" id="quizFeedback" style="display: none;"></div>

            <div class="quiz-actions" id="quizActions" style="display: none;">
                <button type="button" class="btn-next-question" id="btnNextQ">
                    ${this.currentQuestion === this.questions.length - 1 ? 'عرض النتيجة النهائية 🏆' : 'السؤال التالي ⬅️'}
                </button>
            </div>
        `;

        const optionBtns = quizBox.querySelectorAll('.quiz-option-btn');
        optionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.answered) return;
                this.answered = true;

                const selectedIdx = parseInt(btn.getAttribute('data-idx'));
                const isCorrect = q.options[selectedIdx].correct;

                optionBtns.forEach((b, i) => {
                    b.disabled = true;
                    if (q.options[i].correct) {
                        b.classList.add('correct');
                    } else if (i === selectedIdx) {
                        b.classList.add('incorrect');
                    }
                });

                if (isCorrect) {
                    this.score++;
                }

                const feedbackBox = quizBox.querySelector('#quizFeedback');
                feedbackBox.style.display = 'block';
                feedbackBox.className = `quiz-feedback-box ${isCorrect ? 'success' : 'error'}`;
                feedbackBox.innerHTML = `
                    <strong>${isCorrect ? 'إجابة صحيحة! 👏✨' : 'إجابة غير دقيقة! 💡'}</strong>
                    <p>${q.explanation}</p>
                `;

                const quizActions = quizBox.querySelector('#quizActions');
                quizActions.style.display = 'flex';
                setTimeout(() => {
                    quizActions.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            });
        });

        const nextBtn = quizBox.querySelector('#btnNextQ');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentQuestion++;
                this.renderQuizQuestion();
            });
        }
    }

    renderQuizResult(quizBox) {
        const percentage = Math.round((this.score / this.questions.length) * 100);
        let badgeIcon = '🥇';
        let title = 'ممتاز جداً! خبير كيميائي 🧪✨';
        if (percentage < 60) {
            badgeIcon = '📚';
            title = 'محاولة جيدة! حاول مراجعة المفاهيم مرة أخرى 💡';
        } else if (percentage < 85) {
            badgeIcon = '🥈';
            title = 'أحسنت! مستوى رائع في فصل المخاليط 👍';
        }

        quizBox.innerHTML = `
            <div class="quiz-result-card">
                <div class="result-icon-badge">${badgeIcon}</div>
                <h2>${title}</h2>
                <div class="result-score-number">${this.score} / ${this.questions.length}</div>
                <p class="result-score-percent">النسبة المئوية: <strong>${percentage}%</strong></p>

                <div class="result-actions">
                    <button type="button" class="btn-restart-quiz" id="btnRestartQuiz">
                        <i class="fas fa-rotate-right"></i> إعادة الاختبار التفاعلي
                    </button>
                </div>
            </div>
        `;

        quizBox.querySelector('#btnRestartQuiz').addEventListener('click', () => {
            this.currentQuestion = 0;
            this.score = 0;
            this.renderQuizQuestion();
        });
    }
}
