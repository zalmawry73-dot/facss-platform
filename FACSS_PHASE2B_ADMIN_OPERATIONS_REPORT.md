# تقرير تنفيذ المرحلة 2B — العمليات الإدارية التفاعلية ونظام الصلاحيات الدقيقة
# FACSS Phase 2B — Interactive Admin Operations & Granular Capabilities Report

**تاريخ الإنجاز:** 14 سبتمبر 2026  
**الجهة:** مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية (FACSS)  
**حالة التنفيذ:** منجز بنجاح مع اجتياز 100% لاختبارات التحقق والأمان والـ Build.  
**نطاق المرحلة:** العمليات الإدارية (Admin Operations) + تأسيس الصلاحيات الدقيقة (Granular Permissions Foundation).

---

## 1. Executive Summary (الملخص التنفيذي)

تم في هذه المرحلة الانتقال بصفحات الإدارة في منصة مركز عدن الأول (FACSS) من مجرد واجهات عرض ساكنة (Read-Only) إلى أدوات تشغيل حقيقية ومترابطة تفاعلياً بقاعدة البيانات السحابية الحية (PostgreSQL على Neon DB).

بالتوازي مع تفعيل أدوات الإدارة، تم تشييد بنية تحتية مركزية للصلاحيات الدقيقة (**Granular Capabilities Engine**) تعتمد مبدأ الحد الأدنى من الامتيازات (**Principle of Least Privilege**). بموجب هذا النظام، لا يحصل دور الموظف التشغيلي الموحد (`STAFF`) على أي صلاحيات إدارية افتراضية على الإطلاق، وإنما يتطلب إسناداً صريحاً لكل قدرة تشغيلية على حدة، ما يحول دون حدوث توسع غير آمن في الصلاحيات (Privilege Expansion).

شمل الإنجاز العمليات الإدارية الخمس الكبرى:
1. **أكاديمية التدريب (`/admin/training`):** إنشاء وتعديل وإلغاء البرامج وتتبع المقاعد والمحاضرين.
2. **الدراسات والأبحاث (`/admin/research`):** إعداد وتعديل ونشر وأرشفة الأبحاث الاستراتيجية مع ضبط السرية.
3. **رسائل واستفسارات التواصل (`/admin/messages`):** تصنيف الرسائل، المعاينة، تسجيل الردود الموثقة، والأرشفة.
4. **إعدادات المنظومة الرسمية (`/admin/settings`):** محرر إعدادات حي محكوم بقائمة بيضاء صارمة دون المساس بأسرار الخادم.
5. **إدارة المستخدمين والصلاحيات (`/admin/users`):** تفعيل وتجميد الحسابات، وتخصيص الصلاحيات الدقيقة عبر واجهة متخصصة.

---

## 2. Capability Architecture (معمارية الصلاحيات الدقيقة)

تم اعتماد نموذج الصلاحيات الهجين (**Hybrid Capability Model**) الذي يجمع بين سرعة التحقق الصارم للأدوار القيادية والمرونة الفائقة للكوادر التشغيلية:

### قائمة الصلاحيات المعرّفة (Defined Capabilities):
- `manage_requests`: إدارة ومراجعة وتحديث مسارات طلبات الخدمات الأمنية.
- `manage_training`: إنشاء وتعديل وتفعيل البرامج والدورات التدريبية.
- `manage_research`: كتابة وتعديل ونشر وأرشفة الدراسات والأوراق البحثية.
- `manage_messages`: معاينة وتحديث حالة رسائل التواصل وتوثيق الردود.
- `manage_settings`: تعديل أرقام الهواتف، البريد الرسمي، وساعات الدوام المعتمدة.
- `manage_users`: تفعيل وتجميد حسابات المستخدمين وإسناد الصلاحيات الدقيقة.
- `view_audit_logs`: استعراض سجلات الرقابة والنشاط الإداري والأمني.

### قواعد توزيع الصلاحيات:
1. **SUPER_ADMIN (الإدارة العليا):** يمتلك كافة الصلاحيات دون استثناء مع صلاحية حصرية لتعديل الرتب وتعيين مدراء النظام.
2. **ADMIN (المسؤول الإداري):** يمتلك الصلاحيات التشغيلية المعتمدة، وممنوع من ترقية نفسه أو غيره إلى `SUPER_ADMIN` أو تعديل حسابات الإدارة العليا.
3. **STAFF (الكادر التشغيلي الموحد):** يمتلك **(صفر) صلاحيات افتراضية**. لا يستطيع تنفيذ أي عملية ما لم تكن الصلاحية مسندة له صراحة في جدول `UserCapability`.
4. **الأدوار الإدارية السابقة (Legacy Manager Roles):** تم توفير ربط خلفي آمن لضمان استمرارية العمل (Zero Regression):
   - `TRAINING_MANAGER` -> يمتلك `manage_training` تلقائياً.
   - `RESEARCH_MANAGER` -> يمتلك `manage_research` تلقائياً.
   - `SERVICE_MANAGER` -> يمتلك `manage_requests` تلقائياً.
   - `CONTENT_MANAGER` -> يمتلك `manage_research` و `manage_training`.
