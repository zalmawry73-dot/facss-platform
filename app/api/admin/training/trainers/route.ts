import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/training/trainers
 * List all trainers in the Trainer Registry
 */
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get('isActive');
    const search = searchParams.get('search')?.trim();

    const where: any = {};
    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true';
    }
    if (search) {
      where.OR = [
        { fullNameAr: { contains: search, mode: 'insensitive' } },
        { fullNameEn: { contains: search, mode: 'insensitive' } },
        { professionalTitleAr: { contains: search, mode: 'insensitive' } },
        { specializations: { contains: search, mode: 'insensitive' } },
      ];
    }

    const trainers = await prisma.trainer.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        courseAssignments: {
          include: {
            course: { select: { id: true, titleAr: true, status: true, startDate: true } },
          },
        },
        documents: {
          select: { id: true, title: true, documentType: true, verificationStatus: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, trainers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/training/trainers
 * Create a new trainer profile in the Trainer Registry
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));

    if (!body.fullNameAr || typeof body.fullNameAr !== 'string' || body.fullNameAr.trim().length < 3) {
      return NextResponse.json({ error: 'اسم المدرب بالعربية مطلوب (3 أحرف على الأقل)' }, { status: 400 });
    }

    if (!body.professionalTitleAr || typeof body.professionalTitleAr !== 'string' || body.professionalTitleAr.trim().length < 2) {
      return NextResponse.json({ error: 'المسمى المهني للمدرب مطلوب' }, { status: 400 });
    }

    // Optional user relation validation
    if (body.userId) {
      const userExists = await prisma.user.findUnique({ where: { id: body.userId } });
      if (!userExists) {
        return NextResponse.json({ error: 'حساب المستخدم المحدد غير موجود' }, { status: 400 });
      }
      const alreadyLinked = await prisma.trainer.findUnique({ where: { userId: body.userId } });
      if (alreadyLinked) {
        return NextResponse.json({ error: 'حساب المستخدم مرتبط بمدرب آخر بالفعل' }, { status: 400 });
      }
    }

    const trainer = await prisma.trainer.create({
      data: {
        userId: body.userId || null,
        fullNameAr: body.fullNameAr.trim(),
        fullNameEn: body.fullNameEn ? body.fullNameEn.trim() : null,
        professionalTitleAr: body.professionalTitleAr.trim(),
        professionalTitleEn: body.professionalTitleEn ? body.professionalTitleEn.trim() : null,
        specializations: body.specializations ? String(body.specializations).trim() : null,
        bioAr: body.bioAr ? String(body.bioAr).trim() : null,
        bioEn: body.bioEn ? String(body.bioEn).trim() : null,
        qualifications: body.qualifications ? String(body.qualifications).trim() : null,
        certifications: body.certifications ? String(body.certifications).trim() : null,
        email: body.email ? String(body.email).trim() : null,
        phone: body.phone ? String(body.phone).trim() : null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'CREATE_TRAINER',
      entityType: 'Trainer',
      entityId: trainer.id,
      details: `تسجيل مدرب جديد في سجل المدربين: [${trainer.fullNameAr}] - [${trainer.professionalTitleAr}]`,
    });

    return NextResponse.json({ success: true, trainer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
