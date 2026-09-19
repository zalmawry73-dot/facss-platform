'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Shield,
  ShieldCheck,
  Award,
  Users,
  Building,
  Cpu,
  GraduationCap,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  Building2,
  Briefcase,
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const { t, locale, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const preventivePillars = [
    { num: '01', title: t.pillar1 || 'التحليل الاستباقي للمخاطر وتحديد نقاط الضعف', icon: AlertTriangle },
    { num: '02', title: t.pillar2 || 'تطبيق معايير الأمن والسلامة المهنية المعتمدة', icon: CheckCircle2 },
    { num: '03', title: t.pillar3 || 'تكامل المنظومات الإلكترونية والمراقبة الذكية', icon: ShieldCheck },
    { num: '04', title: t.pillar4 || 'إجراءات تشغيل قياسية وخطط طوارئ معتمدة', icon: Lock },
    { num: '05', title: t.pillar5 || 'تأهيل وتدريب الكوادر الأمنية بصفة دورية', icon: GraduationCap },
    { num: '06', title: t.pillar6 || 'التقييم المستمر والتحديث الدوري للمنظومات', icon: TrendingUp },
  ];

  const mainServices = [
    {
      slug: 'guarding-services',
      titleAr: 'حراسة المنشآت وحماية الشخصيات',
      titleEn: 'Guarding & VIP Protection Services',
      descAr: 'حراسة المنشآت الحكومية والخاصة وتأمين الفعاليات ومرافقة الشخصيات بدوريات عملياتية 24/7.',
      descEn: 'Public & private facility guarding, event security, VIP escort, and 24/7 operational patrols.',
      icon: Shield,
    },
    {
      slug: 'physical-security-assessment',
      titleAr: 'تقييم الأمن المادي للمباني والمنشآت',
      titleEn: 'Physical Security Assessment',
      descAr: 'فحص شامل لمنافذ الدخول والمحيط وأنظمة المراقبة لتحديد الثغرات وإعداد مصفوفة المخاطر.',
      descEn: 'Comprehensive audit of entry gates, perimeters, and surveillance to generate risk matrices.',
      icon: Building2,
    },
    {
      slug: 'security-consultations',
      titleAr: 'الاستشارات الأمنية وتصميم المنظومات',
      titleEn: 'Security Consultations & Ecosystem Design',
      descAr: 'تصميم المنظومات الأمنية المتكاملة، صياغة إجراءات التشغيل SOPs، ودعم الامتثال للمعايير.',
      descEn: 'Integrated security architecture, SOP authoring, crisis planning, and regulatory compliance.',
      icon: Briefcase,
    },
    {
      slug: 'electronic-security-solutions',
      titleAr: 'الأنظمة والحلول الأمنية الإلكترونية',
      titleEn: 'Electronic Security & Advanced Systems',
      descAr: 'كاميرات CCTV، بوابات التحكم بالدخول، التتبع، وغرف العمليات والتحكم والإنذار المبكر.',
      descEn: 'CCTV, access control gates, biometric systems, central control rooms, and early alarms.',
      icon: Cpu,
    },
    {
      slug: 'security-and-safety-training',
      titleAr: 'تدريب وتأهيل الكوادر الأمنية',
      titleEn: 'Security & Safety Cadre Training',
      descAr: 'برامج تدريب وتأهيل للكوادر تشمل مهارات الحراسة الميدانية والسلامة المهنية والإسعافات.',
      descEn: 'Applied training programs for security personnel, occupational safety, and first aid.',
      icon: GraduationCap,
    },
    {
      slug: 'security-risk-analysis',
      titleAr: 'تحليل المخاطر والدراسات الاستراتيجية',
      titleEn: 'Security Risk Analysis & Strategic Studies',
      descAr: 'تحليل استخباري واستراتيجي معمق للتهديدات والسيناريوهات لدعم صناع القرار والمؤسسات.',
      descEn: 'In-depth strategic analysis and threat modeling to support corporate decision-makers.',
      icon: TrendingUp,
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
        <div className="container" style={{ maxWidth: '960px', textAlign: 'center' }}>
          {/* Slogan Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 1rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(201, 162, 39, 0.12)',
              border: '1px solid rgba(201, 162, 39, 0.3)',
              marginBottom: '1.5rem',
            }}
          >
            <Shield size={14} style={{ color: 'var(--facss-gold-400)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>
              {t.slogan || 'الوقاية قبل الاستجابة'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-on-dark-muted)' }}>
              {t.sloganSub || 'Aden First Center for Security Services'}
            </span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: 'clamp(1.85rem, 3.5vw, 2.75rem)',
              fontWeight: 900,
              lineHeight: 1.3,
              marginBottom: '1.25rem',
              color: '#FFFFFF',
            }}
          >
            {locale === 'ar' ? (
              <>
                منظومة أمنية واستشارية متكاملة تُرسي مفهوم{' '}
                <span style={{ color: 'var(--facss-gold-400)' }}>«الوقاية قبل الاستجابة»</span>
              </>
            ) : (
              <>
                Integrated Security Architecture Grounded in{' '}
                <span style={{ color: 'var(--facss-gold-400)' }}>«Prevention Before Response»</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-on-dark-muted)',
              lineHeight: 1.7,
              marginBottom: '2.25rem',
              maxWidth: '780px',
              marginInline: 'auto',
            }}
          >
            {locale === 'ar'
              ? 'يقدم مركز عدن الأول حلولاً أمنية واستشارية وتدريبية متقدمة لحماية المنشآت الحيوية وتأهيل الكوادر، وفق أرقى المعايير المهنية المعتمدة لضمان الجاهزية والامتثال المؤسسي.'
              : 'Aden First Center provides advanced security guarding, technical assessments, and training to protect critical assets and ensure organizational readiness.'}
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/request-service" className="btn btn-gold btn-lg">
              <Shield size={17} />
              <span>{t.heroCtaPrimary || 'طلب خدمة أمنية'}</span>
              <ArrowIcon size={16} />
            </Link>
            <Link href="/services" className="btn btn-outline-dark btn-lg">
              <span>{t.heroCtaSecondary || 'استكشف خدماتنا'}</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Award size={18} style={{ color: 'var(--facss-gold-400)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-on-dark-muted)' }}>
                {locale === 'ar' ? 'طواقم أمنية مؤهلة ميدانياً' : 'Professionally Trained Field Cadres'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--facss-gold-400)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-on-dark-muted)' }}>
                {locale === 'ar' ? 'جاهزية استجابة ومراقبة 24/7' : '24/7 Command Readiness'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: 'var(--facss-gold-400)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-on-dark-muted)' }}>
                {locale === 'ar' ? 'استشارات ودراسات استراتيجية' : 'Strategic Security Intelligence'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         SECTION 2: CORE PREVENTIVE PILLARS
         ---------------------------------------------------- */}
      <section className="section" style={{ backgroundColor: 'var(--surface-bg)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{locale === 'ar' ? 'المنهجية الوقائية' : 'Preventive Methodology'}</span>
            <h2 className="section-title">
              {locale === 'ar' ? 'ركائز منظومة الوقاية قبل الاستجابة' : 'Core Pillars of Prevention'}
            </h2>
            <p className="section-subtitle">
              {locale === 'ar'
                ? 'نعمل وفق منظومة أمنية استباقية تستند إلى التقييم والتدريب والتجهيز التقني لتقليل المخاطر قبل وقوعها'
                : 'A proactive institutional framework built on threat modeling, rigorous training, and technical precision'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {preventivePillars.map((p, idx) => {
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
                      backgroundColor: 'var(--facss-gold-100)',
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
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      {p.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         SECTION 3: MAIN SERVICES
         ---------------------------------------------------- */}
      <section className="section" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{locale === 'ar' ? 'خدماتنا الأمنية' : 'Operational Services'}</span>
            <h2 className="section-title">
              {locale === 'ar' ? 'حلول أمنية تشغيلية واستشارية متكاملة' : 'Comprehensive Security Solutions'}
            </h2>
            <p className="section-subtitle">
              {locale === 'ar'
                ? 'خدمات شاملة مصممة لتأمين المنشآت الحيوية والشركات والمؤسسات والبعثات الدبلوماسية'
                : 'Customized services for critical infrastructure, private enterprises, and diplomatic missions'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {mainServices.map((service, idx) => {
              const Icon = service.icon;
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
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      {locale === 'ar' ? service.titleAr : service.titleEn}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                      {locale === 'ar' ? service.descAr : service.descEn}
                    </p>
                  </div>

                  <Link
                    href={`/services/${service.slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--facss-green-800)',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span>{locale === 'ar' ? 'تفاصيل الخدمة' : 'Service Details'}</span>
                    <ArrowIcon size={14} />
                  </Link>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/services" className="btn btn-secondary">
              <span>{locale === 'ar' ? 'استعراض كافة الخدمات والتجهيزات الأمنية' : 'View All Services & Systems'}</span>
              <ArrowIcon size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         SECTION 4: INSTITUTIONAL CREDENTIALS / WHY FACSS
         ---------------------------------------------------- */}
      <section className="section" style={{ backgroundColor: 'var(--surface-bg)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{locale === 'ar' ? 'القوة المؤسسية' : 'Institutional Strengths'}</span>
            <h2 className="section-title">
              {locale === 'ar' ? 'لماذا يعتمد صناع القرار على FACSS؟' : 'Why Leaders Trust FACSS'}
            </h2>
            <p className="section-subtitle">
              {locale === 'ar'
                ? 'نجمع بين الانضباط العملياتي، والخبرة الاستراتيجية، والمعايير الأمنية الدولية'
                : 'Combining operational discipline, strategic intelligence, and international compliance'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--facss-gold-100)', color: 'var(--facss-gold-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Award size={20} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {locale === 'ar' ? 'الانضباط والامتثال للأطر المنظمة' : 'Regulatory Alignment'}
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {locale === 'ar'
                  ? 'نعمل بانضباط مؤسسي متوافق مع الأطر والقوانين المنظمة لتقديم خدمات الحراسة والاستشارات والدراسات.'
                  : 'Operating with strict institutional discipline aligned with national regulatory frameworks for security services and studies.'}
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--facss-green-50)', color: 'var(--facss-green-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Users size={20} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {locale === 'ar' ? 'طواقم خضعت لفحص أمني دقيق' : 'Vetted & Trained Cadres'}
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {locale === 'ar'
                  ? 'اختيار منضبط للأفراد مع فحص أمني جنائي وتدريب مكثف على مهارات الحراسة والإسعافات والسلامة.'
                  : 'Strict background checks, security clearance vetting, and structured tactical training programs.'}
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--facss-gold-100)', color: 'var(--facss-gold-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Building size={20} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {locale === 'ar' ? 'خبرة في حماية المنشآت الحيوية' : 'Critical Asset Protection'}
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {locale === 'ar'
                  ? 'حلول أمنية مصممة خصيصاً للموانئ، المطارات، البنوك، المنشآت النفطية، والمجمعات الحيوية.'
                  : 'Tailored security architecture designed specifically for ports, banking headquarters, and oil sites.'}
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--facss-green-50)', color: 'var(--facss-green-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Lock size={20} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {locale === 'ar' ? 'سرية تامة وحماية البيانات' : 'Strict Confidentiality'}
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {locale === 'ar'
                  ? 'التزام مطلق بالحفاظ على سرية وثائق وتقارير العملاء ونقاط الضعف الأمنية داخل بيئة تخزين مشفرة.'
                  : 'Non-disclosure agreements, encrypted audit records, and strict zero-trust data storage protocol.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         SECTION 5: ACADEMY & STRATEGIC STUDIES
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
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--facss-gold-100)', color: 'var(--facss-gold-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--facss-gold-600)', textTransform: 'uppercase' }}>
                      {locale === 'ar' ? 'التأهيل المهني' : 'Security Academy'}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {locale === 'ar' ? 'أكاديمية التدريب والتأهيل الأمني' : 'Security Training Academy'}
                    </h3>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                  {locale === 'ar'
                    ? 'برامج ودورات تدريبية متخصصة لتأهيل حراس المنشآت الحيوية، مسؤولي السلامة والصحة المهنية، وإدارة الأزمات، مع شهادات رقمية موثقة برمز تحقق.'
                    : 'Specialized training courses for facility security officers, OHS safety leads, and crisis coordinators with digital verifiable certificates.'}
                </p>
              </div>
              <Link href="/training" className="btn btn-secondary">
                <span>{locale === 'ar' ? 'استعراض الدورات المتاحة والتسجيل' : 'View Courses & Register'}</span>
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
                      {locale === 'ar' ? 'الدراسات الاستشرافية' : 'Strategic Think-Tank'}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {locale === 'ar' ? 'مركز الدراسات والأبحاث الاستراتيجية' : 'Strategic Studies & Research'}
                    </h3>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                  {locale === 'ar'
                    ? 'أبحاث أمنية وتحليلات جيوسياسية معمقة ترصد المتغيرات الإقليمية ومخاطر الملاحة وحماية سلاسل الإمداد لدعم صناع القرار وقادة الأعمال.'
                    : 'Deep strategic intelligence analyzing regional dynamics, maritime navigation safety, and supply chain security for executive leadership.'}
                </p>
              </div>
              <Link href="/research" className="btn btn-secondary">
                <span>{locale === 'ar' ? 'استعراض الدراسات والتقارير' : 'Explore Studies & Reports'}</span>
                <ArrowIcon size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         SECTION 6: FINAL INSTITUTIONAL CTA
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
            {locale === 'ar' ? 'جاهزون لحماية منشأتكم وتأمين عملياتكم' : 'Ready to Secure Your Critical Operations'}
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-on-dark-muted)', lineHeight: 1.65, marginBottom: '1.75rem' }}>
            {locale === 'ar'
              ? 'تواصل مع فريقنا المتخصص لبدء تقييم الاحتياجات الأمنية لمنشأتكم وإعداد خطة الحماية المناسبة'
              : 'Contact our operational specialists to initiate a professional assessment and tailored security plan.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/request-service" className="btn btn-gold btn-lg">
              <Shield size={17} />
              <span>{locale === 'ar' ? 'تقديم طلب خدمة جديد' : 'Submit Service Request'}</span>
              <ArrowIcon size={16} />
            </Link>
            <Link href="/contact" className="btn btn-outline-dark btn-lg">
              <span>{locale === 'ar' ? 'تواصل مع إدارة المركز' : 'Contact Administration'}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
