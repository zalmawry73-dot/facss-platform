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
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/training/[id]/materials
 * List all training materials for a course (Admin / Training Manager)
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const materials = await prisma.trainingMaterial.findMany({
      where: { courseId: params.id },
      include: {
        uploadedBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, materials });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/training/[id]/materials
 * Upload a training material file for course [id]
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      select: { id: true, titleAr: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة التدريبية غير موجودة' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string | null)?.trim();
    const description = (formData.get('description') as string | null)?.trim() || null;
    const visibility = (formData.get('visibility') as string | null) || 'ENROLLED_TRAINEES';
    const sortOrder = parseInt((formData.get('sortOrder') as string | null) || '0', 10);

    if (!file) {
      return NextResponse.json({ error: 'الملف مطلوب' }, { status: 400 });
    }

    if (!title || title.length < 2) {
      return NextResponse.json({ error: 'عنوان المادة التدريبية مطلوب (حرفان على الأقل)' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'نوع الملف غير مدعوم. الأنواع المسموحة: PDF, Word, PowerPoint, Excel, Images' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'حجم الملف يتجاوز الحد الأقصى المسموح (50 ميجابايت)' },
        { status: 400 }
      );
    }

    const validVisibilities = ['INTERNAL', 'ENROLLED_TRAINEES', 'PUBLIC'];
    const safeVisibility = validVisibilities.includes(visibility) ? visibility : 'ENROLLED_TRAINEES';

    // Sanitize filename
    const rawFileName = file.name || 'material.bin';
    const sanitizedFileName = rawFileName.replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, '_');
    const storageKey = `materials/${course.id}/${Date.now()}_${sanitizedFileName}`;

    // Read and save buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storage = new LocalStorageDriver();
    await storage.upload(buffer, storageKey, file.type);

    const material = await prisma.trainingMaterial.create({
      data: {
        courseId: course.id,
        title,
        description,
        fileKey: storageKey,
        fileName: sanitizedFileName,
        fileSize: file.size,
        mimeType: file.type,
        visibility: safeVisibility,
        sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
        uploadedById: session!.userId,
      },
      include: {
        uploadedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'UPLOAD_TRAINING_MATERIAL',
      entityType: 'TrainingMaterial',
      entityId: material.id,
      details: `رفع مادة تدريبية [${material.title}] للدورة [${course.titleAr}] بصلاحية [${material.visibility}]`,
    });

    return NextResponse.json({ success: true, material }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
