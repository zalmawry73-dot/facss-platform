# مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية (FACSS)
## Aden First Center for Security Services and Strategic Studies
### Official Digital Corporate Platform & Portals Ecosystem

---

«أمانٌ يبدأ من عدن» — First in Security, First in Trust  
منظومةٌ أمنيةٌ متكاملة: من التدريب إلى الحراسات، إلى التحليل الأمني وتقييم المخاطر، والأبحاث والدراسات الأمنية والاستراتيجية.

---

## 1. نبذة عن المنصة (Project Overview)
المنصة الرقمية الرسمية لـ **مركز عدن الأول (FACSS)** هي نظام مؤسسي متكامل صُمم ليعكس أعلى معايير الاحترافية، الثقة، والاستراتيجية الأمنية. المنصة ليست موقعاً شكلياً أو نموذجاً أولياً، بل نظام تشغيلي متكامل يشتمل على:
1. **الموقع المؤسسي العام (Public Corporate Website):** متعدد اللغات (عربي RTL وإنجليزي LTR بالكامل)، يستعرض الرؤية والرسالة، الركائز الوقائية الست، دليل الخدمات الأمنية، الأنظمة والحلول الإلكترونية، أكاديمية التدريب، مركز البحوث والدراسات، القطاعات المستهدفة، ومنهجية العمل.
2. **بوابة العملاء (Client Portal):** متابعة طلبات الخدمات بنظام التتبع المرجعي (`FACSS-SR-YYYY-XXXXXX`)، المسار الزمني التفاعلي للحالات، الملاحظات الميدانية، ومستودع التقارير السرية.
3. **بوابة المتدربين (Trainee Portal):** استعراض البرامج التدريبية، متابعة سجل الحضور، وعرض وطباعة شهادات التخرج والتأهيل الرقمية المعتمدة برموز تحقق فريدة.
4. **لوحة الإدارة والتحكم (Admin Dashboard / CMS):** إدارة طلبات الخدمات، الدورات، المتدربين، الدراسات، الرسائل، المستخدمين والصلاحيات (RBAC)، إعدادات النظام، وسجلات التدقيق الرقابي.

---

## 2. التقنيات المستخدمة (Technology Stack)
- **الإطار البرمجي الكامل:** Next.js 14+ (App Router, React 18, TypeScript)
- **قاعدة البيانات:** PostgreSQL (عبر Prisma ORM)
- **نظام التصميم والألوان:** Vanilla CSS فائق الجودة بالهوية المعتمدة (الأخضر الداكن `#0B2518` والذهبي الإمبراطوري `#C59B27`) مع مؤثرات Glassmorphism ودعم RTL/LTR كامل.
- **الأمان والتوثيق:** نظام جلسات محلي مستقل ومحمي بتوكنات JWT مشفرة عبر كوكيز `httpOnly` وكلمات مرور مشفرة بـ `bcryptjs`.
- **استقلالية تامة:** لا يعتمد المشروع على أي حساب خارجي أو خدمة سرية خاصة بالوكيل؛ المالك هو المتحكم الكامل 100%.

---

## 3. متطلبات التشغيل (System Requirements)
- **نظام التشغيل:** Windows 10/11، Linux (Ubuntu/Debian)، أو macOS.
- **Node.js:** الإصدار 18 أو 20 أو 22+
- **npm:** الإصدار 9 أو 10+
- **PostgreSQL:** الإصدار 14 أو 15 أو 16+

---

## 4. خطوات التثبيت والتشغيل على نظام Windows (أو Linux)

### الخطوة 1: تثبيت حزم المشروع
```bash
npm install --legacy-peer-deps
```

### الخطوة 2: إعداد متغيرات البيئة
انسخ ملف الإعدادات الافتراضي:
- في Windows PowerShell:
  ```powershell
  Copy-Item .env.example .env
  ```
- في Linux / Mac:
  ```bash
  cp .env.example .env
  ```

