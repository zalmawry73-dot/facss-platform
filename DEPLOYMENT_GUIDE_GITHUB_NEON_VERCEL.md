# دليل النشر والتحديث الشامل لمنصة مركز عدن الدولي للسلامة (AICSFA)
## الدليل التنفيذي: التجهيز، التحديث السحابي على Neon، الرفع إلى GitHub، والنشر على Vercel

**المشروع:** مركز عدن الدولي للسلامة والدراسات الميدانية (AICSFA)  
**المسار المحلي:** `D:\FACSSS`  
**مستودع GitHub:** `https://github.com/zalmawry73-dot/facss-platform.git`  
**الفرع (Branch):** `main`  
**رابط النشر المباشر (Vercel):** `https://facss-platform.vercel.app`  
**مزود قاعدة البيانات السحابية:** Neon PostgreSQL (AWS eu-central-1 Serverless)

---

## 1. ملخص التجهيزات المكتملة محلياً (Preparation Status)

تم فحص وتجهيز المنصة بالكامل للتأكد من عدم وجود أي خطأ برمجيات أو فشل في البناء السحابي:

- [x] **سلامة نظام الأنواع (TypeScript):** تم تشغيل `npx tsc --noEmit` واجتياز الفحص بـ **0 أخطاء**.
- [x] **بناء الإنتاج الفعلي (Next.js Production Build):** تم تشغيل `next build` محلياً وتم بنجاح توليد كافة المسارات والواجهات الـ 47 وواجهات API بنجاح 100%.
- [x] **نظافة مستودع Git (`.gitignore`):** تم تحديث `.gitignore` لاستبعاد ملفات الاختبارات واللقطات المؤقتة ومجلدات محاكاة المتصفح (`temp_chrome/`, `screenshot_*.png`).
- [x] **تثبيت التعديلات في Git (Commit):** تم عمل Commit نظيف وشامل لكافة ملفات وتحديثات المراحل الأولى والثانية والثالثة وفحص الواجهات:
  - كود الكوميت: `539b6dd` (`feat: complete Phase 1-3 platform upgrades, operational risk register, and pre-deployment UI mobile audit fixes`).
  - حالة شجرة العمل: `working tree clean` (جاهزة للرفع فوراً).

---

## 2. خطوات التنفيذ خطوة بخطوة (Step-by-Step Execution)

---

### الخطوة الأولى: تحديث قاعدة البيانات السحابية (Neon Database Schema Sync)

> [!IMPORTANT]
> **الهدف:** تطبيق الجداول الجديدة المضافة في المرحلتين الثانية والثالثة (منظومة البلاغات الميدانية `Incidents`، التنبيهات الأمنية `Alerts`، سجل المخاطر التشغيلية الميدانية `OperationalRisk`، ومصفوفة الصلاحيات والحصريات `ClientPublicationAccess`) على قاعدة بيانات Neon السحابية، دون المساس بأي بيانات سابقة.

#### الأمر المطلوب تنفيذه في PowerShell:
افتح نافذة **Windows PowerShell** في مجلد `D:\FACSSS`، ونفّذ الأمر التالي لمزامنة الجداول مع Neon مباشرة:

```powershell
$env:DATABASE_URL="postgresql://neondb_owner:npg_JAcyQoO0m5Gs@ep-plain-river-b1x6n7oh-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require"
npx prisma db push
```

#### النتيجة المتوقعة:
```text
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-plain-river-b1x6n7oh-pooler.c-5.eu-central-1.aws.neon.tech"

Applying the following changes to database:
  - CreateEnum Role values (FIELD_FOCAL_POINT)
  - CreateTable IncidentReport
  - CreateTable IncidentVerification
  - CreateTable IncidentAssignment
  - CreateTable IncidentOriginal
  - CreateTable IncidentRedacted
  - CreateTable IncidentAttachment
  - CreateTable SecurityAlert
  - CreateTable SecurityAlertRecipient
  - CreateTable OperationalRisk
  - CreateTable RiskAssessmentHistory
  - CreateTable RiskMitigationAction
  - CreateTable RiskLinkedIncident
  - CreateTable ClientPublicationAccess

✔ Your database is now in sync with your Prisma schema.
```

*(اختياري)* بعد مزامنة الجداول، يمكنك تشغيل سكربت توليد بيانات الهوية المعتمدة على Neon:
```powershell
node scripts/seed.js
```

---

### الخطوة الثانية: الرفع إلى مستودع GitHub (`git push`)

> [!IMPORTANT]
> **الهدف:** رفع الكود المحدث بالكامل مع كافة تقارير المراحل والواجهات المحسنة إلى فرع `main` في مستودع GitHub الخاص بحسابك `zalmawry73-dot`.

#### الأمر المطلوب تنفيذه في PowerShell:
```powershell
git push origin main
```

