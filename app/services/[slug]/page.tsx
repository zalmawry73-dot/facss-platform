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
      <section className="page-header-institutional">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-on-dark-muted)', marginBottom: '1.25rem' }}>
            <Link href="/" style={{ color: 'var(--text-on-dark-muted)', textDecoration: 'none' }}>{t.home}</Link>
            <span>/</span>
            <Link href="/services" style={{ color: 'var(--text-on-dark-muted)', textDecoration: 'none' }}>{t.services}</Link>
            <span>/</span>
            <span style={{ color: 'var(--color-gold-400)', fontWeight: 700 }}>{title}</span>
          </div>

          <span className="badge badge-gold" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
            {catTitle}
          </span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.75rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.65rem', letterSpacing: '-0.01em' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '1.05rem', color: 'var(--color-gold-400)', fontWeight: 600, maxWidth: '800px', marginInline: 'auto' }}>
              {subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="section" style={{ backgroundColor: 'var(--surface-bg)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem', alignItems: 'start' }}>
            {/* Left/Main Column: Full Description & Features */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div className="card-institutional">
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  {isAr ? 'وصف ونطاق الخدمة' : 'Service Scope & Operational Overview'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.85, margin: 0 }}>
                  {isAr ? service.fullDescAr : (service.fullDescEn || service.fullDescAr)}
                </p>
              </div>

              {/* Features Grid */}
              {features.length > 0 && (
                <div className="card-institutional">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                    {isAr ? 'أبرز مميزات ومكونات الخدمة' : 'Key Operational Capabilities & Features'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1rem' }}>
                    {features.map((f, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                        <CheckCircle2 size={18} style={{ color: 'var(--color-primary-800)', flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Delivery Process */}
              {processSteps.length > 0 && (
                <div className="card-institutional">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                    {isAr ? 'مراحل تنفيذ وتقديم الخدمة' : 'Deployment & Implementation Phases'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {processSteps.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary-900)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0, fontFamily: 'var(--font-en)' }}>
                          {idx + 1}
                        </div>
                        <span style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar / CTA Column */}
            <div>
              <div className="card-institutional" style={{ padding: '2rem', borderTop: '4px solid var(--color-gold-500)', position: 'sticky', top: '100px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
                  {isAr ? 'طلب هذه الخدمة' : 'Request This Service'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.75rem' }}>
                  {isAr
                    ? 'قدّم طلبك الآن للحصول على دراسة مبدئية وخطة استشارية وميدانية مقترحة ورقم مرجعي لمتابعة طلبك.'
                    : 'Submit your request for a preliminary assessment, operational proposal, and a reference tracking code.'}
                </p>

                <Link
                  href={`/request-service?service=${service.slug}`}
                  className="btn btn-gold btn-lg"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '0.85rem' }}
                >
                  <Shield size={18} />
                  <span>{isAr ? 'بدء طلب الخدمة الآن' : 'Initiate Service Request'}</span>
                  <ArrowIcon size={16} />
                </Link>

                <Link
                  href="/contact"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '1.75rem' }}
                >
                  <PhoneCall size={15} />
                  <span>{isAr ? 'استفسار أو استشارة سريعة' : 'Direct Inquiry / Consultation'}</span>
                </Link>

                {/* Target Sectors */}
                {targetSectors.length > 0 && (
                  <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-gold-700)', marginBottom: '0.85rem' }}>
                      {isAr ? 'القطاعات الأكثر طلباً لهذه الخدمة' : 'Primary Demanding Sectors'}
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      {targetSectors.map((sec, idx) => (
                        <span key={idx} className="badge badge-gold" style={{ fontSize: '0.78rem' }}>
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
