// Validation schemas for Package E: Safety Equipment, Inventory, Procurement & Inspection

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

// ----------------------------------------------------
// 1. EQUIPMENT CATEGORY VALIDATION
// ----------------------------------------------------
export interface EquipmentCategoryInput {
  code: string;
  nameAr: string;
  nameEn: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean;
  order?: number;
}

export function validateCategoryInput(body: any, isPartial = false): ValidationResult<EquipmentCategoryInput> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات التصنيف مفقودة' } };
  }

  if (!isPartial || body.code !== undefined) {
    if (!body.code || typeof body.code !== 'string' || body.code.trim().length < 2) {
      errors.code = 'رمز التصنيف مطلوب ويجب أن يكون حرفين على الأقل (مثال: CAT-PPE)';
    }
  }

  if (!isPartial || body.nameAr !== undefined) {
    if (!body.nameAr || typeof body.nameAr !== 'string' || body.nameAr.trim().length < 2) {
      errors.nameAr = 'اسم التصنيف بالعربية مطلوب';
    }
  }

  if (!isPartial || body.nameEn !== undefined) {
    if (!body.nameEn || typeof body.nameEn !== 'string' || body.nameEn.trim().length < 2) {
      errors.nameEn = 'اسم التصنيف بالإنجليزية مطلوب';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      code: body.code ? body.code.trim().toUpperCase() : undefined!,
      nameAr: body.nameAr ? body.nameAr.trim() : undefined!,
      nameEn: body.nameEn ? body.nameEn.trim() : undefined!,
      description: body.description !== undefined ? (body.description ? String(body.description).trim() : null) : undefined,
      icon: body.icon !== undefined ? (body.icon ? String(body.icon).trim() : null) : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      order: body.order !== undefined ? Number(body.order) || 0 : 0,
    },
  };
}

// ----------------------------------------------------
// 2. EQUIPMENT PRODUCT VALIDATION
// ----------------------------------------------------
export interface EquipmentProductInput {
  sku: string;
  nameAr: string;
  nameEn: string;
  categoryId: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  unit?: string;
  manufacturer?: string | null;
  brand?: string | null;
  model?: string | null;
  specifications?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  inspectionRequired?: boolean;
  maintenanceRequired?: boolean;
  expiryTrackingRequired?: boolean;
  serialTrackingRequired?: boolean;
  minimumStockLevel?: number;
}

