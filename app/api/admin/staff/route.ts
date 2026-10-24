import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { STAFF_ROLES, isStaffRole, ROLES } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/staff
 * Returns list of active operational staff eligible for assignment
 * Accessible by any authenticated staff member (Admin, Operations Manager, Focal Point).
 */
export async function GET() {
  try {
    const session = await getCurrentUser(true);
    if (!session || !isStaffRole(session.role)) {
      return NextResponse.json({ error: 'Unauthorized: Staff access required' }, { status: 401 });
    }

    const staff = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: STAFF_ROLES },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
