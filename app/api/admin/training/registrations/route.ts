import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/training/registrations
 * Admin: List all training registrations with optional filters.
 * Query params: ?courseId=X&status=Y
 */
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (status) where.status = status;

    const registrations = await prisma.trainingRegistration.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            capacity: true,
            status: true,
            hasCertificate: true,
          },
        },
        certificate: {
          select: {
            id: true,
            certificateNumber: true,
            verificationCode: true,
            isRevoked: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, registrations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