export function validateProductInput(body: any, isPartial = false): ValidationResult<EquipmentProductInput> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات المنتج مفقودة' } };
  }

  if (!isPartial || body.sku !== undefined) {
    if (!body.sku || typeof body.sku !== 'string' || body.sku.trim().length < 2) {
      errors.sku = 'رمز الصنف / SKU مطلوب ويجب أن يكون حرفين على الأقل';
    }
  }

  if (!isPartial || body.nameAr !== undefined) {
    if (!body.nameAr || typeof body.nameAr !== 'string' || body.nameAr.trim().length < 2) {
      errors.nameAr = 'اسم المنتج بالعربية مطلوب';
    }
  }

  if (!isPartial || body.nameEn !== undefined) {
    if (!body.nameEn || typeof body.nameEn !== 'string' || body.nameEn.trim().length < 2) {
      errors.nameEn = 'اسم المنتج بالإنجليزية مطلوب';
    }
  }

  if (!isPartial || body.categoryId !== undefined) {
    if (!body.categoryId || typeof body.categoryId !== 'string') {
      errors.categoryId = 'تصنيف المنتج مطلوب';
    }
  }

  if (body.minimumStockLevel !== undefined && (isNaN(Number(body.minimumStockLevel)) || Number(body.minimumStockLevel) < 0)) {
    errors.minimumStockLevel = 'الحد الأدنى للمخزون يجب أن يكون رقمًا غير سالب';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      sku: body.sku ? body.sku.trim().toUpperCase() : undefined!,
      nameAr: body.nameAr ? body.nameAr.trim() : undefined!,
      nameEn: body.nameEn ? body.nameEn.trim() : undefined!,
      categoryId: body.categoryId ? body.categoryId.trim() : undefined!,
      descriptionAr: body.descriptionAr !== undefined ? (body.descriptionAr ? String(body.descriptionAr).trim() : null) : undefined,
      descriptionEn: body.descriptionEn !== undefined ? (body.descriptionEn ? String(body.descriptionEn).trim() : null) : undefined,
      unit: body.unit ? String(body.unit).trim() : 'piece',
      manufacturer: body.manufacturer !== undefined ? (body.manufacturer ? String(body.manufacturer).trim() : null) : undefined,
      brand: body.brand !== undefined ? (body.brand ? String(body.brand).trim() : null) : undefined,
      model: body.model !== undefined ? (body.model ? String(body.model).trim() : null) : undefined,
      specifications: body.specifications !== undefined ? (body.specifications ? String(body.specifications).trim() : null) : undefined,
      imageUrl: body.imageUrl !== undefined ? (body.imageUrl ? String(body.imageUrl).trim() : null) : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : (isPartial ? undefined : true),
      inspectionRequired: body.inspectionRequired !== undefined ? Boolean(body.inspectionRequired) : (isPartial ? undefined : false),
      maintenanceRequired: body.maintenanceRequired !== undefined ? Boolean(body.maintenanceRequired) : (isPartial ? undefined : false),
      expiryTrackingRequired: body.expiryTrackingRequired !== undefined ? Boolean(body.expiryTrackingRequired) : (isPartial ? undefined : false),
      serialTrackingRequired: body.serialTrackingRequired !== undefined ? Boolean(body.serialTrackingRequired) : (isPartial ? undefined : false),
      minimumStockLevel: body.minimumStockLevel !== undefined ? Number(body.minimumStockLevel) : (isPartial ? undefined : 5),
    },
  };
}

// ----------------------------------------------------
// 3. SUPPLIER VALIDATION
// ----------------------------------------------------
export interface SupplierInput {
  supplierCode?: string;
  name: string;
  nameAr?: string | null;
  contactPerson?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  categories?: string[] | null;
  taxNumber?: string | null;
  commercialReg?: string | null;
  status?: string;
  notes?: string | null;
}

export function validateSupplierInput(body: any, isPartial = false): ValidationResult<SupplierInput> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات المورد مفقودة' } };
  }

  if (!isPartial || body.name !== undefined) {
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
      errors.name = 'اسم المورد مطلوب';
    }
  }

  if (!isPartial || body.phone !== undefined) {
    if (!body.phone || typeof body.phone !== 'string' || body.phone.trim().length < 6) {
      errors.phone = 'رقم هاتف المورد مطلوب وصحيح';
    }
  }

  if (body.email && (typeof body.email !== 'string' || !body.email.includes('@'))) {
    errors.email = 'البريد الإلكتروني غير صالح';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      supplierCode: body.supplierCode ? body.supplierCode.trim() : undefined,
      name: body.name ? body.name.trim() : undefined!,
      nameAr: body.nameAr !== undefined ? (body.nameAr ? String(body.nameAr).trim() : null) : undefined,
      contactPerson: body.contactPerson !== undefined ? (body.contactPerson ? String(body.contactPerson).trim() : null) : undefined,
      phone: body.phone ? body.phone.trim() : undefined!,
      email: body.email !== undefined ? (body.email ? String(body.email).trim() : null) : undefined,
      address: body.address !== undefined ? (body.address ? String(body.address).trim() : null) : undefined,
      categories: Array.isArray(body.categories) ? body.categories : null,
      taxNumber: body.taxNumber !== undefined ? (body.taxNumber ? String(body.taxNumber).trim() : null) : undefined,
      commercialReg: body.commercialReg !== undefined ? (body.commercialReg ? String(body.commercialReg).trim() : null) : undefined,
      status: body.status || 'ACTIVE',
      notes: body.notes !== undefined ? (body.notes ? String(body.notes).trim() : null) : undefined,
    },
  };
}

