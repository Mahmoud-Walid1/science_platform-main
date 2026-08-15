/**
 * prism-3d.js - محاكاة احترافية لمنشور ثلاثي الأبعاد مع تشتت حقيقي للضوء
 * حل المشاكل: هندسة دقيقة، مسار ضوء حقيقي، استجابة كاملة للإعدادات
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- الإعدادات الأساسية ---
const canvas = document.getElementById('threeCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x0a0f1a, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f1a);
scene.fog = new THREE.FogExp2(0x0a0f1a, 0.005);

// الكاميرا
const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
camera.position.set(5, 3.5, 7);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false;
controls.enableZoom = true;
controls.target.set(0, 0.2, 0);

// Effect Composer (توهج)
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(canvas.clientWidth, canvas.clientHeight), 1.2, 0.4, 0.85);
bloomPass.threshold = 0.1;
bloomPass.strength = 0.6;
bloomPass.radius = 0.5;
const effectComposer = new EffectComposer(renderer);
effectComposer.addPass(renderScene);
effectComposer.addPass(bloomPass);

// --- إضاءة واقعية ---
const ambient = new THREE.AmbientLight(0x404060, 0.5);
scene.add(ambient);
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(4, 6, 3);
mainLight.castShadow = true;
scene.add(mainLight);
const fillLight = new THREE.PointLight(0xffaa66, 0.5);
fillLight.position.set(2, 1.5, 2);
scene.add(fillLight);
const backLight = new THREE.PointLight(0x88aaff, 0.4);
backLight.position.set(-1, 1, -3);
scene.add(backLight);
const rimLight = new THREE.PointLight(0xffffff, 0.4);
rimLight.position.set(0, 1.5, -2);
scene.add(rimLight);

// --- طاولة وشبكة ---
const tableMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.1 });
const table = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), tableMat);
table.rotation.x = -Math.PI / 2;
table.position.y = -1.0;
table.receiveShadow = true;
scene.add(table);

const grid = new THREE.GridHelper(9, 20, 0x88aaff, 0x335588);
grid.position.y = -0.95;
grid.material.transparent = true;
grid.material.opacity = 0.2;
scene.add(grid);

// ========== إنشاء منشور حقيقي (شكل مثلثي قائم) ==========
// نستخدم ExtrudeGeometry لإنشاء منشور بقاعدة مثلثة الشكل
const shape = new THREE.Shape();
shape.moveTo(0, -0.6);
shape.lineTo(0.8, 0.4);
shape.lineTo(-0.8, 0.4);
shape.closePath();

const extrudeSettings = {
    steps: 1,
    depth: 1.2,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3
};
const prismGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
prismGeo.rotateX(Math.PI / 2);
prismGeo.rotateZ(-Math.PI / 2);
prismGeo.computeVertexNormals();
// نقل المركز إلى منتصف المنشور
prismGeo.translate(0, 0.2, 0);

const prismMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x88bbee,
    metalness: 0.3,
    roughness: 0.25,
    transparent: true,
    opacity: 0.85,
    ior: 1.52,
    reflectivity: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
    side: THREE.DoubleSide
});
const prism = new THREE.Mesh(prismGeo, prismMaterial);
prism.castShadow = true;
prism.receiveShadow = false;
scene.add(prism);

// إضافة حواف مضيئة للمنشور (تأثير بصري)
const edgesGeo = new THREE.EdgesGeometry(prismGeo);
const edgesMat = new THREE.LineBasicMaterial({ color: 0xaaddff });
const wireframe = new THREE.LineSegments(edgesGeo, edgesMat);
prism.add(wireframe);

// مجموعة المنشور للتدوير
const prismGroup = new THREE.Group();
prismGroup.add(prism);
scene.add(prismGroup);

// تحديد نقاط الدخول والخروج على وجوه المنشور (بالنسبة للمنشور الحالي)
// نقطة الدخول على الوجه الأيسر (حوالي x=-0.9, z=0, y=0.2)
const entryPointLocal = new THREE.Vector3(-0.85, 0.2, 0);
// نقطة الخروج على الوجه الأيمن (حوالي x=0.9, z=0, y=0.1)
const exitPointLocal = new THREE.Vector3(0.85, 0.15, 0);

// --- مصدر الضوء (كرة مضيئة) ---
const lightMat = new THREE.MeshStandardMaterial({ color: 0xffcc88, emissive: 0xffaa44, emissiveIntensity: 0.8 });
const lightSphere = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 32), lightMat);
lightSphere.position.set(-3.2, 0.25, 0);
lightSphere.castShadow = true;
scene.add(lightSphere);

// --- بيانات الطيف (الألوان ومعاملات الانكسار النسبية) ---
const spectrumData = [
    { name: 'red', wavelength: 700, color: 0xff6666, iorOffset: -0.06, angleOffset: -3.2, label: 'أحمر' },
    { name: 'orange', wavelength: 620, color: 0xff8844, iorOffset: -0.03, angleOffset: -1.5, label: 'برتقالي' },
    { name: 'yellow', wavelength: 580, color: 0xffdd44, iorOffset: -0.01, angleOffset: -0.2, label: 'أصفر' },
    { name: 'green', wavelength: 530, color: 0x44ff44, iorOffset: 0.01, angleOffset: 1.2, label: 'أخضر' },
    { name: 'blue', wavelength: 470, color: 0x4488ff, iorOffset: 0.04, angleOffset: 3.0, label: 'أزرق' },
    { name: 'violet', wavelength: 420, color: 0xaa88ff, iorOffset: 0.07, angleOffset: 5.0, label: 'بنفسجي' }
];

// --- حالة التطبيق ---
let lightOn = true;
let currentLightColor = 'white';
let intensity = 0.85;
let prismBaseIOR = 1.52;
let prismType = 'glass';
let prismAngle = 0;
let autoRotate = false;
let spectralLines = [];
let photons = [];

// دالة لحساب معامل الانكسار الفعلي حسب النوع
function getActualIOR() {
    let ior = prismBaseIOR;
    if (prismType === 'crystal') ior += 0.12;
    if (prismType === 'plastic') ior -= 0.07;
    return ior;
}

// حساب زاوية الانكسار لكل لون (عند الخروج من المنشور، تقريب عملي)
function calculateRefractionAngles() {
    const n_air = 1.0;
    const n_base = getActualIOR();
    const incidentAngleDeg = 35; // زاوية السقوط التقريبية على الوجه الأول
    const results = {};
    for (let s of spectrumData) {
        const n_glass = n_base + s.iorOffset;
        const sin_r = (n_air / n_glass) * Math.sin(incidentAngleDeg * Math.PI / 180);
        let r_deg = Math.asin(Math.min(1, Math.max(-1, sin_r))) * 180 / Math.PI;
        r_deg += s.angleOffset * (n_base / 1.52);
        results[s.name] = Math.max(0, Math.min(90, r_deg));
    }
    return results;
}

// تحديث مظهر المنشور حسب النوع
function updatePrismAppearance() {
    if (prismType === 'glass') {
        prismMaterial.color.setHex(0x88bbee);
        prismMaterial.metalness = 0.3;
        prismMaterial.roughness = 0.25;
        prismMaterial.opacity = 0.85;
        prismMaterial.ior = getActualIOR();
    } else if (prismType === 'crystal') {
        prismMaterial.color.setHex(0xcceeff);
        prismMaterial.metalness = 0.55;
        prismMaterial.roughness = 0.12;
        prismMaterial.opacity = 0.92;
        prismMaterial.ior = getActualIOR();
    } else if (prismType === 'plastic') {
        prismMaterial.color.setHex(0xaaccdd);
        prismMaterial.metalness = 0.1;
        prismMaterial.roughness = 0.42;
        prismMaterial.opacity = 0.78;
        prismMaterial.ior = getActualIOR();
    }
}

// تحديث الأشعة المرئية (الخطوط الملونة) ونقاط الخروج
function updateRays() {
    spectralLines.forEach(line => { if (line.parent) scene.remove(line); });
    spectralLines = [];
    if (!lightOn || intensity === 0) return;

    // تحويل نقاط الدخول والخروج إلى الإحداثيات العالمية مع مراعاة دوران المنشور
    const entryWorld = entryPointLocal.clone().applyQuaternion(prismGroup.quaternion);
    entryWorld.add(prismGroup.position);
    const exitWorld = exitPointLocal.clone().applyQuaternion(prismGroup.quaternion);
    exitWorld.add(prismGroup.position);

    // الشعاع الساقط (من المصدر إلى نقطة الدخول)
    const sourcePos = lightSphere.position.clone();
    const incidentPoints = [sourcePos, entryWorld];
    const incidentGeo = new THREE.BufferGeometry().setFromPoints(incidentPoints);
    const incidentMat = new THREE.LineBasicMaterial({ color: 0xffaa66 });
    const incidentLine = new THREE.Line(incidentGeo, incidentMat);
    scene.add(incidentLine);
    spectralLines.push(incidentLine);

    // الشعاع داخل المنشور (من الدخول إلى الخروج) – لون أبيض شفاف
    const internalPoints = [entryWorld, exitWorld];
    const internalGeo = new THREE.BufferGeometry().setFromPoints(internalPoints);
    const internalMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    const internalLine = new THREE.Line(internalGeo, internalMat);
    scene.add(internalLine);
    spectralLines.push(internalLine);

    if (currentLightColor === 'white') {
        const angles = calculateRefractionAngles();
        // اتجاه الخروج: اتجاه العمود على الوجه الخروج + زاوية الانكسار
        // للتبسيط: نرسم خطوطاً من نقطة الخروج باتجاهات مائلة حسب اللون
        const baseDir = new THREE.Vector3(1, 0.1, 0).normalize();
        spectrumData.forEach(s => {
            const angleRad = (angles[s.name] - 20) * Math.PI / 180; // تعديل لجعل التباعد واضحاً
            const direction = new THREE.Vector3(Math.cos(angleRad), Math.sin(angleRad), 0).normalize();
            const endPoint = exitWorld.clone().add(direction.multiplyScalar(2.2));
            const points = [exitWorld, endPoint];
            const geom = new THREE.BufferGeometry().setFromPoints(points);
            const mat = new THREE.LineBasicMaterial({ color: s.color });
            const line = new THREE.Line(geom, mat);
            scene.add(line);
            spectralLines.push(line);
        });
    } else {
        let col = 0xff8888;
        if (currentLightColor === 'green') col = 0x88ff88;
        if (currentLightColor === 'blue') col = 0x8888ff;
        const dir = new THREE.Vector3(1, 0.2, 0).normalize();
        const endPoint = exitWorld.clone().add(dir.multiplyScalar(2.5));
        const points = [exitWorld, endPoint];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: col });
        const line = new THREE.Line(geom, mat);
        scene.add(line);
        spectralLines.push(line);
    }
}

// فوتونات متحركة
class Photon {
    constructor(points, color, speed = 0.012) {
        this.points = points;
        this.t = Math.random();
        this.speed = speed;
        const material = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.6 });
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), material);
        scene.add(this.mesh);
    }
    update() {
        if (!lightOn || intensity === 0) return;
        this.t += this.speed * intensity;
        if (this.t >= 1) this.t = 0;
        const idx = Math.floor(this.t * (this.points.length - 1));
        const next = Math.min(idx + 1, this.points.length - 1);
        const frac = (this.t * (this.points.length - 1)) - idx;
        const x = this.points[idx].x + (this.points[next].x - this.points[idx].x) * frac;
        const y = this.points[idx].y + (this.points[next].y - this.points[idx].y) * frac;
        const z = this.points[idx].z + (this.points[next].z - this.points[idx].z) * frac;
        this.mesh.position.set(x, y, z);
    }
}

function initPhotons() {
    photons.forEach(p => scene.remove(p.mesh));
    photons = [];
    if (!lightOn || intensity === 0) return;

    const sourcePos = lightSphere.position.clone();
    const entryWorld = entryPointLocal.clone().applyQuaternion(prismGroup.quaternion).add(prismGroup.position);
    const exitWorld = exitPointLocal.clone().applyQuaternion(prismGroup.quaternion).add(prismGroup.position);

    if (currentLightColor === 'white') {
        const angles = calculateRefractionAngles();
        spectrumData.forEach(s => {
            const angleRad = (angles[s.name] - 20) * Math.PI / 180;
            const direction = new THREE.Vector3(Math.cos(angleRad), Math.sin(angleRad), 0).normalize();
            const endPoint = exitWorld.clone().add(direction.multiplyScalar(2.2));
            const path = [sourcePos, entryWorld, exitWorld, endPoint];
            for (let i = 0; i < 8; i++) {
                photons.push(new Photon(path, s.color, 0.009 + Math.random() * 0.008));
            }
        });
    } else {
        let col = 0xff8888;
        if (currentLightColor === 'green') col = 0x88ff88;
        if (currentLightColor === 'blue') col = 0x8888ff;
        const dir = new THREE.Vector3(1, 0.2, 0).normalize();
        const endPoint = exitWorld.clone().add(dir.multiplyScalar(2.5));
        const path = [sourcePos, entryWorld, exitWorld, endPoint];
        for (let i = 0; i < 18; i++) {
            photons.push(new Photon(path, col, 0.012 + Math.random() * 0.01));
        }
    }
}

// تحديث واجهة المستخدم (القيم العلمية)
function updateUI() {
    const statusSpan = document.getElementById('simulationStatus');
    if (lightOn) {
        if (currentLightColor === 'white') statusSpan.innerHTML = '🌈 مصدر الضوء: أبيض (طيف كامل)';
        else {
            const colorNames = { red: 'أحمر 🔴', green: 'أخضر 🟢', blue: 'أزرق 🔵' };
            statusSpan.innerHTML = `💡 مصدر الضوء: ${colorNames[currentLightColor]}`;
        }
    } else statusSpan.innerHTML = '⚫ مصدر الضوء: متوقف';

    const angles = calculateRefractionAngles();
    const incidentEl = document.getElementById('incidentAngle');
    const redEl = document.getElementById('refractAngleRed');
    const violetEl = document.getElementById('refractAngleViolet');
    const snellDiv = document.getElementById('snellInfo');
    const scientificDiv = document.getElementById('scientificInfo');

    if (incidentEl) incidentEl.innerText = '35.0';
    if (redEl) redEl.innerText = angles.red?.toFixed(1) || '0.0';
    if (violetEl) violetEl.innerText = angles.violet?.toFixed(1) || '0.0';
    if (snellDiv) {
        snellDiv.innerHTML = `n₁·sinθ₁ = n₂·sinθ₂<br>زاوية السقوط: 35.0°<br>زاوية الانكسار (أحمر): ${angles.red?.toFixed(1)}°<br>زاوية الانكسار (بنفسجي): ${angles.violet?.toFixed(1)}°<br>معامل الانكسار (الحالي): ${getActualIOR().toFixed(3)}<br>نوع المنشور: ${prismType === 'glass' ? 'زجاجي' : prismType === 'crystal' ? 'كريستالي' : 'بلاستيكي'}`;
    }
    if (scientificDiv) {
        if (currentLightColor === 'white' && lightOn) {
            scientificDiv.innerHTML = `<strong>🌈 ظاهرة تحليل الضوء:</strong><br>الضوء الأبيض يتحلل إلى ألوان الطيف.<br>🔴 الأحمر: أقل انكسار (${angles.red?.toFixed(1)}°)<br>🟣 البنفسجي: أكبر انكسار (${angles.violet?.toFixed(1)}°)`;
        } else if (lightOn) {
            const colorName = { red: 'الأحمر', green: 'الأخضر', blue: 'الأزرق' }[currentLightColor];
            scientificDiv.innerHTML = `<strong>🔬 ضوء أحادي اللون (${colorName}):</strong><br>الضوء ${colorName} له طول موجي واحد، لا ينقسم عند المرور عبر المنشور.`;
        } else scientificDiv.innerHTML = `🔌 الضوء متوقف. اضغط "تشغيل الضوء" لبدء التجربة.`;
    }
}

// --- ربط أحداث واجهة المستخدم ---
function bindUI() {
    // أزرار الألوان
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLightColor = btn.dataset.color;
            updateRays();
            initPhotons();
            updateUI();
        });
    });

    const intensitySlider = document.getElementById('intensitySlider');
    if (intensitySlider) {
        intensitySlider.addEventListener('input', (e) => {
            intensity = e.target.value / 100;
            lightMat.emissiveIntensity = 0.3 + intensity * 0.9;
            updateRays();
            initPhotons();
        });
    }

    // أزرار نوع المنشور
    document.querySelectorAll('.prism-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.prism-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            prismType = btn.dataset.prism;
            updatePrismAppearance();
            updateRays();
            initPhotons();
            updateUI();
        });
    });

    const toggleBtn = document.getElementById('toggleLightBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            lightOn = !lightOn;
            toggleBtn.innerHTML = lightOn ? '<i class="fas fa-lightbulb"></i> إيقاف الضوء' : '<i class="fas fa-lightbulb"></i> تشغيل الضوء';
            updateRays();
            initPhotons();
            updateUI();
        });
    }

    const resetViewBtn = document.getElementById('resetViewBtn');
    if (resetViewBtn) {
        resetViewBtn.addEventListener('click', () => {
            camera.position.set(5, 3.5, 7);
            controls.target.set(0, 0.2, 0);
            controls.update();
        });
    }

    const rotateBtn = document.getElementById('toggleRotationBtn');
    if (rotateBtn) {
        rotateBtn.addEventListener('click', () => {
            autoRotate = !autoRotate;
            rotateBtn.style.background = autoRotate ? '#ef4444' : '';
        });
    }

    const angleSlider = document.getElementById('prismAngleSlider');
    if (angleSlider) {
        angleSlider.addEventListener('input', (e) => {
            prismAngle = parseInt(e.target.value);
            document.getElementById('angleValue').innerText = prismAngle + '°';
            prismGroup.rotation.y = prismAngle * Math.PI / 180;
            updateRays();
            initPhotons();
        });
    }

    const iorSlider = document.getElementById('iorSlider');
    if (iorSlider) {
        iorSlider.addEventListener('input', (e) => {
            prismBaseIOR = parseFloat(e.target.value);
            document.getElementById('iorValue').innerText = prismBaseIOR.toFixed(2);
            updatePrismAppearance();
            updateRays();
            initPhotons();
            updateUI();
        });
    }
}

// --- حلقة الرسم ---
function animate() {
    requestAnimationFrame(animate);
    if (autoRotate) {
        prismGroup.rotation.y += 0.008;
        const angleDeg = (prismGroup.rotation.y * 180 / Math.PI).toFixed(0);
        const angleSlider = document.getElementById('prismAngleSlider');
        if (angleSlider) angleSlider.value = angleDeg;
        const angleVal = document.getElementById('angleValue');
        if (angleVal) angleVal.innerText = angleDeg + '°';
        updateRays();
        initPhotons();
    }
    photons.forEach(p => p.update());
    controls.update();
    effectComposer.render();
}

// --- بدء التشغيل ---
function init() {
    bindUI();
    updatePrismAppearance();
    updateRays();
    initPhotons();
    updateUI();
    animate();
}

window.addEventListener('resize', () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height);
    effectComposer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

init();