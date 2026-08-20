# مشروع منصة التجارب العلمية التفاعلية (Virtual Science Labs)

## 📌 نبذة عامة
منصة ويب مبنية بلغة PHP وقاعدة بيانات MySQL تقدم تجارب علمية تفاعلية للطلاب والمعلمين (حالات المادة، الدوائر الكهربائية، المغناطيس الكهربائي، قوانين نيوتن، المنشور الزجاجي، فصل المخاليط).
تم تحديث المشروع ليرتبط بنظام مستخدمي المنصة الرئيسية (جدول `User`)، مع اعتماد كروت شحن الاشتراكات ذات المرة الواحدة (Redeemable One-Time Vouchers)، ونظام تراكم المدة، وتجميد الإجازات الدراسية، والعلامة المائية لحماية شاشة المعلم، وتفتيت لوحة الإدارة إلى موديولات صغار بنمط Clean Architecture.

---

## 📁 هيكل المشروع ودور كل ملف وفولدر

### 1. الملفات الإدارية والأساسية في الجذور (Root Files)
- **`config.php`** [config.php](file:///d:/downloads/%D8%A7%D8%B3%D8%AA%D8%A7%D8%B0%20%D8%B5%D8%A7%D8%A8%D8%B1/%D9%85%D9%88%D8%A7%D9%82%D8%B9/%D8%A7%D9%84%D9%85%D8%AE%D8%AA%D8%A8%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A7%D9%81%D8%AA%D8%B1%D8%A7%D8%B6%D9%8I/science_platform-main/config.php)
  - الاتصال بقاعدة البيانات MySQL مع إزالة استعلامات `SHOW COLUMNS` للسرعة وحماية الاستضافة.
  - إدارة الجلسات والمشتركين والرموز الأساسية.
- **`functions.php`** [functions.php](file:///d:/downloads/%D8%A7%D8%B3%D8%AA%D8%A7%D8%B0%20%D8%B5%D8%A7%D8%A8%D8%B1/%D9%85%D9%88%D8%A7%D9%82%D8%B9/%D8%A7%D9%84%D9%85%D8%AE%D8%AA%D8%A8%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A7%D9%81%D8%AA%D8%B1%D8%A7%D8%B6%D9%8I/science_platform-main/functions.php)
  - `redeemCode($code, $user_id)`: شحن كارت اشتراك واستبداله لمرة واحدة وتراكم المدة الزمنية لحساب المعلم.
  - `getUserSubscription($user_id)`: التحقق من مدة وتاريخ انتهاء اشتراك المعلم ومعالجة التجميد.
  - `isAuthenticated()`: حماية صفحات التجارب وتأكيد تسجيل دخول المعلم واشتراكه.
  - `generateBatchCodes(...)`: توليد كميات جماعية من الأكواد دفعة واحدة للأدمن.
  - `getSystemSetting()` / `setSystemSetting()`: إدارة إعدادات النظام وتجميد الإجازات.
- **`tracking.php`** [tracking.php](file:///d:/downloads/%D8%A7%D8%B3%D8%AA%D8%A7%D8%B0%20%D8%B5%D8%A7%D8%A8%D8%B1/%D9%85%D9%88%D8%A7%D9%82%D8%B9/%D8%A7%D9%84%D9%85%D8%AE%D8%AA%D8%A8%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A7%D9%81%D8%AA%D8%B1%D8%A7%D8%B6%D9%8I/science_platform-main/tracking.php)
  - تتبع الزوار الفريدين وتسجيل الـ Session والـ IP.
- **`index.php`** [index.php](file:///d:/downloads/%D8%A7%D8%B3%D8%AA%D8%A7%D8%B0%20%D8%B5%D8%A7%D8%A8%D8%B1/%D9%85%D9%88%D8%A7%D9%82%D8%B9/%D8%A7%D9%84%D9%85%D8%AE%D8%AA%D8%A8%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A7%D9%81%D8%AA%D8%B1%D8%A7%D8%B6%D9%8I/science_platform-main/index.php)
  - الواجهة الرئيسية للموقع وادخال كروت الشحن واختيار الباقات.
- **`my-experiments.php`** [my-experiments.php](file:///d:/downloads/%D8%A7%D8%B3%D8%AA%D8%A7%D8%B0%20%D8%B5%D8%A7%D8%A8%D8%B1/%D9%85%D9%88%D8%A7%D9%82%D8%B9/%D8%A7%D9%84%D9%85%D8%AE%D8%AA%D8%A8%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A7%D9%81%D8%AA%D8%B1%D8%A7%D8%B6%D9%8I/science_platform-main/my-experiments.php)
  - لوحة التجارب العلمية للمعلم لعرض حالة اشتراكه والعلامة المائية.
- **`.htaccess`** [.htaccess](file:///d:/downloads/%D8%A7%D8%B3%D8%AA%D8%A7%D8%B0%20%D8%B5%D8%A7%D8%A8%D8%B1/%D9%85%D9%88%D8%A7%D9%82%D8%B9/%D8%A7%D9%84%D9%85%D8%AE%D8%AA%D8%A8%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A7%D9%81%D8%AA%D8%B1%D8%A7%D8%B6%D9%8I/science_platform-main/.htaccess)
  - قواعد التخزين المؤقت (Static Caching) وضغط البيانات والحماية لرفع الموقع على Hostinger.

---

### 2. مجلد لوحة التحكم المقسّمة (`admin/`)
- **`admin/auth.php`**: التحقق وحماية لوحة الإدارة.
- **`admin/index.php`**: ملخص الإدارة والـ KPIs العامة.
- **`admin/create_codes.php`**: التوليد الجماعي كروت الشحن (Batch Generation).
- **`admin/manage_codes.php`**: البحث والتصدير لـ Excel/CSV ونسخ الأكواد للحافظة.
- **`admin/experiments.php`**: إدارة وتفعيل وتعديل صور التجارب.
- **`admin/packages.php`**: تعديل وإدارة مدة الباقات بالشهور.
- **`admin/system_freeze.php`**: إدارة تجميد الاشتراكات في الإجازات الدراسية.
- **`admin/statistics.php`**: تقارير تفاعل المعلمين الأكثر استخداماً والسجلات.

---

### 3. مجلد التجارب والحماية (`experiments/` & `js/`)
- **`js/watermark.js`**: سكربت العلامة المائية الشفافة المتحركة لمنع تسجيل الشاشة ومشاركة الحسابات.
- **`experiments/`**: صفحات التجارب التفاعلية (`circuits.php`, `matter.php`, `magnet.php`, `newton.php`, `prism.php`, `separation.php`).
- **`experiments/separation_v2.php`** [experiments/separation_v2.php](file:///d:/downloads/%D8%A7%D8%B3%D8%AA%D8%A7%D8%B0%20%D8%B5%D8%A7%D8%A8%D8%B1/%D9%85%D9%88%D8%A7%D9%82%D8%B9/%D8%A7%D9%84%D9%85%D8%AE%D8%AA%D8%A8%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A7%D9%81%D8%AA%D8%B1%D8%A7%D8%B6%D9%8I/science_platform-main/experiments/separation_v2.php) & **`experiments/separation_v2.html`**: بيئة التجربة الأيزومترية 3D الجديدة لفصل المخاليط بالثيم الفاتح الموحد للمنصة، الكاميرا الأيزومترية الثابتة، سحب وإفلات المواد 3D من الرف، والتكوين الحر للمخاليط.
- **`css/separation_v2.css`** [css/separation_v2.css](file:///d:/downloads/%D8%A7%D8%B3%D8%AA%D8%A7%D8%B0%20%D8%B5%D8%A7%D8%A8%D8%B1/%D9%85%D9%88%D8%A7%D9%82%D8%B9/%D8%A7%D9%84%D9%85%D8%AE%D8%AA%D8%A8%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A7%D9%81%D8%AA%D8%B1%D8%A7%D8%B6%D9%8I/science_platform-main/css/separation_v2.css): ملف التنسيق البصري الفاتح المعزز للبطاقات الزجاجية والهيدر الموحد.
- **`js/experiments/separation_v2/`**: الموديول البرمجي التفصيلي بنمط Clean Architecture:
  - `sceneManager.js`: إعداد مشهد Three.js، الإضاءة، والكاميرا الأيزومترية الثابتة.
  - `materialsShelf.js`: بناء وتوليد زجاجات المواد الـ 3D مع ملصقات المسميات.
  - `tools3D.js`: توليد أدوات الفصل الثلاثية الأبعاد (مغناطيس، قمع ترشيح مركب الحبيبات، موقد، قمع فصل ثنائي الصمام والقاع المخروطي، غربال).
  - `beaker3D.js`: كأس المختبر المدرّج محاكاة السوائل والترسيب والجسيمات الواقعية.
  - `pouringEngine.js`: أنيميشن سكب المواد زجاجياً وإمالتها.
  - `dragControls.js`: محرك السحب والإفلات الـ 3D عبر المستويات الفضائية والرف.
  - `separationEngine.js`: حساب وإجراء عمليات الفصل التفاعلية (انزلاق وتفريغ الزيت الذاتي بقمع الفصل، الجذب المغناطيسي من الكؤوس ومن فوق ورقة الترشيح، التنبيهات التفصيلية).
  - `uiOverlay.js`: واجهة الإرشادات والمخاليط المقترحة بالثيم الفاتح.
  - `app.js`: نقطة الانطلاق الرئيسية لتجميع المحاكاة.
