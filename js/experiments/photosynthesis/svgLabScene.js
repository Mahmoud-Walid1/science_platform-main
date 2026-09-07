// ══════════════════════════════════════════════════════════════
// svgLabScene.js - محرك الرسوميات المتجهية 2D SVG المطابق 100%
// مختبر البناء الضوئي والتنفس الخلوي | Clean Architecture
// ══════════════════════════════════════════════════════════════

class SvgLabScene {
    constructor(containerId = 'labSvgContainer') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`SVG container #${containerId} not found.`);
        }

        this.viewWidth = 1200;
        this.viewHeight = 620;
        this.svg = null;
        this.defs = null;
        this.lampsLit = false; // المصابيح مطفأة افتراضياً عند بدء التجربة

        this.render();
        // تطبيق حالة المصابيح الافتراضية (مطفأة) بعد بناء الـ SVG
        setTimeout(() => this.toggleLamps(false), 50);
    }

    render() {
        this.container.innerHTML = '';

        const svgNS = "http://www.w3.org/2000/svg";
        this.svg = document.createElementNS(svgNS, "svg");
        this.svg.setAttribute("viewBox", `0 0 ${this.viewWidth} ${this.viewHeight}`);
        this.svg.setAttribute("id", "photosynthesisSvg");
        this.svg.setAttribute("class", "lab-svg-stage");
        this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

        this.buildDefs();
        this.buildEnvironment();
        this.buildUpperShelfEquipment();
        this.buildLowerBenchEquipment();

        this.container.appendChild(this.svg);
    }

    buildDefs() {
        const svgNS = "http://www.w3.org/2000/svg";
        this.defs = document.createElementNS(svgNS, "defs");

        this.defs.innerHTML = `
            <!-- خلفية وتدرج الجدار والمختبر -->
            <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#02384a" />
                <stop offset="100%" stop-color="#002b3a" />
            </linearGradient>

            <linearGradient id="countertopGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#738f9c" />
                <stop offset="8%" stop-color="#8ba7b4" />
                <stop offset="20%" stop-color="#5f7c89" />
                <stop offset="100%" stop-color="#4e6874" />
            </linearGradient>

            <linearGradient id="cabinetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3b525d" />
                <stop offset="100%" stop-color="#2a3d46" />
            </linearGradient>

            <linearGradient id="shelfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#244452" />
                <stop offset="100%" stop-color="#122730" />
            </linearGradient>

            <!-- تدرجات السوائل والكاشف -->
            <linearGradient id="fluidGreenGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#14532d" />
                <stop offset="40%" stop-color="#16a34a" />
                <stop offset="80%" stop-color="#15803d" />
                <stop offset="100%" stop-color="#0f3d1e" />
            </linearGradient>

            <linearGradient id="fluidBlueGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#1e3a8a" />
                <stop offset="40%" stop-color="#3b82f6" />
                <stop offset="80%" stop-color="#1d4ed8" />
                <stop offset="100%" stop-color="#172554" />
            </linearGradient>

            <linearGradient id="fluidYellowGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#a16207" />
                <stop offset="40%" stop-color="#facc15" />
                <stop offset="80%" stop-color="#ca8a04" />
                <stop offset="100%" stop-color="#713f12" />
            </linearGradient>

            <!-- لمعة الزجاج للأنابيب -->
            <linearGradient id="glassGloss" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="rgba(255,255,255,0.4)" />
                <stop offset="25%" stop-color="rgba(255,255,255,0.05)" />
                <stop offset="70%" stop-color="rgba(255,255,255,0)" />
                <stop offset="90%" stop-color="rgba(255,255,255,0.25)" />
                <stop offset="100%" stop-color="rgba(255,255,255,0.5)" />
            </linearGradient>

            <!-- كرتون الصناديق -->
            <linearGradient id="boxGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#7c532d" />
                <stop offset="35%" stop-color="#a17144" />
                <stop offset="85%" stop-color="#8c5f34" />
                <stop offset="100%" stop-color="#674221" />
            </linearGradient>

            <!-- شريط الطيف اللوني -->
            <linearGradient id="spectrumBar" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#7c3aed" />
                <stop offset="20%" stop-color="#2563eb" />
                <stop offset="40%" stop-color="#059669" />
                <stop offset="60%" stop-color="#facc15" />
                <stop offset="80%" stop-color="#f97316" />
                <stop offset="100%" stop-color="#dc2626" />
            </linearGradient>

            <!-- إضاءة المصابيح -->
            <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="rgba(254, 240, 138, 0.45)" />
                <stop offset="50%" stop-color="rgba(253, 224, 71, 0.18)" />
                <stop offset="100%" stop-color="rgba(253, 224, 71, 0)" />
            </radialGradient>

            <!-- فلاتر الظلال المتجهة -->
            <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.25" />
            </filter>
            
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        `;

        this.svg.appendChild(this.defs);
    }

    buildEnvironment() {
        const svgNS = "http://www.w3.org/2000/svg";
        const envGroup = document.createElementNS(svgNS, "g");
        envGroup.setAttribute("id", "env_group");

        envGroup.innerHTML = `
            <!-- 1. جدار المختبر الخلفي -->
            <rect x="0" y="0" width="${this.viewWidth}" height="${this.viewHeight}" fill="url(#wallGrad)" />

            <!-- 2. الرف العلوي المستعرض -->
            <g id="upper_shelf_structure">
                <!-- دعامات الرف المعدنية -->
                <rect x="180" y="248" width="8" height="24" fill="#0c1d25" />
                <rect x="520" y="248" width="8" height="24" fill="#0c1d25" />
                <rect x="850" y="248" width="8" height="24" fill="#0c1d25" />
                <!-- لوح الرف الرئيسي -->
                <rect x="30" y="240" width="1140" height="12" rx="2" fill="url(#shelfGrad)" filter="url(#dropShadow)" />
                <rect x="30" y="240" width="1140" height="2.5" fill="#3b697d" />
            </g>

            <!-- 3. طاولة المختبر الرئيسية (Countertop) -->
            <g id="workbench_structure">
                <!-- سطح الطاولة العلوي مع الحافة المائلة -->
                <rect x="20" y="510" width="1160" height="24" rx="3" fill="url(#countertopGrad)" filter="url(#dropShadow)" />
                <rect x="20" y="510" width="1160" height="3" fill="#a4c2d1" />
                
                <!-- جسم الخزائن السفلية -->
                <rect x="25" y="534" width="1150" height="86" fill="url(#cabinetGrad)" />
                
                <!-- فواصل أبواب الخزائن ومقابض السحب المستطيلة الداكنة -->
                <line x1="315" y1="534" x2="315" y2="620" stroke="#1c2b32" stroke-width="2.5" />
                <line x1="605" y1="534" x2="605" y2="620" stroke="#1c2b32" stroke-width="2.5" />
                <line x1="895" y1="534" x2="895" y2="620" stroke="#1c2b32" stroke-width="2.5" />

                <!-- مقابض الأدراج الأفقية الأربعة كما في الصورة تماماً -->
                <rect x="135" y="555" width="55" height="7" rx="2" fill="#182329" />
                <rect x="425" y="555" width="55" height="7" rx="2" fill="#182329" />
                <rect x="715" y="555" width="55" height="7" rx="2" fill="#182329" />
                <rect x="1005" y="555" width="55" height="7" rx="2" fill="#182329" />
            </g>
        `;

        this.svg.appendChild(envGroup);
    }

    buildUpperShelfEquipment() {
        const svgNS = "http://www.w3.org/2000/svg";
        const upperGroup = document.createElementNS(svgNS, "g");
        upperGroup.setAttribute("id", "upper_equipment_group");

        upperGroup.innerHTML = `
            <!-- أ. حامل السدادات المطاطية (4 سدادات مطاطية برتقالية) -->
            <g id="stoppers_and_caps_shelf" transform="translate(60, 125)">
                <!-- هيكل الحامل الرمادي الداكن المضلع المطابق للصورة -->
                <rect x="5" y="20" width="160" height="92" rx="4" fill="#24333c" stroke="#3b525d" stroke-width="2" />
                <rect x="5" y="20" width="160" height="10" fill="#1c2930" />
                <!-- شبكة خلايا الرف -->
                <line x1="45" y1="30" x2="45" y2="112" stroke="#182329" stroke-width="2" />
                <line x1="85" y1="30" x2="85" y2="112" stroke="#182329" stroke-width="2" />
                <line x1="125" y1="30" x2="125" y2="112" stroke="#182329" stroke-width="2" />
                <line x1="5" y1="70" x2="165" y2="70" stroke="#182329" stroke-width="2" />
                
                <!-- السدادات المطاطية الأربعة البرتقالية في منتصف خلايا الرف بالضبط -->
                <g id="shelf_stoppers_row">
                    ${[0, 1, 2, 3].map(i => `
                        <g id="shelf_stopper_group_${i}" class="svg-draggable" data-type="stopper" data-index="${i}" transform="translate(${25 + i * 40}, 50)" style="cursor: grab;">
                            <polygon points="-8,11 8,11 11,-9 -11,-9" fill="#d97706" stroke="#92400e" stroke-width="1.2" />
                            <ellipse cx="0" cy="-9" rx="11" ry="3.2" fill="#f59e0b" />
                            <rect x="-16" y="-32" width="32" height="14" rx="3" fill="#0f3d54" />
                            <text x="0" y="-22" fill="#ffffff" font-size="8.5" font-family="'Cairo', sans-serif" font-weight="700" text-anchor="middle">سدادة</text>
                        </g>
                    `).join('')}
                </g>

                <!-- أغطية الكيوفيتات الأربعة الحمراء في الصف السفلي من الرف (تحت السدادات) -->
                <g id="shelf_cuvette_caps_row">
                    ${[0, 1, 2, 3].map(i => `
                        <g id="shelf_cuvette_cap_${i}" class="svg-draggable svg-clickable" data-type="cap" data-index="${i}" onclick="window.photosynthesisLab.onShelfCapClick(${i})" transform="translate(${25 + i * 40}, 91)" style="cursor: grab;">
                            <rect x="-10" y="-5" width="20" height="10" rx="2" fill="#dc2626" stroke="#991b1b" stroke-width="1.2" filter="url(#dropShadow)" />
                            <rect x="-8" y="-3" width="16" height="3" rx="1" fill="#f87171" />
                            <rect x="-14" y="-22" width="28" height="13" rx="2" fill="#0f3d54" />
                            <text x="0" y="-13" fill="#ffffff" font-size="7" font-family="'Cairo', sans-serif" font-weight="700" text-anchor="middle">غطاء ${i + 1}</text>
                        </g>
                    `).join('')}
                </g>
            </g>

            <!-- ب. حوض نبات الإيلوديا المائي الشفاف -->
            <g id="aquarium_tank_group" transform="translate(260, 110)">
                <!-- الإطار الخارجي للحوض والماء الشفاف والفقاعات والقاع الحصوي -->
                <rect x="0" y="0" width="140" height="130" rx="3" fill="rgba(56, 189, 248, 0.12)" stroke="#1e293b" stroke-width="3" />
                <rect x="2" y="10" width="136" height="118" fill="rgba(14, 165, 233, 0.22)" />
                <line x1="2" y1="10" x2="138" y2="10" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />
                
                <!-- حصى القاع الملون -->
                <rect x="2" y="116" width="136" height="12" fill="#78716c" />
                ${[10, 22, 38, 52, 68, 85, 102, 118, 128].map((x, idx) => `
                    <ellipse cx="${x}" cy="122" rx="${4 + (idx % 3)}" ry="3.5" fill="${idx % 2 === 0 ? '#f97316' : '#e2e8f0'}" />
                `).join('')}

                <!-- نباتات إيلوديا خلفية دائمة تعطي الحوض كثافة نباتية خضراء دائمة -->
                <g transform="translate(25, 20)" opacity="0.6" pointer-events="none">
                    <path d="M 10 0 Q 8 45 10 98" stroke="#15803d" stroke-width="2.5" fill="none" />
                    ${[10, 25, 40, 55, 70, 85].map(y => `
                        <path d="M 10 ${y} C 2 ${y-3} 1 ${y+5} 10 ${y+2}" fill="#16a34a" />
                        <path d="M 10 ${y} C 18 ${y-3} 19 ${y+5} 10 ${y+2}" fill="#16a34a" />
                    `).join('')}
                </g>
                <g transform="translate(95, 22)" opacity="0.6" pointer-events="none">
                    <path d="M 10 0 Q 12 45 10 98" stroke="#15803d" stroke-width="2.5" fill="none" />
                    ${[12, 27, 42, 57, 72, 87].map(y => `
                        <path d="M 10 ${y} C 2 ${y-3} 1 ${y+5} 10 ${y+2}" fill="#16a34a" />
                        <path d="M 10 ${y} C 18 ${y-3} 19 ${y+5} 10 ${y+2}" fill="#16a34a" />
                    `).join('')}
                </g>

                <!-- نباتات الإيلوديا التفاعلية الأربعة المتاحة للسحب لأي أنبوب -->
                ${[1, 2, 3, 4].map((plantIdx, pOffset) => `
                    <g id="elodea_plant_source_${plantIdx}" class="svg-draggable" data-type="plant" data-index="${plantIdx}" transform="translate(${16 + pOffset * 28}, 15)">
                        <path d="M 12 0 Q 11 45 12 102" stroke="#15803d" stroke-width="3" fill="none" />
                        ${[8, 20, 32, 44, 56, 68, 80, 92].map(y => `
                            <path d="M 12 ${y} C 2 ${y-4} 1 ${y+6} 12 ${y+3}" fill="#22c55e" stroke="#166534" stroke-width="0.8" />
                            <path d="M 12 ${y} C 22 ${y-4} 23 ${y+6} 12 ${y+3}" fill="#22c55e" stroke="#166534" stroke-width="0.8" />
                        `).join('')}
                    </g>
                `).join('')}
                
                <!-- فقاعات ماء صاعدة -->
                <circle cx="45" cy="40" r="2.5" fill="rgba(255,255,255,0.6)" />
                <circle cx="85" cy="65" r="3" fill="rgba(255,255,255,0.6)" />
                <circle cx="105" cy="30" r="2" fill="rgba(255,255,255,0.6)" />
            </g>

            <!-- ج. صندوقا حجب الضوء الكرتونيان الهرميان (صندوقان اثنان فقط) على الرف المطابقان للشكل الأصلي -->
            <g id="cardboard_boxes_shelf">
                <!-- صندوق 1 -->
                <g id="box_source_1" class="svg-draggable" data-type="box" data-index="1" transform="translate(435, 95)" style="cursor: grab;">
                    <polygon points="5,22 45,22 50,145 0,145" fill="url(#boxGrad)" filter="url(#dropShadow)" />
                    <polygon points="5,22 25,2 45,22" fill="#b48356" />
                    <line x1="25" y1="2" x2="25" y2="145" stroke="#5c3818" stroke-width="1.2" opacity="0.6" />
                    <rect x="6" y="-18" width="38" height="14" rx="3" fill="#0f3d54" />
                    <text x="25" y="-8" fill="#ffffff" font-size="8.5" font-family="'Cairo', sans-serif" font-weight="700" text-anchor="middle">صندوق</text>
                </g>

                <!-- صندوق 2 -->
                <g id="box_source_2" class="svg-draggable" data-type="box" data-index="2" transform="translate(495, 95)" style="cursor: grab;">
                    <polygon points="5,22 45,22 50,145 0,145" fill="url(#boxGrad)" filter="url(#dropShadow)" />
                    <polygon points="5,22 25,2 45,22" fill="#b48356" />
                    <line x1="25" y1="2" x2="25" y2="145" stroke="#5c3818" stroke-width="1.2" opacity="0.6" />
                    <rect x="6" y="-18" width="38" height="14" rx="3" fill="#0f3d54" />
                    <text x="25" y="-8" fill="#ffffff" font-size="8.5" font-family="'Cairo', sans-serif" font-weight="700" text-anchor="middle">صندوق</text>
                </g>
            </g>

            <!-- د. لوحة مقياس الرقم الهيدروجيني (pH scale poster) -->
            <g id="ph_scale_poster_group" transform="translate(630, 80)">
                <rect x="0" y="0" width="410" height="140" rx="5" fill="#ffffff" filter="url(#dropShadow)" />
                <text x="205" y="24" fill="#334155" font-size="11" font-family="'Cairo', sans-serif" font-weight="800" text-anchor="middle">
                    مقياس الرقم الهيدروجيني (pH)
                </text>

                <!-- دوائر الألوان والتدريج -->
                ${[
                    { val: '2.0', col: '#eab308' },
                    { val: '6.0', col: '#facc15' },
                    { val: '6.1', col: '#f59e0b' },
                    { val: '6.3', col: '#eab308' },
                    { val: '6.5', col: '#84cc16' },
                    { val: '6.7', col: '#4ade80' },
                    { val: '6.9', col: '#22c55e' },
                    { val: '7.1', col: '#10b981' },
                    { val: '7.3', col: '#06b6d4' },
                    { val: '7.5', col: '#0ea5e9' },
                    { val: '7.7', col: '#3b82f6' },
                    { val: '8.0', col: '#1d4ed8' },
                    { val: '12.0', col: '#6d28d9' }
                ].map((ph, idx) => `
                    <g transform="translate(${25 + idx * 28}, 45)">
                        <circle cx="10" cy="10" r="9.5" fill="${ph.col}" />
                        <text x="10" y="32" fill="#475569" font-size="7.5" font-family="'Cairo', sans-serif" font-weight="700" text-anchor="middle">${ph.val}</text>
                    </g>
                `).join('')}

                <!-- شريط المدى المثالي للنشاط -->
                <rect x="40" y="90" width="330" height="24" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />
                <text x="205" y="106" fill="#0f172a" font-size="9" font-family="'Cairo', sans-serif" font-weight="bold" text-anchor="middle">
                    المدى المثالي لنشاط كاشف BTB (6.0 - 8.0)
                </text>
            </g>
        `;

        this.svg.appendChild(upperGroup);
    }

    buildLowerBenchEquipment() {
        const svgNS = "http://www.w3.org/2000/svg";
        const lowerGroup = document.createElementNS(svgNS, "g");
        lowerGroup.setAttribute("id", "lower_equipment_group");

        lowerGroup.innerHTML = `
            <!-- طبقة التعتيم الليلي عند إطفاء الإضاءة -->
            <rect id="lab_ambient_dimmer" x="0" y="0" width="1200" height="620" fill="#000814" opacity="0" pointer-events="none" style="transition: opacity 0.4s ease;" />

            <!-- 1. محطة الأنابيب والمصابيح الجدارية المعلقة -->
            <g id="tubes_and_lamps_station">
                <!-- المصباحان المعلقان مع سلكين ومفتاح تشغيل/إيقاف -->
                <g id="hanging_lamps_group">
                    <!-- سلك ومصباح 1 فوق أنبوب 2 -->
                    <line x1="140" y1="230" x2="140" y2="295" stroke="#000000" stroke-width="2" />
                    <polygon points="120,315 160,315 148,295 132,295" fill="#f8fafc" stroke="#64748b" stroke-width="1.5" />
                    <ellipse id="lamp_bulb_1" cx="140" cy="315" rx="18" ry="5" fill="#fef08a" />
                    <polygon id="lamp_glow_1" points="140,315 80,480 200,480" fill="url(#lampLightCone)" opacity="0.85" />

                    <!-- سلك ومصباح 2 فوق أنبوب 3 -->
                    <line x1="260" y1="230" x2="260" y2="295" stroke="#000000" stroke-width="2" />
                    <polygon points="240,315 280,315 268,295 252,295" fill="#f8fafc" stroke="#64748b" stroke-width="1.5" />
                    <ellipse id="lamp_bulb_2" cx="260" cy="315" rx="18" ry="5" fill="#fef08a" />
                    <polygon id="lamp_glow_2" points="260,315 200,480 320,480" fill="url(#lampLightCone)" opacity="0.85" />

                    <!-- مفتاح تشغيل الإضاءة على الجدار -->
                    <g id="lamp_switch_wall" class="svg-clickable" onclick="window.photosynthesisLab.toggleLamps()" transform="translate(190, 260)" style="cursor: pointer;">
                        <rect x="0" y="0" width="22" height="40" rx="3" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" />
                        <line x1="11" y1="12" x2="11" y2="28" stroke="#cbd5e1" stroke-width="3" />
                        <circle id="switch_toggle" cx="11" cy="14" r="5" fill="#22c55e" filter="url(#dropShadow)" />
                        <text x="11" y="6" fill="#64748b" font-size="5" font-weight="bold" text-anchor="middle">On</text>
                        <text x="11" y="34" fill="#64748b" font-size="5" font-weight="bold" text-anchor="middle">Off</text>
                    </g>
                </g>

                <!-- الأنابيب الأربعة الزجاجية 1..4 على طاولة المختبر -->
                <g id="test_tubes_rack">
                    ${[1, 2, 3, 4].map((num, i) => `
                        <g id="tube_station_${num}" class="tube-snap-station svg-clickable" data-tube-index="${num}" onclick="window.photosynthesisLab.onTubeClick(${num})" transform="translate(${70 + i * 60}, 360)" style="cursor: pointer;">
                            <!-- هدف التثبيت والإسقاط اللامع -->
                            <rect id="tube_snap_target_${num}" class="snap-target-highlight" x="-4" y="-4" width="36" height="155" rx="16" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="4,4" opacity="0" />

                            <!-- كاشف المحلول السائل داخل الأنبوب -->
                            <path id="tube_fluid_${num}" d="M 3 25 L 25 25 L 25 130 C 25 142 3 142 3 130 Z" fill="url(#fluidGreenGrad)" />
                            
                            <!-- سطح السائل المقعر -->
                            <ellipse id="tube_meniscus_${num}" cx="14" cy="25" rx="11" ry="3.5" fill="#16a34a" />

                            <!-- نبات الإيلوديا داخل الأنبوب (يظهر بوضوح فائق داخل المحلول السائل مطابق للمرجع) -->
                            <g id="tube_plant_${num}" style="display: none;" transform="translate(14, 25)" pointer-events="none">
                                <path d="M 0 0 L 0 102" stroke="#15803d" stroke-width="3.2" fill="none" />
                                ${[12, 24, 38, 52, 66, 80, 92].map(y => `
                                    <path d="M 0 ${y} C -10 ${y-4} -9 ${y+6} 0 ${y+3}" fill="#22c55e" stroke="#166534" stroke-width="0.9" />
                                    <path d="M 0 ${y} C 10 ${y-4} 9 ${y+6} 0 ${y+3}" fill="#22c55e" stroke="#166534" stroke-width="0.9" />
                                `).join('')}
                            </g>

                            <!-- زجاج الأنبوب الشفاف واللمعان -->
                            <path d="M 2 0 L 26 0 L 26 132 C 26 146 2 146 2 132 Z" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="2.2" />
                            <rect x="4" y="2" width="6" height="130" fill="url(#glassGloss)" />
                            <ellipse cx="14" cy="2" rx="12" ry="3" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" />

                            <!-- ملصق رقم الأنبوب الأبيض الواضح -->
                            <rect x="3" y="55" width="22" height="26" rx="2" fill="#ffffff" filter="url(#dropShadow)" />
                            <text x="14" y="73" fill="#0f172a" font-size="15" font-family="'Cairo', sans-serif" font-weight="900" text-anchor="middle">${num}</text>

                            <!-- السدادة المطاطية عند سد الأنبوب (مخفية مبدئياً) في منتصف فوهة الأنبوب -->
                            <g id="tube_stopper_${num}" class="svg-draggable svg-clickable" data-type="placed_stopper" data-tube="${num}" style="display: none; cursor: grab;" transform="translate(14, -2)">
                                <polygon points="-8,14 8,14 11,-4 -11,-4" fill="#d97706" stroke="#92400e" stroke-width="1.2" />
                                <ellipse cx="0" cy="-4" rx="11" ry="3.2" fill="#f59e0b" />
                            </g>

                            <!-- غطاء الصندوق الكرتوني عند تغطية الأنبوب (مخفي مبدئياً) -->
                            <g id="tube_box_${num}" class="svg-draggable svg-clickable" data-type="placed_box" data-tube="${num}" style="display: none; cursor: grab;" transform="translate(-11, -30)">
                                <polygon points="5,22 45,22 50,180 0,180" fill="url(#boxGrad)" filter="url(#dropShadow)" />
                                <polygon points="5,22 25,2 45,22" fill="#b48356" />
                                <text x="25" y="105" fill="#ffffff" font-size="12" font-family="'Cairo', sans-serif" font-weight="900" text-anchor="middle">صندوق</text>
                            </g>
                        </g>
                    `).join('')}
                </g>
            </g>

            <!-- 2. ملصق مخطط تركيب التجربة المعلق على الجدار -->
            <g id="setup_poster_wall" class="svg-clickable" onclick="window.photosynthesisLab.openSetupPosterModal()" transform="translate(420, 275)" style="cursor: pointer;">
                <rect x="0" y="0" width="135" height="110" rx="3" fill="#ffffff" filter="url(#dropShadow)" />
                <rect x="2" y="2" width="131" height="18" fill="#1e3a47" />
                <text x="67" y="14" fill="#ffffff" font-size="8.5" font-family="'Cairo', sans-serif" font-weight="800" text-anchor="middle">مخطط تركيب التجربة</text>

                <!-- 4 أنابيب مصغرة بالملصق توضح التجربة (1 مكشوف، 2 صندوق، 3 مكشوف بنبات، 4 صندوق بنبات) مطابقة للمودال 100% -->
                ${[
                    { id: 1, p: false, b: false },
                    { id: 2, p: false, b: true },
                    { id: 3, p: true, b: false },
                    { id: 4, p: true, b: true }
                ].map((t, idx) => `
                    <g transform="translate(${14 + idx * 28}, 26)">
                        <!-- سدادة برتقالية -->
                        <polygon points="6,6 14,6 13,1 7,1" fill="#d97706" stroke="#b45309" stroke-width="0.8" />
                        <ellipse cx="10" cy="1" rx="3.5" ry="1.2" fill="#f59e0b" />
                        ${t.b ? `
                            <!-- صندوق كرتوني بني مع أجنحة -->
                            <rect x="1" y="7" width="18" height="54" fill="#78350f" rx="1" />
                            <polygon points="1,7 19,7 17,3 3,3" fill="#a16207" />
                            <polygon points="1,7 3,7 3,61 1,61" fill="#b45309" />
                            <polygon points="17,7 19,7 19,61 17,61" fill="#9a3412" />
                        ` : `
                            <!-- أنبوب زجاجي شفاف ومحلول أخضر -->
                            <path d="M 3 6 L 3 55 C 3 61 17 61 17 55 L 17 6" fill="rgba(240,253,244,0.3)" stroke="#94a3b8" stroke-width="1" />
                            <path d="M 4 10 L 16 10 L 16 54 C 16 59 4 59 4 54 Z" fill="#4d7c0f" />
                            <line x1="5" y1="10" x2="5" y2="50" stroke="rgba(255,255,255,0.4)" stroke-width="1" stroke-linecap="round" />
                        `}
                        ${t.p ? `
                            <!-- نبات الإيلوديا الأخضر داخل الأنبوب -->
                            <path d="M 10 13 Q 10.5 35 10 54" stroke="#15803d" stroke-width="1.8" fill="none" />
                            <path d="M 10 18 C 5 16 5 21 10 20" fill="#22c55e" stroke="#166534" stroke-width="0.5" />
                            <path d="M 10 18 C 15 16 15 21 10 20" fill="#22c55e" stroke="#166534" stroke-width="0.5" />
                            <path d="M 10 28 C 5 26 5 31 10 30" fill="#22c55e" stroke="#166534" stroke-width="0.5" />
                            <path d="M 10 28 C 15 26 15 31 10 30" fill="#22c55e" stroke="#166534" stroke-width="0.5" />
                            <path d="M 10 44 C 5 42 5 47 10 46" fill="#22c55e" stroke="#166534" stroke-width="0.5" />
                            <path d="M 10 44 C 15 42 15 47 10 46" fill="#22c55e" stroke="#166534" stroke-width="0.5" />
                        ` : ''}
                        <!-- بطاقة رقم الأنبوب البيضاء المطابقة للمودال -->
                        <rect x="4.5" y="31" width="11" height="12" rx="1" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8" />
                        <text x="10" y="40.5" fill="#000000" font-size="8.5" font-family="'Cairo', sans-serif" font-weight="900" text-anchor="middle">${t.id}</text>
                    </g>
                `).join('')}

                <text x="67" y="102" fill="#0284c7" font-size="8" font-family="'Cairo', sans-serif" font-weight="700" text-anchor="middle">انقر لتكبير المخطط 🔍</text>
            </g>

            <!-- 3. ماصة P1000 والحامل وعلبة الرؤوس وسلة المهملات -->
            <g id="pipette_station_group">
                <!-- أ. حامل الماصة المعدني الأبيض مع شارة P1000 العلوية -->
                <g id="pipette_stand_mesh" transform="translate(325, 290)">
                    <!-- لافتة P1000 على قمة الحامل -->
                    <rect x="0" y="-18" width="46" height="15" rx="3" fill="#1e3a47" />
                    <text x="23" y="-7" fill="#ffffff" font-size="8.5" font-family="'Cairo', sans-serif" font-weight="900" text-anchor="middle">P1000</text>

                    <rect x="0" y="0" width="46" height="12" rx="2" fill="#0f3d54" />
                    <text x="23" y="9" fill="#ffffff" font-size="7" font-family="'Cairo', sans-serif" font-weight="bold" text-anchor="middle">حامل الماصة</text>
                    <line x1="6" y1="12" x2="6" y2="220" stroke="#cbd5e1" stroke-width="4" />
                    <line x1="40" y1="12" x2="40" y2="220" stroke="#cbd5e1" stroke-width="4" />
                    <rect x="0" y="215" width="46" height="8" rx="2" fill="#94a3b8" />
                </g>

                <!-- شارة حجم الماصة (تبدأ عند 200 µl وتفتح نافذة الضبط بالنقر المباشر فقط) -->
                <g id="pipette_vol_badge" class="svg-clickable" onclick="window.photosynthesisLab.openPipetteVolModal()" transform="translate(290, 318)" style="cursor: pointer;">
                    <!-- بالون كلامي كبسولي أخضر أنيق -->
                    <rect id="pipette_vol_badge_bg" x="-10" y="0" width="70" height="18" rx="9" fill="#064e3b" stroke="#10b981" stroke-width="1.2" filter="url(#dropShadow)" />
                    <text id="pipette_badge_text" x="25" y="12.5" fill="#34d399" font-size="9" font-family="'Cairo', sans-serif" font-weight="800" text-anchor="middle">200 µl</text>
                </g>

                <!-- ب. ماصة P1000 المعملية التفاعلية -->
                <g id="pipette_tool" class="svg-draggable svg-clickable" onclick="window.photosynthesisLab.onPipetteClick()" data-type="pipette" transform="translate(337, 305)" style="cursor: grab;">
                    <!-- زر الضغط العلوي (Plunger) -->
                    <rect x="8" y="0" width="8" height="14" rx="2" fill="#0284c7" />
                    <!-- المقبض الأبيض -->
                    <path d="M 4 14 L 20 14 L 18 80 L 6 80 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" />
                    <!-- نافذة قراءة الحجم الرقمي (تبدأ عند 0200) -->
                    <rect x="6" y="32" width="12" height="16" fill="#0f172a" />
                    <text id="pipette_display_vol" x="12" y="44" fill="#38bdf8" font-size="6.5" font-family="'Courier New', monospace" font-weight="900" text-anchor="middle">0200</text>
                    <!-- ساق الماصة المعدنية الأسطوانية بدون رأس (Naked Pipette Barrel) -->
                    <rect x="10" y="80" width="4" height="36" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" />
                    <!-- فوهة تركيب الرأس المخروطية الصغيرة -->
                    <polygon points="9.5,116 14.5,116 13.5,123 10.5,123" fill="#64748b" />
                    <!-- سائل داخل الماصة (عند السحب) -->
                    <polygon id="pipette_fluid" points="10.5,126 13.5,126 13,165 11,165" fill="#16a34a" opacity="0" style="transition: fill 0.3s ease, opacity 0.3s ease;" />
                    <!-- رأس الماصة المركب (Tip) - مخفي تماماً في البداية حتى يركبه المستخدم -->
                    <polygon id="pipette_tip" points="9,120 15,120 13,165 11,165" fill="rgba(56, 189, 248, 0.75)" stroke="#0284c7" stroke-width="1" style="display: none; transition: fill 0.3s ease, opacity 0.3s ease;" />
                </g>

                <!-- ج. علبة رؤوس الماصة P1000 (Tips Box) -->
                <g id="tips_box_group" class="svg-clickable" onclick="window.photosynthesisLab.toggleTipsBoxLid()" transform="translate(425, 430)" style="cursor: pointer;">
                    <!-- قاعدة العلبة الزرقاء -->
                    <rect x="0" y="35" width="65" height="45" rx="3" fill="#0284c7" stroke="#0369a1" stroke-width="1.5" />
                    <!-- صفوف الرؤوس البلاستيكية البيضاء الصاعدة -->
                    ${[8, 18, 28, 38, 48, 56].map(x => `
                        <polygon points="${x},24 ${x+4},24 ${x+3},40 ${x+1},40" fill="#ffffff" opacity="0.9" />
                    `).join('')}
                    <!-- غطاء شفاف قابل للفتح بالأعلى -->
                    <g id="tips_box_lid" style="transform-origin: 3px 38px; transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);">
                        <rect x="3" y="10" width="59" height="28" rx="3" fill="rgba(255,255,255,0.32)" stroke="rgba(255,255,255,0.85)" stroke-width="1.2" />
                        <line x1="12" y1="12" x2="50" y2="12" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.8" />
                    </g>
                    <!-- ملصق العلبة -->
                    <rect x="0" y="-14" width="65" height="13" rx="2" fill="#0f3d54" />
                    <text x="32" y="-5" fill="#ffffff" font-size="7" font-family="'Cairo', sans-serif" font-weight="700" text-anchor="middle">رؤوس الماصة P1000</text>
                </g>

                <!-- د. سلة المهملات البلاستيكية الزرقاء (Trash) -->
                <g id="trash_bin_group" class="trash-snap-station" transform="translate(525, 450)">
                    <polygon points="10,0 80,0 72,55 18,55" fill="#1d4ed8" stroke="#1e40af" stroke-width="1.8" filter="url(#dropShadow)" />
                    <ellipse cx="45" cy="4" rx="33" ry="5" fill="#0f172a" />
                    <!-- ملصق سلة المهملات -->
                    <rect x="18" y="-16" width="54" height="13" rx="2.5" fill="#0f3d54" />
                    <text x="45" y="-7" fill="#ffffff" font-size="7.5" font-family="'Cairo', sans-serif" font-weight="700" text-anchor="middle">سلة المهملات</text>
                </g>
            </g>

            <!-- 4. جهاز مقياس الطيف الضوئي (Spectrophotometer) المطابق 100% -->
            <g id="spectrophotometer_device_group" transform="translate(870, 395)">
                <!-- هيكل الجهاز الأبيض المنحني والظلال -->
                <rect x="0" y="20" width="240" height="95" rx="14" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" filter="url(#dropShadow)" />
                <rect x="0" y="20" width="240" height="8" rx="4" fill="#e2e8f0" />
                
                <!-- أرجل الدعم المطاطية السوداء -->
                <rect x="25" y="114" width="16" height="5" rx="1" fill="#0f172a" />
                <rect x="195" y="114" width="16" height="5" rx="1" fill="#0f172a" />

                <!-- حجرة العينات والغطاء الأزرق على اليمين وشريط الأدوات العائم المطابق للصورة -->
                <g id="spec_chamber_section" transform="translate(138, 14)">
                    <!-- شريط الأدوات العائم فوق حجرة العينات (Toolbar matching reference 1 & 2) -->
                    <g id="spec_quick_toolbar" transform="translate(-32, -96)">
                        <!-- سهم المؤشر السفلي الموجه لغطاء الحجرة -->
                        <polygon points="64,32 76,32 70,40" fill="#1e3a5f" opacity="0.85" />
                        
                        <!-- خلفية الشريط البيضاء المنحنية الأنيقة -->
                        <rect id="spec_toolbar_bg" x="0" y="0" width="140" height="32" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="url(#dropShadow)" />
                        
                        <!-- الزر 1: أيقونة الترس للضبط (⚙️ Settings) -->
                        <g class="svg-clickable" onclick="window.photosynthesisLab.openSpecSettingsModal()" style="cursor: pointer;">
                            <rect x="0" y="0" width="36" height="32" rx="4" fill="transparent" />
                            <g transform="translate(18, 16) scale(0.65)">
                                <circle cx="0" cy="0" r="10" fill="#0f3d54" />
                                <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
                                ${[0, 45, 90, 135, 180, 225, 270, 315].map(deg => `
                                    <rect x="-2" y="-12" width="4" height="4" rx="0.5" fill="#0f3d54" transform="rotate(${deg})" />
                                `).join('')}
                            </g>
                            <line x1="36" y1="0" x2="36" y2="32" stroke="#e2e8f0" stroke-width="1.2" />
                        </g>

                        <!-- الزر 2: زر المعلومات (معلومات) -->
                        <g class="svg-clickable" onclick="window.photosynthesisLab.openSpecInfoModal()" style="cursor: pointer;">
                            <rect x="36" y="0" width="54" height="32" fill="transparent" />
                            <text x="63" y="21" fill="#0284c7" font-size="12" font-family="'Cairo', sans-serif" font-weight="700" text-anchor="middle">معلومات</text>
                            <line x1="90" y1="0" x2="90" y2="32" stroke="#e2e8f0" stroke-width="1.2" />
                        </g>

                        <!-- الزر 3: زر فتح/إغلاق الغطاء (فتح / إغلاق) -->
                        <g class="svg-clickable" onclick="window.photosynthesisLab.toggleSpecLid()" style="cursor: pointer;">
                            <rect x="90" y="0" width="50" height="32" fill="transparent" />
                            <text id="spec_toolbar_lid_text" x="115" y="21" fill="#0284c7" font-size="12.5" font-family="'Cairo', sans-serif" font-weight="700" text-anchor="middle">فتح</text>
                        </g>

                        <!-- الزر 4: زر إخراج الكيوفيت وإعادتها للحامل (يظهر فقط عند وجود كيوفيت في الحجرة كما في الصورة 2) -->
                        <g id="spec_toolbar_eject_btn" class="svg-clickable" onclick="window.photosynthesisLab.removeCuvetteFromChamber()" style="display: none; cursor: pointer;">
                            <line x1="140" y1="0" x2="140" y2="32" stroke="#e2e8f0" stroke-width="1.2" />
                            <rect x="140" y="0" width="42" height="32" rx="4" fill="transparent" />
                            <!-- رسم أيقونة الكيوفيت مع علامة الحظر الحمراء 🚫 -->
                            <g transform="translate(161, 16)">
                                <rect x="-4" y="-9" width="8" height="18" rx="1" fill="#0f3d54" stroke="#ffffff" stroke-width="0.5" />
                                <circle cx="0" cy="0" r="9.5" fill="none" stroke="#ef4444" stroke-width="2.2" />
                                <line x1="-6.5" y1="-6.5" x2="6.5" y2="6.5" stroke="#ef4444" stroke-width="2.2" />
                            </g>
                        </g>
                    </g>

                    <!-- منصة حجرة العينات الرمادية المعدنية -->
                    <g id="spec_chamber_well_group">
                        <rect x="0" y="6" width="76" height="26" rx="2" fill="#52525b" stroke="#3f3f46" stroke-width="1.5" />
                        
                        <!-- مفصلات الغطاء الزرقاء في الحافة الخلفية -->
                        ${[4, 10, 16, 56, 62, 68].map(hx => `
                            <rect x="${hx}" y="4" width="4" height="4" rx="0.5" fill="#0284c7" />
                        `).join('')}

                        <!-- فتحة / مكان إدخال الكيوفيت (Cuvette Slot) الداكنة في المنتصف -->
                        <g id="spec_cuvette_slot_group" class="spec-snap-station svg-clickable" onclick="window.photosynthesisLab.onSpecSlotClick()" style="cursor: pointer;">
                            <rect id="spec_cuvette_slot" x="27" y="10" width="22" height="18" rx="2" fill="#18181b" stroke="#09090b" stroke-width="1.2" />
                            <!-- تأثير الظل والعمق البصري لفتحة الكيوفيت -->
                            <rect x="28" y="11" width="20" height="3" fill="#09090b" opacity="0.7" />
                            <rect x="28" y="11" width="3" height="16" fill="#09090b" opacity="0.7" />
                        </g>

                        <!-- الكيوفيت المستقرة داخل الفتحة (تظهر عند وضع كيوفيت بالداخل كما بالصورة 2) -->
                        <g id="spec_inserted_cuvette" class="svg-clickable" onclick="window.photosynthesisLab.removeCuvetteFromChamber()" style="display: none; cursor: pointer;" transform="translate(28, 0)">
                            <!-- جسم الكيوفيت الزجاجي البارز من الفتحة -->
                            <rect x="0" y="4" width="20" height="16" rx="1.5" fill="rgba(255, 255, 255, 0.2)" stroke="rgba(255, 255, 255, 0.85)" stroke-width="1.2" />
                            <!-- السائل الملون داخل الكيوفيت -->
                            <rect id="spec_chamber_fluid" x="1.5" y="7" width="17" height="12" fill="#38bdf8" />
                            <line x1="2" y1="7" x2="18" y2="7" stroke="rgba(255,255,255,0.7)" stroke-width="1" />
                            <!-- الغطاء الأحمر للكيوفيت -->
                            <rect x="-1" y="-3" width="22" height="7" rx="1.8" fill="#dc2626" stroke="#991b1b" stroke-width="1" />
                            <rect x="1" y="-2" width="18" height="2" fill="#f87171" rx="0.5" />
                        </g>
                    </g>

                    <!-- غطاء الحجرة الأزرق (مغلق ومفتوح) -->
                    <!-- 1. الغطاء المغلق (أفقي مسطح يغطي الحجرة بالكامل) -->
                    <g id="spec_lid_closed" class="svg-clickable" onclick="window.photosynthesisLab.toggleSpecLid()" style="cursor: pointer;">
                        <rect x="0" y="-1" width="76" height="33" rx="2" fill="#0284c7" stroke="#0369a1" stroke-width="1.5" />
                        <path d="M 28 -1 Q 38 4 48 -1 Z" fill="#38bdf8" opacity="0.8" />
                        <text x="38" y="18" fill="#ffffff" font-size="8" font-family="'Cairo', sans-serif" font-weight="700" text-anchor="middle" pointer-events="none">انقر للفتح</text>
                    </g>

                    <!-- 2. الغطاء المفتوح (مرفوع للأعلى رأسياً كما بالصورتين 1 و 2) -->
                    <g id="spec_lid_open" class="svg-clickable" onclick="window.photosynthesisLab.toggleSpecLid()" style="display: none; cursor: pointer;">
                        <rect x="1" y="-56" width="74" height="62" rx="3" fill="#0284c7" stroke="#0369a1" stroke-width="1.5" />
                        <!-- تقوس المقبض العلوي الفاتح للغطاء كالصورة تماماً -->
                        <path d="M 24 -56 Q 38 -50 52 -56" fill="#38bdf8" stroke="#38bdf8" stroke-width="2" />
                        <!-- المفصلات الزرقاء المتصلة بالقاعدة -->
                        ${[4, 10, 16, 56, 62, 68].map(hx => `
                            <rect x="${hx}" y="4" width="4" height="4" fill="#38bdf8" />
                        `).join('')}
                    </g>
                </g>

                <!-- شاشة العرض الرقمية الخضراء LCD على اليسار (مغلقة ومطفأة في البداية) -->
                <g id="spec_screen_section" transform="translate(16, 32)">
                    <rect id="spec_screen_bg" x="0" y="0" width="95" height="42" rx="4" fill="#022c22" stroke="#064e3b" stroke-width="1.5" />
                    <text id="svg_spec_wl_display" x="47" y="12" fill="#047857" font-size="6.5" font-family="'Cairo', sans-serif" font-weight="700" text-anchor="middle">الجهاز مطفأ (OFF)</text>
                    <text id="spec_screen_digits" x="47" y="32" fill="#047857" font-size="14" font-family="'Courier New', monospace" font-weight="900" text-anchor="middle">OFF</text>
                </g>

                <!-- شريط الطيف اللوني وقوس الطول الموجي -->
                <g id="spec_spectrum_slider_group" class="svg-clickable" onclick="window.photosynthesisLab.openSpecSettingsModal()" transform="translate(16, 80)" style="cursor: pointer;">
                    <rect x="0" y="0" width="95" height="5" rx="2.5" fill="url(#spectrumBar)" />
                    <!-- مؤشر الانزلاق -->
                    <circle id="spec_slider_thumb" cx="62" cy="2.5" r="4.5" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" />
                </g>

                <!-- زرا التصفير (Zero) والطاقة (Power) -->
                <g id="spec_control_buttons" transform="translate(16, 92)">
                    <!-- زر التصفير الأزرق -->
                    <rect id="spec_btn_zero" class="svg-clickable" onclick="window.photosynthesisLab.zeroSpectrophotometer()" x="0" y="0" width="44" height="15" rx="3" fill="#0284c7" style="cursor: pointer;" />
                    <text x="22" y="11" fill="#ffffff" font-size="6.5" font-family="'Cairo', sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">Zero button</text>

                    <!-- زر الطاقة الأحمر -->
                    <rect id="spec_btn_power" class="svg-clickable" onclick="window.photosynthesisLab.toggleSpecPower()" x="50" y="0" width="44" height="15" rx="3" fill="#dc2626" style="cursor: pointer;" />
                    <text x="72" y="11" fill="#ffffff" font-size="6.5" font-family="'Cairo', sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">Power</text>
                </g>
            </g>

            <!-- 5. حامل الكيوفيتات (Cuvettes Rack) - يأتي تالياً ليكون فوق المطياف عند التحريك دائماً -->
            <g id="cuvettes_station_group" transform="translate(685, 380)">
                <!-- قاعدة الحامل البيضاء المدرجة -->
                <rect x="0" y="90" width="165" height="40" rx="3" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="url(#dropShadow)" />
                <rect x="0" y="90" width="165" height="4" fill="#94a3b8" />

                <!-- الكيوفيتات الخمس: الضابطة + 1، 2، 3، 4 (تبدأ 1-4 بدون أغطية لتغطيتها يدوياً) -->
                ${[
                    { id: 'Blank', name: 'الضابطة', col: 'rgba(255,255,255,0.1)', cap: true },
                    { id: '1', name: 'كيوفيت 1', col: 'none', cap: false },
                    { id: '2', name: 'كيوفيت 2', col: 'none', cap: false },
                    { id: '3', name: 'كيوفيت 3', col: 'none', cap: false },
                    { id: '4', name: 'كيوفيت 4', col: 'none', cap: false }
                ].map((c, idx) => `
                    <g id="cuvette_slot_${c.id}" class="cuvette-snap-station svg-clickable" data-cuvette-id="${c.id}" onclick="window.photosynthesisLab.onCuvetteClick('${c.id}')" transform="translate(${10 + idx * 31}, 0)" style="cursor: pointer;">
                        <!-- الكيوفيت البصرية الشفافة التفاعلية القابلة للسحب -->
                        <g id="cuvette_obj_${c.id}" class="svg-draggable" data-type="cuvette" data-id="${c.id}" style="cursor: grab;">
                            <!-- جسم الكيوفيت الزجاجي المستطيل -->
                            <rect x="0" y="10" width="22" height="90" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.7)" stroke-width="1.4" />
                            
                            <!-- السائل داخل الكيوفيت -->
                            <rect id="cuvette_fluid_${c.id}" x="2" y="30" width="18" height="68" fill="${c.id === 'Blank' ? 'rgba(56, 189, 248, 0.4)' : 'none'}" />
                            
                            <!-- الغطاء الأحمر للكيوفيت (قابل للفك بالنقر) -->
                            <g id="cuvette_cap_${c.id}" class="svg-clickable" onclick="window.photosynthesisLab.removeCuvetteCap('${c.id}')" style="${c.cap ? '' : 'display: none;'} cursor: pointer;" transform="translate(1, 2)">
                                <rect x="0" y="0" width="20" height="9" rx="2" fill="#dc2626" stroke="#991b1b" stroke-width="1" />
                            </g>
                        </g>

                        <!-- ملصق الكيوفيت العمودي الأنيق كما بالصورة -->
                        <g transform="translate(11, -5)">
                            <rect x="-7" y="-55" width="14" height="52" rx="3" fill="#0f3d54" />
                            <text x="0" y="-10" fill="#ffffff" font-size="7" font-family="'Cairo', sans-serif" font-weight="800" writing-mode="vertical-rl" text-anchor="middle">${c.name}</text>
                        </g>
                    </g>
                `).join('')}
            </g>
        `;

        this.svg.appendChild(lowerGroup);
    }

    // دوال تحديث الحالة البصرية للعناصر
    updateTubeFluid(tubeIndex, hexColor) {
        const fluid = document.getElementById(`tube_fluid_${tubeIndex}`);
        const meniscus = document.getElementById(`tube_meniscus_${tubeIndex}`);
        if (fluid) fluid.setAttribute("fill", hexColor);
        if (meniscus) meniscus.setAttribute("fill", hexColor);
    }

    setTubePlantVisible(tubeIndex, isVisible) {
        const plant = document.getElementById(`tube_plant_${tubeIndex}`);
        if (plant) plant.style.display = isVisible ? 'block' : 'none';
    }

    setTubeStopperVisible(tubeIndex, isVisible) {
        const stopper = document.getElementById(`tube_stopper_${tubeIndex}`);
        if (stopper) {
            stopper.style.display = isVisible ? 'block' : 'none';
            if (!isVisible) {
                stopper.setAttribute('transform', 'translate(14, -12)');
            }
        }
    }

    setShelfStopperVisible(index, isVisible) {
        const stopper = document.getElementById(`shelf_stopper_group_${index}`);
        if (stopper) stopper.style.display = isVisible ? 'block' : 'none';
    }

    setTubeBoxVisible(tubeIndex, isVisible) {
        const box = document.getElementById(`tube_box_${tubeIndex}`);
        if (box) {
            box.style.display = isVisible ? 'block' : 'none';
            if (!isVisible) {
                box.setAttribute('transform', 'translate(-11, -30)');
            }
        }
    }

    updateCuvetteFluid(cuvetteId, hexColor) {
        const fluid = document.getElementById(`cuvette_fluid_${cuvetteId}`);
        if (fluid) {
            fluid.setAttribute("fill", hexColor);
            fluid.style.display = 'block';
        }
    }

    setCuvetteCapVisible(cuvetteId, isVisible) {
        const cap = document.getElementById(`cuvette_cap_${cuvetteId}`);
        if (cap) cap.style.display = isVisible ? 'block' : 'none';
    }

    setShelfCapVisible(index, isVisible) {
        const cap = document.getElementById(`shelf_cuvette_cap_${index}`);
        if (cap) cap.style.display = isVisible ? 'block' : 'none';
    }

    updateSpecScreen(text) {
        const digits = document.getElementById("spec_screen_digits");
        const wl = document.getElementById("svg_spec_wl_display");
        const bg = document.getElementById("spec_screen_bg");
        if (digits) {
            digits.textContent = text;
            if (text === 'OFF') {
                digits.setAttribute('fill', '#047857');
                digits.setAttribute('font-size', '14');
                if (wl) {
                    wl.textContent = 'الجهاز مطفأ (OFF)';
                    wl.setAttribute('fill', '#047857');
                }
                if (bg) bg.setAttribute('fill', '#022c22');
            } else {
                digits.setAttribute('fill', '#34d399');
                digits.setAttribute('font-size', '16');
                if (wl) {
                    const currentWl = window.photosynthesisLab?.experimentEngine?.spectroEngine?.wavelength || 350;
                    wl.textContent = `الطول الموجي: ${currentWl} nm`;
                    wl.setAttribute('fill', '#10b981');
                }
                if (bg) bg.setAttribute('fill', '#064e3b');
            }
        }
    }

    setSpecLidState(isOpen) {
        const closedLid = document.getElementById("spec_lid_closed");
        const openLid = document.getElementById("spec_lid_open");
        const lidText = document.getElementById("spec_toolbar_lid_text");
        const insertedCuv = document.getElementById("spec_inserted_cuvette");

        if (closedLid) closedLid.style.display = isOpen ? 'none' : 'block';
        if (openLid) openLid.style.display = isOpen ? 'block' : 'none';
        if (lidText) lidText.textContent = isOpen ? 'إغلاق' : 'فتح';

        // إخفاء الكيوفيت وغطائها تماماً عند إغلاق الغطاء لمنع أي بروز لغطاء الكيوفيت فوق الغطاء المغلق
        if (insertedCuv) {
            insertedCuv.style.display = (isOpen && Boolean(this.isCuvetteInChamber)) ? 'block' : 'none';
        }

        // إخفاء زر إخراج الكيوفيت من شريط الأدوات عند إغلاق الغطاء (لا يمكن إخراج الكيوفيت والغطاء مغلق)
        const ejectBtn = document.getElementById("spec_toolbar_eject_btn");
        const toolbarBg = document.getElementById("spec_toolbar_bg");
        const showEject = Boolean(isOpen && this.isCuvetteInChamber);
        if (ejectBtn) ejectBtn.style.display = showEject ? 'block' : 'none';
        if (toolbarBg) toolbarBg.setAttribute("width", showEject ? "182" : "140");
    }

    setCuvetteInChamberVisible(isVisible, cuvId = null, hexColor = '#38bdf8') {
        this.isCuvetteInChamber = Boolean(isVisible);
        const insertedCuv = document.getElementById("spec_inserted_cuvette");
        const fluid = document.getElementById("spec_chamber_fluid");
        const ejectBtn = document.getElementById("spec_toolbar_eject_btn");
        const toolbarBg = document.getElementById("spec_toolbar_bg");
        const openLid = document.getElementById("spec_lid_open");
        const isLidOpen = openLid && openLid.style.display === 'block';

        if (insertedCuv) insertedCuv.style.display = (isVisible && isLidOpen) ? 'block' : 'none';
        if (fluid && hexColor) fluid.setAttribute("fill", hexColor);
        if (ejectBtn) ejectBtn.style.display = (isVisible && isLidOpen) ? 'block' : 'none';
        if (toolbarBg) toolbarBg.setAttribute("width", (isVisible && isLidOpen) ? "182" : "140");
    }

    setPipetteVolume(vol) {
        const badge = document.getElementById("pipette_badge_text");
        const badgeBg = document.getElementById("pipette_vol_badge_bg");
        const disp = document.getElementById("pipette_display_vol");
        if (badge) badge.textContent = `${vol} µl`;
        if (badgeBg) {
            if (vol >= 1000) {
                badgeBg.setAttribute("width", "75");
                badgeBg.setAttribute("x", "-12");
            } else {
                badgeBg.setAttribute("width", "70");
                badgeBg.setAttribute("x", "-10");
            }
        }
        if (disp) {
            const str = String(vol).padStart(4, '0');
            disp.textContent = str;
        }
    }

    toggleLamps(forcedState) {
        if (typeof forcedState === 'boolean') {
            this.lampsLit = forcedState;
        } else {
            this.lampsLit = !this.lampsLit;
        }
        const g1 = document.getElementById("lamp_glow_1");
        const g2 = document.getElementById("lamp_glow_2");
        const b1 = document.getElementById("lamp_bulb_1");
        const b2 = document.getElementById("lamp_bulb_2");
        const sw = document.getElementById("switch_toggle");
        const dimmer = document.getElementById("lab_ambient_dimmer");

        if (g1) g1.style.display = this.lampsLit ? 'block' : 'none';
        if (g2) g2.style.display = this.lampsLit ? 'block' : 'none';
        if (b1) b1.setAttribute("fill", this.lampsLit ? "#fef08a" : "#475569");
        if (b2) b2.setAttribute("fill", this.lampsLit ? "#fef08a" : "#475569");
        if (sw) {
            sw.setAttribute("cy", this.lampsLit ? "14" : "26");
            sw.setAttribute("fill", this.lampsLit ? "#22c55e" : "#ef4444");
        }
        if (dimmer) {
            // الإضاءة العامة للمعمل والألوان تظل واضحة وناصعة دون تعتيم باهت
            // والتغير ينحصر فقط في مخروط ظل/وهج المصباح ولمبته
            dimmer.setAttribute("opacity", "0");
        }

        if (window.photosynthesisLab && window.photosynthesisLab.audioManager) {
            window.photosynthesisLab.audioManager.playSwitch();
        }

        return this.lampsLit;
    }

    setTipsBoxLidOpen(isOpen) {
        const lid = document.getElementById("tips_box_lid");
        if (lid) {
            if (isOpen) {
                lid.setAttribute("transform", "rotate(-55, 3, 38)");
            } else {
                lid.setAttribute("transform", "rotate(0, 3, 38)");
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.SvgLabScene = SvgLabScene;
}
