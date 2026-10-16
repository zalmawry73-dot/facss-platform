# تقرير الأمان الاستباقي قبل الاختبار اليدوي: تغيير كلمة المرور الآمن وإبطال الجلسات
## FACSS Pre-UAT Password Security & Session Revocation Report

**تاريخ وساعة الإنجاز:** 14 أكتوبر 2026 — 21:05 (بتوقيت عدن)  
**البيئة التشغيلية:** المنظومة الرئيسية (`d:\FACSSS`) على المنفذ `3000`  
**قاعدة البيانات:** PostgreSQL 16 (`facss_db`) على المنفذ التشغيلي `5433`  
**حالة الحسابات الأساسية:** **100% سليمة، غير ممسوسة، ولم يتم تغيير كلمة مرور الإدارة العليا آلياً نهائياً.**

---

## 1. الملخص التنفيذي

استجابةً لمتطلبات التأهيل الأمني قبل بدء الاختبار اليدوي للمرحلة الأولى، تم استكمال وتطوير منظومة تغيير كلمة المرور الآمنة لحسابات المنصة وحساب الإدارة العليا، وسد الثغرة التشغيلية المتمثلة في غياب وظيفة التغيير الذاتي لكلمة المرور.

تم تطبيق المعمارية بالكامل وفق الضوابط المشددة التالية:
1. **عدم المساس بكلمة مرور الإدارة الحالية أو الحسابات الثلاثة الأصلية** (`admin@facss-aden.com`, `clinet@gmail.com`, `zalmawry73@gmail.com`).
2. **عدم إجراء أي تعديل على Prisma Schema أو تنفيذ أي migrations**.
3. **عدم حذف أي بيانات أو تشويه جدول `ActivityLog`**.
4. **التكامل التام مع آلية إبطال الجلسات (`tokenVersion`)** لضمان طرد كافة الجلسات النشطة على جميع الأجهزة فور تغيير كلمة المرور.
5. **التحقق التجريبي الكامل بنسبة 100% (24 فحصاً ناجحاً)** عبر حساب اختبار مؤقت ومعزول تم تنظيفه ومسح آثاره بالكامل بعد الاختبار.

---

## 2. المعمارية الأمنية لنظام المصادقة وإبطال الجلسات

تعتمد منصة FACSS معمارية تحقق أمني متعددة الطبقات (Fail-Closed Architecture):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        مسار المصادقة وإبطال الجلسات                    │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
       ┌──────────────────────────────────────────────────────────┐
       │ 1. العميل يرسل طلب تغيير كلمة المرور مع الرمز القديم     │
       │    (Cookie: facss_session_token يحمل tokenVersion = N)   │
       └────────────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
       ┌──────────────────────────────────────────────────────────┐
       │ 2. التحقق من الهوية وكلمة المرور الحالية وقوة الجديدة   │
       │    (bcrypt.compare + معايير القوة + فحص تكرار الحالية)  │
       └────────────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
       ┌──────────────────────────────────────────────────────────┐
       │ 3. التحديث الذري في قاعدة البيانات (Atomic DB Update):    │
       │    • passwordHash = bcrypt.hash(newPassword, 10)         │
       │    • tokenVersion = tokenVersion + 1  (N + 1)            │
       └────────────────────────────┬─────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│ 4. مسح الجلسة في المتصفح الحالي   │ │ 5. إبطال الرمز القديم مركزياً     │
