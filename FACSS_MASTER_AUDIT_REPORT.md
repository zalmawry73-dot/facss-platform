# تقرير التدقيق الفني والأمني والتشغيلي الشامل (FACSS Master Audit Report)
**مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية**  
*Aden First Center for Security Services and Strategic Studies (FACSS)*

---

## 1. Executive Summary (الملخص التنفيذي)

تم إجراء تدقيق فني وهندسي وأمني معمّق وشامل لكامل مستودع مشروع منصة **مركز عدن الأول (FACSS)** بواسطة فريق التدقيق المعماري والأمني (Senior Software Architect + Security Auditor + QA Lead).

### الحقيقة المجردة للمشروع (The Ground Truth):
المشروع يمتلك **واجهة بصرية متقدمة ومتقنة للغاية (High-End Presentation Layer)** تعكس الهوية الرسمية للمركز بدقة، وبنية أولية لقاعدة بيانات PostgreSQL (عبر Prisma بـ 19 نموذجاً)، ومسار عمل حقيقي لتقديم طلبات الخدمات والاستفسارات (`/request-service` و `/contact`). 

ومع ذلك، أظهر التدقيق المعمق وجود **فجوة حادة بين ما تدعيه وثائق التسليم السابقة (README / Handover Report) والواقع البرمجي الفعلي (Claim vs Reality)**:
1. **العديد من مسارات العمل الحيوية عبارة عن واجهات عرض فقط (UI_ONLY) أو سلوكيات وهمية (MOCK / FAKE_SUCCESS)**:
   * زر «نشر دراسة جديدة» وزر «إضافة برنامج تدريبي» هما أزرار ميتة (`onClick={undefined}` أو بدون Handler).
   * زر «تأكيد التسجيل الآن» في دورات التدريب، وزر «تحميل PDF» في تقارير العملاء، يُطلقان تنبيهات متصفح وهمية (`alert()`) دون وجود أي استدعاء لخادم أو كتابة في قاعدة البيانات.
   * لا يوجد أي نظام لإدارة المحتوى (CMS) للخدمات أو الأخبار أو الدورات أو الأبحاث (تقتصر لوحات الإدارة على جداول قراءة فقط لما تم بذره في ملف Seed).
2. **ثغرات أمنية حرجة من الدرجة القصوى (P0 Critical Security Vulnerabilities)**:
   * **بيانات الدخول الإدارية (Super Admin) معروضة علناً بأزرار تعبئة سريعة داخل صفحة الدخول `/login` على الخادم السحابي الحي**، مما يتيح لأي زائر السيطرة الكاملة على النظام.
   * **انعدام تام للتحقق الأمني على مستوى الخادم (Server-Side Authorization) في مكونات الخادم (Server Components) داخل `/admin`**، حيث تقوم الصفحات بالاستعلام المباشر من Prisma وجلب بيانات المستخدمين والرسائل والطلبات دون التحقق من الجلسة في الـ SSR، مما يسرب البيانات في كود الـ HTML و الـ RSC Payload لأي طلب خارجي قبل عمل الـ Redirect في الواجهة.
   * **ثغرة تجاوز صلاحيات (IDOR / Broken Access Control) في تفاصيل طلبات العملاء** تتيح لأي حساب برتبة متدرب (`TRAINEE`) الاطلاع على كافة الطلبات الأمنية السرية الخاصة بالعملاء.

---

## 2. Overall Completion Score (مستوى الاكتمال الفعلي)

| المحور / القطاع | الاكتمال الفعلي | التقييم | الملاحظات الأساسية |
| :--- | :---: | :---: | :--- |
| **الموقع التعريفي العام (Public Site)** | **70%** | PARTIAL | الواجهات مكتملة، النصوص مطابقة للوثيقة، الاستفسار وطلب الخدمة متصلان بقاعدة البيانات. |
| **محرك المصادقة (Authentication)** | **50%** | PARTIAL | يعمل عبر JWT و Bcrypt، لكن يفتقر لتأكيد البريد، إعادة تعيين كلمة المرور، وحماية الـ Brute Force. |
| **نظام طلب الخدمات الأمنية (Requests)** | **65%** | FUNCTIONAL | إرسال الطلب، توليد الكود، استعراضه في الإدارة وتحديث حالته وإضافة الملاحظات يعمل. لكن لا يوجد رفع وثائق. |
| **لوحة التحكم المركزية (Admin CMS)** | **25%** | UI_ONLY / PARTIAL | 7 صفحات من أصل 8 هي مجرد جداول قراءة فقط (Read-Only) لما هو في الـ DB دون إمكانية التعديل أو الحذف. |
| **بوابة العملاء (Client Portal)** | **40%** | PARTIAL | متابعة الطلبات تعمل؛ صفحة التقارير تعتمد على `alert()`؛ صفحة الملف الشخصي عرض فقط بدون تعديل. |
| **بوابة المتدربين (Trainee Portal)** | **30%** | MOCK / PARTIAL | الشهادات المسجلة مسبقاً تظهر وتُطبع؛ التسجيل في الدورات مجرد `alert()` دون حفظ في الـ DB. |
| **أكاديمية التدريب (Training System)** | **20%** | PARTIAL | لا توجد دورة عمل للموافقة/الرفض، ولا تسجيل حضور حقيقي، ولا إصدار شهادات من لوحة الإدارة. |
| **إدارة المستخدمين (User Management)** | **15%** | UI_ONLY | جدول عرض للمستخدمين فقط؛ لا يمكن إضافة أو تعديل أو تعطيل أو تغيير رتبة أي مستخدم. |
| **إدارة المحتوى (CMS Services/Research/News)** | **10%** | MISSING | لا توجد أي واجهة أو API لإنشاء أو تعديل أو حذف خدمة، بحث، أو خبر. التعديل يتم فقط عبر `seed.js` أو Studio. |
| **المستندات وإدارة الملفات (Document Storage)** | **0%** | SCHEMA_ONLY | النماذج موجودة في Prisma، لكن لا يوجد أي مسار لرفع أو تحميل الملفات على القرص أو السحابة. |
| **نظام الإشعارات (Notifications)** | **30%** | PARTIAL | يتم إنشاء إشعار محلي في قاعدة البيانات فقط؛ لا يوجد نظام لتحديث القراءة، وصفر تكامل خارجي (لا بريد ولا SMS). |
| **الدرجة الكلية لاكتمال المنصة** | **38%** | **PARTIAL** | **المنصة في مرحلة MVP واجهاتي متقدم مع مسار خدمات أولي، وليست منصة إنتاجية مكتملة.** |

---

## 3. Overall Security Score (مستوى الأمان والجاهزية السيادية)

* **الدرجة الإجمالية للأمان:** **28 / 100** (حالة خطر حرجة — **CRITICAL RISK**)
* **هل المنصة آمنة وجاهزة للنشر والتشغيل الفعلي للعميل حالياً؟**  
  ⛔ **قطعاً لا (NO)** — تشغيل المنصة بوضعها الحالي يمثل خطراً تشغيلياً وأمنياً فادحاً على سمعة وسرية بيانات المركز.

---

## 4. Architecture (المعمارية التقنية للمشروع)

```
                       +-----------------------------------+
                       |    Client Browser (Web / Mobile)  |
                       +-----------------+-----------------+
                                         |
                                         | HTTPS (Vercel Edge)
                                         v
                       +-----------------------------------+
                       | Next.js 14.2 App Router (Node.js) |
                       | [NO middleware.ts at root level]  |
                       +--------+-----------------+--------+
                                |                 |
                 +--------------+                 +--------------+
                 v                                               v
     [Server Components (SSR)]                       [Route Handlers (/api)]
     - app/page.tsx                                  - /api/auth/* (login, me, register)
     - app/admin/* (Direct DB Read!) ⚠️               - /api/requests (GET, POST)
     - app/portal/client/* (Direct DB)               - /api/requests/[id] (GET, PATCH)
     - app/portal/trainee/*                          - /api/services (GET only)
                 |                                   - /api/contact (POST only)
                 |                                               |
                 +--------------+                 +--------------+
                                |                 |
                                v                 v
                       +-----------------------------------+
                       |    Prisma Client (lib/prisma.ts)  |
                       +-----------------+-----------------+
                                         |
                                         | Connection Pool (SSL)
                                         v
                       +-----------------------------------+
                       | Neon Serverless PostgreSQL 16 DB  |
                       +-----------------------------------+
```

---

## 5. Project Inventory (جرد المكونات والأدوات البرمجية)

