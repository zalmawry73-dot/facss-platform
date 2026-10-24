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
import { getContentSection, getContentBlock } from '@/lib/content';

export const revalidate = 0;

export default async function ServicesPage() {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const t = getTranslation(locale);
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [categories, dbBeneficiaries, bannerBlock, beneficiariesHeaderBlock, activityBlocks] = await Promise.all([
    prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        }
      }
    }),
    getContentSection('beneficiaries'),
    getContentBlock('page_banners', 'banner_services'),
    getContentBlock('homepage', 'section_beneficiaries_header'),
    getContentSection('activity_fields'),
  ]);

  const activityMap = new Map((activityBlocks || []).map(b => [b.key, b]));

  let bannerMeta: any = {};
  try { bannerMeta = bannerBlock?.metadata ? JSON.parse(bannerBlock.metadata) : {}; } catch {}

  const bannerTag = (isAr ? bannerMeta.tagAr : bannerMeta.tagEn) || t.servicesSectionTitle;
  const bannerTitle = (isAr ? (bannerBlock?.titleAr || bannerBlock?.titleEn) : (bannerBlock?.titleEn || bannerBlock?.titleAr)) || t.siteTitle;
  const bannerDesc = (isAr ? (bannerBlock?.descriptionAr || bannerBlock?.descriptionEn) : (bannerBlock?.descriptionEn || bannerBlock?.descriptionAr)) || t.tagline;

  let benHeaderMeta: any = {};
  try { benHeaderMeta = beneficiariesHeaderBlock?.metadata ? JSON.parse(beneficiariesHeaderBlock.metadata) : {}; } catch {}

  const benHeaderTag = (isAr ? benHeaderMeta.tagAr : benHeaderMeta.tagEn) || t.targetSectors;
  const benHeaderTitle = (isAr ? (beneficiariesHeaderBlock?.titleAr || beneficiariesHeaderBlock?.titleEn) : (beneficiariesHeaderBlock?.titleEn || beneficiariesHeaderBlock?.titleAr)) || (isAr ? 'الجهات والقطاعات المستفيدة من خدمات المركز' : 'Beneficiary Sectors & Partners We Support');
  const benHeaderSubtitle = (isAr ? (beneficiariesHeaderBlock?.descriptionAr || beneficiariesHeaderBlock?.descriptionEn) : (beneficiariesHeaderBlock?.descriptionEn || beneficiariesHeaderBlock?.descriptionAr)) || (isAr
    ? 'تقييمات ميدانية واستشارات متخصصة مصممة لتيسير العمل الآمن وحماية الكوادر والمنشآت في الميدان'
    : 'Field assessments and specialized advisory tailored to facilitate safe operations and protect cadres and facilities in the field.');

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
      <section className="page-header-institutional">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-badge-pill" style={{ marginBottom: '1.25rem' }}>
            <Shield size={15} style={{ color: 'var(--color-gold-400)' }} />
            <span>{bannerTag}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.75rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
            {bannerTitle}
          </h1>
          <p style={{ color: 'var(--text-on-dark-muted)', fontSize: '1.05rem', maxWidth: '800px', marginInline: 'auto', lineHeight: 1.75 }}>
            {bannerDesc}
          </p>
        </div>
      </section>

      {/* Services List by Category */}
      <section className="section" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container">
          {categories.length === 0 ? (
            <div className="card-institutional" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', marginInline: 'auto', marginBottom: '2rem' }}>
              <Shield size={44} style={{ color: 'var(--text-muted)', marginInline: 'auto', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {isAr ? 'دليل الخدمات قيد التحديث المؤسسي' : 'Services catalog currently under institutional update'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7 }}>
                {isAr ? 'سيتم إدراج مجالات النشاط الميداني وخدمات تقييم المخاطر والجاهزية قريباً عبر لوحة الإدارة.' : 'Field activity fields, risk assessment, and operational readiness services will be published soon via the administration.'}
              </p>
            </div>
          ) : (
            categories.map((cat) => {
              const catTitle = isAr ? cat.titleAr : (cat.titleEn || cat.titleAr);
              const catSub = isAr ? cat.titleEn : null;
              const block = activityMap.get(cat.slug);
              const catDesc = isAr ? (block?.descriptionAr || '') : (block?.descriptionEn || block?.descriptionAr || '');

              return (
                <div key={cat.id} id={cat.slug} style={{ marginBottom: '4.5rem', scrollMarginTop: '100px' }}>
                  <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(181, 146, 84, 0.14)',
                          color: 'var(--color-gold-700)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Shield size={20} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                          {catTitle}
                        </h2>
                      </div>
                      {catSub && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginInlineStart: 'auto', fontWeight: 600 }}>
                          {catSub}
                        </span>
                      )}
                    </div>
                    {catDesc && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7, margin: '0.65rem 0 0 3.25rem' }}>
                        {catDesc}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.75rem' }}>
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
                        <div key={srv.id} className="card-institutional" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid var(--color-primary-900)' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                              <span className="badge badge-gold">{catTitle}</span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>{t.siteAcronym}</span>
                            </div>

                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.45rem', lineHeight: 1.4 }}>
                              {srvTitle}
                            </h3>
                            {srvSub && (
                              <h4 style={{ fontSize: '0.82rem', color: 'var(--color-gold-700)', fontWeight: 600, marginBottom: '0.85rem' }}>
                                {srvSub}
                              </h4>
                            )}

                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                              {srvDesc}
                            </p>

                            {/* Top Features */}
                            {features.length > 0 && (
                              <div style={{ marginBottom: '1.5rem', background: 'var(--surface-sunken)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem', margin: 0, padding: 0 }}>
                                  {features.slice(0, 3).map((f, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                      <CheckCircle2 size={15} style={{ color: 'var(--color-primary-800)', flexShrink: 0 }} />
                                      <span>{f}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.1rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <Link
                              href={`/services/${srv.slug}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                color: 'var(--color-primary-900)',
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                transition: 'var(--transition)',
                              }}
                            >
                              <span>{isAr ? 'عرض تفاصيل الخدمة' : 'View Service Details'}</span>
                              <ArrowIcon size={14} />
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
            })
          )}
        </div>
      </section>

      {/* Humanitarian & Field Beneficiary Sectors */}
      <section className="section" style={{ background: 'var(--surface-bg)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{benHeaderTag}</span>
            <h2 className="section-title">
              {benHeaderTitle}
            </h2>
            <p className="section-subtitle">
              {benHeaderSubtitle}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
            {beneficiariesList.map((sec, idx) => (
              <div key={idx} className="card-institutional" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span className="badge badge-gold">
                      {isAr ? 'قطاع شريك' : 'Partner Sector'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-en)', fontSize: '0.85rem', color: 'var(--color-gold-700)', fontWeight: 800 }}>
                      0{idx + 1}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.4 }}>
                    {isAr ? sec.titleAr : sec.titleEn}
                  </h3>
                  {isAr && sec.titleEn && (
                    <h4 style={{ fontSize: '0.82rem', color: 'var(--color-gold-700)', fontWeight: 600, marginBottom: '0.85rem' }}>
                      {sec.titleEn}
                    </h4>
                  )}

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
                    {isAr ? sec.descAr : sec.descEn}
                  </p>
                </div>

                <div style={{ paddingTop: '1.25rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <Link
                    href="/request-service"
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <span>{isAr ? 'طلب استشارة أو تقييم ميداني' : 'Request Consultation or Assessment'}</span>
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
