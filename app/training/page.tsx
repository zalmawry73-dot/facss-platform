import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
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
          paddingBlock: '4.5rem',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(19, 62, 43, 0.6) 0%, rgba(5, 14, 9, 0.95) 80%)',
          borderBottom: '1px solid rgba(197, 155, 39, 0.2)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <span className="section-tag">أكاديمية التدريب والتأهيل الأمني</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFF', marginBottom: '1rem' }}>
            تأهيل الكوادر والشباب في المهن الأمنية
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '800px', marginInline: 'auto', lineHeight: 1.7 }}>
            ضمن رؤيتنا التنموية والمجتمعية، نُؤهل الشباب اليمني لدخول المهن الأمنية والحراسات والدفاع المدني والسلامة بدورات معتمدة وفق أرقى المعايير الدولية
          </p>
        </div>
      </section>

      {/* Courses Catalog */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">الدورات المتاحة حالياً للتسجيل</span>
            <h2 className="section-title">برامج التأهيل الميداني المعتمدة</h2>
            <p className="section-subtitle">
              شهادات معتمدة وتدريب عملي على أيدي مدربين معتمدين دولياً
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            {courses.map((course) => (
              <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span className="badge badge-gold">{course.category.titleAr}</span>
                    <span className="badge badge-green">متاح للتسجيل</span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginBottom: '0.5rem' }}>
                    {course.titleAr}
                  </h3>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--color-gold-light)', fontWeight: 600, marginBottom: '1rem' }}>
                    {course.titleEn}
                  </h4>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    {course.descriptionAr}
                  </p>

                  {/* Course Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(5,14,9,0.6)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <Clock size={16} style={{ color: 'var(--color-gold-light)' }} />
                      <span>{course.duration}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <MapPin size={16} style={{ color: 'var(--color-gold-light)' }} />
                      <span>{course.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <Users size={16} style={{ color: 'var(--color-gold-light)' }} />
                      <span>السعة: {course.capacity} متدرب</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <Award size={16} style={{ color: 'var(--color-gold-light)' }} />
                      <span>شهادة معتمدة</span>
                    </div>
                  </div>

                  {/* Requirements */}
                  {course.requirementsAr && (
                    <div style={{ marginBottom: '1.2rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gold-light)', display: 'block', marginBottom: '0.3rem' }}>
                        شروط القبول والالتحاق:
                      </span>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                        {course.requirementsAr}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ paddingTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                    إشراف: {course.trainerName}
                  </span>

                  <Link href={`/login?redirect=/portal/trainee`} className="btn btn-gold btn-sm">
                    التقديم والالتحاق
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Institutional Partnership Notice */}
          <div className="card" style={{ marginTop: '4rem', padding: '2rem', textAlign: 'center', background: 'rgba(11,37,24,0.4)', border: '1px solid rgba(197,155,39,0.3)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF', marginBottom: '0.5rem' }}>
              الشراكات والمبادرات التنموية (AGFUND والجهات المماثلة)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '820px', marginInline: 'auto', lineHeight: 1.7 }}>
              يسهم المركز مباشرة في تنمية المجتمع المدني عبر برامج التمكين الاقتصادي للشباب والخريجين وشراكات فاعلة مع المنظمات الإقليمية والدولية الكافلة للمبادرات التنموية.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