* **Framework:** Next.js `14.2.15` (App Router)
* **React:** `18.3.1` | **TypeScript:** `5.6.3`
* **Node Environment:** Node.js v20+ / v22+
* **Database Driver & ORM:** PostgreSQL عبر Prisma ORM `@prisma/client` `^5.21.1`
* **Authentication:** محلي عبر `jose` `^5.9.6` (JWT) + `bcryptjs` `^2.4.3` (10 rounds).
* **Styling / UI:** خالص مخصص Vanilla CSS (`app/globals.css`) + `lucide-react` `^0.453.0`.
* **Validation Libraries:** لا توجد مكتبة تحقق مثل (Zod أو Yup أو Joi). التحقق يتم يدوياً بـ `if (!field)` في مسارات معدودة.
* **File Upload / Storage Libraries:** لا توجد أي مكتبات (Multer, Busboy, AWS SDK, Cloudinary).
* **Email / SMS / WhatsApp Libraries:** لا توجد (Nodemailer غير موجود، Twilio غير موجود).
* **Testing Tools:** **لا توجد أي أداة اختبار مؤتمتة** (لا Jest، لا Vitest، لا Playwright، لا Cypress).
* **Security Middleware:** **ملف `middleware.ts` غير موجود تماماً في المشروع.**
* **Rate Limiting:** غير موجود في أي Endpoint.

---

## 6. Route Inventory (جرد كافة مسارات التطبيق)

يحتوي التطبيق على **29 مسار صفحة (Pages)** و **8 مسارات برمجية (API Routes)**:

| # | المسار (Route) | مسار الملف الفعلي | نوع المكون | الحماية المفترضة | الحالة الفعلية |
|---|---|---|---|---|---|
| 1 | `/` | `app/page.tsx` | Server (SSR) | عام (Public) | **FUNCTIONAL** |
| 2 | `/about` | `app/about/page.tsx` | Server (SSR) | عام (Public) | **FUNCTIONAL** |
| 3 | `/services` | `app/services/page.tsx` | Server (SSR) | عام (Public) | **FUNCTIONAL** |
| 4 | `/services/[slug]` | `app/services/[slug]/page.tsx` | Server (SSR) | عام (Public) | **FUNCTIONAL** |
| 5 | `/training` | `app/training/page.tsx` | Server (SSR) | عام (Public) | **PARTIAL** |
| 6 | `/research` | `app/research/page.tsx` | Server (SSR) | عام (Public) | **FUNCTIONAL** |
| 7 | `/research/[slug]` | `app/research/[slug]/page.tsx` | Server (SSR) | عام (Public) | **FUNCTIONAL** |
| 8 | `/sectors` | `app/sectors/page.tsx` | Server (SSR) | عام (Public) | **FUNCTIONAL** |
| 9 | `/methodology` | `app/methodology/page.tsx` | Server (SSR) | عام (Public) | **FUNCTIONAL** |
| 10 | `/contact` | `app/contact/page.tsx` | Client (CSR) | عام (Public) | **FUNCTIONAL** |
| 11 | `/request-service` | `app/request-service/page.tsx` | Client (CSR) | عام (Public) | **FUNCTIONAL** |
| 12 | `/login` | `app/login/page.tsx` | Client (CSR) | عام (Public) | **SECURITY_RISK (P0)** |
| 13 | `/register` | `app/register/page.tsx` | Client (CSR) | عام (Public) | **SECURITY_RISK (P1)** |
| 14 | `/admin` | `app/admin/page.tsx` | Server (SSR) | طاقم الإدارة | **SECURITY_RISK (P0)** |
| 15 | `/admin/requests` | `app/admin/requests/page.tsx` | Client (CSR) | طاقم الإدارة | **FUNCTIONAL** |
| 16 | `/admin/training` | `app/admin/training/page.tsx` | Server (SSR) | إدارة التدريب | **UI_ONLY (Dead Button)** |
| 17 | `/admin/research` | `app/admin/research/page.tsx` | Server (SSR) | إدارة البحوث | **UI_ONLY (Dead Button)** |
| 18 | `/admin/messages` | `app/admin/messages/page.tsx` | Server (SSR) | الإدارة | **UI_ONLY (Read Only)** |
| 19 | `/admin/users` | `app/admin/users/page.tsx` | Server (SSR) | Super Admin | **UI_ONLY (Read Only)** |
| 20 | `/admin/settings` | `app/admin/settings/page.tsx` | Server (SSR) | Super Admin | **UI_ONLY (Read Only)** |
| 21 | `/admin/logs` | `app/admin/logs/page.tsx` | Server (SSR) | Super Admin | **UI_ONLY (Read Only)** |
| 22 | `/portal/client` | `app/portal/client/page.tsx` | Server (SSR) | العميل (Client) | **PARTIAL (Hardcoded metric)** |
| 23 | `/portal/client/requests` | `app/portal/client/requests/page.tsx` | Server (SSR) | العميل (Client) | **FUNCTIONAL** |
| 24 | `/portal/client/requests/[id]` | `app/portal/client/requests/[id]/page.tsx` | Server (SSR) | العميل (Client) | **SECURITY_RISK (IDOR P0)** |
| 25 | `/portal/client/reports` | `app/portal/client/reports/page.tsx` | Server (SSR) | العميل (Client) | **MOCK (Fake Alert)** |
| 26 | `/portal/client/profile` | `app/portal/client/profile/page.tsx` | Server (SSR) | العميل (Client) | **UI_ONLY (Read Only)** |
| 27 | `/portal/trainee` | `app/portal/trainee/page.tsx` | Server (SSR) | المتدرب (Trainee) | **PARTIAL** |
| 28 | `/portal/trainee/courses` | `app/portal/trainee/courses/page.tsx` | Server (SSR) | المتدرب (Trainee) | **MOCK (Fake Alert)** |
| 29 | `/portal/trainee/certificates` | `app/portal/trainee/certificates/page.tsx` | Server (SSR) | المتدرب (Trainee) | **FUNCTIONAL (Print View)** |
| 30 | `/portal/trainee/profile` | `app/portal/trainee/profile/page.tsx` | Server (SSR) | المتدرب (Trainee) | **UI_ONLY (Read Only)** |

---

## 7. Page Audit (التدقيق التفصيلي للصفحات)

### أ. صفحات الموقع العام:
* **`/` (الرئيسية):** مكون Server يقرأ فئات الخدمات والأبحاث من قاعدة البيانات. التبديل اللغوي فيها يعمل جزئياً (النصوص الثابتة). **الحالة: FUNCTIONAL**.
* **`/services` و `/services/[slug]`:** تعرض الخدمات وفئاتها ومميزاتها المخزنة في قاعدة البيانات. **الحالة: FUNCTIONAL**.
* **`/training`:** تعرض الدورات من قاعدة البيانات مع شروط القبول. زر «التقديم والالتحاق» هو مجرد `Link` ينقلك لصفحة الدخول مع redirect لـ `/portal/trainee`. **الحالة: PARTIAL**.
* **`/research` و `/research/[slug]`:** تعرض أوراق الموقف والدراسات وتسمح بقراءة تفاصيل البحث. **الحالة: FUNCTIONAL**.
* **`/contact`:** واجهة مراسلة ترسل طلب `POST` إلى `/api/contact` مع تسجيل الرسالة في جدول `ContactMessage`. **الحالة: FUNCTIONAL**.
* **`/request-service`:** معالج متعدد الحقول، يتكامل مع `/api/services` لجلب القائمة، ويقدم الطلب عبر `/api/requests` ويولد كود التتبع. **الحالة: FUNCTIONAL**.

### ب. صفحات المصادقة:
* **`/login`:** تسجل الدخول وتضبط كوكي الـ JWT. **مشكلة أمنية كبرى**: تحتوي على قسم الحسابات التجريبية السريعة التي تملأ بيانات الـ Super Admin بضغطة زر. **الحالة: SECURITY_RISK**.
* **`/register`:** تسجل أي مستخدم وتمنحه رتبة `CLIENT` أو `TRAINEE` مع `isActive: true` مباشرة ودون أي تحقق من البريد أو مراجعة إدارية. **الحالة: SECURITY_RISK**.