// ----------------------------------------------------
// 4. PROCUREMENT ORDER VALIDATION
// ----------------------------------------------------
export interface ProcurementItemInput {
  productId: string;
  quantityOrdered: number;
  unitPrice?: number | null;
  specifications?: string | null;
  notes?: string | null;
}

export interface ProcurementOrderInput {
  supplierId: string;
  serviceRequestId?: string | null;
  expectedDeliveryDate?: string | null;
  currency?: string;
  notes?: string | null;
  items: ProcurementItemInput[];
}

export function validateProcurementOrderInput(body: any): ValidationResult<ProcurementOrderInput> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات أمر الشراء مفقودة' } };
  }

  if (!body.supplierId || typeof body.supplierId !== 'string') {
    errors.supplierId = 'المورد مطلوب';
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.items = 'يجب إضافة صنف واحد على الأقل في أمر الشراء';
  } else {
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      if (!item.productId) {
        errors[`items.${i}.productId`] = `الصنف رقم ${i + 1}: معرف المنتج مطلوب`;
      }
      if (!item.quantityOrdered || Number(item.quantityOrdered) <= 0) {
        errors[`items.${i}.quantityOrdered`] = `الصنف رقم ${i + 1}: الكمية المطلوبة يجب أن تكون أكبر من 0`;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      supplierId: body.supplierId.trim(),
      serviceRequestId: body.serviceRequestId ? String(body.serviceRequestId).trim() : null,
      expectedDeliveryDate: body.expectedDeliveryDate ? String(body.expectedDeliveryDate) : null,
      currency: body.currency ? String(body.currency).toUpperCase() : 'YER',
      notes: body.notes ? String(body.notes).trim() : null,
      items: body.items.map((it: any) => ({
        productId: it.productId.trim(),
        quantityOrdered: Math.floor(Number(it.quantityOrdered)),
        unitPrice: it.unitPrice !== undefined && it.unitPrice !== null ? Number(it.unitPrice) : null,
        specifications: it.specifications ? String(it.specifications).trim() : null,
        notes: it.notes ? String(it.notes).trim() : null,
      })),
    },
  };
}

// ----------------------------------------------------
// 5. PROCUREMENT RECEIVING VALIDATION
// ----------------------------------------------------
export interface ReceivingItemInput {
  productId: string;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected?: number;
  rejectionReason?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  serialNumbers?: string[];
  notes?: string | null;
}

export interface ProcurementReceivingInput {
  procurementOrderId: string;
  deliveryNoteNumber?: string | null;
  notes?: string | null;
  items: ReceivingItemInput[];
}

