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
  Building,
  Target,
  Layers,
  FileCheck
} from 'lucide-react';
import type { ContentBlockData } from '@/lib/content';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Shield,
  ShieldAlert,
  Compass,
  GraduationCap,
  HeartHandshake,
  Users2,
  BookOpen,
  CheckCircle2,
  FileText,
  Activity,
  Lock,
  Scale,
  SearchCheck,
  Heart,
  BadgeCheck,
  Building,
  Target,
  Layers
};

function getIcon(name: string | null | undefined, defaultIcon: React.ComponentType<any> = Shield) {
  if (!name) return defaultIcon;
  return ICON_MAP[name] || defaultIcon;
}

interface Props {
  initialContent: Record<string, ContentBlockData[]>;
  initialLocale: string;
}

export default function HomeClientPage({ initialContent }: Props) {
  const { t, locale, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const isAr = locale === 'ar';

  function pickTitle(block: ContentBlockData) {
    return isAr ? (block.titleAr || block.titleEn || '') : (block.titleEn || block.titleAr || '');
  }

  function pickDesc(block: ContentBlockData) {
    return isAr ? (block.descriptionAr || block.descriptionEn || '') : (block.descriptionEn || block.descriptionAr || '');
  }

  // 1. Homepage & Identity Blocks
  const homepageBlocks = initialContent['homepage'] || [];
  const identityBlocks = initialContent['identity'] || [];

  const heroHeadlineBlock = homepageBlocks.find(b => b.key === 'hero_headline');
  const heroSubtitleBlock = homepageBlocks.find(b => b.key === 'hero_subtitle');
  const ctaTitleBlock = homepageBlocks.find(b => b.key === 'cta_section_title');
  const ctaSubtitleBlock = homepageBlocks.find(b => b.key === 'cta_section_subtitle');
  const sloganBlock = identityBlocks.find(b => b.key === 'slogan');

  const heroHeadline = heroHeadlineBlock ? (pickDesc(heroHeadlineBlock) || pickTitle(heroHeadlineBlock)) : t.heroHeadline;
  const heroSubtitle = heroSubtitleBlock ? (pickDesc(heroSubtitleBlock) || pickTitle(heroSubtitleBlock)) : t.heroSubheadline;
  const ctaTitle = ctaTitleBlock
    ? (pickDesc(ctaTitleBlock) || pickTitle(ctaTitleBlock))
    : (isAr ? 'خدمات أمنية واستشارات ميدانية متكاملة لبيئات عمل أكثر أماناً' : 'Integrated Security Services & Field Advisory for Safer Operating Environments');
  const ctaSubtitle = ctaSubtitleBlock
    ? (pickDesc(ctaSubtitleBlock) || pickTitle(ctaSubtitleBlock))
    : (isAr ? 'تواصل مع إدارة المركز لطلب خدمات الحراسات الأمنية، الرصد والتحليل، التدريب، أو تجهيزات السلامة وفق منهجية الوقاية أولاً.' : 'Contact center coordination to request security guarding, field monitoring, studies, training, or safety equipment.');
  const sloganText = sloganBlock ? (pickDesc(sloganBlock) || pickTitle(sloganBlock)) : t.slogan;

  // 2. Principles (6 Institutional Principles)
  const dbPrinciples = initialContent['principles'] || [];
  const fallbackPrinciples = [
    {
      num: '01',
      title: isAr ? 'الوقاية أولاً' : 'Prevention First',
      desc: isAr 
        ? 'التركيز على رصد المخاطر مبكراً ومعالجة أسبابها قبل وقوعها، بدلاً من الاكتفاء برد الفعل بعد وقوع الحدث.' 
        : 'Focusing on early risk detection and addressing hazards at source before crisis occurs.',
      icon: Shield
    },
    {
      num: '02',
      title: isAr ? 'المهنية والحياد' : 'Professionalism & Neutrality',
      desc: isAr 
        ? 'تقديم خدمات وتقارير واستشارات مبنية على معايير فنية موضوعية، والتمييز الدقيق بين الوقائع والتقديرات الشخصية.' 
        : 'Delivering technical and advisory services based on objective standards with clear separation between facts and opinions.',
      icon: Scale
    },
    {
      num: '03',
      title: isAr ? 'السرية وأمن المعلومات' : 'Confidentiality & Information Security',
      desc: isAr 
        ? 'حماية بيانات المستفيدين ومخرجات الدراسات الميدانية والتفاصيل التشغيلية عبر ضوابط صارمة ومشفرة لإدارة الوصول.' 
        : 'Protecting partner data, operational details, and field assessments via strict access control protocols.',
      icon: Lock
    },
    {
      num: '04',
      title: isAr ? 'الالتزام بالقانون وحقوق الإنسان' : 'Rule of Law & Human Rights',
      desc: isAr 
        ? 'العمل في إطار التشريعات الوطنية النافذة واحترام حقوق الإنسان وصون الكرامة الإنسانية في جميع مراحل النشاط.' 
        : 'Operating within national regulatory frameworks and full compliance with human rights standards.',
      icon: SearchCheck
    },
    {
      num: '05',
      title: isAr ? 'القابلية للتنفيذ' : 'Actionability',
      desc: isAr 
        ? 'صياغة توصيات وإجراءات واقعية قابلة للقياس والمتابعة والتطبيق العملي في الميدان.' 
        : 'Formulating practical, measurable, and tracked recommendations that can be executed directly in the field.',
      icon: BadgeCheck
    },
    {
      num: '06',
      title: isAr ? 'الشراكة المسؤولة' : 'Responsible Partnership',
      desc: isAr 
        ? 'تحديد الأدوار والمسؤوليات بوضوح وبناء علاقات تكاملية مبنية على الشفافية والتعاون المهني.' 
        : 'Clearly defining roles and responsibilities while fostering transparent, cooperative institutional partnerships.',
      icon: Heart
    },
  ];

  const principlesList = dbPrinciples.length > 0
    ? dbPrinciples.map((b, idx) => ({
        num: String(idx + 1).padStart(2, '0'),
        title: pickTitle(b),
        desc: pickDesc(b),
        icon: getIcon(b.icon, Shield),
      }))
    : fallbackPrinciples;

  // 3. Activity Fields
  const dbActivityFields = initialContent['activity_fields'] || [];
  const fallbackActivityFields = [
    { id: 'field-1', title: t.field1Title, desc: t.field1Desc, icon: ShieldAlert, link: '/services' },
    { id: 'field-2', title: t.field2Title, desc: t.field2Desc, icon: Compass, link: '/services' },
    { id: 'field-3', title: t.field3Title, desc: t.field3Desc, icon: GraduationCap, link: '/training' },
    { id: 'field-4', title: t.field4Title, desc: t.field4Desc, icon: HeartHandshake, link: '/services' },
    { id: 'field-5', title: t.field5Title, desc: t.field5Desc, icon: Users2, link: '/services' },
    { id: 'field-6', title: t.field6Title, desc: t.field6Desc, icon: BookOpen, link: '/research' },
  ];

  const activityFieldsList = dbActivityFields.length > 0
    ? dbActivityFields.map((b) => ({
        id: b.key,
        title: pickTitle(b),
        desc: pickDesc(b),
        icon: getIcon(b.icon, Compass),
        link: b.link || (b.key.includes('training') ? '/training' : b.key.includes('knowledge') || b.key.includes('research') ? '/research' : '/services'),
      }))
    : fallbackActivityFields;

  // 4. Beneficiaries
  const dbBeneficiaries = initialContent['beneficiaries'] || [];
  const fallbackBeneficiaries = [
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

  const beneficiariesList = dbBeneficiaries.length > 0
    ? dbBeneficiaries.map((b) => ({
        title: pickTitle(b),
        desc: pickDesc(b),
        icon: getIcon(b.icon, Building),
      }))
    : fallbackBeneficiaries;

  return (
    <div>
      {/* ----------------------------------------------------
         SECTION 1: HERO (MODERN INSTITUTIONAL / SOVEREIGN)
         ---------------------------------------------------- */}
      <section className="hero-institutional">
        <div className="container" style={{ maxWidth: '1000px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Slogan Pill */}
          <div className="hero-badge-pill">
            <Shield size={16} style={{ color: 'var(--color-gold-400)' }} />
            <span>{sloganText}</span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: 'clamp(2rem, 4.2vw, 3.1rem)',
              fontWeight: 900,
              lineHeight: 1.25,
              marginBottom: '1.25rem',
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
            }}
          >
            {heroHeadline}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
              color: 'var(--text-on-dark-muted)',
              lineHeight: 1.8,
              marginBottom: '2.5rem',
              maxWidth: '840px',
              marginInline: 'auto',
            }}
          >
            {heroSubtitle}
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/request-service" className="btn btn-gold btn-lg">
              <Shield size={18} />
              <span>{t.heroCtaPrimary}</span>
              <ArrowIcon size={16} />
            </Link>
            <Link href="/services" className="btn btn-outline-dark btn-lg">
              <span>{t.heroCtaSecondary}</span>
            </Link>
          </div>

          {/* Institutional Highlights / Trust Anchor Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '1.25rem',
              marginTop: '3.75rem',
              paddingTop: '2.25rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(181, 146, 84, 0.16)',
                  border: '1px solid rgba(181, 146, 84, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold-400)',
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={17} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF' }}>
                {t.heroBadge1}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(181, 146, 84, 0.16)',
                  border: '1px solid rgba(181, 146, 84, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold-400)',
                  flexShrink: 0,
                }}
              >
                <Compass size={17} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF' }}>
                {t.heroBadge2}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(181, 146, 84, 0.16)',
                  border: '1px solid rgba(181, 146, 84, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold-400)',
                  flexShrink: 0,
                }}
              >
                <GraduationCap size={17} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF' }}>
                {t.heroBadge3}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         SECTION 2: 6 INSTITUTIONAL PRINCIPLES
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
            {principlesList.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="principle-card">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
                      <span className="principle-num">{p.num}</span>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'rgba(181, 146, 84, 0.12)',
                          color: 'var(--color-gold-700)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={20} />
                      </div>
                    </div>
                    <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
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
         SECTION 3: 6 APPROVED ACTIVITY FIELDS
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
            {activityFieldsList.map((field, idx) => {
              const Icon = field.icon;
              return (
                <div key={idx} className="service-card">
                  <div>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-primary-50)',
                        border: '1px solid var(--color-primary-200)',
                        color: 'var(--color-primary-900)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.25rem',
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem', lineHeight: 1.4 }}>
                      {field.title}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                      {field.desc}
                    </p>
                  </div>

                  <Link
                    href={field.link}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: 'var(--color-primary-800)',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid var(--border-subtle)',
                      textDecoration: 'none',
                      transition: 'var(--transition)',
                    }}
                  >
                    <span>{isAr ? 'تفاصيل المجال' : 'Learn More'}</span>
                    <ArrowIcon size={15} />
                  </Link>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.75rem' }}>
            <Link href="/services" className="btn btn-secondary btn-lg">
              <span>{t.allServices}</span>
              <ArrowIcon size={16} />
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.5rem' }}>
            {beneficiariesList.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div key={idx} className="card-institutional">
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(181, 146, 84, 0.14)',
                      color: 'var(--color-gold-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1.1rem',
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.55rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>
                    {b.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
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
      <section className="section" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.75rem' }}>
            {/* Training Column */}
            <div
              className="card-institutional"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: '4px solid var(--color-gold-500)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(181, 146, 84, 0.14)',
                      color: 'var(--color-gold-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gold-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {isAr ? 'بناء القدرات والتأهيل' : 'Capacity Building'}
                    </span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                      {t.trainingSectionTitle}
                    </h3>
                  </div>
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '1.75rem' }}>
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
              className="card-institutional"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: '4px solid var(--color-primary-900)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-primary-50)',
                      color: 'var(--color-primary-900)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-800)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {isAr ? 'المنتجات المعرفية' : 'Knowledge Products'}
                    </span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                      {t.researchSectionTitle}
                    </h3>
                  </div>
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '1.75rem' }}>
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
         SECTION 6: DIGITAL VERIFICATION SPOTLIGHT
         ---------------------------------------------------- */}
      <section className="section" style={{ backgroundColor: 'var(--surface-bg)', paddingBlock: '3.5rem' }}>
        <div className="container">
          <div className="quick-verify-banner">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem', alignItems: 'center' }}>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(181, 146, 84, 0.18)',
                    border: '1px solid rgba(181, 146, 84, 0.4)',
                    borderRadius: '99px',
                    padding: '0.35rem 0.95rem',
                    marginBottom: '1rem',
                    color: 'var(--color-gold-400)',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                  }}
                >
                  <BadgeCheck size={16} />
                  <span>{isAr ? 'المصادقة والتحقق الرقمي' : 'Digital Credential Verification'}</span>
                </div>
                <h2 style={{ fontSize: 'clamp(1.4rem, 2.8vw, 1.95rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                  {isAr ? 'بوابة التحقق من صحة الوثائق والشهادات' : 'Official Credential Verification Portal'}
                </h2>
                <p style={{ color: 'var(--text-on-dark-muted)', fontSize: '0.96rem', lineHeight: 1.7, margin: 0, maxWidth: '640px' }}>
                  {isAr
                    ? 'تتيح هذه البوابة للشركاء والجهات المعنية التحقق اللحظي من صحة وسريان الوثائق والشهادات الصادرة عن مركز الحلول المتكاملة للأمن والسلامة.'
                    : 'Empowering partners and authorities to instantly verify credentials and certificates issued by Integrated Solutions Center for Safety and Security.'}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: dir === 'rtl' ? 'flex-start' : 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <Link href="/verify" className="btn btn-gold btn-lg">
                  <FileCheck size={18} />
                  <span>{t.verifyCertificate}</span>
                  <ArrowIcon size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         SECTION 7: INSTITUTIONAL REQUISITION & CTA
         ---------------------------------------------------- */}
      <section
        style={{
          backgroundColor: 'var(--color-primary-950)',
          borderTop: '1px solid rgba(181, 146, 84, 0.25)',
          paddingBlock: '4.5rem',
          color: '#FFFFFF',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div className="container" style={{ maxWidth: '840px' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)', fontWeight: 900, marginBottom: '0.85rem', color: '#FFFFFF' }}>
            {ctaTitle}
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-on-dark-muted)', lineHeight: 1.75, marginBottom: '2rem' }}>
            {ctaSubtitle}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/request-service" className="btn btn-gold btn-lg">
              <Shield size={18} />
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
