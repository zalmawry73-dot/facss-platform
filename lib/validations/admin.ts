import { CAPABILITIES, ALL_CAPABILITIES, Capability } from '../rbac';
import { vMsg, resolveLocale, ValidationLocale } from './common';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

// ----------------------------------------------------
// 1. TRAINING COURSE VALIDATION
// ----------------------------------------------------
const VALID_COURSE_STATUSES = ['DRAFT', 'OPEN', 'FULL', 'ONGOING', 'COMPLETED', 'CANCELLED'] as const;
export type CourseStatusType = typeof VALID_COURSE_STATUSES[number];

export interface CourseInput {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  trainerName: string;
  startDate?: string | null;
  endDate?: string | null;
  duration: string;
  location: string;
  capacity: number;
  status: CourseStatusType;
  categoryId: string;
  requirementsAr?: string | null;
  requirementsEn?: string | null;
  hasCertificate?: boolean;
  requiresPreEval?: boolean;
  requiresPostEval?: boolean;
  minAttendancePct?: number;
  courseType?: 'PUBLIC' | 'PRIVATE_CLIENT';
  deliveryMode?: string;
  clientId?: string | null;
  objectivesAr?: string | null;
  objectivesEn?: string | null;
  targetAudienceAr?: string | null;
  targetAudienceEn?: string | null;
}

export function validateCourseInput(body: any, isPartial = false, locale?: string): ValidationResult<CourseInput> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!isPartial || body.titleAr !== undefined) {
    if (!body.titleAr || typeof body.titleAr !== 'string' || body.titleAr.trim().length < 3) {
      errors.titleAr = vMsg('عنوان الدورة بالعربية مطلوب ويجب أن يكون 3 أحرف على الأقل', 'Arabic course title is required (min 3 characters)', loc);
    }
  }

  if (!isPartial || body.titleEn !== undefined) {
    if (!body.titleEn || typeof body.titleEn !== 'string' || body.titleEn.trim().length < 3) {
      errors.titleEn = vMsg('عنوان الدورة بالإنجليزية مطلوب ويجب أن يكون 3 أحرف على الأقل', 'English course title is required (min 3 characters)', loc);
    }
  }

  if (!isPartial || body.descriptionAr !== undefined) {
    if (!body.descriptionAr || typeof body.descriptionAr !== 'string' || body.descriptionAr.trim().length < 10) {
      errors.descriptionAr = vMsg('وصف الدورة بالعربية مطلوب (10 أحرف كحد أدنى)', 'Arabic course description is required (min 10 characters)', loc);
    }
  }

  if (!isPartial || body.descriptionEn !== undefined) {
    if (!body.descriptionEn || typeof body.descriptionEn !== 'string' || body.descriptionEn.trim().length < 10) {
      errors.descriptionEn = vMsg('وصف الدورة بالإنجليزية مطلوب (10 أحرف كحد أدنى)', 'English course description is required (min 10 characters)', loc);
    }
  }

  if (!isPartial || body.trainerName !== undefined) {
    if (!body.trainerName || typeof body.trainerName !== 'string' || body.trainerName.trim().length < 2) {
      errors.trainerName = vMsg('اسم المدرب أو المحاضر مطلوب', 'Trainer / instructor name is required', loc);
    }
  }

  if (!isPartial || body.duration !== undefined) {
    if (!body.duration || typeof body.duration !== 'string' || body.duration.trim().length < 2) {
      errors.duration = vMsg('مدة الدورة مطلوبة (مثال: 5 أيام / 20 ساعة)', 'Course duration is required (e.g. 5 days / 20 hours)', loc);
    }
  }

  if (!isPartial || body.location !== undefined) {
    if (!body.location || typeof body.location !== 'string' || body.location.trim().length < 2) {
      errors.location = vMsg('مقر أو قاعة التدريب مطلوبة', 'Training venue or room is required', loc);
    }
  }

  if (!isPartial || body.capacity !== undefined) {
    const capNum = Number(body.capacity);
    if (isNaN(capNum) || capNum < 1 || capNum > 1000) {
      errors.capacity = vMsg('سعة المقاعد يجب أن تكون رقماً صحيحاً بين 1 و 1000', 'Seating capacity must be an integer between 1 and 1000', loc);
    }
  }

  if (!isPartial || body.status !== undefined) {
    if (!body.status || !VALID_COURSE_STATUSES.includes(body.status)) {
      errors.status = vMsg(`حالة الدورة غير صالحة. الحالات المقبولة: ${VALID_COURSE_STATUSES.join(', ')}`, `Invalid course status. Accepted statuses: ${VALID_COURSE_STATUSES.join(', ')}`, loc);
    }
  }

  if (!isPartial || body.categoryId !== undefined) {
    if (!body.categoryId || typeof body.categoryId !== 'string') {
      errors.categoryId = vMsg('تصنيف الدورة التدريبية مطلوب', 'Course category is required', loc);
    }
  }

  if (body.startDate && isNaN(Date.parse(body.startDate))) {
    errors.startDate = vMsg('تاريخ البدء غير صالح', 'Invalid start date', loc);
  }

  if (body.endDate && isNaN(Date.parse(body.endDate))) {
    errors.endDate = vMsg('تاريخ الانتهاء غير صالح', 'Invalid end date', loc);
  }

  if (body.startDate && body.endDate && Date.parse(body.startDate) > Date.parse(body.endDate)) {
    errors.endDate = vMsg('تاريخ الانتهاء لا يمكن أن يسبق تاريخ البدء', 'End date cannot be earlier than start date', loc);
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      titleAr: body.titleAr?.trim(),
      titleEn: body.titleEn?.trim(),
      descriptionAr: body.descriptionAr?.trim(),
      descriptionEn: body.descriptionEn?.trim(),
      trainerName: body.trainerName?.trim(),
      startDate: body.startDate ? new Date(body.startDate).toISOString() : null,
      endDate: body.endDate ? new Date(body.endDate).toISOString() : null,
      duration: body.duration?.trim(),
      location: body.location?.trim(),
      capacity: Number(body.capacity) || 25,
      status: body.status,
      categoryId: body.categoryId,
      requirementsAr: body.requirementsAr ? body.requirementsAr.trim() : null,
      requirementsEn: body.requirementsEn ? body.requirementsEn.trim() : null,
      hasCertificate: body.hasCertificate !== undefined ? Boolean(body.hasCertificate) : true,
      requiresPreEval: body.requiresPreEval !== undefined ? Boolean(body.requiresPreEval) : false,
      requiresPostEval: body.requiresPostEval !== undefined ? Boolean(body.requiresPostEval) : false,
      minAttendancePct: body.minAttendancePct !== undefined ? Number(body.minAttendancePct) : 75,
      courseType: body.courseType === 'PRIVATE_CLIENT' ? 'PRIVATE_CLIENT' : 'PUBLIC',
      deliveryMode: body.deliveryMode ? String(body.deliveryMode).trim() : 'IN_PERSON',
      clientId: body.clientId ? String(body.clientId).trim() : null,
      objectivesAr: body.objectivesAr ? String(body.objectivesAr).trim() : null,
      objectivesEn: body.objectivesEn ? String(body.objectivesEn).trim() : null,
      targetAudienceAr: body.targetAudienceAr ? String(body.targetAudienceAr).trim() : null,
      targetAudienceEn: body.targetAudienceEn ? String(body.targetAudienceEn).trim() : null,
    },
  };
}