export function validateReceivingInput(body: any): ValidationResult<ProcurementReceivingInput> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات استلام الشحنة مفقودة' } };
  }

  if (!body.procurementOrderId || typeof body.procurementOrderId !== 'string') {
    errors.procurementOrderId = 'أمر الشراء مطلوب';
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.items = 'يجب استلام صنف واحد على الأقل';
  } else {
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      if (!item.productId) {
        errors[`items.${i}.productId`] = `الصنف رقم ${i + 1}: معرف المنتج مطلوب`;
      }
      const rec = Number(item.quantityReceived);
      const acc = Number(item.quantityAccepted);
      const rej = Number(item.quantityRejected || 0);

      if (isNaN(rec) || rec <= 0) {
        errors[`items.${i}.quantityReceived`] = `الصنف رقم ${i + 1}: الكمية المستلمة يجب أن تكون أكبر من 0`;
      }
      if (isNaN(acc) || acc < 0) {
        errors[`items.${i}.quantityAccepted`] = `الصنف رقم ${i + 1}: الكمية المقبولة غير صالحة`;
      }
      if (isNaN(rej) || rej < 0) {
        errors[`items.${i}.quantityRejected`] = `الصنف رقم ${i + 1}: الكمية المرفوضة غير صالحة`;
      }
      if (acc + rej !== rec) {
        errors[`items.${i}.quantityMismatch`] = `الصنف رقم ${i + 1}: مجموع المقبول (${acc}) والمرفوض (${rej}) يجب أن يساوي المستلم (${rec})`;
      }
      if (rej > 0 && (!item.rejectionReason || typeof item.rejectionReason !== 'string' || item.rejectionReason.trim().length === 0)) {
        errors[`items.${i}.rejectionReason`] = `الصنف رقم ${i + 1}: سبب الرفض مطلوب عند وجود كميات مرفوضة`;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      procurementOrderId: body.procurementOrderId.trim(),
      deliveryNoteNumber: body.deliveryNoteNumber ? String(body.deliveryNoteNumber).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
      items: body.items.map((it: any) => ({
        productId: it.productId.trim(),
        quantityReceived: Math.floor(Number(it.quantityReceived)),
        quantityAccepted: Math.floor(Number(it.quantityAccepted)),
        quantityRejected: Math.floor(Number(it.quantityRejected || 0)),
        rejectionReason: it.rejectionReason ? String(it.rejectionReason).trim() : null,
        batchNumber: it.batchNumber ? String(it.batchNumber).trim() : null,
        expiryDate: it.expiryDate ? String(it.expiryDate) : null,
        serialNumbers: Array.isArray(it.serialNumbers) ? it.serialNumbers.map((s: any) => String(s).trim()).filter(Boolean) : [],
        notes: it.notes ? String(it.notes).trim() : null,
      })),
    },
  };
}

// ----------------------------------------------------
// 6. INVENTORY ADJUSTMENT VALIDATION
// ----------------------------------------------------
export interface InventoryAdjustmentInput {
  productId: string;
  trackedItemId?: string | null;
  delta: number; // Can be positive or negative
  reason: string;
}

export function validateAdjustmentInput(body: any): ValidationResult<InventoryAdjustmentInput> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات تعديل المخزون مفقودة' } };
  }

  if (!body.productId || typeof body.productId !== 'string') {
    errors.productId = 'معرف المنتج مطلوب';
  }

  const delta = Number(body.delta);
  if (isNaN(delta) || delta === 0) {
    errors.delta = 'قيمة التعديل يجب أن تكون رقمًا صحيحًا غير صفري (موجب للإضافة، سالب للخصم)';
  }

  if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length < 5) {
    errors.reason = 'سبب تعديل المخزون إلزامي ومطلوب (5 أحرف على الأقل)';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      productId: body.productId.trim(),
      trackedItemId: body.trackedItemId ? String(body.trackedItemId).trim() : null,
      delta: Math.floor(delta),
      reason: body.reason.trim(),
    },
  };
}

// ----------------------------------------------------
// 7. EQUIPMENT INSPECTION VALIDATION
// ----------------------------------------------------
const VALID_INSPECTION_TYPES = ['RECEIVING', 'PRE_DELIVERY', 'PERIODIC', 'MAINTENANCE', 'RETURN'] as const;
const VALID_INSPECTION_RESULTS = ['PASS', 'FAIL', 'CONDITIONAL'] as const;

export interface InspectionInput {
  productId: string;
  trackedItemId?: string | null;
  inspectionType: typeof VALID_INSPECTION_TYPES[number];
  result: typeof VALID_INSPECTION_RESULTS[number];
  checklistSummary?: string | null;
  findings?: string | null;
  correctiveActions?: string | null;
  nextInspectionDate?: string | null;
  documentUrl?: string | null;
}

