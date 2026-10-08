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

  // Read from DB blocks; fallback to i18n if empty
  const principlesBlocks = initialContent['principles'] || [];
  const goalsBlocks = (initialContent['identity'] || []).filter(b => b.key.startsWith('goal_'));
  const activityBlocks = initialContent['activity_fields'] || [];
  const lifecycleBlocks = initialContent['lifecycle'] || [];
  const orgBlocks = initialContent['org_structure'] || [];
  const identityBlocks = initialContent['identity'] || [];

  const visionBlock = identityBlocks.find(b => b.key === 'vision');
  const missionBlock = identityBlocks.find(b => b.key === 'mission');
  const whyUsBlock = identityBlocks.find(b => b.key === 'why_us');
  const aboutP1 = identityBlocks.find(b => b.key === 'about_paragraph_1');
  const aboutP2 = identityBlocks.find(b => b.key === 'about_paragraph_2');

  // Fallback arrays from i18n if DB empty
  const fallbackGoals = [t.goal1, t.goal2, t.goal3, t.goal4, t.goal5, t.goal6, t.goal7, t.goal8];

  return (
    <div>
      {/* ── PAGE HEADER BANNER ── */}
      <section style={{
        paddingBlock: '4rem',
        background: 'linear-gradient(180deg, var(--facss-green-950) 0%, var(--facss-green-900) 100%)',
        borderBottom: '1px solid rgba(201, 162, 39, 0.25)',
        textAlign: 'center',
        color: '#FFFFFF',
      }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.3)', borderRadius: '99px', padding: '0.4rem 1rem' }}>
            <Info size={15} style={{ color: 'var(--facss-gold-400)' }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--facss-gold-300)', fontWeight: 600 }}>{t.navAbout}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#FFFFFF', maxWidth: '700px', margin: '0 auto 1rem', lineHeight: 1.3 }}>
            {t.aboutTitle}
          </h1>
          <p style={{ color: '#CBD5E1', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            {t.aboutSubtitle}
          </p>
        </div>
      </section>

      {/* ── OVERVIEW ── */}
      <section style={{ paddingBlock: '4rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '2.5rem', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                {isAr ? 'التعريف والنشأة' : 'Identity & Overview'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1rem', fontSize: '1rem' }}>
                {aboutP1 ? pickDesc(aboutP1) : t.aboutParagraph1}
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1rem' }}>
                {aboutP2 ? pickDesc(aboutP2) : t.aboutParagraph2}
              </p>
            </div>

            {/* Why Us Card */}
            <div style={{ background: 'var(--facss-green-950)', color: '#fff', borderRadius: '12px', padding: '2rem', border: '1px solid rgba(201,162,39,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '44px', height: '44px', background: 'rgba(201,162,39,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={22} style={{ color: 'var(--facss-gold-400)' }} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF', margin: 0 }}>
                  {whyUsBlock ? pickTitle(whyUsBlock) : t.whyFacssTitle}
                </h3>
              </div>
              <p style={{ color: '#CBD5E1', lineHeight: 1.75, fontSize: '0.95rem' }}>
                {whyUsBlock ? pickDesc(whyUsBlock) : t.whyFacssText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── VISION & MISSION ── */}
      <section style={{ paddingBlock: '4rem', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>
            {[
              { block: visionBlock, titleFallback: t.visionTitle, descFallback: t.visionText, icon: Target, color: 'var(--facss-green-800)' },
              { block: missionBlock, titleFallback: t.missionTitle, descFallback: t.missionText, icon: Compass, color: 'var(--facss-gold-700)' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="card" style={{ padding: '2rem', borderTop: `4px solid ${item.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.1rem' }}>
                    <div style={{ width: '40px', height: '40px', background: `${item.color}15`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} style={{ color: item.color }} />
                    </div>
                    <h2 style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>
                      {item.block ? pickTitle(item.block) : item.titleFallback}
                    </h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                    {item.block ? pickDesc(item.block) : item.descFallback}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRINCIPLES ── */}
      <section style={{ paddingBlock: '4rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
              {t.pillarsTitle}
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto', fontSize: '0.95rem' }}>
              {t.pillarsSubtitle}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
            {principlesBlocks.length > 0 ? principlesBlocks.map((block, idx) => {
              const Icon = getIcon(block.icon);
              return (
                <div key={block.id} className="card" style={{ padding: '1.5rem', borderInlineStart: '4px solid var(--facss-green-800)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <div style={{ width: '36px', height: '36px', background: 'rgba(18,59,44,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} style={{ color: 'var(--facss-green-800)' }} />
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
                      {pickTitle(block)}
                    </h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
                    {pickDesc(block)}
                  </p>
                </div>
              );
            }) : (
              // Fallback to i18n
              [t.pillar1, t.pillar2, t.pillar3, t.pillar4, t.pillar5, t.pillar6].map((val, i) => (
                <div key={i} className="card" style={{ padding: '1.5rem', borderInlineStart: '4px solid var(--facss-green-800)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{val}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── STRATEGIC GOALS ── */}
      <section style={{ paddingBlock: '4rem', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
              {t.goalsTitle}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1rem' }}>
            {(goalsBlocks.length > 0 ? goalsBlocks : []).map((block, idx) => (
              <div key={block.id} style={{ display: 'flex', gap: '0.85rem', padding: '1.1rem 1.25rem', background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--facss-gold-700)', flexShrink: 0, lineHeight: 1.3 }}>{String(idx + 1).padStart(2, '0')}.</span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
                  {pickDesc(block)}
                </p>
              </div>
            ))}
            {goalsBlocks.length === 0 && fallbackGoals.map((goal, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.85rem', padding: '1.1rem 1.25rem', background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--facss-gold-700)', flexShrink: 0 }}>{String(idx + 1).padStart(2, '0')}.</span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>{goal}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTIVITY FIELDS ── */}
      <section style={{ paddingBlock: '4rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
              {t.servicesSectionTitle}
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto', fontSize: '0.95rem' }}>{t.servicesSectionSubtitle}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
            {activityBlocks.map((block, idx) => {
              const Icon = getIcon(block.icon);
              return (
                <Link key={block.id} href={block.link || '/services'} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '1.5rem', height: '100%', cursor: 'pointer', transition: 'border-color 0.15s', borderInlineStart: '4px solid var(--facss-gold-600)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--facss-gold-700)' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <Icon size={18} style={{ color: 'var(--facss-green-800)' }} />
                      <h3 style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)', margin: 0 }}>
                        {pickTitle(block)}
                      </h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.65, margin: 0 }}>
                      {pickDesc(block)}
                    </p>
                  </div>
                </Link>
              );
            })}
            {activityBlocks.length === 0 && [
              { title: t.field1Title, desc: t.field1Desc }, { title: t.field2Title, desc: t.field2Desc },
              { title: t.field3Title, desc: t.field3Desc }, { title: t.field4Title, desc: t.field4Desc },
              { title: t.field5Title, desc: t.field5Desc }, { title: t.field6Title, desc: t.field6Desc },
            ].map((f, i) => (
              <div key={i} className="card" style={{ padding: '1.5rem', borderInlineStart: '4px solid var(--facss-gold-600)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--facss-gold-700)', display: 'block', marginBottom: '0.5rem' }}>{String(i + 1).padStart(2, '0')}</span>
                <h3 style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OPERATIONAL LIFECYCLE ── */}
      <section style={{ paddingBlock: '4rem', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>{t.lifecycleTitle}</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto', fontSize: '0.95rem' }}>{t.lifecycleSubtitle}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1rem' }}>
            {lifecycleBlocks.map((block, idx) => (
              <div key={block.id} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', padding: '1.1rem', background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <span style={{ width: '32px', height: '32px', background: 'var(--facss-green-800)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 800, flexShrink: 0 }}>
                  {idx + 1}
                </span>
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0 0 0.3rem' }}>{pickTitle(block)}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.65, margin: 0 }}>{pickDesc(block)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ORGANIZATIONAL STRUCTURE ── */}
      <section style={{ paddingBlock: '4rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>{t.orgStructureTitle}</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto', fontSize: '0.92rem' }}>{t.orgStructureSubtitle}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
            {orgBlocks.map((block, idx) => (
              <div key={block.id} className="card" style={{ padding: '1.25rem', borderInlineStart: '4px solid var(--facss-gold-600)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                  <Layers size={16} style={{ color: 'var(--facss-green-800)', flexShrink: 0 }} />
                  <h4 style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{pickTitle(block)}</h4>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.65, margin: 0 }}>{pickDesc(block)}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', fontStyle: 'italic' }}>
            {t.orgStructureNote}
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ paddingBlock: '4rem', background: 'linear-gradient(135deg, var(--facss-green-950), var(--facss-green-900))', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem' }}>
            {isAr ? 'هل تحتاج إلى تنسيق ميداني أو تقييم مخاطر؟' : 'Need Field Coordination or Risk Assessment?'}
          </h2>
          <p style={{ color: '#CBD5E1', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem', fontSize: '0.95rem' }}>
            {isAr ? 'تواصل مع إدارة المركز لتقديم طلب التنسيق أو استشارة تقييم المخاطر وبناء خطط الوصول الآمن' : 'Contact center coordination to initiate field assessment requests or access risk analysis.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/request-service" className="btn btn-gold">
              <Shield size={16} />
              <span>{t.navRequestService}</span>
            </Link>
            <Link href="/contact" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              <span>{isAr ? 'اتصل بنا' : 'Contact Us'}</span>
              <ArrowIcon size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
