import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, ALL_CAPABILITIES, assertApiCapability } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_USERS);
    if (!gate.authorized) return gate.response!;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        organization: true,
        role: true,
        isActive: true,
        createdAt: true,
        capabilities: {
          select: {
            capability: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        ...u,
        assignedCapabilities: u.capabilities.map((c) => c.capability),
      })),
      availableCapabilities: ALL_CAPABILITIES,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
