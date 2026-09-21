# تقرير تنفيذ المرحلة الثالثة — بناء سجل المخاطر التشغيلية الميدانية
## مركز عدن الدولي للسلامة والدراسات الميدانية (AICSFA)
**Aden International Center for Safety and Field Assessments**

---

- **تاريخ الإنجاز:** 21 سبتمبر 2026
- **النطاق المنفذ:** المرحلة الثالثة فقط (بناء سجل المخاطر التشغيلية الميدانية — Operational Risk Register)
- **الحالة الفنية:** مكتمل بنسبة 100% — اجتياز كافة الاختبارات الآلية والتشغيلية المباشرة (16/16) واختبارات عدم التراجع (13/13) وفحص TypeScript (0 أخطاء)
- **المرجع التنفيذي:** أمر صاحب المشروع للبدء بالمرحلة الثالثة فقط وبناء وحدة سجل المخاطر التشغيلية

---

## 1. ملخص تنفيذي

تم بحمد الله بناء وتدشين **وحدة سجل المخاطر التشغيلية الميدانية (Operational Risk Register)** بوصفها منظومة تشغيلية وإدارية مستقلة ومترابطة مع منظومة البلاغات الميدانية الحالية في منصة مركز عدن الدولي للسلامة والدراسات الميدانية. 

