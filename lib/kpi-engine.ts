import prisma from './prisma';

export type KpiPeriod = 'today' | '7d' | '30d' | 'custom';

export interface KpiMetric<T = number> {
  value: T | null;
  displayValue: string;
  numerator?: number | null;
  denominator?: number | null;
  period: KpiPeriod;
  comparisonPeriod?: {
    previousValue: T | null;
    percentageChange: number | null;
    trend: 'up' | 'down' | 'neutral' | 'no_data';
  } | null;
  status: 'healthy' | 'warning' | 'critical' | 'neutral' | 'no_data';
  source: string;
  lastCalculatedAt: string;
  isSufficientData: boolean;
  notes?: string;
}

export interface OperationsKpis {
  totalIncidents: KpiMetric<number>;
  openIncidents: KpiMetric<number>;
  criticalIncidents: KpiMetric<number>;
  closedIncidents: KpiMetric<number>;
  averageFirstResponseTimeMinutes: KpiMetric<number>;
  slaComplianceRate: KpiMetric<number>;
  slaBreachRate: KpiMetric<number>;
  escalatedIncidents: KpiMetric<number>;
  unassignedIncidents: KpiMetric<number>;
  incidentsByCategory: Record<string, number>;
  incidentsByPriority: Record<string, number>;
  incidentsByStatus: Record<string, number>;
}

export interface RiskKpis {
  totalActiveRisks: KpiMetric<number>;
  criticalHighRisks: KpiMetric<number>;
  overdueMitigations: KpiMetric<number>;
  completedMitigations: KpiMetric<number>;
  treatmentCompletionRate: KpiMetric<number>;
  risksByCategory: Record<string, number>;
  risksByStatus: Record<string, number>;
}

export interface ComplaintsAndServiceKpis {
  totalComplaints: KpiMetric<number>;
  openComplaints: KpiMetric<number>;
  resolvedComplaints: KpiMetric<number>;
  complaintSlaComplianceRate: KpiMetric<number>;
  overdueComplaints: KpiMetric<number>;
  averageResolutionTimeHours: KpiMetric<number>;
  newServiceRequests: KpiMetric<number>;
  activeServiceRequests: KpiMetric<number>;
  completedServiceRequests: KpiMetric<number>;
}

export interface ReportQualityKpis {
  reportsAwaitingQa: KpiMetric<number>;
  reportsApproved: KpiMetric<number>;
  reportsRejected: KpiMetric<number>;
  qaPassRate: KpiMetric<number>;
  averageQaTurnaroundHours: KpiMetric<number>;
  deliveredReports: KpiMetric<number>;
  clientAcceptedReports: KpiMetric<number>;
}

export interface TrainingKpis {
  totalTrainees: KpiMetric<number>;
  activeCourses: KpiMetric<number>;
  completedCourses: KpiMetric<number>;
  attendanceRate: KpiMetric<number>;
  evaluationParticipationRate: KpiMetric<number>;
  averageImprovementRate: KpiMetric<number>;
  evaluationPairStats: {
    totalPairsCompleted: number;
    missingPreCount: number;
    missingPostCount: number;
    zeroBaselineCount: number;
  };
}

export interface ClientSatisfactionKpis {
  averageSatisfaction: KpiMetric<number>;
  totalResponses: KpiMetric<number>;
  sampleSizeLabel: string;
  isSmallSample: boolean;
  serviceQualityAverage: KpiMetric<number>;
  timelinessAverage: KpiMetric<number>;
  communicationAverage: KpiMetric<number>;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface EquipmentKpis {
  equipmentReadinessRate: KpiMetric<number>;
  totalActiveProducts: KpiMetric<number>;
  totalStockOnHand: KpiMetric<number>;
  totalStockReserved: KpiMetric<number>;
  totalStockAvailable: KpiMetric<number>;
  lowStockCount: KpiMetric<number>;
  outOfStockCount: KpiMetric<number>;
  pendingProcurements: KpiMetric<number>;
  pendingReceiving: KpiMetric<number>;
  pendingInspections: KpiMetric<number>;
  failedInspections: KpiMetric<number>;
  expiringSoonItems: KpiMetric<number>;
  expiredItems: KpiMetric<number>;
  pendingDeliveries: KpiMetric<number>;
  completedDeliveries: KpiMetric<number>;
}

export interface ExecutiveDashboardKpis {
  period: KpiPeriod;
  dateRange: {
    startDate: string;
    endDate: string;
    prevStartDate: string;
    prevEndDate: string;
  };
  operations: OperationsKpis;
  risks: RiskKpis;
  complaintsAndServices: ComplaintsAndServiceKpis;
  qualityAssurance: ReportQualityKpis;
  training: TrainingKpis;
  clientSatisfaction: ClientSatisfactionKpis;
  equipment: EquipmentKpis;
  generatedAt: string;
}

export function getDateBoundaries(
  period: KpiPeriod = '30d',
  customStart?: string | null,
  customEnd?: string | null
): {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
} {
  const now = new Date();

  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 1);
    const prevEnd = new Date(end);
    prevEnd.setDate(prevEnd.getDate() - 1);
    return { start, end, prevStart, prevEnd };
  }

  if (period === '7d') {
    const end = new Date(now.getTime() + 60 * 1000);
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevEnd = new Date(start);
    const prevStart = new Date(prevEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { start, end, prevStart, prevEnd };
  }

  if (period === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start);
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { start, end, prevStart, prevEnd };
  }

  // Default: '30d'
  const end = new Date(now.getTime() + 60 * 1000);
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const prevEnd = new Date(start);
  const prevStart = new Date(prevEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end, prevStart, prevEnd };
}

function calculateComparison(
  current: number,
  previous: number | null | undefined
): KpiMetric['comparisonPeriod'] {
  if (previous === null || previous === undefined || previous === 0) {
    return null;
  }
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100 * 10) / 10;
  return {
    previousValue: previous,
    percentageChange: pct,
    trend: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral',
  };
}

/**
 * Calculates all executive and operational KPIs across the 6 system domains
 * using authentic PostgreSQL database records.
 */
