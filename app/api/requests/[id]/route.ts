import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole, ROLES, CAPABILITIES, assertApiCapability } from '@/lib/rbac';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    // 1. Verify session + isActive in DB
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isStaff = isStaffRole(session.role);
    const isClient = session.role === ROLES.CLIENT;

    // Explicit DENY: Trainee and unauthorized roles cannot access client service requests
    if (!isStaff && !isClient) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    const req = await prisma.serviceRequest.findUnique({
      where: { id: params.id },
      include: {
        service: true,
        assignedEmployee: { select: { id: true, fullName: true, email: true, phone: true } },
        notes: {
          where: isStaff ? {} : { isClientVisible: true },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          where: isStaff ? {} : { isArchived: false, visibility: 'CLIENT_VISIBLE' },
          orderBy: { createdAt: 'desc' },
        }
      }
    });

    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Explicit IDOR check: Non-staff client can ONLY view their own requests
    if (!isStaff && req.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to view this request' }, { status: 403 });
    }

    return NextResponse.json({ success: true, request: req });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    // 1. Verify session + isActive in DB
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Granular capability gate: Requires manage_requests
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_REQUESTS);
    if (!gate.authorized) return gate.response!;


    const body = await request.json();
    const { status, assignedEmployeeId, note, isClientVisible } = body;

    const existing = await prisma.serviceRequest.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (assignedEmployeeId !== undefined) updateData.assignedEmployeeId = assignedEmployeeId || null;

    const updated = await prisma.serviceRequest.update({
      where: { id: params.id },
      data: updateData,
    });

    // Add note if provided
    if (note && note.trim()) {
      await prisma.serviceRequestNote.create({
        data: {
          requestId: params.id,
          authorId: session.userId,
          authorName: session.fullName,
          note: note.trim(),
          isClientVisible: isClientVisible ?? false,
        }
      });
    }

    // Send notification to client if status changed
    if (status && existing.userId && existing.status !== status) {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          titleAr: 'تحديث في حالة طلب الخدمة',
          titleEn: 'Service Request Status Updated',
          messageAr: `تم تحديث حالة طلبكم [${existing.requestNumber}] إلى: ${status}`,
          messageEn: `Your request [${existing.requestNumber}] status is now: ${status}`,
          type: 'INFO',
          link: `/portal/client/requests/${params.id}`,
        }
      });
    }

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        userName: session.fullName,
        action: 'UPDATE_SERVICE_REQUEST',
        entityType: 'ServiceRequest',
        entityId: params.id,
        details: `تعديل حالة الطلب [${existing.requestNumber}] إلى ${status || existing.status}`,
      }
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
