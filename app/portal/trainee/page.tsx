import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { GraduationCap, Award, Calendar, CheckCircle2, Clock, MapPin, ArrowLeft } from 'lucide-react';

export const revalidate = 0;

export default async function TraineeDashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const registrations = await prisma.trainingRegistration.findMany({
    where: { userId: session.userId },
    include: {
      course: true,
      attendanceRecords: true,
      certificate: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalCertificates = registrations.filter((r) => r.certificate).length;

  return (
    <div>
      {/* 3 Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ borderInlineStart: '4px solid #3B82F6' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>البرامج التدريبية المسجل بها</span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: '#60A5FA' }}>{registrations.length}</span>
        </div>

        <div className="card" style={{ borderInlineStart: '4px solid var(--color-gold)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>الشهادات المعتمدة الصادرة</span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-gold-light)' }}>{totalCertificates}</span>
        </div>

        <div className="card" style={{ borderInlineStart: '4px solid #10B981' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>نسبة الحضور التراكمية</span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: '#34D399' }}>100%</span>
        </div>
      </div>

      {/* Enrolled Courses & Attendance */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF', marginBottom: '1.5rem' }}>
          سجل الدورات والتأهيل الأمني
        </h2>

        {registrations.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>لم يتم تسجيلك في أي دورة تدريبية حتى الآن.</p>
            <Link href="/training" className="btn btn-gold btn-sm" style={{ marginTop: '1rem' }}>
              استعراض الدورات المتاحة
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {registrations.map((reg) => (
              <div key={reg.id} style={{ padding: '1.5rem', background: 'rgba(5,14,9,0.7)', borderRadius: '12px', border: '1px solid rgba(197,155,39,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>{reg.status}</span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', margin: '0 0 0.3rem 0' }}>
                      {reg.course.titleAr}
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-gold-light)' }}>{reg.course.titleEn}</span>
                  </div>

                  {reg.certificate && (
                    <Link href="/portal/trainee/certificates" className="btn btn-gold btn-sm">
                      <Award size={15} />
                      <span>عرض الشهادة المعتمدة</span>
                    </Link>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.2rem', padding: '0.85rem', background: 'rgba(11,37,24,0.4)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <Clock size={16} style={{ color: 'var(--color-gold-light)' }} />
                    <span>المدة: {reg.course.duration}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <MapPin size={16} style={{ color: 'var(--color-gold-light)' }} />
                    <span>الموقع: {reg.course.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={16} style={{ color: '#34D399' }} />
                    <span>حالة الإنجاز: {reg.status === 'COMPLETED' ? 'تم الاجتياز بنجاح' : 'قيد التدريب'}</span>
                  </div>
                </div>

                {/* Attendance Summary */}
                {reg.attendanceRecords.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-gold-light)', marginBottom: '0.6rem' }}>
                      سجل الحضور والتقييم العملي:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
                      {reg.attendanceRecords.map((att) => (
                        <div key={att.id} style={{ padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {new Date(att.sessionDate).toLocaleDateString('ar-YE')}
                          </span>
                          <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                            {att.status === 'PRESENT' ? 'حاضر' : att.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
