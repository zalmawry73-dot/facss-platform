'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import StatusBadge from '@/components/StatusBadge';
import { BookOpen, Clock, MapPin, Users, Award, CheckCircle2, AlertCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

interface Course {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn?: string;
  duration: string;
  location: string;
  capacity: number;
  status: string;
  trainerName: string;
  startDate: string | null;
  hasCertificate: boolean;
  category: { titleAr: string; titleEn?: string };
  _count?: { registrations: number };
  activeRegistrations?: number;
}

const DURATION_TRANSLATIONS: Record<string, string> = {
  '4 أيام (32 ساعة تدريبية تطبيقية)': '4 Days (32 Practical Training Hours)',
  '3 أيام (24 ساعة تدريبية)': '3 Days (24 Training Hours)',
  '5 أيام (40 ساعة تدريبية)': '5 Days (40 Training Hours)',
  'أسبوعان (60 ساعة تدريبية)': '2 Weeks (60 Training Hours)',
};

const LOCATION_TRANSLATIONS: Record<string, string> = {
  'مركز التدريب والتأهيل الميداني - عدن': 'Field Training & Capacity Center - Aden',
  'قاعات المحاكاة بمركز الأمن والسلامة - عدن': 'Security & Safety Simulation Halls - Aden',
  'مركز التدريب الميداني التابع للمركز - عدن': 'Center Field Training Academy - Aden',
  'مقر المركز - عدن': 'Center HQ - Aden',
  'قاعة المؤتمرات الرئيسية': 'Main Conference Hall',
  'ميدان التدريب التكتيكي - عدن': 'Tactical Training Grounds - Aden',
};

function formatCourseDuration(val: string, isAr: boolean): string {
  if (isAr) return val;
  if (DURATION_TRANSLATIONS[val]) return DURATION_TRANSLATIONS[val];
  return val
    .replace(/(\d+)\s*أيام/g, '$1 Days')
    .replace(/(\d+)\s*يوم/g, '$1 Day')
    .replace(/(\d+)\s*ساعة تدريبية تطبيقية/g, '$1 Practical Training Hours')
    .replace(/(\d+)\s*ساعة تدريبية/g, '$1 Training Hours')
    .replace(/(\d+)\s*ساعة/g, '$1 Hours')
    .replace(/أسبوعان/g, '2 Weeks')
    .replace(/(\d+)\s*أسابيع/g, '$1 Weeks');
}

function formatCourseLocation(val: string, isAr: boolean): string {
  if (isAr) return val;
  if (LOCATION_TRANSLATIONS[val]) return LOCATION_TRANSLATIONS[val];
  return val
    .replace(/مركز التدريب الميداني التابع للمركز/g, 'Center Field Training Academy')
    .replace(/قاعات المحاكاة بمركز الأمن والسلامة/g, 'Security & Safety Simulation Halls')
    .replace(/قاعات المحاكاة\s*/g, 'Simulation Halls ')
    .replace(/ميدان التدريب التكتيكي\s*/g, 'Tactical Training Grounds ')
    .replace(/مركز تدريب\s*/g, 'Training Center ')
    .replace(/بمركز\s*/g, 'at ')
    .replace(/عدن/g, 'Aden');
}

interface MyRegistration {
  courseId: string;
  status: string;
}

export default function TraineeCoursesPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [courses, setCourses] = useState<Course[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<MyRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load my registrations
      const myRegsRes = await fetch('/api/training/my-registrations');
      const myRegsData = await myRegsRes.json();

      if (myRegsData.success) {
        setMyRegistrations(
          myRegsData.registrations.map((r: any) => ({
            courseId: r.course?.id || r.courseId,
            status: r.status,
          }))
        );
      }

      // Load available courses
      const coursesRes = await fetch('/api/training/available-courses');
      const coursesData = await coursesRes.json();

      if (coursesData.success) {
        setCourses(coursesData.courses);
      }
    } catch (err) {
      console.error('Error loading training data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(course: Course) {
    setRegistering(course.id);
    setFeedback(null);

    try {
      const res = await fetch('/api/training/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: 'success',
          message: isAr
            ? `تم تقديم طلب التسجيل بنجاح في دورة: ${course.titleAr}. سيتم إشعارك فور المراجعة والاعتماد.`
            : `Registration submitted successfully for: ${course.titleEn || course.titleAr}. You will be notified upon review.`,
        });
        setMyRegistrations([...myRegistrations, { courseId: course.id, status: 'PENDING' }]);
      } else {
        setFeedback({
          type: 'error',
          message: data.error || (isAr ? 'فشل التسجيل في الدورة' : 'Enrollment failed'),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || (isAr ? 'حدث خطأ أثناء إرسال طلب التسجيل' : 'An error occurred during enrollment'),
      });
    } finally {
      setRegistering(null);
    }
  }

  function getRegistrationForCourse(courseId: string): MyRegistration | undefined {
    return myRegistrations.find((r) => r.courseId === courseId && r.status !== 'REJECTED');
  }

  if (loading) {
    return (
      <div className="portal-card" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <Loader2 size={36} style={{ color: 'var(--color-gold-600)', animation: 'spin 1s linear infinite', marginInline: 'auto', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          {isAr ? 'جارٍ تحميل البرامج التدريبية المتاحة...' : 'Loading available courses...'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Feedback banner */}
      {feedback && (
        <div
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: feedback.type === 'success' ? 'rgba(21, 128, 61, 0.1)' : 'rgba(220, 38, 38, 0.1)',
            border: `1.5px solid ${feedback.type === 'success' ? '#15803D' : '#DC2626'}`,
            color: feedback.type === 'success' ? '#15803D' : '#DC2626',
            fontWeight: 700,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontSize: '0.88rem' }}>{feedback.message}</span>
        </div>
      )}

      <div className="portal-card" style={{ marginBottom: '1.75rem' }}>
        <div className="portal-card-header">
          <div>
            <h2 className="portal-card-title">
              <BookOpen size={22} style={{ color: 'var(--color-gold-600)' }} />
              <span>{isAr ? 'دليل البرامج والدورات التدريبية المفتوحة' : 'Available Training Courses for Enrollment'}</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: '0.25rem 0 0' }}>
              {isAr
                ? 'استعرض البرامج والتخصصات الميدانية وسجّل في الدورات المفتوحة لترقية كفاءتك المهنية.'
                : 'Explore certified security programs and enroll in upcoming sessions to advance your field competencies.'}
            </p>
          </div>
          <Link href="/portal/trainee" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>{isAr ? 'لوحة المتدرب' : 'Dashboard'}</span>
            <ArrowIcon size={14} />
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="portal-empty-state">
          <BookOpen size={46} style={{ color: 'var(--color-gold-500)', marginInline: 'auto', marginBottom: '0.85rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            {isAr ? 'لا توجد دورات مفتوحة للتسجيل حالياً' : 'No courses currently open for enrollment'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '440px', marginInline: 'auto', marginBottom: '1.25rem' }}>
            {isAr ? 'يتم تحديث جدول الدورات دورياً. تفقد هذه الصفحة لاحقاً أو استعرض الأرشيف.' : 'New courses are scheduled regularly. Check back soon for new programs.'}
          </p>
          <Link href="/training" className="btn btn-gold btn-sm">
            {isAr ? 'استعراض الدليل الأكاديمي العام' : 'View Full Catalog'}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))', gap: '1.5rem' }}>
          {courses.map((c) => {
            const myReg = getRegistrationForCourse(c.id);
            const remainingSeats = c.capacity - (c.activeRegistrations || 0);
            const title = isAr ? c.titleAr : (c.titleEn || c.titleAr);
            const categoryName = isAr ? (c.category?.titleAr || 'عام') : (c.category?.titleEn || c.category?.titleAr || 'General');

            return (
              <div 
                key={c.id} 
                className="portal-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  padding: '1.4rem',
                  marginBottom: 0
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span 
                      style={{ 
                        fontSize: '0.74rem', 
                        fontWeight: 700, 
                        padding: '0.15rem 0.55rem', 
                        borderRadius: '4px',
                        background: 'rgba(181, 146, 84, 0.12)', 
                        color: 'var(--color-gold-700)', 
                        border: '1px solid rgba(181, 146, 84, 0.3)'
                      }}
                    >
                      {categoryName}
                    </span>
                    {remainingSeats > 0 ? (
                      <span 
                        style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 700, 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: '4px',
                          background: 'rgba(21, 128, 61, 0.1)', 
                          color: '#15803D', 
                          border: '1px solid rgba(21, 128, 61, 0.25)' 
                        }}
                      >
                        {isAr ? `متاح (${remainingSeats} مقعد)` : `Open (${remainingSeats} seats)`}
                      </span>
                    ) : (
                      <span 
                        style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 700, 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: '4px',
                          background: 'rgba(220, 38, 38, 0.1)', 
                          color: '#DC2626', 
                          border: '1px solid rgba(220, 38, 38, 0.25)' 
                        }}
                      >
                        {isAr ? 'مكتمل العدد' : 'Full'}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem', lineHeight: 1.4 }}>
                    {title}
                  </h3>
                  {isAr && c.titleEn && (
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--color-gold-700)', fontWeight: 600, marginBottom: '0.85rem' }}>
                      {c.titleEn}
                    </h4>
                  )}

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.2rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {isAr ? c.descriptionAr : (c.descriptionEn || c.descriptionAr)}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', padding: '0.85rem', background: 'var(--surface-bg)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', border: '1px solid var(--admin-card-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} style={{ color: 'var(--color-gold-600)' }} />
                      <span>{formatCourseDuration(c.duration, isAr)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={14} style={{ color: 'var(--color-gold-600)' }} />
                      <span>{formatCourseLocation(c.location, isAr)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Users size={14} style={{ color: 'var(--color-primary-900)' }} />
                      <span>{isAr ? `السعة: ${c.capacity}` : `Cap: ${c.capacity}`}</span>
                    </div>
                    {c.hasCertificate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Award size={14} style={{ color: '#15803D' }} />
                        <span>{isAr ? 'شهادة إتمام' : 'Certificate'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--admin-card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {isAr ? `إشراف: ${c.trainerName}` : `Trainer: ${c.trainerName}`}
                  </span>

                  {myReg ? (
                    <StatusBadge type="trainingRegistration" status={myReg.status} locale={locale} />
                  ) : remainingSeats > 0 ? (
                    <button
                      type="button"
                      className="btn btn-gold btn-sm"
                      disabled={registering === c.id}
                      onClick={() => handleRegister(c)}
                      style={{ fontWeight: 700, padding: '0.4rem 0.95rem' }}
                    >
                      {registering === c.id 
                        ? (isAr ? 'جارٍ التسجيل...' : 'Enrolling...') 
                        : (isAr ? 'التسجيل في الدورة' : 'Enroll Now')}
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {isAr ? 'مكتمل العدد' : 'Full'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