5. **CLIENT و TRAINEE:** محظورون كلياً من كافة الصلاحيات الإدارية (`Denied`).

### الدوال المركزية المنفذة في [`lib/rbac.ts`](file:///d:/FACSSS/lib/rbac.ts):
- `getUserCapabilities(userId, role)`: استخراج كافة الصلاحيات الفعالة للمستخدم من الذاكرة وقاعدة البيانات.
- `hasCapability(user, capability)`: التحقق المنطقي المباشر من امتلاك الصلاحية.
- `requireCapability(capability, redirectPath)`: حارس على مستوى Server Components يعيد التوجيه عند انعدام الصلاحية.
- `requireAdminOrCapability(capability, redirectPath)`: حارس مرن للأقسام المشتركة.
- `assertApiCapability(session, capability)`: حارس مسارات الـ API الذي يُرجع استجابة `401` أو `403` بصيغة JSON آمنة.

---

## 3. Database Changes (تغييرات قاعدة البيانات)

تم تنفيذ التغييرات بطريقة **غير مدمرة إطلاقاً (Non-Destructive)**:

1. **إضافة الدور `STAFF` إلى الـ Enum `Role`:**
   دون حذف أو تعديل أي دور من الأدوار التسعة السابقة (`SUPER_ADMIN`, `ADMIN`, `CONTENT_MANAGER`, `SERVICE_MANAGER`, `TRAINING_MANAGER`, `RESEARCH_MANAGER`, `EMPLOYEE`, `CLIENT`, `TRAINEE`).
2. **إضافة جدول الصلاحيات الدقيقة `UserCapability`:**
   ```prisma
   model UserCapability {
     id         String   @id @default(cuid())
     userId     String
     capability String
     createdAt  DateTime @default(now())

     user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

     @@unique([userId, capability])
     @@index([userId])
     @@index([capability])
   }
   ```
3. **ربط العلاقة في نموذج `User`:**
   إضافة الحقل العلائقي `capabilities UserCapability[]`.
4. **تحديث نموذج `ResearchPublication`:**
   إضافة الحقل `status ArticleStatus @default(PUBLISHED)` وإضافة فهرس `@@index([status])` لدعم دورة حياة النشر (DRAFT / PUBLISHED / ARCHIVED).

---

## 4. Migration Details (تفاصيل الترحيل)

- **نوع الترحيل:** Additive / Non-Destructive عبر Prisma ضد خادم PostgreSQL المباشر على Neon DB.
- **التنفيذ:** تم تطبيق الأمر `npx prisma db push` بنجاح في 27.30 ثانية.
- **إعادة توليد العميل:** تم تحديث عميل Prisma (`@prisma/client v5.22.0`) وتضمين النماذج الجديدة.
- **سلامة البيانات التاريخية:** تم التأكد برمجياً من عدم فقدان أي سجل، وبقاء جداول `AttendanceRecord` (4 سجلات) و `NewsArticle` (سجلين) سليمة تماماً.

---

## 5. Training CRUD (إدارة التدريب العملياتية)

- **المسار:** `/admin/training`
- **الحماية:** `manage_training`
- **الميزات المنفذة:**
  - عرض قائمة البرامج التدريبية المعتمدة مع إحصائيات المقاعد وعدد المسجلين الفعليين.
  - شريط بحث وتصفية فورية حسب الحالة (`OPEN`, `DRAFT`, `FULL`, `ONGOING`, `COMPLETED`, `CANCELLED`).
  - نافذة منبثقة (Modal) تفاعلية لإضافة دورة جديدة أو تعديل دورة قائمة.
  - الحقول المدعومة: `titleAr`, `titleEn`, `categoryId`, `trainerName`, `duration`, `location`, `capacity`, `status`, `startDate`, `endDate`, `descriptionAr`, `descriptionEn`, `hasCertificate`.
  - تغيير الحالة السريع من الجدول مباشرة عبر قائمة منسدلة تتصل بالـ API فورياً.
  - الإلغاء الآمن: عند طلب حذف دورة تحتوي على متدربين مسجلين، يتم تحويل حالتها تلقائياً إلى `CANCELLED` لمنع كسر العلاقات في قاعدة البيانات.
  - تسجيل كافة عمليات الإنشاء والتعديل والإلغاء في `ActivityLog`.

---

## 6. Research CRUD (إدارة الأبحاث والدراسات)

- **المسار:** `/admin/research`
- **الحماية:** `manage_research`
- **الميزات المنفذة:**
  - عرض الدراسات مع التصنيف والكاتب ومستوى الرؤية وعدد القراءات وحالة النشر.
  - بحث فوري بالعنوان واسم الباحث، وتصفية حسب حالة النشر ومستوى السرية (`PUBLIC` مقابل `CLIENT_ONLY`).
  - نافذة منبثقة لإضافة دراسة جديدة أو تعديل دراسة منشورة.
  - الحقول المدعومة: `titleAr`, `titleEn`, `categoryId`, `author`, `visibility`, `status`, `summaryAr`, `summaryEn`, `contentAr`, `contentEn`.
  - توليد تلقائي لـ `slug` فريد ومطابق للمعايير.
  - حجب وتأجيل رفع ملفات الـ PDF البرمجية صراحة التزاماً بتعليمات المشروع لحين مرحلة التخزين المخصص (Phase 2C Storage) مع إظهار تنبيه توضيحي للإداري.
  - تسجيل كافة العمليات في `ActivityLog`.