// ----------------------------------------------------
// 2. RESEARCH PUBLICATION VALIDATION
// ----------------------------------------------------
const VALID_RESEARCH_VISIBILITIES = ['PUBLIC', 'CLIENT_ONLY'] as const;
const VALID_RESEARCH_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED'] as const;

export interface ResearchInput {
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  contentAr: string;
  contentEn: string;
  author: string;
  categoryId: string;
  visibility: typeof VALID_RESEARCH_VISIBILITIES[number];
  status: typeof VALID_RESEARCH_STATUSES[number];
  slug?: string;
  isFeatured?: boolean;
}

export function validateResearchInput(body: any, isPartial = false, locale?: string): ValidationResult<ResearchInput> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!isPartial || body.titleAr !== undefined) {
    if (!body.titleAr || typeof body.titleAr !== 'string' || body.titleAr.trim().length < 3) {
      errors.titleAr = vMsg('عنوان الدراسة بالعربية مطلوب (3 أحرف على الأقل)', 'Arabic study title is required (min 3 characters)', loc);
    }
  }

  if (!isPartial || body.titleEn !== undefined) {
    if (!body.titleEn || typeof body.titleEn !== 'string' || body.titleEn.trim().length < 3) {
      errors.titleEn = vMsg('عنوان الدراسة بالإنجليزية مطلوب (3 أحرف على الأقل)', 'English study title is required (min 3 characters)', loc);
    }
  }

  if (!isPartial || body.summaryAr !== undefined) {
    if (!body.summaryAr || typeof body.summaryAr !== 'string' || body.summaryAr.trim().length < 10) {
      errors.summaryAr = vMsg('ملخص الدراسة بالعربية مطلوب (10 أحرف على الأقل)', 'Arabic study summary is required (min 10 characters)', loc);
    }
  }

  if (!isPartial || body.summaryEn !== undefined) {
    if (!body.summaryEn || typeof body.summaryEn !== 'string' || body.summaryEn.trim().length < 10) {
      errors.summaryEn = vMsg('ملخص الدراسة بالإنجليزية مطلوب (10 أحرف على الأقل)', 'English study summary is required (min 10 characters)', loc);
    }
  }

  if (!isPartial || body.contentAr !== undefined) {
    if (!body.contentAr || typeof body.contentAr !== 'string' || body.contentAr.trim().length < 10) {
      errors.contentAr = vMsg('محتوى الدراسة بالعربية مطلوب', 'Arabic research content is required', loc);
    }
  }

  if (!isPartial || body.contentEn !== undefined) {
    if (!body.contentEn || typeof body.contentEn !== 'string' || body.contentEn.trim().length < 10) {
      errors.contentEn = vMsg('محتوى الدراسة بالإنجليزية مطلوب', 'English research content is required', loc);
    }
  }

  if (!isPartial || body.author !== undefined) {
    if (!body.author || typeof body.author !== 'string' || body.author.trim().length < 2) {
      errors.author = vMsg('اسم الباحث أو المؤلف مطلوب', 'Author / researcher name is required', loc);
    }
  }

  if (!isPartial || body.categoryId !== undefined) {
    if (!body.categoryId || typeof body.categoryId !== 'string') {
      errors.categoryId = vMsg('تصنيف البحث مطلوب', 'Research category is required', loc);
    }
  }

  if (!isPartial || body.visibility !== undefined) {
    if (!body.visibility || !VALID_RESEARCH_VISIBILITIES.includes(body.visibility)) {
      errors.visibility = vMsg('مستوى الرؤية يجب أن يكون إما PUBLIC أو CLIENT_ONLY', 'Visibility level must be either PUBLIC or CLIENT_ONLY', loc);
    }
  }

  if (!isPartial || body.status !== undefined) {
    if (!body.status || !VALID_RESEARCH_STATUSES.includes(body.status)) {
      errors.status = vMsg(
        `حالة النشر غير صالحة. الحالات المتاحة: ${VALID_RESEARCH_STATUSES.join(', ')}`,
        `Invalid publication status. Available statuses: ${VALID_RESEARCH_STATUSES.join(', ')}`,
        loc
      );
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      titleAr: body.titleAr?.trim(),
      titleEn: body.titleEn?.trim(),
      summaryAr: body.summaryAr?.trim(),
      summaryEn: body.summaryEn?.trim(),
      contentAr: body.contentAr?.trim(),
      contentEn: body.contentEn?.trim(),
      author: body.author?.trim(),
      categoryId: body.categoryId,
      visibility: body.visibility,
      status: body.status,
      slug: body.slug ? body.slug.trim().toLowerCase().replace(/[^a-z0-9\u0621-\u064A-]+/g, '-') : undefined,
      isFeatured: Boolean(body.isFeatured),
    },
  };
}

// ----------------------------------------------------
// 3. CONTACT MESSAGE STATUS VALIDATION
// ----------------------------------------------------
const VALID_MESSAGE_STATUSES = ['UNREAD', 'READ', 'IN_PROGRESS', 'RESOLVED', 'REPLIED', 'ARCHIVED'] as const;
export type MessageStatusType = typeof VALID_MESSAGE_STATUSES[number];

