/**
 * types.js - Blood Typing Data Definitions & Scientific Rules
 */

export const REAGENTS = {
    ANTI_A: { id: 'anti_a', name: 'Anti-A', color: '#2563eb', labelColor: '#1d4ed8', textColor: '#ffffff' },
    ANTI_B: { id: 'anti_b', name: 'Anti-B', color: '#eab308', labelColor: '#ca8a04', textColor: '#000000' },
    ANTI_D: { id: 'anti_d', name: 'Anti-D', color: '#f1f5f9', labelColor: '#94a3b8', textColor: '#1e293b' }
};

export const ALL_8_BLOOD_TYPES = [
    { bloodType: 'A', rhFactor: '+', reactions: { anti_a: true, anti_b: false, anti_d: true } },
    { bloodType: 'A', rhFactor: '-', reactions: { anti_a: true, anti_b: false, anti_d: false } },
    { bloodType: 'B', rhFactor: '+', reactions: { anti_a: false, anti_b: true, anti_d: true } },
    { bloodType: 'B', rhFactor: '-', reactions: { anti_a: false, anti_b: true, anti_d: false } },
    { bloodType: 'AB', rhFactor: '+', reactions: { anti_a: true, anti_b: true, anti_d: true } },
    { bloodType: 'AB', rhFactor: '-', reactions: { anti_a: true, anti_b: true, anti_d: false } },
    { bloodType: 'O', rhFactor: '+', reactions: { anti_a: false, anti_b: false, anti_d: true } },
    { bloodType: 'O', rhFactor: '-', reactions: { anti_a: false, anti_b: false, anti_d: false } }
];

export const PATIENTS_DATABASE = [
    { id: 1, name: 'العينة 1', bloodType: 'A', rhFactor: '+', reactions: { anti_a: true, anti_b: false, anti_d: true } },
    { id: 2, name: 'العينة 2', bloodType: 'B', rhFactor: '+', reactions: { anti_a: false, anti_b: true, anti_d: true } },
    { id: 3, name: 'العينة 3', bloodType: 'O', rhFactor: '+', reactions: { anti_a: false, anti_b: false, anti_d: true } },
    { id: 4, name: 'العينة 4', bloodType: 'AB', rhFactor: '+', reactions: { anti_a: true, anti_b: true, anti_d: true } },
    { id: 5, name: 'العينة 5', bloodType: 'A', rhFactor: '-', reactions: { anti_a: true, anti_b: false, anti_d: false } },
    { id: 6, name: 'العينة 6', bloodType: 'B', rhFactor: '-', reactions: { anti_a: false, anti_b: true, anti_d: false } },
    { id: 7, name: 'العينة 7', bloodType: 'AB', rhFactor: '-', reactions: { anti_a: true, anti_b: true, anti_d: false } },
    { id: 8, name: 'العينة 8', bloodType: 'O', rhFactor: '-', reactions: { anti_a: false, anti_b: false, anti_d: false } }
];

export const STEP_DEFINITIONS = [
    { step: 1, title: 'سحب عينة دم المريض', instruction: 'انقر على أنبوب عينة الدم المحدد في الحامل (أو اسحب الماصة فوقه) لملء الماصة بدم المريض تمهيداً للتحليل.' },
    { step: 2, title: 'إضافة قطرات الدم في الآبار', instruction: 'استخدم الماصة لإضافة قطرة دم من عينة المريض في كل بئر من الآبار الثلاثة (أ، ب، د).' },
    { step: 3, title: 'إضافة كواشف الأجسام المضادة', instruction: 'أضف قطرة من كاشف Anti-A الأزرق، و Anti-B الأصفر، و Anti-D الشفاف فوق قطرات الدم في آبارها المعنية على بطاقة التفاعل.' },
    { step: 4, title: 'تجهيز بطاقة التفاعل', instruction: 'تأكد من نزول قطرات الكواشف الثلاثة فوق قطرات الدم في الآبار وجاهزيتها لعملية المزج.' },
    { step: 5, title: 'المزج والخلط', instruction: 'استخدم عود المزج المعقم لتحريك ومزج كل بئر بلطف لإتاحة التفاعل.' },
    { step: 6, title: 'ملاحظة وتسجيل النتيجة', instruction: 'لاحظ حدوث التراص (التكتل) في الآبار وسجل نتائجك واستنتج الفصيلة في دفتر المختبر.' }
];
