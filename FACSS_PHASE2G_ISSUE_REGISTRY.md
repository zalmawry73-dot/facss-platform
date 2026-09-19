# سجل المشكلات والفجوات وإدارتها لمنصة FACSS (FACSS Phase 2G Issue Registry)

**تاريخ التوثيق:** 19 سبتمبر 2026  
**الصفة:** Lead QA Engineer + Security Auditor + Full-Stack Systems Analyst  
**السياسة المعتمدة:** الاكتشاف والتوثيق والتحليل الجذري، ثم الإصلاح المنضبط دون تعديل النموذج البنيوي دون إذن.

---

## 1. مصفوفة تصنيف وتوزيع المشكلات (Issue Distribution Matrix)

| التصنيف (Severity) | التعريف والمعيار | إجمالي المرصود | تم إصلاحه وتحريزه | يتطلب قرار المالك |
| :--- | :--- | :---: | :---: | :---: |
| **P0 (حرج / Critical)** | خلل يعطل وظيفة أساسية بصورة كاملة أو يتسبب في تسريب أمني مفتوح. | 0 | 0 | 0 |
| **P1 (مرتفع / High)** | خلل يؤثر على صلاحية دقيقة أو مبدأ أمني أو فجوة بنية بيانات. | 2 | 1 | 1 |
| **P2 (متوسط / Medium)** | خلل يؤثر على استقرار اتصال خادم أو استجابة واجهة تحت أحمال متزامنة. | 1 | 1 | 0 |
| **P3 (منخفض / Low)** | ملاحظات شكلية أو توثيقية أو تحسينات طفيفة في الرسائل. | 1 | 1 | 0 |
| **الإجمالي** | — | **4** | **3** | **1** |

---

## 2. السجل التفصيلي للمشكلات (Detailed Issue Registry)

### مشكلة رقم: [ISSUE-2G-01]
- **العنوان:** ثغرة في تطبيق مبدأ الحد الأدنى من الصلاحيات (Least Privilege) في استعلام قائمة الطلبات العامة.
- **التصنيف:** `P1` (High Severity - Security & RBAC Enforcement).
- **الحالة:** `RESOLVED & VERIFIED` (تم الإصلاح والتحقق في الاختبار التشغيلي `S-04`).
- **الملف المعني:** `app/api/requests/route.ts` (الدالة `GET`).
- **خطوات إعادة الإنتاج:**
  1. تسجيل الدخول بحساب موظف عادي (`STAFF`) لا يمتلك صلاحية `manage_requests` في جدول `UserCapability` (مثل `staff-without-req-caps@facss-aden.com`).
  2. إرسال طلب `GET /api/requests`.
- **السلوك السابق (الخلل):**
  كان الكود يفحص: `const isStaff = STAFF_ROLES.includes(session.role);`، وفي حال كان المستخدم موظفاً، يستعلم كافة طلبات المركز `findMany({ where: {} })` دون التأكد من امتلاكه صلاحية `manage_requests`! مما أتاح لموظف أرشيف أو موظف تدريب الاطلاع على كافة طلبات العملاء الاستشارية.
- **السبب الجذري (Root Cause):**
  الاعتماد على فحص الدور المدمج `isStaff` فقط دون تطبيق فحص الصلاحية الدقيقة `hasCapability(session, CAPABILITIES.MANAGE_REQUESTS)`.
- **الإصلاح البرمجي المطبق (Remediation):**
  تم استيراد `hasCapability` و`CAPABILITIES` من `@/lib/rbac`، وإضافة تحقق صريح:
  ```ts
  if (isStaff) {
    const canManage = await hasCapability(session, CAPABILITIES.MANAGE_REQUESTS);
    if (!canManage) {
      return NextResponse.json(
        { error: `Forbidden: Missing required capability [${CAPABILITIES.MANAGE_REQUESTS}]` },
        { status: 403 }
      );
    }
  }
  ```
- **أثر التحقق (Verification Evidence):**
  تمت إعادة بناء المشروع وإعادة اختبار السيناريو `S-04` في `scripts/test_phase2g_runtime_suite.js`، وعادت الواجهة فوراً برمز `403 Forbidden` للموظف غير المخول.

---

### مشكلة رقم: [ISSUE-2G-02]
- **العنوان:** إخفاق واجهة استرجاع الإشعارات `GET /api/notifications` تحت ضغط الاستعلامات المتزامنة بقواعد Neon Serverless.
- **التصنيف:** `P2` (Medium Severity - Reliability & Database Connection Contention).
- **الحالة:** `RESOLVED & VERIFIED` (تم الإصلاح والتحقق في الاختبار التشغيلي `C-07`).
- **الملف المعني:** `app/api/notifications/route.ts` (الدالة `GET`).
- **خطوات إعادة الإنتاج:**
  1. استدعاء `GET /api/notifications` عبر شبكة خارجية أو تحت ضغط طلبات متزامنة.
  2. مراقبة سجلات الخادم.
