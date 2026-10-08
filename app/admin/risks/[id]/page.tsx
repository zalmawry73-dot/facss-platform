import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, CAPABILITIES, getUserCapabilities } from '@/lib/rbac';
import RiskDetailManager from '@/components/admin/RiskDetailManager';

interface AdminRiskDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: AdminRiskDetailPageProps) {
  const risk = await prisma.operationalRisk.findUnique({
    where: { id: params.id },
    select: { riskNumber: true, title: true },
  });

  return {
    title: risk ? `${risk.riskNumber} - ${risk.title} | سجل المخاطر` : 'تفاصيل الخطر التشغيلي',
  };
}

export default async function AdminRiskDetailPage({ params }: AdminRiskDetailPageProps) {
  const session = await getCurrentUser(true);
  if (!session) {
    redirect(`/login?redirect=/admin/risks/${params.id}`);
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

  const risk = await prisma.operationalRisk.findUnique({
    where: { id: params.id },
    include: {
      incident: {
        select: {
          id: true,
          incidentNumber: true,
          category: true,
          status: true,
          governorate: true,
          district: true,
          incidentDate: true,
          redactedVersions: {
            where: { isCurrent: true },
            select: {
              redactedTitleAr: true,
              redactedTitleEn: true,
              safeAreaScopeAr: true,
            },
          },
        },
      },
      mitigations: {
        orderBy: { createdAt: 'desc' },
      },
      assessments: {
        orderBy: { assessedAt: 'desc' },
      },
      createdBy: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  if (!risk) {
    notFound();
  }

  const canManage = isSuperAdmin || userCaps.includes(CAPABILITIES.MANAGE_RISK_REGISTER);
  const canAssess = isSuperAdmin || canManage || userCaps.includes(CAPABILITIES.ASSESS_RISK);
  const canViewIncidents =
    isSuperAdmin ||
    userCaps.includes(CAPABILITIES.VERIFY_INCIDENT) ||
    userCaps.includes(CAPABILITIES.ANALYZE_INCIDENT);

  return (
    <div>
      <RiskDetailManager
        risk={JSON.parse(JSON.stringify(risk))}
        currentUser={{
          id: session.userId,
          fullName: session.fullName,
          role: session.role,
          canManage,
          canAssess,
          canViewIncidents,
        }}
      />
    </div>
  );
}