export interface MessageUpdateInput {
  status?: MessageStatusType;
  replyNotes?: string | null;
  assignedToUserId?: string | null;
  resolutionSummary?: string | null;
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
}

export function validateMessageStatusUpdate(body: any, locale?: string): ValidationResult<MessageUpdateInput> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: vMsg('البيانات مطلوبة', 'Request body data is required', loc) } };
  }

  if (body.status !== undefined && !VALID_MESSAGE_STATUSES.includes(body.status)) {
    errors.status = vMsg(`حالة الرسالة غير صالحة. الحالات المقبولة: ${VALID_MESSAGE_STATUSES.join(', ')}`, `Invalid message status. Accepted: ${VALID_MESSAGE_STATUSES.join(', ')}`, loc);
  }

  if (body.replyNotes !== undefined && body.replyNotes !== null && typeof body.replyNotes !== 'string') {
    errors.replyNotes = vMsg('ملاحظات الرد يجب أن تكون نصاً', 'Reply notes must be a string', loc);
  }

  if (body.resolutionSummary !== undefined && body.resolutionSummary !== null && typeof body.resolutionSummary !== 'string') {
    errors.resolutionSummary = vMsg('ملخص المعالجة والحل يجب أن يكون نصاً', 'Resolution summary must be a string', loc);
  }

  if (body.priority !== undefined && !['NORMAL', 'HIGH', 'URGENT'].includes(body.priority)) {
    errors.priority = vMsg('درجة الأولوية غير صالحة (NORMAL, HIGH, URGENT)', 'Invalid priority level (NORMAL, HIGH, URGENT)', loc);
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      status: body.status,
      replyNotes: body.replyNotes !== undefined ? (body.replyNotes ? String(body.replyNotes).trim() : null) : undefined,
      assignedToUserId: body.assignedToUserId !== undefined ? (body.assignedToUserId ? String(body.assignedToUserId).trim() : null) : undefined,
      resolutionSummary: body.resolutionSummary !== undefined ? (body.resolutionSummary ? String(body.resolutionSummary).trim() : null) : undefined,
      priority: body.priority,
    },
  };
}

// ----------------------------------------------------
// 4. SYSTEM SETTINGS VALIDATION & WHITELIST
// ----------------------------------------------------
export const ALLOWED_SETTING_KEYS = [
  'OFFICIAL_PHONE',
  'WHATSAPP_PHONE',
  'OFFICIAL_EMAIL',
  'OPERATIONS_EMAIL',
  'TRAINING_EMAIL',
  'OFFICIAL_ADDRESS',
  'WORKING_HOURS',
  'SOCIAL_TWITTER',
  'SOCIAL_LINKEDIN',
  'SOCIAL_FACEBOOK',
  'ANNOUNCEMENT_TEXT',
  // Package B: Configurable SLA Settings
  'SLA_RESPONSE_CRITICAL_MINUTES',
  'SLA_RESPONSE_HIGH_MINUTES',
  'SLA_RESPONSE_MEDIUM_MINUTES',
  'SLA_RESPONSE_LOW_MINUTES',
  'SLA_WARNING_PERCENT',
  'SLA_COMPLAINT_NORMAL_HOURS',
  'SLA_COMPLAINT_URGENT_HOURS',
  // Dynamic Operational Fields
  'FIELD_INCIDENT_CATEGORIES',
  'FIELD_SOURCE_TYPES',
  'OPERATIONAL_RISK_CATEGORIES',
  'FIELD_GOVERNORATES',
] as const;

export type AllowedSettingKey = typeof ALLOWED_SETTING_KEYS[number];

// Prohibited keys that must never be set or revealed
export const FORBIDDEN_CONFIG_PATTERNS = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'SECRET',
  'PASSWORD',
  'TOKEN',
  'API_KEY',
  'PRIVATE_KEY',
  'CREDENTIALS',
];

export function validateSettingUpdate(body: any, locale?: string): ValidationResult<{ key: string; value: string }> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body || !body.key || typeof body.key !== 'string') {
    errors.key = vMsg('مفتاح الإعداد مطلوب', 'Setting key is required', loc);
    return { success: false, errors };
  }

  const normalizedKey = body.key.trim().toUpperCase();

  // Check against forbidden security keys
  const isForbidden = FORBIDDEN_CONFIG_PATTERNS.some((p) => normalizedKey.includes(p));
  if (isForbidden) {
    errors.key = vMsg('ممنوع تعديل أو إدخال مفاتيح التكوين الأمنية عبر واجهة الإعدادات', 'Security configuration keys cannot be modified via settings interface', loc);
    return { success: false, errors };
  }

  if (!ALLOWED_SETTING_KEYS.includes(normalizedKey as AllowedSettingKey)) {
    errors.key = vMsg(
      `المفتاح غير مصرح به. المفاتيح المقبولة فقط: ${ALLOWED_SETTING_KEYS.join(', ')}`,
      `Unauthorized key. Allowed keys only: ${ALLOWED_SETTING_KEYS.join(', ')}`,
      loc
    );
    return { success: false, errors };
  }

  if (body.value === undefined || typeof body.value !== 'string') {
    errors.value = vMsg('قيمة الإعداد مطلوبة كنص', 'Setting value is required as a string', loc);
    return { success: false, errors };
  }

  const trimmedValue = body.value.trim();

  // Additional formatting checks
  if (normalizedKey.includes('EMAIL') && trimmedValue.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedValue)) {
      errors.value = vMsg('صيغة البريد الإلكتروني غير صحيحة', 'Invalid email address format', loc);
    }
  }

  // SLA numeric validation
  if (normalizedKey.startsWith('SLA_')) {
    const num = Number(trimmedValue);
    if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
      errors.value = vMsg('قيمة زمن الاستجابة / النسبة لـ SLA يجب أن تكون رقماً صحيحاً موجباً', 'SLA response time / percentage must be a positive integer', loc);
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      key: normalizedKey,
      value: trimmedValue,
    },
  };
}

