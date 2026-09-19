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
    });

    if (!message) {
      return NextResponse.json({ error: 'الرسالة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message });
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
      return NextResponse.json({ error: 'الرسالة غير موجودة' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateMessageStatusUpdate(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات تحديث حالة الرسالة غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { status, replyNotes } = validation.data;

    const updateData: any = { status };
    if (replyNotes !== undefined) {
      updateData.replyNotes = replyNotes;
    }

    const updated = await prisma.contactMessage.update({
      where: { id: params.id },
      data: updateData,
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'UPDATE_MESSAGE_STATUS',
      entityType: 'ContactMessage',
      entityId: params.id,
      details: `تعديل حالة رسالة [${message.name} - ${message.subject}] من [${message.status}] إلى [${status}]`,
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
