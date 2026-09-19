import React from 'react';
import prisma from '@/lib/prisma';
import { requireCapability, CAPABILITIES } from '@/lib/rbac';
import TrainingManager from '@/components/admin/TrainingManager';

export const revalidate = 0;

export default async function AdminTrainingManagerPage() {
  // Layer 3 Authorization: Enforce Granular Capability
  await requireCapability(CAPABILITIES.MANAGE_TRAINING, '/admin');

  const [courses, categories, registrations] = await Promise.all([
    prisma.course.findMany({
      include: {
        category: { select: { id: true, titleAr: true, titleEn: true } },
        registrations: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.courseCategory.findMany({
      select: { id: true, titleAr: true, titleEn: true },
      orderBy: { titleAr: 'asc' },
    }),
    prisma.trainingRegistration.findMany({
      include: { course: true, certificate: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const serializedCourses = courses.map((c) => ({
    id: c.id,
    titleAr: c.titleAr,
    titleEn: c.titleEn,
    slug: c.slug,
    descriptionAr: c.descriptionAr,
    descriptionEn: c.descriptionEn,
    trainerName: c.trainerName,
    startDate: c.startDate ? c.startDate.toISOString() : null,
    endDate: c.endDate ? c.endDate.toISOString() : null,
    duration: c.duration,
    location: c.location,
    capacity: c.capacity,
    status: c.status,
    categoryId: c.categoryId,
    hasCertificate: c.hasCertificate,
    category: { id: c.category.id, titleAr: c.category.titleAr },
    registrationsCount: c.registrations.length,
  }));

  return (
    <div>
      <TrainingManager
        initialCourses={serializedCourses}
        categories={categories}
      />

      {/* Trainees Applications Summary */}
      <div className="card" style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginBottom: '1.2rem' }}>
          أحدث طلبات الالتحاق بالبرامج التدريبية
        </h3>

        {registrations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
            لا توجد طلبات تسجيل مسجلة حالياً.
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم المتدرب</th>
                  <th>الدورة</th>
                  <th>الهاتف</th>
                  <th>الحالة</th>
                  <th>الشهادة الصادرة</th>
                  <th>تاريخ التقديم</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id}>
                    <td style={{ fontWeight: 700, color: '#FFF' }}>{reg.fullName}</td>
                    <td>{reg.course.titleAr}</td>
                    <td>{reg.phone}</td>
                    <td>
                      <span className={`badge ${reg.status === 'COMPLETED' ? 'badge-green' : 'badge-gold'}`}>
                        {reg.status}
                      </span>
                    </td>
                    <td>
                      {reg.certificate ? (
                        <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                          {reg.certificate.certificateNumber}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>قيد الاختبار</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(reg.createdAt).toLocaleDateString('ar-YE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

