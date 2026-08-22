import { SceneManager } from './sceneManager.js?v=2.3';
import { MaterialsShelf } from './materialsShelf.js?v=2.3';
import { Tools3D } from './tools3D.js?v=2.3';
import { Beaker3D } from './beaker3D.js?v=2.3';
import { PouringEngine } from './pouringEngine.js?v=2.3';
import { DragControls3D } from './dragControls.js?v=2.3';
import { SeparationEngine } from './separationEngine.js?v=2.3';
import { UIOverlay } from './uiOverlay.js?v=2.3';
import { QuizEngine } from './quizEngine.js?v=2.3';

class SeparationApp {
    constructor() {
        this.canvas = document.getElementById('canvas3d');
        this.init();
    }

    init() {
        // 1. Educational Concepts, Properties Table & Interactive Quiz Engine (Always Initialize First)
        try {
            this.quizEngine = new QuizEngine('educationalPanel');
            this.quizEngine.init();
        } catch (e) {
            console.warn('Quiz engine init warning:', e);
        }

        // 2. Bind Header Mode Switcher Controls Immediately
        this.initModeSwitcher();

        if (!this.canvas) return;

        // 3. 3D Laboratory Environment Initialization
        const isLowPower = sessionStorage.getItem('separation_v2_low_power') === '1';
        let currentRetries = parseInt(sessionStorage.getItem('separation_v2_webgl_retries') || '0', 10);

        try {
            this.sceneManager = new SceneManager(this.canvas, { isLowPerformanceMode: isLowPower });

            if (!this.sceneManager.renderer) {
                throw new Error("WebGL renderer failed to initialize.");
            }

            // On success, reset retry counter
            sessionStorage.removeItem('separation_v2_webgl_retries');

            this.beaker3D = new Beaker3D(this.sceneManager);
            this.materialsShelf = new MaterialsShelf(this.sceneManager);
            this.tools3D = new Tools3D(this.sceneManager);
            this.uiOverlay = new UIOverlay(this.beaker3D, this.materialsShelf, this.tools3D, this.sceneManager);
            this.separationEngine = new SeparationEngine(this.sceneManager, this.beaker3D, this.uiOverlay);
            this.pouringEngine = new PouringEngine(this.sceneManager, this.beaker3D);
            this.separationEngine.setPouringEngine(this.pouringEngine);
            this.dragControls = new DragControls3D(
                this.sceneManager,
                this.materialsShelf,
                this.tools3D,
                this.beaker3D,
                this.pouringEngine,
                this.separationEngine,
                this.uiOverlay
            );

            this.sceneManager.onContextLost = () => {
                this.handleWebGLFailure("فُقد الاتصال بـ WebGL أثناء التشغيل");
            };

            // Start 3D Render Loop
            this.sceneManager.startLoop();
        } catch (err) {
            console.error("3D Lab scene initialization handled:", err);
            this.handleWebGLFailure("تعذر إنشاء بيئة WebGL 3D");
        }
    }

    handleWebGLFailure(reasonText) {
        let currentRetries = parseInt(sessionStorage.getItem('separation_v2_webgl_retries') || '0', 10);
        currentRetries += 1;
        sessionStorage.setItem('separation_v2_webgl_retries', currentRetries.toString());
        sessionStorage.setItem('separation_v2_low_power', '1');

        this.showRecoveryOverlay(currentRetries, 3, reasonText);

        if (currentRetries <= 3) {
            setTimeout(() => {
                window.location.reload();
            }, 1800);
        } else {
            sessionStorage.removeItem('separation_v2_webgl_retries');
            sessionStorage.removeItem('separation_v2_low_power');
            setTimeout(() => {
                window.location.href = 'separation.php?fallback=webgl';
            }, 2500);
        }
    }

    showRecoveryOverlay(attempt, maxAttempts, reasonText) {
        let overlay = document.getElementById('webglRecoveryOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'webglRecoveryOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(15, 23, 42, 0.92);
                backdrop-filter: blur(8px);
                z-index: 999999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                font-family: 'Cairo', sans-serif;
                direction: rtl;
                text-align: center;
                padding: 20px;
            `;
            document.body.appendChild(overlay);
        }

        const isFinal = attempt > maxAttempts;
        overlay.innerHTML = `
            <div style="background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 30px 40px; max-width: 500px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                <div style="font-size: 45px; color: ${isFinal ? '#f59e0b' : '#38bdf8'}; margin-bottom: 15px;">
                    <i class="fas ${isFinal ? 'fa-exclamation-triangle' : 'fa-sync fa-spin'}"></i>
                </div>
                <h3 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 700;">
                    ${isFinal ? 'التحويل التلقائي للتجربة البديلة (2D)' : 'جاري تهيئة المختبر التفاعلي (3D)'}
                </h3>
                <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px; line-height: 1.6;">
                    ${isFinal 
                        ? 'عذراً، متصفحك أو جهازك يواجه صعوبة في تشغيل جرافيكس الـ 3D. جاري نقل تفاصيل التجربة للنسخة الـ 2D السلسة...' 
                        : `${reasonText}. نُعيد محاولة التهيئة في وضع توفير الطاقة... (المحاولة ${attempt} من ${maxAttempts})`}
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <a href="separation.php?fallback=webgl" style="display: inline-block; padding: 10px 20px; background: #0284c7; color: white; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; transition: all 0.2s;">
                        <i class="fas fa-bolt"></i> الانتقال المباشر للنسخة 2D
                    </a>
                </div>
            </div>
        `;
    }

    initModeSwitcher() {
        const btn3D = document.getElementById('btnMode3D');
        const btnQuiz = document.getElementById('btnModeQuiz');
        const labContainer = document.querySelector('.lab-container-v2');
        const eduPanel = document.getElementById('educationalPanel');

        if (!btn3D || !btnQuiz || !labContainer || !eduPanel) return;

        btn3D.addEventListener('click', (e) => {
            e.preventDefault();
            btn3D.classList.add('active');
            btnQuiz.classList.remove('active');

            labContainer.style.display = 'flex';
            eduPanel.style.display = 'none';

            // Smooth resize & camera frustum refresh when returning to 3D mode
            setTimeout(() => {
                if (this.sceneManager && typeof this.sceneManager.onResize === 'function') {
                    this.sceneManager.onResize();
                }
            }, 50);
        });

        btnQuiz.addEventListener('click', (e) => {
            e.preventDefault();
            btnQuiz.classList.add('active');
            btn3D.classList.remove('active');

            labContainer.style.display = 'none';
            eduPanel.style.display = 'block';
        });
    }
}

// Instantiate App when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new SeparationApp();
});