### ج. صفحات الإدارة (`/admin`):
* **`app/admin/layout.tsx`:** يحتوي حماية عميل فقط (`'use client'`).
* **`app/admin/page.tsx`:** يستدعي Prisma مباشرة في السيرفر لجلب الإحصائيات وأحدث الطلبات وسجل النشاط بدون أي تحقق من الجلسة في دالة الصفحة. **الحالة: SECURITY_RISK**.
* **`app/admin/requests/page.tsx`:** مكون عميل (`'use client'`) يستدعي `/api/requests` ويسمح بتحديث حالة الطلب وتعيين موظف وإضافة ملاحظات تشغيلية. **الحالة: FUNCTIONAL**.
* **`app/admin/training/page.tsx`:** جدول قراءة للدورات والمسجلين. زر إضافة برنامج تدريبي غير مرتبط بأي كود (`onClick={undefined}`). **الحالة: UI_ONLY**.
* **`app/admin/research/page.tsx`:** جدول قراءة للأبحاث. زر نشر دراسة جديدة لا يملك Handler إطلاقاً. **الحالة: UI_ONLY**.
* **`app/admin/messages/page.tsx`:** جدول قراءة لرسائل الاتصال الواردة. لا يوجد زر لتغيير الحالة إلى مقروء، ولا زر للرد، ولا زر للحذف. **الحالة: UI_ONLY**.
* **`app/admin/users/page.tsx`:** جدول قراءة لكافة المستخدمين في المنصة. لا يوجد زر لتعديل الصلاحية، ولا زر لتعطيل الحساب، ولا نموذج لإضافة مستخدم. **الحالة: UI_ONLY**.
* **`app/admin/settings/page.tsx`:** جدول يعرض الإعدادات المخزنة في جدول `SystemSetting`. لا توجد أي خانة إدخال أو زر حفظ، بل نص صريح يطلب تعديل البيانات من Prisma Studio! **الحالة: UI_ONLY**.
* **`app/admin/logs/page.tsx`:** جدول يعرض آخر 50 سجل نشاط. **الحالة: UI_ONLY**.

### د. بوابات الخدمة الذاتية:
* **`app/portal/client/page.tsx`:** بطاقة «التقارير السرية المتاحة» مكتوبة برقم ثابت **(Hardcoded "2")** في الكود البرمجي (السطر 73). **الحالة: PARTIAL / HARDCODED**.
* **`app/portal/client/requests/[id]/page.tsx`:** يعرض تفاصيل الطلب والملاحظات والمخطط الزمني. ولكن كود الحماية به ثغرة تتيح للمتدربين رؤية طلبات العملاء. **الحالة: SECURITY_RISK**.
* **`app/portal/client/reports/page.tsx`:** زر تحميل الـ PDF ينفذ `onClick={() => alert('جارٍ تجهيز وتحميل المستند الأمني المعتمد...')}`. **الحالة: MOCK**.
* **`app/portal/trainee/courses/page.tsx`:** زر تأكيد التسجيل ينفذ `onClick={() => alert('تم استلام طلب تسجيلكم...')}` دون استدعاء أي API. **الحالة: MOCK**.
* **`app/portal/trainee/certificates/page.tsx`:** يعرض شهادة التخرج الرسمية بتصميم فاخر مع زر طباعة المتصفح `window.print()`. **الحالة: FUNCTIONAL**.

---

## 8. Button / Action Audit (تدقيق الأزرار والإجراءات)

| الصفحة | اسم الزر / الإجراء | الملف والسطر | الوظيفة المفترضة | الواقع الفعلي | الحالة (Status) |
|---|---|---|---|---|---|
| `/admin/training` | إضافة برنامج تدريبي جديد | `training/page.tsx:36` | فتح نموذج إضافة دورة تدريبية | `onClick={undefined}` لا يفعل أي شيء مطلقاً | **BROKEN / NO_HANDLER** |
| `/admin/research` | نشر دراسة جديدة | `research/page.tsx:26` | فتح شاشة نشر بحث أمني | زر بدون أي حدث أو رابط أو Handler | **BROKEN / NO_HANDLER** |
| `/portal/client/reports` | تحميل PDF | `reports/page.tsx:65` | تنزيل التقرير الأمني بصيغة PDF | يظهر تنبيه متصفح وهمي `alert(...)` | **FAKE_SUCCESS / MOCK** |
| `/portal/trainee/courses` | تأكيد التسجيل الآن | `courses/page.tsx:65` | تسجيل المتدرب في الدورة بالـ DB | يظهر تنبيه متصفح وهمي `alert(...)` | **FAKE_SUCCESS / MOCK** |
| `/login` | أزرار الحسابات التجريبية السريعة | `login/page.tsx:142-171` | مساعدة المطور في البيئة المحلية | تملأ كلمات مرور الإدارة وتعمل على السيرفر الحي | **SECURITY_RISK (P0)** |
| `/admin/requests` | حفظ تحديث الطلب | `requests/page.tsx:100` | تحديث الحالة وإضافة ملاحظة | يرسل `PATCH` إلى `/api/requests/[id]` ويحدث DB | **FUNCTIONAL** |
| `/request-service` | إرسال طلب الخدمة | `request-service:92` | إنشاء طلب خدمة وتوليد كود | يرسل `POST` إلى `/api/requests` ويولد كود حقيقي | **FUNCTIONAL** |
| `/contact` | إرسال الرسالة الآن | `contact/page.tsx:37` | إرسال استفسار وحفظه بالـ DB | يرسل `POST` إلى `/api/contact` ويحفظ بالـ DB | **FUNCTIONAL** |
| `/portal/trainee/certificates` | طباعة الشهادة الرسمية | `certificates:116` | طباعة الشهادة الرسمية | ينفذ `window.print()` لطباعة الشهادة | **FUNCTIONAL** |
| `/admin/users` | أي زر للتعديل أو الحذف | `users/page.tsx` | تعديل رتبة أو تعطيل مستخدم | **لا يوجد أي زر في الصفحة** | **MISSING** |
| `/admin/settings` | زر حفظ التعديلات | `settings/page.tsx` | حفظ أرقام الهواتف والروابط | **لا يوجد أي زر أو نموذج حفظ** | **MISSING** |
| `/admin/messages` | وضع علامة مقروء / رد | `messages/page.tsx` | أرشفة أو رد على الرسالة | **لا يوجد أي زر في الصفحة** | **MISSING** |

---

## 9. Form Audit (تدقيق النماذج والمدخلات)

| النموذج | المسار | الحقول المطلوبة | التحقق من جهة العميل | التحقق من جهة الخادم | مكتبة التحقق | التخزين بالـ DB | CSRF / Rate Limit | الحالة (Status) |
|---|---|---|---|---|---|---|---|---|
| **تسجيل الدخول** | `/login` | `email`, `password` | `required` (HTML5) | يدوي (`if (!email)`) | لا توجد | يقرأ من `User` | غير محمي من التخمين | **PARTIAL** |
| **التسجيل الجديد** | `/register` | `fullName`, `email`, `password` | `required` (HTML5) | يدوي (`if (!email)`) | لا توجد | يكتب في `User` | لا توجد حماية سبام | **SECURITY_RISK** |
| **طلب الخدمة** | `/request-service` | 6 حقول أساسية | `required` (HTML5) | يدوي في `/api/requests` | لا توجد | `ServiceRequest` + Note | لا توجد حماية سبام | **FUNCTIONAL** |
| **نموذج الاتصال** | `/contact` | 4 حقول أساسية | `required` (HTML5) | يدوي في `/api/contact` | لا توجد | `ContactMessage` | لا توجد حماية سبام | **FUNCTIONAL** |
| **تعديل الطلبات** | `/admin/requests` | `status`, `note` | اختياري | يدوي في `PATCH` | لا توجد | `ServiceRequest` | محمي بـ Staff Auth | **FUNCTIONAL** |
| **إضافة دورة** | `/admin/training` | — | **النموذج غير موجود** | — | — | — | — | **MISSING** |
| **نشر بحث** | `/admin/research` | — | **النموذج غير موجود** | — | — | — | — | **MISSING** |
| **تعديل الإعدادات**| `/admin/settings` | — | **النموذج غير موجود** | — | — | — | — | **MISSING** |
| **تعديل المستخدم** | `/admin/users` | — | **النموذج غير موجود** | — | — | — | — | **MISSING** |

---

## 10. API Audit (تدقيق واجهات البرمجة الخلفية)

يحتوي النظام بالكامل على **8 مسارات API فقط**:

