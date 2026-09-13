import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
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
  const service = await prisma.service.findUnique({
    where: { slug: params.slug },
    include: { category: true }
  });

  if (!service) {
    notFound();
  }

  let features: string[] = [];
  let targetSectors: string[] = [];
  let processSteps: string[] = [];

  try { features = JSON.parse(service.featuresAr || '[]'); } catch { features = []; }
  try { targetSectors = JSON.parse(service.targetSectorsAr || '[]'); } catch { targetSectors = []; }
  try { processSteps = JSON.parse(service.processAr || '[]'); } catch { processSteps = []; }

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
            <Link href="/" style={{ color: 'var(--text-muted)' }}>الرئيسية</Link>
            <span>/</span>
            <Link href="/services" style={{ color: 'var(--text-muted)' }}>الخدمات</Link>
            <span>/</span>
            <span style={{ color: 'var(--color-gold-light)' }}>{service.titleAr}</span>
          </div>

          <span className="badge badge-gold" style={{ marginBottom: '0.85rem' }}>
            {service.category.titleAr}
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FFF', marginBottom: '0.5rem' }}>
            {service.titleAr}
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-gold-light)', fontWeight: 600, maxWidth: '800px' }}>
            {service.titleEn}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
            {/* Left/Main Column: Full Description & Features */}
            <div style={{ flex: 2 }}>
              <div className="card" style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem' }}>
                  وصف ونطاق الخدمة
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                  {service.fullDescAr}
                </p>
                <div style={{ padding: '1rem', background: 'rgba(11,37,24,0.5)', borderRadius: '8px', borderInlineStart: '4px solid var(--color-gold)' }}>
                  <p style={{ color: 'var(--color-gold-light)', fontSize: '0.9rem', margin: 0, fontStyle: 'italic' }}>
                    {service.fullDescEn}
                  </p>
                </div>
              </div>

              {/* Features Grid */}
              {features.length > 0 && (
                <div className="card" style={{ marginBottom: '2.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginBottom: '1.2rem' }}>
                    أبرز مميزات ومكونات الخدمة
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {features.map((f, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.85rem', background: 'rgba(5,14,9,0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <CheckCircle2 size={18} style={{ color: 'var(--color-gold-light)', flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '0.9rem', color: '#FFF', lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Delivery Process */}
              {processSteps.length > 0 && (
                <div className="card">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginBottom: '1.2rem' }}>
                    مراحل تنفيذ وتقديم الخدمة
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {processSteps.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(11,37,24,0.4)', borderRadius: '8px', border: '1px solid rgba(197,155,39,0.2)' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-gold)', color: '#050E09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.95rem', flexShrink: 0 }}>
                          {idx + 1}
                        </div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar / CTA Column */}
            <div>
              <div className="card glow-animation" style={{ padding: '2rem', position: 'sticky', top: '100px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF', marginBottom: '0.8rem' }}>
                  طلب هذه الخدمة
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  قدّم طلبك الآن للحصول على دراسة مبدئية وخطة أمنية معتمدة ورقم مرجعي رسمي لمتابعة طلبك.
                </p>

                <Link
                  href={`/request-service?service=${service.slug}`}
                  className="btn btn-gold"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
                >
                  <Shield size={18} />
                  <span>بدء طلب الخدمة الآن</span>
                </Link>

                <Link
                  href="/contact"
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem' }}
                >
                  <PhoneCall size={15} />
                  <span>استفسار أو استشارة سريعة</span>
                </Link>

                {/* Target Sectors */}
                {targetSectors.length > 0 && (
                  <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-gold-light)', marginBottom: '0.75rem' }}>
                      القطاعات الأكثر طلباً لهذه الخدمة
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
