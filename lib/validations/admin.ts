import { CAPABILITIES, ALL_CAPABILITIES, Capability } from '../rbac';

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
}

export function validateCourseInput(body: any, isPartial = false): ValidationResult<CourseInput> {
  const errors: Record<string, string> = {};

  if (!isPartial || body.titleAr !== undefined) {
    if (!body.titleAr || typeof body.titleAr !== 'string' || body.titleAr.trim().length < 3) {
      errors.titleAr = 'عنوان الدورة بالعربية مطلوب ويجب أن يكون 3 أحرف على الأقل';
    }
  }

  if (!isPartial || body.titleEn !== undefined) {
    if (!body.titleEn || typeof body.titleEn !== 'string' || body.titleEn.trim().length < 3) {
      errors.titleEn = 'عنوان الدورة بالإنجليزية مطلوب ويجب أن يكون 3 أحرف على الأقل';
    }
  }

  if (!isPartial || body.descriptionAr !== undefined) {
    if (!body.descriptionAr || typeof body.descriptionAr !== 'string' || body.descriptionAr.trim().length < 10) {
      errors.descriptionAr = 'وصف الدورة بالعربية مطلوب (10 أحرف كحد أدنى)';
    }
  }

  if (!isPartial || body.descriptionEn !== undefined) {
    if (!body.descriptionEn || typeof body.descriptionEn !== 'string' || body.descriptionEn.trim().length < 10) {
      errors.descriptionEn = 'وصف الدورة بالإنجليزية مطلوب (10 أحرف كحد أدنى)';
    }
  }

  if (!isPartial || body.trainerName !== undefined) {
    if (!body.trainerName || typeof body.trainerName !== 'string' || body.trainerName.trim().length < 2) {
      errors.trainerName = 'اسم المدرب أو المحاضر مطلوب';
    }
  }

  if (!isPartial || body.duration !== undefined) {
    if (!body.duration || typeof body.duration !== 'string' || body.duration.trim().length < 2) {
      errors.duration = 'مدة الدورة مطلوبة (مثال: 5 أيام / 20 ساعة)';
    }
  }

  if (!isPartial || body.location !== undefined) {
    if (!body.location || typeof body.location !== 'string' || body.location.trim().length < 2) {
      errors.location = 'مقر أو قاعة التدريب مطلوبة';
    }
  }

  if (!isPartial || body.capacity !== undefined) {
    const capNum = Number(body.capacity);
    if (isNaN(capNum) || capNum < 1 || capNum > 1000) {
      errors.capacity = 'سعة المقاعد يجب أن تكون رقماً صحيحاً بين 1 و 1000';
    }
  }

  if (!isPartial || body.status !== undefined) {
    if (!body.status || !VALID_COURSE_STATUSES.includes(body.status)) {
      errors.status = `حالة الدورة غير صالحة. الحالات المقبولة: ${VALID_COURSE_STATUSES.join(', ')}`;
    }
  }

  if (!isPartial || body.categoryId !== undefined) {
    if (!body.categoryId || typeof body.categoryId !== 'string') {
      errors.categoryId = 'تصنيف الدورة التدريبية مطلوب';
    }
  }

  if (body.startDate && isNaN(Date.parse(body.startDate))) {
    errors.startDate = 'تاريخ البدء غير صالح';
  }

  if (body.endDate && isNaN(Date.parse(body.endDate))) {
    errors.endDate = 'تاريخ الانتهاء غير صالح';
  }

  if (body.startDate && body.endDate && Date.parse(body.startDate) > Date.parse(body.endDate)) {
    errors.endDate = 'تاريخ الانتهاء لا يمكن أن يسبق تاريخ البدء';
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
    },
  };
}

// ----------------------------------------------------
// 2. RESEARCH PUBLICATION VALIDATION
// ----------------------------------------------------
const VALID_RESEARCH_VISIBILITIES = ['PUBLIC', 'CLIENT_ONLY'] as const;
const VALID_RESEARCH_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

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