| الطريقة | الـ Endpoint | الملف | يتطلب مصادقة؟ | الأدوار المسموحة | التحقق من المدخلات | النماذج المتأثرة | فحص الملكية (Ownership) | Rate Limit | الحالة (Status) |
|---|---|---|---|---|---|---|---|---|---|
| `POST` | `/api/auth/login` | `api/auth/login/route.ts` | لا | للجميع | يدوي ضعيف | `User`, `ActivityLog` | N/A | لا يوجد ⚠️ | **FUNCTIONAL** |
| `POST` | `/api/auth/logout` | `api/auth/logout/route.ts` | لا | للجميع | لا يوجد | لا يوجد (يمسح الكوكي) | N/A | N/A | **FUNCTIONAL** |
| `GET` | `/api/auth/me` | `api/auth/me/route.ts` | نعم | المسجلين | فحص التوكن | `User` | يقرأ حسابه فقط | لا يوجد | **FUNCTIONAL** |
| `POST` | `/api/auth/register` | `api/auth/register/route.ts` | لا | للجميع | يدوي ضعيف | `User`, `ClientProfile`, `Log` | N/A | لا يوجد ⚠️ | **SECURITY_RISK** |
| `POST` | `/api/contact` | `api/contact/route.ts` | لا | للجميع | يدوي أساسي | `ContactMessage`, `Log` | N/A | لا يوجد ⚠️ | **FUNCTIONAL** |
| `GET` | `/api/services` | `api/services/route.ts` | لا | للجميع | لا يوجد | `Service` (قراءة فقط) | N/A | لا يوجد | **FUNCTIONAL** |
| `POST` | `/api/requests` | `api/requests/route.ts` | اختياري | للجميع والعملاء | يدوي أساسي | `ServiceRequest`, `Note`, `Log` | يربط بـ userId إن وجد | لا يوجد ⚠️ | **FUNCTIONAL** |
| `GET` | `/api/requests` | `api/requests/route.ts` | نعم | Staff + Client | فحص التوكن | `ServiceRequest` | العميل يرى طلباته فقط | لا يوجد | **FUNCTIONAL** |
| `GET` | `/api/requests/[id]` | `api/requests/[id]/route.ts` | نعم | Staff + Owner | فحص التوكن | `ServiceRequest`, `Notes` | العميل يرى طلبه فقط | لا يوجد | **FUNCTIONAL** |
| `PATCH`| `/api/requests/[id]` | `api/requests/[id]/route.ts` | نعم | Staff فقط | يدوي أساسي | `ServiceRequest`, `Note`, `Log` | محصور بمسؤولي الإدارة | لا يوجد | **FUNCTIONAL** |

### مسارات API مفقودة تماماً (Missing APIs):
* لا يوجد `/api/users` (لإدارة المستخدمين).
* لا يوجد `/api/courses` (لإنشاء أو التسجيل في الدورات).
* لا يوجد `/api/research` (لإدارة ونشر الأبحاث).
* لا يوجد `/api/settings` (لتحديث بيانات التواصل والإعدادات).
* لا يوجد `/api/messages` (لتحديث وتغيير حالة رسائل الاتصال).
* لا يوجد `/api/documents` (لرفع وتنزيل المستندات).
* لا يوجد `/api/certificates` (لإصدار الشهادات).

---

## 11. Database / Prisma Audit (تدقيق قاعدة البيانات والنماذج)

تم فحص النماذج الـ 19 في `prisma/schema.prisma`:

| النموذج (Model) | الغرض المفترض | العلاقات والقيود | الاستخدام الفعلي في الكود | التصنيف الفعلي |
|---|---|---|---|---|
| `User` | إدارة المستخدمين والجلسات | Unique Email, علاقة بالملفات | مستخدم في الدخول والتسجيل والإدارة | **ACTIVE** |
| `ClientProfile` | بيانات المنشأة التابعة للعميل | One-to-One مع User | يتم إنشاؤه عند التسجيل فقط | **PARTIAL** |
| `ServiceCategory` | تصنيفات الخدمات | Slug Unique | يُقرأ في واجهات الخدمات | **ACTIVE** |
| `Service` | تفاصيل الخدمات الـ 14 | Slug Unique, JSON fields | يُقرأ في واجهات الخدمات ونموذج الطلب | **ACTIVE (Read-Only)** |
| `ServiceRequest` | طلبات الخدمات الأمنية | Unique requestNumber, Foreign keys | مستخدم بالكامل (إنشاء، استعراض، تحديث) | **ACTIVE** |
| `ServiceRequestNote` | الملاحظات العملياتية للطلب | Foreign key to Request & Author | مستخدم بالكامل بين العميل والإدارة | **ACTIVE** |
| `ServiceRequestDocument` | وثائق وتقارير الطلبات | Foreign key to Request | **لا يوجد أي استدعاء في الكود (فقط بذر)** | **SCHEMA_ONLY** |
| `CourseCategory` | تصنيفات برامج التدريب | Slug Unique | يُقرأ في واجهات التدريب | **ACTIVE (Read-Only)** |
| `Course` | الدورات التدريبية | Slug Unique, Status Enum | يُقرأ في التدريب وبوابة المتدرب | **ACTIVE (Read-Only)** |
| `TrainingRegistration` | تسجيل المتدربين بالدورات | Foreign keys to Course & User | يُقرأ في الإدارة وبوابة المتدرب؛ لا يوجد إنشاء | **PARTIAL (Seed Only)** |
| `AttendanceRecord` | سجل حضور وغياب المتدرب | Foreign key to Registration | يُقرأ في بوابة المتدرب؛ لا توجد آلية تسجيل | **PARTIAL (Seed Only)** |
| `Certificate` | الشهادات الرقمية المعتمدة | Unique Number & VerificationCode | يُقرأ في بوابة المتدرب؛ لا توجد آلية إصدار | **PARTIAL (Seed Only)** |
| `ResearchCategory` | تصنيفات الدراسات والبحوث | Slug Unique | يُقرأ في واجهات الأبحاث | **ACTIVE (Read-Only)** |
| `ResearchPublication` | الدراسات وأوراق السياسات | Slug Unique, Visibility Enum | يُقرأ في الأبحاث؛ لا توجد واجهة نشر | **ACTIVE (Read-Only)** |
| `NewsArticle` | الأخبار والبيانات الصحفية | Slug Unique | **غير مستخدم في أي صفحة أو API على الإطلاق** | **UNUSED / SCHEMA_ONLY** |
| `ContactMessage` | رسائل واستفسارات الجمهور | Status Enum | يتم إنشاؤه من `/contact` ويُعرض بالإدارة | **ACTIVE** |
| `Notification` | الإشعارات والتنبيهات | Foreign key to User | يتم إنشاؤه عند تغيير الطلب ويُعرض للعميل | **ACTIVE** |
| `SystemSetting` | إعدادات النظام وأرقام الاتصال | Unique Key | يتم قراءته في صفحة الإعدادات فقط | **PARTIAL (Read-Only)** |
| `ActivityLog` | سجل التدقيق والرقابة الإدارية | Timestamps, Indexed | يتم الكتابة فيه عند الدخول والطلبات ويُعرض | **ACTIVE** |

---

## 12. Authentication Audit (تدقيق نظام المصادقة)

1. **تشفير كلمات المرور:** يتم عبر مكتبة `bcryptjs` بمعدل `10 rounds` وهو إجراء قياسي سليم.
2. **إدارة الجلسات:** يتم إنشاء رموز `JWT` مشفرة بواسطة خوارزمية `HS256` عبر مكتبة `jose`.
3. **حفظ الرمز:** يتم تخزين التوكن في كوكي باسم `facss_session_token` مع تفعيل `httpOnly: true` و `sameSite: 'lax'`.
4. **مدة صلاحية الرمز:** محددة بـ **7 أيام كاملة (`7d`)**.
5. **النقاط الأمنية الحرجة المكتشفة:**
   * **مفتاح سري احتياطي مكشوف داخل الكود (Hardcoded Fallback Secret):**  
     الملف: `lib/auth.ts:7`  
     الكود: `process.env.AUTH_SECRET || 'facss-aden-security-platform-dev-secret-key-2026-min-32-chars'`  
     الخطر: في حال فشل قراءة متغير البيئة على أي سيرفر، يستخدم النظام هذا المفتاح المكشوف علناً، مما يسمح لأي مهاجم بتزوير توكنات JWT لأي مستخدم أو مدير!
   * **انعدام القدرة على إبطال الجلسات (No Revocation / Stateless JWT):**  
     دالة `getCurrentUser()` في `lib/auth.ts` تكتفي بالتحقق الرياضي من التوكن دون مراجعة قاعدة البيانات للتأكد هل المستخدم ما زال `isActive: true` أم تم إيقافه أو حذفه! وبالتالي، يظل المستخدم الموقوف قادراً على الوصول للنظام حتى انتهاء الـ 7 أيام!
   * **غياب تام لآلية استعادة كلمة المرور (No Password Reset):** لا توجد شاشة أو API لـ "نسيت كلمة المرور".
   * **غياب التحقق من البريد الإلكتروني (No Email Verification):** يستطيع أي شخص التسجيل بأي بريد إلكتروني وهمي دون تفعيل.

