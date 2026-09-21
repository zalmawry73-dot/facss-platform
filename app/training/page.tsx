import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getTranslation, type Locale } from '@/lib/i18n';
import {
  GraduationCap,
  Clock,
  MapPin,
  Users,
  Award,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const revalidate = 0;

export default async function TrainingPage() {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const t = getTranslation(locale);
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const courses = await prisma.course.findMany({
    where: { status: 'OPEN' },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      {/* Banner */}
      <section
        style={{
          paddingBlock: '4rem',
          background: 'linear-gradient(180deg, var(--facss-green-950) 0%, var(--facss-green-900) 100%)',
          borderBottom: '1px solid rgba(201, 162, 39, 0.25)',
          textAlign: 'center',
          color: '#FFFFFF',
        }}
      >
        <div className="container">
          <span className="section-tag">{t.trainingAcademy}</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem' }}>
            {isAr ? 'التدريب وبناء القدرات لسلامة العاملين في الميدان' : 'Field Safety & Humanitarian Capacity Building'}
          </h1>
          <p style={{ color: 'var(--text-on-dark-muted)', fontSize: '1.1rem', maxWidth: '820px', marginInline: 'auto', lineHeight: 1.75 }}>
            {isAr
              ? 'برامج تدريبية وتطبيقية متخصصة تهدف إلى رفع جاهزية الكوادر الميدانية والمنظمات الإنسانية في مجالات إدارة المخاطر، إجراءات السلامة الشخصية، التفاوض لتسهيل الوصول، والإسعافات النفسية الأولية.'
              : 'Specialized training curricula dedicated to enhancing field personnel and humanitarian agency readiness in operational risk management, safety protocols, access negotiation, and psychological first aid.'}
          </p>
        </div>
      </section>

      {/* Courses Catalog */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">
              {isAr ? 'البرامج المتاحة حالياً للتسجيل' : 'Currently Open Programs'}
            </span>
            <h2 className="section-title">
              {isAr ? 'برامج التدريب وبناء القدرات الميدانية' : 'Field Training & Capacity Building Programs'}
            </h2>
            <p className="section-subtitle">
              {isAr
                ? 'شهادات إتمام وتأهيل عملي مبنية على محاكاة التحديات الميدانية الواقعية'
                : 'Applied completion credentials designed around practical field context scenarios.'}
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', marginInline: 'auto' }}>
              <GraduationCap size={44} style={{ color: 'var(--text-muted)', marginInline: 'auto', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {isAr ? 'لا توجد برامج تدريبية مفتوحة للتسجيل حالياً' : 'No training programs currently open for registration'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {isAr 
                  ? 'يتم الإعلان عن البرامج التدريبية الميدانية وورش بناء القدرات فور فتح باب التسجيل واعتماد الجدول الزمني.' 
                  : 'New field training modules and capacity-building workshops will be announced upon schedule confirmation.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.75rem' }}>
              {courses.map((course) => {
                const catTitle = isAr ? course.category.titleAr : (course.category.titleEn || course.category.titleAr);
                const title = isAr ? course.titleAr : (course.titleEn || course.titleAr);
                const subtitle = isAr ? course.titleEn : course.titleAr;
                const desc = isAr ? course.descriptionAr : (course.descriptionEn || course.descriptionAr);
                const reqs = isAr ? course.requirementsAr : (course.requirementsEn || course.requirementsAr);

                return (
                  <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span className="badge badge-gold">{catTitle}</span>
                        <span className="badge badge-green">
                          {isAr ? 'متاح للتسجيل' : 'Open for Registration'}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                        {title}
                      </h3>
                      {subtitle && (
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--facss-gold-700)', fontWeight: 600, marginBottom: '0.85rem' }}>
                          {subtitle}
                        </h4>
                      )}

                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                        {desc}
                      </p>

                      {/* Course Details Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'var(--surface-sunken)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <Clock size={16} style={{ color: 'var(--facss-gold-600)' }} />
                          <span>{course.duration}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <MapPin size={16} style={{ color: 'var(--facss-gold-600)' }} />
                          <span>{course.location}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <Users size={16} style={{ color: 'var(--facss-green-700)' }} />
                          <span>{isAr ? `السعة: ${course.capacity} مقعد` : `Capacity: ${course.capacity}`}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <Award size={16} style={{ color: 'var(--facss-green-700)' }} />
                          <span>{t.hasCertificateBadge}</span>
                        </div>
                      </div>

                      {/* Requirements */}
                      {reqs && (
                        <div style={{ marginBottom: '1.2rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--facss-green-900)', display: 'block', marginBottom: '0.3rem' }}>
                            {t.courseRequirements}:
                          </span>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {reqs}
                          </p>
                        </div>
                      )}
                    </div>

                    <div style={{ paddingTop: '1.2rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Link
                        href={`/portal/trainee/courses`}
                        className="btn btn-gold btn-sm"
                        style={{ fontSize: '0.82rem' }}
                      >
                        <span>{t.enrollNow}</span>
                        <ArrowIcon size={14} />
                      </Link>

                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {t.siteTitle}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
