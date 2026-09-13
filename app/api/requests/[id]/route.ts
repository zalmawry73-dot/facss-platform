import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isStaff = session.role === 'SUPER_ADMIN' || session.role === 'ADMIN' || session.role.includes('MANAGER');

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
          orderBy: { createdAt: 'desc' },
        }
      }
    });

    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Security check: client can only view own request
    if (!isStaff && req.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, request: req });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isStaff = session.role === 'SUPER_ADMIN' || session.role === 'ADMIN' || session.role.includes('MANAGER');
    if (!isStaff) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }

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
