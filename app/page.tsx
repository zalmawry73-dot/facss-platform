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
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Lock,
  Flame,
  Radio,
  Eye,
  KeyRound,
  FileCheck,
  Building2,
  Plane,
  Landmark,
  Briefcase
} from 'lucide-react';

export default function HomePage() {
  const { t, locale, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const preventivePillars = [
    { num: '01', title: t.pillar1, icon: AlertTriangle },
    { num: '02', title: t.pillar2, icon: CheckCircle2 },
    { num: '03', title: t.pillar3, icon: ShieldCheck },
    { num: '04', title: t.pillar4, icon: FileCheck },
    { num: '05', title: t.pillar5, icon: GraduationCap },
    { num: '06', title: t.pillar6, icon: TrendingUp },
  ];

  const mainServices = [
    {
      slug: 'guarding-services',
      titleAr: 'حراسة المنشآت وحماية الشخصيات',
      titleEn: 'Guarding & VIP Protection Services',
      descAr: 'حراسة المنشآت الحكومية والخاصة، تأمين الفعاليات، مرافقة نقل الأموال والممتلكات الثمينة، ودوريات 24/7.',
      descEn: 'Public & private facility security, event security, cash-in-transit escort, and 24/7 patrols.',
      icon: Shield,
      category: 'خدمات أمنية تشغيلية',
    },
    {
      slug: 'physical-security-assessment',
      titleAr: 'تقييم الأمن المادي للمباني والمنشآت',
      titleEn: 'Physical Security Assessment',
      descAr: 'فحص شامل لنقاط الدخول، السياجات، أنظمة المراقبة والتحكم في الوصول، وتحديد الثغرات وإعداد مصفوفة المخاطر.',
      descEn: 'Comprehensive audit of entry gates, perimeters, surveillance, access control, and vulnerability matrices.',
      icon: Building2,
      category: 'تقييم واستشارات',
    },
    {
      slug: 'security-consultations',
      titleAr: 'الاستشارات الأمنية وتصميم المنظومات',
      titleEn: 'Security Consultations & Ecosystem Design',
      descAr: 'تصميم المنظومات الأمنية المتكاملة، صياغة إجراءات التشغيل SOPs، ودعم الامتثال للمعايير الدولية.',
      descEn: 'Integrated security architecture, SOP authoring, crisis planning, and global regulatory compliance.',
      icon: Briefcase,
      category: 'استشارات استراتيجية',
    },
    {
      slug: 'electronic-security-solutions',
      titleAr: 'الأنظمة والحلول الأمنية الإلكترونية',
      titleEn: 'Electronic Security & Advanced Systems',
      descAr: 'كاميرات CCTV، بوابات الدخول، التعرف على الوجوه، تتبع RFID، غرف العمليات المركزية، ومعدات الإطفاء والإنذار المبكر.',
      descEn: 'CCTV, Access Control, Facial Recognition, RFID, Command Operations Rooms, and Fire Suppression.',
      icon: Cpu,
      category: 'حلول تقنية وهندسية',
    },
    {
      slug: 'security-and-safety-training',
      titleAr: 'تدريب وتأهيل الكوادر الأمنية',
      titleEn: 'Security & Safety Cadre Training',
      descAr: 'برامج تأهيل واعتماد للكوادر والشباب تشمل مهارات الحراسة، حماية الشخصيات، والسلامة المهنية والإسعافات.',
      descEn: 'Accredited training programs for guards, VIP protection, OHS safety, and tactical first aid.',
      icon: GraduationCap,
      category: 'أكاديمية التدريب',
    },
    {
      slug: 'security-risk-analysis',
      titleAr: 'تحليل المخاطر والدراسات الاستراتيجية',
      titleEn: 'Security Risk Analysis & Strategic Studies',
      descAr: 'تحليل معمق للتهديدات والسيناريوهات المحتملة، وإعداد التقارير الدورية لصناع القرار والمؤسسات.',
      descEn: 'In-depth threat modeling, scenario planning, and periodic policy intelligence for leadership.',
      icon: TrendingUp,
      category: 'أبحاث ودراسات',
    },
  ];

  const electronicItems = [
    { titleAr: 'كاميرات المراقبة CCTV والفيديو', titleEn: 'CCTV & Video Surveillance', icon: Eye },
    { titleAr: 'أنظمة التحكم في الدخول Access Control', titleEn: 'Access Control Systems', icon: Lock },
    { titleAr: 'أنظمة الحضور والانصراف الذكية', titleEn: 'Time & Attendance Systems', icon: Users },
    { titleAr: 'إدارة المفاتيح Key Management', titleEn: 'Key Management Systems', icon: KeyRound },
    { titleAr: 'إدارة المباني Building Management BMS', titleEn: 'Building Management Systems', icon: Building },
    { titleAr: 'تجهيزات الشبكات والبنية التحتية', titleEn: 'Networking Hardware', icon: Cpu },
    { titleAr: 'أنظمة التعرف على الوجوه', titleEn: 'Facial Recognition Systems', icon: Eye },
    { titleAr: 'تتبع الأصول والأفراد بتقنية RFID', titleEn: 'RFID Tracking Systems', icon: Radio },
    { titleAr: 'الحواجز الأمنية ومصدات الاقتحام', titleEn: 'Security Barriers & Bollards', icon: Shield },
    { titleAr: 'أجهزة تفتيش الحقائب والأفراد (X-Ray)', titleEn: 'Luggage & Personnel Scanners', icon: ShieldCheck },
    { titleAr: 'غرف عمليات المراقبة والتحكم المركزية', titleEn: 'Integrated Control Rooms', icon: Cpu },
    { titleAr: 'معدات الإطفاء ومضخات وخراطيم المياه', titleEn: 'Fire Pumps, Hoses & Extinguishers', icon: Flame },
    { titleAr: 'أجهزة الإنذار المبكر ضد الحريق والسرقة', titleEn: 'Early Fire & Burglar Alarms', icon: AlertTriangle },
    { titleAr: 'ملابس السلامة والمعدات الواقية والكمامات', titleEn: 'PPE Safety Gear & Respirators', icon: ShieldCheck },
  ];

  const sectorsList = [
    { nameAr: 'الجهات الحكومية والمؤسسات العامة', nameEn: 'Government Entities & Public Institutions', icon: Landmark },
    { nameAr: 'البنوك والمصارف وشركات التأمين', nameEn: 'Banks, Financial Firms & Insurance', icon: Building2 },
    { nameAr: 'الشركات النفطية والموانئ والمطارات', nameEn: 'Oil Companies, Seaports & Airports', icon: Plane },
    { nameAr: 'المنشآت الصناعية والتجارية الكبرى', nameEn: 'Major Industrial & Commercial Complexes', icon: Building },
    { nameAr: 'الفنادق والمنتجعات السياحية', nameEn: 'Hotels & Tourism Resorts', icon: Building2 },
    { nameAr: 'الجامعات والمدارس والمستشفيات', nameEn: 'Universities, Schools & Hospitals', icon: GraduationCap },
    { nameAr: 'الشخصيات المهمة والبعثات الدبلوماسية', nameEn: 'VIP Executives & Diplomatic Missions', icon: Users },
    { nameAr: 'المنظمات الدولية وغير الحكومية', nameEn: 'International & Non-Governmental NGOs', icon: ShieldCheck },
  ];

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section
        style={{
          position: 'relative',
          paddingTop: '6rem',
          paddingBottom: '7rem',
          background: 'radial-gradient(ellipse at 50% -20%, rgba(19, 62, 43, 0.65) 0%, rgba(5, 14, 9, 0.95) 75%)',
          borderBottom: '1px solid rgba(197, 155, 39, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Tactical Ambient Glow Circles */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            insetInlineStart: '50%',
            transform: 'translateX(-50%)',
            width: '650px',
            height: '650px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(197, 155, 39, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '920px', marginInline: 'auto', textAlign: 'center' }}>
            {/* Slogan Banner Badge */}
            <div
              className="glow-animation"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.45rem 1.4rem',
                background: 'rgba(11, 37, 24, 0.85)',
                border: '1px solid rgba(197, 155, 39, 0.4)',
                borderRadius: '9999px',
                marginBottom: '1.75rem',
              }}
            >
              <Shield size={16} style={{ color: 'var(--color-gold-light)' }} />
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-gold-light)' }}>
                {t.slogan}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {t.sloganSub}
              </span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.1rem, 4vw, 3.4rem)',
                fontWeight: 900,
                lineHeight: 1.25,
                color: '#FFFFFF',
                marginBottom: '1.25rem',
              }}
            >
              {locale === 'ar' ? (
                <>
                  منظومة أمنية متكاملة تُرسي مفهوم{' '}
                  <span className="gold-text">«الوقاية قبل الاستجابة»</span>
                </>
              ) : (
                <>
                  Comprehensive Security Ecosystem Grounded in{' '}
                  <span className="gold-text">«Prevention Before Response»</span>
                </>
              )}
            </h1>

            {/* Official Tagline Subheadline */}
            <p
              style={{
                fontSize: '1.15rem',
                color: 'var(--text-muted)',
                lineHeight: 1.7,
                marginBottom: '2.5rem',
                maxWidth: '820px',
                marginInline: 'auto',
              }}
            >
              {t.tagline}
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
              <Link href="/request-service" className="btn btn-gold btn-lg">
                <Shield size={18} />
                <span>{t.heroCtaPrimary}</span>
                <ArrowIcon size={18} />
              </Link>
              <Link href="/services" className="btn btn-outline btn-lg">
                <span>{t.heroCtaSecondary}</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginTop: '3.5rem',
                paddingTop: '2.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                <Award size={20} style={{ color: 'var(--color-gold)' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {t.heroBadge1}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                <ShieldCheck size={20} style={{ color: 'var(--color-gold)' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {t.heroBadge2}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                <Users size={20} style={{ color: 'var(--color-gold)' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {t.heroBadge3}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT FACSS & PREVENTIVE PHILOSOPHY */}
      <section className="section" style={{ background: 'var(--bg-dark-elevated)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
            <div>
              <span className="section-tag">{t.aboutTitle}</span>
              <h2 className="section-title">
                {locale === 'ar' ? (
                  <>
                    الأمن في جوهره هو{' '}
                    <span className="gold-text">الوقاية قبل الاستجابة</span>
                  </>
                ) : (
                  <>
                    Security in its Core is{' '}
                    <span className="gold-text">Prevention Before Response</span>
                  </>
                )}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.8, marginBottom: '1.2rem' }}>
                {t.aboutParagraph1}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '1.8rem' }}>
                {t.aboutParagraph2}
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href="/about" className="btn btn-outline btn-sm">
                  <span>{t.readMore}</span>
                  <ArrowIcon size={14} />
                </Link>
                <Link href="/request-service" className="btn btn-gold btn-sm">
                  <span>{t.requestThisService}</span>
                </Link>
              </div>
            </div>

            {/* Emblem Presentation Card */}
            <div className="card glow-animation" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
              <img
                src="/images/logo.png"
                alt="FACSS Official Seal"
                style={{ width: '170px', height: '170px', marginInline: 'auto', marginBottom: '1.5rem', objectFit: 'contain' }}
              />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF', marginBottom: '0.4rem' }}>
                {t.siteAcronym}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-gold-light)', fontWeight: 600, marginBottom: '1rem' }}>
                {locale === 'ar' ? 'مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية' : 'Aden First Security Center'}
              </p>
              <div style={{ padding: '0.85rem', background: 'rgba(11, 37, 24, 0.7)', borderRadius: '8px', border: '1px solid rgba(197, 155, 39, 0.2)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                  «الأمن في جوهره هو الوقاية قبل الاستجابة. لا ينتظر المنظومة الأمنية القوية وقوع الحادثة لتتحرك، بل تستبقها.»
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE 6 PREVENTIVE PILLARS */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.pillarsTitle}</span>
            <h2 className="section-title">
              {locale === 'ar' ? 'الركائز الست للمقاربة الوقائية' : 'The 6 Pillars of Preventive Security'}
            </h2>
            <p className="section-subtitle">{t.pillarsSubtitle}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {preventivePillars.map((p, idx) => {
              const IconComp = p.icon;
              return (
                <div key={idx} className="card" style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: 'rgba(197, 155, 39, 0.12)',
                      border: '1px solid rgba(197, 155, 39, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-gold-light)',
                      fontWeight: 800,
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    {p.num}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.5 }}>
                      {p.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SERVICES OVERVIEW */}
      <section className="section" style={{ background: 'var(--bg-dark-elevated)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.servicesSectionTitle}</span>
            <h2 className="section-title">
              {locale === 'ar' ? 'منظومة الخدمات الأمنية والاستراتيجية' : 'Comprehensive Security Capabilities'}
            </h2>
            <p className="section-subtitle">{t.servicesSectionSubtitle}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
            {mainServices.map((srv, idx) => {
              const IconComp = srv.icon;
              return (
                <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
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
                        }}
                      >
                        <IconComp size={24} />
                      </div>
                      <span className="badge badge-gold">{srv.category}</span>
                    </div>

                    <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#FFF', marginBottom: '0.65rem' }}>
                      {locale === 'ar' ? srv.titleAr : srv.titleEn}
                    </h3>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      {locale === 'ar' ? srv.descAr : srv.descEn}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <Link
                      href={`/services/${srv.slug}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: 'var(--color-gold-light)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      <span>{t.viewDetails}</span>
                      <ArrowIcon size={14} />
                    </Link>

                    <Link href={`/request-service?service=${srv.slug}`} className="btn btn-outline btn-sm" style={{ fontSize: '0.78rem' }}>
                      {t.requestThisService}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <Link href="/services" className="btn btn-gold btn-lg">
              <span>{t.allServices}</span>
              <ArrowIcon size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. ELECTRONIC SECURITY SOLUTIONS SHOWCASE (14 EQUIPMENT ITEMS) */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.electronicTitle}</span>
            <h2 className="section-title">
              {locale === 'ar' ? 'الأنظمة والحلول الأمنية الإلكترونية ومكافحة الحرائق' : 'Electronic Defense & Fire Suppression Systems'}
            </h2>
            <p className="section-subtitle">{t.electronicSubtitle}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
            {electronicItems.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className="glass-panel"
                  style={{
                    padding: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    border: '1px solid rgba(197, 155, 39, 0.18)',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      background: 'rgba(19, 62, 43, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-gold-light)',
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {locale === 'ar' ? item.titleAr : item.titleEn}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <Link href="/services/electronic-security-solutions" className="btn btn-outline btn-sm">
              <span>{locale === 'ar' ? 'تفاصيل الأنظمة والمواصفات الفنية' : 'View Full Technical Specifications'}</span>
              <ArrowIcon size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. 4-STAGE METHODOLOGY */}
      <section className="section" style={{ background: 'var(--bg-dark-elevated)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.methodologyTitle}</span>
            <h2 className="section-title">
              {locale === 'ar' ? 'منهجية العمل المؤسسية في 4 مراحل' : 'Our 4-Stage Operational Methodology'}
            </h2>
            <p className="section-subtitle">{t.methodologySubtitle}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>01</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: '0.6rem' }}>
                {t.methodPhase1}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                {t.methodPhase1Desc}
              </p>
            </div>

            <div className="card">
              <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>02</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: '0.6rem' }}>
                {t.methodPhase2}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                {t.methodPhase2Desc}
              </p>
            </div>

            <div className="card">
              <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>03</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: '0.6rem' }}>
                {t.methodPhase3}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                {t.methodPhase3Desc}
              </p>
            </div>

            <div className="card">
              <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>04</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: '0.6rem' }}>
                {t.methodPhase4}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                {t.methodPhase4Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECTORS WE SERVE */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.sectorsTitle}</span>
            <h2 className="section-title">
              {locale === 'ar' ? 'القطاعات الحيوية التي يخدمها المركز' : 'Vital Sectors We Safeguard'}
            </h2>
            <p className="section-subtitle">{t.sectorsSubtitle}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
            {sectorsList.map((sec, idx) => {
              const SecIcon = sec.icon;
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      background: 'rgba(197, 155, 39, 0.12)',
                      border: '1px solid rgba(197, 155, 39, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-gold-light)',
                      flexShrink: 0,
                    }}
                  >
                    <SecIcon size={22} />
                  </div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.4 }}>
                    {locale === 'ar' ? sec.nameAr : sec.nameEn}
                  </h4>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION (CTA) BAR */}
      <section
        style={{
          paddingBlock: '4.5rem',
          background: 'linear-gradient(135deg, #0B2518 0%, #133E2B 100%)',
          borderTop: '1px solid rgba(197, 155, 39, 0.3)',
          borderBottom: '1px solid rgba(197, 155, 39, 0.3)',
        }}
      >
        <div className="container" style={{ textAlign: 'center', maxWidth: '850px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem' }}>
            {locale === 'ar' ? 'هل تحتاج إلى تقييم أمني أو حراسة لمنشأتك؟' : 'Require Physical Audit or Facility Protection?'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            {locale === 'ar'
              ? 'تواصل مباشرة مع غرفة العمليات بمركز عدن الأول أو قدّم طلب خدمة رسمي للحصول على رقم مرجعي وخطة أمنية معتمدة.'
              : 'Engage directly with FACSS command operations or submit an official service request for dedicated cadre deployment.'}
          </p>
          <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/request-service" className="btn btn-gold btn-lg">
              <Shield size={18} />
              <span>{t.navRequestService}</span>
            </Link>
            <Link href="/contact" className="btn btn-outline btn-lg">
              <span>{t.navContact}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