عدّل رابط قاعدة البيانات `DATABASE_URL` داخل `.env` إذا كانت قاعدة البيانات تعمل على منفذ آخر غير الافتراضي:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/facss_db?schema=public"
APP_URL="http://localhost:3000"
AUTH_SECRET="facss-aden-security-platform-dev-secret-key-2026-min-32-chars"
```

### الخطوة 3: تهيئة قاعدة البيانات وإنشاء الجداول
```bash
npx prisma db push
```

### الخطوة 4: زراعة البيانات الرسمية المعتمدة (Seed)
```bash
node scripts/seed.js
```

### الخطوة 5: تشغيل المنصة في بيئة التطوير (Development)
```bash
npm run dev
```
افتح المتصفح على الرابط: **`http://localhost:3000`**

### الخطوة 6: بناء وتشغيل نسخة الإنتاج (Production Build)
```bash
npm run build
npm start
```

---

## 5. بيانات الدخول التجريبية (Demo Accounts)
تم تجهيز حسابات تجريبية لكافة الرتب لمراجعة كافة الأقسام (توجد أزرار تعبئة سريعة في صفحة الدخول `/login`):
- **Super Admin (الإدارة العليا):** `admin@facss-aden.com` | `Admin@FACSS2026`
- **Service Manager (مدير العمليات):** `services@facss-aden.com` | `Service@FACSS2026`
- **Training Manager (مدير التدريب):** `training@facss-aden.com` | `Train@FACSS2026`
- **Research Manager (مدير الدراسات):** `research@facss-aden.com` | `Research@FACSS2026`
- **Client (حساب عميل تجاري):** `client@yemen-bank.com` | `Client@FACSS2026`
- **Trainee (حساب متدرب):** `trainee@facss-aden.com` | `Trainee@FACSS2026`

---

## 6. إيقاف وإعادة تشغيل النظام
- **لإيقاف الخادم:** اضغط `Ctrl + C` في نافذة التيرمينال التي تشغل التطبيق.
- **لإعادة التشغيل:** نفذ `npm start` (للإنتاج) أو `npm run dev` (للتطوير).

---

## 7. الدلائل والوثائق التخصصية (Documentation Index)
تجد داخل مجلد `docs/` دليلاً مفصلاً لكل جانب من جوانب النظام:
- `docs/PROJECT_OVERVIEW.md` — نبذة المشروع
- `docs/ARCHITECTURE.md` — المعمارية التقنية للطبقات
- `docs/DATABASE.md` — مخطط قاعدة البيانات والكيانات
- `docs/AUTHENTICATION.md` — معمارية التوثيق والأمان
- `docs/ROLES_PERMISSIONS.md` — مصفوفة الصلاحيات (RBAC)
- `docs/LOCAL_SETUP.md` — دليل الإعداد والتشغيل المحلي
- `docs/ENVIRONMENT_VARIABLES.md` — مرجع متغيرات البيئة
- `docs/DEPLOYMENT.md` — دليل النشر وضبط Nginx وSSL
- `docs/ADMIN_GUIDE.md` — دليل استخدام لوحة التحكم
- `docs/CLIENT_PORTAL_GUIDE.md` — دليل بوابة العملاء
- `docs/TRAINING_MODULE.md` — دليل أكاديمية التدريب
- `docs/SERVICE_REQUEST_WORKFLOW.md` — معمارية مسار طلبات الخدمات
- `docs/EXTERNAL_INTEGRATIONS.md` — جدول الخدمات الخارجية وطريقة ربطها
- `docs/TESTING.md` — تقرير الفحوصات والاختبارات
- `docs/TROUBLESHOOTING.md` — حل المشكلات الشائعة
- `OWNER_ACTION_REQUIRED.md` — المهام المطلوبة من المالك
- `DEMO_CREDENTIALS.md` — بيانات الدخول التجريبية
- `START_HERE.md` — دليل البدء السريع في 11 خطوة
- `FACSS_HANDOVER_REPORT.md` — التقرير النهائي الشامل للتسليم
