import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { assertApiCapability, CAPABILITIES } from '@/lib/rbac';
import { calculateExecutiveKpis, type KpiPeriod } from '@/lib/kpi-engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/kpis
 * Executive KPI Intelligence endpoint.
 * Protected by granular VIEW_KPI capability.
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  try {
    const session = await getCurrentUser(true);
    const authCheck = await assertApiCapability(session, CAPABILITIES.VIEW_KPI);
    if (!authCheck.authorized) {
      return authCheck.response!;
    }

    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get('range') || '30d';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const validRanges: KpiPeriod[] = ['today', '7d', '30d', 'custom'];
    const period: KpiPeriod = validRanges.includes(rangeParam as KpiPeriod)
      ? (rangeParam as KpiPeriod)
      : '30d';

    const kpiData = await calculateExecutiveKpis(
      period,
      startDateParam,
      endDateParam
    );

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      latencyMs,
      data: kpiData,
    });
  } catch (error: any) {
    console.error('Error calculating executive KPIs:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حساب المؤشرات التشغيلية: ' + error.message },
      { status: 500 }
    );
  }
}
