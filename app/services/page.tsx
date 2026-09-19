import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getTranslation, type Locale } from '@/lib/i18n';
import { 
  Shield, 
  Building2, 
  Cpu, 
  GraduationCap, 
  Briefcase, 
  TrendingUp, 
  ArrowLeft,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export const revalidate = 0;

export default async function ServicesPage() {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const t = getTranslation(locale);
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }
    }
  });

  return (
    <div>
      {/* Banner */}
      <section
        style={{
          paddingBlock: '4rem',
          background: 'linear-gradient(180deg, var(--facss-green-950) 0%, var(--facss-green-900) 100%)',
          borderBottom: '1px solid rgba(201, 162, 39, 0.25)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <span className="section-tag">{t.servicesSystem}</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem' }}>
            {isAr ? 'خدمات وحلول مركز عدن الأول (FACSS)' : 'FACSS Integrated Security Services & Solutions'}
          </h1>
          <p style={{ color: 'var(--facss-ivory-300)', fontSize: '1.1rem', maxWidth: '750px', marginInline: 'auto' }}>
            {isAr
              ? 'نقدم منظومة متكاملة من الخدمات الأمنية التشغيلية، الأنظمة التقنية المتقدمة، والاستشارات والدراسات الاستراتيجية'
              : 'Delivering an integrated matrix of operational security, advanced technical solutions, tactical training, and strategic advisory.'}
          </p>
        </div>
      </section>

      {/* Services List by Category */}
      <section className="section">
        <div className="container">
          {categories.length === 0 ? (
            <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '600px', marginInline: 'auto', marginBottom: '2rem' }}>
              <Shield size={44} style={{ color: 'var(--text-muted)', marginInline: 'auto', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {isAr ? 'دليل الخدمات قيد التحديث المؤسسي' : 'Services catalog currently under institutional update'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {isAr ? 'سيتم إدراج باقات الخدمات الأمنية التخصصية وحلول الحراسة والاستشارات قريباً عبر لوحة الإدارة.' : 'Specialized security, guarding, and advisory services will be published soon via the administration.'}
              </p>
            </div>
          ) : (
            categories.map((cat) => {
            const catTitle = isAr ? cat.titleAr : (cat.titleEn || cat.titleAr);
            const catSub = isAr ? cat.titleEn : cat.titleAr;

            return (
              <div key={cat.id} style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
                  <Shield size={24} style={{ color: 'var(--facss-gold-600)' }} />
                  <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {catTitle}
                  </h2>
                  {catSub && (
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginInlineStart: 'auto' }}>
                      {catSub}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem' }}>
                  {cat.services.map((srv) => {
                    let features: string[] = [];
                    try {
                      features = JSON.parse(srv.featuresAr || '[]');
                    } catch {
                      features = [];
                    }

                    const srvTitle = isAr ? srv.titleAr : (srv.titleEn || srv.titleAr);
                    const srvSub = isAr ? srv.titleEn : srv.titleAr;
                    const srvDesc = isAr ? srv.shortDescAr : (srv.fullDescEn || srv.shortDescAr);

                    return (
                      <div key={srv.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span className="badge badge-gold">{catTitle}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>FACSS</span>
                          </div>

                          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            {srvTitle}
                          </h3>
                          {srvSub && (
                            <h4 style={{ fontSize: '0.82rem', color: 'var(--facss-gold-700)', fontWeight: 600, marginBottom: '0.85rem' }}>
                              {srvSub}
                            </h4>
                          )}

                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                            {srvDesc}
                          </p>

                          {/* Top Features */}
                          {features.length > 0 && (
                            <div style={{ marginBottom: '1.5rem', background: 'var(--surface-sunken)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                {features.slice(0, 3).map((f, idx) => (
                                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    <CheckCircle2 size={14} style={{ color: 'var(--facss-green-700)', flexShrink: 0 }} />
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                          <Link
                            href={`/services/${srv.slug}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              color: 'var(--facss-green-900)',
                              fontSize: '0.88rem',
                              fontWeight: 700,
                            }}
                          >
                            <span>{isAr ? 'عرض تفاصيل الخدمة' : 'View Service Details'}</span>
                            <ArrowIcon size={15} />
                          </Link>

                          <Link href={`/request-service?service=${srv.slug}`} className="btn btn-gold btn-sm">
                            {t.requestService}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }) )}
        </div>
      </section>

      {/* Merged Sectors: 8 Target Sectors */}
      <section className="section" style={{ background: 'var(--surface-sunken)', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.targetSectors}</span>
            <h2 className="section-title">
              {isAr ? 'المؤسسات والقطاعات التي يخدمها المركز' : 'Institutions & Industries We Serve'}
            </h2>
            <p className="section-subtitle">
              {isAr
                ? 'حلول أمنية وتدريبية متخصصة ومصممة بدقة لتلائم البيئة التشغيلية وطبيعة التهديدات في عدن والمحافظات المجاورة'
                : 'Specialized security and training frameworks tailored to operational environments and threat postures in Aden and surrounding regions.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            {[
              {
                titleAr: 'الجهات الحكومية والمؤسسات العامة',
                titleEn: 'Government Entities & Public Institutions',
                descAr: 'تأمين المقار الرسمية، تنظيم تدفق المراجعين، حراسة المنشآت الحساسة، وتقييم الأمن المادي وخطط الطوارئ.',
                descEn: 'Securing official facilities, visitor access control, sensitive installation guarding, physical security assessments, and emergency planning.',
              },
              {
                titleAr: 'البنوك والمصارف وشركات التأمين',
                titleEn: 'Banks, Financial Firms & Insurance Providers',
                descAr: 'حراسة الفروع والمقار الرئيسية، غرف الخزنات، مرافقة نقل الأموال، أنظمة الإنذار المبكر والتحكم في الدخول.',
                descEn: 'HQ and branch static guarding, vault security, cash-in-transit (CIT) escort protocols, early alarm systems, and biometric access control.',
              },
              {
                titleAr: 'الشركات النفطية والموانئ والمطارات',
                titleEn: 'Oil Companies, Seaports & International Airports',
                descAr: 'تأمين المنشآت الحيوية وسلاسل الإمداد، الرصد التلفزيوني المتطور، مكافحة الحرائق، وتأمين الأرصفة والمناطق الحرة.',
                descEn: 'Critical national infrastructure protection, supply chain integrity, thermal surveillance, fire safety compliance, and customs gate security.',
              },
              {
                titleAr: 'المنشآت الصناعية والتجارية الكبرى',
                titleEn: 'Major Industrial & Commercial Complexes',
                descAr: 'حراسة المصانع والمستودعات ومراكز التوزيع، أجهزة فحص الشاحنات، والتحكم في بوابات الشحن والتفريغ.',
                descEn: 'Factory and logistics perimeter protection, vehicle inspection lanes, loading dock surveillance, and loss prevention audits.',
              },
              {
                titleAr: 'الفنادق والمنتجعات السياحية',
                titleEn: 'Hotels & Tourism Resorts',
                descAr: 'تأمين المداخل والنزلاء، تدريب فرق السلامة الفندقية، فحص الحقائب، وتأمين الفعاليات والمؤتمرات.',
                descEn: 'Hospitality security management, guest screening, baggage scanners, event protection, and multilingual concierge safety staff.',
              },
              {
                titleAr: 'الجامعات والمدارس والمستشفيات',
                titleEn: 'Universities, Schools & Healthcare Facilities',
                descAr: 'توفير بيئة تعليمية وصحية آمنة، إدارة حركة الدخول والخروج، خطط الإخلاء الطبي ومكافحة الحرائق.',
                descEn: 'Safe academic and clinical environments, credentialed perimeter control, pediatric ward protection, and emergency evacuation drills.',
              },
              {
                titleAr: 'الشخصيات المهمة والبعثات الدبلوماسية',
                titleEn: 'VIP Executives & Diplomatic Missions',
                descAr: 'الحماية اللصيقة (Close Protection)، مرافقة المواكب، القيادة الدفاعية، وتأمين مقرات الإقامة والزيارات.',
                descEn: 'Executive and close protection (CP) teams, armored convoy routing, defensive driving, safehaven prep, and residential sweeps.',
              },
              {
                titleAr: 'المنظمات الدولية وغير الحكومية',
                titleEn: 'International & Non-Governmental Organizations (NGOs)',
                descAr: 'تقارير تقييم المخاطر، استشارات أمن الحركة الميدانية، حراسة المجمعات السكنية والمقرات، وتأمين البعثات.',
                descEn: 'Security risk assessments (SRA), mission movement advisory, compound guarding, field liaison, and communications protocols.',
              },
            ].map((sec, idx) => (
              <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span className="badge badge-gold">
                      {isAr ? 'قطاع أمني متخصص' : 'Specialized Sector'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 700 }}>0{idx + 1}</span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    {isAr ? sec.titleAr : sec.titleEn}
                  </h3>
                  <h4 style={{ fontSize: '0.82rem', color: 'var(--facss-gold-700)', fontWeight: 600, marginBottom: '0.85rem' }}>
                    {isAr ? sec.titleEn : sec.titleAr}
                  </h4>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                    {isAr ? sec.descAr : sec.descEn}
                  </p>
                </div>

                <div style={{ paddingTop: '1.25rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                  <Link
                    href="/request-service"
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <span>{isAr ? 'طلب خطة أمنية مخصصة لهذا القطاع' : 'Request Tailored Sector Plan'}</span>
                    <ArrowIcon size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
