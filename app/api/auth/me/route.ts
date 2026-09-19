import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getCurrentUser(true);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      phone: true,
      organization: true,
      avatar: true,
      isActive: true,
      clientProfile: true,
    }
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}
