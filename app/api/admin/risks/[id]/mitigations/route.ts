import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateMitigationInput } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

/**
 * POST /api/admin/risks/[id]/mitigations
 * Add a new mitigation / treatment action to an operational risk.
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
    const validation = validateMitigationInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات إجراء التخفيف غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const action = await prisma.$transaction(async (tx) => {
      const createdAction = await tx.riskMitigationAction.create({
        data: {
          riskId: risk.id,
          actionTitle: data.actionTitle,
          actionType: data.actionType,
          description: data.description,
          assignedTo: data.assignedTo,
          dueDate: data.dueDate,
          status: data.status || 'PLANNED',
          progressNotes: data.progressNotes,
          completedAt: data.status === 'COMPLETED' ? new Date() : null,
          createdById: session!.userId,
        },
      });

      // If risk was merely ASSESSED or IDENTIFIED, transition to TREATMENT_IN_PROGRESS
      if (risk.status === 'IDENTIFIED' || risk.status === 'ASSESSED') {
        await tx.operationalRisk.update({
          where: { id: risk.id },
          data: { status: 'TREATMENT_IN_PROGRESS' },
        });
      }

      return createdAction;
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'ADD_RISK_MITIGATION_ACTION',
      entityType: 'RiskMitigationAction',
      entityId: action.id,
      details: JSON.stringify({
        riskNumber: risk.riskNumber,
        actionTitle: action.actionTitle,
        actionType: action.actionType,
        status: action.status,
      }),
    });

    return NextResponse.json({ success: true, action }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding mitigation action:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
