import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/training/tna
 * List all Training Needs Assessments (TNA)
 */
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const assessments = await prisma.trainingNeedsAssessment.findMany({
      where,
      include: {
        client: { select: { id: true, fullName: true, organization: true, email: true } },
        course: { select: { id: true, titleAr: true, status: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, assessments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/training/tna
 * Create a new Training Needs Assessment (TNA)
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const {
      title,
      clientId,
      courseId,
      targetAudience,
      participantCount = 1,
      requestedTopics,
      currentCompetency,
      desiredCompetency,
      operationalContext,
      recommendations,
      assessmentDate,
    } = body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json({ error: 'عنوان تقييم الاحتياج مطلوب' }, { status: 400 });
    }

    if (!targetAudience || typeof targetAudience !== 'string' || targetAudience.trim().length < 2) {
      return NextResponse.json({ error: 'الفئة المستهدفة مطلوبة' }, { status: 400 });
    }

    if (!requestedTopics || typeof requestedTopics !== 'string') {
      return NextResponse.json({ error: 'المهارات والمواضيع المطلوبة إلزامية' }, { status: 400 });
    }

    if (!currentCompetency || !desiredCompetency) {
      return NextResponse.json({ error: 'مستوى الكفاءة الحالي والمستهدف مطلوبان' }, { status: 400 });
    }

    // Generate unique reference number e.g. FACSS-TNA-2026-0001
    const count = await prisma.trainingNeedsAssessment.count();
    const year = new Date().getFullYear();
    const referenceNumber = `FACSS-TNA-${year}-${String(count + 1).padStart(4, '0')}`;

    const assessment = await prisma.trainingNeedsAssessment.create({
      data: {
        referenceNumber,
        title: title.trim(),
        clientId: clientId || null,
        courseId: courseId || null,
        targetAudience: targetAudience.trim(),
        participantCount: Number(participantCount) || 1,
        requestedTopics: requestedTopics.trim(),
        currentCompetency: currentCompetency.trim(),
        desiredCompetency: desiredCompetency.trim(),
        operationalContext: operationalContext ? String(operationalContext).trim() : null,
        recommendations: recommendations ? String(recommendations).trim() : null,
        assessmentDate: assessmentDate ? new Date(assessmentDate) : new Date(),
        status: body.status || 'SUBMITTED',
        createdById: session!.userId,
      },
      include: {
        client: { select: { id: true, fullName: true, organization: true } },
        course: { select: { id: true, titleAr: true } },
      },
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'CREATE_TNA',
      entityType: 'TrainingNeedsAssessment',
      entityId: assessment.id,
      details: `إنشاء تقييم احتياجات تدريبية برقم [${referenceNumber}]: [${assessment.title}]`,
    });

    return NextResponse.json({ success: true, assessment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