export async function calculateExecutiveKpis(
  period: KpiPeriod = '30d',
  customStart?: string | null,
  customEnd?: string | null
): Promise<ExecutiveDashboardKpis> {
  const boundaries = getDateBoundaries(period, customStart, customEnd);
  const { start, end, prevStart, prevEnd } = boundaries;
  const nowIso = new Date().toISOString();

  // Parallel Execution of All Domain Computations
  const [
    operationsKpis,
    riskKpis,
    complaintsAndServicesKpis,
    qualityKpis,
    trainingKpis,
    satisfactionKpis,
    equipmentKpis,
  ] = await Promise.all([
    calculateOperationsKpis(period, start, end, prevStart, prevEnd, nowIso),
    calculateRiskKpis(period, start, end, nowIso),
    calculateComplaintsAndServicesKpis(period, start, end, prevStart, prevEnd, nowIso),
    calculateQualityAssuranceKpis(period, start, end, nowIso),
    calculateTrainingKpis(period, start, end, nowIso),
    calculateClientSatisfactionKpis(period, start, end, nowIso),
    calculateEquipmentKpis(period, start, end, nowIso),
  ]);

  return {
    period,
    dateRange: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      prevStartDate: prevStart.toISOString(),
      prevEndDate: prevEnd.toISOString(),
    },
    operations: operationsKpis,
    risks: riskKpis,
    complaintsAndServices: complaintsAndServicesKpis,
    qualityAssurance: qualityKpis,
    training: trainingKpis,
    clientSatisfaction: satisfactionKpis,
    equipment: equipmentKpis,
    generatedAt: nowIso,
  };
}

/**
 * Domain 1: Operations, Incidents & SLA Analytics
 */
