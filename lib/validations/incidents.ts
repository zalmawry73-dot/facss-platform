export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export const VALID_INCIDENT_CATEGORIES = [
  // Historical Categories
  'ARMED_CONFLICT_TACTICAL',
  'HUMANITARIAN_ACCESS_DENIAL',
  'PHYSICAL_ATTACK_THREAT',
  'UXO_LANDMINE_HAZARD',
  'CIVIL_UNREST_ROADBLOCK',
  'DETENTION_HARASSMENT',
  'NATURAL_DISASTER_ENVIRONMENTAL',
  // Package B: Security & Safety Operational Categories
  'THEFT',
  'INTRUSION',
  'FIRE',
  'INJURY',
  'SAFETY_INCIDENT',
  'VEHICLE_INCIDENT',
  'SECURITY_THREAT',
] as const;

export type IncidentCategoryType = typeof VALID_INCIDENT_CATEGORIES[number];

export const VALID_INCIDENT_PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL_EMERGENCY',
] as const;

export type IncidentPriorityType = typeof VALID_INCIDENT_PRIORITIES[number];

export const VALID_ADMIRALTY_RELIABILITY = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export const VALID_ADMIRALTY_CREDIBILITY = ['1', '2', '3', '4', '5', '6'] as const;

export interface IncidentIntakeInput {
  category: IncidentCategoryType;
  priority: IncidentPriorityType;
  governorate: string;
  district?: string | null;
  incidentDate: string;
  sourceType: string;
  // Sensitive Original Fields (to be encrypted)
  sourceName?: string | null;
  sourcePhone?: string | null;
  sourceOrg?: string | null;
  exactLocationDesc?: string | null;
  exactLatitude?: number | null;
  exactLongitude?: number | null;
  rawDescription: string;
  initialRiskNotes?: string | null;
  attachments?: Array<{
    fileName: string;
    fileBase64: string;
    mimeType: string;
  }>;
}

export function validateIncidentIntake(body: any): ValidationResult<IncidentIntakeInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: 'بيانات البلاغ مطلوبة' } };
  }

  // Category
  if (!body.category || !VALID_INCIDENT_CATEGORIES.includes(body.category)) {
    errors.category = `تصنيف البلاغ غير صالح. التصنيفات المقبولة: ${VALID_INCIDENT_CATEGORIES.join(', ')}`;
  }

  // Priority
  let priority: IncidentPriorityType = 'MEDIUM';
  if (body.priority) {
    if (!VALID_INCIDENT_PRIORITIES.includes(body.priority)) {
      errors.priority = `أولوية البلاغ غير صالحة. الأولويات المقبولة: ${VALID_INCIDENT_PRIORITIES.join(', ')}`;
    } else {
      priority = body.priority;
    }
  }

  // Governorate
  if (!body.governorate || typeof body.governorate !== 'string' || body.governorate.trim().length < 2) {
    errors.governorate = 'المحافظة مطلوبة (حرفان كحد أدنى)';
  }

  // Incident Date
  if (!body.incidentDate || isNaN(Date.parse(body.incidentDate))) {
    errors.incidentDate = 'تاريخ وتوقيت وقوع الحدث مطلوب بصيغة زمنية صحيحة';
  }

  // Raw Description
  if (!body.rawDescription || typeof body.rawDescription !== 'string' || body.rawDescription.trim().length < 10) {
    errors.rawDescription = 'السرد التفصيلي للحدث مطلوب (10 أحرف على الأقل)';
  }

  // Latitude and Longitude (if supplied, validate ranges)
  let lat: number | null = null;
  if (body.exactLatitude !== undefined && body.exactLatitude !== null && body.exactLatitude !== '') {
    const parsedLat = Number(body.exactLatitude);
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      errors.exactLatitude = 'خط العرض غير صالح (يجب أن يكون بين -90 و 90)';
    } else {
      lat = parsedLat;
    }
  }

  let lng: number | null = null;
  if (body.exactLongitude !== undefined && body.exactLongitude !== null && body.exactLongitude !== '') {
    const parsedLng = Number(body.exactLongitude);
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      errors.exactLongitude = 'خط الطول غير صالح (يجب أن يكون بين -180 و 180)';
    } else {
      lng = parsedLng;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      category: body.category,
      priority,
      governorate: body.governorate.trim(),
      district: body.district ? String(body.district).trim() : null,
      incidentDate: new Date(body.incidentDate).toISOString(),
      sourceType: body.sourceType ? String(body.sourceType).trim() : 'FIELD_FOCAL_POINT',
      sourceName: body.sourceName ? String(body.sourceName).trim() : null,
      sourcePhone: body.sourcePhone ? String(body.sourcePhone).trim() : null,
      sourceOrg: body.sourceOrg ? String(body.sourceOrg).trim() : null,
      exactLocationDesc: body.exactLocationDesc ? String(body.exactLocationDesc).trim() : null,
      exactLatitude: lat,
      exactLongitude: lng,
      rawDescription: body.rawDescription.trim(),
      initialRiskNotes: body.initialRiskNotes ? String(body.initialRiskNotes).trim() : null,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
    },
  };
}

