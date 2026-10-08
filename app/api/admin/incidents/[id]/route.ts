import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, canAccessRedactedIncident } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';
import { getSlaConfig, calculateIncidentSlaStatus } from '@/lib/sla-engine';
import { escalateIncidentInternal } from '@/lib/escalation-engine';

interface RouteContext {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح: يلزم تسجيل الدخول' }, { status: 401 });
    }

    const isSuperAdmin = session.role === ROLES.SUPER_ADMIN;

    // If not SUPER_ADMIN, check Triple-Gate:
    // 1. Active Account
    // 2. Appropriate functional capability
    // 3. Active Assignment for this specific incident
    if (!isSuperAdmin) {
      const gate = await canAccessRedactedIncident(session, params.id);
      if (!gate.authorized) {
        return NextResponse.json(
          { error: gate.error || 'غير مصرح: تم رفض الوصول بموجب قاعدة الاستحقاق الثلاثي' },
          { status: gate.status || 403 }
        );
      }
    }

    // Fetch Incident
    const incident = await prisma.incident.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, fullName: true, role: true, organization: true } },
        original: { select: { id: true, sourceType: true, createdAt: true } }, // Do NOT leak ciphertext here
        redactedVersions: {
          orderBy: { versionNumber: 'desc' },
        },
        assignments: {
          include: {
            assignedTo: { select: { id: true, fullName: true, email: true, role: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
        verifications: {
          include: {
            verifiedBy: { select: { id: true, fullName: true } },
          },
          orderBy: { verifiedAt: 'desc' },
        },
        attachments: true,
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'البلاغ الميداني غير موجود' }, { status: 404 });
    }

    const slaConfig = await getSlaConfig();
    const slaCalc = calculateIncidentSlaStatus(incident, slaConfig);

    // Response for SUPER_ADMIN
    if (isSuperAdmin) {
      return NextResponse.json({
        success: true,
        isSuperAdmin: true,
        incident: {
          ...incident,
          hasOriginalData: Boolean(incident.original),
          firstResponseAt: incident.firstResponseAt,
          dueAt: slaCalc.dueAt,
          closedAt: incident.closedAt,
          slaTargetMinutes: slaCalc.slaTargetMinutes,
          slaStatus: slaCalc.status,
          isEscalated: incident.isEscalated,
          escalatedAt: incident.escalatedAt,
          escalationReason: incident.escalationReason,
          slaDetails: {
            elapsedMinutes: slaCalc.elapsedMinutes,
            remainingMinutes: slaCalc.remainingMinutes,
            isBreached: slaCalc.isBreached,
            isApproachingBreach: slaCalc.isApproachingBreach,
            isClosed: slaCalc.isClosed,
          },
        },
      });
    }

    // Response for Staff (Filtered by Triple-Gate)
    const approvedRedacted = incident.redactedVersions.find((r) => r.isCurrent && r.isApproved);
    if (!approvedRedacted) {
      return NextResponse.json(
        { error: 'النسخة المنقحة لهذا البلاغ قيد المراجعة ولم تُعتمد بعد من قبل الإدارة العليا.' },
        { status: 403 }
      );
    }

    // Filter attachments: Staff sees ONLY REDACTED_SAFE attachments!
    const safeAttachments = incident.attachments.filter((a) => a.sensitivity === 'REDACTED_SAFE');

    const myAssignment = incident.assignments.find(
      (a) => a.assignedToUserId === session.userId && a.isActive && !a.revokedAt
    );

    return NextResponse.json({
      success: true,
      isSuperAdmin: false,
      incident: {
        id: incident.id,
        incidentNumber: incident.incidentNumber,
        category: incident.category,
        priority: incident.priority,
        status: incident.status,
        governorate: incident.governorate,
        district: incident.district,
        incidentDate: incident.incidentDate,
        createdAt: incident.createdAt,
        approvedRedacted,
        myAssignment,
        verifications: incident.verifications,
        attachments: safeAttachments,
        firstResponseAt: incident.firstResponseAt,
        dueAt: slaCalc.dueAt,
        slaStatus: slaCalc.status,
        isEscalated: incident.isEscalated,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'تحديث حالة البلاغ أو أولويته محصور بصلاحيات الإدارة العليا (SUPER_ADMIN) حصراً' },
        { status: 403 }
      );
    }

    const currentIncident = await prisma.incident.findUnique({
      where: { id: params.id },
    });

    if (!currentIncident) {
      return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { status, priority, isEscalated, escalationReason } = body;

    // Check if requesting manual escalation
    if (isEscalated === true && !currentIncident.isEscalated) {
      const escResult = await escalateIncidentInternal(
        params.id,
        escalationReason || 'تصعيد يدوي مباشر من قبل الإدارة العليا',
        session.userId,
        session.fullName
      );
      if (!escResult.success) {
        return NextResponse.json({ error: escResult.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: 'تم تصعيد البلاغ وإشعار الفريق المعني بنجاح',
        incident: escResult.incident,
      });
    }

    const updatePayload: any = {};
    const validStatuses = [
      'RECEIVED',
      'TRIAGED',
      'REDACTED',
      'ASSIGNED',
      'UNDER_VERIFICATION',
      'VERIFIED',
      'RESOLVED',
      'UNCONFIRMED',
      'CONTRADICTED',
      'DISPROVED',
      'DUPLICATE',
      'ALERT_DRAFTED',
      'ALERT_APPROVED',
      'ALERT_DISPATCHED',
      'CLOSED',
      'ARCHIVED',
    ];

    const now = new Date();

    if (status) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `حالة غير صالحة: ${status}` }, { status: 400 });
      }
      updatePayload.status = status;

      // 1. First Response Timestamp: If transitioning away from RECEIVED and firstResponseAt is not yet set
      if (status !== 'RECEIVED' && !currentIncident.firstResponseAt) {
        updatePayload.firstResponseAt = now;
      }

      // 2. Closed Timestamp: If transitioning to CLOSED
      if (status === 'CLOSED') {
        updatePayload.closedAt = now;
        // Determine SLA status at closure
        if (currentIncident.dueAt) {
          const respTime = currentIncident.firstResponseAt || now;
          updatePayload.slaStatus = respTime > currentIncident.dueAt ? 'CLOSED_BREACHED' : 'CLOSED_ON_TIME';
        }
      } else if (currentIncident.status === 'CLOSED' && status !== 'CLOSED') {
        // Reopening previously closed incident
        updatePayload.closedAt = null;
      }
    }

    if (priority) {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL_EMERGENCY'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: `أولوية غير صالحة: ${priority}` }, { status: 400 });
      }
      updatePayload.priority = priority;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات صالحة للتعديل' }, { status: 400 });
    }

    const updated = await prisma.incident.update({
      where: { id: params.id },
      data: updatePayload,
    });

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'UPDATE_INCIDENT_STATUS',
      entityType: 'Incident',
      entityId: updated.id,
      details: `تحديث حالة البلاغ [${updated.incidentNumber}] إلى [${updated.status}] والأولوية إلى [${updated.priority}]`,
    });

    return NextResponse.json({ success: true, incident: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
