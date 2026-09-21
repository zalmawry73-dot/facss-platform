import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateRiskStatusChange } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

/**
 * POST /api/admin/risks/[id]/status
 * Manage operational lifecycle transitions: Close, Reopen, Resolve, Monitor.
 * Protected by MANAGE_RISK_REGISTER capability.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RISK_REGISTER);
    if (!gate.authorized) return gate.response!;

    const risk = await prisma.operationalRisk.findUnique({
      where: { id: params.id },
    });

    if (!risk) {
      return NextResponse.json({ error: 'قيد الخطر غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateRiskStatusChange(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات تغيير الحالة غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { status: newStatus, reason } = validation.data;
    const oldStatus = risk.status;

    const updateData: any = {
      status: newStatus,
    };

    if (newStatus === 'CLOSED') {
      updateData.closedAt = new Date();
      updateData.closeReason = reason;
    } else if (newStatus === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    } else if (oldStatus === 'CLOSED') {
      // Reopening a previously closed risk
      updateData.reopenedAt = new Date();
      updateData.reopenReason = reason;
    }

    const updatedRisk = await prisma.operationalRisk.update({
      where: { id: risk.id },
      data: updateData,
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: newStatus === 'CLOSED' ? 'CLOSE_OPERATIONAL_RISK' : oldStatus === 'CLOSED' ? 'REOPEN_OPERATIONAL_RISK' : 'UPDATE_RISK_STATUS',
      entityType: 'OperationalRisk',
      entityId: risk.id,
      details: JSON.stringify({
        riskNumber: risk.riskNumber,
        previousStatus: oldStatus,
        newStatus,
        reason,
      }),
    });

    return NextResponse.json({
      success: true,
      risk: updatedRisk,
      message: `تم تحديث حالة الخطر إلى [${newStatus}] بنجاح`,
    });
  } catch (error: any) {
    console.error('Error changing risk status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
