// js/experiments/ph_v2/quizEngine.js
export class QuizEngine {
    constructor() {
        this.obsContainer = document.getElementById('pane-observations');
        this.conContainer = document.getElementById('pane-conclusions');
        this.quizContainer = document.getElementById('pane-quiz');

        this.questions = [
            {
                id: 1,
                text: "1- ماذا يدل تحول ورقة عباد الشمس الزرقاء إلى اللون الأحمر؟",
                options: [
                    { text: "أن المحلول قاعدي", correct: false },
                    { text: "أن المحلول حمضي", correct: true },
                    { text: "أن المحلول متعادل", correct: false },
                    { text: "أن المحلول لا يحتوي على ماء", correct: false }
                ],
                explanation: "الأحماض تحول ورقة عباد الشمس الزرقاء إلى اللون الأحمر نتيجة تفاعلها مع أيونات الهيدروجين الحرة."
            },
            {
                id: 2,
                text: "2- أي أداة تعطي قيمة رقمية دقيقة للرقم الهيدروجيني للمحلول؟",
                options: [
                    { text: "جهاز pH Meter", correct: true },
                    { text: "ورقة عباد الشمس", correct: false },
                    { text: "الكأس الزجاجي", correct: false },
                    { text: "القطارة", correct: false }
                ],
                explanation: "جهاز الـ pH Meter الإلكتروني يقيس فرق الجهد بدقة ويعطي قيمة كسرية مباشرة للـ pH."
            },
            {
                id: 3,
                text: "3- إذا أظهر جهاز pH Meter قيمة pH = 9، فما طبيعة المحلول؟",
                options: [
                    { text: "حمضي", correct: false },
                    { text: "قاعدي", correct: true },
                    { text: "متعادل", correct: false },
                    { text: "لا يمكن تحديد طبيعته", correct: false }
                ],
                explanation: "القيم أكبر من 7 على مقياس الرقم الهيدروجيني تدل على محاليل قاعدية (قلوية)."
            }
        ];
    }

    init() {
        this.renderObservations();
        this.renderConclusions();
        this.renderQuiz();
        this.loadSavedData();
    }

