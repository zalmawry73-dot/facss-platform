import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { 
  Shield, 
  Clock, 
  User, 
  CheckCircle2, 
  FileText, 
  AlertCircle, 
  ArrowLeft,
  Building,
  Phone,
  Mail,
  Download
} from 'lucide-react';

export const revalidate = 0;

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ClientRequestDetailPage({ params }: PageProps) {
  const session = await getCurrentUser();
  if (!session) return null;

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
        orderBy: { createdAt: 'desc' },
      }
    }
  });

  if (!req) {
    notFound();
  }

  // Security authorization
  if (req.userId !== session.userId && session.role === 'CLIENT') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#EF4444' }}>غير مصرح لك بالاطلاع على هذا الطلب.</p>
        <Link href="/portal/client/requests" className="btn btn-outline" style={{ marginTop: '1rem' }}>
          العودة للطلبات
        </Link>
      </div>
    );
  }

  const steps = [
    { key: 'NEW', label: 'طلب جديد' },
    { key: 'UNDER_REVIEW', label: 'قيد المراجعة' },
    { key: 'APPROVED', label: 'معتمد' },
    { key: 'IN_PROGRESS', label: 'تنفيذ ميداني' },
    { key: 'REPORT_READY', label: 'التقرير جاهز' },
    { key: 'COMPLETED', label: 'مكتمل' },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'NEW': return 0;
      case 'UNDER_REVIEW':
      case 'CONTACTED':
      case 'WAITING_FOR_CLIENT': return 1;
      case 'APPROVED': return 2;
      case 'IN_PROGRESS': return 3;
      case 'REPORT_READY': return 4;
      case 'COMPLETED': return 5;
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
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-gold-light)', margin: 0 }}>
              {req.requestNumber}
            </h1>
            <span className={`badge ${req.status === 'COMPLETED' ? 'badge-green' : 'badge-gold'}`}>
              {req.status}
            </span>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
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
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: '1.5rem' }}>
          مسار تقدم الطلب الميداني
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
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
                    background: isCurrent ? 'var(--color-gold)' : isDone ? '#10B981' : 'rgba(255,255,255,0.1)',
                    color: isCurrent ? '#050E09' : '#FFF',
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
                    color: isCurrent ? 'var(--color-gold-light)' : isDone ? '#FFFFFF' : 'var(--text-subtle)',
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Scope & Timeline Notes */}
        <div style={{ flex: 2 }}>
          {/* Scope Card */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem' }}>
              نطاق وتفاصيل طلب الخدمة
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {req.description}
            </p>
          </div>

          {/* Activity Notes Thread */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginBottom: '1.2rem' }}>
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
                      background: 'rgba(11, 37, 24, 0.4)',
                      borderRadius: '8px',
                      borderInlineStart: '4px solid var(--color-gold)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-gold-light)' }}>
                        {note.authorName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {new Date(note.createdAt).toLocaleDateString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ color: '#FFF', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                      {note.note}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Assigned Cadre & Deliverables */}
        <div>
          {/* Assigned Cadre Card */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', marginBottom: '1.2rem' }}>
              المسؤول الأمني المكلّف
            </h3>

            {req.assignedEmployee ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-gold)', color: '#050E09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  <User size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                    {req.assignedEmployee.fullName}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-gold-light)' }}>
                    ضابط عمليات أمنية معتمد
                  </span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                    {req.assignedEmployee.phone || req.assignedEmployee.email}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.85rem', background: 'rgba(5,14,9,0.5)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                طلبكم قيد التخصيص وسيقوم مدير العمليات بتكليف ضابط المتابعة قريباً.
              </div>
            )}
          </div>

          {/* Deliverables & Confidential Reports */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem' }}>
              المستندات والتقارير المرفقة
            </h3>

            {req.documents.length === 0 ? (
              <div style={{ padding: '1rem', background: 'rgba(5,14,9,0.5)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                سيتم رفع تقارير التقييم ومصفوفات المخاطر المعتمدة هنا فور جهوزيتها.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {req.documents.map((doc) => (
                  <li key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(11,37,24,0.5)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <FileText size={18} style={{ color: 'var(--color-gold)' }} />
                      <span style={{ fontSize: '0.85rem', color: '#FFF' }}>{doc.title}</span>
                    </div>
                    <a href={doc.filePath} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
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
