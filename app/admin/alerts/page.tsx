import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, isStaffRole } from '@/lib/rbac';
import AlertsManager from '@/components/admin/AlertsManager';

export const dynamic = 'force-dynamic';

export default async function AdminAlertsPage() {
  const session = await getCurrentUser(true);
  if (!session || !session.userId) {
    redirect('/login?redirect=%2Fadmin%2Falerts');
  }

  if (!isStaffRole(session.role)) {
    redirect('/portal/client');
  }

  return <AlertsManager currentUserRole={session.role} currentUserId={session.userId} />;
}
