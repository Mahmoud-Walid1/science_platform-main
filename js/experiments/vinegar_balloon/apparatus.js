/**
 * apparatus.js
 * SVG and Visual Representation of Lab Equipment & Chemicals
 * Clean Architecture - Single Responsibility
 */

export const APPARATUS_SVGS = {
    // الزجاجة الشفافة الرئيسية
    bottle: (liquidLevel = 0, hasBubbles = false, isCentral = false) => `
        <svg class="apparatus-svg bottle-svg" viewBox="0 0 160 380" width="100%" height="100%">
            <defs>
                <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="rgba(255,255,255,0.4)" />
                    <stop offset="15%" stop-color="rgba(220,240,255,0.2)" />
                    <stop offset="85%" stop-color="rgba(180,210,240,0.15)" />
                    <stop offset="100%" stop-color="rgba(255,255,255,0.45)" />
                </linearGradient>
                <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="rgba(245, 230, 180, 0.9)" />
                    <stop offset="50%" stop-color="rgba(250, 240, 200, 0.8)" />
                    <stop offset="100%" stop-color="rgba(240, 220, 160, 0.95)" />
                </linearGradient>
                <filter id="glassShadow" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="12" stdDeviation="8" flood-color="rgba(0,0,0,0.3)" />
                </filter>
            </defs>
            <!-- Shadow on table -->
            <ellipse cx="80" cy="370" rx="60" ry="8" fill="rgba(0,0,0,0.25)" />
            <!-- Liquid inside bottle (height dynamically controlled 0 to 120px) -->
            <g ${isCentral ? 'id="centralLiquidGroup"' : 'id="bottleLiquidGroup"'} style="opacity: ${liquidLevel > 0 ? 1 : 0}; transition: opacity 0.2s;">
                <path d="M 32 360 L 32 ${360 - liquidLevel} Q 80 ${358 - liquidLevel} 128 ${360 - liquidLevel} L 128 360 Q 80 365 32 360 Z" 
                      fill="url(#liquidGrad)" ${isCentral ? 'id="centralLiquidSurface"' : 'id="liquidSurface"'} />
                <!-- Liquid surface ellipse -->
                <ellipse cx="80" cy="${360 - liquidLevel}" rx="48" ry="4" fill="rgba(255,250,230,0.85)" stroke="rgba(240,220,160,0.9)" stroke-width="1" ${isCentral ? 'id="centralLiquidEllipse"' : 'id="liquidSurfaceEllipse"'} />
            </g>
            <!-- Bottle Outer Glass Body -->
            <path d="M 66 40 
                     L 94 40 
                     L 94 65 
                     Q 98 75 106 88 
                     L 126 125 
                     Q 130 135 130 150 
                     L 130 350 
                     Q 130 365 110 365 
                     L 50 365 
                     Q 30 365 30 350 
                     L 30 150 
                     Q 30 135 34 125 
                     L 54 88 
                     Q 62 75 66 65 Z" 
                  fill="url(#glassGrad)" stroke="rgba(255,255,255,0.6)" stroke-width="2" filter="url(#glassShadow)" />
            <!-- Plastic horizontal grip ridges/grooves -->
            <path d="M 30 180 Q 80 188 130 180" stroke="rgba(255,255,255,0.35)" stroke-width="2" fill="none" />
            <path d="M 30 220 Q 80 228 130 220" stroke="rgba(255,255,255,0.35)" stroke-width="2" fill="none" />
            <path d="M 30 260 Q 80 268 130 260" stroke="rgba(255,255,255,0.35)" stroke-width="2" fill="none" />
            <path d="M 30 300 Q 80 308 130 300" stroke="rgba(255,255,255,0.35)" stroke-width="2" fill="none" />
            <!-- Bottle Neck Rim -->
            <rect x="63" y="32" width="34" height="8" rx="2" fill="rgba(240,248,255,0.7)" stroke="#fff" stroke-width="1" />
            <!-- Glass reflection vertical streak -->
            <path d="M 40 140 L 40 340" stroke="rgba(255,255,255,0.5)" stroke-width="4" stroke-linecap="round" />
            <path d="M 48 150 L 48 330" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-linecap="round" />
        </svg>
    `,

    // القمع المخبري الزجاجي / البلاستيكي
    funnel: () => `
        <svg class="apparatus-svg funnel-svg" viewBox="0 0 120 160" width="100%" height="100%">
            <defs>
                <linearGradient id="funnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="rgba(230,245,255,0.85)" />
                    <stop offset="30%" stop-color="rgba(190,225,245,0.5)" />
                    <stop offset="70%" stop-color="rgba(220,240,255,0.6)" />
                    <stop offset="100%" stop-color="rgba(255,255,255,0.9)" />
                </linearGradient>
            </defs>
            <!-- Funnel rim -->
            <ellipse cx="60" cy="18" rx="55" ry="12" fill="url(#funnelGrad)" stroke="rgba(255,255,255,0.8)" stroke-width="2" />
            <!-- Funnel cone body -->
            <path d="M 5 18 L 54 85 L 54 150 L 66 150 L 66 85 L 115 18 Z" 
                  fill="url(#funnelGrad)" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />
            <!-- Rim highlight -->
            <path d="M 15 18 Q 60 26 105 18" stroke="rgba(255,255,255,0.6)" stroke-width="2" fill="none" />
            <path d="M 56 90 L 56 145" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round" />
        </svg>
    `,

    // البالون الأزرق المطاطي التفاعلي (3 وضعيات: مفرغ منبسط على الطاولة، متدلي جانباً على الزجاجة، منتفخ تدريجياً بالغاز)
    balloon: (state = 'deflated', scale = 1.0, hasSoda = false) => {
        if (state === 'deflated') {
            return `
            <svg class="apparatus-svg balloon-deflated-svg" viewBox="0 0 140 180" width="100%" height="100%">
                <defs>
                    <radialGradient id="balloonDeflatedGloss" cx="35%" cy="30%" r="65%">
                        <stop offset="0%" stop-color="#93c5fd" />
                        <stop offset="25%" stop-color="#38bdf8" />
                        <stop offset="60%" stop-color="#0284c7" />
                        <stop offset="90%" stop-color="#0369a1" />
                        <stop offset="100%" stop-color="#075985" />
                    </radialGradient>
                    <filter id="balloonDeflatedShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="rgba(2,132,199,0.35)" />
                    </filter>
                </defs>
                <!-- فوهة وعنق البالون لأعلى: حلقة مطاطية ملفوفة لاستقبال القمع -->
                <ellipse cx="70" cy="20" rx="13" ry="4.5" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5" />
                <ellipse cx="70" cy="20" rx="8" ry="2.5" fill="#0369a1" />
                <!-- كيس البالون المطاطي المفرغ تماماً وغير المنفوخ (نحيف ومسترخٍ) -->
                <path d="M 59 20 L 59 55 C 59 75, 47 98, 47 128 C 47 158, 56 168, 70 168 C 84 168, 93 158, 93 128 C 93 98, 81 75, 81 55 L 81 20 Z" 
                      fill="url(#balloonDeflatedGloss)" stroke="#0284c7" stroke-width="1.5" filter="url(#balloonDeflatedShadow)" />
                <!-- ثنايا وتجاعيد المطاط المفرغ الواقعية غير المنفوخ -->
                <path d="M 68 55 C 67 90, 68 125, 70 155" stroke="rgba(3,105,161,0.5)" stroke-width="2" stroke-linecap="round" fill="none" />
                <path d="M 54 85 C 50 110, 52 135, 58 145" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round" fill="none" />
                <!-- مسحوق البيكربونات الأبيض مستقر داخل قاع البالون المفرغ -->
                <g class="balloon-powder-fill" id="balloonPowderFill" style="display: ${hasSoda ? 'block' : 'none'};">
                    <path d="M 50 138 C 50 158, 58 166, 70 166 C 82 166, 90 158, 90 138 Q 70 144 50 138 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
                </g>
            </svg>`;
        }

        if (state === 'hanging') {
            return `
            <svg class="apparatus-svg balloon-hanging-svg" viewBox="0 0 240 330" width="100%" height="100%">
                <defs>
                    <radialGradient id="balloonHangingGloss" cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stop-color="#93c5fd" />
                        <stop offset="30%" stop-color="#38bdf8" />
                        <stop offset="70%" stop-color="#0284c7" />
                        <stop offset="100%" stop-color="#0369a1" />
                    </radialGradient>
                    <filter id="hangingShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="8" stdDeviation="6" flood-color="rgba(0,0,0,0.3)" />
                    </filter>
                </defs>
                <!-- ياقة عنق البالون مثبتة بإحكام على فوهة الزجاجة -->
                <path d="M 108 260 L 132 260 L 128 274 L 112 274 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="2" />
                <!-- كيس البالون المطاطي المفرغ متدلي تماماً لليمين قبل التفاعل -->
                <path d="M 112 260 
                         C 112 245, 120 236, 130 232 
                         C 145 226, 168 228, 185 240 
                         C 202 254, 206 276, 192 292 
                         C 176 305, 150 298, 138 280 
                         C 128 268, 128 262, 128 260 Z" 
                      fill="url(#balloonHangingGloss)" stroke="#0369a1" stroke-width="2" filter="url(#hangingShadow)" />
                <!-- ثنايا وتجاعيد المطاط المتدلي -->
                <path d="M 125 245 C 140 242, 160 248, 175 258" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" fill="none" />
                <!-- مسحوق البيكربونات مستقر داخل تجويف قاع البالون المتدلي غير المنفوخ -->
                <path d="M 160 270 Q 178 262 194 270 Q 192 288 178 296 Q 164 288 160 270 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.2" />
                <ellipse cx="177" cy="272" rx="14" ry="4" fill="#f8fafc" />
                <circle cx="173" cy="275" r="1.2" fill="#cbd5e1" />
                <circle cx="181" cy="277" r="1.2" fill="#cbd5e1" />
                <circle cx="176" cy="283" r="1" fill="#e2e8f0" />
            </svg>`;
        }

        if (scale <= 0.06) {
            return `
            <svg class="apparatus-svg balloon-svg balloon-upright-empty" viewBox="0 0 240 330" width="100%" height="100%">
                <defs>
                    <radialGradient id="balloonLimpGrad" cx="35%" cy="30%" r="65%">
                        <stop offset="0%" stop-color="#93c5fd" />
                        <stop offset="30%" stop-color="#38bdf8" />
                        <stop offset="70%" stop-color="#0284c7" />
                        <stop offset="100%" stop-color="#0369a1" />
                    </radialGradient>
                    <filter id="balloonLimpShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="rgba(3,105,161,0.3)" />
                    </filter>
                </defs>
                <!-- ياقة عنق البالون على فوهة الزجاجة -->
                <path d="M 108 260 L 132 260 L 128 274 L 112 274 Z" fill="#0284c7" stroke="#075985" stroke-width="2" />
                <!-- كيس البالون المطاطي المفرغ رأسياً قبل وصول الغاز -->
                <path d="M 112 260 C 112 240, 110 205, 114 175 C 116 160, 124 160, 126 175 C 130 205, 128 240, 128 260 Z" 
                      fill="url(#balloonLimpGrad)" stroke="#0369a1" stroke-width="1.8" filter="url(#balloonLimpShadow)" />
                <!-- ثنيات مطاطية مفرغة -->
                <path d="M 118 180 C 117 210, 121 235, 120 255" stroke="rgba(255,255,255,0.45)" stroke-width="1.5" stroke-linecap="round" fill="none" />
            </svg>`;
        }

        const normScale = Math.max(0, scale);
        const rx = 10 + 50 * normScale;
        const ry = 16 + 55 * normScale;
        const neckW = Math.max(8, rx * 0.38);
        const bulbCenterY = 245 - ry;

        return `
        <svg class="apparatus-svg balloon-svg" viewBox="0 0 240 330" width="100%" height="100%">
            <defs>
                <radialGradient id="blueBalloonGrad" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stop-color="#bae6fd" />
                    <stop offset="20%" stop-color="#38bdf8" />
                    <stop offset="60%" stop-color="#0284c7" />
                    <stop offset="90%" stop-color="#0369a1" />
                    <stop offset="100%" stop-color="#075985" />
                </radialGradient>
                <filter id="balloonShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="rgba(3,105,161,0.45)" />
                </filter>
            </defs>
            <!-- ياقة عنق البالون على فوهة الزجاجة -->
            <path d="M 108 260 L 132 260 L 128 274 L 112 274 Z" fill="#0284c7" stroke="#075985" stroke-width="2" />
            <path d="M 112 260 L 128 260 L ${120 + neckW} ${bulbCenterY + ry * 0.55} L ${120 - neckW} ${bulbCenterY + ry * 0.55} Z" fill="#0284c7" />
            <!-- جسم البالون المنتفخ تدريجياً لأعلى -->
            <ellipse class="balloon-bulb-ellipse" cx="120" cy="${bulbCenterY}" rx="${rx}" ry="${ry}" 
                     fill="url(#blueBalloonGrad)" stroke="rgba(255,255,255,0.5)" stroke-width="2" filter="url(#balloonShadow)" />
            <ellipse class="balloon-bulb-shine" cx="${120 - rx * 0.35}" cy="${bulbCenterY - ry * 0.35}" rx="${Math.max(2, rx * 0.28)}" ry="${Math.max(3, ry * 0.2)}" 
                     fill="rgba(255,255,255,0.65)" transform="rotate(-25, ${120 - rx * 0.35}, ${bulbCenterY - ry * 0.35})" />
        </svg>`;
    },

    // ملعقة مخبرية ستانلس ستيل مع أو بدون مسحوق
    spoon: (hasPowder = false) => `
        <svg class="apparatus-svg spoon-svg" viewBox="0 0 160 80" width="100%" height="100%">
            <defs>
                <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#e2e8f0" />
                    <stop offset="50%" stop-color="#94a3b8" />
                    <stop offset="80%" stop-color="#cbd5e1" />
                    <stop offset="100%" stop-color="#64748b" />
                </linearGradient>
                <linearGradient id="spoonPowderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="50%" stop-color="#f8fafc" />
                    <stop offset="85%" stop-color="#f1f5f9" />
                    <stop offset="100%" stop-color="#cbd5e1" />
                </linearGradient>
                <filter id="powderHeapShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(15,23,42,0.3)" />
                </filter>
            </defs>
            <!-- Spoon handle -->
            <path d="M 45 40 Q 110 32 155 35 Q 158 45 155 48 Q 110 42 45 44 Z" 
                  fill="url(#metalGrad)" stroke="#475569" stroke-width="1" />
            <!-- Spoon bowl -->
            <ellipse cx="32" cy="42" rx="28" ry="18" fill="url(#metalGrad)" stroke="#475569" stroke-width="1.5" />
            <!-- Inner scoop highlight -->
            <ellipse cx="32" cy="42" rx="24" ry="14" fill="#f8fafc" opacity="0.35" />
            ${hasPowder ? `
            <!-- كومة مسحوق بيكربونات الصوديوم البيضاء الواضحة والمرتفعة جداً داخل الملعقة -->
            <g class="spoon-powder-heap" filter="url(#powderHeapShadow)">
                <!-- التل الهرمي لمسحوق البيكربونات -->
                <path d="M 8 42 C 8 22, 18 10, 32 10 C 46 10, 56 22, 56 42 C 56 53, 44 57, 32 57 C 20 57, 8 53, 8 42 Z" 
                      fill="url(#spoonPowderGrad)" stroke="#94a3b8" stroke-width="1.3" />
                <!-- لمعان قمة المسحوق الأبيض الناصع -->
                <ellipse cx="32" cy="22" rx="16" ry="8" fill="#ffffff" />
                <path d="M 20 22 Q 32 13 44 22" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none" />
                <!-- حبيبات وتدرجات المسحوق المخبري البودري -->
                <circle cx="23" cy="30" r="1.5" fill="#cbd5e1" />
                <circle cx="37" cy="27" r="1.8" fill="#cbd5e1" />
                <circle cx="31" cy="38" r="1.6" fill="#94a3b8" opacity="0.7" />
                <circle cx="43" cy="36" r="1.5" fill="#cbd5e1" />
                <circle cx="19" cy="38" r="1.5" fill="#cbd5e1" />
            </g>
            ` : ''}
        </svg>
    `,

    // زجاجة الخل الكيميائية (Reagent Flask)
    vinegarBottle: (fillRatio = 1.0) => {
        const topY = 200 - Math.max(12, 75 * Math.max(0, Math.min(1, fillRatio)));
        return `
        <svg class="apparatus-svg reagent-svg" viewBox="0 0 120 220" width="100%" height="100%">
            <defs>
                <linearGradient id="amberLiquid" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="rgba(245, 230, 180, 0.85)" />
                    <stop offset="60%" stop-color="rgba(250, 240, 200, 0.7)" />
                    <stop offset="100%" stop-color="rgba(240, 220, 160, 0.9)" />
                </linearGradient>
            </defs>
            <!-- Glass stopper cap -->
            <ellipse cx="60" cy="18" rx="14" ry="7" fill="rgba(220,240,250,0.8)" stroke="#fff" stroke-width="1" />
            <rect x="52" y="18" width="16" height="14" rx="2" fill="rgba(200,230,245,0.8)" />
            <!-- Bottle neck -->
            <rect x="48" y="32" width="24" height="28" fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.7)" />
            <!-- Body -->
            <path d="M 48 60 Q 20 85 20 120 L 20 200 Q 20 215 60 215 Q 100 215 100 200 L 100 120 Q 100 85 72 60 Z" 
                  fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.6)" stroke-width="2" />
            <!-- Liquid inside -->
            <path id="vinegarBottleLiquidPath" d="M 23 ${topY} Q 60 ${topY + 5} 97 ${topY} L 97 200 Q 60 212 23 200 Z" fill="url(#amberLiquid)" style="opacity: ${fillRatio > 0.05 ? 1 : 0}; transition: opacity 0.2s;" />
            <!-- Label -->
            <rect x="35" y="140" width="50" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
            <text x="60" y="156" font-size="10" font-family="Cairo, sans-serif" font-weight="bold" fill="#0f172a" text-anchor="middle">خل</text>
            <text x="60" y="172" font-size="8" font-family="Arial, sans-serif" fill="#64748b" text-anchor="middle">CH₃COOH</text>
        </svg>
    `;
    },

    // صحن بيكربونات الصوديوم
    bakingSodaBowl: () => `
        <svg class="apparatus-svg bowl-svg" viewBox="0 0 160 110" width="100%" height="100%">
            <defs>
                <linearGradient id="bowlGlass" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="rgba(255,255,255,0.6)" />
                    <stop offset="50%" stop-color="rgba(220,240,255,0.3)" />
                    <stop offset="100%" stop-color="rgba(255,255,255,0.7)" />
                </linearGradient>
            </defs>
            <!-- Shadow -->
            <ellipse cx="80" cy="98" rx="60" ry="10" fill="rgba(0,0,0,0.2)" />
            <!-- Bowl body -->
            <path d="M 15 45 Q 25 100 80 100 Q 135 100 145 45 Z" 
                  fill="url(#bowlGlass)" stroke="rgba(255,255,255,0.7)" stroke-width="2" />
            <!-- Baking soda powder mound -->
            <path d="M 22 46 Q 80 15 138 46 Q 80 58 22 46 Z" fill="#ffffff" stroke="#f1f5f9" stroke-width="1" />
            <!-- Grain highlights -->
            <ellipse cx="80" cy="40" rx="35" ry="10" fill="#f8fafc" />
            <!-- Rim -->
            <ellipse cx="80" cy="45" rx="65" ry="12" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" />
            <!-- Label -->
            <rect x="42" y="60" width="76" height="28" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
            <text x="80" y="73" font-size="8.5" font-family="Cairo, sans-serif" font-weight="bold" fill="#0f172a" text-anchor="middle">بيكربونات الصوديوم</text>
            <text x="80" y="83" font-size="7.5" font-family="Arial, sans-serif" fill="#64748b" text-anchor="middle">NaHCO₃</text>
        </svg>
    `
};
