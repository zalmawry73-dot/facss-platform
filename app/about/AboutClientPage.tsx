'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Shield, Target, Compass, Lock, Scale, SearchCheck, Heart, BadgeCheck,
  Building, GraduationCap, HeartHandshake, Users2, BookOpen,
  ArrowRight, ArrowLeft, Layers, Network, GitBranch, Info, ShieldAlert, Activity
} from 'lucide-react';
import type { ContentBlockData } from '@/lib/content';

// Map lucide icon names to components
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Shield, Target, Compass, Lock, Scale, SearchCheck, Heart, BadgeCheck,
  Building, GraduationCap, HeartHandshake, Users2, BookOpen, Layers,
  Network, GitBranch, Info, ShieldAlert, Activity
};

function getIcon(name: string | null | undefined) {
  if (!name) return Shield;
  return ICON_MAP[name] || Shield;
}

interface Props {
  initialContent: Record<string, ContentBlockData[]>;
  initialLocale: string;
}

export default function AboutClientPage({ initialContent }: Props) {
  const { t, locale, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const isAr = locale === 'ar';

  // Helper to pick localized text from DB block
  function pickTitle(block: ContentBlockData) {
    return isAr ? (block.titleAr || block.titleEn || '') : (block.titleEn || block.titleAr || '');
  }
  function pickDesc(block: ContentBlockData) {
    return isAr ? (block.descriptionAr || block.descriptionEn || '') : (block.descriptionEn || block.descriptionAr || '');
  }

  // Read from DB blocks
  const principlesBlocks = initialContent['principles'] || [];
  const goalsBlocks = (initialContent['identity'] || []).filter(b => b.key.startsWith('goal_'));
  const activityBlocks = initialContent['activity_fields'] || [];
  const lifecycleBlocks = initialContent['lifecycle'] || [];
  const orgBlocks = initialContent['org_structure'] || [];
  const identityBlocks = initialContent['identity'] || [];
  const homepageBlocks = initialContent['homepage'] || [];

  const principlesHeaderBlock = homepageBlocks.find(b => b.key === 'section_principles_header');
  let principlesMeta: any = {};
  try { principlesMeta = principlesHeaderBlock?.metadata ? JSON.parse(principlesHeaderBlock.metadata) : {}; } catch {}
  const principlesSectionTag = (isAr ? principlesMeta.tagAr : principlesMeta.tagEn) || t.pillarsTitle;
  const principlesSectionTitle = principlesHeaderBlock ? pickTitle(principlesHeaderBlock) : t.pillarsTitle;
  const principlesSectionSubtitle = principlesHeaderBlock ? pickDesc(principlesHeaderBlock) : t.pillarsSubtitle;

  const visionBlock = identityBlocks.find(b => b.key === 'vision');
  const missionBlock = identityBlocks.find(b => b.key === 'mission');
  const whyUsBlock = identityBlocks.find(b => b.key === 'why_us');
  const aboutP1 = identityBlocks.find(b => b.key === 'about_paragraph_1');
  const aboutP2 = identityBlocks.find(b => b.key === 'about_paragraph_2');
  const aboutIdentityTagBlock = identityBlocks.find(b => b.key === 'about_section_identity_tag');
  const aboutGoalsSubtitleBlock = identityBlocks.find(b => b.key === 'about_goals_subtitle');
  const aboutCtaBlock = identityBlocks.find(b => b.key === 'about_cta');

  let aboutCtaMeta: any = {};
  try { aboutCtaMeta = aboutCtaBlock?.metadata ? JSON.parse(aboutCtaBlock.metadata) : {}; } catch {}

  const aboutCtaTitle = aboutCtaBlock ? pickTitle(aboutCtaBlock) : (isAr ? 'هل تحتاج إلى استشارة أمنية أو تقييم مخاطر ميدانية؟' : 'Need Institutional Security Advisory or Risk Assessment?');
  const aboutCtaDesc = aboutCtaBlock ? pickDesc(aboutCtaBlock) : (isAr ? 'تواصل مع إدارة المركز لتقديم طلب خدمة أو استشارة تقييم المخاطر وبناء خطط الوقاية والجاهزية.' : 'Contact center coordination to initiate specialized advisory requests or field risk assessments.');
  const aboutCtaPrimaryBtnText = (isAr ? aboutCtaMeta.btnPrimaryTextAr : aboutCtaMeta.btnPrimaryTextEn) || t.navRequestService;
  const aboutCtaPrimaryBtnLink = aboutCtaMeta.btnPrimaryLink || '/request-service';
  const aboutCtaSecondaryBtnText = (isAr ? aboutCtaMeta.btnSecondaryTextAr : aboutCtaMeta.btnSecondaryTextEn) || (isAr ? 'اتصل بنا' : 'Contact Us');
  const aboutCtaSecondaryBtnLink = aboutCtaMeta.btnSecondaryLink || '/contact';

  const overviewTag = aboutIdentityTagBlock ? (isAr ? (aboutIdentityTagBlock.descriptionAr || aboutIdentityTagBlock.descriptionEn) : (aboutIdentityTagBlock.descriptionEn || aboutIdentityTagBlock.descriptionAr)) : (isAr ? 'النشأة والرؤية' : 'Identity & Foundation');
  const overviewTitle = aboutIdentityTagBlock ? pickTitle(aboutIdentityTagBlock) : (isAr ? 'التعريف والنشأة المؤسسية' : 'Institutional Genesis & Mandate');
  const goalsSubtitle = aboutGoalsSubtitleBlock ? pickTitle(aboutGoalsSubtitleBlock) : (isAr ? 'أهداف استراتيجية محددة تقود كافة المبادرات والتطوير التشغيلي للمركز' : 'Strategic objectives guiding all center initiatives and operational development');

  const hasOverview = !!(aboutP1 || aboutP2 || whyUsBlock);
  const hasVisionMission = !!(visionBlock || missionBlock);
  const hasPrinciples = principlesBlocks.length > 0;
  const hasGoals = goalsBlocks.length > 0;
  const hasActivities = activityBlocks.length > 0;
  const hasLifecycle = lifecycleBlocks.length > 0;
  const hasOrg = orgBlocks.length > 0;

  const hasAnyContent = hasOverview || hasVisionMission || hasPrinciples || hasGoals || hasActivities || hasLifecycle || hasOrg;

  return (
    <div>
      {/* ── PAGE HEADER BANNER ── */}
      <section className="page-header-institutional">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-badge-pill" style={{ marginBottom: '1.25rem' }}>
            <Info size={15} style={{ color: 'var(--color-gold-400)' }} />
            <span>{t.navAbout}</span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 3.8vw, 2.75rem)',
              fontWeight: 900,
              color: '#FFFFFF',
              maxWidth: '850px',
              margin: '0 auto 1rem',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}
          >
            {t.aboutTitle}
          </h1>
          <p
            style={{
              color: 'var(--text-on-dark-muted)',
              fontSize: '1.05rem',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: 1.75,
            }}
          >
            {t.aboutSubtitle}
          </p>
        </div>
      </section>

      {/* ── EMPTY STATE WHEN DB CONTENT IS WIPED ── */}
      {!hasAnyContent && (
        <section className="section" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="container">
            <div className="card-institutional" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', marginInline: 'auto' }}>
              <Shield size={44} style={{ color: 'var(--text-muted)', marginInline: 'auto', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {isAr ? 'بيانات التعريف بالمركز قيد التحديث المؤسسي' : 'Institutional profile currently under update'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
                {isAr ? 'سيتم إدراج الرؤية، الرسالة، المبادئ، ومجالات النشاط المعتمدة قريباً عبر لوحة الإدارة.' : 'Vision, mission, principles, and approved activity fields will be published soon via admin.'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── OVERVIEW ── */}
      {hasOverview && (
        <section className="section" style={{ backgroundColor: 'var(--surface-bg)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '2.5rem', alignItems: 'start' }}>
              <div>
                <span className="section-tag">{overviewTag}</span>
                <h2 className="section-title" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', marginBottom: '1.25rem' }}>
                  {overviewTitle}
                </h2>
                {aboutP1 && (
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.85, marginBottom: '1.25rem', fontSize: '1.02rem' }}>
                    {pickDesc(aboutP1)}
                  </p>
                )}
                {aboutP2 && (
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.85, fontSize: '1.02rem', margin: 0 }}>
                    {pickDesc(aboutP2)}
                  </p>
                )}
              </div>

              {/* Why Us Card */}
              {whyUsBlock && (
                <div className="card-institutional-dark" style={{ borderTop: '4px solid var(--color-gold-500)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        background: 'rgba(181, 146, 84, 0.18)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(181, 146, 84, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-gold-400)',
                        flexShrink: 0,
                      }}
                    >
                      <Shield size={24} />
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#FFFFFF', margin: 0 }}>
                      {pickTitle(whyUsBlock)}
                    </h3>
                  </div>
                  <p style={{ color: 'var(--text-on-dark-muted)', lineHeight: 1.8, fontSize: '0.98rem', margin: 0 }}>
                    {pickDesc(whyUsBlock)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── VISION & MISSION ── */}
      {hasVisionMission && (
        <section className="section" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.75rem' }}>
              {[
                visionBlock ? { block: visionBlock, icon: Target, color: 'var(--color-primary-900)' } : null,
                missionBlock ? { block: missionBlock, icon: Compass, color: 'var(--color-gold-700)' } : null,
              ].filter(Boolean).map((item: any, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="card-institutional" style={{ borderTop: `4px solid ${item.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          background: 'rgba(181, 146, 84, 0.12)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={22} style={{ color: item.color }} />
                      </div>
                      <h2 style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
                        {pickTitle(item.block)}
                      </h2>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.96rem', margin: 0 }}>
                      {pickDesc(item.block)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── PRINCIPLES ── */}
      {hasPrinciples && (
        <section className="section" style={{ backgroundColor: 'var(--surface-bg)' }}>
          <div className="container">
            <div className="section-title-wrap">
              <span className="section-tag">{principlesSectionTag}</span>
              <h2 className="section-title">
                {principlesSectionTitle}
              </h2>
              <p className="section-subtitle">
                {principlesSectionSubtitle}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
              {principlesBlocks.map((block, idx) => {
                const Icon = getIcon(block.icon);
                return (
                  <div key={block.id} className="principle-card">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span className="principle-num">{String(idx + 1).padStart(2, '0')}</span>
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
                      <h3 style={{ fontWeight: 800, fontSize: '1.08rem', color: 'var(--text-primary)', marginBottom: '0.45rem', lineHeight: 1.4 }}>
                        {pickTitle(block)}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
                        {pickDesc(block)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── STRATEGIC GOALS ── */}
      {hasGoals && (
        <section className="section" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <div className="section-title-wrap">
              <span className="section-tag">{t.goalsTitle}</span>
              <h2 className="section-title">
                {t.goalsTitle}
              </h2>
              <p className="section-subtitle">
                {goalsSubtitle}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
              {goalsBlocks.map((block, idx) => (
                <div
                  key={block.id}
                  className="card-institutional"
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1.25rem 1.5rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-en)',
                      fontSize: '1.15rem',
                      fontWeight: 900,
                      color: 'var(--color-gold-700)',
                      flexShrink: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.75, margin: 0 }}>
                    {pickDesc(block)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ACTIVITY FIELDS ── */}
      {hasActivities && (
        <section className="section" style={{ backgroundColor: 'var(--surface-bg)' }}>
          <div className="container">
            <div className="section-title-wrap">
              <span className="section-tag">{t.servicesSectionTitle}</span>
              <h2 className="section-title">
                {t.servicesSectionTitle}
              </h2>
              <p className="section-subtitle">{t.servicesSectionSubtitle}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
              {activityBlocks.map((block, idx) => {
                const Icon = getIcon(block.icon);
                return (
                  <Link key={block.id} href={block.link || '/services'} style={{ textDecoration: 'none' }}>
                    <div className="service-card">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
                          <span style={{ fontFamily: 'var(--font-en)', fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-gold-700)' }}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--color-primary-50)',
                              color: 'var(--color-primary-900)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Icon size={20} />
                          </div>
                        </div>
                        <h3 style={{ fontWeight: 800, fontSize: '1.08rem', color: 'var(--text-primary)', marginBottom: '0.65rem', lineHeight: 1.4 }}>
                          {pickTitle(block)}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.65, margin: 0 }}>
                          {pickDesc(block)}
                        </p>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'var(--color-primary-800)',
                          paddingTop: '0.85rem',
                          marginTop: '1.25rem',
                          borderTop: '1px solid var(--border-subtle)',
                        }}
                      >
                        <span>{isAr ? 'عرض التفاصيل' : 'View Details'}</span>
                        <ArrowIcon size={14} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── OPERATIONAL LIFECYCLE ── */}
      {hasLifecycle && (
        <section className="section" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <div className="section-title-wrap">
              <span className="section-tag">{t.lifecycleTitle}</span>
              <h2 className="section-title">{t.lifecycleTitle}</h2>
              <p className="section-subtitle">{t.lifecycleSubtitle}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.25rem' }}>
              {lifecycleBlocks.map((block, idx) => (
                <div key={block.id} className="card-institutional" style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', padding: '1.25rem' }}>
                  <span
                    style={{
                      width: '34px',
                      height: '34px',
                      background: 'var(--color-primary-900)',
                      color: '#fff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      flexShrink: 0,
                      fontFamily: 'var(--font-en)',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>{pickTitle(block)}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.65, margin: 0 }}>{pickDesc(block)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ORGANIZATIONAL STRUCTURE ── */}
      {hasOrg && (
        <section className="section" style={{ backgroundColor: 'var(--surface-bg)' }}>
          <div className="container">
            <div className="section-title-wrap">
              <span className="section-tag">{t.orgStructureTitle}</span>
              <h2 className="section-title">{t.orgStructureTitle}</h2>
              <p className="section-subtitle">{t.orgStructureSubtitle}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem' }}>
              {orgBlocks.map((block) => (
                <div key={block.id} className="card-institutional" style={{ padding: '1.4rem', borderInlineStart: '4px solid var(--color-gold-500)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                    <Layers size={18} style={{ color: 'var(--color-primary-900)', flexShrink: 0 }} />
                    <h4 style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)', margin: 0 }}>{pickTitle(block)}</h4>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.65, margin: 0 }}>{pickDesc(block)}</p>
                </div>
              ))}
            </div>
            <p style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', fontStyle: 'italic' }}>
              {t.orgStructureNote}
            </p>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section
        style={{
          paddingBlock: '4.5rem',
          backgroundColor: 'var(--color-primary-950)',
          borderTop: '1px solid rgba(181, 146, 84, 0.25)',
          textAlign: 'center',
          color: '#FFFFFF',
        }}
      >
        <div className="container" style={{ maxWidth: '820px' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.85rem' }}>
            {aboutCtaTitle}
          </h2>
          <p style={{ color: 'var(--text-on-dark-muted)', marginBottom: '2rem', maxWidth: '640px', marginInline: 'auto', fontSize: '1rem', lineHeight: 1.75 }}>
            {aboutCtaDesc}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={aboutCtaPrimaryBtnLink} className="btn btn-gold btn-lg">
              <Shield size={18} />
              <span>{aboutCtaPrimaryBtnText}</span>
              <ArrowIcon size={16} />
            </Link>
            <Link href={aboutCtaSecondaryBtnLink} className="btn btn-outline-dark btn-lg">
              <span>{aboutCtaSecondaryBtnText}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
