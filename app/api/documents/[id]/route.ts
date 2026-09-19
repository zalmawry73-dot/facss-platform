import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole, ROLES, CAPABILITIES, hasCapability } from '@/lib/rbac';
import { DOCUMENT_TYPES } from '@/lib/validations/documents';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * DELETE /api/documents/[id]
 * Soft-delete / Archive policy.
 * Marks document as isArchived = true without physically deleting files from disk.
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const documentId = params.id;
    const doc = await prisma.serviceRequestDocument.findUnique({
      where: { id: documentId },
      include: {
        request: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
      },
    });

    if (!doc || !doc.request) {
      return NextResponse.json({ error: 'المستند غير موجود' }, { status: 404 });
    }

    const isStaff = isStaffRole(session.role);
    const isClient = session.role === ROLES.CLIENT;

    if (session.role === ROLES.TRAINEE || (!isStaff && !isClient)) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    if (isStaff) {
      const canManage = await hasCapability(session, CAPABILITIES.MANAGE_REQUESTS);
      if (!canManage) {
        return NextResponse.json(
          { error: `Forbidden: Missing capability [${CAPABILITIES.MANAGE_REQUESTS}]` },
          { status: 403 }
        );
      }
    } else if (isClient) {
      // Client can only archive their own uploaded attachments on non-completed requests
      if (doc.request.userId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
      }
      if (doc.documentType !== DOCUMENT_TYPES.CLIENT_ATTACHMENT) {
        return NextResponse.json(
          { error: 'Forbidden: Clients cannot archive center documents or reports' },
          { status: 403 }
        );
      }
    }

    // Execute Soft Delete / Archive (Never physically delete on archive)
    const updated = await prisma.serviceRequestDocument.update({
      where: { id: documentId },
      data: { isArchived: true },
    });

    // Audit Logging
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        userName: session.fullName,
        action: 'DOCUMENT_ARCHIVE',
        entityType: 'ServiceRequestDocument',
        entityId: doc.id,
        details: JSON.stringify({
          requestId: doc.requestId,
          documentId: doc.id,
          documentType: doc.documentType,
        }),
      },
    }).catch(err => console.error('ActivityLog error on archive:', err));

    return NextResponse.json({
      success: true,
      message: 'تمت أرشفة المستند بنجاح وحجبه عن العرض.',
      documentId: updated.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