#### التعامل مع بيانات الاعتماد (Windows Credential Manager) كما في المرة السابقة:
إذا ظهرت رسالة تطلب المصادقة أو ظهر خطأ أذونات:
1. **الخيار التلقائي الأسهل:** ستظهر لك نافذة متصفح صغيرة تطلب: **Sign in with your browser**. اضغط عليها وسيتم تأكيد حساب `zalmawry73-dot` تلقائياً ويكتمل الرفع في ثوانٍ.
2. **إذا ظهر لك خطأ يخص الحساب القديم (`ZakariaAlmawri`):**
   نفذ الأمر التالي في PowerShell لتحديد الحساب الجديد:
   ```powershell
   git remote set-url origin https://zalmawry73-dot@github.com/zalmawry73-dot/facss-platform.git
   git push origin main
   ```
   أو ادخل إلى إعدادات المستودع على GitHub: `https://github.com/zalmawry73-dot/facss-platform/settings/access` وتأكد من إضافة الحساب المخول.

#### النتيجة المتوقعة:
```text
Enumerating objects: ...
Counting objects: 100% ...
Compressing objects: 100% ...
Writing objects: 100% ...
To https://github.com/zalmawry73-dot/facss-platform.git
   d04bd44..539b6dd  main -> main
```

---

### الخطوة الثالثة: النشر التلقائي والمتابعة على Vercel

> [!TIP]
> بمجرد اكتمال `git push` إلى فرع `main`، تقوم منصة **Vercel** تلقائياً باكتشاف الكوميت الجديد وبدء عملية البناء والنشر السحابي (Automated CI/CD).

#### 1. متابعة النشر عبر لوحة Vercel:
1. افتح متصفحك وتوجه إلى لوحة تحكم المشروع على Vercel:  
   👉 **`https://vercel.com/dashboard`** (أو صفحة مشروع `facss-platform`).
2. ستجد في قسم **Deployments** عملية بناء جارية تحمل عنوان الكوميت الأخير:  
   `feat: complete Phase 1-3 platform upgrades...`
3. يستغرق البناء عادة ما بين 60 إلى 90 ثانية.

#### 2. التأكد من متغيرات البيئة (Environment Variables) في Vercel:
تأكد من وجود المتغيرات التالية في إعدادات المشروع على Vercel (`Project Settings` -> `Environment Variables`):

| المتغير (Variable) | القيمة المعتمدة (Value) | الغرض |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_JAcyQoO0m5Gs@ep-plain-river-b1x6n7oh-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require` | الاتصال السحابي بقاعدة Neon عبر مجمع الاتصالات (Connection Pooler) |
| `AUTH_SECRET` | `facss-aden-security-platform-dev-secret-key-2026-min-32-chars` *(أو المفتاح السري الذي أنشأته)* | تشفير وحماية توكنات JWT وجلسات المستخدمين |
| `APP_URL` | `https://facss-platform.vercel.app` | الرابط الأساسي للمنصة المستخدم في الإشعارات والتحقق |
| `STORAGE_DRIVER` | `local` | نمط التخزين |

#### 3. فحص الموقع المباشر بعد انتهاء النشر:
افتح رابط المنصة المنشور مباشرة:
👉 **`https://facss-platform.vercel.app`**

---

## 3. قائمة التحقق السريع من الميزات الجديدة على الرابط المنشور

بعد اكتمال النشر على Vercel، اختبر الميزات الجديدة مباشرة من المتصفح أو الهاتف:

1. **الصفحة الرئيسية والهوية الجديدة:** التأكد من ظهور مسمى **«مركز عدن الدولي للسلامة والدراسات الميدانية (AICSFA)»** والشعار عالي الدقة.
2. **بوابة التحقق الرقمي الموحد (`/verify`):** تجربة البحث عن شهادة أو وثيقة والتأكد من تجاوب الكارت على الهاتف والكمبيوتر.
3. **لوحة التحكم وسجل المخاطر التشغيلية (`/admin/risks`):**
   - تسجيل الدخول بحساب المسؤول.
   - معاينة مصفوفة المخاطر 5×5 التفاعلية وتمريرها لمسياً.
   - فتح شاشة تفاصيل الخطر `/admin/risks/[id]`.
   - اختبار فتح المودالات والتأكد من احتواء الحقول بدقة على شاشة الهاتف.
4. **بوابة التنسيق الميداني (`/portal/field/intake`):** التأكد من وصول نقطة الاتصال الميدانية ونموذج الإدخال المباشر.
5. **بوابة العملاء (`/portal/client`):** التأكد من استعراض البلاغات المنقحة والدراسات المخصصة فقط.

---

## 4. سكربت تنفيذي سريع بنقرة واحدة (One-Click PowerShell Command)

إذا كنت ترغب بتنفيذ الخطوتين (تحديث Neon + الرفع إلى GitHub) معاً بأمر واحد متكامل في PowerShell:

```powershell
cd D:\FACSSS; $env:DATABASE_URL="postgresql://neondb_owner:npg_JAcyQoO0m5Gs@ep-plain-river-b1x6n7oh-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require"; npx prisma db push; git push origin main
```
