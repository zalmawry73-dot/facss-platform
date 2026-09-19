import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { 
  FileText, 
  User, 
  Calendar, 
  Eye, 
  ArrowLeft, 
  Download, 
  Share2, 
  ShieldCheck 
} from 'lucide-react';

export const revalidate = 0;

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function ResearchDetailPage({ params }: PageProps) {
  const session = await getSession();
  const isAuthorizedStaff = session && (
    session.role === 'SUPER_ADMIN' ||
    session.role === 'ADMIN' ||
    session.role === 'STAFF' ||
    session.role === 'RESEARCH_MANAGER' ||
    session.role.includes('MANAGER')
  );

  const pub = await prisma.researchPublication.findUnique({
    where: { slug: params.slug },
    include: { category: true }
  });

  if (!pub) {
    notFound();
  }

  // 1. Status Gate: Non-published studies only accessible by authorized operations staff
  if (pub.status !== 'PUBLISHED' && !isAuthorizedStaff) {
    notFound();
  }

  // 2. Visibility Gate:
  // - PUBLIC is accessible by everyone
  // - CLIENT_ONLY & PRIVATE: To prevent cross-client data leakage where individual ownership cannot be proven
  //   in the data model, access is strictly limited to authorized staff until a client-ownership decision is made.
  if (pub.visibility !== 'PUBLIC' && !isAuthorizedStaff) {
    notFound();
  }

  // Increment views count non-blocking
  await prisma.researchPublication.update({
    where: { id: pub.id },
    data: { viewsCount: { increment: 1 } }
  }).catch(() => {});

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <Link href="/" style={{ color: 'var(--text-muted)' }}>الرئيسية</Link>
            <span>/</span>
            <Link href="/research" style={{ color: 'var(--text-muted)' }}>البحوث والدراسات</Link>
            <span>/</span>
            <span style={{ color: 'var(--color-gold-light)' }}>{pub.category.titleAr}</span>
          </div>

          <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>
            {pub.category.titleAr}
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFF', marginBottom: '0.75rem', lineHeight: 1.3 }}>
            {pub.titleAr}
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-gold-light)', fontWeight: 600, maxWidth: '850px', marginBottom: '1.5rem' }}>
            {pub.titleEn}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={16} style={{ color: 'var(--color-gold)' }} />
              <span>{pub.author}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} style={{ color: 'var(--color-gold)' }} />
              <span>{new Date(pub.publicationDate).toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Eye size={16} style={{ color: 'var(--color-gold)' }} />
              <span>{pub.viewsCount + 1} قراءة</span>
            </div>
          </div>
        </div>
      </section>

      {/* Reader Content */}
      <section className="section">
        <div className="container">
          <div style={{ maxWidth: '860px', marginInline: 'auto' }}>
            {/* Executive Summary Card */}
            <div className="card" style={{ marginBottom: '2.5rem', borderInlineStart: '4px solid var(--color-gold)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-gold-light)', marginBottom: '0.8rem' }}>
                الملخص التنفيذي للدراسة (Executive Summary)
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.8, margin: 0 }}>
                {pub.summaryAr}
              </p>
            </div>

            {/* Main Content Body */}
            <div className="card" style={{ padding: '2.5rem', marginBottom: '2.5rem', lineHeight: 2, fontSize: '1.05rem', color: '#E2E8F0' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                نص الدراسة الاستراتيجية والتحليل الميداني
              </h2>
              <p style={{ marginBottom: '1.5rem' }}>{pub.contentAr}</p>
              
              <div style={{ padding: '1.5rem', background: 'rgba(11,37,24,0.5)', borderRadius: '8px', border: '1px solid rgba(197,155,39,0.2)', marginTop: '2rem' }}>
                <h4 style={{ color: 'var(--color-gold-light)', fontWeight: 800, marginBottom: '0.5rem' }}>
                  English Abstract & Key Findings:
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                  {pub.summaryEn}
                </p>
              </div>
            </div>

            {/* Back button */}
            <div style={{ textAlign: 'center' }}>
              <Link href="/research" className="btn btn-outline">
                <ArrowLeft size={16} />
                <span>العودة لكافة الدراسات والتقارير</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
