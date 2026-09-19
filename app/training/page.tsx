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
  CheckCircle,
  ArrowLeft,
  FileCheck,
  ShieldCheck
} from 'lucide-react';

export const revalidate = 0;

export default async function TrainingPage() {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const t = getTranslation(locale);

  const courses = await prisma.course.findMany({
    where: { status: 'OPEN' },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  const isAr = locale === 'ar';

  return (
    <div>
      {/* Banner */}
      <section
        style={{
          paddingBlock: '4rem',
          background: 'linear-gradient(180deg, var(--facss-green-950) 0%, var(--facss-green-900) 100%)',
          borderBottom: '1px solid rgba(201, 162, 39, 0.25)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <span className="section-tag">{t.trainingAcademy}</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem' }}>
            {isAr ? 'تأهيل الكوادر والشباب في المهن الأمنية' : 'Security Cadre & Youth Professional Training'}
          </h1>
          <p style={{ color: 'var(--facss-ivory-300)', fontSize: '1.1rem', maxWidth: '800px', marginInline: 'auto', lineHeight: 1.7 }}>
            {isAr
              ? 'ضمن رؤيتنا التنموية والمجتمعية، نُؤهل الشباب اليمني لدخول المهن الأمنية والحراسات والدفاع المدني والسلامة بدورات تدريبية متخصصة ومكثفة وفق أفضل الممارسات المهنية'
              : 'As part of our institutional mission, we qualify personnel and youth for security professions, facility guarding, civil defense, and occupational safety with specialized programs.'}
          </p>
        </div>
      </section>

      {/* Courses Catalog */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">
              {isAr ? 'الدورات المتاحة حالياً للتسجيل' : 'Currently Open Courses'}
            </span>
            <h2 className="section-title">
              {isAr ? 'برامج التدريب والتأهيل الميداني' : 'Field Training & Qualification Programs'}
            </h2>
            <p className="section-subtitle">
              {isAr
                ? 'شهادات إتمام وتدريب عملي على أيدي مدربين ذوي خبرة ميدانية'
                : 'Course completion credentials and applied practical training delivered by experienced security instructors.'}
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '600px', marginInline: 'auto' }}>
              <GraduationCap size={44} style={{ color: 'var(--text-muted)', marginInline: 'auto', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {isAr ? 'لا توجد دورات تدريبية مفتوحة للتسجيل حالياً' : 'No training courses currently open for registration'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {isAr ? 'سيتم الإعلان عن البرامج والدورات الجديدة فور فتح باب التسجيل.' : 'New courses and certification programs will be announced upon opening.'}
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
                        <span>{isAr ? `السعة: ${course.capacity} متدرب` : `Capacity: ${course.capacity}`}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <Award size={16} style={{ color: 'var(--facss-green-700)' }} />
                        <span>{isAr ? 'شهادة إتمام وتأهيل' : 'Completion Certificate'}</span>
                      </div>
                    </div>

                    {/* Requirements */}
                    {reqs && (
                      <div style={{ marginBottom: '1.2rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--facss-green-900)', display: 'block', marginBottom: '0.3rem' }}>
                          {isAr ? 'شروط القبول والالتحاق:' : 'Admission & Eligibility Requirements:'}
                        </span>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {reqs}
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{ paddingTop: '1.2rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {isAr ? `إشراف: ${course.trainerName}` : `Instructor: ${course.trainerName}`}
                    </span>

                    <Link href={`/login?redirect=/portal/trainee`} className="btn btn-gold btn-sm">
                      {isAr ? 'التقديم والالتحاق' : 'Apply & Enroll'}
                    </Link>
                  </div>
                </div>
              );
            })}
            </div>
          )}

          {/* Institutional Partnership Notice */}
          <div className="card" style={{ marginTop: '3.5rem', padding: '2rem', textAlign: 'center', background: 'var(--surface-sunken)', border: '1px solid var(--border-color)', borderInlineStart: '4px solid var(--facss-gold-500)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {isAr ? 'الشراكات والمبادرات التنموية والتأهيلية' : 'Institutional Partnerships & Capacity Building'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '820px', marginInline: 'auto', lineHeight: 1.7 }}>
              {isAr
                ? 'يسهم المركز في تنمية المهارات الأمنية والسلامة المهنية للشباب والكوادر العاملة عبر برامج تدريب نوعية ومبادرات تأهيل تلبي المعايير المؤسسية المنظمة.'
                : 'FACSS contributes directly to security and occupational safety capacity building through structured vocational curricula and developmental initiatives meeting rigorous professional criteria.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
