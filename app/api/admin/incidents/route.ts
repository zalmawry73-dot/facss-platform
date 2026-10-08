import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, CAPABILITIES, getUserCapabilities } from '@/lib/rbac';
import { getSlaConfig, calculateIncidentSlaStatus } from '@/lib/sla-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح: يلزم تسجيل الدخول' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, isActive: true, role: true },
    });

    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ error: 'الحساب غير نشط' }, { status: 403 });
    }

    // Role and capability resolution
    const isSuperAdmin = session.role === ROLES.SUPER_ADMIN;
    const userCaps = await getUserCapabilities(session.userId, session.role);
    const hasIncidentCap =
      userCaps.includes(CAPABILITIES.VERIFY_INCIDENT) ||
      userCaps.includes(CAPABILITIES.ANALYZE_INCIDENT) ||
      userCaps.includes(CAPABILITIES.DRAFT_INCIDENT_ALERT);

    // Hard deny for FIELD_FOCAL_POINT, CLIENT, TRAINEE from admin incidents list
    if (session.role === ROLES.FIELD_FOCAL_POINT || session.role === ROLES.CLIENT || session.role === ROLES.TRAINEE) {
      return NextResponse.json(
        { error: 'غير مصرح: لا يملك هذا الدور صلاحية استعراض قائمة البلاغات الإدارية' },
        { status: 403 }
      );
    }

    if (!isSuperAdmin && !hasIncidentCap) {
      return NextResponse.json(
        { error: 'غير مصرح: يتطلب استعراض البلاغات صلاحية معتمدة للتحقق أو التحليل' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const categoryFilter = searchParams.get('category');
    const priorityFilter = searchParams.get('priority');
    const governorateFilter = searchParams.get('governorate');
    const quickFilter = searchParams.get('quickFilter');
    const slaFilter = searchParams.get('slaFilter');

    const slaConfig = await getSlaConfig();
    const now = new Date();

    // Case 1: SUPER_ADMIN can view all incidents
    if (isSuperAdmin) {
      const whereClause: any = {};
      if (statusFilter && statusFilter !== 'ALL') whereClause.status = statusFilter;
      if (categoryFilter && categoryFilter !== 'ALL') whereClause.category = categoryFilter;
      if (priorityFilter && priorityFilter !== 'ALL') whereClause.priority = priorityFilter;
      if (governorateFilter && governorateFilter !== 'ALL') whereClause.governorate = governorateFilter;

      // Handle Database-level Quick Filters where possible
      if (quickFilter === 'OPEN') {
        whereClause.status = { notIn: ['CLOSED', 'ARCHIVED'] };
      } else if (quickFilter === 'CRITICAL') {
        whereClause.priority = 'CRITICAL_EMERGENCY';
      } else if (quickFilter === 'CLOSED') {
        whereClause.status = { in: ['CLOSED', 'ARCHIVED'] };
      } else if (quickFilter === 'ESCALATED') {
        whereClause.isEscalated = true;
      }

      const rawIncidents = await prisma.incident.findMany({
        where: whereClause,
        include: {
          createdBy: { select: { id: true, fullName: true, role: true, organization: true } },
          redactedVersions: {
            where: { isCurrent: true },
            select: { id: true, redactedTitleAr: true, isApproved: true, createdAt: true },
          },
          assignments: {
            where: { isActive: true },
            include: { assignedTo: { select: { id: true, fullName: true, email: true } } },
          },
          _count: {
            select: { verifications: true, attachments: true, alerts: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      let formattedIncidents = rawIncidents.map((inc) => {
        const slaCalc = calculateIncidentSlaStatus(inc, slaConfig, now);
        return {
          id: inc.id,
          incidentNumber: inc.incidentNumber,
          category: inc.category,
          priority: inc.priority,
          status: inc.status,
          governorate: inc.governorate,
          district: inc.district,
          incidentDate: inc.incidentDate,
          createdAt: inc.createdAt,
          createdBy: inc.createdBy,
          hasOriginal: true,
          firstResponseAt: inc.firstResponseAt,
          dueAt: slaCalc.dueAt,
          closedAt: inc.closedAt,
          slaTargetMinutes: slaCalc.slaTargetMinutes,
          slaStatus: slaCalc.status,
          isEscalated: inc.isEscalated,
          escalatedAt: inc.escalatedAt,
          escalationReason: inc.escalationReason,
          slaDetails: {
            elapsedMinutes: slaCalc.elapsedMinutes,
            remainingMinutes: slaCalc.remainingMinutes,
            isBreached: slaCalc.isBreached,
            isApproachingBreach: slaCalc.isApproachingBreach,
            isClosed: slaCalc.isClosed,
          },
          currentRedacted: inc.redactedVersions[0] || null,
          activeAssignments: inc.assignments,
          counts: inc._count,
        };
      });

      // Post-calculation filters (for dynamically computed SLA status / unassigned)
      if (quickFilter === 'UNASSIGNED') {
        formattedIncidents = formattedIncidents.filter((inc) => inc.activeAssignments.length === 0);
      } else if (quickFilter === 'APPROACHING_BREACH') {
        formattedIncidents = formattedIncidents.filter((inc) => inc.slaStatus === 'APPROACHING_BREACH');
      } else if (quickFilter === 'BREACHED') {
        formattedIncidents = formattedIncidents.filter(
          (inc) => inc.slaStatus === 'BREACHED' || inc.slaStatus === 'CLOSED_BREACHED'
        );
      }

      if (slaFilter && slaFilter !== 'ALL') {
        formattedIncidents = formattedIncidents.filter((inc) => inc.slaStatus === slaFilter);
      }

      return NextResponse.json({
        success: true,
        isSuperAdmin: true,
        incidents: formattedIncidents,
      });
    }

    // Case 2: Staff Member - STRICT RULE: Can view ONLY assigned incidents with active assignment!
    const staffAssignments = await prisma.incidentAssignment.findMany({
      where: {
        assignedToUserId: session.userId,
        isActive: true,
        revokedAt: null,
      },
      include: {
        incident: {
          include: {
            redactedVersions: {
              where: { isCurrent: true, isApproved: true }, // Approved redacted versions ONLY!
              select: {
                id: true,
                redactedTitleAr: true,
                safeAreaScopeAr: true,
                isApproved: true,
                createdAt: true,
              },
            },
            _count: {
              select: { verifications: true, attachments: true },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    const staffIncidents = staffAssignments.map((asgn) => {
      const inc = asgn.incident;
      return {
        id: inc.id,
        incidentNumber: inc.incidentNumber,
        category: inc.category,
        priority: inc.priority,
        status: inc.status,
        governorate: inc.governorate,
        district: inc.district,
        incidentDate: inc.incidentDate,
        createdAt: inc.createdAt,
        // Staff never sees who submitted or raw original
        myAssignment: {
          id: asgn.id,
          roleScope: asgn.roleScope,
          instructions: asgn.instructions,
          assignedAt: asgn.assignedAt,
        },
        currentRedacted: inc.redactedVersions[0] || null,
        counts: inc._count,
      };
    });

    return NextResponse.json({
      success: true,
      isSuperAdmin: false,
      incidents: staffIncidents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