// ----------------------------------------------------
// 5. USER CAPABILITY ASSIGNMENT VALIDATION
// ----------------------------------------------------
export function validateCapabilityAssignment(body: any, locale?: string): ValidationResult<{ capability: Capability }> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body || !body.capability || typeof body.capability !== 'string') {
    errors.capability = vMsg('الصلاحية (capability) مطلوبة', 'Capability is required', loc);
    return { success: false, errors };
  }

  if (!ALL_CAPABILITIES.includes(body.capability as Capability)) {
    errors.capability = vMsg(`صلاحية غير معروفة. الصلاحيات المتاحة: ${ALL_CAPABILITIES.join(', ')}`, `Unknown capability. Available: ${ALL_CAPABILITIES.join(', ')}`, loc);
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      capability: body.capability as Capability,
    },
  };
}

// ----------------------------------------------------
// 6. TRAINEE REGISTRATION VALIDATION (PHASE 2D)
// ----------------------------------------------------
export interface RegistrationInput {
  courseId: string;
  fullName: string;
  nationalId?: string | null;
  email: string;
  phone: string;
  qualification?: string | null;
}

export function validateRegistrationInput(body: any, locale?: string): ValidationResult<RegistrationInput> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body || !body.courseId || typeof body.courseId !== 'string') {
    errors.courseId = vMsg('معرّف الدورة التدريبية مطلوب', 'Course ID is required', loc);
  }

  if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim().length < 3) {
    errors.fullName = vMsg('الاسم الكامل مطلوب (3 أحرف على الأقل)', 'Full name is required (min 3 characters)', loc);
  }

  if (!body.email || typeof body.email !== 'string') {
    errors.email = vMsg('البريد الإلكتروني مطلوب', 'Email address is required', loc);
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      errors.email = vMsg('صيغة البريد الإلكتروني غير صحيحة', 'Invalid email address format', loc);
    }
  }

  if (!body.phone || typeof body.phone !== 'string' || body.phone.trim().length < 6) {
    errors.phone = vMsg('رقم الهاتف مطلوب (6 أرقام على الأقل)', 'Phone number is required (min 6 digits)', loc);
  }

  if (body.nationalId !== undefined && body.nationalId !== null && typeof body.nationalId !== 'string') {
    errors.nationalId = vMsg('رقم الهوية يجب أن يكون نصاً', 'National ID must be a string', loc);
  }

  if (body.qualification !== undefined && body.qualification !== null && typeof body.qualification !== 'string') {
    errors.qualification = vMsg('المؤهل يجب أن يكون نصاً', 'Qualification must be a string', loc);
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      courseId: body.courseId.trim(),
      fullName: body.fullName.trim(),
      nationalId: body.nationalId ? body.nationalId.trim() : null,
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      qualification: body.qualification ? body.qualification.trim() : null,
    },
  };
}

// ----------------------------------------------------
// 7. REGISTRATION STATUS UPDATE VALIDATION (PHASE 2D)
// ----------------------------------------------------
const VALID_REGISTRATION_STATUSES = ['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'WAITLIST', 'COMPLETED'] as const;
export type RegistrationStatusType = typeof VALID_REGISTRATION_STATUSES[number];

// Allowed status transitions matrix
const REGISTRATION_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['REVIEWING', 'ACCEPTED', 'REJECTED'],
  REVIEWING: ['ACCEPTED', 'REJECTED', 'WAITLIST'],
  WAITLIST: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['COMPLETED', 'REJECTED'],
  // Terminal states: REJECTED, COMPLETED — no transitions allowed
};

export function validateRegistrationStatusUpdate(
  body: any,
  currentStatus: string,
  locale?: string
): ValidationResult<{ status: RegistrationStatusType; adminNotes?: string | null }> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body || !body.status || typeof body.status !== 'string') {
    errors.status = vMsg('حالة التسجيل الجديدة مطلوبة', 'New registration status is required', loc);
    return { success: false, errors };
  }

  if (!VALID_REGISTRATION_STATUSES.includes(body.status as RegistrationStatusType)) {
    errors.status = vMsg(`حالة التسجيل غير صالحة. الحالات المقبولة: ${VALID_REGISTRATION_STATUSES.join(', ')}`, `Invalid registration status. Accepted: ${VALID_REGISTRATION_STATUSES.join(', ')}`, loc);
    return { success: false, errors };
  }

  // Check transition validity
  const allowedNext = REGISTRATION_TRANSITIONS[currentStatus];
  if (!allowedNext || !allowedNext.includes(body.status)) {
    errors.status = vMsg(`لا يمكن الانتقال من حالة [${currentStatus}] إلى [${body.status}]. الانتقالات المسموحة: ${allowedNext ? allowedNext.join(', ') : 'لا توجد (حالة نهائية)'}`, `Cannot transition from status [${currentStatus}] to [${body.status}]. Allowed: ${allowedNext ? allowedNext.join(', ') : 'None (terminal)'}`, loc);
    return { success: false, errors };
  }

  if (body.adminNotes !== undefined && typeof body.adminNotes !== 'string') {
    errors.adminNotes = vMsg('ملاحظات الإدارة يجب أن تكون نصاً', 'Admin notes must be a string', loc);
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      status: body.status as RegistrationStatusType,
      adminNotes: body.adminNotes ? body.adminNotes.trim() : null,
    },
  };
}

// ----------------------------------------------------
// 8. CERTIFICATE ISSUANCE VALIDATION (PHASE 2D)
// ----------------------------------------------------
export interface CertificateInput {
  registrationId: string;
  grade?: string | null;
}

export function validateCertificateInput(body: any, locale?: string): ValidationResult<CertificateInput> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body || !body.registrationId || typeof body.registrationId !== 'string') {
    errors.registrationId = vMsg('معرّف تسجيل المتدرب مطلوب', 'Trainee registration ID is required', loc);
    return { success: false, errors };
  }

  if (body.grade !== undefined && body.grade !== null) {
    if (typeof body.grade !== 'string' || body.grade.trim().length < 1) {
      errors.grade = vMsg('التقدير يجب أن يكون نصاً غير فارغ', 'Grade must be a non-empty string', loc);
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      registrationId: body.registrationId.trim(),
      grade: body.grade ? body.grade.trim() : null,
    },
  };
}

