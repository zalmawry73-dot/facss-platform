import { NextResponse } from 'next/server';
import { getAllDynamicOptions } from '@/lib/dynamic-field-options';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/field-options
 * Publicly accessible endpoint returning active categories, sources, governorates, and risk categories.
 */
export async function GET() {
  try {
    const options = await getAllDynamicOptions(true);
    return NextResponse.json({
      success: true,
      ...options,
    });
  } catch (error: any) {
    console.error('Error fetching public field options:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