export function validateResearchInput(body: any, isPartial = false): ValidationResult<ResearchInput> {
  const errors: Record<string, string> = {};

  if (!isPartial || body.titleAr !== undefined) {
    if (!body.titleAr || typeof body.titleAr !== 'string' || body.titleAr.trim().length < 3) {
      errors.titleAr = 'عنوان الدراسة بالعربية مطلوب (3 أحرف على الأقل)';
    }
  }

  if (!isPartial || body.titleEn !== undefined) {
    if (!body.titleEn || typeof body.titleEn !== 'string' || body.titleEn.trim().length < 3) {
      errors.titleEn = 'عنوان الدراسة بالإنجليزية مطلوب (3 أحرف على الأقل)';
    }
  }

  if (!isPartial || body.summaryAr !== undefined) {
    if (!body.summaryAr || typeof body.summaryAr !== 'string' || body.summaryAr.trim().length < 10) {
      errors.summaryAr = 'ملخص الدراسة بالعربية مطلوب (10 أحرف على الأقل)';
    }
  }

  if (!isPartial || body.summaryEn !== undefined) {
    if (!body.summaryEn || typeof body.summaryEn !== 'string' || body.summaryEn.trim().length < 10) {
      errors.summaryEn = 'ملخص الدراسة بالإنجليزية مطلوب (10 أحرف على الأقل)';
    }
  }

  if (!isPartial || body.contentAr !== undefined) {
    if (!body.contentAr || typeof body.contentAr !== 'string' || body.contentAr.trim().length < 10) {
      errors.contentAr = 'محتوى الدراسة بالعربية مطلوب';
    }
  }

  if (!isPartial || body.contentEn !== undefined) {
    if (!body.contentEn || typeof body.contentEn !== 'string' || body.contentEn.trim().length < 10) {
      errors.contentEn = 'محتوى الدراسة بالإنجليزية مطلوب';
    }
  }

  if (!isPartial || body.author !== undefined) {
    if (!body.author || typeof body.author !== 'string' || body.author.trim().length < 2) {
      errors.author = 'اسم الباحث أو المؤلف مطلوب';
    }
  }

  if (!isPartial || body.categoryId !== undefined) {
    if (!body.categoryId || typeof body.categoryId !== 'string') {
      errors.categoryId = 'تصنيف البحث مطلوب';
    }
  }

  if (!isPartial || body.visibility !== undefined) {
    if (!body.visibility || !VALID_RESEARCH_VISIBILITIES.includes(body.visibility)) {
      errors.visibility = 'مستوى الرؤية يجب أن يكون إما PUBLIC أو CLIENT_ONLY';
    }
  }

  if (!isPartial || body.status !== undefined) {
    if (!body.status || !VALID_RESEARCH_STATUSES.includes(body.status)) {
      errors.status = 'حالة النشر يجب أن تكون DRAFT أو PUBLISHED أو ARCHIVED';
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
const VALID_MESSAGE_STATUSES = ['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'] as const;
export type MessageStatusType = typeof VALID_MESSAGE_STATUSES[number];

export function validateMessageStatusUpdate(body: any): ValidationResult<{ status: MessageStatusType; replyNotes?: string | null }> {
  const errors: Record<string, string> = {};

  if (!body || !body.status || !VALID_MESSAGE_STATUSES.includes(body.status)) {
    errors.status = `حالة الرسالة غير صالحة. الحالات المقبولة: ${VALID_MESSAGE_STATUSES.join(', ')}`;
  }

  if (body.replyNotes !== undefined && typeof body.replyNotes !== 'string') {
    errors.replyNotes = 'ملاحظات الرد يجب أن تكون نصاً';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      status: body.status,
      replyNotes: body.replyNotes ? body.replyNotes.trim() : null,
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

export function validateSettingUpdate(body: any): ValidationResult<{ key: string; value: string }> {
  const errors: Record<string, string> = {};

  if (!body || !body.key || typeof body.key !== 'string') {
    errors.key = 'مفتاح الإعداد مطلوب';
    return { success: false, errors };
  }

  const normalizedKey = body.key.trim().toUpperCase();

  // Check against forbidden security keys
  const isForbidden = FORBIDDEN_CONFIG_PATTERNS.some((p) => normalizedKey.includes(p));
  if (isForbidden) {
    errors.key = 'ممنوع تعديل أو إدخال مفاتيح التكوين الأمنية عبر واجهة الإعدادات';
    return { success: false, errors };
  }

  if (!ALLOWED_SETTING_KEYS.includes(normalizedKey as AllowedSettingKey)) {
    errors.key = `المفتاح غير مصرح به. المفاتيح المقبولة فقط: ${ALLOWED_SETTING_KEYS.join(', ')}`;
    return { success: false, errors };
  }

  if (body.value === undefined || typeof body.value !== 'string') {
    errors.value = 'قيمة الإعداد مطلوبة كنص';
    return { success: false, errors };
  }

  const trimmedValue = body.value.trim();

  // Additional formatting checks
  if (normalizedKey.includes('EMAIL') && trimmedValue.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedValue)) {
      errors.value = 'صيغة البريد الإلكتروني غير صحيحة';
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
export function validateCapabilityAssignment(body: any): ValidationResult<{ capability: Capability }> {
  const errors: Record<string, string> = {};

  if (!body || !body.capability || typeof body.capability !== 'string') {
    errors.capability = 'الصلاحية (capability) مطلوبة';
    return { success: false, errors };
  }

  if (!ALL_CAPABILITIES.includes(body.capability as Capability)) {
    errors.capability = `صلاحية غير معروفة. الصلاحيات المتاحة: ${ALL_CAPABILITIES.join(', ')}`;
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

export function validateRegistrationInput(body: any): ValidationResult<RegistrationInput> {
  const errors: Record<string, string> = {};

  if (!body || !body.courseId || typeof body.courseId !== 'string') {
    errors.courseId = 'معرّف الدورة التدريبية مطلوب';
  }

  if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim().length < 3) {
    errors.fullName = 'الاسم الكامل مطلوب (3 أحرف على الأقل)';
  }

  if (!body.email || typeof body.email !== 'string') {
    errors.email = 'البريد الإلكتروني مطلوب';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      errors.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }
  }

  if (!body.phone || typeof body.phone !== 'string' || body.phone.trim().length < 6) {
    errors.phone = 'رقم الهاتف مطلوب (6 أرقام على الأقل)';
  }

  if (body.nationalId !== undefined && body.nationalId !== null && typeof body.nationalId !== 'string') {
    errors.nationalId = 'رقم الهوية يجب أن يكون نصاً';
  }

  if (body.qualification !== undefined && body.qualification !== null && typeof body.qualification !== 'string') {
    errors.qualification = 'المؤهل يجب أن يكون نصاً';
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
  currentStatus: string
): ValidationResult<{ status: RegistrationStatusType; adminNotes?: string | null }> {
  const errors: Record<string, string> = {};

  if (!body || !body.status || typeof body.status !== 'string') {
    errors.status = 'حالة التسجيل الجديدة مطلوبة';
    return { success: false, errors };
  }

  if (!VALID_REGISTRATION_STATUSES.includes(body.status as RegistrationStatusType)) {
    errors.status = `حالة التسجيل غير صالحة. الحالات المقبولة: ${VALID_REGISTRATION_STATUSES.join(', ')}`;
    return { success: false, errors };
  }

  // Check transition validity
  const allowedNext = REGISTRATION_TRANSITIONS[currentStatus];
  if (!allowedNext || !allowedNext.includes(body.status)) {
    errors.status = `لا يمكن الانتقال من حالة [${currentStatus}] إلى [${body.status}]. الانتقالات المسموحة: ${allowedNext ? allowedNext.join(', ') : 'لا توجد (حالة نهائية)'}`;
    return { success: false, errors };
  }

  if (body.adminNotes !== undefined && typeof body.adminNotes !== 'string') {
    errors.adminNotes = 'ملاحظات الإدارة يجب أن تكون نصاً';
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

export function validateCertificateInput(body: any): ValidationResult<CertificateInput> {
  const errors: Record<string, string> = {};

  if (!body || !body.registrationId || typeof body.registrationId !== 'string') {
    errors.registrationId = 'معرّف تسجيل المتدرب مطلوب';
    return { success: false, errors };
  }

  if (body.grade !== undefined && body.grade !== null) {
    if (typeof body.grade !== 'string' || body.grade.trim().length < 1) {
      errors.grade = 'التقدير يجب أن يكون نصاً غير فارغ';
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

export function validateCreateUserInput(body: any): ValidationResult<CreateUserInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: 'بيانات المستخدم مطلوبة' } };
  }

  // Full Name
  if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim().length < 3) {
    errors.fullName = 'الاسم الكامل مطلوب ويجب ألا يقل عن 3 أحرف';
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!body.email || typeof body.email !== 'string' || !emailRegex.test(body.email.trim())) {
    errors.email = 'البريد الإلكتروني غير صالح أو غير مدخل بالشكل الصحيح';
  }

  // Password
  if (!body.password || typeof body.password !== 'string' || body.password.length < 8) {
    errors.password = 'كلمة المرور مطلوبة وتتطلب 8 خانات على الأقل';
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
    errors.role = `الرتبة المحددة غير صالحة. الرتب المسموح إنشاؤها: ${validRoles.join(', ')}`;
  }

  // Functional Area (optional)
  if (body.functionalArea && !VALID_FUNCTIONAL_AREAS.includes(body.functionalArea)) {
    errors.functionalArea = `مجال العمل غير صالح. المجالات المعتمدة: ${VALID_FUNCTIONAL_AREAS.join(', ')}`;
  }

  // Capabilities
  let validatedCaps: Capability[] = [];
  if (body.capabilities) {
    if (!Array.isArray(body.capabilities)) {
      errors.capabilities = 'قائمة الصلاحيات يجب أن تكون مصفوفة';
    } else {
      const invalidCaps = body.capabilities.filter((c: any) => !ALL_CAPABILITIES.includes(c));
      if (invalidCaps.length > 0) {
        errors.capabilities = `صلاحيات غير معروفة: ${invalidCaps.join(', ')}`;
      } else {
        validatedCaps = body.capabilities as Capability[];
      }
    }
  }

  // Strict focal point check
  if (body.role === 'FIELD_FOCAL_POINT') {
    const forbiddenCaps = validatedCaps.filter((c) => c !== CAPABILITIES.SUBMIT_INCIDENT);
    if (forbiddenCaps.length > 0) {
      errors.capabilities = `نقاط الاتصال الميدانية لا يمكن منحها صلاحيات إدارية [${forbiddenCaps.join(', ')}]. الصلاحية المسموحة حصراً هي submit_incident.`;
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

export function validateRiskInput(body: any): ValidationResult<RiskInputData> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات الإدخال مفقودة' } };
  }

  // Title
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 5) {
    errors.title = 'عنوان الخطر التشغيلي مطلوب ويجب أن يحتوي على 5 أحرف على الأقل';
  }

  // Description
  if (!body.description || typeof body.description !== 'string' || body.description.trim().length < 10) {
    errors.description = 'الوصف التشغيلي المنقح مطلوب ويجب أن يحتوي على 10 أحرف على الأقل';
  }

  // Category
  if (!body.category || !VALID_RISK_CATEGORIES.includes(body.category)) {
    errors.category = `تصنيف الخطر غير صالح. التصنيفات المعتمدة: ${VALID_RISK_CATEGORIES.join(', ')}`;
  }

  // Governorate
  if (!body.governorate || typeof body.governorate !== 'string' || body.governorate.trim().length < 2) {
    errors.governorate = 'المحافظة مطلوبة (مثال: عدن، لحج، أبين)';
  }

  // Likelihood & Impact (1-5)
  const likelihood = Number(body.likelihood);
  if (isNaN(likelihood) || !Number.isInteger(likelihood) || likelihood < 1 || likelihood > 5) {
    errors.likelihood = 'احتمالية الحدوث يجب أن تكون رقماً صحيحاً بين 1 (نادر) و 5 (شبه مؤكد)';
  }

  const impact = Number(body.impact);
  if (isNaN(impact) || !Number.isInteger(impact) || impact < 1 || impact > 5) {
    errors.impact = 'شدة الأثر يجب أن تكون رقماً صحيحاً بين 1 (طفيف) و 5 (كارثي)';
  }

  let targetResolutionDate: Date | null = null;
  if (body.targetResolutionDate) {
    const d = new Date(body.targetResolutionDate);
    if (isNaN(d.getTime())) {
      errors.targetResolutionDate = 'تاريخ الاستهداف غير صالح';
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

export function validateReassessmentInput(body: any): ValidationResult<ReassessmentInputData> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات إعادة التقييم مفقودة' } };
  }

  const likelihood = Number(body.likelihood);
  if (isNaN(likelihood) || !Number.isInteger(likelihood) || likelihood < 1 || likelihood > 5) {
    errors.likelihood = 'احتمالية الحدوث يجب أن تكون رقماً صحيحاً بين 1 و 5';
  }

  const impact = Number(body.impact);
  if (isNaN(impact) || !Number.isInteger(impact) || impact < 1 || impact > 5) {
    errors.impact = 'شدة الأثر يجب أن تكون رقماً صحيحاً بين 1 و 5';
  }

  if (!body.rationale || typeof body.rationale !== 'string' || body.rationale.trim().length < 5) {
    errors.rationale = 'مبررات إعادة التقييم مطلوبة (5 أحرف على الأقل) لتوثيق السجل التدقيقي';
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

export function validateMitigationInput(body: any): ValidationResult<MitigationInputData> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات إجراء التخفيف مفقودة' } };
  }

  if (!body.actionTitle || typeof body.actionTitle !== 'string' || body.actionTitle.trim().length < 3) {
    errors.actionTitle = 'عنوان إجراء التخفيف مطلوب (3 أحرف على الأقل)';
  }

  const actionType = body.actionType || 'PREVENTIVE';
  if (!VALID_MITIGATION_TYPES.includes(actionType)) {
    errors.actionType = `نوع الإجراء غير صالح. الأنواع المعتمدة: ${VALID_MITIGATION_TYPES.join(', ')}`;
  }

  let dueDate: Date | null = null;
  if (body.dueDate) {
    const d = new Date(body.dueDate);
    if (isNaN(d.getTime())) {
      errors.dueDate = 'تاريخ الاستحقاق غير صالح';
    } else {
      dueDate = d;
    }
  }

  const status = body.status || 'PLANNED';
  if (!VALID_MITIGATION_STATUSES.includes(status)) {
    errors.status = `حالة الإجراء غير صالحة. الحالات: ${VALID_MITIGATION_STATUSES.join(', ')}`;
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

export function validateRiskStatusChange(body: any): ValidationResult<RiskStatusChangeData> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات تغيير الحالة مفقودة' } };
  }

  if (!body.status || !VALID_RISK_STATUSES.includes(body.status)) {
    errors.status = `الحالة التشغيلية غير صالحة. الحالات: ${VALID_RISK_STATUSES.join(', ')}`;
  }

  if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length < 5) {
    errors.reason = 'سبب ومبرر تغيير الحالة التشغيلية مطلوب لتوثيق القرار (5 أحرف على الأقل)';
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