// ----------------------------------------------------
// 9. CREATE USER VALIDATION (PHASE 2 COMMAND 2)
// ----------------------------------------------------
export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  role: string;
  phone?: string | null;
  organization?: string | null;
  functionalArea?: string | null;
  capabilities?: Capability[];
}

export const VALID_FUNCTIONAL_AREAS = [
  'PROGRAMS_OPERATIONS', // البرامج والعمليات
  'MONITORING_ANALYSIS', // الرصد والتحليل
  'RESEARCH_FIELD_FOCAL', // البحث والاتصال الميداني
  'TRAINING_CAPACITY',    // التدريب وبناء القدرات
] as const;

export function validateCreateUserInput(body: any, locale?: string): ValidationResult<CreateUserInput> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: vMsg('بيانات المستخدم مطلوبة', 'User data is required', loc) } };
  }

  // Full Name
  if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim().length < 3) {
    errors.fullName = vMsg('الاسم الكامل مطلوب ويجب ألا يقل عن 3 أحرف', 'Full name is required (min 3 characters)', loc);
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!body.email || typeof body.email !== 'string' || !emailRegex.test(body.email.trim())) {
    errors.email = vMsg('البريد الإلكتروني غير صالح أو غير مدخل بالشكل الصحيح', 'Valid email address is required', loc);
  }

  // Password
  if (!body.password || typeof body.password !== 'string' || body.password.length < 8) {
    errors.password = vMsg('كلمة المرور مطلوبة وتتطلب 8 خانات على الأقل', 'Password is required (min 8 characters)', loc);
  }

  // Role
  const validRoles = [
    'ADMIN',
    'STAFF',
    'CONTENT_MANAGER',
    'SERVICE_MANAGER',
    'TRAINING_MANAGER',
    'RESEARCH_MANAGER',
    'EMPLOYEE',
    'FIELD_FOCAL_POINT',
    'CLIENT',
    'TRAINEE',
  ];

  if (!body.role || !validRoles.includes(body.role)) {
    errors.role = vMsg(`الرتبة المحددة غير صالحة. الرتب المسموح إنشاؤها: ${validRoles.join(', ')}`, `Invalid role. Allowed roles: ${validRoles.join(', ')}`, loc);
  }

  // Functional Area (optional)
  if (body.functionalArea && !VALID_FUNCTIONAL_AREAS.includes(body.functionalArea)) {
    errors.functionalArea = vMsg(`مجال العمل غير صالح. المجالات المعتمدة: ${VALID_FUNCTIONAL_AREAS.join(', ')}`, `Invalid functional area. Allowed: ${VALID_FUNCTIONAL_AREAS.join(', ')}`, loc);
  }

  // Capabilities
  let validatedCaps: Capability[] = [];
  if (body.capabilities) {
    if (!Array.isArray(body.capabilities)) {
      errors.capabilities = vMsg('قائمة الصلاحيات يجب أن تكون مصفوفة', 'Capabilities must be an array', loc);
    } else {
      const invalidCaps = body.capabilities.filter((c: any) => !ALL_CAPABILITIES.includes(c));
      if (invalidCaps.length > 0) {
        errors.capabilities = vMsg(`صلاحيات غير معروفة: ${invalidCaps.join(', ')}`, `Unknown capabilities: ${invalidCaps.join(', ')}`, loc);
      } else {
        validatedCaps = body.capabilities as Capability[];
      }
    }
  }

  // Strict focal point check
  if (body.role === 'FIELD_FOCAL_POINT') {
    const forbiddenCaps = validatedCaps.filter((c) => c !== CAPABILITIES.SUBMIT_INCIDENT);
    if (forbiddenCaps.length > 0) {
      errors.capabilities = vMsg(`نقاط الاتصال الميدانية لا يمكن منحها صلاحيات إدارية [${forbiddenCaps.join(', ')}]. الصلاحية المسموحة حصراً هي submit_incident.`, `Field focal points cannot be granted admin capabilities [${forbiddenCaps.join(', ')}]. Allowed only: submit_incident.`, loc);
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      fullName: body.fullName.trim(),
      email: body.email.trim().toLowerCase(),
      password: body.password,
      role: body.role,
      phone: body.phone ? String(body.phone).trim() : null,
      organization: body.organization ? String(body.organization).trim() : null,
      functionalArea: body.functionalArea || null,
      capabilities: validatedCaps,
    },
  };
}

// ----------------------------------------------------
// 10. OPERATIONAL RISK REGISTER VALIDATIONS (PHASE 3)
// ----------------------------------------------------
export const VALID_RISK_CATEGORIES = [
  'ARMED_CONFLICT_SECURITY',
  'ACCESS_ROADBLOCK_DENIAL',
  'EXPLOSIVE_HAZARD_UXO',
  'CRIMINALITY_THEFT',
  'STAFF_DETENTION_THREAT',
  'FACILITY_DAMAGE',
  'ENVIRONMENTAL_NATURAL',
  'HEALTH_SAFETY',
] as const;

export const VALID_RISK_STATUSES = [
  'IDENTIFIED',
  'ASSESSED',
  'TREATMENT_IN_PROGRESS',
  'MONITORED',
  'RESOLVED',
  'CLOSED',
] as const;

export const VALID_MITIGATION_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'DELAYED',
  'CANCELLED',
] as const;

export const VALID_MITIGATION_TYPES = [
  'PREVENTIVE',
  'CONTINGENCY',
  'CORRECTIVE',
] as const;

export interface RiskInputData {
  title: string;
  description: string;
  category: (typeof VALID_RISK_CATEGORIES)[number];
  governorate: string;
  district?: string | null;
  generalLocation?: string | null;
  incidentId?: string | null;
  likelihood: number;
  impact: number;
  targetResolutionDate?: Date | null;
}

