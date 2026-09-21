import prisma from './prisma';

export type RiskLevelType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskStatusType =
  | 'IDENTIFIED'
  | 'ASSESSED'
  | 'TREATMENT_IN_PROGRESS'
  | 'MONITORED'
  | 'RESOLVED'
  | 'CLOSED';

export type RiskCategoryType =
  | 'ARMED_CONFLICT_SECURITY'
  | 'ACCESS_ROADBLOCK_DENIAL'
  | 'EXPLOSIVE_HAZARD_UXO'
  | 'CRIMINALITY_THEFT'
  | 'STAFF_DETENTION_THREAT'
  | 'FACILITY_DAMAGE'
  | 'ENVIRONMENTAL_NATURAL'
  | 'HEALTH_SAFETY';

export type MitigationStatusType =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DELAYED'
  | 'CANCELLED';

export type MitigationTypeType = 'PREVENTIVE' | 'CONTINGENCY' | 'CORRECTIVE';

export interface ScoreCalculationResult {
  score: number;
  level: RiskLevelType;
  isValid: boolean;
  error?: string;
}

/**
 * Calculates risk score (1-25) and assigns level based on Likelihood and Impact (1-5).
 * 1-4: LOW
 * 5-9: MEDIUM
 * 10-16: HIGH
 * 17-25: CRITICAL
 */
export function calculateRiskScore(likelihood: number, impact: number): ScoreCalculationResult {
  if (
    typeof likelihood !== 'number' ||
    typeof impact !== 'number' ||
    !Number.isInteger(likelihood) ||
    !Number.isInteger(impact) ||
    likelihood < 1 ||
    likelihood > 5 ||
    impact < 1 ||
    impact > 5
  ) {
    return {
      score: 0,
      level: 'LOW',
      isValid: false,
      error: 'قيم الاحتمالية وشدة الأثر يجب أن تكون أرقاماً صحيحة بين 1 و 5',
    };
  }

  const score = likelihood * impact;
  let level: RiskLevelType = 'LOW';

  if (score >= 17) {
    level = 'CRITICAL';
  } else if (score >= 10) {
    level = 'HIGH';
  } else if (score >= 5) {
    level = 'MEDIUM';
  } else {
    level = 'LOW';
  }

  return {
    score,
    level,
    isValid: true,
  };
}

/**
 * Generates official formatted risk number: AICSFA-RSK-YYYY-XXXXXX
 */
export async function generateRiskNumber(client = prisma): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `AICSFA-RSK-${currentYear}-`;

  const lastRisk = await (client as any).operationalRisk.findFirst({
    where: {
      riskNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      riskNumber: 'desc',
    },
    select: {
      riskNumber: true,
    },
  });

  let nextSequence = 1;
  if (lastRisk && lastRisk.riskNumber) {
    const parts = lastRisk.riskNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  const sequenceStr = String(nextSequence).padStart(6, '0');
  return `${prefix}${sequenceStr}`;
}

/**
 * Maps IncidentCategory to RiskCategory
 */
export function mapIncidentCategoryToRiskCategory(incidentCat: string): RiskCategoryType {
  switch (incidentCat) {
    case 'ARMED_CONFLICT_TACTICAL':
      return 'ARMED_CONFLICT_SECURITY';
    case 'HUMANITARIAN_ACCESS_DENIAL':
    case 'CIVIL_UNREST_ROADBLOCK':
      return 'ACCESS_ROADBLOCK_DENIAL';
    case 'UXO_LANDMINE_HAZARD':
      return 'EXPLOSIVE_HAZARD_UXO';
    case 'DETENTION_HARASSMENT':
    case 'PHYSICAL_ATTACK_THREAT':
      return 'STAFF_DETENTION_THREAT';
    case 'NATURAL_DISASTER_ENVIRONMENTAL':
      return 'ENVIRONMENTAL_NATURAL';
    default:
      return 'ARMED_CONFLICT_SECURITY';
  }
}

/**
 * Safely extracts operational sanitized data from an incident for risk register entry.
 * Strictly guarantees that NO source identity, raw encrypted text, exact GPS,
 * or sensitive attachments are leaked.
 */
export function extractSanitizedIncidentData(incident: any): {
  incidentId: string;
  incidentNumber: string;
  title: string;
  description: string;
  category: RiskCategoryType;
  governorate: string;
  district: string | null;
  generalLocation: string | null;
  suggestedLikelihood: number;
  suggestedImpact: number;
} {
  const currentRedacted =
    incident.redactedVersions?.find((r: any) => r.isCurrent) ||
    incident.redactedVersions?.[0];

  const category = mapIncidentCategoryToRiskCategory(incident.category);

  // Suggested initial score based on incident priority
  let suggestedLikelihood = 3;
  let suggestedImpact = 3;

  if (incident.priority === 'CRITICAL_EMERGENCY') {
    suggestedLikelihood = 4;
    suggestedImpact = 5;
  } else if (incident.priority === 'HIGH') {
    suggestedLikelihood = 3;
    suggestedImpact = 4;
  } else if (incident.priority === 'LOW') {
    suggestedLikelihood = 2;
    suggestedImpact = 2;
  }

  return {
    incidentId: incident.id,
    incidentNumber: incident.incidentNumber,
    title: currentRedacted?.redactedTitleAr || `خطر ميداني مستنبط من البلاغ ${incident.incidentNumber}`,
    description:
      currentRedacted?.redactedDescAr ||
      currentRedacted?.immediateImpact ||
      `متابعة التهديدات والمخاطر المترتبة على وقائع البلاغ الميداني رقم ${incident.incidentNumber} في محافظة ${incident.governorate}.`,
    category,
    governorate: incident.governorate,
    district: incident.district || null,
    generalLocation: currentRedacted?.safeAreaScopeAr || incident.district || incident.governorate,
    suggestedLikelihood,
    suggestedImpact,
  };
}

