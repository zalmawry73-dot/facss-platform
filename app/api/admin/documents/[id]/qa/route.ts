import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { assertApiCapability, CAPABILITIES, ROLES } from '@/lib/rbac';

interface RouteContext {
  params: {
    id: string; // Document ID
  };
}

/**
 * POST /api/admin/documents/[id]/qa
 * Manages Report Quality Assurance (QA) lifecycle for FINAL_REPORT documents:
 * Draft/Uploaded -> Under QA Review -> Approved/Rejected -> Delivered -> Client Accepted
 * Protected by QA_REPORTS capability.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const authCheck = await assertApiCapability(session, CAPABILITIES.QA_REPORTS);
    if (!authCheck.authorized) {
      return authCheck.response!;
    }

    const documentId = params.id;
    const doc = await prisma.serviceRequestDocument.findUnique({
      where: { id: documentId },
      include: {
        request: { select: { id: true, requestNumber: true, organization: true } },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: 'الوثيقة غير موجودة' }, { status: 404 });
    }

    if (doc.documentType !== 'FINAL_REPORT') {
      return NextResponse.json(
        { error: 'عملية ضبط الجودة (QA) مخصصة فقط للتقارير النهائية (FINAL_REPORT)' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, notes } = body;

    const validActions = ['START_REVIEW', 'APPROVE', 'REJECT', 'DELIVER'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `إجراء غير صالح. الإجراءات المتاحة: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const now = new Date();
    let updatedData: any = {};
    let auditAction = '';
    let auditDetails = '';

    switch (action) {
      case 'START_REVIEW':
        updatedData = {
          qaStatus: 'UNDER_REVIEW',
          qaReviewerId: session.userId,
          qaReviewedAt: now,
          qaNotes: notes || doc.qaNotes,
        };
        auditAction = 'REPORT_QA_START_REVIEW';
        auditDetails = `بدء مراجعة الجودة للتقرير النهائي (${doc.title}) للطلب ${doc.request.requestNumber}`;
        break;

      case 'APPROVE':
        updatedData = {
          qaStatus: 'APPROVED',
          qaReviewerId: session.userId,
          qaReviewedAt: doc.qaReviewedAt || now,
          qaApprovedAt: now,
          qaNotes: notes || doc.qaNotes,
        };
        auditAction = 'REPORT_QA_APPROVED';
        auditDetails = `اعتماد جودة التقرير النهائي (${doc.title}) للطلب ${doc.request.requestNumber}`;
        break;

      case 'REJECT':
        if (!notes || notes.trim() === '') {
          return NextResponse.json(
            { error: 'يرجى تدوين ملاحظات وأسباب إعادة أو رفض التقرير' },
            { status: 400 }
          );
        }
        updatedData = {
          qaStatus: 'REJECTED',
          qaReviewerId: session.userId,
          qaReviewedAt: now,
          qaNotes: notes,
        };
        auditAction = 'REPORT_QA_REJECTED';
        auditDetails = `إعادة التقرير النهائي (${doc.title}) للطلب ${doc.request.requestNumber}: ${notes}`;
        break;

      case 'DELIVER':
        if (doc.qaStatus !== 'APPROVED') {
          return NextResponse.json(
            { error: 'لا يمكن تسليم التقرير للعميل إلا بعد اعتماد الجودة (APPROVED)' },
            { status: 400 }
          );
        }
        updatedData = {
          qaStatus: 'DELIVERED',
          deliveredAt: now,
          visibility: 'CLIENT_VISIBLE',
        };
        auditAction = 'REPORT_DELIVERED';
        auditDetails = `تسليم التقرير النهائي المعتمد (${doc.title}) إلى العميل للطلب ${doc.request.requestNumber}`;
        break;
    }

    const updatedDoc = await prisma.serviceRequestDocument.update({
      where: { id: documentId },
      data: updatedData,
      include: {
        qaReviewer: { select: { id: true, fullName: true, email: true } },
      },
    });

    // C16: Audit logging
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: auditAction,
        details: auditDetails,
        entityType: 'ServiceRequestDocument',
        entityId: documentId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث حالة جودة التقرير بنجاح',
      document: updatedDoc,
    });
  } catch (error: any) {
    console.error('Error handling document QA:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة جودة التقرير: ' + error.message },
      { status: 500 }
    );
  }
}