export function validateInspectionInput(body: any): ValidationResult<InspectionInput> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات الفحص مفقودة' } };
  }

  if (!body.productId || typeof body.productId !== 'string') {
    errors.productId = 'معرف المنتج مطلوب';
  }

  if (!body.inspectionType || !VALID_INSPECTION_TYPES.includes(body.inspectionType)) {
    errors.inspectionType = `نوع الفحص غير صالح. الأنواع المتاحة: ${VALID_INSPECTION_TYPES.join(', ')}`;
  }

  if (!body.result || !VALID_INSPECTION_RESULTS.includes(body.result)) {
    errors.result = `نتيجة الفحص غير صالحة. النتائج المتاحة: ${VALID_INSPECTION_RESULTS.join(', ')}`;
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      productId: body.productId.trim(),
      trackedItemId: body.trackedItemId ? String(body.trackedItemId).trim() : null,
      inspectionType: body.inspectionType,
      result: body.result,
      checklistSummary: body.checklistSummary ? String(body.checklistSummary).trim() : null,
      findings: body.findings ? String(body.findings).trim() : null,
      correctiveActions: body.correctiveActions ? String(body.correctiveActions).trim() : null,
      nextInspectionDate: body.nextInspectionDate ? String(body.nextInspectionDate) : null,
      documentUrl: body.documentUrl ? String(body.documentUrl).trim() : null,
    },
  };
}

// ----------------------------------------------------
// 8. EQUIPMENT MAINTENANCE VALIDATION
// ----------------------------------------------------
const VALID_MAINT_TYPES = ['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION'] as const;
const VALID_MAINT_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

export interface MaintenanceInput {
  productId: string;
  trackedItemId?: string | null;
  maintenanceType?: typeof VALID_MAINT_TYPES[number];
  status?: typeof VALID_MAINT_STATUSES[number];
  performedBy: string;
  result?: string | null;
  notes?: string | null;
  nextDueDate?: string | null;
  cost?: number | null;
  documentUrl?: string | null;
}

export function validateMaintenanceInput(body: any): ValidationResult<MaintenanceInput> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات الصيانة مفقودة' } };
  }

  if (!body.productId || typeof body.productId !== 'string') {
    errors.productId = 'معرف المنتج مطلوب';
  }

  if (!body.performedBy || typeof body.performedBy !== 'string' || body.performedBy.trim().length === 0) {
    errors.performedBy = 'اسم القائم بالصيانة / الفني مطلوب';
  }

  if (body.maintenanceType && !VALID_MAINT_TYPES.includes(body.maintenanceType)) {
    errors.maintenanceType = `نوع الصيانة غير صالح. الأنواع المتاحة: ${VALID_MAINT_TYPES.join(', ')}`;
  }

  if (body.status && !VALID_MAINT_STATUSES.includes(body.status)) {
    errors.status = `حالة الصيانة غير صالحة. الحالات المتاحة: ${VALID_MAINT_STATUSES.join(', ')}`;
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      productId: body.productId.trim(),
      trackedItemId: body.trackedItemId ? String(body.trackedItemId).trim() : null,
      maintenanceType: body.maintenanceType || 'PREVENTIVE',
      status: body.status || 'COMPLETED',
      performedBy: body.performedBy.trim(),
      result: body.result ? String(body.result).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
      nextDueDate: body.nextDueDate ? String(body.nextDueDate) : null,
      cost: body.cost !== undefined && body.cost !== null ? Number(body.cost) : null,
      documentUrl: body.documentUrl ? String(body.documentUrl).trim() : null,
    },
  };
}

// ----------------------------------------------------
// 9. SUPPLY RESERVATION VALIDATION
// ----------------------------------------------------
export interface SupplyReservationItemInput {
  productId: string;
  quantityToReserve: number;
}

export interface SupplyReservationInput {
  items: SupplyReservationItemInput[];
}

export function validateReservationInput(body: any): ValidationResult<SupplyReservationInput> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات الحجز مفقودة' } };
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.items = 'يجب تحديد صنف واحد على الأقل للحجز';
  } else {
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      if (!item.productId) {
        errors[`items.${i}.productId`] = `الصنف ${i + 1}: معرف المنتج مطلوب`;
      }
      const qty = Number(item.quantityToReserve);
      if (isNaN(qty) || qty <= 0) {
        errors[`items.${i}.quantityToReserve`] = `الصنف ${i + 1}: الكمية المحجوزة يجب أن تكون أكبر من 0`;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      items: body.items.map((it: any) => ({
        productId: String(it.productId).trim(),
        quantityToReserve: Math.floor(Number(it.quantityToReserve)),
      })),
    },
  };
}

