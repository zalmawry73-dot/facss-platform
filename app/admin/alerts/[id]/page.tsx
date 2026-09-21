import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole } from '@/lib/rbac';
import AlertDetailManager from '@/components/admin/AlertDetailManager';

interface PageProps {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export default async function AdminAlertDetailPage({ params }: PageProps) {
  const session = await getCurrentUser(true);
  if (!session || !session.userId) {
    redirect(`/login?redirect=%2Fadmin%2Falerts%2F${params.id}`);
  }

  if (!isStaffRole(session.role)) {
    redirect('/portal/client');
  }

  return (
    <AlertDetailManager
      alertId={params.id}
      currentUserRole={session.role}
      currentUserId={session.userId}
    />
  );
}