تتيح الوحدة لإدارة المركز ومسؤولي السلامة الميدانية:
1. **تسجيل المخاطر ورصدها:** سواء كخطر ميداني مستقل، أو مشتق بأمان من بلاغ ميداني جرى التحقق منه واعتماده.
2. **التقييم الكمي والنوعي القياسي:** مصفوفة 5×5 معتمدة (الاحتمالية 1-5 × شدة الأثر 1-5) لحساب درجة الخطر (1-25) ومستواه (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
3. **إدارة إجراءات التخفيف والمعالجة (Treatment Actions):** تخطيط وتعيين ومتابعة تنفيذ الإجراءات الوقائية، والطارئة، والتصحيحية مع مواعيد الإنجاز والمسؤولين.
4. **إعادة التقييم وسجل التدقيق التراكمي:** توثيق كل إعادة تقييم في جدول تاريخي دائم (`RiskAssessmentHistory`) يوضح التغيرات والمبررات واسم المقيم وتاريخه دون مسح السجل السابق.
5. **إدارة دورة حياة الخطر (Operational Lifecycle):** تتبع الحالات التشغيلية، الإغلاق مع إلزامية توثيق المبررات، وإعادة الفتح عند تجدد التهديد.
6. **مصفوفة بصرية تفاعلية 5×5 ومؤشرات مجمعة:** مصفوفة تفاعلية تمكن المسؤول من تصفية المخاطر بالضغط المباشر على خلايا الاحتمالية والأثر، مع بطاقات إحصائية للمخاطر النشطة والحرجة وقيد المعالجة.

---

## 2. التصميم المعماري ونماذج قاعدة البيانات

تم تحديث ملف [`prisma/schema.prisma`](file:///d:/FACSSS/prisma/schema.prisma) وترحيل قاعدة البيانات PostgreSQL بأمان باستخدام `npx prisma db push` دون فقدان أي بيانات:

### 2.1. التعدادات المعتمدة (Enums)
- **مستوى الخطر (`RiskLevel`):**
  - `LOW`: درجة الخطر من 1 إلى 4 (أخضر).
  - `MEDIUM`: درجة الخطر من 5 إلى 9 (أصفر/عنبري).
  - `HIGH`: درجة الخطر من 10 إلى 16 (برتقالي).
  - `CRITICAL`: درجة الخطر من 17 إلى 25 (أحمر).
- **الحالة التشغيلية (`RiskStatus`):**
  - `IDENTIFIED` (تم الرصد - جديد)
  - `ASSESSED` (تم التقييم)
  - `TREATMENT_IN_PROGRESS` (قيد المعالجة والتخفيف)
  - `MONITORED` (تحت المراقبة النشطة)
  - `RESOLVED` (تمت المعالجة)
  - `CLOSED` (مغلق)
- **تصنيفات المخاطر الميدانية (`RiskCategory`):**
  - `ARMED_CONFLICT_SECURITY`: نزاع مسلح وتهديدات أمنية.
  - `ACCESS_ROADBLOCK_DENIAL`: إعاقة وصول ونقاط تفتيش وقطع طرق.
  - `EXPLOSIVE_HAZARD_UXO`: ألغام ومخلفات حرب ومقذوفات.
  - `CRIMINALITY_THEFT`: سطو مسلح وجريمة وسرقة قوافل.
  - `STAFF_DETENTION_THREAT`: احتجاز واعتداء على الطواقم الإنسانية.
  - `FACILITY_DAMAGE`: أضرار المقرات والمرافق والمخازن.
  - `ENVIRONMENTAL_NATURAL`: كوارث طبيعية وسيول وانهيارات.
  - `HEALTH_SAFETY`: صحة وسلامة مهنية وحوادث سير.
- **حالات ونوع إجراء التخفيف (`MitigationStatus` & `MitigationType`):**
  - الحالات: `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `DELAYED`, `CANCELLED`.
  - الأنواع: `PREVENTIVE` (وقائي), `CONTINGENCY` (طوارئ واستجابة), `CORRECTIVE` (تصحيحي).

### 2.2. الجداول المنشأة (Models)
1. **`OperationalRisk`:**
   - المعرف الرسمي: `riskNumber` بنمط تسلسلي آلي `AICSFA-RSK-YYYY-XXXXXX`.
   - البيانات التشغيلية: `title`, `description` (منقح تشغيلياً), `category`, `status`.
   - الموقع العام غير الحساس: `governorate`, `district`, `generalLocation`.
   - الارتباط الاختياري: `incidentId` (مرتبط بـ `Incident` مع `onDelete: SetNull`).
   - التقييم الحالي: `likelihood` (1-5), `impact` (1-5), `riskScore` (1-25), `riskLevel`.
   - التواريخ والمسؤوليات: `createdById`, `lastAssessedById`, `lastAssessedAt`, `targetResolutionDate`, `closedAt`, `closeReason`, `reopenedAt`, `reopenReason`.
2. **`RiskMitigationAction`:**
   - جدول فرعي مرتبط بالخطر (`onDelete: Cascade`) لإدارة حزم المعالجة.
   - يتضمن: `actionTitle`, `actionType`, `description`, `assignedTo`, `dueDate`, `status`, `progressNotes`, `completedAt`.
3. **`RiskAssessmentHistory`:**
   - جدول التدقيق التراكمي للتقييمات وإعادة التقييم (`onDelete: Cascade`).
   - يسجل: `likelihood`, `impact`, `riskScore`, `riskLevel`, `rationale` (مبررات التعديل الميداني الإلزامية), `assessedById`, `assessedByName`, `assessedAt`.

---

## 3. الربط الآمن بمنظومة البلاغات وحماية الخصوصية (Strict Isolation)

تطبيقاً للضوابط غير القابلة للتجاوز المحددة في الأمر التنفيذي:

1. **حظر الوصول إلى أصول البلاغات المشفرة:**
   - لا يتم نسخ أو قراءة أي حقل من جدول `IncidentOriginal` (هوية المصدر المشفرة، الهاتف، الموقع الإحداثي الدقيق GPS، أو الملاحظات الحساسة).
   - لا تملك واجهات سجل المخاطر أي مفاتيح فك تشفير، ولا يُمنح من يملك صلاحية `manage_risk_register` أي حق للاطلاع على أصول البلاغات.
   - تم التحقق من هذا الضابط باختبار أمني عملي مباشر: حاول حساب يحمل صلاحية `manage_risk_register` استدعاء واجهة `/api/admin/incidents/[id]/original` فتم رفضه قطعيّاً برمز `403 Forbidden`.
2. **الاعتماد الحصري على النسخة المنقحة والمحققة:**
   - لا يمكن اشتقاق خطر إلا من بلاغ يحمل حالة `VERIFIED` أو صدرت بشأنه مذكرات تحقق (`verifications`).
   - يتم استيراد البيانات من النسخة المنقحة المصرح بها (`IncidentRedacted`) والموقع الجغرافي العام (المحافظة والمديرية) فقط.
   - تُعرض البيانات المنقحة للمسؤول في نافذة معاينة (`Risk Preview Modal`) للمراجعة والتعديل قبل حفظ القيد في سجل المخاطر.
3. **منع النشر والاشتقاق التلقائي:**
   - لا يُنشأ أي قيد خطر آلياً بمجرد وصول بلاغ ميداني جديد؛ التدفق يستلزم التحقق، المراجعة، وموافقة المسؤول المخول.

---

## 4. الصلاحيات وواجهات البرمجة الخلفية المحمية (RBAC & APIs)

### 4.1. الصلاحيات الدقيقة في [`lib/rbac.ts`](file:///d:/FACSSS/lib/rbac.ts)
تمت إضافة الصلاحيات التالية:
- `CAPABILITIES.VIEW_RISK_REGISTER`: صلاحية الاطلاع على سجل المخاطر والمصفوفة والتفاصيل.
- `CAPABILITIES.MANAGE_RISK_REGISTER`: صلاحية إنشاء المخاطر، إدارة إجراءات التخفيف، وتغيير الحالات (إغلاق/إعادة فتح).
- `CAPABILITIES.ASSESS_RISK`: صلاحية تقييم وإعادة تقييم درجات المخاطر.

**قواعد منح الصلاحيات:**
- `SUPER_ADMIN`: يمتلك كافة الصلاحيات حكماً.
- `ADMIN` وكوادر الموظفين (`STAFF`): لا يُمنحون صلاحيات سجل المخاطر تلقائياً؛ بل يجب منحها صراحة عبر جدول `UserCapability` من الإدارة العليا.
- `FIELD_FOCAL_POINT`, `CLIENT`, `TRAINEE`: حجب قطعي وتام (Hard Deny) من كافة واجهات وسجلات المخاطر.

### 4.2. واجهات البرمجة الخلفية المنشأة
1. **`GET /api/admin/risks`**: استرجاع المخاطر مع البحث، التصفية المتعددة، وإحصائيات المصفوفة 5×5 والمؤشرات المجمعة.
2. **`POST /api/admin/risks`**: إنشاء خطر مستقل أو مشتق من بلاغ محقق.
3. **`GET /api/admin/risks/[id]`**: جلب تفاصيل الخطر ومصفوفة التخفيف وسجل التقييمات التاريخية.
4. **`PATCH /api/admin/risks/[id]`**: تعديل المعطيات التشغيلية للخطر مع تسجيل التدقيق.
5. **`DELETE /api/admin/risks/[id]`**: حذف الخطر (محصور بـ `SUPER_ADMIN`).
6. **`POST /api/admin/risks/[id]/assess`**: إعادة تقييم الخطر وحساب الدرجة وتسجيل القيد في السجل التاريخي.
7. **`POST /api/admin/risks/[id]/mitigations`**: إضافة إجراء تخفيف جديد (ينقل حالة الخطر تلقائياً إلى `TREATMENT_IN_PROGRESS`).
8. **`PATCH & DELETE /api/admin/risks/[id]/mitigations/[actionId]`**: تحديث حالة الإجراء وتدوين التقدم وحذف الإجراء.
9. **`POST /api/admin/risks/[id]/status`**: إغلاق الخطر أو إعادة فتحه مع إلزامية توثيق المبرر.
10. **`GET /api/admin/incidents/[id]/risk-preview`**: استخراج البيانات المنقحة لبلاغ محقق حصراً لملء نموذج الاشتقاق.
11. **`GET /api/admin/risks/verified-incidents`**: قائمة آمنة بالبلاغات المحققة المؤهلة للاشتقاق.

---

## 5. واجهات لوحة الإدارة والمصفوفة 5×5 (Admin UI)

تم بناء الواجهات وفق نظام التصميم المؤسسي المعتمد والهوية البصرية للمركز:

1. **شريط التنقل الموحد ([`app/admin/AdminClientBar.tsx`](file:///d:/FACSSS/app/admin/AdminClientBar.tsx)):**
   - إضافة رابط «سجل المخاطر» مع أيقونة `AlertTriangle` في القائمة الرئيسية للمسؤولين المصرح لهم.
2. **لوحة إدارة سجل المخاطر ([`app/admin/risks/page.tsx`](file:///d:/FACSSS/app/admin/risks/page.tsx) & [`components/admin/RiskRegisterManager.tsx`](file:///d:/FACSSS/components/admin/RiskRegisterManager.tsx)):**
   - **بطاقات المؤشرات المجمعة:** إجمالي المخاطر، المخاطر الحرجة والمرتفعة، قيد المعالجة، والمعالجة/المغلقة.
   - **المصفوفة البصرية التفاعلية 5×5:** شبكة 5 صفوف (الاحتمالية 1-5) × 5 أعمدة (الأثر 1-5) ملونة وفق المعايير القياسية (أخضر، أصفر، برتقالي، أحمر)، تعرض توزيع المخاطر مع إمكانية النقر على أي خلية لتصفية الجدول المباشر تلقائياً.
   - **أدوات البحث والتصفية المتقدمة:** بحث فوري بالرمز، العنوان، الموقع، وفلاتر منسدلة للتصنيفات، المستويات، والحالات والمحافظات.
   - **نافذة تسجيل خطر مستقل:** نموذج منظم مع منزلقات لاحتساب الدرجة والمستوى بصورة فورية وتفاعلية.
   - **نافذة الاشتقاق من بلاغ محقق:** قائمة بالبلاغات المحققة واستيراد البيانات المنقحة مع تمكين المستخدم من مراجعتها وتعديلها.
3. **صفحة تفاصيل الخطر وإدارته ([`app/admin/risks/[id]/page.tsx`](file:///d:/FACSSS/app/admin/risks/[id]/page.tsx) & [`components/admin/RiskDetailManager.tsx`](file:///d:/FACSSS/components/admin/RiskDetailManager.tsx)):**
   - عرض المعطيات التشغيلية، بطاقة البلاغ المرتبط (الرابط مفعل فقط لمن يملك صلاحية البلاغات)، وشارة مستوى الخطر.
   - تبويب إجراءات التخفيف: إضافة تدابير وقائية وطارئة، وتعديل حالاتها فورياً (`مخطط`، `جاري التنفيذ`، `مكتمل`).
   - تبويب السجل التاريخي للتقييمات: جدول زمني تراكمي بكافة عمليات التقييم وإعادة التقييم والمبررات والمقيمين.
   - نوافذ منبثقة لإعادة التقييم، وإغلاق الخطر أو إعادة فتحه مع توثيق الأسباب.

---

## 6. نتائج الاختبارات الإلزامية ومصفوفة التحقق

تم تنفيذ سكربت اختبار آلي شامل ومخصص للمرحلة الثالثة:  
[`scratch/test_phase3_risk_register.js`](file:///C:/Users/user/.gemini/antigravity-ide/brain/72dd480e-cbd6-4836-9750-15f8fc2aeda4/scratch/test_phase3_risk_register.js)  
ضد الخادم الحي (`http://localhost:3000`) وقاعدة البيانات الحقيقية:

### 6.1. نتائج اختبارات المرحلة الثالثة المباشرة (16/16 ناجح — 100%)
```text
===========================================================
=== PHASE 3: OPERATIONAL RISK REGISTER VERIFICATION     ===
===========================================================

--- 1. AUTHENTICATION & ACCESS CONTROL TESTS ---
[PASS] Test 1: Unauthenticated request to /api/admin/risks is strictly rejected (Status: 401)
[PASS] Test 2: Super Admin logs in successfully and receives secure session cookie (Status: 200)
[PASS] Test 3: Unauthorized staff without VIEW_RISK_REGISTER capability is rejected with 403 Forbidden (Status: 403)

--- 2. RISK CALCULATION ENGINE & BOUNDARY VALIDATION ---
[PASS] Test 4: Risk engine correctly computes scores (1-25) and assigns levels (LOW, MEDIUM, HIGH, CRITICAL) with boundary checks (Low: 1, Med: 6, High: 12, Crit: 20, Invalid rejected: true)

--- 3. RISK CREATION TESTS (STANDALONE & INCIDENT-LINKED) ---
[PASS] Test 5: Super Admin creates standalone operational risk successfully with sequential number (Status: 201, RiskNumber: AICSFA-RSK-2026-000001, Score: 16, Level: HIGH)
[PASS] Test 6: Initial risk assessment is automatically logged into persistent RiskAssessmentHistory table (History count: 1, Initial Score: 16)
[PASS] Test 7: Risk successfully derived from verified incident using sanitized operational data ONLY (Incident: AICSFA-INC-2026-634166, RiskNumber: AICSFA-RSK-2026-000002, Category: EXPLOSIVE_HAZARD_UXO)

--- 4. REASSESSMENT & AUDIT TRAIL PRESERVATION ---
[PASS] Test 8: Reassessment successfully updates current score to CRITICAL (20) and appends entry to historical timeline (New Score: 20, Level: CRITICAL, Total History Entries: 2)

--- 5. MITIGATION ACTIONS MANAGEMENT ---
[PASS] Test 9: Mitigation action created successfully and risk status transitions to TREATMENT_IN_PROGRESS (Type: PREVENTIVE, Status: PLANNED)
[PASS] Test 10: Mitigation action successfully updated to COMPLETED with completion timestamp recorded (Status: COMPLETED)

--- 6. OPERATIONAL LIFECYCLE: CLOSE & REOPEN ---
[PASS] Test 11: Operational risk successfully closed with mandatory audit reason (Status: CLOSED, CloseReason recorded)
[PASS] Test 12: Closed risk successfully reopened with mandatory reason and transitions to MONITORED (Status: MONITORED, ReopenReason recorded)

--- 7. CONFIDENTIALITY & ISOLATION ENFORCEMENT ---
[PASS] Test 13: CONFIDENTIALITY CONFIRMED: Having manage_risk_register capability does NOT grant access to IncidentOriginal (Status: 403 Forbidden)

--- 8. METRICS, 5x5 MATRIX & UI RESPONSE ---
[PASS] Test 14: Aggregated operational metrics and 5x5 matrix counts correctly compiled and returned (Total: 2, Cell [5,4] count: 1)
[PASS] Test 15: Admin Risk Register UI page (/admin/risks) renders successfully with 200 OK
[PASS] Test 16: Risk Detail UI page (/admin/risks/[id]) renders successfully with 200 OK and exhibits risk details (Status: 200, RiskNumber: AICSFA-RSK-2026-000001)

===========================================================
=== TEST SUMMARY: 16/16 TESTS PASSED (100%) ===
===========================================================
```

### 6.2. نتائج اختبارات عدم التراجع للمرحلتين الأولى والثانية (13/13 ناجح — 100%)
تمت إعادة تشغيل سكربت التحقق الشامل للمرحلتين 1 و 2 للتأكد من عدم تأثر أي وظيفة قائمة:
- صفحة التحقق `/verify`: ناجح (200 OK).
- حماية مسارات `/portal/alerts` و `/portal/field`: ناجح (307 Redirect).
- توجيه دور `FIELD_FOCAL_POINT`: ناجح إلى `/portal/field/intake`.
- رسائل التحقق وشريط الإعلانات: ناجح بنسبة 100% بهوية AICSFA.

### 6.3. فحص التجميع والأنواع البرمجية (TypeScript Check)
- الأمر المنفذ: `npx tsc --noEmit`
- النتيجة: **صفر أخطاء برمجية (Exit code 0)** عبر كامل ملفات المشروع.

---

## 7. جدول التمييز الصريح بين أنواع التحقق

| البند المفحوص | نوع الاختبار | النتيجة الدقيقة |
| :--- | :--- | :--- |
| **حساب درجات ومستويات الخطر والحدود** | **اختبار آلي تشغيلي (Unit & Logic)** | **ناجح (100%):** تم التحقق من كافة مجالات القيم (1-25) وتعيين المستويات ورفض القيم غير المنطقية. |
| **إنشاء خطر مستقل برمز رسمي** | **اختبار تشغيلي حي (Runtime API)** | **ناجح (201 Created):** توليد رمز `AICSFA-RSK-2026-000001` وحفظ البيانات والتقييم. |
| **اشتقاق خطر من بلاغ محقق** | **اختبار تشغيلي حي (Runtime API)** | **ناجح (201 Created):** استيراد البيانات المنقحة فقط وربط المعرف `incidentId`. |
| **عزل أصول البلاغات الحساسة** | **اختبار أمني عملي (Security Isolation)** | **ناجح (403 Forbidden):** منع مستخدم سجل المخاطر من الوصول إلى `IncidentOriginal`. |
| **حفظ السجل التاريخي لإعادة التقييم** | **اختبار تشغيلي لقاعدة البيانات** | **ناجح:** السجل التاريخي يحفظ التقييم الأولي والتقييم اللاحق بتسلسل زمني تراكمي. |
| **إدارة دورة حياة الخطر (إغلاق وإعادة فتح)** | **اختبار تشغيلي حي (Runtime API)** | **ناجح:** تغيير الحالات وتوثيق مبررات القرار وتحديث الطوابع الزمنية. |
| **المصفوفة التفاعلية 5×5 والمؤشرات** | **اختبار تشغيلي حي (Runtime API & UI)** | **ناجح:** احتساب توزيع الخلايا وتحديث المؤشرات بعد كل عملية. |
| **استجابة صفحات لوحة الإدارة** | **اختبار تصفح حي (HTTP GET 200)** | **ناجح:** استجابة `/admin/risks` و `/admin/risks/[id]` برمز 200 وعرض المكونات كاملة. |
| **عدم تأثر منظومة البلاغات والتنبيهات** | **فحص كود واختبار عدم تراجع** | **ناجح:** بقاء كافة مسارات ونماذج البلاغات والتنبيهات على حالتها دون أي تعديل هيكلي يضر بها. |
| **فحص الأخطاء البرمجية الشامل** | **فحص تجميع صارم (tsc --noEmit)** | **ناجح:** 0 أخطاء برمجية عبر كامل المستودع. |

---

## 8. المشكلات المتبقية ونقطة التوقف

1. **المشكلات المتبقية:**
   - **لا توجد أي مشكلات فنية أو أعطال غير محلولة في نطاق المرحلة الثالثة.**
   - كافة متطلبات سجل المخاطر، المحرك الحسابي، الصلاحيات، المصفوفة 5×5، والواجهات تعمل باستقرار تام.
2. **الالتزام بنقطة التوقف الصارمة:**
   - **تم التوقف التام عند نهاية المرحلة الثالثة.**
   - لم يتم البدء في المرحلة الرابعة (نظام التدريب الميداني والتقييم والدراسات المخصصة)، ولم يتم تفعيل أي تكاملات خارجية أو تعديل بيانات الإنتاج.
   - بانتظار مراجعتكم الكريمة لهذا التقرير واعتماد الأمر التنفيذي للمرحلة التالية.
