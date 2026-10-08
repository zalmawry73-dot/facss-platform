'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Compass, 
  GraduationCap, 
  HeartHandshake, 
  Users, 
  FileText, 
  Briefcase,
  ExternalLink,
  Layers,
  Inbox,
  Archive,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSection,
  AdminStatCard,
  AdminButton,
  AdminDataTable,
  AdminStatusBadge,
} from '@/components/admin/ui';

interface ServiceItem {
  id: string;
  order: number;
  titleAr: string;
  titleEn: string;
  slug: string;
  isActive: boolean;
  requestsCount: number;
}

interface CategoryItem {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  isActive: boolean;
  services: ServiceItem[];
}

interface Props {
  categories: CategoryItem[];
  totalRequests: number;
}

export default function ServicesCatalogManager({
  categories,
  totalRequests,
}: Props) {
  const { tx, txLocale } = useAdminT();
  const activeCategories = categories.filter(c => c.isActive);
  const inactiveCategories = categories.filter(c => !c.isActive);

  const totalActiveServices = activeCategories.reduce((acc, c) => acc + c.services.filter(s => s.isActive).length, 0);
  const totalInactiveServices = categories.reduce((acc, c) => acc + c.services.filter(s => !s.isActive).length, 0);

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

  const serviceTableColumns = [
    {
      key: 'order',
      title: tx("الترتيب"),
      align: 'center' as const,
      width: '80px',
      render: (srv: ServiceItem) => (
        <span style={{ fontWeight: 800, color: 'var(--admin-gold-hover)' }}>{srv.order}</span>
      ),
    },
    {
      key: 'titleAr',
      title: tx("اسم الخدمة (عربي)"),
      render: (srv: ServiceItem) => (
        <span style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>{srv.titleAr}</span>
      ),
    },
    {
      key: 'titleEn',
      title: tx("اسم الخدمة (إنجليزي)"),
      render: (srv: ServiceItem) => (
        <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>{srv.titleEn}</span>
      ),
    },
    {
      key: 'slug',
      title: tx("المعرف البرمجي"),
      render: (srv: ServiceItem) => (
        <code
          dir="ltr"
          style={{
            fontFamily: 'monospace',
            fontSize: '0.78rem',
            background: 'var(--admin-canvas-bg)',
            padding: '0.2rem 0.45rem',
            borderRadius: '4px',
            border: '1px solid var(--admin-card-border)',
            color: 'var(--admin-text-secondary)',
          }}
        >
          {srv.slug}
        </code>
      ),
    },
    {
      key: 'status',
      title: tx("الحالة"),
      render: (srv: ServiceItem) => (
        <AdminStatusBadge
          variant={srv.isActive ? 'success' : 'danger'}
          label={srv.isActive ? tx("متاحة للطلب") : tx("موقوفة")}
        />
      ),
    },
    {
      key: 'requests',
      title: tx("الطلبات"),
      align: 'center' as const,
      width: '90px',
      render: (srv: ServiceItem) => (
        <span
          style={{
            fontWeight: 800,
            color: srv.requestsCount > 0 ? 'var(--admin-gold-hover)' : 'var(--admin-text-muted)',
          }}
        >
          {srv.requestsCount}
        </span>
      ),
    },
    {
      key: 'actions',
      title: tx("الإجراء"),
      align: 'center' as const,
      width: '100px',
      render: (srv: ServiceItem) => (
        <Link href={`/services/${srv.slug}`} target="_blank" style={{ textDecoration: 'none' }}>
          <AdminButton variant="ghost" size="sm" icon={<ExternalLink size={13} />}>
            {tx("عرض")}
          </AdminButton>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <AdminPageHeader
        title={tx("دليل الخدمات والتصنيفات المؤسسية")}
        description={tx("إدارة ومراجعة مجالات النشاط المعتمدة للمركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية وتتبع السجلات التاريخية")}
        actions={
          <Link href="/services" target="_blank" style={{ textDecoration: 'none' }}>
            <AdminButton variant="secondary" size="md" icon={<ExternalLink size={15} />}>
              {tx("معاينة دليل الخدمات العام")}
            </AdminButton>
          </Link>
        }
      />

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <AdminStatCard
          icon={<Layers size={22} />}
          label={tx("المجالات والتصنيفات المعتمدة")}
          value={activeCategories.length}
          helperText={tx("مجالات نشاط إنساني معتمدة")}
        />
        <AdminStatCard
          icon={<Briefcase size={22} />}
          label={tx("الخدمات المتاحة للطلب")}
          value={totalActiveServices}
          helperText={tx("خدمة ميدانية نشطة")}
        />
        <AdminStatCard
          icon={<Inbox size={22} />}
          label={tx("إجمالي طلبات الخدمة")}
          value={totalRequests}
          helperText={tx("طلب خدمة مسجل بالمنظومة")}
        />
        <AdminStatCard
          icon={<Archive size={22} />}
          label={tx("السجلات المؤرشفة")}
          value={inactiveCategories.length}
          helperText={tx("تصنيف تاريخي موقوف")}
        />
      </div>

      {/* Approved Categories & Services */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text-primary)', margin: 0 }}>
          {tx("مجالات النشاط المعتمدة للمركز (")}{activeCategories.length})
        </h3>

        {activeCategories.map((cat) => {
          const Icon = getCategoryIcon(cat.slug);
          const activeSrvs = cat.services.filter(s => s.isActive);

          return (
            <AdminSection
              key={cat.id}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--admin-radius-sm)',
                      background: 'rgba(201, 162, 39, 0.12)',
                      color: 'var(--admin-gold-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--admin-text-primary)' }}>
                      {cat.titleAr}
                    </span>
                    <span
                      dir="ltr"
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        color: 'var(--admin-text-muted)',
                        fontFamily: 'monospace',
                        marginTop: '0.15rem',
                      }}
                    >
                      {cat.titleEn} • {cat.slug}
                    </span>
                  </div>
                </div>
              }
              actions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <AdminStatusBadge variant="success" label={tx("معتمد ونشط")} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>
                    {activeSrvs.length} {tx("خدمات فرعية")}
                  </span>
                </div>
              }
            >
              <AdminDataTable
                columns={serviceTableColumns}
                data={cat.services}
                rowKey="id"
                emptyMessage={tx("لا توجد خدمات مسجلة ضمن هذا المجال.")}
                mobileCardRender={(srv) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <strong style={{ color: 'var(--admin-text-primary)', fontSize: '0.9rem' }}>{srv.titleAr}</strong>
                      <AdminStatusBadge variant={srv.isActive ? 'success' : 'danger'} label={srv.isActive ? tx("متاحة") : tx("موقوفة")} />
                    </div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)' }}>{srv.titleEn}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <code dir="ltr" style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: 'var(--admin-canvas-bg)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--admin-card-border)', color: 'var(--admin-text-secondary)' }}>
                        {srv.slug}
                      </code>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: srv.requestsCount > 0 ? 'var(--admin-gold-hover)' : 'var(--admin-text-muted)' }}>
                        {srv.requestsCount} {tx("طلب")}
                      </span>
                    </div>
                  </div>
                )}
              />
            </AdminSection>
          );
        })}
      </div>

      {/* Inactive / Archived Categories */}
      {inactiveCategories.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <AdminSection
            title={tx("التصنيفات المؤرشفة والموقوفة من العرض العام")}
            description={tx("يحتوي على {0} تصنيف تاريخي موقوف لا يظهر في خيارات الطلب", inactiveCategories.length)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {inactiveCategories.map((oldCat) => (
                <div
                  key={oldCat.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'var(--admin-canvas-bg)',
                    border: '1px dashed var(--admin-card-border)',
                    borderRadius: 'var(--admin-radius-sm)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AdminStatusBadge variant="danger" label={tx("موقوف (أرشيف)")} />
                      <span style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                        {oldCat.titleAr} ({oldCat.titleEn})
                      </span>
                    </div>
                    <span
                      dir="ltr"
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        color: 'var(--admin-text-muted)',
                        fontFamily: 'monospace',
                        marginTop: '0.2rem',
                      }}
                    >
                      {oldCat.slug}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                    {tx("الخدمات المرتبطة:")} {oldCat.services.length}
                  </span>
                </div>
              ))}
            </div>
          </AdminSection>
        </div>
      )}
    </div>
  );
}
