import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateMessageStatusUpdate } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_MESSAGES);
    if (!gate.authorized) return gate.response!;

    const message = await prisma.contactMessage.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'الرسالة أو الشكوى غير موجودة' }, { status: 404 });
    }

    let slaDetails = null;
    if (message.messageType === 'COMPLAINT') {
      const { getSlaConfig, calculateComplaintSlaStatus } = await import('@/lib/sla-engine');
      const slaConfig = await getSlaConfig();
      slaDetails = calculateComplaintSlaStatus(message, slaConfig);
    }

    return NextResponse.json({
      success: true,
      message: {
        ...message,
        slaDetails,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_MESSAGES);
    if (!gate.authorized) return gate.response!;

    const message = await prisma.contactMessage.findUnique({
      where: { id: params.id },
    });

    if (!message) {
      return NextResponse.json({ error: 'الرسالة أو الشكوى غير موجودة' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateMessageStatusUpdate(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات تحديث الرسالة/الشكوى غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { status, replyNotes, assignedToUserId, resolutionSummary, priority } = validation.data;
    const now = new Date();

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'RESOLVED') {
        updateData.resolvedAt = now;
        if (message.dueAt) {
          updateData.slaStatus = now > message.dueAt ? 'RESOLVED_BREACHED' : 'RESOLVED_ON_TIME';
        }
      } else if (message.status === 'RESOLVED') {
        updateData.resolvedAt = null;
      }
    }

    if (replyNotes !== undefined) {
      updateData.replyNotes = replyNotes;
    }

    if (assignedToUserId !== undefined) {
      updateData.assignedToUserId = assignedToUserId;
      if (!status && message.status === 'UNREAD') {
        updateData.status = 'IN_PROGRESS';
      }
    }

    if (resolutionSummary !== undefined) {
      updateData.resolutionSummary = resolutionSummary;
    }

    if (priority) {
      updateData.priority = priority;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات صالحة للتعديل' }, { status: 400 });
    }

    const updated = await prisma.contactMessage.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: message.messageType === 'COMPLAINT' ? 'UPDATE_COMPLAINT_STATUS' : 'UPDATE_MESSAGE_STATUS',
      entityType: 'ContactMessage',
      entityId: params.id,
      details: `تحديث ${message.messageType === 'COMPLAINT' ? `الشكوى [${message.referenceNumber || message.id}]` : `رسالة [${message.name}]`} إلى حالة [${status || message.status}]`,
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
