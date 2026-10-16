const assert = require('assert');

// 1. Incidents Validation Test
const { validateIncidentIntake } = require('../lib/validations/incidents');

console.log('Testing Incidents Validation i18n...');
const emptyIncidentAr = validateIncidentIntake({}, 'ar');
assert.strictEqual(emptyIncidentAr.success, false);
assert.strictEqual(emptyIncidentAr.errors.governorate, 'المحافظة مطلوبة (حرفان كحد أدنى)');

const emptyIncidentEn = validateIncidentIntake({}, 'en');
assert.strictEqual(emptyIncidentEn.success, false);
assert.strictEqual(emptyIncidentEn.errors.governorate, 'Governorate is required (minimum 2 characters)');

// Test body.locale detection
const emptyIncidentBodyLocale = validateIncidentIntake({ locale: 'en' });
assert.strictEqual(emptyIncidentBodyLocale.success, false);
assert.strictEqual(emptyIncidentBodyLocale.errors.governorate, 'Governorate is required (minimum 2 characters)');

// 2. Equipment Validation Test
const { validateCategoryInput, validateProductInput, validateAdjustmentInput } = require('../lib/validations/equipment');

console.log('Testing Equipment Validation i18n...');
const emptyCatAr = validateCategoryInput({}, false, 'ar');
assert.strictEqual(emptyCatAr.success, false);
assert.strictEqual(emptyCatAr.errors.code, 'رمز التصنيف مطلوب ويجب أن يكون حرفين على الأقل (مثال: CAT-PPE)');

const emptyCatEn = validateCategoryInput({}, false, 'en');
assert.strictEqual(emptyCatEn.success, false);
assert.strictEqual(emptyCatEn.errors.code, 'Category code is required (min 2 characters, e.g. CAT-PPE)');

const emptyProdAr = validateProductInput({}, false, 'ar');
assert.strictEqual(emptyProdAr.errors.sku, 'رمز الصنف / SKU مطلوب ويجب أن يكون حرفين على الأقل');

const emptyProdEn = validateProductInput({}, false, 'en');
assert.strictEqual(emptyProdEn.errors.sku, 'SKU code is required (min 2 characters)');

const emptyAdjAr = validateAdjustmentInput({}, 'ar');
assert.strictEqual(emptyAdjAr.errors.productId, 'معرف المنتج مطلوب');

const emptyAdjEn = validateAdjustmentInput({}, 'en');
assert.strictEqual(emptyAdjEn.errors.productId, 'Product ID is required');

// 3. Admin Training & Course Validation Test
const { validateCourseInput, validateResearchInput, validateRiskInput } = require('../lib/validations/admin');

console.log('Testing Admin Validation i18n...');
const emptyCourseAr = validateCourseInput({}, false, 'ar');
assert.strictEqual(emptyCourseAr.errors.titleAr, 'عنوان الدورة بالعربية مطلوب ويجب أن يكون 3 أحرف على الأقل');

const emptyCourseEn = validateCourseInput({}, false, 'en');
assert.strictEqual(emptyCourseEn.errors.titleAr, 'Arabic course title is required (min 3 characters)');

const emptyResearchAr = validateResearchInput({}, false, 'ar');
assert.strictEqual(emptyResearchAr.errors.titleAr, 'عنوان الدراسة بالعربية مطلوب (3 أحرف على الأقل)');

const emptyResearchEn = validateResearchInput({}, false, 'en');
assert.strictEqual(emptyResearchEn.errors.titleAr, 'Arabic study title is required (min 3 characters)');

const emptyRiskAr = validateRiskInput({}, 'ar');
assert.strictEqual(emptyRiskAr.errors.title, 'عنوان الخطر التشغيلي مطلوب ويجب أن يحتوي على 5 أحرف على الأقل');

const emptyRiskEn = validateRiskInput({}, 'en');
assert.strictEqual(emptyRiskEn.errors.title, 'Operational risk title is required (min 5 characters)');

// 4. Alerts Validation Test
const { validateAlertDraftInput } = require('../lib/validations/alerts');

console.log('Testing Alerts Validation i18n...');
const emptyAlertAr = validateAlertDraftInput({}, null, 'ar');
assert.strictEqual(emptyAlertAr.isValid, false);
assert.ok(emptyAlertAr.errors.includes('معرّف البلاغ الأصلي مطلوب لربط التنبيه به'));

const emptyAlertEn = validateAlertDraftInput({}, null, 'en');
assert.strictEqual(emptyAlertEn.isValid, false);
assert.ok(emptyAlertEn.errors.includes('Original incident ID is required to link the alert'));

console.log('====================================================');
console.log('SUCCESS: All i18n validation tests passed cleanly! (100% parity)');
console.log('====================================================');
