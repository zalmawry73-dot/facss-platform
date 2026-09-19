import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateResearchInput } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RESEARCH);
    if (!gate.authorized) return gate.response!;

    const publication = await prisma.researchPublication.findUnique({
      where: { id: params.id },
      include: { category: true },
    });

    if (!publication) {
      return NextResponse.json({ error: 'الدراسة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ success: true, publication });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RESEARCH);
    if (!gate.authorized) return gate.response!;

    const existing = await prisma.researchPublication.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'الدراسة غير موجودة' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateResearchInput(body, true);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات التحديث غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const updatePayload: any = {};
    const d = validation.data;

    if (body.titleAr !== undefined) updatePayload.titleAr = d.titleAr;
    if (body.titleEn !== undefined) updatePayload.titleEn = d.titleEn;
    if (body.summaryAr !== undefined) updatePayload.summaryAr = d.summaryAr;
    if (body.summaryEn !== undefined) updatePayload.summaryEn = d.summaryEn;
    if (body.contentAr !== undefined) updatePayload.contentAr = d.contentAr;
    if (body.contentEn !== undefined) updatePayload.contentEn = d.contentEn;
    if (body.author !== undefined) updatePayload.author = d.author;
    if (body.visibility !== undefined) updatePayload.visibility = d.visibility;
    if (body.status !== undefined) updatePayload.status = d.status;
    if (body.isFeatured !== undefined) updatePayload.isFeatured = d.isFeatured;

    if (body.categoryId !== undefined) {
      const categoryExists = await prisma.researchCategory.findUnique({
        where: { id: d.categoryId },
      });
      if (!categoryExists) {
        return NextResponse.json({ error: 'تصنيف البحث غير موجود' }, { status: 400 });
      }
      updatePayload.categoryId = d.categoryId;
    }

    const updated = await prisma.researchPublication.update({
      where: { id: params.id },
      data: updatePayload,
      include: { category: true },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'UPDATE_RESEARCH_PUBLICATION',
      entityType: 'ResearchPublication',
      entityId: params.id,
      details: `تحديث دراسة [${updated.titleAr}]: الحالة [${updated.status}] - الرؤية [${updated.visibility}]`,
    });

    return NextResponse.json({ success: true, publication: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RESEARCH);
    if (!gate.authorized) return gate.response!;

    const publication = await prisma.researchPublication.findUnique({
      where: { id: params.id },
    });

    if (!publication) {
      return NextResponse.json({ error: 'الدراسة غير موجودة' }, { status: 404 });
    }

    // Default safe action: archive instead of permanent deletion
    const archived = await prisma.researchPublication.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'ARCHIVE_RESEARCH_PUBLICATION',
      entityType: 'ResearchPublication',
      entityId: params.id,
      details: `أرشفة الدراسة [${publication.titleAr}] بدلاً من الحذف الفيزيائي`,
    });

    return NextResponse.json({
      success: true,
      message: 'تمت أرشفة الدراسة بنجاح',
      publication: archived,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
