/**
 * electromagnet.js – محاكاة ثلاثية الأبعاد للمغناطيس الكهربائي
 * تدعم: عدد اللفات، التيار، نوع القلب، خطوط مجال جسيمية، تأثيرات توهج، اختبار جذب.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- تهيئة المشهد ---
const canvas = document.getElementById('electromagnetCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x0a0f1a, 1);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f1a);
scene.fog = new THREE.FogExp2(0x0a0f1a, 0.006);

// الكاميرا
const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
camera.position.set(3, 2, 4);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false;
controls.enableZoom = true;
controls.target.set(0, 0, 0);

// Effect Composer (توهج)
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(canvas.clientWidth, canvas.clientHeight), 1.0, 0.4, 0.6);
bloomPass.threshold = 0.1;
bloomPass.strength = 0.5;
bloomPass.radius = 0.4;
const effectComposer = new EffectComposer(renderer);
effectComposer.addPass(renderScene);
effectComposer.addPass(bloomPass);

// --- إضاءة واقعية ---
const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambientLight);
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(3, 5, 2);
mainLight.castShadow = true;
scene.add(mainLight);
const fillLight = new THREE.PointLight(0x88aaff, 0.5);
fillLight.position.set(-2, 1, 2);
scene.add(fillLight);
const backLight = new THREE.PointLight(0xffaa66, 0.3);
backLight.position.set(0, 1, -3);
scene.add(backLight);

// --- طاولة المختبر ---
const tableMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.1 });
const table = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), tableMat);
table.rotation.x = -Math.PI / 2;
table.position.y = -1.2;
table.receiveShadow = true;
scene.add(table);
const gridHelper = new THREE.GridHelper(7, 16, 0x88aaff, 0x335588);
gridHelper.position.y = -1.15;
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.2;
scene.add(gridHelper);

// ========== بناء المغناطيس الكهربائي ==========
const coilGroup = new THREE.Group();
const coreGroup = new THREE.Group();

// القلب الحديدي (أسطوانة)
const coreGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 32);
const coreMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 });
const core = new THREE.Mesh(coreGeo, coreMaterial);
core.castShadow = true;
core.position.y = 0;
coreGroup.add(core);
coilGroup.add(coreGroup);

// الملف النحاسي (حلقات)
const copperMat = new THREE.MeshStandardMaterial({ color: 0xcc8844, metalness: 0.85, roughness: 0.25 });
for (let i = -0.5; i <= 0.5; i += 0.12) {
    const ringGeo = new THREE.TorusGeometry(0.55, 0.08, 32, 64);
    const ring = new THREE.Mesh(ringGeo, copperMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = i;
    ring.castShadow = true;
    coilGroup.add(ring);
}
coilGroup.position.y = 0;
scene.add(coilGroup);

// إضافة نقاط نهاية حمراء وزرقاء للأقطاب
const northMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0x441111 });
const southMat = new THREE.MeshStandardMaterial({ color: 0x4444ff, emissive: 0x111144 });
const northPole = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), northMat);
northPole.position.set(0, 0.7, 0);
coilGroup.add(northPole);
const southPole = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), southMat);
southPole.position.set(0, -0.7, 0);
coilGroup.add(southPole);

// ========== خطوط المجال المغناطيسي (جسيمات متحركة) ==========
let fieldLines = [];
let fieldParticles = [];
const lineCount = 12;
const particlesPerLine = 40;

function createFieldLines() {
    // إزالة القديم
    fieldLines.forEach(line => scene.remove(line));
    fieldParticles.forEach(p => scene.remove(p));
    fieldLines = [];
    fieldParticles = [];
    const strength = getMagneticStrength(); // سيتم تعريفها لاحقاً
    const intensityFactor = Math.min(1, strength / 100);
    for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const points = [];
        // من القطب الشمالي إلى الجنوبي عبر مسار منحني (محاكاة خطوط المجال)
        for (let t = 0; t <= 1; t += 0.05) {
            const x = Math.sin(angle) * 0.8 * Math.sin(Math.PI * t);
            const z = Math.cos(angle) * 0.8 * Math.sin(Math.PI * t);
            const y = 0.7 - 1.4 * t;
            points.push(new THREE.Vector3(x, y, z));
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.4 * intensityFactor });
        const lineObj = new THREE.Line(lineGeo, lineMat);
        scene.add(lineObj);
        fieldLines.push(lineObj);
        // إضافة جسيمات على كل خط
        for (let j = 0; j < particlesPerLine; j++) {
            const particleMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x2288aa, emissiveIntensity: 0.5 });
            const particle = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), particleMat);
            particle.userData = { lineIndex: i, progress: Math.random(), speed: 0.005 + Math.random() * 0.008 };
            scene.add(particle);
            fieldParticles.push(particle);
        }
    }
}

// تحديث مواضع الجسيمات حسب شدة المجال
function updateFieldParticles() {
    const strength = getMagneticStrength();
    const speedFactor = Math.min(1.2, strength / 80);
    fieldParticles.forEach(p => {
        p.userData.progress += p.userData.speed * speedFactor;
        if (p.userData.progress >= 1) p.userData.progress = 0;
        const line = fieldLines[p.userData.lineIndex];
        if (line) {
            const points = line.geometry.attributes.position.array;
            const idx = Math.floor(p.userData.progress * (points.length / 3 - 1));
            const next = idx + 1;
            const t = (p.userData.progress * (points.length / 3 - 1)) - idx;
            const x = points[idx*3] * (1-t) + points[next*3] * t;
            const y = points[idx*3+1] * (1-t) + points[next*3+1] * t;
            const z = points[idx*3+2] * (1-t) + points[next*3+2] * t;
            p.position.set(x, y, z);
        }
    });
    // تحديث شفافية الخطوط حسب القوة
    const strength = getMagneticStrength();
    const intensity = Math.min(0.8, strength / 100);
    fieldLines.forEach(line => line.material.opacity = 0.2 + intensity * 0.5);
}

// ========== عناصر الجذب (مسامير وكرات) ==========
let attractableObjects = [];
function createMetalObjects() {
    const objectPositions = [
        { type: 'nail', weight: 0.5, pos: { x: 1.2, y: -0.9, z: 0.8 }, color: 0xaaaaaa },
        { type: 'ball', weight: 1.2, pos: { x: 1.5, y: -0.9, z: -0.5 }, color: 0xcc9966 },
        { type: 'cube', weight: 2.5, pos: { x: 1.8, y: -0.9, z: 0.2 }, color: 0x888888 }
    ];
    objectPositions.forEach(obj => {
        let geometry;
        if (obj.type === 'nail') geometry = new THREE.CylinderGeometry(0.08, 0.12, 0.4, 8);
        else if (obj.type === 'ball') geometry = new THREE.SphereGeometry(0.18, 24, 24);
        else geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const material = new THREE.MeshStandardMaterial({ color: obj.color, metalness: 0.7, roughness: 0.3 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(obj.pos.x, obj.pos.y, obj.pos.z);
        mesh.userData = { weight: obj.weight, originalPos: mesh.position.clone(), attracted: false };
        mesh.castShadow = true;
        scene.add(mesh);
        attractableObjects.push(mesh);
    });
}

// ========== حسابات الفيزياء ==========
let turns = 100;
let current = 2.5;
let coreType = 'soft'; // 'none', 'soft', 'steel'
let isActive = true; // تشغيل المغناطيس
let fieldStrengthValue = 0;

function getPermeability() {
    if (coreType === 'none') return 1.0;
    if (coreType === 'soft') return 4000;
    if (coreType === 'steel') return 800;
    return 1;
}

function getMagneticStrength() {
    if (!isActive) return 0;
    const mu = getPermeability();
    const L = 0.12; // طول المسار المغناطيسي (متر تقريبي)
    const H = (turns * current) / L;
    const B = mu * H / 1000; // تسلا
    return Math.min(100, (B * 50)); // تحويل إلى نسبة مئوية 0-100
}

function updatePhysicsAndUI() {
    const strengthPercent = getMagneticStrength();
    fieldStrengthValue = strengthPercent;
    const mu = getPermeability();
    const L = 0.12;
    const H = (turns * current) / L;
    const B = mu * H / 1000;
    
    document.getElementById('fluxDensity').innerText = B.toFixed(3);
    document.getElementById('fieldStrength').innerText = H.toFixed(0);
    document.getElementById('displayTurns').innerText = turns;
    document.getElementById('currentValue').innerText = current.toFixed(2) + ' A';
    document.getElementById('strengthFill').style.width = strengthPercent + '%';
    
    // قوة الجذب التقريبية (نيوتن)
    const attraction = strengthPercent * 0.12;
    document.getElementById('attractionForce').innerText = attraction.toFixed(1);
    
    // تحديث حالة المغناطيس في الواجهة
    const statusSpan = document.getElementById('magnetStatus');
    if (isActive && strengthPercent > 0) {
        statusSpan.innerHTML = '⚡ نشط – ' + Math.floor(strengthPercent) + '%';
        statusSpan.style.color = '#f59e0b';
    } else {
        statusSpan.innerHTML = '⚫ غير نشط';
        statusSpan.style.color = '#94a3b8';
    }
    
    // تحديث المعادلة الديناميكية
    const muSymbol = coreType === 'none' ? 'μ₀' : (coreType === 'soft' ? 'μᵣ=4000' : 'μᵣ=800');
    document.getElementById('formulaBox').innerHTML = `B = ${muSymbol} × ${turns} × ${current.toFixed(2)} / 0.12 = ${B.toFixed(3)} T`;
    
    // تأثير توهج على الأقطاب حسب القوة
    const intensity = strengthPercent / 100;
    northPole.material.emissiveIntensity = 0.3 + intensity * 0.7;
    southPole.material.emissiveIntensity = 0.3 + intensity * 0.7;
    
    // جذب الأجسام المعدنية (محاكاة)
    attractableObjects.forEach(obj => {
        if (isActive && strengthPercent > 20) {
            const distance = obj.position.distanceTo(new THREE.Vector3(0, 0, 0));
            const force = (strengthPercent / 100) * (1 / (distance + 0.5)) * 0.08;
            if (force > 0.02 && !obj.userData.attracted) {
                obj.userData.attracted = true;
                // تحريك الجسم نحو المغناطيس
                const targetPos = new THREE.Vector3(0, 0.2, 0);
                const dir = targetPos.clone().sub(obj.position).normalize();
                obj.position.add(dir.multiplyScalar(0.05));
                if (obj.position.distanceTo(targetPos) < 0.2) {
                    obj.userData.attracted = false;
                    document.getElementById('attractionMessage').innerHTML = '✅ تم جذب ' + (obj.geometry.type === 'SphereGeometry' ? 'الكرة' : (obj.geometry.type === 'BoxGeometry' ? 'المكعب' : 'المسمار')) + '!';
                    setTimeout(() => document.getElementById('attractionMessage').innerHTML = '', 1500);
                    obj.position.copy(obj.userData.originalPos);
                }
            } else {
                // إعادة ببطء للموضع الأصلي إذا كانت القوة ضعيفة
                obj.position.lerp(obj.userData.originalPos, 0.05);
            }
        } else {
            obj.position.lerp(obj.userData.originalPos, 0.05);
            obj.userData.attracted = false;
        }
    });
}

// ========== ربط عناصر التحكم في واجهة المستخدم ==========
function bindUI() {
    // أزرار اللفات
    document.querySelectorAll('.turn-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.turn-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            turns = parseInt(btn.dataset.turns);
            updatePhysicsAndUI();
            // إعادة إنشاء خطوط المجال (تتغير كثافتها)
            createFieldLines();
        });
    });
    // شريط التيار
    const currentSlider = document.getElementById('currentSlider');
    currentSlider.addEventListener('input', (e) => {
        current = parseFloat(e.target.value);
        updatePhysicsAndUI();
        createFieldLines();
    });
    // نوع القلب
    document.querySelectorAll('.core-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.core-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            coreType = btn.dataset.core;
            // تغيير لون القلب
            if (coreType === 'none') coreMaterial.color.setHex(0x666666);
            else if (coreType === 'soft') coreMaterial.color.setHex(0x888888);
            else coreMaterial.color.setHex(0xaa8866);
            updatePhysicsAndUI();
            createFieldLines();
        });
    });
    // زر تشغيل/إيقاف
    const toggleBtn = document.getElementById('toggleMagnetBtn');
    toggleBtn.addEventListener('click', () => {
        isActive = !isActive;
        toggleBtn.innerHTML = isActive ? '<i class="fas fa-power-off"></i> إيقاف' : '<i class="fas fa-power-off"></i> تشغيل';
        updatePhysicsAndUI();
    });
    // إعادة ضبط الكاميرا
    document.getElementById('resetViewBtn').addEventListener('click', () => {
        camera.position.set(3, 2, 4);
        controls.target.set(0, 0, 0);
        controls.update();
    });
    // إسقاط مسمار (اختبار الجذب)
    document.getElementById('dropNailBtn').addEventListener('click', () => {
        const randomObj = attractableObjects[Math.floor(Math.random() * attractableObjects.length)];
        randomObj.position.copy(randomObj.userData.originalPos);
        randomObj.userData.attracted = false;
        document.getElementById('attractionMessage').innerHTML = '🔄 تم إعادة العنصر إلى مكانه';
        setTimeout(() => document.getElementById('attractionMessage').innerHTML = '', 1200);
    });
    // تفعيل سحب العناصر المعدنية من واجهة HTML (اختياري)
    document.querySelectorAll('.metal-item').forEach((item, idx) => {
        item.addEventListener('click', () => {
            if (attractableObjects[idx]) {
                attractableObjects[idx].position.copy(attractableObjects[idx].userData.originalPos);
                attractableObjects[idx].userData.attracted = false;
            }
        });
    });
}

// ========== حلقة الرسم ==========
function animate() {
    requestAnimationFrame(animate);
    updateFieldParticles();
    updatePhysicsAndUI();
    controls.update();
    effectComposer.render();
}

// ========== بدء التشغيل ==========
function init() {
    createFieldLines();
    createMetalObjects();
    bindUI();
    updatePhysicsAndUI();
    animate();
    // ضبط حجم canvas عند تغيير النافذة
    window.addEventListener('resize', () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        renderer.setSize(width, height);
        effectComposer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });
}

init();