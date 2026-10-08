import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_INVENTORY);
    if (!gate.authorized) return gate.response!;

    const delivery = await prisma.equipmentDelivery.findUnique({
      where: { id: params.id },
      include: {
        serviceRequest: {
          include: {
            user: { select: { id: true, fullName: true, organization: true, email: true, phone: true } },
          },
        },
        deliveredBy: { select: { id: true, fullName: true, email: true } },
        items: {
          include: {
            product: true,
            trackedItem: true,
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'سجل التسليم غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, delivery });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