// ----------------------------------------------------
// 2. REDACTED VERSION INPUT VALIDATION
// ----------------------------------------------------
export interface RedactedVersionInput {
  redactedTitleAr: string;
  redactedTitleEn?: string | null;
  redactedDescAr: string;
  redactedDescEn?: string | null;
  safeAreaScopeAr: string;
  safeAreaScopeEn?: string | null;
  immediateImpact?: string | null;
  safetyAdvisory?: string | null;
  isApproved?: boolean;
}

export function validateRedactedVersionInput(
  body: any,
  originalSensitiveContext?: { sourceName?: string | null; sourcePhone?: string | null; exactCoords?: string | null }
): ValidationResult<RedactedVersionInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: 'بيانات النسخة المنقحة مطلوبة' } };
  }

  if (!body.redactedTitleAr || typeof body.redactedTitleAr !== 'string' || body.redactedTitleAr.trim().length < 3) {
    errors.redactedTitleAr = 'العنوان المنقح بالعربية مطلوب (3 أحرف على الأقل)';
  }

  if (!body.redactedDescAr || typeof body.redactedDescAr !== 'string' || body.redactedDescAr.trim().length < 10) {
    errors.redactedDescAr = 'السرد المنقح بالعربية مطلوب ويجب ألا يقل عن 10 أحرف';
  }

  if (!body.safeAreaScopeAr || typeof body.safeAreaScopeAr !== 'string' || body.safeAreaScopeAr.trim().length < 2) {
    errors.safeAreaScopeAr = 'النطاق الجغرافي الآمن مطلوب (مثال: مديرية المنصورة، عموم عدن)';
  }

  // Anti-Leakage Verification: ensure sensitive data doesn't leak into redacted text
  if (originalSensitiveContext) {
    const combinedRedactedText = `${body.redactedTitleAr || ''} ${body.redactedDescAr || ''} ${body.safeAreaScopeAr || ''}`;

    if (originalSensitiveContext.sourceName && originalSensitiveContext.sourceName.trim().length > 2) {
      if (combinedRedactedText.includes(originalSensitiveContext.sourceName.trim())) {
        errors.antiLeakage = 'تنبيه أمني صارم: تم اكتشاف اسم المصدر الحساس داخل النص المنقح! يمنع كشف هوية المصدر في النسخة المنقحة.';
      }
    }

    if (originalSensitiveContext.sourcePhone && originalSensitiveContext.sourcePhone.trim().length > 5) {
      if (combinedRedactedText.includes(originalSensitiveContext.sourcePhone.trim())) {
        errors.antiLeakage = 'تنبيه أمني صارم: تم اكتشاف رقم هاتف المصدر داخل النص المنقح! يمنع إدراج بيانات الاتصال.';
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      redactedTitleAr: body.redactedTitleAr.trim(),
      redactedTitleEn: body.redactedTitleEn ? String(body.redactedTitleEn).trim() : null,
      redactedDescAr: body.redactedDescAr.trim(),
      redactedDescEn: body.redactedDescEn ? String(body.redactedDescEn).trim() : null,
      safeAreaScopeAr: body.safeAreaScopeAr.trim(),
      safeAreaScopeEn: body.safeAreaScopeEn ? String(body.safeAreaScopeEn).trim() : null,
      immediateImpact: body.immediateImpact ? String(body.immediateImpact).trim() : null,
      safetyAdvisory: body.safetyAdvisory ? String(body.safetyAdvisory).trim() : null,
      isApproved: Boolean(body.isApproved),
    },
  };
}

