import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, canAccessRedactedIncident, canAccessOriginalIncident } from '@/lib/rbac';
import { getIncidentAttachmentFromDisk } from '@/lib/storage/incident-attachments';

interface RouteContext {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح: يلزم تسجيل الدخول' }, { status: 401 });
    }

    const attachment = await prisma.incidentAttachment.findUnique({
      where: { id: params.id },
      include: {
        incident: { select: { id: true, incidentNumber: true } },
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'المرفق غير موجود' }, { status: 404 });
    }

    const isSuperAdmin = session.role === ROLES.SUPER_ADMIN;

    // Security Gate 1: Original Sensitive Attachments
    // Strictly restricted to SUPER_ADMIN ONLY!
    if (attachment.sensitivity === 'ORIGINAL_SENSITIVE') {
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: 'غير مصرح: المرفقات الأصلية الحساسة محصورة بمسؤولي الإدارة العليا (SUPER_ADMIN) حصراً' },
          { status: 403 }
        );
      }
    }

    // Security Gate 2: Redacted Safe Attachments
    // Staff access requires passing Triple-Gate for this specific incident!
    if (attachment.sensitivity === 'REDACTED_SAFE' && !isSuperAdmin) {
      const gate = await canAccessRedactedIncident(session, attachment.incidentId);
      if (!gate.authorized) {
        return NextResponse.json(
          { error: gate.error || 'غير مصرح: لا تملك إسناداً نشطاً للبلاغ للاطلاع على مرفقاته المنقحة' },
          { status: gate.status || 403 }
        );
      }
    }

    // Retrieve file buffer from private disk
    const buffer = await getIncidentAttachmentFromDisk(attachment.storageKey);
    if (!buffer) {
      return NextResponse.json({ error: 'ملف المرفق غير موجود على خادم التخزين الخاص' }, { status: 404 });
    }

    // Determine disposition (inline for images/pdf, attachment for others)
    const isInline = attachment.mimeType.startsWith('image/') || attachment.mimeType === 'application/pdf';
    const disposition = isInline ? 'inline' : 'attachment';

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': attachment.mimeType || 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(attachment.fileName)}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
