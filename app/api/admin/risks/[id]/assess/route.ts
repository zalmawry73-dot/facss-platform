import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability, hasCapability, ROLES } from '@/lib/rbac';
import { validateReassessmentInput } from '@/lib/validations/admin';
import { calculateRiskScore } from '@/lib/risk-engine';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

/**
 * POST /api/admin/risks/[id]/assess
 * Reassess an operational risk, updating score and logging a persistent historical audit entry.
 * Protected by ASSESS_RISK or MANAGE_RISK_REGISTER capability.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    // Check if user has ASSESS_RISK or MANAGE_RISK_REGISTER or is SUPER_ADMIN
    const canAssess =
      session.role === ROLES.SUPER_ADMIN ||
      (await hasCapability(session, CAPABILITIES.ASSESS_RISK)) ||
      (await hasCapability(session, CAPABILITIES.MANAGE_RISK_REGISTER));

    if (!canAssess) {
      return NextResponse.json(
        { error: 'غير مصرح: لا تملك صلاحية تقييم أو إعادة تقييم المخاطر (assess_risk)' },
        { status: 403 }
      );
    }

    const risk = await prisma.operationalRisk.findUnique({
      where: { id: params.id },
    });

    if (!risk) {
      return NextResponse.json({ error: 'قيد الخطر غير موجود' }, { status: 404 });
    }

    if (risk.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'لا يمكن إعادة تقييم خطر مغلق. يجب إعادة فتح الخطر أولاً.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateReassessmentInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات إعادة التقييم غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { likelihood, impact, rationale } = validation.data;

    const scoreResult = calculateRiskScore(likelihood, impact);
    if (!scoreResult.isValid) {
      return NextResponse.json({ error: scoreResult.error }, { status: 400 });
    }

    const oldScore = risk.riskScore;
    const oldLevel = risk.riskLevel;

    // Execute reassessment in transaction
    const result = await prisma.$transaction(async (tx) => {
      const assessment = await tx.riskAssessmentHistory.create({
        data: {
          riskId: risk.id,
          likelihood,
          impact,
          riskScore: scoreResult.score,
          riskLevel: scoreResult.level,
          rationale,
          assessedById: session.userId,
          assessedByName: session.fullName || 'مسؤول التقييم',
        },
      });

      const updatedRisk = await tx.operationalRisk.update({
        where: { id: risk.id },
        data: {
          likelihood,
          impact,
          riskScore: scoreResult.score,
          riskLevel: scoreResult.level,
          lastAssessedById: session.userId,
          lastAssessedAt: new Date(),
          status: risk.status === 'IDENTIFIED' ? 'ASSESSED' : risk.status,
        },
        include: {
          assessments: {
            orderBy: { assessedAt: 'desc' },
          },
        },
      });

      return { updatedRisk, assessment };
    });

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'REASSESS_OPERATIONAL_RISK',
      entityType: 'OperationalRisk',
      entityId: risk.id,
      details: JSON.stringify({
        riskNumber: risk.riskNumber,
        previousScore: oldScore,
        previousLevel: oldLevel,
        newScore: scoreResult.score,
        newLevel: scoreResult.level,
        rationale,
      }),
    });

    return NextResponse.json({
      success: true,
      risk: result.updatedRisk,
      assessment: result.assessment,
      message: 'تم تسجيل إعادة التقييم بنجاح وتحديث درجة الخطر في السجل التاريخي',
    });
  } catch (error: any) {
    console.error('Error reassessing risk:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
