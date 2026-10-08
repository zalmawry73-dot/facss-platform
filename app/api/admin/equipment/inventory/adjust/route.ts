import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateAdjustmentInput } from '@/lib/validations/equipment';
import { executeAdjustmentTransaction } from '@/lib/equipment-rules';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_INVENTORY);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const validation = validateAdjustmentInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات تعديل المخزون غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { productId, trackedItemId, delta, reason } = validation.data;

    const result = await executeAdjustmentTransaction({
      productId,
      trackedItemId,
      delta,
      reason,
      actorId: session!.userId,
      actorName: session!.fullName || 'Staff',
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'ADJUST_INVENTORY_STOCK',
      entityType: 'EquipmentProduct',
      entityId: productId,
      details: `تعديل يدوي للمخزون: الصنف [${result.product.sku}] دلتا (${delta > 0 ? `+${delta}` : delta})، الرصيد الجديد (${result.product.quantityOnHand})، السبب: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      message: 'تم تعديل المخزون وتوثيق الحركة بنجاح في السجل المركزي',
      product: result.product,
      movement: result.movement,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
