import prisma from './prisma';
import { MovementType, ItemStatus, InspectionResult, DeliveryStatus, ReturnStatus, SupplyFulfillmentStatus, ProcurementStatus } from '@prisma/client';

// ==========================================
// 1. REFERENCE NUMBER GENERATORS
// ==========================================

export async function generateReferenceNumber(prefix: string, modelName: string, idField: string = 'referenceNumber'): Promise<string> {
  const year = new Date().getFullYear();
  const yearPrefix = `${prefix}-${year}-`;
  
  // Find highest existing sequence for this year
  const count = await (prisma as any)[modelName].count({
    where: {
      [idField]: {
        startsWith: yearPrefix,
      },
    },
  });
  
  const seq = String(count + 1).padStart(4, '0');
  const candidate = `${yearPrefix}${seq}`;
  
  // Guard against any collision
  const existing = await (prisma as any)[modelName].findFirst({
    where: { [idField]: candidate },
  });
  if (existing) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${yearPrefix}${String(count + 1).padStart(4, '0')}-${randomSuffix}`;
  }
  return candidate;
}

// ==========================================
// 2. STOCK RULES & INVARIANTS
// ==========================================

export interface StockLevels {
  onHand: number;
  reserved: number;
  available: number;
}

export function calculateAvailableStock(onHand: number, reserved: number): number {
  return Math.max(0, onHand - reserved);
}

export function checkStockSufficiency(onHand: number, reserved: number, requested: number): {
  isSufficient: boolean;
  available: number;
  shortage: number;
} {
  const available = calculateAvailableStock(onHand, reserved);
  if (available >= requested) {
    return { isSufficient: true, available, shortage: 0 };
  }
  return { isSufficient: false, available, shortage: requested - available };
}

// ==========================================
// 3. DELIVERY GATE CHECKER
// ==========================================

export async function canDeliverItem(
  productId: string,
  trackedItemId?: string | null
): Promise<{ allowed: boolean; reason?: string }> {
  const product = await prisma.equipmentProduct.findUnique({
    where: { id: productId },
    include: {
      inspections: {
        orderBy: { inspectionDate: 'desc' },
        take: 1,
      },
    },
  });

  if (!product) {
    return { allowed: false, reason: 'المنتج غير موجود في السجل المركزي' };
  }

  if (!product.isActive) {
    return { allowed: false, reason: 'هذا الصنف موقف عن الخدمة وغير متاح للتسليم' };
  }

  // Inspection Gate: If product requires inspection, must have a passing inspection
  if (product.inspectionRequired) {
    let latestInspection: any = null;
    if (trackedItemId) {
      latestInspection = await prisma.equipmentInspection.findFirst({
        where: { trackedItemId },
        orderBy: { inspectionDate: 'desc' },
      });
    }
    if (!latestInspection) {
      latestInspection = product.inspections[0];
    }

    if (!latestInspection) {
      return {
        allowed: false,
        reason: 'هذا الصنف يتطلب فحصاً معتمداً قبل التسليم، ولم يُجرَ له أي فحص بعد (Delivery Blocked: Pending Inspection)',
      };
    }

    if (latestInspection.result !== InspectionResult.PASS) {
      return {
        allowed: false,
        reason: `تسليم الصنف محظور: آخر فحص مسجل انتهى بنتيجة (${latestInspection.result}). يتطلب التسليم نتيجة PASS صريحة`,
      };
    }
  }

  // Expiry Gate: If item has tracked unit with expiry, check if expired
  if (trackedItemId) {
    const trackedItem = await prisma.trackedEquipmentItem.findUnique({
      where: { id: trackedItemId },
    });
    if (trackedItem) {
      if (trackedItem.status === ItemStatus.QUARANTINE || trackedItem.status === ItemStatus.MAINTENANCE || trackedItem.status === ItemStatus.SCRAPPED) {
        return {
          allowed: false,
          reason: `حالة الوحدة المحددة (${trackedItem.status}) لا تسمح بالتسليم`,
        };
      }
      if (product.expiryTrackingRequired && trackedItem.expiryDate) {
        const now = new Date();
        if (new Date(trackedItem.expiryDate) < now) {
          return {
            allowed: false,
            reason: `تسليم الصنف محظور: تاريخ صلاحية هذه الوحدة منتهٍ (${new Date(trackedItem.expiryDate).toLocaleDateString('ar-EG')})`,
          };
        }
      }
    }
  }

  return { allowed: true };
}

// ==========================================
// 4. ATOMIC DATABASE TRANSACTIONS
// ==========================================

/**
 * Atomic Receiving Transaction:
 * Stock increase = Accepted quantity ONLY.
 * Rejected quantity does NOT increase onHand stock.
 * Creates movement ledger, updates procurement status.
 */
export async function executeReceivingTransaction(params: {
  procurementOrderId: string;
  deliveryNoteNumber?: string | null;
  notes?: string | null;
  actorId: string;
  actorName: string;
  items: Array<{
    productId: string;
    quantityReceived: number;
    quantityAccepted: number;
    quantityRejected: number;
    rejectionReason?: string | null;
    batchNumber?: string | null;
    expiryDate?: string | null;
    serialNumbers?: string[];
    notes?: string | null;
  }>;
}) {
  return await prisma.$transaction(async (tx) => {
    const receivingNumber = await generateReferenceNumber('FACSS-RCV', 'procurementReceiving', 'receivingNumber');

    // 1. Create Receiving Record
    const receiving = await tx.procurementReceiving.create({
      data: {
        receivingNumber,
        procurementOrderId: params.procurementOrderId,
        receivedById: params.actorId,
        deliveryNoteNumber: params.deliveryNoteNumber,
        notes: params.notes,
        items: {
          create: params.items.map((item) => ({
            productId: item.productId,
            quantityReceived: item.quantityReceived,
            quantityAccepted: item.quantityAccepted,
            quantityRejected: item.quantityRejected,
            rejectionReason: item.rejectionReason,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 2. Process each item: update product stock, create movements, create tracked items
    for (let i = 0; i < params.items.length; i++) {
      const itemInput = params.items[i];
      const createdItem = receiving.items[i];

      const product = await tx.equipmentProduct.findUniqueOrThrow({
        where: { id: itemInput.productId },
      });

      const acceptedQty = itemInput.quantityAccepted;

      // Create tracked equipment items if serial numbers or batches are tracked
      if (itemInput.serialNumbers && itemInput.serialNumbers.length > 0) {
        for (const serial of itemInput.serialNumbers) {
          // Check uniqueness per product
          const existingSerial = await tx.trackedEquipmentItem.findUnique({
            where: {
              productId_serialNumber: {
                productId: itemInput.productId,
                serialNumber: serial,
              },
            },
          });
          if (existingSerial) {
            throw new Error(`الرقم التسلسلي (${serial}) مسجل مسبقاً لهذا الصنف`);
          }

          await tx.trackedEquipmentItem.create({
            data: {
              productId: itemInput.productId,
              serialNumber: serial,
              batchNumber: itemInput.batchNumber,
              expiryDate: itemInput.expiryDate ? new Date(itemInput.expiryDate) : null,
              status: ItemStatus.AVAILABLE,
              receivingItemId: createdItem.id,
              notes: itemInput.notes,
            },
          });
        }
      }

      // Stock increase = acceptedQty ONLY
      if (acceptedQty > 0) {
        const beforeQty = product.quantityOnHand;
        const afterQty = beforeQty + acceptedQty;

        await tx.equipmentProduct.update({
          where: { id: itemInput.productId },
          data: {
            quantityOnHand: afterQty,
          },
        });

        // Generate movement number
        const movSeq = await tx.inventoryMovement.count();
        const movNumber = `FACSS-MOV-${new Date().getFullYear()}-${String(movSeq + 1).padStart(4, '0')}`;

        await tx.inventoryMovement.create({
          data: {
            movementNumber: movNumber,
            productId: itemInput.productId,
            movementType: MovementType.RECEIPT,
            quantityBefore: beforeQty,
            quantityDelta: acceptedQty,
            quantityAfter: afterQty,
            referenceType: 'RECEIVING',
            referenceId: receiving.id,
            reason: `استلام شحنة توريد رقم ${receivingNumber} (مقبول: ${acceptedQty}، مرفوض: ${itemInput.quantityRejected})`,
            actorId: params.actorId,
            actorName: params.actorName,
          },
        });
      }

      // Update ProcurementItem received quantity
      const poItem = await tx.procurementItem.findFirst({
        where: {
          procurementOrderId: params.procurementOrderId,
          productId: itemInput.productId,
        },
      });
      if (poItem) {
        await tx.procurementItem.update({
          where: { id: poItem.id },
          data: {
            quantityReceived: poItem.quantityReceived + itemInput.quantityReceived,
          },
        });
      }
    }

    // 3. Update Procurement Order Status
    const poItems = await tx.procurementItem.findMany({
      where: { procurementOrderId: params.procurementOrderId },
    });
    const allCompleted = poItems.every((it) => it.quantityReceived >= it.quantityOrdered);
    const anyReceived = poItems.some((it) => it.quantityReceived > 0);

    const newStatus = allCompleted
      ? ProcurementStatus.RECEIVED
      : anyReceived
      ? ProcurementStatus.PARTIALLY_RECEIVED
      : ProcurementStatus.ORDERED;

    await tx.procurementOrder.update({
      where: { id: params.procurementOrderId },
      data: { status: newStatus },
    });

    return receiving;
  });
}

/**
 * Atomic Manual Adjustment Transaction:
 * Strictly verifies delta, prevents negative stock, logs reason & actor in ledger.
 */
export async function executeAdjustmentTransaction(params: {
  productId: string;
  trackedItemId?: string | null;
  delta: number;
  reason: string;
  actorId: string;
  actorName: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const product = await tx.equipmentProduct.findUniqueOrThrow({
      where: { id: params.productId },
    });

    const beforeQty = product.quantityOnHand;
    const afterQty = beforeQty + params.delta;

    // Strict Negative Stock Protection
    if (afterQty < 0) {
      throw new Error(`عملية التعديل تؤدي إلى رصيد سالب غير مسموح (${afterQty} < 0)`);
    }

    // Strict Available Stock Protection: cannot reduce onHand below reserved
    if (afterQty < product.quantityReserved) {
      throw new Error(
        `لا يمكن إنقاص المخزون إلى أقل من الكميات المحجوزة للعملاء (المطلوب بعد التعديل: ${afterQty}، المحجوز: ${product.quantityReserved})`
      );
    }

    await tx.equipmentProduct.update({
      where: { id: params.productId },
      data: { quantityOnHand: afterQty },
    });

    const movSeq = await tx.inventoryMovement.count();
    const movNumber = `FACSS-MOV-${new Date().getFullYear()}-${String(movSeq + 1).padStart(4, '0')}`;

    const movement = await tx.inventoryMovement.create({
      data: {
        movementNumber: movNumber,
        productId: params.productId,
        trackedItemId: params.trackedItemId,
        movementType: MovementType.ADJUSTMENT,
        quantityBefore: beforeQty,
        quantityDelta: params.delta,
        quantityAfter: afterQty,
        referenceType: 'MANUAL_ADJUSTMENT',
        reason: params.reason,
        actorId: params.actorId,
        actorName: params.actorName,
      },
    });

    return { product, movement };
  });
}

/**
 * Atomic Reservation Transaction:
 * Checks available stock >= requested, increases reserved, decreases available, creates ledger record.
 */
export async function executeReservationTransaction(params: {
  serviceRequestId: string;
  items: Array<{ productId: string; quantityToReserve: number }>;
  actorId: string;
  actorName: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const results = [];

    for (const item of params.items) {
      const product = await tx.equipmentProduct.findUniqueOrThrow({
        where: { id: item.productId },
      });

      const available = calculateAvailableStock(product.quantityOnHand, product.quantityReserved);
      if (available < item.quantityToReserve) {
        throw new Error(
          `المخزون المتاح للصنف (${product.nameAr}) غير كافٍ للحجز (المتاح: ${available}، المطلوب: ${item.quantityToReserve})`
        );
      }

      // Update product reserved
      const newReserved = product.quantityReserved + item.quantityToReserve;
      await tx.equipmentProduct.update({
        where: { id: item.productId },
        data: { quantityReserved: newReserved },
      });

      // Update or create SupplyRequestItem
      let reqItem = await tx.supplyRequestItem.findFirst({
        where: {
          serviceRequestId: params.serviceRequestId,
          productId: item.productId,
        },
      });

      if (reqItem) {
        await tx.supplyRequestItem.update({
          where: { id: reqItem.id },
          data: { quantityReserved: reqItem.quantityReserved + item.quantityToReserve },
        });
      } else {
        reqItem = await tx.supplyRequestItem.create({
          data: {
            serviceRequestId: params.serviceRequestId,
            productId: item.productId,
            quantityRequested: item.quantityToReserve,
            quantityReserved: item.quantityToReserve,
          },
        });
      }

      // Log movement
      const movSeq = await tx.inventoryMovement.count();
      const movNumber = `FACSS-MOV-${new Date().getFullYear()}-${String(movSeq + 1).padStart(4, '0')}`;

      await tx.inventoryMovement.create({
        data: {
          movementNumber: movNumber,
          productId: item.productId,
          movementType: MovementType.RESERVATION,
          quantityBefore: product.quantityOnHand,
          quantityDelta: 0, // On-hand does NOT change
          quantityAfter: product.quantityOnHand,
          referenceType: 'SERVICE_REQUEST',
          referenceId: params.serviceRequestId,
          reason: `حجز كمية ${item.quantityToReserve} لصالح طلب الخدمة (${params.serviceRequestId})`,
          actorId: params.actorId,
          actorName: params.actorName,
        },
      });

      results.push(reqItem);
    }

    await tx.serviceRequest.update({
      where: { id: params.serviceRequestId },
      data: { fulfillmentStatus: SupplyFulfillmentStatus.RESERVED },
    });

    return results;
  });
}

/**
 * Atomic Reservation Release Transaction:
 * Releases previously reserved quantities back to available stock.
 */
export async function executeReleaseReservationTransaction(params: {
  serviceRequestId: string;
  items: Array<{ productId: string; quantityToRelease: number }>;
  actorId: string;
  actorName: string;
}) {
  return await prisma.$transaction(async (tx) => {
    for (const item of params.items) {
      const product = await tx.equipmentProduct.findUniqueOrThrow({
        where: { id: item.productId },
      });

      const releaseQty = Math.min(product.quantityReserved, item.quantityToRelease);
      const newReserved = Math.max(0, product.quantityReserved - releaseQty);

      await tx.equipmentProduct.update({
        where: { id: item.productId },
        data: { quantityReserved: newReserved },
      });

      const reqItem = await tx.supplyRequestItem.findFirst({
        where: {
          serviceRequestId: params.serviceRequestId,
          productId: item.productId,
        },
      });
      if (reqItem) {
        await tx.supplyRequestItem.update({
          where: { id: reqItem.id },
          data: { quantityReserved: Math.max(0, reqItem.quantityReserved - releaseQty) },
        });
      }

      const movSeq = await tx.inventoryMovement.count();
      const movNumber = `FACSS-MOV-${new Date().getFullYear()}-${String(movSeq + 1).padStart(4, '0')}`;

      await tx.inventoryMovement.create({
        data: {
          movementNumber: movNumber,
          productId: item.productId,
          movementType: MovementType.RESERVATION_RELEASE,
          quantityBefore: product.quantityOnHand,
          quantityDelta: 0,
          quantityAfter: product.quantityOnHand,
          referenceType: 'SERVICE_REQUEST',
          referenceId: params.serviceRequestId,
          reason: `تحرير حجز كمية ${releaseQty} لطلب الخدمة (${params.serviceRequestId})`,
          actorId: params.actorId,
          actorName: params.actorName,
        },
      });
    }

    return true;
  });
}

/**
 * Atomic Delivery Transaction:
 * Validates delivery gates (inspection & expiry), decreases reserved & onHand,
 * creates delivery record & movement ledger entries.
 */
export async function executeDeliveryTransaction(params: {
  serviceRequestId: string;
  receivedByName: string;
  receivedByPhone?: string | null;
  receivedByRole?: string | null;
  deliveryLocation?: string | null;
  notes?: string | null;
  actorId: string;
  actorName: string;
  items: Array<{
    productId: string;
    quantity: number;
    trackedItemId?: string | null;
    notes?: string | null;
  }>;
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Delivery Gates & Stock Validation
    for (const item of params.items) {
      const gateCheck = await canDeliverItem(item.productId, item.trackedItemId);
      if (!gateCheck.allowed) {
        throw new Error(gateCheck.reason);
      }

      const product = await tx.equipmentProduct.findUniqueOrThrow({
        where: { id: item.productId },
      });

      if (product.quantityOnHand < item.quantity) {
        throw new Error(
          `المخزون الفعلي للصنف (${product.nameAr}) غير كافٍ للتسليم (المتوفر: ${product.quantityOnHand}، المطلوب: ${item.quantity})`
        );
      }
    }

    // 2. Generate Delivery Number & Record
    const delSeq = await tx.equipmentDelivery.count();
    const deliveryNumber = `FACSS-DEL-${new Date().getFullYear()}-${String(delSeq + 1).padStart(4, '0')}`;

    const delivery = await tx.equipmentDelivery.create({
      data: {
        deliveryNumber,
        serviceRequestId: params.serviceRequestId,
        deliveredById: params.actorId,
        receivedByName: params.receivedByName,
        receivedByPhone: params.receivedByPhone,
        receivedByRole: params.receivedByRole,
        deliveryLocation: params.deliveryLocation,
        notes: params.notes,
        status: DeliveryStatus.DELIVERED,
        items: {
          create: params.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            trackedItemId: item.trackedItemId,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // 3. Process stock deductions and ledger entries
    for (const item of params.items) {
      const product = await tx.equipmentProduct.findUniqueOrThrow({
        where: { id: item.productId },
      });

      const beforeQty = product.quantityOnHand;
      const afterQty = beforeQty - item.quantity;
      const newReserved = Math.max(0, product.quantityReserved - item.quantity);

      await tx.equipmentProduct.update({
        where: { id: item.productId },
        data: {
          quantityOnHand: afterQty,
          quantityReserved: newReserved,
        },
      });

      // Update TrackedEquipmentItem status if specified
      if (item.trackedItemId) {
        await tx.trackedEquipmentItem.update({
          where: { id: item.trackedItemId },
          data: { status: ItemStatus.DELIVERED },
        });
      }

      // Update SupplyRequestItem delivered quantity
      const reqItem = await tx.supplyRequestItem.findFirst({
        where: {
          serviceRequestId: params.serviceRequestId,
          productId: item.productId,
        },
      });
      if (reqItem) {
        await tx.supplyRequestItem.update({
          where: { id: reqItem.id },
          data: {
            quantityDelivered: reqItem.quantityDelivered + item.quantity,
            quantityReserved: Math.max(0, reqItem.quantityReserved - item.quantity),
          },
        });
      }

      // Record movement
      const movSeq = await tx.inventoryMovement.count();
      const movNumber = `FACSS-MOV-${new Date().getFullYear()}-${String(movSeq + 1).padStart(4, '0')}`;

      await tx.inventoryMovement.create({
        data: {
          movementNumber: movNumber,
          productId: item.productId,
          trackedItemId: item.trackedItemId,
          movementType: MovementType.ISSUE_DELIVERY,
          quantityBefore: beforeQty,
          quantityDelta: -item.quantity,
          quantityAfter: afterQty,
          referenceType: 'DELIVERY',
          referenceId: delivery.id,
          reason: `تسليم معدات رسمي للعميل بموجب وثيقة التسليم ${deliveryNumber} (المستلم: ${params.receivedByName})`,
          actorId: params.actorId,
          actorName: params.actorName,
        },
      });
    }

    // 4. Update ServiceRequest fulfillmentStatus
    await tx.serviceRequest.update({
      where: { id: params.serviceRequestId },
      data: {
        fulfillmentStatus: SupplyFulfillmentStatus.DELIVERED,
      },
    });

    return delivery;
  });
}

/**
 * Atomic Return Workflow:
 * Returned items enter QUARANTINE first.
 * Does NOT increase available stock until inspection is passed.
 */
export async function executeReturnTransaction(params: {
  serviceRequestId?: string | null;
  productId: string;
  trackedItemId?: string | null;
  quantity: number;
  reason: string;
  receivedByName: string;
  notes?: string | null;
  actorId: string;
  actorName: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const retSeq = await tx.equipmentReturn.count();
    const returnNumber = `FACSS-RET-${new Date().getFullYear()}-${String(retSeq + 1).padStart(4, '0')}`;

    const returnRecord = await tx.equipmentReturn.create({
      data: {
        returnNumber,
        serviceRequestId: params.serviceRequestId,
        productId: params.productId,
        trackedItemId: params.trackedItemId,
        quantity: params.quantity,
        reason: params.reason,
        receivedByName: params.receivedByName,
        status: ReturnStatus.QUARANTINE, // Entered into Quarantine
        notes: params.notes,
      },
    });

    if (params.trackedItemId) {
      await tx.trackedEquipmentItem.update({
        where: { id: params.trackedItemId },
        data: { status: ItemStatus.QUARANTINE },
      });
    }

    const movSeq = await tx.inventoryMovement.count();
    const movNumber = `FACSS-MOV-${new Date().getFullYear()}-${String(movSeq + 1).padStart(4, '0')}`;

    // Record movement as quarantine return (no stock increase to available yet)
    await tx.inventoryMovement.create({
      data: {
        movementNumber: movNumber,
        productId: params.productId,
        trackedItemId: params.trackedItemId,
        movementType: MovementType.RETURN,
        quantityBefore: 0,
        quantityDelta: 0, // In quarantine, not in available stock
        quantityAfter: 0,
        referenceType: 'RETURN',
        referenceId: returnRecord.id,
        reason: `إرجاع معدات بحالة الحجر المؤقت (Quarantine) في انتظار الفحص الفني: ${params.reason}`,
        actorId: params.actorId,
        actorName: params.actorName,
      },
    });

    return returnRecord;
  });
}

/**
 * Return Restock (After Inspection PASS):
 * Only executed after passing inspection. Adds to onHand stock.
 */
export async function executeReturnRestockTransaction(params: {
  returnId: string;
  actorId: string;
  actorName: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const returnRecord = await tx.equipmentReturn.findUniqueOrThrow({
      where: { id: params.returnId },
    });

    if (returnRecord.status === ReturnStatus.RESTOCKED) {
      throw new Error('تم إعادة هذا الصنف إلى المخزون مسبقاً');
    }

    const product = await tx.equipmentProduct.findUniqueOrThrow({
      where: { id: returnRecord.productId },
    });

    // Check inspection requirement
    if (product.inspectionRequired) {
      const inspection = await tx.equipmentInspection.findFirst({
        where: {
          productId: returnRecord.productId,
          ...(returnRecord.trackedItemId ? { trackedItemId: returnRecord.trackedItemId } : {}),
        },
        orderBy: { inspectionDate: 'desc' },
      });

      if (!inspection || inspection.result !== InspectionResult.PASS) {
        throw new Error('لا يمكن إعادة المعدات المرتجعة إلى المخزون المتاح إلا بعد اجتياز الفحص الفني بنجاح (PASS)');
      }
    }

    const beforeQty = product.quantityOnHand;
    const afterQty = beforeQty + returnRecord.quantity;

    await tx.equipmentProduct.update({
      where: { id: returnRecord.productId },
      data: { quantityOnHand: afterQty },
    });

    await tx.equipmentReturn.update({
      where: { id: returnRecord.id },
      data: { status: ReturnStatus.RESTOCKED },
    });

    if (returnRecord.trackedItemId) {
      await tx.trackedEquipmentItem.update({
        where: { id: returnRecord.trackedItemId },
        data: { status: ItemStatus.AVAILABLE },
      });
    }

    const movSeq = await tx.inventoryMovement.count();
    const movNumber = `FACSS-MOV-${new Date().getFullYear()}-${String(movSeq + 1).padStart(4, '0')}`;

    await tx.inventoryMovement.create({
      data: {
        movementNumber: movNumber,
        productId: returnRecord.productId,
        trackedItemId: returnRecord.trackedItemId,
        movementType: MovementType.RECEIPT,
        quantityBefore: beforeQty,
        quantityDelta: returnRecord.quantity,
        quantityAfter: afterQty,
        referenceType: 'RETURN_RESTOCK',
        referenceId: returnRecord.id,
        reason: `إعادة إدخال المعدات المرتجعة إلى المخزون المتاح بعد اجتياز الفحص الفني بنجاح`,
        actorId: params.actorId,
        actorName: params.actorName,
      },
    });

    return true;
  });
}
