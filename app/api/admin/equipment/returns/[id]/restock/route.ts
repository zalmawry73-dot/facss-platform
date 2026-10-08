import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { executeReturnRestockTransaction } from '@/lib/equipment-rules';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_INVENTORY);
    if (!gate.authorized) return gate.response!;

    await executeReturnRestockTransaction({
      returnId: params.id,
      actorId: session!.userId,
      actorName: session!.fullName || 'Staff',
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'RESTOCK_RETURNED_EQUIPMENT',
      entityType: 'EquipmentReturn',
      entityId: params.id,
      details: `إعادة إدخال المعدات المرتجعة إلى المخزون المتاح بعد اجتياز الفحص الفني بنجاح`,
    });

    return NextResponse.json({
      success: true,
      message: 'تم اجتياز الفحص الفني وإعادة إدخال المعدات المرتجعة إلى المخزون المتاح بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
