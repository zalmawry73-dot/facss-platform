# تقرير الإنجاز النهائي للمرحلة 2F: التعريب واللغات وحوكمة المحتوى ونظام الإشعارات الداخلي
# FACSS PHASE 2F — FINAL LOCALIZATION, CONTENT GOVERNANCE & NOTIFICATIONS REPORT

**المشروع:** منصة مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية (FACSS)  
**المرجع المؤسسي:** Aden First Center for Security Services and Strategic Studies  
**تاريخ الإنجاز والاعتماد:** 15 سبتمبر 2026  
**حالة التدقيق:** معتمد ومكتمل بنسبة 100% (23/23 اختبارات المرحلة + 70/70 اختبارات الواجهة + بناء الإنتاج 37/37 مساراً)  
**التقارير المرجعية السابقة:**
1. `FACSS_MASTER_AUDIT_REPORT.md`
2. `FACSS_SECURITY_PHASE1_REPORT.md`
3. `FACSS_PHASE2A_FOUNDATION_REPORT.md`
4. `FACSS_PHASE2B_ADMIN_OPERATIONS_REPORT.md`
5. `FACSS_PHASE2C_CLIENT_DOCUMENTS_REPORT.md`
6. `FACSS_PHASE2D_TRAINING_CERTIFICATES_REPORT.md`
7. `FACSS_PHASE2E_UX_UI_REPORT.md`

---

## الفهرس العام للأقسام الـ 41 المعتمدة (Table of Contents)

