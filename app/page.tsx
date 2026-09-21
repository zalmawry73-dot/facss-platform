'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Shield,
  ShieldAlert,
  Compass,
  GraduationCap,
  HeartHandshake,
  Users2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Activity,
  Lock,
  Scale,
  SearchCheck,
  Heart,
  BadgeCheck,
  Building
} from 'lucide-react';

export default function HomePage() {
  const { t, locale, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const isAr = locale === 'ar';

  // 6 Core Humanitarian Principles
  const principles = [
    {
      num: '01',
      title: isAr ? 'عدم الإضرار' : 'Do No Harm',
      desc: isAr 
        ? 'تجنب التسبب في أي مخاطر إضافية للأفراد أو المجتمعات بسبب جمع المعلومات أو نشرها.' 
        : 'Preventing additional risks to individuals or communities from data gathering or dissemination.',
      icon: Shield
    },
    {
      num: '02',
      title: isAr ? 'السرية وحماية البيانات' : 'Confidentiality & Data Protection',
      desc: isAr 
        ? 'تقييد الوصول للمعلومات الحساسة واستخدامها حصريًا للغرض المحدد والمشروع.' 
        : 'Restricting sensitive information access strictly for defined legitimate purposes.',
      icon: Lock
    },
    {
      num: '03',
      title: isAr ? 'الحياد والاستقلالية' : 'Neutrality & Independence',
      desc: isAr 
        ? 'الفصل التام بين التحليل المهني والمصالح السياسية أو العسكرية أو التجارية.' 
        : 'Decoupling professional analysis from political, military, or commercial interests.',
      icon: Scale
    },
    {
      num: '04',
      title: isAr ? 'الدقة والتحقق' : 'Accuracy & Verification',
      desc: isAr 
        ? 'التمييز المنهجي الصارم بين المعلومة المؤكدة وغير المؤكدة والادعاء.' 
        : 'Rigorous methodical distinction between verified facts, unconfirmed reports, and claims.',
      icon: SearchCheck
    },
    {
      num: '05',
      title: isAr ? 'احترام الكرامة' : 'Respect for Dignity',
      desc: isAr 
        ? 'التعامل المهني الإنساني مع العاملين والمجتمعات والشركاء وصون الكرامة دون وصم.' 
        : 'Respectful, non-stigmatizing engagement with aid workers, partners, and communities.',
      icon: Heart
    },
    {
      num: '06',
      title: isAr ? 'المهنية والمساءلة' : 'Professionalism & Accountability',
      desc: isAr 
        ? 'توثيق القرارات، مراجعة الأداء، والتعلم المؤسسي المستمر بعد الحدث.' 
        : 'Systematic decision logging, peer review, and post-event institutional learning.',
      icon: BadgeCheck
    },
  ];

  // 6 Approved Humanitarian Activity Fields
  const activityFields = [
    {
      id: 'field-1',
      title: t.field1Title,
      desc: t.field1Desc,
      icon: ShieldAlert,
      link: '/services',
    },
    {
      id: 'field-2',
      title: t.field2Title,
      desc: t.field2Desc,
      icon: Compass,
      link: '/services',
    },
    {
      id: 'field-3',
      title: t.field3Title,
      desc: t.field3Desc,
      icon: GraduationCap,
      link: '/training',
    },
    {
      id: 'field-4',
      title: t.field4Title,
      desc: t.field4Desc,
      icon: HeartHandshake,
      link: '/services',
    },
    {
      id: 'field-5',
      title: t.field5Title,
      desc: t.field5Desc,
      icon: Users2,
      link: '/services',
    },
    {
      id: 'field-6',
      title: t.field6Title,
      desc: t.field6Desc,
      icon: BookOpen,
      link: '/research',
    },
  ];

  // Beneficiary Categories
  const beneficiaries = [
    {
      title: isAr ? 'المنظمات غير الحكومية الدولية والمحلية' : 'International & National NGOs',
      desc: isAr 
        ? 'تزويد المنظمات الإنسانية بتقييمات دقيقة لمخاطر الوصول وإرشادات السلامة الميدانية.' 
        : 'Providing humanitarian agencies with access risk assessments and field safety guidance.',
      icon: Building
    },
    {
      title: isAr ? 'فرق الإغاثة والبعثات الميدانية' : 'Field Relief & Mobile Missions',
      desc: isAr 
        ? 'دعم مسارات الحركة وتأهيل الفرق للتعامل مع بيئة العمل الميداني وإدارة المخاطر.' 
        : 'Supporting movement corridors and preparing teams for challenging field operational dynamics.',
      icon: Compass
    },
    {
      title: isAr ? 'وكالات التنمية والعمل الإنساني' : 'Development & Aid Agencies',
      desc: isAr 
        ? 'تحليلات السياق وأصحاب المصلحة لدعم استدامة المشاريع وتسهيل وصول المساعدات.' 
        : 'Context analyses and stakeholder mapping to advance project sustainability and safe access.',
      icon: Activity
    },
    {
      title: isAr ? 'المبادرات والمجتمعات المحلية' : 'Local Initiatives & Communities',
      desc: isAr 
        ? 'تعزيز القبول المجتمعي والتنسيق الإنساني بما يخدم حماية العاملين والفئات المتأثرة.' 
        : 'Fostering community acceptance and coordination to safeguard aid workers and beneficiaries.',
      icon: Users2
    },
  ];

  return (
    <div>
      {/* ----------------------------------------------------
         SECTION 1: HERO (INSTITUTIONAL & CALM)
         ---------------------------------------------------- */}
      <section
        style={{
          backgroundColor: 'var(--facss-green-950)',
          borderBottom: '1px solid rgba(201, 162, 39, 0.25)',
          paddingTop: '4.5rem',
          paddingBottom: '4.5rem',
          color: '#FFFFFF',
          position: 'relative',
        }}
      >
        <div className="container" style={{ maxWidth: '980px', textAlign: 'center' }}>
          {/* Slogan Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(201, 162, 39, 0.12)',
              border: '1px solid rgba(201, 162, 39, 0.3)',
              marginBottom: '1.5rem',
            }}
          >
            <Shield size={15} style={{ color: 'var(--facss-gold-400)' }} />
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>
              {t.slogan}
            </span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: 'clamp(1.85rem, 3.8vw, 2.75rem)',
              fontWeight: 900,
              lineHeight: 1.3,
              marginBottom: '1.25rem',
              color: '#FFFFFF',
            }}
          >
            {t.heroHeadline}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-on-dark-muted)',
              lineHeight: 1.75,
              marginBottom: '2.25rem',
              maxWidth: '820px',
              marginInline: 'auto',
            }}
          >
            {t.heroSubheadline}
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/request-service" className="btn btn-gold btn-lg">
              <Shield size={17} />
              <span>{t.heroCtaPrimary}</span>
              <ArrowIcon size={16} />
            </Link>
            <Link href="/services" className="btn btn-outline-dark btn-lg">
              <span>{t.heroCtaSecondary}</span>
            </Link>
          </div>

          {/* Institutional Highlights */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginTop: '3.25rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
              <ShieldAlert size={18} style={{ color: 'var(--facss-gold-400)' }} />
              <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-on-dark-muted)' }}>
                {t.heroBadge1}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
              <Compass size={18} style={{ color: 'var(--facss-gold-400)' }} />
              <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-on-dark-muted)' }}>
                {t.heroBadge2}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
              <GraduationCap size={18} style={{ color: 'var(--facss-gold-400)' }} />
              <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-on-dark-muted)' }}>
                {t.heroBadge3}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         SECTION 2: 6 CORE HUMANITARIAN PRINCIPLES
         ---------------------------------------------------- */}
      <section className="section" style={{ backgroundColor: 'var(--surface-bg)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.pillarsTitle}</span>
            <h2 className="section-title">
              {isAr ? 'المبادئ والقيم الحاكمة لنشاط المركز' : 'Core Humanitarian Principles & Standards'}
            </h2>
            <p className="section-subtitle">
              {t.pillarsSubtitle}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {principles.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1.4rem',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(201, 162, 39, 0.12)',
                      color: 'var(--facss-gold-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--facss-gold-600)', display: 'block', marginBottom: '0.2rem' }}>
                      {p.num}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         SECTION 3: 6 APPROVED HUMANITARIAN ACTIVITY FIELDS
         ---------------------------------------------------- */}
      <section className="section" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.servicesSectionTitle}</span>
            <h2 className="section-title">
              {isAr ? 'مجالات النشاط والخدمات الميدانية المعتمدة' : 'Approved Humanitarian Activity Fields'}
            </h2>
            <p className="section-subtitle">
              {t.servicesSectionSubtitle}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {activityFields.map((field, idx) => {
              const Icon = field.icon;
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--facss-green-50)',
                        border: '1px solid var(--facss-green-100)',
                        color: 'var(--facss-green-800)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.1rem',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.6rem', lineHeight: 1.4 }}>
                      {field.title}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                      {field.desc}
                    </p>
                  </div>

                  <Link
                    href={field.link}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--facss-green-800)',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)',
                      textDecoration: 'none',
                    }}
                  >
                    <span>{isAr ? 'تفاصيل المجال' : 'Learn More'}</span>
                    <ArrowIcon size={14} />
                  </Link>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/services" className="btn btn-secondary">
              <span>{t.allServices}</span>
              <ArrowIcon size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         SECTION 4: BENEFICIARY SECTORS & PARTNERS
         ---------------------------------------------------- */}
      <section className="section" style={{ backgroundColor: 'var(--surface-bg)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.sectorsWeServeTitle}</span>
            <h2 className="section-title">
              {isAr ? 'الجهات والشركاء المستفيدون من أنشطة المركز' : 'Beneficiaries & Field Partners'}
            </h2>
            <p className="section-subtitle">
              {t.sectorsWeServeSubtitle}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {beneficiaries.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div key={idx} className="card" style={{ padding: '1.75rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(201,162,39,0.12)', color: 'var(--facss-gold-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <Icon size={20} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.4 }}>
                    {b.title}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         SECTION 5: TRAINING & RESEARCH SHOWCASE
         ---------------------------------------------------- */}
      <section className="section" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
            {/* Training Column */}
            <div
              className="card"
              style={{
                padding: '2.25rem',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(201, 162, 39, 0.12)', color: 'var(--facss-gold-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--facss-gold-600)', textTransform: 'uppercase' }}>
                      {isAr ? 'بناء القدرات' : 'Capacity Building'}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {t.trainingSectionTitle}
                    </h3>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                  {isAr
                    ? 'برامج تطبيقية مخصصة لبناء قدرات العاملين في الميدان في مجالات السلامة الشخصية، إدارة مخاطر الحركة، إعداد خطط الوصول، والدعم النفسي الأولي.'
                    : 'Applied programs dedicated to building field personnel capacities in personal safety, movement risk management, access planning, and psychological first aid.'}
                </p>
              </div>
              <Link href="/training" className="btn btn-secondary">
                <span>{isAr ? 'استعراض برامج التدريب' : 'View Training Programs'}</span>
                <ArrowIcon size={15} />
              </Link>
            </div>

            {/* Research Column */}
            <div
              className="card"
              style={{
                padding: '2.25rem',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--facss-green-50)', color: 'var(--facss-green-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--facss-green-800)', textTransform: 'uppercase' }}>
                      {isAr ? 'المنتجات المعرفية' : 'Knowledge Products'}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {t.researchSectionTitle}
                    </h3>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                  {isAr
                    ? 'تقارير دورية وموجزات تحليلية ترصد بيئة وسياق الوصول الإنساني، مع خرائط مخاطر ودراسات مسحية معمقة لدعم اتخاذ القرار وتأمين حركة المساعدات.'
                    : 'Periodic bulletins, analytical briefs, and access risk evaluations monitoring field context to support decision-makers in facilitating principled aid.'}
                </p>
              </div>
              <Link href="/research" className="btn btn-secondary">
                <span>{isAr ? 'استعراض الدراسات والتقارير' : 'Explore Studies & Reports'}</span>
                <ArrowIcon size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         SECTION 6: INSTITUTIONAL CTA
         ---------------------------------------------------- */}
      <section
        style={{
          backgroundColor: 'var(--facss-green-950)',
          borderTop: '1px solid rgba(201, 162, 39, 0.2)',
          paddingBlock: '4rem',
          color: '#FFFFFF',
        }}
      >
        <div className="container" style={{ maxWidth: '840px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, marginBottom: '0.75rem', color: '#FFFFFF' }}>
            {isAr ? 'تنسيق ميداني واستشارات مهنية لدعم سلامة العمل الإنساني' : 'Field Coordination & Professional Advisory for Humanitarian Safety'}
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-on-dark-muted)', lineHeight: 1.65, marginBottom: '1.75rem' }}>
            {isAr
              ? 'تواصل مع إدارة المركز لتقديم طلبات التنسيق الميداني أو استشارات تقييم مخاطر الوصول وبناء خطط الحركة الآمنة'
              : 'Contact center coordination to initiate field assessment requests or access risk analysis for safer operational movement.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/request-service" className="btn btn-gold btn-lg">
              <Shield size={17} />
              <span>{t.requestService}</span>
              <ArrowIcon size={16} />
            </Link>
            <Link href="/contact" className="btn btn-outline-dark btn-lg">
              <span>{t.navContact}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
