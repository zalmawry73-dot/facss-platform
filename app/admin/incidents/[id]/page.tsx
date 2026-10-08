import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, canAccessRedactedIncident } from '@/lib/rbac';
import IncidentDetailManager from '@/components/admin/IncidentDetailManager';

interface Props {
  params: { id: string };
}

export const metadata = {
  title: 'ملف وتفاصيل البلاغ الميداني | المركز المتكامل لخدمات الأمن والسلامة',
};

export default async function IncidentDetailPage({ params }: Props) {
  const session = await getCurrentUser(true);
  if (!session) {
    redirect(`/login?redirect=/admin/incidents/${params.id}`);
  }

  // Hard deny for focal point, client, trainee
  if (
    session.role === ROLES.FIELD_FOCAL_POINT ||
    session.role === ROLES.CLIENT ||
    session.role === ROLES.TRAINEE
  ) {
    redirect('/admin?error=unauthorized');
  }

  const isSuperAdmin = session.role === ROLES.SUPER_ADMIN;

  // If not SUPER_ADMIN, check Triple-Gate
  if (!isSuperAdmin) {
    const gate = await canAccessRedactedIncident(session, params.id);
    if (!gate.authorized) {
      redirect('/admin/incidents?error=forbidden');
    }
  }

  return (
    <div>
      <IncidentDetailManager
        incidentId={params.id}
        currentUserRole={session.role}
        currentUserId={session.userId}
      />
    </div>
  );
}
