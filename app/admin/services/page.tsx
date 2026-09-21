import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/rbac';
import { 
  ShieldAlert, 
  Compass, 
  GraduationCap, 
  HeartHandshake, 
  Users, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ArrowLeft,
  ExternalLink,
  Archive,
  Briefcase
} from 'lucide-react';

export const revalidate = 0;

export default async function AdminServicesCatalogPage() {
  await requireStaff('/admin/services');

  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      services: {
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { requests: true }
          }
        }
      }
    }
  });

  const activeCategories = categories.filter(c => c.isActive);
  const inactiveCategories = categories.filter(c => !c.isActive);

  const totalActiveServices = activeCategories.reduce((acc, c) => acc + c.services.filter(s => s.isActive).length, 0);
  const totalInactiveServices = categories.reduce((acc, c) => acc + c.services.filter(s => !s.isActive).length, 0);
  const totalRequests = await prisma.serviceRequest.count();

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'field-monitoring-early-warning': return ShieldAlert;
      case 'access-risk-analysis': return Compass;
      case 'training-capacity-building': return GraduationCap;
      case 'psychological-first-aid-referral': return HeartHandshake;
      case 'coordination-negotiation-acceptance': return Users;
      case 'knowledge-products-reports': return FileText;
      default: return Briefcase;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Info */}
      <div className="card" style={{ padding: '2rem', borderInlineStart: '5px solid var(--facss-gold-600)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              دليل الخدمات والتصنيفات المؤسسية
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.35rem', margin: 0 }}>
              إدارة ومراجعة مجالات النشاط المعتمدة لمركز عدن الدولي للسلامة والدراسات الميدانية وتتبع السجلات التاريخية
            </p>
          </div>

          <Link href="/services" target="_blank" className="btn btn-outline btn-sm">
            <span>معاينة دليل الخدمات العام</span>
            <ExternalLink size={14} />
          </Link>
        </div>

        {/* Metric summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ padding: '1rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>المجالات والتصنيفات المعتمدة</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--facss-green-800)' }}>{activeCategories.length}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>مجالات نشاط إنساني معتمدة</span>
          </div>

          <div style={{ padding: '1rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>الخدمات المتاحة للطلب</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--facss-gold-700)' }}>{totalActiveServices}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>خدمة ميدانية نشطة</span>
          </div>

          <div style={{ padding: '1rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>إجمالي طلبات الخدمة المسجلة</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1E40AF' }}>{totalRequests}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>طلب خدمة عبر المنظومة</span>
          </div>

          <div style={{ padding: '1rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>السجلات والتصنيفات المؤرشفة</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-muted)' }}>{inactiveCategories.length}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>تصنيف تاريخي موقوف</span>
          </div>
        </div>
      </div>

      {/* Active Approved Categories & Services */}
      <div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} style={{ color: 'var(--facss-green-700)' }} />
          <span>مجالات النشاط المعتمدة للمركز الجديد ({activeCategories.length})</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {activeCategories.map((cat, idx) => {
            const Icon = getCategoryIcon(cat.slug);
            const activeSrvs = cat.services.filter(s => s.isActive);

            return (
              <div key={cat.id} className="card" style={{ border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--facss-green-50)', color: 'var(--facss-green-800)', border: '1px solid var(--facss-green-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--facss-gold-700)' }}>مجال #{idx + 1}</span>
                        <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>معتمد ونشط</span>
                      </div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {cat.titleAr}
                      </h4>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{cat.titleEn} • المعرف: {cat.slug}</span>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {activeSrvs.length} خدمات فرعية
                  </span>
                </div>

                {/* Services Table */}
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>الترتيب</th>
                        <th>اسم الخدمة (عربي)</th>
                        <th>اسم الخدمة (إنجليزي)</th>
                        <th>المعرف البرمجي (Slug)</th>
                        <th>الحالة</th>
                        <th>الطلبات المرتبطة</th>
                        <th>الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.services.map((srv) => (
                        <tr key={srv.id}>
                          <td style={{ fontWeight: 700, color: 'var(--facss-gold-700)', textAlign: 'center' }}>{srv.order}</td>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{srv.titleAr}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{srv.titleEn}</td>
                          <td>
                            <code style={{ fontSize: '0.78rem', background: 'var(--surface-sunken)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                              {srv.slug}
                            </code>
                          </td>
                          <td>
                            <span className={`badge ${srv.isActive ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.72rem' }}>
                              {srv.isActive ? 'متاحة للطلب' : 'موقوفة'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 800, textAlign: 'center', color: srv._count.requests > 0 ? 'var(--facss-gold-700)' : 'var(--text-muted)' }}>
                            {srv._count.requests}
                          </td>
                          <td>
                            <Link href={`/services/${srv.slug}`} target="_blank" className="btn btn-outline btn-sm" style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}>
                              <span>عرض</span>
                              <ExternalLink size={12} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inactive / Archived Categories (Historical) */}
      {inactiveCategories.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Archive size={18} style={{ color: 'var(--text-muted)' }} />
            <span>التصنيفات المؤرشفة والموقوفة من العرض العام ({inactiveCategories.length})</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {inactiveCategories.map((oldCat) => (
              <div key={oldCat.id} className="card" style={{ background: 'var(--surface-sunken)', opacity: 0.85, border: '1px dashed var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>موقوف (أرشيف تاريخي)</span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {oldCat.titleAr} ({oldCat.titleEn})
                      </h4>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>المعرف: {oldCat.slug} • لا يظهر في الموقع العام أو خيارات الطلب</span>
                  </div>

                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    الخدمات المرتبطة: {oldCat.services.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
