import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateInspectionInput } from '@/lib/validations/equipment';
import { generateReferenceNumber } from '@/lib/equipment-rules';
import { logActivity } from '@/lib/audit';
import { InspectionResult, InspectionType, ItemStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_INSPECTIONS);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const result = searchParams.get('result');
    const type = searchParams.get('type');

    const where: any = {};
    if (productId) where.productId = productId;
    if (result) where.result = result as InspectionResult;
    if (type) where.inspectionType = type as InspectionType;

    const inspections = await prisma.equipmentInspection.findMany({
      where,
      include: {
        product: { select: { id: true, sku: true, nameAr: true, nameEn: true, unit: true } },
        trackedItem: { select: { id: true, serialNumber: true, batchNumber: true, status: true } },
        inspector: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { inspectionDate: 'desc' },
    });

    return NextResponse.json({
      success: true,
      inspections,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_INSPECTIONS);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const validation = validateInspectionInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات الفحص الفني غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;

    // Verify product exists
    const product = await prisma.equipmentProduct.findUnique({
      where: { id: input.productId },
    });
    if (!product) {
      return NextResponse.json({ error: 'صنف المعدات غير موجود' }, { status: 400 });
    }

    const inspectionNumber = await generateReferenceNumber('FACSS-INSP', 'equipmentInspection', 'inspectionNumber');

    const inspection = await prisma.equipmentInspection.create({
      data: {
        inspectionNumber,
        productId: input.productId,
        trackedItemId: input.trackedItemId,
        inspectionType: input.inspectionType,
        result: input.result,
        inspectorId: session!.userId,
        checklistSummary: input.checklistSummary,
        findings: input.findings,
        correctiveActions: input.correctiveActions,
        nextInspectionDate: input.nextInspectionDate ? new Date(input.nextInspectionDate) : null,
        documentUrl: input.documentUrl,
      },
      include: {
        product: true,
        trackedItem: true,
        inspector: { select: { id: true, fullName: true } },
      },
    });

    // Update tracked item status if inspection failed or passed
    if (input.trackedItemId) {
      if (input.result === InspectionResult.FAIL) {
        await prisma.trackedEquipmentItem.update({
          where: { id: input.trackedItemId },
          data: { status: ItemStatus.MAINTENANCE },
        });
      } else if (input.result === InspectionResult.PASS) {
        await prisma.trackedEquipmentItem.update({
          where: { id: input.trackedItemId },
          data: { status: ItemStatus.AVAILABLE },
        });
      }
    }

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'CONDUCT_EQUIPMENT_INSPECTION',
      entityType: 'EquipmentInspection',
      entityId: inspection.id,
      details: `تنفيذ فحص فني [${inspection.inspectionNumber}] للصنف [${product.sku}]: النتيجة [${inspection.result}]`,
    });

    return NextResponse.json({ success: true, inspection }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
