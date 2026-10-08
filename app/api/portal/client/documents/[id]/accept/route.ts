import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
  params: {
    id: string; // Document ID
  };
}

/**
 * POST /api/portal/client/documents/[id]/accept
 * Client acceptance of delivered service report.
 * Protected by ownership verification (IDOR check).
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const documentId = params.id;
    const doc = await prisma.serviceRequestDocument.findUnique({
      where: { id: documentId },
      include: {
        request: { select: { id: true, userId: true, requestNumber: true } },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
    }

    // IDOR Check: Must belong to current client's service request
    if (doc.request.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: Access denied. Cannot accept report belonging to another client.' },
        { status: 403 }
      );
    }

    if (doc.documentType !== 'FINAL_REPORT') {
      return NextResponse.json(
        { error: 'القبول مخصص فقط للتقارير النهائية' },
        { status: 400 }
      );
    }

    if (doc.qaStatus === 'CLIENT_ACCEPTED') {
      return NextResponse.json({
        success: true,
        message: 'تم قبول هذا التقرير مسبقاً',
        document: doc,
      });
    }

    if (doc.qaStatus !== 'DELIVERED' && doc.qaStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'لا يمكن تأكيد استلام التقرير قبل تسليمه واعتماده رسمياً' },
        { status: 400 }
      );
    }

    const now = new Date();
    const updatedDoc = await prisma.serviceRequestDocument.update({
      where: { id: documentId },
      data: {
        qaStatus: 'CLIENT_ACCEPTED',
        clientAcceptedAt: now,
      },
    });

    // C16: Audit log
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: 'CLIENT_REPORT_ACCEPTED',
        details: `قام العميل بقبول واعتماد استلام التقرير النهائي (${doc.title}) للطلب ${doc.request.requestNumber}`,
        entityType: 'ServiceRequestDocument',
        entityId: documentId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تأكيد استلام وقبول التقرير بنجاح',
      document: updatedDoc,
    });
  } catch (error: any) {
    console.error('Error accepting client report:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء قبول التقرير: ' + error.message },
      { status: 500 }
    );
  }
}
