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
import { getContentSection } from '@/lib/content';

export const revalidate = 0;

export default async function ServicesPage() {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const t = getTranslation(locale);
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }
    }
  });

  const dbBeneficiaries = await getContentSection('beneficiaries');

  const fallbackBeneficiaries = [
    {
      titleAr: 'المنظمات الإنسانية الدولية (INGOs)',
      titleEn: 'International Humanitarian NGOs (INGOs)',
      descAr: 'تقييم مخاطر الوصول الإنساني، دراسات السياق الميداني، وخطط التحرك الآمن للقوافل والبعثات الميدانية.',
      descEn: 'Humanitarian access risk assessments, local context studies, and safe movement plans for aid missions.',
    },
    {
      titleAr: 'وكالات الأمم المتحدة والبعثات الإغاثية',
      titleEn: 'UN Agencies & Relief Missions',
      descAr: 'موجزات دورية لحالة المسارات والمعابر، تحليلات أصحاب المصلحة، وتيسير قنوات التواصل الميداني غير السياسي.',
      descEn: 'Periodic transit route and corridor risk briefs, stakeholder mapping, and non-political field access dialogue.',
    },
    {
      titleAr: 'المنظمات والمؤسسات المحلية غير الحكومية',
      titleEn: 'National & Local NGOs',
      descAr: 'بناء قدرات الكوادر في إدارة المخاطر، بروتوكولات السلامة الميدانية، واستراتيجيات كسب القبول المجتمعي.',
      descEn: 'Capacity building in field risk management, personal safety protocols, and community acceptance strategies.',
    },
    {
      titleAr: 'الفرق الميدانية وكوادر الاستجابة الإنسانية',
      titleEn: 'Field Response Teams & Aid Personnel',
      descAr: 'توعية بالدعم النفسي الأولي، التعامل مع ضغوط بيئات النزاع، وتصميم مسارات الإحالة التخصصية المعتمدة.',
      descEn: 'Psychological first aid sensitization, acute stress management, and vetted specialized referral pathways.',
    },
    {
      titleAr: 'مجموعات الإمداد والخدمات اللوجستية الإنسانية',
      titleEn: 'Humanitarian Logistics & Supply Clusters',
      descAr: 'تقييم أمان سلاسل الإمداد ونقاط الاختناق الحركي، وتحديثات سجل المخاطر التشغيلية على المعابر.',
      descEn: 'Supply chain corridor safety assessments, movement bottleneck reviews, and transit risk register updates.',
    },
    {
      titleAr: 'الشبكات والجهات المجتمعية المحلية',
      titleEn: 'Local Community Networks & Mediators',
      descAr: 'تعزيز الحوار المجتمعي المشترك، ترسيخ مبادئ عدم الإضرار والحياد، وتيسير وصول المساعدات للمجتمعات الأشد احتياجاً.',
      descEn: 'Fostering local dialogue, reinforcing do-no-harm and neutrality principles, and facilitating aid delivery to vulnerable communities.',
    },
  ];

  const beneficiariesList = dbBeneficiaries.length > 0
    ? dbBeneficiaries.map((b) => ({
        titleAr: b.titleAr || b.titleEn || '',
        titleEn: b.titleEn || b.titleAr || '',
        descAr: b.descriptionAr || b.descriptionEn || '',
        descEn: b.descriptionEn || b.descriptionAr || '',
      }))
    : fallbackBeneficiaries;

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
          <span className="section-tag">{t.servicesSectionTitle}</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem' }}>
            {t.siteTitle}
          </h1>
          <p style={{ color: 'var(--facss-ivory-300)', fontSize: '1.1rem', maxWidth: '750px', marginInline: 'auto' }}>
            {t.tagline}
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
                {isAr ? 'سيتم إدراج مجالات النشاط الميداني وخدمات تقييم المخاطر والوصول الإنساني قريباً عبر لوحة الإدارة.' : 'Field activity fields, risk assessment, and humanitarian access services will be published soon via the administration.'}
              </p>
            </div>
          ) : (
            categories.map((cat) => {
            const catTitle = isAr ? cat.titleAr : (cat.titleEn || cat.titleAr);
            const catSub = isAr ? cat.titleEn : null;

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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
                  {cat.services.map((srv) => {
                    let features: string[] = [];
                    try {
                      const rawFeatures = isAr ? srv.featuresAr : (srv.featuresEn || srv.featuresAr);
                      features = JSON.parse(rawFeatures || '[]');
                    } catch {
                      features = [];
                    }

                    const srvTitle = isAr ? srv.titleAr : (srv.titleEn || srv.titleAr);
                    const srvSub = isAr ? srv.titleEn : null;
                    const srvDesc = isAr ? srv.shortDescAr : (srv.shortDescEn || srv.shortDescAr);

                    return (
                      <div key={srv.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span className="badge badge-gold">{catTitle}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>{t.siteAcronym}</span>
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

      {/* Humanitarian & Field Beneficiary Sectors */}
      <section className="section" style={{ background: 'var(--surface-sunken)', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.targetSectors}</span>
            <h2 className="section-title">
              {isAr ? 'الجهات والقطاعات المستفيدة من خدمات المركز' : 'Beneficiary Sectors & Partners We Support'}
            </h2>
            <p className="section-subtitle">
              {isAr
                ? 'تقييمات ميدانية واستشارات متخصصة مصممة لتيسير الوصول الإنساني الآمن وحماية الكوادر والفرق العاملة في الميدان'
                : 'Field assessments and specialized advisory tailored to facilitate safe humanitarian access and protect aid workers.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
            {beneficiariesList.map((sec, idx) => (
              <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span className="badge badge-gold">
                      {isAr ? 'قطاع إنساني شريك' : 'Humanitarian Sector'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 700 }}>0{idx + 1}</span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    {isAr ? sec.titleAr : sec.titleEn}
                  </h3>
                  {isAr && sec.titleEn && (
                    <h4 style={{ fontSize: '0.82rem', color: 'var(--facss-gold-700)', fontWeight: 600, marginBottom: '0.85rem' }}>
                      {sec.titleEn}
                    </h4>
                  )}

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
                    <span>{isAr ? 'طلب استشارة أو تقييم ميداني' : 'Request Field Consultation or Assessment'}</span>
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