│    Set-Cookie: maxAge = 0         │ │    في كافة الأجهزة والمنافذ       │
│    إعادة التوجيه لـ /login         │ │    payload.tokenVersion (N)       │
│                                   │ │    !== db.tokenVersion (N+1)      │
│                                   │ │    ==> إرجاع null ورفض 401 فوراً   │
└───────────────────────────────────┘ └───────────────────────────────────┘
```

1. **التحقق المركزي الصارم (`getCurrentUser(true)`):**
   - لا تكتفي المنظومة بفك تشفير توقيع JWT، بل تستعلم قاعدة البيانات مركزياً وتطابق `payload.tokenVersion === user.tokenVersion`.
   - بمجرد زيادة `tokenVersion` داخل المعاملة، تصبح كافة الرموز السابقة الصادرة للحساب غير صالحة لحظياً على مستوى الخادم في جميع نقاط الـ API والواجهات.

2. **التنظيف الدفاعي للكوكي:**
   - يرسل الخادم ترويسة `Set-Cookie` مع `Max-Age=0` و `Path=/` و `HttpOnly` و `SameSite=lax` لمسح الكوكي من متصفح المستخدم فور نجاح التغيير.

---

## 3. قائمة الملفات التي تم إنشاؤها وتعديلها

| م | الملف | نوع الإجراء | الوصف والدور الأمني |
|---|---|:---:|---|
| 1 | `app/api/auth/change-password/route.ts` | **إنشاء جديد** | مسار API المحمي لمعالجة تغيير كلمة المرور، التحقق من الحالية، فرض القوة، التشفير بـ bcrypt، الزيادة الذرية لـ `tokenVersion`، مسح الكوكي، وتوثيق سجل الرقابة. |
| 2 | `components/auth/ChangePasswordCard.tsx` | **إنشاء جديد** | مكون واجهة تفاعلي حديث مع مؤشرات مرئية لحظية لقوة كلمة المرور، أزرار إظهار/إخفاء، وتنبيه أمني صريح بالإبطال الفوري للجلسات. |
| 3 | `app/admin/change-password/page.tsx` | **إنشاء جديد** | شاشة الواجهة المخصصة للإدارة العليا وطاقم العمل على الرابط: `http://localhost:3000/admin/change-password`. |
| 4 | `lib/rateLimit.ts` | **تعديل** | إضافة محدد معدل الطلبات `PASSWORD_CHANGE: { maxRequests: 10, windowSeconds: 900 }` لحظر هجمات التخمين بعد 10 محاولات في 15 دقيقة. |
| 5 | `components/admin/shell/AdminTopbar.tsx` | **تعديل** | إضافة زر واختصار «كلمة المرور» مع أيقونة المفتاح `KeyRound` في شريط الإدارة العلوي (الحواسيب والهواتف). |
| 6 | `app/admin/AdminClientBar.tsx` | **تعديل** | إضافة زر «تغيير كلمة المرور» في ترويسة شريط الإدارة التفاعلي. |
| 7 | `components/admin/SettingsManager.tsx` | **تعديل** | إضافة زر سريع للوصول لشاشة تغيير كلمة المرور ضمن أدوات شاشة إعدادات النظام `/admin/settings`. |
| 8 | `lib/i18n.ts` | **تعديل** | إضافة مصطلحات الترجمة للغتين العربية والإنجليزية (`adminNavChangePassword`). |
| 9 | `FACSS_MANUAL_UAT/FACSS_UAT_PHASE_01_MANUAL_GUIDE.md` | **تعديل** | تصحيح السيناريو العاشر لفحص الزيادة النسبية لـ `tokenVersion` (+1)، وإضافة السيناريو الـ 11 المفصل لتغيير كلمة المرور. |
| 10 | `FACSS_MANUAL_UAT/FACSS_UAT_PHASE_01_TRACKER.csv` | **تعديل** | تحديث السيناريو العاشر وإضافة السيناريو الـ 11 بحالة مبدئية `NOT TESTED`. |
| 11 | `FACSS_MANUAL_UAT/FACSS_UAT_COVERAGE_MATRIX.md` | **تعديل** | إضافة المسار البرمجي والواجهة إلى مصفوفة التغطية الشاملة (`TC-AUTH-09` حتى `TC-AUTH-13`). |

---

## 4. الضوابط الأمنية المطبقة في الوظيفة الجديدة

1. **التحقق الإلزامي من كلمة المرور الحالية:**
   - يمنع تغيير كلمة المرور دون تقديم كلمة المرور الحالية ومطابقتها عبر `bcrypt.compare`.