---

## 13. Authorization / RBAC Audit (تدقيق الصلاحيات والأدوار)

### مصفوفة الصلاحيات المفترضة مقابل الواقع الفعلي في الكود:

| الميزة / الصلاحية | Super Admin | Manager | Client | Trainee | Anonymous | آلية الحماية المطبقة في الكود |
|---|---|---|---|---|---|---|
| **تصفح الموقع العام** | متاح | متاح | متاح | متاح | متاح | عام |
| **تقديم طلب خدمة** | متاح | متاح | متاح | متاح | متاح | عام |
| **لوحة مؤشرات الإدارة `/admin`** | متاح | متاح | **محجوب بالواجهة فقط ⚠️** | **محجوب بالواجهة فقط ⚠️** | **محجوب بالواجهة فقط ⚠️** | Client Layout (`useAuth`) فقط — الـ SSR يسرب البيانات! |
| **تعديل طلبات الخدمات** | متاح | متاح | محجوب | محجوب | محجوب | محمي داخل `api/requests/[id]` (`PATCH`) |
| **استعراض مستخدمي النظام** | متاح | متاح | محجوب بالواجهة | محجوب بالواجهة | **الـ SSR يسرب البيانات ⚠️** | لا توجد حماية على مستوى الخادم في `admin/users` |
| **بوابة العميل `/portal/client`**| متاح | متاح | متاح | **يمكنه الدخول ⚠️** | محجوب بالواجهة | `if (!user)` لا يتحقق من نوع الرتبة! |
| **الاطلاع على تفاصيل طلب عميل** | متاح | متاح | طلبه فقط | **يستطيع رؤيته ⚠️** | محجوب | ثغرة في `requests/[id]/page.tsx:52` تسمح للمتدرب! |
| **بوابة المتدرب `/portal/trainee`**| متاح | متاح | يمكنه الدخول | متاح | محجوب بالواجهة | `if (!user)` لا يتحقق من نوع الرتبة! |

---

## 14. Admin Security Audit (تدقيق أمان لوحة الإدارة)

* **مستوى الخطورة:** **CRITICAL (P0)**
* **المشكلة:**
  جميع صفحات مجلد `/admin`:
  * `app/admin/page.tsx`
  * `app/admin/users/page.tsx`
  * `app/admin/settings/page.tsx`
  * `app/admin/training/page.tsx`
  * `app/admin/research/page.tsx`
  * `app/admin/messages/page.tsx`
  * `app/admin/logs/page.tsx`
  هي عبارة عن **مكونات خادم (Server Components)** تستدعي `prisma.*.findMany()` مباشرة قبل أي تحقق من الجلسة أو الرتبة!
* **الدليل:**
  في `app/admin/layout.tsx`، الحماية مطبقة بـ `'use client'` عبر `if (!isStaff) return ...`.
  في معمارية Next.js App Router، عندما يُطلب المسار `/admin` عبر طلب HTTP عادي أو عبر RSC Stream (`/admin?_rsc=...`)، يُنفذ السيرفر مكون الصفحة أولاً، ويجلب كافة سجلات المستخدمين وهواتفهم والرسائل والطلبات من PostgreSQL ويضعها في تيار البيانات، ثم يُرسلها للمتصفح.
* **الأثر:**
  أي زائر أو أداة آلية (مثل `curl`) تستطيع استخراج كافة بيانات لوحة الإدارة دون تسجيل الدخول بمجرد قراءة الـ RSC Stream أو كود الصفحة الأولي.

---

## 15. Client Portal Audit (تدقيق بوابة العملاء)

1. **تسجيل الدخول وعرض الطلبات:** يعمل بشكل سليم ويرتبط بـ `userId`.
2. **متابعة تفاصيل الطلب (`/portal/client/requests/[id]`):** المخطط الزمني والملاحظات التشغيلية تعمل بامتياز.
3. **الملف الشخصي (`/portal/client/profile`):** عرض فقط (Read-Only)؛ لا يمكن تعديل بيانات المنشأة أو كلمة المرور أو الهاتف.
4. **التقارير السرية (`/portal/client/reports`):**
   * بطاقة «التقارير السرية المتاحة» في الواجهة الرئيسية hardcoded بالقيمة `2`.
   * زر «تحميل PDF» لا يُحمل أي ملف حقيقي بل يُظهر `alert()`.

---

## 16. Trainee Portal Audit (تدقيق بوابة المتدربين)

1. **عرض الدورات النشطة والشهادات:** يعمل للمتدرب المسجل مسبقاً في قاعدة البيانات.
2. **طباعة الشهادة الرسمية:** تعمل بشكل ممتاز عبر `window.print()` بتصميم الشهادة الرسمي والختم ورمز التحقق.
3. **التسجيل في دورة تدريبية جديدة (`/portal/trainee/courses`):**
   * الضغط على «تأكيد التسجيل الآن» يُطلق تنبيه `alert()` وهمي دون حفظ أي سجل بالـ DB ودون وجود API للتسجيل.
4. **الملف الشخصي للمتدرب:** عرض فقط بدون إمكانية التحديث.

---

## 17. Service Request Workflow (دورة عمل طلبات الخدمات)

```
[مستخدم/عميل] ---> [نموذج /request-service] ---> [POST /api/requests]
                                                        |
                                                        v
                                          [توليد كود: FACSS-SR-2026-XXXXXX]
                                                        |
                                                        v
                                    [حفظ بالـ DB + إنشاء ServiceRequestNote]
                                                        |
                                                        v
[لوحة الإدارة /admin/requests] <--- [ظهور الطلب فوراً وتحديث الحالة PATCH]
                                                        |
                                                        v
[بوابة العميل /portal/client/requests/[id]] <--- [ظهور الملاحظة وتغير العداد]
```
* **الحالة:** **FUNCTIONAL** (متصلة وتعمل بنجاح بين العميل والإدارة).
* **النواقص الأمنية والوظيفية:**
  1. كود التتبع يولد رقماً عشوائياً من 6 خانات (`Math.random()`) دون فحص التكرار، مما قد يسبب خطأ تصادم (P2002 Collision) عند زيادة الطلبات.
  2. لا توجد أي واجهة أو إمكانية لإرفاق ملفات أو مستندات مع الطلب.

---

## 18. Contact Workflow (دورة عمل رسائل الاتصال)

* **الحالة:** **PARTIAL**.
* **الواقع الفعلي:**
  1. يقوم الزائر بتعبئة النموذج في `/contact`.
  2. يرسل الطلب إلى `/api/contact`.
  3. يتم التحقق اليدوي البسيط وحفظ الرسالة في جدول `ContactMessage` بحالة `UNREAD`.
  4. تظهر الرسالة في جدول لوحة الإدارة `/admin/messages`.
  5. **أين يتوقف النظام؟** يتوقف عند عرض الرسالة في الجدول! لا يوجد خيار لتغيير حالة الرسالة إلى "تمت القراءة"، ولا يوجد خيار للرد عليها، ولا يوجد إرسال بريد إلكتروني تنبيهي للإدارة.

---

## 19. Training Workflow (دورة عمل قطاع التدريب)

* **الحالة:** **PARTIAL / MOCK**.
* **الواقع الفعلي:**
  1. استعراض الدورات في الموقع العام وبوابة المتدرب: يعمل (قراءة من الـ DB).
  2. تقديم المتدرب على دورة: **معطل وهمي (`alert()`)**.
  3. مراجعة وقبول/رفض المتدربين من الإدارة: **غير موجود**.
  4. تسجيل حضور الجلسات التدريبية: **غير موجود (قراءة للسجل المبذور فقط)**.
  5. إصدار شهادة تدريبية جديدة: **غير موجود (قراءة للشهادة المبذورة فقط)**.
  6. إضافة دورة تدريبية جديدة: **زر معطل (`onClick={undefined}`)**.

---

## 20. Research / News CMS (نظام إدارة الأبحاث والأخبار)

