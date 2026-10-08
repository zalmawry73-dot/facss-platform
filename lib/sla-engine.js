let prismaClient;
function getPrisma() {
  if (!prismaClient) {
    const { PrismaClient } = require('@prisma/client');
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

const DEFAULT_SLA_CONFIG = {
  criticalMinutes: 15,       // طارئة وقصوى: 15 دقيقة
  highMinutes: 60,           // عالية: 1 ساعة (60 دقيقة)
  mediumMinutes: 240,        // متوسطة: 4 ساعات (240 دقيقة)
  lowMinutes: 1440,          // منخفضة: 24 ساعة (1440 دقيقة)
  warningPercent: 75,        // تنبيه عند استنفاد 75% من المهلة
  complaintNormalHours: 48,  // شكوى عادية: 48 ساعة
  complaintUrgentHours: 24,  // شكوى عاجلة: 24 ساعة
};

async function getSlaConfig(txPrisma) {
  const db = txPrisma || getPrisma();
  try {
    const settings = await db.systemSetting.findMany({
      where: {
        key: {
          in: [
            'SLA_RESPONSE_CRITICAL_MINUTES',
            'SLA_RESPONSE_HIGH_MINUTES',
            'SLA_RESPONSE_MEDIUM_MINUTES',
            'SLA_RESPONSE_LOW_MINUTES',
            'SLA_WARNING_PERCENT',
            'SLA_COMPLAINT_NORMAL_HOURS',
            'SLA_COMPLAINT_URGENT_HOURS',
          ],
        },
      },
    });

    const config = { ...DEFAULT_SLA_CONFIG };

    for (const s of settings) {
      const num = parseInt(s.value, 10);
      if (!isNaN(num) && num > 0) {
        if (s.key === 'SLA_RESPONSE_CRITICAL_MINUTES') config.criticalMinutes = num;
        if (s.key === 'SLA_RESPONSE_HIGH_MINUTES') config.highMinutes = num;
        if (s.key === 'SLA_RESPONSE_MEDIUM_MINUTES') config.mediumMinutes = num;
        if (s.key === 'SLA_RESPONSE_LOW_MINUTES') config.lowMinutes = num;
        if (s.key === 'SLA_WARNING_PERCENT') config.warningPercent = num;
        if (s.key === 'SLA_COMPLAINT_NORMAL_HOURS') config.complaintNormalHours = num;
        if (s.key === 'SLA_COMPLAINT_URGENT_HOURS') config.complaintUrgentHours = num;
      }
    }

    return config;
  } catch (e) {
    console.error('Failed to load SLA settings from DB, using defaults:', e);
    return DEFAULT_SLA_CONFIG;
  }
}

function getIncidentTargetMinutes(priority, config) {
  switch (priority) {
    case 'CRITICAL_EMERGENCY':
    case 'CRITICAL':
      return config.criticalMinutes;
    case 'HIGH':
      return config.highMinutes;
    case 'LOW':
      return config.lowMinutes;
    case 'MEDIUM':
    default:
      return config.mediumMinutes;
  }
}

function calculateIncidentDueAt(priority, createdAt, config) {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const slaTargetMinutes = getIncidentTargetMinutes(priority, config);
  const dueAt = new Date(created.getTime() + slaTargetMinutes * 60 * 1000);
  return { dueAt, slaTargetMinutes };
}

function calculateIncidentSlaStatus(incident, config, referenceNow = new Date()) {
  const createdAt = typeof incident.createdAt === 'string' ? new Date(incident.createdAt) : incident.createdAt;
  const firstResponseAt = incident.firstResponseAt
    ? typeof incident.firstResponseAt === 'string'
      ? new Date(incident.firstResponseAt)
      : incident.firstResponseAt
    : null;
  const closedAt = incident.closedAt
    ? typeof incident.closedAt === 'string'
      ? new Date(incident.closedAt)
      : incident.closedAt
    : null;

  const slaTargetMinutes = incident.slaTargetMinutes || getIncidentTargetMinutes(incident.priority, config);
  const dueAt = incident.dueAt
    ? typeof incident.dueAt === 'string'
      ? new Date(incident.dueAt)
      : incident.dueAt
    : new Date(createdAt.getTime() + slaTargetMinutes * 60 * 1000);

  const isClosed = incident.status === 'CLOSED' || Boolean(closedAt);

  if (isClosed) {
    const endPoint = closedAt || referenceNow;
    const isLate = firstResponseAt ? firstResponseAt > dueAt : endPoint > dueAt;
    const finalStatus = isLate ? 'CLOSED_BREACHED' : 'CLOSED_ON_TIME';
    const totalElapsed = Math.max(0, Math.round((endPoint.getTime() - createdAt.getTime()) / 60000));
    return {
      slaTargetMinutes,
      dueAt,
      elapsedMinutes: totalElapsed,
      remainingMinutes: 0,
      status: finalStatus,
      isBreached: isLate,
      isApproachingBreach: false,
      isClosed: true,
    };
  }

  if (firstResponseAt) {
    const isResponseLate = firstResponseAt > dueAt;
    const elapsedMinutes = Math.max(0, Math.round((firstResponseAt.getTime() - createdAt.getTime()) / 60000));
    return {
      slaTargetMinutes,
      dueAt,
      elapsedMinutes,
      remainingMinutes: Math.round((dueAt.getTime() - firstResponseAt.getTime()) / 60000),
      status: isResponseLate ? 'BREACHED' : 'ON_TIME',
      isBreached: isResponseLate,
      isApproachingBreach: false,
      isClosed: false,
    };
  }

  const elapsedMinutes = Math.max(0, Math.round((referenceNow.getTime() - createdAt.getTime()) / 60000));
  const remainingMinutes = Math.round((dueAt.getTime() - referenceNow.getTime()) / 60000);
  const warningThresholdMinutes = (slaTargetMinutes * config.warningPercent) / 100;

  let status = 'ON_TIME';
  let isBreached = false;
  let isApproachingBreach = false;

  if (referenceNow > dueAt) {
    status = 'BREACHED';
    isBreached = true;
  } else if (elapsedMinutes >= warningThresholdMinutes) {
    status = 'APPROACHING_BREACH';
    isApproachingBreach = true;
  }

  return {
    slaTargetMinutes,
    dueAt,
    elapsedMinutes,
    remainingMinutes,
    status,
    isBreached,
    isApproachingBreach,
    isClosed: false,
  };
}

function calculateComplaintDueAt(priority = 'NORMAL', createdAt, config) {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const targetHours = priority === 'URGENT' ? config.complaintUrgentHours : config.complaintNormalHours;
  const dueAt = new Date(created.getTime() + targetHours * 3600 * 1000);
  return { dueAt, targetHours };
}

function calculateComplaintSlaStatus(complaint, config, referenceNow = new Date()) {
  const createdAt = typeof complaint.createdAt === 'string' ? new Date(complaint.createdAt) : complaint.createdAt;
  const resolvedAt = complaint.resolvedAt
    ? typeof complaint.resolvedAt === 'string'
      ? new Date(complaint.resolvedAt)
    : complaint.resolvedAt
    : null;

  const dueAt = complaint.dueAt
    ? typeof complaint.dueAt === 'string'
      ? new Date(complaint.dueAt)
      : complaint.dueAt
    : calculateComplaintDueAt(complaint.priority || 'NORMAL', createdAt, config).dueAt;

  const isResolved = complaint.status === 'RESOLVED' || Boolean(resolvedAt);

  if (isResolved) {
    const endPoint = resolvedAt || referenceNow;
    const isLate = endPoint > dueAt;
    return {
      dueAt,
      status: isLate ? 'RESOLVED_BREACHED' : 'RESOLVED_ON_TIME',
      isBreached: isLate,
      isApproachingBreach: false,
      isResolved: true,
    };
  }

  const totalDurationMs = dueAt.getTime() - createdAt.getTime();
  const elapsedMs = referenceNow.getTime() - createdAt.getTime();
  const warningMs = (totalDurationMs * config.warningPercent) / 100;

  if (referenceNow > dueAt) {
    return {
      dueAt,
      status: 'BREACHED',
      isBreached: true,
      isApproachingBreach: false,
      isResolved: false,
    };
  }

  if (elapsedMs >= warningMs) {
    return {
      dueAt,
      status: 'APPROACHING_BREACH',
      isBreached: false,
      isApproachingBreach: true,
      isResolved: false,
    };
  }

  return {
    dueAt,
    status: 'ON_TIME',
    isBreached: false,
    isApproachingBreach: false,
    isResolved: false,
  };
}

module.exports = {
  DEFAULT_SLA_CONFIG,
  getSlaConfig,
  getIncidentTargetMinutes,
  calculateIncidentDueAt,
  calculateIncidentSlaStatus,
  calculateComplaintDueAt,
  calculateComplaintSlaStatus,
};