2. **سياسة التعقيد المشددة (Password Complexity Policy):**
   - الطول الأدنى: **10 أحرف**.
   - احتوائها على حرف كبير واحد على الأقل (`[A-Z]`).
   - احتوائها على حرف صغير واحد على الأقل (`[a-z]`).
   - احتوائها على رقم واحد على الأقل (`[0-9]`).
   - احتوائها على رمز خاص واحد على الأقل (`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]`).
3. **منع إعادة استخدام كلمة المرور الحالية (Anti-Reuse Check):**
   - مقارنة كلمة المرور الجديدة بتجزئة كلمة المرور الحالية ورفض التكرار بـ 400.
4. **التجزئة الآمنة (Secure Cryptographic Hashing):**
   - استخدام خوارزمية `bcrypt` بـ 10 جولات تمليح (Salt Rounds = 10) المتوافقة مع معايير المنظومة.
5. **الرفع الذري لإصدار الجلسة (Atomic Token Version Increment):**
   - تنفيذ التحديث في استعلام واحد: `tokenVersion: { increment: 1 }` يمنع تعارض الحالات التزامنية (Race Conditions).
6. **الحماية من المحاولات المتكررة (Rate Limiting & Anti-Brute-Force):**
   - حد أقصى 10 محاولات لكل 15 دقيقة لكل عنوان IP. الرد التلقائي بـ `HTTP 429 Too Many Requests` مع ترويسة `Retry-After`.
7. **سجل الرقابة والتتبع الأمني (`ActivityLog`):**
   - تسجيل حدث `PASSWORD_CHANGE_SUCCESS` عند النجاح.
   - تسجيل حدث `PASSWORD_CHANGE_FAILED` عند فشل مطابقة كلمة المرور الحالية.
   - **تعتيم كامل (Full Scrubbing):** لا يتم تسجيل أي كلمات مرور أو رموز نهائياً في حقل `details`.

---

## 5. نتائج الاختبارات المؤتمتة (Automated Test Suite Results)

تم بناء وتنفيذ حزمة اختبارات مؤتمتة متكاملة في بيئة معزولة باستخدام حساب تجريبي مؤقت (`temp_isolated_tester@facss-security.local`) دون المساس بالحسابات الحقيقية:

```
======================================================================
  FACSS — SAFE PASSWORD CHANGE & SESSION REVOCATION TEST SUITE
======================================================================

[Baseline] Found 3 existing users:
  - admin@facss-aden.com (SUPER_ADMIN), tokenVersion=2
  - clinet@gmail.com (CLIENT), tokenVersion=3
  - zalmawry73@gmail.com (TRAINEE), tokenVersion=1
[Baseline] Initial ActivityLog count: 54

[Setup] Created isolated test user: cmv8ey3ny0000awwv004bl9r0, tokenVersion=1

--- Test 1: Unauthenticated Request ---
  ✔ PASS: Unauthenticated request returned status 401 (expected 401)

--- Test 2: Missing / Incomplete Fields ---
  ✔ PASS: Missing current password returned status 400 (expected 400)

--- Test 3: Password Confirmation Mismatch ---
  ✔ PASS: Mismatch rejected with status 400

--- Test 4: Weak Password Policy Enforcement ---
  ✔ PASS: Short password (< 10 chars) rejected with status 400
  ✔ PASS: Password without special chars rejected with status 400

--- Test 5: Incorrect Current Password ---
  ✔ PASS: Incorrect current password rejected: كلمة المرور الحالية غير صحيحة.
  ✔ PASS: ActivityLog contains PASSWORD_CHANGE_FAILED entry
  ✔ PASS: ActivityLog does NOT contain sensitive password values

--- Test 6: Prevent Current Password Reuse ---
  ✔ PASS: Password reuse blocked with status 400

--- Test 7: Rate Limiting Enforcement ---
  ✔ PASS: Rate limit HTTP 429 triggered on request #11 with Retry-After: 900
  ✔ PASS: Rate limiting successfully triggered and protected the endpoint (HTTP 429)

--- Test 8: Successful Password Change Execution ---
  ✔ PASS: Valid password change returned status 200 (expected 200)
  ✔ PASS: Response payload has success: true
  ✔ PASS: Reported previousTokenVersion is 1 (got 1)
  ✔ PASS: Reported newTokenVersion is 2 (got 2)
  ✔ PASS: Session cookie cleared in browser response (Max-Age=0)
  ✔ PASS: DB tokenVersion incremented to 2 (actual: 2)
  ✔ PASS: New password hash verified successfully against DB
  ✔ PASS: Old password hash is no longer valid
  ✔ PASS: ActivityLog contains PASSWORD_CHANGE_SUCCESS entry
  ✔ PASS: ActivityLog details do NOT leak plain text passwords

--- Test 9: Immediate Session Revocation with Old Token ---
  ✔ PASS: Old token rejected by /api/auth/me (user: null), session revocation confirmed!

--- Test 10: Login Attempt with Old vs New Password ---
  ✔ PASS: Login with old password failed with status 401 (expected 401)
  ✔ PASS: Login with new password succeeded (status 200)

======================================================================
  ALL 24 TEST CASES PASSED SUCCESSFULLY (100%)
======================================================================

[Cleanup] Cleaning up isolated test artifacts...
[Cleanup] Isolated test user and test logs deleted cleanly.

[Integrity Audit] Checking original accounts:
  ✔ PASS: Account count matches baseline (3 === 3)
  ✔ PASS: Account admin@facss-aden.com exists
  ✔ PASS: Account admin@facss-aden.com tokenVersion unchanged (2 === 2)
  ✔ PASS: Account admin@facss-aden.com passwordHash 100% UNTOUCHED
  ✔ PASS: Account admin@facss-aden.com role unchanged (SUPER_ADMIN)
  ✔ PASS: Account clinet@gmail.com exists
  ✔ PASS: Account clinet@gmail.com tokenVersion unchanged (3 === 3)
  ✔ PASS: Account clinet@gmail.com passwordHash 100% UNTOUCHED
  ✔ PASS: Account clinet@gmail.com role unchanged (CLIENT)
  ✔ PASS: Account zalmawry73@gmail.com exists
  ✔ PASS: Account zalmawry73@gmail.com tokenVersion unchanged (1 === 1)
  ✔ PASS: Account zalmawry73@gmail.com passwordHash 100% UNTOUCHED
  ✔ PASS: Account zalmawry73@gmail.com role unchanged (TRAINEE)
```

---

## 6. التحقق من TypeScript والبناء (Build Verification)

- **فحص الأنواع البرمجية (Type Check):**
  - تم تشغيل `npx tsc --noEmit` واجتاز الفحص بنجاح تام بدون أي أخطاء (Exit Code: 0).
- **البناء الإنتاجي (Production Build):**
  - تم تشغيل `npx next build` واكتمل بنجاح (Exit Code: 0) متضمناً المسار والصفحة الجديدة:
    - `├ ƒ /api/auth/change-password`
    - `├ ƒ /admin/change-password`

---

## 7. المخاطر المتبقية والتوصيات التشغيلية (Residual Risks & Advisory)

1. **تزامن إبطال الجلسات عبر المتصفحات المتعددة:**
   - تغيير كلمة المرور يبطل الجلسة فورياً على الخادم عبر `tokenVersion`؛ إلا أن المتصفحات الأخرى ستظل تحتفظ بنسخة الكاش المحلي حتى تقوم بأول طلب API محمي أو تحديث للصفحة، حيث ستواجه رفضاً فورياً وتحويلاً إجبارياً إلى صفحة الدخول.
2. **إدارة كلمات المرور:**
   - يُوصى بشدة باستخدام برنامج إدارة كلمات مرور موثوق (مثل Bitwarden أو 1Password) لتوليد وحفظ كلمة المرور الجديدة لحساب الإدارة العليا، وتفادي الكلمات التي يمكن تخمينها.