* **الحالة:** **UI_ONLY / MISSING**.
* **الواقع الفعلي:**
  * **الأبحاث:** الواجهة العامة تعرض الأبحاث وتفاصيلها من الـ DB بشكل سليم. أما في لوحة الإدارة، فالصفحة تقتصر على جدول قراءة فقط، وزر «نشر دراسة جديدة» لا يملك أي Handler ولا يوجد نموذج نشر أو رفع PDF.
  * **الأخبار (NewsArticle):** يوجد جدول في قاعدة البيانات وسجلات مبذورة في `seed.js`، ولكن **لا توجد صفحة أخبار عامة، ولا صفحة إدارة أخبار، ولا API للأخبار إطلاقاً**.

---

## 21. Services CMS (نظام إدارة الخدمات)

* **الحالة:** **MISSING**.
* **الواقع الفعلي:**
  الخدمات والأنظمة الـ 14 تُقرأ من قاعدة البيانات وتُعرض في الموقع العام ونموذج الطلبات، لكن **لا توجد لوحة إدارة للخدمات إطلاقاً داخل `/admin`**، ومسار `/api/services` يدعم طريقة `GET` فقط. أي إضافة أو تعديل في الخدمات يجب أن يتم يدوياً على قاعدة البيانات.

---

## 22. Users Management (نظام إدارة المستخدمين)

* **الحالة:** **UI_ONLY**.
* **الواقع الفعلي:**
  صفحة `/admin/users` تحتوي على جدول يعرض المستخدمين المسجلين في جدول `User`. لا يستطيع المدير العام:
  * إنشاء مستخدم جديد.
  * تعديل رتبة مستخدم (Promotion / Demotion).
  * تفعيل أو تعطيل مستخدم (`isActive`).
  * إعادة تعيين كلمة المرور.
  * حذف مستخدم.
  ولا يوجد مسار `/api/users` في النظام.

---

## 23. Settings Audit (تدقيق شاشة الإعدادات)

* **الحالة:** **UI_ONLY**.
* **الواقع الفعلي:**
  صفحة `/admin/settings` تعرض ما تم بذره في جدول `SystemSetting`، ولا توجد أي خانة إدخال (Input) أو زر حفظ، بل تنص الملاحظة في أسفل الصفحة على: *"يمكنك تحديث أي قيمة من خلال واجهة Prisma Studio أو تشغيل أمر التحديث المباشر"*. وبالتالي فالشاشة لا تؤدي أي وظيفة تحكم حقيقية.

---

## 24. Documents / File Storage (إدارة وتخزين الملفات)

* **الحالة:** **SCHEMA_ONLY**.
* **الواقع الفعلي:**
  على الرغم من وجود نماذج `ServiceRequestDocument` في الـ Schema وحقول `pdfPath` و `coverImage`، لا يوجد في كامل المشروع:
  * أي مسار لرفع الملفات (Upload Endpoint).
  * أي فحص لنوع الملف (MIME Type) أو حجمه.
  * أي مكتبة تخزين سحابي (S3 / R2) أو مسار حفظ محلي نشط.
  * أي مسار لتنزيل الملفات المحمية بتصريح أمني.

---

## 25. Notifications (نظام الإشعارات)

* **الحالة:** **PARTIAL (In-App DB Only)**.
* **الواقع الفعلي:**
  يقتصر على إنشاء سجل في جدول `Notification` عند إنشاء أو تعديل طلب خدمة، وعرضها في بطاقة إشعارات بوابة العميل.
  * لا توجد آلية لتحديث الإشعار كـ "مقروء" (`isRead: true`).
  * لا يوجد إرسال فعلي لأي رسائل بريد إلكتروني (SMTP غير مفعل).
  * لا يوجد إرسال لرسائل SMS أو WhatsApp.

---

## 26. Security Findings (سجل الثغرات والمخاطر الأمنية)

### 🔴 ثغرات من الدرجة الحرجة (P0 — Critical):
1. **P0-1: بيانات الدخول السرية معروضة علناً في شاشة الدخول الحية (`/login`).**
   * **الملف:** `app/login/page.tsx` (السطور 133-176).
   * **الدليل:** أزرار `quickFill` مكشوفة للمدير العام (`Admin@FACSS2026`)، ومدير العمليات، والعميل، والمتدرب.
   * **الأثر:** أي شخص على الإنترنت يستطيع الضغط على زر "Super Admin" واختراق المنصة بالكامل في ثانية واحدة.
2. **P0-2: انعدام التفويض على مستوى الخادم في صفحات الإدارة (`/admin/*`).**
   * **الملف:** كافة صفحات `app/admin/*.tsx`.
   * **الدليل:** مكونات خادم تستعلم من Prisma مباشرة بدون التحقق من Session/Role قبل الاستعلام؛ الحماية مقتصرة على `app/admin/layout.tsx` من جانب العميل فقط.
   * **الأثر:** تسريب بيانات المستخدمين وسجلات النشاط ورسائل التواصل لأي طلب خارجي عبر RSC Payload دون الحاجة للدخول.
3. **P0-3: ثغرة تجاوز صلاحيات والاطلاع على طلبات العملاء (IDOR / Broken Object-Level Auth).**
   * **الملف:** `app/portal/client/requests/[id]/page.tsx` (السطر 52).
   * **الدليل:** كود الفحص `if (req.userId !== session.userId && session.role === 'CLIENT')` يفترض أن من ليس عميلاً هو من الإدارة، مما يتيح لحسابات المتدربين (`TRAINEE`) الاطلاع على كافة طلبات وبيانات العملاء بمجرد تغيير الـ ID في الرابط.

### 🟠 ثغرات ومخاطر عالية (P1 — High):
4. **P1-1: فتح التسجيل العام برتبة عميل دون مراجعة أو تفعيل بريد (`/register`).**
   * **الملف:** `app/api/auth/register/route.ts` (السطر 40: `isActive: true`).
   * **الأثر:** إنشاء حسابات عملاء معتمدة تلقائياً دون تدقيق الهوية لمركز أمني حساس.
5. **P1-2: وجود مفتاح سري احتياطي مكشوف في الكود (Hardcoded Secret Fallback).**
   * **الملف:** `lib/auth.ts:7`.
   * **الأثر:** إمكانية توقيع توكنات JWT مزورة بصلاحيات Super Admin في حال عدم قراءة متغير البيئة.
6. **P1-3: انعدام إمكانية إبطال جلسات المستخدمين الموقوفين (No Session Invalidation).**
   * **الملف:** `lib/auth.ts:46`.
   * **الأثر:** يستمر التوكن بالعمل لمدة 7 أيام حتى لو قام المسؤول بتعطيل حساب المستخدم في قاعدة البيانات.
7. **P1-4: غياب حماية الـ Rate Limiting ومكافحة التخمين (Brute-Force & Anti-Spam).**
   * **الملفات:** `/api/auth/login`, `/api/auth/register`, `/api/contact`, `/api/requests`.
   * **الأثر:** إمكانية تخمين كلمات المرور وإغراق النظام بطلبات ورسائل وهمية بدون قيود.
8. **P1-5: غياب ملف الـ Middleware على مستوى التطبيق (No Edge Middleware).**
   * **الأثر:** ترك حماية الروابط موزعة بشكل غير مركزي ومعرضة للسهو والخطأ البشري.
9. **P1-6: خطر تصادم كود التتبع وفشل حفظ الطلب (Collision Risk).**
   * **الملف:** `app/api/requests/route.ts:28`.
   * **الأثر:** توليد رقم عشوائي بـ `Math.random()` دون حلقة تأكد أو معالجة لخطأ P2002.

---

## 27. Demo / Hardcoded Findings (البيانات الثابتة والسلوكيات الصورية)

1. **رقم التقارير السرية الثابت:** في `app/portal/client/page.tsx:73` الرقم معروض بشكل يدوي ثابت (`2`) وليس استعلاماً من قاعدة البيانات.
2. **أزرار التنبيه الصوري (Mock Alerts):**
   * `app/portal/client/reports/page.tsx:65`: `onClick={() => alert('...')}`.
   * `app/portal/trainee/courses/page.tsx:65`: `onClick={() => alert('...')}`.
3. **أزرار بدون أي كود (Dead Buttons):**
   * `app/admin/training/page.tsx:36`: `onClick={undefined}`.
   * `app/admin/research/page.tsx:26`: زر بدون حدث إطلاقاً.
