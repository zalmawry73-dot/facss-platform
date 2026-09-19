import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole, ROLES, CAPABILITIES, hasCapability } from '@/lib/rbac';
import { getStorageDriver } from '@/lib/storage';
import { DOCUMENT_VISIBILITIES, sanitizeOriginalFilename } from '@/lib/validations/documents';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/documents/[id]/download
 * Secure, authorized, streaming download endpoint.
 * Enforces IDOR protection, visibility gates, audit logging,
 * and security response headers (Content-Disposition, nosniff).
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    // 1. Session verification & active status check
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const documentId = params.id;

    // 2. Fetch document with parent request
    const doc = await prisma.serviceRequestDocument.findUnique({
      where: { id: documentId },
      include: {
        request: {
          select: {
            id: true,
            userId: true,
            requestNumber: true,
          },
        },
      },
    });

    if (!doc || !doc.request) {
      return NextResponse.json({ error: 'المستند المطلوب غير موجود' }, { status: 404 });
    }

    const isStaff = isStaffRole(session.role);
    const isClient = session.role === ROLES.CLIENT;

    // Hard deny for Trainee and unauthorized roles
    if (session.role === ROLES.TRAINEE || (!isStaff && !isClient)) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // 3. Authorization Gates
    if (isClient) {
      // IDOR Check: Non-staff client can ONLY download documents belonging to their own request
      if (doc.request.userId !== session.userId) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to download this document' },
          { status: 403 }
        );
      }

      // Visibility Gate: Client CANNOT download INTERNAL_ONLY documents
      if (doc.visibility !== DOCUMENT_VISIBILITIES.CLIENT_VISIBLE) {
        return NextResponse.json(
          { error: 'Forbidden: Confidential internal document' },
          { status: 403 }
        );
      }

      // Archive Gate: Client cannot download archived documents
      if (doc.isArchived) {
        return NextResponse.json(
          { error: 'المستند غير متاح حالياً (مؤرشف)' },
          { status: 404 }
        );
      }
    } else if (isStaff) {
      // Staff must possess manage_requests capability
      const canManage = await hasCapability(session, CAPABILITIES.MANAGE_REQUESTS);
      if (!canManage) {
        return NextResponse.json(
          { error: `Forbidden: Missing capability [${CAPABILITIES.MANAGE_REQUESTS}]` },
          { status: 403 }
        );
      }
    }

    // 4. Retrieve binary data from Storage Driver
    const storageDriver = getStorageDriver();
    const storageKey = doc.storageKey || doc.filePath;

    if (!storageKey) {
      return NextResponse.json({ error: 'Storage reference is missing' }, { status: 500 });
    }

    const fileData = await storageDriver.get(storageKey);
    if (!fileData || !fileData.buffer) {
      return NextResponse.json({ error: 'ملف المستند غير موجود في وحدة التخزين' }, { status: 404 });
    }

    // 5. Audit Logging (actor, request, document, timestamp; NO file contents or secrets)
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        userName: session.fullName,
        action: 'DOCUMENT_DOWNLOAD',
        entityType: 'ServiceRequestDocument',
        entityId: doc.id,
        details: JSON.stringify({
          requestId: doc.requestId,
          documentId: doc.id,
          documentType: doc.documentType,
        }),
      },
    }).catch(err => console.error('ActivityLog error on download:', err));

    // 6. Format safe Content-Disposition filename
    const rawName = doc.originalFilename || doc.title || 'document';
    const ext = (doc.mimeType?.split('/')[1] || 'bin').replace('jpeg', 'jpg');
    const safeFilename = sanitizeOriginalFilename(rawName, ext);

    // 7. Security Response Headers
    const headers = new Headers();
    headers.set('Content-Type', doc.mimeType || doc.fileType || fileData.mimeType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
    headers.set('Content-Length', fileData.buffer.length.toString());
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return new Response(new Uint8Array(fileData.buffer), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error('Download handler error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
