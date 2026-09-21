import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { VALID_MITIGATION_STATUSES } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string; actionId: string };
}

/**
 * PATCH /api/admin/risks/[id]/mitigations/[actionId]
 * Update mitigation status, progress notes, and completion date.
 * Protected by MANAGE_RISK_REGISTER capability.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RISK_REGISTER);
    if (!gate.authorized) return gate.response!;

    const action = await prisma.riskMitigationAction.findUnique({
      where: { id: params.actionId },
      include: { risk: { select: { id: true, riskNumber: true } } },
    });

    if (!action || action.riskId !== params.id) {
      return NextResponse.json({ error: 'إجراء التخفيف غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updateData: any = {};

    if (body.status !== undefined) {
      if (!VALID_MITIGATION_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `حالة الإجراء غير صالحة. الحالات: ${VALID_MITIGATION_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = body.status;
      if (body.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    if (body.progressNotes !== undefined) {
      updateData.progressNotes = body.progressNotes ? String(body.progressNotes).trim() : null;
    }

    if (body.assignedTo !== undefined) {
      updateData.assignedTo = body.assignedTo ? String(body.assignedTo).trim() : null;
    }

    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    const updatedAction = await prisma.riskMitigationAction.update({
      where: { id: params.actionId },
      data: updateData,
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'UPDATE_RISK_MITIGATION_ACTION',
      entityType: 'RiskMitigationAction',
      entityId: updatedAction.id,
      details: JSON.stringify({
        riskNumber: action.risk.riskNumber,
        actionTitle: action.actionTitle,
        updatedStatus: updatedAction.status,
      }),
    });

    return NextResponse.json({ success: true, action: updatedAction });
  } catch (error: any) {
    console.error('Error updating mitigation action:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/risks/[id]/mitigations/[actionId]
 * Delete a mitigation action from a risk.
 * Protected by MANAGE_RISK_REGISTER capability.
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RISK_REGISTER);
    if (!gate.authorized) return gate.response!;

    const action = await prisma.riskMitigationAction.findUnique({
      where: { id: params.actionId },
      include: { risk: { select: { id: true, riskNumber: true } } },
    });

    if (!action || action.riskId !== params.id) {
      return NextResponse.json({ error: 'إجراء التخفيف غير موجود' }, { status: 404 });
    }

    await prisma.riskMitigationAction.delete({
      where: { id: params.actionId },
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'DELETE_RISK_MITIGATION_ACTION',
      entityType: 'RiskMitigationAction',
      entityId: params.actionId,
      details: JSON.stringify({
        riskNumber: action.risk.riskNumber,
        actionTitle: action.actionTitle,
      }),
    });

    return NextResponse.json({ success: true, message: 'تم حذف إجراء التخفيف بنجاح' });
  } catch (error: any) {
    console.error('Error deleting mitigation action:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
