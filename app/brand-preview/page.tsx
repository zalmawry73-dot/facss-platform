import React from "react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "مراجعة حزمة الهوية البصرية | مركز الحلول المتكاملة للأمن والسلامة",
  description: "استعراض ومراجعة أصول الشعار الجديد المستخرجة قبل اعتمادها النهائي في منصة FACSS",
};

export default function BrandPreviewPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#08281E] font-sans antialiased" dir="rtl">
      {/* Top Banner */}
      <div className="bg-[#08281E] text-white border-b border-[#B59254]/30 py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B59254]/20 border border-[#B59254]/40 text-[#CAAB6E] text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-[#CAAB6E] animate-pulse"></span>
              مرحلة التدقيق البصري — للمراجعة والاعتماد
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FAF9F6]">
              حزمة الأصول البصرية للشعار الجديد (Brand Assets Package)
            </h1>
            <p className="text-sm text-gray-300 mt-1">
              مركز الحلول المتكاملة للأمن والسلامة | Integrated Solutions Center for Safety and Security
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium text-white transition border border-white/20"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-12">
        {/* Executive Summary Card */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#0B3D2E] mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#B59254]"></span>
            ملخص الفحص الفني ودقة الأصول (Technical Asset Audit)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block text-xs">الصورة المرجعية الأصلية</span>
              <strong className="text-base text-gray-900 block mt-1">1024 × 700 px</strong>
              <span className="text-xs text-green-700 font-medium">JPEG بخلفية بيضاء نقية 100%</span>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block text-xs">منطقة المحتوى المستخرجة</span>
              <strong className="text-base text-gray-900 block mt-1">951 × 210 px</strong>
              <span className="text-xs text-green-700 font-medium">شفافية بدون أي هالات بيضاء</span>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block text-xs">أبعاد الدرع المستقل</span>
              <strong className="text-base text-gray-900 block mt-1">175 × 210 px</strong>
              <span className="text-xs text-[#0B3D2E] font-medium">كثافة Retina تتجاوز 5x لشاشات الويب</span>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block text-xs">منهجية الاستخراج</span>
              <strong className="text-base text-gray-900 block mt-1">Mathematical Alpha Matte</strong>
              <span className="text-xs text-blue-700 font-medium">مطابقة هندسية ولونية تامة 1:1</span>
            </div>
          </div>
        </section>

        {/* Section 1: Original vs Extracted */}
        <section className="space-y-6">
          <div className="border-r-4 border-[#B59254] pr-4">
            <h2 className="text-xl font-bold text-[#08281E]">
              1. المقارنة المباشرة بين الأصل والنسخ المستخرجة (Reference vs Extracted)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              التحقق من مطابقة المنحنيات وسماكة الخطوط وعدم وجود أي تشويه أو تداخل
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Source Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  الصورة المرجعية الأصلية (Original Source)
                </span>
                <span className="text-xs text-gray-400">1024 × 700 px JPEG</span>
              </div>
              <div className="p-6 bg-white rounded-xl border border-gray-100 flex items-center justify-center min-h-[220px]">
                <img
                  src="/images/brand/original-reference.jpg"
                  alt="Original Reference"
                  className="max-h-36 object-contain"
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                الصورة المعتمدة من العميل كمرجع رسمي للشكل والألوان والاسم
              </p>
            </div>

            {/* Extracted Horizontal Light */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  النسخة المستخرجة الكاملة — خلفيات فاتحة (Full Horizontal Light)
                </span>
                <span className="text-xs text-gray-400">951 × 210 px PNG شفاف</span>
              </div>
              <div className="p-6 bg-[#FAF9F6] rounded-xl border border-gray-100 flex items-center justify-center min-h-[220px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px]">
                <img
                  src="/images/brand/logo-horizontal-light.png"
                  alt="Extracted Logo Horizontal Light"
                  className="max-h-24 object-contain drop-shadow-sm"
                />
              </div>
              <p className="text-xs text-emerald-700 font-medium text-center">
                مفرغة بالكامل بخلفية شفافة (Transparent Alpha) دون أي هالة بيضاء
              </p>
            </div>
          </div>

          {/* Extracted Horizontal Dark */}
          <div className="bg-[#08281E] rounded-2xl p-6 sm:p-8 shadow-md border border-[#B59254]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-950/80 text-[#CAAB6E] border border-[#B59254]/40">
                النسخة الكاملة للخلفيات الداكنة (Full Horizontal Dark)
              </span>
              <span className="text-xs text-gray-400">951 × 210 px PNG شفاف</span>
            </div>
            <div className="p-8 bg-[#0B3D2E] rounded-xl border border-white/10 flex items-center justify-center min-h-[200px]">
              <img
                src="/images/brand/logo-horizontal-dark.png"
                alt="Extracted Logo Horizontal Dark"
                className="max-h-24 object-contain"
              />
            </div>
            <p className="text-xs text-gray-300 text-center">
              تم تحويل الإطار الخارجي وعلامة الصح إلى الأبيض الناصع، والقوس والنص العربي إلى الذهبي المؤسسي (#DAB980) لتحقيق تباين فائق (WCAG AAA)
            </p>
          </div>
        </section>

        {/* Section 2: Shield Emblem Variations */}
        <section className="space-y-6">
          <div className="border-r-4 border-[#B59254] pr-4">
            <h2 className="text-xl font-bold text-[#08281E]">
              2. رمز الدرع المستقل بألوانه وأحجامه (Standalone Shield Emblem)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              مخصص للاستخدام كأيقونة مستقلة، فافيكون، شارات التقارير، وفي الهيدر مع نص HTML
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light Shield Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="font-bold text-[#0B3D2E]">الدرع الأصلي — للخلفيات الفاتحة</span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">logo-symbol.png</span>
              </div>
              <div className="flex flex-wrap items-end justify-around gap-4 p-6 bg-[#FAF9F6] rounded-xl border border-dashed border-gray-300 min-h-[220px]">
                <div className="text-center">
                  <img src="/images/brand/logo-symbol.png" alt="210px" className="h-32 object-contain mx-auto" />
                  <span className="text-[11px] text-gray-500 block mt-2">الأصل (210px)</span>
                </div>
                <div className="text-center">
                  <img src="/images/brand/logo-symbol.png" alt="64px" className="h-16 object-contain mx-auto" />
                  <span className="text-[11px] text-gray-500 block mt-2">كبير (64px)</span>
                </div>
                <div className="text-center">
                  <img src="/images/brand/logo-symbol.png" alt="44px" className="h-11 object-contain mx-auto" />
                  <span className="text-[11px] text-gray-500 block mt-2">هيدر (44px)</span>
                </div>
                <div className="text-center">
                  <img src="/images/brand/logo-symbol.png" alt="32px" className="h-8 object-contain mx-auto" />
                  <span className="text-[11px] text-gray-500 block mt-2">قائمة (32px)</span>
                </div>
                <div className="text-center">
                  <img src="/images/brand/logo-symbol.png" alt="20px" className="h-5 object-contain mx-auto" />
                  <span className="text-[11px] text-gray-500 block mt-2">صغير (20px)</span>
                </div>
              </div>
            </div>

            {/* Dark Shield Card */}
            <div className="bg-[#08281E] rounded-2xl p-6 shadow-sm border border-[#B59254]/30 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-bold text-[#FAF9F6]">الدرع المكيّف — للخلفيات الداكنة</span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-[#CAAB6E]">logo-symbol-dark.png</span>
              </div>
              <div className="flex flex-wrap items-end justify-around gap-4 p-6 bg-[#0B3D2E] rounded-xl border border-dashed border-white/20 min-h-[220px]">
                <div className="text-center">
                  <img src="/images/brand/logo-symbol-dark.png" alt="210px" className="h-32 object-contain mx-auto" />
                  <span className="text-[11px] text-gray-300 block mt-2">الأصل (210px)</span>
                </div>
                <div className="text-center">
                  <img src="/images/brand/logo-symbol-dark.png" alt="64px" className="h-16 object-contain mx-auto" />
                  <span className="text-[11px] text-gray-300 block mt-2">كبير (64px)</span>
                </div>
                <div className="text-center">
                  <img src="/images/brand/logo-symbol-dark.png" alt="44px" className="h-11 object-contain mx-auto" />
                  <span className="text-[11px] text-gray-300 block mt-2">هيدر (44px)</span>
                </div>
                <div className="text-center">
                  <img src="/images/brand/logo-symbol-dark.png" alt="32px" className="h-8 object-contain mx-auto" />
                  <span className="text-[11px] text-gray-300 block mt-2">قائمة (32px)</span>
                </div>
                <div className="text-center">
                  <img src="/images/brand/logo-symbol-dark.png" alt="20px" className="h-5 object-contain mx-auto" />
                  <span className="text-[11px] text-gray-300 block mt-2">صغير (20px)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Recommended Responsive HTML Implementation */}
        <section className="space-y-6">
          <div className="border-r-4 border-[#B59254] pr-4">
            <div className="inline-block px-2.5 py-0.5 rounded bg-amber-100 text-[#674C28] text-xs font-bold mb-1">
              الخيار الموصى به رقم (5) في طلبكم
            </div>
            <h2 className="text-xl font-bold text-[#08281E]">
              3. نموذج هيدر الموقع باستخدام الدرع الأصلي مع نص HTML متجاوب
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              يضمن دقة متناهية للنصوص على جميع الشاشات مع دعم كامل لمحركات البحث واللغتين العربية والإنجليزية
            </p>
          </div>

          <div className="space-y-6">
            {/* Live Mockup Light Header */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <span className="text-xs font-semibold text-gray-500 block mb-3">
                أ. معاينة الهيدر الفاتح (Light Header)
              </span>
              <div className="bg-white border border-gray-200 rounded-xl px-6 py-3 flex items-center justify-between">
                {/* Brand Lockup: Shield + Responsive HTML Text */}
                <div className="flex items-center gap-3.5">
                  <img
                    src="/images/brand/logo-symbol.png"
                    alt="درع مركز الحلول المتكاملة"
                    className="h-11 w-auto object-contain shrink-0"
                  />
                  <div className="flex flex-col text-right">
                    <span className="text-base sm:text-lg font-black tracking-tight text-[#0B3D2E] leading-tight">
                      مركز الحلول المتكاملة للأمن والسلامة
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-[#674C28] tracking-wider uppercase leading-none mt-0.5" dir="ltr">
                      Integrated Solutions Center for Safety and Security
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-[#0B3D2E]">
                  <span className="hover:text-[#B59254] cursor-pointer">الرئيسية</span>
                  <span className="hover:text-[#B59254] cursor-pointer">عن المركز</span>
                  <span className="hover:text-[#B59254] cursor-pointer">خدماتنا</span>
                  <span className="hover:text-[#B59254] cursor-pointer">التدريب</span>
                  <button className="px-3.5 py-1.5 rounded-lg bg-[#0B3D2E] text-white font-medium hover:bg-[#114D3B]">
                    طلب خدمة
                  </button>
                </div>
              </div>
            </div>

            {/* Live Mockup Dark Header */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <span className="text-xs font-semibold text-gray-500 block mb-3">
                ب. معاينة الهيدر الداكن (Dark Header)
              </span>
              <div className="bg-[#08281E] border border-white/10 rounded-xl px-6 py-3 flex items-center justify-between">
                {/* Brand Lockup: Dark Shield + Responsive HTML Text */}
                <div className="flex items-center gap-3.5">
                  <img
                    src="/images/brand/logo-symbol-dark.png"
                    alt="درع مركز الحلول المتكاملة"
                    className="h-11 w-auto object-contain shrink-0"
                  />
                  <div className="flex flex-col text-right">
                    <span className="text-base sm:text-lg font-black tracking-tight text-[#FAF9F6] leading-tight">
                      مركز الحلول المتكاملة للأمن والسلامة
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-[#CAAB6E] tracking-wider uppercase leading-none mt-0.5" dir="ltr">
                      Integrated Solutions Center for Safety and Security
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-white/90">
                  <span className="hover:text-[#CAAB6E] cursor-pointer">الرئيسية</span>
                  <span className="hover:text-[#CAAB6E] cursor-pointer">عن المركز</span>
                  <span className="hover:text-[#CAAB6E] cursor-pointer">خدماتنا</span>
                  <span className="hover:text-[#CAAB6E] cursor-pointer">التدريب</span>
                  <button className="px-3.5 py-1.5 rounded-lg bg-[#B59254] text-[#08281E] font-bold hover:bg-[#CAAB6E]">
                    طلب خدمة
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Viewport Simulation */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <span className="text-xs font-semibold text-gray-500 block mb-3">
                ج. معاينة على شاشات الجوال الضيقة (Mobile 360px Simulation)
              </span>
              <div className="max-w-[360px] mx-auto bg-white border-2 border-gray-300 rounded-2xl p-3 shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <img
                      src="/images/brand/logo-symbol.png"
                      alt="درع الجوال"
                      className="h-9 w-auto object-contain"
                    />
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-extrabold text-[#0B3D2E] leading-tight">
                        مركز الحلول المتكاملة
                      </span>
                      <span className="text-[8px] text-[#674C28] font-bold leading-tight">
                        للأمن والسلامة
                      </span>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 text-xs">
                    ☰
                  </div>
                </div>
                <div className="py-4 text-center text-xs text-gray-400">
                  [محتوى صفحة الجوال يتجاوب بسلاسة دون تزاحم]
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Favicon Suite */}
        <section className="space-y-6">
          <div className="border-r-4 border-[#B59254] pr-4">
            <h2 className="text-xl font-bold text-[#08281E]">
              4. حزمة أيقونات المتصفح والتطبيقات (Favicon & App Icon Suite)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              مبنية من الدرع وحده وموزونة بدقة لتكون مقروءة وواضحة على شريط تبويب المتصفح وأجهزة Apple وAndroid
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
            {/* Simulated Browser Tab */}
            <div className="max-w-md bg-gray-100 rounded-xl p-2 border border-gray-200">
              <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 text-xs font-medium text-gray-800">
                <img
                  src="/images/brand/favicon-32x32.png"
                  alt="Favicon Tab"
                  className="w-4 h-4 object-contain"
                />
                <span className="truncate max-w-[200px]">مركز الحلول المتكاملة للأمن والسلامة</span>
                <span className="text-gray-400 hover:text-gray-600 cursor-pointer ml-1">×</span>
              </div>
            </div>

            {/* Icon Sizes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
                <img src="/images/brand/favicon-16x16.png" alt="16x16" className="w-4 h-4 object-contain mb-2" />
                <span className="text-xs font-bold text-gray-700">16 × 16</span>
                <span className="text-[10px] text-gray-400">Tab Small</span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
                <img src="/images/brand/favicon-32x32.png" alt="32x32" className="w-8 h-8 object-contain mb-2" />
                <span className="text-xs font-bold text-gray-700">32 × 32</span>
                <span className="text-[10px] text-gray-400">Tab Standard</span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
                <img src="/images/brand/logo-symbol-48.png" alt="48x48" className="w-12 h-12 object-contain mb-2" />
                <span className="text-xs font-bold text-gray-700">48 × 48</span>
                <span className="text-[10px] text-gray-400">Windows Icon</span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
                <img src="/images/brand/apple-touch-icon.png" alt="180x180" className="w-14 h-14 object-contain mb-2" />
                <span className="text-xs font-bold text-gray-700">180 × 180</span>
                <span className="text-[10px] text-gray-400">Apple Touch</span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
                <img src="/images/brand/android-chrome-192x192.png" alt="192x192" className="w-16 h-16 object-contain mb-2" />
                <span className="text-xs font-bold text-gray-700">192 × 192</span>
                <span className="text-[10px] text-gray-400">Android PWA</span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
                <img src="/images/brand/android-chrome-512x512.png" alt="512x512" className="w-16 h-16 object-contain mb-2" />
                <span className="text-xs font-bold text-gray-700">512 × 512</span>
                <span className="text-[10px] text-gray-400">Splash Store</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Technical Details & SVG Feasibility */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-xl font-bold text-[#08281E] flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#B59254]"></span>
            5. دراسة جدوى ملف المتجهات SVG والتوصية الفنية المعتمدة
          </h2>

          <div className="prose max-w-none text-sm text-gray-700 space-y-3 leading-relaxed">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <strong className="block font-bold mb-1">النتيجة الفنية لمتجه SVG:</strong>
              توليد ملف SVG تلقائيًا من خلال التتبع الرقمي (Vector Tracing) على صورة نقطية بارتفاع 210 بكسل يسبب تذبذبًا طفيفًا في نقاط المنحنيات (Bezier Nodes) ويفقد زوايا الخط العربي حدتها الأصلية.
              وبناءً على توجيهكم الصارم: <em>«لا تعِد رسم الشعار الرسمي أو تولّد نسخة SVG تقديرية وتستخدمها دون اعتماد»</em>، فإننا نوصي بعدم اختراع مسارات تقديرية، والاعتماد رسميًا على:
              <ul className="list-disc list-inside mt-2 space-y-1 font-medium">
                <li>
                  <strong>أصول PNG الشفافة فائقة الدقة (5x Retina Density)</strong> لواجهات الموقع، والهيدر، ولوحة الإدارة، والتقارير الرقمية.
                </li>
                <li>
                  <strong>طلب ملف الفيكتور المصدري (.AI أو .EPS أو .SVG الأصلي)</strong> من مصمم الهوية لأرشفته للأعمال المطبوعة العملاقة (اللوحات الجدارية والمطبوعات الكبرى).
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-900 block mb-2">الألوان المستخرجة المعتمدة:</span>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#113B28] border border-black/20"></span>
                    <span>أخضر الغابة المؤسسي: <code>#113B28</code> (الدرع الخارجي وعلامة الصح)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#BA9256] border border-black/20"></span>
                    <span>الذهب المؤسسي: <code>#BA9256</code> (القوس الداخلي)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#695236] border border-black/20"></span>
                    <span>البرونز عالي التباين: <code>#695236</code> (نص الاسم العربي)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#CDAC70] border border-black/20"></span>
                    <span>الذهب المضيء للدارك مود: <code>#CDAC70</code></span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-900 block mb-2">خطة الاستبدال بعد موافقتكم (Next Steps):</span>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-600">
                  <li>استبدال <code>public/favicon.ico</code> بحزمة الفافيكون الجديدة متعددة الأحجام.</li>
                  <li>تحديث هيدر الموقع وفوتره باعتماد الدرع الأصلي <code>logo-symbol.png</code> مع نص HTML.</li>
                  <li>تحديث الشريط الجانبي للوحة الإدارة <code>AdminSidebar.tsx</code> بالدرع الداكن <code>logo-symbol-dark.png</code>.</li>
                  <li>تحديث شهادات التدريب وتقارير السلامة <code>certificates/page.tsx</code> بالدرع والاسم الجديدين.</li>
                  <li>أرشفة ملفات الشعار القديم دون ترك أي ظهور لها على المنصة.</li>
                </ol>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
