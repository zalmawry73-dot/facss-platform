import React from 'react';
import prisma from '@/lib/prisma';
import { FileText, Lock, Globe, Eye, Plus, Edit3 } from 'lucide-react';

export const revalidate = 0;

export default async function AdminResearchCMSPage() {
  const publications = await prisma.researchPublication.findMany({
    include: { category: true },
    orderBy: { publicationDate: 'desc' }
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
              إدارة الدراسات الأمنية والتقارير الاستراتيجية
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              نشر الأبحاث، التحكم بمستويات السرية (عام / حصري للعملاء / خاص)، وإحصائيات القراءة
            </span>
          </div>

          <button type="button" className="btn btn-gold btn-sm">
            <Plus size={16} />
            <span>نشر دراسة جديدة</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>عنوان الدراسة / التقرير</th>
                <th>التصنيف</th>
                <th>المؤلف</th>
                <th>مستوى الرؤية (Visibility)</th>
                <th>المشاهدات</th>
                <th>تاريخ النشر</th>
              </tr>
            </thead>
            <tbody>
              {publications.map((pub) => (
                <tr key={pub.id}>
                  <td style={{ fontWeight: 700, color: '#FFF' }}>
                    {pub.titleAr}
                  </td>
                  <td>{pub.category.titleAr}</td>
                  <td style={{ fontSize: '0.85rem' }}>{pub.author}</td>
                  <td>
                    {pub.visibility === 'PUBLIC' ? (
                      <span className="badge badge-green">متاح للعموم</span>
                    ) : (
                      <span className="badge badge-yellow">حصري للعملاء</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--color-gold-light)' }}>
                      {pub.viewsCount}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(pub.publicationDate).toLocaleDateString('ar-YE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