export function validateRiskInput(body: any, locale?: string): ValidationResult<RiskInputData> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: vMsg('بيانات الإدخال مفقودة', 'Input data is missing', loc) } };
  }

  // Title
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 5) {
    errors.title = vMsg('عنوان الخطر التشغيلي مطلوب ويجب أن يحتوي على 5 أحرف على الأقل', 'Operational risk title is required (min 5 characters)', loc);
  }

  // Description
  if (!body.description || typeof body.description !== 'string' || body.description.trim().length < 10) {
    errors.description = vMsg('الوصف التشغيلي المنقح مطلوب ويجب أن يحتوي على 10 أحرف على الأقل', 'Operational risk description is required (min 10 characters)', loc);
  }

  // Category
  if (!body.category || !VALID_RISK_CATEGORIES.includes(body.category)) {
    errors.category = vMsg(`تصنيف الخطر غير صالح. التصنيفات المعتمدة: ${VALID_RISK_CATEGORIES.join(', ')}`, `Invalid risk category. Allowed: ${VALID_RISK_CATEGORIES.join(', ')}`, loc);
  }

  // Governorate
  if (!body.governorate || typeof body.governorate !== 'string' || body.governorate.trim().length < 2) {
    errors.governorate = vMsg('المحافظة مطلوبة (مثال: عدن، لحج، أبين)', 'Governorate is required (e.g. Aden, Lahj, Abyan)', loc);
  }

  // Likelihood & Impact (1-5)
  const likelihood = Number(body.likelihood);
  if (isNaN(likelihood) || !Number.isInteger(likelihood) || likelihood < 1 || likelihood > 5) {
    errors.likelihood = vMsg('احتمالية الحدوث يجب أن تكون رقماً صحيحاً بين 1 (نادر) و 5 (شبه مؤكد)', 'Likelihood must be an integer between 1 (Rare) and 5 (Almost Certain)', loc);
  }

  const impact = Number(body.impact);
  if (isNaN(impact) || !Number.isInteger(impact) || impact < 1 || impact > 5) {
    errors.impact = vMsg('شدة الأثر يجب أن تكون رقماً صحيحاً بين 1 (طفيف) و 5 (كارثي)', 'Impact severity must be an integer between 1 (Minor) and 5 (Catastrophic)', loc);
  }

  let targetResolutionDate: Date | null = null;
  if (body.targetResolutionDate) {
    const d = new Date(body.targetResolutionDate);
    if (isNaN(d.getTime())) {
      errors.targetResolutionDate = vMsg('تاريخ الاستهداف غير صالح', 'Invalid target resolution date', loc);
    } else {
      targetResolutionDate = d;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title: body.title.trim(),
      description: body.description.trim(),
      category: body.category,
      governorate: body.governorate.trim(),
      district: body.district ? String(body.district).trim() : null,
      generalLocation: body.generalLocation ? String(body.generalLocation).trim() : null,
      incidentId: body.incidentId ? String(body.incidentId).trim() : null,
      likelihood,
      impact,
      targetResolutionDate,
    },
  };
}

export interface ReassessmentInputData {
  likelihood: number;
  impact: number;
  rationale: string;
}

export function validateReassessmentInput(body: any, locale?: string): ValidationResult<ReassessmentInputData> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: vMsg('بيانات إعادة التقييم مفقودة', 'Reassessment data is missing', loc) } };
  }

  const likelihood = Number(body.likelihood);
  if (isNaN(likelihood) || !Number.isInteger(likelihood) || likelihood < 1 || likelihood > 5) {
    errors.likelihood = vMsg('احتمالية الحدوث يجب أن تكون رقماً صحيحاً بين 1 و 5', 'Likelihood must be an integer between 1 and 5', loc);
  }

  const impact = Number(body.impact);
  if (isNaN(impact) || !Number.isInteger(impact) || impact < 1 || impact > 5) {
    errors.impact = vMsg('شدة الأثر يجب أن تكون رقماً صحيحاً بين 1 و 5', 'Impact severity must be an integer between 1 and 5', loc);
  }

  if (!body.rationale || typeof body.rationale !== 'string' || body.rationale.trim().length < 5) {
    errors.rationale = vMsg('مبررات إعادة التقييم مطلوبة (5 أحرف على الأقل) لتوثيق السجل التدقيقي', 'Reassessment rationale is required (min 5 characters) for audit trail', loc);
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      likelihood,
      impact,
      rationale: body.rationale.trim(),
    },
  };
}

export interface MitigationInputData {
  actionTitle: string;
  actionType: (typeof VALID_MITIGATION_TYPES)[number];
  description?: string | null;
  assignedTo?: string | null;
  dueDate?: Date | null;
  status?: (typeof VALID_MITIGATION_STATUSES)[number];
  progressNotes?: string | null;
}

export function validateMitigationInput(body: any, locale?: string): ValidationResult<MitigationInputData> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: vMsg('بيانات إجراء التخفيف مفقودة', 'Mitigation action data is missing', loc) } };
  }

  if (!body.actionTitle || typeof body.actionTitle !== 'string' || body.actionTitle.trim().length < 3) {
    errors.actionTitle = vMsg('عنوان إجراء التخفيف مطلوب (3 أحرف على الأقل)', 'Mitigation action title is required (min 3 characters)', loc);
  }

  const actionType = body.actionType || 'PREVENTIVE';
  if (!VALID_MITIGATION_TYPES.includes(actionType)) {
    errors.actionType = vMsg(`نوع الإجراء غير صالح. الأنواع المعتمدة: ${VALID_MITIGATION_TYPES.join(', ')}`, `Invalid mitigation action type. Allowed: ${VALID_MITIGATION_TYPES.join(', ')}`, loc);
  }

  let dueDate: Date | null = null;
  if (body.dueDate) {
    const d = new Date(body.dueDate);
    if (isNaN(d.getTime())) {
      errors.dueDate = vMsg('تاريخ الاستحقاق غير صالح', 'Invalid due date', loc);
    } else {
      dueDate = d;
    }
  }

  const status = body.status || 'PLANNED';
  if (!VALID_MITIGATION_STATUSES.includes(status)) {
    errors.status = vMsg(`حالة الإجراء غير صالحة. الحالات: ${VALID_MITIGATION_STATUSES.join(', ')}`, `Invalid action status. Allowed: ${VALID_MITIGATION_STATUSES.join(', ')}`, loc);
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      actionTitle: body.actionTitle.trim(),
      actionType,
      description: body.description ? String(body.description).trim() : null,
      assignedTo: body.assignedTo ? String(body.assignedTo).trim() : null,
      dueDate,
      status,
      progressNotes: body.progressNotes ? String(body.progressNotes).trim() : null,
    },
  };
}

