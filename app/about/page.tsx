'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Shield,
  Target,
  Compass,
  Lock,
  Scale,
  SearchCheck,
  Heart,
  BadgeCheck,
  Building,
  GraduationCap,
  HeartHandshake,
  Users2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Layers,
  Network,
  GitBranch,
  Info
} from 'lucide-react';

export default function AboutPage() {
  const { t, locale, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const isAr = locale === 'ar';

  const values = [
    { 
      titleAr: 'عدم الإضرار', 
      titleEn: 'Do No Harm', 
      descAr: 'تجنب التسبب في أي مخاطر إضافية للأفراد أو المجتمعات بسبب جمع المعلومات أو نشرها.', 
      descEn: 'Preventing additional risks to individuals or communities from data collection or dissemination.', 
      icon: Shield 
    },
    { 
      titleAr: 'السرية وحماية البيانات', 
      titleEn: 'Confidentiality & Data Protection', 
      descAr: 'تقييد الوصول للمعلومات الحساسة واستخدامها حصريًا للغرض المحدد والمشروع.', 
      descEn: 'Restricting access to sensitive data strictly for defined and authorized purposes.', 
      icon: Lock 
    },
    { 
      titleAr: 'الحياد والاستقلالية', 
      titleEn: 'Neutrality & Independence', 
      descAr: 'الفصل التام بين التحليل المهني والمصالح السياسية أو العسكرية أو التجارية.', 
      descEn: 'Strict separation of professional analysis from political, military, or commercial interests.', 
      icon: Scale 
    },
    { 
      titleAr: 'الدقة والتحقق', 
      titleEn: 'Accuracy & Verification', 
      descAr: 'التمييز المنهجي الصارم بين المعلومة المؤكدة وغير المؤكدة والادعاء.', 
      descEn: 'Rigorous methodical distinction between verified facts, unverified reports, and claims.', 
      icon: SearchCheck 
    },
    { 
      titleAr: 'احترام الكرامة', 
      titleEn: 'Respect for Dignity', 
      descAr: 'التعامل المهني الإنساني مع العاملين والمجتمعات والشركاء وصون الكرامة دون وصم.', 
      descEn: 'Respectful, non-stigmatizing engagement with aid workers, partners, and communities.', 
      icon: Heart 
    },
    { 
      titleAr: 'المهنية والمساءلة', 
      titleEn: 'Professionalism & Accountability', 
      descAr: 'توثيق القرارات، مراجعة الأداء، والتعلم المؤسسي المستمر بعد الحدث.', 
      descEn: 'Systematic decision logging, peer review, and continuous post-event institutional learning.', 
      icon: BadgeCheck 
    },
  ];

  const strategicGoals = [
    t.goal1,
    t.goal2,
    t.goal3,
    t.goal4,
    t.goal5,
    t.goal6,
    t.goal7,
    t.goal8,
  ];

  const activityFields = [
    { num: '01', title: t.field1Title, desc: t.field1Desc, icon: Shield },
    { num: '02', title: t.field2Title, desc: t.field2Desc, icon: Compass },
    { num: '03', title: t.field3Title, desc: t.field3Desc, icon: GraduationCap },
    { num: '04', title: t.field4Title, desc: t.field4Desc, icon: HeartHandshake },
    { num: '05', title: t.field5Title, desc: t.field5Desc, icon: Users2 },
    { num: '06', title: t.field6Title, desc: t.field6Desc, icon: BookOpen },
  ];

  const lifecycleStages = [
    { step: '1', title: isAr ? 'استقبال الاحتياج أو البلاغ' : 'Intake & Logging', desc: isAr ? 'تسجيل المصدر والوقت والموقع ونوع الطلب ومستوى الحساسية.' : 'Recording source, timestamp, geographic coordinates, and sensitivity level.' },
    { step: '2', title: isAr ? 'التحقق والتصنيف' : 'Verification & Classification', desc: isAr ? 'تقييم موثوقية المصدر، درجة التأكد، خطورة المعلومة، والحاجة لتنبيه عاجل.' : 'Evaluating source reliability, certainty grade, severity, and urgency.' },
    { step: '3', title: isAr ? 'التحليل وسياق الأثر' : 'Contextual Analysis', desc: isAr ? 'وضع المعلومة في سياقها الميداني، تحديد الأثر المحتمل، وتقدير الاحتمال.' : 'Modeling field dynamics, potential operational impact, and access implications.' },
    { step: '4', title: isAr ? 'اعتماد المنتج الميداني' : 'Product Clearance', desc: isAr ? 'مراجعة داخلية وتدقيق من مسؤول التحليل أو المنسق قبل المشاركة.' : 'Internal quality review and clearance by the duty analyst prior to dissemination.' },
    { step: '5', title: isAr ? 'التوزيع الآمن' : 'Secure Dissemination', desc: isAr ? 'إرسال التنبيه أو التقرير لقائمة مصرح لها فقط مع تحديد مستوى التصنيف.' : 'Transmitting alerts or briefs exclusively to authorized, designated recipient lists.' },
    { step: '6', title: isAr ? 'المتابعة وتحديث الحالة' : 'Active Monitoring', desc: isAr ? 'تحديث الحالة، استقبال المعلومات الجديدة، وتوثيق الإغلاق أو الإحالة.' : 'Status tracking, logging incoming field updates, and documenting closure or referral.' },
    { step: '7', title: isAr ? 'التعلم بعد الحدث' : 'Post-Event Learning', desc: isAr ? 'إعداد مراجعة مختصرة للحدث واستخلاص إجراءات تحسين تشغيلية.' : 'Conducting brief operational reviews to extract lessons and refine future procedures.' },
  ];

  const proposedUnits = [
    { title: isAr ? 'الإدارة والحوكمة والامتثال' : 'Governance & Compliance Unit', desc: isAr ? 'إدارة العقود، السياسات الداخلية، إدارة المخاطر المؤسسية، ومتابعة الالتزام الأخلاقي والقانوني.' : 'Internal policies, contractual governance, risk mitigation, and ethical compliance.' },
    { title: isAr ? 'إدارة البرامج والعمليات الميدانية' : 'Programs & Field Operations', desc: isAr ? 'تحويل احتياجات الشركاء إلى خطط عمل ميدانية، وتنسيق تنفيذ المشاريع ومتابعة الجودة.' : 'Translating partner needs into field work plans, coordinating execution and quality.' },
    { title: isAr ? 'وحدة الرصد والإنذار المبكر' : 'Early Warning & Monitoring Unit', desc: isAr ? 'إدارة قنوات التواصل الميدانية، التدقيق الأولي في المعلومات، وإصدار التنبيهات المعتمدة.' : 'Field reporting channels, initial information verification, and alert clearance.' },
    { title: isAr ? 'وحدة التحليل وتقييم المخاطر' : 'Analysis & Risk Assessment Unit', desc: isAr ? 'إعداد تقييمات مخاطر الوصول الإنساني، دراسات السياق، ومصفوفات المخاطر الميدانية.' : 'Producing access risk audits, context evaluations, and operational danger matrices.' },
    { title: isAr ? 'وحدة التدريب والدعم النفسي' : 'Training & Psychosocial Support', desc: isAr ? 'تصميم برامج السلامة وإدارة المخاطر، والتوعية بالدعم النفسي الأولي والإحالات التخصصية.' : 'Designing safety curricula, risk protocols, and psychological first aid referrals.' },
    { title: isAr ? 'وحدة التنسيق والتفاوض والقبول' : 'Coordination & Community Acceptance', desc: isAr ? 'تقديم الدعم المهني في التواصل مع المجتمع المحلي وتسهيل الوصول الإنساني غير السياسي.' : 'Fostering non-political community dialogue to facilitate principled aid access.' },
    { title: isAr ? 'المتابعة والتقييم وحماية البيانات' : 'M&E & Data Protection Unit', desc: isAr ? 'وضع مؤشرات الأداء، مراجعة جودة المخرجات، ومراقبة تطبيق سرية المعلومات وحماية البيانات.' : 'Setting performance indicators, output quality review, and strict data security.' },
    { title: isAr ? 'شبكة الخبراء والباحثين الميدانيين' : 'Field Researchers & Expert Network', desc: isAr ? 'الاستعانة بباحثين ومحللين بعقود استشارية محددة مع اتفاقيات سرية ومدونة سلوك مهنية.' : 'Contracting specialized researchers under strict non-disclosure and ethical codes.' },
  ];

  return (
    <div>
      {/* ----------------------------------------------------
         PAGE HEADER BANNER
         ---------------------------------------------------- */}
      <section
        style={{
          paddingBlock: '4rem',
          background: 'linear-gradient(180deg, var(--facss-green-950) 0%, var(--facss-green-900) 100%)',
          borderBottom: '1px solid rgba(201, 162, 39, 0.25)',
          textAlign: 'center',
          color: '#FFFFFF',
        }}
      >
        <div className="container">
          <span className="section-tag">{t.navAbout}</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem' }}>
            {t.aboutTitle}
          </h1>
          <p style={{ color: 'var(--text-on-dark-muted)', fontSize: '1.1rem', maxWidth: '780px', marginInline: 'auto', lineHeight: 1.7 }}>
            {t.aboutSubtitle}
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------
         MAIN IDENTITY & OVERVIEW
         ---------------------------------------------------- */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
            <div>
              <span className="section-tag">{isAr ? 'التعريف والنشأة' : 'Identity & Overview'}</span>
              <h2 className="section-title">
                {isAr ? 'مركز مهني يمني متخصص ومقره العاصمة عدن' : 'A Specialized Professional Center Based in Aden'}
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
                alt={t.siteTitle}
                style={{ width: '160px', height: '160px', marginInline: 'auto', marginBottom: '1.5rem', objectFit: 'contain' }}
              />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {isAr ? 'مركز عدن الدولي للسلامة والدراسات الميدانية' : 'Aden International Center for Safety & Field Assessment'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                {t.slogan}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <Shield size={24} style={{ color: 'var(--facss-gold-600)', marginInline: 'auto', marginBottom: '0.3rem' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>{isAr ? 'سلامة العاملين' : 'Aid Worker Safety'}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{isAr ? 'أولوية الحماية الميدانية' : 'Field Protection'}</span>
                </div>
                <div style={{ padding: '0.85rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <Compass size={24} style={{ color: 'var(--facss-green-700)', marginInline: 'auto', marginBottom: '0.3rem' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>{isAr ? 'الوصول الإنساني' : 'Humanitarian Access'}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{isAr ? 'تقييم مخاطر الحركة' : 'Route Risk Analysis'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         VISION & MISSION
         ---------------------------------------------------- */}
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

      {/* ----------------------------------------------------
         CORE VALUES (6 PRINCIPLES)
         ---------------------------------------------------- */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.valuesTitle}</span>
            <h2 className="section-title">
              {isAr ? 'المبادئ والقيم الحاكمة للعمل' : 'Core Humanitarian Values & Principles'}
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
                      {isAr ? v.titleAr : v.titleEn}
                    </h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                    {isAr ? v.descAr : v.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         STRATEGIC GOALS (8 OBJECTIVES)
         ---------------------------------------------------- */}
      <section className="section" style={{ background: 'var(--surface-sunken)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.goalsTitle}</span>
            <h2 className="section-title">
              {isAr ? 'الأهداف الاستراتيجية المعتمدة' : 'Strategic Objectives'}
            </h2>
            <p className="section-subtitle">
              {isAr 
                ? 'أهداف مؤسسية تترجم رسالة المركز في حماية العاملين وتيسير الوصول الإنساني' 
                : 'Core goals guiding the Center’s institutional trajectory and field contribution'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {strategicGoals.map((goal, idx) => (
              <div 
                key={idx} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '1rem', 
                  padding: '1.35rem' 
                }}
              >
                <div 
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '8px', 
                    background: 'var(--facss-green-50)', 
                    color: 'var(--facss-green-800)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 800, 
                    fontSize: '0.9rem', 
                    flexShrink: 0 
                  }}
                >
                  {idx + 1}
                </div>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                  {goal}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         THE 6 ACTIVITY FIELDS
         ---------------------------------------------------- */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.servicesSectionTitle}</span>
            <h2 className="section-title">
              {isAr ? 'مجالات النشاط والخدمات الميدانية' : 'Approved Activity Fields & Services'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {activityFields.map((f, idx) => {
              const FIcon = f.icon;
              return (
                <div key={idx} className="card" style={{ padding: '1.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(201,162,39,0.12)', color: 'var(--facss-gold-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FIcon size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--facss-gold-600)' }}>{f.num}</span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{f.title}</h3>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         OPERATIONAL LIFECYCLE (7 STAGES)
         ---------------------------------------------------- */}
      <section className="section" style={{ background: 'var(--surface-sunken)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.lifecycleTitle}</span>
            <h2 className="section-title">
              {isAr ? 'المراحل السبع لدورة العمل الميداني' : 'The 7 Stages of Field Operations'}
            </h2>
            <p className="section-subtitle">{t.lifecycleSubtitle}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {lifecycleStages.map((st, idx) => (
              <div key={idx} className="card" style={{ borderTop: '4px solid var(--facss-gold-500)', padding: '1.4rem' }}>
                <span className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>
                  {isAr ? `المرحلة ${st.step}` : `Stage ${st.step}`}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {st.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.6, margin: 0 }}>
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         PROPOSED ORGANIZATIONAL STRUCTURE
         ---------------------------------------------------- */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{isAr ? 'الحوكمة والهيكلة' : 'Governance & Structure'}</span>
            <h2 className="section-title">
              {t.orgStructureTitle}
            </h2>
            <p className="section-subtitle">{t.orgStructureSubtitle}</p>
          </div>

          {/* Structural Notice Box */}
          <div 
            style={{ 
              maxWidth: '860px', 
              marginInline: 'auto', 
              marginBottom: '2.5rem', 
              padding: '1rem 1.25rem', 
              background: 'rgba(201, 162, 39, 0.08)', 
              border: '1px solid rgba(201, 162, 39, 0.25)', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem' 
            }}
          >
            <Info size={20} style={{ color: 'var(--facss-gold-600)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t.orgStructureNote}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {proposedUnits.map((unit, idx) => (
              <div key={idx} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <Layers size={18} style={{ color: 'var(--facss-green-800)' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {unit.title}
                  </h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.6, margin: 0 }}>
                  {unit.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/contact" className="btn btn-gold btn-lg">
              <span>{t.navContact}</span>
              <ArrowIcon size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