- **السلوك السابق (الخلل):**
  إطلاق استثناء بريزما `PrismaClientKnownRequestError: code P1001 (Can't reach database server at ep-plain-river-b1x6n7oh-pooler...)` مما يعيد للعميل `500 Internal Server Error`.
- **السبب الجذري (Root Cause):**
  استخدام `Promise.all` لإطلاق 3 استعلامات بريزما متزامنة في نفس اللحظة (`findMany`, `count`, `count`) على اتصال Neon PgBouncer المجمع (Transaction Pooling)، مما يسبب تجاوز مهلة حجز الاتصالات السحابية في الشبكات البطيئة.
- **الإصلاح البرمجي المطبق (Remediation):**
  إعادة هيكلة الاستعلامات لتتم بشكل متتابع (Sequential Queries) يعيد استخدام نفس قناة الاتصال بأمان، مع الاستغناء عن استعلام العد الثاني إذا كان الفلتر `unreadOnly`:
  ```ts
  const notifications = await prisma.notification.findMany({ where: whereClause, ... });
  const total = await prisma.notification.count({ where: whereClause });
  const unreadCount = unreadOnly ? total : await prisma.notification.count({ where: { userId: session.userId, isRead: false } });
  ```
- **أثر التحقق (Verification Evidence):**
  تم اختبار الواجهة بنجاح تام في سيناريو `C-07`، وعادت برمز `200 OK` مع إحصائيات الإشعارات بدقة دون أي خطأ اتصال.

---

### مشكلة رقم: [ISSUE-2G-03]
- **العنوان:** فجوة نموذج البيانات في تخصيص أبحاث `CLIENT_ONLY` لعميل محدد (Data-Model Gap).
- **التصنيف:** `P1` (High Severity - Architecture / Business Model Decision).
- **الحالة:** `FAIL-SECURE ACTIVE / AWAITING OWNER DECISION` (مقفلة بحماية خادم احترازية وبانتظار قرار المالك).
- **الملف المعني:** `prisma/schema.prisma` (`model ResearchPublication`) و`app/research/[slug]/page.tsx`.
- **طبيعة الفجوة:**
  نموذج `ResearchPublication` يمتلك حقل `visibility` بخيار `CLIENT_ONLY`، ولكنه يفتقر إلى وجود علاقة مع العميل (مثل `clientId` أو جدول تراخيص `ResearchAccessGrant`).
- **المخاطرة الأمنية:**
  إذا كان القصد التشغيلي هو تقارير استشارية خاصة بعميل بعينه، فإن فحص `role === 'CLIENT'` سيتسبب في تسريب بيانات بين العملاء.
- **الإجراء المتخذ داخل النطاق:**
  تطبيق حظر احترازي (Fail-Secure Gate) في الخادم على صفحة التفاصيل وصفحة القائمة يمنع وصول الزوار وعموم حسابات العملاء غير المصرح لهم لمنشورات `CLIENT_ONLY`، مع إرجاع `404 Not Found` حتى لا يُكشف وجود التقرير.
- **القرار المطلوب من صاحب المركز:**
  - اعتماد ترقية المخطط (Schema Migration) لإضافة `clientId` إن كانت التقارير مخصصة لكل عميل.
  - أو اعتماد فتحها لعموم العملاء المسجلين إن كانت نشرات أمنية دورية عامة.

---

### مشكلة رقم: [ISSUE-2G-04]
- **العنوان:** التحقق من سلوك واجهة `GET /api/auth/me` للمستخدمين المعطلين.
- **التصنيف:** `P3` (Low Severity / Design Consistency).
- **الحالة:** `DOCUMENTED & VERIFIED BY DESIGN`.
- **الملف المعني:** `app/api/auth/me/route.ts`.
- **التقييم:**
  تُعيد الواجهة `{ user: null }` برمز `200 OK` للمستخدم غير المسجل أو المعطل `isActive: false` لتمكين واجهات React من تهيئة حالة الجلسة دون إطلاق استثناءات شبكة في واجهة المستخدم، بينما تُعيد كافة واجهات الموارد المحمية (`/api/notifications`, `/api/requests`, إلخ) رفضاً قاطعاً برمز `401 Unauthorized` للمستخدم المعطل.
- **أثر التحقق (Verification Evidence):**
  تم التحقق في السيناريو `SEC-03` بأن الحساب المعطل يُرفض برمز `401` في كافة العمليات المحمية.

---

## 3. ملخص الإغلاق البرمجي

- **لا توجد أي مشكلة P0 حرجة في النظام بالكامل.**
- تم إصلاح مشكلة الصلاحية الدقيقة P1 ومشكلة استقرار الاتصال P2 بنجاح تام، مع التحقق منها في الاختبارات التشغيلية الحقيقية واختبارات عدم التراجع (234/234 فحصاً ناجحاً).
- تظل مشكلة فجوة بيانات الأبحاث `CLIENT_ONLY` تحت الحماية الاحترازية الصارمة (Fail-Secure 404) دون أي تسريب، وبانتظار حسم المالك للنموذج التشغيلي المفضل.
