import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
  FileCheck2,
  FolderLock
} from 'lucide-react';
import ClientDocumentUpload from '@/components/portal/ClientDocumentUpload';

export const revalidate = 0;

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ClientRequestDetailPage({ params }: PageProps) {
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
        // Enforce strict client-visible and non-archived filter at the database level
        where: {
          isArchived: false,
          visibility: 'CLIENT_VISIBLE',
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!req) {
    notFound();
  }

  // Security authorization: STRICT ALLOWLIST
  // Only the verified request owner OR authorized staff can view this request.
  const isStaff = STAFF_ROLES.includes(user.role as any);
  const isOwner = Boolean(req.userId && req.userId === user.userId);

  if (!isOwner && !isStaff) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#EF4444', fontWeight: 700 }}>غير مصرح لك بالاطلاع على هذا الطلب الأمني.</p>
        <Link href="/portal/client/requests" className="btn btn-outline" style={{ marginTop: '1rem' }}>
          العودة للطلبات
        </Link>
      </div>
    );
  }

  // Categorize documents
  const finalReports = req.documents.filter((d) => d.documentType === 'FINAL_REPORT');
  const clientAttachments = req.documents.filter((d) => d.documentType === 'CLIENT_ATTACHMENT');
  const centerDeliverables = req.documents.filter((d) => d.documentType !== 'FINAL_REPORT' && d.documentType !== 'CLIENT_ATTACHMENT');

  const steps = [
    { key: 'NEW', label: 'طلب جديد' },
    { key: 'UNDER_REVIEW', label: 'قيد المراجعة' },
    { key: 'APPROVED', label: 'معتمد' },
    { key: 'IN_PROGRESS', label: 'تنفيذ ميداني' },
    { key: 'COMPLETED', label: 'مكتمل' },
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
      {/* Back button & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--facss-gold-700)', margin: 0 }}>
              {req.requestNumber}
            </h1>
            <StatusBadge type="serviceRequest" status={req.status} />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {req.service.titleAr} • {req.organization}
          </span>
        </div>

        <Link href="/portal/client/requests" className="btn btn-outline btn-sm">
          <span>العودة لسجل الطلبات</span>
          <ArrowLeft size={16} />
        </Link>
      </div>

      {/* Visual Workflow Pipeline */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.8rem 1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
          مسار تقدم الطلب الميداني
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
          {steps.map((step, idx) => {
            const isDone = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={step.key} style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--facss-gold-500)' : isDone ? 'var(--facss-green-700)' : 'var(--surface-sunken)',
                    color: isCurrent ? 'var(--facss-green-950)' : isDone ? '#FFFFFF' : 'var(--text-muted)',
                    border: isCurrent ? '2px solid var(--facss-gold-600)' : isDone ? 'none' : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    marginInline: 'auto',
                    marginBottom: '0.5rem',
                  }}
                >
                  {isDone ? <CheckCircle2 size={18} /> : idx + 1}
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isCurrent ? 800 : 500,
                    color: isCurrent ? 'var(--facss-green-950)' : isDone ? 'var(--text-primary)' : 'var(--text-muted)',
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
          className="card" 
          style={{ 
            marginBottom: '2rem', 
            background: 'var(--surface-sunken)',
            border: '2px solid var(--facss-gold-500)',
            padding: '1.8rem 2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
            <FileCheck2 size={26} style={{ color: 'var(--facss-gold-600)' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              التقرير الأمني النهائي (Final Assessment Report)
            </h3>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', lineHeight: 1.6 }}>
            تم إنجاز التقييم الأمني الميداني وإصدار الوثيقة النهائية من قبل خبراء مركز عدن الأول. يمكنك تنزيل النسخة الرقمية عبر الرابط المشفر أدناه:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {finalReports.map((report) => (
              <div 
                key={report.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '1rem 1.2rem', 
                  background: 'var(--surface-card)', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <FolderLock size={22} style={{ color: 'var(--facss-gold-600)' }} />
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {report.title}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      تاريخ الاعتماد: {new Date(report.createdAt).toLocaleDateString('ar-YE')} • الحجم: {report.sizeBytes ? (report.sizeBytes / (1024 * 1024)).toFixed(2) + ' MB' : 'PDF'}
                    </span>
                  </div>
                </div>

                <a 
                  href={`/api/documents/${report.id}/download`} 
                  className="btn btn-gold btn-sm" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                >
                  <Download size={15} />
                  <span>تنزيل التقرير الأمني الرسمي</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Scope & Timeline Notes */}
        <div style={{ flex: 2 }}>
          {/* Scope Card */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              نطاق وتفاصيل طلب الخدمة
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {req.description}
            </p>
          </div>

          {/* Activity Notes Thread */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.2rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              تحديثات غرفة العمليات والمتابعة الميدانية
            </h3>

            {req.notes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                جارٍ مراجعة طلبكم وسيقوم الضابط المكلف بنشر التحديثات الميدانية هنا.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {req.notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: '1.2rem',
                      background: 'var(--surface-sunken)',
                      borderRadius: '8px',
                      borderInlineStart: '4px solid var(--facss-gold-500)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--facss-green-900)' }}>
                        {note.authorName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(note.createdAt).toLocaleDateString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                      {note.note}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Attachments Section */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              مستندات ومرفقات العميل
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '1.2rem' }}>
              المخططات ووثائق التفويض التي أرفقتها بالطلب
            </span>

            {clientAttachments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                لم يتم إرفاق أي مستندات من قبلك حتى الآن. يمكنك استخدام النموذج أدناه لرفع المخططات ووثائق التفويض.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: 0, padding: 0 }}>
                {clientAttachments.map((doc) => (
                  <li 
                    key={doc.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '0.85rem 1rem', 
                      background: 'var(--surface-sunken)', 
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <FileText size={18} style={{ color: 'var(--facss-gold-600)' }} />
                      <div>
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block', fontWeight: 600 }}>
                          {doc.title}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(doc.createdAt).toLocaleDateString('ar-YE')} • {doc.sizeBytes ? (doc.sizeBytes / 1024).toFixed(0) + ' KB' : ''}
                        </span>
                      </div>
                    </div>
                    <a 
                      href={`/api/documents/${doc.id}/download`} 
                      className="btn btn-outline btn-sm" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      <Download size={13} />
                      <span>تنزيل</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {/* Interactive Upload Widget */}
            <ClientDocumentUpload requestId={req.id} />
          </div>
        </div>

        {/* Right Column: Assigned Cadre & Center Deliverables */}
        <div>
          {/* Assigned Cadre Card */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.2rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              المسؤول الأمني المكلّف
            </h3>

            {req.assignedEmployee ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--facss-gold-500)', color: 'var(--facss-green-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  <User size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {req.assignedEmployee.fullName}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--facss-green-900)', fontWeight: 600 }}>
                    ضابط عمليات أمنية مكلّف
                  </span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                    {req.assignedEmployee.phone || req.assignedEmployee.email}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.85rem', background: 'var(--surface-sunken)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
                طلبكم قيد التخصيص وسيقوم مدير العمليات بتكليف ضابط المتابعة قريباً.
              </div>
            )}
          </div>

          {/* Other Center Deliverables (Client-Visible) */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              مستندات المركز المرئية
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '1rem' }}>
              الوثائق والمصفوفات الأولية المشتركة من فريق العمليات
            </span>

            {centerDeliverables.length === 0 ? (
              <div style={{ padding: '1rem', background: 'var(--surface-sunken)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
                لا توجد مستندات إضافية من المركز حالياً.
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
                      padding: '0.75rem', 
                      background: 'var(--surface-sunken)', 
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <FileText size={18} style={{ color: 'var(--facss-gold-600)' }} />
                      <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', fontWeight: 600 }}>{doc.title}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(doc.createdAt).toLocaleDateString('ar-YE')}
                        </span>
                      </div>
                    </div>
                    <a 
                      href={`/api/documents/${doc.id}/download`} 
                      className="btn btn-gold btn-sm" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      <Download size={13} />
                      <span>تحميل</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
