import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal/client/tna
 * List TNAs belonging to the authenticated client
 */
export async function GET() {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: يجب تسجيل الدخول' }, { status: 401 });
    }

    const assessments = await prisma.trainingNeedsAssessment.findMany({
      where: { clientId: session.userId },
      include: {
        course: { select: { id: true, titleAr: true, status: true, startDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, assessments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/portal/client/tna
 * Client submits a training needs assessment request
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: يجب تسجيل الدخول' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      title,
      targetAudience,
      participantCount = 1,
      requestedTopics,
      currentCompetency,
      desiredCompetency,
      operationalContext,
    } = body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json({ error: 'عنوان الاحتياج التدريبي مطلوب' }, { status: 400 });
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

    const count = await prisma.trainingNeedsAssessment.count();
    const year = new Date().getFullYear();
    const referenceNumber = `FACSS-TNA-${year}-${String(count + 1).padStart(4, '0')}`;

    const assessment = await prisma.trainingNeedsAssessment.create({
      data: {
        referenceNumber,
        title: title.trim(),
        clientId: session.userId,
        targetAudience: targetAudience.trim(),
        participantCount: Number(participantCount) || 1,
        requestedTopics: requestedTopics.trim(),
        currentCompetency: currentCompetency.trim(),
        desiredCompetency: desiredCompetency.trim(),
        operationalContext: operationalContext ? String(operationalContext).trim() : null,
        status: 'SUBMITTED',
        createdById: session.userId,
      },
    });

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'SUBMIT_CLIENT_TNA',
      entityType: 'TrainingNeedsAssessment',
      entityId: assessment.id,
      details: `تقديم طلب تقييم احتياج تدريبي من العميل [${session.fullName}]: [${assessment.title}]`,
    });

    return NextResponse.json({ success: true, assessment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
