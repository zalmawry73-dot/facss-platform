import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, CAPABILITIES, getUserCapabilities } from '@/lib/rbac';
import AdminClientBar from '@/app/admin/AdminClientBar';
import RiskRegisterManager from '@/components/admin/RiskRegisterManager';

export const metadata = {
  title: 'سجل المخاطر التشغيلية الميدانية | مركز عدن الدولي للسلامة',
  description: 'إدارة وتقييم المخاطر التشغيلية الميدانية ومتابعة مصفوفات التخفيف والمعالجة',
};

export default async function AdminRisksPage() {
  const session = await getCurrentUser(true);
  if (!session) {
    redirect('/login?redirect=/admin/risks');
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
  const userCaps = await getUserCapabilities(session.userId, session.role);
  const canViewRisks =
    isSuperAdmin ||
    userCaps.includes(CAPABILITIES.VIEW_RISK_REGISTER) ||
    userCaps.includes(CAPABILITIES.MANAGE_RISK_REGISTER);

  if (!canViewRisks) {
    redirect('/admin?error=forbidden');
  }

  const canManage = isSuperAdmin || userCaps.includes(CAPABILITIES.MANAGE_RISK_REGISTER);
  const canAssess = isSuperAdmin || canManage || userCaps.includes(CAPABILITIES.ASSESS_RISK);

  return (
    <div className="container-wide" style={{ padding: '2rem 1.5rem 4rem' }}>
      <AdminClientBar user={{ fullName: session.fullName, role: session.role }} />
      <RiskRegisterManager
        currentUser={{
          id: session.userId,
          fullName: session.fullName,
          role: session.role,
          canManage,
          canAssess,
        }}
      />
    </div>
  );
}