// ----------------------------------------------------
// 3. TASK ASSIGNMENT INPUT VALIDATION
// ----------------------------------------------------
export interface AssignmentInput {
  assignedToUserId: string;
  roleScope: 'VERIFIER' | 'ANALYST';
  instructions?: string | null;
}

export function validateAssignmentInput(body: any): ValidationResult<AssignmentInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: 'بيانات التكليف مطلوبة' } };
  }

  if (!body.assignedToUserId || typeof body.assignedToUserId !== 'string') {
    errors.assignedToUserId = 'معرّف الموظف المكلف مطلوب';
  }

  if (!body.roleScope || !['VERIFIER', 'ANALYST'].includes(body.roleScope)) {
    errors.roleScope = 'طبيعة التكليف غير صالحة. الخيارات المتاحة: VERIFIER أو ANALYST';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      assignedToUserId: body.assignedToUserId.trim(),
      roleScope: body.roleScope,
      instructions: body.instructions ? String(body.instructions).trim() : null,
    },
  };
}

// ----------------------------------------------------
// 4. VERIFICATION RECORD INPUT VALIDATION (ADMIRALTY CODE)
// ----------------------------------------------------
export interface VerificationInput {
  sourceReliability: typeof VALID_ADMIRALTY_RELIABILITY[number];
  infoCredibility: typeof VALID_ADMIRALTY_CREDIBILITY[number];
  verificationMethod: string;
  verificationSummary: string;
  corroboratingCount?: number;
  contradictionsFound?: boolean;
  contradictionNotes?: string | null;
  recommendedStatus?: 'VERIFIED' | 'UNCONFIRMED' | 'CONTRADICTED' | 'DISPROVED';
}

export function validateVerificationInput(body: any): ValidationResult<VerificationInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: 'بيانات التحقق مطلوبة' } };
  }

  if (!body.sourceReliability || !VALID_ADMIRALTY_RELIABILITY.includes(body.sourceReliability)) {
    errors.sourceReliability = 'تقييم موثوقية المصدر (Admiralty Reliability) غير صالح (A إلى F)';
  }

  if (!body.infoCredibility || !VALID_ADMIRALTY_CREDIBILITY.includes(body.infoCredibility)) {
    errors.infoCredibility = 'تقييم مصداقية المعلومة (Admiralty Credibility) غير صالح (1 إلى 6)';
  }

  if (!body.verificationMethod || typeof body.verificationMethod !== 'string' || body.verificationMethod.trim().length < 3) {
    errors.verificationMethod = 'منهجية وطريقة التحقق مطلوبة (3 أحرف على الأقل)';
  }

  if (!body.verificationSummary || typeof body.verificationSummary !== 'string' || body.verificationSummary.trim().length < 10) {
    errors.verificationSummary = 'ملخص وخلاصة التحقق مطلوبة (10 أحرف على الأقل)';
  }

  const validStatuses = ['VERIFIED', 'UNCONFIRMED', 'CONTRADICTED', 'DISPROVED'];
  if (body.recommendedStatus && !validStatuses.includes(body.recommendedStatus)) {
    errors.recommendedStatus = `الحالة الموصى بها غير صالحة. الحالات المقبولة: ${validStatuses.join(', ')}`;
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      sourceReliability: body.sourceReliability,
      infoCredibility: body.infoCredibility,
      verificationMethod: body.verificationMethod.trim(),
      verificationSummary: body.verificationSummary.trim(),
      corroboratingCount: Number(body.corroboratingCount) >= 0 ? Number(body.corroboratingCount) : 1,
      contradictionsFound: Boolean(body.contradictionsFound),
      contradictionNotes: body.contradictionNotes ? String(body.contradictionNotes).trim() : null,
      recommendedStatus: body.recommendedStatus || 'VERIFIED',
    },
  };
}
