/**
 * notebookManager.js - Laboratory Notebook & Deductive Blood Typing Evaluator
 */

import { soundFx } from './audioManager.js';

export class NotebookManager {
    constructor(container, store) {
        this.container = container;
        this.store = store;
    }

    render() {
        this.container.innerHTML = `
            <div class="notebook-panel-wrapper">
                <div class="notebook-header-tab">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <span>دفتر المختبر</span>
                </div>

                <div class="notebook-body-grid">
                    <!-- General Notes Block -->
                    <div class="notebook-col-notes">
                        <div class="block-title">ملاحظات عامة:</div>
                        <ul class="notes-list">
                            <li>استخدم القفازات وتجنب تلوث العينات.</li>
                            <li>أضف كمية كافية من الكواشف والدم.</li>
                            <li>امزج بلطف ولا تحرك بقوة لتجنب التناثر.</li>
                            <li>راقب حدوث التراص (التكتل) الحبيبي بوضوح.</li>
                        </ul>
                    </div>

                    <!-- Results Table Block -->
                    <div class="notebook-col-table">
                        <div class="table-header-badge">نتائج العينة الحالية</div>
                        <table class="notebook-results-table">
                            <thead>
                                <tr>
                                    <th>الكاشف</th>
                                    <th>النتيجة (+/-)</th>
                                    <th>الملاحظة</th>
                                    <th>الاستنتاج</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span class="badge-reagent blue">Anti-A</span></td>
                                    <td>
                                        <select class="nb-select" id="selectResult_anti_a">
                                            <option value="">-</option>
                                            <option value="+">+</option>
                                            <option value="-">-</option>
                                        </select>
                                    </td>
                                    <td><input type="text" class="nb-input" id="obs_anti_a" placeholder="تكتل / متجانس"></td>
                                    <td><input type="text" class="nb-input" id="ded_anti_a" placeholder="يحمل مولد ضد A"></td>
                                </tr>
                                <tr>
                                    <td><span class="badge-reagent yellow">Anti-B</span></td>
                                    <td>
                                        <select class="nb-select" id="selectResult_anti_b">
                                            <option value="">-</option>
                                            <option value="+">+</option>
                                            <option value="-">-</option>
                                        </select>
                                    </td>
                                    <td><input type="text" class="nb-input" id="obs_anti_b" placeholder="تكتل / متجانس"></td>
                                    <td><input type="text" class="nb-input" id="ded_anti_b" placeholder="يحمل مولد ضد B"></td>
                                </tr>
                                <tr>
                                    <td><span class="badge-reagent purple">Anti-D</span></td>
                                    <td>
                                        <select class="nb-select" id="selectResult_anti_d">
                                            <option value="">-</option>
                                            <option value="+">+</option>
                                            <option value="-">-</option>
                                        </select>
                                    </td>
                                    <td><input type="text" class="nb-input" id="obs_anti_d" placeholder="تكتل / متجانس"></td>
                                    <td><input type="text" class="nb-input" id="ded_anti_d" placeholder="يحمل عامل ريسوس"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Final Conclusion & Deduction Block -->
                    <div class="notebook-col-deduction">
                        <div class="block-title">استنتج فصيلة الدم:</div>
                        <div class="deduction-field">
                            <label>فصيلة الدم (ABO):</label>
                            <select class="nb-select wide" id="selectBloodGroup">
                                <option value="">-- اختر الفصيلة --</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="AB">AB</option>
                                <option value="O">O</option>
                            </select>
                        </div>
                        <div class="deduction-field">
                            <label>عامل Rh:</label>
                            <select class="nb-select wide" id="selectRhFactor">
                                <option value="">-- اختر العامل --</option>
                                <option value="+">موجب (+)</option>
                                <option value="-">سالب (-)</option>
                            </select>
                        </div>
                        <button class="verify-btn" id="verifyDeductionBtn">
                            تحقق من النتيجة
                        </button>
                        <div class="evaluation-feedback" id="evalFeedbackBox"></div>
                    </div>
                </div>
            </div>
        `;
        this.bindVerification();
    }

    bindVerification() {
        const btn = document.getElementById('verifyDeductionBtn');
        const feedback = document.getElementById('evalFeedbackBox');
        if (!btn || !feedback) return;

        btn.addEventListener('click', () => {
            const patient = this.store.getActivePatient();
            const chosenGroup = document.getElementById('selectBloodGroup').value;
            const chosenRh = document.getElementById('selectRhFactor').value;

            if (!chosenGroup || !chosenRh) {
                feedback.className = 'evaluation-feedback warning';
                feedback.textContent = 'يرجى تحديد الفصيلة وعامل Rh أولاً لاستكمال التقييم.';
                return;
            }

            const isGroupCorrect = chosenGroup === patient.bloodType;
            const isRhCorrect = chosenRh === patient.rhFactor;

            if (isGroupCorrect && isRhCorrect) {
                soundFx.playSuccess();
                feedback.className = 'evaluation-feedback success';
                feedback.innerHTML = `أحسنت! إجابة دقيقة تماماً. فصيلة دم ${patient.name} هي بالفعل (${patient.bloodType}${patient.rhFactor}).`;
            } else {
                feedback.className = 'evaluation-feedback error';
                feedback.innerHTML = `النتيجة غير متطابقة مع المشاهدة. راجع حدوث التراص لكل كاشف ثم أعد المحاولة.`;
            }
        });
    }

    resetInputs() {
        ['anti_a', 'anti_b', 'anti_d'].forEach(k => {
            const sel = document.getElementById(`selectResult_${k}`);
            const obs = document.getElementById(`obs_${k}`);
            const ded = document.getElementById(`ded_${k}`);
            if (sel) sel.value = '';
            if (obs) obs.value = '';
            if (ded) ded.value = '';
        });
        const g = document.getElementById('selectBloodGroup');
        const r = document.getElementById('selectRhFactor');
        const fb = document.getElementById('evalFeedbackBox');
        if (g) g.value = '';
        if (r) r.value = '';
        if (fb) {
            fb.className = 'evaluation-feedback';
            fb.textContent = '';
        }
    }
}
