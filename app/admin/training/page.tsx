import React from 'react';
import prisma from '@/lib/prisma';
import { requireCapability, CAPABILITIES } from '@/lib/rbac';
import TrainingManager from '@/components/admin/TrainingManager';
import TrainingRegistrationsSummary, {
  type SerializedTrainingRegistration,
} from '@/components/admin/TrainingRegistrationsSummary';

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
    courseType: c.courseType,
    deliveryMode: c.deliveryMode,
    clientId: c.clientId,
    category: { id: c.category.id, titleAr: c.category.titleAr },
    registrationsCount: c.registrations.length,
  }));

  const serializedRegistrations: SerializedTrainingRegistration[] = registrations.map((reg) => ({
    id: reg.id,
    fullName: reg.fullName,
    courseTitle: reg.course.titleAr,
    phone: reg.phone,
    status: reg.status,
    certificateNumber: reg.certificate?.certificateNumber || null,
    createdAt: reg.createdAt.toISOString(),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TrainingManager
        initialCourses={serializedCourses}
        categories={categories}
      />

      <TrainingRegistrationsSummary registrations={serializedRegistrations} />
    </div>
  );
}
