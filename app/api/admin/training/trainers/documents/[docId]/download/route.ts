import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { LocalStorageDriver } from '@/lib/storage';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { docId: string };
}

/**
 * GET /api/admin/training/trainers/documents/[docId]/download
 * Secure download of trainer qualification documents (Admin only)
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const doc = await prisma.trainerDocument.findUnique({
      where: { id: params.docId },
      include: { trainer: { select: { fullNameAr: true } } },
    });

    if (!doc) {
      return NextResponse.json({ error: 'الوثيقة غير موجودة' }, { status: 404 });
    }

    const storage = new LocalStorageDriver();
    const fileResult = await storage.get(doc.fileKey);

    if (!fileResult) {
      return NextResponse.json({ error: 'الملف غير موجود في خادم التخزين' }, { status: 404 });
    }

    const { buffer, mimeType } = fileResult;
    const encodedFileName = encodeURIComponent(doc.fileName || 'trainer-qualification');

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': doc.mimeType || mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
