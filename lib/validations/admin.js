/**
 * CommonJS companion for lib/validations/admin.ts
 */

const { ALL_CAPABILITIES, CAPABILITIES } = require('../rbac');

const VALID_FUNCTIONAL_AREAS = [
  'PROGRAMS_OPERATIONS',
  'MONITORING_ANALYSIS',
  'RESEARCH_FIELD_FOCAL',
  'TRAINING_CAPACITY',
];

function validateCreateUserInput(body) {
  const errors = {};

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
  let validatedCaps = [];
  if (body.capabilities) {
    if (!Array.isArray(body.capabilities)) {
      errors.capabilities = 'قائمة الصلاحيات يجب أن تكون مصفوفة';
    } else {
      const invalidCaps = body.capabilities.filter((c) => !ALL_CAPABILITIES.includes(c));
      if (invalidCaps.length > 0) {
        errors.capabilities = `صلاحيات غير معروفة: ${invalidCaps.join(', ')}`;
      } else {
        validatedCaps = body.capabilities;
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

module.exports = {
  VALID_FUNCTIONAL_AREAS,
  validateCreateUserInput,
};
