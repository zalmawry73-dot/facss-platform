import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { requireAuth, STAFF_ROLES } from '@/lib/rbac';
import StatusBadge from '@/components/StatusBadge';
import { 
  Shield, 
  CheckCircle2, 
  User, 
  FileText, 
  Download, 
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  FolderLock,
  Clock,
  Building2,
  ExternalLink
} from 'lucide-react';
import ClientDocumentUpload from '@/components/portal/ClientDocumentUpload';
import ClientFeedbackForm from '@/components/portal/ClientFeedbackForm';
import ClientReportAcceptanceButton from '@/components/portal/ClientReportAcceptanceButton';

export const revalidate = 0;

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ClientRequestDetailPage({ params }: PageProps) {
  const cookieStore = cookies();
  const isAr = cookieStore.get('facss_locale')?.value !== 'en';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  // Layer 2 server-side auth check
  const user = await requireAuth(`/portal/client/requests/${params.id}`);

  const req = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    include: {
      service: true,
      assignedEmployee: { select: { fullName: true, email: true, phone: true } },
      notes: {
        where: { isClientVisible: true },
        orderBy: { createdAt: 'desc' },
      },
      documents: {
        where: {
          isArchived: false,
          visibility: 'CLIENT_VISIBLE',
        },
        orderBy: { createdAt: 'desc' },
      },
      feedback: true,
    },
  });

  if (!req) {
    notFound();
  }

  // Security authorization: STRICT ALLOWLIST
  const isStaff = STAFF_ROLES.includes(user.role as any);
  const isOwner = Boolean(
    (req.userId && req.userId === user.userId) ||
    (req.contactEmail && req.contactEmail.trim().toLowerCase() === user.email.trim().toLowerCase())
  );

  // If request had no userId but belongs to this user by email, link it permanently
  if (isOwner && !req.userId && user.userId) {
    await prisma.serviceRequest.update({
      where: { id: req.id },
      data: { userId: user.userId },
    }).catch(() => {});
  }

  if (!isOwner && !isStaff) {
    return (
      <div className="portal-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', maxWidth: '520px', marginInline: 'auto' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginInline: 'auto', marginBottom: '1rem' }}>
          <Shield size={26} />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          {isAr ? 'وصول مقيد وغير مصرح به' : 'Restricted Access'}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '1.5rem' }}>
          {isAr ? 'غير مصرح لك بالاطلاع على تفاصيل هذا الطلب الأمني.' : 'You are not authorized to view this request.'}
        </p>
        <Link href="/portal/client/requests" className="btn btn-primary btn-sm">
          {isAr ? 'العودة لقائمة الطلبات' : 'Return to Requests'}
        </Link>
      </div>
    );
  }

  // Categorize documents
  const finalReports = req.documents.filter((d) => d.documentType === 'FINAL_REPORT');
  const clientAttachments = req.documents.filter((d) => d.documentType === 'CLIENT_ATTACHMENT');
  const centerDeliverables = req.documents.filter((d) => d.documentType !== 'FINAL_REPORT' && d.documentType !== 'CLIENT_ATTACHMENT');

  const steps = [
    { key: 'NEW', label: isAr ? 'طلب جديد' : 'New Request' },
    { key: 'UNDER_REVIEW', label: isAr ? 'قيد المراجعة' : 'Under Review' },
    { key: 'APPROVED', label: isAr ? 'معتمد' : 'Approved' },
    { key: 'IN_PROGRESS', label: isAr ? 'تنفيذ ميداني' : 'In Field' },
    { key: 'COMPLETED', label: isAr ? 'مكتمل' : 'Completed' },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'NEW': return 0;
      case 'UNDER_REVIEW':
      case 'CONTACTED':
      case 'WAITING_FOR_CLIENT': return 1;
      case 'APPROVED': return 2;
      case 'IN_PROGRESS':
      case 'REPORT_READY': return 3;
      case 'COMPLETED': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(req.status);

  return (
    <div>
      {/* Staff Operational Notice Banner */}
      {isStaff && (
        <div
          className="portal-card"
          style={{
            background: 'linear-gradient(90deg, rgba(181, 146, 84, 0.12), rgba(8, 40, 30, 0.05))',
            border: '1px solid var(--color-gold-500)',
            borderInlineStart: '5px solid var(--color-gold-600)',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(181, 146, 84, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-gold-700)',
                flexShrink: 0,
              }}
            >
              <Shield size={22} />
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem', display: 'block', marginBottom: '0.2rem' }}>
                {isAr ? `أنت تستعرض هذا الطلب بصلاحية مسؤول نظام (${user.role})` : `Viewing request with staff privilege (${user.role})`}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isAr ? 'هذه هي معاينة تجربة العميل الفعلية للطلب.' : 'This is the verified client-facing view of the request.'}
              </span>
            </div>
          </div>
          <Link
            href={`/admin/requests?id=${req.id}`}
            className="btn btn-gold btn-sm"
            style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            <span>{isAr ? 'الانتقال لإدارة الطلب بلوحة التحكم' : 'Manage in Admin Console'}</span>
          </Link>
        </div>
      )}

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-primary-950)', margin: 0, fontFamily: 'var(--font-en)' }}>
              {req.requestNumber}
            </h1>
            <StatusBadge type="serviceRequest" status={req.status} locale={isAr ? 'ar' : 'en'} />
          </div>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building2 size={14} />
            <span>{(isAr ? req.service.titleAr : ((req.service as any).titleEn || req.service.titleAr))}</span>
            <span>•</span>
            <span>{req.organization}</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {isStaff && (
            <Link href={`/admin/requests?id=${req.id}`} className="btn btn-gold btn-sm">
              <span>{isAr ? 'إدارة الطلب' : 'Manage'}</span>
            </Link>
          )}
          <Link
            href={isStaff ? '/admin/requests' : '/portal/client/requests'}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ArrowIcon size={14} />
            <span>{isStaff ? (isAr ? 'العودة لطلبات الإدارة' : 'Admin Requests') : (isAr ? 'العودة للطلبات' : 'All Requests')}</span>
          </Link>
        </div>
      </div>

      {/* Visual Workflow Pipeline (Requirement 2) */}
      <div className="portal-card" style={{ marginBottom: '1.75rem', padding: '1.75rem 1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--admin-card-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} style={{ color: 'var(--color-gold-600)' }} />
          <span>{isAr ? 'مسار تقدم ومراحل تنفيذ الطلب الميداني' : 'Field Request Progress Pipeline'}</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', textAlign: 'center' }}>
          {steps.map((step, idx) => {
            const isDone = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div 
                key={step.key} 
                style={{ 
                  padding: '0.75rem 0.5rem',
                  borderRadius: '10px',
                  background: isCurrent ? 'rgba(181, 146, 84, 0.1)' : isDone ? 'rgba(21, 128, 61, 0.05)' : 'var(--surface-bg)',
                  border: isCurrent ? '1.5px solid var(--color-gold-500)' : isDone ? '1px solid rgba(21, 128, 61, 0.25)' : '1px solid var(--admin-card-border)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--color-gold-500)' : isDone ? '#15803D' : 'var(--admin-card-border)',
                    color: isCurrent ? 'var(--color-primary-950)' : isDone ? '#FFFFFF' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    marginInline: 'auto',
                    marginBottom: '0.4rem',
                  }}
                >
                  {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                </div>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: isCurrent ? 800 : isDone ? 700 : 500,
                    color: isCurrent ? 'var(--color-primary-950)' : isDone ? 'var(--text-primary)' : 'var(--text-muted)',
                    display: 'block',
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Approved Reports Highlight Card */}
      {finalReports.length > 0 && (
        <div 
          className="portal-card" 
          style={{ 
            marginBottom: '1.75rem', 
            background: 'linear-gradient(135deg, rgba(181, 146, 84, 0.08) 0%, rgba(11, 61, 46, 0.04) 100%)',
            border: '2px solid var(--color-gold-500)',
            borderInlineStart: '6px solid var(--color-gold-600)',
            padding: '1.6rem 1.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <FileCheck2 size={26} style={{ color: 'var(--color-gold-600)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {isAr ? 'التقرير الأمني النهائي المعتمد (Final Assessment Report)' : 'Official Final Assessment Report'}
            </h3>
          </div>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            {isAr 
              ? 'تم إنجاز التقييم الميداني وإصدار الوثيقة النهائية المعتمدة من قبل خبراء مركز الحلول المتكاملة للأمن والسلامة. يمكنك الاطلاع عليها وتنزيل نسختك الرقمية الرسمية أدناه:' 
              : 'The field assessment has been completed and the final official report has been certified by experts of the Integrated Solutions Center for Safety and Security. Download below:'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {finalReports.map((report) => (
              <div 
                key={report.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '1rem 1.25rem', 
                  background: 'var(--surface-card)', 
                  borderRadius: '10px', 
                  border: '1px solid var(--admin-card-border)',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(181, 146, 84, 0.15)', color: 'var(--color-gold-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderLock size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {report.title}
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {isAr ? 'تاريخ الاعتماد:' : 'Issued:'} {new Date(report.createdAt).toLocaleDateString(isAr ? 'ar-YE' : 'en-US')} • {report.sizeBytes ? (report.sizeBytes / (1024 * 1024)).toFixed(2) + ' MB' : 'PDF'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <ClientReportAcceptanceButton
                    documentId={report.id}
                    initialQaStatus={report.qaStatus}
                    initialAcceptedAt={report.clientAcceptedAt ? report.clientAcceptedAt.toISOString() : null}
                    locale={isAr ? 'ar' : 'en'}
                  />
                  <a 
                    href={`/api/documents/${report.id}/download`} 
                    className="btn btn-gold btn-sm" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
                  >
                    <Download size={15} />
                    <span>{isAr ? 'تنزيل التقرير الأمني' : 'Download Report'}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Details, Notes, and Attachments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        {/* Left Column: Scope & Activity Notes */}
        <div style={{ flex: 2 }}>
          {/* Scope Card */}
          <div className="portal-card" style={{ marginBottom: '1.75rem' }}>
            <h3 className="portal-card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--admin-card-border)' }}>
              <FileText size={18} style={{ color: 'var(--color-gold-600)' }} />
              <span>{isAr ? 'نطاق وتفاصيل طلب الخدمة' : 'Service Scope & Requirements'}</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.8, whiteSpace: 'pre-line', margin: 0 }}>
              {req.description}
            </p>
          </div>

          {/* Activity Notes Thread */}
          <div className="portal-card" style={{ marginBottom: '1.75rem' }}>
            <h3 className="portal-card-title" style={{ fontSize: '1.1rem', marginBottom: '1.2rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--admin-card-border)' }}>
              <Clock size={18} style={{ color: 'var(--color-gold-600)' }} />
              <span>{isAr ? 'تحديثات غرفة العمليات والمتابعة الميدانية' : 'Operations Updates & Field Notes'}</span>
            </h3>

            {req.notes.length === 0 ? (
              <div className="portal-empty-state" style={{ padding: '2rem 1rem' }}>
                <Clock size={32} style={{ color: 'var(--text-muted)', marginInline: 'auto', marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
                  {isAr 
                    ? 'جارٍ مراجعة طلبكم وسيقوم الضابط الميداني المكلف بنشر التحديثات هنا.' 
                    : 'Your request is in review. Updates will appear here as work progresses.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {req.notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: '1.1rem 1.25rem',
                      background: 'var(--surface-bg)',
                      borderRadius: '8px',
                      borderInlineStart: '4px solid var(--color-gold-500)',
                      border: '1px solid var(--admin-card-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary-900)' }}>
                        {note.authorName}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-en)' }}>
                        {new Date(note.createdAt).toLocaleDateString(isAr ? 'ar-YE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                      {note.note}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Attachments Section */}
          <div className="portal-card">
            <h3 className="portal-card-title" style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>
              <FolderLock size={18} style={{ color: 'var(--color-gold-600)' }} />
              <span>{isAr ? 'مستندات ومرفقات العميل' : 'Client Attachments'}</span>
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '1.2rem' }}>
              {isAr ? 'المخططات ووثائق التفويض المرفقة بالطلب' : 'Site plans, authorization letters, and uploaded files'}
            </span>

            {clientAttachments.length === 0 ? (
              <div className="portal-empty-state" style={{ padding: '2rem 1rem', marginBottom: '1.25rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  {isAr 
                    ? 'لم يتم إرفاق مستندات بعد. يمكنك رفع المخططات والوثائق الداعمة أدناه.' 
                    : 'No documents uploaded yet. Use the form below to attach files.'}
                </p>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '0 0 1.25rem 0', padding: 0 }}>
                {clientAttachments.map((doc) => (
                  <li 
                    key={doc.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '0.85rem 1rem', 
                      background: 'var(--surface-bg)', 
                      borderRadius: '8px',
                      border: '1px solid var(--admin-card-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <FileText size={18} style={{ color: 'var(--color-gold-600)' }} />
                      <div>
                        <span style={{ fontSize: '0.86rem', color: 'var(--text-primary)', display: 'block', fontWeight: 600 }}>
                          {doc.title}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(doc.createdAt).toLocaleDateString(isAr ? 'ar-YE' : 'en-US')} • {doc.sizeBytes ? (doc.sizeBytes / 1024).toFixed(0) + ' KB' : ''}
                        </span>
                      </div>
                    </div>
                    <a 
                      href={`/api/documents/${doc.id}/download`} 
                      className="admin-btn admin-btn-outline admin-btn-sm" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      <Download size={13} />
                      <span>{isAr ? 'تنزيل' : 'Download'}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {/* Interactive Upload Widget */}
            <ClientDocumentUpload requestId={req.id} />
          </div>
        </div>

        {/* Right Column: Assigned Officer & Deliverables */}
        <div>
          {/* Assigned Officer Card */}
          <div className="portal-card" style={{ marginBottom: '1.75rem' }}>
            <h3 className="portal-card-title" style={{ fontSize: '1.05rem', marginBottom: '1.15rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--admin-card-border)' }}>
              <User size={18} style={{ color: 'var(--color-gold-600)' }} />
              <span>{isAr ? 'المسؤول الأمني المكلّف' : 'Assigned Security Officer'}</span>
            </h3>

            {req.assignedEmployee ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(181, 146, 84, 0.15)', color: 'var(--color-gold-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  <User size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {req.assignedEmployee.fullName}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-primary-900)', fontWeight: 600 }}>
                    {isAr ? 'ضابط عمليات أمنية مكلّف' : 'Operations Officer'}
                  </span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', fontFamily: 'var(--font-en)' }} dir="ltr">
                    {req.assignedEmployee.phone || req.assignedEmployee.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="portal-empty-state" style={{ padding: '1.25rem 1rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
                  {isAr 
                    ? 'طلبكم قيد التخصيص وسيقوم مدير العمليات بتكليف ضابط المتابعة قريباً.' 
                    : 'Pending assignment by operations director.'}
                </p>
              </div>
            )}
          </div>

          {/* Other Center Deliverables (Client-Visible) */}
          <div className="portal-card">
            <h3 className="portal-card-title" style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>
              <FileCheck2 size={18} style={{ color: 'var(--color-gold-600)' }} />
              <span>{isAr ? 'مستندات ومخرجات المركز' : 'Center Deliverables'}</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '1rem' }}>
              {isAr ? 'الوثائق والمصفوفات المشتركة من فريق العمليات' : 'Deliverables shared by operations'}
            </span>

            {centerDeliverables.length === 0 ? (
              <div className="portal-empty-state" style={{ padding: '1.5rem 1rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
                  {isAr ? 'لا توجد مستندات إضافية حالياً.' : 'No additional deliverables shared yet.'}
                </p>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: 0, padding: 0 }}>
                {centerDeliverables.map((doc) => (
                  <li 
                    key={doc.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '0.8rem', 
                      background: 'var(--surface-bg)', 
                      borderRadius: '8px', 
                      border: '1px solid var(--admin-card-border)' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <FileText size={18} style={{ color: 'var(--color-gold-600)' }} />
                      <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', fontWeight: 600 }}>{doc.title}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(doc.createdAt).toLocaleDateString(isAr ? 'ar-YE' : 'en-US')}
                        </span>
                      </div>
                    </div>
                    <a 
                      href={`/api/documents/${doc.id}/download`} 
                      className="btn btn-gold btn-sm" 
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      <Download size={13} />
                      <span>{isAr ? 'تحميل' : 'Download'}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Client Feedback Card on Completed Requests */}
      {req.status === 'COMPLETED' && isOwner && (
        <ClientFeedbackForm
          requestId={req.id}
          existingFeedback={req.feedback ? {
            overallRating: req.feedback.overallRating,
            serviceQuality: req.feedback.serviceQuality,
            timeliness: req.feedback.timeliness,
            communication: req.feedback.communication,
            comment: req.feedback.comment,
            submittedAt: req.feedback.submittedAt.toISOString(),
          } : null}
          locale={isAr ? 'ar' : 'en'}
        />
      )}
    </div>
  );
}
