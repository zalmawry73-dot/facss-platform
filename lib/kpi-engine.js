/**
 * CommonJS Companion for lib/kpi-engine.ts
 * Provides direct calculation functions for Node.js scripts and automated test suites.
 */

let prismaClient;
function getPrisma() {
  if (!prismaClient) {
    const { PrismaClient } = require('@prisma/client');
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

function getDateBoundaries(period = '30d', customStart = null, customEnd = null) {
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

function calculateComparison(current, previous) {
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

async function calculateExecutiveKpis(period = '30d', customStart = null, customEnd = null) {
  const prisma = getPrisma();
  const boundaries = getDateBoundaries(period, customStart, customEnd);
  const { start, end, prevStart, prevEnd } = boundaries;
  const nowIso = new Date().toISOString();

  // 1. Operations & Incidents
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
    prisma.incident.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.incident.count({ where: { createdAt: { gte: prevStart, lte: prevEnd } } }),
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
      select: { slaStatus: true },
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

  const respondedIncidents = allIncidentsInPeriod.filter((inc) => inc.firstResponseAt !== null);
  let avgResponseMinutes = null;
  if (respondedIncidents.length > 0) {
    const totalMinutes = respondedIncidents.reduce((sum, inc) => {
      const startMs = inc.createdAt.getTime();
      const respMs = inc.firstResponseAt.getTime();
      return sum + Math.max(0, Math.round((respMs - startMs) / (1000 * 60)));
    }, 0);
    avgResponseMinutes = Math.round((totalMinutes / respondedIncidents.length) * 10) / 10;
  }

  const unassignedCount = allIncidentsInPeriod.filter((inc) => inc.assignments.length === 0).length;

  const incidentsByCategory = {};
  for (const item of categoriesGroup) incidentsByCategory[item.category] = item._count.category;
  const incidentsByPriority = {};
  for (const item of prioritiesGroup) incidentsByPriority[item.priority] = item._count.priority;
  const incidentsByStatus = {};
  for (const item of statusesGroup) incidentsByStatus[item.status] = item._count.status;

  // 2. Risk Intelligence
  const [allRisks, allMitigations, riskCatGroup, riskStatGroup] = await Promise.all([
    prisma.operationalRisk.findMany({
      select: { id: true, status: true, riskLevel: true, riskScore: true },
    }),
    prisma.riskMitigationAction.findMany({
      select: { id: true, status: true, dueDate: true },
    }),
    prisma.operationalRisk.groupBy({ by: ['category'], _count: { category: true } }),
    prisma.operationalRisk.groupBy({ by: ['status'], _count: { status: true } }),
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
  const treatmentCompletionRate =
    allMitigations.length > 0
      ? Math.round((completedMitigations / allMitigations.length) * 100 * 10) / 10
      : null;

  const risksByCategory = {};
  for (const item of riskCatGroup) risksByCategory[item.category] = item._count.category;
  const risksByStatus = {};
  for (const item of riskStatGroup) risksByStatus[item.status] = item._count.status;

  // 3. Complaints & Services
  const [complaintsInPeriod, serviceRequestsInPeriod] = await Promise.all([
    prisma.contactMessage.findMany({
      where: { messageType: 'COMPLAINT', createdAt: { gte: start, lte: end } },
      select: { id: true, status: true, slaStatus: true, dueAt: true, createdAt: true, resolvedAt: true },
    }),
    prisma.serviceRequest.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { id: true, status: true },
    }),
  ]);

  const totalComplaints = complaintsInPeriod.length;
  const openComplaints = complaintsInPeriod.filter((c) =>
    ['UNREAD', 'READ', 'IN_PROGRESS'].includes(c.status)
  ).length;
  const resolvedComplaints = complaintsInPeriod.filter((c) =>
    ['RESOLVED', 'REPLIED'].includes(c.status)
  ).length;
  const overdueComplaints = complaintsInPeriod.filter(
    (c) =>
      c.slaStatus === 'BREACHED' ||
      (!['RESOLVED', 'REPLIED', 'ARCHIVED'].includes(c.status) && c.dueAt && new Date(c.dueAt) < now)
  ).length;

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

  const resolvedWithTimestamps = complaintsInPeriod.filter((c) => c.resolvedAt !== null);
  let avgResolutionHours = null;
  if (resolvedWithTimestamps.length > 0) {
    const totalHours = resolvedWithTimestamps.reduce((sum, c) => {
      const diffHours = (c.resolvedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + Math.max(0, diffHours);
    }, 0);
    avgResolutionHours = Math.round((totalHours / resolvedWithTimestamps.length) * 10) / 10;
  }

  // 4. Report QA
  const finalReports = await prisma.serviceRequestDocument.findMany({
    where: { documentType: 'FINAL_REPORT', createdAt: { gte: start, lte: end } },
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

  const awaitingQa = finalReports.filter((r) => ['PENDING_QA', 'UNDER_REVIEW'].includes(r.qaStatus)).length;
  const approvedQa = finalReports.filter((r) =>
    ['APPROVED', 'DELIVERED', 'CLIENT_ACCEPTED'].includes(r.qaStatus)
  ).length;
  const rejectedQa = finalReports.filter((r) => r.qaStatus === 'REJECTED').length;
  const deliveredQa = finalReports.filter((r) =>
    r.qaStatus === 'DELIVERED' || r.deliveredAt !== null || r.qaStatus === 'CLIENT_ACCEPTED'
  ).length;
  const acceptedQa = finalReports.filter((r) =>
    r.qaStatus === 'CLIENT_ACCEPTED' || r.clientAcceptedAt !== null
  ).length;

  const reviewedTotal = approvedQa + rejectedQa;
  const qaPassRate = reviewedTotal > 0 ? Math.round((approvedQa / reviewedTotal) * 100 * 10) / 10 : null;

  const approvedWithDates = finalReports.filter((r) => r.qaApprovedAt !== null);
  let avgTurnaroundHours = null;
  if (approvedWithDates.length > 0) {
    const totalHours = approvedWithDates.reduce((sum, r) => {
      const diff = (r.qaApprovedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + Math.max(0, diff);
    }, 0);
    avgTurnaroundHours = Math.round((totalHours / approvedWithDates.length) * 10) / 10;
  }

  // 5. Training
  const [courses, registrations, attendanceRecords, evaluations] = await Promise.all([
    prisma.course.findMany({ select: { id: true, status: true, endDate: true } }),
    prisma.trainingRegistration.findMany({ select: { id: true, userId: true, status: true } }),
    prisma.attendanceRecord.findMany({ select: { id: true, status: true } }),
    prisma.trainingEvaluation.findMany({
      select: { id: true, registrationId: true, type: true, score: true, maxScore: true, status: true },
    }),
  ]);

  const traineeIds = new Set(registrations.map((r) => r.userId).filter(Boolean));
  const totalTrainees = traineeIds.size;
  const activeCourses = courses.filter((c) => c.status === 'OPEN' || c.status === 'ONGOING' || c.status === 'FULL').length;
  const completedCourses = courses.filter(
    (c) => c.status === 'COMPLETED' || (c.endDate && new Date(c.endDate) < now)
  ).length;

  const attendedCount = attendanceRecords.filter((a) => ['PRESENT', 'LATE'].includes(a.status)).length;
  const attendanceRate =
    attendanceRecords.length > 0
      ? Math.round((attendedCount / attendanceRecords.length) * 100 * 10) / 10
      : null;

  const completedEvalCount = evaluations.filter((e) => e.status === 'COMPLETED').length;
  const evalParticipationRate =
    evaluations.length > 0 ? Math.round((completedEvalCount / evaluations.length) * 100 * 10) / 10 : null;

  // Pre/Post Pair Knowledge Gain
  const evalsByReg = new Map();
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
    if (!preValid && !postValid) continue;

    totalPairsCompleted++;
    const prePct = (pair.pre.score / pair.pre.maxScore) * 100;
    const postPct = (pair.post.score / pair.post.maxScore) * 100;
    if (prePct === 0) zeroBaselineCount++;
    totalGainPercentagePoints += postPct - prePct;
  }

  const averageImprovement =
    totalPairsCompleted > 0
      ? Math.round((totalGainPercentagePoints / totalPairsCompleted) * 10) / 10
      : null;

  // 6. Client Feedback
  const feedbacks = await prisma.clientFeedback.findMany({
    where: { submittedAt: { gte: start, lte: end } },
    select: { overallRating: true, serviceQuality: true, timeliness: true, communication: true },
  });

  const totalFeedbacks = feedbacks.length;
  let avgSatisfaction = null;
  let avgQuality = null;
  let avgTimeliness = null;
  let avgComm = null;
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  if (totalFeedbacks > 0) {
    const sumOverall = feedbacks.reduce((acc, f) => acc + f.overallRating, 0);
    const sumQuality = feedbacks.reduce((acc, f) => acc + f.serviceQuality, 0);
    const sumTime = feedbacks.reduce((acc, f) => acc + f.timeliness, 0);
    const sumComm = feedbacks.reduce((acc, f) => acc + f.communication, 0);

    avgSatisfaction = Math.round((sumOverall / totalFeedbacks) * 10) / 10;
    avgQuality = Math.round((sumQuality / totalFeedbacks) * 10) / 10;
    avgTimeliness = Math.round((sumTime / totalFeedbacks) * 10) / 10;
    avgComm = Math.round((sumComm / totalFeedbacks) * 10) / 10;

    for (const f of feedbacks) {
      if (f.overallRating >= 1 && f.overallRating <= 5) {
        ratingDistribution[f.overallRating]++;
      }
    }
  }

  return {
    period,
    dateRange: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      prevStartDate: prevStart.toISOString(),
      prevEndDate: prevEnd.toISOString(),
    },
    operations: {
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
        status: avgResponseMinutes === null ? 'no_data' : avgResponseMinutes <= 30 ? 'healthy' : 'warning',
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
        status: slaCompliancePct === null ? 'no_data' : slaCompliancePct >= 90 ? 'healthy' : 'warning',
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
        status: slaBreachPct === null ? 'no_data' : slaBreachPct === 0 ? 'healthy' : 'warning',
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
    },
    risks: {
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
        source: 'RiskMitigation',
        lastCalculatedAt: nowIso,
        isSufficientData: allMitigations.length > 0,
      },
      completedMitigations: {
        value: completedMitigations,
        displayValue: String(completedMitigations),
        period,
        status: 'neutral',
        source: 'RiskMitigation',
        lastCalculatedAt: nowIso,
        isSufficientData: allMitigations.length > 0,
      },
      treatmentCompletionRate: {
        value: treatmentCompletionRate,
        displayValue:
          treatmentCompletionRate !== null ? `${treatmentCompletionRate}%` : 'لا توجد بيانات كافية',
        numerator: completedMitigations,
        denominator: allMitigations.length,
        period,
        status: treatmentCompletionRate === null ? 'no_data' : treatmentCompletionRate >= 80 ? 'healthy' : 'warning',
        source: 'RiskMitigation',
        lastCalculatedAt: nowIso,
        isSufficientData: allMitigations.length > 0,
      },
      risksByCategory,
      risksByStatus,
    },
    complaintsAndServices: {
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
        status: complaintSlaPct === null ? 'no_data' : complaintSlaPct >= 85 ? 'healthy' : 'warning',
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
        status: avgResolutionHours === null ? 'no_data' : avgResolutionHours <= 24 ? 'healthy' : 'warning',
        source: 'ContactMessage',
        lastCalculatedAt: nowIso,
        isSufficientData: resolvedWithTimestamps.length > 0,
      },
      newServiceRequests: {
        value: serviceRequestsInPeriod.filter((r) => r.status === 'NEW').length,
        displayValue: String(serviceRequestsInPeriod.filter((r) => r.status === 'NEW').length),
        period,
        status: 'neutral',
        source: 'ServiceRequest',
        lastCalculatedAt: nowIso,
        isSufficientData: true,
      },
      activeServiceRequests: {
        value: serviceRequestsInPeriod.filter((r) =>
          ['UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS'].includes(r.status)
        ).length,
        displayValue: String(
          serviceRequestsInPeriod.filter((r) =>
            ['UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS'].includes(r.status)
          ).length
        ),
        period,
        status: 'neutral',
        source: 'ServiceRequest',
        lastCalculatedAt: nowIso,
        isSufficientData: true,
      },
      completedServiceRequests: {
        value: serviceRequestsInPeriod.filter((r) => r.status === 'COMPLETED').length,
        displayValue: String(serviceRequestsInPeriod.filter((r) => r.status === 'COMPLETED').length),
        period,
        status: 'healthy',
        source: 'ServiceRequest',
        lastCalculatedAt: nowIso,
        isSufficientData: true,
      },
    },
    qualityAssurance: {
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
        value: approvedQa,
        displayValue: String(approvedQa),
        period,
        status: 'healthy',
        source: 'ServiceRequestDocument',
        lastCalculatedAt: nowIso,
        isSufficientData: true,
      },
      reportsRejected: {
        value: rejectedQa,
        displayValue: String(rejectedQa),
        period,
        status: rejectedQa > 0 ? 'warning' : 'neutral',
        source: 'ServiceRequestDocument',
        lastCalculatedAt: nowIso,
        isSufficientData: true,
      },
      qaPassRate: {
        value: qaPassRate,
        displayValue: qaPassRate !== null ? `${qaPassRate}%` : 'لا توجد بيانات كافية',
        numerator: approvedQa,
        denominator: reviewedTotal,
        period,
        status: qaPassRate === null ? 'no_data' : qaPassRate >= 80 ? 'healthy' : 'warning',
        source: 'ServiceRequestDocument',
        lastCalculatedAt: nowIso,
        isSufficientData: reviewedTotal > 0,
      },
      averageQaTurnaroundHours: {
        value: avgTurnaroundHours,
        displayValue:
          avgTurnaroundHours !== null ? `${avgTurnaroundHours} ساعة` : 'لا توجد بيانات كافية',
        period,
        status: avgTurnaroundHours === null ? 'no_data' : avgTurnaroundHours <= 24 ? 'healthy' : 'warning',
        source: 'ServiceRequestDocument',
        lastCalculatedAt: nowIso,
        isSufficientData: approvedWithDates.length > 0,
      },
      deliveredReports: {
        value: deliveredQa,
        displayValue: String(deliveredQa),
        period,
        status: 'neutral',
        source: 'ServiceRequestDocument',
        lastCalculatedAt: nowIso,
        isSufficientData: true,
      },
      clientAcceptedReports: {
        value: acceptedQa,
        displayValue: String(acceptedQa),
        period,
        status: 'healthy',
        source: 'ServiceRequestDocument',
        lastCalculatedAt: nowIso,
        isSufficientData: true,
      },
    },
    training: {
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
        denominator: attendanceRecords.length,
        period,
        status: attendanceRate === null ? 'no_data' : attendanceRate >= 80 ? 'healthy' : 'warning',
        source: 'AttendanceRecord',
        lastCalculatedAt: nowIso,
        isSufficientData: attendanceRecords.length > 0,
      },
      evaluationParticipationRate: {
        value: evalParticipationRate,
        displayValue: evalParticipationRate !== null ? `${evalParticipationRate}%` : 'لا توجد بيانات كافية',
        numerator: completedEvalCount,
        denominator: evaluations.length,
        period,
        status: evalParticipationRate === null ? 'no_data' : evalParticipationRate >= 75 ? 'healthy' : 'warning',
        source: 'TrainingEvaluation',
        lastCalculatedAt: nowIso,
        isSufficientData: evaluations.length > 0,
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
        status: averageImprovement === null ? 'no_data' : averageImprovement >= 15 ? 'healthy' : 'neutral',
        source: 'TrainingEvaluation',
        lastCalculatedAt: nowIso,
        isSufficientData: totalPairsCompleted > 0,
      },
      evaluationPairStats: {
        totalPairsCompleted,
        missingPreCount,
        missingPostCount,
        zeroBaselineCount,
      },
    },
    clientSatisfaction: {
      averageSatisfaction: {
        value: avgSatisfaction,
        displayValue:
          avgSatisfaction !== null
            ? `${avgSatisfaction} / 5 (${totalFeedbacks} ${totalFeedbacks < 5 ? 'تقييم - عينة محدودة' : 'تقييم'})`
            : 'لا توجد بيانات كافية',
        numerator: totalFeedbacks > 0 ? feedbacks.reduce((acc, f) => acc + f.overallRating, 0) : 0,
        denominator: totalFeedbacks,
        period,
        status: avgSatisfaction === null ? 'no_data' : avgSatisfaction >= 4.0 ? 'healthy' : 'warning',
        source: 'ClientFeedback',
        lastCalculatedAt: nowIso,
        isSufficientData: totalFeedbacks > 0,
      },
      totalResponses: {
        value: totalFeedbacks,
        displayValue: `${totalFeedbacks} تقييم`,
        period,
        status: 'neutral',
        source: 'ClientFeedback',
        lastCalculatedAt: nowIso,
        isSufficientData: totalFeedbacks > 0,
      },
      sampleSizeLabel:
        totalFeedbacks > 0
          ? `${avgSatisfaction} / 5 (${totalFeedbacks} ${totalFeedbacks < 5 ? 'تقييم - عينة محدودة' : 'تقييم'})`
          : 'لا توجد بيانات كافية',
      isSmallSample: totalFeedbacks > 0 && totalFeedbacks < 5,
      serviceQualityAverage: {
        value: avgQuality,
        displayValue: avgQuality !== null ? `${avgQuality} / 5` : 'لا توجد بيانات كافية',
        period,
        status: 'neutral',
        source: 'ClientFeedback',
        lastCalculatedAt: nowIso,
        isSufficientData: totalFeedbacks > 0,
      },
      timelinessAverage: {
        value: avgTimeliness,
        displayValue: avgTimeliness !== null ? `${avgTimeliness} / 5` : 'لا توجد بيانات كافية',
        period,
        status: 'neutral',
        source: 'ClientFeedback',
        lastCalculatedAt: nowIso,
        isSufficientData: totalFeedbacks > 0,
      },
      communicationAverage: {
        value: avgComm,
        displayValue: avgComm !== null ? `${avgComm} / 5` : 'لا توجد بيانات كافية',
        period,
        status: 'neutral',
        source: 'ClientFeedback',
        lastCalculatedAt: nowIso,
        isSufficientData: totalFeedbacks > 0,
      },
      ratingDistribution,
    },
    equipment: await calculateEquipmentKpis(period, start, end, nowIso),
    generatedAt: nowIso,
  };
}

/**
 * Domain 7: Safety Equipment, Inventory & Equipment Readiness KPI
 */
async function calculateEquipmentKpis(period, start, end, nowIso) {
  const prisma = getPrisma();
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

      if (prod.inspectionRequired) {
        const lastInsp = prod.inspections[0];
        if (!lastInsp || lastInsp.result !== 'PASS') {
          isReady = false;
        }
      }

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
function computeEquipmentReadinessRate(readyCount, totalTrackingCount) {
  if (totalTrackingCount <= 0) return 100;
  return Math.round((readyCount / totalTrackingCount) * 100 * 10) / 10;
}

/**
 * Standard Knowledge Gain Formula (Package C & D Unified Definition):
 * Gain Rate = (POST - PRE) / max(1, 100 - PRE) * 100
 */
function calculateKnowledgeGainRate(preScore, preMax, postScore, postMax) {
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

module.exports = {
  getDateBoundaries,
  calculateComparison,
  calculateExecutiveKpis,
  calculateEquipmentKpis,
  computeEquipmentReadinessRate,
  calculateKnowledgeGainRate,
};
