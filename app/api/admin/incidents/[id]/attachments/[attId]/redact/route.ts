import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';
import {
  getIncidentAttachmentFromDisk,
  saveIncidentAttachmentToDisk,
  stripMetadataIfSupported,
} from '@/lib/storage/incident-attachments';
import { logActivity } from '@/lib/audit';
import path from 'path';

interface RouteContext {
  params: { id: string; attId: string };
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح: تنقيح المرفقات واعتماد نسخها الآمنة محصور بالإدارة العليا (SUPER_ADMIN) حصراً' },
        { status: 403 }
      );
    }

    const attachment = await prisma.incidentAttachment.findUnique({
      where: { id: params.attId },
      include: {
        incident: { select: { id: true, incidentNumber: true } },
      },
    });

    if (!attachment || attachment.incidentId !== params.id) {
      return NextResponse.json({ error: 'المرفق الأصلي غير موجود' }, { status: 404 });
    }

    // Read original file buffer
    const originalBuffer = await getIncidentAttachmentFromDisk(attachment.storageKey);
    if (!originalBuffer) {
      return NextResponse.json({ error: 'ملف المرفق الأصلي غير متوفر على القرص' }, { status: 404 });
    }

    const ext = path.extname(attachment.fileName).toLowerCase();

    // Strip EXIF / GPS metadata
    const stripResult = stripMetadataIfSupported(originalBuffer, attachment.mimeType, ext);
    if (!stripResult.success || !stripResult.strippedBuffer) {
      return NextResponse.json(
        {
          error: stripResult.error || 'تعذر تجريد البيانات الوصفية تلقائياً لهذا الملف. يمنع مشاركته بصيغته المنقحة لحماية سرية المصدر والموقع.',
        },
        { status: 400 }
      );
    }

    // Save redacted file to private disk
    const safeFileName = `redacted_${attachment.fileName}`;
    const saved = await saveIncidentAttachmentToDisk(stripResult.strippedBuffer, safeFileName);

    // Create new attachment record marked REDACTED_SAFE
    const safeAttachment = await prisma.incidentAttachment.create({
      data: {
        incidentId: params.id,
        fileName: safeFileName,
        fileSize: saved.fileSize,
        mimeType: attachment.mimeType,
        storageKey: saved.storageKey,
        sensitivity: 'REDACTED_SAFE',
        hasExifStripped: true,
        uploadedByUserId: session.userId,
      },
    });

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'REDACT_ATTACHMENT',
      entityType: 'IncidentAttachment',
      entityId: safeAttachment.id,
      details: `تجريد بيانات EXIF/GPS واعتماد مرفق منقح آمن [${safeFileName}] للبلاغ [${attachment.incident.incidentNumber}]`,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'تم تجريد بيانات EXIF/GPS الجغرافية واعتماد المرفق المنقح بنجاح للموظفين المكلفين.',
        attachment: safeAttachment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
