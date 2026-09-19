'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Shield,
  Award,
  Users,
  Target,
  Compass,
  CheckCircle,
  FileCheck,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Building2,
  Lock,
  Zap,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export default function AboutPage() {
  const { t, locale, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const values = [
    { titleAr: 'النزاهة', titleEn: 'Integrity', descAr: 'الشفافية والأخلاقيات المهنية فوق كل اعتبار.', descEn: 'Transparency and professional ethics above all considerations.', icon: Shield },
    { titleAr: 'الاحترافية', titleEn: 'Professionalism', descAr: 'العمل بضوابط مهنية دقيقة وأداءٍ مُنظَّم ومتقن.', descEn: 'Operating to rigorous professional standards with structured precision.', icon: Award },
    { titleAr: 'الانضباط', titleEn: 'Discipline', descAr: 'الالتزام بالأنظمة والتعليمات بأعلى مستوى من الدقة.', descEn: 'Strict adherence to protocols with the highest level of rigor.', icon: CheckCircle },
    { titleAr: 'السرية', titleEn: 'Confidentiality', descAr: 'حماية بيانات العميل وخصوصيّته التزامٌ قطعي لا خيار فيه.', descEn: 'Protecting client data and privacy is an absolute obligation.', icon: Lock },
    { titleAr: 'الكفاءة', titleEn: 'Efficiency', descAr: 'تحقيق أعلى قيمة بأفضل استخدامٍ واستثمار للموارد.', descEn: 'Maximizing value through optimal resource utilization.', icon: Zap },
    { titleAr: 'التطوير المستمر', titleEn: 'Continuous Improvement', descAr: 'الاستثمار الدائم في التدريب والأبحاث والابتكار التقني.', descEn: 'Relentless investment in training, research, and innovation.', icon: TrendingUp },
  ];

  return (
    <div>
      {/* Page Header Banner */}
      <section
        style={{
          paddingBlock: '4rem',
          background: 'linear-gradient(180deg, var(--facss-green-950) 0%, var(--facss-green-900) 100%)',
          borderBottom: '1px solid rgba(201, 162, 39, 0.25)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <span className="section-tag">{t.navAbout}</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem' }}>
            {t.aboutTitle}
          </h1>
          <p style={{ color: 'var(--facss-ivory-300)', fontSize: '1.15rem', maxWidth: '750px', marginInline: 'auto' }}>
            {t.slogan} • {t.sloganSub}
          </p>
        </div>
      </section>

      {/* Main Identity & Overview */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
            <div>
              <span className="section-tag">{locale === 'ar' ? 'الهوية والنشأة' : 'Identity & Heritage'}</span>
              <h2 className="section-title">
                {locale === 'ar' ? 'كيان أمني يمني متخصص ومقره عدن' : 'Specialized Security Entity Based in Aden'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.8, marginBottom: '1.2rem' }}>
                {t.aboutParagraph1}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                {t.aboutParagraph2}
              </p>

              <div style={{ padding: '1.25rem', background: 'var(--surface-sunken)', borderRadius: '12px', border: '1px solid var(--border-color)', borderInlineStart: '4px solid var(--facss-gold-500)' }}>
                <h4 style={{ color: 'var(--facss-green-900)', fontWeight: 800, marginBottom: '0.5rem' }}>
                  {t.whyFacssTitle}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
                  {t.whyFacssText}
                </p>
              </div>
            </div>

            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <img
                src="/images/logo.png"
                alt="FACSS Official Logo"
                style={{ width: '180px', height: '180px', marginInline: 'auto', marginBottom: '1.5rem', objectFit: 'contain' }}
              />
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {t.siteTitle}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Aden First Center for Security Services and Strategic Studies (FACSS)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <ShieldCheck size={26} style={{ color: 'var(--facss-gold-600)', marginInline: 'auto', marginBottom: '0.3rem' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>{locale === 'ar' ? 'طواقم مؤهلة' : 'Qualified Personnel'}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'تأهيل وتدريب احترافي' : 'Professional Training'}</span>
                </div>
                <div style={{ padding: '0.85rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <Award size={26} style={{ color: 'var(--facss-green-700)', marginInline: 'auto', marginBottom: '0.3rem' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>{locale === 'ar' ? 'معايير وطنية' : 'National Compliance'}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'امتثال للوائح الرسمية' : 'Regulatory Alignment'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section" style={{ background: 'var(--surface-sunken)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Vision */}
            <div className="card" style={{ borderInlineStart: '4px solid var(--facss-gold-500)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
                <Target size={28} style={{ color: 'var(--facss-gold-600)' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t.visionTitle}</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.8 }}>
                {t.visionText}
              </p>
            </div>

            {/* Mission */}
            <div className="card" style={{ borderInlineStart: '4px solid var(--facss-green-800)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
                <Compass size={28} style={{ color: 'var(--facss-green-800)' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t.missionTitle}</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.8 }}>
                {t.missionText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.valuesTitle}</span>
            <h2 className="section-title">
              {locale === 'ar' ? 'قيمنا المؤسسية الحاكمة' : 'Core Institutional Values'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {values.map((v, idx) => {
              const VIcon = v.icon;
              return (
                <div key={idx} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.8rem' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: 'rgba(201, 162, 39, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--facss-gold-700)',
                      }}
                    >
                      <VIcon size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {locale === 'ar' ? v.titleAr : v.titleEn}
                    </h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {locale === 'ar' ? v.descAr : v.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cadres & Leadership Credentials */}
      <section className="section" style={{ background: 'var(--surface-sunken)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.teamTitle}</span>
            <h2 className="section-title">
              {locale === 'ar' ? 'الفريق الأمني وكادر التدريب والاستشاريين' : 'Security Cadres & Leadership'}
            </h2>
            <p className="section-subtitle">{t.teamSubtitle}</p>
          </div>

          <div className="card" style={{ padding: '2.5rem', maxWidth: '960px', marginInline: 'auto' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              {t.teamP1}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.8, marginBottom: '1.8rem' }}>
              {t.teamP2}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <div>
                <h4 style={{ color: 'var(--facss-green-900)', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {locale === 'ar' ? 'كادر التدريب والتأهيل' : 'Training Cadre'}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {locale === 'ar'
                    ? 'مدربون ذوو خبرة ميدانية وتطبيقية في مجالات تأهيل الحراس، حماية الشخصيات، والسلامة المهنية والإسعافات وإدارة الطوارئ.'
                    : 'Experienced field trainers in guarding, close protection, OHS safety, and emergency response.'}
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--facss-green-900)', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {locale === 'ar' ? 'فريق الاستشاريين والخبراء' : 'Consultants & Analysts'}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {locale === 'ar'
                    ? 'مستشارون متخصصون في التحليل الاستراتيجي للمخاطر، تقييم الأمن المادي، التصميم الأمني، والسياسات الاستراتيجية.'
                    : 'Specialized advisors in threat modeling, physical vulnerability audits, security engineering, and policy research.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Merged Methodology: 4 Operational Phases */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{locale === 'ar' ? 'فلسفة العمل ودورة التشغيل' : 'Operational Lifecycle'}</span>
            <h2 className="section-title">
              {locale === 'ar' ? 'المراحل الأربع لتقديم المنظومة الأمنية' : 'The Four Stages of Service Delivery'}
            </h2>
            <p className="section-subtitle">
              {locale === 'ar'
                ? 'نظام تشغيلي متكامل يضمن الرقابة والدقة والاستجابة الاحترافية من اللقاء الأول حتى تسليم التقارير'
                : 'A structured operating system ensuring precision, active oversight, and professional delivery'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem' }}>
            <div className="card" style={{ borderTop: '4px solid var(--facss-gold-500)' }}>
              <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>
                {locale === 'ar' ? 'المرحلة الأولى' : 'Phase 1'}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                {locale === 'ar' ? 'التقييم والاستماع' : 'Assessment & Scoping'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7 }}>
                {locale === 'ar'
                  ? 'نلتقي بالجهة المستفيدة ونفهم بعمق طبيعة عملها وتحدياتها، ونُحلّل التهديدات المباشرة المحيطة بأصولها ومنشآتها.'
                  : 'We engage directly with the client to understand operational threats, vulnerabilities, and environmental dynamics.'}
              </p>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--facss-gold-500)' }}>
              <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>
                {locale === 'ar' ? 'المرحلة الثانية' : 'Phase 2'}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                {locale === 'ar' ? 'التحليل والتخطيط' : 'Analysis & Planning'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7 }}>
                {locale === 'ar'
                  ? 'نُقدّم تقريراً تقييمياً مفصّلاً مدعوماً بمصفوفة المخاطر وخطةٍ أمنيةٍ متكاملة، مع خيارات واضحة للمعدات والكوادر وجداول التنفيذ.'
                  : 'We deliver an actionable risk matrix and security blueprint, specifying equipment, cadre allocation, and execution phases.'}
              </p>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--facss-gold-500)' }}>
              <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>
                {locale === 'ar' ? 'المرحلة الثالثة' : 'Phase 3'}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                {locale === 'ar' ? 'التنفيذ والمتابعة' : 'Execution & Supervision'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7 }}>
                {locale === 'ar'
                  ? 'نُنفّذ الخطة المتفق عليها بكوادرٍ مؤهَّلة وأدواتٍ تقنية حديثة، مع الإشراف الميداني المستمر والمتابعة الدورية ورفع تقارير الأداء.'
                  : 'We deploy qualified security cadres and technical solutions under strict field oversight with ongoing progress reporting.'}
              </p>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--facss-gold-500)' }}>
              <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>
                {locale === 'ar' ? 'المرحلة الرابعة' : 'Phase 4'}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                {locale === 'ar' ? 'التحسين المستمر' : 'Continuous Evolution'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7 }}>
                {locale === 'ar'
                  ? 'نُحدّث الإجراءات التشغيلية والخطط الأمنية دورياً بناءً على التغذية الراجعة من العميل والمراجعات الميدانية وتغيّر بيئة التهديد.'
                  : 'We refine standard operating procedures (SOPs) based on threat evolution and operational feedback.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Merged Methodology: 6 Preventive Pillars */}
      <section className="section" style={{ background: 'var(--surface-sunken)', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{locale === 'ar' ? 'المقاربة الوقائية' : 'Preventive Approach'}</span>
            <h2 className="section-title">
              {locale === 'ar' ? 'الركائز الست في فلسفة FACSS' : 'The Six Preventive Pillars'}
            </h2>
            <p className="section-subtitle">
              {locale === 'ar'
                ? '«الأمن في جوهره هو الوقاية قبل الاستجابة. لا ينتظر المنظومة الأمنية القوية وقوع الحادثة لتتحرك، بل تستبقها.»'
                : '“True security is prevention before response. A resilient system does not wait for breaches; it preempts them.”'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {[
              { num: '01', titleAr: 'تحديد المخاطر قبل أن تتحول إلى حوادث', titleEn: 'Preemptive Hazard Detection', descAr: 'رصد استباقي لكافة مهددات الأمن المادي والرقمي والمحيطي وتحليل احتمالية الحدوث.', descEn: 'Proactive surveillance of physical, technical, and perimeter threats to analyze occurrence probability.' },
              { num: '02', titleAr: 'تقييم نقاط الضعف والأصول الحيوية وتصنيفها حسب الأولوية', titleEn: 'Asset & Vulnerability Prioritization', descAr: 'جرد شامل للأصول الحساسة وتحليل الثغرات وترتيب الأولويات لحماية المراكز الحيوية.', descEn: 'Comprehensive inventory of sensitive assets and vulnerability prioritization to safeguard vital centers.' },
              { num: '03', titleAr: 'تعزيز النقاط الضعيفة عبر ضوابط عملية قابلة للقياس', titleEn: 'Measurable Controls Reinforcement', descAr: 'تطبيق ضوابط أمنية مادية وتقنية تخضع لاختبارات دورية وقياس فاعلية دقيق.', descEn: 'Implementation of physical and electronic safeguards subject to periodic readiness audits.' },
              { num: '04', titleAr: 'وضع إجراءات تشغيلية موحدة (SOPs) وخطط طوارئ واضحة', titleEn: 'Standardized Operating Protocols (SOPs)', descAr: 'توحيد بروتوكولات العمل الأمني وخطط الإخلاء والتعامل مع الأزمات دون اجتهادات عشوائية.', descEn: 'Standardizing operational protocols, emergency evacuations, and structured crisis contingency plans.' },
              { num: '05', titleAr: 'تدريب الأفراد على التعرف على المخاطر والإبلاغ عنها', titleEn: 'Human Cadre Competency Building', descAr: 'الاستثمار في الكادر البشري وتأهيله ليكون خط الدفاع الأول في المنشأة والميدان.', descEn: 'Investing in human personnel qualification to serve as the frontline defense across all deployed sites.' },
              { num: '06', titleAr: 'المراجعة الدورية والتحسين المستمر للإجراءات', titleEn: 'Iterative Review & Resilience Adaptation', descAr: 'تحديث الخطط بناءً على المستجدات الميدانية وتغير أنماط التهديد في عدن والإقليم.', descEn: 'Continuous updating of security protocols in response to changing threat landscapes across Aden.' },
            ].map((p, idx) => (
              <div key={idx} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                    {locale === 'ar' ? `ركيزة ${p.num}` : `Pillar ${p.num}`}
                  </span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--facss-gold-600)' }}>
                    {p.num}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  {locale === 'ar' ? p.titleAr : p.titleEn}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {locale === 'ar' ? p.descAr : p.descEn}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <Link href="/request-service" className="btn btn-gold btn-lg">
              <Shield size={18} />
              <span>{locale === 'ar' ? 'طلب دراسة وتقييم أمني لمنشأتك' : 'Request Security Assessment'}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
