import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requireRole, ROLES, STAFF_ROLES } from '@/lib/rbac';
import { 
  FileCheck2, 
  FolderLock, 
  Download, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Building2, 
  ExternalLink, 
  Filter,
  Lock,
  Layers
} from 'lucide-react';
import ClientReportAcceptanceButton from '@/components/portal/ClientReportAcceptanceButton';

export const revalidate = 0;

interface SearchParams {
  type?: string;
  q?: string;
}

export default async function ClientDocumentsArchivePage({ searchParams }: { searchParams?: SearchParams }) {
  const user = await getCurrentUser(true);
  if (user && STAFF_ROLES.includes(user.role as any)) {
    redirect('/admin/requests');
  }

  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const isAr = rawLocale !== 'en';

  const session = await requireRole([ROLES.CLIENT, ROLES.SUPER_ADMIN, ROLES.ADMIN], '/portal/client/documents');

  const activeType = searchParams?.type || 'ALL';
  const searchQuery = (searchParams?.q || '').trim();

  const clientOwnerCondition = {
    request: {
      OR: [
        { userId: session.userId },
        { contactEmail: session.email.toLowerCase() }
      ]
    }
  };

  // Base where clause: must belong to client, client visible, and not archived
  const baseWhere: any = {
    ...clientOwnerCondition,
    visibility: 'CLIENT_VISIBLE',
    isArchived: false,
  };

  // Type filtering
  let typeCondition: any = undefined;
  if (activeType === 'FINAL_REPORT') {
    typeCondition = { documentType: 'FINAL_REPORT' };
  } else if (activeType === 'DELIVERABLES') {
    typeCondition = {
      documentType: {
        notIn: ['FINAL_REPORT', 'CLIENT_ATTACHMENT']
      }
    };
  } else if (activeType === 'CLIENT_ATTACHMENT') {
    typeCondition = { documentType: 'CLIENT_ATTACHMENT' };
  }

  // Search filtering
  let searchCondition: any = undefined;
  if (searchQuery) {
    searchCondition = {
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { originalFilename: { contains: searchQuery, mode: 'insensitive' } },
        { request: { requestNumber: { contains: searchQuery, mode: 'insensitive' } } },
        { request: { service: { titleAr: { contains: searchQuery, mode: 'insensitive' } } } },
        { request: { service: { titleEn: { contains: searchQuery, mode: 'insensitive' } } } },
      ]
    };
  }

  const whereClause = {
    AND: [
      baseWhere,
      ...(typeCondition ? [typeCondition] : []),
      ...(searchCondition ? [searchCondition] : [])
    ]
  };

  const [documents, countAll, countFinalReports, countDeliverables, countAttachments] = await Promise.all([
    prisma.serviceRequestDocument.findMany({
      where: whereClause,
      include: {
        request: {
          select: {
            id: true,
            requestNumber: true,
            organization: true,
            status: true,
            service: {
              select: {
                titleAr: true,
                titleEn: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.serviceRequestDocument.count({ where: baseWhere }),
    prisma.serviceRequestDocument.count({
      where: {
        AND: [baseWhere, { documentType: 'FINAL_REPORT' }]
      }
    }),
    prisma.serviceRequestDocument.count({
      where: {
        AND: [
          baseWhere,
          { documentType: { notIn: ['FINAL_REPORT', 'CLIENT_ATTACHMENT'] } }
        ]
      }
    }),
    prisma.serviceRequestDocument.count({
      where: {
        AND: [baseWhere, { documentType: 'CLIENT_ATTACHMENT' }]
      }
    }),
  ]);

  const acceptedCount = documents.filter(d => d.qaStatus === 'CLIENT_ACCEPTED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Overview & Security Banner */}
      <div 
        className="portal-card" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(181, 146, 84, 0.09) 0%, rgba(11, 61, 46, 0.05) 100%)',
          border: '1px solid var(--color-gold-500)',
          borderInlineStart: '6px solid var(--color-gold-600)',
          padding: '1.75rem 2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div 
              style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '10px', 
                background: 'rgba(181, 146, 84, 0.2)', 
                color: 'var(--color-gold-600)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(181, 146, 84, 0.15)'
              }}
            >
              <FileCheck2 size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isAr ? 'الأرشيف والتقارير الميدانية المعتمدة' : 'Official Verified Reports & Documents'}
              </h2>
              <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                {isAr 
                  ? 'المستودع الآمن للتقارير الأمنية النهائية، مصفوفات تقييم المخاطر، وخطط الحماية الصادرة من المركز' 
                  : 'Secure vault for certified assessment reports, operational security plans, and verified deliverables'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(11, 61, 46, 0.08)', padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid var(--admin-card-border)' }}>
            <Lock size={15} style={{ color: 'var(--color-gold-600)' }} />
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {isAr ? 'تشفير AES-256 • وصول حصري للمفوضين' : 'AES-256 Encrypted • Authorized Access Only'}
            </span>
          </div>
        </div>

        {/* Quick KPI Stat Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(181, 146, 84, 0.2)' }}>
          <div style={{ padding: '0.75rem 1rem', background: 'var(--surface-card)', borderRadius: '8px', border: '1px solid var(--admin-card-border)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
              {isAr ? 'إجمالي الملفات بالأرشيف' : 'Total Documents'}
            </span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {countAll}
            </strong>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: 'var(--surface-card)', borderRadius: '8px', border: '1px solid var(--admin-card-border)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
              {isAr ? 'التقارير الأمنية المعتمدة' : 'Final Certified Reports'}
            </span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-gold-600)' }}>
              {countFinalReports}
            </strong>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: 'var(--surface-card)', borderRadius: '8px', border: '1px solid var(--admin-card-border)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
              {isAr ? 'مخرجات وخطط العمليات' : 'Field Deliverables'}
            </span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16A34A' }}>
              {countDeliverables}
            </strong>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: 'var(--surface-card)', borderRadius: '8px', border: '1px solid var(--admin-card-border)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
              {isAr ? 'المرفقات والوثائق المساندة' : 'Client Attachments'}
            </span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
              {countAttachments}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="portal-card">
        {/* Navigation Tabs & Search Toolbar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <Link
                href="/portal/client/documents"
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: activeType === 'ALL' ? 700 : 500,
                  background: activeType === 'ALL' ? 'var(--color-primary-900)' : 'var(--surface-bg)',
                  color: activeType === 'ALL' ? '#fff' : 'var(--text-secondary)',
                  border: activeType === 'ALL' ? '1px solid var(--color-primary-900)' : '1px solid var(--admin-card-border)',
                  textDecoration: 'none',
                }}
              >
                {isAr ? `كافة المستندات (${countAll})` : `All (${countAll})`}
              </Link>

              <Link
                href="/portal/client/documents?type=FINAL_REPORT"
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: activeType === 'FINAL_REPORT' ? 700 : 500,
                  background: activeType === 'FINAL_REPORT' ? 'var(--color-gold-600)' : 'var(--surface-bg)',
                  color: activeType === 'FINAL_REPORT' ? '#fff' : 'var(--text-secondary)',
                  border: activeType === 'FINAL_REPORT' ? '1px solid var(--color-gold-600)' : '1px solid var(--admin-card-border)',
                  textDecoration: 'none',
                }}
              >
                {isAr ? `التقارير المعتمدة (${countFinalReports})` : `Final Reports (${countFinalReports})`}
              </Link>

              <Link
                href="/portal/client/documents?type=DELIVERABLES"
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: activeType === 'DELIVERABLES' ? 700 : 500,
                  background: activeType === 'DELIVERABLES' ? 'var(--color-primary-900)' : 'var(--surface-bg)',
                  color: activeType === 'DELIVERABLES' ? '#fff' : 'var(--text-secondary)',
                  border: activeType === 'DELIVERABLES' ? '1px solid var(--color-primary-900)' : '1px solid var(--admin-card-border)',
                  textDecoration: 'none',
                }}
              >
                {isAr ? `مخرجات العمليات (${countDeliverables})` : `Deliverables (${countDeliverables})`}
              </Link>

              <Link
                href="/portal/client/documents?type=CLIENT_ATTACHMENT"
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: activeType === 'CLIENT_ATTACHMENT' ? 700 : 500,
                  background: activeType === 'CLIENT_ATTACHMENT' ? 'var(--color-primary-900)' : 'var(--surface-bg)',
                  color: activeType === 'CLIENT_ATTACHMENT' ? '#fff' : 'var(--text-secondary)',
                  border: activeType === 'CLIENT_ATTACHMENT' ? '1px solid var(--color-primary-900)' : '1px solid var(--admin-card-border)',
                  textDecoration: 'none',
                }}
              >
                {isAr ? `المرفقات المساندة (${countAttachments})` : `Attachments (${countAttachments})`}
              </Link>
            </div>

            {/* Search Input Form */}
            <form method="GET" action="/portal/client/documents" style={{ display: 'flex', gap: '0.4rem', minWidth: '260px' }}>
              {activeType !== 'ALL' && <input type="hidden" name="type" value={activeType} />}
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder={isAr ? 'بحث بالاسم، رقم الطلب، أو الخدمة...' : 'Search by name, request #...'}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.85rem',
                    paddingInlineEnd: '2.2rem',
                    fontSize: '0.82rem',
                    background: 'var(--surface-bg)',
                    border: '1px solid var(--admin-card-border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    position: 'absolute',
                    insetInlineEnd: '0.4rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Search size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Documents Listing */}
        {documents.length === 0 ? (
          <div 
            style={{ 
              textAlign: 'center', 
              padding: '4rem 1.5rem', 
              background: 'var(--surface-bg)', 
              borderRadius: '10px', 
              border: '1px dashed var(--admin-card-border)' 
            }}
          >
            <div 
              style={{ 
                width: '54px', 
                height: '54px', 
                borderRadius: '50%', 
                background: 'rgba(181, 146, 84, 0.12)', 
                color: 'var(--color-gold-600)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginInline: 'auto', 
                marginBottom: '1rem' 
              }}
            >
              <FolderLock size={26} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              {isAr ? 'لا توجد مستندات أو تقارير في هذا التصنيف' : 'No documents found in this category'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', maxWidth: '440px', marginInline: 'auto', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {isAr 
                ? 'يتم إصدار وأرشفة التقارير الأمنية المعتمدة فور استكمال التقييم الميداني واعتمادها من قبل خبراء المركز.' 
                : 'Certified reports will appear here automatically once field assessments are finalized and approved.'}
            </p>
            <Link href="/portal/client/requests" className="btn btn-primary btn-sm">
              {isAr ? 'استعراض طلبات الخدمات الجارية' : 'View Active Service Requests'}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {documents.map((doc) => {
              const isFinal = doc.documentType === 'FINAL_REPORT';
              const isAttachment = doc.documentType === 'CLIENT_ATTACHMENT';
              const serviceTitle = isAr 
                ? (doc.request?.service?.titleAr || 'خدمة أمنية معتمدة') 
                : (doc.request?.service?.titleEn || 'Certified Security Service');

              const formattedSize = doc.sizeBytes 
                ? (doc.sizeBytes > 1024 * 1024 
                    ? `${(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB` 
                    : `${(doc.sizeBytes / 1024).toFixed(0)} KB`)
                : 'PDF';

              return (
                <div
                  key={doc.id}
                  style={{
                    padding: '1.15rem 1.35rem',
                    background: isFinal ? 'rgba(181, 146, 84, 0.05)' : 'var(--surface-card)',
                    border: isFinal ? '1px solid var(--color-gold-500)' : '1px solid var(--admin-card-border)',
                    borderInlineStart: isFinal ? '5px solid var(--color-gold-600)' : '1px solid var(--admin-card-border)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        background: isFinal ? 'rgba(181, 146, 84, 0.2)' : 'rgba(11, 61, 46, 0.08)',
                        color: isFinal ? 'var(--color-gold-600)' : 'var(--color-primary-900)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isFinal ? <FileCheck2 size={22} /> : <FileText size={20} />}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {doc.title}
                        </h4>

                        {/* Type Badge */}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            background: isFinal 
                              ? 'rgba(181, 146, 84, 0.2)' 
                              : isAttachment 
                                ? 'var(--surface-bg)' 
                                : 'rgba(22, 163, 74, 0.12)',
                            color: isFinal 
                              ? 'var(--color-gold-600)' 
                              : isAttachment 
                                ? 'var(--text-muted)' 
                                : '#16A34A',
                            border: isFinal ? '1px solid rgba(181, 146, 84, 0.35)' : '1px solid var(--admin-card-border)',
                          }}
                        >
                          {isFinal 
                            ? (isAr ? 'تقرير نهائي معتمد' : 'Final Certified Report')
                            : isAttachment 
                              ? (isAr ? 'مرفق مساند' : 'Attachment') 
                              : (isAr ? 'مخرج تشغيلي' : 'Deliverable')}
                        </span>

                        {/* File Format & Size Badge */}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          • {formattedSize}
                        </span>
                      </div>

                      {/* Request details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        <Link 
                          href={`/portal/client/requests/${doc.requestId}`}
                          style={{ color: 'var(--color-gold-600)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <span>{doc.request?.requestNumber || 'طلب خدمة'}</span>
                          <ExternalLink size={12} />
                        </Link>
                        <span>•</span>
                        <span>{serviceTitle}</span>
                        <span>•</span>
                        <span>
                          {isAr ? 'تاريخ الإصدار:' : 'Issued:'} {new Date(doc.createdAt).toLocaleDateString(isAr ? 'ar-YE' : 'en-US')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {isFinal && (
                      <ClientReportAcceptanceButton
                        documentId={doc.id}
                        initialQaStatus={doc.qaStatus}
                        initialAcceptedAt={doc.clientAcceptedAt ? doc.clientAcceptedAt.toISOString() : null}
                        locale={isAr ? 'ar' : 'en'}
                      />
                    )}

                    <a
                      href={`/api/documents/${doc.id}/download`}
                      className={isFinal ? 'btn btn-gold btn-sm' : 'btn btn-primary btn-sm'}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.45rem', 
                        fontWeight: 700,
                        padding: '0.45rem 1rem'
                      }}
                    >
                      <Download size={15} />
                      <span>{isAr ? 'تنزيل الوثيقة' : 'Download Document'}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
