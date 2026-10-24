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

import { getContentBlock } from '@/lib/content';

export const revalidate = 0;

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

export default async function TrainingPage() {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const t = getTranslation(locale);
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [courses, bannerBlock, catalogHeaderBlock] = await Promise.all([
    prisma.course.findMany({
      where: { status: 'OPEN', courseType: 'PUBLIC' },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
    getContentBlock('page_banners', 'banner_training'),
    getContentBlock('training_page', 'training_catalog_header'),
  ]);

  let bannerMeta: any = {};
  try { bannerMeta = bannerBlock?.metadata ? JSON.parse(bannerBlock.metadata) : {}; } catch {}

  const bannerTag = (isAr ? bannerMeta.tagAr : bannerMeta.tagEn) || t.trainingAcademy;
  const bannerTitle = (isAr ? (bannerBlock?.titleAr || bannerBlock?.titleEn) : (bannerBlock?.titleEn || bannerBlock?.titleAr)) || (isAr ? 'التدريب وبناء القدرات والجاهزية الميدانية' : 'Field Safety & Institutional Capacity Building');
  const bannerDesc = (isAr ? (bannerBlock?.descriptionAr || bannerBlock?.descriptionEn) : (bannerBlock?.descriptionEn || bannerBlock?.descriptionAr)) || (isAr
    ? 'برامج تدريبية وتطبيقية متخصصة تهدف إلى رفع جاهزية الكوادر الميدانية والمنظمات الإنسانية والشركاء في مجالات إدارة المخاطر، إجراءات السلامة الشخصية، التفاوض لتسهيل الوصول، والإسعافات الأولية.'
    : 'Specialized training curricula dedicated to enhancing field personnel and organizational readiness in operational risk management, safety protocols, access negotiation, and first aid.');

  let catalogMeta: any = {};
  try { catalogMeta = catalogHeaderBlock?.metadata ? JSON.parse(catalogHeaderBlock.metadata) : {}; } catch {}

  const catalogTag = (isAr ? catalogMeta.tagAr : catalogMeta.tagEn) || (isAr ? 'البرامج المتاحة حالياً للتسجيل' : 'Currently Open Programs');
  const catalogTitle = (isAr ? (catalogHeaderBlock?.titleAr || catalogHeaderBlock?.titleEn) : (catalogHeaderBlock?.titleEn || catalogHeaderBlock?.titleAr)) || (isAr ? 'برامج التدريب وبناء القدرات الميدانية' : 'Field Training & Capacity Building Programs');
  const catalogSubtitle = (isAr ? (catalogHeaderBlock?.descriptionAr || catalogHeaderBlock?.descriptionEn) : (catalogHeaderBlock?.descriptionEn || catalogHeaderBlock?.descriptionAr)) || (isAr
    ? 'شهادات إتمام وتأهيل عملي مبنية على محاكاة التحديات الميدانية الواقعية'
    : 'Applied completion credentials designed around practical field context scenarios.');

  return (
    <div>
      {/* Banner */}
      <section className="page-header-institutional">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-badge-pill" style={{ marginBottom: '1.25rem' }}>
            <GraduationCap size={15} style={{ color: 'var(--color-gold-400)' }} />
            <span>{bannerTag}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.75rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
            {bannerTitle}
          </h1>
          <p style={{ color: 'var(--text-on-dark-muted)', fontSize: '1.05rem', maxWidth: '820px', marginInline: 'auto', lineHeight: 1.75 }}>
            {bannerDesc}
          </p>
        </div>
      </section>

      {/* Courses Catalog */}
      <section className="section" style={{ backgroundColor: 'var(--surface-bg)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">
              {catalogTag}
            </span>
            <h2 className="section-title">
              {catalogTitle}
            </h2>
            <p className="section-subtitle">
              {catalogSubtitle}
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="card-institutional" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', marginInline: 'auto' }}>
              <GraduationCap size={44} style={{ color: 'var(--text-muted)', marginInline: 'auto', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {isAr ? 'لا توجد برامج تدريبية مفتوحة للتسجيل حالياً' : 'No training programs currently open for registration'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7 }}>
                {isAr 
                  ? 'يتم الإعلان عن البرامج التدريبية الميدانية وورش بناء القدرات فور فتح باب التسجيل واعتماد الجدول الزمني.' 
                  : 'New field training modules and capacity-building workshops will be announced upon schedule confirmation.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.75rem' }}>
              {courses.map((course) => {
                const catTitle = isAr ? course.category.titleAr : (course.category.titleEn || course.category.titleAr);
                const title = isAr ? course.titleAr : (course.titleEn || course.titleAr);
                const subtitle = isAr ? course.titleEn : null;
                const desc = isAr ? course.descriptionAr : (course.descriptionEn || course.descriptionAr);
                const reqs = isAr ? course.requirementsAr : (course.requirementsEn || null);

                return (
                  <div key={course.id} className="card-institutional" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--color-gold-500)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
                        <span className="badge badge-gold">{catTitle}</span>
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <CheckCircle2 size={12} />
                          <span>{isAr ? 'متاح للتسجيل' : 'Open for Registration'}</span>
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.45rem', lineHeight: 1.4 }}>
                        {title}
                      </h3>
                      {subtitle && (
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--color-gold-700)', fontWeight: 600, marginBottom: '0.85rem' }}>
                          {subtitle}
                        </h4>
                      )}

                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.35rem' }}>
                        {desc}
                      </p>

                      {/* Course Details Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', background: 'var(--surface-sunken)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                          <Clock size={16} style={{ color: 'var(--color-gold-700)', flexShrink: 0 }} />
                          <span>{formatCourseDuration(course.duration, isAr)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                          <MapPin size={16} style={{ color: 'var(--color-gold-700)', flexShrink: 0 }} />
                          <span>{formatCourseLocation(course.location, isAr)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                          <Users size={16} style={{ color: 'var(--color-primary-800)', flexShrink: 0 }} />
                          <span>{isAr ? `السعة: ${course.capacity} مقعد` : `Capacity: ${course.capacity}`}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                          <Award size={16} style={{ color: 'var(--color-primary-800)', flexShrink: 0 }} />
                          <span>{t.hasCertificateBadge}</span>
                        </div>
                      </div>

                      {/* Requirements */}
                      {reqs && (
                        <div style={{ marginBottom: '1.35rem', padding: '0.75rem', background: 'rgba(181, 146, 84, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(181, 146, 84, 0.2)' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-gold-700)', display: 'block', marginBottom: '0.25rem' }}>
                            {t.courseRequirements}:
                          </span>
                          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                            {reqs}
                          </p>
                        </div>
                      )}
                    </div>

                    <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <Link
                        href={`/portal/trainee/courses`}
                        className="btn btn-gold btn-sm"
                        style={{ fontSize: '0.85rem' }}
                      >
                        <span>{t.enrollNow}</span>
                        <ArrowIcon size={14} />
                      </Link>

                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {t.siteAcronym}
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