4. **شاشة الإعدادات الصورية:** `app/admin/settings/page.tsx` لا تحتوي على خيارات تعديل فعلية.

---

## 28. UI/UX Functional Findings (التقييم الوظيفي للواجهات)

* **التصميم البصري:** متميز جداً وفاخر، الألوان متناسقة، الخطوط منسقة بامتياز، والتجاوب مع الموبايل ممتاز.
* **العيوب الوظيفية:**
  * وجود أزرار تفاعلية تعطي انطباعاً بأنها ستفتح نافذة بينما هي ميتة تماماً.
  * غياب مؤشرات التحميل (Loading Skeletons) في بعض الصفحات التي تستدعي APIs.
  * غياب إمكانية تعديل الملف الشخصي للعميل والمتدرب.
  * غياب شاشات 404 مخصصة لمسارات الخدمات أو الأبحاث غير الموجودة (تستخدم الافتراضي).

---

## 29. Bilingual / RTL Review (تدقيق ثنائية اللغة)

* **التقييم الفعلي:** **PARTIAL (جزئي وغير مكتمل)**.
* **الواقع:**
  * الهيدر والفوتر والصفحة الرئيسية وصفحة "عن المركز" تدعم التبديل اللغوي بنجاح.
  * **أكثر من 75% من صفحات المنصة (الخدمات، التدريب، الأبحاث، منهجية العمل، كافة صفحات لوحة الإدارة الـ 8، كافة صفحات بوابة العملاء، وكافة صفحات بوابة المتدربين) مكتوبة بنصوص عربية ثابتة Hardcoded**.
  * عند الضغط على زر التبديل إلى English، يتغير اتجاه الصفحة إلى (LTR)، لكن تظل العناوين والنصوص والجداول باللغة العربية!

---

## 30. Performance Findings (تدقيق الأداء والاستعلامات)

* **نقاط القوة:**
  * توليد الصفحات الثابتة سريع جداً (SSR خفيف).
  * تم إنشاء الفهارس (Indexes) المناسبة في مخطط Prisma للـ Foreign Keys والـ Slugs.
* **الملاحظات:**
  * غياب الترقيم (Pagination) في جداول الإدارة (`AdminLogsPage` يجلب 50 سجلاً ثابتاً، وطلبات العملاء تجلب كافة السجلات دفعة واحدة بدون Pagination).
  * لا توجد مشكلة N+1 ظاهرة لاعتماد الكود على `include` المدمج في Prisma.

---

## 31. Documentation Claim vs Reality (مقارنة وثائق التسليم بالواقع الفعلي)

| الادعاء في التوثيق السابق | الواقع البرمجي الفعلي في الكود | مستوى التباين (Severity) |
|---|---|---|
| *"منصة CMS متكاملة لإدارة المحتوى والأبحاث"* | لوحة الأبحاث جدول عرض فقط، والزر ميت ولا توجد أي API للنشر أو التعديل | **تباين حاد (High)** |
| *"بوابة متدربين متكاملة للتسجيل في الدورات وإصدار الشهادات"* | التسجيل مجرد `alert()` وهمي، ولا توجد آلية للموافقة أو إصدار الشهادات | **تباين حاد (High)** |
| *"مستودع التقارير والمستندات السرية للعملاء"* | زر التحميل مجرد `alert()` وهمي ولا يوجد تخزين ملفات في النظام | **تباين حاد (High)** |
| *"لوحة تحكم كاملة بالمستخدمين وصلاحيات RBAC"* | جدول عرض فقط، لا يمكن تعديل دور أو تفعيل أو تعطيل أي مستخدم | **تباين حاد (High)** |
| *"محرر إعدادات المنصة وأرقام التواصل بدون مبرمج"* | صفحة عرض فقط تطلب تعديل البيانات يدوياً من Prisma Studio | **تباين حاد (High)** |
| *"نظام إشعارات للعملاء"* | إنشاء سجل في الـ DB فقط دون إمكانية تحديث القراءة وصفر إرسال بريد/SMS | **تباين متوسط (Medium)** |
| *"دعم كامل ثنائي اللغة عربي/إنجليزي"* | الأقسام المترجمة أقل من 30%، وأغلب البوابات والإدارة عربية فقط | **تباين متوسط (Medium)** |

---

## 32. Build / Test Results (نتائج البناء والاختبارات)

* **نتيجة الفحص المصدري (TypeScript):**
  * الأمر: `npx tsc --noEmit`
  * النتيجة: **Exit code: 0 (خالٍ من الأخطاء البرمجية النحوية)**.
* **نتيجة بناء الإنتاج (Next.js Build):**
  * الأمر: `npm run build`
  * النتيجة: **نجح البناء (37/37 صفحة ومسار)**.
* **الاختبارات المؤتمتة (Automated Tests):**
  * النتيجة: **صفر اختبارات (لا توجد اختبارات وحدة أو تكامل أو أمان في المشروع)**.

---

## 33. Completeness Matrix (مصفوفة الاكتمال الشاملة للمنظومة)

| الموديول (Module) | الواجهة (UI) | الـ API | قاعدة البيانات (DB) | المصادقة (Auth) | التفويض (RBAC) | التحقق (Validation) | اكتمال الدورة (Workflow) | الحالة النهائية |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **الموقع العام** | مكتمل | N/A | مكتمل | N/A | N/A | N/A | مكتمل | **FUNCTIONAL** |
| **المصادقة والتسجيل** | مكتمل | مكتمل | مكتمل | مكتمل | جزئي | ضعيف | مكتمل | **PARTIAL / RISK** |
| **طلبات الخدمات** | مكتمل | مكتمل | مكتمل | مكتمل | مكتمل | يدوي | مكتمل | **FUNCTIONAL** |
| **رسائل الاتصال** | مكتمل | مكتمل | مكتمل | N/A | N/A | يدوي | نصف مكتمل | **PARTIAL** |
| **بوابة العملاء** | مكتمل | جزئي | مكتمل | مكتمل | به ثغرة | يدوي | نصف مكتمل | **PARTIAL** |
| **بوابة المتدربين** | مكتمل | مفقود | مكتمل | مكتمل | به ثغرة | N/A | صوري/ناقص | **MOCK / PARTIAL** |
| **لوحة إدارة الطلبات** | مكتمل | مكتمل | مكتمل | مكتمل | مكتمل | يدوي | مكتمل | **FUNCTIONAL** |
| **إدارة التدريب والدورات**| جدول فقط | مفقود | مكتمل | مفقود بالـ SSR | مفقود | N/A | معطل | **UI_ONLY / BROKEN** |
| **إدارة الأبحاث** | جدول فقط | مفقود | مكتمل | مفقود بالـ SSR | مفقود | N/A | معطل | **UI_ONLY / BROKEN** |
| **إدارة المستخدمين** | جدول فقط | مفقود | مكتمل | مفقود بالـ SSR | مفقود | N/A | معطل | **UI_ONLY** |
| **إدارة الإعدادات** | جدول فقط | مفقود | مكتمل | مفقود بالـ SSR | مفقود | N/A | معطل | **UI_ONLY** |
| **إدارة الخدمات** | غير موجود | مفقود | مكتمل | مفقود | مفقود | N/A | غير موجود | **MISSING** |
| **إدارة الأخبار** | غير موجود | مفقود | مكتمل | مفقود | مفقود | N/A | غير موجود | **MISSING** |
| **الملفات والتقارير** | شكل أزرار | مفقود | مكتمل | مفقود | مفقود | N/A | صوري | **SCHEMA_ONLY / MOCK** |
| **سجل الرقابة (Logs)** | مكتمل | مفقود | مكتمل | مفقود بالـ SSR | مفقود | N/A | قراءة فقط | **PARTIAL** |

---

## 34. P0 Issues (المشكلات الحرجة ذات الأولوية القصوى)

1. **[P0-01] بيانات الدخول السرية وحساب الإدارة معروض علناً في `/login`:**  
   يجب إزالة أزرار الـ Quick Demo فوراً من كود الواجهة.
2. **[P0-02] تسريب بيانات لوحة الإدارة في الـ Server-Side Rendering:**  
   يجب تطبيق فحص الجلسة والرتبة داخل الـ Server Components أو تحويلها لحماية Edge Middleware قبل استدعاء Prisma.
3. **[P0-03] ثغرة IDOR في مسار `/portal/client/requests/[id]` تتيح للمتدربين اختراق بيانات العملاء:**  
   يجب تعديل شرط الصلاحية ليتأكد صراحة أن غير موظفي الإدارة لا يملكون الحق إلا إذا طابق `req.userId === session.userId`.