export interface RiskStatusChangeData {
  status: (typeof VALID_RISK_STATUSES)[number];
  reason: string;
}

export function validateRiskStatusChange(body: any, locale?: string): ValidationResult<RiskStatusChangeData> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: vMsg('بيانات تغيير الحالة مفقودة', 'Status change data is missing', loc) } };
  }

  if (!body.status || !VALID_RISK_STATUSES.includes(body.status)) {
    errors.status = vMsg(`الحالة التشغيلية غير صالحة. الحالات: ${VALID_RISK_STATUSES.join(', ')}`, `Invalid risk status. Allowed: ${VALID_RISK_STATUSES.join(', ')}`, loc);
  }

  if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length < 5) {
    errors.reason = vMsg('سبب ومبرر تغيير الحالة التشغيلية مطلوب لتوثيق القرار (5 أحرف على الأقل)', 'Operational rationale for status change is required (min 5 characters)', loc);
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      status: body.status,
      reason: body.reason.trim(),
    },
  };
}

// ----------------------------------------------------
// 10. TRAINING SESSION VALIDATION
// ----------------------------------------------------
export interface SessionInput {
  sessionNumber: number;
  title: string;
  sessionDate: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
}

export function validateSessionInput(body: any, isPartial = false, locale?: string): ValidationResult<SessionInput> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: vMsg('بيانات الجلسة مفقودة', 'Session data is missing', loc) } };
  }

  if (!isPartial || body.sessionNumber !== undefined) {
    const num = Number(body.sessionNumber);
    if (isNaN(num) || num < 1 || !Number.isInteger(num)) {
      errors.sessionNumber = vMsg('رقم الجلسة يجب أن يكون رقماً صحيحاً موجباً (1 أو أكثر)', 'Session number must be a positive integer (1 or more)', loc);
    }
  }

  if (!isPartial || body.title !== undefined) {
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 2) {
      errors.title = vMsg('عنوان الجلسة مطلوب ويجب ألا يقل عن حرفين', 'Session title is required (min 2 characters)', loc);
    }
  }

  if (!isPartial || body.sessionDate !== undefined) {
    if (!body.sessionDate || isNaN(Date.parse(body.sessionDate))) {
      errors.sessionDate = vMsg('تاريخ الجلسة مطلوب ويجب أن يكون تاريخاً صحيحاً', 'Session date is required and must be valid', loc);
    }
  }

  if (body.startTime && typeof body.startTime === 'string' && body.startTime.length > 20) {
    errors.startTime = vMsg('وقت البدء غير صالح', 'Invalid start time', loc);
  }

  if (body.endTime && typeof body.endTime === 'string' && body.endTime.length > 20) {
    errors.endTime = vMsg('وقت الانتهاء غير صالح', 'Invalid end time', loc);
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      sessionNumber: Number(body.sessionNumber),
      title: body.title ? String(body.title).trim() : '',
      sessionDate: body.sessionDate ? new Date(body.sessionDate).toISOString() : new Date().toISOString(),
      startTime: body.startTime ? String(body.startTime).trim() : null,
      endTime: body.endTime ? String(body.endTime).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
    },
  };
}

// ----------------------------------------------------
// 11. ATTENDANCE RECORD VALIDATION
// ----------------------------------------------------
export const VALID_ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'EXCUSED'] as const;
export type AttendanceStatusType = typeof VALID_ATTENDANCE_STATUSES[number];

export interface AttendanceInput {
  registrationId: string;
  sessionId?: string | null;
  sessionDate?: string;
  status: AttendanceStatusType;
  notes?: string | null;
  modifiedReason?: string | null;
}

export function validateAttendanceInput(body: any, locale?: string): ValidationResult<AttendanceInput> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: vMsg('بيانات الحضور مفقودة', 'Attendance data is missing', loc) } };
  }

  if (!body.registrationId || typeof body.registrationId !== 'string') {
    errors.registrationId = vMsg('معرف التسجيل مطلوب', 'Registration ID is required', loc);
  }

  if (!body.status || !VALID_ATTENDANCE_STATUSES.includes(body.status)) {
    errors.status = vMsg(`حالة الحضور غير صالحة. الحالات: ${VALID_ATTENDANCE_STATUSES.join(', ')}`, `Invalid attendance status. Allowed: ${VALID_ATTENDANCE_STATUSES.join(', ')}`, loc);
  }

  if (body.sessionDate && isNaN(Date.parse(body.sessionDate))) {
    errors.sessionDate = vMsg('تاريخ الحضور غير صالح', 'Invalid attendance date', loc);
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      registrationId: body.registrationId,
      sessionId: body.sessionId ? String(body.sessionId).trim() : null,
      sessionDate: body.sessionDate ? new Date(body.sessionDate).toISOString() : undefined,
      status: body.status,
      notes: body.notes ? String(body.notes).trim() : null,
      modifiedReason: body.modifiedReason ? String(body.modifiedReason).trim() : null,
    },
  };
}

export interface BatchAttendanceRecordInput {
  registrationId: string;
  status: AttendanceStatusType;
  notes?: string | null;
}

export interface BatchAttendanceInput {
  sessionId: string;
  sessionDate?: string;
  records: BatchAttendanceRecordInput[];
}

export function validateBatchAttendanceInput(body: any, locale?: string): ValidationResult<BatchAttendanceInput> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: vMsg('بيانات الحضور الجماعي مفقودة', 'Batch attendance data is missing', loc) } };
  }

  if (!body.sessionId || typeof body.sessionId !== 'string') {
    errors.sessionId = vMsg('معرف الجلسة مطلوب لتسجيل الحضور الجماعي', 'Session ID is required for batch attendance', loc);
  }

  if (!Array.isArray(body.records) || body.records.length === 0) {
    errors.records = vMsg('قائمة سجلات الحضور يجب أن تحتوي على سجل واحد على الأقل', 'Attendance records list must contain at least one entry', loc);
  } else {
    for (let i = 0; i < body.records.length; i++) {
      const rec = body.records[i];
      if (!rec.registrationId) {
        errors[`records[${i}].registrationId`] = vMsg('معرف التسجيل مطلوب لكل متدرب', 'Registration ID is required for each trainee', loc);
      }
      if (!rec.status || !VALID_ATTENDANCE_STATUSES.includes(rec.status)) {
        errors[`records[${i}].status`] = vMsg('حالة الحضور غير صالحة', 'Invalid attendance status', loc);
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      sessionId: body.sessionId,
      sessionDate: body.sessionDate ? new Date(body.sessionDate).toISOString() : undefined,
      records: body.records.map((r: any) => ({
        registrationId: String(r.registrationId),
        status: r.status,
        notes: r.notes ? String(r.notes).trim() : null,
      })),
    },
  };
}