    renderObservations() {
        if (!this.obsContainer) return;
        this.obsContainer.innerHTML = `
            <div class="edu-container">
                <div class="edu-card">
                    <h3 class="edu-card-title"><i class="fas fa-table"></i> تسجيل الملاحظات</h3>
                    <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 20px;">
                        سجل ملاحظاتك وقيم الـ pH وطبيعة المحاليل التي حصلت عليها أثناء المعايرة (تُحفظ تلقائياً):
                    </p>
                    <table class="data-table" id="observationTable">
                        <thead>
                            <tr>
                                <th rowspan="2" style="vertical-align: middle;">المحلول</th>
                                <th colspan="2" style="text-align: center;">ورقة عباد الشمس</th>
                                <th rowspan="2" style="vertical-align: middle;">قيمة pH</th>
                                <th rowspan="2" style="vertical-align: middle;">الطبيعة (حمضي/متعادل/قاعدي)</th>
                            </tr>
                            <tr>
                                <th>الورقة الزرقاء</th>
                                <th>الورقة الحمراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr data-row="lemon">
                                <td>🍋 عصير الليمون</td>
                                <td><input type="text" class="table-input" data-col="blue" placeholder="تغير اللون؟"></td>
                                <td><input type="text" class="table-input" data-col="red" placeholder="تغير اللون؟"></td>
                                <td><input type="text" class="table-input" data-col="val" placeholder="مثال: 2.0"></td>
                                <td><input type="text" class="table-input" data-col="type" placeholder="مثال: حمضي"></td>
                            </tr>
                            <tr data-row="vinegar">
                                <td>🏺 الخل الأبيض</td>
                                <td><input type="text" class="table-input" data-col="blue" placeholder="..."></td>
                                <td><input type="text" class="table-input" data-col="red" placeholder="..."></td>
                                <td><input type="text" class="table-input" data-col="val" placeholder="..."></td>
                                <td><input type="text" class="table-input" data-col="type" placeholder="..."></td>
                            </tr>
                            <tr data-row="water">
                                <td>💧 الماء المقطر</td>
                                <td><input type="text" class="table-input" data-col="blue" placeholder="..."></td>
                                <td><input type="text" class="table-input" data-col="red" placeholder="..."></td>
                                <td><input type="text" class="table-input" data-col="val" placeholder="..."></td>
                                <td><input type="text" class="table-input" data-col="type" placeholder="..."></td>
                            </tr>
                            <tr data-row="bicarb">
                                <td>🧪 محلول بيكربونات الصوديوم</td>
                                <td><input type="text" class="table-input" data-col="blue" placeholder="..."></td>
                                <td><input type="text" class="table-input" data-col="red" placeholder="..."></td>
                                <td><input type="text" class="table-input" data-col="val" placeholder="..."></td>
                                <td><input type="text" class="table-input" data-col="type" placeholder="..."></td>
                            </tr>
                            <tr data-row="soap">
                                <td>🧼 ماء وصابون</td>
                                <td><input type="text" class="table-input" data-col="blue" placeholder="..."></td>
                                <td><input type="text" class="table-input" data-col="red" placeholder="..."></td>
                                <td><input type="text" class="table-input" data-col="val" placeholder="..."></td>
                                <td><input type="text" class="table-input" data-col="type" placeholder="..."></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderConclusions() {
        if (!this.conContainer) return;
        this.conContainer.innerHTML = `
            <div class="edu-container">
                <!-- Notes section (ماذا لاحظت) -->
                <div class="edu-card">
                    <h3 class="edu-card-title"><i class="fas fa-eye"></i> ماذا لاحظت؟</h3>
                    <ul style="margin-right: 20px; font-size: 0.9rem; color: var(--text-muted); line-height: 1.8;">
                        <li style="margin-bottom: 8px;"><strong>ورقة عباد الشمس:</strong> تحدد نوع المحلول فقط (حمضي أو قاعدي) ولا تعطي قيمة رقمية دقيقة.</li>
                        <li style="margin-bottom: 8px;"><strong>جهاز pH Meter:</strong> يعطي قيمة رقمية كسرية دقيقة ومباشرة لتركيز أيونات الهيدروجين.</li>
                        <li style="margin-bottom: 8px;"><strong>لكل محلول:</strong> قيمة pH مختلفة ومميزة تدل على مدى قوته أو ضعفه كيميائياً.</li>
                    </ul>
                </div>

                <!-- Conclusions section (ماذا نستنتج) -->
                <div class="edu-card">
                    <h3 class="edu-card-title"><i class="fas fa-lightbulb"></i> ماذا نستنتج؟</h3>
                    <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 20px;">
                        أجب عن الأسئلة الاستنتاجية التالية واضغط على زر "عرض الاستنتاج العلمي" لمطابقة إجابتك:
                    </p>
                    <div class="conclusions-grid">
                        
                        <div class="conclusion-question-box">
                            <span class="question-lbl">1. لماذا لا يمكن معرفة طبيعة المحلول من شكله الظاهري؟</span>
                            <textarea class="conclusion-textarea" id="con-q1" placeholder="اكتب إجابتك هنا..."></textarea>
                            <div class="model-ans-box" id="ans-box-1" style="display: none;">
                                <strong>💡 الإجابة النموذجية:</strong> لأن المحاليل قد تبدو متشابهة في المظهر (عديمة اللون كالماء والخل)، وتذوق المواد الكيميائية خطير جداً وغير آمن، لذا نحتاج لأدوات علمية دقيقة للكشف عنها.
                            </div>
                        </div>

                        <div class="conclusion-question-box" style="margin-top: 16px;">
                            <span class="question-lbl">2. ما الفرق الجوهري بين ورقة عباد الشمس وجهاز pH؟</span>
                            <textarea class="conclusion-textarea" id="con-q2" placeholder="اكتب إجابتك هنا..."></textarea>
                            <div class="model-ans-box" id="ans-box-2" style="display: none;">
                                <strong>💡 الإجابة النموذجية:</strong> ورقة عباد الشمس تحدد نوع المحلول تقريبياً (حمضي/قاعدي) عبر تغير اللون دون أرقام، بينما جهاز الـ pH Meter يعطي قيمة رقمية مباشرة وفائقة الدقة.
                            </div>
                        </div>

                        <div class="conclusion-question-box" style="margin-top: 16px;">
                            <span class="question-lbl">3. أي أداة كانت أكثر دقة وعملية؟ ولماذا؟</span>
                            <textarea class="conclusion-textarea" id="con-q3" placeholder="اكتب إجابتك هنا..."></textarea>
                            <div class="model-ans-box" id="ans-box-3" style="display: none;">
                                <strong>💡 الإجابة النموذجية:</strong> جهاز pH Meter هو الأكثر دقة؛ لأنه يعطي رقماً حقيقياً دقيقاً، ويسهل استخدامه للقياس المتكرر السريع، بينما تتأثر قراءة الورق بتقدير العين البشري لدرجات الألوان.
                            </div>
                        </div>

                    </div>

                    <button type="button" class="bottom-btn primary-btn" id="btnToggleModelAnswers" style="margin-top: 24px; background: var(--accent-blue);">
                        <i class="fas fa-check-circle"></i> عرض الاستنتاج العلمي النموذجي
                    </button>
                </div>
            </div>
        `;

        // Toggle Model Answers event
        const toggleBtn = this.conContainer.querySelector('#btnToggleModelAnswers');
        toggleBtn.addEventListener('click', () => {
            const boxes = [
                this.conContainer.querySelector('#ans-box-1'),
                this.conContainer.querySelector('#ans-box-2'),
                this.conContainer.querySelector('#ans-box-3')
            ];
            
            const isHidden = boxes[0].style.display === 'none';
            boxes.forEach(box => box.style.display = isHidden ? 'block' : 'none');
            toggleBtn.innerHTML = isHidden 
                ? '<i class="fas fa-eye-slash"></i> إخفاء الاستنتاج العلمي النموذجي'
                : '<i class="fas fa-check-circle"></i> عرض الاستنتاج العلمي النموذجي';
        });
    }

    renderQuiz() {
        if (!this.quizContainer) return;
        this.quizContainer.innerHTML = `
            <div class="edu-container">
                <div class="edu-card">
                    <h3 class="edu-card-title"><i class="fas fa-clipboard-check"></i> أجب عن الأسئلة التالية لتقييم ما تعلمته</h3>
                    <div class="quiz-wrapper">
                        ${this.questions.map(q => `
                            <div class="quiz-card-col" data-qid="${q.id}">
                                <div class="q-text">${q.text}</div>
                                <div class="q-options-list">
                                    ${q.options.map((opt, oIdx) => `
                                        <div class="q-option" data-idx="${oIdx}">
                                            <i class="far fa-circle" style="margin-left: 8px;"></i>
                                            <span>${opt.text}</span>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="q-feedback" style="display: none; font-size: 0.82rem; margin-top: 14px; padding: 10px; border-radius: 8px; line-height: 1.5;"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // Bind Quiz Option clicks
        const cards = this.quizContainer.querySelectorAll('.quiz-card-col');
        cards.forEach(card => {
            const qid = parseInt(card.getAttribute('data-qid'));
            const q = this.questions.find(item => item.id === qid);
            const options = card.querySelectorAll('.q-option');
            let answered = false;

            options.forEach(opt => {
                opt.addEventListener('click', () => {
                    if (answered) return;
                    answered = true;

                    const selIdx = parseInt(opt.getAttribute('data-idx'));
                    const isCorrect = q.options[selIdx].correct;

                    options.forEach((o, oIdx) => {
                        const icon = o.querySelector('i');
                        if (q.options[oIdx].correct) {
                            o.classList.add('correct');
                            if (icon) icon.className = "fas fa-check-circle";
                        } else if (oIdx === selIdx) {
                            o.classList.add('wrong');
                            if (icon) icon.className = "fas fa-times-circle";
                        }
                    });

                    const feedback = card.querySelector('.q-feedback');
                    feedback.style.display = 'block';
                    feedback.style.background = isCorrect ? '#ecfdf5' : '#fef2f2';
                    feedback.style.color = isCorrect ? '#065f46' : '#991b1b';
                    feedback.innerHTML = `
                        <strong>${isCorrect ? 'إجابة صحيحة! 👏' : 'إجابة غير صحيحة! 💡'}</strong>
                        <p>${q.explanation}</p>
                    `;
                });
            });
        });
    }

    bindAutosave() {
        // Table inputs autosave
        const tInputs = document.querySelectorAll('.table-input');
        tInputs.forEach(input => {
            input.addEventListener('input', () => this.saveData());
        });

        // Textarea inputs autosave
        const tAreas = document.querySelectorAll('.conclusion-textarea');
        tAreas.forEach(area => {
            area.addEventListener('input', () => this.saveData());
        });
    }

    saveData() {
        const tableData = {};
        const rows = document.querySelectorAll('#observationTable tbody tr');
        rows.forEach(row => {
            const key = row.getAttribute('data-row');
            tableData[key] = {
                blue: row.querySelector('[data-col="blue"]').value,
                red: row.querySelector('[data-col="red"]').value,
                val: row.querySelector('[data-col="val"]').value,
                type: row.querySelector('[data-col="type"]').value
            };
        });

        const conclusionsData = {
            q1: document.getElementById('con-q1')?.value || '',
            q2: document.getElementById('con-q2')?.value || '',
            q3: document.getElementById('con-q3')?.value || ''
        };

        localStorage.setItem('guided_ph_table_data', JSON.stringify(tableData));
        localStorage.setItem('guided_ph_conclusions_data', JSON.stringify(conclusionsData));
    }

    loadSavedData() {
        // Load table data
        const rawTable = localStorage.getItem('guided_ph_table_data');
        if (rawTable) {
            try {
                const data = JSON.parse(rawTable);
                const rows = document.querySelectorAll('#observationTable tbody tr');
                rows.forEach(row => {
                    const key = row.getAttribute('data-row');
                    if (data[key]) {
                        row.querySelector('[data-col="blue"]').value = data[key].blue || '';
                        row.querySelector('[data-col="red"]').value = data[key].red || '';
                        row.querySelector('[data-col="val"]').value = data[key].val || '';
                        row.querySelector('[data-col="type"]').value = data[key].type || '';
                    }
                });
            } catch (e) {
                console.error("Error loading table data", e);
            }
        }

        // Load conclusions data
        const rawConclusions = localStorage.getItem('guided_ph_conclusions_data');
        if (rawConclusions) {
            try {
                const data = JSON.parse(rawConclusions);
                const q1 = document.getElementById('con-q1');
                const q2 = document.getElementById('con-q2');
                const q3 = document.getElementById('con-q3');
                if (q1) q1.value = data.q1 || '';
                if (q2) q2.value = data.q2 || '';
                if (q3) q3.value = data.q3 || '';
            } catch (e) {
                console.error("Error loading conclusions data", e);
            }
        }

        // Rebind events to new inputs
        this.bindAutosave();
    }
}