async function calculateOperationsKpis(
  period: KpiPeriod,
  start: Date,
  end: Date,
  prevStart: Date,
  prevEnd: Date,
  nowIso: string
): Promise<OperationsKpis> {
  const [
    currentTotalIncidents,
    prevTotalIncidents,
    openIncidentsCount,
    criticalIncidentsCount,
    closedIncidentsCount,
    escalatedIncidentsCount,
    allIncidentsInPeriod,
    allIncidentsPrevPeriod,
    categoriesGroup,
    prioritiesGroup,
    statusesGroup,
  ] = await Promise.all([
    prisma.incident.count({
      where: { createdAt: { gte: start, lte: end } },
    }),
    prisma.incident.count({
      where: { createdAt: { gte: prevStart, lte: prevEnd } },
    }),
    prisma.incident.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: { notIn: ['CLOSED', 'ARCHIVED', 'DISPROVED', 'CONTRADICTED', 'DUPLICATE'] },
      },
    }),
    prisma.incident.count({
      where: {
        createdAt: { gte: start, lte: end },
        priority: 'CRITICAL_EMERGENCY',
      },
    }),
    prisma.incident.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: 'CLOSED',
      },
    }),
    prisma.incident.count({
      where: {
        createdAt: { gte: start, lte: end },
        isEscalated: true,
      },
    }),
    prisma.incident.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: {
        id: true,
        createdAt: true,
        firstResponseAt: true,
        slaStatus: true,
        assignments: { select: { id: true } },
      },
    }),
    prisma.incident.findMany({
      where: { createdAt: { gte: prevStart, lte: prevEnd } },
      select: {
        slaStatus: true,
      },
    }),
    prisma.incident.groupBy({
      by: ['category'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { category: true },
    }),
    prisma.incident.groupBy({
      by: ['priority'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { priority: true },
    }),
    prisma.incident.groupBy({
      by: ['status'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { status: true },
    }),
  ]);

  // SLA Calculations
  const slaTrackedCurrent = allIncidentsInPeriod.filter((inc) =>
    ['ON_TIME', 'APPROACHING_BREACH', 'BREACHED', 'CLOSED_ON_TIME', 'CLOSED_BREACHED'].includes(
      inc.slaStatus || ''
    )
  );
  const compliantCount = slaTrackedCurrent.filter((inc) =>
    ['ON_TIME', 'APPROACHING_BREACH', 'CLOSED_ON_TIME'].includes(inc.slaStatus || '')
  ).length;
  const breachedCount = slaTrackedCurrent.filter((inc) =>
    ['BREACHED', 'CLOSED_BREACHED'].includes(inc.slaStatus || '')
  ).length;
  const slaDenominator = slaTrackedCurrent.length;

  const slaCompliancePct =
    slaDenominator > 0 ? Math.round((compliantCount / slaDenominator) * 100 * 10) / 10 : null;
  const slaBreachPct =
    slaDenominator > 0 ? Math.round((breachedCount / slaDenominator) * 100 * 10) / 10 : null;

  // Previous period SLA compliance
  const slaTrackedPrev = allIncidentsPrevPeriod.filter((inc) =>
    ['ON_TIME', 'APPROACHING_BREACH', 'BREACHED', 'CLOSED_ON_TIME', 'CLOSED_BREACHED'].includes(
      inc.slaStatus || ''
    )
  );
  const compliantPrevCount = slaTrackedPrev.filter((inc) =>
    ['ON_TIME', 'APPROACHING_BREACH', 'CLOSED_ON_TIME'].includes(inc.slaStatus || '')
  ).length;
  const slaCompliancePrevPct =
    slaTrackedPrev.length > 0
      ? Math.round((compliantPrevCount / slaTrackedPrev.length) * 100 * 10) / 10
      : null;

  // First Response Time (in minutes)
  const respondedIncidents = allIncidentsInPeriod.filter((inc) => inc.firstResponseAt !== null);
  let avgResponseMinutes: number | null = null;
  if (respondedIncidents.length > 0) {
    const totalMinutes = respondedIncidents.reduce((sum, inc) => {
      const startMs = inc.createdAt.getTime();
      const respMs = inc.firstResponseAt!.getTime();
      const diffMin = Math.max(0, Math.round((respMs - startMs) / (1000 * 60)));
      return sum + diffMin;
    }, 0);
    avgResponseMinutes = Math.round((totalMinutes / respondedIncidents.length) * 10) / 10;
  }

  // Unassigned Incidents
  const unassignedCount = allIncidentsInPeriod.filter((inc) => inc.assignments.length === 0).length;

  // Category breakdown
  const incidentsByCategory: Record<string, number> = {};
  for (const item of categoriesGroup) {
    incidentsByCategory[item.category] = item._count.category;
  }

  // Priority breakdown
  const incidentsByPriority: Record<string, number> = {};
  for (const item of prioritiesGroup) {
    incidentsByPriority[item.priority] = item._count.priority;
  }

  // Status breakdown
  const incidentsByStatus: Record<string, number> = {};
  for (const item of statusesGroup) {
    incidentsByStatus[item.status] = item._count.status;
  }

  return {
    totalIncidents: {
      value: currentTotalIncidents,
      displayValue: String(currentTotalIncidents),
      period,
      comparisonPeriod: calculateComparison(currentTotalIncidents, prevTotalIncidents),
      status: currentTotalIncidents > 0 ? 'neutral' : 'no_data',
      source: 'Incident',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    openIncidents: {
      value: openIncidentsCount,
      displayValue: String(openIncidentsCount),
      period,
      status: openIncidentsCount > 10 ? 'warning' : 'neutral',
      source: 'Incident',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    criticalIncidents: {
      value: criticalIncidentsCount,
      displayValue: String(criticalIncidentsCount),
      period,
      status: criticalIncidentsCount > 0 ? 'critical' : 'healthy',
      source: 'Incident',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    closedIncidents: {
      value: closedIncidentsCount,
      displayValue: String(closedIncidentsCount),
      period,
      status: 'neutral',
      source: 'Incident',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    averageFirstResponseTimeMinutes: {
      value: avgResponseMinutes,
      displayValue:
        avgResponseMinutes !== null ? `${avgResponseMinutes} دقيقة` : 'لا توجد بيانات كافية',
      period,
      status:
        avgResponseMinutes === null
          ? 'no_data'
          : avgResponseMinutes <= 30
          ? 'healthy'
          : avgResponseMinutes <= 60
          ? 'warning'
          : 'critical',
      source: 'Incident',
      lastCalculatedAt: nowIso,
      isSufficientData: avgResponseMinutes !== null,
    },
    slaComplianceRate: {
      value: slaCompliancePct,
      displayValue: slaCompliancePct !== null ? `${slaCompliancePct}%` : 'لا توجد بيانات كافية',
      numerator: compliantCount,
      denominator: slaDenominator,
      period,
      comparisonPeriod:
        slaCompliancePrevPct !== null && slaCompliancePct !== null
          ? calculateComparison(slaCompliancePct, slaCompliancePrevPct)
          : null,
      status:
        slaCompliancePct === null
          ? 'no_data'
          : slaCompliancePct >= 90
          ? 'healthy'
          : slaCompliancePct >= 75
          ? 'warning'
          : 'critical',
      source: 'Incident',
      lastCalculatedAt: nowIso,
      isSufficientData: slaDenominator > 0,
    },
    slaBreachRate: {
      value: slaBreachPct,
      displayValue: slaBreachPct !== null ? `${slaBreachPct}%` : 'لا توجد بيانات كافية',
      numerator: breachedCount,
      denominator: slaDenominator,
      period,
      status:
        slaBreachPct === null
          ? 'no_data'
          : slaBreachPct === 0
          ? 'healthy'
          : slaBreachPct < 15
          ? 'warning'
          : 'critical',
      source: 'Incident',
      lastCalculatedAt: nowIso,
      isSufficientData: slaDenominator > 0,
    },
    escalatedIncidents: {
      value: escalatedIncidentsCount,
      displayValue: String(escalatedIncidentsCount),
      period,
      status: escalatedIncidentsCount > 0 ? 'warning' : 'healthy',
      source: 'Incident',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    unassignedIncidents: {
      value: unassignedCount,
      displayValue: String(unassignedCount),
      period,
      status: unassignedCount > 0 ? 'warning' : 'healthy',
      source: 'Incident',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    incidentsByCategory,
    incidentsByPriority,
    incidentsByStatus,
  };
}

/**
 * Domain 2: Risk Intelligence
 */
async function calculateRiskKpis(
  period: KpiPeriod,
  start: Date,
  end: Date,
  nowIso: string
): Promise<RiskKpis> {
  const [
    allRisks,
    allMitigations,
    categoriesGroup,
    statusesGroup,
  ] = await Promise.all([
    prisma.operationalRisk.findMany({
      select: {
        id: true,
        status: true,
        riskLevel: true,
        riskScore: true,
        category: true,
      },
    }),
    prisma.riskMitigationAction.findMany({
      select: {
        id: true,
        status: true,
        dueDate: true,
      },
    }),
    prisma.operationalRisk.groupBy({
      by: ['category'],
      _count: { category: true },
    }),
    prisma.operationalRisk.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ]);

  const activeRisks = allRisks.filter((r) => !['RESOLVED', 'CLOSED'].includes(r.status));
  const criticalHighRisks = activeRisks.filter(
    (r) =>
      r.riskLevel === 'CRITICAL' ||
      r.riskLevel === 'HIGH' ||
      r.riskScore >= 15
  );

  const now = new Date();
  const completedMitigations = allMitigations.filter((m) => m.status === 'COMPLETED').length;
  const overdueMitigations = allMitigations.filter(
    (m) => m.status !== 'COMPLETED' && m.dueDate && new Date(m.dueDate) < now
  ).length;

  const totalMitigations = allMitigations.length;
  const treatmentCompletionRate =
    totalMitigations > 0
      ? Math.round((completedMitigations / totalMitigations) * 100 * 10) / 10
      : null;

  const risksByCategory: Record<string, number> = {};
  for (const item of categoriesGroup) {
    risksByCategory[item.category] = item._count.category;
  }

  const risksByStatus: Record<string, number> = {};
  for (const item of statusesGroup) {
    risksByStatus[item.status] = item._count.status;
  }

  return {
    totalActiveRisks: {
      value: activeRisks.length,
      displayValue: String(activeRisks.length),
      period,
      status: activeRisks.length > 5 ? 'warning' : 'neutral',
      source: 'OperationalRisk',
      lastCalculatedAt: nowIso,
      isSufficientData: allRisks.length > 0,
    },
    criticalHighRisks: {
      value: criticalHighRisks.length,
      displayValue: String(criticalHighRisks.length),
      period,
      status: criticalHighRisks.length > 0 ? 'critical' : 'healthy',
      source: 'OperationalRisk',
      lastCalculatedAt: nowIso,
      isSufficientData: allRisks.length > 0,
    },
    overdueMitigations: {
      value: overdueMitigations,
      displayValue: String(overdueMitigations),
      period,
      status: overdueMitigations > 0 ? 'warning' : 'healthy',
      source: 'RiskMitigationAction',
      lastCalculatedAt: nowIso,
      isSufficientData: totalMitigations > 0,
    },
    completedMitigations: {
      value: completedMitigations,
      displayValue: String(completedMitigations),
      period,
      status: 'neutral',
      source: 'RiskMitigationAction',
      lastCalculatedAt: nowIso,
      isSufficientData: totalMitigations > 0,
    },
    treatmentCompletionRate: {
      value: treatmentCompletionRate,
      displayValue:
        treatmentCompletionRate !== null
          ? `${treatmentCompletionRate}%`
          : 'لا توجد بيانات كافية',
      numerator: completedMitigations,
      denominator: totalMitigations,
      period,
      status:
        treatmentCompletionRate === null
          ? 'no_data'
          : treatmentCompletionRate >= 80
          ? 'healthy'
          : treatmentCompletionRate >= 50
          ? 'warning'
          : 'critical',
      source: 'RiskMitigationAction',
      lastCalculatedAt: nowIso,
      isSufficientData: totalMitigations > 0,
    },
    risksByCategory,
    risksByStatus,
  };
}

/**
 * Domain 3: Complaints & Service Requests
 */
async function calculateComplaintsAndServicesKpis(
  period: KpiPeriod,
  start: Date,
  end: Date,
  prevStart: Date,
  prevEnd: Date,
  nowIso: string
): Promise<ComplaintsAndServiceKpis> {
  const [
    complaintsInPeriod,
    serviceRequestsInPeriod,
  ] = await Promise.all([
    prisma.contactMessage.findMany({
      where: {
        messageType: 'COMPLAINT',
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        status: true,
        slaStatus: true,
        dueAt: true,
        createdAt: true,
        resolvedAt: true,
      },
    }),
    prisma.serviceRequest.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        status: true,
      },
    }),
  ]);

  const totalComplaints = complaintsInPeriod.length;
  const openComplaints = complaintsInPeriod.filter((c) =>
    ['UNREAD', 'READ', 'IN_PROGRESS'].includes(c.status)
  ).length;
  const resolvedComplaints = complaintsInPeriod.filter((c) =>
    ['RESOLVED', 'REPLIED'].includes(c.status)
  ).length;

  const now = new Date();
  const overdueComplaints = complaintsInPeriod.filter(
    (c) =>
      c.slaStatus === 'BREACHED' ||
      (!['RESOLVED', 'REPLIED', 'ARCHIVED'].includes(c.status) && c.dueAt && new Date(c.dueAt) < now)
  ).length;

  // Complaint SLA
  const slaTrackedComplaints = complaintsInPeriod.filter((c) =>
    ['ON_TIME', 'BREACHED', 'CLOSED_ON_TIME', 'CLOSED_BREACHED'].includes(c.slaStatus || '')
  );
  const compliantComplaints = slaTrackedComplaints.filter((c) =>
    ['ON_TIME', 'CLOSED_ON_TIME'].includes(c.slaStatus || '')
  ).length;
  const complaintSlaPct =
    slaTrackedComplaints.length > 0
      ? Math.round((compliantComplaints / slaTrackedComplaints.length) * 100 * 10) / 10
      : null;

  // Average Resolution Time (in hours)
  const resolvedWithTimestamps = complaintsInPeriod.filter(
    (c) => c.resolvedAt !== null
  );
  let avgResolutionHours: number | null = null;
  if (resolvedWithTimestamps.length > 0) {
    const totalHours = resolvedWithTimestamps.reduce((sum, c) => {
      const diffHours = (c.resolvedAt!.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + Math.max(0, diffHours);
    }, 0);
    avgResolutionHours = Math.round((totalHours / resolvedWithTimestamps.length) * 10) / 10;
  }

  // Service Requests
  const newRequests = serviceRequestsInPeriod.filter((r) => r.status === 'NEW').length;
  const activeRequests = serviceRequestsInPeriod.filter((r) =>
    ['UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS'].includes(r.status)
  ).length;
  const completedRequests = serviceRequestsInPeriod.filter((r) => r.status === 'COMPLETED').length;

  return {
    totalComplaints: {
      value: totalComplaints,
      displayValue: String(totalComplaints),
      period,
      status: totalComplaints > 0 ? 'neutral' : 'no_data',
      source: 'ContactMessage',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    openComplaints: {
      value: openComplaints,
      displayValue: String(openComplaints),
      period,
      status: openComplaints > 0 ? 'warning' : 'healthy',
      source: 'ContactMessage',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    resolvedComplaints: {
      value: resolvedComplaints,
      displayValue: String(resolvedComplaints),
      period,
      status: 'neutral',
      source: 'ContactMessage',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    complaintSlaComplianceRate: {
      value: complaintSlaPct,
      displayValue: complaintSlaPct !== null ? `${complaintSlaPct}%` : 'لا توجد بيانات كافية',
      numerator: compliantComplaints,
      denominator: slaTrackedComplaints.length,
      period,
      status:
        complaintSlaPct === null
          ? 'no_data'
          : complaintSlaPct >= 85
          ? 'healthy'
          : 'warning',
      source: 'ContactMessage',
      lastCalculatedAt: nowIso,
      isSufficientData: slaTrackedComplaints.length > 0,
    },
    overdueComplaints: {
      value: overdueComplaints,
      displayValue: String(overdueComplaints),
      period,
      status: overdueComplaints > 0 ? 'critical' : 'healthy',
      source: 'ContactMessage',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    averageResolutionTimeHours: {
      value: avgResolutionHours,
      displayValue:
        avgResolutionHours !== null ? `${avgResolutionHours} ساعة` : 'لا توجد بيانات كافية',
      period,
      status:
        avgResolutionHours === null
          ? 'no_data'
          : avgResolutionHours <= 24
          ? 'healthy'
          : avgResolutionHours <= 48
          ? 'warning'
          : 'critical',
      source: 'ContactMessage',
      lastCalculatedAt: nowIso,
      isSufficientData: resolvedWithTimestamps.length > 0,
    },
    newServiceRequests: {
      value: newRequests,
      displayValue: String(newRequests),
      period,
      status: newRequests > 0 ? 'warning' : 'neutral',
      source: 'ServiceRequest',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    activeServiceRequests: {
      value: activeRequests,
      displayValue: String(activeRequests),
      period,
      status: 'neutral',
      source: 'ServiceRequest',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    completedServiceRequests: {
      value: completedRequests,
      displayValue: String(completedRequests),
      period,
      status: 'healthy',
      source: 'ServiceRequest',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
  };
}

/**
 * Domain 4: Report Quality Assurance (QA)
 */
async function calculateQualityAssuranceKpis(
  period: KpiPeriod,
  start: Date,
  end: Date,
  nowIso: string
): Promise<ReportQualityKpis> {
  const finalReports = await prisma.serviceRequestDocument.findMany({
    where: {
      documentType: 'FINAL_REPORT',
      createdAt: { gte: start, lte: end },
    },
    select: {
      id: true,
      qaStatus: true,
      qaReviewedAt: true,
      qaApprovedAt: true,
      deliveredAt: true,
      clientAcceptedAt: true,
      createdAt: true,
    },
  });

  const awaitingQa = finalReports.filter((r) =>
    ['PENDING_QA', 'UNDER_REVIEW'].includes(r.qaStatus)
  ).length;

  const approved = finalReports.filter((r) =>
    ['APPROVED', 'DELIVERED', 'CLIENT_ACCEPTED'].includes(r.qaStatus)
  ).length;

  const rejected = finalReports.filter((r) => r.qaStatus === 'REJECTED').length;

  const delivered = finalReports.filter((r) =>
    r.qaStatus === 'DELIVERED' || r.deliveredAt !== null || r.qaStatus === 'CLIENT_ACCEPTED'
  ).length;

  const clientAccepted = finalReports.filter((r) =>
    r.qaStatus === 'CLIENT_ACCEPTED' || r.clientAcceptedAt !== null
  ).length;

  const reviewedTotal = approved + rejected;
  const passRate =
    reviewedTotal > 0 ? Math.round((approved / reviewedTotal) * 100 * 10) / 10 : null;

  // QA Turnaround Time (in hours)
  const approvedWithDates = finalReports.filter((r) => r.qaApprovedAt !== null);
  let avgTurnaroundHours: number | null = null;
  if (approvedWithDates.length > 0) {
    const totalHours = approvedWithDates.reduce((sum, r) => {
      const diff = (r.qaApprovedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + Math.max(0, diff);
    }, 0);
    avgTurnaroundHours = Math.round((totalHours / approvedWithDates.length) * 10) / 10;
  }

  return {
    reportsAwaitingQa: {
      value: awaitingQa,
      displayValue: String(awaitingQa),
      period,
      status: awaitingQa > 0 ? 'warning' : 'healthy',
      source: 'ServiceRequestDocument',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    reportsApproved: {
      value: approved,
      displayValue: String(approved),
      period,
      status: 'healthy',
      source: 'ServiceRequestDocument',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    reportsRejected: {
      value: rejected,
      displayValue: String(rejected),
      period,
      status: rejected > 0 ? 'warning' : 'neutral',
      source: 'ServiceRequestDocument',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    qaPassRate: {
      value: passRate,
      displayValue: passRate !== null ? `${passRate}%` : 'لا توجد بيانات كافية',
      numerator: approved,
      denominator: reviewedTotal,
      period,
      status:
        passRate === null
          ? 'no_data'
          : passRate >= 80
          ? 'healthy'
          : passRate >= 60
          ? 'warning'
          : 'critical',
      source: 'ServiceRequestDocument',
      lastCalculatedAt: nowIso,
      isSufficientData: reviewedTotal > 0,
    },
    averageQaTurnaroundHours: {
      value: avgTurnaroundHours,
      displayValue:
        avgTurnaroundHours !== null ? `${avgTurnaroundHours} ساعة` : 'لا توجد بيانات كافية',
      period,
      status:
        avgTurnaroundHours === null
          ? 'no_data'
          : avgTurnaroundHours <= 24
          ? 'healthy'
          : avgTurnaroundHours <= 48
          ? 'warning'
          : 'critical',
      source: 'ServiceRequestDocument',
      lastCalculatedAt: nowIso,
      isSufficientData: approvedWithDates.length > 0,
    },
    deliveredReports: {
      value: delivered,
      displayValue: String(delivered),
      period,
      status: 'neutral',
      source: 'ServiceRequestDocument',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    clientAcceptedReports: {
      value: clientAccepted,
      displayValue: String(clientAccepted),
      period,
      status: 'healthy',
      source: 'ServiceRequestDocument',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
  };
}

/**
 * Domain 5: Training KPI Calculation & Mathematical Improvement Rate
 */
async function calculateTrainingKpis(
  period: KpiPeriod,
  start: Date,
  end: Date,
  nowIso: string
): Promise<TrainingKpis> {
  const [
    courses,
    registrations,
    attendanceRecords,
    evaluations,
  ] = await Promise.all([
    prisma.course.findMany({
      select: { id: true, status: true, endDate: true },
    }),
    prisma.trainingRegistration.findMany({
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.attendanceRecord.findMany({
      select: { id: true, status: true },
    }),
    prisma.trainingEvaluation.findMany({
      select: {
        id: true,
        registrationId: true,
        type: true,
        score: true,
        maxScore: true,
        status: true,
      },
    }),
  ]);

  // Distinct Trainees
  const traineeIds = new Set(
    registrations.map((r) => r.userId).filter((id): id is string => Boolean(id))
  );
  const totalTrainees = traineeIds.size;

  // Courses
  const now = new Date();
  const activeCourses = courses.filter((c) => c.status === 'OPEN' || c.status === 'ONGOING' || c.status === 'FULL').length;
  const completedCourses = courses.filter(
    (c) => c.status === 'COMPLETED' || (c.endDate && new Date(c.endDate) < now)
  ).length;

  // Attendance Rate
  const attendedCount = attendanceRecords.filter((a) =>
    ['PRESENT', 'LATE'].includes(a.status)
  ).length;
  const totalAttendanceRecords = attendanceRecords.length;
  const attendanceRate =
    totalAttendanceRecords > 0
      ? Math.round((attendedCount / totalAttendanceRecords) * 100 * 10) / 10
      : null;

  // Evaluation Participation Rate
  const completedEvalCount = evaluations.filter((e) => e.status === 'COMPLETED').length;
  const totalEvalsExpected = evaluations.length;
  const evaluationParticipation =
    totalEvalsExpected > 0
      ? Math.round((completedEvalCount / totalEvalsExpected) * 100 * 10) / 10
      : null;

  // Mathematical Improvement Rate (Normalized Pre/Post Knowledge Gain)
  // Group evaluations by registrationId
  const evalsByReg = new Map<string, { pre?: (typeof evaluations)[0]; post?: (typeof evaluations)[0] }>();
  for (const ev of evaluations) {
    const existing = evalsByReg.get(ev.registrationId) || {};
    if (ev.type === 'PRE') existing.pre = ev;
    if (ev.type === 'POST') existing.post = ev;
    evalsByReg.set(ev.registrationId, existing);
  }

  let totalPairsCompleted = 0;
  let missingPreCount = 0;
  let missingPostCount = 0;
  let zeroBaselineCount = 0;
  let totalGainPercentagePoints = 0;

  for (const [_, pair] of evalsByReg.entries()) {
    const preValid =
      pair.pre && pair.pre.status === 'COMPLETED' && pair.pre.score !== null && pair.pre.maxScore > 0;
    const postValid =
      pair.post && pair.post.status === 'COMPLETED' && pair.post.score !== null && pair.post.maxScore > 0;

    if (!preValid && postValid) {
      missingPreCount++;
      continue;
    }
    if (preValid && !postValid) {
      missingPostCount++;
      continue;
    }
    if (!preValid && !postValid) {
      continue;
    }

    // Both valid: compute absolute percentage point gain
    totalPairsCompleted++;
    const prePct = (pair.pre!.score! / pair.pre!.maxScore) * 100;
    const postPct = (pair.post!.score! / pair.post!.maxScore) * 100;

    if (prePct === 0) {
      zeroBaselineCount++;
    }

    const gain = postPct - prePct;
    totalGainPercentagePoints += gain;
  }

  let averageImprovement: number | null = null;
  if (totalPairsCompleted > 0) {
    averageImprovement =
      Math.round((totalGainPercentagePoints / totalPairsCompleted) * 10) / 10;
  }

  return {
    totalTrainees: {
      value: totalTrainees,
      displayValue: String(totalTrainees),
      period,
      status: totalTrainees > 0 ? 'neutral' : 'no_data',
      source: 'TrainingRegistration',
      lastCalculatedAt: nowIso,
      isSufficientData: registrations.length > 0,
    },
    activeCourses: {
      value: activeCourses,
      displayValue: String(activeCourses),
      period,
      status: 'neutral',
      source: 'Course',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    completedCourses: {
      value: completedCourses,
      displayValue: String(completedCourses),
      period,
      status: 'neutral',
      source: 'Course',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    attendanceRate: {
      value: attendanceRate,
      displayValue: attendanceRate !== null ? `${attendanceRate}%` : 'لا توجد بيانات كافية',
      numerator: attendedCount,
      denominator: totalAttendanceRecords,
      period,
      status:
        attendanceRate === null
          ? 'no_data'
          : attendanceRate >= 80
          ? 'healthy'
          : attendanceRate >= 65
          ? 'warning'
          : 'critical',
      source: 'AttendanceRecord',
      lastCalculatedAt: nowIso,
      isSufficientData: totalAttendanceRecords > 0,
    },
    evaluationParticipationRate: {
      value: evaluationParticipation,
      displayValue:
        evaluationParticipation !== null
          ? `${evaluationParticipation}%`
          : 'لا توجد بيانات كافية',
      numerator: completedEvalCount,
      denominator: totalEvalsExpected,
      period,
      status:
        evaluationParticipation === null
          ? 'no_data'
          : evaluationParticipation >= 75
          ? 'healthy'
          : 'warning',
      source: 'TrainingEvaluation',
      lastCalculatedAt: nowIso,
      isSufficientData: totalEvalsExpected > 0,
    },
    averageImprovementRate: {
      value: averageImprovement,
      displayValue:
        averageImprovement !== null
          ? `${averageImprovement > 0 ? '+' : ''}${averageImprovement}% (${totalPairsCompleted} أزواج تقييم)`
          : 'لا توجد بيانات كافية',
      numerator: totalGainPercentagePoints,
      denominator: totalPairsCompleted,
      period,
      status:
        averageImprovement === null
          ? 'no_data'
          : averageImprovement >= 15
          ? 'healthy'
          : averageImprovement >= 5
          ? 'neutral'
          : 'warning',
      source: 'TrainingEvaluation',
      lastCalculatedAt: nowIso,
      isSufficientData: totalPairsCompleted > 0,
      notes: `أزواج مكتملة: ${totalPairsCompleted} | خط أساس صفري: ${zeroBaselineCount} | نقص قبلي: ${missingPreCount} | نقص بعدي: ${missingPostCount}`,
    },
    evaluationPairStats: {
      totalPairsCompleted,
      missingPreCount,
      missingPostCount,
      zeroBaselineCount,
    },
  };
}

/**
 * Domain 6: Client Satisfaction & Feedback
 */
async function calculateClientSatisfactionKpis(
  period: KpiPeriod,
  start: Date,
  end: Date,
  nowIso: string
): Promise<ClientSatisfactionKpis> {
  const feedbacks = await prisma.clientFeedback.findMany({
    where: {
      submittedAt: { gte: start, lte: end },
    },
    select: {
      overallRating: true,
      serviceQuality: true,
      timeliness: true,
      communication: true,
    },
  });

  const total = feedbacks.length;
  const isSmallSample = total > 0 && total < 5;

  if (total === 0) {
    return {
      averageSatisfaction: {
        value: null,
        displayValue: 'لا توجد بيانات كافية',
        period,
        status: 'no_data',
        source: 'ClientFeedback',
        lastCalculatedAt: nowIso,
        isSufficientData: false,
      },
      totalResponses: {
        value: 0,
        displayValue: '0 تقييم',
        period,
        status: 'no_data',
        source: 'ClientFeedback',
        lastCalculatedAt: nowIso,
        isSufficientData: false,
      },
      sampleSizeLabel: 'لا توجد تقييمات مسجلة',
      isSmallSample: false,
      serviceQualityAverage: {
        value: null,
        displayValue: 'لا توجد بيانات كافية',
        period,
        status: 'no_data',
        source: 'ClientFeedback',
        lastCalculatedAt: nowIso,
        isSufficientData: false,
      },
      timelinessAverage: {
        value: null,
        displayValue: 'لا توجد بيانات كافية',
        period,
        status: 'no_data',
        source: 'ClientFeedback',
        lastCalculatedAt: nowIso,
        isSufficientData: false,
      },
      communicationAverage: {
        value: null,
        displayValue: 'لا توجد بيانات كافية',
        period,
        status: 'no_data',
        source: 'ClientFeedback',
        lastCalculatedAt: nowIso,
        isSufficientData: false,
      },
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const sumOverall = feedbacks.reduce((acc, f) => acc + f.overallRating, 0);
  const sumQuality = feedbacks.reduce((acc, f) => acc + f.serviceQuality, 0);
  const sumTime = feedbacks.reduce((acc, f) => acc + f.timeliness, 0);
  const sumComm = feedbacks.reduce((acc, f) => acc + f.communication, 0);

  const avgOverall = Math.round((sumOverall / total) * 10) / 10;
  const avgQuality = Math.round((sumQuality / total) * 10) / 10;
  const avgTime = Math.round((sumTime / total) * 10) / 10;
  const avgComm = Math.round((sumComm / total) * 10) / 10;

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const f of feedbacks) {
    if (f.overallRating >= 1 && f.overallRating <= 5) {
      distribution[f.overallRating as 1 | 2 | 3 | 4 | 5]++;
    }
  }

  const sampleSizeLabel = isSmallSample
    ? `${avgOverall} / 5 (${total} ${total === 1 ? 'تقييم - عينة محدودة' : 'تقييمات - عينة صغيرة'})`
    : `${avgOverall} / 5 (${total} تقييم)`;

  return {
    averageSatisfaction: {
      value: avgOverall,
      displayValue: sampleSizeLabel,
      numerator: sumOverall,
      denominator: total,
      period,
      status: avgOverall >= 4.0 ? 'healthy' : avgOverall >= 3.0 ? 'warning' : 'critical',
      source: 'ClientFeedback',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
      notes: isSmallSample ? 'تنبيه: حجم العينة صغير للتعميم الإحصائي' : undefined,
    },
    totalResponses: {
      value: total,
      displayValue: `${total} تقييم`,
      period,
      status: 'neutral',
      source: 'ClientFeedback',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    sampleSizeLabel,
    isSmallSample,
    serviceQualityAverage: {
      value: avgQuality,
      displayValue: `${avgQuality} / 5`,
      period,
      status: 'neutral',
      source: 'ClientFeedback',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    timelinessAverage: {
      value: avgTime,
      displayValue: `${avgTime} / 5`,
      period,
      status: 'neutral',
      source: 'ClientFeedback',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    communicationAverage: {
      value: avgComm,
      displayValue: `${avgComm} / 5`,
      period,
      status: 'neutral',
      source: 'ClientFeedback',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    ratingDistribution: distribution,
  };
}

/**
 * Standard Knowledge Gain Formula (Package C & D Unified Definition):
 * Gain Rate = (POST - PRE) / max(1, 100 - PRE) * 100
 */
export function calculateKnowledgeGainRate(
  preScore: number,
  preMax: number,
  postScore: number,
  postMax: number
): { gainRate: number; isZeroBaseline: boolean; isPerfectBaseline: boolean } {
  const prePct = preMax > 0 ? (preScore / preMax) * 100 : 0;
  const postPct = postMax > 0 ? (postScore / postMax) * 100 : 0;
  const isZeroBaseline = prePct === 0;
  const isPerfectBaseline = prePct >= 100;

  if (isPerfectBaseline) {
    return { gainRate: 0, isZeroBaseline: false, isPerfectBaseline: true };
  }

  const denom = Math.max(1, 100 - prePct);
  const gainRate = Math.round((((postPct - prePct) / denom) * 100) * 10) / 10;
  return { gainRate, isZeroBaseline, isPerfectBaseline };
}

/**
 * Domain 7: Safety Equipment, Inventory & Equipment Readiness KPI
 */
export async function calculateEquipmentKpis(
  period: KpiPeriod,
  start: Date,
  end: Date,
  nowIso: string
): Promise<EquipmentKpis> {
  const [
    activeProducts,
    pendingPOs,
    inspections,
    deliveries,
    trackedItems,
  ] = await Promise.all([
    prisma.equipmentProduct.findMany({
      where: { isActive: true },
      include: {
        inspections: { orderBy: { inspectionDate: 'desc' }, take: 1 },
        maintenances: { orderBy: { maintenanceDate: 'desc' }, take: 1 },
      },
    }),
    prisma.procurementOrder.findMany({
      where: { status: { in: ['DRAFT', 'REQUESTED', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED'] } },
    }),
    prisma.equipmentInspection.findMany(),
    prisma.equipmentDelivery.findMany(),
    prisma.trackedEquipmentItem.findMany(),
  ]);

  let totalOnHand = 0;
  let totalReserved = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let readinessTrackingCount = 0;
  let readyCount = 0;

  const now = new Date();
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  for (const prod of activeProducts) {
    totalOnHand += prod.quantityOnHand;
    totalReserved += prod.quantityReserved;
    const available = Math.max(0, prod.quantityOnHand - prod.quantityReserved);
    if (available === 0) {
      outOfStock++;
    } else if (available <= prod.minimumStockLevel) {
      lowStock++;
    }

    const requiresReadiness = prod.inspectionRequired || prod.maintenanceRequired || prod.expiryTrackingRequired;
    if (requiresReadiness) {
      readinessTrackingCount++;
      let isReady = available > 0;

      // Check inspection
      if (prod.inspectionRequired) {
        const lastInsp = prod.inspections[0];
        if (!lastInsp || lastInsp.result !== 'PASS') {
          isReady = false;
        }
      }

      // Check maintenance overdue
      if (prod.maintenanceRequired) {
        const lastMaint = prod.maintenances[0];
        if (lastMaint && lastMaint.nextDueDate && new Date(lastMaint.nextDueDate) < now) {
          isReady = false;
        }
      }

      if (isReady) {
        readyCount++;
      }
    }
  }

  const readinessRate = computeEquipmentReadinessRate(readyCount, readinessTrackingCount);
  const totalAvailable = Math.max(0, totalOnHand - totalReserved);
  const pendingReceiving = pendingPOs.filter((p) => p.status === 'ORDERED' || p.status === 'PARTIALLY_RECEIVED').length;
  const pendingInspections = inspections.filter((i) => i.result === 'CONDITIONAL').length;
  const failedInspections = inspections.filter((i) => i.result === 'FAIL').length;

  const expiredItems = trackedItems.filter((t) => t.expiryDate && new Date(t.expiryDate) < now).length;
  const expiringSoonItems = trackedItems.filter((t) => t.expiryDate && new Date(t.expiryDate) >= now && new Date(t.expiryDate) <= thirtyDaysAhead).length;

  const pendingDeliveries = deliveries.filter((d) => d.status === 'DRAFT' || d.status === 'PREPARED' || d.status === 'IN_TRANSIT').length;
  const completedDeliveries = deliveries.filter((d) => d.status === 'DELIVERED').length;

  return {
    equipmentReadinessRate: {
      value: readinessRate,
      displayValue: `${readinessRate}%`,
      numerator: readyCount,
      denominator: readinessTrackingCount,
      period,
      status: readinessRate >= 90 ? 'healthy' : readinessRate >= 75 ? 'warning' : 'critical',
      source: 'EquipmentProduct + EquipmentInspection',
      lastCalculatedAt: nowIso,
      isSufficientData: readinessTrackingCount > 0,
      notes: `جاهزية المعدات: ${readyCount} صنف جاهز من إجمالي ${readinessTrackingCount} صنف يتطلب متابعة الجاهزية`,
    },
    totalActiveProducts: {
      value: activeProducts.length,
      displayValue: `${activeProducts.length} صنف`,
      period,
      status: 'neutral',
      source: 'EquipmentProduct',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    totalStockOnHand: {
      value: totalOnHand,
      displayValue: `${totalOnHand} وحدة`,
      period,
      status: 'neutral',
      source: 'EquipmentProduct.quantityOnHand',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    totalStockReserved: {
      value: totalReserved,
      displayValue: `${totalReserved} وحدة`,
      period,
      status: 'neutral',
      source: 'EquipmentProduct.quantityReserved',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    totalStockAvailable: {
      value: totalAvailable,
      displayValue: `${totalAvailable} وحدة`,
      period,
      status: totalAvailable > 0 ? 'healthy' : 'warning',
      source: 'EquipmentProduct (OnHand - Reserved)',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    lowStockCount: {
      value: lowStock,
      displayValue: `${lowStock} صنف`,
      period,
      status: lowStock === 0 ? 'healthy' : 'warning',
      source: 'EquipmentProduct (Available <= MinStock)',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    outOfStockCount: {
      value: outOfStock,
      displayValue: `${outOfStock} صنف`,
      period,
      status: outOfStock === 0 ? 'healthy' : 'critical',
      source: 'EquipmentProduct (Available = 0)',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    pendingProcurements: {
      value: pendingPOs.length,
      displayValue: `${pendingPOs.length} أمر شراء`,
      period,
      status: 'neutral',
      source: 'ProcurementOrder',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    pendingReceiving: {
      value: pendingReceiving,
      displayValue: `${pendingReceiving} شحنة`,
      period,
      status: 'neutral',
      source: 'ProcurementOrder.status IN (ORDERED, PARTIALLY_RECEIVED)',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    pendingInspections: {
      value: pendingInspections,
      displayValue: `${pendingInspections} فحص معلق`,
      period,
      status: pendingInspections === 0 ? 'healthy' : 'warning',
      source: 'EquipmentInspection',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    failedInspections: {
      value: failedInspections,
      displayValue: `${failedInspections} فحص راسب`,
      period,
      status: failedInspections === 0 ? 'healthy' : 'critical',
      source: 'EquipmentInspection.result = FAIL',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    expiringSoonItems: {
      value: expiringSoonItems,
      displayValue: `${expiringSoonItems} وحدة`,
      period,
      status: expiringSoonItems === 0 ? 'healthy' : 'warning',
      source: 'TrackedEquipmentItem (Expiry <= 30d)',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    expiredItems: {
      value: expiredItems,
      displayValue: `${expiredItems} وحدة`,
      period,
      status: expiredItems === 0 ? 'healthy' : 'critical',
      source: 'TrackedEquipmentItem (Expiry < Now)',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    pendingDeliveries: {
      value: pendingDeliveries,
      displayValue: `${pendingDeliveries} تسليم`,
      period,
      status: 'neutral',
      source: 'EquipmentDelivery',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
    completedDeliveries: {
      value: completedDeliveries,
      displayValue: `${completedDeliveries} تسليم`,
      period,
      status: 'healthy',
      source: 'EquipmentDelivery.status = DELIVERED',
      lastCalculatedAt: nowIso,
      isSufficientData: true,
    },
  };
}

/**
 * Audited Equipment Readiness Formula (Package E Unified Definition):
 * Readiness Rate = (Ready Items / Total Items Requiring Tracking) * 100
 * If tracking count is 0, returns 100.
 */
export function computeEquipmentReadinessRate(readyCount: number, totalTrackingCount: number): number {
  if (totalTrackingCount <= 0) return 100;
  return Math.round((readyCount / totalTrackingCount) * 100 * 10) / 10;
}

