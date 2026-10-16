import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Requirement 2: Centralized validation via getCurrentUser(true) enforcing tokenVersion & isActive
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
      tokenVersion: true,
    }
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}
