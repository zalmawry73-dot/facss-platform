import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { requireRole, ROLES } from '@/lib/rbac';
import { type Locale } from '@/lib/i18n';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  FileCheck,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const revalidate = 0;

export default async function TraineeAttendancePage() {
  const session = await requireRole([ROLES.TRAINEE], '/portal/trainee/attendance');

  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const isAr = locale === 'ar';
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight;

  const registrations = await prisma.trainingRegistration.findMany({
    where: {
      OR: [
        { userId: session.userId },
        { email: session.email },
      ],
    },
    include: {
      course: {
        select: {
          id: true,
          titleAr: true,
          titleEn: true,
          duration: true,
          location: true,
          minAttendancePct: true,
          requiresPreEval: true,
          requiresPostEval: true,
          sessions: {
            orderBy: { sessionNumber: 'asc' },
            select: {
              id: true,
              sessionNumber: true,
              title: true,
              sessionDate: true,
              startTime: true,
              endTime: true,
              notes: true,
            },
          },
        },
      },
      attendanceRecords: {
        include: {
          session: {
            select: {
              id: true,
              sessionNumber: true,
              title: true,
            },
          },
        },
        orderBy: { sessionDate: 'asc' },
      },
      evaluations: true,
      certificate: {
        select: {
          id: true,
          certificateNumber: true,
          isRevoked: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFF', margin: '0 0 0.35rem 0' }}>
              {isAr ? 'سجل الحضور والجلسات والتقييمات الأكاديمية' : 'Attendance, Sessions & Academic Evaluations'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {isAr
                ? 'متابعة سجل حضورك لكل جلسة تدريبية، نسبة الحضور المحققة، ونتائج التقييمات القبلية والبعدية'
                : 'Track your session attendance, attendance percentage, and pre/post evaluation scores'}
            </p>
          </div>
          <Link href="/portal/trainee" className="btn btn-outline btn-sm">
            <span>{isAr ? 'العودة للوحة المتدرب' : 'Back to Dashboard'}</span>
            <ChevronIcon size={14} />
          </Link>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>
            {isAr ? 'لم يتم تسجيلك في أي دورات تدريبية بعد.' : 'You have not enrolled in any training courses yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {registrations.map((reg) => {
            const course = reg.course;
            const courseTitle = isAr ? course.titleAr : course.titleEn || course.titleAr;
            const totalSessions = course.sessions.length;
            const presentCount = reg.attendanceRecords.filter((a) => a.status === 'PRESENT').length;
            const excusedCount = reg.attendanceRecords.filter((a) => a.status === 'EXCUSED').length;
            const absentCount = reg.attendanceRecords.filter((a) => a.status === 'ABSENT').length;
            const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;
            const minRequired = course.minAttendancePct ?? 75;
            const isEligible = attendancePct >= minRequired;

            const preEval = reg.evaluations.find((e) => e.type === 'PRE') || null;
            const postEval = reg.evaluations.find((e) => e.type === 'POST') || null;

            return (
              <div key={reg.id} className="card" style={{ padding: 'clamp(1rem, 3vw, 1.75rem)' }}>
                {/* Course Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', margin: '0 0 0.3rem 0' }}>
                      {courseTitle}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span>{isAr ? `المدة: ${course.duration}` : `Duration: ${course.duration}`}</span>
                      <span>•</span>
                      <span>{isAr ? `المقر: ${course.location}` : `Location: ${course.location}`}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span
                      className="badge"
                      style={{
                        background: isEligible ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                        color: isEligible ? '#22c55e' : '#ef4444',
                        border: `1px solid ${isEligible ? '#22c55e' : '#ef4444'}50`,
                        fontWeight: 700,
                      }}
                    >
                      {isEligible
                        ? (isAr ? `مستوفٍ لنسبة الحضور (${attendancePct}%)` : `Attendance Met (${attendancePct}%)`)
                        : (isAr ? `حضور ضعيف (${attendancePct}% / المطلوب ${minRequired}%)` : `Below Threshold (${attendancePct}%)`)}
                    </span>

                    {reg.certificate && !reg.certificate.isRevoked && (
                      <Link href="/portal/trainee/certificates" className="btn btn-gold btn-sm">
                        <Award size={14} />
                        <span>{isAr ? 'عرض الشهادة المعتمدة' : 'View Certificate'}</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                  <div style={{ padding: '0.85rem 1rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                      {isAr ? 'نسبة الحضور الفعلية' : 'Attendance Rate'}
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: isEligible ? '#22c55e' : '#ef4444' }}>
                      {attendancePct}%
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isAr ? `الحد الأدنى: ${minRequired}%` : `Minimum: ${minRequired}%`}
                    </span>
                  </div>

                  <div style={{ padding: '0.85rem 1rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                      {isAr ? 'جلسات الحضور' : 'Attended Sessions'}
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22c55e' }}>
                      {presentCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {totalSessions}</span>
                    </span>
                  </div>

                  <div style={{ padding: '0.85rem 1rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                      {isAr ? 'الغياب والأعذار' : 'Absences & Excuses'}
                    </span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem' }}>
                      <span style={{ color: '#ef4444' }}>{absentCount} {isAr ? 'غائب' : 'absent'}</span>
                      {excusedCount > 0 && (
                        <span style={{ color: '#f59e0b', fontSize: '0.9rem', marginInlineStart: '0.5rem' }}>
                          • {excusedCount} {isAr ? 'معذور' : 'excused'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Evaluations Metric */}
                  <div style={{ padding: '0.85rem 1rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                      {isAr ? 'التقييم الأكاديمي (بعدي)' : 'Post Evaluation'}
                    </span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: postEval?.score !== null && postEval?.score !== undefined ? '#22c55e' : 'var(--text-muted)' }}>
                      {postEval?.score !== null && postEval?.score !== undefined ? `${postEval.score} / ${postEval.maxScore}` : (isAr ? 'لم يُؤدَّ بعد' : 'Pending')}
                    </div>
                    {preEval?.score !== null && preEval?.score !== undefined && postEval?.score !== null && postEval?.score !== undefined && (
                      <span style={{ fontSize: '0.75rem', color: postEval.score >= preEval.score ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                        {postEval.score >= preEval.score ? `+${postEval.score - preEval.score}` : postEval.score - preEval.score} {isAr ? 'معدل التطور' : 'gain'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sessions Table */}
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF', marginBottom: '0.75rem' }}>
                  {isAr ? 'جدول الجلسات التدريبية وحالة الحضور' : 'Training Sessions & Attendance'}
                </h4>

                {course.sessions.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {isAr ? 'لم يحدد المركز جدول الجلسات بعد.' : 'No sessions scheduled yet.'}
                  </p>
                ) : (
                  <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{isAr ? 'الجلسة' : 'Session'}</th>
                          <th>{isAr ? 'عنوان وموضوع الجلسة' : 'Topic'}</th>
                          <th>{isAr ? 'التاريخ والوقت' : 'Date & Time'}</th>
                          <th>{isAr ? 'حالة الحضور' : 'Attendance Status'}</th>
                          <th>{isAr ? 'ملاحظات' : 'Notes'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {course.sessions.map((sess) => {
                          const record = reg.attendanceRecords.find((a) => a.sessionId === sess.id);
                          const status = record?.status || null;

                          return (
                            <tr key={sess.id}>
                              <td style={{ fontWeight: 800, color: 'var(--color-gold)' }}>
                                {isAr ? `الجلسة ${sess.sessionNumber}` : `Session ${sess.sessionNumber}`}
                              </td>
                              <td style={{ fontWeight: 600 }}>{sess.title}</td>
                              <td>
                                <div style={{ fontSize: '0.85rem' }}>
                                  {new Date(sess.sessionDate).toLocaleDateString(isAr ? 'ar-YE' : 'en-US')}
                                </div>
                                {(sess.startTime || sess.endTime) && (
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {sess.startTime || ''} {sess.endTime ? `— ${sess.endTime}` : ''}
                                  </div>
                                )}
                              </td>
                              <td>
                                {status === 'PRESENT' ? (
                                  <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid #22c55e50' }}>
                                    {isAr ? 'حاضر' : 'Present'}
                                  </span>
                                ) : status === 'EXCUSED' ? (
                                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b50' }}>
                                    {isAr ? 'معذور رسمي' : 'Excused'}
                                  </span>
                                ) : status === 'ABSENT' ? (
                                  <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef444450' }}>
                                    {isAr ? 'غائب' : 'Absent'}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {isAr ? 'لم ترصد بعد' : 'Not recorded'}
                                  </span>
                                )}
                              </td>
                              <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                {record?.notes || sess.notes || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