---

## 35. P1 Issues (المشكلات العالية ذات الأولوية المرتفعة)

4. **[P1-01] التسجيل المفتوح يمنح حساب عميل مفعل فوراً (`isActive: true`):**  
   يجب جعل حساب العميل الجديد بحالة انتظار الاعتماد الإداري (`PENDING_APPROVAL`).
5. **[P1-02] وجود المفتاح السري الاحتياطي الصريح في كود `lib/auth.ts`:**  
   يجب فرض وجود متغير البيئة `process.env.AUTH_SECRET` ورمي استثناء في حال غيابه.
6. **[P1-03] عدم التحقق من حالة المستخدم بالـ DB في توكنات الـ JWT:**  
   يجب جعل فحص التوكن يستعلم عن حالة المستخدم لمنع استخدام التوكنات للحسابات المعطلة.
7. **[P1-04] غياب حماية الـ Rate Limiting في مسارات الدخول والتسجيل والمراسلة:**  
   يجب إضافة حماية محاولات التخمين لمنع الهجمات الموجهة.
8. **[P1-05] غياب ملف `middleware.ts` المركزي في مسار المشروع:**  
   يجب بناء Middleware يحمي مسارات `/admin/*` و `/portal/*` على مستوى الـ Edge.
9. **[P1-06] احتمالية تصادم كود التتبع الفريد لطلبات الخدمة:**  
   يجب وضع آلية تكرار أو تسلسل لضمان عدم حدوث خطأ P2002.

---

## 36. P2 Issues (المشكلات المتوسطة)

10. **[P2-01] زر «نشر دراسة جديدة» وزر «إضافة برنامج تدريبي» معطلان بالكامل.**
11. **[P2-02] زر «تأكيد التسجيل في الدورة» وزر «تحميل PDF» يستدعيان `alert()` وهمي.**
12. **[P2-03] غياب واجهات وبرمجيات إدارة المستخدمين (تعديل رتبة، تعطيل حساب).**
13. **[P2-04] غياب نموذج تعديل وحفظ إعدادات النظام وأرقام الاتصال.**
14. **[P2-05] غياب دورة حياة رسائل التواصل (تحديد كمقروء، أرشفة، رد).**
15. **[P2-06] غياب منظومة رفع وتنزيل الملفات والمستندات الحقيقية.**
16. **[P2-07] غياب منظومة إدارة الخدمات والأخبار بالكامل.**
17. **[P2-08] عدم وجود ترقيم للصفحات (Pagination) في الجداول الإدارية.**
18. **[P2-09] عدم إمكانية تعديل الملف الشخصي للعميل أو المتدرب وتغيير كلمة المرور.**
19. **[P2-10] الإشعارات لا يمكن وسمها كمقروءة.**
20. **[P2-11] نقص الترجمة الإنجليزية في أكثر من 70% من المنصة.**
21. **[P2-12] رقم التقارير السرية الثابت `2` في بوابة العميل.**

---

## 37. P3 Issues (التحسينات والتنقيح البسيط)

22. **[P3-01] تصميم شاشة 404 مخصصة متوافقة مع الهوية الأمنية للمركز.**
23. **[P3-02] إضافة مؤشرات تحميل هيكلية (Loading Skeletons) في الجداول.**
24. **[P3-03] تحسين تباين بعض النصوص الرمادية الداكنة لتحقيق معايير النفاذية (a11y).**
25. **[P3-04] توحيد تنسيق التواريخ بالميلادي والهجري والإنجليزية.**
26. **[P3-05] إضافة إمكانية البحث والفلترة في جدول رسائل التواصل.**
27. **[P3-06] إضافة حقول الـ Meta Tags الخاصة بـ SEO في صفحات الأبحاث والخدمات.**
28. **[P3-07] تنظيف الكود من بقايا الاستيرادات غير المستخدمة.**
29. **[P3-08] إضافة شريط تقدم للمتدرب في الدورات الجارية.**
30. **[P3-09] تعريب رسائل الأخطاء القادمة من الـ Server في مسار التسجيل.**

---

## 38. Recommended Roadmap (خارطة الطريق المقترحة للإصلاح الشامل)

```
[المرحلة 1: التدريع الأمني الحرج] ---> [المرحلة 2: تصحيح المسارات المعطلة] ---> [المرحلة 3: بناء لوحات التحكم الفعلية] ---> [المرحلة 4: منظومة الملفات والربط الخارجي]
         (P0 & P1)                             (P2 Workflows)                           (CMS & RBAC)                          (Storage & Comms)
```

* **المرحلة الأولى: التدريع الأمني الحرج وسد الثغرات (Security Hardening):**
  * إزالة أزرار الحسابات التجريبية من صفحة `/login`.
  * بناء `middleware.ts` مركزي للتحقق من التوكن والرتبة قبل وصول أي طلب لـ `/admin` أو `/portal`.
  * إضافة التحقق الأمني داخل Server Components في صفحات الإدارة وبوابة العميل.
  * سد ثغرة الـ IDOR في `requests/[id]/page.tsx`.
  * إيقاف المفتاح السري الاحتياطي وفرض التحقق من `isActive` بالـ DB.
* **المرحلة الثانية: تصحيح المسارات المعطلة والسلوكيات الصورية (Fix Broken Workflows):**
  * استبدال `alert()` في تسجيل الدورات بنموذج حقيقي يكتب في جدول `TrainingRegistration`.
  * ربط زر إضافة الدورة وزر نشر البحث بنماذج منبثقة (Modals) تستدعي APIs حقيقية.
  * ربط إجراءات رسائل التواصل (وضع علامة مقروء وأرشفة).
* **المرحلة الثالثة: استكمال أنظمة الإدارة والتحكم (Full CMS & Administration):**
  * بناء واجهة إدارة المستخدمين (تعديل الرتب، إيقاف الحساب، حذف).
  * بناء نموذج حفظ الإعدادات وأرقام الاتصال وربطها بالموقع العام لحظياً.
  * استكمال التعريب الإنجليزي لكافة البوابات.
* **المرحلة الرابعة: منظومة إدارة الملفات والاتصالات (Storage & Integrations):**
  * برمجة محرك رفع الملفات وتوليد روابط تحميل آمنة للتقارير السرية والشهادات.
  * تفعيل خدمة الـ SMTP لإرسال الإشعارات البريدية الحقيقية.

---

## 39. Exact Recommended First Implementation Phase (المرحلة التنفيذية الأولى الموصى بها تحديداً)

يجب البدء حصراً بـ **حزمة الإغلاق الأمني الطارئ (Emergency Security Fixes)** قبل أي ميزة برمجية جديدة:

1. **الهدف:** القضاء على كافة ثغرات P0 و P1 ومنع تسريب بيانات النظام أو الاستيلاء عليه.
2. **الملفات المستهدفة تحديداً:**
   * `app/login/page.tsx`: حذف السطور 133-176 نهائياً (إزالة أزرار الحسابات التجريبية).
   * إنشاء `middleware.ts` في جذر المشروع لفحص كوكي الجلسة وتوجيه غير المصرح لهم فوراً عند محاولة طلب `/admin/*` أو `/portal/*`.
   * `app/admin/layout.tsx` و صفحات `app/admin/*.tsx`: ربط `getCurrentUser()` و فحص الرتبة داخل مكونات الخادم.
   * `app/portal/client/requests/[id]/page.tsx`: تصحيح فحص الصلاحية لمنع المتدربين من رؤية طلبات العملاء.
   * `lib/auth.ts`: إزالة الـ Fallback Secret والتأكد من فحص `isActive` للمستخدم.
   * `app/api/auth/register/route.ts`: جعل حسابات العملاء الجديدة بحاجة لمراجعة أو تفعيل.
3. **معيار النجاح والاختبار:**
   * محاولة الوصول إلى `/admin` أو جلب RSC Payload بدون تسجيل دخول تؤدي فوراً إلى `307 Redirect` إلى `/login`.
   * الدخول بحساب متدرب ومحاولة فتح طلب عميل تؤدي إلى `403 Forbidden`.
   * صفحة الدخول خالية تماماً من أي كلمات مرور مكشوفة.

---

**نهاية تقرير التدقيق الفني الشامل**  
*تم إعداد هذا التقرير بأعلى معايير الحيادية والدقة الهندسية بناءً على الفحص المباشر لكافة ملفات الكود المصدري.*