/**
 * Visual styling and metadata for risk levels
 */
export function getRiskLevelMeta(level: RiskLevelType | string) {
  switch (level) {
    case 'CRITICAL':
      return {
        labelAr: 'حرج / شديد الخطورة',
        labelEn: 'Critical Risk',
        color: '#dc2626',
        bg: 'rgba(220, 38, 38, 0.15)',
        border: 'rgba(220, 38, 38, 0.4)',
        badgeClass: 'badge-danger',
      };
    case 'HIGH':
      return {
        labelAr: 'مرتفع',
        labelEn: 'High Risk',
        color: '#ea580c',
        bg: 'rgba(234, 88, 12, 0.15)',
        border: 'rgba(234, 88, 12, 0.4)',
        badgeClass: 'badge-warning',
      };
    case 'MEDIUM':
      return {
        labelAr: 'متوسط',
        labelEn: 'Medium Risk',
        color: '#d97706',
        bg: 'rgba(217, 119, 6, 0.15)',
        border: 'rgba(217, 119, 6, 0.4)',
        badgeClass: 'badge-info',
      };
    case 'LOW':
    default:
      return {
        labelAr: 'منخفض',
        labelEn: 'Low Risk',
        color: '#16a34a',
        bg: 'rgba(22, 163, 74, 0.15)',
        border: 'rgba(22, 163, 74, 0.4)',
        badgeClass: 'badge-success',
      };
  }
}

/**
 * Visual styling and metadata for risk operational statuses
 */
export function getRiskStatusMeta(status: RiskStatusType | string) {
  switch (status) {
    case 'IDENTIFIED':
      return { labelAr: 'تم الرصد (جديد)', labelEn: 'Identified', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' };
    case 'ASSESSED':
      return { labelAr: 'تم التقييم', labelEn: 'Assessed', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
    case 'TREATMENT_IN_PROGRESS':
      return { labelAr: 'قيد المعالجة والتخفيف', labelEn: 'In Treatment', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    case 'MONITORED':
      return { labelAr: 'تحت المراقبة النشطة', labelEn: 'Monitored', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
    case 'RESOLVED':
      return { labelAr: 'تمت المعالجة', labelEn: 'Resolved', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    case 'CLOSED':
      return { labelAr: 'مغلق', labelEn: 'Closed', color: '#475569', bg: 'rgba(71, 85, 105, 0.15)' };
    default:
      return { labelAr: status, labelEn: status, color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' };
  }
}

/**
 * Visual styling and metadata for risk categories
 */
export function getRiskCategoryMeta(category: RiskCategoryType | string) {
  switch (category) {
    case 'ARMED_CONFLICT_SECURITY':
      return { labelAr: 'نزاع مسلح وتهديدات أمنية', labelEn: 'Armed Conflict & Security', icon: 'ShieldAlert' };
    case 'ACCESS_ROADBLOCK_DENIAL':
      return { labelAr: 'إعاقة وصول وقطع طرق ونقاط تفتيش', labelEn: 'Access Denial & Roadblocks', icon: 'Ban' };
    case 'EXPLOSIVE_HAZARD_UXO':
      return { labelAr: 'ألغام ومخلفات حرب ومقذوفات (UXO)', labelEn: 'UXO & Explosive Hazards', icon: 'Bomb' };
    case 'CRIMINALITY_THEFT':
      return { labelAr: 'سطو مسلح وجريمة وسرقة قوافل', labelEn: 'Criminality & Theft', icon: 'AlertTriangle' };
    case 'STAFF_DETENTION_THREAT':
      return { labelAr: 'احتجاز واعتداء على الطواقم الإنسانية', labelEn: 'Staff Detention & Threat', icon: 'Users' };
    case 'FACILITY_DAMAGE':
      return { labelAr: 'أضرار المقرات والمرافق والمخازن', labelEn: 'Facility & Compound Damage', icon: 'Building2' };
    case 'ENVIRONMENTAL_NATURAL':
      return { labelAr: 'كوارث طبيعية وسيول وانهيارات', labelEn: 'Environmental & Natural Hazards', icon: 'CloudRain' };
    case 'HEALTH_SAFETY':
      return { labelAr: 'صحة وسلامة مهنية وحوادث سير', labelEn: 'Occupational Health & Safety', icon: 'HeartPulse' };
    default:
      return { labelAr: category, labelEn: category, icon: 'AlertCircle' };
  }
}
