/**
 * CommonJS Companion for lib/equipment-rules.ts
 * Provides direct operational functions for Node.js scripts and automated test suites.
 */

let prismaClient;
function getPrisma() {
  if (!prismaClient) {
    const { PrismaClient } = require('@prisma/client');
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

async function generateReferenceNumber(prefix, modelName, idField = 'referenceNumber') {
  const prisma = getPrisma();
  const year = new Date().getFullYear();
  const yearPrefix = `${prefix}-${year}-`;

  const count = await prisma[modelName].count({
    where: {
      [idField]: {
        startsWith: yearPrefix,
      },
    },
  });

  const seq = String(count + 1).padStart(4, '0');
  const candidate = `${yearPrefix}${seq}`;

  const existing = await prisma[modelName].findFirst({
    where: { [idField]: candidate },
  });
  if (existing) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${yearPrefix}${String(count + 1).padStart(4, '0')}-${randomSuffix}`;
  }
  return candidate;
}

function calculateAvailableStock(onHand, reserved) {
  return Math.max(0, onHand - reserved);
}

function checkStockSufficiency(onHand, reserved, requested) {
  const available = calculateAvailableStock(onHand, reserved);
  if (available >= requested) {
    return { isSufficient: true, available, shortage: 0 };
  }
  return { isSufficient: false, available, shortage: requested - available };
}

async function canDeliverItem(productId, trackedItemId = null) {
  const prisma = getPrisma();
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

  if (product.inspectionRequired) {
    let latestInspection = null;
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

    if (latestInspection.result !== 'PASS') {
      return {
        allowed: false,
        reason: `تسليم الصنف محظور: آخر فحص مسجل انتهى بنتيجة (${latestInspection.result}). يتطلب التسليم نتيجة PASS صريحة`,
      };
    }
  }

  if (trackedItemId) {
    const trackedItem = await prisma.trackedEquipmentItem.findUnique({
      where: { id: trackedItemId },
    });
    if (trackedItem) {
      if (trackedItem.status === 'QUARANTINE' || trackedItem.status === 'MAINTENANCE' || trackedItem.status === 'SCRAPPED') {
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

async function executeReceivingTransaction(params) {
  const prisma = getPrisma();
  return await prisma.$transaction(async (tx) => {
    const receivingNumber = await generateReferenceNumber('FACSS-RCV', 'procurementReceiving', 'receivingNumber');

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

    for (let i = 0; i < params.items.length; i++) {
      const itemInput = params.items[i];
      const createdItem = receiving.items[i];

      const product = await tx.equipmentProduct.findUniqueOrThrow({
        where: { id: itemInput.productId },
      });

      const acceptedQty = itemInput.quantityAccepted;

      if (itemInput.serialNumbers && itemInput.serialNumbers.length > 0) {
        for (const serial of itemInput.serialNumbers) {
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
              status: 'AVAILABLE',
              receivingItemId: createdItem.id,
              notes: itemInput.notes,
            },
          });
        }
      }

      if (acceptedQty > 0) {
        const beforeQty = product.quantityOnHand;
        const afterQty = beforeQty + acceptedQty;

        await tx.equipmentProduct.update({
          where: { id: itemInput.productId },
          data: { quantityOnHand: afterQty },
        });

        const movSeq = await tx.inventoryMovement.count();
        const movNumber = `FACSS-MOV-${new Date().getFullYear()}-${String(movSeq + 1).padStart(4, '0')}`;

        await tx.inventoryMovement.create({
          data: {
            movementNumber: movNumber,
            productId: itemInput.productId,
            movementType: 'RECEIPT',
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

    const poItems = await tx.procurementItem.findMany({
      where: { procurementOrderId: params.procurementOrderId },
    });
    const allCompleted = poItems.every((it) => it.quantityReceived >= it.quantityOrdered);
    const anyReceived = poItems.some((it) => it.quantityReceived > 0);

    const newStatus = allCompleted
      ? 'RECEIVED'
      : anyReceived
      ? 'PARTIALLY_RECEIVED'
      : 'ORDERED';

    await tx.procurementOrder.update({
      where: { id: params.procurementOrderId },
      data: { status: newStatus },
    });

    return receiving;
  });
}

async function executeAdjustmentTransaction(params) {
  const prisma = getPrisma();
  return await prisma.$transaction(async (tx) => {
    const product = await tx.equipmentProduct.findUniqueOrThrow({
      where: { id: params.productId },
    });

    const beforeQty = product.quantityOnHand;
    const afterQty = beforeQty + params.delta;

    if (afterQty < 0) {
      throw new Error(`عملية التعديل تؤدي إلى رصيد سالب غير مسموح (${afterQty} < 0)`);
    }

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
        movementType: 'ADJUSTMENT',
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

async function executeReservationTransaction(params) {
  const prisma = getPrisma();
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

      const newReserved = product.quantityReserved + item.quantityToReserve;
      await tx.equipmentProduct.update({
        where: { id: item.productId },
        data: { quantityReserved: newReserved },
      });

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

      const movSeq = await tx.inventoryMovement.count();
      const movNumber = `FACSS-MOV-${new Date().getFullYear()}-${String(movSeq + 1).padStart(4, '0')}`;

      await tx.inventoryMovement.create({
        data: {
          movementNumber: movNumber,
          productId: item.productId,
          movementType: 'RESERVATION',
          quantityBefore: product.quantityOnHand,
          quantityDelta: 0,
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
      data: { fulfillmentStatus: 'RESERVED' },
    });

    return results;
  });
}

async function executeReleaseReservationTransaction(params) {
  const prisma = getPrisma();
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
          movementType: 'RESERVATION_RELEASE',
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

async function executeDeliveryTransaction(params) {
  const prisma = getPrisma();
  return await prisma.$transaction(async (tx) => {
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
        status: 'DELIVERED',
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

      if (item.trackedItemId) {
        await tx.trackedEquipmentItem.update({
          where: { id: item.trackedItemId },
          data: { status: 'DELIVERED' },
        });
      }

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

      const movSeq = await tx.inventoryMovement.count();
      const movNumber = `FACSS-MOV-${new Date().getFullYear()}-${String(movSeq + 1).padStart(4, '0')}`;

      await tx.inventoryMovement.create({
        data: {
          movementNumber: movNumber,
          productId: item.productId,
          trackedItemId: item.trackedItemId,
          movementType: 'ISSUE_DELIVERY',
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

    await tx.serviceRequest.update({
      where: { id: params.serviceRequestId },
      data: {
        fulfillmentStatus: 'DELIVERED',
      },
    });

    return delivery;
  });
}

async function executeReturnTransaction(params) {
  const prisma = getPrisma();
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
        status: 'QUARANTINE',
        notes: params.notes,
      },
    });

    if (params.trackedItemId) {
      await tx.trackedEquipmentItem.update({
        where: { id: params.trackedItemId },
        data: { status: 'QUARANTINE' },
      });
    }

    const movSeq = await tx.inventoryMovement.count();
    const movNumber = `FACSS-MOV-${new Date().getFullYear()}-${String(movSeq + 1).padStart(4, '0')}`;

    await tx.inventoryMovement.create({
      data: {
        movementNumber: movNumber,
        productId: params.productId,
        trackedItemId: params.trackedItemId,
        movementType: 'RETURN',
        quantityBefore: 0,
        quantityDelta: 0,
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

async function executeReturnRestockTransaction(params) {
  const prisma = getPrisma();
  return await prisma.$transaction(async (tx) => {
    const returnRecord = await tx.equipmentReturn.findUniqueOrThrow({
      where: { id: params.returnId },
    });

    if (returnRecord.status === 'RESTOCKED') {
      throw new Error('تم إعادة هذا الصنف إلى المخزون مسبقاً');
    }

    const product = await tx.equipmentProduct.findUniqueOrThrow({
      where: { id: returnRecord.productId },
    });

    if (product.inspectionRequired) {
      const inspection = await tx.equipmentInspection.findFirst({
        where: {
          productId: returnRecord.productId,
          ...(returnRecord.trackedItemId ? { trackedItemId: returnRecord.trackedItemId } : {}),
        },
        orderBy: { inspectionDate: 'desc' },
      });

      if (!inspection || inspection.result !== 'PASS') {
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
      data: { status: 'RESTOCKED' },
    });

    if (returnRecord.trackedItemId) {
      await tx.trackedEquipmentItem.update({
        where: { id: returnRecord.trackedItemId },
        data: { status: 'AVAILABLE' },
      });
    }

    const movSeq = await tx.inventoryMovement.count();
    const movNumber = `FACSS-MOV-${new Date().getFullYear()}-${String(movSeq + 1).padStart(4, '0')}`;

    await tx.inventoryMovement.create({
      data: {
        movementNumber: movNumber,
        productId: returnRecord.productId,
        trackedItemId: returnRecord.trackedItemId,
        movementType: 'RECEIPT',
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

module.exports = {
  generateReferenceNumber,
  calculateAvailableStock,
  checkStockSufficiency,
  canDeliverItem,
  executeReceivingTransaction,
  executeAdjustmentTransaction,
  executeReservationTransaction,
  executeReleaseReservationTransaction,
  executeDeliveryTransaction,
  executeReturnTransaction,
  executeReturnRestockTransaction,
};