// ----------------------------------------------------
// 10. EQUIPMENT DELIVERY VALIDATION
// ----------------------------------------------------
export interface DeliveryItemInput {
  productId: string;
  quantity: number;
  trackedItemId?: string | null;
  notes?: string | null;
}

export interface EquipmentDeliveryInput {
  serviceRequestId: string;
  receivedByName: string;
  receivedByPhone?: string | null;
  receivedByRole?: string | null;
  deliveryLocation?: string | null;
  notes?: string | null;
  items: DeliveryItemInput[];
}

export function validateDeliveryInput(body: any): ValidationResult<EquipmentDeliveryInput> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات التسليم مفقودة' } };
  }

  if (!body.serviceRequestId || typeof body.serviceRequestId !== 'string') {
    errors.serviceRequestId = 'معرف طلب الخدمة / التوريد مطلوب';
  }

  if (!body.receivedByName || typeof body.receivedByName !== 'string' || body.receivedByName.trim().length < 2) {
    errors.receivedByName = 'اسم المستلم / ممثل العميل مطلوب رسمياً للتسليم والتسليم';
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.items = 'يجب تسليم صنف واحد على الأقل';
  } else {
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      if (!item.productId) {
        errors[`items.${i}.productId`] = `الصنف ${i + 1}: معرف المنتج مطلوب`;
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        errors[`items.${i}.quantity`] = `الصنف ${i + 1}: كمية التسليم يجب أن تكون أكبر من 0`;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      serviceRequestId: body.serviceRequestId.trim(),
      receivedByName: body.receivedByName.trim(),
      receivedByPhone: body.receivedByPhone ? String(body.receivedByPhone).trim() : null,
      receivedByRole: body.receivedByRole ? String(body.receivedByRole).trim() : null,
      deliveryLocation: body.deliveryLocation ? String(body.deliveryLocation).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
      items: body.items.map((it: any) => ({
        productId: String(it.productId).trim(),
        quantity: Math.floor(Number(it.quantity)),
        trackedItemId: it.trackedItemId ? String(it.trackedItemId).trim() : null,
        notes: it.notes ? String(it.notes).trim() : null,
      })),
    },
  };
}

// ----------------------------------------------------
// 11. EQUIPMENT RETURN VALIDATION
// ----------------------------------------------------
export interface EquipmentReturnInput {
  serviceRequestId?: string | null;
  productId: string;
  trackedItemId?: string | null;
  quantity: number;
  reason: string;
  receivedByName: string;
  notes?: string | null;
}

export function validateReturnInput(body: any): ValidationResult<EquipmentReturnInput> {
  const errors: Record<string, string> = {};

  if (!body) {
    return { success: false, errors: { form: 'بيانات الإرجاع مفقودة' } };
  }

  if (!body.productId || typeof body.productId !== 'string') {
    errors.productId = 'معرف المنتج مطلوب';
  }

  const qty = Number(body.quantity);
  if (isNaN(qty) || qty <= 0) {
    errors.quantity = 'الكمية المرتجعة يجب أن تكون أكبر من 0';
  }

  if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length < 3) {
    errors.reason = 'سبب الإرجاع مطلوب (3 أحرف على الأقل)';
  }

  if (!body.receivedByName || typeof body.receivedByName !== 'string' || body.receivedByName.trim().length < 2) {
    errors.receivedByName = 'اسم مستلم المعدات المرتجعة مطلوب';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      serviceRequestId: body.serviceRequestId ? String(body.serviceRequestId).trim() : null,
      productId: body.productId.trim(),
      trackedItemId: body.trackedItemId ? String(body.trackedItemId).trim() : null,
      quantity: Math.floor(qty),
      reason: body.reason.trim(),
      receivedByName: body.receivedByName.trim(),
      notes: body.notes ? String(body.notes).trim() : null,
    },
  };
}
