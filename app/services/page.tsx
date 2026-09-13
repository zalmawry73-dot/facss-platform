import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { 
  Shield, 
  Building2, 
  Cpu, 
  GraduationCap, 
  Briefcase, 
  TrendingUp, 
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

export const revalidate = 0;

export default async function ServicesPage() {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }
    }
  });

  return (
    <div>
      {/* Banner */}
      <section
        style={{
          paddingBlock: '4.5rem',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(19, 62, 43, 0.6) 0%, rgba(5, 14, 9, 0.95) 80%)',
          borderBottom: '1px solid rgba(197, 155, 39, 0.2)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <span className="section-tag">منظومة الخدمات الأمنية</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFF', marginBottom: '1rem' }}>
            خدمات وحلول مركز عدن الأول (FACSS)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '750px', marginInline: 'auto' }}>
            نقدم منظومة متكاملة من الخدمات الأمنية التشغيلية، الأنظمة التقنية المتقدمة، والاستشارات والدراسات الاستراتيجية
          </p>
        </div>
      </section>

      {/* Services List by Category */}
      <section className="section">
        <div className="container">
          {categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '4.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(197,155,39,0.25)' }}>
                <Shield size={24} style={{ color: 'var(--color-gold)' }} />
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {cat.titleAr}
                </h2>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginInlineStart: 'auto' }}>
                  {cat.titleEn}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
                {cat.services.map((srv) => {
                  let features: string[] = [];
                  try {
                    features = JSON.parse(srv.featuresAr || '[]');
                  } catch {
                    features = [];
                  }

                  return (
                    <div key={srv.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <span className="badge badge-gold">{cat.titleAr}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>FACSS</span>
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginBottom: '0.75rem' }}>
                          {srv.titleAr}
                        </h3>
                        <h4 style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', fontWeight: 600, marginBottom: '0.85rem' }}>
                          {srv.titleEn}
                        </h4>

                        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.3rem' }}>
                          {srv.shortDescAr}
                        </p>

                        {/* Top Features */}
                        {features.length > 0 && (
                          <div style={{ marginBottom: '1.5rem', background: 'rgba(5,14,9,0.6)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                              {features.slice(0, 3).map((f, idx) => (
                                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                  <CheckCircle2 size={14} style={{ color: 'var(--color-gold-light)', flexShrink: 0 }} />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <Link
                          href={`/services/${srv.slug}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            color: 'var(--color-gold-light)',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                          }}
                        >
                          <span>عرض تفاصيل الخدمة</span>
                          <ArrowLeft size={15} />
                        </Link>

                        <Link href={`/request-service?service=${srv.slug}`} className="btn btn-gold btn-sm">
                          طلب الخدمة
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