1. [الملخص التنفيذي والسياق المؤسسي (Executive Summary & Context)](#1-الملخص-التنفيذي-والسياق-المؤسسي)
2. [معمارية التعريب واللغة وحفظ التفضيلات (Localization & Persistence Architecture)](#2-معمارية-التعريب-واللغة-وحفظ-التفضيلات)
3. [محرك التبديل الفوري دون وميض ومعالجة الاتجاه (Zero-Flicker & SSR Lang/Dir)](#3-محرك-التبديل-الفوري-دون-وميض)
4. [معمارية القاموس المركزي وتكافؤ المفاتيح (Centralized Dictionary & Key Parity)](#4-معمارية-القاموس-المركزي-وتكافؤ-المفاتيح)
5. [تعريب الترويسة ونظام التنقل المزدوج (Header & Navigation Localization)](#5-تعريب-الترويسة-ونظام-التنقل-المزدوج)
6. [تعريب التذييل والروابط السريعة (Footer & Quick Links Localization)](#6-تعريب-التذييل-والروابط-السريعة)
7. [تعريب الصفحة الرئيسية بأقسامها الستة كاملة (Homepage Sections 1-6 Localization)](#7-تعريب-الصفحة-الرئيسية-بأقسامها-الستة)
8. [تعريب صفحة من نحن وحوكمة الادعاءات (About Page & Heritage Governance)](#8-تعريب-صفحة-من-نحن-وحوكمة-الادعاءات)
9. [تعريب الخدمات وصفحاتها التفصيلية (Services & Slug Catalog Localization)](#9-تعريب-الخدمات-وصفحاتها-التفصيلية)
10. [تعريب أكاديمية التدريب ودليل البرامج (Training Academy & Catalog Localization)](#10-تعريب-أكاديمية-التدريب-ودليل-البرامج)
11. [بوابة البحوث والدراسات وبوابة الأمان المشددة (Research Portal & Visibility Gate)](#11-بوابة-البحوث-والدراسات-وبوابة-الأمان)
12. [تعريب غرفة العمليات والتواصل المؤسسي (Contact & Operational Office Localization)](#12-تعريب-غرفة-العمليات-والتواصل-المؤسسي)
13. [تعريب نموذج طلب الخدمة ورموز التتبع (Service Request Wizard Localization)](#13-تعريب-نموذج-طلب-الخدمة-ورموز-التتبع)
14. [تعريب بطاقة التحقق من الشهادات الرقمية (Credential Verification Card Localization)](#14-تعريب-بطاقة-التحقق-من-الشهادات)
15. [تعريب شاشات الدخول واختيار نوع الحساب (Authentication & Role Selector Localization)](#15-تعريب-شاشات-الدخول-واختيار-نوع-الحساب)
16. [تعريب لوحة تحكم الإدارة ومؤشراتها الأربعة (Admin Dashboard & Actionable KPIs Localization)](#16-تعريب-لوحة-تحكم-الإدارة)
17. [تعريب بوابة العملاء ومسار متابعة الطلبات (Client Portal & Timeline Localization)](#17-تعريب-بوابة-العملاء-ومسار-متابعة-الطلبات)
18. [تعريب بوابة المتدربين وعرض الشهادات (Trainee Portal & Cert Showcase Localization)](#18-تعريب-بوابة-المتدربين-وعرض-الشهادات)
19. [منظومة شارات الحالة المزدوجة والمطابقة الدلالية (StatusBadge Bilingual Engine)](#19-منظومة-شارات-الحالة-المزدوجة)
20. [محرك تنسيق التواريخ والأوقات حسب اللغة المختارة (Date & Time Localized Formatting)](#20-محرك-تنسيق-التواريخ-والأوقات)
21. [حوكمة المحتوى المؤسسي ومسوغات تدقيق الحقيقة (Content Governance & Truth Rationale)](#21-حوكمة-المحتوى-المؤسسي-ومسوغات-تدقيق-الحقيقة)
22. [استئصال أرقام الهواتف الوهمية والمواقع غير المعتمدة (Eradication of Placeholder Coordinates)](#22-استئصال-أرقام-الهواتف-الوهمية)
23. [إزالة ادعاءات الخبرة غير الموثقة وتعديل صياغة الكوادر (Eradication of Unverified Experience Claims)](#23-إزالة-ادعاءات-الخبرة-غير-الموثقة)
24. [طبقة بيانات إعدادات النظام المرجعية وحالات البدائل (Authoritative SystemSetting Data Layer)](#24-طبقة-بيانات-إعدادات-النظام-المرجعية)
25. [بوابة أمان فصل الأبحاث العامة عن أبحاث العملاء (Public vs Client Research Isolation)](#25-بوابة-أمان-فصل-الأبحاث)
26. [معمارية نظام الإشعارات الداخلي والنموذج البياني (Notification System Architecture & Schema)](#26-معمارية-نظام-الإشعارات-الداخلي)
27. [واجهة جلب الإشعارات والتقسيم المصفح (GET /api/notifications & Pagination)](#27-واجهة-جلب-الإشعارات-والتقسيم-المصفح)
28. [واجهة تحديد الإشعار كمقروء والحماية الصارمة من IDOR (PATCH /api/notifications/[id]/read)](#28-واجهة-تحديد-الإشعار-كمقروء)
29. [واجهة تحديد الكل كمقروء للمستخدم المصادق (POST /api/notifications/read-all)](#29-واجهة-تحديد-الكل-كمقروء)
30. [خطاف دورة الحياة: تقديم طلب الخدمة الجديد (Hook: Service Request Submission)](#30-خطاف-دورة-الحياة-تقديم-طلب-الخدمة)
31. [خطاف دورة الحياة: تحديث حالة طلب الخدمة (Hook: Service Request Status Transition)](#31-خطاف-دورة-الحياة-تحديث-حالة-طلب-الخدمة)
32. [خطاف دورة الحياة: رفع ونشر التقرير الأمني النهائي (Hook: Final Report Upload)](#32-خطاف-دورة-الحياة-رفع-ونشر-التقرير-النهائي)
33. [خطاف دورة الحياة: تقديم طلب الالتحاق بالدورة (Hook: Training Registration Submission)](#33-خطاف-دورة-الحياة-تقديم-طلب-التدريب)
34. [خطاف دورة الحياة: قرار قبول/رفض/انتظار المتدرب (Hook: Registration Status Decision)](#34-خطاف-دورة-الحياة-قرار-تسجيل-المتدرب)
35. [خطاف دورة الحياة: إصدار الشهادة التدريبية المعتمدة (Hook: Certificate Issuance)](#35-خطاف-دورة-الحياة-إصدار-الشهادة)
36. [خطاف دورة الحياة: إشعار إلغاء الشهادة الفوري (Hook: Certificate Revocation Alert)](#36-خطاف-دورة-الحياة-إشعار-إلغاء-الشهادة)
37. [مكون جرس الإشعارات وعداد التنبيهات التفاعلي (NotificationBell Component & Badge Counter)](#37-مكون-جرس-الإشعارات-وعداد-التنبيهات)
38. [حماية الخصوصية والحد الأدنى للبيانات في نصوص الإشعارات (Privacy & Data Minimization in Notifications)](#38-حماية-الخصوصية-والحد-الأدنى-للبيانات)
39. [جناح الاختبارات الآلية الشامل لـ 23 فحصاً (Automated Test Suite: 23 Tests)](#39-جناح-الاختبارات-الآلية-الشامل)
40. [فحوصات عدم التراجع الشاملة وبناء الإنتاج (Multi-Suite Regressions & Production Build)](#40-فحوصات-عدم-التراجع-الشاملة-وبناء-الإنتاج)
41. [إقرار اعتماد المرحلة 2F وبروتوكول التوقف التام (Phase Sign-Off & Strict Stopping Protocol)](#41-إقرار-اعتماد-المرحلة-2f)

---

## 1. الملخص التنفيذي والسياق المؤسسي

تُعد المرحلة **Phase 2F** الركيزة المتممة لضمان النضج المؤسسي والتشغيلي لمنصة مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية (FACSS). ركزت المرحلة على ثلاثة محاور جوهرية غير قابلة للمساومة:
1. **التعريب والازدواج اللغوي الشامل (Arabic / English)**: بناء منظومة ترجمة مركزية رصينة بدون أي وميض أو تفاوت بين خادم العرض والمتصفح (Zero-Hydration Flicker)، ودعم كامل للاتجاهين (RTL / LTR).
2. **حوكمة المحتوى وتدقيق الحقيقة المؤسسية (Content Governance & Truth Audit)**: التطهير الصارم لكافة الأرقام والادعاءات غير الموثقة (مثل أرقام الواتساب الوهمية، وإحصائيات "+20 عاماً"، وروابط التواصل المفتعلة)، وربط كافة البيانات المعتمدة بجدول `SystemSetting` المرجعي.
3. **نظام الإشعارات الداخلي والخطافات التشغيلية (In-App Notification Engine)**: تفعيل نموذج `Notification` القائم في Prisma دون الحاجة لأي ترحيل بياني (Zero Database Migrations)، مع واجهات برمجية مؤمنة ضد هجمات الـ IDOR، وخطافات تلقائية مع كافة أحداث الخدمات والتدريب والشهادات، ومكون جرس تنبيهات تفاعلي فائق الأناقة.

---

## 2. معمارية التعريب واللغة وحفظ التفضيلات

تم تصميم معمارية التعريب لتكون هجينة ومتوافقة مع كلاً من Server Components وClient Components:
- **الملف المرجعي:** `lib/i18n.ts` يحتوي على نوع `Locale = 'ar' | 'en'` وقاموس ثنائي متطابق بالكامل.
- **تخزين التفضيل اللغوي المزدوج:** يتم حفظ خيار المستخدم في كوكيز المتصفح `facss_locale` بصلاحية 365 يوماً وسياق `SameSite=Lax; path=/`، بالإضافة إلى نسخه في `localStorage` كاحتياط للمكونات التفاعلية.

```typescript
// آلية حفظ الكوكيز المتزامنة في contexts/LanguageContext.tsx
const setLocale = (newLocale: Locale) => {
  setLocaleState(newLocale);
  setCookie('facss_locale', newLocale);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('facss_locale', newLocale);
  }
  document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = newLocale;
};
```

---

## 3. محرك التبديل الفوري دون وميض ومعالجة الاتجاه

تخلصت المنصة من مشكلة "وميض اللغة والاتجاه" (Flicker / Layout Shift) من خلال قراءة الكوكيز من جانب الخادم في `app/layout.tsx`:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const initialLocale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const dir = initialLocale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={initialLocale} dir={dir}>
      <body>
        <AuthProvider>
          <LanguageProvider initialLocale={initialLocale}>
            ...
```

---

## 4. معمارية القاموس المركزي وتكافؤ المفاتيح

يغطي القاموس الموحد في `lib/i18n.ts` أكثر من 270 مفتاحاً دلالياً، مع تطابق تام بنسبة 100% بين `translations.ar` و`translations.en` في كافة الأقسام:
- الهوية والترويسة (Brand & Header)
- التنقل والقوائم (Navigation)
- الواجهة الرئيسية والركائز الوقائية (Hero & Pillars)
- الرؤية والرسالة والقيم الجوهرية الست (Vision, Mission & 6 Core Values)
- الخدمات المعتمدة والأكاديمية والدراسات (Services, Training & Research)
- المصادقة والدخول والتسجيل (Authentication & Role Selectors)
- لوحات التحكم والعمليات (Portals & Admin CMS)
- حالات الكيانات والنظام (Status Mappings)

---

## 5. تعريب الترويسة ونظام التنقل المزدوج

يقدم مكون `components/Header.tsx` تجربة ثنائية اللغة متكاملة:
- اسم المركز الرسمي بالعربية ("مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية") وبالإنجليزية ("Aden First Center for Security Services and Strategic Studies").
- زر التبديل اللغوي السريع مع أيقونة Globe.
- قوائم التصفح المتجاوبة التي تعكس الاتجاه (RTL/LTR) فوراً.

---

## 6. تعريب التذييل والروابط السريعة

يعتمد `components/Footer.tsx` على الاستهلاك المباشر لمفاتيح الترجمة وقراءة إعدادات النظام من `/api/settings/public`، مع إبراز الإفصاح المؤسسي: "مؤسسة أمنية واستراتيجية مرخصة وفق القوانين واللوائح الوطنية — عدن، الجمهورية اليمنية".

---

## 7. تعريب الصفحة الرئيسية بأقسامها الستة كاملة

تم تعريب كافة أقسام الصفحة الرئيسية الستة المعتمدة في المرحلة 2E:
1. الواجهة الرئيسية (Hero Section) مع شعار "الوقاية قبل الاستجابة".
2. الركائز الوقائية الست (6 Preventive Pillars).
3. منظومة الخدمات الأمنية المعتمدة (Operational Security Services).
4. نقاط القوة والاعتمادات المؤسسية (Institutional Credentials).
5. أكاديمية التدريب ومركز الدراسات (Academy & Strategic Studies).
6. الإجراء الختامي وطلب الخدمة (Final CTA).

---

## 8. تعريب صفحة من نحن وحوكمة الادعاءات

في `app/about/page.tsx`:
- تعريب كامل للرؤية والرسالة والقيم المؤسسية الست.
- تعريب المراحل التشغيلية الأربع لحماية المنشآت.
- استبدال أي ادعاءات زمنية غير موثقة بصياغة تركز على كفاءة الكوادر الميدانية والضباط الاستشاريين المشرفين.

---

## 9. تعريب الخدمات وصفحاتها التفصيلية

في `app/services/page.tsx` و`app/services/[slug]/page.tsx`:
- قراءة الكوكيز من جانب الخادم وعرض `titleAr` أو `titleEn`، والوصف المختصر والمفصل والمراحل التشغيلية والقطاعات المستهدفة بصورة ديناميكية كاملة.

---

## 10. تعريب أكاديمية التدريب ودليل البرامج

في `app/training/page.tsx`:
- عرض كافة الدورات المفتوحة مع العناوين الثنائية، المدة التدريبية، الموقع، والشهادات المعتمدة، مع نصوص عربية وإنجليزية رصينة تبرز تأهيل الكوادر والشباب في المهن الأمنية وحماية المنشآت.

---

## 11. بوابة البحوث والدراسات وبوابة الأمان المشددة

في `app/research/page.tsx`:
- **إجراء أمني حاسم:** حظر تام لأي تسريب لدراسات العملاء الخاصة `CLIENT_ONLY` للزوار المجهولين.
- يقتصر الاستعلام العام على:
```typescript
const allowedVisibilities: ('PUBLIC' | 'CLIENT_ONLY')[] = ['PUBLIC'];
if (session && (session.role === 'CLIENT' || session.role === 'SUPER_ADMIN' || session.role === 'ADMIN' || session.role === 'STAFF' || session.role.includes('MANAGER'))) {
  allowedVisibilities.push('CLIENT_ONLY');
}
```
- تعريب عناوين الفئات والملخصات والتواريخ.

---

## 12. تعريب غرفة العمليات والتواصل المؤسسي

في `app/contact/page.tsx`:
- نموذج التواصل والاستفسار مع كافة حقول الإدخال والتحقق المعربة.
- بطاقة "مبدأ السرية التامة" (Strict Confidentiality Protocol) لحماية خصوصية بيانات المنشآت والعملاء.
- عرض الإحداثيات الرسمية المعتمدة المستقاة من قاعدة البيانات.

---

## 13. تعريب نموذج طلب الخدمة ورموز التتبع

في `app/request-service/page.tsx`:
- شاشة متعددة المراحل لطلب الخدمة مع اختيار الأولوية ونوع المنشأة.
- شاشة التأكيد مع توليد الرمز المرجعي الفريد بصيغة `FACSS-SR-YYYY-XXXXXX`، وروابط المتابعة المباشرة في بوابة العميل.

---

## 14. تعريب بطاقة التحقق من الشهادات الرقمية

في `app/verify/[code]/page.tsx`:
- قراءة كود التحقق ومطابقته بقاعدة البيانات.
- إظهار البطاقة المعتمدة بحالتها الثلاث: صالحة (VALID)، ملغاة (REVOKED)، أو غير موجودة (NOT_FOUND).
- **حماية خصوصية أسباب الإلغاء:** عدم تسريب `revokedReason` للعامة التزاماً بالمعايير الأمنية المعتمدة في المرحلتين 2D و2E.

---

## 15. تعريب شاشات الدخول واختيار نوع الحساب

في `app/login/page.tsx` و`app/register/page.tsx`:
- تعريب كامل للنماذج والأخطاء والزر التبادلي لاختيار نوع الحساب (حساب جهة / عميل مؤسسي مقابل حساب متدرب أمني).

---

## 16. تعريب لوحة تحكم الإدارة ومؤشراتها الأربعة

في `app/admin/page.tsx`:
- تعريب شريط المؤشرات التشغيلية الأربعة الموجهة للإجراء (Actionable KPIs).
- تعريب شريط إجماليات المنصة (Platform Totals Strip).
- تعريب جدول أحدث الطلبات وسجل التدقيق الإداري الحي (Audit Trail).

---

## 17. تعريب بوابة العملاء ومسار متابعة الطلبات

في `app/portal/client/page.tsx`:
- تعريب بطاقات الإحصائيات (الطلبات النشطة، المكتملة، التقارير الجاهزة، إجمالي الطلبات).
- تعريب شريط التنبيه بوجود تقارير أمنية نهائية معتمدة جاهزة للتنزيل الفوري.
- تعريب جدول الطلبات ومسار المتابعة.

---

## 18. تعريب بوابة المتدربين وعرض الشهادات

في `app/portal/trainee/page.tsx` و`courses/` و`certificates/`:
- تعريب بطاقات الإنجاز (الدورات المسجل بها، الشهادات المعتمدة، البرامج المكتملة).
- تعريب بطاقة المعاينة الفاخرة للشهادة التدريبية الرقمية (Digital Credential Preview) مع رابط التحقق المباشر.

---

## 19. منظومة شارات الحالة المزدوجة والمطابقة الدلالية

في `components/StatusBadge.tsx`:
- استهلاك سياق اللغة النشط `useLanguage()` واختيار `labelEn` أو `labelAr` تلقائياً عبر 6 جداول حالات نظامية:
  1. `serviceRequest` (NEW, UNDER_REVIEW, CONTACTED, WAITING_FOR_CLIENT, APPROVED, IN_PROGRESS, REPORT_READY, COMPLETED, CANCELLED)
  2. `trainingRegistration` (PENDING, REVIEWING, ACCEPTED, REJECTED, WAITLIST, COMPLETED)
  3. `course` (OPEN, CLOSED, DRAFT, FULL, ONGOING)
  4. `certificate` (VALID, REVOKED)
  5. `contactMessage` (UNREAD, READ, REPLIED, ARCHIVED)
  6. `user` (ACTIVE, INACTIVE)

---

## 20. محرك تنسيق التواريخ والأوقات حسب اللغة المختارة

تم بناء دالة `formatDate(dateInput, locale)` في `lib/i18n.ts`:
- للغة العربية: تعتمد التقويم الإقليمي `ar-YE` مع أسماء الأشهر العربية الكاملة.
- للغة الإنجليزية: تعتمد `en-US` مع أسماء الأشهر الإنجليزية والأرقام القياسية.

---

## 21. حوكمة المحتوى المؤسسي ومسوغات تدقيق الحقيقة

التزاماً بمبدأ الأمانة المؤسسية لمركز أمني واستراتيجي رفيع المستوى:
- تم منع كافة أشكال التهويل أو وضع إحصائيات غير موثقة بسجلات رسمية.
- استبدال أرقام السنين الاعتباطية بالتركيز على مؤهلات الكوادر الأمنية والخبرة الميدانية للمدربين والضباط المشرفين.

---

## 22. استئصال أرقام الهواتف الوهمية والمواقع غير المعتمدة

- تم حذف الرقم الوهمي `+967 777 000 111` بالكامل من كافة ملفات الإعدادات والصفحات والنماذج.
- تم ضبط الحقول الافتراضية لأرقام الواتساب وروابط منصات التواصل الاجتماعي لتكون فارغة ما لم يقم مدير النظام بإدخالها واعتمادها عبر لوحة إعدادات النظام.

---

## 23. إزالة ادعاءات الخبرة غير الموثقة وتعديل صياغة الكوادر

- استبدال نصوص "خبرة تتجاوز 20 عاماً" في كافة الواجهات بعبارات مهنية موثوقة: "نخبة من الكوادر الأمنية والاستشارية والمدربين الميدانيين ذوي الكفاءة العالية وسجل حافل بالجاهزية والانضباط".

---

## 24. طبقة بيانات إعدادات النظام المرجعية وحالات البدائل

في `lib/settings.ts`:
- توفير دالة `getPublicSettings()` التي تسترجع البيانات الرسمية من جدول `SystemSetting` بقاعدة البيانات، مع قيم بديلة آمنة ومعتمدة (Safe Honest Defaults) في حال عدم تهيئة السجلات.

---

## 25. بوابة أمان فصل الأبحاث العامة عن أبحاث العملاء

- يمنع منعاً باتاً استعراض أو تنزيل الأوراق البحثية والتقارير الاستراتيجية المصنفة كـ `CLIENT_ONLY` أو `PRIVATE` لغير المصادقين من ذوي الأدوار المخولة، لضمان حماية الملكية الفكرية والدراسات الأمنية الحساسة.

---

## 26. معمارية نظام الإشعارات الداخلي والنموذج البياني

يعتمد النظام على نموذج `Notification` القائم في `prisma/schema.prisma`:
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  titleAr   String
  titleEn   String
  messageAr String
  messageEn String
  type      String   @default("INFO") // INFO, SUCCESS, WARNING, ALERT
  link      String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
}
```
مع صفر ترحيلات بيانية (Zero Schema Migrations).

---

## 27. واجهة جلب الإشعارات والتقسيم المصفح

في `app/api/notifications/route.ts`:
- مسار `GET` محمي يتطلب جلسة مستخدم نشطة ومفعلة (`isActive === true`).
- يفرض عزل الحساب التام: `where: { userId: session.userId }`.
- يدعم التصفح بالصفحات (`page`, `limit`) والتصفية (`unreadOnly=true`).
- يرجع عدد الإشعارات غير المقروءة بدقة `unreadCount`.

---

## 28. واجهة تحديد الإشعار كمقروء والحماية الصارمة من IDOR

في `app/api/notifications/[id]/read/route.ts`:
- مسار `PATCH` محمي يمنع هجمات التعدي على المعرفات غير الآمنة:
```typescript
if (notification.userId !== session.userId) {
  return NextResponse.json({ error: 'غير مصرح بالوصول لهذا الإشعار' }, { status: 403 });
}
```

---

## 29. واجهة تحديد الكل كمقروء للمستخدم المصادق

في `app/api/notifications/read-all/route.ts`:
- مسار `POST` سريع يقوم بتحديث جميع إشعارات المستخدم غير المقروءة دفعة واحدة:
`prisma.notification.updateMany({ where: { userId: session.userId, isRead: false }, data: { isRead: true } })`

---

## 30. خطاف دورة الحياة: تقديم طلب الخدمة الجديد

في `app/api/requests/route.ts`:
- عند تقديم طلب خدمة جديد من عميل مسجل، يتم فوراً إرسال إشعار تأكيد ثنائي اللغة يوثق رقم الطلب ورابط المتابعة.

---

## 31. خطاف دورة الحياة: تحديث حالة طلب الخدمة

في `app/api/requests/[id]/route.ts`:
- عند تعديل مسؤول العمليات لحالة الطلب، يتم إنشاء إشعار تلقائي لصاحب الطلب لتحديثه بالحالة التشغيلية الجديدة.

---

## 32. خطاف دورة الحياة: رفع ونشر التقرير الأمني النهائي

في `app/api/requests/[id]/documents/route.ts`:
- عند رفع مستند مصنف كـ `FINAL_REPORT` و`CLIENT_VISIBLE`، يتم إرسال إشعار بنوع `SUCCESS` ينبه العميل بجاهزية تقريره الأمني المعتمد للتنزيل.

---

## 33. خطاف دورة الحياة: تقديم طلب الالتحاق بالدورة

في `app/api/training/register/route.ts`:
- عند تسجيل المتدرب في دورة تدريبية، يتلقى إشعاراً فورياً بتأكيد استلام الطلب وإحالته للمراجعة الإدارية.

---

## 34. خطاف دورة الحياة: قرار قبول/رفض/انتظار المتدرب

في `app/api/admin/training/registrations/[id]/route.ts`:
- عند اتخاذ إدارة التدريب قراراً بشأن طلب التسجيل، يتم إرسال إشعار فوري بحالة القبول أو الإدراج في قائمة الانتظار.

---

## 35. خطاف دورة الحياة: إصدار الشهادة التدريبية المعتمدة

في `app/api/admin/training/certificates/route.ts`:
- عند اعتماد وإصدار الشهادة للمتدرب المجتاز، يتم إرسال إشعار تهنئة موثق برقم الشهادة ورابط المعاينة في البوابة.

---

## 36. خطاف دورة الحياة: إشعار إلغاء الشهادة الفوري

في `app/api/admin/training/certificates/[id]/route.ts`:
- في حال إلغاء أي شهادة تدريبية رسمية، يتم إرسال إشعار تنبيهي فوري من نوع `ALERT` للمتدرب لإبلاغه بقرار الإلغاء وضرورة مراجعة الإدارة.

---

## 37. مكون جرس الإشعارات وعداد التنبيهات التفاعلي

في `components/NotificationBell.tsx`:
- جرس أنيق ومدمج في ترويسة الموقع للمستخدمين المسجلين فقط.
- شارة حمراء بوهج خفيف تعرض عدد الإشعارات غير المقروءة بدقة.
- قائمة منسدلة فاخرة تعرض الإشعارات، مع إمكانية التحديد كمقروء عند النقر أو تحديد الكل دفعة واحدة.
- دعم كامل للتحديث الخلفي كل 45 ثانية عند تنشيط النافذة.

---

## 38. حماية الخصوصية والحد الأدنى للبيانات في نصوص الإشعارات

- تخلو كافة نصوص الإشعارات من أي بيانات حساسة، أو كلمات مرور، أو مسارات تخزين ملفات داخلية، وتقتصر على العناوين المؤسسية وأرقام المتابعة الرسمية والروابط المباشرة داخل المنصة.

---

## 39. جناح الاختبارات الآلية الشامل لـ 23 فحصاً

تم تنفيذ وتشغيل الجناح الآلي الكامل `scripts/test_phase2f_suite.js` والذي غطى 23 فحصاً شاملاً:
```
=============================================================
  FACSS PHASE 2F — BILINGUAL LOCALIZATION, TRUTH & NOTIFICATIONS
=============================================================

--- [Group 1: Localization & Dictionary Integrity] ---
  ✓ PASS: lib/i18n.ts centralized translations module exists
  ✓ PASS: Test 1: Centralized translations dictionary contains essential structural keys
  ✓ PASS: Test 2: Server-side cookie resolution reads facss_locale and resolves to en/ar
  ✓ PASS: Test 3: RootLayout sets dynamic html lang and dir attributes based on cookie
  ✓ PASS: Test 4: StatusBadge component dynamically selects labelEn vs labelAr by active locale
  ✓ PASS: Test 5: Public pages support dynamic bilingual database content switching
  ✓ PASS: Test 6: formatDate helper localizes calendar dates according to active locale

--- [Group 2: Content Governance & Truth Audit] ---
  ✓ PASS: Test 7a: Zero placeholder WhatsApp (+967 777 000 111) in default settings and contact page
  ✓ PASS: Test 7b: Unverified "+20 years" institutional claims successfully refactored into verified cadre phrasing
  ✓ PASS: Test 8: SystemSetting database records are authoritative for coordinates with fallback
  ✓ PASS: Test 9: Public research page strictly restricts anonymous queries to PUBLIC publications

--- [Group 3: In-App Notification System & Event Hooks] ---
  ✓ PASS: Test 10: All 3 In-App Notification API routes exist and are defined
  ✓ PASS: Test 11: GET /api/notifications requires authenticated session and active user in DB
  ✓ PASS: Test 12: PATCH /api/notifications/[id]/read strictly forbids cross-user access (Anti-IDOR 403)
  ✓ PASS: Test 13: Query filter strictly enforces userId: session.userId ensuring zero cross-tenant leakage
  ✓ PASS: Test 14: Service request submit and status change trigger bilingual notifications to client
  ✓ PASS: Test 15: Training registration submission and status change trigger bilingual notifications to trainee
  ✓ PASS: Test 16: Certificate issuance and revocation trigger immediate high-priority notifications
  ✓ PASS: Test 17: Mark as read endpoint updates target notification isRead to true
  ✓ PASS: Test 18: Mark-all-as-read updates all unread notifications exclusively for authenticated user
  ✓ PASS: Test 19: Unread count query is calculated via dedicated unread count aggregation
  ✓ PASS: Test 20: NotificationBell is integrated into Header for authenticated users with zero sensitive data exposure
  ✓ PASS: Live DB verification: Notification table queried successfully

=============================================================
  PHASE 2F TEST SUMMARY: 23 PASSED, 0 FAILED
=============================================================
```

---

## 40. فحوصات عدم التراجع الشاملة وبناء الإنتاج

1. **جناح الهوية وتجربة المستخدم (Phase 2E Suite):** نجاح 70/70 اختباراً.
2. **فحص الأنواع البرمجية (TypeScript Check):** صفر أخطاء عبر `npx tsc --noEmit`.
3. **بناء الإنتاج (Production Build):** تم تصدير وبناء كافة مسارات التطبيق الـ 37 بنجاح تام:
   - 37 Route تم تجميعها وإنشاؤها بشكل مثالي (Static & Dynamic SSR).
   - Middleware مفعل بكفاءة لحماية كافة البوابات الإدارية والخاصة.

---

## 41. إقرار اعتماد المرحلة 2F وبروتوكول التوقف التام

بهذا يتم اعتماد إنجاز **المرحلة 2F (Bilingual Localization, Content Governance & Notifications)** رسمياً وبأعلى معايير الجودة والامتثال الأمني.

> [!IMPORTANT]
> **بروتوكول التوقف التام (Strict Stopping Protocol):**
> تم استكمال كافة متطلبات المرحلة 2F بنجاح 100%. ووفقاً للتعليمات الصارمة، يتوقف العمل هنا تماماً للمراجعة والاعتماد المؤسسي، دون الانتقال إلى أي مرحلة تالية إلا بطلب وتوجيه صريح من المستخدم.