// ----------------------------------------------------
// 12. TRAINING EVALUATION VALIDATION
// ----------------------------------------------------
export const VALID_EVALUATION_TYPES = ['PRE', 'POST'] as const;
export type EvaluationTypeType = typeof VALID_EVALUATION_TYPES[number];

export const VALID_EVALUATION_STATUSES = ['NOT_REQUIRED', 'NOT_TAKEN', 'COMPLETED'] as const;
export type EvaluationStatusType = typeof VALID_EVALUATION_STATUSES[number];

export interface EvaluationInput {
  registrationId: string;
  type: EvaluationTypeType;
  score?: number | null;
  maxScore?: number;
  status?: EvaluationStatusType;
  notes?: string | null;
}

export function validateEvaluationInput(body: any, isPartial = false, locale?: string): ValidationResult<EvaluationInput> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: vMsg('بيانات التقييم مفقودة', 'Evaluation data is missing', loc) } };
  }

  if (!isPartial || body.registrationId !== undefined) {
    if (!body.registrationId || typeof body.registrationId !== 'string') {
      errors.registrationId = vMsg('معرف التسجيل مطلوب', 'Registration ID is required', loc);
    }
  }

  if (!isPartial || body.type !== undefined) {
    if (!body.type || !VALID_EVALUATION_TYPES.includes(body.type)) {
      errors.type = vMsg(`نوع التقييم غير صالح. الأنواع: ${VALID_EVALUATION_TYPES.join(', ')}`, `Invalid evaluation type. Allowed: ${VALID_EVALUATION_TYPES.join(', ')}`, loc);
    }
  }

  const max = body.maxScore !== undefined ? Number(body.maxScore) : 100;
  if (isNaN(max) || max <= 0) {
    errors.maxScore = vMsg('الدرجة القصوى يجب أن تكون رقماً أكبر من صفر', 'Max score must be greater than zero', loc);
  }

  if (body.score !== undefined && body.score !== null && body.score !== '') {
    const s = Number(body.score);
    if (isNaN(s) || s < 0 || s > max) {
      errors.score = vMsg(`درجة التقييم يجب أن تكون بين 0 و ${max}`, `Evaluation score must be between 0 and ${max}`, loc);
    }
  }

  if (!isPartial || body.status !== undefined) {
    if (body.status && !VALID_EVALUATION_STATUSES.includes(body.status)) {
      errors.status = vMsg(`حالة التقييم غير صالحة. الحالات: ${VALID_EVALUATION_STATUSES.join(', ')}`, `Invalid evaluation status. Allowed: ${VALID_EVALUATION_STATUSES.join(', ')}`, loc);
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  let finalStatus: EvaluationStatusType = body.status || 'NOT_TAKEN';
  let finalScore: number | null = null;
  if (body.score !== undefined && body.score !== null && body.score !== '') {
    finalScore = Number(body.score);
    finalStatus = 'COMPLETED';
  }

  return {
    success: true,
    data: {
      registrationId: body.registrationId,
      type: body.type,
      score: finalScore,
      maxScore: max,
      status: finalStatus,
      notes: body.notes ? String(body.notes).trim() : null,
    },
  };
}

// ----------------------------------------------------
// 13. RESEARCH REVIEW WORKFLOW VALIDATION
// ----------------------------------------------------
export const VALID_RESEARCH_ACTIONS = [
  'SUBMIT_FOR_REVIEW',
  'START_REVIEW',
  'APPROVE',
  'REJECT',
  'RETURN_FOR_REVISION',
  'PUBLISH',
] as const;
export type ResearchActionType = typeof VALID_RESEARCH_ACTIONS[number];

export interface ResearchReviewActionInput {
  action: ResearchActionType;
  comments?: string | null;
}

export function validateResearchReviewAction(body: any, locale?: string): ValidationResult<ResearchReviewActionInput> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: vMsg('بيانات إجراء المراجعة مفقودة', 'Review action data is missing', loc) } };
  }

  if (!body.action || !VALID_RESEARCH_ACTIONS.includes(body.action)) {
    errors.action = vMsg(`إجراء المراجعة غير صالح. الإجراءات المتاحة: ${VALID_RESEARCH_ACTIONS.join(', ')}`, `Invalid review action. Available: ${VALID_RESEARCH_ACTIONS.join(', ')}`, loc);
  }

  if ((body.action === 'REJECT' || body.action === 'RETURN_FOR_REVISION') && (!body.comments || typeof body.comments !== 'string' || body.comments.trim().length < 5)) {
    errors.comments = vMsg('ملاحظات وأسباب الرفض أو الإعادة للتعديل مطلوبة (5 أحرف على الأقل)', 'Review notes / rejection rationale is required (min 5 characters)', loc);
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      action: body.action,
      comments: body.comments ? String(body.comments).trim() : null,
    },
  };
}

// ----------------------------------------------------
// 14. RESEARCH ACCESS GRANT VALIDATION
// ----------------------------------------------------
export interface AccessGrantInput {
  grantedToUserId: string;
  notes?: string | null;
}

export function validateAccessGrantInput(body: any, locale?: string): ValidationResult<AccessGrantInput> {
  const loc: ValidationLocale = resolveLocale(locale, body);
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: vMsg('بيانات منح التصريح مفقودة', 'Access grant data is missing', loc) } };
  }

  if (!body.grantedToUserId || typeof body.grantedToUserId !== 'string' || body.grantedToUserId.trim().length === 0) {
    errors.grantedToUserId = vMsg('معرف المستخدم/العميل المصرح له مطلوب', 'Authorized user / client ID is required', loc);
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      grantedToUserId: body.grantedToUserId.trim(),
      notes: body.notes ? String(body.notes).trim() : null,
    },
  };
}
