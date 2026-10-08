import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { LocalStorageDriver } from '@/lib/storage';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/training/trainers/[id]/documents
 * List qualifications and certificates of a trainer
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const documents = await prisma.trainerDocument.findMany({
      where: { trainerId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/training/trainers/[id]/documents
 * Upload a trainer qualification or certification document
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const trainer = await prisma.trainer.findUnique({
      where: { id: params.id },
      select: { id: true, fullNameAr: true },
    });

    if (!trainer) {
      return NextResponse.json({ error: 'المدرب غير موجود' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string | null)?.trim();
    const documentType = (formData.get('documentType') as string | null) || 'CERTIFICATION';
    const issuingBody = (formData.get('issuingBody') as string | null)?.trim() || null;
    const issueDateStr = formData.get('issueDate') as string | null;
    const expiryDateStr = formData.get('expiryDate') as string | null;
    const verificationStatus = (formData.get('verificationStatus') as string | null) || 'VERIFIED';

    if (!file) {
      return NextResponse.json({ error: 'ملف الوثيقة مطلوب' }, { status: 400 });
    }

    if (!title || title.length < 2) {
      return NextResponse.json({ error: 'عنوان الوثيقة مطلوب' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. الأنواع المسموحة: PDF, Word, Images' }, { status: 400 });
    }

    const rawFileName = file.name || 'trainer-doc.bin';
    const sanitizedFileName = rawFileName.replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, '_');
    const storageKey = `trainer_docs/${trainer.id}/${Date.now()}_${sanitizedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storage = new LocalStorageDriver();
    await storage.upload(buffer, storageKey, file.type);

    const doc = await prisma.trainerDocument.create({
      data: {
        trainerId: trainer.id,
        title,
        documentType,
        issuingBody,
        issueDate: issueDateStr ? new Date(issueDateStr) : null,
        expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
        verificationStatus,
        fileKey: storageKey,
        fileName: sanitizedFileName,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: session!.userId,
      },
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'UPLOAD_TRAINER_DOCUMENT',
      entityType: 'TrainerDocument',
      entityId: doc.id,
      details: `رفع وثيقة اعتماد/مؤهل [${doc.title}] للمدرب [${trainer.fullNameAr}]`,
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
