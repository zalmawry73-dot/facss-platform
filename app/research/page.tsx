import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import {
  FileText,
  Calendar,
  User,
  Eye,
  Download,
  Lock,
  ArrowLeft,
  BookOpen,
  Share2
} from 'lucide-react';

export const revalidate = 0;

export default async function ResearchPage() {
  const publications = await prisma.researchPublication.findMany({
    include: { category: true },
    orderBy: { publicationDate: 'desc' },
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
          <span className="section-tag">مركز البحوث والدراسات الاستراتيجية</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFF', marginBottom: '1rem' }}>
            الدراسات الأمنية والتقارير الدورية لصناع القرار
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '800px', marginInline: 'auto', lineHeight: 1.7 }}>
            الذراع البحثية لمركز عدن الأول (FACSS) تعمل بمنهجية أكاديمية تُوظّف المعرفة الميدانية العميقة بالشأن اليمني والمؤثرات الإقليمية في خدمة صناع القرار
          </p>
        </div>
      </section>

      {/* Publications Repository */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
            {publications.map((pub) => (
              <div key={pub.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span className="badge badge-gold">{pub.category.titleAr}</span>
                    {pub.visibility === 'PUBLIC' ? (
                      <span className="badge badge-green">متاح للعموم</span>
                    ) : (
                      <span className="badge badge-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Lock size={12} />
                        <span>خاص بالعملاء</span>
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginBottom: '0.65rem', lineHeight: 1.4 }}>
                    {pub.titleAr}
                  </h3>
                  <h4 style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', fontWeight: 600, marginBottom: '1.2rem', lineHeight: 1.4 }}>
                    {pub.titleEn}
                  </h4>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                    {pub.summaryAr}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={14} />
                      <span>{pub.author}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Eye size={14} />
                      <span>{pub.viewsCount} قراءة</span>
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {pub.visibility === 'PUBLIC' ? (
                    <Link
                      href={`/research/${pub.slug}`}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.82rem' }}
                    >
                      <BookOpen size={15} />
                      <span>قراءة الورقة البحثية</span>
                    </Link>
                  ) : (
                    <Link
                      href="/portal/client/reports"
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.82rem', borderColor: 'var(--color-gold)' }}
                    >
                      <Lock size={14} />
                      <span>دخول العملاء للاطلاع</span>
                    </Link>
                  )}

                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                    {new Date(pub.publicationDate).toLocaleDateString('ar-YE', { year: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
