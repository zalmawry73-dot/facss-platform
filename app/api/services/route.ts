import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        slug: true,
        titleAr: true,
        titleEn: true,
        shortDescAr: true,
        categoryId: true,
      }
    });

    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
