import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Search,
  FileText,
  AlertTriangle,
  ArrowLeft,
  GraduationCap,
  TrendingUp,
  Shield
} from 'lucide-react';

export default function MethodologyPage() {
  const pillars = [
    { num: '01', title: 'تحديد المخاطر قبل أن تتحول إلى حوادث', desc: 'رصد استباقي لكافة مهددات الأمن المادي والرقمي والمحيطي وتحليل احتمالية الحدوث.', icon: AlertTriangle },
    { num: '02', title: 'تقييم نقاط الضعف والأصول الحيوية وتصنيفها حسب الأولوية', desc: 'جرد شامل للأصول الحساسة وتحليل الثغرات وترتيب الأولويات لحماية المراكز الحيوية.', icon: CheckCircle2 },
    { num: '03', title: 'تعزيز النقاط الضعيفة عبر ضوابط عملية قابلة للقياس والصيانة المستمرة', desc: 'تطبيق ضوابط أمنية مادية وتقنية تخضع لاختبارات دورية وقياس فاعلية دقيق.', icon: ShieldCheck },
    { num: '04', title: 'وضع إجراءات تشغيلية موحدة (SOPs) وخطط استجابة طوارئ واضحة وقابلة للتنفيذ', desc: 'توحيد بروتوكولات العمل الأمني وخطط الإخلاء والتعامل مع الأزمات دون اجتهادات عشوائية.', icon: FileCheck },
    { num: '05', title: 'تدريب الأفراد على التعرف على المخاطر والإبلاغ عنها والتصرف وفق البروتوكولات', desc: 'الاستثمار في الكادر البشري وتأهيله ليكون خط الدفاع الأول في المنشأة.', icon: GraduationCap },
    { num: '06', title: 'المراجعة الدورية والتحسين المستمر للإجراءات بما يلائم تغيّر بيئة التهديد', desc: 'تحديث الخطط بناءً على المستجدات الميدانية والإقليمية وتغير أنماط المخاطر.', icon: TrendingUp },
  ];

  return (
    <div>
      <section
        style={{
          paddingBlock: '4.5rem',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(19, 62, 43, 0.6) 0%, rgba(5, 14, 9, 0.95) 80%)',
          borderBottom: '1px solid rgba(197, 155, 39, 0.2)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <span className="section-tag">فلسفة العمل والمنهجية</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFF', marginBottom: '1rem' }}>
            المنهجية التشغيلية والمقاربة الوقائية
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '750px', marginInline: 'auto' }}>
            «الأمن في جوهره هو الوقاية قبل الاستجابة. لا ينتظر المنظومة الأمنية القوية وقوع الحادثة لتتحرك، بل تستبقها.»
          </p>
        </div>
      </section>

      {/* 4 Phases */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">دورة العمل الكاملة</span>
            <h2 className="section-title">المراحل الأربع لتقديم الخدمات</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
            <div className="card" style={{ borderTop: '4px solid var(--color-gold)' }}>
              <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>المرحلة الأولى</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF', marginBottom: '0.8rem' }}>
                التقييم والاستماع
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                نلتقي بالعميل ونفهم بعمق طبيعة عمله وتحدياته التشغيلية، ونُحلّل طبيعة التهديدات المباشرة وغير المباشرة المحيطة به ومحيط منشأته.
              </p>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--color-gold)' }}>
              <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>المرحلة الثانية</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF', marginBottom: '0.8rem' }}>
                التحليل والتخطيط
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                نُقدّم تقريراً تقييمياً مفصّلاً مدعوماً بمصفوفة المخاطر وخطةٍ أمنيةٍ متكاملة، مع خيارات واضحة للمعدات والكوادر وجداول التنفيذ.
              </p>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--color-gold)' }}>
              <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>المرحلة الثالثة</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF', marginBottom: '0.8rem' }}>
                التنفيذ والمتابعة
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                نُنفّذ الخطة المعتمدة بكوادرٍ مؤهَّلة وأدواتٍ تقنية حديثة، مع الإشراف الميداني المستمر والمتابعة الدورية ورفع تقارير الأداء.
              </p>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--color-gold)' }}>
              <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>المرحلة الرابعة</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF', marginBottom: '0.8rem' }}>
                التحسين المستمر
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                نُحدّث الإجراءات التشغيلية والخطط الأمنية دورياً بناءً على التغذية الراجعة من العميل والمراجعات الميدانية وتغيّر بيئة التهديد.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Preventive Pillars */}
      <section className="section" style={{ background: 'var(--bg-dark-elevated)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">المقاربة الوقائية</span>
            <h2 className="section-title">الركائز الست في فلسفة FACSS</h2>
            <p className="section-subtitle">
              تُرسي خبرة الفريق في القيادة العسكرية والأمنية والإدارة وإدارة المخاطر والعمليات هذا النهج الاستباقي
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {pillars.map((p, idx) => {
              const PIcon = p.icon;
              return (
                <div key={idx} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        background: 'rgba(197, 155, 39, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-gold-light)',
                      }}
                    >
                      <PIcon size={20} />
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-gold-light)' }}>
                      {p.num}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                    {p.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <Link href="/request-service" className="btn btn-gold btn-lg">
              <Shield size={18} />
              <span>طلب دراسة وتقييم أمني لمنشأتك</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
