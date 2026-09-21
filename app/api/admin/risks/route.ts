import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateRiskInput } from '@/lib/validations/admin';
import { calculateRiskScore, generateRiskNumber } from '@/lib/risk-engine';
import { logActivity } from '@/lib/audit';

/**
 * GET /api/admin/risks
 * List operational risks with search, multi-faceted filtering, and aggregated statistics.
 * Protected by VIEW_RISK_REGISTER capability.
 */
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.VIEW_RISK_REGISTER);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const governorate = searchParams.get('governorate');
    const status = searchParams.get('status');
    const riskLevel = searchParams.get('riskLevel');
    const search = searchParams.get('search')?.trim();
    const likelihood = searchParams.get('likelihood') ? parseInt(searchParams.get('likelihood')!, 10) : undefined;
    const impact = searchParams.get('impact') ? parseInt(searchParams.get('impact')!, 10) : undefined;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (governorate) {
      where.governorate = { contains: governorate, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    if (likelihood && !isNaN(likelihood)) {
      where.likelihood = likelihood;
    }

    if (impact && !isNaN(impact)) {
      where.impact = impact;
    }

    if (search) {
      where.OR = [
        { riskNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { generalLocation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [risks, totalCount, allRisksForStats] = await Promise.all([
      prisma.operationalRisk.findMany({
        where,
        orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
        include: {
          incident: {
            select: {
              id: true,
              incidentNumber: true,
              category: true,
              governorate: true,
              district: true,
              status: true,
            },
          },
          mitigations: {
            select: {
              id: true,
              status: true,
              actionTitle: true,
            },
          },
          _count: {
            select: {
              mitigations: true,
              assessments: true,
            },
          },
        },
      }),
      prisma.operationalRisk.count({ where }),
      prisma.operationalRisk.findMany({
        select: {
          id: true,
          status: true,
          riskLevel: true,
          likelihood: true,
          impact: true,
          category: true,
          governorate: true,
        },
      }),
    ]);

    // Compute aggregated operational metrics
    const stats = {
      total: allRisksForStats.length,
      active: allRisksForStats.filter((r) => r.status !== 'CLOSED' && r.status !== 'RESOLVED').length,
      critical: allRisksForStats.filter((r) => r.riskLevel === 'CRITICAL' && r.status !== 'CLOSED').length,
      high: allRisksForStats.filter((r) => r.riskLevel === 'HIGH' && r.status !== 'CLOSED').length,
      medium: allRisksForStats.filter((r) => r.riskLevel === 'MEDIUM' && r.status !== 'CLOSED').length,
      low: allRisksForStats.filter((r) => r.riskLevel === 'LOW' && r.status !== 'CLOSED').length,
      inTreatment: allRisksForStats.filter((r) => r.status === 'TREATMENT_IN_PROGRESS').length,
      monitored: allRisksForStats.filter((r) => r.status === 'MONITORED').length,
      resolved: allRisksForStats.filter((r) => r.status === 'RESOLVED').length,
      closed: allRisksForStats.filter((r) => r.status === 'CLOSED').length,
    };

    // Compute 5x5 Matrix counts
    const matrixCounts: Record<string, number> = {};
    for (let l = 1; l <= 5; l++) {
      for (let i = 1; i <= 5; i++) {
        matrixCounts[`${l},${i}`] = 0;
      }
    }
    for (const r of allRisksForStats) {
      if (r.status !== 'CLOSED') {
        const key = `${r.likelihood},${r.impact}`;
        matrixCounts[key] = (matrixCounts[key] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      risks,
      totalCount,
      stats,
      matrixCounts,
    });
  } catch (error: any) {
    console.error('Error fetching operational risks:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/risks
 * Create a new operational risk (standalone or linked to verified incident).
 * Protected by MANAGE_RISK_REGISTER capability.
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RISK_REGISTER);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const validation = validateRiskInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات الخطر المدخلة غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;

    // Optional Incident verification link check
    if (input.incidentId) {
      const incident = await prisma.incident.findUnique({
        where: { id: input.incidentId },
        select: {
          id: true,
          status: true,
          incidentNumber: true,
          verifications: { select: { id: true } },
        },
      });

      if (!incident) {
        return NextResponse.json(
          { error: 'البلاغ الميداني المرتبط غير موجود في المنظومة' },
          { status: 404 }
        );
      }

      // Security rule: Incident must be verified before linking
      const isVerified =
        incident.status === 'VERIFIED' ||
        incident.status === 'ALERT_DRAFTED' ||
        incident.status === 'ALERT_APPROVED' ||
        incident.status === 'ALERT_DISPATCHED' ||
        incident.verifications.length > 0;

      if (!isVerified) {
        return NextResponse.json(
          {
            error:
              'لا يمكن ربط الخطر ببلاغ غير محقق. يجب إتمام مرحلة التحقق والاعتماد للبلاغ أولاً.',
          },
          { status: 400 }
        );
      }
    }

    // Calculate score and level
    const scoreResult = calculateRiskScore(input.likelihood, input.impact);
    if (!scoreResult.isValid) {
      return NextResponse.json({ error: scoreResult.error }, { status: 400 });
    }

    // Generate official risk number
    const riskNumber = await generateRiskNumber();

    // Create risk and initial assessment history in transaction
    const createdRisk = await prisma.$transaction(async (tx) => {
      const risk = await tx.operationalRisk.create({
        data: {
          riskNumber,
          title: input.title,
          description: input.description,
          category: input.category,
          status: 'ASSESSED',
          governorate: input.governorate,
          district: input.district,
          generalLocation: input.generalLocation,
          incidentId: input.incidentId || null,
          likelihood: input.likelihood,
          impact: input.impact,
          riskScore: scoreResult.score,
          riskLevel: scoreResult.level,
          targetResolutionDate: input.targetResolutionDate,
          createdById: session!.userId,
          lastAssessedById: session!.userId,
          lastAssessedAt: new Date(),
        },
      });

      // Record initial assessment entry
      await tx.riskAssessmentHistory.create({
        data: {
          riskId: risk.id,
          likelihood: input.likelihood,
          impact: input.impact,
          riskScore: scoreResult.score,
          riskLevel: scoreResult.level,
          rationale: 'التقييم الأولي المعتمد عند تسجيل قيد الخطر في المنظومة.',
          assessedById: session!.userId,
          assessedByName: session!.fullName || 'مسؤول إدارة المخاطر',
        },
      });

      return risk;
    });

    // Audit log
    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'CREATE_OPERATIONAL_RISK',
      entityType: 'OperationalRisk',
      entityId: createdRisk.id,
      details: JSON.stringify({
        riskNumber: createdRisk.riskNumber,
        category: createdRisk.category,
        governorate: createdRisk.governorate,
        score: createdRisk.riskScore,
        level: createdRisk.riskLevel,
        incidentId: createdRisk.incidentId,
      }),
    });

    return NextResponse.json({ success: true, risk: createdRisk }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating operational risk:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
