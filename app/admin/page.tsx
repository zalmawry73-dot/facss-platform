import React from 'react';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/rbac';
import { type Locale } from '@/lib/i18n';
import AdminDashboardOverview, {
  type DashboardMetrics,
  type SerializedRequest,
  type SerializedLog,
} from '@/components/admin/AdminDashboardOverview';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Targeted informational metric caching (30s TTL).
 * Eliminates 8 heavy aggregation queries per request while preserving
 * dynamic per-request RBAC, cookie evaluation, and fresh operational lists.
 */
const getCachedDashboardMetrics = unstable_cache(
  async (): Promise<DashboardMetrics> => {
    const [
      newRequestsCount,
      activeRequestsCount,
      pendingRegistrationsCount,
      unreadMessagesCount,
      totalClientsCount,
      totalTraineesCount,
      coursesCount,
      publicationsCount,
    ] = await Promise.all([
      prisma.serviceRequest.count({ where: { status: 'NEW' } }),
      prisma.serviceRequest.count({ where: { status: { in: ['NEW', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS'] } } }),
      prisma.trainingRegistration.count({ where: { status: 'PENDING' } }),
      prisma.contactMessage.count({ where: { status: 'UNREAD' } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'TRAINEE' } }),
      prisma.course.count(),
      prisma.researchPublication.count(),
    ]);

    return {
      newRequestsCount,
      activeRequestsCount,
      pendingRegistrationsCount,
      unreadMessagesCount,
      totalClientsCount,
      totalTraineesCount,
      coursesCount,
      publicationsCount,
    };
  },
  ['admin-dashboard-aggregate-metrics'],
  { revalidate: 30, tags: ['admin-metrics'] }
);

import { calculateExecutiveKpis } from '@/lib/kpi-engine';

export default async function AdminDashboardPage() {
  // Server-side authorization gate - strictly dynamic per request
  await requireStaff('/admin');

  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const isAr = locale === 'ar';

  // Fetch cached informational metrics, operational activity, and executive KPIs in parallel
  const [metrics, recentRequests, recentLogs, initialKpis] = await Promise.all([
    getCachedDashboardMetrics(),
    prisma.serviceRequest.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { service: true }
    }),
    prisma.activityLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
    }),
    calculateExecutiveKpis('30d')
  ]);

  const serializedRequests: SerializedRequest[] = recentRequests.map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    organization: r.organization,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    serviceTitle: isAr ? r.service.titleAr : (r.service.titleEn || r.service.titleAr),
  }));

  const serializedLogs: SerializedLog[] = recentLogs.map((l) => ({
    id: l.id,
    action: l.action,
    details: l.details,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <AdminDashboardOverview
      metrics={metrics}
      recentRequests={serializedRequests}
      recentLogs={serializedLogs}
      initialKpis={initialKpis}
      locale={locale}
    />
  );
}