---

## 7. Messages Workflow (إدارة رسائل واستفسارات التواصل)

- **المسار:** `/admin/messages`
- **الحماية:** `manage_messages`
- **الميزات المنفذة:**
  - شريط تبويبات بأعداد الرسائل المحدثة حياً (`جميع الرسائل`, `غير مقروءة`, `تمت المراجعة`, `تم الرد`, `الأرشيف`).
  - نافذة معاينة متكاملة للرسالة تعرض: الاسم، البريد، الهاتف، المؤسسة، الموضوع، والنص الكامل.
  - تمييز الرسالة كمقروءة بنقرة زر (`READ`).
  - حقل توثيق ملاحظات الرد الداخلي وحفظه مع تحويل الحالة إلى `REPLIED`.
  - خيار الأرشفة الفورية للرسائل القديمة (`ARCHIVED`).
  - تسجيل كافة تغييرات الحالات في `ActivityLog`.

---

## 8. Settings Workflow (إدارة إعدادات وبيانات المنظومة)

- **المسار:** `/admin/settings`
- **الحماية:** `manage_settings`
- **الميزات المنفذة:**
  - محرر إعدادات تشغيلي متكامل يدعم الحفظ المفرد لكل حقل أو الحفظ الشامل لكافة الإعدادات.
  - **القائمة البيضاء الصارمة للحقول المسموح بها حصراً:**
    1. `OFFICIAL_PHONE`: الهاتف الرسمي الثابت للمركز في عدن.
    2. `WHATSAPP_PHONE`: رقم واتساب المركز.
    3. `OFFICIAL_EMAIL`: البريد الرسمي للاستقبال.
    4. `OPERATIONS_EMAIL`: بريد قطاع العمليات والخدمات.
    5. `TRAINING_EMAIL`: بريد قطاع التدريب والتأهيل.
    6. `OFFICIAL_ADDRESS`: العنوان الميداني المعتمد.
    7. `WORKING_HOURS`: ساعات ومواعيد الدوام الرسمي.
    8. `SOCIAL_TWITTER`: رابط حساب منصة X.
    9. `SOCIAL_LINKEDIN`: رابط حساب LinkedIn.
    10. `SOCIAL_FACEBOOK`: رابط صفحة Facebook.
    11. `ANNOUNCEMENT_TEXT`: نص الإعلان الرسمي المعتمد.
  - **الحماية الأمنية:** حظر مطلق لأي محاولة لقراءة أو حقن مفاتيح قواعد البيانات (`DATABASE_URL`) أو أسرار التشفير (`AUTH_SECRET`, `API_KEY`, `TOKEN`).
  - **الانعكاس الحي على الموقع العام:** تم ربط صفحة التواصل (`/contact`) والتذييل العام (`Footer`) بنقطة استعلام الإعدادات العامة (`/api/settings/public`) لتعكس الأرقام والعناوين المعدلة مباشرة.

---

## 9. Users & Capabilities Management (إدارة المستخدمين والصلاحيات)

- **المسار:** `/admin/users`
- **الحماية:** `manage_users`
- **الميزات المنفذة:**
  - استعراض شامل لحسابات المستخدمين مع أدوارهم وحالتهم التشغيلية وتاريخ الانضمام.
  - تصفية وبحث بالاسم والبريد والرتبة والحالة (`ACTIVE` / `INACTIVE`).
  - زر تفعيل وتجميد فوري للحسابات (`UserCheck` / `UserX`) دون حذف نهائي للبيانات حفاظاً على النزاهة المرجعية.
  - **درج تخصيص الصلاحيات الدقيقة (Granular Capabilities Modal):**
    - متاح لكوادر الـ `STAFF` والوظائف التشغيلية.
    - عرض قائمة الصلاحيات السبع مع وصف وظيفي لكل صلاحية.
    - التعيين والسحب الفوري للصلاحيات عبر أزرار تفاعلية تتصل بـ API الصلاحيات.
  - **ضوابط منع تصعيد الصلاحيات (Anti-Privilege Escalation Controls):**
    - حظر قيام أي مسؤول بتجميد حسابه الشخصي (منع الإغلاق العرضي).
    - حظر تعديل حسابات الإدارة العليا (`SUPER_ADMIN`) إلا من قِبل مسؤول إدارة عليا آخر.
    - حظر قيام أي مستخدم بمنح نفسه صلاحيات جديدة عبر الـ API.
    - حصر صلاحية تعديل رتب المستخدمين أو منح صلاحيات `manage_users` بـ `SUPER_ADMIN` حصراً.
    - حجب تجزئة كلمات المرور (`passwordHash`) تماماً عن كافة الاستجابات البرمجية.

