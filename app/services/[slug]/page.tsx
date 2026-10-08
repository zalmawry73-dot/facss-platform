import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getTranslation, type Locale } from '@/lib/i18n';
import { 
  Shield, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Layers, 
  Building, 
  Briefcase, 
  Clock, 
  PhoneCall 
} from 'lucide-react';

export const revalidate = 0;

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const t = getTranslation(locale);
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const service = await prisma.service.findUnique({
    where: { slug: params.slug },
    include: { category: true }
  });

  if (!service || !service.isActive || !service.category?.isActive) {
    notFound();
  }

  let features: string[] = [];
  let targetSectors: string[] = [];
  let processSteps: string[] = [];

  const rawFeatures = isAr ? service.featuresAr : (service.featuresEn || service.featuresAr);
  const rawSectors = isAr ? service.targetSectorsAr : (service.targetSectorsEn || service.targetSectorsAr);
  const rawProcess = isAr ? service.processAr : (service.processEn || service.processAr);

  try { features = JSON.parse(rawFeatures || '[]'); } catch { features = []; }
  try { targetSectors = JSON.parse(rawSectors || '[]'); } catch { targetSectors = []; }
  try { processSteps = JSON.parse(rawProcess || '[]'); } catch { processSteps = []; }

  const catTitle = isAr ? service.category.titleAr : (service.category.titleEn || service.category.titleAr);
  const title = isAr ? service.titleAr : (service.titleEn || service.titleAr);
  const subtitle = isAr ? service.titleEn : null;

  return (
    <div>
      {/* Banner */}
      <section
        style={{
          paddingBlock: '4.5rem',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(19, 62, 43, 0.7) 0%, rgba(5, 14, 9, 0.95) 80%)',
          borderBottom: '1px solid rgba(197, 155, 39, 0.2)',
        }}
      >
        <div className="container">
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <Link href="/" style={{ color: 'var(--text-muted)' }}>{t.home}</Link>
            <span>/</span>
            <Link href="/services" style={{ color: 'var(--text-muted)' }}>{t.services}</Link>
            <span>/</span>
            <span style={{ color: 'var(--facss-gold-400)' }}>{title}</span>
          </div>

          <span className="badge badge-gold" style={{ marginBottom: '0.85rem' }}>
            {catTitle}
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FFF', marginBottom: '0.5rem' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '1.05rem', color: 'var(--facss-gold-400)', fontWeight: 600, maxWidth: '800px' }}>
              {subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
            {/* Left/Main Column: Full Description & Features */}
            <div style={{ flex: 2 }}>
              <div className="card" style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  {isAr ? 'وصف ونطاق الخدمة' : 'Service Scope & Operational Overview'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.8, margin: 0 }}>
                  {isAr ? service.fullDescAr : (service.fullDescEn || service.fullDescAr)}
                </p>
              </div>

              {/* Features Grid */}
              {features.length > 0 && (
                <div className="card" style={{ marginBottom: '2.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.2rem' }}>
                    {isAr ? 'أبرز مميزات ومكونات الخدمة' : 'Key Operational Capabilities & Features'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {features.map((f, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.85rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <CheckCircle2 size={18} style={{ color: 'var(--facss-green-700)', flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Delivery Process */}
              {processSteps.length > 0 && (
                <div className="card">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.2rem' }}>
                    {isAr ? 'مراحل تنفيذ وتقديم الخدمة' : 'Deployment & Implementation Phases'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {processSteps.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--facss-gold-600)', color: '#050E09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.95rem', flexShrink: 0 }}>
                          {idx + 1}
                        </div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar / CTA Column */}
            <div>
              <div className="card glow-animation" style={{ padding: '2rem', position: 'sticky', top: '100px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                  {isAr ? 'طلب هذه الخدمة' : 'Request This Service'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {isAr
                    ? 'قدّم طلبك الآن للحصول على دراسة مبدئية وخطة استشارية وميدانية مقترحة ورقم مرجعي لمتابعة طلبك.'
                    : 'Submit your request for a preliminary assessment, operational proposal, and a reference tracking code.'}
                </p>

                <Link
                  href={`/request-service?service=${service.slug}`}
                  className="btn btn-gold"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
                >
                  <Shield size={18} />
                  <span>{isAr ? 'بدء طلب الخدمة الآن' : 'Initiate Service Request'}</span>
                </Link>

                <Link
                  href="/contact"
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem' }}
                >
                  <PhoneCall size={15} />
                  <span>{isAr ? 'استفسار أو استشارة سريعة' : 'Direct Inquiry / Consultation'}</span>
                </Link>

                {/* Target Sectors */}
                {targetSectors.length > 0 && (
                  <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--facss-gold-700)', marginBottom: '0.75rem' }}>
                      {isAr ? 'القطاعات الأكثر طلباً لهذه الخدمة' : 'Primary Demanding Sectors'}
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {targetSectors.map((sec, idx) => (
                        <span key={idx} className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                          {sec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
