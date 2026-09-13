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
  TrendingUp
} from 'lucide-react';

export default function AboutPage() {
  const { t, locale, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const values = [
    { titleAr: 'النزاهة', titleEn: 'Integrity', descAr: 'الشفافية والأخلاقيات المهنية فوق كل اعتبار.', descEn: 'Transparency and professional ethics above all considerations.', icon: Shield },
    { titleAr: 'الاحترافية', titleEn: 'Professionalism', descAr: 'العمل بمعايير عالمية مُعتمدة وأداءٍ مُنظَّم ومتقن.', descEn: 'Operating to accredited global standards with structured precision.', icon: Award },
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
          paddingBlock: '4.5rem',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(19, 62, 43, 0.6) 0%, rgba(5, 14, 9, 0.95) 80%)',
          borderBottom: '1px solid rgba(197, 155, 39, 0.2)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <span className="section-tag">{t.navAbout}</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFF', marginBottom: '1rem' }}>
            {t.aboutTitle}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '750px', marginInline: 'auto' }}>
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
              <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.8, marginBottom: '1.2rem' }}>
                {t.aboutParagraph1}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                {t.aboutParagraph2}
              </p>

              <div style={{ padding: '1.2rem', background: 'rgba(11, 37, 24, 0.6)', borderRadius: '12px', border: '1px solid rgba(197, 155, 39, 0.3)' }}>
                <h4 style={{ color: 'var(--color-gold-light)', fontWeight: 800, marginBottom: '0.5rem' }}>
                  {locale === 'ar' ? 'لماذا مركز عدن الأول (FACSS)؟' : 'Why FACSS?'}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
                  {locale === 'ar'
                    ? 'نجمع بين خبرة ميدانية طويلة تتجاوز 20 عاماً ومنهج بحثي أكاديمي رصين في كيانٍ واحد، لنغطي دورة الأمان الكاملة من التدريب إلى البحث، ومن الحراسة إلى الاستشارات الاستراتيجية. تُمكّننا الإطلالة العدنية من فهمٍ عميق لطبيعة المخاطر المحلية بينما تربطنا الشبكة الإقليمية بأحدث المعايير الدولية.'
                    : 'We unite over two decades of firsthand field proficiency with rigorous academic research in a single entity, covering the full security lifecycle from guarding to strategic consulting. Our Aden base affords deep grasp of local risks while our network maintains international standards.'}
                </p>
              </div>
            </div>

            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <img
                src="/images/logo.png"
                alt="FACSS Official Logo"
                style={{ width: '180px', height: '180px', marginInline: 'auto', marginBottom: '1.5rem', objectFit: 'contain' }}
              />
              <h3 className="gold-text" style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                {t.siteTitle}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Aden First Center for Security Services and Strategic Studies (FACSS)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', background: 'rgba(5, 14, 9, 0.7)', borderRadius: '8px', border: '1px solid rgba(197, 155, 39, 0.2)' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-gold-light)', display: 'block' }}>+20</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'عاماً خبرة ميدانية' : 'Years Experience'}</span>
                </div>
                <div style={{ padding: '0.85rem', background: 'rgba(5, 14, 9, 0.7)', borderRadius: '8px', border: '1px solid rgba(197, 155, 39, 0.2)' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-gold-light)', display: 'block' }}>100%</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'معايير معتمدة' : 'Certified Standards'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section" style={{ background: 'var(--bg-dark-elevated)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Vision */}
            <div className="card" style={{ borderInlineStart: '4px solid var(--color-gold)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
                <Target size={28} style={{ color: 'var(--color-gold)' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF' }}>{t.visionTitle}</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.8 }}>
                {t.visionText}
              </p>
            </div>

            {/* Mission */}
            <div className="card" style={{ borderInlineStart: '4px solid var(--color-gold)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
                <Compass size={28} style={{ color: 'var(--color-gold)' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF' }}>{t.missionTitle}</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.8 }}>
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
                        background: 'rgba(197, 155, 39, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-gold-light)',
                      }}
                    >
                      <VIcon size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {locale === 'ar' ? v.titleAr : v.titleEn}
                    </h3>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {locale === 'ar' ? v.descAr : v.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cadres & Leadership Credentials */}
      <section className="section" style={{ background: 'var(--bg-dark-elevated)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t.teamTitle}</span>
            <h2 className="section-title">
              {locale === 'ar' ? 'الفريق الأمني وكادر التدريب والاستشاريين' : 'Security Cadres & Leadership'}
            </h2>
            <p className="section-subtitle">{t.teamSubtitle}</p>
          </div>

          <div className="card" style={{ padding: '2.5rem', maxWidth: '960px', marginInline: 'auto' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              {t.teamP1}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.8, marginBottom: '1.8rem' }}>
              {t.teamP2}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <h4 style={{ color: 'var(--color-gold-light)', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {locale === 'ar' ? 'كادر التدريب والتأهيل' : 'Training Cadre'}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {locale === 'ar'
                    ? 'مدربون معتمدون دولياً في مجالات تأهيل الحراس، حماية الشخصيات، والسلامة المهنية والإسعافات وإدارة الطوارئ.'
                    : 'Internationally certified master trainers in guarding, close protection, OHS safety, and emergency command.'}
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--color-gold-light)', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {locale === 'ar' ? 'فريق الاستشاريين والخبراء' : 'Consultants & Analysts'}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {locale === 'ar'
                    ? 'مستشارون متخصصون في التحليل الاستراتيجي للمخاطر، تقييم الأمن المادي، التصميم الأمني، والسياسات الاستراتيجية.'
                    : 'Specialized advisors in threat modeling, physical vulnerability audits, security engineering, and policy research.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
