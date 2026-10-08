'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import StatusBadge from '@/components/StatusBadge';
import { BookOpen, Clock, MapPin, Users, Award, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
  'مركز التدريب الميداني التابع لـ AICSFA - عدن': 'Center Field Training Academy - Aden',
  'قاعات المحاكاة الطبية بمركز AICSFA - عدن': 'Security & Safety Simulation Halls - Aden',
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
    .replace(/مركز التدريب الميداني التابع لـ\s*(AICSFA)?/g, 'Field Training Academy - ')
    .replace(/قاعات المحاكاة الطبية بمركز\s*(AICSFA)?/g, 'Medical Simulation Halls - ')
    .replace(/قاعات المحاكاة بمركز\s*/g, 'Simulation Halls at ')
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

      // Load courses from the training data
      const publicRes = await fetch('/api/training/available-courses');
      if (publicRes.ok) {
        const data = await publicRes.json();
        if (data.success) {
          setCourses(data.courses);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
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
          fullName: '', // Auto-filled from session
          email: '',
          phone: '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isAr ? 'فشلت عملية التسجيل' : 'Registration failed'));
      }

      setFeedback({ 
        type: 'success', 
        message: data.message || (isAr ? 'تم التسجيل بنجاح!' : 'Successfully registered!') 
      });
      setMyRegistrations((prev) => [...prev, { courseId: course.id, status: 'PENDING' }]);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setRegistering(null);
    }
  }

  function getRegistrationForCourse(courseId: string): MyRegistration | undefined {
    return myRegistrations.find((r) => r.courseId === courseId && r.status !== 'REJECTED');
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <Loader2 size={32} style={{ color: 'var(--facss-gold-600)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
          {isAr ? 'جارٍ تحميل الدورات المتاحة...' : 'Loading available courses...'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Feedback */}
      {feedback && (
        <div
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${feedback.type === 'success' ? '#10B981' : '#EF4444'}`,
            color: feedback.type === 'success' ? '#065F46' : '#991B1B',
            fontWeight: 600,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontSize: '0.9rem' }}>{feedback.message}</span>
        </div>
      )}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          {isAr ? 'الدورات التدريبية المتاحة للتسجيل' : 'Available Training Courses for Enrollment'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          {isAr
            ? 'استعرض البرامج والتخصصات الأمنية وسجّل في الدورات القادمة لترقية مهاراتك الميدانية.'
            : 'Explore certified security programs and enroll in upcoming sessions to advance your field competencies.'}
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ color: 'var(--facss-gold-600)', marginInline: 'auto', marginBottom: '1rem', opacity: 0.5 }} />
          <p>{isAr ? 'لا توجد دورات مفتوحة للتسجيل حالياً. تابعنا للمزيد من البرامج القادمة.' : 'No courses currently open for enrollment. Check back soon for new programs.'}</p>
          <Link href="/training" className="btn btn-gold btn-sm" style={{ marginTop: '1rem' }}>
            {isAr ? 'استعراض جميع الدورات' : 'View All Courses'}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
          {courses.map((c) => {
            const myReg = getRegistrationForCourse(c.id);
            const remainingSeats = c.capacity - (c.activeRegistrations || 0);
            const title = isAr ? c.titleAr : (c.titleEn || c.titleAr);
            const categoryName = isAr ? (c.category?.titleAr || 'عام') : (c.category?.titleEn || c.category?.titleAr || 'General');

            return (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                    <span className="badge badge-gold">{categoryName}</span>
                    {remainingSeats > 0 ? (
                      <span className="badge badge-green">
                        {isAr ? `متاح (${remainingSeats} مقعد)` : `Open (${remainingSeats} seats)`}
                      </span>
                    ) : (
                      <span className="badge badge-red">
                        {isAr ? 'مكتمل العدد' : 'Full'}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    {title}
                  </h3>
                  {isAr && (
                    <h4 style={{ fontSize: '0.82rem', color: 'var(--facss-gold-700)', fontWeight: 600, marginBottom: '0.85rem' }}>
                      {c.titleEn}
                    </h4>
                  )}

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                    {isAr ? c.descriptionAr : (c.descriptionEn || c.descriptionAr)}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', padding: '0.85rem', background: 'var(--surface-sunken)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} style={{ color: 'var(--facss-gold-600)' }} />
                      <span>{formatCourseDuration(c.duration, isAr)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={14} style={{ color: 'var(--facss-gold-600)' }} />
                      <span>{formatCourseLocation(c.location, isAr)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Users size={14} style={{ color: 'var(--facss-green-700)' }} />
                      <span>{isAr ? `السعة: ${c.capacity} متدرب` : `Capacity: ${c.capacity}`}</span>
                    </div>
                    {c.hasCertificate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Award size={14} style={{ color: 'var(--facss-green-700)' }} />
                        <span>{isAr ? 'شهادة إتمام' : 'Completion Certificate'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {isAr ? `إشراف: ${c.trainerName}` : `Lead: ${c.trainerName}`}
                  </span>

                  {myReg ? (
                    <StatusBadge type="trainingRegistration" status={myReg.status} locale={locale} />
                  ) : remainingSeats > 0 ? (
                    <button
                      type="button"
                      className="btn btn-gold btn-sm"
                      disabled={registering === c.id}
                      onClick={() => handleRegister(c)}
                    >
                      {registering === c.id 
                        ? (isAr ? 'جارٍ التسجيل...' : 'Enrolling...') 
                        : (isAr ? 'التسجيل في الدورة' : 'Enroll Now')}
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
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
