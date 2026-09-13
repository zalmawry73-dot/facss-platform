import React from 'react';
import Link from 'next/link';
import { 
  Landmark, 
  Building2, 
  Plane, 
  Building, 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  Shield, 
  ArrowLeft 
} from 'lucide-react';

export default function SectorsPage() {
  const sectors = [
    {
      titleAr: 'الجهات الحكومية والمؤسسات العامة',
      titleEn: 'Government Entities & Public Institutions',
      descAr: 'تأمين المقار الرسمية، تنظيم تدفق المراجعين، حراسة المنشآت الحساسة، وتقييم الأمن المادي وخطط الطوارئ.',
      icon: Landmark,
    },
    {
      titleAr: 'البنوك والمصارف وشركات التأمين',
      titleEn: 'Banks, Financial Firms & Insurance Providers',
      descAr: 'حراسة الفروع والمقار الرئيسية، غرف الخزنات، مرافقة نقل الأموال، أنظمة الإنذار المبكر والتحكم في الدخول.',
      icon: Building2,
    },
    {
      titleAr: 'الشركات النفطية والموانئ والمطارات',
      titleEn: 'Oil Companies, Seaports & International Airports',
      descAr: 'تأمين المنشآت الحيوية وسلاسل الإمداد، الرصد التلفزيوني المتطور، مكافحة الحرائق، وتأمين الأرصفة والمناطق الحرة.',
      icon: Plane,
    },
    {
      titleAr: 'المنشآت الصناعية والتجارية الكبرى',
      titleEn: 'Major Industrial & Commercial Complexes',
      descAr: 'حراسة المصانع والمستودعات ومراكز التوزيع، أجهزة فحص الشاحنات، والتحكم في بوابات الشحن والتفريغ.',
      icon: Building,
    },
    {
      titleAr: 'الفنادق والمنتجعات السياحية',
      titleEn: 'Hotels & Tourism Resorts',
      descAr: 'تأمين المداخل والنزلاء، تدريب فرق السلامة الفندقية، فحص الحقائب، وتأمين الفعاليات والمؤتمرات.',
      icon: Building2,
    },
    {
      titleAr: 'الجامعات والمدارس والمستشفيات',
      titleEn: 'Universities, Schools & Healthcare Facilities',
      descAr: 'توفير بيئة تعليمية وصحية آمنة، إدارة حركة الدخول والخروج، خطط الإخلاء الطبي ومكافحة الحرائق.',
      icon: GraduationCap,
    },
    {
      titleAr: 'الشخصيات المهمة والبعثات الدبلوماسية',
      titleEn: 'VIP Executives & Diplomatic Missions',
      descAr: 'الحماية اللصيقة (Close Protection)، مرافقة المواكب، القيادة الدفاعية، وتأمين مقرات الإقامة والزيارات.',
      icon: Users,
    },
    {
      titleAr: 'المنظمات الدولية وغير الحكومية',
      titleEn: 'International & Non-Governmental Organizations (NGOs)',
      descAr: 'تقارير تقييم المخاطر، استشارات أمن الحركة الميدانية، حراسة المجمعات السكنية والمقرات، وتأمين البعثات.',
      icon: ShieldCheck,
    },
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
          <span className="section-tag">قطاعات نخدمها</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFF', marginBottom: '1rem' }}>
            القطاعات والمؤسسات التي يخدمها المركز
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '750px', marginInline: 'auto' }}>
            نقدم حلولاً أمنية متخصصة ومصممة بدقة لتلائم طبيعة التهديدات والعمليات التشغيلية لكل قطاع
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {sectors.map((sec, idx) => {
              const SecIcon = sec.icon;
              return (
                <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '12px',
                        background: 'rgba(197, 155, 39, 0.15)',
                        border: '1px solid rgba(197, 155, 39, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-gold-light)',
                        marginBottom: '1.2rem',
                      }}
                    >
                      <SecIcon size={26} />
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginBottom: '0.4rem' }}>
                      {sec.titleAr}
                    </h3>
                    <h4 style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', fontWeight: 600, marginBottom: '1rem' }}>
                      {sec.titleEn}
                    </h4>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7 }}>
                      {sec.descAr}
                    </p>
                  </div>

                  <div style={{ paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Link
                      href="/request-service"
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <span>طلب خطة أمنية مخصصة لهذا القطاع</span>
                      <ArrowLeft size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
