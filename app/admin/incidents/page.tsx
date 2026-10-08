import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, CAPABILITIES, getUserCapabilities } from '@/lib/rbac';
import IncidentsManager from '@/components/admin/IncidentsManager';

export const metadata = {
  title: 'إدارة البلاغات الميدانية والتحقق | المركز المتكامل لخدمات الأمن والسلامة',
};

export default async function AdminIncidentsPage() {
  const session = await getCurrentUser(true);
  if (!session) {
    redirect('/login?redirect=/admin/incidents');
  }

  // Hard deny for focal point, client, trainee
  if (
    session.role === ROLES.FIELD_FOCAL_POINT ||
    session.role === ROLES.CLIENT ||
    session.role === ROLES.TRAINEE
  ) {
    redirect('/admin?error=unauthorized');
  }

  const userCaps = await getUserCapabilities(session.userId, session.role);
  const isSuperAdmin = session.role === ROLES.SUPER_ADMIN;
  const canViewIncidents =
    isSuperAdmin ||
    userCaps.includes(CAPABILITIES.VERIFY_INCIDENT) ||
    userCaps.includes(CAPABILITIES.ANALYZE_INCIDENT);

  if (!canViewIncidents) {
    redirect('/admin?error=forbidden');
  }

  return (
    <div>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>جارٍ تحميل منظومة البلاغات...</div>}>
        <IncidentsManager
          currentUserRole={session.role}
          currentUserId={session.userId}
        />
      </Suspense>
    </div>
  );
}