3. **سرية بيئة التشغيل:**
   - مفتاح `AUTH_SECRET` في ملف `.env` هو الأساس التشفيري لكافة التواقيع الرقمية؛ يجب الحفاظ على سريته التامة وعدم مشاركته أو تضمينه في مستودعات Git العامة.

---

## 8. دليل الخطوات الإجرائية لتغيير كلمة مرور الإدارة العليا بنفسك عبر المتصفح

لتغيير كلمة مرور حساب الإدارة العليا بأمان تام ودون أي تدخل برمجي خارجي، يرجى اتباع الخطوات التالية:

### الخطوة 1: تسجيل الدخول بحساب الإدارة العليا
1. افتح المتصفح وتوجه إلى: `http://localhost:3000/login`
2. أدخل البريد الإلكتروني: `admin@facss-aden.com`
3. أدخل كلمة المرور الحالية المعتمدة.
4. اضغط «تسجيل الدخول».

### الخطوة 2: الانتقال لشاشة تغيير كلمة المرور
يمكنك الوصول إلى الشاشة بإحدى الطرق الثلاث التالية:
- **الرابط المباشر:** `http://localhost:3000/admin/change-password`
- **شريط الترويسة:** انقر على زر **«كلمة المرور»** بأيقونة المفتاح بجوار زر تسجيل الخروج في الشريط العلوي.
- **شاشة الإعدادات:** من شاشة `http://localhost:3000/admin/settings`، انقر على زر **«تغيير كلمة المرور»** بأعلى الصفحة.

### الخطوة 3: إدخال البيانات ومراقبة مؤشرات القوة
1. في حقل **«كلمة المرور الحالية»**، أدخل كلمة المرور التي سجلت الدخول بها للتو.
2. في حقل **«كلمة المرور الجديدة»**، أدخل كلمة المرور الجديدة القوية التي اخترتها.
3. راقب قائمة مؤشرات القوة بأسفل النموذج وتأكد من تحول الشروط السبعة إلى علامات صح خضراء:
   - [x] 10 أحرف كحد أدنى
   - [x] حرف كبير واحد (A-Z)
   - [x] حرف صغير واحد (a-z)
   - [x] رقم واحد على الأقل (0-9)
   - [x] رمز خاص (@, #, $, %, !)
   - [x] تطابق كلمتي المرور
   - [x] اختلاف عن كلمة المرور الحالية
4. في حقل **«تأكيد كلمة المرور الجديدة»**، أعد إدخال كلمة المرور الجديدة.

### الخطوة 4: تأكيد التغيير والتحقق من الجلسات
1. اضغط على الزر الذهبي: **«تأكيد تغيير كلمة المرور وإبطال الجلسات»**.
2. ستظهر رسالة نجاح خضراء: *"تم تغيير كلمة المرور بنجاح. تم إنهاء كافة الجلسات النشطة لضمان الأمان، يرجى تسجيل الدخول مجدداً..."*.
3. سيقوم النظام بمسح الجلسة فورياً وتحويلك تلقائياً لصفحة الدخول `/login`.
4. سجل دخولك مجدداً باستخدام كلمة المرور **الجديدة** لتأكيد نجاح العملية.

### الخطوة 5: التحقق من قاعدة البيانات (اختياري)
يمكنك فتح سطر الأوامر أو أداة psql والتأكد من توثيق العملية والزيادة النسبية لـ `tokenVersion`:
```sql
-- 1. التأكد من زيادة tokenVersion بمقدار +1:
SELECT id, email, "fullName", role, "tokenVersion" 
FROM "User" 
WHERE email = 'admin@facss-aden.com';

-- 2. التأكد من تسجيل الحدث الأمني دون تسريب كلمات المرور:
SELECT action, "userName", details, "createdAt" 
FROM "ActivityLog" 
WHERE action = 'PASSWORD_CHANGE_SUCCESS' 
ORDER BY "createdAt" DESC LIMIT 1;
```

---

**المنظومة الآن جاهزة بالكامل للاختبار اليدوي الشامل للمرحلة الأولى.**
