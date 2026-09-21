import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, canAccessRedactedIncident, canAccessOriginalIncident } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

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

    // Response for SUPER_ADMIN
    if (isSuperAdmin) {
      return NextResponse.json({
        success: true,
        isSuperAdmin: true,
        incident: {
          ...incident,
          hasOriginalData: Boolean(incident.original),
        },
      });
    }

    // Response for Staff (Filtered by Triple-Gate)
    // Must ONLY receive the approved current redacted version, safe attachments, and verifications
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

    const body = await request.json().catch(() => ({}));
    const { status, priority } = body;

    const updatePayload: any = {};
    const validStatuses = [
      'RECEIVED',
      'TRIAGED',
      'REDACTED',
      'ASSIGNED',
      'UNDER_VERIFICATION',
      'VERIFIED',
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

    if (status) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `حالة غير صالحة: ${status}` }, { status: 400 });
      }
      updatePayload.status = status;
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