---

## 10. Admin System Hub (مركز تشغيل المنظومة)

- **المسار:** `/admin/system`
- **الحماية:** `requireStaff('/admin/system')` مع فحص الصلاحيات لكل بطاقة.
- **التصميم:** مركز تنقل خفيف ومنظم (Navigation Hub) بدلاً من صفحة أحادية ضخمة (Monolithic Page).
- **المحتوى:**
  - بطاقات مستقلة للأقسام الأربعة: رسائل التواصل، المستخدمين، الإعدادات، وسجل التدقيق.
  - مؤشرات رقمية حية لكل بطاقة (مثل عدد الرسائل غير المقروءة، الحسابات النشطة، وسجلات التدقيق).
  - إظهار حالة الوصول الدقيقة لكل بطاقة: إذا كان المستخدم يفتقر لصلاحية قسم معين، تظهر البطاقة بحالة "يتطلب تصريح" مع قفل أمني وتعطيل زر الدخول تطبيقاً لمبدأ الحد الأدنى من الامتيازات.

---

## 11. API Inventory Added (قائمة واجهات البرمجة الجديدة)

تمت إضافة 11 مسار API جديد ومحمٍ بالكامل:

| # | المسار (Route) | الأساليب المدعومة | الصلاحية المطلوبة | الوظيفة |
|---|---|---|---|---|
| 1 | `/api/admin/training` | `GET`, `POST` | `manage_training` | استعراض الدورات وإنشاء دورة تدريبية جديدة |
| 2 | `/api/admin/training/[id]` | `GET`, `PATCH`, `DELETE` | `manage_training` | معاينة الدورة، تحديث بياناتها، والإلغاء الآمن |
| 3 | `/api/admin/research` | `GET`, `POST` | `manage_research` | استعراض الأبحاث وإنشاء ورقة بحثية جديدة |
| 4 | `/api/admin/research/[id]` | `GET`, `PATCH`, `DELETE` | `manage_research` | معاينة الدراسة، تعديل محتواها، والأرشفة الآمنة |
| 5 | `/api/admin/messages` | `GET` | `manage_messages` | استعراض رسائل التواصل مع إحصائيات الحالات |
| 6 | `/api/admin/messages/[id]` | `GET`, `PATCH` | `manage_messages` | معاينة الرسالة وتحديث حالتها وتوثيق الرد |
| 7 | `/api/admin/settings` | `GET`, `PATCH` | `manage_settings` | قراءة وتحديث الإعدادات المؤسسية المحصورة |
| 8 | `/api/admin/users` | `GET` | `manage_users` | استعراض المستخدمين وصلاحياتهم المسندة |
| 9 | `/api/admin/users/[id]` | `GET`, `PATCH` | `manage_users` | تفعيل/تجميد الحساب وتعديل الرتبة (للإدارة العليا) |
| 10 | `/api/admin/users/[id]/capabilities` | `GET`, `POST`, `DELETE` | `manage_users` | استعراض وإسناد وسحب الصلاحيات الدقيقة |
| 11 | `/api/settings/public` | `GET` | متاح للعموم (Public) | قراءة بيانات الاتصال العامة المعتمدة للواجهة |

---

## 12. Validation Strategy (استراتيجية التحقق من المدخلات)

