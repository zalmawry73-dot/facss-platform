import React from 'react';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { FolderLock, FileText, Download, ShieldCheck, Lock } from 'lucide-react';

export const revalidate = 0;

export default async function ClientReportsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  // Fetch client restricted research publications + any specific documents
  const clientResearch = await prisma.researchPublication.findMany({
    where: {
      visibility: { in: ['PUBLIC', 'CLIENT_ONLY'] }
    },
    orderBy: { publicationDate: 'desc' },
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.5rem' }}>
          <FolderLock size={26} style={{ color: 'var(--color-gold)' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
            مستودع التقارير والدراسات السرية المعتمدة
          </h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
          هذه المساحة مخصصة للعملاء والجهات المتعاقدة للاطلاع على التقييمات الأمنية الحصرية والتقارير الدورية ومصفوفات المخاطر.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {clientResearch.map((item) => (
          <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span className="badge badge-gold">
                  {item.visibility === 'CLIENT_ONLY' ? 'حصري للعملاء' : 'تقرير معتمد'}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                  {new Date(item.publicationDate).toLocaleDateString('ar-YE')}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', marginBottom: '0.6rem', lineHeight: 1.4 }}>
                {item.titleAr}
              </h3>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                {item.summaryAr}
              </p>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-gold-light)', fontSize: '0.8rem' }}>
                <ShieldCheck size={16} />
                <span>نسخة موثقة</span>
              </div>

              <button
                type="button"
                className="btn btn-gold btn-sm"
                onClick={() => alert('جارٍ تجهيز وتحميل المستند الأمني المعتمد...')}
              >
                <Download size={14} />
                <span>تحميل PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
