import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
  params: {
    id: string; // Service Request ID
  };
}

/**
 * POST /api/portal/client/requests/[id]/feedback
 * Submits client feedback on completed service requests.
 * Enforces:
 * 1. Active authentication.
 * 2. Service request must be COMPLETED.
 * 3. Strict ownership (IDOR prevention).
 * 4. Duplicate feedback prevention (one per request).
 * 5. Rating scale 1-5 validation.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const requestId = params.id;
    const serviceReq = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        requestNumber: true,
        status: true,
      },
    });

    if (!serviceReq) {
      return NextResponse.json({ error: 'طلب الخدمة غير موجود' }, { status: 404 });
    }

    // 1. Ownership & IDOR Gate
    if (serviceReq.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: لا يمكنك تقييم طلب خدمة يخص عميلاً آخر (Access Denied)' },
        { status: 403 }
      );
    }

    // 2. Eligibility Gate: Must be completed
    if (serviceReq.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'لا يمكن تقييم الخدمة إلا بعد اكتمال تنفيذها رسمياً (COMPLETED)' },
        { status: 400 }
      );
    }

    // 3. Duplicate Prevention Gate
    const existingFeedback = await prisma.clientFeedback.findUnique({
      where: { requestId },
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: 'تم إرسال تقييم لهذا الطلب مسبقاً، ولا يمكن تكرار التقييم' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { overallRating, serviceQuality, timeliness, communication, comment } = body;

    // 4. Rating Validation (1 to 5)
    const validateRating = (r: any, name: string) => {
      const num = Number(r);
      if (!Number.isInteger(num) || num < 1 || num > 5) {
        throw new Error(`قيمة تقييم ${name} يجب أن تكون رقماً صحيحاً بين 1 و 5`);
      }
      return num;
    };

    let validOverall: number;
    let validQuality: number;
    let validTime: number;
    let validComm: number;

    try {
      validOverall = validateRating(overallRating, 'الرضا العام');
      validQuality = validateRating(serviceQuality, 'جودة الخدمة');
      validTime = validateRating(timeliness, 'الالتزام بالمواعيد');
      validComm = validateRating(communication, 'التواصل والمتابعة');
    } catch (valErr: any) {
      return NextResponse.json({ error: valErr.message }, { status: 400 });
    }

    // 5. Create Feedback
    const createdFeedback = await prisma.clientFeedback.create({
      data: {
        requestId,
        clientId: session.userId,
        overallRating: validOverall,
        serviceQuality: validQuality,
        timeliness: validTime,
        communication: validComm,
        comment: comment ? String(comment).trim() : null,
      },
    });

    // 6. Audit Logging (C16)
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: 'CLIENT_FEEDBACK_SUBMITTED',
        details: `قام العميل بتقديم تقييم للطلب ${serviceReq.requestNumber}: التقييم العام ${validOverall}/5`,
        entityType: 'ClientFeedback',
        entityId: createdFeedback.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'شكراً لك! تم استلام تقييمك بنجاح',
      feedback: createdFeedback,
    });
  } catch (error: any) {
    console.error('Error submitting client feedback:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ التقييم: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/portal/client/requests/[id]/feedback
 * Fetches feedback for the given request.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const feedback = await prisma.clientFeedback.findUnique({
      where: { requestId: params.id },
      include: {
        client: { select: { fullName: true, organization: true } },
      },
    });

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