تم تركيز كافة قواعد التحقق داخل ملف موحد [`lib/validations/admin.ts`](file:///d:/FACSSS/lib/validations/admin.ts) بدلاً من الشروط العشوائية المتناثرة:
- **التدريب:** التحقق من وجود العناوين باللغتين (حد أدنى 3 أحرف)، الوصف (حد أدنى 10 أحرف)، اسم المحاضر، سعة المقاعد (رقم موجب بين 1 و 1000)، صحة الحالات ضمن Enum محدد، وتسلسل التواريخ الزمني المنطقي.
- **الأبحاث:** التحقق من وجود العنوان والملخص والمحتوى باللغتين، واسم الباحث، والتصنيف، وحصر مستوى الرؤية في (`PUBLIC`, `CLIENT_ONLY`) وحالة النشر في (`DRAFT`, `PUBLISHED`, `ARCHIVED`).
- **الرسائل:** حصر التحديث في الحالات المعتمدة (`UNREAD`, `READ`, `REPLIED`, `ARCHIVED`) مع تنظيف نصوص الرد.
- **الإعدادات:** فحص صارم يمنع استقبال أي مفتاح خارج القائمة البيضاء، والتحقق من صيغ البريد الإلكتروني عبر التعبيرات القياسية (RegEx)، وحظر الكلمات المفتاحية الحساسة مثل `SECRET`, `KEY`, `DATABASE_URL`.
- **الصلاحيات:** التحقق من مطابقة الصلاحية المطلوبة للقيم المعرفة رسمياً في `ALL_CAPABILITIES`.

---

## 13. Audit Logging (سجل التدقيق والرقابة)

تم إنشاء المساعد المركزي [`lib/audit.ts`](file:///d:/FACSSS/lib/audit.ts) لتسجيل كل عملية حساسة تلقائياً في جدول `ActivityLog`:
- **البيانات المسجلة في كل عملية:** `userId`, `userName`, `action`, `entityType`, `entityId`, `details`, `ipAddress`, `createdAt`.
- **التنقية التلقائية للأسرار:** يحتوي المساعد على مرشح تلقائي (Sanitizer) يقوم بحجب أي كلمات مرور أو رموز مشفرة أو أسرار تلقائياً (`[REDACTED]`) في حال تمريرها ضمن حقل التفاصيل.
- **العمليات المشمولة بالسجل:**
  - إنشاء دورة تدريبية (`CREATE_TRAINING_COURSE`)
  - تعديل دورة تدريبية (`UPDATE_TRAINING_COURSE`)
  - إلغاء/حذف دورة تدريبية (`CANCEL_TRAINING_COURSE` / `DELETE_TRAINING_COURSE`)
  - إنشاء دراسة بحثية (`CREATE_RESEARCH_PUBLICATION`)
  - تعديل دراسة بحثية (`UPDATE_RESEARCH_PUBLICATION`)
  - أرشفة دراسة بحثية (`ARCHIVE_RESEARCH_PUBLICATION`)
  - تحديث حالة رسالة تواصل (`UPDATE_MESSAGE_STATUS`)
  - تحديث إعدادات النظام (`UPDATE_SYSTEM_SETTING`)
  - تفعيل أو تعطيل حساب مستخدم (`UPDATE_USER_STATUS`)
  - منح صلاحية دقيقة لمستخدم (`ASSIGN_USER_CAPABILITY`)
  - سحب صلاحية دقيقة من مستخدم (`REVOKE_USER_CAPABILITY`)
  - تحديث حالة طلب خدمة أمنية (`UPDATE_SERVICE_REQUEST`)

---

## 14. Security Controls (الضوابط الأمنية المطبقة)

1. **تحصين الخادم والـ API (Defense in Depth):** عدم الاكتفاء بإخفاء الأزرار في الواجهات، بل فرض التحقق الصارم عبر `assertApiCapability` في كل مسار API قبل قراءة أو كتابة أي بيانات.
2. **فحص الحساب النشط (`isActive Check`):** التحقق المباشر من قاعدة البيانات في كل طلب؛ في حال تجميد حساب أي مستخدم، يتم إبطال وصوله فوراً حتى لو كان يمتلك رمز JWT صالحاً.
3. **منع التعدي والتلاعب بالهوية (IDOR Protection):** منع العملاء والمتدربين من استعراض طلبات أو بيانات لا تخصهم.
4. **منع تصعيد الصلاحيات (Privilege Escalation Prevention):** عزل تام لصلاحيات `SUPER_ADMIN`، ومنع الحسابات الإدارية الأدنى من منح نفسها أو غيرها صلاحيات استثنائية.
5. **حماية أسرار الخادم (Secret Isolation):** عزل كامل لمتغيرات البيئة الحساسة (`AUTH_SECRET`, `DATABASE_URL`).
6. **رؤوس الأمان (Security Headers):** تطبيق `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, و `Permissions-Policy` عبر `middleware.ts`.

---

## 15. Files Added (الملفات المضافة في المرحلة 2B)

عدد الملفات المضافة: **21 ملفاً بالتحديد**:

1. [`lib/audit.ts`](file:///d:/FACSSS/lib/audit.ts) — المساعد المركزي لسجل التدقيق وتنقية الأسرار.
2. [`lib/validations/admin.ts`](file:///d:/FACSSS/lib/validations/admin.ts) — مخططات وقواعد التحقق المركزية لعمليات الإدارة.
3. [`lib/settings.ts`](file:///d:/FACSSS/lib/settings.ts) — قارئ الإعدادات المؤسسية العامة بقيم افتراضية آمنة.
4. [`app/api/settings/public/route.ts`](file:///d:/FACSSS/app/api/settings/public/route.ts) — مسار API لقراءة الإعدادات العامة.
5. [`app/api/admin/training/route.ts`](file:///d:/FACSSS/app/api/admin/training/route.ts) — مسار API لاستعراض وإنشاء الدورات.
6. [`app/api/admin/training/[id]/route.ts`](file:///d:/FACSSS/app/api/admin/training/[id]/route.ts) — مسار API لتحديث وإلغاء الدورات.
7. [`app/api/admin/research/route.ts`](file:///d:/FACSSS/app/api/admin/research/route.ts) — مسار API لاستعراض وإنشاء الأبحاث.
8. [`app/api/admin/research/[id]/route.ts`](file:///d:/FACSSS/app/api/admin/research/[id]/route.ts) — مسار API لتعديل وأرشفة الأبحاث.
9. [`app/api/admin/messages/route.ts`](file:///d:/FACSSS/app/api/admin/messages/route.ts) — مسار API لقائمة الرسائل والإحصائيات.
10. [`app/api/admin/messages/[id]/route.ts`](file:///d:/FACSSS/app/api/admin/messages/[id]/route.ts) — مسار API لمعاينة الرسالة وحفظ الرد.
11. [`app/api/admin/settings/route.ts`](file:///d:/FACSSS/app/api/admin/settings/route.ts) — مسار API لإدارة وتحديث الإعدادات بالقائمة البيضاء.
12. [`app/api/admin/users/route.ts`](file:///d:/FACSSS/app/api/admin/users/route.ts) — مسار API لاستعراض المستخدمين وصلاحياتهم.
13. [`app/api/admin/users/[id]/route.ts`](file:///d:/FACSSS/app/api/admin/users/[id]/route.ts) — مسار API لتفعيل/تجميد الحساب وضبط الرتب.
14. [`app/api/admin/users/[id]/capabilities/route.ts`](file:///d:/FACSSS/app/api/admin/users/[id]/capabilities/route.ts) — مسار API لمنح وسحب الصلاحيات الدقيقة.
15. [`components/admin/TrainingManager.tsx`](file:///d:/FACSSS/components/admin/TrainingManager.tsx) — مكون إدارة التدريب التفاعلي.
16. [`components/admin/ResearchManager.tsx`](file:///d:/FACSSS/components/admin/ResearchManager.tsx) — مكون إدارة الأبحاث التفاعلي.
17. [`components/admin/MessagesManager.tsx`](file:///d:/FACSSS/components/admin/MessagesManager.tsx) — مكون إدارة الرسائل التفاعلي.
18. [`components/admin/SettingsManager.tsx`](file:///d:/FACSSS/components/admin/SettingsManager.tsx) — مكون إدارة الإعدادات التفاعلي.
19. [`components/admin/UsersManager.tsx`](file:///d:/FACSSS/components/admin/UsersManager.tsx) — مكون إدارة المستخدمين والصلاحيات التفاعلي.
20. [`components/admin/RequestsManager.tsx`](file:///d:/FACSSS/components/admin/RequestsManager.tsx) — مكون إدارة طلبات الخدمات التفاعلي.
21. [`scripts/test_phase2b_suite.js`](file:///d:/FACSSS/scripts/test_phase2b_suite.js) — حزمة الاختبارات الآلية المخصصة للمرحلة 2B.

---

## 16. Files Modified (الملفات المعدلة في المرحلة 2B)

عدد الملفات المعدلة: **14 ملفاً بالتحديد**:

1. [`prisma/schema.prisma`](file:///d:/FACSSS/prisma/schema.prisma) — إضافة دور `STAFF`، جدول `UserCapability`، وعلاقة الصلاحيات، وحالة النشر في الأبحاث.
2. [`lib/rbac.ts`](file:///d:/FACSSS/lib/rbac.ts) — بناء محرك الصلاحيات الدقيقة ودوال التحقق والحراسة.
3. [`app/admin/training/page.tsx`](file:///d:/FACSSS/app/admin/training/page.tsx) — تفعيل الصفحة وربطها بـ `manage_training` ومكون `TrainingManager`.
4. [`app/admin/research/page.tsx`](file:///d:/FACSSS/app/admin/research/page.tsx) — تفعيل الصفحة وربطها بـ `manage_research` ومكون `ResearchManager`.
5. [`app/admin/messages/page.tsx`](file:///d:/FACSSS/app/admin/messages/page.tsx) — تفعيل الصفحة وربطها بـ `manage_messages` ومكون `MessagesManager`.
6. [`app/admin/settings/page.tsx`](file:///d:/FACSSS/app/admin/settings/page.tsx) — تفعيل الصفحة وربطها بـ `manage_settings` ومكون `SettingsManager`.
7. [`app/admin/users/page.tsx`](file:///d:/FACSSS/app/admin/users/page.tsx) — تفعيل الصفحة وربطها بـ `manage_users` ومكون `UsersManager`.
8. [`app/admin/requests/page.tsx`](file:///d:/FACSSS/app/admin/requests/page.tsx) — تحويلها إلى Server Component محمي بـ `manage_requests` واستدعاء `RequestsManager`.
9. [`app/admin/system/page.tsx`](file:///d:/FACSSS/app/admin/system/page.tsx) — ربط بطاقات مركز التشغيل بالصلاحيات الدقيقة وإظهار مؤشرات الأذونات.
10. [`app/admin/logs/page.tsx`](file:///d:/FACSSS/app/admin/logs/page.tsx) — حماية سجل التدقيق بصلاحية `view_audit_logs`.
11. [`app/api/requests/[id]/route.ts`](file:///d:/FACSSS/app/api/requests/[id]/route.ts) — ربط تحديث الطلبات بصلاحية `manage_requests` عبر `assertApiCapability`.
12. [`app/api/auth/me/route.ts`](file:///d:/FACSSS/app/api/auth/me/route.ts) — إضافة `export const dynamic = 'force-dynamic'`.
13. [`app/contact/page.tsx`](file:///d:/FACSSS/app/contact/page.tsx) — ربط معلومات الاتصال بالقيم الحية المسترجعة من إعدادات المنظومة.
14. [`components/Footer.tsx`](file:///d:/FACSSS/components/Footer.tsx) — ربط بيانات الهاتف والبريد بالتحديثات الحية لإعدادات المنظومة.

---

## 17. Tests Added (الاختبارات الآلية المضافة)

تم إنشاء حزمة اختبارات شاملة في [`scripts/test_phase2b_suite.js`](file:///d:/FACSSS/scripts/test_phase2b_suite.js) تغطي 16 سيناريو أمني وعملياتي دقيق:

1. سيناريو `SUPER_ADMIN -> all admin capabilities = ALLOWED`
2. سيناريو `ADMIN -> permitted operational capability = ALLOWED`
3. سيناريو `ADMIN -> super-admin-only action (manage_users role escalation) = DENIED`
4. سيناريو `STAFF with manage_training -> Training create = ALLOWED`
5. سيناريو `STAFF without manage_training -> Training create = DENIED (403)`
6. سيناريو `STAFF with manage_research -> Research publish = ALLOWED`
7. سيناريو `STAFF without manage_research -> DENIED (403)`
8. سيناريو `STAFF with manage_messages -> Message update = ALLOWED`
9. سيناريو `STAFF without manage_messages -> DENIED (403)`
10. سيناريو `CLIENT -> any admin API = DENIED (403)`
11. سيناريو `TRAINEE -> any admin API = DENIED (403)`
12. سيناريو `Privilege escalation through capability payload = DENIED`
13. سيناريو `Disabled user (isActive=false) -> admin action = DENIED (401)`
14. سيناريو `Centralized Input Validation rejects invalid data (400)`
15. سيناريو `Live Database CRUD Operations on Neon DB = SUCCESS`
16. سيناريو `Non-destructive DB integrity preserved (User, UserCapability, NewsArticle, AttendanceRecord) = VERIFIED`

---

## 18. Test Results (نتائج تشغيل الاختبارات)

### 1. حزمة اختبارات المرحلة 2B (`scripts/test_phase2b_suite.js`):
```text
======================================================
   FACSS PHASE 2B GRANULAR CAPABILITIES TEST SUITE
======================================================

  ✔ PASS: Test 1: SUPER_ADMIN has ALL capabilities without exception
  ✔ PASS: Test 2: ADMIN has all permitted operational capabilities
  ✔ PASS: Test 3: ADMIN cannot escalate to or modify SUPER_ADMIN role (Deny Privilege Escalation)
  ✔ PASS: Test 4: STAFF with manage_training -> Training create = ALLOWED
  ✔ PASS: Test 5: STAFF without manage_training -> Training create = DENIED (403)
  ✔ PASS: Test 6: STAFF with manage_research -> Research publish = ALLOWED
  ✔ PASS: Test 7: STAFF without manage_research -> DENIED (403)
  ✔ PASS: Test 8: STAFF with manage_messages -> Message update = ALLOWED
  ✔ PASS: Test 9: STAFF without manage_messages -> DENIED (403)
  ✔ PASS: Test 10: CLIENT -> any admin API = DENIED (403)
  ✔ PASS: Test 11: TRAINEE -> any admin API = DENIED (403)
  ✔ PASS: Test 12: Privilege escalation through capability payload is DENIED
  ✔ PASS: Test 13: Disabled user (isActive=false) -> admin action is strictly DENIED
  ✔ PASS: Test 14: Centralized Input Validation rejects invalid data (400)
    [DB Verified: UserCapability, ActivityLog, NewsArticle (2), AttendanceRecord (4)]
  ✔ PASS: Test 15 & 16: Live Neon DB Integration & Schema Integrity

======================================================
   PHASE 2B TEST RESULTS: 15 PASSED, 0 FAILED
======================================================
```

### 2. حزمة اختبارات الأمان للمرحلة 1 (`scripts/test_security_suite.js`):
```text
======================================================
   FACSS PHASE 1 SECURITY AUTOMATED TEST SUITE
======================================================

  ✔ PASS: Scenario 1: Anonymous -> /admin is DENIED by Edge Middleware
  ✔ PASS: Scenario 2: CLIENT -> /admin is DENIED by Edge Middleware
  ✔ PASS: Scenario 3: TRAINEE -> /admin is DENIED by Edge Middleware
  ✔ PASS: Scenario 4: CONTENT_MANAGER -> /admin/settings (ADMIN_ROLES required) is DENIED
  ✔ PASS: Scenario 5: Authorized Staff (CONTENT_MANAGER -> STAFF_ROLES) is ALLOWED
  ✔ PASS: Scenario 5b: SUPER_ADMIN bypasses all role restrictions
  ✔ PASS: Scenario 5c: Consolidated STAFF role is ALLOWED in general staff areas
  ✔ PASS: Scenario 5d: Consolidated STAFF role is DENIED from ADMIN_ROLES areas (Least Privilege)
  ✔ PASS: Scenario 6: TRAINEE -> Client Request is DENIED (403)
  ✔ PASS: Scenario 7: CLIENT A -> Client B Request is DENIED (403 IDOR blocked)
  ✔ PASS: Scenario 8: CLIENT A -> Own Request is ALLOWED (200 OK)
  ✔ PASS: Scenario 8b: Authorized Staff -> Any Client Request is ALLOWED
  ✔ PASS: Scenario 9: Disabled User with valid JWT format is DENIED (isActive=false)
  ✔ PASS: Scenario 10: Invalid / Tampered JWT is securely REJECTED
  ✔ PASS: Scenario 10b: Expired JWT is securely REJECTED
  ✔ PASS: Scenario 11: Missing or insecure AUTH_SECRET throws fatal configuration error
  ✔ PASS: Scenario 12: Repeated login abuse triggers 429 Too Many Requests
  ✔ PASS: Scenario 13: Repeated contact form spam triggers 429 Too Many Requests
  ✔ PASS: Scenario 14: Privilege escalation attempt during registration is strictly sanitized

======================================================
   TEST RESULTS: 19 PASSED, 0 FAILED
======================================================
```
**المجموع الكلي للاختبارات الآلية الناجحة: 34 اختباراً ناجحاً بنسبة نجاح 100% وبدون أي فشل.**

---

## 19. TypeScript Result (نتيجة التحقق البرمجي للأنواع)

- **الأمر المنفذ:** `npx tsc --noEmit`
- **النتيجة:** رمز الخروج `0` (Exit Code 0).
- **عدد الأخطاء:** `0` أخطاء برمجية في كامل المشروع.

---

## 20. Build Result (نتيجة البناء للإنتاج)

- **الأمر المنفذ:** `npm run build`
- **النتيجة:** اكتمل البناء بنجاح تام مع رمز الخروج `0` (Exit Code 0).
- **توليد عميل Prisma:** تم بنجاح في 373ms.
- **عدد المسارات المبنية:** 51 مساراً تشغيلياً (Routes) تشمل كافة صفحات الإدارة وواجهات برمجة التطبيقات الجديدة.

---

## 21. Remaining Risks (المخاطر المتبقية)

1. **انقطاع اتصال الشبكة السحابية بقاعدة البيانات (Neon DB Cold Starts / Network Latency):** في حال حدوث بطء في الشبكة مع خادم Neon DB السحابي خارج اليمن، قد تستغرق بعض استعلامات الإدارة ثوانٍ معدودة. يُوصى مستقبلاً بضبط Connection Pooling والـ Retries.
2. **غياب نظام تخزين الملفات المستندية المؤمن (Storage Engine):** رفع ملفات الـ PDF للدراسات وتقارير العملاء غير مفعل حالياً لمنع استلام ملفات خبيثة أو غير مفحوصة، ويجب أن يبقى معطلاً حتى تنفيذ المرحلة 2C.
3. **تعدد حسابات المدراء السابقة (Legacy Manager Roles):** على الرغم من دعمها بالكامل دون أي تعارض، إلا أن الانتقال التدريجي لتوحيد حسابات الموظفين تحت دور `STAFF` مع الصلاحيات الدقيقة سيجعل النظام أكثر انضباطاً وسهولة في التدقيق.

---

## 22. Deferred Items (العناصر المؤجلة صراحة بحسب نطاق المرحلة)

التزاماً دقيقاً بحدود المرحلة 2B، تم تأجيل ما يلي وعدم المساس به:
- نظام تخزين ورفع وتحميل ملفات العملاء (Client Document Storage - مؤجل للمرحلة 2C).
- مسار تسجيل المتدربين الذاتي في الدورات التدريبية (Trainee Course Registration).
- نظام تحضير المتدربين وإصدار الشهادات المؤتمت (Attendance & Certificate Issuance).
- خدمات الإرسال الخارجي للبريد أو الرسائل القصيرة أو WhatsApp API (Email / SMS Delivery).
- إعادة التصميم البصري الشامل للموقع أو تعديل الثيم (Visual Redesign).
- دعم الدفع الإلكتروني (Payment Gateways).
- وحدة الأخبار المستقلة (News Module).

---

## 23. Exact Recommendation for Phase 2C (التوصية الدقيقة للمرحلة 2C)

بعد اكتمال بناء وتثبيت العمليات الإدارية وأرضية الصلاحيات الدقيقة بنجاح، يُوصى بالانتقال إلى **FACSS Phase 2C — Client Portal & Document Operations** مع التركيز على:
1. **نظام التخزين الآمن للمستندات (Secure Document Storage Foundation):** بناء Storage Driver معزول يفحص امتدادات الملفات ويمنع هجمات Path Traversal والملفات التنفيذية.
2. **بوابة وثائق العميل (Client Document Center):** تمكين العميل المؤسسي من تنزيل تقارير التقييم الأمني الصادرة له حصراً بصيغة PDF بطريقة مؤمنة وموقعة.
3. **إرفاق مستندات المنشأة:** تمكين العميل من إرفاق المخططات وسجلات المنشأة ضمن طلب الخدمة بحجم محدد وبصلاحيات وصول محصورة.

---
**نهاية تقرير المرحلة 2B — التوقف التام بانتظار توجيهات المطور/المستخدم.**
