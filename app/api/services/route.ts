import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { 
        isActive: true,
        category: { isActive: true }
      },
      orderBy: [
        { category: { order: 'asc' } },
        { order: 'asc' }
      ],
      select: {
        id: true,
        slug: true,
        titleAr: true,
        titleEn: true,
        shortDescAr: true,
        shortDescEn: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            slug: true,
            titleAr: true,
            titleEn: true,
            order: true,
          }
        }
      }
    });

    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
