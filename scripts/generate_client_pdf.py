import os
import base64
import subprocess

def get_base64_image(image_path):
    if os.path.exists(image_path):
        with open(image_path, "rb") as img_file:
            return "data:image/png;base64," + base64.b64encode(img_file.read()).decode('utf-8')
    return ""

def generate_html():
    logo_b64 = get_base64_image("public/images/logo.png")
    
    html = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>الدليل المؤسسي الشامل لمنصة مركز عدن الأول (FACSS)</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    
    @page {{
        size: A4 portrait;
        margin: 14mm 14mm 14mm 14mm;
        @bottom-right {{
            content: "مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية (FACSS)";
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            font-size: 8pt;
            color: #718096;
        }}
        @bottom-left {{
            content: counter(page);
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            font-size: 8pt;
            color: #C59B27;
            font-weight: bold;
        }}
    }}
    
    @page:first {{
        margin: 0;
        @bottom-right {{ content: normal; }}
        @bottom-left {{ content: normal; }}
    }}
    
    * {{
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }}
    
    body {{
        font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
        direction: rtl;
        text-align: right;
        color: #1A202C;
        background-color: #FFFFFF;
        margin: 0;
        padding: 0;
        font-size: 10pt;
        line-height: 1.6;
    }}
    
    /* Cover Page */
    .cover-page {{
        width: 100vw;
        height: 100vh;
        min-height: 297mm;
        background: linear-gradient(145deg, #071910 0%, #0B2518 50%, #133E2B 100%);
        color: #FFFFFF;
        padding: 40mm 20mm 25mm 20mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        page-break-after: always;
        overflow: hidden;
    }}
    
    .cover-page::before {{
        content: "";
        position: absolute;
        top: -150px;
        left: -150px;
        width: 450px;
        height: 450px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(197, 155, 39, 0.15) 0%, rgba(0,0,0,0) 70%);
    }}
    
    .cover-page::after {{
        content: "";
        position: absolute;
        bottom: -150px;
        right: -150px;
        width: 500px;
        height: 500px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(197, 155, 39, 0.12) 0%, rgba(0,0,0,0) 70%);
    }}
    
    .cover-top {{
        text-align: center;
        position: relative;
        z-index: 2;
    }}
    
    .cover-logo {{
        width: 130px;
        height: auto;
        margin-bottom: 20px;
        filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5));
    }}
    
    .cover-entity-ar {{
        font-size: 20pt;
        font-weight: 800;
        color: #FFFFFF;
        letter-spacing: 0.5px;
        margin: 0;
        line-height: 1.3;
    }}
    
    .cover-entity-en {{
        font-size: 11pt;
        font-weight: 600;
        color: #C59B27;
        margin-top: 5px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }}
    
    .cover-divider {{
        width: 90px;
        height: 4px;
        background: linear-gradient(90deg, #C59B27, #E5C158);
        margin: 25px auto;
        border-radius: 2px;
    }}
    
    .cover-middle {{
        text-align: center;
        position: relative;
        z-index: 2;
        background: rgba(11, 37, 24, 0.6);
        border: 1px solid rgba(197, 155, 39, 0.3);
        border-radius: 12px;
        padding: 30px 20px;
        backdrop-filter: blur(5px);
        margin: 20px 0;
    }}
    
    .doc-badge {{
        display: inline-block;
        background: rgba(197, 155, 39, 0.2);
        border: 1px solid #C59B27;
        color: #DFB743;
        font-size: 9.5pt;
        font-weight: 700;
        padding: 4px 18px;
        border-radius: 30px;
        margin-bottom: 12px;
    }}
    
    .cover-title {{
        font-size: 24pt;
        font-weight: 900;
        color: #FFFFFF;
        margin: 5px 0 10px 0;
        line-height: 1.3;
    }}
    
    .cover-subtitle {{
        font-size: 12pt;
        color: #E2E8F0;
        font-weight: 400;
        margin: 0;
    }}
    
    .cover-slogans {{
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 15px;
        font-size: 9.5pt;
        color: #C59B27;
        font-weight: 700;
    }}
    
    .cover-bottom {{
        position: relative;
        z-index: 2;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        padding: 16px 22px;
        border-right: 4px solid #C59B27;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }}
    
    .author-box h4 {{
        margin: 0 0 3px 0;
        font-size: 9pt;
        color: #A0AEC0;
        font-weight: 400;
    }}
    
    .author-name {{
        font-size: 13pt;
        font-weight: 800;
        color: #C59B27;
        margin: 0;
    }}
    
    .author-title {{
        font-size: 8.5pt;
        color: #CBD5E0;
        margin: 2px 0 0 0;
    }}
    
    .meta-box {{
        text-align: left;
        font-size: 8.5pt;
        color: #A0AEC0;
        line-height: 1.4;
    }}
    
    /* Content Pages Layout */
    .page {{
        page-break-after: always;
        padding-top: 5mm;
    }}
    
    .page-header {{
        border-bottom: 2px solid #0B2518;
        padding-bottom: 8px;
        margin-bottom: 18px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }}
    
    .header-title-group {{
        display: flex;
        align-items: center;
        gap: 12px;
    }}
    
    .header-icon-box {{
        width: 32px;
        height: 32px;
        background: #0B2518;
        color: #C59B27;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14pt;
        font-weight: bold;
    }}
    
    .header-title {{
        font-size: 14pt;
        font-weight: 800;
        color: #0B2518;
        margin: 0;
    }}
    
    .header-subtitle {{
        font-size: 8.5pt;
        color: #718096;
        margin: 0;
    }}
    
    .header-tag {{
        font-size: 8pt;
        font-weight: 700;
        background: #F7FAFC;
        border: 1px solid #E2E8F0;
        color: #C59B27;
        padding: 3px 10px;
        border-radius: 20px;
    }}
    
    /* Typography & Sections */
    h2 {{
        font-size: 12pt;
        font-weight: 800;
        color: #0B2518;
        margin: 15px 0 8px 0;
        border-right: 3px solid #C59B27;
        padding-right: 8px;
    }}
    
    h3 {{
        font-size: 10.5pt;
        font-weight: 700;
        color: #133E2B;
        margin: 10px 0 5px 0;
    }}
    
    p {{
        margin: 0 0 8px 0;
        color: #2D3748;
        font-size: 9pt;
        line-height: 1.6;
        text-align: justify;
    }}
    
    /* Grids and Cards */
    .grid-2 {{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 12px;
    }}
    
    .grid-3 {{
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
        margin-bottom: 12px;
    }}
    
    .card {{
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 10px 12px;
        position: relative;
    }}
    
    .card-accent {{
        border-top: 3px solid #C59B27;
        background: #FFFFFF;
        box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }}
    
    .card-title {{
        font-size: 9.5pt;
        font-weight: 700;
        color: #0B2518;
        margin: 0 0 4px 0;
        display: flex;
        align-items: center;
        gap: 6px;
    }}
    
    .card-desc {{
        font-size: 8.5pt;
        color: #4A5568;
        margin: 0;
        line-height: 1.4;
    }}
    
    /* Feature Highlight Box */
    .highlight-box {{
        background: linear-gradient(145deg, #0B2518 0%, #133E2B 100%);
        color: #FFFFFF;
        border-radius: 8px;
        padding: 14px 16px;
        margin: 12px 0;
        border-right: 4px solid #C59B27;
    }}
    
    .highlight-box h3 {{
        color: #C59B27;
        font-size: 11pt;
        margin: 0 0 6px 0;
    }}
    
    .highlight-box p {{
        color: #E2E8F0;
        font-size: 8.5pt;
        margin: 0;
        line-height: 1.5;
    }}
    
    /* Tables */
    table {{
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
        font-size: 8.5pt;
    }}
    
    th {{
        background: #0B2518;
        color: #FFFFFF;
        text-align: right;
        padding: 7px 10px;
        font-weight: 700;
        border: 1px solid #0B2518;
    }}
    
    td {{
        padding: 7px 10px;
        border: 1px solid #E2E8F0;
        color: #2D3748;
    }}
    
    tr:nth-child(even) {{
        background-color: #F8FAFC;
    }}
    
    .badge {{
        display: inline-block;
        padding: 2px 7px;
        border-radius: 4px;
        font-size: 7.5pt;
        font-weight: 700;
    }}
    
    .badge-gold {{
        background: #FEF3C7;
        color: #92400E;
        border: 1px solid #FCD34D;
    }}
    
    .badge-green {{
        background: #DEF7EC;
        color: #03543F;
        border: 1px solid #84E1BC;
    }}
    
    .badge-blue {{
        background: #E1EFFE;
        color: #1E429F;
        border: 1px solid #A4CAFE;
    }}
    
    /* Step Workflow */
    .workflow-container {{
        display: flex;
        gap: 8px;
        margin: 12px 0;
    }}
    
    .workflow-step {{
        flex: 1;
        background: #FFFFFF;
        border: 1px solid #CBD5E0;
        border-top: 3px solid #0B2518;
        border-radius: 6px;
        padding: 8px 10px;
        text-align: center;
    }}
    
    .step-number {{
        width: 22px;
        height: 22px;
        background: #C59B27;
        color: #FFFFFF;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 8.5pt;
        font-weight: bold;
        margin-bottom: 4px;
    }}
    
    .step-title {{
        font-size: 8.5pt;
        font-weight: 700;
        color: #0B2518;
        margin: 2px 0;
    }}
    
    .step-desc {{
        font-size: 7.5pt;
        color: #4A5568;
        margin: 0;
        line-height: 1.3;
    }}
    
    .footer-note {{
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px dashed #CBD5E0;
        font-size: 8pt;
        color: #718096;
        text-align: center;
    }}
</style>
</head>
<body>

    <!-- ==================== COVER PAGE ==================== -->
    <div class="cover-page">
        <div class="cover-top">
            <img src="{logo_b64}" alt="FACSS Official Seal" class="cover-logo">
            <h1 class="cover-entity-ar">مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية</h1>
            <div class="cover-entity-en">Aden First Center for Security Services and Strategic Studies (FACSS)</div>
            <div class="cover-divider"></div>
        </div>
        
        <div class="cover-middle">
            <div class="doc-badge">وثيقة العرض والتشغيل المؤسسي المعتمدة — 2026</div>
            <div class="cover-title">الدليل المؤسسي والتشغيلي الشامل للمنصة الرقمية</div>
            <p class="cover-subtitle">دليل شامل لمكونات الموقع الرسمي، منظومة الحلول الأمنية، بوابات الخدمة الذاتية، ونظام الإدارة</p>
            <div class="cover-slogans">
                <span>🛡️ «أمانٌ يبدأ من عدن»</span>
                <span>•</span>
                <span>⚖️ «الوقاية قبل الاستجابة»</span>
                <span>•</span>
                <span>🌐 First in Security, First in Trust</span>
            </div>
        </div>
        
        <div class="cover-bottom">
            <div class="author-box">
                <h4>إعداد وإشراف هندسي:</h4>
                <div class="author-name">م / زكريا الماوري</div>
                <div class="author-title">كبير مهندسي النظم وتطوير المنصات الرقمية</div>
            </div>
            <div class="meta-box">
                <div><strong>الإصدار:</strong> Ver 1.0 — الإنتاج السحابي</div>
                <div><strong>التاريخ:</strong> سبتمبر 2026م</div>
                <div><strong>الحالة:</strong> جاهز للمراجعة والاعتماد المؤسسي</div>
            </div>
        </div>
    </div>

    <!-- ==================== PAGE 1: EXECUTIVE INTRO & VISION ==================== -->
    <div class="page">
        <div class="page-header">
            <div class="header-title-group">
                <div class="header-icon-box">01</div>
                <div>
                    <h1 class="header-title">المقدمة التنفيذية والرؤية الاستراتيجية</h1>
                    <p class="header-subtitle">المنطلق المؤسسي، الرؤية والرسالة، وميثاق العمل الأمني المعتمد</p>
                </div>
            </div>
            <div class="header-tag">نظرة عامة</div>
        </div>

        <div class="highlight-box">
            <h3>منظومة أمنية متكاملة تُرسي مفهوم «الوقاية قبل الاستجابة»</h3>
            <p>تعتبر المنصة الرقمية لمركز عدن الأول (FACSS) واجهة سيادية وتقنية متطورة، صُممت لتجسيد الميثاق المؤسسي للمركز وتوفير منصة موحدة تجمع بين الخدمات الأمنية الميدانية المتقدمة، الاستشارات الاستراتيجية، برامج التأهيل الأكاديمي، والبحوث الأمنية المحكمة، لتخدم القطاعات الحيوية في الجمهورية اليمنية والإقليم وفق أعلى المعايير العالمية.</p>
        </div>

        <h2>الركائز المؤسسية الثلاث لميثاق المركز:</h2>
        <div class="grid-3">
            <div class="card card-accent">
                <div class="card-title">🎯 1. الرؤية المستقبلية</div>
                <p class="card-desc">أن نكون المركز الرائد محلياً وإقليمياً في تقديم الخدمات الأمنية الاستراتيجية المتكاملة، ومرجعاً بحثياً وتنموياً في تطوير قطاع الأمن والسلامة وتأهيل الكوادر الوطنية.</p>
            </div>
            <div class="card card-accent">
                <div class="card-title">📜 2. الرسالة الاستراتيجية</div>
                <p class="card-desc">تقديم خدمات أمنية واستشارية وبحثية بمعايير عالمية لحماية الأرواح والمنشآت، والمساهمة في تمكين الشباب وتطوير المجتمع عبر برامج التدريب والتأهيل الاحترافي المعتمد.</p>
            </div>
            <div class="card card-accent">
                <div class="card-title">💎 3. منظومة القيم الأساسية</div>
                <p class="card-desc"><strong>النزاهة، الاحترافية، الانضباط، السرية التامة، الكفاءة، والتطوير المستمر.</strong> قيم حاكمة تضمن سرية بيانات العملاء ودقة التنفيذ العملياتي.</p>
            </div>
        </div>

        <h2>فلسفة العمل: ركائز الوقاية الستة (الوقاية قبل الاستجابة)</h2>
        <p>لا يعتمد المركز على ردة الفعل بعد وقوع الحوادث، بل يرتكز على هندسة أمنية استباقية مانعة من ستة محاور:</p>
        
        <div class="grid-2">
            <div class="card">
                <div class="card-title">1. التحديد المبكر للمخاطر</div>
                <p class="card-desc">رصد مسبق لكافة التهديدات ونقاط الضعف الفيزيائية والتقنية قبل تحولها إلى حوادث ملموسة.</p>
            </div>
            <div class="card">
                <div class="card-title">2. تقييم الثغرات والأصول</div>
                <p class="card-desc">تصنيف دقيق للأصول الحيوية وفق الأهمية التشغيلية ووضع مصفوفات تقييم المخاطر المعتمدة.</p>
            </div>
            <div class="card">
                <div class="card-title">3. تعزيز الدفاعات والتحصين</div>
                <p class="card-desc">معالجة نقاط الضعف عبر ضوابط تشغيلية ملموسة، وصيانة دورية للأنظمة والتحصينات المادية.</p>
            </div>
            <div class="card">
                <div class="card-title">4. إجراءات التشغيل القياسية (SOPs)</div>
                <p class="card-desc">صياغة وتطبيق بروتوكولات وإجراءات قياسية موحدة وخطط طوارئ وإخلاء قابلة للتطبيق الفوري.</p>
            </div>
            <div class="card">
                <div class="card-title">5. التدريب والتأهيل المستمر</div>
                <p class="card-desc">تدريب الأفراد على الاستجابة السريعة المنضبطة وسرعة البلاغ وتطبيق بروتوكولات الأمان.</p>
            </div>
            <div class="card">
                <div class="card-title">6. المراجعة والتحسين المتواصل</div>
                <p class="card-desc">تحديث دوري مستمر لتقييمات الموقف للتكيف السريع مع تطور أشكال التهديدات الحديثة.</p>
            </div>
        </div>
    </div>

    <!-- ==================== PAGE 2: TECHNICAL HIGHLIGHTS & ARCHITECTURE ==================== -->
    <div class="page">
        <div class="page-header">
            <div class="header-title-group">
                <div class="header-icon-box">02</div>
                <div>
                    <h1 class="header-title">المعايير الفنية ومعمارية المنصة الرقمية</h1>
                    <p class="header-subtitle">البنية السحابية، أمان البيانات، وتجربة المستخدم الحديثة</p>
                </div>
            </div>
            <div class="header-tag">المعايير التقنية</div>
        </div>

        <h2>المواصفات التقنية الفائقة للمنصة:</h2>
        <div class="grid-3">
            <div class="card card-accent">
                <div class="card-title">🌐 ثنائية اللغة الفورية</div>
                <p class="card-desc">محرك ترجمة ثنائي الاتجاه يتيح التبديل الفوري بنقرة واحدة بين العربية بنسق (RTL) والإنجليزية بنسق (LTR) مع حفظ التفضيل تلقائياً.</p>
            </div>
            <div class="card card-accent">
                <div class="card-title">📱 توافق ذكي شامل</div>
                <p class="card-desc">تصميم متجاوب بنسبة 100% يعمل بسلاسة استثنائية على الهواتف الذكية (iOS & Android)، الأجهزة اللوحية، وشاشات الحواسيب.</p>
            </div>
            <div class="card card-accent">
                <div class="card-title">🔒 أمان وسرية سيادية</div>
                <p class="card-desc">تشفير كامل لكافة الاتصالات عبر بروتوكولات HTTPS/SSL، وجلسات دخول محمية بتقنية JWT وHttpOnly لمنع الاختراق.</p>
            </div>
        </div>

        <h2>معمارية السحابة وقواعد البيانات (Cloud Architecture):</h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 25%;">المكون البرمجي</th>
                    <th style="width: 35%;">التقنية المستخدمة</th>
                    <th style="width: 40%;">الفائدة المؤسسية للعميل</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>واجهة المنصة والمحرك</strong></td>
                    <td>Next.js 14+ (React 18 / TypeScript)</td>
                    <td>سرعة تحميل فائقة، أداء ممتاز، وأفضل توافق مع محركات البحث (SEO).</td>
                </tr>
                <tr>
                    <td><strong>قاعدة البيانات السحابية</strong></td>
                    <td>PostgreSQL 16 (Neon Serverless)</td>
                    <td>قاعدة بيانات علائقية سحابية تضمن استمرارية الخدمة 24/7 دون توقف ونسخ احتياطي فوري.</td>
                </tr>
                <tr>
                    <td><strong>نظام إدارة النماذج (ORM)</strong></td>
                    <td>Prisma ORM (16 كياناً بياناتياً)</td>
                    <td>سلامة وترابط البيانات، منع التكرار، ودقة إدارة العلاقات الحساسة.</td>
                </tr>
                <tr>
                    <td><strong>التوزيع السحابي العالمي</strong></td>
                    <td>Vercel Global Edge Network</td>
                    <td>توزيع استضافة المنصة عبر شبكات سريعة تضمن سرعة الفتح من داخل اليمن وأي مكان بالعالم.</td>
                </tr>
            </tbody>
        </table>

        <h2>الهوية البصرية والجمالية الفاخرة (Visual Brand Identity):</h2>
        <div class="grid-2">
            <div class="card">
                <div class="card-title"><span style="display:inline-block;width:12px;height:12px;background:#0B2518;border-radius:2px;"></span> الأخضر الاستراتيجي الداكن (#0B2518)</div>
                <p class="card-desc">يعكس العمق الأمني، الرصانة المؤسسية، والاستقرار، مستوحى من الهوية الرسمية لدرع المركز.</p>
            </div>
            <div class="card">
                <div class="card-title"><span style="display:inline-block;width:12px;height:12px;background:#C59B27;border-radius:2px;"></span> الذهبي الإمبراطوري المعتم (#C59B27)</div>
                <p class="card-desc">يرمز للريادة، القيمة العالية، والجودة المعتمدة في الخدمات والاستشارات المقدمة لكبار العملاء.</p>
            </div>
        </div>

        <div class="highlight-box" style="background:#F8FAFC;border:1px solid #CBD5E0;color:#2D3748;border-right:4px solid #C59B27;">
            <h3 style="color:#0B2518;">استقلالية المنصة التامة (Zero Vendor Lock-in):</h3>
            <p style="color:#4A5568;">تم بناء الكود البرمجي بالكامل ليكون ملكاً حصرياً للمركز؛ لا يعتمد على أي اشتراكات مدفوعة أو منصات مقيدة، ويمكن نقله مستقبلاً إلى خوادم خاصة داخل مقر المركز بكل سهولة.</p>
        </div>
    </div>

    <!-- ==================== PAGE 3: PUBLIC SECTIONS & ELECTRONIC SYSTEMS ==================== -->
    <div class="page">
        <div class="page-header">
            <div class="header-title-group">
                <div class="header-icon-box">03</div>
                <div>
                    <h1 class="header-title">أقسام الموقع العام ومنظومة الـ 14 نظاماً إلكترونياً</h1>
                    <p class="header-subtitle">استعراض الخدمات الميدانية والتجهيزات التقنية الأمنية المتخصصة</p>
                </div>
            </div>
            <div class="header-tag">المحتوى المؤسسي</div>
        </div>

        <h2>الخدمات الأمنية الرئيسية المتاحة على المنصة:</h2>
        <div class="grid-2">
            <div class="card card-accent">
                <div class="card-title">💂 1. خدمات الحراسات الأمنية الميدانية</div>
                <p class="card-desc">تأمين المنشآت الحيوية (المصارف، الموانئ، الشركات النفطية)، حماية كبار الشخصيات والوفود (VIP Protection)، تأمين الفعاليات، وتأمين نقل الأموال والمقتنيات الثمينة.</p>
            </div>
            <div class="card card-accent">
                <div class="card-title">🔍 2. تقييم الأمن المادي والفحص الشامل</div>
                <p class="card-desc">تدقيق شامل للأسوار والتحصينات، إضاءة الأمان، بوابات التحكم، منظومات المراقبة، وقياس مناعة المباني ضد الاختراق والتسلل مع تقديم تقارير تفصيلية لسد الثغرات.</p>
            </div>
            <div class="card card-accent">
                <div class="card-title">📋 3. الاستشارات والخطط الأمنية</div>
                <p class="card-desc">تصميم البنى التحتية الأمنية، إعداد أدلة التشغيل القياسية (SOPs)، صياغة خطط الطوارئ والإخلاء والتعامل مع الأزمات، وضمان الامتثال للوائح والمعايير الدولية.</p>
            </div>
            <div class="card card-accent">
                <div class="card-title">🎓 4. برامج التدريب والتأهيل التخصصي</div>
                <p class="card-desc">دورات تأسيسية ومتقدمة عبر "أكاديمية عدن للتدريب" لتأهيل الحراس، تدريب السلامة المهنية والإسعافات، ومكافحة الحرائق، مع منح شهادات رقمية مؤمنة.</p>
            </div>
        </div>

        <h2>كتالوج الأنظمة والحلول الأمنية الإلكترونية الـ 14:</h2>
        <p>تم تضمين كافة الأنظمة الـ 14 المنصوص عليها حرفياً في وثيقة ميثاق المركز داخل واجهات المنصة:</p>
        
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 30%;">النظام الأمني</th>
                    <th style="width: 65%;">الوصف الفني والتطبيقي</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>1</td><td><strong>كاميرات المراقبة (CCTV)</strong></td><td>منظومات مراقبة متطورة (IP / PTZ / كاميرات ليلية وحرارية) مع تخزين سحابي وتحليل فيديو ذكي.</td></tr>
                <tr><td>2</td><td><strong>التحكم في الدخول (Access Control)</strong></td><td>أجهزة تحكم ذكية للأبواب والبوابات باستخدام البطاقات المشفرة والرموز الرقمية المتقدمة.</td></tr>
                <tr><td>3</td><td><strong>أنظمة الحضور والانصراف</strong></td><td>إدارة ومتابعة دوام الموظفين والكوادر بدقة عالية للشركات والمصانع والمؤسسات الكبرى.</td></tr>
                <tr><td>4</td><td><strong>أنظمة إدارة المفاتيح</strong></td><td>خزائن ذكية إلكترونية لإدارة وتتبع صلاحيات استلام وتسليم مفاتيح المرافق الحساسة.</td></tr>
                <tr><td>5</td><td><strong>إدارة المباني الذكية (BMS)</strong></td><td>منظومة تحكم مركزي لمراقبة الطاقة، التكييف، الإنارة، ومؤشرات الأمان في المباني الضخمة.</td></tr>
                <tr><td>6</td><td><strong>العتاد الشبكي وتمديدات الأمان</strong></td><td>تصميم وتركيب بنية شبكية فائقة الأمان وسيرفرات مخصصة لغرف المراقبة والتحكم.</td></tr>
                <tr><td>7</td><td><strong>التعرف على الوجوه (Face Recognition)</strong></td><td>كاميرات وحلول تعتمد الذكاء الاصطناعي للتحقق اللحظي من الهويات ورصد القوائم المصرح لها.</td></tr>
                <tr><td>8</td><td><strong>التتبع عبر التردد اللاسلكي (RFID)</strong></td><td>تتبع حركة الأصول والمعدات الثمينة والأفراد بدقة داخل المنشآت لمنع الفقد والسرقة.</td></tr>
                <tr><td>9</td><td><strong>الحواجز الأمنية والمصدات</strong></td><td>بوابات هيدروليكية وحواجز صد آلية لتأمين المداخل والمقرات الاستراتيجية من الاقتحام.</td></tr>
                <tr><td>10</td><td><strong>أجهزة التفتيش اليدوية والبوابات</strong></td><td>بوابات كشف المعادن وأجهزة الفحص بالأشعة السينية (X-Ray) والكواشف اليدوية للأفراد والطرود.</td></tr>
                <tr><td>11</td><td><strong>تجهيز غرف العمليات والمراقبة</strong></td><td>شاشات جدارية متكاملة (Video Walls)، كبائن تحكم، وأنظمة اتصال طوارئ متواصلة 24/7.</td></tr>
                <tr><td>12</td><td><strong>معدات الإطفاء ومضخات الحريق</strong></td><td>تركيب وتوزيع طفايات الحريق، شبكات الرش الآلي، ومضخات مكافحة الحريق المعتمدة.</td></tr>
                <tr><td>13</td><td><strong>أنظمة الإنذار المبكر ومستشعرات الدخان</strong></td><td>حساسات دقيقة لرصد الدخان والحرارة والغازات وإطلاق التنبيهات الفورية لغرف التحكم.</td></tr>
                <tr><td>14</td><td><strong>معدات السلامة الشخصية (PPE)</strong></td><td>خوذ، ستر واقية، أحذية أمان، ونظارات حماية وفق اشتراطات الأوشا (OSHA) العالمية.</td></tr>
            </tbody>
        </table>
    </div>

    <!-- ==================== PAGE 4: PORTALS & WORKFLOWS ==================== -->
    <div class="page">
        <div class="page-header">
            <div class="header-title-group">
                <div class="header-icon-box">04</div>
                <div>
                    <h1 class="header-title">نظام طلب الخدمات وبوابات الخدمة الذاتية</h1>
                    <p class="header-subtitle">كود التتبع الفوري، بوابة العميل، وبوابة المتدربين والشهادات</p>
                </div>
            </div>
            <div class="header-tag">البوابات الذكية</div>
        </div>

        <h2>دورة حياة طلب الخدمة الأمنية (Service Lifecycle):</h2>
        <p>تتميز المنصة بنظام رقمي متكامل يتيح لأي جهة أو عميل تقديم طلب عبر الموقع والحصول على كود تتبع رسمي ومتابعة كافة المراحل:</p>

        <div class="workflow-container">
            <div class="workflow-step">
                <div class="step-number">1</div>
                <div class="step-title">تقديم الطلب</div>
                <div class="step-desc">يقوم العميل بتعبئة النموذج وتحديد نوع الخدمة والقطاع وتاريخ التنفيذ.</div>
            </div>
            <div class="workflow-step">
                <div class="step-number">2</div>
                <div class="step-title">توليد الكود الموحد</div>
                <div class="step-desc">يُصدر النظام كوداً رسمياً فورياً مثل: <code>FACSS-SR-2026-359204</code></div>
            </div>
            <div class="workflow-step">
                <div class="step-number">3</div>
                <div class="step-title">مراجعة العمليات</div>
                <div class="step-desc">يصل الطلب لمدير العمليات في لوحة الإدارة لتحليله وتعيين فريق التنفيذ.</div>
            </div>
            <div class="workflow-step">
                <div class="step-number">4</div>
                <div class="step-title">التنفيذ والمتابعة</div>
                <div class="step-desc">تحديث الحالة إلى (قيد التنفيذ) وإرسال ملاحظات دورية للعميل.</div>
            </div>
            <div class="workflow-step">
                <div class="step-number">5</div>
                <div class="step-title">التسليم النهائي</div>
                <div class="step-desc">رفع التقرير الأمني النهائي المشفر على حساب العميل وإغلاق الطلب.</div>
            </div>
        </div>

        <h2>ميزات بوابات الخدمة الذاتية (Portals):</h2>
        <div class="grid-2">
            <div class="card card-accent">
                <div class="card-title">🏢 1. بوابة العملاء المؤسسية (/portal/client)</div>
                <ul style="font-size:8.5pt;color:#4A5568;padding-right:16px;margin:5px 0;">
                    <li><strong>المتابعة اللحظية:</strong> تتبع تقدم خطط الحراسة والاستشارات ومراحل الإنجاز.</li>
                    <li><strong>غرفة الملاحظات:</strong> تواصل كتابي مباشر ومحمي بين العميل وغرفة عمليات المركز.</li>
                    <li><strong>التقارير السرية:</strong> استعراض وتحميل تقارير تقييم الأمن المادي ومحاضر التفتيش بصيغة PDF.</li>
                    <li><strong>إدارة الحساب المؤسسي:</strong> تعديل بيانات مسؤولي الاتصال بالمنشأة.</li>
                </ul>
            </div>
            <div class="card card-accent">
                <div class="card-title">👨‍🎓 2. بوابة المتدربين (/portal/trainee)</div>
                <ul style="font-size:8.5pt;color:#4A5568;padding-right:16px;margin:5px 0;">
                    <li><strong>سجل الدورات النشطة:</strong> متابعة المقررات المسجل بها المتدرب، قاعات التدريب، والمدربين.</li>
                    <li><strong>سجل الحضور والتقدم:</strong> متابعة الساعات المنجزة ونسب الحضور المطلوبة للتخرج.</li>
                    <li><strong>الشهادات الرقمية المؤمنة:</strong> تحميل الشهادة برقم تسلسلي وكود فحص رقمي.</li>
                    <li><strong>التحقق الفوري من الشهادة:</strong> إمكانية قيام جهات التوظيف بالتحقق من صحة الشهادة عبر الرابط.</li>
                </ul>
            </div>
        </div>

        <h2>أكاديمية التدريب ومركز الدراسات والبحوث:</h2>
        <div class="grid-2">
            <div class="card">
                <div class="card-title">🎯 أكاديمية عدن الأولى للتدريب الأمني</div>
                <p class="card-desc">تتيح للشباب والكوادر استعراض دبلومات الحراسات، دورات الرماية والدفاع المدني، والسلامة المهنية (OSHA)، مع نموذج تسجيل إلكتروني فوري وسداد الرسوم.</p>
            </div>
            <div class="card">
                <div class="card-title">📊 مركز البحوث والدراسات الاستراتيجية</div>
                <p class="card-desc">منصة لنشر أوراق تقدير الموقف، قراءات المشهد الجيوسياسي والأمني في اليمن والمنطقة، ودراسات المخاطر الموجهة لصناع القرار والمستثمرين.</p>
            </div>
        </div>
    </div>

    <!-- ==================== PAGE 5: ADMIN CMS & CONTROL ==================== -->
    <div class="page">
        <div class="page-header">
            <div class="header-title-group">
                <div class="header-icon-box">05</div>
                <div>
                    <h1 class="header-title">لوحة التحكم المركزية ونظام الإدارة (Admin CMS)</h1>
                    <p class="header-subtitle">إدارة العمليات، المحتوى، المستخدمين، والإعدادات بدون كتابة كود</p>
                </div>
            </div>
            <div class="header-tag">لوحة القيادة والتحكم</div>
        </div>

        <h2>القدرات الإدارية المتاحة لمسؤولي المركز (/admin):</h2>
        <p>صُممت لوحة التحكم لتكون سهلة وسريعة الاستخدام، وتتيح للإدارة الإشراف الكامل على كافة مفاصل المنصة:</p>

        <div class="grid-3">
            <div class="card card-accent">
                <div class="card-title">📈 لوحة الإحصائيات (Dashboard)</div>
                <p class="card-desc">مؤشرات أداء حية تعرض عدد طلبات الخدمة النشطة، الدورات التدريبية، البحوث المنشورة، ورسائل الاتصال الجديدة بنقرة واحدة.</p>
            </div>
            <div class="card card-accent">
                <div class="card-title">📝 إدارة طلبات الخدمة (Requests)</div>
                <p class="card-desc">استعراض تفاصيل طلبات العملاء، تحديث الحالات (جديد، قيد الدراسة، قيد التنفيذ، مكتمل)، وإضافة ملاحظات تشغيلية موجهة للعميل.</p>
            </div>
            <div class="card card-accent">
                <div class="card-title">📬 صندوق رسائل الجمهور (Inquiries)</div>
                <p class="card-desc">صندوق وارد مشفر يستقبل رسائل صفحة "اتصل بنا" مع بيانات المرسل وأرقام هواتفه، وحفظ تاريخ الإرسال وحالة المتابعة.</p>
            </div>
        </div>

        <div class="grid-3">
            <div class="card card-accent">
                <div class="card-title">🎓 إدارة الدورات والتدريب (Courses)</div>
                <p class="card-desc">إضافة وتعديل الدورات والبرامج التدريبية، تحديد الأسعار، فترات التدريب، والشروط، واستعراض قوائم المسجلين.</p>
            </div>
            <div class="card card-accent">
                <div class="card-title">📚 النشر والبحوث (Publications)</div>
                <p class="card-desc">نشر أوراق السياسات، الدراسات الأمنية، وتقارير تقييم الموقف مع دعم رفع الملفات وتنسيق المقالات باللغتين.</p>
            </div>
            <div class="card card-accent">
                <div class="card-title">👥 المستخدمين والصلاحيات (RBAC)</div>
                <p class="card-desc">التحكم في أدوار النظام (المدير العام، مدراء العمليات، مدراء التدريب، مشرفي البحوث، حسابات العملاء والمتدربين).</p>
            </div>
        </div>

        <h2>التحكم الكامل في الإعدادات ومعلومات التواصل بدون مبرمج:</h2>
        <div class="highlight-box">
            <h3>شاشة إعدادات المنصة الموحدة (/admin/settings)</h3>
            <p>يمكن لمدير المركز في أي لحظة تعديل أرقام الهواتف الرسمية، أرقام الواتساب، البريد الإلكتروني الرسمي، العنوان الجغرافي، وروابط منصات التواصل الاجتماعي (تويتر/X، لينكدإن، فيسبوك) مباشرة من شاشة الإعدادات، وتنعكس التغييرات فوراً في ترويسة وتذييل وصفحات الموقع بالكامل دون الحاجة لأي تعديل برمجي.</p>
        </div>

        <h2>نظام سجل الرقابة والتدقيق الأمني (Audit Trail):</h2>
        <p>يسجل النظام تلقائياً كافة العمليات الحساسة (تسجيل الدخول، تعديل طلب خدمة، إضافة مستخدم، نشر بحث) مرفقة بالتاريخ والوقت وعنوان الـ IP واسم المستخدم المسؤول، لضمان أعلى مستويات الحوكمة والامتثال الأمني الداخلي.</p>
    </div>

    <!-- ==================== PAGE 6: CREDENTIALS & HANDOVER ==================== -->
    <div class="page">
        <div class="page-header">
            <div class="header-title-group">
                <div class="header-icon-box">06</div>
                <div>
                    <h1 class="header-title">دليل التجربة الفورية والتسليم المعتمد</h1>
                    <p class="header-subtitle">روابط المنصة، بيانات الحسابات التجريبية، وخارطة الطريق المستقبلية</p>
                </div>
            </div>
            <div class="header-tag">دليل الاعتماد</div>
        </div>

        <h2>روابط الوصول المباشر للمنصة السحابية:</h2>
        <div class="highlight-box" style="background:#FFFFFF;border:1px solid #C59B27;color:#0B2518;">
            <div style="font-size:11pt;font-weight:bold;color:#0B2518;margin-bottom:6px;">🌐 رابط الموقع المباشر (Vercel Global Edge):</div>
            <div style="font-size:12pt;font-weight:bold;color:#C59B27;direction:ltr;text-align:right;">https://facss-platform.vercel.app</div>
            <p style="color:#718096;font-size:8.5pt;margin-top:4px;">(يعمل 24/7 عبر السحابة العالمية برابط مشفر HTTPS مع قاعدة بيانات PostgreSQL سحابية فورية).</p>
        </div>

        <h2>جدول بيانات الدخول التجريبية الجاهزة للفحص والاختبار:</h2>
        <table>
            <thead>
                <tr>
                    <th>الدور الوظيفي</th>
                    <th>البريد الإلكتروني التجريبي</th>
                    <th>كلمة المرور</th>
                    <th>بوابة الدخول المخصصة</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>المدير العام (Super Admin)</strong></td>
                    <td><code>admin@facss-aden.com</code></td>
                    <td><code>Admin@FACSS2026</code></td>
                    <td>لوحة التحكم الكاملة (/admin)</td>
                </tr>
                <tr>
                    <td><strong>مدير العمليات والخدمات</strong></td>
                    <td><code>services@facss-aden.com</code></td>
                    <td><code>Service@FACSS2026</code></td>
                    <td>إدارة طلبات الخدمات (/admin/requests)</td>
                </tr>
                <tr>
                    <td><strong>مدير الأكاديمية والتدريب</strong></td>
                    <td><code>training@facss-aden.com</code></td>
                    <td><code>Train@FACSS2026</code></td>
                    <td>إدارة الدورات والتسجيلات (/admin/training)</td>
                </tr>
                <tr>
                    <td><strong>مدير الدراسات والبحوث</strong></td>
                    <td><code>research@facss-aden.com</code></td>
                    <td><code>Research@FACSS2026</code></td>
                    <td>إدارة ونشر أوراق الموقف (/admin/research)</td>
                </tr>
                <tr>
                    <td><strong>حساب عميل مؤسسي (بنك تجاري)</strong></td>
                    <td><code>client@yemen-bank.com</code></td>
                    <td><code>Client@FACSS2026</code></td>
                    <td>بوابة متابعة العملاء (/portal/client)</td>
                </tr>
                <tr>
                    <td><strong>حساب متدرب أمني</strong></td>
                    <td><code>trainee@facss-aden.com</code></td>
                    <td><code>Trainee@FACSS2026</code></td>
                    <td>بوابة المتدربين والشهادات (/portal/trainee)</td>
                </tr>
            </tbody>
        </table>

        <h2>الخطوات التنفيذية التالية المقترحة للمركز (Future Roadmap):</h2>
        <div class="grid-3">
            <div class="card">
                <div class="card-title">1. ربط النطاق الرسمي</div>
                <p class="card-desc">ربط الدومين الرسمي المعتمد للمركز (مثل: <code>facss-aden.com</code>) بحساب Vercel بضغطة زر واحدة لتفعيل العنوان التجاري.</p>
            </div>
            <div class="card">
                <div class="card-title">2. بوابات الرسائل الآلية</div>
                <p class="card-desc">تفعيل إرسال إشعارات الرسائل النصية (SMS) وتنبيهات WhatsApp التلقائية للعملاء والمتدربين عند تحديث حالات الطلبات.</p>
            </div>
            <div class="card">
                <div class="card-title">3. بوابات السداد الرقمي</div>
                <p class="card-desc">ربط بوابات الدفع الإلكتروني (فيزا/ماستركارد وشبكات التحويل المحلية) لسداد رسوم الدورات والاستشارات مباشرة.</p>
            </div>
        </div>

        <div class="footer-note">
            تم إعداد وتطوير هذه المنصة الرقمية بكافة معاييرها الفنية والأمنية بواسطة: <strong>م / زكريا الماوري</strong> لصالح <strong>مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية (FACSS)</strong> — سبتمبر 2026م.
        </div>
    </div>

</body>
</html>"""
    return html

def main():
    html_content = generate_html()
    html_path = "FACSS_Platform_Guide_Ar.html"
    pdf_path = "FACSS_Platform_Guide_Ar.pdf"
    
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"HTML file created: {html_path}")
    
    # Render with Edge headless for crystal-clear Arabic font rendering
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
        
    abs_html = os.path.abspath(html_path)
    abs_pdf = os.path.abspath(pdf_path)
    
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={abs_pdf}",
        "--no-pdf-header-footer",
        abs_html
    ]
    
    print("Generating PDF via Microsoft Edge Headless...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if os.path.exists(abs_pdf) and os.path.getsize(abs_pdf) > 0:
        pdf_size_kb = os.path.getsize(abs_pdf) / 1024
        print(f"PDF Generated successfully: {abs_pdf} ({pdf_size_kb:.2f} KB)")
    else:
        print("Edge rendering failed. Trying weasyprint...")
        import weasyprint
        weasyprint.HTML(string=html_content).write_pdf(abs_pdf)
        print(f"WeasyPrint PDF generated: {abs_pdf}")

if __name__ == "__main__":
    main()
