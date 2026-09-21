import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole, ROLES, CAPABILITIES, hasCapability } from '@/lib/rbac';
import { getStorageDriver } from '@/lib/storage';
import { 
  validateUploadedDocument, 
  DOCUMENT_TYPES, 
  DOCUMENT_VISIBILITIES, 
  DocumentType, 
  DocumentVisibility 
} from '@/lib/validations/documents';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * POST /api/requests/[id]/documents
 * Handles multipart document uploads with strict authorization, validation,
 * private storage abstraction, and compensating operations.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    // 1. Session verification & active status
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const requestId = params.id;

    // 2. Fetch service request
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: { id: true, userId: true, requestNumber: true, status: true },
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: 'طلب الخدمة غير موجود' }, { status: 404 });
    }

    // 3. Role & Capability Authorization Gate
    const isStaff = isStaffRole(session.role);
    const isClient = session.role === ROLES.CLIENT;

    // Hard deny for Trainee or unknown roles
    if (session.role === ROLES.TRAINEE || (!isStaff && !isClient)) {
      return NextResponse.json({ error: 'Forbidden: Role not authorized to upload documents' }, { status: 403 });
    }

    let canManage = false;
    if (isStaff) {
      canManage = await hasCapability(session, CAPABILITIES.MANAGE_REQUESTS);
      if (!canManage) {
        return NextResponse.json(
          { error: `Forbidden: Missing required capability [${CAPABILITIES.MANAGE_REQUESTS}]` },
          { status: 403 }
        );
      }
    }

    // IDOR Check for Client: Must own the service request
    if (isClient && serviceRequest.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: Access denied to other clients requests' },
        { status: 403 }
      );
    }

    // 4. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawType = formData.get('documentType') as string | null;
    const rawVisibility = formData.get('visibility') as string | null;
    const customTitle = formData.get('title') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'يرجى إرفاق ملف للرفع' }, { status: 400 });
    }

    // 5. Authorize document type and visibility
    let validatedType: DocumentType = DOCUMENT_TYPES.CLIENT_ATTACHMENT;
    let validatedVisibility: DocumentVisibility = DOCUMENT_VISIBILITIES.CLIENT_VISIBLE;

    if (isClient) {
      // Clients can ONLY upload CLIENT_ATTACHMENT and it is always CLIENT_VISIBLE
      validatedType = DOCUMENT_TYPES.CLIENT_ATTACHMENT;
      validatedVisibility = DOCUMENT_VISIBILITIES.CLIENT_VISIBLE;
      if (rawType && rawType !== DOCUMENT_TYPES.CLIENT_ATTACHMENT) {
        return NextResponse.json(
          { error: 'Forbidden: Clients cannot assign internal or final report document types' },
          { status: 403 }
        );
      }
    } else if (isStaff) {
      // Staff with manage_requests can set type and visibility
      if (rawType && Object.values(DOCUMENT_TYPES).includes(rawType as DocumentType)) {
        validatedType = rawType as DocumentType;
      }
      if (rawVisibility && Object.values(DOCUMENT_VISIBILITIES).includes(rawVisibility as DocumentVisibility)) {
        validatedVisibility = rawVisibility as DocumentVisibility;
      }
      // If final report, default to CLIENT_VISIBLE unless explicitly set otherwise
      if (validatedType === DOCUMENT_TYPES.FINAL_REPORT && !rawVisibility) {
        validatedVisibility = DOCUMENT_VISIBILITIES.CLIENT_VISIBLE;
      }
    }

    // 6. Convert file to Buffer and validate
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const validation = validateUploadedDocument(
      buffer,
      file.name,
      file.type,
      requestId
    );

    if (!validation.valid || !validation.storageKey || !validation.sanitizedFilename) {
      return NextResponse.json({ error: validation.error || 'فشل التحقق من أمان الملف' }, { status: 400 });
    }

    // 7. Execute storage upload
    const storageDriver = getStorageDriver();
    let uploadedKey: string;
    try {
      uploadedKey = await storageDriver.upload(
        buffer,
        validation.storageKey,
        validation.verifiedMimeType!
      );
    } catch (storageErr: any) {
      console.error('Storage upload failure:', storageErr);
      return NextResponse.json(
        { error: 'فشل في حفظ الملف في وحدة التخزين الآمنة: ' + (storageErr.message || 'Storage error') },
        { status: 500 }
      );
    }

    // 8. Compensating Operations: Insert DB metadata, delete storage object if DB insert fails
    let docRecord;
    try {
      const displayTitle = customTitle?.trim() || validation.sanitizedFilename;

      docRecord = await prisma.serviceRequestDocument.create({
        data: {
          requestId,
          title: displayTitle,
          originalFilename: validation.sanitizedFilename,
          filePath: uploadedKey,
          storageKey: uploadedKey,
          fileSize: buffer.length,
          sizeBytes: buffer.length,
          fileType: validation.verifiedMimeType!,
          mimeType: validation.verifiedMimeType!,
          uploadedById: session.userId,
          uploadedByUserId: session.userId,
          documentType: validatedType,
          visibility: validatedVisibility,
          isConfidential: validatedVisibility === DOCUMENT_VISIBILITIES.INTERNAL_ONLY,
          isArchived: false,
        },
      });
    } catch (dbErr: any) {
      console.error('Database write failure after storage upload. Executing compensating cleanup:', dbErr);
      // Clean up orphaned storage object
      try {
        await storageDriver.delete(uploadedKey);
      } catch (cleanupErr) {
        console.error('Compensating cleanup failed to delete storage key:', uploadedKey, cleanupErr);
      }
      return NextResponse.json(
        { error: 'فشل في تسجيل بيانات المستند في قاعدة البيانات' },
        { status: 500 }
      );
    }

    // 9. Lifecycle hooks & Audit Logging
    // Rule: Do NOT change ServiceRequest.status to REPORT_READY. Status remains independent.
    if (validatedType === DOCUMENT_TYPES.FINAL_REPORT && validatedVisibility === DOCUMENT_VISIBILITIES.CLIENT_VISIBLE) {
      // Notify client if request is owned by user
      if (serviceRequest.userId) {
        await prisma.notification.create({
          data: {
            userId: serviceRequest.userId,
            titleAr: 'تم إرفاق تقرير التقييم الميداني النهائي المعتمد',
            titleEn: 'Final Field Assessment Report Published',
            messageAr: `تم إصدار تقرير التقييم الميداني النهائي لطلبكم [${serviceRequest.requestNumber}]. يمكنك الاطلاع عليه وتنزيله الآن.`,
            messageEn: `The final approved field assessment report for request [${serviceRequest.requestNumber}] is now available.`,
            type: 'SUCCESS',
            link: `/portal/client/requests/${requestId}`,
          },
        }).catch(err => console.error('Notification error:', err));
      }

      await prisma.activityLog.create({
        data: {
          userId: session.userId,
          userName: session.fullName,
          action: 'FINAL_REPORT_PUBLISHED',
          entityType: 'ServiceRequestDocument',
          entityId: docRecord.id,
          details: JSON.stringify({
            requestId,
            documentId: docRecord.id,
            documentType: validatedType,
            uploadedByUserId: session.userId,
          }),
        },
      }).catch(err => console.error('ActivityLog error:', err));
    } else {
      await prisma.activityLog.create({
        data: {
          userId: session.userId,
          userName: session.fullName,
          action: 'DOCUMENT_UPLOAD',
          entityType: 'ServiceRequestDocument',
          entityId: docRecord.id,
          details: JSON.stringify({
            requestId,
            documentId: docRecord.id,
            documentType: validatedType,
            visibility: validatedVisibility,
            uploadedByUserId: session.userId,
          }),
        },
      }).catch(err => console.error('ActivityLog error:', err));
    }

    return NextResponse.json({
      success: true,
      document: {
        id: docRecord.id,
        title: docRecord.title,
        originalFilename: docRecord.originalFilename,
        documentType: docRecord.documentType,
        visibility: docRecord.visibility,
        sizeBytes: docRecord.sizeBytes,
        mimeType: docRecord.mimeType,
        createdAt: docRecord.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Unhandled upload error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/requests/[id]/documents
 * Retrieves authorized documents for a request based on caller role & visibility.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestId = params.id;
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: { id: true, userId: true },
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const isStaff = isStaffRole(session.role);
    const isClient = session.role === ROLES.CLIENT;

    if (session.role === ROLES.TRAINEE || (!isStaff && !isClient)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let whereClause: any = { requestId };

    if (isStaff) {
      const canManage = await hasCapability(session, CAPABILITIES.MANAGE_REQUESTS);
      if (!canManage) {
        return NextResponse.json(
          { error: `Forbidden: Missing capability [${CAPABILITIES.MANAGE_REQUESTS}]` },
          { status: 403 }
        );
      }
      // Staff with manage_requests sees all documents
    } else if (isClient) {
      // IDOR check
      if (serviceRequest.userId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
      }
      // Client only sees active, client-visible documents
      whereClause = {
        requestId,
        isArchived: false,
        visibility: DOCUMENT_VISIBILITIES.CLIENT_VISIBLE,
      };
    }

    const documents = await prisma.serviceRequestDocument.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        originalFilename: true,
        documentType: true,
        visibility: true,
        sizeBytes: true,
        fileSize: true,
        mimeType: true,
        fileType: true,
        isArchived: true,
        createdAt: true,
        uploadedByUserId: true,
      },
    });

    return NextResponse.json({ success: true, documents });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
